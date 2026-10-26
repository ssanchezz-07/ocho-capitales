// Ocho Capitales · Málaga: reconstruye cada recorrido DESDE EL ITINERARIO OFICIAL EN TEXTO (PDF de la Agrupación 2026).
// Entrada : cache/malaga-itinerarios-texto.json (parsear-acc-malaga.mjs) + cache/osm-malaga.json + malaga-horarios-2026.json (horas)
// Método  : por cada calle de la lista, en orden, camino mínimo por el grafo de calles de OSM pasando por esa calle
//           (se elige el punto de entrada que minimiza el recorrido hasta la calle siguiente). Nada de coordenadas de rejilla.
// Salida  : site/data/recorridos/malaga.json (solo las hermandades pedidas) y cache/malaga-reconstruccion.json (informe de comprobación)
// Uso     : node tools/itinerarios/reconstruir-malaga.mjs [id1 id2 ...]      (sin ids = todas)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// COPIA DE LABORATORIO del método actual (origin/main bdf9903, 2026-10-26): mismas reglas; solo cambian las rutas de entrada/salida.
const LAB = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(LAB, '..', '..');
const RAIZ = path.join(DIR, '..', '..');
const FUENTE_URL = 'https://agrupaciondecofradias.com/wp-content/uploads/2026/02/Horarios_ACC_SS_2026.pdf';
const ANDABLE = /^(primary|secondary|tertiary|residential|pedestrian|living_street|unclassified|footway|steps|service|road|path|cycleway|trunk)(_link)?$/;

// PDF (posición) → id del portal. Comprobado a mano contra cabecera + parroquia + sede de cada ficha.
const ORDEN = ['pollinica', 'lagrimas-y-favores', 'dulce-nombre', 'salutacion', 'humildad', 'salud', 'humildad-y-paciencia', 'huerto', 'prendimiento', 'pasion', 'crucifixion', 'gitanos', 'dolores-del-puente', 'cautivo', 'estudiantes', 'rocio', 'penas', 'nueva-esperanza', 'humillacion-y-estrella', 'rescate', 'sentencia', 'fusionadas', 'mediadora', 'salesianos', 'sangre', 'el-rico', 'paloma', 'expiracion', 'sagrada-cena', 'vineros', 'santa-cruz', 'vera-cruz', 'mena', 'zamarrilla', 'misericordia', 'esperanza', 'monte-calvario', 'descendimiento', 'amor', 'dolores-de-san-juan', 'traslado', 'piedad', 'santo-sepulcro', 'servitas', 'resucitado'].map((x) => x + '-malaga');
// Alias de nombre de calle (itinerario → nombre en OSM). Solo cuando OSM la llama distinto.
const ALIAS = JSON.parse(fs.existsSync(path.join(LAB, 'alias-calles-malaga.json')) ? fs.readFileSync(path.join(LAB, 'alias-calles-malaga.json'), 'utf8') : '{}');
// Puntos del itinerario que no son calles (marcas del recorrido): se conservan como hitos sin geometría propia.
const CASAS = fs.existsSync(path.join(LAB, 'casas-hermandad-malaga.json')) ? JSON.parse(fs.readFileSync(path.join(LAB, 'casas-hermandad-malaga.json'), 'utf8')) : {};
const MARCA = /^(tribuna(?! de los pobres)|s i c b|torre sur|estacion de penitencia|patio de los naranjos)/;
const TEMPLO = /^(iglesia|parroquia|basilica|capilla|oratorio|santuario|ermita|abadia|casa hermandad|templo|seminario|via dolorosa)/;

const sn = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\(.*?\)/g, ' ').replace(/[.,;:]/g, ' ').replace(/\s+/g, ' ').trim();
const TIPO = /\b(calle|plaza|plazuela|plza|pza|avenida|avda|paseo|pasillo|camino|carrera|callejon|calleja|rampa|glorieta|c)\b/g;
const ART = /\b(de|del|la|las|los|el|y|e|en|a|al|san|santa)\b/g; // se mantiene "san/santa" fuera: ver clave()
const clave = (s) => sn(s).replace(TIPO, ' ').replace(/\b(de|del|la|las|los|el)\b/g, ' ').replace(/\s+/g, ' ').trim();

const osm = JSON.parse(fs.readFileSync(path.join(DIR, 'cache', 'osm-malaga.json'), 'utf8'));
const PDF = JSON.parse(fs.readFileSync(path.join(DIR, 'cache', 'malaga-itinerarios-texto.json'), 'utf8'));
const HOR = JSON.parse(fs.readFileSync(path.join(DIR, 'malaga-horarios-2026.json'), 'utf8')).fichas;
const fRec = path.join(LAB, 'malaga.json'); // copia, NO producción
const R = JSON.parse(fs.readFileSync(fRec, 'utf8'));

// ---- grafo ----
const O = [36.7213, -4.4214], kx = 111320 * Math.cos(O[0] * Math.PI / 180), ky = 110540;
const X = (la, lo) => [(lo - O[1]) * kx, (O[0] - la) * ky];
const idn = new Map(), nodos = [], ady = [], porClave = new Map(); // clave de calle → Set de nodos
const nodo = (la, lo) => { const k = la.toFixed(7) + ',' + lo.toFixed(7); let i = idn.get(k); if (i === undefined) { i = nodos.length; idn.set(k, i); nodos.push([la, lo, ...X(la, lo)]); ady.push([]); } return i; };
const nombres = new Map(); // clave → nombre OSM
for (const e of osm.elements) {
  const t = e.tags || {};
  if (!e.geometry || !(ANDABLE.test(t.highway || '') || t.place === 'square')) continue;
  if (t.access === 'private' || t.foot === 'no') continue;
  const cl = t.name ? clave(t.name) : '';
  if (cl) nombres.set(cl, t.name);
  let prev = -1;
  for (const g of e.geometry) {
    if (!g) { prev = -1; continue; }
    const i = nodo(g.lat, g.lon);
    if (cl) (porClave.get(cl) || porClave.set(cl, new Set()).get(cl)).add(i);
    if (prev >= 0 && prev !== i) { const d = Math.hypot(nodos[i][2] - nodos[prev][2], nodos[i][3] - nodos[prev][3]); ady[prev].push([i, d, cl]); ady[i].push([prev, d, cl]); }
    prev = i;
  }
}
class Heap { constructor() { this.a = []; } get size() { return this.a.length; }
  push(n, p) { const a = this.a; a.push([p, n]); let i = a.length - 1; while (i > 0) { const j = (i - 1) >> 1; if (a[j][0] <= a[i][0]) break; [a[i], a[j]] = [a[j], a[i]]; i = j; } }
  pop() { const a = this.a, top = a[0], u = a.pop(); if (a.length) { a[0] = u; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l][0] < a[m][0]) m = l; if (r < a.length && a[r][0] < a[m][0]) m = r; if (m === i) break; [a[i], a[m]] = [a[m], a[i]]; i = m; } } return top; } }
