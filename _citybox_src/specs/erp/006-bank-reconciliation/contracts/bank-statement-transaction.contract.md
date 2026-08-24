# Contrato — Transações de um extrato (`/v1/bank-statements/:id/transactions`)

Permissões: leitura `org.view`; escrita `store.finance.manage` (FR-025). `404` em qualquer rota se
`:id` (extrato) não existir na organização ativa (FR-026).

## `GET /v1/bank-statements/:id/transactions`

Lista paginada, separada por grupo (FR-012/FR-023).

**Query**: `page`, `perPage`, `status` (`pending|reconciled|discarded`, obrigatório — a UI sempre
consulta uma aba por vez), `search?` (memo/descrição, debounce 400ms no cliente), `postedFrom?`/
`postedTo?` (`yyyy-MM-dd`, **novo — FR-023/FR-035, decisão de `/speckit-clarify` 2026-08-10**:
filtra por `postedAt`, a data em que o banco processou a transação; rótulo na UI é "Período", nunca
"vencimento" — a transação do extrato não tem data de vencimento).

**Sucesso — `200`**:
```json
{
  "data": [
    {
      "id": "uuid",
      "postedAt": "2026-07-05",
      "amountCents": 15000,
      "kind": "credit",
      "transactionType": "XFER",
      "memo": "TED RECEBIDA - JOAO SILVA",
      "status": "pending",
      "reconciledAt": null,
      "matches": []
    }
  ],
  "meta": { "page": 1, "perPage": 10, "total": 20, "totalPages": 2 }
}
```
`kind: "credit"` → renderiza em verde; `"debit"` → vermelho (RN-07/FR-013). `matches` presente e
populado (`[{ financialEntryId, amountCents }]`) só quando `status: "reconciled"`.

## `GET /v1/bank-statements/:id/transactions/:txId/suggestions`

Sugestão automática (FR-014/FR-031, decisão de `/speckit-clarify` sobre candidatos múltiplos).

**Sucesso — `200`**:
```json
{
  "kind": "exact",
  "candidates": [
    { "financialEntryId": "uuid", "openBalanceCents": 15000, "dueDate": "2026-07-05", "description": "Recebível venda #1234", "confidence": 0.94 },
    { "financialEntryId": "uuid", "openBalanceCents": 15000, "dueDate": "2026-07-04", "description": "Recebível venda #1198", "confidence": 0.81 }
  ]
}
```
`kind` também pode ser `"value_divergence"` (candidatos com valor diferente — FR-031, indicador de
divergência, não conciliáveis diretamente por este endpoint) ou `"none"` (nenhum candidato —
caminho de busca manual, FR-016). `confidence` é só para ordenação/exibição — nunca usado como
condição de conciliar-sozinho no backend (o clique do operador é sempre explícito).

## `GET /v1/bank-statements/:id/transactions/:txId/eligible-entries`

**Novo — decisão de `/speckit-clarify` 2026-08-11, research.md D17.** Busca manual/soma unificada
(FR-016/017/036/037/038), substitui a chamada direta do cliente a `GET /v1/financial-entries` (essa
chamada filtrava `status=pending`, um bug — status deixou de ser critério de elegibilidade, D16).

**Query**: `page`, `perPage`, `search?` (descrição/parte), `periodFrom?`/`periodTo?` (`yyyy-MM-dd`),
`periodType?` (`competence|due|paid`, um ou mais — "Buscar pelas datas de" do FR-038, default
quando ausente: filtra pelas três se `periodFrom`/`periodTo` vier preenchido sem `periodType`),
`chartOfAccountId?` (categoria), `customerId?`/`supplierId?` (fornecedor — mutuamente exclusivos,
mesma regra do domínio de `FinancialEntry`), `paymentMethod?`, `cardBrand?` (bandeira).

**ALTERADO 2026-08-14 (research.md D19, FR-037 revogada)**: `bankAccountId?` passa a ser query param
opcional. Resolução no servidor: `input.bankAccountId ?? bankStatement.bankAccountId ?? undefined` —
ou seja, o cliente pode informar outra conta da organização, e omitir o parâmetro mantém o default
útil (a conta do extrato). Quando ambos são nulos (extrato sem conta resolvida), a busca varre todas
as contas da organização, comportamento que o use case **já** tinha
(`search-eligible-entries.use-case.ts:68`). A validação de que a conta pertence à organização ativa
continua no servidor — o `organizationId` nunca vem do cliente.

