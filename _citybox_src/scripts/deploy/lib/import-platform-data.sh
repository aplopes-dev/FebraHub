#!/usr/bin/env bash
# Importa dados do schema platform: aplopes_platform → citybox (mesmo cluster Postgres).
# Uso: bash scripts/deploy/lib/import-platform-data.sh [--dry-run]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

SOURCE_DB="${IMPORT_SOURCE_DB:-aplopes_platform}"
TARGET_DB="${CITYBOX_DATABASE_NAME:-citybox}"
CONTAINER="${POSTGRES_CONTAINER:-aplopes_postgres}"
PG_USER="${CITYBOX_DATABASE_USER:-aplopes}"
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    -h|--help)
      cat <<EOF
Importa lojas, clientes e dados relacionados do schema platform.

  Origem:  database ${SOURCE_DB}  (schema platform)
  Destino: database ${TARGET_DB}  (schema platform)

Tabelas (ordem de FK):
  clients → users → stores → store_members, store_modules,
  store_integrations, store_terminals, store_errors, store_audit_events

Não copia _prisma_migrations (destino já tem migrations aplicadas).

Opções:
  --dry-run   Mostra contagens e valida schemas, sem gravar
  IMPORT_SOURCE_DB=...  database de origem (padrão: aplopes_platform)

Pré-requisito: destino com migrations platform já aplicadas (pnpm run deploy:prod).
EOF
      exit 0
      ;;
    *) die "Argumento desconhecido: ${arg}" ;;
  esac
done

TABLES=(
  clients
  users
  stores
  store_members
  store_modules
  store_integrations
  store_terminals
  store_errors
  store_audit_events
)

log "Verificando Postgres (${CONTAINER})..."
docker exec "${CONTAINER}" pg_isready -U "${PG_USER}" -d postgres >/dev/null

for db in "${SOURCE_DB}" "${TARGET_DB}"; do
  docker exec "${CONTAINER}" psql -U "${PG_USER}" -d postgres -tAc \
    "SELECT 1 FROM pg_database WHERE datname='${db}'" | grep -q 1 || \
    die "Database '${db}' não existe"
done

log "Contagens na origem (${SOURCE_DB}.platform):"
for t in "${TABLES[@]}"; do
  count="$(docker exec "${CONTAINER}" psql -U "${PG_USER}" -d "${SOURCE_DB}" -tAc \
    "SELECT count(*) FROM platform.\"${t}\"" 2>/dev/null || echo "?")"
  echo "  · ${t}: ${count}"
done

log "Contagens no destino (${TARGET_DB}.platform) — antes:"
for t in "${TABLES[@]}"; do
  count="$(docker exec "${CONTAINER}" psql -U "${PG_USER}" -d "${TARGET_DB}" -tAc \
    "SELECT count(*) FROM platform.\"${t}\"")"
  echo "  · ${t}: ${count}"
done

# Valida colunas idênticas em clients e stores (amostra)
for t in clients stores; do
  diff -q \
    <(docker exec "${CONTAINER}" psql -U "${PG_USER}" -d "${SOURCE_DB}" -tAc \
      "SELECT column_name FROM information_schema.columns WHERE table_schema='platform' AND table_name='${t}' ORDER BY ordinal_position") \
    <(docker exec "${CONTAINER}" psql -U "${PG_USER}" -d "${TARGET_DB}" -tAc \
      "SELECT column_name FROM information_schema.columns WHERE table_schema='platform' AND table_name='${t}' ORDER BY ordinal_position") \
    >/dev/null || die "Schema divergente na tabela platform.${t} — revise migrations antes de importar"
done
log "Schemas platform.clients e platform.stores compatíveis"

if [[ "${DRY_RUN}" == true ]]; then
  log "Dry-run: nenhum dado gravado"
  exit 0
fi

target_total="$(docker exec "${CONTAINER}" psql -U "${PG_USER}" -d "${TARGET_DB}" -tAc \
  "SELECT coalesce(sum(n),0) FROM (SELECT count(*) n FROM platform.stores UNION ALL SELECT count(*) FROM platform.clients) s")"
if [[ "${target_total}" != "0" ]]; then
  die "Destino já tem dados (stores+clients=${target_total}). Truncar manualmente ou use banco vazio."
fi

TMP="$(mktemp)"
trap 'rm -f "${TMP}"' EXIT

TABLE_ARGS=()
for t in "${TABLES[@]}"; do
  TABLE_ARGS+=(-t "platform.${t}")
done

log "Exportando dados de ${SOURCE_DB}..."
docker exec "${CONTAINER}" pg_dump -U "${PG_USER}" -d "${SOURCE_DB}" \
  --data-only --no-owner --no-privileges \
  "${TABLE_ARGS[@]}" > "${TMP}"

log "Importando em ${TARGET_DB}..."
# psql com -c ignora stdin — tudo numa única sessão
{
  echo "SET session_replication_role = replica;"
  # pg_dump 17 emite \\restrict — remover para compatibilidade com psql
  grep -v '^\\restrict' "${TMP}" | grep -v '^\\unrestrict' || true
  echo "SET session_replication_role = DEFAULT;"
} | docker exec -i "${CONTAINER}" psql -U "${PG_USER}" -d "${TARGET_DB}" -v ON_ERROR_STOP=1 -q

log "Contagens no destino — depois:"
for t in "${TABLES[@]}"; do
  count="$(docker exec "${CONTAINER}" psql -U "${PG_USER}" -d "${TARGET_DB}" -tAc \
    "SELECT count(*) FROM platform.\"${t}\"")"
  echo "  · ${t}: ${count}"
done

log "Importação concluída. Reinicie admin-api se já estiver rodando."
