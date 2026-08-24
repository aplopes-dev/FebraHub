# Tasks: Tela Fiscal — Certificado Digital A1

**Feature**: `specs/erp/010-fiscal-certificate-screen` | **Branch**: `010-fiscal-certificate-screen`
**Input**: spec.md, plan.md, research.md (D0–D6), data-model.md, contracts/fiscal-certificate.http.md

Convenções: `[P]` = paralelizável (arquivos distintos, sem dependência). Caminhos absolutos ao repo.
**Testes**: só backend (decisão D0). Frontend sem harness — sem tarefas de teste de UI.

---

## Phase 1 — Setup

- [x] T001 Criar a árvore da feature `apps/erp/web/src/features/fiscal-certificate/` com subpastas `api/ hooks/ components/ types/ lib/ pages/` e `index.ts` (barrel vazio inicial).

## Phase 2 — Foundational (bloqueia as user stories)

### Backend (erp-api) — única mudança de servidor

- [x] T002 [P] Expor `platformStoreId` em `apps/erp/api/src/modules/tenancy/infrastructure/http/routes/shared/organization.presenter.ts` (`toHttp`: adicionar `platformStoreId: organization.platformStoreId`).
- [x] T003 [P] Teste do presenter (Node test runner nativo) verificando que `toHttp` inclui `platformStoreId` (valor e `null`), em `…/routes/shared/organization.presenter.spec.ts` (ou spec existente da rota `organizations/current`).
- [x] T004 Atualizar o tipo/DTO da organização no erp-web (onde `GET /v1/organizations/current` é lido — `features/company-settings/api/organization-current.service.ts` e/ou tipo compartilhado) para incluir `platformStoreId: string | null`.

### Cliente HTTP e libs puras (erp-web)

- [x] T005 [P] Adicionar `fiscalUpload<T>(path, formData, init?)` em `apps/erp/web/src/lib/api/fiscal-client.ts` (multipart sem `Content-Type` manual; via `fetchWithSession`; mesmo `extractErrorMessage`). Espelha `comercioUpload` (D5).
- [x] T006 [P] `features/fiscal-certificate/lib/ibge-lookup.ts`: mapa `(cidade normalizada, UF) → códigoIBGE(7)` (Ilhéus/BA `2913606` + BA vizinhos); `resolveCityCodeIbge(city, uf): string | null` (D1).
- [x] T007 [P] `features/fiscal-certificate/lib/regime-map.ts`: map dos 3 regimes fiscais 1:1; `MEI`/`ISENTO` → `null` (sinaliza bloqueio) (D2).
- [x] T008 [P] `features/fiscal-certificate/lib/error-translate.ts`: traduz `FiscalApiError`/status em mensagem de negócio por família (FR-012/FR-013), sem stack/HTTP cru.
- [x] T009 [P] `features/fiscal-certificate/types/`: tipos de UI do Certificado (+ derivados isCurrent/expiresSoon/isExpired) e do payload de provisionamento (data-model.md).

### Camada api/ da feature

- [x] T010 `features/fiscal-certificate/api/`: DTOs + mapper + service — `listCertificates(companyId)`, `getCertificateStatus(id)`, `uploadCertificate(companyId, {file,password,name})` (usa `fiscalUpload`), `createCompany(payload)` (usa `fiscalFetch`, resposta sem wrapper `{data}` — D contratos), `listBranches()`/`getHeadquarters()` e `getCurrentOrganization()` via `comercioFetch`. (depende de T004,T005,T009)

## Phase 3 — User Story 1: Enviar o primeiro certificado (P1) 🎯 MVP

**Objetivo**: loja sem Emitente conclui o primeiro upload; Emitente provisionado da matriz.
**Teste independente**: matriz completa + `.pfx` válido → Emitente criado + vigente na tela sem reload.

- [x] T011 [US1] `hooks/query-keys.ts` + `hooks/use-fiscal-certificates.ts` (React Query: lista + status) chaveado por `companyId`. Reusa `useFiscalCompany` de facilita-nfe (D6).
- [x] T012 [US1] `hooks/use-provision-company.ts`: monta o payload da matriz (regime-map + ibge-lookup + validação de campos obrigatórios), retornando **erro de negócio** por família quando algo falta/incompatível (FR-007/008/009) — antes de chamar a API. (depende de T006,T007,T010)
- [x] T013 [US1] `hooks/use-upload-certificate.ts` (mutation): se `isCompanyMissing`, provisiona (T012) e então faz upload; invalida as queries de certificado; traduz erro (T008). (depende de T010,T012)
- [x] T014 [P] [US1] `components/certificate-dropzone.tsx`: drag-and-drop + clique, valida extensão `.pfx/.p12`/tamanho ≤10MB no cliente (mensagens FR-012).
- [x] T015 [US1] `components/upload-modal.tsx`: `Dialog` MUI com dropzone (T014), `PasswordInput` (senha, obrigatória, nunca persistida — FR-019), campo Nome opcional, estado de envio/erro inline. (depende de T013,T014)
- [x] T016 [P] [US1] `components/empty-state.tsx`: card de estado vazio + botão "Inserir certificado" (formato da referência).
- [x] T017 [US1] `pages/FiscalCertificatePage.tsx`: orquestra estados (Loading/StoreNotEnabled/EmptyNoCompany/EmptyWithCompany/WithCurrent/Error), abre o modal, reflete o novo estado sem reload (FR-014). (depende de T011,T015,T016)
- [x] T018 [US1] Ligar a rota: `apps/erp/web/src/app/(app)/configuracoes/fiscal/page.tsx` deixa de ser `PlaceholderPage` e passa a renderizar a page da feature; guardar por permissão `fiscal.certificates.manage` (FR-003). (depende de T017)

