# PROGRESO-RUTAS-MALAGA · método nuevo (continuidad + GraphHopper)

_Órdenes: `ORDENES-RUTAS-METODO-NUEVO.md` (Málaga primero, con el código). Herramientas en `tools/itinerarios/rutas/` (ver su `README.md`)._

**Estado final (2026-10-26, 15:00): Málaga hecha. Las 45 con el método nuevo, corregidas con fuente y revisadas dos veces por un revisor independiente.**
- **Evaluador, sobre las 45:**
  - 1.516 de 1.517 calles recorridas: falta María en Amor, explicado abajo;
  - 1.454 en orden;
  - 63 retrocesos (había 200 en lo publicado antes de este trabajo);
  - ninguna recta sin calle.
- **Compilación y plano:** sin errores, y `probar-plano.py malaga` da 8/8 a 390 y 1440 px.
- **Horas:** sin cambios, salvo la corrección de Monte Calvario (salida a las 15:00 de la ermita y a las 16:00 de la Basílica).
- **Segunda revisión independiente** (las 12 que tenían fallo o duda): 6 resueltas, 5 aceptables con su explicación, y Lágrimas y Favores, que se arregló después. Su último tramo por Calle San Juan se perdía al publicar: cuando la lista acaba en una calle y la sede viene de una corrección, `publicar.mjs` añade ahora el punto de la sede.
- **Tramos «estimado»** (la ruta no tiene calles oficiales de 2026; en los datos van con `"estimado": true` y la fuente o el motivo en `fuente_tramo`):
  - **Solo hay fuente de 2020:** Mediadora (Plaza de La Marina → Vendeja), Amor (Manrique → Fernando el Católico), Piedad (Méndez Núñez → Ollerías) y Gitanos (Tribuna de los Pobres → Cisneros, por el Pasillo de Santa Isabel).
  - **Unión deducida del mismo PDF:** Salesianos (Granada → Uncibay por Méndez Núñez; Casapalma → Álamos por Cárcer; Plaza Montaño → Capuchinos por la Carrera de Capuchinos), Humildad y Paciencia (Prim → Plaza Arriola por Atarazanas), Nueva Esperanza (Rampa de la Aurora) y Lágrimas y Favores (Compañía).
  - **Sede sin dirección con fuente:** Sangre (de la casa hermandad a la plazuela), Fusionadas (de la sede social al Pasillo de Santa Isabel, ida y vuelta) y Cautivo (de la casa hermandad, en Calle Trinidad 95, a Barrera de la Trinidad).
  - **Sin calles en ninguna fuente:** la Vía Dolorosa de Monte Calvario.
  - **Amor:** Conde de Tendilla y María solo se unen por una escalera de 10 peldaños (OSM way 495510215), así que María no se dibuja.
- **Dibujo en el plano:** la sesión de portada ya pinta los tramos estimados en discontinuo, con su leyenda, en su rama `claude/portada-inmersiva-91892d`. Se verá en el plano cuando la suba a `main`.
- **Sin situar** (no hay coordenadas con fuente): la Plaza de Jesús Cautivo, que va como hito, y «Alcubilla» en Salesianos, que va como hito porque la única Alcubilla de OSM está a 2,7 km.
- **Herramientas nuevas en `rutas/`:**
  - opciones de corrección `paso`, `tramos`, `cruzar` y `vias`;
  - la petición a GraphHopper se parte en los puntos de corrección;
  - recorte de los picos de ida y vuelta junto a la puerta;
  - `dossier.mjs`, para revisiones independientes, y `probar-plano.py`.

**Estado anterior (2026-10-26, 14:40): 45 de 45 con el método nuevo (`238c0b4` en `main`), pero la revisión independiente encontró 5 fallos y 6 dudas.** Paré con el límite de 5 horas al 81 %. **Punto exacto de retoma: arreglar la lista siguiente, volver a trazar, repetir la revisión y subir.**

### Revisión independiente (subagente, 2026-10-26): 34 OK, 6 DUDA, 5 FALLO
El revisor no había visto mi trabajo. Contrastó el PDF, la lista, la sucesión de calles y 18 capturas. Dossier: `scratchpad/dossier-malaga.md`, que se regenera con `dossier.mjs`; conviene pasar ese script a `rutas/`.

