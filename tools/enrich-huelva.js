// Enriquecimiento verificado de Huelva.
// Fuente primaria: fichas oficiales del Consejo de Hermandades y Cofradías de Semana Santa de la Ciudad de Huelva
// (consejohermandadeshuelva.es). Nombre oficial tomado de la cabecera de cada ficha.
const fs = require('fs');
const path = require('path');
const P = JSON.parse(fs.readFileSync(path.join(__dirname, 'sources', 'huelva-pages.json'), 'utf8'));
const E = {};
function add(slug, off, o) {
  const p = P[off];
  if (!p) throw new Error('Página de Huelva no encontrada: ' + off);
  const no = (p.no || '').replace(/^Archicofradía de la Vera\+Cruz y Oración en el Huerto /, '');
  E[slug] = Object.assign({ url: p.link, no: no || undefined }, o || {});
}
add('la-borriquita-huelva', 'hermandad-de-la-borriquita', { f: '1945', t: [['Jesús en su Entrada Triunfal en Jerusalén', 'Antonio León Ortega, 1946'], ['Nuestra Señora de los Ángeles', 'Antonio León Ortega, 1948-1949']] });
add('la-sagrada-cena-huelva', 'hermandad-sacramental-de-la-sagrada-cena', { t: [['Santísimo Cristo del Amor', 'Antonio León Ortega, 1949'], ['Apostolado', 'Enrique Galarza, 1952'], ['María Santísima del Rosario en sus Misterios Dolorosos', 'Antonio León Ortega, 1955']] });
add('la-redencion-huelva', 'hermandad-de-la-rendencion');
add('los-mutilados-huelva', 'hermandad-sacramental-de-los-mutilados');
add('el-perdon-huelva', 'hermandad-del-perdon');
add('el-cautivo-huelva', 'hermandad-del-cautivo', { f: '1981' });
add('el-calvario-huelva', 'hermandad-del-calvario', { t: [['Nuestro Padre Jesús del Calvario', 'Antonio León Ortega, 1972'], ['María Santísima del Rocío y Esperanza', 'Sebastián Santos, 1973']] });
add('las-tres-caidas-huelva', 'hermandad-de-las-tres-caidas');
add('la-salud-huelva', 'hermandad-sacramental-de-la-salud', { f: 'Asociación de gloria (1976); hermandad de penitencia en 2000',
  t: [['Nuestro Padre Jesús de la Sentencia en su Presentación al Pueblo', 'David Valenciano, 1998'], ['Nuestra Señora de la Salud', 'Enrique Pérez Saavedra, 1991']] });
add('la-lanzada-huelva', 'hermandad-de-la-sagrada-lanzada', { f: '1986 (erección canónica)',
  t: [['Santísimo Cristo de la Sagrada Lanzada', 'Joaquín Moreno Daza, 1985'], ['María Santísima titular', 'Manuel Domínguez Rodríguez, 1968']] });
add('los-estudiantes-huelva', 'hermandad-de-los-estudiantes', { t: [['Santísimo Cristo de la Sangre', 'Antonio León Ortega, 1950'], ['Nuestra Señora del Valle', 'Antonio León Ortega, 1956']] });
add('pasion-huelva', 'hermandad-sacramental-de-pasion', { f: 'Sacramental de San Pedro (1536); cofradía de Pasión de 1918',
  t: [['Nuestro Padre Jesús de la Pasión', 'Antonio Infante Reina, 1938'], ['María Santísima del Refugio', 'anónima finales s. XVIII']] });
add('el-prendimiento-huelva', 'hermandad-del-prendimiento-y-la-estrella', { t: [['Nuestro Padre Jesús del Prendimiento', 'José Manuel Bonilla Cornejo, 1989'], ['María Santísima de la Estrella', 'José Manuel Bonilla Cornejo, 2001'], ['Misterio del Prendimiento', 'Rubén Fernández Parra, 2007']] });
add('la-santa-cruz-huelva', 'hermandad-de-la-santa-cruz', { t: [['Nuestro Señor Jesús de la Providencia', 'Mario Ignacio Moya, 2005'], ['María Santísima Madre de Gracia', 'Elías Rodríguez Picón, 1998']] });
add('la-victoria-huelva', 'hermandad-de-la-victoria');
add('la-esperanza-huelva', 'hermandad-de-la-esperanza');
add('vera-cruz-y-oracion-huelva', 'hermandad-veracruz-y-oracion-en-el-huerto');
add('la-misericordia-huelva', 'hermandad-de-la-misericordia');
add('la-buena-muerte-huelva', 'hermandad-de-la-buena-muerte');
add('los-judios-la-merced-huelva', 'hermandad-de-los-judios');
add('el-nazareno-huelva', 'hermandad-del-nazareno', { t: [['Nuestro Padre Jesús Nazareno', 'Sebastián Santos, 1950'], ['María Santísima de la Amargura', 'Ramón Chaveli, 1937']] });
add('la-fe-huelva', 'hermandad-de-la-fe', { t: [['Santísimo Cristo de la Fe', 'Antonio León Ortega, 1975'], ['Nuestra Señora de la Caridad', 'José Méndez González, 1990']] });
add('el-descendimiento-huelva', 'hermandad-del-sagrado-descendimiento');
add('el-santo-entierro-huelva', 'hermandad-del-santo-entierro', { t: [['Nuestra Señora de las Angustias', 'Antonio León Ortega, 1958'], ['Cristo yacente', 'cabeza ss. XVI-XVII; cuerpo de Antonio León Ortega, 1944']] });
add('el-silencio-la-soledad-huelva', 'hermandad-del-silencio');
add('el-resucitado-huelva', 'hermandad-del-resucitado', { t: [['Santísimo Cristo Resucitado', 'Elías Rodríguez Picón, 2003'], ['María Santísima de la Luz', 'Elías Rodríguez Picón, 2001']] });
// Hermandad del Consejo no incluida antes
E['nuestra-senora-del-prado-huelva'] = { url: P['hermandad-de-penitencia-de-nuestra-senora-del-prado-en-su-dolor'].link, n: 'Nuestra Señora del Prado', dia: 'Hermandades agrupadas',
  no: 'Hermandad de Penitencia de Nuestra Señora del Prado en su Dolor', t: [['Nuestra Señora del Prado en su Dolor', 'Rubén Fernández Parra, 2009']],
  h: 'Hermandad de penitencia integrada en el Consejo de Hermandades de Huelva. Su titular, Nuestra Señora del Prado en su Dolor, es una dolorosa del imaginero sevillano Rubén Fernández Parra, bendecida en 2009.' };
module.exports = E;
