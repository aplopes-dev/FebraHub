---

description: "Task list for Motor de recebíveis do contrato de cartões"

---

# Tasks: Motor de recebíveis do contrato de cartões

**Input**: Design documents from `/specs/erp/005-card-receivables-engine/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (todos presentes)

**Tests**: incluídas — TDD é regra do projeto (`.claude/rules/ecc/common/testing.md`) e o próprio spec
exige `calculateCardSettlement` com suíte densa antes de qualquer integração (Orientações #1 do
prompt de origem).

**Organization**: tarefas agrupadas por user story do spec.md (US1–US5, prioridades P1/P1/P2/P2/P3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: a qual user story do spec.md a tarefa pertence
- Caminhos de arquivo sempre absolutos a partir da raiz do monorepo

## Path Conventions

Monorepo Turborepo, app **web application** — dois pacotes tocados, sem projeto novo:
- Backend: `apps/erp/api/src/modules/{finance/card-contracts,sales}/...`
- Frontend: `apps/erp/web/src/features/{card-contracts,sales-orders,financial-entries}/...`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: extrair os dois catálogos estáticos que os requisitos técnicos do spec já exigem
limpar, antes de qualquer código novo depender deles.

- [X] T001 [P] Extrair `BRAND_OPTIONS` de `apps/erp/web/src/features/card-contracts/components/payment-method-form-dialog.tsx:29-40` para um novo arquivo exportado `apps/erp/web/src/features/card-contracts/data/card-brands.ts`
- [X] T002 [P] Extrair `MOCK_PROVIDERS` de `apps/erp/web/src/features/card-contracts/types/card-contract.ts:156` para um novo arquivo `apps/erp/web/src/features/card-contracts/data/card-providers.ts`
- [X] T003 Atualizar `apps/erp/web/src/features/card-contracts/components/payment-method-form-dialog.tsx` para importar `BRAND_OPTIONS` de `data/card-brands.ts` em vez da constante local (depende de T001)
- [X] T004 Atualizar `apps/erp/web/src/features/card-contracts/types/card-contract.ts` e seus consumidores para importar `MOCK_PROVIDERS` de `data/card-providers.ts` em vez de exportá-lo do arquivo de tipos (depende de T002)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: schema Prisma — bloqueia as 5 user stories (US1 escreve em `SaleOrderPayment`; US2–US5
leem/escrevem em `FinancialEntry`).

**⚠️ CRITICAL**: nenhuma user story pode ser implementada antes desta fase.

- [X] T005 Adicionar em `apps/erp/api/prisma/schema.prisma`: `SaleOrderPayment` ganha `cardPaymentType CardPaymentMethodType?`, `brand String?`, `installments Int?`; `FinancialEntry` ganha `grossAmountCents Int?`, `acquirerFeeCents Int?`, `cardContractId String?` (FK `CardContract`, `onDelete: SetNull`), `cardPaymentMethodId String?` (FK `CardPaymentMethod`, `onDelete: SetNull`), `saleOrderPaymentId String?` (FK `SaleOrderPayment`, `onDelete: Cascade`), `installmentSequence Int?`, `installmentCount Int?`, `cardSettlementFallback Boolean @default(false)` + índice `@@unique([saleOrderPaymentId, installmentSequence])` — ver data-model.md §1/§2 para os campos exatos. Confirmado: `SaleOrderPayment`/`FinancialEntry` já estavam em `TENANT_SCOPED_MODELS` (`tenant-scope.extension.ts:61,69`) — nenhuma mudança na allowlist
- [X] T006 Migration `20260806140000_add_card_settlement_engine` gerada via `prisma migrate diff` (ambiente não-interativo não suporta `migrate dev`) e aplicada com `pnpm run db:migrate:deploy` — `prisma migrate status` confirma schema em dia
- [X] T007 `pnpm run db:generate` executado — client Prisma regenerado

**Checkpoint**: schema pronto — as 5 user stories podem começar.

---

## Phase 3: User Story 1 - Capturar bandeira e parcelas no pagamento em cartão (Priority: P1) 🎯 MVP (parte 1)

**Goal**: o operador de caixa informa bandeira (débito/crédito) e parcelas (crédito) ao registrar um
pagamento em cartão; os dados ficam salvos no pagamento da venda.

**Independent Test**: registrar um pagamento em crédito 3x bandeira Visa e confirmar que
`cardPaymentType`, `brand` e `installments` persistem no `SaleOrderPayment`, mesmo sem nenhum
cálculo de recebível existir ainda.

### Tests for User Story 1 ⚠️

- [X] T008 [P] [US1] Escrever casos de teste em `apps/erp/api/src/modules/sales/application/use-cases/create-sale-order/create-sale-order.use-case.spec.ts`: pagamento `cardPaymentType='debit'`/`'credit'` sem `brand` → `ValidatorDomainError`; `cardPaymentType='pix'` com `brand` informado → normalizado para `null` (RN-11); `installments=0` ou negativo → `ValidatorDomainError`. Rodar e confirmar RED (campos ainda não existem na entidade) — RED confirmado (6 erros de tipo)

### Implementation for User Story 1

- [X] T009 [US1] Adicionar `cardPaymentType?`, `brand?`, `installments?` a `SaleOrderPaymentProps`/`SaleOrderPaymentInput` e à validação de `normalizePayments` em `apps/erp/api/src/modules/sales/domain/entities/sale-order.entity.ts` (regras: brand obrigatório se debit/credit; brand forçado a `null` se pix; installments inteiro ≥1 quando informado) — GREEN confirmado (15/15 testes)
- [X] T010 [US1] Estendido `SaleOrderPaymentHttpDto` (`sale-order.dto.ts` HTTP) e `SaleOrderPaymentDto` (`application/dtos/sale-order.dto.ts`, não previsto no plano original mas necessário para o boundary de tipos) com os 3 campos novos
- [X] T011 [US1] Ecoados os 3 campos novos em `sale-order.presenter.ts` (`toHttpDetail` e `toHttpSingle`)
- [X] T012 [P] [US1] `cardPaymentType?`/`brand?`/`installments?` adicionados a `SaleOrderPayment` em `types/sale-order-form.ts`
- [X] T013 [US1] DTO (`api/sale-order.dto.ts`) e mapper (`api/sale-order.mapper.ts`) estendidos nos dois sentidos
- [X] T014 [US1] `MOCK_PAYMENT_METHODS` estendido: `pm-cartao` (crédito genérico) virou `pm-cartao-debito`/`pm-cartao-credito` + `cardPaymentType` em cada entrada (`PaymentMethodOption.cardPaymentType`, novo). Referência legada em `sales-contracts/data/mock-sales-contracts.ts` corrigida para o novo id
- [X] T015 [US1] Painel de pagamentos exibe Select de Bandeira (`CARD_BRAND_OPTIONS`) para débito/crédito e `NumberSpinner` de Parcelas só para crédito; troca de forma de pagamento limpa bandeira/parcelas. `updatePayment` (`use-sale-order-form.ts`) estendido. Frontend + backend typecheck limpos; lint sem novos problemas (151 pré-existentes, nenhum em arquivo tocado)

**Checkpoint**: US1 completa e testável de forma independente — o painel de pagamentos captura
bandeira/parcelas e os dados chegam ao banco, mesmo sem nenhum recebível diferenciado ainda sendo
gerado.

---

## Phase 4: User Story 2 - Recebível líquido, na data certa de repasse (Priority: P1) 🎯 MVP (parte 2)

**Goal**: fechar uma venda no cartão/Pix com contrato aplicável gera o recebível com a taxa
descontada e vencimento correto — o motor em si.

**Independent Test**: fechar uma venda de R$ 100,00 no débito Visa com contrato a 2,3%/D+1 corrido e
conferir 1 recebível de R$ 97,70 vencendo no dia seguinte.

### Tests for User Story 2 ⚠️

> Escrever e ver falhar (RED) antes de qualquer implementação — é o "coração da feature" que o spec pede em TDD.

- [X] T016 [P] [US2] `business-day-calendar.spec.ts` — 9 testes: `addDays` corrido/útil (pula sáb/dom), `pushToNextBusinessDay`. RED confirmado (módulo inexistente) antes de T018
- [X] T017 [P] [US2] `card-settlement-calculator.spec.ts` — 7 testes: débito Visa 2,3% D+1 corrido, débito Mastercard 2,0% D+1 útil (sexta→segunda), Pix taxa/prazo 0, tarifa fixa, faixa progressiva, `CardSettlementRateUnresolvedError`, validação de parcelas. RED confirmado antes de T019

### Implementation for User Story 2

- [X] T018 [US2] `business-day-calendar.ts` (`addDays`, `pushToNextBusinessDay`) — GREEN, 9/9
- [X] T019 [US2] `card-settlement-calculator.ts` (`calculateCardSettlement`) — GREEN, 7/7. Resolução de taxa lança `CardSettlementRateUnresolvedError` (novo, `domain/errors/`) quando nem faixa nem taxa base cobrem — o chamador (T021) trata como fallback (research.md D7)
- [X] T020 [US2] `resolve-card-settlement.ts` criado — filtra `active=true`+`deletedAt=null` explicitamente, itera contratos candidatos (mais antigo primeiro) até achar `type`+`brand` correspondente
- [X] T021 [US2] `maybeCreateReceivable` reescrito (agora orquestra `createCardSettlementEntries`/`createFinancialEntry`, novos métodos privados). Achado durante a implementação: `payment.id` fica `undefined` em memória para pagamentos novos até o `createMany` — resolvido calculando os ids uma vez (`paymentsWithResolvedIds`) e reaproveitando no motor, para o FK `saleOrderPaymentId` bater com o id real persistido. `BankTransaction` só é criada quando `paidCents > 0` (recebível pendente do motor ainda não é dinheiro em conta — ajuste não previsto no research original, necessário para não inflar o extrato com dinheiro que ainda não chegou)
- [X] T022 [US2] `prisma-sale-order.repository.card-settlement.spec.ts` criado — **primeiro teste do `erp-api` a rodar contra Postgres real** (sem precedente no repo; confirmado via leitura de `tenant-scope.extension.ts` que `.scoped` não exige contexto de tenant fora de requisição HTTP — `state.kind === 'absent'` passa a query adiante sem filtrar, então nenhuma configuração extra de contexto foi necessária). 4/4 verde na primeira execução: 2.1 (débito), 2.5 (Pix), 2.9 (misto), 2.10 (zero regressão)
- [X] T023 [US2] Suíte completa de `src/modules/sales` rodada — 17/17 verde, zero regressão (baixa de estoque, imutabilidade pós-baixa)

**Checkpoint**: MVP completo (US1+US2) — vender no débito com contrato configurado já gera o
recebível líquido correto na data certa. Demonstrável de ponta a ponta.

---

## Phase 5: User Story 3 - Parcelamento do crédito distribuído corretamente (Priority: P2)

**Goal**: crédito parcelado respeita `single_payment` vs. parcelas futuras, sem perder nem sobrar
centavo entre elas.

**Independent Test**: venda de R$ 600,00 em 6x — com `single_payment` gera 1 recebível; com parcelas
em dias corridos gera 6, cuja soma bate exatamente com o líquido total.

### Tests for User Story 3 ⚠️

- [X] T024 [P] [US3] 2 testes adicionados a `card-settlement-calculator.spec.ts`: crédito 6x `single_payment` → 1 parcela; crédito 6x `calendar_days` → 6 parcelas espaçadas por 30 dias, soma exata, resto na última parcela

### Implementation for User Story 3

- [X] T025 [US3] Confirmado — GREEN de primeira (9/9), nenhum ajuste necessário: `calculateCardSettlement` já implementava a convenção de arredondamento genericamente desde T019
- [X] T026 [US3] 2 cenários adicionados ao teste de integração: crédito 6x `single_payment` → 1 `FinancialEntry`; crédito 6x corrido (valor proposital não divisível, R$600,01) → 6 `FinancialEntry`, soma líquida exata
- [X] T027 [US3] Cenário de faixa progressiva adicionado ao teste de integração — 5 parcelas com `CardRateTier` 1-3x=3%/4-6x=4% reais no Postgres → aplica 4%. 7/7 verde

**Checkpoint**: US1+US2+US3 — o motor cobre corretamente débito, Pix e os dois modos de crédito
parcelado.

---

## Phase 6: User Story 4 - Comportamento seguro quando não há contrato aplicável (Priority: P2)

**Goal**: sem contrato/método correspondente, a venda fecha normalmente no formato de hoje — nunca
falha por causa do motor. Reprocessar o mesmo fechamento não duplica.

**Independent Test**: fechar uma venda no cartão numa organização sem `CardContract` cadastrado e
confirmar recebível bruto/quitado/hoje, sem erro.

### Tests for User Story 4 ⚠️

- [X] T028 [P] [US4] 3 cenários de fallback adicionados (2.7a sem contrato, 2.7b sem método pra bandeira, 2.7c contrato inativado) — todos com conta bancária isolada por teste (ver nota abaixo)
- [X] T029 [P] [US4] Cenário de idempotência adicionado — fecha, recarrega via `findById` (reproduzindo fielmente o `UpdateSaleOrderStatusUseCase`), fecha de novo; confirma 6 `FinancialEntry`, não 12

**Achado de teste (não de produção) durante T028/T029**: as duas primeiras versões desses testes reaproveitavam a conta bancária compartilhada do `beforeAll` — como `resolveCardSettlement` busca entre *todos* os contratos ativos daquela conta (D6), um contrato registrado por um teste anterior (ex.: 2.6 registrando `credit+Elo`) "vazava" e era escolhido no lugar do contrato que o teste atual acabara de criar, por ser mais antigo. Corrigido dando a cada teste sua própria conta bancária (`createBankAccount()`, helper novo no spec). Confirma que `resolveCardSettlement` está correto — o bug era só de isolamento de fixture nos testes.

### Implementation for User Story 4

- [X] T030 [US4] Confirmado — `resolve-card-settlement.ts` (T020) já filtrava `active:true, deletedAt:null` explicitamente desde a implementação original; 2.7c prova o caso (contrato inativo não considerado)
- [X] T031 [US4] Confirmado — `createCardSettlementEntries` (T021) já envolvia resolução+cálculo em `try/catch`, roteando qualquer erro para o fallback por pagamento, desde a implementação original
- [X] T032 [US4] Confirmado — idempotência por `(saleOrderPaymentId, installmentSequence)` via `existingCardKeys` (Set calculado 1x no início de `maybeCreateReceivable`) já implementada em T021; 2.8 prova o caso
- [X] T033 [US4] `create-sale-order.use-case.spec.ts` + suíte completa de `src/modules/sales` rodadas novamente — 17/17 verde

**Checkpoint**: US1–US4 — o motor é seguro por padrão: nunca falha o fechamento de venda, nunca
duplica recebível.

---

## Phase 7: User Story 5 - Rastrear a taxa cobrada em cada recebível (Priority: P3)

**Goal**: o usuário financeiro vê bruto/taxa/líquido (e o aviso de fallback) de qualquer recebível
gerado, sem cálculo manual.

**Independent Test**: abrir um recebível gerado por uma venda no cartão e ver bruto e taxa junto do
líquido.

### Tests for User Story 5 ⚠️

- [X] T034 [P] [US5] `financial-entry.presenter.spec.ts` criado (não existia) — 3 testes: `toHttp` com campos do motor, `toHttpListItem` sem os ids de FK, lançamento manual com campos novos null/false. RED confirmado (7 erros de tipo) antes de T035/T036

### Implementation for User Story 5

- [X] T035 [US5] `FinancialEntryPresenter.toHttp` estendido — GREEN
- [X] T036 [US5] `FinancialEntryPresenter.toHttpListItem` estendido (sem os 3 ids de FK) — GREEN, 3/3
- [X] T037 [US5] Entidade `FinancialEntry` (8 campos novos em `FinancialEntryProps` + getters + defaults null/false em `create()`, nunca setáveis via `update()` — todo lançamento com esses campos tem `saleOrderId`, logo já é `isReadOnly` e `update()` bloqueia antes de qualquer coisa) e `PrismaFinancialEntryRepository` (linha do tipo `FinancialEntryRow`, leitura `toEntity`, escrita `save()` — incluído no `data` de escrita só para round-trip correto de `softDelete()`/`restore()`) atualizados. Suíte completa de `financial-entries` — 78/78 verde, zero regressão
- [X] T038 [P] [US5] Campos novos adicionados a `types/financial-entry.ts` (`grossAmount`/`acquirerFee` em reais, `installmentSequence`/`installmentCount`/`cardSettlementFallback`) + DTO (`api/financial-entry.dto.ts`) + mapper (`api/financial-entry.mapper.ts`, detalhe e item de lista)
- [X] T039 [US5] Bloco bruto/taxa/líquido no detalhe (`financial-entry-financial-section.tsx`, novo tipo exportado `FinancialEntryCardSettlementInfo`, prop `cardSettlement` encadeada por `financial-entry-form-view.tsx` até `financial-entry-edit-page.tsx`) — só renderiza quando `grossAmount`/`acquirerFee` não são nulos
- [X] T040 [US5] Badge `SemanticBadge` tom `warning` ("Sem contrato aplicável"/"Gerado sem contrato de cartão aplicável") na linha da lista (`financial-entry-list-table.tsx`) e no detalhe (dentro da seção Financeiro) quando `cardSettlementFallback=true`. Frontend typecheck limpo

**Checkpoint**: todas as 5 user stories completas e testáveis de forma independente.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: documentação obrigatória (GUIA.md/AGENTS.md) e validação final ponta a ponta.

- [X] T041 [P] `api/AGENTS.md` §9 atualizado: linha de `card-contracts` (contrato HTTP inalterado), parágrafo completo substituindo a descrição antiga de `maybeCreateReceivable` (motor, fallback, idempotência, testes, achados). §10 ganhou a decisão do acoplamento `sales`↔`finance`. §12 (histórico) e §1 (data) também atualizados
- [X] T042 [P] `web/AGENTS.md` §4.5 atualizado (`card-contracts`, `sales-orders`, `financial-entries`) + §9 (status) + §10 (decisão bandeira Select vs Autocomplete) + §12 (histórico) + §1 (data)
- [X] T043 [P] `card-contracts/GUIA.md` — seção nova "Para que serve este cadastro, na prática" com o efeito de cada campo, incluindo os "ainda sem efeito"
- [X] T044 [P] `sales-orders/GUIA.md` (bandeira/parcelas) e `financial-entries/GUIA.md` (bruto/taxa/líquido + aviso de fallback) atualizados
- [X] T045 [P] Textos de ajuda adicionados em `card-contract-form-view.tsx` (descrições de seção + captions inline). **Achado durante esta tarefa** (documentado em research.md D14, `api/AGENTS.md` §9 e no `GUIA.md`): `depositFeeCents`, `allEntriesPaidInContract`, `businessDaysDeposit` e `minInstallments`/`maxInstallments` também não são consumidos pelo motor — não previstos no research original, adicionados à lista de "fora de escopo" em vez de implementados às pressas no Polish
- [X] T046 Gate completo rodado — backend: `build`/`typecheck`/`test` (145 suites, 690 testes) 100% verdes, `lint` sem nenhum erro novo (baseline pré-existente de 71 problemas em módulos não tocados por esta feature, confirmado via diff de `git status`); frontend: `typecheck` verde, `lint` sem nenhum erro novo (baseline pré-existente de 54 problemas). **Achado e corrigido durante o gate**: o primeiro fix de lint (tipar `tx` como `Prisma.TransactionClient` em vez de `any`) quebrou o `typecheck` — o client retornado por `prisma.scoped.$transaction(...)` é um tipo `$extends`-ado (tenant-scope), estruturalmente incompatível com `Prisma.TransactionClient`. Corrigido com um tipo derivado próprio, `ScopedTransactionClient` (novo export em `prisma.service.ts`), usado em `resolve-card-settlement.ts` e nos 3 métodos novos de `prisma-sale-order.repository.ts`. Também corrigido 1 erro `react/no-unescaped-entities` introduzido pelo texto de ajuda de T045 em `card-contract-form-view.tsx` — depende de T001–T045
- [X] T047 Verificação manual executada com as limitações do ambiente: as 11 asserções de negócio dos cenários 2.1–2.10 do `quickstart.md` já rodam como teste de integração Postgres-real (`prisma-sale-order.repository.card-settlement.spec.ts`, incluída no T046); a verificação de browser (§4) foi tentada via Playwright headless contra os servidores dev já ativos (`erp-web:3107`, `erp-api:3114`) nas 3 rotas (`/vendas/pedidos-de-venda/novo`, `/financas/lancamentos`, `/financas/contratos-de-cartoes-e-outros/novo`) — todas renderizam a tela de login sem erro de client-side (guard de autenticação Keycloak funcionando como esperado; nenhuma credencial de dev documentada no repo para prosseguir além do login neste ambiente não interativo). Confirmado: nenhum erro de console além do 401 esperado, nenhuma tela em branco — depende de T046

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: depende de Setup só por convenção de numeração; na prática independente de T001–T004 — mas **bloqueia** todas as user stories
- **US1 (Phase 3)**: depende de Foundational
- **US2 (Phase 4)**: depende de Foundational; independente de US1 no dado (mas sem US1 não há como um pagamento real chegar com `cardPaymentType` setado em produção — testável isoladamente via o repositório/entidade direto, como T022 faz)
- **US3 (Phase 5)**: depende de US2 (estende o mesmo `calculateCardSettlement` e o mesmo teste de integração)
- **US4 (Phase 6)**: depende de US2 (estende o mesmo `resolve-card-settlement`/`maybeCreateReceivable`)
- **US5 (Phase 7)**: depende de US2 (consome os campos que US2 já grava) — independente de US3/US4
- **Polish (Phase 8)**: depende de todas as stories desejadas estarem completas

### Parallel Opportunities

- T001/T002 (Setup) em paralelo
- T016/T017 (testes do calculador/calendário, US2) em paralelo — arquivos diferentes
- T024 depende de T017/T019 já existirem (mesmo arquivo de spec) — não paralelizável com eles, mas paralelizável com T028/T029 (arquivos/casos diferentes dentro do mesmo spec de integração, se a suíte permitir blocos independentes)
- T038 (frontend types/mapper, US5) em paralelo com T035–T037 (backend, US5) — endpoints ainda não integrados nesse ponto
- T041–T045 (documentação, Polish) todos em paralelo entre si

---

## Parallel Example: User Story 2 (o motor em si)

```bash
# Testes do calculador e do calendário — arquivos diferentes, ambos RED antes da implementação:
Task: "business-day-calendar.spec.ts — dias úteis/corridos + push de fim de semana"
Task: "card-settlement-calculator.spec.ts — débito/Pix/faixa progressiva/tarifa fixa"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Completar Fase 1 (Setup) + Fase 2 (Foundational — schema/migration)
2. Completar Fase 3 (US1 — captura de bandeira/parcelas)
3. Completar Fase 4 (US2 — motor: cálculo + resolução + integração no fechamento)
4. **PARAR e VALIDAR**: cenário 2.1 do quickstart.md (débito Visa 2,3%/D+1 corrido) e 2.10 (zero
   regressão em pedido só-dinheiro) — se os dois passam, o MVP está de pé
