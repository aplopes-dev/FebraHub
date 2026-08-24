#!/usr/bin/env bash
# Habilita pgvector em todos os databases de aplicação (volume já existente).
set -euo pipefail

CONTAINER="${POSTGRES_CONTAINER:-citybox_postgres}"
PG_USER="${POSTGRES_USER:-citybox}"

databases="$(docker exec "$CONTAINER" psql -U "$PG_USER" -d postgres -tAc \
  "SELECT datname FROM pg_database WHERE datistemplate = false AND datname <> 'postgres' ORDER BY 1")"

if [[ -z "${databases// }" ]]; then
  echo "Nenhum database de aplicação encontrado em ${CONTAINER}."
  exit 0
fi

while IFS= read -r db; do
  [[ -z "$db" ]] && continue
  echo "▶ CREATE EXTENSION vector em ${db}..."
  docker exec "$CONTAINER" psql -U "$PG_USER" -d "$db" -v ON_ERROR_STOP=1 -c \
    'CREATE EXTENSION IF NOT EXISTS "vector";'
done <<< "$databases"

echo "✓ pgvector habilitado em todos os databases de aplicação"
