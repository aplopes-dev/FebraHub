# Omie — mapeamento de dados úteis para o FebraHub

Levantamento do que o **Omie** expõe pela API (RPC POST com
`app_key`/`app_secret`/`call`/`param`, ver `https://developer.omie.com.br/service-list/`)
e do que já é — ou pode ser — puxado para o FebraHub.

A integração Omie usa credencial de aplicação (`OMIE_APP_KEY`/`OMIE_APP_SECRET`
em `/opt/febrahub/etl.env`) que **não expira**. Toda chamada é `POST` no corpo,
não header. O ETL é `etl/omie_sync.py`; a escrita passa pela rota `/ingest`
(catálogo `TABELAS_INGESTAO` em `apps/api/src/modules/ingest/ingest.service.ts`).

> Legenda: **✅ já puxado** · **🆕 puxado agora (mig. 33)** · **◻️ disponível, ainda não puxado**

---

## O que já vinha (Loja / PDV)

| Bloco | Endpoint · call | Tabela | Status |
|---|---|---|---|
| Vendas (cupons/NFC-e) | `produtos/cupomfiscalconsultar` · `CuponsFiscais` | `fato_loja_cupom`, `fato_loja_item` | ✅ |
| Formas de pagamento | `produtos/cupomfiscalconsultar` · `CuponsPagamentos` | `fato_loja_pagamento` | ✅ |
| Posição de estoque | `estoque/consulta` · `ListarPosEstoque` | `fato_loja_estoque` | ✅ |

## O que passou a vir agora (migração 33)

| Bloco | Endpoint · call | Tabela | Status |
|---|---|---|---|
| **Contas a pagar** (títulos/despesas) | `financas/contapagar` · `ListarContasPagar` | `fato_omie_contas_pagar` | 🆕 |
| **Cadastro de produtos** (catálogo mestre) | `geral/produtos` · `ListarProdutos` | `fato_omie_produto` | 🆕 |
| Estoque — custo médio / local / pendente | `estoque/consulta` · `ListarPosEstoque` | novas colunas em `fato_loja_estoque` | 🆕 |
| Categorias (resolve nome da despesa) | `geral/categorias` · `ListarCategorias` | usado como lookup no ETL | 🆕 |
| Fornecedores (resolve nome do título) | `geral/clientes` · `ListarClientesResumido` | usado como lookup no ETL | 🆕 |

---

## 1. Contas a pagar — `financas/contapagar` · `ListarContasPagar`

Resposta paginada em `conta_pagar_cadastro[]`. Campos úteis e para onde vão:

| Campo Omie | Coluna `fato_omie_contas_pagar` | Observação |
|---|---|---|
| `codigo_lancamento_omie` | `lancamento_id` (PK) | id do título |
| `codigo_lancamento_integracao` | `codigo_integracao` | id de origem, se veio de fora |
| `codigo_cliente_fornecedor` | `fornecedor_id` | **código**; nome resolvido pelo ETL |
| *(lookup clientes)* | `fornecedor`, `fornecedor_documento` | via `ListarClientesResumido` |
| `codigo_categoria` / `categorias[0]` | `categoria_codigo` | plano de contas |
| *(lookup categorias)* | `categoria` | via `ListarCategorias` (descrição legível) |
| `numero_documento` | `numero_documento` | ex.: `RPS 3298496` |
| `numero_documento_fiscal` | `numero_doc_fiscal` | |
| `codigo_tipo_documento` | `tipo_documento` | `BOL` (boleto), `TRA` (transferência)… |
| `numero_parcela` | `numero_parcela` | `001/001` |
| `cnab_integracao_bancaria.codigo_forma_pagamento` | `forma_pagamento` | `PIX`, `TRA`, `BOL`… |
| `id_conta_corrente` | `conta_corrente_id` | |
| `data_emissao` / `data_entrada` | `data_emissao` / `data_entrada` | `DD/MM/AAAA` → `date` |
| `data_vencimento` / `data_previsao` | `data_vencimento` / `data_previsao` | previsão de pagamento |
| `status_titulo` | `status_titulo` (cru) + `status` (normalizado) | `ATRASADO`→`Vencido`, `PAGO`→`Pago`… |
| `valor_documento` | `valor` | e `valor_pago` quando baixado |
| `info.dAlt` | `data_alteracao`; `data_pagamento` quando pago | |

**Views:** `vw_omie_a_pagar_horizonte` (vencido / 30 / 60 / 90 / +90),
`vw_omie_despesa_categoria`, `vw_omie_pago_mensal`.

Volume atual na conta: ~225 títulos.

> Nota: convive com `fato_contas_pagar` (Conta Azul). São **fontes distintas** —
> não somar cegamente. Definir no Financeiro/ERP qual é a de referência por
> período (a Febracis pode operar as duas em paralelo durante a transição).

