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
  const ciudad = f.slice(4, -5); if (process.argv[2] && process.argv[2] !== ciudad) continue;
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
  // ---- nombres de calles para rotular el plano ----
  // Una etiqueta por tramo largo de calle con nombre, con su ángulo. Rango 1: calles del recorrido y arterias (se ven siempre);
  // 2: terciarias cercanas al recorrido (al acercar); 3: el resto cercanas al recorrido (más cerca aún).
  const clave = (la, lo) => la.toFixed(6) + ',' + lo.toFixed(6);
  const celda = (x, y) => Math.floor(x / 150) + ':' + Math.floor(y / 150);
  const enRuta = new Set(), cerca = new Set();
  for (const h of Object.values(R.hermandades)) for (const pts of Object.values(h.tramos)) for (const p of pts) {
    if (p.lat == null) continue;
    for (const [la, lo] of [[p.lat, p.lon], ...(p.via || [])]) { enRuta.add(clave(la, lo)); const [x, y] = xy([la, lo]); cerca.add(celda(x, y)); }
  }
  const cercaDe = (x, y) => { const cx = Math.floor(x / 150), cy = Math.floor(y / 150); for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (cerca.has((cx + a) + ':' + (cy + b))) return true; return false; };
  const NOMBRABLE = /^(primary|secondary|tertiary|trunk|residential|pedestrian|living_street|unclassified)(_link)?$/;
  const corto = (n) => n.replace(/^Calle\s+/i, '').replace(/^Avenida\s+/i, 'Avda. ').replace(/^Paseo\s+/i, 'Paseo ').replace(/\s+/g, ' ').trim();
  const cand = [];
  for (const e of osm.elements) {
    const t = e.tags || {}; if (!e.geometry || !t.name || !NOMBRABLE.test(t.highway || '')) continue;
    const pts = e.geometry.filter(Boolean).map((q) => ({ x: (q.lon - o[1]) * kx, y: (o[0] - q.lat) * ky, la: q.lat, lo: q.lon }));
    if (pts.length < 2) continue;
    let L = 0; const acum = [0];
    for (let i = 1; i < pts.length; i++) { L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); acum.push(L); }
    if (L < 70) continue;
    const ruta = pts.filter((q) => enRuta.has(clave(q.la, q.lo))).length >= 2;
    const rango = ruta || /^(primary|secondary|trunk)/.test(t.highway) ? 1 : /^tertiary/.test(t.highway) ? 2 : 3;
    const mx = pts.reduce((s, q) => s + q.x, 0) / pts.length, my = pts.reduce((s, q) => s + q.y, 0) / pts.length;
    if (rango > 1 && !cercaDe(mx, my)) continue;
    // punto medio por longitud y ángulo del segmento ahí
    let i = 1; while (i < acum.length - 1 && acum[i] < L / 2) i++;
    const a = pts[i - 1], b = pts[i], k = (L / 2 - acum[i - 1]) / ((acum[i] - acum[i - 1]) || 1);
    let ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI; if (ang > 90) ang -= 180; if (ang <= -90) ang += 180;
    cand.push({ n: corto(t.name), x: Math.round(a.x + (b.x - a.x) * k), y: Math.round(a.y + (b.y - a.y) * k), ang: Math.round(ang), rango, L: Math.round(L) });
  }
  // un mismo nombre se repite solo cada 300 m; primero lo más importante y lo más largo
  cand.sort((p, q) => p.rango - q.rango || q.L - p.L);
  const aceptadas = [], porNombre = new Map();
  for (const c of cand) {
    const prev = porNombre.get(c.n) || [];
    if (prev.length >= 4 || prev.some((p) => Math.hypot(p.x - c.x, p.y - c.y) < 300)) continue;
    prev.push(c); porNombre.set(c.n, prev); aceptadas.push([c.x, c.y, c.ang, c.n, c.rango, c.L]);
  }
  const [W, Hh] = xy([la0, lo1]).map((v, i) => i === 0 ? v * 2 : v * 2);
  const out = { ciudad, origen: o, kx, ky, ancho: Math.abs(W), alto: Math.abs(Hh), calles, principales, templos, etiquetas: aceptadas, licencia: '© colaboradores de OpenStreetMap (ODbL)' };
  fs.writeFileSync(path.join(OUT, ciudad + '.json'), JSON.stringify(out));
  console.log(ciudad, calles.length + principales.length, 'calles', templos.length, 'templos', (fs.statSync(path.join(OUT, ciudad + '.json')).size / 1024).toFixed(0) + ' KB');
}
