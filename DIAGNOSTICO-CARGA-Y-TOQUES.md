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

## Arreglado el 2-nov (subido en `1478615`, auditor-web APTO, prueba de humo verde a 390 y 1440 px)
- **Causa 2 (Marchas):**
  - La página trae 50 filas en lugar de 300. El resto llega como datos (`marchas/resto.json`, unos 380 KB comprimidos, en lugar de 6,4 MB de HTML) y solo se pintan las filas que se ven. La preparación va por tandas.
  - La dirección se apunta 600 ms después y solo si cambia.
  - Tocar una capital con la caché vacía: de 10,2 s (con 4,5 s seguidos bloqueado) a 1,1 s en local y 2,6 s en la web publicada con 4G lento (la descarga de 342 KB); la tarea más larga, 0,22 s. Escribir: de 2,8 s por letra a 0,34 s.
- **Causa 5:** precarga con `speculationrules`. Las pestañas de abajo se piden en cuanto se ven y el resto de enlaces al empezar a tocarlos; la CSP lo firma con hash. El HTML grande de Hoy y Calendario se queda así: el coste de la carga estaba en la red, no en procesarlo.
- **Causa 4:** el arranque de `site.js` pesaba menos de lo que parecía. Lo caro era crear `Intl.RelativeTimeFormat` en cada página, y ahora se crea solo al usarlo. erCuñao se queda como está: cargarlo más tarde haría que su botón no respondiera al primer toque.
- **Barrido de 19 tipos de página** (390 px, CPU 4×, 4G lento, caché vacía): sin errores de consola, enlaces rotos ni cargas eternas.
  - Todas las peticiones de `site.js` pasan por `traer()`, con tiempo máximo que incluye la descarga.
  - Si fallan, sale un aviso y el siguiente toque reintenta.
  - Los filtros de Noticias responden desde el primer toque.
- **Red de seguridad:** `tools/prueba-humo.mjs` comprueba ahora la soltura a 390 px con CPU 4×:
  - LCP < 5 s;
  - ninguna tarea de más de 2 s;
  - el toque en la barra de abajo navega en menos de 4 s;
  - filtrar Marchas termina en menos de 10 s.
- **Portada** arregló la causa 1 y los tiempos máximos de `globo.js` y `calle.js`; la causa 3 (plano de Sevilla) la lleva ella.

## RETOMAR AQUÍ
0. **Vigilar:** que el LCP de 5 s de la prueba de soltura no dé fallos de ruido en GitHub, (la precarga ya se comprobó en producción el 2-nov: la consola sale limpia).
1. Avisar a Portada de la causa 1 y del plano (causa 3); los arreglos de esas dos son suyos. **Hecho:** a través de coordinación.
2. Mañana por la tarde, en este orden: causa 2 (Marchas), causa 5 (speculationrules), causa 4 (`site.js`/`cunao.js` por secciones). Medir antes y después con el mismo método (INP del toque a los 1,3 s, TBT y LCP).
3. Auditor-web y protocolo de subida (build, 390/1440 px, aviso). Todo, antes del sábado 14-nov.
4. **Lanzamiento del sábado 14-nov:** lista de comprobación en `GUIA-ALOJAMIENTO.md` → «Día del lanzamiento».
   - **Jueves 5:** ensayo con `prueba.ochocapitales.com`.
   - **11-12-nov:** repetir la prueba de carga de la landing.
   - **Pendiente de otros:** la hora, de marketing; el «sí» al HSTS, de Pablo.

## 3-nov: tocar una capital en la portada y repaso de plantillas (subido en `24ea474`)
Pablo, en su iPhone: «en la portada, al clicar en la capital tarda bastante».

**Toque en la bandera.** Medido en la web publicada a 390 px:
- Chromium con la CPU 4×: de 2,3 a 3,4 s hasta ver el plano. Casi igual con caché vacía, con caché llena y con 4G normal: **no es la red**.
- WebKit (el motor de Safari): unos 2 s.
- Desglose con Málaga: los datos llegan a los 0,5 s, el plano está montado a los 1,3 s, y después hay 1,5 s de animación (`volarCamara`) que no empezaba hasta que llegaban los datos.
- Lo arregla Portada (`304b091`, pendiente del sí de Pablo): la cámara arranca al tocar y sigue en 1 s al llegar los datos.
- Queda la causa 3, el peso de `data/calle`, que también lleva Portada.

**Hecho aquí:**
- **Caché de un año** (`immutable`) para todo lo versionado con `?v=`. Antes `vida.css`, que frena el pintado y está en todas las páginas, junto con `portada.css`, `noticias.js`, `nazareno.js`, `globo.js`, `globo-datos.json` y `vendor/*`, iban con `max-age=0`: en cada visita, una ida y vuelta solo para preguntar si habían cambiado.
- **Precarga para Safari**, que no tiene `speculationrules`. Con el dedo apoyado 50 ms sin moverse (o el ratón 65 ms encima), el service worker pide la página. Si se navega a ella en 15 s, la sirve sin volver a esperar a la red. Si tarda más de 2,5 s, se ve la copia. No guarda lo que solo se ha precargado y respeta el «ahorro de datos».
  - Medido en WebKit con 500 ms de retraso por página: tocar una capital pasa de ~2,0 s a ~1,5 s de media con un toque de 150 ms. Con la espera de 50 ms la ganancia es algo menor.
