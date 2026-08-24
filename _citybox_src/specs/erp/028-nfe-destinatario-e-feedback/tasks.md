# Tasks: Destinatário completo e feedback honesto na emissão fiscal

**Input**: `specs/erp/028-nfe-destinatario-e-feedback/plan.md`, `spec.md`
**Branch**: `028-nfe-destinatario-e-feedback`

3 user stories, priorizadas B1 (P1, bloqueador) → B2 (P2, alto) → B3 (P3, visual). Cada uma é um
incremento independentemente testável.

## Phase 1: Setup

- [X] T001 Confirmar branch de trabalho: já em `028-nfe-destinatario-e-feedback` — nenhuma ação, só checagem

## Phase 2: Foundational

*(nenhuma tarefa bloqueante comum às 3 histórias — cada uma toca arquivos próprios; a única
dependência entre histórias é dentro de uma mesma história, ver Dependencies)*

## Phase 3: User Story 1 — NF-e chega ao órgão com o destinatário completo (Priority: P1) 🎯 MVP

**Goal**: a tela `/vendas/nfe` monta e envia o endereço do destinatário; bloqueia a emissão antes de
transmitir quando o cliente não tem endereço utilizável.

**Independent Test**: emitir uma NF-e pela tela para um cliente com endereço completo e confirmar
que a rejeição deixa de ser `719`.

- [X] T002 [P] [US1] Mover `apps/erp/web/src/features/fiscal-certificate/lib/ibge-lookup.ts` → `apps/erp/web/src/lib/ibge-lookup.ts`; atualizar o import em `apps/erp/web/src/features/fiscal-certificate/lib/build-provision-payload.ts`
- [X] T003 [P] [US1] Criar `apps/erp/web/src/features/nfe-issuance/api/customer-nfe-fiscal-info.dto.ts` com o tipo `CustomerNfeFiscalInfo` (plan.md Fase 1)
- [X] T004 [US1] Em `apps/erp/web/src/features/nfe-issuance/api/nfe-issuance.service.ts`: adicionar `getCustomerNfeFiscalInfoApi(customerId)` — lê `GET /v1/customers/:id` (`data.addresses[]`), seleciona `addressType === "principal"` com fallback ao primeiro endereço da lista, resolve o código IBGE via `resolveCityCodeIbge` (de `@/lib/ibge-lookup`, T002), retorna `address: null` quando não houver endereço utilizável (ausente ou cidade fora da tabela IBGE) — depende de T002, T003
- [X] T005 [US1] Em `apps/erp/web/src/features/nfe-issuance/hooks/use-nfe-issuances.ts`: adicionar `useCustomerNfeFiscalInfoQuery(customerId)` (molde de `useCustomerFiscalInfoQuery` de `nfse-issuance`, mesmo padrão de query key) chamando `getCustomerNfeFiscalInfoApi`; remover o re-export de `useCustomerFiscalInfoQuery`/`getCustomerFiscalInfoApi` de `nfse-issuance` — depende de T004
- [X] T006 [US1] Em `apps/erp/web/src/features/nfe-issuance/pages/nfe-issuance-page.tsx`: trocar o hook usado por `useCustomerNfeFiscalInfoQuery`; `canEmit` ganha `Boolean(customerNfeFiscalQuery.data?.address)`; `handleConfirmEmit` monta `customer.address` a partir do resolvedor; novo `Alert` explicando "cliente sem endereço cadastrado (ou município fora da nossa base) — complete o cadastro em Clientes antes de emitir", com link para o cadastro do cliente — depende de T005
- [X] T007 [US1] Confirmar (plan.md D3, `indIEDest` fixo em `'9'` no `nfe-xml.builder.ts` da fiscal-api) que não é bloqueador desta história — checagem rápida, sem código; registrar a confirmação na doc (T019)

**Checkpoint**: emitir NF-e para a Aplopes com o cliente Daniel Anselmo (endereço completo) deve
passar a receber `203`, não mais `719`.

---

## Phase 4: User Story 2 — Resultado da emissão anunciado com honestidade (Priority: P2)

**Goal**: as duas telas mostram `AUTHORIZED` como sucesso e `REJECTED` como aviso, em português, com
código+mensagem do órgão; o mesmo tratamento de status já existente no Facilita NF-e é reaproveitado.

**Independent Test**: emitir uma NFS-e para a Aplopes (rejeição `E0116` já reproduzível hoje) e
confirmar que a notificação não parece sucesso, mostra "Rejeitada", o código `E0116` e a mensagem do
órgão em português.

### Backend — erp-api ganha `errorCode`/`errorMessage` (hoje descartados, plan.md D4)

