#!/usr/bin/env bash
set -euo pipefail

_DEPLOY_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${_DEPLOY_LIB_DIR}/common.sh"

package_has_seed() {
  local pkg_dir="$1"
  [[ -f "${pkg_dir}/prisma/seed.ts" ]] || [[ -f "${pkg_dir}/prisma/seed.js" ]]
}

package_has_db_seed_script() {
  local pkg_dir="$1"
  grep -q '"db:seed"' "${pkg_dir}/package.json" 2>/dev/null
}

ensure_prisma_client_generated() {
  local filter="$1"
  local pkg_dir="$2"
  local database_url="$3"

  if [[ ! -f "${pkg_dir}/prisma/schema.prisma" ]]; then
    return 0
  fi

  # Após migrations o schema muda; pasta generated pode estar stale ou incompleta
  # (ex.: só models/ sem client.ts — prisma generate falha com "doesn't look like a generated Prisma Client").
  if [[ -d "${pkg_dir}/generated/prisma" ]]; then
    if [[ ! -f "${pkg_dir}/generated/prisma/client.ts" ]]; then
      log "${filter}: generated/prisma incompleto — removendo para regenerar"
    fi
    rm -rf "${pkg_dir}/generated/prisma"
  fi

  DATABASE_URL="${database_url}" pnpm --filter "${filter}" run db:generate
}

run_seed_deploy() {
  local filter="$1"
  local pkg_rel="$2"
  local database_url="$3"
  local pkg_dir="${ROOT}/${pkg_rel}"

  if ! package_has_seed "${pkg_dir}"; then
    log "${filter}: sem prisma/seed — pulando"
    return 0
  fi

  log "Seed ${filter} → ${database_url##*@}"

  (
    cd "${ROOT}"
    ensure_prisma_client_generated "${filter}" "${pkg_dir}" "${database_url}"

    if package_has_db_seed_script "${pkg_dir}"; then
      DATABASE_URL="${database_url}" pnpm --filter "${filter}" run db:seed
    elif [[ -f "${pkg_dir}/prisma.config.ts" ]] && grep -qE 'seed:' "${pkg_dir}/prisma.config.ts"; then
      DATABASE_URL="${database_url}" pnpm --filter "${filter}" exec prisma db seed --config prisma.config.ts
    else
      die "${filter}: prisma/seed encontrado, mas sem script db:seed nem seed em prisma.config.ts"
    fi
  )
}

deploy_seeds() {
  if [[ "${SKIP_MIGRATIONS}" == true ]]; then
    log "Pulando seeds (--skip-migrations)"
    return 0
  fi

  run_seed_deploy "@citybox/admin-api" "apps/admin/api" "${PLATFORM_DATABASE_URL}"
  run_seed_deploy "@citybox/clinica-api" "apps/verticals/clinica/api" "${CLINICA_DATABASE_URL}"
}
