# Contract: `POST /v1/bank-statements/:bankStatementId/transactions/:transactionId/create-entry`

**Módulo**: `apps/erp/api/src/modules/finance/bank-reconciliation`
**Muda**: request body ganha `customerId`/`supplierId` opcionais (D2).
Response inalterado.

## Request (depois)

```jsonc
{
  "description": "string?",
  "partyName": "string?",       // inalterado — rótulo congelado
  "customerId": "uuid?",         // novo — mutuamente exclusivo com supplierId
  "supplierId": "uuid?",         // novo — mutuamente exclusivo com supplierId
  "categoryName": "string?",
  "note": "string?",
  "bankAccountId": "uuid",       // obrigatório (inalterado)
  "chartOfAccountId": "uuid",    // obrigatório (inalterado)
  "costCenterId": "uuid"         // obrigatório (inalterado)
}
```

Validação: se `customerId` e `supplierId` vierem preenchidos ao mesmo tempo,
`FinancialEntry.create()` já lança erro de domínio (regra existente,
reaproveitada — não é uma validação nova).

## Response 201 (sucesso)

Inalterado — `FinancialEntry` serializado já expõe `customerId`/`supplierId`
(usado pela tela de Lançamentos financeiros hoje).

## Comportamento quando não há cliente/fornecedor no cadastro (FR-008)

Sem mudança no contrato HTTP — é responsabilidade do frontend mostrar
"Nenhum cliente ou fornecedor encontrado" no Autocomplete quando
`useSelectableCustomersQuery`/`useActiveSuppliersQuery` retornam listas vazias
(mesmo `noOptionsText` já usado em Lançamentos financeiros).
