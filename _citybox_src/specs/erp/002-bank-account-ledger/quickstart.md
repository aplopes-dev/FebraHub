# Quickstart: validar Contas bancárias (saldo real, extrato, transferência) ponta a ponta

Roteiro manual mapeado 1:1 nos cenários de aceite do [`spec.md`](./spec.md). Sem suíte E2E
automatizada em `erp-web` nesta feature (mesma decisão de `001-financial-entries/research.md`
D15) — este roteiro é a validação de fato, junto dos gates de tipo/lint/teste de unidade do
backend.

## Pré-requisitos

```bash
pnpm infra:up:postgres        # na raiz — Postgres local
```

Este roteiro assume `001-financial-entries` já implementada (Lançamentos financeiros real —
US1/US2 abaixo dependem de `FinancialEntryPayment` persistido).

## Setup

```bash
pnpm --filter @citybox/erp-api db:migrate:dev
pnpm --filter @citybox/erp-api db:seed

pnpm dev:comercio    # erp-api :3114 + erp-web :3107
```

Login: `http://localhost:3107` via Keycloak, usuário OWNER/ADMIN de uma organização de teste
(MEMBER só no cenário de permissão da transferência).

## Roteiro por User Story

### US1 — Ver o saldo real de cada conta (P1)

1. `/financas/contas-bancarias` → **Nova conta**: banco (Select do catálogo), saldo inicial
   R$ 10.000,00, data de abertura hoje. Salvar.
2. **Esperado**: a linha da conta na lista mostra **R$ 10.000,00** de saldo (não R$ 0,00).
3. Abrir o detalhe da conta. **Esperado**: card de saldo também mostra R$ 10.000,00.
4. Reabrir o formulário de edição da mesma conta. **Esperado**: o `Select` de banco vem
   pré-selecionado com o banco original (SC-005 — prova o round-trip de `bankCode`, FR-015).
5. Via `TransferDialog` (ver US4), transferir R$ 5.000,00 **de outra conta** para esta.
   **Esperado**: lista e detalhe agora mostram **R$ 15.000,00** (SC-001).
6. Forçar uma conta a ficar negativa (transferir mais do que ela tem — se a validação de saldo
   suficiente não fizer parte desta fatia, simular via 2 transferências que deixem o saldo
   negativo é aceitável para o teste visual). **Esperado**: saldo aparece em vermelho
   (`error.main`, FR-018).

### US2 — Consultar o extrato da conta com saldo acumulado (P2)

1. Na conta usada acima (que já tem saldo inicial + 1 transferência recebida), abrir o detalhe
   → aba **Histórico**.
2. **Esperado**: 2 linhas, mais recente primeiro, cada uma com o saldo logo depois dela — a
   linha mais antiga (saldo inicial) mostra saldo igual a R$ 10.000,00; a mais recente (a
   transferência) mostra R$ 15.000,00 (SC-003).
3. Registrar pagamentos suficientes num lançamento financeiro (`/financas/lancamentos`, ver
   `001-financial-entries` quickstart US1/US2) vinculado a esta mesma conta, até ter movimentações
   suficientes para passar de 1 página (ajustar `perPage` via query string se necessário para
   forçar 2+ páginas com poucos dados de teste). Navegar da página 1 para a página 2 do
   Histórico. **Esperado**: o saldo acumulado da primeira linha da página 2 continua batendo
   com a continuação da sequência da página 1 — não reinicia, não pula (FR-007).
4. Acessar `/financas/contas-bancarias/<id>?view=historico` diretamente (sem clicar na aba).
   **Esperado**: abre já na aba Histórico (FR-008).

### US3 — Consultar as transações da conta (P2)

1. No mesmo detalhe, aba **Transações**. **Esperado**: mesmas movimentações do Histórico, mas
   sem saldo acumulado — colunas usuário/data de efetivação/descrição/tipo.
2. Aplicar filtro de tipo (ex.: só "Entrada"). **Esperado**: só as movimentações `credit`/
   `initial_balance` aparecem; abrir a aba Network do DevTools e conferir que o filtro foi numa
   query string (`kind=`), não um `.filter()` client-side.
3. Aplicar filtro de período cobrindo só a data do saldo inicial. **Esperado**: só a
   movimentação de saldo inicial aparece.
4. Criar uma conta nova sem saldo inicial (R$ 0,00), abrir Transações. **Esperado**: lista
   vazia, sem erro (edge case do `spec.md`).
5. Atualizar a página (F5) numa conta com movimentações. **Esperado**: tudo continua lá (prova
   que não é mais o mock em memória).

