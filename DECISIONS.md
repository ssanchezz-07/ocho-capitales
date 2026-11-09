# Decisiones de diseño y técnicas

## 2026-11-09 · erCuñao, bloque 6: preguntas con erratas o en andaluz, y menos peso en cada página
**Elegido**
- **Fonética andaluza al comparar** (seseo y ceceo, yeísmo, la h muda): «plasa paliyero» casa con Plaza Palillero y «no me yores» con «No me llores, Soledad». Se compara la escritura tal cual **y** la fonética, y vale la más parecida: una errata como «traicóin» no se parece a «traisión» en fonética, pero sí a «traición» escrita.
- **El título de una marcha va tras la última palabra clave** («de quién es la marcha X» → X). Antes se tomaba la primera («quién es») y el título incluía «marcha», así que fallaban las erratas y hasta el título bien escrito decía «la más parecida».
- **Un lugar repetido en el itinerario con otra grafía** («San Miguel» y «P. SAN MIGUEL») da las dos horas.
- **«Por la tarde» no es un lugar**, y con una hermandad en la conversación «¿y por dónde pasa por la tarde?» es su recorrido, no la lista de la tarde.
- **La miniatura, la línea de tiempo y «Compartir» van en `assets/cunao-pinta.js`**, que se pide con el motor al acercarse al botón. `cunao-ui.js`, que va en todas las páginas, baja de 11,5 a 7,5 KB comprimido. Si el archivo nuevo no llega, erCuñao contesta igual, sin esos tres extras.

**Descartado**
- **Perseguir las 10 dudosas de Huelva de la batería del experto:** vienen de itinerarios con columnas mezcladas («Templo Plaza San Cristo de la Pedro Sangre»). Se arreglan en los datos, que ya están pendientes en el equipo de rutas.
- **Meter el código de pintar en `cunao.js`:** el motor se prueba en Node sin navegador y debe seguir siendo puro.

## 2026-11-08 · Plano: reproducir/pausar en el iPhone y fondo hasta todas las sedes (sesión «En la calle»)
**Reproducir y pausar.** Pablo: «el botón de play solo inicia pero no pausa». En el iPhone, Safari no envía el «click» si la página cambia bajo el dedo, y el plano reconstruía la lista (con fotos) en cada fotograma. **Elegido:** el botón responde a `pointerup` (el click de detrás se ignora, salvo el de teclado) y en cada fotograma solo se toca lo que cambia (lista con una fila por hermandad, ficha con firma, cortejo reutilizado). **Descartado:** `touchend` con `preventDefault` (rompe el desplazamiento y la accesibilidad) y bajar la frecuencia de repintado (el cortejo daría tirones).
**Recorrido de la extraordinaria siempre visible:** se probó y se quitó. Pablo dice que la línea dorada «va bien» al reproducir.
**Fondo del plano de sedes.** Pablo: «hay hermandades fuera del mapa… al quitar el zoom se ven zonas vacías en morado». **Elegido:** `tools/plano/afueras.mjs` amplía el fondo desde el mismo pbf hasta cubrir lo que enseña la cámara al encuadrar todas las sedes en el móvil y en el ordenador; fuera del centro, solo carreteras principales y costa (de 16 a 138 KB por capital). La cámara no sale del fondo y al abrir se ven todas las sedes. Las calles menores del centro se desvanecen en el borde de su recuadro (el 15 % del lado, 700 m como poco) para que no se vea con bordes rectos, y alejar tiene tope: 1,6 veces el encuadre de todas las sedes. **Descartado:** volver a generar el fondo completo con todas las calles hasta las afueras (pesaría varias veces más y es el terreno de las herramientas de rutas) y un degradado sin más, sin fondo de afueras (se vería morado vacío alrededor). Cuando lleguen sedes nuevas fuera del fondo, `build.mjs` avisa y se vuelve a ejecutar `node tools/plano/afueras.mjs <ciudad>`.

## 2026-11-08 · erCuñao, bloque 5: las seis mejoras que eligió Pablo («Me gusta la 1 2 4 6 7 8»)
**Elegido**
- **El recorrido en miniatura** (`data/cunao/g/<capital>.json`, que se pide solo al preguntar por un recorrido): la ida y el regreso simplificados (Douglas-Peucker), con las mismas coordenadas que el plano, y de fondo las calles principales y el río de esa zona. Se pinta en SVG, sin cargar el plano. «Síguela en el plano» abre `/en-la-calle/<capital>/?dia=…&h=<hermandad>`.
- **La salida en una línea de tiempo:** salida, carrera oficial, Catedral (si el itinerario la trae aparte) y entrada, con horas del mismo programa. Si un momento falta, no se pinta. Si las horas no van en orden, no se pinta la línea.
- **Gestos de erCuñao:** su mismo dibujo con dos variantes fijas. Cuando lo sabe, se baja las gafas; cuando no, levanta las cejas y se rasca la cabeza, una sola vez. Sin bucles, y con movimiento reducido no se mueve.
- **Compartir:** una tarjeta de 1080×1080 hecha en el navegador (canvas) con la estrella, «ochocapitales», la pregunta, la respuesta corta y su miniatura, más el enlace a la ficha. En el móvil se comparte con el menú del sistema; si no lo hay, con el enlace de WhatsApp. No lleva datos personales ni pasa por ningún servidor.
- **Preguntas según la página:** en la ficha, sobre su hermandad. En el plano y en la capital, «¿Dónde van ahora?» (solo en plena jornada) y «¿Qué sale hoy?». En Noticias, «¿Qué ha pasado hoy?» con lo último de las ocho capitales. En una banda, a quién acompaña. En una marcha, quién la compuso.
- **«¿Dónde van ahora?»** sale del itinerario: dice entre qué dos puntos va cada cofradía a esa hora y avisa de que la posición es estimada.
- **La cabecera se encoge** al bajar por una respuesta larga y vuelve al subir. Tiene histéresis para no rebotar.
- **Datos que no tiene, dichos:** el capataz (y cargos parecidos) y el tiempo. Para el tiempo remite a la AEMET.

**Descartado**
- **Cargar el plano entero (`data/calle`) para la miniatura:** pesa hasta 600 KB por capital.
- **Una imagen generada en un servidor para compartir:** el sitio es estático y la tarjeta se puede hacer en el propio móvil.

## 2026-11-08 · erCuñao «experto en todo» y juegos «mientras esperas» (sesión erCuñao, plan del domingo al martes)
Pablo (6 y 8-nov): «tiene que ser el mejor en todo, experto en todo» y «la mejora y perfección del bot, tanto en funciones como en visualización, además de meterle los juegos de espera».

**Elegido**
- **Sigue sin IA (opción 1).** La opción 2 (Workers AI) se deja para después del lanzamiento, porque no estaría terminada y auditada el lunes.
- **El bot se prueba con una batería generada desde los datos** (`site/scripts/bateria-experto.mjs`), no solo con preguntas escritas a mano. Saca miles de preguntas de todos los tipos y escribe cada una de cinco formas: normal, sin tildes, en andaluz, con erratas y como en el móvil. Las que fallan pasan a una revisión independiente. La batería fija (`probar-cunao.mjs`) es la que va en la red de seguridad.
- **Habla andaluza:**
  - un diccionario corto, solo con palabras que no admiten otra lectura: «ande», «ar», «er», «q», «kien», «izo»…;
  - variantes de pronunciación (seseo, ceceo, yeísmo, b/v, h, «-ao») que solo se aplican a las palabras desconocidas;
  - las calles se toman del texto sin corregir, porque no están en el vocabulario.
- **Artículo y concordancia** con cada nombre de hermandad: «del Cautivo», «de San Bernardo», «los Gitanos salen».
- **Cifra de hermandades:** la oficial de cada capital (`capitales[].cifra`), no el número de fichas.
- **«¿Qué sale hoy?» fuera de Semana Santa:**
  - responde con las extraordinarias que tienen itinerario y con 21 días de agenda;
  - la agenda solo admite actos verificados o de agendas cofrades, nunca titulares de prensa;
  - más allá de esos 21 días, dice que aún no tiene la agenda.
