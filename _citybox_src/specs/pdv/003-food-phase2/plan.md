# Implementation Plan: PDV Food (Fase 2)

**Branch**: `003-food-phase2` | **Date**: 2026-08-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/pdv/003-food-phase2/spec.md`

**Fonte de análise**: `.claude/docs/pdv-app-frontend-gap-2026-08-05.md` (Fase 2 itens 13–18; §5.5; §7.2); preferência de UI do usuário: **TextField filled**

**Nota de numeração**: Este plano é a **Fase 2 do gap** (Food 🍽). Pré-requisitos: Fase 0 (`001-foundation-phase0`) e Fase 1 (`002-common-core-phase1`) já no app (módulos/comportamentos, rotas, turno, centavos).

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Entregar a fatia **food** do PDV Flutter (`apps/pdv/app` / `citybox_pdv`): **breakpoints** (compacto/médio/expandido) em Mesas, Comandas, Atendimentos, Delivery **e** Balcão/Pagamento; **mapa de mesas** (estados, abrir → Balcão, transferir/juntar/dividir); **comandas** (Home + app bar do Balcão → Pagamento); **fila de atendimentos**; **blocos do Balcão** (adicional, observação de cozinha, meia-a-meia); **taxa de serviço e couvert** no painel de totais; **Delivery** (novo pedido + fila/despacho). Tudo em fixture + persistência local, consultando o catálogo de módulos. **Campos de texto novos e reformados nesta fase usam sempre a variante Filled** (`filled: true`, `PdvColors.inputFill`, underline) — padrão do sistema (`CustomerFormField` / AGENTS §4.0.1). Sem backend, TEF, KDS real ou fatias varejo/sessão (Fases 3–4).

## Technical Context

**Language/Version**: Dart ≥ 3.7 / Flutter ≥ 3.29 (validado 3.44.8 / Dart 3.12.2) — pacote `citybox_pdv`

**Primary Dependencies**:
- Existentes: `flutter_riverpod` ^2.6.1, `go_router` ^16.2, `shared_preferences` ^2.5.3, `intl`, `window_manager`, `package_info_plus`
- Nesta fase: **reusar** `shared_preferences` para sessões de salão (mesas/comandas/atendimentos/pedidos delivery) — ver [research.md](./research.md). Sem pacote novo obrigatório.

**Storage**: Persistência local (turno Fase 1 + snapshot de salão/delivery desta fase). Sem Postgres/HTTP.

**Testing**: `flutter_test` + `ProviderScope` overrides — `test/unit/` (totais food, meia-pizza, estados de mesa, divisão de conta) e `test/widget/` (breakpoints, Home M/Q/A/D/W, Comandas no Balcão, formulários filled). Goldens/`integration_test` → Fase 5 do gap.

**Target Platform**: Linux, Windows (caixa) e **Android tablet/celular** — esta fase **entrega** os três formatos (FR-001); fim do adiamento documentado na Fase 0 para o escopo listado.

**Project Type**: app nativo Flutter modular — **não** o PWA `apps/pdv/frontend`.

**Performance Goals**: SC-001…SC-009 do spec (0 “não implementado” em M/Q/A/D/W; ciclo mesa→pagamento &lt; 5 min; tablet ~800 px utilizável; totais em centavos; restauração pós-reinício).

**Constraints**:
- Sem backend / Keycloak / TEF / impressão de cozinha / sync (FR-021, FR-024)
- Sem varejo Balcão (barcode/grade/peso) nem Devolução/Crédito (FR-022)
- Imutabilidade Riverpod; imports `package:citybox_pdv/...`; `flutter analyze` = `No issues found!`
- Dinheiro só em centavos; toda UI consulta `isOperationallyVisible`
- **TextField / TextFormField: sempre Filled** nesta fase — helper compartilhado em `lib/ui/` (extrair de `customerFilledDecoration`); proibido outlined/underline-only sem fill em formulários novos (delivery, abertura de comanda, observação de item, couvert, etc.)
- Docs-as-code: atualizar `apps/pdv/app/AGENTS.md` (breakpoints entregues + regra Filled + features food)
- Flutter fora do Turborepo/pnpm

**Scale/Scope**: Features `tables`, `tabs` (comandas), `service` (atendimentos), `delivery`; extensão de `counter` (addons/half/kitchen note + taxa/couvert + layouts); guards/rotas; ~8–12 rotas novas; zero endpoints HTTP.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Avaliado contra `.specify/memory/constitution.md` v1.0.0. Escopo Flutter nativo — itens web/Nest N/A justificados.

| Princípio | Status | Nota |
|---|---|---|
| I. Docs-as-Code (AGENTS.md) | ✅ PASS | Plano exige atualizar `apps/pdv/app/AGENTS.md` (food features, breakpoints, TextField filled). Raiz: sem nova porta/pacote monorepo. |
| II. Backend-Driven Search/Pagination | ✅ N/A justificado | Listagens locais com critério (fila/status); §8.1 aplica quando houver API. |
| III. Single Package Manager (pnpm) | ✅ PASS (escopo) | Só `flutter pub`. |
| IV. Atomic Design / `@citybox/ui` | ✅ N/A justificado | Tokens `PdvColors`/`PdvTypography`; campos Filled com `inputFill`. |
| V. Tenant Isolation / Prisma | ✅ N/A | Sem schema. |
| Auth / Messaging / Nest+Next | ✅ N/A | FR-021. |
| Workflow / Gates / No commit sem aprovação | ✅ PASS (a aplicar) | TDD Flutter; analyze + test; commit só com autorização. |
| Strict lint | ✅ PASS (análogo Dart) | Analyze limpo. |

Nenhuma violação injustificada. Complexity Tracking vazio.

**Re-check pós-Phase 1** (após `research.md`, `data-model.md`, `contracts/`, `quickstart.md`):
desenho local ao Flutter; contratos internos (salon, navigation, totals-food, filled-fields); sem Prisma/`@citybox/ui`. Gate: ✅ PASS para `/speckit-tasks`.

## Project Structure

### Documentation (this feature)

```text
specs/pdv/003-food-phase2/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── navigation.md
│   ├── salon-account.md
│   ├── food-totals.md
│   └── filled-fields.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 Spec Kit — NÃO criado por /speckit-tasks ainda
```

### Source Code (repository root)

```text
apps/pdv/app/
├── lib/
│   ├── core/
│   │   └── layout/                     # NOVO — PdvBreakpoints + helpers de formato
│   ├── ui/
│   │   ├── pdv_filled_field.dart       # NOVO — InputDecoration + widget Filled canônico
│   │   └── …                           # empty/loading/error existentes
│   ├── app/router/pdv_router.dart      # + rotas tables/tabs/service/delivery + returnTo
│   └── features/
│       ├── tables/                     # NOVO — mapa, transfer/join/split
│       ├── tabs/                       # NOVO — comandas (id módulo `tabs`)
│       ├── service/                    # NOVO — fila atendimentos (id `service`)
│       ├── delivery/                   # NOVO — novo pedido + lista/despacho
│       ├── counter/                    # + cart line food; taxa/couvert; layouts
│       ├── payment/                    # layouts responsivos; returnTo pós-venda
│       ├── cash/                       # SaleRecord enriquecido (addons/fee/couvert)
│       ├── home/                       # destinos M/Q/A/D/W
│       └── modules/                    # ids já existem; wiring Home
├── test/unit/
├── test/widget/
└── AGENTS.md
```

**Structure Decision**: feature-first com camadas, como o restante do app. `tabs` no filesystem espelha `PdvModuleIds.tabs` (comandas). Atendimento (`service`) é projeção/fila sobre contas abertas — não um terceiro ledger paralelo. Extrair Filled para `ui/` e migrar `CustomerFormField` a consumi-lo (sem mudar visual). Não criar pastas vazias antecipadas.

## Complexity Tracking

> Nenhuma violação de constituição a justificar.
