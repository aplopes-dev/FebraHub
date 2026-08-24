# Tasks: Contas bancárias — saldo real, extrato e transferência

**Input**: Design documents from `/specs/erp/002-bank-account-ledger/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/bank-account-ledger-api.md](./contracts/bank-account-ledger-api.md), [quickstart.md](./quickstart.md)

**Tests**: Backend segue TDD obrigatório por convenção do projeto (`CLAUDE.md` / `api/AGENTS.md` — todo use case novo/alterado tem `.spec.ts` com repositório in-memory, escrito **antes** da implementação — mesmo padrão de `001-financial-entries/tasks.md`). Frontend não tem infraestrutura de teste em `erp-web`; validação end-to-end é manual, via `quickstart.md`.

**Organization**: Tarefas agrupadas por user story (prioridades de `spec.md`). Nota de dependência real: a sincronização das movimentações originadas em pagamento de lançamento financeiro (RN-12/RN-13/FR-016/FR-017) não tem User Story numerada própria — é o mecanismo que torna "saldo real" (US1) verdadeiro para o caminho mais comum (pagamento de lançamento), então entra dentro da **US1**, junto do caminho alternativo de transferência (US4, independente). Ver `research.md` D1 para o desenho completo.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: US1–US4, mapeando para as user stories de `spec.md`
- Caminhos de arquivo sempre relativos à raiz do monorepo (`/root/aplopes-city`)

---

## Phase 1: Setup

**Purpose**: Preparação mínima — feature entra num app já estruturado (brownfield), sem inicialização de projeto. Pressupõe `001-financial-entries` já implementada (`FinancialEntryPayment` persistido).

- [X] T001 Confirmar infraestrutura local no ar (`pnpm infra:up:postgres`) antes de iniciar a Phase 2 — ver `infra/AGENTS.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema do livro-razão, entidade/repositório de leitura de `BankTransaction` e substrato de teste compartilhado — tudo que **toda** user story depende.

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase terminar.

- [X] T002 Alterar `apps/erp/api/prisma/schema.prisma`: adicionar `bankCode String @default("") @map("bank_code")` a `BankAccount`; criar `enum BankTransactionKind { initial_balance credit debit }`, `enum BankTransactionSourceType { initial_balance financial_entry_payment bank_transfer reconciliation }`, `model BankTransaction` e `model BankTransfer` — campos/índices/relações exatamente como em [data-model.md](./data-model.md)
- [X] T003 Rodar `pnpm --filter @citybox/erp-api db:migrate:dev --name add_bank_transactions_and_transfers` (depende de T002) — gera e aplica a migration; **proibido** editar o `.sql` gerado à mão (`api/AGENTS.md` §5.9)
- [X] T004 Rodar `pnpm --filter @citybox/erp-api db:generate` para regenerar o client Prisma em `generated/prisma` (depende de T003)
- [X] T005 [P] Registrar `BankTransaction: 'organizationId'` e `BankTransfer: 'organizationId'` em `TENANT_SCOPED_MODELS` (`apps/erp/api/src/shared/infra/prisma/tenant-scope.extension.ts`) (depende de T003)
- [X] T006 [P] Criar `apps/erp/api/src/modules/finance/bank-accounts/domain/entities/bank-transaction.entity.ts`: entidade imutável (só `create()`/`with()`, sem setters) — invariantes `amountCents > 0` e `effectiveAt` obrigatório (RN-03)
- [X] T007 Criar `apps/erp/api/src/modules/finance/bank-accounts/domain/repositories/bank-transaction.repository.interface.ts`: `sumBalancesByAccountIds(organizationId, bankAccountIds): Promise<Record<string, number>>` (research.md D2), `countByAccount(organizationId, bankAccountId, criteria?)`, `findByAccount(organizationId, bankAccountId, criteria: { kind?, effectiveFrom?, effectiveTo?, skip?, take? })`, `findOrderedThrough(organizationId, bankAccountId, limit)` (research.md D3, ordenação D7) (depende de T006)
- [X] T008 Criar `apps/erp/api/src/modules/finance/bank-accounts/infrastructure/database/prisma-bank-transaction.repository.ts`: `sumBalancesByAccountIds` via `groupBy(by: ['bankAccountId','kind'])` reduzido em código; `findOrderedThrough`/`findByAccount` via `findMany` com `ORDER BY effectiveAt DESC, createdAt DESC, id DESC` (depende de T007, T004)
- [X] T009 [P] Criar `apps/erp/api/src/modules/finance/bank-accounts/tests/in-memory-bank-transaction.repository.ts`: replica a mesma lógica de agregação/ordenação do repositório Prisma, sobre um array em memória (depende de T007)
- [X] T010 [P] Atualizar `apps/erp/api/src/modules/finance/bank-accounts/tests/bank-accounts-test-factory.ts`: `makeBankTransaction(overrides)` + `makeBankAccountRepositories()` passa a construir e devolver também a `InMemoryBankTransactionRepository` compartilhada (mesma instância usada pelo repositório de conta — ver T011) (depende de T009)
- [X] T011 Atualizar `apps/erp/api/src/modules/finance/bank-accounts/tests/in-memory-bank-account.repository.ts`: `save()` passa a sincronizar (apagar + recriar se `openingBalanceCents > 0`) a movimentação `initial_balance` (`sourceType=initial_balance`, `sourceId=bankAccount.id`) na `InMemoryBankTransactionRepository` compartilhada — espelha o que `PrismaBankAccountRepository.save()` fará de verdade (research.md D1) (depende de T010)
- [X] T012 Atualizar `apps/erp/api/src/modules/finance/bank-accounts/bank-accounts.module.ts`: registrar `{ provide: BankTransactionRepository, useClass: PrismaBankTransactionRepository }` e incluir em `exports` (junto de `BankAccountRepository`, que já é exportado) — é o que permite `bank-transfers` e `financial-entries` injetá-lo sem reimplementar acesso a dado (depende de T008)

