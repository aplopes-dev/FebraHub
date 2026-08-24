---
description: "Task list for PDV Food Fase 2"
---

# Tasks: PDV Food (Fase 2)

**Input**: Design documents from `/specs/pdv/003-food-phase2/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Incluídos — plan + Constitution/ECC mandam TDD RED → GREEN → REFACTOR; Assumptions da spec pedem unit/widget. Goldens/`integration_test` → Fase 5 do gap.

**Organization**: Tasks por user story (US1–US7). **Nota**: isto é a **Fase 2 do gap** (Food 🍽), não a Fase 3 (varejo).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tasks incompletas)
- **[Story]**: US1–US7 conforme [spec.md](./spec.md)
- Caminhos: `apps/pdv/app/...`

## Path Conventions

App Flutter `apps/pdv/app` (`citybox_pdv`) — feature-first. Testes em `apps/pdv/app/test/{unit,widget}/`. Ciclo: `flutter analyze` + `flutter test` (não pnpm).

## User Story mapping

| US | Spec | Priority |
|----|------|----------|
| US1 | Layouts compacto / médio / expandido | P1 🎯 MVP (base tablet) |
| US2 | Mapa de mesas | P1 |
| US3 | Comandas | P1 |
| US4 | Fila de atendimentos | P2 |
| US5 | Blocos food no Balcão | P1 |
| US6 | Taxa de serviço e couvert | P1 |
| US7 | Delivery + pedidos | P2 |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Pastas, helper Filled e esqueleto sem mudar operação ainda.

- [X] T001 Criar esqueleto de pastas `apps/pdv/app/lib/features/tables/{domain,data,application,presentation}/`, `apps/pdv/app/lib/features/tabs/{domain,application,presentation}/`, `apps/pdv/app/lib/features/service/{domain,application,presentation}/`, `apps/pdv/app/lib/features/delivery/{domain,data,application,presentation}/`, `apps/pdv/app/lib/core/layout/` conforme [plan.md](./plan.md)
- [X] T002 [P] Extrair `pdvFilledDecoration` + `PdvFilledField` para `apps/pdv/app/lib/ui/pdv_filled_field.dart` a partir de `apps/pdv/app/lib/features/customer/presentation/widgets/customer_form_field.dart`; fazer `CustomerFormField` delegar ao helper ([contracts/filled-fields.md](./contracts/filled-fields.md))
- [X] T003 [P] Confirmar ids food já no catálogo (`tables`, `tabs`, `service`, `delivery`, `delivery_orders`, `item_addon`, `kitchen_note`, `half_pizza`, `service_fee`, `couvert`) em `apps/pdv/app/lib/features/modules/domain/module_ids.dart` e perfis em `apps/pdv/app/lib/features/modules/data/segment_profiles.dart` — ajustar só se faltar comportamento nos perfis Restaurante / Lanchonete

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Breakpoints canônicos, conta de salão + persistência, rotas/guards food, wiring Home sem UI completa. Suite existente permanece verde.

**⚠️ CRITICAL**: Nenhuma user story de salão começa antes desta fase.

- [X] T004 [P] Implementar `PdvBreakpoints` / `PdvFormat` (`compact` &lt;720, `medium` 720–1199, `expanded` ≥1200) em `apps/pdv/app/lib/core/layout/pdv_breakpoints.dart` ([research.md](./research.md) §1)
- [X] T005 [P] Criar enums `SalonAccountStatus`, `DiningTableStatus`, `DeliveryOrderStatus`, `SalonOrigin` em `apps/pdv/app/lib/features/tables/domain/salon_enums.dart` ([data-model.md](./data-model.md))
- [X] T006 [P] Criar models imutáveis `DiningTable`, `SalonAccount` (lines embed), `CouvertState` em `apps/pdv/app/lib/features/tables/domain/dining_table.dart` e `apps/pdv/app/lib/features/tables/domain/salon_account.dart`
- [X] T007 Criar `ServiceQueueItem` (projeção) em `apps/pdv/app/lib/features/service/domain/service_queue_item.dart` + helper `buildServiceQueue(List<SalonAccount>)` — depende de T006
- [X] T008 [P] Criar `DeliveryOrder` em `apps/pdv/app/lib/features/delivery/domain/delivery_order.dart`
- [X] T009 Implementar `SharedPreferencesSalonStore` (chave `pdv.salon.v1`: tables + accounts + deliveryOrders) em `apps/pdv/app/lib/features/tables/data/shared_preferences_salon_store.dart` ([contracts/salon-account.md](./contracts/salon-account.md))
- [X] T010 Fixture inicial de mesas (mapa demo) em `apps/pdv/app/lib/features/tables/data/tables_fixture.dart`
- [X] T011 Implementar `SalonController` / provider: hydrate, `openTable`, `openTab`, `resumeAccount`, `transferTable`, `joinAccounts`, `splitEqual`, `beginClose`, `cancelAccount`, `serviceQueue`, persist após mutação em `apps/pdv/app/lib/features/tables/application/salon_controller.dart` — depende de T006–T010
- [X] T012 Extender `PdvRoutes` + `createPdvRouter` com `/tables`, `/tabs`, `/service`, `/delivery/new`, `/delivery/orders`; query `accountId` / `returnTo` em `/counter` e `/payment`; placeholders `Scaffold` ok; títulos em `apps/pdv/app/lib/app/router/pdv_router.dart` ([contracts/navigation.md](./contracts/navigation.md))
- [X] T013 Incluir paths food no guard de turno (sem open → `/cash?intent=open`) em `apps/pdv/app/lib/app/router/pdv_router.dart` (ou `cash_shift_guard.dart`) — depende de T012
- [X] T014 Wire Home: ações `tables`/`tabs`/`service`/`delivery`/`delivery_orders` → rotas reais (deixar de `showNotImplementedFeedback`) em `apps/pdv/app/lib/features/home/presentation/home_page.dart` (e handler de atalhos se separado)
- [X] T015 Rodar `flutter analyze` + `flutter test` — suite pré-existente verde; overrides de teste com salon store fake se o router exigir

**Checkpoint**: Breakpoints + salão persistível + rotas/guards + Home navega para placeholders.

---

## Phase 3: User Story 1 - Layouts compacto/médio/expandido (Priority: P1) 🎯 MVP

**Goal**: Balcão e Pagamento usam `PdvFormat` nos três formatos; base para telas food sem colunas rígidas quebrarem tablet.

**Independent Test**: Widget tests com `tester.view` em ~400 / ~800 / ≥1200; Balcão/Pagamento utilizáveis; perfil Loja sem espaço morto food.

**Depends on**: Phase 2 (T004).

### Tests for User Story 1 ⚠️

> **RED primeiro**

- [X] T016 [P] [US1] Teste unitário: faixas `PdvBreakpoints` / `PdvFormat.ofWidth` em `apps/pdv/app/test/unit/pdv_breakpoints_test.dart`
- [X] T017 [P] [US1] Teste widget RED: `CounterPage` em largura 800 não overflowa ação principal em `apps/pdv/app/test/widget/counter_responsive_layout_test.dart`
- [X] T018 [P] [US1] Teste widget RED: `PaymentPage` em largura 800 utilizável em `apps/pdv/app/test/widget/payment_responsive_layout_test.dart`

### Implementation for User Story 1

- [X] T019 [US1] Refatorar layout do Balcão com `LayoutBuilder` + `PdvFormat` (compact empilha; medium duas faixas; expanded preserva caixa) em `apps/pdv/app/lib/features/counter/presentation/counter_page.dart` e widgets afetados (`counter_product_grid.dart`, painéis)
- [X] T020 [US1] Refatorar layout do Pagamento com `PdvFormat` em `apps/pdv/app/lib/features/payment/presentation/payment_page.dart` e widgets de colunas
- [X] T021 [US1] GREEN T017–T018; `flutter analyze` limpo

**Checkpoint**: Dívida de breakpoints da Fase 0 reaberta e aplicada a Balcão/Pagamento.

---

## Phase 4: User Story 2 - Mapa de mesas (Priority: P1)

**Goal**: `/tables` com estados livre/ocupada/fechando; abrir → Balcão vinculado; transferir/juntar/dividir; Home `M`; guard turno.

**Independent Test**: Perfil Restaurante + turno open → `M` → abrir mesa → item → voltar ocupada; transfer/join/split; Loja sem Mesas; sem turno → hub.

**Depends on**: Phase 2 (SalonController); US1 recomendado para layout do mapa.

### Tests for User Story 2 ⚠️

- [X] T022 [P] [US2] Teste unitário RED: `openTable` / transfer para ocupada rejeita / join / `splitEqual` (resto na 1ª) em `apps/pdv/app/test/unit/salon_controller_test.dart`
- [X] T023 [P] [US2] Teste unitário RED: round-trip `pdv.salon.v1` restaura mesa ocupada em `apps/pdv/app/test/unit/salon_store_test.dart`
- [X] T024 [P] [US2] Teste widget RED: Home `M` → `/tables` com turno; sem turno → `/cash` em `apps/pdv/app/test/widget/home_tables_navigation_test.dart`

### Implementation for User Story 2

- [X] T025 [US2] Completar operações de domínio se stubs: transfer/join/split/cancel em `apps/pdv/app/lib/features/tables/application/salon_controller.dart` ([contracts/salon-account.md](./contracts/salon-account.md))
- [X] T026 [US2] UI `TablesPage` mapa responsivo (estados visuais) + sheets transfer/join/split em `apps/pdv/app/lib/features/tables/presentation/tables_page.dart` e `presentation/widgets/`
- [X] T027 [US2] Abrir mesa → `context.go('/counter?accountId=…&returnTo=/tables')`; sync carrinho ↔ `SalonAccount.lines` em `apps/pdv/app/lib/features/counter/application/` (controller/provider de vínculo)
- [X] T028 [US2] Ligar rota `/tables` à página real; GREEN T022–T024

**Checkpoint**: SC-001 parcial (`M`); SC-002 ciclo mesa.

---

## Phase 5: User Story 3 - Comandas (Priority: P1)

**Goal**: `/tabs` lista/abertura por número ou cartão (**Filled**); Home `Q` + app bar Balcão; fechar → Pagamento; módulo off esconde entradas.

**Independent Test**: Abrir por Home e Balcão; lançar; fechar pagamento; Loja sem Comandas.

**Depends on**: Phase 2; US2 (SalonAccount) útil mas `openTab` pode ser independente.

### Tests for User Story 3 ⚠️

- [X] T029 [P] [US3] Teste unitário RED: `openTab` / duplicate / not found em `apps/pdv/app/test/unit/salon_tab_test.dart` (ou extender `salon_controller_test.dart`)
- [X] T030 [P] [US3] Teste widget RED: Home `Q` e botão Comandas do Balcão → `/tabs` em `apps/pdv/app/test/widget/home_tabs_navigation_test.dart` / `counter_app_bar_tabs_test.dart`
- [X] T031 [P] [US3] Teste widget RED: campo número/cartão usa Filled (`filled` + `inputFill`) em `apps/pdv/app/test/widget/tabs_filled_field_test.dart`

### Implementation for User Story 3

- [X] T032 [US3] UI `TabsPage` (lista abertas + form Filled número/cartão) em `apps/pdv/app/lib/features/tabs/presentation/tabs_page.dart`
- [X] T033 [US3] Fechar comanda → `beginClose` + `/payment?accountId=…&returnTo=/tabs`; após `SaleCompleted` fechar account em `apps/pdv/app/lib/features/payment/presentation/sale_completed_page.dart` / cash record flow
- [X] T034 [US3] App bar Balcão: botão Comandas → `/tabs` quando `PdvModuleIds.tabs` visible em `apps/pdv/app/lib/features/counter/presentation/widgets/counter_app_bar.dart`; GREEN T029–T031

**Checkpoint**: SC-003.

---

## Phase 6: User Story 5 - Blocos food no Balcão (Priority: P1)

**Goal**: Adicionais, observação de cozinha (Filled), meia-a-meia conforme módulos; carrinho e `SaleRecord` preservam dados.

**Independent Test**: Perfil Restaurante lança item enriquecido; Loja sem blocos; detalhe da venda mostra addons/note/half.

**Depends on**: Phase 2; pode paralelo a US2/US3 (mesmo `counter/`).

### Tests for User Story 5 ⚠️

- [X] T035 [P] [US5] Teste unitário RED: `CounterCartLine` com addons/half/kitchenNote e `lineNet` em centavos em `apps/pdv/app/test/unit/counter_cart_line_food_test.dart`
- [X] T036 [P] [US5] Teste unitário RED: regra preço meia-pizza (fixture max/média) em `apps/pdv/app/test/unit/half_pizza_pricing_test.dart`
- [X] T037 [P] [US5] Teste widget RED: módulos off → sheets não oferecidos em `apps/pdv/app/test/widget/counter_food_blocks_visibility_test.dart`

### Implementation for User Story 5

- [X] T038 [P] [US5] Extender `CounterProduct` flags + fixture addons/pizzas em `apps/pdv/app/lib/features/counter/domain/counter_product.dart` e `apps/pdv/app/lib/features/counter/data/counter_catalog.dart`
- [X] T039 [US5] Extender `CounterCartLine` + models `CartAddon` / `HalfPizzaSelection` em `apps/pdv/app/lib/features/counter/domain/`; atualizar cart controller
- [X] T040 [US5] Sheets/diálogos: addons, kitchen note (`PdvFilledField`), half-pizza em `apps/pdv/app/lib/features/counter/presentation/widgets/`; gate por `isOperationallyVisible`
- [X] T041 [US5] Exibir addons/note/half na tabela do carrinho em `apps/pdv/app/lib/features/counter/presentation/widgets/counter_cart_table.dart`
- [X] T042 [US5] Snapshot enriquecido em `SaleLineSnapshot` / `SaleRecord` ao finalizar em `apps/pdv/app/lib/features/cash/domain/sale_record.dart` e fluxo de finalize; GREEN T035–T037

**Checkpoint**: SC-006 parcial (linhas food).

---

## Phase 7: User Story 6 - Taxa de serviço e couvert (Priority: P1)

**Goal**: Painel de totais com taxa % e couvert (módulos); ordem lines → couvert → fee → ajuste Fase 1; constam na venda.

**Independent Test**: Ativar 10% + couvert; módulos off somem; total ≥ 0 com ajuste XOR.

**Depends on**: US5 recomendado (linhas estáveis); contrato [food-totals.md](./contracts/food-totals.md).

### Tests for User Story 6 ⚠️

- [X] T043 [P] [US6] Teste unitário RED: fórmula totais food (half-up, ordem, delivery fee fora da base) em `apps/pdv/app/test/unit/food_totals_test.dart`
- [X] T044 [P] [US6] Teste widget RED: painel mostra/esconde taxa e couvert por módulo em `apps/pdv/app/test/widget/counter_totals_food_test.dart`

### Implementation for User Story 6

- [X] T045 [US6] Estado `couvert` / `serviceFee` no carrinho ou `SalonAccount` + providers em `apps/pdv/app/lib/features/counter/application/`
- [X] T046 [US6] UI no painel de totais (toggles/campos **Filled** para covers/% se editáveis) em `apps/pdv/app/lib/features/counter/presentation/widgets/counter_totals_panel.dart`
- [X] T047 [US6] Integrar `counter_totals_provider` / pagamento / `SaleRecord` com `couvertCents` + `serviceFeeCents`; GREEN T043–T044

**Checkpoint**: SC-006 / SC-009.

---

## Phase 8: User Story 4 - Fila de atendimentos (Priority: P2)

**Goal**: `/service` lista projeções; retomar → Balcão; cancelar com confirmação; empty state; Home `A`.

**Independent Test**: Com conta open (mesa/comanda), listar → retomar → cancelar; módulo off ausente.

**Depends on**: US2 e/ou US3 (contas abertas).

### Tests for User Story 4 ⚠️

- [X] T048 [P] [US4] Teste unitário RED: `buildServiceQueue` só open/closing em `apps/pdv/app/test/unit/service_queue_test.dart`
- [X] T049 [P] [US4] Teste widget RED: Home `A` → `/service`; empty state; cancel confirma em `apps/pdv/app/test/widget/service_queue_page_test.dart`

### Implementation for User Story 4

- [X] T050 [US4] UI `ServiceQueuePage` com `PdvEmptyState` / resume / cancel em `apps/pdv/app/lib/features/service/presentation/service_queue_page.dart`
- [X] T051 [US4] Rota `/service` + resume `accountId` + `returnTo=/service`; GREEN T048–T049

**Checkpoint**: SC-001 para `A`.

---

## Phase 9: User Story 7 - Delivery e pedidos (Priority: P2)

**Goal**: Novo pedido (`D`) com cliente/endereço Filled/taxa/entregador; fila (`W`) status/despacho; `returnTo`; módulos independentes.

**Independent Test**: Criar → aparece em `W` → despachar; módulos off escondem; sem turno → hub.

**Depends on**: Phase 2; US1 para layout; opcional vínculo `SalonAccount` origin delivery.

### Tests for User Story 7 ⚠️

- [X] T052 [P] [US7] Teste unitário RED: create order + transições status / cancel em `apps/pdv/app/test/unit/delivery_order_test.dart`
- [X] T053 [P] [US7] Teste widget RED: Home `D`/`W` navegação + campo endereço Filled em `apps/pdv/app/test/widget/delivery_navigation_filled_test.dart`
- [X] T054 [P] [US7] Teste widget RED: saída Delivery na venda finalizada só se módulo visible (regressão Fase 0) em `apps/pdv/app/test/widget/sale_completed_delivery_visibility_test.dart`

### Implementation for User Story 7

- [X] T055 [US7] Controller delivery (create, list, dispatch, cancel) + persist no salon store em `apps/pdv/app/lib/features/delivery/application/delivery_controller.dart`
- [X] T056 [US7] UI `DeliveryNewPage` (campos **PdvFilledField**) em `apps/pdv/app/lib/features/delivery/presentation/delivery_new_page.dart`
- [X] T057 [US7] UI `DeliveryOrdersPage` lista/status/despacho responsiva em `apps/pdv/app/lib/features/delivery/presentation/delivery_orders_page.dart`
- [X] T058 [US7] Fluxo: create → counter/payment com `deliveryFeeCents` fora da base da taxa ([food-totals.md](./contracts/food-totals.md)); SaleCompleted `returnTo=/delivery/orders`; GREEN T052–T054

**Checkpoint**: SC-001 completo para `D`/`W`.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Docs, regressões, quickstart, analyze limpo.

- [X] T059 [P] Atualizar `apps/pdv/app/AGENTS.md`: features food; breakpoints **entregues** (remover adiamento Fase 0 para este escopo); regra canônica **TextField Filled** (`ui/pdv_filled_field.dart`); histórico §8
- [X] T060 [P] Migrar campos de texto tocados em cash/settings/sale_note para `pdvFilledDecoration` se ainda outlined sem fill (`apps/pdv/app/lib/features/cash/presentation/`, `settings_page.dart`, `sale_note_dialog.dart`) — alinhado a [filled-fields.md](./contracts/filled-fields.md)
- [X] T061 Garantir perfil Loja: zero ações/blocos food na Home/Balcão/totais/SaleCompleted (widget smoke) em `apps/pdv/app/test/widget/loja_profile_food_hidden_test.dart`
- [X] T062 Sincronizar carrinho ↔ `SalonAccount` no pagamento e limpeza pós-venda sem orphan accounts em `apps/pdv/app/lib/features/payment/` + `salon_controller.dart`
- [X] T063 Rodar validação [quickstart.md](./quickstart.md) cenários 1–10; `flutter analyze` = No issues found!; `flutter test` verde
- [X] T064 Revisar imports `package:citybox_pdv/...`, imutabilidade, arquivos &lt;800 linhas nas features novas

---

## Dependencies & Execution Order

### Phase dependencies

```text
Phase 1 Setup → Phase 2 Foundational → US1 (breakpoints MVP)
                                      → US2 Mesas
                                      → US3 Comandas          ⎫ podem paralelizar após Foundational
                                      → US5 Blocos food       ⎭ (cuidado no mesmo counter/)
                                      → US6 Taxa/couvert (após US5 ideal)
                                      → US4 Atendimentos (após US2|US3)
                                      → US7 Delivery
