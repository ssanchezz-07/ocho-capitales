# Guía de alojamiento: Ocho Capitales en Cloudflare Pages

Para Pablo. Todo lo técnico ya está hecho; aquí solo queda lo que necesita tu cuenta: crear dos claves, pegarlas en GitHub y en Cloudflare, y decir «publica». Unos 15 minutos. Gratis.

**Qué ganas:** la web carga desde la red de Cloudflare con compresión Brotli (10-41 % menos que hoy), el móvil guarda CSS, fuentes e imágenes en vez de volver a preguntar cada 10 minutos, cabeceras de seguridad y el buzón de erCuñao funcionando. Datos en `INFORME-VELOCIDAD.md`; el porqué, en `DECISIONS.md` (2026-10-25).

**Qué no cambia:** la web de GitHub (`ssanchezz-07.github.io/ocho-capitales`) sigue funcionando igual, como copia, hasta que tú digas.

Ya existen en tu cuenta de Cloudflare: el proyecto de Pages `ocho-capitales` (vacío) y la base de datos D1 `ocho-capitales`.

---

## Paso 1 · Token de Cloudflare (la llave para que GitHub suba la web)
1. Entra en https://dash.cloudflare.com → arriba a la derecha, tu icono → **Perfil** → **Tokens de API** → **Crear token**.
2. Busca la plantilla **«Editar Cloudflare Pages»** (*Edit Cloudflare Pages*) → **Usar plantilla**. Si no aparece, **Crear token personalizado** con un único permiso: *Cuenta → Cloudflare Pages → Editar*.
3. En **Recursos de la cuenta**: *Incluir → tu cuenta*. Nada más.
4. **Continuar** → **Crear token**. Copia el token (solo se enseña una vez). No lo pegues en el chat.

## Paso 2 · Identificador de la cuenta
En https://dash.cloudflare.com → **Workers y Pages** → a la derecha, **ID de cuenta** → copiar. (No es secreto, pero va en el mismo sitio.)

## Paso 3 · Dos contraseñas largas que inventas tú
- **`RESUMEN_TOKEN`**: la que usa el resumen semanal de sugerencias para leer el buzón. Mínimo 32 caracteres al azar (el gestor de contraseñas de tu navegador o de Windows puede generarla).
- **`SAL`**: otra distinta, también larga. Sirve para que la cifra de las IP del buzón no se pueda deshacer.
Guárdalas en tu gestor de contraseñas.

## Paso 4 · Pegar en GitHub (Settings → Secrets)
https://github.com/ssanchezz-07/ocho-capitales → **Settings** → **Secrets and variables** → **Actions**.

Pestaña **Secrets** → **New repository secret**, uno a uno:

| Nombre (exacto) | Valor |
|---|---|
| `CLOUDFLARE_API_TOKEN` | el token del paso 1 |
| `CLOUDFLARE_ACCOUNT_ID` | el ID del paso 2 |
| `RESUMEN_TOKEN` | la primera contraseña del paso 3 |
| `SUGERENCIAS_URL` | `https://ocho-capitales.pages.dev/api/sugerencias` |

Pestaña **Variables** (opcional, solo si cambias algo):

| Nombre | Valor | Para qué |
|---|---|---|
| `CLOUDFLARE_URL` | `https://ocho-capitales.pages.dev` (o tu dominio cuando lo tengas) | la dirección que se pone en el mapa del sitio y en los enlaces canónicos |
| `CLOUDFLARE_CADA_HORAS` | `2` | solo si Cloudflare avisa de que te acercas a 500 despliegues al mes (ver «Si algo falla») |

## Paso 5 · Pegar en el proyecto de Cloudflare Pages
https://dash.cloudflare.com → **Workers y Pages** → `ocho-capitales` → **Configuración** → **Variables y secretos** (entorno **Producción**) → **Añadir**:

| Tipo | Nombre | Valor |
|---|---|---|
| Secreto | `RESUMEN_TOKEN` | la misma que en GitHub |
| Secreto | `SAL` | la segunda contraseña |

La base de datos ya está enlazada como `DB`; no hay que tocarla.

