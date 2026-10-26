@echo off
chcp 65001 >nul
title Editor de rutas (Ocho Capitales) - no cierres esta ventana mientras lo uses
cd /d "%~dp0"
rem 1) Enciende el trazador (GraphHopper) si no lo está. Tarda unos 30 segundos.
curl -s -o nul http://localhost:8989/health
if errorlevel 1 (
  echo Encendiendo el trazador GraphHopper...
  start "Trazador GraphHopper (ciérrala al terminar)" /min /d "C:\Users\pablo\Herramientas-IA\graphhopper" java -Xmx3g -jar graphhopper-web-11.1.jar server config.yml
)
rem 2) Abre el editor en el navegador y arranca su servidor.
start "" http://localhost:8765
node servidor.mjs %1
pause