**FALLO, por arreglar:**
1. **Humildad y Paciencia, Mediadora y Expiración: Plaza Enrique García-Herrera.** Las tres van «Moreno Carbonero → Sebastián Souvirón → Félix Sáenz → San Juan → Marqués → Plaza». Arreglo: `cruzar` en la fila de la plaza, como en Lágrimas y Favores. GraphHopper no enruta por dentro del área (way 183856398).
2. **Expiración: Puente de Tetuán.** El PDF dice «Avenida de Andalucía, Puente de Tetuán, Alameda Principal». El trazado da un rodeo de unos 480 m por Nazareno del Paso, Hilera, Pasillo de Santo Domingo y el Puente de la Misericordia. Arreglo: puntos de entrada en el Puente de Tetuán y en la Alameda.
3. **Salesianos: bucle de unos 156 m.** Va Granada → Méndez Núñez → José Denis Belgrano → Granada → Méndez Núñez. El PDF salta de Granada a la Plaza Uncibay. Arreglo: `paso` por Méndez Núñez y `tramos` «estimado» en Plaza Uncibay.
4. **Amor: María es un fondo de saco en OSM.** El trazado la recorre ida y vuelta (155 m), y al salir cambia el orden: el PDF dice «Conde de Tendilla, María, Ladrón de Guevara». Arreglo: unir Conde de Tendilla con María como tramo «estimado» y quitar el pico. Antes, mirar la geometría.
5. **Pollinica:** al regreso pasa la puerta (Calle Parras 20) y vuelve, con un pico de unos 65 m. Mirar la entrada.

**DUDA:**
- **Lágrimas y Favores:** el último tramo, de Félix Sáenz a la puerta de San Juan, se dibuja recto. Debería ir enrutado por Calle San Juan y Postigo de San Juan. Además, «Compañía» (42 m), entre Puerta Nueva y Fajardo, no está en la lista.
- **Cautivo:** el regreso da una vuelta de unos 280 m por la Plaza Bailén. Debería ir Trinidad → Barrera de la Trinidad → puerta.
- **Fusionadas:** la sede es la «sede social» (Postigo de San Juan 5), pero el PDF empieza «Casa Hermandad, Pasillo Santa Isabel», y al salir hay un pico de 131 m por Cisneros. Hace falta una fuente de dónde salen los tronos.
- **Sangre:** la lista añade «Casa Hermandad» (Dos Aceras 10) al principio, que no está en el PDF; el PDF empieza en la Plazuela del Cristo de la Sangre (San Felipe Neri). El tramo por Gaona (95 m) va sin marcar. Hace falta fuente, o marcarlo «estimado».
- **Gitanos:** el tramo estimado va por García Briz y Muro de Puerta Nueva, y no por el Pasillo de Santa Isabel, que cita la fuente de 2020. Arreglo: `paso` por el Pasillo de Santa Isabel.
- **Nueva Esperanza:** unos 125 m por la Rampa de la Aurora y dos plazas, sin marcar «estimado».

**Notas generales:**
- Igualar el punto en la Plaza Jesús de la Pasión en Dulce Nombre, Crucifixión, Santa Cruz, Viñeros y Vera Cruz (en Pasión y Humildad ya está).
- Los cruces de la Alameda (43 m), del Pasillo del Matadero (47 m) y de la Avenida de Andalucía (55 m) están por debajo del umbral de 60 m de «estimado». Hay que decidir si se marcan.
- **Mediadora:** la lista repite «Garnica»; en el PDF es una sola calle, «Avenida del Ingeniero José María Garnica». Hace falta un arreglo `juntar` con resultado explícito. Su sede está situada por Nominatim (Ayala 34) y el regreso da una vuelta por Cómico Riquelme y Orfila: confirmar la dirección de la casa hermandad con fuente.
- **Horas:** el revisor las encontró bien asignadas.

**Plano:** la sesión de portada ya dibuja los tramos «estimado» en discontinuo, con su leyenda, en la rama `claude/portada-inmersiva-91892d`, todavía sin subir a `main`.

Corregido en esta tanda, cada cosa con su fuente en `tools/itinerarios/rutas/correcciones-malaga.json`:
- **Pasión:** la Plaza de los Mártires y la Plaza Jesús de la Pasión, sin picos y sin retrocesos.
- **El Rico y Servitas:** la Plaza Jesús El Rico, Álamos y Muro de San Julián son esquinas en OSM; lo publicado las «recorría» con picos de ida y vuelta. En la Plaza del Obispo, punto de paso.
- **Prendimiento y Descendimiento:** puntos de entrada en Capuchinos y en el Paseo de Reding. Antes se iban por calles paralelas. La «recta» de Descendimiento era un falso positivo en una avenida ancha.
- **Dulce Nombre:** «Tribuna Principal Marqués de Larios» estaba pegado por un salto de línea del PDF. Se parte en `lista-malaga.mjs`.
- **Puertas de OSM con la dirección exacta:** Estudiantes (Calle Alcazabilla 3) y Humildad y Paciencia (Plaza María Santísima de Dolores 1).
- **Cambios en el código:**
  - el trazado empieza y acaba en la puerta misma;
  - opción `esquina` en el evaluador;
  - opción `vias` en el emparejador.
- **Dolores del Puente:** sale idéntico en tres ejecuciones seguidas (mismo hash). Es determinista.

**Estado anterior (2026-10-26, mañana):** las 45 trazadas con el método nuevo y comparadas con lo publicado; 38 pasaron al nuevo y 7 se quedaron como estaban.

## Resultado
Evaluador común sobre las 45 (lo publicado frente al nuevo):
- **Calles recorridas:** 1.512 frente a 1.511 de 1.518.
- **En orden:** 1.442 frente a 1.443.
- **Retrocesos:** 200 frente a 71.

