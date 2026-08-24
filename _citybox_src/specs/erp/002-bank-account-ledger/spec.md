# Feature Specification: Contas bancárias — saldo real, extrato e transferência

**Feature Branch**: `002-bank-account-ledger`

**Created**: 2026-08-05

**Status**: Draft

**Input**: User description: "Contas bancárias: saldo real calculado a partir de um livro-razão de movimentações (BankTransaction), extrato com saldo acumulado, aba de transações paginada, e transferência transacional entre contas com método de pagamento e centro de custo"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver o saldo real de cada conta (Priority: P1)

Um operador financeiro abre a lista de contas bancárias e vê, para cada conta, o saldo que ela
realmente tem hoje — não apenas o saldo com que ela foi aberta. O mesmo saldo real aparece no
detalhe da conta.

**Why this priority**: É o defeito mais grave hoje: a lista mostra o saldo de abertura como se
fosse o saldo atual. Um lojista que recebeu R$ 50.000 continua vendo o saldo inicial — a tela
mente sobre o dinheiro disponível. Nenhuma outra funcionalidade desta fatia faz sentido sem essa
correção primeiro.

**Independent Test**: Criar uma conta com saldo inicial de R$ 10.000, depois registrar (via
transferência ou pagamento de lançamento) uma entrada de R$ 5.000; a lista e o detalhe da conta
devem mostrar R$ 15.000, não R$ 10.000.

**Acceptance Scenarios**:

1. **Given** uma conta recém-criada com saldo inicial de R$ 10.000 e nenhuma outra movimentação,
   **When** o operador abre a lista de contas, **Then** o saldo exibido é R$ 10.000.
2. **Given** uma conta com saldo inicial de R$ 10.000 que recebeu uma transferência de entrada de
   R$ 5.000, **When** o operador abre a lista ou o detalhe da conta, **Then** o saldo exibido é
   R$ 15.000.
3. **Given** uma conta cujas movimentações somam um valor negativo, **When** o operador visualiza
   a lista, **Then** o saldo aparece destacado (cor de alerta) como negativo.

---

### User Story 2 - Consultar o extrato da conta com saldo acumulado (Priority: P2)

Um operador financeiro abre o detalhe de uma conta e consulta o **Histórico** (extrato) — cada
movimentação aparece com o saldo da conta logo após ela, da mais recente para a mais antiga, como
num extrato bancário de verdade.

**Why this priority**: É o que dá confiança ao operador de que o saldo mostrado (US1) está
correto e explicado — sem o extrato, o saldo é um número que ninguém consegue auditar.

**Independent Test**: Com uma conta que teve 3 movimentações em datas diferentes, abrir o
Histórico e conferir que o saldo acumulado de cada linha bate com a soma das movimentações até
aquele ponto, e que a movimentação mais antiga mostra um saldo igual ao valor dela mesma.

**Acceptance Scenarios**:

1. **Given** uma conta com movimentações em 3 datas diferentes, **When** o operador abre a aba
   Histórico, **Then** as movimentações aparecem da mais recente para a mais antiga, cada uma com
   o saldo acumulado correto até aquele ponto.
2. **Given** um extrato com mais movimentações do que cabem em uma página, **When** o operador
   navega entre páginas, **Then** o saldo acumulado de cada linha continua correto (não reinicia
   nem se recalcula errado por página).
3. **Given** o link direto `?view=historico` para uma conta, **When** o operador o acessa, **Then**
   a aba Histórico abre diretamente, sem precisar clicar na aba manualmente.

---

### User Story 3 - Consultar as transações da conta (Priority: P2)

Um operador financeiro abre a aba **Transações** do detalhe da conta e vê a lista analítica de
tudo que foi lançado naquela conta — usuário responsável, data de efetivação, descrição, tipo de
movimentação (entrada/saída) — com filtros por tipo e por período.

**Why this priority**: Complementa o extrato (US2) com uma visão mais detalhada, útil para
investigar uma movimentação específica.

**Independent Test**: Registrar movimentações de tipos diferentes numa conta, abrir a aba
Transações, filtrar por tipo e por período, e confirmar que só as movimentações compatíveis
aparecem.

**Acceptance Scenarios**:

1. **Given** uma conta com movimentações de entrada e saída, **When** o operador abre a aba
   Transações, **Then** vê todas elas, paginadas, com usuário/data/descrição.
