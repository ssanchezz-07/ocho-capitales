@echo off
REM Portal Cofrade en local. Abre luego http://127.0.0.1:9400  (cierra esta ventana para pararlo)
cd /d "%~dp0"
set ROOT=%~dp0..
set WPDIR=%~dp0wordpress
if not exist "%WPDIR%\wp-config.php" (
  echo Primera instalacion: tardara varios minutos, no cierres esta ventana...
  call npx -y @wp-playground/cli@latest server --port=9400 --site-url=http://127.0.0.1:9400 --login --mount-dir-before-install "%WPDIR%" /wordpress --mount-dir "%ROOT%\portal-cofrade" /wordpress/wp-content/plugins/portal-cofrade --blueprint="%~dp0primera-vez.json"
) else (
  call npx -y @wp-playground/cli@latest server --port=9400 --site-url=http://127.0.0.1:9400 --login --wordpress-install-mode=install-from-existing-files-if-needed --mount-dir-before-install "%WPDIR%" /wordpress --mount-dir "%ROOT%\portal-cofrade" /wordpress/wp-content/plugins/portal-cofrade
)
