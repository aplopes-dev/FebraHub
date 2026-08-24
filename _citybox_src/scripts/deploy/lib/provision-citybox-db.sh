#!/usr/bin/env bash
# Provisiona database citybox (único) com extensões e citybox_uuid_v7().
set -euo pipefail

_DEPLOY_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${_DEPLOY_LIB_DIR}/common.sh"

DB_NAME="${CITYBOX_DATABASE_NAME:-citybox}"
CONTAINER="${POSTGRES_CONTAINER:-aplopes_postgres}"
PG_USER="${CITYBOX_DATABASE_USER:-aplopes}"

log "Provisionando database ${DB_NAME} em ${CONTAINER}..."

if ! docker inspect "${CONTAINER}" >/dev/null 2>&1; then
  die "Container ${CONTAINER} não encontrado. Suba a infra primeiro."
fi

docker exec "${CONTAINER}" psql -U "${PG_USER}" -d postgres -v ON_ERROR_STOP=1 -tAc \
  "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
  docker exec "${CONTAINER}" psql -U "${PG_USER}" -d postgres -v ON_ERROR_STOP=1 -c \
  "CREATE DATABASE \"${DB_NAME}\";"

docker exec "${CONTAINER}" psql -U "${PG_USER}" -d postgres -v ON_ERROR_STOP=1 -c \
  "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'citybox_readonly') THEN CREATE ROLE citybox_readonly WITH LOGIN PASSWORD 'citybox_readonly'; END IF; END \$\$;"

docker exec "${CONTAINER}" psql -U "${PG_USER}" -d postgres -v ON_ERROR_STOP=1 -c \
  "GRANT CONNECT ON DATABASE \"${DB_NAME}\" TO citybox_readonly;"

for sql_file in \
  "${ROOT}/infra/postgres/init/01-extensions.sql" \
  "${ROOT}/infra/postgres/init/02-citybox-uuid-v7.sql"
do
  if [[ -f "${sql_file}" ]]; then
    docker exec -i "${CONTAINER}" psql -U "${PG_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 \
      < "${sql_file}"
  fi
done

docker exec "${CONTAINER}" psql -U "${PG_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -c \
  "GRANT USAGE ON SCHEMA public TO citybox_readonly; GRANT SELECT ON ALL TABLES IN SCHEMA public TO citybox_readonly; GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO citybox_readonly; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO citybox_readonly;"

# Schemas Prisma por app (Prisma migrate não cria o schema se só existir no ?schema=)
docker exec "${CONTAINER}" psql -U "${PG_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -c \
  "CREATE SCHEMA IF NOT EXISTS platform; CREATE SCHEMA IF NOT EXISTS clinica; CREATE SCHEMA IF NOT EXISTS erp; CREATE SCHEMA IF NOT EXISTS imoveis; CREATE SCHEMA IF NOT EXISTS beautiful; CREATE SCHEMA IF NOT EXISTS fiscal;"

log "Database ${DB_NAME} pronto (extensões + citybox_uuid_v7)"
