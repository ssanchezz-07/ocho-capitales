// Ocho Capitales · laboratorio de rutas: piezas comunes al método nuevo, al evaluador y al editor.
// Callejero: cache/osm-malaga.json (Overpass con geometría). Puertas: cache/osm-malaga-puertas.json. Nada de datos inventados:
// sedes de casas-hermandad-malaga.json, alias de alias-calles-malaga.json (los dos con su fuente), Nominatim solo desde la caché.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LAB = path.dirname(fileURLToPath(import.meta.url));
export const ITI = path.join(LAB, '..');
const leer = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d);

export const LAS_10 = ['pollinica', 'pasion', 'dolores-del-puente', 'el-rico', 'paloma', 'fusionadas', 'resucitado', 'humildad-y-paciencia', 'estudiantes', 'esperanza'].map((x) => x + '-malaga');
export const ALIAS = leer(path.join(ITI, 'alias-calles-malaga.json'), {});
export const CASAS = leer(path.join(ITI, 'casas-hermandad-malaga.json'), {});
export const NOM = leer(path.join(ITI, 'cache', 'nominatim-malaga.json'), {});
// Lista oficial de calles (PDF de la Agrupación 2026, ya limpia por el parser actual): la misma para los dos métodos.
export const LISTAS = Object.fromEntries(Object.entries(leer(path.join(LAB, 'actual', 'salida', 'informe.json'), {})).map(([id, r]) => [id, { calles: r.calles, fuente: r.fuente, cabecera: r.cabecera }]));
export const FCORR = path.join(LAB, 'correcciones-malaga.json');
export const leerCorrecciones = () => leer(FCORR, {});

export const sn = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\(.*?\)/g, ' ').replace(/[.,;:]/g, ' ').replace(/\s+/g, ' ').trim();
const TIPO = /\b(calle|plaza|plazuela|plza|pza|avenida|avda|paseo|pasillo|pasaje|camino|carrera|callejon|calleja|rampa|glorieta|llano|c)\b/g;
export const clave = (s) => sn(s).replace(TIPO, ' ').replace(/\b(de|del|la|las|los|el)\b/g, ' ').replace(/\s+/g, ' ').trim();
export const tipoDe = (s) => { const m = sn(s).match(/^(plaza|plazuela|avenida|paseo|pasillo|pasaje|glorieta|llano|puente|alameda|rampa)\b/); return m ? (m[1] === 'plazuela' ? 'plaza' : m[1]) : null; };
export const MARCA = /^(tribuna principal|torre sur|s i c b|sicb|estacion de penitencia|patio de los naranjos|catedral)/;
export const CATEDRAL = /^(s i c b|sicb|estacion de penitencia|patio de los naranjos)/;
export const TEMPLO = /^(iglesia|parroquia|basilica|capilla|oratorio|santuario|ermita|abadia|casa hermandad|templo|seminario)/;
const ANDABLE = /^(primary|secondary|tertiary|residential|pedestrian|living_street|unclassified|footway|steps|service|road|path|cycleway|track)(_link)?$/;

// ---- proyección local en metros ----
const O = [36.7213, -4.4214];
export const kx = 111320 * Math.cos(O[0] * Math.PI / 180), ky = 110540;
export const X = (la, lo) => [(lo - O[1]) * kx, (O[0] - la) * ky];
export const LL = (x, y) => [O[0] - y / ky, O[1] + x / kx];
export const d2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const dSeg = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy, t = L ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)) : 0; return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };

