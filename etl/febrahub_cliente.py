"""
FebraHub · cliente comum dos ETLs

O QUE MUDOU (migração do Supabase para a API própria):
Antes cada script falava direto com o PostgREST do Supabase usando a
service_role key — uma chave que IGNORA toda a RLS. Quem a tivesse, tinha o
banco inteiro: leitura, escrita e DROP. Ela vivia num secret do GitHub, num
.env de cada máquina, e em cinco scripts diferentes.

Agora a escrita passa pela API NestJS, com um token de máquina
(FEBRAHUB_ETL_TOKEN) que só abre as rotas /ingest e só as tabelas do
catálogo de ingestão. Se vazar, o estrago é um upsert numa tabela de carga —
não o banco.

POR QUE ESTE MÓDULO EXISTE:
Havia dois clientes HTTP duplicados (um com `requests`, outro com urllib
puro), um carregador de .env copiado em cinco arquivos e dez helpers de
conversão repetidos. Um bug corrigido num deles não chegava aos outros — foi
assim que o mapeamento do Sympla gravou NULL por meses sem ninguém ver.

Depende SÓ da biblioteca padrão: o meta_sync roda num workflow que não
instala requirements.txt, e um cliente sem dependência funciona em qualquer
um deles.

Variáveis de ambiente:
    FEBRAHUB_API_URL     ex.: https://febracis.aplopes.com/api
    FEBRAHUB_ETL_TOKEN   token de máquina (secret; nunca commitar)
"""

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Sequence

# ============================================================
# Configuração
# ============================================================

# Lote de 500 linhas. A API aceita até 2000, mas 500 é o tamanho que os
# scripts já usavam e que mantém o corpo do POST bem abaixo do bodyLimit de
# 2 MB do Fastify. Lote menor também significa progresso visível no log e
# menos trabalho perdido quando uma tentativa falha.
TAMANHO_LOTE = 500

# 3 tentativas com espera 1s / 2s / 4s. Erro de rede e 5xx são quase sempre
# transitórios (deploy, reinício do Postgres, timeout de proxy); 4xx é erro
# nosso — repetir só atrasa a mensagem de erro.
TENTATIVAS = 3
ESPERA_BASE = 1.0

TIMEOUT = 120

# Abaixo de 50% de preenchimento num campo obrigatório, o mapeamento está
# errado — não é dado faltando. Gravar assim enche a tabela de NULL em
# silêncio, que foi exatamente o bug do Sympla. Melhor abortar alto.
LIMITE = 0.50


