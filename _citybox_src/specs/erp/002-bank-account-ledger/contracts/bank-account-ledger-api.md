# API Contract: Contas bancárias — ledger, extrato e transferência

Base `/api/v1`. Todas as rotas são organization-scoped (`X-Organization-Id`, guards globais já
existentes). Dinheiro sempre em **centavos**. Envelope padrão do módulo `finance`: item único em
`{ data }`; listas em `{ data, meta: { total, page, perPage, totalPages } }` (+ `tabCounts`
quando a rota tiver abas).

## `BankAccount` — rotas existentes, resposta estendida

### `GET /v1/bank-accounts` · `GET /v1/bank-accounts/:id`

Sem mudança de assinatura de request. Resposta ganha 2 campos:

```jsonc
{
  "data": {
    "id": "…",
    "name": "Conta corrente — Banco do Brasil",
    "bankName": "Banco do Brasil",
    "bankCode": "bank-bb",           // NOVO — FR-015
    "openingBalanceCents": 1000000,
    "openedAt": "2026-01-05",
    "branchIds": ["…"],
    "currentBalanceCents": 1550000,   // NOVO — FR-004, calculado (research.md D2)
    "deletedAt": null,
    "createdAt": "2026-01-05T12:00:00.000Z"
  }
}
```

Permissão: `org.view` (inalterada).

### `POST /v1/bank-accounts` · `PUT /v1/bank-accounts/:id`

Body ganha `bankCode?: string` (opcional, `@default("")`), ao lado de `bankName`. Efeito
colateral novo: se `openingBalanceCents > 0`, a movimentação `initial_balance` é
criada/ressincronizada no mesmo `save()` (RN-02/FR-003, research.md D1). Permissão:
`store.finance.manage` (inalterada).

## `BankTransaction` — rotas novas aninhadas em `bank-accounts/:id`

### `GET /v1/bank-accounts/:id/transactions` — aba Transações (FR-005)

Permissão: `org.view`.

**Query**: `kind?` (`initial_balance`\|`credit`\|`debit`), `effectiveFrom?`/`effectiveTo?`
(`YYYY-MM-DD`, filtra por período), `page?`, `perPage?` (default 20, teto 100).

**Resposta**:

```jsonc
{
  "data": [
    {
      "id": "…",
      "kind": "credit",
      "description": "Recebimento de vendas — cartão (lote 28/06)",
      "amountCents": 512075,
      "effectiveAt": "2026-07-03",
      "sourceType": "financial_entry_payment",
      "createdByName": "",
      "createdAt": "2026-07-03T10:00:00.000Z"
    }
  ],
  "meta": { "total": 6, "page": 1, "perPage": 20, "totalPages": 1 }
}
```

Ordenação: `effectiveAt DESC, createdAt DESC, id DESC` (research.md D7). 404
(`BankAccountNotFoundError`) se `:id` não existir/for de outra organização — inclui contas
soft-deleted (mesma regra de `FindBankAccountById`, a aba "Excluídas" leva até o detalhe delas).

### `GET /v1/bank-accounts/:id/statement` — aba Histórico (FR-006/FR-007)

Permissão: `org.view`.

**Query**: `page?`, `perPage?` (default 20, teto 100) — sem filtro de tipo/período (é o extrato
completo, não a visão analítica).

**Resposta**:

```jsonc
{
  "data": [
    {
      "transaction": {
        "id": "…",
        "kind": "credit",
        "description": "Recebimento de vendas — cartão (lote 28/06)",
        "amountCents": 512075,
        "effectiveAt": "2026-07-03",
        "sourceType": "financial_entry_payment",
        "createdByName": "",
        "createdAt": "2026-07-03T10:00:00.000Z"
      },
      "runningBalanceCents": 1522075   // saldo da conta imediatamente após esta movimentação
    }
  ],
  "meta": { "total": 6, "page": 1, "perPage": 20, "totalPages": 1 }
}
```

`runningBalanceCents` correto entre páginas (não reinicia, não recalcula errado — FR-007,
SC-003) — algoritmo em `research.md` D3. Mesma ordenação/tiebreak de D7. Mesmo 404 de
`:id` inválido que `/transactions`.

## `BankTransfer` — submódulo novo

### `POST /v1/bank-transfers` (FR-009/FR-010)

Permissão: `store.finance.manage`.

**Body**:

```jsonc
{
  "fromBankAccountId": "…",
  "toBankAccountId": "…",
  "amountCents": 100000,
  "effectiveAt": "2026-08-05",
  "paymentMethod": "transferencia",   // ∈ FINANCIAL_ENTRY_PAYMENT_METHODS (research.md D4)
  "costCenterId": "…",
  "description": "Transferência para cobrir despesas da loja Orla."   // opcional, default ""
}
```

**Resposta `201`**:

```jsonc
{
  "data": {
    "id": "…",
    "fromBankAccountId": "…",
    "toBankAccountId": "…",
    "amountCents": 100000,
    "effectiveAt": "2026-08-05",
    "paymentMethod": "transferencia",
    "costCenterId": "…",
    "description": "Transferência para cobrir despesas da loja Orla.",
    "createdAt": "2026-08-05T12:00:00.000Z"
  }
}
```

**Erros**:

| Status | Erro | Quando |
|---|---|---|
| `422` | `BankTransferSameAccountError` | `fromBankAccountId === toBankAccountId` (FR-011) |
| `422` | validação de DTO (`class-validator`) | `amountCents <= 0`, `effectiveAt` ausente/inválida, `paymentMethod` fora do enum, `description` não fornecida como string (FR-012) |
| `404` | `BankAccountNotFoundError` | conta de origem ou destino não existe / de outra organização / excluída (FR-013) |
| `404` | `CostCenterNotFoundError` | `costCenterId` não existe / de outra organização |
| `403` | — | usuário sem `store.finance.manage` (FR-014) |

Atomicidade: registro + 2 movimentações numa única transação Prisma — se qualquer validação ou
escrita falhar, nada é persistido (FR-010, SC-004). Transferência criada **não** tem
`PUT`/`DELETE` — é permanente nesta fase (FR-020); correção é uma nova transferência em
sentido oposto.

## Efeito indireto em `financial-entries` (sem mudança de contrato HTTP)

Nenhuma rota de `financial-entries` muda de assinatura. O efeito é só server-side:
`POST`/`PUT`/`DELETE`/`POST …/restore` de `/v1/financial-entries[/:id]` passam a
criar/ressincronizar `BankTransaction` quando `bankAccountId` está preenchido (RN-12/FR-016/
FR-017, research.md D1). Do ponto de vista do cliente HTTP de `financial-entries`, nada muda —
o efeito só é observável ao consultar `/v1/bank-accounts/:id/transactions` ou `/statement` da
conta envolvida (SC-006).
