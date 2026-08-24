#!/usr/bin/env bash
# Provisiona database tenant (single-tenant dev) no Postgres compartilhado.
set -euo pipefail

DB_NAME="${1:-ilheus_dev}"
CONTAINER="${POSTGRES_CONTAINER:-citybox_postgres}"
PG_USER="${POSTGRES_USER:-citybox}"

echo "▶ Criando database tenant ${DB_NAME} em ${CONTAINER}..."

docker exec "$CONTAINER" psql -U "$PG_USER" -d postgres -v ON_ERROR_STOP=1 -c \
  "SELECT 'exists' FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q exists || \
  docker exec "$CONTAINER" psql -U "$PG_USER" -d postgres -v ON_ERROR_STOP=1 -c \
  "CREATE DATABASE \"${DB_NAME}\";"

docker exec "$CONTAINER" psql -U "$PG_USER" -d postgres -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'citybox_readonly') THEN
    CREATE ROLE citybox_readonly WITH LOGIN PASSWORD 'citybox_readonly';
  END IF;
END
$$;
SQL

docker exec "$CONTAINER" psql -U "$PG_USER" -d postgres -v ON_ERROR_STOP=1 -c \
  "GRANT CONNECT ON DATABASE \"${DB_NAME}\" TO citybox_readonly;"

docker exec "$CONTAINER" psql -U "$PG_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 <<'SQL'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";
GRANT USAGE ON SCHEMA public TO citybox_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO citybox_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO citybox_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO citybox_readonly;
SQL

echo "✓ ${DB_NAME} pronto (citybox_readonly com SELECT)"
