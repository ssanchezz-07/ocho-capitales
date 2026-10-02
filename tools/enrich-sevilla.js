// Enriquecimiento de Sevilla. El Consejo General de Hermandades no publica fichas por hermandad,
// así que la fuente es Wikipedia (CC BY-SA 4.0): se toman solo datos factuales (sede, fundación, titulares)
// y se completan donde faltaban; se respetan los datos y reseñas ya contrastados.
const fs = require('fs');
const path = require('path');
const W = JSON.parse(fs.readFileSync(path.join(__dirname, 'sources', 'sevilla-wikipedia.json'), 'utf8'));
const wurl = (t) => 'https://es.wikipedia.org/wiki/' + encodeURIComponent(t.replace(/ /g, '_'));
const okFund = (f) => /\d{3,4}/.test(f || '');
const E = {};
const MAP = {
  'la-borriquita': 'Hermandad del Amor (Sevilla)', 'el-amor': 'Hermandad del Amor (Sevilla)', 'jesus-despojado': 'Hermandad de Jesús Despojado (Sevilla)',
  'la-paz': 'Hermandad de la Paz (Sevilla)', 'la-cena': 'Hermandad de la Cena (Sevilla)', 'la-hiniesta': 'Hermandad de la Hiniesta (Sevilla)',
  'san-roque': 'Hermandad de San Roque (Sevilla)', 'la-estrella': 'Hermandad de la Estrella (Sevilla)', 'la-amargura': 'Hermandad de la Amargura (Sevilla)',
  'san-pablo': 'Hermandad de San Pablo (Sevilla)', 'redencion': 'Hermandad de la Redención (Sevilla)', 'santa-genoveva': 'Hermandad de Santa Genoveva (Sevilla)',
  'santa-marta': 'Hermandad de Santa Marta (Sevilla)', 'san-gonzalo': 'Hermandad de San Gonzalo (Sevilla)', 'vera-cruz': 'Hermandad de la Vera Cruz (Sevilla)',
  'las-penas': 'Hermandad de las Penas (Sevilla)', 'las-aguas': 'Hermandad de las Aguas (Sevilla)', 'el-museo': 'Hermandad del Museo (Sevilla)',
  'el-cerro': 'Hermandad del Cerro (Sevilla)', 'los-javieres': 'Hermandad de los Javieres (Sevilla)', 'san-esteban': 'Hermandad de San Esteban (Sevilla)',
  'los-estudiantes': 'Hermandad de los Estudiantes (Sevilla)', 'san-benito': 'Hermandad de San Benito (Sevilla)', 'la-candelaria': 'Hermandad de la Candelaria (Sevilla)',
  'dulce-nombre-la-bofeta': 'Hermandad del Dulce Nombre (Sevilla)', 'santa-cruz': 'Hermandad de Santa Cruz (Sevilla)', 'el-carmen-doloroso': 'Hermandad del Carmen (Sevilla)',
  'la-sed': 'Hermandad de la Sed (Sevilla)', 'san-bernardo': 'Hermandad de San Bernardo (Sevilla)', 'el-buen-fin': 'Hermandad del Buen Fin (Sevilla)',
  'la-lanzada': 'Hermandad de la Lanzada (Sevilla)', 'el-baratillo': 'Hermandad del Baratillo (Sevilla)', 'cristo-de-burgos': 'Hermandad del Cristo de Burgos (Sevilla)',
  'siete-palabras': 'Hermandad de las Siete Palabras (Sevilla)', 'los-panaderos': 'Hermandad de los Panaderos (Sevilla)', 'los-negritos': 'Hermandad de los Negritos (Sevilla)',
  'la-exaltacion-los-caballos': 'Hermandad de la Exaltación (Sevilla)', 'las-cigarreras': 'Hermandad de las Cigarreras (Sevilla)', 'montesion': 'Hermandad de Monte-Sion',
  'la-quinta-angustia': 'Hermandad de la Quinta Angustia (Sevilla)', 'el-valle': 'Hermandad del Valle (Sevilla)', 'pasion': 'Hermandad de Pasión (Sevilla)',
  'el-silencio': 'Hermandad del Silencio (Sevilla)', 'el-gran-poder': 'Hermandad de Jesús del Gran Poder', 'el-calvario': 'Hermandad del Calvario (Sevilla)',
  'la-esperanza-de-triana': 'Hermandad de la Esperanza de Triana', 'los-gitanos': 'Hermandad de los Gitanos (Sevilla)', 'la-carreteria': 'Hermandad de la Carretería (Sevilla)',
  'san-isidoro': 'Hermandad de las Tres Caídas (Sevilla)', 'la-o': 'Hermandad de la O (Sevilla)', 'san-buenaventura': 'Hermandad de la Soledad de San Buenaventura (Sevilla)',
  'montserrat': 'Hermandad de Montserrat (Sevilla)', 'la-sagrada-mortaja': 'Hermandad de la Sagrada Mortaja (Sevilla)', 'el-cachorro': 'Hermandad del Cachorro (Sevilla)',
  'los-servitas': 'Hermandad de los Servitas (Sevilla)', 'la-trinidad': 'Hermandad de la Trinidad (Sevilla)', 'el-santo-entierro': 'Hermandad del Santo Entierro (Sevilla)',
  'la-soledad-de-san-lorenzo': 'Hermandad de la Soledad de San Lorenzo (Sevilla)', 'la-resurreccion': 'Hermandad de la Resurrección (Sevilla)',
};
for (const [k, title] of Object.entries(MAP)) {
  const ib = W[title];
  if (!ib) throw new Error('Sin ficha Wikipedia: ' + title);
  E[k + '-sevilla'] = { url: wurl(title), fuente: 'wikipedia', sIfEmpty: ib.residencia || ib.sede || '', fIfEmpty: okFund(ib['fundación']) ? ib['fundación'] : '' };
}
// Hermandades de Vísperas (no incluidas antes)
const V = [
  ['Bellavista', 'Hermandad de Bellavista', 'Viernes de Dolores', [['María Santísima del Dulce Nombre en sus Dolores y Compasión', 'Luis Álvarez Duarte, 1969'], ['Nuestro Padre Jesús de la Salud y Remedios', '']]],
  ['Bendición y Esperanza', 'Hermandad de Bendición y Esperanza', 'Viernes de Dolores', null],
  ['Pasión y Muerte', 'Hermandad de Pasión y Muerte (Sevilla)', 'Viernes de Dolores', null],
  ['Pino Montano', 'Hermandad de Pino Montano (Sevilla)', 'Viernes de Dolores', null],
  ['La Misión', 'Hermandad de la Misión (Sevilla)', 'Viernes de Dolores', null],
  ['Cristo de la Corona', 'Hermandad del Cristo de la Corona (Sevilla)', 'Viernes de Dolores', [['Santísimo Cristo de la Corona', ''], ['Nuestra Señora del Rosario', 'Manuel Pereira, 1638']]],
  ['Padre Pío', 'Hermandad de Padre Pío', 'Sábado de Pasión', null],
  ['San José Obrero', 'Hermandad de San José Obrero', 'Sábado de Pasión', null],
  ['La Milagrosa', 'Hermandad de la Milagrosa', 'Sábado de Pasión', null],
  ['Dolores de Torreblanca', 'Hermandad de los Dolores de Torreblanca', 'Sábado de Pasión', null],
  ['Divino Perdón', 'Hermandad del Divino Perdón', 'Sábado de Pasión', null],
  ['El Sol', 'Hermandad del Sol (Sevilla)', 'Sábado de Pasión', [['Santo Cristo Varón de Dolores de la Divina Misericordia', 'José Manuel Bonilla Cornejo'], ['María Santísima de la Salud', '']]],
];
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
for (const [n, title, dia, tit] of V) {
  const ib = W[title] || {};
  const t = tit || (ib.titulares || '').split(/\s*[·,]\s*/).filter(Boolean).slice(0, 4).map((x) => [x, '']);
  const sede = ib.residencia || ib.sede || '';
  const f = (ib['fundación'] || '').replace(/\s*·\s*/g, '; ');
  E[slug(n) + '-sevilla'] = { n, dia, url: wurl(title), fuente: 'wikipedia', s: sede, f: okFund(f) ? f : '', t,
    h: 'Hermandad de las Vísperas de la Semana Santa de Sevilla: realiza su salida el ' + dia + (sede ? ' desde ' + sede : '') + '.' };
}
module.exports = E;
// La Macarena figura en una subcategoría propia de Wikipedia
module.exports['la-macarena-sevilla'] = { url: 'https://es.wikipedia.org/wiki/' + encodeURIComponent('Hermandad_de_la_Macarena_(Sevilla)'), fuente: 'wikipedia' };