- **El bot no frena la web:** en cada página solo va la interfaz (`cunao-ui.js`, unos 11 KB). El motor y los datos se piden al acercar el dedo al botón o al abrirlo.
- **Juegos** (`/juegos/`, `assets/juegos.js`, `data/juegos.json`):
  - todas las preguntas se generan con los datos de las fichas, con semilla: el reto diario es el mismo para todos sin servidor y «Reta a un amigo» comparte la semilla por WhatsApp;
  - la racha se guarda solo en el móvil;
  - `probar-juegos.mjs` comprueba contra portal.json, por su cuenta, que cada pregunta tiene una sola respuesta buena y que es cierta;
  - en «por el nazareno», las otras opciones también tienen su hábito conocido y distinto;
  - en «por el recorrido», la forma del itinerario con la salida y la carrera oficial;
  - las fotos llevan su crédito después de responder.
- **Personaje:** erCuñao es el único protagonista. Presenta los juegos y los propone en plena jornada o cuando hay una salida ese día.

**Descartado**
- **Copiar los juegos de la competencia** (nombres, escudos, «impostor»): ni sus nombres ni sus dibujos, y nada de escudos, que tienen derechos.
- **Ranking en línea, cuentas o duelos con servidor:** piden datos personales y un servidor. Se usan la semilla y el enlace.
- **Adivinar la marcha por el audio:** los derechos son de las bandas.
- **Precargar el motor de erCuñao en todas las páginas:** eran 120 KB de JavaScript sin usar en cada visita.

## 2026-10-27 · Noticias: qué entra y cómo se presenta (oc-diseno, por orden de Pablo)
Pablo: «hay noticias que no son del ecosistema cofrade, hay que perfeccionar qué tipo de info se mete y cómo acogerla».

**Elegido.** Un solo criterio en `site/filtro-noticias.mjs`. Se aplica al leer las noticias (`fetch-news.mjs`) y al compilar (`build.mjs`, también sobre el archivo ya guardado, sin tocar `data/news.json`). Las dudosas, fuera.
1. **Webs oficiales** de hermandades, agrupaciones, consejos y federaciones: siempre dentro, salvo avisos de lotería y entradas vacías.
2. **Medios cofrades** (Mundo Cofrade, Gente de Paz, El Pespunte, ArteSacro, Kerygma…): siempre son cofrades, pero tienen que ser de una de las ocho capitales.
3. **Diócesis:** solo si hablan de cofradías.
4. **Prensa generalista y Google Noticias.** Tienen que cumplir las tres condiciones:
   - **vocabulario cofrade claro:** palabras propias, días de la Semana Santa, una advocación o el nombre de una hermandad;
   - **que sea de una de las ocho capitales:** por su nombre (no cuentan «Vélez-Málaga», «provincia de…» ni «un pueblo de…»), por la hermandad o por el canal de la capital; lo de toda Andalucía también vale;
   - **nunca política, sucesos, deporte, toros, ferias ni comercio**, aunque nombren de pasada a una hermandad.
5. **Otro pueblo o ciudad** (Jerez, Osuna, Antequera, Cartagena…) sin nombrar una capital: fuera.
6. **Temas:** salidas, cultos y traslados, coronaciones, música, patrimonio y estrenos, cabildos y cargos, pregones y carteles, agenda. Hay una fila de filtros por tema, cada noticia lleva su etiqueta y la destacada prefiere un tema importante (coronación, salida, pregón, estreno).

**Medido sobre el archivo del 26-oct (2.396 noticias):** entran 1.682 y salen 714.
- **Por qué salen:**
  - 271 son de otro pueblo o ciudad, y otras 86 lo mismo pero de medios cofrades;
  - 203 no tienen vocabulario cofrade;
  - 91 no son de ninguna capital;
  - 39 tratan de un tema ajeno;
  - 20 son avisos o páginas que no son noticias.
- **Muestras al azar, revisadas a mano:**
  - de 60 que entran, ninguna es ajena al mundo cofrade;
  - de 60 que salen, 2 cofrades de capital se perdían por fallos de las listas, ya corregidos («el Puerto» de la Torre, «archicofradía»).
- **Lo que se queda fuera a sabiendas** (por la regla de «las dudosas, fuera»): noticias cofrades de capital que no dicen de qué ciudad son y cuya hermandad tiene el mismo nombre en varias capitales. Por ejemplo, «El Santo Entierro volverá por el Postigo», o los temas de toda España como la SGAE sin mencionar Andalucía.
- Comprobación: `node site/filtro-noticias.mjs [--fuera|--dentro]`.

**Descartado:**
- «ante la duda, se queda» (el criterio del 26-oct): dejaba dentro el rugby del alcalde de Cádiz, el PP, accidentes y pueblos;
- asignar la capital por el medio (por ejemplo, Diario de Sevilla = Sevilla): metía los pueblos de la provincia.

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
- **(2026-10-27) Sin duplicados** (Pablo: «No pueden haber marchas ni dedicatorias duplicadas»): una obra = una ficha. Misma obra = mismo título y mismo compositor aunque esté escrito de otra forma («Vicente Micó» = «José Vicente Micó Álvarez»; varios autores en otro orden), con formación igual o sin indicar; dos nombres de pila sin ninguno en común son personas distintas (Perfecto y Desiderio Artola). Las versiones para otra formación quedan en fichas aparte y se distinguen por la formación. El comprobador falla si encuentra una duplicada o una dedicatoria repetida en una hermandad. Las «3 marchas iguales» que vio Pablo en el filtro de /marchas/ eran otra cosa: el resto de la lista se pedía una vez por tecla y se añadía varias veces (arreglado en `site.js`).
- **(2026-10-27) Partituras de la banda** (Pablo: «eso se quita, no se suben partituras a la página ni app»): no se nombran en la web. Como todo dato debe tener una fuente que se pueda abrir, no se publican las marchas cuya única fuente es la partitura (17), ni el año o la dedicatoria que solo da la partitura. Sí se muestra el repertorio (qué marchas toca la banda del Paso y la Esperanza). Los datos completos siguen en `tools/sources/repertorio-paso-esperanza.json`.
- **(2026-11-02) Orden de paso = orden de carrera oficial** (coordinación: en la página Hoy el orden no casaba con las horas): se toma de `tools/sources/orden-paso.json`, de la nómina oficial de cada capital, con hora de salida y hora de carrera. El orden oficial cambia de un año a otro y **no** tiene por qué ir con la hora de salida: en la Madrugá de Sevilla el orden estaba bien y las salidas parecen desordenadas (La Macarena sale antes que El Silencio y pasa después). Por eso el comprobador compara con la hora de carrera (error) y solo avisa con la de salida. En vísperas no hay carrera oficial: por hora de salida. Descartado: ordenar todo por hora de salida, que daría un orden que no es el oficial.
- **(2026-10-27) Correcciones de ficha con fuente** (inventario H1, H6 y fechas en conflicto): van en `tools/sources/fichas-correcciones.json` (slug → campo → valor y fuente), que manda sobre la ficha original y no se pierde al regenerar. Ante dos fechas, la de la web oficial de la hermandad; si no la hay, la de su agrupación o consejo; Wikipedia solo como pista. Un año sin fuente se cambia por el que dé la fuente, o se quita. La ficha enseña la fuente de cada campo corregido o rellenado, no solo la general.
- **(2026-10-27) Imagineros, solo con fuente** (inventario I1-I5): las biografías escritas a mano en `tools/build-data.js` (IMAG_INFO) se rehicieron con sus fuentes (Wikipedia, IAPH, UNIA, EcuRed…; la RAH no se dejó leer) y la ficha las cita todas. Sin fuente no hay biografía: fuera Luisa Roldán y Alonso Cano, que no tenían. Las valoraciones sin fuente («el más influyente», «obra cumbre») se quitan. No es una persona, y no tiene ficha de imaginero: dos autores posibles («X o Y»), un solo nombre suelto o «grupo valenciano». Las direcciones que desaparecen redirigen (`tools/sources/imagineros-redirecciones.json`).
- **(2026-10-27) Marchas recién estrenadas por la banda sin fuente en internet** (Pablo: «Sin enlace»; «para marchas así indicar que pronto aparecerá enlace»): excepción a «toda fuente se puede abrir», solo para las marcadas con `publicar` en `tools/sources/repertorio-*.json`. Su fuente es la banda que la estrenó (`banda`, sin enlace), y la ficha dice «(pronto aparecerá el enlace)». La primera: «El pan de nuestra vida (Fénix)», de Alfonso López Cortés, dedicada a Jesús de la Pasión de Málaga. Las demás marchas que solo están en las partituras siguen sin publicarse.
- **(2026-10-27) Una fuente nueva suma, nunca quita** (orden del bloque 9): las dedicatorias de cofradiasyhermandades.es (campo «Marcha dedicada a» de cada ficha, fiable) se añaden a las que ya había. Un enlace publicado no se pierde al regenerar: si el cruce lo deja sin ligar, se repone con sus fuentes. Si la dedicatoria nueva choca con una que ya tiene fuente, se queda la de la fuente más fiable (oficial antes que el resto) y la otra se anota como discrepancia, sin borrar nada. Solo entran marchas nuevas de esa web si su ficha las dedica a una hermandad del portal; no se copian sus textos, solo los datos con enlace a la ficha. Una marcha que ya existe con el compositor escrito de otra forma se une a la existente (apellido corriente: tienen que compartir también un nombre de pila, «David Álvarez» = «Francisco David Álvarez Barroso»). Descartado: rehacer las dedicatorias solo con la fuente nueva (se perdían 56 enlaces publicados, sobre todo de La Estrella de Sevilla).
- **(2026-10-27) Lugares que no lo son:** «María» (municipio de Almería) no se toma nunca por lugar: es «María Santísima». Si la dedicatoria nombra otro templo o un barrio que no es de la hermandad («de Bellavista», «iglesia de San Buenaventura»), no se liga.
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


