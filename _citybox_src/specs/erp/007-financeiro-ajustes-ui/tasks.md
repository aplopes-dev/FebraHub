---

description: "Task list for feature implementation"

---

# Tasks: Ajustes no módulo Financeiro

**Input**: Design documents from `/specs/erp/007-financeiro-ajustes-ui/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Não solicitados explicitamente pela spec além do já vigente no monorepo (Jest no backend com `InMemory*Repository`, Vitest/RTL no frontend — `rules/ecc/common/testing.md` exige 80%+ de cobertura). Tasks de teste estão incluídas por padrão do workflow `/feature` do harness ECC (TDD é mandatório em `.claude/rules/ecc/common/development-workflow.md`), não porque a spec pediu explicitamente.

**Organization**: Tarefas agrupadas por user story (US1–US10, conforme `spec.md` — US9/US10 adicionadas na Clarification de 2026-08-09, depois de US1-US8 já implementadas). US8 (Formas de pagamento) é pré-requisito explícito de US3 (spec.md, "Why this priority" de US3) — por isso aparece **antes** de US3 na ordem de fases, apesar de ambas serem P1. US9/US10 (também P1) aparecem por último na ordem de fases (Phase 11/12) só por serem as últimas a entrar no spec — não têm dependência de US1-US8.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: a qual user story esta tarefa pertence (US1–US10)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Monorepo Turborepo/pnpm — `apps/erp/api` (NestJS) + `apps/erp/web` (Next.js), conforme `plan.md` → Project Structure.

---

## Phase 1: Setup

**Purpose**: Nenhuma inicialização de projeto nova é necessária — `erp-api`/`erp-web` já existem e rodam. Setup aqui é só garantir o ambiente local ligado.

- [X] T001 Confirmar `pnpm infra:up` e `pnpm dev:varejo` (admin-api + erp-web + erp-api) rodando localmente antes de iniciar qualquer tarefa

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema Prisma compartilhado (entidade `PaymentMethod` + campos novos em `FinancialGroup`) e o seed de provisionamento — bloqueiam US5 e US8, e por extensão US3.

**⚠️ CRITICAL**: Nenhuma tarefa de US3, US5 ou US8 pode começar antes desta fase estar completa.

- [X] T002 Adicionar `model PaymentMethod` (id, organizationId, name, fiscalCode, installmentPermission, systemKey, isSystem, deletedAt, createdAt, updatedAt) em `apps/erp/api/prisma/schema.prisma`, schema `erp`, seguindo exatamente o padrão de `CostCenter` (`@@unique([organizationId, name])`, `@@unique([organizationId, systemKey])`, `@@index([organizationId, deletedAt])`) — ver `data-model.md`
- [X] T003 Adicionar `enum FinancialGroupSign { positive negative }` e os campos `catalogOrder Int @default(0)` / `sign FinancialGroupSign?` no `model FinancialGroup` em `apps/erp/api/prisma/schema.prisma` — ver `data-model.md`
- [X] T004 Rodar `pnpm --filter @citybox/erp-api db:migrate:dev` para gerar e aplicar a migration dos campos de T002/T003; revisar o SQL gerado (migration puramente aditiva — nenhum `DROP`/`NOT NULL` retroativo, conforme `plan.md` → Constraints)
- [X] T005 Rodar o gate `database-reviewer` sobre a migration gerada em T004 (obrigatório por `CLAUDE.md`/Constitution Princípio V ao tocar schema)
- [X] T006 [P] Criar script de backfill `apps/erp/api/scripts/backfill-financial-group-catalog-order.ts` para popular `catalogOrder`/`sign` nos `FinancialGroup` de organizações já provisionadas antes desta migration (molde `scripts/backfill-financial-group-classification.ts` já existente) + registrar `db:backfill:financial-group-catalog-order` em `apps/erp/api/package.json`
- [X] T007 [P] Adicionar `SEED_PAYMENT_METHODS` (15 itens: Dinheiro, Cheque, Cartão de Crédito, Cartão de Débito, Boleto, Depósito, PagSeguro, Débito em Conta, Vale Alimentação, Vale Refeição, Vale Presente, Crédito em Loja, Faturamento, Pontos de Fidelidade, PIX — cada um com `systemKey` estável) em `apps/erp/api/src/modules/store-setup/application/seed-data/finance.seed.ts`
- [X] T008 [P] Adicionar `SEED_FINANCIAL_GROUPS_INCOME_STATEMENT` (9 grupos com `catalogOrder`/`sign`, ver tabela em `data-model.md`) e `SEED_CHART_OF_ACCOUNTS_INCOME_STATEMENT` (5 subcategorias: 3 em Receitas Operacionais, 2 em Juros/Multa) em `apps/erp/api/src/modules/store-setup/application/seed-data/finance.seed.ts`
- [X] T009 Implementar `writePaymentMethods` em `apps/erp/api/src/modules/store-setup/infrastructure/database/writers/finance.writer.ts` (upsert idempotente por `systemKey`, molde `writeCostCenters`), depende de T002, T007
- [X] T010 Estender `writeFinancialGroups`/`writeChartOfAccounts` em `apps/erp/api/src/modules/store-setup/infrastructure/database/writers/finance.writer.ts` para incluir os 9 grupos/5 contas de T008, depende de T003, T008
- [X] T011 Registrar as chamadas de T009/T010 em `apps/erp/api/src/modules/store-setup/infrastructure/database/apply-erp-seed-template.ts`

**Checkpoint**: Schema migrado, seed de organização nova cobre `PaymentMethod` + DRE reestruturada. US1, US2, US4, US6, US7 podem começar em paralelo com esta fase (não dependem dela); US3, US5, US8 dependem dela.

---

## Phase 3: User Story 1 - Resumo e colunas do Extrato (Priority: P1) 🎯 MVP

**Goal**: `/financas/extratos` mostra só Entradas/Saídas/Saldo do período no resumo (sem saldo por conta) e a grade com as 7 colunas especificadas.

**Independent Test**: Abrir `/financas/extratos` com lançamentos de teste; conferir visualmente resumo (3 métricas) e as 7 colunas na ordem certa — ver `quickstart.md` §1.

### Implementation for User Story 1

- [X] T012 [P] [US1] Remover `<BankAccountBalancesPanel />` e seu import de `apps/erp/web/src/features/financial-statement/pages/financial-statement-page.tsx` (FR-002)
- [X] T013 [P] [US1] Excluir `apps/erp/web/src/features/financial-statement/components/bank-account-balances-panel.tsx` e `apps/erp/web/src/features/financial-statement/hooks/use-bank-account-balances.ts` (órfãos após T012)
- [X] T014 [US1] Em `apps/erp/web/src/features/financial-statement/components/financial-statement-table.tsx`: substituir a coluna única de data (toggle `dateAxis`) por duas colunas fixas simultâneas "Competência" e "Vencimento" (FR-003)
- [X] T015 [US1] Em `apps/erp/web/src/features/financial-statement/components/financial-statement-table.tsx`: remover colunas "Fornecedor ou cliente" e "Tipo"; adicionar coluna "Método de pagamento" (dado já disponível no item da lista); separar a coluna "Valor" em "Valor original" e "Valor final" (FR-003) — depende de T014 (mesmo arquivo)
- [X] T016 [US1] Confirmar em `apps/erp/web/src/features/financial-statement/components/financial-statement-summary-cards.tsx` que os 3 cards (Entradas/Saídas/Saldo do período) já atendem FR-001 sem alteração — só validação, sem diff esperado
- [X] T017 [US1] Rodar roteiro `quickstart.md` §1 manualmente e confirmar os 2 Acceptance Scenarios de US1 em `spec.md`

**Checkpoint**: US1 completa e testável de forma independente — não depende da Fase 2.

---

## Phase 4: User Story 2 - Grade de Lançamentos (Priority: P1)

**Goal**: `/financas/lancamentos` mostra Fornecedor/Cliente, Tipo, Categoria, Data de vencimento, Valor original, Valor final, Status.

**Independent Test**: Abrir `/financas/lancamentos` com lançamentos pagar/receber cadastrados; conferir as 7 colunas — ver `quickstart.md` §2 (parte 1).

### Implementation for User Story 2

- [X] T018 [US2] Em `apps/erp/web/src/features/financial-entries/components/financial-entry-list-table.tsx`: separar a coluna única "Valor" (`computeEntryTotal`) em "Valor original" (valor base do lançamento) e "Valor final" (valor após taxas/rateio, já calculado hoje) — demais colunas (`party`/`operation`/`category`/`dueDate`/`status`) já estão na ordem certa, sem alteração (FR-004)
- [X] T019 [US2] Rodar roteiro `quickstart.md` §2 (parte 1) manualmente e confirmar o Acceptance Scenario de US2 em `spec.md`

**Checkpoint**: US2 completa e testável de forma independente — não depende da Fase 2.

---

## Phase 5: User Story 8 - Cadastro de formas de pagamento (CRUD) (Priority: P1)

**Goal**: `/configuracoes/formas-pagamento` com 15 formas padrão protegidas + CRUD real de formas próprias, backend persistido — pré-requisito de US3.

**Independent Test**: Abrir `/configuracoes/formas-pagamento`; confirmar 15 padrão presentes/protegidas; criar, editar, excluir uma forma própria; tentar excluir uma em uso — ver `quickstart.md` §7.

**Depende de**: Fase 2 (T002, T007, T009, T011).

### Backend for User Story 8

- [X] T020 [P] [US8] Criar `apps/erp/api/src/modules/finance/payment-methods/domain/entities/payment-method.entity.ts` (props + `create`/`with`/`update`/`softDelete`/`restore`, molde `cost-center.entity.ts`)
- [X] T021 [P] [US8] Criar `apps/erp/api/src/modules/finance/payment-methods/domain/repositories/payment-method.repository.interface.ts`
- [X] T022 [P] [US8] Criar `apps/erp/api/src/modules/finance/payment-methods/domain/errors/{payment-method-name-taken,payment-method-not-found,payment-method-not-removable,payment-method-immutable-field}.error.ts` (os 2 últimos cobrem FR-019 — edição E exclusão bloqueadas para `isSystem`, ver `research.md` R2)
- [X] T023 [US8] Criar `apps/erp/api/src/modules/finance/payment-methods/application/use-cases/create-payment-method/create-payment-method.use-case.ts` (+ `.spec.ts`) — depende de T020-T022
- [X] T024 [US8] Criar `apps/erp/api/src/modules/finance/payment-methods/application/use-cases/update-payment-method/update-payment-method.use-case.ts` (+ `.spec.ts`) — bloqueia edição se `isSystem === true` (FR-019) — depende de T020-T022
- [X] T025 [US8] Criar `apps/erp/api/src/modules/finance/payment-methods/application/use-cases/delete-payment-method/delete-payment-method.use-case.ts` (+ `.spec.ts`) — bloqueia exclusão se `isSystem === true` (FR-019) OU se em uso por `FinancialEntryPayment.paymentMethod` (FR-021, checagem de existência via repositório) — depende de T020-T022
- [X] T026 [P] [US8] Criar `apps/erp/api/src/modules/finance/payment-methods/application/use-cases/restore-payment-method/restore-payment-method.use-case.ts` (idempotente, molde `restore-cost-center.use-case.ts`)
- [X] T027 [P] [US8] Criar `apps/erp/api/src/modules/finance/payment-methods/application/use-cases/list-payment-methods/list-payment-methods.use-case.ts` (+ `.spec.ts`, paginação server-side `search`/`page`/`perPage`/`tab`)
- [X] ~~T028~~ [P] [US8] ~~Criar endpoint `/options` dedicado~~ — **DESCARTADA na implementação**: não existe `list-cost-center-options` nem endpoint `/options` em nenhum módulo do repo (confirmado por grep); o padrão real já estabelecido (`cost-centers`, `bank-accounts`) é o frontend chamar a listagem normal com `?perPage=100&tab=active`. Seguido o mesmo padrão para `payment-methods` — ver T037.
- [X] T029 [US8] Criar `apps/erp/api/src/modules/finance/payment-methods/infrastructure/database/prisma-payment-method.repository.ts` (implementa T021, `prisma.scoped` por organização, `findByName` inclui soft-deleted) — depende de T002, T021
- [X] T030 [US8] Criar rotas HTTP em `apps/erp/api/src/modules/finance/payment-methods/infrastructure/http/routes/{list,list-options,create,update,delete,restore,find-by-id}-payment-method/*.route.ts` + `infrastructure/http/routes/shared/payment-method.{dto,presenter}.ts` (DTOs `class-validator`, Swagger obrigatório) — contrato completo em `contracts/payment-methods.md` — depende de T023-T028
- [X] T031 [US8] Criar `apps/erp/api/src/modules/finance/payment-methods/payment-methods.module.ts` (registrar controllers, rotas de path fixo — incl. `/options` — ANTES de `:id`, molde `cost-centers.module.ts`) e registrar o módulo no módulo `finance` pai — depende de T029, T030
- [X] T032 [P] [US8] Criar `apps/erp/api/src/modules/finance/payment-methods/tests/{payment-methods-test-factory.ts, in-memory-payment-method.repository.ts}` (molde `cost-centers-test-factory.ts`)

### Frontend for User Story 8

- [X] T033 [P] [US8] Criar `apps/erp/web/src/features/payment-methods/api/{payment-method.dto.ts, payment-method.mapper.ts, payment-methods.service.ts}` (via `comercioFetch`, molde `features/cost-centers/api/`)
- [X] T034 [P] [US8] Criar `apps/erp/web/src/features/payment-methods/hooks/{query-keys.ts, use-payment-method-queries.ts, use-payment-method-mutations.ts}` (React Query, molde `use-cost-center-queries.ts`/`use-cost-center-mutations.ts`) — depende de T033
- [X] T035 [US8] Excluir `apps/erp/web/src/features/payment-methods/services/payment-method.service.ts` e `apps/erp/web/src/features/payment-methods/hooks/use-payment-method-store.ts` (store mock in-memory, `useSyncExternalStore`) — depende de T034 (substituição pronta)
- [X] T036 [US8] Excluir `apps/erp/web/src/features/payment-methods/data/mock-payment-methods.ts` (mantém `data/payment-method-options.ts`, tabela fiscal `tPag`, que não é dado da entidade)
- [X] T037 [US8] Atualizar `apps/erp/web/src/features/payment-methods/pages/payment-method-list-page.tsx` para consumir os hooks de T034 em vez de `usePaymentMethodStore()` — depende de T034, T035
- [X] T038 [US8] Atualizar `apps/erp/web/src/features/payment-methods/components/payment-method-form-dialog.tsx` para chamar as mutations reais de T034 (create/update) em vez do store — depende de T034
- [X] T039 [US8] Confirmar que `apps/erp/web/src/features/payment-methods/components/{payment-method-list,payment-method-row-actions}.tsx` continuam funcionando sem alteração estrutural (só a fonte de dado mudou) — validação, ajuste mínimo se necessário
- [X] T040 [US8] Atualizar `apps/erp/web/AGENTS.md` §4.5 (bloco "`features/payment-methods`") para refletir a migração de mock para API real (Princípio I da Constitution)
- [X] T041 [US8] Atualizar `apps/erp/api/AGENTS.md` para documentar o novo módulo `payment-methods` (Princípio I da Constitution)
- [ ] T042 [US8] Rodar roteiro `quickstart.md` §7 manualmente e confirmar os 4 Acceptance Scenarios de US8 em `spec.md`

**Checkpoint**: US8 completa e testável de forma independente. US3 pode começar.

---

## Phase 6: User Story 3 - Formulário de novo lançamento (labels + forma de pagamento real) (Priority: P1)

**Goal**: Seção Pagamentos com 3 labels alinhados; select de Forma de pagamento consumindo o cadastro real de US8.

**Independent Test**: Abrir `/financas/lancamentos/novo`; conferir labels; cadastrar forma nova em `/configuracoes/formas-pagamento` e ver refletida no select — ver `quickstart.md` §2 (partes 2-4).

**Depende de**: Fase 5 (US8) completa — o select real só existe depois de T028/T030 (endpoint `/options`) e T034 (hook frontend).

### Backend for User Story 3

- [X] T043 [US3] Criar `apps/erp/api/src/modules/finance/financial-entries/application/use-cases/assert-payment-method-exists.ts` (molde `assert-cost-center-exists.ts`) — depende de T021 (repository interface de `payment-methods`, injetado aqui)
- [X] T044 [US3] Em `apps/erp/api/src/modules/finance/financial-entries/infrastructure/http/routes/shared/financial-entry.dto.ts`: trocar `@IsIn(FINANCIAL_ENTRY_PAYMENT_METHODS)` por `@IsUUID()` no campo `paymentMethod` de `FinancialEntryPaymentHttpDto` (schema Prisma **não muda** — permanece `String`, ver `research.md` R1) — depende de T043
- [X] T045 [US3] Injetar `assertPaymentMethodExists` (T043) nos use-cases de create/update de `financial-entries` que recebem `payments[]`, substituindo a validação de enum fixo — depende de T043, T044

### Frontend for User Story 3

- [X] T046 [P] [US3] Em `apps/erp/web/src/features/financial-entries/components/financial-entry-form/financial-entry-payments-section.tsx`: adicionar `label` visível para os campos Data e Forma de pagamento (hoje só Valor tem label) (FR-005)
- [X] T047 [US3] Em `apps/erp/web/src/features/financial-entries/components/financial-entry-form/financial-entry-payments-section.tsx`: trocar o `Select` de Forma de pagamento do enum `FINANCIAL_ENTRY_PAYMENT_METHODS` para `usePaymentMethodOptionsQuery` (hook novo, molde `useCostCenterOptionsQuery`, consome `/v1/payment-methods/options` de T028/T030) (FR-006) — depende de T034 (Fase 5), T028/T030 (Fase 5)
- [X] T048 [US3] Em `apps/erp/web/src/features/financial-entries/components/transfer-dialog.tsx`: trocar o `Select` de Forma de pagamento do mesmo enum fixo para `usePaymentMethodOptionsQuery` (mesmo hook de T047, FR-022 — única fonte no módulo) — depende de T047
- [X] T049 [US3] Remover `FINANCIAL_ENTRY_PAYMENT_METHODS`/`FINANCIAL_ENTRY_PAYMENT_METHOD_LABELS` de `apps/erp/web/src/features/financial-entries/types/financial-entry.ts` — depende de T047, T048 (nenhum consumidor restante)
- [X] T050 [US3] Atualizar `apps/erp/web/AGENTS.md` §4.5 (bloco `financial-entries`) documentando a troca do enum fixo pelo cadastro real (Princípio I)
- [ ] T051 [US3] Rodar roteiro `quickstart.md` §2 (partes 2-4) manualmente e confirmar os 3 Acceptance Scenarios de US3 em `spec.md`, incluindo o Edge Case de lançamento antigo com forma de pagamento fora do cadastro (exibição somente-leitura)

**Checkpoint**: US3 completa e testável de forma independente (após US8).

---

## Phase 7: User Story 4 - Importação de extrato bancário sem conta obrigatória (Priority: P2)

**Goal**: Diálogo de importação sem exigir conta bancária; auto-detecção por código de banco do arquivo `.ofx`; upload de arquivo (já é upload hoje, ver `research.md` — só falta tornar a conta opcional + auto-detecção).

**Independent Test**: Importar com conta única do banco → pré-seleção automática; importar com banco sem correspondência única → campo vazio, import não bloqueado — ver `quickstart.md` §3.

**Depende de**: Nenhuma dependência de outras fases (Fase 2 não bloqueia — `BankAccount`/`BankStatement` já existem).

**Decisão de sequenciamento a confirmar antes de iniciar**: `contracts/bank-reconciliation-import.md` registra uma Open Question (endpoint de preview novo vs. auto-detecção só no import definitivo). As tarefas abaixo assumem a opção (a) — endpoint de preview — por ser a que atende literalmente o Acceptance Scenario 1 de US4 (pré-seleção **antes** da confirmação). Se a equipe optar pela opção (b) na revisão de código, T053/T057 mudam de forma; T054-T056 e T058-T060 permanecem.

### Backend for User Story 4

- [X] T052 [US4] Em `apps/erp/api/src/modules/finance/bank-reconciliation/infrastructure/http/routes/shared/bank-statement.dto.ts` (ou equivalente): tornar `bankAccountId` opcional no DTO de `POST /v1/bank-reconciliation/statements` (FR-007)
- [X] T053 [US4] Criar use-case `apps/erp/api/src/modules/finance/bank-reconciliation/application/use-cases/preview-bank-statement/preview-bank-statement.use-case.ts` (+ `.spec.ts`): parseia o arquivo com `parseOfxFile` já existente, busca `BankAccount` ativas da organização com `bankCode` igual ao do arquivo, retorna `{ bankCode, suggestedBankAccountId }` (`null` se 0 ou 2+ correspondências) — contrato em `contracts/bank-reconciliation-import.md`
- [X] T054 [US4] Em `apps/erp/api/src/modules/finance/bank-reconciliation/application/use-cases/import-bank-statement/import-bank-statement.use-case.ts`: quando `dto.bankAccountId` ausente, reaproveitar a mesma lógica de resolução de T053 para preencher `bankAccountId` automaticamente antes de persistir o `BankStatement`; se não resolver, persistir com `bankAccountId: null` (FR-007a/FR-007b) — depende de T052
- [X] T055 [US4] Criar rota `POST /v1/bank-reconciliation/statements/preview` expondo T053 (Swagger obrigatório) — depende de T053
- [X] T056 [US4] Confirmar em `apps/erp/api/src/modules/finance/bank-reconciliation/application/use-cases/import-bank-statement/import-bank-statement.use-case.ts` que `assertBankAccountExists` só roda quando `bankAccountId` está presente (hoje é chamada incondicional — bloquearia FR-007 se não ajustada) — depende de T052

### Frontend for User Story 4

- [X] T057 [US4] Em `apps/erp/web/src/features/bank-reconciliation/components/statement-import-dialog.tsx`: ao selecionar o arquivo, chamar o endpoint de preview (T055) e pré-preencher `bankAccountId` com `suggestedBankAccountId` quando presente, mantendo o campo editável (FR-007a)
- [X] T058 [US4] Em `apps/erp/web/src/features/bank-reconciliation/components/statement-import-dialog.tsx`: remover a validação `if (!bankAccountId) { toast.error(...); return; }` do `handleSubmit` (o campo `FormField label="Conta bancária" required` perde o `required`) (FR-007)
- [X] T059 [US4] Confirmar em `apps/erp/web/src/features/bank-reconciliation/components/statement-import-dialog.tsx` que o campo de arquivo já é um seletor de upload restrito a `.ofx` com validação de extensão no client (FR-008/FR-009) — já implementado hoje (`accept=".ofx"` + regex), só validação sem diff esperado
- [ ] T060 [US4] Rodar roteiro `quickstart.md` §3 manualmente e confirmar os 4 Acceptance Scenarios de US4 em `spec.md`, incluindo os 2 Edge Cases relacionados (extrato sem conta / banco fora do catálogo de 19)

**Checkpoint**: US4 completa e testável de forma independente.

---

## Phase 8: User Story 5 - Estrutura de categorias do Relatório de Resultados (Priority: P2)

**Goal**: DRE com 9 categorias fixas (com subcategorias em 2 delas) sempre visíveis, na ordem do catálogo, com sinal por grupo, e total "Resultado Operacional".

**Independent Test**: Abrir `/financas/relatorios-de-resultados`; conferir árvore completa mesmo com categorias zeradas; conferir total final — ver `quickstart.md` §4.

**Depende de**: Fase 2 (T003, T008, T010, T011 — seed dos 9 grupos/5 contas).

### Backend for User Story 5

- [X] T061 [US5] Reescrever `apps/erp/api/src/modules/finance/reports/application/use-cases/get-income-statement/get-income-statement.use-case.ts`: iterar **todos** os `FinancialGroup` ativos com `classification=resultado` ordenados por `catalogOrder` (não só os que têm `sums`), preenchendo `totalCents: 0` quando não há allocation no período; parar de ordenar por `totalCents desc` — depende de T003, T010
- [X] T062 [US5] Trocar o shape de `IncomeStatementReportDto` (`revenue`/`expense`/`netCents` → `groups[]`/`operatingResultCents`, ver `contracts/income-statement.md`) em `apps/erp/api/src/modules/finance/reports/infrastructure/http/routes/shared/income-statement-report.dto.ts` — depende de T061
- [X] T063 [US5] Atualizar `apps/erp/api/src/modules/finance/reports/infrastructure/http/routes/shared/finance-report.presenter.ts` para o novo shape — depende de T062
- [X] T064 [US5] Atualizar `apps/erp/api/src/modules/finance/reports/infrastructure/http/routes/get-income-statement/get-income-statement.route.ts` (Swagger da resposta) — depende de T062
- [X] T065 [US5] Atualizar/reescrever os testes de `get-income-statement.use-case.spec.ts` para o novo comportamento (9 grupos sempre presentes, ordem de catálogo, sinal aplicado no total) — depende de T061

### Frontend for User Story 5

- [X] T066 [US5] Atualizar `apps/erp/web/src/features/financial-results/api/financial-result.mapper.ts` para consumir o novo shape `groups[]`/`operatingResultCents` (era `revenue`/`expense`/`netCents`) — depende de T062, T063, T064
- [X] T067 [US5] Confirmar que `apps/erp/web/src/features/financial-results/pages/financial-result-page.tsx` (árvore Grupo→Conta) renderiza corretamente grupos sem subcategoria (grupo-folha) e grupos com `totalCents: 0` — ajuste mínimo se o componente hoje esconder grupos zerados — depende de T066
- [X] T068 [US5] Confirmar que o rótulo/total final da tela passa a exibir "Resultado Operacional" (rótulo já pode existir como "Resultado do período" ou similar — ajustar texto se necessário) (FR-011) — depende de T066, T067
- [X] T069 [US5] Atualizar `apps/erp/api/AGENTS.md` e `apps/erp/web/AGENTS.md` §4.5 (bloco `financial-results`) documentando a nova estrutura de categorias e o novo shape do DTO (Princípio I)
- [ ] T070 [US5] Rodar roteiro `quickstart.md` §4 manualmente e confirmar os 4 Acceptance Scenarios de US5 em `spec.md`, incluindo o Edge Case de período sem lançamento em alguma categoria (aparece zerada, não omitida)

**Checkpoint**: US5 completa e testável de forma independente.

---

## Phase 9: User Story 6 - Provedor do contrato de cartão como lista fechada (Priority: P3)

**Goal**: Campo Provedor em `/financas/contratos-de-cartoes-e-outros/novo` vira select/autocomplete fechado com os 20 provedores especificados.

**Independent Test**: Abrir o formulário; confirmar que só as 20 opções são selecionáveis, texto livre não é aceito — ver `quickstart.md` §5.

**Depende de**: Nenhuma dependência de outras fases.

### Implementation for User Story 6

- [X] T071 [US6] Substituir o conteúdo de `apps/erp/web/src/features/card-contracts/data/card-providers.ts` (`CARD_PROVIDER_SUGGESTIONS`) pelos 20 provedores especificados (Elavon, Conductor, Bin, RV, Firstdata Corban, Fillip, Libercard, Cielo, Rede, Credsystem, Infocards, Nddcargo, Global, Vero, Stone, Mercado Pago, Accentiv, Alelo, Aspeb, A Vista) (FR-014, FR-015)
- [X] T072 [US6] Em `apps/erp/web/src/features/card-contracts/components/card-contract-form-view.tsx`: trocar o campo Provedor de `Autocomplete` com `freeSolo`/texto livre para `Autocomplete` fechado (sem `freeSolo`, `disableClearable` conforme UX do design system) consumindo `CARD_PROVIDER_SUGGESTIONS` de T071 (FR-013) — depende de T071
- [X] T073 [US6] Atualizar `apps/erp/web/AGENTS.md` §4.5 (bloco `card-contracts`) documentando que Provedor deixou de ser texto livre (Princípio I)
- [ ] T074 [US6] Rodar roteiro `quickstart.md` §5 manualmente e confirmar os 2 Acceptance Scenarios de US6 em `spec.md`

**Checkpoint**: US6 completa e testável de forma independente.

---

## Phase 10: User Story 7 - Lista completa de bancos (Priority: P3)

**Goal**: Select de Banco em `/financas/contas-bancarias` com os 19 bancos especificados.

**Independent Test**: Abrir "Nova conta"; conferir os 19 bancos no select; salvar e reabrir para edição, confirmar persistência — ver `quickstart.md` §6.

**Depende de**: Nenhuma dependência de outras fases.

### Implementation for User Story 7

- [X] T075 [US7] Substituir o conteúdo de `apps/erp/web/src/features/bank-accounts/lib/bank-catalog.ts` (`BANK_CATALOG`) pelos 19 bancos especificados com código + nome (Banco de Brasília 70, Banco do Brasil 1, Banco do Nordeste 4, Bancoob 756, Banestes 21, BankBoston 479, Banpará 37, Banrisul 41, BCN 291, Bradesco 237, BTG Pactual 208, C6 Bank 336, Caixa Econômica 104, Citibank 745, Conta PDV -30, Credisan 89, HSBC 399, Inter 77, Itaú 341, Mercantil do Brasil 389) (FR-016)
- [X] T076 [US7] Confirmar em `apps/erp/web/src/features/bank-accounts/lib/bank-catalog.ts` (`getBankNameByCode`) que o round-trip código→nome continua funcionando para os códigos novos, incluindo o código negativo `-30` (Conta PDV) (FR-017) — depende de T075
- [X] T077 [US7] Atualizar `apps/erp/web/AGENTS.md` §4.5 (bloco `bank-accounts`) documentando a lista de bancos atualizada (Princípio I)
- [ ] T078 [US7] Rodar roteiro `quickstart.md` §6 manualmente e confirmar os 2 Acceptance Scenarios de US7 em `spec.md`, incluindo o caso de conta antiga com código fora da nova lista (Assumption do spec — valor histórico continua exibível)

**Checkpoint**: US7 completa e testável de forma independente.

---

## Phase 11: User Story 9 - Bandeira do pagamento como select fechado (Priority: P1)

**Goal**: Na seção Pagamentos de `/financas/lancamentos/novo` (e visualização/edição), o campo Bandeira tem label visível alinhado aos demais campos e é um select fechado sobre o catálogo `CARD_BRAND_OPTIONS` compartilhado (mesmo usado em Contratos de cartões e Pedidos de venda), ampliado para incluir as opções pedidas nesta fatia.

**Independent Test**: Abrir a seção Pagamentos de um lançamento; conferir label "Bandeira" alinhado; abrir o select e confirmar que só as opções do catálogo são selecionáveis (sem texto livre) — ver `quickstart.md` §8.

**Depende de**: Nenhuma dependência de outras fases desta feature (não toca schema).

### Implementation for User Story 9

- [X] T086 [P] [US9] Ampliar `CARD_BRAND_OPTIONS` em `apps/erp/web/src/features/card-contracts/data/card-brands.ts` com as 5 opções novas (Sorocred, Credicard, Ticket, VR Benefícios, Banricompras), preservando os 10 `value`s já existentes sem alteração (mesmo `"Mastercard"`/`"Outra"` — ver tabela em `data-model.md`) (FR-006c)
- [X] T087 [US9] Em `apps/erp/web/src/features/financial-entries/components/financial-entry-form/financial-entry-payments-section.tsx`: adicionar `Typography` de label "Bandeira" acima do campo (mesmo padrão dos outros 3 campos da linha) e trocar o `Autocomplete freeSolo` (que usa `useCardBrandSuggestionsQuery`) por um `Select` fechado sobre `CARD_BRAND_OPTIONS` de T086, mantendo o campo opcional (FR-006a, FR-006b, FR-006d) — depende de T086
- [X] T088 [P] [US9] Remover `apps/erp/web/src/features/financial-entries/hooks/use-card-brand-suggestions.ts` (órfão após T087 — confirmar via `grep` que não há outro consumidor antes de excluir) — depende de T087
- [X] T089 [US9] Atualizar `apps/erp/web/AGENTS.md` §4.5 (bloco `financial-entries`) documentando que Bandeira deixou de ser `Autocomplete freeSolo` e passa a ser `Select` fechado sobre `CARD_BRAND_OPTIONS` compartilhado (Princípio I)
- [ ] T090 [US9] Rodar roteiro `quickstart.md` §8 manualmente e confirmar os 3 Acceptance Scenarios de US9 em `spec.md`, incluindo a exibição somente-leitura de valores históricos fora do catálogo

**Checkpoint**: US9 completa e testável de forma independente.

---

## Phase 12: User Story 10 - Bloquear exclusão de lançamento com conciliação ativa (Priority: P1)

**Goal**: `DELETE /v1/financial-entries/:id` passa a recusar (409) a exclusão de um lançamento com pagamento em conciliação ativa, com mensagem explicando que é preciso desfazer a conciliação primeiro; e o caminho de "desfazer conciliação" (hoje só parcialmente implementado) passa a existir de ponta a ponta, permitindo a exclusão depois.

**Independent Test**: Conciliar um lançamento de teste; tentar excluí-lo → bloqueado (409); desfazer a conciliação; excluir de novo → permitido — ver `quickstart.md` §9.

**Depende de**: Nenhuma dependência das Fases 2–10 desta feature (não toca schema; reaproveita `BankStatementMatch`/`BankStatementTransaction` já existentes do módulo `bank-reconciliation`, spec `006-bank-reconciliation`).

**Decisão de arquitetura a confirmar antes de codar** (`research.md` R9): `bank-reconciliation` já importa `FinancialEntriesModule` (dependência de mão única, D2 de `specs/erp/006-bank-reconciliation/research.md`). Fazer `DeleteFinancialEntryUseCase` (em `financial-entries`) consultar `BankStatementMatchRepository` (dono: `bank-reconciliation`) inverte essa direção e cria um ciclo. A abordagem recomendada é `forwardRef()` nos dois módulos (T098/T099) — se, na implementação, isso não resolver de forma limpa, a alternativa é Prisma direto no `DeleteFinancialEntryUseCase` só para essa query de existência (documentar a troca no `AGENTS.md` se for o caminho escolhido).

### Backend for User Story 10 — módulo `bank-reconciliation` (fecha o gap do "desfazer conciliação")

- [X] T091 [P] [US10] Criar `apps/erp/api/src/modules/finance/bank-reconciliation/application/use-cases/undo-reconciliation/undo-reconciliation.use-case.ts` (+ `.spec.ts`): carrega a `BankStatementTransaction`, valida `status === 'reconciled'` (senão lança `BankStatementTransactionNotReconciledError`, erro **já existente**, hoje sem nenhum lançador), chama `transaction.undoReconciliation()` (método de entidade **já existente**) + `save`, e por fim `bankStatementMatchRepository.deleteByTransactionId(organizationId, transactionId)` (método **já existente**, hard-delete dos matches) — contrato em `contracts/financial-entry-delete-guard.md`
- [X] T092 [US10] Criar rota `apps/erp/api/src/modules/finance/bank-reconciliation/infrastructure/http/routes/undo-reconciliation/undo-reconciliation.route.ts`: `POST v1/bank-statements/:id/transactions/:transactionId/reconcile/undo` (mesmo padrão de `reconcile-transaction.route.ts` — `@Controller('v1/bank-statements/:id/transactions/:transactionId/reconcile')`, `@Post('undo')`), Swagger com `@ApiResponse` 200/404/409 — depende de T091
- [X] T093 [US10] Registrar `UndoReconciliationUseCase`/`UndoReconciliationRoute` em `apps/erp/api/src/modules/finance/bank-reconciliation/bank-reconciliation.module.ts` (`providers`/`controllers`, rota de caminho fixo antes de `:id` conforme comentário já existente no módulo) — depende de T091, T092

### Backend for User Story 10 — bloqueio em `financial-entries`

- [X] T094 [US10] Criar `apps/erp/api/src/modules/finance/financial-entries/domain/errors/financial-entry-not-removable.error.ts` (nome com sufixo "NotRemovable" — `app-exception.filter.ts` mapeia para 409 automaticamente por esse padrão de nome, mesmo mecanismo de `PaymentMethodNotRemovableError`), mensagem externa explicando que é preciso desfazer a conciliação antes de excluir (FR-006e)
- [X] T095 [US10] Resolver o wiring de DI entre `financial-entries` e `bank-reconciliation` (ver "Decisão de arquitetura" acima): adicionar `forwardRef(() => BankReconciliationModule)` em `imports` de `apps/erp/api/src/modules/finance/financial-entries/financial-entries.module.ts`, e o lado espelhado (`forwardRef(() => FinancialEntriesModule)`) em `bank-reconciliation.module.ts` se o Nest exigir para resolver o ciclo — depende de T093
- [X] T096 [US10] Em `apps/erp/api/src/modules/finance/financial-entries/application/use-cases/delete-financial-entry/delete-financial-entry.use-case.ts`: injetar `BankStatementMatchRepository` (via T095) e, antes do `softDelete()`, chamar `findActiveFinancialEntryIds(organizationId, [entry.id])`; se o `Set` contiver `entry.id`, lançar `FinancialEntryNotRemovableError` (T094) — depende de T094, T095
- [X] T097 [US10] Atualizar `apps/erp/api/src/modules/finance/financial-entries/infrastructure/http/routes/delete-financial-entry/delete-financial-entry.route.ts` (`@ApiResponse` 409 novo, descrição) — depende de T096
- [X] T098 [US10] Estender `delete-financial-entry.use-case.spec.ts` com casos: lançamento com match ativo → lança `FinancialEntryNotRemovableError`; lançamento sem match → soft-delete normal (regressão); usar um `InMemoryBankStatementMatchRepository` (molde dos in-memory repos já existentes em `bank-reconciliation/tests/`) — depende de T096

### Frontend for User Story 10

- [X] T099 [US10] Confirmar em `apps/erp/web/src/features/financial-entries/hooks/use-financial-entry-mutations.ts` (`useDeleteFinancialEntryMutation`) que o `toast.error` com `errorMessage(error)` já exibe a mensagem 409 do backend sem alteração de código — validação, sem diff esperado
- [X] T100 [US10] Confirmar que `undoReconciliationApi`/`useUndoReconciliationMutation` (`apps/erp/web/src/features/bank-reconciliation/{api/bank-reconciliation.service.ts, hooks/use-bank-reconciliation-mutations.ts}`) — já existentes, hoje chamando uma rota inexistente — passam a funcionar fim-a-fim contra a rota nova de T092/T093, sem alteração de código no frontend
- [X] T101 [US10] Atualizar `apps/erp/api/AGENTS.md` (blocos `financial-entries` e `bank-reconciliation`) documentando o bloqueio de exclusão e o novo endpoint de desfazer conciliação (Princípio I)
- [ ] T102 [US10] Rodar roteiro `quickstart.md` §9 manualmente e confirmar os 3 Acceptance Scenarios de US10 em `spec.md`, incluindo o ciclo completo bloquear → desfazer → excluir

**Checkpoint**: US10 completa e testável de forma independente.

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Verificação final cruzando todas as user stories, gate de qualidade do harness ECC. T079/T080/T081/T084 já passaram para US1–US8 (2026-08-07); ficam **desmarcadas de novo** aqui porque precisam ser re-rodadas cobrindo o código novo de US9/US10 antes do release desta fatia — não é regressão, é o mesmo gate rodando sobre um diff maior.

- [ ] T079 [P] Rodar `pnpm --filter @citybox/erp-api lint && pnpm --filter @citybox/erp-api typecheck && pnpm --filter @citybox/erp-api test` (gate de verificação, `plan.md`/Constitution) — cobrindo também `payment-methods` (T094-T098) e `bank-reconciliation` (T091-T093)
- [ ] T080 [P] Rodar `pnpm --filter @citybox/erp-web lint && pnpm --filter @citybox/erp-web typecheck && pnpm --filter @citybox/erp-web test` (gate de verificação) — cobrindo também `financial-entries`/`card-contracts` (T086-T088)
- [ ] T081 Rodar `pnpm build` na raiz para confirmar que `erp-api`/`erp-web` compilam com as mudanças das 10 user stories integradas
- [X] T082 Revisar todas as atualizações de `AGENTS.md` feitas nas tarefas anteriores (T040, T041, T050, T069, T073, T077, T089, T101) num único passe de consistência — sem seção removida, só atualizada/adicionada (Constitution Princípio I)
- [ ] T083 Rodar `quickstart.md` na íntegra, do §1 ao §9 + seção "Verificação de regressão", como smoke test final de todas as user stories juntas
- [X] T084 [P] Confirmar que nenhum `eslint-disable`/`@ts-ignore` foi introduzido em nenhum arquivo tocado (Constitution — "Strict Linting Compliance")
- [X] T085 Preparar resumo de PR (`type: feat`) cobrindo as 10 user stories, sem commitar — aguardar autorização explícita do usuário (Constitution — "No Commits without Approval")

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências.
- **Foundational (Phase 2)**: depende de Setup. **BLOQUEIA** US3 e US5 diretamente, e US8 (que por sua vez bloqueia US3).
- **US1, US2, US4, US6, US7, US9, US10**: não dependem da Fase 2 nem entre si — podem rodar em paralelo com a Fase 2 e entre si (US10 depende só do módulo `bank-reconciliation` já existente de `006-bank-reconciliation`, fora desta feature).
- **US8 (Phase 5)**: depende da Fase 2 completa (T002, T007, T009, T011).
- **US3 (Phase 6)**: depende de US8 completa (Phase 5) — é o único caso de dependência cruzada entre user stories nesta feature (explícito em `spec.md`, "Why this priority" de US3).
- **US5 (Phase 8)**: depende da Fase 2 completa (T003, T008, T010, T011) — não depende de US8.
- **Polish (Phase 13)**: depende de todas as user stories desejadas para o release estarem completas, incluindo US9/US10.

### User Story Dependencies

- **US1 (P1)**: independente — nenhuma dependência de outra story.
- **US2 (P1)**: independente.
- **US8 (P1)**: depende só da Fase 2 (Foundational).
- **US3 (P1)**: depende de US8.
- **US9 (P1)**: independente — só toca frontend (`card-brands.ts` + `financial-entry-payments-section.tsx`).
- **US10 (P1)**: independente das demais stories **desta feature**; internamente T091-T093 (módulo `bank-reconciliation`) devem terminar antes de T095-T098 (módulo `financial-entries`, que depende do wiring de DI resolvido em T095).
- **US4 (P2)**: independente.
- **US5 (P2)**: depende só da Fase 2 (Foundational).
- **US6 (P3)**: independente.
- **US7 (P3)**: independente.

### Within Each User Story

- Backend antes de frontend quando a US tem os dois lados (US3, US4, US5, US8, US10) — o frontend consome o contrato exposto pelo backend.
- Use-cases/entities antes de rotas HTTP; rotas antes do módulo NestJS que as registra.
- Atualização de `AGENTS.md` como última tarefa "de conteúdo" da story, antes da validação via `quickstart.md`.
- US10 especificamente: módulo `bank-reconciliation` (T091-T093, fecha o gap de "desfazer") antes do módulo `financial-entries` (T094-T098, consome o wiring resolvido) — ordem inversa da dependência normal de módulo (`bank-reconciliation` importa `financial-entries`, não o contrário), mas a ordem de implementação segue a ordem de uso: sem T093 pronta, T096 não tem o que chamar.

### Parallel Opportunities

- Todas as tarefas `[P]` da Fase 2 (T006-T008) podem rodar em paralelo entre si, após T002-T005.
- US1, US2, US4, US6, US7, US9 podem ser trabalhadas em paralelo entre si e em paralelo com a Fase 2, por times/agentes diferentes — nenhuma toca os mesmos arquivos.
- Dentro de US8: T020-T022 (domain) em paralelo; T026-T028 (use-cases sem dependência cruzada) em paralelo; T033 (frontend `api/`) em paralelo com o backend de US8 inteiro, desde que o contrato (`contracts/payment-methods.md`) seja tratado como fonte de verdade antes do backend estar pronto (contract-first).
- Dentro de US5: backend (T061-T065) antes do frontend (T066-T068), mas T069 (AGENTS.md) pode começar assim que o shape estiver estável, em paralelo com T067/T068.
- Dentro de US9: T086 (catálogo) é pré-requisito único de T087; T088 (remover hook órfão) só depois de T087 confirmado sem outros consumidores.
- Dentro de US10: T091 e T094 podem começar em paralelo (arquivos/módulos diferentes, nenhum depende do outro ainda) — mas T095 (wiring) precisa de T093 pronta, e T096 precisa de T094+T095.

---

## Parallel Example: Foundational (Phase 2)

```bash
# Após T002-T005 (schema + migration + database-reviewer):
Task: "Criar script de backfill em apps/erp/api/scripts/backfill-financial-group-catalog-order.ts"
Task: "Adicionar SEED_PAYMENT_METHODS em apps/erp/api/src/modules/store-setup/application/seed-data/finance.seed.ts"
Task: "Adicionar SEED_FINANCIAL_GROUPS_INCOME_STATEMENT + SEED_CHART_OF_ACCOUNTS_INCOME_STATEMENT no mesmo arquivo"
```

## Parallel Example: User Story 8 (domain layer)

```bash
Task: "Criar payment-method.entity.ts em apps/erp/api/.../payment-methods/domain/entities/"
Task: "Criar payment-method.repository.interface.ts em apps/erp/api/.../payment-methods/domain/repositories/"
Task: "Criar os 4 erros de domínio em apps/erp/api/.../payment-methods/domain/errors/"
```

## Parallel Example: User Story 10 (início)

```bash
# T091 e T094 não compartilham arquivo nem módulo — podem começar juntos:
Task: "Criar undo-reconciliation.use-case.ts em apps/erp/api/.../bank-reconciliation/application/use-cases/undo-reconciliation/"
Task: "Criar financial-entry-not-removable.error.ts em apps/erp/api/.../financial-entries/domain/errors/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 3: US1 (Extrato) — **não depende da Fase 2**, pode ser o primeiro incremento entregável
3. **STOP e VALIDAR**: rodar `quickstart.md` §1 isoladamente
4. Deploy/demo se pronto

### Incremental Delivery (ordem sugerida, respeitando dependências)

1. Setup → US1, US2, US4, US6, US7, US9, US10 em paralelo (nenhuma depende de Foundational) → cada uma testável e entregável isoladamente
2. Foundational (Phase 2) → US8 → US3 (única cadeia de dependência da feature)
3. Foundational (Phase 2) → US5 (independente de US8/US3, mas depende do mesmo schema)
4. Polish ao final, cobrindo as 10 stories juntas

### Parallel Team Strategy

Com múltiplos agentes/desenvolvedores:

1. Um agente cobre Foundational (Phase 2) enquanto outros cobrem US1/US2/US4/US6/US7/US9/US10 em paralelo (zero dependência do schema novo)
2. Assim que Foundational termina: um agente segue para US8 → US3 (sequencial, mesma pessoa evita retrabalho de contexto); outro agente pega US5 (paralelo a US8/US3, schema compartilhado mas arquivos de aplicação diferentes)
3. Polish ao final, com todas as stories integradas

---

## Notes

- 102 tarefas ao todo: 1 Setup + 10 Foundational + 6 (US1) + 2 (US2) + 23 (US8) + 9 (US3) + 9 (US4) + 10 (US5) + 4 (US6) + 4 (US7) + 5 (US9) + 12 (US10) + 7 (Polish).
- `[P]` = arquivos diferentes, sem dependência de tarefa incompleta.
- US3 é a única story com dependência cruzada de **outra story desta feature** (US8) — documentada tanto em `spec.md` quanto aqui. US10 depende de um módulo de outra **feature** (`006-bank-reconciliation`, já implementado), não de outra story desta.
- Toda tarefa que cria/edita arquivo em `apps/erp/api` ou `apps/erp/web` tem uma tarefa irmã de atualização do `AGENTS.md` correspondente (Constitution Princípio I) — não pular essas tarefas mesmo sob pressão de prazo.
- US9/US10 nasceram de uma Clarification feita **depois** de US1-US8 já estarem implementadas (2026-08-07) — por isso T079-T081/T084 (gates de build/lint/typecheck/test) aparecem desmarcadas de novo: precisam rodar sobre o diff completo, incluindo o código novo.
- US10 depende de fechar um gap pré-existente fora do escopo original desta spec (rota de "desfazer conciliação" que o frontend já assumia existir) — não é scope creep: sem isso, FR-006f (a metade "sem saída" do bloqueio) não é implementável.
- Nenhuma tarefa commita — Constitution exige autorização explícita do usuário antes de qualquer commit (T085 só prepara o resumo).
