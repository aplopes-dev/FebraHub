#!/usr/bin/env bash
# Deploy parcial — admin (api+web) + clínica (api+worker+web) + imóveis (api+web).
# Não toca erp, keycloak nem infra. Pré-requisito: infra já rodando.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"
# shellcheck source=lib/migrations.sh
source "${SCRIPT_DIR}/lib/migrations.sh"
# shellcheck source=lib/apps.sh
source "${SCRIPT_DIR}/lib/apps.sh"
# shellcheck source=lib/health.sh
source "${SCRIPT_DIR}/lib/health.sh"

DEPLOY_ADMIN=true
DEPLOY_CLINICA=true
DEPLOY_IMOVEIS=true

parse_imoveis_admin_clinica_args() {
  for arg in "$@"; do
    case "$arg" in
      --skip-migrations) SKIP_MIGRATIONS=true ;;
      --skip-build) SKIP_BUILD=true ;;
      --no-cache) BUILD_NO_CACHE=true ;;
      --admin-only)
        DEPLOY_ADMIN=true
        DEPLOY_CLINICA=false
        DEPLOY_IMOVEIS=false
        ;;
      --clinica-only)
        DEPLOY_ADMIN=false
        DEPLOY_CLINICA=true
        DEPLOY_IMOVEIS=false
        ;;
      --imoveis-only)
        DEPLOY_ADMIN=false
        DEPLOY_CLINICA=false
        DEPLOY_IMOVEIS=true
        ;;
      --api-only)
        # Só APIs — não redefine os * -only já escolhidos
        _API_ONLY=true
        ;;
      --web-only)
        # Só webs — não redefine os * -only já escolhidos
        _WEB_ONLY=true
        ;;
      --)
        ;;
      -h|--help)
        cat <<'EOF'
Uso: pnpm run deploy:prod:imoveis-admin-clinica [-- <flags>]

  Deploy parcial: admin-api+web + clinica-api+worker+web + imoveis-api+web.
  Não reconstrói erp, keycloak nem infra.

  (padrão)           todos os 6 serviços
  --admin-only       só admin-api + admin-web
  --clinica-only     só clinica-api + worker + clinica-web
  --imoveis-only     só imoveis-api + imoveis-web
  --api-only         só as 3 APIs (sem webs)
  --web-only         só os 3 webs (sem APIs; sem migrations)
  --skip-migrations  não roda prisma migrate deploy
  --skip-build       só recria containers (sem docker build)
  --no-cache         docker build --no-cache

Pré-requisito: rede/infra já no ar (pnpm run deploy:prod ou postgres/redis/rabbitmq + MinIO rodando).
EOF
        exit 0
        ;;
      *)
        die "Argumento desconhecido: ${arg} (use --help)"
        ;;
    esac
  done
}

_API_ONLY=false
_WEB_ONLY=false

assert_prereqs() {
  if ! docker network inspect aplopes-platform >/dev/null 2>&1; then
    die "Rede Docker aplopes-platform ausente. Rode um deploy completo antes (pnpm run deploy:prod)."
  fi
  if ! docker ps --format '{{.Names}}' | grep -qx aplopes_postgres; then
    die "Container aplopes_postgres não está rodando. Suba a infra antes."
  fi
}

parse_imoveis_admin_clinica_args "$@"

log "[1/4] Preflight"
preflight
assert_prereqs

log "[2/4] Migrations"
if [[ "${_WEB_ONLY}" == true ]]; then
  log "Pulando migrations (--web-only)"
else
  if [[ "${DEPLOY_ADMIN}" == true ]]; then
    log "Migrations admin (schema platform)"
    run_migrate_deploy "@citybox/admin-api" "${PLATFORM_DATABASE_URL}"
  fi
  if [[ "${DEPLOY_CLINICA}" == true ]]; then
    deploy_clinic_migrations
  fi
  if [[ "${DEPLOY_IMOVEIS}" == true ]]; then
    deploy_imoveis_migrations
  fi
fi

log "[3/4] Apps"

