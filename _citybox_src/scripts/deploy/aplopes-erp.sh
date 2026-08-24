#!/usr/bin/env bash
# Deploy parcial — ERP (erp-api :3114 + erp-web :3107, backoffice de Comércio).
# Não sobe Keycloak, admin-api/web, clínica, imóveis nem infra. Pré-requisito: infra já rodando.
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

parse_erp_deploy_args() {
  for arg in "$@"; do
    case "$arg" in
      --skip-migrations) SKIP_MIGRATIONS=true ;;
      --skip-build) SKIP_BUILD=true ;;
      --no-cache) BUILD_NO_CACHE=true ;;
      --)
        ;;
      -h|--help)
        cat <<'EOF'
Uso: pnpm run deploy:prod:erp [-- --skip-migrations] [-- --skip-build] [-- --no-cache]

  Deploy parcial do ERP (backoffice de Comércio: erp-api :3114 + erp-web :3107).
  Não reconstrói Keycloak, admin-api, admin-web, clínica nem imóveis, nem sobe infra.

  --skip-migrations  não roda prisma migrate deploy do schema erp
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

assert_erp_prereqs() {
  if ! docker network inspect aplopes-platform >/dev/null 2>&1; then
    die "Rede Docker aplopes-platform ausente. Rode um deploy completo antes (pnpm run deploy:prod)."
  fi
  if ! docker ps --format '{{.Names}}' | grep -qx aplopes_postgres; then
    die "Container aplopes_postgres não está rodando. Suba a infra antes."
  fi
}

run_partial_erp_health_checks() {
  log "Health checks (ERP parcial)"
  local failed=0

  check_http "erp-api" "http://127.0.0.1:3114/api/health" "200" || failed=1
  wait_http "erp-web" "http://127.0.0.1:3107/login" "200" 36 || true
  check_http "erp-web" "http://127.0.0.1:3107/login" "200" || failed=1
  check_http "erp-web HTTPS" "${BACKOFFICE_ORIGIN:-https://backoffice.aplopes.com}/login" "200" || failed=1

  if [[ "${failed}" -ne 0 ]]; then
    die "Um ou mais health checks do ERP falharam"
  fi

  log "Health checks do ERP passaram"
}

parse_erp_deploy_args "$@"

log "[1/4] Preflight (ERP)"
preflight
assert_erp_prereqs

log "[2/4] Migrations schema erp"
deploy_erp_migrations

log "[3/4] Apps ERP"
deploy_erp

log "[4/4] Health checks"
run_partial_erp_health_checks

echo "✓ Deploy parcial ERP concluído"
