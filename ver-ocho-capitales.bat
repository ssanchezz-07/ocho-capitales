@echo off
REM Genera y abre la versión pública de Ocho Capitales en tu PC: http://localhost:8080
cd /d "%~dp0site"
if not exist node_modules call npm install --no-audit --no-fund
echo Leyendo noticias...
call node fetch-news.mjs
call node build.mjs
start "" http://localhost:8080
node serve.mjs
