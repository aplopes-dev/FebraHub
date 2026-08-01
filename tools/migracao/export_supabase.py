#!/usr/bin/env python3
"""
Exporta o projeto Supabase do FebraHub para NDJSON, uma vez, na migração
para PostgreSQL próprio.

Roda no GitHub Actions porque é lá que vivem SUPABASE_URL e SUPABASE_SERVICE_KEY.
O dump sai do runner direto para o destino via HTTPS PUT — nunca vira artifact,
porque o repositório é público e os dados têm CPF, telefone e e-mail de aluno.

Uso:
    DESTINO_URL=https://host/caminho/ python tools/migracao/export_supabase.py

O que sai:
    _manifesto.json     tabelas, views, contagens e o que falhou
    _openapi.json       spec do PostgREST — colunas e tipos de tudo que é exposto
    _usuarios.json      auth.users pela Admin API (sem hash de senha; ver README)
    <relacao>.ndjson    uma linha por registro
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request

URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
DESTINO = os.environ.get("DESTINO_URL", "").rstrip("/")
PAGINA = int(os.environ.get("PAGINA", "2000"))

if not URL or not KEY:
    sys.exit("faltam SUPABASE_URL e SUPABASE_SERVICE_KEY")
if not DESTINO:
    sys.exit("falta DESTINO_URL")


def req(url: str, headers: dict, metodo: str = "GET", corpo: bytes | None = None,
        tentativas: int = 4) -> tuple[int, dict, bytes]:
    ultimo = None
    for n in range(tentativas):
        try:
            r = urllib.request.Request(url, headers=headers, method=metodo, data=corpo)
            with urllib.request.urlopen(r, timeout=180) as resp:
                return resp.status, dict(resp.headers), resp.read()
        except urllib.error.HTTPError as e:
            corpo_erro = e.read()
            # 4xx não melhora com retry; 5xx e rate limit melhoram.
            if e.code < 500 and e.code != 429:
                return e.code, dict(e.headers), corpo_erro
            ultimo = f"HTTP {e.code}: {corpo_erro[:300]!r}"
        except Exception as e:  # timeout, DNS, conexão derrubada
            ultimo = repr(e)
        time.sleep(2 ** n)
    raise RuntimeError(f"falhou após {tentativas} tentativas: {url} — {ultimo}")


H_REST = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Accept": "application/json",
    "Accept-Profile": "public",
}


def enviar(nome: str, dados: bytes) -> None:
    """PUT no destino. O canal é HTTPS; o caminho é o segredo."""
    status, _, corpo = req(
        f"{DESTINO}/{nome}",
        {"Content-Type": "application/octet-stream", "Content-Length": str(len(dados))},
        metodo="PUT",
        corpo=dados,
    )
    if status not in (200, 201, 204):
        raise RuntimeError(f"upload de {nome} falhou: HTTP {status} {corpo[:200]!r}")
    print(f"  -> enviado {nome} ({len(dados) / 1024:.0f} KB)", flush=True)


def openapi() -> dict:
    """A spec do PostgREST lista tudo que o Data API expõe, com colunas e tipos."""
    _, _, corpo = req(f"{URL}/rest/v1/", H_REST)
    return json.loads(corpo)


def colunas_e_pk(spec: dict, rel: str) -> tuple[list[str], list[str]]:
    """Colunas e chave primária de uma relação, lidas da spec.
    O PostgREST marca a PK na descrição da propriedade com '<pk/>'."""
    props = (spec.get("definitions", {}).get(rel, {}) or {}).get("properties", {}) or {}
    cols = list(props.keys())
    pk = [c for c, d in props.items() if "<pk/>" in (d.get("description") or "")]
    return cols, pk


def contar(rel: str) -> int | None:
    status, headers, _ = req(
        f"{URL}/rest/v1/{rel}?select=*&limit=1",
        {**H_REST, "Prefer": "count=exact", "Range-Unit": "items", "Range": "0-0"},
    )
    if status >= 400:
        return None
    faixa = headers.get("Content-Range", "")  # "0-0/1234"
    if "/" in faixa:
        total = faixa.split("/")[-1]
        if total.isdigit():
            return int(total)
    return None


def baixar(rel: str, total: int | None, cols: list[str], pk: list[str]) -> tuple[bytes, int, str | None]:
    """Pagina por Range.

    Duas armadilhas, ambas já custaram caro neste projeto:

    1. O PostgREST corta a resposta no 'Max rows' do projeto (1000) sem avisar.
       Pedir um Range maior não levanta o teto — só faz o lote voltar menor que
       o pedido, o que parece 'acabou' e não é. Por isso a parada é lote vazio
       ou total atingido, nunca 'veio menos que pedi'.

    2. Paginar sem ORDER BY estável deixa o Postgres livre para repetir e pular
       linhas entre páginas. Ordenamos pela PK; sem PK, por todas as colunas.
    """
    ordem = pk or cols
    ordem_qs = "".join(f"&order={c}.asc" for c in ordem[:8])
    linhas: list[str] = []
    de = 0
    while True:
        status, _, corpo = req(
            f"{URL}/rest/v1/{rel}?select=*{ordem_qs}",
            {**H_REST, "Range-Unit": "items", "Range": f"{de}-{de + PAGINA - 1}"},
        )
        if status >= 400:
            return b"", len(linhas), f"HTTP {status}: {corpo[:200].decode('utf-8', 'replace')}"
        lote = json.loads(corpo)
        if not lote:
            break
        linhas.extend(json.dumps(x, ensure_ascii=False, default=str) for x in lote)
        de += len(lote)
        if total is not None and len(linhas) >= total:
            break
        if len(linhas) > 5_000_000:  # trava contra paginação que não converge
            return b"", len(linhas), "abortado: mais de 5M linhas"
    return ("\n".join(linhas) + "\n").encode() if linhas else b"", len(linhas), None


def usuarios() -> list[dict]:
    """Admin API. Não devolve encrypted_password — a migração de senha é
    tratada à parte (ver tools/migracao/README.md)."""
    todos: list[dict] = []
    pagina = 1
    while True:
        status, _, corpo = req(
            f"{URL}/auth/v1/admin/users?page={pagina}&per_page=200",
            {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Accept": "application/json"},
        )
        if status >= 400:
            print(f"  ! admin/users HTTP {status}", flush=True)
            break
        dados = json.loads(corpo)
        lote = dados.get("users", dados if isinstance(dados, list) else [])
        if not lote:
            break
        todos.extend(lote)
        if len(lote) < 200:
            break
        pagina += 1
    return todos


def main() -> None:
    print("== OpenAPI ==", flush=True)
    spec = openapi()
    relacoes = sorted(p.lstrip("/") for p in spec.get("paths", {}) if p not in ("/", ""))
    relacoes = [r for r in relacoes if not r.startswith("rpc/")]
    print(f"{len(relacoes)} relações expostas", flush=True)
    enviar("_openapi.json", json.dumps(spec, ensure_ascii=False).encode())

    manifesto: dict = {"gerado_em": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                       "relacoes": {}, "erros": {}}

    for rel in relacoes:
        total = contar(rel)
        cols, pk = colunas_e_pk(spec, rel)
        dados, n, erro = baixar(rel, total, cols, pk)
        if erro:
            manifesto["erros"][rel] = erro
            print(f"[ERRO] {rel}: {erro}", flush=True)
            continue
        manifesto["relacoes"][rel] = {
            "contagem_declarada": total,
            "linhas_exportadas": n,
            "colunas": cols,
            "pk": pk,
        }
        marca = "" if (total is None or total == n) else f"  <-- DIVERGE (declarado {total})"
        print(f"[ok] {rel}: {n} linhas{marca}", flush=True)
        if dados:
            enviar(f"{rel}.ndjson", dados)

    print("== usuários ==", flush=True)
    us = usuarios()
    manifesto["usuarios"] = len(us)
    print(f"{len(us)} usuários", flush=True)
    enviar("_usuarios.json", json.dumps(us, ensure_ascii=False, default=str).encode())

    enviar("_manifesto.json", json.dumps(manifesto, ensure_ascii=False, indent=2).encode())
    print(f"\nFIM — {len(manifesto['relacoes'])} relações, {len(manifesto['erros'])} erros", flush=True)


if __name__ == "__main__":
    main()
