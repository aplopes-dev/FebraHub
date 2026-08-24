# Tasks: Extrato financeiro consolidado

**Input**: Design documents from `/specs/erp/004-financial-statement/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/financial-statement-api.md](./contracts/financial-statement-api.md), [quickstart.md](./quickstart.md)

**Tests**: Backend segue TDD obrigatório por convenção do projeto (`CLAUDE.md` / `api/AGENTS.md` — todo use case novo/alterado tem `.spec.ts` com repositório in-memory, escrito **antes** da implementação — mesmo padrão de `001`/`002`/`003`). Frontend não tem infraestrutura de teste em `erp-web` (`research.md` D9); validação end-to-end é manual, via `quickstart.md`.

**Organization**: Tarefas agrupadas por user story (prioridades de `spec.md`). Diferente de `003` (onde US1/US2 eram rotas/páginas separadas e paralelizáveis), aqui as 3 user stories vivem na **mesma tela** (`/financas/extratos`): US2 e US3 se encaixam visualmente na página que US1 entrega — dependem do *shell* da página existir (Phase 3), mas **não têm nenhuma dependência de backend** (zero tarefa de API nas Phases 4/5).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: US1/US2/US3, mapeando para as user stories de `spec.md`
- Caminhos de arquivo sempre relativos à raiz do monorepo (`/root/aplopes-city`)

---

## Phase 1: Setup

**Purpose**: Preparação mínima — feature entra num app já estruturado (brownfield), sem inicialização de projeto nem migration (`data-model.md`: zero model novo).

- [X] T001 Confirmar infraestrutura local no ar (`pnpm infra:up:postgres`) e confirmar que `001-financial-entries`/`002-bank-account-ledger` já estão implementadas em produção (`FinancialEntry`/`FinancialEntryAllocation`/`BankAccount`/`BankTransaction` já existem e têm dados de teste) antes de iniciar a Phase 2 — ver `spec.md` § Assumptions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Estende `finance/financial-entries` (filtro por competência + conta bancária, validação de período nos 2 eixos) — infraestrutura que **US1** consome (endpoint de listagem estendido + endpoint de resumo novo). **US2 e US3 não dependem desta fase** (zero mudança de backend nas duas — `research.md` D6/D7).

**⚠️ CRITICAL**: US1 não pode começar antes desta fase terminar.

- [X] T002 [P] Estender `apps/erp/api/src/modules/finance/financial-entries/domain/repositories/financial-entry.repository.interface.ts`: adicionar `competenceFrom?: Date`, `competenceTo?: Date`, `bankAccountId?: string` a `FinancialEntryListCriteria`; adicionar `abstract sumAmountsByOperation(organizationId: string, criteria: Omit<FinancialEntryListCriteria, 'skip' | 'take'>): Promise<{ operation: FinancialEntryOperation; totalCents: number }[]>` à classe `FinancialEntryRepository` — shapes exatamente como em [data-model.md](./data-model.md)
- [X] T003 [P] Criar `apps/erp/api/src/modules/finance/financial-entries/domain/errors/invalid-statement-period.error.ts`: `InvalidStatementPeriodError extends DomainError` (mesmo padrão de `InvalidReportPeriodError` do módulo `reports/`) — mensagem externa "A data final não pode ser anterior à data inicial"
- [X] T004 Criar `apps/erp/api/src/modules/finance/financial-entries/domain/validators/period-range.validator.ts`: `assertValidPeriodRange(from?: Date, to?: Date): void` — lança `InvalidStatementPeriodError` só quando **ambos** vierem preenchidos e `to.getTime() < from.getTime()` (depende de T003)
- [X] T005 [P] Estender `apps/erp/api/src/modules/finance/financial-entries/application/dtos/financial-entry.dto.ts`: adicionar `competenceFrom?: Date`, `competenceTo?: Date`, `bankAccountId?: string` a `ListFinancialEntriesDto`
- [X] T006 [P] Refatorar `apps/erp/api/src/modules/finance/financial-entries/infrastructure/http/routes/shared/financial-entry.dto.ts`: extrair `FinancialEntryFilterQueryDto` (classe base) com os campos comuns já existentes em `ListFinancialEntriesQueryDto` (`operation`, `status`, `chartOfAccountId`, `costCenterId`, `search`, `dueFrom`, `dueTo`) **mais** os 3 campos novos — `bankAccountId?: string` (`@IsOptional() @IsUUID(4)`), `competenceFrom?: string` (`@IsOptional() @IsDateString()`, exemplo `'2026-08-01'`), `competenceTo?: string` (idem, exemplo `'2026-08-31'`); `ListFinancialEntriesQueryDto extends FinancialEntryFilterQueryDto` mantém só `tab`/`sort`/`page`/`perPage` — `research.md` D5
- [X] T007 Estender `apps/erp/api/src/modules/finance/financial-entries/infrastructure/database/prisma-financial-entry.repository.ts`: `buildWhere` ganha `if (criteria.competenceFrom || criteria.competenceTo) and.push({ competenceDate: { ...(criteria.competenceFrom ? { gte: criteria.competenceFrom } : {}), ...(criteria.competenceTo ? { lte: criteria.competenceTo } : {}) } })` e `if (criteria.bankAccountId) and.push({ bankAccountId: criteria.bankAccountId })` (depende de T002)
- [X] T008 Implementar `sumAmountsByOperation` em `prisma-financial-entry.repository.ts`: `prisma.scoped.financialEntry.groupBy({ by: ['operation'], where: this.buildWhere(organizationId, criteria), _sum: { amountCents: true } })`, convertido em `[{ operation, totalCents: group._sum.amountCents ?? 0 }]` — reaproveita o `buildWhere` de T007, nunca `findMany` + soma em memória (Constitution II) (depende de T002, T007)
- [X] T009 [P] Estender `apps/erp/api/src/modules/finance/financial-entries/tests/in-memory-financial-entry.repository.ts`: método privado `filter()` ganha os mesmos 2 filtros de T007 (`competenceFrom`/`competenceTo` sobre `item.competenceDate`, `bankAccountId` exato); implementar `sumAmountsByOperation(organizationId, criteria)` reaproveitando `filter()` e reduzindo por `item.operation` — mesmo resultado que a implementação Prisma devolveria (depende de T002)
- [X] T010 Estender `apps/erp/api/src/modules/finance/financial-entries/application/use-cases/list-financial-entries/list-financial-entries.use-case.spec.ts` (RED — escrever e rodar antes de T011): casos novos cobrindo (a) filtro por `competenceFrom`/`competenceTo` inclui só lançamentos com `competenceDate` no intervalo; (b) filtro por `bankAccountId` inclui só lançamentos daquela conta; (c) `dueTo < dueFrom` lança `InvalidStatementPeriodError`; (d) `competenceTo < competenceFrom` lança `InvalidStatementPeriodError`; (e) período válido num eixo com o outro eixo vazio não lança nada (depende de T005, T009)
- [X] T011 Estender `apps/erp/api/src/modules/finance/financial-entries/application/use-cases/list-financial-entries/list-financial-entries.use-case.ts` (GREEN): repassar `competenceFrom`/`competenceTo`/`bankAccountId` de `input` para `criteria`; chamar `assertValidPeriodRange(input.dueFrom, input.dueTo)` e `assertValidPeriodRange(input.competenceFrom, input.competenceTo)` antes de `count`/`findAll` (depende de T004, T010)
- [X] T012 Estender `apps/erp/api/src/modules/finance/financial-entries/infrastructure/http/routes/list-financial-entries/list-financial-entries.route.ts`: repassar `query.bankAccountId`, `competenceFrom: query.competenceFrom ? new Date(query.competenceFrom) : undefined`, `competenceTo: query.competenceTo ? new Date(query.competenceTo) : undefined` para `listFinancialEntries.execute()` (depende de T006, T011)

**Checkpoint**: `GET /v1/financial-entries` aceita os filtros novos e valida período nos 2 eixos; `sumAmountsByOperation` pronto (real + in-memory) — US1 pode começar.

---

## Phase 3: User Story 1 - Consultar e filtrar o extrato (Priority: P1) 🎯 MVP

**Goal**: `/financas/extratos` deixa de ser `PlaceholderPage` e passa a listar as movimentações da organização ativa, filtráveis por período (competência ou vencimento), tipo, status, conta bancária, categoria, centro de custo e busca livre, com cards de resumo (entradas/saídas/saldo) recalculados sobre o conjunto filtrado inteiro.

**Independent Test**: Criar um lançamento de recebimento de R$ 10.000 com competência e vencimento de hoje, abrir o Extrato, filtrar por competência = hoje + tipo = recebimento, e conferir que o lançamento aparece na lista e que os cards de resumo refletem esse total.

### Tests for User Story 1 (TDD obrigatório) ⚠️

> Escrever e rodar (RED) antes de implementar T015

- [X] T013 [P] [US1] Criar `apps/erp/api/src/modules/finance/financial-entries/application/dtos/financial-entries-summary.dto.ts`: `GetFinancialEntriesSummaryInput = { organizationId: string; operation?: FinancialEntryOperation; status?: FinancialEntryStatus[]; chartOfAccountId?: string[]; costCenterId?: string[]; bankAccountId?: string; search?: string; dueFrom?: Date; dueTo?: Date; competenceFrom?: Date; competenceTo?: Date }`; `FinancialEntriesSummaryDto = { receivableCents: number; payableCents: number; netCents: number }` — shapes exatamente como em [data-model.md](./data-model.md) § `FinancialEntriesSummary`
- [X] T014 [US1] Criar `apps/erp/api/src/modules/finance/financial-entries/application/use-cases/get-financial-entries-summary/get-financial-entries-summary.use-case.spec.ts` cobrindo: (a) soma `amountCents` corretamente em `receivableCents`/`payableCents` por operação, com `netCents = receivable - payable` (podendo ser negativo); (b) lançamento soft-deleted não entra na soma; (c) respeita os mesmos filtros de tipo/status/categoria/centro de custo/conta bancária/busca/período (competência **e** vencimento) que a listagem; (d) lançamento rateado entre 2+ categorias/centros de custo entra **uma vez** só (soma o lançamento, não duplica por linha de rateio); (e) nenhum lançamento no conjunto filtrado → `{ receivableCents: 0, payableCents: 0, netCents: 0 }`; (f) `to < from` em qualquer um dos 2 eixos lança `InvalidStatementPeriodError`; (g) lançamentos de outra organização não vazam para a soma (depende de T013, T009)

### Implementation for User Story 1 — Backend

- [X] T015 [US1] Criar `apps/erp/api/src/modules/finance/financial-entries/application/use-cases/get-financial-entries-summary/get-financial-entries-summary.use-case.ts`: injeta `FinancialEntryRepository`; chama `assertValidPeriodRange` nos 2 eixos; monta `criteria` (mesmos campos de `ListFinancialEntriesUseCase`, sempre `tab: 'active'` implícito — sem parâmetro `tab`, `FinancialEntryListCriteria` sem `tab` já cai no ramo `deletedAt: null` de `buildWhere`); chama `sumAmountsByOperation`; reduz o array retornado em `{ receivableCents, payableCents, netCents }` (0 para operação ausente no resultado) (depende de T014, T004, T008)
- [X] T016 [P] [US1] Criar `apps/erp/api/src/modules/finance/financial-entries/infrastructure/http/routes/get-financial-entries-summary/get-financial-entries-summary.dto.ts`: `GetFinancialEntriesSummaryQueryDto extends FinancialEntryFilterQueryDto` (sem campos extras — resumo nunca pagina/ordena/expõe aba) (depende de T006)
- [X] T017 [US1] Criar `apps/erp/api/src/modules/finance/financial-entries/infrastructure/http/routes/get-financial-entries-summary/get-financial-entries-summary.route.ts`: `@Controller('v1/financial-entries')`, `@Get('summary')`, `@RequirePermission('org.view')`, injeta `GetFinancialEntriesSummaryUseCase`, converte `query.dueFrom`/`dueTo`/`competenceFrom`/`competenceTo` em `Date`, chama `execute()`, devolve `{ data: dto }` — molde de `list-financial-entries.route.ts` (depende de T015, T016)
- [X] T018 [US1] Registrar `GetFinancialEntriesSummaryUseCase` em `providers` e `GetFinancialEntriesSummaryRoute` em `controllers` de `apps/erp/api/src/modules/finance/financial-entries/financial-entries.module.ts` — **`GetFinancialEntriesSummaryRoute` (`GET summary`) precisa vir ANTES de `FindFinancialEntryByIdRoute` (`GET :id`) no array `controllers`**, senão o Nest casa `/v1/financial-entries/summary` com a rota `:id` e devolve `FinancialEntryNotFoundError` em vez do resumo (mesmo comentário já existente no módulo: "rotas de caminho fixo antes de `:id`") (depende de T017)

### Implementation for User Story 1 — Frontend (feature nova, `/financas/extratos` real)

- [X] T019 [P] [US1] Criar `apps/erp/web/src/features/financial-statement/types/financial-statement.ts`: `FinancialStatementDateAxis = "competence" | "due"`; `FinancialStatementFilters = { operations: FinancialEntryOperation[]; statuses: FinancialEntryStatus[]; categoryIds: string[]; costCenterIds: string[]; bankAccountId: string | null; dateAxis: FinancialStatementDateAxis; dateFrom: string | null; dateTo: string | null }` (reaproveita `FinancialEntryOperation`/`FinancialEntryStatus` de `@/features/financial-entries/types/financial-entry` — não redefine); `FinancialStatementListParams = { search: string; filters: FinancialStatementFilters; page: number; perPage: number }`; `FinancialStatementSummary = { receivable: number; payable: number; net: number }` (reais) — `data-model.md` § Frontend types
- [X] T020 [US1] Criar `apps/erp/web/src/features/financial-statement/lib/financial-statement-filters.ts`: `createEmptyFinancialStatementFilters()` (`dateAxis: "competence"` por padrão, resto vazio/null) + `countActiveFinancialStatementFilters(filters)` — molde de `financial-entry-filters.ts`, conta também `bankAccountId` e o par `dateFrom`/`dateTo` (depende de T019)
- [X] T021 [P] [US1] Criar `apps/erp/web/src/features/financial-statement/api/financial-statement.dto.ts`: `FinancialStatementSummaryDto = { receivableCents: number; payableCents: number; netCents: number }` — espelha `contracts/financial-statement-api.md` § `GET /v1/financial-entries/summary`
- [X] T022 [US1] Criar `apps/erp/web/src/features/financial-statement/api/financial-statement.mapper.ts`: `toFinancialStatementSummary(dto): FinancialStatementSummary` (÷100 nos 3 campos); `buildFinancialStatementQuery(params: FinancialStatementListParams): URLSearchParams` — monta `operation` (só quando `operations.length === 1`, mesmo critério de `financial-entries.service.ts`), `status[]`, `chartOfAccountId[]`, `costCenterId[]`, `bankAccountId`, `search`, e o par `competenceFrom`/`competenceTo` **ou** `dueFrom`/`dueTo` conforme `filters.dateAxis` (nunca os dois pares ao mesmo tempo) — função única reaproveitada pelos 2 endpoints em T023, evita duplicar a lógica do eixo (depende de T019, T021)
- [X] T023 [US1] Criar `apps/erp/web/src/features/financial-statement/api/financial-statement.service.ts`: `listFinancialStatementApi(params)` → `GET /v1/financial-entries?${buildFinancialStatementQuery(params)}&tab=active&sort=due_date_desc&page=${params.page}&perPage=${params.perPage}` reaproveitando `toFinancialEntryListItem`/`FinancialEntryListResponseDto` de `@/features/financial-entries/api/*` (mesmo shape de item de lista — não duplica o mapper); `getFinancialStatementSummaryApi(params)` → `GET /v1/financial-entries/summary?${buildFinancialStatementQuery(params)}` + `toFinancialStatementSummary` (depende de T022)
- [X] T024 [P] [US1] Criar `apps/erp/web/src/features/financial-statement/hooks/query-keys.ts`: `financialStatementKeys.list(scope, params)`, `.summary(scope, params)`, `.bankAccountBalances(scope)` (esta última usada só na Phase 4)
- [X] T025 [US1] Criar `apps/erp/web/src/features/financial-statement/hooks/use-financial-statement-list.ts`: `search`/`debouncedSearch` (400ms, molde de `use-financial-entry-list.ts`), `filters: FinancialStatementFilters`, `page`/`perPage` (default 20); `useQuery` via `listFinancialStatementApi`; setters de `filters`/`search`/`dateAxis` resetam `page` para 1 (depende de T020, T023, T024)
- [X] T026 [US1] Criar `apps/erp/web/src/features/financial-statement/hooks/use-financial-statement-summary.ts`: recebe `search`/`filters` como parâmetros (não duplica estado — usa exatamente os mesmos valores do hook de lista, T025, para garantir que os cards somem o mesmo conjunto filtrado — FR-008); `useQuery` via `getFinancialStatementSummaryApi` (depende de T023, T024)
- [X] T027 [US1] Criar `apps/erp/web/src/features/financial-statement/components/financial-statement-toolbar.tsx`: `SearchInput` + botão "Filtro" com badge de contagem (`countActiveFinancialStatementFilters`) — molde de `financial-entry-list-toolbar.tsx`, sem o menu de ordenação (extrato não expõe ordenação visível) (depende de T020)
- [X] T028 [US1] Criar `apps/erp/web/src/features/financial-statement/components/financial-statement-filters-drawer.tsx`: molde de `financial-entry-filters-drawer.tsx` — grupos Tipo/Status/Categoria financeira/Centro de custo idênticos (reaproveitando `useChartOfAccountOptionsQuery`/`useCostCenterOptionsQuery`); **grupo novo "Conta bancária"** (lista de rádio de opção única via `useBankAccountOptionsQuery` de `@/features/bank-accounts/hooks/use-bank-account-options-query`); **toggle novo** "Competência"/"Vencimento" (`ToggleButtonGroup` do MUI) acima do `DateRangePicker`, que só troca o rótulo do eixo sem apagar `dateFrom`/`dateTo` ao alternar (depende de T019, T020)
- [X] T029 [P] [US1] Criar `apps/erp/web/src/features/financial-statement/components/financial-statement-summary-cards.tsx`: 3 `SummaryCard` — "Entradas" (verde), "Saídas" (vermelho, valor com `-`), "Saldo do período" (verde se ≥0, vermelho se negativo) — molde de `financial-result-summary.tsx` (FR-010); props `{ receivable: number; payable: number; net: number }` (sem tipo próprio da feature — recebe primitivos)
- [X] T030 [P] [US1] Criar `apps/erp/web/src/features/financial-statement/components/financial-statement-empty-state.tsx`: prop `variant: "no-data" | "no-match"` — `"no-data"`: `EmptyState` "Nenhuma movimentação registrada", sem ação (organização sem nenhum lançamento); `"no-match"`: "Nenhuma movimentação encontrada com esses filtros" + botão "Limpar filtros" via prop `onClearFilters` — FR-014, edge cases do `spec.md`
- [X] T031 [US1] Criar `apps/erp/web/src/features/financial-statement/components/financial-statement-table.tsx`: `DataTable` com colunas Parte/Descrição, Tipo (reaproveita `FinancialEntryOperationBadge` de `@/features/financial-entries/components/financial-entry-operation-badge` — entrada/saída verde/vermelho, FR-010), Categoria, Data (rótulo "Vencimento" ou "Competência" conforme `dateAxis` ativo — mesmo campo de data do item que está sendo filtrado), Valor, Status, e uma coluna final "Ver lançamento" (`Link` MUI para `/financas/lancamentos/[id]`, `onClick` com `stopPropagation` — FR-003, só navegação); `pagination` via prop do `DataTable` (`manualPagination`, Constitution II) (depende de T019)
- [X] T032 [US1] Criar `apps/erp/web/src/features/financial-statement/pages/financial-statement-page.tsx`: `PageHeader` "Extrato" + `financial-statement-summary-cards` (dados de `use-financial-statement-summary`) no cabeçalho (molde de `financial-result-page.tsx`); `financial-statement-toolbar` + `financial-statement-filters-drawer` + `financial-statement-table` dentro de `ListPagePanel`; estados explícitos — carregando (`CircularProgress`), erro (`ListLoadErrorAlert` com retry), vazio (`financial-statement-empty-state`, variante escolhida por `countActiveFinancialStatementFilters(filters) > 0`) — FR-014 (depende de T025, T026, T027, T028, T029, T030, T031)
- [X] T033 [P] [US1] Criar `apps/erp/web/src/features/financial-statement/index.ts`: barrel export de `FinancialStatementPage` + tipos públicos
- [X] T034 [US1] Criar `apps/erp/web/src/features/financial-statement/GUIA.md` (obrigatório): manual de negócio para leigo — o que é o Extrato, como alternar entre competência e vencimento, o que os 3 cards de resumo significam (e que o saldo exibido é do **período filtrado**, não o saldo bancário real — `spec.md` § Assumptions, distinto do saldo por conta da Phase 4), como usar busca e filtros — mesmo tom de `financial-entries/GUIA.md`/`financial-results/GUIA.md`
- [X] T035 [US1] Reescrever `apps/erp/web/src/app/(app)/financas/extratos/page.tsx`: troca o `PlaceholderPage` por uma rota fina reexportando `FinancialStatementPage` de `@/features/financial-statement` (mesmo padrão de `financas/relatorios-de-resultados/page.tsx`) (depende de T032, T033)

**Checkpoint**: US1 completa e testável de forma independente — extrato real, filtros (tipo/status/categoria/centro de custo/conta bancária/eixo de data/busca), cards de resumo corretos sobre o conjunto filtrado inteiro, estados de carregando/erro/vazio tratados.

---

## Phase 4: User Story 2 - Ver o saldo de cada conta bancária (Priority: P2)

**Goal**: Na mesma tela do Extrato, o operador vê o saldo atual de cada conta bancária cadastrada, sem navegar até `/financas/contas-bancarias`.

**Independent Test**: Com duas contas bancárias cadastradas, abrir o Extrato e conferir que o saldo de cada uma aparece na tela, batendo com o saldo mostrado na tela de Contas bancárias.

**Backend**: nenhuma tarefa — reaproveita `GET /v1/bank-accounts` como está (`research.md` D6).

- [X] T036 [US2] Criar `apps/erp/web/src/features/financial-statement/hooks/use-bank-account-balances.ts`: `useQuery` chamando `listBankAccountsApi({ search: "", page: 1, perPage: 100 })` (reaproveitado de `@/features/bank-accounts/api/bank-accounts.service` — zero endpoint novo), `queryKey: financialStatementKeys.bankAccountBalances(scope)`, `staleTime: 5 * 60 * 1000` (mesmo teto de `useBankAccountOptionsQuery`)
- [X] T037 [US2] Criar `apps/erp/web/src/features/financial-statement/components/bank-account-balances-panel.tsx`: lista compacta (nome do banco/conta + `currentBalance` formatado em BRL) posicionada junto aos cards de resumo; estado vazio "Nenhuma conta bancária cadastrada" quando a lista vier vazia (depende de T036)
- [X] T038 [US2] Integrar `bank-account-balances-panel` em `apps/erp/web/src/features/financial-statement/pages/financial-statement-page.tsx`, ao lado ou logo abaixo de `financial-statement-summary-cards` no cabeçalho da tela (depende de T037, T032)

**Checkpoint**: US2 completa e testável de forma independente — saldo por conta visível no Extrato, batendo com a tela de Contas bancárias.

---

## Phase 5: User Story 3 - Agrupar lançamentos selecionados (Priority: P3)

**Goal**: O operador marca duas ou mais linhas da lista e vê, numa barra de seleção, a contagem e o valor total somado dessas linhas.

**Independent Test**: Com pelo menos 3 lançamentos visíveis, selecionar 2 deles e conferir que a barra de seleção mostra "2 lançamentos selecionados" e o valor somado correto (respeitando o sinal de entrada/saída).

**Backend**: nenhuma tarefa — soma 100% client-side sobre linhas já carregadas (`spec.md` § Assumptions, `research.md` D7).

- [X] T039 [US3] Criar `apps/erp/web/src/features/financial-statement/hooks/use-financial-statement-selection.ts`: `Set<string>` de ids selecionados (linhas da página atual) + `Map<string, { operation: FinancialEntryOperation; amountCents: number }>` das linhas carregadas; deriva `{ count: number; netCents: number }` (soma `receivable`, subtrai `payable` — FR-011); `toggle(id)`/`clear()`; `useEffect` que chama `clear()` quando `filters`/`dateAxis`/`search`/`page` mudam (recebidos como dependências do efeito) — FR-011 edge case ("trocar de página ou filtro limpa a seleção")
- [X] T040 [US3] Estender `apps/erp/web/src/features/financial-statement/components/financial-statement-table.tsx`: coluna nova de checkbox como primeira coluna (`width: 40`), `render: (entry) => <Box onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}><Checkbox checked={selectedIds.has(entry.id)} onChange={() => onToggleSelect(entry.id)} /></Box>` — mesmo padrão de controle interno por coluna já documentado em `packages/mui/src/organisms/data-table/data-table.tsx:40` (`research.md` D7); props novas `selectedIds: Set<string>` / `onToggleSelect: (id: string) => void` (depende de T031, T039)
- [X] T041 [US3] Criar `apps/erp/web/src/features/financial-statement/components/financial-statement-selection-bar.tsx`: barra fixa no rodapé do `ListPagePanel`, renderizada só quando `count > 0` — "{count} lançamentos selecionados" + valor total formatado em BRL (verde se `netCents ≥ 0`, vermelho se negativo) + botão "Limpar seleção" (chama `clear()`) (depende de T039)
- [X] T042 [US3] Integrar seleção em `apps/erp/web/src/features/financial-statement/pages/financial-statement-page.tsx`: instanciar `use-financial-statement-selection` com as dependências de reset (`filters`, `dateAxis`, `search`, `page` do hook de lista); repassar `selectedIds`/`onToggleSelect` para `financial-statement-table`; renderizar `financial-statement-selection-bar` condicionalmente (depende de T040, T041, T032)

**Checkpoint**: US3 completa e testável de forma independente — todas as 3 user stories funcionais.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Atualizar a documentação (`AGENTS.md` dos dois apps) na mesma operação — princípio I da constituição — e rodar os gates finais.

- [X] T043 Atualizar `apps/erp/api/AGENTS.md` §9 (bloco "Finance" → `financial-entries/`): documentar os filtros novos de `GET /v1/financial-entries` (`competenceFrom`/`competenceTo`/`bankAccountId`), a validação de período nos 2 eixos (422), e a rota nova `GET /v1/financial-entries/summary` (permissão `org.view`, agregação via `groupBy(['operation'])`); adicionar entrada em §12 (Histórico de Mudanças Estruturais)
- [X] T044 Atualizar `apps/erp/web/AGENTS.md`: §4.1 (bloco Finanças) — `financas/extratos` passa de placeholder para tela real (`FinancialStatementPage`); §4.5/§9 — nova entrada para `features/financial-statement` (extrato: filtros, cards de resumo, saldo por conta, seleção com soma); §12 — nova entrada de changelog
- [X] T045 Rodar `pnpm --filter @citybox/erp-api build && pnpm --filter @citybox/erp-api lint && pnpm --filter @citybox/erp-api typecheck && pnpm --filter @citybox/erp-api test` — gate backend (depende de todas as tasks de backend, T002–T018)
- [X] T046 Rodar `pnpm --filter @citybox/erp-web typecheck && pnpm --filter @citybox/erp-web lint` — gate frontend (depende de todas as tasks de frontend, T019–T042)
- [X] T047 Executar o roteiro completo de [quickstart.md](./quickstart.md) (US1 + US2 + US3 + edge cases) manualmente contra o ambiente local (depende de T045, T046) — **parcial**: verificação automatizada completa (652 testes backend, 14 novos/estendidos em `list-financial-entries.use-case.spec.ts` + 9 novos em `get-financial-entries-summary.use-case.spec.ts`, cobrindo 1:1 os cenários de filtro/validação/agregação do roteiro) + verificação técnica (grep confirmando `PlaceholderPage` removido e `InvalidStatementPeriodError` presente); o roteiro de clique no navegador (login Keycloak + telas) não foi executado nesta sessão — portas 3114/3107 já ocupadas por containers Docker pré-existentes que não me cabia reiniciar sem autorização (mesma situação de `003-financial-reports-cost-center`); ver relatório final

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depende de Setup — **BLOQUEIA US1** (não bloqueia US2/US3, que não tocam backend)
- **User Story 1 (Phase 3)**: depende de Foundational — MVP, entrega a tela inteira (sem saldo por conta nem seleção)
- **User Story 2 (Phase 4)**: depende do *shell* da página existir (T032/T035 da Phase 3) — **não depende de Foundational** (zero tarefa de backend)
- **User Story 3 (Phase 5)**: depende da tabela existir (T031 da Phase 3) — **não depende de Foundational nem de US2**
- **Polish (Phase 6)**: depende de US1 completa; T047 depende também de US2/US3 se ambas forem entregues nesta rodada

### Within Each User Story

- Backend: DTO → teste (`.spec.ts`, RED) → use case (GREEN) → rota HTTP → registro no módulo
- Frontend: tipos → lib/mapper → service → query-keys → hooks → componentes → página → rota Next.js

### Parallel Opportunities

- Dentro da Phase 2: T002/T003 (interface/erro) podem rodar em paralelo entre si; T005/T006 (DTOs) em paralelo entre si e com T002/T003 — respeitando que T007/T008 dependem de T002, e T010/T011 dependem de T004/T005/T009
- Dentro da Phase 3 (US1): T013/T016 (DTOs backend) em paralelo; T019/T021/T024/T029/T030 (frontend, arquivos sem dependência cruzada) em paralelo
- **US2 (Phase 4) e US3 (Phase 5) podem ser feitas em paralelo entre si** assim que a Phase 3 terminar — arquivos majoritariamente distintos (`bank-account-balances-panel.tsx` vs. `financial-statement-selection-bar.tsx`); só a edição final de `financial-statement-table.tsx` (T040, seleção) e `financial-statement-page.tsx` (T038 vs. T042, integração) precisa de coordenação se dois devs tocarem os dois arquivos ao mesmo tempo

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Em paralelo, logo no início:
Task: "Estender FinancialEntryListCriteria + sumAmountsByOperation na interface" (T002)
Task: "Criar InvalidStatementPeriodError" (T003)
Task: "Estender ListFinancialEntriesDto (application)" (T005)
Task: "Extrair FinancialEntryFilterQueryDto (HTTP DTO)" (T006)
```

## Parallel Example: Phase 3 (User Story 1) — frontend

```bash
Task: "Criar types/financial-statement.ts" (T019)
Task: "Criar api/financial-statement.dto.ts" (T021)
Task: "Criar hooks/query-keys.ts" (T024)
Task: "Criar financial-statement-summary-cards.tsx" (T029)
Task: "Criar financial-statement-empty-state.tsx" (T030)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (bloqueia só US1)
3. Completar Phase 3: User Story 1
4. **PARAR e VALIDAR**: testar US1 de forma independente via `quickstart.md` § US1
5. `/financas/extratos` já deixa de ser "Em construção" e entrega o valor central pedido — filtro + resumo + lista

### Incremental Delivery

1. Setup + Foundational → base pronta (só para US1)
2. US1 (extrato real) → testar independente → demo (MVP)
3. US2 (saldo por conta) → testar independente → demo
4. US3 (seleção com soma) → testar independente → demo
5. Polish (docs atualizados, gates verdes) → entrega completa

### Parallel Team Strategy

Com dois desenvolvedores: um completa Setup + Foundational + Phase 3 (US1, MVP); a partir daí, US2 e US3 podem ser pegas por desenvolvedores diferentes em paralelo (nenhuma depende da outra, só do *shell* de US1 já existir) — coordenando apenas a integração final em `financial-statement-page.tsx` (T038 vs. T042).

---

## Notes

- [P] tasks = arquivos diferentes, sem dependência entre si
- [Story] mapeia a tarefa à user story para rastreabilidade
- Rodar os testes e confirmar que falham (RED) antes de implementar cada use case
- Não commitar sem autorização explícita do usuário (regra do projeto)
- Parar em qualquer checkpoint para validar a story de forma independente
- **Atenção à ordem de registro de rotas** (T018): `GET summary` precisa vir antes de `GET :id` no `controllers` de `financial-entries.module.ts`
