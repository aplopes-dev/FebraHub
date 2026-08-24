# Contrato — `FinancialEntry` (delta de leitura)

Não é uma rota nova. Estende as respostas já existentes de `GET /v1/financial-entries` (listagem,
consumida por `features/financial-entries` e por `features/financial-statement`) e
`GET /v1/financial-entries/:id` (detalhe), via `FinancialEntryPresenter`
(`apps/erp/api/src/modules/finance/financial-entries/infrastructure/http/routes/shared/financial-entry.presenter.ts`).

## Campos adicionados — detalhe (`toHttp`/`toHttpSingle`)

```ts
{
  // ...todos os campos já existentes, inalterados...
  grossAmountCents: number | null;
  acquirerFeeCents: number | null;
  cardContractId: string | null;
  cardPaymentMethodId: string | null;
  saleOrderPaymentId: string | null;
  installmentSequence: number | null;
  installmentCount: number | null;
  cardSettlementFallback: boolean;
}
```

## Campos adicionados — item de listagem (`toHttpListItem`/`toHttpList`)

Mesmo os oito campos acima, **exceto** `cardContractId`/`cardPaymentMethodId`/
`saleOrderPaymentId` (não usados pela UI de lista — evita inchar o payload da listagem sem
necessidade). A lista carrega o suficiente para renderizar o badge de fallback e, se o design
pedir, o valor bruto/taxa em uma coluna opcional:

```ts
{
  // ...campos já existentes do item de lista, inalterados...
  grossAmountCents: number | null;
  acquirerFeeCents: number | null;
  installmentSequence: number | null;
  installmentCount: number | null;
  cardSettlementFallback: boolean;
}
```

## Exemplo — recebível gerado pelo motor (crédito 3x, dias corridos)

```json
{
  "id": "fe_01J...",
  "operation": "receivable",
  "amountCents": 19846,
  "grossAmountCents": 20000,
  "acquirerFeeCents": 154,
  "cardContractId": "cc_01J...",
  "cardPaymentMethodId": "cpm_01J...",
  "saleOrderPaymentId": "sop_01J...",
  "installmentSequence": 2,
  "installmentCount": 3,
  "cardSettlementFallback": false,
  "paidCents": 0,
  "status": "pending",
  "dueDate": "2026-09-15T00:00:00.000Z",
  "bankAccountId": "ba_01HXYZ..."
}
```

## Exemplo — recebível de fallback (sem contrato/método correspondente)

```json
{
  "id": "fe_01J...",
  "operation": "receivable",
  "amountCents": 20000,
  "grossAmountCents": null,
  "acquirerFeeCents": null,
  "cardContractId": null,
  "cardPaymentMethodId": null,
  "saleOrderPaymentId": "sop_01J...",
  "installmentSequence": 1,
  "installmentCount": 1,
  "cardSettlementFallback": true,
  "paidCents": 20000,
  "status": "paid",
  "dueDate": "2026-08-06T00:00:00.000Z"
}
```

Note: no fallback, `grossAmountCents`/`acquirerFeeCents` ficam `null` (não há taxa a rastrear —
FR-005 gera o recebível no formato bruto de hoje); `cardSettlementFallback=true` é o único sinal de
que esse pagamento tinha `cardPaymentType` mas não encontrou correspondência.

## Frontend — indicador visível (`financial-entries`)

`cardSettlementFallback=true` → badge (`SemanticBadge` tom `warning`, ver `web/AGENTS.md` §"Badges
das listagens") na linha da lista e no cabeçalho do detalhe, texto sugerido: **"Gerado sem contrato
aplicável"**. Quando `grossAmountCents`/`acquirerFeeCents` não são nulos, o detalhe exibe os três
valores lado a lado (Bruto / Taxa / Líquido) — User Story 5 do spec.

## Fora de escopo desta entrega

- `GET /v1/financial-entries/summary` (cards de resumo, feature `004-financial-statement`) **não**
  precisa somar `grossAmountCents`/`acquirerFeeCents` — os totais de entrada/saída continuam sobre
  `amountCents` (líquido), que já é o valor correto a exibir como "quanto entra".