2. **Given** a aba Transações aberta, **When** o operador aplica um filtro de tipo ou período,
   **Then** só as movimentações compatíveis com o filtro aparecem.
3. **Given** uma conta recém-criada sem nenhuma movimentação além do saldo inicial, **When** o
   operador atualiza a página (F5), **Then** a movimentação de saldo inicial continua lá.

---

### User Story 4 - Transferir dinheiro entre contas (Priority: P2)

Um operador financeiro abre o diálogo de Transferências a partir da tela de Lançamentos, escolhe
uma conta de saída e uma de entrada, informa valor, data, forma de pagamento, centro de custo e
descrição, e confirma. O dinheiro sai do saldo de uma conta e entra no saldo da outra, de forma
permanente.

**Why this priority**: É a funcionalidade de maior valor de negócio ainda pendente nesta área —
hoje a transferência não persiste (RN vindas do prompt de Lançamentos).

**Independent Test**: Transferir R$ 1.000 da conta A para a conta B; conferir que A perdeu
R$ 1.000, B ganhou R$ 1.000, ambas aparecem no extrato de cada conta, e o resultado sobrevive a um
F5.

**Acceptance Scenarios**:

1. **Given** duas contas da mesma organização, **When** o operador transfere R$ 1.000 de uma para
   a outra com todos os campos preenchidos, **Then** a conta de origem perde R$ 1.000, a de
   destino ganha R$ 1.000, e ambas as movimentações aparecem nos respectivos extratos.
2. **Given** o diálogo de transferência aberto, **When** o operador escolhe a mesma conta como
   origem e destino, **Then** a transferência é recusada com uma mensagem clara.
3. **Given** o diálogo de transferência aberto, **When** o operador tenta confirmar sem valor,
   sem data, ou com valor zero/negativo, **Then** a transferência é recusada.
4. **Given** um usuário sem permissão de escrita financeira, **When** ele tenta transferir,
   **Then** a ação é bloqueada.

---

### Edge Cases

- Conta recém-criada sem saldo inicial (R$ 0,00): saldo exibido é R$ 0,00, extrato e transações
  aparecem vazios (sem erro).
- Duas movimentações na mesma data: a ordem entre elas deve ser determinística e o saldo
  acumulado do extrato não pode ficar ambíguo.
- Duas transferências simultâneas envolvendo a mesma conta não podem corromper o saldo final —
  cada transferência é uma operação atômica e isolada.
- Buscar uma conta pelo nome do banco (não pelo apelido da conta) continua funcionando (RN-07
  preexistente).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST maintain an append-only ledger of balance-affecting movements for each
  bank account (opening balance, transfers, and — see FR-016 — financial entry payments), each
  movement recording: amount, effective date, type (opening/credit/debit), description, origin,
  and responsible user.
- **FR-002**: System MUST calculate an account's current balance as the signed sum of all its
  ledger movements (opening balance and credits add; debits subtract).
- **FR-003**: Creating a bank account with an opening balance greater than zero MUST automatically
  create the first ledger movement, dated on the account's opening date.
- **FR-004**: The account list MUST display each account's calculated current balance, not its
  opening balance.
- **FR-005**: The account detail page MUST provide a "Transações" view listing ledger movements
  (user, effective date, description, type), paginated server-side, filterable by movement type
  and by period.
- **FR-006**: The account detail page MUST provide a "Histórico" (statement) view listing
  movements from most recent to oldest, each showing the running balance immediately after it.
- **FR-007**: The running balance in the Histórico view MUST be correct across pages — it MUST NOT
  be computed only from the movements visible on the current page.
- **FR-008**: The existing `?view=historico` deep link MUST continue to open the Histórico tab
  directly.
- **FR-009**: Users MUST be able to transfer money between two bank accounts of their
  organization, specifying: source account, destination account, amount, date, payment method,
  cost center, and description.
- **FR-010**: A transfer MUST be recorded as a single atomic operation creating a debit movement
  on the source account and a credit movement on the destination account, same amount and date —
  if either half cannot be recorded, neither is recorded.
- **FR-011**: System MUST reject a transfer whose source and destination accounts are the same.
- **FR-012**: System MUST reject a transfer with a non-positive amount or a missing date.
- **FR-013**: System MUST reject a transfer referencing an account that does not exist or does not
  belong to the requesting organization.
