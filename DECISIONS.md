# Decisiones de diseño y técnicas

## 2026-10-26 · Fondo del plano fiel a la ciudad (Málaga, Córdoba y Cádiz)
Pablo: «completar Málaga, Cádiz y Córdoba… con su mapa mejorado y fiel». Los recorridos ya se trazan sobre la red completa de OSM (GraphHopper), pero el fondo eran calles simplificadas: un recorrido por un callejón o una plaza que el fondo no dibujaba parecía cruzar manzanas.
- **Datos: el mismo extracto que los recorridos.** `tools/itinerarios/fondo-pbf.mjs` lee `C:\Users\pablo\Herramientas-IA\graphhopper\andalucia-latest.osm.pbf` (Geofabrik, 26-oct), el mismo con el que GraphHopper traza los recorridos. Así fondo y recorridos coinciden al metro.
  - Lo lee un lector propio, sin dependencias y sin modificar el archivo: lo usa el servidor de GraphHopper.
  - Da el mismo formato que antes en `cache/` (fuera de git).
  - Las descargas de Overpass (`fondo-osm.mjs`, primera versión) quedan como `cache/overpass-*.json`. No se usan: el `.pbf` tiene todas las capas.
- **Primera versión (descartada):** `tools/itinerarios/fondo-osm.mjs <ciudad>` descargaba de Overpass (OSM, ODbL, con permiso de Pablo):
  - en el recuadro de los recorridos: todas las vías (también peatonales, escaleras y callejones), plazas, agua, ríos, costa, playas, parques, templos y casas hermandad;
  - aparte, los edificios a 40 m de algún recorrido.
- **Fondo:** `plano.mjs` suma esas vías (los callejones conservan sus quiebros, con una tolerancia de 1,5 m) y añade las capas.
  - Debajo de las calles: agua y ríos (Guadalquivir y Guadalmedina), costa, playas, parques y plazas como superficie.
  - Encima: templos y casas hermandad como edificios, con galón de oro.
  - Fuera los jardincillos y las plazoletas diminutas (no ayudan a situarse y pesaban).
  - Lo dibujan «En la calle» (`calle.js`) y el plano de la portada (`plano.js`).
- **Peso con gzip:** Málaga 201 KB, Córdoba 277 KB y Cádiz 70 KB. El service worker los guarda tras la primera visita.
- **Comprobación de fidelidad** (`tools/itinerarios/comprobar-fondo.mjs <ciudad>` → `comprobacion-fondo-<ciudad>.json`): recorre cada recorrido cada 3 m y avisa en dos casos:
  - el tramo atraviesa un edificio sin vía por dentro;
  - el tramo pasa a más de 12 m de cualquier vía o plaza.
  - Templos, soportales, arcos con paso (la Puerta de Tierra) y la salida y la entrada no cuentan.
  - **Resultado:**
    - Córdoba: 42 de 42 recorridos limpios.
    - Málaga: 45 de 46 (un aviso en la plaza de Spínola).
    - Cádiz: 4 de 33. **Un mismo tramo de la calle Nueva, compartido por 29 recorridos, cruza en diagonal entre manzanas**: es un fallo del trazado, no del fondo, y se pasa a la sesión de rutas de Cádiz con las coordenadas del informe.

## 2026-10-26 · Recorridos con el color del hábito de su hermandad
Pablo: «que las rutas se asemejaran al color habitual de su hermandad, sin perder la línea de diseño».
- **De dónde sale el color:** `tools/colores-habito.mjs` lee el texto de `tools/sources/habitos.json`, donde cada hermandad tiene su fuente oficial, y escribe `site/data/colores-habito.json` con el color, su nombre y la fuente. Nada se escribe a mano en el código.
  - Manda el color del capirote; si es blanco o negro, el de la túnica; si los dos son neutros, ese neutro. Los botones o el cíngulo no cuentan (antes Salutación salía morada por sus botones).
  - «Color vino» cuenta como burdeos.
