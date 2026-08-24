# Tasks: Lançamentos financeiros (Contas a pagar / Contas a receber) ponta a ponta

**Input**: Design documents from `/specs/erp/001-financial-entries/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/financial-entries-api.md](./contracts/financial-entries-api.md), [quickstart.md](./quickstart.md)

**Tests**: Backend segue TDD obrigatório por convenção do projeto (`CLAUDE.md` / `api/AGENTS.md` §4.1 — todo use case novo/alterado tem `.spec.ts` com repositório in-memory, escrito **antes** da implementação). Frontend não tem infraestrutura de teste hoje e esta feature não a introduz (decisão D15 em `research.md`) — validação end-to-end é manual, via `quickstart.md`.

**Organization**: Tarefas agrupadas por user story (prioridades de `spec.md`). Nota de dependência real: o backend valida o rateio por categoria de forma incondicional sempre que o total é maior que zero (FR-011/edge case), então **qualquer** salvamento — mesmo o mais simples — precisa de um payload de `payments`/`allocations` válido. Por isso a US1 (P1) carrega o grosso da troca de mock→API real nas 4 seções do formulário (que já existe como um único componente coeso); US2/US3 são o endurecimento da UX de pagamentos/rateio já existente contra o comportamento real do backend (erros 404/422, status vindo do servidor), não a construção de UI nova do zero.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: US1–US5, mapeando para as user stories de `spec.md`
- Caminhos de arquivo sempre relativos à raiz do monorepo (`/root/aplopes-city`)

> **Nota de implementação (backend concluído)**: T009/T010 viraram tipos de valor
> (`type` + função `normalize*`) dentro de `domain/entities/financial-entry-{payment,allocation}.entity.ts`,
> não subclasses de `Entity` — mesmo padrão já usado por `CardRateTier` no
> módulo `card-contracts` (linha filha sem CRUD próprio). T011
> (`FinancialEntryAttachment`) é uma `Entity` de verdade, por ter CRUD HTTP
> próprio. T024 (soma do rateio) virou um validador de domínio
> (`domain/validators/allocations.validator.ts`), chamado explicitamente por
> `FinancialEntry.create()`/`.update()` — **não** pelo construtor/`validate()`
> compartilhado com `with()`, porque isso derrubaria a leitura de lançamentos
> legados (sem rateio) antes do backfill (T088) rodar. Ver o comentário no
> próprio `financial-entry.entity.ts` para o raciocínio completo.

---

## Phase 1: Setup

**Purpose**: Preparação mínima — feature entra num app já estruturado (brownfield), sem inicialização de projeto.

- [X] T001 [P] Registrar o script `db:backfill:financial-entries` (`tsx scripts/backfill-financial-entry-allocations.ts`) em `apps/erp/api/package.json`
- [X] T002 [P] Confirmar infraestrutura local no ar (`pnpm infra:up:postgres` e, se for testar anexos, `pnpm infra:up` para o MinIO) antes de iniciar a Phase 2 — ver `apps/erp/AGENTS.md` §5 e `infra/AGENTS.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, entidades de domínio e substrato compartilhado que **toda** user story depende.

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase terminar.

