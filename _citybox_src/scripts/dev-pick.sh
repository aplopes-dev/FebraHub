#!/usr/bin/env bash
set -euo pipefail

# dev-pick.sh — sobe em dev local só os projetos escolhidos.
#
# Uso:
#   pnpm dev:pick                      # menu interativo (fzf se disponível, senão por número)
#   pnpm dev:pick admin-api erp food   # direto, por nome/atalho (sem prompt)
#   pnpm dev:pick --list               # só lista os alvos disponíveis
#
# Atalho de nome = parte após @citybox/ (ex.: "food-api"), ou um trecho
# único (ex.: "food" casa "food-api"). Aceita também o nome completo.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Carrega alvos (short<TAB>name) em arrays paralelos SHORTS/NAMES.
SHORTS=()
NAMES=()
while IFS=$'\t' read -r short name; do
  [[ -z "$short" ]] && continue
  SHORTS+=("$short")
  NAMES+=("$name")
done < <(node scripts/lib/list-dev-targets.mjs)

if [[ ${#NAMES[@]} -eq 0 ]]; then
  echo "Nenhum pacote com script \"dev\" encontrado." >&2
  exit 1
fi

print_list() {
  echo "Projetos disponíveis (dev local):"
  for i in "${!SHORTS[@]}"; do
    printf "  %2d) %-18s %s\n" "$((i + 1))" "${SHORTS[$i]}" "${NAMES[$i]}"
  done
}

if [[ "${1:-}" == "--list" || "${1:-}" == "-l" ]]; then
  print_list
  exit 0
fi

# Resolve um token (número, short exato, ou substring) para nomes de pacote.
resolve_token() {
  local token="$1"
  # número -> índice da lista
  if [[ "$token" =~ ^[0-9]+$ ]]; then
    local idx=$((token - 1))
    if [[ $idx -ge 0 && $idx -lt ${#NAMES[@]} ]]; then
      echo "${NAMES[$idx]}"
    else
      echo "  ! ignorando número fora da faixa: $token" >&2
    fi
    return
  fi
  # match exato por short ou name
  for i in "${!SHORTS[@]}"; do
    if [[ "${SHORTS[$i]}" == "$token" || "${NAMES[$i]}" == "$token" ]]; then
      echo "${NAMES[$i]}"
      return
    fi
  done
  # substring no short
  local hits=()
  for i in "${!SHORTS[@]}"; do
    [[ "${SHORTS[$i]}" == *"$token"* ]] && hits+=("${NAMES[$i]}")
  done
  if [[ ${#hits[@]} -eq 0 ]]; then
    echo "  ! nenhum alvo casa com: $token" >&2
  else
    printf '%s\n' "${hits[@]}"
  fi
}

SELECTED=()

if [[ $# -gt 0 ]]; then
  # Não-interativo: usa os argumentos como seleção.
  for token in "$@"; do
    while IFS= read -r name; do
      [[ -n "$name" ]] && SELECTED+=("$name")
    done < <(resolve_token "$token")
  done
elif command -v fzf >/dev/null 2>&1; then
  # Interativo com fzf (multi-seleção).
  chosen="$(node scripts/lib/list-dev-targets.mjs \
    | fzf --multi --delimiter='\t' --with-nth=1 \
        --prompt='subir> ' \
        --header=$'TAB/SHIFT-TAB marca múltiplos • ENTER confirma • ESC cancela' || true)"
  while IFS=$'\t' read -r _short name; do
    [[ -n "$name" ]] && SELECTED+=("$name")
  done < <(printf '%s\n' "$chosen")
else
  # Interativo sem fzf: lista numerada + leitura.
  print_list
  echo ""
  read -r -p "Números/nomes separados por espaço (ex: 1 3 5  ou  admin-api erp food): " -a tokens
  for token in "${tokens[@]}"; do
    while IFS= read -r name; do
      [[ -n "$name" ]] && SELECTED+=("$name")
    done < <(resolve_token "$token")
  done
fi

# Dedup preservando ordem.
UNIQUE=()
for name in "${SELECTED[@]}"; do
  skip=false
  for u in "${UNIQUE[@]}"; do [[ "$u" == "$name" ]] && skip=true && break; done
  $skip || UNIQUE+=("$name")
done

if [[ ${#UNIQUE[@]} -eq 0 ]]; then
  echo "Nada selecionado. Saindo." >&2
  exit 1
fi

FILTERS=()
for name in "${UNIQUE[@]}"; do
  FILTERS+=("--filter=$name")
done

echo "▶ subindo: ${UNIQUE[*]}"
echo "  turbo run dev ${FILTERS[*]}"

# DEV_PICK_DRY=1 mostra o comando e sai (sem subir o turbo) — útil em testes.
if [[ "${DEV_PICK_DRY:-}" == "1" ]]; then
  exit 0
fi

exec pnpm exec turbo run dev "${FILTERS[@]}"
