// Ocho Capitales · fondo de las afueras para el plano de sedes (portada → capital) y «En la calle».
// El fondo de cada capital (site/data/planos/<ciudad>.json, tools/itinerarios) cubre el entorno de los recorridos; hay sedes
// (templos y casas hermandad de los barrios) que caen fuera y se pintaban sobre morado vacío. Este script amplía el fondo
// hasta la sede más lejana, con margen, pero ligero: fuera del centro solo las calles principales, y alrededor de cada sede
// apartada también las de su barrio. Lee el mismo extracto de OSM que GraphHopper (solo lectura, lector propio sin dependencias).
// Salida: site/data/planos-afueras/<ciudad>.json  { lim:[x0,y0,x1,y1], principales:[[x,y,x,y…]], calles:[[…]] } en los metros del plano.
// El recuadro, además, cubre lo que enseña la cámara al encuadrar todas las sedes en un móvil en vertical y en un ordenador,
// para que no asome morado vacío: fuera del centro solo van carreteras principales y la costa.
// © colaboradores de OpenStreetMap (ODbL).
// Uso: node tools/plano/afueras.mjs [ruta.pbf] [ciudad…]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
let args = process.argv.slice(2);
const PBF = args[0] && args[0].endsWith('.pbf') ? args.shift() : 'C:/Users/pablo/Herramientas-IA/graphhopper/andalucia-latest.osm.pbf';
const CIUDADES = args.length ? args : ['almeria', 'cadiz', 'cordoba', 'granada', 'huelva', 'jaen', 'malaga', 'sevilla'];
const OUT = path.join(RAIZ, 'site', 'data', 'planos-afueras'); fs.mkdirSync(OUT, { recursive: true });
const MARGEN = 700;   // m alrededor de cada sede apartada (el plano no se puede alejar más allá del fondo)
const BARRIO = 600;   // m alrededor de cada sede apartada en los que también van las calles del barrio
const PRINC = /^(motorway|trunk|primary|secondary|tertiary)(_link)?$/;
const MENOR = /^(residential|unclassified|living_street|pedestrian|service)$/;
// pantallas de referencia con los márgenes de la portada (site.js, margenes(): el pie mide unos 420 px en el móvil)
const PANTALLAS = [{ W: 390, H: 844, arriba: 58, abajo: 460, izq: 30, der: 84 }, { W: 360, H: 740, arriba: 58, abajo: 460, izq: 30, der: 84 }, { W: 1440, H: 820, arriba: 58, abajo: 260, izq: 30, der: 84 }];