**Sucesso — `200`**:
```json
{
  "data": [
    {
      "financialEntryId": "uuid",
      "status": "pending",
      "eligibleAmountCents": 15000,
      "dueDate": "2026-07-05",
      "competenceDate": "2026-07-01",
      "paidAt": null,
      "description": "Recebível venda #1234",
      "categoryName": "Faturamento com serviços"
    }
  ],
  "meta": { "page": 1, "perPage": 20, "total": 3, "totalPages": 1 }
}
```
`eligibleAmountCents`: para `status: "pending"`, saldo em aberto (`amountCents - paidCents`); para
`status: "paid"`, o `amountCents` total do lançamento (D16 — assume pagamento único). Nunca inclui
lançamento com `BankStatementMatch` ativo (FR-033, checagem explícita aqui — deixou de ser implícita
por status desde que `paid` passou a ser elegível).

## `POST /v1/bank-statements/:id/transactions/:txId/reconcile`

Conciliar — cobre sugestão (1 id), busca manual (1 id) e soma de N lançamentos (N ids), FR-015/016/017
(research.md D7, um único fluxo). **2026-08-11 (research.md D16)**: lançamento `pending` recebe um
`FinancialEntryPayment` novo pelo saldo em aberto (comportamento original); lançamento `paid` só
ganha um `BankStatementMatch` vinculado ao seu pagamento existente — sem `addPayment`, sem duplicar
`BankTransaction` (a movimentação já existe desde que o pagamento original foi registrado).

**Corpo**: `{ "financialEntryIds": ["uuid", "uuid"] }`.

**Validações → erro**:
| Condição | Status | Mensagem |
|---|---|---|
| Transação não está `pending` | 409 | "Esta transação já foi tratada" |
| Algum `financialEntryId` não existe/não é da organização | 404 | "Lançamento não encontrado" |
| Algum lançamento já tem `BankStatementMatch` ativo (FR-033) | 422 | "Lançamento já está conciliado com outra transação" |
| Lançamento `paid` com mais de 1 `FinancialEntryPayment` (D16 — caso não tratado nesta entrega) | 422 | "Não foi possível identificar qual pagamento vincular a este lançamento" |
| **Lançamento `paid` cuja `bankAccountId` difere da conta do extrato** — NOVO 2026-08-14, FR-043/D25 | 422 | "Este lançamento está em outra conta bancária e já está pago — não é possível conciliá-lo com este extrato" |
| `sum(eligibleAmountCents dos ids)` ≠ `amountCents` da transação | 422 | "A soma dos lançamentos selecionados não fecha com o valor da transação" |
| **Extrato sem conta bancária definida** (`bankAccountId` nulo) — NOVO 2026-08-14, FR-042/D23 | 422 | "Defina a conta bancária deste extrato antes de conciliar" |

**Sucesso — `200`**: transação atualizada (mesmo shape da listagem, `status: "reconciled"`,
`matches` preenchido) + `bankStatement` com `status`/contadores recalculados (FR-022).

**NOVO 2026-08-14 (research.md D22, FR-029)** — conta da movimentação: para cada lançamento
`pending` cuja `bankAccountId` difira da conta do extrato, o servidor grava a conta original em
`BankStatementMatch.previousBankAccountId`, troca a conta do lançamento para a do extrato e só então
chama `addPayment` — de modo que a `BankTransaction` projetada por `syncLedgerMovements` nasça na
conta do extrato. Quando as contas já coincidem, `previousBankAccountId` fica `null` e nada muda em
relação ao comportamento atual. O ramo `paid` (D16) não gera movimentação e, portanto, **não** troca
a conta do lançamento — e, justamente por isso, **só aceita lançamento cuja conta já seja a do
extrato** (FR-043/D25): conciliar um `paid` de outra conta não moveria saldo em lugar nenhum, e a
conta do extrato ficaria sem refletir a transação. O lançamento continua aparecendo em
`eligible-entries` (a busca é para investigar); a recusa acontece só aqui, na confirmação.

## `POST /v1/bank-statements/:id/transactions/:txId/reconcile/undo`

