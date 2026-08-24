#!/usr/bin/env bash
# DEPRECATED — use o reset multi-realm:
#   pnpm reset:multirealm -- --yes
#   pnpm reset:multirealm -- --yes --target=prod   # VPS aplopes
#
# Este arquivo só redireciona para não quebrar automações antigas.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
echo "⚠ infra/keycloak/scripts/reset-production.sh está obsoleto (realm citybox-dev)." >&2
echo "  Redirecionando para scripts/dev/reset-multirealm.sh --target=prod" >&2
exec bash "${ROOT}/scripts/dev/reset-multirealm.sh" --yes --target=prod "$@"