## 2026-10-26 · Filtro de noticias conectado (oc-alojamiento)
Google Noticias (20 de las 60 fuentes) entraba sin filtrar y colaba toros, ferias, Mercadona, PSOE, vacunas u obras.

**Elegido** (`site/filtro-noticias.mjs`, conectado en `site/fetch-news.mjs` para lo nuevo y lo ya guardado): ante la duda, se queda.
1. Los medios cofrades y religiosos pasan siempre (Mundo Cofrade, Gente de Paz, El Pespunte, ArteSacro, Isla Pasión, agrupaciones, federaciones, consejos, diócesis…).
2. Una palabra cofrade fuerte basta (además de las de antes: traslado, Kerygma, prioste, salida extraordinaria, hermano/a mayor, trabajadera, «Primer golpe», SGAE…).
3. Sin palabra fuerte y con un tema claramente ajeno (lista `AJENO`), fuera.
4. El resto pasa si tiene vocabulario cofrade o religioso amplio (también catedral, misa, parroquia, agrupación, cartel…) o el nombre de una hermandad.

**Medido sobre el archivo del 26-oct (1.890 de Google Noticias):** el filtro de la carpeta principal quitaba 248, con muchas cofrades dentro (traslados de Kerygma, el prioste de la Pastora, la SGAE y las marchas, la Catedral de Granada…). El nuevo quita 110, revisadas una a una: todas ajenas salvo 4 dudosas que no se pueden decidir solo por el titular («Siempre nos quedará el Amor», «Otro reconocimiento para Ramón Velázquez», «Creemos que la experiencia con la que contamos es un grado», «El veranillo eterno de San Miguel»). Lectura real: 60/60 fuentes, 121 ajenas descartadas y 9 nuevas.
Comprobación: `node site/filtro-noticias.mjs` lista lo que quitaría del archivo actual sin cambiar nada.

**Descartado:** filtrar también la prensa y las webs oficiales con este criterio (la prensa ya pasa por su propio filtro y las oficiales son cofrades).

## 2026-10-28 · Red de seguridad: ninguna actualización rompe la web (oc-alojamiento)
Pablo: «que todo funcione y compile sin errores garantizando que futuras actualizaciones no den errores».

**Elegido** (`tools/red-seguridad.sh`, en `publicar.yml` antes de cada publicación, en GitHub Pages y en Cloudflare):
- Comprobaciones antes de publicar: `comprobar-marchas` y `comprobar-origen` (0 errores), enlaces internos rotos sobre la web generada (`tools/comprobar-enlaces.mjs`: ~1 millón de enlaces en 12 s, hoy 0 rotos), límites (20.000 archivos, aviso desde 18.000; 25 MiB) y prueba de humo con Chromium (`tools/prueba-humo.mjs`: portada, Hoy, Noticias, una hermandad y una marcha sacadas de sus listados, Buscar y plano de Málaga, a 390 y 1440 px, sin errores de la propia web ni desbordes).
- Si algo falla, el trabajo queda en rojo y no se publica: sigue la versión anterior.
- En Cloudflare: se apunta el despliegue publicado (`tools/cloudflare-volver.mjs`), se sube, se repite la prueba de humo contra la web real y, si falla dos veces, vuelta automática al anterior (API de rollback de Pages). **Sin probar todavía:** necesita las claves de Cloudflare.
- `news.json` se valida antes de subir a R2 (`tools/validar-noticias.mjs`: forma, 50-1.000 noticias, fecha de menos de 3 días, 20 KB-5 MB); si no pasa, se queda el anterior.
- Ramas `prueba-red/…`: pasan todas las comprobaciones sin publicar ni guardar datos. Cada rama tiene su propio grupo de concurrencia, así que no desplaza las publicaciones de main.

**Probado en GitHub Actions** (28-oct): `prueba-red/ok` en verde (navegador 20 s + red 25 s). En `prueba-red/fallo` (un enlace roto y un error de JavaScript provocados), `construir` en rojo con los dos fallos señalados (`Enlace roto /ocho-capitales/colabora-rota/`, `Hoy a 390px y 1440px: JS: fallo provocado…`). GitHub Pages y Cloudflare no se tocaron. Ramas de prueba borradas.

**Pendiente:** Actions avisa de que `actions/checkout`, `setup-node` y las de Pages usan Node 20 (obsoleto); son las actualizaciones de Dependabot por revisar.

## 2026-10-28 · Publicar muchas veces sin esperas: noticias por R2 y web solo cuando cambia (oc-alojamiento)
Pablo: «poder actualizar la página muchas veces, sin esperas». Dominio decidido por él: **ochocapitales.com en Cloudflare Registrar** (sin comprar aún).

**Medido:** desde el 26-oct el bot ya no hace push a main (va a la rama `datos`). Lo que más publica son las sesiones: 49 ejecuciones el 26-oct y 22 el 27-oct, más 5-6 programadas al día. Que `wrangler pages deploy` cuente o no para las 500 «builds» del plan gratuito sigue sin confirmar (documentación y foros no lo aclaran).

**Elegido**
- **Noticias a R2** (depósito `ocho-capitales-datos`, dominio `datos.ochocapitales.com`):
  - cada lectura sube solo `news.json` (`wrangler r2 object put`, caché de 2 min con renovación en segundo plano) y fija el CORS (`tools/r2-cors.json`);
  - la página de Noticias lo pide ahí (`window.OC_NOTICIAS`, solo con la variable `NOTICIAS_URL`);
  - si falla, usa el `news.json` de la compilación, y solo repinta si hay noticias más nuevas que las ya pintadas;
  - probado con Playwright: R2 más nuevo, R2 caído y R2 igual, a 390 y 1440 px.
  - R2 frente a Function+KV/D1: cada petición a una Function cuenta contra las 100.000 diarias de Workers gratis; R2 detrás de la caché casi no se toca.
- **La web entera a Cloudflare solo cuando cambia** (`tools/cloudflare-decidir.mjs`):
  - no se sube si el push solo toca documentos (`.md`, `EQUIPO/`, `MARKETING/`…);
  - con R2 activo, de las ejecuciones programadas solo se sube una al día (portada, «Hoy» y agenda);
  - tope de 450 al mes (`CLOUDFLARE_TOPE_MES`) por si las subidas directas cuentan: al llegar, solo la diaria;
  - sustituye a `CLOUDFLARE_CADA_HORAS`.
- **GitHub Pages de copia;** con la variable `GITHUB_REDIRIGE_A` cada página lleva a la misma del dominio (`<meta refresh>` y canónico allí; probado en compilación).
- **erCuñao** ya no guarda en D1: lleva siempre al formulario de Colabora (todo llega al correo). Así sobran los secretos `RESUMEN_TOKEN` y `SAL` del proyecto de Pages.

**Descartado**
- Pasar ya a Workers con archivos estáticos (`wrangler deploy` con `assets`): solo si el panel muestra que las subidas directas cuentan para las 500 o nos acercamos a 20.000 archivos (hoy ~12.000). Paso 7 de la guía.
- Esperar o agrupar publicaciones (cada 2 h, etc.): contradice «sin esperas».

