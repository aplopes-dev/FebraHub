# Data Model: PDV Núcleo Comum (Fase 1)

Todos os valores monetários em **centavos (`int`)**. Models imutáveis com `copyWith`.

## Entities

### CashShift (Turno)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | UUID/v7-like local |
| `status` | `open` \| `closed` | no máx. um `open` por terminal |
| `openedAt` | DateTime | |
| `closedAt` | DateTime? | |
| `openingFloatCents` | int | ≥ 0 |
| `countedCents` | int? | informado no fechamento |
| `differenceCents` | int? | `counted − expected` no fechamento |
| `movements` | List&lt;CashMovement&gt; | |
| `sales` | List&lt;SaleRecord&gt; | vendas do turno |

**Expected drawer (derivado, não persistir se puder recalcular):**

`openingFloat + Σ reinforcements − Σ withdrawals + Σ (sale.cashNetCents where status=completed)`

### CashMovement

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | |
| `type` | `withdrawal` \| `reinforcement` | sangria / reforço |
| `amountCents` | int | &gt; 0 |
| `reason` | string | trim, não vazio |
| `createdAt` | DateTime | |
| `shiftId` | string | |

### SaleRecord

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | |
| `shiftId` | string | |
| `status` | `completed` \| `cancelled` | |
| `createdAt` | DateTime | |
| `cancelledAt` | DateTime? | |
| `lines` | List&lt;SaleLineSnapshot&gt; | resumo para detalhe |
| `payments` | List&lt;SalePaymentSnapshot&gt; | |
| `sellerId` / `sellerName` | string? | |
| `note` | string? | |
| `subtotalCents` | int | pós descontos de linha |
| `saleAdjustment` | SaleAdjustment? | snapshot |
| `totalCents` | int | |
| `cashReceivedCents` | int | soma meios dinheiro |
| `changeCents` | int | |
| `cashNetCents` | int | `cashReceived − change` (contribuição à gaveta) |

### SaleLineSnapshot / SalePaymentSnapshot

Snapshots imutáveis suficientes para UI de detalhe e reimpressão fixture (produto, qtd, preços, método, bandeira, parcelas, valor).

### SaleAdjustment (venda em curso + snapshot)

| Campo | Tipo | Notas |
|---|---|---|
| `kind` | `discount` \| `surcharge` | XOR — um só |
| `mode` | `percent` \| `amount` | |
| `percentBps` | int? | basis points (10000 = 100%) **ou** |
| `amountCents` | int? | valor absoluto |

Validação: exatamente um de percent/amount conforme `mode`; não coexistir discount+surcharge.

### TerminalSettings

| Campo | Tipo | Notas |
|---|---|---|
| `terminalLabel` | string | identificação local |
| `printerName` | string? | fixture |
| `cashDrawerEnabled` | bool | |
| `scaleEnabled` | bool | metadado UI — não aciona hardware |

Módulos: **não** fazem parte deste model de escrita — leitura via `ModuleSetSnapshot` (Fase 0).

### CashHub (UI aggregate)

Não é persistido: view-model = `CashShift?` + `expectedCents` + flags (`canOpen`, `canClose`, `saleInProgress`).

## Relationships

```text
CashShift 1──* CashMovement
CashShift 1──* SaleRecord
SaleRecord ── SaleAdjustment? (snapshot)
Counter (em curso) ── SaleAdjustment? (vivo no cart/totals)
Payment finalize ──▶ append SaleRecord + clear cart
```

## State transitions

### CashShift

```text
[none] --open(float≥0)--> open --close(count, !saleInProgress)--> closed
open --open--> rejected
closed/none --close--> rejected
closed -- (new) open --> open  (novo id de turno)
```

### SaleRecord

```text
completed --cancel(confirm)--> cancelled
cancelled --cancel--> no-op / unavailable
```

### SaleAdjustment (carrinho)

```text
null --set(discount|surcharge)--> adjustment
adjustment --set(other kind)--> replacement
adjustment --clear / empty cart--> null
```

## Validation rules

- Um turno `open` por vez (FR-003).
- Movimento: `amountCents > 0`, `reason` não vazio; turno deve estar `open`.
- Sangria &gt; expected: permitida após confirmação (spec).
- Fechar: exige `!saleInProgress`; `countedCents ≥ 0`.
- Cancelamento: confirmação; estorna só `cashNetCents` no expected.
- Ajuste: total final ≥ 0; percent/amount coerentes.
- Persistência: hidratar no start; escrever após cada mutação de turno (FR-025).

## Module catalog impact

| Id | Tier | Uso nesta fase |
|---|---|---|
| `cash_hub` | **core** (novo) | Hub Caixa |
| `cash_drawer` | core | Sangria/reforço |
| `history` | core | Últimas vendas |
| `settings` | core | Configurações |
| `seller` | core | Home F9 + Pagamento |
| `counter` | core | Guard de turno |
