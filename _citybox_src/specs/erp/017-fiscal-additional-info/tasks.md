# Tasks: Informações Adicionais da Nota Fiscal

**Feature**: `specs/erp/017-fiscal-additional-info` | Fatia vertical (erp-api + erp-web + fiscal-api).
Testes: fiscal-api builder ×3 (unit, real); erp-api jest in-memory (DB não provisionado); erp-web sem harness (D0).

## Phase 1 — fiscal-api: grupo infAdic nos 3 builders (o critério que prova a entrega)
- [ ] T001 Confirmar os limites do XSD por campo (NF-e/NFC-e `infCpl` 5000 / `infAdFisco` 2000; DPS equivalente) e a `xs:sequence` do `infAdic`.
- [ ] T002 Input dos 3 builders += `additionalInfo?: { infCpl?; infAdFisco? }`. `buildNfeXml`/`buildNfceXml`/`buildDpsXml` emitem `<infAdic>` com `<infAdFisco>`/`<infCpl>` no campo certo (ordem do XSD); **omitem `infAdic` quando ambos vazios** (não-regressão).
- [ ] T003 [P] Builder tests ×3: (a) infAdic com infCpl **e** infAdFisco no campo certo; (b) só infCpl / só infAdFisco; (c) **não-regressão** sem info → sem `infAdic`, XML idêntico. **Verificar o XML + XSD.**
- [ ] T004 `services/fiscal-api/AGENTS.md`: novo grupo `infAdic` nos 3 builders. **→ XML: builder test (T003).**

## Phase 2 — erp-api: schema + migration
- [ ] T005 Prisma: `FiscalAdditionalInfo` (id, organizationId, name, text, documentType `NFE|NFCE|NFSE`, target `INF_CPL|INF_AD_FISCO`, timestamps; index `(organizationId, documentType)`). Back-relation em Organization.
- [ ] T006 Migration versionada (⚠️ não aplicável via psql — DB não provisionado; `prisma generate` offline). **→ database-reviewer.**

## Phase 3 — erp-api: CRUD + resolução
- [ ] T007 Entidade `FiscalAdditionalInfo` (validação: name/text não vazios; documentType/target no conjunto; text ≤ limite do campo por si só). Repo (prisma + in-memory): create/update/get/list por org+documentType.
- [ ] T008 UseCases: Create/Update/Get/List (por tipo, com busca); `ResolveDocumentAdditionalInfoUseCase` (dado documentType → concatena por destino na ordem de criação + valida total ≤ limite → `{infCpl?, infAdFisco?}`; estouro → erro claro). Rotas CRUD `v1/fiscal-additional-infos` (`org.view`/`store.catalog.manage`).
- [ ] T009 [P] Testes jest: persiste/consulta por tipo e destino; resolvedor concatena na ordem + valida limite (impede estouro) + não-regressão (sem info → vazio).

## Phase 4 — erp-web: cadastro
- [ ] T010 feature `fiscal-additional-info`: api (dto/service `comercioFetch`) + hooks (list por tipo/create/update/delete) + unsaved-guard.
- [ ] T011 [US1] Lista em rota própria `/(app)/configuracoes/fiscal/informacoes-adicionais` com **abas por tipo** (NFE/NFCE/NFSE na URL) + busca por nome + estado vazio; **sem** o toggle "automático".
- [ ] T012 [US1/US3] Dialog criar/editar: Nome, Descrição (textarea), **Destino** (infCpl/infAdFisco); **aviso de estouro do conjunto** (soma dos textos daquele tipo+destino vs limite do XSD) ao adicionar/editar; salvar explícito.

## Phase 5 — Docs & Gates
- [ ] T013 [P] GUIA.md + `apps/erp/api/AGENTS.md` + `apps/erp/web/AGENTS.md` + `services/fiscal-api/AGENTS.md`.
- [ ] T014 Gates: fiscal-api typecheck/lint/test (3 builders); erp-api typecheck/lint/test; erp-web typecheck/lint/build.
- [ ] T015 Reviewers: **database-reviewer** (migration) + typescript + react + security. Aplicar CRITICAL/HIGH.
- [ ] T016 Conferência (5 camadas) + EXECUCAO.md → 017 CONCLUÍDA.

## Notas
- ⚠️ Emissão real no PDV = **B7** (deferido). O builder test prova o XML; o resolvedor + contrato ficam prontos.
- Limite é a **soma concatenada** por (tipo, destino), não por registro — validar nos dois lados.
