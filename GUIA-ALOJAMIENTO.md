# Guía de alojamiento: Ocho Capitales en ochocapitales.com (Cloudflare)

Para Pablo. Todo lo técnico está hecho y probado; aquí solo queda lo que necesita tu cuenta: crear una llave, el almacén de noticias y pegar dos cosas en GitHub. Unos 15 minutos. Ninguna clave pasa por el chat.

**Hasta el lanzamiento** (decisión de Pablo, 28-oct): `ochocapitales.com` muestra la landing de espera. Es el proyecto de Pages `ocho-capitales-espera`, que lleva marketing: está publicada en https://ocho-capitales-espera.pages.dev desde el 28-oct y sus pasos están en `MARKETING/landing/PUBLICAR.md`. Desde el 28-oct (Pablo: «Publica landing»), `ochocapitales.com` y `www` están conectados a la landing: dos CNAME a `ocho-capitales-espera.pages.dev` (con proxy), una regla que lleva `www` a la raíz con 301 y un certificado que Cloudflare renueva solo. Comprobado el 28-oct: la zona `ochocapitales.com` y los dos proyectos están en la misma cuenta de Cloudflare, así que el cambio del día del lanzamiento vale tal cual. La web completa se publica en **`https://ocho-capitales.pages.dev`** y el dominio se le pasa el día del lanzamiento (apartado «Día del lanzamiento»).

**Qué ganas:**
- La web carga desde la red de Cloudflare con compresión Brotli (10-41 % menos que hoy).
- El móvil guarda CSS, fuentes e imágenes en vez de volver a preguntar cada 10 minutos.
- Puedes actualizar la web tantas veces como quieras, sin esperas: cada cambio real sale al momento.
- Las noticias se renuevan cada día a las 7:00. Van a un almacén aparte (R2), en `datos.ochocapitales.com`.

Datos en `INFORME-VELOCIDAD.md`; el porqué, en `DECISIONS.md`.

**Qué no cambia:** la web de GitHub (`ssanchezz-07.github.io/ocho-capitales`) sigue igual, como copia de seguridad. El día del lanzamiento lleva a la gente a ochocapitales.com.

Ya existen en tu cuenta de Cloudflare el proyecto de Pages `ocho-capitales` (vacío) y la base de datos D1 `ocho-capitales`.

---


## Paso 0 · Colabora llega a tu correo: HECHO (2026-10-27)
El formulario de `/colabora/` (y el enlace «Sugerir una corrección» de cada ficha, y erCuñao cuando no puede guardar algo) envía cada aportación a **ochocapitales@gmail.com** a través de **Web3Forms** (gratis, 250 envíos al mes). Tu dirección **no aparece** en la página: la clave de Web3Forms hace de alias y es pública por diseño (no da acceso a nada).
- La clave que creaste va por defecto en `site/build.mjs` (`FORM_CLAVE`). Si algún día la cambias, ponla como variable `FORMULARIO_CLAVE` en GitHub (Settings → Secrets and variables → Actions → Variables): la variable manda.
- Envío de prueba hecho el 27-oct con el asunto `[Ocho Capitales] Prueba de activación` (Web3Forms respondió que se envió). Mira tu bandeja y la carpeta de spam; si está en spam, márcalo como «No es spam».

Cada correo llega con el asunto `[Ocho Capitales] Tipo · Capital · Hermandad` (por ejemplo `[Ocho Capitales] Corrección · Málaga · Pollinica`), con el texto, el enlace a la fuente y la página desde la que se envió. Si la persona deja su correo, al pulsar «Responder» le contestas a ella. Reenvíamelo tal cual y lo derivo a la sesión que toque.

## Paso 1 · El dominio ochocapitales.com: HECHO (28-oct)
La zona está activa en tu cuenta de Cloudflare (plan gratis). Comprueba solo que la **renovación automática** está encendida: **Registro de dominios** → `ochocapitales.com`.

## Paso 2 · Una llave (token) para que GitHub suba la web y las noticias: HECHO (28-oct)
1. Arriba a la derecha, tu icono → **Perfil** → **Tokens de API** → **Crear token** → **Crear token personalizado**.
2. Nombre: `ocho-capitales-github`. Permisos (dos líneas):
   - *Cuenta* → **Cloudflare Pages** → **Editar**
   - *Cuenta* → **Workers R2 Storage** → **Editar**
