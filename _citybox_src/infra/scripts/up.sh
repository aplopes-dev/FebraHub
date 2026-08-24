#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

CORE_SERVICES=(
  postgres
  redis
  rabbitmq
  typesense
  minio
  keycloak
  nginx
  # App Node, não infra — fica por último de propósito: este script usa
  # `set -euo pipefail`, então um build que falhe aqui não impede a infra
  # (postgres…nginx) de já ter subido. Depende de postgres + minio + keycloak.
  fiscal-api
)

EXTRA_SERVICES=(
  postgres-replica
  unleash
  metabase
  mailpit
)

PROFILE="${1:-core}"

up_one() {
  local name="$1"
  local dir="$ROOT/infra/$name"
  if [[ ! -f "$dir/docker-compose.yml" ]]; then
    echo "skip: $name (sem docker-compose.yml)"
    return 0
  fi
  echo "▶ $name"
  if [[ -f "$dir/.env.example" && ! -f "$dir/.env" ]]; then
    cp "$dir/.env.example" "$dir/.env"
    echo "  criado $dir/.env a partir de .env.example"
  fi
  docker compose -f "$dir/docker-compose.yml" --project-directory "$dir" up -d
  if [[ "$name" == "rabbitmq" ]]; then
    # definitions.json não cria users; apps usam citybox/citybox no vhost citybox
    if docker ps --format '{{.Names}}' | grep -qx citybox_rabbitmq; then
      sleep 2
      (cd "$dir" && bash scripts/ensure-user.sh && bash scripts/sync-bindings.sh) || true
    fi
  fi
}

case "$PROFILE" in
  full)
    for s in "${CORE_SERVICES[@]}" "${EXTRA_SERVICES[@]}"; do
      up_one "$s"
    done
    echo "✓ stack citybox-platform completa iniciada (core + extras)"
    ;;
  core|all|"")
    for s in "${CORE_SERVICES[@]}"; do
      up_one "$s"
    done
    echo "✓ stack citybox-platform core iniciada"
    ;;
  *)
    up_one "$PROFILE"
    ;;
esac
