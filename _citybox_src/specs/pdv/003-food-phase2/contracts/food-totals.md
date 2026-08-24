# Contract: Food totals (taxa / couvert / linha)

Totais em **centavos inteiros**. Arredondamento percentual: **half-up**.

## Module gates

| Bloco | `PdvModuleIds` | Onde |
|---|---|---|
| Adicionais | `item_addon` | lançamento Balcão |
| Observação cozinha | `kitchen_note` | lançamento / edição linha |
| Meia-a-meia | `half_pizza` | lançamento se `product.allowsHalf` |
| Taxa de serviço | `service_fee` | painel de totais |
| Couvert | `couvert` | painel de totais |
| Ajuste genérico | — (Fase 1) | painel; XOR discount/surcharge |
| Impressão produção | `production_print` | **não** implementar nesta fase |

## Line net

```
unitCents = half?.priceCents ?? product.priceCents
goodsCents = unitCents + sum(addon.unitPriceCents)
lineSubtotal = goodsCents * quantity
lineDiscount = round_half_up(lineSubtotal * discountPercent / 100)  // ou bps
lineNet = lineSubtotal - lineDiscount
```

`linesNetCents` = Σ `lineNet`.

## Couvert

```
couvertCents = unitCents * covers   // covers ≥ 1, unitCents > 0
```

Se módulo off ou estado null → `0`.

## Service fee

```
baseForServiceCents = linesNetCents + couvertCents
serviceFeeCents = round_half_up(baseForServiceCents * percentBps / 10000)
```

Default fixture: `percentBps = 1000` (10%). Se módulo off ou desligado na UI → `0`.

**Não** inclui taxa de entrega delivery na base da taxa de serviço (delivery fee é linha/pedido aparte).

## Sale adjustment (Fase 1)

Aplicado **depois** de taxa/couvert:

```
preAdj = linesNetCents + couvertCents + serviceFeeCents
total = applySaleAdjustment(preAdj)   // XOR; total >= 0
```

## Painel UI (ordem de linhas)

1. Subtotal (linhas)  
2. Couvert (se > 0 / módulo on)  
3. Taxa de serviço (se > 0 / módulo on)  
4. Desconto/acréscimo de venda (Fase 1)  
5. **Total**

## Delivery fee

`feeCents` do `DeliveryOrder` entra no total a pagar da conta delivery **como acréscimo de pedido** (linha dedicada no resumo), **não** como `SaleAdjustment` e **não** na base da taxa de serviço.

## SaleRecord snapshot

Ao concluir: gravar `lines` enriquecidas, `couvertCents`, `serviceFeeCents`, `deliveryFeeCents?`, `totalCents` coerentes com esta fórmula (SC-006, SC-009).
