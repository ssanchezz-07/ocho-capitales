// Enriquecimiento verificado de Cádiz.
// Fuente primaria: fichas oficiales del Consejo Local de Hermandades y Cofradías de Cádiz (consejocofradiascadiz.es).
// Solo se corrigen/añaden datos contrastados; las reseñas previas se conservan.
const B = 'https://consejocofradiascadiz.es/';
const E = {};
function add(slug, off, o) { E[slug] = Object.assign({ url: B + off + '/' }, o || {}); }
add('servitas-cadiz', 'servitas-cadiz');
add('merced-obediencia-cadiz', 'merced-3', { f: '1628 (Esclavitud de la Merced)' });
add('la-borriquita-cadiz', 'la-paz', { f: '1944' });
add('el-despojado-cadiz', 'despojado', { f: '2007' });
add('sagrada-cena-cadiz', 'sagrada-cena', { f: '1960' });
add('las-penas-cadiz', 'las-penas', { f: 'Archicofradía del Pilar (1730); cofradía de 1955' });
add('humildad-y-paciencia-cadiz', 'humildad-y-paciencia');
add('la-palma-cadiz', 'la-palma', { f: 'Cofradía de la Misericordia (1938), fusionada con la Archicofradía de la Palma en 1968',
  t: [['Santísimo Cristo de la Misericordia', 'cabeza genovesa s. XVIII, restaurado por Francisco Buiza, 1969'], ['María Santísima de las Penas Coronada', 'anónima']] });
add('el-prendimiento-cadiz', 'prendimiento', { f: 'Congregación de la Vela (1792) y hermandad de 1976, fusionadas en 1979' });
add('nazareno-del-amor-cadiz', 'nazareno-del-amor', { t: [['Nuestro Padre Jesús Nazareno del Amor', 'José Rivera García, 1940'], ['Nuestra Señora de la Esperanza', 'Luis Jiménez, 1962']] });
add('vera-cruz-cadiz', 'vera-cruz', { t: [['Santísimo Cristo de la Vera+Cruz', 's. XVIII, entorno de Anton Maria Maragliano'], ['Nuestra Señora de la Soledad', 'Sebastián Santos, 1944']] });
add('la-sanidad-cadiz', 'sanidad', { t: [['Nuestro Padre Jesús del Mayor Dolor', 'Miguel Láinez Capote, 1948'], ['María Santísima de la Salud', 'Francisco Buiza, 1978']] });
add('la-piedad-cadiz', 'piedad', { t: [['Santísimo Cristo de la Piedad', 'Francesco Maria Maggio, 1754'], ['María Santísima de las Lágrimas', 'Francisco Buiza, 1958'], ['Nuestro Padre Jesús de la Humillación', 'atrib. Pedro Roldán']] });
add('jesus-caido-el-senor-del-parque-cadiz', 'jesus-caido');
add('ecce-homo-cadiz', 'ecce-homo', { f: 'Mediados del s. XVII (primeros datos de 1668)' });
add('la-columna-cadiz', 'columna');
add('las-cigarreras-cadiz', 'cigarreras', { t: [['Nuestro Padre Jesús de la Salud (Coronado de Espinas)', 'atrib. Francisco de Villegas, 1624-1652'], ['María Santísima de la Esperanza', 'Luis Álvarez Duarte, 2005']] });
add('la-sentencia-cadiz', 'sentencia');
add('las-aguas-cadiz', 'las-aguas', { t: [['Santísimo Cristo de las Aguas', 'Francisco Buiza, 1981'], ['María Santísima de Guadalupe', 'Francisco Javier Navarro Moragas, 1995'], ['San Juan Evangelista', 'Antonio Eslava Rubio, 1951']] });
add('el-caminito-cadiz', 'el-caminito', { f: 'Rosario de 1701; reglas de 1732' });
add('los-afligidos-cadiz', 'afligidos', { f: '1726', t: [['Nuestro Padre Jesús de los Afligidos', 'Peter Sterling, 1726'], ['María Santísima de los Desconsuelos', 'Peter Sterling, 1726']] });
add('oracion-en-el-huerto-cadiz', 'oracion-en-el-huerto', { f: '1956', t: [['Nuestro Padre Jesús de la Oración en el Huerto', '1989'], ['Nuestra Señora de Gracia y Esperanza', 'Miguel Láinez Capote, 1958']] });
add('medinaceli-cadiz', 'medinaceli');
add('nazareno-de-santa-maria-cadiz', 'nazareno', { f: 'Entre 1590 y 1594' });
add('el-perdon-cadiz', 'perdon', { f: '1935' });
add('el-descendimiento-cadiz', 'descendimiento');
add('la-expiracion-cadiz', 'expiracion', { t: [['Santísimo Cristo de la Expiración', 'anónimo s. XVII'], ['María Santísima de la Victoria', 'Emilio Luis Bartús']] });
add('siete-palabras-cadiz', 'siete-palabras');
add('la-buena-muerte-cadiz', 'buena-muerte');
add('santo-entierro-cadiz', 'soledad', { f: '1592' });
add('la-resurreccion-cadiz', 'resucitado');
module.exports = E;
