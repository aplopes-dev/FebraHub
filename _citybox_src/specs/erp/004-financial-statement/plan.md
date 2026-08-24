# Implementation Plan: Extrato financeiro consolidado

**Branch**: `004-financial-statement` | **Date**: 2026-08-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/erp/004-financial-statement/spec.md`

## Summary

`/financas/extratos` hoje é um `PlaceholderPage` (`apps/erp/web/src/app/(app)/financas/extratos/page.tsx`)
e `/financas` já redireciona para lá. A fatia entrega a tela real, somente-leitura, sem nenhum
model Prisma novo — reaproveitando `FinancialEntry`/`FinancialEntryAllocation` (`001-financial-entries`)
e `BankAccount`/`BankTransaction` (`002-bank-account-ledger`).

No backend (`apps/erp/api`), o módulo `finance/financial-entries` é **estendido**, não duplicado:
`ListFinancialEntriesUseCase`/`buildWhere` ganham filtro por competência (`competenceFrom`/`competenceTo`,
somando-se ao `dueFrom`/`dueTo` já existente — o eixo dual do FR-004/FR-015 é modelado como dois pares de
data independentes, não como um parâmetro de "eixo"; o frontend decide qual par preencher) e por
`bankAccountId`, além de uma validação de período nova (data final < inicial → 422, hoje ausente em
`dueFrom`/`dueTo`). Os cards de resumo (FR-008) vêm de um endpoint novo, `GET /v1/financial-entries/summary`,
que aceita os mesmos filtros da listagem e agrega `SUM(amountCents)` por `operation` via `groupBy` do Prisma
— mesmo padrão de `finance/reports` (`003-financial-reports-cost-center`), sem `findMany` + soma em memória.
Não nasce um módulo `finance/statement/` novo: a agregação é puramente sobre `FinancialEntry` (não cruza
`FinancialGroup`/`ChartOfAccount` como a DRE), então vive dentro de `financial-entries` — reaproveita o mesmo
`buildWhere`. O saldo por conta bancária (US2) **não tem mudança de backend**: reaproveita
`GET /v1/bank-accounts?perPage=100&tab=active`, o mesmo endpoint já consumido hoje pela tela de Contas
bancárias e pelo hook de opções (`useBankAccountOptionsQuery`) — cadastro de porte limitado (dezenas de
contas), mesmo raciocínio já aplicado a grupo financeiro/plano de contas/centro de custo nos relatórios.

No frontend (`apps/erp/web`), nasce `features/financial-statement/` com a anatomia canônica já usada por
`financial-results`/`cost-center-analysis` (api/hooks/lib/types/components/pages + `GUIA.md` obrigatório).
O drawer de filtros é modelado em `financial-entry-filters-drawer.tsx` (mesmo filtros de tipo/status/
categoria/centro de custo + `DateRangePicker`), estendido com o toggle de eixo de data e o filtro de conta
bancária. Os cards de resumo replicam a estrutura visual de `financial-result-summary.tsx` (3 `SummaryCard`
verde/vermelho/neutro). A seleção de linhas com soma (US3, FR-011) é construída do zero: nem o `DataTable`
de `@citybox/mui` nem o wrapper local (`packages/mui/src/organisms/data-table/data-table.tsx`) têm suporte a
seleção — mas o próprio componente já documenta o padrão de coluna com controle interno
(`render()` + `stopPropagation`), que é o ponto de extensão usado para a coluna de checkbox. A soma da
seleção é 100% client-side sobre as linhas já carregadas na página atual — não é uma nova agregação de
backend (confirmado pelas Assumptions do spec: "não existe nenhuma ação em lote").

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js runtime) em toda a fatia — NestJS 11 no backend
(`apps/erp/api`, `~5.7.3`), Next.js 16 (App Router) / React 19 no frontend (`apps/erp/web`, `~5.8.3`).

**Primary Dependencies**:
- Backend (`@citybox/erp-api`): NestJS 11, Prisma 7 (client em `generated/prisma`, adapter `@prisma/adapter-pg`),
  `class-validator`/`class-transformer` (DTOs HTTP), Swagger, Jest + ts-jest. Nenhuma dependência nova.
- Frontend (`@citybox/erp-web`): Next.js 16, React 19, `@citybox/mui` (`DataTable`, `Drawer`, `SearchInput`,
  `DateRangePicker`, `Typography`), `@mui/material` (`Checkbox` para a coluna de seleção — primitivo já
  dependência direta, não é um componente novo), `@tanstack/react-query` (server state). Nenhuma dependência
  nova.

**Storage**: PostgreSQL (banco `citybox_platform`, schema Postgres `erp`, single-schema —
`apps/erp/api/prisma/schema.prisma`). **Nenhum model novo, nenhuma migration** — a fatia inteira lê
`FinancialEntry`/`FinancialEntryAllocation`/`BankAccount`/`BankTransaction`, todos já `TENANT_SCOPED_MODELS`
e já indexados o suficiente (`@@index([organizationId, competenceDate])` já existe em `FinancialEntry`,
favorável ao novo filtro por competência).

**Testing**: Backend — Jest + ts-jest, `.spec.ts` por use case sobre repositório in-memory
(`tests/in-memory-financial-entry.repository.ts`, estendido com os novos filtros e o novo `groupBy`).
Frontend — sem infraestrutura de teste em `apps/erp/web` (mesma situação confirmada em
`001-financial-entries`/`002-bank-account-ledger`/`003-financial-reports-cost-center`); validação via
`quickstart.md` + `typecheck`/`lint`.

**Target Platform**: Servidor Linux (containers Docker em produção); navegador desktop (backoffice interno).

**Project Type**: Web application — feature dentro do par já estruturado `apps/erp/api` + `apps/erp/web`
(não é um projeto novo, não nasce um módulo backend novo — ver Summary).

**Performance Goals**: Sem meta numérica nova além do já estabelecido pelo monorepo — agregação sempre no
backend via `groupBy`, nunca full-scan client-side (Constitution II). Ferramenta interna, sem SLA de
latência documentado.

**Constraints**:
- Dinheiro sempre em centavos na API, reais na UI — conversão no mapper do frontend
  (`api/financial-statement.mapper.ts`, mesmo `centsToReais`/`reaisToCents` de `financial-entry.mapper.ts`).
- Agregação dos cards de resumo **sempre** via `groupBy` do Prisma no banco — nunca `findMany` + soma em
  memória (mesma regra de `003-financial-reports-cost-center`, aplicada aqui a `FinancialEntry.amountCents`
  em vez de `FinancialEntryAllocation`).
- Saldo por conta bancária reaproveita o endpoint paginado existente com `perPage=100` (teto `MAX_PER_PAGE`)
  — não é um "full-scan" proibido pela Constitution II porque é um cadastro de porte limitado (mesmo
  raciocínio já aplicado a grupo financeiro/plano de contas/centro de custo no `GetIncomeStatementUseCase`),
  não a listagem de lançamentos (que continua 100% paginada no backend).
- Zero ação de escrita (FR-003) — nenhuma rota de mutação é tocada; o link para o lançamento na tela de
  Lançamentos é só navegação (`next/link`), sem lógica de negócio nova.
- UI 100% `@citybox/mui` + wrappers `@/components/ui/*` — zero `@citybox/ui`/`lucide-react`/`data-table-shadcn`
  na feature nova (mesmo padrão de `financial-results`/`cost-center-analysis`).
- Escopo sempre a organização inteira (FR-013, resolvido em Clarifications) — nenhum filtro por unidade
  ativa é introduzido; `@BranchId()`/`@Tenant().branchId` **não** é usado por esta fatia.

**Scale/Scope**: Ferramenta B2B interna, uma organização (loja) por vez, piloto single-city (Ilhéus).
Volume de lançamentos: paginado no backend, sem teto assumido. Volume de contas bancárias por
organização: dezenas (cadastro de apoio, mesmo porte de grupo financeiro/centro de custo).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Conformidade |
|---|---|---|
| I. Docs-as-Code (hierarquia AGENTS.md) | Toca `api/AGENTS.md` §9 (novos filtros/rota em `financial-entries`) e `web/AGENTS.md` §4.1/§4.5/§9/§12 (feature `financial-statement` nova, placeholder de `/financas/extratos` removido) — atualizados na mesma operação de implementação (tarefa em `tasks.md`) | ✅ Planejado, não violado |
| II. Backend-Driven Search and Pagination | Listagem do extrato continua 100% paginada no backend (`manualPagination`, mesmo `DataTable`); cards de resumo são `groupBy` no Postgres sobre o conjunto filtrado inteiro (nunca a página exibida — FR-008); saldo por conta reaproveita o padrão já estabelecido de cadastro-limitado com `perPage=100` (não é lançamento, é cadastro de apoio); soma da seleção (US3) é explicitamente uma soma visual client-side sobre linhas já carregadas, sem paginação nem agregação de dataset — decisão do próprio spec (Assumptions), não uma violação do princípio | ✅ Sem violação |
| III. Single Package Manager (pnpm) | Nenhum comando `npm`/`yarn`; scripts via `pnpm --filter` | ✅ Sem violação |
| IV. Atomic Design and Shared UI Components | Feature nova reaproveita `DataTable`/`Drawer`/`DateRangePicker`/`Typography` de `@citybox/mui` e o padrão `SummaryCard` (Paper MUI) já usado em `financial-results` — sem duplicar primitivo. A coluna de seleção usa `Checkbox` de `@mui/material` (primitivo já dependência direta) dentro do ponto de extensão `render()` que o próprio `DataTable` já documenta para controles internos — não é um componente novo de design system, é composição dentro de uma coluna | ✅ Sem violação |
| V. Tenant Isolation and Independent Database Schemas | Nenhum model novo, nenhuma migration — `FinancialEntry`, `FinancialEntryAllocation`, `BankAccount` já são `TENANT_SCOPED_MODELS`; `database-reviewer` não tem migration para revisar, mas os `groupBy`/`where` novos são revisados quanto ao escopo correto de `organizationId` (dupla trava, mesmo padrão do repositório atual). Escopo de unidade explicitamente fora do filtro (FR-013) — nenhuma rota nova lê `@BranchId()`/`@Tenant().branchId` | ✅ Planejado, não violado |

Nenhuma violação identificada — **Complexity Tracking não é necessário** (seção deixada vazia abaixo).

**Re-checagem pós-Phase 1** (depois de `research.md`/`data-model.md`/`contracts/`/`quickstart.md` prontos):
nenhuma decisão de design (D1–D9 em `research.md`) introduz violação nova. O endpoint de resumo novo
(`GET /v1/financial-entries/summary`) segue o princípio II via `groupBy` sobre `FinancialEntry` (não
`FinancialEntryAllocation`, correto — os cards somam o lançamento inteiro por operação, não por rateio de
categoria/centro de custo). O reaproveitamento de `GET /v1/bank-accounts?perPage=100` para o saldo por conta
(D6) é o único ponto que roça o princípio II — mantido por já ser o padrão estabelecido pelas 3 fatias
anteriores para cadastros de apoio de porte limitado, documentado explicitamente para não ser confundido
com full-scan de lançamentos. Gate permanece válido.

## Project Structure

### Documentation (this feature)

```text
specs/erp/004-financial-statement/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   └── financial-statement-api.md
├── checklists/
│   └── requirements.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Par existente dentro do monorepo Turborepo — **não** é um projeto novo, é uma feature em cima de
`apps/erp/api` (NestJS, Clean Architecture) + `apps/erp/web` (Next.js). Caminhos reais tocados:

```text
apps/erp/api/                                                                # @citybox/erp-api :3114
└── src/modules/finance/financial-entries/
    ├── domain/
    │   ├── repositories/financial-entry.repository.interface.ts            # ALTERAR (+ competenceFrom/competenceTo/bankAccountId em FinancialEntryListCriteria; + sumAmountsByOperation())
    │   ├── errors/invalid-statement-period.error.ts                        # CRIAR (data final < inicial, 422 — mesmo padrão de InvalidReportPeriodError)
    │   └── validators/period-range.validator.ts                            # CRIAR (assertValidPeriodRange, compartilhado entre list e summary, os 2 eixos)
    ├── application/
    │   ├── use-cases/list-financial-entries/
    │   │   ├── list-financial-entries.use-case.ts                          # ALTERAR (+ filtros novos, + validação de período nos 2 eixos)
    │   │   └── list-financial-entries.use-case.spec.ts                     # ALTERAR
    │   └── use-cases/get-financial-entries-summary/                        # CRIAR
    │       ├── get-financial-entries-summary.use-case.ts
    │       └── get-financial-entries-summary.use-case.spec.ts
    ├── infrastructure/
    │   ├── database/prisma-financial-entry.repository.ts                   # ALTERAR (buildWhere + competenceDate/bankAccountId; + sumAmountsByOperation via groupBy)
    │   └── http/routes/
    │       ├── shared/financial-entry.dto.ts                               # ALTERAR (extrai FinancialEntryFilterQueryDto base reaproveitada por list + summary; + competenceFrom/competenceTo/bankAccountId)
    │       ├── list-financial-entries/list-financial-entries.route.ts      # ALTERAR (repassa filtros novos)
    │       └── get-financial-entries-summary/                              # CRIAR
    │           ├── get-financial-entries-summary.route.ts
    │           └── get-financial-entries-summary.dto.ts
    ├── financial-entries.module.ts                                         # ALTERAR (registra a rota nova)
    └── tests/in-memory-financial-entry.repository.ts                       # ALTERAR (suporta os filtros novos + sumAmountsByOperation)

apps/erp/api/AGENTS.md                                                      # ATUALIZAR §9 (filtros novos + GET /v1/financial-entries/summary)

apps/erp/web/                                                               # @citybox/erp-web :3107
├── src/app/(app)/financas/extratos/page.tsx                                # ALTERAR (PlaceholderPage → FinancialStatementPage real)
└── src/features/financial-statement/                                       # CRIAR — anatomia igual a financial-results/cost-center-analysis
    ├── GUIA.md                                                             # CRIAR (obrigatório — manual de negócio)
    ├── api/
    │   ├── financial-statement.dto.ts                                     # CRIAR (DTOs de listagem + resumo)
    │   ├── financial-statement.mapper.ts                                  # CRIAR (centavos → reais, reaproveita convenção de financial-entry.mapper.ts)
    │   └── financial-statement.service.ts                                 # CRIAR (comercioFetch em /v1/financial-entries, /v1/financial-entries/summary, /v1/bank-accounts)
    ├── hooks/
    │   ├── query-keys.ts                                                  # CRIAR
    │   ├── use-financial-statement-list.ts                                # CRIAR (state de filtros/busca debounce 400ms/paginação — molde de use-financial-entry-list.ts, sem tabs)
    │   ├── use-financial-statement-summary.ts                             # CRIAR (React Query sobre /summary, mesmos filtros da lista)
    │   ├── use-bank-account-balances.ts                                   # CRIAR (React Query sobre /v1/bank-accounts?perPage=100&tab=active)
    │   └── use-financial-statement-selection.ts                           # CRIAR (Set de ids selecionados + soma client-side; reseta ao trocar filtro/página — FR-011 edge case)
    ├── lib/
    │   └── financial-statement-filters.ts                                 # CRIAR (createEmptyFinancialStatementFilters/countActiveFilters, molde de financial-entry-filters.ts + eixo de data)
    ├── types/financial-statement.ts                                       # CRIAR
    ├── components/
    │   ├── financial-statement-toolbar.tsx                                # CRIAR (busca livre + botão de filtros, molde de financial-entry toolbar)
    │   ├── financial-statement-filters-drawer.tsx                         # CRIAR (molde de financial-entry-filters-drawer.tsx + toggle competência/vencimento + conta bancária)
    │   ├── financial-statement-summary-cards.tsx                          # CRIAR (3 SummaryCard — molde de financial-result-summary.tsx)
    │   ├── bank-account-balances-panel.tsx                                # CRIAR (US2 — saldo por conta)
    │   ├── financial-statement-table.tsx                                  # CRIAR (DataTable + coluna de checkbox de seleção, entrada/saída verde/vermelho — FR-010)
    │   ├── financial-statement-selection-bar.tsx                          # CRIAR (US3 — contagem + soma da seleção)
    │   └── financial-statement-empty-state.tsx                            # CRIAR (2 variantes — sem filtro vazio vs. com filtro sem resultado + limpar filtros, FR-014)
    └── pages/financial-statement-page.tsx                                 # CRIAR (compõe toolbar + drawer + summary cards + balances panel + table + selection bar)

apps/erp/web/AGENTS.md                                                      # ATUALIZAR §4.1/§4.5/§9/§12 (feature financial-statement nova, placeholder removido)
```

**Structure Decision**: mantém a Clean Architecture por submódulo já em vigor no backend
(`domain → application → infrastructure`), **sem** criar um módulo `finance/statement/` novo — a
agregação dos cards de resumo é estendida dentro de `financial-entries` porque opera sobre o mesmo
agregado (`FinancialEntry`), diferente do `finance/reports/` (`003`) que precisou de um módulo à parte por
cruzar `FinancialEntryAllocation` com `FinancialGroup`/`ChartOfAccount`/`CostCenter`. No frontend, a
convenção de pastas por feature (`api/hooks/lib/types/components/pages` + `GUIA.md`) é replicada
integralmente; `financial-statement/` é o único ponto novo de estrutura — nenhum componente de
`financial-entries`/`bank-accounts`/`financial-results` é movido ou compartilhado por import direto (drawers
e cards são recriados na nova feature seguindo o mesmo padrão visual, não importados entre features — mesma
decisão já tomada em `003` para `cost-center-analysis` vs. `financial-results`).

## Complexity Tracking

> Nenhuma violação de Constitution Check identificada — seção vazia por design.
