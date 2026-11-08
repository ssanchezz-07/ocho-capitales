// erCuñao «experto en todo»: batería generada a partir de los datos de la web (portal.json, recorridos, catálogo de marchas…).
// Para cada hermandad, titular, imaginero, marcha, capital y extraordinaria hace preguntas de todos los tipos, con faltas de ortografía,
// sinónimos cofrades y habla andaluza, se las pasa al motor de erCuñao (assets/cunao.js) y comprueba que la respuesta trae el dato
// (sacado de los datos, no del motor) y el enlace a su ficha. Lo que no cuadra se guarda como «dudosa» para una revisión aparte.
//   node scripts/bateria-experto.mjs [--n 3] [--semilla 7] [--salida ruta.json] [--ver]
// --n: preguntas por hermandad y tipo (variantes de escritura). Sale con error si hay más dudosas de las que admite --tope (por defecto 0).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(DIR, 'dist', 'data');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const MUESTRA = +arg('--muestra', 0), bien = [];
const N = +arg('--n', 2), SEM = +arg('--semilla', 7), SALIDA = arg('--salida', ''), TOPE = +arg('--tope', 0), VER = process.argv.includes('--ver');
const D = JSON.parse(fs.readFileSync(path.join(DIST, 'cunao.json'), 'utf8'));
const trozo = (k) => JSON.parse(fs.readFileSync(path.join(DIST, 'cunao', k + '.json'), 'utf8'));
const PORTAL = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
const MU = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'tools', 'sources', 'marchas.json'), 'utf8')).marchas;
const CAPN = Object.fromEntries(PORTAL.capitales.map((c) => [c.slug, c.nombre]));
const sb = { module: { exports: {} }, Intl, Date, Math, JSON, Set, Map, RegExp, String, Array, Object, Number, console };
vm.runInNewContext(fs.readFileSync(path.join(DIR, 'assets', 'cunao.js'), 'utf8'), sb, { filename: 'cunao.js' });
const { crearMotor } = sb.module.exports;
const HOY = D.hoy || new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date()); // la fecha del build: los datos se recortan por ella
const motor = (pagina) => crearMotor(D, { base: '/', azar: (l) => l[0], pagina: () => pagina || null, hoy: (mas) => { const d = new Date(HOY + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + (mas || 0)); return d.toISOString().slice(0, 10); }, horaAhora: () => 18 });
function pregunta(m, q) { let r = m.responder(q), n = 0; while (r.necesita && n++ < 6) { r.necesita.forEach((k) => m.cargarDatos(k, trozo(k))); r = m.responder(q); } return r; }

// ---- azar con semilla ----
let s_ = SEM >>> 0; const rnd = () => { s_ = (s_ + 0x6d2b79f5) | 0; let t = Math.imul(s_ ^ (s_ >>> 15), 1 | s_); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (l) => l[Math.floor(rnd() * l.length)];
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\bde el\b/g, 'del').replace(/\ba el\b/g, 'al');
const hhmm = (t) => { const x = /^(\d{1,2})[:.](\d{2})/.exec(t || ''); return x ? x[1].padStart(2, '0') + ':' + x[2] : ''; };

// ---- cómo escribe la gente: sin tildes, con faltas, en andaluz, con sinónimos ----
const ESTILOS = {
  normal: (t) => t,
  sinTildes: (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿?¡!]/g, '').toLowerCase(),
  andaluz: (t) => t.toLowerCase().replace(/[¿?]/g, '').replace(/\bdónde\b|\bdonde\b/g, 'ande').replace(/\bqué hora\b|\bque hora\b/g, 'q ora').replace(/\bel\b/g, 'er').replace(/\bal\b/g, 'ar').replace(/ll/g, 'y').replace(/z(?=[aou])/g, 's').replace(/ce/g, 'se').replace(/ado\b/g, 'ao').replace(/\bpara\b/g, 'pa'),
  errata: (t) => t.replace(/\b([a-záéíóúñ]{7,})\b/i, (w) => { const i = 2 + Math.floor(rnd() * (w.length - 4)); return w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2); }),
  movil: (t) => t.toLowerCase().replace(/[¿?]/g, '').replace(/\bqué\b|\bque\b/g, 'q').replace(/\bpor\b/g, 'x').replace(/\bde\b/g, 'd'),
};
const estilos = Object.keys(ESTILOS);

