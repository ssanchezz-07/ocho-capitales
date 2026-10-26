// Ocho Capitales · laboratorio de rutas: MÉTODO NUEVO (emparejamiento por continuidad + GraphHopper).
// 1) Por cada calle de la lista oficial, candidatas de OSM con ese nombre (parecido aproximado), agrupadas en piezas conexas.
// 2) Se elige la cadena de candidatas en la que cada calle toca a la siguiente (Viterbi, como el ajuste de un GPS a las calles):
//    los estados son los cruces entre una calle y la siguiente; un hueco entre dos calles que no se tocan cuesta caro.
// 3) GraphHopper (perfil «procesion», pass_through = sin dar la vuelta en los puntos de paso) une sede → cruces → sede.
// 4) Las correcciones de Pablo (correcciones-malaga.json, editor) mandan sobre todo lo anterior.
// Uso: node emparejar.mjs [id1 id2 ...]   (sin ids = las 10 del laboratorio). Necesita GraphHopper en http://localhost:8989.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { LAB, LAS_10, LISTAS, ALIAS, NOM, NODOS, VIAS, VIA_POR_ID, sn, clave, MARCA, CATEDRAL, TEMPLO, X, LL, d2, candidatas, agrupar, caminoDentro, sedeDe, puertaHacia, PUERTA_CATEDRAL, leerCorrecciones } from './comun.mjs';

export const GH = process.env.GH_URL || 'http://localhost:8989';
const gapCoste = (d) => (d <= 3 ? 0 : d <= 40 ? 2 * d : d <= 400 ? 6 * d : 20 * d);

// ---- 1) fichas: qué es cada elemento de la lista ----
function fichas(id, calles, corr, informe) {
  const T = [];
  const iVuelta = calles.findIndex((t) => /^(torre sur|estacion de penitencia|patio de los naranjos|s i c b|sicb|catedral)/.test(sn(t)));
  for (let i = 0; i < calles.length; i++) {
    const t = calles[i], s = sn(t), c = corr.calles?.[i];
    const base = { i, lugar: t, tramo: iVuelta >= 0 && i >= iVuelta ? 'regreso' : 'ida' };
    if (c?.omitir) { informe.avisos.push(`«${t}» omitida por corrección (${c.fuente || 'sin fuente'})`); T.push({ ...base, tipo: 'omitida' }); continue; }
    if ((i === 0 || i === calles.length - 1) && (TEMPLO.test(s) || s.startsWith('casa hermandad'))) { T.push({ ...base, tipo: i === 0 ? 'salida' : 'entrada' }); continue; }
    if (CATEDRAL.test(s)) { const prev = T.at(-1); if (prev?.tipo === 'catedral') { prev.hasta = i; continue; } if (PUERTA_CATEDRAL.entra && PUERTA_CATEDRAL.sale) { T.push({ ...base, tipo: 'catedral', hasta: i, opciones: [{ nombre: 'Catedral (por dentro)', entra: X(PUERTA_CATEDRAL.entra.lat, PUERTA_CATEDRAL.entra.lon), sale: X(PUERTA_CATEDRAL.sale.lat, PUERTA_CATEDRAL.sale.lon), coste: 0 }] }); continue; } }
    if (MARCA.test(s)) { T.push({ ...base, tipo: 'hito' }); continue; }
    if (c?.punto) { T.push({ ...base, tipo: 'punto', opciones: [{ nombre: t + ' (corrección)', pts: [X(...c.punto)], nodos: [null], coste: 0 }] }); continue; }
    let ops = candidatas(t);
    if (c?.via) { const iv = VIA_POR_ID.get(+c.via); const con = ops.filter((o) => o.ids.includes(+c.via)); ops = con.length ? con : iv !== undefined ? agrupar(new Map([[iv, 0]])) : ops; ops.forEach((o) => (o.coste = 0)); }
    const al = ALIAS['@' + t];
    if (!ops.length && al?.startsWith('geo:')) { const [la, lo] = al.slice(4).split(',').map(Number); T.push({ ...base, tipo: 'punto', opciones: [{ nombre: t + ' (punto con fuente, alias)', pts: [X(la, lo)], nodos: [null], coste: 0 }] }); continue; }
    // Nominatim da un punto aproximado: se anota como referencia (hito), pero no obliga al trazado a pasar por él
    if (!ops.length && NOM[t]) { T.push({ ...base, tipo: 'hito', ref: [NOM[t].lat, NOM[t].lon] }); informe.avisos.push(`«${t}» no es una calle en OSM: punto aproximado de Nominatim (caché), solo como referencia`); continue; }
    if (!ops.length) { informe.avisos.push(`«${t}» sin equivalente en OSM: no se traza (no se inventa)`); T.push({ ...base, tipo: 'sin_osm' }); continue; }
    T.push({ ...base, tipo: 'calle', opciones: ops });
  }
  // la misma calle dos veces seguidas («Victoria · Victoria») cuenta una vez
  for (let j = T.length - 1; j > 0; j--) if (T[j].tipo === 'calle' && T[j - 1].tipo === 'calle' && clave(T[j].lugar) === clave(T[j - 1].lugar)) { T[j - 1].repetida = T[j].i; T.splice(j, 1); }
  return T;
}

