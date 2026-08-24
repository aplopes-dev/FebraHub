# Tasks: Pagamento real na NF-e, edição de cliente e downloads fiscais

**Input**: `specs/erp/029-pagamento-nfe-edicao-cliente-downloads/plan.md`, `spec.md`
**Branch**: `029-pagamento-nfe-edicao-cliente-downloads`

3 user stories independentes. Ordem de implementação: US1 (P1, bloqueador) → US2 (P2, maior
risco técnico) → US3 (P3, autocontida).

## Phase 1: Setup

- [X] T001 Confirmar branch de trabalho: já em `029-pagamento-nfe-edicao-cliente-downloads` — nenhuma ação, só checagem

## Phase 2: Foundational

*(nenhuma tarefa bloqueante comum às 3 histórias)*

## Phase 3: User Story 1 — NF-e sai com o meio de pagamento real (Priority: P1) 🎯 MVP

**Goal**: `payments[]` real por pagamento do pedido, com bloqueio explícito quando alguma forma
não tem `fiscalCode`.

**Independent Test**: emitir o pedido #4 (Dinheiro) e a NF-e sair com `tPag=01`, sem a rejeição 441.

### fiscal-api — aceitar `payments[]` em `POST /v1/nfe`

- [X] T002 [US1] `services/fiscal-api/src/modules/nfe/infrastructure/http/routes/issue-nfe/issue-nfe.dto.ts`: adicionar `payments?: { method: string; amount: number; description?: string }[]` opcional (mesmo shape usado pelo NFC-e no builder)
- [X] T003 [US1] `services/fiscal-api/src/modules/nfe/application/use-cases/issue-nfe/issue-nfe.use-case.ts`: repassar `dto.payments` para `buildNfeXml` (campo `payments`, já suportado pelo builder) — depende de T002
- [X] T004 [US1] Teste em `services/fiscal-api/src/modules/nfe/application/use-cases/issue-nfe/issue-nfe.use-case.spec.ts` (ou arquivo de teste do builder): `payments[]` com 2 formas gera 2 `detPag`, cada um com `tPag`/`vPag`/`xPag` corretos; sem `payments[]`, mantém o caminho legado (`paymentMethodCode` único) — não regride

### erp-api — resolver pagamentos reais e bloquear forma sem `fiscalCode`

- [X] T005 [P] [US1] `apps/erp/api/src/modules/finance/payment-methods/domain/repositories/payment-method.repository.interface.ts`: adicionar `findByIds(organizationId, ids): Promise<PaymentMethod[]>`
- [X] T006 [US1] Implementar `findByIds` no repositório Prisma de `payment-methods` (`infrastructure/database/`) — depende de T005
- [X] T007 [US1] `apps/erp/api/src/modules/nfe-issuance/domain/providers/fiscal-api-client.interface.ts`: `IssueNfeRequest` troca `paymentMethodCode: string` único por `payments: { method: string; amount: number; description?: string }[]`
- [X] T008 [US1] `apps/erp/api/src/modules/nfe-issuance/infrastructure/providers/http-fiscal-api-client.ts`: monta o body de `POST /v1/nfe` com `payments` (não mais `paymentMethodCode`) — depende de T007
- [X] T009 [US1] `apps/erp/api/src/modules/nfe-issuance/application/use-cases/issue-nfe/issue-nfe.use-case.ts`: busca `SaleOrder.payments[]` (já vem em `SaleOrderDetail` via `SaleOrderRepository.findById`), resolve `PaymentMethod` de cada `methodId` único (T006), monta `payments[]` (valor em reais, `method=fiscalCode`, `description=name` só quando `fiscalCode==='99'`); se algum `methodId` não resolver `fiscalCode`, lança `FiscalApiEmissionError` nomeando a forma e apontando para `/configuracoes/formas-pagamento` — antes de qualquer chamada à fiscal-api; remove `DEFAULT_PAYMENT_METHOD_CODE` e o comentário desatualizado — depende de T006, T008
- [X] T010 [US1] Testes em `issue-nfe.use-case.spec.ts`: pedido com 1 pagamento (tPag real, sem 99); pedido com 2 pagamentos (2 entradas em `payments[]`, soma bate); pedido com forma sem `fiscalCode` → `FiscalApiEmissionError` antes de chamar a fiscal-api (`client.requests` vazio) — depende de T009

