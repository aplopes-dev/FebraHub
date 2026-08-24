#!/usr/bin/env bash
# Emite certificados Let's Encrypt para subdomínios citybox.com (primeira vez).
# Pré-requisitos: DNS A apontando para este servidor; portas 80/443 abertas.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EMAIL="${CERTBOT_EMAIL:-admin@citybox.com}"
DOMAINS=(
  city.citybox.com
  api.citybox.com
  app.citybox.com
  admin.citybox.com
  ws.citybox.com
)

echo "▶ Certbot — domínios: ${DOMAINS[*]}"
echo "  E-mail: $EMAIL"
echo ""

mkdir -p /var/www/certbot

# Nginx só HTTP (sem blocos SSL) para o desafio ACME
if [[ -f "$ROOT/conf.d/prod-citybox.conf" ]]; then
  mv "$ROOT/conf.d/prod-citybox.conf" "$ROOT/conf.d/prod-citybox.conf.disabled"
fi

docker compose -f "$ROOT/docker-compose.yml" -f "$ROOT/docker-compose.certbot.yml" up -d nginx 2>/dev/null \
  || docker compose -f "$ROOT/docker-compose.yml" up -d nginx

for domain in "${DOMAINS[@]}"; do
  echo "▶ Emitindo: $domain"
  docker compose -f "$ROOT/docker-compose.certbot.yml" run --rm certbot certonly \
    --webroot -w /var/www/certbot \
    --email "$EMAIL" --agree-tos --no-eff-email \
    -d "$domain"
done

# Reativa TLS
if [[ -f "$ROOT/conf.d/prod-citybox.conf.disabled" ]]; then
  mv "$ROOT/conf.d/prod-citybox.conf.disabled" "$ROOT/conf.d/prod-citybox.conf"
fi

docker compose -f "$ROOT/docker-compose.yml" -f "$ROOT/docker-compose.certbot.yml" exec nginx nginx -s reload 2>/dev/null \
  || docker compose -f "$ROOT/docker-compose.yml" restart nginx

echo ""
echo "✓ Certificados emitidos. Renovação automática: certbot-renew.sh (cron)"
