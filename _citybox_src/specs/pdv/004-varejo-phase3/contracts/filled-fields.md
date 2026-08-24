# Contract: Filled text fields + escala desktop (padrão do sistema)

**Obrigatório nesta fase** (pedido do `/speckit-plan` + AGENTS §4.0.1 / §4.8 / §4.8.1). Alinhado a [Fase 2 filled-fields](../../003-food-phase2/contracts/filled-fields.md) — **reutilizar** `pdv_filled_field.dart` se já existir.

## Regra — Filled

Todo `TextField` / `TextFormField` em **páginas e diálogos** desta fase MUST usar a variante **Filled**:

- `filled: true`
- `fillColor: PdvColors.inputFill`
- bordas `UnderlineInputBorder` com `PdvRadius.baseAll` (cantos vivos)
- `enabledBorder` / `focusedBorder` / `errorBorder` via tokens (`PdvColors.border`, `focusRing`, `danger`; `PdvSizes.borderWidth` / `borderWidthFocus`)
- texto digitado: `PdvTypography.bodyMd` (17) + `PdvColors.textPrimary` (contraste no `onSurface` do tema)

API: `pdvFilledDecoration` / `PdvFilledField` em `lib/ui/pdv_filled_field.dart`.

## Regra — escala desktop (caixa)

| Elemento | Token / regra |
|---|---|
| Texto de campo / label operacional | ≥ `PdvTypography.bodyMd` (17); preferir `bodyLg` (18) em títulos de seção curtos |
| Valores monetários | `PdvTypography.amount*` (tabular) |
| Altura de controle / botão padrão | `PdvSizes.controlHeight` **56** |
| Ação primária (Confirmar devolução, Receber, etc.) | `controlHeightLg` **64** quando for CTA full-width |
| Toolbar Balcão | `controlHeightSm` **48** (régua) |
| Diálogo formulário curto | `dialogMdWidth` **560** + `PdvDialogBody` |
| Diálogo lista / grade variação / busca | `dialogLgWidth` **720** + `dialogListHeight` |
| Alvo de toque em células da grade | min altura/largura coerente com 56 |

**Proibido**: `fontSize:` literal; botões 36/40 px; `AlertDialog` com largura solta `480`/`360`; segundo sistema tipográfico.

## Onde aplica (Fase 3)

| Fluxo | Campos / UI |
|---|---|
| Consulta de preço | código Filled; resultado tipografia amount |
| Devolução | busca venda; qtys; motivo se houver |
| Crédito | busca cliente; valor receber; notas |
| Diálogo peso | peso Filled + preview |
| Diálogo grade | confirmação; busca de atributo se houver |
| Qty × produto | se campo dedicado fora da régua → Filled |

## Exceções

- **Régua da toolbar** do Balcão (busca + código embutidos): flat / `filled: false` na faixa contínua (AGENTS §4.8.1). Código de barras **é** `TextField` real com `bodyMd`. Diálogos abertos a partir dela → Filled + diálogo Md/Lg.
- Teclado numérico de **pagamento** (botões) — N/A.
- Labels `Text` não-editáveis — N/A.

## Proibido

- `OutlineInputBorder` em formulários/diálogos novos
- `InputDecoration` sem `filled: true` / sem `inputFill` nesses fluxos
- Cores hardcoded de fundo de campo
- Diálogos “compactos mobile” como padrão do caixa desktop

## Teste

Widget test: ao menos um de `/refund`, `/credit` ou `/price-check` → `TextField` com `filled == true` e `fillColor == PdvColors.inputFill`; asserção de que diálogo de variação ou peso usa largura ≥ `dialogMdWidth` (ou find `PdvDialogBody`).
