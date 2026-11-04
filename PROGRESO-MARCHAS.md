# Progreso · marchas (sesión especializada, desde 2026-10-25)

## RETOMAR AQUÍ (2026-11-04 · bandas con dos fichas hechas; en marcha por orden de Pablo: «quitar duplicidades YA»)
Rama `marchas-campana` (worktree `.claude/worktrees/marchas-campana`), rebasada sobre origin/main `2a368d4`. **No hay nada subido de los bloques 0 y A.** Se suben juntos.

**0. Bandas con dos fichas: hecho, auditado (auditor-datos: APTO tras quitar Cruz del Humilladero) y en commit (`f1c507f`, `5744ec2`); falta el sí de Pablo.**
- 28 parejas unidas con su fuente en `tools/sources/bandas-unidas.json`. Las fuentes son el canal oficial de YouTube, la web oficial, Wikipedia, Federband o prensa. Quedan **205 bandas** (antes, 234). Correcciones con fuente: la Soledad de Mena pasa a Málaga y «San Isidro» de Churriana a «Banda de Música de Churriana».
- 8 parejas apuntadas como «distintas», también con su fuente (con las dos bandas de música de Almogía frente a sus cornetas):
  - las juveniles de Santa María Magdalena, Virgen de los Reyes, Centuria Macarena y Cruz Roja;
  - la banda de música de las Cigarreras.
- Cómo se ha hecho:
  - `tools/build-data.js` une las fichas y deja `bandas_unidas` en portal.json.
  - `site/build.mjs` pasa el repertorio a la ficha que queda y escribe la página de redirección.
  - `site/despliegue.mjs` pone los 301 en `_redirects`.
- Al unir duplicados de marchas, 5 compositores se quedaban con una sola marcha y sin página. Ahora su dirección lleva a esa marcha (`tools/sources/compositores-redirecciones.json`).
- Comprobado:
  - 0 acompañamientos perdidos y 0 enlaces rotos;
  - las 12.189 direcciones del sitemap publicado tienen archivo;
  - comprobar-marchas y comprobar-origen dan 0 errores;
  - el buscador está en verde;
  - hay 13.982 archivos.
- `comprobar-marchas` avisa de las bandas con nombre casi igual en la misma localidad.
  - Para quitar el aviso, cada pareja se apunta en `unidas` o en `distintas`, siempre con fuente.
  - **Queda 1 sin resolver**, sin fuente: Cruz del Humilladero y su «Banda Juvenil» (Málaga; la guía las da aparte). Villalba del Alcor, unida con Federband (Pablo, 4-nov).
- **Pendiente, va aparte:** algunas hermandades se enlazan a una banda solo por el nombre que da la guía, sin el pueblo, y algunas acaban en la banda equivocada.
  - Humildad y Paciencia (Cádiz): la guía dice «BM Ntro. Padre Jesús Nazareno (Rota)» y se enlaza a la de San Fernando.
  - El Nazareno (Huelva): se enlaza a la BCT N. P. Jesús Nazareno de Arahal.
  - Humildad y Paciencia: el Rosario de Arriate se enlaza a Linares.
  - Ya pasaba antes de unir nada. Arreglarlo exige que `parseBandas` use la localidad que viene entre paréntesis.

**A. Duplicados, bloque 1: hecho, auditado (auditor-datos: APTO) y en commit, falta el sí de Pablo para subir** (commits `135c4e9` y `03aa152`):
- 0 errores, las 10.098 direcciones publicadas cubiertas (con el sitemap de pages.dev), buscador en verde y 13.977 archivos.
- Antes de subir: `git fetch`, `git rebase origin/main`, `node tools/unificar-marchas.mjs` (con `auditoria/` copiada; ver abajo), `node site/build.mjs`, `comprobar-marchas` (con el sitemap publicado), `comprobar-origen` y la batería del buscador. Después, el sí de Pablo y `git push origin HEAD:main`.
- Observaciones menores del auditor, sin hacer:
  - al unir se pierde la URL de Cofradías y Hermandades 912235 en «Amor y del Trabajo»;
  - las versiones pierden la URL de su tabla de Marchas de Procesión;
  - en 6 fichas se pierde el texto de dedicatoria de la versión unida cuando la ficha que queda ya tenía hermandad, como «Pasa la Soledad» y «Callejuela de la O»;
  - la página enseña solo el vídeo principal (falta que Diseño pinte `versiones`).

