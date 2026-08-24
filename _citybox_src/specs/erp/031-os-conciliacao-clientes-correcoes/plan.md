# Implementation Plan: Correções OS, Conciliação e Clientes

**Branch**: `031-os-conciliacao-clientes-correcoes` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/erp/031-os-conciliacao-clientes-correcoes/spec.md`

## Summary

Três correções independentes no vertical Comércio do ERP (`apps/erp`):
(1) geração de venda a partir de uma Ordem de Serviço falha quando a OS só
tem linhas de serviço, porque tanto o mapper do frontend quanto o backend só
aceitam linhas vinculadas a um produto de catálogo — a correção estende
`SaleOrderLine` para aceitar uma linha sem `productId` com `description`
própria; (2) o campo "Cliente ou fornecedor" do "Novo Registro" da
Conciliação bancária é texto livre — a correção reaproveita o `Autocomplete`
combinado já usado em Lançamentos financeiros e estende o endpoint de criação
para aceitar `customerId`/`supplierId`; (3) a listagem de Clientes não tem
nenhuma affordance visível de edição — o formulário, a rota e o endpoint de
edição já existem (spec 029/B2); a correção é adicionar uma ação "Editar"
visível por linha.

## Technical Context

**Language/Version**: TypeScript 5.x (NestJS 11 no backend, Next.js 16 / React 19 no frontend)

**Primary Dependencies**: NestJS 11, Prisma, `class-validator`, `@citybox/mui` (Autocomplete, Drawer, Select), TanStack Query

**Storage**: PostgreSQL (`citybox`), schema `erp`/`comercio` — Prisma (`apps/erp/api/prisma/schema.prisma`)

**Testing**: Jest/Node test runner nativo no backend (`apps/erp/api`), Vitest + Testing Library no frontend (`apps/erp/web`) — sem mocks de banco, testes de backend batem em Postgres real

**Target Platform**: Web (backoffice do lojista, `erp-web` :3107 + `erp-api` :3114)

**Project Type**: web application (frontend Next.js + backend NestJS, monorepo)

**Performance Goals**: sem meta nova — mantém os padrões já vigentes de paginação/backend-driven search (Constitution II); nenhuma das três correções introduz nova listagem

**Constraints**: mudança de schema (item 1) deve ser aditiva e retrocompatível — nenhuma venda existente tem linha sem produto, sem necessidade de backfill

**Scale/Scope**: 3 correções pontuais em telas já existentes — sem novas telas, sem nova entidade de negócio

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Docs-as-Code (`AGENTS.md`) | PASS — implementação deve atualizar `apps/erp/api/AGENTS.md` e `apps/erp/web/AGENTS.md` se a mudança de schema/rota alterar algo estrutural documentado lá; nenhuma mudança de porta/serviço. |
| II. Backend-Driven Search e Paginação | PASS — nenhuma das três correções mexe em busca/paginação de listagem; o `Autocomplete` de cliente/fornecedor (D2) reaproveita `useSelectableCustomersQuery`/`useActiveSuppliersQuery` já existentes e já backend-driven. |
| III. Single Package Manager (pnpm) | PASS — nenhum comando novo fora de `pnpm`. |
| IV. Atomic Design / `@citybox/ui`+`@citybox/mui` | PASS — reaproveita `Autocomplete`/`Drawer`/`Select` de `@citybox/mui` (D2) e o padrão de `DataTable` existente (D3); nenhum componente novo fora do design system. |
| V. Tenant Isolation e Schemas Independentes | **GATE ATIVO** — item 1 (D1) exige migração Prisma em `apps/erp/api/prisma/schema.prisma` (`productId` opcional + `description` em `SaleOrderLine`, índice único parcial). **Requer revisão via `database-reviewer` antes da implementação.** Escopo do schema já é próprio de `apps/erp/api` (single-schema) — sem cruzar tenant. |

**Resultado**: PASS com uma ressalva ativa (item V) — a implementação do item 1
não deve prosseguir sem passar pelo gate `database-reviewer` na migração
proposta em [data-model.md](./data-model.md).

## Project Structure

### Documentation (this feature)

```text
specs/erp/031-os-conciliacao-clientes-correcoes/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
├── contracts/            # Phase 1 output
│   ├── generate-sale.contract.md
│   └── create-entry-from-transaction.contract.md
└── tasks.md              # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
apps/erp/api/
├── prisma/schema.prisma                                   # D1: SaleOrderLine.productId opcional + description
├── src/modules/sales/
│   ├── domain/entities/sale-order.entity.ts                # D1: SaleOrderLineProps
│   ├── application/use-cases/
│   │   ├── assert-sale-order-references.ts                 # D1: pular validação quando productId=null
│   │   └── build-sale-outbound-movement.ts                 # D1: pular baixa de estoque quando productId=null
│   ├── infrastructure/database/prisma-sale-order.repository.ts  # D1: persistir description
│   ├── infrastructure/http/routes/shared/sale-order.presenter.ts  # D1: rótulo via description
│   └── service-orders/
│       ├── application/service-orders.service.ts           # D1: extractLines aceita linha sem productId
│       └── http/dto.ts
└── src/modules/finance/bank-reconciliation/
    ├── infrastructure/http/routes/shared/create-entry-from-transaction.dto.ts  # D2: customerId/supplierId
    └── application/
        ├── dtos/create-entry-from-transaction.dto.ts        # D2
        └── use-cases/create-entry-from-transaction/create-entry-from-transaction.use-case.ts  # D2

apps/erp/web/
├── src/features/service-orders/
│   ├── api/service-order.mapper.ts                          # D1: linesForGenerateSale aceita linha de serviço
│   └── types/service-order.ts
├── src/features/bank-reconciliation/
│   ├── components/create-entry-from-transaction-drawer.tsx  # D2: Input texto → Autocomplete
│   ├── types/bank-statement.ts                               # D2: CreateEntryFromTransactionInput
│   ├── api/bank-reconciliation.service.ts
│   └── hooks/use-bank-reconciliation-mutations.ts
└── src/features/customers/
    └── components/customer-list-table.tsx                    # D3: coluna de ação "Editar" visível
```

**Structure Decision**: monorepo existente, sem novos apps/packages. Todas as
mudanças ficam dentro de `apps/erp/api` (módulos `sales`/`service-orders` e
`finance/bank-reconciliation`) e `apps/erp/web` (`features/service-orders`,
`features/bank-reconciliation`, `features/customers`) — consistente com
`apps/erp/AGENTS.md`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Nenhuma violação sem justificativa — a única ressalva (mudança de schema no
item 1) está coberta pelo próprio processo constitucional (gate
`database-reviewer` antes da implementação), não é uma exceção a ele.
