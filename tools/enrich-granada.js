// Enriquecimiento verificado de Granada.
// Fuente primaria: fichas oficiales de la Real Federación de Hermandades y Cofradías de Semana Santa
// de la Ciudad de Granada (hermandadesdegranada.com). El nombre oficial es el título de cada ficha.
// Reseñas redactadas con palabras propias a partir de esas fichas.
const fs = require('fs');
const path = require('path');
const PAGES = JSON.parse(fs.readFileSync(path.join(__dirname, 'sources', 'granada-pages.json'), 'utf8'));
const small = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'en', 'a', 'al']);
function fixCase(s) {
  if (s !== s.toUpperCase()) return s;
  return s.toLowerCase().split(' ').map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
}
function page(sub) {
  const keys = Object.keys(PAGES).filter((k) => (sub.exact ? k === sub.exact : k.includes(sub)));
  if (keys.length !== 1) throw new Error('Página de Granada no única: ' + JSON.stringify(sub) + ' → ' + keys.length);
  return PAGES[keys[0]];
}
const E = {};
function add(slug, sub, o) {
  const p = page(sub);
  E[slug] = Object.assign({ no: fixCase(p.titulo), url: p.link }, o);
}

add('la-borriquilla-granada', 'entrada-de-jesus-en-jerusalen', { f: '1948 (primer titular desde 1917)',
  h: 'El nacimiento de la cofradía se sitúa en 1948, aunque su primer titular, la imagen de Jesús entrando en Jerusalén, ya salía a la calle desde la segunda década del siglo XX: una talla de vestir de 1917, obra de Eduardo Espinosa Cuadros. La titular mariana, Nuestra Señora de la Paz, es de Antonio Dubé de Luque (1972) y se incorporó a la hermandad en 1974. Ya en el siglo XXI se completó el paso con San Juan, Santiago, San Andrés y otras figuras.' });
add('santa-cena-granada', 'santa-cena-sacramental', { f: 'Asociación de 1915; cofradía en 1926',
  h: 'Tiene su origen en la Asociación de los Jueves Eucarísticos, fundada en 1915 para conmemorar la Cena del Señor, elevada a archicofradía en 1924 y constituida como cofradía en mayo de 1926. Ese mismo año ya contaba con el boceto del paso, encargado a Eduardo Espinosa Cuadros, autor del grupo de trece figuras de la Santa Cena (1926-1928). En 1936 se le encargó la Virgen de la Victoria, terminada y bendecida en 1940.' });
add('la-sentencia-maravillas-granada', 'jesus-de-la-sentencia', { f: '1944',
  h: 'Fundada el 6 de febrero de 1944, con estatutos aprobados el día 18 de ese mes, realizó su primera salida el Martes Santo, 4 de abril de 1944. El Señor de la Sentencia se atribuye a José de Mora (principios del siglo XVIII) y la Virgen de las Maravillas, a Pedro de Mena.' });
add('el-despojado-silencio-blanco-granada', 'jesus-despojado', { f: '1986',
  h: 'Fundada el 13 de mayo de 1986, llegó a la parroquia de San Emilio en febrero de 1988. Sus estatutos se aprobaron en 1990 y hizo su primera salida el 9 de abril de 1995, aún sin estar en la nómina de la Real Federación. Las imágenes del misterio se ejecutaron entre 1990 y 2001, San Juan Evangelista en 1995 y la Virgen del Dulce Nombre se bendijo en 1989.' });
add('el-cautivo-granada', 'jesus-cautivo', { f: '1981',
  h: 'Nació en el convento franciscano de la Encarnación, con reglas aprobadas el 2 de diciembre de 1981, y salió por primera vez en 1982 desde una capilla anexa a San Felipe Neri. Nada más fundarse encargó al imaginero sevillano Antonio Joaquín Dubé de Luque su titular mariana, María Santísima de la Encarnación.' });