5. Demo: venda no débito com contrato configurado já gera o recebível líquido certo

### Incremental Delivery

1. Setup + Foundational → schema pronto
2. US1 + US2 → **MVP**: débito com contrato configurado funciona ponta a ponta
3. + US3 → crédito parcelado (single_payment e múltiplas parcelas) correto
4. + US4 → motor seguro por padrão (fallback + idempotência) — importante entregar antes de expor a
   funcionalidade a qualquer organização real, já que cobre o caso mais comum no dia 1 (a maioria das
   lojas ainda sem contrato cadastrado)
5. + US5 → rastreabilidade visível para o financeiro
6. Polish → documentação obrigatória + gate completo

### Nota de risco (do spec, Pontos de Atenção)

Alterar `maybeCreateReceivable` mexe no fluxo mais crítico do ERP (fechamento de venda). US4 —
embora P2 — cobre a rede de segurança (fallback + idempotência) que torna as fases anteriores
seguras de expor; considerar antecipar T028–T033 caso qualquer entrega parcial (US1+US2 sem US4)
precise ir a produção antes do restante.

---

## Notes

- [P] = arquivos diferentes, sem dependência entre si
- [Story] mapeia a tarefa à user story do spec.md para rastreabilidade
- Testes (T008, T016, T017, T024, T028, T029, T034) devem ser escritos e **falhar** antes da
  implementação correspondente (RED → GREEN) — regra de TDD do projeto
- Backend usa Node test runner nativo com Postgres real (sem mock de banco) para os testes de
  integração (T022) — ver `api/AGENTS.md`
- Não commitar sem autorização explícita do usuário ao final da sessão
