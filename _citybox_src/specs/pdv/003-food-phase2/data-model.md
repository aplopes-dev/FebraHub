# Data Model: PDV Food (Fase 2)

Todos os valores monetários em **centavos (`int`)**. Models imutáveis com `copyWith`. Herda turno/`SaleRecord` da Fase 1.

## Entities

### DiningTable (Mesa)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | |
| `label` | string | ex. "Mesa 12" |
| `status` | `free` \| `occupied` \| `closing` | derivado da conta vinculada ou persistido espelhado |
| `sortOrder` | int | layout do mapa |
| `accountId` | string? | conta aberta atual |

### SalonAccount (Conta de salão)

Fonte de verdade mesa/comanda.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | |
| `status` | `open` \| `closing` \| `closed` | |
| `tableId` | string? | |
| `tabNumber` | string? | número digitável |
| `tabCard` | string? | cartão/comanda física |
| `openedAt` | DateTime | |
| `closedAt` | DateTime? | |
| `lines` | List&lt;CounterCartLine&gt; | snapshot serializável |
| `couvert` | CouvertState? | |
| `serviceFeeEnabled` | bool | |
| `serviceFeePercentBps` | int | default 1000 = 10% |
| `saleAdjustment` | SaleAdjustment? | Fase 1 XOR |
| `customerId` | string? | |
| `origin` | `table` \| `tab` \| `counter` \| `delivery` | |
| `deliveryOrderId` | string? | |

**Validação**: ao menos um de `tableId` / `tabNumber|tabCard` / `origin=counter|delivery`; não duas contas `open` na mesma mesa.

### ServiceQueueItem (Atendimento — projeção)

Não é ledger paralelo: derivado de `SalonAccount` com `status ∈ {open, closing}`.

| Campo | Tipo | Notas |
|---|---|---|
| `accountId` | string | |
| `title` | string | "Mesa 12" / "Comanda 45" |
| `openedAt` | DateTime | |
| `itemCount` | int | |
| `totalCents` | int | preview |

### CartAddon

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | |
| `name` | string | |
| `unitPriceCents` | int | ≥ 0 |

### HalfPizzaSelection

| Campo | Tipo | Notas |
|---|---|---|
| `leftProductId` | string | |
| `rightProductId` | string | |
| `priceCents` | int | regra fixture (ex. max das metades) |

### CounterCartLine (estendido)

Campos Fase 0/1 + food:

| Campo | Tipo | Notas |
|---|---|---|
| `product` | CounterProduct | |
| `quantity` | int | ≥ 1 |
| `discountPercent` ou bps | conforme modelo atual | migrar a int se ainda double |
| `addons` | List&lt;CartAddon&gt; | default `[]` |
| `kitchenNote` | string? | máx. 120 |
| `half` | HalfPizzaSelection? | produto elegível |

`lineGoodsCents` = (half?.priceCents ?? product.priceCents) + Σ addon; depois × qty − desconto linha.

### CouvertState

| Campo | Tipo | Notas |
|---|---|---|
| `unitCents` | int | &gt; 0 |
| `covers` | int | ≥ 1 |
| `totalCents` | int | `unit × covers` |

### DeliveryOrder

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | |
| `status` | `received` \| `preparing` \| `dispatched` \| `delivered` \| `cancelled` | |
| `customerId` / `customerName` | | |
| `addressText` | string | obrigatório no create |
| `feeCents` | int | ≥ 0 |
| `courierId` / `courierName` | string? | |
| `accountId` | string? | vínculo à conta/venda |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

### SaleRecord / SaleLineSnapshot (extensão)

Ao finalizar: persistir no turno (Fase 1) com linhas enriquecidas (addons, kitchenNote, half), `couvertCents`, `serviceFeeCents`, `deliveryFeeCents?`.

### CounterProduct (fixture flags)

| Campo | Tipo | Notas |
|---|---|---|
| `allowsAddons` | bool | |
| `addonIds` | List&lt;string&gt; | catálogo |
| `allowsHalf` | bool | meia-pizza |
| `allowsKitchenNote` | bool | default true se módulo on |

## State transitions

### Mesa

```
free --abrir--> occupied
occupied --iniciar fechamento/pagamento--> closing
closing --venda ok / cancelar conta--> free
```

### SalonAccount

```
open --fechar conta / ir a pagamento--> closing
closing --pagamento concluído | cancelar--> closed
open --cancelar atendimento--> closed  (mesa → free)
```

### DeliveryOrder

```
received → preparing → dispatched → delivered
qualquer ativo → cancelled (confirmação)
```

## Persistence

| Store | Chave | Conteúdo |
|---|---|---|
| Turno (Fase 1) | `pdv.cash_shift.v1` | inalterado + sales enriquecidas |
| Salão | `pdv.salon.v1` | tables + accounts |
| Delivery | `pdv.delivery.v1` **ou** embutido em salon | orders |

Preferência: **um** JSON `pdv.salon.v1` contendo `tables`, `accounts`, `deliveryOrders` para um único write no restart.

## Validation rules (domínio)

- Quantidade / valores monetários ≥ 0; qty ≥ 1 ao lançar.
- Couvert: `covers ≥ 1`, `unitCents > 0`.
- Service fee percent: 0–100% em bps.
- Total final ≥ 0 (bloquear ajuste que negativaria).
- Tab open: número/cartão não vazio; unicidade de `tabNumber` open na fixture.
- Transfer para mesa ocupada: recusar (research §3).
- Split: `n ≥ 2`; resto de centavos na parte 1.

## Relationships (resumo)

```
DiningTable 1──0..1 SalonAccount
SalonAccount 0..1──0..1 DeliveryOrder
SalonAccount *──* CounterCartLine (embed)
ServiceQueueItem → SalonAccount (view)
CashShift.sales ← SaleRecord (ao pagar)
```
