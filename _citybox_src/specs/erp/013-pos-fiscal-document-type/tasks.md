# Tasks: Tipo de NF emitida pelo PDV

**Feature**: `specs/erp/013-pos-fiscal-document-type` | **Testes**: backend só (D0).
**Escopo:** config (erp-api + erp-web). **Consumo PDV DEFERIDO** (blocker de app/stack).

## Phase 1 — erp-api (entidade + persistência + exposição)
- [x] T001 Prisma: `model PosFiscalSettings` (schema `erp`; `organizationId @unique`, `posDocumentModel` String? `MODEL_55|MODEL_65`, `updatedByUserId` String?, timestamps). schema.prisma.
- [x] T002 Migration escopada (migrate diff → docker psql → `migrate resolve --applied` → `prisma generate`). **→ database-reviewer.**
- [x] T003 Domínio: `PosFiscalSettings` entity (default model=null) + repo interface (`findByOrganization`, `save`) + validator (se necessário) — espelha `PosPolicy`.
- [x] T004 Infra: prisma repo + in-memory repo (testes).
- [x] T005 UseCases: `GetPosFiscalSettings` (cria default null na 1ª leitura, nunca 404) + `UpsertPosFiscalSettings` (grava modelo + updatedByUserId).
- [x] T006 Rotas: `GET /v1/pos-fiscal-settings` (`org.view`), `PUT /v1/pos-fiscal-settings` (`org.pos_policies.manage`, `@OrganizationId`+`@CurrentUser`), `GET /v1/pos/fiscal-settings` (`@Public`+`DeviceAuthGuard`+`@CurrentTerminal`). Presenter `{data}`.
- [x] T007 Módulo `PosFiscalSettingsModule` (imports TenancyModule + PosTerminalsModule) + registrar no app.module.
- [x] T008 [P] Testes jest (in-memory): get cria default null; upsert persiste modelo 55/65 + updatedByUserId; troca de modelo.

## Phase 2 — erp-web (aba de configuração)
- [x] T009 feature `pos-fiscal-document-type`: api (dto/service via `comercioFetch` — erp-api; e leitura de `cscConfigured`/certificado via `fiscalFetch`) + hooks (query + upsert).
- [x] T010 [US1] `components/pos-fiscal-type-tab.tsx`: aviso legal (Lei 8.846), select modelo (55/65/nenhum), toggle ICMS **desabilitado** + motivo, Salvar; **bloqueio Modelo 65 sem CSC** (mensagem → aba geral) + **aviso** de certificado ausente.
- [x] T011 [US1] Integrar como aba `pdv` em `fiscal-tabs.tsx` (`?aba=pdv`).

## Phase 3 — Docs & Gates
- [x] T012 [P] `features/pos-fiscal-document-type/GUIA.md` + `apps/erp/api/AGENTS.md` + `apps/erp/web/AGENTS.md`.
- [x] T013 Gates: erp-api typecheck/lint/test; erp-web typecheck/lint(diff)/build.
- [x] T014 Reviewers: **database-reviewer** (migration) + react + typescript + security (permissão/config que decide emissão). Aplicar CRITICAL/HIGH.
- [x] T015 Conferência (5 camadas) + EXECUCAO.md (013 PARCIAL: config CONCLUÍDA; consumo PDV DEFERIDO/registrado).

## DEFERIDO (consumo PDV — FR-101/102/103) — NÃO nesta entrega
Blocker: `apps/pdv/frontend` sem código; PDV real é Flutter `apps/pdv/app` / legado `apps/pdv/legado`,
sem integração fiscal. Wirar emissão no fechamento é feature própria (stack Flutter/legado).
Config já exposta por `GET /v1/pos/fiscal-settings` (device) para consumo futuro.
