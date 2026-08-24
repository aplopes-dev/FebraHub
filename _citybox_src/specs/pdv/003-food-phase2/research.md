# Phase 0 Research: PDV Food (Fase 2)

Nenhum item da Technical Context ficou como `NEEDS CLARIFICATION` — a spec fecha comportamento com Assumptions; a preferência do usuário (TextField filled) fecha o padrão de formulário. As decisões abaixo resolvem implementação.

**Escopo**: gap **Fase 2** (itens 13–18). Não é Fase 3 (varejo) nem Fase 4 (sessão/fiscal).

## 1. Breakpoints (`PdvBreakpoints`) — reabertura da dívida

**Decision**: Introduzir `lib/core/layout/pdv_breakpoints.dart` com constantes oficiais AGENTS §4.7:

| Formato | Largura |
|---|---|
| compact | &lt; 720 |
| medium | 720–1199 |
| expanded | ≥ 1200 |

Helper `PdvFormat.of(BoxConstraints)` / `ofWidth(double)`. Aplicar via `LayoutBuilder` (nunca `Platform.isAndroid`) em:
- telas novas: Mesas, Comandas, Atendimentos, Delivery (form + lista)
- **Balcão e Pagamento** (dívida Fase 0)

Compacto: empilhar painéis (uma coluna dominante). Médio: catálogo + pedido em duas faixas adaptativas. Expandido: preservar layout atual de caixa (colunas ~250/400) sem regressão.

Relaxar ou condicionar `window_manager` minimum size em desktop estreito **somente se** bloquear testes de compacto; Android tablet não usa esse mínimo.

**Rationale**: Spec FR-001 / US1; Fase 0 FR-011 + research §6; gap §7.2.

**Alternatives considered**:
- *Só Mesas/Comandas responsivos* — rejeitada: FR-001 inclui Balcão/Pagamento.
- *Breakpoint por plataforma* — rejeitada: AGENTS §4.7.

## 2. Conta de salão unificada (mesa ↔ comanda ↔ atendimento)

**Decision**: Entidade **`SalonAccount`** (conta aberta) como fonte de verdade do salão:

- Pode ter `tableId?`, `tabNumber?` / `tabCard?`, status `open | closing | closed`
- **Atendimento** (`ServiceSession` / fila) = projeção das contas `open`/`closing` (FR-008) — não um segundo carrinho
- Abrir mesa livre → cria `SalonAccount` + navega Balcão com `accountId`
- Abrir comanda → cria/retoma `SalonAccount` + Balcão
- Carrinho do Balcão, quando vinculado, persiste linhas na conta (além do provider de sessão de venda)

Persistência: chave `pdv.salon.v1` em `shared_preferences` (JSON), independente do turno (`pdv.cash_shift.v1`) mas **operações exigem turno open** (gate Fase 1).

**Rationale**: Spec Assumptions (“atendimento = fila vinculada”); evita três ledgers.

**Alternatives considered**:
- *Três stores independentes* — rejeitada: divergência mesa/comanda.
- *Só memória* — rejeitada: FR-020 restauração.

## 3. Transferir / juntar / dividir

**Decision**:
- **Transferir**: move `SalonAccount` de `tableId` A → B (B livre; se B ocupada → confirmação e merge ou recusa — fixture: **recusa** se B ocupada, mensagem clara).
- **Juntar**: merge linhas da conta origem na destino; origem `closed`; total consolidado mostrado antes de confirmar.
- **Dividir**: v1 = **N partes iguais** do total em centavos (resto na primeira parte); cria N contas filhas ou N “splits” na mesma mesa — preferência: N contas `SalonAccount` ligadas à mesma mesa com rótulos `Mesa X-1…`. Itens indivisíveis: mensagem se quantidade não permite (fixture simples: só divide totais, não itens).

**Rationale**: Spec Assumptions (partes iguais); edge cases do spec.

## 4. Ordem de totais food + ajuste Fase 1

**Decision** (domínio puro, testável) — documentado em [food-totals.md](./contracts/food-totals.md):

```
linesNetCents          // pós desconto por linha + adicionais/meia
+ couvertCents         // unit × pessoas (módulo couvert)
= baseForServiceCents
+ serviceFeeCents      // % sobre baseForService (módulo service_fee; default 10%)
= preSaleAdjCents
± saleAdjustment       // XOR Fase 1
= totalCents ≥ 0
```

Taxa/couvert **não** são `SaleAdjustment`. Controles no painel só se `isOperationallyVisible` dos ids `service_fee` / `couvert`.

