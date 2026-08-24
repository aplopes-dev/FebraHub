# Implementation Plan: DRE real e análise por centro de custo

**Branch**: `003-financial-reports-cost-center` | **Date**: 2026-08-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/erp/003-financial-reports-cost-center/spec.md`

## Summary

Os três cadastros de apoio financeiro (grupo financeiro, plano de contas, centro de custo) e o
vínculo real entre lançamento e esses cadastros (`FinancialEntryAllocation`, com `chartOfAccountId`
e `costCenterId` obrigatórios) já estão em produção — entregues por
`specs/erp/001-financial-entries/`. O que falta é **consumir** esse vínculo: trocar a DRE
(`/financas/relatorios-de-resultados`) de três mocks sincronizados manualmente
(`MOCK_RESULT_ENTRIES`/`MOCK_CHART_OF_ACCOUNTS`/`MOCK_FINANCIAL_GROUPS`) para dados reais
agregados por data de competência, e entregar a análise por centro de custo — hoje inexistente
(`/relatorios` é `PlaceholderPage`).

O plano cria um submódulo novo, só leitura, `apps/erp/api/src/modules/finance/reports/` (Clean
Architecture, sem entidade de domínio própria — 2 use cases, `.spec.ts` sobre repositório
in-memory) com 2 rotas: `GET /v1/reports/income-statement` e `GET /v1/reports/cost-centers`. A
agregação pesada (linhas de `financial_entry_allocations`) roda no Postgres via `groupBy` do
Prisma — nunca em memória. Corrige de passagem um bug de dado vivo: os grupos de sistema "Caixa e
bancos" e "Ativo" estão tipados `receita` no seed mas são patrimoniais — `FinancialGroup` ganha um
campo `classification` (`resultado`\|`patrimonial`, não exposto na UI de cadastro) que a DRE usa
para excluí-los do resultado do período; organizações existentes são corrigidas por um script de
backfill standalone (mesmo padrão de `scripts/backfill-financial-entry-allocations.ts`).

No frontend, `features/financial-results` troca a origem dos dados (o shape do relatório já
espelha o tipo que a UI consome — a tela **não é redesenhada**) e ganha uma nova feature irmã,
`features/cost-center-analysis` (barra de participação horizontal via `LinearProgress` de
`@mui/material` — nenhuma biblioteca de gráfico nova), com uma rota nova no painel de Finanças. Ao
final, os 3 mocks (`mock-result-entries.ts`, `mock-financial-groups.ts`,
`mock-chart-of-accounts.ts`) e os 2 serviços mock que só existiam para sustentar a DRE são
removidos.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js runtime) em todo o feature — NestJS 11 no backend, Next.js 16 (App Router) / React 19 no frontend.

**Primary Dependencies**:
- Backend (`apps/erp/api`, `@citybox/erp-api`): NestJS 11, Prisma 7 (client gerado em `generated/prisma`, adapter `pg`), `class-validator`/`class-transformer` (DTOs HTTP), Swagger, Jest. Nenhuma dependência nova.
- Frontend (`apps/erp/web`, `@citybox/erp-web`): Next.js 16, React 19, `@citybox/mui` (design system), `@mui/material` (`LinearProgress`, já dependência direta — `research.md` D10), `@tanstack/react-query` (server state), `sonner`/`Toaster` MUI. Nenhuma dependência nova (sem lib de gráfico).

**Storage**: PostgreSQL (banco `citybox_platform`, schema Postgres `erp`, single-schema — `apps/erp/api/prisma/schema.prisma`). Nenhum model novo; 1 enum novo (`FinancialGroupClassification`) + 1 campo novo (`FinancialGroup.classification`) — ver `data-model.md`.

**Testing**: Backend — Jest + ts-jest, `.spec.ts` por use case com repositório in-memory (`tests/in-memory-finance-report.repository.ts`, molde de `financial-entries`/`bank-accounts`). Frontend — sem infraestrutura de teste em `apps/erp/web` (confirmado, mesma situação de `001-financial-entries`/`002-bank-account-ledger`); validação via `quickstart.md` + `typecheck`/`lint` (`research.md` D11).

**Target Platform**: Servidor Linux (containers Docker em produção); navegador desktop (backoffice interno).

**Project Type**: Web application — feature dentro do par já estruturado `apps/erp/api` + `apps/erp/web` (não é um projeto novo).

**Performance Goals**: Sem meta numérica nova além do já estabelecido pelo monorepo (§8.1 do `AGENTS.md` raiz: agregação sempre no backend, nunca full-scan client-side). Sem SLA de latência específico documentado para o ERP — ferramenta interna, uma loja por vez.

**Constraints**:
- Migrations de schema **só** via `pnpm --filter @citybox/erp-api db:migrate:dev`; o backfill de `classification` para organizações existentes é um script standalone (`scripts/backfill-financial-group-classification.ts`, `pnpm db:backfill:financial-group-classification`) — lógica de dado condicionada a `systemKey`, não um diff de schema (`api/AGENTS.md` §5.9, mesmo raciocínio do backfill de `001-financial-entries`).
- Dinheiro sempre em centavos na API, reais na UI — conversão no mapper do frontend (`api/financial-result.mapper.ts`, `api/cost-center-analysis.mapper.ts`).
- Agregação das linhas de `financial_entry_allocations` **sempre** via `groupBy` do Prisma no banco — nunca `findMany` + soma em memória (`research.md` D3/D5).
- `classification` de `FinancialGroup` não é um input do formulário de cadastro (`features/financial-groups`) nem sai no presenter de `GET /v1/financial-groups` — o contrato HTTP dos 3 cadastros permanece estável (orientação explícita do prompt original: "não altere os contratos HTTP dos três cadastros").
- UI 100% `@citybox/mui` + wrappers `@/components/ui/*` — zero `@citybox/ui`/`lucide-react`/`data-table-shadcn` nas duas features tocadas (já é assim em `financial-results`; `cost-center-analysis` nasce nesse padrão).
- Nenhuma dependência de gráfico nova (`research.md` D10) — `LinearProgress` de `@mui/material`.

**Scale/Scope**: Ferramenta B2B interna, uma organização (loja) por vez, piloto single-city (Ilhéus). Volume esperado de linhas por `groupBy`: dezenas (tamanho do plano de contas/centros de custo da loja), não o volume de lançamentos — ver `research.md` D3.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Conformidade |
|---|---|---|
| I. Docs-as-Code (hierarquia AGENTS.md) | Toca `api/AGENTS.md` §9 (novo submódulo `reports`, remove a dívida "`categoryName` string solta" — já resolvida por `001-financial-entries`, o texto do §9 só não refletia isso ainda) e `web/AGENTS.md` §4.1/§4.5/§9/§12 (nova rota no painel, nova feature, mocks removidos) — atualizados na mesma operação de implementação (tarefa em `tasks.md`) | ✅ Planejado, não violado |
| II. Backend-Driven Search and Pagination | Os dois relatórios não paginam (volume limitado ao tamanho do cadastro — `research.md` D9) mas a agregação pesada roda 100% no Postgres via `groupBy` (`research.md` D3/D5), nunca full-scan client-side | ✅ Sem violação |
| III. Single Package Manager (pnpm) | Nenhum comando `npm`/`yarn`; scripts via `pnpm --filter` | ✅ Sem violação |
| IV. Atomic Design and Shared UI Components | `cost-center-analysis` reaproveita `ListPageShell`/`PageHeader`/`ListPagePanel`/`ListLoadErrorAlert` já existentes; `LinearProgress` é primitivo `@mui/material` já usado no app (não é um componente novo de `@citybox/ui`) | ✅ Sem violação |
| V. Tenant Isolation and Independent Database Schemas | `FinancialGroup` já é `TENANT_SCOPED_MODELS` — campo novo não muda o escopo; nenhum model novo entra na allowlist (os relatórios são leitura, não têm tabela própria); `database-reviewer` roda antes da migration do campo `classification` | ✅ Planejado, não violado |

Nenhuma violação identificada — **Complexity Tracking não é necessário** (seção deixada vazia
abaixo).

**Re-checagem pós-Phase 1** (depois de `research.md`/`data-model.md`/`contracts/`/`quickstart.md`
prontos): nenhuma decisão de design (D1–D11 em `research.md`) introduz violação nova. O único
campo novo de schema (`FinancialGroup.classification`) segue o princípio V (model já tenant-scoped,
só o backfill de dado legado precisa de script fora da migration — mesmo padrão já auditado em
`001-financial-entries`). Os dois use cases novos (`GetIncomeStatement`/`GetCostCenterAnalysis`)
seguem o princípio II via `groupBy` no repositório Prisma. Gate permanece válido.

## Project Structure

### Documentation (this feature)

```text
specs/erp/003-financial-reports-cost-center/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   └── reports-api.md
├── checklists/
│   └── requirements.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Par existente dentro do monorepo Turborepo — **não** é um projeto novo, é uma feature em cima de
`apps/erp/api` (NestJS, Clean Architecture) + `apps/erp/web` (Next.js). Caminhos reais tocados:

```text
apps/erp/api/                                                          # @citybox/erp-api :3114
├── prisma/schema.prisma                                               # ALTERAR (FinancialGroup.classification + enum)
├── src/modules/store-setup/application/seed-data/finance.seed.ts      # ALTERAR (classification nos 6 grupos)
├── scripts/backfill-financial-group-classification.ts                 # CRIAR (script standalone, fora de prisma migrate)
├── src/modules/finance/financial-groups/domain/entities/financial-group.entity.ts  # ALTERAR (getter classification; create() sempre 'resultado' salvo systemKey de patrimônio)
├── src/modules/finance/financial-groups/infrastructure/database/prisma-financial-group.repository.ts  # ALTERAR (mapear coluna nova, sem expor no presenter)
└── src/modules/finance/reports/                                       # submódulo novo, Clean Architecture (sem domain/entities — research.md D1)
    ├── reports.module.ts
    ├── domain/
    │   ├── repositories/finance-report.repository.interface.ts
    │   └── errors/invalid-report-period.error.ts
    ├── application/
    │   ├── dtos/income-statement-report.dto.ts
    │   ├── dtos/cost-center-analysis-report.dto.ts
    │   └── use-cases/
    │       ├── get-income-statement/{get-income-statement.use-case.ts,.spec.ts}
    │       └── get-cost-center-analysis/{get-cost-center-analysis.use-case.ts,.spec.ts}
    ├── infrastructure/
    │   ├── database/prisma-finance-report.repository.ts
    │   └── http/routes/
    │       ├── get-income-statement/{get-income-statement.route.ts,get-income-statement.dto.ts}
    │       └── get-cost-center-analysis/{get-cost-center-analysis.route.ts,get-cost-center-analysis.dto.ts}
    └── tests/in-memory-finance-report.repository.ts

apps/erp/web/                                                          # @citybox/erp-web :3107
├── src/lib/navigation.ts                                              # ALTERAR (novo leaf "Análise por centro de custo")
├── src/lib/nav-icons.tsx                                              # ALTERAR (novo ícone semântico "pie-chart")
└── src/features/
    ├── financial-results/                                             # feature existente — troca de origem de dado
    │   ├── api/financial-result.dto.ts                                # CRIAR
    │   ├── api/financial-result.mapper.ts                             # CRIAR (centavos → reais)
    │   ├── api/financial-results.service.ts                           # CRIAR (comercioFetch)
    │   ├── hooks/query-keys.ts                                        # CRIAR
    │   ├── hooks/use-financial-result.ts                               # ALTERAR (React Query no lugar do cálculo mock)
    │   ├── services/financial-result.service.ts                       # REMOVER (ao final)
    │   ├── data/mock-result-entries.ts                                 # REMOVER (ao final)
    │   ├── components/*                                                # ALTERAR só loading/erro/vazio — árvore/cards/toolbar inalterados
    │   └── GUIA.md                                                     # ATUALIZAR
    ├── financial-groups/data/mock-financial-groups.ts                  # REMOVER (ao final — só existia para financial-results)
    ├── chart-of-accounts/data/mock-chart-of-accounts.ts                # REMOVER (ao final — idem)
    └── cost-center-analysis/                                           # feature nova
        ├── GUIA.md                                                     # CRIAR (obrigatório)
        ├── api/cost-center-analysis.dto.ts
        ├── api/cost-center-analysis.mapper.ts
        ├── api/cost-center-analysis.service.ts
        ├── hooks/query-keys.ts
        ├── hooks/use-cost-center-analysis.ts
        ├── lib/cost-center-analysis-format.ts
        ├── types/cost-center-analysis.ts
        ├── components/cost-center-analysis-toolbar.tsx                 # período + Despesa/Receita
        ├── components/cost-center-share-bar.tsx                        # LinearProgress por linha
        ├── components/cost-center-analysis-table.tsx                   # Centro de custo · Valor · % · nº lançamentos
        ├── pages/cost-center-analysis-page.tsx
        └── index.ts

apps/erp/api/AGENTS.md                                                 # ATUALIZAR §9 (finance/reports, classification, dívida categoryName removida)
apps/erp/web/AGENTS.md                                                 # ATUALIZAR §4.1/§4.5/§9/§12 (nova rota/feature, mocks removidos, DRE real)
```

**Structure Decision**: mantém a Clean Architecture por submódulo já em vigor no backend
(`domain → application → infrastructure`) e a convenção de pastas por feature já em vigor no
frontend (`api/hooks/lib/components/pages`). O submódulo `reports/` é o único ponto novo de
estrutura no backend — Clean, mas sem `domain/entities/` (não existe um agregado "Relatório" com
identidade; é leitura pura sobre agregados que outros submódulos já possuem — `research.md` D1).
`cost-center-analysis/` no frontend segue exatamente o layout de pasta de `financial-results`
(sem duplicar componentes — a árvore Grupo→Conta da DRE não é reutilizável para a lista simples de
centro de custo, então não há componente compartilhado a extrair). Nenhuma estrutura nova é
introduzida além dessas duas.

## Complexity Tracking

> Nenhuma violação de Constitution Check identificada — seção vazia por design.
