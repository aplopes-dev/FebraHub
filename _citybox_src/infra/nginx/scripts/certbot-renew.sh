#!/usr/bin/env bash
# Renovação Let's Encrypt — agendar no cron: 0 3 * * * /path/certbot-renew.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

docker compose -f "$ROOT/docker-compose.certbot.yml" run --rm certbot renew --quiet
docker compose -f "$ROOT/docker-compose.yml" -f "$ROOT/docker-compose.certbot.yml" exec nginx nginx -s reload 2>/dev/null \
  || true

echo "✓ Certbot renew OK $(date -Iseconds)"