**B. Canales de YouTube de las bandas (encargo de Pablo, 3-nov: «revisar el canal de YouTube de todas las bandas posibles y extraer la información de sus marchas, ninguna repetida»). Empezado, SIN commit de datos:**
- Herramienta: `tools/importar-repertorio-youtube.mjs`, con commit. yt-dlp, solo metadatos (`--flat-playlist -J`), instalado en `Herramientas-IA\bin\yt-dlp.exe`. Lista de canales oficiales, con la prueba de que son oficiales: `tools/sources/canales-bandas.json`. Por ahora están las 5 bandas de la campaña: Cigarreras, Rosario de Cádiz, Pasión de Linares, El Carmen y Paso y Esperanza.
- Regla de cruce: se liga solo si un trozo del título del vídeo (el primero, o uno entre comillas) es el título de UNA sola marcha de la base para la formación de la banda. Se descarta si coincide con el nombre de una hermandad o banda sin comillas, si el título nombra otra banda o si no es una marcha (ensayo, concierto completo, podcast…).
- Primera pasada (con `CACHE=auditoria/canales`):

  | Banda | Vídeos | Marchas ligadas | Para revisar |
  |---|---|---|---|
  | Cigarreras | 4.413 | 116 | 528 |
  | Rosario de Cádiz | 236 | 35 | 33 |
  | Pasión de Linares | 93 | 5 | 25 |
  | El Carmen | 170 | 37 | 26 |
  | Paso y Esperanza | 261 | 20 | 89 |

  Salidas, en local: `auditoria/repertorios-yt/repertorio-yt-*.json` (lo ligado) y `auditoria/youtube-*.json` (lo que queda para revisar y lo que queda fuera, con el motivo).
- **Ojo:** los `repertorio-yt-*.json` NO están en `tools/sources/` adrede, porque el unificador lee todo `repertorio-*.json`. Para cargarlos, cópialos ahí y vuelve a pasar el unificador.
- Antes de cargar, revisa lo ligado a mano. Hay que repasar sobre todo los vídeos con varias marchas en el título: en Rosario, «Amor» de Garfia sale de un vídeo de la Hdad. del Amor de Jerez con «El Amor» entre comillas, y es dudoso.
- Siguiente:
  1. revisar lo ligado y cargarlo (unificar, comprobar, auditor con 20 al azar contra el vídeo);
  2. «para revisar»: altas nuevas solo con título y compositor claros (descripción del vídeo, Cofradías y Hermandades o Patrimonio Musical);
  3. el resto de bandas de portal.json, con su canal oficial confirmado; las que no lo tengan, a `sin_canal`.

**C. Pendientes de duplicados:** los 34 probables (`node tools/comprobar-marchas.mjs --avisos | grep "misma obra que"`), «Domine Iesu Christe» (Canilla o Facundillos), «Cádiz Cofrade», «Al Cielo el Rey de Triana» y «Sentencia» (años distintos), y las 17 marchas sin compositor.

**D. Pendiente de Pablo:** año y dedicatoria de las partituras de «Jesús Lacerado» (Ecce Homo de Novelda, 2021) y «Siervos de tu Humildad» (Humildad de Málaga).

**Para regenerar en un worktree nuevo:** copia `auditoria/` (`cyh-marchas.json`, `patrimonio-marchas.json` y `marchas-806.json`) desde este worktree o desde `marchas-verificadas-188492`.

