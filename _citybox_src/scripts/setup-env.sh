#!/usr/bin/env bash
set -euo pipefail

# setup-env.sh — bootstrap de .env para dev local
#
# Copia todo <dir>/.env.example -> <dir>/.env que ainda não exista,
# nos apps Node (apps/ e services/). A infra (infra/) já é tratada
# pelo próprio infra/scripts/up.sh ao subir cada serviço.
#
# Idempotente: NUNCA sobrescreve um .env existente — seguro re-rodar.
# Uso: pnpm setup:env  (ou bash scripts/setup-env.sh)

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

created=0
skipped=0

while IFS= read -r -d '' example; do
  dir="$(dirname "$example")"
  target="$dir/.env"
  if [[ -f "$target" ]]; then
    echo "• existe   ${target#"$ROOT"/}"
    skipped=$((skipped + 1))
  else
    cp "$example" "$target"
    echo "✓ criado   ${target#"$ROOT"/}"
    created=$((created + 1))
  fi
done < <(find "$ROOT/apps" "$ROOT/services" \
  -name ".env.example" -not -path "*/node_modules/*" -print0 | sort -z)

echo ""
echo "✓ setup:env — $created criado(s), $skipped já existia(m)"
if [[ "$created" -gt 0 ]]; then
  echo "  Revise os .env criados se precisar de valores diferentes dos defaults de dev."
fi
