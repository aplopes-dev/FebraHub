#!/usr/bin/env python3
"""
FebraHub · Sympla -> API FebraHub

CAUSA RAIZ DO BUG (resolvida):
O Power Query renomeia as colunas depois de importar:
    Table.RenameColumns(..., {{"buyer_email", "email_comprador"}, ...})
O mapper antigo foi escrito com os nomes FINAIS do Power BI
("valor_total", "comprador_email") em vez dos nomes CRUS da API
("order_total_sale_price", "buyer_email"). O .get() nao achava,
devolvia None, e o insert gravava NULL. Sem erro. Sem log.

Os nomes abaixo foram CONFIRMADOS por --diagnostico (93 registros).

Uso:
    pip install requests

    # .env na mesma pasta (e no .gitignore!):
    #   SYMPLA_TOKEN=...
    #   FEBRAHUB_API_URL=https://febracis.aplopes.com/api
    #   FEBRAHUB_ETL_TOKEN=...     <- token de maquina, so abre /ingest

    python sympla_sync.py --diagnostico
    python sympla_sync.py --sync
"""

import argparse
import os
import sys
import time
from typing import Any, Dict, Iterator, List

import requests

import febrahub_cliente as fc

fc.carregar_env()

SYMPLA_BASE = "https://api.sympla.com.br/public/v1.5.1"
TIMEOUT = 30
PAGE_SIZE = 100
LIMITE_PREENCHIMENTO = fc.LIMITE  # <50% num campo obrigatorio = mapeamento errado


# ============================================================
# 1. Mapeamento — CONFIRMADO pelo diagnostico, nao chutado
#    (o achatamento — o que o Power Query faz e o Python nao —
#     mora em febrahub_cliente.achatar)
# ============================================================

MAPA_PEDIDOS: Dict[str, List[str]] = {
    "pedido_id":               ["id"],                          # 100%
    "evento_id":               ["event_id"],                    # 100%
    "status_pedido":           ["order_status"],                # 100%
    "data_pedido":             ["order_date"],                  # 100%
    "data_atualizacao_pedido": ["updated_date"],                # 100%
    "data_aprovacao_pedido":   ["approved_date"],               # 100%

    "valor_total":             ["order_total_sale_price"],      # 100% <- ERA O BUG
    "comprador_email":         ["buyer_email"],                 # 100% <- ERA O BUG
    "comprador_nome":          ["buyer_first_name"],            # 100%
    "comprador_sobrenome":     ["buyer_last_name"],             # 100%

    # Bruto - liquido = taxa do Sympla (~12,5%).
    # R$19,90 vendido = R$17,40 recebido. Sem isto o Financeiro
    # conta receita que nunca entrou no caixa.
    "valor_liquido":           ["order_total_net_value"],       # 100%
    "forma_pagamento":         ["transaction_type"],            # 100%

    # CPF: chave mais forte do banco. Liga comprador de palestra
    # (R$19,90) a aluno GGB (R$1.900) via dim_alunos.cpf.
    # TEXT, sempre. Virar numero mata o zero a esquerda.
    "comprador_documento":      ["invoice_info.doc_number"],    # 66%
    "comprador_documento_tipo": ["invoice_info.doc_type"],      # 66%

    "utm_source":              ["utm.utm_source"],              # 23%
    "utm_medium":              ["utm.utm_medium"],              # 23%
    "utm_campaign":            ["utm.utm_campaign"],            # 23%
}

MAPA_PARTICIPANTES: Dict[str, List[str]] = {
    "participante_id":         ["id"],                          # 100%
    "evento_id":               ["event_id"],                    # 100%
    "pedido_id":               ["order_id"],                    # 100%
    "status_pedido":           ["order_status"],                # 100%
    "data_pedido":             ["order_date"],                  # 100%
    "data_atualizacao_pedido": ["order_updated_date"],          # 100%
    "data_aprovacao_pedido":   ["order_approved_date"],         # 100%
    "numero_ingresso":         ["ticket_number"],               # 100%
    "qr_code_ingresso":        ["ticket_num_qr_code"],          # 100%
    "tipo_ingresso":           ["ticket_name"],                 # 100%
    "valor_ingresso":          ["ticket_sale_price"],           # 100%
    "check_in":                ["checkin.check_in"],            # 100%
    "desconto":                ["order_discount"],              # 100%

    # 4%, e NAO e bug: o Sympla so coleta dados do COMPRADOR.
    # O formulario do participante quase nunca e preenchido.
    # Participante = ingresso. Comprador = pessoa (em fato_pedidos).
    "nome_participante":       ["first_name"],                  # 4%
    "email_participante":      ["email"],                       # 4%
}

OBRIGATORIOS_PEDIDOS = [
    "pedido_id", "evento_id", "valor_total", "valor_liquido", "comprador_email",
]
OBRIGATORIOS_PARTICIPANTES = [
    "participante_id", "evento_id", "pedido_id", "valor_ingresso",
]


# ============================================================
# 2. Cliente Sympla
# ============================================================

def sympla_get(caminho: str, token: str) -> Iterator[Dict[str, Any]]:
    pagina = 1
    while True:
        r = requests.get(
            f"{SYMPLA_BASE}{caminho}",
            headers={"s_token": token, "Content-Type": "application/json"},
            params={"page": pagina, "page_size": PAGE_SIZE},
            timeout=TIMEOUT,
        )
        if r.status_code == 429:
            time.sleep(5)
            continue
        if r.status_code == 404:
            return
        r.raise_for_status()
        corpo = r.json()
        dados = corpo.get("data") or []
        if not dados:
            return
        for d in dados:
            yield d
        if not (corpo.get("pagination") or {}).get("has_next"):
            return
        pagina += 1
        time.sleep(0.3)


