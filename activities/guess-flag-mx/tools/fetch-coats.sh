#!/usr/bin/env bash
# ============================================================
# Descarga los 32 escudos de las entidades federativas de México
# desde Wikimedia Commons al directorio assets/coats/ usando
# códigos ISO 3166-2:MX en minúscula como nombre de archivo.
#
# Uso:
#   bash tools/fetch-coats.sh
#
# Los nombres canónicos de Wikimedia fueron verificados — ver:
# https://commons.wikimedia.org/wiki/Category:Coats_of_arms_of_states_of_Mexico
# ============================================================

set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
DEST="$HERE/../assets/coats"
mkdir -p "$DEST"

# Formato: <iso_code>|<wikimedia_filename>
declare -a items=(
  "agu|Coat_of_arms_of_Aguascalientes.svg"
  "bcn|Coat_of_arms_of_Baja_California.svg"
  "bcs|Coat_of_arms_of_Baja_California_Sur.svg"
  "cam|Coat_of_arms_of_Campeche.svg"
  "chp|Coat_of_Arms_of_Chiapas_(2026).svg"
  "chh|Coat_of_arms_of_Chihuahua.svg"
  "cmx|Coat_of_arms_of_Mexico_City,_Mexico.svg"
  "coa|Coat_of_arms_of_Coahuila.svg"
  "col|Coat_of_arms_of_Colima.svg"
  "dur|Coat_of_arms_of_Durango.svg"
  "mex|Coat_of_arms_of_Mexico_State.svg"
  "gua|Coat_of_arms_of_Guanajuato.svg"
  "gro|Coat_of_arms_of_Guerrero.svg"
  "hid|Coat_of_arms_of_Hidalgo.svg"
  "jal|Coat_of_arms_of_Jalisco.svg"
  "mic|Escudo_del_Estado_de_Michoacán.svg"
  "mor|Coat_of_arms_of_Morelos.svg"
  "nay|Coat_of_arms_of_Nayarit.svg"
  "nle|Coat_of_arms_of_Nuevo_Leon.svg"
  "oax|Coat_of_arms_of_Oaxaca.svg"
  "pue|Coat_of_arms_of_Puebla.svg"
  "que|Coat_of_arms_of_Queretaro.svg"
  "roo|Coat_of_arms_of_Quintana_Roo.svg"
  "slp|Coat_of_arms_of_San_Luis_Potosi.svg"
  "sin|Coat_of_arms_of_Sinaloa.svg"
  "son|Coat_of_arms_of_Sonora.svg"
  "tab|Coat_of_arms_of_Tabasco.svg"
  "tam|Coat_of_arms_of_Tamaulipas.svg"
  "tla|Coat_of_arms_of_Tlaxcala.svg"
  "ver|Coat_of_arms_of_Veracruz.svg"
  "yuc|Coat_of_arms_of_Yucatan.svg"
  "zac|Coat_of_arms_of_Zacatecas.svg"
)

ok=0
fail=0
for item in "${items[@]}"; do
  id="${item%%|*}"
  filename="${item##*|}"
  encoded="$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$filename")"
  url="https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}"
  out="$DEST/${id}.svg"
  printf "  %-5s " "$id"
  if curl -L -sf -A "playground-fetch/1.0 (https://github.com/lu1s9/playground)" -o "$out" "$url" \
       && head -c 200 "$out" | grep -qiE "<svg|<\?xml"; then
    size="$(wc -c < "$out" | tr -d ' ')"
    echo "OK (${size} bytes)"
    ((ok++))
  else
    echo "FAIL: $url"
    rm -f "$out"
    ((fail++))
  fi
  sleep 0.3
done

echo ""
echo "Done. OK: $ok / FAIL: $fail"
