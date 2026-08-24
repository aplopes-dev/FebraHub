# Data Model: Contas bancárias — saldo real, extrato e transferência

Schema Postgres `erp`, `apps/erp/api/prisma/schema.prisma`. 2 models novos, 2 enums novos, 1
campo novo em `BankAccount` (já existente). Todos os models novos entram em
`TENANT_SCOPED_MODELS` (`shared/infra/prisma/tenant-scope.extension.ts`) na mesma migration —
ver `research.md` D2/D3 para o raciocínio por trás do cálculo de saldo/saldo acumulado, e D1
para a semântica de sincronização das movimentações de origem `financial_entry_payment`.

## `BankAccount` (existente, estendido)

| Campo | Tipo | Mudança |
|---|---|---|
| `bankCode` | `String` `@default("")` `@map("bank_code")` | **Novo.** Identificador estável do catálogo de bancos do frontend (`lib/bank-catalog.ts`, ver `research.md` D5) — resolve o round-trip do `Select` (FR-015). `bankName` (já existente) continua sendo o nome de exibição; os dois viajam juntos no create/update, mas só `bankCode` é usado para reabrir a seleção do formulário. |

Nenhum outro campo muda. `openingBalanceCents`/`openedAt` continuam existindo e continuam sendo
a fonte da movimentação `initial_balance` (RN-02/FR-003) — a diferença é que essa movimentação
passa a ser criada/ressincronizada pelo backend (`PrismaBankAccountRepository.save()`), não mais
pelo front.

Nova relação: `bankTransactions BankTransaction[]`.

## `BankTransactionKind` (enum novo)

```prisma
enum BankTransactionKind {
  initial_balance
  credit
  debit

  @@schema("erp")
}
```

`initial_balance` e `credit` somam ao saldo; `debit` subtrai. `amountCents` de toda
`BankTransaction` é sempre positivo — o sinal vem exclusivamente do `kind` (RN-03), nunca do
valor armazenado.

## `BankTransactionSourceType` (enum novo)

```prisma
enum BankTransactionSourceType {
  initial_balance
  financial_entry_payment
  bank_transfer
  reconciliation

  @@schema("erp")
}
```

`reconciliation` é reservado para a fase de conciliação bancária (fora de escopo desta fatia —
Assumption do `spec.md`); nenhum código desta fatia grava esse valor, mas o enum já reserva o
espaço para não exigir uma migration de enum quando aquela fase chegar.

## `BankTransaction` (model novo)

```prisma
model BankTransaction {
  id             String                     @id @default(uuid())
  organizationId String                     @map("organization_id")
  bankAccountId  String                     @map("bank_account_id")
  kind           BankTransactionKind
  description    String                     @default("")
  /// Sempre positivo — o sinal do movimento vem de `kind` (RN-03), nunca daqui.
  amountCents    Int                        @map("amount_cents")
  effectiveAt    DateTime                   @map("effective_at") @db.Date
  sourceType     BankTransactionSourceType  @map("source_type")
  /// id do agregado de origem: `BankAccount.id` (initial_balance), `BankTransfer.id`
  /// (bank_transfer) ou `FinancialEntry.id` (financial_entry_payment — não o id do
  /// pagamento individual, ver research.md D1).
  sourceId       String?                    @map("source_id")
  /// Vazio quando a origem não guarda usuário responsável (ver research.md D8).
  createdByName  String                     @default("") @map("created_by_name")
  createdAt      DateTime                   @default(now()) @map("created_at") @db.Timestamptz(3)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  bankAccount  BankAccount  @relation(fields: [bankAccountId, organizationId], references: [id, organizationId], onDelete: Cascade)

  @@unique([id, organizationId])
  @@index([organizationId, bankAccountId, effectiveAt])
  @@index([organizationId, sourceType, sourceId])
  @@map("bank_transactions")
  @@schema("erp")
}
```

**Validações/invariantes de domínio** (`BankTransaction` entity, `domain/entities/`):
- `amountCents > 0` sempre (violação é bug de código, não input do usuário — nenhuma rota HTTP
  aceita `amountCents` bruto para este model; é sempre derivado internamente).
- `effectiveAt` nunca nulo.
- Nenhum setter de update — a entidade só tem `create()`/`with()`, igual a
  `FinancialEntryAttachment` (comprovante, também imutável após criado).

**Ciclo de vida por `sourceType`** (ver `research.md` D1 para o detalhamento):
| `sourceType` | Criada quando | Apagada quando |
|---|---|---|
| `initial_balance` | `BankAccount` criada/editada com `openingBalanceCents > 0` | `openingBalanceCents` volta a 0 numa edição, ou a conta é excluída (soft-delete da conta **não** apaga a movimentação — o extrato de uma conta excluída continua consultável via a aba "Excluídas") |
| `bank_transfer` | `POST /v1/bank-transfers` (1 débito + 1 crédito, mesma transação) | Nunca — FR-020, transferência não é editável/cancelável |
| `financial_entry_payment` | `FinancialEntry.save()` com `bankAccountId` preenchido e (`payments[]` não vazio ou `paidCents > 0`) | `FinancialEntry.softDelete()`; recriada em `clearDeletedAt()` (restore) |

## `BankTransfer` (model novo)

