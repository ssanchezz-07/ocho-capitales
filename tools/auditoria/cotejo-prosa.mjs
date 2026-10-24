// Ocho Capitales · auditoría: cotejo calle a calle de cada recorrido con el itinerario oficial EN PROSA
// (Málaga: «Horarios_ACC_SS_2026», bloques «Itinerario| calle, calle, …» de la Agrupación de Cofradías).
// Para cada calle oficial busca su trazado en OpenStreetMap (caché de geocodificar.mjs) y mira si la línea que pinta
// el plano pasa a menos de 35 m. Da: calles oficiales cubiertas / no cubiertas / sin trazado en OSM, y orden.
// Uso: node tools/auditoria/cotejo-prosa.mjs   → auditoria/cotejo-malaga.json + resumen por pantalla
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const J = (p) => JSON.parse(fs.readFileSync(path.join(RAIZ, p), 'utf8'));
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const TIPO = /^(calle|plaza|plazuela|avenida|paseo|puente|cuesta|glorieta|callejon|ronda|carrera|camino|pasaje|pasillo|travesia|alameda|muelle|explanada)\s+/;
const nucleo = (s) => norm(s).replace(TIPO, '').replace(/^(de|del|de la|de los|de las)\s+/, '').trim();
const m = (a, b) => { const kx = 111320 * Math.cos(((a[0] + b[0]) / 2) * Math.PI / 180); return Math.hypot((a[1] - b[1]) * kx, (a[0] - b[0]) * 110540); };
const STOP = new Set(['real', 'cofradia', 'cofradias', 'hermandad', 'hermandades', 'archicofradia', 'congregacion', 'pontificia', 'ilustre', 'venerable', 'nuestro', 'nuestra', 'padre', 'senora', 'senor', 'santisimo', 'santisima', 'maria', 'jesus', 'cristo', 'iglesia', 'parroquia', 'capilla', 'casa', 'centro', 'nazarenos', 'penitencia', 'san', 'santa', 'del', 'los', 'las', 'sus', 'virgen']);
const toks = (s) => new Set(norm(s).split(' ').filter((w) => w.length >= 4 && !STOP.has(w)));
// puntos especiales del texto oficial que no son calles
const ESPECIAL = /^(casa hermandad|salida|entrada|encierro|recogida|tribuna|estacion de penitencia|s i c b|iglesia|parroquia|capilla|santa iglesia|interior|templo|patio de los naranjos)/;

