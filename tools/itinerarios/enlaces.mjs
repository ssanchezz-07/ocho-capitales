// Ocho Capitales: uniones a mano entre calles que se tocan, comunes a enrutar.mjs (que dibuja los recorridos por las calles) y a
// geocodificar.mjs (que reparte por ese mismo camino las calles que caían en un mismo punto: repartir()).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Uniones que faltan en el grafo entre calles que se tocan: la caché (geocodificar.mjs, overpass()) solo trae vías con nombre, y
// los tramos sin nombre que las unen (bocas de una glorieta, pasos) no están; las áreas peatonales, en polígono, además solo se
// unen a la red por algunos vértices. [nodo de una vía, nodo de la otra], coordenadas exactas de la caché.
// · Sevilla, Puerta de Jerez y Prado (caché osm-sevilla.json, comprobado el 26-nov): el área de la avenida de la Constitución (way
//   56767102) no se une a Puerta Jerez (way 225659951) por su extremo sur (27 m); el área de la calle San Fernando (way 56767111),
//   ni a Puerta Jerez (13 m) ni a la plaza Don Juan de Austria (way 69986998, 9 m); y la avenida de Carlos V (way 109586263) acaba
//   a 54 m de la glorieta de Don Juan de Austria (way 285587771). Sin ellas, El Cerro iba de la avenida de Carlos V a la de la
//   Constitución por la Glorieta de San Diego y Miguel de Mañara (1.731 m; en recta, 959 m); con ellas, por San Fernando (1.006 m).
export const ENLACES = {
  sevilla: [
    [[37.3828829, -5.9933841], [37.3827652, -5.9931212]],
    [[37.3824592, -5.9930374], [37.3824664, -5.9931790]],
    [[37.3812301, -5.9888209], [37.3812052, -5.9887189]],
    [[37.3808849, -5.9877450], [37.3809976, -5.9883459]],
  ],
};
// Uniones de las plazas que quedaban sueltas (islas), en uniones-osm-<ciudad>.json: vías de OSM sin nombre (aceras, pasos, peatonales)
// y vértices de la plaza a menos de 7 m de un nodo de la red (la misma esquina). Devuelve sus líneas ([[lat, lon], …]) para meterlas en el grafo
// como aristas, nunca como calles; cada línea lleva «anclas» (los puntos que tienen que ser nodos de la caché) y «quien» (para los avisos).
export function uniones(ciudad) {
  const f = path.join(path.dirname(fileURLToPath(import.meta.url)), `uniones-osm-${ciudad}.json`);
  if (!fs.existsSync(f)) return [];
  const U = JSON.parse(fs.readFileSync(f, 'utf8'));
  // una vía sin anclas no se podría comprobar: mejor un error que una unión que pase sin mirar
  for (const v of U.vias || []) if (!v.anclas || !v.anclas.length) throw new Error(`uniones-osm-${ciudad}.json: la vía ${v.id} no tiene anclas`);
  return [...(U.vias || []).map((v) => Object.assign(v.geometry.slice(), { anclas: v.anclas, quien: `vía ${v.id} (${(v.islas || []).join(', ')})` })),
    ...(U.contiguos || []).map((c) => Object.assign([c.a, c.b], { anclas: c.anclas || [c.a, c.b], quien: `contiguo de ${c.isla}` }))];
}