```prisma
model BankTransfer {
  id                 String   @id @default(uuid())
  organizationId     String   @map("organization_id")
  fromBankAccountId  String   @map("from_bank_account_id")
  toBankAccountId    String   @map("to_bank_account_id")
  amountCents        Int      @map("amount_cents")
  effectiveAt        DateTime @map("effective_at") @db.Date
  /// Mesmo enum de aplicação de FinancialEntryPayment.paymentMethod (research.md D4) — sem FK,
  /// não há cadastro de formas de pagamento na API ainda.
  paymentMethod      String   @map("payment_method")
  costCenterId       String   @map("cost_center_id")
  description        String   @default("")
  createdByName      String   @default("") @map("created_by_name")
  createdAt          DateTime @default(now()) @map("created_at") @db.Timestamptz(3)

  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  fromBankAccount BankAccount  @relation("BankTransferFrom", fields: [fromBankAccountId, organizationId], references: [id, organizationId], onDelete: Restrict)
  toBankAccount   BankAccount  @relation("BankTransferTo", fields: [toBankAccountId, organizationId], references: [id, organizationId], onDelete: Restrict)
  costCenter      CostCenter   @relation(fields: [costCenterId, organizationId], references: [id, organizationId], onDelete: Restrict)

  @@unique([id, organizationId])
  @@index([organizationId, fromBankAccountId])
  @@index([organizationId, toBankAccountId])
  @@map("bank_transfers")
  @@schema("erp")
}
```

`onDelete: Restrict` nas 3 FKs — mesma postura de `ChartOfAccount.financialGroup` (não deixar
um registro referenciado por uma transferência sumir por baixo dela); na prática as contas e
centros de custo desta plataforma são **soft-delete**, então o `Restrict` só protege contra um
hard-delete acidental fora do fluxo normal.

**Validações de domínio** (`BankTransfer` entity):
- `fromBankAccountId !== toBankAccountId` (FR-011) → `BankTransferSameAccountError` (422).
- `amountCents > 0` (FR-012) → validado no DTO HTTP (`class-validator`, `@IsInt() @Min(1)`), não
  repetido no domínio (mesmo padrão do resto do módulo `finance` — validação de formato no DTO,
  domínio guarda invariantes de negócio).
- `effectiveAt` obrigatório (FR-012) → `@IsDateString()` no DTO.
- `paymentMethod` ∈ `FINANCIAL_ENTRY_PAYMENT_METHODS` (research.md D4) → `@IsIn(...)` no DTO.

**Efeito colateral obrigatório e atômico** (`CreateBankTransferUseCase`, dentro de
`prisma.scoped.$transaction`):
1. `assertBankAccountExists` para `fromBankAccountId` e `toBankAccountId` (reaproveita o helper
   já usado em `financial-entries`) → 404 (`BankAccountNotFoundError`) se algum não existir/for
   de outra organização/estiver excluído (FR-013).
2. `assertCostCenterExists` para `costCenterId` (mesmo helper de `financial-entries`) → 404
   (`CostCenterNotFoundError`) se inválido.
3. Rejeita mesma conta (`BankTransferSameAccountError`, 422) antes de tocar o banco.
4. Cria a linha `BankTransfer`.
5. Cria 2 `BankTransaction`: `kind=debit` em `fromBankAccountId`, `kind=credit` em
   `toBankAccountId`, ambas `sourceType=bank_transfer`, `sourceId=bankTransfer.id`, mesmo
   `amountCents`/`effectiveAt`/`createdByName`, descrição derivada
   ("Transferência enviada — …" / "Transferência recebida — …", preservando o texto que o mock
   já usava).

Se qualquer passo falhar, a transação inteira reverte — nenhuma metade da transferência fica
gravada (FR-010).

## Relações — diagrama textual

```
Organization 1──N BankAccount 1──N BankTransaction N──1 (kind, sourceType, sourceId)
                        │                    ▲
                        │                    │ sourceId (bank_transfer)
                        └── 1──N BankTransfer (fromBankAccount / toBankAccount) ──N──1 CostCenter
                        │
                        └── 1──N FinancialEntry ── (sourceId, financial_entry_payment) ──> BankTransaction
```

`BankTransaction.sourceId` **não é FK** (aponta para 3 agregados diferentes conforme
`sourceType` — `BankAccount`, `BankTransfer` ou `FinancialEntry`) — resolução por aplicação, não
por `@relation`, mesmo padrão já usado em `FinancialEntry.saleOrderId` (referência solta,
documentada como dívida pré-existente em `001-financial-entries`, aqui reaplicada
deliberadamente por ser a única forma de um campo polimórfico sem introduzir uma tabela de
junção só para isso — YAGNI).

## Migration

Uma migration única via `pnpm --filter @citybox/erp-api db:migrate:dev`:
- `ALTER TABLE erp.bank_accounts ADD COLUMN bank_code TEXT NOT NULL DEFAULT ''` (retrocompatível
  — contas existentes ficam com `bankCode=""`, o front trata como "banco não identificado" até o
  usuário reabrir e reselecionar, mesmo comportamento de hoje).
- `CREATE TYPE erp.bank_transaction_kind ...` / `CREATE TYPE erp.bank_transaction_source_type ...`
- `CREATE TABLE erp.bank_transactions (...)`
- `CREATE TABLE erp.bank_transfers (...)`

Sem backfill de dados: contas existentes sem nenhuma `BankTransaction` mostram
`currentBalanceCents = 0` até a próxima operação (edição da conta re-sincroniza a movimentação
de saldo inicial a partir de `openingBalanceCents`, que já está persistido) — **não** é um
backfill silencioso do saldo, é o efeito colateral natural de D1 aplicado a
`UpdateBankAccountUseCase`. Se isso for insuficiente (o operador precisa ver o saldo correto
*antes* de reabrir/salvar cada conta), um script standalone de backfill (molde
`scripts/backfill-financial-entry-allocations.ts`) fica registrado como tarefa candidata em
`tasks.md` — decisão final na fase de tasks, não bloqueia o plano.
