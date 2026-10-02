// Transforma data-raw.json (artefacto original) en portal-cofrade/data/portal.json
const fs = require('fs');
const path = require('path');
const raw = require('../data-raw.json');
const ENR = {};
for (const c of ['sevilla', 'malaga', 'granada', 'cordoba', 'cadiz', 'huelva', 'almeria', 'jaen']) ENR[c] = require('./enrich-' + c + '.js');
const AG = 'https://agrupaciondecofradias.com/hermandades/';
const IMG = JSON.parse(fs.readFileSync(path.join(__dirname, 'sources', 'images.json'), 'utf8'));
const ALM_MUS = JSON.parse(fs.readFileSync(path.join(__dirname, 'sources', 'almeria-musica-2026.json'), 'utf8'));
const GR_MARCHAS = JSON.parse(fs.readFileSync(path.join(__dirname, 'sources', 'granada-marchas.json'), 'utf8'));
const imgOf = (k) => { const i = IMG[k]; return i ? { src: i.thumb, w: i.w, h: i.h, autor: i.autor, licencia: i.licencia, licurl: i.licurl || '', pagina: i.page, escudo: !!i.escudo } : null; };

const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[«»"'()]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const CITY_NAMES = { sevilla:'Sevilla', malaga:'Málaga', granada:'Granada', cordoba:'Córdoba', cadiz:'Cádiz', huelva:'Huelva', almeria:'Almería', jaen:'Jaén' };

// ---------- Días normalizados ----------
const DAY_ORDER = ['Viernes de Dolores','Sábado de Pasión','Vísperas','Domingo de Ramos','Lunes Santo','Martes Santo','Miércoles Santo','Jueves Santo','Jueves Santo y Madrugada','Madrugá','Viernes Santo','Sábado Santo','Domingo de Resurrección','Hermandades agrupadas'];
const normDay = (d) => (d === 'Madrugada' ? 'Madrugá' : d);

// ---------- Imagineros ----------
const FULLNAME = {
  'buiza':'Francisco Buiza','dubé de luque':'Antonio Dubé de Luque','espinosa alfambra':'Eduardo Espinosa Alfambra',
  'zúñiga':'Miguel Zúñiga','barbero gor':'Antonio Barbero Gor','álvarez duarte':'Luis Álvarez Duarte',
  'gonzález jurado':'Miguel Ángel González Jurado','martínez cerrillo':'Juan Martínez Cerrillo','romero zafra':'Francisco Romero Zafra',
  'león ortega':'Antonio León Ortega','láinez capote':'Miguel Láinez Capote','gonzález rey':'Luis González Rey',
  'moreno daza':'Joaquín Moreno Daza','valenciano':'David Valenciano','garcía jeute':'Luis Alberto García Jeute',
  'madroñal':'Salvador Madroñal','hervás':'José María Hervás','martínez puertas':'José Martínez Puertas',
  'prados lópez':'Nicolás Prados López','miñarro':'Juan Manuel Miñarro','navarro arteaga':'José Antonio Navarro Arteaga',
  'bejarano':'Miguel Bejarano','tirao':'José Miguel Tirao','cabello':'José Antonio Cabello','rodríguez picón':'Elías Rodríguez Picón',
  'castillo lastrucci':'Antonio Castillo Lastrucci','sánchez mesa':'Domingo Sánchez-Mesa','domingo sánchez mesa':'Domingo Sánchez-Mesa','sánchez-mesa':'Domingo Sánchez-Mesa',
  'eduardo espinosa':'Eduardo Espinosa Cuadros','navas-parejo':'José Navas Parejo','gómez del castillo':'Joaquín Gómez del Castillo',
  'palma burgos':'Francisco Palma Burgos','antonio illanes':'Antonio Illanes','illanes':'Antonio Illanes',
  'castillo ariza':'Antonio Castillo Ariza','antonio castillo ariza':'Antonio Castillo Ariza','josé gabriel martín simón':'José Gabriel Martín Simón','josé martín simón':'José Gabriel Martín Simón','antonio eslava':'Antonio Eslava Rubio','antonio eslava rubio':'Antonio Eslava Rubio','pedro moreira lópez':'Pedro Moreira','josé navas-parejo':'José Navas Parejo','navas parejo':'José Navas Parejo',
  'antonio bernal redondo':'Antonio Bernal','jacinto higueras fuentes':'Jacinto Higueras','jacinto higueras cátedra':'Jacinto Higueras Cátedra','josé miguel tirao carpio':'José Miguel Tirao','juan abascal fuentes':'Juan Abascal','ramón mateu montesinos':'Ramón Mateu','antonio josé martínez rodríguez':'Antonio José Martínez','josé maría leal bernáldez':'José María Leal','josé antonio navarro arteaga':'José Antonio Navarro Arteaga','francesco maria maggio':'Francesco Maria Mayo','josé rivera garcía':'José Rivera','david valenciano larios':'David Valenciano','antonio infante reina':'Infantes Reina','josé manuel bonilla cornejo':'José Manuel Bonilla','joaquín gómez del castillo':'Joaquín Gómez del Castillo','miguel láinez capote':'Miguel Láinez Capote','miguel josé láinez capote':'Miguel Láinez Capote','sebastián santos rojas':'Sebastián Santos','juan manuel miñarro lópez':'Juan Manuel Miñarro','luis alberto garcía jeute':'Luis Alberto García Jeute',
  'juan abascal':'Juan Abascal','jesús de perceval':'Jesús de Perceval','antonio díaz':'Antonio Díaz','antonio bernal':'Antonio Bernal',
};
// Fichas biográficas: solo datos que están bien contrastados.
const IMAG_INFO = {
  'Juan de Mesa': { vida:'1583–1627', escuela:'Sevilla (Barroco)', bio:'Discípulo de Martínez Montañés, es uno de los grandes imagineros del Barroco sevillano. De su gubia salieron crucificados y nazarenos como el Gran Poder, el Cristo del Amor, la Buena Muerte de los Estudiantes o el Cristo de la Conversión del Buen Ladrón.' },
  'Juan Martínez Montañés': { vida:'1568–1649', escuela:'Sevilla (Barroco)', bio:'Llamado «el Dios de la madera», fue el escultor más influyente de la escuela sevillana del siglo XVII y maestro de Juan de Mesa. Su Jesús de la Pasión es una obra cumbre de la imaginería procesional.' },
  'Pedro Roldán': { vida:'1624–1699', escuela:'Sevilla (Barroco)', bio:'Escultor sevillano, cabeza de una dinastía de artistas que incluye a su hija Luisa Roldán. Autor de grupos procesionales como el Descendimiento de la Quinta Angustia y de imágenes como el Nazareno de la O.' },
  'Luisa Roldán': { vida:'1652–1706', escuela:'Sevilla / Cádiz / Madrid (Barroco)', bio:'«La Roldana», hija de Pedro Roldán, fue escultora de cámara de Carlos II. Es la única mujer imaginera de primer nivel del Barroco español.' },
  'Francisco Antonio Gijón': { vida:'c. 1653–1721', escuela:'Sevilla (Barroco)', bio:'Escultor sevillano, autor del Cristo de la Expiración «el Cachorro» de Triana (1682).' },
  'Pedro de Mena': { vida:'1628–1688', escuela:'Granada / Málaga (Barroco)', bio:'Discípulo de Alonso Cano, trabajó en Granada y Málaga. Es una de las figuras de la escultura barroca andaluza, con obras repartidas por ambas ciudades.' },
  'Alonso Cano': { vida:'1601–1667', escuela:'Granada (Barroco)', bio:'Pintor, arquitecto y escultor granadino. Su influencia marcó la escuela de Granada y a sus discípulos, entre ellos Pedro de Mena y José de Mora.' },
  'José de Mora': { vida:'1642–1724', escuela:'Granada (Barroco)', bio:'Escultor granadino, hijo de Bernardo de Mora y discípulo de Alonso Cano. Autor del Cristo de la Misericordia del Silencio y de numerosas imágenes de Granada.' },
  'Pablo de Rojas': { vida:'1549–1611', escuela:'Granada (Renacimiento-Barroco)', bio:'Escultor de Alcalá la Real establecido en Granada, maestro de Juan Martínez Montañés. Autor del Cristo de la Paciencia.' },
  'Antonio Castillo Lastrucci': { vida:'1882–1967', escuela:'Sevilla (siglo XX)', bio:'Imaginero sevillano de gran producción en el siglo XX; ejecutó la imaginería de muchas hermandades reconstruidas tras 1936.' },
  'Mariano Benlliure': { vida:'1862–1947', escuela:'Valencia / Madrid', bio:'Escultor valenciano de proyección internacional, autor del Cristo de la Expiración y del Nazareno del Paso de Málaga.' },
  'José Capuz': { vida:'1884–1964', escuela:'Valencia / Madrid', bio:'Escultor valenciano establecido en Madrid. Es el autor del Cristo Resucitado, titular de la Agrupación de Cofradías de Semana Santa de Málaga (1946).' },
  'Fernando Ortiz': { vida:'1717–1771', escuela:'Málaga (Barroco)', bio:'Escultor y académico malagueño, la figura más importante de la escultura de Málaga en el siglo XVIII. Con su nombre se vinculan el Señor del Huerto (1756), el Cristo del Amor y la Dolorosa del Amor y la Dolorosa de los Servitas.' },
  'Francisco Buiza': { vida:'1922–1983', escuela:'Sevilla (siglo XX)', bio:'Imaginero sevillano, autor de la Virgen de la Trinidad (Málaga) y de numerosos pasos andaluces.' },
  'Luis Álvarez Duarte': { vida:'n. 1949', escuela:'Sevilla (siglo XX-XXI)', bio:'Imaginero sevillano, uno de los más prolíficos de la imaginería actual. Autor del Cristo de la Sed o la Virgen del Patrocinio, entre muchas otras.' },
  'Francisco Palma Burgos': { vida:'1906–1996', escuela:'Málaga (siglo XX)', bio:'Escultor malagueño que restauró buena parte del patrimonio perdido en 1931; autor del Cristo de la Buena Muerte de Mena.' },
  'Antonio León Ortega': { vida:'1907–1991', escuela:'Cádiz (siglo XX)', bio:'Escultor gaditano, figura clave de la imaginería de la Semana Santa de Cádiz.' },
};

const NOT_AUTHOR = /^(talleres|autor desconocido|s\.|ss\.|c\.|\d|anónim|anonim|gótic|escuela|donad|traíd|cabeza|antigu|finales|anterior|años|misterio de|el original)/i;
function parseAuthor(raw) {
  if (!raw) return null;
  let s = raw.trim();
  let atrib = false;
  if (/^(atrib\.|atribuid[ao] (sin certeza )?a|círculo de)/i.test(s)) { atrib = true; s = s.replace(/^(atrib\.|atribuid[ao] (sin certeza )?a|círculo de)\s*/i, ''); }
  if (/\(atrib\.\)/.test(s)) atrib = true;
  s = s.replace(/^misterio de /i, '');
  if (NOT_AUTHOR.test(s)) return null;
  s = s.split(/,| \(| y | \/ | en urna| \d/)[0].trim();
  if (!s || /^(anónim|s\.)/i.test(s)) return null;
  const k = s.toLowerCase();
  if (FULLNAME[k]) s = FULLNAME[k];
  if (s === 'Martínez') return null; // ambiguo
  if (s.length < 6) return null;
  return { nombre: s, atrib };
}

// ---------- Procesado ----------
const capitales = [], hermandades = [];
const imagineros = new Map();
const bandas = new Map();
const usedSlugs = new Set();

function uniqueSlug(base) { let s = base, i = 2; while (usedSlugs.has(s)) s = base + '-' + i++; usedSlugs.add(s); return s; }

// --- parser de bandas ---
const BAND_START = '(?:AM|A\\. ?M\\.|BCT|BM|Banda|Agrupaci[oó]n|Asociaci[oó]n|Filarm[oó]nica|Capilla|Secci[oó]n|Tercio|Quinteto)';
const ABBR = [['Ntra. Sra.', 'Nuestra Señora'], ['Ntro. Padre', 'Nuestro Padre'], ['A. M.', 'AM'], ['Ntra.', 'Nuestra'], ['Ntro.', 'Nuestro']];
function expandName(n) {
  return n.replace(/^A\.? ?M\.? /, 'Agrupación Musical ').replace(/^AM /, 'Agrupación Musical ')
    .replace(/^BCT /, 'Banda de Cornetas y Tambores ').replace(/^BM /, 'Banda de Música ')
    .replace(/Ntra\. Sra\./g, 'Nuestra Señora').replace(/Ntro\./g, 'Nuestro').replace(/Ntra\./g, 'Nuestra')
    .replace(/^Banda Municipal de/, 'Banda Municipal de').replace(/\s+/g, ' ').trim();
}
function bandTipo(n) {
  if (/Cornetas y Tambores/.test(n)) return 'Banda de cornetas y tambores';
  if (/Agrupación Musical/.test(n)) return 'Agrupación musical';
  if (/Capilla/.test(n)) return 'Capilla musical';
  if (/Filarmónica|Banda de Música|Banda Municipal|Banda /.test(n)) return 'Banda de música';
  if (/Tercio/.test(n)) return 'Música militar';
  return 'Formación musical';
}
function parseBandas(m, ciudadId, hermandadNombre, hermandadSlug) {
  if (!m) return [];
  let t = m;
  for (const [a, b] of ABBR) t = t.split(a).join(b);
  const out = [];
  for (const seg of t.split(/\.\s+|\.$/).map((x) => x.trim()).filter(Boolean)) {
    let rol = '', rest = seg;
    const mm = seg.match(/^([A-Za-zÁÉÍÓÚáéíóúñ,\- ]{2,90}):\s*(.*)$/);
    if (mm) { rol = mm[1].trim(); rest = mm[2]; }
    if (!new RegExp('^' + BAND_START).test(rest)) continue;
    const parts = rest.split(new RegExp(' y (?=' + BAND_START + ')'));
    for (let p of parts) {
      p = p.replace(/§/g, '.').trim().replace(/\.$/, '');
      if (!new RegExp('^' + BAND_START).test(p)) continue;
      if (/^Quinteto|de la propia hermandad|^Capilla (musical($|;)|de viento)/i.test(p)) continue;
      const pm = p.match(/^(.*?)\s*\(([^)]+)\)\s*(.*)$/);
      let nombre = pm ? pm[1] : p, loc = pm ? pm[2] : '';
      let propia = false;
      if (/propia/i.test(loc)) { propia = true; loc = ''; }
      if (/propia/i.test(pm ? pm[3] : '')) propia = true;
      nombre = nombre.replace(/,.*$/, '').trim();
      const full = expandName(nombre);
      if (full.length < 8) continue;
      out.push({ nombre: full, loc, propia, rol, tipo: bandTipo(full) });
    }
  }
  return out;
}

for (const c of raw) {
  // cambios de estructura: mover hermandades de día o añadir nuevas (según fuentes oficiales)
  if (ENR[c.id]) {
    for (const [base, e] of Object.entries(ENR[c.id])) {
      if (!e.dia) continue;
      let found = null;
      for (const d of c.dias) {
        const i = d.hs.findIndex((x) => slugify(x.n) + '-' + c.id === base);
        if (i >= 0) { found = d.hs.splice(i, 1)[0]; break; }
      }
      if (!found) found = { n: e.n };
      let day = c.dias.find((d) => d.dia === e.dia);
      if (!day) { day = { dia: e.dia, hs: [] }; c.dias.push(day); }
      day.hs.push(found);
    }
    c.dias = c.dias.filter((d) => d.hs.length);
  }
  capitales.push({
    slug: c.id, nombre: c.nombre || CITY_NAMES[c.id], color: c.color, lema: c.lema,
    intro: c.intro, datos: c.id === 'sevilla' ? c.datos.map((r) => (r[0].startsWith('Hermandades') ? ['Hermandades', '60 en la Semana Santa y 12 en las Vísperas (Viernes de Dolores y Sábado de Pasión)'] : r)) : c.id === 'cordoba' ? c.datos.map((r) => (r[0] === 'Hermandades' ? ['Hermandades', '41 en la Agrupación: 38 en la carrera oficial por días y 3 agrupadas aparte (fuente: Agrupación)'] : r)) : c.id === 'malaga' ? c.datos.map((r) => (r[0] === 'Cofradías' ? ['Cofradías', '43 en la Agrupación de Cofradías (fuente: Agrupación)'] : r)) : c.datos, claves: c.claves,
    dias: c.dias.map((d) => normDay(d.dia)), imagen: imgOf('capital:' + c.id),
  });
  for (const dia of c.dias) {
    const diaN = normDay(dia.dia);
    dia.hs.forEach((h, idx) => {
      const base = slugify(h.n) + '-' + c.id;
      const e = ENR[c.id] && ENR[c.id][base];
      if (e) {
        if (e.s) h.s = e.s;
        if (!h.s && e.sIfEmpty) h.s = e.sIfEmpty;
        if (e.f) h.f = e.f;
        if (!h.f && e.fIfEmpty) h.f = e.fIfEmpty;
        if (e.h) h.h = e.h;
        if (e.no) h.no = e.no;
        if (e.t) h.t = e.t.map((t) => t[1] ? t[0] + ' — ' + t[1] : t[0]);
        h.src = e.url || (e.off ? AG + e.off + '/' : '');
        if (e.web) h.web = e.web;
        if (c.id === 'granada' && e.url) { const pk = e.url.replace(/\/$/, '').split('/').pop(); if (GR_MARCHAS[pk]) h.marchas = GR_MARCHAS[pk]; }
        if (c.id === 'almeria' && ALM_MUS[base]) { h.musOf = ALM_MUS[base]; h.m = ALM_MUS[base].map((x) => x.titular + ': ' + x.banda).join('. ') + '. (Acompañamiento oficial 2026)'; }
      } else if (ENR[c.id]) { console.warn('SIN ENRIQUECER:', base); }
      const slug = uniqueSlug(base);
      const titulares = (h.t || []).map((t) => {
        const [nom, ...rest] = t.split(' — ');
        const autorRaw = rest.join(' — ') || '';
        const a = parseAuthor(autorRaw);
        if (a) {
          if (!imagineros.has(a.nombre)) imagineros.set(a.nombre, { nombre: a.nombre, obras: [], ciudades: new Set() });
          const im = imagineros.get(a.nombre);
          im.obras.push({ titular: nom.trim(), hermandad: h.n, hermandad_slug: slug, ciudad: c.id, detalle: autorRaw, atrib: a.atrib });
          im.ciudades.add(c.id);
        }
        return { nombre: nom.trim(), autor: autorRaw, imaginero: a ? a.nombre : '', atrib: a ? a.atrib : false };
      });
      const bs = parseBandas(h.m, c.id, h.n, slug);
      for (const b of bs) {
        const key = (b.nombre + '|' + (b.propia ? c.id : b.loc)).toLowerCase();
        if (!bandas.has(key)) bandas.set(key, { nombre: b.nombre, tipo: b.tipo, localidad: b.propia ? CITY_NAMES[c.id] : b.loc, acompana: [] });
        bandas.get(key).acompana.push({ hermandad: h.n, hermandad_slug: slug, ciudad: c.id, rol: b.rol, propia: b.propia });
      }
      hermandades.push({
        slug, nombre: h.n, ciudad: c.id, dia: diaN, orden: idx + 1, sede: h.s || '', fundacion: h.f || '',
        titulares, paso: h.p || '', musica: h.m || '', historia: h.h || '', nombre_oficial: h.no || '', fuente_url: h.src || '', web: h.web || '', imagen: imgOf(slug), marchas: h.marchas || [], musica_oficial: h.musOf || [],
        bandas: bs.map((b) => expandName(b.nombre)),
      });
    });
  }
}

// fusionar bandas sin localidad con la homónima que sí la tiene (misma ciudad o única candidata)
for (const [key, b] of [...bandas.entries()]) {
  if (b.localidad) continue;
  const cands = [...bandas.entries()].filter(([k, o]) => o !== b && o.nombre === b.nombre && o.localidad);
  let target = null;
  if (cands.length === 1) target = cands[0];
  else {
    const ciu = new Set(b.acompana.map((a) => CITY_NAMES[a.ciudad]));
    const same = cands.filter(([k, o]) => ciu.has(o.localidad));
    if (same.length === 1) target = same[0];
  }
  if (target) { target[1].acompana.push(...b.acompana); bandas.delete(key); }
}
// asignar slugs a imagineros/bandas
const imgOut = [...imagineros.values()].map((im) => ({
  slug: slugify(im.nombre), nombre: im.nombre, vida: (IMAG_INFO[im.nombre] || {}).vida || '', escuela: (IMAG_INFO[im.nombre] || {}).escuela || '',
  bio: (IMAG_INFO[im.nombre] || {}).bio || '', ciudades: [...im.ciudades], obras: im.obras,
})).sort((a, b) => b.obras.length - a.obras.length || a.nombre.localeCompare(b.nombre, 'es'));

const bandOut = [...bandas.values()].map((b) => {
  const base = slugify(b.nombre + (b.localidad ? ' ' + b.localidad : ''));
  return { ...b, slug: base };
}).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
// slugs de banda únicos
const bs = new Set(); for (const b of bandOut) { let s = b.slug, i = 2; while (bs.has(s)) s = b.slug + '-' + i++; bs.add(s); b.slug = s; }
// ids de banda por hermandad
const bandBySlugName = new Map(bandOut.map((b) => [b.nombre.toLowerCase(), b.slug]));
for (const h of hermandades) h.bandas_slugs = h.bandas.map((n) => bandBySlugName.get(n.toLowerCase())).filter(Boolean);

const out = { version: 1, generado: new Date().toISOString(), dias_orden: DAY_ORDER, capitales, hermandades, imagineros: imgOut, bandas: bandOut };
const dest = path.join(__dirname, '..', 'portal-cofrade', 'data');
fs.mkdirSync(dest, { recursive: true });
fs.writeFileSync(path.join(dest, 'portal.json'), JSON.stringify(out));
console.log('capitales', capitales.length, 'hermandades', hermandades.length, 'imagineros', imgOut.length, 'bandas', bandOut.length);
console.log('imagineros top:', imgOut.slice(0, 12).map((i) => i.nombre + '(' + i.obras.length + ')').join(', '));
console.log('imagineros con 1 obra:', imgOut.filter((i) => i.obras.length === 1).length);
console.log('BANDAS:\n' + bandOut.map((b) => `${b.nombre} [${b.tipo}] ${b.localidad} -> ${b.acompana.map((a) => a.hermandad + '/' + a.ciudad).join('; ')}`).join('\n'));