**Toqué de otras áreas (mínimo, sin diseño):**
- `site/assets/site.js` (bloque de Noticias, de dónde lee el JSON);
- `site/build.mjs` (una variable en el script de cabecera, la CSP y la redirección de GitHub);
- `site/assets/cunao.js` (salida de sugerencias).

## 2026-10-26 · Colabora por correo y GitHub invisible (oc-alojamiento)
Pablo: «que lo que envíen en la página se envíe a mi correo ochocapitales@gmail.com … que el consumidor no vea nada de GitHub».

**Elegido**
- **Web3Forms** como servicio de envío mientras la web esté en GitHub Pages: la clave es pública por diseño y hace de alias del correo (la dirección no aparece nunca en la página), 250 envíos al mes gratis, campo trampa `botcheck`. Pablo la crea con su correo y la pega como variable `FORMULARIO_CLAVE` (`GUIA-ALOJAMIENTO.md`, paso 0).
- **Formulario propio** en `/colabora/` (`site/assets/colabora.js`, solo se carga ahí): tipo, capital, hermandad (con lista), texto, fuente y correo de respuesta opcionales. Asunto fijo `[Ocho Capitales] Tipo · Capital · Hermandad`. Antispam: campo trampa, 3 s mínimos en la página y 5 envíos al día por navegador. Sin clave, el formulario avisa de que el envío llegará en unos días.
- El pie de cada ficha («Sugerir una corrección») y erCuñao (cuando no puede guardar) llevan al formulario con la página, el nombre, la capital o el texto ya puestos.
- **Alternativa Cloudflare** con un ajuste: variable `FORMULARIO_DESTINO=api` → el mismo formulario envía a `/api/sugerencias` (D1). El envío por correo desde Cloudflare (Email Routing) necesita el dominio en Cloudflare: se hará entonces.
- Fuera el flujo semanal `sugerencias-semanales.yml` (publicaba las sugerencias en una incidencia pública).
- User-Agent de los lectores de Nominatim con `ochocapitales@gmail.com`; `site/package.json` pasa a llamarse `ocho-capitales`.

**Descartado**
- FormSubmit: sin cuenta, pero el primer envío tiene que ir a la dirección en claro y recomienda no quitar su reCAPTCHA (otra pantalla para el público).
- `mailto:`: publica la dirección y depende del programa de correo de cada uno.

**Para oc-diseno:** el formulario usa `.oc-field`, `.oc-btn` y `.oc-note`; sus pocos estilos propios (`textarea`, mensajes de éxito y error, campo trampa) van en un `<style>` dentro de la página. Si quieres, pásalos a `site.css` / `vida.css` con el movimiento del resto.

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
- **Entradas construidas:** el globo (`site/assets/globo.js` + `mundo.json`, 32 KB, solo se descarga en la primera visita; aterriza en el mapa Bordado en su sitio y se funde con él; se salta tocando, con «Saltar» o Escape) y el nazareno (`site/assets/nazareno.js`, cabecera de «Próxima Semana Santa», 300vh con escena fija). Sin JS o con «reducir movimiento» el nazareno se ve terminado y el globo no sale. La costa de 1:110m se desvanece al acercarse porque de cerca es basta.

## RETOMAR AQUÍ (26-oct, parado al 93 % del límite de 5 horas)
Encargo de Pablo (vía coordinadora), literal: «¿Cuándo se ve el globo terráqueo?? Sólo muéstrale una vez y el nazareno cuando se ve, está escondido ese apartado, ¿no? Revisar».
1. **Globo** (`site/assets/site.js`, bloque «Entrada de la primera visita», tras `mapa.appendChild(svg)`):
   - una vez por visita con `sessionStorage` (no `localStorage` `oc-entrada`), corto y se puede saltar;
   - un control discreto en la portada para volver a verlo (un globo pequeño junto al mapa);
   - con movimiento reducido, una versión estática o un fundido, nunca nada.
2. **Nazareno:** también en la portada, en la zona «Próxima Semana Santa 2027», bajo el mapa o las láminas, y que se dibuje al bajar. Que siga en `/proxima-semana-santa/`. Reutilizar el SVG `NAZ` de `pageProxima()` y `assets/nazareno.js` (ahora busca un solo `[data-nazareno]`).
3. Comprobar en móvil y PC, también en una ventana nueva sin datos guardados, y mandar capturas o un vídeo corto a Pablo.
Pendiente de subir: `bc80c39` (modo de prueba `OC_TEMPORADA`); necesita el sí de Pablo en este chat.
Después, el inventario: la ficha lateral de «En la calle» en PC, la zona táctil de «Ver el máximo / Evitar la bulla», el CPU de la portada en móviles lentos, las miniaturas de noticias y Sevilla en los hábitos.
- **probar-plano.py:** que el aviso de «puntos amontonados» no salte en recorridos que van y vuelven por las mismas calles (El Calvario de Córdoba: ida y regreso por los mismos cruces, 59 %). Contar los puntos de la ida y los del regreso por separado. Lo pidió rutas-cordoba (a459718).
- **Globo con más detalle** (Pablo vía oc-marketing): «El globo terráqueo debe tener dibujado, haz diseños para aplicárselos y que se vaya acercando al continente poco a poco hasta el país y llegar a Andalucía bien detallado, pero para el vídeo y para la página». Para la web: continentes y países con estilo (no un círculo con meridianos), acercamiento lento y continuo Europa → España → Andalucía con provincias detalladas. Proponer 2-3 diseños con captura antes de construir. Hace falta el contorno de España o de los países (Natural Earth 1:50m admin-0): la descarga pide permiso. Componente de referencia de marketing: MARKETING/_src/motions/epico (bloque «globo»).
- **26-oct, tras la renovación (Pablo):** globo solo con siluetas de oro (continentes y provincias), sin rellenos, rayados ni retícula; 5 s, una vez por visita (`sessionStorage`), con un globo pequeño en la esquina del mapa para volver a verlo, y con «reducir movimiento» una imagen quieta y un fundido. Mapa de Andalucía sin ríos y con una sola gramática: la catedral de pie encima de su punto y el nombre a la derecha (en el móvil, debajo; Jaén a la derecha). Nazareno: Pablo eligió el A (oro sobre terciopelo); va también en la portada fuera de temporada, tras las láminas, con botón a «Próxima Semana Santa». Descartados: lentejuelas, carta grabada, bordado de puntadas, tinta sobre papel y cortejo por la calle.
- **Planos de ciudad legibles y manejables en el móvil (26-oct, Pablo: «no se ven claros estos mapas y no se puede mover ni hacer zoom correctamente»), en las 8 capitales:** calles con más contraste y nombres de calles según el zoom (los que caben en su tramo, sin pisarse); agua y parques más visibles; encuadre en la zona de sedes, dejando fuera solo las muy apartadas (más de 2,5 veces la distancia mediana); iconos más pequeños al alejar y los grupos como un medallón con su número; leyenda (templo, casa hermandad, grupos, color del hábito); controles pequeños abajo a la derecha, encima del pie; la colgadura ya no asoma cortada en la ciudad. Gestos: un dedo baja por la página, dos dedos mueven y amplían, doble toque acerca (y aviso «usa dos dedos» si se intenta con uno); en el ordenador, Ctrl + rueda o el pellizco del panel táctil, y doble clic. Fondo fiel desde el .pbf también en Sevilla, Granada, Huelva, Jaén y Almería. Barrios: no hay datos con nombres de barrio en el plano; queda pendiente.
- **Globo «Terciopelo y oro» en la web (Pablo, vía oc-marketing: «el globo no solo para el vídeo sino página y app»):** el mismo diseño que el vídeo: luz de vela con un lado en sombra, tierra fundida sin fronteras con la costa en hilo de oro (1:110m y, al acercarse, 1:50m), España con su galón, aura cálida; gira hasta España y baja sin cortes hasta Andalucía; las provincias se tiñen de oeste a este y se encienden las capitales; se funde con el mapa de la portada. d3-geo 3.1.1 y d3-array 3.2.4 (ISC) en assets/vendor, solo se cargan en la entrada; datos en assets/globo-datos.json (97 KB) con tools/generar-globo.mjs desde los de marketing. Sustituye al globo de siluetas (mundo.json y generar-mundo.mjs retirados).
- **27-oct (Pablo):** globo sin cortes: la costa de 1:110m se funde poco a poco con la de 1:50m y al llegar la tierra deja paso a las provincias del mapa de la portada (las mismas formas: el fundido final no cambia nada). El nazareno solo en «Próxima Semana Santa». Planos: el botón de reproducir cambia a pausa de verdad (el truco CSS «d: path()» no va en Safari) y la hora se lee como hora del día («17:30 h» con sol, tarde o luna). PC: a partir de 1200 px y pantalla apaisada, dos columnas (banderas y cuenta atrás a la izquierda, el mapa grande a la derecha; sin hilos). Banderas: la misma caja las 8 (aspect-ratio) y el nombre más grande según el ancho y las letras, con más contraste y una cartela suave.
- **Corrección de Pablo (27-oct) sobre el nazareno:** al revés: se dibuja al bajar por la portada y en «Próxima Semana Santa» aparece ya hecho, sólido («si no es muy repetitivo»).

