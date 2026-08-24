# Tasks: Emissão de NF-e pela tela de Vendas, com parametrização fiscal real

**Input**: `specs/erp/026-emissao-nfe-vendas/plan.md`, `spec.md`
**Branch**: `026-emissao-nfe-vendas`

Feature com **1 única user story (P1)** — não há fatiamento P2/P3 nesta spec. MVP = a feature inteira.

## Phase 1: Setup

- [X] T001 Confirmar `.specify/feature.json` aponta para `026-emissao-nfe-vendas` (já feito) e que a branch de trabalho é `feat/fiscal-api` (sem criar branch nova — mesma convenção das specs 025/024/023 anteriores nesta sessão)

## Phase 2: Foundational

*(nenhuma tarefa bloqueante identificada — os 4 resolvedores, o `SaleOrder`, e o padrão `nfse-issuance` já existem e estão testados; não há infraestrutura nova além do módulo em si)*

## Phase 3: User Story 1 — Emitir NF-e a partir de um pedido de venda (Priority: P1) 🎯 MVP

**Goal**: um lojista escolhe um pedido de venda fechado e emite a NF-e correspondente, com
ICMS/PIS-COFINS/IPI resolvidos do cadastro fiscal real do produto (não fallback zerado nem
dado manual), avisos explícitos por item quando algum tributo cair em fallback, e proteção
contra reemissão duplicada para o mesmo pedido.

**Independent Test**: a partir de um pedido de venda com produtos cujos grupos fiscais estão
todos configurados, emitir a NF-e e confirmar no XML que CST/CSOSN, alíquota de PIS, COFINS e
IPI vieram do cadastro — não de fallback (Acceptance Scenario 1 da spec).

### fiscal-api — extensão do contrato `POST /v1/nfe` (FR-002, FR-003, FR-004)

- [X] T002 [P] [US1] Estender `NfeItemDto`/`itemSchema` em `services/fiscal-api/src/modules/nfe/domain/validators/nfe-item.zod.validator.ts`: campos opcionais `icmsAliquota`, `origem`, `pis: {cst, aliquota?}`, `cofins: {cst, aliquota?}`, `ipi: {cst, cEnq, aliquota?}` — mesmos tipos de `NfePisCofinsInput`/`NfeIpiInput`/`IpiCst` de `nfe-xml.builder.ts`; revalidação FR-004: CST de PIS/COFINS/IPI restrito ao conjunto suportado pelo builder, `aliquota` em `0..100` quando presente
- [X] T003 [P] [US1] Estender `IssueNfeItemDto` em `services/fiscal-api/src/modules/nfe/infrastructure/http/routes/issue-nfe/issue-nfe.dto.ts`: mesmos campos de T002 com `class-validator`/`ApiProperty` (molde do `IssueNfeCustomerAddressDto` já no arquivo)
- [X] T004 [P] [US1] Estender `NfeItemDto`/`IssueNfeDto` (tipo de aplicação) em `services/fiscal-api/src/modules/nfe/application/dtos/nfe.dto.ts` — reexporta o tipo de T002, sem lógica nova
- [X] T005 [US1] Testes de `nfe-item.zod.validator.spec.ts`: item com PIS/COFINS/IPI válidos passa; CST fora do conjunto suportado rejeita (FR-004); alíquota fora de `0..100` rejeita; item sem esses campos continua válido (não-regressão, comportamento igual ao de hoje)
- [X] T006 [US1] Teste em `issue-nfe.use-case.spec.ts` (fiscal-api): item com `pis`/`cofins`/`ipi` preenchidos gera XML com os blocos `PIS`/`COFINS`/`IPI` correspondentes (Acceptance Scenario 2) — usar os helpers de asserção de XML já existentes no arquivo de teste

### erp-api — módulo `nfe-issuance` (FR-001, FR-002, FR-005, FR-006)

