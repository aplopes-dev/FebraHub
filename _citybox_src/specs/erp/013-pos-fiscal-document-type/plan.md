# Implementation Plan: Tipo de NF emitida pelo PDV

**Branch**: `013-pos-fiscal-document-type` | **Date**: 2026-08-13 | **Spec**: [spec.md](./spec.md)

## Summary
Config por organização do modelo que o PDV emite (55/65/nenhum), no erp-api (entidade própria,
espelhando `PosPolicy`), exposta por rota de gestão (lojista) e rota device (PDV). Tela no
erp-web (4ª aba de `/configuracoes/fiscal`) com bloqueio de Modelo 65 sem CSC e aviso de
certificado. **Consumo no PDV DEFERIDO** (blocker: `apps/pdv/frontend` sem código; PDV real é
Flutter `apps/pdv/app`/legado `apps/pdv/legado`, sem integração fiscal — outra stack).

## Constitution Check
| Princípio | Situação |
|---|---|
| I. Docs-as-Code | ✅ `apps/erp/api/AGENTS.md` + `apps/erp/web/AGENTS.md` + GUIA.md. (PDV AGENTS quando o consumo for feito.) |
| II. Backend-driven | ✅ singleton por org. |
| III. pnpm | ✅ |
| IV. DS | ✅ `@citybox/mui`. |
| V. Tenant/Schema | ⚠️ **Migration Prisma** (tabela `pos_fiscal_settings`, schema `erp`) → **database-reviewer**. Isolamento por organizationId (header/TenantContext) e por terminal (device). |

## Decisões
- **D1 — Entidade própria** `PosFiscalSettings` (schema `erp`), espelhando `PosPolicy`: uma por
  organização (`organizationId @unique`), campo `posDocumentModel` (`MODEL_55|MODEL_65|null`),
  `updatedByUserId` (quem alterou), timestamps. Default = `null` (não configurado — venda sem doc).
  NÃO no Emitente da fiscal-api; NÃO dentro de `PosPolicy` (não é alçada).
- **D2 — Rotas**: gestão `GET/PUT /v1/pos-fiscal-settings` (org do header; GET `org.view`, PUT
  `org.pos_policies.manage` — manage de config do PDV, distinta da leitura; permissão fiscal
  dedicada = backlog) + device `GET /v1/pos/fiscal-settings` (`@Public`+`DeviceAuthGuard`, org do
  terminal) para o PDV ler.
- **D3 — Bloqueio Modelo 65 sem CSC**: no **frontend**, usando `cscConfigured` do
  `GET /v1/companies/:id` (fiscal-api). O erp-api não conhece o CSC (fiscal-api), então a guarda
  vive onde o dado está. Aviso de certificado idem (lista/status de certificados da fiscal-api).
- **D4 — Toggle ICMS consumidor final**: desabilitado + motivo (DIFAL inexistente — backlog).
- **D5 — Consumo PDV DEFERIDO** (blocker de app/stack). Config já exposta por rota device.

## Estrutura
```
apps/erp/api/
  prisma/schema.prisma                      # + model PosFiscalSettings (schema erp)
  prisma/migrations/<ts>_pos_fiscal_settings/migration.sql
  src/modules/pos-fiscal-settings/          # espelha pos-policies (entity/repo/usecases/routes/module)
apps/erp/web/src/
  app/(app)/configuracoes/fiscal/fiscal-tabs.tsx  # + aba "pdv"
  features/pos-fiscal-document-type/        # api/hooks/components + GUIA.md
```

## Phase 0/1
Sem NEEDS CLARIFICATION. Migration escopada (migrate diff → docker psql → migrate resolve →
generate). Testes: erp-api jest in-memory (get cria default null; upsert persiste modelo; +
Postgres se viável). Post-design: migration → database-reviewer.
