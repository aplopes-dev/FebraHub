#!/usr/bin/env python3
"""
FebraHub · CisPay v2 -> API FebraHub

POR QUE MUDOU DE ENDPOINT:
A v1 usava /services/payments, onde `amount` e um numero que ninguem
soube explicar — vendas a vista liquidavam 75% do valor com MDR de 3%.
Nao fechava por 25%, e KPI de caixa em cima disso seria ficcao.

/services/schedules-ex entrega os tres numeros SEPARADOS:
    valor_bruto  ·  valor_liquido  ·  taxa_cispay
Sem calculo, sem inferencia, sem misterio.

/services/checking-account e o extrato bancario real
(entry_gross_amount / entry_net_amount). E a fonte de verdade contra
a qual todo o resto se valida. ~170 linhas, sem paginacao, sem month.

DETALHE DO PAYLOAD (visto no seu Power Query):
O campo mdr vem "2.99" em alguns registros e "2,99" em outros —
formato inconsistente na propria API. Voce corrigia isso a mao no BI
com Table.ReplaceValue. Aqui num() trata os dois.

O CPF:
Seu M usa Table.SelectColumns e DESCARTA tudo que nao foi listado.
Se o CPF do comprador vier no payload, ele nunca chegou ao BI.
O --diagnostico lista TODAS as chaves cruas — e o CPF e a mesma chave
que ja funcionou a 74% no Sympla, ligando em dim_alunos.doc_norm.

Uso:
    python cispay_sync.py --diagnostico
    python cispay_sync.py --sync --meses 24
    python cispay_sync.py --extrato
"""

import argparse
import json
import os
import sys
import time
from collections import Counter
from datetime import date
from typing import Any, Dict, Iterator, List

import requests

# Cliente comum: HTTP para a API, .env e os helpers de conversão.
# Antes cada script tinha a sua cópia — e um bug corrigido aqui não chegava lá.
import febrahub_cliente as fc

fc.carregar_env()


ENDPOINT = "/services/schedules-ex"
CHAVE_LISTA = "schedules"
EXTRATO = "/services/checking-account"
PAGE_SIZE = 1000
TIMEOUT = 60
LIMITE = fc.LIMITE

SUBSELLERS = ["5618b38a-70cb-473c-b77e-6950c1475b4f"]


# ============================================================
# Mapeamento — schedules-ex
# ============================================================

MAPA: Dict[str, List[str]] = {
    "parcela_id":          ["schedule_id"],
    "pagamento_cartao_id": ["PaymentId", "payment_id"],
    "subseller_id":        ["subsellerId", "subseller_id"],

    "data_venda":          ["data_venda"],
    "data_liquidacao":     ["data_liquidacao"],   # quando o dinheiro cai

    "forma_pagamento":     ["forma"],
    "tipo_transacao":      ["tipo"],              # Credit / Refund / Chargeback
    "bandeira":            ["brand"],

    # Os TRES, separados pela propria API. Sem calculo, sem misterio.
    "valor_bruto":         ["valor_bruto"],
    "valor_liquido":       ["valor_liquido"],
    "taxa_cispay":         ["taxa_cispay"],
    "pct_mdr":             ["mdr"],

    "numero_parcela":      ["parcela"],
    "total_parcelas":      ["num_parcelas"],

    "nsu":                 ["nsu"],
    "autorizacao":         ["autorizacao"],
    "cartao_mascarado":    ["cartao"],

    # A PONTE — 100% preenchida, e o Table.SelectColumns do Power Query
    # a descartava. E o ID da venda no Salesforce: o mesmo
    # original_id_venda de fato_pagamento_base.
    # Liquidacao -> venda -> matricula -> curso -> consultor.
    # Exata. Nao estatistica. Sem depender de CPF nem telefone.
    "cod_salesforce":      ["cod_salesforce"],
    "link_salesforce":     ["link_salesforce"],

    # Chave secundaria: CPF (91%), caso cod_salesforce falhe.
    "documento":           ["doc_cliente"],
    "nome_portador":       ["nome_cliente"],
}

OBRIGATORIOS = [
    "parcela_id", "pagamento_cartao_id", "data_venda",
    "data_liquidacao", "valor_liquido", "cod_salesforce",
]
NUMERICOS = ["valor_bruto", "valor_liquido", "taxa_cispay", "pct_mdr"]
INTEIROS = ["numero_parcela", "total_parcelas"]


