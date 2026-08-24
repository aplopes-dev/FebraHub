# Data Model: Lançamentos financeiros ponta a ponta

Schema Postgres `erp` (banco `citybox_platform`), `apps/erp/api/prisma/schema.prisma`. Todas as
tabelas novas/alteradas são tenant-scoped por `organizationId` e entram em
`TENANT_SCOPED_MODELS` (`shared/infra/prisma/tenant-scope.extension.ts`). IDs seguem o padrão já
usado no módulo `finance`: `@default(uuid())` (não `citybox_uuid_v7()` — decisão já registrada
no `api/AGENTS.md` §10 para tabelas deste módulo).

## FinancialEntry (ALTERADO)

Agregado raiz. Um lançamento de contas a pagar ou a receber.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String @id @default(uuid())` | inalterado |
| `organizationId` | `String` | inalterado — tenant scope |
| `operation` | `FinancialEntryOperation` (`receivable`\|`payable`) | inalterado |
| `description` | `String @default("")` | inalterado |
| `amountCents` | `Int` | inalterado — valor base |
| **`feesCents`** | `Int @default(0)` | **NOVO** — taxa |
| **`finesCents`** | `Int @default(0)` | **NOVO** — multa |
| `paidCents` | `Int @default(0)` | **semântica alterada**: deixa de aceitar valor bruto do cliente; recalculado no `save()` como `sum(payments[].amountCents)` |
| **`status`** | `FinancialEntryStatus` (`pending`\|`paid`) | **NOVO**, coluna persistida, recalculada no `save()` (D5) |
| `competenceDate` | `DateTime @db.Date` | inalterado |
| `dueDate` | `DateTime @db.Date` | inalterado |
| `partyName` | `String @default("")` | inalterado — nome cacheado do cliente/fornecedor |
| `customerId` | `String?` | **ganha `@relation` real** (D4), `onDelete: SetNull` |
| **`supplierId`** | `String?` | **NOVO**, `@relation` real, `onDelete: SetNull` — mutuamente exclusivo com `customerId` (validado na camada de aplicação, não no schema) |
| `bankAccountId` | `String?` | inalterado |
| `saleOrderId` | `String?` | inalterado, sem FK (D4) — não editável pelo formulário; quando preenchido, **todo o lançamento fica somente-leitura** (FR-016) |
| `categoryName` | `String @default("")` | **mantido, mas morto** (D6) — nenhum código novo lê/escreve |
| **`note`** | `String @default("")` | **NOVO** — observação livre |
| `deletedAt` | `DateTime? @db.Timestamptz(3)` | inalterado — soft-delete |
| `createdAt`/`updatedAt` | inalterado | |

Relações novas: `payments FinancialEntryPayment[]`, `allocations FinancialEntryAllocation[]`,
`attachments FinancialEntryAttachment[]`, `supplier Supplier? @relation(...)`.

Índices novos: `@@index([organizationId, status])` (filtro FR-018/FR-008).

**Campo computado, não persistido**: `totalCents = amountCents + feesCents + finesCents` (D6) —
calculado no presenter/entidade, nunca gravado.

**Regra de estado — somente-leitura por venda** (FR-016): se `saleOrderId != null`, qualquer
tentativa de `update` lança `SaleOrderLinkedEntryForbiddenError` (403). `delete`/`restore`
continuam permitidos (RN-12/FR-017 não mudam).

**Transição de status** (FR-008): `pending → paid` quando `paidCents >= totalCents`; volta a
`pending` se uma edição reduzir o total de pagamentos abaixo do total. Recalculado a cada
`save()`, nunca setado diretamente por DTO.

---

## FinancialEntryPayment (NOVO)

Uma linha de rateio de pagamento — parte do valor efetivamente recebida/paga numa forma
específica. Substituída por completo a cada `save()` do lançamento (D1) — sem identidade estável
para o cliente entre saves.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String @id @default(uuid())` | |
| `organizationId` | `String` | tenant scope |
| `financialEntryId` | `String` | FK `FinancialEntry(id, organizationId)`, `onDelete: Cascade` |
| `amountCents` | `Int` | > 0 |
| `paidAt` | `DateTime @db.Date` | data do pagamento/recebimento |
| `paymentMethod` | `String` | enum de aplicação fixo (D11): `dinheiro`\|`pix`\|`debito`\|`credito`\|`boleto`\|`deposito`\|`transferencia` |
| `cardBrand` | `String?` | livre, sem cadastro (D12) |
| `createdAt`/`updatedAt` | | |

`@@unique([id, organizationId])`, `@@map("financial_entry_payments")`, `@@schema("erp")`.