## 2. Cadastro de produtos — `geral/produtos` · `ListarProdutos`

Resposta em `produto_servico_cadastro[]` (~453 produtos). É a **dimensão-mestre**
de produto para Estoque e Compras.

| Campo Omie | Coluna `fato_omie_produto` |
|---|---|
| `codigo_produto` | `produto_id` (PK) |
| `codigo` | `codigo` (SKU interno) |
| `codigo_produto_integracao` | `codigo_integracao` |
| `descricao` / `descr_detalhada` | `descricao` / `descricao_detalhada` |
| `unidade` | `unidade` (`UN`, `CX`…) |
| `ncm` / `ean` / `cest` | `ncm` / `ean` / `cest` |
| `codigo_familia` / `descricao_familia` | `familia_id` / `familia` |
| `marca` / `modelo` | `marca` / `modelo` |
| `tipoItem` | `tipo_item` (00 mercadoria, 07 serviço…) |
| `valor_unitario` | `valor_unitario` (preço de venda) |
| `quantidade_estoque` / `estoque_minimo` | `quantidade_estoque` / `estoque_minimo` |
| `peso_liq` / `peso_bruto` | `peso_liquido` / `peso_bruto` |
| `inativo` / `bloqueado` (`S`/`N`) | `inativo` / `bloqueado` (bool) |
| `info.dInc` / `info.dAlt` | `data_inclusao` / `data_alteracao` |

## 3. Estoque — `estoque/consulta` · `ListarPosEstoque`

Já existia; a migração 33 acrescentou de `ListarPosEstoque`:

| Campo Omie | Coluna nova em `fato_loja_estoque` |
|---|---|
| `nCMC` | `custo_medio` (custo médio contábil) |
| `codigo_local_estoque` | `local_estoque_id` |
| `nPendente` | `pendente` |
| `cCodInt` | `codigo_interno` |

**View** `vw_omie_estoque_produto` cruza catálogo (`fato_omie_produto`) × posição
(`fato_loja_estoque`): saldo, custo médio, valor a custo, valor a venda,
`abaixo_minimo`.

---

## Outros blocos do Omie úteis, ainda NÃO puxados (◻️ candidatos)

Priorizados pelo valor para PDV / Compras / Estoque / Financeiro/ERP:

| Bloco | Endpoint · call | Serve para |
|---|---|---|
| **Contas a receber** | `financas/contareceber` · `ListarContasReceber` | Financeiro/ERP: a receber por horizonte, inadimplência |
| **Movimentos financeiros** | `financas/mf` · `ListarMovimentos` | baixas, conciliação, fluxo de caixa realizado |
| **Contas correntes** | `geral/contacorrente` · `ListarContasCorrentes` | saldo por conta, resolver `id_conta_corrente` |
| **Contas do DRE** | `geral/dre` · `ListarCadastroDRE` | estrutura para o **DRE** do Financeiro/ERP |
| **Movimento de estoque** | `estoque/movestoque` · `ListarMovimentos` | entradas/saídas por período (rastro, não só foto) |
| **Locais de estoque** | `estoque/local` · `ListarLocaisEstoque` | resolver `local_estoque_id` (LOJA × DEPÓSITO) |
| **Pedidos de compra** | `produtos/pedidocompra` · `ListarPedidosCompra` | reconciliar Compras do FebraHub com o Omie |
| **Nota de entrada** | `produtos/nfconsultar` · `ListarNF` | recebimento fiscal → entrada de estoque |
| **Produto × Fornecedor** | `produtos/prodfornec` · `ListarProdFornecedor` | preço/histórico de compra por fornecedor |
| **Famílias de produto** | `geral/familias` · `ListarFamilias` | agrupar catálogo (já temos `familia` no produto) |
| **Fornecedores completo** | `geral/clientes` · `ListarClientes` | dados fiscais completos (hoje só o resumido) |

> Estes ficam como backlog: cada um é só uma função nova em `omie_sync.py` +
> uma tabela em `TABELAS_INGESTAO`, no mesmo padrão de contas a pagar/produtos.
> **Contas a receber** e **Contas do DRE** são os próximos naturais para fechar o
> Financeiro/ERP (contas a pagar/receber + DRE).

---

## Como rodar / operar

```bash
# na VPS, dentro do compose (rede interna, sem TLS):
cd /opt/febrahub/app
docker compose -f docker-compose.prod.yml --env-file /opt/febrahub/.env \
  run --rm etl python etl/omie_sync.py --desde 01/01/2026
```

O `omie_sync.py` agora roda, em sequência: vendas → pagamentos → estoque →
**contas a pagar** → **produtos**. A carga diária do host (`infra/scripts/sync.sh`,
fonte `omie`) passa a incluir os dois blocos novos automaticamente. O resultado
vai para `integracao_status` (fonte `omie`, rodapé "atualização das fontes").