// puntos de salida/entrada de una opción
const salidas = (o) => (o.sale ? [[o.sale, null]] : o.pts.map((p, k) => [p, o.nodos[k]]));
const entradas = (o) => (o.entra ? [[o.entra, null]] : o.pts.map((p, k) => [p, o.nodos[k]]));
function cruces(a, b) { // estados entre la opción a (calle i) y la b (calle i+1)
  const A = salidas(a), B = entradas(b), comp = [];
  for (const [p, n] of A) for (const [q, m] of B) if (d2(p, q) < 3) comp.push({ pa: p, na: n, pb: q, nb: m, gap: d2(p, q) });
  const out = [];
  for (const c of comp) if (!out.some((o) => d2(o.pa, c.pa) < 15)) out.push(c);
  if (out.length) return out.slice(0, 16);
  let best = null; for (const [p, n] of A) for (const [q, m] of B) { const d = d2(p, q); if (!best || d < best.gap) best = { pa: p, na: n, pb: q, nb: m, gap: d }; }
  return best ? [best] : [];
}
const masCerca = (o, P) => { let best = null; for (const [p, n] of entradas(o).concat(o.sale ? salidas(o) : [])) { const d = d2(p, P); if (!best || d < best[2]) best = [p, n, d]; } return best; };
const largoDentro = (o, p, q) => (o.entra || !o.pts ? 0 : d2(p, q));

// ---- 2) Viterbi: la cadena de candidatas en la que cada calle toca a la siguiente ----
function cadena(R, S, E, forz) {
  const n = R.length;
  if (n === 0) return null;
  const capas = [];
  for (let i = 0; i + 1 < n; i++) {
    const capa = [];
    R[i].opciones.forEach((a, ia) => R[i + 1].opciones.forEach((b, ib) => {
      const f = forz[R[i + 1].i];
      const cs = f ? [(() => { const P = X(...f); const ca = masCerca(a, P), cb = masCerca(b, P); return { pa: P, na: ca?.[1] ?? null, pb: P, nb: cb?.[1] ?? null, gap: 0, forzado: true }; })()] : cruces(a, b);
      for (const c of cs) capa.push({ ...c, ia, ib });
    }));
    capas.push(capa);
  }
  const extremo = (o, P) => (P ? masCerca(o, P) : null);
  if (n === 1) { // una sola calle
    let best = null; R[0].opciones.forEach((o, k) => { const c = (S ? 2 * extremo(o, S)[2] : 0) + (E ? 2 * extremo(o, E)[2] : 0) + o.coste; if (!best || c < best.c) best = { c, k }; });
    return { elegidas: [best.k], estados: [], coste: best.c };
  }
  const coste = capas.map((c) => new Float64Array(c.length).fill(Infinity)), de = capas.map((c) => new Int32Array(c.length).fill(-1));
  capas[0].forEach((t, k) => { const o = R[0].opciones[t.ia]; const e = extremo(o, S); coste[0][k] = (e ? 2 * e[2] + largoDentro(o, e[0], t.pa) : 0) + gapCoste(t.gap) + o.coste + R[1].opciones[t.ib].coste; });
  for (let i = 1; i < capas.length; i++) capas[i].forEach((t, k) => {
    const o = R[i].opciones[t.ia], b = R[i + 1].opciones[t.ib];
    capas[i - 1].forEach((s, j) => {
      if (s.ib !== t.ia || coste[i - 1][j] === Infinity) return;
      let w = largoDentro(o, s.pb, t.pa);
      if (R[i].tipo === 'calle' && w < 8 && o.largo > 30) w += 25; // pisar la esquina no es recorrer la calle
      const c = coste[i - 1][j] + w + gapCoste(t.gap) + b.coste;
      if (c < coste[i][k]) { coste[i][k] = c; de[i][k] = j; }
    });
  });
  const L = capas.length - 1; let fin = -1, cf = Infinity;
  capas[L].forEach((t, k) => { const o = R[n - 1].opciones[t.ib]; const e = extremo(o, E); const c = coste[L][k] + (e ? 2 * e[2] + largoDentro(o, t.pb, e[0]) : 0); if (c < cf) { cf = c; fin = k; } });
  if (fin < 0) return null;
  const estados = []; for (let i = L, k = fin; i >= 0; k = de[i][k], i--) estados.unshift(capas[i][k]);
  const elegidas = [estados[0].ia, ...estados.map((s) => s.ib)];
  return { elegidas, estados, coste: cf };
}

