# Mapa de los datos de Ocho Capitales

Cada dato de la web vive en **un solo archivo de origen**. Los archivos generados (`portal.json`, `marchas.json`, la base SQLite, `site/dist/`) se rehacen con un comando y no se editan a mano. Para saber dónde y cómo se corrige un dato concreto, mira [COMO-CORREGIR.md](COMO-CORREGIR.md).

## La base de datos para consultar: `datos/ocho-capitales.sqlite`

- **Cómo se genera:** `node tools/db/construir.mjs`. No se sube a git: es una copia para consultar. Solo lee los archivos de origen, así que borrarla no pierde nada. También se genera en cada publicación.
- **Tablas:** una por tipo de dato. Todas comparten las claves `hermandad` (el *slug* de la ficha, p. ej. `pasion-malaga`) y `capital` (`sevilla`, `malaga`…).

| Tabla | Qué es | Sale de |
|---|---|---|
| `capitales` | las 8 capitales | `portal.json` |
| `hermandades` | ficha de cada hermandad (día, sede en texto, fundación, historia, web, hora de salida, fuente) | `portal.json` |
| `sedes` | templo y casa hermandad con coordenadas y fuente | `site/data/sedes/<capital>.json` |
| `titulares` | imágenes titulares, autor, atribución y fuente del autor | `portal.json` |
| `imagenes` | fotos y escudos, con autor, licencia y página de Commons | `site/data/imagenes.json` |
| `habitos` | hábito de los nazarenos, con fuente | `tools/sources/habitos.json` |
| `bandas` y `acompanamientos` | formaciones musicales y a quién acompañan cada año | `portal.json` |
| `imagineros` y `obras` | biografía con fuentes y obras que procesionan | `portal.json` |
| `marchas` | todas las marchas (también las no dedicadas): compositor, año, formación, dedicatoria, estado y fuentes por campo | `tools/sources/marchas.json` |
| `partituras_bne` | partituras de la Biblioteca Nacional | `tools/sources/marchas-bne.json` |
| `itinerarios` | horario oficial leído, punto a punto | `tools/sources/itinerarios-2026.json` |
| `recorridos` | recorrido del plano, con coordenadas | `site/data/recorridos/<capital>.json` |
| `extraordinarias` | salidas extraordinarias y magnas | `tools/sources/itinerarios-extraordinarios.json` |
| `agenda` | cultos y actos (verificados y de prensa) | `portal-cofrade/data/eventos.json`, `tools/sources/agenda-externa.json` |
| `noticias` | titulares de prensa | `site/data/news.json` |
| `fuentes` | **cada enlace que respalda un dato**: tabla, clave, campo y URL | todo lo anterior |
| `correcciones` | correcciones hechas a mano: qué, por qué, con qué fuente y en qué archivo | `marchas-revision`, `marchas-correcciones`, `fotos-retiradas`, redirecciones |

**Vistas para trabajar:** `v_hermandades_sin_foto`, `v_hermandades_sin_sede` (sin punto en el plano), `v_hermandades_sin_marchas`, `v_hermandades_sin_fuente`, `v_hermandades_sin_itinerario`, `v_titulares_sin_autor`, `v_bandas_sin_localidad`, `v_imagineros_sin_bio`, `v_marchas_sin_verificar`, `v_marchas_sin_formacion` y `v_resumen_capital` (cifras y huecos por capital).

**Ejemplo:** `node -e "const {DatabaseSync}=require('node:sqlite');console.table(new DatabaseSync('datos/ocho-capitales.sqlite').prepare('SELECT * FROM v_resumen_capital').all())"`

`datos/auditoria.json` resume los mismos huecos cada vez que se genera la base.

## Los archivos de origen, uno a uno

