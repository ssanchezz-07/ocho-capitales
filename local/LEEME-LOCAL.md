# Portal Cofrade en tu ordenador

## Abrirlo
1. Doble clic en `local\iniciar-portal.bat` (necesita Node.js, que ya tienes). Déjala abierta: es el servidor.
2. Espera a ver «Ready! WordPress is running on http://127.0.0.1:9400» y abre esa dirección en el navegador.
3. Panel de administración: http://127.0.0.1:9400/wp-admin
   - La primera visita entra sola como administrador (el script usa `--login`).
   - Si te pide contraseña: usuario `admin`, contraseña `PortalCofrade-2026`. Cámbiala en Usuarios → Perfil.
4. Para pararlo, cierra la ventana negra.

Los datos (entradas, ajustes, noticias) se guardan en `local\wordpress` y persisten entre arranques.
Haz copia de esa carpeta cuando quieras tener una copia de seguridad.

## Ajustes ya hechos
Español, enlaces permanentes «nombre de la entrada», zona horaria Madrid, plugin Portal Cofrade activo,
datos importados, «Portal Cofrade» como página de inicio y menú con las 8 secciones.

## Limitaciones de esta versión local
- Es para probar y editar: va con SQLite y solo se ve desde tu PC. Para internet, hay que subirlo a un alojamiento (ver abajo).
- La lectura automática de noticias solo corre mientras el servidor está encendido; también puedes lanzarla a mano en
  Portal Cofrade → Panel → «Actualizar noticias ahora».
