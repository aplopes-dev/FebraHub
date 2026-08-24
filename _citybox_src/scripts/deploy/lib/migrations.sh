#!/usr/bin/env bash
set -euo pipefail

_DEPLOY_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${_DEPLOY_LIB_DIR}/common.sh"
# shellcheck source=seeds.sh
source "${_DEPLOY_LIB_DIR}/seeds.sh"

ensure_workspace_installed() {
  log "Garantindo dependências do monorepo (pnpm install)"
  (
    cd "${ROOT}"
    pnpm install
  )
}

run_migrate_deploy() {
  local filter="$1"
  local database_url="$2"
  log "Migrations ${filter} → ${database_url##*@}"
  (
    cd "${ROOT}"
    DATABASE_URL="${database_url}" pnpm --filter "${filter}" run db:migrate:deploy
  )
}

has_clinica_migrations() {
  local migrations_dir="${ROOT}/apps/verticals/clinica/api/prisma/migrations"
  find "${migrations_dir}" -maxdepth 1 -type d -name '20*' 2>/dev/null | grep -q .
}

deploy_migrations() {
  if [[ "${SKIP_MIGRATIONS}" == true ]]; then
    log "Pulando migrations (--skip-migrations)"
    return 0
  fi

  ensure_workspace_installed

  bash "${DEPLOY_LIB_DIR}/provision-citybox-db.sh"

  run_migrate_deploy "@citybox/admin-api" "${PLATFORM_DATABASE_URL}"
  run_migrate_deploy "@citybox/erp-api" "${ERP_DATABASE_URL}"

  if has_clinica_migrations; then
    run_migrate_deploy "@citybox/clinica-api" "${CLINICA_DATABASE_URL}"
  else
    log "Clínica: sem migrations SQL — pulando migrate deploy"
  fi

  run_migrate_deploy "@citybox/imoveis-api" "${IMOVEIS_DATABASE_URL}"
  run_migrate_deploy "@citybox/beautiful-api" "${BEAUTIFUL_DATABASE_URL}"
  run_migrate_deploy "@citybox/fiscal-api" "${FISCAL_DATABASE_URL}"

  deploy_seeds
}

# Só schema `erp` — para deploy parcial do ERP (não toca platform/clinica/imoveis/seeds).
deploy_erp_migrations() {
  if [[ "${SKIP_MIGRATIONS}" == true ]]; then
    log "Pulando migrations (--skip-migrations)"
    return 0
  fi

  ensure_workspace_installed

  run_migrate_deploy "@citybox/erp-api" "${ERP_DATABASE_URL}"
}

# Só schema `clinica` — para deploy parcial da vertical (não toca platform/imoveis/seeds).
deploy_clinic_migrations() {
  if [[ "${SKIP_MIGRATIONS}" == true ]]; then
    log "Pulando migrations (--skip-migrations)"
    return 0
  fi

  ensure_workspace_installed

  if has_clinica_migrations; then
    run_migrate_deploy "@citybox/clinica-api" "${CLINICA_DATABASE_URL}"
  else
    log "Clínica: sem migrations SQL — pulando migrate deploy"
  fi
}

# Só schema `imoveis` — para deploy parcial da vertical (não toca platform/clinica/seeds).
deploy_imoveis_migrations() {
  if [[ "${SKIP_MIGRATIONS}" == true ]]; then
    log "Pulando migrations (--skip-migrations)"
    return 0
  fi

  ensure_workspace_installed

  run_migrate_deploy "@citybox/imoveis-api" "${IMOVEIS_DATABASE_URL}"
}
