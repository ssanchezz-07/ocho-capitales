# PROGRESO-RUTAS-MALAGA · método nuevo (continuidad + GraphHopper)

_Órdenes: `ORDENES-RUTAS-METODO-NUEVO.md` (Málaga primero, con el código). Herramientas en `tools/itinerarios/rutas/` (ver su `README.md`)._

**Estado (2026-10-26, tarde): 45 de 45 con el método nuevo.** Cada corrección lleva su fuente; los tramos sin calles oficiales de 2026 van como «estimado». Pendiente: la revisión independiente de las 45 (se apunta abajo).

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
- 2026-10-26:
  - Herramientas a producción (`29c1a57`).
  - Las 45 de Málaga con el método nuevo: 38 publicadas y 7 se quedan como estaban.
  - Arreglo de la colocación de los puntos sobre el trazado: alineamiento en orden en vez de «el más cercano hacia delante», que amontonaba los puntos cuando el templo de salida es también el de entrada.
  - `probar-plano.py`.
