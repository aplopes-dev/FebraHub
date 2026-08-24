#!/usr/bin/env bash
# Aplica bindings topic → filas (idempotente via HTTP API).
set -euo pipefail
API="${RABBITMQ_API:-http://127.0.0.1:15672}"
USER="${RABBITMQ_USER:-citybox}"
PASS="${RABBITMQ_PASSWORD:-citybox}"
VHOST="${RABBITMQ_VHOST:-citybox}"

ensure_queue() {
  local queue="$1"
  curl -sf -u "$USER:$PASS" -X PUT \
    "$API/api/queues/$VHOST/$queue" \
    -H 'content-type: application/json' \
    -d '{"durable":true,"auto_delete":false,"arguments":{"x-dead-letter-exchange":"citybox.dlx"}}' >/dev/null \
    && echo "✓ queue $queue" \
    || echo "· queue $queue (já existe ou falhou)"
}

bind() {
  local queue="$1" rk="$2"
  curl -sf -u "$USER:$PASS" -X POST \
    "$API/api/bindings/$VHOST/e/citybox.events/q/$queue" \
    -H 'content-type: application/json' \
    -d "{\"routing_key\":\"$rk\",\"arguments\":{}}" >/dev/null \
    && echo "✓ bind $queue ← $rk" \
    || echo "· bind $queue ← $rk (já existe ou falhou)"
}

bind marketplace.projection 'citybox.order.#'
bind search.indexer 'citybox.catalog.#'
bind notifications 'citybox.order.#'
bind print.jobs 'citybox.print.#'
bind realtime.broadcast 'citybox.#'
ensure_queue food.store-setup
bind food.store-setup 'citybox.store.#'
ensure_queue clinic.store-setup
bind clinic.store-setup 'citybox.store.#'
ensure_queue clinic.whatsapp-send
bind clinic.whatsapp-send 'citybox.clinic.whatsapp.send.#'
ensure_queue clinic.whatsapp-session
bind clinic.whatsapp-session 'citybox.clinic.whatsapp.session.#'

# Vertical Comércio (erp-comercio-api). Estava faltando aqui: a fila era criada só quando
# o consumidor subia, então um ambiente novo perdia todo evento publicado antes disso.
ensure_queue erp-comercio.store-setup
bind erp-comercio.store-setup 'citybox.store.#'
ensure_queue imoveis.store-setup
bind imoveis.store-setup 'citybox.store.#'
ensure_queue beautiful.store-setup
bind beautiful.store-setup 'citybox.store.#'

# Callbacks de provisionamento: vertical-api → platform-api (PLAT-001 / Fase 2).
# Prefixo `citybox.provisioning.*` e não `citybox.store.*`: as filas food.store-setup e
# clinic.store-setup bindam 'citybox.store.#' e receberiam de volta o próprio callback.
ensure_queue platform.vertical-callbacks
bind platform.vertical-callbacks 'citybox.provisioning.#'
