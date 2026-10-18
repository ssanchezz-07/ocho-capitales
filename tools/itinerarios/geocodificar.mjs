// Ocho Capitales: sitúa en el mapa cada punto de los itinerarios oficiales (tools/sources/itinerarios-2026.json).
// Descarga de OpenStreetMap (Overpass, gratis, © colaboradores de OpenStreetMap, ODbL) las calles con nombre y los
// templos del centro de cada capital, casa cada «lugar» del itinerario con su calle (expandiendo abreviaturas) y elige,
// de los tramos de esa calle, el más cercano al punto anterior para que el recorrido sea continuo.
// Salida: site/data/recorridos/<ciudad>.json (puntos con lat/lon) y un informe de lo que no se pudo situar.
// Uso: node tools/itinerarios/geocodificar.mjs [ciudad]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(DIR, '..', '..');
const ITI = JSON.parse(fs.readFileSync(path.join(RAIZ, 'tools', 'sources', 'itinerarios-2026.json'), 'utf8'));
const D = JSON.parse(fs.readFileSync(path.join(RAIZ, 'portal-cofrade', 'data', 'portal.json'), 'utf8'));
const CACHE = path.join(DIR, 'cache'); fs.mkdirSync(CACHE, { recursive: true });
const OUT = path.join(RAIZ, 'site', 'data', 'recorridos'); fs.mkdirSync(OUT, { recursive: true });
const UA = 'OchoCapitales/1.0 (https://github.com/ssanchezz-07/ocho-capitales; portal cofrade sin animo de lucro)';
// Centro histórico de cada capital (lat, lon) y radio del recuadro en grados
const CENTRO = { sevilla: [37.3891, -5.9945, 0.045], malaga: [36.7213, -4.4214, 0.04], granada: [37.1773, -3.5986, 0.035], cordoba: [37.8847, -4.7792, 0.04], cadiz: [36.5297, -6.2925, 0.03], huelva: [37.2614, -6.9447, 0.035], almeria: [36.8381, -2.4597, 0.035], jaen: [37.7796, -3.7849, 0.03] };
const H = Object.fromEntries(D.hermandades.map((h) => [h.slug, h]));

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/\bc\s*\/\s*/g, 'calle ').replace(/\bcª\s*/g, 'calle ').replace(/\bca\.?\s/g, 'calle ')
  .replace(/\bpza\.?\s|\bpl\.\s|\bplza\.?\s/g, 'plaza ').replace(/\bavda?\.?\s|\bav\.\s/g, 'avenida ').replace(/\bpte\.?\s/g, 'puente ').replace(/\bpº\s|\bpso\.?\s|\bp\.\s/g, 'paseo ')
  .replace(/\bsto\.?\s/g, 'santo ').replace(/\bsta\.?\s/g, 'santa ').replace(/\bs\.\s/g, 'san ').replace(/\bntra\.?\s/g, 'nuestra ').replace(/\bsra\.?\s/g, 'senora ').replace(/\bntro\.?\s/g, 'nuestro ')
  .replace(/\bdr\.?\s/g, 'doctor ').replace(/\bmª\s|\bma\.\s/g, 'maria ').replace(/\bcta\.?\s/g, 'cuesta ').replace(/\bglta\.?\s/g, 'glorieta ').replace(/\bcllon\.?\s/g, 'callejon ')
  .replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const TIPO = /^(calle|plaza|avenida|paseo|puente|cuesta|glorieta|callejon|ronda|carrera|camino|pasaje|travesia|alameda|costanilla|plazuela|patio|muelle|explanada|carretera)\s+/;
const nucleo = (s) => norm(s).replace(TIPO, '').replace(/^(de|del|de la|de los|de las)\s+/, '').trim();