// ---- plantillas por tipo: [texto, comprobación] ----
const H = PORTAL.hermandades;
const R = {}; for (const c of PORTAL.capitales) { const f = path.join(DIST, 'cunao', c.slug + '.json'); if (fs.existsSync(f)) R[c.slug] = JSON.parse(fs.readFileSync(f, 'utf8')); }
const nombreDe = (h) => h.nombre.replace(/\s*\(.*?\)\s*/g, ' ').replace(/«.*?»/g, '').trim();
const casos = [];
const caso = (tipo, q, esperado, enlace, pagina) => casos.push({ tipo, q, esperado, enlace, pagina });
for (const h of H) {
  const c = CAPN[h.ciudad], n = nombreDe(h), ficha = '/hermandad/' + h.slug + '/';
  const de = (x) => x + ' de ' + c;
  if (hhmm(h.hora)) caso('hora', pick(['¿A qué hora sale ' + de(n) + '?', 'hora de salida de ' + de(n), '¿Cuándo sale ' + de(n) + '?']), [hhmm(h.hora)], ficha);
  caso('dia', pick(['¿Qué día sale ' + de(n) + '?', '¿Qué día procesiona ' + de(n) + '?']), [h.dia === 'Jueves Santo y Madrugada' ? 'Jueves Santo (y la Madrugada)' : h.dia], ficha);
  if (h.sede) caso('sede', pick(['¿Cuál es la sede de ' + de(n) + '?', '¿De qué templo sale ' + de(n) + '?']), [h.sede.split(/[(,]/)[0].trim()], ficha);
  for (const t of (h.titulares || []).slice(0, 2)) if (t.imaginero) caso('autor', '¿Quién talló a ' + t.nombre.split(',')[0] + ' de ' + de(n) + '?', [t.imaginero], ficha);
  const ac = h.acompanamiento && h.acompanamiento.pasos || [];
  const hb = D.hermandades.find((x) => x.s === h.slug);
  if (hb && hb.b && hb.b.length && hb.b[0][1].length) caso('banda', pick(['¿Qué banda lleva ' + de(n) + '?', '¿Qué música lleva ' + de(n) + '?']), [D.B[hb.b[0][1][0]][1]], ficha);
  const RR = R[h.ciudad] && R[h.ciudad].r[h.slug];
  if (RR) {
    caso('recorrido', pick(['¿Por dónde pasa ' + de(n) + '?', 'recorrido de ' + de(n), 'itinerario de ' + de(n)]), ['Recorrido'], '/en-la-calle/' + h.ciudad + '/');
    const p = RR.p.filter((x, i) => i > 0 && i < RR.p.length - 1 && x[1] && x[2] && x[1].length > 5 && !/carrera|tribuna|catedral|campana|^salida|^entrada|^recogida|estaci[oó]n|s\.i\.c/i.test(x[1]));
    if (p.length) { const x = pick(p); caso('pasapor', '¿A qué hora pasa ' + de(n) + ' por ' + x[1] + '?', [x[0]], '/en-la-calle/' + h.ciudad + '/'); }
  }
  if (h.hora_carrera) caso('carrera', '¿A qué hora llega ' + de(n) + ' a la carrera oficial?', [hhmm(h.hora_carrera)], ficha);
  if (h.fundacion && /\d{4}/.test(h.fundacion)) caso('historia', pick(['historia de ' + de(n), '¿Cuándo se fundó ' + de(n) + '?']), [/\d{4}/.exec(h.fundacion)[0]], ficha);
  if (h.web) caso('web', '¿Cuál es la web de ' + de(n) + '?', [], ficha);
  caso('titulares', '¿Cuáles son los titulares de ' + de(n) + '?', [(h.titulares || [])[0] ? h.titulares[0].nombre.split(',')[0].trim() : ''].filter(Boolean), ficha);
}
for (const c of PORTAL.capitales) {
  caso('cuantas', pick(['¿Cuántas hermandades tiene ' + c.nombre + '?', '¿Cuántas cofradías salen en ' + c.nombre + '?']), [c.cifra.corto], '/semana-santa/' + c.slug + '/');
  for (const d of [...new Set(H.filter((h) => h.ciudad === c.slug).map((h) => h.dia))]) {
    const k = H.filter((h) => h.ciudad === c.slug && h.dia === d).length + H.filter((h) => h.ciudad === c.slug).reduce((a, h) => a + (h.salidas || []).filter((x) => x.dia === d).length, 0);
    caso('jornada', '¿Qué sale el ' + d + ' en ' + c.nombre + '?', [k === 1 ? '1 cofradía' : k + ' cofradías'], '/hermandad/');
  }
}
for (const i of PORTAL.imagineros || []) caso('imaginero', pick(['¿Quién es ' + i.nombre + '?', '¿Qué obras tiene ' + i.nombre + '?']), [i.nombre], '/imaginero/' + i.slug + '/');
// marchas con título único en el catálogo
const veces = new Map(); MU.forEach((m) => veces.set(norm(m.titulo), (veces.get(norm(m.titulo)) || 0) + 1));
const unicas = MU.filter((m) => m.autor && veces.get(norm(m.titulo)) === 1 && norm(m.titulo).split(' ').length >= 2);
for (let k = 0; k < 150 && unicas.length; k++) { const m = pick(unicas); caso('marcha', pick(['¿Quién compuso «' + m.titulo + '»?', '¿De quién es la marcha ' + m.titulo + '?']), [m.autor.split(/ y |,/)[0].trim()], '/marcha/' + m.slug + '/'); }
// extraordinarias de los próximos días
for (const x of (D.ex || []).filter((x) => x[0] >= HOY)) caso('extraordinaria', '¿Qué sale el ' + new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', day: 'numeric', month: 'long' }).format(new Date(x[0] + 'T00:00:00Z')) + '?', [x[3]], '/en-la-calle/' + x[2] + '/');

// ---- pasar la batería ----
const dudosas = []; let ok = 0; const porTipo = {};
for (const k of casos) {
  for (let v = 0; v < N; v++) {
    const est = v === 0 ? 'normal' : pick(estilos), q = ESTILOS[est](k.q);
    const r = pregunta(motor(k.pagina), q);
    const t = norm([r.texto, ...r.enlaces.map((e) => e.join(' '))].join(' '));
    const falta = k.esperado.filter((x) => !t.includes(norm(x)));
    const sinEnlace = k.enlace && !r.enlaces.some((e) => e[1].startsWith(k.enlace) || (k.enlace === '/hermandad/' && /^\/hermandad\//.test(e[1])));
    const pt = (porTipo[k.tipo] ||= { ok: 0, mal: 0 });
    if (falta.length || sinEnlace || r.nose) { pt.mal++; dudosas.push({ tipo: k.tipo, estilo: est, q, esperado: k.esperado, enlace: k.enlace, falta, sinEnlace: !!sinEnlace, respuesta: r.texto.slice(0, 500), enlaces: r.enlaces.slice(0, 4) }); }
    else { pt.ok++; ok++; if (rnd() < MUESTRA) bien.push({ tipo: k.tipo, estilo: est, q, esperado: k.esperado, respuesta: r.texto.slice(0, 600), enlaces: r.enlaces.slice(0, 4) }); }
  }
}
console.log('Tipo · bien · dudosas');
for (const [k, v] of Object.entries(porTipo).sort()) console.log('  ' + k.padEnd(15) + String(v.ok).padStart(5) + String(v.mal).padStart(6));
if (VER) dudosas.slice(0, 40).forEach((d) => console.log('\n✗ [' + d.tipo + '/' + d.estilo + '] ' + d.q + '\n  esperaba: ' + d.esperado.join(' | ') + (d.sinEnlace ? ' + enlace ' + d.enlace : '') + '\n  R: ' + d.respuesta.replace(/\n/g, ' ¦ ').slice(0, 300)));
if (SALIDA) { fs.writeFileSync(SALIDA, JSON.stringify(dudosas, null, 1)); if (MUESTRA) fs.writeFileSync(SALIDA.replace(/.json$/, '') + '-bien.json', JSON.stringify(bien, null, 1)); }
console.log(`\n${ok} bien, ${dudosas.length} dudosas (de ${ok + dudosas.length}).`);
process.exit(dudosas.length > TOPE ? 1 : 0);