**Validação**: advisory — soma pode ser menor, igual ou maior que o total (RN-18/FR-007); nunca
bloqueia o save. Alimenta `FinancialEntry.paidCents`/`.status` (D5).

---

## FinancialEntryAllocation (NOVO)

Uma linha de rateio por categoria financeira — fatia do valor total atribuída a uma conta do
plano de contas + um centro de custo. Alimenta a DRE. Substituída por completo a cada `save()`
(D1).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String @id @default(uuid())` | |
| `organizationId` | `String` | tenant scope |
| `financialEntryId` | `String` | FK `FinancialEntry(id, organizationId)`, `onDelete: Cascade` |
| `chartOfAccountId` | `String` | FK `ChartOfAccount(id, organizationId)`, `onDelete: Restrict` (mesmo padrão de `ChartOfAccount → FinancialGroup`) |
| `costCenterId` | `String` | **obrigatório** (FR-010 — clarificação), FK `CostCenter(id, organizationId)`, `onDelete: Restrict` |
| `amountCents` | `Int` | |
| `percentage` | `Decimal @db.Decimal(7,4)` | equivalente a `amountCents / totalCents * 100` |
| `createdAt`/`updatedAt` | | |

`@@map("financial_entry_allocations")`, `@@schema("erp")`.

**Validação obrigatória no save (FR-011)**: `sum(allocations[].amountCents)` deve fechar com
`FinancialEntry.totalCents`, tolerância de 1 centavo (R$ 0,01). Fora da tolerância →
`AllocationMismatchError` (422). Lista vazia com `totalCents > 0` também é rejeitada (edge case
do spec).

**Validação de pertencimento (FR-012)**: `chartOfAccountId` e `costCenterId` de cada linha devem
existir e pertencer à `organizationId` do lançamento → `ChartOfAccountNotFoundError`/
`CostCenterNotFoundError` (404) quando não.

---

## FinancialEntryAttachment (NOVO)

Um arquivo (comprovante) vinculado a um lançamento. Único filho com CRUD HTTP próprio (D2),
fora da substituição em massa do `save()` principal.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String @id @default(uuid())` | |
| `organizationId` | `String` | tenant scope |
| `financialEntryId` | `String` | FK `FinancialEntry(id, organizationId)`, `onDelete: Cascade` |
| `fileName` | `String` | nome original do arquivo |
| `objectKey` | `String` | chave no MinIO — nunca exposta ao cliente (mesmo padrão de `imageUrl` em `catalog`) |
| `contentType` | `String` | mime detectado por assinatura binária |
| `sizeBytes` | `Int` | ≤ 5MB (D14) |
| `createdAt` | | sem `updatedAt` — anexo é imutável, só cria/deleta |

`@@map("financial_entry_attachments")`, `@@schema("erp")`.

Object storage key: `{organizationId}/financeiro/lancamentos/{financialEntryId}/{attachmentId}.{ext}`
(mesmo padrão de `ErpObjectKeyPolicy`, bucket `erp` já existente).

---

## ChartOfAccount (ALTERADO — só dado, não schema)

Nenhuma mudança de coluna. Um novo `systemKey: 'outras-despesas'` (`"Outras despesas"`, grupo
`despesas`) é adicionado a `SEED_CHART_OF_ACCOUNTS` (para organizações novas) e retro-inserido
via script de backfill para organizações existentes (D7, D10). `outras-receitas` já existe no
seed e é só reaproveitado.

## CostCenter (sem alteração)

Nenhuma mudança de schema nem de seed — `administrativo` (fallback do backfill, D9) e
`comercial` (fallback do recebível auto-gerado, D8) já existem.

---

## `TENANT_SCOPED_MODELS` — entradas novas

```ts
// shared/infra/prisma/tenant-scope.extension.ts
FinancialEntryPayment: 'organizationId',
FinancialEntryAllocation: 'organizationId',
FinancialEntryAttachment: 'organizationId',
```

## Diagrama de relações (novo trecho)

```
FinancialEntry (1) ──< (N) FinancialEntryPayment
FinancialEntry (1) ──< (N) FinancialEntryAllocation ──> (1) ChartOfAccount
                                                     └─> (1) CostCenter [obrigatório]
FinancialEntry (1) ──< (N) FinancialEntryAttachment
FinancialEntry (N) ──> (1) Customer   [opcional, XOR com Supplier]
FinancialEntry (N) ──> (1) Supplier   [opcional, XOR com Customer]
FinancialEntry (N) ──> (1) BankAccount [opcional]
FinancialEntry (N) ──> (0..1) SaleOrder [somente leitura; presença trava edição do lançamento inteiro]
ContractInstallment (N) ──> (0..1) FinancialEntry  [já existia; inalterado]
```
