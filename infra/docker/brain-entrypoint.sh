#!/usr/bin/env bash
# FebraHub — sobe o GBrain com Postgres+pgvector e as fontes por setor.
#
# Idempotente do começo ao fim: reiniciar o container repete tudo sem
# duplicar nada. É o que permite tratar o gbrain como qualquer outro serviço
# do compose, sem passo manual depois do deploy.
set -euo pipefail

CONFIG_DIR="${GBRAIN_CONFIG_DIR:-/root/.gbrain}"
REPO_DIR="${GBRAIN_REPO_DIR:-/brain}"
PORTA="${GBRAIN_PORT:-3131}"
MODELO_EMBEDDING="${GBRAIN_EMBEDDING_MODEL:-openai:text-embedding-3-small}"
DIMENSOES_EMBEDDING="${GBRAIN_EMBEDDING_DIMENSIONS:-1536}"

log() { echo "[brain] $*" >&2; }

if [ -z "${GBRAIN_DATABASE_URL:-}" ]; then
  log "ERRO: GBRAIN_DATABASE_URL não definido."
  exit 1
fi
if [ -z "${GBRAIN_ADMIN_BOOTSTRAP_TOKEN:-}" ]; then
  # Sem ele o token de admin é gerado a cada start E escondido (start não-TTY),
  # e a API nunca conseguiria provisionar cliente nenhum.
  log "ERRO: GBRAIN_ADMIN_BOOTSTRAP_TOKEN não definido."
  exit 1
fi

mkdir -p "$CONFIG_DIR" "$REPO_DIR"

# O engine NÃO é inferido da URL (é decisão explícita do config, ver
# src/core/config.ts do gbrain): sem `engine: postgres` aqui ele subiria em
# PGLite e ignoraria o banco vetorial que provisionamos ao lado.
cat > "$CONFIG_DIR/config.json" <<JSON
{
  "engine": "postgres",
  "database_url": "${GBRAIN_DATABASE_URL}",
  "brain_dir": "${REPO_DIR}",
  "embedding_model": "${MODELO_EMBEDDING}",
  "embedding_dimensions": ${DIMENSOES_EMBEDDING}
}
JSON
log "config escrito em $CONFIG_DIR/config.json (engine=postgres)"

log "aguardando o Postgres do brain…"
for _ in $(seq 1 60); do
  if gbrain status >/dev/null 2>&1 || gbrain doctor --json >/dev/null 2>&1; then break; fi
  sleep 2
done

# Cria/atualiza o schema. `init --force` é o caminho documentado para
# reprocessar a inicialização contra o ambiente já populado; se a versão
# instalada não aceitar, `apply-migrations` cobre o mesmo terreno.
log "aplicando schema…"
gbrain init --force >/dev/null 2>&1 || gbrain apply-migrations || log "AVISO: schema já estava aplicado ou init falhou (segue)"

# ---------------------------------------------------------------------------
# Fontes = recorte de acesso.
#
# Uma fonte por setor do FebraHub, mais `geral` (o que todo mundo lê). É esse
# desenho que faz a permissão valer no GBrain e não só na nossa API: cada
# pessoa recebe um cliente OAuth cujo `federated-read` lista exatamente as
# fontes dos setores dela, e o gbrain filtra no SQL.
#
# A lista vem do ambiente para não haver duas verdades: quem manda é
# SETORES_ORGANOGRAMA/HUBS do FebraHub, repassado no compose.
# ---------------------------------------------------------------------------
FONTES="${GBRAIN_FONTES:-geral,comercial,financeiro,marketing,pedagogico,eventos,loja,estoque,crm}"
IFS=',' read -ra LISTA <<< "$FONTES"
for fonte in "${LISTA[@]}"; do
  fonte="$(echo "$fonte" | tr -d '[:space:]')"
  [ -z "$fonte" ] && continue
  caminho="$REPO_DIR/$fonte"
  if [ ! -d "$caminho/.git" ]; then
    mkdir -p "$caminho"
    git -C "$caminho" init -q
    git -C "$caminho" config user.email "brain@febrahub.local"
    git -C "$caminho" config user.name "FebraHub Brain"
    # Repositório vazio não sincroniza: um README por fonte dá o primeiro
    # commit e documenta, dentro do próprio brain, para que serve a pasta.
    printf '# %s\n\nBase de conhecimento do setor %s no FebraHub.\n' "$fonte" "$fonte" > "$caminho/README.md"
    git -C "$caminho" add -A
    git -C "$caminho" commit -qm "fonte $fonte" || true
  fi
  gbrain sources add "$fonte" --path "$caminho" >/dev/null 2>&1 \
    && log "fonte $fonte criada" \
    || log "fonte $fonte já existia"
done

log "subindo o servidor HTTP em 0.0.0.0:$PORTA"
# --bind explícito: o padrão é 127.0.0.1 e a API vive em OUTRO container.
# Sem --public-url de propósito — ninguém fora da rede do compose fala com
# ele, e o Nginx do host não publica esta porta.
exec gbrain serve --http --port "$PORTA" --bind 0.0.0.0