# ADMIN
if [[ "${DEPLOY_ADMIN}" == true ]]; then
  if [[ "${_API_ONLY}" == true ]]; then
    compose_args="$(compose_env_file_args)"
    if [[ "${SKIP_BUILD}" != true ]]; then
      prepare_build_env
      docker_compose_build "${PLATFORM_DIR}" admin-api
    fi
    (
      cd "${PLATFORM_DIR}"
      docker rm -f aplopes_admin_api 2>/dev/null || true
      # shellcheck disable=SC2086
      docker compose ${compose_args} up -d admin-api
    )
  elif [[ "${_WEB_ONLY}" == true ]]; then
    compose_args="$(compose_env_file_args)"
    if [[ "${SKIP_BUILD}" != true ]]; then
      prepare_build_env
      docker_compose_build "${PLATFORM_DIR}" admin-web
    fi
    (
      cd "${PLATFORM_DIR}"
      docker rm -f aplopes_admin_web 2>/dev/null || true
      # shellcheck disable=SC2086
      docker compose ${compose_args} up -d admin-web
    )
  else
    compose_args="$(compose_env_file_args)"
    if [[ "${SKIP_BUILD}" != true ]]; then
      prepare_build_env
      docker_compose_build "${PLATFORM_DIR}" admin-api admin-web
    fi
    (
      cd "${PLATFORM_DIR}"
      docker rm -f aplopes_admin_api aplopes_admin_web \
        aplopes_platform_api aplopes_platform_web 2>/dev/null || true
      # shellcheck disable=SC2086
      docker compose ${compose_args} up -d --remove-orphans admin-api admin-web
    )
  fi
fi

# CLINICA
if [[ "${DEPLOY_CLINICA}" == true ]]; then
  compose_args="$(compose_env_file_args)"
  if [[ "${_API_ONLY}" == true ]]; then
    if [[ "${SKIP_BUILD}" != true ]]; then
      prepare_build_env
      docker_compose_build "${CLINICA_INFRA_DIR}" api
    fi
    (
      cd "${CLINICA_INFRA_DIR}"
      docker rm -f clinica_api clinica_api_worker 2>/dev/null || true
      # shellcheck disable=SC2086
      docker compose ${compose_args} up -d api worker
    )
  elif [[ "${_WEB_ONLY}" == true ]]; then
    if [[ "${SKIP_BUILD}" != true ]]; then
      prepare_build_env
      docker_compose_build "${CLINICA_INFRA_DIR}" web
    fi
    (
      cd "${CLINICA_INFRA_DIR}"
      docker rm -f clinica_web 2>/dev/null || true
      # shellcheck disable=SC2086
      docker compose ${compose_args} up -d web
    )
  else
    deploy_clinica_api
  fi
fi

# IMOVEIS
if [[ "${DEPLOY_IMOVEIS}" == true ]]; then
  compose_args="$(compose_env_file_args)"
  if [[ "${_API_ONLY}" == true ]]; then
    if [[ "${SKIP_BUILD}" != true ]]; then
      prepare_build_env
      docker_compose_build "${IMOVEIS_INFRA_DIR}" api
    fi
    (
      cd "${IMOVEIS_INFRA_DIR}"
      docker rm -f imoveis_api 2>/dev/null || true
      # shellcheck disable=SC2086
      docker compose ${compose_args} up -d api
    )
  elif [[ "${_WEB_ONLY}" == true ]]; then
    if [[ "${SKIP_BUILD}" != true ]]; then
      prepare_build_env
      docker_compose_build "${IMOVEIS_INFRA_DIR}" web
    fi
    (
      cd "${IMOVEIS_INFRA_DIR}"
      docker rm -f imoveis_web 2>/dev/null || true
      # shellcheck disable=SC2086
      docker compose ${compose_args} up -d web
    )
  else
    deploy_imoveis
  fi
fi

log "[4/4] Health checks"
run_imoveis_admin_clinica_health_checks

echo "✓ Deploy parcial concluído (admin=${DEPLOY_ADMIN} clinica=${DEPLOY_CLINICA} imoveis=${DEPLOY_IMOVEIS})"
