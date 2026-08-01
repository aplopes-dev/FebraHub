#!/usr/bin/env python3
"""
FebraHub · Conta Azul (v2) -> API FebraHub — Contas a Receber

O QUE ESTA FONTE DESTRAVA:
A CisPay dava o caixa de CARTÃO. A Conta Azul dá o caixa COMPLETO —
tudo que a Febracis tem a receber, de qualquer forma de pagamento —
mais o que o Salesforce nunca teve: DATA DE VENCIMENTO. Com ela, a
inadimplência real (vencido e não pago) finalmente é calculável.

O PROBLEMA DO TOKEN (por que você voltava no Postman):
A API v2 da Conta Azul ROTACIONA o refresh_token a cada renovação —
o antigo morre. Se o script não gravar o novo, funciona uma vez e
quebra. Aqui o token vive na tabela integracao_tokens: o script lê
pela API (GET /ingest/token/contaazul), renova, e grava o novo de
volta (POST /ingest/integracao_tokens). Nunca mais Postman.

AUTORIZAÇÃO INICIAL (uma vez, manual):
OAuth2 Authorization Code exige um humano autorizar no navegador uma
vez. Faça isso no Postman ou na extensão Chrome da Conta Azul, pegue
o primeiro refresh_token, e rode:
    python contaazul_sync.py --semear-token SEU_REFRESH_TOKEN
Isso grava o token inicial no banco. Depois, o script se vira.

Uso:
    pip install requests

    # .env (no .gitignore!):
    #   CONTAAZUL_CLIENT_ID=...
    #   CONTAAZUL_CLIENT_SECRET=...
    #   FEBRAHUB_API_URL=...
    #   FEBRAHUB_ETL_TOKEN=...

    python contaazul_sync.py --semear-token <refresh_token_inicial>
    python contaazul_sync.py --diagnostico
    python contaazul_sync.py --sync --desde 2024-01-01
"""

import argparse
import base64
import json
import os
import sys
import time
from datetime import date, datetime, timezone
from typing import Any, Dict, Iterator, List

import requests

import febrahub_cliente as fc

fc.carregar_env()


AUTH_URL = "https://auth.contaazul.com/oauth2/token"
BASE = "https://api-v2.contaazul.com"
ENDPOINT = "/v1/financeiro/eventos-financeiros/contas-a-receber/buscar"
TAM_PAGINA = 100
TIMEOUT = 60
LIMITE = fc.LIMITE
INTEGRACAO = "contaazul"


# ============================================================
# Token — guardado na API, não em arquivo
# ============================================================

def token_ler() -> Any:
    return fc.ler_token(INTEGRACAO)


def token_gravar(access: str, refresh: str, expira_em: str) -> None:
    fc.gravar_token(INTEGRACAO, {
        "access_token": access,
        "refresh_token": refresh,     # o NOVO — o antigo já morreu
        "expira_em": expira_em,
    })


# ============================================================
# OAuth2 — refresh com rotação
# ============================================================

def _basic() -> str:
    cid = os.environ.get("CONTAAZUL_CLIENT_ID")
    sec = os.environ.get("CONTAAZUL_CLIENT_SECRET")
    if not cid or not sec:
        sys.exit("Faltam CONTAAZUL_CLIENT_ID / CONTAAZUL_CLIENT_SECRET no .env")
    return base64.b64encode(f"{cid}:{sec}".encode()).decode()


def access_token_valido() -> str:
    """Lê o token pela API; se expirado (ou quase), renova e grava o novo."""
    reg = token_ler()
    if not reg:
        sys.exit("Sem token no banco. Rode --semear-token <refresh_token> primeiro.")

    # margem de 5 min antes de expirar
    if reg.get("access_token") and reg.get("expira_em"):
        exp = datetime.fromisoformat(reg["expira_em"].replace("Z", "+00:00"))
        if (exp - datetime.now(timezone.utc)).total_seconds() > 300:
            return reg["access_token"]

    return _renovar(reg["refresh_token"])


