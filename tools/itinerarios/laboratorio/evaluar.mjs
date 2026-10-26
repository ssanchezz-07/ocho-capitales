// Ocho Capitales · laboratorio de rutas: EVALUADOR COMÚN. Mide con la misma vara el trazado actual y el nuevo.
// Entrada: actual/salida/trazas/<id>.json y salida/nuevo/trazas/<id>.json ({ida, regreso} en [lat, lon]).
// Métricas: calles de la lista que el trazado recorre de verdad (≥ 15 m sobre una vía de OSM con ese nombre, a < 7 m) y en orden
// (subsecuencia común más larga), distancia de la salida y la entrada a la sede, tramos rectos > 150 m fuera de la red,
// retrocesos (giros de más de 160°), metros sobre calles de la lista. El nombre se compara EXACTO (misma clave o alias),
// sin el parecido aproximado del método nuevo, para no favorecerlo.
import fs from 'node:fs';
import path from 'node:path';
import { LAB, LAS_10, LISTAS, ALIAS, NOM, VIAS, X, d2, dSeg, sn, clave, MARCA, CATEDRAL, TEMPLO, viasCerca, sedeDe, anillo, dAnillo, dentro, PUERTA_CATEDRAL } from './comun.mjs';

const largoOSM = new Map(); for (const v of VIAS) for (const [cl] of v.nombres) largoOSM.set(cl, (largoOSM.get(cl) || 0) + v.pts.reduce((a, p, j, P) => a + (j ? d2(p, P[j - 1]) : 0), 0));
const claveTok = (t) => { const al = ALIAS[t]; return clave(al && !al.startsWith('geo:') && !al.startsWith('osm:') ? al : t); };
const igual = (a, b) => a === b || a.replace(/ /g, '') === b.replace(/ /g, '');

export function evaluar(id, traza) {
  const calles = LISTAS[id].calles;
  const geo = [...traza.ida, ...traza.regreso.slice(1)].map((p) => X(...p)).filter((p, i, A) => !i || d2(p, A[i - 1]) > 0.5);
  // muestreo cada 4 m: qué calles con nombre hay debajo
  const muestras = []; let acc = 0;
  for (let i = 1; i < geo.length; i++) { const a = geo[i - 1], b = geo[i], L = d2(a, b), n = Math.max(1, Math.ceil(L / 4)); for (let k = 0; k < n; k++) { const p = [a[0] + (b[0] - a[0]) * (k + 0.5) / n, a[1] + (b[1] - a[1]) * (k + 0.5) / n]; const cl = new Set(); for (const [vi] of viasCerca(p, 7)) for (const [c] of VIAS[vi].nombres) cl.add(c); muestras.push({ m: acc + L * (k + 0.5) / n, paso: L / n, cl }); } acc += L; }
  const largo = acc;
  // tramos de calle (racha de muestras seguidas con la misma clave)
  const rachas = []; const abiertas = new Map();
  muestras.forEach((s, j) => { for (const c of s.cl) { const r = abiertas.get(c); if (r && r.fin === j - 1) { r.fin = j; r.m += s.paso; } else { const n = { cl: c, ini: j, fin: j, m: s.paso }; abiertas.set(c, n); rachas.push(n); } } });
  // elementos de la lista que se pueden comprobar
  const evals = [];
  for (let i = 0; i < calles.length; i++) {
    const t = calles[i], s = sn(t);
    if ((i === 0 || i === calles.length - 1) && (TEMPLO.test(s) || s.startsWith('casa hermandad'))) continue;
    if (MARCA.test(s) || CATEDRAL.test(s)) continue;
    const k = claveTok(t);
    const enOSM = [...largoOSM.keys()].find((c) => igual(c, k));
    if (enOSM) { const umbral = Math.min(15, 0.5 * largoOSM.get(enOSM)); const rs = rachas.filter((r) => igual(r.cl, k)); const m = rs.reduce((a, r) => a + r.m, 0); evals.push({ i, lugar: t, cl: enOSM, ok: m >= umbral, metros: Math.round(m), rachas: rs.filter((r) => r.m >= Math.min(10, umbral)) }); continue; }
    const al = ALIAS['@' + t]; const P = al?.startsWith('geo:') ? al.slice(4).split(',').map(Number) : NOM[t] ? [NOM[t].lat, NOM[t].lon] : null;
    if (P) { const q = X(...P); const dmin = Math.min(...geo.map((g, j) => (j ? dSeg(q, geo[j - 1], g) : Infinity))); evals.push({ i, lugar: t, punto: true, ok: dmin < 25, metros: null, dist_m: Math.round(dmin) }); continue; }
    evals.push({ i, lugar: t, sin_dato: true });
  }
  const comprobables = evals.filter((e) => !e.sin_dato);
  // en orden: subsecuencia común más larga entre la lista y la sucesión de calles del trazado
  const seqTraza = rachas.filter((r) => r.m >= 8).sort((a, b) => a.ini - b.ini);
  const A = comprobables, B = seqTraza;
  const casa = (e, r) => (e.punto ? false : igual(e.cl, r.cl));
  const lcs = Array.from({ length: A.length + 1 }, () => new Int16Array(B.length + 1));
  for (let i = 1; i <= A.length; i++) for (let j = 1; j <= B.length; j++) lcs[i][j] = casa(A[i - 1], B[j - 1]) ? lcs[i - 1][j - 1] + 1 : Math.max(lcs[i - 1][j], lcs[i][j - 1]);
  const enOrdenCalles = lcs[A.length][B.length];
  const puntosOk = comprobables.filter((e) => e.punto && e.ok).length; // un punto (plaza sin calle en OSM) cuenta en orden si se toca
  // sede
  const sede = (txt) => { const sd = sedeDe(id, txt); if (!sd) return null; return sd; };
  const dSede = (sd, p) => { if (!sd) return null; if (sd.edificio) { const R = anillo(sd.edificio); return dentro(R, p) ? 0 : Math.round(dAnillo(R, p)); } return Math.round(d2(X(...sd.punto), p)); };
  const sS = sede(calles[0]), sE = sede(calles.at(-1));
  // rectas > 150 m fuera de la red (la línea por dentro de la Catedral se cuenta aparte)
  const cat = PUERTA_CATEDRAL.entra && [X(PUERTA_CATEDRAL.entra.lat, PUERTA_CATEDRAL.entra.lon), X(PUERTA_CATEDRAL.sale.lat, PUERTA_CATEDRAL.sale.lon)];
  const rectas = []; let tramoMax = 0;
  for (let i = 1; i < geo.length; i++) { const L = d2(geo[i], geo[i - 1]); tramoMax = Math.max(tramoMax, L); if (L <= 150) continue; const mid = [(geo[i][0] + geo[i - 1][0]) / 2, (geo[i][1] + geo[i - 1][1]) / 2]; const esCat = cat && Math.min(d2(geo[i - 1], cat[0]) + d2(geo[i], cat[1]), d2(geo[i - 1], cat[1]) + d2(geo[i], cat[0])) < 60; if (!esCat && !viasCerca(mid, 10).size) rectas.push(Math.round(L)); }
  // retrocesos: media vuelta (giro > 160°) entre dos tramos de al menos 2 m
  let retro = 0; const dondeRetro = [];
  for (let i = 1; i + 1 < geo.length; i++) { const a = geo[i - 1], b = geo[i], c = geo[i + 1]; const u = [b[0] - a[0], b[1] - a[1]], v = [c[0] - b[0], c[1] - b[1]]; const lu = Math.hypot(...u), lv = Math.hypot(...v); if (lu < 2 || lv < 2) continue; const cos = (u[0] * v[0] + u[1] * v[1]) / lu / lv; if (cos < Math.cos(160 * Math.PI / 180) && !(cat && Math.min(d2(b, cat[0]), d2(b, cat[1])) < 15)) { retro++; dondeRetro.push(b); } } // el giro al entrar o salir por la puerta de la Catedral no cuenta
  // metros sobre calles de la lista
  const clLista = new Set(comprobables.filter((e) => e.cl).map((e) => e.cl));
  const mLista = muestras.reduce((a, s) => a + ([...s.cl].some((c) => [...clLista].some((k) => igual(c, k))) ? s.paso : 0), 0);
  return {
    largo_m: Math.round(largo), comprobables: comprobables.length, sin_dato: evals.filter((e) => e.sin_dato).map((e) => e.lugar),
    recorridas: comprobables.filter((e) => e.ok).length, en_orden: enOrdenCalles + puntosOk, no_recorridas: comprobables.filter((e) => !e.ok).map((e) => e.lugar + (e.punto ? ` (punto, a ${e.dist_m} m)` : ` (${e.metros} m)`)),
    salida_m: dSede(sS, geo[0]), entrada_m: dSede(sE, geo.at(-1)), sede_salida: sS?.como || null, sede_entrada: sE?.como || null,
    rectas_150: rectas, tramo_max_m: Math.round(tramoMax), retrocesos: retro, donde_retrocesos: dondeRetro.map((p) => p.map(Math.round)),
    pct_en_calles_lista: Math.round(100 * mLista / largo),
  };
}

