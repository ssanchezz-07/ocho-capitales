// Ocho Capitales: hace que los recorridos sigan las CALLES en el plano.
// Los itinerarios oficiales solo dan puntos sueltos (calles por las que pasa a cada hora); unirlos con rectas cruza
// manzanas. Aquí se construye el grafo de calles de OpenStreetMap (los nodos compartidos tienen coordenadas idénticas)
// y, entre cada par de puntos seguidos, se busca el camino más corto por calles transitables a pie.
// Si el camino es demasiado largo para ser verosímil (más de 2,6 veces la recta y 500 m de más), se deja la recta:
// mejor una recta honesta que un rodeo inventado.
// Escribe en cada punto de site/data/recorridos/<ciudad>.json el campo «via»: [[lat,lon],…] hasta el punto siguiente.
// Uso: node tools/itinerarios/enrutar.mjs [ciudad]      (después de geocodificar.mjs; antes de build.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(DIR, '..', '..');
const ANDABLE = /^(primary|secondary|tertiary|residential|pedestrian|living_street|unclassified|footway|steps|service|road|path|cycleway|trunk)(_link)?$/;
const solo = process.argv[2];

class Monticulo { // cola de prioridad binaria para Dijkstra
  constructor() { this.a = []; }
  push(n, p) { const a = this.a; a.push([p, n]); let i = a.length - 1; while (i > 0) { const j = (i - 1) >> 1; if (a[j][0] <= a[i][0]) break; [a[i], a[j]] = [a[j], a[i]]; i = j; } }
  pop() { const a = this.a, top = a[0], u = a.pop(); if (a.length) { a[0] = u; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l][0] < a[m][0]) m = l; if (r < a.length && a[r][0] < a[m][0]) m = r; if (m === i) break; [a[i], a[m]] = [a[m], a[i]]; i = m; } } return top; }
  get size() { return this.a.length; }
}

function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const a = pts[0], b = pts[pts.length - 1]; let idx = 0, md = 0;
  for (let i = 1; i < pts.length - 1; i++) { const p = pts[i], dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / (Math.hypot(dx, dy) || 1); if (d > md) { md = d; idx = i; } }
  if (md <= tol) return [a, b];
  return [...dp(pts.slice(0, idx + 1), tol).slice(0, -1), ...dp(pts.slice(idx), tol)];
}

for (const f of fs.readdirSync(path.join(RAIZ, 'site', 'data', 'recorridos'))) {
  const ciudad = f.replace('.json', ''); if (solo && solo !== ciudad) continue;
  const fOsm = path.join(DIR, 'cache', `osm-${ciudad}.json`); if (!fs.existsSync(fOsm)) continue;
  const fRec = path.join(RAIZ, 'site', 'data', 'recorridos', f);
  const R = JSON.parse(fs.readFileSync(fRec, 'utf8'));
  const osm = JSON.parse(fs.readFileSync(fOsm, 'utf8'));
  // proyección local en metros
  const todos = Object.values(R.hermandades).flatMap((h) => Object.values(h.tramos).flat()).filter((p) => p.lat != null);
  const o = [todos.reduce((s, p) => s + p.lat, 0) / todos.length, todos.reduce((s, p) => s + p.lon, 0) / todos.length];
  const kx = 111320 * Math.cos(o[0] * Math.PI / 180), ky = 110540;
  const X = (la, lo) => [(lo - o[1]) * kx, (o[0] - la) * ky];
  // grafo: nodo por coordenada exacta
  const id = new Map(), nodos = [], ady = [];
  const nodo = (la, lo) => { const k = la.toFixed(7) + ',' + lo.toFixed(7); let i = id.get(k); if (i === undefined) { i = nodos.length; id.set(k, i); nodos.push([la, lo, ...X(la, lo)]); ady.push([]); } return i; };
  for (const e of osm.elements) {
    const t = e.tags || {};
    if (!e.geometry || !(ANDABLE.test(t.highway || '') || t.place === 'square')) continue;
    if (t.access === 'private' || t.foot === 'no') continue;
    let prev = -1;
    for (const g of e.geometry) {
      if (!g) { prev = -1; continue; }
      const i = nodo(g.lat, g.lon);
      if (prev >= 0 && prev !== i) { const d = Math.hypot(nodos[i][2] - nodos[prev][2], nodos[i][3] - nodos[prev][3]); ady[prev].push([i, d]); ady[i].push([prev, d]); }
      prev = i;
    }
  }
  // rejilla de 60 m para encontrar el nodo más cercano
  const rej = new Map(), C = 60;
  nodos.forEach((n, i) => { if (!ady[i].length) return; const k = Math.floor(n[2] / C) + ':' + Math.floor(n[3] / C); (rej.get(k) || rej.set(k, []).get(k)).push(i); });
  const cercano = (x, y) => { let best = -1, bd = Infinity; const cx = Math.floor(x / C), cy = Math.floor(y / C); for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) for (const i of rej.get((cx + a) + ':' + (cy + b)) || []) { const d = Math.hypot(nodos[i][2] - x, nodos[i][3] - y); if (d < bd) { bd = d; best = i; } } return bd <= 90 ? best : -1; };
  function camino(s, t, limite) {
    const dist = new Map([[s, 0]]), de = new Map(), h = new Monticulo(); h.push(s, 0);
    while (h.size) {
      const [d, u] = h.pop(); if (u === t) break; if (d > dist.get(u) || d > limite) continue;
      for (const [v, w] of ady[u]) { const nd = d + w; if (nd < (dist.has(v) ? dist.get(v) : Infinity)) { dist.set(v, nd); de.set(v, u); h.push(v, nd); } }
    }
    if (!dist.has(t)) return null;
    const ruta = [t]; let u = t; while (u !== s) { u = de.get(u); ruta.push(u); }
    return { largo: dist.get(t), nodos: ruta.reverse() };
  }
  let tramos = 0, porCalle = 0, rectas = 0, mismos = 0;
  for (const h of [...Object.values(R.hermandades), ...Object.values(R.extraordinarias || {})]) for (const pts of Object.values(h.tramos)) {
    const v = pts.map((p, i) => [p, i]).filter(([p]) => p.lat != null);
    for (const [p] of v) delete p.via;
    for (let k = 0; k < v.length - 1; k++) {
      const A = v[k][0], B = v[k + 1][0]; tramos++;
      const [ax, ay] = X(A.lat, A.lon), [bx, by] = X(B.lat, B.lon), recta = Math.hypot(bx - ax, by - ay);
      if (recta < 25) { mismos++; continue; }
      const s = cercano(ax, ay), t = cercano(bx, by);
      if (s < 0 || t < 0 || s === t) { rectas++; continue; }
      const c = camino(s, t, recta * 2.6 + 500);
      if (!c || c.largo > recta * 2.6 + 500) { rectas++; continue; }
      const linea = dp(c.nodos.map((i) => [nodos[i][2], nodos[i][3], nodos[i][0], nodos[i][1]]), 3);
      A.via = linea.slice(1, -1).map((q) => [+q[2].toFixed(6), +q[3].toFixed(6)]);
      porCalle++;
    }
  }
  fs.writeFileSync(fRec, JSON.stringify(R));
  console.log(`${ciudad}: ${tramos} tramos · ${porCalle} por calles · ${rectas} en recta · ${mismos} en el mismo punto · grafo ${nodos.length} nodos`);
}
