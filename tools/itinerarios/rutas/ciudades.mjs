// Ocho Capitales · rutas: lo que cambia de una capital a otra. Todo lo demás (emparejar, evaluar, editor) es común.
// Cada sesión de capital añade o ajusta SOLO su entrada. Campos (todos opcionales salvo «nombre»):
//   origen    [lat, lon] de la proyección local en metros. Si falta, el centro del callejero (cache/osm-<capital>.json).
//   marcas    expresión regular (sobre el texto normalizado: minúsculas, sin acentos) de los elementos de la lista que NO son
//             calles sino marcas del recorrido (tribuna, carrera oficial…): se dibujan como hito en la calle siguiente.
//   regreso   expresión regular del primer elemento del regreso (si la lista no trae «regreso_desde»).
//   catedral  estación de penitencia por dentro de un templo sin calle: { texto: regex, entra: nodo OSM, sale: nodo OSM, nombre }.
export const CIUDADES = {
  malaga: {
    nombre: 'Málaga',
    origen: [36.7213, -4.4214],
    marcas: /^(tribuna principal|torre sur|s i c b|sicb|estacion de penitencia|patio de los naranjos|catedral)/,
    regreso: /^(torre sur|estacion de penitencia|patio de los naranjos|s i c b|sicb|catedral)/,
    // Postigo de los Abades → Patio de los Naranjos (calle Císter): las mismas puertas que usaba reconstruir-malaga.mjs
    catedral: { texto: /^(s i c b|sicb|estacion de penitencia|patio de los naranjos)/, entra: 8280808444, sale: 2834229789, nombre: 'de la puerta de Postigo de los Abades a la del Patio de los Naranjos' },
  },
  sevilla: { nombre: 'Sevilla' },
  cordoba: {
    nombre: 'Córdoba',
    // «ENTRADA C.O.» y «SALIDA C.O.» de la rejilla oficial: marcas de la carrera oficial, no calles
    marcas: /^(entrada c o|salida c o|estacion en)\b/, // y «Estación en la Parroquia de Nuestra Señora de Fátima» (La O): parada, no calle
    regreso: /^salida c o\b/,
    // Torrijos → puerta del Perdón (Patio de los Naranjos) → Catedral por dentro → puerta de Santa Catalina (Magistral González
    // Francés). Las que salen otra vez por el Perdón lo llevan en su lista («catedral»).
    catedral: { texto: /^(puerta del perdon|puerta (de )?(las )?cofradias|interior s i c|patio (de los )?naranjos)/, entra: 11613100948, sale: 3151300073, nombre: 'de la puerta del Perdón a la de Santa Catalina, por el Patio de los Naranjos y la Catedral' },
  },
  granada: { nombre: 'Granada' },
  // La estación de penitencia es una marca; la lista trae «regreso_desde» (listas/cadiz.json). Cuando el itinerario sigue
  // por «Arquitecto Acero» (casi todas), se entra por la puerta principal (Plaza de la Catedral) y se sale por la de
  // Arquitecto Acero: en 2025 se hizo al revés «de forma excepcional» por el Año Jubilar (planomato.com, Nazareno de la
  // Obediencia 2025). Esa puerta no está en OSM: punto en la fachada que da a la calle (aproximado). lista-cadiz.mjs solo
  // escribe «Estación de Penitencia en la S.I.C.» en esos casos; en los demás, «… en la Catedral» (marca, sin línea por dentro).
  cadiz: {
    nombre: 'Cádiz',
    marcas: /^estacion de penitencia/,
    // quitar idas y vueltas cortas de GraphHopper sobre la calzada paralela (emparejar.mjs; revisión independiente del 2026-10-26)
    sinBucles: true,
    catedral: { texto: /^estacion de penitencia en la s i c$/, entra: 7063298453, sale: { id: 'puerta de Arquitecto Acero, punto aproximado en la calle ante la fachada', lat: 36.52905, lon: -6.295776 }, nombre: 'de la puerta principal (Plaza de la Catedral) a la de Arquitecto Acero' },
  },
  huelva: { nombre: 'Huelva' },
  jaen: { nombre: 'Jaén' },
  almeria: { nombre: 'Almería' },
};
