#!/usr/bin/env python3
"""
Carrega o dump NDJSON do Supabase no PostgreSQL próprio.

Roda dentro do container do Postgres (só ele alcança o banco — a porta 5432
não é publicada). Reexecutável: cada relação é recriada e recarregada dentro
de uma transação, então rodar de novo não duplica nem deixa meia carga.

O que ele NÃO faz: inventar tipo. A coluna vem tipada da spec do PostgREST
(_manifesto.json), e o que não estiver lá entra como text — melhor um text
honesto do que um numeric que trunca CPF com zero à esquerda.

Uso:
    python3 importar.py <dir-dump> <schema-destino> [--somente tabelas]
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

DIR = Path(sys.argv[1] if len(sys.argv) > 1 else "/dump")
SCHEMA = sys.argv[2] if len(sys.argv) > 2 else "public"
FILTRO = sys.argv[3:] if len(sys.argv) > 3 else []
# As views vieram num segundo export (autenticado, porque pode_ver() precisa de
# auth.uid()), com manifesto próprio — daí a variável.
MANIFESTO = os.environ.get("MANIFESTO", "_manifesto.json")

PGUSER = os.environ.get("POSTGRES_USER", "febrahub")
PGDB = os.environ.get("POSTGRES_DB", "febrahub")

# type/format do OpenAPI -> tipo Postgres. CPF, telefone e todos os *_id são
# text de propósito: 05107434550 vira 5107434550 em bigint e nunca mais casa.
TIPOS = {
    ("integer", "bigint"): "bigint",
    ("integer", "integer"): "integer",
    ("integer", "smallint"): "smallint",
    ("number", "numeric"): "numeric",
    ("number", "double precision"): "double precision",
    ("number", "real"): "real",
    ("string", "text"): "text",
    ("string", "character varying"): "text",
    ("string", "uuid"): "uuid",
    ("string", "date"): "date",
    ("string", "timestamp with time zone"): "timestamptz",
    ("string", "timestamp without time zone"): "timestamp",
    ("string", "time without time zone"): "time",
    ("boolean", "boolean"): "boolean",
    ("object", "json"): "jsonb",
    ("object", "jsonb"): "jsonb",
}


def tipo_pg(prop: dict) -> str:
    t, f = prop.get("type", "string"), prop.get("format", "")
    if (t, f) in TIPOS:
        return TIPOS[(t, f)]
    if t == "array" or f.endswith("[]"):
        return "jsonb"
    if t == "integer":
        return "bigint"
    if t == "number":
        return "numeric"
    if t == "boolean":
        return "boolean"
    return "text"


def psql(sql: str, entrada: bytes | None = None) -> tuple[int, str]:
    p = subprocess.run(
        ["psql", "-U", PGUSER, "-d", PGDB, "-v", "ON_ERROR_STOP=1", "-q", "-c", sql]
        if entrada is None
        else ["psql", "-U", PGUSER, "-d", PGDB, "-v", "ON_ERROR_STOP=1", "-q", "-c", sql],
        input=entrada,
        capture_output=True,
    )
    return p.returncode, (p.stderr or b"").decode("utf-8", "replace")


def copiar(rel: str, colunas: list[str], arquivo: Path) -> tuple[int, str]:
    """COPY ... FROM STDIN lendo o NDJSON e emitindo TSV.

    Vai por COPY e não por INSERT porque são centenas de milhares de linhas;
    INSERT linha a linha levaria horas e estouraria o log."""
    cols_sql = ", ".join(f'"{c}"' for c in colunas)
    # Sem cláusula NULL: o default do FORMAT text já é \N. Declarar
    # NULL '\\N' no SQL vira a string de 3 caracteres \\N com
    # standard_conforming_strings on, e aí todo NULL entra como o texto "N".
    sql = f'COPY "{SCHEMA}"."{rel}" ({cols_sql}) FROM STDIN WITH (FORMAT text)'
    proc = subprocess.Popen(
        ["psql", "-U", PGUSER, "-d", PGDB, "-v", "ON_ERROR_STOP=1", "-q", "-c", sql],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    n = 0
    assert proc.stdin
    try:
        with arquivo.open("rb") as fh:
            for linha in fh:
                linha = linha.strip()
                if not linha:
                    continue
                reg = json.loads(linha)
                campos = []
                for c in colunas:
                    v = reg.get(c)
                    if v is None:
                        campos.append("\\N")
                    elif isinstance(v, bool):
                        campos.append("t" if v else "f")
                    elif isinstance(v, (dict, list)):
                        campos.append(escapar(json.dumps(v, ensure_ascii=False)))
                    else:
                        campos.append(escapar(str(v)))
                proc.stdin.write(("\t".join(campos) + "\n").encode())
                n += 1
        proc.stdin.close()
    except BrokenPipeError:
        pass
    proc.wait()
    erro = (proc.stderr.read() or b"").decode("utf-8", "replace")
    return (n if proc.returncode == 0 else -1), erro


def escapar(s: str) -> str:
    return (
        s.replace("\\", "\\\\")
        .replace("\t", "\\t")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
    )


def main() -> None:
    manifesto = json.load(open(DIR / MANIFESTO))
    spec = json.load(open(DIR / "_openapi.json"))
    defs = spec.get("definitions", {})
    relacoes = manifesto["relacoes"]

    psql(f'CREATE SCHEMA IF NOT EXISTS "{SCHEMA}"')

    resumo: dict[str, dict] = {}
    for rel in sorted(relacoes):
        if FILTRO and rel not in FILTRO:
            continue
        arquivo = DIR / f"{rel}.ndjson"
        props = (defs.get(rel, {}) or {}).get("properties", {}) or {}
        if not props:
            print(f"[pula] {rel}: sem colunas na spec", flush=True)
            continue

        colunas = list(props.keys())
        ddl_cols = ",\n  ".join(f'"{c}" {tipo_pg(props[c])}' for c in colunas)
        pk = relacoes[rel].get("pk") or []
        pk_sql = ""
        if pk and not rel.startswith(("vw_", "mv_")):
            pk_sql = ',\n  PRIMARY KEY (' + ", ".join(f'"{c}"' for c in pk) + ")"

        rc, err = psql(f'DROP TABLE IF EXISTS "{SCHEMA}"."{rel}" CASCADE')
        if rc != 0:
            print(f"[ERRO] drop {rel}: {err[:200]}", flush=True)
            continue
        rc, err = psql(f'CREATE TABLE "{SCHEMA}"."{rel}" (\n  {ddl_cols}{pk_sql}\n)')
        if rc != 0:
            print(f"[ERRO] create {rel}: {err[:300]}", flush=True)
            resumo[rel] = {"erro": err[:300]}
            continue

        esperado = relacoes[rel]["linhas_exportadas"]
        if not arquivo.exists():
            print(f"[ok] {rel}: 0 linhas (sem arquivo)", flush=True)
            resumo[rel] = {"esperado": esperado, "carregado": 0}
            continue

        n, err = copiar(rel, colunas, arquivo)
        if n < 0:
            print(f"[ERRO] copy {rel}: {err[:300]}", flush=True)
            resumo[rel] = {"esperado": esperado, "erro": err[:300]}
            continue

        marca = "" if n == esperado else f"  <-- DIVERGE (dump {esperado})"
        print(f"[ok] {rel}: {n} linhas{marca}", flush=True)
        resumo[rel] = {"esperado": esperado, "carregado": n}

    (DIR / "_importacao.json").write_text(json.dumps(resumo, ensure_ascii=False, indent=2))
    div = {k: v for k, v in resumo.items() if v.get("erro") or v.get("esperado") != v.get("carregado")}
    print(f"\nFIM — {len(resumo)} relações, {len(div)} com divergência/erro", flush=True)
    for k, v in div.items():
        print(f"  ! {k}: {v}", flush=True)


if __name__ == "__main__":
    main()
