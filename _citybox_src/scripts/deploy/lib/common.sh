#!/usr/bin/env bash
# Funções compartilhadas do deploy aplopes.
set -euo pipefail

DEPLOY_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${DEPLOY_LIB_DIR}/../../.." && pwd)"
INFRA_DIR="${ROOT}/services/infra"
PLATFORM_DIR="${ROOT}/services/platform"
CLINICA_INFRA_DIR="${ROOT}/apps/verticals/clinica/infra"
IMOVEIS_INFRA_DIR="${ROOT}/apps/imoveis/infra"
KEYCLOAK_DIR="${ROOT}/infra/keycloak"
PLATFORM_ENV="${ROOT}/services/platform-apps.env"

SKIP_INFRA=false
SKIP_MIGRATIONS=false
SKIP_BUILD=false
BUILD_NO_CACHE=false
CACHEBUST=""

log() {
  echo "▶ $*"
}

die() {
  echo "ERRO: $*" >&2
  exit 1
}

parse_deploy_args() {
  for arg in "$@"; do
    case "$arg" in
      --skip-infra) SKIP_INFRA=true ;;
      --skip-migrations) SKIP_MIGRATIONS=true ;;
      --skip-build) SKIP_BUILD=true ;;
      --no-cache) BUILD_NO_CACHE=true ;;
      --) ;;
      -h|--help)
        cat <<'EOF'
Uso: scripts/deploy/aplopes-production.sh [--skip-infra] [--skip-migrations] [--skip-build] [--no-cache]

  --skip-infra       Não sobe postgres/redis/rabbitmq/typesense/minio
  --skip-migrations  Pula provisionamento, prisma migrate deploy e seeds
  --skip-build       Só recria containers (docker compose up -d)
  --no-cache         docker build --no-cache (ignora cache de layers; mais lento)
EOF
        exit 0
        ;;
      *)
        die "Argumento desconhecido: ${arg}"
        ;;
    esac
  done
}

