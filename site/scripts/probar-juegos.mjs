// Batería de los juegos de erCuñao (sin navegador): node scripts/probar-juegos.mjs   (antes: node build.mjs)
// Genera cientos de partidas de cada juego con assets/juegos.js y comprueba cada pregunta CONTRA portal.json, por su cuenta
// (no con los datos del propio juego): que hay una sola respuesta buena, que es cierta y que las opciones no se repiten.
// Opción: --ver  enseña una partida de ejemplo de cada juego.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const F = path.join(DIR, 'dist', 'data', 'juegos.json');
if (!fs.existsSync(F)) { console.error('Falta dist/data/juegos.json: ejecuta antes «node build.mjs».'); process.exit(1); }
const J = JSON.parse(fs.readFileSync(F, 'utf8'));
const PORTAL = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
const HP = Object.fromEntries(PORTAL.hermandades.map((h) => [h.slug, h]));
const CAPN = Object.fromEntries(PORTAL.capitales.map((c) => [c.slug, c.nombre]));
const sb = { module: { exports: {} }, Intl, Date, Math, JSON, Set, Map, RegExp, String, Array, Object, Number, console };
vm.runInNewContext(fs.readFileSync(path.join(DIR, 'assets', 'juegos.js'), 'utf8'), sb, { filename: 'juegos.js' });
const { crearJuegos } = sb.module.exports;
const motor = crearJuegos(J, { base: '/' });

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const sinArt = (s) => norm(s).replace(/\(.*$/, '').replace(/^(el|la|los|las) /, '').trim();
const hhmm = (t) => { const m = /^(\d{1,2})[:.](\d{2})/.exec(t || ''); return m ? m[1].padStart(2, '0') + ':' + m[2] : ''; };
const mins = (t) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); if (!m) return null; const v = +m[1] * 60 + +m[2]; return v < 360 ? v + 1440 : v; };
const porNombre = (n) => PORTAL.hermandades.filter((h) => h.nombre === n);
const imagDe = (h) => (h.titulares || []).map((t) => norm(t.imaginero || ''));
const bandasDe = (h) => { const ac = h.acompanamiento && h.acompanamiento.pasos || []; return new Set((ac.length ? ac.flatMap((p) => p.bandas.map((b) => b.nombre)) : (h.bandas_slugs || []).map((s) => (PORTAL.bandas.find((b) => b.slug === s) || {}).nombre)).filter(Boolean).map(norm)); };
// las marchas dedicadas salen del catálogo unificado (tools/sources/marchas.json), como en la web; solo las de dedicatoria comprobada
const MU = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'tools', 'sources', 'marchas.json'), 'utf8')).marchas;
const MDED = new Map(); MU.forEach((m) => { const d = m.dedicatoria; if (d && d.hermandad && d.estado !== 'sin-verificar') { if (!MDED.has(d.hermandad)) MDED.set(d.hermandad, []); MDED.get(d.hermandad).push([norm(m.titulo), norm(m.autor)]); } });
const marchasDe = (h) => MDED.get(h.slug) || [];
const fundacion = (h) => { const anios = (String(h.fundacion || '').match(/\b1[2-9]\d\d\b|\b20[0-2]\d\b/g) || []).map(Number); const x0 = /^\s*(1[2-9]\d\d|20[0-2]\d)\b/.exec(h.fundacion || ''); const x = x0 && !anios.some((y) => y < +x0[1]) && !/fusi|antecedente|or[ií]gen|reorganiz|refund|primitiv/i.test(h.fundacion) ? x0 : null; return x ? +x[1] : 0; };