let LISTA = null; // calles del itinerario en curso: salirse de ellas cuesta 5 veces más (evita rodeos por calles que no están en la lista)
function dijkstra(fuentes, limite = 30000) { // → {dist, de}
  const dist = new Map(), de = new Map(), h = new Heap();
  for (const s of fuentes) { dist.set(s, 0); h.push(s, 0); }
  while (h.size) { const [d, u] = h.pop(); if (d > dist.get(u) || d > limite) continue; for (const [v, w0, cl] of ady[u]) { const w = LISTA && !LISTA.has(cl) ? w0 * 5 : w0; const nd = d + w; if (nd < (dist.has(v) ? dist.get(v) : Infinity)) { dist.set(v, nd); de.set(v, u); h.push(v, nd); } } }
  return { dist, de };
}
const rutaHasta = (de, t) => { const r = [t]; let u = t; while (de.has(u)) { u = de.get(u); r.push(u); } return r.reverse(); };
// componente conexa principal (los nodos aislados no sirven para anclar puntos)
const comp = new Int32Array(nodos.length).fill(-1); let nc = 0; const tam = [];
for (let i = 0; i < nodos.length; i++) { if (comp[i] >= 0 || !ady[i].length) continue; const st = [i]; comp[i] = nc; let c = 0; while (st.length) { const u = st.pop(); c++; for (const [v] of ady[u]) if (comp[v] < 0) { comp[v] = nc; st.push(v); } } tam.push(c); nc++; }
const PRINCIPAL = tam.indexOf(Math.max(...tam));
const rej = new Map(), C = 60;
nodos.forEach((n, i) => { if (!ady[i].length || comp[i] !== PRINCIPAL) return; const k = Math.floor(n[2] / C) + ':' + Math.floor(n[3] / C); (rej.get(k) || rej.set(k, []).get(k)).push(i); });
function cercano(la, lo) { const [x, y] = X(la, lo); let best = -1, bd = Infinity; const cx = Math.floor(x / C), cy = Math.floor(y / C);
  for (let r = 1; r <= 6 && best < 0; r++) for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) for (const i of rej.get((cx + a) + ':' + (cy + b)) || []) { const d = Math.hypot(nodos[i][2] - x, nodos[i][3] - y); if (d < bd) { bd = d; best = i; } }
  return [best, bd]; }
const dm = (i, j) => Math.hypot(nodos[i][2] - nodos[j][2], nodos[i][3] - nodos[j][3]);

// ---- templos (OSM + Nominatim en caché) ----
const fNom = path.join(DIR, 'cache', 'nominatim-malaga.json');
const NOM = fs.existsSync(fNom) ? JSON.parse(fs.readFileSync(fNom, 'utf8')) : {};
const LUG = osm.elements.filter((e) => e.tags?.name && e.geometry && !ANDABLE.test(e.tags.highway || '') && (e.tags.amenity === 'place_of_worship' || /iglesia|parroquia|basilica|capilla|ermita|santuario|oratorio|abadia/.test(sn(e.tags.name))));
const centro = (e) => { const g = e.geometry.filter(Boolean); return [g.reduce((a, q) => a + q.lat, 0) / g.length, g.reduce((a, q) => a + q.lon, 0) / g.length]; };
function temploOSM(nom) { const k = sn(nom); const e = LUG.find((x) => sn(x.tags.name) === k) || LUG.find((x) => sn(x.tags.name).includes(k) || k.includes(sn(x.tags.name))); if (!e) return null; const [lat, lon] = centro(e); return { lat, lon, osm: 'OSM: ' + e.tags.name, way: e }; }

