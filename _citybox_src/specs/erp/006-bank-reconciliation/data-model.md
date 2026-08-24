# Data Model — Conciliação bancária

Fase 1 do `/speckit-plan`. Três models novos, `id`/convenções alinhadas ao restante de
`finance/*` (ver `research.md` D12). Dinheiro em centavos (`Int`). Duas alterações pontuais em
models já existentes de `finance/financial-entries` (D4/D5 de `research.md`) — sem migration nova
para elas (são métodos de domínio + literal de união TS, não colunas).

## 1. `BankStatement` (novo)

```prisma
enum BankStatementStatus {
  not_reconciled
  partially_reconciled
  reconciled

  @@schema("erp")
}

/// Extrato bancário importado em OFX — o arquivo original fica no MinIO
/// (bucket `erp`, `BankReconciliationObjectKeyPolicy`), nunca no Postgres.
/// `status`/contadores são recalculados a cada ação sobre suas transações
/// (mesma convenção de `FinancialEntry.status`/`paidCents` — cache derivado,
/// nunca aceito bruto do cliente).
model BankStatement {
  id             String   @id @default(uuid())
  organizationId String   @map("organization_id")
  /// CORRIGIDO 2026-08-14 (research.md D24): era documentado aqui como
  /// obrigatório, mas a `007-financeiro-ajustes-ui` FR-007 tornou o campo
  /// opcional — `null` quando o código do banco do arquivo não bate com
  /// exatamente 1 conta ativa da organização. Conciliar exige conta definida
  /// (FR-042/D23); a busca manual funciona mesmo com `null` (D19).
  ///
  /// REVISTO 2026-08-14, 2ª rodada (research.md D26, FR-001): a importação
  /// voltou a **exigir** a conta, então nenhum extrato novo nasce com `null`.
  /// A coluna **continua nullable de propósito** — as linhas importadas durante
  /// a janela de conta opcional existem, precisam ser lidas e reparadas
  /// (`PATCH .../bank-account`). A obrigatoriedade vive no use case de
  /// importação, não no schema: tornar a coluna `String` exigiria backfill e
  /// quebraria justamente os extratos que a FR-042 existe para resgatar.
  bankAccountId  String?  @map("bank_account_id")

  bankName      String   @default("") @map("bank_name")
  bankCode      String   @default("") @map("bank_code")
  branchNumber  String   @default("") @map("branch_number")
  accountNumber String   @default("") @map("account_number")
  periodStart   DateTime @map("period_start") @db.Date
  periodEnd     DateTime @map("period_end") @db.Date

  status BankStatementStatus @default(not_reconciled)

  /// Cache derivado — recalculado a cada ação de conciliar/excluir/desfazer
  /// sobre as transações do extrato (FR-022). Evita um COUNT a cada listagem.
  pendingCount   Int @default(0) @map("pending_count")
  reconciledCount Int @default(0) @map("reconciled_count")
  discardedCount Int @default(0) @map("discarded_count")

  fileName      String @map("file_name")
  objectKey     String @map("object_key")
  importedByName String @default("") @map("imported_by_name")

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)

  organization Organization                @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  bankAccount  BankAccount                 @relation(fields: [bankAccountId, organizationId], references: [id, organizationId], onDelete: Restrict)
  transactions BankStatementTransaction[]

  @@unique([id, organizationId])
  @@index([organizationId, bankAccountId, createdAt])
  @@map("bank_statements")
  @@schema("erp")
}
```

- `onDelete: Restrict` na conta bancária: `bank-accounts` não tem hoje uma exclusão física de
  `BankAccount` (só `deletedAt`/`softDelete` — confirmado em `delete-bank-account.use-case.ts`), então
  `Restrict` é defensivo (nunca deveria disparar), preferível a `Cascade` apagar histórico de
  conciliação silenciosamente caso isso mude no futuro.
