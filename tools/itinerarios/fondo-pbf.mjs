// Ocho Capitales: fondo del plano desde EL MISMO extracto de OSM con el que GraphHopper traza los recorridos, para que fondo y
// recorridos coincidan al metro. Lee el .pbf (solo lectura: lo usa el servidor de GraphHopper) con un lector propio, sin
// dependencias, y escribe en cache/ (fuera de git) el mismo formato que daba Overpass (tools/itinerarios/fondo-osm.mjs):
//   cache/fondo-<ciudad>.json      vías, plazas, agua, ríos, costa, playas, parques, templos y casas hermandad (recuadro de los recorridos)
//   cache/edificios-<ciudad>.json  edificios a menos de 40 m de algún recorrido (para comprobar-fondo.mjs)
// © colaboradores de OpenStreetMap (ODbL). Uso: node tools/itinerarios/fondo-pbf.mjs [ruta.pbf] malaga cordoba cadiz
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(DIR, '..', '..');
let args = process.argv.slice(2);
const PBF = args[0] && args[0].endsWith('.pbf') ? args.shift() : 'C:/Users/pablo/Herramientas-IA/graphhopper/andalucia-latest.osm.pbf';
const CIUDADES = args.length ? args : ['malaga', 'cordoba', 'cadiz'];
const CACHE = path.join(DIR, 'cache'); fs.mkdirSync(CACHE, { recursive: true });

// ---- recorridos y recuadros (igual que fondo-osm.mjs) ----
const zonas = CIUDADES.map((c) => {
  const R = JSON.parse(fs.readFileSync(path.join(RAIZ, 'site', 'data', 'recorridos', c + '.json'), 'utf8'));
  const lineas = [];
  for (const e of [...Object.values(R.hermandades), ...Object.values(R.extraordinarias || {})]) for (const tr of Object.values(e.tramos)) {
    const l = []; for (const p of tr) { if (p.lat == null) continue; l.push([p.lat, p.lon]); for (const v of p.via || []) l.push(v); }
    if (l.length > 1) lineas.push(l);
  }
  let b = [90, 180, -90, -180]; for (const l of lineas) for (const [la, lo] of l) b = [Math.min(b[0], la), Math.min(b[1], lo), Math.max(b[2], la), Math.max(b[3], lo)];
  const m = 0.0036;
  return { c, lineas, bb: [b[0] - m, b[1] - m * 1.25, b[2] + m, b[3] + m * 1.25] };
});
const enAlguna = (la, lo) => zonas.some((z) => la >= z.bb[0] && la <= z.bb[2] && lo >= z.bb[1] && lo <= z.bb[3]);

// ---- lector mínimo de protobuf ----
function* campos(buf, ini = 0, fin = buf.length) {
  let i = ini;
  const varint = () => { let r = 0, s = 1, b; do { b = buf[i++]; r += (b & 0x7f) * s; s *= 128; } while (b & 0x80); return r; };
  while (i < fin) {
    const k = varint(), n = Math.floor(k / 8), t = k & 7;
    if (t === 0) yield [n, varint()];
    else if (t === 2) { const L = varint(); yield [n, buf.subarray(i, i + L)]; i += L; }
    else if (t === 1) { i += 8; } else if (t === 5) { i += 4; } else throw new Error('tipo ' + t);
  }
}
const empaquetados = (b) => { const o = []; let i = 0; while (i < b.length) { let r = 0, s = 1, x; do { x = b[i++]; r += (x & 0x7f) * s; s *= 128; } while (x & 0x80); o.push(r); } return o; };
const zz = (v) => (v % 2 ? -(v + 1) / 2 : v / 2); // sint64 en zigzag