- [X] T007 [US1] Migration Prisma: `model NfeIssuance` no schema `erp` (molde `NfseIssuance`) — `id`, `organizationId`, `saleOrderId` (índice **único** — mecanismo real de FR-006/SC-004), `fiscalDocumentId`, `accessKey` nullable, `protocol` nullable, `status`, `createdAt`; adicionar a `TENANT_SCOPED_MODELS`. **`database-reviewer` obrigatório antes de prosseguir.**
- [X] T008 [P] [US1] `apps/erp/api/src/modules/nfe-issuance/domain/entities/nfe-issuance.entity.ts` (molde `nfse-issuance.entity.ts`)
- [X] T009 [P] [US1] `apps/erp/api/src/modules/nfe-issuance/domain/repositories/nfe-issuance.repository.interface.ts` — inclui `findBySaleOrderId` (base da checagem FR-006)
- [X] T010 [P] [US1] `apps/erp/api/src/modules/nfe-issuance/domain/providers/fiscal-api-client.interface.ts` — `issueNfe()` em vez de `issueNfse()`; reusa o tipo `ResolvedFiscalCompany` já definido em `nfse-issuance` (import relativo dentro do mesmo pacote — não é pacote compartilhado, ver plan.md D2)
- [X] T011 [P] [US1] `apps/erp/api/src/modules/nfe-issuance/domain/errors/fiscal-api-emission.error.ts` (mesmo formato de `nfse-issuance`)
- [X] T012 [US1] `apps/erp/api/src/modules/nfe-issuance/application/dtos/issue-nfe.dto.ts` — inclui `saleOrderId`, e o tipo `FallbackWarning[]` da prévia (plan.md D2 passo 4)
- [X] T013 [US1] `apps/erp/api/src/modules/nfe-issuance/infrastructure/providers/http-fiscal-api-client.ts` — client HTTP novo (payload de `/v1/nfe`, diferente de NFS-e), mas **importa `getFiscalServiceAccessToken` de `../../nfse-issuance/infrastructure/providers/fiscal-service-token.ts`** (caminho relativo dentro da erp-api — não duplica a lógica de token, plan.md D2/Structure Decision); mesma disciplina de log `[FiscalAuth]`/`[FiscalTransport]`/`[FiscalBusiness]` de `nfse-issuance`
- [X] T014 [US1] `IssueNfeUseCase` em `apps/erp/api/src/modules/nfe-issuance/application/use-cases/issue-nfe/issue-nfe.use-case.ts` — orquestra os 5 passos do plan.md D2: carrega `SaleOrder`, checa `NfeIssuance` existente por `saleOrderId` (FR-006), resolve Emitente + guarda PRODUCTION (mesmo padrão da spec 025), resolve ICMS/PIS-COFINS/IPI por linha via `ResolveItemIcmsUseCase`/`ResolveItemPisCofinsUseCase`/`ResolveItemIpiUseCase` (só conectar — já existem e são testados), monta `FallbackWarning[]` (FR-005), chama a fiscal-api, persiste `NfeIssuance`
- [X] T015 [P] [US1] `list-nfe-issuances.use-case.ts` (molde `list-nfse-issuances`) — usado pela tela pra saber quais pedidos já têm NF-e emitida (filtro do Autocomplete)
- [X] T016 [P] [US1] `apps/erp/api/src/modules/nfe-issuance/infrastructure/database/prisma-nfe-issuance.repository.ts`
- [X] T017 [US1] `apps/erp/api/src/modules/nfe-issuance/infrastructure/http/routes/nfe-issuance.route.ts` + `shared/{issue-nfe.http.dto.ts,nfe-issuance.presenter.ts}` — `POST /v1/nfe-issuances` (`store.fiscal.issue`) e `GET /v1/nfe-issuances` (`org.view`); decidir na implementação se a prévia (FR-005) é rota própria (`POST .../preview`) ou parâmetro `dryRun` no mesmo POST (plan.md D2 deixa em aberto — resolver ao codar, sem re-planejar)
- [X] T018 [US1] `apps/erp/api/src/modules/nfe-issuance/nfe-issuance.module.ts` — registra tudo, injeta `SaleOrderRepository`/`ProductFiscalRepository`/os 3 resolvers de `fiscal-defaults.module.ts`
- [X] T019 [P] [US1] `apps/erp/api/src/modules/nfe-issuance/tests/{fake-fiscal-api-client.ts,in-memory-nfe-issuance.repository.ts}` (moldes de `nfse-issuance/tests/`)
- [X] T020 [US1] Testes `issue-nfe.use-case.spec.ts` (erp-api, in-memory): resolve+emite+registra com todos os grupos configurados (Acceptance Scenario 1); recusa reemissão pro mesmo `saleOrderId` (FR-006/SC-004); item sem grupo de um tributo gera `FallbackWarning` mas não bloqueia (Acceptance Scenario 4/FR-005); ambiente PRODUCTION recusa antes de qualquer side effect (mesmo padrão do teste equivalente em `nfse-issuance`, spec 025)

### erp-web — tela `/vendas/nfe` (FR-001, FR-005)

