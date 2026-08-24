# Contract: Sale Adjustment (venda inteira)

Desconto **ou** acréscimo no total da venda (FR-013, Q4).

## Model

```text
SaleAdjustment {
  kind: discount | surcharge   // mutuamente exclusivos
  mode: percent | amount
  // se percent: percentBps (10000 = 100%)
  // se amount: amountCents
}
```

Aplicar um `kind` diferente **substitui** o ajuste anterior (nunca os dois).

## Ordem de cálculo

1. Somar linhas (preço × qtd − desconto por linha) → `linesSubtotalCents`
2. Se ajuste `null` → `totalCents = linesSubtotalCents`
3. Se `discount` + `percent` → `adj = round(linesSubtotal * percentBps / 10000)`; `total = linesSubtotal - adj`
4. Se `discount` + `amount` → `total = linesSubtotal - amountCents`
5. Se `surcharge` + `percent` → `adj = round(...)`; `total = linesSubtotal + adj`
6. Se `surcharge` + `amount` → `total = linesSubtotal + amountCents`
7. Clamp: `totalCents = max(0, total)`

Arredondamento: half-up para inteiro de centavos.

## UI

- Painel de totais do Balcão: ajuste **editável** (não só percentual derivado).
- Deixar claro: desconto/acréscimo **da venda** vs descontos **por linha**.
- Carrinho vazio: ação indisponível ou mensagem (edge case do spec).

## Fora de escopo

`service_fee` / `couvert` como módulos de comportamento (gap Fase 2).
