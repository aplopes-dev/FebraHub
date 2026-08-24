#!/usr/bin/env bash
# Reset destrutivo local (ou VPS) do Citybox multi-realm:
#   1) Keycloak do zero + sync dos 6 realms
#   2) DROP/CREATE do database `citybox` + migrations + seeds
#   3) Usuário platform_admin para o admin-web
#
# Uso (na raiz do monorepo):
#   pnpm reset:multirealm -- --yes
#   pnpm reset:multirealm -- --yes --email=voce@empresa.com --password='SuaSenhaForte1!'
#
# ⚠️ APAGA dados do banco Citybox e do Keycloak. Não rode em produção com dados
#    reais sem backup. Em VPS aplopes use: --target=prod --yes
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
KEYCLOAK_DIR="${ROOT}/infra/keycloak"
POSTGRES_DIR="${ROOT}/infra/postgres"
DEPLOY_LIB="${ROOT}/scripts/deploy/lib"

TARGET="local"
ASSUME_YES=false
SKIP_KEYCLOAK=false
SKIP_DB=false
SKIP_ADMIN_USER=false
ADMIN_USERNAME="${CITYBOX_ADMIN_USERNAME:-admin}"
ADMIN_EMAIL="${CITYBOX_ADMIN_EMAIL:-admin@citybox.local}"
ADMIN_PASSWORD="${CITYBOX_ADMIN_PASSWORD:-CityboxAdmin1!}"
ADMIN_FIRST_NAME="${CITYBOX_ADMIN_FIRST_NAME:-Citybox}"
ADMIN_LAST_NAME="${CITYBOX_ADMIN_LAST_NAME:-Admin}"

REALMS="citybox-admin,citybox-erp,citybox-clinica,citybox-beautiful,citybox-imoveis,citybox-marketplace"

log() { echo "▶ $*"; }
die() { echo "ERRO: $*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Uso: pnpm reset:multirealm -- --yes [flags]

  --yes                         Confirma o reset destrutivo (obrigatório)
  --target=local|prod           local = citybox_* (devs); prod = aplopes_* (VPS)
  --skip-keycloak               Não reseta o Keycloak
  --skip-db                     Não dropa/recria o database citybox
  --skip-admin-user             Não cria o usuário do admin-web
  --username=admin              Username no realm citybox-admin
  --email=admin@citybox.local   E-mail (login com e-mail permitido)
  --password='CityboxAdmin1!'   Senha (≥14 chars com maiúscula/minúscula/dígito/especial
                                — política do realm admin; em localhost o sync relaxa,
                                mas a senha forte evita surpresa em prod)
  --first-name=Citybox
  --last-name=Admin
  -h | --help

Ambiente opcional: CITYBOX_ADMIN_USERNAME / _EMAIL / _PASSWORD / _FIRST_NAME / _LAST_NAME
EOF
}

parse_args() {
  for arg in "$@"; do
    case "$arg" in
      --yes|-y) ASSUME_YES=true ;;
      --target=local) TARGET=local ;;
      --target=prod) TARGET=prod ;;
      --skip-keycloak) SKIP_KEYCLOAK=true ;;
      --skip-db) SKIP_DB=true ;;
      --skip-admin-user) SKIP_ADMIN_USER=true ;;
      --username=*) ADMIN_USERNAME="${arg#*=}" ;;
      --email=*) ADMIN_EMAIL="${arg#*=}" ;;
      --password=*) ADMIN_PASSWORD="${arg#*=}" ;;
      --first-name=*) ADMIN_FIRST_NAME="${arg#*=}" ;;
      --last-name=*) ADMIN_LAST_NAME="${arg#*=}" ;;
      --) ;;
      -h|--help) usage; exit 0 ;;
      *) die "Argumento desconhecido: ${arg} (use --help)" ;;
    esac
  done
}