def montar(reg: Dict[str, Any]) -> Dict[str, Any]:
    f = fc.achatar(reg)
    l = {d: fc.resolver(f, c) for d, c in MAPA.items()}
    for c in NUMERICOS:
        l[c] = fc.num(l.get(c))
    for c in INTEIROS:
        try:
            l[c] = int(l[c]) if not fc.vazio(l.get(c)) else None
        except (TypeError, ValueError):
            l[c] = None
    l["doc_norm"] = fc.so_digitos(l.get("documento"))
    return l


# ============================================================
# Cliente
# ============================================================

def _cred() -> tuple:
    k = os.environ.get("CISPAY_API_KEY")
    b = os.environ.get("CISPAY_BASE_URL")
    if not k or not b:
        sys.exit("Faltam CISPAY_API_KEY / CISPAY_BASE_URL no .env")
    return k, b.rstrip("/")


def meses(qtd: int) -> List[str]:
    hoje = date.today()
    saida, ano, mes = [], hoje.year, hoje.month
    for _ in range(qtd):
        saida.append(f"{ano:04d}-{mes:02d}")
        mes -= 1
        if mes == 0:
            mes, ano = 12, ano - 1
    return sorted(saida)


def buscar(mes: str, subseller: str) -> Iterator[Dict[str, Any]]:
    key, base = _cred()
    pagina = 0
    while True:
        r = requests.get(
            f"{base}{ENDPOINT}",
            headers={"x-api-key": key},
            params={"month": mes, "subsellerId": subseller,
                    "page": str(pagina), "pageSize": str(PAGE_SIZE)},
            timeout=TIMEOUT,
        )
        if r.status_code == 429:
            time.sleep(5)
            continue
        # O Power Query engolia 403 com `try ... otherwise {}` e o mes
        # sumia da base em silencio. Receita nao some em silencio.
        if r.status_code == 403:
            raise PermissionError(
                f"403 em {mes} / {subseller[:8]} — sem acesso a este subseller."
            )
        r.raise_for_status()

        itens = (r.json() or {}).get(CHAVE_LISTA) or []
        if not itens:
            return
        for i in itens:
            yield i
        if len(itens) < PAGE_SIZE:
            return
        pagina += 1
        time.sleep(0.2)


def buscar_extrato(subseller: str) -> List[Dict[str, Any]]:
    """Extrato bancario. Sem paginacao, sem month — vem tudo (~170 linhas)."""
    key, base = _cred()
    r = requests.get(
        f"{base}{EXTRATO}",
        headers={"x-api-key": key},
        params={"subsellerId": subseller},
        timeout=TIMEOUT,
    )
    r.raise_for_status()
    return (r.json() or {}).get("entries") or []


# ============================================================
# Diagnostico
# ============================================================

def diagnosticar(qtd: int = 2) -> None:
    amostra: List[Dict[str, Any]] = []
    for m in meses(qtd):
        for s in SUBSELLERS:
            for i, reg in enumerate(buscar(m, s)):
                amostra.append(fc.achatar(reg))
                if i >= 200:
                    break

    print(f"\nSCHEDULES-EX · {len(amostra)} registros\n" + "=" * 62)
    if not amostra:
        print("Nada retornado.")
        return

    fc.diagnostico(amostra, MAPA, limite=LIMITE, largura=22)

    sf = sum(1 for l in amostra if not fc.vazio(fc.resolver(l, MAPA["cod_salesforce"])))
    doc = sum(1 for l in amostra if not fc.vazio(fc.resolver(l, MAPA["documento"])))
    print("\n" + "=" * 62)
    print(f"cod_salesforce  {sf}/{len(amostra)} ({sf/len(amostra):.0%})  <- ponte com fato_pagamento_base")
    print(f"doc_cliente     {doc}/{len(amostra)} ({doc/len(amostra):.0%})  <- ponte secundaria (CPF)")

    print("\n-- EXEMPLO CRU --")
    print(json.dumps(amostra[0], indent=2, ensure_ascii=False)[:2200])

    # O extrato: fonte de verdade
    print("\n\nEXTRATO (checking-account)\n" + "=" * 62)
    for s in SUBSELLERS:
        e = [fc.achatar(x) for x in buscar_extrato(s)]
        print(f"{len(e)} lancamentos")
        if not e:
            continue
        ce: Counter = Counter()
        for l in e:
            for k, v in l.items():
                if not fc.vazio(v):
                    ce[k] += 1
        print("\n-- CHAVES --")
        for k, n in sorted(ce.items()):
            print(f"  {n/len(e):5.0%}  {k}")
        bruto = sum(fc.num(l.get("entry_gross_amount")) or 0 for l in e)
        liq = sum(fc.num(l.get("entry_net_amount")) or 0 for l in e)
        print(f"\nBruto   R$ {bruto:>14,.2f}")
        print(f"Liquido R$ {liq:>14,.2f}")
        print(f"Taxa    R$ {bruto - liq:>14,.2f}  ({(bruto-liq)/max(bruto,1):.2%})")
        print("\n-- EXEMPLO --")
        print(json.dumps(e[0], indent=2, ensure_ascii=False)[:1200])


