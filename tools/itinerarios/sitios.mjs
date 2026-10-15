// Ocho Capitales: sitios útiles junto a los recorridos para la «ruta de penitencia del día» (OpenStreetMap, gratis).
// Bares y cafeterías, restaurantes, supermercados y tiendas de alimentación, panaderías, fuentes de agua, aseos y farmacias
// a menos de 180 m de algún punto de los recorridos. © colaboradores de OpenStreetMap (ODbL).
// Salida: site/data/sitios/<ciudad>.json  [[lat, lon, tipo, nombre, horario?], …]
// Uso: node tools/itinerarios/sitios.mjs [ciudad]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(DIR, '..', '..');
const OUT = path.join(RAIZ, 'site', 'data', 'sitios'); fs.mkdirSync(OUT, { recursive: true });
const CACHE = path.join(DIR, 'cache'); fs.mkdirSync(CACHE, { recursive: true });
const UA = 'OchoCapitales/1.0 (https://github.com/ssanchezz-07/ocho-capitales; portal cofrade sin animo de lucro)';
const TIPO = (t) => /^(bar|pub|cafe|biergarten)$/.test(t.amenity) ? 'bar' : /^(restaurant|fast_food|food_court|ice_cream)$/.test(t.amenity) ? 'comer'
  : /^(supermarket|convenience|greengrocer|kiosk|deli|general)$/.test(t.shop) ? 'tienda' : /^(bakery|pastry|confectionery)$/.test(t.shop) ? 'panaderia'
  : t.amenity === 'drinking_water' ? 'agua' : t.amenity === 'toilets' ? 'aseo' : t.amenity === 'pharmacy' ? 'farmacia' : null;

const solo = process.argv[2];
for (const f of fs.readdirSync(path.join(RAIZ, 'site', 'data', 'recorridos'))) {
  const ciudad = f.replace('.json', ''); if (solo && solo !== ciudad) continue;
  const R = JSON.parse(fs.readFileSync(path.join(RAIZ, 'site', 'data', 'recorridos', f), 'utf8'));
  const P = Object.values(R.hermandades).flatMap((h) => Object.values(h.tramos).flat()).filter((p) => p.lat != null);
  let [la0, la1, lo0, lo1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const p of P) { la0 = Math.min(la0, p.lat); la1 = Math.max(la1, p.lat); lo0 = Math.min(lo0, p.lon); lo1 = Math.max(lo1, p.lon); }
  const bb = [la0 - 0.002, lo0 - 0.0025, la1 + 0.002, lo1 + 0.0025].join(',');
  const cf = path.join(CACHE, `sitios-${ciudad}.json`);
  let osm;
  if (fs.existsSync(cf)) osm = JSON.parse(fs.readFileSync(cf, 'utf8'));
  else {
    const q = `[out:json][timeout:120];(nwr["amenity"~"^(bar|pub|cafe|biergarten|restaurant|fast_food|food_court|ice_cream|drinking_water|toilets|pharmacy)$"](${bb});nwr["shop"~"^(supermarket|convenience|greengrocer|kiosk|deli|general|bakery|pastry|confectionery)$"](${bb}););out center tags;`;
    for (let i = 0; i < 3 && !osm; i++) {
      const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q) });
      if (r.ok) { osm = await r.json(); fs.writeFileSync(cf, JSON.stringify(osm)); } else { console.log('overpass', ciudad, r.status); await new Promise((s) => setTimeout(s, 20000)); }
    }
    await new Promise((s) => setTimeout(s, 4000));
  }
  if (!osm) continue;
  // rejilla de ~100 m con los puntos de los recorridos para filtrar rápido por cercanía
  const celda = (la, lo) => Math.round(la * 900) + ':' + Math.round(lo * 750);
  const malla = new Set(); for (const p of P) for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) malla.add((Math.round(p.lat * 900) + a) + ':' + (Math.round(p.lon * 750) + b));
  const out = [];
  for (const e of osm.elements) {
    const t = e.tags || {}, tipo = TIPO(t); if (!tipo) continue;
    const la = e.lat ?? (e.center && e.center.lat), lo = e.lon ?? (e.center && e.center.lon); if (la == null) continue;
    if (!malla.has(celda(la, lo))) continue;
    if (!t.name && !/agua|aseo/.test(tipo)) continue;
    out.push([+la.toFixed(6), +lo.toFixed(6), tipo, t.name || '', t.opening_hours || '']);
  }
  fs.writeFileSync(path.join(OUT, ciudad + '.json'), JSON.stringify(out));
  const c = {}; for (const x of out) c[x[2]] = (c[x[2]] || 0) + 1;
  console.log(ciudad, out.length, 'sitios', JSON.stringify(c));
}
