#!/usr/bin/env python3
"""
Gera o schema.prisma a partir da spec OpenAPI que o PostgREST publicava.

O Supabase não deixou DDL para trás: só 12 das 109 views estavam versionadas e
o Data API só expõe `public`. O que sobrou de fonte de verdade sobre colunas e
tipos é a spec — ela lista toda tabela e view com nome, tipo e chave primária.

As views viram tabelas no destino. Isso é deliberado e está documentado em
tools/migracao/README.md: sem o SQL original elas não podem ser recomputadas,
então entram como snapshot carregado, e são reconstruídas como view de verdade
uma a uma, cada uma validada contra esse mesmo snapshot.

Uso:  python tools/migracao/gerar_prisma.py <openapi.json> <manifesto.json> <saida.prisma>
"""
from __future__ import annotations

import json
import re
import sys

TIPOS = {
    ("integer", "bigint"): "BigInt",
    ("integer", "integer"): "Int",
    ("integer", "smallint"): "Int",
    ("number", "numeric"): "Decimal",
    ("number", "double precision"): "Float",
    ("number", "real"): "Float",
    ("string", "text"): "String",
    ("string", "character varying"): "String",
    ("string", "uuid"): "String",
    ("string", "date"): "DateTime",
    ("string", "timestamp with time zone"): "DateTime",
    ("string", "timestamp without time zone"): "DateTime",
    ("string", "time without time zone"): "String",
    ("boolean", "boolean"): "Boolean",
    ("object", "json"): "Json",
    ("object", "jsonb"): "Json",
    ("array", ""): "Json",
}

# Nome de coluna que o Prisma não aceita cru vira campo com @map.
RESERVADAS = {"model", "enum", "type", "datasource", "generator"}


def tipo_prisma(prop: dict) -> tuple[str, list[str]]:
    """Devolve (tipo, atributos)."""
    t = prop.get("type", "string")
    f = prop.get("format", "")
    chave = (t, f)
    if chave in TIPOS:
        base = TIPOS[chave]
    elif t == "array":
        base = "Json"
    elif f.endswith("[]"):
        base = "Json"
    elif t == "integer":
        base = "Int"
    elif t == "number":
        base = "Decimal"
    elif t == "boolean":
        base = "Boolean"
    else:
        base = "String"

    attrs: list[str] = []
    if base == "DateTime":
        attrs.append("@db.Date" if f == "date" else "@db.Timestamptz(6)")
    elif base == "Decimal":
        attrs.append("@db.Decimal(18, 4)")
    elif base == "String" and f == "uuid":
        attrs.append("@db.Uuid")
    elif base == "Json":
        attrs.append("@db.JsonB")
    return base, attrs


def nome_modelo(rel: str) -> str:
    """fato_pagamento_base -> FatoPagamentoBase"""
    return "".join(p.capitalize() for p in re.split(r"[^0-9a-zA-Z]+", rel) if p)


def nome_campo(col: str) -> str:
    """data_pagamento -> dataPagamento"""
    partes = [p for p in re.split(r"[^0-9a-zA-Z]+", col) if p]
    if not partes:
        return "campo"
    saida = partes[0].lower() + "".join(p.capitalize() for p in partes[1:])
    if saida[0].isdigit():
        saida = "c" + saida
    if saida in RESERVADAS:
        saida += "_"
    return saida


def main() -> None:
    spec = json.load(open(sys.argv[1]))
    manifesto = json.load(open(sys.argv[2]))
    saida = sys.argv[3]

    defs = spec.get("definitions", {})
    relacoes = manifesto["relacoes"]

    linhas = [
        "// Gerado por tools/migracao/gerar_prisma.py a partir da spec do PostgREST.",
        "// Editar à mão é esperado: o gerador acerta colunas e tipos, mas relações,",
        "// índices de consulta e o que virou view de verdade entram depois.",
        "",
        "generator client {",
        '  provider = "prisma-client-js"',
        "}",
        "",
        "datasource db {",
        '  provider = "postgresql"',
        '  url      = env("DATABASE_URL")',
        "}",
        "",
    ]

    for rel in sorted(relacoes):
        d = defs.get(rel)
        if not d:
            continue
        props = d.get("properties", {}) or {}
        if not props:
            continue
        obrigatorias = set(d.get("required", []) or [])
        pk = relacoes[rel].get("pk") or []
        ehview = rel.startswith("vw_") or rel.startswith("mv_")

        linhas.append(f"model {nome_modelo(rel)} {{")
        campos_pk: list[str] = []
        for col, prop in props.items():
            base, attrs = tipo_prisma(prop)
            campo = nome_campo(col)
            if campo != col:
                attrs.insert(0, f'@map("{col}")')
            if col in pk:
                campos_pk.append(campo)
                if len(pk) == 1:
                    attrs.insert(0, "@id")
            opcional = "" if (col in pk or col in obrigatorias) else "?"
            linhas.append(f"  {campo} {base}{opcional} {' '.join(attrs)}".rstrip())

        if len(campos_pk) > 1:
            linhas.append(f"  @@id([{', '.join(campos_pk)}])")
        if not campos_pk:
            # View sem PK: o Prisma exige identidade para mapear a linha.
            # @@ignore mantém o modelo no schema sem gerar client — o acesso
            # é por $queryRaw, que é como as views são lidas de qualquer jeito.
            linhas.append("  @@ignore")
        linhas.append(f'  @@map("{rel}")')
        if ehview:
            linhas.append("  // origem: view do Supabase, carregada como snapshot")
        linhas.append("}")
        linhas.append("")

    open(saida, "w").write("\n".join(linhas))
    print(f"{saida}: {sum(1 for l in linhas if l.startswith('model '))} models")


if __name__ == "__main__":
    main()
