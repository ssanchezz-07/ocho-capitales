// Ocho Capitales · rutas: EVALUADOR COMÚN. Mide con la misma vara lo publicado (site/data/recorridos/<c>.json) y el trazado nuevo
// (salida/<c>/trazas/<id>.json), y propone cuál se queda.
// Métricas: calles de la lista que el trazado recorre de verdad (≥ 15 m sobre una vía de OSM con ese nombre, a < 7 m) y en orden
// (subsecuencia común más larga), distancia de la salida y la entrada a la sede, tramos rectos > 150 m fuera de la red,
// retrocesos (giros de más de 160°), metros sobre calles de la lista. El nombre se compara EXACTO (misma clave o alias),
// sin el parecido aproximado del método nuevo, para no favorecerlo.
// Uso: node evaluar.mjs <capital> [id …]   → salida/<capital>/evaluacion.json (+ resumen en pantalla)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ciudad, argumentos, dirSalida, d2, dSeg, sn, clave, TEMPLO, dAnillo, dentro } from './comun.mjs';

const igual = (a, b) => a === b || a.replace(/ /g, '') === b.replace(/ /g, '');
const SEDE_MAX = 60;

export function evaluador(c) {
  const C = ciudad(c);
  const { LISTAS, ALIAS, NOM, VIAS, X, MARCA, CATEDRAL, viasCerca, sedeDe, anillo, puertaCatedral } = C;
  const largoOSM = new Map(); for (const v of VIAS) for (const [cl] of v.nombres) largoOSM.set(cl, (largoOSM.get(cl) || 0) + v.pts.reduce((a, p, j, P) => a + (j ? d2(p, P[j - 1]) : 0), 0));
  const claveTok = (t) => { const al = ALIAS[t]; return clave(al && !al.startsWith('geo:') && !al.startsWith('osm:') ? al : t); };
  const catDe = (L) => { const P = puertaCatedral(L); return P.entra && P.sale && [X(P.entra.lat, P.entra.lon), X(P.sale.lat, P.sale.lon)]; };

  return function evaluar(id, traza) {
    const L = LISTAS[id], calles = L.calles, cat = catDe(L);
    const corr = C.leerCorrecciones()[id] || {};
    const geo = [...traza.ida, ...traza.regreso.slice(1)].map((p) => X(...p)).filter((p, i, A) => !i || d2(p, A[i - 1]) > 0.5);
    // muestreo cada 4 m: qué calles con nombre hay debajo
    const muestras = []; let acc = 0;
    for (let i = 1; i < geo.length; i++) { const a = geo[i - 1], b = geo[i], Lg = d2(a, b), n = Math.max(1, Math.ceil(Lg / 4)); for (let k = 0; k < n; k++) { const p = [a[0] + (b[0] - a[0]) * (k + 0.5) / n, a[1] + (b[1] - a[1]) * (k + 0.5) / n]; const cl = new Set(); for (const [vi] of viasCerca(p, 7)) for (const [cc] of VIAS[vi].nombres) cl.add(cc); muestras.push({ m: acc + Lg * (k + 0.5) / n, paso: Lg / n, cl }); } acc += Lg; }
    const largo = acc;
    // tramos de calle (racha de muestras seguidas con la misma clave)
    const rachas = []; const abiertas = new Map();
    muestras.forEach((s, j) => { for (const cc of s.cl) { const r = abiertas.get(cc); if (r && r.fin === j - 1) { r.fin = j; r.m += s.paso; } else { const n = { cl: cc, ini: j, fin: j, m: s.paso }; abiertas.set(cc, n); rachas.push(n); } } });
    // elementos de la lista que se pueden comprobar
    const evals = [];
    for (let i = 0; i < calles.length; i++) {
      const t = calles[i], s = sn(t);
      if ((i === 0 || i === calles.length - 1) && (TEMPLO.test(s) || s.startsWith('casa hermandad'))) continue;
      if (L.hitos.has(i) || MARCA.test(s) || CATEDRAL.test(s)) continue;
      const k = claveTok(t);
      const enOSM = [...largoOSM.keys()].find((cc) => igual(cc, k));
      // corrección «esquina» (con fuente): la lista nombra la calle porque el cortejo pasa por su esquina; basta con tocarla
      // (cuenta en orden como un punto, porque no hay tramo que ordenar)
      const esq = !!corr.calles?.[i]?.esquina;
      if (enOSM) { const umbral = Math.min(15, 0.5 * largoOSM.get(enOSM)); const rs = rachas.filter((r) => igual(r.cl, k)); const m = rs.reduce((a, r) => a + r.m, 0); evals.push({ i, lugar: t, cl: enOSM, ok: m >= umbral || (esq && m > 0), metros: Math.round(m), ...(esq ? { punto: true, esquina: true } : {}) }); continue; }
      const al = ALIAS['@' + t]; const P = al?.startsWith('geo:') ? al.slice(4).split(',').map(Number) : NOM[t] ? [NOM[t].lat, NOM[t].lon] : null;
      if (P) { const q = X(...P); const dmin = Math.min(...geo.map((g, j) => (j ? dSeg(q, geo[j - 1], g) : Infinity))); evals.push({ i, lugar: t, punto: true, ok: dmin < 25, metros: null, dist_m: Math.round(dmin) }); continue; }
      evals.push({ i, lugar: t, sin_dato: true });
    }
    const comprobables = evals.filter((e) => !e.sin_dato);
    // en orden: subsecuencia común más larga entre la lista y la sucesión de calles del trazado
    const A = comprobables, B = rachas.filter((r) => r.m >= 8).sort((a, b) => a.ini - b.ini);
    const casa = (e, r) => (e.punto ? false : igual(e.cl, r.cl));
    const lcs = Array.from({ length: A.length + 1 }, () => new Int16Array(B.length + 1));
    for (let i = 1; i <= A.length; i++) for (let j = 1; j <= B.length; j++) lcs[i][j] = casa(A[i - 1], B[j - 1]) ? lcs[i - 1][j - 1] + 1 : Math.max(lcs[i - 1][j], lcs[i][j - 1]);
    const puntosOk = comprobables.filter((e) => e.punto && e.ok).length; // un punto (plaza sin calle en OSM) cuenta en orden si se toca
    // sede
    const esSede = (t) => TEMPLO.test(sn(t)) || sn(t).startsWith('casa hermandad');
    const dSede = (sd, p) => { if (!sd) return null; if (sd.edificio) { const R = anillo(sd.edificio); return dentro(R, p) ? 0 : Math.round(dAnillo(R, p)); } return Math.round(d2(X(...sd.punto), p)); };
    const sS = esSede(calles[0]) ? sedeDe(id, calles[0]) : null, sE = esSede(calles.at(-1)) ? sedeDe(id, calles.at(-1)) : null;
    // rectas > 150 m fuera de la red (la línea por dentro de la Catedral no cuenta)
    const rectas = []; let tramoMax = 0;
    for (let i = 1; i < geo.length; i++) { const Lg = d2(geo[i], geo[i - 1]); tramoMax = Math.max(tramoMax, Lg); if (Lg <= 150) continue; const mid = [(geo[i][0] + geo[i - 1][0]) / 2, (geo[i][1] + geo[i - 1][1]) / 2]; const esCat = cat && Math.min(d2(geo[i - 1], cat[0]) + d2(geo[i], cat[1]), d2(geo[i - 1], cat[1]) + d2(geo[i], cat[0])) < 60; if (!esCat && !viasCerca(mid, 15).size) /* 15 m: en las avenidas anchas la red de GraphHopper (.pbf) va a 12-14 m de la línea de la caché */ rectas.push(Math.round(Lg)); }
    // retrocesos: media vuelta (giro > 160°) entre dos tramos de al menos 2 m; el giro en la puerta de la Catedral no cuenta
    let retro = 0; const dondeRetro = [];
    for (let i = 1; i + 1 < geo.length; i++) { const a = geo[i - 1], b = geo[i], cc = geo[i + 1]; const u = [b[0] - a[0], b[1] - a[1]], v = [cc[0] - b[0], cc[1] - b[1]]; const lu = Math.hypot(...u), lv = Math.hypot(...v); if (lu < 2 || lv < 2) continue; const cos = (u[0] * v[0] + u[1] * v[1]) / lu / lv; if (cos < Math.cos(160 * Math.PI / 180) && !(cat && Math.min(d2(b, cat[0]), d2(b, cat[1])) < 15)) { retro++; dondeRetro.push(C.LL(...b).map((x) => +x.toFixed(6))); } }
    // metros sobre calles de la lista
    const clLista = [...new Set(comprobables.filter((e) => e.cl).map((e) => e.cl))];
    const mLista = muestras.reduce((a, s) => a + ([...s.cl].some((cc) => clLista.some((k) => igual(cc, k))) ? s.paso : 0), 0);
    return {
      largo_m: Math.round(largo), comprobables: comprobables.length, sin_dato: evals.filter((e) => e.sin_dato).map((e) => e.lugar),
      recorridas: comprobables.filter((e) => e.ok).length, en_orden: lcs[A.length][B.length] + puntosOk, no_recorridas: comprobables.filter((e) => !e.ok).map((e) => e.lugar + (e.punto && !e.esquina ? ` (punto, a ${e.dist_m} m)` : ` (${e.metros} m)`)),
      salida_m: sS ? dSede(sS, geo[0]) : null, entrada_m: sE ? dSede(sE, geo.at(-1)) : null, sede_salida: sS?.como || null, sede_entrada: sE?.como || null,
      rectas_150: rectas, tramo_max_m: Math.round(tramoMax), retrocesos: retro, donde_retrocesos: dondeRetro,
      pct_en_calles_lista: largo ? Math.round(100 * mLista / largo) : 0,
    };
  };
}