Phase 10 Polish por último
```

### Story dependencies

- **US1**: só Phase 2 (T004); não bloqueia domínio de salão.
- **US2 / US3 / US5**: após Foundational; US5 pode paralelo a US2/US3 se coordenar merges em `counter/`.
- **US6**: depende da fórmula de linhas (US5) para SC-006 completo.
- **US4**: precisa contas open (US2 ou US3).
- **US7**: após Foundational; fee interage com US6 se ambos ligados.

### Within each story

- Tests RED → models/controllers → UI → GREEN → analyze
- Campos de formulário sempre `PdvFilledField` / `pdvFilledDecoration`

### Parallel opportunities

- T002 ∥ T003; T004 ∥ T005 ∥ T006 ∥ T008; T016 ∥ T017 ∥ T018
- Após Phase 2: US1 ∥ US5 domain; depois US2 ∥ US3 (arquivos diferentes)
- T035 ∥ T036 ∥ T037; T052 ∥ T053 ∥ T054
- T059 ∥ T060

### Parallel example (após Phase 2)

```bash
# Terminal A: US1 counter/payment LayoutBuilder
# Terminal B: US5 CounterCartLine + sheets food (domain primeiro)
# Terminal C: US2 salon_controller tests + TablesPage
```

---

## Implementation Strategy

### MVP (US1 + base Foundational)

1. Phase 1–2  
2. US1 breakpoints em Balcão/Pagamento  
3. **STOP and VALIDATE**: quickstart cenário 1 + analyze/test  

### Incremental delivery (salão piloto)

1. US2 Mesas → demo salão  
2. US3 Comandas → Home `Q` + app bar vivos  
3. US5 + US6 → Balcão food completo  
4. US4 Atendimentos  
5. US7 Delivery  
6. Polish + AGENTS + quickstart 1–10  

### Suggested first demo slice

**Foundational + US1 + US2**: tablet abre mesas e vende sem overflow — valor de produto imediato.

---

## Notes

- [P] = arquivos diferentes, sem dependência de task incompleta
- Prefixo **gap Fase 2** ≠ “Phase 2” deste arquivo (Foundational)
- Sem backend/TEF/KDS (`production_print` não implementar)
- Não commitar sem autorização explícita do usuário
- Evitar segundo Balcão por segmento — só blocos gated por módulo
