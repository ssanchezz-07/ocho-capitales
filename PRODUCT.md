# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Cofrades y aficionados a la Semana Santa andaluza **desde los 13 años en adelante** (jóvenes de banda y costal hasta mayores de 70). Dos escenas de uso:
- **En la calle, en plena Semana Santa, desde el móvil**: una mano, sol o noche, prisa, cobertura irregular. Trabajo: saber qué sale hoy, dónde y en qué orden, y abrir la ficha de una hermandad en segundos.
- **En casa, desde el ordenador o la tablet, el resto del año**: leer las noticias de su ciudad, repasar la historia de su hermandad, banda o imaginero.

## Product Purpose
Ocho Capitales reúne en un solo portal la actualidad y la memoria de la Semana Santa de las ocho capitales andaluzas (Sevilla, Málaga, Granada, Córdoba, Cádiz, Huelva, Almería y Jaén). Éxito: que cualquiera encuentre en segundos qué sale hoy, las noticias de su ciudad y la ficha de su hermandad, banda o imaginero, y que el portal se perciba serio, como un medio profesional.

## Positioning
Cubre las ocho capitales a la vez, cruza hermandad ↔ banda ↔ imaginero, y agrega noticias de ~60 fuentes cada 2 horas, siempre enlazando al medio original. Los datos de hermandades se contrastan con consejos, agrupaciones y federaciones oficiales (Sevilla: Wikipedia CC BY-SA).

## Operating Context
- Sitio estático generado (`site/build.mjs`) desde `portal-cofrade/data/portal.json` y `site/data/news.json`; publicado en GitHub Pages bajo `/ocho-capitales/`; noticias renovadas cada 2 h por GitHub Actions.
- Los días cofrades (Viernes de Dolores → Domingo de Resurrección) se calculan a partir de la fecha de Pascua; fuera de temporada la portada mira al próximo Domingo de Ramos.
- Los horarios oficiales cambian cada año: el portal muestra el orden de paso documentado y remite a lo oficial.

## Capabilities and Constraints
- 293 hermandades, 70 bandas, 149 imagineros, 8 capitales; buscador instantáneo local; favoritos en el dispositivo; modo oscuro.
- HTML + CSS + JS propio, sin frameworks ni librerías pesadas. Objetivo Lighthouse móvil ≥ 90 rendimiento, ≥ 95 accesibilidad/buenas prácticas/SEO.
- No se inventan datos de hermandades, bandas ni imagineros. No se copian noticias completas: titular, extracto breve y enlace.
- 122 hermandades no tienen imagen; las imágenes existentes son de Wikimedia Commons con crédito obligatorio.

## Brand Commitments
- Nombre: **Ocho Capitales** (antes «InfoCofrade», descartado por coincidir con infocofrade.com).
- Tono sobrio, devoto y elegante; nada de emojis decorativos ni degradados chillones.
- Paleta pedida: morado nazareno, negro, crema/marfil y dorado como acento, con contraste WCAG AA.

## Evidence on Hand
- `portal-cofrade/data/portal.json` (datos verificados), `site/data/news.json` (751 noticias, 163 con imagen).
- Sin testimonios, cifras de audiencia ni prensa: no fabricarlos.

## Product Principles
1. Lo de hoy primero: qué sale, dónde y en qué orden, sin hacer scroll.
2. Cada dato con su fuente; la noticia siempre lleva al medio original.
3. Rápido en la calle: ligero, legible al sol, cómodo con el pulgar.
4. Las ocho capitales con el mismo respeto; ninguna es secundaria.

## Accessibility & Inclusion
WCAG 2.2 AA. Público de 13 a 70+ años: cuerpo ≥ 16 px, interlineado amplio, objetivos táctiles ≥ 44 px, foco visible, navegación con teclado, `prefers-reduced-motion` y `prefers-color-scheme` respetados.