**Rationale**: Spec FR-011/012 + Assumption ordem; research Fase 1 §6 já reservou taxa/couvert para esta fase.

## 5. Linha de carrinho food (addons / kitchen note / half)

**Decision**: Estender `CounterCartLine` (imutável) com campos opcionais:

- `addons: List<CartAddon>` (`id`, `name`, `unitPriceCents`)
- `kitchenNote: String?` (trim; teto 120 chars)
- `half: HalfPizzaSelection?` (`leftProductId`, `rightProductId`, `priceCents` pela regra fixture)

Preço da linha: produto base (ou preço meia) + Σ addons, × quantidade, − desconto linha.

UI: sheets/diálogos no lançamento quando módulos `item_addon` / `kitchen_note` / `half_pizza` available e produto elegível (`CounterProduct.flags`).

**Rationale**: FR-009/010; um Balcão só (§1 do gap).

**Alternatives considered**:
- *Dois CounterPage por segmento* — rejeitada pela premissa do produto.

## 6. Navegação e `returnTo`

**Decision**: Rotas estáveis (ver [navigation.md](./contracts/navigation.md)). Query/extra:

- `/counter?accountId=` — Balcão vinculado
- Após `/sale-completed`, ações “voltar ao salão” usam `returnTo` = `/tables` | `/tabs` | `/delivery/orders` conforme origem
- Guards: `/tables`, `/tabs`, `/service`, `/delivery`, `/delivery/orders`, `/counter`, `/payment` exigem turno open → senão `/cash?intent=open`

Home: `M`→`/tables`, `Q`→`/tabs`, `A`→`/service`, `D`→`/delivery/new`, `W`→`/delivery/orders`. App bar Balcão Comandas → `/tabs`.

**Rationale**: FR-018; Fecha “não implementado”; contrato Fase 1 já apontava retorno mesa para Fase 2.

## 7. Delivery

**Decision**: Feature `delivery/` com:

- `DeliveryOrder` (cliente ref, endereço texto, `feeCents`, `courierId?`, `status`, `accountId?`)
- Form novo pedido (`/delivery/new`) → cria order + conta/venda → Balcão ou direto fila
- Lista (`/delivery/orders`) com status e despacho (`received → preparing → dispatched → delivered` — subset fixture)

Módulos `delivery` e `delivery_orders` independentes (Lanchonete pode ter ambos; Loja nenhum).

**Rationale**: FR-013–015; SC-001.

## 8. TextField Filled (padrão do sistema) — pedido do usuário

**Decision**:
1. Extrair `customerFilledDecoration` → `lib/ui/pdv_filled_field.dart` (`pdvFilledDecoration` + widget `PdvFilledField`).
2. **Todo** campo de texto criado ou tocado nesta fase (comanda número/cartão, observação de cozinha, endereço delivery, taxa/couvert editáveis, busca na fila, etc.) MUST usar Filled: `filled: true`, `fillColor: PdvColors.inputFill`, bordas `UnderlineInputBorder` com tokens (ver [filled-fields.md](./contracts/filled-fields.md)).
3. Migrar `CustomerFormField` e campos inline do Balcão/cash que ainda usem outlined sem fill **quando tocados** nesta fase; no mínimo não introduzir regressão outlined.
4. Proibido: `OutlineInputBorder` / decoration sem `filled` em formulários novos.

**Rationale**: Pedido explícito no `/speckit-plan`; AGENTS §4.0.1 (`inputFill`); `CustomerFormField` já é a referência visual.

**Alternatives considered**:
- *Outlined do ThemeData global* — rejeitada pelo usuário e pelo contraste no tema escuro.
- *Só cliente filled, resto outlined* — rejeitada: inconsistência.

## 9. Persistência e reinício

**Decision**: Snapshot `SalonState` (tables layout metadata + accounts + delivery orders) em `shared_preferences`. Hidratar no `build()` dos controllers. Carrinho vinculado a `accountId` restaura linhas. Turno continua no store Fase 1; se turno fechou, contas abertas permanecem mas UI bloqueia operação até reabrir (mensagem + hub).

**Rationale**: FR-020 / SC-007.

## 10. Fora / adiado

- `production_print` / KDS: id pode existir no catálogo; UI operacional **não** implementa ticket (FR-024).
- Janela mínima 1024×640: manter no expandido desktop; documentar que validação compacta/média usa Android ou resize forçado em testes widget (`tester.view.physicalSize`).
