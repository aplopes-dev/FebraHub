---
description: "Task list for PDV Fundação Fase 0"
---

# Tasks: PDV Fundação (Fase 0)

**Input**: Design documents from `/specs/pdv/001-foundation-phase0/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Incluídos — a spec exige unit/widget para catálogo, centavos, rotas e §5.8 (Assumptions); Constitution/ECC mandam TDD RED → GREEN → REFACTOR. Goldens/`integration_test` ficam para Fase 5.

**Organization**: Tasks por user story (US1–US7) para entrega e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tasks incompletas)
- **[Story]**: US1–US7 conforme [spec.md](./spec.md)
- Caminhos absolutos ao app: `apps/pdv/app/...`

## Path Conventions

App Flutter isolado `apps/pdv/app` (`citybox_pdv`) — feature-first (`domain` / `data` / `application` / `presentation`). Testes em `apps/pdv/app/test/{unit,widget}/`. Ciclo: `flutter analyze` + `flutter test` (não pnpm).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependências e esqueleto mínimo sem alterar comportamento de produto.

- [X] T001 Adicionar `go_router` e `shared_preferences` em `apps/pdv/app/pubspec.yaml` (descomentar/registrar `go_router`; adicionar `shared_preferences`) e rodar `flutter pub get` em `apps/pdv/app`
- [X] T002 [P] Remover o comentário obsoleto de `go_router` “quando existir a segunda tela” em `apps/pdv/app/pubspec.yaml` e `apps/pdv/app/AGENTS.md` §4.5 (dependência passa a ser runtime real nesta fase; detalhes de rotas ficam na US4)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Domínio de módulos + API única de visibilidade operacional, com app ainda compilando e testes existentes verdes (default: tudo `available`).

**⚠️ CRITICAL**: Nenhuma user story começa antes desta fase estar completa.

- [X] T003 [P] Criar enums `PdvModuleKind`, `PdvModuleTier`, `PdvModuleState` em `apps/pdv/app/lib/features/modules/domain/pdv_module_enums.dart` ([data-model.md](./data-model.md))
- [X] T004 [P] Estender `PdvModuleIds` com ids de comportamento (`barcode`, `scale`, `variant_grid`, `item_addon`, `kitchen_note`, `half_pizza`, `production_print`, `service_fee`, `couvert`) em `apps/pdv/app/lib/features/modules/domain/module_ids.dart` ([contracts/modules-api.md](./contracts/modules-api.md))
- [X] T005 Criar `PdvModuleDefinition` + catálogo estático `pdvModuleCatalog` (13 screens + ≥9 behaviors, com `tier` core/optional) em `apps/pdv/app/lib/features/modules/domain/pdv_module_definition.dart` (depende de T003, T004)
- [X] T006 [P] Criar `ModuleSetSnapshot` imutável (`states`, `profileName?`, `updatedAt`) em `apps/pdv/app/lib/features/modules/domain/module_set_snapshot.dart`
- [X] T007 Criar `ModuleSetValidator.ensureValid` (força/rejeita núcleo `available`; snapshot inválido → perfil seguro) em `apps/pdv/app/lib/features/modules/domain/module_set_validator.dart` (depende de T005, T006)
- [X] T008 Reescrever `ModuleVisibilityController` / provider para expor `ModuleSetSnapshot` + `bool isOperationallyVisible(String id)` (só `available`) em `apps/pdv/app/lib/features/modules/application/module_visibility_controller.dart` — default build: todos `available` via validator (depende de T007)
- [X] T009 Migrar consumidores atuais de `Set<String> hidden` / `!contains` para `isOperationallyVisible` em `apps/pdv/app/lib/features/home/presentation/home_page.dart`, `apps/pdv/app/lib/features/payment/presentation/widgets/payment_app_bar.dart`, app bar do Balcão (`apps/pdv/app/lib/features/counter/presentation/`), `apps/pdv/app/lib/features/modules/presentation/modules_panel.dart` e testes que overrides o provider (`apps/pdv/app/test/unit/module_visibility_controller_test.dart`, `apps/pdv/app/test/widget/home_*.dart`, `apps/pdv/app/test/widget/counter_app_bar_test.dart`, `apps/pdv/app/test/widget/modules_panel_test.dart`, `apps/pdv/app/test/widget/payment_app_bar_test.dart`) — app deve compilar e suite existente passar (depende de T008)

**Checkpoint**: Catálogo tipado + helper único no ar; comportamento visual padrão = tudo ligado (como hoje).

---

## Phase 3: User Story 1 - Catálogo com vocabulário completo (Priority: P1) 🎯 MVP

**Goal**: Estados `available|disabled|blocked`, classificação núcleo/opcional, ids de comportamento; UI ops trata `blocked` como ausente; núcleo não fica indisponível por config inválida.

**Independent Test**: Aplicar estados disabled/blocked em opcionais e ver ausência na Home/atalhos; tentar desligar núcleo e ver rejeição/correção; comportamento desligado não “oferecido” via mesma consulta.

### Tests for User Story 1 ⚠️

> **RED primeiro** — falhar antes da implementação completa da story.

- [X] T010 [P] [US1] Teste unitário: `isOperationallyVisible` false para `disabled` e `blocked`, true só para `available` em `apps/pdv/app/test/unit/module_visibility_controller_test.dart` (ou arquivo novo `module_operational_visibility_test.dart`)
- [X] T011 [P] [US1] Teste unitário: `ModuleSetValidator` força/rejeita núcleo ausente em `apps/pdv/app/test/unit/module_set_validator_test.dart`
- [X] T012 [P] [US1] Teste unitário: catálogo contém ≥ ids FR-001 (behaviors) + screens e marca tiers corretos em `apps/pdv/app/test/unit/pdv_module_catalog_test.dart`
- [X] T013 [P] [US1] Teste widget: módulo `blocked` some da Home igual `disabled` em `apps/pdv/app/test/widget/home_screen_test.dart` (ou `home_module_states_test.dart`)

### Implementation for User Story 1

- [X] T014 [US1] Expor mutação tipada `setModuleState(id, PdvModuleState)` com validação de núcleo no controller em `apps/pdv/app/lib/features/modules/application/module_visibility_controller.dart` (GREEN para T010–T011)
- [X] T015 [US1] Atualizar `ModulesPanel` para três estados (não só switch binário) listando screens + behaviors do catálogo em `apps/pdv/app/lib/features/modules/presentation/modules_panel.dart` (GREEN para T012/T013 parcialmente)
- [X] T016 [US1] Garantir atalhos da Home respeitam `isOperationallyVisible` (já filtrados) e documentar no painel labels de behavior em `apps/pdv/app/lib/features/home/presentation/home_page.dart` / `modules_panel.dart`
- [X] T017 [US1] Rodar `flutter test` nos testes T010–T013 e ajustar até GREEN; `flutter analyze` limpo

**Checkpoint**: US1 testável sozinha — vocabulário completo no modelo e na UI de debug.

---

## Phase 4: User Story 2 - Fonte injetável, cache e painel só em dev (Priority: P1)

**Goal**: Origem injetável; cache offline do último snapshot; 4 perfis nomeados; painel de escrita ausente em release.

**Independent Test**: Cache prévio → restart sem “fonte” usa cache; release sem botão/painel; debug aplica perfil e Home/Balcão/Pagamento refletem o mesmo conjunto.

### Tests for User Story 2 ⚠️

- [X] T018 [P] [US2] Teste unitário: quatro perfis nomeados incluem núcleo `available` e diferem nos opcionais em `apps/pdv/app/test/unit/segment_profiles_test.dart`
- [X] T019 [P] [US2] Teste unitário: cache round-trip (fake `SharedPreferences`) restaura snapshot em `apps/pdv/app/test/unit/module_config_cache_test.dart`
- [X] T020 [P] [US2] Teste unitário: primeiro start sem cache usa perfil padrão (nunca vazio escondendo Balcão) em `apps/pdv/app/test/unit/module_config_source_test.dart`
- [X] T021 [P] [US2] Teste widget: com flag/override `showModulesPanel == false` (simula release) o botão/painel não aparece em `apps/pdv/app/test/widget/modules_panel_absent_in_release_test.dart`

### Implementation for User Story 2

- [X] T022 [P] [US2] Definir `ModuleConfigSource` abstrata em `apps/pdv/app/lib/features/modules/domain/module_config_source.dart` ([contracts/modules-api.md](./contracts/modules-api.md))
- [X] T023 [US2] Implementar 4 perfis (`Restaurante`, `Lanchonete com delivery`, `Loja`, `Mercado`) em `apps/pdv/app/lib/features/modules/data/segment_profiles.dart` (depende de T022/T005)
- [X] T024 [US2] Implementar `SharedPreferencesModuleCache` (chave `pdv.modules.v1`) em `apps/pdv/app/lib/features/modules/data/shared_preferences_module_cache.dart`
- [X] T025 [US2] Implementar `FixtureModuleConfigSource` (+ decorator cache) e `applyProfile` no controller; `build()` async/sync-safe: cache → senão perfil padrão → validate → persist em `apps/pdv/app/lib/features/modules/data/fixture_module_config_source.dart` e controller (depende de T023, T024)
- [X] T026 [US2] Isolar painel: botão em `apps/pdv/app/lib/app/shell/widgets/modules_button.dart` (e title bar) só se `!kReleaseMode` (ou provider `modulesPanelEnabledProvider` overrideável em testes); endDrawer não monta painel em release (GREEN T021)
- [X] T027 [US2] UI do painel: seletor de perfil nomeado que chama `applyProfile` em `apps/pdv/app/lib/features/modules/presentation/modules_panel.dart`
- [X] T028 [US2] GREEN: `flutter test` T018–T021 + analyze

**Checkpoint**: Offline cache + perfis + painel debug-only.

---

## Phase 5: User Story 3 - Dinheiro só em centavos (Priority: P1)

**Goal**: Domínio counter/payment/fixtures em `int` centavos; formatação só na UI; fechamento exato sem float.

**Independent Test**: `canFinalize` com recebido == total; 250+550 estável; zero `double` monetário no domínio dessas features.

### Tests for User Story 3 ⚠️

- [X] T029 [P] [US3] Teste RED: `PaymentSummary.canFinalize` com cents iguais em `apps/pdv/app/test/unit/payment_summary_test.dart`
- [X] T030 [P] [US3] Teste RED: totais de carrinho 250+550 em `apps/pdv/app/test/unit/counter_totals_provider_test.dart` / `counter_cart_line_test.dart`
- [X] T031 [P] [US3] Teste RED: `formatCents` pt_BR em `apps/pdv/app/test/unit/pdv_currency_test.dart`

### Implementation for User Story 3

- [X] T032 [P] [US3] Evoluir `apps/pdv/app/lib/core/format/pdv_currency.dart` com `formatCents(int cents)` ([contracts/money.md](./contracts/money.md))
- [X] T033 [US3] Migrar `CounterProduct`/`CounterCartLine`/`CounterTotals` para `*Cents` em `apps/pdv/app/lib/features/counter/domain/` e fixture `apps/pdv/app/lib/features/counter/data/counter_catalog.dart`
- [X] T034 [US3] Migrar controllers/providers de carrinho/totais em `apps/pdv/app/lib/features/counter/application/` e widgets que exibem preço (`counter_product_grid.dart`, `counter_cart_table.dart`, `counter_totals_panel.dart`)
- [X] T035 [US3] Migrar `PaymentEntry`/`PaymentSummary`/draft para centavos em `apps/pdv/app/lib/features/payment/domain/payment_entry.dart`, `payment_summary.dart`, `apps/pdv/app/lib/features/payment/application/payment_draft_controller.dart` e painéis `apps/pdv/app/lib/features/payment/presentation/widgets/payment_summary_panel.dart`, `payment_entries_panel.dart`, `payment_keypad.dart`
- [X] T036 [US3] Atualizar testes widget de counter/payment afetados pela renomeação de campos; GREEN T029–T031; `flutter analyze` limpo

**Checkpoint**: SC-001 — fechamento exato sem float.

---

## Phase 6: User Story 7 - Telas consultam o catálogo (§5.8) (Priority: P1)

**Goal**: `SaleCompletedPage` e ações de Pagamento ligadas a módulo usam `isOperationallyVisible`; mesmo helper da Home.

**Independent Test**: Perfil Loja → sem Delivery/Atendimentos na venda finalizada; Vendedor off → sem ação na app bar de Pagamento; Restaurante com módulos on → saídas aparecem.

**Depends on**: Phase 2 + US1 (helper); idealmente US2 perfis para cenários, mas overrides de snapshot bastam.

### Tests for User Story 7 ⚠️

- [X] T037 [P] [US7] Teste widget RED: SaleCompleted sem Delivery/Atendimentos quando ids disabled em `apps/pdv/app/test/widget/sale_completed_page_test.dart`
- [X] T038 [P] [US7] Teste widget RED: PaymentAppBar sem Vendedor quando `seller` não available em `apps/pdv/app/test/widget/payment_app_bar_test.dart`

### Implementation for User Story 7

- [X] T039 [US7] Filtrar saídas Delivery/Atendimentos (e demais ligadas a id) em `apps/pdv/app/lib/features/payment/presentation/sale_completed_page.dart` via `isOperationallyVisible`
- [X] T040 [US7] Confirmar/ajustar `apps/pdv/app/lib/features/payment/presentation/widgets/payment_app_bar.dart` para o helper novo (observação da venda permanece sem id — Assumption); GREEN T037–T038

**Checkpoint**: SC-002 / SC-009 nos pontos §5.8.

---

## Phase 7: User Story 4 - Navegação por rotas (Priority: P2)

**Goal**: Cinco telas via `go_router`; título coerente; fluxo venda + cliente sem regressão; sale-completed com replace/limpeza.

**Independent Test**: Home → Balcão → Pagamento → Finalizada → Início/Balcão; cadastro cliente por rota; venda não volta na pilha.

### Tests for User Story 4 ⚠️

- [X] T041 [P] [US4] Teste widget/router: rotas nomeadas resolvem as 5 páginas em `apps/pdv/app/test/widget/pdv_router_test.dart`
- [X] T042 [P] [US4] Teste: após sale-completed, voltar não restaura pagamento da venda anterior em `apps/pdv/app/test/widget/sale_completed_navigation_test.dart`

### Implementation for User Story 4

- [X] T043 [US4] Criar `GoRouter` + rotas (`/`, `/counter`, `/payment`, `/sale-completed`, `/customer/form`) em `apps/pdv/app/lib/app/router/pdv_router.dart` ([contracts/navigation.md](./contracts/navigation.md))
- [X] T044 [US4] Trocar `MaterialApp` por `MaterialApp.router` em `apps/pdv/app/lib/main.dart` (e app root se separado); integrar shell/`PdvScaffold`
- [X] T045 [US4] Substituir `pushWithPageTitle` / `Navigator.push` nos pontos de navegação (Home, Counter, Payment, Customer, SaleCompleted) por `context.go`/`push`/`goNamed`; sincronizar título da janela com a rota em `apps/pdv/app/lib/app/shell/pdv_page_title.dart` (ou listener no router)
- [X] T046 [US4] Sale-completed: navegação replace + limpeza de providers em `apps/pdv/app/lib/features/payment/presentation/sale_completed_page.dart`; GREEN T041–T042; atualizar `apps/pdv/app/test/widget/pdv_page_title_test.dart` e testes de fluxo payment/home que usavam `Navigator`

**Checkpoint**: SC-005 — fluxo existente por rotas.

---

## Phase 8: User Story 5 - Estratégia responsiva documentada (Priority: P2)

**Goal**: Registrar por escrito o adiamento do mobile/tablet operacional e o gatilho na Fase 2 (Mesas/Comandas).

**Independent Test**: Spec (já) + `AGENTS.md` do app citam decisão B e obrigação de reabrir breakpoints.

### Implementation for User Story 5

- [X] T047 [US5] Atualizar `apps/pdv/app/AGENTS.md` §4.7 (e Histórico §8): adiamento compacto/médio em Balcão/Pagamento nesta Fase 0; Fase 2 (Mesas/Comandas) deve reabrir `PdvBreakpoints` antes ou em paralelo; mencionar `go_router`/`shared_preferences`/centavos/módulos se ainda não refletidos
- [X] T048 [P] [US5] Atualizar “Última atualização” / status em `apps/pdv/app/AGENTS.md` §1 conforme política docs-as-code (sem remover seções)

**Checkpoint**: SC-006.

---

## Phase 9: User Story 6 - Estados loading / erro / vazio (Priority: P2)

**Goal**: Widgets compartilhados em `lib/ui/`; carrinho vazio alinhado; fixtures forçam loading/erro.

**Independent Test**: Empty/loading/erro usam componentes compartilhados; erro com ação acionável sem stack.

### Tests for User Story 6 ⚠️

- [X] T049 [P] [US6] Teste widget: `PdvEmptyState` / `PdvLoadingState` / `PdvErrorState` renderizam com tokens em `apps/pdv/app/test/widget/pdv_async_states_test.dart`
- [X] T050 [P] [US6] Teste widget: carrinho vazio usa empty compartilhado em `apps/pdv/app/test/widget/counter_cart_table_test.dart` (ou equivalente)

### Implementation for User Story 6

- [X] T051 [P] [US6] Criar `PdvLoadingState`, `PdvErrorState`, `PdvEmptyState` em `apps/pdv/app/lib/ui/pdv_loading_state.dart`, `pdv_error_state.dart`, `pdv_empty_state.dart` (tokens `PdvColors`/`PdvTypography`/`PdvSpacing`)
- [X] T052 [US6] Migrar empty do carrinho (`_EmptyCart` ou similar) para `PdvEmptyState` em `apps/pdv/app/lib/features/counter/presentation/widgets/counter_cart_table.dart` (ou arquivo que hospeda o empty atual)
- [X] T053 [US6] Adicionar override/fixture que force loading/erro (provider de teste ou harness em `apps/pdv/app/test/widget/pdv_async_states_test.dart`) — GREEN T049–T050

**Checkpoint**: SC-007.

---

## Phase 10: Polish & Cross-Cutting

**Purpose**: Gate final e consistência docs/código.

- [X] T054 Rodar validação [quickstart.md](./quickstart.md) (cenários 1–8 aplicáveis) e registrar gaps se houver
- [X] T055 [P] Remover leftovers `double` monetários e API antiga `Set<String> hidden` / `setVisible(bool)` se ainda existirem em `apps/pdv/app/lib/features/{modules,counter,payment}/`
- [X] T056 `flutter analyze` = `No issues found!` e `flutter test` verde em `apps/pdv/app`
- [X] T057 Revisar `apps/pdv/app/AGENTS.md` estrutura §3 (router, modules/data, ui states, centavos) alinhada ao código entregue

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (1)**: imediato
- **Foundational (2)**: após Setup — **bloqueia** todas as stories
- **US1 (3)**: após Foundational — MVP de vocabulário
- **US2 (4)**: após US1 (precisa catálogo + mutação de estado)
- **US3 (5)**: após Foundational — **paralelo** a US1/US2/US7 se equipe separar arquivos money vs modules
- **US7 (6)**: após Foundational + US1 (helper); melhor após US2 para testar com perfis, mas overrides bastam
- **US4 (7)**: após Foundational — paralelo a money/modules se cuidado com conflitos em `main.dart`/páginas; preferir após US3+US7 para menos churn nos mesmos arquivos de payment/counter
- **US5 (8)**: pode rodar a qualquer momento após decisões (ideal no polish ou cedo); não bloqueia código
- **US6 (9)**: após Foundational — paralelo; migrar empty do carrinho após US3 se a tabela de cart mudar
- **Polish (10)**: após stories desejadas

### User Story Dependencies

| Story | Depende de | Paralelo com |
|---|---|---|
| US1 | Phase 2 | US3, US5, US6 |
| US2 | US1 | US3 (cuidado), US5 |
| US3 | Phase 2 | US1, US5, US6 |
| US7 | US1 | US3, US5 |
| US4 | Phase 2 (+ ideal US3/US7 estáveis) | US5, US6 |
| US5 | — (docs) | todas |
| US6 | Phase 2 | US1–US5 (exceto conflito cart table com US3) |

### Within Each Story

1. Testes RED → implementação GREEN → analyze/test
2. Domain/data antes de presentation
3. Checkpoint antes da próxima prioridade P1 crítica

### Parallel Opportunities

```text
Após Phase 2:
  Track A: US1 → US2 → US7
  Track B: US3 (money)
  Track C: US6 (ui states) — adiar T052 se Track B tocar cart table
  Track D: US5 (AGENTS.md)
