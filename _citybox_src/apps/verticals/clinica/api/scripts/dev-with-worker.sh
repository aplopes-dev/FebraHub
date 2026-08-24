#!/usr/bin/env bash
set -uo pipefail

cd "$(dirname "$0")/.."

APP_DIR="$PWD"
PIDS=()

cleanup() {
  trap - EXIT INT TERM
  for pid in "${PIDS[@]:-}"; do
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  # Os supervisores rodam os workers em subprocessos próprios; mata por caminho absoluto
  # para não atingir workers homônimos de outras verticais.
  pkill -f "$APP_DIR/dist/src/main-worker.js" 2>/dev/null || true
  pkill -f "$APP_DIR/dist/src/main-whatsapp.js" 2>/dev/null || true
  wait 2>/dev/null || true
}

trap cleanup EXIT INT TERM

# mtime mais recente do dist — usado para detectar recompilação do nest --watch.
dist_stamp() {
  find dist/src -name '*.js' -printf '%T@\n' 2>/dev/null | sort -n | tail -1
}

# Mantém um worker vivo: reinicia se ele morrer (build quebrado, exceção no boot)
# e quando o nest recompila o dist. `node --watch` não serve aqui: se o processo
# quebra durante o carregamento dos módulos, ele nunca mais volta sozinho.
supervise_worker() {
  local entry="$1"
  local script="$APP_DIR/dist/src/${entry}.js"

  while true; do
    if [[ ! -f "$script" ]]; then
      sleep 1
      continue
    fi

    node "$script" &
    local child=$!
    local stamp
    stamp="$(dist_stamp)"

    while kill -0 "$child" 2>/dev/null; do
      sleep 2
      if [[ "$(dist_stamp)" != "$stamp" ]]; then
        echo "[clinica-api] ${entry}: dist recompilado — reiniciando worker"
        kill "$child" 2>/dev/null || true
        break
      fi
    done

    wait "$child" 2>/dev/null || true
    sleep 2
  done
}

wait_for_dist() {
  local entry="$1"
  echo "[clinica-api] aguardando dist/src/${entry}.js..."
  for _ in $(seq 1 120); do
    if [[ -f "dist/src/${entry}.js" ]]; then
      return 0
    fi
    sleep 0.5
  done
  # Não basta avisar e seguir: sem `set -e`, o `supervise_worker` entraria num laço de
  # `sleep 1` esperando um arquivo que nunca chega, e o worker sumiria SEM erro visível.
  # Foi assim que uma loja ficou presa em PROVISIONING sem ninguém entender por quê.
  {
    echo ""
    echo "  ╭─ [clinica-api] O WORKER NÃO VAI SUBIR ────────────────────────────────╮"
    echo "  │ dist/src/${entry}.js não foi gerado em 60s."
    echo "  │"
    echo "  │ Quase sempre é o \`nest start --watch\` falhando a compilar — role para"
    echo "  │ cima e procure \`error TS\`. Causa mais comum: cliente Prisma defasado"
    echo "  │ (\`generated/\` é gitignored, então some ao trocar de branch)."
    echo "  │"
    echo "  │ Conserto:  pnpm --filter @citybox/clinica-api db:generate"
    echo "  ╰───────────────────────────────────────────────────────────────────────╯"
    echo ""
  } >&2
  return 1
}

echo "[clinica-api] HTTP + worker (store-setup) + worker (whatsapp/baileys)"

# O cliente Prisma é gitignored. Depois de trocar de branch ou mexer no schema ele fica
# defasado, o `nest --watch` não compila, o dist não atualiza e o worker fica esperando
# para sempre um arquivo que nunca chega. Gerar aqui custa menos de 1s e elimina a causa
# mais comum de "o worker não sobe".
echo "[clinica-api] sincronizando cliente Prisma..."
if ! pnpm exec prisma generate --config prisma.config.ts >/dev/null 2>&1; then
  pnpm exec prisma generate --config prisma.config.ts 2>&1 || true
  echo "[clinica-api] prisma generate FALHOU — corrija o schema antes de seguir" >&2
  exit 1
fi

# Um único `nest --watch` compila o dist. Dois nest concorrentes com
# deleteOutDir=true apagam o dist um do outro e o worker nunca sobe.
pnpm exec nest start --watch &
PIDS+=("$!")

wait_for_dist main-worker
supervise_worker main-worker &
PIDS+=("$!")

if [[ "${CLINIC_WHATSAPP_ENABLED:-true}" == "false" ]]; then
  echo "[clinica-api] whatsapp worker desabilitado (CLINIC_WHATSAPP_ENABLED=false)"
else
  wait_for_dist main-whatsapp
  supervise_worker main-whatsapp &
  PIDS+=("$!")
fi

wait -n "${PIDS[@]}"
EXIT_CODE=$?
cleanup
exit "$EXIT_CODE"
