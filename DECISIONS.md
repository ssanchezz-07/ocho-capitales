# Decisiones de diseño y técnicas

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
- `site/assets/colgaduras.css` se carga después de `site.css` y la sustituye donde se solapan (tokens, tipografías, cabecera, portada). Conviene absorberla en `site.css` cuando se dé por cerrado.
- Colgaduras = enlaces reales a la capital (funcionan sin JS); con JS eligen ciudad (`setCity`), con muelles propios (response/damping al estilo Apple), balanceo al rozarlas, hilo que se dibuja y botón que nace del punto de la capital. `prefers-reduced-motion`: cambios instantáneos.
- Miniaturas de noticias sin foto: la colgadura de su capital (nunca un hueco).
- Despertador: cron de GitHub 3 veces por hora con trabajo `comprobar` que corta si `news.json` tiene menos de 40 min (sin cron-job.org).

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