- [X] T008 [P] [US2] Migration Prisma: `apps/erp/api/prisma/schema.prisma` — `NfeIssuance` e `NfseIssuance` ganham `errorCode String? @map("error_code")` e `errorMessage String? @map("error_message")`; gerar migration em `apps/erp/api/prisma/migrations/<ts>_nfe_nfse_issuance_error_fields/` (`migrate dev`)
- [X] T009 [P] [US2] `apps/erp/api/src/modules/nfe-issuance/domain/entities/nfe-issuance.entity.ts`: `NfeIssuanceProps` ganha `errorCode: string | null`, `errorMessage: string | null` (`Optional` em `CreateProps`, default `null`)
- [X] T010 [P] [US2] `apps/erp/api/src/modules/nfse-issuance/domain/entities/nfse-issuance.entity.ts`: mesmo de T009 (arquivo irmão)
- [X] T011 [P] [US2] `apps/erp/api/src/modules/nfe-issuance/domain/providers/fiscal-api-client.interface.ts`: `IssueNfeResult` ganha `errorCode: string | null`, `errorMessage: string | null`
- [X] T012 [P] [US2] `apps/erp/api/src/modules/nfse-issuance/domain/providers/fiscal-api-client.interface.ts`: mesmo de T011 (arquivo irmão)
- [X] T013 [US2] `apps/erp/api/src/modules/nfe-issuance/infrastructure/providers/http-fiscal-api-client.ts`: `FiscalApiSuccessBody` ganha `errorCode?: string | null`, `errorMessage?: string | null`; `issueNfe` repassa os dois (`?? null`) no retorno — depende de T011
- [X] T014 [US2] `apps/erp/api/src/modules/nfse-issuance/infrastructure/providers/http-fiscal-api-client.ts`: mesmo de T013 (arquivo irmão) — depende de T012
- [X] T015 [US2] `apps/erp/api/src/modules/nfe-issuance/application/use-cases/issue-nfe/issue-nfe.use-case.ts`: repassa `result.errorCode`/`result.errorMessage` para `NfeIssuance.create({...})` — depende de T009, T013
- [X] T016 [US2] `apps/erp/api/src/modules/nfse-issuance/application/use-cases/issue-nfse/issue-nfse.use-case.ts`: mesmo de T015 (arquivo irmão) — depende de T010, T014
- [X] T017 [US2] `apps/erp/api/src/modules/nfe-issuance/infrastructure/database/prisma-nfe-issuance.repository.ts`: persiste/lê `errorCode`/`errorMessage` no mapper Prisma↔entidade — depende de T008, T009
- [X] T018 [US2] `apps/erp/api/src/modules/nfse-issuance/infrastructure/database/prisma-nfse-issuance.repository.ts`: mesmo de T017 (arquivo irmão) — depende de T008, T010
- [X] T019 [US2] `apps/erp/api/src/modules/nfe-issuance/infrastructure/http/routes/shared/nfe-issuance.presenter.ts`: expõe `errorCode`/`errorMessage` no response — depende de T017
- [X] T020 [US2] `apps/erp/api/src/modules/nfse-issuance/infrastructure/http/routes/shared/nfse-issuance.presenter.ts`: mesmo de T019 (arquivo irmão) — depende de T018
- [X] T021 [P] [US2] Estender `apps/erp/api/src/modules/nfe-issuance/tests/fake-fiscal-api-client.ts` + testes em `issue-nfe.use-case.spec.ts`: caso `REJECTED` propaga `errorCode`/`errorMessage` até a entidade salva — depende de T015
- [X] T022 [P] [US2] Mesmo de T021 para `apps/erp/api/src/modules/nfse-issuance/tests/fake-fiscal-api-client.ts` + `issue-nfse.use-case.spec.ts` — depende de T016

### Frontend — as duas telas + DTOs

- [X] T023 [P] [US2] `apps/erp/web/src/features/nfe-issuance/api/nfe-issuance.dto.ts`: `NfeIssuanceDto` ganha `errorCode: string | null`, `errorMessage: string | null`
- [X] T024 [P] [US2] `apps/erp/web/src/features/nfse-issuance/api/nfse-issuance.dto.ts` (ou local equivalente do DTO de NFS-e): mesmo de T023
- [X] T025 [US2] `apps/erp/web/src/features/nfe-issuance/pages/nfe-issuance-page.tsx`: `handleConfirmEmit` — `AUTHORIZED` → `toast.success` (mantém protocolo); qualquer outro status → `toast.warning` com `resolveFiscalDocumentStatusLabel(issued.status)` (de `@/features/facilita-nfe/lib/fiscal-document-format`) + `errorCode`/`errorMessage` na descrição (fallback "Consulte o Facilita NF-e para mais detalhes." se ambos nulos) — depende de T023
- [X] T026 [US2] `apps/erp/web/src/features/nfse-issuance/pages/nfse-issuance-page.tsx`: mesmo tratamento de T025 — depende de T024
- [X] T027 [US2] Varredura (FR-006): grep por status cru (`AUTHORIZED`/`REJECTED`/etc.) fora de `resolveFiscalDocumentStatusLabel` nas duas telas de emissão e no Facilita NF-e; aplicar tradução onde faltar

**Checkpoint**: emitir NFS-e para a Aplopes mostra "NFS-e Rejeitada." com `E0116` e a mensagem da IM,
em `toast.warning` — não mais `✅ NFS-e REJECTED.`