3. **Recursos de la cuenta**: *Incluir → tu cuenta*. **Continuar** → **Crear token** → cópialo (solo se enseña una vez). No lo pegues en el chat.
4. Copia también el **ID de cuenta**: **Workers y Pages** → columna de la derecha → **ID de cuenta**.

## Paso 3 · El almacén de noticias (R2): HECHO (28-oct)
Pablo activó R2. Yo creé el depósito `ocho-capitales-datos`, le puse la regla CORS y le conecté `datos.ochocapitales.com`, con el certificado activo. Solo falta la variable `NOTICIAS_URL` (paso 4).

### Cómo se hizo
1. **R2** (*Almacenamiento de objetos*) → si te lo pide, actívalo. Es gratis hasta 10 GB y 10 millones de lecturas al mes (usaremos unos pocos MB), pero Cloudflare pide tener un método de pago: el mismo del dominio.
2. **Crear depósito** (*Create bucket*) → nombre exacto `ocho-capitales-datos` → ubicación automática → **Crear**.
3. Dentro del depósito → **Configuración** → **Dominios personalizados** → **Añadir** → `datos.ochocapitales.com` → **Continuar** → **Conectar dominio**. (La regla CORS, que deja a la web leerlo, la pone sola la publicación.)

## Paso 4 · Pegar en GitHub: HECHO (28-oct; secretos y variable `NOTICIAS_URL`)
https://github.com/ssanchezz-07/ocho-capitales → **Settings** → **Secrets and variables** → **Actions**.

Pestaña **Secrets** → **New repository secret** (dos):

| Nombre (exacto) | Valor |
|---|---|
| `CLOUDFLARE_API_TOKEN` | el token del paso 2 |
| `CLOUDFLARE_ACCOUNT_ID` | el ID de cuenta del paso 2 |

Pestaña **Variables** → **New repository variable** (dos):

| Nombre (exacto) | Valor |
|---|---|
| `NOTICIAS_URL` | `https://datos.ochocapitales.com/news.json` |

(La variable `CLOUDFLARE_URL` **todavía no**: se crea el día del lanzamiento. Mientras no exista, la web se anuncia a Google como `ocho-capitales.pages.dev`.)

## Paso 5 · Nada de dominio en «ocho-capitales» todavía
No conectes `ochocapitales.com` al proyecto `ocho-capitales` hasta el día del lanzamiento: ahora lo tiene la landing.

## Paso 6 · Primera publicación: HECHA (28-oct, `fc5460e`)
https://ocho-capitales.pages.dev publicada. La red de seguridad pasó antes y después de subirla, y las cabeceras de caché y seguridad están comprobadas.

### Cómo era el paso 6
Escríbeme **«publica en Cloudflare»**. Hago la primera publicación y compruebo que:
- `https://ocho-capitales.pages.dev` abre;
- las noticias llegan desde `datos.ochocapitales.com`;
- la caché y las cabeceras son las previstas.

Después te paso Lighthouse en móvil, antes y después.

(Si prefieres hacerlo tú: GitHub → **Actions** → «Publicar Ocho Capitales» → **Run workflow**. El trabajo «cloudflare» debe salir en verde.)

## Paso 7 · Mirar el contador una vez (2 minutos, una semana después)
**Workers y Pages** → `ocho-capitales` → **Implementaciones**. Si el panel cuenta las subidas como «compilaciones» del tope de 500 al mes, dímelo y paso la web a *Workers con archivos estáticos*: mismo dominio, sin ese tope. Mientras tanto, la publicación se frena sola en 450 al mes (variable `CLOUDFLARE_TOPE_MES`).

## Día del lanzamiento · Pasar ochocapitales.com de la landing a la web (unos 20 minutos)
**Fecha: sábado 14-nov** (Pablo, 2-nov: coincide con la extraordinaria de la Pasión). La hora la pasa marketing con la de salida de la extraordinaria y su fuente. El cambio se hace solo con el «sí» de Pablo en el chat ese día. Lo hacemos juntos: tú pulsas en Cloudflare y GitHub, y yo compruebo.