## Duplicados, bloque 1 (2026-11-03, noche)
**Hecho en este bloque (subir con el sí de Pablo):**
- Versiones (regla de Pablo, 2-nov): la misma obra en otra formación (mismo título sin artículo y mismo compositor) es ahora una ficha con `versiones` (formación, año, autor o arreglista si cambia, vídeo, bandas, fuentes y la dirección antigua, que redirige). La ficha dice «también para …». Hay 70 fichas con versiones y 75 direcciones que redirigen; las 10.098 publicadas siguen cubiertas.
- No se juntan, y van a `auditoria/marchas-informe.json` → `dudas_union`, si los dos años se conocen y no coinciden (Al Cielo el Rey de Triana, 2000/2012; Sentencia de Cebrero, 2015/2025) o si están dedicadas a hermandades distintas.
- Arreglado en `unificar-marchas.mjs` 6b: la expresión del artículo inicial había perdido la barra (`s+`). Ahora solo quita «el/la/los/las»: «¡A la Gloria!» y «¡Gloria!» son títulos distintos.
- Dos duplicados de la misma formación, unidos con revisión y fuente: «Buena Muerte» (Calvo Gaviño; Cofradías y Hermandades 901322) y «Nuestra Señora del Amor y del Trabajo» (de la Torre; Patrimonio Musical 7427).
- `comprobar-marchas`: comprueba las versiones y avisa de los **34 probables duplicados** (mismo título, compositor escrito casi igual). Se ven con `node tools/comprobar-marchas.mjs --avisos | grep "misma obra que"`.

**Siguiente (por orden):**
1. Revisar los 34 probables, uno a uno con fuente (Patrimonio Musical, Cofradías y Hermandades, web de la hermandad). Ojo: algunos son dos personas distintas (Sánchez Molero y Sánchez Martín, Gómez Rodríguez y Gámez Varo). Se unen con una revisión `corregir` (autor bueno, con su fuente) y se juntan solos.
2. «Domine Iesuchriste» y «Domine Iesu Christe» (Calvo Gaviño, 2011, mismo vídeo): la primera está dedicada a la Canilla y la segunda a los Facundillos (Granada). Hay que ver cuál es la buena.
3. «Cádiz Cofrade» (Abel Moreno, 1995, banda de música y agrupación musical): no se juntan porque las dedicatorias tienen textos distintos.
4. Las 17 marchas sin compositor.
5. Repertorios: El Carmen (bctcarmenmalaga.es/repertorio, 23 propias) y Cigarreras (lascigarreras.net/repertorio).
6. Pendiente de Pablo: año y dedicatoria de las partituras de «Jesús Lacerado» y «Siervos de tu Humildad».
7. Para Diseño: pintar en la ficha la lista `versiones` (formación, vídeo, bandas). Hoy solo sale «también para …». El filtro por formación de /marchas/ solo mira la formación principal.

## Anterior (2026-11-03, tarde · marchas de la campaña, ya publicado en `65e1b93`)
**Hecho (sin subir hasta el sí de Pablo):** las 7 marchas de la campaña que faltaban (`EQUIPO/CAMPANA-WEB.md`), cada una con la publicación de su banda como fuente y el vídeo del estreno de su canal oficial:
- Sanctae Crucis (López Gándara, 2025) y Yo soy la luz del mundo (M. A. González Cruz, 2026): fichas de lascigarreras.net (`repertorio-cigarreras.json`).
- El Rezo (M. J. Guerrero Marín, 2024, a las Penas de la Estrella): vídeo del canal de Rosario de Cádiz.
- Flagellatio (López Gándara, 2025, agrupación musical): vídeo del canal de Pasión de Linares.
- Al son de un barrio (2026): la web de El Carmen y su vídeo dicen «hermanos Aragüez» sin nombres, así que se pone eso. En la base ya hay «Alberto y Carlos Aragüez Sánchez»; para unirlos hace falta una fuente que lo diga.
- Jesús Lacerado (Óscar Navarro) y Siervos de tu Humildad (López Cortés, 2025): canal de Paso y Esperanza. Lacerado va sin año porque el vídeo da el del estreno (2023) y la partitura dice 2021. El compositor de Siervos sale de la ficha de su grabación publicada por la banda (`fKD3BqwlLyI`).
- Código: el repertorio público (`clave`) puede llevar ahora `video`, `estreno`, `lugar` y `url` por marcha, y la banda no se repite si viene de dos repertorios. La batería del buscador busca las 7.
- Para regenerar `marchas.json` en un worktree hay que copiar `auditoria/` (`cyh-marchas.json`, `patrimonio-marchas.json`, `marchas-806.json`) desde otro worktree. Sin cambios en las fuentes, la salida es idéntica.

