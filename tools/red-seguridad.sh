#!/usr/bin/env bash
# Ocho Capitales · red de seguridad antes de publicar (GitHub Actions; también en local con Git Bash).
# Si cualquier comprobación falla, sale con error y el flujo NO publica: se queda la versión anterior.
#   1. Datos: marchas (tools/comprobar-marchas.mjs) y origen único de portal.json (tools/comprobar-origen.mjs), 0 errores.
#   2. Enlaces internos rotos en la web generada (tools/comprobar-enlaces.mjs).
#   3. Límites de Cloudflare Pages: menos de 20.000 archivos (aviso desde 18.000) y ninguno de más de 25 MiB.
#   4. Prueba de humo con un navegador de verdad (tools/prueba-humo.mjs), servida en local.
# Uso: bash tools/red-seguridad.sh <carpeta de la web> <base, «/» o «/ocho-capitales/»>
# Necesita Playwright en PLAYWRIGHT_DIR (el flujo lo instala aparte) o en el proyecto.
set -uo pipefail
DIST="${1:-site/dist}"; BASE="${2:-/}"; PUERTO="${PUERTO:-8080}"
export MSYS_NO_PATHCONV=1
fallo=0
paso() { echo "::group::$1"; }
fin() { if [ "$1" -ne 0 ]; then echo "::error::Red de seguridad: falla «$2»"; fallo=1; fi; echo "::endgroup::"; }

paso "Datos: marchas";            node tools/comprobar-marchas.mjs;                 fin $? "comprobar-marchas"
paso "Datos: origen de portal";   node tools/comprobar-origen.mjs;                  fin $? "comprobar-origen"
paso "Enlaces internos";          node tools/comprobar-enlaces.mjs "$DIST" "$BASE"; fin $? "enlaces internos"
paso "Límites de Cloudflare";     node site/despliegue.mjs "$DIST";                 fin $? "límites de archivos"

if [ -n "${SIN_HUMO:-}" ]; then echo "Prueba de humo omitida (cada página redirige al dominio)"; else
paso "Prueba de humo"
# site/serve.mjs sirve site/<DIST_DIR> con la misma base que tendrá publicada
DIST_DIR="$(basename "$DIST")" BASE_PATH="$BASE" PORT="$PUERTO" node site/serve.mjs > /dev/null 2>&1 &
SERVIDOR=$!
curl -s -o /dev/null --retry 30 --retry-connrefused --retry-delay 1 "http://localhost:$PUERTO$BASE"
node tools/prueba-humo.mjs "http://localhost:$PUERTO$BASE"; r=$?
kill "$SERVIDOR" 2>/dev/null
fin $r "prueba de humo"
fi

if [ "$fallo" -ne 0 ]; then echo "::error::La web NO se publica: se queda la versión anterior. Mira arriba qué ha fallado."; exit 1; fi
echo "Red de seguridad: todo en orden"