- [X] T003 Alterar `apps/erp/api/prisma/schema.prisma`: em `FinancialEntry` adicionar `feesCents Int @default(0)`, `finesCents Int @default(0)`, `note String @default("")`, `supplierId String?` (+ `@relation` `onDelete: SetNull`), promover `customerId` para `@relation` real (`onDelete: SetNull`), adicionar `enum FinancialEntryStatus { pending paid }` + coluna `status FinancialEntryStatus` + `@@index([organizationId, status])`; criar models `FinancialEntryPayment`, `FinancialEntryAllocation` (com `costCenterId` **obrigatório**), `FinancialEntryAttachment` — campos e FKs exatamente como em [data-model.md](./data-model.md)
- [X] T004 [P] Adicionar `{ systemKey: 'outras-despesas', name: 'Outras despesas', financialGroupKey: 'despesas', availableForPdv: false }` a `SEED_CHART_OF_ACCOUNTS` em `apps/erp/api/src/modules/store-setup/application/seed-data/finance.seed.ts` (decisão D7 de `research.md`)
- [X] T005 Rodar `pnpm --filter @citybox/erp-api db:migrate:dev --name add_financial_entry_payments_allocations_attachments` (depende de T003, T004) — gera e aplica a migration; **proibido** editar o `.sql` gerado à mão (`api/AGENTS.md` §5.9)
- [X] T006 Rodar `pnpm --filter @citybox/erp-api db:generate` para regenerar o client Prisma em `generated/prisma` (depende de T005)
- [X] T007 [P] Registrar `FinancialEntryPayment: 'organizationId'`, `FinancialEntryAllocation: 'organizationId'`, `FinancialEntryAttachment: 'organizationId'` em `TENANT_SCOPED_MODELS` (`apps/erp/api/src/shared/infra/prisma/tenant-scope.extension.ts`) (depende de T005)
- [X] T008 Atualizar `apps/erp/api/src/modules/finance/financial-entries/domain/entities/financial-entry.entity.ts`: novos props (`feesCents`, `finesCents`, `note`, `supplierId`, `status`, `payments[]`, `allocations[]`, `attachments[]`), getter `totalCents()` computado (`amountCents + feesCents + finesCents`, nunca persistido — D6), getter `isReadOnly()` (`saleOrderId != null` — FR-016) (depende de T006)
- [X] T009 [P] Criar `apps/erp/api/src/modules/finance/financial-entries/domain/entities/financial-entry-payment.entity.ts` (value type: `amountCents`, `paidAt`, `paymentMethod`, `cardBrand`)
- [X] T010 [P] Criar `apps/erp/api/src/modules/finance/financial-entries/domain/entities/financial-entry-allocation.entity.ts` (value type: `chartOfAccountId`, `costCenterId` obrigatório, `amountCents`, `percentage`)
- [X] T011 [P] Criar `apps/erp/api/src/modules/finance/financial-entries/domain/entities/financial-entry-attachment.entity.ts` (value type: `fileName`, `objectKey`, `contentType`, `sizeBytes`)
- [X] T012 Atualizar `apps/erp/api/src/modules/finance/financial-entries/domain/repositories/financial-entry.repository.interface.ts` para refletir `payments`/`allocations`/`attachments` no agregado e nos critérios de listagem (`status[]`, `chartOfAccountId[]`, `costCenterId[]`, `sort`) (depende de T008–T011)
- [X] T013 Atualizar `apps/erp/api/src/modules/finance/financial-entries/tests/in-memory-financial-entry.repository.ts` para suportar os novos campos/coleções e critérios de filtro, replicando a lógica que o repositório Prisma terá (depende de T012) — pré-requisito de **todos** os `.spec.ts` das fases seguintes
- [X] T014 Atualizar `apps/erp/api/src/modules/finance/financial-entries/tests/financial-entries-test-factory.ts`: `makeFinancialEntryPayment(overrides)`, `makeFinancialEntryAllocation(overrides)`, `makeFinancialEntryAttachment(overrides)`, e reexportar `makeChartOfAccount`/`makeCostCenter`/`makeCustomer`/`makeSupplier` dos módulos respectivos (depende de T013)
- [X] T015 [P] Criar `apps/erp/web/src/features/chart-of-accounts/hooks/use-chart-of-account-options-query.ts` (`useChartOfAccountOptionsQuery()`, molde exato de `useBankAccountOptionsQuery` — D13)
- [X] T016 [P] Criar `apps/erp/web/src/features/cost-centers/hooks/use-cost-center-options-query.ts` (`useCostCenterOptionsQuery()`, mesmo molde — D13)

**Checkpoint**: schema migrado, entidades de domínio prontas, repositório in-memory pronto para TDD — user stories podem começar.

---

## Phase 3: User Story 1 - Criar e editar um lançamento que realmente persiste (Priority: P1) 🎯 MVP

**Goal**: O formulário completo (Financeiro, Pagamentos, Cliente/Fornecedor, Categoria — as 4 seções já existentes na UI) passa a salvar e carregar de verdade na API, com trava de somente-leitura quando vinculado a pedido de venda e bloqueio por permissão.

**Independent Test**: Criar um lançamento com 1 pagamento e 1 linha de rateio (100%), atualizar a página, confirmar que persiste; editar e confirmar que a alteração persiste; excluir/restaurar; confirmar que `MEMBER` é bloqueado; confirmar que um lançamento com `saleOrderId` abre travado.

### Tests for User Story 1 (TDD obrigatório) ⚠️

> Escrever e rodar (RED) antes de implementar

- [X] T017 [P] [US1] `.spec.ts` de `create-financial-entry` cobrindo: sucesso com payments+allocations válidos; `AllocationMismatchError` (soma fora de ±1 centavo); lista de `allocations` vazia com total > 0; `ChartOfAccountNotFoundError`/`CostCenterNotFoundError` (FK de outra organização); `customerId`/`supplierId` preenchidos simultaneamente — em `apps/erp/api/src/modules/finance/financial-entries/application/use-cases/create-financial-entry/create-financial-entry.use-case.spec.ts`
- [X] T018 [P] [US1] `.spec.ts` de `update-financial-entry` cobrindo os mesmos casos de T017 mais `SaleOrderLinkedEntryForbiddenError` quando `saleOrderId != null` — `apps/erp/api/src/modules/finance/financial-entries/application/use-cases/update-financial-entry/update-financial-entry.use-case.spec.ts`
- [X] T019 [P] [US1] `.spec.ts` novo de `delete-financial-entry` (hoje sem spec) — `apps/erp/api/src/modules/finance/financial-entries/application/use-cases/delete-financial-entry/delete-financial-entry.use-case.spec.ts`
- [X] T020 [P] [US1] `.spec.ts` novo de `restore-financial-entry` (idempotência, permitido mesmo com `saleOrderId` preenchido) — `apps/erp/api/src/modules/finance/financial-entries/application/use-cases/restore-financial-entry/restore-financial-entry.use-case.spec.ts`
- [X] T021 [P] [US1] `.spec.ts` novo de `find-financial-entry-by-id` (inclui `readOnly` calculado) — `apps/erp/api/src/modules/finance/financial-entries/application/use-cases/find-financial-entry-by-id/find-financial-entry-by-id.use-case.spec.ts`