| Dato | Archivo de origen | Forma | Fuentes | Lo genera | Lo usan | Sesión dueña |
|---|---|---|---|---|---|---|
| **Hermandades** (fichas) | `data-raw.json` (original del 1-oct) + `tools/enrich-<capital>.js` (fichas oficiales) + `tools/sources/complementos.json` (huecos rellenados con fuente) | por capital → hermandad | webs de agrupaciones, consejos y federaciones; Wikipedia para Sevilla | `node tools/build-data.js` → `portal-cofrade/data/portal.json` | `site/build.mjs`, erCuñao, la base | `oc-marchas` (datos) |
| **Titulares e imagineros** | autor: en la ficha (`enrich-*.js`) o en `complementos.json` (`titulares_autor`); biografías: `IMAG_INFO` en `tools/build-data.js` y `complementos.json` (`bio_relleno`) | — | ficha oficial; Wikipedia, IAPH, UNIA… | `build-data.js` | fichas, erCuñao | `oc-marchas` |
| **Sedes y casas hermandad** (coordenadas) | `site/data/sedes/<capital>.json` | hermandad → `templo`, `casa_hermandad` {nombre o dir, lat, lon, fuente, fuente_coordenadas} | ficha oficial + OpenStreetMap | `tools/itinerarios/rutas/sedes.mjs` | plano, la base | sesiones `rutas-*` |
| **Recorridos** | `site/data/recorridos/<capital>.json` | hermandad → tramos → puntos {fila/hora, lugar, lat, lon} | itinerario oficial + OpenStreetMap | `tools/itinerarios/rutas/` (`emparejar` → `publicar`); ver su README | plano «En la calle», erCuñao, la base | `rutas-malaga`, `rutas-cordoba`, `rutas-cadiz` |
| **Itinerario oficial (texto)** | `tools/sources/itinerarios-2026.json` | hermandad → tramos → puntos con hora | PDF o web oficial | `tools/itinerarios/unir.mjs` | hora de salida, la base | sesiones `rutas-*` |
| **Extraordinarias** | `tools/sources/itinerarios-extraordinarios.json` | `salidas` {clave → hermandad, fecha, tipo, fuente} | agrupación o hermandad | a mano + `tools/itinerarios/rutas/extraordinarias.mjs` | calendario, plano | `rutas-malaga` |
| **Agenda (eventos)** | `portal-cofrade/data/eventos.json` (verificados) y `tools/sources/agenda-externa.json` (de prensa) | lista de eventos | fuente de cada evento | a mano / `tools/agenda-externa.mjs` | calendario, `.ics` | `oc-alojamiento` (automático) |
| **Marchas** | `tools/sources/marchas.json` (modelo único) | marcha → título, compositor, año, formación, dedicatoria, fuentes y URL **por campo** | Marchas de Procesión, Patrimonio Musical, Cofradías y Hermandades, Federación de Granada, BNE, revisión a mano | `node tools/unificar-marchas.mjs` (con `marchas-revision.json`, `marchas-correcciones.json`, `repertorio-*.json`) | fichas de marcha, buscador, erCuñao | `oc-marchas` |
| **Bandas y acompañamientos** | `tools/sources/<capital>-musica.json` y `malaga-musical.json` (guías de cada capital), `acompanamientos-noticias.json`, `localidades.json`, `bandas-redirecciones.json` | por hermandad → pasos → bandas | guía oficial o prensa de cada año | `tools/importar-bandas.mjs`, `tools/importar-malaga-musical.mjs` → `build-data.js` | fichas de banda y de hermandad | `oc-marchas` |
| **Imágenes** | `site/data/imagenes.json`, `imagenes-titulares.json`; retiradas en `tools/sources/fotos-retiradas.json` | hermandad → foto {autor, licencia, página} | Wikimedia Commons | `site/scripts/buscar-*.mjs`, `procesar-imagenes.mjs`, `unir-aprobadas.mjs` | láminas y fichas | `oc-malaga` |
| **Hábitos** | `tools/sources/habitos.json`; colores en `site/data/colores-habito.json` | hermandad → {texto, fuente_url} | ficha oficial | `tools/importar-habitos.mjs`, `tools/colores-habito.mjs` | fichas, plano | `oc-marchas` |
| **Curiosidades** | no se guardan: se calculan de los datos anteriores en `site/build.mjs` (`curiosidades()`) | — | las de cada dato | `node site/build.mjs` | «Hoy», erCuñao | `oc-curiosidades` (en pausa) |
| **Noticias** | `site/data/news.json` | lista de titulares | prensa (RSS) | GitHub Actions (`tools/traer-datos.mjs`) | noticias, la base | `oc-alojamiento` |
| **erCuñao** | no tiene datos propios: `site/build.mjs` le prepara `dist/data/cunao.json` y `cunao/<capital>.json` desde todo lo anterior | — | — | `node site/build.mjs` | — | `oc-marchas` (motor: `site/assets/cunao.js`) |

## Comprobadores (pásalos antes de subir)

- `node tools/comprobar-origen.mjs`: `portal.json` es exactamente lo que genera `build-data.js`, así que nadie lo ha tocado a mano.
- `node tools/comprobar-marchas.mjs`: fuentes, duplicados, dedicatorias y direcciones publicadas de las marchas.
- `node site/scripts/probar-cunao.mjs` (después de `node site/build.mjs`): las respuestas de erCuñao.
- `python tools/itinerarios/rutas/probar-plano.py`: los planos.