// ---- callejero ----
const osm = JSON.parse(fs.readFileSync(path.join(ITI, 'cache', 'osm-malaga.json'), 'utf8'));
export const VIAS = []; // {id, nombre, nombres:[[clave, coste]], tipo, highway, pts:[[x,y]], nodos:[idx]}
export const NODOS = []; const idn = new Map();
const nodo = (la, lo) => { const k = la.toFixed(7) + ',' + lo.toFixed(7); let i = idn.get(k); if (i === undefined) { i = NODOS.length; idn.set(k, i); NODOS.push({ la, lo, xy: X(la, lo), vias: [] }); } return i; };
for (const e of osm.elements) {
  const t = e.tags || {};
  if (e.type !== 'way' || !e.geometry) continue;
  const anda = ANDABLE.test(t.highway || ''), plaza = t.place === 'square' || (t.highway === 'pedestrian' && t.area === 'yes');
  if (!anda && !plaza) continue;
  if (t.access === 'private' || t.foot === 'no') continue;
  const nombres = []; for (const [k, c] of [['name', 0], ['official_name', 3], ['alt_name', 5], ['old_name', 8], ['short_name', 5]]) if (t[k]) for (const n of t[k].split(';')) { const cl = clave(n); if (cl && !nombres.some((x) => x[0] === cl)) nombres.push([cl, c]); }
  const v = { id: e.id, nombre: t.name || null, nombres, tipo: tipoDe(t.name || ''), highway: t.highway || 'plaza', area: plaza, pts: [], nodos: [] };
  for (const g of e.geometry) { if (!g) continue; const i = nodo(g.lat, g.lon); v.nodos.push(i); v.pts.push(NODOS[i].xy); NODOS[i].vias.push(VIAS.length); }
  VIAS.push(v);
}
export const VIA_POR_ID = new Map(VIAS.map((v, i) => [v.id, i]));
const porClave = new Map(); VIAS.forEach((v, i) => { for (const [cl, c] of v.nombres) (porClave.get(cl) || porClave.set(cl, []).get(cl)).push([i, c]); });
export const CLAVES = [...porClave.keys()];
// rejilla de tramos para buscar «qué calle hay aquí»
const CEL = 40, rejT = new Map();
VIAS.forEach((v, i) => { for (let j = 1; j < v.pts.length; j++) { const a = v.pts[j - 1], b = v.pts[j]; const x0 = Math.floor(Math.min(a[0], b[0]) / CEL), x1 = Math.floor(Math.max(a[0], b[0]) / CEL), y0 = Math.floor(Math.min(a[1], b[1]) / CEL), y1 = Math.floor(Math.max(a[1], b[1]) / CEL); for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) { const k = x + ':' + y; (rejT.get(k) || rejT.set(k, []).get(k)).push([i, j]); } } });
export function viasCerca(p, r) { const out = new Map(); const cx = Math.floor(p[0] / CEL), cy = Math.floor(p[1] / CEL), R = Math.ceil(r / CEL); for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) for (const [i, j] of rejT.get((cx + a) + ':' + (cy + b)) || []) { const d = dSeg(p, VIAS[i].pts[j - 1], VIAS[i].pts[j]); if (d <= r && !(out.get(i) <= d)) out.set(i, d); } return out; }

// ---- parecido de nombres ----
const lev = (a, b) => { if (Math.abs(a.length - b.length) > 3) return 9; const m = Array.from({ length: b.length + 1 }, (_, i) => i); for (let i = 1; i <= a.length; i++) { let p = m[0]; m[0] = i; for (let j = 1; j <= b.length; j++) { const t = m[j]; m[j] = Math.min(m[j] + 1, m[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1)); p = t; } } return m[b.length]; };
// claves de OSM que se parecen a la del itinerario, con un coste (en metros equivalentes) según lo lejos que estén
export function clavesParecidas(k) {
  const out = new Map(), sp = k.replace(/ /g, '');
  for (const c of CLAVES) {
    let coste = null;
    if (c === k) coste = 0;
    else if (c.replace(/ /g, '') === sp) coste = 5;
    else if (k.length >= 4 && (c.endsWith(' ' + k) || c.startsWith(k + ' ') || k.endsWith(' ' + c) || k.startsWith(c + ' ')) && Math.min(c.length, k.length) >= 4) coste = 25;
    else if (sp.length >= 6) { const d = lev(sp, c.replace(/ /g, '')); if (d <= Math.max(1, Math.floor(sp.length / 8))) coste = 12 * d; }
    if (coste !== null) out.set(c, coste);
  }
  return out;
}