**Checkpoint**: schema migrado, leitura do ledger pronta (real + in-memory), fábrica de testes atualizada — user stories podem começar.

---

## Phase 3: User Story 1 - Ver o saldo real de cada conta (Priority: P1) 🎯 MVP

**Goal**: Lista e detalhe de conta bancária mostram o saldo **calculado** (soma das movimentações), não mais o saldo de abertura estático. A movimentação de saldo inicial nasce no backend ao criar/editar a conta. Pagamentos de lançamentos financeiros (inclusive o recebível gerado ao fechar um pedido de venda) passam a gerar/ressincronizar movimentações — o caminho mais comum de "saldo muda de verdade" além da transferência (US4). O catálogo de bancos ganha um identificador estável (`bankCode`), corrigindo o round-trip do formulário.

**Independent Test**: Criar uma conta com saldo inicial de R$ 10.000; registrar o pagamento de um lançamento financeiro de R$ 5.000 vinculado a essa conta; lista e detalhe devem mostrar R$ 15.000 (não R$ 10.000). Reabrir o formulário de edição da conta e confirmar que o banco originalmente selecionado continua marcado.

### Tests for User Story 1 (TDD obrigatório) ⚠️

> Escrever e rodar (RED) antes de implementar

- [X] T013 [P] [US1] Estender `apps/erp/api/src/modules/finance/bank-accounts/application/use-cases/create-bank-account/create-bank-account.use-case.spec.ts`: `openingBalanceCents > 0` cria a movimentação `initial_balance`; `openingBalanceCents = 0` não cria nenhuma; `bankCode` é persistido e devolvido
- [X] T014 [P] [US1] Estender `.../update-bank-account/update-bank-account.use-case.spec.ts`: aumentar/diminuir/zerar `openingBalanceCents` numa edição ressincroniza a movimentação (nunca duplica); `bankCode` faz round-trip
- [X] T015 [P] [US1] Estender `.../list-bank-accounts/list-bank-accounts.use-case.spec.ts`: `result.balances[accountId]` reflete a soma das movimentações (saldo inicial + injeções de teste), não `openingBalanceCents`
- [X] T016 [P] [US1] Criar `.../find-bank-account-by-id/find-bank-account-by-id.use-case.spec.ts` (não existia): devolve `currentBalanceCents` correto; `null`/erro para conta inexistente ou de outra organização
- [X] T017 [P] [US1] Criar `apps/erp/api/src/modules/finance/financial-entries/domain/services/derive-bank-transaction-inputs.spec.ts`: lançamento com `payments[]` gera 1 input por linha; lançamento sem `payments[]` mas com `paidCents > 0` gera 1 input sintético (caso do recebível de venda); `operation=receivable` → `kind=credit`, `payable` → `debit`; sem `bankAccountId` → `[]`
- [X] T018 [P] [US1] Estender `apps/erp/api/src/modules/finance/financial-entries/application/use-cases/create-financial-entry/create-financial-entry.use-case.spec.ts`: criar um `receivable` com 1 pagamento e conta bancária produz 1 `BankTransaction` `credit`; `payable` produz `debit`; sem `bankAccountId` não produz nenhuma (consultar via a `BankTransactionRepository` in-memory compartilhada — depende de T010)
- [X] T019 [P] [US1] Estender `.../update-financial-entry/update-financial-entry.use-case.spec.ts`: editar `payments[]` ressincroniza as movimentações (as antigas somem, as novas aparecem — nunca duplica)
- [X] T020 [P] [US1] Estender `.../delete-financial-entry/delete-financial-entry.use-case.spec.ts`: soft-delete remove as movimentações originadas do lançamento (FR-017, primeira metade)
- [X] T021 [P] [US1] Estender `.../restore-financial-entry/restore-financial-entry.use-case.spec.ts`: restaurar recria as movimentações a partir de `payments[]`/`paidCents` persistidos (FR-017, segunda metade)

