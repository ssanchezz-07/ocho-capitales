// Ocho Capitales · Córdoba: añade al callejero en caché (cache/osm-cordoba.json) lo que le falta para trazar los recorridos:
// - las calles de Alcolea, que quedan fuera de su caja (Dolores de Alcolea);
// - los puentes sin nombre de calle pero con «bridge:name» (el Puente Romano: comun.mjs lo lee como nombre);
// - la Carretera Palma del Río, que no venía en la descarga original.
// Misma consulta de Overpass que geocodificar.mjs. Uso: node --dns-result-order=ipv4first tools/itinerarios/callejero-extra-cordoba.mjs
// (datos © colaboradores de OpenStreetMap, ODbL)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const f = path.join(path.dirname(fileURLToPath(import.meta.url)), 'cache', 'osm-cordoba.json');
const al = '37.922,-4.695,37.948,-4.655', co = '37.841,-4.852,37.971,-4.700';
const q = `[out:json][timeout:120];(way["highway"]["name"](${al});way["place"="square"]["name"](${al});way["highway"]["alt_name"](${al});nwr["amenity"="place_of_worship"]["name"](${al});`
  + `way["highway"]["bridge:name"](${co});way["highway"]["name"~"Palma del R"](${co}););out geom tags;`;
const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'User-Agent': 'OchoCapitales-rutas/1.0', 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q) });
if (!r.ok) { console.error('Overpass respondió', r.status); process.exit(1); }
const nuevo = await r.json(), osm = JSON.parse(fs.readFileSync(f, 'utf8'));
const ya = new Set(osm.elements.map((e) => e.type + e.id));
const mas = nuevo.elements.filter((e) => !ya.has(e.type + e.id));
osm.elements.push(...mas);
fs.writeFileSync(f, JSON.stringify(osm));
console.log(`${mas.length} elementos añadidos a ${path.relative(process.cwd(), f)} (Alcolea, puentes con bridge:name, Carretera Palma del Río)`);
