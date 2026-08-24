# Implementation Plan: PDV Fundação (Fase 0)

**Branch**: `001-foundation-phase0` | **Date**: 2026-08-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/pdv/001-foundation-phase0/spec.md`

**Fonte de análise**: `.claude/docs/pdv-app-frontend-gap-2026-08-05.md` (Fase 0, §5, §7.1–7.4, §5.8)

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Refatoração de base do PDV Flutter (`apps/pdv/app` / `citybox_pdv`) **antes de qualquer tela nova**: estender o catálogo de módulos para comportamentos de Balcão; classificar núcleo × opcional; substituir visibilidade binária por `disponível | desligado | bloqueado` (UI operacional trata bloqueado = ausente); tornar a origem do conjunto injetável com cache local e perfis nomeados; isolar o painel de escrita fora do release; migrar dinheiro de `double` para centavos (`int`); introduzir `go_router` e portar as cinco telas; documentar adiamento do mobile/tablet operacional; padronizar widgets de loading/erro/vazio; e corrigir `SaleCompletedPage` (e demais pontos) que ignoram o catálogo. Sem backend, sem telas de produto novas.

## Technical Context

**Language/Version**: Dart ≥ 3.7 / Flutter ≥ 3.29 (validado 3.44.8 / Dart 3.12.2) — pacote `citybox_pdv`

**Primary Dependencies**:
- Existentes: `flutter_riverpod` ^2.6.1 (sem code-gen), `intl` ^0.20.2, `window_manager` ^0.5.2, `package_info_plus` ^10.2.1, `flutter_localizations`
- A adicionar nesta fase (primeiro uso real, conforme AGENTS §4.5): `go_router` (rotas declarativas); pacote leve de persistência local para cache de módulos (decisão em [research.md](./research.md) — preferência `shared_preferences`)

**Storage**: Cache local no terminal (último conjunto de módulos conhecido). Sem Postgres/Prisma nesta fase. Fixtures/perfis em memória + persistência do cache.

**Testing**: `flutter_test` + `ProviderScope` com overrides — unit (`test/unit/`) e widget (`test/widget/`). Goldens/`integration_test` ficam para Fase 5 (Assumption do spec). Meta: cobrir catálogo/estados/perfis, aritmética em centavos, rotas das 5 telas e §5.8.

**Target Platform**: Linux, Windows (caixa) e Android (tablet/celular) — iOS/macOS/web fora. Janela mínima desktop atual preservada; layouts compacto/médio de Balcão/Pagamento **adiados** (FR-011).

**Project Type**: desktop + mobile app nativo (Flutter) — um único app modular food/varejo; **não** o PWA `apps/pdv/frontend`.

**Performance Goals**: N/A numérico no spec. Objetivos mensuráveis são SC-001…SC-009 (fechamento sem arredondamento fantasma, perfis, release sem painel, offline cache, sem regressão de fluxo).

**Constraints**:
- Sem backend / Keycloak / TEF / impressão / sync (FR-015)
- Sem telas novas de produto (FR-014)
- Imutabilidade Riverpod (`state = state.copyWith(...)`); imports `package:citybox_pdv/...`; `flutter analyze` = `No issues found!`
- Dinheiro só em centavos no domínio (AGENTS §4.6 + FR-009)
- Uma consulta de visibilidade operacional (`isOperationallyVisible`) — FR-016/017
- Painel de escrita de módulos ausente em release (FR-008 / `kReleaseMode` ou flag de build)
- Docs-as-code: atualizar `apps/pdv/app/AGENTS.md` na mesma entrega (adiamento mobile + mudanças estruturais)
- Flutter **não** entra no Turborepo/pnpm — ciclo próprio (`flutter test` / `flutter analyze`)

**Scale/Scope**: 5 telas existentes + feature `modules` + `core/format` + `ui/` (estados) + shell de navegação. Catálogo: 13 ids de tela atuais + ≥9 comportamentos (FR-001). 4 perfis nomeados. Zero endpoints HTTP.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Avaliado contra `.specify/memory/constitution.md` v1.0.0. Princípios web/Nest da constituição aplicam-se ao monorepo; este escopo é Flutter nativo — itens N/A justificados abaixo.

| Princípio | Status | Nota |
|---|---|---|
| I. Docs-as-Code (AGENTS.md) | ✅ PASS | Plano exige atualizar `apps/pdv/app/AGENTS.md` (estrutura módulos, centavos, go_router, adiamento mobile §4.7/FR-011, histórico). Índice raiz: sem mudança de porta/pacote — não exige edição da raiz salvo se surgir dependência estrutural documentada só no módulo. |
| II. Backend-Driven Search/Pagination | ✅ N/A justificado | Sem listagens de API nesta fase; fixtures locais. Política §8.1 do monorepo não se aplica a catálogo in-memory do PDV. |
| III. Single Package Manager (pnpm) | ✅ PASS (escopo) | Não introduz npm/yarn no monorepo. App Flutter usa `flutter pub` no pacote isolado (já estabelecido em `apps/pdv/app/AGENTS.md`). |
| IV. Atomic Design / `@citybox/ui` | ✅ N/A justificado | PDV Flutter usa tokens próprios (`PdvColors`/`PdvTypography`/…); AGENTS do app proíbe herdar o PWA. Novos estados loading/erro/vazio entram em `lib/ui/` com tokens — não duplicar shadcn web. |
| V. Tenant Isolation / Prisma schemas | ✅ N/A justificado | FR-015: sem schema/banco. Cache local de módulos não é multi-tenant DB. |
| Auth Keycloak / Messaging / Nest+Next pins | ✅ N/A | Fora de escopo (FR-015). |
| Workflow / Gates / No commit sem aprovação | ✅ PASS (a aplicar) | TDD no app Flutter; `flutter analyze` + `flutter test`; commit só com autorização explícita do usuário. |
| Strict lint (sem `@ts-ignore` / eslint-disable) | ✅ PASS (análogo Dart) | Sem `// ignore:` sem justificativa; analyze limpo (AGENTS §4.1). |