**Siguiente:** cargar los repertorios publicados por las bandas, empezando por El Carmen (bctcarmenmalaga.es/repertorio, con 23 marchas propias con autor y dedicatoria) y Cigarreras (lascigarreras.net/repertorio). Después, juntar duplicados (`EQUIPO/ORDEN-MARCHAS-PROXIMA.md`).

## Anterior (2026-11-02, tarde)
**Hecho y subido:** las 19 horas que no tenían `hora_fuente` (reserva del auditor de diseño, 78d7a23) ya la tienen.
- Se cotejó cada una con su fuente de 2026 y no cambió ninguna hora. Málaga: malagaguia y El Español. Córdoba: Cordópolis, y para la Presentación al Pueblo el itinerario oficial. Huelva: 1minutohuelva y huelvabuenasnoticias. Almería: La Voz, cuya frase sobre La Unidad («La tarde empezará 19:30 horas») es la prueba más floja. Cádiz: el PDF de Canal Sur en copia local, salida de la cruz de guía.
- El comprobador da error si una hora de salida o de carrera no tiene fuente. auditor-datos: APTO.

**Pendiente:**
- El enlace al PDF de Canal Sur de Cádiz (`…1774544876433CADIZ_26.pdf`) da 404 y lo usan muchas fichas de Cádiz. Hay que buscar otro enlace del mismo programa o enlazar una copia.
- La Unidad (Almería): falta una segunda fuente; Movelia también da 19:30.
- Plano de Cádiz (equipo de rutas): la salida es la del paso, unos 20 minutos más tarde que la de la cruz de guía.
- `ANIO_HORARIOS` en `site/build.mjs`: subirlo al cargar los horarios de 2027.
- Repertorios de bandas (lo pide Alojamiento, 2-nov): el filtro de Marchas ya busca por la banda que toca cada marcha (`repertorio`), pero solo hay datos de Paso y Esperanza (41) y de Tres Caídas de Triana (1). Se cargan con un `tools/sources/repertorio-<banda>.json` con `clave`, `fuente` y `url` públicos, como el de Tres Caídas: la web o el repertorio publicado de cada banda, o los programas de conciertos. Sin código nuevo. Empezar por las bandas con repertorio en su web (Cigarreras, Rosario de Cádiz…), y solo marchas que la fuente nombre.
- Hay 64 pares de título y autor repetidos en `marchas.json`. Ya estaban en main; los ha visto el auditor y falta revisarlos.
- Hay dos fichas de la misma banda: `banda-de-cornetas-y-tambores-tres-caidas-de-triana-sevilla` y `…-santisimo-cristo-de-las-tres-caidas-esperanza-de-triana-sevilla`. Habría que unirlas con `bandas-redirecciones.json`.