def carregar_env() -> None:
    """Lê um .env no formato NOME=valor, sem depender de biblioteca externa.

    Procura, nesta ordem: ./.env, ./etl/.env e o .env ao lado deste arquivo —
    assim o mesmo script roda da raiz do repo ou de dentro de etl/.
    Usa setdefault: variável já exportada no ambiente (o caso do GitHub
    Actions) sempre ganha do arquivo.
    """
    candidatos = (
        ".env",
        os.path.join("etl", ".env"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"),
    )
    for caminho in candidatos:
        if not os.path.exists(caminho):
            continue
        with open(caminho, encoding="utf-8") as arq:
            for linha in arq:
                linha = linha.strip()
                if linha and not linha.startswith("#") and "=" in linha:
                    chave, valor = linha.split("=", 1)
                    os.environ.setdefault(chave.strip(), valor.strip().strip('"').strip("'"))
        return


def _credenciais() -> tuple:
    url = (os.environ.get("FEBRAHUB_API_URL") or "").rstrip("/")
    token = os.environ.get("FEBRAHUB_ETL_TOKEN")
    if not url or not token:
        sys.exit(
            "Faltam FEBRAHUB_API_URL e/ou FEBRAHUB_ETL_TOKEN.\n"
            "Crie um .env na pasta etl/ (veja etl/.env.example) ou cadastre "
            "os secrets no GitHub Actions."
        )
    return url, token


# ============================================================
# HTTP
# ============================================================

def _chamar(
    caminho: str,
    corpo: Optional[Any] = None,
    metodo: str = "POST",
    timeout: int = TIMEOUT,
) -> Any:
    """Chama a API com o token de máquina, com retry em falha transitória.

    Devolve o JSON da resposta (ou None quando o corpo vem vazio).
    Levanta RuntimeError com o corpo da resposta em 4xx — o erro da API traz
    o código (TABELA_NAO_PERMITIDA, CONFLITO_INVALIDO, ...) e a mensagem.
    """
    base, token = _credenciais()
    url = f"{base}/{caminho.lstrip('/')}"
    dados = (
        json.dumps(corpo, ensure_ascii=False, default=str).encode("utf-8")
        if corpo is not None
        else None
    )

    ultimo_erro = None
    for tentativa in range(TENTATIVAS):
        req = urllib.request.Request(
            url,
            data=dados,
            headers={"X-ETL-Token": token, "Content-Type": "application/json"},
            method=metodo,
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                texto = r.read().decode("utf-8", errors="replace")
                return json.loads(texto) if texto.strip() else None
        except urllib.error.HTTPError as e:
            texto = e.read().decode("utf-8", errors="replace")
            # 4xx é contrato quebrado (tabela fora do catálogo, conflito
            # errado, chave faltando). Repetir não conserta — falhar já.
            if e.code < 500:
                raise RuntimeError(f"{metodo} {caminho}: HTTP {e.code}\n{texto[:600]}")
            ultimo_erro = RuntimeError(f"{metodo} {caminho}: HTTP {e.code}\n{texto[:600]}")
        except (urllib.error.URLError, ConnectionError, TimeoutError, OSError) as e:
            ultimo_erro = RuntimeError(f"{metodo} {caminho}: falha de rede — {e}")

        if tentativa < TENTATIVAS - 1:
            espera = ESPERA_BASE * (2 ** tentativa)
            print(f"  [retry {tentativa + 1}/{TENTATIVAS - 1}] {ultimo_erro} — {espera:.0f}s")
            time.sleep(espera)

    raise ultimo_erro  # type: ignore[misc]


# ============================================================
# Ingestão
# ============================================================

def upsert(
    tabela: str,
    linhas: Sequence[Dict[str, Any]],
    conflito: str,
    silencioso: bool = False,
) -> int:
    """Grava (insert ou update) as linhas na tabela, em lotes.

    `conflito` são as colunas da chave, separadas por vírgula — as MESMAS que
    a API declara em TABELAS_INGESTAO. Devolve quantas linhas a API gravou.
    """
    if not linhas:
        if not silencioso:
            print(f"  {tabela}: nada a gravar")
        return 0

    gravadas = 0
    for i in range(0, len(linhas), TAMANHO_LOTE):
        lote = list(linhas[i : i + TAMANHO_LOTE])
        resp = _chamar(f"/ingest/{tabela}", {"conflito": conflito, "linhas": lote}) or {}
        gravadas += int(resp.get("gravadas") or 0)
        ignoradas = resp.get("colunas_ignoradas") or []
        if ignoradas and not silencioso:
            # A API descarta coluna que não existe (ou é gerada) em vez de
            # recusar o lote. Sem este aviso o campo some sem ninguém notar.
            print(f"  {tabela}: colunas ignoradas — {', '.join(ignoradas)}")
        if not silencioso:
            print(f"  {tabela}: {i + len(lote)}/{len(linhas)}")
    return gravadas


def remover(
    tabela: str,
    chave: str,
    valores: Iterable[Any],
    coluna_data: str,
    de: str,
    ate: str,
) -> int:
    """Apaga, dentro da janela [de, ate], tudo cuja `chave` NÃO está em `valores`.

    `valores` são as chaves que AINDA existem na origem. O que estiver no banco
    dentro do recorte e fora dessa lista é registro que sumiu da origem.

    A janela é obrigatória do lado da API também — DELETE sem recorte de data
    numa tabela de fato apaga histórico. Devolve quantas linhas saíram.
    """
    lista = sorted({str(v) for v in valores if v is not None and str(v) != ""})
    if not lista:
        # Lista vazia significaria "nada sobreviveu" e apagaria a janela
        # inteira. Quase sempre é arquivo quebrado, não deleção legítima.
        raise RuntimeError(
            f"{tabela}: nenhuma chave para preservar — remoção abortada "
            f"(apagaria a janela {de} a {ate} inteira)."
        )
    resp = _chamar(
        f"/ingest/{tabela}/remover",
        {
            "chave": chave,
            "valores": lista,
            "janela": {"coluna": coluna_data, "de": de, "ate": ate},
        },
    ) or {}
    return int(resp.get("removidas") or 0)


def registrar_status(
    fonte: str,
    nome_exibicao: str,
    status: str,
    registros: Optional[int] = None,
    mensagem: Optional[str] = None,
    duracao: Optional[float] = None,
) -> None:
    """Marca no painel quando e como cada fonte sincronizou.

    `status` é 'ok', 'erro' ou 'parcial'. A API carimba a data — o cliente não
    manda ultima_sync para não depender do relógio da máquina que rodou.
    """
    corpo: Dict[str, Any] = {
        "fonte": fonte,
        "nome_exibicao": nome_exibicao,
        "status": status,
    }
    if registros is not None:
        corpo["registros"] = int(registros)
    if mensagem:
        corpo["mensagem"] = str(mensagem)[:500]
    if duracao is not None:
        corpo["duracao_segundos"] = round(float(duracao), 3)
    _chamar("/ingest/status/registrar", corpo, timeout=30)


# ============================================================
# Token OAuth das integrações (hoje só o Conta Azul)
# ============================================================

def ler_token(integracao: str) -> Optional[Dict[str, Any]]:
    """Devolve a linha de integracao_tokens, ou None se ainda não existe."""
    try:
        return _chamar(f"/ingest/token/{integracao}", metodo="GET", timeout=30)
    except RuntimeError as e:
        if "HTTP 404" in str(e):
            return None
        raise


def gravar_token(integracao: str, dados: Dict[str, Any]) -> None:
    """Grava/atualiza o token de uma integração.

    A API v2 do Conta Azul ROTACIONA o refresh_token a cada renovação: o
    antigo morre na hora. Se o novo não for gravado aqui, o próximo run
    quebra com invalid_grant e volta tudo para o Postman.

    Silencioso de propósito: nada desta linha pode acabar no log do Actions.
    """
    linha = {"integracao": integracao, **dados}
    linha.setdefault("atualizado_em", datetime.now(timezone.utc).isoformat())
    upsert("integracao_tokens", [linha], "integracao", silencioso=True)


# ============================================================
# Conversão — os helpers que estavam copiados em 5 scripts
# ============================================================

def achatar(obj: Any, prefixo: str = "") -> Dict[str, Any]:
    """{"invoice_info": {"doc_number": "x"}} -> {"invoice_info.doc_number": "x"}

    É o que o Power Query fazia sozinho e o Python não faz. Listas de pares
    {"name": ..., "value": ...} viram uma chave só (`campo[nome]`), porque é
    assim que Sympla e afins mandam campo customizado.
    """
    saida: Dict[str, Any] = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            novo = f"{prefixo}.{k}" if prefixo else str(k)
            if isinstance(v, (dict, list)):
                saida.update(achatar(v, novo))
            else:
                saida[novo] = v
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            if isinstance(item, dict) and "name" in item and "value" in item:
                chave = f"{prefixo}[{str(item['name']).strip().lower()}]"
                saida[chave] = item.get("value")
            else:
                saida.update(achatar(item, f"{prefixo}[{i}]"))
    else:
        saida[prefixo] = obj
    return saida


def vazio(v: Any) -> bool:
    return v is None or (isinstance(v, str) and v.strip() == "")


def resolver(linha: Dict[str, Any], candidatos: List[str]) -> Optional[Any]:
    """Primeiro candidato preenchido, sem ligar para maiúscula/minúscula."""
    baixo = {k.lower(): v for k, v in linha.items()}
    for c in candidatos:
        v = baixo.get(c.lower())
        if not vazio(v):
            return v
    return None


def num(v: Any) -> Optional[float]:
    """Número em qualquer formato que as APIs mandam.

    A CisPay mistura "1290,00", "2.99" e "2,99" no MESMO campo — era corrigido
    à mão no Power Query com Table.ReplaceValue. Converter na fronteira,
    nunca no banco.
    """
    if vazio(v):
        return None
    if isinstance(v, (int, float)):
        return float(v)
    t = str(v).strip()
    if "," in t:                      # BR: 1.290,00
        t = t.replace(".", "").replace(",", ".")
    try:
        return float(t)
    except ValueError:
        return None


def data(v: Any) -> Optional[str]:
    """'2026-05-01' ou '01/05/2026' -> '2026-05-01'. None quando não dá."""
    if vazio(v):
        return None
    s = str(v).strip()[:10]
    for f in ("%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(s, f).date().isoformat()
        except ValueError:
            continue
    return None


def dt_iso(s: Any) -> Optional[str]:
    """'14/03/2026' (com ou sem hora depois) -> '2026-03-14'.

    Omie e os relatórios do Salesforce mandam DD/MM/AAAA; a coluna é date.
    O regex tolera lixo depois da data — split('/') puro devolvia
    '2026 10:30-03-14' quando vinha hora junto.
    """
    m = re.match(r"(\d{1,2})/(\d{1,2})/(\d{4})", str(s or "").strip())
    return f"{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}" if m else None


def so_digitos(v: Any) -> Optional[str]:
    """CPF/CNPJ como TEXTO só com dígitos. Virar número mata o zero à esquerda."""
    if vazio(v):
        return None
    d = re.sub(r"\D", "", str(v))
    return d or None


def val(s: Any, zero_nulo: bool = False, positivo: bool = False) -> Optional[float]:
    """'R$ 1.234,56' -> 1234.56 ; '30.000' -> 30000.0 ; '-' -> None.

    `zero_nulo`: 0 vira None (planilha de meta em branco não é meta zero).
    `positivo`:  só valor > 0 passa (linha de receita não pode ser negativa).
    """
    s = str(s or "").replace("R$", "").replace("BRL", "").replace("\xa0", " ").strip()
    if not s or s in ("-", "?", "#REF!", "#DIV/0!"):
        return None
    # Vírgula = decimal, ponto = milhar (padrão BR). Sem vírgula, o ponto
    # ainda é milhar: '30.000' na planilha é trinta mil, não trinta.
    s = s.replace(".", "").replace(",", ".")
    s = re.sub(r"[^0-9.\-]", "", s)
    try:
        v = float(s)
    except ValueError:
        return None
    if positivo and v <= 0:
        return None
    if zero_nulo and v == 0:
        return None
    return round(v, 2)


def inteiro(s: Any) -> Optional[int]:
    s = re.sub(r"[^0-9]", "", str(s or ""))
    try:
        return int(s) if s else None
    except ValueError:
        return None


def txt(s: Any) -> Optional[str]:
    """Texto limpo, ou None. '-' e '?' são jeitos de escrever 'vazio' na planilha."""
    s = str(s or "").strip()
    return None if s in ("", "-", "?") else s


# ============================================================
# Validação e diagnóstico
# ============================================================

def validar(
    linhas: Sequence[Dict[str, Any]],
    obrigatorios: Sequence[str],
    limite: float = LIMITE,
    rotulo: Optional[str] = None,
    dica: str = "Rode --diagnostico e ajuste o mapeamento.",
    aborta_vazio: bool = True,
) -> None:
    """Falha ALTO. Melhor quebrar do que gravar NULL em silêncio.

    Se um campo obrigatório vier preenchido em menos de `limite` das linhas, o
    problema é o MAPEAMENTO (nome de campo mudou na origem), não o dado. Foi
    assim que o Sympla gravou valor_total NULL por meses: o .get() não achava
    a chave, devolvia None, e o insert passava sem erro e sem log.
    """
    if not linhas:
        if aborta_vazio:
            sys.exit("CARGA ABORTADA — zero registros.")
        return

    total = len(linhas)
    problemas = []
    for c in obrigatorios:
        taxa = sum(1 for l in linhas if not vazio(l.get(c))) / total
        if taxa < limite:
            problemas.append(f"{c}: preenchido em apenas {taxa:.0%}")

    if problemas:
        cabecalho = f"CARGA ABORTADA — {rotulo}" if rotulo else "CARGA ABORTADA — obrigatórios vazios:"
        print(f"\n{cabecalho}", file=sys.stderr)
        for p in problemas:
            print(f"  - {p}", file=sys.stderr)
        if dica:
            print(f"\n{dica}", file=sys.stderr)
        sys.exit(1)


def diagnostico(
    amostra: Sequence[Dict[str, Any]],
    mapa: Dict[str, List[str]],
    limite: float = LIMITE,
    largura: int = 22,
    mostrar_origem: bool = False,
) -> None:
    """Imprime o preenchimento real das chaves cruas e o do MAPA.

    É o que evita escrever mapeamento no chute: a lista de cima é o que a API
    manda de verdade; a de baixo é quanto de cada destino o MAPA consegue
    preencher. '!!' é campo que vai gravar NULL.
    """
    if not amostra:
        print("Nada retornado.")
        return

    total = len(amostra)
    contagem: Dict[str, int] = {}
    for linha in amostra:
        for k, v in linha.items():
            if not vazio(v):
                contagem[k] = contagem.get(k, 0) + 1

    print("\n-- CHAVES REAIS (preenchimento) --")
    for k, n in sorted(contagem.items()):
        print(f"  {n/total:5.0%}  {k}")

    print("\n-- MAPEAMENTO --")
    for destino, candidatos in mapa.items():
        taxa = sum(1 for l in amostra if not vazio(resolver(l, candidatos))) / total
        marca = "OK " if taxa >= limite else "!! "
        origem = f"  <- {candidatos[0]}" if mostrar_origem else ""
        print(f"  {marca}{destino:{largura}} {taxa:5.0%}{origem}")
