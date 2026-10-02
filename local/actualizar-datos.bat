@echo off
REM Vuelve a importar los datos del plugin (tras regenerar portal.json) y deja el servidor encendido.
cd /d "%~dp0"
set ROOT=%~dp0..
set WPDIR=%~dp0wordpress
echo Actualizando datos de InfoCofrade (unos minutos)...
call npx -y @wp-playground/cli@latest server --port=9400 --site-url=http://127.0.0.1:9400 --login --wordpress-install-mode=install-from-existing-files-if-needed --mount-dir-before-install "%WPDIR%" /wordpress --mount-dir "%ROOT%\portal-cofrade" /wordpress/wp-content/plugins/portal-cofrade --blueprint="%~dp0actualizar.json"