### Implementation for User Story 1 — Backend

- [X] T022 [P] [US1] Criar `domain/errors/allocation-mismatch.error.ts` (`DomainError` → 422)
- [X] T023 [P] [US1] Criar `domain/errors/sale-order-linked-entry-forbidden.error.ts` (sufixo `*Forbidden` → 403)
- [X] T024 [US1] Criar `application/use-cases/assert-allocations-match-total.ts` (função utilitária: soma de `allocations[].amountCents` deve fechar com `totalCents`, tolerância 1 centavo; lança `AllocationMismatchError`) (depende de T022)
- [X] T025 [P] [US1] Criar `application/use-cases/assert-chart-of-account-exists.ts` (molde de `assert-bank-account-exists.ts`)
- [X] T026 [P] [US1] Criar `application/use-cases/assert-cost-center-exists.ts` (mesmo molde)
- [X] T027 [P] [US1] Criar `application/use-cases/assert-customer-exists.ts` (mesmo molde)
- [X] T028 [P] [US1] Criar `application/use-cases/assert-supplier-exists.ts` (mesmo molde)
- [X] T029 [US1] Atualizar `application/dtos/financial-entry.dto.ts`: `feesCents`, `finesCents`, `note`, `supplierId`, `payments[]`, `allocations[]` (depende de T009, T010)
- [X] T030 [US1] Atualizar `financial-entries.module.ts`: `imports: [BankAccountsModule, ChartOfAccountsModule, CostCentersModule, CustomersModule, SuppliersModule]` (novo import de `apps/erp/api/src/modules/stock/suppliers/suppliers.module.ts` e `apps/erp/api/src/modules/customers/customers.module.ts`) (depende de T025–T028)
- [X] T031 [US1] Reescrever `application/use-cases/create-financial-entry/create-financial-entry.use-case.ts`: injeta os 5 asserts (T024–T028), monta o agregado com `payments`/`allocations`, chama `repository.save()` (faz T017 passar — GREEN)
- [X] T032 [US1] Reescrever `application/use-cases/update-financial-entry/update-financial-entry.use-case.ts`: mesma validação de `create`, mais checagem `entry.isReadOnly()` → `SaleOrderLinkedEntryForbiddenError` antes de qualquer outra validação (faz T018 passar)
- [X] T033 [P] [US1] Reescrever `application/use-cases/delete-financial-entry/delete-financial-entry.use-case.ts` sem checagem de `isReadOnly()` (exclusão continua permitida — FR-017) (faz T019 passar)
- [X] T034 [P] [US1] Reescrever `application/use-cases/restore-financial-entry/restore-financial-entry.use-case.ts` (faz T020 passar)
- [X] T035 [P] [US1] Reescrever `application/use-cases/find-financial-entry-by-id/find-financial-entry-by-id.use-case.ts` incluindo `readOnly` no retorno (faz T021 passar)
- [X] T036 [US1] Reescrever `infrastructure/database/prisma-financial-entry.repository.ts` `save()`: uma `$transaction` com `upsert` do `FinancialEntry` (incluindo `status` recalculado — D5) + `deleteMany`/`createMany` de `payments` + `deleteMany`/`createMany` de `allocations` (padrão `SaleOrderRepository`, D1) (depende de T029, T031, T032)
- [X] T037 [US1] Atualizar `infrastructure/http/routes/shared/financial-entry.dto.ts` (`FinancialEntryWritableHttpDto`): `feesCents`/`finesCents`/`note`/`supplierId` + `payments: FinancialEntryPaymentHttpDto[]` (`@ValidateNested({each:true}) @Type(...)`) + `allocations: FinancialEntryAllocationHttpDto[]` (`costCenterId` com `@IsUUID()` obrigatório) (depende de T029)
- [X] T038 [US1] Atualizar `infrastructure/http/routes/shared/financial-entry.presenter.ts`: `toHttp`/`toHttpSingle` passam a incluir `totalCents`, `status`, `note`, `supplierId`, `readOnly`, `payments[]`, `allocations[]` (depende de T036)
- [X] T039 [US1] Ajustar `infrastructure/http/routes/create-financial-entry/create-financial-entry.route.ts` e `update-financial-entry/update-financial-entry.route.ts` para o novo DTO/presenter (depende de T037, T038)

### Implementation for User Story 1 — Frontend