// ---- 3) GraphHopper ----
async function ghRuta(puntos) {
  const body = { points: puntos.map(([la, lo]) => [lo, la]), profile: 'procesion', pass_through: true, points_encoded: false, instructions: false, snap_preventions: ['motorway', 'trunk', 'ferry', 'tunnel'] };
  const r = await fetch(GH + '/route', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok || !j.paths?.length) throw new Error(j.message || 'GraphHopper sin ruta');
  const p = j.paths[0];
  return { geo: p.points.coordinates.map(([lo, la]) => [la, lo]), wp: p.snapped_waypoints.coordinates.map(([lo, la]) => [la, lo]), m: p.distance };
}
const largoGeo = (g) => g.reduce((s, p, i) => s + (i ? d2(X(...p), X(...g[i - 1])) : 0), 0);
function cortarPorPuntos(geo, wp) { // índice de cada punto de paso en la geometría (en orden)
  const idx = [0]; let k = 0;
  for (let w = 1; w < wp.length; w++) { const P = X(...wp[w]); let best = k, bd = Infinity; for (let j = k; j < geo.length; j++) { const d = d2(X(...geo[j]), P); if (d < bd - 1e-9) { bd = d; best = j; } if (d < 0.5) break; } idx.push(best); k = best; }
  return idx;
}
// Un tramo que da un rodeo absurdo entre dos puntos de paso suele ser una media vuelta prohibida por pass_through:
// se parte la petición en ese punto (allí sí se deja girar) y se repite.
async function rutaTramo(puntos, informe) {
  let cortes = [];
  for (let intento = 0; intento < 6; intento++) {
    const trozos = []; let a = 0; for (const c of [...cortes, puntos.length - 1].sort((x, y) => x - y)) { if (c > a) trozos.push(puntos.slice(a, c + 1)); a = c; }
    const geos = []; let malo = -1, base = 0;
    for (const tr of trozos) {
      const r = await ghRuta(tr); const idx = cortarPorPuntos(r.geo, r.wp);
      for (let w = 1; w < tr.length && malo < 0; w++) { const L = largoGeo(r.geo.slice(idx[w - 1], idx[w] + 1)), recta = d2(X(...tr[w - 1]), X(...tr[w])); if (L > 3 * recta && L - recta > 250 && !cortes.includes(base + w - 1)) malo = base + w - 1; }
      geos.push(r.geo); base += tr.length - 1;
    }
    if (malo < 0 || malo === 0) return geos.flatMap((g, i) => (i ? g.slice(1) : g));
    cortes.push(malo); informe.cortes_media_vuelta = (informe.cortes_media_vuelta || 0) + 1;
  }
  throw new Error('rodeos sin resolver');
}

