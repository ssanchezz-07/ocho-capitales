# Estudio de competencia y diferenciación (octubre 2026)

## ⚠️ Antes de nada: el nombre «InfoCofrade»
Ya existe **Info Cofrade** (infocofrade.com, @info_cofrade en X con el símbolo ™): portal de la Semana Santa **de Sevilla** («Semana Santa 365 días al año»), con actualidad, agenda, hermandades, repertorios musicales, glorias, Rocío, cuenta atrás, vídeos 4K en YouTube y donaciones por Ko-fi.
- Riesgo: confusión de marca y posible conflicto legal si tienen la marca registrada (comprobar en la OEPM: https://www.oepm.es → Localizador de marcas).
- El nombre está en una sola constante (`BRAND` en `site/build.mjs` y textos del plugin), así que cambiarlo cuesta minutos.
- Alternativas libres a comprobar: **Atlas Cofrade**, **Andalucía Pasión**, **Cofradepedia**, **Nazarenia**, **Mapa Cofrade**, **Ocho Capitales**.

## Quién hay en el mercado
| Tipo | Ejemplos | Qué hacen bien | Qué no tienen |
|---|---|---|---|
| Prensa cofrade | ABC Pasión en Sevilla, Diario de Sevilla, Gente de Paz, El Diario Cofrade, Info Cofrade (Sevilla) | Actualidad diaria, vídeo, opinión | Una ciudad cada uno; datos históricos dispersos y sin fuente; sin buscador transversal |
| Arte sacro | La Hornacina, ArteSacro | Imaginería y patrimonio | Sin noticias agregadas ni música; navegación antigua |
| Apps de calle | El Penitente (Sevilla y Málaga), Cruz de Guía (Sevilla), App Sevilla (Ayuntamiento), GeoPasos (Granada, Córdoba), apps de Córdoba, Jerez, Almería… | GPS de la cruz de guía en tiempo real, horarios, avisos por retraso o lluvia, densidad de público (App Sevilla) | Solo útiles en Semana Santa; una o dos ciudades; poca historia; casi todas exigen instalar una app |
| Foros y oficiales | El Foro Cofrade, webs de consejos y agrupaciones | Información oficial | Cada uno con su formato; no se cruzan entre sí |

## Lo que ellos tienen y nosotros todavía no
1. **Horarios e itinerarios oficiales del año** (en cuanto se publiquen los de 2027).
2. **Seguimiento en tiempo real** de la cruz de guía (GPS). *No conviene construirlo*: ya lo dan los ayuntamientos y GeoPasos. Lo inteligente es **enlazar al rastreador oficial de cada ciudad** desde cada ficha y cada día.
3. **Avisos** (retrasos, suspensión por lluvia).
4. **Vídeo y galerías.**
5. **Agenda de cultos** (besamanos, triduos, traslados) durante todo el año.

## Lo que ya tenemos y ellos no (ventaja actual)
- **Las ocho capitales en un solo sitio**, con el mismo formato.
- **Datos verificados con su fuente oficial** en cada ficha (consejos, agrupaciones y federaciones) y correcciones documentadas. Nadie más enseña de dónde sale cada dato.
- **Grafo cofrade**: imaginero ↔ imágenes ↔ hermandades ↔ ciudades; bandas ↔ hermandades; marchas ↔ compositores. Por ejemplo, «Juan de Mesa» devuelve sus obras en Sevilla y Córdoba en una búsqueda.
- **Agregador de 60 fuentes**, incluidas 23 webs oficiales de hermandades, con filtro anti-ruido (deporte, prisiones…).
- **Buscador instantáneo sin acentos** (tecla /), favoritos sin registro, modo oscuro, cuenta atrás y web rápida sin app que instalar.
- **Coste cero y sin caídas** en Semana Santa (sitio estático en CDN).

## Ideas para diferenciarse claramente (priorizadas)
### Fase 1 — rápidas y de alto impacto (antes de Cuaresma 2027)
1. **«Mi Semana Santa»**: eliges hermandades y genera tu agenda por días con horas oficiales; **descarga al calendario del móvil (.ics)** y recordatorio 1 h antes. Sin registro.
2. **Canal de Telegram/WhatsApp automático** con las noticias del día y avisos (gratis, publicado por el mismo proceso automático). Es el canal donde vive el público cofrade.
3. **Enlace al GPS oficial** de cada ciudad (App Sevilla, GeoPasos, Agrupaciones) en cada ficha y día.
4. **¿Sale o no sale?**: previsión de lluvia de AEMET por capital y día en la portada de Semana Santa y en cada ficha.
5. **Escuchar la marcha**: en cada marcha dedicada, botón a YouTube/Spotify.
6. **Glosario cofrade** (levantá, chicotá, costero a costero, mecida, varal, palio…) enlazado automáticamente en los textos. Muy útil para turistas y nuevos.

### Fase 2 — diferenciales fuertes
7. **«Cerca de mí»**: hermandades y sedes ordenadas por distancia (geocodificando las sedes) y «qué pasa ahora cerca».
8. **Mejores sitios para verla**: puntos recomendados por hermandad (salida, recogida, momentos) con mapa.
9. **Agenda de cultos de todo el año** (besamanos, triduos, salidas extraordinarias), leída de las webs oficiales que ya agregamos.
10. **Versión en inglés** para turistas (portada, capitales, glosario y fichas principales).
11. **Efemérides «tal día como hoy»** y **test cofrade** para enganchar fuera de temporada.
12. **Datos abiertos (API JSON)** para periodistas y desarrolladores: nadie lo ofrece.

### Fase 3 — comunidad y sostenibilidad
13. **Correcciones colaborativas**: botón «sugerir corrección» en cada ficha → revisión manual.
14. **Boletín semanal** por correo (gratuito hasta varios miles de suscriptores en Buttondown/MailerLite).
15. **Patrocinio local o donaciones** (Ko-fi) con transparencia de costes (que son cero).

## Principios de diseño frente a la competencia
- **Responder en 1 toque** a las tres preguntas del público: *¿qué sale hoy?, ¿dónde la veo?, ¿qué historia tiene?*
- **Móvil primero**, sin anuncios intrusivos ni ventanas emergentes.
- **Fuente visible** en cada dato y en cada noticia.
- **Accesible** (contraste, teclado, lectura fácil) y **rápido** incluso con mala cobertura en la bulla.