### Lista de comprobación del 14-nov
**Antes del día**
- [ ] **Jueves 5 · ensayo:** se conecta `prueba.ochocapitales.com` al proyecto `ocho-capitales`, se mide cuánto tarda el certificado, se prueban las redirecciones y se quita. La landing no se toca.
- [ ] **Jueves 12 · vídeo con enlace a ochocapitales.com:** la landing aguanta. Comprobado el 2-nov:
  - es estática en Pages, sin límite de visitas;
  - con 60 visitas a la vez, las 60 dieron 200;
  - `www` y `http` llevan a `https://ochocapitales.com/` con un 301;
  - los enlaces con `?utm_…` y cualquier ruta abren la landing.

  Repetir la prueba el 11 o el 12.
- [ ] **Antes del 14:** subidos los arreglos de velocidad (Marchas, precarga, `site.js`/`cunao.js`) y, de Portada, el toque que se pierde con el globo.
- [ ] **HSTS de la zona** (Cloudflare → SSL/TLS → Edge Certificates): solo con el «sí» de Pablo. La web ya manda `Strict-Transport-Security: max-age=31536000`, sin `includeSubDomains` ni `preload`. Activarlo en la zona cubriría también la landing y `datos`. Si Pablo dice sí, empezar sin `preload`, porque `preload` es difícil de deshacer.

**El día 14**
- [ ] **7:00-7:15:** la publicación de noticias del día está en R2 y verde en Actions. El cambio, nunca mientras se publica: comprobar que no hay ninguna ejecución en marcha.
- [ ] Pasos 1 a 8 de abajo, a la hora acordada.
- [ ] **Redirecciones:**
  - `www` → raíz: la regla ya existe;
  - `github.io` → dominio: variable `GITHUB_REDIRIGE_A`;
  - `ocho-capitales.pages.dev` → dominio: con una *Bulk Redirect* de la cuenta (Pages no deja redirigir por nombre en `_redirects`). Solo el nombre exacto, sin subdominios, para que las vistas previas de cada subida sigan abriendo. Las pruebas de después de subir ya usan `CLOUDFLARE_URL`, así que no les afecta.
- [ ] **Analítica:** a los 10 minutos salen visitas en **Análisis → Web Analytics** del dominio, y la consola no da errores de CSP.
- [ ] **Noticias:** `/noticias/` muestra las de las 7:00 leídas de `datos.ochocapitales.com`.
- [ ] **Vuelta atrás preparada:** se sabe cómo volver (apartado «Si algo sale mal») y en cuánto tiempo (el que salga en el ensayo del jueves 5).
- [ ] **Aviso a marketing:** las redes guardan la vista previa de la landing («Algo se está encendiendo»). Al lanzar, refrescarla en el depurador de cada red. Además, la imagen de compartir de la landing apunta a `ocho-capitales-espera.pages.dev`: mejor que apunte al dominio.
- [ ] **El domingo 15, a las 7:00:** primera publicación de noticias con el dominio. El vigía no cambia; solo hay que mirar que la portada del dominio tiene la hora nueva.
1. **Antes:** la última publicación de «ocho-capitales» en verde (GitHub → Actions) y `https://ocho-capitales.pages.dev` bien.
2. **Quitar el dominio de la landing:** **Workers y Pages** → `ocho-capitales-espera` → **Dominios personalizados** → en `ochocapitales.com` (y `www`, si lo tiene), los tres puntos → **Eliminar dominio**. Durante unos minutos el dominio no muestra nada.
3. **Ponérselo a la web:** **Workers y Pages** → `ocho-capitales` → **Dominios personalizados** → **Configurar un dominio personalizado** → `ochocapitales.com` → **Activar dominio**. Repite con `www.ochocapitales.com`.
4. **Esperar al certificado:** en esa misma pantalla, los dos dominios pasan a **Activo** (de 1 a 15 minutos; como mucho, una hora).
5. **Los dos registros DNS:** la landing los tiene a mano (CNAME `ochocapitales.com` y `www` → `ocho-capitales-espera.pages.dev`). Si al activar el dominio en el paso 3 Cloudflare no los cambia solo, en **ochocapitales.com** → **DNS** → **Registros**, edita los dos CNAME para que apunten a `ocho-capitales.pages.dev` (con proxy, la nube naranja). La regla que lleva `www` a la raíz ya existe y sirve igual. El CNAME `datos` (noticias en R2) no se toca.
6. **GitHub, dos variables** (Settings → Secrets and variables → Actions → Variables):
   - `CLOUDFLARE_URL` = `https://ochocapitales.com`: canónicos, mapa del sitio y avisos a Google con el dominio, y `pages.dev` deja de indexarse;
   - `GITHUB_REDIRIGE_A` = `https://ochocapitales.com`: cada página de `ssanchezz-07.github.io/ocho-capitales/…` lleva a la misma página del dominio.
