// Ocho Capitales · rutas: sedes con coordenadas (templo y casa hermandad) de cada hermandad, para el plano fuera de temporada.
// Formato común de las 8 capitales: site/data/sedes/<capital>.json (descrito en «_leeme» del propio archivo y en el README).
// Fuentes: el nombre del templo, de la ficha de la hermandad en portal-cofrade/data/portal.json («sede» y su «fuente_url»); el
// edificio y sus coordenadas, de OpenStreetMap (cache/osm-<capital>.json); la casa hermandad, de casas-hermandad-<capital>.json
// (dirección con fuente) y su puerta en OSM. Correcciones a mano, con fuente: sedes-<capital>-correcciones.json en esta carpeta
// ({ "<slug>": { "templo": {nombre?, lat, lon, osm?, fuente} | null, "casa_hermandad": {...} | null } }).
// Sin fuente no hay punto: el campo se queda en null y se apunta en «falta».
// Uso: node sedes.mjs <capital>
import fs from 'node:fs';
import path from 'node:path';
import { ciudad, CAPITALES, RAIZ, RUTAS, ITI, sn, d2, TEMPLO, dentro } from './comun.mjs';

const c = process.argv[2];
if (!CAPITALES.includes(c)) { console.error('Uso: node sedes.mjs <capital>   capitales: ' + CAPITALES.join(', ')); process.exit(1); }
const C = ciudad(c);
const leer = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d);
const P = leer(path.join(RAIZ, 'portal-cofrade', 'data', 'portal.json'), { hermandades: [] }).hermandades.filter((h) => h.ciudad === c);
const CASAS = leer(path.join(ITI, 'casas-hermandad-' + c + '.json'), {});
const CORR = leer(path.join(RUTAS, 'sedes-' + c + '-correcciones.json'), {});
const r7 = (x) => +x.toFixed(7);
const ES_TEMPLO = /^(real |insigne |santa |pontificia )*(iglesia|parroquia|basilica|capilla|oratorio|santuario|ermita|abadia|convento|monasterio|colegiata|catedral|templo)/;