**Checkpoint**: emitir o pedido #4 (Dinheiro) deve sair com `tPag=01`, sem a rejeição 441.

---

## Phase 4: User Story 2 — Baixar XML e PDF das notas emitidas (Priority: P2)

**Goal**: NF-e com botão de baixar em Vendas/Pedidos de venda; NFS-e com botão no Facilita NF-e;
ambos só habilitados em AUTHORIZED; proxy fail-closed por dono.

**Independent Test**: nota AUTHORIZED → baixar XML e PDF funciona pelas telas certas; nota não
AUTHORIZED → ação desabilitada com motivo; documento de outra organização → acesso recusado.

### Backend — persistir `documentId` (mesma classe de gap de errorCode/errorMessage, spec 028)

- [X] T011 [P] [US2] Migration Prisma: `apps/erp/api/prisma/schema.prisma` — `NfeIssuance` e `NfseIssuance` ganham `fiscalDocumentId String? @map("fiscal_document_id")`; gerar migration em `apps/erp/api/prisma/migrations/<ts>_nfe_nfse_fiscal_document_id/`
- [X] T012 [P] [US2] `apps/erp/api/src/modules/nfe-issuance/domain/entities/nfe-issuance.entity.ts`: `fiscalDocumentId: string | null` em props/CreateProps/create()/getter
- [X] T013 [P] [US2] `apps/erp/api/src/modules/nfse-issuance/domain/entities/nfse-issuance.entity.ts`: mesmo de T012 (arquivo irmão)
- [X] T014 [P] [US2] `apps/erp/api/src/modules/nfe-issuance/domain/providers/fiscal-api-client.interface.ts`: `IssueNfeResult` ganha `documentId: string | null`
- [X] T015 [P] [US2] `apps/erp/api/src/modules/nfse-issuance/domain/providers/fiscal-api-client.interface.ts`: mesmo de T014 (arquivo irmão)
- [X] T016 [US2] `apps/erp/api/src/modules/nfe-issuance/infrastructure/providers/http-fiscal-api-client.ts`: lê `data.documentId` da resposta (`FiscalApiSuccessBody`) — depende de T014
- [X] T017 [US2] `apps/erp/api/src/modules/nfse-issuance/infrastructure/providers/http-fiscal-api-client.ts`: mesmo de T016 — depende de T015
- [X] T018 [US2] `apps/erp/api/src/modules/nfe-issuance/application/use-cases/issue-nfe/issue-nfe.use-case.ts`: repassa `result.documentId` para `NfeIssuance.create` — depende de T012, T016
- [X] T019 [US2] `apps/erp/api/src/modules/nfse-issuance/application/use-cases/issue-nfse/issue-nfse.use-case.ts`: mesmo de T018 — depende de T013, T017
- [X] T020 [US2] `apps/erp/api/src/modules/nfe-issuance/infrastructure/database/prisma-nfe-issuance.repository.ts`: persiste/lê `fiscalDocumentId` — depende de T011, T012
- [X] T021 [US2] `apps/erp/api/src/modules/nfse-issuance/infrastructure/database/prisma-nfse-issuance.repository.ts`: mesmo de T020 — depende de T011, T013
- [X] T022 [US2] `apps/erp/api/src/modules/nfe-issuance/infrastructure/http/routes/shared/nfe-issuance.presenter.ts`: expõe `fiscalDocumentId` no response — depende de T020
- [X] T023 [US2] `apps/erp/api/src/modules/nfse-issuance/infrastructure/http/routes/shared/nfse-issuance.presenter.ts`: mesmo de T022 — depende de T021

