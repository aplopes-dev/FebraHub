# Implementation Plan: Proxy de documentos fiscais e pagamento real na NF-e

**Branch**: `030-proxy-documentos-pagamento-real` | **Date**: 2026-08-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/erp/030-proxy-documentos-pagamento-real/spec.md`

## Summary

Três correções independentes, mesma raiz temática (integração erp-web/erp-api ↔ fiscal-api):
(B1) o proxy `/api/proxy/fiscal` e o adapter HTTP do erp-api não elevam/formatam corretamente
duas formas de rota da fiscal-api (lista de documentos por query `companyId`, download de
DANFE/DANFSE que exige header `X-Company-Id`); (B2) 4 formulários de pedido/compra/OS ainda leem
formas de pagamento de um catálogo mock local, cujos ids vazam para `SaleOrder.payments[].methodId`
e bloqueiam a emissão de NF-e — corrigido trocando a fonte pelo cadastro real
(`/v1/payment-methods`) e uma migração de dados que resolve os pedidos já gravados; (B3) a
fiscal-api multiplica `issRate` por 100 ao montar `pAliq` da DPS, mas o erp-api já envia esse
valor em percentual (0–100) — correção de uma linha no builder + testes.

## Technical Context

**Language/Version**: TypeScript 5.8 (strict), Node.js (NestJS 11 nos 3 backends), React 19 /
Next.js 16 (erp-web)

**Primary Dependencies**: NestJS, Prisma, `@mui/material` + `@citybox/mui` (erp-web), Jest (todos
os 3 pacotes)

**Storage**: PostgreSQL — schema `erp` (`apps/erp/api/prisma/schema.prisma`, `PaymentMethod`,
`SaleOrder`); fiscal-api não tem mudança de schema (B1/B3 são runtime, não dado)

**Testing**: Jest (`erp-api`, `fiscal-api`); sem harness de frontend em `erp-web` (dívida
conhecida, documentada — sem mudança nesta feature)

**Target Platform**: Docker Compose em produção (`services/platform`), 3 apps afetados:
`erp-api` (:3114), `erp-web` (:3107), `fiscal-api` (:3116)

**Project Type**: Monorepo multi-app (bugfix cross-cutting, sem app novo)

**Performance Goals**: N/A — correção de comportamento, não de performance

**Constraints**: Fail-closed obrigatório em toda elevação de token (B1); backfill de dado não
pode inventar vínculo para id não reconhecido (B2); correção de `pAliq` não pode regredir o
caminho sem retenção (B3)

**Scale/Scope**: 3 arquivos de proxy/adapter (B1), 4 formulários + 1 migração de dados (B2), 1
arquivo de builder XML + testes (B3)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Docs-as-Code | `apps/erp/web/AGENTS.md`, `apps/erp/api/AGENTS.md`, `services/fiscal-api/AGENTS.md` serão atualizados na mesma operação (§7 do `AGENTS.md` raiz) |
| II. Backend-driven search/paginação | Não aplicável — nenhuma listagem nova |
| III. pnpm único | Mantido, nenhum novo pacote |
| IV. Atomic design / `@citybox/ui` | Não aplicável ao B1/B3 (backend); B2 troca fonte de dado de um `Select`/`Autocomplete` já existente em `@citybox/mui`, sem novo componente |
| V. Isolamento de tenant / schema próprio | B2 não muda schema (backfill de dado); toda query do backfill é escopada por `organizationId`, mesmo padrão de `TENANT_SCOPED_MODELS` |

Nenhuma violação. Sem necessidade de `Complexity Tracking`.

## Project Structure

### Documentation (this feature)

```text
specs/erp/030-proxy-documentos-pagamento-real/
├── plan.md              # este arquivo
├── spec.md
├── checklists/requirements.md
└── tasks.md              # gerado por /speckit-tasks
```

### Source Code (arquivos afetados)

```text
apps/erp/web/src/
├── app/api/proxy/fiscal/[...path]/route.ts        # B1: novo allowlist p/ lista de documentos + X-Company-Id no download
├── features/sales-orders/components/sale-order-payments-panel.tsx  # B2: fonte de dado (via form-view)
├── features/sales-orders/components/sale-order-form-view.tsx       # B2: troca listPaymentMethods() por hook real
├── features/purchases/components/purchase-payments-panel.tsx       # B2: idem
├── features/purchases/services/purchase.service.ts                 # B2: remove listPaymentMethods() mock
├── features/service-orders/components/service-order-payment-dialog.tsx # B2: idem
├── features/purchases/data/mock-payment-methods.ts                 # B2: removido no final
└── features/nfe-issuance/... (mensagem de bloqueio, ver erp-api)   # B2: FR-009 é mensagem do backend, repassada como está

apps/erp/api/src/
├── modules/fiscal/infrastructure/http-fiscal-api.adapter.ts        # B1: companyId como query param
├── modules/nfe-issuance/application/use-cases/issue-nfe/issue-nfe.use-case.ts  # B2: FR-009, distinguir "sem fiscalCode" de "não cadastrada"
└── modules/sales/... (script/use-case de backfill, um-tiro)         # B2: migração de dados

apps/erp/api/scripts/ ou apps/erp/api/src/modules/sales/application/use-cases/backfill-.../  # B2: local do backfill (decidido no research.md)

services/fiscal-api/src/modules/nfse/infrastructure/xml/dps-xml.builder.ts  # B3: remove * 100
services/fiscal-api/src/modules/nfse/tests/fixtures/issue-nfse-test-context.ts  # B3: fixture ajustada para percentual
```

## Complexity Tracking

*Vazio — nenhuma violação de constituição.*
