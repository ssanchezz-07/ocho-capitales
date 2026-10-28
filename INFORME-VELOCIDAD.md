# Informe de velocidad · Ocho Capitales (2026-10-25)

Qué se midió, con qué y qué cambió. Las decisiones están en `DECISIONS.md` (2026-10-25) y los pasos para publicar en Cloudflare, en `GUIA-ALOJAMIENTO.md`.

## 1. Antes: la web publicada en GitHub Pages
Lighthouse 12.6.1, rendimiento, simulación de móvil lento (4G lento, CPU ×4) y PC. https://ssanchezz-07.github.io/ocho-capitales/

| Página | Dispositivo | Nota | FCP | LCP | TBT | CLS | Peso |
|---|---|---|---|---|---|---|---|
| Portada | móvil | 78 | 1,6 s | 2,1 s | 700 ms | 0,085 | 1.295 KiB |
| Portada | PC | 100 | 0,5 s | 0,5 s | 10 ms | 0,015 | 1.635 KiB |
| Sevilla | móvil | 96 | 1,5 s | 2,3 s | 110 ms | 0,012 | 479 KiB |
| Sevilla | PC | 99 | 0,5 s | 0,7 s | 0 ms | 0,005 | 424 KiB |
| Buscar | móvil | 100 | 1,2 s | 1,5 s | 0 ms | 0,003 | 240 KiB |
| Buscar | PC | 100 | 0,3 s | 0,4 s | 0 ms | 0,009 | 241 KiB |

Cabeceras HTTP de GitHub Pages (medidas con `curl`):
- **`Cache-Control: max-age=600` para todo**, también para el CSS y el JS con huella y las fuentes: a los 10 minutos el navegador vuelve a preguntar por cada archivo.
- Solo **gzip** (no Brotli). Única cabecera de seguridad: HSTS.
- Respuesta del servidor (TTFB) 0,08-0,30 s desde España.

Lo que más pesa:
- **Portada en móvil: ~1 MB son tres fotos de noticias** de los medios (300-400 KB cada una, 1.200 px) mostradas en cajas de 160×120. Es interfaz: propuesta para la sesión de portada en `DECISIONS.md`.
- **TBT de 700 ms en la portada**: ~2,5 s de CPU (móvil lento) evaluando el HTML (106 SVG en línea y un script de 11 KB). También de la sesión de portada.
- `search-index.json` 2,1 MB (424 KB gzip), que además cambia cada hora porque lleva las 200 últimas noticias.

Service worker de antes: la caché se llamaba `oc-<fecha de compilación>`, así que **cada publicación horaria la borraba entera** (lo guardado para usar sin conexión se perdía cada hora), y las páginas esperaban a la red sin límite aunque hubiera copia.

## 2. Qué se ha cambiado (infraestructura, sin tocar el diseño)
1. **Service worker nuevo** (`site/despliegue.mjs`): cachés con nombre fijo que sobreviven a las publicaciones; red primero con un máximo de 2,5 s de espera si hay copia; recursos con huella y fuentes desde la copia sin preguntar; carcasa precargada (CSS, JS, 2 fuentes, 8 colgaduras, página «Sin conexión»); topes de tamaño; *navigation preload*.
2. **`_headers` y `_redirects` para Cloudflare Pages**: CSS/JS con huella y fuentes un año `immutable`; imágenes una semana con renovación en segundo plano; noticias 5 min; `sw.js` sin caché; `nosniff`, `X-Frame-Options`, `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`, COOP y HSTS; `/ocho-capitales/*` → `/*` (enlaces viejos de GitHub).
3. **Precarga de las fuentes** Karantina (titular, que es el LCP de la portada) y Heebo.
4. **Manifiesto de la PWA** con `id`, `dir` y categorías (instalable igual que antes, con identidad estable).
5. **El bot deja de subir `news.json` a main** (rama `datos`, un commit que se reescribe).
6. **Publicación en Cloudflare Pages** lista en Actions, con comprobación de límites, a falta de las claves de Pablo.

## 3. Después
### 3.1 Visitas repetidas, poca cobertura y sin conexión (Playwright, servidor local de Cloudflare `wrangler pages dev`)
| Prueba | Antes | Después |
|---|---|---|
| Segunda visita a Sevilla: peticiones a la red | el SW renueva los recursos en segundo plano, y tras cada publicación horaria la caché se vacía y se descarga todo otra vez | **1** (solo la página; 21 recursos desde el móvil) |
| Página ya visitada con una red que tarda 6 s | 6 s o más (esperaba a la red) | **2,8 s** (la copia, y la red la renueva detrás) |
| Sin conexión, página visitada | solo si se visitó después de la última publicación (al abrir la web con red tras una publicación horaria, la caché se vaciaba) | **abre en 0,45 s**, la visitaras cuando la visitaras (hasta 120 páginas) |
| Sin conexión, página no visitada | página «Sin conexión» | página «Sin conexión» |
| Errores de consola con red | 0 | 0 |

