# Tasks: Grupo de PIS/COFINS

**Feature**: `specs/erp/015-fiscal-pis-cofins-group` | Fatia vertical (erp-api + erp-web + fiscal-api).
Testes: fiscal-api builder (unit, real); erp-api jest in-memory (DB não provisionado); erp-web sem harness (D0).

## Phase 1 — fiscal-api: apuração real no XML (o critério que prova a entrega)
- [x] T001 `NfeItemInput` += `pis?: { cst; aliquota? }` e `cofins?: { cst; aliquota? }` (CST + alíquota quando tributado).
- [x] T002 `buildPisCofinsXml`: Simples (regime 1) → CST 49 zerado **intacto**; Regime Normal → se item traz `pis`/`cofins`: CST 01/02 → `PISAliq`/`COFINSAliq` com `vBC`, `pPIS`/`vPIS`, `pCOFINS`/`vCOFINS` calculados; CST 04–09 → `PISNT`/`COFINSNT` sem valores; **fallback** sem `pis`/`cofins` → CST 01 zerado (não-regressão). Totais `vPIS`/`vCOFINS` somam os itens.
- [x] T003 [P] Builder tests: (a) PISAliq/COFINSAliq calculado + totais somados; (b) PISNT/COFINSNT; (c) não-regressão Simples CST 49; (d) não-regressão Regime Normal sem grupo CST 01 zerado. **Verificar o XML gerado.**
- [x] T004 `services/fiscal-api/AGENTS.md`: atualizar o comentário do builder (tabela ausente deixa de valer). **→ é XML: builder test obrigatório (T003).**

## Phase 2 — erp-api: schema + migration
- [x] T005 Prisma: `FiscalGroup` += `pisCst String?`, `pisAliquota Decimal? @db.Decimal`, `cofinsCst String?`, `cofinsAliquota Decimal?`. `ProductFiscal` += `pisCofinsGroupId String?` (FK → FiscalGroup, SetNull). `ProductFiscalBranch` += `pisCofinsGroupId String?`. Back-relations.
- [x] T006 Migration versionada (⚠️ não aplicável via psql — DB não provisionado; `prisma generate` offline). **→ database-reviewer.**

## Phase 3 — erp-api: CRUD + resolução
- [x] T007 `FiscalGroup` entity: campos PIS/COFINS + validação (CST no conjunto 01/02/04–09; alíquota 0–100; tributado exige alíquota). Repo: create/update/get/list por org+tributo + `listProductsUsingGroup`.
- [x] T008 UseCases: Create/Update/Get/List grupo PIS/COFINS; `ResolveItemPisCofins` (produto→grupo→`FiscalDefaultTaxes.pisCofinsGroupId`→fallback nenhum). Rotas CRUD (`org.view`/`store.catalog.manage`) + rota "produtos do grupo".
- [x] T009 `ProductFiscal` += `pisCofinsGroupId` no entity/dto/mapper/presenter/rotas (mesmo padrão do issqn da 014).
- [x] T010 [P] Testes jest: grupo persiste + valida CST/alíquota; FK no produto; `ResolveItemPisCofins` (com grupo / herança do padrão / fallback).

## Phase 4 — erp-web: cadastro
- [x] T011 feature `fiscal-pis-cofins-group`: api (dto/service `comercioFetch`) + hooks (list/get/create/update + produtos do grupo) + unsaved-guard.
- [x] T012 [US1] Lista + estado vazio ("Novo Grupo PIS/COFINS") em rota própria `/(app)/configuracoes/fiscal/grupos-pis-cofins`.
- [x] T013 [US1] Formulário (Configuração + Produtos): Situação PIS/COFINS (select com busca, CST fora do conjunto indisponível com motivo), alíquotas **condicionais**, **espelhamento** PIS→COFINS + aviso de divergência, **pré-preenchimento por regime** do Emitente, barra de estado sujo.
- [x] T014 [US4] Aba/box "Produtos" somente-leitura (produtos que usam o grupo).

## Phase 5 — Docs & Gates
- [x] T015 [P] GUIA.md + `apps/erp/api/AGENTS.md` + `apps/erp/web/AGENTS.md` + `services/fiscal-api/AGENTS.md`.
- [x] T016 Gates: fiscal-api typecheck/lint/test (builder); erp-api typecheck/lint/test; erp-web typecheck/lint/build.
- [x] T017 Reviewers: **database-reviewer** (migration) + typescript + react + security. Aplicar CRITICAL/HIGH.
- [x] T018 Conferência (5 camadas) + EXECUCAO.md → 015 CONCLUÍDA.

## Notas
- ⚠️ Emissão real no fechamento de venda (disparo PDV→fiscal-api) é **B7 (deferido)** — aqui entregamos resolvedor + contrato do item + builder; o builder test prova o XML.
- Simples Nacional (CST 49) intacto — não-regressão obrigatória.