// ---- puertas: nodos entrance/door de OSM (cache/osm-malaga-puertas.json, Overpass; la mayoría con la dirección del Catastro) ----
// Descarga (Overpass): [out:json];(node["entrance"](36.679,-4.481,36.767,-4.366);node["door"](36.679,-4.481,36.767,-4.366););out body;
//                      way["amenity"="place_of_worship"](36.679,-4.481,36.767,-4.366);out body geom;
const fPu = path.join(DIR, 'cache', 'osm-malaga-puertas.json');
const PUERTAS = fs.existsSync(fPu) ? JSON.parse(fs.readFileSync(fPu, 'utf8')).elements.filter((e) => e.type === 'node') : [];
const rejP = new Map();
for (const e of PUERTAS) { [e.x, e.y] = X(e.lat, e.lon); const k = Math.floor(e.x / C) + ':' + Math.floor(e.y / C); (rejP.get(k) || rejP.set(k, []).get(k)).push(e); }
const puertasCerca = (la, lo, r) => { const [x, y] = X(la, lo), cx = Math.floor(x / C), cy = Math.floor(y / C), R = Math.ceil(r / C), out = []; for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) for (const e of rejP.get((cx + a) + ':' + (cy + b)) || []) if (Math.hypot(e.x - x, e.y - y) <= r) out.push(e); return out; };
const anillo = (w) => w.geometry.filter(Boolean).map((g) => X(g.lat, g.lon));
const dAnillo = (R, x, y) => { let m = Infinity; for (let i = 1; i < R.length; i++) { const [ax, ay] = R[i - 1], [bx, by] = R[i], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L)) : 0; m = Math.min(m, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return m; };
const dentro = (R, x, y) => { let c = false; for (let i = 0, j = R.length - 1; i < R.length; j = i++) if ((R[i][1] > y) !== (R[j][1] > y) && x < (R[j][0] - R[i][0]) * (y - R[i][1]) / (R[j][1] - R[i][1]) + R[i][0]) c = !c; return c; };
const dirPartes = (dir) => { const m = dir && dir.match(/((?:calle|plaza|plazuela|pasillo|pasaje|avenida|paseo|camino|carretera|alameda|barrera)\b[^,\d]*?)\s+(\d+)/i); return m ? { calle: clave(m[1]), num: m[2] } : null; };
const numDe = (e) => String(e.tags['addr:housenumber'] || '').split(/[;,]/).flatMap((s) => { const r = s.match(/^(\d+)-(\d+)$/); return r ? Array.from({ length: Math.min(+r[2] - +r[1], 40) + 1 }, (_, i) => String(+r[1] + i)) : [s.trim()]; });
// Puerta de una sede (salida o entrada). p: {punto, way?, dir?}; vecina: clave de la primera (o última) calle del itinerario.
// Criterios, por orden: 1) puerta con la dirección de la sede; 2) puerta del edificio del templo sobre la calle por la que sale (entra);
// 3) única puerta del edificio. Si nada encaja, null (se queda el punto del templo y se avisa).
function puerta(p, vecina) {
  let w = p.way;
  const [px, py] = X(...p.punto);
  if (!w && !p.dir?.match(/^calle|^plaz|^pasillo|^pasaje|^avenida|^paseo|^camino|^barrera/i)) w = LUG.find((e) => dentro(anillo(e), px, py)); // una casa hermandad no es el templo de al lado
  const R = w ? anillo(w) : null;
  const cands = R ? puertasCerca(p.punto[0], p.punto[1], 160).filter((e) => dAnillo(R, e.x, e.y) < 4) : [];
  const mejor = (l) => l.sort((a, b) => (b.tags.entrance === 'main') - (a.tags.entrance === 'main') || Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py))[0];
  const res = (e, criterio) => ({ lat: e.lat, lon: e.lon, nodo_osm: e.id, tipo: e.tags.entrance || e.tags.door, dir_osm: [e.tags['addr:street'] || e.tags['addr:place'], e.tags['addr:housenumber']].filter(Boolean).join(' '), criterio, edificio: w ? w.tags.name : null });
  const via = (e) => clave(e.tags['addr:street'] || e.tags['addr:place'] || '');
  const dp = dirPartes(p.dir);
  if (dp) { const m = PUERTAS.filter((e) => Math.hypot(e.x - px, e.y - py) < 400).filter((e) => via(e) === dp.calle && numDe(e).includes(dp.num)); if (m.length) return res(mejor(m), 'dirección de la sede (' + p.dir.replace(/, Málaga$/, '') + ')'); }
  if (R && vecina) { const m = cands.filter((e) => via(e) === vecina); if (m.length) return res(mejor(m), 'puerta del templo con dirección en la calle del itinerario'); }
  if (R && vecina && porClave.has(vecina)) { // puerta del edificio pegada (< 20 m) a la calle o plaza por la que sale
    const dCalle = (e) => { let m = Infinity; for (const n of porClave.get(vecina)) for (const [v, , cl] of ady[n]) if (cl === vecina) m = Math.min(m, dAnillo([[nodos[n][2], nodos[n][3]], [nodos[v][2], nodos[v][3]]], e.x, e.y)); return m; };
    const m = cands.map((e) => [e, dCalle(e)]).filter(([, d]) => d < 20).sort((a, b) => a[1] - b[1]);
    if (m.length) return res(m[0][0], `puerta del templo que da a la calle del itinerario (a ${Math.round(m[0][1])} m)`);
  }
  if (R && cands.length === 1) return res(cands[0], 'única puerta del edificio en OSM');
  return null;
}
async function lugarTemplo(txt) {
  if (/^geo:/.test(txt)) { const [la, lo] = txt.slice(4).split(',').map(Number); return { lat: la, lon: lo, osm: 'punto fijado con fuente (alias-calles-malaga.json)' }; }
  { const al = ALIAS['@' + txt]; const nom = al && al.startsWith('osm:') ? al.slice(4) : (al ? null : txt.replace(/\(.*?\)/g, '').trim()); if (nom) { const r = temploOSM(nom); if (r) return r; } if (al && al.startsWith('osm:')) return null; }
  const q = (ALIAS['@' + txt] || txt).replace(/\(.*?\)/g, '').trim();
  if (NOM[q] !== undefined) return NOM[q];
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=3&viewbox=-4.55,36.78,-4.33,36.66&bounded=1&q=' + encodeURIComponent(q + ', Málaga');
  await new Promise((r) => setTimeout(r, 1100));
  const res = await (await fetch(url, { headers: { 'User-Agent': 'OchoCapitales-verificacion/1.0 (ochocapitales@gmail.com)' } })).json();
  NOM[q] = res[0] ? { lat: +res[0].lat, lon: +res[0].lon, osm: res[0].display_name.slice(0, 120) } : null;
  fs.writeFileSync(fNom, JSON.stringify(NOM, null, 1));
  return NOM[q];
}