Desfazer conciliação (FR-020/FR-030). `409` se a transação não estiver `reconciled`. Sucesso `200`:
transação volta a `status: "pending"`, `matches: []`; `bankStatement` recalculado.

**NOVO 2026-08-14 (research.md D22, FR-030)**: para cada `match` com `previousBankAccountId` não
nulo, o undo MUST restaurar essa conta no lançamento antes de remover a movimentação — a reversão
tem de deixar o saldo das **duas** contas (a do extrato e a original) no valor anterior à
conciliação.

## `POST /v1/bank-statements/:id/transactions/:txId/discard`

Excluir da conciliação (FR-019). `422` se já `discarded` ou `reconciled` (precisa desfazer primeiro
— mesmo código de erro de precondição de `reconcile-transaction`/`undo`). Sucesso `200`:
`status: "discarded"`.

## `POST /v1/bank-statements/:id/transactions/:txId/create-entry`

Criar lançamento a partir da transação — já nasce conciliado (FR-018/research.md D9). `409` se a
transação não estiver `pending`.

**Corpo** (pré-preenchido no cliente a partir da transação, mas **validado no servidor**, nunca
confiado cru — mesmo princípio de `FinancialEntry.create`):
```json
{
  "description": "TED RECEBIDA - JOAO SILVA",
  "partyName": "",
  "customerId": null,
  "supplierId": null,
  "categoryName": "",
  "note": "",
  "bankAccountId": "uuid",
  "chartOfAccountId": "uuid",
  "costCenterId": "uuid"
}
```
`operation`/`amountCents`/`dueDate`/`competenceDate` **não vão no corpo** — o servidor sempre deriva
esses campos da transação (`kind` → `operation`: `credit → receivable`, `debit → payable`;
`amountCents`/`postedAt` → valor e datas), nunca do cliente, para não permitir um lançamento nascer
com valor/sinal diferente do que gerou a conciliação. O formulário só edita campos descritivos
(`description`/`partyName`/`categoryName`/`note`) + `bankAccountId`/`chartOfAccountId`/
`costCenterId` — **adições a este contrato, fora do desenho original**:
- `chartOfAccountId`/`costCenterId`: `FinancialEntry.create()` exige ao menos uma linha de rateio
  (`assertAllocationsMatchTotal`, regra introduzida depois do desenho inicial desta feature), então
  a criação a partir de uma transação gera 1 linha de rateio com 100% do valor nas duas contas
  informadas. `404` se não existirem na organização.
- `bankAccountId` (**novo, decisão de `/speckit-clarify` 2026-08-10, research.md D14**): o cliente
  pré-preenche com a conta bancária do extrato, mas o campo é editável — nem sempre o arquivo OFX
  identifica a conta com certeza (mesmo raciocínio de `BankStatement.bankAccountId` opcional,
  `007-financeiro-ajustes-ui` FR-007). `404` se a conta informada não existir/não pertencer à
  organização ativa. Diferente de `chartOfAccountId`/`costCenterId`, trocar a conta **não** afeta o
  valor/data/sinal travados nem invalida a conciliação com a transação de origem — é só a conta a
  que o novo lançamento fica associado.
- `customerId`/`supplierId` (**novos, decisão de `/speckit-clarify` 2026-08-14, research.md D27,
  FR-044**): o vínculo com o cadastro real. **Mutuamente exclusivos** — informar os dois é `422`,
  mesma invariante que `FinancialEntry` já valida (`customerId && supplierId` → erro de domínio).
  `404` se o id não existir/não pertencer à organização ativa. Nenhuma coluna nova: `FinancialEntry`
  já tem `customer_id`/`supplier_id` como FKs desde o desenho original — o use case simplesmente
  nunca os preenchia, gravando só o `partyName` de texto livre. `partyName` **permanece** como rótulo
  denormalizado (é o que a listagem exibe sem join) e passa a ser derivado do cadastro escolhido, não
  digitado pelo operador. O estágio de CRM do cliente (`lead`/`opportunity`/`active`/`inactive`)
  **não** é critério de elegibilidade (FR-044).

**Sucesso — `201`**: `{ "data": { /* FinancialEntry criado, já com payments[0], allocations[0] e
status: "paid" */ } }` + `transaction` (mesmo shape da listagem, `status: "reconciled"`, `matches`
preenchido) + `bankStatement` recalculado.
