// Ocho Capitales: plano propio de cada capital para el mapa «En la calle», con estética cofrade (sin teselas de terceros).
// Toma las calles de OpenStreetMap ya descargadas por geocodificar.mjs, se queda con las del entorno de los recorridos,
// las simplifica (Douglas-Peucker) y las proyecta a metros locales. © colaboradores de OpenStreetMap (ODbL).
// Salida: site/data/planos/<ciudad>.json  { origen:[lat,lon], escala, calles:[[x,y,x,y…],…], principales:[…], templos:[{n,x,y}] }
// Uso: node tools/itinerarios/plano.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(DIR, '..', '..');
const OUT = path.join(RAIZ, 'site', 'data', 'planos'); fs.mkdirSync(OUT, { recursive: true });
const PRINC = /^(primary|secondary|tertiary|trunk)(_link)?$/;
const VALE = /^(primary|secondary|tertiary|trunk|residential|pedestrian|living_street|unclassified|footway|steps|service|road)(_link)?$/;

function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let idx = 0, md = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i], dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / (Math.hypot(dx, dy) || 1);
    if (d > md) { md = d; idx = i; }
  }
  if (md <= tol) return [a, b];
  return [...dp(pts.slice(0, idx + 1), tol).slice(0, -1), ...dp(pts.slice(idx), tol)];
}

for (const f of fs.readdirSync(path.join(DIR, 'cache')).filter((f) => f.startsWith('osm-'))) {
  const ciudad = f.slice(4, -5);
  const rec = path.join(RAIZ, 'site', 'data', 'recorridos', ciudad + '.json');
  if (!fs.existsSync(rec)) continue;
  const R = JSON.parse(fs.readFileSync(rec, 'utf8'));
  const P = Object.values(R.hermandades).flatMap((h) => Object.values(h.tramos).flat()).filter((p) => p.lat != null);
  if (!P.length) continue;
  // recuadro de los recorridos + 350 m de margen
  let [la0, la1, lo0, lo1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const p of P) { la0 = Math.min(la0, p.lat); la1 = Math.max(la1, p.lat); lo0 = Math.min(lo0, p.lon); lo1 = Math.max(lo1, p.lon); }
  const m = 0.0032; la0 -= m; la1 += m; lo0 -= m * 1.25; lo1 += m * 1.25;
  const o = [(la0 + la1) / 2, (lo0 + lo1) / 2], kx = 111320 * Math.cos(o[0] * Math.PI / 180), ky = 110540;
  const xy = ([la, lo]) => [Math.round((lo - o[1]) * kx), Math.round((o[0] - la) * ky)];
  const osm = JSON.parse(fs.readFileSync(path.join(DIR, 'cache', f), 'utf8'));
  const calles = [], principales = [], templos = [];
  for (const e of osm.elements) {
    const t = e.tags || {};
    if (t.amenity === 'place_of_worship') { const c = e.center || (e.geometry && e.geometry[0]) || (e.lat ? { lat: e.lat, lon: e.lon } : null); if (c && c.lat >= la0 && c.lat <= la1 && c.lon >= lo0 && c.lon <= lo1) { const [x, y] = xy([c.lat, c.lon]); templos.push({ n: t.name, x, y }); } continue; }
    if (!e.geometry || !(VALE.test(t.highway || '') || t.place === 'square')) continue;
    const g = e.geometry.map((p) => [p.lat, p.lon]);
    if (!g.some(([la, lo]) => la >= la0 && la <= la1 && lo >= lo0 && lo <= lo1)) continue;
    const s = dp(g.map(xy), 2.5).flat();
    (PRINC.test(t.highway || '') ? principales : calles).push(s);
  }
  const [W, Hh] = xy([la0, lo1]).map((v, i) => i === 0 ? v * 2 : v * 2);
  const out = { ciudad, origen: o, kx, ky, ancho: Math.abs(W), alto: Math.abs(Hh), calles, principales, templos, licencia: '© colaboradores de OpenStreetMap (ODbL)' };
  fs.writeFileSync(path.join(OUT, ciudad + '.json'), JSON.stringify(out));
  console.log(ciudad, calles.length + principales.length, 'calles', templos.length, 'templos', (fs.statSync(path.join(OUT, ciudad + '.json')).size / 1024).toFixed(0) + ' KB');
}
