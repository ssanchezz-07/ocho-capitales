# Publicar Ocho Capitales gratis, rápido y sin servidor

## La opción elegida: sitio estático + GitHub Pages (0 €)
Ocho Capitales se publica como **sitio estático**: páginas HTML ya generadas que se sirven desde la red de GitHub.
- **Coste:** 0 €. GitHub Pages y GitHub Actions son gratuitos para repositorios públicos.
- **Fluidez:** sin base de datos ni PHP; cada página se descarga ya hecha. Aguanta los picos de Semana Santa.
- **Noticias al día:** el flujo `.github/workflows/publicar.yml` («Publicar Ocho Capitales») lee las 60 fuentes **cada 2 horas**, guarda `site/data/news.json` y vuelve a publicar.
- **La portada se recalcula sola:** la jornada de «Hoy» sale de la fecha de Pascua, así que cada año se ajusta sin tocar nada.

### Pasos (una sola vez)
1. Cuenta gratuita en https://github.com (la creas tú).
2. **New repository** → nombre `ocho-capitales` → **Public** → *Create repository* (vacío, sin README).
3. Sube el proyecto desde esta carpeta:
   ```
   git remote add origin https://github.com/TU_USUARIO/ocho-capitales.git
   git push -u origin main
   ```
   La primera vez Git abre el navegador para que autorices el acceso a GitHub.
4. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
5. Pestaña **Actions** → «Publicar Ocho Capitales» → **Run workflow**. En 2–3 minutos el sitio está en:
   `https://TU_USUARIO.github.io/ocho-capitales/`
6. A partir de ahí se actualiza solo cada 2 horas. Si cambias datos o diseño, basta con `git push`.

### Dominio propio (opcional, ~10 €/año)
Compra el dominio (comprueba antes que no exista una web cofrade con el mismo nombre), añádelo en **Settings → Pages → Custom domain** y en `.github/workflows/publicar.yml` cambia:
`BASE_PATH: /` y `SITE_URL: https://tu-dominio.es`.

### Alternativa equivalente: Cloudflare Pages (0 €, permite repositorio privado)
Conecta el repositorio en https://pages.cloudflare.com → *Build command:* `cd site && npm ci && node build.mjs` → *Output:* `site/dist` → variable `BASE_PATH=/`. El flujo de GitHub seguirá actualizando las noticias cada 2 h y Cloudflare publicará cada cambio.

## Trabajar en local
- **Ver la web en tu PC:** doble clic en `ver-ocho-capitales.bat` → abre http://localhost:8080
- **Probar como en GitHub Pages** (con la subcarpeta del repositorio), desde `site/`:
  ```
  BASE_PATH=/ocho-capitales/ SITE_URL=https://TU_USUARIO.github.io/ocho-capitales node build.mjs
  BASE_PATH=/ocho-capitales/ node serve.mjs
  ```
  y abre http://localhost:8080/ocho-capitales/ (en Git Bash de Windows antepón `MSYS_NO_PATHCONV=1` para que no convierta la ruta).
- **Prueba de estrés del diseño:** `PEOR_CASO=1 node build.mjs` genera el sitio con nombres larguísimos, campos vacíos e imágenes rotas. Solo para revisar; vuelve a ejecutar `node build.mjs` antes de publicar.
- El servidor local comprime como GitHub Pages, así que Lighthouse en local da cifras comparables.

## Diseño
El contexto de producto está en `PRODUCT.md`. Estilos en `site/assets/site.css` (una sola hoja, tokens claros y oscuros), interacción en `site/assets/site.js` y plantillas en `site/build.mjs`. Los iconos de app (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`) y la imagen para compartir (`og.png`) están en `site/assets/`.

## ¿Y WordPress?
- **En tu PC:** `local\iniciar-portal.bat` (panel de administración, edición de fichas). Tras cambiar datos: `local\actualizar-datos.bat`.
- **En internet:** WordPress necesita PHP y base de datos; no hay alojamiento gratuito fiable para ello. Si algún día lo quieres público, un hosting de 3–5 €/mes + `portal-cofrade.zip` funciona tal cual (ver `GUIA-INSTALACION.md`).