// ---- candidatas: tramos de OSM con ese nombre, agrupados en piezas conexas (dos calles homónimas = dos candidatas) ----
export function candidatas(token) {
  const al = ALIAS[token];
  const k = clave(al && !al.startsWith('geo:') && !al.startsWith('osm:') ? al : token);
  const tTok = tipoDe(token);
  const vias = new Map(); // via → coste de nombre
  for (const [c, coste] of clavesParecidas(k)) for (const [i, extra] of porClave.get(c)) { const tc = tTok && VIAS[i].tipo && VIAS[i].tipo !== tTok ? 15 : 0; const cc = coste + extra + tc; if (!(vias.get(i) <= cc)) vias.set(i, cc); }
  return agrupar(vias);
}
export function agrupar(vias) {
  const ids = [...vias.keys()], padre = new Map(ids.map((i) => [i, i]));
  const raiz = (i) => { while (padre.get(i) !== i) i = padre.get(i); return i; };
  // se unen si comparten nodo o si sus puntos están a menos de 20 m (calzadas dobles, plazas dibujadas como área)
  for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
    const A = VIAS[ids[a]], B = VIAS[ids[b]]; let une = A.nodos.some((n) => B.nodos.includes(n));
    if (!une) { outer: for (const p of A.pts) for (const q of B.pts) if (d2(p, q) < 20) { une = true; break outer; } }
    if (une) padre.set(raiz(ids[a]), raiz(ids[b]));
  }
  const grupos = new Map(); for (const i of ids) { const r = raiz(i); (grupos.get(r) || grupos.set(r, []).get(r)).push(i); }
  return [...grupos.values()].map((vs) => {
    const nodos = [...new Set(vs.flatMap((i) => VIAS[i].nodos))];
    const nombre = VIAS[vs.find((i) => VIAS[i].nombre) ?? vs[0]].nombre;
    return { vias: vs, ids: vs.map((i) => VIAS[i].id), nombre, coste: Math.min(...vs.map((i) => vias.get(i))), nodos, pts: nodos.map((n) => NODOS[n].xy), largo: vs.reduce((s, i) => s + VIAS[i].pts.reduce((a, p, j, P) => a + (j ? d2(p, P[j - 1]) : 0), 0), 0) };
  });
}
// camino por dentro de una candidata (solo por sus propios tramos) entre dos nodos suyos
export function caminoDentro(cand, a, b) {
  if (a === b) return [a];
  const ady = new Map(); for (const i of cand.vias) { const ns = VIAS[i].nodos; for (let j = 1; j < ns.length; j++) { const u = ns[j - 1], v = ns[j], w = d2(NODOS[u].xy, NODOS[v].xy); (ady.get(u) || ady.set(u, []).get(u)).push([v, w]); (ady.get(v) || ady.set(v, []).get(v)).push([u, w]); } }
  const dist = new Map([[a, 0]]), de = new Map(), cola = [[0, a]];
  while (cola.length) { cola.sort((x, y) => x[0] - y[0]); const [d, u] = cola.shift(); if (u === b) break; if (d > dist.get(u)) continue; for (const [v, w] of ady.get(u) || []) if (d + w < (dist.get(v) ?? Infinity)) { dist.set(v, d + w); de.set(v, u); cola.push([d + w, v]); } }
  if (!dist.has(b)) return null; const r = [b]; let u = b; while (de.has(u)) { u = de.get(u); r.push(u); } return r.reverse();
}

