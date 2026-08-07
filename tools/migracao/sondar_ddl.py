#!/usr/bin/env python3
"""
Tenta recuperar a definição SQL das views do Supabase.

Só 12 das 109 views estão versionadas em supabase/migrations — as outras foram
criadas direto no SQL Editor. Sem o DDL, a migração só consegue copiar o
resultado delas, não recomputá-lo quando os ETLs trouxerem dados novos.

Este script tenta, em ordem de custo, todos os caminhos que a service_role
abre. Registra o que respondeu; não muda nada.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
DESTINO = os.environ.get("DESTINO_URL", "").rstrip("/")
if not URL or not KEY:
    sys.exit("faltam SUPABASE_URL e SUPABASE_SERVICE_KEY")

BASE = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}
resultado: dict = {}


def tentar(nome: str, url: str, headers: dict, metodo: str = "GET", corpo: bytes | None = None):
    try:
        r = urllib.request.Request(url, headers={**BASE, **headers}, method=metodo, data=corpo)
        with urllib.request.urlopen(r, timeout=60) as resp:
            texto = resp.read().decode("utf-8", "replace")
            resultado[nome] = {"status": resp.status, "corpo": texto[:20000]}
            print(f"[{resp.status}] {nome}", flush=True)
    except urllib.error.HTTPError as e:
        texto = e.read().decode("utf-8", "replace")
        resultado[nome] = {"status": e.code, "corpo": texto[:2000]}
        print(f"[{e.code}] {nome}: {texto[:160]}", flush=True)
    except Exception as e:
        resultado[nome] = {"status": None, "corpo": repr(e)}
        print(f"[erro] {nome}: {e!r}", flush=True)


# 1. Schemas alternativos que o projeto possa ter exposto no Data API.
for schema in ("supabase_migrations", "information_schema", "pg_catalog", "extensions", "graphql_public"):
    tentar(f"profile:{schema}", f"{URL}/rest/v1/", {"Accept-Profile": schema})

# 2. A tabela de migrations do CLI guarda o SQL aplicado, quando usada.
for rel in ("schema_migrations", "migrations"):
    tentar(
        f"migrations:{rel}",
        f"{URL}/rest/v1/{rel}?select=*",
        {"Accept-Profile": "supabase_migrations", "Accept": "application/json"},
    )

# 3. Alguma função de execução de SQL exposta como RPC.
for fn in ("exec_sql", "execute_sql", "sql", "run_sql", "query", "pg_query", "ddl_views"):
    tentar(
        f"rpc:{fn}",
        f"{URL}/rest/v1/rpc/{fn}",
        {"Content-Type": "application/json"},
        metodo="POST",
        corpo=json.dumps({"query": "select 1", "sql": "select 1"}).encode(),
    )

# 4. Introspection do pg_graphql — dá campos e tipos, nunca o corpo da view,
#    mas confirma o shape quando a spec do PostgREST for ambígua.
tentar(
    "graphql:introspection",
    f"{URL}/graphql/v1",
    {"Content-Type": "application/json"},
    metodo="POST",
    corpo=json.dumps({"query": "{__schema{types{name kind}}}"}).encode(),
)

saida = json.dumps(resultado, ensure_ascii=False, indent=2).encode()
if DESTINO:
    try:
        r = urllib.request.Request(
            f"{DESTINO}/_sondagem_ddl.json",
            data=saida,
            headers={"Content-Type": "application/octet-stream"},
            method="PUT",
        )
        with urllib.request.urlopen(r, timeout=120) as resp:
            print(f"sondagem enviada ({resp.status})", flush=True)
    except Exception as e:
        print(f"upload da sondagem falhou: {e!r}", flush=True)

achou = [k for k, v in resultado.items() if v.get("status") == 200 and k != "graphql:introspection"]
print(f"\ncaminhos que responderam 200: {achou or 'nenhum'}", flush=True)
