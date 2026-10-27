# Progreso · marchas (sesión especializada, desde 2026-10-25)

Orden de Pablo: importar y verificar todas las marchas de las 8 capitales a partir de sus bases de datos, sin inventar nada. Fuentes: las de `ORDENES-CORRECCION.md` §4 (Pablo, 2026-10-25: «esas deberían bastar de momento, pero hay que verificar autores, dedicatorias, etc.»).

## Cómo se trabaja
1. `node tools/importar-base-marchas.mjs` (reanudable; `PAUSA=1500`, 1 hilo): tablas y fichas de YouTube de Marchas de Procesión. Marca `caido` los vídeos borrados.
2. `node tools/unificar-marchas.mjs`: junta todas las bases en `tools/sources/marchas.json` (necesita `auditoria/patrimonio-marchas.json`, local e ignorado; sin él reutiliza la pasada anterior). Deja el informe en `auditoria/marchas-informe.json` (local).
3. Revisión a mano con fuente abierta: `tools/sources/marchas-revision.json` (confirmar, ligar, retirar o corregir; cada entrada con URL).
4. `node tools/comprobar-marchas.mjs [sitemap.xml]`: tiene que dar 0 errores antes de subir.
5. `node site/build.mjs`, comprobar a 390 y 1440 px, subir.

## Estado (2026-10-26, bloque 4)
| Qué | Hecho | Total | Falta |
|---|---|---|---|
| Fichas de YouTube de Marchas de Procesión | 7.224 leídas (869 vídeos borrados) | 7.225 | 1 que falla |
| Registros de la BNE | 1.642 leídos (312 partituras usadas) | 1.643 | — |
| Marchas en el modelo único | 7.528 | — | — |
| Ligadas a hermandades | 1.810 en 234 hermandades | — | — |
| Contrastadas / una fuente fiable / sin verificar | 221 / 1.521 / 68 | — | las 68 ya se buscaron sin fuente |
| Revisiones a mano con fuente | 291 | — | — |
| Dedicatorias dudosas del catálogo revisadas | 257 (las 8 capitales) | 257 | — |

## Pendientes de la auditoría (M)
- **Cerrados:** M5 (títulos en varias hermandades: cada marcha tiene su compositor y sus fuentes; no hay ninguna con el mismo título y compositor en dos hermandades), M6 (duplicados del catálogo: se unen con alias), M8 («El Amor» es de agrupación musical), M10 (años: regla nueva), M13 (se queda «Patre Nostro»: ninguna fuente da «Padre Nostro»), M14 («La Soledad del Sepulcro», Moreno Ramos 1996, y «Soledad del Santo Sepulcro», Gutiérrez 2001; duplicado unido), M15 (Virgen de la Carretería: 1979, web oficial), M16 («In Cer»: en el patrimonio musical de los Gitanos según la Federación).
- «El Novio de la Muerte» (Costa y Prado): retirada la dedicatoria al Cristo de la Buena Muerte (canción de varietés de 1921). La de Bachiller Aguilar sigue «sin verificar».

## Punto exacto para seguir
- Bloque 3 subido (`a6a9aeb`). **Revisión final por subagente de 20 marchas al azar** (4 contrastadas, 10 dedicadas, 6 revisadas a mano): **20 correctas, 0 errores** (`auditoria/lotes/resultado-muestra-20.json`, local).
- Bloque 4: revisadas las dudosas de Sevilla (102) y Málaga + Granada (62). Solo se ligan las que nombran la hermandad (campo «Dedicatoria Hdad.» de Patrimonio Musical, web oficial, Federación de Granada, descripción oficial de YouTube); las que solo nombran un titular quedan sin ligar.
- Lo que queda abierto: 68 marchas «sin verificar» (foro o Wikipedia sin segunda fuente; ya buscadas) y las dedicatorias del catálogo que solo nombran una advocación compartida. Mejorarlas exige fuentes nuevas (webs de hermandades que publiquen su patrimonio musical).
- Al regenerar: `node tools/unificar-marchas.mjs` (acumula las redirecciones) y `node tools/comprobar-marchas.mjs <sitemap publicado>` con 0 errores.
- Para otra sesión (datos de hermandades, no marchas): en `portal.json`, La Cena (Sevilla) tiene como titular «Señor de la Humillación» y le falta la Virgen de la Encarnación (titular de gloria); según el revisor, el titular es el Santísimo Cristo de la Humildad y Paciencia. Comprobar con la web oficial antes de cambiarlo.

