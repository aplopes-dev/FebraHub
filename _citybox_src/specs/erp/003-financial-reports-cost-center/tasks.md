# Tasks: DRE real e análise por centro de custo

**Input**: Design documents from `/specs/erp/003-financial-reports-cost-center/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/reports-api.md](./contracts/reports-api.md), [quickstart.md](./quickstart.md)

**Tests**: Backend segue TDD obrigatório por convenção do projeto (`CLAUDE.md` / `api/AGENTS.md` — todo use case novo tem `.spec.ts` com repositório in-memory, escrito **antes** da implementação — mesmo padrão de `001-financial-entries`/`002-bank-account-ledger`). Frontend não tem infraestrutura de teste em `erp-web` (`research.md` D11); validação end-to-end é manual, via `quickstart.md`.

**Organization**: Tarefas agrupadas por user story (prioridades de `spec.md`). A regressão dos 3 cadastros (grupo financeiro, plano de contas, centro de custo — FR-018) não tem fase própria: nenhuma tarefa altera suas rotas HTTP nem seus formulários; a garantia é estrutural (nada nesta feature toca esses arquivos, exceto a extensão pontual e não-exposta de `FinancialGroup.classification` na Phase 2) e é confirmada na Phase 6 via `quickstart.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: US1/US2, mapeando para as user stories de `spec.md`
- Caminhos de arquivo sempre relativos à raiz do monorepo (`/root/aplopes-city`)

---

## Phase 1: Setup

**Purpose**: Preparação mínima — feature entra num app já estruturado (brownfield), sem inicialização de projeto. Pressupõe `001-financial-entries` já implementada (`FinancialEntryAllocation` persistido, `chartOfAccountId`/`costCenterId` obrigatórios — confirmado em `research.md` "Contexto herdado").