---

## Phase 5: User Story 3 — Botão de emitir com peso de ação primária (Priority: P3)

**Goal**: os dois botões de emitir usam `variant="contained"`, sem destaque adicional.

**Independent Test**: abrir as duas telas e ver visualmente o botão de emitir com fundo preenchido,
igual à ação primária do resto do ERP, nos dois temas.

- [X] T028 [P] [US3] `apps/erp/web/src/features/nfe-issuance/pages/nfe-issuance-page.tsx` (~linha 387-395): `Button` de "Emitir NF-e" ganha `variant="contained"`
- [X] T029 [P] [US3] `apps/erp/web/src/features/nfse-issuance/pages/nfse-issuance-page.tsx` (~linha 356-364): mesmo de T028 para "Emitir NFS-e"

**Checkpoint**: as duas telas têm o botão de emitir com o mesmo peso visual do resto do ERP.

---

## Phase 6: Polish & Gates

- [X] T030 `pnpm --filter @citybox/erp-api typecheck && lint && test`
- [X] T031 `pnpm --filter @citybox/erp-web typecheck && lint && build`
- [X] T032 `pnpm --filter @citybox/fiscal-api typecheck && lint && test` — typecheck e lint limpos; 19 falhas pré-existentes em `auxiliary-documents/infrastructure/pdf/{barcode,danfe-nfce.renderer}.spec.ts` (renderização de PDF/DANFE), zero arquivos de `services/fiscal-api` tocados nesta spec — confirmado não-relacionado
- [X] T033 `react-reviewer` nos `.tsx` tocados (T006, T025, T026, T028, T029)
- [X] T034 `typescript-reviewer` no diff completo (backend + frontend)
- [X] T035 `database-reviewer` na migration de T008 (obrigatório — tocou schema)
- [X] T036 Atualizar `GUIA.md` de `features/nfe-issuance` e `features/nfse-issuance` (comportamento visível ao usuário mudou: endereço obrigatório, aviso de rejeição, botão preenchido)
- [X] T037 Atualizar `apps/erp/api/AGENTS.md` — registrar `errorCode`/`errorMessage` em `NfeIssuance`/`NfseIssuance`, a migration, e a confirmação de `indIEDest` (D3)
- [X] T038 Atualizar `apps/erp/web/AGENTS.md` — registrar o resolvedor próprio de endereço da NF-e, o bloqueio por endereço ausente, a mudança de toast e o `variant="contained"`
- [X] T039 Deploy: rebuild + redeploy `erp-api` (migration + código) e `erp-web` (as duas telas) — concluído, health checks verdes, migration `error_code`/`error_message` confirmada nas colunas de `erp.nfe_issuances` em produção
- [ ] T040 Validação manual em produção: emitir NF-e pela tela para a Aplopes e confirmar rejeição `203` (não mais `719`); confirmar toast de aviso com código+mensagem nas duas telas; confirmar botões preenchidos — **verificado por inspeção de dados** (o cliente real do teste, Daniel Anselmo, tem endereço `principal` completo em Ilhéus/BA, presente na tabela IBGE — o novo resolvedor vai montar o `enderDest` corretamente), mas a emissão real end-to-end (POST autenticado + veredito da SEFAZ) não foi disparada por este agente — é uma ação externa consequente (transmite de verdade ao órgão) que fica para validação manual do usuário na tela

## Dependencies

- **US1** (T002-T007) é independente de US2/US3 — pode ir para produção sozinha.
- **US2** (T008-T027): T008 (migration) bloqueia T017/T018 (persistência); T009-T014 (entidade+
  interface+client) bloqueiam T015/T016 (use-case) que bloqueiam T017-T020 (persistência+presenter);
  frontend (T023-T027) depende só do shape do DTO exposto por T019/T020, não do restante do backend.
- **US3** (T028-T029) é totalmente independente das outras duas — arquivos diferentes (só o `Button`),
  pode ser feita em paralelo com qualquer uma.
- **Phase 6** depende de todas as fases de user story completas.

## Parallel Execution Examples

```text
# Início — US1, US2 (metade backend) e US3 em paralelo (áreas independentes):
Task: T002 ibge-lookup.ts (US1)
Task: T003 customer-nfe-fiscal-info.dto.ts (US1)
Task: T008 migration Prisma (US2)
Task: T009/T010 entidades NfeIssuance/NfseIssuance (US2)
Task: T011/T012 fiscal-api-client.interface.ts (US2)
Task: T028/T029 Button variant (US3)

# Depois de T008-T014 (US2):
Task: T015 issue-nfe.use-case.ts
Task: T016 issue-nfse.use-case.ts
```

## Implementation Strategy

**MVP = User Story 1** (destrava a emissão de fato — sem ela nenhuma NF-e passa do 719). US2 e US3
são incrementos independentes por cima, na ordem sugerida pelo prompt de origem (B1 → B2 → B3).
