# Quickstart — validar o motor de recebíveis do contrato de cartões

Guia de validação ponta a ponta. Pré-requisito: `/speckit-tasks` + implementação concluídas.

## 1. Pré-requisitos

```bash
pnpm infra:up                                   # Postgres etc.
pnpm --filter @citybox/erp-api db:migrate:dev    # aplica a migration desta feature
pnpm --filter @citybox/erp-api db:generate
pnpm dev:varejo                                  # admin-api + erp-web + erp-api
```

Organização de teste com:
- 1 conta bancária cadastrada (`/financas/contas-bancarias`).
- 1 `CardContract` ativo vinculado a essa conta (`/financas/contratos-de-cartoes-e-outros`), com:
  - método **débito / Visa**, taxa 2,3%, `firstPaymentDays=1`, `firstPaymentDayType=calendar_days`.
  - método **débito / Mastercard**, taxa 2,0%, `firstPaymentDays=1`, `firstPaymentDayType=business_days`, contrato com `businessDaysOnly=true`.
  - método **crédito / Visa**, `installmentDayType=single_payment`.
  - um segundo contrato (ou o mesmo com `installmentDayType=business_days`/`calendar_days`) para o
    cenário de 6 parcelas distintas.
  - método **Pix**, taxa 0%, prazo 0.
  - método **crédito / Elo** com faixas progressivas (`progressiveEnabled=true`,
    `CardRateTier` 1-3x = 3%, 4-6x = 4%).

## 2. Cenários (mapeiam os Critérios de Aceite do spec)

### 2.1 Débito com taxa — dia corrido

1. Criar um pedido de venda de R$ 100,00, 1 pagamento: forma **Cartão de débito**, bandeira
   **Visa**, conta bancária = a do contrato.
2. Fechar o pedido (`status=closed`).
3. **Esperado**: `GET /v1/financial-entries?...` mostra 1 `receivable` com
   `amountCents=9770`, `grossAmountCents=10000`, `acquirerFeeCents=230`, `dueDate` = data da venda
   + 1 dia corrido, `paidCents=0`, `cardSettlementFallback=false`.

### 2.2 Débito com taxa — dia útil, empurra fim de semana

1. Mesmo contrato, método **Mastercard**. Fechar a venda numa sexta-feira (ajustar `competenceDate`
   do teste/seed se necessário).
2. **Esperado**: `dueDate` cai na segunda-feira seguinte, não no sábado.

### 2.3 Crédito parcelado — pagamento único

1. Pedido de R$ 600,00, pagamento **Cartão de crédito**, bandeira **Visa**, 6 parcelas.
2. **Esperado**: exatamente **1** `FinancialEntry` com `installmentSequence=1`,
   `installmentCount=1`, valor = líquido total da venda.

### 2.4 Crédito parcelado — parcelas em dias corridos

1. Mesmo pedido, contrato com `installmentDayType=calendar_days`.
2. **Esperado**: exatamente **6** `FinancialEntry`, `installmentSequence` 1..6,
   `installmentCount=6` em todos, `dueDate` de cada um espaçado por `daysBetweenInstallments`, e a
   **soma exata** dos `amountCents` das 6 = valor líquido total (sem diferença de centavo — conferir
   sobretudo a última parcela, que absorve o resto da divisão).

### 2.5 Pix — taxa e prazo zero

1. Pedido de R$ 50,00, pagamento **Pix**.
2. **Esperado**: 1 `FinancialEntry`, `amountCents=5000` (igual ao bruto), `dueDate` = data da venda.

### 2.6 Faixa progressiva

1. Pedido no crédito Elo, 5 parcelas (cai na faixa 4-6x = 4%).
2. **Esperado**: `acquirerFeeCents` corresponde a 4% do bruto, não à taxa base do método (se
   houver) nem à faixa 1-3x.

### 2.7 Fallback — sem contrato aplicável

1. Pedido no cartão numa organização/conta **sem** `CardContract` cadastrado, ou bandeira não
   cadastrada no contrato.
2. **Esperado**: a venda fecha normalmente; 1 `FinancialEntry` no formato de hoje
   (`amountCents`=bruto, `paidCents`=`amountCents`, `dueDate`=hoje), `cardSettlementFallback=true`.
   Na UI de Lançamentos, o badge de aviso aparece nesse recebível.

### 2.8 Idempotência — reprocessar o fechamento

1. Repetir o `PATCH /v1/sale-orders/:id/status` (`status: 'closed'`) do cenário 2.4 uma segunda vez.
2. **Esperado**: continuam existindo exatamente 6 `FinancialEntry` — nenhum duplicado.

### 2.9 Pedido misto (dinheiro + cartão) — não-regressão

1. Pedido de R$ 150,00: R$ 50,00 em dinheiro + R$ 100,00 no débito Visa (cenário 2.1).
2. **Esperado**: 2 `FinancialEntry` — 1 agregado de R$ 50,00 (formato de hoje, `saleOrderPaymentId
   IS NULL`) + 1 do motor de R$ 97,70 líquido (`saleOrderPaymentId` = o pagamento do cartão).

### 2.10 Pedido só em dinheiro — zero regressão

1. Pedido de R$ 80,00, 1 pagamento em dinheiro.
2. **Esperado**: exatamente **1** `FinancialEntry`, idêntico byte-a-byte ao que o sistema gera hoje
   (nenhum campo novo preenchido além dos defaults `null`/`false`).

## 3. Testes automatizados a rodar

```bash
# Calculador puro — TDD, roda sem banco
pnpm --filter @citybox/erp-api test -- card-settlement-calculator
pnpm --filter @citybox/erp-api test -- business-day-calendar

# Regressão de SaleOrder (baixa de estoque, imutabilidade pós-baixa)
pnpm --filter @citybox/erp-api test -- create-sale-order

# Gate completo
pnpm --filter @citybox/erp-api build && pnpm --filter @citybox/erp-api lint && pnpm --filter @citybox/erp-api typecheck && pnpm --filter @citybox/erp-api test
pnpm --filter @citybox/erp-web typecheck && pnpm --filter @citybox/erp-web lint
```

## 4. Verificação manual no browser

1. `http://localhost:3107/vendas/pedidos-de-venda/novo` — confirmar que o painel de Pagamentos
   mostra Bandeira/Parcelas ao escolher Cartão de débito/crédito, e que Pix não pede bandeira.
2. `http://localhost:3107/financas/lancamentos` — abrir um recebível gerado pelos cenários acima e
   conferir bruto/taxa/líquido visíveis, e o badge de fallback no cenário 2.7.
3. `http://localhost:3107/financas/contratos-de-cartoes-e-outros/novo` — conferir que o campo
   Bandeira do método de pagamento continua funcionando (agora importado de `data/card-brands.ts`).