async function overpass(ciudad) {
  const f = path.join(CACHE, `osm-${ciudad}.json`);
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  const [la, lo, r] = CENTRO[ciudad]; const bb = [la - r, lo - r * 1.25, la + r, lo + r * 1.25].join(',');
  const q = `[out:json][timeout:120];(way["highway"]["name"](${bb});way["place"="square"]["name"](${bb});way["highway"]["alt_name"](${bb});nwr["amenity"="place_of_worship"]["name"](${bb}););out geom tags;`;
  for (let i = 0; i < 3; i++) {
    const r2 = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q) });
    if (r2.ok) { const j = await r2.json(); fs.writeFileSync(f, JSON.stringify(j)); return j; }
    console.log('overpass', ciudad, r2.status); await new Promise((s) => setTimeout(s, 20000));
  }
  throw new Error('Overpass sin respuesta para ' + ciudad);
}

function indice(osm) {
  const calles = new Map(), templos = [];
  for (const e of osm.elements) {
    const t = e.tags || {};
    const geo = e.geometry ? e.geometry.map((p) => [p.lat, p.lon]) : e.lat ? [[e.lat, e.lon]] : e.center ? [[e.center.lat, e.center.lon]] : null;
    if (!geo || !geo.length) continue;
    if (t.amenity === 'place_of_worship') { templos.push({ nombre: norm(t.name), geo }); continue; }
    for (const nm of [t.name, t.alt_name, t.old_name, t.official_name].filter(Boolean)) {
      for (const k of new Set([norm(nm), nucleo(nm)])) { if (!k) continue; if (!calles.has(k)) calles.set(k, []); calles.get(k).push(geo); }
    }
  }
  return { calles, templos };
}
const centro = (geo) => { const n = geo.length; return [geo.reduce((a, p) => a + p[0], 0) / n, geo.reduce((a, p) => a + p[1], 0) / n]; };
const dist = (a, b) => Math.hypot(a[0] - b[0], (a[1] - b[1]) * Math.cos(a[0] * Math.PI / 180));
// el punto de una calle más cercano a una referencia (para seguir el recorrido de forma continua)
function cercano(geos, ref) {
  let best = null, bd = Infinity;
  for (const g of geos) for (const p of g) { const d = ref ? dist(p, ref) : 0; if (d < bd) { bd = d; best = p; } }
  return best || centro(geos[0]);
}
const ESPECIAL = /^(salida|entrada|entra|encierro|recogida|templo|a su templo|a su capilla|sale|se recoge|salida r)$/;
// «Carrera oficial» de cada capital: la calle de OSM donde empieza (se busca por nombre, no por coordenadas fijas)
const CARRERA = { sevilla: 'campana', malaga: 'alameda principal', granada: 'carrera de la virgen', cordoba: 'puerta del puente', cadiz: 'plaza de san juan de dios', huelva: 'plaza de las monjas', almeria: 'paseo de almeria', jaen: 'plaza de santa maria' };

