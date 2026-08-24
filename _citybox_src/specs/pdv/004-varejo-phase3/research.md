# Phase 0 Research: PDV Varejo (Fase 3)

Nenhum item da Technical Context ficou como `NEEDS CLARIFICATION` — a spec fecha comportamento com Assumptions; a preferência do usuário (TextField filled + escala desktop) fecha o padrão de UI junto com AGENTS §4.0 / §4.8 / §4.8.1. As decisões abaixo resolvem implementação.

**Escopo**: gap **Fase 3** (itens 19–23). Não é Fase 2 (food) nem Fase 4 (sessão/fiscal).

## 1. Independência da Fase 2 + breakpoints

**Decision**: Esta fase **não** depende de Mesas/Comandas. Se `PdvBreakpoints` / layouts médio-compacto de Balcão já existirem (Fase 2), reutilizar. Caso contrário, aplicar `LayoutBuilder` + constantes AGENTS §4.7 **nas telas tocadas** (`/price-check`, `/refund`, `/credit`, e Balcão no fluxo barcode) — FR-018 — sem implementar salão food.

**Rationale**: Spec Independência da Fase 2; gap §9 decisão 4.

**Alternatives considered**:
- *Bloquear Fase 3 até Fase 2* — rejeitada pela spec.
- *Só desktop expandido* — rejeitada por FR-018 / SC-008.

## 2. Código de barras no Balcão + quantidade × produto

**Decision**:
1. Substituir `_ToolbarField` decorativo por `TextField` real com controller, `onSubmitted`, foco operacional e `PdvTypography.bodyMd`.
2. Resolução: normalizar código (trim; fixture define zeros à esquerda) → lookup no catálogo → produto ou SKU.
3. Mesmo código sem variação: **incrementa quantidade na linha existente** (Assumption).
4. Quantidade × produto: estado efêmero `pendingQty` no controller do Balcão — operador digita N + confirmação (ENTER ou atalho documentado) **antes** do código; próximo código válido lança com qty N e zera `pendingQty`. N ≤ limite fixture (ex. 999).
5. Código inválido: snackbar/estado de erro na toolbar; carrinho intacto; foco permanece no campo.
6. Módulo `barcode` off: campo não lança (ausente ou disabled conforme UI — preferência: **esconder** o slot de barras se o módulo não for operacionalmente visível, mantendo busca).

Persistência do carrinho: mesma do turno/venda em curso (Fase 1); sem store novo.

**Rationale**: FR-001–003; SC-002; gap §6.1.

**Alternatives considered**:
- *Sempre nova linha ao bipar* — rejeitada (Assumption merge).
- *Leitor HID como stream separado* — adiado; teclado/campo cobre “bip” HID que digita + Enter.

## 3. Grade / variação

**Decision**: Produtos com `variants` na fixture abrem **`PdvDialogBody` large** (grade de células tamanho×cor) antes de adicionar. Células indisponíveis não selecionáveis. Confirmação só com combinação completa. Linha do carrinho guarda `skuId` + rótulos legíveis (`size`, `color`). Módulo `variant_grid` off → produtos tratados como unitários (fixture sem forçar grade) ou não oferecem grade.

UI: células com altura mínima `controlHeight` (56); tipografia `bodyMd`/`label`; botões Confirmar/Cancelar com `FilledButton` altura tema.

**Rationale**: FR-004; um Balcão só; desktop touch targets §4.8.

## 4. Peso / balança + dinheiro

**Decision**: Ver [weight-money.md](./contracts/weight-money.md).

- Produto `soldByWeight`: diálogo Filled com campo peso + preview `formatCents`.
- Cálculo: `roundHalfUp(pricePerKgCents * weightKg)` → `lineCents` (int).
- Preferência terminal balança (Fase 1): botão “Ler balança” preenche peso **simulado** da fixture; operador confirma.
- Carrinho: `weightKg` + `lineCents` (não recalcular com double na UI).

