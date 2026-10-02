// Enriquecimiento verificado de Almería.
// Fuente primaria: fichas oficiales de la Agrupación de Hermandades y Cofradías de Almería (cofradiasdealmeria.es).
const B = 'https://cofradiasdealmeria.es/';
const E = {};
function add(slug, off, o) { E[slug] = Object.assign({ url: B + off + '/' }, o || {}); }
add('la-borriquita-almeria', 'borriquita', { f: '1928 (reorganizada en 1948 y en 1980)' });
add('los-angeles-almeria', 'los-angeles');
add('la-estrella-almeria', 'estrella');
add('la-santa-cena-almeria', 'santa-cena');
add('pasion-almeria', 'hermandad-de-pasion', { t: [['Nuestro Padre Jesús de Salud y Pasión', 'Luis Álvarez Duarte'], ['María Santísima de los Desamparados', 'Luis Álvarez Duarte, 1998-2000']] });
add('gran-poder-almeria', 'hermandad-del-gran-poder', { t: [['Nuestro Padre Jesús del Gran Poder', 'José Antonio Navarro Arteaga, 1996'], ['Nuestra Señora del Carmen', 'José Antonio Navarro Arteaga, 1998'], ['María Santísima del Mayor Dolor y Traspaso', 'David Valenciano']] });
add('la-coronacion-almeria', 'hermandad-de-la-coronacion');
add('el-amor-almeria', 'hermandad-del-amor');
add('el-perdon-silencio-almeria', 'hermandad-del-perdon');
add('el-calvario-cristo-del-mar-almeria', 'calvario');
add('el-prendimiento-almeria', 'hermandad-del-prendimiento');
add('la-macarena-almeria', 'macarena');
add('los-estudiantes-almeria', 'cofradia-de-estudiantes');
add('rosario-del-mar-almeria', 'rosario-del-mar');
add('el-encuentro-jesus-nazareno-almeria', 'hermandad-del-encuentro');
add('las-angustias-almeria', 'hermandad-de-las-angustias');
add('el-silencio-descendimiento-almeria', 'cofradia-del-silencio');
add('la-caridad-almeria', 'caridad');
add('el-santo-sepulcro-almeria', 'hermandad-del-santo-sepulcro', { t: [['Cristo yacente', 'Nicolás Prados López, 1945'], ['Nuestra Señora de los Dolores', 'Nicolás Prados López, 1945']] });
add('la-soledad-almeria', 'hermandad-de-la-soledad', { f: '1773 (reglas)', t: [['Nuestra Señora de los Dolores en su Soledad', 'José Ortells, 1941'], ['San Juan Evangelista', 'Juan Manuel Miñarro, 1997']] });
add('el-resucitado-almeria', 'hermandad-de-el-resucitado');
module.exports = E;
