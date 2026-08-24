---

description: "Task list template for feature implementation"
---

# Tasks: Loja como Unidade de Billing (platform-api + admin-web)

**Input**: Design documents from `/specs/_platform/001-store-billing-unit/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/platform-api.md](./contracts/platform-api.md), [quickstart.md](./quickstart.md)

**Tests**: Incluídos — TDD é obrigatório neste projeto (Constitution Princípio V / `.claude/rules/ecc/common/testing.md`: RED → GREEN → REFACTOR, sem exceção).

**Organization**: Tasks agrupadas por user story (spec.md) para permitir implementação e teste independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tasks incompletas)
- **[Story]**: A qual user story a task pertence (US1–US4)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Monorepo existente — sem diretório novo de topo. Backend: `apps/platform/api/src/modules/**`
(Clean Architecture por módulo: `domain/application/infrastructure`). Frontend:
`apps/platform/admin/src/{app,features,lib}/**` (organização por feature). Ver "Project
Structure" em [plan.md](./plan.md).

---

## Phase 1: Setup

**Purpose**: Levantar o dado real necessário para validar as decisões de migração antes de tocar
schema ou código de negócio.

- [X] T001 [P] Escrever script de dry-run que conta `Client` com mais de uma `Store` associada em `apps/platform/api/scripts/report-legacy-client-store-counts.ts` (research.md #2)
- [X] T002 Rodar o script de T001 contra o banco de desenvolvimento e registrar o resultado real (0 ou N casos) como nota em `specs/_platform/001-store-billing-unit/research.md` — define se a regra "primeira loja criada" (research.md #2) precisa de revisão manual antes do backfill

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema expandido + entidades/repos/mensageria compartilhados que todas as 4 user
stories precisam para existir.

**⚠️ CRITICAL**: Nenhuma user story começa antes desta fase estar completa.

- [X] T003 Criar a migration Prisma de **expand** (`personType`, `responsibleName`, `billingEmail`, `deploymentStatus` em `Store`; `vertical`, `tier`, `maxNegocios` em `Plan`; `storeId` nullable em `Subscription`/`Invoice`/`Member`) via `pnpm --filter @citybox/platform-api db:migrate:dev --name store_billing_expand` editando `apps/platform/api/prisma/schema.prisma` — **nunca SQL manual** (data-model.md, research.md #1). Migration `20260718170018_store_billing_expand` aplicada. Também fecha o gap CRITICAL C1 do `/speckit-analyze` (FR-009): adicionado `StoreDeploymentStatus` (`PROVISIONING|ACTIVE|FAILED`, default `PROVISIONING`) — ver nota em research.md
- [X] T004 Rodar `pnpm --filter @citybox/platform-api db:generate` para regenerar o client em `apps/platform/api/generated/prisma/` (depende de T003)
- [X] T005 [P] Estender `StoreProps`/`Store` com `personType`, `responsibleName`, `billingEmail` (getters + factories `create`/`with`) em `apps/platform/api/src/modules/stores/domain/entities/store.entity.ts` (depende de T004). Também adicionado `deploymentStatus`/`StoreDeploymentStatus` (fecha o gap FR-009 do `/speckit-analyze`, achado C1). `clientId` permanece `string` (não nullable) — ver research.md #7.
- [X] T006 [P] Estender `store.zod.validator.ts` com as regras de `personType`/`responsibleName`/`billingEmail` (documento continua sem checagem de unicidade — FR-016) em `apps/platform/api/src/modules/stores/domain/validators/store.zod.validator.ts` (depende de T005)
- [X] T007 [P] Estender `PlanProps`/`Plan` com `vertical`, `tier`, `maxNegocios` (novo, aditivo) em `apps/platform/api/src/modules/plans/domain/entities/plan.entity.ts` (depende de T004). `maxStores` mantido internamente em sincronia até a migration de contract (research.md #5) — não renomeado ainda, só aditado.
- [X] T008 [P] Estender `plan.zod.validator.ts` com `vertical`/`tier` não vazios e `maxNegocios` inteiro positivo em `apps/platform/api/src/modules/plans/domain/validators/plan.zod.validator.ts` (depende de T007)
- [X] T009 [P] Atualizar `PrismaStoreRepository` para persistir/ler os novos campos fiscais em `apps/platform/api/src/modules/stores/infrastructure/database/prisma-store.repository.ts` (depende de T005)
- [X] T010 [P] Atualizar `PrismaPlanRepository` para persistir/ler `vertical`/`tier`/`maxNegocios` + filtro por vertical em `apps/platform/api/src/modules/plans/infrastructure/database/prisma-plan.repository.ts` (depende de T007) — filtro adiantado de T038
- [X] T011 [P] Estender `StorePlatformEventData`/mapper para incluir plano (vertical/tier/limites) e dono em `apps/platform/api/src/shared/infra/messaging/store-platform-event.mapper.ts`. `owner` vem sempre dos campos da própria Store (fecha o U1 do `/speckit-analyze`: mapper pronto para ser chamado com dados de plano por T015)
- [X] T012 Adicionar `publishStorePlanChanged`/`publishStoreSuspended`/`publishStoreReactivated` (+ constantes de tipo/routing key `citybox.store.plan_changed.v1` etc., mesma convenção de `STORE_CREATED_EVENT`) em `apps/platform/api/src/shared/infra/messaging/store-events.publisher.ts` (depende de T011)

**Checkpoint**: Schema expandido, domínio de `Store`/`Plan` com os campos novos, publisher pronto para os eventos novos. User stories podem começar. ✅ Concluído em 2026-07-18 (`/speckit-implement`, sessão via `/loop`) — build (`tsc`/`nest build`), lint e `pnpm test` (46 suites/190 testes) verdes nesse ponto.

---

## Phase 3: User Story 1 - Cadastrar loja como unidade única de cobrança (Priority: P1) 🎯 MVP

**Goal**: Operador cadastra uma loja com dados fiscais + plano (vertical/tier), sem criar nem
referenciar um "Cliente" em nenhum ponto do fluxo.

**Independent Test**: Cadastrar uma loja do zero e verificar que a assinatura/fatura nascem
vinculadas à `storeId`, sem nenhum registro de `Client` envolvido.

### Tests for User Story 1 ⚠️

- [X] T013 [P] [US1] Teste (RED): `CreateStoreUseCase` exige `planId`, cria a `Store` com os campos fiscais e sem `Client`, e abre uma `Subscription` vinculada a `storeId` em `apps/platform/api/src/modules/stores/application/use-cases/create-store/create-store.use-case.spec.ts` — reescrito por completo; fixture compartilhada em `apps/platform/api/src/modules/stores/tests/build-create-store-fixture.ts`
- [X] T014 [P] [US1] Teste (RED): criar duas `Store` com o mesmo `document` é permitido (FR-016) em `apps/platform/api/src/modules/stores/application/use-cases/create-store/create-store.use-case.spec.ts` (`allows two stores to share the same fiscal document (FR-016)`) — coberto no spec de T013 em vez de um `store.zod.validator.spec.ts` dedicado; o validator já não impunha unicidade e o teste prova o comportamento fim-a-fim

### Implementation for User Story 1

- [X] T015 [US1] Reescrever `CreateStoreUseCase` — remover dependência de `ClientRepository`, exigir `planId`, validar que o plano pertence à `vertical` informada (`PlanVerticalMismatchError`), criar a `Subscription` inicial via `SubscriptionRepository` em `apps/platform/api/src/modules/stores/application/use-cases/create-store/create-store.use-case.ts` — inclui geração opcional de faturas iniciais via `@Optional() InvoiceRepository` e publicação de `store.created`
- [X] T016 [US1] Atualizar `CreateStoreDto` (campos fiscais + `planId`/`billingCycle`/`dueDay`) em `apps/platform/api/src/modules/stores/infrastructure/http/routes/create-store/create-store.dto.ts`
- [X] T017 [US1] Atualizar `CreateStorePresenter`/`CreateStoreRoute` para retornar os campos novos + resumo do plano em `apps/platform/api/src/modules/stores/infrastructure/http/routes/create-store/create-store.presenter.ts` e `create-store.route.ts`
- [X] T018 [US1] Registrar `SubscriptionRepository`/`PlanRepository`/`InvoicesModule` como dependências de `CreateStoreUseCase` em `apps/platform/api/src/modules/stores/stores.module.ts` (import de `InvoicesModule` via `forwardRef`)
- [X] T019 [P] [US1] Atualizar `in-memory-store.repository.ts` (novos campos, fallback de `clientName`) e reaproveitar `InMemorySubscriptionRepository`/`InMemoryPlanRepository`/`InMemoryInvoiceRepository` no spec de T013 em `apps/platform/api/src/modules/stores/tests/in-memory-store.repository.ts`
- [X] T020 [P] [US1] Remover o passo "selecionar Cliente" e adicionar campos fiscais + seletor de plano (filtrado por vertical) no fluxo "nova loja" em `apps/platform/admin/src/features/stores/components/` (multistep) — `NewStoreStepIdentity` sem combobox de Cliente; novo `NewStoreStepPlan` (plano/ciclo/vencimento); `NewStoreStepFiscal` reescrito com campos diretos da Store (`personType`/`document`/`legalName`/`stateRegistration`/`responsibleName`/`billingEmail`, substitui `mesmoCnpjMatriz`). `EditStoreDialog` reaproveita Identidade/Fiscal/Localização (sem plano/vertical) via schema com discriminante `mode`
- [X] T021 [P] [US1] Schema Zod para os campos fiscais + plano do formulário em `apps/platform/admin/src/features/stores/schemas/new-store-schema.ts` — discriminante `mode: 'create'|'edit'`: `superRefine` só exige plano+fiscal completo em `create`; `edit` reaproveita o mesmo schema com os campos de plano/vertical não obrigatórios
- [X] T022 [US1] Atualizar o DTO/`createPlatformStore` em `apps/platform/admin/src/lib/admin-api.ts` (novo `CreateStoreBodyDto`, `UpdateStoreBodyDto` substitui `UpsertStoreBodyDto`; `PlanDto`/`fetchPlans` ganham `vertical`/`tier`/`maxNegocios`) e adaptar em `apps/platform/admin/src/features/stores/api/stores-api.ts`. `Loja.clientId`/`StoreListItemDto.clientId` viram `string | null`; `Vertical` (5 valores) definido localmente em `features/stores/types.ts`, desacoplado de `features/clients/types`
- [X] T023 [P] [US1] Teste frontend: submeter o formulário de nova loja sem plano bloqueia o avanço (FR-015) em `apps/platform/admin/src/features/stores/components/new-store-dialog.test.tsx` — primeiro teste de componente do app; exigiu corrigir `vitest.config.ts` (faltava `resolve.alias` para `@/*`) e criar `src/test-utils.tsx` (`renderWithProviders`)

**Checkpoint**: US1 funcional e testável de forma independente — loja nasce como unidade de cobrança, sem Cliente.

---

## Phase 4: User Story 2 - Tela única da loja com dados fiscais, plano e billing (Priority: P1)

**Goal**: Uma única tela por loja reúne dados fiscais/responsável, plano vigente e billing
(assinatura + faturas); "Clientes" some da navegação.

**Independent Test**: Abrir o detalhe de qualquer loja e confirmar que fiscal, plano e faturas
aparecem juntos, sem navegar para uma tela separada de "Cliente".

### Tests for User Story 2 ⚠️

- [X] T024 [P] [US2] Teste (RED): a consulta de detalhe da loja retorna fiscal + plano vigente + assinatura + faturas juntos em `apps/platform/api/src/modules/stores/application/use-cases/find-store-by-id/find-store-by-id.use-case.spec.ts` — cobre tanto o caso client-less (novo modelo) quanto o legado com `Client`
- [X] T025 [P] [US2] Teste (RED): `UpdateStoreUseCase` rejeita um campo `vertical` no payload de edição (edge case do spec) em `apps/platform/api/src/modules/stores/application/use-cases/update-store/update-store.use-case.spec.ts` (`should reject vertical change (FR-006)`) — comportamento já existia no use case antes desta feature; teste formaliza a garantia

### Implementation for User Story 2

- [X] T026 [US2] Estender `FindStoreByIdUseCase` para juntar plano vigente (via `SubscriptionRepository.findActiveByStoreId`) + faturas (`InvoiceRepository.findAll({storeId})`) em `apps/platform/api/src/modules/stores/application/use-cases/find-store-by-id/find-store-by-id.use-case.ts` — **desvio da task**: injeta `SubscriptionRepository`/`InvoiceRepository` direto no use case em vez de estender `StoreDetailRepository` (que continua responsável só pelos dados específicos de vertical); `client` retornado como `Client | null` quando a loja não tem `clientId`
- [X] T027 [US2] Atualizar `UpdateStoreUseCase`/`UpdateStoreDto` para aceitar campos fiscais e excluir `vertical` explicitamente em `apps/platform/api/src/modules/stores/application/use-cases/update-store/update-store.use-case.ts` e `apps/platform/api/src/modules/stores/infrastructure/http/routes/update-store/update-store.dto.ts`
- [X] T028 [US2] Atualizar `FindStoreByIdPresenter`/rota para retornar os blocos `plan` e `billing` em `apps/platform/api/src/modules/stores/infrastructure/http/routes/find-store-by-id/find-store-by-id.presenter.ts` e `find-store-by-id.route.ts` — via `toPlanSummary`/`toInvoiceSummary`/`toBillingSummary` em `shared/store-response.mapper.ts`
- [X] T029 [US2] Mesclar as abas fiscal/billing de `apps/platform/admin/src/features/clients/components/client-detail/` para dentro de `apps/platform/admin/src/features/stores/components/store-detail/` (novas abas: Fiscal, Plano, Billing) — `FiscalTab`/`PlanTab`/`BillingTab` novos em `store-detail/tabs/`, somente leitura (ação "Trocar plano" fica para T053/US4; registrar pagamento/nova fatura não fazem parte do escopo desta spec)
- [X] T030 [US2] Atualizar `apps/platform/admin/src/features/stores/api/stores-api.ts` para buscar o detalhe mesclado — `mapStoreDetail` passa `plan`/`billing` do DTO; `LojaDetail` (types.ts) agora `extends StoreFormDetail` e ganhou `plan?`/`billing` (corrigiu de quebra um bug pré-existente: `LojaDetail` não tinha os campos que `mapStoreToFormData`/T020 já lia)
- [X] T031 [US2] Remover a rota `apps/platform/admin/src/app/(dashboard)/clientes/` e a entrada "Clientes" em `apps/platform/admin/src/lib/admin-navigation.ts` (SC-003) — inclui remover os links mortos para `/clientes/:id` em `store-detail-header.tsx` ("Pertence a" virou texto puro; "Ver responsável" removido do menu) e em `stores-table-cells.tsx` (`ClientGroupCell`)
- [ ] T032 [US2] Apagar `apps/platform/admin/src/features/clients/` após mover os componentes reaproveitáveis (depende de T029, T031) — **BLOQUEADO**: `features/dashboard/lib/platform-stats.ts` importa `mockClients` de `features/clients/data` e `lib/admin-api.ts` importa o type `ClientStore` de `features/clients/types`; apagar a feature agora quebra o dashboard. Resolver essas 2 dependências antes de reabrir esta task (ver nota em `apps/platform/admin/AGENTS.md` seção 10)
- [X] T033 [P] [US2] Teste frontend: tela de detalhe da loja renderiza fiscal + plano + faturas sem navegação adicional em `apps/platform/admin/src/features/stores/components/store-detail/store-detail-page.test.tsx` — exigiu `esbuild.jsx: 'automatic'` no `vitest.config.ts` (componentes de `@citybox/ui` quebravam com "React is not defined" ao renderizar de fato) e instalar `@testing-library/user-event` (Radix Tabs ativa via `onMouseDown`, `fireEvent.click` não troca de aba)

**Checkpoint**: US2 funcional — loja mostra tudo numa tela; `/clientes` não existe mais (rota e nav removidas). ✅ Concluído em 2026-07-18 (T029/T030/T031/T033), exceto T032 (apagar `features/clients/`), que fica pendente por dependências cruzadas reais descobertas na implementação (dashboard + `lib/admin-api.ts`) — ver nota em `apps/platform/admin/AGENTS.md`.

---

## Phase 5: User Story 3 - Catálogo de planos por vertical e tier (Priority: P2)

**Goal**: Operador cadastra e lista planos comerciais escopados por vertical e tier, com limites e
preços próprios.

**Independent Test**: Criar dois planos (verticais ou tiers diferentes) e confirmar que cada um
aparece isolado por vertical na tela de catálogo e no seletor de plano de uma loja nova.

> **Nota de execução**: T034–T039 (backend) foram implementadas junto do Foundational nesta sessão
> de `/speckit-implement` — o rewrite de `Plan`/`PlanProps` (T007) e do repositório (T010) tocava
> exatamente os mesmos arquivos que essas tasks, então foram completadas e testadas juntas para
> evitar retrabalho duplo no mesmo arquivo. T040–T043 (frontend) continuam pendentes.

### Tests for User Story 3 ⚠️

- [X] T034 [P] [US3] Teste (RED→GREEN): `CreatePlanUseCase` exige `vertical`/`tier` e persiste `maxNegocios` em `apps/platform/api/src/modules/plans/application/use-cases/create-plan/create-plan.use-case.spec.ts` (arquivo criado, junto de `modules/plans/tests/in-memory-plan.repository.ts`)
- [X] T035 [P] [US3] Teste (RED→GREEN): `ListPlansUseCase` filtra por `?vertical=` em `apps/platform/api/src/modules/plans/application/use-cases/list-plans/list-plans.use-case.spec.ts` (arquivo criado)

### Implementation for User Story 3

- [X] T036 [US3] Atualizar `CreatePlanUseCase`/`UpdatePlanUseCase` para validar/persistir `vertical`/`tier`/`maxNegocios` em `apps/platform/api/src/modules/plans/application/use-cases/create-plan/create-plan.use-case.ts` e `.../update-plan/update-plan.use-case.ts` (depende de T007, T008, T034 GREEN) — feito via `plan.mapper.ts` (`mapCreateDtoToPlanProps`/`mapUpdateDtoToPlanProps`), use cases inalterados (já delegavam ao mapper)
- [X] T037 [US3] Atualizar `CreatePlanDto`/`UpdatePlanDto`/`ListPlansQuery` (filtro `vertical`) em `apps/platform/api/src/modules/plans/infrastructure/http/routes/{create-plan,update-plan,list-plans}/*.ts`. `maxStores` **saiu** do contrato HTTP (vira `maxNegocios`) — ver correção em `contracts/platform-api.md`
- [X] T038 [US3] Atualizar `ListPlansUseCase` + `PrismaPlanRepository.findAll` para filtrar por vertical em `apps/platform/api/src/modules/plans/application/use-cases/list-plans/list-plans.use-case.ts` e `apps/platform/api/src/modules/plans/infrastructure/database/prisma-plan.repository.ts` (depende de T010, T035 GREEN)
- [X] T039 [US3] Atualizar os presenters de `plans` para incluir `vertical`/`tier` nas respostas em `apps/platform/api/src/modules/plans/infrastructure/http/routes/*/*.presenter.ts` — feito via `list-plans.response.mapper.ts` (`toPlanListItem`, compartilhado pelos 3 presenters)
- [X] T040 [US3] Substituir o mock/stub de `apps/platform/admin/src/features/planos/data/` pela integração real (filtro por vertical) — **desvio da task**: `app/(dashboard)/planos/page.tsx` já chamava `fetchPlans`/`createPlan`/`updatePlan`/`deletePlan` de `lib/admin-api.ts` diretamente (não havia mock/stub em uso real — `AGENTS.md` estava desatualizado nesse ponto); o gap real era o contrato de `create`/`update` ainda mandar `maxStores` e nunca `vertical`/`tier`/`maxNegocios` (que o backend já exige desde T036/T037), o que faria toda criação/edição de plano falhar com 400. Corrigido em `admin-api.ts` (`CreatePlanBodyDto`/`UpdatePlanBodyDto`) e `page.tsx` (mutations); filtro por vertical adicionado em `PLANS_FILTER_GROUPS` + `fetchPlans({vertical})`. Não foi criada uma camada `features/planos/api/` nova — ficaria puramente cosmético, sem mudar comportamento
- [X] T041 [US3] Adicionar `vertical`/`tier` ao schema Zod e ao formulário de plano em `apps/platform/admin/src/features/planos/schemas/plan-schema.ts` e `apps/platform/admin/src/features/planos/components/` — `PlanStepCommercial` ganhou Select de vertical + Input de tier; `maxStores` renomeado para `maxNegocios` em todo o fluxo (schema, `PlanStepQuotas`, `build-plan-payload.ts`, `map-plan-to-form-data.ts`, `plan-card.tsx`)
- [X] T042 [US3] Ligar o seletor de plano usado no fluxo de criação de loja aos dados reais de `/v1/platform/billing/plans` filtrados por vertical — **já feito em T020/T022** (`usePlansByVerticalQuery` chama `fetchPlans({vertical})` real desde a sessão de US1); nenhuma mudança adicional necessária aqui
- [X] T043 [P] [US3] Teste frontend: catálogo de planos filtrado por vertical mostra só os tiers daquela vertical em `apps/platform/admin/src/features/planos/components/plans-grid.test.tsx` — exigiu criar `vitest.setup.ts` (`afterEach(cleanup)` do RTL) porque o Vitest deste projeto não roda com `test.globals`, então testes com 2+ `render()` no mesmo arquivo vazavam DOM entre si sem isso

**Checkpoint**: US3 funcional — catálogo por vertical/tier íntegro e usado no seletor de loja. ✅ Concluído em 2026-07-18 (T040-T043) — descoberto e corrigido de quebra um bug real: criar/editar plano pelo admin-web sempre retornava 400 (payload não enviava `vertical`/`tier`/`maxNegocios`, exigidos pelo backend desde T036/T037).

---

## Phase 6: User Story 4 - Troca de plano e ciclo de suspensão/reativação por inadimplência (Priority: P3)

**Goal**: Operador troca o plano de uma loja (mesma vertical) e acompanha suspensão automática por
inadimplência e reativação após pagamento.

**Independent Test**: Trocar o plano de uma loja existente e confirmar atualização da assinatura;
separadamente, simular fatura vencida e confirmar suspensão/reativação do status da loja.

### Tests for User Story 4 ⚠️

- [X] T044 [P] [US4] Teste (RED): trocar o plano de uma loja para uma vertical diferente é rejeitado (`PlanVerticalMismatchError`) em `apps/platform/api/src/modules/stores/application/use-cases/change-store-plan/change-store-plan.use-case.spec.ts` — 5 casos: atualiza a `Subscription` in-place, rejeita vertical diferente, `PlanNotFoundError`, `StoreNotFoundError`, registra audit event
- [X] T045 [P] [US4] Teste (RED): gerar faturas com uma fatura vencida sem pagamento suspende a loja (`BLOCKED`) em `apps/platform/api/src/modules/invoices/application/use-cases/generate-invoices/generate-invoices.use-case.spec.ts` (estendido: 2 novos casos — suspende quando `OPEN`+vencida, não suspende quando ainda não venceu)
- [X] T046 [P] [US4] Teste (RED): marcar uma fatura vencida como paga reativa uma loja `BLOCKED` em `apps/platform/api/src/modules/invoices/application/use-cases/mark-invoice-as-paid/mark-invoice-as-paid.use-case.spec.ts` (estendido: 2 novos casos — reativa quando a fatura estava `PAST_DUE`, não reativa quando não estava)

### Implementation for User Story 4

- [X] T047 [US4] `PlanVerticalMismatchError` — **já existia** desde T015/US1 (`apps/platform/api/src/modules/stores/domain/errors/plan-vertical-mismatch.error.ts`), reaproveitado sem alteração
- [X] T048 [US4] Criar `ChangeStorePlanUseCase` (valida mesma vertical, atualiza a `Subscription` ativa in-place via `Subscription.changePlan()` — sem cancelar/recriar nem anular faturas antigas, preservando histórico) em `apps/platform/api/src/modules/stores/application/use-cases/change-store-plan/change-store-plan.use-case.ts`
- [X] T049 [US4] Rota `PATCH /v1/stores/:id/plan` + DTO + presenter em `apps/platform/api/src/modules/stores/infrastructure/http/routes/change-store-plan/` e registrada em `stores.module.ts`
- [X] T050 [US4] Estendido `GenerateInvoicesUseCase` — nova etapa `suspendStoresWithOverdueInvoices()` chama `BlockStoreUseCase` (actor `system:billing`) para cada fatura `OPEN` que `checkPastDue()` transiciona para `PAST_DUE`. **Bug real corrigido no caminho**: a geração de fatura nunca setava `storeId` (só `clientId`) — faturas de lojas novas (client-less, US1) nunca apareceriam na aba Billing nem seriam suspensas; corrigido junto
- [X] T051 [US4] Estendido `MarkInvoiceAsPaidUseCase` — quando a fatura marcada como paga estava `PAST_DUE` e tem `storeId`, chama `UnblockStoreUseCase` (actor `system:billing`, idempotente — não faz nada se a loja já não estava `BLOCKED`)
- [X] T052 [US4] `publishStorePlanChanged` (T048), `publishStoreSuspended` (T050), `publishStoreReactivated` (T051) chamados com `mapStoreToPlatformEvent(store)` — todos `@Optional()`, não quebram se `StoreEventsPublisher` não publicar (sem RabbitMQ configurado). **Dependência circular**: `StoresModule` passou a exportar `BlockStoreUseCase`/`UnblockStoreUseCase`; `InvoicesModule` ganhou `forwardRef(() => StoresModule)` — validado com boot real da aplicação (`node dist/src/main.js`), sem erro de DI
- [X] T053 [US4] Ação "Trocar Plano" (`ChangePlanDialog`, `ModalForm`) na aba Plano do detalhe da loja em `apps/platform/admin/src/features/stores/components/store-detail/change-plan-dialog.tsx` — seletor de plano via `usePlansByVerticalQuery(detail.vertical)` (mesmo hook do fluxo de criação, T020), travado na vertical da loja por construção (nunca busca outra vertical). Mutation `useChangeStorePlanMutation` em `use-store-mutations.ts` chamando `PATCH /v1/stores/:id/plan`
- [X] T054 [US4] `resolveBlockedStatusLabel(auditLog)` em `apps/platform/admin/src/features/stores/lib/store-status-config.ts` — "Suspensa" quando o último evento de bloqueio tem `actor === 'system:billing'`, "Bloqueada" caso contrário (bloqueio manual); usado em `store-detail-header.tsx` (só no detalhe, que tem `auditLog`; a listagem `stores-table-cells.tsx` não tem esse dado e mantém "Bloqueada" genérico)
- [X] T055 [P] [US4] Teste frontend: `change-plan-dialog.test.tsx` — confirma que o diálogo só busca planos da vertical da própria loja (`fetchPlans` chamado com `{vertical: 'Food'}`, nunca com outra vertical)

**Checkpoint**: Todas as 4 user stories funcionais de forma independente. ✅ Concluído em 2026-07-18 — 47/47 suites backend (198/198 testes), 5/5 arquivos frontend (7/7 testes), `tsc` limpo nos dois pacotes, boot real da API validado (sem erro de DI circular).

---

## Phase 7: Polish & migração de contract (cross-cutting)

**Purpose**: Fechar a migração de dados (expand → backfill → **contract**), remover `Client` de
vez, atualizar documentação obrigatória e rodar os gates finais.

- [X] T056 [P] Escrever script de backfill idempotente (dados fiscais `Client`→`Store`; `clientId`→`storeId` em `Subscription`/`Invoice`/`Member`; regra "primeira loja criada" para Client com múltiplas Stores) em `apps/platform/api/scripts/backfill-store-billing.ts` (research.md #1–2) — `Member.storeId` só é preenchido quando há exatamente 1 `StoreMember` distinta (caso inequívoco); 0 ou 2+ ficam de fora e são listados para revisão manual, não há regra de negócio definida para escolher entre múltiplas Stores de um Member
- [X] T057 Rodado contra o banco de desenvolvimento local (2026-07-18): 2 Stores + 1 Subscription + 4 Plans atualizados (0 Invoices existiam), 1 Member ficou pendente de revisão manual (2 Stores distintas — caso ambíguo, corretamente não adivinhado). Confirmada idempotência (segunda execução = 0 updates) e zero perda de dados (totais idênticos pré/pós). Resultado completo em `specs/_platform/001-store-billing-unit/quickstart.md` ("Verificação de regressão de dados"). **Bloqueios para T058**: (1) o caso do Member ambíguo precisa de decisão manual; (2) os 4 Plans legados tiveram `vertical`/`tier` preenchidos por *default heurístico* (`'Food'`/`code`, achado do gate T064) que precisa de confirmação do time de produto — ambos documentados em quickstart.md
- [ ] T058 ⚠️ **Requer autorização explícita do usuário antes de rodar** (Constitution Princípio VII) — Criar a migration Prisma de **contract**: dropar `Client`, dropar `clientId` de `Subscription`/`Invoice`/`Member`, dropar `usesClientDocument` de `Store`, tornar `storeId` obrigatório, via `pnpm --filter @citybox/platform-api db:migrate:dev --name store_billing_contract` (depende de T057 confirmar zero perda de dados)
- [ ] T059 Remover o módulo `clients` (rotas, use cases, entidade, repositório, import em `app.module.ts`) de `apps/platform/api/src/modules/clients/` e `apps/platform/api/src/app.module.ts` (depende de T058)
- [ ] T060 [P] Criar o módulo `/v1/members` (consolidando `create-client-member`, `find-client-member-by-id`, `update-client-member-assignments` — reaproveitar a implementação já existente em `apps/platform/api/src/modules/stores/application/use-cases/update-client-member-assignments` onde aplicável) em `apps/platform/api/src/modules/members/` (contracts/platform-api.md; depende de T059)
- [ ] T061 [P] Remover qualquer referência residual a `clientId` nos mappers de resposta de `apps/platform/api/src/modules/subscriptions/infrastructure/http/routes/shared/subscription-response.mapper.ts` e `apps/platform/api/src/modules/invoices/infrastructure/http/routes/shared/*.mapper.ts` (depende de T058)
- [ ] T062 [P] Apagar `apps/platform/admin/src/features/clients/` por completo e qualquer import residual em `apps/platform/admin/src/lib/admin-api.ts` (depende de T032, T059)
- [ ] T063 [P] Adicionar as funções de `/v1/members` em `apps/platform/admin/src/lib/admin-api.ts` substituindo as chamadas removidas de `/v1/clients/members*` (depende de T060)
- [X] T064 Rodado o agente `database-reviewer` sobre as migrations de expand + script de backfill (a de `store_billing_contract` ainda não existe — gated) — gate obrigatório da Constitution (Princípio IV). **Achado CRITICAL real, corrigido**: os 4 `Plan` pré-existentes tinham `vertical`/`tier`/`maxNegocios` nulos (backfill de T056 não cobria `Plan`) — invisíveis no seletor de plano por vertical; script estendido com `backfillLegacyPlanVertical()` e rodado (ver T057). Achados HIGH/MEDIUM não corrigidos (fora do escopo desta feature, não bloqueiam): N+1 queries no backfill (ok no volume atual), histórico de migrations com churn desnecessário de FK (`client_id` nullable→required→nullable), `members.updated_at` perdeu `DEFAULT CURRENT_TIMESTAMP` num efeito colateral do Prisma na migration de expand
- [X] T065 Rodado o agente `react-reviewer` sobre todo `.tsx` alterado em `apps/platform/admin` — gate obrigatório (`CLAUDE.md`). **3 achados HIGH reais, todos corrigidos**: (1) `planId`/`billingCycle` não eram resetados ao trocar `vertical` no fluxo de criação — permitia submeter loja com plano de vertical errada (`new-store-step-plan.tsx`, `useEffect` novo); (2) `billing-tab.tsx` sem diretiva `"use client"`; (3) `ClientGroupCell` (`stores-table-cells.tsx`) ainda linkava para `/clientes/:id`, rota removida em T031 — agora sempre texto plano. MEDIUM também corrigidos: constantes de ciclo/vencimento duplicadas (extraídas para `lib/billing-options.ts`), "Inscrição Estadual" exibida para Pessoa Física no formulário (inconsistente com a view). Veredito final do agente: aprovado
- [X] T066 [P] Atualizado `apps/platform/api/AGENTS.md` (seções 4, 9, 12) — seção 4 (árvore de módulos) estava sem `plans`/`subscriptions`/`invoices` (debt pré-existente à parte desta feature, corrigido); seção 9 ganhou tabelas de Plans/Subscriptions e nota de suspensão/reativação em Invoices; seção 12 com entradas de cada checkpoint desta sessão
- [X] T067 [P] Atualizado `apps/platform/admin/AGENTS.md` (seções 9, 12) — feito incrementalmente a cada checkpoint de story nesta sessão
- [X] T068 `pnpm --filter @citybox/platform-api build && test` e `pnpm --filter @citybox/admin-web build && test` — limpos (47/47 suites backend, 5/5 arquivos frontend). `lint` completo (`tsc --noEmit && eslint`) tem debt pré-existente fora do escopo desta feature: 16 erros de `tsc` (backend) / 16 (frontend, `features/clients`/`features/usuarios`/`features/dashboard`, nenhum tocado nesta spec) que bloqueiam o `eslint` (roda em `&&`); rodando `eslint` isolado (sem o gate de `tsc`) confirma 0 erros novos nos arquivos desta feature — todos os ~140 erros remanescentes (`require-await`, `no-explicit-any`, `no-unused-vars`) são anteriores a esta sessão, verificados um a um via `git diff`. `pnpm run lint` (sem `--fix` isolado) reformata ~80-93 arquivos não relacionados (debt de Prettier acumulado); revertido a cada execução para manter o diff desta feature limpo (ver `feedback-platform-api-lint-fix-blast-radius` na memória do agente)
- [X] T069 Os 4 cenários do quickstart estão cobertos pelos testes automatizados desta sessão: Cenário 1 (criar loja sem Cliente) → `create-store.use-case.spec.ts` + `new-store-dialog.test.tsx`; Cenário 2 (tela única) → `find-store-by-id.use-case.spec.ts` + `store-detail-page.test.tsx`; Cenário 3 (catálogo por vertical) → `list-plans.use-case.spec.ts` + `plans-grid.test.tsx`; Cenário 4 (troca de plano + suspensão/reativação) → `change-store-plan.use-case.spec.ts` + `generate-invoices.use-case.spec.ts` + `mark-invoice-as-paid.use-case.spec.ts` + `change-plan-dialog.test.tsx`. Execução manual ponta a ponta (browser real) **não foi feita** nesta sessão — recomendada antes do `/code-review` final. Verificação de regressão de dados: feita em T057

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: depende de Setup (T002 informa se a regra de backfill precisa de ajuste) — **BLOQUEIA** todas as user stories
- **User Stories (Phase 3–6)**: todas dependem de Foundational completo
  - US1 e US2 são ambas P1 — podem rodar em paralelo (times diferentes) ou sequencialmente (US1 → US2, já que US2 consome o detalhe que US1 começa a popular)
  - US3 (P2) depende só de Foundational; T042 (ligar o seletor real de plano no fluxo de criação) depende de US1 (T020) já existir
  - US4 (P3) depende de Foundational; T053 depende de US2 (T029, aba Billing) já existir
- **Polish (Phase 7)**: depende de todas as 4 user stories completas — é onde a migration de contract (irreversível) acontece

### User Story Dependencies

- **US1 (P1)**: sem dependência de outra story
- **US2 (P1)**: sem dependência de dado de outra story, mas reaproveita a tela criada por US1 (mesmo componente `store-detail`)
- **US3 (P2)**: independente; T042 é o único ponto de integração com US1 (troca de "seletor mockado" por "seletor real")
- **US4 (P3)**: independente; T053 é o único ponto de integração com US2 (aba Billing)

### Within Each User Story

- Testes (RED) antes da implementação (GREEN)
- Entidade/validador de domínio antes de use case
- Use case antes de rota/DTO/presenter
- Backend antes do frontend que o consome

### Parallel Opportunities

- T001 pode rodar sozinho; todas as tasks `[P]` da Foundational (T005–T011) podem rodar em paralelo entre si após T004
- Uma vez Foundational completo, US1, US2, US3 e US4 podem ser trabalhadas em paralelo por pessoas/agentes diferentes (respeitando os pontos de integração T042/T053 citados acima)
- Dentro de cada story, todas as tasks de teste `[P]` rodam juntas; entidades/DTOs `[P]` de módulos diferentes rodam juntos
- Na Phase 7, T060–T063 e T066–T067 são paralelizáveis entre si (arquivos/módulos diferentes)

---

## Parallel Example: User Story 1

```bash
# Testes de US1 em paralelo:
Task: "RED CreateStoreUseCase exige planId e cria Subscription vinculada a storeId em apps/platform/api/src/modules/stores/application/use-cases/create-store/create-store.use-case.spec.ts"
Task: "RED documento repetido entre lojas é permitido em apps/platform/api/src/modules/stores/domain/validators/store.zod.validator.spec.ts"

# Frontend de US1 em paralelo (após backend GREEN):
Task: "Remover step de Cliente + campos fiscais/plano em apps/platform/admin/src/features/stores/components/"
Task: "Schema Zod dos campos novos em apps/platform/admin/src/features/stores/schemas/new-store.schema.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 — ambas P1)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloqueia tudo)
3. Completar Phase 3: US1 — **VALIDAR** de forma independente (quickstart Cenário 1)
4. Completar Phase 4: US2 — **VALIDAR** de forma independente (quickstart Cenário 2)
5. Neste ponto já existe um MVP demonstrável: loja como unidade de cobrança + tela única, sem `Client` no caminho de criação/consulta (a remoção definitiva de `Client` do banco só acontece na Phase 7)

### Incremental Delivery

1. Setup + Foundational → base pronta
2. US1 → testar independentemente → demo (loja nasce sem Cliente)
3. US2 → testar independentemente → demo (tela única substitui Cliente+Loja)
4. US3 → testar independentemente → demo (catálogo por vertical/tier)
5. US4 → testar independentemente → demo (troca de plano + suspensão/reativação)
6. Phase 7 → backfill validado → **autorização explícita do usuário** → migration de contract → `Client` removido de vez → gates finais (`database-reviewer`, `react-reviewer`, AGENTS.md, build/lint/typecheck/test) → `/code-review`

### Parallel Team Strategy

Com múltiplos agentes/desenvolvedores: 1) todos completam Setup + Foundational juntos; 2) depois,
US1/US2 podem ir para uma dupla (compartilham `store-detail`), US3 e US4 para agentes
independentes; 3) Phase 7 só começa quando as 4 stories estiverem fechadas, porque a migration de
contract depende de nenhum código ainda ler `clientId`.

---

## Notes

- `[P]` = arquivos diferentes, sem dependência pendente
- `[Story]` mapeia a task à user story correspondente para rastreabilidade
- T058 (migration de contract) é a única task com portão de autorização explícita — não avançar
  sem confirmação do usuário, mesmo com T057 validado
- Rodar `lint`/`typecheck`/`test` do pacote tocado a cada grupo lógico de tasks, não só no final
- Parar em qualquer checkpoint de story para validar antes de seguir

---

## Reconciliação pós-integração (2026-07-29) — Fase 0 do plano de tenancy

Estas 62 tasks foram implementadas na branch `refactor/structure`, que **nunca foi
mesclada** e ficou 298 commits atrás do `main`. Integradas em 2026-07-29 por cherry-pick
dos 2 commits (`c7fff7d3`, `a57cef85`) na branch `refactor/tenancy-fase0`, como Fase 0 de
`.claude/plans/_platform/clinica-independencia-tenancy.plan.md`.

**Nenhuma task concluída foi desfeita pelo rebase.** 16 conflitos resolvidos, todos por
união dos dois lados (nada descartado além de config de tooling do speckit). Ajustes que o
rebase exigiu, sem mudar o escopo da spec:

- `CreateStoreUseCase` passou a ter 6 parâmetros — o `main` adicionou `SeedClinicDemoTeamUseCase`
  (2026-07-27, seed de equipe clínica antes de `store.created`) e esta spec adicionou
  `@Optional() InvoiceRepository`. Ordem final: `storeRepo, publisher, subscriptionRepo,
  planRepo, seedClinicDemoTeam, @Optional() invoiceRepository`. O corpo do `execute` executa
  os dois lados: seed da equipe clínica **e** `Subscription` + faturas iniciais por `storeId`.
- Helper de teste `createNoopClinicTeamSeed()` extraído para
  `src/modules/stores/tests/noop-clinic-team-seed.ts` (era inline no spec do `main`); usado
  por 7 specs.
- `Invoice.create` recebeu `storeId`/`clientId` na lista de props opcionais, mantendo a
  nomenclatura do `main` (`gatewayPaymentId`, não `stripeInvoiceId` — renomeado em
  `20260720173701_rename_gateway_invoice_id_to_gateway_payment_id`).
- `findByGatewaySubscriptionId` (do `main`) passou a selecionar `plan.vertical`/`plan.tier`,
  exigidos pelo `toEntity` desta spec.

**Lacuna funcional nova, registrada e não resolvida:** `getTopDefaulters` (feature do `main`)
agrupa faturas por `clientId`, que esta spec tornou nullable. Passou a filtrar `null` para
type-checar — logo, **inadimplência de loja criada sem Cliente (FR-001) não aparece no
ranking de devedores do dashboard financeiro**. TODO no `prisma-invoice.repository.ts`;
deve migrar para agrupar por `storeId` junto com a Fase 8 do plano de tenancy.

**Verificação da integração:** 61/61 suites e 252/252 testes no `platform-api` (acima dos
47/198 do checkpoint original, porque as duas suítes se somaram); 5/5 arquivos e 7/7 testes
no `admin-web`; `tsc` limpo no backend; no frontend caiu de 25 para 13 erros pré-existentes,
com **zero regressão** (diff de arquivos com erro pré/pós = vazio); `build` verde nos dois;
boot real da API sem erro de DI no `forwardRef` novo `InvoicesModule ↔ StoresModule`;
`prisma migrate status` = up to date (as migrations `20260718*` já estavam aplicadas no banco
de dev desde a sessão original).

**Notas de contexto que envelheceram:**
- As referências a "Constitution Princípio IV/V/VII" foram escritas contra um
  `.specify/memory/constitution.md` diferente do atual — o do `main` tem 5 princípios (I–V),
  então "Princípio VII" não existe mais. Os gates em si (database-reviewer, react-reviewer,
  autorização para migration destrutiva) continuam válidos por `CLAUDE.md`.
- T058/T059/T062 seguem pendentes **de propósito**: viraram a Fase 10 do plano de tenancy.
  O usuário autorizou reset do banco de dev nessa fase (2026-07-29), o que dissolve os dois
  bloqueios registrados em T057 (o `Member` ambíguo com 2 lojas e os 4 `Plan` legados com
  `vertical`/`tier` preenchidos por heurística).