7. **Publicar:** GitHub → **Actions** → «Publicar Ocho Capitales» → **Run workflow**, o dime «publica». La red de seguridad comprueba la web antes y después de subirla.
8. **Comprobar** (lo hago yo; te lo cuento en una línea):
   - `https://ochocapitales.com` abre la portada con candado;
   - `www.ochocapitales.com` y una página de `github.io` llevan al dominio;
   - las noticias llegan de `datos.ochocapitales.com`;
   - Colabora envía al correo;
   - Lighthouse en móvil.
- **Web Analytics** (activado por el coordinador el 28-oct en la zona, con instalación automática): Cloudflare inyecta su script en cada página del dominio. La web ya lo permite en su política de seguridad (`static.cloudflareinsights.com` y `cloudflareinsights.com`, desde `el 28-oct`). La prueba de humo no cuenta sus avisos como fallos, así que un fallo de la analítica nunca hace volver atrás la web. Comprobar en el paso 8 que las visitas aparecen en **Análisis** → **Web Analytics**.
9. **Después:** dar de alta `https://ochocapitales.com` en Google Search Console con el mapa del sitio (`/sitemap.xml`).

**Si algo sale mal:** quita el dominio de `ocho-capitales` y vuelve a ponérselo a `ocho-capitales-espera` (pasos 2 y 3 al revés), y borra las dos variables del paso 6. En unos minutos está como antes.

## Cómo se publica a partir de ahora (para que lo sepas)
1. **Cada día a las 7:00 de España** (Pablo, 1-nov) se leen las noticias y las agendas, se valida `news.json`, pasa la red de seguridad, se guardan en la rama `datos` y se publica la web, en GitHub Pages y en Cloudflare; al final se sube a R2, que es la marca de «publicada hoy». Si una fuente cae, se publica con las demás; si el archivo no pasa la validación o falla algo, sigue lo anterior y se reintenta.
2. **La web entera** se sube además cuando cambia algo que sale en ella; esas subidas no leen noticias. Los documentos internos (`.md`, `EQUIPO/`…) no la suben.
3. Antes de subir se comprueban los límites de Cloudflare: 20.000 archivos y 25 MiB por archivo; hoy hay ~12.000 archivos y el mayor ocupa 3 MB.

En tu PC, para tener las noticias del día: `node tools/traer-datos.mjs` (desde la carpeta del proyecto).

## Las noticias de las 7:00: cómo se asegura
- **Avisos de GitHub:** hay uno cada 10 minutos de 5 a 9:59 UTC. Vale el primero a partir de las 7:00 de Madrid (cubre invierno y verano, `tools/noticias-hoy.mjs`); los demás ven que la publicación ya está en R2 y no hacen nada. Si una falla, el siguiente la reintenta, hasta las 11:00 de Madrid en invierno y las 12:00 en verano. **Por sí solos no bastan:** GitHub se salta la mayoría (de 72 avisos al día arrancaban unos 5, con huecos de hasta 8 horas), así que sin el vigía la publicación puede salir horas tarde o no salir ese día. Además, GitHub puede apagar los avisos de un repositorio sin actividad durante 60 días.
- **Vigía de Cloudflare** (`ocho-capitales-vigia`, código en `workers/vigia-noticias`, instalado el 1-nov con el sí de Pablo): lanza la publicación a las 7:00 exactas, la reintenta a las 7:30 y, si a las 8:30 no está, avisa a `ochocapitales@gmail.com`. También avisa si GitHub rechaza su llave. Es gratis y sin acceso público; usa los 5 Cron Triggers del plan.

