# Diagnóstico: secciones que tardan y toques que no responden (2026-11-02)

Encargo de Pablo: «la web hay que optimizarla, muchas veces le cuesta que cargue apartados o hay que darle varias veces».

**Cómo se midió:** web publicada en `ocho-capitales.pages.dev` (main en `05fd3e4`), a 390 × 844 px, con la CPU 4 veces más lenta y un 4G lento (150 ms de latencia, 1,6 Mb/s). Chromium con Playwright, CDP Profiler y Event Timing.
**Límite:** es un móvil simulado en un ordenador, no un teléfono real, y se probaron 8 páginas, una de cada tipo.

## Causas, de más a menos visible

### 1. Portada: el primer toque nunca llega al enlace
En cada pestaña nueva, durante los primeros segundos, cualquier toque en la portada se pierde. Se comprobó con `elementFromPoint` sobre la barra de abajo:

| Momento | Qué hay encima del enlace «Hoy» | Resultado |
|---|---|---|
| 0,8 s | la capa de entrada (`html.oc-entrando::after`) | no navega |
| 2 s y 4 s | el globo (`div.oc-globo`, fijo, z-index 200) | no navega |
| 1.er toque | el globo se cierra (`pointerdown` → `acabar`) | no navega |
| 2.º toque | — | navega a /hoy/ |

- **Origen:** `05fd3e4` quitó `pointer-events:none` de la capa del HTML; a propósito, para que un toque no atraviese a la web de debajo. El globo ocupa toda la pantalla, también la barra de pestañas y la cabecera, y se come el toque que lo cierra.
- **Cuánto dura:** la animación del globo dura unos 6,4 s. Con la CPU lenta, más.
- **Por qué pasa tan a menudo:** la marca es de `sessionStorage`. En un móvil, cada vez que se abre la web desde un enlace o desde el icono de inicio es una sesión nueva, así que el globo sale casi siempre.
- **Área:** Portada (`site/assets/globo.js`, `HEAD_ENTRADA` en `site/build.mjs`).
- **Arreglos posibles (decide Portada):**
  1. Que el toque que cierra el globo también abra lo que había debajo. Dentro de `acabar`, se busca con `elementFromPoint` el elemento de debajo y se le hace `click()`.
  2. Dejar la barra de pestañas y la cabecera por encima del globo.
  3. Guardar «ya visto» en `localStorage` con caducidad de un día, para que no salga en cada apertura.

  La 1 y la 2 resuelven el «hay que darle varias veces» sin quitar la entrada.

### 2. Marchas: el filtro tarda medio segundo y bloquea los toques
- La página pesa 217 KB, con 4.460 elementos.
- `apply()` (`site/assets/site.js:853`) recorre todas las tarjetas: **512 ms** de JS al cargar.
- Un toque a los 1,3 s espera **351 ms** antes de atenderse (INP de 424 ms; por encima de 200 ms se nota).
- Bloqueo total del hilo: 2,4 s.
- **Arreglo:** pintar solo los primeros ~60 resultados (el resto bajo «Ver más», que ya existe con `conResto`), y no llamar a `apply()` al cargar si no hay filtros. Precalcular `data-q` en el HTML.

### 3. En la calle (plano): 1,45 MB de datos y medio segundo de dibujo
- `/data/calle/sevilla.json` pesa **1,45 MB** (Córdoba 876 KB, Granada 703 KB, Málaga 655 KB). Se descarga y se procesa entero.
- `calle.js` tarda **511 ms** en dibujar el plano (`el`, `dibujarPlano`, `pathDe`).
- Toque a los 1,3 s: espera **323 ms** (INP de 368 ms). Bloqueo total: 3,9 s, el peor de la web.
- **Área:** Portada / plano.
- **Arreglos:**
  - Partir el JSON: trazado base aparte del detalle de cada cofradía, que se carga al elegirla. También redondear las coordenadas, que probablemente es lo que más pesa.
  - Dibujar en dos tiempos, cediendo el hilo entre medias (`scheduler.yield` o `setTimeout`).

