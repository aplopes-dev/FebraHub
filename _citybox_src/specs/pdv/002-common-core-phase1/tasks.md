---
description: "Task list for PDV Núcleo Comum Fase 1"
---

# Tasks: PDV Núcleo Comum (Fase 1)

**Input**: Design documents from `/specs/pdv/002-common-core-phase1/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Incluídos — Assumptions da spec pedem cobertura unit/widget; Constitution/ECC mandam TDD RED → GREEN → REFACTOR. Goldens/`integration_test` ficam para Fase 5 do gap.

**Organization**: Tasks por user story (US1–US6). **Nota**: isto é a **Fase 1 do gap** (núcleo ⬛), não a Fase 2 (Food/Mesas).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tasks incompletas)
- **[Story]**: US1–US6 conforme [spec.md](./spec.md)
- Caminhos: `apps/pdv/app/...`

## Path Conventions

App Flutter `apps/pdv/app` (`citybox_pdv`) — feature-first. Testes em `apps/pdv/app/test/{unit,widget}/`. Ciclo: `flutter analyze` + `flutter test` (não pnpm).

## User Story mapping

| US | Spec | Priority |
|----|------|----------|
| US1 | Hub Caixa — abrir/fechar turno | P1 🎯 MVP |
| US2 | Sangria / reforço | P1 |
| US3 | Últimas vendas + detalhe | P1 |
| US4 | Configurações + módulos read-only | P1 |
| US5 | Desconto XOR acréscimo na venda | P1 |
| US6 | Vendedor na Home (F9) | P2 |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Esqueleto de pastas e ids sem mudar comportamento operacional ainda.

- [X] T001 Criar esqueleto de pastas (vazias só com `.gitkeep` se necessário, ou primeiro arquivo em T00x) `apps/pdv/app/lib/features/cash/{domain,data,application,presentation}/`, `apps/pdv/app/lib/features/sales_history/{domain,application,presentation}/`, `apps/pdv/app/lib/features/settings/{domain,data,application,presentation}/` conforme [plan.md](./plan.md)
- [X] T002 [P] Adicionar `PdvModuleIds.cashHub = 'cash_hub'` e entrada no catálogo `pdvModuleCatalog` como **core** / screen em `apps/pdv/app/lib/features/modules/domain/module_ids.dart` e `apps/pdv/app/lib/features/modules/domain/pdv_module_definition.dart`; incluir `cash_hub` nos 4 perfis em `apps/pdv/app/lib/features/modules/data/segment_profiles.dart` e no validator de núcleo
- [X] T003 [P] Adicionar `HomeAction` do hub Caixa (rail, atalho a definir sem colidir — ex. tecla sem conflito com S/U/Ç) em `apps/pdv/app/lib/features/home/data/home_actions.dart` e cor em `PdvActionColors` se precisar em `apps/pdv/app/lib/core/theme/pdv_tokens.dart` — destino ainda pode ser not-implemented até US1

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Domínio de turno + persistência + gate de navegação + `isCash` — base para US1–US3. App continua compilando; suite existente verde.

**⚠️ CRITICAL**: Nenhuma user story de caixa/histórico começa antes desta fase.

- [X] T004 [P] Criar enums/status `CashShiftStatus`, `CashMovementType`, `SaleRecordStatus` em `apps/pdv/app/lib/features/cash/domain/cash_enums.dart` ([data-model.md](./data-model.md))
- [X] T005 [P] Criar models imutáveis `CashMovement`, `SaleLineSnapshot`, `SalePaymentSnapshot`, `SaleRecord` (com `cashNetCents`) em `apps/pdv/app/lib/features/cash/domain/cash_movement.dart` e `apps/pdv/app/lib/features/cash/domain/sale_record.dart`
- [X] T006 Criar `CashShift` + função pura `expectedDrawerCents(CashShift)` em `apps/pdv/app/lib/features/cash/domain/cash_shift.dart` e `apps/pdv/app/lib/features/cash/domain/expected_drawer.dart` ([contracts/cash-shift.md](./contracts/cash-shift.md)) — depende de T004–T005
- [X] T007 [P] Marcar meio dinheiro: `PaymentMethod.isCash` (ou `id == 'cash'`) em `apps/pdv/app/lib/features/payment/domain/payment_method.dart` e fixture `apps/pdv/app/lib/features/payment/data/payment_catalog.dart`
- [X] T008 Implementar serialização JSON + `SharedPreferencesCashShiftStore` (chave `pdv.cash_shift.v1`) em `apps/pdv/app/lib/features/cash/data/shared_preferences_cash_shift_store.dart`
- [X] T009 Implementar `CashShiftController` / provider: hydrate no `build()`, `hasOpenShift`, `openShift`, `closeShift` (stub UI depois), `saleInProgress` lendo cart/payment providers, persist após mutação em `apps/pdv/app/lib/features/cash/application/cash_shift_controller.dart` — depende de T006–T008
- [X] T010 Estender `PdvRoutes` + `createPdvRouter` com paths `/cash`, `/cash/movement`, `/sales`, `/sales/:id`, `/settings` (placeholders `Scaffold`/`Text` temporários ok) e sync de títulos em `apps/pdv/app/lib/app/router/pdv_router.dart` ([contracts/navigation.md](./contracts/navigation.md))
- [X] T011 Implementar redirect guard (sem turno open → `/cash?intent=open`) para `/counter`, `/payment`, `/cash/movement`, `/sales`, `/sales/:id` em `apps/pdv/app/lib/app/router/pdv_router.dart` (ou `apps/pdv/app/lib/app/router/cash_shift_guard.dart`) usando `CashShiftController` — depende de T009–T010
- [X] T012 [P] Helper `computeCashNetCents` a partir de pagamentos + troco em `apps/pdv/app/lib/features/cash/domain/cash_net.dart` (usa T007)
- [X] T013 Rodar `flutter analyze` + `flutter test` — suite pré-existente verde; ajustar overrides de teste se o router/guard exigir `ProviderScope` com cash store fake

**Checkpoint**: Turno persistível + rotas + guard; placeholders nas rotas novas.

---

## Phase 3: User Story 1 - Hub Caixa abrir/fechar turno (Priority: P1) 🎯 MVP

**Goal**: Hub Caixa com status, abrir (fundo ≥0), fechar (contado + diferença); interceptações sem turno levam ao hub; Configurações/Vendedor livres; bloqueio de fechar com venda em curso; persistência sobrevive reinício.

**Independent Test**: Sem turno → Balcão cai no hub; abrir → vender (quando US5/pagamento ok) / fechar; fechar com carrinho bloqueia; kill app restaura turno open.

**Depends on**: Phase 2.

### Tests for User Story 1 ⚠️

> **RED primeiro**

- [X] T014 [P] [US1] Teste unitário: `expectedDrawerCents` com fundo/reforço/sangria/venda cash/venda só cartão em `apps/pdv/app/test/unit/expected_drawer_test.dart`
- [X] T015 [P] [US1] Teste unitário: `openShift` / segundo open rejeitado / `closeShift` com `saleInProgress` rejeitado em `apps/pdv/app/test/unit/cash_shift_controller_test.dart`
- [X] T016 [P] [US1] Teste unitário: round-trip persistência restaura turno open (fake SharedPreferences) em `apps/pdv/app/test/unit/cash_shift_store_test.dart`
- [X] T017 [P] [US1] Teste widget: navegação para `/counter` sem turno redireciona para `/cash` em `apps/pdv/app/test/widget/cash_shift_guard_test.dart`

### Implementation for User Story 1

- [X] T018 [US1] UI hub: `CashHubPage` (status, abrir, fechar, atalho sangria desabilitado até US2) em `apps/pdv/app/lib/features/cash/presentation/cash_hub_page.dart` + widgets em `apps/pdv/app/lib/features/cash/presentation/widgets/`
- [X] T019 [US1] Fluxos abrir (`CashOpenSheet`/`dialog` fundo em centavos) e fechar (`CashCloseSheet` resumo expected/contado/diferença) em `apps/pdv/app/lib/features/cash/presentation/`; GREEN T015
- [X] T020 [US1] Ligar rota `/cash` ao hub; Home ação `cash_hub` → `/cash`; query `intent=open` foca abertura em `apps/pdv/app/lib/features/home/presentation/home_page.dart` e router
- [X] T021 [US1] Confirmar `/settings` e diálogo vendedor **não** passam pelo guard; GREEN T017; `flutter analyze` limpo

**Checkpoint**: MVP — turno abre/fecha e bloqueia operação sem caixa.

---

## Phase 4: User Story 2 - Sangria / reforço (Priority: P1)

**Goal**: Movimentos com motivo, comprovante visual, atualizam expected; Home `S` e atalho no hub; validação amount/motivo.

**Independent Test**: Com turno open, sangria/reforço alteram expected e aparecem no fechamento; sem turno, `S` → hub.

**Depends on**: US1 (turno open).

### Tests for User Story 2 ⚠️

- [X] T022 [P] [US2] Teste unitário RED: withdrawal/reinforcement validam amount&gt;0 e reason; atualizam expected em `apps/pdv/app/test/unit/cash_movement_test.dart` / extender `cash_shift_controller_test.dart`
- [X] T023 [P] [US2] Teste widget RED: Home `S` / módulo `cash_drawer` navega para `/cash/movement` (com turno) em `apps/pdv/app/test/widget/home_cash_drawer_navigation_test.dart`

### Implementation for User Story 2

- [X] T024 [US2] `addWithdrawal` / `addReinforcement` no controller (+ confirmação se withdrawal &gt; expected) em `apps/pdv/app/lib/features/cash/application/cash_shift_controller.dart`
- [X] T025 [US2] Página `CashMovementPage` (tipo sangria/reforço, valor centavos, motivo) + `CashReceiptDialog` (imprimir simulado) em `apps/pdv/app/lib/features/cash/presentation/cash_movement_page.dart` e widgets
- [X] T026 [US2] Rota `/cash/movement`; Home `S` → destino real; atalho no hub; GREEN T022–T023

**Checkpoint**: SC-002 para `S`; SC-004 parcial (movimentos).

---

## Phase 5: User Story 3 - Últimas vendas (Priority: P1)

**Goal**: Lista do turno, detalhe, reimpressão fixture, cancelamento com estorno só cash líquido; Home `U`.

**Independent Test**: Finalizar venda → aparece em `/sales` → detalhe → cancelar → expected cai só o cash net.

**Depends on**: US1 + registro de venda no finalize (T027–T028).

### Tests for User Story 3 ⚠️

- [X] T027 [P] [US3] Teste unitário RED: `recordSale` / `cancelSale` e impacto em `expectedDrawerCents` em `apps/pdv/app/test/unit/sale_record_cash_test.dart`
- [X] T028 [P] [US3] Teste widget RED: lista vazia usa `PdvEmptyState`; lista com fixture mostra total/status em `apps/pdv/app/test/widget/sales_history_page_test.dart`

### Implementation for User Story 3

- [X] T029 [US3] No fluxo de venda finalizada, montar `SaleRecord` (snapshots + `cashNetCents` via T012) e `recordSale` **antes** de limpar carrinho/pagamentos em `apps/pdv/app/lib/features/payment/presentation/sale_completed_page.dart` e/ou application dedicada `apps/pdv/app/lib/features/cash/application/record_sale_on_complete.dart`
- [X] T030 [US3] `SalesHistoryController` com page/search sobre vendas do turno open em `apps/pdv/app/lib/features/sales_history/application/sales_history_controller.dart` (FR-007 — filtrar no application, não na presentation)
- [X] T031 [US3] `SalesHistoryPage` + `SaleDetailPage` (reimpressão dialog fixture; cancelar com confirmação) em `apps/pdv/app/lib/features/sales_history/presentation/`
- [X] T032 [US3] Rotas `/sales`, `/sales/:id`; Home `U` → `/sales`; GREEN T027–T028

**Checkpoint**: SC-002 `U`; SC-004 com vendas em dinheiro.

---

## Phase 6: User Story 4 - Configurações + módulos read-only (Priority: P1)

**Goal**: `/settings` pelas 3 entradas; preferências locais; módulos só leitura “configurado no ERP”; sem escrita de módulos de produto.

**Independent Test**: Home/Balcão/Pagamento → mesma settings; perfil Loja explica Comandas; release sem painel debug.

**Depends on**: Phase 2 rotas; módulos Fase 0.

### Tests for User Story 4 ⚠️

- [X] T033 [P] [US4] Teste unitário RED: load/save `TerminalSettings` em `apps/pdv/app/test/unit/terminal_settings_store_test.dart`
- [X] T034 [P] [US4] Teste widget RED: seção módulos sem Switch/toggle de escrita; mostra estado em `apps/pdv/app/test/widget/settings_modules_readonly_test.dart`
- [X] T035 [P] [US4] Teste widget RED: três entry points Home/Balcão/Pagamento navegam `/settings` (não not-implemented) em `apps/pdv/app/test/widget/settings_entry_points_test.dart`

### Implementation for User Story 4

- [X] T036 [P] [US4] Model + store `TerminalSettings` / `pdv.terminal_settings.v1` em `apps/pdv/app/lib/features/settings/domain/terminal_settings.dart` e `apps/pdv/app/lib/features/settings/data/shared_preferences_terminal_settings_store.dart`
- [X] T037 [US4] `SettingsPage` com form de preferências + `ModulesReadOnlySection` (lê `moduleVisibilityProvider` / snapshot) em `apps/pdv/app/lib/features/settings/presentation/settings_page.dart` e widgets — texto ERP; GREEN T034
- [X] T038 [US4] Ligar Home `Ç`, botões Configurações do Balcão e Pagamento → `/settings` em `home_page.dart`, `counter_app_bar.dart`, `payment_app_bar.dart`; GREEN T035

**Checkpoint**: SC-003, SC-006.

---

## Phase 7: User Story 5 - Desconto XOR acréscimo na venda (Priority: P1)

**Goal**: Um ajuste de venda (discount|surcharge × percent|amount); substitui o outro; ordem linhas → ajuste; total ≥ 0; painel editável.

**Independent Test**: 10% off → trocar por acréscimo em valor; totais em centavos batem contrato.

**Depends on**: counter/payment já em cents (Fase 0). Pode paralelizar com US4 após Phase 2, mas ideal após MVP turno se quiser validar SC-001 E2E.

### Tests for User Story 5 ⚠️

- [X] T039 [P] [US5] Teste unitário RED: ordem de cálculo e XOR kind em `apps/pdv/app/test/unit/sale_adjustment_test.dart` ([contracts/sale-adjustment.md](./contracts/sale-adjustment.md))
- [X] T040 [P] [US5] Teste unitário RED: total nunca negativo; carrinho vazio sem ajuste efetivo em `apps/pdv/app/test/unit/counter_totals_with_adjustment_test.dart`

### Implementation for User Story 5

- [X] T041 [P] [US5] Model `SaleAdjustment` em `apps/pdv/app/lib/features/counter/domain/sale_adjustment.dart`
- [X] T042 [US5] Controller/provider do ajuste + integrar em `counter_totals_provider` / `CounterTotals` em `apps/pdv/app/lib/features/counter/application/`; limpar ajuste ao esvaziar carrinho e na venda finalizada
- [X] T043 [US5] UI no painel de totais (`counter_totals_panel.dart` + widget de edição) — desconto/acréscimo editáveis; GREEN T039–T040
- [X] T044 [US5] Incluir snapshot do ajuste em `SaleRecord` no T029 (se já mergeado, atualizar) em fluxo de finalização

**Checkpoint**: SC-005.

---

## Phase 8: User Story 6 - Vendedor na Home F9 (Priority: P2)

**Goal**: Home `F9` / bloco Vendedor abre `SellerPickerDialog` existente; persiste em `saleSellerProvider`; respeita módulo.

**Independent Test**: F9 abre seletor; escolha aparece no Pagamento; módulo off esconde ação.

**Depends on**: Fase 0 seller dialog; sem dependência de turno (Q1).

### Tests for User Story 6 ⚠️

- [X] T045 [P] [US6] Teste widget RED: Home F9/bloco abre picker (não not-implemented) quando `seller` available em `apps/pdv/app/test/widget/home_seller_action_test.dart`
- [X] T046 [P] [US6] Teste widget RED: `seller` disabled → ação ausente / atalho morto em `apps/pdv/app/test/widget/home_seller_hidden_test.dart`

### Implementation for User Story 6

- [X] T047 [US6] Em `apps/pdv/app/lib/features/home/presentation/home_page.dart` (e handler de ações), ligar `PdvModuleIds.seller` ao mesmo fluxo de `seller_picker_dialog.dart` / `saleSellerProvider` usado no Pagamento; GREEN T045–T046

**Checkpoint**: SC-002 `F9`.

---

## Phase 9: Polish & Cross-Cutting

**Purpose**: Docs-as-code, regressão, quickstart.

- [X] T048 Atualizar `apps/pdv/app/AGENTS.md` — status Fase 1, estrutura `cash`/`sales_history`/`settings`, regras de turno/guard, `cash_hub`, histórico de mudanças estruturais
- [X] T049 [P] Garantir estados vazios/erro usam `PdvEmptyState`/`PdvErrorState`/`PdvLoadingState` nas listas novas (`sales_history`, movimentos) em presentation correspondente
- [X] T050 [P] Remover `showNotImplementedFeedback` remanescente para S/U/Ç/F9/Caixa/Configurações nas app bars em `home_page.dart`, `counter_app_bar.dart`, `payment_app_bar.dart`
- [X] T051 Rodar suite completa `flutter analyze` + `flutter test` em `apps/pdv/app`; corrigir regressões de guard/router nos testes antigos
- [X] T052 Validar cenários manuais 1–8 de [quickstart.md](./quickstart.md) (pelo menos ciclo turno + guards + XOR + persistência)

---

## Dependencies & Execution Order

### Phase order

```text
Phase 1 Setup → Phase 2 Foundational → US1 (MVP) → US2 → US3
                                              ↘ US4 (após T010 settings route)
                                              ↘ US5 (após Fase 0 cents; paralelo a US4)