- **Cabecera y barra inferior opacas en el móvil.** Con un 97 % de opacidad y sin desenfoque se transparentaban «Toca una bandera…» y las letras de las banderas sobre el logo (captura de Pablo).

**Plantillas en la web publicada:**
- **Página del HTML:** 5–45 KB comprimido. Lo más pesado: Hermandades (45 KB, 3.818 nodos), Calendario (35 KB, 3.115 nodos) y Hoy (17 KB, 3.224 nodos).
- **Imágenes:** en webp, con `loading=lazy` fuera de la primera pantalla y `fetchpriority=high` en la principal.
- **Fuentes:** con `preload` y `font-display: swap`.
- **Compresión:** Brotli en HTML, CSS, JS y JSON.

**Visitas repetidas** (Chromium, CPU 4×, 4G lento, sin service worker), peticiones que van a la red:

| Plantilla | Antes | Después |
|---|---|---|
| Portada | 4 | 1 |
| Hoy, Calendario, Buscar, capital, hermandad, Hermandades, Marchas, imaginero, Favoritos | 2 | 1 |
| Noticias, plano | 3 | 1 |

FCP y LCP varían ±1 s entre pasadas en esta máquina, así que no se comparan. Lo medible y estable es la petición de menos por página.

## RETOMAR AQUÍ (martes 3-nov, desde las 16:00)
Encargo de coordinación: aligerar las tres plantillas con más nodos: Hermandades (3.818), Hoy (3.224) y Calendario (3.115).
1. **Medir antes:** INP y tiempo hasta poder tocar, en WebKit y en Chromium con la CPU 4×. Hacer 5 pasadas por caso y quedarse con la mediana, porque los tiempos varían ±1 s.
   - Scripts de medida en el scratchpad, carpeta `pw/`: `tabla.mjs`, `anim.mjs`, `cascada.mjs` y `safari.mjs`.
   - Playwright 1.48.2 y WebKit ya están instalados allí. Usar Chrome con `NAVEGADOR`.
2. **Probar primero** `content-visibility: auto` con `contain-intrinsic-size` en las secciones por día o por capital.
3. **Si no basta,** pintar el resto bajo demanda, como en Marchas, sin romper:
   - el buscador de la página;
   - los enlaces con `#ancla`;
   - el uso sin JavaScript.
4. **Coordinarse con Diseño (sobremesa):** ha rediseñado Hoy y Calendario. Solo rendimiento, sin cambiar el aspecto.
5. **Para subir:** auditor-web, prueba de humo, comprobación a 390 y 1440 px, y avisar al subir.
- **Pendiente de otros:** Portada publica el toque más rápido en las banderas (`304b091`) con el sí de Pablo, y aligera `data/calle` (causa 3).

## 3-nov tarde: aligerar Hermandades, Hoy y Calendario
Medido en local (Chromium con la CPU 4× y WebKit, 390 px, mediana de 7 pasadas; un toque a los 1,3 s de empezar a cargar).
- **Hermandades** era la única con un problema real. Trae 307 tarjetas en el HTML (sin JS se ven todas; con JS, 50) y el móvil maquetaba las 307 antes de que `site.js` ocultara 257.
  - Cambio: las tarjetas de la 51 en adelante llevan `is-mas` (`build.mjs`, `pageDirHerm`). El script de cabecera pone `oc-js` en `<html>` y `vida.css` oculta esas tarjetas desde el primer pintado. `site.js` quita la marca al filtrar. Sin JS se ven todas.
  - Resultado: carga de 3,2 a 1,3 s, estilo y maquetación de 1,9 a 0,75 s, TBT de 0,58 a 0,18 s, toque a los 1,3 s de 0,32 a 0,12 s.
  - Descartado: `content-visibility: auto` en las tarjetas (ganaba menos: carga 2,0 s). El auditor comprobó que en WebKit la búsqueda en la página no encontraba las tarjetas, VoiceOver no las veía y el scroll daba saltos al subir.
- **Hoy y Calendario** ya estaban ligeros: los días y capitales que no se ven vienen con `hidden` en el HTML y no cuestan maquetación (TBT de unos 120 ms). Probado `content-visibility` en sus bloques: diferencia dentro del ruido; no se tocan.
- Selectores CSS: 0,1 s en total. No son el cuello de botella.
- Comprobado: filtro por capital, búsqueda, «Mostrar más», sin JS (307 visibles), Chromium y WebKit a 390 y 1440 px, sin errores.