## Orden del 27-oct (`EQUIPO/ORDEN-marchas-27-oct.md`): punto exacto (en pausa: el PC iba lento)
Pasos: (1) cofradiasyhermandades.es; (2) marchas de Patrimonio Musical que faltan; (3) repertorio de la banda del Paso y Esperanza desde las partituras; (4) Crucifixión de Málaga (falta la captura de Pablo); (5) formación y capital en todas, contando antes y después.

**Hecho del paso 1 (solo estudio, sin importar nada):**
- `robots.txt`: permite todo salvo `/cgi-bin/`. No publican condiciones de uso ni aviso legal (en `info.php` solo hay contacto: info@cofradiasyhermandades.es, Palencia, +34 979 700 141). Aun así, por el derecho sui generis de las bases de datos: solo cruzar y completar nuestras marchas y las de las 8 capitales, citando cada ficha; para más, borrador de correo a Pablo (pendiente de redactar).
- `marchas.php`: formulario POST (sesión con cookie; tras el POST redirige y hay que seguir la redirección). Campos: `aplicar=1`, `comunidad` (Andalucía = 1), `provincia` (Almería 5, Cádiz 12, Córdoba 17, Granada 20, Huelva 23, Jaén 26, Málaga 33, Sevilla 43), `localidad` (sus códigos salen al elegir la provincia: **pendiente** sacar el de cada capital), `compositor`, `titulo`, `desde`, `hasta` y casillas de formación `bm`, `am`, `bct`, `bdt` (dulzainas), `cm` (capilla), `sc` (sin clasificar). Paginación: botón `pagina=N`, 30 por página. Andalucía: 11.130 marchas; total de la web, unas 16.000.
- Cada fila del listado da: formación (icono BM/AM/BCT/BDT/CM), título, compositor, localidad y año, y enlace a `fichamarcha.php?mm=<id>`. La ficha trae además «Marcha dedicada a: la imagen <titular> de <localidad>» y el nombre oficial de la hermandad: sirve para la capital y la dedicatoria.

**Escrito, sin ejecutar todavía (pausa del 27-oct):** `tools/importar-marchas-cyh.mjs` (lee el listado de las 8 capitales con 3 s entre peticiones y lo guarda en `auditoria/cyh-marchas.json`, local). Al reactivar: `node tools/importar-marchas-cyh.mjs` en segundo plano y comprobar la primera capital antes de dejarlo seguir.

**Siguiente al reactivar:** sacar el código de localidad de las 8 capitales (una petición por provincia, 3 s entre peticiones); leer el listado de cada capital (unas 30 marchas por página, ritmo lento) a `auditoria/` (local, no se sube); cruzar con `tools/sources/marchas.json` por título y compositor para completar formación y capital; abrir solo las fichas de las que casen con hermandades del portal. Después, los pasos 2 a 5.

## Punto exacto (27-oct, tras el bloque 6)
- Subido: bloque 6 (duplicados 13 → 0; `a608a3e`).
- **Bloque 7 (preparado, sin subir):** `node tools/unificar-marchas.mjs` SIN interruptores incluye: 570 marchas de Patrimonio Musical ligadas a hermandades (solo las que su ficha dedica a una hermandad del portal), el repertorio de la banda del Paso y la Esperanza (`tools/sources/repertorio-paso-esperanza.json`, 57 marchas desde las partituras; añadir el archivo al commit) y el cruce con cofradiasyhermandades.es (formación, año y capital; `auditoria/cyh-marchas.json`, local). Antes de subir: 1 verificador con 20 de las 570 nuevas al azar; comprobador 0 errores (unificar partiendo de la versión publicada: `git show origin/main:tools/sources/marchas.json > tools/sources/marchas.json` antes de unificar, para que las redirecciones solo cuenten direcciones publicadas); build; Playwright 390/1440.
- Lector de cofradiasyhermandades.es: 6 capitales leídas (Almería 224, Cádiz 379, Córdoba 461, Granada 630, Huelva 458, Jaén 414); relanzado para Málaga y Sevilla. Después: `node tools/importar-marchas-cyh.mjs --fichas` (lee las fichas que el unificador apunta en `auditoria/cyh-fichas-pendientes.json`, 3 s entre peticiones) para dedicatorias → bloque 8.
- Formación y capital: antes 282 sin formación y 4.679 sin ciudad; recontar tras el bloque 7.
- Pedido a oc-diseno (mensaje): mostrar `m.repertorio` y `m.ciudad` en las plantillas.
- Borrador de correo a cofradiasyhermandades.es: en la carpeta de notas compartidas (`correo-cofradiasyhermandades.md`).
- Crucifixión (Málaga): falta la captura de Pablo; revisar sus marchas con fuentes.

