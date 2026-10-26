// Ocho Capitales · rutas: pasa los trazados nuevos (salida/<c>/trazas) al formato del sitio, en site/data/recorridos/<c>.json.
// Cada elemento de la lista con sitio en el trazado es un punto {fila, lugar, hora?, lat, lon, como, tramo, rol?, via}; «via» son
// los vértices hasta el punto siguiente. Horas: las oficiales de la lista (listas/<c>.json). Si la lista es una rejilla
// («rejilla»: true), el tramo hasta la calle siguiente que no la toca (hueco > 40 m) lo ha rellenado GraphHopper: va como «estimado».
// Uso: node publicar.mjs <capital> [id …] [--forzar]
//   Sin --forzar solo publica las que el evaluador dejó en «nuevo» (empata o mejora a lo publicado). Con --forzar, las indicadas
//   aunque el evaluador dijera «revisar» o «publicado» (tras mirarlas en las capturas o corregirlas en el editor).
import fs from 'node:fs';
import path from 'node:path';
import { ciudad, leerLista, dirSalida, fPublicado, sn, d2 } from './comun.mjs';

const args = process.argv.slice(2), forzar = args.includes('--forzar');
const [c, ...resto] = args.filter((a) => a !== '--forzar');
const C = ciudad(c), L = leerLista(c);
const ids = resto.length ? Object.keys(L).filter((id) => resto.some((s) => id === s || id === s + '-' + c)) : Object.keys(L);
const EV = JSON.parse(fs.readFileSync(path.join(dirSalida(c), 'evaluacion.json'), 'utf8'));
const INF = JSON.parse(fs.readFileSync(path.join(dirSalida(c), 'informe.json'), 'utf8'));
const fR = fPublicado(c), R = fs.existsSync(fR) ? JSON.parse(fs.readFileSync(fR, 'utf8')) : { ciudad: C.nombre, anio: 2026, hermandades: {} };
const hoy = new Date().toISOString().slice(0, 10);
const r6 = (x) => +x.toFixed(6);
const HUECO_MAX = 60;

function aPuntos(id, traza, informe, lista) {
  const geo = [...traza.ida, ...traza.regreso.slice(1)];
  const ps = traza.puntos.filter((p) => p.pos != null && p.pos >= 0 && !['omitida', 'sin_osm', 'homonimo'].includes(p.tipo));
  const hueco = new Map((informe.calles || []).map((k) => [k.i, k.hueco_entrada_m]));
  // Salto de más de HUECO_MAX m entre dos calles seguidas de la lista (no se tocan): GraphHopper rellena el camino a pie más corto.
  // Si una corrección da la fuente del tramo («tramos»: { "<índice de la calle siguiente>": { fuente, estimado? } }) se anota;
  // si no hay fuente, o la fuente no es de este año («estimado»: true), el tramo se publica como «estimado».
  const corr = C.leerCorrecciones()[id] || {}, tramoDe = new Map();
  const conTramo = new Set(Object.keys(corr.tramos || {}).map(Number)); // un tramo con corrección cuenta aunque no haya hueco (la Vía Dolorosa sale de la sede)
  for (const k of [...(informe.calles || []), ...[...conTramo].filter((i) => !(informe.calles || []).some((x) => x.i === i)).map((i) => ({ i }))]) if (((k.hueco_entrada_m ?? 0) > HUECO_MAX && k.tipo !== 'catedral') || conTramo.has(k.i)) { // la entrada en la catedral va por su puerta, no es un salto
    const t = corr.tramos?.[k.i]; const prev = [...ps].reverse().find((p) => p.i < k.i); if (prev) tramoDe.set(prev.i, { estimado: !t || !!t.estimado, fuente: t?.fuente || null }); }
  const out = ps.map((p, j) => {
    const sig = ps[j + 1], esSede = p.tipo === 'salida' || p.tipo === 'entrada';
    let lugar = p.lugar; const dir = p.tipo === 'salida' ? informe.salida?.dir : p.tipo === 'entrada' ? informe.entrada?.dir : null;
    if (dir && sn(lugar).startsWith('casa hermandad')) lugar += ' (' + dir.replace(new RegExp(',\\s*' + C.nombre + '$'), '') + ')';
    const [lat, lon] = geo[p.pos];
    const o = { fila: '', lugar, ...(lista.horas[p.i] ? { hora: lista.horas[p.i] } : {}), lat: r6(lat), lon: r6(lon), como: esSede ? 'templo' : ['hito', 'catedral'].includes(p.tipo) ? 'hito' : 'calle', tramo: p.tramo };
    if (lista.rejilla && sig && (hueco.get(sig.i) ?? 0) > 40) { o.como = 'estimado'; o.estimado = true; }
    const tr = tramoDe.get(p.i); if (tr) { if (tr.estimado) { o.como = 'estimado'; o.estimado = true; } if (tr.fuente) o.fuente_tramo = tr.fuente; }
    if (sig && sig.pos > p.pos + 1) o.via = geo.slice(p.pos + 1, sig.pos).map(([a, b]) => [r6(a), r6(b)]);
    return o;
  });
  // el primero y el último son la salida y la entrada; la hora de la salida y del encierro viene de los extremos de la lista
  if (out.length) {
    out[0].rol = 'salida'; out.at(-1).rol = 'entrada';
    if (!out[0].hora && lista.horas[0]) out[0].hora = lista.horas[0];
    const u = lista.calles.length - 1; if (!out.at(-1).hora && lista.horas[u]) out.at(-1).hora = lista.horas[u];
  }
  return out;
}

{
  const hechas = [], saltadas = [];
  for (const id of ids) {
    const d = EV[id]?.decision, fT = path.join(dirSalida(c), 'trazas', id + '.json');
    if (!fs.existsSync(fT) || !INF[id] || INF[id].error) { saltadas.push(`${id}: sin trazado nuevo`); continue; }
    if (!forzar && d?.queda !== 'nuevo') { saltadas.push(`${id}: el evaluador dice «${d?.queda || 'sin evaluar'}» (${(d?.motivo || []).join(' · ')})`); continue; }
    const traza = JSON.parse(fs.readFileSync(fT, 'utf8'));
    const puntos = aPuntos(id, traza, INF[id], L[id]);
    if (puntos.length < 2) { saltadas.push(`${id}: menos de 2 puntos`); continue; }
    const h = R.hermandades[id] || (R.hermandades[id] = {});
    h.tramos = { paso: puntos }; h.fuente = L[id].fuente; h.calles_oficiales = L[id].calles; h.reconstruido = hoy; h.metodo = 'continuidad + GraphHopper';
    hechas.push(id);
  }
  fs.writeFileSync(fR, JSON.stringify(R));
  console.log(`Publicadas en ${path.relative(process.cwd(), fR)}: ${hechas.length}`, hechas.map((x) => x.replace('-' + c, '')).join(', '));
  if (saltadas.length) console.log('Sin publicar:\n  ' + saltadas.join('\n  '));
}
