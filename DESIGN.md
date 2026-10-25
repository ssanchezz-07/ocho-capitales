# DESIGN.md · Ocho Capitales («Colgaduras»)

Sistema visual del portal. La referencia es la de los reposteros que cuelgan de los balcones al paso de las cofradías: terciopelo, galón de oro y cal blanca. El tono es sobrio y devoto, con la limpieza de una app de Apple: poco ruido, jerarquía clara y movimiento solo cuando explica algo.
Código: `site/assets/site.css` (el bloque «Colgaduras», al final, manda sobre lo anterior), `site.js`, `calle.js` y `cunao.js`. El contexto de producto está en `PRODUCT.md` y las decisiones en `DECISIONS.md`.

## 1. Color
| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--bg` | `#f1f2f4` | `#14081d` | Fondo de página |
| `--surface` | `#ffffff` | `#1e1030` | Tarjetas, hojas, cabecera |
| `--surface-2` | `#e6e9ee` | `#28173e` | Grupos (lista de «Más»), campos |
| `--ink` | `#1d1030` | `#f4eff9` | Texto |
| `--muted` | `#57506a` | `#bfb4cd` | Texto secundario |
| `--line` / `--line-strong` | `#d6dbe3` / `#9199a8` | `#35254b` / `#5d4a78` | Filetes y bordes |
| `--primary` | `#2b1140` | `#dcc7f4` | Morado nazareno: titulares, enlaces, estado activo |
| `--primary-soft` | `#e8e2f1` | `#2d1d44` | Fondos de selección |
| `--gold` / `--gold-ink` | `#c9a14a` / `#7a5a16` | `#d9b560` / `#e0c27a` | Galón: detalles, horas, monogramas |

- **Color de cada capital** (`--c`, desde `portal.json` → `window.OC_COLORS`): es el terciopelo de su colgadura. Se usa en el punto del chip, en los monogramas, en las miniaturas y en los galones. Nunca va como texto sobre blanco sin pasar por `fondoLegible()`.
- Un solo acento, el oro. Nada de degradados «IA» morado-azul.
- «En la calle» tiene su propio mundo: plano de terciopelo morado, calles en lila tenue y cortejo en oro `#f0d79c` con halo.

## 2. Tipografía
- **Karantina** (`--display`): condensada y en versales, para titulares, cifras grandes, horas y monogramas. Nunca en párrafos.
- **Heebo** (`--sans`): todo lo demás. Pesos 400/500/600/700. Las cifras van con `tabular-nums` en horas y tablas.
- En los campos, 16 px como mínimo (evita el zoom de iOS).

## 3. Espacio y forma
- Ancho máximo `--wrap` 1280 px; margen lateral `--gutter` = `clamp(16px, 3.4vw, 40px)` (16 px en el móvil).
- Radios: 999 px en píldoras y chips; 14–22 px en hojas, tarjetas y formularios; círculos en miniaturas.
- Objetivos táctiles de 44 px como mínimo. Cabecera de 44 px y barra inferior de 54 px más el margen seguro.

## 4. Piezas
- **Colgadura** (`assets/plates/colgadura-<capital>.webp`, 265×971): la seña de identidad. Solo está en dos sitios: en la portada (las ocho, como banderas) y en la cabecera de cada capital (viaja con la transición de página). **No se repite en listas, tarjetas ni hojas.** Allí cada capital es un punto de su color con su nombre.
- **Portada «Del mapa a la calle»:** un lienzo de terciopelo de borde a borde con las banderas, el mapa de Andalucía (hilos de oro de cada bandera a su capital) y la invitación «Toca una bandera y baja a su calle». Debajo, la agenda.
  - Al elegir una bandera, la cámara baja al plano de su ciudad (`assets/plano.js`). El cielo del lienzo cambia con la hora.
  - Abajo quedan la jornada (flechas), la hora (deslizador), «Entrar en la calle» y «Su Semana Santa».
  - La bandera elegida asoma arriba como pestaña para volver; también se vuelve con «atrás» y con Escape.
- **Chip de capital** (cabecera): un punto de su color y su nombre. Abre la hoja «Tu capital», que tiene ocho botones con su punto de color. En la portada no aparece, porque ya están las banderas. Es el mismo estado que las banderas y los filtros de Noticias.
- **Hojas** (`.oc-sheet`): suben desde abajo, tienen asa y se cierran arrastrando (1:1, por distancia > 1/3 o por velocidad > 0,45 px/ms; si no, vuelven con resorte `cubic-bezier(.32,.72,0,1)`). También se cierran con Esc, al tocar fuera o con ✕.
- **Barra inferior**: Inicio · Hoy · Noticias · Buscar · Más, con una píldora en la pestaña activa. El calendario está en «Más» y en la cabecera.
- **Noticia** (listas): el titular primero; debajo, una línea con el medio y la hora (la capital, solo si la lista mezcla capitales) y «También en…» cuando otros medios cuentan lo mismo. La foto del medio va a la derecha; sin foto, solo texto. La primera con foto va destacada. Solo en pantallas < 960 px. Es la única vía al menú en el móvil (no hay hamburguesa).
- **Migas**: completas en ≥ 760 px; en el móvil, solo «‹ nivel anterior».
- **Jornadas de una capital**: en el móvil son un carrusel horizontal (`scroll-snap`) y la barra de días con píldora sigue a la jornada visible; en el escritorio, secciones en vertical con la barra pegada arriba.
- **Imagen de hermandad**: díptico Cristo + Virgen, foto conjunta, un titular, sede rotulada «Sede: …» o estampa (colgadura + monograma + titulares). Siempre con crédito de Commons.
- **Monograma**: inicial en Karantina dorada sobre el terciopelo de su capital, con anillo de oro. Se usa cuando no hay foto (listas, buscador, plano).
- **Buscador**: resultados con miniatura o monograma; al abrirlo, recientes (solo en este navegador) y sugerencias.
- **erCuñao**: mascota flotante abajo a la derecha. En el móvil abre una hoja y en el escritorio un panel de 420 px.

## 5. Movimiento
- Curvas: `--ease-out` `cubic-bezier(0.23, 1, 0.32, 1)` para entradas y respuestas; `cubic-bezier(.32,.72,0,1)` para hojas y carruseles. Nunca `ease-in` en la interfaz.
- Duraciones: pulsar 100–160 ms (`scale(.95–.97)`), hojas 150–320 ms y cambios de altura 260 ms.
- Transiciones entre páginas con `@view-transition`; revelado al hacer scroll con `animation-timeline: view()` (desactivado dentro de carruseles).
- **Cámara de la portada** (de Andalucía a la ciudad, 820–900 ms): es un viaje por el espacio, así que usa `ease-in-out` cúbico. El centro avanza en línea y la escala en exponencial, y se puede interrumpir.
  - Las banderas se recogen en 460 ms `--ease-out`, escalonadas cada 20 ms.
  - El hilo se dibuja en 420 ms.
  - El plano aparece con un fundido de 460 ms tras 260 ms.
  - El cielo cambia de color en 500 ms lineal, solo al cambiar la hora.
  - Con «reducir movimiento», todo pasa al instante.
- Con `prefers-reduced-motion`, todo es instantáneo. Con `prefers-reduced-transparency`, sin cristal.
- Nada se mueve en bucle (decisión: el tono es devoto).

## 6. Reglas de contenido
- No se inventan datos. Cada dato sale de una fuente oficial, de Wikipedia o de Commons, con su crédito.
- Las estimaciones (posición del cortejo, afluencia) se rotulan como estimación.
- Tono: claro y cercano. erCuñao puede ser socarrón; el resto de la web, no.
