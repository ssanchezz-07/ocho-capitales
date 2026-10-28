# Guía de alojamiento: Ocho Capitales en ochocapitales.com (Cloudflare)

Para Pablo. Todo lo técnico está hecho y probado; aquí solo queda lo que necesita tu cuenta: comprar el dominio, crear una llave, pegar dos cosas en GitHub y conectar el dominio. Unos 20 minutos. Ninguna clave pasa por el chat.

**Qué ganas:**
- La web carga desde la red de Cloudflare con compresión Brotli (10-41 % menos que hoy).
- El móvil guarda CSS, fuentes e imágenes en vez de volver a preguntar cada 10 minutos.
- Puedes actualizar la web tantas veces como quieras, sin esperas: cada cambio real sale al momento.
- Las noticias se renuevan cada hora sin volver a subir la web entera. Van a un almacén aparte (R2), en `datos.ochocapitales.com`.

Datos en `INFORME-VELOCIDAD.md`; el porqué, en `DECISIONS.md`.

**Qué no cambia:** la web de GitHub (`ssanchezz-07.github.io/ocho-capitales`) sigue igual, como copia de seguridad. Cuando quieras (paso 8), lleva a la gente a ochocapitales.com.

Ya existen en tu cuenta de Cloudflare el proyecto de Pages `ocho-capitales` (vacío) y la base de datos D1 `ocho-capitales`.

---


## Paso 0 · Colabora llega a tu correo: HECHO (2026-10-27)
El formulario de `/colabora/` (y el enlace «Sugerir una corrección» de cada ficha, y erCuñao cuando no puede guardar algo) envía cada aportación a **ochocapitales@gmail.com** a través de **Web3Forms** (gratis, 250 envíos al mes). Tu dirección **no aparece** en la página: la clave de Web3Forms hace de alias y es pública por diseño (no da acceso a nada).
- La clave que creaste va por defecto en `site/build.mjs` (`FORM_CLAVE`). Si algún día la cambias, ponla como variable `FORMULARIO_CLAVE` en GitHub (Settings → Secrets and variables → Actions → Variables): la variable manda.
- Envío de prueba hecho el 27-oct con el asunto `[Ocho Capitales] Prueba de activación` (Web3Forms respondió que se envió). Mira tu bandeja y la carpeta de spam; si está en spam, márcalo como «No es spam».

Cada correo llega con el asunto `[Ocho Capitales] Tipo · Capital · Hermandad` (por ejemplo `[Ocho Capitales] Corrección · Málaga · Pollinica`), con el texto, el enlace a la fuente y la página desde la que se envió. Si la persona deja su correo, al pulsar «Responder» le contestas a ella. Reenvíamelo tal cual y lo derivo a la sesión que toque.

## Paso 1 · Comprar ochocapitales.com (lo haces tú)
https://dash.cloudflare.com → **Registro de dominios** (*Domain Registration*) → **Registrar dominios** → busca `ochocapitales.com` → **Comprar**. A precio de coste: ~10,5 $ el primer año y las renovaciones (sube unos 0,7 $ desde el 1-nov-2026). Activa la **renovación automática**.
Comprobado el 25-oct: libre. Al comprarlo en Cloudflare, el dominio y sus DNS quedan ya en tu cuenta; no hay que tocar servidores DNS.

## Paso 2 · Una llave (token) para que GitHub suba la web y las noticias
1. Arriba a la derecha, tu icono → **Perfil** → **Tokens de API** → **Crear token** → **Crear token personalizado**.
2. Nombre: `ocho-capitales-github`. Permisos (dos líneas):
   - *Cuenta* → **Cloudflare Pages** → **Editar**
   - *Cuenta* → **Workers R2 Storage** → **Editar**
3. **Recursos de la cuenta**: *Incluir → tu cuenta*. **Continuar** → **Crear token** → cópialo (solo se enseña una vez). No lo pegues en el chat.
4. Copia también el **ID de cuenta**: **Workers y Pages** → columna de la derecha → **ID de cuenta**.