# ============================================================
# Carga
# ============================================================

def sincronizar(qtd: int) -> None:
    linhas: List[Dict] = []
    for m in meses(qtd):
        antes = len(linhas)
        for s in SUBSELLERS:
            for reg in buscar(m, s):
                linhas.append(montar(reg))
        print(f"  {m}: {len(linhas) - antes}")

    print(f"\n{len(linhas)} parcelas")
    fc.validar(linhas, OBRIGATORIOS, limite=LIMITE, dica="Rode --diagnostico e ajuste o MAPA.")

    # ATENCAO — diferenca crucial vs. /services/payments:
    # aqui valor_bruto ja e POR PARCELA (105,35 de uma venda de 1.264),
    # nao o total da venda. Somar livremente. NAO deduplicar.
    # Deduplicar era o bug que "sumia" com 25% da receita na v1.
    vendas = {l["pagamento_cartao_id"] for l in linhas}
    bruto = sum(l["valor_bruto"] or 0 for l in linhas)
    liq = sum(l["valor_liquido"] or 0 for l in linhas)
    taxa = sum(l["taxa_cispay"] or 0 for l in linhas)
    sf = sum(1 for l in linhas if not fc.vazio(l.get("cod_salesforce")))
    doc = sum(1 for l in linhas if l.get("doc_norm"))

    print(f"Vendas   {len(vendas):>7}  ({len(linhas)} parcelas)")
    print(f"Bruto    R$ {bruto:>14,.2f}  (soma das parcelas)")
    print(f"Liquido  R$ {liq:>14,.2f}")
    print(f"Taxa     R$ {taxa:>14,.2f}  ({taxa/max(bruto,1):.2%})")
    print(f"Salesforce  {sf}/{len(linhas)} ({sf/max(len(linhas),1):.0%})  <- a ponte")
    print(f"CPF         {doc}/{len(linhas)} ({doc/max(len(linhas),1):.0%})\n")

    fc.upsert("fato_liquidacao_cartao", linhas, "parcela_id")
    print("\nOK.")


def sincronizar_extrato() -> None:
    linhas = []
    for s in SUBSELLERS:
        for e in buscar_extrato(s):
            f = fc.achatar(e)
            linhas.append({
                "lancamento_id":   fc.resolver(f, ["id", "entry_id"]),
                "subseller_id":    s,
                "data_lancamento": fc.resolver(f, ["payment_date", "entry_date", "date"]),
                "descricao":       fc.resolver(f, ["description", "entry_description", "type"]),
                "valor_bruto":     fc.num(fc.resolver(f, ["entry_gross_amount"])),
                "valor_liquido":   fc.num(fc.resolver(f, ["entry_net_amount"])),
            })
    linhas = [l for l in linhas if l["lancamento_id"]]
    print(f"{len(linhas)} lancamentos de extrato")
    fc.upsert("fato_extrato_cispay", linhas, "lancamento_id")
    print("OK.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--diagnostico", action="store_true")
    ap.add_argument("--sync", action="store_true")
    ap.add_argument("--extrato", action="store_true")
    ap.add_argument("--meses", type=int, default=24)
    a = ap.parse_args()

    if a.diagnostico:
        diagnosticar()
    elif a.sync:
        sincronizar(a.meses)
    elif a.extrato:
        sincronizar_extrato()
    else:
        ap.print_help()
