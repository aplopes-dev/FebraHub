# Tasks: Proxy de documentos fiscais e pagamento real na NF-e

**Input**: `specs/erp/030-proxy-documentos-pagamento-real/plan.md`, `spec.md`, `research.md`
**Branch**: `030-proxy-documentos-pagamento-real`

3 user stories independentes. Ordem: US1 (P1, Facilita NF-e + downloads) → US2 (P1, pagamento
real na NF-e) → US3 (P2, alíquota ISSQN).

## Phase 1: Setup

- [X] T001 Confirmar branch de trabalho — nenhuma ação, só checagem

## Phase 2: Foundational

*(nenhuma tarefa bloqueante comum às 3 histórias)*

## Phase 3: User Story 1 — Facilita NF-e carrega e downloads funcionam (Priority: P1)

**Goal**: lista de documentos carrega; XML e PDF de documentos autorizados baixam; cross-tenant
continua bloqueado.

**Independent Test**: Facilita NF-e lista os documentos da RR; XML/DANFSE da NFS-e
`188c3ec0-e828-4937-9c42-4303290ee15c` baixam.

- [X] T002 [US1] `apps/erp/api/src/modules/fiscal/infrastructure/http-fiscal-api.adapter.ts`: `listDocuments`/`getSummary` passam `companyId` também via `URLSearchParams` (query), mantendo o header `X-Company-Id`
- [X] T003 [US1] Teste em `apps/erp/api/src/modules/fiscal/` (spec do adapter ou do route) cobrindo que a URL upstream de `listDocuments` inclui `companyId` na query
- [X] T004 [US1] `apps/erp/web/src/app/api/proxy/fiscal/[...path]/route.ts`: nova função `isFiscalDocumentsListRoute(segments, method)` (`v1/fiscal-documents`, 2 segmentos, `GET`) adicionada ao disjunto de `isCompanyScopedRoute`
- [X] T005 [US1] Mesmo arquivo: no branch `fiscalDocumentDownloadId`, adicionar `X-Company-Id: identity.companyId` ao header da chamada upstream quando a elevação é confirmada
- [X] T006 [US1] Atualizar o comentário de cabeçalho do arquivo (lista de rotas com companyId reconhecível ganha `/v1/fiscal-documents` GET; nota sobre `X-Company-Id` no branch de download) — depende de T004, T005
- [X] T007 [US1] Teste em `apps/erp/web` (se houver harness) ou verificação manual documentada: dono correto → eleva; dono divergente → 403; dono irresolvível → não eleva (cobertura já existe para o branch de download da spec 029 — confirmar que `isFiscalDocumentsListRoute` tem paridade de comportamento fail-closed)

**Checkpoint**: Facilita NF-e carrega; downloads de XML/PDF funcionam; 403 em documento de outra organização.

---

## Phase 4: User Story 2 — NF-e emite com o meio de pagamento real (Priority: P1)

**Goal**: pedidos novos e antigos apontam para `PaymentMethod` real; NF-e do pedido #8 emite com `tPag=01`.

**Independent Test**: pedido #8 emite sem a rejeição "forma de pagamento desconhecida"; um pedido novo grava `methodId` UUID real.

### Backend — expor `systemKey` (pré-requisito do mapeamento de `cardPaymentType` no frontend)

- [X] T008 [P] [US2] `apps/erp/api/.../payment-methods/infrastructure/http/routes/shared/payment-method.presenter.ts`: expõe `systemKey: string | null` no `toHttp`
- [X] T009 [P] [US2] `apps/erp/web/src/features/payment-methods/types/payment-method.ts`: `PaymentMethod` ganha `systemKey: string | null`

### Backend — migração de dado (backfill)

- [X] T010 [US2] Script de backfill (não migration — AGENTS.md §5.9 proíbe `.sql` hand-written; achado do database-review): `apps/erp/api/scripts/backfill-sale-order-payment-method-ids.ts` + `pnpm --filter @citybox/erp-api db:backfill:sale-order-payment-method-ids`, molde `scripts/backfill-financial-*.ts` — resolve por `(organizationId, systemKey)`, mapeando `pm-cartao-credito` → `pm-cartao`, os demais 1:1; escopo aos 5 ids mock conhecidos; ignora formas soft-deleted
- [X] T011 [US2] Teste de integração (Jest, banco real, `src/modules/sales/infrastructure/database/backfill-sale-order-payment-method-ids.spec.ts`) confirmando: pagamento com `pm-dinheiro` vira o UUID da forma Dinheiro da mesma organização; pagamento com `pm-transferencia` (sem correspondente) não muda; pagamento já com UUID não muda; isolamento entre organizações (mesmo `systemKey`, orgs diferentes nunca se cruzam); forma soft-deleted nunca resolve; rodar 2x é no-op (idempotência)

### Backend — mensagem de bloqueio (FR-009)

