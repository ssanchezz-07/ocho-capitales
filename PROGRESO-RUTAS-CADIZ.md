# Progreso · Rutas de Cádiz con el método nuevo

Órdenes: `ORDENES-RUTAS-METODO-NUEVO.md` (carpeta original). Rama `claude/rutas-cadiz-291f7e`.

## Estado (2026-10-26)
- **Fase 1 (datos): hecha.** Las 33 salidas procesionales de Cádiz de 2026 tienen lista oficial de calles completa, literal y en orden, separada en ida (hasta la Catedral) y regreso, con horas de paso y sede de salida y entrada con fuente.
- **Fase 2 (trazado): trazada y evaluada, SIN publicar.** Rama rebasada sobre `origin/main` (herramientas de Málaga, `29c1a57`). Las 32 con ficha en el portal están trazadas con el método nuevo. Evaluador: **30 «nuevo»** (empatan o mejoran en todo a lo publicado) y **2 «revisar»** (Servitas y Obediencia, ver abajo). Capturas revisadas a ojo: bien.
- **Parada por presupuesto** (límite de 5 horas al 84 %, tope 85 %), el 26-oct a las 10:35.
- **Punto exacto para seguir** (desde `tools/itinerarios/rutas/`, con GraphHopper en marcha):
  1. Copiar la caché si falta: `cache/osm-cadiz.json` de la carpeta original (`osm-cadiz-puertas.json` ya está en la caché del worktree).
  2. `node lista-cadiz.mjs` → `node emparejar.mjs cadiz` → `node evaluar.mjs cadiz` (todas a la vez: evaluar con ids sueltos también vale, mezcla).
  3. `node publicar.mjs cadiz` (las 30 «nuevo») y `node publicar.mjs cadiz servitas merced-obediencia --forzar`.
  4. `node site/build.mjs` → Playwright a 390 y 1440 px en `/en-la-calle/cadiz/` (comprobar que salen la Sanidad y el Miércoles Santo).
  5. `git fetch` → `git rebase origin/main` → `git push origin HEAD:main` y avisar a Pablo del hash.