def listar_eventos(token: str) -> List[Dict[str, Any]]:
    return list(sympla_get("/events", token))


# ============================================================
# 3. Diagnostico
# ============================================================

def diagnosticar(token: str, limite_eventos: int = 3) -> None:
    eventos = listar_eventos(token)
    print(f"\n{len(eventos)} eventos. Amostrando {limite_eventos}.\n")

    for rotulo, caminho, mapa in [
        ("PEDIDOS", "/events/{eid}/orders", MAPA_PEDIDOS),
        ("PARTICIPANTES", "/events/{eid}/participants", MAPA_PARTICIPANTES),
    ]:
        amostra: List[Dict[str, Any]] = []
        for ev in eventos[:limite_eventos]:
            try:
                for i, reg in enumerate(sympla_get(caminho.format(eid=ev.get("id")), token)):
                    amostra.append(fc.achatar(reg))
                    if i >= 30:
                        break
            except requests.HTTPError as e:
                print(f"  (evento {ev.get('id')}: {e})")

        print("=" * 62)
        print(f"{rotulo} — {len(amostra)} registros")
        print("=" * 62)
        if not amostra:
            print("  Nenhum registro.\n")
            continue

        fc.diagnostico(amostra, mapa, limite=LIMITE_PREENCHIMENTO,
                       largura=26, mostrar_origem=True)
        print()


# ============================================================
# 4. Sync
# ============================================================

def sincronizar(token: str) -> None:
    # Falha cedo se faltar credencial da API, antes de bater no Sympla.
    fc._credenciais()
    eventos = listar_eventos(token)
    print(f"{len(eventos)} eventos.\n")

    fc.upsert("dim_eventos", [
        {
            "evento_id":     str(e.get("id")),
            "id_referencia": e.get("reference_id"),
            "nome_evento":   e.get("name"),
            "data_inicio":   e.get("start_date"),
            "data_final":    e.get("end_date"),
            "local_evento":  (e.get("address") or {}).get("name"),
            "endereco":      (e.get("address") or {}).get("address"),
            "bairro":        (e.get("address") or {}).get("neighborhood"),
            "cidade":        (e.get("address") or {}).get("city"),
        }
        for e in eventos
    ], "evento_id")

    pedidos: List[Dict] = []
    participantes: List[Dict] = []

    for n, e in enumerate(eventos, 1):
        eid = str(e.get("id"))
        print(f"  [{n}/{len(eventos)}] {e.get('name', eid)[:45]}")

        for reg in sympla_get(f"/events/{eid}/orders", token):
            linha = {d: fc.resolver(fc.achatar(reg), c) for d, c in MAPA_PEDIDOS.items()}
            linha["evento_id"] = linha.get("evento_id") or eid
            linha["moeda"] = "BRL"  # nao existe no payload; Sympla e BRL
            pedidos.append(linha)

        for reg in sympla_get(f"/events/{eid}/participants", token):
            linha = {d: fc.resolver(fc.achatar(reg), c) for d, c in MAPA_PARTICIPANTES.items()}
            linha["evento_id"] = linha.get("evento_id") or eid
            participantes.append(linha)

    print(f"\n{len(pedidos)} pedidos · {len(participantes)} participantes")

    # aborta_vazio=False: evento sem pedido nenhum e normal (evento novo);
    # o que nao pode e gravar 5.000 pedidos com valor_total NULL.
    fc.validar(pedidos, OBRIGATORIOS_PEDIDOS, limite=LIMITE_PREENCHIMENTO,
               rotulo="fato_pedidos", aborta_vazio=False)
    fc.validar(participantes, OBRIGATORIOS_PARTICIPANTES, limite=LIMITE_PREENCHIMENTO,
               rotulo="fato_participantes", aborta_vazio=False)

    cpf = sum(1 for p in pedidos if not fc.vazio(p.get("comprador_documento")))
    bruto = sum(float(p["valor_total"] or 0) for p in pedidos)
    liquido = sum(float(p["valor_liquido"] or 0) for p in pedidos)
    print(f"CPF do comprador: {cpf}/{len(pedidos)} ({cpf/max(len(pedidos),1):.0%})"
          "  <- chave da ponte evento->aluno")
    print(f"Bruto R$ {bruto:,.2f} · Liquido R$ {liquido:,.2f} "
          f"· Taxa Sympla R$ {bruto - liquido:,.2f} "
          f"({(bruto - liquido)/max(bruto, 1):.1%})\n")

    fc.upsert("fato_pedidos", pedidos, "pedido_id")
    fc.upsert("fato_participantes", participantes, "participante_id")
    print("\nOK.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--diagnostico", action="store_true")
    ap.add_argument("--sync", action="store_true")
    args = ap.parse_args()

    tok = os.environ.get("SYMPLA_TOKEN")
    if not tok:
        sys.exit("Falta SYMPLA_TOKEN. Crie um .env na mesma pasta do script.")

    if args.diagnostico:
        diagnosticar(tok)
    elif args.sync:
        sincronizar(tok)
    else:
        ap.print_help()