// Puntos fijos que OSM no da como calle. Córdoba: la carrera oficial entra por el Triunfo, atraviesa la Mezquita-Catedral (patio de los
// Naranjos, interior, puertas) y sale a Cardenal Herrero. Coordenadas aproximadas (a escala de plano) de la Mezquita y de esas calles.
const FIJOS = {
  cordoba: {
    'entrada c o': [37.87798, -4.77928],
    'salida c o': [37.87982, -4.77989],
    'patio naranjos': [37.87975, -4.77955],
    'puerta del perdon': [37.87978, -4.78005],
    'interior s i c': [37.87915, -4.77945],
    'puerta de las cofradias': [37.87905, -4.77985],
  },
};
// Nombres cortados o abreviados en los PDF que sí existen en OSM con su nombre completo (comprobado en tools/itinerarios/cache/osm-*.json)
const ALIAS = {
  sevilla: { 'jesus del gran': 'Jesús del Gran Poder', 'dona maria': 'Doña María Coronel', 'avenida isabel la c': 'Isabel la Católica', 'isabel la c': 'Isabel la Católica', 'ramon y caj': 'Ramón y Cajal', 'avenida ramon y cajal': 'Ramón y Cajal' },
  granada: { 'gran via': 'Gran Vía de Colón' },
  huelva: { 'federico molina': 'Avenida del Alcalde Federico Molina Orta', 'avenida federico molina': 'Avenida del Alcalde Federico Molina Orta', 'baez': 'Plaza de Quintero Báez' },
  malaga: { 'alameda': 'Alameda Principal' },
  cordoba: { 'conde cardenas': 'Conde de Cárdenas', 'doctor maranon': 'Doctor Gregorio Marañón' },
};
function situar(ix, ciudad, h, pts) {
  const sede = h && h.sede ? norm(h.sede) : '';
  // ancla: el primer punto del itinerario que es una calle reconocible (para elegir la sede y la catedral cercanas)
  let ancla = null;
  for (const p of pts) { const k = [norm(p.lugar), nucleo(p.lugar)].find((x) => x && ix.calles.has(x)); if (k) { ancla = centro(ix.calles.get(k)[0]); break; } }
  const cerca = (g) => !ancla || dist(centro(g), ancla) * 111000 < 1500;
  const cand = sede ? ix.templos.filter((t) => cerca(t.geo)).map((t) => [t, nucleo(t.nombre).split(' ').filter((w) => w.length > 3 && sede.includes(w)).length]).sort((a, b) => b[1] - a[1])[0] : null;
  const pSede = cand && cand[1] > 0 ? centro(cand[0].geo) : null;
  const cats = ix.templos.filter((t) => /catedral/.test(t.nombre)).sort((a, b) => (ancla ? dist(centro(a.geo), ancla) - dist(centro(b.geo), ancla) : 0));
  const pCat = cats[0] ? centro(cats[0].geo) : null;
  let prev = pSede || ancla, sin = [];
  const res = pts.map((p) => {
    const l = norm(p.lugar);
    let pos = null, como = '';
    const fijo = FIJOS[ciudad] && FIJOS[ciudad][l.replace(/ puerta perdon$/, '')];
    // «Salida/Entrada <lugar>»: es ese lugar (una calle, la carrera oficial…), no la sede; solo «salida», «entrada templo/palio/casa hdad…» son la sede
    const mm = /^(salida|entrada|encierro|sale)\s+(.+)$/.exec(l);
    const lugarSede = mm && /^(triunfal|palio|templo|casa|capilla|acto|hdad|hermandad|iglesia|parroquia|colegio|llamada|se recoge)/.test(mm[2]);
    if (fijo) { pos = fijo; como = 'carrera oficial'; }
    else if (mm && !lugarSede && !/\b(c o|carrera oficial)\b/.test(mm[2]) && [mm[2], nucleo(mm[2])].some((k) => k && ix.calles.has(k))) {
      const k = [mm[2], nucleo(mm[2])].find((x) => x && ix.calles.has(x)); pos = cercano(ix.calles.get(k), prev); como = 'calle';
    }
    else if (ESPECIAL.test(l) || /^(salida|entrada|encierro)\b/.test(l)) { pos = pSede; como = 'sede'; }
    else if (/catedral|s i c|estacion de penitencia/.test(l) && pCat) { pos = pCat; como = 'catedral'; }
    else if (/carrera oficial|^c oficial|^carrera$/.test(l)) { const g = ix.calles.get(norm(CARRERA[ciudad])) || ix.calles.get(nucleo(CARRERA[ciudad])); if (g) { pos = cercano(g, prev); como = 'carrera oficial'; } }
    else {
      const al = [l, nucleo(p.lugar)].map((k) => ALIAS[ciudad] && ALIAS[ciudad][k]).find(Boolean);
      const cands = [l, nucleo(p.lugar), ...(al ? [norm(al), nucleo(al)] : [])].filter(Boolean);
      let geos = null;
      for (const k of cands) if (ix.calles.has(k)) { geos = ix.calles.get(k); break; }
      if (!geos) { // nombre parcial: la calle cuyo núcleo contiene el del itinerario (o al revés), de al menos 5 letras
        const n = nucleo(p.lugar);
        if (n.length >= 5) for (const [k, g] of ix.calles) if (k.length >= 5 && (k === n || k.endsWith(' ' + n) || n.endsWith(' ' + k))) { geos = g; break; }
      }
      if (geos) { pos = cercano(geos, prev); como = 'calle'; }
    }
    if (pos) prev = pos; else sin.push(p.lugar);
    return { ...p, lat: pos ? +pos[0].toFixed(6) : null, lon: pos ? +pos[1].toFixed(6) : null, como, _f: !!fijo };
  });
  // saltos imposibles (una calle homónima en otro barrio): un punto a más de 900 m de sus vecinos, que están cerca entre sí, se descarta
  const m = (a, b) => dist([a.lat, a.lon], [b.lat, b.lon]) * 111000;
  for (let pasada = 0; pasada < 2; pasada++) for (let i = 0; i < res.length; i++) {
    if (res[i].lat == null || res[i]._f || res[i].como === 'sede' || res[i].como === 'catedral') continue;
    let a = i - 1; while (a >= 0 && res[a].lat == null) a--;
    let b = i + 1; while (b < res.length && res[b].lat == null) b++;
    const da = a >= 0 ? m(res[i], res[a]) : 0, db = b < res.length ? m(res[i], res[b]) : 0;
    const vecinosCerca = a >= 0 && b < res.length ? m(res[a], res[b]) < 1200 : true;
    if ((da > 900 && (b >= res.length || db > 900) && vecinosCerca) || da > 2500) { res[i].lat = res[i].lon = null; res[i].como = ''; }
  }
  // y lo que queda a más de 2,5 km del centro del propio recorrido (mediana) tampoco es de este itinerario
  const sit = res.filter((p) => p.lat != null);
  if (sit.length > 4) {
    const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
    const c = { lat: med(sit.map((p) => p.lat)), lon: med(sit.map((p) => p.lon)) };
    for (const p of res) if (p.lat != null && !p._f && p.como !== 'sede' && m(p, c) > 2500) { p.lat = p.lon = null; p.como = ''; }
  }
  // lo que no se pudo situar se estima entre el punto situado anterior y el siguiente (marcado como «estimado»)
  for (let i = 0; i < res.length; i++) {
    if (res[i].lat != null) continue;
    let a = i - 1; while (a >= 0 && res[a].lat == null) a--;
    let b = i + 1; while (b < res.length && res[b].lat == null) b++;
    if (a >= 0 && b < res.length) { const t = (i - a) / (b - a); res[i].lat = +(res[a].lat + (res[b].lat - res[a].lat) * t).toFixed(6); res[i].lon = +(res[a].lon + (res[b].lon - res[a].lon) * t).toFixed(6); res[i].como = 'estimado'; }
  }
  for (const p of res) delete p._f;
  return { res, sin, sede: pSede };
}