- [X] T040 [P] [US1] Criar `apps/erp/web/src/features/financial-entries/api/financial-entry.dto.ts` (shape do DTO real da API — espelha T037/T038)
- [X] T041 [US1] Criar `apps/erp/web/src/features/financial-entries/api/financial-entry.mapper.ts`: `reaisToCents`/`centsToReais` (molde de `card-contract.mapper.ts`), `toFinancialEntry(dto)`, `toSaveFinancialEntryPayload(values)`, `financialEntryToFormValues(entry)`, `createEmptyFinancialEntryFormValues()` (depende de T040)
- [X] T042 [US1] Reescrever `apps/erp/web/src/features/financial-entries/api/financial-entries.service.ts`: `listFinancialEntriesApi`, `createFinancialEntryApi`, `updateFinancialEntryApi`, `findFinancialEntryByIdApi`, `deleteFinancialEntryApi`, `restoreFinancialEntryApi` — todas via `comercioFetch` (depende de T041)
- [X] T043 [P] [US1] Criar `apps/erp/web/src/features/financial-entries/hooks/query-keys.ts` (`financialEntryKeys`, molde de `cardContractKeys`)
- [X] T044 [US1] Criar `apps/erp/web/src/features/financial-entries/hooks/use-financial-entry-queries.ts`: `useFinancialEntriesQuery(params)`, `useFinancialEntryQuery(id)` (`retry:false`, `enabled: ready && Boolean(id)`) (depende de T042, T043)
- [X] T045 [US1] Criar `apps/erp/web/src/features/financial-entries/hooks/use-financial-entry-mutations.ts`: `useCreateFinancialEntryMutation`, `useUpdateFinancialEntryMutation`, `useDeleteFinancialEntryMutation`, `useRestoreFinancialEntryMutation` — invalidação em bloco (`financialEntryKeys.all(scope)`), toasts de sucesso/erro (depende de T042, T043)
- [X] T046 [US1] Atualizar `apps/erp/web/src/features/financial-entries/hooks/use-financial-entry-list.ts` para usar `useFinancialEntriesQuery` em vez do mock (depende de T044)
- [X] T047 [US1] Atualizar `apps/erp/web/src/features/financial-entries/hooks/use-financial-entry-form.ts`: `isSaving` a partir da mutation, remover `deriveEntryStatus` local (status agora vem do backend — T038), manter `addPayment/addAllocation/...` já existentes (depende de T045)
- [X] T048 [P] [US1] Reescrever `apps/erp/web/src/features/financial-entries/lib/financial-entry-labels.ts`: trocar `MOCK_CHART_OF_ACCOUNTS`→`useChartOfAccountOptionsQuery` (T015), `MOCK_COST_CENTERS`→`useCostCenterOptionsQuery` (T016), `BANK_ACCOUNTS_SEED`→`useBankAccountOptionsQuery` (já real), `MOCK_CUSTOMERS`→`useActiveCustomersQuery` (já real) — mantém `MOCK_PAYMENT_METHODS`/`MOCK_CARD_BRANDS` por ora (US2/US5 fecham o resto)
- [X] T049 [US1] Atualizar `apps/erp/web/src/features/financial-entries/components/financial-entry-form/financial-entry-financial-section.tsx` e `financial-entry-party-section.tsx` para consumir os lookups reais de T048 e desabilitar todos os campos quando `readOnly` (FR-016) (depende de T048)
- [X] T050 [US1] Atualizar `apps/erp/web/src/features/financial-entries/components/financial-entry-form/financial-entry-form-view.tsx`: `handleSave` chama `useCreateFinancialEntryMutation`/`useUpdateFinancialEntryMutation` (com `await`), botão Salvar com `loading={isPending}` (fecha a violação da regra §6 do `web/AGENTS.md`), bloqueia toda a UI quando `readOnly` (depende de T045, T047, T049)
- [X] T051 [US1] Atualizar `apps/erp/web/src/features/financial-entries/pages/financial-entry-edit-page.tsx`: `useFinancialEntryQuery` em vez de `getFinancialEntryById`, loading state, fallback 404 real (depende de T044)
- [X] T052 [US1] Atualizar `apps/erp/web/src/features/financial-entries/pages/financial-entry-create-page.tsx` se necessário para o novo fluxo de mutation (depende de T045)

**Checkpoint**: US1 completa e testável de forma independente — criar/editar/excluir/restaurar um lançamento com 1 pagamento + 1 rateio (100%) funciona ponta a ponta, trava de somente-leitura e bloqueio de `MEMBER` funcionam.

---

## Phase 4: User Story 2 - Ratear um lançamento entre várias formas de pagamento (Priority: P2)

**Goal**: A seção de Pagamentos (já construída na UI, hoje contra mock) reflete o comportamento real de `status`/indicador vindo do backend (T038), com a forma de pagamento restrita ao enum fixo e bandeira do cartão sugerida a partir de contratos reais.

**Independent Test**: Salvar um lançamento com 2 linhas de pagamento (dinheiro + depósito) somando o total; editar para deixar a soma menor que o total e confirmar que salva mesmo assim com indicador "falta X"; confirmar que a listagem reflete o `status` real vindo da API.

### Implementation for User Story 2