load_dotenv_file() {
  local file="$1"
  if [[ -f "${file}" ]]; then
    set -a
    # bash `source` keeps CR from CRLF files; `psql -U citybox\r` then fails with
    # FATAL: role "citybox" does not exist (Docker Compose itself strips CR).
    # shellcheck disable=SC1090
    source <(sed 's/\r$//' "${file}")
    set +a
  fi
}

resolve_target() {
  if [[ "${TARGET}" == "prod" ]]; then
    POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-aplopes_postgres}"
    PG_USER="${CITYBOX_DATABASE_USER:-aplopes}"
    PG_PASSWORD="${CITYBOX_DATABASE_PASSWORD:-aplopes}"
    PG_HOST="${CITYBOX_DATABASE_HOST:-127.0.0.1}"
    PG_PORT="${CITYBOX_DATABASE_PORT:-15433}"
    KC_CONTAINER="${KC_CONTAINER:-aplopes_keycloak}"
    KC_DB_CONTAINER="${KC_DB_CONTAINER:-aplopes_keycloak_db}"
    KC_VOLUME="${KEYCLOAK_DB_VOLUME:-aplopes_keycloak_db_data}"
    KC_COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.prod.yml)
    KEYCLOAK_URL="${KEYCLOAK_URL:-http://127.0.0.1:8080}"
  else
    load_dotenv_file "${POSTGRES_DIR}/.env"
    load_dotenv_file "${KEYCLOAK_DIR}/.env"
    POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-citybox_postgres}"
    PG_USER="${POSTGRES_USER:-citybox}"
    PG_PASSWORD="${POSTGRES_PASSWORD:-citybox}"
    PG_HOST="127.0.0.1"
    PG_PORT="${POSTGRES_PORT:-15433}"
    KC_CONTAINER="${KC_CONTAINER:-citybox_keycloak}"
    KC_DB_CONTAINER="${KC_DB_CONTAINER:-citybox_keycloak_db}"
    KC_VOLUME="${KEYCLOAK_DB_VOLUME:-citybox_keycloak_db_data}"
    KC_COMPOSE_FILES=(-f docker-compose.yml)
    KEYCLOAK_URL="${KEYCLOAK_URL:-http://127.0.0.1:8080}"
  fi

  DB_NAME="${CITYBOX_DATABASE_NAME:-citybox}"
  export PLATFORM_DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${DB_NAME}?schema=platform"
  export ERP_DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${DB_NAME}?schema=erp"
  export CLINICA_DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${DB_NAME}?schema=clinica"
  export IMOVEIS_DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${DB_NAME}?schema=imoveis"
  export BEAUTIFUL_DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${DB_NAME}?schema=beautiful"
  export FISCAL_DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${DB_NAME}?schema=fiscal"
  export POSTGRES_CONTAINER
  export CITYBOX_DATABASE_USER="${PG_USER}"
  export CITYBOX_DATABASE_NAME="${DB_NAME}"
  export KEYCLOAK_URL
  export KEYCLOAK_REALMS="${KEYCLOAK_REALMS:-${REALMS}}"
}

confirm_destructive() {
  if [[ "${ASSUME_YES}" == true ]]; then
    return 0
  fi
  cat <<EOF
⚠️  Reset DESTRUTIVO (${TARGET}):
    • Keycloak: containers ${KC_CONTAINER}/${KC_DB_CONTAINER} + volume ${KC_VOLUME}
    • Postgres: DROP DATABASE ${DB_NAME} em ${POSTGRES_CONTAINER}
    • Depois: sync dos 6 realms + migrations + usuário admin-web

Passe --yes para confirmar.
EOF
  die "Abortado (falta --yes)"
}

ensure_tools() {
  command -v docker >/dev/null 2>&1 || die "docker não encontrado"
  command -v pnpm >/dev/null 2>&1 || die "pnpm não encontrado"
  command -v curl >/dev/null 2>&1 || die "curl não encontrado"
  command -v python3 >/dev/null 2>&1 || die "python3 não encontrado"
}