## Pendiente para después de las 02:30 (27-oct)
- Bandas casi iguales a la AM Jesús Despojado de Jaén (Almería): por orden de Pablo, las une oc-diseno (27-oct). No es tarea de esta sesión.
- Lectura de fichas de cofradiasyhermandades.es: en curso en segundo plano (`auditoria/cyh-marchas.json`, campo fichas); cuando acabe, regenerar partiendo de la versión publicada, comprobar, compilar y subir como bloque 9.

## Encargos para el bloque 9 (27-oct, vistos por oc-diseno al unir la AM N. P. Jesús Despojado, 7d6c3c4)
1. **Ocho bandas casi duplicadas** («… de <localidad>» sin localidad junto a la misma con localidad): Dulce Nombre de Jesús de Granada; M.ª Stma. de la Cabeza de Exfiliana; N.ª Sra. del Mar de Huércal de Almería; CT Monte Calvario de Martos; CT Santa Cruz de Almería; BM Los Iris de Instinción; BM Santa Cecilia de Sorbas; Capilla Sacra Redemptio de Almería. Unir **solo con fuente**, con redirección (`tools/sources/bandas-redirecciones.json`), usando `UNIR_BANDAS` de `tools/build-data.js`; después, pasar a error la regla de nombres casi iguales del comprobador. Sin decidir (solo con fuente): si la AM «Jesús Despojado» de Jaén (la de la Amargura) es la misma que «Nuestro Padre Jesús Despojado».
2. **HECHO (b60d142):** portal.json = lo que genera build-data.js; `node tools/comprobar-origen.mjs` lo comprueba (pasarlo antes de subir). Antes: **Desfase portal.json / build-data.js:** regenerar cambia hoy 15 hermandades y 19 bandas. Pasar al origen (fuentes o script) los arreglos que solo están en portal.json, hasta que regenerar dé exactamente lo publicado, y añadir una comprobación que avise si se separan.

**Siguiente (punto exacto, 27-oct):** (a) las 8 bandas casi duplicadas: buscar fuente para cada una; las confirmadas, a `UNIR_BANDAS` de build-data.js (nombre normalizado de la ficha sin localidad) y su dirección vieja a `tools/sources/bandas-redirecciones.json`; regenerar con build-data.js y `comprobar-origen.mjs`; después, pasar a error el aviso de nombres casi iguales en comprobar-marchas.mjs. (b) Dedicatorias de las fichas de cofradiasyhermandades.es: ya leídas (4.742 en `auditoria/cyh-marchas.json`); regenerar el modelo partiendo de la versión publicada (`git show origin/main:tools/sources/marchas.json > tools/sources/marchas.json` y `node tools/unificar-marchas.mjs`), revisar una muestra de 20 enlaces nuevos con un verificador, comprobar, compilar y subir.

## Bloque 9, paso 3 (dedicatorias de cofradiasyhermandades.es): hecho, 27-oct
- Regenerado partiendo de la versión publicada con las 4.742 fichas leídas. Enlaces marcha → hermandad: 2.377 → 5.323 (en 258 → 284 hermandades; contrastadas 225 → 655, dedicadas 2.092 → 4.608, sin verificar 60). Marchas: 8.078 → 10.089 (2.012 nuevas: solo las que su ficha dedica a una hermandad del portal).
- **Ningún enlace publicado se pierde** (antes del arreglo se perdían 56): las marchas nuevas de Patrimonio Musical se suman a la que crea la ficha de Cofradías y Hermandades en vez de saltarse, y un último paso repone cualquier dedicatoria publicada que el cruce dejara sin ligar. Si dos fuentes chocan, se queda la más fiable y la otra queda anotada como discrepancia (3 casos).
- Comprobador: 0 errores, 0 duplicados, las 8.078 direcciones publicadas siguen existiendo o redirigen. Verificador independiente con 20 enlaces nuevos al azar (`auditoria/lotes/muestra-cyh-dedicatorias.json`): 20 correctas.
- Formación: sin formación 113 → 169 (56 de las 2.012 nuevas no la traen en ninguna fuente). Sin capital ni lugar: 4.208 → 4.205.

