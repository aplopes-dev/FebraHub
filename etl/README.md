# ETLs do FebraHub

Onze scripts Python que trazem os dados das fontes externas (Salesforce,
CisPay, Conta Azul, Sympla, Meta Ads, Omie e as planilhas da loja) para o
banco do FebraHub.

Todos seguem a mesma forma: **ler da origem → mapear → validar → gravar**.
Nenhum deles fala com o banco direto — a gravação passa pela API NestJS.

---

## O que mudou na migração

**Antes:** cada script escrevia no PostgREST do Supabase usando a
`service_role key`, uma chave que ignora toda a RLS. Quem a tivesse tinha o
banco inteiro — leitura, escrita e DROP. Ela vivia num secret do GitHub, num
`.env` de cada máquina e em cinco scripts diferentes.

**Agora:** a gravação passa pela API própria, com um token de máquina
(`FEBRAHUB_ETL_TOKEN`) que só abre as rotas `/ingest` e só as tabelas do
catálogo de ingestão (`apps/api/src/modules/ingest/ingest.service.ts`,
constante `TABELAS_INGESTAO`). Se vazar, o estrago é um upsert numa tabela
de carga — não o banco.

Rotas usadas:

| Rota | Para quê |
|---|---|
| `POST /ingest/{tabela}` | upsert em lote (máx. 2000 linhas; o cliente manda de 500 em 500) |
| `POST /ingest/{tabela}/remover` | apaga, **dentro de uma janela de data obrigatória**, o que sumiu da origem |
| `POST /ingest/status/registrar` | marca no painel quando e como a fonte sincronizou |
| `GET  /ingest/token/{integracao}` | lê o token OAuth guardado (Conta Azul) |

Junto com isso sumiu a duplicação: dois clientes HTTP (um com `requests`,
outro com `urllib`), um carregador de `.env` copiado em cinco arquivos e dez
helpers de conversão repetidos. Tudo isso hoje mora em
[`febrahub_cliente.py`](febrahub_cliente.py), que **não tem dependência
externa** — só a biblioteca padrão.

---

## Como rodar

```bash
cd etl
cp .env.example .env      # preencha; o .env está no .gitignore
pip install -r requirements.txt
```

Duas variáveis mandam em tudo:

```
FEBRAHUB_API_URL=https://febracis.aplopes.com/api
FEBRAHUB_ETL_TOKEN=<token de máquina>
```

O `.env` é procurado em `./.env`, `./etl/.env` e ao lado dos scripts — dá
para rodar da raiz do repositório ou de dentro de `etl/`. Variável já
exportada no ambiente sempre ganha do arquivo (é assim que o GitHub Actions
injeta os secrets).

```bash
python cispay_sync.py --sync --meses 24
python cispay_sync.py --extrato
python sympla_sync.py --sync
python contaazul_sync.py --sync --desde 2024-01-01
python contaazul_pagar_sync.py --sync --desde 2024-01-01
python meta_sync.py --desde 2024-01-01 --ate 2024-06-30
python omie_sync.py --desde 01/01/2026
python sheets_sync.py
python sheets_metas_sync.py
python sheets_extras_sync.py
python sheets_fechamento_sync.py
python salesforce_email_sync.py
```

> **Atenção:** `cispay_sync.py`, `sympla_sync.py`, `contaazul_sync.py` e
> `contaazul_pagar_sync.py` **exigem uma flag**. Sem `--sync` eles só
> imprimem o help e saem com código 0 — o que fazia o passo do workflow
> ficar verde todo dia sem gravar uma linha. Corrigido nos workflows.

Em produção quem roda é o GitHub Actions:
`.github/workflows/sync-diario.yml` (1x/dia),
`sync-salesforce.yml` (3x/dia) e `meta-historico.yml` (manual).

---

## O método `--diagnostico`

Existe em `cispay_sync.py`, `sympla_sync.py`, `contaazul_sync.py` e
`contaazul_pagar_sync.py`. Ele **não grava nada**: puxa uma amostra da origem
e imprime duas listas.

```bash
python sympla_sync.py --diagnostico
```

```
-- CHAVES REAIS (preenchimento) --
  100%  order_total_sale_price
  100%  buyer_email
   66%  invoice_info.doc_number

-- MAPEAMENTO --
  OK valor_total                 100%  <- order_total_sale_price
  OK comprador_documento          66%  <- invoice_info.doc_number
  !! comprador_telefone            0%  <- buyer_phone
```

A lista de cima é o que a API manda **de verdade**, com o nome cru e o
percentual de preenchimento. A de baixo é quanto de cada coluna de destino o
`MAPA` do script consegue preencher. `!!` é campo que vai gravar NULL.