### Implementation for User Story 1 — Backend: conta bancária

- [X] T022 [US1] Atualizar `apps/erp/api/src/modules/finance/bank-accounts/domain/entities/bank-account.entity.ts`: `bankCode` em `BankAccountProps`/`create()`/`update()`/`with()` + getter
- [X] T023 [P] [US1] Atualizar `apps/erp/api/src/modules/finance/bank-accounts/application/dtos/bank-account.dto.ts`: `bankCode?` em `CreateBankAccountDto`/`UpdateBankAccountDto`; `ListBankAccountsResult` ganha `balances: Record<string, number>`; novo tipo `BankAccountWithBalance = { account: BankAccount; currentBalanceCents: number }` para o retorno de `FindBankAccountById`
- [X] T024 [US1] Atualizar `.../use-cases/create-bank-account/create-bank-account.use-case.ts`: repassa `bankCode` para `BankAccount.create()` (depende de T022, T023 — faz T013 passar)
- [X] T025 [US1] Atualizar `.../use-cases/update-bank-account/update-bank-account.use-case.ts`: repassa `bankCode` (depende de T022, T023 — faz T014 passar)
- [X] T026 [US1] Atualizar `.../use-cases/list-bank-accounts/list-bank-accounts.use-case.ts`: injeta `BankTransactionRepository`, chama `sumBalancesByAccountIds(organizationId, items.map(i => i.id))`, devolve em `result.balances` (depende de T012, T023 — faz T015 passar)
- [X] T027 [US1] Atualizar `.../use-cases/find-bank-account-by-id/find-bank-account-by-id.use-case.ts`: injeta `BankTransactionRepository`, devolve `BankAccountWithBalance | null` (depende de T012, T023 — faz T016 passar)
- [X] T028 [US1] Atualizar `apps/erp/api/src/modules/finance/bank-accounts/infrastructure/database/prisma-bank-account.repository.ts` `save()`: envolver em `$transaction`; após o `upsert` da conta, sincronizar (apagar + recriar se `openingBalanceCents > 0`) a `BankTransaction` `initial_balance` via `tx.bankTransaction.*` direto (mesmo padrão de `PrismaFinancialEntryRepository.save()` com os filhos) (depende de T022)
- [X] T029 [P] [US1] Atualizar `.../infrastructure/http/routes/shared/bank-account.dto.ts`: `bankCode?` no corpo de escrita
- [X] T030 [US1] Atualizar `.../infrastructure/http/routes/shared/bank-account.presenter.ts`: `toHttp(account, currentBalanceCents)` inclui `bankCode`/`currentBalanceCents`; `toHttpList(result)` faz o zip de `result.items` com `result.balances`; `toHttpSingle` recebe `BankAccountWithBalance` (depende de T026, T027)
- [X] T031 [US1] Atualizar as 4 rotas (`list-bank-accounts.route.ts`, `find-bank-account-by-id.route.ts`, `create-bank-account.route.ts`, `update-bank-account.route.ts`) para as novas assinaturas de use case/presenter (depende de T030)

### Implementation for User Story 1 — Backend: sincronização com pagamentos de lançamento

