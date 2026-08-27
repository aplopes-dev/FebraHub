#!/usr/bin/env bash
# ============================================================================
# FebraHub — Deploy no HOMOLOG (VPS 31.97.166.66, dir /root/FebraHub)
# ----------------------------------------------------------------------------
# Builda as imagens LOCALMENTE no box, aplica migrations do Prisma e sobe
# api + web. Idempotente e seguro para rodar de novo.
#
# Uso (no box da 66, dentro de /root/FebraHub):
#     ./deploy.sh              # deploy completo (pull + build api+web + migrate + up)
#     ./deploy.sh --no-pull    # não faz git pull (usa o código já presente)
#     ./deploy.sh --api-only   # builda/sobe só a api (pula o build do web, ~20-30min)
#     ./deploy.sh --no-build   # só migrate + up (imagens já buildadas)
#
# Requisitos: existir /root/FebraHub/.env com DATABASE_URL, JWT_*, MINIO_*,
# STONE_* etc. (é o arquivo que o compose interpola). Sem ele a api sobe com
# env vazio e entra em crash-loop.
# ============================================================================
set -euo pipefail

cd "$(dirname "$0")"

COMPOSE="docker compose -f docker-compose.prod.yml"
BRANCH="${DEPLOY_BRANCH:-homolog}"
DO_PULL=1
DO_BUILD_WEB=1
DO_BUILD=1

for arg in "$@"; do
  case "$arg" in
    --no-pull)   DO_PULL=0 ;;
    --api-only)  DO_BUILD_WEB=0 ;;
    --no-build)  DO_BUILD=0 ;;
    *) echo "Argumento desconhecido: $arg"; exit 2 ;;
  esac
done

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mERRO: %s\033[0m\n' "$*" >&2; exit 1; }

# 0) Pré-cheque: .env precisa existir e ter DATABASE_URL preenchida.
[ -f .env ] || die ".env ausente em $(pwd). Sem ele a api sobe com env vazio (crash-loop)."
grep -qE '^DATABASE_URL=postgres' .env || die "DATABASE_URL não parece válida no .env."

# 1) Atualiza o código.
if [ "$DO_PULL" = 1 ]; then
  say "git pull origin $BRANCH"
  git pull origin "$BRANCH"
fi

# 2) Build das imagens (localmente no box).
if [ "$DO_BUILD" = 1 ]; then
  if [ "$DO_BUILD_WEB" = 1 ]; then
    say "build api + web (o web leva ~20-30min no box; 'Retrying' é normal)"
    $COMPOSE build api web
  else
    say "build só api"
    $COMPOSE build api
  fi
fi

# 3) Migrations do Prisma (container efêmero, sem depender do resto).
say "prisma migrate deploy"
$COMPOSE run --rm --no-deps --entrypoint sh api -c "npx prisma migrate deploy"

# 4) Sobe api + web + sidecars (recria com a imagem nova e o .env atual).
# `instagram` (aiograpi-rest) é imagem pública pull-only — sobe junto para a aba
# Marketing → Instagram funcionar; se ALOOK_AIOGRAPI_URL apontar para fora, ele
# apenas fica ocioso, sem atrapalhar.
if [ "$DO_BUILD_WEB" = 1 ]; then
  say "up -d api web instagram"
  $COMPOSE up -d api web instagram
else
  say "up -d api instagram"
  $COMPOSE up -d api instagram
fi

# 5) Health-check rápido da api.
say "aguardando a api ficar de pé..."
ok=0
for i in $(seq 1 30); do
  st=$(docker inspect febrahub_api --format '{{.State.Status}}' 2>/dev/null || echo missing)
  if [ "$st" = "running" ]; then
    # confirma que não está reiniciando em loop
    sleep 3
    st2=$(docker inspect febrahub_api --format '{{.State.Status}}' 2>/dev/null || echo missing)
    [ "$st2" = "running" ] && { ok=1; break; }
  fi
  sleep 2
done

if [ "$ok" = 1 ]; then
  say "OK — api está de pé (running)."
  docker compose -f docker-compose.prod.yml ps api web
else
  printf '\n\033[1;31mAtenção: api não estabilizou. Últimos logs:\033[0m\n'
  docker logs febrahub_api --tail 30 2>&1 | tail -30
  exit 1
fi
