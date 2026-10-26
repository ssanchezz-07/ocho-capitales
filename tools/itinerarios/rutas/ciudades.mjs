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
    marcas: /^(entrada c o|salida c o)\b/,
    regreso: /^salida c o\b/,
    // Torrijos → puerta del Perdón (Patio de los Naranjos) → Catedral por dentro → puerta de Santa Catalina (Magistral González
    // Francés). Las que salen otra vez por el Perdón lo llevan en su lista («catedral»).
    catedral: { texto: /^(puerta del perdon|puerta (de )?(las )?cofradias|interior s i c|patio (de los )?naranjos)/, entra: 11613100948, sale: 3151300073, nombre: 'de la puerta del Perdón a la de Santa Catalina, por el Patio de los Naranjos y la Catedral' },
  },
  granada: { nombre: 'Granada' },
  cadiz: { nombre: 'Cádiz' },
  huelva: { nombre: 'Huelva' },
  jaen: { nombre: 'Jaén' },
  almeria: { nombre: 'Almería' },
};