const solo = process.argv[2];
const informe = {};
for (const ciudad of Object.keys(CENTRO)) {
  if (solo && ciudad !== solo) continue;
  const osm = await overpass(ciudad); const ix = indice(osm);
  const out = { ciudad, anio: ITI.anio, licencia_mapa: '© colaboradores de OpenStreetMap (ODbL)', hermandades: {} };
  let tot = 0, ok = 0; const fallos = {};
  for (const [slug, e] of Object.entries(ITI.hermandades)) {
    if (e.ciudad !== ciudad) continue;
    const h = H[slug]; const tramos = {};
    for (const [tramo, pts] of Object.entries(e.tramos)) {
      const { res, sin } = situar(ix, ciudad, h, pts);
      tramos[tramo] = res; tot += res.length; ok += res.filter((p) => p.lat).length;
      for (const s of sin) fallos[s] = (fallos[s] || 0) + 1;
    }
    out.hermandades[slug] = { dia: e.dia, fuente: e.fuente, tramos };
  }
  fs.writeFileSync(path.join(OUT, ciudad + '.json'), JSON.stringify(out));
  informe[ciudad] = { puntos: tot, situados: ok, pct: tot ? Math.round(100 * ok / tot) : 0, calles_osm: ix.calles.size, templos: ix.templos.length, no_situados: Object.entries(fallos).sort((a, b) => b[1] - a[1]).slice(0, 25) };
  console.log(ciudad, `${ok}/${tot} (${informe[ciudad].pct} %)`, '· sin situar:', Object.keys(fallos).length);
  await new Promise((s) => setTimeout(s, 3000));
}
fs.writeFileSync(path.join(DIR, 'informe-geocodificacion.json'), JSON.stringify(informe, null, 1));
