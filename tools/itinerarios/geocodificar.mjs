// Ocho Capitales: sitúa en el mapa cada punto de los itinerarios oficiales (tools/sources/itinerarios-2026.json).
// Descarga de OpenStreetMap (Overpass, gratis, © colaboradores de OpenStreetMap, ODbL) las calles con nombre y los
// templos del centro de cada capital, casa cada «lugar» del itinerario con su calle (expandiendo abreviaturas) y elige,
// de los tramos de esa calle, el más cercano al punto anterior para que el recorrido sea continuo.
// Salida: site/data/recorridos/<ciudad>.json (puntos con lat/lon) y un informe de lo que no se pudo situar.
// Uso: node tools/itinerarios/geocodificar.mjs [ciudad]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENLACES, uniones } from './enlaces.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(DIR, '..', '..');
const ITI = JSON.parse(fs.readFileSync(path.join(RAIZ, 'tools', 'sources', 'itinerarios-2026.json'), 'utf8'));
// Salidas extraordinarias y magnas: mismo formato de puntos, con tramos «ida» y «regreso» (van a «extraordinarias» en la salida)
const fExt = path.join(RAIZ, 'tools', 'sources', 'itinerarios-extraordinarios.json');
const EXT = fs.existsSync(fExt) ? JSON.parse(fs.readFileSync(fExt, 'utf8')).salidas : {};
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
// (primero «de la», «de los», «de las»: con «de» delante, «Plaza de la Encarnación» se quedaba en «la encarnacion» y el itinerario
// «Encarnación» casaba con la calle Virgen de la Encarnación, a 1 km)
const nucleo = (s) => norm(s).replace(TIPO, '').replace(/^(de las|de los|de la|del|de)\s+/, '').trim();
// el nombre con lo que va entre paréntesis («Pl. España (Torre Norte)» → «plaza espana torre norte»), solo para FIJOS_PARENTESIS
const lugarConParentesis = (s) => norm(String(s || '').replace(/[()]/g, ' '));

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