## RETOMAR AQUÍ (27-oct, parado al 84 % del límite de 5 horas; se renueva hacia las 02:30)
Encargo de Pablo, literal: «Revisar y rehacer animación al clicar una capital en pantalla, se ve feísimo, nada inmersivo ni transformante; si tocas una bandera, igual».
Plan (no empezado):
1. **Una sola cámara de la provincia al plano** (`site/assets/site.js`, funciones `entrar`, `salir` y `moverAnd`; `site/assets/plano.js`, `volar`). Hoy el mapa de Andalucía se acerca con `viewBox` hasta un 1/22 y el plano de la ciudad aparece con fundido encima, en otra escala: ese es el corte. Plan: calcular el `vb` del plano en metros para que su primer encuadre coincida con la caja de la provincia en pantalla, y hacer un solo vuelo continuo de la provincia al plano. La provincia elegida gana el color de su capital; las demás se apagan y se hunden (`opacity` y `transform`).
2. **La provincia se convierte en el plano:** su contorno pasa a ser el borde del encuadre (máscara que crece); las calles se dibujan a trazo desde el centro (`stroke-dashoffset` sobre las principales, en una sola pasada) y las sedes caen escalonadas (ya tienen `--i`).
3. **La bandera tocada** sube a la cabecera y se queda como emblema (FLIP con `transform`); las demás se recogen. Ahora se ocultan con `opacity` (`portada.css`, «la colgadura no asoma cortada»).
4. **Volver** («← Andalucía») = lo mismo al revés; interrumpible; 1,2-1,8 s; con movimiento reducido, un fundido corto.
5. Grabar vídeo en móvil (390) y PC (1440, 1920) con Playwright, revisar fotograma a fotograma y mandarlo a Pablo **antes de subir**.
Ojo: el puerto 8093 lo usa el servidor de otra sesión; para probar, el 8097.
- **Detalle del fallo** (oc-marketing, notas compartidas fallo-portada-toque-capital.md, fallo-portada-toque-malaga.mp4 y .png; móvil 390×844): (1) durante 0,3 s se ve el pie «Cargando su plano…» con flechas y deslizador, y la página salta (el reloj se ve antes de saber el modo: ocultarlo fuera de temporada desde el principio); (2) el plano aparece diminuto y centrado sobre negro y luego salta a tamaño completo (es el vuelo desde «ancho × 3»: sustituirlo por la cámara continua desde la caja de la provincia); (3) las calles y los rótulos aparecen de golpe (dibujarlos con fundido o trazo).
- **Transición de la portada a la ciudad, hecha (27-oct):** una sola cámara en metros del plano (site.js «volarCamara»). El mapa de Andalucía se pinta con el mismo encuadre convertido a sus píxeles, así que el relevo al plano es un fundido sin cambio de escala. La provincia elegida queda debajo de las calles y se apaga al llegar; las demás se oscurecen al tocar; las calles menores, los rótulos y las sedes llegan al final; la vuelta es la misma cámara al revés. Rendimiento: el plano solo se pinta cuando se ve, durante el vuelo solo con las calles principales, y fuera el cordón discontinuo y el terciopelo del mapa en la ciudad (ampliados miles de veces eran el tirón). **Descartado:** mover el plano con «transform» desde un dibujo previo (en el móvil dejaba huecos sin pintar y calles borrosas). La cámara arranca tras crear el plano; el plano y los datos se piden ya al acercar el dedo o el ratón.
- **Emblema:** la bandera tocada baja (FLIP con transform) hasta el nombre de la ciudad y se queda a su lado como emblema; las demás se recogen.
- **27-oct (Pablo: «El verde ese, ¿por qué sale ahí?»):** el relleno de la provincia que usa la transición se quedaba pintado con su costa simplificada cortando la ciudad. Ahora se apaga del todo durante el vuelo y se borra al llegar. Recorridos del plano de la portada más visibles: con su color, más gruesos y con un filo oscuro debajo.
- **28-oct, LCP (aviso de oc-alojamiento):** el globo de la primera visita cargaba d3 y sus datos y animaba mientras se pintaba la imagen principal; en móviles lentos sumaba hasta 0,9 s al LCP (medido con CPU ×4 y red lenta: Cloudflare y GitHub Pages igual sin globo, unos 3 s). Ahora arranca tras el evento «load»; con el cambio, el LCP con globo es igual que sin él. Las cabeceras de Cloudflare no influyen.

## Hoy y Calendario con el lenguaje de Noticias (1 y 2-nov, oc-diseno, publicado en af31829)
- **Elegido:** cabecera de terciopelo compartida (`.nx-head.vx-head`), que toma el color de la capital con `data-head-capital`; clases propias `.hy-*` y `.cx-*` en `vida.css`, secciones 9 y 10; orden de paso común (`filaPaso`, `.hy-paso`) en las dos páginas.
- **Terciopelo con capital al 60 %, no al 74 % de Noticias:** con Almería, Huelva y Córdoba el oro no llegaba a AA (el auditor lo rechazó dos veces). Medido: oro 4,61:1 o más en las 8 capitales. Las cifras de `.nx-pulso` llevan velo oscuro solo en cabeceras con `data-head-capital`; Noticias sigue pendiente.
- **Descartado:** tocar `.oc-ev*` de forma global, porque también lo usa la agenda de la portada, cuyo plano y portada no son de este equipo. Va acotado con `:is(.cx-lista, .oc-miss)`.
- **Descartado:** corregir el orden de paso de Sevilla en la plantilla; viene de `orden` en los datos y se ha pasado a Coordinación.

## Buscar, Favoritos, Colabora y hora de carrera (2-nov, oc-diseno, auditor-diseno APTO en las cuatro)
- **Hora de carrera en vez de solo la salida:** el orden de paso es el de carrera oficial, así que esa hora va en oro con su etiqueta y la salida debajo. **Descartado** dejar las dos al mismo tamaño: no se veía cuál explica el orden. Sin dato (seis capitales y las vísperas), solo la salida. Las salidas extra no heredan la carrera (`!h.extra`).
- **Buscar sin cifras en la cabecera:** ya están en los accesos; repetirlas no aportaba nada. Al escribir no se anima nada porque se repinta con cada letra.
- **Favoritos:** `window.ocIcs` estaba dentro del bloque del Calendario y en Favoritos no existía, de modo que «Descargar mi Semana Santa» no hacía nada; ahora es global. «Mi Semana Santa» se recalcula al quitar y el foco pasa a la fila vecina.
- **Colabora:** estilos en línea pasados a `vida.css`; `colabora.js` sin tocar. Las pruebas interceptan `api.web3forms.com`: nunca se envía nada de verdad.

- **Aviso «Horarios de 2026» en Hoy y Calendario (2-nov):** solo fuera de temporada, para que no parezcan horas de 2027. **Al cargar los horarios de 2027 hay que subir `ANIO_HORARIOS` en `build.mjs`.** Descartado deducirlo de `hora_fuente`: 19 horas no tienen fuente.