load_platform_env() {
  if [[ ! -f "${PLATFORM_ENV}" ]]; then
    die "Arquivo ${PLATFORM_ENV} ausente. Copie services/platform-apps.env.example"
  fi
  # shellcheck disable=SC1090
  set -a
  source "${PLATFORM_ENV}"
  set +a

  : "${CITYBOX_DATABASE_NAME:=citybox}"
  : "${CITYBOX_DATABASE_USER:=aplopes}"
  : "${CITYBOX_DATABASE_PASSWORD:=aplopes}"
  : "${CITYBOX_DATABASE_HOST:=127.0.0.1}"
  : "${CITYBOX_DATABASE_PORT:=15433}"
  : "${CITYBOX_DATABASE_HOST_DOCKER:=aplopes_postgres}"
  : "${CITYBOX_DATABASE_PORT_DOCKER:=5432}"

  # Defaults precisam ser exportados: o docker compose lê o shell + --env-file.
  # Sem export, variáveis só calculadas aqui (ausentes no .env) ficam vazias no Compose.
  export PLATFORM_DATABASE_URL="${PLATFORM_DATABASE_URL:-postgresql://${CITYBOX_DATABASE_USER}:${CITYBOX_DATABASE_PASSWORD}@${CITYBOX_DATABASE_HOST}:${CITYBOX_DATABASE_PORT}/${CITYBOX_DATABASE_NAME}?schema=platform}"
  export CLINICA_DATABASE_URL="${CLINICA_DATABASE_URL:-postgresql://${CITYBOX_DATABASE_USER}:${CITYBOX_DATABASE_PASSWORD}@${CITYBOX_DATABASE_HOST}:${CITYBOX_DATABASE_PORT}/${CITYBOX_DATABASE_NAME}?schema=clinica}"
  export ERP_DATABASE_URL="${ERP_DATABASE_URL:-postgresql://${CITYBOX_DATABASE_USER}:${CITYBOX_DATABASE_PASSWORD}@${CITYBOX_DATABASE_HOST}:${CITYBOX_DATABASE_PORT}/${CITYBOX_DATABASE_NAME}?schema=erp}"
  export IMOVEIS_DATABASE_URL="${IMOVEIS_DATABASE_URL:-postgresql://${CITYBOX_DATABASE_USER}:${CITYBOX_DATABASE_PASSWORD}@${CITYBOX_DATABASE_HOST}:${CITYBOX_DATABASE_PORT}/${CITYBOX_DATABASE_NAME}?schema=imoveis}"
  export BEAUTIFUL_DATABASE_URL="${BEAUTIFUL_DATABASE_URL:-postgresql://${CITYBOX_DATABASE_USER}:${CITYBOX_DATABASE_PASSWORD}@${CITYBOX_DATABASE_HOST}:${CITYBOX_DATABASE_PORT}/${CITYBOX_DATABASE_NAME}?schema=beautiful}"
  export FISCAL_DATABASE_URL="${FISCAL_DATABASE_URL:-postgresql://${CITYBOX_DATABASE_USER}:${CITYBOX_DATABASE_PASSWORD}@${CITYBOX_DATABASE_HOST}:${CITYBOX_DATABASE_PORT}/${CITYBOX_DATABASE_NAME}?schema=fiscal}"
  export PLATFORM_DATABASE_URL_DOCKER="${PLATFORM_DATABASE_URL_DOCKER:-postgresql://${CITYBOX_DATABASE_USER}:${CITYBOX_DATABASE_PASSWORD}@${CITYBOX_DATABASE_HOST_DOCKER}:${CITYBOX_DATABASE_PORT_DOCKER}/${CITYBOX_DATABASE_NAME}?schema=platform}"
  export CLINICA_DATABASE_URL_DOCKER="${CLINICA_DATABASE_URL_DOCKER:-postgresql://${CITYBOX_DATABASE_USER}:${CITYBOX_DATABASE_PASSWORD}@${CITYBOX_DATABASE_HOST_DOCKER}:${CITYBOX_DATABASE_PORT_DOCKER}/${CITYBOX_DATABASE_NAME}?schema=clinica}"
  export ERP_DATABASE_URL_DOCKER="${ERP_DATABASE_URL_DOCKER:-postgresql://${CITYBOX_DATABASE_USER}:${CITYBOX_DATABASE_PASSWORD}@${CITYBOX_DATABASE_HOST_DOCKER}:${CITYBOX_DATABASE_PORT_DOCKER}/${CITYBOX_DATABASE_NAME}?schema=erp}"
  export IMOVEIS_DATABASE_URL_DOCKER="${IMOVEIS_DATABASE_URL_DOCKER:-postgresql://${CITYBOX_DATABASE_USER}:${CITYBOX_DATABASE_PASSWORD}@${CITYBOX_DATABASE_HOST_DOCKER}:${CITYBOX_DATABASE_PORT_DOCKER}/${CITYBOX_DATABASE_NAME}?schema=imoveis}"
  export BEAUTIFUL_DATABASE_URL_DOCKER="${BEAUTIFUL_DATABASE_URL_DOCKER:-postgresql://${CITYBOX_DATABASE_USER}:${CITYBOX_DATABASE_PASSWORD}@${CITYBOX_DATABASE_HOST_DOCKER}:${CITYBOX_DATABASE_PORT_DOCKER}/${CITYBOX_DATABASE_NAME}?schema=beautiful}"
  export FISCAL_DATABASE_URL_DOCKER="${FISCAL_DATABASE_URL_DOCKER:-postgresql://${CITYBOX_DATABASE_USER}:${CITYBOX_DATABASE_PASSWORD}@${CITYBOX_DATABASE_HOST_DOCKER}:${CITYBOX_DATABASE_PORT_DOCKER}/${CITYBOX_DATABASE_NAME}?schema=fiscal}"
}

preflight() {
  command -v docker >/dev/null 2>&1 || die "docker não encontrado"
  command -v pnpm >/dev/null 2>&1 || die "pnpm não encontrado"
  command -v curl >/dev/null 2>&1 || die "curl não encontrado"
  load_platform_env
  docker network create aplopes-platform 2>/dev/null || true
}

compose_env_file_args() {
  echo --env-file "${PLATFORM_ENV}"
}

# Invalida cache do Docker na camada COPY quando o código muda (git SHA).
# Sem isso, `docker compose build` pode reutilizar layers antigas e publicar imagem desatualizada.
# Working tree dirty → sufixo com timestamp (senão HEAD igual = imagem antiga com código novo local).
prepare_build_env() {
  if git -C "${ROOT}" rev-parse HEAD >/dev/null 2>&1; then
    CACHEBUST="$(git -C "${ROOT}" rev-parse HEAD)"
    if [[ -n "$(git -C "${ROOT}" status --porcelain 2>/dev/null)" ]]; then
      CACHEBUST="${CACHEBUST}-dirty-$(date -u +%s)"
    fi
  else
    CACHEBUST="$(date -u +%s)"
  fi
  export CACHEBUST
  log "Build CACHEBUST=${CACHEBUST:0:20}…"
}

docker_compose_build() {
  local dir="$1"
  shift
  local compose_args
  compose_args="$(compose_env_file_args)"
  local -a build_flags=()
  if [[ "${BUILD_NO_CACHE}" == true ]]; then
    build_flags+=(--no-cache)
  fi
  (
    cd "${dir}"
    # shellcheck disable=SC2086
    docker compose ${compose_args} build "${build_flags[@]}" "$@"
  )
}