- [X] T021 [P] [US1] `apps/erp/web/src/features/nfe-issuance/api/` (dto + service, molde `features/nfse-issuance/api/`) — inclui a chamada de prévia/dryRun definida em T017
- [X] T022 [P] [US1] `apps/erp/web/src/features/nfe-issuance/hooks/` — query de pedidos elegíveis (fechados, sem `NfeIssuance`), mutation de emitir
- [X] T023 [US1] `apps/erp/web/src/features/nfe-issuance/pages/nfe-issuance-page.tsx` — `FiscalScrollablePage` desde o início (não repetir o gap que `nfse-issuance` teve na spec 018, corrigido só na 022); Autocomplete de pedido → prévia por item com `Alert`/badge de fallback por tributo (FR-005) → `ConfirmationDialog` com selo de ambiente real (reusa `useFiscalCompany`, spec 025) → Emitir; `EntityFormFooter`/rodapé sticky não se aplica aqui (não é formulário dirty-state, é ação direta — mesmo padrão de `nfse-issuance-page.tsx`, botão de ação no fim do conteúdo)
- [X] T024 [US1] `apps/erp/web/src/app/(app)/vendas/nfe/page.tsx` — troca o placeholder desabilitado por `NfeIssuancePage`; `lib/navigation.ts` remove o `disabled` do leaf NF-e em Vendas › FISCAL
- [X] T025 [P] [US1] `apps/erp/web/src/features/nfe-issuance/GUIA.md` — manual de negócio (molde `features/nfse-issuance/GUIA.md`), cobrindo o aviso de fallback por item e a proteção contra reemissão

## Phase 4: Polish & Cross-Cutting Concerns

- [X] T026 Gate `apps/erp/api`: `pnpm --filter @citybox/erp-api typecheck && lint && test` (módulo `nfe-issuance` + `nfe` da fiscal-api)
- [X] T027 Gate `services/fiscal-api`: `pnpm --filter @citybox/fiscal-api typecheck && lint && test`
- [X] T028 Gate `apps/erp/web`: `pnpm --filter @citybox/erp-web typecheck && lint && build`
- [X] T029 `database-reviewer` na migration de T007 (obrigatório, tocou Prisma)
- [X] T030 `react-reviewer` nos `.tsx` novos de `features/nfe-issuance`
- [X] T031 `typescript-reviewer` no diff completo (fiscal-api + erp-api + erp-web)
- [X] T032 `security-reviewer` obrigatório (token de serviço reusado + rota `store.fiscal.issue` nova + payload que a fiscal-api passa a confiar mais — confirmar que FR-004 realmente fecha a superfície de CST/alíquota manipulados, Acceptance Scenario 3)
- [X] T033 Atualizar `services/fiscal-api/AGENTS.md` (contrato `POST /v1/nfe` ganhou campos) + `apps/erp/api/AGENTS.md` (`modules/nfe-issuance` novo) + `apps/erp/web/AGENTS.md` (`features/nfe-issuance` novo, rota `/vendas/nfe` deixa de ser placeholder) na mesma operação das mudanças de código correspondentes
- [ ] T034 Build + deploy dos 3 serviços (`erp-api`, `fiscal-api`, `erp-web`) — **só após autorização explícita do usuário**, mesma restrição já aplicada nesta sessão para a spec 025
- [ ] T035 Validar em produção: emitir uma NF-e real a partir de um pedido de venda com produtos totalmente parametrizados (SC-001); confirmar que reemissão do mesmo pedido é bloqueada (SC-004); confirmar que um pedido com produto sem grupo mostra o aviso de fallback antes de emitir (SC-003)

## Dependencies

- T002-T006 (fiscal-api) são **pré-requisito** de T013/T014 (erp-api só consegue mandar os campos novos depois que a fiscal-api os aceita) — mas podem ser codados e testados em paralelo enquanto T007-T012 (fundação do módulo erp-api) avançam, desde que T013/T014 só integrem depois de T002-T006 estarem prontos.
- T007 (migration) bloqueia T009/T016 (repositório real depende do schema).
- T014 depende de T008-T013 e dos 3 `ResolveItem*UseCase` (já existentes, sem tarefa própria).
- T017/T018 dependem de T014.
- Frontend (T021-T025) depende de T017/T018 (contrato HTTP definido) — pode começar em paralelo usando o fake/mock local se a API ainda não estiver pronta, mas a integração final espera a rota real.

## Parallel Example

```text
# Fiscal-api (3 arquivos, sem dependência entre si):
T002, T003, T004 em paralelo

# Fundação do módulo erp-api (arquivos independentes, mesma pasta nova):
T008, T009, T010, T011 em paralelo

# Frontend (depois do contrato definido):
T021, T022, T025 em paralelo
```

## Implementation Strategy

**MVP = toda a feature** (spec de user story única, P1). Ordem sugerida: fiscal-api primeiro
(T002-T006, desbloqueia o contrato) → módulo erp-api (T007-T020) → frontend (T021-T025) →
Polish (T026-T035).