- [X] T001 Confirmar infraestrutura local no ar (`pnpm infra:up:postgres`) e confirmar que `apps/erp/api/prisma/schema.prisma` já contém `FinancialEntryAllocation` com `chartOfAccountId`/`costCenterId` obrigatórios antes de iniciar a Phase 2 — ver `infra/AGENTS.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Campo `FinancialGroup.classification` (corrige o bug de grupos patrimoniais tipados como receita) + o novo repositório de agregação `FinanceReportRepository` (real + in-memory) que as duas user stories consomem.

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase terminar.

### Classificação do grupo financeiro (data-model.md)

- [X] T002 Alterar `apps/erp/api/prisma/schema.prisma`: criar `enum FinancialGroupClassification { resultado patrimonial @@schema("erp") }` e adicionar `classification FinancialGroupClassification @default(resultado) @map("classification")` ao model `FinancialGroup` — campos/enum exatamente como em [data-model.md](./data-model.md)
- [X] T003 Rodar `pnpm --filter @citybox/erp-api db:migrate:dev --name add_financial_group_classification` (depende de T002) — gera e aplica a migration; **proibido** editar o `.sql` gerado à mão (`api/AGENTS.md` §5.9)
- [X] T004 Rodar `pnpm --filter @citybox/erp-api db:generate` para regenerar o client Prisma em `generated/prisma` (depende de T003)
- [X] T005 [P] Adicionar `classification: 'resultado' | 'patrimonial'` ao tipo `SeedFinancialGroup` em `apps/erp/api/src/modules/store-setup/application/seed-data/seed-template.types.ts`
- [X] T006 [P] Atualizar `SEED_FINANCIAL_GROUPS` em `apps/erp/api/src/modules/store-setup/application/seed-data/finance.seed.ts`: `classification: 'resultado'` em `receitas`/`outras-receitas`/`despesas`/`custos`; `classification: 'patrimonial'` em `caixa-e-bancos`/`ativo` (depende de T005) — tabela exata em [data-model.md](./data-model.md)
- [X] T007 Atualizar `writeFinancialGroups` em `apps/erp/api/src/modules/store-setup/infrastructure/database/writers/finance.writer.ts`: incluir `classification: item.classification` tanto no bloco `create` quanto no `update` (organizações **novas** nascem já corretas; sem isso o campo do seed nunca chega ao banco) (depende de T004, T006)
- [X] T008 [P] Estender `apps/erp/api/src/modules/finance/financial-groups/domain/entities/financial-group.entity.ts`: `classification: FinancialGroupClassification` em `FinancialGroupProps`; adicionar `'classification'` à lista de campos opcionais de `CreateFinancialGroupProps` (mesmo padrão de `systemKey`/`isSystem` — não é um input do formulário HTTP, mas o construtor aceita para permitir provisionamento/backfill/testes); `create()` usa `props.classification ?? 'resultado'`; getter `classification` — `update()` **não** toca o campo (imutável fora do provisionamento, mesmo padrão de `systemKey`/`isSystem`)
- [X] T009 Atualizar `apps/erp/api/src/modules/finance/financial-groups/infrastructure/database/prisma-financial-group.repository.ts`: `FinancialGroupRow` ganha `classification: FinancialGroupClassification`; `toEntity()` lê `row.classification`; `save()` inclui `classification: group.classification` no objeto `data` do upsert (write idempotente — nunca reseta o valor, só persiste o que já está na entidade) (depende de T004, T008)
- [X] T010 [P] Estender `apps/erp/api/src/modules/finance/financial-groups/tests/financial-groups-test-factory.ts`: `makeFinancialGroup` ganha `classification?: FinancialGroupClassification` no `Partial` de overrides, default `'resultado'` (depende de T008)
- [X] T011 Criar `apps/erp/api/scripts/backfill-financial-group-classification.ts`: para cada organização, `prisma.financialGroup.updateMany({ where: { organizationId, systemKey: { in: ['caixa-e-bancos', 'ativo'] } }, data: { classification: 'patrimonial' } })` — idempotente, mesmo padrão de execução standalone (`tsx`/`ts-node`, fora de `prisma migrate dev`) de `scripts/backfill-financial-entry-allocations.ts` (`research.md` D2); registrar o script `"db:backfill:financial-group-classification": "ts-node scripts/backfill-financial-group-classification.ts"` em `apps/erp/api/package.json` (depende de T004)

### Repositório de agregação de relatórios (novo, `research.md` D1/D3/D5)

- [X] T012 [P] Criar `apps/erp/api/src/modules/finance/reports/domain/repositories/finance-report.repository.interface.ts`: tipo `AllocationAggregate = { totalCents: number; entryCount: number }`; `abstract class FinanceReportRepository` com `sumAllocationsByChartOfAccount(organizationId: string, from: Date, to: Date): Promise<Map<string, AllocationAggregate>>` (chave = `chartOfAccountId`) e `sumAllocationsByCostCenter(organizationId: string, from: Date, to: Date, operation: 'payable' | 'receivable'): Promise<Map<string, AllocationAggregate>>` (chave = `costCenterId`)
- [X] T013 [P] Criar `apps/erp/api/src/modules/finance/reports/domain/errors/invalid-report-period.error.ts`: `InvalidReportPeriodError extends DomainError` (mesmo padrão de `financial-group-in-use.error.ts`) — mensagem externa "A data final não pode ser anterior à data inicial"
- [X] T014 Criar `apps/erp/api/src/modules/finance/reports/infrastructure/database/prisma-finance-report.repository.ts`: `sumAllocationsByChartOfAccount` via `prisma.scoped.financialEntryAllocation.groupBy({ by: ['chartOfAccountId'], where: { financialEntry: { organizationId, deletedAt: null, competenceDate: { gte: from, lte: to } } }, _sum: { amountCents: true }, _count: true })`, convertido em `Map`; `sumAllocationsByCostCenter` idêntico trocando `by: ['costCenterId']` e adicionando `operation` ao `where.financialEntry` (`research.md` D3/D5) (depende de T012, T004)
- [X] T015 [P] Criar `apps/erp/api/src/modules/finance/reports/tests/in-memory-finance-report.repository.ts`: array interno de allocations sintéticas (`{ organizationId, chartOfAccountId, costCenterId, amountCents, competenceDate, deletedAt, operation }`) + método `addAllocation(input)`; os dois métodos da interface filtram (`organizationId`, `deletedAt === null`, `competenceDate` no intervalo, e `operation` quando aplicável) e reduzem para o mesmo formato `Map<string, AllocationAggregate>` que a implementação Prisma devolve (depende de T012)
- [X] T016 [P] Criar `apps/erp/api/src/modules/finance/reports/tests/reports-test-factory.ts`: `makeReportRepositories()` compõe `InMemoryFinanceReportRepository` (novo) + `InMemoryFinancialGroupRepository`/`InMemoryChartOfAccountRepository`/`InMemoryCostCenterRepository` (reaproveitados dos 3 módulos existentes — mesmo padrão de reuso cross-módulo de `chart-of-accounts-test-factory.ts`); helper `makeAllocation(overrides)` com defaults sensatos (organização/conta/centro de custo/valor/competência de hoje) (depende de T015, T010)

**Checkpoint**: `classification` persistido e legível; `FinanceReportRepository` pronto (real + in-memory) — as duas user stories podem começar.

---

## Phase 3: User Story 1 - Visualizar a DRE com dados reais (Priority: P1) 🎯 MVP

**Goal**: `/financas/relatorios-de-resultados` passa a agregar lançamentos reais por data de competência, hierarquia Grupo financeiro → Plano de contas, excluindo os grupos patrimoniais do resultado.

**Independent Test**: Criar a conta "Internet" no grupo "Despesas fixas", lançar um pagamento de R$ 100 nela com competência hoje, abrir a DRE do mês → aparece "Despesas fixas −R$ 100", expandindo para "Internet −R$ 100".

### Tests for User Story 1 (TDD obrigatório) ⚠️

> Escrever e rodar (RED) antes de implementar

- [X] T017 [P] [US1] Criar `apps/erp/api/src/modules/finance/reports/application/use-cases/get-income-statement/get-income-statement.use-case.spec.ts` cobrindo: (a) uma conta/grupo/seção simples soma corretamente; (b) lançamento rateado 80/20 entre 2 contas contribui 80%/20% para cada uma; (c) grupo `classification=patrimonial` **não** entra em `revenue`/`expense` nem em `netCents`, mesmo tendo allocations no período; (d) `shareOfGroup` de todas as contas de um grupo soma 1 (tolerância de ponto flutuante) e `shareOfSection` de todos os grupos de uma seção soma 1; (e) despesas somam magnitude positiva em `totalCents` (o sinal é responsabilidade do frontend — `research.md` D8); (f) `netCents = revenue.totalCents - expense.totalCents`; (g) período sem allocations válidas → `revenue.groups: []`, `expense.groups: []`, `netCents: 0`, `entryCount: 0`; (h) allocation cujo `FinancialEntry` está soft-deleted não entra na soma; (i) `to < from` lança `InvalidReportPeriodError`; (j) allocations de outra organização não vazam para o resultado

### Implementation for User Story 1 — Backend

- [X] T018 [P] [US1] Criar `apps/erp/api/src/modules/finance/reports/application/dtos/income-statement-report.dto.ts`: `GetIncomeStatementInput = { organizationId: string; from: Date; to: Date }`; `IncomeStatementAccountDto`/`IncomeStatementGroupDto`/`IncomeStatementSectionDto`/`IncomeStatementReportDto` — shapes exatamente como em [data-model.md](./data-model.md) § `IncomeStatementReport`
- [X] T019 [US1] Criar `apps/erp/api/src/modules/finance/reports/application/use-cases/get-income-statement/get-income-statement.use-case.ts`: injeta `FinanceReportRepository`, `FinancialGroupRepository`, `ChartOfAccountRepository`. Algoritmo: (1) `to < from` → `throw new InvalidReportPeriodError()`; (2) buscar grupos financeiros nas duas abas (`findAll(organizationId, {tab:'active'})` + `findAll(organizationId, {tab:'deleted'})`, mesclados) → `Map<groupId, FinancialGroup>` (um grupo excluído pode ter sido dono de uma conta que ainda tem allocation histórica — não pode sumir do relatório); (3) buscar contas do plano nas duas abas da mesma forma → `Map<accountId, ChartOfAccountWithGroup>` (já traz `financialGroupName`/`financialGroupType` resolvidos pelo próprio repositório); (4) `sums = await financeReportRepository.sumAllocationsByChartOfAccount(organizationId, from, to)`; (5) para cada `[chartOfAccountId, aggregate]` de `sums`: resolver `account = accountsMap.get(chartOfAccountId)` (pular se ausente — integridade), `group = groupsMap.get(account.account.financialGroupId)` (pular se ausente ou `group.classification !== 'resultado'` — exclui patrimoniais, FR-004/FR-005); acumular por `groupId` dentro da seção `account.financialGroupType`; (6) calcular `shareOfGroup`/`shareOfSection` como frações não arredondadas (0 se denominador for 0 — `research.md` D7); (7) ordenar contas e grupos por `totalCents` desc; (8) `entryCount` do relatório = soma do `entryCount` de todas as contas incluídas nas duas seções; (9) `netCents = revenueTotal - expenseTotal` (depende de T012, T013, T018)
- [X] T020 [P] [US1] Criar `apps/erp/api/src/modules/finance/reports/reports.module.ts`: importa `FinancialGroupsModule`, `ChartOfAccountsModule`, `CostCentersModule`; provider `{ provide: FinanceReportRepository, useClass: PrismaFinanceReportRepository }`; registra `GetIncomeStatementUseCase` (US2 adiciona `GetCostCenterAnalysisUseCase` na Phase 4) (depende de T014, T019)
- [X] T021 [US1] Criar `apps/erp/api/src/modules/finance/reports/infrastructure/http/routes/shared/finance-report.presenter.ts`: `toIncomeStatementHttp(dto: IncomeStatementReportDto)` — envelope `{ data: dto }`, campos já em centavos/frações prontos (nenhuma transformação de valor, só o envelope — mesmo padrão dos demais presenters do módulo)
- [X] T022 [US1] Criar `apps/erp/api/src/modules/finance/reports/infrastructure/http/routes/get-income-statement/get-income-statement.dto.ts`: `GetIncomeStatementQueryDto` com `from`/`to` (`@ApiProperty()` + `@IsDateString()`, obrigatórios — sem `@IsOptional()`)
- [X] T023 [US1] Criar `apps/erp/api/src/modules/finance/reports/infrastructure/http/routes/get-income-statement/get-income-statement.route.ts`: `@Controller('v1/reports')`, `GET income-statement`, `@RequirePermission('org.view')`, injeta `GetIncomeStatementUseCase`, converte `query.from`/`query.to` em `Date`, chama `execute()`, devolve via `FinanceReportPresenter.toIncomeStatementHttp` — molde de `list-bank-account-transactions.route.ts` (depende de T019, T021, T022)
- [X] T024 [US1] Registrar `GetIncomeStatementRoute` em `controllers` e `GetIncomeStatementUseCase` em `providers` de `reports.module.ts` (depende de T020, T023)
- [X] T025 [US1] Adicionar `ReportsModule` aos `imports` de `apps/erp/api/src/modules/finance/finance.module.ts` (depende de T024)

### Implementation for User Story 1 — Frontend (troca de origem de dado, sem redesenhar a tela)

- [X] T026 [P] [US1] Criar `apps/erp/web/src/features/financial-results/api/financial-result.dto.ts`: `IncomeStatementAccountDto`/`IncomeStatementGroupDto`/`IncomeStatementSectionDto`/`IncomeStatementReportDto` espelhando `contracts/reports-api.md` (centavos)
- [X] T027 [US1] Criar `apps/erp/web/src/features/financial-results/api/financial-result.mapper.ts`: `toFinancialResultReport(dto: IncomeStatementReportDto): FinancialResultReport` — converte `totalCents`→`total` (÷100), mantém `shareOfGroup`/`shareOfSection`/`entryCount` como vêm; reaproveita os tipos já existentes de `types/financial-result.ts` **sem alterá-los** (depende de T026)
- [X] T028 [US1] Criar `apps/erp/web/src/features/financial-results/api/financial-results.service.ts`: `getIncomeStatementApi(from: string, to: string)` via `comercioFetch('GET', '/v1/reports/income-statement', { query: { from, to } })` + `toFinancialResultReport` (depende de T027)
- [X] T029 [P] [US1] Criar `apps/erp/web/src/features/financial-results/hooks/query-keys.ts`: `financialResultKeys.report(organizationId, from, to)`
- [X] T030 [US1] Reescrever `apps/erp/web/src/features/financial-results/hooks/use-financial-result.ts`: mantém o estado de `period`/`setPreset`/`setCustomRange`/`collapsedGroupIds` como está; troca `useMemo(() => getFinancialResultReport(period), [period])` por `useQuery({ queryKey: financialResultKeys.report(...), queryFn: () => getIncomeStatementApi(range.from, range.to), enabled: range != null })` — preserva a semântica atual de "`report` é `null` até o período estar resolvido" (o `enabled: false` faz o React Query não disparar, e o hook expõe `report: query.data ?? null`); expõe também `isLoading`/`isError` para o componente (FR-017) (depende de T028, T029)
- [X] T031 [US1] Ajustar `apps/erp/web/src/features/financial-results/pages/financial-result-page.tsx`: além do estado `report == null` (seleção de período) já existente, adicionar um estado de **carregando** (skeleton ou `CircularProgress` dentro do `ListPagePanel`, quando `isLoading`) e um estado de **erro** (`ListLoadErrorAlert`, quando `isError`) — árvore, cards de resumo, toolbar e botões PDF/Excel permanecem exatamente como estão (depende de T030)
- [X] T032 [US1] Revisar `apps/erp/web/src/features/financial-results/GUIA.md`: confirmar que nada no texto (linguagem de negócio) precisa mudar — o comportamento visível para o lojista é o mesmo, só os números passam a ser reais; ajustar só se algum trecho ainda sugerir dado de exemplo

**Checkpoint**: US1 completa e testável de forma independente — DRE real, grupos patrimoniais excluídos, loading/erro/vazio tratados.

---

## Phase 4: User Story 2 - Analisar receita e despesa por centro de custo (Priority: P2)

**Goal**: Nova tela `/financas/analise-centro-de-custo` mostra valor e percentual por centro de custo no período, filtrável por Despesa/Receita, ordenado por valor decrescente.

**Independent Test**: Com lançamentos rateados entre pelo menos 2 centros de custo diferentes num período, abrir a análise, escolher "Despesa" e conferir que os dois centros aparecem com valor e percentual, ordenados do maior para o menor.

### Tests for User Story 2 (TDD obrigatório) ⚠️

- [X] T033 [P] [US2] Criar `apps/erp/api/src/modules/finance/reports/application/use-cases/get-cost-center-analysis/get-cost-center-analysis.use-case.spec.ts` cobrindo: (a) 2+ centros de custo com valores diferentes aparecem ordenados por `valueCents` desc; (b) `share` de cada item soma 1 entre todos os itens (incluindo "Outros"); (c) `type=despesa` só considera allocations de `FinancialEntry.operation=payable`, `type=receita` só `receivable`; (d) uma allocation cujo `costCenterId` não resolve para nenhum `CostCenter` conhecido (simulado não semeando esse id no `InMemoryCostCenterRepository`) aparece agregada sob `{ costCenterId: null, costCenterName: "Outros" }`; (e) período sem allocations do tipo selecionado → `items: []`, `totalCents: 0`; (f) allocation de lançamento soft-deleted não entra; (g) `to < from` lança `InvalidReportPeriodError`; (h) allocations de outra organização não vazam

### Implementation for User Story 2 — Backend

- [X] T034 [P] [US2] Criar `apps/erp/api/src/modules/finance/reports/application/dtos/cost-center-analysis-report.dto.ts`: `GetCostCenterAnalysisInput = { organizationId: string; from: Date; to: Date; type: 'despesa' | 'receita' }`; `CostCenterAnalysisItemDto`/`CostCenterAnalysisReportDto` — shapes exatamente como em [data-model.md](./data-model.md) § `CostCenterAnalysisReport`
- [X] T035 [US2] Criar `apps/erp/api/src/modules/finance/reports/application/use-cases/get-cost-center-analysis/get-cost-center-analysis.use-case.ts`: injeta `FinanceReportRepository`, `CostCenterRepository`. Algoritmo: (1) `to < from` → `InvalidReportPeriodError`; (2) `operation = type === 'despesa' ? 'payable' : 'receivable'`; (3) buscar centros de custo nas duas abas (`findAll` `active` + `deleted`, mesclados) → `Map<id, CostCenter>`; (4) `sums = await financeReportRepository.sumAllocationsByCostCenter(organizationId, from, to, operation)`; (5) para cada `[costCenterId, aggregate]`: `costCenter = map.get(costCenterId)`; se encontrado, item com `costCenterId`/`costCenter.name`; se não, acumular num bucket único `{ costCenterId: null, costCenterName: 'Outros' }` (somar `totalCents`/`entryCount` de todas as linhas não resolvidas — `research.md` D6); (6) `totalCents` do relatório = soma de todos os itens; `share` de cada item = `valueCents / totalCents` (0 se `totalCents` for 0); (7) ordenar por `valueCents` desc (depende de T012, T013, T034)
- [X] T036 [US2] Registrar `GetCostCenterAnalysisUseCase` em `apps/erp/api/src/modules/finance/reports/reports.module.ts` (depende de T035, T020)
- [X] T037 [US2] Estender `apps/erp/api/src/modules/finance/reports/infrastructure/http/routes/shared/finance-report.presenter.ts`: `toCostCenterAnalysisHttp(dto: CostCenterAnalysisReportDto)` — envelope `{ data: dto }` (depende de T021)
- [X] T038 [US2] Criar `apps/erp/api/src/modules/finance/reports/infrastructure/http/routes/get-cost-center-analysis/get-cost-center-analysis.dto.ts`: `GetCostCenterAnalysisQueryDto` com `from`/`to` (`@IsDateString()`, obrigatórios) e `type` (`@IsIn(['despesa', 'receita'])`, obrigatório)
- [X] T039 [US2] Criar `apps/erp/api/src/modules/finance/reports/infrastructure/http/routes/get-cost-center-analysis/get-cost-center-analysis.route.ts`: `GET v1/reports/cost-centers`, `@RequirePermission('org.view')`, mesmo molde de `get-income-statement.route.ts` (depende de T035, T037, T038)
- [X] T040 [US2] Registrar `GetCostCenterAnalysisRoute` em `controllers` de `reports.module.ts` (depende de T036, T039)

### Implementation for User Story 2 — Frontend (feature nova)

- [X] T041 [P] [US2] Criar `apps/erp/web/src/features/cost-center-analysis/types/cost-center-analysis.ts`: `CostCenterAnalysisType = "despesa" | "receita"`; `CostCenterAnalysisItem = { costCenterId: string | null; costCenterName: string; value: number; share: number; entryCount: number }`; `CostCenterAnalysisReport = { from: string; to: string; type: CostCenterAnalysisType; total: number; items: CostCenterAnalysisItem[] }`
- [X] T042 [P] [US2] Criar `apps/erp/web/src/features/cost-center-analysis/api/cost-center-analysis.dto.ts`: DTOs espelhando `contracts/reports-api.md` § `cost-centers` (centavos)
- [X] T043 [US2] Criar `apps/erp/web/src/features/cost-center-analysis/api/cost-center-analysis.mapper.ts`: `toCostCenterAnalysisReport(dto)` — `valueCents`/`totalCents` ÷100 (depende de T041, T042)
- [X] T044 [US2] Criar `apps/erp/web/src/features/cost-center-analysis/api/cost-center-analysis.service.ts`: `getCostCenterAnalysisApi(from, to, type)` via `comercioFetch('GET', '/v1/reports/cost-centers', { query: { from, to, type } })` + mapper (depende de T043)
- [X] T045 [P] [US2] Criar `apps/erp/web/src/features/cost-center-analysis/hooks/query-keys.ts`: `costCenterAnalysisKeys.report(organizationId, from, to, type)`
- [X] T046 [US2] Criar `apps/erp/web/src/features/cost-center-analysis/hooks/use-cost-center-analysis.ts`: reaproveita `FinancialResultPeriod`/`createDefaultFinancialResultPeriod`/`resolveFinancialResultPeriodRange` de `@/features/financial-results` (mesma lógica de preset de período — sem duplicar) + estado local `type: CostCenterAnalysisType` (default `"despesa"`); `useQuery` com `enabled: range != null`, expõe `report`/`isLoading`/`isError`/`period`/`setPreset`/`setCustomRange`/`type`/`setType` (depende de T044, T045)
- [X] T047 [P] [US2] Criar `apps/erp/web/src/features/cost-center-analysis/components/cost-center-share-bar.tsx`: linha com nome do centro de custo + `LinearProgress` de `@mui/material` (`value={share * 100}`, `variant="determinate"`) + valor formatado + percentual — `research.md` D10, sem biblioteca de gráfico nova
- [X] T048 [US2] Criar `apps/erp/web/src/features/cost-center-analysis/components/cost-center-analysis-table.tsx`: lista os `items` do relatório usando `cost-center-share-bar` por linha, ordenados como a API já devolve (desc); reaproveita `formatResultCurrency`/`formatResultShare` de `@/features/financial-results/lib/financial-result-format` (sem duplicar formatação) (depende de T047)
- [X] T049 [US2] Criar `apps/erp/web/src/features/cost-center-analysis/components/cost-center-analysis-toolbar.tsx`: reaproveita `FinancialResultToolbar` de `@/features/financial-results` (período) + `ToggleButtonGroup` MUI para Despesa/Receita ao lado
- [X] T050 [US2] Criar `apps/erp/web/src/features/cost-center-analysis/pages/cost-center-analysis-page.tsx`: `PageHeader` + toolbar + `ListPagePanel` com `cost-center-analysis-table`; três estados — carregando (skeleton/`CircularProgress`), erro (`ListLoadErrorAlert`), vazio (`EmptyState`, quando `report.items.length === 0`) — mesmo molde estrutural de `financial-result-page.tsx` (depende de T046, T048, T049)
- [X] T051 [P] [US2] Criar `apps/erp/web/src/features/cost-center-analysis/index.ts`: barrel export de `CostCenterAnalysisPage` + tipos públicos
- [X] T052 [US2] Criar `apps/erp/web/src/features/cost-center-analysis/GUIA.md` (obrigatório): manual de negócio para leigo — o que é, para que serve (visão macro de gasto/entrada por departamento), como usar (escolher período, alternar Despesa/Receita, ler a barra de participação), mesmo tom de `financial-results/GUIA.md`
- [X] T053 [P] [US2] Adicionar `"pie-chart": PieChartOutlineOutlined` ao `NAV_ICON_MAP` de `apps/erp/web/src/lib/nav-icons.tsx` (import `PieChartOutlineOutlined` de `@mui/icons-material/PieChartOutlineOutlined`)
- [X] T054 [US2] Adicionar o leaf `financas-analise-centro-custo` (`label: "Análise por centro de custo"`, `path: "/financas/analise-centro-de-custo"`, `icon: "pie-chart"`) em `apps/erp/web/src/lib/navigation.ts`, logo após `financas-relatorios-resultados` no primeiro `panelGroups` de Finanças (depende de T053)
- [X] T055 [US2] Criar `apps/erp/web/src/app/(app)/financas/analise-centro-de-custo/page.tsx`: rota fina reexportando `CostCenterAnalysisPage` de `@/features/cost-center-analysis` (mesmo padrão de `financas/relatorios-de-resultados/page.tsx`) (depende de T050, T051)

**Checkpoint**: US2 completa e testável de forma independente — nova tela, filtro Despesa/Receita, bucket "Outros", loading/erro/vazio.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Remover os mocks que só existiam para sustentar a DRE, e atualizar a documentação (`AGENTS.md` dos dois apps) na mesma operação — princípio I da constituição.

- [X] T056 Rodar `pnpm --filter @citybox/erp-api db:backfill:financial-group-classification` no banco local de desenvolvimento e confirmar (via `psql`/Prisma Studio) que as organizações existentes têm `caixa-e-bancos`/`ativo` com `classification=patrimonial` (depende de T011, T003)
- [X] T057 [P] Confirmar via `grep -rn "getFinancialResultReport\|financial-result.service" apps/erp/web/src` que só `financial-results/index.ts` ainda referencia o service antigo; remover a linha do `index.ts` e então remover `apps/erp/web/src/features/financial-results/services/financial-result.service.ts` e `apps/erp/web/src/features/financial-results/data/mock-result-entries.ts` (depende de T031)
- [X] T058 [P] Confirmar via `grep -rn "financial-group.service\|MOCK_FINANCIAL_GROUPS" apps/erp/web/src` que, após T057, só `financial-groups/index.ts` ainda referencia o mock; remover a linha do `index.ts` e então remover `apps/erp/web/src/features/financial-groups/services/financial-group.service.ts` e `apps/erp/web/src/features/financial-groups/data/mock-financial-groups.ts`
- [X] T059 [P] Confirmar via `grep -rn "chart-of-account.service\|MOCK_CHART_OF_ACCOUNTS" apps/erp/web/src` que, após T057, só `chart-of-accounts/index.ts` ainda referencia o mock; remover a linha do `index.ts` e então remover `apps/erp/web/src/features/chart-of-accounts/services/chart-of-account.service.ts` e `apps/erp/web/src/features/chart-of-accounts/data/mock-chart-of-accounts.ts`
- [X] T060 Rodar `grep -rn "MOCK_RESULT_ENTRIES\|MOCK_CHART_OF_ACCOUNTS\|MOCK_FINANCIAL_GROUPS" apps/erp/web/src` e confirmar que não retorna nada (depende de T057, T058, T059)
- [X] T061 Atualizar `apps/erp/api/AGENTS.md` §9 (bloco "Finance"): adicionar linha na tabela de submódulos para `reports/` (`GET v1/reports/income-statement`, `GET v1/reports/cost-centers`, permissão `org.view`, agregação via `groupBy`); documentar `FinancialGroup.classification` (`resultado`/`patrimonial`, não exposto na API de cadastro) e o script `db:backfill:financial-group-classification`; remover/atualizar a frase antiga "plano de contas/centros ainda não entram como FK em `FinancialEntry.categoryName`" (já resolvida por `001-financial-entries`, o texto só não refletia); adicionar entrada em §12 (Histórico de Mudanças Estruturais)
- [X] T062 Atualizar `apps/erp/web/AGENTS.md`: §4.5 — bullet de `financial-results` passa de "DRE mock" para "DRE real (`/v1/reports/income-statement`)", remove a menção aos mocks de grupo/plano mantidos; nova entrada para `features/cost-center-analysis`; §4.1 (bloco Finanças) — adicionar leaf "Análise por centro de custo"; §9 (tabela de módulos) — atualizar linha "Relat. resultados" para **MUI+API**, adicionar linha "Análise por centro de custo"; §12 — nova entrada de changelog
- [X] T063 Rodar `pnpm --filter @citybox/erp-api build && pnpm --filter @citybox/erp-api lint && pnpm --filter @citybox/erp-api typecheck && pnpm --filter @citybox/erp-api test` — gate backend (depende de todas as tasks de backend)
- [X] T064 Rodar `pnpm --filter @citybox/erp-web typecheck && pnpm --filter @citybox/erp-web lint` — gate frontend (depende de T060)
- [X] T065 Executar o roteiro completo de [quickstart.md](./quickstart.md) (US1 + US2 + regressão dos 3 cadastros) manualmente contra o ambiente local — **parcial**: verificação automatizada completa (639 testes backend cobrindo 1:1 os cenários de aceite + verificação real contra Postgres do seed/backfill de `classification`); o roteiro de clique no navegador (login Keycloak + telas) não foi executado nesta sessão — porta 3114 já ocupada por um container Docker pré-existente que não me cabia reiniciar sem autorização; ver relatório final

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depende de Setup — **BLOQUEIA** as duas user stories
- **User Story 1 (Phase 3)**: depende só de Foundational — pode começar assim que a Phase 2 terminar
- **User Story 2 (Phase 4)**: depende só de Foundational — **independente de US1** (usa o mesmo `FinanceReportRepository`/`reports.module.ts` criados na Phase 2/3, mas nenhuma lógica de US2 depende de US1 estar completa; se ambas forem feitas em paralelo, T020/T024/T025 — criação/registro de `reports.module.ts` — precisam ser coordenadas por quem pega US1, já que US2 só **estende** o módulo em T036/T040)
- **Polish (Phase 5)**: depende de US1 e US2 completas (remoção de mock e docs cobrem as duas)

### Within Each User Story

- Testes (`.spec.ts`) escritos e rodando **RED** antes da implementação do use case
- DTOs → use case → módulo/presenter → DTO de rota → rota → registro no módulo pai (backend)
- DTO → mapper → service → query-keys → hook → componentes → página → rota Next.js (frontend)

### Parallel Opportunities

- Dentro da Phase 2: T005/T006 (seed), T008 (entidade), T010 (test factory), T012/T013 (interface/erro), T015/T016 (in-memory) podem rodar em paralelo entre si onde marcado `[P]` — respeitando as dependências sequenciais do campo `classification` (T002→T003→T004 é sempre sequencial)
- Depois da Phase 2: **times diferentes podem tocar US1 e US2 ao mesmo tempo** (mesmo módulo backend, arquivos majoritariamente distintos — só a edição final de `reports.module.ts`/`finance-report.presenter.ts` precisa de coordenação, já sinalizada acima)
- Frontend de US1 e US2 são pastas de feature totalmente distintas (`financial-results/` vs `cost-center-analysis/`) — paralelizáveis sem conflito de arquivo

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Depois de T002→T003→T004 (sequencial, migration):
Task: "Adicionar classification ao SeedFinancialGroup em seed-template.types.ts" (T005)
Task: "Estender FinancialGroup entity com classification" (T008)
Task: "Criar FinanceReportRepository interface" (T012)
Task: "Criar InvalidReportPeriodError" (T013)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRITICAL — bloqueia as duas stories)
3. Completar Phase 3: User Story 1 (DRE real)
4. **PARAR e VALIDAR**: testar US1 de forma independente via `quickstart.md` § US1
5. A DRE real já entrega valor sozinha — fecha o ciclo dos 3 cadastros mesmo sem a análise por centro de custo

### Incremental Delivery

1. Setup + Foundational → base pronta
2. US1 (DRE) → testar independente → demo (MVP)
3. US2 (análise por centro de custo) → testar independente → demo
4. Polish (mocks removidos, docs atualizados) → gates verdes → entrega completa

### Parallel Team Strategy

Com dois desenvolvedores: ambos completam Setup + Foundational juntos; depois, um pega US1 (backend `get-income-statement` + frontend `financial-results`) e outro pega US2 (backend `get-cost-center-analysis` + frontend `cost-center-analysis` nova) — coordenando só a edição final de `reports.module.ts` (T024 vs T036/T040) e `finance-report.presenter.ts` (T021 vs T037).

---

## Notes

- [P] tasks = arquivos diferentes, sem dependência entre si
- [Story] mapeia a tarefa à user story para rastreabilidade
- Rodar os testes e confirmar que falham (RED) antes de implementar cada use case
- Não commitar sem autorização explícita do usuário (regra do projeto)
- Parar em qualquer checkpoint para validar a story de forma independente
