# LABORATORIO-RUTAS · Ocho Capitales

_Laboratorio (rama `claude/rutas-graphhopper-628422`, sin subir a `main`, sin tocar `site/data/recorridos/*.json`). Encargo de Pablo: «lanza una sesión que pruebe GraphHopper, el emparejamiento de calles por continuidad y el editor de correcciones con 10 hermandades, comparándolo con lo actual»._

Las 10 de prueba (Málaga): Pollinica, Pasión, Dolores del Puente, El Rico, La Paloma, Fusionadas, Resucitado, Humildad y Paciencia, Estudiantes, Esperanza.

## Estado: EN PAUSA (2026-10-25, ~23:05)
Pausado por orden de Pablo (vía la sesión principal): el límite de 5 horas iba al 83-87 %. Se renueva hacia las 02:30. Uso semanal al empezar: 12 %.

### Hecho
1. **Descargas (fuentes oficiales), fuera del repo, en `C:\Users\pablo\Herramientas-IA\graphhopper\`:**
   - `graphhopper-web-11.1.jar` (release estable 11.1, github.com/graphhopper/graphhopper/releases/download/11.1/).
   - `andalucia-latest.osm.pbf` (195,5 MB, Geofabrik). MD5 comprobado contra `andalucia-latest.osm.pbf.md5` de Geofabrik: coincide (`7ad0bfa2…7b0`).
   - `config.yml` y `procesion.json` (copias de `tools/itinerarios/laboratorio/graphhopper/`).
   - **El servidor NO se ha arrancado todavía** (ni importado el grafo). Java 21.0.7 presente.
2. **Perfil «procesión»** (`tools/itinerarios/laboratorio/graphhopper/procesion.json`), a partir del `foot.json` que trae GraphHopper 11.1: peatonales y plazas sí; `motorway`/`trunk` prohibidas (y además ignoradas al importar); escaleras ×0,05 (un trono no baja escaleras); caminos/pistas ×0,3; privadas ×0,05. Sin CH ni LM (rutas cortas; así funcionan `pass_through` y los ajustes por petición).
3. **Caché copiada al worktree** (ignorada por git, no se editó la original): `tools/itinerarios/cache/` completa (PDF y texto ACC 2026, `malaga-itinerarios-texto.json`, `osm-malaga.json`, `osm-malaga-puertas.json`, Nominatim, guía nazarena) y `Itinerarios Semana Santa/` (solo Málaga).
4. **Línea base del método actual** (`tools/itinerarios/laboratorio/actual/`): copia del `reconstruir-malaga.mjs` **tal como estaba en la carpeta original a las 23:00** (con los cambios aún sin confirmar de la sesión de Málaga: enlaces < 35 m, paso por la Catedral, salida de tronos, progreso por calle…), más sus `alias-calles-malaga.json` y `casas-hermandad-malaga.json`. Solo se cambiaron las rutas de entrada/salida para que escriba en `laboratorio/actual/salida/` (nunca en producción). Ejecutado en las 10:

| Hermandad | m | ratio | salida a | avisos | vueltas | tiempo (s) |
|---|---|---|---|---|---|---|
| pollinica | 3702 | 1,17 | 14 m | 5 | 8 | 2,8 |
| pasion | 2932 | 1,28 | 2 m | 1 | 6 | 3,5 |
| dolores-del-puente | 4221 | 1,24 | 8 m | 8 | 10 | 3,0 |
| el-rico | 3361 | 1,18 | 7 m | 1 | 3 | 1,6 |
| paloma | 2645 | 1,16 | 3 m | 6 | 0 | 1,4 |
| fusionadas | 3171 | 1,23 | 0 m | 1 | 8 | 2,1 |
| resucitado | 2322 | 1,20 | 9 m | 0 | 0 | 1,2 |
| humildad-y-paciencia | 8208 | 1,22 | 26 m | 5 | 10 | 2,2 |
| estudiantes | 3329 | 1,14 | 18 m | 4 | 2 | 1,6 |
| esperanza | 5815 | 1,17 | 17 m | 1 | 14 | 3,0 |

   (Métricas del propio script; la comparación final usará un **evaluador común** para los dos métodos, ver abajo. Tiempos = proceso completo de Node por hermandad, incluida la carga del grafo.) Trazados en `laboratorio/actual/salida/trazas/<id>-malaga.json`, informe con la lista de calles en `salida/informe.json`.

### Punto exacto para retomar
1. `mcp__ccd_session_mgmt__get_usage` (parar al 88 % semanal).
2. Importar y arrancar GraphHopper (la primera vez importa el grafo, unos minutos):
   `cd C:\Users\pablo\Herramientas-IA\graphhopper ; java -Xmx3g -jar graphhopper-web-11.1.jar server config.yml` (en segundo plano; listo cuando responda `http://localhost:8989/health`). Si falla por `encoded_values`, ajustar `config.yml` a lo que pida el error. Apagarlo al acabar.
