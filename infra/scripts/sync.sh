#!/usr/bin/env bash
# Roda as integrações do FebraHub dentro da VPS.
#
# Substitui o workflow `sync-diario.yml`, que rodava no GitHub Actions. Aqui a
# sincronização não depende de nada fora do servidor: as credenciais estão em
# /opt/febrahub/etl.env (600, root) e o container fala com a API pela rede
# interna do compose — sem sair para a internet, sem TLS, sem passar pelo Nginx.
#
# Uso:
#   ./sync.sh                 todas as fontes
#   ./sync.sh salesforce      só uma (o Salesforce roda 3x/dia, à parte)
#   ./sync.sh cispay sympla   várias
#
# Uma fonte que falha não derruba as outras — é o mesmo `continue-on-error` do
# workflow antigo. O resultado de cada uma vai para integracao_status, que é o
# que alimenta o rodapé "atualização das fontes" no painel.
set -uo pipefail

DIR="${FEBRAHUB_DIR:-/opt/febrahub}"
APP="$DIR/app"
COMPOSE="docker compose -f $APP/docker-compose.prod.yml --env-file $DIR/.env"
ANO_CORRENTE="$(date +%Y)"

cd "$APP" || { echo "não achei $APP"; exit 1; }

# Cada linha: apelido | nome de exibição | comando
FONTES=(
  "cispay|CisPay|python etl/cispay_sync.py --sync --meses 3"
  "sympla|Sympla|python etl/sympla_sync.py --sync"
  "contaazul|Conta Azul|python etl/contaazul_sync.py --sync"
  "contaazul_pagar|Conta Azul (a pagar)|python etl/contaazul_pagar_sync.py --sync"
  "meta|Meta Ads|python etl/meta_sync.py"
  "omie|Loja (Omie)|python etl/omie_sync.py --desde 01/01/${ANO_CORRENTE}"
  "sheets|Planilha da Loja|python etl/sheets_sync.py"
  "sheets_metas|Planilha — metas|python etl/sheets_metas_sync.py"
  "sheets_extras|Planilha — receitas extras|python etl/sheets_extras_sync.py"
  "sheets_fechamento|Planilha — fechamento|python etl/sheets_fechamento_sync.py"
  "salesforce|Salesforce (e-mail)|python etl/salesforce_email_sync.py"
)

# Sem argumento roda tudo menos o Salesforce, que tem agenda própria (3x/dia,
# logo depois de cada disparo do relatório).
if [ $# -gt 0 ]; then
  ESCOLHIDAS=("$@")
else
  ESCOLHIDAS=(cispay sympla contaazul contaazul_pagar meta omie sheets sheets_metas sheets_extras sheets_fechamento)
fi

executar() {
  local apelido="$1" rotulo="$2" cmd="$3"
  local inicio fim dur saida codigo
  inicio=$(date +%s)
  echo "── $rotulo ──"
  # 2>&1 para o erro entrar no log junto do resto; o timeout evita que uma API
  # pendurada segure o cron até o dia seguinte.
  # Teto por fonte: o Sympla percorre 81 eventos com pedidos e participantes
  # paginados e, sob rate limit da origem, passa de 30 min. Um teto único
  # mataria a carga no meio e o registro diria "erro" numa fonte saudável.
  local teto=1800
  case "$apelido" in
    sympla)     teto=5400 ;;
    salesforce) teto=3600 ;;
  esac
  saida=$(timeout "$teto" $COMPOSE run --rm --no-deps etl $cmd 2>&1)
  codigo=$?
  fim=$(date +%s); dur=$((fim - inicio))

  # Log inteiro só quando falha: em dia normal isso são centenas de linhas de
  # progresso que ninguém lê e que enchem o disco.
  if [ $codigo -eq 0 ]; then
    echo "$saida" | tail -3
    echo "   OK em ${dur}s"
    registrar "$apelido" "$rotulo" ok "$dur" ""
  else
    echo "$saida"
    echo "   FALHOU (código $codigo) em ${dur}s"
    registrar "$apelido" "$rotulo" erro "$dur" "codigo $codigo"
    FALHAS+=("$rotulo")
  fi
}

# Registra em integracao_status pela própria API, com o token de máquina — o
# mesmo caminho que os ETLs usam para gravar dado.
registrar() {
  local fonte="$1" rotulo="$2" status="$3" dur="$4" msg="$5"
  $COMPOSE run --rm --no-deps -T etl python - "$fonte" "$rotulo" "$status" "$dur" "$msg" <<'PY' >/dev/null 2>&1 || true
import sys, os
sys.path.insert(0, "etl")
from febrahub_cliente import registrar_status, carregar_env
carregar_env()
fonte, rotulo, status, dur, msg = sys.argv[1:6]
registrar_status(fonte, rotulo, status, duracao=float(dur or 0), mensagem=msg or None)
PY
}

FALHAS=()
echo "═══ sync $(date '+%Y-%m-%d %H:%M:%S %Z') — fontes: ${ESCOLHIDAS[*]} ═══"

for alvo in "${ESCOLHIDAS[@]}"; do
  achou=0
  for linha in "${FONTES[@]}"; do
    IFS='|' read -r apelido rotulo cmd <<<"$linha"
    if [ "$apelido" = "$alvo" ]; then
      executar "$apelido" "$rotulo" "$cmd"
      achou=1
      break
    fi
  done
  [ $achou -eq 0 ] && echo "!! fonte desconhecida: $alvo"
done

echo "═══ fim ═══"
if [ ${#FALHAS[@]} -gt 0 ]; then
  echo "falharam: ${FALHAS[*]}"
  exit 1
fi
echo "todas as fontes sincronizaram"