### 3.2 Cabeceras (servidor local de Cloudflare, comprobadas con `curl`)
| Archivo | GitHub Pages | Cloudflare Pages |
|---|---|---|
| `/assets/site.css?v=…`, `site.js`, fuentes | `max-age=600` | `max-age=31536000, immutable` |
| Imágenes | `max-age=600` | `max-age=604800, stale-while-revalidate=2592000` |
| `news.json` | `max-age=600` | `max-age=300, stale-while-revalidate=3600` |
| HTML | `max-age=600` | `max-age=0, must-revalidate` (siempre al día; 304 si no cambió) |
| `sw.js` | `max-age=600` | `no-cache` |
| Compresión | gzip | Brotli |
| `/api/sugerencias` | no existe | responde (401 sin clave, como debe) |

### 3.3 Brotli frente a gzip (mismos archivos, compresión máxima)
| Archivo | Original | gzip | Brotli | Ahorro |
|---|---|---|---|---|
| Portada (HTML) | 184 KB | 36 KB | 29 KB | 18 % |
| Sevilla (HTML) | 89 KB | 17 KB | 14 KB | 17 % |
| `site.css` | 132 KB | 25 KB | 21 KB | 16 % |
| `site.js` | 63 KB | 19 KB | 17 KB | 12 % |
| `search-index.json` | 2.135 KB | 424 KB | 302 KB | 29 % |
| Plano de Sevilla | 927 KB | 266 KB | 203 KB | 24 % |
| `marchas/resto.html` | 2.961 KB | 369 KB | 218 KB | 41 % |

Cloudflare puede comprimir con un nivel algo menor que el máximo; son cifras de techo.

### 3.4 Primera visita (Lighthouse móvil en local, mediana de 3)
Mismo PC y mismo servidor local para las dos versiones. **Con mucho ruido**: había otras sesiones usando la CPU y el TBT de una misma página saltaba de 70 a 1.090 ms entre pasadas, así que solo vale como tendencia.

| Página | Versión | Nota | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|
| Portada | antes | 85 | 1,5 s | 2,6 s | 225 ms | **0,114** |
| Portada | después | 92 | 1,3 s | 3,0 s | 190 ms | **0,029** |
| Sevilla | antes | 72 | 1,8 s | 3,3 s | 906 ms | 0,005 |
| Sevilla | después | (2 pasadas válidas) | 1,1 s | 3,4-3,6 s | 390-1.090 ms | 0,000 |

Lo único claro en la primera visita: **el salto de diseño (CLS) de la portada baja de 0,114 a 0,029** (de «mejorable» a «bueno») gracias a la precarga de las fuentes. El LCP no mejora en local; en la primera visita, lo que más lo bajaría son las fotos de noticias (sección 1). La primera visita real se medirá en producción cuando Cloudflare esté publicado (etapa E12).

## 3.5 En producción: Cloudflare frente a GitHub Pages (28-oct, primera publicación)
Lighthouse móvil (simulado), dos pasadas por página, la misma versión de la web en los dos sitios.

| Página | Sitio | Nota | FCP | LCP | TBT |
|---|---|---|---|---|---|
| Portada | Cloudflare | 74-76 | 1,8 s | 5,2 s | 60-120 ms |
| Portada | GitHub Pages | 74-82 | 1,6-1,8 s | 2,7-3,7 s | 290-310 ms |
| Sevilla | Cloudflare | 90 | 1,4 s | 3,5-3,6 s | 30 ms |
| Sevilla | GitHub Pages | 85-93 | 1,4-1,8 s | 2,6-2,8 s | 150-320 ms |

- **La red va mejor en Cloudflare:**
  - HTTP/3 y Brotli;
  - caché de un año en CSS, JS y fuentes (en GitHub, 28 de 33 recursos sin caché larga);
  - el HTML llega antes (TTFB 465 ms frente a 614 ms) y el TBT es menor.
- **El LCP sale peor en Cloudflare por el «retraso de pintado»:** 3,5 s frente a 1,5 s en la portada. Es el tiempo entre que la imagen ya ha llegado y que la página la pinta. No es la red: la imagen tarda lo mismo en llegar en los dos. Hay que mirar por qué la entrada de la portada (globo y animaciones) tarda más en pintar con las cabeceras de Cloudflare. Se lo paso a la sesión de portada.

## 4. Pendiente
- Lighthouse en producción en Cloudflare, móvil y PC, cuando Pablo publique (E12).
- Fotos de noticias redimensionadas y TBT de la portada (sesión de portada).
- `search-index.json` sin noticias y partido (sesión de marchas).
- Limpiar el historial viejo de `news.json` (necesita el sí de Pablo).
