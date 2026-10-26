// Ocho Capitales · rutas: genera listas/cadiz.json (formato común de listas) desde tools/itinerarios/listas-cadiz-2026.json
// (programa de Canal Sur 2026 con los itinerarios del Consejo; sedes 2026 con fuente en sedes-cadiz.json).
// - calles: la sede de salida, las calles del itinerario oficial (sin la indicación de lado), la estación de penitencia
//   como marca y la sede de entrada. «a su Templo» se sustituye por el nombre de la sede de entrada.
// - horas: las de la fila del primer paso (o de la cruz de guía si la tabla solo tiene una fila), en salida, calle Nueva,
//   Catedral (entrada y salida), Plaza Candelaria, Palillero y entrada.
// - La Humillación (salida nueva de 2026) no tiene ficha en el portal: se queda fuera hasta que la tenga.
// Uso: node lista-cadiz.mjs
import fs from 'node:fs';
import path from 'node:path';
import { RUTAS, ITI, clave } from './comun.mjs';

const D = JSON.parse(fs.readFileSync(path.join(ITI, 'listas-cadiz-2026.json'), 'utf8'));
const out = { capital: 'cadiz', fuente: 'https://www.canalsur.es/resources/archivos_offline/2026/3/26/1774544876433CADIZ_26.pdf', origen: 'tools/itinerarios/listas-cadiz-2026.json (listas-cadiz.mjs)', hermandades: {} };
const fuera = [];
for (const [id, h] of Object.entries(D.hermandades)) {
  if (!h.ficha_portal) { fuera.push(id); continue; }
  const calles = [h.salida.nombre], idx = { salida: 0 };
  // por dentro de la Catedral (puerta principal → Arquitecto Acero) solo si el itinerario sigue por Arquitecto Acero (ciudades.mjs)
  const porDentro = h.regreso[0]?.calle === 'Arquitecto Acero';
  for (const e of [...h.ida, ...h.regreso]) {
    if (e.fin) continue;
    if (e.catedral) { idx.catedral_entrada = calles.length; calles.push(porDentro ? 'Estación de Penitencia en la S.I.C.' : 'Estación de penitencia en la Catedral'); idx.catedral_salida = calles.length; continue; }
    calles.push(e.calle);
  }
  calles.push(h.entrada.nombre); idx.entrada = calles.length - 1;
  const ic = idx.catedral_entrada ?? 0, tras = (re) => { const k = calles.findIndex((t, i) => i > ic && re.test(clave(t))); return k > 0 ? k : null; };
  idx.nueva = calles.findIndex((t, i) => i > 0 && i < (idx.catedral_entrada ?? calles.length) && clave(t) === 'nueva');
  if (idx.nueva < 0) delete idx.nueva;
  idx.candelaria = tras(/^candelaria$/); idx.palillero = tras(/^palillero$/);
  if (h.sin_estacion) { delete idx.catedral_salida; idx.palillero = calles.findIndex((t) => clave(t) === 'palillero'); }
  const fila = h.horas ? h.horas.paso || h.horas.cruz_de_guia : null, horas = {};
  if (fila) for (const [col, hora] of Object.entries(fila)) if (idx[col] != null && idx[col] >= 0 && !(idx[col] in horas)) horas[idx[col]] = hora;
  const notas = [`Horas: fila «${h.horas?.paso ? 'paso' : 'cruz de guía'}» de la tabla del programa (pág. ${h.fuente.pagina_ficha}).`];
  if (h.horas?.anio_de_la_tabla && h.horas.anio_de_la_tabla !== '2026') notas.push(`La tabla de horas del programa dice ${h.horas.anio_de_la_tabla}.`);
  if (h.sede_2026) notas.push('Sede 2026: ' + h.sede_2026.cita + (h.sede_2026.nota ? ' ' + h.sede_2026.nota : ''));
  if (h.sin_estacion) notas.push(h.sin_estacion);
  if (h.erratas_del_programa) notas.push('Erratas del programa corregidas al separar calles: ' + h.erratas_del_programa.join('; ') + '.');
  // marcas que no son calles de OSM: el interior del colegio y del parque, y la Plaza del Stmo. Cristo de la Vera Cruz
  // (junto a San Francisco), que OSM no tiene y que el parecido de nombres emparejaría con «Calle Cruz», a 600 m
  const hitos = calles.map((t, i) => (/^(colegio salesianos|interior del|plaza stmo\. cristo de la vera)/i.test(t) ? i : -1)).filter((i) => i >= 0);
  out.hermandades[id] = {
    fuente: `${h.fuente.url} (itinerario, pág. ${h.fuente.pagina_itinerario}; ficha, pág. ${h.fuente.pagina_ficha})`,
    calles, horas, ...(hitos.length ? { hitos } : {}),
    ...(idx.catedral_salida != null ? { regreso_desde: idx.catedral_salida } : {}),
    rejilla: false, notas,
  };
}
fs.mkdirSync(path.join(RUTAS, 'listas'), { recursive: true });
fs.writeFileSync(path.join(RUTAS, 'listas', 'cadiz.json'), JSON.stringify(out, null, 1) + '\n');
console.log(Object.keys(out.hermandades).length, 'hermandades → listas/cadiz.json', fuera.length ? '(fuera, sin ficha en el portal: ' + fuera.join(', ') + ')' : '');