// ---- templos, puertas y sedes ----
export const LUG = osm.elements.filter((e) => e.tags?.name && e.geometry && !ANDABLE.test(e.tags.highway || '') && (e.tags.amenity === 'place_of_worship' || /iglesia|parroquia|basilica|capilla|ermita|santuario|oratorio|abadia/.test(sn(e.tags.name))));
const fPu = path.join(ITI, 'cache', 'osm-malaga-puertas.json');
export const PUERTAS = fs.existsSync(fPu) ? JSON.parse(fs.readFileSync(fPu, 'utf8')).elements.filter((e) => e.type === 'node').map((e) => ({ ...e, xy: X(e.lat, e.lon) })) : [];
export const anillo = (w) => w.geometry.filter(Boolean).map((g) => X(g.lat, g.lon));
export const dAnillo = (R, p) => { let m = Infinity; for (let i = 1; i < R.length; i++) m = Math.min(m, dSeg(p, R[i - 1], R[i])); return m; };
export const dentro = (R, [x, y]) => { let c = false; for (let i = 0, j = R.length - 1; i < R.length; j = i++) if ((R[i][1] > y) !== (R[j][1] > y) && x < (R[j][0] - R[i][0]) * (y - R[i][1]) / (R[j][1] - R[i][1]) + R[i][0]) c = !c; return c; };
const centro = (e) => { const g = e.geometry.filter(Boolean); return [g.reduce((a, q) => a + q.lat, 0) / g.length, g.reduce((a, q) => a + q.lon, 0) / g.length]; };
const dirPartes = (dir) => { const m = dir && dir.match(/((?:calle|plaza|plazuela|pasillo|pasaje|avenida|paseo|camino|carretera|alameda|barrera)\b[^,\d]*?)\s+(\d+)/i); return m ? { calle: clave(m[1]), num: m[2] } : null; };
const numDe = (e) => String(e.tags['addr:housenumber'] || '').split(/[;,]/).flatMap((s) => { const r = s.match(/^(\d+)-(\d+)$/); return r ? Array.from({ length: Math.min(+r[2] - +r[1], 40) + 1 }, (_, i) => String(+r[1] + i)) : [s.trim()]; });
function temploOSM(nom) { const k = sn(nom); return LUG.find((x) => sn(x.tags.name) === k) || LUG.find((x) => sn(x.tags.name).includes(k) || k.includes(sn(x.tags.name))) || null; }
// Sede (salida o entrada) a partir del texto del itinerario: {punto:[la,lo], edificio?, dir?, fuente, como}
export function sedeDe(id, texto) {
  const s = sn(texto), cs = CASAS[id];
  const desdeDir = (dir, fuente) => { // puerta OSM con esa dirección; si no, Nominatim en caché
    const dp = dirPartes(dir);
    if (dp) { const m = PUERTAS.filter((e) => clave(e.tags['addr:street'] || e.tags['addr:place'] || '') === dp.calle && numDe(e).includes(dp.num)); if (m.length) { const e = m.sort((a, b) => (b.tags.entrance === 'main') - (a.tags.entrance === 'main'))[0]; return { punto: [e.lat, e.lon], dir, fuente, como: `puerta OSM ${e.id} con la dirección ${dir.replace(/, Málaga$/, '')}`, puerta: e.id }; } }
    const n = NOM[dir]; if (n) return { punto: [n.lat, n.lon], dir, fuente, como: 'dirección por Nominatim (caché)' };
    return null;
  };
  if (s.startsWith('casa hermandad') || (cs && !TEMPLO.test(s))) {
    if (!cs) return null;
    if (cs.punto) return { punto: cs.punto, dir: cs.dir, fuente: cs.fuente, como: 'punto fijado con fuente (casas-hermandad-malaga.json)' };
    return desdeDir(cs.dir, cs.fuente);
  }
  const al = ALIAS['@' + texto];
  if (al?.startsWith('geo:')) { const [la, lo] = al.slice(4).split(',').map(Number); return { punto: [la, lo], fuente: 'alias-calles-malaga.json', como: 'punto fijado (alias)' }; }
  const w = temploOSM(al?.startsWith('osm:') ? al.slice(4) : texto.replace(/\(.*?\)/g, '').trim());
  if (w) return { punto: centro(w), edificio: w, fuente: 'OpenStreetMap ' + w.type + ' ' + w.id, como: 'templo en OSM: ' + w.tags.name };
  if (al && !al.startsWith('osm:')) { const r = desdeDir(al, 'alias-calles-malaga.json'); if (r) { const w2 = LUG.find((e) => dentro(anillo(e), X(...r.punto))); return w2 ? { ...r, edificio: w2 } : r; } }
  if (cs && cs.punto && /^(iglesia|parroquia|basilica|capilla)/i.test(cs.dir || '')) return { punto: cs.punto, dir: cs.dir, fuente: cs.fuente, como: 'punto fijado con fuente' };
  if (NOM[texto]) return { punto: [NOM[texto].lat, NOM[texto].lon], fuente: 'Nominatim (caché)', como: 'templo por Nominatim (caché)' };
  return null;
}
// Puerta de la sede que da a la primera (o última) calle del recorrido: nodo entrance/door de OSM en el contorno del edificio.
export function puertaHacia(sede, cand) {
  if (!sede || sede.puerta || !sede.edificio || !cand) return null;
  const R = anillo(sede.edificio);
  const ps = PUERTAS.filter((e) => dAnillo(R, e.xy) < 4);
  if (!ps.length) return null;
  const dC = (e) => Math.min(...cand.pts.map((p) => d2(p, e.xy)));
  const e = ps.map((e) => [e, dC(e) - (e.tags.entrance === 'main' ? 5 : 0)]).sort((a, b) => a[1] - b[1])[0][0];
  return { punto: [e.lat, e.lon], como: `puerta OSM ${e.id} (${e.tags.entrance || e.tags.door}) del edificio, la más cercana a la calle por la que sale/entra`, puerta: e.id };
}
// Puertas de la Catedral para la estación de penitencia (las mismas que usa el método actual): Postigo de los Abades → Patio de los Naranjos (Císter)
export const PUERTA_CATEDRAL = { entra: PUERTAS.find((e) => e.id === 8280808444), sale: PUERTAS.find((e) => e.id === 2834229789) };
