# Implementation Plan: Ajustes no módulo Financeiro

**Branch**: `007-financeiro-ajustes-ui` | **Date**: 2026-08-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/erp/007-financeiro-ajustes-ui/spec.md`

## Summary

Dez ajustes de UI/dados no módulo Financeiro do `erp-web`/`erp-api`, do menor ao maior escopo técnico:
(1) resumo e colunas do Extrato, (2) colunas de Lançamentos, (3) labels + forma de pagamento real no formulário de lançamento, (4) importação de extrato OFX sem conta obrigatória com auto-detecção por código de banco, (5) reestruturação das categorias da DRE em 9 grupos fixos com sinal, (6) Provedor de contrato de cartão como lista fechada, (7) catálogo completo de bancos, (8) CRUD real de Formas de pagamento no backend (pré-requisito de 3), (9) Bandeira do pagamento como select fechado com label (reaproveitando `CARD_BRAND_OPTIONS` ampliado), (10) bloquear exclusão de lançamento com pagamento conciliado ativo.

Abordagem técnica: reaproveitar integralmente os padrões já estabelecidos no módulo `finance` do `erp-api` (Clean Architecture: `domain/application/infrastructure`, soft-delete + `isSystem`, seed via `store-setup`) e no `erp-web` (`features/<nome>/{api,hooks,store,components,pages}`, React Query + `DataTable`/`ListPagePanel` do `@citybox/mui`). A única entidade nova é `PaymentMethod` (espelha `CostCenter` 1:1); Banco, Provedor e Bandeira continuam catálogos estáticos de frontend; a DRE precisa de mudança de schema (2 campos em `FinancialGroup`) e reescrita do use-case de agregação (não é só seed). Item (10) depende de fechar um gap encontrado no grounding desta rodada: o frontend já chama `POST .../reconcile/undo` e a entidade `BankStatementTransaction.undoReconciliation()` já existe, mas a rota/use-case correspondente nunca foi implementada no `erp-api` (`research.md` R9) — sem ela, o bloqueio de exclusão (FR-006e) não teria saída (FR-006f).

## Technical Context

**Language/Version**: TypeScript ~5.8.3 (strict) — backend Node.js/NestJS 11, frontend Next.js 16 (App Router) + React 19.

**Primary Dependencies**: Backend: NestJS 11, Prisma (schema `erp`, single-schema em `apps/erp/api/prisma/schema.prisma`), `class-validator`/`class-transformer`, `ofx-js` + `iconv-lite` (parser OFX já existente). Frontend: `@citybox/mui` (MUI v9), `@tanstack/react-query` v5, `zustand` (estado de UI de lista), `comercioFetch` (proxy autenticado `/api/proxy/comercio`).

**Storage**: PostgreSQL, banco único `citybox`, schema `erp` — tabela nova `payment_methods`; `financial_groups` ganha 2 colunas (`catalog_order`, `sign`); nenhuma outra migration de schema.

**Testing**: Backend — Jest (padrão do módulo `finance`, `*.use-case.spec.ts` com `InMemory*Repository`, molde `cost-centers-test-factory.ts`). Frontend — Vitest + Testing Library (RTL), seguindo `rules/ecc/react/testing.md`.

**Target Platform**: Web — `erp-api` (NestJS, porta 3114) + `erp-web` (Next.js, porta 3107), ambos atrás do proxy autenticado Keycloak já existente.

**Project Type**: Web application (monorepo Turborepo/pnpm) — apps `erp/api` + `erp/web` dentro da mesma feature.

**Performance Goals**: Sem meta nova além do já vigente no módulo (`Backend-Driven Search and Pagination` — listagens paginadas server-side, debounce 400ms). `GET /v1/payment-methods/options` e a DRE reestruturada continuam devolvendo listas pequenas (≤ ~30-40 itens), sem risco de N+1 novo.

**Constraints**: Zero migração de backfill de dado histórico para `FinancialEntryPayment.paymentMethod` (permanece `String` livre, ver `research.md` R1) — lançamentos antigos com valores do enum descontinuado continuam exibíveis somente-leitura. Zero downtime esperado — mudança de schema é aditiva (nova tabela + 2 colunas com default), sem `DROP`/`NOT NULL` retroativo. Bandeira (`FinancialEntryPayment.cardBrand`/`CardPaymentMethod.brand`) permanece `String?` livre — ampliar `CARD_BRAND_OPTIONS` não exige migration nem invalida valores já persistidos (R10). O bloqueio de exclusão (US10) reaproveita `BankStatementMatchRepository.findActiveFinancialEntryIds` (método já existente) — nenhuma query nova, nenhuma alteração em `BankStatementMatch`/`BankStatementTransaction` além do `UndoReconciliationUseCase` novo que hard-deleta o match ao desfazer (R9).

**Scale/Scope**: 10 telas/fluxos tocados, 1 entidade Prisma nova, 2 campos novos em entidade existente, 1 endpoint novo (`/v1/payment-methods` + `/options` + `/restore`), 1 endpoint com contrato alterado (`GET /v1/reports/income-statement`), 1 endpoint com parâmetro opcional novo (`POST /v1/bank-reconciliation/statements`), 1 endpoint de preview já implementado (`research.md` R8), 1 endpoint novo faltante a fechar (`POST /v1/bank-statements/:bankStatementId/transactions/:transactionId/reconcile/undo`, módulo `bank-reconciliation`, R9), 1 endpoint com contrato alterado adicional (`DELETE /v1/financial-entries/:id` → 409 quando há conciliação ativa), 1 catálogo estático de frontend ampliado (`CARD_BRAND_OPTIONS`, R10).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Docs-as-Code (`AGENTS.md`) | ✅ PASS (com ação obrigatória em `/speckit-tasks`/implementação) — `apps/erp/api/AGENTS.md` e `apps/erp/web/AGENTS.md` MUST ser atualizados na mesma operação que tocar `payment-methods` (módulo novo), `financial-groups`/`chart-of-accounts` (campos novos) e `financial-entries`/`bank-reconciliation` (mudança de validação/contrato, novo use-case `UndoReconciliation`, novo erro de domínio `FinancialEntryNotRemovableError`). Registrar isso como task explícita no `/speckit-tasks`. |
| II. Backend-Driven Search and Pagination | ✅ PASS — `GET /v1/payment-methods` segue o mesmo padrão server-side (`search`/`page`/`perPage`, debounce 400ms no client) já usado por `cost-centers`; `/options` é uma lista pequena e fechada (≤ dezenas de itens), mesmo padrão de `useCostCenterOptionsQuery`/`useChartOfAccountOptionsQuery` já aprovado no monorepo para esse caso. |
| III. Single Package Manager (pnpm) | ✅ PASS — nenhuma dependência nova; nenhum comando `npm`/`yarn` necessário. |
| IV. Atomic Design and Shared UI Components | ✅ PASS — toda UI nova reaproveita primitivos `@citybox/mui` já em uso no módulo (`Select`, `Autocomplete`, `DataTable`, `Dialog`, `FormField`); zero componente local duplicando átomo/molécula existente. |
| V. Tenant Isolation and Independent Database Schemas | ✅ PASS — `PaymentMethod` é organization-scoped (`organizationId` + `@@unique([organizationId, name])`, mesmo padrão de `CostCenter`); UUID via `citybox_uuid_v7()`; `database-reviewer` gate obrigatório na migration (registrar em `/speckit-tasks`). |

**Nenhuma violação a justificar em Complexity Tracking.**

**Re-check pós-Phase 1 (US9/US10, adicionadas na Clarification de 2026-08-09)**: sem mudança de veredito nos 5 princípios. `UndoReconciliationUseCase`/rota nova (R9) segue o mesmo padrão Clean Architecture + `TenantContextGuard` já usado por `ReconcileTransactionUseCase` (mesmo módulo, mesmo escopo `organizationId`); `DeleteFinancialEntryUseCase` ganha uma consulta de existência antes do `softDelete()`, sem novo endpoint; `CARD_BRAND_OPTIONS` ampliado é edição de constante de frontend, zero componente novo fora de `@citybox/mui`. Único ponto a reforçar no Docs-as-Code: `apps/erp/api/AGENTS.md` precisa registrar o módulo `bank-reconciliation` ganhando seu primeiro use-case/rota de "desfazer", já que hoje o `AGENTS.md` documenta só reconciliar (não desfazer).

## Project Structure

### Documentation (this feature)

```text
specs/erp/007-financeiro-ajustes-ui/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
├── contracts/
│   ├── payment-methods.md
│   ├── income-statement.md
│   ├── bank-reconciliation-import.md
│   └── financial-entry-delete-guard.md    # NOVO — DELETE guard + rota faltante de undo
└── tasks.md              # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
apps/erp/api/
├── prisma/schema.prisma                                    # + model PaymentMethod; + FinancialGroup.catalogOrder/sign; + enum FinancialGroupSign
├── src/modules/finance/
│   ├── payment-methods/                                     # NOVO módulo — espelha cost-centers/
│   │   ├── domain/{entities,repositories,errors}/
│   │   ├── application/{dtos,use-cases/{create,update,delete,restore,list,find-by-id,list-options}-payment-method}/
│   │   ├── infrastructure/{database/prisma-payment-method.repository.ts, http/routes/*}/
│   │   ├── payment-methods.module.ts
│   │   └── tests/{payment-methods-test-factory.ts, in-memory-payment-method.repository.ts}
│   ├── financial-entries/
│   │   ├── infrastructure/http/routes/shared/financial-entry.dto.ts   # @IsIn → @IsUUID + assertPaymentMethodExists
│   │   ├── domain/errors/financial-entry-not-removable.error.ts   # NOVO (R9) — nome com "NotRemovable" para o app-exception.filter mapear 409 automaticamente
│   │   ├── application/use-cases/delete-financial-entry/delete-financial-entry.use-case.ts   # + BankStatementMatchRepository.findActiveFinancialEntryIds antes do softDelete (R9)
│   │   └── financial-entries.module.ts   # imports: [..., forwardRef(() => BankReconciliationModule)] (R9 — quebra o ciclo com bank-reconciliation)
│   ├── financial-entries/application/use-cases/
│   │   └── (novo) assert-payment-method-exists.ts            # molde assert-cost-center-exists.ts
│   ├── reports/
│   │   ├── application/use-cases/get-income-statement/get-income-statement.use-case.ts   # reescrito (R6)
│   │   └── infrastructure/http/routes/shared/{income-statement-report.dto.ts, finance-report.presenter.ts}
│   └── bank-reconciliation/
│       ├── application/use-cases/import-bank-statement/import-bank-statement.use-case.ts  # bankAccountId opcional + auto-detecção (R8)
│       ├── application/use-cases/undo-reconciliation/undo-reconciliation.use-case.ts   # NOVO — fecha gap do R9 (frontend/entidade já existem, use-case+rota não)
│       ├── infrastructure/http/routes/undo-reconciliation/undo-reconciliation.route.ts   # NOVO
│       └── bank-reconciliation.module.ts   # + UndoReconciliationUseCase/Route; possível forwardRef espelhado (R9)
└── src/modules/store-setup/
    ├── application/seed-data/finance.seed.ts                 # + SEED_PAYMENT_METHODS, + 9 FinancialGroup/ChartOfAccount novos
    └── infrastructure/database/writers/finance.writer.ts       # + writePaymentMethods

apps/erp/web/
├── src/features/
│   ├── payment-methods/
│   │   ├── api/                                              # NOVO — dto/mapper/payment-methods.service.ts
│   │   ├── hooks/                                             # NOVO — query-keys, queries, mutations
│   │   ├── components/{payment-method-form-dialog,payment-method-list,payment-method-row-actions}.tsx  # ajuste de fonte de dado, UI inalterada
│   │   └── pages/payment-method-list-page.tsx                 # troca store mock por hook real
│   ├── financial-entries/
│   │   ├── types/financial-entry.ts                           # remove FINANCIAL_ENTRY_PAYMENT_METHODS
│   │   ├── components/financial-entry-form/financial-entry-payments-section.tsx  # labels Data/Forma/Valor + select real; Bandeira: Autocomplete freeSolo → Select fechado (US9)
│   │   ├── hooks/use-card-brand-suggestions.ts                 # candidato a remoção — órfão após US9 (confirmar em /speckit-tasks)
│   │   ├── components/transfer-dialog.tsx                     # select real
│   │   ├── components/financial-entry-list-table.tsx           # coluna Valor → Valor original + Valor final
│   │   └── (UI) mensagem de erro 409 no fluxo de exclusão (RowActionsMenu/ConfirmationDialog) → texto do backend (US10)
│   ├── financial-statement/
│   │   ├── pages/financial-statement-page.tsx                 # remove <BankAccountBalancesPanel />
│   │   ├── components/bank-account-balances-panel.tsx          # REMOVIDO
│   │   ├── hooks/use-bank-account-balances.ts                  # REMOVIDO
│   │   └── components/financial-statement-table.tsx             # colunas: Competência+Vencimento fixas, Método de pagamento, Valor original/final
│   ├── financial-results/                                      # consumo do novo shape groups[]/operatingResultCents
│   ├── bank-accounts/lib/bank-catalog.ts                        # 19 bancos
│   ├── card-contracts/
│   │   ├── data/card-brands.ts                                  # CARD_BRAND_OPTIONS ampliado (US9/R10) — compartilhado com sales-orders/financial-entries
│   │   ├── data/card-providers.ts                               # 20 provedores, lista fechada
│   │   └── components/card-contract-form-view.tsx                # Autocomplete freeSolo → fechado
│   └── bank-reconciliation/
│       ├── components/statement-import-dialog.tsx  # bankAccountId opcional + pré-seleção
│       ├── api/bank-reconciliation.service.ts       # undoReconciliationApi já existe — sem mudança, só passa a funcionar (R9)
│       └── hooks/use-bank-reconciliation-mutations.ts  # useUndoReconciliationMutation já existe — idem
```

**Structure Decision**: Monorepo existente, sem novo app/pacote. Todo trabalho vive dentro de `apps/erp/api` (módulo `finance` + `store-setup`) e `apps/erp/web` (`src/features/*`), seguindo a convenção já documentada em `apps/erp/api/AGENTS.md` e `apps/erp/web/AGENTS.md` — nenhuma estrutura nova é introduzida, só arquivos novos dentro dos padrões existentes.

## Complexity Tracking

*Nenhuma violação de Constitution Check — tabela não aplicável.*
