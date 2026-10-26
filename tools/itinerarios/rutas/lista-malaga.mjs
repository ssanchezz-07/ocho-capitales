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
const out = { capital: 'malaga', fuente: 'https://agrupaciondecofradias.com/wp-content/uploads/2026/02/Horarios_ACC_SS_2026.pdf', origen: 'calles_oficiales publicadas (PDF de la Agrupación 2026, limpias por reconstruir-malaga.mjs) y horas de malaga-horarios-2026.json', hermandades: {} };
for (const [id, h] of Object.entries(P.hermandades)) {
  if (!h.calles_oficiales) continue;
  const calles = h.calles_oficiales, horas = {}; let k = 0;
  for (const p of h.tramos.paso) {
    if (!p.hora) continue;
    let i = p.rol === 'salida' ? 0 : p.rol === 'entrada' ? calles.length - 1 : calles.findIndex((t, j) => j >= k && sn(t) === sn(p.lugar));
    if (i < 0) { console.error('hora sin elemento en la lista:', id, p.lugar, p.hora); continue; }
    horas[i] = p.hora; k = i;
  }
  const notas = [INF[id]?.salida_nazarenos, INF[id]?.torre_sur_derivada].filter(Boolean);
  out.hermandades[id] = { fuente: h.fuente, calles, horas, ...(notas.length ? { notas } : {}) };
}
fs.mkdirSync(path.join(RUTAS, 'listas'), { recursive: true });
fs.writeFileSync(path.join(RUTAS, 'listas', 'malaga.json'), JSON.stringify(out, null, 1));
console.log(Object.keys(out.hermandades).length, 'hermandades →', path.join('listas', 'malaga.json'));