- [X] T032 [P] [US1] Criar `apps/erp/api/src/modules/finance/financial-entries/domain/services/derive-bank-transaction-inputs.ts`: função pura `deriveBankTransactionInputsFromEntry(entry: FinancialEntry): BankTransactionInput[]` — 1 input por `payments[]`, ou 1 sintético a partir de `paidCents` quando `payments` está vazio e `paidCents > 0` (cobre o recebível gerado por venda); `kind` de `operation` (`receivable`→`credit`, `payable`→`debit`); `[]` se `bankAccountId` for nulo (research.md D1) — faz T017 passar
- [X] T033 [US1] Atualizar `apps/erp/api/src/modules/finance/financial-entries/tests/in-memory-financial-entry.repository.ts`: recebe a `InMemoryBankTransactionRepository` compartilhada no construtor; `save()`/`softDelete()`/`clearDeletedAt()` chamam `deriveBankTransactionInputsFromEntry` + sincronizam (apaga tudo com `sourceType=financial_entry_payment AND sourceId=entry.id`, recria) (depende de T032)
- [X] T034 [P] [US1] Atualizar `apps/erp/api/src/modules/finance/financial-entries/tests/financial-entries-test-factory.ts`: `makeFinancialEntryRepositories()` também constrói/expõe a `InMemoryBankTransactionRepository` compartilhada, passada ao repositório de lançamento (depende de T033) — faz T018–T021 passarem
- [X] T035 [US1] Atualizar `apps/erp/api/src/modules/finance/financial-entries/infrastructure/database/prisma-financial-entry.repository.ts`: dentro da `$transaction` já existente em `save()`, chamar `deriveBankTransactionInputsFromEntry` + `tx.bankTransaction.deleteMany`/`createMany` (mesmo `sourceId=entry.id`); em `softDelete()`, apagar as mesmas linhas; em `clearDeletedAt()` (restore), recarregar o lançamento com `payments` dentro da própria `$transaction` e recriar (depende de T032)
- [X] T036 [US1] Atualizar `apps/erp/api/src/modules/sales/infrastructure/database/prisma-sale-order.repository.ts` `maybeCreateReceivable`: depois de criar o `FinancialEntry`/`FinancialEntryAllocation` de sistema, criar via `tx.bankTransaction.create()` 1 movimentação `credit`/`financial_entry_payment` (`sourceId` = id do novo lançamento) quando `bankAccountId` estiver preenchido — RN-13/SC-006

### Implementation for User Story 1 — Frontend

- [X] T037 [P] [US1] Renomear `apps/erp/web/src/features/bank-accounts/data/mock-banks.ts` → `apps/erp/web/src/features/bank-accounts/lib/bank-catalog.ts`; cada entrada ganha `code` (research.md D5); atualizar o único import (`bank-account-form.tsx`)
- [X] T038 [US1] Atualizar `apps/erp/web/src/features/bank-accounts/types/bank-account.ts`: `BankAccount`/`BankAccountListItem` ganham `bankCode`; `currentBalance` deixa de ser calculado localmente — vem sempre do DTO da API
- [X] T039 [US1] Reescrever `apps/erp/web/src/features/bank-accounts/api/bank-accounts.service.ts`: `toListItem` lê `dto.bankCode`/`dto.currentBalanceCents` em vez de `dto.bankName || "other"` / `dto.openingBalanceCents / 100` — corrige o bug do FR-004 diretamente (depende de T038)
- [X] T040 [US1] Atualizar `apps/erp/web/src/features/bank-accounts/components/bank-account-form.tsx`: `Select` de banco lê `lib/bank-catalog.ts`, valor = `bankCode`, envia `bankCode` + `bankName` no payload (round-trip — FR-015/SC-005) (depende de T037)
- [X] T041 [US1] Conferir `apps/erp/web/src/features/bank-accounts/components/bank-account-list-table.tsx` e o card de saldo do detalhe: saldo negativo em `error.main` (FR-018) já deve funcionar assim que T039 estiver no ar — ajustar `sx` só se o valor não estiver fluindo corretamente

**Checkpoint**: US1 completa e testável de forma independente — saldo real na lista/detalhe, round-trip de banco, e o caminho "pagamento de lançamento muda o saldo" funcionando ponta a ponta.

---

## Phase 4: User Story 2 - Consultar o extrato da conta com saldo acumulado (Priority: P2)

