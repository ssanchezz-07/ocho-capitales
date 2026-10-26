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

## Fase 2 · Trazado
Pendiente: rebase sobre `origin/main` (herramientas de Málaga en 29c1a57), trazado, evaluador, capturas, compilación y Playwright.