- [X] T053 [P] [US2] Substituir `MOCK_PAYMENT_METHODS` por um enum de aplicação fixo local (`dinheiro`\|`pix`\|`debito`\|`credito`\|`boleto`\|`deposito`\|`transferencia`) em `apps/erp/web/src/features/financial-entries/lib/financial-entry-labels.ts` (D11 — sem endpoint, é constante compartilhada)
- [X] T054 [US2] Criar um hook leve de sugestão de bandeiras (`apps/erp/web/src/features/financial-entries/hooks/use-card-brand-suggestions.ts`) que lê bandeiras distintas de `CardPaymentMethod.brand` via os contratos de cartão ativos da organização (D12) — substitui `data/mock-card-brands.ts` como fonte
- [X] T055 [US2] Atualizar `apps/erp/web/src/features/financial-entries/components/financial-entry-form/financial-entry-payments-section.tsx` para consumir T053/T054 no lugar dos mocks, mantendo a UX de add/remove/editar linha já existente
- [X] T056 [US2] Atualizar `apps/erp/web/src/features/financial-entries/lib/financial-entry-form-values.ts`: remover `deriveEntryStatus` local (status agora é lido do backend via `entry.status`, não recalculado no cliente) — indicador de "falta/cobre/excedeu" continua sendo cálculo local (`sumPayments` vs `totalCents`), só o **status persistido** deixa de ser derivado no front
- [X] T057 [US2] Atualizar `apps/erp/web/src/features/financial-entries/components/financial-entry-status-badge.tsx` para ler `entry.status` da API em vez de recalcular
- [X] T058 [P] [US2] Remover `apps/erp/web/src/features/financial-entries/data/mock-card-brands.ts` (substituído por T054)

**Checkpoint**: US1 + US2 funcionam juntas — pagamentos múltiplos persistem com formas reais, status reflete o backend.

---

## Phase 5: User Story 3 - Ratear um lançamento entre categorias financeiras e centros de custo (Priority: P2)

**Goal**: A seção de Categoria & anexos (rateio) reflete corretamente os erros reais do backend (422 de soma incorreta, 404 de FK inválida) e usa os hooks de opções reais de categoria/centro de custo criados na Foundational (T015/T016).

**Independent Test**: Criar um lançamento de R$ 10.000 rateado 80%/20% entre duas categorias reais (cada uma com centro de custo real); editar o valor de uma linha e confirmar que o percentual recalcula; forçar uma soma divergente e confirmar bloqueio na tela **e** ver o 422 do backend refletido como mensagem clara (não um erro genérico).

### Implementation for User Story 3

- [X] T059 [US3] Atualizar `apps/erp/web/src/features/financial-entries/components/financial-entry-form/financial-entry-allocations-section.tsx` para consumir `useChartOfAccountOptionsQuery` (T015) e `useCostCenterOptionsQuery` (T016) no lugar de `MOCK_CHART_OF_ACCOUNTS`/`MOCK_COST_CENTERS`, mantendo a UX de add/remove/recalculo valor↔percentual já existente
- [X] T060 [US3] Tornar o campo de centro de custo **obrigatório** na UI de cada linha de rateio (bloqueia salvar sem ele — FR-010), com mensagem de validação inline
- [X] T061 [US3] Mapear o erro `AllocationMismatchError` (422) e `ChartOfAccountNotFoundError`/`CostCenterNotFoundError` (404) vindos de `ComercioApiError` para mensagens de toast específicas em `financial-entry-form-view.tsx` (em vez do `errorMessage()` genérico), reaproveitando `handleSave` de T050
- [X] T062 [P] [US3] Remover o import de `MOCK_CHART_OF_ACCOUNTS`/`MOCK_COST_CENTERS` de `financial-entry-labels.ts` (T048 já trocou os hooks; esta tarefa confirma que nenhum outro arquivo da feature ainda importa os mocks — `grep -r "MOCK_CHART_OF_ACCOUNTS\|MOCK_COST_CENTERS" apps/erp/web/src/features/financial-entries`)

**Checkpoint**: US1 + US2 + US3 — lançamento completo com rateio de pagamento e de categoria, validado ponta a ponta (tela e servidor).

---

## Phase 6: User Story 4 - Anexar comprovantes a um lançamento (Priority: P3)

**Goal**: Upload/listagem/remoção de anexos (PDF/imagem, até 5MB) funcionando via MinIO, com falha de anexo isolada do salvamento do lançamento.

**Independent Test**: Anexar um PDF de 1MB a um lançamento salvo, reabrir e ver o anexo; tentar anexar 8MB ou um `.exe` e ver rejeição clara; derrubar o MinIO e confirmar que o lançamento principal continua salvo.

### Tests for User Story 4 (TDD obrigatório) ⚠️

- [X] T063 [P] [US4] `.spec.ts` de `upload-financial-entry-attachment` cobrindo: sucesso; arquivo > 5MB rejeitado; tipo fora de PDF/imagem rejeitado (assinatura binária, não só `mimetype` declarado); lançamento inexistente na organização → 404 — `apps/erp/api/src/modules/finance/financial-entries/application/use-cases/upload-financial-entry-attachment/upload-financial-entry-attachment.use-case.spec.ts`
- [X] T064 [P] [US4] `.spec.ts` de `delete-financial-entry-attachment` (sucesso; anexo de outro lançamento/organização → 404) — `apps/erp/api/src/modules/finance/financial-entries/application/use-cases/delete-financial-entry-attachment/delete-financial-entry-attachment.use-case.spec.ts`

