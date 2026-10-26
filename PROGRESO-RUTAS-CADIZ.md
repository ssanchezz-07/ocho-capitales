# Progreso · Rutas de Cádiz con el método nuevo

Órdenes: `ORDENES-RUTAS-METODO-NUEVO.md` (carpeta original). Rama `claude/rutas-cadiz-291f7e`.

## Estado (2026-10-26)
- **Fase 1 (datos): hecha.** Las 33 salidas procesionales de Cádiz de 2026 tienen lista oficial de calles completa, literal y en orden, separada en ida (hasta la Catedral) y regreso, con horas de paso y sede de salida y entrada con fuente.
- **Fase 2 (trazado): hecha y publicada.** Las **33** salidas, trazadas con el método nuevo y publicadas en `site/data/recorridos/cadiz.json` (la Humillación desde el 2026-10-26, con ficha propia). Evaluador: **33 «nuevo»**. `node site/build.mjs` sin errores; `probar-plano.py cadiz` con Playwright a 390 y 1440 px. Entran la **Sanidad** y la **Humillación**, que antes no estaban.
- **Decisiones de Pablo (2026-10-26), ya aplicadas:** Siete Palabras «San Agustín» = San Francisco (errata); Plaza de San Juan de Dios cruzada de frente de Nueva a Pelota; «Virgen de las Penas» = la vía de la Taberna Las Banderas (OSM «Calle San Pablo», way/39723962); «Plaza Pinto» = Plaza del Tío de la Tiza; el Perdón en «Jueves Santo y Madrugada»; Humillación con ficha propia «Humillación (Piedad)» (alta en `tools/sources/complementos.json`, `visperas.nuevas`).
- **Regenerar** (desde `tools/itinerarios/rutas/`, con GraphHopper en marcha y `cache/osm-cadiz.json` copiado de la carpeta original): `node lista-cadiz.mjs` → `node emparejar.mjs cadiz` → `node evaluar.mjs cadiz` → `node publicar.mjs cadiz` → `node site/build.mjs` → `python -I probar-plano.py cadiz`.

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

## Cierre al 100 % (encargo del 2026-10-26, tarde) · EN CURSO
- **Hecho y comprobado en local (sin subir todavía):**
  - **Segunda fuente de 2026 para las 33:** cuadernillo «Semana Santa de la Bahía de Cádiz 2026» de Radio Cádiz (Cadena SER), págs. 3-46 → `tools/itinerarios/cadiz-2026-cruzdeguia.json` (`cruzdeguia-cadiz.mjs` + `leer-pdf-stdin.py`). Itinerarios: **32 de 33 idénticos** calle a calle al programa de Canal Sur. Cada hermandad lleva `segunda_fuente` en `listas-cadiz-2026.json`.
  - **Descendimiento:** el cuadernillo trae «Columela» entre Palillero y San Francisco (ida), omitido en Canal Sur: añadido con nota. **Duda para Pablo:** al volver, Canal Sur dice «Plaza Palillero, Javier de Burgos, Barrié» y el cuadernillo «Plaza Palillero, Novena, Barrié (Izq.)». Se mantiene Canal Sur.
  - **Entradas confirmadas** con el templo de 2026 del cuadernillo: Las Aguas (Oratorio de San Felipe, pág. 30), Expiración (Iglesia del Carmen) y el Perdón (Santa Iglesia Catedral, recogida 09:00). Servitas y Obediencia: la puerta de la Catedral (entrar por Arquitecto Acero) sigue deducida del orden de calles.
  - **Plaza de Pío XII:** alias a la Plaza de la Catedral con fuente (GCatholic, la Catedral en «Plaza del Pío XII»), en `alias-calles-cadiz.json`.
  - **Resurrección:** las horas de la tabla rotulada «2025» son las de 2026 (las mismas del cuadernillo, pág. 46). Anotado en sus horas.
  - **Puertas:** `rutas/puertas-cadiz.mjs` sitúa la salida y la entrada en el punto medio de la fachada que da a la calle de la portada (`portada` de cada templo en `sedes-cadiz.json`, con fuente). Con cita expresa: Santiago, San Francisco, La Palma, San Antonio, San Pablo; deducidas de la fuente: San Lorenzo (Sagasta), San Felipe Neri (Santa Inés), San José (avenida). Sin cita (`sin_cita`): Merced, San Agustín, Carmen, Caminito, Capuchinos, Santa María, capilla del Caído (dirección postal y primera calle del itinerario). Santo Domingo y la Catedral, con su puerta de OSM.
  - **Plaza de San Juan de Dios:** la recta de Nueva a Pelota atravesaba un edificio pequeño (way/844713222; aviso de la sesión de portada). Ahora pasa por la parte abierta de la plaza (`rectos_por`). Comprobador de edificios de la sesión de portada (`comprobar-fondo.mjs`, copia sin tocar): **33/33 sin cruces de edificio ni tramos fuera de calle**.
  - Evaluador: 33 «nuevo». Publicado en local en `site/data/recorridos/cadiz.json`.