**Rationale**: FR-005/006/014; SC-003; AGENTS §4.6.

## 5. Consulta de preço

**Decision**:
- Novo módulo de tela `price_check` (Fase 0 não tinha id — **adicionar** ao catálogo + perfil Loja/Mercado).
- Rota `/price-check`; entrada Home e/ou atalho no Balcão se módulo visible.
- UI: campo Filled grande + resultado (nome, preço `amount*`); **zero** side-effect em `counterCartProvider`.
- Guard turno: **sim** (ação operacional Home), alinhado Fase 1.

**Rationale**: FR-007; Assumption id novo.

## 6. Devolução e crédito

**Decision**: Ver [refund-credit.md](./contracts/refund-credit.md).

- Rotas `/refund`, `/credit`; módulos existentes `refund` / `credit` (núcleo).
- Devolução: busca `SaleRecord` do turno (+ fixture histórica se necessário); seleção de quantidades elegíveis; estorno `cash` | `customer_credit` (meios da fixture); grava `RefundRecord`; dinheiro → ajusta esperado gaveta (Fase 1).
- Crédito: `CustomerCreditAccount` por cliente; saldo; extrato; `receivePayment` (abatimento); pagamento em dinheiro move gaveta.
- Persistência: `pdv.refund.v1`, `pdv.credit.v1`.
- Guards: turno open.

**Rationale**: FR-008–012, FR-017; SC-001/005/006/009.

**Alternatives considered**:
- *Vender fiado no Pagamento nesta fase* — fora (Out of Scope).
- *Só devolução total* — rejeitada (SC-005 parcial).

## 7. Navegação

**Decision**: Ver [navigation.md](./contracts/navigation.md). Home `V`→`/refund`, `C`→`/credit`; consulta → `/price-check`. Diálogos de grade/peso/qty = `showDialog`, não rotas.

## 8. TextField Filled + escala desktop (pedido do usuário)

**Decision** (espelha Fase 2 + reforço desktop):

1. Usar/criar `lib/ui/pdv_filled_field.dart` — canônico.
2. **Todo** campo em páginas/diálogos desta fase: Filled (`filled: true`, `inputFill`, underline tokens, `bodyMd` no texto).
3. Diálogos: `PdvDialogBody` + `dialogMdWidth` / `dialogLgWidth`; listas com busca → **large** + `dialogListHeight`.
4. Botões de ação principal: altura tema (`controlHeight` / `Lg`); **não** 36/40 px.
5. Tipografia operacional: mínimo `bodyMd` (17); títulos de diálogo `titleMd`/`titleLg` dos tokens; valores monetários `amount*` tabular.
6. Toolbar régua do Balcão: exceção AGENTS (flat); barcode vira TextField real com `bodyMd`. Diálogos disparados da toolbar = Filled + diálogo grande.
7. Proibido: `OutlineInputBorder` em forms novos; `fontSize` literal; larguras de diálogo hardcoded fora de `PdvSizes`.

**Rationale**: Pedido explícito no `/speckit-plan`; AGENTS §4.0.1, §4.8, §4.8.1; contrato [filled-fields.md](./contracts/filled-fields.md).

**Alternatives considered**:
- *Outlined Material 3* — rejeitada (usuário + contraste escuro).
- *Dialogs 360–480 px “mobile”* — rejeitada (caixa desktop).

## 9. Catálogo / fixture varejo

**Decision**: Estender `counter_catalog` (ou fixture dedicada) com: barcodes, variants (matriz), `pricePerKgCents`, produtos Loja/Mercado. Perfis: Loja liga `barcode`+`variant_grid`(+`price_check`); Mercado liga `barcode`+`scale`(+`price_check`); Restaurante desliga comportamentos varejo.

## 10. Fora / adiado

- Hardware real, TEF, NF, login, pareamento (Fase 4).
- Food salão (Fase 2).
- Fiado como meio no Pagamento; assistente único troca+nova venda.
- Goldens por perfil / integration_test (Fase 5).
