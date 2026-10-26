# PROGRESO · Rutas de Córdoba con el método nuevo

Órdenes: `ORDENES-RUTAS-METODO-NUEVO.md` (carpeta original). Sesión «Rutas · Córdoba», rama `claude/rutas-cordoba-1f33f9`.

## Fase 1 · Datos (2026-10-26, hecha)

### Fuentes
1. **Rejilla oficial de la Agrupación** (`Itinerario Córdoba 2026.pdf`, https://www.hermandadesdecordoba.es/itinerario-2026/), ya leída en `tools/itinerarios/cordoba-2026.json`. Para cada hermandad da un punto cada 10 minutos de la cruz de guía y otro del final del cortejo, con las horas de salida, entrada, carrera oficial y Catedral. Es oficial, pero no es una lista redactada: puede saltarse calles cortas.
2. **Guías de El Debate · La Voz de Córdoba 2026**, una por día: el **recorrido calle a calle, literal y en orden**, y el templo o casa de salida. Cubren 38 de 42. URLs en `tools/itinerarios/cordoba-prensa-2026.json`.
3. **Librito oficial de itinerarios y horarios 2026 de la Agrupación** (https://www.hermandadesdecordoba.es/wp-content/uploads/2026/10/LIBRITO-DE-ITINERARIOS-Y-HORARIOS.pdf) y **fichas de cada hermandad** en hermandadesdecordoba.es: sede canónica.
4. **OpenStreetMap** (edificio del templo; calle por Nominatim) y **Wikidata** (dos templos que OSM no tiene con nombre): posición de la sede.

### Archivos
| Archivo | Qué es |
|---|---|
| `tools/itinerarios/listas-cordoba.json` | **Lista de cada hermandad** (42): `calles` en orden; `elementos` con tipo (salida, calle, entrada_co, catedral, salida_co, entrada), tramo (ida/regreso), fila de la rejilla de la cruz de guía y del final, horas, y `origen` (prensa y rejilla / solo prensa / solo rejilla); `diferencias` entre las dos fuentes; sede. |
| `tools/itinerarios/listas-cordoba.mjs` | Lo genera: `node tools/itinerarios/listas-cordoba.mjs`. El orden lo da la prensa; la rejilla intercala sus calles y pone las marcas de la carrera oficial y la Catedral. |
| `tools/itinerarios/cordoba-prensa-2026.json` | Recorrido y horario literales de El Debate, con la URL de cada guía. Lo generan `leer-debate-cordoba.mjs` (HTML guardado de las 6 guías) y `prensa-cordoba.mjs`. |
| `tools/itinerarios/casas-hermandad-cordoba.json` | **Sede de cada hermandad**: templo, fuente, punto, calle y fuente del punto. Casos especiales con `salida`, `casa_hermandad` o `nota`. |

Recuento: 1.042 calles en las 42 listas; 797 las dan las dos fuentes, 20 solo la prensa y 226 solo la rejilla (sobre todo Triunfo, que la prensa no nombra, y calles cortas).

### Correcciones a la rejilla y a la prensa (todas en el código, con su motivo)
- **El Perdón:** el lector no recogía la columna de la cruz de guía. Está transcrita a mano del PDF (`PERDON_CRUZ`).
- **Buena Muerte:** la columna del final del cortejo salía con el regreso delante (madrugada). Se reordena empezando en SALIDA.
- Se quitan restos del lector: el rótulo «Entrada Triunfal» colado en otras columnas, «El Perdón» al pie del Nazareno, «''''''''''+`3» y «(P. PERDÓN)».
- **Erratas de la guía de prensa:** se muestra el nombre de la rejilla y se guarda el de la prensa. Son «Mayor de Santa Catalina» (Mayor de Santa Marina, en la Merced), «Pintor Bartolomé Blanco» (Párroco Bartolomé Blanco), «Virgen del Perpetuo Socorrro», «Rafae de la Hoz» y «San Pablo plaza de San Andrés».
- En la guía del Perdón y en la del Cristo de Gracia van cruzados el horario y el recorrido. También se quita la repetición «San Fernando, Diario de Córdoba» de la Entrada Triunfal.

### Sedes que hay que saber
- **Agonía:** en 2026 salió **de forma excepcional del Santuario de la Fuensanta**, según El Debate (31-03-2026) y la rejilla, que empieza en la Plaza del Santuario de la Fuensanta. Se recogió en su parroquia de **Santa Victoria del barrio**, en la calle Párroco Agustín Molina 22, no en la iglesia de Santa Victoria del centro.
- **Sentencia:** sale y se recoge en su **casa de hermandad del pasaje Saravia** (El Debate), no en San Nicolás de la Villa. No consta el número de la casa: el punto está en el centro del pasaje.
- **Prendimiento:** el librito pone «Parroquia de San Andrés», pero la ficha de la Agrupación, la prensa («colegio de Salesianos») y la rejilla, que empieza por Santo Domingo Savio y María Auxiliadora, dan el **Santuario de María Auxiliadora**. Se toma este.
- **Piedad:** la guía de El Debate dice que se recoge a las 00.25 en los Jardines del Obispo. La rejilla oficial y el librito dan el regreso hasta su templo, con entrada a las 03.50. Se sigue la rejilla.

### Falta
- **Sin recorrido de prensa** (solo rejilla oficial, que puede saltarse calles cortas): La O y Lágrimas (Sábado de Pasión), Dolores de Alcolea y Resucitado (este, además, solo con la columna de la cruz de guía).
- **Sede sin edificio localizable** (ni en OSM ni en Wikidata): **La O** (Parroquia de Nuestra Señora de la Aurora; posible candidata, sin confirmar, la «Parroquia de la Asunción» de OSM a unos 80 m de la Plaza Mahatma Gandhi), **Perdón** (Iglesia de San Roque, calle Buen Pastor), **Piedad** (Parroquia de San Antonio María Claret) y **Soledad** (Santa María de Guadalupe). La salida se fija a mano en el editor.
- Dirección con número: solo la tienen San Fernando (Goya 24), San Nicolás de la Villa (Duque de Fernán Núñez 21) y Santa Victoria (Párroco Agustín Molina 22). En el resto, la calle del templo según OSM.

## Fase 2 · Trazado (2026-10-26, hecha y publicada)

**Las 42 hermandades están trazadas con el método nuevo y publicadas** en `site/data/recorridos/cordoba.json`.

### Cómo se rehace
Desde `tools/itinerarios/`:
1. `node listas-cordoba.mjs` → `listas-cordoba.json`.
2. `node --dns-result-order=ipv4first callejero-extra-cordoba.mjs` (una vez por caché) → añade a `cache/osm-cordoba.json` Alcolea, el Puente Romano y la Carretera Palma del Río. Antes hay que copiar a `cache/` el `osm-cordoba.json` de la carpeta original y lanzar `node rutas/descargar-puertas.mjs cordoba`.
3. Desde `rutas/`: `node lista-cordoba.mjs` → `listas/cordoba.json` y alias. Después `node emparejar.mjs cordoba`, `node evaluar.mjs cordoba`, `python -I capturar.py cordoba` y `node publicar.mjs cordoba`.
4. `node site/build.mjs`.

### Qué se ha añadido al código común (sin cambiar Málaga: Pasión, La Paloma y El Rico salen idénticas)
- **Lista:** opción `catedral` por hermandad. En Córdoba se entra por la puerta del Perdón y se sale por la de Santa Catalina; la Buena Muerte, el Resucitado y el Cristo de Gracia salen otra vez por el Perdón.
- **`TEMPLO`:** acepta «Real Iglesia…» y «Real Colegiata…».
- **Nombres de vía:** se lee también `bridge:name`. El Puente Romano está en OSM como puente sin nombre de calle.
- **Aviso:** Dolores del Puente (Málaga) no sale igual dos veces seguidas ni siquiera con el código de `main` sin tocar. No es por estos cambios.

### Resultado (evaluador común, frente a lo que había publicado)
- **Hasta 36 «nuevo» y 6 «revisar».** Las 6 «revisar» se publicaron tras mirar las capturas: ganan mucho en retrocesos (por ejemplo, 12→2 en el Rescatado y 11→2 en el Prendimiento) y pierden un paso corto cada una.
- **Sin ninguna recta de más de 150 m.**
- **Sedes:** las 38 localizadas quedan a 0-31 m de la salida y de la entrada.
- **Ganancias:** la Piedad pasa de 34/42 a 41/42 calles y Dolores de Alcolea de 0/10 a 10/10. La Sentencia, el Vía Crucis, la Expiración y el Descendimiento recorren de 2 a 3 calles más que antes.
- **Comprobado en el navegador** (servidor propio en el puerto 8197) a 1440 y 390 px: plano con ida continua y regreso discontinuo, panel con las horas oficiales y nota de fuente con enlace. Sin desbordamiento horizontal en móvil (375 px de contenido en 390). Sin errores de consola del sitio.

### Lista para Pablo · qué mirar en el editor
Se abre con `tools/itinerarios/editor/Abrir editor de rutas.bat`; se elige Córdoba.

**Las 4 sedes que faltaban, ya fijadas** con las direcciones que dio Pablo en el chat el 2026-10-26. Salida y entrada quedan a 0-6 m:
- **La O:** Plaza Mahatma Gandhi s/n. Punto: centro de la plaza en OSM, porque el edificio no figura con ese nombre.
- **Perdón:** Calle Buen Pastor 17. Punto: puerta de OSM con esa dirección (node 13060087577).
- **Soledad:** Avenida del Veintiocho de Febrero 10. Punto: el templo «Franciscanos» de OSM (way 556809635), a 14 m de la calle 28 de Febrero. Pablo apunta que en años recientes ha salido de su casa de hermandad de Cronista Rey Díaz, pero El Debate 2026 dice que salió del templo, y se toma el templo.
- **Piedad:** Calle Las Lomas 14. **Punto aproximado:** el número no consta en OSM y se toma el punto de Las Lomas más cercano a Sierra de Guadarrama. **Mirarlo en el editor.**

**Publicadas tras revisarlas** (pierden un paso corto que el trazado anterior sí pisaba):
- Rescatado, Ánimas y Cristo de Gracia: la glorieta de Puerta Nueva. El trazado pasa por el cruce, no rodea la glorieta.
- **Presentación al Pueblo, resuelto:** un punto de paso en el centro de Hermanos Pinzones (`rutas/correcciones-cordoba.json`, con fuente) hace que recorra las 40 calles. Deja un pequeño pico en ese punto. Comprobado en OSM que Hermanos Pinzones no linda con la parroquia de San Vicente Ferrer: es la 7.ª calle de la lista, entre Núñez de Balboa y Francisco Pizarro.
- Santa Faz: paseo de la Victoria (15 m).
- Prendimiento: plaza del Potro (15 m).

**Tramos largos que rellena GraphHopper** (las dos calles seguidas de la lista no se tocan en OSM; el camino es el más corto a pie, no un dato oficial):
- **Piedad:** Electromecánicas → Escriba Lubna (739 m) y Escriba Lubna → Ingeniero Benito Aranda (1.163 m), por la Carretera de Palma del Río, que OSM tiene a trozos y con otros nombres (A-431).
- **Conversión:** plaza de Electromecánicas → Manuel Fuentes Bocanegra (976 m) y José María Martorell → avenida de la Fábrica (831 m).
- **Agonía:** Fuente de la Salud → Deán Francisco Xavier (438 m).
- **Estrella:** Paseo de las Margaritas → Alonso de Burgos (326 m). Faltan los Jardines de la Agricultura, que no son calle en OSM.
- **Lope de Hoces → Puerta de Almodóvar** (211 m), que sale igual en Esperanza, Sentencia, Santa Faz y Perdón.

**Lugares de la lista sin calle en OSM** (no se trazan; no se inventa): Calahorra (Vera Cruz, Amor, Descendimiento), jardines de Fray Ricardo y Paz y Esperanza (Sangre), Jardines de la Merced (Paz), Arco de Caballerizas (Pasión), plaza Ruiz de Alda (Resucitado), Practicante Pedro Berná (Dolores de Alcolea), Soldado Diego García Paredes y «puerta de San Catalina» (Presentación).

**Nombres que OSM escribe distinto**, resueltos con `alias-calles-cordoba.json`:
- «Cuesta del Colodro» es la Calle Puerta del Colodro de OSM. Una guía la llama así y otra, «puerta del Colodro», en el mismo punto.
- «General Pedro A. Echevarría», en Alcolea, es la Calle Soldado Pedro Agustín de Echevarría de OSM. Es el mismo nombre con el título cambiado. **Confirmar.**
- Erratas: «Pablo Picaso», «Borja y Pavón», «Pintora María Blandchard», «Fuenteventura», «Doctor Marañón» y «puerta de Almodóvaar».

**Datos que conviene confirmar:**
- **Prendimiento:** sale del Santuario de María Auxiliadora, aunque el librito pone San Andrés.
- **Piedad:** la rejilla da el regreso a su templo y la prensa la recoge en los Jardines del Obispo. Pablo confirmó el 2026-10-26 que vale la rejilla oficial.
- **Sentencia:** el punto de la casa de hermandad está en el centro del pasaje Saravia, porque falta el número.
- **Resucitado:** solo hay rejilla de la cruz de guía, sin lista de prensa.

## Punto exacto (2026-10-26)
- **Córdoba publicada entera.**
- **Segunda vuelta:** se fijaron las 4 sedes y Hermanos Pinzones. Las 42 se trazaron otra vez con el arreglo de colocación de puntos de Málaga (57bdbe1) y el evaluador las deja en «nuevo». Comprobado con Playwright a 1440 y 390 px, sin errores de consola.
- **Lo siguiente:** que Pablo revise el resto de la lista en el editor. Con sus correcciones: `node rutas/emparejar.mjs cordoba <id>`, `evaluar`, `publicar … --forzar`, build y Playwright.
