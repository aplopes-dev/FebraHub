#!/usr/bin/env bash
# Deploy único aplopes.com — infra + migrations + Keycloak + admin + ERP + clínica + imóveis.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"
# shellcheck source=lib/infra.sh
source "${SCRIPT_DIR}/lib/infra.sh"
# shellcheck source=lib/migrations.sh
source "${SCRIPT_DIR}/lib/migrations.sh"
# shellcheck source=lib/apps.sh
source "${SCRIPT_DIR}/lib/apps.sh"
# shellcheck source=lib/health.sh
source "${SCRIPT_DIR}/lib/health.sh"

parse_deploy_args "$@"

log "[1/5] Preflight"
preflight

log "[2/5] Infra"
deploy_infra

log "[3/5] Provision + migrations + seeds (citybox)"
deploy_migrations

log "[4/5] Keycloak + apps (admin, erp, clinica, imoveis)"
deploy_apps

log "[5/5] Health checks"
run_health_checks

echo "✓ Deploy aplopes concluído (database: ${CITYBOX_DATABASE_NAME:-citybox})"
