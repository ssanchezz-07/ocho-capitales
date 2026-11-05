# Cloudflare de Ocho Capitales: revisión de ajustes (fase 1, solo lectura)

5-nov-2026 · Alojamiento. Leído con la API de Cloudflare, sin tocar nada. La zona es ochocapitales.com, con el plan gratuito. El proyecto de Pages es ocho-capitales.

## Resumen
La cuenta está **bien montada**. Lo importante de seguridad y velocidad ya está activo:
- cifrado completo con el servidor (modo «estricto»);
- TLS 1.2 como mínimo y TLS 1.3;
- siempre HTTPS;
- DNSSEC;
- Brotli, HTTP/3, Early Hints y Speed Brain;
- las reglas de protección gratuitas;
- protección contra ataques DDoS;
- Rocket Loader apagado, que es lo correcto.

Las propuestas son pocas y pequeñas. Ninguna cuesta dinero. Ninguna toca el cambio de dominio del 14-nov.

## Propuestas, ordenadas por impacto

| # | Ajuste (qué es, en una línea) | Valor actual | Propuesta | Qué gana | Riesgo | ¿Reversible? |
|---|---|---|---|---|---|---|
| 1 | **HSTS**: le dice al navegador «a esta web, solo por HTTPS» y lo recuerda meses | Apagado en ochocapitales.com (pages.dev ya lo manda, 1 año) | **Decide Pablo.** Propuesta: después del 14-nov, 6 meses, sin «preload» y sin subdominios al principio | Seguridad: nadie puede colar una versión sin cifrar | Si algún día el dominio deja de tener HTTPS, los visitantes no podrían entrar hasta que caduque. Con «preload» casi no tiene vuelta atrás | Sí, bajando a 0, pero los navegadores lo recuerdan hasta que caduca |
| 2 | **Caché de datos.ochocapitales.com**: que Cloudflare guarde noticias y datos unos minutos en vez de pedirlos cada vez a R2 | Cada visita va a R2 («DYNAMIC») | Una regla de caché gratuita que respete los 2 minutos que ya marca el archivo | Velocidad: las noticias llegan antes. Además gasta menos lecturas gratuitas de R2 | Bajo: como mucho, una noticia sale con 2 minutos de retraso, igual que ya se pretende | Sí, se borra la regla |
| 3 | **Tiered Cache** (caché por escalones): los centros de Cloudflare se pasan las copias entre ellos antes de ir al origen | Apagado | Encender (gratis, «Smart Topology») | Velocidad: más aciertos de caché, sobre todo en datos.ochocapitales.com | Muy bajo | Sí, un interruptor |
| 4 | **Crawler Hints**: avisa a Bing y Yandex cuando cambia una página (IndexNow) | Sin activar | Encender | Función, buscadores: Bing encuentra antes las páginas nuevas; ayuda con «mi web no aparece» | Muy bajo | Sí, un interruptor |
| 5 | **Bots de IA** (entrenamiento de modelos) | Se dejan pasar | **Decide Pablo.** Opciones: dejarlo así, que ayuda a salir en buscadores con IA, o bloquear solo los que entrenan modelos | Función: control de quién usa los textos | Bloquear a todos los bots de IA puede quitar visibilidad en ChatGPT, Perplexity y otros | Sí |
| 6 | **DMARC del correo**: dice qué hacer con correos falsos que se hagan pasar por @ochocapitales.com | `p=none`: solo observa, sin informes | Activar los informes gratuitos de DMARC de Cloudflare. Tras 2-4 semanas sin sorpresas, pasar a `quarantine` | Seguridad: evita que alguien envíe correos falsos en nombre de la web | Si Pablo envía desde Gmail como @ochocapitales.com y no está bien firmado, esos correos podrían ir a spam. Por eso primero se mira | Sí, se cambia el registro DNS |
| 7 | **Cabeceras de seguridad de la landing** (lo que hay en ochocapitales.com hasta el 14) | Le faltan algunas que la web nueva ya tiene, como no dejar que la metan dentro de otra página | **Nada hasta el 14**: el 14 se sirve la web nueva, que ya las lleva | Seguridad | — | — |
| 8 | **CAA**: lista de qué empresas pueden emitir certificados para el dominio | Sin registro | Opcional: añadirla con las emisoras que usa Cloudflare | Seguridad, pequeña: otra empresa no podría emitir un certificado falso | Si se escribe mal, Cloudflare no puede renovar el certificado y la web caería | Sí, se borra el registro |

## Lo que se queda como está, y por qué
- **Rocket Loader:** apagado. Reordena los scripts y rompería la web y su política de seguridad (CSP).
- **Bot Fight Mode:** apagado. En el plan gratuito no se puede afinar y puede bloquear las pruebas automáticas de publicación, el vigía y algunas herramientas legítimas. La protección gratuita contra ataques ya está activa.
- **Security Level** medio y **Browser Integrity Check**: activos. Están bien así.
- **0-RTT:** activo. Hace que las visitas repetidas abran antes. En una web de solo lectura no tiene riesgo práctico.
- **Ofuscación de correos:** activa. Esconde de los robots de spam las direcciones de contacto, aviso legal y privacidad. Funciona con la CSP de la web (`'self'`).
- **Web Analytics** (estadísticas gratuitas, sin cookies): activa en ochocapitales.com, y la CSP de la web la permite.
- **Regla www → raíz:** activa con 301. Correcta.
- **Aviso:** www.ochocapitales.com sale como «pendiente» en el proyecto de la landing. No afecta, porque la regla lo redirige antes. Hay que revisarlo el 14 (`GUIA-ALOJAMIENTO.md`).
- **Minificar CSS/JS/HTML** de Cloudflare: apagado. Cloudflare ya no lo ofrece, y la web sale compilada.

## De pago (no hace falta)
- **Polish y Mirage** (compresión de imágenes): las imágenes ya salen en WebP y a su tamaño.
- **Argo:** la web es estática y ya va rápida.
- **Super Bot Fight Mode y WAF avanzado:** no hay zona privada, y el único formulario propio (sugerencias) es pequeño.
- **Rate Limiting avanzado:** el gratuito permite 1 regla, pero no hay nada propio que proteger. El formulario de sugerencias va por `functions/api/sugerencias.js`; si un día recibe abuso, esa regla gratuita sirve.

## Fase 2
Solo con el «sí» de Pablo en el chat y después de pasar auditor-web sobre la lista. Cada cambio se apuntará aquí y en `DECISIONS.md`, con cómo deshacerlo.

| Fecha | Cambio | Cómo deshacerlo | Comprobado |
|---|---|---|---|
| — | (nada aplicado todavía) | — | — |
