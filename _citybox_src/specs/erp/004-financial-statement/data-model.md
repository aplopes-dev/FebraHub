# Data Model: Extrato financeiro consolidado

Schema Postgres `erp`, `apps/erp/api/prisma/schema.prisma`. **Nenhum model novo, nenhum campo
novo, nenhuma migration.** A fatia inteira lê modelos já existentes e entregues por
`001-financial-entries` (`FinancialEntry`, `FinancialEntryAllocation`) e
`002-bank-account-ledger` (`BankAccount`, `BankTransaction`). Ver `research.md` D1–D6.

## `FinancialEntry` (existente, critério de listagem estendido)

Entidade e model Prisma inalterados (`domain/entities/financial-entry.entity.ts`,
`prisma/schema.prisma:2282-2333`). O que muda é só `FinancialEntryListCriteria`
(`domain/repositories/financial-entry.repository.interface.ts`), consumido tanto pela listagem
quanto pelo resumo novo:

| Campo novo em `FinancialEntryListCriteria` | Tipo | Aplicado em (`buildWhere`) |
|---|---|---|
| `competenceFrom` | `Date?` | `competenceDate >= competenceFrom` |
| `competenceTo` | `Date?` | `competenceDate <= competenceTo` |
| `bankAccountId` | `string?` | `bankAccountId = criteria.bankAccountId` |

Campos já existentes reaproveitados sem mudança: `operation`, `status[]`, `chartOfAccountId[]`
(via `allocations.some`), `costCenterId[]` (idem), `search` (descrição/parte), `dueFrom`/`dueTo`,
`tab` (resumo sempre usa o padrão `active`, nunca lê `deleted` — FR-012).

**Validação nova** (`research.md` D3): para cada par de data (`dueFrom`/`dueTo` e
`competenceFrom`/`competenceTo`), se os dois lados vierem preenchidos e `to < from`, a consulta é
rejeitada com `InvalidStatementPeriodError` (422) antes de qualquer query — cobre o edge case
"Período informado com data final anterior à inicial" para os dois eixos.

## `FinancialEntryAllocation` (existente, sem mudança)

Usada apenas como já é hoje — filtro `allocations.some({chartOfAccountId})`/`allocations.some({costCenterId})`
na listagem. O resumo (cards de entradas/saídas/saldo) **não** agrega por `FinancialEntryAllocation`
— agrega `FinancialEntry.amountCents` diretamente (ver read model abaixo), porque os cards somam o
lançamento inteiro por operação, não por rateio de categoria/centro de custo.

## `BankAccount` / `BankTransaction` (existentes, sem mudança)

Reaproveitados tal como estão via `GET /v1/bank-accounts?perPage=100&tab=active`
(`research.md` D6) — `currentBalanceCents` já calculado por
`BankTransactionRepository.sumBalancesByAccountIds` (`groupBy` em `BankTransaction`). Nenhum
campo, índice ou query nova.

## Read model: `FinancialEntriesSummary` (resumo do extrato, FR-008)

Não persistido — calculado sob demanda pelo `GetFinancialEntriesSummaryUseCase` a partir de
`FinancialEntry.amountCents` agregado (`groupBy(['operation'])`, mesmos filtros e `buildWhere` da
listagem).

```
FinancialEntriesSummary
├── receivableCents: number   (SUM(amountCents) WHERE operation = 'receivable', filtros aplicados; 0 se nenhum)
├── payableCents: number      (SUM(amountCents) WHERE operation = 'payable', filtros aplicados; 0 se nenhum)
└── netCents: number          (receivableCents − payableCents; pode ser negativo)
```

**Regras de validação/derivação** (no use case, nada persistido):

- Só entram lançamentos com `deletedAt IS NULL` (FR-012) e que atendam a **todos** os filtros
  também aplicados à listagem (mesmo `buildWhere`) — tipo, status, conta bancária, categoria,
  centro de custo, busca livre, período (competência **ou** vencimento, conforme o eixo escolhido
  no frontend) — FR-008.
- Lançamento com rateio entre múltiplas categorias/centros de custo entra **uma vez** no resumo
  (a soma é sobre o lançamento, `allocations.some` só filtra quais lançamentos entram — não
  duplica por linha de rateio) — mesmo comportamento pedido para a lista (edge case do spec).
- `netCents` pode ser negativo (saídas maiores que entradas no período filtrado) — a UI rotula
  explicitamente que é o saldo do **período filtrado**, não o saldo bancário real (spec
  Assumptions, distingue de US2).

## Read model: `BankAccountBalance` (US2, sem endpoint próprio)

Não é uma entidade nova no backend — é o shape já devolvido por
`BankAccountPresenter.toHttpList` (`GET /v1/bank-accounts`), consumido como está:

```
BankAccountBalance   (== item de GET /v1/bank-accounts)
├── id: string
├── name: string
├── bankName: string
└── currentBalanceCents: number
```

## Client-only: `FinancialStatementSelection` (US3, FR-011 — nunca persistido, nunca enviado à API)

Estado local do frontend (`hooks/use-financial-statement-selection.ts`), existe só enquanto a
tela está aberta:

```
FinancialStatementSelection
├── selectedIds: Set<string>                                    (ids de FinancialEntry marcados na página atual)
└── totals: { count: number; netCents: number }                 (derivado — soma das linhas selecionadas já carregadas, respeitando o sinal de operação: receivable soma, payable subtrai)
```

**Regra de derivação**: `netCents` é recalculado a cada mudança de `selectedIds`, iterando só as
linhas atualmente carregadas na página (nenhuma chamada de API extra). `selectedIds` é limpo
sempre que `filters`, `dateAxis`, `search` ou `page` mudam (spec edge case: "Trocar de página ou de
filtro com uma seleção de agrupamento ativa: a seleção anterior é limpa").

## Frontend types (`types/financial-statement.ts`)

Espelham os DTOs HTTP acima (centavos) mais os equivalentes em reais usados pela UI
(`api/financial-statement.mapper.ts` faz a conversão, mesmo padrão de
`financial-entry.mapper.ts`/`financial-result.mapper.ts`):

```
FinancialStatementFilters
├── operations: FinancialEntryOperation[]     ("receivable" | "payable")
├── statuses: FinancialEntryStatus[]          ("pending" | "paid")
├── categoryIds: string[]                     (chartOfAccountId)
├── costCenterIds: string[]
├── bankAccountId: string | null
├── dateAxis: "competence" | "due"            (estado só de UI — decide qual par de data enviar)
├── dateFrom: string | null                   (ISO date)
└── dateTo: string | null                     (ISO date)
```
