# Data Model: PDV Varejo (Fase 3)

Todos os valores monetários em **centavos (`int`)**. Models imutáveis com `copyWith`. Herda turno / `SaleRecord` / carrinho da Fase 0–1.

## Entities

### ProductBarcodeIndex (fixture / lookup)

| Campo | Tipo | Notas |
|---|---|---|
| `code` | string | normalizado (trim; regra zeros à esquerda na fixture) |
| `productId` | string | |
| `skuId` | string? | se aponta direto a uma variação |

### ProductVariant / Sku

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | `skuId` |
| `productId` | string | |
| `attributes` | Map&lt;string, string&gt; | ex. `size`→`M`, `color`→`Azul` |
| `priceCents` | int | ≥ 0 |
| `barcode` | string? | |
| `available` | bool | célula da grade |

### CounterProduct (estendido)

Campos existentes +:

| Campo | Tipo | Notas |
|---|---|---|
| `barcodes` | List&lt;string&gt; | opcional se index global |
| `variants` | List&lt;ProductVariant&gt; | vazio = sem grade |
| `soldByWeight` | bool | |
| `pricePerKgCents` | int? | obrigatório se `soldByWeight` |
| `unitPriceCents` | int | preço unitário (não peso) |

### CounterCartLine (estendido varejo)

| Campo | Tipo | Notas |
|---|---|---|
| `product` | CounterProduct | |
| `quantity` | int | ≥ 1; para peso tipicamente 1 |
| `skuId` | string? | variação escolhida |
| `variantLabel` | string? | ex. "M / Azul" |
| `weightKg` | double? | só pesáveis; **não** usar para dinheiro |
| `lineCents` | int? | valor fechado pós-peso; se null, deriva de preço unitário × qty |
| `discount…` | | herdado Fase 1 |

**Merge ao bipar**: mesma `productId` + mesmo `skuId` (ambos null ok) + **sem** `weightKg` → soma `quantity`. Linhas por peso **não** mergeiam automaticamente.

### PendingQty (estado efêmero — application)

| Campo | Tipo | Notas |
|---|---|---|
| `quantity` | int? | N &gt; 0 aguardando próximo código |

### PriceCheckResult (não persistido)

| Campo | Tipo | Notas |
|---|---|---|
| `productId` / `skuId` | | |
| `name` | string | |
| `variantLabel` | string? | |
| `priceCents` | int | |
| `codeQueried` | string | |

### RefundLine

| Campo | Tipo | Notas |
|---|---|---|
| `saleLineId` / index | | referência à linha da venda original |
| `productId` | string | |
| `skuId` | string? | |
| `quantity` | int | 1…elegível |
| `unitCents` | int | snapshot |
| `lineCents` | int | qty × unit (− rateio se peso) |

### RefundRecord

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | |
| `saleId` | string | venda original |
| `shiftId` | string | turno corrente |
| `createdAt` | DateTime | |
| `lines` | List&lt;RefundLine&gt; | |
| `totalCents` | int | |
| `refundMethod` | `cash` \| `customer_credit` | meios da fixture |
| `customerId` | string? | se crédito |

**Validação**: qty ≤ vendida − já devolvida; total &gt; 0; turno open.

### CustomerCreditAccount

| Campo | Tipo | Notas |
|---|---|---|
| `customerId` | string | |
| `balanceCents` | int | ≥ 0 após pagamento; fixture pode iniciar &gt; 0 |
| `updatedAt` | DateTime | |

### CreditLedgerEntry

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | |
| `customerId` | string | |
| `type` | `charge` \| `payment` | charge opcional na fixture seed; UI desta fase cria sobretudo `payment` |
| `amountCents` | int | &gt; 0 |
| `createdAt` | DateTime | |
| `shiftId` | string? | |
| `note` | string? | |
| `refundId` | string? | se veio de estorno devolução |

**Pagamento**: `amountCents` ≤ `balanceCents`; novo saldo = balance − amount; se `cash`, movimento de gaveta no turno.

## State transitions

### Devolução

```
SaleRecord (completed)
  → select lines/qty
  → confirm method
  → RefundRecord persisted
  → sale lines remaining qty updated (ou ledger de returnedQty)
  → if cash: shift drawer expected ↓
  → if customer_credit: CreditLedgerEntry payment? No — credit *increase* balance (estorno a favor do cliente)
```

Clarificação de domínio (Assumption “crédito na conta do cliente” como estorno):
- `refundMethod = customer_credit` → **aumenta** `balanceCents` (cliente fica com crédito a usar) + entry tipo adequado (`charge` invertido ou `refund_credit`) — nomear `CreditLedgerEntry.type = credit_from_refund`.
- `refundMethod = cash` → dinheiro sai da gaveta.

### Crédito (receber)

```
balanceCents > 0
  → payment amount
  → balance ↓
  → entry type=payment
  → if cash received: drawer expected ↑ (dinheiro entra)
```

## Persistence keys

| Key | Conteúdo |
|---|---|
| `pdv.refund.v1` | lista `RefundRecord` (+ returnedQty por sale line se não embutido) |
| `pdv.credit.v1` | accounts + ledger entries |
| turno / vendas | chaves Fase 1 existentes |

## Validation rules (resumo)

- Barcode: código vazio não lança; inválido → erro.
- Pending qty: 1…999 (fixture).
- Peso: &gt; 0; `lineCents` ≥ 0 após half-up.
- Grade: combinação completa + `available`.
- Devolução: qty elegível; métodos só os habilitados.
- Crédito pagamento: 0 &lt; amount ≤ balance.
- Módulos: UI só se `isOperationallyVisible`.
