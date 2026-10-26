// Ocho Capitales · rutas: piezas comunes al emparejador, al evaluador, a la publicación y al editor, para CUALQUIER capital.
// ciudad('malaga') carga (una vez) el callejero y devuelve todo lo de esa capital. Archivos, todos por capital:
//   cache/osm-<c>.json (Overpass con geometría) · cache/osm-<c>-puertas.json (descargar-puertas.mjs) · cache/nominatim-<c>.json
//   alias-calles-<c>.json y casas-hermandad-<c>.json (con su fuente) · rutas/listas/<c>.json · rutas/correcciones-<c>.json
// Nada de datos inventados: las sedes salen de casas-hermandad (con fuente) o de OSM; Nominatim, solo desde la caché.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CIUDADES } from './ciudades.mjs';

export const RUTAS = path.dirname(fileURLToPath(import.meta.url));
export const ITI = path.join(RUTAS, '..');
export const RAIZ = path.join(ITI, '..', '..');
const leer = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d);
export const CAPITALES = Object.keys(CIUDADES);
export const fLista = (c) => path.join(RUTAS, 'listas', c + '.json');
export const fCorrecciones = (c) => path.join(RUTAS, 'correcciones-' + c + '.json');
export const fPublicado = (c) => path.join(RAIZ, 'site', 'data', 'recorridos', c + '.json');
export const dirSalida = (c) => path.join(RUTAS, 'salida', c);
export const leerCorrecciones = (c) => leer(fCorrecciones(c), {});
// capitales con lista de calles preparada (las únicas que se pueden trazar)
export const capitalesConLista = () => CAPITALES.filter((c) => fs.existsSync(fLista(c)));
// nombre de cada hermandad (portal-cofrade/data/portal.json), para el editor y los informes
let _nombres = null;
export const nombreDe = (id) => { if (!_nombres) { const P = leer(path.join(RAIZ, 'portal-cofrade', 'data', 'portal.json'), { hermandades: [] }); _nombres = new Map(P.hermandades.map((h) => [h.slug, h.nombre])); } return _nombres.get(id) || id; };

export const sn = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\(.*?\)/g, ' ').replace(/[.,;:]/g, ' ').replace(/\s+/g, ' ').trim();
const TIPO = /\b(calle|plaza|plazuela|plza|pza|avenida|avda|paseo|pasillo|pasaje|camino|carrera|callejon|calleja|rampa|glorieta|llano|c)\b/g;
export const clave = (s) => sn(s).replace(TIPO, ' ').replace(/\b(de|del|la|las|los|el)\b/g, ' ').replace(/\s+/g, ' ').trim();
export const tipoDe = (s) => { const m = sn(s).match(/^(plaza|plazuela|avenida|paseo|pasillo|pasaje|glorieta|llano|puente|alameda|rampa)\b/); return m ? (m[1] === 'plazuela' ? 'plaza' : m[1]) : null; };
export const TEMPLO = /^(real )?(iglesia|parroquia|basilica|capilla|oratorio|santuario|ermita|abadia|casa hermandad|templo|seminario|colegiata)/; // «Real Iglesia de San Pablo», «Real Colegiata de San Hipólito» (Córdoba)
const ANDABLE = /^(primary|secondary|tertiary|residential|pedestrian|living_street|unclassified|footway|steps|service|road|path|cycleway|track)(_link)?$/;
export const d2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const dSeg = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy, t = L ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)) : 0; return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
export const anilloDe = (X, w) => w.geometry.filter(Boolean).map((g) => X(g.lat, g.lon));
export const dAnillo = (R, p) => { let m = Infinity; for (let i = 1; i < R.length; i++) m = Math.min(m, dSeg(p, R[i - 1], R[i])); return m; };
export const dentro = (R, [x, y]) => { let c = false; for (let i = 0, j = R.length - 1; i < R.length; j = i++) if ((R[i][1] > y) !== (R[j][1] > y) && x < (R[j][0] - R[i][0]) * (y - R[i][1]) / (R[j][1] - R[i][1]) + R[i][0]) c = !c; return c; };
const lev = (a, b) => { if (Math.abs(a.length - b.length) > 3) return 9; const m = Array.from({ length: b.length + 1 }, (_, i) => i); for (let i = 1; i <= a.length; i++) { let p = m[0]; m[0] = i; for (let j = 1; j <= b.length; j++) { const t = m[j]; m[j] = Math.min(m[j] + 1, m[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1)); p = t; } } return m[b.length]; };

