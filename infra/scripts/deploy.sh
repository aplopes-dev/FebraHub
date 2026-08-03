#!/usr/bin/env bash
# Deploy do FebraHub na VPS.
#
# Sobe na ordem que as dependências exigem, espera cada serviço ficar saudável
# antes do próximo, e nunca derruba volume: `down -v` apagaria o banco e o
# bucket. Se algo falhar no meio, o serviço antigo continua no ar — o compose
# só troca o container depois que a imagem nova constrói.
set -euo pipefail

# O compose de produção roda DO CHECKOUT (/opt/febrahub/app): os contexts de
# build são relativos ao arquivo (`context: .` = raiz do repo). Rodar da pasta
# de cima quebra com "lstat /opt/febrahub/apps: no such file". O -p fixa o nome
# do projeto: sem ele, o basename do diretório ("app") criaria rede e volumes
# novos em vez de reaproveitar os do projeto `febrahub` que já está no ar.
DIR="${FEBRAHUB_DIR:-/opt/febrahub/app}"
COMPOSE="docker compose -p febrahub -f docker-compose.prod.yml --env-file .env"

cd "$DIR"

echo "==> commit implantado"
git rev-parse --short HEAD 2>/dev/null || echo "(sem repositório em $DIR)"

echo "==> backup antes de mexer"
../scripts/backup.sh || ./infra/scripts/backup.sh || { echo "backup falhou — abortando o deploy"; exit 1; }

echo "==> construindo imagens"
$COMPOSE build --pull api web

echo "==> banco e storage"
$COMPOSE up -d postgres minio
esperar_saudavel() {
  local nome="$1" tentativas="${2:-30}"
  for _ in $(seq 1 "$tentativas"); do
    local estado
    estado=$(docker inspect -f '{{.State.Health.Status}}' "$nome" 2>/dev/null || echo ausente)
    [ "$estado" = healthy ] && { echo "    $nome saudável"; return 0; }
    sleep 3
  done
  echo "ERRO: $nome não ficou saudável"; docker logs --tail 40 "$nome"; return 1
}
esperar_saudavel febrahub_postgres
esperar_saudavel febrahub_minio

echo "==> bucket"
$COMPOSE up minio_init

echo "==> migrations"
# migrate deploy só aplica o que já está versionado: não gera migration nova
# nem pede confirmação, que é o comportamento certo para produção.
$COMPOSE run --rm --no-deps -T api npx prisma migrate deploy

echo "==> API"
$COMPOSE up -d api
esperar_saudavel febrahub_api

echo "==> frontend"
$COMPOSE up -d web
esperar_saudavel febrahub_web

echo "==> smoke test"
curl -fsS http://127.0.0.1:3261/api/health | head -c 400; echo
curl -fsS -o /dev/null -w "web: %{http_code}\n" http://127.0.0.1:3260/

echo "==> containers"
$COMPOSE ps --format 'table {{.Name}}\t{{.Status}}'
