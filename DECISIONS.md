# Decisiones de diseño y técnicas

## 2026-10-23 · Marchas: no afirmar lo que no está verificado (auditoría integral, tanda A)
**Elegido**
- Una marcha del catálogo solo se une a una marcha de hermandad si el título coincide y los compositores comparten un **apellido** (se ignoran nombres de pila y partículas). Así se pierden ~16 uniones dudosas a cambio de no pegar el vídeo y el año de otra obra.
- Un artículo de Wikipedia emparejado con varias hermandades solo da marchas a la que tiene todas sus palabras propias en el título del artículo.
- Marchas de la lista del foro de Patrimonio Musical (2008): se muestran como «Asociada a… (sin verificar)» y «Marchas asociadas», con su fuente. Wikipedia y las fichas oficiales siguen como «Dedicada a», con nota de origen.

**Descartado**
- Ocultar las 322 marchas del foro: la segunda opinión confirmó 5 de 6 en otras fuentes; ocultarlas quitaría información casi siempre correcta. Pendiente de que Pablo lo decida (está en «A decidir» de `AUDITORIA-INTEGRAL.md`).
- Unir por nombre completo exacto: perdía variantes legítimas del mismo compositor (tildes, iniciales).

## 2026-10-13 · Rediseño «Colgaduras» (en curso, sin publicar)

**Elegido:** mundo visual «Colgaduras» (reposteros de balcón al paso de las cofradías): morado nazareno, oro de galón, cal blanca de fachada y el color de cada capital como terciopelo. Titulares en Karantina (condensada, versales), texto en Heebo. Composición C de la maqueta: titular + cuenta atrás, ocho colgaduras con su emblema sobre el mapa, hilos dorados a cada capital, noticias con miniatura.
- Emblemas (a petición de Pablo, tomados de `portal.json`): Sevilla palio, Málaga campana, Granada Alhambra, Córdoba arcos de la Mezquita, Cádiz horquilla, Huelva cinta, Almería Alcazaba, Jaén cruz del Nazareno.
- Maquetas y recursos: Canva (`generate-image`, diseño de trabajo DAHXzhKqeGQ). Originales PNG en `assets/plates/` (local, fuera de git); en la web, WebP en `site/assets/plates/`.

**Descartado**
- Cartel anunciador (la favorita de impeccable): muy reconocible pero poco propia y depende de fotos con derechos.
- Colgaduras ordenadas de oeste a este (hilos sin cruces): se usó el orden del portal como la maqueta aprobada; los hilos van en ángulo recto con carriles calculados para minimizar cruces.
- Textura de papel como fondo y acuarela sobre el mapa: dejaban ver las juntas del azulejado; la acuarela además era el LCP (la inyecta JS).
- Marcado SVG incrustado para mapa e hilos: el comprobador de impeccable lo trata como ilustración. Ahora se dibuja con JS desde datos JSON (`#oc-mapa`).

**Técnicas**
- `colgaduras.css` se cargaba después de `site.css` y la sustituía donde se solapaban. El 2026-10-16 se absorbió al final de `site.css` (mismo orden de cascada, una petición menos).
- Colgaduras = enlaces reales a la capital (funcionan sin JS); con JS eligen ciudad (`setCity`), con muelles propios (response/damping al estilo Apple), balanceo al rozarlas, hilo que se dibuja y botón que nace del punto de la capital. `prefers-reduced-motion`: cambios instantáneos.
- Miniaturas de noticias sin foto: la colgadura de su capital (nunca un hueco).
- Despertador: cron de GitHub 3 veces por hora con trabajo `comprobar` que corta si `news.json` tiene menos de 40 min (sin cron-job.org).

## 2026-10-17 · El plano sigue siendo propio (SVG), no Leaflet

**Elegido:** mantener y mejorar el plano propio (`calle.js` + `plano.mjs`). Pablo lo decidió expresamente. Se le añadió lo que más le faltaba: rótulos de calles e iglesias (etiquetas por tramo con su ángulo, tamaño fijo en pantalla, descarte de solapes y esquivando los medallones, con rangos según el zoom), recorridos por las calles (`enrutar.mjs`) y solo brilla el recorrido de las cofradías que están en la calle a esa hora.

**Descartado**
- Leaflet con teselas de OpenStreetMap/CARTO (propuesto por Antigravity, que reescribió `calle.js`): depende de servidores de terceros con sus condiciones de uso, no funciona sin conexión y pierde el aspecto cofrade. Copia del intento guardada fuera del repositorio (scratchpad de la sesión).
- Dos heurísticas del mismo intento que rompen la regla de no inventar datos: adivinar si una foto es del Cristo o de la Virgen por palabras de su descripción, y asignar marchas a hermandades por coincidencia de palabras en la dedicatoria.

**Técnicas**
- Las etiquetas salen de los nombres de OpenStreetMap (`etiquetas` en `site/data/planos/<ciudad>.json`): rango 1 = calles del recorrido y arterias; 2 = terciarias cercanas; 3 = el resto cercano. Una etiqueta por nombre cada 300 m como mínimo.
- El plano de Sevilla pasa de ~270 a ~370 KB; en Cloudflare viaja comprimido.

## 2026-10-15 (noche) · Imágenes, «En la calle», ruta, base de datos y erCuñao