const out = {
  capital: c, nombre: C.nombre, actualizado: new Date().toISOString().slice(0, 10),
  _leeme: 'Sedes de cada hermandad para el plano. Por hermandad (clave = slug del portal): «templo» {nombre, lat, lon, osm, fuente, fuente_coordenadas} y «casa_hermandad» {dir, lat, lon, osm?, fuente, fuente_coordenadas} si es otro edificio (null si no hay o no tiene fuente); «falta»: lo que no se ha podido situar con fuente. lat/lon: el templo, en el centro de su edificio en OpenStreetMap; la casa hermandad, en su puerta (nodo entrance de OSM con esa dirección) o en el punto que dé la fuente. Generado con tools/itinerarios/rutas/sedes.mjs. Mapas: © colaboradores de OpenStreetMap (ODbL).',
  hermandades: {},
};
const centro = (w) => { const g = w.geometry.filter(Boolean); return [g.reduce((a, q) => a + q.lat, 0) / g.length, g.reduce((a, q) => a + q.lon, 0) / g.length]; };
// emparejado por palabras significativas (sin tipo de templo ni artículos): «Parroquia de la Divina Pastora y Santa Teresa» =
// «Parroquía Divina Pastora y Santa Teresa». Gana el edificio con más palabras en común, si todas las suyas están en el nombre de
// la sede; con empate entre dos edificios distintos no se elige (va a «falta»).
const VACIAS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'en', 'iglesia', 'parroquia', 'parroquial', 'basilica', 'menor', 'capilla', 'oratorio', 'santuario', 'ermita', 'abadia', 'convento', 'monasterio', 'colegiata', 'templo', 'real', 'insigne', 'pontificia', 'san', 'santa', 'santo', 'santos', 'santisimo', 'santisima', 'nuestra', 'senora', 'ntra', 'sra', 'nuestro', 'padre', 'virgen', 'maria']);
const palabras = (t) => new Set(sn(t).split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !VACIAS.has(w)));
function temploPorPalabras(nombre) {
  const P0 = palabras(nombre); if (!P0.size) return { w: null, motivo: 'nombre sin palabras distintivas' };
  const cands = C.LUG.map((w) => { const Q = palabras(w.tags.name); const comun = [...Q].filter((x) => P0.has(x)).length; return { w, comun, ok: Q.size > 0 && comun === Q.size }; }).filter((x) => x.ok).sort((a, b) => b.comun - a.comun);
  if (!cands.length) return { w: null, motivo: 'ningún edificio de OSM con ese nombre' };
  const top = cands.filter((x) => x.comun === cands[0].comun);
  if (top.length > 1 && top.some((x) => d2(C.X(...centro(x.w)), C.X(...centro(top[0].w))) > 60)) return { w: null, motivo: 'varios edificios posibles en OSM: ' + top.slice(0, 4).map((x) => x.w.tags.name).join(' | ') };
  return { w: top[0].w };
}
let nT = 0, nC = 0;
for (const h of P) {
  const e = { nombre: h.nombre, templo: null, casa_hermandad: null, falta: [] };
  const sedeTxt = String(h.sede || '').replace(/\(.*?\)/g, '').trim();
  const fichaFuente = h.fuente_url || h.web_fuente || null;
  // ---- templo ----
  if (CORR[h.slug] && 'templo' in CORR[h.slug]) { e.templo = CORR[h.slug].templo; if (!e.templo) e.falta.push(CORR[h.slug].motivo_templo || `templo «${sedeTxt}»: sin edificio en OSM con fuente (revisado a mano)`); }
  else if (sedeTxt && ES_TEMPLO.test(sn(sedeTxt))) {
    let s = C.sedeDe(h.slug + '#templo', sedeTxt);
    if (!s?.edificio) { const m = temploPorPalabras(sedeTxt); if (m.w) s = { edificio: m.w }; else if (!s) s = { motivo: m.motivo }; }
    if (s?.edificio) { const [la, lo] = centro(s.edificio); e.templo = { nombre: sedeTxt, lat: r7(la), lon: r7(lo), osm: `${s.edificio.type}/${s.edificio.id}`, nombre_osm: s.edificio.tags.name, fuente: fichaFuente, fuente_coordenadas: `OpenStreetMap ${s.edificio.type} ${s.edificio.id}` }; }
    else if (s?.punto && /Nominatim/.test(s.como)) e.falta.push(`templo «${sedeTxt}»: solo un punto aproximado de Nominatim, sin edificio en OSM`);
    else e.falta.push(`templo «${sedeTxt}»: ${s?.motivo || 'no encontrado en OSM'}`);
  } else if (sedeTxt) e.falta.push(`la sede de la ficha («${h.sede}») no es un templo: falta situarla con fuente`);
  else e.falta.push('la ficha no da sede');
  if (e.templo && !fichaFuente) e.falta.push('templo sin enlace a la ficha oficial');
  // ---- casa hermandad (solo si es otro edificio) ----
  const cs = CASAS[h.slug];
  if (CORR[h.slug] && 'casa_hermandad' in CORR[h.slug]) e.casa_hermandad = CORR[h.slug].casa_hermandad;
  else if (cs && cs.dir && !ES_TEMPLO.test(sn(cs.dir))) {
    const s = C.sedeDe(h.slug, 'Casa Hermandad');
    if (s?.punto) {
      const enTemplo = e.templo && (() => { const w = C.LUG.find((x) => `${x.type}/${x.id}` === e.templo.osm); return w && dentro(C.anillo(w), C.X(...s.punto)); })();
      if (enTemplo) e.falta.push('la casa hermandad está en el mismo edificio que el templo');
      else e.casa_hermandad = { dir: cs.dir, lat: r7(s.punto[0]), lon: r7(s.punto[1]), ...(s.puerta ? { osm: 'node/' + s.puerta } : {}), fuente: cs.fuente, fuente_coordenadas: s.puerta ? `OpenStreetMap, puerta ${s.puerta} con esa dirección` : /Nominatim/.test(s.como) ? 'Nominatim (dirección), aproximado' : `punto de casas-hermandad-${c}.json (sin coordenadas en la fuente: situado por su dirección)` };
    } else e.falta.push(`casa hermandad «${cs.dir}»: dirección sin situar en OSM`);
  }
  if (e.templo) nT++; if (e.casa_hermandad) nC++;
  if (!e.falta.length) delete e.falta;
  out.hermandades[h.slug] = e;
}
const dir = path.join(RAIZ, 'site', 'data', 'sedes'); fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, c + '.json'), JSON.stringify(out, null, 1));
console.log(`${C.nombre}: ${P.length} hermandades · ${nT} templos situados · ${nC} casas hermandad · ${P.length - nT} sin templo → site/data/sedes/${c}.json`);