3. Escribir `tools/itinerarios/laboratorio/emparejar.mjs` (método nuevo), con este diseño ya decidido:
   - Lista oficial = `informe.calles` de `laboratorio/actual/salida/informe.json` (misma lista limpia del PDF ACC 2026 para los dos métodos). Las marcas (Tribuna, Torre Sur, Estación de Penitencia, Patio de los Naranjos) son hitos sin geometría.
   - **Candidatas:** vías de `cache/osm-malaga.json` cuyo nombre coincide de forma aproximada (misma `clave()` que el método actual + distancia de edición pequeña), agrupadas en **componentes conexas por nombre** (así «Granada» del centro y otra «Granada» lejana son candidatas distintas).
   - **Continuidad (estilo Viterbi / ajuste de GPS):** estados = cruces entre la calle i y la i+1 (nodo compartido; si no se tocan, el par de nodos más cercano con penalización por hueco, máximo ~300 m). Coste = recta entre cruces consecutivos sobre la misma candidata + penalización de huecos + distancia de la sede a la primera/última calle. Se elige la cadena de mínimo coste: cada calle toca a la siguiente.
   - **Sede:** `casas-hermandad-malaga.json` (punto o dirección) y puerta `entrance` de `cache/osm-malaga-puertas.json` por dirección; si no, el templo de OSM.
   - **GraphHopper** une sede → cruces → sede con `profile=procesion`, `pass_through=true` (sin retrocesos en los puntos de paso), `snap_preventions` sin `bridge` (Puente de la Aurora, Tribuna de los Pobres), `points_encoded=false`.
   - Calle sin candidata: aviso y se salta; nunca se inventa.
   - **Correcciones:** `tools/itinerarios/laboratorio/correcciones-malaga.json` por hermandad: `salida`/`entrada` {lat, lon, fuente}, `calles[i]` = componente elegida, `puntos[i]` = cruce arrastrado, `notas`. El proceso las respeta al regenerar.
4. **Evaluador común** (`laboratorio/evaluar.mjs`) para los dos trazados: calles de la lista que aparecen y en orden (encaje de cada tramo con la vía OSM con nombre a < 8 m; subsecuencia común más larga), distancia de salida/entrada a la sede, tramos > 150 m fuera de la red, retrocesos (giros > 165°), tiempo.
5. **Editor** en `tools/itinerarios/editor/` (solo local): servidor Node pequeño (`servidor.mjs`, sirve la página, guarda `correcciones-malaga.json`, pide a GraphHopper y recalcula) + `editor.html` con la lista oficial a un lado y plano SVG propio (sin Leaflet ni teselas) al otro; arrastrar punto, elegir la calle buena, cambiar salida/entrada, anotar fuente; un `.bat` para abrirlo con doble clic. Probar con Playwright de Python (instalado, 1.63) — el MCP de Playwright no conectó en esta sesión.
6. Capturas superpuestas (actual vs nuevo) con `matplotlib` (como `previsualizar-malaga.py`) o desde el editor; tabla comparativa aquí; recomendación y coste para las 8 capitales; commit en la rama; aviso a Pablo.