### Implementation for User Story 4 — Backend

- [X] T065 [P] [US4] Criar `domain/errors/invalid-attachment-file.error.ts` (`ValidatorDomainError` → 422) e `domain/errors/financial-entry-attachment-not-found.error.ts` (`*NotFound` → 404)
- [X] T066 [US4] Criar `domain/validators/attachment-file.validator.ts` (`AttachmentFileValidator`, molde de `ImageFileValidator`: assinatura binária de PDF/PNG/JPEG/WEBP + teto 5MB — D14) (depende de T065)
- [X] T067 [US4] Criar `application/use-cases/assert-financial-entry-exists.ts` (molde de `assertCardContractExists`, reaproveitado pelas 3 rotas de anexo)
- [X] T068 [US4] Criar `application/use-cases/upload-financial-entry-attachment/upload-financial-entry-attachment.use-case.ts`: injeta `FinancialEntryRepository` + `ObjectStorage` (`@Global()`, já existe) + `AttachmentFileValidator`; gera key `{organizationId}/financeiro/lancamentos/{financialEntryId}/{attachmentId}.{ext}` (faz T063 passar)
- [X] T069 [US4] Criar `application/use-cases/delete-financial-entry-attachment/delete-financial-entry-attachment.use-case.ts` (faz T064 passar)
- [X] T070 [US4] Criar `infrastructure/http/routes/financial-entry-attachment/upload-financial-entry-attachment.route.ts` (`POST :id/attachments`, `FileInterceptor('file', {limits:{fileSize: 5*1024*1024}})`, `store.finance.manage`)
- [X] T071 [P] [US4] Criar `infrastructure/http/routes/financial-entry-attachment/get-financial-entry-attachment.route.ts` (`GET :id/attachments/:attachmentId`, stream via `ObjectStorage.get`, `org.view`)
- [X] T072 [P] [US4] Criar `infrastructure/http/routes/financial-entry-attachment/delete-financial-entry-attachment.route.ts` (`DELETE :id/attachments/:attachmentId`, `HttpCode(204)`, `store.finance.manage`)
- [X] T073 [US4] Registrar as 3 rotas novas em `financial-entries.module.ts` (`controllers`) e garantir que `attachments[]` apareça no presenter de `find-financial-entry-by-id` (depende de T070–T072, T038)

### Implementation for User Story 4 — Frontend

- [X] T074 [US4] Criar `apps/erp/web/src/features/financial-entries/components/financial-entry-attachment-upload.tsx` (molde de `product-image-upload.tsx`, adaptado para múltiplos arquivos e tipos PDF+imagem — sem preview de imagem única, lista de arquivos com nome+tamanho)
- [X] T075 [US4] Adicionar `uploadFinancialEntryAttachment`/`deleteFinancialEntryAttachment`/`financialEntryAttachmentUrl` em `apps/erp/web/src/features/financial-entries/api/financial-entries.service.ts` (via `comercioUpload`/`comercioFetch`, molde de `uploadProductImage`) (depende de T042)
- [X] T076 [US4] Atualizar `use-financial-entry-form.ts`: `syncAttachments(entryId)` chamado **depois** do save principal (mesmo padrão de `syncImage` em products — falha de anexo não desfaz o save), toast de erro isolado (depende de T047, T075)
- [X] T077 [US4] Substituir a seção de anexos "decorativa" dentro de `financial-entry-allocations-section.tsx` (hoje só guarda `fileName` local) pelo componente T074, extraindo para um bloco próprio dentro da seção "Categoria & anexos" (depende de T074, T076)

**Checkpoint**: US1–US4 — anexos reais funcionando, isolados de falha do salvamento principal.

---

## Phase 7: User Story 5 - Encontrar lançamentos com filtros ricos (Priority: P2)

**Goal**: Filtros server-side completos (operação, status, categoria, centro de custo, período, busca, ordenação) e remoção de todo `MOCK_*` remanescente da feature.

**Independent Test**: Filtrar por categoria + status simultaneamente e confirmar interseção correta via Network (query string, não `.filter()` client-side); confirmar que nenhum `Select`/`Autocomplete` da feature mostra dado de exemplo.

### Tests for User Story 5 (TDD obrigatório) ⚠️

- [X] T078 [P] [US5] `.spec.ts` de `list-financial-entries` cobrindo os filtros novos: `status[]`, `chartOfAccountId[]` (via join em `allocations`), `costCenterId[]`, `sort` (5 variantes), rename `dueFrom`/`dueTo` — `apps/erp/api/src/modules/finance/financial-entries/application/use-cases/list-financial-entries/list-financial-entries.use-case.spec.ts`

### Implementation for User Story 5 — Backend