// ---- recuadros por ciudad: el fondo actual y las sedes que se salen ----
const zonas = [];
for (const c of CIUDADES) {
  const fP = path.join(RAIZ, 'site', 'data', 'planos', c + '.json'), fS = path.join(RAIZ, 'site', 'data', 'sedes', c + '.json');
  if (!fs.existsSync(fP) || !fs.existsSync(fS)) continue;
  const P = JSON.parse(fs.readFileSync(fP, 'utf8')), S = JSON.parse(fs.readFileSync(fS, 'utf8'));
  const xy = (la, lo) => [(lo - P.origen[1]) * P.kx, (P.origen[0] - la) * P.ky];
  const lim = [Infinity, Infinity, -Infinity, -Infinity];
  for (const l of [...P.calles, ...P.principales]) for (let i = 0; i < l.length; i += 2) { lim[0] = Math.min(lim[0], l[i]); lim[1] = Math.min(lim[1], l[i + 1]); lim[2] = Math.max(lim[2], l[i]); lim[3] = Math.max(lim[3], l[i + 1]); }
  const lista = Array.isArray(S) ? S : Array.isArray(S.hermandades) ? S.hermandades : Object.entries(S.hermandades || S).filter(([k]) => !k.startsWith('_')).map(([k, v]) => ({ slug: k, ...v }));
  const fuera = [];
  for (const e of lista) for (const o of [e.templo, e.casa || e.casa_hermandad]) {
    if (!o || o.lat == null || o.lon == null) continue;
    const [x, y] = xy(o.lat, o.lon);
    if (x < lim[0] + 150 || x > lim[2] - 150 || y < lim[1] + 150 || y > lim[3] - 150) fuera.push([x, y, e.slug || e.hermandad]);
  }
  // todas las sedes con su margen, y ese recuadro estirado a las proporciones de un móvil en vertical y de un ordenador
  const Sb = [Infinity, Infinity, -Infinity, -Infinity];
  for (const e of lista) for (const o of [e.templo, e.casa || e.casa_hermandad]) { if (!o || o.lat == null || o.lon == null) continue; const [x, y] = xy(o.lat, o.lon); Sb[0] = Math.min(Sb[0], x - MARGEN); Sb[1] = Math.min(Sb[1], y - MARGEN); Sb[2] = Math.max(Sb[2], x + MARGEN); Sb[3] = Math.max(Sb[3], y + MARGEN); }
  const T = lim.slice();
  if (Sb[0] < Infinity) {
    // lo que enseña la cámara al encuadrar todas las sedes (la misma cuenta que api.caja en site/assets/plano.js), en un móvil
    // y en un ordenador, con los márgenes de la portada: arriba la cabecera y abajo el pie con el título y los botones
    for (const V of PANTALLAS) {
      const iw = V.W - V.izq - V.der, ih = V.H - V.arriba - V.abajo, e = Math.max(Math.max(Sb[2] - Sb[0], 300) / iw, Math.max(Sb[3] - Sb[1], 300) / ih) * 1.04;
      const cx = (Sb[0] + Sb[2]) / 2 - (V.izq - V.der) / 2 * e, cy = (Sb[1] + Sb[3]) / 2 - (V.arriba - V.abajo) / 2 * e, w = V.W * e, h = V.H * e;
      T[0] = Math.min(T[0], cx - w / 2); T[2] = Math.max(T[2], cx + w / 2); T[1] = Math.min(T[1], cy - h / 2); T[3] = Math.max(T[3], cy + h / 2);
    }
  }
  const fO = path.join(OUT, c + '.json');
  if (!fuera.length && T.every((v, i) => Math.abs(v - lim[i]) < 1)) { if (fs.existsSync(fO)) fs.unlinkSync(fO); console.log(c + ': el fondo ya cubre todas las sedes'); continue; }
  // en grados, para filtrar nodos al leer
  const aLL = (x, y) => [P.origen[0] - y / P.ky, P.origen[1] + x / P.kx];
  const [la1, lo0] = aLL(T[0], T[3]), [la0, lo1] = aLL(T[2], T[1]);
  zonas.push({ c, P, xy, lim, T, fuera, bb: [Math.min(la0, la1), Math.min(lo0, lo1), Math.max(la0, la1), Math.max(lo0, lo1)], fO });
}
if (!zonas.length) process.exit(0);
const enAlguna = (la, lo) => zonas.some((z) => la >= z.bb[0] && la <= z.bb[2] && lo >= z.bb[1] && lo <= z.bb[3]);

// ---- lector mínimo de protobuf (el mismo de tools/itinerarios/fondo-pbf.mjs) ----
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
const zz = (v) => (v % 2 ? -(v + 1) / 2 : v / 2);

const nodos = new Map(); const vias = [];
const fd = fs.openSync(PBF, 'r'); let pos = 0; const tam = fs.fstatSync(fd).size; const t0 = Date.now();
const leer = (n) => { const b = Buffer.alloc(n); fs.readSync(fd, b, 0, n, pos); pos += n; return b; };
while (pos < tam) {
  const lh = leer(4).readUInt32BE(0); const h = leer(lh); let tipo = '', ds = 0;
  for (const [n, v] of campos(h)) { if (n === 1) tipo = v.toString(); if (n === 3) ds = v; }
  const blob = leer(ds); let datos = null;
  for (const [n, v] of campos(blob)) { if (n === 1) datos = v; if (n === 3) datos = zlib.inflateSync(v); }
  if (tipo !== 'OSMData' || !datos) continue;
  let st = [], gran = 100, lao = 0, loo = 0; const grupos = [];
  for (const [n, v] of campos(datos)) { if (n === 1) { st = []; for (const [m, s] of campos(v)) if (m === 1) st.push(s.toString()); } else if (n === 2) grupos.push(v); else if (n === 17) gran = v; else if (n === 19) lao = v; else if (n === 20) loo = v; }
  for (const g of grupos) for (const [n, v] of campos(g)) {
    if (n === 2) {
      let ids = [], las = [], los = [];
      for (const [m, w] of campos(v)) { if (m === 1) ids = empaquetados(w); else if (m === 8) las = empaquetados(w); else if (m === 9) los = empaquetados(w); }
      let id = 0, la = 0, lo = 0;
      for (let k = 0; k < ids.length; k++) { id += zz(ids[k]); la += zz(las[k]); lo += zz(los[k]); const LA = 1e-9 * (lao + gran * la), LO = 1e-9 * (loo + gran * lo); if (enAlguna(LA, LO)) nodos.set(id, [LA, LO]); }
    } else if (n === 3) {
      let ks = [], vs = [], refs = [];
      for (const [m, w] of campos(v)) { if (m === 2) ks = empaquetados(w); else if (m === 3) vs = empaquetados(w); else if (m === 8) refs = empaquetados(w); }
      let hw = ''; ks.forEach((k, j) => { if (st[k] === 'highway') hw = st[vs[j]]; else if (st[k] === 'natural' && st[vs[j]] === 'coastline') hw = 'costa'; });
      if (!hw || !(hw === 'costa' || PRINC.test(hw) || MENOR.test(hw))) continue;
      let r = 0; const rr = refs.map((x) => (r += zz(x)));
      if (!rr.some((x) => nodos.has(x))) continue;
      vias.push({ hw, refs: rr });
    }
  }
}
fs.closeSync(fd);
console.log(`${vias.length} vías candidatas (${((Date.now() - t0) / 1000).toFixed(0)} s)`);

