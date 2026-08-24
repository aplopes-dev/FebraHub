#!/usr/bin/env bash
set -euo pipefail

_DEPLOY_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${_DEPLOY_LIB_DIR}/common.sh"

check_http() {
  local label="$1"
  local url="$2"
  local expected="${3:-200}"
  local code
  # curl -f falha em connection refused e escreve http_code=000; não concatenar echo.
  code="$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "${url}" 2>/dev/null || true)"
  if [[ -z "${code}" || "${code}" == "000" ]]; then
    code="000"
  fi
  if [[ "${code}" == "${expected}" ]] || [[ "${expected}" == "200/307" && ("${code}" == "200" || "${code}" == "307") ]]; then
    echo "  ✓ ${label} → ${code}"
    return 0
  fi
  echo "  ✗ ${label} → ${code} (esperado ${expected})" >&2
  return 1
}

# Aguarda endpoint HTTP ficar pronto (cold start Nest pode passar de sleep fixo).
wait_http() {
  local label="$1"
  local url="$2"
  local expected="${3:-200}"
  local attempts="${4:-24}"
  local i code
  for i in $(seq 1 "${attempts}"); do
    code="$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "${url}" 2>/dev/null || true)"
    if [[ "${code}" == "${expected}" ]] || [[ "${expected}" == "200/307" && ("${code}" == "200" || "${code}" == "307") ]]; then
      return 0
    fi
    sleep 2
  done
  echo "  · ${label} ainda não respondeu após $((attempts * 2))s (último=${code:-000})" >&2
  return 1
}

run_health_checks() {
  log "Health checks"
  local failed=0

  wait_http "admin-api" "http://127.0.0.1:3103/api/health" "200" 24 || true
  wait_http "fiscal-api" "http://127.0.0.1:3121/api/health" "200" 36 || true
  wait_http "clinica-api" "http://127.0.0.1:3172/api/health" "200" 24 || true
  wait_http "imoveis-api" "http://127.0.0.1:3112/api/health" "200" 24 || true

  curl -sf http://127.0.0.1:3103/api/health | head -c 200 || failed=1
  echo ""

  check_http "admin-api" "http://127.0.0.1:3103/api/health" "200" || failed=1
  check_http "admin-web" "http://127.0.0.1:3108/" "200/307" || failed=1
  check_http "erp-web" "http://127.0.0.1:3107/login" "200" || failed=1
  check_http "erp-api" "http://127.0.0.1:3114/api/health" "200" || failed=1
  check_http "fiscal-api" "http://127.0.0.1:3121/api/health" "200" || failed=1
  check_http "clinica-api" "http://127.0.0.1:3172/api/health" "200" || failed=1
  if docker ps --format '{{.Names}}' | grep -qx clinica_api_worker; then
    echo "  ✓ clinica-api-worker → running"
  else
    echo "  ✗ clinica-api-worker → container não está rodando" >&2
    failed=1
  fi
  wait_http "clinica-web" "http://127.0.0.1:3113/login" "200" 36 || true
  check_http "clinica-web" "http://127.0.0.1:3113/login" "200" || failed=1
  check_http "imoveis-api" "http://127.0.0.1:3112/api/health" "200" || failed=1
  wait_http "imoveis-web" "http://127.0.0.1:3111/" "200/307" 36 || true
  check_http "imoveis-web" "http://127.0.0.1:3111/" "200/307" || failed=1
  local realm
  for realm in citybox-admin citybox-erp citybox-clinica citybox-beautiful citybox-imoveis citybox-marketplace; do
    check_http "keycloak local/${realm}" "${KEYCLOAK_URL:-http://127.0.0.1:8080}/realms/${realm}" "200" || failed=1
    check_http "auth HTTPS/${realm}" "${AUTH_PUBLIC_URL:-https://auth.aplopes.com}/realms/${realm}" "200" || failed=1
  done
  check_http "admin HTTPS" "${ADMIN_ORIGIN:-https://admin.aplopes.com}/" "200/307" || failed=1
  check_http "erp-web HTTPS" "${BACKOFFICE_ORIGIN:-https://backoffice.aplopes.com}/login" "200" || failed=1
  check_http "clinica-web HTTPS" "${CLINICA_ORIGIN:-https://clinica.aplopes.com}/login" "200" || failed=1
  check_http "imoveis-web HTTPS" "${IMOVEIS_ORIGIN:-https://imoveis.aplopes.com}/" "200/307" || failed=1

  if [[ "${failed}" -ne 0 ]]; then
    die "Um ou mais health checks falharam"
  fi

  log "Todos os health checks passaram"
}