ensure_infra_local() {
  if [[ "${TARGET}" != "local" ]]; then
    return 0
  fi
  if [[ ! -f "${POSTGRES_DIR}/.env" && -f "${POSTGRES_DIR}/.env.example" ]]; then
    cp "${POSTGRES_DIR}/.env.example" "${POSTGRES_DIR}/.env"
    log "Criado infra/postgres/.env a partir do .env.example"
  fi
  if [[ ! -f "${KEYCLOAK_DIR}/.env" && -f "${KEYCLOAK_DIR}/.env.example" ]]; then
    cp "${KEYCLOAK_DIR}/.env.example" "${KEYCLOAK_DIR}/.env"
    log "Criado infra/keycloak/.env a partir do .env.example"
  fi
  if ! docker ps --format '{{.Names}}' | grep -qx "${POSTGRES_CONTAINER}"; then
    log "Subindo postgres local"
    (cd "${ROOT}" && pnpm infra:up postgres)
  fi
}

wait_http() {
  local name="$1" url="$2" attempts="${3:-48}"
  local i
  for i in $(seq 1 "${attempts}"); do
    if curl -sf "${url}" >/dev/null 2>&1; then
      echo "  · ${name} OK"
      return 0
    fi
    sleep 5
  done
  die "${name} não respondeu a tempo (${url})"
}

reset_keycloak() {
  if [[ "${SKIP_KEYCLOAK}" == true ]]; then
    log "Pulando reset do Keycloak (--skip-keycloak)"
    return 0
  fi

  log "[Keycloak] Parar e remover containers"
  docker rm -f "${KC_CONTAINER}" "${KC_DB_CONTAINER}" 2>/dev/null || true
  # Nomes legados / alternativos
  if [[ "${TARGET}" == "local" ]]; then
    docker rm -f aplopes_keycloak aplopes_keycloak_db 2>/dev/null || true
  else
    docker rm -f citybox_keycloak citybox_keycloak_db 2>/dev/null || true
  fi

  log "[Keycloak] Recriar volume ${KC_VOLUME}"
  docker volume rm -f "${KC_VOLUME}" 2>/dev/null || true
  docker volume create "${KC_VOLUME}" >/dev/null

  log "[Keycloak] Build + up"
  (
    cd "${KEYCLOAK_DIR}"
    # shellcheck disable=SC2068
    docker compose ${KC_COMPOSE_FILES[@]} build keycloak
    # shellcheck disable=SC2068
    docker compose ${KC_COMPOSE_FILES[@]} up -d --force-recreate
  )

  log "[Keycloak] Aguardando /realms/master"
  wait_http "Keycloak" "${KEYCLOAK_URL%/}/realms/master" 48

  load_dotenv_file "${KEYCLOAK_DIR}/.env"
  if [[ "${TARGET}" == "prod" ]]; then
    load_dotenv_file "${ROOT}/services/platform-apps.env"
  fi

  log "[Keycloak] Sync dos realms (${KEYCLOAK_REALMS})"
  (
    cd "${ROOT}"
    export KEYCLOAK_URL
    export KEYCLOAK_REALMS
    export KEYCLOAK_ADMIN="${KEYCLOAK_ADMIN:-admin}"
    export KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-citybox}"
    # Em local, secrets ausentes viram <clientId>-dev-secret (sync-realm.mjs).
    bash "${KEYCLOAK_DIR}/scripts/sync-realm.sh"
  )
}