- Sem `deletedAt`: extratos importados não são excluíveis (RN-02 — "o histórico dos importados fica
  disponível"; nenhum FR pede exclusão de extrato, só de transação individual).

## 2. `BankStatementTransaction` (novo)

```prisma
enum BankStatementTransactionStatus {
  pending
  reconciled
  discarded

  @@schema("erp")
}

/// Uma linha extraída do OFX. `dedupeKey` (não `fitId` cru) é a chave real de
/// unicidade — ver research.md D11 (fallback de hash quando FITID vem vazio
/// ou é instável entre reimportações do mesmo banco).
model BankStatementTransaction {
  id              String @id @default(uuid())
  organizationId  String @map("organization_id")
  bankStatementId String @map("bank_statement_id")
  bankAccountId   String @map("bank_account_id") // denormalizado — evita join no dedupe/matching

  fitId    String @default("") @map("fit_id")
  dedupeKey String @map("dedupe_key")

  postedAt DateTime @map("posted_at") @db.Date
  /// Sempre positivo — o sinal vem de `kind`, nunca daqui (mesma convenção de
  /// `BankTransaction.amountCents`).
  amountCents Int                     @map("amount_cents")
  kind        BankStatementTransactionKind
  transactionType String @default("") @map("transaction_type") // OFX TRNTYPE cru, só exibição
  memo            String @default("")

  status       BankStatementTransactionStatus @default(pending)
  reconciledAt DateTime? @map("reconciled_at") @db.Timestamptz(3)
  discardedAt  DateTime? @map("discarded_at") @db.Timestamptz(3)

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)

  organization  Organization        @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  bankStatement BankStatement       @relation(fields: [bankStatementId, organizationId], references: [id, organizationId], onDelete: Cascade)
  matches       BankStatementMatch[]

  @@unique([id, organizationId])
  @@unique([bankAccountId, dedupeKey]) // FR-007/FR-021/RN-21 — dedupe por conta, não por extrato
  @@index([organizationId, bankStatementId, status])
  @@map("bank_statement_transactions")
  @@schema("erp")
}

enum BankStatementTransactionKind {
  credit // entrada — verde, RN-07
  debit  // saída — vermelho, RN-07

  @@schema("erp")
}
```

- `bankAccountId` denormalizado (também está em `bankStatement.bankAccountId`): o dedupe
  (`@@unique([bankAccountId, dedupeKey])`) e a query de candidatos do matcher filtram por conta
  diretamente, sem precisar de join com `BankStatement` a cada checagem — mesmo raciocínio de
  denormalização já usado em `FinancialEntry.bankAccountId` (não deriva de outro lugar a cada leitura).
- Sem coluna de "divergência de valor": é classificação calculada em tempo de consulta pelo
  `match-suggester` (research.md D8), não estado persistido — nenhuma transação muda de forma só
  porque um lançamento parecido existe ou deixa de existir.

## 3. `BankStatementMatch` (novo)

```prisma
/// Vínculo N:1 transação↔lançamento (N lançamentos podem casar com 1
/// transação — repasse agrupado, FR-017). Existe só enquanto a conciliação
/// está ativa — desfazer é hard delete (research.md D6), não soft-delete.
model BankStatementMatch {
  id             String @id @default(uuid())
  organizationId String @map("organization_id")

  bankStatementTransactionId String @map("bank_statement_transaction_id")
  financialEntryId           String @map("financial_entry_id")
  /// id do `FinancialEntryPayment` criado por esta conciliação (research.md
  /// D4) — permite `removePayment(id)` exato ao desfazer, sem heurística de
  /// "o pagamento mais recente". Sem `@relation` formal para
  /// `FinancialEntryPayment` (value object embutido em `FinancialEntry.payments`,
  /// sem tabela própria de linha — ver financial-entry-payment.entity.ts).
  financialEntryPaymentId String @map("financial_entry_payment_id")
  amountCents             Int    @map("amount_cents")
  /// NOVO 2026-08-14 (research.md D22) — conta bancária que o lançamento tinha
  /// ANTES desta conciliação, quando ela diferia da conta do extrato. `null` no
  /// caso comum (contas já iguais). Existe só para o `undo` restaurar a conta
  /// original (FR-030) sem heurística — mesma razão de `financialEntryPaymentId`.
  previousBankAccountId String? @map("previous_bank_account_id")

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)

  organization Organization              @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  transaction  BankStatementTransaction  @relation(fields: [bankStatementTransactionId, organizationId], references: [id, organizationId], onDelete: Cascade)
  financialEntry FinancialEntry          @relation(fields: [financialEntryId, organizationId], references: [id, organizationId], onDelete: Restrict)

  @@unique([bankStatementTransactionId, financialEntryId])
  @@unique([id, organizationId])
  @@index([organizationId, financialEntryId]) // FR-033 — excluir da elegibilidade
  @@map("bank_statement_matches")
  @@schema("erp")
}
```

- `onDelete: Restrict` em `financialEntryId`: um lançamento conciliado não pode ser apagado
  fisicamente enquanto o vínculo existir (não deveria nunca ocorrer — `FinancialEntry` só tem
  soft-delete — mas `Restrict` documenta a invariante explicitamente).
- **Alteração necessária em `FinancialEntry`** (`schema.prisma`): adicionar a relação inversa
  `bankStatementMatches BankStatementMatch[]` (Prisma exige o lado inverso declarado para uma relação
  com `@relation` nomeada por campos escalares explícitos). Nenhuma coluna nova em `FinancialEntry`.
- **Migration 2026-08-14 (D22)**: `previous_bank_account_id` entra como coluna **nullable**, sem
  default e sem backfill — todas as conciliações existentes foram feitas sob a regra antiga (conta
  travada), em que a conta do lançamento já era a do extrato; `null` descreve corretamente esse
  histórico. Sem FK formal para `BankAccount`: é um valor histórico de reversão, não uma referência
  viva — uma conta desativada depois da conciliação não deve bloquear o `undo`. Requer gate
  `database-reviewer` antes da implementação (Constitution V).
- **`financialEntryPaymentId` para lançamento `paid` (research.md D16, 2026-08-11)**: quando a
  conciliação vincula um lançamento já `paid` (busca manual, sem `addPayment` novo), este campo
  referencia o `FinancialEntryPayment` **já existente** do lançamento (não um recém-criado) — exige
  `entry.payments.length === 1` no momento da conciliação; nenhuma coluna/índice novo, o campo já
  era `String` livre o suficiente para os dois casos.

## 4. Alterações em `finance/financial-entries` (sem migration — domínio + TS)

### `FinancialEntry` (entidade — `domain/entities/financial-entry.entity.ts`)

Dois métodos novos, ver `research.md` D4 — assinatura completa:

```ts
/** Permitido mesmo em lançamento somente-leitura (vinculado a venda) — só
 *  acrescenta uma linha de pagamento, nunca reescreve os demais campos.
 *  Usado por 006-bank-reconciliation ao conciliar (FR-029/FR-021). */
addPayment(payment: FinancialEntryPaymentInput): FinancialEntry;

/** Remove uma linha de pagamento por id — usado por 006-bank-reconciliation
 *  ao desfazer uma conciliação (FR-020/FR-030). Lança se o id não existir
 *  entre os pagamentos atuais (invariante: só desfaz o que existe). */
removePayment(paymentId: string): FinancialEntry;
```

Ambos recalculam `paidCents`/`status` via a mesma `recomputeAggregates` já usada por `create()`/
`update()`, e retornam nova instância (`FinancialEntry.with(...)`) — imutável, mesmo padrão do resto
da entidade.

### `FinancialEntryPayment` (`domain/entities/financial-entry-payment.entity.ts`)

```ts
export const FINANCIAL_ENTRY_PAYMENT_METHODS = [
  'dinheiro', 'pix', 'debito', 'credito', 'boleto', 'deposito', 'transferencia',
  'conciliacao_bancaria', // NOVO — research.md D5
] as const;
```

Coluna Postgres (`payment_method`) já é `String` livre — sem migration, só a lista de validação em
TS. Pagamentos criados por `006-bank-reconciliation` sempre usam esse valor.

### `FinancialEntryListCriteria` (`domain/repositories/financial-entry.repository.interface.ts`)

Novos campos opcionais (research.md D17, sem migration — só filtro Prisma sobre colunas/relações já
existentes): `paidFrom?: Date`/`paidTo?: Date` (sobre `payments.some.paidAt`), `paymentMethod?:
string`/`cardBrand?: string` (sobre `payments.some`), `supplierId?: string` (coluna já existe em
`FinancialEntry`, só faltava no filtro de listagem — `customerId` já existia). Consumidos pelo novo
`search-eligible-entries` use case de `bank-reconciliation` (FR-038); ficam disponíveis também para a
listagem geral de `financial-entries`, sem uso adicional nesta entrega.

## 5. Tipos internos do parser puro (não persistidos)

`domain/services/ofx-parser.ts` (research.md D10):

```ts
export type OfxParsedTransaction = {
  fitId: string;         // "" quando ausente no arquivo
  postedAt: Date;
  amountCents: number;   // sinal preservado do TRNAMT original (negativo = débito)
  transactionType: string; // TRNTYPE cru
  memo: string;           // já decodificado (charset resolvido antes do parse)
};

export type OfxParsedStatement = {
  bankCode: string;
  branchNumber: string;
  accountNumber: string;
  periodStart: Date;
  periodEnd: Date;
  transactions: OfxParsedTransaction[];
};

export type OfxParseError =
  | { kind: 'invalid_format'; reason: string }
  | { kind: 'unsupported_encoding'; declared: string };

/** Função pura — sem Prisma, sem NestJS, sem I/O de rede/banco (usa `ofx-js`
 *  + `iconv-lite`, que também não fazem I/O). Lança apenas em falha de
 *  parsing/estrutura — arquivo malformado é responsabilidade do chamador
 *  transformar em 422 (FR-002). */
export function parseOfxFile(buffer: Buffer): OfxParsedStatement;
```

`domain/services/match-suggester.ts` (research.md D8):

```ts
export type MatchCandidate = {
  financialEntryId: string;
  openBalanceCents: number; // amountCents - paidCents no momento da consulta
  dueDate: Date;
  description: string;
};

export type MatchSuggestionResult =
  | { kind: 'exact'; candidates: MatchCandidate[] } // ordenados por confiança (data, depois texto)
  | { kind: 'value_divergence'; candidates: MatchCandidate[] } // FR-031 — valor diferente, mesma janela
  | { kind: 'none' };

/** Função pura. `transactionAmountCents` já em valor absoluto; `candidates`
 *  já filtrado pelo repositório (mesma conta, sinal compatível, saldo aberto
 *  > 0, fora de qualquer BankStatementMatch ativo — FR-033). */
export function suggestMatches(
  transactionAmountCents: number,
  transactionPostedAt: Date,
  transactionMemo: string,
  candidates: readonly MatchCandidate[],
): MatchSuggestionResult;
```

## 6. Migration

Uma única migration Prisma (`db:migrate:dev`), aditiva: 3 tabelas novas + 2 enums novos
(`BankStatementStatus`, `BankStatementTransactionStatus`, `BankStatementTransactionKind`) + a relação
inversa em `FinancialEntry` (sem coluna, só o array de relação no schema). Nome sugerido:
`add_bank_reconciliation`. Nenhuma sobreposição de nome de coluna com migrations paralelas conhecidas
(`005` mexeu em `SaleOrderPayment`/`FinancialEntry` com campos próprios do motor de recebíveis; `002`
já entregue). Adicionar os três models novos a `TENANT_SCOPED_MODELS`
(`shared/infra/prisma/tenant-scope.extension.ts`) na mesma operação (regra do projeto).
