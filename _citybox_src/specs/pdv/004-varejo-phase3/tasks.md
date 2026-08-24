---
description: "Task list for PDV Varejo Fase 3"
---

# Tasks: PDV Varejo (Fase 3)

**Input**: Design documents from `/specs/pdv/004-varejo-phase3/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Incluídos — plan + Constitution/ECC mandam TDD RED → GREEN → REFACTOR; unit/widget da fase. Goldens/`integration_test` → Fase 5 do gap.

**Organization**: Tasks por user story (US1–US6). **Nota**: isto é a **Fase 3 do gap** (Varejo 🏬), independente da Fase 2 food. Já existentes no app (reusar): `lib/ui/pdv_filled_field.dart`, `lib/ui/pdv_dialog.dart`, `lib/core/layout/pdv_breakpoints.dart`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tasks incompletas)
- **[Story]**: US1–US6 conforme [spec.md](./spec.md)
- Caminhos: `apps/pdv/app/...`

## Path Conventions

App Flutter `apps/pdv/app` (`citybox_pdv`) — feature-first. Testes em `apps/pdv/app/test/{unit,widget}/`. Ciclo: `flutter analyze` + `flutter test` (não pnpm).

## User Story mapping

| US | Spec | Priority |
|----|------|----------|
| US1 | Código de barras funcional no Balcão (+ qty × produto) | P1 🎯 MVP |
| US2 | Grade e variação (tamanho, cor) | P1 |
| US3 | Produto por peso / balança | P1 |
| US4 | Consulta de preço | P1 |
| US5 | Devolução (`V`) | P1 |
| US6 | Crédito dos clientes (`C`) | P1 |

**UI transversal** (toda story): TextField **Filled** em páginas/diálogos; tipografia ≥ `bodyMd`; botões `controlHeight`/`Lg`; diálogos `PdvDialogBody` Md/Lg — [contracts/filled-fields.md](./contracts/filled-fields.md). Toolbar régua: barcode `TextField` real flat + `bodyMd`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Pastas, módulo `price_check`, confirmar helpers Filled/breakpoints sem mudar operação ainda.

- [X] T001 Criar esqueleto de pastas `apps/pdv/app/lib/features/price_check/{domain,application,presentation}/`, `apps/pdv/app/lib/features/refund/{domain,data,application,presentation}/`, `apps/pdv/app/lib/features/credit/{domain,data,application,presentation}/` conforme [plan.md](./plan.md)
- [X] T002 [P] Adicionar `PdvModuleIds.priceCheck = 'price_check'` em `apps/pdv/app/lib/features/modules/domain/module_ids.dart`; registrar definição (tela, opcional) em `apps/pdv/app/lib/features/modules/domain/pdv_module_definition.dart`; ligar em perfis Loja/Mercado e desligar em Restaurante em `apps/pdv/app/lib/features/modules/data/segment_profiles.dart`
- [X] T003 [P] Confirmar reuso de `apps/pdv/app/lib/ui/pdv_filled_field.dart`, `apps/pdv/app/lib/ui/pdv_dialog.dart` e `apps/pdv/app/lib/core/layout/pdv_breakpoints.dart` — se algum faltar no branch, criar conforme contratos Fase 2/3; não duplicar helpers
- [X] T004 [P] Adicionar ação Home **Consulta de preço** (id `price_check`, atalho a definir na entrega) em `apps/pdv/app/lib/features/home/data/home_actions.dart` + cor em `PdvActionColors` se necessário (`apps/pdv/app/lib/core/theme/pdv_tokens.dart`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Modelo de catálogo varejo, resolve de código, extensão de linha do carrinho, rotas/guards, wire Home V/C/consulta → placeholders. Suite existente permanece verde.

**⚠️ CRITICAL**: Nenhuma user story de UI completa começa antes desta fase (US1 pode compartilhar T011–T015).

- [X] T005 [P] Criar `ProductVariant` (+ atributos/preço/disponibilidade) em `apps/pdv/app/lib/features/counter/domain/product_variant.dart` ([data-model.md](./data-model.md))
- [X] T006 Estender `CounterProduct` com `barcodes`, `variants`, `soldByWeight`, `pricePerKgCents` (copyWith/toJson/fromJson) em `apps/pdv/app/lib/features/counter/domain/counter_product.dart` — depende de T005
- [X] T007 Estender `CounterCartLine` com `skuId`, `variantLabel`, `weightKg`, `lineCents` (+ merge key / totais) em `apps/pdv/app/lib/features/counter/domain/counter_cart_line.dart` e ajustar `CounterTotals` / `food_totals` se necessário em `apps/pdv/app/lib/features/counter/domain/`
- [X] T008 [P] Implementar `normalizeBarcode` + `BarcodeIndex` / `resolveBarcode` em `apps/pdv/app/lib/features/counter/domain/barcode_resolve.dart` ([contracts/retail-scan.md](./contracts/retail-scan.md))
- [X] T009 [P] Implementar `roundHalfUpToCents` / `weightLineCents` em `apps/pdv/app/lib/core/format/pdv_weight_money.dart` ([contracts/weight-money.md](./contracts/weight-money.md))
- [X] T010 Estender fixture do catálogo (códigos, SKUs, pesáveis) em `apps/pdv/app/lib/features/counter/data/counter_catalog.dart` (+ arquivo dedicado se preferir `retail_catalog_fixture.dart` no mesmo `data/`) — depende de T006
- [X] T011 Extender `CounterCartController` com `pendingQty`, `submitBarcode`, `addOrMergeLine`, limpar erro em `apps/pdv/app/lib/features/counter/application/counter_cart_controller.dart` (API mínima; UI depois) — depende de T007–T008–T010
- [X] T012 Extender `PdvRoutes` + `createPdvRouter` com `/price-check`, `/refund`, `/credit`; placeholders `Scaffold` ok; títulos; incluir no `_shiftProtectedPrefixes` em `apps/pdv/app/lib/app/router/pdv_router.dart` ([contracts/navigation.md](./contracts/navigation.md))
- [X] T013 Wire Home: `refund` → `/refund`, `credit` → `/credit`, `price_check` → `/price-check` (deixar de `showNotImplementedFeedback`) em `apps/pdv/app/lib/features/home/presentation/home_page.dart`
- [X] T014 Rodar `flutter analyze` + `flutter test` — suite pré-existente verde; atualizar testes de catálogo/módulos se T002 quebrar expectativas

**Checkpoint**: Catálogo varejo tipado + resolve + rotas/guards + Home navega para placeholders V/C/consulta.

---

## Phase 3: User Story 1 - Código de barras no Balcão (Priority: P1) 🎯 MVP

**Goal**: Campo de barras funcional na toolbar; qty × produto; merge na mesma linha; erro acionável; some se módulo `barcode` off.

**Independent Test**: Perfil Loja + turno → Balcão → códigos fixture no carrinho; qty×; inválido sem mudar carrinho; Restaurante sem barcode.

**Depends on**: Phase 2 (T008–T011).

### Tests for User Story 1 ⚠️

> **RED primeiro**

- [X] T015 [P] [US1] Teste unitário RED: normalize/lookup/miss/merge/`pendingQty` em `apps/pdv/app/test/unit/barcode_resolve_test.dart`
- [X] T016 [P] [US1] Teste unitário RED: `submitBarcode` + merge no controller em `apps/pdv/app/test/unit/counter_barcode_cart_test.dart`
- [X] T017 [P] [US1] Teste widget RED: submit código válido adiciona linha; inválido mostra erro; módulo off esconde campo em `apps/pdv/app/test/widget/counter_barcode_toolbar_test.dart`

### Implementation for User Story 1

- [X] T018 [US1] Substituir `_ToolbarField` decorativo por `TextField` real (controller, `onSubmitted`, foco, `PdvTypography.bodyMd`, régua flat) em `apps/pdv/app/lib/features/counter/presentation/widgets/counter_toolbar.dart`; esconder se `!isOperationallyVisible(barcode)`
- [X] T019 [US1] UX quantidade × produto (estado `pendingQty` + feedback visual na toolbar ou chip) em `apps/pdv/app/lib/features/counter/presentation/widgets/counter_toolbar.dart` e/ou widget irmão em `presentation/widgets/`
- [X] T020 [US1] Completar GREEN T015–T017; carrinho limpa campo após sucesso; `flutter analyze` limpo

**Checkpoint**: SC-002 parcial (bipagens); FR-001–003.

---

## Phase 4: User Story 2 - Grade e variação (Priority: P1)

**Goal**: Produto com variantes abre diálogo large; SKU no carrinho; indisponível bloqueado; módulo `variant_grid`.

**Independent Test**: Selecionar produto com grade → escolher → linha com rótulo; sem grade = lançamento direto; módulo off.

**Depends on**: Phase 2 (T005–T007); US1 recomendado se entrada for por código sem SKU.

### Tests for User Story 2 ⚠️

- [X] T021 [P] [US2] Teste unitário RED: seleção de variante / célula unavailable em `apps/pdv/app/test/unit/product_variant_grid_test.dart`
- [X] T022 [P] [US2] Teste widget RED: diálogo exige combinação completa; confirma adiciona `skuId`/`variantLabel` em `apps/pdv/app/test/widget/variant_grid_dialog_test.dart`

### Implementation for User Story 2

- [X] T023 [US2] Implementar `VariantGridDialog` com `PdvDialogBody` **large**, células ≥ `controlHeight`, Filled se houver busca, em `apps/pdv/app/lib/features/counter/presentation/widgets/variant_grid_dialog.dart`
- [X] T024 [US2] No lançamento (grade de produtos + resolve barcode sem sku): se `variant_grid` visible e `variants.isNotEmpty`, abrir diálogo antes de add em `apps/pdv/app/lib/features/counter/presentation/counter_page.dart` / `counter_product_grid.dart` / controller
- [X] T025 [US2] Exibir `variantLabel` na tabela do carrinho em `apps/pdv/app/lib/features/counter/presentation/widgets/counter_cart_table.dart` (ou equivalente); GREEN T021–T022

**Checkpoint**: FR-004; SC-007 parcial (módulo off).

---

## Phase 5: User Story 3 - Peso / balança (Priority: P1)

**Goal**: Diálogo de peso Filled; half-up centavos; simulação de balança via settings; módulo `scale`.

**Independent Test**: Produto pesável → peso → `lineCents` correto; inválido bloqueia; módulo off.

**Depends on**: Phase 2 (T009); US1 se entrada por barcode.

### Tests for User Story 3 ⚠️

- [X] T026 [P] [US3] Teste unitário RED: tabela half-up peso→centavos em `apps/pdv/app/test/unit/pdv_weight_money_test.dart`
- [X] T027 [P] [US3] Teste widget RED: confirmar peso grava linha com `weightKg`/`lineCents`; peso ≤0 impede em `apps/pdv/app/test/widget/scale_weight_dialog_test.dart`

### Implementation for User Story 3

- [X] T028 [US3] Implementar `ScaleWeightDialog` (`PdvDialogBody` medium/large, `PdvFilledField`, preview `formatCents`, botão “Ler balança” se settings) em `apps/pdv/app/lib/features/counter/presentation/widgets/scale_weight_dialog.dart`
- [X] T029 [US3] No lançamento/barcode de `soldByWeight` + módulo `scale`: abrir diálogo; bloquear se `pendingQty` set ([retail-scan.md](./contracts/retail-scan.md)); integrar settings em `apps/pdv/app/lib/features/settings/` (leitura apenas)
- [X] T030 [US3] Totais do carrinho usam `lineCents` para linhas pesáveis em `apps/pdv/app/lib/features/counter/domain/counter_totals.dart` (e painel); GREEN T026–T027

**Checkpoint**: SC-003; FR-005/006/014.

---

## Phase 6: User Story 4 - Consulta de preço (Priority: P1)

**Goal**: Tela `/price-check` com Filled; mostra preço sem tocar no carrinho; Home + guard turno; módulo `price_check`.

**Independent Test**: Código válido → nome/preço; carrinho paralelo intacto; módulo off esconde; sem turno → caixa.

**Depends on**: Phase 2 (T008, T012–T013); reusa resolve barcode.

### Tests for User Story 4 ⚠️

- [X] T031 [P] [US4] Teste widget RED: consulta válida não altera `counterCartProvider`; inválido erro; Filled `inputFill` em `apps/pdv/app/test/widget/price_check_page_test.dart`
- [X] T032 [P] [US4] Teste widget RED: Home `price_check` → `/price-check` com turno; sem turno → `/cash` em `apps/pdv/app/test/widget/home_price_check_navigation_test.dart`

### Implementation for User Story 4

- [X] T033 [US4] Implementar `PriceCheckPage` (campo Filled grande, resultado `amount*`, layout `PdvFormat`) em `apps/pdv/app/lib/features/price_check/presentation/price_check_page.dart`
- [X] T034 [US4] Ligar rota `/price-check` à página real; application mínimo se precisar em `apps/pdv/app/lib/features/price_check/application/`; GREEN T031–T032

**Checkpoint**: SC-004; FR-007.

---

## Phase 7: User Story 5 - Devolução (Priority: P1)

**Goal**: `/refund` completo; elegibilidade; estorno cash/credit; gaveta; persistência `pdv.refund.v1`; Home `V`.

**Independent Test**: `V` → buscar venda → devolução parcial → comprovante; qty inválida bloqueia; sem turno → caixa.

**Depends on**: Phase 2 rotas; `SaleRecord` / histórico Fase 1.

### Tests for User Story 5 ⚠️

- [X] T035 [P] [US5] Teste unitário RED: elegibilidade qty / total / rejeita over-refund em `apps/pdv/app/test/unit/refund_controller_test.dart`
- [X] T036 [P] [US5] Teste unitário RED: round-trip `pdv.refund.v1` + impacto gaveta cash em `apps/pdv/app/test/unit/refund_store_test.dart`
- [X] T037 [P] [US5] Teste widget RED: Home `V` → `/refund`; Filled + diálogo Md; sem turno → cash em `apps/pdv/app/test/widget/home_refund_navigation_test.dart`

### Implementation for User Story 5

- [X] T038 [US5] Models `RefundLine` / `RefundRecord` em `apps/pdv/app/lib/features/refund/domain/` ([data-model.md](./data-model.md), [contracts/refund-credit.md](./contracts/refund-credit.md))
- [X] T039 [US5] `SharedPreferencesRefundStore` (`pdv.refund.v1`) em `apps/pdv/app/lib/features/refund/data/shared_preferences_refund_store.dart`
- [X] T040 [US5] `RefundController`: busca vendas, calcula elegível, confirma estorno, atualiza gaveta/`SaleRecord` returned qty em `apps/pdv/app/lib/features/refund/application/refund_controller.dart` (+ integração `cash_shift_controller` / sales history)
- [X] T041 [US5] UI `RefundPage` + widgets (busca Filled, steppers, método, comprovante `PdvDialogBody` medium, breakpoints) em `apps/pdv/app/lib/features/refund/presentation/refund_page.dart` e `presentation/widgets/`
- [X] T042 [US5] Ligar rota `/refund`; GREEN T035–T037

**Checkpoint**: SC-001 parcial (`V`); SC-005; SC-009 parcial.

---

## Phase 8: User Story 6 - Crédito dos clientes (Priority: P1)

**Goal**: `/credit` saldo/extrato/receber; persistência `pdv.credit.v1`; Home `C`; Filled + desktop.

**Independent Test**: `C` → cliente → pagamento parcial → saldo/extrato; valor inválido bloqueia; empty state.

**Depends on**: Phase 2; reuso catálogo customer; opcional integração estorno `customer_credit` da US5.

### Tests for User Story 6 ⚠️

- [X] T043 [P] [US6] Teste unitário RED: payment ≤ balance; rejeita amount inválido; ledger em `apps/pdv/app/test/unit/credit_controller_test.dart`
- [X] T044 [P] [US6] Teste unitário RED: round-trip `pdv.credit.v1` em `apps/pdv/app/test/unit/credit_store_test.dart`
- [X] T045 [P] [US6] Teste widget RED: Home `C` → `/credit`; Filled receber; empty extrato em `apps/pdv/app/test/widget/credit_page_test.dart`

### Implementation for User Story 6

- [X] T046 [US6] Models `CustomerCreditAccount` / `CreditLedgerEntry` em `apps/pdv/app/lib/features/credit/domain/`
- [X] T047 [US6] Fixture seed de saldos + `SharedPreferencesCreditStore` (`pdv.credit.v1`) em `apps/pdv/app/lib/features/credit/data/`
- [X] T048 [US6] `CreditController`: list/search, receivePayment (gaveta se cash), `credit_from_refund` API para US5 em `apps/pdv/app/lib/features/credit/application/credit_controller.dart`
- [X] T049 [US6] UI `CreditPage` (`PdvStatCard` saldo, lista extrato, diálogo receber Filled, breakpoints) em `apps/pdv/app/lib/features/credit/presentation/credit_page.dart` e `presentation/widgets/`
- [X] T050 [US6] Ligar rota `/credit`; se US5 já existir, wire `refundMethod=customer_credit` → credit store; GREEN T043–T045

**Checkpoint**: SC-001 (`C`); SC-006; SC-009.

---

## Phase 9: Polish & Cross-Cutting

**Purpose**: Perfis, breakpoints nas telas novas, AGENTS, smoke quickstart.

- [X] T051 [P] Widget/perfil: Loja/Mercado ligam barcode/scale/variant/price_check; Restaurante desliga behaviors varejo; núcleo refund/credit conforme catálogo — teste em `apps/pdv/app/test/widget/retail_profile_modules_test.dart` (ou estender `pdv_module_catalog_test.dart` / home tests)
- [X] T052 Garantir layouts `PdvFormat` em `/price-check`, `/refund`, `/credit` (~800 px) sem overflow crítico em `apps/pdv/app/lib/features/{price_check,refund,credit}/presentation/`
- [X] T053 Passada Filled + diálogos Md/Lg: nenhum form novo outlined; botões sem 36/40 px — checklist [filled-fields.md](./contracts/filled-fields.md)
- [X] T054 Atualizar `apps/pdv/app/AGENTS.md` (features varejo, `price_check`, barcode/grade/scale, refund/credit, reforço Filled/desktop, histórico)
- [X] T055 Rodar smoke [quickstart.md](./quickstart.md): `flutter analyze` + `flutter test` verdes; validar cenários 1–10 manualmente no Linux se possível

---

## Dependencies & Execution Order

### Phase dependency

```text
Phase 1 Setup
    ↓
