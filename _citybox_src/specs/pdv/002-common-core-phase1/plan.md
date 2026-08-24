# Implementation Plan: PDV Núcleo Comum (Fase 1)

**Branch**: `002-common-core-phase1` | **Date**: 2026-08-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/pdv/002-common-core-phase1/spec.md`

**Fonte de análise**: `.claude/docs/pdv-app-frontend-gap-2026-08-05.md` (Fase 1 itens 7–12; §4.1–4.2; §5.4; §6.1; clarificações Q1–Q6)

**Nota de numeração**: Este plano é a **Fase 1 do gap** (núcleo ⬛ comum). A **Fase 2 do gap** (Mesas/Comandas/Food) **não** entra aqui. Pré-requisito: Fase 0 (`001-foundation-phase0`) já entregue no app.

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Entregar o mínimo para **operar um turno inteiro** no PDV Flutter (`apps/pdv/app` / `citybox_pdv`), comum a food e varejo: **hub Caixa** (abrir/fechar turno com fundo e conferência), **sangria/reforço**, **últimas vendas** (lista + detalhe + reimpressão fixture + cancelamento), **configurações do terminal** (preferências locais + módulos em **somente leitura**), **desconto ou acréscimo** na venda inteira (mutuamente exclusivos), e **Vendedor pela Home (F9)** religando o seletor existente. Turno obrigatório para Balcão/Sangria/Últimas vendas; Configurações e Vendedor liberados sem turno. Persistência local do turno. Sem backend, TEF, impressão real ou telas de segmento (Fases 2–3 do gap).

## Technical Context

**Language/Version**: Dart ≥ 3.7 / Flutter ≥ 3.29 (validado 3.44.8 / Dart 3.12.2) — pacote `citybox_pdv`

**Primary Dependencies**:
- Existentes (Fase 0): `flutter_riverpod` ^2.6.1, `go_router` ^16.2, `shared_preferences` ^2.5.3, `intl`, `window_manager`, `package_info_plus`
- Nesta fase: **reusar** `shared_preferences` (ou o mesmo padrão de cache) para persistir turno + movimentos + vendas do turno — ver [research.md](./research.md). Sem novo pacote obrigatório salvo se o volume JSON justificar `path_provider`+arquivo (preferência: manter um só mecanismo).

**Storage**: Persistência local no terminal (turno aberto, movimentos de gaveta, vendas do turno). Módulos já cacheados na Fase 0. Sem Postgres/Prisma/HTTP.

**Testing**: `flutter_test` + `ProviderScope` overrides — `test/unit/` (turno, esperado em gaveta, ajuste de venda, cancelamento) e `test/widget/` (hub, guards de rota, Home S/U/Ç/F9, Configurações read-only). Goldens/`integration_test` → Fase 5 do gap.

**Target Platform**: Linux, Windows (caixa) e Android — layouts compacto/médio **continuam adiados** (decisão Fase 0); novas telas priorizam expandido/caixa.

**Project Type**: app nativo Flutter modular (food/varejo) — **não** o PWA `apps/pdv/frontend`.

**Performance Goals**: SC-001…SC-011 do spec (ciclo de turno &lt; 5 min em fixture; 0 “não implementado” em S/U/Ç/F9; fórmula de gaveta; exclusividade de ajuste; bloqueio de fechamento; restauração pós-reinício).

**Constraints**:
- Sem backend / Keycloak / TEF / impressão física / sync (FR-020)
- Sem Mesas/Comandas/Delivery/blocos food/varejo de Balcão (FR-021; gap Fases 2–3)
- Imutabilidade Riverpod; imports `package:citybox_pdv/...`; `flutter analyze` = `No issues found!`
- Dinheiro só em centavos (herança Fase 0 + FR-016)
- Toda tela nova consulta `isOperationallyVisible` (FR-015)
- Docs-as-code: atualizar `apps/pdv/app/AGENTS.md` na mesma entrega
- Flutter fora do Turborepo/pnpm

**Scale/Scope**: Novas features `cash` (hub/turno/sangria), `sales_history` (ou subpasta sob cash), `settings`; extensão de `counter` (ajuste de venda); Home/router guards; ~6–8 rotas novas; 1 módulo núcleo novo (`cash_hub`). Zero endpoints HTTP.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Avaliado contra `.specify/memory/constitution.md` v1.0.0. Escopo Flutter nativo — itens web/Nest N/A justificados.

| Princípio | Status | Nota |
|---|---|---|
| I. Docs-as-Code (AGENTS.md) | ✅ PASS | Plano exige atualizar `apps/pdv/app/AGENTS.md` (hub Caixa, turno, sangria, últimas vendas, settings read-only, ajuste de venda, histórico). Raiz: sem nova porta/pacote monorepo. |
| II. Backend-Driven Search/Pagination | ✅ N/A justificado (com nuance) | Listagens são locais (fixture/persistência). Últimas vendas aplica filtro/paginação **no modelo de dados local** (FR-007) — não carregar “o mundo” na UI sem critério. Quando houver API, §8.1 do monorepo aplica. |
| III. Single Package Manager (pnpm) | ✅ PASS (escopo) | Só `flutter pub` neste app. |
| IV. Atomic Design / `@citybox/ui` | ✅ N/A justificado | Tokens `PdvColors`/…; estados `PdvLoadingState`/`PdvErrorState`/`PdvEmptyState` já na Fase 0. |
| V. Tenant Isolation / Prisma | ✅ N/A | Sem schema. Persistência local de turno ≠ multi-tenant DB. |
| Auth / Messaging / Nest+Next | ✅ N/A | FR-020. |
| Workflow / Gates / No commit sem aprovação | ✅ PASS (a aplicar) | TDD Flutter; analyze + test; commit só com autorização. |
| Strict lint | ✅ PASS (análogo Dart) | Analyze limpo; sem `// ignore:` injustificado. |