## Paso 3 · El almacén de noticias (R2)
1. **R2** (*Almacenamiento de objetos*) → si te lo pide, actívalo. Es gratis hasta 10 GB y 10 millones de lecturas al mes (usaremos unos pocos MB), pero Cloudflare pide tener un método de pago: el mismo del dominio.
2. **Crear depósito** (*Create bucket*) → nombre exacto `ocho-capitales-datos` → ubicación automática → **Crear**.
3. Dentro del depósito → **Configuración** → **Dominios personalizados** → **Añadir** → `datos.ochocapitales.com` → **Continuar** → **Conectar dominio**. (La regla CORS, que deja a la web leerlo, la pone sola la publicación.)

## Paso 4 · Pegar en GitHub
https://github.com/ssanchezz-07/ocho-capitales → **Settings** → **Secrets and variables** → **Actions**.

Pestaña **Secrets** → **New repository secret** (dos):

| Nombre (exacto) | Valor |
|---|---|
| `CLOUDFLARE_API_TOKEN` | el token del paso 2 |
| `CLOUDFLARE_ACCOUNT_ID` | el ID de cuenta del paso 2 |

Pestaña **Variables** → **New repository variable** (dos):

| Nombre (exacto) | Valor |
|---|---|
| `CLOUDFLARE_URL` | `https://ochocapitales.com` |
| `NOTICIAS_URL` | `https://datos.ochocapitales.com/news.json` |

## Paso 5 · Conectar el dominio a la web
**Workers y Pages** → `ocho-capitales` → **Dominios personalizados** → **Configurar un dominio personalizado** → `ochocapitales.com` → **Activar dominio**. Repite con `www.ochocapitales.com`. Cloudflare crea los registros y el certificado solo (de minutos a una hora).

## Paso 6 · Decir «publica en Cloudflare»
Escríbeme **«publica en Cloudflare»**. Hago la primera publicación y compruebo que:
- `https://ochocapitales.com` abre;
- las noticias llegan desde `datos.ochocapitales.com`;
- la caché y las cabeceras son las previstas.

Después te paso Lighthouse en móvil, antes y después.

(Si prefieres hacerlo tú: GitHub → **Actions** → «Publicar Ocho Capitales» → **Run workflow**. El trabajo «cloudflare» debe salir en verde.)

## Paso 7 · Mirar el contador una vez (2 minutos, una semana después)
**Workers y Pages** → `ocho-capitales` → **Implementaciones**. Si el panel cuenta las subidas como «compilaciones» del tope de 500 al mes, dímelo y paso la web a *Workers con archivos estáticos*: mismo dominio, sin ese tope. Mientras tanto, la publicación se frena sola en 450 al mes (variable `CLOUDFLARE_TOPE_MES`).

## Paso 8 · Llevar la web de GitHub al dominio (cuando Cloudflare lleve unos días bien)
GitHub → Variables → `GITHUB_REDIRIGE_A` = `https://ochocapitales.com`. Desde la siguiente publicación, cada página de `ssanchezz-07.github.io/ocho-capitales/…` lleva a la misma página de ochocapitales.com, y Google pasa a mirar el dominio. Para deshacerlo, borra la variable.

## Cómo se publica a partir de ahora (para que lo sepas)
1. **Cada hora** GitHub lee las noticias y las agendas y las guarda en la rama `datos`. Sube solo `news.json` a R2, y la página de Noticias lo coge de ahí al momento. Si R2 fallara, usa las noticias que van dentro de la web. La copia de GitHub Pages se actualiza igual que antes.
2. **La web entera** solo se sube a Cloudflare cuando cambia algo que sale en ella. Los documentos internos (`.md`, `EQUIPO/`…) no la suben. Además se sube una vez al día, para que la portada, «Hoy» y la agenda estén al día.
3. Antes de subir se comprueban los límites de Cloudflare: 20.000 archivos y 25 MiB por archivo; hoy hay ~12.000 archivos y el mayor ocupa 3 MB.

En tu PC, para tener las noticias del día: `node tools/traer-datos.mjs` (desde la carpeta del proyecto).

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