drop_recreate_citybox_db() {
  if [[ "${SKIP_DB}" == true ]]; then
    log "Pulando reset do database (--skip-db)"
    return 0
  fi

  docker inspect "${POSTGRES_CONTAINER}" >/dev/null 2>&1 \
    || die "Container ${POSTGRES_CONTAINER} não encontrado. Suba a infra (pnpm infra:up)."

  log "[DB] Encerrar sessões e DROP DATABASE ${DB_NAME}"
  docker exec "${POSTGRES_CONTAINER}" psql -U "${PG_USER}" -d postgres -v ON_ERROR_STOP=1 -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" \
    >/dev/null || true
  docker exec "${POSTGRES_CONTAINER}" psql -U "${PG_USER}" -d postgres -v ON_ERROR_STOP=1 -c \
    "DROP DATABASE IF EXISTS \"${DB_NAME}\";"

  log "[DB] Provisionar ${DB_NAME} + schemas"
  bash "${DEPLOY_LIB}/provision-citybox-db.sh"

  log "[DB] pnpm install + migrations + seeds"
  (
    cd "${ROOT}"
    pnpm install
    DATABASE_URL="${PLATFORM_DATABASE_URL}" pnpm --filter @citybox/admin-api run db:migrate:deploy
    DATABASE_URL="${ERP_DATABASE_URL}" pnpm --filter @citybox/erp-api run db:migrate:deploy
    DATABASE_URL="${CLINICA_DATABASE_URL}" pnpm --filter @citybox/clinica-api run db:migrate:deploy
    DATABASE_URL="${IMOVEIS_DATABASE_URL}" pnpm --filter @citybox/imoveis-api run db:migrate:deploy
    DATABASE_URL="${BEAUTIFUL_DATABASE_URL}" pnpm --filter @citybox/beautiful-api run db:migrate:deploy
    DATABASE_URL="${FISCAL_DATABASE_URL}" pnpm --filter @citybox/fiscal-api run db:migrate:deploy

    if [[ -f "${ROOT}/apps/admin/api/prisma/seed.ts" ]]; then
      log "[DB] Seed admin-api (planos)"
      (cd "${ROOT}/apps/admin/api" && rm -rf generated/prisma && DATABASE_URL="${PLATFORM_DATABASE_URL}" pnpm run db:generate)
      DATABASE_URL="${PLATFORM_DATABASE_URL}" pnpm --filter @citybox/admin-api run db:seed
    fi
    if [[ -f "${ROOT}/apps/verticals/clinica/api/prisma/seed.ts" ]]; then
      log "[DB] Seed clinica-api"
      (cd "${ROOT}/apps/verticals/clinica/api" && rm -rf generated/prisma && DATABASE_URL="${CLINICA_DATABASE_URL}" pnpm run db:generate) || true
      DATABASE_URL="${CLINICA_DATABASE_URL}" pnpm --filter @citybox/clinica-api run db:seed || true
    fi
  )
}

kc_admin_token() {
  load_dotenv_file "${KEYCLOAK_DIR}/.env"
  local admin_user="${KEYCLOAK_ADMIN:-admin}"
  local admin_pass="${KEYCLOAK_ADMIN_PASSWORD:-citybox}"
  curl -sf -X POST "${KEYCLOAK_URL%/}/realms/master/protocol/openid-connect/token" \
    -d "client_id=admin-cli" \
    -d "username=${admin_user}" \
    -d "password=${admin_pass}" \
    -d "grant_type=password" \
    | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])'
}

