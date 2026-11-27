// Ocho Capitales · Sevilla: añade al callejero en caché (cache/osm-sevilla.json) los barrios que quedan fuera de su caja
// (geocodificar.mjs: CENTRO ± radio), para trazar sus recorridos:
// - al sur, Bellavista (Bellavista): sus calles Guadalajara, Ávila, Logroño… casaban con las de San Juan de Aznalfarache, a 6 km;
// - al este, Torreblanca (Dolores de Torreblanca) y Parque Alcosa (Divino Perdón): ninguna de sus calles estaba.
// Los recuadros se solapan con la caja de la ciudad unos 600 m, para que la red quede unida. Misma consulta de Overpass que
// geocodificar.mjs, como callejero-extra-cordoba.mjs; no repite elementos que ya estén (manda la caché de la ciudad).
// Además, las vías SIN nombre de esos barrios (paseos y calles peatonales, sobre todo en Parque Alcosa), solo las que quedan enteras
// fuera de la caja de la ciudad: entran en la red de enrutar.mjs, no en el índice de calles. Comprobado el 27-nov: no cambia ningún
// otro recorrido de Sevilla (sí entran calles con nombre y templos en el índice, así que hay que volver a comprobarlo si cambian los
// recuadros). geocodificar.mjs avisa y no escribe Sevilla si faltan (TESTIGOS).
// Uso (antes de geocodificar.mjs y enrutar.mjs, cada vez que se vuelva a bajar la caché):
//   node tools/itinerarios/callejero-extra-sevilla.mjs
// (datos © colaboradores de OpenStreetMap, ODbL)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const f = path.join(path.dirname(fileURLToPath(import.meta.url)), 'cache', 'osm-sevilla.json');
const UA = 'OchoCapitales/1.0 (https://github.com/ssanchezz-07/ocho-capitales; portal cofrade sin animo de lucro)';
const CAJAS = { sur: '37.300,-6.000,37.350,-5.940', este: '37.365,-5.945,37.425,-5.880' };
// la caja de la ciudad (geocodificar.mjs: CENTRO.sevilla = [37.3891, -5.9945, 0.045], 1,25 veces en longitud): si cambia allí, cámbiala aquí
const CIUDAD = [37.3891 - 0.045, -5.9945 - 0.045 * 1.25, 37.3891 + 0.045, -5.9945 + 0.045 * 1.25];
const dentroCiudad = (g) => g.lat >= CIUDAD[0] && g.lat <= CIUDAD[2] && g.lon >= CIUDAD[1] && g.lon <= CIUDAD[3];
const SIN_NOMBRE = '^(footway|pedestrian|path|residential|living_street|unclassified)$';
const osm = JSON.parse(fs.readFileSync(f, 'utf8'));
const ya = new Set(osm.elements.map((e) => e.type + e.id));
let total = 0;
for (const [nom, bb] of Object.entries(CAJAS)) {
  const q = `[out:json][timeout:120];(way["highway"]["name"](${bb});way["place"="square"]["name"](${bb});way["highway"]["alt_name"](${bb});nwr["amenity"="place_of_worship"]["name"](${bb});way["highway"~"${SIN_NOMBRE}"][!"name"](${bb}););out geom tags;`;
  let nuevo = null;
  for (let i = 0; i < 4 && !nuevo; i++) {
    const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q) });
    const tx = await r.text();
    if (r.ok && tx.startsWith('{')) nuevo = JSON.parse(tx);
    else { console.error('Overpass respondió', r.status, 'para', nom); await new Promise((s) => setTimeout(s, 20000)); }
  }
  if (!nuevo) { console.error('Overpass sin respuesta para', nom, '; no se toca la caché'); process.exit(1); }
  // las vías sin nombre, solo si no tienen ningún vértice dentro de la caja de la ciudad
  const mas = nuevo.elements.filter((e) => !ya.has(e.type + e.id) && !(e.tags && e.tags.highway && !e.tags.name && !e.tags.alt_name && (e.geometry || []).some((g) => g && dentroCiudad(g))));
  for (const e of mas) ya.add(e.type + e.id);
  osm.elements.push(...mas); total += mas.length;
  console.log(`${nom}: ${mas.length} elementos nuevos de ${nuevo.elements.length} (Overpass ${nuevo.osm3s && nuevo.osm3s.timestamp_osm_base})`);
}
fs.writeFileSync(f, JSON.stringify(osm));
console.log(`${total} elementos añadidos a ${path.relative(process.cwd(), f)} (Bellavista, Torreblanca y Parque Alcosa; con las vías sin nombre de fuera de la caja)`);
