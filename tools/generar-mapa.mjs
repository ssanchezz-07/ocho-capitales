// Ocho Capitales: genera site/data/mapa-andalucia.json (contorno simplificado de las ocho provincias andaluzas)
// a partir de Natural Earth (dominio público, https://www.naturalearthdata.com/), la capa admin-1 a escala 1:10m.
// Uso: node tools/generar-mapa.mjs [ruta/a/ne_10m_admin_1_states_provinces.geojson]
// Si no se indica archivo, lo descarga (≈40 MB) a una carpeta temporal.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, '..', 'site', 'data', 'mapa-andalucia.json');
const URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson';
let file = process.argv[2];
if (!file) {
  file = path.join(os.tmpdir(), 'ne_10m_admin_1_states_provinces.geojson');
  if (!fs.existsSync(file)) { const r = await fetch(URL); if (!r.ok) throw new Error('descarga ' + r.status); fs.writeFileSync(file, Buffer.from(await r.arrayBuffer())); }
}
const G = JSON.parse(fs.readFileSync(file, 'utf8'));
const SLUG = { 'ES-SE': 'sevilla', 'ES-MA': 'malaga', 'ES-GR': 'granada', 'ES-CO': 'cordoba', 'ES-CA': 'cadiz', 'ES-H': 'huelva', 'ES-AL': 'almeria', 'ES-J': 'jaen' };

// Proyección equirrectangular corregida a 37° N (cos 37° = 0.8): los grados de longitud y latitud guardan su proporción real.
const LON0 = -7.6, LAT1 = 38.8, SX = 158.7, SY = SX / 0.8, PAD = 20;
const W = 1000, H = Math.round(PAD * 2 + (LAT1 - 35.9) * SY);
const px = ([lon, lat]) => [PAD + (lon - LON0) * SX, PAD + (LAT1 - lat) * SY];

// Douglas-Peucker
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); let max = 0, idx = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b]; const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) { const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len; if (d > max) { max = d; idx = i; } }
    if (max > tol && idx > 0) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const r1 = (n) => Math.round(n * 10) / 10;
const provincias = [];
for (const f of G.features) {
  const slug = SLUG[f.properties.iso_3166_2]; if (!slug || f.properties.adm0_a3 !== 'ESP') continue;
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  let d = '';
  for (const poly of polys) {
    const ring = poly[0].map(px);
    // se descartan islotes minúsculos (menos de ~6 px de ancho)
    const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]);
    if (Math.max(...xs) - Math.min(...xs) < 6 && Math.max(...ys) - Math.min(...ys) < 6) continue;
    // anillo cerrado: se parte por el punto más alejado del primero para que cada tramo tenga una base válida
    let k = 1, dmax = -1; for (let i = 1; i < ring.length - 1; i++) { const d = Math.hypot(ring[i][0] - ring[0][0], ring[i][1] - ring[0][1]); if (d > dmax) { dmax = d; k = i; } }
    const s = [...simplify(ring.slice(0, k + 1), 0.7), ...simplify(ring.slice(k), 0.7).slice(1)];
    d += 'M' + s.map((p) => r1(p[0]) + ' ' + r1(p[1])).join('L') + 'Z';
  }
  provincias.push({ slug, nombre: f.properties.name, d });
}
const out = { fuente: 'Natural Earth (dominio público)', viewBox: `0 0 ${W} ${H}`, ancho: W, alto: H, proyeccion: { lon0: LON0, lat1: LAT1, sx: SX, sy: SY, pad: PAD }, provincias };
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(`Mapa: ${provincias.length} provincias, viewBox ${out.viewBox}, ${(fs.statSync(OUT).size / 1024).toFixed(1)} KB`);
