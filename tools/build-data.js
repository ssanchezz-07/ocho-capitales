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
// Complementos verificados (tools/sources/complementos.json): se usan al leer los titulares y al final
const COMP_FILE = path.join(__dirname, 'sources', 'complementos.json');
const COMP = fs.existsSync(COMP_FILE) ? JSON.parse(fs.readFileSync(COMP_FILE, 'utf8')) : {};
const imgOf = (k) => { const i = IMG[k]; return i ? { src: i.thumb, w: i.w, h: i.h, autor: i.autor, licencia: i.licencia, licurl: i.licurl || '', pagina: i.page, escudo: !!i.escudo } : null; };

const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[«»"'()]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const CITY_NAMES = { sevilla:'Sevilla', malaga:'Málaga', granada:'Granada', cordoba:'Córdoba', cadiz:'Cádiz', huelva:'Huelva', almeria:'Almería', jaen:'Jaén' };

// Cifra oficial de hermandades de cada capital (revisada el 2-nov-2026 en la nómina de su consejo, federación o agrupación).
// Es la que se enseña en /capitales/, en la cabecera de cada capital, en sus datos clave y en el buscador. «web» explica
// por qué la web tiene más fichas que la cifra oficial. La cifra de bandas no se enseña (decisión de Pablo).
const CIFRAS = {
  sevilla: { n: 71, nombre: 'hermandades', texto: '71 de penitencia en el Consejo: 60 de Domingo de Ramos a Resurrección y 11 en las Vísperas, el Viernes de Dolores y el Sábado de Pasión', fuente: ['Consejo General de Hermandades y Cofradías', 'https://www.hermandades-de-sevilla.org/hermandades/penitencia/'], web: 'La Borriquita tiene ficha propia, aunque sale con la Hermandad del Amor.' },
  malaga: { n: 43, nombre: 'hermandades', texto: '43 en la Agrupación de Cofradías, que sacan 45 cofradías a la calle (las Fusionadas salen tres días)', fuente: ['Agrupación de Cofradías', 'https://agrupaciondecofradias.com/hermandades/'], web: 'Recoge también 8 cofradías de las Vísperas que no pertenecen a la Agrupación.' },
  granada: { n: 32, nombre: 'cofradías', texto: '32 en la Real Federación, que forman 34 cortejos', fuente: ['Real Federación de Hermandades y Cofradías', 'https://hermandadesdegranada.com/'], web: 'La Cañilla tiene dos fichas: la del Martes Santo y la de los Facundillos, el Domingo de Resurrección.' },
  cordoba: { n: 42, nombre: 'hermandades', texto: '42 en la Agrupación: 38 en la carrera oficial por días y 4 agrupadas que procesionan aparte', fuente: ['Agrupación de Hermandades y Cofradías', 'https://www.hermandadesdecordoba.es/hermandades-agrupadas/'], web: 'Recoge también la Sangre de El Higuerón y la pro-hermandad del Traslado al Sepulcro, que no pertenecen a la Agrupación.' },
  cadiz: { n: 31, nombre: 'hermandades', texto: '31 de penitencia en el Consejo Local: 29 de Domingo de Ramos a Resurrección y 2 en las Vísperas', fuente: ['Consejo Local de Hermandades y Cofradías', 'https://consejocofradiascadiz.es/hermandades-y-cofradias-penitencia'], web: 'Recoge también Ecce Mater Tua y la Humillación, que no figuran en la nómina del Consejo.' },
  huelva: { n: 27, nombre: 'hermandades', texto: '27 de penitencia en el Consejo: 26 de Domingo de Ramos a Resurrección y 1 en las Vísperas', fuente: ['Consejo de Hermandades y Cofradías', 'https://consejohermandadeshuelva.es/'], web: 'Recoge también La Bendición, del Sábado de Pasión, que no figura en la nómina del Consejo.' },
  almeria: { n: 22, nombre: 'hermandades', texto: '22 de penitencia en la Agrupación: 21 de Domingo de Ramos a Resurrección y 1 el Sábado de Pasión', fuente: ['Agrupación de Hermandades y Cofradías', 'https://cofradiasdealmeria.es/penitencia/'], web: 'Recoge también el vía crucis del Cristo de la Escucha, que no figura en la nómina de la Agrupación.' },
  jaen: { n: 21, nombre: 'cofradías', texto: '21 de Pasión en la Agrupación, de Domingo de Ramos a Resurrección', fuente: ['Agrupación de Cofradías y Hermandades', 'https://cofradiasjaen.org/'], web: '' },
};
// Historia de cada capital, revisada el 2-nov-2026 frase a frase contra su fuente (se quitó lo que no constaba en ella)
const INTROS = {"sevilla":{"texto":["En sus comienzos, las cofradías sevillanas hacían estación de penitencia en iglesias y conventos cercanos a su sede. El sínodo de 1604 del cardenal Fernando Niño de Guevara las obligó a hacerla en la Catedral, y de aquellas normas nace la Semana Santa actual. Del Barroco siguen en la calle imágenes de Juan Martínez Montañés, Juan de Mesa, Pedro Roldán o Francisco Antonio Gijón, autor del Cachorro.","El siglo XX dejó otra gran generación de imagineros: Antonio Castillo Lastrucci, Antonio Illanes, Luis Ortega Bru, Francisco Buiza o Luis Álvarez Duarte. El bordador Juan Manuel Rodríguez Ojeda (1853-1930) cambió con sus diseños la estética de las cofradías, y Manuel López Farfán compuso marchas como «Pasan los campanilleros» (1924).","Los pasos van a costal. En 1973 Salvador Dorado, «el Penitente», sacó el Cristo de la Buena Muerte de los Estudiantes con una cuadrilla de hermanos costaleros; desde entonces los costaleros suelen ser hermanos de sus cofradías."],"fuentes":["https://es.wikipedia.org/wiki/Semana_Santa_en_Sevilla"]},"malaga":{"texto":["Tras la conquista de Málaga por los Reyes Católicos en 1487 nacieron las primeras cofradías, al amparo de las órdenes religiosas que llegaban a la ciudad. Los incendios de templos de 1931 y la Guerra Civil se llevaron buena parte de sus imágenes; para reponerlas, las cofradías acudieron a Francisco Palma Burgos, José Gabriel Martín Simón, José Navas Parejo, Antonio Castillo Lastrucci o Pío Mollar, entre otros.","La Agrupación de Cofradías se fundó en 1921. Lo que define a Málaga es el trono, llevado a varal por los hombres de trono, que lo levantan y lo bajan al toque de la campana de los mayordomos.","Todas las cofradías pasan por el recorrido oficial, pero no todas hacen estación dentro de la Catedral: a muchas se lo impide el tamaño de sus tronos. Es muy característica la escolta de cuerpos militares y de seguridad; la más famosa, la de la Legión y la Marina con el Cristo de Mena."],"fuentes":["https://es.wikipedia.org/wiki/Semana_Santa_en_Málaga"]},"granada":{"texto":["Las primeras hermandades nacieron tras la toma de Granada en 1492. En el siglo XVI se fundaron las cofradías de sangre de la Vera Cruz y de las Angustias, y en 1561 la de la Soledad, las Chías, como tercera de ellas. El renacer moderno empezó con la procesión del Santo Entierro Magno de 1909, y en 1927 se creó la Federación de Hermandades.","Su imaginería tiene firmas propias: Pablo de Rojas, José y Diego de Mora, José Risueño y Torcuato Ruiz del Peral en los siglos clásicos; Eduardo Espinosa Cuadros, Antonio Barbero Gor, Miguel Zúñiga o Manuel Ramos Corona en el XX. En 1936 Federico García Lorca escribió para Unión Radio una narración sobre la Semana Santa granadina."],"fuentes":["https://es.wikipedia.org/wiki/Semana_Santa_en_Granada"]},"cordoba":{"texto":["Las procesiones y las hermandades de penitencia se multiplicaron en Córdoba desde el siglo XVI, con la Contrarreforma. Tras la destrucción de arte sacro de la ocupación francesa (1808), el edicto de 1819 del obispo Pedro Antonio de Trevilla prohibió todas las procesiones salvo un Santo Entierro oficial. La costumbre resurgió desde 1849, cuando el Ayuntamiento empezó a organizar el Santo Entierro del Viernes Santo, y en 1944 el obispo Adolfo Pérez Muñoz fundó la Agrupación de Hermandades y Cofradías.","Más de 150 años después, en 2016 y 2017, las cofradías cordobesas recuperaron la estación de penitencia en la Mezquita-Catedral. Juan Martínez Cerrillo, Amadeo Ruiz Olmos, Miguel Ángel González Jurado o Antonio Bernal firman muchas de sus imágenes."],"fuentes":["https://es.wikipedia.org/wiki/Semana_Santa_en_Córdoba"]},"cadiz":{"texto":["El saqueo anglo-holandés de 1596 arrasó buena parte de la ciudad y los papeles de sus hermandades, aunque se sabe que la Vera+Cruz, el Nazareno y el Santo Entierro, ligadas al convento de San Francisco, son anteriores. Su imaginería reúne la escuela gaditano-genovesa (Jacinto Pimentel, Anton Maria Maragliano, Domenico Giscardi), al flamenco Peter Sterling, a José Montes de Oca y Francisco de Villegas y, ya en el siglo XX, a Francisco Buiza, Luis Ortega Bru, Luis González Rey o Miguel Láinez Capote.","Los pasos van a hombros, de costero a costero, con un andar más pausado que el de los costaleros, y los manigueteros marcan el compás con su horquilla. Son estrechos y altos para pasar por las calles del casco antiguo. En 1892 se constituyó la primera Junta de Cofradías de Cádiz, la más antigua de Andalucía."],"fuentes":["https://es.wikipedia.org/wiki/Semana_Santa_en_Cádiz"]},"huelva":{"texto":["Las primeras noticias son de 1536, sobre la Virgen de los Dolores del Santo Entierro, y la cofradía del Nazareno se fundó en 1583. En 1936 se perdieron muchas de las imágenes primitivas. La reconstrucción lleva un nombre propio: Antonio León Ortega, que tuvo taller en Huelva desde 1938 y talló buena parte de las imágenes de su Semana Santa.","La Virgen de la Cinta, patrona de la ciudad, es protectora de las hermandades. El Consejo de Hermandades (Unión de Hermandades en 1989, Consejo desde 1997) reúne a las 27 hermandades de penitencia de la ciudad, 25 de ellas en la carrera oficial."],"fuentes":["https://es.wikipedia.org/wiki/Semana_Santa_en_Huelva","https://es.wikipedia.org/wiki/Antonio_León_Ortega"]},"almeria":{"texto":["En 1743 se aprobaron las constituciones de la Hermandad de Jesús Nazareno de San Francisco, y en 1772 se fundó la de la Soledad. En 1793 se documenta un vía crucis por la Almedina que dejó su nombre en calles como Cruces, Púlpito o Encuentro. Entre 1936 y 1939 desaparecieron imágenes, pasos y enseres de casi todas las cofradías.","En la posguerra se rehicieron las antiguas y nacieron otras, como el Amor, surgida del gremio de banca y bolsa, los Estudiantes, el Silencio o el Prendimiento. Hoy son 22 hermandades de penitencia, con obra de imagineros contemporáneos como Antonio Dubé de Luque, Luis Álvarez Duarte o José Antonio Navarro Arteaga."],"fuentes":["https://es.wikipedia.org/wiki/Semana_Santa_en_Almería","https://cofradiasdealmeria.es/penitencia/"]},"jaen":{"texto":["Tras la conquista de Fernando III (1246) nacieron cofradías de fines piadoso-militares. Las de penitencia llegaron en el siglo XVI: la Vera-Cruz (1541), las Angustias (1551), la Soledad (1556) y el Santo Sepulcro (1580); el pleito entre estas dos últimas explica que haya dos cofradías del Santo Entierro, que se alternan la oficialidad: los años pares, el Santo Sepulcro, y los impares, la Soledad.","Firman su imaginería Salvador de Cuéllar y Sebastián de Solís en el siglo XVI, José de Mora en el XVII y José de Medina en el XVIII; tras la guerra, Jacinto Higueras, Francisco Palma Burgos o José Navas Parejo. Desde 1932 dirigió la Banda Municipal Emilio Cebrián, autor de «Nuestro Padre Jesús». La saeta se afianzó en la ciudad después de la guerra."],"fuentes":["https://es.wikipedia.org/wiki/Semana_Santa_en_Jaén"]}};
const LEMAS = { sevilla: 'La Semana Santa por antonomasia: 71 hermandades, pasos a costal y la Madrugá.', huelva: 'La ciudad de León Ortega: buena parte de su imaginería lleva la firma del ayamontino.' };
// Datos clave con la cifra oficial: sustituye la fila de hermandades o cofradías y añade la fuente y la nota de la web
const datosCap = (id, datos) => {
  const k = CIFRAS[id]; if (!k) return datos;
  const fila = [k.nombre === 'cofradías' ? 'Cofradías' : 'Hermandades', k.texto + ' (fuente: ' + k.fuente[0] + ')'];
  const out = datos.map((r) => (/^(Hermandades|Cofradías)/.test(r[0]) ? fila : r));
  if (!out.includes(fila)) out.unshift(fila);
  if (k.web) out.splice(out.indexOf(fila) + 1, 0, ['En esta web', k.web]);
  return out;
};

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
// Fichas biográficas, cada una con sus fuentes (revisadas el 27-oct: inventario I1-I4; antes estaban escritas sin fuente).
// León Ortega era de Ayamonte (Huelva), Álvarez Duarte murió en 2019 y Palma Burgos es 1918–1985. Sin fuente, no hay bio.
const IMAG_INFO = {
  'Juan de Mesa': { vida: "1583–1627", escuela: "Sevilla (Barroco)", bio: "Escultor cordobés que entró en 1606 en el taller de Martínez Montañés en Sevilla. Entre 1618 y 1620 talló el Cristo de la Conversión del Buen Ladrón, el Cristo del Amor, la Buena Muerte de los Estudiantes y el Gran Poder; murió sin terminar la Virgen de las Angustias de Córdoba.", fuentes: ["https://es.wikipedia.org/wiki/Juan_de_Mesa"] },
  'Juan Martínez Montañés': { vida: "1568–1649", escuela: "Sevilla (Barroco)", bio: "Escultor nacido en Alcalá la Real y afincado en Sevilla, donde murió en la peste de 1649. Le llamaron «el dios de la madera» y fue maestro de Juan de Mesa; su Jesús de la Pasión del Salvador es de hacia 1610-1615.", fuentes: ["https://es.wikipedia.org/wiki/Juan_Martínez_Montañés"] },
  'Pedro Roldán': { vida: "1624–1699", escuela: "Sevilla (Barroco)", bio: "Escultor nacido en Sevilla en una familia de Antequera, con un taller familiar del que salieron su hija Luisa Roldán, «la Roldana», y su nieto Pedro Duque Cornejo. Suyos son el Descendimiento de la Quinta Angustia (1660) y el Nazareno de la O (1685).", fuentes: ["https://es.wikipedia.org/wiki/Pedro_Roldán"] },
  'Francisco Antonio Gijón': { vida: "1653–c. 1720", escuela: "Sevilla (Barroco)", bio: "Escultor nacido en Utrera que trabajó en Sevilla, donde murió. Su pieza más famosa es el Cristo de la Expiración de Triana, «el Cachorro» (1682).", fuentes: ["https://es.wikipedia.org/wiki/Francisco_Antonio_Gijón"] },
  'Pedro de Mena': { vida: "1628–1688", escuela: "Granada / Málaga (Barroco)", bio: "Escultor granadino que compartió taller con Alonso Cano desde 1652, lo que cambió su manera de tallar. En 1658 se fue a Málaga para hacer la sillería del coro de la catedral, abrió allí su taller y vivió en la ciudad hasta su muerte.", fuentes: ["https://es.wikipedia.org/wiki/Pedro_de_Mena","https://es.wikipedia.org/wiki/Semana_Santa_en_Granada"] },
  'José de Mora': { vida: "1642–1724", escuela: "Granada (Barroco)", bio: "Escultor nacido en Baza, hijo del escultor Bernardo de Mora. Se formó en el taller paterno junto a Pedro de Mena y Alonso Cano, que fue quien más le marcó. Suyo es el Cristo de la Misericordia (1688) de la iglesia de San José, titular de la hermandad del Silencio de Granada.", fuentes: ["https://es.wikipedia.org/wiki/José_de_Mora","https://es.wikipedia.org/wiki/Semana_Santa_en_Granada"] },
  'Pablo de Rojas': { vida: "1549–1611", escuela: "Granada (Renacimiento-Barroco)", bio: "Escultor de Alcalá la Real asentado en Granada, al que la tradición tiene por maestro de Martínez Montañés. Se le atribuye el Jesús de la Paciencia de la iglesia de San Matías.", fuentes: ["https://es.wikipedia.org/wiki/Pablo_de_Rojas","https://es.wikipedia.org/wiki/Semana_Santa_en_Granada"] },
  'Antonio Castillo Lastrucci': { vida: "1882–1967", escuela: "Sevilla (siglo XX)", bio: "Imaginero sevillano, último discípulo directo de Antonio Susillo, con una producción enorme. Muchos de sus encargos fueron para sustituir imágenes destruidas al comienzo de la Guerra Civil o para hermandades nacidas en la posguerra.", fuentes: ["https://es.wikipedia.org/wiki/Antonio_Castillo_Lastrucci","https://www.ecured.cu/Antonio_Castillo_Lastrucci"] },
  'Mariano Benlliure': { vida: "1862–1947", escuela: "Valencia / Madrid", bio: "Escultor valenciano que murió en Madrid y de cuyo taller salieron muchas imágenes de Semana Santa. Para Málaga hizo el Nazareno del Paso (1935) y el Cristo de la Expiración (1940).", fuentes: ["https://es.wikipedia.org/wiki/Mariano_Benlliure","https://museo.depo.gal/documents/75239/143762/Dos_cuadros_para_la_Semana_Santa_Museo_de_Pontevedra.pdf"] },
  'José Capuz': { vida: "1884–1964", escuela: "Valencia / Madrid", bio: "Escultor valenciano, de una familia de escultores, que fue profesor en Madrid y murió allí. Entre 1945 y 1946 talló para la Agrupación de Cofradías de Málaga su Cristo Resucitado, bendecido y procesionado por primera vez en 1946.", fuentes: ["https://es.wikipedia.org/wiki/José_Capuz","https://repositorio.iaph.es/bitstream/11532/317238/1/INFORME_DIAGNOSTICO_RESUCITADO_M%C3%81LAGA.pdf"] },
  'Fernando Ortiz': { vida: "1717–1771", escuela: "Málaga (Barroco)", bio: "Escultor malagueño, el más importante de su ciudad en el siglo XVIII, nombrado académico de mérito de San Fernando en 1756. Talló el Señor del Huerto (1756) y la cabeza y las manos de la Dolorosa de Servitas; el Cristo del Amor y su Dolorosa figuran también en su catálogo.", fuentes: ["https://es.wikipedia.org/wiki/Fernando_Ortiz_(escultor)"] },
  'Francisco Buiza': { vida: "1922–1983", escuela: "Sevilla (siglo XX)", bio: "Imaginero nacido en Carmona y formado en Sevilla, donde tuvo por gran maestro a Sebastián Santos. Es autor de la Virgen de la Trinidad del Cautivo de Málaga (1968) y de la Sagrada Resurrección de Sevilla, entre muchas obras por toda Andalucía.", fuentes: ["https://es.wikipedia.org/wiki/Francisco_Buiza","https://es.wikipedia.org/wiki/Cofradía_del_Cautivo_(Málaga)"] },
  'Luis Álvarez Duarte': { vida: "1950–2019", escuela: "Sevilla (siglo XX-XXI)", bio: "Imaginero sevillano, en buena parte autodidacta, que pasó por los talleres de Buiza, Eslava y Barbero. Con el Cristo de la Sed (1970) y la Virgen del Patrocinio del Cachorro (1973) se hizo un nombre, y su obra está repartida por toda Andalucía.", fuentes: ["https://es.wikipedia.org/wiki/Luis_Álvarez_Duarte","https://dspace.unia.es/bitstream/handle/10334/525/17JVITI.pdf?sequence=1","https://www.ecured.cu/Luis_%C3%81lvarez_Duarte"] },
  'Francisco Palma Burgos': { vida: "1918–1985", escuela: "Málaga (siglo XX)", bio: "Escultor malagueño que aprendió el oficio de su padre, el escultor Francisco Palma García. En Málaga talló el Cristo de los Milagros de Zamarrilla (1938), su primera obra, y el nuevo Cristo de Mena (hacia 1941), que sustituyó al de Pedro de Mena quemado en 1931; también renovó la Semana Santa de Úbeda, donde murió.", fuentes: ["https://es.wikipedia.org/wiki/Francisco_Palma_Burgos","https://almudi.org/noticias-articulos-y-opinion/15185-el-cristo-de-la-buena-muerte"] },
  'Antonio León Ortega': { vida: "1907–1991", escuela: "Huelva (siglo XX)", bio: "Escultor nacido en Ayamonte y formado en Madrid, en la Escuela de Bellas Artes de San Fernando, con maestros como Benlliure y Capuz. Desde 1938 tuvo taller en Huelva y talló buena parte de las imágenes de su Semana Santa, además de obras para Ayamonte y otros pueblos de la provincia.", fuentes: ["https://es.wikipedia.org/wiki/Antonio_León_Ortega"] },
};

const NOT_AUTHOR = /^(talleres|autor desconocido|s\.|ss\.|c\.|\d|anónim|anonim|gótic|escuela|donad|traíd|cabeza|antigu|finales|anterior|años|misterio de|el original)/i;
function parseAuthor(raw) {
  if (!raw) return null;
  let s = raw.trim();
  let atrib = false;
  // «Atribuido a Atribuido a…» (complementos que ya traen el prefijo): se quita las veces que haga falta
  while (/^(atrib\.|atribuid[ao] (sin certeza )?a|círculo de)/i.test(s)) { atrib = true; s = s.replace(/^(atrib\.|atribuid[ao] (sin certeza )?a|círculo de)\s*/i, ''); }
  if (/\(atrib\.\)/.test(s)) atrib = true;
  s = s.replace(/^misterio de /i, '');
  if (NOT_AUTHOR.test(s)) return null;
  s = s.split(/,| \(| y | \/ | en urna| \d/)[0].trim();
  if (!s || /^(anónim|s\.)/i.test(s)) return null;
  // No es una persona (27-oct, inventario I5): dos autores posibles («Francisco de Ocampo o Pedro Roldán»), un solo nombre de pila
  // («Modesto y Damián Pastor» partido por la «y») o un grupo sin autor («grupo valenciano de 1918»)
  if (/ o /.test(s) || !/\s/.test(s) || /^grupo /i.test(s)) return null;
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
    slug: c.id, nombre: c.nombre || CITY_NAMES[c.id], color: c.color, lema: LEMAS[c.id] || c.lema,
    cifra: CIFRAS[c.id] ? { n: CIFRAS[c.id].n, nombre: CIFRAS[c.id].nombre, texto: CIFRAS[c.id].texto, fuente: CIFRAS[c.id].fuente } : null,
    intro: INTROS[c.id] ? INTROS[c.id].texto : c.intro, intro_fuentes: INTROS[c.id] ? INTROS[c.id].fuentes : [], datos: datosCap(c.id, c.datos), claves: c.claves,
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
        let autorRaw = rest.join(' — ') || '', autorFuente = '';
        // Autor que falta en la ficha oficial, buscado y revisado aparte (complementos.json → titulares_autor), con su fuente
        if (!autorRaw) {
          const ta = (((COMP.hermandades || {})[slug] || {}).titulares_autor || []).find((x) => x.titular === nom.trim());
          if (ta && ta.autor) { autorRaw = (ta.atribucion ? 'Atribuido a ' : '') + ta.autor + (ta.anio ? ', ' + ta.anio : ''); autorFuente = ta.fuente; }
        }
        const a = parseAuthor(autorRaw);
        if (a) {
          if (!imagineros.has(a.nombre)) imagineros.set(a.nombre, { nombre: a.nombre, obras: [], ciudades: new Set() });
          const im = imagineros.get(a.nombre);
          im.obras.push({ titular: nom.trim(), hermandad: h.n, hermandad_slug: slug, ciudad: c.id, detalle: autorRaw, atrib: a.atrib });
          im.ciudades.add(c.id);
        }
        return { nombre: nom.trim(), autor: autorRaw, imaginero: a ? a.nombre : '', atrib: a ? a.atrib : false, ...(autorFuente ? { autor_fuente: autorFuente } : {}) };
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

// ---------- vísperas y complementos: altas (antes de enlazar bandas); COMP se carga al principio ----------
const cap1 = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const HBY = new Map(hermandades.map((h) => [h.slug, h]));
const V = COMP.visperas || {};
for (const c of V.correcciones_dia || []) { const h = HBY.get(c.slug); if (h) { h.dia = c.dia; if (c.hora) { h.hora = c.hora; h.hora_fuente = c.hora_fuente || c.fuente; } if (c.orden) h.orden = c.orden; h.dia_fuente = c.fuente; } }
for (const s of V.salidas_extra || []) { const h = HBY.get(s.slug); if (h) (h.salidas = h.salidas || []).push({ dia: s.dia, titulares: s.titulares, hora: s.hora || '', sede: s.sede || '', nota: s.nota || '', fuente: s.fuente }); }
for (const n of V.nuevas || []) {
  const slug = slugify(n.nombre + ' ' + n.ciudad);
  if (HBY.has(slug)) continue;
  const orden = hermandades.filter((h) => h.ciudad === n.ciudad && h.dia === n.dia).length + 1;
  const h = { slug, nombre: n.nombre, ciudad: n.ciudad, dia: n.dia, orden, sede: n.sede || '', fundacion: '', titulares: (n.titulares || []).map((t) => ({ nombre: t, autor: '', imaginero: '', atrib: false })), paso: n.paso || '', musica: n.musica || '', historia: '', nombre_oficial: n.nombre_oficial || '', fuente_url: n.fuente, web: '', imagen: null, marchas: [], musica_oficial: [], bandas: [], bandas_slugs: [], hora: n.hora || '', visperas: true };
  if (n.hora) h.hora_fuente = n.hora_fuente || n.fuente;
  hermandades.push(h); HBY.set(slug, h);
}

// ---------- acompañamiento musical (Málaga Musical + noticias verificadas) ----------
// Lista de 2026 y novedades de 2027 importadas con tools/importar-malaga-musical.mjs, más acompañamientos
// confirmados por noticias (tools/sources/acompanamientos-noticias.json).
const MM_DIR = path.join(__dirname, 'sources');
// Una guía por capital: malaga-musical.json y <ciudad>-musica.json (tools/importar-*.mjs). Todas con el mismo esquema.
const MM_FILES = ['malaga-musical.json', ...fs.readdirSync(MM_DIR).filter((f) => f.endsWith('-musica.json'))].filter((f) => fs.existsSync(path.join(MM_DIR, f)));
const MN_FILE = path.join(__dirname, 'sources', 'acompanamientos-noticias.json');
const MNEWS = fs.existsSync(MN_FILE) ? JSON.parse(fs.readFileSync(MN_FILE, 'utf8')) : { items: [] };
{
  const HB = new Map(hermandades.map((h) => [h.slug, h]));
  const addBand = (b, h, rol, anio, fuente) => {
    if (b.es_banda === false) return;
    const key = (b.nombre + '|' + b.localidad).toLowerCase();
    if (!bandas.has(key)) bandas.set(key, { nombre: b.nombre, tipo: b.tipo, localidad: b.localidad, acompana: [] });
    const e = bandas.get(key);
    if (b.redes && b.redes.length) e.redes = [...new Set([...(e.redes || []), ...b.redes])];
    if (!e.acompana.some((a) => a.hermandad_slug === h.slug && a.rol === rol && a.anio === anio)) e.acompana.push({ hermandad: h.nombre, hermandad_slug: h.slug, ciudad: h.ciudad, rol, propia: false, anio, fuente });
  };
  const toPasos = (pasos) => pasos.map((p) => ({ paso: p.paso, bandas: p.bandas.map((b) => ({ nombre: b.nombre, localidad: b.es_banda === false ? '' : b.localidad, nota: b.nota || '', novedad: !!b.novedad, banda: b.es_banda !== false })) }));
  let MMAL = null;
  for (const mf of MM_FILES) {
    const MM = JSON.parse(fs.readFileSync(path.join(MM_DIR, mf), 'utf8'));
    if (mf === 'malaga-musical.json') MMAL = MM;
    const medio = String(MM.fuente || '').replace(/\s*\(.*$/, '');
    for (const c of MM.lista2026) {
      const h = c.slug && HB.get(c.slug); if (!h) continue;
      h.acompanamiento = { anio: MM.anio_lista, fuente: MM.url_lista, medio, pasos: toPasos(c.pasos) };
      for (const p of c.pasos) for (const b of p.bandas) addBand(b, h, p.paso, 2026, MM.url_lista);
    }
    for (const c of MM.novedades2027) {
      const h = c.slug && HB.get(c.slug); if (!h) continue;
      h.acompanamiento = h.acompanamiento || { anio: MM.anio_lista, fuente: MM.url_lista, medio, pasos: [] };
      h.acompanamiento.novedades2027 = { fuente: MM.url_novedades, pasos: toPasos(c.pasos) };
      for (const p of c.pasos) for (const b of p.bandas) addBand(b, h, p.paso, 2027, MM.url_novedades);
    }
  }
  const MM = MMAL || { anio_lista: 2026, url_lista: '', url_novedades: '' };
  for (const n of MNEWS.items) {
    const h = HB.get(n.slug); if (!h) continue;
    h.acompanamiento = h.acompanamiento || { anio: MM.anio_lista, fuente: MM.url_lista, pasos: [] };
    const ent = { paso: n.paso, bandas: [{ nombre: n.banda.nombre, localidad: n.banda.localidad, nota: 'Anunciado ' + n.fecha, novedad: n.anio > 2026, banda: true, fuente: n.fuente, medio: n.medio }] };
    if (n.anio <= 2026) h.acompanamiento.pasos.push(ent);
    else (h.acompanamiento.novedades2027 = h.acompanamiento.novedades2027 || { fuente: MM.url_novedades, pasos: [] }).pasos.push(ent);
    if (false) h.acompanamiento.novedades2027.pasos.push({ paso: n.paso, bandas: [{ nombre: n.banda.nombre, localidad: n.banda.localidad, nota: 'Anunciado ' + n.fecha, novedad: true, banda: true, fuente: n.fuente, medio: n.medio }] });
    addBand({ ...n.banda, es_banda: true }, h, n.paso, n.anio, n.fuente);
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
  bio: (IMAG_INFO[im.nombre] || {}).bio || '', ...((IMAG_INFO[im.nombre] || {}).fuentes ? { fuente_url: IMAG_INFO[im.nombre].fuentes[0], fuentes: IMAG_INFO[im.nombre].fuentes } : {}), ciudades: [...im.ciudades], obras: im.obras,
})).sort((a, b) => b.obras.length - a.obras.length || a.nombre.localeCompare(b.nombre, 'es'));

const norm0 = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
// Localidad buscada aparte, con su fuente, para las bandas que la guía de acompañamiento da sin pueblo (tools/sources/bandas-localidad.json).
// Su dirección cambia (lleva la localidad): la vieja va a tools/sources/bandas-redirecciones.json.
const LOCB = (() => { const f = path.join(__dirname, 'sources', 'bandas-localidad.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).bandas || {} : {}; })();
const SIN_LOC = new Set(); // nombres que tenían la localidad vacía en la guía (para enlazar sus acompañamientos)
for (const b of bandas.values()) { const x = !b.localidad && LOCB[norm0(b.nombre)]; if (x && x.localidad) { SIN_LOC.add(b.nombre); b.localidad = x.localidad; b.localidad_fuente = x.fuente; } }
const bandOut = [...bandas.values()].map((b) => {
  const base = slugify(b.nombre + (b.localidad ? ' ' + b.localidad : ''));
  const loc = norm0(b.localidad); const LOCS = JSON.parse(fs.readFileSync(path.join(__dirname, 'sources', 'localidades.json'), 'utf8'));
  const origen = (capitales.find((c) => norm0(c.nombre) === loc) || {}).slug || LOCS[loc] || '';
  return { ...b, slug: base, origen };
}).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
// Nombre con la localidad pegada al final y sin localidad («AM Nuestro Padre Jesús Despojado de Jaén», sin localidad) es la misma
// ficha que la que tiene ese nombre y esa localidad: pasa a su nombre, localidad y dirección (27-oct).
const ALIAS_BANDA = new Map(); const ALIAS_CLAVE = new Map(); // (nombre|localidad antiguos → dirección) // nombre antiguo → dirección de la ficha a la que se unió
// Solo las comprobadas a mano (cada nueva, con su redirección en tools/sources/bandas-redirecciones.json); el comprobador avisa de las demás
// (27-oct) Las 8 de Almería y Granada: el nombre oficial que dan sus fuentes de acompañamiento (cofradiasdealmeria.es…) lleva el pueblo,
// el mismo que la localidad de la otra ficha: es la misma banda.
const UNIR_BANDAS = new Set(['agrupacion musical nuestro padre jesus despojado de jaen', 'agrupacion musical dulce nombre de jesus de granada', 'agrupacion musical maria santisima de la cabeza de exfiliana', 'agrupacion musical nuestra senora del mar de huercal de almeria', 'banda de cornetas y tambores monte calvario de martos', 'banda de cornetas y tambores santa cruz de almeria', 'banda de musica los iris de instincion', 'banda de musica santa cecilia de sorbas', 'capilla musical sacra redemptio de almeria']);
{ const k = (n, l) => norm0(n) + '|' + norm0(l); const hay = new Map(bandOut.map((b) => [k(b.nombre, b.localidad), b]));
  for (const b of bandOut) { if (b.localidad || !UNIR_BANDAS.has(norm0(b.nombre))) continue; const m = b.nombre.match(/^(.*)\s+de\s+(\S.*)$/); if (!m) continue; const otra = hay.get(k(m[1], m[2])); if (otra && otra !== b) { ALIAS_BANDA.set(b.nombre.toLowerCase(), otra.slug); b.nombre = otra.nombre; b.localidad = otra.localidad; b.slug = otra.slug; b.origen = otra.origen; } } }
// La misma banda (mismo nombre y misma localidad) que acompaña en varias capitales es una sola ficha: se juntan sus
// acompañamientos. Antes salía partida en dos («…-jaen» y «…-jaen-2», la Agrupación Musical Jesús Despojado).
{ const porSlug = new Map(); for (const b of bandOut) { const p = porSlug.get(b.slug); if (p) { p.acompana.push(...(b.acompana || [])); if (b.nombre !== p.nombre) { ALIAS_BANDA.set(b.nombre.toLowerCase(), p.slug); ALIAS_CLAVE.set((b.nombre + '|' + b.localidad).toLowerCase(), p.slug); } } else porSlug.set(b.slug, b); } bandOut.splice(0, bandOut.length, ...porSlug.values()); }
// el acompañamiento de la guía sigue nombrándolas sin localidad: se enlaza con su ficha nueva
for (const n of SIN_LOC) { const b = bandOut.find((x) => x.nombre === n && x.localidad_fuente); if (b) ALIAS_CLAVE.set((n + '|').toLowerCase(), b.slug); }
for (const b of bandOut) { const vis = new Map(); for (const a of b.acompana || []) { const kk = a.hermandad_slug + '|' + (a.rol || ''); const p = vis.get(kk); if (!p || (!p.fuente && a.fuente)) vis.set(kk, a); } b.acompana = [...vis.values()]; }
// ids de banda por hermandad
const bandBySlugName = new Map(bandOut.map((b) => [b.nombre.toLowerCase(), b.slug]));
for (const [n, sl] of ALIAS_BANDA) bandBySlugName.set(n, sl);
for (const h of hermandades) h.bandas_slugs = h.bandas.map((n) => bandBySlugName.get(n.toLowerCase())).filter(Boolean);

// enlazar el acompañamiento de cada hermandad con la ficha de cada banda
const bandKey = new Map(bandOut.map((b) => [(b.nombre + '|' + b.localidad).toLowerCase(), b.slug]));
for (const [k, sl] of ALIAS_CLAVE) if (!bandKey.has(k)) bandKey.set(k, sl);
for (const h of hermandades) if (h.acompanamiento) {
  const link = (pasos) => pasos.forEach((p) => p.bandas.forEach((b) => { if (b.banda) b.slug = bandKey.get((b.nombre + '|' + b.localidad).toLowerCase()) || ''; }));
  link(h.acompanamiento.pasos); if (h.acompanamiento.novedades2027) link(h.acompanamiento.novedades2027.pasos);
  const sl = new Set(h.bandas_slugs || []), nm = new Set(h.bandas || []);
  for (const p of h.acompanamiento.pasos) for (const b of p.bandas) if (b.slug) { sl.add(b.slug); nm.add(b.nombre); }
  h.bandas_slugs = [...sl]; h.bandas = [...nm];
}

// ---------- complementos verificados (tools/sources/complementos.json) ----------
// Datos buscados en fuentes abiertas y revisados a mano. Solo rellenan campos vacíos; las correcciones de día
// y las nuevas cofradías de vísperas llevan su fuente. Ver tools/buscar-complementos.mjs.
for (const im of imgOut) {
  const x = (COMP.imagineros || {})[im.nombre];
  if (!x || x.rechazado || im.bio) continue;
  // Biografía breve redactada desde Wikipedia, la RAH u otra fuente (revisada aparte), con su fuente
  if (x.bio_relleno && x.bio_relleno.valor) { im.bio = x.bio_relleno.valor; if (!im.vida && x.bio_relleno.vida) im.vida = x.bio_relleno.vida; im.fuente_url = x.bio_relleno.fuentes[0]; continue; }
  const oficio = /imaginer/i.test(x.descripcion) ? 'Escultor e imaginero' : /escultor/i.test(x.descripcion) ? 'Escultor' : 'Escultor';
  if (!im.vida) im.vida = x.nacimiento && x.muerte ? `${x.nacimiento}–${x.muerte}` : x.nacimiento ? `n. ${x.nacimiento}` : '';
  im.bio = `${oficio}${x.lugar ? ' nacido en ' + x.lugar : ''}${x.nacimiento ? (x.muerte ? ` (${x.nacimiento}–${x.muerte})` : ` en ${x.nacimiento}`) : ''}.`.replace(' nacido en ' + x.lugar + ' en ', ' nacido en ' + x.lugar + ' en ');
  im.fuente_url = x.wikipedia || x.wikidata;
}
for (const [slug, x] of Object.entries(COMP.hermandades || {})) {
  const h = HBY.get(slug); if (!h) continue;
  if (!h.web && x.web_oficial && x.web_oficial.url) { h.web = x.web_oficial.url; h.web_fuente = x.web_oficial.fuente; }
  const w = x.sevilla_wd;
  if (w) { if (!h.web && w.web) { h.web = w.web; h.web_fuente = w.wikidata; } if (!h.fundacion && w.fundacion) h.fundacion = w.fundacion; if (!h.nombre_oficial && w.nombre_oficial) h.nombre_oficial = w.nombre_oficial; }
  // La web oficial cambió de direcciones (p. ej. la Agrupación de Córdoba en 2026): se enlaza la ficha vigente
  if (x.fuente_actual && x.fuente_actual.url) h.fuente_url = x.fuente_actual.url;
  // Huecos rellenados a mano desde la ficha oficial o Wikipedia (tools/leer-fichas.mjs): resumen propio con su fuente.
  for (const [k, v] of Object.entries(x.relleno || {})) {
    if (!v || !v.valor || (h[k] && String(h[k]).trim())) continue;
    h[k] = v.valor; (h.relleno_fuentes = h.relleno_fuentes || {})[k] = v.fuente;
  }
}
// Una «web oficial» compartida por más de dos hermandades no es de ninguna (p. ej. el enlace del pie de una federación): se descarta.
{
  const cuenta = {}; for (const h of hermandades) if (h.web) { const k = h.web.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''); cuenta[k] = (cuenta[k] || 0) + 1; }
  for (const h of hermandades) if (h.web && cuenta[h.web.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')] > 2) { h.web = ''; delete h.web_fuente; }
}
// Hora de salida del último itinerario oficial leído (tools/itinerarios), si la ficha no la trae
{
  const ITF = path.join(__dirname, 'sources', 'itinerarios-2026.json');
  if (fs.existsSync(ITF)) {
    const IT = JSON.parse(fs.readFileSync(ITF, 'utf8')).hermandades;
    for (const h of hermandades) {
      const e = IT[h.slug]; if (!e || h.hora_fuente) continue;
      const pts = e.tramos['cruz de guía'] || e.tramos.paso || Object.values(e.tramos)[0] || [];
      const s = pts.find((p) => p.hora && /salida/i.test(p.lugar)) || pts.find((p) => p.hora);
      // Sin hora, la toma; con hora sin fuente, solo la respalda si coincide con la salida del itinerario
      if (s && s === pts.find((p) => p.hora) && /salida/i.test(s.lugar) && (!h.hora || h.hora === s.hora)) { h.hora = s.hora; h.hora_fuente = e.fuente; }
    }
  }
}
// Lo mismo con los recorridos geolocalizados (site/data/recorridos/<ciudad>.json): la hora del punto «SALIDA» del itinerario oficial.
{
  const RD = path.join(__dirname, '..', 'site', 'data', 'recorridos');
  if (fs.existsSync(RD)) {
    const REC = {};
    for (const f of fs.readdirSync(RD)) { try { Object.assign(REC, JSON.parse(fs.readFileSync(path.join(RD, f), 'utf8')).hermandades); } catch (e) { } }
    for (const h of hermandades) {
      const e = REC[h.slug]; if (!e || h.hora) continue;
      const pts = e.tramos['cruz de guía'] || e.tramos.paso || Object.values(e.tramos)[0] || [];
      const s = pts[0];
      const t = s && (s.hora || s.fila);
      if (t && /^\d{1,2}:\d{2}$/.test(t) && /^\(?(salida|sale)/i.test(s.lugar || '')) { h.hora = t; h.hora_fuente = e.fuente; }
    }
  }
}
// En las vísperas el orden de paso sigue la hora de salida publicada.
const mins = (t) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); return m ? +m[1] * 60 + +m[2] : null; };
for (const dia of ['Viernes de Dolores', 'Sábado de Pasión']) for (const ciudad of new Set(hermandades.map((h) => h.ciudad))) {
  const list = hermandades.filter((h) => h.ciudad === ciudad && h.dia === dia);
  // solo donde hay cofradías de vísperas añadidas; las que no tienen hora confirmada van al final
  if (list.some((h) => h.visperas)) list.sort((x, y) => (mins(x.hora) ?? 9999) - (mins(y.hora) ?? 9999)).forEach((h, i) => { h.orden = i + 1; });
}
// Marchas dedicadas según la sección de marchas del artículo de Wikipedia de cada hermandad (tools/importar-marchas-wikipedia.mjs)
// y, para Málaga, del listado del foro de Patrimonio Musical (tools/importar-marchas-malaga.mjs)
for (const f of ['marchas-hermandades-wikipedia.json', 'marchas-malaga.json']) {
  const WM_FILE = path.join(__dirname, 'sources', f);
  if (!fs.existsSync(WM_FILE)) continue;
  const WM = JSON.parse(fs.readFileSync(WM_FILE, 'utf8'));
  // Un mismo artículo emparejado con varias hermandades (búsqueda en Wikipedia demasiado laxa: «Dolores de San Juan» → artículo
  // de los Dolores del Puente) solo vale para la que tiene todas sus palabras propias en el título del artículo.
  const porUrl = {}; for (const [s, v] of Object.entries(WM)) if (v && v.fuente_url) (porUrl[v.fuente_url] ||= []).push(s);
  const propias = (h) => norm0(h.nombre).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length >= 4 && !['hermandad', 'cofradia', 'nuestra', 'nuestro', 'senora', 'santisimo', 'santisima', 'maria', 'jesus', 'cristo'].includes(w));
  const encaja = (h, url) => { const t = norm0(decodeURIComponent(url.split('/wiki/')[1] || '')).replace(/_/g, ' '); return propias(h).every((w) => t.includes(w)); };
  for (const h of hermandades) {
    const wm = WM[h.slug];
    if (wm && /wikipedia\.org\/wiki\//.test(wm.fuente_url || '') && porUrl[wm.fuente_url].length > 1 && !encaja(h, wm.fuente_url)) { if ((wm.marchas || []).length) console.warn('Marchas descartadas (artículo de otra hermandad):', h.slug, '←', decodeURIComponent(wm.fuente_url)); continue; }
    if (wm && wm.marchas && wm.marchas.length && !(h.marchas || []).length) { h.marchas = wm.marchas.map((m) => ({ titulo: m.titulo, autor: m.autor, anio: m.anio || '', tipo: '' })); h.marchas_fuente = wm.fuente_url; }
  }
}
// Correcciones de ficha con fuente (tools/sources/fichas-correcciones.json): mandan sobre la ficha original y guardan su fuente
{
  const f = path.join(__dirname, 'sources', 'fichas-correcciones.json');
  const FC = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).fichas : {};
  for (const [slug, campos] of Object.entries(FC)) {
    const h = hermandades.find((x) => x.slug === slug); if (!h) { console.warn('Corrección de una ficha que no está:', slug); continue; }
    for (const [campo, c] of Object.entries(campos)) {
      if (campo === 'titulares_renombrar') { for (const [viejo, n] of Object.entries(c)) { const t = h.titulares.find((x) => x.nombre === viejo); if (t) { t.nombre = n.nombre; t.nombre_fuente = n.fuente; } } continue; }
      if (campo === 'titulares') { if (!h.titulares.length) { h.titulares = c.valor.map((n) => ({ nombre: n, autor: '', imaginero: '', atrib: false, nombre_fuente: c.fuente })); } continue; }
      h[campo] = c.valor;
      if (c.fuente && campo !== 'fuente_url') (h.relleno_fuentes = h.relleno_fuentes || {})[campo] = c.fuente;
    }
  }
}
// Orden oficial de paso (tools/sources/orden-paso.json), con la hora de salida y la de carrera oficial. Va después de las correcciones de
// ficha, que pueden cambiar el día. Las que no están en la lista de su jornada quedan detrás. Sin orden oficial, el de la ficha; en las
// vísperas no hay carrera oficial: por hora de salida. El orden queda sin repetidos (1, 2, 3…) en cada jornada.
{
  const f = path.join(__dirname, 'sources', 'orden-paso.json');
  const OP = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).jornadas : {};
  const porJ = new Map(); for (const h of hermandades) { const k = h.ciudad + '|' + h.dia; (porJ.get(k) || porJ.set(k, []).get(k)).push(h); }
  for (const [k, l] of porJ) {
    const of = OP[k];
    if (of) {
      for (const e of of.orden) if (!l.some((h) => h.slug === e.hermandad)) console.warn('orden-paso: no está en', k, e.hermandad);
      for (const h of l) {
        const i = of.orden.findIndex((e) => e.hermandad === h.slug);
        h.orden = i >= 0 ? i + 1 : 1000 + h.orden;
        if (i < 0) continue;
        const e = of.orden[i];
        if (e.salida) { h.hora = e.salida; h.hora_fuente = of.fuente; }
        if (e.carrera) { h.hora_carrera = e.carrera; h.lugar_carrera = of.carrera; h.carrera_fuente = of.fuente; }
      }
    } else if (/^(Viernes de Dolores|Sábado de Pasión)$/.test(k.split('|')[1])) {
      l.sort((a, b) => (mins(a.hora) ?? 9999) - (mins(b.hora) ?? 9999)).forEach((h, i) => { h.orden = i + 1; });
    }
    l.sort((a, b) => a.orden - b.orden).forEach((h, i) => { h.orden = i + 1; });
  }
}
const out = { version: 1, generado: new Date().toISOString(), dias_orden: DAY_ORDER, capitales, hermandades, imagineros: imgOut, bandas: bandOut };
const dest = path.join(__dirname, '..', 'portal-cofrade', 'data');
fs.mkdirSync(dest, { recursive: true });
fs.writeFileSync(process.env.PORTAL_OUT || path.join(dest, 'portal.json'), JSON.stringify(out)); // PORTAL_OUT: para comprobar sin tocar el publicado (tools/comprobar-origen.mjs)
console.log('capitales', capitales.length, 'hermandades', hermandades.length, 'imagineros', imgOut.length, 'bandas', bandOut.length);
console.log('imagineros top:', imgOut.slice(0, 12).map((i) => i.nombre + '(' + i.obras.length + ')').join(', '));
console.log('imagineros con 1 obra:', imgOut.filter((i) => i.obras.length === 1).length);
console.log('BANDAS:\n' + bandOut.map((b) => `${b.nombre} [${b.tipo}] ${b.localidad} -> ${b.acompana.map((a) => a.hermandad + '/' + a.ciudad).join('; ')}`).join('\n'));