### Backend — vínculo pedido → NF-e na listagem de Vendas/Pedidos

- [X] T024 [US2] `apps/erp/api/src/modules/sales/infrastructure/http/routes/shared/sale-order.presenter.ts` (+ query/use-case de listagem): cada item da lista ganha `nfeIssuance: {id, status, fiscalDocumentId} | null`, resolvido em lote por `saleOrderId` (sem N+1) — depende de T020

### Frontend — proxy fiscal (resolvedor de dono, fail-closed)

- [X] T025 [US2] `apps/erp/web/src/app/api/proxy/fiscal/[...path]/route.ts`: nova função `isFiscalDocumentDownloadRoute(segments)` (`/v1/nfe/:id/xml`, `/v1/nfe/:id/danfe`, `/v1/nfse/:id/xml`, `/v1/nfse/:id/danfse`) + `resolveFiscalDocumentOwner(documentId, serviceToken)` (chama `GET /v1/fiscal-documents/:id` com o token de serviço, devolve `companyId` ou `null` em qualquer falha); só eleva para o token de serviço quando `owner.companyId === identity.companyId`; caso contrário mantém o token do usuário (fail-closed, comportamento já documentado no cabeçalho do arquivo)
- [X] T026 [US2] Atualizar o comentário de cabeçalho do arquivo (a lista de "rotas com companyId reconhecível" ganha as rotas de download, com a ressalva de que o dono é resolvido por consulta, não pelo path)

### Frontend — botões de download

- [X] T027 [P] [US2] `apps/erp/web/src/features/sales-orders/components/sale-order-row-actions.tsx`: item "Baixar XML"/"Baixar DANFE" — habilitado só quando `row.nfeIssuance?.status === "AUTHORIZED"`, com `Tooltip`/texto explicando quando desabilitado; `loading` local no clique (regra AGENTS.md §6)
- [X] T028 [P] [US2] `apps/erp/web/src/features/sales/components/sale-row-actions.tsx`: mesmo de T027
- [X] T029 [US2] `apps/erp/web/src/features/facilita-nfe/components/facilita-nfe-issued-table.tsx`: ação "Baixar XML"/"Baixar PDF" (DANFE ou DANFSE conforme `documentType`) — habilitada só em `AUTHORIZED`, mesmo padrão de `loading`
- [X] T030 [US2] Serviço de download compartilhado (`apps/erp/web/src/lib/api/` ou local a cada feature): `fetch` via `comercioFetch`-equivalente para fiscal (`fiscalFetch`) com `responseType` blob, monta nome de arquivo (`NFe-{accessKey}.xml`, `DANFE-{accessKey}.pdf`, etc.), dispara o download direto (decisão do clarify) via link temporário — reusado pelos 3 pontos de UI acima

**Checkpoint**: nota AUTHORIZED → baixar funciona nas 3 telas certas; nota rejeitada → ação
desabilitada com motivo; tentativa de acessar documento de outra organização → recusada.

---

## Phase 5: User Story 3 — Editar um cliente já cadastrado (Priority: P3)

**Goal**: `/clientes/[id]` funcional, molde de `suppliers`/`carriers`/`branches`.

**Independent Test**: abrir um cliente pela lista, editar um campo, salvar, reabrir e confirmar
persistência.

- [X] T031 [P] [US3] `apps/erp/web/src/features/customers/hooks/use-customer-queries.ts`: `useCustomerQuery(id)` se ainda não existir (molde `useSupplierQuery`)
- [X] T032 [US3] `apps/erp/web/src/features/customers/pages/customer-edit-page.tsx` (novo): estados loading/erro/"Cliente não encontrado" (molde `supplier-edit-page.tsx`); `key={customer.id}` no `CustomerFormView`; sinalização não-bloqueante quando faltar endereço/documento fiscal (`Alert`, mesmo texto de `nfe-issuance-page.tsx`, spec 028) — depende de T031
- [X] T033 [US3] `apps/erp/web/src/app/(app)/clientes/[id]/page.tsx` (novo): reexporta `CustomerEditPage` — depende de T032
- [X] T034 [US3] Ligar a linha da lista (`customer-list-table.tsx` ou equivalente) e/ou a ação "Editar" do menu à nova rota `/clientes/:id`

