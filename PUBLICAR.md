# Publicar InfoCofrade gratis, rápido y sin servidor

## La opción recomendada: sitio estático + GitHub Pages (0 €)
InfoCofrade se publica como **sitio estático**: páginas HTML ya generadas que se sirven desde una red de distribución global.
- **Coste:** 0 €. GitHub Pages y GitHub Actions son gratuitos para repositorios públicos.
- **Fluidez:** no hay base de datos ni PHP; cada página se descarga ya hecha. Carga casi instantánea y aguanta picos de tráfico en Semana Santa.
- **Noticias al día:** un proceso automático (`.github/workflows/publicar.yml`) lee las 60 fuentes **cada 2 horas**, guarda el archivo de noticias y vuelve a publicar.
- **Sin mantenimiento:** sin actualizaciones de WordPress, sin plugins que caducar, sin copias de seguridad de base de datos (todo está en el repositorio).

### Pasos (unos 15 minutos, una sola vez)
1. Crea una cuenta gratuita en https://github.com (esto lo tienes que hacer tú).
2. Pulsa **New repository** → nombre `infocofrade` → **Public** → *Create repository* (vacío, sin README).
3. Sube el proyecto. Desde esta carpeta (`portal-cofrade`), en una terminal:
   ```
   git remote add origin https://github.com/TU_USUARIO/infocofrade.git
   git push -u origin main
   ```
   (Te pedirá iniciar sesión en GitHub la primera vez. Alternativa sin terminal: GitHub Desktop → *Add existing repository* → esta carpeta → *Publish*.)
4. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
5. Pestaña **Actions** → «Publicar InfoCofrade» → **Run workflow**. En 2–3 minutos el sitio estará en:
   `https://TU_USUARIO.github.io/infocofrade/`
6. A partir de ahí se actualiza solo cada 2 horas. Si cambias datos (por ejemplo, regeneras `portal.json`), basta con `git push`.

### Dominio propio (opcional, ~10 €/año)
Compra el dominio (p. ej. `infocofrade.es`), añádelo en **Settings → Pages → Custom domain** y en el archivo del flujo cambia:
`BASE_PATH: /` y `SITE_URL: https://infocofrade.es`.

### Alternativa equivalente: Cloudflare Pages (0 €, permite repositorio privado)
Conecta el repositorio en https://pages.cloudflare.com → *Build command:* `cd site && npm ci && node build.mjs` → *Output:* `site/dist` → variable `BASE_PATH=/`. El flujo de GitHub seguirá actualizando las noticias cada 2 h y Cloudflare publicará cada cambio.

## ¿Y WordPress?
- **En tu PC:** `local\iniciar-portal.bat` (panel de administración, edición de fichas). Tras cambiar datos: `local\actualizar-datos.bat`.
- **En internet:** WordPress necesita PHP y base de datos; no hay alojamiento gratuito fiable para ello (los gratuitos limitan CPU, bloquean el cron y las conexiones salientes que leen las noticias). Si algún día quieres WordPress público, un hosting de 3–5 €/mes + `portal-cofrade.zip` funciona tal cual (ver `GUIA-INSTALACION.md`).

## Ver la versión pública en tu PC
Doble clic en `ver-infocofrade.bat` → abre http://localhost:8080