- **Colores del hábito en la ficha (2-nov, publicado en b59486d):** salen de `tools/sources/habitos-colores.json`, los 100 textos de `habitos.json` pasados a mano por sección y prenda. **Descartado** seguir adivinándolos con expresiones regulares: se equivocaba de prenda («Capa roja» era la cruz de la capa) y no conocía colores como guinda, malva o corinto. Si el texto es ambiguo, la prenda no sale. `tools/diseno/comprobar-habitos-colores.mjs` solo comprueba que cada color esté escrito en su texto, no que vaya con esa prenda: **si cambia un texto, hay que repasar la tabla a mano.** `site/data/colores-habito.json` («En la calle», de Portada) aún no cuadra en 10 hermandades; avisado a Coordinación.

- **Ficha de hermandad: pocas bandas y marchas (3-nov, oc-diseno).** Pablo: «la cosa es ver unas cuantas y si quiero ver más me lleve a ese sitio para verlos mejor». En la ficha, 5 marchas y unas 3 bandas: de la guía del año, solo bandas (sin escuadras ni compañías), primero los pasos de los titulares (hasta 4 si son dos pasos de dos) y la Cruz de Guía solo si sobra sitio, sin las novedades de 2027; si no hay guía, 3 fichas de banda. **Descartado** cortar por el orden de la guía: en Mena escondía la banda de la Virgen (auditor). La banda de la propia hermandad sale siempre y no gasta sitio (Pablo: «ponla»): la marcada `propia` en los datos o la que lleva el nombre de la hermandad y es de su ciudad («Agrupación Musical Fusionadas», que los datos dan como no propia). **Descartado** fiarse solo del nombre: «Banda de Música María Santísima de la Esperanza» puede ser de otro pueblo. El resto, en `hermandad/<slug>/musica/`, **que solo se genera si algo no cabe: 223 páginas** (el catálogo une varias bases y hay fichas con hasta 141 marchas). Orden de las marchas, igual en la ficha y en la subpágina: las que toca su propia banda (repertorio), las dedicadas a un titular y las que tienen grabación; a igualdad, el orden de siempre (contrastadas primero), y las «sin verificar» al final. **Descartado** enlazar a Marchas filtrada (`?q=`): sin JS no filtra y el texto «Aurora» trae marchas de otras hermandades. La nota solo nombra los criterios que han contado. Prueba: `tools/diseno/probar-musica.py` (360/390/1440, claro, oscuro y sin JS; mide el desbordamiento con `clientWidth`, porque en móvil `innerWidth` crece con el contenido).

- **Nazareno pequeño y respaldo sin foto (3 y 4-nov, oc-diseno).** El nazareno de la ficha sale de `habitos-colores.json`, uno por sección: túnica, tocado (capirote, antifaz, capillo, caperuz, cubrerrostro: cónico; morrión, capucha o verdugo: redondeado), capa, escapulario, botonadura y cíngulo (con contorno, para que se vea aunque sea del color de la túnica). La prenda sin color va solo con su contorno; sin túnica no hay figura; sin cirio ni escudo, que no constan. **Sin foto de un titular** (86 fichas), el mismo nazareno con el hábito de la primera sección, o en trazo dorado si no está descrito (11): en la ficha, en lugar de la inicial; en el listado, el buscador y el plano, la lámina `assets/naz/<slug>.svg` (3:2, terciopelo de su capital, la escribe el build). **Al compartir:** `assets/og/h-<slug>.jpg`, 1200×630, hechas con `tools/diseno/og-respaldo.py` (Playwright y las letras de la web; ~43 KB cada una). **Descartado** sharp en el build: no está en la publicación y no lee las fuentes woff2. **Hay que volver a ejecutar `og-respaldo.py` cuando cambien hábitos o fotos:** guarda la huella de cada lámina en `assets/og/huellas.json` y el build solo usa la imagen si la huella es la de hoy; si cambió o falta, comparte la genérica y avisa al compilar («Aviso: N fichas sin foto comparten la imagen genérica…»). **Es aviso y no para la publicación** (Coordinación lo dejó a Diseño): lo que sale entonces es correcto, solo menos vistoso, y parar bloquearía a los demás equipos. Cuando Imágenes sube una foto, la ficha deja de usar la og del nazareno sola; la primera tanda salió con el dibujo anterior al arreglo del caperuz y el auditor lo cazó. Las filas de capitales, marchas, compositores e imagineros también llevan la lámina en vez de la inicial. Pruebas: `probar-nazareno.py` y `probar-respaldo.py`.

## RETOMAR AQUÍ (2-nov, sesión oc-diseno del sobremesa)
`EQUIPO/` y la nota del proyecto no se pueden editar desde este worktree, así que el punto de retomar queda aquí. Las cinco páginas están hechas. Sin hacer de P2/P3: 5 transiciones de ancho/alto en `site.css`, pestaña activa en fichas, colores de `vida.css` a tokens, contraste de `.nx-pulso b` en Noticias, enlaces del pie de 36 px, pasada completa final.
- **2-nov (Pablo: «el fondo debe ser el mismo oscuro y estrellado… no puede verse la web antes que la animación»):** el cielo de la landing (estrellas con gradientes CSS) va en línea en el HTML de la portada (`HEAD_ENTRADA`, build.mjs). `html.oc-entrando` lo pinta desde el primer byte y tapa la web; el globo y la portada usan ese mismo cielo, que se apaga en la ciudad. El globo arranca en «load» o a los 1,8 s, y al estar encima quita la capa; si falla, se quita al momento (onerror) y, sin JavaScript de por medio, a los 9 s por animación CSS. Una vez por visita, como antes.
- **Pendiente tras esto: revisión de uso de «En la calle»** (encargo de Pablo: «Añádele una revisión a la página de mapa para facilitar su uso»): encontrar capital, día y hermandad; gestos; legibilidad; botones de 44 px; «Mi ubicación»; accesibilidad; rendimiento. A 390, 768 y 1440 px. Lista priorizada con capturas para Pablo.

## RETOMAR AQUÍ (3-nov, Portada · plano, colores y «En la calle»; todo publicado, con el sí de Pablo)
- **Publicado:** 977f6c9 (plano más ligero y colores del hábito), b4dd664/encuadre (el medallón ya no queda bajo el reloj en pantallas anchas) y 8bc2a8f (díptico de titulares en `data/calle` → `sedes[i].dip`, para la hoja de sede de Diseño). auditor-mapas APTO en los tres.
- **Plano más ligero:** las calles menores van como trazado por celdas de 1 km (`celdasCalles` en `build.mjs`). El fondo de «En la calle» es una capa aparte que se desliza al arrastrar y se repinta al parar (`moverFondo`/`fijarFondo` en `calle.js`). Mediana de 5 pasadas a 390 px, antes → después:
  - Sevilla, arrastre por cuadro: WebKit 160 → 32 ms; Chromium con la CPU 4× más lenta, 320 → 82 ms. Toque, Chromium 4×: 149 → 52 ms.
  - Sevilla, parón en Chromium 4×: 560 → ~430 ms. Lo que queda es el montaje general de la página (349 ms), antes de que lleguen los datos: es de Alojamiento.
  - Málaga, arrastre: WebKit 96 → 33 ms; Chromium 4×, 162 → 95 ms.
  - Scripts de medida (`medir.mjs`, `traza.mjs`) en el scratchpad de la sesión del 3-nov, con Playwright 1.55.
- **Colores del hábito:** `tools/colores-habito.mjs` lee `tools/sources/habitos-colores.json`, usa la primera sección y los nombres tal cual. Servitas de Málaga y La Resurrección de Cádiz llevan solo un tono neutro (`coln0`), sin «Hábito» en la ficha. No se toca `site.js`.
- **Revisión de uso de «En la calle» (Málaga primero):** la Pasión del 14-nov se ve bien. Avisado a coordinación de lo que no es de Portada:
  - Diseño (`site.css:1882`): en tableta con la ficha abierta, el reloj sube y tapa el medallón.
  - Diseño: la barra de la hora mide 28 px y debería tener 44.
  - erCuñao: a 390 px su botón tapa la esquina del plano.
- **Pendiente:**
  - **Decidido por Pablo (3-nov), literal: «No, primero se toca y luego sale el recorrido».** También en las jornadas de una sola cofradía (extraordinarias), el recorrido solo se dibuja al tocarla. No se cambia.
  - Opcional: aligerar los datos de las cofradías (472 KB en Sevilla).