def _renovar(refresh_token: str) -> str:
    r = requests.post(
        AUTH_URL,
        headers={
            "Authorization": f"Basic {_basic()}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={"grant_type": "refresh_token", "refresh_token": refresh_token},
        timeout=TIMEOUT,
    )
    if r.status_code >= 300:
        raise RuntimeError(
            f"Refresh falhou: {r.status_code}\n{r.text[:300]}\n"
            "Se for invalid_grant, o refresh token expirou de vez — "
            "refaça a autorização no navegador e rode --semear-token."
        )
    d = r.json()
    # A v2 devolve um refresh_token NOVO. Gravar, senão o próximo run quebra.
    novo_refresh = d.get("refresh_token", refresh_token)
    expira = datetime.now(timezone.utc).timestamp() + int(d.get("expires_in", 3600))
    expira_iso = datetime.fromtimestamp(expira, timezone.utc).isoformat()
    token_gravar(d["access_token"], novo_refresh, expira_iso)
    return d["access_token"]


def semear(refresh_token: str) -> None:
    """Grava o primeiro refresh token (obtido manualmente) e testa a renovação."""
    token_gravar("", refresh_token, datetime.now(timezone.utc).isoformat())
    print("Token semeado. Testando renovação…")
    _renovar(refresh_token)
    print("OK — refresh funciona e o novo token foi salvo no banco.")


# ============================================================
# Mapeamento — nomes CRUS confirmados via --diagnostico
# (deixados como candidatos; o diagnóstico revela os reais)
# ============================================================

MAPA: Dict[str, List[str]] = {
    "parcela_id":       ["id"],
    "evento_id":        ["evento_id", "id_evento"],
    "descricao":        ["descricao"],
    "cliente":          ["cliente.nome"],          # muitas vêm null (lançamento interno)

    "data_vencimento":  ["data_vencimento"],
    "data_competencia": ["data_competencia"],
    "data_alteracao":   ["data_alteracao"],        # proxy de data de baixa
    "status":           ["status_traduzido"],      # legível: RECEBIDO / EM_ABERTO
    "status_cru":       ["status"],                # ACQUITTED / PENDING

    "valor":            ["total"],
    "pago":             ["pago"],
    "nao_pago":         ["nao_pago"],

    "categoria":        ["categorias[0].nome"],
    "centro_custo":     ["centros_de_custo[0].nome"],
}

OBRIG = ["parcela_id", "valor", "data_vencimento"]
NUMERICOS = ["valor", "pago", "nao_pago"]
DATAS = ["data_vencimento", "data_competencia", "data_alteracao"]

# status crus da API (o status_traduzido nem sempre chega no lote)
RECEBIDOS = {"ACQUITTED", "PAID", "SETTLED"}      # quitado
VENCIDOS = {"OVERDUE"}                             # vencido e não pago = inadimplência


def montar(reg: Dict[str, Any]) -> Dict[str, Any]:
    f = fc.achatar(reg)
    l = {d: fc.resolver(f, c) for d, c in MAPA.items()}
    for c in NUMERICOS:
        l[c] = fc.num(l.get(c))
    for c in DATAS:
        l[c] = fc.data(l.get(c))

    status_cru = (l.get("status_cru") or "").upper()
    pago_val = l.get("pago") or 0

    # Recebido: status ACQUITTED, ou tem valor pago.
    recebido = status_cru in RECEBIDOS or pago_val > 0
    l["data_pagamento"] = l.get("data_alteracao") if recebido else None
    l["valor_pago"] = pago_val if pago_val > 0 else None

    # status legível para a UI (deriva do cru, que é confiável)
    l["status"] = {
        "ACQUITTED": "Recebido",
        "OVERDUE":   "Vencido",
        "PENDING":   "A vencer",
        "PARTIAL":   "Parcial",
    }.get(status_cru, l.get("status") or status_cru)

    l["conta_financeira"] = None
    l.pop("status_cru", None)
    l.pop("data_alteracao", None)
    l.pop("pago", None)
    l.pop("nao_pago", None)
    return l


# ============================================================
# API Conta Azul
# ============================================================

def buscar(desde: str, ate: str) -> Iterator[Dict[str, Any]]:
    token = access_token_valido()
    pagina = 1
    while True:
        r = requests.get(
            f"{BASE}{ENDPOINT}",
            headers={"Authorization": f"Bearer {token}"},
            params={
                "pagina": pagina,
                "tamanho_pagina": TAM_PAGINA,
                "data_vencimento_de": desde,
                "data_vencimento_ate": ate,
            },
            timeout=TIMEOUT,
        )
        if r.status_code == 401:
            # token expirou no meio — renova uma vez e retoma
            token = access_token_valido()
            continue
        if r.status_code == 429:
            time.sleep(5)
            continue
        r.raise_for_status()

        corpo = r.json()
        itens = corpo.get("itens") or corpo.get("data") or corpo.get("content") or []
        if isinstance(corpo, list):
            itens = corpo
        if not itens:
            return
        for it in itens:
            yield it
        if len(itens) < TAM_PAGINA:
            return
        pagina += 1
        time.sleep(0.3)


# ============================================================
# Diagnóstico
# ============================================================

def diagnosticar() -> None:
    hoje = date.today().isoformat()
    inicio = date.today().replace(year=date.today().year - 1).isoformat()
    amostra = [fc.achatar(r) for i, r in enumerate(buscar(inicio, hoje)) if i < 200]

    print(f"\nCONTAS A RECEBER · {len(amostra)} registros\n" + "=" * 62)
    if not amostra:
        print("Nada retornado no período. Sem contas a receber no último ano?")
        return

    fc.diagnostico(amostra, MAPA, limite=LIMITE, largura=20)

    print("\n-- EXEMPLO CRU --")
    print(json.dumps(amostra[0], indent=2, ensure_ascii=False)[:2200])


# ============================================================
# Sync
# ============================================================

def sincronizar(desde: str) -> None:
    ate = date.today().replace(year=date.today().year + 2).isoformat()  # inclui futuro
    linhas = [montar(r) for r in buscar(desde, ate)]
    print(f"\n{len(linhas)} parcelas de contas a receber")
    fc.validar(linhas, OBRIG, limite=LIMITE, dica="Rode --diagnostico e ajuste o MAPA.")

    total = sum(l["valor"] or 0 for l in linhas)
    recebido = sum(1 for l in linhas if l.get("data_pagamento"))
    a_receber = sum(l["valor"] or 0 for l in linhas if not l.get("data_pagamento"))
    print(f"Total     R$ {total:>14,.2f}")
    print(f"Recebidas {recebido}/{len(linhas)}")
    print(f"A receber R$ {a_receber:>14,.2f}\n")

    fc.upsert("fato_contas_receber", linhas, "parcela_id")
    print("OK.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--semear-token", metavar="REFRESH_TOKEN",
                    help="grava o refresh token inicial (obtido manualmente uma vez)")
    ap.add_argument("--diagnostico", action="store_true")
    ap.add_argument("--sync", action="store_true")
    ap.add_argument("--desde", default="2024-01-01", help="data de vencimento inicial")
    a = ap.parse_args()

    if a.semear_token:
        semear(a.semear_token)
    elif a.diagnostico:
        diagnosticar()
    elif a.sync:
        sincronizar(a.desde)
    else:
        ap.print_help()