**Elegido**
- **Imagen de cada hermandad:** foto de Commons revisada a ojo. Se prefiere el Cristo y la Virgen en díptico (o una foto con los dos); si no hay, un solo titular; si no, la sede, rotulada «Sede: …» para no hacerla pasar por la imagen. Si tampoco hay sede, una estampa propia (colgadura, monograma y titulares) que invita a compartir una foto. Así se cumple que «todas las hermandades deben tener imagen» sin inventar.
- **Alojamiento:** Cloudflare Pages gratis, sin dominio por ahora (decisión de Pablo). GitHub Pages sigue publicando en paralelo hasta que Pablo lo apague. **WordPress descartado:** el sitio es estático y generado; WordPress añadiría servidor, base de datos y mantenimiento sin aportar nada que hoy falte.
- **erCuñao:** sin IA, gratis (decisión de Pablo). Reconoce intenciones (día, ciudad, hermandad, horario, sugerencia) sobre un JSON reducido. Sugerencias a Cloudflare D1, con límite de 10 al día por IP cifrada; si no hay servidor, abre una incidencia de GitHub ya rellenada. El debate semanal es una incidencia automática cada lunes.
- **Plano:** dibujado por nosotros desde OpenStreetMap (calles simplificadas en SVG, terciopelo morado y oro), sin mosaicos de terceros: es gratis, funciona sin conexión y tiene estética cofrade. Las rutas a pie se delegan a Google Maps o Apple Maps con un enlace.
- **Posición del cortejo:** estimada interpolando entre los puntos con hora del itinerario oficial, y rotulada como estimación. Los puntos sin coordenadas fiables se descartan (a más de 900 m de sus vecinos o a más de 2,5 km de la mediana) o se interpolan marcados «estimado».
- **Ruta de penitencia:** algoritmo voraz. Elige la parada que da más cofradías nuevas por minuto invertido (espera + camino), a 70 m/min y con un máximo de 30 min andando. «Evitar la bulla» penaliza las zonas con muchas cofradías y la carrera oficial. La afluencia es una estimación declarada, no un dato.
- **Base de datos:** SQLite con `node:sqlite` (sin dependencias), regenerada desde `portal.json` en cada publicación, con tabla de procedencia y `auditoria.json`.

**Descartado**
- Mapas con mosaicos (Leaflet + OSM tiles, Mapbox, Google): dependen de terceros, tienen límites de uso y no tienen la estética.
- erCuñao con IA (Workers AI u otra API): Pablo lo quiso solo gratis y sin IA.
- Fotos de Instagram o de webs de hermandades: tienen derechos. Solo Commons con licencia libre y crédito.
- Subir al repositorio los PDF de itinerarios y los textos completos de las fichas: el repo es público y son de terceros. Están en `.gitignore`.

## 2026-10-15 · Movimiento e interiores

**Elegido**
- Transiciones de página nativas del navegador (`@view-transition`), sin librerías. La colgadura comparte nombre de transición entre la portada y su capital, así que viaja de una a otra. Si el navegador no las admite (o con «reducir movimiento»), la navegación es normal.
- Revelado al hacer scroll con `animation-timeline: view()` (CSS puro), en lugar de IntersectionObserver con JS: no cuesta en el hilo principal y, sin soporte, el contenido se ve directamente.
- Capital: foto a sangre con velo nazareno y la colgadura de esa capital colgando. Se descartó mantener la caja morada «Atlas», que era el mismo patrón para todas las capitales.
- Hermandades sin foto: un monograma bordado (inicial en oro sobre el terciopelo de su capital). Se descartó repetir la colgadura de la capital en cada fila, porque en una lista de 70 hermandades sería la misma imagen 70 veces.
- Noticias sin foto: la colgadura de su capital (como en la portada), también cuando la foto del medio falla al cargar.

**Descartado**
- Sello de ocho puntas girando lentamente en las cabeceras de banda: un movimiento constante choca con el tono sobrio y devoto.
- Píldora de jornadas escalada con `scaleX` (más barata): deformaba los extremos redondeados; se anima `transform` + `width` de un solo elemento.

**Comprobador de fidelidad de impeccable (no superado)**
- Primer pantallazo a 1080×1920 (432×768 CSS a 2,5×): 75 % global (hace falta 72 %) pero con vetos en 14 regiones: las partes dinámicas (fotos y titulares reales de noticias frente a los inventados de la maqueta) y las letras de las colgaduras. No es alcanzable sin falsear contenido. Solo se puede saltar con palabras de Pablo (`--force --reason`). Pendiente de decidir con él.
- Cambiar `regions.json` invalida la aceptación de la revisión de recursos: si se vuelve a usar el flujo, hay que repetir `component-review` y que Pablo acepte.

**Salidas extraordinarias y magnas en «En la calle» (2026-10-22)**
- Elegido: misma tubería y formato que los recorridos de Semana Santa. Fuente `tools/sources/itinerarios-extraordinarios.json` (puntos `{lugar, hora}` literales del cartel, tramos `ida`/`regreso`, `acto` entre ambos) → `geocodificar.mjs` las escribe en `recorridos/<ciudad>.json` bajo `extraordinarias` → `enrutar.mjs` → `build.mjs` las añade como una «jornada» más con fecha (pestaña propia tras las de Semana Santa).
- Descartado: un mapa o página aparte (duplicaba plano, reloj, ficha y ruta) y una lista paralela de eventos con coordenadas (el brief pedía no crear otro modelo).
- Regreso con guiones largos (11 7); los tramos «aprox.» siguen siendo de puntos (2 7), para no confundirlos.
- Horas: solo las del cartel son oficiales; el resto se reparte por distancia andada y se muestra con «≈».
- «Pasada»: se decide en el navegador por la fecha (no al compilar), para que no dependa de cuándo corra el bot. La próxima se destaca y se abre por defecto si hoy no hay jornada; las celebradas se apagan.
- Pista `templo` en los puntos: la salida no siempre es la sede de la hermandad (p. ej. llegada a San Juan).