## Historial
- 2026-10-25: modelo único, comprobador, buscador con marchas aparte. Importación de YouTube relanzada en segundo plano.
- 2026-10-26: bloque 2: 142 revisiones a mano con fuente (sin verificar 181 → 69), compositor más estricto, duplicados unidos, BNE como fuente (250 fichas), M5-M16 cerrados.
- 2026-10-26: bloque 3: importaciones de YouTube y BNE terminadas (solo partituras de la BNE), 93 dedicatorias dudosas revisadas (+50 ligadas con fuente en Jaén, Cádiz, Huelva, Córdoba y Almería), correcciones de la sesión de Málaga, redirecciones permanentes de direcciones retiradas.
- 2026-10-26: bloque 4: dudosas de Sevilla, Málaga y Granada revisadas (+97 ligadas que nombran la hermandad, p. ej. 13 de la Soledad de Mena y 5 de la Esperanza Coronada); revisión final de 20 al azar: 20 correctas.
- 2026-10-27: bloque 6, duplicados: 13 marchas repetidas en lo publicado (mismo título y compositor escrito de dos formas) → 0, y el filtro de /marchas/ que repetía resultados al escribir deprisa. Comprobador con control de duplicados. Pendiente de subir (bloques siguientes): 570 marchas de Patrimonio Musical ligadas a hermandades, repertorio de la banda del Paso y la Esperanza (57 marchas, `tools/sources/repertorio-paso-esperanza.json`), cruce con cofradiasyhermandades.es.
- 2026-10-27: bloque 7: 555 marchas de Patrimonio Musical dedicadas a hermandades del portal (revisión de 20 al azar: 20 correctas), repertorio de la banda del Paso y la Esperanza (57, desde sus partituras), cruce con cofradiasyhermandades.es en 6 capitales (formación, año y capital; 927 marchas con su ficha). Sin formación, de las que ya estaban: 282 → 263. Sin capital ni lugar: 4.679 → 4.108. Faltan Málaga y Sevilla de cofradiasyhermandades.es y la lectura de fichas.
- 2026-10-27: bloque 8: cofradiasyhermandades.es en las 8 capitales (6.517 marchas leídas; 3.715 nuestras con su ficha); sin formación 282 → 113 (contando las 555 nuevas de Patrimonio Musical, 651 → 113); sin capital ni lugar 4.679 → 3.387; partituras fuera de la web (17 marchas que solo tenían esa fuente). Siguiente: `node tools/importar-marchas-cyh.mjs --fichas` (4.792 fichas pendientes, ~4 h a 3 s) para dedicatorias; Crucifixión (falta la captura).
- 2026-10-27: portal.json y build-data.js vuelven a coincidir (un solo origen); comprobador de origen.
- 2026-10-27: bloque 9, paso 2: 8 bandas casi duplicadas unidas con redirección; comprobador con error para nombres casi iguales (182aed8).
- 2026-10-27: bloque 9, paso 3: dedicatorias de las fichas de cofradiasyhermandades.es (enlaces 2.377 → 5.323, marchas 8.078 → 10.089), sin perder ningún enlace publicado; muestra de 20: 20 correctas.
- 2026-10-27: «El pan de nuestra vida (Fénix)» (A. López Cortés, 2026, a Jesús de la Pasión de Málaga) publicada con la banda como fuente y el aviso «pronto aparecerá el enlace». Cuando haya vídeo o noticia, poner su enlace y quitar `publicar`.
- 2026-10-27: bloque de datos A: 15 biografías de imagineros con fuente (León Ortega de Ayamonte, Huelva; Álvarez Duarte 1950–2019; Palma Burgos 1918–1985), fuera 5 entradas que no eran personas y la banda falsa «Sin acompañamiento musical» (con redirección), Pasión de Sevilla «1.535» → 1535. erCuñao: 2 pruebas rotas arregladas («¿pasan por Larios?» vuelve a responder con las calles sin hora) y las 7 preguntas C1-C7 de la auditoría bien respondidas, con prueba propia (61/61).

## Punto exacto (27-oct, pausa de Pablo: «Déjame uso para el trabajo ahora por si es necesario»)
- **Bloque de datos A: commit hecho y rebasado sobre origin/main, SIN SUBIR** (la subida se paró). Al reactivar: `node tools/comprobar-origen.mjs`, `node tools/comprobar-marchas.mjs`, `node site/build.mjs`, `node site/scripts/probar-cunao.mjs` (61/61) y `git push origin HEAD:main`; avisar a Pablo.
- **Pendiente del encargo** (orden en `EQUIPO/ORDEN-oc-datos-imagenes.md`): bandas: las 30 sin localidad (con fuente); fichas: Ecce Mater Tua y Cristo de la Escucha sin `fuente_url`, Borriquita de Sevilla con la fuente del Amor, titular de La Cena de Sevilla, 13 fundaciones sin respaldo, fechas en conflicto (Resucitado y Clemencia de Jaén, Borriquita de Almería, sede del Medinaceli de Martiricos); `datos/LEEME.md`, `datos/ocho-capitales.sqlite` (`tools/db/construir.mjs`) y `datos/COMO-CORREGIR.md`.
- El investigador de bandas y fichas se paró a medias: relanzarlo (listas en el scratchpad de la sesión: `bandas-sin-localidad.json`, `fichas-a-revisar.json`; si se perdieron, regenerarlas desde portal.json).