- [X] T079 [US5] Atualizar `application/use-cases/list-financial-entries/list-financial-entries.use-case.ts` para os novos filtros/`sort` (faz T078 passar)
- [X] T080 [US5] Atualizar `infrastructure/http/routes/list-financial-entries/list-financial-entries.dto.ts` (`ListFinancialEntriesQueryDto`): `status?`, `chartOfAccountId?`, `costCenterId?` (arrays via `@IsArray @IsUUID(4,{each:true})`), `sort?`, renomear `dateFrom`/`dateTo` → `dueFrom`/`dueTo` (depende de T079)
- [X] T081 [US5] Atualizar `infrastructure/database/prisma-financial-entry.repository.ts` `buildWhere`: `status IN (...)`, `allocations.some({ chartOfAccountId: {in:...} })`, `allocations.some({ costCenterId: {in:...} })`, `orderBy` dinâmico por `sort` (depende de T036, T080)
- [X] T082 [US5] Atualizar `financial-entry.presenter.ts` `toHttpList`: incluir `categoryLabel` (nome da primeira `allocation`, ou `"Múltiplas categorias"` — ver `contracts/financial-entries-api.md`) no item de listagem (depende de T081)

### Implementation for User Story 5 — Frontend

- [X] T083 [US5] Atualizar `apps/erp/web/src/features/financial-entries/components/financial-entry-filters-drawer.tsx`: filtros de categoria/centro de custo/status usando os hooks reais (T015, T016, `useActiveSuppliersQuery` já real), renomear params `dateFrom`/`dateTo` → `dueFrom`/`dueTo`
- [X] T084 [US5] Atualizar `apps/erp/web/src/features/financial-entries/lib/financial-entry-filters.ts` para o novo shape de query params (depende de T083)
- [X] T085 [US5] Atualizar `use-financial-entry-list.ts` para repassar os novos filtros/`sort` na query (depende de T044, T084)
- [X] T086 [P] [US5] Atualizar `apps/erp/web/src/features/financial-entries/components/financial-entry-list-table.tsx` para exibir `categoryLabel` e `status` reais (não mais derivados no cliente)
- [X] T087 [US5] `grep -r "MOCK_" apps/erp/web/src/features/financial-entries` — remover qualquer resíduo restante fora de `services/financial-entry.service.ts`/`data/mock-financial-entries.ts` (removidos na Polish) — critério técnico de aceite da spec

**Checkpoint**: Todas as 5 user stories funcionam de ponta a ponta, independentemente testáveis (com a ressalva de dependência real documentada no topo do arquivo).

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Migração de dados legados, remoção final de mocks, documentação obrigatória, gate de qualidade.

- [X] T088 Implementar `apps/erp/api/scripts/backfill-financial-entry-allocations.ts` (D7/D9/D10 de `research.md`): para cada organização, `upsert` por `systemKey` das contas `outras-receitas`/`outras-despesas` e do centro `administrativo` (idempotente); para cada `FinancialEntry` sem `allocations[]`, criar 1 `FinancialEntryAllocation` de 100% casando `categoryName` (trim + case-insensitive) com `ChartOfAccount.name` da mesma organização, caindo no fallback por tipo de operação quando não casar; logar contagem de fallback por organização (depende de T001, T005)
- [X] T089 Alterar `apps/erp/api/src/modules/sales/infrastructure/database/prisma-sale-order.repository.ts` `maybeCreateReceivable`: após `tx.financialEntry.create`, criar `tx.financialEntryAllocation.create` com `chartOfAccountId` = conta `vendas-mercadorias` (lookup por `systemKey`) e `costCenterId` = centro `comercial` (lookup por `systemKey`), `amountCents = totalCents`, `percentage = 100` (FR-025/D8) — **não alterar mais nada** nesse método (RN-19 não pode quebrar)
- [X] T090 [P] Rodar `pnpm --filter @citybox/erp-api exec tsx scripts/backfill-financial-entry-allocations.ts` contra o banco de dev e conferir a query de verificação do `quickstart.md` (0 lançamentos sem `allocations` ao final) (depende de T088)
- [X] T091 Remover `apps/erp/web/src/features/financial-entries/services/financial-entry.service.ts` (depende de T042, T050, T051, T052 já migrados para a API real)
- [X] T092 Remover `apps/erp/web/src/features/financial-entries/data/mock-financial-entries.ts` (depende de T091)
- [X] T093 [P] Atualizar `apps/erp/web/src/features/financial-entries/components/transfer-dialog.tsx`: centro de custo passa a vir de `useCostCenterOptionsQuery` (T016) real — persistência da transferência em si continua fora de escopo (spec `## Fora de Escopo desta Fase`)
- [X] T094 [P] Atualizar `apps/erp/web/src/features/financial-entries/GUIA.md` (linguagem de negócio, sem termos técnicos) descrevendo o fluxo completo: operação, taxa/multa, rateio de pagamento, rateio de categoria, anexos, trava por venda
- [X] T095 [P] Atualizar `apps/erp/api/AGENTS.md` §9: remover a dívida "`FinancialEntry.categoryName` continua string solta"; documentar `FinancialEntryPayment`/`Allocation`/`Attachment`, a migration nova e o script de backfill
- [X] T096 [P] Atualizar `apps/erp/web/AGENTS.md` §4.5/§9/§12: corrigir a linha "Lançamentos 🟢 MUI+API" (hoje enganosa) para refletir o estado real pós-feature; registrar em §12 (histórico)
- [X] T097 Rodar o gate completo: `pnpm --filter @citybox/erp-api build && pnpm --filter @citybox/erp-api lint && pnpm --filter @citybox/erp-api typecheck && pnpm --filter @citybox/erp-api test` e `pnpm --filter @citybox/erp-web typecheck && pnpm --filter @citybox/erp-web lint`
- [ ] T098 Executar o roteiro completo de `quickstart.md` (todas as User Stories + regressão de venda + migração de dados) manualmente

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depende de Setup — **bloqueia todas as user stories**
- **US1 (Phase 3)**: depende só de Foundational — é o MVP
- **US2 (Phase 4)**: depende de Foundational **e** de US1 (usa `entry.status`/mutations criados em T038/T045) — não é 100% independente de US1 por causa da dependência real explicada no topo do arquivo
- **US3 (Phase 5)**: idem — depende de Foundational e US1 (usa `handleSave`/T050, hooks T015/T016 já consumidos parcialmente em T048)
- **US4 (Phase 6)**: depende só de Foundational — subsistema de anexos é genuinamente independente de US1/US2/US3 (rota própria, fora do payload principal)
- **US5 (Phase 7)**: depende só de Foundational para o backend (T079–T082 tocam só `list-financial-entries`, não `create`/`update`); o frontend (T083–T087) depende de US1 (T048, T050) já ter trocado os lookups principais
- **Polish (Phase 8)**: depende de todas as user stories desejadas estarem completas