Depois consolidar → US4 (router) → Polish
```

---

## Parallel Example: User Story 1

```bash
# RED em paralelo:
# - test/unit/module_operational_visibility_test.dart (T010)
# - test/unit/module_set_validator_test.dart (T011)
# - test/unit/pdv_module_catalog_test.dart (T012)
# - test/widget/home_module_states_test.dart (T013)

# Depois GREEN sequencial no controller/painel (T014–T016)
```

## Parallel Example: User Story 3

```bash
# RED: payment_summary_test, counter_totals/cart_line, pdv_currency_test (T029–T031)
# GREEN: pdv_currency.dart [P] + domain counter [P files] depois application/widgets
```

---

## Implementation Strategy

### MVP First (US1)

1. Phase 1 + 2  
2. Phase 3 (US1) → validar Home/painel com estados e núcleo  
3. **STOP** — demo do vocabulário de módulos  

### Incremental Delivery (recomendado para Fase 0 completa)

1. MVP US1  
2. US2 (cache/perfis/release panel) — desbloqueia fixtures reais  
3. US7 (§5.8) — corrige dívida visível  
4. US3 (centavos) — SC-001  
5. US4 (router) — base Mesas/Comandas  
6. US5 + US6 + Polish  

### Suggested MVP Scope

**Mínimo**: Phase 1–3 (Setup + Foundational + **US1**).  
**MVP operacional da fundação de módulos**: US1 + US2 + US7.  
**Fase 0 completa**: todas as stories + Polish (T054–T057).

---

## Notes

- Sem telas novas (FR-014) e sem backend (FR-015)
- Behaviors no catálogo **sem** UI de barcode/meia-pizza nesta fase (research #10)
- `observação da venda` sem id de módulo — não forçar em US7
- Commit só com autorização explícita do usuário
- Cada task deve ser executável por um agente sem contexto extra além dos docs da feature
