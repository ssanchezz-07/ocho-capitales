# Rutas · método nuevo (continuidad + GraphHopper + editor)

Herramientas para trazar los recorridos de cualquier capital a partir de su **lista oficial de calles**. Salen del laboratorio
(`../laboratorio/`, informe en `LABORATORIO-RUTAS.md`): mismo método, pero sin nada fijo de Málaga.

## Antes de empezar
- **GraphHopper** en `http://localhost:8989` (perfil `procesion`; configuración en `graphhopper/`). Hay uno compartido:
  compruébalo con `curl http://localhost:8989/health` y **no arranques otro**. Si no responde, avisa a Pablo.
- **Caché** (no va en git; cópiala de la carpeta original `tools/itinerarios/cache/`): `osm-<capital>.json` (callejero) y,
  si no está, las puertas con `node descargar-puertas.mjs <capital>`.
- **Lista** `listas/<capital>.json` (formato abajo). Sin fuente no hay recorrido.
- Si la capital necesita marcas propias (tribuna, carrera oficial, estación de penitencia por dentro), su entrada en `ciudades.mjs`.

## Comandos (desde esta carpeta)
```
node emparejar.mjs <capital> [id …]        # traza → salida/<capital>/trazas/<id>.json + informe.json (avisos)
node evaluar.mjs <capital> [id …]          # compara con lo publicado → salida/<capital>/evaluacion.json + propuesta
python -I capturar.py <capital> [id …]     # capturas/<capital>/<id>.png: publicado en rojo, nuevo en azul
node publicar.mjs <capital> [id …]         # escribe en site/data/recorridos/<capital>.json las que el evaluador deja en «nuevo»
node publicar.mjs <capital> id … --forzar  # las indicadas aunque el evaluador dijera «revisar» (tras mirarlas o corregirlas)
```
Los `id` pueden ir sin el sufijo de la capital (`pasion` = `pasion-malaga`). Sin ids, todas las de la lista.
Después: `node site/build.mjs` y comprobar el plano «En la calle» a 390 y 1440 px.

**Editor** (para Pablo): doble clic en `../editor/Abrir editor de rutas.bat` (o `node ../editor/servidor.mjs [capital]`) →
`http://localhost:8765`. Se elige la capital y la hermandad; lo que se corrige va a `correcciones-<capital>.json` con su fuente,
y el emparejador lo respeta cada vez que vuelve a trazar. Prueba: `python -I probar-editor.py` con el editor en el puerto 8766
(`PUERTO_EDITOR=8766`).

## Qué mide el evaluador y qué propone
Calles de la lista recorridas de verdad (≥ 15 m sobre una vía con ese nombre exacto), en orden, distancia de la salida y la
entrada a la sede (máx. 60 m), rectas de más de 150 m fuera de la red y retrocesos (giros > 160°).
- **nuevo**: empata o mejora en todo → se publica.
- **publicado**: solo empeora → se queda lo publicado.
- **revisar**: gana en algo y pierde en otra cosa (por ejemplo, deja de recorrer una plaza) → mirar la captura y decidir,
  o corregir en el editor y volver a trazar.

## Formato de `listas/<capital>.json`
```json
{
  "capital": "cordoba",
  "fuente": "URL general (la de cada hermandad manda)",
  "hermandades": {
    "<id del portal>": {
      "fuente": "URL del itinerario oficial 2026",
      "calles": ["Parroquia de …", "Calle A", "Plaza B", "…", "Parroquia de …"],
      "horas": { "0": "18:00", "12": "20:15", "40": "23:30" },
      "hitos": [12],
      "regreso_desde": 20,
      "rejilla": false,
      "notas": ["…"]
    }
  }
}
```
- `calles`: literal y en orden. El primero y el último, la sede (templo o «Casa Hermandad»): la sede de una casa hermandad sale
  de `../casas-hermandad-<capital>.json` (`{ "<id>": { "dir": "Calle X 12, Ciudad", "punto": [lat, lon]?, "fuente": "…" } }`).
- `horas`: índice de `calles` → hora oficial. Las demás se reparten por la distancia andada en el plano.
- `hitos`: índices que son marcas y no calles (tribuna, carrera oficial…). También vale `marcas` en `ciudades.mjs`.
- `rectos` (opcional): índices de calles a las que se llega en línea recta desde la anterior (hasta 200 m), para cruzar una plaza
  abierta que OSM no tiene como vía (en Cádiz, Nueva → Plaza de San Juan de Dios → Pelota).
- `regreso_desde`: índice donde empieza el regreso (se dibuja discontinuo). Si falta, la expresión `regreso` de `ciudades.mjs`.
- `catedral` (opcional): `{ "entra": nodo OSM, "sale": nodo OSM, "nombre": "…" }` si esa hermandad entra o sale de la
  Catedral por otra puerta que la de `ciudades.mjs` (en Córdoba, unas salen por Santa Catalina y otras por el Perdón).
- Correcciones (`correcciones-<capital>.json`, cada una con `fuente`): `puntos[i]` (entrada en el elemento i), `paso[i]` (puntos de paso antes de i), `calles[i]` = `{via | vias | punto | omitir | esquina}`, `cruzar[i]` (plaza o recta que GraphHopper no enruta: línea recta), `tramos[i]` = `{fuente, estimado}` (fuente del tramo que llega a i; sin fuente de este año, «estimado»), `salida`/`entrada` = `{lat, lon, fuente}`.
- `rejilla: true` si la fuente solo da un punto cada media hora: los tramos que GraphHopper rellena entre calles que no se
  tocan se publican con `"como": "estimado"` y `"estimado": true`; nunca como oficiales.
- Nombres que OSM escribe distinto: `../alias-calles-<capital>.json` (`{ "Nombre del itinerario": "Nombre en OSM",
  "@Templo del itinerario": "osm:Nombre del templo en OSM" | "geo:lat,lon" }`).

## Archivos
| Archivo | Qué es |
|---|---|
| `ciudades.mjs` | Lo propio de cada capital (marcas, regreso, catedral por dentro) |
| `comun.mjs` | Callejero, candidatas, sedes y puertas, lectura de listas y de lo publicado |
| `emparejar.mjs` | Continuidad (Viterbi) + GraphHopper |
| `evaluar.mjs` | Evaluador común y propuesta |
| `publicar.mjs` | Adaptador al formato de `site/data/recorridos/<capital>.json` |
| `capturar.py` | Capturas de comparación |
| `descargar-puertas.mjs` | Puertas y templos de Overpass |
| `lista-malaga.mjs` | Genera `listas/malaga.json` desde lo publicado (PDF de la Agrupación 2026) |
| `dossier.mjs` | Dossier para una revisión independiente: `node dossier.mjs <capital>` → `salida/<capital>/dossier.md` |
| `probar-plano.py` | Prueba del plano con Playwright a 390 y 1440 px (`python -I probar-plano.py <capital>`) |
| `probar-editor.py` | Prueba del editor con Playwright |
| `salida/<capital>/` | `informe.json` y `evaluacion.json` se versionan; `trazas/`, no |
