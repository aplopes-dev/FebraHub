# Tasks: Padrões Fiscais

**Feature**: `specs/erp/014-fiscal-default-taxes` | **Testes**: backend jest in-memory (D0 + DB erp não provisionado).
Base de 015/016/018/019.

## Phase 1 — erp-api: schema + migration
- [x] T001 Prisma: `model FiscalGroup` (schema erp; id, organizationId, taxType String `ICMS|IPI|PIS_COFINS|ISSQN`, name, timestamps; index (organizationId, taxType)). `model FiscalDefaultTaxes` (id, organizationId @unique, icmsGroupId?/ipiGroupId?/pisCofinsGroupId?/issqnGroupId? (FK opcional → FiscalGroup, onDelete SetNull), cfop String @default(""), timestamps). `ProductFiscal` += `issqn String @default("")` + `issqnApplyToAll Boolean @default(true)`. `ProductFiscalBranch` += `issqn String @default("")`. Back-relations em Organization.
- [x] T002 Migration escopada versionada (⚠️ NÃO aplicável via psql — DB erp não provisionado; `prisma generate` offline). **→ database-reviewer.**

## Phase 2 — erp-api: módulo fiscal-defaults
- [x] T003 Domínio: `FiscalGroup` entity + repo interface (`listByOrganization(orgId, taxType?)`); `FiscalDefaultTaxes` entity (createDefault vazio; update) + repo interface (`findByOrganization`, `save`).
- [x] T004 Infra: prisma repos (`prisma.scoped`) + in-memory repos.
- [x] T005 UseCases: `ListFiscalGroups(orgId, taxType?)`; `GetFiscalDefaultTaxes` (cria default vazio na 1ª leitura, nunca 404); `UpsertFiscalDefaultTaxes` (valida que cada groupId referenciado é do tributo certo e da org; cfop string).
- [x] T006 Rotas: `GET /v1/fiscal-groups?taxType=` (`org.view`); `GET /v1/fiscal-default-taxes` (`org.view`); `PUT /v1/fiscal-default-taxes` (`store.catalog.manage`, `@OrganizationId`). Presenter `{data}`.
- [x] T007 Módulo `FiscalDefaultsModule` (TenancyModule) + registrar no app.module. Seed mínimo de FiscalGroup (ou documentar backoffice).
- [x] T008 [P] Testes jest: list por tributo; get cria default vazio; upsert persiste padrão por tributo + cfop; rejeita groupId de tributo/org errados.

## Phase 3 — erp-api: issqn em ProductFiscal (catalog)
- [x] T009 `ProductFiscal` entity: `issqn: FiscalGroupField` + `issqn` no `FiscalBranchOverride`; normalizeGroupField/normalizeBranches cobrindo issqn. DTO (`product-fiscal.dto.ts`) + mapper prisma + presenter + upsert/list rotas incluem issqn (mesmo padrão de icms).
- [x] T010 [P] Teste jest do ProductFiscal: issqn normaliza + persiste (mapper/entity) sem regressão nos outros 4.

## Phase 4 — erp-web: aba Padrões fiscais
- [x] T011 feature `fiscal-default-taxes`: api (dto/service `comercioFetch`: listFiscalGroups, get/putDefaults; CFOP do catálogo estático `fiscal-parameters/data/fiscal-options.ts`) + hooks (queries + upsert) + unsaved-guard.
- [x] T012 [US1] `components/fiscal-default-taxes-tab.tsx`: seção "Configuração Fiscal Padrão"; 5 selects (ICMS/IPI/PIS_COFINS/ISSQN via grupos + CFOP via catálogo); **estado vazio por tributo sem grupos**; Salvar explícito; texto-regra.
- [x] T013 [US1] Integrar como aba `padroes` em `fiscal-tabs.tsx` (`?aba=padroes`).

## Phase 5 — erp-web: herança em fiscal-parameters (consumidor)
- [x] T014 [US2] `fiscal-parameters`: buscar os padrões; para cada campo fiscal vazio do produto, exibir o valor do padrão **marcado como "herdado"** (badge/caption). Sem escrever no catálogo. Incluir issqn na tela de parâmetros (novo campo).

## Phase 6 — Docs & Gates
- [x] T015 [P] `features/fiscal-default-taxes/GUIA.md` + `apps/erp/api/AGENTS.md` (FiscalGroup/FiscalDefaultTaxes/issqn/rotas) + `apps/erp/web/AGENTS.md` (feature + aba + herança em fiscal-parameters).
- [x] T016 Gates: erp-api typecheck/lint(diff)/test; erp-web typecheck/lint(diff)/build.
- [x] T017 Reviewers: **database-reviewer** (migrations) + react + typescript + security (permissão org). Aplicar CRITICAL/HIGH.
- [x] T018 Conferência (5 camadas) + EXECUCAO.md → 014 CONCLUÍDA.

## Notas
- ⚠️ Sem alteração na fiscal-api; sem XML builder (fora de escopo) → sem teste de builder aqui.
- Limitação: emissão não consome os padrões (declarada). Herança é exibição.