**Última llave, para que el vigía pueda lanzar (5 minutos):**
1. Entra en https://github.com/settings/personal-access-tokens/new
2. **Token name:** `ocho-capitales-vigia`. **Expiration:** la más larga que deje (apúntate la fecha: al caducar, el vigía te avisará por correo).
3. **Repository access:** *Only select repositories* → `ocho-capitales`.
4. **Permissions** → **Actions**: *Read and write*. Nada más.
5. **Generate token** y cópialo. No lo pegues en el chat.
6. Entra en https://dash.cloudflare.com → **Cómputo** → **Workers y Pages** → `ocho-capitales-vigia` → **Configuración** → **Variables y secretos** → **Añadir** → tipo **Secreto**, nombre `GITHUB_TOKEN`, valor el token → **Guardar/Implementar**.
7. Dime «token puesto».

## La red de seguridad: ninguna actualización rompe la web
Cada vez que se publica (un cambio de cualquier sesión o la lectura de noticias), antes de subir nada se comprueba la web entera:
1. **Los datos:** las marchas (`tools/comprobar-marchas.mjs`) y que `portal.json` sale de sus fuentes (`tools/comprobar-origen.mjs`), con 0 errores.
2. **Los enlaces:** que ningún enlace de la web lleve a una página o archivo que no existe (hoy, casi un millón de enlaces, 0 rotos).
3. **El tamaño:** menos de 20.000 archivos (aviso desde 18.000; hoy ~13.700) y ninguno de más de 25 MB.
4. **Un navegador de verdad:** abre portada, Hoy, Noticias, una hermandad, una marcha, Buscar y el plano de Málaga, en móvil (390 px) y en ordenador (1440 px). No puede haber errores ni nada que se salga por los lados.

**Si algo falla, no se publica**: queda en línea la versión anterior, que funcionaba. En Cloudflare, además, se repite la prueba del navegador después de subir; si falla ahí, **la web vuelve sola a la versión anterior** en segundos.
Las noticias se validan antes de publicar nada (forma, cantidad, fecha y tamaño). Si no pasan, no se publica y sigue el archivo anterior, y la página siempre tiene además las noticias que van dentro de la web.

**Cómo se ve en GitHub:** pestaña **Actions** → «Publicar Ocho Capitales».
- **Verde:** publicado.
- **Rojo:** no se ha publicado nada nuevo y la web sigue como estaba. Entra en la ejecución → trabajo `construir` o `cloudflare` → paso «Red de seguridad»: arriba sale en rojo qué ha fallado (por ejemplo, «Enlace roto /colabora-rota/» o «Hoy a 390px: JS: …»). Reenvíamelo y lo arreglamos.

Para probar un cambio delicado sin riesgo, súbelo a una rama que empiece por `prueba-red/`: pasa todas las comprobaciones y no publica nada.

## Si algo falla
- **«cloudflare» en rojo con «Authentication error»:** al token le falta un permiso del paso 2 o está mal copiado. Créalo de nuevo y vuelve a pegarlo.
- **«Noticias a R2» con aviso:**
  - si dice que el depósito no existe, revisa el nombre exacto del paso 3;
  - si es por permisos, falta el de R2 en el token.
  - Mientras tanto, la web sigue usando sus noticias.
- **«Límites de Cloudflare Pages» en rojo:** la web pasa de 20.000 archivos o algún archivo de 25 MiB. No se sube nada roto; avísame.
- **Quieres volver atrás:** borra el secreto `CLOUDFLARE_API_TOKEN` en GitHub y todo vuelve a ser solo GitHub Pages.

## Pendiente que necesita tu sí
- **Limpiar el historial viejo** de `news.json` (~1.000 versiones, ~140 MB). Hay que reescribir la historia de git con `git filter-repo`, y todas las sesiones tendrían que volver a clonar. Es irreversible; solo con tu «sí» expreso y sin otras sesiones trabajando.
- **Documentos internos en el repositorio público:** te propondré cuáles sacar, o pasar el repositorio a privado cuando la web ya salga de Cloudflare.
