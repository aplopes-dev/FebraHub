# Contract: Weight → money (centavos)

## Fórmula

Dado `pricePerKgCents: int` e `weightKg: double` (entrada do operador / simulação):

```
raw = pricePerKgCents * weightKg
lineCents = roundHalfUpToInt(raw)   // half away from zero / half-up clássico para ≥ *.5
```

- `weightKg` MUST ser &gt; 0.
- `lineCents` MUST ser `int` ≥ 0.
- **Proibido** persistir ou somar totais de venda em `double`.

## UI

1. Diálogo com `PdvFilledField` (peso) + preview `formatCents(lineCents)` com `PdvTypography.amount*`.
2. Botão opcional “Ler balança” se settings.terminal.scale habilitado → preenche peso fixture.
3. Confirmar → adiciona `CounterCartLine` com `weightKg`, `lineCents`, `quantity: 1`.
4. Cancelar → não altera carrinho.

## Totais

`lineCents` entra no subtotal do carrinho como valor da linha (não `unit * qty` em double).

## Testes

Tabela unitária: exemplos (1000 centavos/kg × 0.333 kg → 333; × 0.335 → 335; casos *.5 explícitos). Widget: confirmação grava linha com centavos esperados.
