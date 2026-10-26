// Ocho Capitales · rutas: dossier para una revisión independiente (lista, calles que recorre lo publicado, métricas, sede, avisos,
// tramos «estimado» y correcciones con su fuente). Uso: node dossier.mjs <capital> [id …] → salida/<capital>/dossier.md
import fs from 'node:fs';
import path from 'node:path';
import { ciudad, d2, RUTAS, fPublicado, argumentos } from './comun.mjs';
const { c, ids } = argumentos(); const R = RUTAS + '/';
const C = ciudad(c); const INF = JSON.parse(fs.readFileSync(R + 'salida/' + c + '/informe.json', 'utf8')); const EV = JSON.parse(fs.readFileSync(R + 'salida/' + c + '/evaluacion.json', 'utf8')); const CO = JSON.parse(fs.readFileSync(R + 'correcciones-' + c + '.json', 'utf8'));
const PUB = JSON.parse(fs.readFileSync(fPublicado(c), 'utf8')).hermandades;
const sec = (t) => { const g = [...t.ida, ...t.regreso.slice(1)].map((p) => C.X(...p)); const out = []; for (let i = 1; i < g.length; i++) { const L = d2(g[i], g[i - 1]), n = Math.max(1, Math.ceil(L / 4)); for (let k = 0; k < n; k++) { const p = [g[i-1][0] + (g[i][0]-g[i-1][0])*(k+.5)/n, g[i-1][1] + (g[i][1]-g[i-1][1])*(k+.5)/n]; let best = null, bd = 9; for (const [vi, d] of C.viasCerca(p, 8)) if (C.VIAS[vi].nombre && d < bd) { bd = d; best = C.VIAS[vi].nombre; } if (!best) continue; const u = out.at(-1); if (u && u[0] === best) u[1] += L / n; else out.push([best, L / n]); } } return out.filter((x) => x[1] >= 6).map((x) => x[0] + ' ' + Math.round(x[1])).join(' → '); };
let s = `# Dossier de revisión · recorridos de ${C.nombre} 2026 (publicados)\n\n`;
for (const id of ids) { const L = C.LISTAS[id], e = EV[id]?.nuevo, inf = INF[id], h = PUB[id];
  s += `## ${id}\n- Lista oficial (literal, ${L.calles.length} elementos): ${L.calles.map((x, i) => `${i + 1}:${x}`).join(' · ')}\n- Horas oficiales (fila → hora): ${JSON.stringify(Object.fromEntries(Object.entries(L.horas).map(([k, v]) => [+k + 1, v])))}\n`;
  if (L.notas?.length) s += `- Notas de la lista: ${L.notas.join(' | ')}\n`;
  s += `- Trazado publicado, calles por las que pasa (m): ${sec(C.publicado(id))}\n`;
  s += `- Evaluador: ${e.recorridas}/${e.comprobables} calles, ${e.en_orden} en orden, salida a ${e.salida_m} m y entrada a ${e.entrada_m} m de la sede, ${e.retrocesos} retrocesos, rectas >150 m: ${e.rectas_150.length}, ${e.largo_m} m\n`;
  s += `- Sede: salida «${inf.salida?.como || '—'}»; entrada «${inf.entrada?.como || '—'}»\n- Avisos: ${inf.avisos.join(' | ') || '—'}\n`;
  const est = h.tramos.paso.filter((p) => p.estimado).map((p) => p.lugar); if (est.length) s += `- Tramos publicados como «estimado» (desde): ${est.join(', ')}\n`;
  if (CO[id]) s += `- Correcciones: ${CO[id].fuentes.map((f) => f.cambios + ' [fuente: ' + f.fuente + ']').join(' || ')}\n`;
  s += `- Captura: tools/itinerarios/rutas/capturas/${c}/${id.replace('-' + c, '')}.png\n\n`; }
const out = path.join(RUTAS, 'salida', c, 'dossier.md'); fs.writeFileSync(out, s); console.log(s.length, 'caracteres');
