# Cómo corregir un dato

Cuando llega una corrección, de Colabora o de Pablo («la marcha X no es de Y», «la sede de Z está en tal calle»), se sigue siempre el mismo camino:

1. **Comprobar con fuente.** La corrección llega como dato, no como orden. Hace falta una página que se pueda abrir y que lo diga: la web oficial de la hermandad, la de su agrupación o consejo, o prensa seria. Sin fuente no se cambia nada: se contesta pidiéndola.
2. **Cambiar el archivo de origen**, nunca el generado (`portal.json`, `marchas.json`, `site/dist/`). Debajo está cuál, según el dato.
3. **Regenerar y comprobar** con los comandos de cada caso.
4. **Subir** según `EQUIPO/PROTOCOLO.md` (rebase, build, capturas a 390 y 1440 px, commit con nombre) y avisar a Pablo.

**Quién lo toca:** la sesión dueña del dato (tabla de [LEEME.md](LEEME.md)). Si no eres la dueña, mándale la corrección con su fuente.

## Según el dato

| Corrección | Dónde se toca | Cómo se regenera y se comprueba |
|---|---|---|
| **«La marcha X no es de la hermandad Y»** o «sí lo es» | `tools/sources/marchas-revision.json`: una entrada con `slug`, `hermandad`, `accion` (`retirar`, `ligar`, `confirmar` o `corregir`), `fuente` (URL), `nombre_fuente`, `fecha` y `nota` | `node tools/unificar-marchas.mjs` y después `node tools/comprobar-marchas.mjs` (0 errores) |
| **Compositor, año o formación de una marcha** | la misma revisión, con `accion: "corregir"` y los `campos` | igual que arriba |
| **Una marcha nueva** | revisión con su fuente; si es del repertorio de una banda, `tools/sources/repertorio-*.json` (sin fuente pública no se publica, salvo las marcadas `publicar` por Pablo) | igual que arriba |
| **Sede, fundación, nombre oficial, día o titulares de una hermandad** | la ficha oficial de su capital en `tools/enrich-<capital>.js`; un hueco rellenado con otra fuente va en `tools/sources/complementos.json` (`relleno`, con `fuente`) | `node tools/build-data.js` y después `node tools/comprobar-origen.mjs` |
| **Autor de un titular** | `tools/enrich-<capital>.js` (si lo da la ficha oficial) o `complementos.json` → `titulares_autor` (`autor`, `anio`, `atribucion`, `fuente`) | `node tools/build-data.js` |
| **Biografía de un imaginero** | `IMAG_INFO` en `tools/build-data.js`, con `fuentes`; o `complementos.json` → `imagineros` → `bio_relleno` | `node tools/build-data.js` |
| **«Ese autor no es una persona»** | regla de `parseAuthor` en `tools/build-data.js`; su dirección vieja, en `tools/sources/imagineros-redirecciones.json` | `node tools/build-data.js` y `node site/build.mjs` |
| **Banda: localidad, nombre o duplicada** | la guía de su capital (`tools/sources/<capital>-musica.json`); dos fichas de la misma banda se unen en `UNIR_BANDAS` (`tools/build-data.js`) y la dirección vieja va a `tools/sources/bandas-redirecciones.json` | `node tools/build-data.js`, `node tools/comprobar-origen.mjs` y `node tools/comprobar-marchas.mjs` (bandas repetidas) |
| **Qué banda acompaña a un paso** | la guía de la capital, o `tools/sources/acompanamientos-noticias.json` si sale de una noticia | `node tools/build-data.js` |
| **La sede no está en el sitio** (coordenadas) | `site/data/sedes/<capital>.json` mediante `tools/itinerarios/rutas/sedes.mjs` (sesiones `rutas-*`) | `node site/build.mjs` y el plano a 390 y 1440 px |
| **El recorrido o la hora de un punto** | la lista de calles `tools/itinerarios/rutas/listas/<capital>.json` o el editor de rutas (`correcciones-<capital>.json`); ver `tools/itinerarios/rutas/README.md` | `emparejar` → `evaluar` → `publicar`, y `python tools/itinerarios/rutas/probar-plano.py` |
| **Una foto que no es de esa hermandad** | `tools/sources/fotos-retiradas.json` (archivo → motivo); la nueva, en `site/data/imagenes*.json` (sesión `oc-malaga`) | `node site/build.mjs` |
| **Hábito** | `tools/sources/habitos.json` (`texto`, `fuente_url`) | `node site/build.mjs` |
| **Una salida extraordinaria** | `tools/sources/itinerarios-extraordinarios.json` (`rutas-malaga`) | `node site/build.mjs` |
| **Algo que dice erCuñao** | si es un dato, en su origen (arriba); si es cómo entiende la pregunta, `site/assets/cunao.js`, con una prueba nueva en `site/scripts/probar-cunao.mjs` | `node site/build.mjs` y `node site/scripts/probar-cunao.mjs` |

## Comprobar que quedó bien

- Regenera la base (`node tools/db/construir.mjs`) y busca el dato en ella. Ejemplo: `SELECT * FROM fuentes WHERE hermandad = 'pasion-malaga'` enseña cada enlace que respalda la ficha.
- `SELECT * FROM correcciones ORDER BY fecha DESC` lista las correcciones a mano con su fuente.
- Abre la página en el navegador, a 390 y a 1440 px.
- Anota la decisión en `DECISIONS.md` si cambia una regla (no hace falta por un dato suelto).