**Checkpoint US1**: `/configuracoes/fiscal` provisiona e recebe o primeiro certificado.

## Phase 4 — User Story 2: Acompanhar vigente + histórico (P2)

**Objetivo**: ver vigente em destaque (com badges de vencimento) e histórico somente-leitura.

- [x] T019 [P] [US2] `components/current-certificate-card.tsx`: CNPJ do titular, validade de/até, dias restantes, chip de status, badges "vence em breve" (≤30d) / "vencido" (FR-015/FR-016).
- [x] T020 [P] [US2] `components/history-table.tsx`: lista somente-leitura (nome, CNPJ, validade, status, data de envio) — **sem** "Ativar"/"Excluir" (FR-017).
- [x] T021 [US2] `lib/select-current.ts` + fio na page: derivar vigente = VALID mais recente; demais → histórico (FR-018). Integrar T019/T020 no `WithCurrent`. (depende de T017,T019,T020)

**Checkpoint US2**: vigente e histórico renderizam corretamente, com sinalização de vencimento.

## Phase 5 — User Story 3: Substituir/renovar (P3)

**Objetivo**: enviar novo `.pfx` → novo vira vigente, anterior desce ao histórico, sem reload.

- [x] T022 [US3] Reusar o modal de upload (T015) no estado `WithCurrent` (botão "Enviar novo certificado"); após sucesso, invalidar e re-derivar vigente (T021). Sem seleção manual de vigente. (depende de T015,T021)

**Checkpoint US3**: renovação reflete o novo vigente automaticamente.

## Phase 6 — Consolidação da UI duplicada

- [x] T023 Remover a seção mock "Certificado digital (NF-e)" de `apps/erp/web/src/features/company-settings/components/company-usage-tab.tsx` e substituir por um atalho para `/configuracoes/fiscal` (FR-021).
- [x] T024 Remover `company-certificate-field.tsx` (mock com setInterval) **após** reaproveitar o que serve (seletor .pfx/.p12 + `PasswordInput`) no dropzone/modal da feature nova (T014/T015). Ajustar imports órfãos.

## Phase 7 — Polish & Docs-as-Code (Constitution I)

- [x] T025 [P] `features/fiscal-certificate/GUIA.md`: manual de negócio p/ leigo (o que é, para que serve, passo a passo) — sem termos técnicos (§4.5).
- [x] T026 [P] Atualizar `apps/erp/web/AGENTS.md`: nova feature `fiscal-certificate`, remoção da seção mock, `fiscalUpload`, decisão D0 (front sem harness), tabela §9.
- [x] T027 [P] Atualizar `apps/erp/api/AGENTS.md`: `platformStoreId` no `OrganizationPresenter`.
- [x] T028 `index.ts` barrel da feature; revisar imports; sem `@ts-ignore`/`eslint-disable @typescript-eslint/*`.

## Phase 8 — Gates & Conferência

- [x] T029 Gates erp-api: `pnpm --filter @citybox/erp-api build && lint && typecheck && test` (inclui T003).
- [x] T030 Gates erp-web: `pnpm --filter @citybox/erp-web typecheck && lint && build`.
- [x] T031 Revisão por lane: `react-reviewer` + `typescript-reviewer` (tocou `.tsx`); sem migration → sem `database-reviewer`; sem auth/segredo novo além de manuseio de senha → avaliar `security-reviewer` (senha do certificado).
- [x] T032 Conferência (5 camadas com evidência) + atualizar `EXECUCAO.md` + resumo/entrega.

---

## Dependências (resumo)

- Setup (T001) → Foundational (T002–T010) → US1 (T011–T018) → US2 (T019–T021) → US3 (T022) → Consolidação (T023–T024) → Polish (T025–T028) → Gates (T029–T032).
- Backend (T002–T004) é independente do frontend e pode ir em paralelo com T005–T009.
- `[P]` dentro de cada fase = arquivos distintos.

## MVP

**User Story 1 (T001–T018)** entrega o núcleo: provisionar Emitente + primeiro upload. US2/US3 e a consolidação incrementam.

## Testes (D0)

- **Backend**: T003 (presenter). **Frontend**: sem testes automatizados (sem harness — decisão D0). Validação manual pelo quickstart.md.