// red de calles andables con las mismas vías, filtros, ENLACES y uniones de plazas sueltas que enrutar.mjs, para que repartir() siga el camino que se dibuja.
// Las distancias se miden con dist(), y enrutar.mjs usa su proyección (kx, ky): difieren en un 0,3 %, y con dos caminos casi
// empatados podrían elegir distinto.
const ANDABLE = /^(primary|secondary|tertiary|residential|pedestrian|living_street|unclassified|footway|steps|service|road|path|cycleway|trunk)(_link)?$/;
const CELDA = 0.0012; // rejilla de la red, en grados (unos 130 m por 105 m en Sevilla), para nodoCercano()
function indice(osm, ciudad) {
  const calles = new Map(), templos = [], red = { ids: new Map(), nod: [], ady: [] };
  const nodo = (q) => { const c = clave(q); let i = red.ids.get(c); if (i === undefined) { i = red.nod.length; red.ids.set(c, i); red.nod.push(q); red.ady.push([]); } return i; };
  for (const e of osm.elements) {
    const t = e.tags || {};
    if (e.geometry && (ANDABLE.test(t.highway || '') || t.place === 'square') && t.access !== 'private' && t.foot !== 'no') {
      let ant = -1;
      for (const g of e.geometry) {
        if (!g) { ant = -1; continue; }
        const i = nodo([g.lat, g.lon]);
        if (ant >= 0 && ant !== i) { const d = dist(red.nod[ant], red.nod[i]) * 111000; red.ady[ant].push([i, d]); red.ady[i].push([ant, d]); }
        ant = i;
      }
    }
    const geo = e.geometry ? e.geometry.map((p) => [p.lat, p.lon]) : e.lat ? [[e.lat, e.lon]] : e.center ? [[e.center.lat, e.center.lon]] : null;
    if (!geo || !geo.length) continue;
    if (t.amenity === 'place_of_worship') { templos.push({ nombre: norm(t.name), geo }); continue; }
    for (const nm of [t.name, t.alt_name, t.old_name, t.official_name].filter(Boolean)) {
      for (const k of new Set([norm(nm), nucleo(nm)])) { if (!k) continue; if (!calles.has(k)) calles.set(k, []); calles.get(k).push(geo); }
    }
  }
  for (const [a, b] of (ciudad && ENLACES[ciudad]) || []) {
    const i = red.ids.get(clave(a)), j = red.ids.get(clave(b)); if (i === undefined || j === undefined) continue; // enrutar.mjs avisa si falta
    const d = dist(a, b) * 111000; red.ady[i].push([j, d]); red.ady[j].push([i, d]);
  }
  for (const l of (ciudad && uniones(ciudad)) || []) { let p = -1; for (const q of l) { const i = nodo(q); if (p >= 0 && p !== i) { const d = dist(red.nod[p], red.nod[i]) * 111000; red.ady[p].push([i, d]); red.ady[i].push([p, d]); } p = i; } } // y las uniones de las plazas sueltas
  red.rej = new Map();
  red.nod.forEach((q, i) => { if (!red.ady[i].length) return; const k = Math.floor(q[0] / CELDA) + ':' + Math.floor(q[1] / CELDA); (red.rej.get(k) || red.rej.set(k, []).get(k)).push(i); });
  return { calles, templos, red };
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
    // Puente romano (OSM man_made=bridge, vía Nominatim 2026-10-24); la caché solo tenía la «Calle Puente Romano», a 1 km
    'puente romano': [37.87665, -4.77796],
  },
  // Sevilla: en las rejillas «P. SAN MIGUEL» y «P. PALOS» son las puertas de la Catedral (norm() las convierte en «paseo»)
  // y «PLAZA» es la Plaza de San Francisco. Coordenadas de OpenStreetMap (nodos entrance de la Catedral, Overpass 2026-10-24).
  sevilla: {
    'paseo san miguel': [37.385514, -5.993809], 'p san miguel': [37.385514, -5.993809], 'puerta de san miguel': [37.385514, -5.993809],
    'paseo palos': [37.386053, -5.992541], 'p palos': [37.386053, -5.992541], 'palos': [37.386053, -5.992541], 'puerta de palos': [37.386053, -5.992541],
    'plaza': [37.38914, -5.99406],
  },
  // Málaga: la Tribuna Principal está en la Plaza de la Constitución (orden oficial: «Plaza de la Constitución, Tribuna Principal,
  // Marqués de Larios»); coordenada de la plaza en OSM. (La «Tribuna de los Pobres» es otro punto y no se toca.)
  malaga: {
    'tribuna': [36.72088, -4.42172], 'tribuna principal': [36.72088, -4.42172],
  },
};
// Puntos fijos que se buscan con lo que va entre paréntesis (norm() lo quita), y que no son de la carrera oficial.
// Sevilla: torres de la Plaza de España («Pl. España (Torre Norte)», «(Torre Sur)», palio de La Paz, Canal Sur p. 23); sin esto,
// las dos caían en el mismo punto de la plaza. Centro de los edificios «Torre Norte» (way 442264001) y «Torre Sur» (way 873304735)
// de OpenStreetMap, Overpass 2026-11-26.
const FIJOS_PARENTESIS = {
  sevilla: { 'plaza espana torre norte': [37.377867, -5.988045], 'plaza espana torre sur': [37.375878, -5.986844] },
};
// Lugares del itinerario que OSM no da como calle y que no son de la carrera oficial: van a un vértice de la calle por la que se pasa
// junto a ellos, como «calle» (no en rojo).
// Sevilla, «Jardines de Murillo» (Las Cigarreras, cruz y palio, entre Puerta de Jerez o San Fernando y Cano y Cueto o San José):
// en OSM es un parque (way 22747191), no una calle, y casaba con la calle Murillo, a 1 km. Por su borde este va el Paseo de Catalina
// de Ribera, el que La Candelaria nombra en ese mismo tramo («San Fernando, Paseo Catalina de Ribera, Cano y Cueto»). Punto: el
// vértice del paseo (way 28113943) más cercano al centro del jardín (media de los vértices del parque), a 23 m. OpenStreetMap, Overpass 2026-11-26.
// Sevilla, «Lonja de la Universidad» (Los Estudiantes, palio; Santa Genoveva, cruz y palio): la lonja de la antigua Fábrica de Tabacos,
// delante de su fachada de la calle San Fernando, no está en la red de calles (es parte del recinto). Se estimaba a medio camino y se
// dibujaba en recta a través del recinto. Punto: el vértice de la calle San Fernando (way 56767111) frente a la Capilla de la Universidad
// (way 120225599, a 15 m), el mismo por el que sale y entra Los Estudiantes. La lonja ocupa todo el frente de la fachada: se elige
// ese vértice por la capilla, no porque una fuente sitúe ahí la lonja. OpenStreetMap, caché de 2026-11-25.
const LUGARES = {
  sevilla: { 'jardines de murillo': [37.3844506, -5.9876507], 'lonja de la universidad': [37.3812818, -5.9894343] },
};
// Nombres cortados o abreviados en los PDF que sí existen en OSM con su nombre completo (comprobado en tools/itinerarios/cache/osm-*.json)
const ALIAS = {
  sevilla: { 'jesus del gran': 'Jesús del Gran Poder', 'dona maria': 'Doña María Coronel', 'avenida isabel la c': 'Isabel la Católica', 'isabel la c': 'Isabel la Católica', 'ramon y caj': 'Ramón y Cajal', 'avenida ramon y cajal': 'Ramón y Cajal' },
  granada: { 'gran via': 'Gran Vía de Colón' },
  huelva: { 'federico molina': 'Avenida del Alcalde Federico Molina Orta', 'avenida federico molina': 'Avenida del Alcalde Federico Molina Orta', 'baez': 'Plaza de Quintero Báez' },
  malaga: { 'alameda': 'Alameda Principal', 'plaza de los santos martires': 'Plaza de los Mártires Ciriaco y Paula', 'puerta buenaventura': 'Calle Puerta de Buenaventura', 'plaza spinola': 'Plaza de Spínola', 'puente esperanza': 'Puente de la Esperanza' },
  cordoba: { 'conde cardenas': 'Conde de Cárdenas', 'doctor maranon': 'Doctor Gregorio Marañón', 'diario cordoba': 'Calle Diario de Córdoba' },
};
// y los de tools/itinerarios/alias-calles-<ciudad>.json, cada uno comprobado con su fuente (los mismos que usa el método nuevo de
// rutas): Almería, «General Castaños» es la calle Bailén; sin el alias se trazaba por una calle homónima a 2,7 km. Las sedes
// fijadas ahí («@templo») las usa solo ese método.
for (const ciudad of Object.keys(CENTRO)) {
  const f = path.join(DIR, `alias-calles-${ciudad}.json`); if (!fs.existsSync(f)) continue;
  for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(f, 'utf8')))) {
    if (k.startsWith('_') || k.startsWith('@') || typeof v !== 'string') continue;
    const a = (ALIAS[ciudad] = ALIAS[ciudad] || {}); if (!a[norm(k)]) a[norm(k)] = v;
  }
}
// Sedes con coordenadas y fuente (site/data/sedes/<ciudad>.json, las mismas del plano fuera de temporada)
const SEDES = {};
for (const ciudad of Object.keys(CENTRO)) {
  const f = path.join(RAIZ, 'site', 'data', 'sedes', ciudad + '.json');
  if (fs.existsSync(f)) SEDES[ciudad] = JSON.parse(fs.readFileSync(f, 'utf8')).hermandades || {};
}
// Cofradías de barrios que se salen del callejero descargado (CENTRO): sus calles no están o casan con otras homónimas de otro
// sitio, y el recorrido se dibujaba lejos de su barrio. Se guarda el itinerario, sin situar, hasta tener el callejero de su barrio.
// Hasta el 27-nov, Sevilla tenía aquí Bellavista, el Divino Perdón (Parque Alcosa) y Dolores de Torreblanca: sus barrios quedaban fuera
// del callejero en caché, y sus calles casaban con homónimas de San Juan de Aznalfarache o del centro. Desde entonces,
// callejero-extra-sevilla.mjs añade esos barrios a la caché, y ya se sitúan.
const FUERA = {};
// La Sed (Sevilla): su primera calle, «Hospital San Juan de Dios», salía partida en dos renglones y casaba con una calle de San Juan
// del centro. Desde el 25-nov, unir.mjs une los dos renglones y casa con la calle San Juan de Dios de Nervión, junto al hospital. Desde
// el 26-nov tiene sede con fuente (rutas/sedes-sevilla-correcciones.json: Parroquia de la Concepción, way 72800137), como Los
// Panaderos y Cristo de Burgos, y su salida ya no se estima.
function situar(ix, ciudad, h, pts) {
  if (h && FUERA[ciudad] && FUERA[ciudad][h.slug]) return { res: pts.map((p) => ({ ...p, lat: null, lon: null, como: '' })), sin: [], sede: null };
  const sede = h && h.sede ? norm(h.sede) : '';
  // ancla: el primer punto del itinerario que es una calle reconocible (para elegir la sede y la catedral cercanas)
  let ancla = null;
  for (const p of pts) { const k = [norm(p.lugar), nucleo(p.lugar)].find((x) => x && ix.calles.has(x)); if (k) { ancla = centro(ix.calles.get(k)[0]); break; } }
  const cerca = (g) => !ancla || dist(centro(g), ancla) * 111000 < 1500;
  // la sede fijada con su fuente en site/data/sedes/<ciudad>.json manda; si ahí consta que no se ha podido situar, no se adivina
  const fijada = h && SEDES[ciudad] && SEDES[ciudad][h.slug];
  // sin ninguna calle del itinerario en el callejero no hay con qué comprobar la sede, y cualquier templo de la ciudad con una
  // palabra en común servía: todo el recorrido se amontonaba en una iglesia de otro barrio. Así no se sitúa.
  const cand = !fijada && sede && ancla ? ix.templos.filter((t) => cerca(t.geo)).map((t) => [t, nucleo(t.nombre).split(' ').filter((w) => w.length > 3 && sede.includes(w)).length]).sort((a, b) => b[1] - a[1])[0] : null;
  // si ese año la cofradía no salió de su sede («salida» del año de los itinerarios: Las Cigarreras en 2026, de Los Terceros, por las
  // obras de su capilla), sale y entra ahí; la sede sigue siendo la otra (sedes.mjs) y es la que enseña el plano fuera de temporada.
  const tieneSitio = (o) => o && ((Array.isArray(o.punto) && o.punto.length >= 2) || o.lat != null);
  const sa = fijada && fijada.salida && fijada.salida.anio === ITI.anio && tieneSitio(fijada.salida) ? fijada.salida : null;
  // El edificio del que sale y entra (esa salida o su templo). Su «punto» (y «punto_entrada», si entra por otra calle) es el nodo de
  // la calle por la que sale (y entra) según su itinerario oficial; se usa en vez del centro del edificio, que se pegaría al nodo más
  // cercano de la red aunque sea de otra calle (Las Cigarreras, al Pasaje Virgen de los Gitanos) o, en un edificio grande, a uno a
  // más de 100 m a través de él.
  const ed = sa || (fijada && tieneSitio(fijada.templo) ? fijada.templo : null);
  const nodoDe = (q) => (Array.isArray(q) && q.length >= 2 ? q.slice(0, 2) : null);
  const pSede = ed ? nodoDe(ed.punto) || [ed.lat, ed.lon] : fijada ? null : cand && cand[1] > 0 ? centro(cand[0].geo) : null;
  const pEntrada = ed ? nodoDe(ed.punto_entrada) || pSede : pSede;
  const cats = ix.templos.filter((t) => /catedral/.test(t.nombre)).sort((a, b) => (ancla ? dist(centro(a.geo), ancla) - dist(centro(b.geo), ancla) : 0));
  const pCat = cats[0] ? centro(cats[0].geo) : null;
  let prev = pSede || ancla, sin = [];
  const res = pts.map((p, iP) => {
    const l = norm(p.lugar);
    let pos = null, como = '';
    // Sevilla: «S. Miguel» / «San Miguel» con su hora en la celda es la Puerta de San Miguel de la Catedral (carrera oficial, en rojo,
    // tras la Plaza); sin hora es la calle San Miguel, junto a la Campana (La Borriquita, Cristo de Burgos, El Valle… pasan por ella
    // antes de la Campana). Hasta el 26-nov, las 29 con hora caían en la calle y el cortejo volvía de la Plaza a la Campana.
    const puertaSM = ciudad === 'sevilla' && l === 'san miguel' && p.hora ? FIJOS.sevilla['puerta de san miguel'] : null;
    const fijoPar = FIJOS_PARENTESIS[ciudad] && /\(/.test(p.lugar) ? FIJOS_PARENTESIS[ciudad][lugarConParentesis(p.lugar)] : null;
    const lugarFijo = LUGARES[ciudad] && LUGARES[ciudad][l];
    const fijo = fijoPar || lugarFijo || (FIJOS[ciudad] && (FIJOS[ciudad][l.replace(/ puerta perdon$/, '')] || puertaSM));
    let geosCalle = null; // la calle de OSM donde cae el punto (para repartir(), abajo)
    // «Salida/Entrada <lugar>»: es ese lugar (una calle, la carrera oficial…), no la sede; solo «salida», «entrada templo/palio/casa hdad…» son la sede
    const mm = /^(salida|entrada|encierro|sale)\s+(.+)$/.exec(l);
    const lugarSede = mm && /^(triunfal|palio|templo|casa|capilla|acto|hdad|hermandad|iglesia|parroquia|colegio|llamada|se recoge)/.test(mm[2]);
    // «templo»: pista con el nombre del templo en OSM (salidas extraordinarias que no salen ni entran en la sede de la hermandad)
    const tpl = p.templo && ix.templos.filter((t) => t.nombre.includes(norm(p.templo)));
    if (tpl && tpl.length) { pos = cercano(tpl.map((t) => [centro(t.geo)]), prev); como = 'templo'; }
    else if (fijo) { pos = fijo; como = fijoPar || lugarFijo ? 'calle' : 'carrera oficial'; }
    else if (mm && !lugarSede && !/\b(c o|carrera oficial)\b/.test(mm[2]) && [mm[2], nucleo(mm[2])].some((k) => k && ix.calles.has(k))) {
      const k = [mm[2], nucleo(mm[2])].find((x) => x && ix.calles.has(x)); geosCalle = ix.calles.get(k); pos = cercano(geosCalle, prev); como = 'calle';
    }
    else if (ESPECIAL.test(l) || /^(salida|entrada|encierro)\b/.test(l)) { // la sede: por su punto de entrada si es la entrada (o el último)
      const esEntrada = /^(entrada|entra|encierro|recogida|se recoge|a su templo|a su capilla)\b/.test(l) || (iP > 0 && iP === pts.length - 1);
      pos = esEntrada ? pEntrada : pSede; como = 'sede';
    }
    else if (/catedral|s i c|estacion de penitencia/.test(l) && pCat) { pos = pCat; como = 'catedral'; }
    else if (/carrera oficial|^c oficial|^carrera$/.test(l)) { const g = ix.calles.get(norm(CARRERA[ciudad])) || ix.calles.get(nucleo(CARRERA[ciudad])); if (g) { pos = cercano(g, prev); como = 'carrera oficial'; } }
    else {
      const al = [l, nucleo(p.lugar)].map((k) => ALIAS[ciudad] && ALIAS[ciudad][k]).find(Boolean);
      // el alias va primero: si no, el núcleo recortado («Pte. Esperanza» → «esperanza») casa con otra calle homónima
      const cands = [...(al ? [norm(al), nucleo(al)] : []), l, nucleo(p.lugar)].filter(Boolean);
      let geos = null;
      for (const k of cands) if (ix.calles.has(k)) { geos = ix.calles.get(k); break; }
      if (!geos) { // nombre parcial: la calle cuyo núcleo contiene el del itinerario (o al revés), de al menos 5 letras
        const n = nucleo(p.lugar);
        if (n.length >= 5) for (const [k, g] of ix.calles) if (k.length >= 5 && (k === n || k.endsWith(' ' + n) || n.endsWith(' ' + k))) { geos = g; break; }
      }
      if (geos) { geosCalle = geos; pos = cercano(geos, prev); como = 'calle'; }
    }
    if (pos) prev = pos; else sin.push(p.lugar);
    return { ...p, lat: pos ? +pos[0].toFixed(6) : null, lon: pos ? +pos[1].toFixed(6) : null, como, _f: !!fijo, _g: geosCalle, _p: pos };
  });
  // saltos imposibles (una calle homónima en otro barrio): un punto a más de 900 m de sus vecinos, que están cerca entre sí, se descarta
  const m = (a, b) => dist([a.lat, a.lon], [b.lat, b.lon]) * 111000;
  for (let pasada = 0; pasada < 2; pasada++) for (let i = 0; i < res.length; i++) {
    if (res[i].lat == null || res[i]._f || res[i].como === 'sede' || res[i].como === 'catedral' || res[i].como === 'templo') continue;
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
  repartir(res, ix.red);
  // y si el edificio trae «salida_por» o «entrada_por» (su itinerario oficial va por calles que no están entre los puntos del
  // programa: Las Cigarreras en 2026 entra por Doña María Coronel y Bustos Tavera), el primer tramo (desde la salida) o el último (el
  // que llega a la entrada) lleva «por»: los nodos por los que enrutar.mjs tiene que hacer pasar el camino. Sin eso, el camino más
  // corto metía a Las Cigarreras por Almirante Apodaca, la calle de la salida.
  const porNodos = (a) => (Array.isArray(a) && a.length ? a.map((q) => q.slice(0, 2)) : null);
  if (ed && porNodos(ed.salida_por)) {
    if (res.length > 1 && res[0].como === 'sede') res[0].por = porNodos(ed.salida_por);
    else console.error(`SALIDA_POR: ${h.slug}: el primer punto no es la salida de su sede; no se usa`);
  }
  if (ed && porNodos(ed.entrada_por)) {
    let iE = res.length - 1; while (iE > 0 && res[iE - 1].como === 'sede') iE--; // si la entrada va repetida, la primera
    // (si el tramo solo tiene salida y entrada, el mismo punto lleva los dos: primero los de la salida)
    if (iE > 0 && res[res.length - 1].como === 'sede') res[iE - 1].por = [...(iE - 1 === 0 && res[0].por ? res[0].por : []), ...porNodos(ed.entrada_por)];
    else console.error(`ENTRADA_POR: ${h.slug}: el último punto no es la entrada en su sede; no se usa`);
  }
  // (la salida y la entrada sin sede se estiman después, con todos los tramos de la hermandad: sedeEstimada; y lo que queda sin
  // situar entre dos puntos, en interpolar)
  return { res, sin, sede: pSede };
}
// Calles que caían en un mismo punto. cercano() pone cada calle en su vértice más cercano al punto anterior, y en el plano el
// cortejo se quedaba parado media hora y luego corría:
// · una calle repetida en franjas seguidas cae siempre en el mismo vértice («Avda. Ramón y Cajal» a las 22:30, 23:00 y 23:30 en el
//   palio de El Cerro), y dos calles que se cruzan, en el que comparten («Argote de Molina» y «Álvarez Quintero», palio de
//   Redención): el primero se queda y los demás van a 1/k, 2/k… del tramo;
// · una calle que cae pegada (a menos de 40 m) a la anterior, las dos de franja («San Fernando», a 35 m de Puerta de Jerez en La
//   Candelaria y Las Cigarreras, y luego el cortejo andaba toda la calle de golpe): va a la mitad del tramo (varias: 1/(k+1)…).
// El tramo va por la red de calles de enrutar.mjs (las mismas vías, ENLACES y uniones de plazas sueltas), desde ese vértice hasta el de la última calle del
// grupo más cercano al punto siguiente. Cada punto va al nodo del tramo, en su propia calle, más cercano a su fracción, siempre que:
// · desde él quede menos camino hasta el punto siguiente que desde el vértice, y no más que desde el punto repartido anterior (por
//   la red; si por ella no se llega, en recta, como lo dibuja enrutar.mjs); y más camino andado desde el punto anterior que hasta el
//   vértice, y no menos que hasta el punto repartido anterior;
// · ningún nodo del tramo, hasta el último punto repartido, quede más cerca del punto anterior que el vértice, ni más cerca del
//   siguiente que ese último punto (si no, el dibujo volvería por él: ida y vuelta);
// · el dibujo, como lo hace enrutar.mjs (punto, nodos del camino, punto), no tenga un espolón nuevo en el vértice, en el punto
//   anterior ni en el siguiente.
// Y además: el punto siguiente tiene que estar situado y justo detrás del grupo (uno sin situar se estima luego en recta entre sus
// vecinos y se salía de la calle), y una calle pegada solo se mueve si el dibujo desde el punto anterior llega a su nuevo sitio.
// Así cada punto queda en un nodo de la red y sobre el trazado. Es lo que pidió la primera revisión (NO APTO), cuando el punto iba a
// mitad de un lado del tramo: Pl. San Leandro en Redención (se enganchaba a un área suelta de la red y el trazado salía en recta),
// Feria en La Macarena (zigzag), y Castelar en Jesús Despojado y Manuel Siurot en La Misión (avanzaban y el trazado volvía atrás).
// Solo se mueven puntos con hora de franja («fila»), nunca los de hora oficial exacta («hora»: Campana, Plaza…), que son de un sitio
// concreto: la carrera oficial no cambia. Si algo de lo anterior falla, el grupo entero se queda como estaba. «En su calle»: a menos
// de 5 m de una vía de OSM con su nombre; no se inventa ninguna calle.
const PEGADO_M = 40, EN_CALLE_M = 5;
const deFranja = (p) => !p.hora && !!p.fila;
const clave = (q) => q[0].toFixed(7) + ',' + q[1].toFixed(7);
class Monticulo { // cola de prioridad binaria para Dijkstra (la de enrutar.mjs)
  constructor() { this.a = []; }
  push(n, p) { const a = this.a; a.push([p, n]); let i = a.length - 1; while (i > 0) { const j = (i - 1) >> 1; if (a[j][0] <= a[i][0]) break; [a[i], a[j]] = [a[j], a[i]]; i = j; } }
  pop() { const a = this.a, top = a[0], u = a.pop(); if (a.length) { a[0] = u; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l][0] < a[m][0]) m = l; if (r < a.length && a[r][0] < a[m][0]) m = r; if (m === i) break; [a[i], a[m]] = [a[m], a[i]]; i = m; } } return top; }
  get size() { return this.a.length; }
}
function caminoRed(red, s, t, limite) {
  const dd = new Map([[s, 0]]), de = new Map(), h = new Monticulo(); h.push(s, 0);
  while (h.size) {
    const [d, u] = h.pop(); if (u === t) break; if (d > dd.get(u) || d > limite) continue;
    for (const [v, w] of red.ady[u]) { const nd = d + w; if (nd < (dd.has(v) ? dd.get(v) : Infinity)) { dd.set(v, nd); de.set(v, u); h.push(v, nd); } }
  }
  if (!dd.has(t) || dd.get(t) > limite) return null;
  const cam = [t]; while (cam[cam.length - 1] !== s) cam.push(de.get(cam[cam.length - 1]));
  return { largo: dd.get(t), ids: cam.reverse() };
}
// distancia por la red desde un nodo a todos los que están a menos de «limite» metros
function distanciasDesde(red, s, limite) {
  const dd = new Map([[s, 0]]), h = new Monticulo(); h.push(s, 0);
  while (h.size) {
    const [d, u] = h.pop(); if (d > dd.get(u) || d > limite) continue;
    for (const [v, w] of red.ady[u]) { const nd = d + w; if (nd <= limite && nd < (dd.has(v) ? dd.get(v) : Infinity)) { dd.set(v, nd); h.push(v, nd); } }
  }
  return dd;
}
// el nodo de la red (con alguna arista) más cercano a un punto, a menos de 90 m (como cercano() de enrutar.mjs, con dist())
function nodoCercano(red, q) {
  const cx = Math.floor(q[0] / CELDA), cy = Math.floor(q[1] / CELDA); let best = -1, bd = Infinity;
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const i of red.rej.get((cx + a) + ':' + (cy + b)) || []) { const d = dist(red.nod[i], q) * 111000; if (d < bd) { bd = d; best = i; } }
  return bd <= 90 ? best : -1;
}
// distancia (m) de un punto a la vía más cercana de una calle
function aCalle(q, geos) {
  const kx = Math.cos(q[0] * Math.PI / 180); let b = Infinity;
  for (const w of geos) for (let t = 0; t < w.length; t++) {
    const p1 = w[t], p0 = t ? w[t - 1] : null; if (!p1) continue;
    if (!p0) { b = Math.min(b, dist(q, p1) * 111000); continue; }
    const ax = (p0[1] - q[1]) * kx, ay = p0[0] - q[0], dx = (p1[1] - p0[1]) * kx, dy = p1[0] - p0[0], l2 = dx * dx + dy * dy;
    const u = l2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / l2)) : 0;
    b = Math.min(b, Math.hypot(ax + u * dx, ay + u * dy) * 111000);
  }
  return b;
}
// el dibujo entre dos puntos, aproximado al de enrutar.mjs: el punto, los nodos intermedios del camino entre sus nodos y el otro
// punto (enrutar.mjs, además, deja en recta los pares a menos de 25 m y simplifica a 3 m)
function trazo(red, pa, pb) {
  const a = nodoCercano(red, pa), b = nodoCercano(red, pb); if (a < 0 || b < 0 || a === b) return [pa, pb];
  const r = caminoRed(red, a, b, dist(pa, pb) * 111000 * 2.6 + 500); return r ? [pa, ...r.ids.slice(1, -1).map((i) => red.nod[i]), pb] : [pa, pb];
}
// ida y vuelta en el punto donde se juntan dos dibujos: los metros (10, 20, 30, 50) en que el que llega y el que sale van juntos
// (a menos de 5 m), como mide la revisión
function espolon(llega, sale) {
  const largo = (c) => c.reduce((s, q, i) => s + (i ? dist(c[i - 1], q) * 111000 : 0), 0);
  const a = (c, d) => { let s = 0; for (let i = 1; i < c.length; i++) { const l = dist(c[i - 1], c[i]) * 111000; if (s + l >= d) { const f = l ? (d - s) / l : 0; return [c[i - 1][0] + (c[i][0] - c[i - 1][0]) * f, c[i - 1][1] + (c[i][1] - c[i - 1][1]) * f]; } s += l; } return null; };
  const vuelta = llega.slice().reverse(); let r = 0;
  for (const d of [10, 20, 30, 50]) { if (largo(llega) < d || largo(sale) < d) break; const x = a(vuelta, d), y = a(sale, d); if (x && y && dist(x, y) * 111000 < 5) r = d; else break; }
  return r;
}
function repartir(res, red) {
  const orig = res.map((p) => (p.lat != null && p._p ? p._p : null)); // posiciones de antes de repartir (los vecinos no se mueven en cadena)
  const enCalle = (i) => orig[i] && res[i].como === 'calle' && res[i]._g && deFranja(res[i]);
  for (let i = 0; i < res.length; i++) {
    if (!enCalle(i)) continue;
    let j = i; while (j + 1 < res.length && enCalle(j + 1) && dist(orig[j + 1], orig[i]) * 111000 < 1) j++;
    const k = j - i + 1, pegado = i > 0 && enCalle(i - 1) && dist(orig[i - 1], orig[i]) * 111000 < PEGADO_M;
    let n = j + 1; while (n < res.length && res[n].lat == null) n++;
    const grupo = i; i = j;
    // el punto siguiente, situado y justo detrás: si entre medias hay uno sin situar, se estima luego en línea recta entre sus
    // vecinos, y mover el grupo lo sacaba de la calle (Madre María Purísima en el palio de La Macarena)
    if ((k < 2 && !pegado) || n >= res.length || n !== j + 1) continue; // (n >= res.length: el grupo acaba el tramo)
    // tramo: del vértice del grupo al de su última calle más cercano al punto siguiente, por la red
    const E = orig[grupo], sig = [res[n].lat, res[n].lon], X = cercano(res[j]._g, sig);
    const s = red.ids.get(clave(E)), x = red.ids.get(clave(X)), t = nodoCercano(red, sig);
    if (s === undefined || x === undefined || s === x || t < 0 || !red.ady[s].length) continue;
    const c = caminoRed(red, s, x, 1500); if (!c || c.largo < 20) continue;
    const acum = [0]; for (let y = 1; y < c.ids.length; y++) acum.push(acum[y - 1] + dist(red.nod[c.ids[y - 1]], red.nod[c.ids[y]]) * 111000);
    const L = c.largo;
    // cuánto falta hasta el punto siguiente: por la red; si por ella no se llega (el Altozano, para San Jacinto: un área suelta de la
    // red), en línea recta, como lo dibuja enrutar.mjs
    const aSig = distanciasDesde(red, t, c.largo + dist(E, sig) * 111000 * 2.6 + 500), porRed = aSig.has(s);
    const falta = (y) => (porRed ? aSig.get(c.ids[y]) : dist(red.nod[c.ids[y]], sig) * 111000), dE = falta(0);
    // y lo andado desde el punto anterior: el trazado hasta el vértice no puede pasar por donde va un punto repartido (Alfareros, en la
    // cruz de Pino Montano, se llega desde Esparteros por el lado del siguiente, y repartir hacia allí dibujaba una ida y vuelta)
    let a0 = grupo - 1; while (a0 >= 0 && res[a0].lat == null) a0--;
    const ant = a0 >= 0 ? [res[a0].lat, res[a0].lon] : null, nAnt = ant ? nodoCercano(red, ant) : -1;
    const aAnt = nAnt >= 0 ? distanciasDesde(red, nAnt, c.largo + dist(ant, E) * 111000 * 2.6 + 500) : new Map(), antPorRed = aAnt.has(s);
    const andado = (y) => (!ant ? acum[y] : antPorRed ? aAnt.get(c.ids[y]) : dist(red.nod[c.ids[y]], ant) * 111000), dA = andado(0);
    // cada punto, al nodo de su calle más cercano a su fracción, en orden y acercándose al siguiente; si alguno no tiene, nada
    const pos = []; let desde = 1, tope = dE, suelo = dA, ok = true;
    for (let m = 0; m < k && ok; m++) {
      const f = pegado ? (m + 1) / (k + 1) : m / k; if (!f) continue;
      const p = res[grupo + m]; let mejor = -1;
      for (let y = desde; y < c.ids.length; y++) {
        const nd = red.nod[c.ids[y]], dS = falta(y);
        const dN = andado(y);
        if (dS === undefined || dS >= dE || dS > tope || dN === undefined || dN <= dA || dN < suelo || aCalle(nd, p._g) > EN_CALLE_M) continue;
        if (mejor < 0 || Math.abs(acum[y] - L * f) < Math.abs(acum[mejor] - L * f)) mejor = y;
      }
      if (mejor < 0) ok = false; else { pos.push([p, red.nod[c.ids[mejor]], c.ids[mejor], mejor]); desde = mejor; tope = falta(mejor); suelo = andado(mejor); }
    }
    // sin ida y vuelta: ningún nodo del tramo hasta el último punto repartido puede estar más cerca del anterior que el vértice de
    // partida, ni más cerca del siguiente que ese último punto (si no, el trazado del anterior al vértice, o el del último punto al
    // siguiente, volvería por él)
    if (ok && pos.length) {
      const u = pos[pos.length - 1][3], dU = falta(u);
      for (let y = 1; y <= u && ok; y++) if ((andado(y) ?? Infinity) <= dA) ok = false;
      for (let y = 0; y < u && ok; y++) if ((falta(y) ?? Infinity) <= dU) ok = false;
    }
    // pegada: el trazado desde el punto anterior tiene que llegar a su nuevo sitio (si el anterior está en un área suelta de la red,
    // como la plaza Diputado Ramón Rueda de Pino Montano, se dibuja en recta, y moverla solo alargaría la recta)
    if (ok && pegado && pos.length) ok = nAnt >= 0 && !!caminoRed(red, nAnt, pos[0][2], dist(ant, pos[0][1]) * 111000 * 2.6 + 500);
    // ni espolón nuevo en el dibujo (como lo hace enrutar.mjs: punto, nodos del camino, punto): en el vértice, en el punto anterior
    // (si la calle iba pegada) y en el siguiente. Rioja, pegada a San Pablo en Las Aguas, llegaba a la Campana por donde se sale
    // hacia la Plaza: el punto de la Campana queda a 12 m de su nodo y el dibujo hacía una ida y vuelta de 10 m.
    if (ok && pos.length) {
      let n2 = n + 1; while (n2 < res.length && res[n2].lat == null) n2++;
      let a1 = a0 - 1; while (a1 >= 0 && res[a1].lat == null) a1--;
      const P = (q) => [q.lat, q.lon], nuevos = pos.map((z) => z[1]), sig2 = n2 < res.length ? P(res[n2]) : null, ant2 = a1 >= 0 ? P(res[a1]) : null;
      const peor = (a, b, c, a2, b2, c2) => a && c && espolon(trazo(red, a2, b2), trazo(red, b2, c2)) > espolon(trazo(red, a, b), trazo(red, b, c));
      // ahora: …, anterior, [E], repartidos…, siguiente; antes: …, anterior, E, siguiente
      const primero = pegado ? nuevos[0] : E, tras = pegado ? (nuevos[1] || sig) : nuevos[0];
      if (peor(ant, E, sig, ant, primero, tras)) ok = false; // en el vértice (o donde queda el primero, si iba pegada)
      else if (pegado && peor(ant2, ant, E, ant2, ant, nuevos[0])) ok = false; // en el anterior
      else if (peor(E, sig, sig2, nuevos[nuevos.length - 1], sig, sig2)) ok = false; // en el siguiente
    }
    if (ok) for (const [p, nd] of pos) { p.lat = +nd[0].toFixed(6); p.lon = +nd[1].toFixed(6); p._p = nd; }
  }
}
// Sin sede situada (en site/data/sedes no consta con fuente), la salida y la entrada de TODOS los tramos de una hermandad se
// estiman en un mismo punto, marcado como «estimado»: se conserva su hora oficial sin inventar dónde está el templo.
// · La salida, en la primera calle situada del tramo que sale antes (la cruz de guía); la entrada, en la última calle del tramo que
//   entra después (el paso o el palio). Comprobado con las 51 hermandades con sede y dos tramos de Sevilla, Huelva y Almería: la
//   primera calle de la cruz queda igual o más cerca del templo que la del paso en 40 de 51; para la entrada, la última del paso
//   queda a 166 m del templo (mediana) y la de la cruz, a 241 m.
// · Antes se estimaba tramo a tramo, y la cruz y el paso de una misma hermandad salían de sitios distintos (Santa Genoveva, a 353 m;
//   El Museo, a 301 m; El Cerro recogía a 402 m).
// · Una primera (o última) calle lejos de la siguiente (o de la anterior) es dudosa, porque no tiene otro vecino con el que comprobar
//   un salto: ni ella ni la salida (o la entrada) se sitúan. «Lejos»: más de 600 m y a más de 20 m/min; ese ritmo solo lo supera el
//   5 % de los pasos entre dos calles seguidas de Sevilla, Huelva y Almería (la mediana es 6,6 m/min). La Sed: «Hospital San Juan»
//   casaba con una calle de San Juan del centro, a 872 m de Eduardo Dato en media hora, y su salida se iba a 2 km de su entrada.
const LEJOS_M = 600, LEJOS_RITMO = 20;
const minFranja = (p) => { const x = /^(\d{1,2})[:.](\d{2})/.exec(p.hora || p.fila || ''); if (!x) return null; const v = +x[1] * 60 + +x[2]; return v < 360 ? v + 1440 : v; };
const metros = (a, b) => dist([a.lat, a.lon], [b.lat, b.lon]) * 111000;
function sedeEstimada(tramos) { // tramos: [[nombre, res], …] de una hermandad, ya situados y sin sede
  const fin = (r, lado) => (lado === 'salida' ? r[0] : r[r.length - 1]);
  for (const lado of ['salida', 'entrada']) {
    const d = lado === 'salida' ? 1 : -1;
    const tr = tramos.filter(([, r]) => r.length && fin(r, lado).como === 'sede' && fin(r, lado).lat == null);
    if (!tr.length) continue;
    // la calle de cada tramo junto a la salida (o la entrada), si no es dudosa
    const cand = new Map();
    for (const [nom, r] of tr) {
      const sit = []; for (let j = d === 1 ? 1 : r.length - 2; j >= 0 && j < r.length && sit.length < 2; j += d) if (r[j].lat != null) sit.push(r[j]);
      if (!sit.length) continue;
      const [a, b] = sit;
      if (b) {
        const m = metros(a, b), ta = minFranja(a), tb = minFranja(b), dt = ta != null && tb != null ? Math.max(Math.abs(tb - ta), 30) : 30;
        if (m > LEJOS_M && m / dt > LEJOS_RITMO) { console.log('   dudosa:', nom, lado, `«${a.lugar}»`, Math.round(m), 'm hasta', `«${b.lugar}»`); a.lat = a.lon = null; a.como = ''; continue; }
      }
      cand.set(nom, a);
    }
    // el tramo que sale antes (o entra después); a igualdad de hora, la cruz de guía para la salida y el paso para la entrada
    const orden = [...cand.keys()].map((nom, i) => [nom, i]).sort(([na, i], [nb, j]) => {
      const ra = tramos.find(([n]) => n === na)[1], rb = tramos.find(([n]) => n === nb)[1], ha = minFranja(fin(ra, lado)), hb = minFranja(fin(rb, lado));
      if (ha != null && hb != null && ha !== hb) return d * (ha - hb);
      const ca = /cruz/.test(na), cb = /cruz/.test(nb);
      if (ca !== cb) return (lado === 'salida') === ca ? -1 : 1;
      return i - j;
    });
    if (!orden.length) continue; // ninguna calle fiable: la salida (o la entrada) se queda sin situar
    const p = cand.get(orden[0][0]);
    for (const [, r] of tr) { const q = fin(r, lado); q.lat = p.lat; q.lon = p.lon; q.como = 'estimado'; }
  }
}
// lo que no se pudo situar se estima entre el punto situado anterior y el siguiente (marcado como «estimado»)
function interpolar(res) {
  for (let i = 0; i < res.length; i++) {
    if (res[i].lat != null) continue;
    let a = i - 1; while (a >= 0 && res[a].lat == null) a--;
    let b = i + 1; while (b < res.length && res[b].lat == null) b++;
    if (a >= 0 && b < res.length) { const t = (i - a) / (b - a); res[i].lat = +(res[a].lat + (res[b].lat - res[a].lat) * t).toFixed(6); res[i].lon = +(res[a].lon + (res[b].lon - res[a].lon) * t).toFixed(6); res[i].como = 'estimado'; }
  }
  for (const p of res) { delete p._f; delete p._g; delete p._p; }
  return res;
}
// sitúa todos los tramos de una hermandad (o de una salida extraordinaria): cada tramo por su cuenta y la sede estimada, en común
function situarTramos(ix, ciudad, h, src) {
  const r = Object.entries(src).map(([tramo, pts]) => [tramo, situar(ix, ciudad, h, pts)]);
  if (r.length && !r[0][1].sede) sedeEstimada(r.map(([t, x]) => [t, x.res]));
  return r.map(([tramo, x]) => [tramo, { ...x, res: interpolar(x.res) }]);
}

