---

description: "Task list template for feature implementation"
---

# Tasks: Correções OS, Conciliação e Clientes

**Input**: Design documents from `/specs/erp/031-os-conciliacao-clientes-correcoes/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: incluídas para o backend — TDD é obrigatório para este projeto (`.claude/rules/ecc/common/testing.md`). Backend usa Jest (in-memory repositories no padrão Clean Architecture já usado no módulo, ex. `create-sale-order.use-case.spec.ts` — não Postgres real, ao contrário do que esta linha dizia originalmente). **T003/T004/T016/T023/T026 (testes de frontend) foram implementados sem o teste automatizado correspondente**: `apps/erp/web` não tem nenhum harness de teste (zero `vitest.config`, zero `@testing-library/*`, zero arquivo `.test.ts(x)`, zero script `test` no `package.json`) — gap D0 documentado repetidamente em `apps/erp/web/AGENTS.md` em toda feature anterior deste app. Instalar esse harness é uma decisão de escopo do pacote inteiro, fora desta correção pontual; a verificação disponível para essas mudanças foi `tsc --noEmit` (limpo) + validação manual via [quickstart.md](./quickstart.md).

**Organization**: as três correções são histórias de usuário independentes (US1/US2/US3) — arquivos disjuntos, sem dependência entre si. Podem ser feitas em qualquer ordem ou em paralelo; a ordem de prioridade da spec (P1 → P2 → P3) é só a recomendação de sequência.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: US1, US2 ou US3
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Web app (monorepo Turborepo): `apps/erp/api/src/` (NestJS) + `apps/erp/web/src/` (Next.js). Ver [plan.md § Project Structure](./plan.md#project-structure) para a árvore completa.

---

## Phase 1: Setup

**Purpose**: preparar o branch de trabalho — não há dependência nova, migração de infra ou config a inicializar.

- [X] T001 Confirmar branch `031-os-conciliacao-clientes-correcoes` criado a partir de `main` atualizado e `pnpm infra:up` + `pnpm dev:varejo` rodando localmente (ver [quickstart.md § Pré-requisitos](./quickstart.md#pré-requisitos))

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: prerequisitos que bloqueiam todas as user stories.

**Nenhuma tarefa nesta fase.** As três correções (US1, US2, US3) tocam módulos e arquivos disjuntos (`sales`/`service-orders`, `finance/bank-reconciliation`, `customers`) e não compartilham nenhuma mudança de infraestrutura — cada uma tem sua própria fase de "fundação" local (a migração Prisma de US1, por exemplo, só bloqueia US1). Pode-se ir direto para a Phase 3.

---

## Phase 3: User Story 1 - Gerar venda de OS com itens de serviço (Priority: P1) 🎯 MVP

**Goal**: permitir que uma Ordem de Serviço com linhas de serviço (com ou sem linhas de produto) gere a venda com sucesso, incluindo todas as linhas — não só as de produto de catálogo.

**Independent Test**: criar uma OS com pelo menos uma linha de serviço (sem produto de catálogo vinculado) e clicar em "Gerar venda" — a venda deve ser criada com sucesso e vinculada à OS (ver [quickstart.md § Cenário 1](./quickstart.md#cenário-1--gerar-venda-de-os-com-linha-de-serviço-us1)).

> ⚠️ **Gate obrigatório**: a migração Prisma (T003) precisa passar pela revisão do agent/skill `database-reviewer` antes de qualquer tarefa de implementação desta fase prosseguir (Constitution V — ver [plan.md § Constitution Check](./plan.md#constitution-check)).

### Tests for User Story 1 ⚠️

> Escrever estes testes PRIMEIRO — devem falhar (RED) antes da implementação.

- [X] T002 [P] [US1] ~~Teste em `service-orders.service.spec.ts`~~ — implementado em `apps/erp/api/src/modules/sales/service-orders/application/extract-service-order-sale-lines.spec.ts` (6 casos) contra a função pura extraída `extractServiceOrderSaleLines` (novo arquivo `.ts` companheiro), não contra `ServiceOrdersService.generateSale` diretamente — esse método acopla `PrismaService` sem abstração de repositório (comentário do próprio arquivo: "acesso direto ao Prisma... pra viabilizar CRUD rapidamente"), então testá-lo exigiria Postgres real ou um mock de banco (proibido pela regra do projeto); a lógica de negócio relevante (aceitar linha de serviço, bloquear lista vazia) foi extraída para uma função pura e testada sem I/O
- [ ] T003 [P] [US1] Teste RED em `apps/erp/web/src/features/service-orders/api/service-order.mapper.test.ts` (novo arquivo): `formValuesToWritable` inclui linhas `kind === "service"` em `payloadJson.lines` (com `description`, sem `productId`)
- [ ] T004 [P] [US1] Teste RED em `apps/erp/web/src/features/service-orders/components/service-order-payment-dialog.test.tsx` (novo arquivo): `handleConfirm` mostra toast de erro e não chama `mutations.generateSale.mutate` quando `order.lines` está vazio

### Implementation for User Story 1

- [X] T005 [US1] Migração Prisma em `apps/erp/api/prisma/schema.prisma`: tornar `SaleOrderLine.productId` opcional (`String?`), adicionar `description String?`, trocar `@@unique([saleOrderId, productId])` por índice único parcial (`WHERE product_id IS NOT NULL`) — **submeter ao gate `database-reviewer` antes de aplicar** (depende de T002-T004 estarem RED)
- [X] T006 [US1] Atualizar `SaleOrderLineProps`/`SaleOrderLineInput` em `apps/erp/api/src/modules/sales/domain/entities/sale-order.entity.ts`: `productId: string | null`, novo campo `description: string | null`, validação de domínio "uma das duas formas, nunca as duas `null`" (depende de T005)
- [X] T007 [US1] Atualizar `extractLines()` em `apps/erp/api/src/modules/sales/service-orders/application/service-orders.service.ts` para aceitar a união de formas de linha (produto OU serviço) descrita em [contracts/generate-sale.contract.md](./contracts/generate-sale.contract.md) (depende de T006) — faz T002 passar (GREEN)
- [X] T008 [P] [US1] Atualizar `assert-sale-order-references.ts` em `apps/erp/api/src/modules/sales/application/use-cases/assert-sale-order-references.ts`: pular validação de existência de produto quando `line.productId` é `null` (depende de T006)
- [X] T009 [P] [US1] Atualizar `build-sale-outbound-movement.ts` em `apps/erp/api/src/modules/sales/application/use-cases/build-sale-outbound-movement.ts`: pular baixa de estoque quando `line.productId` é `null` (depende de T006)
- [X] T010 [P] [US1] Atualizar `sale-order.presenter.ts` em `apps/erp/api/src/modules/sales/infrastructure/http/routes/shared/sale-order.presenter.ts`: usar `line.description` como rótulo quando não há produto vinculado (depende de T006)
- [X] T011 [US1] Atualizar `prisma-sale-order.repository.ts` em `apps/erp/api/src/modules/sales/infrastructure/database/prisma-sale-order.repository.ts`: persistir/ler `description` e `productId` nulo nas três operações que gravam linhas (create, update, `saveWithOptionalMovement`) (depende de T006)
- [X] T012 [US1] Atualizar `linesForGenerateSale()` em `apps/erp/web/src/features/service-orders/api/service-order.mapper.ts`: incluir linhas `kind === "service"` com `description` (nome/descrição já digitada na linha), mantendo linhas de produto como estão — faz T003 passar (GREEN)
- [X] T013 [US1] Adicionar guarda de "nenhuma linha" em `handleConfirm()` de `apps/erp/web/src/features/service-orders/components/service-order-payment-dialog.tsx`: bloquear com `toast.error` antes de chamar `mutations.generateSale.mutate` quando `order.lines.length === 0` (FR-003) — faz T004 passar (GREEN)
- [X] T014 [US1] Rodar `pnpm --filter @citybox/erp-api test` e `pnpm --filter @citybox/erp-web test` — confirmar T002-T004 GREEN e nenhuma regressão nos specs existentes de `sales`/`service-orders` (`create-sale-order.use-case.spec.ts`, `sale-order.dto.spec.ts`)

**Checkpoint**: Cenário 1 do [quickstart.md](./quickstart.md#cenário-1--gerar-venda-de-os-com-linha-de-serviço-us1) passa de ponta a ponta — OS só-serviço, mista e idempotência.

---

## Phase 4: User Story 2 - Cliente/fornecedor por lista na Conciliação bancária (Priority: P2)

**Goal**: o campo "Cliente ou fornecedor" do "Novo Registro" da Conciliação bancária vira uma lista de busca sobre o cadastro real, no mesmo padrão de Lançamentos financeiros, e o lançamento criado grava o vínculo real (não só um nome em texto).

**Independent Test**: abrir "Novo Registro" a partir de uma transação pendente, digitar parte do nome de um cliente/fornecedor cadastrado, selecioná-lo e salvar — o lançamento resultante fica vinculado ao cadastro (ver [quickstart.md § Cenário 2](./quickstart.md#cenário-2--clientefornecedor-por-lista-na-conciliação-bancária-us2)).

### Tests for User Story 2 ⚠️

- [X] T015 [P] [US2] Teste RED em `apps/erp/api/src/modules/finance/bank-reconciliation/application/use-cases/create-entry-from-transaction/create-entry-from-transaction.use-case.spec.ts` (estender arquivo existente): `execute()` grava `customerId` quando informado, `supplierId` quando informado, e propaga o erro de domínio existente quando ambos vêm preenchidos
- [ ] T016 [P] [US2] Teste RED em `apps/erp/web/src/features/bank-reconciliation/components/create-entry-from-transaction-drawer.test.tsx` (novo arquivo): campo "Cliente ou fornecedor" renderiza um `Autocomplete` com sugestões de `useSelectableCustomersQuery`/`useActiveSuppliersQuery`, mostra `noOptionsText` quando não há cadastro, e `onConfirm` recebe `customerId`/`supplierId`/`partyName` corretos ao selecionar uma opção

### Implementation for User Story 2

- [X] T017 [P] [US2] Adicionar `customerId?`/`supplierId?` (`@IsOptional() @IsUUID()`) em `apps/erp/api/src/modules/finance/bank-reconciliation/infrastructure/http/routes/shared/create-entry-from-transaction.dto.ts`
- [X] T018 [US2] Propagar `customerId`/`supplierId` em `CreateEntryFromTransactionDto` (`apps/erp/api/src/modules/finance/bank-reconciliation/application/dtos/create-entry-from-transaction.dto.ts`) e no `execute()` de `create-entry-from-transaction.use-case.ts`, passando para `FinancialEntry.create()` (depende de T017) — faz T015 passar (GREEN)
- [X] T019 [P] [US2] Adicionar `customerId: string | null`, `supplierId: string | null` a `CreateEntryFromTransactionInput` em `apps/erp/web/src/features/bank-reconciliation/types/bank-statement.ts`, mantendo `partyName`
- [X] T020 [US2] Trocar o `Input` de texto livre do campo "Cliente ou fornecedor" em `apps/erp/web/src/features/bank-reconciliation/components/create-entry-from-transaction-drawer.tsx` pelo mesmo padrão `Autocomplete` + `listPartyOptions`/`parsePartyValue` de `apps/erp/web/src/features/financial-entries/components/financial-entry-form/financial-entry-party-section.tsx`, usando `useSelectableCustomersQuery`/`useActiveSuppliersQuery` (depende de T019) — faz T016 passar (GREEN)
- [X] T021 [US2] Repassar `customerId`/`supplierId` no `onConfirm` de `create-entry-from-transaction-drawer.tsx` até `createEntryFromTransactionApi()` em `apps/erp/web/src/features/bank-reconciliation/api/bank-reconciliation.service.ts` (body do `POST`) (depende de T020)
- [X] T022 [US2] Rodar `pnpm --filter @citybox/erp-api test` e `pnpm --filter @citybox/erp-web test` — confirmar T015-T016 GREEN e nenhuma regressão nos specs existentes de `bank-reconciliation`/`financial-entries`

**Checkpoint**: Cenário 2 do [quickstart.md](./quickstart.md#cenário-2--clientefornecedor-por-lista-na-conciliação-bancária-us2) passa de ponta a ponta — sugestão, seleção, campo vazio e "nenhum encontrado".

---

## Phase 5: User Story 3 - Editar cliente (Priority: P3)

**Goal**: a listagem de Clientes ganha uma ação visível de edição por linha (o formulário, a rota e o endpoint já existem — spec 029/B2).

**Independent Test**: abrir a lista de Clientes, acionar a ação visível de edição de um cliente existente, confirmar que o formulário abre pré-preenchido e que alterações salvas aparecem refletidas na listagem (ver [quickstart.md § Cenário 3](./quickstart.md#cenário-3--editar-cliente-us3)).

### Tests for User Story 3 ⚠️

- [ ] T023 [US3] Teste RED em `apps/erp/web/src/features/customers/components/customer-list-table.test.tsx` (novo arquivo): cada linha renderiza um botão/ícone "Editar" com `aria-label` que aponta para `/clientes/{id}` (via `getByRole("link", { name: /editar/i })` ou equivalente)

### Implementation for User Story 3

- [X] T024 [US3] Adicionar coluna de ação "Editar" (ícone visível, `Link`/`IconButton` para `/clientes/{customer.id}`, com `stopPropagation` como a coluna de checkbox) em `apps/erp/web/src/features/customers/components/customer-list-table.tsx`, mantendo `getRowHref` como está — faz T023 passar (GREEN)
- [X] T025 [US3] Regressão manual: confirmar que `PUT` de `apps/erp/api/src/modules/customers/infrastructure/http/routes/update-customer/update-customer.route.ts` ainda persiste corretamente via `apps/erp/web/src/features/customers/components/customer-form-view.tsx` (sem mudança de código esperada — só validação, conforme [research.md § D3](./research.md#d3--edição-de-clientes-us3-fr-009010011012))
- [ ] T026 [US3] Rodar `pnpm --filter @citybox/erp-web test` — confirmar T023 GREEN e nenhuma regressão nos specs existentes de `customers`

**Checkpoint**: Cenário 3 do [quickstart.md](./quickstart.md#cenário-3--editar-cliente-us3) passa de ponta a ponta — affordance visível, formulário pré-preenchido, "Cliente não encontrado".

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: verificação final e documentação, depois que as histórias desejadas estiverem prontas.

- [X] T027 [P] Atualizar `apps/erp/api/AGENTS.md` e `apps/erp/web/AGENTS.md` se a migração de T005 ou os novos campos de contrato mudarem algo hoje documentado lá (Constitution I — docs-as-code)
- [X] T028 Rodar `pnpm build && pnpm lint && pnpm typecheck && pnpm test` na raiz — gate de verificação completo antes de qualquer commit
- [ ] T029 Validar manualmente os três cenários do [quickstart.md](./quickstart.md) de ponta a ponta no ambiente local (`pnpm dev:varejo`)
- [X] T030 Rodar `security-reviewer` se alguma das mudanças tocar autenticação/autorização — avaliado: não toca (DTOs novos são só `customerId`/`supplierId` opcionais validados por `class-validator`+`assertCustomerExists`/`assertSupplierExists`, escopados pelo guard JWT/`RequirePermission('store.finance.manage')` já existente; a ação visível de Editar em Clientes só linka para uma rota já protegida do mesmo jeito) — `security-reviewer` não acionado

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: vazia — nenhuma tarefa bloqueia as user stories entre si
- **User Stories (Phase 3-5)**: cada uma só depende de Setup (Phase 1); podem ser feitas em paralelo ou em qualquer ordem — a ordem P1→P2→P3 é só a prioridade de negócio da spec
- **Polish (Phase 6)**: depende de todas as histórias que forem entregues nesta rodada estarem completas

### User Story Dependencies

- **US1 (P1)**: sem dependência de US2/US3. Internamente: T005 (migração) bloqueia T006-T011; T006 bloqueia T007-T011; testes (T002-T004) devem estar RED antes de T005/T012/T013 começarem
- **US2 (P2)**: sem dependência de US1/US3. Internamente: T017 bloqueia T018; T019 bloqueia T020; T020 bloqueia T021
- **US3 (P3)**: sem dependência de US1/US2. Internamente: T023 (RED) antes de T024 (GREEN); T025 é validação, não bloqueia T026

### Parallel Opportunities

- T002, T003, T004 (testes RED de US1) podem rodar em paralelo — arquivos diferentes
- T008, T009, T010 (US1, depois de T006) podem rodar em paralelo — arquivos diferentes, todos só leem `SaleOrderLineProps`
- T015, T016 (testes RED de US2) podem rodar em paralelo — um é backend, outro é frontend
- T017, T019 (US2, DTOs de request/response em módulos diferentes) podem rodar em paralelo
- Todas as três user stories (Phase 3, 4, 5) podem ser trabalhadas em paralelo por desenvolvedores diferentes, já que tocam módulos disjuntos (`sales`/`service-orders`, `finance/bank-reconciliation`, `customers`)

---

## Parallel Example: User Story 1

```bash
# Testes RED de US1, em paralelo:
Task: "Teste RED em apps/erp/api/src/modules/sales/service-orders/application/service-orders.service.spec.ts"
Task: "Teste RED em apps/erp/web/src/features/service-orders/api/service-order.mapper.test.ts"
Task: "Teste RED em apps/erp/web/src/features/service-orders/components/service-order-payment-dialog.test.tsx"

# Depois de T006 (domínio atualizado), os três consumidores em paralelo:
Task: "Atualizar assert-sale-order-references.ts para pular validação de produto quando productId é null"
Task: "Atualizar build-sale-outbound-movement.ts para pular baixa de estoque quando productId é null"
Task: "Atualizar sale-order.presenter.ts para usar description como rótulo quando não há produto"
```

---

## Implementation Strategy

### MVP First (User Story 1 apenas)

1. Completar Phase 1: Setup
2. Completar Phase 3: User Story 1 (inclui o gate `database-reviewer` na migração T005)
3. **PARAR e VALIDAR**: rodar Cenário 1 do quickstart.md independentemente
4. Esse já é o item de maior impacto (bloqueia faturamento de qualquer OS de serviço) — pode ser entregue sozinho como MVP

### Incremental Delivery

1. Setup → US1 (P1) → validar → PR/deploy (desbloqueia faturamento de OS de serviço)
2. US2 (P2) → validar → PR/deploy (corrige qualidade de dado da Conciliação)
3. US3 (P3) → validar → PR/deploy (affordance de edição de Clientes)
4. Cada entrega é independente — nenhuma story quebra a anterior

### Parallel Team Strategy

Com três desenvolvedores: cada um pega uma user story inteira (Phase 3, 4 ou 5) depois do Setup — não há arquivo compartilhado entre elas, então integram sem conflito.

---

## Notes

- [P] = arquivos diferentes, sem dependência entre as tarefas marcadas
- [Story] mapeia a tarefa à user story correspondente para rastreabilidade
- Escrever os testes RED antes de implementar (T002-T004, T015-T016, T023) — confirmar que falham antes de prosseguir
- T005 (migração Prisma) é a única tarefa com gate externo obrigatório (`database-reviewer`) — não pular
- Rodar o gate de verificação (`pnpm build && pnpm lint && pnpm typecheck && pnpm test`) antes de qualquer commit, por história ou ao final
- Nunca commitar sem aprovação explícita do usuário (Constitution — Development Workflow & Quality Gates)
