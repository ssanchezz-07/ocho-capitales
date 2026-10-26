// Ocho Capitales: comprueba que los recorridos publicados son fieles al fondo del plano.
// Recorre cada recorrido cada 3 m y señala:
//   - «edificio»: 6 m o más seguidos dentro de un edificio de OSM (salvo templos, casas hermandad, soportales y el edificio
//     del que sale o al que entra la cofradía);
//   - «fuera de calle»: 12 m o más seguidos a más de 12 m de cualquier vía o plaza de OSM (cruza una manzana).
// Necesita cache/fondo-<ciudad>.json y cache/edificios-<ciudad>.json (tools/itinerarios/fondo-osm.mjs).
// Escribe tools/itinerarios/comprobacion-fondo-<ciudad>.json. Uso: node tools/itinerarios/comprobar-fondo.mjs <ciudad>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(DIR, '..', '..');
const ciudad = process.argv[2]; if (!ciudad) { console.error('Falta la ciudad'); process.exit(1); }
const R = JSON.parse(fs.readFileSync(path.join(RAIZ, 'site', 'data', 'recorridos', ciudad + '.json'), 'utf8'));
const leer = (n) => JSON.parse(fs.readFileSync(path.join(DIR, 'cache', n + '-' + ciudad + '.json'), 'utf8')).elements;
const fondo = leer('fondo'), edif = leer('edificios');
let o = null; const xy = (la, lo) => { if (!o) o = [la, lo, 111320 * Math.cos(la * Math.PI / 180)]; return [(lo - o[1]) * o[2], (o[0] - la) * 110540]; };
// rejilla para buscar cerca
const C = 40, rej = (m) => { const g = new Map(); return { add(x0, y0, x1, y1, v) { for (let a = Math.floor(x0 / C); a <= Math.floor(x1 / C); a++) for (let b = Math.floor(y0 / C); b <= Math.floor(y1 / C); b++) { const k = a + ':' + b; if (!g.has(k)) g.set(k, []); g.get(k).push(v); } }, get(x, y, r = 0) { const out = new Set(); for (let a = Math.floor((x - r) / C); a <= Math.floor((x + r) / C); a++) for (let b = Math.floor((y - r) / C); b <= Math.floor((y + r) / C); b++) for (const v of g.get(a + ':' + b) || []) out.add(v); return out; } }; };
// vías y plazas como segmentos
const segs = rej();
for (const e of fondo) {
  const t = e.tags || {}; if (!e.geometry || !(t.highway || t.place === 'square' || t['area:highway'])) continue;
  const p = e.geometry.filter(Boolean).map((q) => xy(q.lat, q.lon));
  for (let i = 1; i < p.length; i++) { const [a, b] = [p[i - 1], p[i]]; segs.add(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), [a, b]); }
}
const distCalle = (x, y) => { let best = Infinity; for (const [a, b] of segs.get(x, y, 15)) { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, k = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L)); best = Math.min(best, Math.hypot(x - a[0] - dx * k, y - a[1] - dy * k)); } return best; };
// edificios (sin templos, casas hermandad ni soportales)
const LIBRE = /^(church|cathedral|chapel|religious|temple|roof|carport|kiosk|ruins)$/;
const edificios = [], ed = rej();
for (const e of edif) {
  const t = e.tags || {}; if (!e.geometry || !t.building || LIBRE.test(t.building) || t.amenity === 'place_of_worship' || /hermandad|cofrad|iglesia|parroquia|convento|capilla|basilica|catedral/i.test(t.name || '') || (t.layer && +t.layer < 0)) continue;
  const p = e.geometry.filter(Boolean).map((q) => xy(q.lat, q.lon)); if (p.length < 4) continue;
  const bb = [Math.min(...p.map((q) => q[0])), Math.min(...p.map((q) => q[1])), Math.max(...p.map((q) => q[0])), Math.max(...p.map((q) => q[1]))];
  const i = edificios.push({ id: e.id, n: t.name || '', p }) - 1; ed.add(bb[0], bb[1], bb[2], bb[3], i);
}
const dentroDe = (x, y, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; return c; };
const enEdificio = (x, y) => { for (const i of ed.get(x, y)) if (dentroDe(x, y, edificios[i].p)) return i; return -1; };
// dentro de un templo (la estación de penitencia en la catedral, la salida y la entrada) no hay calles: es válido
const templos = [], tp = rej();
for (const e of fondo) { const t = e.tags || {}; if (t.amenity !== 'place_of_worship') continue; for (const g of (e.geometry ? [e.geometry] : (e.members || []).filter((mb) => mb.role !== 'inner' && mb.geometry).map((mb) => mb.geometry))) { const p = g.filter(Boolean).map((q) => xy(q.lat, q.lon)); if (p.length < 4) continue; const i = templos.push(p) - 1; tp.add(Math.min(...p.map((q) => q[0])), Math.min(...p.map((q) => q[1])), Math.max(...p.map((q) => q[0])), Math.max(...p.map((q) => q[1])), i); } }
// los edificios de iglesia descargados junto al recorrido también cuentan como templo (la catedral de Cádiz, por ejemplo)
for (const e of edif) { const t = e.tags || {}; if (!e.geometry || !(/^(church|cathedral|chapel|religious|temple)$/.test(t.building || '') || t.amenity === 'place_of_worship')) continue; const p = e.geometry.filter(Boolean).map((q) => xy(q.lat, q.lon)); if (p.length < 4) continue; const i = templos.push(p) - 1; tp.add(Math.min(...p.map((q) => q[0])), Math.min(...p.map((q) => q[1])), Math.max(...p.map((q) => q[0])), Math.max(...p.map((q) => q[1])), i); }
const enTemplo = (x, y) => { for (const i of tp.get(x, y)) if (dentroDe(x, y, templos[i])) return true; return false; };