create_admin_web_user() {
  if [[ "${SKIP_ADMIN_USER}" == true ]]; then
    log "Pulando criação do usuário admin-web (--skip-admin-user)"
    return 0
  fi

  log "[Admin] Criando usuário ${ADMIN_USERNAME} no realm citybox-admin"
  local token create_out user_sub
  token="$(kc_admin_token)"

  create_out="$(
  KEYCLOAK_URL="${KEYCLOAK_URL}" \
  ADMIN_USERNAME="${ADMIN_USERNAME}" \
  ADMIN_EMAIL="${ADMIN_EMAIL}" \
  ADMIN_PASSWORD="${ADMIN_PASSWORD}" \
  ADMIN_FIRST_NAME="${ADMIN_FIRST_NAME}" \
  ADMIN_LAST_NAME="${ADMIN_LAST_NAME}" \
  KC_TOKEN="${token}" \
  python3 - <<'PY'
import json, os, urllib.error, urllib.parse, urllib.request

base = os.environ["KEYCLOAK_URL"].rstrip("/")
realm = "citybox-admin"
token = os.environ["KC_TOKEN"]
username = os.environ["ADMIN_USERNAME"]
email = os.environ["ADMIN_EMAIL"]
password = os.environ["ADMIN_PASSWORD"]
first_name = os.environ["ADMIN_FIRST_NAME"]
last_name = os.environ["ADMIN_LAST_NAME"]

def req(method, path, body=None):
    data = None if body is None else json.dumps(body).encode()
    request = urllib.request.Request(
        f"{base}{path}",
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", "replace")
        raise SystemExit(f"Keycloak {method} {path} → {err.code}: {detail[:500]}") from err

# Em localhost o sync costuma relaxar a política; limpar de qualquer forma
# evita falha se o realm foi criado com passwordPolicy do JSON.
status, realm_rep = req("GET", f"/admin/realms/{realm}")
if realm_rep.get("passwordPolicy"):
    realm_rep = {**realm_rep, "passwordPolicy": ""}
    req("PUT", f"/admin/realms/{realm}", realm_rep)
    print("  · passwordPolicy limpa (dev)")

# TOTP não obrigatório para o bootstrap local
try:
    _, action = req(
        "GET",
        f"/admin/realms/{realm}/authentication/required-actions/CONFIGURE_TOTP",
    )
    req(
        "PUT",
        f"/admin/realms/{realm}/authentication/required-actions/CONFIGURE_TOTP",
        {**action, "enabled": True, "defaultAction": False},
    )
    print("  · CONFIGURE_TOTP defaultAction=false")
except SystemExit:
    print("  · CONFIGURE_TOTP (skip)")

q = urllib.parse.urlencode({"username": username, "exact": "true"})
_, found = req("GET", f"/admin/realms/{realm}/users?{q}")
user_id = found[0]["id"] if found else None

payload = {
    "username": username,
    "enabled": True,
    "email": email,
    "emailVerified": True,
    "firstName": first_name,
    "lastName": last_name,
    "requiredActions": [],
}
if user_id:
    req("PUT", f"/admin/realms/{realm}/users/{user_id}", payload)
    print(f"  · usuário {username} atualizado")
else:
    req("POST", f"/admin/realms/{realm}/users", payload)
    _, created = req("GET", f"/admin/realms/{realm}/users?{q}")
    if not created:
        raise SystemExit("usuário criado mas id não resolvido")
    user_id = created[0]["id"]
    print(f"  · usuário {username} criado")

req(
    "PUT",
    f"/admin/realms/{realm}/users/{user_id}/reset-password",
    {"type": "password", "value": password, "temporary": False},
)
print("  · senha definida (não temporária)")

_, role = req("GET", f"/admin/realms/{realm}/roles/platform_admin")
req(
    "POST",
    f"/admin/realms/{realm}/users/{user_id}/role-mappings/realm",
    [role],
)
print("  · realm role platform_admin")
# Última linha: consumida pelo shell (não misturar com logs).
print(user_id)
PY
  )"

  # Logs do Python vêm misturados; o sub é a última linha UUID.
  user_sub="$(printf '%s\n' "${create_out}" | tail -n 1 | tr -d '[:space:]')"
  printf '%s\n' "${create_out}" | sed '$d'

  if [[ -z "${user_sub}" || "${#user_sub}" -lt 20 ]]; then
    die "Não foi possível resolver o keycloakSub do admin (saída: ${user_sub})"
  fi

  if [[ "${SKIP_DB}" == true ]]; then
    log "[Admin] Espelho platform.users pulado (--skip-db)"
    return 0
  fi

  log "[Admin] Espelhar em platform.users (${user_sub})"
  docker exec "${POSTGRES_CONTAINER}" psql -U "${PG_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -c \
    "INSERT INTO platform.users (id, keycloak_sub, email, display_name, role, created_at, updated_at)
     VALUES (
       gen_random_uuid()::text,
       '${user_sub}',
       '${ADMIN_EMAIL}',
       '${ADMIN_FIRST_NAME} ${ADMIN_LAST_NAME}',
       'platform_admin',
       NOW(),
       NOW()
     )
     ON CONFLICT (keycloak_sub) DO UPDATE
       SET email = EXCLUDED.email,
           display_name = EXCLUDED.display_name,
           role = 'platform_admin',
           updated_at = NOW();"
}