// ---- trazado completo de una hermandad ----
export async function trazar(id, { corr = leerCorrecciones()[id] || {} } = {}) {
  const t0 = performance.now();
  const L = LISTAS[id]; if (!L) throw new Error('sin lista oficial para ' + id);
  const informe = { id, metodo: 'continuidad + GraphHopper 11.1 (perfil procesion)', fuente_lista: L.fuente, avisos: [], correcciones: Object.keys(corr).length ? corr : null };
  let T = fichas(id, L.calles, corr, informe);
  // sedes
  const fS = T.find((t) => t.tipo === 'salida'), fE = T.find((t) => t.tipo === 'entrada');
  let sedeS = corr.salida ? { punto: [corr.salida.lat, corr.salida.lon], como: 'corrección de Pablo', fuente: corr.salida.fuente } : fS ? sedeDe(id, fS.lugar) : null;
  let sedeE = corr.entrada ? { punto: [corr.entrada.lat, corr.entrada.lon], como: 'corrección de Pablo', fuente: corr.entrada.fuente } : fE ? sedeDe(id, fE.lugar) : null;
  if (!sedeS) informe.avisos.push('salida: sede sin localizar (empieza en la primera calle)');
  if (!sedeE) informe.avisos.push('entrada: sede sin localizar (acaba en la última calle)');
  const forz = corr.puntos || {};
  // cadena; si una calle solo encaja con huecos enormes a los dos lados, es un homónimo lejano: fuera, y se repite
  let R, ch;
  for (let vuelta = 0; vuelta < 8; vuelta++) {
    R = T.filter((t) => t.opciones);
    ch = cadena(R, sedeS && X(...sedeS.punto), sedeE && X(...sedeE.punto), forz);
    if (!ch) throw new Error('sin cadena posible');
    let quitar = -1;
    for (let i = 0; i < R.length; i++) { if (R[i].tipo !== 'calle' || corr.calles?.[R[i].i]) continue; const gi = i > 0 ? ch.estados[i - 1].gap : null, go = i < R.length - 1 ? ch.estados[i].gap : null; const lados = [gi, go].filter((g) => g !== null); if (lados.length && lados.every((g) => g > 250)) { quitar = i; break; } }
    if (quitar < 0) break;
    const f = R[quitar]; informe.avisos.push(`«${f.lugar}»: la única calle de OSM con ese nombre está lejos de sus vecinas (homónimo): no se traza`); f.tipo = 'homonimo'; delete f.opciones;
  }
  // salida y entrada: puerta del edificio que da a la primera / última calle
  const op0 = R[0].opciones[ch.elegidas[0]], opN = R.at(-1).opciones[ch.elegidas.at(-1)];
  for (const [sd, op, rol] of [[sedeS, op0, 'salida'], [sedeE, opN, 'entrada']]) { if (!sd || sd.como === 'corrección de Pablo') continue; const pu = puertaHacia(sd, op); if (pu) { sd.punto_edificio = sd.punto; sd.punto = pu.punto; sd.como += ' → ' + pu.como; } informe[rol] = { punto: sd.punto, como: sd.como, fuente: sd.fuente || null }; }
  // ---- puntos de paso ----
  const segs = [[]]; const hitoPunto = new Map(); // índice original → [la,lo]
  const pon = (xy, i) => { const ll = LL(...xy); const s = segs.at(-1); if (!s.length || d2(X(...s.at(-1)), xy) > 5) s.push(ll); if (i !== undefined && !hitoPunto.has(i)) hitoPunto.set(i, ll); };
  if (sedeS) pon(X(...sedeS.punto), fS?.i ?? -1);
  informe.calles = [];
  for (let i = 0; i < R.length; i++) {
    const f = R[i], o = f.opciones[ch.elegidas[i]];
    const ent = i === 0 ? (sedeS ? masCerca(o, X(...sedeS.punto)) : [entradas(o)[0][0], entradas(o)[0][1]]) : [ch.estados[i - 1].pb, ch.estados[i - 1].nb];
    const sal = i === R.length - 1 ? (sedeE ? masCerca(o, X(...sedeE.punto)) : [salidas(o).at(-1)[0], salidas(o).at(-1)[1]]) : [ch.estados[i].pa, ch.estados[i].na];
    informe.calles.push({ i: f.i, lugar: f.lugar, tipo: f.tipo, osm: o.nombre, vias: o.ids || null, candidatas: f.opciones.length, hueco_entrada_m: i ? Math.round(ch.estados[i - 1].gap) : null, forzado: !!forz[f.i] });
    if (i > 0 && ch.estados[i - 1].gap > 40) informe.avisos.push(`hueco de ${Math.round(ch.estados[i - 1].gap)} m entre «${R[i - 1].lugar}» y «${f.lugar}»: en OSM no se tocan`);
    // OSM no une dos calles seguidas de la lista que están a 3-40 m: enlace recto (anotado) en vez de un rodeo con media vuelta
    if (i > 0 && ch.estados[i - 1].gap > 3 && ch.estados[i - 1].gap <= 40 && f.tipo !== 'catedral' && R[i - 1].tipo !== 'catedral') { pon(ch.estados[i - 1].pa); segs.push([]); (informe.enlaces = informe.enlaces || []).push(`${Math.round(ch.estados[i - 1].gap)} m entre «${R[i - 1].lugar}» y «${f.lugar}»`); }
    if (f.tipo === 'catedral') { pon(o.entra, f.i); segs.push([]); pon(o.sale); informe.por_la_catedral = `de la puerta de Postigo de los Abades (nodo ${PUERTA_CATEDRAL.entra.id}) a la del Patio de los Naranjos (nodo ${PUERTA_CATEDRAL.sale.id}): sin calle, línea por dentro`; continue; }
    // desde la sede se va directo al primer cruce (el punto de la calle más cercano a la puerta puede quedar «detrás» y obligar a dar la vuelta)
    if (i === 0 && sedeS) hitoPunto.set(f.i, LL(...ent[0])); else pon(ent[0], f.i);
    if (f.tipo === 'calle' && ent[1] != null && sal[1] != null) { // puntos intermedios por la propia calle, para que GraphHopper no se vaya por una paralela
      const cam = caminoDentro(o, ent[1], sal[1]);
      if (cam) { let acc = 0, ult = 0; for (let k = 1; k < cam.length; k++) { acc += d2(NODOS[cam[k]].xy, NODOS[cam[k - 1]].xy); if (acc - ult > 120 && k < cam.length - 1) { pon(NODOS[cam[k]].xy); ult = acc; } } }
    }
    if (!(i === R.length - 1 && sedeE)) pon(sal[0]);
    // media vuelta real (A · plaza · A): se deja girar ahí partiendo la petición
    if (i > 0 && i < R.length - 1 && clave(R[i - 1].lugar) === clave(R[i + 1].lugar)) segs.push([segs.at(-1).at(-1)]);
  }
  if (sedeE) pon(X(...sedeE.punto), fE?.i);
  // ---- GraphHopper por tramos ----
  const tGH = performance.now();
  const geo = [];
  for (const s of segs) { if (s.length < 2) continue; const g = await rutaTramo(s, informe); if (geo.length && d2(X(...geo.at(-1)), X(...g[0])) < 1) g.shift(); geo.push(...g); }
  informe.ms_graphhopper = Math.round(performance.now() - tGH);
  // hitos (marcas sin geometría): en el punto de la siguiente calle trazada
  const hitos = []; let ultimo = null;
  for (const f of T) { const p = hitoPunto.get(f.i); if (p) ultimo = p; hitos.push({ i: f.i, lugar: f.lugar, tipo: f.tipo, tramo: f.tramo, punto: p || null }); }
  for (let k = hitos.length - 1, sig = null; k >= 0; k--) { if (hitos[k].punto) sig = hitos[k].punto; else if (['hito', 'catedral'].includes(hitos[k].tipo)) hitos[k].punto = sig; }
  // ida / regreso: se corta en el primer hito de regreso
  const pv = hitos.find((h) => h.tramo === 'regreso' && h.punto);
  let corte = geo.length - 1;
  if (pv) { const P = X(...pv.punto); let bd = Infinity; geo.forEach((g, j) => { const d = d2(X(...g), P); if (d < bd) { bd = d; corte = j; } }); }
  informe.largo_m = Math.round(largoGeo(geo));
  informe.ms_total = Math.round(performance.now() - t0);
  return { id, ida: geo.slice(0, corte + 1), regreso: geo.slice(corte), hitos, puntosPaso: segs, informe };
}