- **Barra de abajo y cabecera de capital en móvil (4-nov, oc-diseno; fallos de la pasada integrada).** La barra marcaba «Hoy» en capitales, fichas y el plano; ahora «Hoy» solo en /hoy/ y lo que está dentro de «Más» (capitales, hermandades, bandas, marchas, calendario, el plano…) marca «Más», con su píldora. Toca el layout común. En la cabecera de capital (y /musica/ y bandas), hasta 859 px el texto deja libre el hueco de la colgadura, con la misma posición y ancho que ella (antes la entradilla y las cifras pasaban por debajo). **Descartado** el degradado bajo la colgadura: tapaba la foto de la capital. Prueba: `tools/diseno/probar-cabecera-barra.py` (360/390/768/1440).

## RETOMAR AQUÍ (5-nov, oc-diseno del sobremesa)
Cola en `EQUIPO/AUDITORIA-DISENO.md` → «Cola para el 4-nov» (carpeta principal). Estado:
- **Publicado con el sí de Pablo:** bandas y marchas (5faea1e), banda propia (3ec5d4b), nazareno, respaldo sin foto, barra y cabecera, imagineros (191a614..9c234d7), miniaturas del díptico y arreglos del auditor (9c234d7..25d4e55; e7c1ba6 ya auditado: NO APTO y luego APTO).
- **Publicado también (5-nov, con el sí de Pablo):** hoja de sede (punto 3), plano y En la calle sin iniciales, medallón neutro y arreglos de los auditores (153430b..8e074a9; APTO de auditor-diseno y auditor-mapas). La prueba de la hoja de sede no cerraba la hoja entre sedes (selector equivocado); corregida, da 400/400 contra pages.dev con los tres casos.
- **Publicado también (5-nov, con el sí de Pablo; última subida de esta tanda):** punto 4. Volver arriba en toda la web, reloj de En la calle de 44 px, crédito de OSM bajo la leyenda, erCuñao que se aparta del reloj, botones fijos al pie de la ficha de cofradía en el móvil y reloj acortado hasta el panel desde 600 px. APTO de auditor-diseno y auditor-mapas tras un NO APTO. Pruebas: `probar-arriba.py` 424/424 y `probar-hoja-sede.py` 400/400. **Orden de Pablo: parar aquí** hasta nuevo encargo.
- **Pendientes:**
  - La ficha nueva de la Soledad (Humildad) no tiene foto ni imagen para compartir propia: pasar `tools/diseno/og-respaldo.py`, solo si Pablo lo pide.
  - El díptico queda unos 11 px más bajo en las filas de capital e imagineros: subirlo al borde de arriba solo ahí.
  - En el 404, la barra marca «Más» (`masAqui` falso en el 404).
  - Observaciones de los auditores: un fondo tenue tras el crédito de OSM (se mezcla con las calles y la ruta); unificar «Ver la hermandad» (ficha de En la calle) y «Ver su ficha» (hoja de sede); con la ficha abierta desde 600 px, los botones de zoom quedan bajo el panel (ya pasaba antes).
- **Amparo (Sevilla, 8 nov):** es de gloria y no tiene ficha a propósito. En En la calle lleva el medallón neutro (`assets/naz/_neutro-<capital>.svg`), sin letra.

## Miniaturas del díptico y hoja de sede (4 y 5-nov, oc-diseno)
- **Díptico 3:2 en las miniaturas:** la caja sigue de 64×64 (40×40 en el buscador) y la foto entera va dentro, en 3:2 y centrada. *Descartado:* ensanchar la caja a 96 px. Se veía mejor la foto, pero el texto de esas tarjetas empezaba más a la derecha (columna desigual) y rompía la regla de Pulido (solo cambia la imagen, no la tarjeta).
- **Hoja de sede:** titulares arriba: díptico Cristo | Virgen; si no, una foto (juntos, Cristo o Virgen); sin ellas, la lámina del nazareno. Nunca la miniatura del punto ni la foto de la sede (es el templo, no la hermandad). En el móvil, a media altura (62dvh) con desplazamiento dentro; se cierra arrastrando la asa, como todas las hojas. *Descartado:* que la asa la estire hacia arriba (toca el código común de todas las hojas; con el desplazamiento dentro basta).
- **Plano y En la calle:** los puntos recortan la foto en un círculo, así que las hermandades sin foto guardada en la web llevan un medallón cuadrado (`assets/naz/<slug>-r.svg`) en vez de la lámina 3:2. Así plano.js y calle.js (de Portada) no cambian. Incluye las que solo tienen foto enlazada a Commons, que el plano no puede usar.
- **Imágenes para compartir:** `assets/naz/og.json` lista las hermandades sin ninguna foto. `og-respaldo.py` solo genera esas, porque ahora hay láminas también para las que tienen escudo o foto de la sede y no necesitan imagen propia.

## Volver arriba y reloj de En la calle (5-nov, oc-diseno)
- **Volver arriba:** botón redondo de 44 px (fondo de la web, flecha en el color principal y borde dorado de 2 px) que aparece pasadas dos pantallas; en las páginas cortas, pasado algo más de la mitad del recorrido. Va encima de erCuñao y, cuando erCuñao se esconde al bajar, ocupa su sitio; al subir, quedan los dos apilados. En «En la calle» (móvil) va a la derecha, sobre el reloj, porque erCuñao está a la izquierda. Nunca encima de un plano: si el plano está a su altura, se esconde. Sube con desplazamiento suave (de golpe con «reducir movimiento») y deja el foco en el contenido. *Descartado:* mostrarlo solo al subir (como erCuñao). Así no estorba al leer, pero quien llega al final tendría que subir un poco para encontrarlo. *Descartado también:* ponerlo abajo a la izquierda. No chocaba con nada, pero quedaba lejos del pulgar y separado de los otros botones flotantes.
- **Reloj de En la calle:** la barra de la hora pasa de 28 a 44 px para tocarla, sin crecer el reloj (márgenes negativos), y «Ahora» pasa de 40 a 44 px. erCuñao sube a 106 px sobre la barra de abajo (a 92 px rozaba el reloj). Como el reloj sube y baja con el final del plano, erCuñao además se aparta (se vuelve invisible) mientras el reloj o el crédito pasan por su sitio, y al bajar se esconde del todo tras la barra. En el móvil en horizontal el reloj deja de acompañar al desplazar (no es sticky), porque en 390 px de alto tapaba el plano, sus botones y la cofradía.
- **Crédito de OpenStreetMap:** va arriba a la izquierda, bajo la leyenda Ida/Regreso (arriba del todo si no hay leyenda). *Descartado:* dejarlo abajo y subirlo 48 px. El reloj es sticky y pasa por encima de cualquier punto del borde de abajo al desplazar, así que solo funcionaba en reposo.
- **Ficha de una cofradía abierta:** en el móvil, los botones (Cómo llegar, Apple Maps, Ver la hermandad) van fijos al pie de la hoja, como «Ver su ficha» en la hoja de sede. Desde 600 px (panel a la derecha), el reloj se acorta hasta el borde del panel; antes, en tableta, se iba fuera de la pantalla. Volver arriba se aparta mientras la ficha está abierta.
- **Volver arriba con «reducir movimiento»:** el desplazamiento y la pulsación usan `translate` y `scale`, no `transform`, porque la regla global `:active { transform: none !important }` lo movía 64 px al pulsarlo y el toque caía en lo de debajo. Prueba: `tools/diseno/probar-arriba.py`, con un toque real recién bajado y un recorrido de En la calle cada 60 px.

## (anterior) RETOMAR AQUÍ (4-nov, oc-diseno del sobremesa)
Cola en `EQUIPO/AUDITORIA-DISENO.md` → «Cola para el 4-nov» (carpeta principal, no este worktree). Estado:
- **Subidos:** bandas y marchas de la ficha (5faea1e) y banda propia (3ec5d4b).
- **Hechos en la rama, sin subir (piden el sí de Pablo; la barra toca el layout común: avisar a Coordinación antes):** nazareno pequeño (ba2f667, 75c82d8, 999bdfa: APTO a la 3.ª), respaldo sin foto (317ab6f + 4d03b00: 2.ª revisión en curso) y barra y cabecera (4bbaefa: en auditoría). Cuando estén los APTO: rebase, compilar, pedir el sí y subir los tres juntos (van en línea).
- **Pendientes, por orden:** 2c) miniaturas 3:2 del díptico `d-<slug>` en el listado y el buscador (también Hoy, Calendario y Favoritos), solo la proporción: las tarjetas son de «Pulido estético»; 3) hoja de sede con díptico desde `D.sedes[i].dip` (subido en 8bc2a8f), respaldo `assets/naz/<slug>.svg` sin foto y fondo opaco; comprobar el medallón en tableta (4ee0b1d), no rehacerlo; 4) Volver arriba (layout común: avisar a Coordinación antes de subir; no tapar el plano ni el crédito de OSM), reloj y barra de la hora de 44 px.
- Compilar sin pisar la web que audita otro: `DIST_DIR=dist-b node build.mjs` y servir con `DIST_DIR=dist-b PORT=8092 node serve.mjs` (dist-b está en `.git/info/exclude`).
- Textos fijos nuevos que afirmen algo: registrarlos en `tools/sources/textos-autor.json` (`node tools/comprobar-fuentes-textos.mjs`).

