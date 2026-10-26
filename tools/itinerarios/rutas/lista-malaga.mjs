// Ocho Capitales · rutas: genera listas/malaga.json (formato común de listas) a partir de lo que ya está publicado.
// Las calles son las «calles_oficiales» de site/data/recorridos/malaga.json, que salen del PDF oficial de la Agrupación de
// Cofradías 2026 (parsear-acc-malaga.mjs + limpieza de reconstruir-malaga.mjs). Las horas oficiales son las de los puntos
// publicados (malaga-horarios-2026.json): salida, Tribuna Principal, Torre Sur, Estación de Penitencia y encierro.
// Uso: node lista-malaga.mjs   (solo hace falta repetirlo si cambian las listas o las horas publicadas)
import fs from 'node:fs';
import path from 'node:path';
import { RUTAS, ITI, fPublicado, sn } from './comun.mjs';

const P = JSON.parse(fs.readFileSync(fPublicado('malaga'), 'utf8'));
const fInf = path.join(ITI, 'cache', 'malaga-reconstruccion.json');
const INF = fs.existsSync(fInf) ? JSON.parse(fs.readFileSync(fInf, 'utf8')) : {};
// Arreglos de lectura del PDF (con la línea del PDF como fuente). Idempotentes: solo actúan si el error sigue en la lista.
const ARREGLOS = {
  'dulce-nombre-malaga': { partir: { 'Tribuna Principal Marqués de Larios': ['Tribuna Principal', 'Marqués de Larios'] }, nota: 'PDF de la Agrupación 2026, Dulce Nombre: «… Plaza de la Constitución, Tribuna Principal» y en la línea siguiente «Marqués de Larios, Martínez …», sin coma por el salto de línea; la lectura los había juntado en un solo elemento.' },
  'mediadora-malaga': { juntar: [['Ingeniero José María Garnica', 'Garnica']], resultado: 'Ingeniero José María Garnica', nota_juntar: 'PDF de la Agrupación 2026, Mediadora: «Avenida del Ingeniero José María» y, en la línea siguiente, «Garnica»: es una sola calle (Avenida del Ingeniero José María Garnica); la lectura la había partido en dos.' },
  'monte-calvario-malaga': { juntar: [['Plaza de María', 'Guerrero']], nota_juntar: 'PDF de la Agrupación 2026, Monte Calvario: «Victoria, Plaza de María, Guerrero, Granada», con una coma de más: es la Plaza de María Guerrero (OSM way 27584441), entre Victoria y la Plaza de la Merced.', horas: { 0: '15:00', 5: '16:00' }, nota_horas: 'PDF de la Agrupación 2026, Monte Calvario: «(Salida 15:00) Vía Dolorosa del Calvario … Basílica y Santuario de Santa María de la Victoria (Salida 16:00)». La salida de la ermita es a las 15:00 y la de la Basílica, a las 16:00; antes la de las 16:00 iba en la ermita.', hitos: [0, 5], nota_hitos: 'La Vía Dolorosa (fila 1) es la bajada desde la Ermita del Calvario y la Basílica (fila 6) es la parada de las 16:00, no calles: van como hitos.' },
  'salesianos-malaga': { hitos_por_nombre: ['Alcubilla'], nota_hitos: '«Alcubilla» no está en OSM cerca del recorrido ni en el itinerario de 2020 (semanasantamalaga.info: «Plaza Montaño, Dos Aceras, Carrera de Capuchinos»); la única Alcubilla de Málaga en OSM está en Bailén-Miraflores, a unos 2,7 km: va como hito, sin situarla.' },
  'cautivo-malaga': { hitos: [2, 36], nota_hitos: 'La «Plaza de Jesús Cautivo» (filas 3 y 37) no está en OSM ni en el callejero consultado: va como hito en el paso de Barrera de la Trinidad a Trinidad, que es donde la sitúa la lista, junto a la casa hermandad. No se dibuja ninguna calle inventada.' },
};
function arreglar(id, calles, horas, notas, hitos) {
  const A = ARREGLOS[id]; if (!A) return;
  for (const partes of A.juntar || []) {
    const i = calles.findIndex((x, j) => partes.every((p, k) => calles[j + k] === p));
    if (i < 0) { if (calles.includes(A.resultado || partes.join(' '))) notas.push(A.nota_juntar); continue; } // ya junto: se conserva la nota
    calles.splice(i, partes.length, A.resultado || partes.join(' '));
    for (const k of Object.keys(horas).map(Number).sort((x, y) => x - y)) if (k >= i + partes.length) { horas[k - partes.length + 1] = horas[k]; delete horas[k]; }
    notas.push(A.nota_juntar);
  }
  if (A.horas) { Object.assign(horas, A.horas); notas.push(A.nota_horas); }
  for (const [junto, partes] of Object.entries(A.partir || {})) {
    const i = calles.indexOf(junto); if (i < 0) { if (calles.some((x, j) => partes.every((p, k) => calles[j + k] === p))) notas.push(A.nota); continue; } // ya partido: se conserva la nota
    calles.splice(i, 1, ...partes);
    for (const k of Object.keys(horas).map(Number).sort((x, y) => y - x)) if (k > i) { horas[k + partes.length - 1] = horas[k]; delete horas[k]; }
    notas.push(A.nota);
  }
  if (A.hitos_por_nombre) A.hitos = calles.map((x, i) => (A.hitos_por_nombre.includes(x) ? i : -1)).filter((i) => i >= 0);
  if (A.hitos) { hitos.push(...A.hitos.filter((i) => !hitos.includes(i))); notas.push(A.nota_hitos); }
}
const out = { capital: 'malaga', fuente: 'https://agrupaciondecofradias.com/wp-content/uploads/2026/02/Horarios_ACC_SS_2026.pdf', origen: 'calles_oficiales publicadas (PDF de la Agrupación 2026, limpias por reconstruir-malaga.mjs) y horas de malaga-horarios-2026.json', hermandades: {} };
for (const [id, h] of Object.entries(P.hermandades)) {
  if (!h.calles_oficiales) continue;
  const calles = [...h.calles_oficiales], horas = {}; let k = 0;
  for (const p of h.tramos.paso) {
    if (!p.hora) continue;
    let i = p.rol === 'salida' ? 0 : p.rol === 'entrada' ? calles.length - 1 : calles.findIndex((t, j) => j >= k && sn(t) === sn(p.lugar));
    if (i < 0) { console.error('hora sin elemento en la lista:', id, p.lugar, p.hora); continue; }
    horas[i] = p.hora; k = i;
  }
  const notas = [INF[id]?.salida_nazarenos, INF[id]?.torre_sur_derivada].filter(Boolean);
  const hitos = []; arreglar(id, calles, horas, notas, hitos);
  out.hermandades[id] = { fuente: h.fuente, calles, horas, ...(hitos.length ? { hitos } : {}), ...(notas.length ? { notas } : {}) };
}
fs.mkdirSync(path.join(RUTAS, 'listas'), { recursive: true });
fs.writeFileSync(path.join(RUTAS, 'listas', 'malaga.json'), JSON.stringify(out, null, 1));
console.log(Object.keys(out.hermandades).length, 'hermandades →', path.join('listas', 'malaga.json'));
