// Ocho Capitales · Málaga: reconstruye cada recorrido DESDE EL ITINERARIO OFICIAL EN TEXTO (PDF de la Agrupación 2026).
// Entrada : cache/malaga-itinerarios-texto.json (parsear-acc-malaga.mjs) + cache/osm-malaga.json + malaga-horarios-2026.json (horas)
// Método  : por cada calle de la lista, en orden, camino mínimo por el grafo de calles de OSM pasando por esa calle
//           (se elige el punto de entrada que minimiza el recorrido hasta la calle siguiente). Nada de coordenadas de rejilla.
// Salida  : site/data/recorridos/malaga.json (solo las hermandades pedidas) y cache/malaga-reconstruccion.json (informe de comprobación)
// Uso     : node tools/itinerarios/reconstruir-malaga.mjs [id1 id2 ...]      (sin ids = todas)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(DIR, '..', '..');
const FUENTE_URL = 'https://agrupaciondecofradias.com/wp-content/uploads/2026/02/Horarios_ACC_SS_2026.pdf';
const ANDABLE = /^(primary|secondary|tertiary|residential|pedestrian|living_street|unclassified|footway|steps|service|road|path|cycleway|trunk)(_link)?$/;

// PDF (posición) → id del portal. Comprobado a mano contra cabecera + parroquia + sede de cada ficha.
const ORDEN = ['pollinica', 'lagrimas-y-favores', 'dulce-nombre', 'salutacion', 'humildad', 'salud', 'humildad-y-paciencia', 'huerto', 'prendimiento', 'pasion', 'crucifixion', 'gitanos', 'dolores-del-puente', 'cautivo', 'estudiantes', 'rocio', 'penas', 'nueva-esperanza', 'humillacion-y-estrella', 'rescate', 'sentencia', 'fusionadas', 'mediadora', 'salesianos', 'sangre', 'el-rico', 'paloma', 'expiracion', 'sagrada-cena', 'vineros', 'santa-cruz', 'vera-cruz', 'mena', 'zamarrilla', 'misericordia', 'esperanza', 'monte-calvario', 'descendimiento', 'amor', 'dolores-de-san-juan', 'traslado', 'piedad', 'santo-sepulcro', 'servitas', 'resucitado'].map((x) => x + '-malaga');
// Alias de nombre de calle (itinerario → nombre en OSM). Solo cuando OSM la llama distinto.
const ALIAS = JSON.parse(fs.existsSync(path.join(DIR, 'alias-calles-malaga.json')) ? fs.readFileSync(path.join(DIR, 'alias-calles-malaga.json'), 'utf8') : '{}');
// Puntos del itinerario que no son calles (marcas del recorrido): se conservan como hitos sin geometría propia.
const CASAS = fs.existsSync(path.join(DIR, 'casas-hermandad-malaga.json')) ? JSON.parse(fs.readFileSync(path.join(DIR, 'casas-hermandad-malaga.json'), 'utf8')) : {};
const MARCA = /^(tribuna|s i c b|torre sur|postigo de los abades|estacion de penitencia|patio de los naranjos)/;
const TEMPLO = /^(iglesia|parroquia|basilica|capilla|oratorio|santuario|ermita|abadia|casa hermandad|templo|seminario|via dolorosa)/;

const sn = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\(.*?\)/g, ' ').replace(/[.,;:]/g, ' ').replace(/\s+/g, ' ').trim();
const TIPO = /\b(calle|plaza|plazuela|plza|pza|avenida|avda|paseo|pasillo|camino|carrera|callejon|calleja|rampa|glorieta|c)\b/g;
const ART = /\b(de|del|la|las|los|el|y|e|en|a|al|san|santa)\b/g; // se mantiene "san/santa" fuera: ver clave()
const clave = (s) => sn(s).replace(TIPO, ' ').replace(/\b(de|del|la|las|los|el)\b/g, ' ').replace(/\s+/g, ' ').trim();