print_env_notes() {
  cat <<EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Reset multi-realm concluído (target=${TARGET})

Login admin-web
  URL:      http://127.0.0.1:3108/login   (ou ADMIN_ORIGIN em prod)
  Realm:    citybox-admin
  Usuário:  ${ADMIN_USERNAME}
  E-mail:   ${ADMIN_EMAIL}
  Senha:    ${ADMIN_PASSWORD}

⚠️  ATUALIZE O .env DO PROJETO (obrigatório após o reset)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1) Confira / copie a partir dos exemplos (não commitar secrets):

   cp services/platform-apps.env.example services/platform-apps.env   # se for deploy Docker
   # e/ou por app:
   cp apps/admin/api/.env.example  apps/admin/api/.env
   cp apps/admin/web/.env.example  apps/admin/web/.env
   cp apps/erp/api/.env.example    apps/erp/api/.env
   # … demais apps que for subir

2) Issuers / realm / client (local típico):

   KEYCLOAK_BASE_URL=http://127.0.0.1:8080
   KEYCLOAK_REALMS=${REALMS}
   KEYCLOAK_ADMIN_ISSUER=http://127.0.0.1:8080/realms/citybox-admin
   KEYCLOAK_ERP_ISSUER=http://127.0.0.1:8080/realms/citybox-erp
   KEYCLOAK_CLINICA_ISSUER=http://127.0.0.1:8080/realms/citybox-clinica
   KEYCLOAK_BEAUTIFUL_ISSUER=http://127.0.0.1:8080/realms/citybox-beautiful
   KEYCLOAK_IMOVEIS_ISSUER=http://127.0.0.1:8080/realms/citybox-imoveis
   KEYCLOAK_MARKETPLACE_ISSUER=http://127.0.0.1:8080/realms/citybox-marketplace

   admin-web / admin-api:
     KEYCLOAK_ISSUER / NEXT_PUBLIC_KEYCLOAK_ISSUER = …/realms/citybox-admin
     KEYCLOAK_CLIENT_ID / NEXT_PUBLIC_KEYCLOAK_CLIENT = admin-web
     KEYCLOAK_CLIENT_SECRET / KEYCLOAK_ADMIN_WEB_SECRET = admin-web-dev-secret   # local
     KEYCLOAK_PROVISIONING_CLIENT_ID = admin-provisioning
     KEYCLOAK_PROVISIONING_CLIENT_SECRET = admin-provisioning-dev-secret

3) Database (este reset usou):

   postgresql://${PG_USER}:***@${PG_HOST}:${PG_PORT}/${DB_NAME}?schema=<platform|erp|clinica|…>

   Container Postgres: ${POSTGRES_CONTAINER}

4) Em localhost o sync usa secrets \`<clientId>-dev-secret\` quando a env
   correspondente estiver vazia. Em produção (\`--target=prod\`) as ~16 secrets
   REAIS precisam estar em services/platform-apps.env (sem CHANGE_ME).

5) Suba os apps depois do .env atualizado, por exemplo:

   pnpm dev:comercio
   # ou pnpm deploy:prod -- --skip-infra   (VPS)

O realm legado citybox-dev NÃO é sincronizado quando KEYCLOAK_REALMS está setado.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
}

main() {
  parse_args "$@"
  ensure_tools
  resolve_target
  confirm_destructive
  ensure_infra_local

  log "Target=${TARGET} postgres=${POSTGRES_CONTAINER} keycloak=${KC_CONTAINER}"
  reset_keycloak
  drop_recreate_citybox_db
  create_admin_web_user
  print_env_notes
}

main "$@"
