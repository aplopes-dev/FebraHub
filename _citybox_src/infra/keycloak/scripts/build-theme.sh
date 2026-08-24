#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
COMPOSE_FILE="$ROOT/infra/keycloak/docker-compose.yml"

echo "▶ keycloak-theme: building Docker image (vite + keycloakify + maven run inside Docker)…"
docker compose -f "$COMPOSE_FILE" build keycloak

echo "▶ keycloak: restarting container with new image…"
docker compose -f "$COMPOSE_FILE" up -d keycloak

echo "▶ keycloak: waiting for healthy status…"
for i in $(seq 1 30); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' citybox_keycloak 2>/dev/null || echo "missing")
  if [[ "$STATUS" == "healthy" ]]; then
    echo "✓ keycloak healthy after ${i}× ($(( i * 5 ))s)"
    exit 0
  fi
  printf "  [%02d] %s\n" "$i" "$STATUS"
  sleep 5
done

echo "✗ keycloak did not become healthy in time. Check logs:"
echo "  docker logs citybox_keycloak --tail 40"
exit 1