# Health checks do deploy parcial clínica (API + worker + ERP/backoffice).
run_clinic_health_checks() {
  log "Health checks (clínica)"
  local failed=0

  wait_http "clinica-api" "http://127.0.0.1:3172/api/health" "200" 24 || true

  check_http "clinica-api" "http://127.0.0.1:3172/api/health" "200" || failed=1
  if docker ps --format '{{.Names}}' | grep -qx clinica_api_worker; then
    echo "  ✓ clinica-api-worker → running"
  else
    echo "  ✗ clinica-api-worker → container não está rodando" >&2
    failed=1
  fi
  wait_http "clinica-web" "http://127.0.0.1:3113/login" "200" 36 || true
  check_http "clinica-web" "http://127.0.0.1:3113/login" "200" || failed=1
  check_http "clinica-web HTTPS" "${CLINICA_ORIGIN:-https://clinica.aplopes.com}/login" "200" || failed=1
  check_http "erp-web (ERP)" "http://127.0.0.1:3107/login" "200" || failed=1
  check_http "erp-web HTTPS" "${BACKOFFICE_ORIGIN:-https://backoffice.aplopes.com}/login" "200" || failed=1

  if [[ "${failed}" -ne 0 ]]; then
    die "Um ou mais health checks da clínica falharam"
  fi

  log "Health checks da clínica passaram"
}

# Health checks do deploy parcial admin + clínica + imóveis.
# Respeita flags exportadas pelo script: DEPLOY_ADMIN/CLINICA/IMOVEIS, _API_ONLY, _WEB_ONLY.
run_imoveis_admin_clinica_health_checks() {
  log "Health checks (admin + clínica + imóveis)"
  local failed=0
  local deploy_admin="${DEPLOY_ADMIN:-true}"
  local deploy_clinica="${DEPLOY_CLINICA:-true}"
  local deploy_imoveis="${DEPLOY_IMOVEIS:-true}"
  local api_only="${_API_ONLY:-false}"
  local web_only="${_WEB_ONLY:-false}"
  # Com --api-only não checamos webs; com --web-only não checamos APIs.
  local check_apis=true
  local check_webs=true
  if [[ "${api_only}" == true ]]; then
    check_webs=false
  fi
  if [[ "${web_only}" == true ]]; then
    check_apis=false
  fi

  if [[ "${deploy_admin}" == true && "${check_apis}" == true ]]; then
    wait_http "admin-api" "http://127.0.0.1:3103/api/health" "200" 24 || true
  fi
  if [[ "${deploy_clinica}" == true && "${check_apis}" == true ]]; then
    wait_http "clinica-api" "http://127.0.0.1:3172/api/health" "200" 24 || true
  fi
  if [[ "${deploy_imoveis}" == true && "${check_apis}" == true ]]; then
    wait_http "imoveis-api" "http://127.0.0.1:3112/api/health" "200" 24 || true
  fi

  if [[ "${deploy_admin}" == true ]]; then
    if [[ "${check_apis}" == true ]]; then
      check_http "admin-api" "http://127.0.0.1:3103/api/health" "200" || failed=1
    fi
    if [[ "${check_webs}" == true ]]; then
      check_http "admin-web" "http://127.0.0.1:3108/" "200/307" || failed=1
      check_http "admin HTTPS" "${ADMIN_ORIGIN:-https://admin.aplopes.com}/" "200/307" || failed=1
    fi
  fi

  if [[ "${deploy_clinica}" == true ]]; then
    if [[ "${check_apis}" == true ]]; then
      check_http "clinica-api" "http://127.0.0.1:3172/api/health" "200" || failed=1
      if docker ps --format '{{.Names}}' | grep -qx clinica_api_worker; then
        echo "  ✓ clinica-api-worker → running"
      else
        echo "  ✗ clinica-api-worker → container não está rodando" >&2
        failed=1
      fi
    fi
    if [[ "${check_webs}" == true ]]; then
      wait_http "clinica-web" "http://127.0.0.1:3113/login" "200" 36 || true
      check_http "clinica-web" "http://127.0.0.1:3113/login" "200" || failed=1
      check_http "clinica-web HTTPS" "${CLINICA_ORIGIN:-https://clinica.aplopes.com}/login" "200" || failed=1
    fi
  fi

  if [[ "${deploy_imoveis}" == true ]]; then
    if [[ "${check_apis}" == true ]]; then
      check_http "imoveis-api" "http://127.0.0.1:3112/api/health" "200" || failed=1
    fi
    if [[ "${check_webs}" == true ]]; then
      wait_http "imoveis-web" "http://127.0.0.1:3111/" "200/307" 36 || true
      check_http "imoveis-web" "http://127.0.0.1:3111/" "200/307" || failed=1
      check_http "imoveis-web HTTPS" "${IMOVEIS_ORIGIN:-https://imoveis.aplopes.com}/" "200/307" || failed=1
    fi
  fi

  if [[ "${failed}" -ne 0 ]]; then
    die "Um ou mais health checks falharam"
  fi

  log "Health checks passaram (admin + clínica + imóveis)"
}