// ---- recorrido del archivo ----
const nodos = new Map(); const vias = new Map(); const rels = [];
const fd = fs.openSync(PBF, 'r'); let pos = 0; const tam = fs.fstatSync(fd).size; const t0 = Date.now(); let bloques = 0;
const leer = (n) => { const b = Buffer.alloc(n); fs.readSync(fd, b, 0, n, pos); pos += n; return b; };
while (pos < tam) {
  const lh = leer(4).readUInt32BE(0); const h = leer(lh); let tipo = '', ds = 0;
  for (const [n, v] of campos(h)) { if (n === 1) tipo = v.toString(); if (n === 3) ds = v; }
  const blob = leer(ds); let datos = null;
  for (const [n, v] of campos(blob)) { if (n === 1) datos = v; if (n === 3) datos = zlib.inflateSync(v); }
  if (tipo !== 'OSMData' || !datos) continue;
  bloques++;
  let st = [], gran = 100, lao = 0, loo = 0; const grupos = [];
  for (const [n, v] of campos(datos)) { if (n === 1) { st = []; for (const [m, s] of campos(v)) if (m === 1) st.push(s.toString()); } else if (n === 2) grupos.push(v); else if (n === 17) gran = v; else if (n === 19) lao = v; else if (n === 20) loo = v; }
  for (const g of grupos) for (const [n, v] of campos(g)) {
    if (n === 2) { // DenseNodes
      let ids = [], las = [], los = [];
      for (const [m, w] of campos(v)) { if (m === 1) ids = empaquetados(w); else if (m === 8) las = empaquetados(w); else if (m === 9) los = empaquetados(w); }
      let id = 0, la = 0, lo = 0;
      for (let k = 0; k < ids.length; k++) { id += zz(ids[k]); la += zz(las[k]); lo += zz(los[k]); const LA = 1e-9 * (lao + gran * la), LO = 1e-9 * (loo + gran * lo); if (enAlguna(LA, LO)) nodos.set(id, [LA, LO]); }
    } else if (n === 3) { // Way
      let id = 0, ks = [], vs = [], refs = [];
      for (const [m, w] of campos(v)) { if (m === 1) id = w; else if (m === 2) ks = empaquetados(w); else if (m === 3) vs = empaquetados(w); else if (m === 8) refs = empaquetados(w); }
      let r = 0; const rr = refs.map((x) => (r += zz(x)));
      if (!rr.some((x) => nodos.has(x))) continue;
      const tags = {}; ks.forEach((k, j) => { tags[st[k]] = st[vs[j]]; });
      vias.set(id, { tags, refs: rr });
    } else if (n === 4) { // Relation
      let id = 0, ks = [], vs = [], roles = [], mem = [], tps = [];
      for (const [m, w] of campos(v)) { if (m === 1) id = w; else if (m === 2) ks = empaquetados(w); else if (m === 3) vs = empaquetados(w); else if (m === 8) roles = empaquetados(w); else if (m === 9) mem = empaquetados(w); else if (m === 10) tps = empaquetados(w); }
      const tags = {}; ks.forEach((k, j) => { tags[st[k]] = st[vs[j]]; });
      if (!(tags.place === 'square' || tags.waterway === 'riverbank' || tags.natural === 'water' || /^(park|garden)$/.test(tags.leisure || '') || tags.amenity === 'place_of_worship')) continue;
      let r = 0; const members = mem.map((x, j) => ({ type: tps[j] === 1 ? 'way' : tps[j] === 0 ? 'node' : 'relation', ref: (r += zz(x)), role: st[roles[j]] || '' })).filter((mb) => mb.type === 'way');
      if (members.some((mb) => vias.has(mb.ref))) rels.push({ id, tags, members });
    }
  }
}
fs.closeSync(fd);
console.log(`${PBF}: ${bloques} bloques, ${nodos.size} nodos y ${vias.size} vías en las zonas, ${rels.length} relaciones (${((Date.now() - t0) / 1000).toFixed(0)} s)`);

// ---- salida por ciudad, con el mismo formato que Overpass ----
const geom = (refs) => refs.map((r) => nodos.get(r)).filter(Boolean).map(([lat, lon]) => ({ lat, lon }));
const quiere = (t) => t.highway || t['area:highway'] || t.place === 'square' || /^(river|riverbank|canal|stream)$/.test(t.waterway || '') || /^(water|coastline|beach|sand)$/.test(t.natural || '') || /^(park|garden)$/.test(t.leisure || '') || t.amenity === 'place_of_worship' || (t.building && /hermandad|cofrad/i.test(t.name || ''));
for (const z of zonas) {
  const dentro = (g) => g.some((p) => p.lat >= z.bb[0] && p.lat <= z.bb[2] && p.lon >= z.bb[1] && p.lon <= z.bb[3]);
  const el = [];
  for (const [id, w] of vias) { if (!quiere(w.tags)) continue; const g = geom(w.refs); if (g.length > 1 && dentro(g)) el.push({ type: 'way', id, tags: w.tags, geometry: g }); }
  for (const r of rels) { const members = r.members.map((mb) => ({ type: 'way', ref: mb.ref, role: mb.role, geometry: vias.has(mb.ref) ? geom(vias.get(mb.ref).refs) : [] })).filter((mb) => mb.geometry.length > 1); if (members.some((mb) => dentro(mb.geometry))) el.push({ type: 'relation', id: r.id, tags: r.tags, members }); }
  fs.writeFileSync(path.join(CACHE, `fondo-${z.c}.json`), JSON.stringify({ fuente: 'OSM ' + path.basename(PBF), elements: el }));
  // edificios a menos de 40 m de algún recorrido (rejilla de celdas de 40 m alrededor de los recorridos)
  const kx = 111320 * Math.cos(z.bb[0] * Math.PI / 180), ky = 110540, C = 40, cel = new Set();
  for (const l of z.lineas) for (let i = 1; i < l.length; i++) { const [a, b] = [l[i - 1], l[i]], L = Math.hypot((b[0] - a[0]) * ky, (b[1] - a[1]) * kx); for (let d = 0; d <= L; d += 15) { const la = a[0] + (b[0] - a[0]) * (L ? d / L : 0), lo = a[1] + (b[1] - a[1]) * (L ? d / L : 0); cel.add(Math.floor(lo * kx / C) + ':' + Math.floor(la * ky / C)); } }
  const cerca = (p) => { const cx = Math.floor(p.lon * kx / C), cy = Math.floor(p.lat * ky / C); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (cel.has((cx + a) + ':' + (cy + b))) return true; return false; };
  const ed = [];
  for (const [id, w] of vias) { if (!w.tags.building) continue; const g = geom(w.refs); if (g.length > 3 && g.some(cerca)) ed.push({ type: 'way', id, tags: w.tags, geometry: g }); }
  fs.writeFileSync(path.join(CACHE, `edificios-${z.c}.json`), JSON.stringify({ fuente: 'OSM ' + path.basename(PBF), elements: ed }));
  console.log(`${z.c}: ${el.length} elementos del fondo, ${ed.length} edificios junto a los recorridos`);
}
