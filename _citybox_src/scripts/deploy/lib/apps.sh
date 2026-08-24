#!/usr/bin/env bash
set -euo pipefail

_DEPLOY_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${_DEPLOY_LIB_DIR}/common.sh"

deploy_keycloak() {
  log "Build imagem Keycloak (tema citybox)"
  (
    cd "${KEYCLOAK_DIR}"
    docker compose -f docker-compose.yml -f docker-compose.prod.yml build keycloak
    docker rm -f aplopes_keycloak citybox_keycloak 2>/dev/null || true
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate keycloak
  )

  log "Aguardando Keycloak healthy"
  local kc_url="${KEYCLOAK_URL:-http://127.0.0.1:8080}"
  for i in $(seq 1 36); do
    if curl -sf "${kc_url}/realms/master" >/dev/null 2>&1; then
      break
    fi
    if [[ "$i" -eq 36 ]]; then
      docker logs aplopes_keycloak --tail 40 2>&1 || true
      die "Keycloak não respondeu a tempo"
    fi
    sleep 5
  done

  KEYCLOAK_URL="${KEYCLOAK_URL:-http://127.0.0.1:8080}" \
    bash "${KEYCLOAK_DIR}/scripts/sync-realm.sh"
}

deploy_erp() {
  local compose_args
  compose_args="$(compose_env_file_args)"

  log "Deploy ERP (erp-api :3114 + erp-web :3107)"
  if [[ "${SKIP_BUILD}" != true ]]; then
    prepare_build_env
    docker_compose_build "${PLATFORM_DIR}" erp-api erp-web
  fi
  (
    cd "${PLATFORM_DIR}"
    # Legado: backoffice/platform_web ocupavam :3107/:3108 antes do rename erp-web/admin-web
    docker rm -f aplopes_erp_api aplopes_erp_web aplopes_backoffice 2>/dev/null || true
    # shellcheck disable=SC2086
    docker compose ${compose_args} up -d --remove-orphans erp-api erp-web
  )
}

deploy_admin_apps() {
  local compose_args
  compose_args="$(compose_env_file_args)"

  log "Deploy admin-api, admin-web, erp-api, erp-web, fiscal-api"
  if [[ "${SKIP_BUILD}" != true ]]; then
    prepare_build_env
    docker_compose_build "${PLATFORM_DIR}" admin-api admin-web erp-api erp-web fiscal-api
  fi
  (
    cd "${PLATFORM_DIR}"
    # Remove nomes novos + legado (platform_api :3103, platform_web :3108, backoffice :3107)
    docker rm -f \
      aplopes_platform_infra_wait \
      aplopes_admin_api aplopes_admin_web \
      aplopes_erp_api aplopes_erp_web \
      aplopes_fiscal_api \
      aplopes_platform_api aplopes_platform_web aplopes_backoffice \
      2>/dev/null || true
    # shellcheck disable=SC2086
    docker compose ${compose_args} up -d --remove-orphans admin-api admin-web erp-api erp-web fiscal-api
  )
}

deploy_clinica_api() {
  local compose_args
  compose_args="$(compose_env_file_args)"

  log "Deploy clinica-api (+ worker store-setup) + clinica-web (:3113)"
  if [[ "${SKIP_BUILD}" != true ]]; then
    prepare_build_env
    docker_compose_build "${CLINICA_INFRA_DIR}" api web
  fi
  (
    cd "${CLINICA_INFRA_DIR}"
    docker rm -f clinica_api clinica_api_worker clinica_web 2>/dev/null || true
    # shellcheck disable=SC2086
    docker compose ${compose_args} up -d api worker web
  )
}

deploy_imoveis() {
  local compose_args
  compose_args="$(compose_env_file_args)"

  log "Deploy imoveis-api (:3112) + imoveis-web (:3111)"
  if [[ "${SKIP_BUILD}" != true ]]; then
    prepare_build_env
    docker_compose_build "${IMOVEIS_INFRA_DIR}" api web
  fi
  (
    cd "${IMOVEIS_INFRA_DIR}"
    docker rm -f imoveis_api imoveis_web 2>/dev/null || true
    # shellcheck disable=SC2086
    docker compose ${compose_args} up -d api web
  )
}

# Remove containers legados food/varejo (fora do catálogo de produção).
stop_legacy_vertical_containers() {
  log "Parando containers legados food/varejo (se existirem)"
  docker rm -f food_api food_api_worker varejo_api 2>/dev/null || true
}

deploy_apps() {
  deploy_keycloak
  deploy_admin_apps
  deploy_clinica_api
  deploy_imoveis
  stop_legacy_vertical_containers
}