add('el-trabajo-granada', 'cristo-del-trabajo', { f: '1985',
  h: 'Nació en el barrio del Zaidín en abril de 1985 y sus estatutos se aprobaron el 14 de febrero de 1990. Antes procesionaba por el barrio con una imagen mariana de la escuela granadina; por el deterioro de la talla, en 1992 el escultor Eduardo Espinosa Alfambra, sobrino de Espinosa Cuadros, hizo la Virgen actual.' });
add('nuestra-senora-de-los-dolores-granada', { exact: 'real-cofradia-de-nuestra-senora-de-los-dolores' }, { f: '1936 (reglas de 1940)',
  t: [['Nuestra Señora de los Dolores', 'Aurelio López Azaustre, 1961']],
  h: 'Nació al amparo del Tercio de Requetés «Isabel la Católica», que en 1936 se alojó en el Palacio de los Tellos, donde se veneraba una dolorosa. Sus reglas se aprobaron el 10 de marzo de 1940 y salió por primera vez ese año desde la parroquia de la Magdalena. La imagen actual es del escultor granadino Aurelio López Azaustre y se bendijo el 24 de marzo de 1961.' });
add('jesus-del-rescate-granada', { exact: 'cofradia-de-nuestro-padre-jesus-del-rescate' }, { f: '1925 (primera salida en 1927)',
  h: 'Se fundó en 1925 como Cofradía del Prendimiento de Jesús y salió por primera vez en la Semana Santa de 1927; desde entonces procesiona el Lunes Santo. Sus estatutos se ratificaron el 26 de mayo de 1926. La imagen se atribuye a Diego de Mora (hacia 1718) y luce una peluca de cobre cincelado de Navas Parejo, de finales de los años veinte, además de un extenso ajuar.' });
add('el-huerto-granada', 'oracion-de-nuestro-senor-en-el-huerto', { f: '1943',
  h: 'La devoción a la Oración en el Huerto surgió en Granada a mediados del siglo XVI y se mantuvo en San Antón hasta los primeros años del XX. La cofradía actual se fundó en abril de 1943 en la sacristía de la parroquia de Santa Escolástica (iglesia de Santo Domingo). Procesiona con dos pasos: el misterio, obra del escultor granadino Domingo Sánchez Mesa, y la Virgen de la Amargura Coronada, bajo palio bordado por las Madres Comendadoras de Santiago.' });
add('cristo-de-san-agustin-granada', 'cristo-de-san-agustin', { f: 'Cristo de 1520; hermandad de origen barroco',
  h: 'En 1520 los agustinos calzados encargaron a Jacobo Florentino «el Indaco» el crucificado para la iglesia de su convento. La devoción creció y el Cristo salió en rogativa en 1587, 1635 y 1750. La Virgen de la Consolación es de Antonio Joaquín Dubé de Luque (1990), que también talló a San Juan Evangelista (2001); la Magdalena es de Elías Rodríguez Picón (2007).' });
add('la-lanzada-granada', 'sagrada-lanzada', { f: '1983',
  h: 'Fundada el 20 de noviembre de 1983, con estatutos aprobados el 25 de mayo de 1984, se erigió en la parroquia de Nuestra Señora de los Dolores y salió por primera vez el Lunes Santo de 1985. El Cristo es de Antonio Barbero Gor (1984), con la figura de Longinos de la misma mano, y la Virgen de la Caridad, de Miguel Zúñiga Navarro (1985); desde 1986 procesiona el Martes Santo.' });
add('el-via-crucis-granada', 'santo-via-crucis', { f: '1917',
  h: 'Es considerada la decana de las corporaciones nazarenas de Granada tras la revitalización de la Semana Santa que tuvo como embrión el «desfile antológico» (cuyo primer centenario se celebró en 2009). A lo largo de su historia ha tenido varias imágenes de Jesús de la Amargura; la actual, con cruz de taracea granadina, se atribuye a José de Mora. Desde el año 2000 procesiona como Virgen a Nuestra Señora de los Reyes, dolorosa del siglo XVIII del malagueño Antonio Asensio de la Cerda.' });