**Goal**: Aba **Histórico** do detalhe lê dados reais, paginados, com saldo acumulado correto mesmo navegando entre páginas.

**Independent Test**: Conta com 3 movimentações em datas diferentes — abrir Histórico, conferir saldo acumulado correto em cada linha (mais recente primeiro), e que a movimentação mais antiga mostra saldo igual ao valor dela mesma.

### Tests for User Story 2 (TDD obrigatório) ⚠️

- [X] T042 [P] [US2] Criar `apps/erp/api/src/modules/finance/bank-accounts/application/use-cases/get-bank-account-statement/get-bank-account-statement.use-case.spec.ts`: saldo acumulado correto dentro de 1 página; saldo acumulado continua correto entre página 1 e página 2 (simular ≥1 página de movimentações); linha mais antiga tem `runningBalanceCents` igual ao próprio valor (SC-003); conta sem movimentações → lista vazia sem erro; 404 para conta inexistente/de outra organização

### Implementation for User Story 2

- [X] T043 [P] [US2] Criar `apps/erp/api/src/modules/finance/bank-accounts/application/dtos/bank-transaction.dto.ts`: `ListBankAccountTransactionsDto`, `ListBankAccountTransactionsResult`, `GetBankAccountStatementDto`, `GetBankAccountStatementResult` (com `runningBalanceCents` por item)
- [X] T044 [US2] Criar `.../use-cases/get-bank-account-statement/get-bank-account-statement.use-case.ts`: valida a conta (404 se ausente/de outra organização), obtém `totalBalanceCents` (`sumBalancesByAccountIds` com 1 id) + `findOrderedThrough(skip + take)`, caminha do topo (`totalBalanceCents`) subtraindo `signedAmount` de cada linha anterior (research.md D3), devolve a fatia `[skip, skip+take)` (depende de T012, T043 — faz T042 passar)
- [X] T045 [P] [US2] Criar `.../infrastructure/http/routes/shared/bank-transaction.presenter.ts`: `toHttp(transaction)`, `toHttpTransactionList(result)`, `toHttpStatementList(result)` — reaproveitado pela US3 (Transações)
- [X] T046 [US2] Criar `.../infrastructure/http/routes/get-bank-account-statement/get-bank-account-statement.route.ts`: `GET /v1/bank-accounts/:id/statement`, `org.view`, query `page`/`perPage` (depende de T044, T045)
- [X] T047 [US2] Registrar use case + rota em `apps/erp/api/src/modules/finance/bank-accounts/bank-accounts.module.ts` (depende de T046)
- [X] T048 [P] [US2] Estender `apps/erp/web/src/features/bank-accounts/api/bank-accounts.service.ts`: `listBankAccountStatementApi(accountId, params)` + DTO de resposta
- [X] T049 [US2] Estender `apps/erp/web/src/features/bank-accounts/hooks/query-keys.ts` (chaves de `statement`) e criar `hooks/use-bank-account-queries.ts` com `useBankAccountStatementQuery(accountId, params)` (depende de T048)
- [X] T050 [US2] Reescrever `apps/erp/web/src/features/bank-accounts/components/bank-account-statement.tsx`: paginação server-side, loading/erro (`ListLoadErrorAlert`) (depende de T049)
- [X] T051 [US2] Atualizar `apps/erp/web/src/features/bank-accounts/pages/bank-account-detail-page.tsx`: aba Histórico usa `useBankAccountStatementQuery`; confirmar que `?view=historico` continua abrindo direto nela (FR-008) (depende de T050)

**Checkpoint**: US1 + US2 funcionam de forma independente — extrato paginado com saldo acumulado correto.

---

## Phase 5: User Story 3 - Consultar as transações da conta (Priority: P2)

**Goal**: Aba **Transações** do detalhe lê a lista analítica real, paginada, filtrável por tipo e período.

**Independent Test**: Conta com movimentações de tipos diferentes — abrir Transações, filtrar por tipo e por período, confirmar que só as compatíveis aparecem; F5 numa conta nova sem movimentação além do saldo inicial mantém a linha.

### Tests for User Story 3 (TDD obrigatório) ⚠️

- [X] T052 [P] [US3] Criar `apps/erp/api/src/modules/finance/bank-accounts/application/use-cases/list-bank-account-transactions/list-bank-account-transactions.use-case.spec.ts`: filtro por `kind`; filtro por período (`effectiveFrom`/`effectiveTo`); paginação/`meta.total`; 404 para conta inexistente/de outra organização

