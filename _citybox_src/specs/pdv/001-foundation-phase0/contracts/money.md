# Contract: Money (centavos)

Alinha domínio PDV às APIs Citybox (`priceCents`, `totalCents`, …) e a AGENTS §4.6.

## Tipo

Valores monetários de domínio são **`int` centavos** (inteiro não fracionário).  
Proibido: `double` / `num` fracionário em `features/*/domain` e nos cálculos de totais/pagamento.

## Formatação (única)

```dart
String formatCents(int cents); // pt_BR, símbolo R$, 2 casas
```

Implementação em `core/format/pdv_currency.dart` (evoluir o `NumberFormat` atual).  
Telas **não** formatam com `toStringAsFixed` ad hoc.

## Regras de fechamento

```
canFinalize = totalCents > 0 && receivedCents >= totalCents
```

Sem tolerância de ponto flutuante. SC-001: recebido == total → sempre fecha.

## Migração de fixtures

| Antes (R$) | Depois (centavos) |
|---|---|
| 2.5 | 250 |
| 5.5 | 550 |
| 10.0 | 1000 |

Teclado de pagamento: continua empurrando dígitos em centavos; o modelo de rascunho já deve ser `int`.