### US4 — Transferir dinheiro entre contas (P2)

1. Criar uma segunda conta bancária (conta B) com saldo inicial R$ 2.000,00.
2. Em `/financas/lancamentos`, abrir o `TransferDialog` (CTA **Transferências**). Preencher:
   conta de saída = conta A, conta de entrada = conta B, valor R$ 500,00, data de hoje, forma
   de pagamento, centro de custo (Select real), descrição. Confirmar.
3. **Esperado**: toast de sucesso; abrir a conta A → saldo caiu R$ 500,00; abrir a conta B →
   saldo subiu R$ 500,00; ambas mostram a movimentação no extrato/transações (Acceptance
   Scenario 1).
4. Atualizar a página (F5) em ambas as contas. **Esperado**: os novos saldos persistem
   (SC-002 — não é otimista-e-perdido no refresh).
5. Reabrir o `TransferDialog`, escolher a **mesma conta** em origem e destino. **Esperado**:
   erro claro antes de qualquer chamada de rede bem-sucedida (Acceptance Scenario 2).
6. Reabrir o `TransferDialog`, tentar confirmar sem valor, ou com valor 0/negativo, ou sem data.
   **Esperado**: recusado (Acceptance Scenario 3) — para provar que o backend também valida
   (não só a UI), reproduzir via `curl`:
   ```bash
   curl -X POST http://localhost:3114/api/v1/bank-transfers \
     -H "X-Organization-Id: <org>" -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
     -d '{"fromBankAccountId":"<a>","toBankAccountId":"<a>","amountCents":10000,"effectiveAt":"2026-08-05","paymentMethod":"pix","costCenterId":"<cc>"}'
   ```
   **Esperado**: `422` (`BankTransferSameAccountError`, mesma conta nos dois lados).
7. Logar com um usuário papel `MEMBER` (sem `store.finance.manage`) → tentar transferir.
   **Esperado**: ação bloqueada (403 refletido na UI, Acceptance Scenario 4).

### Integração com Lançamentos financeiros (RN-12/RN-13/FR-016/FR-017/SC-006)

1. Criar um lançamento `receivable` de R$ 1.000,00 vinculado à conta A, com 1 pagamento de
   R$ 1.000,00 em dinheiro, data de hoje. Salvar.
2. Abrir a conta A → aba Transações. **Esperado**: aparece uma movimentação `credit` de
   R$ 1.000,00 originada no lançamento (SC-006 — "em até o tempo de uma requisição normal").
3. Excluir esse lançamento (soft-delete). **Esperado**: reabrindo a conta A, a movimentação some
   e o saldo cai R$ 1.000,00 (FR-017, primeira metade).
4. Restaurar o lançamento. **Esperado**: a movimentação reaparece e o saldo volta a subir
   R$ 1.000,00 (FR-017, segunda metade).
5. Fechar um pedido de venda com pagamento vinculado à conta A (fora desta feature, módulo
   `sales`) — reprocessar o mesmo pedido (fechar de novo) não deve duplicar a movimentação
   (RN-13 + regressão de `001-financial-entries` RN-19): checar
   `SELECT count(*) FROM erp.bank_transactions WHERE source_type = 'financial_entry_payment' AND source_id = '<financialEntryId>'`
   — deve ser **1**.

## Gate antes de considerar a feature pronta

```bash
pnpm --filter @citybox/erp-api build && pnpm --filter @citybox/erp-api lint && pnpm --filter @citybox/erp-api typecheck && pnpm --filter @citybox/erp-api test
pnpm --filter @citybox/erp-web typecheck && pnpm --filter @citybox/erp-web lint
grep -r "services/bank-account.service\|data/mock-bank-accounts" apps/erp/web/src/features   # deve retornar vazio (ambos removidos)
```

## Débitos técnicos assumidos por este plano (registrar em `tasks.md`/`AGENTS.md` ao final)

- `BankAccount.branchIds` continua `String[]` (não pivot `BankAccountBranch`) — dívida
  pré-existente, fora do escopo autorizado desta fatia (Assumption do `spec.md`).
- Conciliação bancária / importação OFX permanece fora de escopo — `reconciliation` só existe
  como valor reservado do enum `BankTransactionSourceType`.
- `BankTransaction.createdByName` fica vazio para movimentações originadas de pagamento de
  lançamento financeiro (`FinancialEntryPayment` não guarda usuário responsável hoje —
  `research.md` D8).
- Saldo acumulado do extrato é O(nº de movimentações até a página pedida) — aceitável no volume
  atual (`research.md` D3); sem gatilho de revisão conhecido.