### Parallel Opportunities

- Dentro da Foundational: T004/T007/T009/T010/T011/T015/T016 são `[P]` entre si
- Dentro da US1: os 5 `.spec.ts` (T017–T021) são `[P]`; os 4 `assert-*-exists` (T025–T028) são `[P]`; T022/T023 são `[P]`
- US4 pode ser desenvolvida em paralelo com US2/US3 por um segundo desenvolvedor (mesma dependência só de Foundational)
- Dentro da Polish: T090/T093/T094/T095/T096 são `[P]` entre si

---

## Parallel Example: Foundational

```bash
Task: "Adicionar systemKey 'outras-despesas' em finance.seed.ts"                          # T004
Task: "Criar financial-entry-payment.entity.ts"                                            # T009
Task: "Criar financial-entry-allocation.entity.ts"                                         # T010
Task: "Criar financial-entry-attachment.entity.ts"                                         # T011
Task: "Criar use-chart-of-account-options-query.ts"                                        # T015
Task: "Criar use-cost-center-options-query.ts"                                             # T016
```

## Parallel Example: User Story 1 (specs)

```bash
Task: "spec de create-financial-entry"     # T017
Task: "spec de update-financial-entry"     # T018
Task: "spec de delete-financial-entry"     # T019
Task: "spec de restore-financial-entry"    # T020
Task: "spec de find-financial-entry-by-id" # T021
```

---

## Implementation Strategy

### MVP First (User Story 1 apenas)

1. Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1)
2. **PARAR e VALIDAR**: rodar os cenários de US1 do `quickstart.md` — criar/editar/excluir/restaurar persistindo de verdade, trava por venda, bloqueio de `MEMBER`
3. Isso já resolve o defeito mais grave descrito na spec (formulário grava em mock)

### Entrega incremental

1. Setup + Foundational → base pronta
2. US1 → MVP: persistência real (fecha os critérios de aceite mais críticos)
3. US2 → pagamentos múltiplos com status real do backend
4. US3 → rateio de categoria validado ponta a ponta (alimenta a DRE)
5. US4 → anexos (pode ser feito em paralelo com US2/US3 por outro desenvolvedor)
6. US5 → filtros ricos + zero mock remanescente
7. Polish → backfill de dados legados, documentação, gate final

### Nota sobre o "maior prompt do módulo"

Se a equipe preferir fatiar em entregas menores (como o material de origem sugere: "1) CRUD real
sem rateios; 2) rateios; 3) anexos"), os checkpoints já mapeiam para isso: **Foundational + US1**
= entrega 1 (mas já inclui rateio mínimo, pela dependência real do backend); **US2 + US3** =
entrega 2; **US4** = entrega 3; **US5 + Polish** = entrega 4 (fecha os critérios técnicos de
aceite — zero mock, migration de dados, documentação).

---

## Notes

- `[P]` = arquivos diferentes, sem dependência entre si
- `[Story]` mapeia a tarefa à user story correspondente para rastreabilidade
- TDD obrigatório no backend: specs de T017–T021, T063–T064, T078 escritos e **falhando** antes
  da implementação correspondente
- Commitar após cada tarefa ou grupo lógico coeso
- Parar em qualquer checkpoint para validar a story isoladamente antes de seguir
- Evitar: tarefas vagas, conflito de mesmo arquivo em paralelo, dependência cruzada entre
  stories que quebre a entrega incremental além do que já está documentado acima
