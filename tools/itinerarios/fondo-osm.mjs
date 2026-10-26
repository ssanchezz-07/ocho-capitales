// Ocho Capitales: descarga de OpenStreetMap (Overpass) las capas para un fondo del plano fiel a la ciudad.
// © colaboradores de OpenStreetMap (ODbL). Se guarda en tools/itinerarios/cache/ (fuera de git).
//   A) en el recuadro de los recorridos (+400 m): todas las vías (también peatonales, escaleras y callejones), plazas,
//      ríos, agua, costa, playas, parques y jardines, templos y casas hermandad.
//   B) los edificios a menos de 40 m de algún recorrido publicado (para comprobar que ningún tramo cruza una manzana).
// Uso: node tools/itinerarios/fondo-osm.mjs <ciudad>   (malaga, cordoba, cadiz…)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(DIR, '..', '..');
const ciudad = process.argv[2]; if (!ciudad) { console.error('Falta la ciudad'); process.exit(1); }
const R = JSON.parse(fs.readFileSync(path.join(RAIZ, 'site', 'data', 'recorridos', ciudad + '.json'), 'utf8'));
const CACHE = path.join(DIR, 'cache'); fs.mkdirSync(CACHE, { recursive: true });
const URL = 'https://overpass-api.de/api/interpreter';

// recorridos publicados: polilíneas (punto oficial + vértices por calle)
const lineas = [];
for (const e of [...Object.values(R.hermandades), ...Object.values(R.extraordinarias || {})]) for (const tr of Object.values(e.tramos)) {
  const l = []; for (const p of tr) { if (p.lat == null) continue; l.push([p.lat, p.lon]); for (const v of p.via || []) l.push(v); }
  if (l.length > 1) lineas.push(l);
}
let b = [90, 180, -90, -180]; for (const l of lineas) for (const [la, lo] of l) b = [Math.min(b[0], la), Math.min(b[1], lo), Math.max(b[2], la), Math.max(b[3], lo)];
const m = 0.0036; const bbox = [b[0] - m, b[1] - m * 1.25, b[2] + m, b[3] + m * 1.25].map((x) => x.toFixed(5)).join(',');

async function overpass(q, archivo) {
  const dest = path.join(CACHE, archivo);
  if (fs.existsSync(dest)) { console.log('ya está', archivo); return; }
  for (let i = 0; i < 3; i++) {
    const r = await fetch(URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'OchoCapitales/1.0 (plano propio cofrade)' }, body: 'data=' + encodeURIComponent(q) });
    if (r.ok) { const t = await r.text(); fs.writeFileSync(dest, t); console.log(archivo, (t.length / 1e6).toFixed(1) + ' MB'); return; }
    console.log('Overpass', r.status, 'reintento en 30 s'); await new Promise((ok) => setTimeout(ok, 30000));
  }
  throw new Error('Overpass no responde');
}

await overpass(`[out:json][timeout:240][bbox:${bbox}];
(
  way["highway"];
  way["area:highway"];
  way["place"="square"]; relation["place"="square"];
  way["waterway"~"^(river|riverbank|canal|stream)$"]; relation["waterway"="riverbank"];
  way["natural"~"^(water|coastline|beach|sand)$"]; relation["natural"="water"];
  way["leisure"~"^(park|garden)$"]; relation["leisure"~"^(park|garden)$"];
  way["amenity"="place_of_worship"]; relation["amenity"="place_of_worship"];
  way["building"]["name"~"[Hh]ermandad|[Cc]ofrad|[Aa]rchicofrad"];
);
out geom;`, `fondo-${ciudad}.json`);

// edificios junto a los recorridos: polilíneas resumidas (un vértice cada ~30 m) para que la consulta no sea enorme
const res = lineas.map((l) => { const o = [l[0]]; for (const p of l) { const q = o[o.length - 1]; if (Math.hypot((p[0] - q[0]) * 111000, (p[1] - q[1]) * 89000) > 30) o.push(p); } o.push(l[l.length - 1]); return o; });
const trozos = []; for (const l of res) for (let i = 0; i < l.length; i += 60) trozos.push(l.slice(Math.max(0, i - 1), i + 60));
await overpass(`[out:json][timeout:300];
(
${trozos.filter((t) => t.length > 1).map((t) => `  way["building"](around:40,${t.map(([la, lo]) => la.toFixed(6) + ',' + lo.toFixed(6)).join(',')});`).join('\n')}
);
out geom;`, `edificios-${ciudad}.json`);
