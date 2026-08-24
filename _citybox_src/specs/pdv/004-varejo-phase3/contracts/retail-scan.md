# Contract: Retail scan (barcode + qty × product + merge)

## Resolve

```
inputCode → normalize(trim, fixture zero-policy)
         → BarcodeIndex.lookup
         → miss → error, cart unchanged
         → hit product without variants → add/merge line
         → hit product with variants + module variant_grid
              → if skuId in code → add that SKU
              → else → open variant dialog → then add
         → hit soldByWeight + module scale → open weight dialog → add line with lineCents
```

## Quantidade × produto

1. Operador entra em modo qty (campo dedicado Filled **ou** prefixo numérico + confirmação — uma UX só, testável).
2. `pendingQty = N` (1…999).
3. Próximo resolve bem-sucedido usa `quantity = N` (ou peso com qty 1 + N não aplica — peso ignora pendingQty e limpa com aviso, **ou** bloqueia peso enquanto pendingQty set — preferência: **bloquear** peso/grade até limpar qty com ESC).
4. Após lançamento, `pendingQty = null`.

## Merge

Mesma chave `(productId, skuId)` e linha **não** pesável → `quantity += N`.

## Módulos

| Id | Efeito |
|---|---|
| `barcode` | campo/código lança no carrinho |
| `variant_grid` | diálogo de grade |
| `scale` | diálogo de peso |

## Erros

| Caso | UI |
|---|---|
| Código vazio | no-op ou hint |
| Não encontrado | mensagem acionável; foco no campo |
| Módulo off | capacidade ausente |

## Testes

Unit: normalize, lookup, merge, pendingQty. Widget: submit código fixture → linha no carrinho; inválido → sem linha.
