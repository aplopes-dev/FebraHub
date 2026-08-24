#!/usr/bin/env bash
# Deploy parcial — vertical Clínica (API + worker) + ERP/backoffice.
# Não sobe Keycloak, admin-api/web, imóveis nem infra. Pré-requisito: infra já rodando.
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

DEPLOY_CLINICA_API=true
DEPLOY_CLINICA_WEB=true
DEPLOY_ERP=true

parse_clinic_deploy_args() {
  for arg in "$@"; do
    case "$arg" in
      --skip-migrations) SKIP_MIGRATIONS=true ;;
      --skip-build) SKIP_BUILD=true ;;
      --no-cache) BUILD_NO_CACHE=true ;;
      --api-only)
        DEPLOY_CLINICA_API=true
        DEPLOY_CLINICA_WEB=false
        DEPLOY_ERP=false
        ;;
      --web-only)
        DEPLOY_CLINICA_API=false
        DEPLOY_CLINICA_WEB=true
        DEPLOY_ERP=false
        ;;
      --erp-only)
        DEPLOY_CLINICA_API=false
        DEPLOY_CLINICA_WEB=false
        DEPLOY_ERP=true
        ;;
      --)
        ;;
      -h|--help)
        cat <<'EOF'
Uso: pnpm run deploy:prod:clinic [-- --api-only|--web-only|--erp-only] [-- --skip-migrations] [-- --skip-build] [-- --no-cache]

  Deploy parcial da vertical Clínica + ERP (backoffice).
  Não reconstrói Keycloak, admin-api, admin-web, imóveis nem sobe infra.

  (padrão)           clinica-api + worker + clinica-web (:3113) + erp-api + erp-web
  --api-only         só clinica-api + worker
  --web-only         só clinica-web (frontend clinica.aplopes.com)
  --erp-only         só erp-api + erp-web (backoffice de Comércio)
  --skip-migrations  não roda prisma migrate deploy do schema clinica
  --skip-build       só recria containers (sem docker build)
  --no-cache         docker build --no-cache

Pré-requisito: rede/infra já no ar (ex.: após um `pnpm run deploy:prod` completo
ou postgres/redis/rabbitmq + admin-api rodando).
EOF
        exit 0
        ;;
      *)
        die "Argumento desconhecido: ${arg} (use --help)"
        ;;
    esac
  done
}

assert_clinic_prereqs() {
  if ! docker network inspect aplopes-platform >/dev/null 2>&1; then
    die "Rede Docker aplopes-platform ausente. Rode um deploy completo antes (pnpm run deploy:prod)."
  fi
  if ! docker ps --format '{{.Names}}' | grep -qx aplopes_postgres; then
    die "Container aplopes_postgres não está rodando. Suba a infra antes."
  fi
}

run_partial_clinic_health_checks() {
  log "Health checks (clínica parcial)"
  local failed=0

  if [[ "${DEPLOY_CLINICA_API}" == true ]]; then
    wait_http "clinica-api" "http://127.0.0.1:3172/api/health" "200" 24 || true
    check_http "clinica-api" "http://127.0.0.1:3172/api/health" "200" || failed=1
    if docker ps --format '{{.Names}}' | grep -qx clinica_api_worker; then
      echo "  ✓ clinica-api-worker → running"
    else
      echo "  ✗ clinica-api-worker → container não está rodando" >&2
      failed=1
    fi
  fi

  if [[ "${DEPLOY_CLINICA_WEB}" == true ]]; then
    wait_http "clinica-web" "http://127.0.0.1:3113/login" "200" 36 || true
    check_http "clinica-web" "http://127.0.0.1:3113/login" "200" || failed=1
    check_http "clinica-web HTTPS" "${CLINICA_ORIGIN:-https://clinica.aplopes.com}/login" "200" || failed=1
  fi

  if [[ "${DEPLOY_ERP}" == true ]]; then
    check_http "erp-web (ERP)" "http://127.0.0.1:3107/login" "200" || failed=1
    check_http "erp-web HTTPS" "${BACKOFFICE_ORIGIN:-https://backoffice.aplopes.com}/login" "200" || failed=1
  fi

  if [[ "${failed}" -ne 0 ]]; then
    die "Um ou mais health checks da clínica falharam"
  fi

  log "Health checks da clínica passaram"
}

parse_clinic_deploy_args "$@"

log "[1/4] Preflight (clínica)"
preflight
assert_clinic_prereqs

log "[2/4] Migrations schema clinica"
if [[ "${DEPLOY_CLINICA_API}" == true ]]; then
  deploy_clinic_migrations
else
  log "Pulando migrations (api não está no escopo deste deploy)"
fi

log "[3/4] Apps clínica"
if [[ "${DEPLOY_CLINICA_API}" == true && "${DEPLOY_CLINICA_WEB}" == true ]]; then
  deploy_clinica_api
elif [[ "${DEPLOY_CLINICA_API}" == true ]]; then
  # api-only: sobe api+worker sem rebuild do web
  SKIP_BUILD_ORIG="${SKIP_BUILD}"
  compose_args="$(compose_env_file_args)"
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
  SKIP_BUILD="${SKIP_BUILD_ORIG}"
elif [[ "${DEPLOY_CLINICA_WEB}" == true ]]; then
  compose_args="$(compose_env_file_args)"
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
fi
if [[ "${DEPLOY_ERP}" == true ]]; then
  deploy_erp
fi

log "[4/4] Health checks"
run_partial_clinic_health_checks

echo "✓ Deploy parcial clínica concluído (api=${DEPLOY_CLINICA_API} web=${DEPLOY_CLINICA_WEB} erp=${DEPLOY_ERP})"
