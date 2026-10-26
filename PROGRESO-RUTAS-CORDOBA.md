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

### Estado de la revisión (2026-10-26, tercera vuelta)
Se puede abrir el editor con `tools/itinerarios/editor/Abrir editor de rutas.bat` y elegir Córdoba.

Las respuestas que Pablo pegó en el chat se comprobaron una a una en OpenStreetMap. Solo se aplicó lo que cuadra con el mapa y con el orden de las listas oficiales.

**Sedes: las 42 localizadas.** Salida y entrada quedan a 0-31 m.
- **La O:** Parroquia de la Aurora, en la Plaza Mahatma Gandhi. El punto es el edificio de OSM way 96693634, que OSM llama por error «Parroquia de la Asunción»; Pablo confirmó que es la Aurora. **Habría que corregir ese nombre en OSM.**
- **Perdón:** Calle Buen Pastor 17. El punto es la puerta de OSM con esa dirección (node 13060087577).
- **Soledad:** el templo «Franciscanos» de OSM (way 556809635), en la calle 28 de Febrero. Confirmado que en 2026 salió del templo.
- **Piedad:** Calle Sierra Nevada 1, en la esquina con Sierra de Guadarrama, que es su primera calle oficial. El punto es ese cruce, porque el edificio no está en OSM.
  - En OSM, Las Lomas queda a unos 230-270 m de Sierra Nevada y de Sierra de Guadarrama, así que no forman una sola manzana. Para el trazado no cambia nada.
- **Sentencia:** casa de hermandad en el Pasaje Saravia 2. El punto es la puerta de OSM con esa dirección (node 13653571571).
- **Prendimiento:** Santuario de María Auxiliadora (confirmado).

**Confirmado por Pablo:**
- La glorieta de Puerta Nueva se cruza por el centro.
- «General Pedro A. Echevarría» es Soldado Pedro Agustín de Echevarría.
- «Cuesta del Colodro» es Puerta del Colodro.
- El regreso de la Piedad sigue la rejilla oficial.

**Lugares resueltos con alias** (comprobado que tocan a sus vecinas de la lista):
- **Jardines de Fray Ricardo:** Plaza de las Doblas (Sangre).
- **Paz y Esperanza:** Plaza de Capuchinos (Sangre).
- **Jardines de la Merced:** Plaza de Colón (Paz).
- **Jardines de Vallellano:** Avenida Conde de Vallellano (Cena y Conversión).
- **Plaza Ruiz de Alda:** hoy es la Plaza Puerta del Rincón (dato de Pablo). En OSM toca Alfaros y queda a 27 m del Pasaje de la Estrella. El Resucitado recorre ahora 20/20.
- **Soldado Diego García Paredes:** Calle Soldado García Paredes (Presentación, que ahora recorre 41/41).
- **Arco de Caballerizas:** punto en el cruce de Caballerizas Reales con Enmedio, que es su sitio en la lista (Enmedio → Arco → Caballerizas Reales). La Pasión recorre ahora 17/17.

**No aplicados porque no cuadran con el mapa o con la lista:**
- **Plaza Ruiz de Alda = Plaza de Santa Marina (Resucitado):** en la lista va entre el Pasaje de la Estrella y Alfaros, y la Plaza de Santa Marina está a 216 m de Alfaros. Después Pablo dio el dato bueno: es la Plaza Puerta del Rincón.
- **Conversión, «entra por Periodista Quesada Chacón y Camino de los Sastres hasta Manuel Fuentes Bocanegra»:** Periodista Quesada Chacón no está en OSM. Camino de los Sastres queda a 619 m de Bocanegra y en la lista oficial va después de Antonio Maura. Se deja el tramo automático.
- **Conversión, «de Electromecánicas a Manuel Fuentes Bocanegra por Manolete y Antonio Maura»:** la lista pone Bocanegra antes de la Avenida de Manolete. Se deja el tramo automático.
- **Jardines de la Agricultura (Estrella), «Avenida de América o de los Mozárabes»:** ninguna de las dos toca a la vez el Paseo de las Margaritas y Alonso de Burgos. Pablo dio el tramo por bueno.
- **Calahorra:** la respuesta («Acera del Arrecife o la Bajada del Puente») no es concreta. El trazado ya pasa entre la Bajada del Puente y el Puente Romano, que es donde está la torre.

**Dados por buenos por Pablo** (el tramo lo rellena GraphHopper):
- **Piedad:** de Electromecánicas a Escriba Lubna y a Ingeniero Benito Aranda, por la Carretera de Palma del Río.
- **Conversión:** de José María Martorell a la avenida de la Fábrica.
- **Agonía:** de Fuente de la Salud a Deán Francisco Xavier.
- **Estrella:** del Paseo de las Margaritas a Alonso de Burgos.
- **De Lope de Hoces a la Puerta de Almodóvar:** el trazado ya va por Tejón y Marín, como dijo Pablo.

**Quedan solo con la rejilla oficial** (sin lista de calles completa), por decisión de Pablo: La O, Lágrimas, Dolores de Alcolea y Resucitado.

**Siguen sin calle en OSM** (no se trazan; no se inventa):
- Practicante Pedro Berná, en Alcolea (Pablo: déjalo así).
- «puerta de San Catalina», errata de la prensa.

## Punto exacto (2026-10-26)
**Córdoba publicada entera.** Tercera vuelta: datos de Pablo comprobados y aplicados, 42 hermandades retrazadas, todas «nuevo» en el evaluador. Comprobado con Playwright a 1440 y 390 px, sin errores de consola.

**Nada pendiente de datos.** Mejora opcional: corregir en OpenStreetMap el nombre de la Parroquia de la Aurora (way 96693634).

Para rehacer: `node rutas/emparejar.mjs cordoba <id>`, `evaluar`, `publicar`, build y Playwright.