En las 38 que cambian, el nuevo empata o mejora en todo y conserva todas las horas oficiales. Comprobado: compilación sin errores y plano con Playwright a 390 y 1440 px (`probar-plano.py malaga`, 8/8).

- **Dolores del Puente, arranque:** lo resuelve la fuente oficial, el PDF de la Agrupación 2026: «Iglesia Santo Domingo Guzmán, Plaza de Fray Alonso de Santo Tomás, Pasillo de Santo Domingo, Plaza de la Religiosa Filipense Dolores Márquez, Cerrojo, Martinete, Zurradores, Plaza Imagen, Polvorista…».
  - **Lo publicado** salía por San Jacinto y Huerta del Obispo, que no están en la ida, y se saltaba la plaza.
  - **El nuevo** sigue ese orden exacto. Se queda el nuevo.
- **Humildad:** el nuevo arregla la salida y la entrada (Plaza del Santuario y Compás, como dice la lista; lo publicado iba por Fernando el Católico y San Patricio), pero se saltaba Álamos y la Plaza Jesús de la Pasión. Lo corregí con dos puntos de paso en `tools/itinerarios/rutas/correcciones-malaga.json`, con el PDF como fuente. Queda con las 35 calles, 0 m a la sede y 0 retrocesos.

## Para que Pablo mire en el editor
Doble clic en `tools/itinerarios/editor/Abrir editor de rutas.bat`, elegir **Málaga** y la hermandad. En rojo, lo publicado; en azul, el nuevo.

**A. Se quedan como estaban porque el nuevo empeora.** Corregirlas en el editor si se quiere pasar al nuevo y luego `node publicar.mjs malaga <id> --forzar`:
| Hermandad | Qué pierde el nuevo | Qué mirar |
|---|---|---|
| Pasión | La Plaza de los Mártires al salir y al entrar | Punto de paso dentro de la plaza |
| Lágrimas y Favores | La Plaza Enrique García Herrera; la entrada no localiza la sede; salto de 263 m entre Constitución y Martínez en la lista | Sede de entrada y la plaza |
| El Rico | La Plaza Jesús El Rico al salir y al entrar, y la Plaza del Obispo | Puntos de paso en las dos plazas |
| Monte Calvario | La Plaza de María y Guerrero. «(Salida 15:00) Vía Dolorosa del Calvario» no existe en OSM y no se localiza la salida | Situar a mano la Vía Dolorosa y la salida |
| Descendimiento | Una recta de 190 m sin calle entre Guillén Sotelo y el Paseo de Reding (OSM no las une, a 61 m) | Elegir la calle buena o un punto de paso |
| Servitas | Álamos y Muro de San Julián | Puntos de paso en las dos |
| Prendimiento | 4 retrocesos frente a 0 | Mirar si son picos de ida y vuelta |

**B. Publicadas con el nuevo, pero la lista oficial salta calles** (hueco de más de 100 m entre dos seguidas). GraphHopper une por el camino a pie más corto, igual que hacía el método anterior. Comprobar que es el camino real:
- **Dulce Nombre:** Constitución → Martínez, 263 m.
- **Mediadora:** Plaza de La Marina → Vendeja, 144 m.
- **Gitanos:** Tribuna de los Pobres → Cisneros, 114 m.
- **Amor:** Manrique → Fernando el Católico, 117 m.
- **Piedad:** Méndez Núñez → Ollerías, 103 m.
- **Santo Sepulcro:** Martínez → Torregorda, 118 m.
- **Resucitado:** Granada → Méndez Núñez, 118 m.
- **Salesianos:** Plaza Montaño → Capuchinos, 85 m. Además, «Alcubilla» no es calle en OSM.

**C. Elementos sin calle en OSM** (no se trazan; nunca se inventan):
- **Cautivo:** «Plaza de Jesús Cautivo». Se puede situar a mano en el editor.
- **Varias hermandades:** «Plaza del Carbón» solo es un punto aproximado de Nominatim y queda como referencia.

## Cómo repetirlo
```
cd tools\itinerarios\rutas
node emparejar.mjs malaga ; node evaluar.mjs malaga ; python -I capturar.py malaga ; node publicar.mjs malaga
cd ..\..\.. ; node site\build.mjs ; python -I tools\itinerarios\rutas\probar-plano.py malaga
```
Capturas de comparación (no van en git): `tools/itinerarios/rutas/capturas/malaga/`.

## Historial
- 2026-10-26 (tarde): Málaga al 100 % (`7e55483`, `238c0b4`, `5cf2746` y el último): correcciones con fuente, tramos estimados, revisión independiente doble.
- 2026-10-26:
  - Herramientas a producción (`29c1a57`).
  - Las 45 de Málaga con el método nuevo: 38 publicadas y 7 se quedan como estaban.
  - Arreglo de la colocación de los puntos sobre el trazado: alineamiento en orden en vez de «el más cercano hacia delante», que amontonaba los puntos cuando el templo de salida es también el de entrada.
  - `probar-plano.py`.
