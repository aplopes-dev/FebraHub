# Implementation Plan: Motor de recebíveis do contrato de cartões

**Branch**: `005-card-receivables-engine` | **Date**: 2026-08-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/erp/005-card-receivables-engine/spec.md`

## Summary

Hoje, fechar uma venda no cartão gera **um único** `FinancialEntry` bruto, já quitado, vencendo no
dia da venda — para qualquer forma de pagamento (`PrismaSaleOrderRepository.maybeCreateReceivable`,
`sales/infrastructure/database/prisma-sale-order.repository.ts:261-349`). O cadastro de contrato de
cartão (`CardContract`/`CardPaymentMethod`/`CardRateTier`, módulo `finance/card-contracts`) existe,
mas nada o consome.

Esta entrega faz o contrato produzir efeito: ao fechar uma venda, cada pagamento em
débito/crédito/Pix tem seu contrato de cartão resolvido (via `bankAccountId`, já capturado hoje) e,
quando há correspondência de método (`type`+`brand`), gera **N recebíveis** com taxa abatida,
vencimento calculado (dias úteis/corridos, parcela única ou múltipla) e conta bancária do contrato —
substituindo o recebível único de hoje **apenas para os pagamentos em cartão/Pix**; pagamentos em
dinheiro/boleto/transferência continuam exatamente como hoje. Sem contrato/método correspondente, o
pagamento cai no comportamento atual (bruto, quitado, hoje) com um aviso visível — a venda nunca
falha por causa do motor.

**Abordagem técnica**: o cálculo (taxa efetiva, arredondamento, datas) é uma **função pura** em
`finance/card-contracts/domain/services/` (sem Prisma, sem NestJS), importada por **TS import direto**
(não injeção de dependência) pelo `PrismaSaleOrderRepository` — preserva a decisão já registrada em
`api/AGENTS.md` §9 de o repositório de `sales` gravar `FinancialEntry` via Prisma direto, sem
depender do `FinanceModule`. `SaleOrderPayment` ganha os campos que faltam para identificar a venda
no cartão (`cardPaymentType`, `brand`, `installments`); `FinancialEntry` ganha os campos de
rastreabilidade (bruto, taxa, contrato/método, parcela). Idempotência por
`(saleOrderPaymentId, installmentSequence)` — seguro porque, uma vez fechado o pedido, `SaleOrderPayment.id`
é estável (`UpdateSaleOrderStatusUseCase.updateStatus()` preserva os pagamentos carregados do banco;
`UpdateSaleOrderUseCase`, que poderia reescrevê-los, já bloqueia edição pós-fechamento via
`SaleOrderAlreadyClosedError`).

## Technical Context

**Language/Version**: TypeScript ~5.8 (backend NestJS 11 · frontend Next.js 16 / React 19)

**Primary Dependencies**: NestJS 11, Prisma (schema único `apps/erp/api/prisma/schema.prisma`,
schema Postgres `erp`), React Query 5, `@citybox/mui` (frontend)

**Storage**: PostgreSQL (schema `erp` dentro do banco configurado em `DATABASE_URL`, `campinas_dev`
em dev local) — sem model novo (só campos novos em `SaleOrderPayment` e `FinancialEntry`, ambos já em
`TENANT_SCOPED_MODELS`)

**Testing**: Node test runner nativo (`node --import tsx --test`) para use cases/domain (padrão do
`erp-api`, ver `api/AGENTS.md`); repositório in-memory para os use cases; nenhum framework de teste
de integração/E2E existente para o fechamento de venda hoje (gap pré-existente, não desta entrega)

**Target Platform**: Linux server (erp-api :3114) + navegador (erp-web :3107)

**Project Type**: web (API NestJS Clean Architecture + frontend Next.js App Router)

**Performance Goals**: sem meta nova — o cálculo roda dentro da mesma transação síncrona de
fechamento de venda que já existe hoje; função pura de calendário/aritmética é O(parcelas), não
introduz I/O adicional por parcela

**Constraints**: cálculo de dia útil só considera segunda–sexta (sem calendário de feriados —
limitação documentada no spec); motor nunca pode falhar o fechamento da venda (fallback obrigatório);
sem recálculo retroativo de recebíveis já existentes

**Scale/Scope**: 1 tenant único (Ilhéus, ADR C-15/single-city); volume de vendas no cartão por loja é
baixo-médio (comércio local) — sem necessidade de otimização de lote

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Docs-as-Code (hierarquia `AGENTS.md`) | ✅ Plano prevê atualizar `apps/erp/api/AGENTS.md` §9 (`card-contracts`, `sales`) e `apps/erp/web/AGENTS.md` (§4.5 `card-contracts`, `sales-orders`) na mesma operação que o código (ver Critérios de Aceite técnicos do spec). |
| II. Busca/paginação no backend | N/A — esta feature não introduz listagem nova; os campos novos aparecem em endpoints de listagem já existentes (`GET /v1/financial-entries`) sem mudar a estratégia de paginação. |
| III. Package manager único (pnpm) | ✅ Sem novo pacote/dependência — reutiliza stack existente. |
| IV. Atomic design / `@citybox/ui` compartilhado | N/A neste app — `apps/erp/web` usa `@citybox/mui` + `@/components/ui/*` (padrão já documentado no `AGENTS.md` do app, que tem precedência local sobre a diretriz genérica de `@citybox/ui`). Os componentes novos (Select de bandeira/parcelas no painel de pagamentos) reaproveitam primitivos `@citybox/mui` já usados na feature. |
| V. Isolamento de tenant / schema próprio por app | ✅ Sem model novo. Campos novos entram em `SaleOrderPayment` e `FinancialEntry`, ambos **já** listados em `TENANT_SCOPED_MODELS` (`tenant-scope.extension.ts:59-75`) — nenhuma alteração nessa allowlist é necessária. Toda leitura/escrita continua via `prisma.scoped`. |
| Autenticação Keycloak / guards locais | ✅ Sem rota nova; permissões seguem as já existentes em `sale-orders` (fechamento) e `card-contracts`/`financial-entries` (leitura dos campos novos) — `org.view` leitura / `store.finance.manage` escrita, já vigentes. |
| Gate de verificação (build/lint/typecheck/test) | ✅ Gate padrão nos dois pacotes, listado nas Orientações do spec. |
| Sem commit sem autorização | ✅ Respeitado — este plano não commita nada. |
| Sem `@ts-ignore`/`eslint-disable` | ✅ Nenhuma necessidade identificada — todos os campos novos são tipáveis normalmente (enums Prisma reaproveitados). |

**Resultado**: PASS. Nenhuma violação a justificar em Complexity Tracking.

### Re-check pós-Fase 1 (design)

`data-model.md`, `contracts/` e `quickstart.md` confirmam o desenho: **zero model novo** (só campos
opcionais em `SaleOrderPayment`/`FinancialEntry`, ambos já tenant-scoped), **zero rota HTTP nova**
(deltas em DTOs de rotas já existentes), **zero pacote/dependência nova**, e a resolução de dados
segue Prisma-direto dentro da transação existente — sem reabrir a decisão de não injetar
`FinanceModule` em `SalesModule`. **Resultado**: PASS, inalterado.

## Project Structure

### Documentation (this feature)

```text
specs/erp/005-card-receivables-engine/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── sale-order-payment.contract.md
│   └── financial-entry-card-settlement.contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks command — NOT created by /speckit-plan)
```

### Source Code (repository root)

Monorepo Turborepo — app **web application** (API NestJS Clean Architecture + frontend Next.js). Sem
projeto novo; toda mudança cai dentro de `apps/erp/api` e `apps/erp/web` já existentes.

```text
apps/erp/api/
├── prisma/
│   ├── schema.prisma                                            # ALTERAR — ver data-model.md
│   └── migrations/<timestamp>_add_card_settlement_engine/        # gerado por `db:migrate:dev`
├── src/modules/finance/card-contracts/
│   ├── domain/services/
│   │   ├── business-day-calendar.ts                              # CRIAR — pura, seg-sex
│   │   ├── business-day-calendar.spec.ts                         # CRIAR
│   │   ├── card-settlement-calculator.ts                         # CRIAR — pura, coração da feature
│   │   └── card-settlement-calculator.spec.ts                    # CRIAR — TDD, 6+ cenários do spec
│   └── card-contracts.module.ts                                  # ALTERAR? — só se precisar exportar tipos (não DI)
└── src/modules/sales/
    └── infrastructure/database/
        ├── prisma-sale-order.repository.ts                       # ALTERAR — maybeCreateReceivable
        └── resolve-card-settlement.ts                             # CRIAR — resolução contrato/método via Prisma direto (mesmo padrão do lookup de ChartOfAccount/CostCenter já existente no arquivo)

apps/erp/api/src/modules/sales/
└── application/use-cases/create-sale-order/*.spec.ts              # sem mudança de contrato — só garantir zero regressão

apps/erp/web/src/features/card-contracts/
├── data/
│   ├── card-providers.ts                                          # CRIAR — MOCK_PROVIDERS migrado (critério de aceite já existente)
│   └── card-brands.ts                                             # CRIAR — BRAND_OPTIONS extraído de payment-method-form-dialog.tsx
├── components/
│   ├── payment-method-form-dialog.tsx                             # ALTERAR — importa card-brands.ts em vez de const local
│   └── card-contract-form-view.tsx                                # ALTERAR — textos de ajuda (efeito de cada config)
├── types/card-contract.ts                                         # ALTERAR — remove MOCK_PROVIDERS
└── GUIA.md                                                        # ATUALIZAR — efeito no financeiro

apps/erp/web/src/features/sales-orders/
├── components/sale-order-payments-panel.tsx                       # ALTERAR — Select tipo cartão + bandeira (card-brands.ts) + parcelas
├── data/mock-payment-methods.ts (via features/purchases, reexportado) # ALTERAR ou substituído — split débito/crédito distintos
├── types/                                                          # ALTERAR — SaleOrderFormValues.payments[] ganha campos novos
└── GUIA.md                                                         # ATUALIZAR

apps/erp/web/src/features/financial-entries/
├── components/financial-entry-list-table.tsx (ou equivalente)      # ALTERAR — indicador visível de fallback + bruto/taxa
└── types/financial-entry.ts                                        # ALTERAR — campos novos no DTO de leitura
```

**Structure Decision**: extensão de dois apps já existentes (`apps/erp/api`, `apps/erp/web`), sem
novo projeto/pacote. Backend em Clean Architecture (`domain/services` puro + integração via
Prisma-direto no repositório de `sales`, preservando a arquitetura documentada). Frontend: pequenas
extensões cirúrgicas em três features já existentes (`card-contracts`, `sales-orders`,
`financial-entries`), sem feature nova.

## Complexity Tracking

*Sem violações da Constitution a justificar — tabela vazia de propósito.*