### Implementation for User Story 3

- [X] T053 [US3] Criar `.../use-cases/list-bank-account-transactions/list-bank-account-transactions.use-case.ts`: valida a conta, chama `bankTransactionRepository.findByAccount`/`countByAccount` com os filtros (depende de T012, T043 — faz T052 passar)
- [X] T054 [US3] Criar `.../infrastructure/http/routes/list-bank-account-transactions/list-bank-account-transactions.route.ts`: `GET /v1/bank-accounts/:id/transactions`, `org.view`, query `kind?`/`effectiveFrom?`/`effectiveTo?`/`page?`/`perPage?` (reaproveita `BankTransactionPresenter` de T045) (depende de T053)
- [X] T055 [US3] Registrar use case + rota em `bank-accounts.module.ts` (depende de T054)
- [X] T056 [P] [US3] Estender `bank-accounts.service.ts`: `listBankAccountTransactionsApi(accountId, params)`
- [X] T057 [US3] Estender `hooks/use-bank-account-queries.ts`: `useBankAccountTransactionsQuery(accountId, params)` (depende de T049, T056)
- [X] T058 [US3] Reescrever `apps/erp/web/src/features/bank-accounts/components/bank-account-transactions-table.tsx`: paginação server-side + filtros de tipo/período (depende de T057)
- [X] T059 [US3] Atualizar `bank-account-detail-page.tsx`: aba Transações usa `useBankAccountTransactionsQuery` (depende de T058, T051)

**Checkpoint**: US1 + US2 + US3 funcionam de forma independente.

---

## Phase 6: User Story 4 - Transferir dinheiro entre contas (Priority: P2)

**Goal**: `TransferDialog` grava de verdade — endpoint transacional cria a transferência + as 2 movimentações vinculadas, com método de pagamento e centro de custo reais.

**Independent Test**: Transferir R$ 1.000 da conta A para a conta B; A perde R$ 1.000, B ganha R$ 1.000, ambas aparecem no extrato/transações de cada conta, resultado sobrevive a um F5.

### Tests for User Story 4 (TDD obrigatório) ⚠️

- [X] T060 [P] [US4] Criar `apps/erp/api/src/modules/finance/bank-transfers/application/use-cases/create-bank-transfer/create-bank-transfer.use-case.spec.ts`: caminho feliz cria a transferência + 2 `BankTransaction` vinculadas; mesma conta em origem/destino → `BankTransferSameAccountError`; conta de origem/destino inexistente ou de outra organização → `BankAccountNotFoundError`; centro de custo inexistente → `CostCenterNotFoundError`

### Implementation for User Story 4 — Backend

- [X] T061 [P] [US4] Criar `apps/erp/api/src/modules/finance/bank-transfers/domain/entities/bank-transfer.entity.ts`
- [X] T062 [P] [US4] Criar `.../domain/errors/bank-transfer-same-account.error.ts` (`DomainError` → 422)
- [X] T063 [US4] Criar `.../domain/repositories/bank-transfer.repository.interface.ts`: `save(transfer): Promise<BankTransfer>` (depende de T061)
- [X] T064 [P] [US4] Criar `.../tests/in-memory-bank-transfer.repository.ts` (depende de T063)
- [X] T065 [P] [US4] Criar `.../tests/bank-transfers-test-factory.ts`: reaproveita `makeBankAccountRepositories()`/`makeCostCenterRepositories()` já existentes, molde de `financial-entries-test-factory.ts` (depende de T064)
- [X] T066 [US4] Criar `.../application/dtos/bank-transfer.dto.ts`: `CreateBankTransferDto`
- [X] T067 [US4] Criar `.../application/use-cases/create-bank-transfer/create-bank-transfer.use-case.ts`: `assertBankAccountExists` ×2 (reaproveita o helper de `financial-entries`), `assertCostCenterExists` (idem), rejeita mesma conta, `bankTransferRepository.save()` (depende de T063, T066 — faz T060 passar)
- [X] T068 [US4] Criar `.../infrastructure/database/prisma-bank-transfer.repository.ts` `save()`: `$transaction` criando `BankTransfer` + `tx.bankTransaction.createMany` (débito na origem, crédito no destino, `sourceType=bank_transfer`, `sourceId=transfer.id`) — atomicidade FR-010
- [X] T069 [P] [US4] Criar `.../infrastructure/http/routes/shared/bank-transfer.presenter.ts`
- [X] T070 [US4] Criar `.../infrastructure/http/routes/create-bank-transfer/create-bank-transfer.route.ts`: `POST /v1/bank-transfers`, `store.finance.manage`; DTO HTTP com `@IsUUID()` (contas/centro de custo), `@IsInt() @Min(1)` (`amountCents`), `@IsDateString()` (`effectiveAt`), `@IsIn(FINANCIAL_ENTRY_PAYMENT_METHODS)` (`paymentMethod`, reaproveitado de `financial-entries` — research.md D4) (depende de T067, T069)
- [X] T071 [US4] Criar `apps/erp/api/src/modules/finance/bank-transfers/bank-transfers.module.ts` (importa `BankAccountsModule`, `CostCentersModule`); registrar em `apps/erp/api/src/modules/finance/finance.module.ts` (depende de T070)