const osm = JSON.parse(fs.readFileSync(path.join(DIR, 'cache', 'osm-malaga.json'), 'utf8'));
const PDF = JSON.parse(fs.readFileSync(path.join(DIR, 'cache', 'malaga-itinerarios-texto.json'), 'utf8'));
const HOR = JSON.parse(fs.readFileSync(path.join(DIR, 'malaga-horarios-2026.json'), 'utf8')).fichas;
const fRec = path.join(RAIZ, 'site', 'data', 'recorridos', 'malaga.json');
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
function temploOSM(nom) { const k = sn(nom); const e = LUG.find((x) => sn(x.tags.name) === k) || LUG.find((x) => sn(x.tags.name).includes(k) || k.includes(sn(x.tags.name))); if (!e) return null; const [lat, lon] = centro(e); return { lat, lon, osm: 'OSM: ' + e.tags.name }; }
async function lugarTemplo(txt) {
  { const al = ALIAS['@' + txt]; const nom = al && al.startsWith('osm:') ? al.slice(4) : (al ? null : txt.replace(/\(.*?\)/g, '').trim()); if (nom) { const r = temploOSM(nom); if (r) return r; } if (al && al.startsWith('osm:')) return null; }
  const q = (ALIAS['@' + txt] || txt).replace(/\(.*?\)/g, '').trim();
  if (NOM[q] !== undefined) return NOM[q];
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=3&viewbox=-4.55,36.78,-4.33,36.66&bounded=1&q=' + encodeURIComponent(q + ', Málaga');
  await new Promise((r) => setTimeout(r, 1100));
  const res = await (await fetch(url, { headers: { 'User-Agent': 'OchoCapitales-verificacion/1.0 (pablossanchez.02@gmail.com)' } })).json();
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
async function reconstruir(idx) {
  const id = ORDEN[idx], P = PDF[idx], H = HOR.find((f) => sn(f.cabecera).slice(0, 40) === sn(P.cabecera.replace(/\d\d:\d\dh/g, '').replace(/\s+/g, ' ')).slice(0, 40)) || HOR[idx];
  const FIN = /^(.*?)\s+(?:y|e)\s+(?:a su\s+)?(templo|casa hermandad|iglesia.*|parroquia.*|bas[ií]lica.*|capilla.*|oratorio.*|santuario.*|ermita.*|abad[ií]a.*)\.?$/i;
  const toks = P.itinerario.flatMap((t0, i, arr) => { const m = i === arr.length - 1 ? t0.match(FIN) : null; if (!m) return [t0.replace(/\.$/, '').trim()]; const esCasa = /^casa hermandad$/i.test(m[2]); const dest = esCasa ? 'Casa Hermandad' : /^templo$/i.test(m[2]) ? (/^casa hermandad/i.test(arr[0]) ? 'Casa Hermandad' : arr[0]) : m[2]; return [m[1].trim(), dest.replace(/\.$/, '').trim()]; });
  const PRE = { 'Especerías': 'Especería', 'Molina Larios': 'Molina Lario', 'Par ras': 'Parras', 'Carreterías': 'Carretería', 'asa Hermandad': 'Casa Hermandad', 'Alameda': 'Alameda Principal', 'Rosa Magistrado': 'Rosa', 'Salvador Barberá': 'Magistrado Salvador Barberá', 'Pasaje de Campos': 'Pasaje Campos', 'Párroco Ruiz Furest': 'Párrocco Ruiz Furest' };
  const toks0 = toks.flatMap((t) => (t === 'Molina Lario Torre Sur' ? ['Molina Lario', 'Torre Sur'] : [PRE[t] || t]));
  toks.length = 0; toks.push(...toks0);
  const informe = { id, fuente: FUENTE_URL, cabecera: P.cabecera.replace(/\s+/g, ' ').slice(0, 160), errores: [], avisos: [], calles: toks };
  const pasos = []; // {lugar, tipo:'calle'|'marca'|'templo', nodos:Set|null, punto:[la,lo]|null}
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i], s = sn(t);
    if (MARCA.test(s)) { pasos.push({ lugar: t, tipo: 'marca' }); continue; }
    if (TEMPLO.test(s)) {
      if (s.startsWith('casa hermandad')) {
        const cs = CASAS[id];
        if (cs) { const L = await lugarTemplo(cs.dir); if (L) { pasos.push({ lugar: t + ' (' + cs.dir.replace(/, Málaga$/, '') + ')', tipo: 'templo', punto: [L.lat, L.lon], osm: L.osm, fuente_casa: cs.fuente }); informe.casa = cs; continue; } }
        pasos.push({ lugar: t, tipo: 'casa' }); continue;
      }
      const L = await lugarTemplo(ALIAS['@' + t] || t); if (!L) { informe.avisos.push('templo no localizado en OSM/Nominatim: ' + t + ' (salida/entrada aproximadas en la primera/última calle)'); informe.templo_sin_localizar = true; pasos.push({ lugar: t, tipo: 'casa' }); continue; }
      pasos.push({ lugar: t, tipo: 'templo', punto: [L.lat, L.lon], osm: L.osm }); continue;
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
  for (const p of cal) { if (p.tipo === 'calle' || p.tipo === 'punto') { if (p.tipo === 'calle' && !p.nodos.size) continue; if (p.tipo === 'calle' && ![...p.nodos].some((n) => comp[n] === PRINCIPAL)) { informe.avisos.push(`«${p.lugar}» no está conectada a la red en OSM: omitida del trazado`); continue; } if (seq.length && seq.at(-1).clave && seq.at(-1).clave === p.clave) continue; seq.push(p); } }
  const pIni = cal[0], pFin = cal[cal.length - 1];
  const lejos = (p, vecino) => { if (p.tipo !== 'templo' || !vecino?.nodos) return false; const [x, y] = X(...p.punto); let m = Infinity; for (const n of vecino.nodos) m = Math.min(m, Math.hypot(nodos[n][2] - x, nodos[n][3] - y)); return m > 350; };
  if (lejos(pIni, seq[0])) { informe.avisos.push(`«${pIni.lugar}» localizado en ${pIni.osm?.slice(0, 50)} está a >350 m de «${seq[0].lugar}»: descartado, salida aproximada`); pIni.tipo = 'casa'; pIni.punto = null; }
  if (pFin !== pIni && lejos(pFin, seq.at(-1))) { informe.avisos.push(`«${pFin.lugar}» está a >350 m de «${seq.at(-1).lugar}»: descartado, entrada aproximada`); pFin.tipo = 'casa'; pFin.punto = null; }
  const ancla = (p) => { const [n, d] = cercano(...p.punto); return { n, d }; };
  const N = seq.length, S = nodos.length;
  const nodoPunto = seq.map((p) => (p.tipo === 'punto' ? cercano(...p.punto)[0] : -1));
  const dist = new Float64Array(S * (N + 1)).fill(Infinity), par = new Int32Array(S * (N + 1)).fill(-1);
  const h = new Heap(); let meta = -1;
  const inicio = [];
  if (pIni.tipo === 'templo') { const a = ancla(pIni); inicio.push(a.n); informe.salida = { lugar: pIni.lugar, osm: pIni.osm, aprox_m: Math.round(a.d) }; }
  else { for (const n of seq[0]?.nodos || []) if (comp[n] === PRINCIPAL) inicio.push(n); informe.salida = { lugar: pIni.lugar, sede_aprox: true }; }
  const finNodo = (pFin.tipo === 'templo' && pFin !== pIni) ? ancla(pFin).n : -1;
  if (!inicio.length || inicio.some((n) => n < 0)) { informe.errores.push('sin nodo de salida en la red'); return { id, informe }; }
  for (const n of inicio) { const st = n * (N + 1); dist[st] = 0; h.push(st, 0); }
  while (h.size) {
    const [d, st] = h.pop(); if (d > dist[st]) continue;
    const u = Math.floor(st / (N + 1)), k = st % (N + 1);
    if (k === N && (finNodo < 0 || u === finNodo)) { meta = st; break; }
    for (const [v, w0, cl] of ady[u]) {
      const w = LISTA.has(cl) ? w0 : w0 * 4;
      let k2 = k; if (k < N && seq[k].clave && seq[k].clave === cl) k2 = k + 1;
      while (k2 < N && seq[k2].tipo === 'punto' && nodoPunto[k2] === v) k2++; // un punto se cumple al llegar a su nodo
      const s2 = v * (N + 1) + k2, nd = d + w;
      if (nd < dist[s2]) { dist[s2] = nd; par[s2] = st; h.push(s2, nd); }
    }
    while (k < N && seq[k].tipo === 'punto' && nodoPunto[k] === u && false) { }
  }
  if (meta < 0) { informe.errores.push('sin camino que cumpla todo el itinerario en el grafo (revisar nombres/ conexiones)'); return { id, informe }; }
  const cad = []; for (let st = meta; st >= 0; st = par[st]) cad.push(st); cad.reverse();
  const nodosRuta = cad.map((st) => Math.floor(st / (N + 1)));
  const trazo = []; // primera posición en que se cumple cada elemento de seq
  { let kk = 0; trazo.push({ paso: pIni, nodo: nodosRuta[0], pos: 0 }); for (let i = 1; i < cad.length; i++) { const k2 = cad[i] % (N + 1); while (kk < k2) { trazo.push({ paso: seq[kk], nodo: nodosRuta[i], pos: i }); kk++; } } }
  trazo.push({ paso: pFin, nodo: nodosRuta.at(-1), pos: nodosRuta.length - 1 });
  // comprobaciones automáticas ----------------------------------------------------------
  const largo = nodosRuta.reduce((s, n, i) => s + (i ? dm(n, nodosRuta[i - 1]) : 0), 0); informe.largo_m = Math.round(largo);
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
  fs.mkdirSync(path.join(DIR, 'cache', 'trazas-malaga'), { recursive: true });
  fs.writeFileSync(path.join(DIR, 'cache', 'trazas-malaga', id + '.json'), JSON.stringify({ ida: nodosRuta.slice(0, posVuelta + 1).map((n) => [nodos[n][0], nodos[n][1]]), regreso: nodosRuta.slice(posVuelta).map((n) => [nodos[n][0], nodos[n][1]]), puntos: puntos.map((x) => ({ lugar: x.lugar, lat: nodos[x.nodo][0], lon: nodos[x.nodo][1], tramo: x.tramo })) }));
  informe.puerta = { errores: informe.errores.length === 0, salida_ok: informe.salida?.sede_aprox ? null : (informe.salida?.aprox_m ?? 999) < 60, salto_ok: informe.max_tramo_sin_calle_m <= 150, ratio_ok: informe.ratio < 1.7, retrocesos_ok: uturns <= 8, tiene_vuelta: iVuelta >= 0 };
  // via: vértices entre punto y punto siguiente
  const out = puntos.map((pt, i) => {
    const nx = puntos[i + 1]; const o = { fila: '', lugar: pt.lugar, ...(pt.hora ? { hora: pt.hora } : {}), lat: nodos[pt.nodo][0], lon: nodos[pt.nodo][1], como: pt.como, tramo: pt.tramo, ...(pt.rol ? { rol: pt.rol } : {}) };
    if (nx && nx.pos > pt.pos) o.via = nodosRuta.slice(pt.pos + 1, nx.pos).map((n) => [+nodos[n][0].toFixed(6), +nodos[n][1].toFixed(6)]);
    return o;
  });
  return { id, informe, puntos: out, traza: nodosRuta.map((n) => [nodos[n][0], nodos[n][1]]) };
}

const solo = process.argv.slice(2);
const informes = fs.existsSync(path.join(DIR, 'cache', 'malaga-reconstruccion.json')) ? JSON.parse(fs.readFileSync(path.join(DIR, 'cache', 'malaga-reconstruccion.json'), 'utf8')) : {};
for (let i = 0; i < ORDEN.length; i++) {
  const id = ORDEN[i]; if (solo.length && !solo.some((s) => id.startsWith(s))) continue;
  const r = await reconstruir(i); informes[id] = r.informe;
  if (r.puntos && !r.informe.errores.length) {
    const h = R.hermandades[id]; h.tramos = { paso: r.puntos }; h.fuente = FUENTE_URL; h.calles_oficiales = r.informe.calles; h.reconstruido = '2026-10-25';
  }
  const i2 = r.informe;
  console.log(id.replace('-malaga', ''), '|', i2.largo_m ?? '-', 'm | ratio', i2.ratio ?? '-', '| salida', i2.salida ? (i2.salida.sede_aprox ? 'casa(aprox)' : i2.salida.aprox_m + ' m') : '-', '| NO recorridas', (i2.calles_no_recorridas || []).length, '| avisos', i2.avisos.length, '| vueltas', i2.media_vueltas ?? '-', '| puerta', i2.puerta ? Object.entries(i2.puerta).filter(([, v]) => v === false).map(([k]) => k).join(',') || 'OK' : '-', '| ERRORES', i2.errores.length ? i2.errores.join(' ;; ') : 0);
}
fs.writeFileSync(path.join(DIR, 'cache', 'malaga-reconstruccion.json'), JSON.stringify(informes, null, 1));
fs.writeFileSync(fRec, JSON.stringify(R));