Nenhuma violação injustificada. Complexity Tracking vazio.

**Re-check pós-Phase 1** (após `research.md`, `data-model.md`, `contracts/`, `quickstart.md`):
desenho permanece local ao Flutter app; contratos são internos (API de módulos + rotas + Money), sem schema Prisma nem `@citybox/ui`. Gate mantido: ✅ PASS para `/speckit-tasks`.

## Project Structure

### Documentation (this feature)

```text
specs/pdv/001-foundation-phase0/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── modules-api.md
│   ├── navigation.md
│   └── money.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 — NÃO criado por /speckit-plan
```

### Source Code (repository root)

App Flutter existente — nenhum pacote monorepo novo. Superfície tocada:

```text
apps/pdv/app/
├── lib/
│   ├── main.dart                          # ProviderScope + MaterialApp.router
│   ├── app/
│   │   ├── router/                        # NOVO — GoRouter, rotas nomeadas, título
│   │   └── shell/                         # PdvScaffold, title bar; painel só em debug
│   ├── core/
│   │   ├── format/                        # Money / pdv_currency (centavos → R$)
│   │   ├── theme/                         # inalterado salvo tokens de estado se preciso
│   │   └── platform/
│   ├── ui/                                # NOVO: PdvLoadingState, PdvErrorState, PdvEmptyState
│   └── features/
│       ├── modules/
│       │   ├── domain/                    # ids, tipo, classificação, estado, catálogo
│       │   ├── data/                      # fonte injetável, cache, perfis nomeados
│       │   ├── application/               # controller + isOperationallyVisible
│       │   └── presentation/              # ModulesPanel (debug-only)
│       ├── home/                          # consome catálogo; sem mudança de produto
│       ├── counter/                       # priceCents; blocos ainda não renderizam comportamentos
│       ├── payment/                       # PaymentSummary em centavos; §5.8 sale_completed
│       ├── customer/                      # rota nomeada
│       └── shared/
├── test/
│   ├── unit/                              # módulos, money, perfis, validação núcleo
│   └── widget/                            # rotas, §5.8, painel ausente em release (flag)
└── AGENTS.md                              # docs-as-code na mesma entrega
```

**Structure Decision**: feature-first com camadas (`domain` / `data` / `application` / `presentation`) já adotada em `apps/pdv/app`. Fase 0 estende `features/modules`, introduz `app/router/`, tipa dinheiro em `core/format`, e adiciona estados em `lib/ui/`. Não cria pastas vazias antecipadas.

## Complexity Tracking

> Nenhuma violação de constituição a justificar.
