// Ocho Capitales · rutas: genera listas/cadiz.json (formato común de listas) desde tools/itinerarios/listas-cadiz-2026.json
// (programa de Canal Sur 2026 con los itinerarios del Consejo; sedes 2026 con fuente en sedes-cadiz.json).
// - calles: la sede de salida, las calles del itinerario oficial (sin la indicación de lado), la estación de penitencia
//   como marca y la sede de entrada. «a su Templo» se sustituye por el nombre de la sede de entrada.
// - horas: las de la fila del primer paso (o de la cruz de guía si la tabla solo tiene una fila), en salida, calle Nueva,
//   Catedral (entrada y salida), Plaza Candelaria, Palillero y entrada.
// - Solo entran las que tienen ficha en el portal (la Humillación, salida nueva de 2026, la tiene desde el 2026-10-26).
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
  // Por dentro de la Catedral: puerta principal → Arquitecto Acero si el itinerario sigue por Arquitecto Acero (ciudades.mjs);
  // al revés si llega por Arquitecto Acero y sigue por la Plaza de la Catedral (las vísperas, como en 2025). Si no, solo marca.
  const alReves = h.ida.at(-2)?.calle === 'Arquitecto Acero' && /catedral/i.test(h.regreso[0]?.calle || '');
  // la Resurrección llega por la Plaza de la Catedral y vuelve por ella: entra y sale por la puerta principal
  const porPrincipal = /catedral/i.test(h.ida.at(-2)?.calle || '') && /catedral/i.test(h.regreso[0]?.calle || '');
  const porDentro = h.regreso[0]?.calle === 'Arquitecto Acero' || alReves || porPrincipal;
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
  // Nueva → Plaza de San Juan de Dios → Pelota: se cruza la plaza de frente, en línea recta, sin rodeo (Pablo, 2026-10-26).
  // OSM solo tiene como vía el borde sur de la plaza: la plaza va como marca y Pelota se alcanza en recta desde Nueva.
  // De la puerta a la primera calle (y de la última a la puerta) en recta, por un espacio que la red de rutas no recorre:
  // el Huerto cruza la Plaza de Capuchinos (área en OSM) hasta Geólogo McPherson; el Despojado sale por el interior del
  // Colegio Salesianos a la Avenida María Auxiliadora (revisión independiente del 2026-10-26: los dos daban rodeos).
  const rectos_sede = /^(oracion-en-el-huerto|el-despojado)-cadiz$/.test(id) ? ['salida', 'entrada'] : [];
  if (id === 'oracion-en-el-huerto-cadiz') calles.forEach((t, i) => { if (/^plaza de capuchinos$/i.test(t)) hitos.push(i); });
  // Borriquita, al final: «Poeta Nieto, Avda. Andalucía a su Templo». Poeta Nieto acaba en la esquina de San José, que da a la
  // Avenida Ana de Viya (dirección del Ayuntamiento); la Avenida de Andalucía de OSM empieza 70 m al norte: esa última «Avda.
  // Andalucía» es la avenida ante el templo y va como marca (si no, la traza sube y baja 84 m).
  if (id === 'la-borriquita-cadiz') { const k = calles.length - 2; if (/^avda. andaluc/i.test(calles[k]) && clave(calles[k - 1]) === 'poeta nieto') { hitos.push(k); notas.push('La última «Avda. Andalucía» es la avenida ante San José (Ana de Viya en OSM): va como marca.'); } }
  if (rectos_sede.length) notas.push('Salida y entrada en línea recta entre la puerta y la primera/última calle (plaza o patio que la red de rutas no recorre).');
  // Tinte → Plaza San Francisco → San Francisco (Nazareno, Medinaceli): la plaza es un área que la red de rutas no cruza y
  // GraphHopper atajaba por Rosario y Beato Diego; se cruza en recta por el lado abierto de la plaza (al norte del bloque de pisos way/543992134) hasta el arranque de la calle San Francisco
  const cruzar_hasta = {};
  calles.forEach((t, i) => { if (/^plaza (de )?san francisco$/i.test(t) && clave(calles[i - 1] || '') === 'tinte' && clave(calles[i + 1] || '') === 'san francisco') cruzar_hasta[i] = [[36.5345, -6.296], [36.53433, -6.2957]]; });
  if (Object.keys(cruzar_hasta).length) notas.push('Plaza de San Francisco: cruzada en recta de Tinte a la calle San Francisco (área que la red de rutas no recorre).');
  const rectos = [];
  calles.forEach((t, i) => {
    if (!/^plaza (de )?san juan de dios$/i.test(t)) return;
    const a = clave(calles[i - 1] || ''), b = clave(calles[i + 1] || '');
    // Nueva → Pelota o Pomponio Mela (las dos salen de la esquina suroeste): de frente, por la parte abierta de la plaza
    if (a === 'nueva' && /^(pelota|pomponio mela)$/.test(b)) { hitos.push(i); rectos.push(i + 1); return; }
    // Plocia, Lázaro Dou o San Juan de Dios → Avda. 4 de Diciembre: se pasa por la esquina norte, sin entrar en la plaza
    // (OSM solo tiene como vía su borde sur; la revisión vio entradas y vueltas de 30-85 m)
    if (/^(plocia|lazaro dou|san juan dios)$/.test(a) && /diciembre/.test(b)) { hitos.push(i); return; }
    // Nueva → Plocia (Borriquita, Cigarreras, al volver): por la esquina norte, sin bajar a la plaza (la revisión vio un bucle de 80 m)
    if (a === 'nueva' && b === 'plocia') hitos.push(i);
  });
  // la recta pasa por la parte abierta de la plaza: al sur del edificio way/844713222 (lado norte) y al norte del Ayuntamiento
  // y de San Juan de Dios (edificios de OSM del extracto de GraphHopper)
  const rectos_por = Object.fromEntries(rectos.filter((i) => /^(pelota|pomponio mela)$/.test(clave(calles[i]))).map((i) => [i, [[36.53000, -6.29268]]]));
  if (rectos.length) notas.push('Plaza de San Juan de Dios: de Nueva a Pelota de frente, sin rodeo (Pablo, 2026-10-26), por la parte abierta de la plaza; OSM no tiene la plaza como vía.');
  out.hermandades[id] = {
    fuente: `${h.fuente.url} (itinerario, pág. ${h.fuente.pagina_itinerario}; ficha, pág. ${h.fuente.pagina_ficha})`,
    calles, horas, ...(hitos.length ? { hitos } : {}), ...(rectos.length ? { rectos, rectos_por } : {}), ...(rectos_sede.length ? { rectos_sede } : {}), ...(Object.keys(cruzar_hasta).length ? { cruzar_hasta } : {}),
    ...(idx.catedral_salida != null ? { regreso_desde: idx.catedral_salida } : {}),
    ...(porPrincipal ? { catedral: { entra: 7063298453, sale: 7063298453, nombre: 'entra y sale por la puerta principal (Plaza de la Catedral)' } } : {}),
    ...(alReves ? { catedral: { entra: { id: 'puerta de Arquitecto Acero, punto aproximado en la calle ante la fachada', lat: 36.52905, lon: -6.295776 }, sale: 7063298453, nombre: 'de la puerta de Arquitecto Acero a la principal (Plaza de la Catedral)' } } : {}),
    rejilla: false, notas,
  };
}
fs.mkdirSync(path.join(RUTAS, 'listas'), { recursive: true });
fs.writeFileSync(path.join(RUTAS, 'listas', 'cadiz.json'), JSON.stringify(out, null, 1) + '\n');
console.log(Object.keys(out.hermandades).length, 'hermandades → listas/cadiz.json', fuera.length ? '(fuera, sin ficha en el portal: ' + fuera.join(', ') + ')' : '');
