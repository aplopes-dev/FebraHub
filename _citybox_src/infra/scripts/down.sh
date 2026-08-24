#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

CORE_SERVICES=(
  nginx
  keycloak
  minio
  typesense
  rabbitmq
  redis
  postgres
)

EXTRA_SERVICES=(
  metabase
  unleash
  postgres-replica
  mailpit
)

PROFILE="${1:-core}"

down_one() {
  local name="$1"
  local dir="$ROOT/infra/$name"
  if [[ ! -f "$dir/docker-compose.yml" ]]; then
    return 0
  fi
  echo "■ $name"
  docker compose -f "$dir/docker-compose.yml" --project-directory "$dir" down
}

case "$PROFILE" in
  full|all)
    for s in "${EXTRA_SERVICES[@]}" "${CORE_SERVICES[@]}"; do
      down_one "$s"
    done
    echo "✓ stack citybox-platform completa parada"
    ;;
  core|"")
    for s in "${CORE_SERVICES[@]}"; do
      down_one "$s"
    done
    echo "✓ stack citybox-platform core parada"
    ;;
  *)
    down_one "$PROFILE"
    ;;
esac