// la misma persona o la misma banda con otro nombre («Perfecto Artola» / «Perfecto Artola Prats»; «del Maestro Tejera» / «Maestro Tejera»)
const VAC = new Set('de del la las el los y banda bandas musica municipal agrupacion asociacion cultural musico sociedad filarmonica juvenil cornetas tambores'.split(' '));
const tks = (x) => new Set(norm(x).split(' ').filter((w) => w && !VAC.has(w)));
const sub = (a, b) => [...b].every((w) => a.has(w));
const igual = (a, b) => { const x = tks(a), y = tks(b); if (!x.size || !y.size) return false; if (sub(x, y) || sub(y, x)) return true; const pa = norm(a).split(/ y |,/), pb = norm(b).split(/ y |,/); return pa.some((u) => pb.some((v) => { const U = tks(u), W = tks(v); return U.size && W.size && (sub(U, W) || sub(W, U)); })); };
// jornadas que se solapan (la Madrugá es la noche del jueves al viernes)
const SOLAPA = { 'Jueves Santo y Madrugada': ['Jueves Santo', 'Madrugá', 'Viernes Santo'], 'Madrugá': ['Viernes Santo', 'Jueves Santo', 'Jueves Santo y Madrugada'], 'Viernes Santo': ['Madrugá'], 'Jueves Santo': ['Madrugá', 'Jueves Santo y Madrugada'] };
// colores de un nazareno de juegos.json (para los casi iguales)
const colNaz = (i) => (J.naz[i].match(/#[0-9a-f]{6}/gi) || []).map((c) => [1, 3, 5].map((k) => parseInt(c.substr(k, 2), 16)));
const casiIguales = (a, b) => { const x = colNaz(a), y = colNaz(b); return x.length === y.length && x.every((c, k) => Math.hypot(c[0] - y[k][0], c[1] - y[k][1], c[2] - y[k][2]) < 60); };
// comprobación independiente de cada tipo de pregunta: devuelve el texto del fallo, o null si está bien
function comprueba(p) {
  const buena = p.op[p.ok], malas = p.op.filter((_, i) => i !== p.ok), h = p.h ? HP[p.h] : null;
  if (!p.ordenar && (p.ok < 0 || p.ok >= p.op.length)) return 'sin respuesta buena';
  if (new Set(p.op.map(norm)).size !== p.op.length) return 'opciones repetidas';
  if (/undefined|null|NaN/.test(p.q + p.op.join('') + (p.explica || ''))) return 'texto roto';
  if (p.enlace && !/^\/(hermandad|marcha|imaginero|semana-santa|calendario)\//.test(p.enlace[1])) return 'enlace raro ' + p.enlace[1];
  switch (p.cat) {
    case 'Capitales': if (CAPN[h.ciudad] !== buena) return 'capital'; if (porNombre(h.nombre).length !== 1) return 'nombre repetido'; return null;
    case 'Jornadas': if (malas.some((m) => (SOLAPA[buena] || []).includes(m))) return 'una mala se solapa con la buena'; if (h.dia !== buena || malas.includes(h.dia) || (h.salidas || []).length) return 'jornada'; return null;
    case 'Horarios': if (hhmm(h.hora) !== buena || malas.includes(hhmm(h.hora))) return 'hora'; return null;
    case 'Templos': if (!/tiene su sede/.test(p.q)) return 'pregunta por la salida y no por la sede'; { const VT = new Set('iglesia parroquia parroquial capilla basilica real santa santo san de del la las el los y templo convento monasterio ermita'.split(' ')); const tt = (x) => new Set(norm(x).split(' ').filter((w) => w && !VT.has(w))); const b = tt(buena); if (malas.some((m) => { const x = tt(m); let n = 0; x.forEach((w) => { if (b.has(w)) n++; }); return x.size && b.size && (n === x.size || n === b.size); })) return 'una mala es el mismo templo con otro nombre'; } if (h.sede !== buena || malas.some((m) => norm(m) === norm(h.sede))) return 'sede'; return null;
    case 'Imagineros': { const im = imagDe(h); const aut = norm((h.titulares || []).map((t) => t.autor || '').join(' ')); if (malas.some((m) => aut.includes(norm(m)))) return 'una mala sale en la autoría'; const tq = (h.titulares || []).find((t) => p.q.includes(t.nombre.replace(/,\s*an[oó]nim.*$/i, '').trim())); if (tq && (tq.atrib || /atrib/i.test(tq.autor || ''))) return 'talla atribuida dada como segura'; if (!im.includes(norm(buena))) return 'imaginero no es de ' + h.slug; if (malas.some((m) => im.includes(norm(m)))) return 'otra opción también talló a ' + h.slug; if (!(h.titulares || []).some((t) => p.q.includes(t.nombre.replace(/,\s*an[oó]nim.*$/i, '').trim()))) return 'titular de otra'; return null; }
    case 'Historia': { const hs = p.op.map((n) => PORTAL.hermandades.find((x) => x.nombre === n && CAPN[x.ciudad] && p.q.includes(CAPN[x.ciudad]))); if (hs.some((x) => !x || !fundacion(x))) return 'sin fundación'; const min = Math.min(...hs.map(fundacion)); if (fundacion(hs[p.ok]) !== min || hs.filter((x) => fundacion(x) === min).length !== 1) return 'antigua'; return null; }
    case 'Bandas': { if (malas.some((m) => igual(m, buena) || [...bandasDe(h)].some((x) => igual(x, m)))) return 'la misma banda con otro nombre'; const b = bandasDe(h); if (!b.has(norm(buena))) return 'banda no va con ' + h.slug; if (malas.some((m) => b.has(norm(m)))) return 'otra banda también va'; return null; }
    case 'Marchas': {
      if (/¿Quién compuso/.test(p.q) && malas.some((m) => igual(m, buena))) return 'el mismo compositor con otro nombre';
      if (/¿Quién compuso/.test(p.q)) { const t = norm((/«(.+?)»/.exec(p.q) || [])[1]); const ms = marchasDe(h).filter((x) => x[0] === t); if (!ms.some((x) => x[1] === norm(buena))) return 'compositor'; if (malas.some((m) => ms.some((x) => x[1] === norm(m)))) return 'otro compositor también vale'; return null; }
      if (/dedicada a una cofrad/.test(p.q)) { const t = norm((/«(.+?)»/.exec(p.q) || [])[1]); if (!marchasDe(h).some((x) => x[0] === t) || h.nombre !== buena) return 'dedicatoria'; const otras = PORTAL.hermandades.filter((x) => malas.includes(x.nombre) && x.ciudad === h.ciudad); if (otras.some((x) => marchasDe(x).some((y) => y[0] === t))) return 'otra también la tiene dedicada'; return null; }
      // adivina la marcha: el título bueno está dedicado a h; los otros no
      if (!marchasDe(h).some((x) => x[0] === norm(buena))) return 'título no dedicado a ' + h.slug; if (malas.some((m) => marchasDe(h).some((x) => x[0] === norm(m)))) return 'otro título también está dedicado'; return null;
    }
    case 'Cifras': { const c = PORTAL.capitales.find((x) => p.q.includes(x.nombre)); if (!p.explica.includes(c.cifra.corto)) return 'la explicación no es la cifra oficial'; if (String(c.cifra.n) !== buena) return 'cifra'; return null; }
    case 'Nazarenos': case 'Titulares': case 'Recorridos': { if (h.nombre !== buena) return 'nombre'; const cs = p.op.map((n) => PORTAL.hermandades.filter((x) => x.nombre === n && x.ciudad === h.ciudad)); if (cs.some((l) => l.length !== 1)) return 'opción de otra capital o repetida'; if (p.op.some((n, i) => i !== p.ok && sinArt(n) === sinArt(buena))) return 'dos con el mismo nombre'; if (p.media.k === 'foto' && !p.credito) return 'foto sin crédito'; if (p.media.k === 'foto') { const VN = new Set('de del la las los el y e en con san santa santo nuestra nuestro senor senora jesus maria cristo virgen santisimo santisima hermandad cofradia cofradias real reales'.split(' ')), pal = (n) => sinArt(n).split(' ').filter((w) => w.length >= 3 && !VN.has(w)), ley = ' ' + norm(p.media.leyenda) + ' '; if (pal(buena).some((w) => ley.includes(' ' + w + ' '))) return 'la leyenda de la foto dice la respuesta'; if (p.op.some((o) => o !== buena && pal(o).some((w) => ley.includes(' ' + w + ' ')))) return 'la leyenda nombra una de las opciones'; } if (p.media.k === 'naz') { const nz = p.op.map((n) => (J.h.find((r) => r[1] === n && r[2] === h.ciudad) || [])[10]); if (nz.some((x) => !(x >= 0)) || nz.some((x, i) => i !== p.ok && x === nz[p.ok])) return 'nazareno sin hábito o igual al bueno'; if (nz.some((x, i) => i !== p.ok && casiIguales(x, nz[p.ok]))) return 'un nazareno de las malas se ve casi igual que el bueno'; } return null; }
    case 'Pistas': { if (CAPN[h.ciudad] !== buena) return 'capital'; const cn = Object.values(CAPN).map(norm); if (p.pistas.some((t) => cn.some((c) => norm(t).includes(c)))) return 'una pista dice la capital'; return null; }
    case 'El intruso': {
      const f = PORTAL.hermandades.find((x) => x.slug === p.h);
      if (/Tres son de (.+?) y una no/.test(p.q)) { const c = /Tres son de (.+?) y una no/.exec(p.q)[1]; const hs = p.op.map((n) => porNombre(n)); if (hs.some((l) => l.length !== 1)) return 'nombre repetido'; if (CAPN[hs[p.ok][0].ciudad] === c) return 'la intrusa es de ' + c; if (hs.some((l, i) => i !== p.ok && CAPN[l[0].ciudad] !== c)) return 'otra no es de ' + c; return null; }
      if (/tres salen (.+?) y una no/.test(p.q)) { const c = /^En (.+?), tres/.exec(p.q)[1], d = /tres salen (?:el |la |en las )?(.+?) y una no/.exec(p.q)[1]; const hs = p.op.map((n) => PORTAL.hermandades.filter((x) => x.nombre === n && CAPN[x.ciudad] === c)); if (hs.some((l) => l.length !== 1)) return 'nombre repetido'; if (hs[p.ok][0].dia === d) return 'la intrusa sale ese día'; if ((SOLAPA[hs[p.ok][0].dia] || []).includes(d) || (SOLAPA[d] || []).includes(hs[p.ok][0].dia)) return 'la intrusa sale una jornada que se solapa'; if (hs.some((l, i) => i !== p.ok && l[0].dia !== d)) return 'otra no sale ese día'; return null; }
      if (/Tres son obra de (.+?) y una no/.test(p.q)) { const im = norm(/Tres son obra de (.+?) y una no/.exec(p.q)[1]); const ts = p.op.map((o) => { const [t, resto] = o.split(' · '), mc = /^(.*) \(([^()]+)\)$/.exec(resto), n = porNombre(resto).length === 1 ? resto : mc ? mc[1] : resto, c = porNombre(resto).length === 1 ? null : mc ? mc[2] : null; return { t, h: PORTAL.hermandades.find((x) => x.nombre === n && (!c || CAPN[x.ciudad] === c) && (x.titulares || []).some((y) => y.nombre.replace(/,\s*an[oó]nim.*$/i, '').trim() === t)) }; }); if (ts.some((x) => !x.h)) return 'titular no encontrado'; const de = (x) => norm((x.h.titulares.find((t) => t.nombre.replace(/,\s*an[oó]nim.*$/i, '').trim() === x.t) || {}).imaginero || ''); if (de(ts[p.ok]) === im) return 'la intrusa es suya'; { const aut = norm((ts[p.ok].h.titulares || []).map((t) => t.autor || '').join(' ')), n = im.split(' ').filter((w) => w.length > 2 && !['de', 'del', 'la', 'las', 'los', 'el', 'y'].includes(w)); if (n.length >= 2 && aut.split(' ').includes(n[n.length - 1]) && (aut.split(' ').includes(n[0]) || aut.split(' ').includes(n[n.length - 2]))) return 'el imaginero sale en la autoría de la intrusa'; } if (ts.some((x, i) => i !== p.ok && de(x) !== im)) return 'otra no es suya'; return f ? null : 'sin hermandad'; }
      return 'intruso de tipo desconocido';
    }
    case '¿Quién va antes?': { const hs = p.op.map((n) => PORTAL.hermandades.filter((x) => x.nombre === n && p.q.includes(CAPN[x.ciudad]))); if (hs.some((l) => l.length !== 1)) return 'nombre repetido'; const v = p.solucion.map((i) => mins(hhmm(hs[i][0].hora))); for (let i = 1; i < v.length; i++) if (!(v[i] > v[i - 1])) return 'orden'; return null; }
  }
  return 'categoría sin comprobar: ' + p.cat;
}

let ok = 0; const fallos = new Map(), cuenta = new Map();
const CAPS = [''].concat(J.caps.map((c) => c[0]));
for (const juego of Object.keys(motor.JUEGOS)) {
  for (let s = 1; s <= 160; s++) {
    const f = { c: CAPS[s % CAPS.length], nivel: ['mezcla', 'facil', 'media', 'cofrade'][s % 4], modo: ['mezcla', 'naz', 'foto', 'ruta'][s % 4] };
    const ps = motor.partida(juego, s * 7919, f);
    if (!ps.length && f.c === '') { fallos.set(juego + ': partida vacía', (fallos.get(juego + ': partida vacía') || 0) + 1); continue; }
    for (const p of ps) {
      cuenta.set(juego + ' · ' + p.cat, (cuenta.get(juego + ' · ' + p.cat) || 0) + 1);
      const e = comprueba(p);
      if (e) { const k = juego + ' · ' + p.cat + ': ' + e; if (!fallos.has(k)) fallos.set(k, { n: 0, ej: p.q + ' → ' + p.op.join(' | ') + ' [' + (p.ordenar ? p.solucion.join(',') : p.ok) + ']' }); fallos.get(k).n++; }
      else ok++;
    }
  }
}
// todas las fotos: en cada capital, muchas partidas de «¿Qué hermandad es?» con foto, para que ninguna leyenda dé la respuesta
for (const [c] of J.caps) for (let s = 1; s <= 120; s++) for (const p of motor.partida('adivina', s * 104729, { c, modo: 'foto' })) {
  cuenta.set('adivina (todas las fotos) · ' + p.cat, (cuenta.get('adivina (todas las fotos) · ' + p.cat) || 0) + 1);
  const e = comprueba(p);
  if (e) { const k = 'adivina (todas las fotos) · ' + p.cat + ': ' + e; if (!fallos.has(k)) fallos.set(k, { n: 0, ej: p.q + ' → ' + p.op.join(' | ') + ' [' + p.ok + '] · ' + (p.media && p.media.leyenda) }); fallos.get(k).n++; }
  else ok++;
}
// el reto diario: el mismo para todos el mismo día, distinto al siguiente
const r1 = motor.partida('reto', motor.semillaDia('2026-11-08')), r2 = motor.partida('reto', motor.semillaDia('2026-11-08')), r3 = motor.partida('reto', motor.semillaDia('2026-11-09'));
if (JSON.stringify(r1) !== JSON.stringify(r2)) fallos.set('reto: no es el mismo con la misma fecha', { n: 1, ej: '' });
if (JSON.stringify(r1) === JSON.stringify(r3)) fallos.set('reto: se repite al día siguiente', { n: 1, ej: '' });
if (r1.length !== 5) fallos.set('reto: no tiene 5 preguntas', { n: 1, ej: String(r1.length) });

// sopa de letras: cada palabra es el nombre de una cofradía de esa capital y está una sola vez en la sopa
for (let s = 1; s <= 200; s++) { const c = J.caps[s % 8][0], x = motor.sopa(s * 31, { c }); if (!x) { fallos.set('sopa: no sale en ' + c, { n: 1, ej: '' }); continue; }
  for (const p of x.palabras) { const h = HP[p.s]; if (!h || h.ciudad !== c || sinArt(h.nombre).toUpperCase().replace(/[^A-Z]/g, '') !== p.w) fallos.set('sopa: palabra que no es una cofradía de ' + c + ': ' + p.w, { n: 1, ej: '' }); else if (motor.contarEn(x.grid.map((f) => f.split('')), p.w) !== 1) fallos.set('sopa: ' + p.w + ' no está una sola vez', { n: 1, ej: '' }); else ok++; } }
if (process.argv.includes('--ver')) for (const juego of Object.keys(motor.JUEGOS)) { console.log('\n== ' + juego); motor.partida(juego, 12345).forEach((p) => console.log('· ' + p.q + (p.pistas ? '\n    ' + p.pistas.join('\n    ') : '') + '\n    ' + p.op.map((o, i) => (i === p.ok ? '[' + o + ']' : o)).join(' | ') + '\n    ' + p.explica)); }
console.log('Preguntas por juego y tipo:'); [...cuenta.entries()].sort().forEach(([k, n]) => console.log('  ' + k + ': ' + n));
if (fallos.size) { console.log('\nFALLOS:'); for (const [k, v] of fallos) console.log('✗ ' + k + ' (' + (v.n || v) + ')' + (v.ej ? '\n    ej.: ' + v.ej : '')); }
console.log(`\n${ok} preguntas comprobadas contra portal.json, ${[...fallos.values()].reduce((a, v) => a + (v.n || v), 0)} con fallo.`);
process.exit(fallos.size ? 1 : 0);