### Cómo se traza Cádiz (lo propio de la capital)
- `rutas/lista-cadiz.mjs` genera `rutas/listas/cadiz.json` desde `listas-cadiz-2026.json`. Horas: fila del primer paso (salida, Nueva, Catedral, Candelaria, Palillero, entrada).
- `alias-calles-cadiz.json`: sedes → templo de OSM (o punto: Catedral, puerta principal nodo 7063298453; Salesianos) y nombres que OSM escribe distinto, cada uno con su fuente en `_fuentes` (Plaza de Pío XII = Plaza de la Catedral; Alameda Apodaca = Clara Campoamor; Plaza de las Flores = Plaza Topete; Avda. 4/Cuatro de Diciembre…).
- **Catedral por dentro** (`rutas/ciudades.mjs`): si el itinerario sigue por Arquitecto Acero tras la estación (todas menos las vísperas y la Resurrección), se entra por la puerta principal y se sale por la de Arquitecto Acero. Fuente: en 2025 se hizo al revés «de forma excepcional» por el Año Jubilar ([planomato, Obediencia 2025](https://www.planomato.com/es/cadiz/p/nazareno-obediencia)). Esa puerta no está en OSM: punto aproximado en la fachada. Para ello `comun.mjs` admite ahora una puerta de catedral como punto `{lat, lon, id}` además de nodo OSM (Málaga no cambia).
- La «Plaza Stmo. Cristo de la Vera Cruz» (junto a San Francisco) no está en OSM y el parecido de nombres la llevaba a «Calle Cruz», a 600 m: va como marca sin trazar.

## Archivos
| Archivo | Qué es |
|---|---|
| `tools/itinerarios/leer-cadiz-2026.py` | Lee el PDF de Canal Sur: texto de cada itinerario (págs. 32-35, a dos columnas), tabla de horas de cada ficha por posición y «Sede Canónica». Comprueba que hay tantas fichas como itinerarios (33). |
| `tools/itinerarios/sedes-cadiz.json` | Templos (edificio de OSM, dirección solo si una fuente la da) y las 7 hermandades que en 2026 no salen o no vuelven a su sede canónica, con su cita. |
| `tools/itinerarios/listas-cadiz.mjs` | Une las dos cosas y escribe el archivo de datos. |
| `tools/itinerarios/listas-cadiz-2026.json` | **El archivo de datos de Cádiz**: por hermandad, itinerario literal, `ida` y `regreso` (cada calle con su texto literal, la calle limpia y el lado), horas (cruz de guía, paso, último paso), sede canónica, salida y entrada con fuente. |

Regenerar:
```
uvx --from pdfplumber python -I tools/itinerarios/leer-cadiz-2026.py "<carpeta original>/Itinerarios Semana Santa/2026/Cádiz/CADIZ 26.pdf" tools/itinerarios/cache/cadiz-2026-crudo.json
node tools/itinerarios/listas-cadiz.mjs
```

## Fuentes
- **Calles y horas:** *Programa de la Semana Santa de Cádiz 2026*, Canal Sur Radio, con los itinerarios del Consejo ([PDF](https://www.canalsur.es/resources/archivos_offline/2026/3/26/1774544876433CADIZ_26.pdf), 26-3-2026). Es el mismo archivo que `Itinerarios Semana Santa/2026/Cádiz/CADIZ 26.pdf`. Cada hermandad lleva su página de itinerario y de ficha.
- **Sedes 2026 que cambian:** Cádiz Directo, [modificaciones de horarios y recorridos](https://www.cadizdirecto.com/cadiz/la-semana-santa-2026-de-cadiz-ya-tiene-horarios-y-recorridos-conoce-todas-las-modificaciones) (4-3-2026) y [guía de la Semana Santa 2026](https://www.cadizdirecto.com/cadiz/guia-de-la-semana-santa-de-cadiz-2026-desde-las-visperas-hasta-el-resucitado/) (26-3-2026).
- **Situación de los templos:** OSM (edificio `place_of_worship`, centro por Nominatim). Puertas `entrance` de Cádiz en `tools/itinerarios/cache/osm-cadiz-puertas.json` (Overpass, 26-10-2026): hay muy pocas; la de la Catedral sí (nodo 7063298453).

## Lo que ya se vio en Cádiz y queda resuelto
- **Cabeceras perdidas en el lector antiguo** (`leer-cadiz.py`): no leía «Itinerario :» con espacio ni «MIERCOLES» sin tilde. Por eso el plano publicado **no tiene la Sanidad ni la Humillación**, y las hermandades del Miércoles Santo salían como del Martes. El lector nuevo lee las 33 y cada una con su propio recorrido.
- **Hermandades de Santa Cruz** (templo cerrado por obras en 2026): Sanidad, Aguas y Santo Entierro salen y vuelven al **Oratorio de San Felipe Neri**; Medinaceli sale de San Felipe Neri y se recoge en **San Francisco**; el Perdón sale de la **Catedral**.
- **Jesús Caído** sale de San Francisco y vuelve a su **capilla del Parque Genovés**.
- **Expiración** sale del **Carmen** (obras en la Castrense).

## Lista para Pablo (mirar cuando esté trazado)
Ninguna hermandad se queda sin lista completa. Estas tienen algo que conviene mirar:
| Hermandad | Qué mirar |
|---|---|
| **Humillación** (Sábado de Pasión, sale de Santiago) | Es una salida nueva de 2026 (cotitular de la Piedad). **No tiene ficha en el portal** (`portal.json`), así que el plano no puede mostrarla hasta que la tenga. ¿Ficha propia o dentro de la Piedad? Decisión tuya. |
| **El Perdón** | El programa la pone en la **Madrugada**; el portal, en Viernes Santo (sale a las 00:50). La entrada en la Catedral sale del itinerario («…Arquitecto Acero, Plaza de la Catedral, a su Templo»), no de la prensa. |
| **Las Aguas** | La prensa da la salida desde San Felipe Neri; la entrada la deduzco del itinerario («Torre, Santa Inés a su Templo»). |
| **Expiración** | Entrada en el Carmen deducida del itinerario («Alameda Hermanas Carvia Bernal (Izq), a su Templo»). |
| **Siete Palabras** | El regreso dice «Plaza San Agustín, **San Agustín**, Nueva»: parece errata por «San Francisco» (así lo hacen todas las demás). Se deja literal; mirar en el editor. |
| **Jesús Caído** | El programa escribe «Plaza **Istmo.** Cristo de la Vera-Cruz» (por «Stmo.»); la calle limpia ya va corregida y anotada. Pasa por el interior del Parque Genovés (Paseo de las Palmeras). |
| **Piedad, Afligidos** | «Plaza de Pío XII» es la Plaza de la Catedral (GCatholic da la Catedral en «Plaza del Pío XII»). OSM no tiene ese nombre: hará falta alias. |
| **Ecce Mater Tua** | No hace estación de penitencia: todo el recorrido va como «ida». Tabla de horas con solo salida, Palillero y entrada. |
| **La Resurrección** | La tabla de horas del programa dice **2025**, no 2026. Se usa con ese aviso. |
| **Despojado** | Sale y entra por el interior del Colegio Salesianos San Ignacio (Avda. María Auxiliadora 7). |
| **Servitas y Obediencia** (vísperas) | Su itinerario pone «Plaza de la Catedral, Arquitecto Acero, (Estación)»: parece que entran por Arquitecto Acero y salen por la principal, como en 2025. El trazado solo pisa la esquina de Arquitecto Acero (por eso el evaluador dice «revisar»); en todo lo demás mejora mucho lo publicado (Servitas salía a 326 m de San Lorenzo). |
| **Todas (Carrera Oficial)** | Pequeño gancho en la **Plaza de San Juan de Dios** entre Nueva y Pelota: OSM no une bien esas calles con la plaza (hueco de 96 m). Mirar en el editor si merece un punto de paso. |
| **Palma y Huerto** | «Virgen de las Penas» y «Plaza Pinto» no están en OSM con ese nombre: no se trazan (no se inventa). |

## Falta
- **Direcciones postales** de la mayoría de templos: GCatholic y la diócesis no las dan en abierto; Nominatim solo da la calle más cercana, y no la uso como dirección. Cada sede va con su edificio de OSM y su fuente; la dirección solo donde una fuente la da (Santiago, Catedral, Salesianos, Castrense).
- **Puertas OSM** de casi todos los templos de Cádiz: no están mapeadas. El trazado tendrá que usar el edificio y la primera o la última calle.