- **Cobertura: 99 de 232 hermandades.** Las otras 133 tienen el texto del hábito vacío, y Sevilla no está en el archivo. Esas conservan el color de la paleta: no se inventa. Pendiente: buscar sus hábitos en webs oficiales o en la guía de cada capital, con la fuente, y volver a ejecutar la herramienta.
- **Gama común:** cada color del hábito se traduce a un tono parecido en luz y saturación, que convive con el terciopelo y el oro. Por ejemplo:
  - morado #b78ee3, burdeos #d4677f, rojo #e8735a, azul #6f9de8, verde #62c08a;
  - el negro pasa a pizarra (#a9a3ba) y el blanco a marfil (#efe4c8).
  - Todos los tonos contrastan al menos 5,3:1 con el fondo del plano.
  - Si dos hermandades de la misma jornada caen en el mismo tono (muchas son moradas o negras), las siguientes se separan en luz y en algo de tono (`variar()` en `calle.js` y en `plano.js`).
- **Igual que antes:** ida continua y regreso discontinuo.
- **En la ficha de «En la calle»** hay una muestra del color con su nombre y la fuente, por ejemplo «su hábito, burdeos (fuente)».
- También se usa en el plano de la portada.

## 2026-10-26 · Laboratorio de rutas: continuidad + GraphHopper (propuesta, sin adoptar)
_Detalle y cifras en `LABORATORIO-RUTAS.md`. Pablo decide si se adopta._

**Elegido para el laboratorio**
- **GraphHopper 11.1 en local, sin Docker** (`C:\Users\pablo\Herramientas-IA\graphhopper\`), con un solo grafo de Andalucía (Geofabrik) para las 8 capitales. Sin CH ni LM, porque las rutas son cortas y así funcionan `pass_through` y los ajustes por petición.
- **Perfil «procesión»:** autovías y vías rápidas fuera; escaleras casi prohibidas (un trono no baja escaleras).
- **Emparejamiento por continuidad (Viterbi):** las candidatas por nombre aproximado se agrupan en piezas conexas, y se elige la cadena en la que cada calle toca a la siguiente. Los huecos cuestan caro; una homónima lejana se descarta con aviso.
- **Enlace recto anotado (3-40 m)** donde OSM no une dos calles seguidas de la lista. Es la misma idea que el método actual (≤ 35 m), pero visible en el informe.
- **Nominatim solo como referencia** de plazas sin calle en OSM: es aproximado y no obliga al trazado.
- **Correcciones de Pablo** en `tools/itinerarios/laboratorio/correcciones-malaga.json`, con fuente obligatoria. El proceso las respeta al regenerar.
- **Editor local** con servidor Node y plano SVG propio. No se publica.
- **Evaluador común** que compara nombres de forma exacta, para no favorecer al método nuevo.

**Descartado**
- **Docker:** no hace falta, porque ya hay Java 21.
- **Leaflet o teselas para el editor:** se mantiene la decisión del 17-oct de plano propio también en la herramienta interna.
- **Puntos de Nominatim como paso obligatorio:** producían picos de ida y vuelta.
- **Dejar `pass_through` siempre activo:** en las medias vueltas reales (calle · plaza · misma calle) GraphHopper daba un rodeo. Ahí se parte la petición para dejar girar.

## 2026-10-25 · Marchas: modelo único y verificación de dedicatorias (sesión de marchas)
**Elegido**
- **Un solo modelo** (`tools/sources/marchas.json`, generado por `tools/unificar-marchas.mjs`): cada marcha con título, compositor, año, formación, vídeo, dedicatoria (hermandad, titular, ciudad, texto) y, **por campo**, las fuentes que lo dan con su URL. `build.mjs` y la base SQLite solo leen ese fichero; las marchas de cada hermandad ya no salen de `portal.json`.
- **Estados de la dedicatoria:** «contrastada» (dos fuentes fiables de sitios distintos), «dedicada» (una fiable) y «sin verificar» (solo el foro de 2008 o Wikipedia). Fiables: ficha oficial de la Federación de Granada, Patrimonio Musical (base de datos), la ficha de Marchas de Procesión (campo DEDICATORIA) y la revisión a mano con fuente abierta (`tools/sources/marchas-revision.json`). Wikipedia queda como pista, según `ORDENES-CORRECCION.md`.
- **Se retira el enlace** marcha → hermandad cuando una fuente fiable la dedica a otra hermandad u otra ciudad y nada fiable la confirma (con motivo y enlace en `retiradas`). Si la fuente fiable nombra otra hermandad del portal, la marcha pasa a esa hermandad (p. ej. «Lágrimas y Favores» estaba en Fusionadas por el foro; Patrimonio Musical la dedica a Lágrimas y Favores).
- **Marchas del catálogo ligadas por su dedicatoria** (de 88 a 209 hermandades): solo si la dedicatoria nombra la capital (o Patrimonio Musical la sitúa allí), ningún otro municipio, y una sola hermandad del portal por su nombre («Hdad. de la Carretería») o por una frase de titular específica. Una advocación de una sola palabra corriente (Mercedes, Rosario, Ángeles, Esperanza…) no basta: puede ser una hermandad de gloria que no está en el portal. Una dedicatoria a la Virgen solo casa con un titular mariano (la «Virgen del Buen Fin» es de la Lanzada, no del Cristo del Buen Fin). «En memoria de…» no cuenta como dedicatoria a la hermandad.
- **Mismo compositor:** un apellido poco corriente en común, dos apellidos, o un apellido corriente más el mismo nombre de pila. Con «un apellido cualquiera» «La Soledad» de Eloy García López casaba con siete fichas distintas.
- **Año que no coincide** (respuesta de Pablo: «solo la oficial»): manda la fuente oficial; sin ella, el de las fuentes fiables si coinciden (Wikipedia y el foro no cuentan); si dos fiables discrepan, el año queda en blanco. La discrepancia se guarda en el modelo, no se enseña.
- **Vídeos borrados de YouTube** se marcan al importar (`caido`) y la web no los enlaza. Antes el importador los confundía con el límite 429 y se paraba.
- **Direcciones:** se repite el cálculo antiguo de los slugs para que ninguna URL publicada cambie; las de duplicados que ahora se unen redirigen (las 7.659 del sitemap, comprobadas).
- **Buscador:** las marchas salen de `search-index.json` (2,19 MB → 0,43 MB) a `search-marchas.json`, que se pide al escribir 3 letras.
- **Patrimonio Musical** sigue siendo de uso interno: se guarda solo el enlace a cada ficha, no sus textos.

- **(2026-10-26) Mismo compositor, más estricto:** si cada nombre tiene un apellido que el otro no tiene, o los nombres de pila completos son distintos, son personas distintas («Manuel López Farfán» ≠ «Manuel Miguel López Martínez»; Perfecto Artola Prats ≠ su hijo Desiderio Artola Tena). Una errata de una letra en un apellido largo no separa (Albero/Abero).
- **(2026-10-26) La misma obra en dos fichas** (tras corregir un título con su fuente) se une: título casi literal, mismo compositor, formación compatible y sin dos dedicatorias distintas. La dirección de la que desaparece redirige.
- **(2026-10-26) Revisión a mano** (`tools/sources/marchas-revision.json`): verificadores con cita literal guardada en local y revisión mía de cada veredicto. No se aplicó lo que la fuente no dice expresamente («inspirada en» no es «dedicada a») ni lo que podría ser otra obra con el mismo nombre. Un sitio web cuenta una sola vez: una revisión hecha con la ficha de Patrimonio Musical no convierte en «contrastada» una marcha que ya tenía Patrimonio Musical.
- **(2026-10-26) Años:** además de la fuente oficial, se acepta el año de una fuente fiable cuando una grabación fechada hace imposible el otro (p. ej. 1982 frente a 1985).
- **BNE:** se lee entero el tema «Marchas procesionales» (1.643 registros; Pablo autorizó el 2026-10-26 leerlo imitando a Chrome, a ritmo lento). Solo cuentan las **partituras** (música impresa o manuscrita, 312) y el compositor sale del autor del registro: el resto son discos y recopilaciones, cuyo subtítulo o banda se colaba como compositor.
- **(2026-10-26) Fuente que solo desambigua** (`solo_desambigua` en la revisión): cuando la dedicatoria la da una base fiable («Virgen de la Amargura de Jaén») y un blog cofrade la pone en la lista de una cofradía, el blog solo sirve para elegir la hermandad; no suma como segunda fuente. La ficha lo enseña en «Hermandad».
- **(2026-10-26) Advocaciones marianas de gloria** (Candelaria, Paz, Estrella, Caridad, Merced…): no se ligan solo porque la guía oficial de Semana Santa tenga una sola hermandad con ellas (esas guías no incluyen las de gloria). Sí las de Pasión (Amargura, Angustias, un Cristo).
- **(2026-10-26) Dudosas de Sevilla, Málaga y Granada:** solo se ligan cuando la fuente nombra la hermandad (el campo «Dedicatoria Hdad.» de las fichas de Patrimonio Musical, la web de la hermandad o la Federación). Si solo nombra un titular, aunque sea único entre las candidatas, no se liga: en estas ciudades hay muchas glorias y parroquias con las mismas advocaciones. Excepción razonada: «Esperanza Coronada de Málaga» o el XXV aniversario de su coronación solo puede ser la Esperanza del Perchel.
- **(2026-10-26) Direcciones retiradas:** el modelo acumula en `redirecciones` toda dirección publicada que deja de existir; `build.mjs` la redirige a la misma obra o al listado.

**Descartado**
- Ligar por coincidencia de una palabra de titular («Esperanza», «Dolores»): ligaba marchas a la hermandad equivocada de la misma ciudad.
- Contar foro + base de Patrimonio Musical como «contrastada»: son el mismo sitio, así que cuenta como una sola fuente fiable.
- Añadir al portal las marchas que solo están en Patrimonio Musical: se usan para verificar y ligar, no se publican sus fichas.
## 2026-10-26 · Animaciones del mapa de la portada y dos variantes con más detalle
**Animaciones** (revisadas fotograma a fotograma y midiendo cuánto dura cada fotograma con Playwright):
- **Fallo que ya estaba en la web publicada:** el muelle que mece las banderas se volvía inestable con fotogramas lentos (un móvil cargado, menos de 30 por segundo). La escala se disparaba (1,69 → −0,26 → 2,98) y la bandera temblaba sin parar.
  - Ahora el muelle se calcula en pasos fijos de 8 ms y es estable a cualquier velocidad: tras pulsar va de 0,975 a 1 sin rebote.
- **Tirones al bajar a la ciudad y al mover la hora**, porque se repintaban miles de calles en cada fotograma:
  - el plano va en dos capas: la fija (calles y recorridos) y la que se mueve (cortejos y medallones);
  - fuera los filtros SVG: las sombras y el brillo se dibujan con trazos y círculos;
  - durante el vuelo de la cámara solo se dibujan las calles principales.
  - Resultado al mover la hora en Sevilla, en un navegador sin aceleración gráfica: de 29 a 71 fotogramas en el móvil y de 23 a 59 en el escritorio.
- **Orden:** primero el hilo llega a la capital (360 ms), luego Andalucía se acerca (820 ms) y el plano aparece hacia los 700 ms. La altura crece en 420 ms: es la única animación de una propiedad de maquetación, y se queda porque solo ocurre al bajar o subir y oculta el salto de la página.

**Elegido: «Bordado»** (Pablo, 26-oct), con sus tres cambios:
- **El cordón del borde, más fino** (3 px de hilo oscuro y 1,3 px de oro a puntadas): grueso saturaba el mapa.
- **En lugar del emblema, la catedral de cada ciudad bordada a puntadas.** La propuso Pablo. Son dibujos propios y esquemáticos: la Giralda con la nave, la Manquita con su torre sin acabar, la fachada de los tres arcos de Granada, la Mezquita-Catedral con el alminar, la cúpula de Cádiz entre dos torres, la Merced de Huelva, la catedral-fortaleza de Almería con almenas y la fachada renacentista de Jaén.
  - Cada catedral va junto a su punto, en el lado contrario a su nombre: si el nombre va debajo, la catedral va encima, y en Córdoba, que lleva el nombre encima, debajo.
  - En el móvil son algo más grandes.
- **Puntos pequeños**, como un nudo de oro (10 px; 7 px en el móvil). La zona para tocarlos sigue siendo de 44 px.
- Se quitaron el azulejo, los cirios y el interruptor `?mapa=`.

Las tres propuestas que se presentaron (ya retiradas, salvo el Bordado): **Mapa con carácter: tres diseños nuevos para que elija Pablo** (`?mapa=bordado`, `?mapa=azulejo` y `?mapa=cirios`). Pablo descartó «grabado» y «relieve» porque los veía «muy simples, sin gracia». Los nuevos salen del mundo cofrade y andaluz:
- **Bordado:**
  - cada provincia es un repostero de terciopelo, con su pelo;
  - el contorno lleva un cordón de oro torcido;
  - el emblema de su capital va bordado a puntadas en el centro (palio, campana, Alhambra, arcos de la Mezquita, horquilla, cinta, Alcazaba, cruz). Son dibujos propios, sin derechos de terceros;
  - los ríos son hilo de oro.
- **Azulejo:**
  - cada provincia alicatada con estrellas de ocho puntas en el color de su capital (es la estrella del sello del portal), con cuartos de rueda en cobalto y llagas de cal;
  - el nombre de cada capital va en una placa de azulejo, como los rótulos de las calles;
  - los ríos, en cobalto vidriado.
- **Cirios:**
  - Andalucía de noche, con cada capital encendida por un cirio de luz cálida;
  - la luz es fija, sin parpadeo (DESIGN.md: nada se mueve en bucle);
  - los ríos son hilos de plata.

Variantes anteriores (descartadas): **Mapa con más detalle: dos variantes para que elija Pablo.** Se ven en la portada con `?mapa=grabado` o `?mapa=relieve`; sin ese parámetro, el mapa de siempre. El parámetro se quita al elegir.
- **Datos:** ríos (Guadalquivir, Genil, Guadalimar y Guadiana Menor) y sierras (Sierra Morena y Sierra Nevada) de **Natural Earth 1:10m, dominio público** (https://www.naturalearthdata.com/; capas `ne_10m_rivers_lake_centerlines`, `ne_10m_rivers_europe` y `ne_10m_geography_regions_polys`, descargadas con permiso de Pablo).
  - `tools/generar-mapa-detalle.mjs` los proyecta igual que las provincias (`tools/generar-mapa.mjs`) y escribe `site/data/mapa-detalle.json` (3 KB).
  - Los emblemas de las capitales salen de nuestras propias colgaduras (`assets/plates`).
  - Los rótulos «Océano Atlántico» y «Mar Mediterráneo» van en Newsreader cursiva, que ya está en el sitio.
- **A · Grabado:**
  - rayado fino de grabado y montes dibujados como en los mapas antiguos;
  - ríos en tinta clara y fronteras punteadas en oro;
  - un medallón con el emblema de cada colgadura sobre su capital y su nombre al lado.
- **B · Relieve:**
  - luz suave desde el noroeste;
  - sierras como relieve difuminado, con luz y sombra;
  - ríos en oro con su halo, y el nombre de cada capital junto a su punto.
  - Mientras la cámara se acerca, el difuminado se desactiva para no frenar la animación.

## 2026-10-25 (noche) · RETOMAR AQUÍ: encargos nuevos de Pablo para la portada
**Hecho el 26-oct (commit `c78cf21`): los puntos 1 y 2.** Las láminas han vuelto tal cual. La portada mide lo que su contenido en Andalucía y crece a la pantalla al bajar a la ciudad (420 ms). Las banderas, el mapa y la invitación caben en cualquier pantalla. Los hilos solo aparecen al elegir, y la cámara arranca cuando el hilo ha llegado a la capital (360 ms). Capturas de antes y después en `capturas-portada/` (fuera de git). Siguen pendientes los puntos 3 a 5.

## 2026-10-25 · Portada inmersiva «Del mapa a la calle», Noticias con menos ruido y colgaduras sin repetir
Contexto: Pablo quiere que la web sea «vida, inmersión y facilidad de uso», y que no se parezca a Palio App (solo Málaga), que enseña lo mismo que ya teníamos (`MARKETING/analisis-copias.md`). Crítica de impeccable con dos revisiones independientes: 22/40; el detector dio 89 avisos en la portada y 43 en Noticias.

**Elegido (por Pablo, entre tres prototipos con datos reales)**
- **«Del mapa a la calle»:** en la portada solo están las banderas (colgaduras), el mapa de Andalucía y, debajo, la agenda. Al tocar una bandera, las demás se recogen hacia arriba; la elegida queda asomando como pestaña para volver. Su hilo se dibuja hasta la capital, Andalucía se acerca a ella y aparece el plano de su ciudad con los cortejos donde irían a esa hora: una sola cámara, sin cambiar de página.
  - El cielo del lienzo cambia con la hora: tarde dorada, noche de terciopelo, Madrugá azul y amanecer. Solo cambia cuando cambia la hora; nada se mueve en bucle.
  - Jornada con flechas y hora con deslizador. Por defecto: hoy, si es jornada. Si no, la próxima salida extraordinaria de los 45 días siguientes (ahora, la Pasión de Málaga el 14-nov). Si no, la jornada con más cofradías, a la hora con más cofradías en la calle.
  - «Entrar en la calle» y cada medallón llevan a `en-la-calle/<ciudad>/?dia=…&t=…&h=…`, a la misma jornada y hora; el medallón abre además su ficha. El plano viaja entre las dos páginas (`view-transition-name: oc-plano`).
  - `/#malaga` abre la portada ya en Málaga. El botón «atrás» del navegador y Escape vuelven a Andalucía, y el foco vuelve a la bandera.
- **El plano de la portada es `site/assets/plano.js`**: el mismo dibujo propio en SVG que `calle.js` (sin Leaflet ni teselas, decisión del 17-oct), pero solo para mirar. Se carga al tocar la primera bandera, así la portada sigue ligera. Con el dedo, la página sigue desplazándose sobre el plano (con ratón se puede arrastrar); el plano completo con gestos está en «En la calle».
- **Lo que sale de la portada se mueve, no se borra:**
  - «Hoy» (cuenta atrás, jornadas por capital) y la curiosidad del día van a la página nueva `/hoy/`, y la barra inferior pasa a ser Inicio · Hoy · Noticias · Buscar · Más.
  - El calendario va a «Más» y a la cabecera.
  - El archivo (hermandades, bandas, marchas e imagineros) va a «Más», con sus cifras.
  - Las láminas «Las ocho capitales» **se quedan en la portada** entre el mapa y la agenda (Pablo, 26-oct: «ese apartado es precioso»).
  - `/en-la-calle/` deja de redirigir y pasa a ser la página para elegir ciudad.
- **Noticias:** el titular va primero y debajo una sola línea con el medio y la hora. La capital solo aparece si se ven todas. Sin extracto en el móvil y con una noticia destacada (la primera con foto de las seis primeras).
  - **La misma noticia de varios medios se agrupa** (`build.mjs`, al cargar `news.json`): sale la más reciente con «También en…» y sus enlaces. Cuentan como el mismo asunto si comparten al menos el 60 % de las palabras con contenido del titular más corto (tres palabras como mínimo) y tienen 3 días de margen como máximo. Fuera las palabras genéricas (procesión, horario, itinerario, nombres de capital…). Con las noticias de hoy: 2.312 → 1.805, en 226 grupos.
  - **Medios con dos grafías se unifican** con la más usada, prefiriendo la que no es un dominio: «diariosur.es» = «Diario Sur», «lavozdelsur.es» = «La Voz del Sur». La capital del final solo se quita si lo que queda es una palabra («101tv Sevilla» = «101TV»), para no juntar «Diario de Sevilla» con «Diario de Cádiz».
- **Las colgaduras no se repiten:** viven en la portada y en la cabecera de su capital.
  - En las noticias sin foto ya no hay miniatura: solo texto.
  - En las hojas «Más» y «Tu capital», en el buscador y en `/en-la-calle/`, cada capital es un punto de su color con su nombre.
- **Un solo estado de capital:** elegir capital en la portada, en el chip de la cabecera o en los filtros de Noticias es la misma elección. Volver a Andalucía la quita.
- **Arreglos P1/P2 de la crítica (aprobados por Pablo):**
  - Banderas como botones de 44 px con `aria-pressed`. Sin JavaScript siguen siendo enlaces.
  - Los puntos del mapa ya responden.
  - Deslizadores con `aria-valuetext` (dicen la hora, no los minutos).
  - El foco entra en la ficha de «En la calle» y vuelve al cerrarla.
  - En el móvil, el reloj sube por encima de la ficha.
  - Cruces de templos en lila tenue (el oro es del cortejo).
  - Lista por hora dentro de cada estado.
  - «Saliendo/Entrando en su templo» en lugar de «Por Salida».
  - Sin antetítulo, y la ruta de penitencia detrás de la lista.
  - Jornada por defecto: la de más cofradías, en lugar de Viernes de Dolores.
  - Día de la agenda legible (sin tracking negativo).
  - En la agenda, un pregón ya no sale como «Procesión», y el mismo acto detectado en dos capitales se queda en la que nombra su título.

**Descartado**
- **«Tu esquina»** (prototipo 2): «¿Qué pasa cerca de mí?» con minutos hasta que una cofradía pasa a tu lado. Es útil, pero depende de la ubicación. Queda como idea para «En la calle».
- **«La noche entera»** (prototipo 3): una regla para deslizar la noche que enciende Andalucía capital a capital, el «río» de la jornada y la música de cada paso. Obliga a cargar los 8 planos en la portada (unos 3 MB) o a generar un resumen al compilar; queda como idea.
- **Sonido de «la marcha que suena»:** ninguna fuente publica qué marcha suena en cada momento. Inventarlo rompe la regla de no inventar datos. Lo que sí hay, con fuente, es la banda que va tras cada paso y el repertorio dedicado.
- **Gestos completos del plano en la portada** (arrastrar con el dedo y pellizcar): atraparían el desplazamiento de la página en el móvil.
- **Miniatura con las iniciales del medio** en las noticias sin foto: repetía el mismo problema de ruido que la colgadura.


## 2026-10-25 · Alojamiento, dominio y velocidad (sesión de infraestructura)

Medidas en `INFORME-VELOCIDAD.md`; pasos para Pablo en `GUIA-ALOJAMIENTO.md`.


**Elegido: Cloudflare Pages como web principal; GitHub Pages sigue de copia** hasta que Cloudflare lleve una semana sin fallos.

| | GitHub Pages (hoy) | Cloudflare Pages (plan gratis) |
|---|---|---|
| Caché en el navegador | `max-age=600` fijo para todo: cada 10 min se vuelve a preguntar por CSS, JS, fuentes e imágenes | La decidimos nosotros (`_headers`): CSS/JS con huella y fuentes un año `immutable`; imágenes una semana; noticias 5 min |
| Compresión | gzip | Brotli: 10-41 % menos que gzip (índice de búsqueda −29 %, plano de Sevilla −24 %, `marchas/resto.html` −41 %) |
| Cabeceras de seguridad | Solo HSTS; la CSP va en `<meta>` y no admite `frame-ancestors` | `nosniff`, `X-Frame-Options`, `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`, COOP |
| Funciones | No hay | `/api/sugerencias` (erCuñao) con D1, ya escrito en `functions/` |
| Límites | 1 GB de sitio, 100 GB/mes de tráfico (orientativo), 10 publicaciones/hora | Tráfico ilimitado; 20.000 archivos (hoy 10.795) y 25 MiB por archivo (el mayor, 3 MB); 500 compilaciones/mes **en la integración con Git** |
| Dominio propio | Sí, con HTTPS | Sí, con HTTPS; y si el dominio está en Cloudflare, analítica gratis y redimensionado de imágenes |

- **Despliegue:** subida directa desde Actions (`wrangler pages deploy`, trabajo `cloudflare` de `publicar.yml`), no la integración con Git de Cloudflare: el sitio ya se genera en Actions con las noticias del momento y así no se gastan las 500 compilaciones al mes. La documentación de Cloudflare no dice si las subidas directas cuentan para ese límite; por si acaso, la variable `CLOUDFLARE_CADA_HORAS = 2` reduce a 12 al día (360/mes).
- **Noticias fuera de main (K1):** el bot guarda noticias y agendas en la rama `datos`, que tiene siempre **un solo commit** reescrito en cada lectura (`tools/datos-rama.sh`). main deja de crecer ~100 MB al mes y deja de recibir 24 commits automáticos al día (menos choques al hacer `pull --rebase`). Las copias de `main` se quedan fijas a 2026-10-26 y no se borran: con nueve sesiones trabajando, borrarlas habría dado conflictos a todas (y el protocolo dice que nadie toque `news.json`). En local, las del día: `node tools/traer-datos.mjs`. **Falta, con el sí de Pablo:** limpiar las versiones antiguas del historial con `git filter-repo` (reescribe la historia: todas las sesiones tendrían que volver a clonar).
- **Service worker** (`site/despliegue.mjs`): cachés con nombre fijo (antes se llamaba `oc-<fecha>` y cada publicación horaria borraba todo lo guardado para usar sin conexión); red primero con espera máxima de 2,5 s para páginas y datos (con poca cobertura se enseña la copia y se renueva detrás); recursos con huella y fuentes desde la copia sin preguntar; carcasa con las 8 colgaduras y las 2 fuentes; cachés con tope (120 páginas, 30 datos, 250 recursos); `navigationPreload`.
- **Precarga** de las fuentes Karantina y Heebo (el titular de la portada es el LCP y espera a Karantina).
- **Dominio:** empezar con `ocho-capitales.pages.dev` (gratis y ya reservado). Si se compra uno: `ochocapitales.es` (comprobado sin registrar; ~7 €/año en un registrador español, Cloudflare no vende `.es`) o `ochocapitales.com` (libre; ~10,5 $/año en Cloudflare a precio de coste). Recomendación: `.es`, por el público y el precio, con los DNS en Cloudflare (gratis).

**Descartado**
- Quedarse solo en GitHub Pages: no se puede cambiar la caché de 10 minutos ni añadir cabeceras, y no hay funciones para el buzón.
- Vercel / Netlify gratis: sus planes gratuitos limitan el tráfico mensual (Cloudflare no) y el de Vercel es solo para uso no comercial; además Cloudflare ya tiene la base D1 y el proyecto creados.
- Integración con Git de Cloudflare Pages: compilaría en sus servidores cada push (hasta 500/mes) sin las noticias frescas, que se leen en Actions.
- Guardar `news.json` como artefacto o caché de Actions: caducan (90 días / 7 días sin uso) y se perdería el archivo de noticias.
- Subdominios gratuitos de terceros (`eu.org`, `is-a.dev`, `js.org`): o tardan semanas en aprobarse, o son solo para proyectos de programación; `pages.dev` es igual de gratuito y más fiable.

**Para la sesión de portada (no lo toco: es interfaz)**
- Las miniaturas de noticias de la portada cargan la foto original del medio (300-400 KB, 1200 px) para una caja de 160×120: **~1 MB** de los 1,3 MB de la portada en móvil. Las primeras llevan `fetchpriority="high"`, que compite con el titular (el LCP real). Propuesta: quitar `fetchpriority="high"` (o dejar solo `loading="lazy"`) y, cuando haya dominio en Cloudflare, servirlas redimensionadas con `/cdn-cgi/image/width=320,format=auto/<url>` (5.000 transformaciones únicas al mes gratis).
- La portada pasa ~2,5 s de CPU en móvil lento evaluando el HTML (106 SVG en línea y un script en línea de 11 KB): TBT 700 ms. Dibujar el mapa al entrar en pantalla o simplificar los SVG repetidos lo bajaría.
- `search-index.json` incluye las 200 últimas noticias, así que cambia cada hora y se vuelve a descargar entero (424 KB gzip). Al partirlo (sesión de marchas), conviene dejar las noticias fuera: el buscador puede tomarlas de `news.json`.

## 2026-10-24 · Decisiones de Pablo sobre la auditoría integral
- **Mutilado de Málaga** (`mutilado-clemencia-malaga`): se queda como víspera del Sábado de Pasión. Sustituye a la decisión de octubre de no añadirla (`MALAGA-VERIFICACION.md`).
- **Marchas del foro de Patrimonio Musical (2008):** visibles como «sin verificar»; cada una se intenta confirmar en otra fuente y pasa a «verificada» con su fuente.
- **Fechas contradictorias entre fuentes:** se investigan en fuentes primarias; sin conclusión sólida, se muestra la más fiable con la discrepancia indicada (no se elige en silencio).
- **Portada:** solo el selector de banderas con el mapa y, debajo, la agenda. **Noticias** se rediseña con menos ruido. Las colgaduras se usan con moderación: no se repiten en listas ni tarjetas.
- **Trabajo de otra sesión** (re-lectura de marchas, `filtro-noticias.mjs`): se termina al final, con autoauditoría.

## 2026-10-23 · Marchas: no afirmar lo que no está verificado (auditoría integral, tanda A)
**Elegido**
- Una marcha del catálogo solo se une a una marcha de hermandad si el título coincide y los compositores comparten un **apellido** (se ignoran nombres de pila y partículas). Así se pierden ~16 uniones dudosas a cambio de no pegar el vídeo y el año de otra obra.
- Un artículo de Wikipedia emparejado con varias hermandades solo da marchas a la que tiene todas sus palabras propias en el título del artículo.
- Marchas de la lista del foro de Patrimonio Musical (2008): se muestran como «Asociada a… (sin verificar)» y «Marchas asociadas», con su fuente. Wikipedia y las fichas oficiales siguen como «Dedicada a», con nota de origen.

**Descartado**
- Ocultar las 322 marchas del foro: la segunda opinión confirmó 5 de 6 en otras fuentes; ocultarlas quitaría información casi siempre correcta. Pendiente de que Pablo lo decida (está en «A decidir» de `AUDITORIA-INTEGRAL.md`).
- Unir por nombre completo exacto: perdía variantes legítimas del mismo compositor (tildes, iniciales).

## 2026-10-13 · Rediseño «Colgaduras» (en curso, sin publicar)

**Elegido:** mundo visual «Colgaduras» (reposteros de balcón al paso de las cofradías): morado nazareno, oro de galón, cal blanca de fachada y el color de cada capital como terciopelo. Titulares en Karantina (condensada, versales), texto en Heebo. Composición C de la maqueta: titular + cuenta atrás, ocho colgaduras con su emblema sobre el mapa, hilos dorados a cada capital, noticias con miniatura.
- Emblemas (a petición de Pablo, tomados de `portal.json`): Sevilla palio, Málaga campana, Granada Alhambra, Córdoba arcos de la Mezquita, Cádiz horquilla, Huelva cinta, Almería Alcazaba, Jaén cruz del Nazareno.
- Maquetas y recursos: Canva (`generate-image`, diseño de trabajo DAHXzhKqeGQ). Originales PNG en `assets/plates/` (local, fuera de git); en la web, WebP en `site/assets/plates/`.

**Descartado**
- Cartel anunciador (la favorita de impeccable): muy reconocible pero poco propia y depende de fotos con derechos.
- Colgaduras ordenadas de oeste a este (hilos sin cruces): se usó el orden del portal como la maqueta aprobada; los hilos van en ángulo recto con carriles calculados para minimizar cruces.
- Textura de papel como fondo y acuarela sobre el mapa: dejaban ver las juntas del azulejado; la acuarela además era el LCP (la inyecta JS).
- Marcado SVG incrustado para mapa e hilos: el comprobador de impeccable lo trata como ilustración. Ahora se dibuja con JS desde datos JSON (`#oc-mapa`).

**Técnicas**
- `colgaduras.css` se cargaba después de `site.css` y la sustituía donde se solapaban. El 2026-10-16 se absorbió al final de `site.css` (mismo orden de cascada, una petición menos).
- Colgaduras = enlaces reales a la capital (funcionan sin JS); con JS eligen ciudad (`setCity`), con muelles propios (response/damping al estilo Apple), balanceo al rozarlas, hilo que se dibuja y botón que nace del punto de la capital. `prefers-reduced-motion`: cambios instantáneos.
- Miniaturas de noticias sin foto: la colgadura de su capital (nunca un hueco).
- Despertador: cron de GitHub 3 veces por hora con trabajo `comprobar` que corta si `news.json` tiene menos de 40 min (sin cron-job.org).

## 2026-10-17 · El plano sigue siendo propio (SVG), no Leaflet

**Elegido:** mantener y mejorar el plano propio (`calle.js` + `plano.mjs`). Pablo lo decidió expresamente. Se le añadió lo que más le faltaba: rótulos de calles e iglesias (etiquetas por tramo con su ángulo, tamaño fijo en pantalla, descarte de solapes y esquivando los medallones, con rangos según el zoom), recorridos por las calles (`enrutar.mjs`) y solo brilla el recorrido de las cofradías que están en la calle a esa hora.

**Descartado**
- Leaflet con teselas de OpenStreetMap/CARTO (propuesto por Antigravity, que reescribió `calle.js`): depende de servidores de terceros con sus condiciones de uso, no funciona sin conexión y pierde el aspecto cofrade. Copia del intento guardada fuera del repositorio (scratchpad de la sesión).
- Dos heurísticas del mismo intento que rompen la regla de no inventar datos: adivinar si una foto es del Cristo o de la Virgen por palabras de su descripción, y asignar marchas a hermandades por coincidencia de palabras en la dedicatoria.

**Técnicas**
- Las etiquetas salen de los nombres de OpenStreetMap (`etiquetas` en `site/data/planos/<ciudad>.json`): rango 1 = calles del recorrido y arterias; 2 = terciarias cercanas; 3 = el resto cercano. Una etiqueta por nombre cada 300 m como mínimo.
- El plano de Sevilla pasa de ~270 a ~370 KB; en Cloudflare viaja comprimido.

## 2026-10-15 (noche) · Imágenes, «En la calle», ruta, base de datos y erCuñao

**Elegido**
- **Imagen de cada hermandad:** foto de Commons revisada a ojo. Se prefiere el Cristo y la Virgen en díptico (o una foto con los dos); si no hay, un solo titular; si no, la sede, rotulada «Sede: …» para no hacerla pasar por la imagen. Si tampoco hay sede, una estampa propia (colgadura, monograma y titulares) que invita a compartir una foto. Así se cumple que «todas las hermandades deben tener imagen» sin inventar.
- **Alojamiento:** Cloudflare Pages gratis, sin dominio por ahora (decisión de Pablo). GitHub Pages sigue publicando en paralelo hasta que Pablo lo apague. **WordPress descartado:** el sitio es estático y generado; WordPress añadiría servidor, base de datos y mantenimiento sin aportar nada que hoy falte.
- **erCuñao:** sin IA, gratis (decisión de Pablo). Reconoce intenciones (día, ciudad, hermandad, horario, sugerencia) sobre un JSON reducido. Sugerencias a Cloudflare D1, con límite de 10 al día por IP cifrada; si no hay servidor, abre una incidencia de GitHub ya rellenada. El debate semanal es una incidencia automática cada lunes.
- **Plano:** dibujado por nosotros desde OpenStreetMap (calles simplificadas en SVG, terciopelo morado y oro), sin mosaicos de terceros: es gratis, funciona sin conexión y tiene estética cofrade. Las rutas a pie se delegan a Google Maps o Apple Maps con un enlace.
- **Posición del cortejo:** estimada interpolando entre los puntos con hora del itinerario oficial, y rotulada como estimación. Los puntos sin coordenadas fiables se descartan (a más de 900 m de sus vecinos o a más de 2,5 km de la mediana) o se interpolan marcados «estimado».
- **Ruta de penitencia:** algoritmo voraz. Elige la parada que da más cofradías nuevas por minuto invertido (espera + camino), a 70 m/min y con un máximo de 30 min andando. «Evitar la bulla» penaliza las zonas con muchas cofradías y la carrera oficial. La afluencia es una estimación declarada, no un dato.
- **Base de datos:** SQLite con `node:sqlite` (sin dependencias), regenerada desde `portal.json` en cada publicación, con tabla de procedencia y `auditoria.json`.

**Descartado**
- Mapas con mosaicos (Leaflet + OSM tiles, Mapbox, Google): dependen de terceros, tienen límites de uso y no tienen la estética.
- erCuñao con IA (Workers AI u otra API): Pablo lo quiso solo gratis y sin IA.
- Fotos de Instagram o de webs de hermandades: tienen derechos. Solo Commons con licencia libre y crédito.
- Subir al repositorio los PDF de itinerarios y los textos completos de las fichas: el repo es público y son de terceros. Están en `.gitignore`.

## 2026-10-15 · Movimiento e interiores

**Elegido**
- Transiciones de página nativas del navegador (`@view-transition`), sin librerías. La colgadura comparte nombre de transición entre la portada y su capital, así que viaja de una a otra. Si el navegador no las admite (o con «reducir movimiento»), la navegación es normal.
- Revelado al hacer scroll con `animation-timeline: view()` (CSS puro), en lugar de IntersectionObserver con JS: no cuesta en el hilo principal y, sin soporte, el contenido se ve directamente.
- Capital: foto a sangre con velo nazareno y la colgadura de esa capital colgando. Se descartó mantener la caja morada «Atlas», que era el mismo patrón para todas las capitales.
- Hermandades sin foto: un monograma bordado (inicial en oro sobre el terciopelo de su capital). Se descartó repetir la colgadura de la capital en cada fila, porque en una lista de 70 hermandades sería la misma imagen 70 veces.
- Noticias sin foto: la colgadura de su capital (como en la portada), también cuando la foto del medio falla al cargar.

**Descartado**
- Sello de ocho puntas girando lentamente en las cabeceras de banda: un movimiento constante choca con el tono sobrio y devoto.
- Píldora de jornadas escalada con `scaleX` (más barata): deformaba los extremos redondeados; se anima `transform` + `width` de un solo elemento.

**Comprobador de fidelidad de impeccable (no superado)**
- Primer pantallazo a 1080×1920 (432×768 CSS a 2,5×): 75 % global (hace falta 72 %) pero con vetos en 14 regiones: las partes dinámicas (fotos y titulares reales de noticias frente a los inventados de la maqueta) y las letras de las colgaduras. No es alcanzable sin falsear contenido. Solo se puede saltar con palabras de Pablo (`--force --reason`). Pendiente de decidir con él.
- Cambiar `regions.json` invalida la aceptación de la revisión de recursos: si se vuelve a usar el flujo, hay que repetir `component-review` y que Pablo acepte.

**Salidas extraordinarias y magnas en «En la calle» (2026-10-22)**
- Elegido: misma tubería y formato que los recorridos de Semana Santa. Fuente `tools/sources/itinerarios-extraordinarios.json` (puntos `{lugar, hora}` literales del cartel, tramos `ida`/`regreso`, `acto` entre ambos) → `geocodificar.mjs` las escribe en `recorridos/<ciudad>.json` bajo `extraordinarias` → `enrutar.mjs` → `build.mjs` las añade como una «jornada» más con fecha (pestaña propia tras las de Semana Santa).
- Descartado: un mapa o página aparte (duplicaba plano, reloj, ficha y ruta) y una lista paralela de eventos con coordenadas (el brief pedía no crear otro modelo).
- Regreso con guiones largos (11 7); los tramos «aprox.» siguen siendo de puntos (2 7), para no confundirlos.
- Horas: solo las del cartel son oficiales; el resto se reparte por distancia andada y se muestra con «≈».
- «Pasada»: se decide en el navegador por la fecha (no al compilar), para que no dependa de cuándo corra el bot. La próxima se destaca y se abre por defecto si hoy no hay jornada; las celebradas se apagan.
- Pista `templo` en los puntos: la salida no siempre es la sede de la hermandad (p. ej. llegada a San Juan).

**Málaga: puerta, marchas y fotos (2026-10-25, sesión de corrección)**
- Puerta exacta de salida/entrada: nodos `entrance`/`door` de OSM (Overpass), por este orden: puerta con la dirección de la sede; puerta del edificio del templo cuya dirección o calle es la primera (última) del itinerario; única puerta del edificio. Si nada encaja, se queda el punto del edificio con aviso. Descartado elegir «la puerta más cercana a la calle» sin más (en edificios con varias puertas sería inventar).
- El Rico y Resucitado no citan la Torre Sur en su lista oficial, pero su ficha da la hora de Torre Sur: se sitúa en Molina Lario tras la Plaza de la Marina y ahí empieza el regreso (anotado como derivado). La prensa (El Español) tampoco separa ida y regreso.
- Marchas: correcciones a mano en `tools/sources/marchas-correcciones.json` (retirar / confirmar / añadir), aplicadas en `site/build.mjs`, para que sobrevivan a una regeneración de `portal.json`. Descartado editar `portal.json` a mano.
- Wikipedia pasa a ser pista, no fuente de la dedicatoria: sus marchas salen «sin verificar» hasta confirmarlas en Patrimonio Musical (afecta también a Sevilla).
- Fotos: `tools/sources/fotos-retiradas.json` por nombre de archivo de Commons, aplicado en `site/build.mjs` a la foto principal y al díptico. Descartado borrar las entradas de `site/data/imagenes.json`, porque `procesar-imagenes.mjs` las volvería a crear.

## Modo fuera de temporada (26-oct-2026, orden de Pablo vía coordinadora)
- **Temporada por fecha y configurable:** `site/data/temporada.json` (`modo`: auto / fuera / semana-santa). En «auto», los recorridos solo se ven del Viernes de Dolores al Domingo de Resurrección (2027: 19 al 28 de marzo). El build decide y `site.js` lo vuelve a comprobar con la fecha de Madrid. Los recorridos de 2026 se conservan en los datos.
- **Portada → plano de la ciudad con sedes:** espadaña bordada (templo) y fachada (casa hermandad), en el color del hábito y con el hilo de oro de las catedrales. Las que se pisan se juntan con su número; al tocar un grupo repartido, la cámara se acerca; uno solo (o varios en el mismo edificio) abre una hoja con foto, sede, día de salida de 2026, próximos cultos de la agenda y la ficha. Hay un hilo de oro entre el templo y la casa de la hermandad elegida.
- **Datos de sedes:** si existe `site/data/sedes/<capital>.json` (lo cargan las sesiones de rutas), manda. Si no, de forma provisional y solo en Málaga, Córdoba y Cádiz: el punto de salida del itinerario oficial (casa hermandad si lo dice) más el templo de la ficha si OSM tiene uno con el mismo nombre. En las demás no se pinta nada hasta que llegue su archivo. **Descartado:** emparejar nombres de templo de forma aproximada (daba falsos).
- **Botones fuera de temporada:** «Próxima Semana Santa 2027» (página nueva `/proxima-semana-santa/`: cuenta atrás, fechas de cada jornada y qué tendrá cada capital) y «Extraordinarias» (solo las vigentes, con recorrido y posición estimada; desactivado si no hay). «En la calle» fuera de temporada solo enseña las extraordinarias vigentes, o un aviso si no hay.
- **Estilos nuevos en `site/assets/portada.css`** (no en `site.css`, que es de oc-diseno).
- **Entrada inmersiva:** Pablo eligió las dos (26-oct): A, el globo baja a Andalucía en la primera visita (con continentes de Natural Earth 1:110m, descarga aprobada); B, el nazareno que se dibuja con el scroll en «Próxima Semana Santa». Prototipos en `capturas-portada/entrada/`.
- **Extraordinarias con solo hora de salida** (Santo Traslado, Santa Cena de Granada): la posición se estima con el paso medio (mediana) de las cofradías de esa ciudad en 2026, en metros por minuto, y se dice en la nota. Las hermandades sin ficha (Amparo de Sevilla, de gloria) salen con el nombre de su itinerario.