## (anterior) RETOMAR AQUÍ (3-nov, oc-diseno del sobremesa; encargos de hoy, orden de Coordinación)
Empiezan cuando Pablo diga «sigue». Cada bloque se sube por separado: rebase justo antes, auditor-diseno, 390/1440 en claro y oscuro, el sí de Pablo y aviso a Coordinación con el hash.
1. **Ficha de hermandad, bandas y marchas:** pocas (unas 3 bandas y 5 marchas). Primero su propia banda, las dedicadas a sus titulares y las que tienen grabación, solo con lo que digan los datos; si no, el orden actual. Enlace «Ver las N marchas» / «Ver todas las bandas» a una subpágina o a Marchas filtrada (lo que menos pese; si son subpáginas, avisar del total). Sin JS y sin perder nada en el buscador. Probar con la Aurora del Albaicín (Granada): Marketing la graba el 4-nov antes de las 17:00.
2. **Nazareno pequeño en la ficha:** SVG del nazareno de la portada (de Portada; avisar si hay que tocar el compartido), colores de `habitos-colores.json`, figura por sección si cambian, prenda sin color neutra o sin figura, contorno en oscuro, texto alternativo con los colores, movimiento nulo o sutil y apagado con prefers-reduced-motion. Entregar la lista de fichas sin color.
3. **Botón «Volver arriba» en toda la web:** aparece tras unas 2 pantallas, desplazamiento suave (salto directo con movimiento reducido), colores y borde dorado de la web, 44 px o más, aria-label «Volver arriba», foco visible; sin chocar con la barra de abajo ni con erCuñao. Toca la plantilla común: avisar a Coordinación antes de subir.
4. **Hoja de sede del plano «En la calle»** (`site.js`, `fichaHerm`; cuidado con `apply`, que cambió Alojamiento): media altura, arrastrable, datos compactos (hermandad, día, salida, recogida si existe, hábito con muestras, «Ver su ficha», «Cómo llegar»). Qué foto va y su encuadre lo decide la sesión de Imágenes: aquí solo la hoja y el respaldo sin foto (nazareno o escudo). Si hace falta un campo de encuadre, pedírselo a Coordinación.
   - **Campos fijados por Imágenes (3-nov):** cada foto del díptico (`h.diptico.cristo|virgen|juntos`, de `data/imagenes.json → titulares`) trae `foco` (object-position; si falta, `50% 22%`). En el plano (formato final, Portada bdd37da, aún sin subir): `D.sedes[i].dip = {c?, v?, j?}`, cada uno `{src: '/assets/img/t-<slug>-<tipo>-480.webp', foco?, alt, credito, url}` (`url` vacía: crédito sin enlace). Con c y v, díptico; si no, j, c o v a todo el ancho; sin `dip`, el respaldo. **No subir la hoja antes que bdd37da**: tras el rebase, comprobar que `D.sedes[i].dip` existe. Probar antes con datos de ejemplo locales que no se suban. **Nunca `img` ni `diptico.sede` como titular** (pueden ser sayón o templo). En la ficha el `foco` va en línea en el `<img>`: no fijar object-position en CSS que lo pise.

## 4-nov · Orden de las 5 marchas de la ficha de hermandad (Alojamiento, en la zona de Diseño)
- **Qué:**
  - Primero van las marchas «destacadas» a mano en `site/data/marchas-destacadas.json` (elección editorial).
  - Después, las dedicadas a un titular concreto (`titularDed`), las que toca su propia banda y las que tienen grabación.
  - Antes iba primero la banda propia, luego el titular y luego la grabación.
- **Por qué:** en la ficha de la Aurora (Granada) no salía «Y amaneció en tu Albayzín», la marcha del vídeo de Marketing. La hermandad tiene 42 dedicadas y en los datos solo «Lucero del Albayzín» indica titular, así que ninguna regla automática la subía. Pablo: «claro, hay que arreglarlo».
- **Descartado:** deducir el titular del texto de la dedicatoria. Ese texto casi siempre es el nombre completo de la hermandad, que ya incluye a todos sus titulares, así que no distingue nada.
- **Efecto:** cambian 4 de 284 fichas: la Aurora, y Humildad, Pasión y Penas de Málaga, donde suben las dedicadas a un titular.
- **Diseño:** el cambio está en `pageHerm` (`peso`, `criterios`, `destacar`) y en la constante `DESTACADAS`, justo encima. Hay que hacer rebase.

## 5-nov · Fotos de medios que no responden nunca en Noticias (Alojamiento)
- **Problema:** el run 41977361510 falló porque /noticias/ no llegó a «load» en 45 s. La causa: si el servidor de un medio no contesta, la foto destacada (no es perezosa) deja la página «cargando» para siempre. La página se ve y se puede usar (medido: LCP igual, 44 enlaces), pero el navegador no termina nunca.
- **Medido en la web publicada:**

  | | DCL | LCP | load |
  |---|---|---|---|
  | 390 px, 4G lento y CPU 4× | ~4,0 s | 2,6–3,6 s | 4,5–5,1 s |
  | 1440 px | 0,3–0,45 s | 0,46–0,8 s | 0,34–0,47 s |

  Hay 3 peticiones externas, que suman 513 KB. La más lenta es la destacada de s2.ppllstatics.com, con 2,5–2,8 s en 4G lento.
- **Elegido:** en `site.js`, junto a `dropImg`, si a los 20 s la página aún no ha terminado de cargar, se cortan las fotos de medios que siguen a medias y que de verdad frenan la carga: la destacada y las perezosas a menos de 1250 px de la pantalla. La noticia se queda con texto.
- **Resultado en Chrome:**
  - con los medios colgados, «load» llega a los 20 s y solo se quita la destacada;
  - con fotos que tardan 12 s, no se quita nada.
- **Lo que se acepta:** en una conexión lentísima, donde la foto tarda más de 20 s, la destacada se quita y la tarjeta da un salto. Es mejor que dejar la página cargando sin fin.
- **Límite:** en WebKit (Safari), quitar la foto no libera «load»; la petición colgada sigue frenándolo. Allí no es peor que antes.
- **Descartado:**
  - Cortar todas las fotos sin terminar a 2500 px: el auditor vio que se llevaba hasta 6 perezosas que ni se habían pedido.
  - Cambiar la prueba de humo a domcontentloaded: escondería una lentitud propia. Queda como mejora opcional que la prueba aborte al instante las imágenes de otros dominios.

## 5-nov · Ajustes de Cloudflare (Alojamiento, con el sí de Pablo: «Los 4»)
- **Detalle completo y cómo deshacer cada cambio:** `EQUIPO/CLOUDFLARE-AUDITORIA.md`.
- **Aplicado:**
  - Tiered Cache Smart Topology: para deshacerlo, `value: off`.
  - Informes de DMARC de Cloudflare: añaden `rua` y mantienen `p=none`; el correo no cambia.
- **No aplicado** (la caché de datos se queda así por decisión de Pablo, 5-nov: «Déjalo así»):
  - Crawler Hints: la API no deja con este acceso (405). Lo tiene que activar Pablo en el panel.
  - Caché de datos.ochocapitales.com: auditor-web dio NO APTO porque el CORS va por origen y la caché de Cloudflare no separa por origen, así que podría bloquear news.json o dejar noticias atrasadas. Si se hace, antes hay que poner `Access-Control-Allow-Origin: *` con una regla de cabeceras.
- **Descartado:** meter el origen en la clave de caché. Probablemente es de pago y lo complica.
- **Ojo:** nunca activar «ignorar query string» en esa caché. El vigía pide `news.json?c=…` para saltársela.
