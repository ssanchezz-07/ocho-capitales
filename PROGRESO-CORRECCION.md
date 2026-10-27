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

## Actualización 5 · Málaga: puertas, ida/regreso, marchas, fotos y plano (2026-10-25, noche; uso semanal 0 → ~5 %)
**Recorridos** (commit `2f73cc1`)
- Las 6 sedes aproximadas ya estaban resueltas en `3f92560`. Ahora la salida y la entrada van a la **puerta de OSM** (nodos `entrance`/`door`, caché `tools/itinerarios/cache/osm-malaga-puertas.json`, consulta Overpass en el código): **67 de 88** salidas/entradas con puerta. Criterio en el informe (`puertas` de `cache/malaga-reconstruccion.json`).
- **Falta (sin puerta en OSM que encaje, se queda el edificio):** Humildad (Victoria: la plaza del Santuario no está conectada), Salud (San Pablo: el edificio no tiene puertas en OSM), Monte Calvario (ermita sin puertas), Humildad y Paciencia (OSM la llama «Plaza María Santísima de Dolores 1»), Nueva Esperanza (dirección sin número), Mediadora (Ayala 34 no está), Salesianos (28 no está), Paloma (dirección sin número), Mena (Pasillo de Santo Domingo 16 no está), Descendimiento (Manuel Martín Estévez 6 no está), y las entradas de Humillación y Estrella (Cañaveral 2 no está) y Expiración (OSM solo tiene Plaza Enrique Navarro 2).
- **San Julián (Resucitado):** puerta = nodo OSM 5267734993, calle Nosquera 17 (el itinerario sale a Nosquera; a ~14 m de las coordenadas de Wikipedia). La web de la Agrupación (https://agrupaciondecofradias.com/sede/, leída con Playwright) dice que la iglesia «presenta dos portadas» sin decir a qué calle da cada una. **Falta confirmarlo a ojo** (Pablo o una foto).
- **El Rico y Resucitado:** ida/regreso separados en la Torre Sur, derivada (la lista no la cita; la ficha da su hora: 23:04 y 13:00); en Molina Lario tras la Plaza de la Marina. Ni la prensa (El Español, Miércoles Santo) ni la Agrupación separan ida y regreso. El Español da salida de El Rico a las 17:45 y el PDF oficial a las 17:55: se queda la oficial.
- **Paloma corregida:** el salto de línea del PDF partía «Capilla de María / Santísima de la Paloma» y la entrada caía en un homónimo a 3 km (6,0 → 2,6 km).
- «Miguel Bueno Lara» (Prendimiento) = Calle Miguel de Buero Lara en OSM (toca la Plaza Maestro Artola). Sigue sin equivalente: Plaza de Jesús Cautivo (Cautivo).
- **Revisadas a ojo las 45 capturas** (láminas de 9): todas cuadran con su lista salvo Paloma, ya corregida.
- Sin hacer: hora de la Tribuna en El Rico (su lista no cita «Tribuna Principal»); salida de los tronos de El Rico desde su casa hermandad (calle Victoria) no sale como punto propio.

**Marchas** (commit `a82b6f8`)
- Script `tools/auditoria/marchas-malaga.mjs`: 349 marchas ligadas a hermandades de Málaga + 120 del catálogo con dedicatoria en Málaga, cruzadas con `portal.json` y la base de Patrimonio Musical.
- Correcciones en `tools/sources/marchas-correcciones.json` (aplicadas en `build.mjs`), cada ficha leída con Playwright:
  - Retiradas: **«Soledad del Mayor Dolor» (Crucifixión, caso de Pablo)**: no existe con ese título; la marcha de Manuel Bonilla Cascado para M.ª Stma. del Mayor Dolor en su Soledad se titula «Crucifixión» (1998, bd-marcha-1753), que se añade. «Stabat Mater» de Salesianos (es de Dolores del Puente, bd-marcha-1631). «Malacitana» de la Sangre (dedicada a Salvador García Sánchez, bd-marcha-1627).
  - «Dolorosa de la Cruz Verde» (Germán San Antonio) **es real**: Patrimonio Musical la dedica a la Hdad. Crucifixión (bd-marcha-1698); la Crucifixión tiene su sede en la Cruz Verde. Se queda.
  - Confirmadas 12 que el cotejo automático no casaba (Gitanos ×2, Dolores del Puente ×5, Misericordia ×2, Humildad y Paciencia, Prendimiento, Esperanza).
  - Las que solo cita Wikipedia pasan a «sin verificar» (también en Sevilla).
- Resultado Málaga: 298 confirmadas, 35 «sin verificar» del foro, 11 sin segunda fuente (Wikipedia, Dolores del Puente), 1 dudosa: **«Mayor Dolor» (Perfecto Artola, Fusionadas)**: Patrimonio Musical tiene «Virgen del Mayor Dolor» de Artola (1983, bd-marcha-506) dedicada a «Virgen del Mayor Dolor (Málaga)» sin decir de qué hermandad; se queda «sin verificar». Ojo: el portal no tiene a la Virgen del Mayor Dolor entre los titulares de Fusionadas (Patrimonio Musical sí la cita: bd-marcha-4901).
- Años distintos entre Wikipedia y Patrimonio Musical en 5 marchas de Dolores del Puente (anotados en las correcciones); no se han cambiado.

**Imágenes** (commit `a2e341a`)
- Revisadas con Playwright las **79 fichas de Commons** de las fotos de Málaga (descripción y categorías). Retiradas 5 (`tools/sources/fotos-retiradas.json`): Gitanos (Cristo = Azotes y Columna de Fusionadas), Huerto (Virgen = Dolorosa de Sierra de Yeguas), Salesianos (Cristo = trono de las Penas), Resucitado (guion del Huerto), Expiración (Dolorosa de la Magna sin hermandad). El resto nombra a su hermandad en la categoría o la descripción.
- `FOTOS-QUE-FALTAN.md` (sección Málaga): 41 hermandades con algún titular sin foto; listo para pedírselas a Pablo.
- Quedan en `site/assets/img/` los WebP de las 5 retiradas, sin uso.

**Plano** (commit `2bdb99a`)
- Probado con Playwright a 390 y 1440 px en las 8 jornadas (45 cofradías, 0 errores de consola). Arreglados dos desbordamientos horizontales en móvil (lista de cofradías: 63 px el Viernes Santo; URL de la fuente: 5 px).
- Observaciones sin tocar: en PC la ficha lateral tapa ~400 px de la derecha del plano y los botones de zoom; el texto «Sale a las 17:55 de parroquia santiago (salida de nazarenos)» sale en minúsculas.

**Revisión del subagente:** ver «Actualización 6».

## Punto exacto para retomar (Málaga)
1. Confirmar a ojo la puerta de San Julián (Resucitado).
2. Puertas que faltan (lista de arriba): dirección exacta con número en la web de cada hermandad.
3. «Mayor Dolor» de Fusionadas: buscar fuente expresa; añadir la Virgen del Mayor Dolor a los titulares de Fusionadas si una fuente oficial lo confirma.
4. Pedir a Pablo las fotos de `FOTOS-QUE-FALTAN.md`.
5. Después, Málaga queda lista; seguir con Sevilla con el mismo método.

## Marchas → sesión de marchas
Orden de Pablo (reenviada por la sesión principal, 2026-10-25): las marchas de las 8 capitales pasan a una sesión dedicada. Esta sesión ya no toca archivos de marchas.
- **Hecho y verificado aquí** (commit `a82b6f8`, en `main` local, sin subir): `tools/auditoria/marchas-malaga.mjs` (cruce de las dedicatorias de Málaga con `portal.json` y Patrimonio Musical), `tools/sources/marchas-correcciones.json` (3 retiradas, 12 confirmadas y 1 añadida, cada ficha leída con Playwright) y en `site/build.mjs` la aplicación de esas correcciones, las confirmaciones por compositor y las marchas de Wikipedia como «sin verificar». Detalle en la «Actualización 5» de arriba.
- **Punto exacto para la sesión de marchas:**
  1. «Mayor Dolor» (Perfecto Artola, Fusionadas): Patrimonio Musical solo dice «Virgen del Mayor Dolor (Málaga)» (bd-marcha-506). Se queda «sin verificar».
  2. Los 35 «sin verificar» del foro de 2008 y los 11 de Wikipedia de Dolores del Puente: buscar segunda fuente.
  3. Años distintos entre Wikipedia y Patrimonio Musical en 5 marchas de Dolores del Puente (anotados en `marchas-correcciones.json`).
  4. El portal no tiene a la Virgen del Mayor Dolor entre los titulares de Fusionadas.
- El revisor independiente comprobó 5 marchas al azar (Expiración, Humildad, Monte Calvario, Estudiantes y Rocío) contra Patrimonio Musical: las 5 están bien.

## Actualización 6 · La Paloma, El Rico y revisión de las 45 (2026-10-26; 5 h al 0 %, semanal 14 %)
**Revisor independiente (5 recorridos y 5 marchas al azar):** las 5 marchas, bien. Recorridos: señaló 3 fallos (Sangre, Cautivo y Resucitado) → según las órdenes, **revisadas las 45**.
- **Cautivo, encierro 02:30:** el revisor se equivocó. En la imagen de la página 4 del PDF, el 02:30 está en la columna «Encierro» de la fila del Cautivo (la capa de texto lo descoloca).
- **Resucitado:** volvía por Santa Lucía (calle de la ida) en vez de por Méndez Núñez y Comedias. Corregido: ver regla 2.
- **Sangre:** sale de su casa (Dos Aceras 10), sube por Guerrero a la Plazuela del Cristo de la Sangre y vuelve; el recorte de retrocesos borraba esa ida y vuelta. Corregido: ver regla 4.

**La Paloma (orden de Pablo).** Itinerario oficial 2026 (PDF de la Agrupación, https://agrupaciondecofradias.com/wp-content/uploads/2026/02/Horarios_ACC_SS_2026.pdf): Capilla de M.ª Stma. de la Paloma, Plaza de San Francisco, Carretería, **Tribuna de los Pobres, Pasillo de Santa Isabel**, Cisneros, Especería, Plaza de la Constitución, Tribuna Principal, Marqués de Larios, Martínez, Atarazanas, Torregorda, Alameda Principal, Plaza de la Marina, Molina Lario, Torre Sur, Plaza del Obispo, Molina Lario, Plaza del Siglo, Plaza del Carbón, Calderería, Plaza de Uncibay, Méndez Núñez, Tejón y Rodríguez, Carretería, Plaza de San Francisco y Capilla. Horas: 20:15 / 22:07 / 00:12 / 01:45.
- **Estaba mal:** de Carretería atajaba por García Briz y Muro de Puerta Nueva hasta Cisneros, sin pasar por la Tribuna de los Pobres ni por el Pasillo de Santa Isabel; antes, además, la entrada caía en un homónimo a 3 km (corregido en `2f73cc1`).
- **Ahora:** Carretería → Tribuna de los Pobres → Pasillo de Santa Isabel (118 m) → Cisneros … calle a calle como la lista. Comprobado en la captura y en el plano (390 y 1440 px).

**El Rico (orden de Pablo: sale y se encierra en su casa hermandad).** El PDF lo confirma: «Parroquia Santiago (salida de nazarenos) … Casa Hermandad (salida de los Tronos)». Ahora sale a las 17:55 y se encierra a la 01:05 en la casa hermandad de calle Victoria 12-14 (Agrupación, https://agrupaciondecofradias.com/itinerario-4-victoria-merced-11o-hito-casa-hermandad-de-el-rico/, leído con Playwright); primer y último punto a 7 m de su puerta de OSM. El tramo de los nazarenos desde Santiago queda anotado en el informe (`salida_nazarenos`). Misma regla para **Salesianos** (nazarenos desde el Santuario; tronos desde su casa hermandad, calle Eduardo Domínguez Ávila 28, «frente al Santuario», confirmado con Playwright). Las demás que acaban en «… y Casa Hermandad» salen de su templo según el PDF y se quedan así.

**Reglas nuevas del reconstructor** (`tools/itinerarios/reconstruir-malaga.mjs`):
1. Una calle de la lista cuenta como recorrida si el trazado avanza por ella (25 m o el 40 % de su longitud), no si solo la cruza.
2. Solo cuestan como «de la lista» la calle que toca, la anterior y la siguiente: el regreso ya no reutiliza calles de la ida.
3. Enlaces cortos (< 35 m) entre dos calles consecutivas que OSM no une (p. ej. Cisneros acaba a 7 m del Pasillo de Santa Isabel), anotados en el informe; paso por la Catedral en la estación de penitencia (puerta de Postigo de los Abades → puerta del Patio de los Naranjos en calle Císter, nodos OSM 8280808444 y 2834229789). «Postigo de los Abades» pasa a ser calle.
4. No se recorta una ida y vuelta corta (≤ 300 m) si al quitarla desaparece una calle de la lista (plaza delante del templo, Plazuela de la Sangre); las largas se recortan y quedan como aviso.
5. Homónimos: una calle o un punto de Nominatim a más de 600 m de sus vecinas de la lista se omite con aviso («Alcubilla» de Salesianos → La Alcubilla de Bailén-Miraflores; «Dr. Don Felipe Sánchez de la Cuesta y Alarcón» de la Esperanza → calle Alarcón, a 1,2 km). «Rivera del Guadalmedina» = Calle Ribera del Guadalmedina (Nueva Esperanza bajaba de 12,4 a 7,4 km).
6. Tribuna de los Pobres = escalinata al arranque de Carretería junto al Puente de la Aurora (https://www.change.org/p/ayto-de-m%C3%A1laga-restauraci%C3%B3n-de-la-tribuna-de-los-pobres-m%C3%A1laga, Playwright).
- Descartado: repetir la búsqueda prohibiendo los picos (obligaba a seguir la calle, pero producía bucles absurdos en Lágrimas, Rescate, El Rico y Sangre).
- Resultado: 45/45 sin errores; láminas de las 45 revisadas a ojo tras la última pasada.

**Falta (avisos que quedan, para revisar a mano con fuente):**
- **Lágrimas y Favores:** la lista dice «Plaza de Félix Sáenz, Nueva, Especería, Plaza de la Constitución, Martínez» sin citar Larios; el trazado sube por Nueva y vuelve por ella (lectura literal). Confirmar en prensa si baja por Larios.
- Calles que se recorren menos que el umbral (casi siempre reales: Císter 6 m a la salida del Patio de los Naranjos, Granada 17 m, plazas pequeñas de ~22 m). Lista completa en `cache/malaga-reconstruccion.json` (`calles_no_recorridas`, `idas_y_vueltas`).
- «Alcubilla» (Salesianos) y «Dr. Don Felipe Sánchez de la Cuesta y Alarcón» (Esperanza) sin localizar en OSM: omitidas del trazado.
- Plaza de Jesús Cautivo (Cautivo): no está en OSM.

**Crédito de OpenStreetMap** (aviso de la sesión de marketing): enlace «© colaboradores de OpenStreetMap» → https://www.openstreetmap.org/copyright, siempre visible en el plano (PC y móvil), y párrafo con la licencia ODbL en `/acerca/#mapas`.

## Imágenes de las 8 capitales (2026-10-27, sesión oc-malaga)
- Las 476 fichas de Commons de las 506 fotos, contrastadas con la API de Commons (descripción, categorías y autor); las dudosas, a ojo. Las categorías nombran a la hermandad en casi todas. Los fallos estaban en otra ciudad (El Puerto, San Fernando, Chiclana, Roquetas, Úbeda, Andújar, Moguer, Granada de Nicaragua), otra imagen, bandas, nazarenos o una garita. Todo en `tools/sources/fotos-retiradas.json` (retiradas, retiradas_en, no_portada, titular_corregido), con motivo; lo aplica `site/build.mjs`.
- F4: 7 autores añadidos a `site/data/imagenes.json` desde la ficha de Commons. Las 4 de Córdoba copiadas de otras webs sin autor, fuera.
- `FOTOS-QUE-FALTAN.md` con las 7 capitales: 41 hermandades sin ninguna foto.
- Dudas que se quedan: Jesús Caído (Córdoba), Virgen oscura pero reconocible (se queda); la foto de ficha del Cristo de Gracia es la fachada de la iglesia (se queda como foto de la ficha, no como Cristo).
- Revisión independiente de 20 fotos al azar (7 capitales): 18 correctas, 0 fallos de hermandad o ciudad, 2 válidas pero en las que la Virgen apenas se ve (Rosario del Mar y Borriquita de Almería), anotadas en FOTOS-QUE-FALTAN.md.