// Douglas-Peucker en metros
function simplificar(p, tol) {
  if (p.length < 3) return p;
  const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1; const pila = [[0, p.length - 1]];
  while (pila.length) {
    const [a, b] = pila.pop(); let dm = 0, im = -1; const [ax, ay] = p[a], [bx, by] = p[b], L = Math.hypot(bx - ax, by - ay) || 1;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((bx - ax) * (ay - p[i][1]) - (ax - p[i][0]) * (by - ay)) / L; if (d > dm) { dm = d; im = i; } }
    if (dm > tol) { keep[im] = 1; pila.push([a, im], [im, b]); }
  }
  return p.filter((_, i) => keep[i]);
}
for (const z of zonas) {
  const dentro = (x, y, B) => x >= B[0] && x <= B[2] && y >= B[1] && y <= B[3];
  const cerca = (x, y) => z.fuera.some(([fx, fy]) => Math.hypot(x - fx, y - fy) < BARRIO);
  const princ = [], calles = [], costa = [];
  for (const v of vias) {
    const pts = v.refs.map((r) => nodos.get(r)).filter(Boolean).map(([la, lo]) => z.xy(la, lo));
    if (pts.length < 2 || !pts.some(([x, y]) => dentro(x, y, z.T))) continue;
    if (pts.every(([x, y]) => dentro(x, y, z.lim))) continue; // ya está en el fondo del centro
    if (v.hw === 'costa') { costa.push(simplificar(pts, 8).flatMap(([x, y]) => [Math.round(x), Math.round(y)])); continue; }
    const esP = PRINC.test(v.hw);
    if (!esP && !pts.some(([x, y]) => cerca(x, y))) continue;
    // lejos del centro, el trazo puede ser más simple: no se ve de cerca
    const lejos = !pts.some(([x, y]) => dentro(x, y, [z.lim[0] - 1500, z.lim[1] - 1500, z.lim[2] + 1500, z.lim[3] + 1500]));
    if (lejos && /^tertiary/.test(v.hw)) continue; // lejos del centro, solo las carreteras de verdad
    // a esa distancia el plano solo se ve alejado (un píxel son 20–70 m): basta un trazo de 30 m
    const l = simplificar(pts, esP ? (lejos ? 30 : 6) : 4).flatMap(([x, y]) => [Math.round(x), Math.round(y)]);
    (esP ? princ : calles).push(l);
  }
  const out = { _fuente: '© colaboradores de OpenStreetMap (ODbL), ' + path.basename(PBF), _sedes: z.fuera.map((f) => f[2]), lim: z.T.map(Math.round), principales: princ, calles, costa };
  fs.writeFileSync(z.fO, JSON.stringify(out));
  console.log(`${z.c}: ${z.fuera.length} sedes fuera del centro (${[...new Set(z.fuera.map((f) => f[2]))].join(', ')}); ${princ.length} principales, ${calles.length} calles de barrio y ${costa.length} tramos de costa; recuadro ${Math.round((z.T[2] - z.T[0]) / 100) / 10}×${Math.round((z.T[3] - z.T[1]) / 100) / 10} km; ${Math.round(fs.statSync(z.fO).size / 1024)} KB`);
}