add('la-esperanza-granada', 'gran-poder-y-nuestra-senora-de-la-esperanza', { f: '1927',
  h: 'Fundada el 27 de abril de 1927, con reglas aprobadas en octubre de ese año, añadió a la Semana Santa granadina la advocación de Nuestra Señora de la Esperanza. La Virgen es una imagen de vestir de José Risueño, de 1718, que fue titular de la antigua Cofradía del Entierro de Cristo con el título de las Tres Necesidades. El Gran Poder actual es de Manuel Ramos Corona (1996).' });
add('la-canilla-granada', { exact: 'cofradia-del-senor-de-la-humildad-soledad-de-nuestra-senora-y-dulce-nombre-de-jesus' }, { f: '1925',
  h: 'Fundada en 1925, vio aprobados sus estatutos en 1926 por el cardenal Casanova y ese mismo año realizó su primera estación de penitencia. La Soledad de Nuestra Señora es obra de Manuel González (principios del siglo XIX) y el Dulce Nombre de Jesús, de raíces dominicas, se atribuye a Torcuato Ruiz del Peral. El Viernes Santo a las tres de la tarde la Soledad llega al Campo del Príncipe, en el Realejo, para acompañar al Cristo de los Favores.' });
add('los-gitanos-granada', 'cristo-del-consuelo', { f: '1939',
  h: 'Fundada el 14 de mayo de 1939. Su Cristo del Consuelo, de José Risueño (1698), se veneró primero con el título de Cristo de las Cuevas; la imagen original recibe culto en la Abadía del Sacromonte y la que procesiona es una copia hecha «por puntos» por Miguel Zúñiga Navarro entre 1987 y 1989. La Virgen del Sacromonte, atribuida a Manuel González (siglo XIX), era conocida como la Dolorosa de las Santas Cuevas.' });
add('los-estudiantes-granada', 'esclavitud-del-santisimo-sacramento', { f: '1979',
  h: 'Nació en 1979, con estatutos «ad experimentum» el 24 de noviembre de ese año, refrendados por el arzobispo en 1981, y salió por primera vez en 1980 con una imagen mariana de vestir que no era suya. La Virgen de los Remedios, de Israel Cornejo (2005), fue donada por el Colegio de Administradores de Fincas de Granada y se bendijo el 6 de diciembre de 2005 en los Santos Justo y Pastor.' });
add('paciencia-y-penas-granada', 'apostol-san-matias', { f: '1959',
  h: 'Erigida el 14 de septiembre de 1959, hizo su primera salida el 13 de abril de 1960 y desde entonces procesiona el Miércoles Santo. El Señor de la Paciencia, que representa la flagelación, es obra de Pablo de Rojas (siglo XVI); la Virgen de las Penas es de José Jiménez Mesa (1959-1960), inspirada en la Dolorosa atribuida a José de Mora, y se bendijo el Domingo de Ramos de 1960 en la iglesia de San Matías.' });
add('tres-caidas-y-rosario-granada', 'tres-caidas', { f: '1927 (Archicofradía del Rosario fundada en 1492)',
  h: 'Fundada el 19 de noviembre de 1927 como hermandad de penitencia de la de gloria de la Archicofradía del Rosario Coronada, creada en 1492 y a la que los Reyes Católicos dieron el título de Real. El Nazareno de las Tres Caídas es una talla anónima del siglo XVII venerada en el convento de Santa Isabel la Real, y la Virgen del Rosario es del taller de Miguel Zúñiga (1985), restaurada en 1995.' });
add('el-nazareno-granada', 'jesus-nazareno-y-maria-santisima-de-la-merced', { f: 'Devoción desde c. 1582; hermandad actual de 1981',
  h: 'La devoción a Jesús Nazareno en Granada se remonta hacia 1582, cuando se fundó en el convento de los Carmelitas Descalzos la hermandad de Jesús Nazareno, Santa Cruz de Jerusalén y Santa Elena, llamada popularmente de «las cruces de nazarenos». La imagen actual es obra del granadino Antonio Barbero Gor y se había proyectado inicialmente para la Hermandad de la Concepción con la advocación de Jesús del Amor y Entrega.' });
