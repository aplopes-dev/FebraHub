# Tasks: Grupo de ICMS

**Feature**: `specs/erp/016-fiscal-icms-group` | Fatia vertical (erp-api + erp-web + fiscal-api). Resolve B1.
Testes: fiscal-api builder (unit, real); erp-api jest in-memory (DB não provisionado); erp-web sem harness (D0).

## Phase 1 — fiscal-api: ICMS real no XML (o critério que prova a entrega / fecha B1)
- [x] T001 `NfeItemInput` += `icms?: { cst?; csosn?; aliquota?; origem? }` (base já é `totalValue`).
- [x] T002 `buildImpostoXml`: Regime Normal com `icms` → `ICMS00` com `orig` real, `vBC`, `pICMS`/`vICMS` calculados; sem `icms` → `ICMS00` zerado (não-regressão). Simples → `ICMSSN{csosn}` intacto (só orig+CSOSN).
- [x] T003 [P] Builder tests: (a) ICMS00 com vBC/pICMS/vICMS por UF (interna e interestadual) + orig real; (b) não-regressão Simples ICMSSN sem alíquota; (c) fallback Regime Normal sem grupo ICMS00 zerado. **Verificar o XML.**
- [x] T004 `services/fiscal-api/AGENTS.md`: atualizar o gap "ICMS 0.00 fixo" (fecha B1). **→ XML: builder test (T003).**

## Phase 2 — erp-api: schema + migration
- [x] T005 Prisma: `FiscalGroup` += `icmsCst String?`, `icmsCsosn String?`. Nova `FiscalGroupUfRate` (id, organizationId, fiscalGroupId, uf, rateType `INTERNA|INTERESTADUAL`, aliquota Decimal; `@@unique([fiscalGroupId, uf, rateType])`; index org). `ProductFiscal` += `icmsGroupId String?` (FK SetNull) + `ProductFiscalBranch.icmsGroupId`. Back-relations.
- [x] T006 Migration versionada (⚠️ não aplicável via psql — DB não provisionado; `prisma generate` offline). **→ database-reviewer.**

## Phase 3 — erp-api: CRUD + resolução
- [x] T007 `FiscalGroup` entity: situação ICMS (CST 00 / CSOSN 102/103/300/400) + validação por regime; `FiscalGroupUfRate` value object/entity. Repos: create/update/get/list + uf rates (prisma + in-memory).
- [x] T008 UseCases: Create/Update/Get/List grupo ICMS (com as matrizes); `ResolveItemIcmsUseCase` (produto→grupo→UF destino→base+alíquota+origem; herança do padrão; fallback). Rotas CRUD `v1/fiscal-icms-groups` (`org.view`/`store.catalog.manage`).
- [x] T009 `ProductFiscal` += `icmsGroupId` no entity/dto/mapper/presenter/rotas + validação na escrita (org + taxType ICMS), mesmo padrão do pisCofinsGroupId da 015.
- [x] T010 [P] Testes jest: grupo + uf rates persistem; valida situação por regime; FK validada; `ResolveItemIcms` (interna vs interestadual, herança, fallback).

## Phase 4 — erp-web: cadastro
- [x] T011 feature `fiscal-icms-group`: api (dto/service `comercioFetch`) + hooks + `lib` (defaults de alíquota por UF; situação por regime) + unsaved-guard.
- [x] T012 [US1] Lista + estado vazio ("Novo grupo ICMS") em rota própria `/(app)/configuracoes/fiscal/grupos-icms`.
- [x] T013 [US1] Formulário: Situação (select filtrado por regime, indisponíveis com motivo) + 2 matrizes de 27 UFs (`UfRateMatrix`) com alternância **valor único / personalizado**, pré-preenchidas; aviso do limite no Simples (matriz sem efeito); barra de estado sujo.
- [x] T014 [US3] Grupo ICMS selecionável em Padrões fiscais (aba padroes) + link "Gerenciar grupos de ICMS".

## Phase 5 — Docs & Gates
- [x] T015 [P] GUIA.md + `apps/erp/api/AGENTS.md` + `apps/erp/web/AGENTS.md` + `services/fiscal-api/AGENTS.md`.
- [x] T016 Gates: fiscal-api typecheck/lint/test (builder); erp-api typecheck/lint/test; erp-web typecheck/lint/build.
- [x] T017 Reviewers: **database-reviewer** (migration) + typescript + react + security. Aplicar CRITICAL/HIGH.
- [x] T018 Conferência (5 camadas) + EXECUCAO.md → 016 CONCLUÍDA + B1 ✅ RESOLVIDO.

## Notas
- ⚠️ Emissão real no PDV = **B7** (deferido); **B2** (builder aceita qualquer CSOSN) segue bugfix próprio.
- Simples: matriz por UF não tem efeito (ICMSSN sem alíquota) — a tela declara.