### Implementation for User Story 4 — Frontend

- [X] T072 [P] [US4] Estender `apps/erp/web/src/features/bank-accounts/api/bank-accounts.service.ts`: `createBankTransferApi(input)`
- [X] T073 [US4] Criar `apps/erp/web/src/features/bank-accounts/hooks/use-bank-transfer-mutations.ts`: `useCreateBankTransferMutation()` — invalida as query keys de lista/detalhe/transações/extrato de **ambas** as contas envolvidas (depende de T072)
- [X] T074 [US4] Reescrever `apps/erp/web/src/features/financial-entries/components/transfer-dialog.tsx`: contas via `useBankAccountOptionsQuery` (já existente, real) em vez de `BANK_ACCOUNTS_SEED`; forma de pagamento via `FINANCIAL_ENTRY_PAYMENT_METHODS` em vez de `MOCK_PAYMENT_METHODS`; `handleConfirm` chama `useCreateBankTransferMutation` (`await`, com `loading` no botão Transferir); validações client-side existentes mantidas como fast-fail (o backend revalida) (depende de T073)

**Checkpoint**: todas as 4 user stories funcionam de forma independente.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Remover o que sobrou do mock, documentar, e rodar o gate completo.

- [X] T075 [P] Remover `apps/erp/web/src/features/bank-accounts/services/bank-account.service.ts` (store em memória — todos os consumidores já migrados nas fases anteriores)
- [X] T076 [P] Remover `apps/erp/web/src/features/bank-accounts/data/mock-bank-accounts.ts` (`BANK_ACCOUNTS_SEED`/`BANK_TRANSACTIONS_SEED`)
- [X] T077 [P] Atualizar `apps/erp/api/AGENTS.md` §9 (Finance): documentar `BankTransaction`/`BankTransfer`, a decisão de cálculo de saldo (research.md D2), o submódulo `bank-transfers/`, e as 2 rotas novas de `bank-accounts`
- [X] T078 [P] Atualizar `apps/erp/web/AGENTS.md` §4.5/§9: `bank-accounts` passa a "🟢 MUI+API" de verdade (saldo/extrato/transações/transferência reais); `TransferDialog` deixa de ser mock
- [X] T079 [P] Atualizar `apps/erp/web/src/features/bank-accounts/GUIA.md`: manual de negócio reflete saldo real, extrato paginado, transações filtráveis e transferência persistente
- [ ] T080 Rodar o roteiro completo de [`quickstart.md`](./quickstart.md) manualmente — **não executado nesta sessão** (requer navegador; a tentativa de subir a API localmente para um smoke-test via `curl` esbarrou num ambiente de sandbox compartilhado com processos de outros projetos e foi abortada por segurança — ver relatório final). Cobertura de fato: 623 testes automatizados de backend (incluem os mesmos cenários do roteiro: saldo calculado, saldo acumulado entre páginas, atomicidade da transferência, sincronização RN-12/FR-017) + build de produção limpo nos 2 apps. Pendente para quem validar manualmente antes do deploy
- [X] T081 Rodar o gate completo: `pnpm --filter @citybox/erp-api build && pnpm --filter @citybox/erp-api lint && pnpm --filter @citybox/erp-api typecheck && pnpm --filter @citybox/erp-api test`; `pnpm --filter @citybox/erp-web typecheck && pnpm --filter @citybox/erp-web lint`; `grep -r "services/bank-account.service\|data/mock-bank-accounts" apps/erp/web/src/features` (deve retornar vazio)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências.
- **Foundational (Phase 2)**: depende do Setup — **bloqueia** todas as user stories.
- **User Stories (Phase 3+)**: todas dependem do Foundational.
  - **US2 e US3 dependem de US1 só indiretamente** (precisam do saldo/ledger existir para terem dado real para mostrar), mas **não dependem do código de US1** — poderiam ser implementadas em paralelo por times diferentes assim que o Foundational terminar, desde que as specs de US1 já garantam que o ledger é alimentado corretamente.
  - **US4 é totalmente independente** de US1/US2/US3 no backend (só usa `BankAccountRepository`/`CostCenterRepository`/`BankTransactionRepository`, todos prontos no Foundational) — a única dependência prática é de produto: sem US1, o saldo não refletiria a transferência na tela (mas o endpoint em si funciona isolado).