add('los-salesianos-granada', 'salesiana', { f: '1983',
  h: 'Fundada en 1983 a partir del grupo joven de la Asociación de antiguos alumnos salesianos y de la cuadrilla de María Auxiliadora, vio aprobadas sus primeras reglas el 6 de abril de 1984. El Cristo de la Redención, de Antonio Díaz Fernández, se bendijo el 13 de abril de 1984 y Nuestra Señora de la Salud, el 15 de febrero de 1986; esta última fue retallada en 2009 por Israel Cornejo.' });
add('la-concha-granada', 'amor-y-la-entrega', { f: '1977',
  h: 'Fundada el 3 de abril de 1977, con estatutos de 31 de marzo de 1978, está en el origen de la regeneración definitiva de la Semana Santa granadina. La Virgen de la Concepción, de Aurelio López Azaustre, se bendijo el 8 de diciembre de 1978; Jesús del Amor y la Entrega se bendijo el 2 de octubre de 1983 y procesionó por primera vez en 1984. Hasta 1983 salió como primer titular Jesús Preso, el Cristo de las Eras.' });
add('la-aurora-granada', 'perdon-y-maria-santisima-de-la-aurora', { f: '1944',
  h: 'Muy ligada al Albaicín y a la hermandad del Vía Crucis, nació en 1944 y sus primeras reglas se aprobaron el 27 de abril de 1945. En 1982 la talla original del Cristo, de Diego de Siloé, fue sustituida por una copia «por puntos» de Antonio Barbero Gor; el original se conserva y venera en la parroquia de San José.' });
add('la-estrella-granada', 'jesus-de-la-pasion-y-maria-santisima-de-la-estrella', { f: '1979',
  h: 'Cofradía albaicinera fundada el 15 de febrero de 1979, con primeras reglas aprobadas el 14 de enero de 1980, hizo su primera salida procesional en 1980 el Viernes Santo. Ese mismo año empezó a tener imágenes propias al encargar al sevillano Antonio Joaquín Dubé de Luque su titular mariana, María Santísima de la Estrella.' });
add('el-silencio-granada', 'cristo-de-la-misericordia-silencio', { f: '1924',
  h: 'Fundada el 6 de mayo de 1924, vio aprobados sus estatutos ese mismo año y sus primeras reglas fueron refrendadas por Pío XI, que le concedió el título de Pontificia. Realizó su primera salida en la Semana Santa de 1925 con el Cristo de la Misericordia, tallado por José de Mora en el siglo XVII.' });
add('los-ferroviarios-granada', 'buena-muerte-y-nuestra-senora-del-amor', { f: '1953',
  h: 'Ligada en sus inicios a la Hermandad Católica Ferroviaria, nace en 1953 y se considera heredera de una hermandad gremial del siglo XVIII que procesionaba con el rezo del Rosario; hoy es la única superviviente de las llamadas hermandades gremiales. Dejó de salir en 1963 y renació en 1980 por iniciativa del cuerpo de costaleros de María Santísima de la Victoria. La Virgen del Amor y del Trabajo se atribuye a la escuela de Mora (hacia 1770).' });
add('los-favores-granada', 'cristo-de-los-favores', { f: '1928',
  h: 'La devoción al Cristo de los Favores del monumento del Campo del Príncipe persistió entre los vecinos del Realejo durante el siglo XIX y creció desde 1881 con la peregrinación de fieles. La hermandad de penitencia se fundó el 26 de noviembre de 1928, con reglas aprobadas el 13 de diciembre, durante el arzobispado del cardenal Casanova. El diseño del paso fue del joven escultor granadino Antonio Martínez Olalla.' });