## Paso 6 · Decir «publica»
Escríbeme en el chat **«publica en Cloudflare»**. Yo lanzo la publicación, compruebo que `https://ocho-capitales.pages.dev` abre, que el buzón responde y que Lighthouse da lo esperado, y te digo el resultado.

(Si prefieres hacerlo tú: GitHub → **Actions** → «Publicar Ocho Capitales» → **Run workflow**. El trabajo «cloudflare» debe salir en verde.)

---

## Dominio (opcional, cuando quieras)
**Hoy:** `https://ocho-capitales.pages.dev` es gratis, tiene HTTPS y ya es tuyo. Se puede usar tal cual.

**Si compras uno** (comprobado el 2026-10-25: los tres sin registrar):

| Dominio | Dónde | Precio aproximado | Nota |
|---|---|---|---|
| **`ochocapitales.es`** (recomendado) | Un registrador español: DonDominio, Dinahosting, Arsys… | ~7 €/año (DonDominio anuncia 6,95 €; mira si es con IVA) | El público es español y es el más barato. Cloudflare no vende `.es`, pero puede gestionar sus DNS gratis |
| `ochocapitales.com` | Cloudflare Registrar (a precio de coste) | ~10,5 $/año (sube unos 0,7 $ desde el 1-nov-2026) | Todo en un sitio |
| `ocho-capitales.com` | ídem | ídem | Con guion: peor para decirlo en voz alta |

Comprar es cosa tuya (yo no compro). Después:
1. **Con `.es` comprado fuera:** en Cloudflare → **Añadir un dominio** → plan **Free** → Cloudflare te da dos servidores DNS → en el panel del registrador, cambia los «servidores DNS» por esos dos. Tarda de minutos a unas horas.
2. **Workers y Pages** → `ocho-capitales` → **Dominios personalizados** → **Configurar** → escribe `ochocapitales.es` (y otra vez para `www.ochocapitales.es`). Cloudflare crea los registros y el certificado solo.
3. En GitHub → Variables → `CLOUDFLARE_URL` = `https://ochocapitales.es`.
4. Dime «dominio listo»: compruebo la redirección de `www`, que `pages.dev` deje de indexarse en Google (ya preparado en `_headers`) y, si quieres, activo las miniaturas de noticias redimensionadas por Cloudflare (solo funciona con dominio propio).

## Qué hace la publicación cada hora (para que lo sepas)
1. GitHub lee las noticias y agendas y las guarda en la rama **`datos`** (un solo commit que se reescribe: el historial de `main` ya no crece ~100 MB al mes).
2. Genera la web y la publica en GitHub Pages (como hasta ahora).
3. Si existen los secretos del paso 4, la genera para la raíz del dominio, comprueba los límites de Cloudflare (20.000 archivos, 25 MiB por archivo; hoy 10.795 y 3 MB) y la sube a Cloudflare Pages.

En tu PC, para tener las noticias del día: `node tools/traer-datos.mjs` (desde la carpeta del proyecto).

## Si algo falla
- **El trabajo «cloudflare» sale en rojo con «Authentication error»:** el token no tiene el permiso de Pages o está mal copiado. Repite el paso 1 y vuelve a pegarlo.
- **«Límites de Cloudflare Pages» en rojo:** la web pasa de 20.000 archivos o algún archivo de 25 MiB. No se sube nada roto; avísame.
- **Cloudflare avisa de que te acercas a 500 despliegues al mes:** pon la variable `CLOUDFLARE_CADA_HORAS` = `2` (se sube cada dos horas: 360 al mes).
- **El buzón de erCuñao responde «sin base de datos»:** falta el enlace `DB` en el proyecto (Configuración → Enlaces → D1 `ocho-capitales`).
- **Quieres volver atrás:** borra el secreto `CLOUDFLARE_API_TOKEN` en GitHub y todo vuelve a ser solo GitHub Pages.

## Pendiente que necesita tu sí
- **Limpiar el historial viejo** (las ~1.000 versiones antiguas de `news.json`, ~140 MB): hay que reescribir la historia de git con `git filter-repo` y que todas las sesiones vuelvan a clonar. Es irreversible; solo con tu «sí» expreso y sin otras sesiones trabajando.
- **Apagar GitHub Pages** o convertirlo en redirección a Cloudflare, cuando Cloudflare lleve una semana sin fallos.