const ciudad = process.argv[2] || 'malaga';
const FICH = { malaga: 'Málaga-Horarios_ACC_SS_2026.txt', cadiz: 'Cádiz-CADIZ 26.txt' };
const txt = fs.readFileSync(path.join(RAIZ, 'Itinerarios Semana Santa/texto', FICH[ciudad]), 'utf8');
let lin = txt.split(/\r?\n/);
const bloques = []; let diaAct = "";
// Cádiz: sección «ITINERARIOS» a dos columnas (corte hacia el carácter 70): se lee columna izquierda y luego derecha
// de cada página, y cada bloque es «NOMBRE EN MAYÚSCULAS» + «Itinerario: …».
if (ciudad === 'cadiz') {
  const ini = lin.findIndex((l) => /ITINERARIOS/.test(l));
  const paginas = lin.slice(ini).join('\n').split('\f').map((p) => p.split('\n'));
  const flujo = [];
  for (const pg of paginas) {
    const izq = [], der = [];
    for (const l of pg) { const mm = /^(.*?\S)?(\s{3,})(\S.*)$/.exec(l); if (mm && mm[1] && (mm[1].length + mm[2].length) >= 60) { izq.push(mm[1]); der.push(mm[3]); } else if (mm && !mm[1] && mm[2].length >= 60) { izq.push(''); der.push(mm[3]); } else { izq.push(l); der.push(''); } }
    flujo.push(...izq, '', ...der, '');
  }
  const DIAS = /^(VIERNES DE DOLORES|S.BADO DE PASI.N|DOMINGO DE RAMOS|LUNES SANTO|MARTES SANTO|MI.RCOLES SANTO|JUEVES SANTO|MADRUGADA|VIERNES SANTO|S.BADO SANTO|DOMINGO DE RESURRECCI.N)$/;
  let cab = '', buf = null;
  const cierra = () => { if (buf) { const calles = buf.replace(/-\s+/g, '').replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').split(/,\s*/).map((s) => s.trim().replace(/\.$/, '')).filter(Boolean); bloques.push({ cab, alias: '', calles, dia: diaAct }); buf = null; } };
  for (const l0 of flujo) {
    const l = l0.trim();
    if (DIAS.test(l)) { cierra(); diaAct = l; continue; }
    if (/^Itinerario:/.test(l)) { cierra(); buf = l.replace(/^Itinerario:\s*/, ''); continue; }
    if (buf != null) { if (!l || /^[A-ZÁÉÍÓÚÑ .,“”"+-]{4,}$/.test(l)) { cierra(); if (l) cab = l; } else buf += ' ' + l; continue; }
    if (/^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ .,“”"+-]{3,}$/.test(l) && !/ITINERARIOS/.test(l)) cab = l;
  }
  cierra();
  const D2 = { 'VIERNES DE DOLORES': 'Viernes de Dolores', 'SÁBADO DE PASIÓN': 'Sábado de Pasión', 'DOMINGO DE RAMOS': 'Domingo de Ramos', 'LUNES SANTO': 'Lunes Santo', 'MARTES SANTO': 'Martes Santo', 'MIÉRCOLES SANTO': 'Miércoles Santo', 'JUEVES SANTO': 'Jueves Santo y Madrugada', 'MADRUGADA': 'Jueves Santo y Madrugada', 'VIERNES SANTO': 'Viernes Santo', 'SÁBADO SANTO': 'Sábado Santo', 'DOMINGO DE RESURRECCIÓN': 'Domingo de Resurrección' };
  const D2n = Object.fromEntries(Object.entries(D2).map(([k, v]) => [norm(k), v]));
  for (const b of bloques) b.dia = D2n[norm(b.dia)] || b.dia;
  lin = [];
}
for (let i = 0; i < lin.length; i++) {
  const dl = lin[i].trim().split(/\s{4,}/)[0].replace(/\s+/g, ' ');
  if (/^(Domingo de Ramos|Lunes Santo|Martes Santo|Mi.rcoles Santo|Jueves Santo|Viernes Santo|Domingo de Resurrecci.n)$/i.test(dl)) { diaAct = dl.replace(/^Mi.rcoles/i, 'Miércoles').replace(/Resurrecci.n/i, 'Resurrección'); continue; }
  if (!/^Itinerario\s*\|/.test(lin[i])) continue;
  // cabecera: líneas no vacías anteriores hasta la línea en blanco previa a ellas
  let j = i - 1; while (j >= 0 && !lin[j].trim()) j--; const fin = j; while (j >= 0 && lin[j].trim()) j--;
  const cab = lin.slice(j + 1, fin + 1).map((l) => l.replace(/\s{3,}.*$/, '')).join(' ');
  let k = i, cuerpo = []; while (k < lin.length && lin[k].trim()) { cuerpo.push(lin[k]); k++; }
  const calles = cuerpo.join(' ').replace(/^Itinerario\s*\|\s*/, '').replace(/\s+/g, ' ').split(/,\s*|\s+y\s+(?=[A-ZÁÉÍÓÚ])/).map((s) => s.trim().replace(/\.$/, '')).filter(Boolean);
  const alias = (cab.match(/\(([^)]+)\)/) || [])[1] || '';
  bloques.push({ cab: cab.trim(), alias, calles, dia: diaAct });
}
const P = J('portal-cofrade/data/portal.json');
const HS = P.hermandades.filter((h) => h.ciudad === ciudad);
const R = J(`site/data/recorridos/${ciudad}.json`);
const osm = J(`tools/itinerarios/cache/osm-${ciudad}.json`);
const calles = new Map();
for (const e of osm.elements) {
  const t = e.tags || {}; if (!e.geometry || t.amenity) continue; const g = e.geometry.map((p) => [p.lat, p.lon]);
  for (const nm of [t.name, t.alt_name, t.old_name, t.official_name].filter(Boolean)) for (const k of new Set([norm(nm), nucleo(nm)])) if (k) (calles.get(k) || calles.set(k, []).get(k)).push(g);
}
// emparejar bloque ↔ hermandad: alias entre paréntesis o palabras del nombre oficial
const usados = new Set(); const res = [];
for (const b of bloques) {
  const tb = toks(b.cab + ' ' + b.alias);
  let best = null, bs = 0, otroDia = false;
  const puntua = (lista) => { let bb = null, ss = 0; for (const h of lista) { const th = new Set([...toks(h.nombre), ...toks(h.nombre_oficial)]); let s = 0; for (const w of th) if (tb.has(w)) s++; if (b.alias && norm(h.nombre).includes(norm(b.alias))) s += 5; if (s > ss) { ss = s; bb = h; } } return [bb, ss]; };
  [best, bs] = puntua(HS.filter((x) => !b.dia || x.dia === b.dia || (/Jueves/.test(b.dia) && /Jueves/.test(x.dia))));
  if (!best || bs < 1) { [best, bs] = puntua(HS.filter((x) => !usados.has(x.slug))); otroDia = !!best; if (bs < 1) best = null; }
  if (!best) { res.push({ bloque: b.cab.slice(0, 80), dia: b.dia, estado: 'sin emparejar (no está en el portal o con otro nombre)' }); continue; }
  if (otroDia) console.log(`! ${best.slug}: la fuente lo pone en «${b.dia}» y el portal en «${best.dia}»`);
  const r = R.hermandades[best.slug];
  if (!r) { res.push({ slug: best.slug, bloque: b.cab.slice(0, 80), estado: 'sin recorrido en el plano', oficiales: b.calles.length }); continue; }
  usados.add(best.slug);
  const linea = []; for (const pts of Object.values(r.tramos)) for (const p of pts) { if (p.lat != null) linea.push([p.lat, p.lon]); for (const v of p.via || []) linea.push(v); }
  const cub = [], nocub = [], sinosm = [], esp = [];
  for (const c of b.calles) {
    const k = nucleo(c); if (ESPECIAL.test(norm(c)) || !k) { esp.push(c); continue; }
    const gs = calles.get(k) || calles.get(norm(c)); if (!gs) { sinosm.push(c); continue; }
    let d = Infinity; for (const g of gs) for (const q of g) for (const p of linea) { const x = m(q, p); if (x < d) d = x; }
    (d <= 35 ? cub : nocub).push(d <= 35 ? c : `${c} (${Math.round(d)} m)`);
  }
  const pct = cub.length / Math.max(1, cub.length + nocub.length);
  res.push({ slug: best.slug, dia: r.dia, oficiales: b.calles.length, cubiertas: cub.length, no_cubiertas: nocub, sin_osm: sinosm, pct: Math.round(pct * 100), estado: pct >= 0.9 ? 'coincide' : pct >= 0.7 ? 'parcial' : 'no coincide' });
}
const sinBloque = Object.keys(R.hermandades).filter((s) => !usados.has(s));
fs.mkdirSync(path.join(RAIZ, 'auditoria'), { recursive: true });
fs.writeFileSync(path.join(RAIZ, 'auditoria', `cotejo-${ciudad}.json`), JSON.stringify({ res, sinBloque }, null, 1));
const c = {}; for (const r of res) c[r.estado] = (c[r.estado] || 0) + 1;
console.log(bloques.length, 'bloques oficiales;', c, '; recorridos sin bloque oficial:', sinBloque.length);
for (const r of res.filter((x) => x.estado !== 'coincide')) console.log(`- ${r.slug || r.bloque} [${r.estado}${r.pct != null ? ' ' + r.pct + ' %' : ''}] faltan: ${(r.no_cubiertas || []).join(', ')}${r.sin_osm && r.sin_osm.length ? ' · sin OSM: ' + r.sin_osm.join(', ') : ''}`);
console.log('sin bloque:', sinBloque.join(', '));