add('los-escolapios-granada', 'escolapia', { f: '1935',
  t: [['Santísimo Cristo de la Expiración', 'Domingo Sánchez-Mesa, 1944'], ['María Santísima del Mayor Dolor', 'Luis Álvarez Duarte, 2000']],
  h: 'Fundada el 8 de febrero de 1935 por alumnos y antiguos alumnos del Colegio de los Escolapios, hizo su primera salida el Jueves Santo, 18 de abril del mismo año. Su Cristo de la Expiración actual, de Domingo Sánchez Mesa, se bendijo en 1944; la Virgen del Mayor Dolor anterior, donada por el médico del colegio en 1890, fue sustituida en el año 2000 por la dolorosa de Luis Álvarez Duarte.' });
add('santo-entierro-granada', 'santo-sepulcro-y-nuestra-senora-de-la-soledad-del-calvario', { f: '1924',
  h: 'La cofradía «oficial» de la Semana Santa de Granada se erigió en San Gil y Santa Ana y vio aprobadas sus reglas el 16 de octubre de 1924. Jesús en el sepulcro es una imagen anónima del siglo XVIII, dentro de una urna de ébano, plata y bronce hecha entre 1675 y 1691 por Manuel Valdés. La Virgen de la Soledad del Calvario es obra de José de Mora, que comenzó a ejecutarla en 1671.' });
add('las-chias-granada', 'soledad-coronada-y-descendimiento', { f: '1561',
  h: 'Sus orígenes se remontan a 1561, cuando la Soledad formaba parte de la Cofradía de Nuestra Señora de la Soledad y Entierro de Cristo, en el convento de los Carmelitas Descalzos. Un conflicto con la Hermandad de las Tres Necesidades, fundada en 1615, se resolvió con la unión definitiva de ambas en 1840. El Cristo del Descendimiento es anónimo del siglo XVI-XVII, atribuido a Diego de Aranda, y la Soledad es una talla del siglo XVII atribuida a Pedro de Mena.' });
add('santa-maria-de-la-alhambra-granada', 'santisima-trinidad-y-nombre-de-jesus', { f: '1887 (cofradía erigida en 1928)',
  h: 'La Cofradía de Santa María de la Alhambra se erigió canónicamente el 23 de mayo de 1928, aunque la primitiva hermandad de la imagen se fundó en 1887 con la advocación de los Dolores, que cambió por la de las Angustias en 1910. La Virgen es de Torcuato Ruiz del Peral (1750-1773). Su día de salida varió durante años hasta fijarse en el Sábado Santo en 1977.' });
add('la-resurreccion-granada', 'arcangel-san-miguel', { f: '1985',
  h: 'Fundada en 1985, con estatutos refrendados por el arzobispo el 10 de febrero de 1986, vino a completar la idea de que la Resurrección del Señor estuviera presente en la Semana Santa granadina. El Cristo resucitado, el ángel (1988) y los soldados son de Miguel Zúñiga Navarro, que también talló la Virgen del Triunfo (1987), bendecida el 6 de marzo de 1988.' });
add('el-resucitado-granada', 'cristo-resucitado-y-nuestra-senora-de-la-alegria', { f: '1985',
  h: 'Fundada el 27 de noviembre de 1985 por su vinculación con las Hijas de la Caridad y federada en 1992. El Cristo, de Antonio Barbero Gor, se bendijo el 11 de abril de 1987 en la parroquia de Regina Mundi, y Nuestra Señora de la Alegría, del mismo autor (1992), se inspira en la Victoria de Samotracia. Desde 2010 sale por la mañana del Domingo de Resurrección.' });
add('los-facundillos-granada', { exact: 'cofradia-del-senor-de-la-humildad-soledad-de-nuestra-senora-y-dulce-nombre-de-jesus-facundillos' }, { f: 'Ligada al Dulce Nombre dominico; refundada en el siglo XX',
  h: 'La advocación del Dulce Nombre de Jesús se vincula a la Orden de Predicadores. La imagen, atribuida a Torcuato Ruiz del Peral, es una talla completa del siglo XVIII que bendice con la mano derecha y porta una cruz de caoba y marfil. La cofradía tuvo una historia de apariciones y desapariciones: resurgió en 1851 por mandato de la Congregación de Santo Domingo de Guzmán y volvió a apagarse en 1857.' });

module.exports = E;
