// Ocho Capitales: genera site/data/mapa-detalle.json (ríos y sierras para el mapa de Andalucía de la portada)
// a partir de Natural Earth (dominio público, https://www.naturalearthdata.com/), escala 1:10m:
//   ne_10m_rivers_lake_centerlines (Guadalquivir), ne_10m_rivers_europe (Genil, Guadalimar, Guadiana Menor)
//   y ne_10m_geography_regions_polys (Sierra Morena, Sierra Nevada).
// Misma proyección que site/data/mapa-andalucia.json (tools/generar-mapa.mjs), así ríos, sierras y pines coinciden.
// Uso: node tools/generar-mapa-detalle.mjs <carpeta con los tres .geojson de Natural Earth>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const MAPA = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'site', 'data', 'mapa-andalucia.json'), 'utf8'));
const OUT = path.join(DIR, '..', 'site', 'data', 'mapa-detalle.json');
const src = process.argv[2];
if (!src) { console.error('Falta la carpeta con los .geojson de Natural Earth'); process.exit(1); }
const leer = (n) => JSON.parse(fs.readFileSync(path.join(src, n + '.geojson'), 'utf8'));
const P = MAPA.proyeccion;
const px = ([lon, lat]) => [P.pad + (lon - P.lon0) * P.sx, P.pad + (P.lat1 - lat) * P.sy];
const r1 = (n) => Math.round(n * 10) / 10;
// Douglas-Peucker en píxeles del mapa
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
// solo los tramos dentro del recuadro de Andalucía (el mapa los recorta además con el contorno de las provincias)
const dentro = ([x, y]) => x >= -20 && x <= MAPA.ancho + 20 && y >= -20 && y <= MAPA.alto + 20;
const lineas = (g) => (g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : g.type === 'Polygon' ? g.coordinates : g.type === 'MultiPolygon' ? g.coordinates.flat() : []);
const trazo = (ls, cerrar) => ls.map((l) => simplify(l.map(px), 0.6)).filter((l) => l.length > 1 && l.some(dentro)).map((l) => 'M' + l.map(([x, y]) => r1(x) + ' ' + r1(y)).join('L') + (cerrar ? 'Z' : '')).join('');

const RIOS = { Guadalquivir: 'ne_10m_rivers_lake_centerlines', Genil: 'ne_10m_rivers_europe', Guadalimar: 'ne_10m_rivers_europe', 'Guadiana Menor': 'ne_10m_rivers_europe' };
const capas = {};
const rios = Object.entries(RIOS).map(([n, capa]) => {
  const G = capas[capa] || (capas[capa] = leer(capa));
  const fs_ = G.features.filter((f) => f.properties.name === n && /River/.test(f.properties.featurecla || ''));
  // de oeste a este, para que el rótulo que va a lo largo del río se lea al derecho
  const ls = fs_.flatMap((f) => lineas(f.geometry)).map((l) => (l[0][0] > l[l.length - 1][0] ? [...l].reverse() : l)).sort((a, b) => a[0][0] - b[0][0]);
  return { n, d: trazo(ls, false) };
}).filter((r) => r.d);
const SIERRAS = { 'Sierra Morena': 'Sierra Morena', 'S. Nevada': 'Sierra Nevada' };
const R = leer('ne_10m_geography_regions_polys');
const nombre = (f) => f.properties.name || f.properties.NAME;
const sierras = R.features.filter((f) => SIERRAS[nombre(f)]).map((f) => {
  const pts = lineas(f.geometry).flat().map(px);
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return { n: SIERRAS[nombre(f)], d: trazo(lineas(f.geometry), true), cx: r1(cx), cy: r1(cy) };
});
const out = { fuente: 'Natural Earth 1:10m (dominio público), https://www.naturalearthdata.com/', rios, sierras };
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(`mapa-detalle.json: ${rios.length} ríos, ${sierras.length} sierras, ${fs.statSync(OUT).size} bytes`);
