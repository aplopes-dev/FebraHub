# Implementation Plan: Lançamentos financeiros (Contas a pagar / Contas a receber) ponta a ponta

**Branch**: `001-financial-entries` | **Date**: 2026-08-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/erp/001-financial-entries/spec.md`

## Summary

Hoje o formulário de Lançamentos financeiros do ERP de Comércio (`apps/erp/web`) grava em um
store em memória (`services/financial-entry.service.ts`) em vez da API real — o operador vê
"lançamento criado" mas o dado some no refresh. A API (`apps/erp/api`) já tem CRUD completo de
`FinancialEntry`, mas o modelo é pobre: sem taxa/multa, sem rateio de pagamentos, sem rateio de
categoria financeira (só uma `categoryName` string solta, sem FK), sem anexos, sem fornecedor.

O plano liga o formulário real à API real e enriquece o modelo de dados: `FinancialEntry` ganha
`feesCents`/`finesCents`/`note`/`supplierId`/`status` (persistido) e três tabelas filhas —
`FinancialEntryPayment` (rateio de pagamentos, advisory), `FinancialEntryAllocation` (rateio de
categoria financeira + centro de custo, obrigatório fechar 100% do total) e
`FinancialEntryAttachment` (comprovantes em MinIO). Pai + linhas de pagamento/rateio são
substituídos numa única transação a cada save (mesmo padrão de `SaleOrder.lines`/`.payments`,
já usado em `sales`), não um agregado com sub-rotas próprias (diferente de
`card-contracts`/`payment-methods`). Um lançamento vinculado a um pedido de venda fica
somente-leitura. Lançamentos legados sem rateio são migrados por um script de backfill único
(fora do fluxo normal de `prisma migrate dev`, que não expressa lógica de dados). No frontend,
todos os `MOCK_*` da feature saem, os lookups passam a vir de hooks reais (2 hooks novos:
`useChartOfAccountOptionsQuery`, `useCostCenterOptionsQuery`, no molde de
`useBankAccountOptionsQuery`), e o padrão de upload de anexo replica o de imagem de produto
(MinIO + `comercioUpload`, preview local, sync separado do save principal).

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js runtime) em todo o feature — NestJS 11 no backend, Next.js 16 (App Router) / React 19 no frontend.

**Primary Dependencies**:
- Backend (`apps/erp/api`, `@citybox/erp-api`): NestJS 11, Prisma 7 (client gerado em `generated/prisma`, adapter `pg`), `class-validator`/`class-transformer` (DTOs HTTP), Zod v4 (só onde já é convenção — este módulo hoje mantém `validate()` vazio na entidade, validação de formato fica no DTO HTTP), `minio` (via `ObjectStorage`/`MinioObjectStorage` já existentes), `jose` (JWT Keycloak), Swagger, Jest.
- Frontend (`apps/erp/web`, `@citybox/erp-web`): Next.js 16, React 19, `@citybox/mui` (design system), `@tanstack/react-query` (server state), Zustand (não necessário nesta feature — lista usa `useState` local, mesmo padrão de `card-contracts`), `sonner` (toasts).

**Storage**: PostgreSQL (banco `citybox_platform`, schema Postgres `erp`, single-schema — `apps/erp/api/prisma/schema.prisma`). Object storage MinIO (bucket `erp`, já provisionado) para anexos, via `ObjectStorage` (`@Global()` `StorageModule`, já existe — usado hoje por imagem de produto).

**Testing**: Backend — Jest + ts-jest, `.spec.ts` por use case com repositório in-memory (padrão já usado nos 2 use cases testados hoje de `financial-entries`; será estendido para os demais). Frontend — **não há infraestrutura de teste em `apps/erp/web`** hoje (confirmado: nenhum `*.test.tsx`, sem `vitest`/`@testing-library` no `package.json`); o gate de PR documentado em `apps/erp/AGENTS.md` §5 para `erp-web` é só `typecheck` + `lint`, sem `test`. Decisão (detalhada em `research.md`): esta feature não introduz Vitest no `erp-web` — validação end-to-end fica a cargo do `quickstart.md` (roteiro manual mapeado 1:1 nos cenários de aceite do spec) mais os gates de tipo/lint. Introduzir Vitest em `erp-web` é reportado como débito técnico separado, fora do escopo desta feature.

**Target Platform**: Servidor Linux (containers Docker em produção, via `deploy/docker-compose.apps.yml`); navegador desktop (backoffice interno, não mobile-first).

**Project Type**: Web application (par existente `apps/erp/api` + `apps/erp/web` dentro do monorepo — não é um projeto novo, é uma feature dentro de um app já estruturado; ver "Project Structure" abaixo com os caminhos reais).

**Performance Goals**: Sem meta numérica nova além do já estabelecido pelo monorepo (§8.1 do `AGENTS.md` raiz: listagem sempre paginada/filtrada no backend, nunca full-scan client-side). Sem SLA de latência específico documentado para o ERP — ferramenta interna de operação de uma única loja por vez.

**Constraints**:
- Migrations de schema **só** via `pnpm --filter @citybox/erp-api db:migrate:dev`; proibido editar `.sql` em `prisma/migrations/` à mão (`api/AGENTS.md` §5.9).
- Todo model novo com `organization_id` **precisa** entrar em `TENANT_SCOPED_MODELS` (`shared/infra/prisma/tenant-scope.extension.ts`) na mesma operação; repositório usa `prisma.scoped`, nunca `prisma` cru (`api/AGENTS.md` §5.10).
- Dinheiro sempre em centavos na API, reais na UI — conversão no mapper do frontend (`api/<feature>.mapper.ts`).
- UI 100% `@citybox/mui` + wrappers `@/components/ui/*` — zero `@citybox/ui`/`lucide-react` (já é assim nas 5 features financeiras existentes).
- Backfill de dados legados (migração de `categoryName` → rateio) **não pode** ser expresso dentro de uma migration Prisma padrão (que só sabe diff de schema) — precisa de um script standalone (ver `research.md`).
- `saleOrderId` continua não-editável pelo formulário; agora o lançamento inteiro fica somente-leitura quando esse campo está preenchido (decisão da clarificação).

**Scale/Scope**: Ferramenta B2B interna, uma organização (loja) por vez, piloto single-city (Ilhéus). Volume esperado: centenas a poucos milhares de lançamentos por loja — sem necessidade de otimização além da paginação/filtros server-side já padrão do monorepo.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Conformidade |
|---|---|---|
| I. Docs-as-Code (hierarquia AGENTS.md) | Toca `api/AGENTS.md` §9 (módulo finance) e `web/AGENTS.md` §4.5/§9/§12 — devem ser atualizados na mesma operação de implementação (fora do escopo do `/speckit-plan`, tarefa registrada em `tasks.md` na próxima fase) | ✅ Planejado, não violado |
| II. Backend-Driven Search and Pagination | Todos os filtros novos (`status[]`, `chartOfAccountId[]`, `costCenterId[]`) são resolvidos como `WHERE` no repositório Prisma, nunca client-side; `DataTable` já usa `manualPagination` na feature atual | ✅ Sem violação |
| III. Single Package Manager (pnpm) | Nenhum comando `npm`/`yarn` no plano; todos os scripts via `pnpm --filter` | ✅ Sem violação |
| IV. Atomic Design and Shared UI Components | Reaproveita `EntityFormHeader`/`EntityFormFooter`/`ListPageShell`/`RowActionsMenu`/`ConfirmationDialog`/`ProductUnitsDrawer` já existentes; nenhum componente novo de `@citybox/ui` | ✅ Sem violação |
| V. Tenant Isolation and Independent Database Schemas | 3 models novos (`FinancialEntryPayment`, `FinancialEntryAllocation`, `FinancialEntryAttachment`) entram em `TENANT_SCOPED_MODELS` na mesma operação da migration; repositório usa `prisma.scoped`; `database-reviewer` roda antes da migration | ✅ Planejado, não violado |

Nenhuma violação identificada — **Complexity Tracking não é necessário** (seção deixada vazia abaixo).

**Re-checagem pós-Phase 1** (depois de `research.md`/`data-model.md`/`contracts/`/`quickstart.md`
prontos): nenhuma decisão de design (D1–D15 em `research.md`) introduz violação nova. Os 3
models novos (`FinancialEntryPayment`/`Allocation`/`Attachment`) entram em
`TENANT_SCOPED_MODELS` (princípio V, ver `data-model.md`); os 2 hooks novos de frontend
(`useChartOfAccountOptionsQuery`/`useCostCenterOptionsQuery`) e os novos filtros de listagem
seguem os mesmos padrões server-side já auditados (princípios II e IV). Gate permanece válido.

## Project Structure

### Documentation (this feature)

```text
specs/erp/001-financial-entries/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   └── financial-entries-api.md
├── checklists/
│   └── requirements.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Par existente dentro do monorepo Turborepo — **não** é um projeto novo, é uma feature em cima de
`apps/erp/api` (NestJS, Clean Architecture) + `apps/erp/web` (Next.js). Caminhos reais tocados:

```text
apps/erp/api/                                                          # @citybox/erp-api :3114
├── prisma/schema.prisma                                               # ALTERAR
├── src/shared/infra/prisma/tenant-scope.extension.ts                  # ALTERAR
├── src/modules/store-setup/application/seed-data/finance.seed.ts      # ALTERAR (novo systemKey fallback)
├── scripts/backfill-financial-entry-allocations.ts                    # CRIAR (script standalone, fora de prisma migrate)
└── src/modules/finance/financial-entries/                             # submódulo existente, Clean Architecture
    ├── financial-entries.module.ts                                    # ALTERAR (novos imports de módulo)
    ├── domain/
    │   ├── entities/financial-entry.entity.ts                         # ALTERAR
    │   ├── entities/financial-entry-payment.entity.ts                 # CRIAR
    │   ├── entities/financial-entry-allocation.entity.ts              # CRIAR
    │   ├── entities/financial-entry-attachment.entity.ts              # CRIAR
    │   └── errors/                                                    # CRIAR (allocation-mismatch, sale-order-linked-forbidden, invalid-attachment-file, attachment-not-found)
    ├── application/
    │   ├── dtos/financial-entry.dto.ts                                # ALTERAR
    │   ├── use-cases/assert-{chart-of-account,cost-center,customer,supplier}-exists.ts   # CRIAR
    │   ├── use-cases/assert-allocations-match-total.ts                # CRIAR
    │   ├── use-cases/{create,update}-financial-entry/**                # ALTERAR (+ .spec.ts)
    │   ├── use-cases/{delete,restore,find-financial-entry-by-id}-financial-entry/**  # ALTERAR (+ .spec.ts novos)
    │   ├── use-cases/list-financial-entries/**                        # ALTERAR (+ .spec.ts)
    │   └── use-cases/{upload,delete}-financial-entry-attachment/**    # CRIAR (+ .spec.ts)
    ├── infrastructure/
    │   ├── database/prisma-financial-entry.repository.ts              # ALTERAR (transação com nested writes)
    │   └── http/routes/
    │       ├── {create,update,list-financial-entries}-financial-entry/**  # ALTERAR (DTOs aninhados)
    │       ├── financial-entry-attachment/**                          # CRIAR (POST/GET/DELETE)
    │       └── shared/financial-entry.presenter.ts                    # ALTERAR
    └── tests/in-memory-financial-entry.repository.ts                  # ALTERAR

apps/erp/web/                                                          # @citybox/erp-web :3107
├── src/lib/navigation.ts                                              # inalterado (rotas já existem)
└── src/features/
    ├── financial-entries/                                             # feature alvo
    │   ├── GUIA.md                                                    # ATUALIZAR
    │   ├── api/financial-entries.service.ts                           # REESCREVER
    │   ├── api/financial-entry.dto.ts                                 # CRIAR
    │   ├── api/financial-entry.mapper.ts                              # CRIAR
    │   ├── hooks/query-keys.ts                                        # CRIAR
    │   ├── hooks/use-financial-entry-queries.ts                       # CRIAR
    │   ├── hooks/use-financial-entry-mutations.ts                     # CRIAR
    │   ├── hooks/use-financial-entry-list.ts                          # ALTERAR
    │   ├── hooks/use-financial-entry-form.ts                          # ALTERAR
    │   ├── lib/financial-entry-labels.ts                              # REESCREVER
    │   ├── lib/financial-entry-form-values.ts                         # ALTERAR (status agora vem do backend)
    │   ├── components/financial-entry-form/**                        # ALTERAR (dados reais, loading, trava read-only)
    │   ├── components/financial-entry-attachment-upload.tsx           # CRIAR (molde de product-image-upload)
    │   ├── pages/financial-entry-edit-page.tsx                        # ALTERAR (React Query)
    │   ├── services/financial-entry.service.ts                        # REMOVER (ao final)
    │   ├── data/mock-financial-entries.ts                             # REMOVER (ao final)
    │   └── data/mock-card-brands.ts                                   # AVALIAR (vira sugestões, não fonte única — ver research.md)
    ├── chart-of-accounts/hooks/use-chart-of-account-options-query.ts   # CRIAR (molde de bank-accounts)
    └── cost-centers/hooks/use-cost-center-options-query.ts             # CRIAR (molde de bank-accounts)
```

**Structure Decision**: mantém a Clean Architecture por submódulo já em vigor no backend
(`domain → application → infrastructure`, ver `api/AGENTS.md` §4/§4.1) e a convenção de pastas
por feature já em vigor no frontend (`api/hooks/lib/components/pages`, ver `web/AGENTS.md` §4.5).
Nenhuma estrutura nova é introduzida — a feature entra 100% dentro dos dois padrões existentes.
`FinancialEntryPayment`/`FinancialEntryAllocation`/`FinancialEntryAttachment` **não** viram
submódulos NestJS próprios com rotas dedicadas (diferente de `card-contracts`/`payment-methods`):
são coleções filhas do agregado `FinancialEntry`, substituídas por completo numa única transação
a cada `save()` — o precedente real no código é `SaleOrder.lines`/`.payments`
(`prisma-sale-order.repository.ts`), não `card-contracts`. Único filho com rota HTTP própria é
`FinancialEntryAttachment` (upload/delete assíncronos, fora do payload principal — ver spec FR-013/FR-014).

## Complexity Tracking

> Nenhuma violação de Constitution Check identificada — seção vazia por design.