- **Polish (Final Phase)**: depende de todas as 4 user stories completas.

### Dentro de cada User Story

- Testes (`.spec.ts`) escritos e **falhando** antes da implementação (RED → GREEN).
- Entidade/DTO antes de use case; use case antes de rota; rota antes de registro no módulo.
- Backend antes do frontend correspondente (o frontend consome o contrato real).

### Parallel Opportunities

- Todas as tasks `[P]` da Foundational (T005, T006, T009, T010) podem rodar em paralelo dentro de suas dependências.
- Dentro de US1: os 4 grupos de teste de conta bancária (T013–T016) são paralelos entre si; os 5 de ledger de lançamento (T017–T021) são paralelos entre si (mas o grupo de ledger depende de T032/T033/T034 para GREEN, não dos testes de conta).
- US2 e US3 podem ser desenvolvidas em paralelo por pessoas diferentes assim que Foundational + US1 estiverem prontas (compartilham só o presenter de T045, criado em US2).
- US4 pode ser desenvolvida em paralelo a US2/US3 inteira — zero arquivo em comum no backend; no frontend, só concorre em `bank-accounts.service.ts` (T072 é `[P]` porque é uma função nova, sem tocar as já existentes de US2/US3).

---

## Parallel Example: Foundational

```bash
Task: "Registrar BankTransaction/BankTransfer em TENANT_SCOPED_MODELS"
Task: "Criar domain entity bank-transaction.entity.ts"
```

## Parallel Example: User Story 1 (testes)

```bash
Task: "Estender create-bank-account.use-case.spec.ts"
Task: "Estender update-bank-account.use-case.spec.ts"
Task: "Estender list-bank-accounts.use-case.spec.ts"
Task: "Criar find-bank-account-by-id.use-case.spec.ts"
Task: "Criar derive-bank-transaction-inputs.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 apenas)

1. Completar Setup + Foundational.
2. Completar US1 (saldo real na lista/detalhe + ledger de pagamento de lançamento).
3. **Validar independentemente** — o bug mais grave do `spec.md` (saldo de abertura mascarado de saldo atual) já está corrigido.
4. Demonstrar/entregar se for o caso.

### Incremental Delivery

1. Setup + Foundational → base pronta.
2. US1 → saldo real (MVP) → validar → entregar.
3. US2 → extrato com saldo acumulado → validar → entregar.
4. US3 → transações filtráveis → validar → entregar.
5. US4 → transferência persistente → validar → entregar.
6. Polish → remove mocks residuais, documentação, gate completo.

### Parallel Team Strategy

Com mais de uma pessoa: depois do Foundational, US1 deve ser priorizada isoladamente primeiro (é pré-requisito de produto — sem saldo real, extrato/transações mostrariam dado incompleto), mas **US2+US3 e US4 podem correr em paralelo** entre si assim que US1 estiver mesclada, já que não compartilham arquivo de backend nenhum.

---

## Notes

- `[P]` = arquivos diferentes, sem dependência entre si.
- `[Story]` mapeia a tarefa à user story correspondente para rastreabilidade.
- Cada user story deve ser completável e testável de forma independente.
- Confirmar que os testes falham antes de implementar (RED antes de GREEN).
- Parar em qualquer checkpoint para validar a story isoladamente.
- Evitar: tarefas vagas, conflito no mesmo arquivo entre tasks `[P]`, dependência cruzada entre stories que quebre a independência.