// ---- reconstrucción de una hermandad ----
function buscarCalle(token) {
  let k = clave(ALIAS[token] || token);
  if (porClave.has(k)) return [k, porClave.get(k)];
  const cands = [...porClave.keys()].filter((c) => c.endsWith(' ' + k) || c.startsWith(k + ' ') || k.endsWith(' ' + c) || c === k.replace(/\bsan\b/, 'san'));
  if (cands.length === 1) return [cands[0], porClave.get(cands[0])];
  return [null, null, cands];
}
// Enlaces temporales entre dos calles consecutivas de la lista que están a < 35 m pero OSM no une (p. ej. Cisneros acaba a ~20 m
// del Pasillo de Santa Isabel sin tocarlo). Solo valen para la hermandad en curso y quedan anotados en su informe.
let ENLACES = [];
const quitarEnlaces = () => { for (const [i, j] of ENLACES) { ady[i] = ady[i].filter((e) => !(e[0] === j && e[3] === 'enlace')); ady[j] = ady[j].filter((e) => !(e[0] === i && e[3] === 'enlace')); } ENLACES = []; };
async function reconstruir(idx) {
  quitarEnlaces();
  const id = ORDEN[idx], P = PDF[idx], H = HOR.find((f) => sn(f.cabecera).slice(0, 40) === sn(P.cabecera.replace(/\d\d:\d\dh/g, '').replace(/\s+/g, ' ')).slice(0, 40)) || HOR[idx];
  const FIN = /^(.*?)\s+(?:y|e)\s+(?:a su\s+)?(templo|casa hermandad|iglesia.*|parroquia.*|bas[ií]lica.*|capilla.*|oratorio.*|santuario.*|ermita.*|abad[ií]a.*)\.?$/i;
  const toks = P.itinerario.flatMap((t0, i, arr) => { const m = i === arr.length - 1 ? t0.match(FIN) : null; if (!m) return [t0.replace(/\.$/, '').trim()]; const esCasa = /^casa hermandad$/i.test(m[2]); const dest = esCasa ? 'Casa Hermandad' : /^templo$/i.test(m[2]) ? (/^casa hermandad/i.test(arr[0]) ? 'Casa Hermandad' : arr[0]) : m[2]; return [m[1].trim(), dest.replace(/\.$/, '').trim()]; });
  const PRE = { 'Especerías': 'Especería', 'Molina Larios': 'Molina Lario', 'Par ras': 'Parras', 'Carreterías': 'Carretería', 'asa Hermandad': 'Casa Hermandad', 'Alameda': 'Alameda Principal', 'Larios': 'Marqués de Larios', 'Avenida del Ingeniero José María': 'Ingeniero José María Garnica', 'Rosa Magistrado': 'Rosa', 'Salvador Barberá': 'Magistrado Salvador Barberá', 'Pasaje de Campos': 'Pasaje Campos', 'Párroco Ruiz Furest': 'Párrocco Ruiz Furest' };
  const toks0 = toks.flatMap((t) => (t === 'Molina Lario Torre Sur' ? ['Molina Lario', 'Torre Sur'] : [PRE[t] || t]));
  for (let i = 0; i < toks0.length - 1; i++) if (/^(dr|doctor|dra)$/i.test(toks0[i].replace('.', ''))) { toks0[i + 1] = 'Doctor ' + toks0[i + 1].replace(/^Dr\.?\s*/i, ''); toks0.splice(i, 1); }
  for (let i = 0; i < toks0.length; i++) toks0[i] = toks0[i].replace(/^Itinerario\s+/i, '');
  // Salida doble (El Rico, Salesianos): «Templo (salida de nazarenos)», …, «Casa Hermandad (salida de los tronos)». El cortejo con los
  // tronos sale de la casa hermandad: el recorrido empieza ahí y el tramo anterior (solo nazarenos) se anota en el informe.
  let soloNazarenos = null;
  { const iT = toks0.findIndex((t) => /\(salida (?:de )?(?:los )?tronos\)/i.test(t)); if (iT > 0) { soloNazarenos = toks0.slice(0, iT); toks0.splice(0, iT); } }
  // salto de línea del PDF dentro del templo final: «Plaza de San Francisco y Capilla de María» + «Santísima de la Paloma» (Paloma)
  for (let i = 0; i < toks0.length - 1; i++) { const m = toks0[i].match(/^(.*?)\s+y\s+(Capilla de Mar[ií]a)$/i); if (m && /^sant[ií]sima/i.test(toks0[i + 1])) toks0.splice(i, 2, m[1], m[2] + ' ' + toks0[i + 1]); }
  // Si el itinerario empieza o acaba en una calle pero la hermandad tiene casa con punto fijado, la salida/entrada es la casa
  if (CASAS[id] && CASAS[id].punto) { const esT = (x) => TEMPLO.test(sn(x)); if (!esT(toks0[0])) toks0.unshift('Casa Hermandad'); if (!esT(toks0[toks0.length - 1])) toks0.push('Casa Hermandad'); }
  // Sin marca de Catedral/Torre Sur en la lista (El Rico, Resucitado) pero con hora oficial de Torre Sur: la Torre Sur está en Molina Lario,
  // y el paso que lleva esa hora es el primero por Molina Lario tras la Plaza de la Marina (después de la Tribuna). Se marca como derivado.
  let torreDerivada = false;
  if (!toks0.some((t) => /^(torre sur|estacion de penitencia|patio de los naranjos|s i c b|catedral)/.test(sn(t))) && H?.horas?.torre_sur?.length) {
    const iM = toks0.findIndex((t) => /^plaza de la marina$/.test(sn(t)));
    const iL = iM >= 0 ? toks0.findIndex((t, i) => i > iM && /^molina lario$/.test(sn(t))) : -1;
    if (iL > 0) { toks0.splice(iL + 1, 0, 'Torre Sur'); torreDerivada = true; }
  }
  toks.length = 0; toks.push(...toks0);
  const informe = { id, fuente: FUENTE_URL, cabecera: P.cabecera.replace(/\s+/g, ' ').slice(0, 160), errores: [], avisos: [], calles: toks };
  if (soloNazarenos) informe.salida_nazarenos = 'Los nazarenos salen de «' + soloNazarenos[0] + '»' + (soloNazarenos.length > 1 ? ' y van por ' + soloNazarenos.slice(1).join(', ') : '') + ' hasta la casa hermandad, de donde salen los tronos: el recorrido se dibuja desde la casa hermandad.';
  if (torreDerivada) informe.torre_sur_derivada = 'La lista oficial no cita la Torre Sur; la ficha da su hora (' + H.horas.torre_sur[0] + '). Se sitúa en Molina Lario tras la Plaza de la Marina y ahí empieza el regreso.';
  const pasos = []; // {lugar, tipo:'calle'|'marca'|'templo', nodos:Set|null, punto:[la,lo]|null}
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i], s = sn(t);
    if (MARCA.test(s)) { pasos.push({ lugar: t, tipo: 'marca' }); continue; }
    if (TEMPLO.test(s)) {
      if ((i === 0 || i === toks.length - 1) && !s.startsWith('casa hermandad') && CASAS[id] && CASAS[id].punto) { const cs = CASAS[id]; pasos.push({ lugar: t, tipo: 'templo', punto: cs.punto, osm: 'punto fijado con fuente', fuente_casa: cs.fuente, dir: cs.dir }); continue; }
      if (s.startsWith('casa hermandad')) {
        const cs = CASAS[id];
        if (cs) { const L = cs.punto ? { lat: cs.punto[0], lon: cs.punto[1], osm: 'punto fijado con fuente' } : await lugarTemplo(cs.dir); if (L) { pasos.push({ lugar: t + ' (' + cs.dir.replace(/, Málaga$/, '') + ')', tipo: 'templo', punto: [L.lat, L.lon], osm: L.osm, fuente_casa: cs.fuente, dir: cs.dir, way: L.way }); informe.casa = cs; continue; } }
        pasos.push({ lugar: t, tipo: 'casa' }); continue;
      }
      const L = await lugarTemplo(ALIAS['@' + t] || t); if (!L) { informe.avisos.push('templo no localizado en OSM/Nominatim: ' + t + ' (salida/entrada aproximadas en la primera/última calle)'); informe.templo_sin_localizar = true; pasos.push({ lugar: t, tipo: 'casa' }); continue; }
      const al = ALIAS['@' + t]; pasos.push({ lugar: t, tipo: 'templo', punto: [L.lat, L.lon], osm: L.osm, way: L.way, dir: al && !al.startsWith('osm:') ? al : (CASAS[id] && /^(iglesia|parroquia|bas[ií]lica|capilla|ermita|santuario|oratorio)/i.test(CASAS[id].dir) ? CASAS[id].dir : null) }); continue;
    }
    const [k, ns, c] = buscarCalle(t);
    if (!k) {
      const L = await lugarTemplo(ALIAS['@' + t] || t);
      const [nn, dd] = L ? cercano(L.lat, L.lon) : [-1, 0];
      if (L && dd < 60) { informe.avisos.push(`«${t}» no existe como calle en OSM: situada por Nominatim (${Math.round(dd)} m de la red)`); pasos.push({ lugar: t, tipo: 'punto', punto: [L.lat, L.lon], osm: L.osm }); continue; }
      informe.avisos.push(`«${t}» sin equivalente en OSM ni Nominatim: omitida del trazado` + (c && c.length ? ' (candidatas: ' + c.slice(0, 4).join(' | ') + ')' : '')); informe.omitidas = (informe.omitidas || 0) + 1; continue;
    }
    pasos.push({ lugar: t, tipo: 'calle', clave: k, nodos: ns });
  }
  // eliminar marcas de calle repetida consecutiva
  const cal = pasos.filter((p) => p.tipo === 'calle' || p.tipo === 'templo' || p.tipo === 'punto');
  if (cal.length < 2) { informe.errores.push('menos de 2 puntos enrutables'); return { id, informe }; }
  LISTA = new Set(cal.filter((p) => p.clave).map((p) => p.clave));
  // Búsqueda por capas: estado = (nodo, k) con k = nº de calles de la lista ya recorridas EN ORDEN. Una calle cuenta como recorrida
  // al pasar por una arista suya; los puntos (plazas sin calle en OSM) al llegar a su nodo. Se busca el camino más corto que cumple todas.
  const seq = [];
  for (const p of cal) { if (p.tipo === 'calle' || p.tipo === 'punto') { if (p.tipo === 'calle' && !p.nodos.size) continue; if (p.tipo === 'calle' && ![...p.nodos].some((n) => comp[n] === PRINCIPAL)) { const ns = [...p.nodos]; const la = ns.reduce((a, n) => a + nodos[n][0], 0) / ns.length, lo = ns.reduce((a, n) => a + nodos[n][1], 0) / ns.length; const [nn, dd] = cercano(la, lo); if (nn >= 0 && dd < 120) { informe.avisos.push(`«${p.lugar}» no conectada en OSM: el trazado pasa por su centro (a ${Math.round(dd)} m de la red)`); p.tipo = 'punto'; p.punto = [la, lo]; delete p.clave; } else { informe.avisos.push(`«${p.lugar}» no conectada a la red en OSM: omitida`); continue; } } if (seq.length && seq.at(-1).clave && seq.at(-1).clave === p.clave) continue; seq.push(p); } }
  // Un punto situado por Nominatim (calle que OSM no tiene) que cae lejos de sus vecinas de la lista es un homónimo de otro barrio
  // («Alcubilla» → La Alcubilla, Bailén-Miraflores): se descarta con aviso en vez de llevar el trazado hasta allí.
  for (let i = seq.length - 1; i >= 0; i--) {
    const p = seq[i];
    if (p.tipo === 'calle' && p.nodos) { // calle homónima de otro barrio: todos sus tramos lejos de las vecinas
      const pts = (q) => !q ? [] : q.nodos ? [...q.nodos].map((n) => [nodos[n][2], nodos[n][3]]) : q.punto ? [X(...q.punto)] : [];
      const vec = [...pts(seq[i - 1]), ...pts(seq[i + 1])]; if (!vec.length) continue;
      let d = Infinity; for (const n of p.nodos) for (const [vx, vy] of vec) { const dd = Math.hypot(nodos[n][2] - vx, nodos[n][3] - vy); if (dd < d) d = dd; }
      if (d > 600) { informe.avisos.push(`«${p.lugar}» casa con «${nombres.get(p.clave) || p.clave}», a ${Math.round(d)} m de sus calles vecinas: homónimo, omitida del trazado`); seq.splice(i, 1); }
      continue;
    }
    if (p.tipo !== 'punto' || /punto fijado/.test(p.osm || '')) continue;
    const [x, y] = X(...p.punto); const dVec = (q) => !q ? Infinity : q.nodos ? Math.min(...[...q.nodos].map((n) => Math.hypot(nodos[n][2] - x, nodos[n][3] - y))) : q.punto ? Math.hypot(X(...q.punto)[0] - x, X(...q.punto)[1] - y) : Infinity;
    const d = Math.min(dVec(seq[i - 1]), dVec(seq[i + 1]));
    if (d > 600) { informe.avisos.push(`«${p.lugar}» situado por Nominatim en ${String(p.osm || '').slice(0, 60)}, a ${Math.round(d)} m de sus calles vecinas: homónimo, omitido del trazado`); seq.splice(i, 1); }
  }
  const pIni = cal[0], pFin = cal[cal.length - 1];
  const lejos = (p, vecino) => { if (p.tipo !== 'templo' || !vecino?.nodos) return false; const [x, y] = X(...p.punto); let m = Infinity; for (const n of vecino.nodos) m = Math.min(m, Math.hypot(nodos[n][2] - x, nodos[n][3] - y)); return m > 350; };
  if (lejos(pIni, seq[0])) { informe.avisos.push(`«${pIni.lugar}» localizado en ${pIni.osm?.slice(0, 50)} está a >350 m de «${seq[0].lugar}»: descartado, salida aproximada`); pIni.tipo = 'casa'; pIni.punto = null; }
  if (pFin !== pIni && lejos(pFin, seq.at(-1))) { informe.avisos.push(`«${pFin.lugar}» está a >350 m de «${seq.at(-1).lugar}»: descartado, entrada aproximada`); pFin.tipo = 'casa'; pFin.punto = null; }
  // puerta exacta (nodo entrance/door de OSM) para la salida y la entrada
  for (const [p, vec, rol] of [[pIni, seq[0], 'salida'], [pFin, seq.at(-1), 'entrada']]) {
    if (p.tipo !== 'templo' || (rol === 'entrada' && p === pIni)) continue;
    const pu = puerta(p, vec?.clave);
    if (pu) { p.puntoTemplo = p.punto; p.punto = [pu.lat, pu.lon]; p.puerta = pu; (informe.puertas = informe.puertas || {})[rol] = pu; }
    else { (informe.puertas = informe.puertas || {})[rol] = null; informe.avisos.push(`${rol}: sin puerta en OSM que encaje (dirección o calle del itinerario); se usa el punto del templo/casa`); }
  }
  // Estación de penitencia: se entra en la Catedral por su puerta de calle Postigo de los Abades (nodo OSM 8280808444) y se sale
  // por el Patio de los Naranjos a calle Císter (puerta, nodo 2834229789). El plano no tiene paso por dentro: se añade ese enlace.
  if (toks.some((t) => /^(estacion de penitencia|patio de los naranjos|s i c b)/.test(sn(t)))) {
    const pA = PUERTAS.find((e) => e.id === 8280808444), pB = PUERTAS.find((e) => e.id === 2834229789);
    if (pA && pB) { const [a] = cercano(pA.lat, pA.lon), [c] = cercano(pB.lat, pB.lon); const dd = dm(a, c); ady[a].push([c, dd, '', 'enlace']); ady[c].push([a, dd, '', 'enlace']); ENLACES.push([a, c]); informe.por_la_catedral = `de la puerta de Postigo de los Abades a la del Patio de los Naranjos (calle Císter), ${Math.round(dd)} m`; }
  }
  { const L0 = LISTA; LISTA = null;
    for (let i = 0; i + 1 < seq.length; i++) {
      const a = seq[i], c = seq[i + 1], ns = (p) => p.nodos || (p.tipo === 'punto' ? [cercano(...p.punto)[0]] : null); const na = ns(a), nc = ns(c); if (!na || !nc) continue;
      let best = null; for (const x of na) { if (comp[x] !== PRINCIPAL) continue; for (const y of nc) { if (comp[y] !== PRINCIPAL) continue; const dd = dm(x, y); if (!best || dd < best[2]) best = [x, y, dd]; } }
      if (!best || best[2] < 1 || best[2] > 35) continue;
      const { dist: dr } = dijkstra([best[0]], 400); const red = dr.has(best[1]) ? dr.get(best[1]) : Infinity;
      if (red > Math.max(80, 3 * best[2])) { ady[best[0]].push([best[1], best[2], '', 'enlace']); ady[best[1]].push([best[0], best[2], '', 'enlace']); ENLACES.push([best[0], best[1]]); informe.avisos.push(`enlace de ${Math.round(best[2])} m entre «${a.lugar}» y «${c.lugar}»: OSM no las une (por la red, ${red === Infinity ? 'más de 400' : Math.round(red)} m)`); }
    }
    LISTA = L0; }
  const ancla = (p) => { const [n, d] = cercano(...p.punto); return { n, d }; };
  const N = seq.length, S = nodos.length;
  const nodoPunto = seq.map((p) => (p.tipo === 'punto' ? cercano(...p.punto)[0] : -1));
  // Una calle de la lista solo cuenta como recorrida si el trazado AVANZA por ella (no basta cruzarla en una esquina):
  // umbral = min(25 m, 40 % de su longitud en la red). Progreso por calle en B escalones (cada arista suma al menos uno).
  const B = 5, largoCalle = new Map();
  for (let i = 0; i < nodos.length; i++) for (const [v, w0, cl] of ady[i]) if (cl) largoCalle.set(cl, (largoCalle.get(cl) || 0) + w0 / 2);
  const umbral = seq.map((p) => (p.clave ? Math.min(25, 0.4 * (largoCalle.get(p.clave) || 0)) : 0));
  const K = (N + 1) * B, nodoDe = (st) => Math.floor(st / K), kDe = (st) => Math.floor(st / B) % (N + 1);
  const dist = new Float64Array(S * K), par = new Int32Array(S * K);
  const inicio = [];
  if (pIni.tipo === 'templo') { const a = ancla(pIni); inicio.push(a.n); informe.salida = { lugar: pIni.lugar, osm: pIni.osm, aprox_m: Math.round(a.d) }; }
  else { for (const n of seq[0]?.nodos || []) if (comp[n] === PRINCIPAL) inicio.push(n); informe.salida = { lugar: pIni.lugar, sede_aprox: true }; }
  const finNodo = (pFin.tipo === 'templo' && pFin !== pIni) ? ancla(pFin).n : -1;
  if (!inicio.length || inicio.some((n) => n < 0)) { informe.errores.push('sin nodo de salida en la red'); return { id, informe }; }
  // metros recorridos por cada calle en un trazado (una arista puede ser de dos calles a la vez)
  const metrosPorCalle = (ruta) => { const m = new Map(); for (let i = 1; i < ruta.length; i++) { const cls = new Set(); let w = 0; for (const e of ady[ruta[i - 1]]) if (e[0] === ruta[i] && e[2]) { cls.add(e[2]); w = e[1]; } for (const c of cls) m.set(c, (m.get(c) || 0) + w); } return m; };
  // Si al quitar los retrocesos se pierde una calle de la lista (el buscador la «pisó» con un pico de ida y vuelta),
  // se repite la búsqueda sin las aristas de ese pico, hasta 3 veces: así tiene que recorrerla de verdad.
  const prohibidas = new Set(); let cad, bruto, nodosRuta, mapa, previo = null;
  for (let intento = 0; ; intento++) {
    dist.fill(Infinity); par.fill(-1); const h = new Heap(); let meta = -1;
    for (const n of inicio) { const st = n * K; dist[st] = 0; h.push(st, 0); }
    while (h.size) {
      const [d, st] = h.pop(); if (d > dist[st]) continue;
      const u = nodoDe(st), k = kDe(st), b = st % B;
      if (k === N && (finNodo < 0 || u === finNodo)) { meta = st; break; }
      for (const [v, w0, cl, tipoArista] of ady[u]) {
        if (prohibidas.size && prohibidas.has(u + '>' + v)) continue;
        // solo es «de la lista» la calle que toca ahora, la anterior y la siguiente: así el regreso no reutiliza calles de la ida
        const enVentana = cl && (cl === seq[k]?.clave || cl === seq[k - 1]?.clave || cl === seq[k + 1]?.clave);
        const w = enVentana || tipoArista === 'enlace' ? w0 : w0 * 4;
        let k2 = k, b2 = 0;
        if (k < N && seq[k].clave && seq[k].clave === cl) { const T = umbral[k], acc = b * T / B + w0; if (acc >= T) k2 = k + 1; else b2 = Math.min(B - 1, Math.max(b + 1, Math.floor(acc * B / T))); }
        while (k2 < N && seq[k2].tipo === 'punto' && nodoPunto[k2] === v) { k2++; b2 = 0; } // un punto se cumple al llegar a su nodo
        const s2 = (v * (N + 1) + k2) * B + b2, nd = d + w;
        if (nd < dist[s2]) { dist[s2] = nd; par[s2] = st; h.push(s2, nd); }
      }
    }
    if (meta < 0 && previo) break; // sin el pico no hay camino: el pico era real (plaza sin salida); se queda el mejor intento
    if (meta < 0) { informe.errores.push('sin camino que cumpla todo el itinerario en el grafo (revisar nombres/ conexiones)'); return { id, informe }; }
    cad = []; for (let st = meta; st >= 0; st = par[st]) cad.push(st); cad.reverse();
    // posproceso: eliminar retrocesos A→B→A (se recorta el tramo de ida y vuelta) y recordar dónde cae cada posición original
    bruto = cad.map(nodoDe); nodosRuta = []; mapa = []; const picos = [];
    for (const n of bruto) { if (nodosRuta.length >= 2 && nodosRuta.at(-2) === n) picos.push([n, nodosRuta.pop()]); else if (nodosRuta.at(-1) !== n) nodosRuta.push(n); mapa.push(nodosRuta.length - 1); }
    for (let i = mapa.length - 2; i >= 0; i--) mapa[i] = Math.min(mapa[i], mapa[i + 1]); // una posición sobrevive solo si no fue recortada después
    const m = metrosPorCalle(nodosRuta);
    const perdidas = new Set(seq.map((p, i) => (p.clave && (m.get(p.clave) || 0) < umbral[i] * 0.99 ? p.clave : null)).filter(Boolean));
    const largoR = nodosRuta.reduce((a, n, i) => a + (i ? dm(n, nodosRuta[i - 1]) : 0), 0);
    if (!previo || perdidas.size < previo.np || (perdidas.size === previo.np && largoR < previo.largo)) previo = { cad, bruto, nodosRuta, mapa, np: perdidas.size, largo: largoR, intento };
    // Repetir sin el pico obliga a seguir la calle, pero en el casco antiguo produce rodeos absurdos (probado el 2026-10-25 en
    // Lágrimas, Rescate, El Rico y Sangre): se queda el primer intento y las calles apenas pisadas salen como aviso para revisar a mano.
    // una ida y vuelta larga (> 300 m en esa calle) no es una plaza delante del templo: es un casamiento con un tramo lejano; se recorta
    { const mB = metrosPorCalle(bruto); for (const c of [...perdidas]) if ((mB.get(c) || 0) > 300) perdidas.delete(c); }
    if (perdidas.size) { // la ida y vuelta era necesaria (la lista pasa por esa calle): no se recorta si es de una calle que se perdería
      nodosRuta = []; mapa = [];
      for (const n of bruto) { const pisa = nodosRuta.length >= 2 && nodosRuta.at(-2) === n && ady[nodosRuta.at(-1)].some((e) => e[0] === n && perdidas.has(e[2])); if (nodosRuta.length >= 2 && nodosRuta.at(-2) === n && !pisa) nodosRuta.pop(); else if (nodosRuta.at(-1) !== n) nodosRuta.push(n); mapa.push(nodosRuta.length - 1); }
      for (let i = mapa.length - 2; i >= 0; i--) mapa[i] = Math.min(mapa[i], mapa[i + 1]);
      informe.idas_y_vueltas = [...perdidas].map((c) => nombres.get(c) || c);
      previo = { ...previo, nodosRuta, mapa };
    }
    if (!perdidas.size || intento >= 0) break;
    let nuevo = false;
    // el pico fue a → c → a: se prohíbe solo la vuelta (c → a), para que entre en la calle y tenga que seguir por ella
    for (const [a, c] of picos) if (ady[a].some((e) => e[0] === c && perdidas.has(e[2])) && !prohibidas.has(c + '>' + a)) { prohibidas.add(c + '>' + a); nuevo = true; }
    if (!nuevo) break;
  }
  ({ cad, bruto, nodosRuta, mapa } = previo); if (previo.intento) informe.repeticiones = previo.intento;
  informe.retrocesos_eliminados = bruto.length - nodosRuta.length;
  if (process.env.DEPURAR === id) console.log(cad.map((st, i) => { const u = nodoDe(st), v = i ? nodoDe(cad[i - 1]) : -1; const e = v >= 0 ? ady[v].find((x) => x[0] === u) : null; return (e ? (e[2] || e[3] || "-") : "") + "@" + kDe(st) + "." + (st % B); }).join(" "));
  const trazo = []; // primera posición en que se cumple cada elemento de seq
  { let kk = 0; trazo.push({ paso: pIni, nodo: nodosRuta[0], pos: 0 }); for (let i = 1; i < cad.length; i++) { const k2 = kDe(cad[i]); while (kk < k2) { trazo.push({ paso: seq[kk], nodo: nodosRuta[mapa[i]], pos: mapa[i] }); kk++; } } }
  trazo.push({ paso: pFin, nodo: nodosRuta.at(-1), pos: nodosRuta.length - 1 });
  // comprobaciones automáticas ----------------------------------------------------------
  const largo = nodosRuta.reduce((s, n, i) => s + (i ? dm(n, nodosRuta[i - 1]) : 0), 0); informe.largo_m = Math.round(largo);
  // 0) cada calle de la lista se recorre de verdad (metros sobre sus aristas en el trazado final, tras quitar retrocesos)
  { const m = new Map(); for (let i = 1; i < nodosRuta.length; i++) { const cls = new Set(); let w = 0; for (const e of ady[nodosRuta[i - 1]]) if (e[0] === nodosRuta[i] && e[2]) { cls.add(e[2]); w = e[1]; } for (const c of cls) m.set(c, (m.get(c) || 0) + w); } // una arista puede ser de dos calles a la vez
    informe.calles_no_recorridas = seq.map((p, i) => (p.clave && (m.get(p.clave) || 0) < umbral[i] * 0.99 ? `${p.lugar} (${Math.round(m.get(p.clave) || 0)} m)` : null)).filter(Boolean);
    if (informe.calles_no_recorridas.length) informe.avisos.push('calles de la lista apenas pisadas: ' + informe.calles_no_recorridas.join(', ')); }
  // 1) salto en recta > 150 m entre vértices consecutivos
  let mx = 0; for (let i = 1; i < nodosRuta.length; i++) { const e = ady[nodosRuta[i - 1]].find((x) => x[0] === nodosRuta[i]); const d = dm(nodosRuta[i], nodosRuta[i - 1]); if (!e || !e[2]) mx = Math.max(mx, d); } informe.max_tramo_sin_calle_m = Math.round(mx); if (mx > 150) informe.avisos.push(`tramo de ${Math.round(mx)} m sin calle con nombre`);
  // 3) detour: el trazado no puede ser absurdamente más largo que la suma de rectas entre puntos
  const rect = trazo.reduce((s, t, i) => s + (i ? dm(t.nodo, trazo[i - 1].nodo) : 0), 0); informe.ratio = +(largo / Math.max(rect, 1)).toFixed(2);
  // ida/regreso: ida hasta la marca de la Catedral (Estación de Penitencia / Patio de los Naranjos / S.I.C.B.)
  const iVuelta = toks.findIndex((t) => /^(torre sur|estacion de penitencia|patio de los naranjos|s i c b|catedral)/.test(sn(t)));
  informe.divide_en_catedral = iVuelta >= 0;
  let uturns = 0; for (let i = 2; i < nodosRuta.length; i++) if (nodosRuta[i] === nodosRuta[i - 2]) uturns++;
  informe.media_vueltas = uturns; // retrocesos sobre el mismo tramo (rodeos para tocar una plaza)
  // ---- puntos para el sitio ----
  const horas = (H && H.horas) || {};
  const h1 = (k) => (horas[k] && horas[k][0]) || null;
  const puntos = []; let enRegreso = false;
  const posDe = new Map(trazo.map((t) => [t.paso, t]));
  let ultimaPos = 0;
  for (let i = 0; i < pasos.length; i++) {
    const p = pasos[i]; const tz = posDe.get(p);
    if (iVuelta >= 0 && i >= pasos.findIndex((x) => x.lugar === toks[iVuelta])) enRegreso = true;
    if (tz) { ultimaPos = tz.pos; puntos.push({ lugar: p.lugar, nodo: nodosRuta[tz.pos], pos: tz.pos, tramo: enRegreso ? 'regreso' : 'ida', como: p.tipo === 'templo' ? 'templo' : 'calle' }); }
    else if (p.tipo === 'marca') { const nn = nodosRuta[ultimaPos]; puntos.push({ lugar: p.lugar, nodo: nn, pos: ultimaPos, tramo: enRegreso ? 'regreso' : 'ida', como: 'hito' }); }
    else if (p.tipo === 'casa' && i === 0) { /* sede aprox: el primer punto de calle ya está en puntos */ }
  }
  // horas oficiales sobre los hitos que las citan
  for (const pt of puntos) {
    const s = sn(pt.lugar);
    if (/^tribuna principal/.test(s)) pt.hora = h1('tribuna');
    if (/^torre sur/.test(s)) pt.hora = h1('torre_sur');
    if (/^estacion de penitencia/.test(s)) pt.hora = h1('catedral');
  }
  if (puntos.length) { puntos[0].hora = h1('salida'); puntos[puntos.length - 1].hora = puntos[puntos.length - 1].hora || h1('encierro'); puntos[0].rol = 'salida'; puntos[puntos.length - 1].rol = 'entrada'; }
  informe.horas_oficiales = horas;
  const posVuelta = (() => { const q = puntos.find((x) => x.tramo === 'regreso'); return q ? q.pos : nodosRuta.length; })();
  fs.mkdirSync(path.join(LAB, 'salida', 'trazas'), { recursive: true });
  fs.writeFileSync(path.join(LAB, 'salida', 'trazas', id + '.json'), JSON.stringify({ ida: nodosRuta.slice(0, posVuelta + 1).map((n) => [nodos[n][0], nodos[n][1]]), regreso: nodosRuta.slice(posVuelta).map((n) => [nodos[n][0], nodos[n][1]]), puntos: puntos.map((x) => ({ lugar: x.lugar, lat: nodos[x.nodo][0], lon: nodos[x.nodo][1], tramo: x.tramo })) }));
  informe.puerta = { errores: informe.errores.length === 0, calles_ok: !(informe.calles_no_recorridas || []).length, salida_ok: informe.salida?.sede_aprox ? null : (informe.salida?.aprox_m ?? 999) < 60, salto_ok: informe.max_tramo_sin_calle_m <= 150, ratio_ok: informe.ratio < 1.7, retrocesos_ok: uturns <= 8, tiene_vuelta: iVuelta >= 0 };
  // via: vértices entre punto y punto siguiente
  const out = puntos.map((pt, i) => {
    const nx = puntos[i + 1]; const o = { fila: '', lugar: pt.lugar, ...(pt.hora ? { hora: pt.hora } : {}), lat: nodos[pt.nodo][0], lon: nodos[pt.nodo][1], como: pt.como, tramo: pt.tramo, ...(pt.rol ? { rol: pt.rol } : {}) };
    if (nx && nx.pos > pt.pos) o.via = nodosRuta.slice(pt.pos + 1, nx.pos).map((n) => [+nodos[n][0].toFixed(6), +nodos[n][1].toFixed(6)]);
    return o;
  });
  return { id, informe, puntos: out, traza: nodosRuta.map((n) => [nodos[n][0], nodos[n][1]]) };
}

