#!/usr/bin/env bash
# Ocho Capitales: los archivos que escribe el bot cada hora (noticias y agendas) se guardan en la rama «datos», no en main.
# La rama tiene siempre un único commit que se reescribe, así el historial no crece (~100 MB al mes cuando iban en main).
# En main siguen las copias del 2026-10-26 (para no romper las copias locales de nadie), pero ya no se actualizan.
# Uso (en GitHub Actions, desde la raíz del repo):
#   bash tools/datos-rama.sh traer     → copia los archivos de la rama datos a su sitio
#   bash tools/datos-rama.sh guardar   → sube los archivos actuales a la rama datos (un solo commit, forzado)
# En local: node tools/traer-datos.mjs (no necesita git).
set -euo pipefail
ARCHIVOS="site/data/news.json tools/sources/agenda-externa.json tools/sources/agenda-cuerpos.json tools/sources/agenda-urls.json tools/sources/cambios-bandas.json"

case "${1:-}" in
  traer)
    if git fetch -q --depth=1 origin datos 2>/dev/null; then
      for f in $ARCHIVOS; do mkdir -p "$(dirname "$f")"; git show "FETCH_HEAD:$f" > "$f" 2>/dev/null || { rm -f "$f"; echo "::notice::$f no está en la rama datos"; }; done
      echo "Datos traídos de la rama datos ($(git log -1 --format=%cd FETCH_HEAD))"
    else
      # Primera vez: se parte de las copias que hay en main
      echo "::notice::Aún no existe la rama datos: se parte de las copias de main"
    fi
    ;;
  guardar)
    LISTA=""; for f in $ARCHIVOS; do [ -f "$f" ] && LISTA="$LISTA $f"; done
    [ -n "$LISTA" ] || { echo "::warning::No hay datos que guardar"; exit 0; }
    export GIT_INDEX_FILE="${RUNNER_TEMP:-/tmp}/datos.idx"
    rm -f "$GIT_INDEX_FILE"
    # shellcheck disable=SC2086
    git add -f $LISTA
    T=$(git write-tree)
    C=$(git commit-tree "$T" -m "Datos automáticos: noticias y agendas ($(date -u +%FT%RZ))")
    git push -q -f origin "$C:refs/heads/datos" && echo "Datos guardados en la rama datos ($C)"
    ;;
  *) echo "Uso: bash tools/datos-rama.sh traer|guardar" >&2; exit 2 ;;
esac