Phase 2 Foundational
    ↓
US1 Barcode (MVP) ──┬──→ US2 Grade (código sem SKU)
                     └──→ US3 Peso (código pesável)
Phase 2 ───────────────→ US4 Consulta (paralelo a US1 após T008/T012)
Phase 2 ───────────────→ US5 Devolução
US5 (opcional wire) ───→ US6 Crédito (pode começar em paralelo; wire estorno no fim)
    ↓
Phase 9 Polish
```

### User story independence

| Story | Independência |
|-------|----------------|
| US1 | MVP sozinho após Phase 2 |
| US2 | Precisa models Phase 2; melhor após US1 |
| US3 | Precisa T009; melhor após US1 |
| US4 | Paralelo a US1 após rotas + resolve |
| US5 | Paralelo a US1–US4 após rotas (vendas Fase 1) |
| US6 | Paralelo a US5; integrar `customer_credit` depois |

### Parallel opportunities

- Phase 1: T002 ∥ T003 ∥ T004
- Phase 2: T005 ∥ T008 ∥ T009; depois T006→T007→T010→T011; T012∥T013
- Dentro de cada US: testes `[P]` em paralelo antes da impl
- Após Phase 2: **US4 ∥ US5 ∥ US1**; US2/US3 após barcode mínimo; US6 ∥ US5 domain

### Parallel example (após Phase 2)

```bash
# Terminal A: US1 barcode toolbar + tests
# Terminal B: US4 price check page + tests
# Terminal C: US5 refund domain/store + tests
```

---

## Implementation Strategy

### MVP (só US1)

1. Phase 1–2  
2. US1 barcode + qty × + merge  
3. **STOP and VALIDATE**: quickstart cenário 1 + analyze/test  

### Incremental delivery

1. MVP US1 → 2. US2 grade → 3. US3 peso → 4. US4 consulta → 5. US5 devolução → 6. US6 crédito → 7. Polish AGENTS  

### Format validation

- Todas as tasks: `- [ ]`, ID `Tnnn`, paths `apps/pdv/app/...`
- Story phases: labels `[US1]`…`[US6]`
- Setup/Foundational/Polish: sem label de story
- `[P]` só onde arquivos/trabalho paralelo é seguro

---

## Summary

| Métrica | Valor |
|---------|--------|
| **Total tasks** | 55 (T001–T055) |
| **Setup + Foundational** | T001–T014 (14) |
| **US1** | T015–T020 (6) |
| **US2** | T021–T025 (5) |
| **US3** | T026–T030 (5) |
| **US4** | T031–T034 (4) |
| **US5** | T035–T042 (8) |
| **US6** | T043–T050 (8) |
| **Polish** | T051–T055 (5) |
| **MVP** | Phase 1–2 + US1 |
| **Parallel** | US4∥US5∥US1 após fundação; testes [P] por story |

**Próximo passo**: implementar a partir de T001 (ou `/speckit-implement`), TDD RED→GREEN por story.