const avisos = [];
for (const [slug, h] of [...Object.entries(R.hermandades), ...Object.entries(R.extraordinarias || {}).map(([k, v]) => [v.hermandad || k, v])]) {
  for (const [tramo, pts] of Object.entries(h.tramos)) {
    const l = [], nom = [];
    for (const p of pts) { if (p.lat == null) continue; l.push(xy(p.lat, p.lon)); nom.push(p.lugar || ''); for (const v of p.via || []) { l.push(xy(v[0], v[1])); nom.push(p.lugar || ''); } }
    if (l.length < 2) continue;
    // muestras cada 3 m; las de los 15 m del principio y del final (salida y entrada en su templo) no cuentan
    const M = []; let acum = 0; const total = l.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - l[i][0], q[1] - l[i][1]), 0);
    for (let i = 1; i < l.length; i++) { const [a, b] = [l[i - 1], l[i]], L = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let d = 0; d < L; d += 3) { const s = acum + d; if (s > 15 && s < total - 15) M.push({ x: a[0] + (b[0] - a[0]) * d / L, y: a[1] + (b[1] - a[1]) * d / L, lugar: nom[i - 1] }); } acum += L; }
    let run = [], tipo = null;
    const cierra = () => { if (run.length && ((tipo === 'edificio' && run.length >= 2) || (tipo === 'fuera de calle' && run.length >= 4))) { const m = run[Math.floor(run.length / 2)]; const ll = [o[0] - m.y / 110540, o[1] + m.x / o[2]]; avisos.push({ hermandad: slug, tramo, tipo, metros: run.length * 3, cerca_de: m.lugar, lat: +ll[0].toFixed(6), lon: +ll[1].toFixed(6), edificio: m.e != null && m.e >= 0 ? (edificios[m.e].n || 'way/' + edificios[m.e].id) : undefined }); } run = []; tipo = null; };
    for (const m of M) {
      // un edificio solo es un cruce si no pasa ninguna vía por dentro (los arcos y pasajes como la Puerta de Tierra sí la tienen)
      const dc = distCalle(m.x, m.y), templo = enTemplo(m.x, m.y), e = templo || dc <= 3 ? -1 : enEdificio(m.x, m.y), t = e >= 0 ? 'edificio' : !templo && dc > 12 ? 'fuera de calle' : null;
      if (t !== tipo) cierra(); if (t) { tipo = t; m.e = e; run.push(m); }
    }
    cierra();
  }
}
fs.writeFileSync(path.join(DIR, 'comprobacion-fondo-' + ciudad + '.json'), JSON.stringify(avisos, null, 1));
const herms = new Set(avisos.map((a) => a.hermandad));
const total = Object.keys(R.hermandades).length + Object.keys(R.extraordinarias || {}).length;
console.log(`${ciudad}: ${total - herms.size} de ${total} recorridos sin avisos · ${avisos.filter((a) => a.tipo === 'edificio').length} cruces de edificio · ${avisos.filter((a) => a.tipo === 'fuera de calle').length} tramos fuera de calle (${edificios.length} edificios comprobados)`);