**Por que isso existe:** o mapeamento do Sympla foi escrito com os nomes
*finais* do Power BI (`valor_total`) em vez dos nomes *crus* da API
(`order_total_sale_price`). O `.get()` não achava, devolvia `None`, e o
insert gravava NULL. Sem erro, sem log, por meses.

Rode o `--diagnostico` sempre que:

* for criar ou alterar um `MAPA`;
* a carga abortar com `CARGA ABORTADA — obrigatórios vazios`;
* a origem anunciar mudança de versão da API.

### A trava dos 50%

Antes de gravar, todo script confere os campos obrigatórios. Se algum vier
preenchido em **menos de 50%** das linhas, a carga **aborta** (saída 1):

```
CARGA ABORTADA — obrigatórios vazios:
  - valor_total: preenchido em apenas 0%

Rode --diagnostico e ajuste o mapeamento.
```

Abaixo de 50% o problema é o mapeamento, não o dado. Falhar alto é melhor do
que encher a tabela de NULL em silêncio.

---

## O que cada ETL alimenta

| Script | Origem | Tabelas |
|---|---|---|
| `cispay_sync.py` | CisPay (`schedules-ex`, `checking-account`) | `fato_liquidacao_cartao`, `fato_extrato_cispay` |
| `contaazul_sync.py` | Conta Azul v2 — contas a receber | `fato_contas_receber`, `integracao_tokens` |
| `contaazul_pagar_sync.py` | Conta Azul v2 — contas a pagar | `fato_contas_pagar` |
| `meta_sync.py` | Meta Marketing API (insights por anúncio) | `fato_meta_insights` |
| `omie_sync.py` | Omie (cupons, pagamentos, estoque) | `fato_loja_cupom`, `fato_loja_item`, `fato_loja_pagamento`, `fato_loja_estoque` |
| `salesforce_email_sync.py` | Relatórios do Salesforce por e-mail (Gmail/IMAP) | `fato_pagamento_base`, `fato_base_alunos` |
| `sheets_sync.py` | Planilha da loja, aba FATURAMENTO | `fato_loja_curso` |
| `sheets_metas_sync.py` | Planilha da loja, abas METAS MENSAIS | `fato_loja_meta_mes`, `fato_loja_meta_curso` |
| `sheets_extras_sync.py` | Cursos premium, aluguel de sala, Sentido de Brincar | `fato_loja_receita_extra` |
| `sheets_fechamento_sync.py` | Planilha FECHAMENTO MES/META | `fato_loja_fechamento` |
| `sympla_sync.py` | Sympla (eventos, pedidos, participantes) | `dim_eventos`, `fato_pedidos`, `fato_participantes` |

Todos escrevem também em `integracao_status`, via `/ingest/status/registrar`.

As chaves de conflito de cada tabela são as declaradas em `TABELAS_INGESTAO`
na API. Mandar chave diferente devolve `CONFLITO_INVALIDO` — de propósito:
o nome da tabela e a chave vêm de fora e viram identificador na consulta.

---

## Detalhes que valem saber

**Conta Azul — o token.** A API v2 **rotaciona o refresh_token** a cada
renovação: o antigo morre na hora. Por isso o token não é secret, e sim
linha na tabela `integracao_tokens` — o script lê, renova e grava o novo. A
autorização inicial é manual, uma vez só:

```bash
python contaazul_sync.py --semear-token <refresh_token_inicial>
```

Os dois scripts (receber e pagar) compartilham a mesma integração; semear
uma vez basta.

**Salesforce — carga incremental.** O relatório filtra por *data de
aprovação*, e o script apaga e reinsere pelo **mesmo** critério — foi o
descasamento aprovação × pagamento que quebrou a base antes. A ordem é
`upsert` primeiro, `remover` depois: se o upsert falhar, nada foi apagado.
Duas travas contra apagar demais:

* no script, janela maior que **120 dias** aborta (parece export de base
  inteira, não incremental);
* na API, `remover` exige janela de data e recusa acima de **366 dias** —
  o token de ETL sozinho não apaga histórico.

**Meta Ads.** `anuncio_key` é coluna **gerada** no banco e faz parte da PK.
O ETL não a envia (o Postgres recusa valor em coluna `GENERATED`); a API
sabe disso e só exige nos dados as colunas de conflito que dá para escrever.
O `META_TOKEN` expira a cada 60 dias — quando expira, o investimento
simplesmente para de atualizar.

**CisPay.** O endpoint é `/services/schedules-ex`, não `/services/payments`.
`valor_bruto` já vem **por parcela** — somar livremente, **não deduplicar**.
Deduplicar era o bug que sumia com 25% da receita na v1.

**Planilhas.** As 5 precisam estar compartilhadas com o `client_email` da
conta de serviço, senão o passo falha com 403.
