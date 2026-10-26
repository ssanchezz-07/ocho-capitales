// Ocho Capitales: contorno de las tierras del mundo para el globo de la entrada de la portada (site/assets/mundo.json).
// Fuente: Natural Earth 1:110m «land» (dominio público, https://www.naturalearthdata.com/). Anillos en [lon, lat] con
// un decimal, simplificados (Douglas-Peucker en grados, cada anillo en dos mitades porque empieza y acaba en el mismo punto)
// y sin islas diminutas.
// Uso: node tools/generar-mundo.mjs <carpeta con ne_110m_land.geojson>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const src = process.argv[2]; if (!src) { console.error('Falta la carpeta con ne_110m_land.geojson'); process.exit(1); }
const G = JSON.parse(fs.readFileSync(path.join(src, 'ne_110m_land.geojson'), 'utf8'));
const OUT = path.join(DIR, '..', 'site', 'assets', 'mundo.json');
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1; const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let dm = 0, im = -1; const [x1, y1] = pts[a], [x2, y2] = pts[b], L = Math.hypot(x2 - x1, y2 - y1) || 1;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((x2 - x1) * (y1 - pts[i][1]) - (x1 - pts[i][0]) * (y2 - y1)) / L; if (d > dm) { dm = d; im = i; } }
    if (dm > tol) { keep[im] = 1; st.push([a, im], [im, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const area = (r) => { let s = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) s += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1]); return Math.abs(s / 2); };
const anillos = [];
for (const f of G.features) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const p of polys) { const r = p[0]; if (area(r) < 1.5) continue; const m = Math.floor(r.length / 2), s = [...simplify(r.slice(0, m + 1), 0.25).slice(0, -1), ...simplify(r.slice(m), 0.25)].map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]); if (s.length > 3) anillos.push(s); }
}
fs.writeFileSync(OUT, JSON.stringify({ fuente: 'Natural Earth 1:110m land (dominio público)', anillos }));
console.log(`mundo.json: ${anillos.length} anillos, ${fs.statSync(OUT).size} bytes`);