const solo = process.argv.slice(2);
const informes = fs.existsSync(path.join(LAB, 'salida', 'informe.json')) ? JSON.parse(fs.readFileSync(path.join(LAB, 'salida', 'informe.json'), 'utf8')) : {};
for (let i = 0; i < ORDEN.length; i++) {
  const id = ORDEN[i]; if (solo.length && !solo.some((s) => id.startsWith(s))) continue;
  const r = await reconstruir(i); informes[id] = r.informe;
  if (r.puntos && !r.informe.errores.length) {
    const h = R.hermandades[id]; h.tramos = { paso: r.puntos }; h.fuente = FUENTE_URL; h.calles_oficiales = r.informe.calles; h.reconstruido = '2026-10-25';
  }
  const i2 = r.informe;
  console.log(id.replace('-malaga', ''), '|', i2.largo_m ?? '-', 'm | ratio', i2.ratio ?? '-', '| salida', i2.salida ? (i2.salida.sede_aprox ? 'casa(aprox)' : i2.salida.aprox_m + ' m') : '-', '| NO recorridas', (i2.calles_no_recorridas || []).length, '| avisos', i2.avisos.length, '| vueltas', i2.media_vueltas ?? '-', '| puerta', i2.puerta ? Object.entries(i2.puerta).filter(([, v]) => v === false).map(([k]) => k).join(',') || 'OK' : '-', '| ERRORES', i2.errores.length ? i2.errores.join(' ;; ') : 0);
}
fs.writeFileSync(path.join(LAB, 'salida', 'informe.json'), JSON.stringify(informes, null, 1));
fs.writeFileSync(fRec, JSON.stringify(R));
