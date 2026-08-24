# Contract: Bloqueio de exclusão de lançamento conciliado (`erp-api`)

## `DELETE /v1/financial-entries/:id` (rota existente — mudança de contrato)

**Antes**: sempre soft-deleta (204), sem checar conciliação.

**Depois**:
1. Chama `BankStatementMatchRepository.findActiveFinancialEntryIds(organizationId, [id])` (método já existente, reaproveitado — sem novo método de repositório).
2. Se `id` estiver no `Set` retornado → responde **409** com um novo erro de domínio `FinancialEntryNotRemovableError`, mensagem explicando que é preciso desfazer a conciliação primeiro (FR-006e).
3. Caso contrário, segue o soft-delete atual sem mudança (204).

```json
// 409 response body (mesmo formato de erro já usado por PaymentMethodNotRemovableError / FinancialGroupInUseError)
{ "success": false, "error": "Não é possível excluir: este lançamento tem um pagamento conciliado. Desfaça a conciliação antes de excluir." }
```

## Novo: `POST /v1/bank-statements/:bankStatementId/transactions/:transactionId/reconcile/undo`

**Status atual**: o frontend já chama esta rota (`undoReconciliationApi`, `use-bank-reconciliation-mutations.ts`) e a entidade `BankStatementTransaction.undoReconciliation()` já existe — mas a rota **não existe no backend** (grounding em 2026-08-09, `research.md` R9). Sem ela, FR-006f ("depois de desfazer a conciliação, a exclusão volta a ser permitida") não é alcançável pelo usuário.

**Contrato a implementar** (módulo `bank-reconciliation`, não `financial-entries`):

- Input: `{ organizationId, bankStatementId, transactionId }` (path params + escopo).
- Precondições: `BankStatementTransaction` existe, pertence ao `bankStatementId`, e `status === 'reconciled'` — senão `BankStatementTransactionNotReconciledError` (422 — mesmo fallback de status já usado por `BankStatementTransactionNotPendingError`/`FinancialEntryAlreadyReconciledError` em `reconcile-transaction`; erro de domínio já existe em `domain/errors/bank-statement-transaction-not-reconciled.error.ts`, hoje sem nenhum use-case que o lance).
- Efeito (nesta ordem): (1) `transaction.undoReconciliation()` → persiste `status = 'pending'`, `reconciledAt = null`; (2) `bankStatementMatchRepository.deleteByTransactionId(organizationId, transactionId)` (método já existente, hard-delete — consistente com o comentário do repositório "o vínculo só existe enquanto ativo", R9). É essa remoção que faz `findActiveFinancialEntryIds` parar de listar o lançamento, liberando a exclusão (FR-006f).
- Response `200`: `{ "data": { "transactionId": "...", "status": "pending" } }` (forma exata a confirmar em `/speckit-tasks`, seguindo o padrão de `ReconcileTransactionResult`).

**Efeito colateral a decidir em `/speckit-tasks`**: se o `FinancialEntryPayment` criado por `addPayment` durante a conciliação original (`paymentMethod: 'conciliacao_bancaria'`) deve ser removido do lançamento ao desfazer, ou permanece como pagamento manual órfão até o usuário editar o lançamento manualmente. Não é uma pergunta de produto nova (fora do escopo das Clarifications já resolvidas) — é decisão de implementação do módulo `bank-reconciliation`, registrar como task com opção default "mantém o pagamento, usuário ajusta manualmente" (menor risco de perda de dado silenciosa) a menos que o `/speckit-tasks` decida diferente.