// ---- línea de órdenes ----
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const ids = process.argv.slice(2).length ? LAS_10.filter((id) => process.argv.slice(2).some((s) => id.startsWith(s))) : LAS_10;
  const dir = path.join(LAB, 'salida', 'nuevo'); fs.mkdirSync(path.join(dir, 'trazas'), { recursive: true });
  const fInf = path.join(dir, 'informe.json'); const inf = fs.existsSync(fInf) ? JSON.parse(fs.readFileSync(fInf, 'utf8')) : {};
  for (const id of ids) {
    try {
      const r = await trazar(id);
      fs.writeFileSync(path.join(dir, 'trazas', id + '.json'), JSON.stringify({ ida: r.ida, regreso: r.regreso, puntos: r.hitos.filter((h) => h.punto).map((h) => ({ lugar: h.lugar, lat: h.punto[0], lon: h.punto[1], tramo: h.tramo })) }));
      inf[id] = r.informe;
      console.log(id.replace('-malaga', ''), '|', r.informe.largo_m, 'm |', r.informe.ms_total, 'ms (GH', r.informe.ms_graphhopper, 'ms) | avisos', r.informe.avisos.length, r.informe.avisos.length ? '· ' + r.informe.avisos.join(' · ').slice(0, 300) : '');
    } catch (e) { console.log(id, 'ERROR', e.message); inf[id] = { id, error: e.message }; }
  }
  fs.writeFileSync(fInf, JSON.stringify(inf, null, 1));
}
