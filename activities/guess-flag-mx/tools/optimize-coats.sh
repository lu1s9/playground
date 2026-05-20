#!/usr/bin/env bash
# ============================================================
# Optimiza los SVGs descargados pasándolos por svgo en sitio.
# Requiere: node + npx (incluidos en cualquier instalación Node.js).
#
# Uso:
#   bash tools/optimize-coats.sh
#
# Settings:
#   --multipass   — sigue optimizando hasta que no haya más ahorro
#   --precision=2 — coords con 2 decimales (default 3, suficiente para escudos)
#   -r            — procesa el directorio recursivamente
# ============================================================

set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
COATS="$HERE/../assets/coats"

if [ ! -d "$COATS" ]; then
  echo "Error: $COATS no existe. Corré fetch-coats.sh primero."
  exit 1
fi

count=$(find "$COATS" -maxdepth 1 -name '*.svg' | wc -l | tr -d ' ')
before_kb=$(du -sk "$COATS" | awk '{print $1}')

echo "Optimizando $count SVGs en $COATS"
echo "Tamaño antes: $((before_kb / 1024)) MB"
echo ""

npx -y svgo --multipass --precision=2 -r -f "$COATS" 2>&1 | tail -5

after_kb=$(du -sk "$COATS" | awk '{print $1}')
delta=$((before_kb - after_kb))
pct=$((delta * 100 / before_kb))

echo ""
echo "Tamaño después: $((after_kb / 1024)) MB"
echo "Ahorro: $((delta / 1024)) MB (~${pct}%)"