- **Revisión independiente n.º 1 (2026-10-26): 3 FALLO y 7 DUDA → corregidos y subidos (`24eb1ea`).**
  - Humillación: horas bien leídas (su columna «NUEVA» es la entrada en la Catedral): 18:55 · Catedral 19:15/19:30 · Candelaria 20:05 · Palillero 20:35 · 23:20.
  - Huerto y Despojado: salida y entrada en recta por la Plaza de Capuchinos y el patio del Colegio Salesianos (`rectos_sede`).
  - San José da a la Avenida Ana de Viya (dirección del Ayuntamiento): la Borriquita ya no sube y baja al final.
  - Plaza de San Juan de Dios: sin entradas y vueltas (marca + recta de frente Nueva→Pelota/Pomponio Mela por la parte abierta).
  - Bucles de GraphHopper sobre la calzada paralela (Brunete): quitados (`sinBucles` en `ciudades.mjs`, solo Cádiz).
  - Resurrección: entra y sale por la puerta principal (opción `catedral` de su lista).
  - Equivalencias con fuente: Compás de Santo Domingo = Plaza de Santo Domingo; Tinte = Callejón del Tinte.
  - Puertas: salida y entrada en la calle de la portada (`puertas-cadiz.mjs`; en plazas, en la fachada).
  - Comprobado: evaluador 33 «nuevo», edificios 33/33 (`comprobar-fondo.mjs`), Playwright 8/8 a 390 y 1440 px.
- **Dudas para Pablo** (el coordinador se las pasa): Descendimiento, regreso por **Javier de Burgos** (Canal Sur, lo publicado) o **Novena** (Radio Cádiz); Perdón, salida 01:10 (Canal Sur, publicado) frente a 01:30 (Radio Cádiz).
- **Revisión independiente n.º 2 (12 a fondo + 6 al azar, 2026-10-26): 3 FALLO → corregidos y subidos.**
  - Nazareno de Santa María y Medinaceli atajaban unos 105 m por Rosario y Beato Diego: la Plaza de San Francisco se cruza en recta por su lado abierto (`cruzar_hasta`, opción nueva de lista en `emparejar.mjs`).
  - Horquilla de 35-44 m en la puerta de Arquitecto Acero (31 de 33): la puerta va ahora sobre la calle, ante la fachada (punto aproximado, sin puerta en OSM).
  - Borriquita y Cigarreras: sin el bucle de 80 m al volver por la Plaza de San Juan de Dios (Nueva → Plocia por la esquina, la plaza como marca).
  - Comprobado: evaluador 33 «nuevo», edificios 33/33, ninguna ida y vuelta > 25 m salvo la de la Resurrección (la pide su itinerario) y dos de 25 m justos (Borriquita y Cigarreras al entrar en la Avda. 4 de Diciembre), compilación sin errores, Playwright 8/8.
  - Menores que quedan (< 25 m): V de ~25 m en el Compás de Santo Domingo (Cena, Cigarreras), espolones de 7-14 m, pico de 9 m en Plaza Candelaria; García Carrera solo se cruza (Despojado).
- **Punto exacto para seguir:**
  1. Dudas de Pablo (Descendimiento, Perdón): las pasa el coordinador. Si contesta, cambiar `listas-cadiz.mjs` (ERRATAS_PABLO / DUDAS) y regenerar.
  2. Después (cuando el coordinador lo active): sedes de Cádiz, Huelva y Almería en `site/data/sedes/<capital>.json` con `node tools/itinerarios/rutas/sedes.mjs <capital>` (formato de `rutas-malaga`, `34355d3`). Cádiz: pasar `sedes-cadiz.json` a `rutas/sedes-cadiz-correcciones.json` (templo = sede canónica; las de Santa Cruz, en Santa Cruz aunque en 2026 salieran de otros templos, con nota). Huelva y Almería: callejeros copiados a la caché (`cache/osm-huelva.json`, `cache/osm-almeria.json`); el de Huelva solo tiene 18 templos: hace falta una descarga de Overpass del término municipal (`cache/templos-<capital>.json`, se dejó lanzada). Casas hermandad: con fuente, una a una (las fichas del Consejo de Cádiz no dan dirección).

