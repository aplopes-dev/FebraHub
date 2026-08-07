#!/usr/bin/env python3
"""
Reexporta as views do Supabase autenticado como usuário, não como service_role.

Por que existe: toda view do FebraHub carrega `where public.pode_ver('<setor>')`,
e `pode_ver()` lê `auth.uid()`. A service_role não tem uid — `meu_setor()` volta
NULL, `pode_ver()` volta false, e a view devolve zero linhas sem erro nenhum.
Foi o que aconteceu: 76 das 109 views vieram vazias no primeiro export.

A saída é obter um access_token de um usuário admin (setor 'geral', que enxerga
todos os hubs) e repetir o export com ele. O caminho usado — generate_link
seguido de verify — não muda senha, não invalida sessão e não dispara e-mail:
`generate_link` apenas devolve o token; quem enviaria o e-mail seria o cliente.

Uso:
    EMAIL_ADMIN=... DESTINO_URL=... python3 export_views_autenticado.py
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
EMAIL = os.environ.get("EMAIL_ADMIN", "")
PAGINA = int(os.environ.get("PAGINA", "1000"))

for _nome, _v in (
    ("SUPABASE_URL", URL),
    ("SUPABASE_SERVICE_KEY", KEY),
    ("DESTINO_URL", DESTINO),
    ("EMAIL_ADMIN", EMAIL),
):
    if not _v:
        sys.exit(f"falta {_nome}")


def req(url, headers, metodo="GET", corpo=None, tentativas=4):
    ultimo = None
    for n in range(tentativas):
        try:
            r = urllib.request.Request(url, headers=headers, method=metodo, data=corpo)
            with urllib.request.urlopen(r, timeout=180) as resp:
                return resp.status, dict(resp.headers), resp.read()
        except urllib.error.HTTPError as e:
            erro = e.read()
            if e.code < 500 and e.code != 429:
                return e.code, dict(e.headers), erro
            ultimo = f"HTTP {e.code}: {erro[:200]!r}"
        except Exception as e:
            ultimo = repr(e)
        time.sleep(2**n)
    raise RuntimeError(f"falhou: {url} — {ultimo}")


def ordem_de(colunas: list[str], quantas: int) -> str:
    return "".join(f"&order={c}.asc" for c in colunas[:quantas])


def contar(rel: str, headers: dict) -> int | None:
    status, hs, _ = req(
        f"{URL}/rest/v1/{rel}?select=*&limit=1",
        {**headers, "Prefer": "count=exact", "Range-Unit": "items", "Range": "0-0"},
        tentativas=2,
    )
    if status >= 400:
        return None
    faixa = (hs.get("Content-Range", "") or "").split("/")[-1]
    return int(faixa) if faixa.isdigit() else None


def token_de_usuario() -> str:
    status, _, corpo = req(
        f"{URL}/auth/v1/admin/generate_link",
        {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
        metodo="POST",
        corpo=json.dumps({"type": "magiclink", "email": EMAIL}).encode(),
    )
    if status >= 400:
        sys.exit(f"generate_link falhou: HTTP {status} {corpo[:300]!r}")
    dados = json.loads(corpo)
    props = dados.get("properties", dados)
    hashed = props.get("hashed_token")
    link = props.get("action_link")
    if not hashed and not link:
        sys.exit(f"generate_link sem token: {list(props)[:12]}")

    # O /verify distingue os dois campos: `token` é o OTP de 6 dígitos que a
    # pessoa digita, `token_hash` é o que o generate_link devolve. Mandar um no
    # lugar do outro responde otp_expired — parece expiração, e não é.
    if hashed:
        status, _, corpo = req(
            f"{URL}/auth/v1/verify",
            {"apikey": KEY, "Content-Type": "application/json"},
            metodo="POST",
            corpo=json.dumps({"type": "magiclink", "token_hash": hashed}).encode(),
        )
        if status < 400:
            sessao = json.loads(corpo)
            if sessao.get("access_token"):
                print(f"autenticado como {EMAIL} via token_hash", flush=True)
                return sessao["access_token"]
            print(f"verify sem access_token: {list(sessao)[:12]}", flush=True)
        else:
            print(f"verify por token_hash: HTTP {status} {corpo[:200]!r}", flush=True)

    # Plano B: seguir o action_link sem deixar o redirect acontecer. O GoTrue
    # responde 303 para <redirect_to>#access_token=..., e o fragmento aparece no
    # header Location (é o browser que o esconderia do servidor).
    if not link:
        sys.exit("sem action_link para o plano B")

    class SemRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *_args, **_kw):
            return None

    op = urllib.request.build_opener(SemRedirect)
    local = ""
    try:
        r = urllib.request.Request(link, headers={"apikey": KEY})
        with op.open(r, timeout=60) as resp:
            local = resp.headers.get("Location", "") or ""
    except urllib.error.HTTPError as e:
        local = e.headers.get("Location", "") or ""

    if "access_token=" in local:
        print(f"autenticado como {EMAIL} via action_link", flush=True)
        return local.split("access_token=")[1].split("&")[0]
    sys.exit(f"action_link não devolveu access_token (Location={local[:200]!r})")


def main() -> None:
    acesso = token_de_usuario()
    # A apikey continua sendo a chave do projeto; quem define auth.uid() é o Bearer.
    H = {
        "apikey": KEY,
        "Authorization": f"Bearer {acesso}",
        "Accept": "application/json",
        "Accept-Profile": "public",
    }

    _, _, corpo = req(f"{URL}/rest/v1/", {**H, "Authorization": f"Bearer {KEY}"})
    spec = json.loads(corpo)
    defs = spec.get("definitions", {})
    views = sorted(v for v in defs if v.startswith(("vw_", "mv_")))
    print(f"{len(views)} views a reexportar", flush=True)

    manifesto: dict = {
        "gerado_em": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "como": f"autenticado ({EMAIL})",
        "relacoes": {},
        "erros": {},
    }

    for rel in views:
        props = (defs.get(rel, {}) or {}).get("properties", {}) or {}
        cols = list(props.keys())
        pk = [c for c, d in props.items() if "<pk/>" in (d.get("description") or "")]

        try:
            total = contar(rel, H)
        except Exception as e:
            manifesto["erros"][rel] = f"contagem: {e!r}"
            print(f"[ERRO] {rel}: contagem — {e!r}", flush=True)
            continue

        # ORDER BY só quando vai haver mais de uma página: numa view pesada,
        # ordenar por 8 colunas estoura o statement timeout, e sem paginação
        # a ordem não muda nada. Quando precisa, degrada de 3 colunas para 1
        # e por fim desiste da ordem, registrando o risco no manifesto.
        tentativas = ([""] if (total is not None and total <= PAGINA)
                      else [ordem_de(pk or cols, 3), ordem_de(pk or cols, 1), ""])

        linhas: list[str] = []
        erro: str | None = None
        ordem_usada: str | None = None
        for ordem in tentativas:
            linhas, erro = [], None
            de = 0
            try:
                while True:
                    status, _, corpo = req(
                        f"{URL}/rest/v1/{rel}?select=*{ordem}",
                        {**H, "Range-Unit": "items", "Range": f"{de}-{de + PAGINA - 1}"},
                        tentativas=2,
                    )
                    if status >= 400:
                        erro = f"HTTP {status}: {corpo[:200].decode('utf-8', 'replace')}"
                        break
                    lote = json.loads(corpo)
                    if not lote:
                        break
                    linhas.extend(json.dumps(x, ensure_ascii=False, default=str) for x in lote)
                    de += len(lote)
                    if total is not None and len(linhas) >= total:
                        break
            except Exception as e:
                erro = repr(e)
            if not erro:
                ordem_usada = ordem
                break
            print(f"  ~ {rel}: tentativa com ordem={ordem or '(nenhuma)'} falhou — {erro[:120]}",
                  flush=True)

        if erro:
            manifesto["erros"][rel] = erro
            print(f"[ERRO] {rel}: {erro[:200]}", flush=True)
            continue

        manifesto["relacoes"][rel] = {
            "contagem_declarada": total,
            "linhas_exportadas": len(linhas),
            "colunas": cols,
            "pk": pk,
            "ordem": ordem_usada or None,
            "paginado_sem_ordem": bool(not ordem_usada and total and total > PAGINA),
        }
        alerta = "" if (total is None or total == len(linhas)) else f"  <-- DIVERGE ({total})"
        print(f"[ok] {rel}: {len(linhas)} linhas{alerta}", flush=True)
        if linhas:
            dados = ("\n".join(linhas) + "\n").encode()
            st, _, c = req(
                f"{DESTINO}/{rel}.ndjson",
                {"Content-Type": "application/octet-stream"},
                metodo="PUT",
                corpo=dados,
            )
            if st not in (200, 201, 204):
                raise RuntimeError(f"upload {rel}: HTTP {st} {c[:200]!r}")

    req(
        f"{DESTINO}/_manifesto_views.json",
        {"Content-Type": "application/octet-stream"},
        metodo="PUT",
        corpo=json.dumps(manifesto, ensure_ascii=False, indent=2).encode(),
    )
    comdados = sum(1 for v in manifesto["relacoes"].values() if v["linhas_exportadas"] > 0)
    print(
        f"\nFIM — {len(manifesto['relacoes'])} views, {comdados} com dados, "
        f"{len(manifesto['erros'])} erros",
        flush=True,
    )


if __name__ == "__main__":
    main()
