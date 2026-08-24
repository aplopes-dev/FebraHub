# Tasks: Emissão de NFS-e com Grupos de ISSQN

Fonte: [plan.md](./plan.md) (D1–D11). Ordem = dependência. Sem commit (acumula em `feat/fiscal-api`).

## Phase 1 — fiscal-api: builder da DPS (TOCA O XML) ✅
- [x] T001 `DpsServiceInput` ganha `tribISSQN?: '1'|'2'|'3'|'4'` (opcional, default `'1'`) e o builder emite `tribISSQN: input.service.tribISSQN ?? '1'` (não mais fixo). Bloco de retenção/`pAliq` inalterado.
- [x] T002 Builder tests: default '1' sem o campo; cada `tribISSQN` (1/2/4); **não-regressão** imunidade sem retenção → sem `pAliq`. 26/26 verde, lint 0.
- [x] T003 Comentário "único caso suportado no v1" atualizado no builder + `services/fiscal-api/AGENTS.md`.

## Phase 2 — erp-api: schema + migrations (⚠️ migrate deploy) ✅
- [x] T004 `FiscalGroup` += situação ISSQN (`issqn_service_code`/`issqn_national_code`/`issqn_rate` Dec(7,4)/`issqn_trib_type`) + CHECK tribISSQN ∈ {1,2,4}.
- [x] T005 `ProductFiscal.issqnGroupId` + `ProductFiscalBranch.issqnGroupId` (FK → FiscalGroup, SetNull, index) + relações no FiscalGroup.
- [x] T006 `NfseIssuance` (vínculo emissão, unique idempotência por org) + `TENANT_SCOPED_MODELS`. Migration única `20260813190000_nfse_issqn_groups` (⚠️ migrate deploy). Schema válido + `prisma generate` OK.

## Phase 3 — erp-api: cadastro de Grupos de ISSQN ✅ (T009 tail: write-validation pendente)
- [x] T007 `FiscalGroup` entity: `createIssqn`/`updateIssqn` + `validateIssqn` (formato NN.NN + cTribNac 6 díg + tribISSQN ∈ {1,2,4}) + getters + prisma mapping.
- [x] T008 CRUD route `v1/fiscal-issqn-groups` (molde `fiscal-icms-groups`; `org.view`/`store.catalog.manage`) + DTO/presenter + use cases + módulo registrado.
- [x] T009a `ResolveServiceIssqnUseCase` (item → issqnGroupId → grupo → valores).
- [x] T009b `ProductFiscal.issqnGroupId` threaded (entity/dto/repo/presenter/route) + `assertGroupOfType('ISSQN')` write-validation no `/v1/fiscal-parameters` + 2 testes (aceita/rejeita cross-taxType). 13/13 verde.
- [x] T010 Jest in-memory: CRUD grupo, validações, resolução (9/9 verde). tsc/lint limpos.

## Phase 4 — erp-api: emissão (integração fiscal-api) ✅
- [x] T011 `FiscalApiClient` (interface + `HttpFiscalApiClient` fetch → `POST {FISCAL_API_URL}/v1/nfse`, auth via env, tradução E0116/E0310/E0625) + `FiscalApiEmissionError`.
- [x] T012 `NfseIssuance` entity + repos (prisma/in-memory) + `TENANT_SCOPED_MODELS` + permissão `store.fiscal.issue` (OWNER/ADMIN/staff, não MEMBER).
- [x] T013 `IssueNfseUseCase`: resolve grupo (`ResolveServiceIssqn`), monta `IssueNfseRequest`, idempotência local (não reemite), environment HOMOLOGATION forçado, registra vínculo.
- [x] T014 Rota `v1/nfse-issuances` (POST emitir `store.fiscal.issue` + GET listar `org.view`) + HTTP DTO + presenter + módulo + app.module.
- [x] T015 Jest in-memory (6/6): resolve+emite+registra, idempotência (1 chamada), tribISSQN propagado, retenção, grupo ausente, erro traduzido. **⚠️ fiscal-api também**: `tribISSQN` threadado no `IssueNfseDto` (HTTP+app) + use-case (13/13).

## Phase 5 — erp-web: cadastro de Grupos de ISSQN ✅
- [x] T016 Feature `fiscal-issqn-group` (rota própria `/configuracoes/fiscal/grupos-issqn`): api/hooks/lib/components/pages + GUIA.md. Exigibilidade select (1/2/4; 3 desabilitado com motivo). Aviso "alíquota só transmitida com retenção". Link na aba Padrões fiscais. tsc/lint limpos.

## Phase 6 — erp-web: tela de emissão ✅
- [x] T017 Feature `nfse-issuance` (tela `/vendas/nfse`): tomador (Autocomplete `/v1/customers` + fetch do detalhe p/ CPF/CNPJ — o model do erp-web não carrega documento — + aviso sem documento) + grupo (mostra códigos/alíquota/exigibilidade resolvidos) + valor (`CurrencyInput`) + retenção (`Switch` + aviso "só transmitida com retenção") → emitir. Guarda de Emitente (`useFiscalCompany` → isCompanyMissing). Chip HOMOLOGAÇÃO + `ConfirmationDialog`. Erros do órgão traduzidos pelo backend, mostrados via toast. GUIA.md. tsc/lint limpos.
- [x] T018 `src/lib/navigation.ts`: novo leaf `/vendas/nfse` (grupo FISCAL, ícone `receipt`, habilitado).

## Phase 7 — docs, gates, conferência
- [ ] T019 AGENTS.md (erp-api, erp-web, fiscal-api) + GUIAs.
- [ ] T020 Gates (3 pacotes: typecheck/lint/test; erp-web build) + database-reviewer (2 migrations) + react/typescript/security reviewers → aplicar CRITICAL/HIGH + MEDIUM viáveis.
- [ ] T021 5-layer conference + EXECUCAO.md → 018 CONCLUÍDA.
