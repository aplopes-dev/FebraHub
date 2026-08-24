# Implementation Plan: Catálogo — backend de Adicionais e Sugestões do produto

**Branch**: `008-catalogo-adicionais-sugestoes` | **Date**: 2026-08-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/erp/008-catalogo-adicionais-sugestoes/spec.md`

## Summary

Persistir as duas abas do formulário de produto hoje mock em `apps/erp/web` —
**Adicionais** e **Sugestões** — na `apps/erp/api` (módulo `catalog`, vertical
Comércio), reaproveitando o padrão já usado por **Variações** e **Listas de
preço**: entidades novas em `prisma/schema.prisma` (schema `erp`), Clean
Architecture por módulo (`domain`/`application`/`infrastructure`), e as duas
seções entram como campos aninhados no mesmo `GET`/`PUT /v1/products/:id` do
produto (sem endpoints CRUD por linha) — replace-all a cada save, igual
`variations`. Um catálogo de organização novo (`ProductAddon`, nome + preço
padrão) alimenta o seletor da aba Adicionais; a aba Sugestões referencia
`Product` diretamente. Endpoints CRUD próprios (`v1/product-addons`) só para o
catálogo de adicionais em si — mesmo molde de `product-categories`/`units-of-measure`.

## Technical Context

**Language/Version**: TypeScript ~5.7.3 (NestJS 11.x via `pnpm catalog`)

**Primary Dependencies**: NestJS 11, Prisma 7.8 (`@prisma/adapter-pg`), Zod ^4.4.3 (validação de domínio), class-validator/class-transformer (DTOs HTTP)

**Storage**: PostgreSQL — banco `citybox_platform`, schema `erp` (mesmo schema de `Product`/`Variation`/`PriceList`)

**Testing**: Jest + ts-jest (`*.spec.ts`), repositórios in-memory para use cases — mesmo padrão do módulo `catalog`

**Target Platform**: Linux server (NestJS HTTP, porta 3114)

**Project Type**: web (backend NestJS consumido por frontend Next.js já existente e não alterado nesta fatia)

**Performance Goals**: Sem meta nova além do já estabelecido pelo módulo `catalog` (resposta do `GET`/`PUT` de produto dentro do padrão atual da API; sem paginação nova — listas de linhas são pequenas, por produto)

**Constraints**: Escopo organization-scoped (multi-tenant, `TenantContextGuard` + `prisma.scoped`); gravação de cada seção (Adicionais / Sugestões) atômica via `$transaction` do Prisma, no mesmo padrão de `UpdateProductUseCase` ao substituir `variations`/`suppliers`/`branchIds`

**Scale/Scope**: 2 endpoints CRUD novos (`v1/product-addons`) + payload aninhado em 2 endpoints já existentes (`GET`/`PUT /v1/products/:id`) + 1 migration Prisma com 4 tabelas novas

**Structure Decision**: Tudo dentro de `apps/erp/api/src/modules/catalog/` (mesmo módulo de `Product`/`Variation`/`PriceList`) — sem módulo novo. Frontend (`apps/erp/web`) fora de escopo desta fatia de backend (fica para uma próxima fatia trocar o mock pela API, mesma sequência já usada em Variações → Fase B.1 depois do backend existir).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Como esta feature cumpre |
|---|---|
| I. Docs-as-Code | `apps/erp/api/AGENTS.md` (§4, §9) e `apps/erp/web/AGENTS.md` (§4.5, nota "Adicionais/Sugestões continuam mock") serão atualizados no mesmo commit que tocar schema/módulo — ver tasks de doc no `tasks.md` gerado por `/speckit-tasks`. |
| II. Backend-Driven Search and Pagination | `GET /v1/product-addons` (catálogo da organização) usa o mesmo padrão de paginação opcional de `units-of-measure`/`variations` (sem paginação = lista simples para dropdown; com `page`/`perPage` = tela futura). As linhas de Adicionais/Sugestões por produto **não** paginam — são um payload aninhado pequeno (mesmo padrão de `variations`), não uma coleção independente. |
| III. Single Package Manager (pnpm) | Todos os comandos via `pnpm --filter @citybox/erp-api`. |
| IV. Atomic Design and Shared UI Components | N/A nesta fatia — sem trabalho de frontend (spec e Assumptions delimitam o escopo ao backend). |
| V. Tenant Isolation and Independent Database Schemas | Todas as 4 tabelas novas entram em `TENANT_SCOPED_MODELS`, usam `prisma.scoped`, `organizationId` obrigatório, `@@schema("erp")` — mesmo schema do resto de `catalog`, sem banco/schema novo. Revisão obrigatória via `database-reviewer` antes de aplicar a migration. |

Sem violações — nenhuma linha em Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/erp/008-catalogo-adicionais-sugestoes/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── product-addons-suggestions.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
apps/erp/api/
├── prisma/
│   └── schema.prisma                 # + ProductAddon, ProductAddonLine, ProductAddonSettings, ProductSuggestion
├── src/modules/catalog/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── product-addon.entity.ts          # NOVO — catálogo de adicionais
│   │   │   └── product.entity.ts                # + addonSettings, addonLines, suggestions nos props
│   │   ├── repositories/
│   │   │   └── product-addon.repository.interface.ts   # NOVO
│   │   ├── validators/
│   │   │   └── product-addon.zod.validator.ts   # NOVO
│   │   └── errors/
│   │       ├── product-addon-name-taken.error.ts        # NOVO
│   │       ├── product-addon-not-found.error.ts         # NOVO
│   │       ├── product-addon-duplicate-line.error.ts    # NOVO
│   │       ├── product-suggestion-self-reference.error.ts   # NOVO
│   │       └── product-suggestion-duplicate-line.error.ts   # NOVO
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── create-product-addon/            # NOVO — molde create-product-category
│   │   │   ├── update-product-addon/            # NOVO
│   │   │   ├── delete-product-addon/            # NOVO (soft-delete)
│   │   │   ├── list-product-addons/             # NOVO
│   │   │   ├── create-product/                  # existente — passa a resolver addons/suggestions
│   │   │   └── update-product/                  # existente — passa a resolver addons/suggestions
│   │   ├── dtos/
│   │   │   ├── product-addon.dto.ts             # NOVO
│   │   │   └── product.dto.ts                   # + addonSettings/addonLines/suggestions no Create/UpdateProductDto
│   │   └── utils/
│   │       ├── resolve-product-addon-lines.ts    # NOVO — molde resolve-product-variations.ts
│   │       └── resolve-product-suggestions.ts    # NOVO
│   └── infrastructure/
│       ├── database/
│       │   └── prisma-product-addon.repository.ts   # NOVO
│       └── http/routes/
│           ├── create-product-addon/ · update-product-addon/ · delete-product-addon/ · list-product-addons/   # NOVO
│           └── shared/product.presenter.ts       # existente — + campos novos no ProductResponse
└── AGENTS.md                                     # atualizar §4, §9 (Catalog) na mesma operação
```

**Structure Decision**: extensão do módulo `catalog` existente — sem novo módulo NestJS. Segue exatamente a árvore de `variations` (`domain/application/infrastructure` + `tests/in-memory-*.repository.ts`), reaproveitando o padrão de "seções aninhadas no payload do produto, substituídas por completo a cada `PUT`" já usado por `variations`/`priceListItems`/`fiscalBranches`.

## Complexity Tracking

*Sem violações da Constitution — seção não aplicável.*