- [X] T012 [US2] `apps/erp/api/.../nfe-issuance/application/use-cases/issue-nfe/issue-nfe.use-case.ts`: `resolvePayments` distingue "método não encontrado" (mensagem nova, id órfão) de "método encontrado sem `fiscalCode`" (mensagem já existente)
- [X] T013 [US2] Teste em `issue-nfe.use-case.spec.ts`: pagamento com `methodId` inexistente → mensagem nova; pagamento com forma sem `fiscalCode` → mensagem já existente (não regride)

### Frontend — 4 seletores de forma de pagamento

- [X] T014 [P] [US2] `apps/erp/web/src/features/sales-orders/lib/` (ou local apropriado): mapper `toPaymentMethodOption(pm: PaymentMethod): PaymentMethodOption` — deriva `cardPaymentType` de `systemKey` (`pm-cartao`→`credit`, `pm-cartao-debito`→`debit`, `pm-pix`→`pix`, demais `undefined`)
- [X] T015 [US2] `apps/erp/web/src/features/sales-orders/components/sale-order-form-view.tsx`: troca `listPaymentMethods()` (mock, síncrono) por `usePaymentMethodOptionsQuery()` + mapper de T014 — depende de T014
- [X] T016 [US2] `apps/erp/web/src/features/purchases/components/purchase-payments-panel.tsx` (+ ponto de montagem do form de Compras): mesmo de T015 — depende de T014
- [X] T017 [US2] `apps/erp/web/src/features/service-orders/components/service-order-payment-dialog.tsx`: troca `MOCK_PAYMENT_METHODS` por `usePaymentMethodOptionsQuery()` + mapper — depende de T014
- [X] T018 [US2] `apps/erp/web/src/features/purchases/services/purchase.service.ts`: remove `listPaymentMethods()` síncrono (mock) — depende de T016
- [X] T019 [US2] Remover `apps/erp/web/src/features/purchases/data/mock-payment-methods.ts` — depende de T015, T016, T017, T018 (zero consumidor restante)

**Checkpoint**: pedido #8 emite NF-e com `tPag=01`; formulários dos 4 pontos listam formas reais; mock removido.

---

## Phase 5: User Story 3 — Alíquota de ISSQN correta na DPS (Priority: P2)

**Goal**: `pAliq` transmitido reflete o percentual configurado, sem fator de 100 errado.

**Independent Test**: NFS-e com retenção e `issRate=5` gera `pAliq=5.00` no XML.

- [X] T020 [US3] `services/fiscal-api/src/modules/nfse/infrastructure/xml/dps-xml.builder.ts`: remove `* 100` do cálculo de `pAliq` (linha 275)
- [X] T021 [US3] `services/fiscal-api/src/modules/nfse/tests/fixtures/issue-nfse-test-context.ts`: `issRate: 0.05` → `issRate: 5` (percentual)
- [X] T022 [US3] Rodar a suíte de `nfse` (unit + builder specs) confirmando que os testes existentes de `pAliq` continuam passando com o novo fixture (mesmo resultado numérico, premissa de entrada corrigida)

**Checkpoint**: `pAliq` correto na DPS quando há retenção.

---

## Phase 6: Polish & Gates

- [X] T023 `pnpm --filter @citybox/erp-api typecheck && lint && test`
- [X] T024 `pnpm --filter @citybox/erp-web typecheck && lint && build`
- [X] T025 `pnpm --filter @citybox/fiscal-api typecheck && lint && test`
- [X] T026 `security-reviewer` — OBRIGATÓRIO em B1 (elevação de token e cross-tenant, T004-T007)
- [X] T027 `database-reviewer` — OBRIGATÓRIO em B2 (migration de backfill, T010-T011)
- [X] T028 `react-reviewer` nos `.tsx` tocados (T015-T017)
- [X] T029 `typescript-reviewer` no diff completo (3 apps)
- [X] T030 Atualizar `apps/erp/web/AGENTS.md` (proxy: allowlist de lista + X-Company-Id no download; 4 formulários migrados; mock removido)
- [X] T031 Atualizar `apps/erp/api/AGENTS.md` (adapter companyId como query; backfill; mensagem de bloqueio distinta; `systemKey` exposto no presenter)
- [X] T032 Atualizar `services/fiscal-api/AGENTS.md` (correção de `pAliq`)
- [X] T033 Atualizar `GUIA.md` de `features/sales-orders`, `features/purchases`, `features/service-orders`, `features/facilita-nfe` (seletor de pagamento real; downloads funcionando)
- [X] T034 Deploy: rebuild + redeploy `erp-api`, `erp-web` e `fiscal-api` — todos saudáveis; rodado `pnpm --filter @citybox/erp-api db:backfill:sale-order-payment-method-ids` contra produção (12 pagamentos resolvidos, 0 sem correspondência)
- [ ] T035 Validação manual em produção: Facilita NF-e lista documentos da RR; XML/DANFSE da NFS-e `188c3ec0-…` baixam; NF-e do pedido #8 emite com `tPag=01`; alíquota do grupo Principal corrigida manualmente e nova emissão com retenção confere `pAliq`