**Checkpoint**: editar um cliente existente persiste a alteração.

---

## Phase 6: Polish & Gates

- [X] T035 `pnpm --filter @citybox/erp-api typecheck && lint && test`
- [X] T036 `pnpm --filter @citybox/erp-web typecheck && lint && build`
- [X] T037 `pnpm --filter @citybox/fiscal-api typecheck && lint && test`
- [X] T038 `react-reviewer` nos `.tsx` tocados (T027-T029, T032-T034)
- [X] T039 `typescript-reviewer` no diff completo (3 apps)
- [X] T040 `security-reviewer` — OBRIGATÓRIO (T025/T026 mexem no proxy e em elevação de token)
- [X] T041 `database-reviewer` na migration de T011
- [X] T042 Atualizar `GUIA.md` de `features/customers`, `features/sales`, `features/sales-orders`, `features/facilita-nfe`, `features/nfe-issuance`
- [X] T043 Atualizar `apps/erp/api/AGENTS.md` — `payments[]`/bloqueio de forma sem `fiscalCode`, `fiscalDocumentId`, vínculo na listagem de Vendas/Pedidos
- [X] T044 Atualizar `apps/erp/web/AGENTS.md` — tela `/clientes/[id]`, botões de download, resolvedor de dono no proxy
- [X] T045 Atualizar `services/fiscal-api/AGENTS.md` — `payments[]` em `POST /v1/nfe`
- [ ] T046 Deploy: rebuild + redeploy `erp-api`, `erp-web` e `fiscal-api`
- [ ] T047 Validação manual em produção: emitir o pedido #4 (Dinheiro) sem a 441; editar um cliente e confirmar persistência; baixar XML e PDF de uma nota autorizada pelas telas de Vendas e Pedidos de venda; confirmar ação desabilitada em nota rejeitada

## Dependencies

- **US1** (T002-T010): fiscal-api (T002-T004) e erp-api (T005-T010) têm uma dependência de
  contrato — T008/T009 (erp-api monta o body) dependem do DTO da fiscal-api já aceitar
  `payments[]` (T002), mas o código em si pode ser escrito em paralelo (o campo é aditivo).
- **US2** (T011-T030): T011 (migration) bloqueia T020/T021 (persistência); T012-T017 (entidade+
  interface+client) bloqueiam T018/T019 (use-case) que bloqueiam T020-T023 (persistência+
  presenter); T024 (listagem) depende de T020; T025/T026 (proxy) são independentes do resto do
  backend; T027-T030 (frontend) dependem do shape exposto por T022/T023/T024/T025.
- **US3** (T031-T034): sequencial, mas totalmente independente de US1/US2.
- **Phase 6** depende de todas as fases de user story completas.

## Parallel Execution Examples

```text
# Início — as 3 histórias em paralelo (áreas independentes):
Task: T002 issue-nfe.dto.ts (fiscal-api, US1)
Task: T005 payment-method.repository.interface.ts (US1)
Task: T011 migration Prisma (US2)
Task: T012/T013 entidades NfeIssuance/NfseIssuance (US2)
Task: T025 proxy fiscal (US2)
Task: T031 useCustomerQuery (US3)

# Depois de T011-T017 (US2):
Task: T018 issue-nfe.use-case.ts
Task: T019 issue-nfse.use-case.ts
```

## Implementation Strategy

**MVP = User Story 1** (destrava a emissão de fato). US2 e US3 são incrementos independentes por
cima, na ordem do prompt de origem (B1 → B3 → B2, risco técnico decrescente).
