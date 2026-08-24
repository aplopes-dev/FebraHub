#!/usr/bin/env bash
# Garante usuário citybox no broker (definitions.json não inclui users).
set -euo pipefail
CONTAINER="${RABBITMQ_CONTAINER:-citybox_rabbitmq}"
USER="${RABBITMQ_USER:-citybox}"
PASS="${RABBITMQ_PASSWORD:-citybox}"
VHOST="${RABBITMQ_VHOST:-citybox}"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "Container $CONTAINER não está rodando — pulando ensure-user"
  exit 0
fi

if docker exec "$CONTAINER" rabbitmqctl list_users -q 2>/dev/null | grep -q "^${USER}\b"; then
  # Usuário pode ter vindo do definitions.json com senha antiga — sincroniza com o env
  docker exec "$CONTAINER" rabbitmqctl change_password "$USER" "$PASS"
  echo "✓ RabbitMQ user $USER já existe — senha sincronizada"
else
  docker exec "$CONTAINER" rabbitmqctl add_user "$USER" "$PASS"
  echo "✓ RabbitMQ user $USER criado"
fi

docker exec "$CONTAINER" rabbitmqctl set_permissions -p "$VHOST" "$USER" ".*" ".*" ".*"
docker exec "$CONTAINER" rabbitmqctl set_user_tags "$USER" administrator >/dev/null