### 4. `site.js` arranca en todas las páginas: ~330 ms con la CPU lenta
- El bloque de inicio de `site.js` (100 KB) cuesta 216-336 ms en cada página, más `cunao.js` (67 KB, que va en todas).
- En la capital (Sevilla), el bloqueo total es de 1,8 s.
- **Arreglo:**
  - Que cada página ejecute solo la parte que usa (inicio por secciones según `data-*`).
  - Cargar `cunao.js` cuando haga falta (al abrir el ayudante o tras `requestIdleCallback`).

### 5. Calendario y Hoy: HTML grande
- Calendario pesa 191 KB (33 KB comprimido) y tarda 2,9 s en estar listo; Hoy pesa 91 KB.
- Toque a los 1,2 s: la navegación arranca en ~1,5-1,7 s, sobre todo por la red al pedir la página siguiente.
- **Arreglo:** precargar los enlaces de la barra de pestañas con `<script type="speculationrules">` (prefetch moderado), de modo que la página siguiente ya esté en caché al tocar.

## Descartados
- **Service worker:** red primero con tiempo de espera y copia, y navigation preload. No retrasa ni bloquea; en las visitas repetidas sirve los recursos desde la caché (1 KB transferido).
- **Cabeceras de caché (`_headers`):** CSS/JS/fuentes `immutable` con `?v=`; imágenes de 7 días con `stale-while-revalidate`. Están bien.
- **View Transitions** (`@view-transition navigation:auto`): no se vio ningún toque perdido por ellas. Animan 200-420 ms después de llegar la página nueva.
- **Zonas táctiles:** las pestañas miden 75 × 59 px. Bien.
- **news.json (493 KB):** solo se carga en Noticias. No afecta al resto.

## Medidas de partida (carga en frío la portada; las demás, con el service worker ya instalado)

| Página | FCP | LCP | Listo (DCL) | Bloqueo total (TBT) | Tarea más larga |
|---|---|---|---|---|---|
| Portada | 1,4 s | 3,0 s | 3,6 s | 1,3 s (hasta los 8,1 s) | 351 ms |
| Hoy | 1,0 s | 1,0 s | 0,9 s | 0,1 s | 93 ms |
| Calendario | 0,7 s | 1,5 s | 2,8 s | 0,5 s | 233 ms |
| Buscar | 0,8 s | 0,9 s | 0,8 s | 0 | — |
| Capital (Sevilla) | 0,9 s | 0,9 s | 1,8 s | 1,8 s | 276 ms |
| Ficha (Amor, Málaga) | 1,2 s | 1,3 s | 1,2 s | 0 | — |
| Plano (Sevilla) | 0,7 s | 0,7 s | 0,7 s | **3,9 s** | 425 ms |
| Marchas | 0,8 s | 1,0 s | 2,1 s | **2,4 s** | 292 ms |

## RETOMAR AQUÍ
1. Avisar a Portada de la causa 1 y del plano (causa 3); los arreglos de esas dos son suyos. **Hecho:** a través de coordinación.
2. Mañana por la tarde, en este orden: causa 2 (Marchas), causa 5 (speculationrules), causa 4 (`site.js`/`cunao.js` por secciones). Medir antes y después con el mismo método (INP del toque a los 1,3 s, TBT y LCP).
3. Auditor-web y protocolo de subida (build, 390/1440 px, aviso). Todo, antes del sábado 14-nov.
4. **Lanzamiento del sábado 14-nov:** lista de comprobación en `GUIA-ALOJAMIENTO.md` → «Día del lanzamiento».
   - **Jueves 5:** ensayo con `prueba.ochocapitales.com`.
   - **11-12-nov:** repetir la prueba de carga de la landing.
   - **Pendiente de otros:** la hora, de marketing; el «sí» al HSTS, de Pablo.