- **FR-014**: Only users with financial write permission may create bank accounts or transfers;
  viewing balances, statements, and transactions requires only general read permission.
- **FR-015**: The bank selection field on the account form MUST persist a stable bank identifier,
  so reopening an existing account correctly re-selects the originally chosen bank.
- **FR-016**: System MUST create a ledger movement automatically whenever a financial entry
  payment is recorded, edited, or removed on an account — credit for a receivable entry, debit for
  a payable entry — kept idempotently in sync with the originating payment (including payments
  generated automatically when a sale order closes).
- **FR-017**: Deleting (soft-delete) a financial entry MUST reverse the ledger movements created
  from its payments, so the account balance no longer reflects the deleted entry; restoring the
  entry MUST reinstate them.
- **FR-018**: Negative account balances MUST be visually distinguished (warning/error styling) in
  the account list.
- **FR-019**: Account search MUST continue to match on account name OR bank name (RN-07,
  unchanged).
- **FR-020**: Once created, a transfer MUST NOT be editable or cancellable from the UI in this
  phase — correcting a mistaken transfer requires a new, opposite transfer.

### Key Entities *(include if feature involves data)*

- **Movimentação bancária (ledger movement)**: um lançamento imutável no livro-razão de uma
  conta — valor (sempre positivo), tipo (saldo inicial / crédito / débito, que dá o sinal), data
  de efetivação, descrição, origem (saldo inicial, pagamento de lançamento financeiro,
  transferência), responsável. Nunca é editado — só criado, e revertido quando sua origem é
  desfeita (FR-017).
- **Transferência bancária**: o registro de uma movimentação de dinheiro entre duas contas da
  mesma organização — conta de origem, conta de destino, valor, data, forma de pagamento, centro
  de custo, descrição. Gera exatamente duas movimentações de ledger vinculadas (débito na origem,
  crédito no destino).
- **Conta bancária** *(existente, estendida)*: ganha o saldo atual calculado (em vez do saldo de
  abertura estático) e um identificador estável de banco para o round-trip do formulário.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O saldo exibido na lista e no detalhe de uma conta é sempre igual à soma de todas
  as suas movimentações — verificável em 100% das contas, a qualquer momento.
- **SC-002**: Uma transferência concluída aparece refletida no saldo de ambas as contas
  imediatamente, sem precisar recarregar a página, e continua lá após um F5.
- **SC-003**: Percorrendo o extrato paginado de uma conta do início ao fim, o saldo acumulado da
  última linha (movimentação mais antiga) é igual ao valor daquela primeira movimentação.
- **SC-004**: Tentativas de transferência inválidas (mesma conta, valor zero/negativo, conta
  inexistente, campos obrigatórios ausentes) são recusadas antes de qualquer alteração de saldo,
  em 100% dos casos testados.
- **SC-005**: Reabrir o formulário de uma conta existente sempre mostra o banco originalmente
  selecionado, em 100% dos casos.
- **SC-006**: Um pagamento de lançamento financeiro numa conta X aparece no extrato da conta X
  em até o tempo de uma requisição normal (sem etapa manual adicional).

## Assumptions

- **Catálogo de bancos**: a conta passa a persistir um identificador estável de banco (código
  Febraban) além do nome; a lista de bancos em si continua sendo uma constante compartilhada no
  frontend — não vira uma tela de cadastro nova.
- **`branchIds` como pivot (`BankAccountBranch`)**: dívida técnica pré-existente e ortogonal a
  esta fatia — não é resolvida aqui.
- **Conciliação bancária / importação OFX**: fora de escopo desta fatia. O modelo do livro-razão
  reserva espaço para movimentações de origem "conciliação", mas nenhum fluxo de conciliação é
  entregue aqui.
- **Estratégia de cálculo do saldo** (agregação em tempo real vs. saldo materializado): decisão de
  implementação sem impacto no comportamento visível ao usuário — fica para a fase de
  planejamento técnico.
- Centros de custo e o módulo de Lançamentos financeiros já existem e são consumidos como estão
  (somente leitura pelo diálogo de transferência); nenhuma mudança é feita neles além do necessário
  para gerar movimentações (FR-016/FR-017).
