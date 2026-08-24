# Contract: Cash Shift & Drawer

Contrato de domínio para turno, movimentos e impacto na gaveta (FR-001–005, FR-023–025).

## Expected drawer

```
expectedCents =
  openingFloatCents
  + Σ reinforcement.amountCents
  - Σ withdrawal.amountCents
  + Σ sale.cashNetCents  where sale.status == completed
```

`cashNetCents = cashReceivedCents - changeCents` na finalização da venda.

## Cash tender identification

Um pagamento conta como dinheiro se o método da fixture for o meio **cash** (id estável no catálogo de pagamento — alinhar ao `PaymentMethod` existente; se hoje for só rótulo, introduzir `PaymentMethod.isCash` / `id == 'cash'` nesta fase).

Cartão, PIX e demais: `cashNetCents` contribuição 0 (não somar valor desses meios ao expected).

## Operations

| Op | Pré-condição | Efeito |
|---|---|---|
| `openShift(floatCents≥0)` | nenhum turno open | cria turno open; persiste |
| `closeShift(countedCents≥0)` | turno open; `!saleInProgress` | grava counted, difference, status closed; persiste |
| `addWithdrawal(amount, reason)` | turno open; amount&gt;0; reason≠∅ | append movement; se amount&gt;expected, exige confirmação UI |
| `addReinforcement(amount, reason)` | idem | append |
| `recordSale(SaleRecord)` | turno open; sale completed | append; limpa carrinho fica a cargo do fluxo de sale-completed |
| `cancelSale(id)` | sale completed | status cancelled; expected recalcula |

## Sale in progress

`saleInProgress == true` quando:
- carrinho tem ≥1 linha, **ou**
- há pagamento lançado / rascunho de pagamento ativo na venda atual

`closeShift` **deve falhar** se `saleInProgress` (FR-024).

## Persistence

- Chave: `pdv.cash_shift.v1` (`shared_preferences`)
- Payload: JSON do turno atual (open ou último closed opcional — mínimo: turno open + histórico do open)
- Reinício: hidrata e restaura open se presente (SC-011)

## Comprovante

Sangria/reforço e reimpressão de venda: UI de comprovante + ação “Imprimir” **simulada** (snackbar/feedback) — sem driver.
