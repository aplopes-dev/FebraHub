---

description: "Task list template for feature implementation"
---

# Tasks: Conciliação bancária — importação de OFX e casamento com lançamentos

**Input**: Design documents from `/specs/erp/006-bank-reconciliation/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Incluídos — explicitamente exigidos pelo `CLAUDE.md` ("use cases com `.spec.ts` sobre
repositório in-memory") e pelos critérios de aceite técnicos do `spec.md` ("Parser OFX é função pura
com testes...", "Matcher é função pura com testes..."). Jest, sem `TestingModule` do Nest
(research.md D13).

**Organization**: Tarefas agrupadas pelas 7 User Stories do `spec.md` (US1/US2 = P1, US3/US4/US5 =
P2, US6/US7 = P3), na mesma ordem do spec.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivo diferente, sem dependência de tarefa incompleta)
- **[Story]**: US1–US7, mapeado ao `spec.md`
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Web app monorepo — backend `apps/erp/api/src/...`, frontend `apps/erp/web/src/...` (ver
`plan.md` → Project Structure para a árvore completa).

---

## Phase 1: Setup

**Purpose**: Dependências novas — sem projeto/pacote novo (extensão de dois apps já existentes)

- [x] T001 Adicionar dependências `ofx-js` e `iconv-lite` a `apps/erp/api` via
      `pnpm --filter @citybox/erp-api add ofx-js iconv-lite` (research.md D10)
- [x] T002 [P] Criar `apps/erp/api/src/modules/finance/bank-reconciliation/tests/fixtures/` vazio
      (placeholder para os arquivos OFX de fixture usados a partir de US1)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, tenant scope, entidades e repositórios base — sem isso nenhuma user story
compila

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase estar completa

- [x] T003 Adicionar a `apps/erp/api/prisma/schema.prisma` os enums `BankStatementStatus`,
      `BankStatementTransactionStatus`, `BankStatementTransactionKind` e os models `BankStatement`,
      `BankStatementTransaction`, `BankStatementMatch` (schema completo em `data-model.md` §1–3) +
      a relação inversa `bankStatementMatches BankStatementMatch[]` em `FinancialEntry`
- [x] T004 Gerar e aplicar a migration `add_bank_reconciliation` via
      `pnpm --filter @citybox/erp-api db:migrate:dev` (depende de T003)
- [x] T005 [P] Adicionar `BankStatement`, `BankStatementTransaction`, `BankStatementMatch` a
      `TENANT_SCOPED_MODELS` em
      `apps/erp/api/src/shared/infra/prisma/tenant-scope.extension.ts`
- [x] T006 [P] Criar entidade de domínio `BankStatement` em
      `apps/erp/api/src/modules/finance/bank-reconciliation/domain/entities/bank-statement.entity.ts`
      (props + getters, `status`/contadores recalculáveis — ver data-model.md §1)
- [x] T007 [P] Criar entidade de domínio `BankStatementTransaction` em
      `.../domain/entities/bank-statement-transaction.entity.ts` (props + getters, incluindo
      `dedupeKey` — data-model.md §2)
- [x] T008 [P] Criar entidade de domínio `BankStatementMatch` em
      `.../domain/entities/bank-statement-match.entity.ts` (data-model.md §3)
- [x] T009 [P] Criar erros de domínio em `.../domain/errors/`:
      `bank-statement-not-found.error.ts`, `bank-statement-transaction-not-found.error.ts`,
      `bank-statement-transaction-not-pending.error.ts`,
      `financial-entry-already-reconciled.error.ts`, `reconciliation-sum-mismatch.error.ts`
- [x] T010 [P] Criar interfaces de repositório em `.../domain/repositories/`:
      `bank-statement.repository.interface.ts`,
      `bank-statement-transaction.repository.interface.ts`,
      `bank-statement-match.repository.interface.ts`
- [x] T011 Implementar `PrismaBankStatementRepository` em
      `.../infrastructure/database/prisma-bank-statement.repository.ts` (`prisma.scoped`, depende de
      T003, T004, T006, T010)
- [x] T012 [P] Implementar `PrismaBankStatementTransactionRepository` em
      `.../infrastructure/database/prisma-bank-statement-transaction.repository.ts`
- [x] T013 [P] Implementar `PrismaBankStatementMatchRepository` em
      `.../infrastructure/database/prisma-bank-statement-match.repository.ts`
- [x] T014 Criar repositórios in-memory + factory de teste em `.../tests/`:
      `in-memory-bank-statement.repository.ts`,
      `in-memory-bank-statement-transaction.repository.ts`,
      `in-memory-bank-statement-match.repository.ts`, `bank-reconciliation-test-factory.ts`
- [x] T015 [P] Criar `BankReconciliationObjectKeyPolicy` em
      `apps/erp/api/src/modules/finance/bank-reconciliation/application/policies/bank-reconciliation-object-key.policy.ts`
      (`{organizationId}/financeiro/conciliacao-bancaria/{bankStatementId}/extrato.ofx` —
      research.md D10)
- [x] T016 Criar `bank-reconciliation.module.ts` em
      `apps/erp/api/src/modules/finance/bank-reconciliation/bank-reconciliation.module.ts`
      (`imports: [FinancialEntriesModule, BankAccountsModule]`, providers dos 3 repositórios;
      registrar no módulo raiz da API) — providers de use case/rota entram incrementalmente nas
      fases seguintes
- [x] T017 [P] Criar esqueleto da feature frontend: `apps/erp/web/src/features/bank-reconciliation/index.ts`,
      `types/bank-statement.ts`, `api/bank-statement.dto.ts` (tipos compartilhados entre as stories)

**Checkpoint**: Schema, tenant scope, entidades e módulo prontos — user stories podem começar

---

## Phase 3: User Story 1 - Importar um extrato bancário e ver suas transações (Priority: P1) 🎯 MVP (parte 1/2)

**Goal**: Importar um `.ofx`, ver o extrato na lista com instituição/conta/período/status/contadores,
abrir o detalhe e ver as transações extraídas como pendentes.

**Independent Test**: Importar um `.ofx` real associado a uma conta bancária; a lista mostra o
extrato; o detalhe mostra todas as transações como pendentes; reimportar o mesmo arquivo não duplica
nada e informa quantas foram ignoradas.

### Tests for User Story 1 ⚠️

- [x] T018 [P] [US1] Criar fixtures OFX em
      `apps/erp/api/src/modules/finance/bank-reconciliation/tests/fixtures/`:
      `sample-1.1x-latin1.ofx` (SGML, Windows-1252/ISO-8859-1, memos acentuados),
      `sample-2.0x-xml.ofx` (XML), `corrupted.ofx` (ilegível), `sample-missing-fitid.ofx` (FITID
      vazio em ao menos uma `STMTTRN`)
- [x] T019 [P] [US1] Escrever `domain/services/ofx-parser.spec.ts` — parseia 1.x e 2.x, preserva
      acentuação do Latin-1/CP1252, lança `OfxParseError` em `corrupted.ofx`, normaliza `STMTTRN`
      único vs. array
- [x] T020 [P] [US1] Escrever `domain/services/dedupe-key.spec.ts` — `dedupeKey = fitId` quando
      presente; hash determinístico de `(postedAt, amountCents, memo)` quando `fitId` vazio; mesmo
      hash para os mesmos inputs
- [x] T021 [P] [US1] Escrever
      `application/use-cases/import-bank-statement/import-bank-statement.use-case.spec.ts` —
      caminho feliz (extrato+transações criados, resumo `total/imported/skippedDuplicates`),
      conta bancária inexistente/de outra organização → erro, arquivo não-OFX → erro, reimportar o
      mesmo arquivo → dedupe por `(bankAccountId, dedupeKey)` sem duplicar
- [x] T022 [P] [US1] Escrever `application/use-cases/list-bank-statements/list-bank-statements.use-case.spec.ts`
      — paginação, filtro por `bankAccountId`/`status`, isolamento por organização
- [x] T023 [P] [US1] Escrever
      `application/use-cases/find-bank-statement-by-id/find-bank-statement-by-id.use-case.spec.ts`
      — encontra na organização certa, `404` (ou `null`) em outra organização
- [x] T024 [P] [US1] Escrever
      `application/use-cases/list-statement-transactions/list-statement-transactions.use-case.spec.ts`
      — lista paginada filtrada por `status`, todas as transações recém-importadas como `pending`

### Implementation for User Story 1

- [x] T025 [US1] Implementar `domain/services/ofx-parser.ts` (detecta `ENCODING`/`CHARSET` do OFX
      1.x ou `encoding=` do XML 2.x → mapeia para `windows-1252`/`iso-8859-1`/`utf-8` → decodifica
      com `iconv-lite` → `ofx-js` `parseStrict()` → normaliza `STMTTRN`) — faz T019 passar
- [x] T026 [US1] Implementar `domain/services/dedupe-key.ts` — faz T020 passar
- [x] T027 [US1] Implementar `import-bank-statement.use-case.ts` (valida extensão/`content-type`,
      chama `parseOfxFile`, resolve conta bancária, calcula `dedupeKey` por transação, descarta
      duplicadas, `storage.put` do arquivo original via `ObjectStorage` +
      `BankReconciliationObjectKeyPolicy`, salva extrato+transações, devolve resumo) — faz T021
      passar
- [x] T028 [US1] Implementar `list-bank-statements.use-case.ts` — faz T022 passar
- [x] T029 [US1] Implementar `find-bank-statement-by-id.use-case.ts` — faz T023 passar
- [x] T030 [US1] Implementar `list-statement-transactions.use-case.ts` (paginado, filtro `status`,
      `search` por memo já incluído desde já — ver contracts/) — faz T024 passar
- [x] T031 [US1] Criar DTOs/presenters em
      `infrastructure/http/routes/shared/`: `bank-statement.dto.ts`, `bank-statement.presenter.ts`,
      `bank-statement-transaction.dto.ts`, `bank-statement-transaction.presenter.ts`
- [x] T032 [US1] Rota `POST /v1/bank-statements` em
      `infrastructure/http/routes/import-bank-statement/import-bank-statement.route.ts`
      (`FileInterceptor('file', {limits: {fileSize: 10*1024*1024}})`, `@RequirePermission('store.finance.manage')`,
      `413`/`422`/`404` conforme contracts/bank-statement.contract.md)
- [x] T033 [P] [US1] Rota `GET /v1/bank-statements` em
      `infrastructure/http/routes/list-bank-statements/list-bank-statements.route.ts`
      (`@RequirePermission('org.view')`)
- [x] T034 [P] [US1] Rota `GET /v1/bank-statements/:id` em
      `infrastructure/http/routes/find-bank-statement-by-id/find-bank-statement-by-id.route.ts`
- [x] T035 [P] [US1] Rota `GET /v1/bank-statements/:id/transactions` em
      `infrastructure/http/routes/list-statement-transactions/list-statement-transactions.route.ts`
- [x] T036 [US1] Registrar as 4 rotas + 4 use cases em `bank-reconciliation.module.ts` (depende de
      T032-T035)
- [x] T037 [P] [US1] `apps/erp/web/src/features/bank-reconciliation/api/bank-statement.mapper.ts`
      (DTO → tipo de domínio do frontend)
- [x] T038 [US1] `apps/erp/web/src/features/bank-reconciliation/api/bank-reconciliation.service.ts`
      — `listBankStatementsApi`, `findBankStatementByIdApi`, `listStatementTransactionsApi`
      (`comercioFetch`) + `importBankStatementApi` (`comercioUpload`, mesmo padrão de
      `uploadProductImage`)
- [x] T039 [P] [US1] `apps/erp/web/src/features/bank-reconciliation/hooks/query-keys.ts`
- [x] T040 [US1] `apps/erp/web/src/features/bank-reconciliation/hooks/use-bank-statement-list.ts`
      (paginação + filtros `bankAccountId`/`status` + debounce 400ms inline, mesmo padrão de
      `use-financial-entry-list.ts`)
- [x] T041 [P] [US1] `apps/erp/web/src/features/bank-reconciliation/hooks/use-bank-statement-queries.ts`
      (query de detalhe)
- [x] T042 [US1] `apps/erp/web/src/features/bank-reconciliation/hooks/use-bank-reconciliation-mutations.ts`
      — `useImportBankStatementMutation` (mapeamento de erro 422/413/404, mesmo padrão de
      `errorMessage()` de `financial-entries`)
- [x] T043 [P] [US1] `apps/erp/web/src/features/bank-reconciliation/components/statement-import-dialog.tsx`
- [x] T044 [P] [US1] `apps/erp/web/src/features/bank-reconciliation/components/statement-list-table.tsx`
- [x] T045 [P] [US1] `apps/erp/web/src/features/bank-reconciliation/components/statement-status-badge.tsx`
      (`SemanticBadge` de `@/components/ui/status`)
- [x] T046 [P] [US1] `apps/erp/web/src/features/bank-reconciliation/components/statement-header-card.tsx`
      (avatar com iniciais do banco — sem logo externo, ver Assumptions do spec —, conta, período,
      contadores)
- [x] T047 [US1] `apps/erp/web/src/features/bank-reconciliation/pages/bank-statement-list-page.tsx`
      (`ListPageShell`/`ListPagePanel`/`DataTable`/`ListLoadErrorAlert`)
- [x] T048 [US1] `apps/erp/web/src/features/bank-reconciliation/pages/bank-statement-detail-page.tsx`
      (cabeçalho funcional; abas de transação chegam completas em US2)
- [x] T049 [US1] Alterar `apps/erp/web/src/app/(app)/financas/conciliacao-bancaria/page.tsx` — troca
      `PlaceholderPage` por reexport de `BankStatementListPage`
- [x] T050 [US1] Criar `apps/erp/web/src/app/(app)/financas/conciliacao-bancaria/[id]/page.tsx` —
      reexport fino de `BankStatementDetailPage`
- [x] T051 [US1] `apps/erp/web/src/features/bank-reconciliation/index.ts` — barrel export (páginas,
      tipos públicos)
- [x] T052 [US1] `apps/erp/web/src/features/bank-reconciliation/GUIA.md` — linguagem de negócio,
      tom de `bank-accounts/GUIA.md`
- [x] T053 [US1] Alterar
      `apps/erp/web/src/features/bank-accounts/components/bank-account-row-actions.tsx` — troca o
      `toast.message(...)` do `MenuItem` "Importar extrato (OFX)" por
      `router.push(\`/financas/conciliacao-bancaria?bankAccountId=${account.id}\`)`

**Checkpoint**: Importar, listar extratos e ver transações pendentes já funciona ponta a ponta
(Cenário 1 do `quickstart.md`)

---

## Phase 4: User Story 2 - Conciliar uma transação por sugestão automática (Priority: P1) 🎯 MVP (parte 2/2)

**Goal**: Sugestão automática ao lado de cada transação pendente (lista de candidatos quando há
empate), conciliar com um clique — marca o lançamento como pago e gera a movimentação bancária.

**Independent Test**: Lançamento pendente com valor/data batendo com uma transação → sugestão
aparece; clicar Conciliar move para Conciliadas, o lançamento vira `paid` com um novo `payments[]`
(`paymentMethod: "conciliacao_bancaria"`, `paidAt` = data da transação), e uma `BankTransaction` nova
aparece no extrato da conta.

### Tests for User Story 2 ⚠️

- [x] T054 [P] [US2] Estender
      `apps/erp/api/src/modules/finance/financial-entries/domain/entities/financial-entry.entity.spec.ts`
      com casos para `addPayment()`/`removePayment()`: funciona em lançamento `isReadOnly`
      (vinculado a venda), recalcula `paidCents`/`status`, `removePayment` lança se o id não existir
- [x] T055 [P] [US2] Escrever
      `apps/erp/api/src/modules/finance/bank-reconciliation/domain/services/match-suggester.spec.ts`
      — valor exato único (`kind: "exact"`, 1 candidato), valor exato com empate (`kind: "exact"`,
      N candidatos ordenados por confiança), valor diferente dentro da janela
      (`kind: "value_divergence"`), fora da janela de data ou sem candidato nenhum (`kind: "none"`)
- [x] T056 [P] [US2] Escrever
      `application/use-cases/suggest-matches/suggest-matches.use-case.spec.ts` — query de
      elegibilidade (mesma conta, sinal compatível, `status: 'pending'` — que já exclui, por
      construção de D7, qualquer lançamento totalmente conciliado — janela de ±3 dias) delega ao
      `match-suggester` puro
- [x] T057 [P] [US2] Escrever
      `application/use-cases/reconcile-transaction/reconcile-transaction.use-case.spec.ts` — N=1
      feliz (lançamento vira `paid`, `BankTransaction` criada via `save()` existente,
      `BankStatementMatch` criado, transação → `reconciled`, contadores/status do extrato
      recalculados), funciona em lançamento `isReadOnly`, transação não-`pending` → erro, lançamento
      inexistente/de outra organização → erro, lançamento já vinculado a outro `BankStatementMatch`
      ativo → erro

### Implementation for User Story 2

- [x] T058 [US2] Implementar `addPayment(payment)`/`removePayment(paymentId)` em
      `financial-entry.entity.ts` (sem guard de `isReadOnly` — FR-021; recalcula agregados via
      `recomputeAggregates`, devolve nova instância) — faz T054 passar
- [x] T059 [US2] Adicionar `'conciliacao_bancaria'` a `FINANCIAL_ENTRY_PAYMENT_METHODS` em
      `financial-entry-payment.entity.ts`
- [x] T060 [US2] Implementar `domain/services/match-suggester.ts` (função pura) — faz T055 passar
- [x] T061 [US2] Adicionar `findReconciliationCandidates(organizationId, bankAccountId, operation,
      dueDateWindow)` a `FinancialEntryRepository` (interface +
      `PrismaFinancialEntryRepository` + repositório in-memory de `financial-entries/tests/`) — só
      `status: 'pending'` (D7: um lançamento nunca fica parcialmente conciliado por esta feature, então
      `status='pending'` já basta para excluir os já conciliados, sem precisar de anti-join com
      `BankStatementMatch`)
- [x] T062 [US2] Implementar `suggest-matches.use-case.ts` (chama T061 + `match-suggester`) — faz
      T056 passar
- [x] T063 [US2] Implementar `reconcile-transaction.use-case.ts` (valida soma via `openBalanceCents`
      dos ids recebidos, `addPayment` em cada lançamento com `paidAt = transaction.postedAt`,
      `financialEntryRepository.save`, cria 1 `BankStatementMatch` por lançamento, marca a
      transação `reconciled`, recalcula contadores/status do extrato) — cobre 1:1 e N (US3/US4
      reusam sem use case novo, research.md D7) — faz T057 passar
- [x] T064 [US2] Implementar helper de recálculo de status/contadores do `BankStatement`
      (`not_reconciled`/`partially_reconciled`/`reconciled` a partir das contagens por status das
      transações) — usado por T063 e reusado em US6
- [x] T065 [US2] Rota `GET /v1/bank-statements/:id/transactions/:txId/suggestions` em
      `infrastructure/http/routes/suggest-matches/suggest-matches.route.ts`
- [x] T066 [US2] Rota `POST /v1/bank-statements/:id/transactions/:txId/reconcile` em
      `infrastructure/http/routes/reconcile-transaction/reconcile-transaction.route.ts`
- [x] T067 [US2] Registrar as 2 rotas + 2 use cases em `bank-reconciliation.module.ts`
- [x] T068 [P] [US2] `apps/erp/web/src/features/bank-reconciliation/components/transaction-tabs.tsx`
      (Pendentes/Conciliadas/Excluídas + contadores — mesmo padrão de
      `financial-entry-list-tabs.tsx`)
- [x] T069 [P] [US2] `apps/erp/web/src/features/bank-reconciliation/components/transaction-row.tsx`
      (entrada verde/saída vermelha — RN-07 —, tipo débito/crédito, sugestão inline)
- [x] T070 [P] [US2] `apps/erp/web/src/features/bank-reconciliation/components/match-suggestion-card.tsx`
      (lista de candidatos quando há mais de um, botão Conciliar por candidato)
- [x] T071 [US2] `apps/erp/web/src/features/bank-reconciliation/hooks/use-bank-statement-transaction-list.ts`
      (por aba, paginado + `search` com debounce 400ms)
- [x] T072 [US2] Estender `use-bank-reconciliation-mutations.ts` com `useReconcileTransactionMutation`
      + hook de query `useSuggestionsQuery`
- [x] T073 [US2] Ligar `transaction-tabs`/`transaction-row`/`match-suggestion-card` em
      `bank-statement-detail-page.tsx` — aba Pendentes funcional com sugestão + Conciliar
- [x] T074 [P] [US2] `apps/erp/web/src/features/bank-reconciliation/lib/bank-statement-format.ts`
      (centavos → reais, cor por `kind`, rótulo débito/crédito)

**Checkpoint**: MVP completo — importar + conciliar por sugestão automática funciona ponta a ponta
(Cenário 2 do `quickstart.md`)

---

## Phase 5: User Story 3 - Conciliar quando não há sugestão automática (Priority: P2)

**Goal**: Buscar manualmente um lançamento entre os da conta e conciliar com ele quando não há
sugestão.

**Independent Test**: Transação sem sugestão (`kind: "none"`) → abrir busca manual → selecionar 1
lançamento → conciliar com o mesmo resultado de uma conciliação por sugestão.

### Implementation for User Story 3

> Sem use case novo no backend — reusa `POST .../reconcile` de US2 com 1 `financialEntryId`
> escolhido manualmente (research.md D7). Sem tarefas de teste de backend adicionais.

- [x] T075 [P] [US3] `apps/erp/web/src/features/bank-reconciliation/hooks/use-financial-entry-search.ts`
      — busca lançamentos pendentes da conta via `listFinancialEntriesApi` já existente de
      `features/financial-entries` (`bankAccountId` + `status=pending` + `search`), reexportado
      dentro da feature de conciliação
- [x] T076 [US3] `apps/erp/web/src/features/bank-reconciliation/components/manual-match-drawer.tsx`
      — modo single-select (mesmo padrão de `ProductPickerDrawer`: busca local + `Set<string>`),
      base para o modo soma de US4
- [x] T077 [US3] Ligar a ação "Buscar lançamento" em `transaction-row.tsx` para abrir
      `manual-match-drawer.tsx`
- [x] T078 [US3] Handler de confirmação do drawer (modo single) chama
      `useReconcileTransactionMutation` com o id selecionado

**Checkpoint**: Busca manual funciona como caminho alternativo à sugestão automática

---

## Phase 6: User Story 4 - Casar um repasse agrupado com vários lançamentos (Priority: P2)

**Goal**: Selecionar N lançamentos cuja soma bate com uma transação e conciliar todos de uma vez;
rejeitar com `422` se a soma não fechar.

**Independent Test**: Transação de R$ 300 + 3 lançamentos de R$ 100 → selecionar os 3 → concilia
todos; selecionar só 2 (soma R$ 200) → `422`, nada vinculado.

### Tests for User Story 4 ⚠️

- [x] T079 [P] [US4] Estender `reconcile-transaction.use-case.spec.ts` (de US2) com: soma de 3
      lançamentos exata → concilia todos com 1 `BankStatementMatch` cada; soma que não fecha → erro
      **sem** gravar nenhum `BankStatementMatch` nem `FinancialEntryPayment` parcial (nenhuma
      escrita parcial)

### Implementation for User Story 4

- [x] T080 [US4] Confirmar/ajustar `reconcile-transaction.use-case.ts` para validar a soma **antes**
      de qualquer escrita (nenhum `addPayment`/`save` roda se a validação falhar) — faz T079 passar
- [x] T081 [US4] Estender `manual-match-drawer.tsx` com modo multi-select: soma corrente vs. valor
      da transação, indicador visual de diferença, botão Confirmar desabilitado até a soma fechar
      exatamente
- [x] T082 [US4] Ligar a ação "Somar lançamentos" em `transaction-row.tsx` para abrir
      `manual-match-drawer.tsx` em modo soma

**Checkpoint**: Repasse agrupado (adquirente) concilia com N lançamentos

---

## Phase 7: User Story 5 - Criar o lançamento direto da tela de conciliação (Priority: P2)

**Goal**: Criar um lançamento pré-preenchido a partir da transação, que já nasce conciliado.

**Independent Test**: Transação sem candidato → "Criar lançamento" → formulário pré-preenchido →
salvar cria o lançamento (`status: paid`) e concilia a transação numa só ação.

### Tests for User Story 5 ⚠️

- [x] T083 [P] [US5] Escrever
      `application/use-cases/create-entry-from-transaction/create-entry-from-transaction.use-case.spec.ts`
      — cria lançamento com `operation` derivado do `kind` da transação (ignora valor divergente do
      corpo), `amountCents`/data devem bater com a transação (`422` se não baterem), lançamento
      nasce com `payments[0]` e `status: paid`, transação vira `reconciled` com o `BankStatementMatch`
      correspondente

### Implementation for User Story 5

- [x] T084 [US5] Implementar `create-entry-from-transaction.use-case.ts`
      (`FinancialEntry.create()` + `addPayment()` antes do primeiro `save()`, research.md D9) — faz
      T083 passar
- [x] T085 [US5] Rota `POST /v1/bank-statements/:id/transactions/:txId/create-entry` em
      `infrastructure/http/routes/create-entry-from-transaction/create-entry-from-transaction.route.ts`
- [x] T086 [US5] Registrar rota + use case em `bank-reconciliation.module.ts`
- [x] T087 [P] [US5] `apps/erp/web/src/features/bank-reconciliation/components/create-entry-from-transaction-dialog.tsx`
      (data/valor/sinal pré-preenchidos e não editáveis; descrição/categoria/observação editáveis)
- [x] T088 [US5] Ligar a ação "Criar lançamento" em `transaction-row.tsx`
- [x] T089 [US5] `useCreateEntryFromTransactionMutation` em `use-bank-reconciliation-mutations.ts`

### Ajustes de US5 — layout de referência (`/speckit-clarify` 2026-08-10, research.md D14)

> Conta bancária vira campo editável no formulário "Criar lançamento" (mockup) — valor/data/sinal
> continuam travados na transação (FR-021 inalterado).

- [x] T116 [P] [US5] Backend: `create-entry-from-transaction.dto.ts`/use-case ganham `bankAccountId`
      no corpo, validado via `assertBankAccountExists` (mesmo padrão de
      `create-financial-entry.use-case.ts`) — `404` se a conta não existir/não pertencer à
      organização ativa; `FinancialEntry.create()` passa a receber esse `bankAccountId` em vez do
      fixo `bankStatement.bankAccountId`
- [x] T117 [US5] Frontend: `create-entry-from-transaction-dialog.tsx` ganha `Select` de conta
      bancária (`useBankAccountOptionsQuery`), pré-selecionado com `bankStatement.bankAccountId`
      mas editável
- [x] T118 [US5] `createEntryFromTransactionApi`/`CreateEntryFromTransactionInput` passam a incluir
      `bankAccountId` no corpo da requisição

**Checkpoint**: Lançamentos que ninguém digitou podem ser criados sem sair da tela de conciliação

---

## Phase 8: User Story 6 - Excluir uma transação e desfazer uma conciliação (Priority: P3)

**Goal**: Excluir uma transação pendente (some de Pendentes, aparece em Excluídas); desfazer uma
conciliação (volta para Pendentes, remove o vínculo e a movimentação bancária gerada).

**Independent Test**: Excluir → aparece em Excluídas, não apagada. Conciliar e depois desfazer →
volta para Pendentes, `payments[]`/`BankTransaction` do lançamento voltam ao estado anterior.

### Tests for User Story 6 ⚠️

- [x] T090 [P] [US6] Escrever
      `application/use-cases/discard-transaction/discard-transaction.use-case.spec.ts` — `pending`
      → `discarded`; já `discarded`/`reconciled` → erro
- [x] T091 [P] [US6] Escrever
      `application/use-cases/undo-reconciliation/undo-reconciliation.use-case.spec.ts` —
      `reconciled` → `pending`, remove o(s) `FinancialEntryPayment` via `removePayment` +
      `save()` (a `BankTransaction` correspondente some da re-sincronização), apaga o(s)
      `BankStatementMatch` (hard delete), lançamento não sofre alteração em nenhum outro campo;
      transação não-`reconciled` → erro

### Implementation for User Story 6

- [x] T092 [US6] Implementar `discard-transaction.use-case.ts` — faz T090 passar
- [x] T093 [US6] Implementar `undo-reconciliation.use-case.ts` (para cada `BankStatementMatch` da
      transação: `entry.removePayment(match.financialEntryPaymentId)` + `save()`, depois apaga as
      linhas de `BankStatementMatch`, recalcula contadores/status do extrato via helper de T064) —
      faz T091 passar
- [x] T094 [P] [US6] Rota `POST /v1/bank-statements/:id/transactions/:txId/discard` em
      `infrastructure/http/routes/discard-transaction/discard-transaction.route.ts`
- [x] T095 [P] [US6] Rota `POST /v1/bank-statements/:id/transactions/:txId/reconcile/undo` em
      `infrastructure/http/routes/undo-reconciliation/undo-reconciliation.route.ts`
- [x] T096 [US6] Registrar as 2 rotas + 2 use cases em `bank-reconciliation.module.ts`
- [x] T097 [P] [US6] Ação "Excluir" em `transaction-row.tsx` (aba Pendentes) + `ConfirmationDialog`
      (`@citybox/mui`)
- [x] T098 [P] [US6] Ação "Desfazer conciliação" em `transaction-row.tsx` (aba Conciliadas)
- [x] T099 [US6] `useDiscardTransactionMutation` + `useUndoReconciliationMutation` em
      `use-bank-reconciliation-mutations.ts`

**Checkpoint**: Toda conciliação/exclusão é reversível pela própria tela (RN-13/RN-22)

---

## Phase 9: User Story 7 - Consultar, filtrar e baixar um extrato importado (Priority: P3)

**Goal**: Buscar/filtrar transações por status dentro de um extrato e baixar o arquivo OFX original.

**Independent Test**: Dois extratos em contas diferentes → lista mostra ambos corretamente; filtro
por status dentro de um extrato restringe a lista; download devolve o `.ofx` original, byte a byte.

### Tests for User Story 7 ⚠️

- [ ] T100 [P] [US7] Escrever
      `application/use-cases/download-bank-statement-file/download-bank-statement-file.use-case.spec.ts`
      — devolve buffer + nome do arquivo original; extrato de outra organização → erro

### Implementation for User Story 7

- [ ] T101 [US7] Implementar `download-bank-statement-file.use-case.ts` (`storage.get(objectKey)`)
      — faz T100 passar
- [ ] T102 [US7] Rota `GET /v1/bank-statements/:id/file` em
      `infrastructure/http/routes/download-bank-statement-file/download-bank-statement-file.route.ts`
      — proxy/stream (nunca signed URL), `Content-Disposition: attachment; filename="..."`
- [ ] T103 [US7] Registrar rota + use case em `bank-reconciliation.module.ts`
- [ ] T104 [P] [US7] Ação "Baixar extrato" em `statement-header-card.tsx` (link direto para a rota
      de download, mesmo padrão de `financialEntryAttachmentUrl` — escopo na query string)
- [ ] T105 [P] [US7] `SearchInput` com debounce 400ms ligado a `use-bank-statement-transaction-list.ts`
      (busca por memo dentro do extrato — `list-statement-transactions.use-case.ts` de US1 já
      suporta `search`)
- [ ] T106 [US7] Filtro por `bankAccountId`/`status` na UI de `bank-statement-list-page.tsx`
      (endpoint de US1 já suporta os query params)

### Ajustes de US7 — filtro de período (`/speckit-clarify` 2026-08-10, FR-023/FR-035, research.md D15)

> Mockup de referência mostra um filtro de período acima da lista de transações pendentes. A
> transação do extrato não tem "vencimento" — filtra por `postedAt` (data em que o banco
> processou); rótulo na UI é "Período", nunca "vencimento".

- [x] T119 [P] [US7] Backend: `list-statement-transactions.use-case.ts` ganha `postedFrom`/
      `postedTo` opcionais (`yyyy-MM-dd`), filtrando por `postedAt` dentro do intervalo — mesmo
      padrão de `dueFrom`/`dueTo` em `financial-entries` (contracts/ já documenta)
- [x] T120 [US7] Rota `GET /v1/bank-statements/:id/transactions` repassa `postedFrom`/`postedTo` da
      query ao use case
- [x] T121 [US7] Frontend: filtro de período (date range) na aba Pendentes de
      `transaction-list-panel.tsx`, ligado a `use-bank-statement-transaction-list.ts` — rótulo
      "Período", nunca "vencimento"

**Checkpoint**: Todos os critérios de aceite funcionais do spec estão cobertos

---

### Ajustes de US2/US3/US4/US5 — comparação CPLUG x ERP Citybox: busca manual completa + layout de
referência (`/speckit-clarify` 2026-08-11, research.md D16/D17, FR-016/037–041)

> Usuário comparou o layout implementado com os 3 mockups de referência e apontou divergência
> estrutural real (cards vs. linhas, filtros ausentes, form sem seções) + um bug funcional (busca
> manual filtrando só `status=pending`). Corrigir o bug exigiu um ramo novo em `reconcile-
> transaction` (D16 — lançamento `paid` concilia por vínculo, sem `addPayment`) e um endpoint
> dedicado de elegibilidade (D17), porque a exclusão de já-vinculados (FR-033) deixou de ser
> implícita em `status=paid`.

#### Backend — D16 (vínculo sem pagamento para lançamento `paid`)

- [x] T122 [P] [US3] Novo erro de domínio
      `apps/erp/api/src/modules/finance/bank-reconciliation/domain/errors/financial-entry-payment-ambiguous.error.ts`
      (lançamento `paid` com mais de 1 `FinancialEntryPayment` — D16, caso não tratado nesta entrega)
- [x] T123 [P] [US3] Estender `reconcile-transaction.use-case.spec.ts` (RED): lançamento `paid` com 1
      pagamento e sem `BankStatementMatch` ativo → concilia criando **só** o match (referenciando o
      `financialEntryPaymentId` já existente), sem alterar `entry.payments`/`paidCents`; lançamento
      `paid` com 2+ pagamentos → `FinancialEntryPaymentAmbiguousError`; soma mista (1 pendente + 1
      pago) que fecha exatamente → concilia os dois, cada um pelo seu ramo
- [x] T124 [US3] `reconcile-transaction.use-case.ts` ganha a ramificação por `entry.status` (D16):
      `pending` → comportamento atual (`addPayment` pelo saldo em aberto); `paid` → valida
      `entry.payments.length === 1` (senão lança o erro de T122), cria `BankStatementMatch`
      referenciando esse `financialEntryPaymentId`, **sem** chamar `addPayment`/`save()` no
      lançamento. Introduzir `eligibleAmountCents(entry)` (pending → saldo em aberto; paid →
      `amountCents`) e usá-lo na validação de soma (troca `openBalanceCents` cru) — faz T123 passar

#### Backend — D17 (endpoint de elegibilidade + filtros ricos, FR-038)

- [x] T125 [P] [US3] `FinancialEntryListCriteria`
      (`financial-entries/domain/repositories/financial-entry.repository.interface.ts`) ganha
      `paidFrom?`/`paidTo?`/`paymentMethod?`/`cardBrand?`/`supplierId?` opcionais
- [x] T126 [US3] `prisma-financial-entry.repository.ts` → `buildWhere()` aplica os filtros novos
      (`payments.some` para paidFrom/paidTo/paymentMethod/cardBrand; `supplierId` direto) — faz
      T125 utilizável
- [x] T127 [P] [US3] Teste (RED→GREEN) cobrindo os filtros novos no repositório/use case de listagem
      de `financial-entries` (reaproveitar o padrão de teste já usado para `dueFrom`/`competenceFrom`)
- [x] T128 [P] [US3] DTO de aplicação
      `bank-reconciliation/application/dtos/search-eligible-entries.dto.ts`
      (`SearchEligibleEntriesDto`/`EligibleEntryResult` — `financialEntryId`, `status`,
      `eligibleAmountCents`, `dueDate`, `competenceDate`, `paidAt`, `description`, `categoryName`)
- [x] T129 [US3] Use case
      `bank-reconciliation/application/use-cases/search-eligible-entries/search-eligible-entries.use-case.ts`
      (research.md D17): resolve extrato/transação → `bankAccountId` travado na conta do extrato
      **[SUPERADO por T166 — a conta deixou de ser travada, FR-037 revogada em 2026-08-14]** →
      `financialEntryRepository.list(...)` com os filtros de FR-038, sem status → exclui ids em
      `bankStatementMatchRepository.findActiveFinancialEntryIds(...)` (FR-033 explícito) → calcula
      `eligibleAmountCents` por item (D16) → retorna paginado
- [x] T130 [P] [US3] Teste (RED→GREEN)
      `search-eligible-entries.use-case.spec.ts`: retorna `pending` e `paid` elegíveis; exclui já
      vinculado; aplica cada filtro de FR-038 isoladamente; ignora `bankAccountId` do input (sempre
      usa o da conta do extrato, FR-037)
- [x] T131 [US3] DTOs HTTP + presenter
      `bank-reconciliation/infrastructure/http/routes/shared/{eligible-entry.dto.ts,eligible-entry.presenter.ts}`
      (query com os filtros de FR-038 + `@IsDateString`/`@IsUUID`/`@IsIn(['competence','due','paid'])`
      para `periodType`)
- [x] T132 [US3] Rota
      `GET /v1/bank-statements/:id/transactions/:txId/eligible-entries` em
      `search-eligible-entries/search-eligible-entries.route.ts` (`@RequirePermission('org.view')`)
- [x] T133 [US3] Registrar use case + rota em `bank-reconciliation.module.ts`

#### Frontend — busca manual reescrita (FR-038)

- [x] T134 [US3] `bank-reconciliation.service.ts`: nova `searchEligibleEntriesApi(bankStatementId,
      transactionId, filters)` chamando `GET .../eligible-entries`; remove
      `searchFinancialEntriesForReconciliationApi` (chamada direta a `/v1/financial-entries`, bug
      relatado pelo usuário)
- [x] T135 [P] [US3] `types/bank-statement.ts`: `EligibleEntry`/`EligibleEntrySearchFilters`
      substituindo `FinancialEntrySearchResult`; `bank-statement.mapper.ts` atualizado
- [x] T136 [US3] Novo componente
      `components/manual-match-filters.tsx` — Período (`DateRangePicker`), checkboxes "Buscar pelas
      datas de" (Competência/Vencimento/Recebimento-Pagamento), Categoria, Fornecedor, Conta
      (pré-selecionada e **desabilitada**, sempre a do extrato — FR-037), Método de pagamento,
      Bandeira
- [x] T137 [US3][US4] Reescrever `manual-match-drawer.tsx`: troca `SearchInput` + lista simples por
      `manual-match-filters.tsx` + tabela de resultados (colunas Vencimento/Pagamento/
      Competência/Descrição-Categoria/Valor), mantendo seleção múltipla (`Set<string>`) e o rodapé
      de soma/diferença já existente (US4) — troca `openBalance` por `eligibleAmountCents` no cálculo
      da soma
- [x] T138 [US3] Atualizar `use-financial-entry-search.ts` (ou substituir por um hook novo
      `use-eligible-entries-search.ts`) para os novos filtros + debounce 400ms

#### Frontend — cards, painel de sugestões e formulário em seções (FR-039/040/041)

- [x] T139 [US2][US3] Reescrever `transaction-row.tsx` → `transaction-card.tsx`: cartão
      (`@citybox/mui`) com botões reais (Conciliar/Novo Registro/Buscar registro/Excluir), aviso de
      "nenhum registro encontrado"/sugestão embutido no cartão, entrada verde/saída vermelha
      mantidas (RN-07/FR-013) — sem checkbox de seleção em lote (FR-039)
- [x] T140 [US2][US3] Atualizar `transaction-list-panel.tsx` para importar `transaction-card.tsx` no
      lugar de `transaction-row.tsx`
- [x] T141 [US2] Novo componente `components/suggested-entries-panel.tsx` — painel colapsável
      "Registros sugeridos" no rodapé da aba Pendentes, consolidando as sugestões automáticas da
      página com ação rápida "Adicionar" equivalente a Conciliar (FR-041); montado em
      `transaction-list-panel.tsx` abaixo da lista
- [x] T142 [US5] Reescrever `create-entry-from-transaction-dialog.tsx` nas seções Transação
      Financeira (valor/taxas-despesas/multas-juros/total/conta/datas — os travados como somente
      leitura, FR-040)/Dados de pagamento (valor/data/método/bandeira, somente leitura)/
      Classificação (categoria/centro de custo, editáveis); sem rateio múltiplo

#### Documentação (mesma operação — política do `CLAUDE.md` §7)

- [x] T143 [P] Atualizar `apps/erp/api/AGENTS.md` §9/§12 — novo endpoint `eligible-entries`, ramo
      D16 em `reconcile-transaction`, novos filtros de `FinancialEntryListCriteria`
- [x] T144 [P] Atualizar `apps/erp/web/AGENTS.md` §4.5/§12 — cards na lista de Pendentes, drawer com
      filtros completos + tabela, painel de sugestões, dialog em seções
- [x] T145 [P] Atualizar `GUIA.md` da feature — busca manual agora inclui lançamentos já pagos (sem
      vínculo ativo); descrever o painel "Registros sugeridos"

#### Gate

- [x] T146 Gate `apps/erp/api`: `pnpm --filter @citybox/erp-api build && lint && typecheck && test`
      (inclui os specs novos de T123/T127/T130)
- [x] T147 Gate `apps/erp/web`: `pnpm --filter @citybox/erp-web typecheck && lint`
- [ ] T148 [P] Rodar o Cenário 5c de `quickstart.md` manualmente ponta a ponta

**Checkpoint**: busca manual sem bug de status, elegibilidade correta (FR-033 explícito), e as 3
telas (Pendentes/Buscar Registros/Novo Registro) seguem a estrutura dos mockups de referência

---

## Phase 10: Ajustes de UI/UX + conta destravada (`/speckit-clarify` + `/speckit-plan` 2026-08-14, research.md D18–D24)

**Goal**: fechar as 4 divergências de UI/UX apontadas na 3ª comparação CPLUG x Citybox e as 3
consequências de desenho que elas destravaram (conta da movimentação, extrato sem conta, correção do
`data-model.md`).

**Independent Test**: Cenários 5d/5e/5f de `quickstart.md` passam ponta a ponta, e os cenários
1–5c continuam passando sem regressão.

> ⚠️ Esta fase contém a **primeira migration da feature desde a entrega original** (T149) e a
> **primeira mutação de `FinancialEntry.bankAccountId`** (T151). O gate `database-reviewer`
> (Constitution V) é obrigatório antes de implementar T149–T156, e o teste de reversão (T155/T156) é
> o que protege o saldo das duas contas envolvidas.

#### Backend + Frontend — D26 (FR-001: conta obrigatória na importação) — **fazer primeiro, é o que destrava**

> Acrescentado na rodada de produção de 2026-08-14. **Este é o bloco que resolve o defeito relatado**
> ("não consigo buscar nenhum lançamento"): sem conta no extrato, nada mais funciona. Ataca a causa —
> não existe chave confiável entre o OFX e o cadastro de contas (`BankAccount` só tem `bankCode`),
> então o operador informa a conta na importação. Sem schema, sem migration.

- [x] T185 [P] [US1] Estender `import-bank-statement.use-case.spec.ts` (RED): sem `bankAccountId` →
      erro, nada gravado; organização sem nenhuma conta bancária cadastrada → erro próprio; arquivo
      cujo `bankCode` **não** casa com nenhuma conta → importa normalmente com a conta informada pelo
      operador (é o caso real relatado: arquivo "Banco 1", org com Banco do Brasil)
- [x] T186 [US1] `import-bank-statement.use-case.ts`: `bankAccountId` passa a ser obrigatório no input
      (deixa de ser `?`), + erro de domínio novo quando a organização não tem conta cadastrada — faz
      T185 passar
- [x] T187 [US1] DTO/rota `POST /v1/bank-statements`: `bankAccountId` obrigatório (`422` "Selecione a
      conta bancária deste extrato") em
      `…/infrastructure/http/routes/import-bank-statement/import-bank-statement.route.ts`
- [x] T188 [US1] `apps/erp/web/src/features/bank-reconciliation/components/statement-import-dialog.tsx`:
      campo Conta bancária volta a ser obrigatório (rótulo sem "(opcional)", botão bloqueado até
      escolher); `POST .../preview` mantém-se **apenas** para pré-selecionar quando o `bankCode` casar
      com exatamente 1 conta ativa, nunca para decidir a importação
- [x] T189 [US1] Estado vazio em `statement-import-dialog.tsx` quando a organização não tem nenhuma
      conta cadastrada: orientar a cadastrar antes, em vez de deixar importar e travar depois

#### Backend — D23 (FR-042) — **reparo de extrato legado**, não mais caminho principal

> ⚠️ **Reenquadrado em 2026-08-14 pela D26.** Estas tarefas foram escritas quando a conta era opcional
> na importação e a FR-042 era o portão principal. Com a conta obrigatória (T185–T189), **nenhum
> extrato novo nasce sem conta** — o guard e a rota `PATCH` continuam necessários apenas para os
> extratos importados durante a janela em que a 007 permitia conta vazia. Sem eles, esses extratos
> ficariam permanentemente inconciliáveis. Prioridade cai: fazer **depois** de D26.

- [ ] T149 [P] [US3] Criar erro de domínio
      `apps/erp/api/src/modules/finance/bank-reconciliation/domain/errors/bank-statement-without-account.error.ts`
      (extrato com `bankAccountId` nulo — FR-042/D23)
- [ ] T150 [P] [US3] Estender `reconcile-transaction.use-case.spec.ts` (RED): extrato com
      `bankAccountId: null` → `BankStatementWithoutAccountError`, nenhum `BankStatementMatch` criado,
      nenhum `addPayment` chamado
- [ ] T151 [US3] Adicionar o guard em
      `apps/erp/api/src/modules/finance/bank-reconciliation/application/use-cases/reconcile-transaction/reconcile-transaction.use-case.ts`
      (antes de qualquer escrita, junto das demais precondições) — faz T150 passar
- [ ] T152 [US5] Aplicar o mesmo guard em `create-entry-from-transaction.use-case.ts` (o lançamento
      criado também nasce conciliado, FR-018) + caso RED no seu `.spec.ts`
- [ ] T153 [P] [US7] Escrever `set-bank-statement-account.use-case.spec.ts` (RED): define conta num
      extrato sem conta → sucesso; conta de outra organização → erro; extrato com ao menos 1
      transação `reconciled` → erro (contrato `bank-statement.contract.md`)
- [ ] T154 [US7] Implementar
      `apps/erp/api/src/modules/finance/bank-reconciliation/application/use-cases/set-bank-statement-account/set-bank-statement-account.use-case.ts`
- [ ] T155 [US7] Rota `PATCH /v1/bank-statements/:id/bank-account` em
      `…/infrastructure/http/routes/set-bank-statement-account/set-bank-statement-account.route.ts`
      (`@RequirePermission('store.finance.manage')`, DTO com `bankAccountId`)
- [ ] T156 [US7] Registrar rota + use case em `bank-reconciliation.module.ts`

#### Backend — D25 (FR-043: conciliar `paid` exige mesma conta) — **fazer junto de T149–T152**

> IDs mais altos que os vizinhos porque foram acrescentados numa 2ª passada do mesmo dia, disparada
> pelo achado **F1** do `/speckit-analyze`. Posicionados aqui de propósito: são precondições do
> **mesmo** use case de T151, e implementar os dois guards juntos evita reabrir
> `reconcile-transaction.use-case.ts` e seu `.spec.ts` duas vezes.

- [ ] T181 [P] [US3] Criar erro de domínio
      `apps/erp/api/src/modules/finance/bank-reconciliation/domain/errors/entry-bank-account-mismatch.error.ts`
      (lançamento `paid` cuja conta difere da conta do extrato — FR-043/D25)
- [ ] T182 [P] [US3] Estender `reconcile-transaction.use-case.spec.ts` (RED), 4 casos: (a) `paid` de
      outra conta → `EntryBankAccountMismatchError`, **nenhuma** escrita (sem match, sem payment,
      transação segue `pending`); (b) `paid` da **mesma** conta → concilia normalmente (D16, teste de
      não-regressão); (c) `pending` de outra conta → concilia e cai no fluxo de D22 (confirma que a
      restrição vale só para `paid`); (d) soma mista de 1 `pending` + 1 `paid`, ambos de outra conta,
      com soma exata → recusada por causa do `paid`
- [ ] T183 [US3] Implementar o guard em `reconcile-transaction.use-case.ts`, no bloco de precondições
      (junto do guard de T151), **antes** de qualquer escrita: para cada `entry` com
      `status === 'paid'`, se `entry.bankAccountId !== bankStatement.bankAccountId` → lançar o erro de
      T181 — faz T182 passar
- [ ] T184 [P] [US3] Mapear o `422` novo para mensagem legível em
      `apps/erp/web/src/features/bank-reconciliation/` (mesmo tratamento dos demais erros de
      conciliação), exibida no cartão da transação conforme FR-039/D18 — não como alerta no drawer

#### Backend — D22 (movimentação sempre na conta do extrato)

- [ ] T157 [US3] Adicionar `previousBankAccountId String? @map("previous_bank_account_id")` em
      `BankStatementMatch` (`apps/erp/api/prisma/schema.prisma`) + migration
      `<ts>_add_match_previous_bank_account` (nullable, sem backfill — `data-model.md`).
      **Rodar o gate `database-reviewer` antes de prosseguir**
- [ ] T158 [P] [US3] Refletir o campo em `bank-statement-match.entity.ts`,
      `bank-statement-match.repository.interface.ts`, `prisma-bank-statement-match.repository.ts` e
      `in-memory-bank-statement-match.repository.ts`
- [ ] T159 [P] [US3] Escrever caso RED em `financial-entry.entity.spec.ts`: método novo troca
      `bankAccountId` **ignorando o guard `isReadOnly`** (mesma justificativa de D4 para `addPayment`)
      e não altera nenhum outro campo descritivo
- [ ] T160 [US3] Implementar esse método em
      `apps/erp/api/src/modules/finance/financial-entries/domain/entities/financial-entry.entity.ts`
      — faz T159 passar
- [ ] T161 [P] [US3] Estender `reconcile-transaction.use-case.spec.ts` (RED): lançamento `pending` de
      **outra** conta → `previousBankAccountId` guarda a conta original, o lançamento passa a apontar
      para a conta do extrato, e a `BankTransaction` nasce na conta do extrato; lançamento cuja conta
      **já** é a do extrato → `previousBankAccountId` nulo e comportamento idêntico ao atual
      (não-regressão); ramo `paid` (D16) → **não** troca a conta e não gera movimentação
- [ ] T162 [US3] Implementar em `reconcile-transaction.use-case.ts`: gravar `previousBankAccountId` e
      trocar a conta **antes** do `addPayment`, para a movimentação nascer já na conta certa — faz
      T161 passar
- [ ] T163 [P] [US6] Estender `undo-reconciliation.use-case.spec.ts` (RED): `match` com
      `previousBankAccountId` não nulo → restaura a conta original no lançamento e devolve o saldo das
      **duas** contas ao valor anterior à conciliação (FR-030)
- [ ] T164 [US6] Implementar a restauração em `undo-reconciliation.use-case.ts` — faz T163 passar

#### Backend — D19 (filtro de conta destravado na busca)

- [ ] T165 [P] [US3] Estender `search-eligible-entries.use-case.spec.ts` (RED): `bankAccountId`
      explícito no input → filtra por essa conta; input ausente → usa a conta do extrato (default);
      ambos nulos → varre todas as contas da organização (comportamento já existente)
- [ ] T166 [US3] `search-eligible-entries.use-case.ts`: `SearchEligibleEntriesInput` ganha
      `bankAccountId?`; resolução vira
      `input.bankAccountId ?? bankStatement.bankAccountId ?? undefined` (hoje linha 68) — faz T165 passar
- [ ] T167 [US3] `search-eligible-entries.route.ts` + DTO: aceitar `bankAccountId` como query param
      opcional, validando que pertence à organização ativa (contrato atualizado)

#### Backend + Frontend — D27 (FR-044: cliente/fornecedor vem do cadastro)

> Dois defeitos sob o mesmo pedido: a tela de lançamentos filtra por um estágio de CRM que a interface
> **não deixa editar** (todo cliente nasce `lead`), e o formulário da conciliação usa **texto livre**,
> sem vínculo nenhum. `FinancialEntry` já tem `customer_id`/`supplier_id` como FKs — **sem migration**,
> o use case só nunca os preenchia.

- [ ] T190 [P] [US5] Estender `create-entry-from-transaction.use-case.spec.ts` (RED): `customerId`
      grava o vínculo e deriva `partyName` do cadastro; `supplierId` idem com `customerId` nulo;
      **ambos informados → erro** (exclusividade já validada em `financial-entry.entity.ts:180`);
      nenhum dos dois → lançamento criado sem vínculo, comportamento atual preservado
- [ ] T191 [US5] `create-entry-from-transaction.use-case.ts`: input ganha `customerId?`/`supplierId?`,
      valida exclusividade e existência na organização (`404`), repassa ao `FinancialEntry.create()` —
      faz T190 passar
- [ ] T192 [US5] DTO/rota `POST .../create-entry`: aceitar `customerId`/`supplierId` opcionais em
      `…/infrastructure/http/routes/create-entry-from-transaction/create-entry-from-transaction.route.ts`
- [x] T193 [P] [US5] `apps/erp/web/src/features/customers/api/customers.service.ts`: remover
      `tab=active` de `listActiveCustomers()` (passa a listar qualquer estágio de CRM) e renomear a
      função para refletir que não filtra mais por estágio; ajustar os consumidores
- [ ] T194 [US5] `create-entry-from-transaction-drawer.tsx`: trocar o `Input` de texto livre (linha
      ~235) por `Autocomplete` sobre clientes + fornecedores, no molde de
      `financial-entry-party-section.tsx`; enviar `customerId`/`supplierId` em vez de `partyName` cru
- [ ] T195 [P] [US5] ⚠️ **Feature da `007-financeiro-ajustes-ui`** — espelhar a regra em
      `apps/erp/web/src/features/financial-entries/components/financial-entry-form/financial-entry-party-section.tsx`:
      o select passa a listar clientes de qualquer estágio. Registrar a decisão na spec da 007

#### Frontend — D18/D19/D20/D21/D23

- [ ] T168 [P] [US3] `apps/erp/web/src/features/bank-reconciliation/api/bank-reconciliation.service.ts`:
      enviar `bankAccountId` em `searchEligibleEntriesApi` + adicionar `setBankStatementAccountApi`
      (`PATCH …/bank-account`)
- [ ] T169 [P] [US7] `hooks/use-bank-reconciliation-mutations.ts`: mutation
      `setBankStatementAccount` com invalidação das queries de extrato e de sugestões
- [ ] T170 [P] [US3] `components/manual-match-filters.tsx`: remover `disabled` do select de Conta
      (linhas 177-182), listar as contas da organização, manter a conta do extrato pré-selecionada
- [ ] T171 [US3] `components/transaction-card.tsx`: remover o guard `disabled={!bankAccountId}` e o
      tooltip "Este extrato não tem uma conta bancária resolvida" (linhas 126-132) — a busca passa a
      funcionar sem conta (D19)
- [x] T172 [US2] `components/transaction-card.tsx`: içar o resultado de `useSuggestionsQuery` (linha
      54) para a linha de ações e inserir **"Conciliar" como 1º botão** (ordem final: Conciliar → Novo
      Registro → Buscar registro → Excluir, FR-039/D20). Habilitado só com `suggestion.kind === "exact"`
      (corrigido na implementação — `"match"` não existe no tipo `MatchSuggestionResult`);
      com 1 candidato concilia direto, com vários leva à escolha (FR-014)
- [x] T173 [US3] `components/manual-match-drawer.tsx`: remover o `Alert` de divergência e a mensagem
      "a conciliação será recusada…" (linhas 141-146); converter o rodapé (linhas 188-201) em
      totalizador **neutro** (Selecionado / Transação / Diferença) sem `warning.dark`/`success.main`.
      Manter o botão Conciliar `disabled` enquanto a soma não fecha (D18)
- [x] T174 [US3] `components/transaction-card.tsx`: exibir o indicador de divergência de valor no
      próprio cartão (excedente/faltante), unificando com o estado `value_divergence` já renderizado
      em `match-suggestion-card.tsx:42-52` (FR-031/FR-039/D18)
- [x] T175 [US5] Renomear `components/create-entry-from-transaction-dialog.tsx` →
      `create-entry-from-transaction-drawer.tsx` e trocar `Dialog`/`DialogTitle`/`DialogContent`/
      `DialogActions` (linha 59) pelo `Drawer` de `@citybox/mui` já usado em `manual-match-drawer.tsx`
      (default `anchor="right"`), preservando as 3 seções e os campos travados read-only (FR-040/D21)
- [ ] T176 [P] [US7] Criar `components/statement-account-dialog.tsx` — definir/corrigir a conta de um
      extrato importado, acionável a partir de `statement-header-card.tsx` quando `bankAccountId` for
      nulo (FR-042/D23)
- [ ] T177 [US3] Mensagem de bloqueio na UI quando o extrato não tem conta: desabilitar "Conciliar"
      com motivo claro e atalho para a ação de T176 (FR-042)

#### Backend + Frontend — FR-045/FR-046 (excluir extrato + dedupe ignora excluídas)

> Acrescentado em 2026-08-14 a partir de teste do usuário em produção. Ele ficou **preso num loop**:
> as 5 transações do extrato legado foram excluídas (única ação disponível), o que travou a dedupe
> para sempre — reimportar o arquivo devolvia extratos vazios, e não havia como apagá-los. Semântica
> de exclusão confirmada pelo usuário no CPLUG (recusa com conciliação ativa, libera após desconciliar).

- [x] T198 [P] [US6] Dedupe ignora transações `discarded` — interface do repositório,
      `prisma-bank-statement-transaction.repository.ts` e o in-memory, + teste de reimportação em
      `import-bank-statement.use-case.spec.ts`
- [x] T199 [P] [US6] Erro de domínio `bank-statement-has-reconciliation.error.ts` (FR-045)
- [x] T200 [US6] Métodos de exclusão nos repositórios: `BankStatementRepository.delete` e
      `BankStatementTransactionRepository.deleteByStatement` (Prisma + in-memory)
- [x] T201 [US6] `delete-bank-statement.use-case.ts` + `.spec.ts` (4 casos: apaga tudo; recusa com
      conciliada; permite com todas excluídas; 404 de outra organização)
- [x] T202 [US6] Rota `DELETE /v1/bank-statements/:id` (204) + registro no módulo
- [x] T203 [US6] Frontend: `deleteBankStatementApi`, `useDeleteBankStatementMutation`,
      `statement-row-actions.tsx` e coluna de ações em `statement-list-table.tsx`

#### Documentação (Constitution I — mesma operação que o código)

- [ ] T178 [P] Atualizar `apps/erp/api/AGENTS.md` §9 — coluna `previous_bank_account_id`, rota
      `PATCH /v1/bank-statements/:id/bank-account`, `bankAccountId` opcional em `eligible-entries`
- [ ] T179 [P] Atualizar `apps/erp/web/AGENTS.md` §4.1/§4.5 — `Drawer` no lugar do `Dialog` em "Novo
      Registro", nova ordem dos botões do cartão, filtro de conta editável
- [ ] T180 [P] Atualizar `apps/erp/web/src/features/bank-reconciliation/GUIA.md` — linguagem de
      negócio das mudanças (conciliar exige conta do extrato; divergência aparece no cartão)
- [ ] T196 [P] Atualizar `apps/erp/api/AGENTS.md` §9 e `apps/erp/web/AGENTS.md` §4.5 com D26/D27:
      conta obrigatória na importação (e por quê — não há chave OFX↔cadastro), `customerId`/
      `supplierId` no `create-entry`, e o fim do filtro por estágio de CRM
- [ ] T197 [P] Atualizar o `GUIA.md` da conciliação e o de `features/customers` — explicar que a
      conta é escolhida ao importar e que qualquer cliente cadastrado aparece no vínculo

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Documentação obrigatória, verificação final, gate de qualidade

- [ ] T107 [P] Atualizar `apps/erp/api/AGENTS.md` §9 — adicionar `finance/bank-reconciliation` ao
      índice de módulos, registrar `addPayment`/`removePayment` em `financial-entries`
- [ ] T108 [P] Atualizar `apps/erp/web/AGENTS.md` §4.1/§4.5/§9/§12 — adicionar
      `features/bank-reconciliation`, corrigir a linha "Conciliação bancária ⬜ Placeholder"
- [ ] T109 [P] Atualizar `apps/erp/web/src/features/bank-accounts/GUIA.md` — remover/atualizar o
      trecho "O que ainda não faz: Importação real de extrato OFX / conciliação bancária"
- [ ] T110 [P] Atualizar `apps/erp/web/src/features/financial-entries/GUIA.md` — remover/atualizar a
      pendência "Conciliação bancária automática"
- [ ] T111 Atualizar `MODULO_FINANCAS/ONBOARDING-FUNCIONALIDADES.md` §4.6 com o status real (não
      mais Placeholder) e corrigir o cabeçalho desatualizado (`apps/erp-comercio`/portas
      3110-3111 → `apps/erp`/3107-3114) — instrução explícita do prompt original
- [ ] T112 [P] Rodar os **12** cenários de `quickstart.md` manualmente ponta a ponta — 1, 2, 3, 4, 5,
      5b, 5c, **5d/5e/5f/5g (Phase 10)** e 6 — incluindo o isolamento de tenant e o `403` de `MEMBER`.
      Dois passos são obrigatórios e não podem ser pulados: **5e.4** (desfazer conciliação
      cross-account e conferir o saldo das duas contas — teste de reversão do risco de D22) e
      **5g.3** (recusa do `paid` de outra conta sem escrita nenhuma — FR-043/D25)
- [ ] T113 Gate `apps/erp/api`:
      `pnpm --filter @citybox/erp-api build && pnpm --filter @citybox/erp-api lint && pnpm --filter @citybox/erp-api typecheck && pnpm --filter @citybox/erp-api test`
- [ ] T114 Gate `apps/erp/web`:
      `pnpm --filter @citybox/erp-web typecheck && pnpm --filter @citybox/erp-web lint`
- [ ] T115 [P] Verificação de segurança/isolamento: confirmar `403` de `MEMBER` em todas as rotas de
      escrita e `404` ao trocar `X-Organization-Id` em todas as rotas de leitura (RN-19/FR-025/026)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depende do Setup — bloqueia todas as user stories
- **US1 (Phase 3)**: depende só do Foundational
- **US2 (Phase 4)**: depende do Foundational + US1 (usa extrato/transação/detalhe já existentes)
- **US3 (Phase 5)**: depende de US2 (reusa a rota `reconcile`)
- **US4 (Phase 6)**: depende de US2 (reusa a rota `reconcile`) e reaproveita o componente de US3
- **US5 (Phase 7)**: depende do Foundational + US1 (transação/detalhe) — independente de US2/3/4
- **US6 (Phase 8)**: depende de US2 (só existe o que desfazer/excluir depois de conciliar)
- **US7 (Phase 9)**: depende de US1 (lista/detalhe já existem) — independente de US2-US6
- **Ajustes 2026-08-14 (Phase 10)**: depende de US2/US3/US5/US6/US7 já entregues. Ordem interna
  obrigatória (**revista em 2026-08-14 pela D26**): **D26 (T185–T189)** → D23 (T149–T156) + D25
  (T181–T184) → D22 (T157–T164) → D19 (T165–T167) → D27 (T190–T195) → frontend (T168–T177).
  **D26 vem primeiro porque é o que destrava o defeito relatado** — sem conta no extrato nada
  funciona, e com ela obrigatória a FR-042 deixa de ser caminho principal. D23 cai para reparo de
  legado, mas continua antes de D22 (ainda define o que fazer com extrato sem conta). D25 anda junto
  de D23: são os dois guards de precondição do **mesmo** use case (`reconcile-transaction`), e
  separá-los obriga a reabrir o arquivo e o `.spec.ts` duas vezes. D27 é independente dos demais —
  pode ser feito em paralelo por outra pessoa
- **Polish (Phase 11)**: depende de todas as stories que forem entregues, incluindo a Phase 10

### Dentro de cada User Story

- Testes (quando existem) escritos e **falhando** antes da implementação (RED → GREEN)
- Entidades/serviços puros antes dos use cases que os consomem
- Use cases antes das rotas HTTP
- Backend de uma story antes do frontend da mesma story (frontend consome o contrato já
  implementado)

### Parallel Opportunities

- T002 pode rodar em paralelo com T001
- Dentro do Foundational: T005-T010 e T012-T013 são `[P]` entre si (arquivos distintos, todos
  dependem só de T003/T004)
- Dentro de cada User Story, todas as tarefas `[P]` de teste podem rodar juntas antes da
  implementação da mesma story
- US5 e US7 podem ser desenvolvidas em paralelo com US3/US4/US6 (dependem só de US1, não de US2)

---

## Parallel Example: User Story 1

```bash
# Fixtures + specs de US1 em paralelo (T018-T024):
Task: "Criar fixtures OFX em tests/fixtures/"
Task: "Escrever ofx-parser.spec.ts"
Task: "Escrever dedupe-key.spec.ts"
Task: "Escrever import-bank-statement.use-case.spec.ts"
Task: "Escrever list-bank-statements.use-case.spec.ts"
Task: "Escrever find-bank-statement-by-id.use-case.spec.ts"
Task: "Escrever list-statement-transactions.use-case.spec.ts"

# Rotas de leitura de US1 em paralelo (T033-T035, depois de T028-T030):
Task: "Rota GET /v1/bank-statements"
Task: "Rota GET /v1/bank-statements/:id"
Task: "Rota GET /v1/bank-statements/:id/transactions"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

Diferente do template padrão, o MVP real desta feature precisa de **duas** stories (ambas P1):
importar sem conciliar não entrega o valor central do módulo.

1. Completar Setup + Foundational
2. Completar US1 (importar + listar + ver transações)
3. Completar US2 (sugestão automática + conciliar) — **checkpoint MVP**
4. **PARAR e VALIDAR**: rodar os Cenários 1 e 2 de `quickstart.md`, incluindo a verificação
   crítica do lançamento `isReadOnly` (recebível de venda) sendo conciliado com sucesso
5. Deploy/demo se pronto

### Incremental Delivery

1. Setup + Foundational → base pronta
2. US1 → US2 → **MVP** → demo
3. US3 (busca manual) → US4 (soma) → demo — cobrem os casos em que a sugestão automática falha
4. US5 (criar lançamento) → demo — fecha o segundo problema central do módulo
5. US6 (excluir/desfazer) → demo — reversibilidade, requisito de segurança operacional
6. US7 (filtro/busca/download) → demo — polimento operacional
7. Ajustes 2026-08-14 (Phase 10) → **D26** → D23 + D25 → D22 → D19 → D27 → frontend
8. Polish (Phase 11) → gate final + documentação

### Nota sobre a ordem de sequenciamento do módulo financeiro

Por decisão registrada no próprio `spec.md` (Assumptions) e no prompt original: esta feature só
valida de verdade contra dados reais depois de `002-bank-account-ledger`, `004-financial-statement`
(se aplicável) e `005-card-receivables-engine` já estarem consumíveis — sem lançamentos com
pagamentos reais e recebíveis de cartão com taxa/prazo corretos, não há o que casar durante o
desenvolvimento desta feature.

---

## Notes

- **Addendum 2026-08-10** (`/speckit-clarify` — layout de referência, `/speckit-plan` research.md
  D14/D15): reabriu US4 (T079–T082, já esperado desde o desenho original — `manual-match-drawer.tsx`
  sempre foi planejado como multi-select) e acrescentou T116–T121 (conta bancária editável em
  "Criar lançamento" e filtro de período `postedAt` na aba Pendentes). Nenhuma task antiga foi
  invalidada — só T079–T082 seguem pendentes (nunca tinham sido feitas) e T116–T121 são novas.
- **Addendum 2026-08-11** (`/speckit-clarify` — comparação CPLUG x ERP Citybox, `/speckit-plan`
  research.md D16/D17): usuário apontou divergência estrutural real entre o layout implementado e os
  3 mockups + um bug funcional (busca manual filtrando só `status=pending`). Acrescentou T122–T148:
  ramo novo em `reconcile-transaction` para lançamento `paid` (D16, vínculo sem `addPayment`),
  endpoint dedicado `GET .../eligible-entries` (D17, substitui a chamada direta a
  `/v1/financial-entries`), e a reescrita das 3 telas (cards em Pendentes, filtros completos +
  tabela no drawer, seções no formulário de novo lançamento, painel "Registros sugeridos"). T083–T118
  (rodadas anteriores) não são reabertas — só a superfície de busca manual (`manual-match-drawer.tsx`,
  T076/T081) e o card de transação (`transaction-row.tsx`, antigo T…) são reescritos por T137/T139,
  substituindo o conteúdo entregue antes, não duplicando-o.
- **Addendum 2026-08-14** (`/speckit-clarify` + `/speckit-plan` — 3ª comparação CPLUG x Citybox,
  research.md D18–D24): usuário pediu 4 ajustes de UI/UX; a leitura do código real elevou 2 deles a
  mudanças de backend e expôs um conflito entre as próprias decisões (destravar a conta é motivado
  por extratos **sem** conta, mas mandar a movimentação para "a conta do extrato" exige que ela
  exista). Acrescentou **T149–T180** numa Phase 10 nova, empurrando Polish para Phase 11. Nenhuma
  task anterior é invalidada; T173/T174 reescrevem trechos de `manual-match-drawer.tsx` e
  `transaction-card.tsx` entregues por T137/T139, substituindo o conteúdo, não duplicando. T112
  (Phase 11) passa a cobrir 12 cenários de `quickstart.md`, não 6.
- **Addendum 2026-08-14, rodada de produção** (`/speckit-clarify` → `/speckit-plan` → `/speckit-tasks`):
  primeira rodada disparada por **uso real**, não por comparação de documento. O usuário testou a
  entrega no navegador e reportou 3 pontos; a investigação achou que a busca estava 100% bloqueada por
  uma causa estrutural — **não existe chave confiável entre o OFX e o cadastro de contas** (`BankAccount`
  guarda só `bankCode`). Acrescentou **T185–T197**: D26 (conta obrigatória na importação, FR-001),
  D27 (cliente/fornecedor por cadastro, FR-044) e 2 tarefas de documentação. **Nenhuma das duas toca
  schema.** T149–T156 não foram invalidadas, mas **reenquadradas**: deixam de ser o portão principal e
  viram reparo de extrato legado — o bloco ganhou aviso explícito no lugar do antigo "fazer primeiro".
  O 3º ponto relatado (status não virar `paid`) **não reproduziu** — `paid` é rotulado "Recebido" em
  conta a receber, e o usuário decidiu manter; nenhuma tarefa criada.
- **Addendum 2026-08-14, 2ª passada** (`/speckit-analyze` → `/speckit-clarify` → `/speckit-plan` →
  `/speckit-tasks`): a análise de consistência achou (F1) que a conta destravada em D19 invalidou a
  premissa do ramo `paid` de D16 — conciliar um `paid` de outra conta não geraria movimentação em
  lugar nenhum, contrariando SC-009. Resolvido por **FR-043/D25**, acrescentando **T181–T184** dentro
  da Phase 10, posicionados junto de T149–T152 por serem guards do mesmo use case. A mesma passada
  corrigiu dois defeitos do próprio `tasks.md` apontados pela análise: T112 dizia "9 cenários"
  quando são 12 (F2), e T129 (concluída) descrevia a conta como travada sem indicar que FR-037 foi
  revogada (F4, anotado como SUPERADO em vez de reescrito).
- `[P]` = arquivos diferentes, sem dependência entre si
- `[Story]` mapeia a tarefa à user story do `spec.md` para rastreabilidade
- Verificar que os testes falham antes de implementar (RED antes de GREEN)
- Parar em qualquer checkpoint para validar a story de forma independente
- Nenhuma tarefa desta lista autoriza commit — commit só com autorização explícita do usuário
  (regra do projeto, `CLAUDE.md`)
