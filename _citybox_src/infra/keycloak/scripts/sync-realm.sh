#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"

if [[ -f "$ROOT/services/platform-apps.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/services/platform-apps.env"
  set +a
fi

KC_ENV="$ROOT/infra/keycloak/.env"
if [[ -f "$KC_ENV" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$KC_ENV"
  set +a
fi

export KEYCLOAK_URL="${KEYCLOAK_URL:-http://127.0.0.1:8080}"
export KEYCLOAK_ADMIN="${KEYCLOAK_ADMIN:-admin}"
export KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-citybox}"
cd "$ROOT"
exec pnpm exec tsx infra/keycloak/scripts/sync-realm.mjs
