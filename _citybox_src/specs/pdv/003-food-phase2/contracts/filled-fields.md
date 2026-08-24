# Contract: Filled text fields (padrão do sistema)

**Obrigatório nesta fase** (pedido do `/speckit-plan` + AGENTS §4.0.1).

## Regra

Todo `TextField` / `TextFormField` **novo** ou **alterado** em features desta fase MUST usar a variante **Filled**:

- `filled: true`
- `fillColor: PdvColors.inputFill` (`#414141`)
- bordas `UnderlineInputBorder` com `PdvRadius.baseAll` (cantos vivos)
- `enabledBorder` / `focusedBorder` / `errorBorder` via tokens (`PdvColors.border`, `focusRing`, `danger`; espessuras `PdvSizes.borderWidth` / `borderWidthFocus`)
- texto digitado: `PdvTypography.bodyMd` + `PdvColors.textPrimary` (não depender só de `onSurface` sem garantir contraste)

## API canônica

Extrair de `customer_form_field.dart` para:

- `lib/ui/pdv_filled_field.dart`
  - `InputDecoration pdvFilledDecoration({required String label, String? hint, Widget? suffix, …})`
  - widget opcional `PdvFilledField` (controller, keyboardType, formatters, maxLines, enabled)

`CustomerFormField` passa a delegar a `pdvFilledDecoration` (sem mudança visual).

## Onde aplica (Fase 2)

| Fluxo | Campos |
|---|---|
| Comandas | número / cartão |
| Item Balcão | observação de cozinha; busca de adicional se houver campo texto |
| Couvert / taxa | valor editável, nº de pessoas, % taxa se editável |
| Delivery novo | endereço, complemento, taxa (se texto), busca cliente se campo |
| Filas | busca/filtro texto se existir |
| Split / transfer | confirmações com campo numérico se houver |

## Proibido

- `OutlineInputBorder` em formulários novos
- `InputDecoration` sem `filled: true` / sem `inputFill`
- Cores hardcoded de fundo de campo fora de `PdvColors.inputFill`
- Segundo “estilo de formulário” paralelo ao Filled

## Exceções

- Teclado numérico de **pagamento** (botões, não TextField) — fora deste contrato
- Campos **inline da grade do carrinho** já filled em `counter_cart_table.dart` — manter filled; alinhar helper se conveniente
- Labels não-editáveis (`Text`) — N/A

## Teste

Widget test: ao menos um formulário delivery **ou** abertura de comanda → `TextField` com decoration `filled == true` e `fillColor == PdvColors.inputFill`.