**Hecho (2-nov, tarde):** «A esta es».
- Son dos marchas distintas. La de cornetas y tambores es de Manuel A. González y Antonio J. Castaño, del repertorio de Tres Caídas de Triana (su web: repertorio y disco «La Pasión», de 2009). Se ha dado de alta con la fuente `tct`, en `tools/sources/repertorio-tres-caidas-triana.json`. La de Huelva, de González Peña y Perejón (2010, agrupación musical, Cofradías y Hermandades), sigue aparte y sin tocar.
- «El Día del Señor»: el comentario de Pablo era sobre «A esta es». La formación de esta marcha se atribuye ahora a Patrimonio Musical («indistintamente por cornetas y tambores, agrupación musical o banda de música»); la web dice «también para…».
- Títulos de Cofradías y Hermandades: la primera palabra va en mayúscula tras «¡» (4 títulos).
- Formaciones que chocan entre bases: solo 2 marchas en las que Cofradías y Hermandades dice cornetas y tambores y la web dice agrupación musical. Son «Sentimiento Gitano» (Miraut, Gitanos de Granada; la web sigue al foro de Granada) y «Compasión» (Juan José Martín, Tres Caídas de Huelva; la web sigue a Marchas de Procesión). Las dos bases se contradicen y falta una tercera fuente, así que no se han cambiado. Ojo: el unificador no deja constancia de estos choques. Se queda con la primera formación y descarta la otra en silencio.

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
- 2026-10-27: bloque de datos B: base de datos segmentada (`node tools/db/construir.mjs`: 19 tablas con claves `hermandad` y `capital`, `fuentes` con 27.536 enlaces, `correcciones` con 380, 11 vistas de huecos) y su documentación: `datos/LEEME.md` (mapa de los datos) y `datos/COMO-CORREGIR.md`.
- 2026-10-27: bloque de datos C: las 30 bandas sin localidad, con fuente (`tools/sources/bandas-localidad.json`); sus direcciones viejas redirigen. 8 son capillas musicales (no bandas) que también acompañan pasos. La AM Santo Tomás de Villanueva que acompaña a Pasión de Córdoba es de Ciudad Real.
- 2026-10-27: bloque de datos D: correcciones de fichas con fuente (`tools/sources/fichas-correcciones.json`): 13 fundaciones sin respaldo revisadas (8 corregidas, el resto confirmadas con fuente), fechas en conflicto resueltas (Clemencia 1593, refundada en 1945; Resucitado de Jaén 1987; Borriquita de Almería 1928), sede del Medinaceli de Martiricos (Santo Tomás de Aquino), titular de La Cena de Sevilla (Cristo de la Humildad y Paciencia), fuente de la Borriquita de Sevilla, Ecce Mater Tua y Cristo de la Escucha. La ficha cita ya la fuente de cada campo corregido. Dudas resueltas por Pablo: Ecce Mater Tua sale la madrugada del Sábado Santo (01:00, OKDiario); Descendimiento de Cádiz «hacia 1664», la de su web oficial.
- 2026-10-27: «El pan de nuestra vida (Fénix)»: vídeo del estreno (canal oficial de la BCT Paso y Esperanza, qsZ5x379CbE) por la vía de la revisión; la fuente «banda» enlaza ya al vídeo (fuera el «pronto aparecerá el enlace»).
- 2026-11-02: orden de paso oficial (`tools/sources/orden-paso.json`): Sevilla con la nómina del Consejo (cambian Domingo de Ramos, Martes, Miércoles y Viernes; Lunes, Jueves y Madrugá estaban bien), 17 horas de salida corregidas, El Sol pasa al Sábado Santo; Málaga con el horario de la Agrupación (Lunes, Miércoles y Viernes). Comprobador: error si la hora de carrera no sube. Pendiente: nóminas oficiales de Córdoba, Granada, Cádiz, Huelva, Almería y Jaén (20 avisos) y las salidas del plano de Sevilla, que son del equipo de rutas (la ruta de Santa Marta del plano parece la de Santa Genoveva).
- 2026-11-02: «El Día del Señor»: cornetas y tambores con arreglos para banda de música y agrupación (lo confirma Pablo; Patrimonio Musical y Cofradías y Hermandades, anotados como discrepancia) y ligada a la Sagrada Cena de Málaga. Hay 14 marchas más de compositores de cornetas con otra formación solo según Cofradías y Hermandades: sin tocar, no hay fuente.