// Lista oficial de una capital (rutas/listas/<c>.json; formato en el README). Devuelve { id: {calles, fuente, horas, hitos:Set, regreso_desde, rejilla, notas} }
export function leerLista(c) {
  const L = leer(fLista(c), null); if (!L) throw new Error(`no hay lista de calles para ${c} (${path.relative(RAIZ, fLista(c))})`);
  return Object.fromEntries(Object.entries(L.hermandades).map(([id, h]) => [id, { ...h, fuente: h.fuente || L.fuente, horas: h.horas || {}, hitos: new Set(h.hitos || []) }]));
}

const cache = new Map();
export function ciudad(c) {
  if (cache.has(c)) return cache.get(c);
  const cfg = CIUDADES[c]; if (!cfg) throw new Error('capital desconocida: ' + c + ' (válidas: ' + CAPITALES.join(', ') + ')');
  const fOsm = path.join(ITI, 'cache', 'osm-' + c + '.json'); if (!fs.existsSync(fOsm)) throw new Error('falta el callejero ' + path.relative(RAIZ, fOsm));
  const osm = JSON.parse(fs.readFileSync(fOsm, 'utf8'));
  const ALIAS = leer(path.join(ITI, 'alias-calles-' + c + '.json'), {});
  const CASAS = leer(path.join(ITI, 'casas-hermandad-' + c + '.json'), {});
  const NOM = leer(path.join(ITI, 'cache', 'nominatim-' + c + '.json'), {});
  const LISTAS = fs.existsSync(fLista(c)) ? leerLista(c) : {};
  const MARCA = cfg.marcas || /^$^/, REGRESO = cfg.regreso || null, CATEDRAL = cfg.catedral?.texto || /^$^/;

  // ---- proyección local en metros (origen fijo por capital o centro del callejero) ----
  let O = cfg.origen;
  if (!O) { let la0 = 90, la1 = -90, lo0 = 180, lo1 = -180; for (const e of osm.elements) for (const g of e.geometry || []) if (g) { la0 = Math.min(la0, g.lat); la1 = Math.max(la1, g.lat); lo0 = Math.min(lo0, g.lon); lo1 = Math.max(lo1, g.lon); } O = [(la0 + la1) / 2, (lo0 + lo1) / 2]; }
  const kx = 111320 * Math.cos(O[0] * Math.PI / 180), ky = 110540;
  const X = (la, lo) => [(lo - O[1]) * kx, (O[0] - la) * ky];
  const LL = (x, y) => [O[0] - y / ky, O[1] + x / kx];

  // ---- callejero ----
  const VIAS = []; // {id, nombre, nombres:[[clave, coste]], tipo, highway, pts:[[x,y]], nodos:[idx]}
  const NODOS = []; const idn = new Map();
  const nodo = (la, lo) => { const k = la.toFixed(7) + ',' + lo.toFixed(7); let i = idn.get(k); if (i === undefined) { i = NODOS.length; idn.set(k, i); NODOS.push({ la, lo, xy: X(la, lo), vias: [] }); } return i; };
  for (const e of osm.elements) {
    const t = e.tags || {};
    if (e.type !== 'way' || !e.geometry) continue;
    const anda = ANDABLE.test(t.highway || ''), plaza = t.place === 'square' || (t.highway === 'pedestrian' && t.area === 'yes');
    if (!anda && !plaza) continue;
    if (t.access === 'private' || t.foot === 'no') continue;
    const nombres = []; for (const [k, co] of [['name', 0], ['official_name', 3], ['alt_name', 5], ['old_name', 8], ['short_name', 5], ['bridge:name', 3]]) if (t[k]) for (const n of t[k].split(';')) { const cl = clave(n); if (cl && !nombres.some((x) => x[0] === cl)) nombres.push([cl, co]); }
    const v = { id: e.id, nombre: t.name || null, nombres, tipo: tipoDe(t.name || ''), highway: t.highway || 'plaza', area: plaza, pts: [], nodos: [] };
    for (const g of e.geometry) { if (!g) continue; const i = nodo(g.lat, g.lon); v.nodos.push(i); v.pts.push(NODOS[i].xy); NODOS[i].vias.push(VIAS.length); }
    VIAS.push(v);
  }
  const VIA_POR_ID = new Map(VIAS.map((v, i) => [v.id, i]));
  const porClave = new Map(); VIAS.forEach((v, i) => { for (const [cl, co] of v.nombres) (porClave.get(cl) || porClave.set(cl, []).get(cl)).push([i, co]); });
  const CLAVES = [...porClave.keys()];
  // rejilla de tramos para buscar «qué calle hay aquí»
  const CEL = 40, rejT = new Map();
  VIAS.forEach((v, i) => { for (let j = 1; j < v.pts.length; j++) { const a = v.pts[j - 1], b = v.pts[j]; const x0 = Math.floor(Math.min(a[0], b[0]) / CEL), x1 = Math.floor(Math.max(a[0], b[0]) / CEL), y0 = Math.floor(Math.min(a[1], b[1]) / CEL), y1 = Math.floor(Math.max(a[1], b[1]) / CEL); for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) { const k = x + ':' + y; (rejT.get(k) || rejT.set(k, []).get(k)).push([i, j]); } } });
  function viasCerca(p, r) { const out = new Map(); const cx = Math.floor(p[0] / CEL), cy = Math.floor(p[1] / CEL), R = Math.ceil(r / CEL); for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) for (const [i, j] of rejT.get((cx + a) + ':' + (cy + b)) || []) { const d = dSeg(p, VIAS[i].pts[j - 1], VIAS[i].pts[j]); if (d <= r && !(out.get(i) <= d)) out.set(i, d); } return out; }

  // ---- parecido de nombres: claves de OSM que se parecen a la del itinerario, con un coste (en metros equivalentes) ----
  function clavesParecidas(k) {
    const out = new Map(), sp = k.replace(/ /g, '');
    for (const cc of CLAVES) {
      let coste = null;
      if (cc === k) coste = 0;
      else if (cc.replace(/ /g, '') === sp) coste = 5;
      else if (k.length >= 4 && (cc.endsWith(' ' + k) || cc.startsWith(k + ' ') || k.endsWith(' ' + cc) || k.startsWith(cc + ' ')) && Math.min(cc.length, k.length) >= 4) coste = 25;
      else if (sp.length >= 6) { const d = lev(sp, cc.replace(/ /g, '')); if (d <= Math.max(1, Math.floor(sp.length / 8))) coste = 12 * d; }
      if (coste !== null) out.set(cc, coste);
    }
    return out;
  }
  // ---- candidatas: tramos de OSM con ese nombre, agrupados en piezas conexas (dos calles homónimas = dos candidatas) ----
  function candidatas(token) {
    const al = ALIAS[token];
    const k = clave(al && !al.startsWith('geo:') && !al.startsWith('osm:') ? al : token);
    const tTok = tipoDe(token);
    const vias = new Map(); // via → coste de nombre
    for (const [cc, coste] of clavesParecidas(k)) for (const [i, extra] of porClave.get(cc)) { const tc = tTok && VIAS[i].tipo && VIAS[i].tipo !== tTok ? 15 : 0; const co = coste + extra + tc; if (!(vias.get(i) <= co)) vias.set(i, co); }
    return agrupar(vias);
  }
  function agrupar(vias) {
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
  function caminoDentro(cand, a, b) {
    if (a === b) return [a];
    const ady = new Map(); for (const i of cand.vias) { const ns = VIAS[i].nodos; for (let j = 1; j < ns.length; j++) { const u = ns[j - 1], v = ns[j], w = d2(NODOS[u].xy, NODOS[v].xy); (ady.get(u) || ady.set(u, []).get(u)).push([v, w]); (ady.get(v) || ady.set(v, []).get(v)).push([u, w]); } }
    const dist = new Map([[a, 0]]), de = new Map(), cola = [[0, a]];
    while (cola.length) { cola.sort((x, y) => x[0] - y[0]); const [d, u] = cola.shift(); if (u === b) break; if (d > dist.get(u)) continue; for (const [v, w] of ady.get(u) || []) if (d + w < (dist.get(v) ?? Infinity)) { dist.set(v, d + w); de.set(v, u); cola.push([d + w, v]); } }
    if (!dist.has(b)) return null; const r = [b]; let u = b; while (de.has(u)) { u = de.get(u); r.push(u); } return r.reverse();
  }

  // ---- templos, puertas y sedes ----
  const LUG = osm.elements.filter((e) => e.tags?.name && e.geometry && !ANDABLE.test(e.tags.highway || '') && (e.tags.amenity === 'place_of_worship' || /iglesia|parroquia|basilica|capilla|ermita|santuario|oratorio|abadia/.test(sn(e.tags.name))));
  const fPu = path.join(ITI, 'cache', 'osm-' + c + '-puertas.json');
  const PUERTAS = fs.existsSync(fPu) ? JSON.parse(fs.readFileSync(fPu, 'utf8')).elements.filter((e) => e.type === 'node').map((e) => ({ ...e, xy: X(e.lat, e.lon) })) : [];
  const anillo = (w) => anilloDe(X, w);
  const centro = (e) => { const g = e.geometry.filter(Boolean); return [g.reduce((a, q) => a + q.lat, 0) / g.length, g.reduce((a, q) => a + q.lon, 0) / g.length]; };
  const dirPartes = (dir) => { const m = dir && dir.match(/((?:calle|plaza|plazuela|pasillo|pasaje|avenida|paseo|camino|carretera|alameda|barrera|cuesta|ronda)\b[^,\d]*?)\s+(\d+)/i); return m ? { calle: clave(m[1]), num: m[2] } : null; };
  const numDe = (e) => String(e.tags['addr:housenumber'] || '').split(/[;,]/).flatMap((s) => { const r = s.match(/^(\d+)-(\d+)$/); return r ? Array.from({ length: Math.min(+r[2] - +r[1], 40) + 1 }, (_, i) => String(+r[1] + i)) : [s.trim()]; });
  const sinCiudad = (dir) => dir.replace(new RegExp(',\\s*' + cfg.nombre + '$'), '');
  // por nombre exacto, luego contenido; por último sin el tipo («Parroquia de San Lorenzo» = «Iglesia de San Lorenzo»), si es único
  const sinTipo = (s) => sn(s).replace(/^(real |insigne |santa |pontificia )*(iglesia|parroquia|basilica|capilla|ermita|santuario|oratorio|abadia|convento|monasterio)( (menor|mayor|conventual|parroquial))?( de| del)? /, '');
  function temploOSM(nom) { const k = sn(nom); const r = LUG.find((x) => sn(x.tags.name) === k) || LUG.find((x) => sn(x.tags.name).includes(k) || k.includes(sn(x.tags.name))); if (r) return r; const t = sinTipo(nom); const m = t.length >= 5 ? LUG.filter((x) => sinTipo(x.tags.name) === t) : []; return m.length === 1 ? m[0] : null; }
  // Sede (salida o entrada) a partir del texto del itinerario: {punto:[la,lo], edificio?, dir?, fuente, como}
  function sedeDe(id, texto) {
    const s = sn(texto), cs = CASAS[id];
    const desdeDir = (dir, fuente) => { // puerta OSM con esa dirección; si no, Nominatim en caché
      const dp = dirPartes(dir);
      if (dp) { const m = PUERTAS.filter((e) => clave(e.tags['addr:street'] || e.tags['addr:place'] || '') === dp.calle && numDe(e).includes(dp.num)); if (m.length) { const e = m.sort((a, b) => (b.tags.entrance === 'main') - (a.tags.entrance === 'main'))[0]; return { punto: [e.lat, e.lon], dir, fuente, como: `puerta OSM ${e.id} con la dirección ${sinCiudad(dir)}`, puerta: e.id }; } }
      const n = NOM[dir]; if (n) return { punto: [n.lat, n.lon], dir, fuente, como: 'dirección por Nominatim (caché)' };
      return null;
    };
    if (s.startsWith('casa hermandad') || (cs && !TEMPLO.test(s))) {
      if (!cs) return null;
      if (cs.punto) return { punto: cs.punto, dir: cs.dir, fuente: cs.fuente, como: `punto fijado con fuente (casas-hermandad-${c}.json)` };
      return desdeDir(cs.dir, cs.fuente);
    }
    const al = ALIAS['@' + texto];
    if (al?.startsWith('geo:')) { const [la, lo] = al.slice(4).split(',').map(Number); return { punto: [la, lo], fuente: `alias-calles-${c}.json`, como: 'punto fijado (alias)' }; }
    const w = temploOSM(al?.startsWith('osm:') ? al.slice(4) : texto.replace(/\(.*?\)/g, '').trim());
    if (w) return { punto: centro(w), edificio: w, fuente: 'OpenStreetMap ' + w.type + ' ' + w.id, como: 'templo en OSM: ' + w.tags.name };
    if (al && !al.startsWith('osm:')) { const r = desdeDir(al, `alias-calles-${c}.json`); if (r) { const w2 = LUG.find((e) => dentro(anillo(e), X(...r.punto))); return w2 ? { ...r, edificio: w2 } : r; } }
    if (cs && cs.punto && /^(iglesia|parroquia|basilica|capilla)/i.test(cs.dir || '')) return { punto: cs.punto, dir: cs.dir, fuente: cs.fuente, como: 'punto fijado con fuente' };
    if (NOM[texto]) return { punto: [NOM[texto].lat, NOM[texto].lon], fuente: 'Nominatim (caché)', como: 'templo por Nominatim (caché)' };
    return null;
  }
  // Puerta de la sede que da a la primera (o última) calle del recorrido: nodo entrance/door de OSM en el contorno del edificio.
  function puertaHacia(sede, cand) {
    if (!sede || sede.puerta || !sede.edificio || !cand) return null;
    const R = anillo(sede.edificio);
    const ps = PUERTAS.filter((e) => dAnillo(R, e.xy) < 4);
    if (!ps.length) return null;
    const dC = (e) => Math.min(...cand.pts.map((p) => d2(p, e.xy)));
    const e = ps.map((e) => [e, dC(e) - (e.tags.entrance === 'main' ? 5 : 0)]).sort((a, b) => a[1] - b[1])[0][0];
    return { punto: [e.lat, e.lon], como: `puerta OSM ${e.id} (${e.tags.entrance || e.tags.door}) del edificio, la más cercana a la calle por la que sale/entra`, puerta: e.id };
  }
  // Puerta que no está en OSM: punto medio de la fachada de un edificio (anillo R) que da a una calle (candidata). Fachada = lados
  // del contorno que quedan a la distancia mínima de esa calle (+6 m), seguidos; se toma el tramo seguido más largo.
  // La usa puertas-cadiz.mjs con la calle de la portada según una fuente.
  function fachadaHacia(R, cand) {
    const segs = cand.vias.flatMap((i) => VIAS[i].pts.slice(1).map((p, j) => [VIAS[i].pts[j], p]));
    if (!segs.length || R.length < 3) return null;
    const dC = (p) => Math.min(...segs.map(([a, b]) => dSeg(p, a, b)));
    const lados = []; for (let i = 1; i < R.length; i++) lados.push({ a: R[i - 1], b: R[i], L: d2(R[i - 1], R[i]), d: dC([(R[i - 1][0] + R[i][0]) / 2, (R[i - 1][1] + R[i][1]) / 2]) });
    const umbral = Math.min(...lados.map((l) => l.d)) + 6;
    const n = lados.length, k0 = lados.findIndex((l) => l.d > umbral); // se empieza a contar tras un lado lejano (el contorno es cerrado)
    let mejor = null, run = null;
    for (let s = 1; s <= n; s++) {
      const l = lados[(Math.max(k0, 0) + s) % n];
      if (l.d <= umbral) { run = run || { lados: [], L: 0 }; run.lados.push(l); run.L += l.L; if (!mejor || run.L > mejor.L) mejor = run; } else run = null;
    }
    if (!mejor) return null;
    let falta = mejor.L / 2, p = mejor.lados[0].a;
    for (const l of mejor.lados) { if (falta <= l.L) { const t = l.L ? falta / l.L : 0; p = [l.a[0] + (l.b[0] - l.a[0]) * t, l.a[1] + (l.b[1] - l.a[1]) * t]; break; } falta -= l.L; }
    return { punto: LL(...p), como: `punto medio de la fachada que da a «${cand.nombre}» (${Math.round(mejor.L)} m; la puerta no está en OSM)`, fachada: true };
  }
  // puerta de la catedral: nodo OSM (id) o, si la puerta no está en OSM, un punto { lat, lon, id: 'descripción' } con su nota
  const puertaCat = (v) => (v && typeof v === 'object' ? v : PUERTAS.find((e) => e.id === v));
  const PUERTA_CATEDRAL = cfg.catedral ? { entra: puertaCat(cfg.catedral.entra), sale: puertaCat(cfg.catedral.sale), nombre: cfg.catedral.nombre } : { entra: null, sale: null };
  // una hermandad puede entrar o salir por otra puerta que la de la capital (lista: "catedral": { "entra": nodo, "sale": nodo, "nombre": "…" })
  const puertaCatedral = (L) => { const o = L?.catedral; if (!o) return PUERTA_CATEDRAL; const pu = (n, d) => (n ? puertaCat(n) || null : d); return { entra: pu(o.entra, PUERTA_CATEDRAL.entra), sale: pu(o.sale, PUERTA_CATEDRAL.sale), nombre: o.nombre || PUERTA_CATEDRAL.nombre }; };

  // Trazado publicado en site/data/recorridos/<c>.json, como {ida, regreso} en [lat, lon] (para compararlo con el nuevo)
  function publicado(id) {
    const R = leer(fPublicado(c), null); const h = R?.hermandades?.[id]; if (!h?.tramos) return null;
    const pts = h.tramos.paso || Object.values(h.tramos)[0]; const geo = []; let k = -1;
    const pon = (q) => { const u = geo.at(-1); if (!u || u[0] !== q[0] || u[1] !== q[1]) geo.push(q); };
    for (const p of pts) { if (p.lat == null) continue; pon([p.lat, p.lon]); if (p.tramo === 'regreso' && k < 0) k = geo.length - 1; for (const v of p.via || []) pon(v); }
    if (k < 0) k = geo.length - 1;
    return { ida: geo.slice(0, k + 1), regreso: geo.slice(k), puntos: pts };
  }

  const C = { c, cfg, nombre: cfg.nombre, fachadaHacia, O, kx, ky, X, LL, ALIAS, CASAS, NOM, LISTAS, MARCA, REGRESO, CATEDRAL, VIAS, NODOS, VIA_POR_ID, CLAVES, porClave, viasCerca, clavesParecidas, candidatas, agrupar, caminoDentro, LUG, PUERTAS, anillo, sedeDe, puertaHacia, PUERTA_CATEDRAL, puertaCatedral, publicado, leerCorrecciones: () => leerCorrecciones(c), fCorr: fCorrecciones(c) };
  cache.set(c, C);
  return C;
}

// capital e ids desde la línea de órdenes: «node x.mjs malaga pasion paloma» (los ids pueden ir sin «-<capital>»)
export function argumentos(argv = process.argv.slice(2)) {
  const [c, ...resto] = argv;
  if (!c || !CIUDADES[c]) { console.error('Uso: node <script> <capital> [id …]   capitales: ' + CAPITALES.join(', ')); process.exit(1); }
  const L = leerLista(c), todos = Object.keys(L);
  const ids = resto.length ? todos.filter((id) => resto.some((s) => id === s || id === s + '-' + c)) : todos;
  if (resto.length && ids.length < resto.length) console.error('Aviso: ids no encontrados en la lista: ' + resto.filter((s) => !todos.some((id) => id === s || id === s + '-' + c)).join(', '));
  return { c, ids };
}