if (process.argv[1]?.endsWith('evaluar.mjs')) {
  const out = {};
  const t = (f) => Object.fromEntries(fs.readFileSync(f, 'utf8').trim().split(/\r?\n/).map((l) => l.split(' ')).map(([a, b]) => [a + '-malaga', +b]));
  const tA = fs.existsSync(path.join(LAB, 'actual', 'salida', 'tiempos.txt')) ? t(path.join(LAB, 'actual', 'salida', 'tiempos.txt')) : {};
  const tN = fs.existsSync(path.join(LAB, 'salida', 'nuevo', 'tiempos.txt')) ? t(path.join(LAB, 'salida', 'nuevo', 'tiempos.txt')) : {};
  for (const id of LAS_10) {
    const fa = path.join(LAB, 'actual', 'salida', 'trazas', id + '.json'), fn = path.join(LAB, 'salida', 'nuevo', 'trazas', id + '.json');
    out[id] = { actual: fs.existsSync(fa) ? { ...evaluar(id, JSON.parse(fs.readFileSync(fa, 'utf8'))), ms: tA[id] ?? null } : null, nuevo: fs.existsSync(fn) ? { ...evaluar(id, JSON.parse(fs.readFileSync(fn, 'utf8'))), ms: tN[id] ?? null } : null };
    const f = (r) => (r ? `${r.recorridas}/${r.comprobables} rec · ${r.en_orden} orden · sal ${r.salida_m} ent ${r.entrada_m} · rectas ${r.rectas_150.length} · retro ${r.retrocesos} · ${r.largo_m} m · lista ${r.pct_en_calles_lista}% · ${r.ms} ms` : '-');
    console.log(id.replace('-malaga', '').padEnd(22), '| ACTUAL', f(out[id].actual), '\n'.padEnd(24), '| NUEVO ', f(out[id].nuevo));
  }
  fs.mkdirSync(path.join(LAB, 'salida'), { recursive: true });
  fs.writeFileSync(path.join(LAB, 'salida', 'comparacion.json'), JSON.stringify(out, null, 1));
}
