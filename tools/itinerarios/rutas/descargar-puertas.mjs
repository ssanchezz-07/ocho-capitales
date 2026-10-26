// Ocho Capitales · rutas: descarga de Overpass las puertas (nodos entrance/door) y los templos de una capital, para que la salida
// y la entrada caigan en la puerta real. Caja: la del callejero en caché (cache/osm-<c>.json). Misma consulta que se usó en Málaga.
// Uso: node descargar-puertas.mjs <capital>   → cache/osm-<capital>-puertas.json   (datos © colaboradores de OpenStreetMap, ODbL)
import fs from 'node:fs';
import path from 'node:path';
import { ITI, CAPITALES } from './comun.mjs';

const c = process.argv[2];
if (!CAPITALES.includes(c)) { console.error('Uso: node descargar-puertas.mjs <capital>   capitales: ' + CAPITALES.join(', ')); process.exit(1); }
const osm = JSON.parse(fs.readFileSync(path.join(ITI, 'cache', 'osm-' + c + '.json'), 'utf8'));
let s = 90, n = -90, o = 180, e = -180;
for (const el of osm.elements) for (const g of el.geometry || []) if (g) { s = Math.min(s, g.lat); n = Math.max(n, g.lat); o = Math.min(o, g.lon); e = Math.max(e, g.lon); }
const caja = [s, o, n, e].map((x) => x.toFixed(3)).join(',');
const q = `[out:json][timeout:120];(node["entrance"](${caja});node["door"](${caja}););out body;way["amenity"="place_of_worship"](${caja});out body geom;`;
const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'OchoCapitales-rutas/1.0' }, body: 'data=' + encodeURIComponent(q) });
if (!r.ok) { console.error('Overpass respondió', r.status, (await r.text()).slice(0, 300)); process.exit(1); }
const j = await r.json();
const f = path.join(ITI, 'cache', 'osm-' + c + '-puertas.json');
fs.writeFileSync(f, JSON.stringify(j));
console.log(`${j.elements.filter((x) => x.type === 'node').length} puertas y ${j.elements.filter((x) => x.type === 'way').length} templos (caja ${caja}) → ${path.relative(process.cwd(), f)}`);
