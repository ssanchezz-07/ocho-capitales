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
- **Punto exacto para seguir** (parada por el límite de 5 horas al 81 %):
  1. Leer el veredicto del revisor independiente de las 33 (lanzado en esta sesión). Si falla alguna: corregir, repetir `node lista-cadiz.mjs` → `node puertas-cadiz.mjs` → `node emparejar.mjs cadiz` → `node evaluar.mjs cadiz` → `node publicar.mjs cadiz`, y volver a revisar esa.
  2. `node site/build.mjs` → `python -I probar-plano.py cadiz` (390 y 1440 px).
  3. `git fetch` → `git rebase origin/main` → `git push origin HEAD:main` → avisar a Pablo del hash.

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