## Lista para Pablo (mirar cuando esté trazado)
Ninguna hermandad se queda sin lista completa. Estas tienen algo que conviene mirar:
| Hermandad | Qué mirar |
|---|---|
| **El Perdón** | Ahora en «Jueves Santo y Madrugada» (sale a las 00:50). La entrada en la Catedral sale del itinerario («…Arquitecto Acero, Plaza de la Catedral, a su Templo»), no de la prensa. |
| **Las Aguas** | Salida y entrada en San Felipe Neri: confirmadas (Cádiz Directo y cuadernillo de Radio Cádiz 2026). |
| **Expiración** | Salida y entrada en el Carmen: confirmadas (Cádiz Directo y cuadernillo de Radio Cádiz 2026). |
| **Jesús Caído** | El programa escribe «Plaza **Istmo.** Cristo de la Vera-Cruz» (por «Stmo.»); la calle limpia ya va corregida y anotada. Pasa por el interior del Parque Genovés (Paseo de las Palmeras). |
| **Piedad, Afligidos** | «Plaza de Pío XII» = Plaza de la Catedral (alias con fuente: GCatholic). Resuelto. |
| **Ecce Mater Tua** | No hace estación de penitencia: todo el recorrido va como «ida». Tabla de horas con solo salida, Palillero y entrada. |
| **La Resurrección** | Horas de 2026 confirmadas con el cuadernillo de Radio Cádiz (pág. 46); la tabla de Canal Sur dice «2025» por errata. |
| **Despojado** | Sale y entra por el interior del Colegio Salesianos San Ignacio (Avda. María Auxiliadora 7). |
| **Servitas y Obediencia** (vísperas) | Su itinerario pone «Plaza de la Catedral, Arquitecto Acero, (Estación)»: lo trazo entrando por Arquitecto Acero y saliendo por la puerta principal, como en 2025 (opción «catedral» de su lista). Es una lectura del orden de calles: confírmalo. Antes Servitas salía a 326 m de San Lorenzo. |

## Falta
- **Direcciones postales** de la mayoría de templos: GCatholic y la diócesis no las dan en abierto; Nominatim solo da la calle más cercana, y no la uso como dirección. Cada sede va con su edificio de OSM y su fuente; la dirección solo donde una fuente la da (Santiago, Catedral, Salesianos, Castrense).
- **Puertas OSM** de casi todos los templos de Cádiz: no están mapeadas. El trazado tendrá que usar el edificio y la primera o la última calle.

## Sedes con coordenadas (para el plano fuera de temporada) · 2026-10-27
- **Subidas** (`3cbb437..f0148fe`), formato común `site/data/sedes/<capital>.json` con `node tools/itinerarios/rutas/sedes.mjs <capital>`:
  - **Cádiz: 33 de 33 templos.** 26 por la ficha del portal y su edificio de OSM; 7 en `rutas/sedes-cadiz-correcciones.json` con la «Sede Canónica» del programa de Canal Sur 2026. Las de Santa Cruz, en su sede canónica.
  - **Huelva: 15 de 28.** Los 13 que faltan no están en OSM: Sagrado Corazón (Cena, Tres Caídas, Victoria), Cristo Sacerdote, San Sebastián (Mutilados, Estudiantes), capillas del Cautivo, Calvario, Esperanza y Prado, Iglesia del Cristo de la Misericordia, Parroquia de los Dolores y Santa María Madre de la Iglesia. Para situarlos haría falta su dirección con fuente (web de la hermandad o diócesis) y aceptar un punto en la calle en vez del edificio de OSM.
  - **Almería: 22 de 23.** Falta San Antonio (Ciudad Jardín): dos «San Antonio de Padua» en OSM, sin fuente que diga cuál.
  - **Casas hermandad: ninguna** en las tres. Las fichas del Consejo de Cádiz no dan dirección; queda pendiente buscarla en la web de cada hermandad.
- Revisión al azar del 10 %: 7 de 7 correctas (ficha y edificio). Portada con Playwright a 390 y 1440 px: 33, 15 y 22 símbolos de sede, sin desbordamiento ni errores.
- Caché: `cache/templos-huelva.json` y `cache/templos-almeria.json` (Overpass del 27-oct).