// ¿Empata o mejora el nuevo? «nuevo» si no empeora en nada; «publicado» si empeora en lo importante; «revisar» si gana en unas y pierde en otras.
export function decidir(p, n) {
  if (!n) return { queda: 'publicado', motivo: ['sin trazado nuevo'] };
  if (!p) return { queda: 'nuevo', motivo: ['no había trazado publicado'] };
  const peor = [], mejor = [];
  const cmp = (nom, a, b, tol = 0) => { if (b < a - tol) peor.push(`${nom} ${a}→${b}`); else if (b > a) mejor.push(`${nom} ${a}→${b}`); };
  cmp('calles recorridas', p.recorridas, n.recorridas);
  cmp('en orden', p.en_orden, n.en_orden, 1);
  if (n.rectas_150.length > p.rectas_150.length) peor.push(`rectas > 150 m ${p.rectas_150.length}→${n.rectas_150.length}`);
  for (const k of ['salida_m', 'entrada_m']) { if (n[k] == null) continue; if (n[k] > SEDE_MAX && !(p[k] > SEDE_MAX && n[k] <= p[k])) peor.push(`${k.replace('_m', '')} a ${n[k]} m de la sede`); else if (p[k] != null && p[k] > SEDE_MAX && n[k] <= SEDE_MAX) mejor.push(`${k.replace('_m', '')} ${p[k]}→${n[k]} m`); }
  if (n.retrocesos > p.retrocesos + 2) peor.push(`retrocesos ${p.retrocesos}→${n.retrocesos}`); else if (n.retrocesos < p.retrocesos) mejor.push(`retrocesos ${p.retrocesos}→${n.retrocesos}`);
  const nombre = (s) => s.replace(/ \(.*\)$/, '');
  const pierde = n.no_recorridas.map(nombre).filter((x) => !p.no_recorridas.map(nombre).includes(x));
  if (pierde.length) peor.push('deja de recorrer: ' + pierde.join(', '));
  if (!peor.length) return { queda: 'nuevo', motivo: mejor.length ? mejor : ['empate'] };
  return { queda: mejor.length ? 'revisar' : 'publicado', motivo: [...peor.map((x) => 'peor: ' + x), ...mejor.map((x) => 'mejor: ' + x)] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const { c, ids } = argumentos();
  const C = ciudad(c), evaluar = evaluador(c);
  const fOut = path.join(dirSalida(c), 'evaluacion.json');
  const out = fs.existsSync(fOut) ? JSON.parse(fs.readFileSync(fOut, 'utf8')) : {};
  const f = (r) => (r ? `${r.recorridas}/${r.comprobables} rec · ${r.en_orden} orden · sal ${r.salida_m} ent ${r.entrada_m} · rectas ${r.rectas_150.length} · retro ${r.retrocesos} · ${r.largo_m} m` : '-');
  const cuenta = { nuevo: 0, publicado: 0, revisar: 0 };
  for (const id of ids) {
    const pub = C.publicado(id), fn = path.join(dirSalida(c), 'trazas', id + '.json');
    const p = pub ? evaluar(id, pub) : null, n = fs.existsSync(fn) ? evaluar(id, JSON.parse(fs.readFileSync(fn, 'utf8'))) : null;
    const d = decidir(p, n); cuenta[d.queda]++;
    out[id] = { publicado: p, nuevo: n, decision: d };
    console.log(id.replace('-' + c, '').padEnd(24), d.queda.toUpperCase().padEnd(9), '| PUBL', f(p), '\n'.padEnd(36), '| NUEVO', f(n), '\n'.padEnd(36), '|', d.motivo.join(' · '));
  }
  fs.mkdirSync(dirSalida(c), { recursive: true });
  fs.writeFileSync(fOut, JSON.stringify(out, null, 1));
  console.log('\nTotal:', cuenta, '→', path.relative(process.cwd(), fOut));
}