US6 paralelo a US4/US5 (só Home)
Phase 9 Polish por último
```

### Story dependencies

- **US1** bloqueia US2 e US3 (turno).
- **US3** precisa de `recordSale` no finalize (pode começar models em paralelo após US1).
- **US4** e **US5** e **US6** independentes entre si após Phase 2 / Fase 0.
- **US5** deve estar mergeada antes de considerar SC-001 E2E completo com desconto.

### Parallel opportunities

- T002∥T003; T004∥T005∥T007; T014∥T015∥T016∥T017
- Após US1: US4 ∥ US5 ∥ US6; US2 em série com US1; US3 após recordSale
- T033∥T034∥T035; T039∥T040∥T041; T045∥T046

### Parallel example (após Phase 2)

```bash
# Terminal A: US1 hub UI
# Terminal B: US5 sale adjustment domain+tests (não precisa turno)
# Terminal C: US6 home seller wiring
```

---

## Implementation Strategy

### MVP (só US1)

1. Phase 1–2  
2. US1 hub + open/close + guard + persistência  
3. **STOP and VALIDATE**: quickstart cenários 2 e 7 (guards + persist) + abrir/fechar  

### Incremental delivery

1. MVP US1 → 2. US2 sangria → 3. US3 histórico (fecha SC-004) → 4. US4 settings → 5. US5 ajuste → 6. US6 F9 → 7. Polish AGENTS  

### Format validation

- Todas as tasks: `- [ ]`, ID `Tnnn`, paths `apps/pdv/app/...`
- Story phases: labels `[US1]`…`[US6]`
- Setup/Foundational/Polish: sem label de story
- `[P]` só onde arquivos/trabalho paralelo é seguro

---

## Summary

| Métrica | Valor |
|---------|--------|
| **Total tasks** | 52 (T001–T052) |
| **US1** | T014–T021 (8) + fundação compartilhada |
| **US2** | T022–T026 (5) |
| **US3** | T027–T032 (6) |
| **US4** | T033–T038 (6) |
| **US5** | T039–T044 (6) |
| **US6** | T045–T047 (3) |
| **Setup + Foundational + Polish** | T001–T013 + T048–T052 |
| **MVP** | Phase 1–2 + US1 |
| **Parallel** | US4∥US5∥US6 após fundação; testes [P] dentro de cada story |

**Próximo passo**: implementar a partir de T001 (ou `/speckit-implement` se disponível), TDD RED→GREEN por story.
