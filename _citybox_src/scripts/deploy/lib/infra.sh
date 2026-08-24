#!/usr/bin/env bash
set -euo pipefail

_DEPLOY_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${_DEPLOY_LIB_DIR}/common.sh"

wait_postgres() {
  local host="${CITYBOX_DATABASE_HOST:-127.0.0.1}"
  local port="${CITYBOX_DATABASE_PORT:-15433}"
  log "Aguardando Postgres em ${host}:${port}..."
  for i in $(seq 1 60); do
    if docker exec aplopes_postgres pg_isready -U "${CITYBOX_DATABASE_USER:-aplopes}" -d postgres >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  die "Postgres não ficou healthy a tempo"
}

ensure_infra_volumes() {
  for vol in \
    aplopes_postgres_data \
    aplopes_redis_data \
    aplopes_rabbitmq_data \
    aplopes_typesense_data \
    aplopes_minio_data
  do
    docker volume create "${vol}" >/dev/null 2>&1 || true
  done
}

container_exists() {
  docker ps -a --format '{{.Names}}' | grep -qx "$1"
}

start_infra_service() {
  local service="$1"
  local container="$2"
  if container_exists "${container}"; then
    log "Container ${container} já existe — garantindo up"
    docker start "${container}" 2>/dev/null || true
    return 0
  fi
  docker compose up -d "${service}"
}

deploy_infra() {
  if [[ "${SKIP_INFRA}" == true ]]; then
    log "Pulando infra (--skip-infra)"
    return 0
  fi

  ensure_infra_volumes

  if [[ ! -f "${INFRA_DIR}/.env" ]]; then
    if [[ -f "${INFRA_DIR}/.env.example" ]]; then
      log "Copiando services/infra/.env.example → .env"
      cp "${INFRA_DIR}/.env.example" "${INFRA_DIR}/.env"
    fi
  fi

  log "Subindo infra (postgres citybox, redis, rabbitmq, typesense, minio)"
  (
    cd "${INFRA_DIR}"
    start_infra_service postgres aplopes_postgres
    start_infra_service redis aplopes_redis
    start_infra_service rabbitmq aplopes_rabbitmq
    start_infra_service typesense aplopes_typesense
    start_infra_service minio aplopes_minio
    if container_exists aplopes_minio; then
      docker compose up -d minio-init 2>/dev/null || true
    fi
  )

  wait_postgres
  ensure_rabbitmq_user
}

ensure_rabbitmq_user() {
  if ! container_exists aplopes_rabbitmq; then
    return 0
  fi
  log "Garantindo usuário RabbitMQ (definitions.json usa vhost citybox)"
  RABBITMQ_CONTAINER=aplopes_rabbitmq \
    RABBITMQ_USER="${RABBITMQ_USER:-citybox}" \
    RABBITMQ_PASSWORD="${RABBITMQ_PASSWORD:-citybox}" \
    RABBITMQ_VHOST="${RABBITMQ_VHOST:-citybox}" \
    bash "${ROOT}/infra/rabbitmq/scripts/ensure-user.sh"
}