Nenhuma violação injustificada. Complexity Tracking vazio.

**Re-check pós-Phase 1** (após `research.md`, `data-model.md`, `contracts/`, `quickstart.md`):
desenho local ao Flutter; contratos internos (turno, rotas, ajuste, settings); sem Prisma/`@citybox/ui`. Gate: ✅ PASS para `/speckit-tasks`.

## Project Structure

### Documentation (this feature)

```text
specs/pdv/002-common-core-phase1/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── cash-shift.md
│   ├── navigation.md
│   ├── sale-adjustment.md
│   └── terminal-settings.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 Spec Kit — NÃO criado por /speckit-plan
```

### Source Code (repository root)

```text
apps/pdv/app/
├── lib/
│   ├── app/router/pdv_router.dart          # + rotas cash/sangria/history/settings + guards
│   ├── features/
│   │   ├── cash/                           # NOVO — hub, turno, sangria/reforço
│   │   │   ├── domain/
│   │   │   ├── data/                       # persistência local + fixtures
│   │   │   ├── application/
│   │   │   └── presentation/               # hub, open, close, cash movement, receipt
│   │   ├── sales_history/                  # NOVO — últimas vendas + detalhe
│   │   │   ├── domain/                     # pode reexportar SaleRecord do cash
│   │   │   ├── application/
│   │   │   └── presentation/
│   │   ├── settings/                       # NOVO — terminal + módulos read-only
│   │   │   ├── domain/
│   │   │   ├── data/
│   │   │   ├── application/
│   │   │   └── presentation/
│   │   ├── counter/                        # SaleAdjustment + totais; painel editável
│   │   ├── payment/                        # ao finalizar → registra SaleRecord no turno
│   │   ├── home/                           # destinos S/U/Ç/F9 + entrada hub Caixa
│   │   └── modules/                        # + id cash_hub (núcleo); settings continua settings
│   └── ui/                                 # reutilizar empty/loading/error
├── test/unit/                              # cash expected, adjustment, cancel
├── test/widget/                            # guards, hub, home wiring
└── AGENTS.md
```

**Structure Decision**: feature-first com camadas, como o restante do app. `cash` concentra turno + movimentos; `sales_history` consome vendas do turno; `settings` separado do painel debug de módulos. Não criar pastas vazias antecipadas.

## Complexity Tracking

> Nenhuma violação de constituição a justificar.
