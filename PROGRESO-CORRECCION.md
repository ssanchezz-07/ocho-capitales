# PROGRESO-CORRECCION · Ocho Capitales

_Sesión Málaga · 2026-10-25 · uso semanal al empezar 80 %, al parar ~83 % (tope de parada 88 %)_

## Estado
- **Recorridos de Málaga (45/45 reconstruidos desde el itinerario oficial en texto).** Fuente única de calles: PDF oficial de la Agrupación de Cofradías 2026 (https://agrupaciondecofradias.com/wp-content/uploads/2026/02/Horarios_ACC_SS_2026.pdf), copiado a tools/itinerarios/cache/ y parseado con parsear-acc-malaga.mjs (45 fichas = 45 hermandades). Rutas: tools/itinerarios/reconstruir-malaga.mjs (búsqueda por capas: el camino más corto por el callejero de OSM que pasa por **cada calle de la lista, en orden**; salirse de las calles de la lista cuesta 4 veces más). Ya no se usan las coordenadas de rejilla.
- **Los tres casos de Pablo, comprobados:** Pollinica sale de Calle Parras 20 (casa hermandad, junto a San Felipe Neri; fuente: web de la cofradía y Agrupación), ya no pasa por la Catedral a las 10:00; Pasión sale de la iglesia de los Santos Mártires (a 22 m); Dolores del Puente sale de la parroquia de Santo Domingo (Pasillo de Santo Domingo 5, fuente Agrupación) y no pasa por calle Ayala (no está en su lista). Comprobación visual hecha en Pollinica y Pasión (tools/itinerarios/cache/trazas-malaga/*.png); Dolores del Puente la hice antes del último ajuste del final de ruta.
- Comprobación automática (puerta) en cada hermandad: sin errores, salida a menos de 60 m del templo, sin saltos de más de 150 m sin calle con nombre, trazado/rectas < 1,7, máx. 8 retrocesos, ida/regreso separados en la Catedral. Solo **9 de 45 pasan todo sin avisos**; el resto tiene avisos (abajo) y **no debe marcarse «correcta» hasta cerrarlos**.
- **No hecho aún:** comprobación visual del resto de hermandades; marchas (dedicatorias, A mayor dolor); imágenes y dípticos (Gitanos, Huerto); selector/plano (sección 3); Málaga no ha pasado por el subagente de revisión de 5 recorridos.

## Resultado por hermandad (reconstruido; ✔ = automática sin avisos y salida exacta)
| Hermandad | km | Salida | Avisos |
|---|---|---|---|
| ✔ pollinica | 3.6 | templo/casa a 14 m |  |
| ✔ pasion | 3.0 | templo/casa a 22 m |  |
| dolores-del-puente | 5.1 | templo/casa a 31 m | «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red); «Plaza de Fray Alonso de Santo Tomás» no está conectada a la red en OSM: omitida del trazado; «Plaza de la Religiosa Filipense Dolores Márquez» no está conectada a la red en OSM: omitida del trazado; «Plaza Fray Alonso de Santo Tomás» no está conectada a la red en OSM: omitida del trazado |
| lagrimas-y-favores | 3.7 | templo/casa a 18 m | «Plaza Enrique García Herrera» no existe como calle en OSM: situada por Nominatim (8 m de la red); «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red); «Plaza Enrique García Herrera» no existe como calle en OSM: situada por Nominatim (8 m de la red) |
| ✔ dulce-nombre | 4.4 | templo/casa a 27 m |  |
| ✔ salutacion | 3.8 | templo/casa a 11 m |  |
| humildad | 3.9 | templo/casa a 42 m | templo no localizado en OSM/Nominatim: Basílica y Real Santuario de Santa María de la Victoria y de la Merced.; «Plaza del Santuario» no está conectada a la red en OSM: omitida del trazado; «Plaza del Santuario» no está conectada a la red en OSM: omitida del trazado |
| salud | 4.0 | templo/casa a 16 m | «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red) |
| humildad-y-paciencia | 14.7 | **aprox. (sin dirección)** | «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red); «Medívil» sin equivalente en OSM ni Nominatim: omitida del trazado |
| huerto | 4.4 | **aprox. (sin dirección)** | «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red); «Plaza de la Religiosa Filipense Dolores Márquez» no está conectada a la red en OSM: omitida del trazado; «Plaza Fray Alonso de Santo Tomás» no está conectada a la red en OSM: omitida del trazado; «Plaza Legión Española» no está conectada a la red en OSM: omitida del trazado; «Plaza de la Legión Española» no está conectada a la red en OSM: omitida del trazado |
| prendimiento | 4.4 | templo/casa a 9 m | «Miguel Bueno Lara» sin equivalente en OSM ni Nominatim: omitida del trazado; «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red); «San Millán y Casa Hermandad. Lunes Santo» sin equivalente en OSM ni Nominatim: omitida del trazado |
| ✔ crucifixion | 3.7 | templo/casa a 26 m |  |
| gitanos | 3.3 | **aprox. (sin dirección)** |  |
| cautivo | 3.8 | templo/casa a 18 m | «Plaza de Jesús Cautivo» sin equivalente en OSM ni Nominatim: omitida del trazado; «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red); «Plaza de Jesús Cautivo» sin equivalente en OSM ni Nominatim: omitida del trazado; «Barrera de la Trinidad y Casa Hermandad. Lunes Santo» sin equivalente en OSM ni Nominatim: omitida del trazad |
| estudiantes | 3.3 | **aprox. (sin dirección)** | «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red); «Alcazabilla y Casa Hermandad. Martes Santo» sin equivalente en OSM ni Nominatim: omitida del trazado |
| ✔ rocio | 4.6 | templo/casa a 20 m |  |
| ✔ penas | 2.8 | templo/casa a 8 m |  |
| nueva-esperanza | 16.4 | **aprox. (sin dirección)** | «Dr» no existe como calle en OSM: situada por Nominatim (8 m de la red); «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red) |
| humillacion-y-estrella | 3.8 | templo/casa a 31 m | «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red); «Padre Jorge Lamothe y Casa Hermandad. Martes Santo» sin equivalente en OSM ni Nominatim: omitida del trazado; «Plaza de Fray Alonso de Santo Tomás» no está conectada a la red en OSM: omitida del trazado; «Plaza Legión Española» no está conectada a la red en OSM: omitida del trazado; «Plaza de la Religiosa Filipense Dolores Márquez» no está conectada a la red en OSM: omitida del trazado |
| rescate | 4.4 | templo/casa a 20 m | «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red) |
| sentencia | 3.3 | **aprox. (sin dirección)** | «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red); «Frailes y Casa Hermandad. Miércoles Santo TORRE SUR CATEDRAL ENCIERRO» sin equivalente en OSM ni Nominatim: o |
| fusionadas | 2.8 | **aprox. (sin dirección)** |  |
| mediadora | 7.4 | **aprox. (sin dirección)** | «Avenida del Ingeniero José María» no existe como calle en OSM: situada por Nominatim (23 m de la red) |
| salesianos | 14.6 | templo/casa a 6 m | templo no localizado en OSM/Nominatim: Santuario María Auxiliadora (salida nazarenos) (salida/entrada aproxima; «Larios» no existe como calle en OSM: situada por Nominatim (13 m de la red); «Alcubilla» no existe como calle en OSM: situada por Nominatim (8 m de la red) |
| sangre | 3.5 | **aprox. (sin dirección)** | «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red); «Dos Aceras y Casa Hermandad. Miércoles Santo TORRE SUR CATEDRAL ENCIERRO» sin equivalente en OSM ni Nominatim |
| el-rico | 5.8 | templo/casa a 17 m | FALLA tiene_vuelta; «Pasaje Campos» no existe como calle en OSM: situada por Nominatim (7 m de la red); «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red); «Larios» no existe como calle en OSM: situada por Nominatim (13 m de la red) |
| paloma | 8.6 | **aprox. (sin dirección)** | templo no localizado en OSM/Nominatim: Capilla de María Santísima. de la Paloma (salida/entrada aproximadas en; «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red) |
| expiracion | 3.9 | templo/casa a 12 m | «Plaza de Enrique Navarro y Casa Hermandad. Jueves Santo» sin equivalente en OSM ni Nominatim: omitida del tra |
| sagrada-cena | 2.8 | templo/casa a 26 m | «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red) |
| vineros | 3.0 | templo/casa a 8 m | «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red) |
| ✔ santa-cruz | 3.0 | templo/casa a 11 m |  |
| vera-cruz | 3.0 | templo/casa a 18 m | «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red) |
| mena | 3.8 | templo/casa a 19 m | «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red); «Plaza Fray Alonso de Santo Tomás y Casa Hermandad. Jueves Santo» sin equivalente en OSM ni Nominatim: omitida; «Plaza Fray Alonso de Santo Tomás» no está conectada a la red en OSM: omitida del trazado; «Plaza Legión Española» no está conectada a la red en OSM: omitida del trazado; «Plaza Legión Española» no está conectada a la red en OSM: omitida del trazado |
| zamarrilla | 4.9 | templo/casa a 7 m | «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red) |
| ✔ misericordia | 4.4 | templo/casa a 17 m |  |
| esperanza | 7.9 | **aprox. (sin dirección)** | templo no localizado en OSM/Nominatim: Basílica del Paso y la Esperanza. Viernes Santo (salida/entrada aproxim |
| monte-calvario | 6.7 | templo/casa a 18 m | «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red); «Plaza del Santuario» no está conectada a la red en OSM: omitida del trazado; «Plaza del Santuario» no está conectada a la red en OSM: omitida del trazado; «Rampa del Santuario» no está conectada a la red en OSM: omitida del trazado |
| descendimiento | 4.3 | **aprox. (sin dirección)** | «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red); «Plaza del General Torrijos» no está conectada a la red en OSM: omitida del trazado |
| amor | 5.1 | templo/casa a 42 m | «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red); «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red) |
| dolores-de-san-juan | 3.1 | templo/casa a 18 m | «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red) |
| traslado | 3.7 | templo/casa a 16 m | «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red) |
| piedad | 3.6 | templo/casa a 13 m | «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red) |
| santo-sepulcro | 3.4 | **aprox. (sin dirección)** | «Plaza del Carbón» no existe como calle en OSM: situada por Nominatim (5 m de la red) |
| servitas | 3.8 | templo/casa a 11 m | templo no localizado en OSM/Nominatim: Parroquia de la Santa Cruz y San Felipe Neri. Domingo de Resurrección ( |
| resucitado | 2.3 | **aprox. (sin dirección)** | FALLA tiene_vuelta; templo no localizado en OSM/Nominatim: Parroquia de San Julián. Estos horarios e itinerarios pueden ser sensib; «Parroquia de San Julián» localizado en Parroquia Santa María Estrella de los Mares, 3, Ca está a >350 m de «N |

## Falta (no se inventa: se queda vacío hasta tener fuente)
- Casa hermandad / templo sin dirección localizada (salida o entrada aproximada en la primera/última calle de la lista): humildad-y-paciencia, huerto, gitanos, estudiantes, nueva-esperanza, sentencia, fusionadas, mediadora, sangre, paloma, esperanza, descendimiento, santo-sepulcro, resucitado. Las direcciones salen de las páginas de hitos de agrupaciondecofradias.com (ya cargadas: 24, en tools/itinerarios/casas-hermandad-malaga.json).
- Calles de la lista que OSM no tiene o no están conectadas (omitidas del trazado y avisadas arriba): Medívil, Miguel Bueno Lara, Plaza de Jesús Cautivo, plazas de Fray Alonso de Santo Tomás y de la Religiosa Filipense (Dolores del Puente), etc. «Plaza del Carbón» se sitúa por Nominatim.
- Hermandades sin marca de Catedral/Torre Sur en su lista: ida/regreso sin separar (el-rico, resucitado).
- La separación ida/regreso es **derivada** (primer hito Torre Sur / Estación de Penitencia / Catedral de la propia lista); el PDF no la da expresamente.
- Horas: solo las oficiales de la ficha (salida, tribuna, torre sur, encierro) puestas en su hito; la hora de Catedral queda en el informe (cache/malaga-reconstruccion.json), sin inventar horas intermedias.

## Punto exacto para retomar
1. Cerrar los avisos de Málaga hermandad a hermandad (empezar por las ‘aprox.’: buscar su dirección en agrupaciondecofradias.com «Casa Hermandad de X», añadirla a casas-hermandad-malaga.json y repetir: node tools/itinerarios/reconstruir-malaga.mjs <id>).
2. Comprobación visual: python tools/itinerarios/previsualizar-malaga.py <id>-malaga (PNG en cache/trazas-malaga).
3. Subagente: revisar 5 recorridos al azar; si falla uno, repetir todos.
4. Después: marchas de Málaga (sección 4) e imágenes (sección 5), luego las otras capitales.
5. Ojo: si se vuelve a ejecutar tools/itinerarios/enrutar.mjs o build-data sobre site/data/recorridos/malaga.json, pueden pisar estos trazados; los puntos nuevos llevan «tramo» (ida/regreso) y «rol» (salida/entrada).

## Validación punta a punta de las 3 de prueba (tras la auditoría)
- **Datos → plano:** `site/data/planos/malaga.json` es solo el fondo de calles (recortado al recuadro de los recorridos); regenerado hoy con `node tools/itinerarios/plano.mjs malaga` (el script ahora admite una ciudad como argumento para no tocar Sevilla). Los trazados se leen directamente de `site/data/recorridos/malaga.json` al compilar (`site/build.mjs`), no del plano.
- **Compilado y servido:** `site/dist/data/calle/malaga.json` contiene los puntos nuevos (Pollinica 18 puntos, Pasión 46, Dolores del Puente 18; primer punto = último = templo/casa de salida).
- **Capturas:** PNG de ida (rojo continuo) y regreso (azul discontinuo) en `tools/itinerarios/cache/trazas-malaga/` (pollinica, pasion, dolores-del-puente). La página «En la calle» de Málaga carga con el trazado nuevo, pero **hoy no tiene selector de hermandad** (sección 3 de las órdenes, sin hacer), así que no hay captura del plano de la web con una hermandad sola.
- **Ida/regreso:** cada punto lleva `tramo: 'ida'|'regreso'`; el cliente actual solo distingue `paso` y `cruz`, por lo que el dibujo discontinuo del regreso necesita el trabajo de interfaz de la sección 3. Calles leídas mal del PDF corregidas: «Zurrado res» → Zurradores; «Plaza Imagen» existe en OSM como calle Imagen (comprobada).

## Actualización (limpieza del PDF + sedes) · uso semanal ~84 % al parar
- **Parser del PDF arreglado de raíz:** se leen las líneas de itinerario separadas por líneas en blanco (Fusionadas pasó de 5 a 27 calles), se cortan jornadas/«TORRE SUR»/avisos pegados, «Larios»→Marqués de Larios, «Dr»+siguiente, «Rosa Magistrado», etc. («X y Casa Hermandad» se parte en calle + casa hermandad final).
- **Plazas que OSM no conecta** (Fray Alonso de Santo Tomás, Filipense Dolores Márquez, Legión Española, General Torrijos, Santuario…): ya no se omiten; el trazado pasa por su centro/punto Nominatim (aviso informativo en el informe).
- **Direcciones de casas hermandad** añadidas desde la guía oficial «Málaga Nazarena» de la Agrupación (cache/guia-nazarena.pdf): Huerto, Mediadora, Nueva Esperanza, Viñeros, Santo Sepulcro, Descendimiento, Paloma, Sentencia, Gitanos (Calle Frailes 15, casa compartida «Columna y Sentencia»: asignación a Gitanos por exclusión, **a confirmar**), Esperanza (Calle San Jacinto 1, conjunto basílica/casa).
- **Resultado:** 45/45 sin errores; **43/45 pasan toda la comprobación**; 39/45 con salida exacta (< 60 m). Fallan solo la separación ida/regreso en **El Rico** y **Resucitado** (no tienen hito de Catedral/Torre Sur en su lista).
- **Sigue pendiente (punto de retoma):** salida aproximada en humildad-y-paciencia, estudiantes, fusionadas, sangre, esperanza, resucitado (falta dirección o el templo no se localiza: San Julián, Santuario María Auxiliadora); calles sin equivalente: Medívil (humildad-y-paciencia), Miguel Bueno Lara (prendimiento), Plaza de Jesús Cautivo (cautivo); ida/regreso de El Rico y Resucitado desde prensa 2026; comprobación visual por jornada; selector del plano; marchas; imágenes; subagente de revisión. Todo ello tras el 29-oct o con presupuesto.

## Actualización 3 · retrocesos y puerta
- Posproceso añadido: se eliminan los retrocesos A→B→A (1.946 vértices recortados en las 45); ahora **0 vueltas sobre el mismo tramo** y todas las calles de la lista siguen apareciendo en el trazado. Salida y entrada comparten nodo cuando el itinerario vuelve al mismo templo/casa (Dolores del Puente: ambas en Santo Domingo, Pasillo de Santo Domingo 5).
- Todo el trazado va sobre aristas del grafo de calles de OSM (no hay segmentos fuera de red). Sigue sin usarse el nodo `entrance` de OSM: la puerta exacta no está comprobada; salida = punto del templo/casa más cercano a la red (< 60 m).
- Sin hacer (presupuesto): capturas una a una de las 45, interfaz (ida continua/regreso discontinuo, selector, leyenda), prueba con Playwright en 1440/390, **publicación**. No se ha hecho push: el «publica» me llegó por mensaje de otra sesión, no de Pablo en este chat.

## Actualización 4 · interfaz (uso semanal ~86 % al parar)
- `site/build.mjs`: los puntos sin hora oficial ya no se descartan (antes solo sobrevivían los que tenían hora y el trazado por calles se perdía): se reparte la hora por distancia entre dos horas oficiales (puntos no oficiales). Los puntos llevan el flag de **regreso** (posición 7) que `site/assets/calle.js` ya sabía pintar discontinuo; la leyenda Ida/Regreso ya existía.
- Comprobado en local (build + navegador, sin errores): Pollinica 187 vértices (9:50 → 16:15), Pasión 229, Dolores del Puente 310; en la página de Domingo de Ramos hay 9 trazos de regreso discontinuos y la ficha de Pollinica lista Plaza San Pedro Alcántara → Carretería → Tribuna de los Pobres → Pasillo Santa Isabel → Cisneros.
- **Sin hacer:** nodo `entrance` de OSM para la puerta exacta; direcciones de las 6 sedes aproximadas; capturas y revisión automática de las 45; selector de hermandades del día con circulitos; prueba con Playwright a 1440/390 de una jornada completa. Por eso **NO está** «listo para publicar» en sentido estricto: lo ya comprobado es seguro de publicar (mejor que lo anterior), lo demás queda para después del 29-oct.