const solo = process.argv[2];
const informe = {};
for (const ciudad of Object.keys(CENTRO)) {
  if (solo && ciudad !== solo) continue;
  const osm = await overpass(ciudad); const ix = indice(osm, ciudad);
  const out = { ciudad, anio: ITI.anio, licencia_mapa: '© colaboradores de OpenStreetMap (ODbL)', hermandades: {} };
  let tot = 0, ok = 0; const fallos = {};
  for (const [slug, e] of Object.entries(ITI.hermandades)) {
    if (e.ciudad !== ciudad) continue;
    const h = H[slug]; const tramos = {};
    for (const [tramo, { res, sin }] of situarTramos(ix, ciudad, h, e.tramos)) {
      tramos[tramo] = res; tot += res.length; ok += res.filter((p) => p.lat).length;
      for (const s of sin) fallos[s] = (fallos[s] || 0) + 1;
    }
    out.hermandades[slug] = { dia: e.dia, fuente: e.fuente, tramos };
  }
  for (const [id, e] of Object.entries(EXT)) {
    if (e.ciudad !== ciudad) continue;
    const { tramos: src, ...meta } = e; const tramos = {};
    for (const [tramo, { res, sin }] of situarTramos(ix, ciudad, H[e.hermandad], src)) {
      for (const p of res) delete p.templo;
      tramos[tramo] = res; tot += res.length; ok += res.filter((p) => p.lat).length;
      for (const s of sin) fallos[s] = (fallos[s] || 0) + 1;
      console.log(' ', id, tramo, res.map((p) => p.lugar + ':' + (p.como || '¿?')).join(' · '));
    }
    (out.extraordinarias || (out.extraordinarias = {}))[id] = { ...meta, tramos };
  }
  fs.writeFileSync(path.join(OUT, ciudad + '.json'), JSON.stringify(out));
  informe[ciudad] = { puntos: tot, situados: ok, pct: tot ? Math.round(100 * ok / tot) : 0, calles_osm: ix.calles.size, templos: ix.templos.length, no_situados: Object.entries(fallos).sort((a, b) => b[1] - a[1]).slice(0, 25) };
  console.log(ciudad, `${ok}/${tot} (${informe[ciudad].pct} %)`, '· sin situar:', Object.keys(fallos).length);
  await new Promise((s) => setTimeout(s, 3000));
}
fs.writeFileSync(path.join(DIR, 'informe-geocodificacion.json'), JSON.stringify(informe, null, 1));
