# Portal Cofrade — guía de puesta en marcha

## Qué incluye
Plugin de WordPress (`portal-cofrade.zip`) que crea:
- **Capitales** (8), **hermandades** (280), **bandas** (62), **imagineros** (142), con fichas enlazadas entre sí.
- **Noticias**: lee 60 fuentes (Google Noticias por capital y por tema, 11 portadas de prensa andaluza filtradas por temática cofrade, webs oficiales: agrupaciones de Málaga y Almería, Real Federación de Granada, 23 hermandades de Córdoba y diócesis). Guarda titular, extracto corto, imagen y enlace a la fuente; no copia noticias completas.
- 8 páginas con shortcodes (portada, noticias, capitales, calendario, hermandades, bandas, imagineros, buscador) y un menú «Portal Cofrade».

## Instalación (WordPress autoalojado)
1. Ajustes recomendados: PHP 7.4+ (mejor 8.1+), WordPress 5.9+, enlaces permanentes en «Nombre de la entrada».
2. Plugins → Añadir nuevo → Subir plugin → `portal-cofrade.zip` → Activar.
3. Se abre el panel **Portal Cofrade** y la importación arranca sola (1–2 min). Si se corta, pulsa el botón de nuevo: continúa sin duplicar.
4. Pulsa **Actualizar noticias ahora** para la primera carga.
5. Pulsa **Usar «Portal Cofrade» como página de inicio**.
6. Tema: cualquier tema clásico o de bloques sirve. Si el menú no aparece, asígnalo en Apariencia → Menús.

## Cron real (importante)
WP-Cron solo se ejecuta cuando hay visitas. Para lecturas puntuales, añade en tu hosting una tarea cron cada 30 min:
`*/30 * * * * curl -s https://TU-SITIO/wp-cron.php?doing_wp_cron >/dev/null`
y en `wp-config.php`: `define('DISABLE_WP_CRON', true);`

## Mantenimiento
- Fuentes: Portal Cofrade → Fuentes de noticias. Para añadir la web de una hermandad o banda basta con poner su web: el plugin detecta el feed. Estado y errores en el Panel.
- Fichas: se editan como cualquier entrada. Las editadas a mano **no se pisan** al reimportar.
- Palabras clave del filtro de portadas: Panel → Ajustes.

## Límites conocidos (v1.0)
- Se probó en WordPress local (PHP 8.3): importación, reimportación sin duplicados, 35 fuentes reales, directorio, buscador y fichas. No se probó en tu hosting.
- Muchas webs de hermandades no publican RSS; esas no se pueden leer automáticamente. Google Noticias cubre buena parte.
- Historia: capitales y casi todas las hermandades tienen la reseña ya recopilada; bandas e imagineros tienen ficha básica (bio solo en 14 imagineros). Falta ampliar con investigación verificada.
- Las noticias muestran la hora en el idioma del sitio (configura WordPress en español).
