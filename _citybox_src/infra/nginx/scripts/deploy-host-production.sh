#!/usr/bin/env bash
# Instala vhosts da plataforma no nginx do host + emite certs faltantes.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST_DIR="$ROOT/host"
EMAIL="${CERTBOT_EMAIL:-admin@citybox.com}"
DOMAINS=(
  api.citybox.com
  app.citybox.com
  admin.citybox.com
  ws.citybox.com
  auth.citybox.com
  backoffice.citybox.com
)

echo "▶ Removendo flow-atendimento-ia (conflito api/app)"
rm -f /etc/nginx/sites-enabled/flow-atendimento-ia
echo "  · sites-enabled/flow-atendimento-ia removido"

echo "▶ Snippet CORS core-api"
mkdir -p /etc/nginx/snippets
cp "$ROOT/snippets/cors-platform-api.conf" /etc/nginx/snippets/citybox-cors-platform-api.conf

echo "▶ Copiando configs → /etc/nginx/sites-available/"
for f in "$HOST_DIR"/*.conf; do
  base=$(basename "$f")
  cp "$f" "/etc/nginx/sites-available/$base"
  echo "  · $base"
done

mkdir -p /var/www/certbot

# Bootstrap HTTP-only para emitir certs antes do bloco SSL
bootstrap() {
  local domain=$1
  local f="/etc/nginx/sites-available/${domain}-acme-bootstrap.conf"
  cat > "$f" <<EOF
server {
    listen 80;
    server_name ${domain};
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 200 'acme bootstrap\n'; add_header Content-Type text/plain; }
}
EOF
  ln -sf "$f" "/etc/nginx/sites-enabled/${domain}-acme-bootstrap.conf"
}

dns_ok() {
  dig +short "$1" A @8.8.8.8 | grep -q . \
    || dig +short "$1" A @1.1.1.1 | grep -q . \
    || dig +short "$1" A | grep -q .
}

for domain in "${DOMAINS[@]}"; do
  if ! dns_ok "$domain"; then
    echo "⚠ DNS ausente: $domain — HTTP-only (sem cert)"
    continue
  fi
  if certbot certificates 2>/dev/null | grep -q "Certificate Name: $domain"; then
    echo "  · cert OK: $domain"
  else
    echo "▶ Bootstrap ACME: $domain"
    bootstrap "$domain"
  fi
done

nginx -t
systemctl reload nginx

for domain in "${DOMAINS[@]}"; do
  if dns_ok "$domain" \
    && ! certbot certificates 2>/dev/null | grep -q "Certificate Name: $domain"; then
    echo "▶ Certbot: $domain"
    certbot certonly --webroot -w /var/www/certbot \
      --email "$EMAIL" --agree-tos --no-eff-email \
      -d "$domain" --non-interactive
    rm -f "/etc/nginx/sites-enabled/${domain}-acme-bootstrap.conf"
  fi
done

echo "▶ Ativando vhosts da plataforma"
for domain in "${DOMAINS[@]}"; do
  rm -f "/etc/nginx/sites-enabled/${domain}-acme-bootstrap.conf"
  ln -sf "/etc/nginx/sites-available/${domain}.conf" "/etc/nginx/sites-enabled/${domain}.conf"
  if certbot certificates 2>/dev/null | grep -q "Certificate Name: $domain"; then
    if [ -f "$HOST_DIR/${domain}.ssl.conf" ]; then
      cp "$HOST_DIR/${domain}.ssl.conf" "/etc/nginx/sites-available/${domain}.ssl.conf"
      ln -sf "/etc/nginx/sites-available/${domain}.ssl.conf" "/etc/nginx/sites-enabled/${domain}.ssl.conf"
      echo "  · SSL ativo: $domain"
    fi
  else
    rm -f "/etc/nginx/sites-enabled/${domain}.ssl.conf"
  fi
done

nginx -t
systemctl reload nginx
echo "✓ Nginx recarregado — api/app/admin/ws/auth/backoffice.citybox.com"
