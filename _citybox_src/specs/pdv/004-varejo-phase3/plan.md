# Implementation Plan: PDV Varejo (Fase 3)

**Branch**: `004-varejo-phase3` | **Date**: 2026-08-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/pdv/004-varejo-phase3/spec.md`

**Fonte de análise**: `.claude/docs/pdv-app-frontend-gap-2026-08-05.md` (Fase 3 itens 19–23; §5.5 varejo; §6.1); preferência de UI do usuário: **TextField filled** + **escala desktop** (fonts, botões, diálogos grandes) — padrão já definido em AGENTS §4.0 / §4.8 / §4.8.1 e no contrato da Fase 2.

**Nota de numeração**: Este plano é a **Fase 3 do gap** (Varejo 🏬). Pré-requisitos: Fase 0 (`001-foundation-phase0`) e Fase 1 (`002-common-core-phase1`). **Independente** da Fase 2 food (`003-food-phase2`); se breakpoints/`pdv_filled_field` já existirem da Fase 2, **reutilizar** — senão entregar o mínimo necessário nesta fase para as telas tocadas.

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Entregar a fatia **varejo** do PDV Flutter (`apps/pdv/app` / `citybox_pdv`): **código de barras** funcional no Balcão (incl. quantidade × produto); **grade/variação** (tamanho/cor); **produto por peso / balança simulada**; tela **Consulta de preço**; **Devolução** (`V` / `refund`) e **Crédito dos clientes** (`C` / `credit`) — núcleo ⬛. Um Balcão só, blocos por módulo (`barcode`, `scale`, `variant_grid`, + novo `price_check`). Fixture + persistência local; turno obrigatório (gate Fase 1).

**UI (obrigatório nesta fase)**:
- Campos de formulário / diálogos / páginas novas: **sempre Filled** (`pdvFilledDecoration` / `PdvFilledField`, `PdvColors.inputFill`) — ver [filled-fields.md](./contracts/filled-fields.md).
- Escala **desktop de caixa**: tipografia ≥ `PdvTypography.bodyMd` (17) em campos e labels operacionais; botões `PdvSizes.controlHeight` (56) / `controlHeightLg` (64) para ações principais; diálogos `PdvDialogBody` + `dialogMdWidth` (560) / `dialogLgWidth` (720). Proibido alturas 36/40 px ou diálogos estreitos ad hoc.
- Exceção consciente AGENTS §4.8.1: **régua da toolbar** do Balcão (busca + barcode embutidos) permanece flat/`filled: false` na faixa contínua; o campo de barras vira `TextField` real com `bodyMd`. Qualquer diálogo aberto a partir dali (peso, grade, qty) usa Filled + diálogo grande.

Sem backend, leitor/balança físicos, TEF, NF, fiado-como-pagamento no checkout, ou fatias food/sessão (Fases 2/4).

## Technical Context

**Language/Version**: Dart ≥ 3.7 / Flutter ≥ 3.29 (validado 3.44.8 / Dart 3.12.2) — pacote `citybox_pdv`

**Primary Dependencies**:
- Existentes: `flutter_riverpod` ^2.6.1, `go_router` ^16.2, `shared_preferences` ^2.5.3, `intl`, `window_manager`, `package_info_plus`
- Nesta fase: **reusar** `shared_preferences` para devoluções + contas de crédito — ver [research.md](./research.md). Sem pacote novo obrigatório / sem SDK de hardware.

**Storage**: Persistência local (turno Fase 1 + `pdv.refund.v1` + `pdv.credit.v1`). Catálogo produtos/códigos/SKUs em fixture. Sem Postgres/HTTP.

**Testing**: `flutter_test` + `ProviderScope` overrides — `test/unit/` (resolve barcode, peso→centavos half-up, merge linha, elegibilidade devolução, saldo crédito) e `test/widget/` (Home V/C, consulta preço, barcode no Balcão, diálogos filled + tamanhos desktop, perfis Loja/Mercado). Goldens/`integration_test` → Fase 5.

**Target Platform**: Linux, Windows (caixa expandido) e Android tablet — telas novas + Balcão varejo nos **três formatos** (FR-018); reusa `PdvBreakpoints` se Fase 2 já entregou, senão aplica layout adaptativo mínimo às rotas desta fase.

**Project Type**: app nativo Flutter modular — **não** o PWA `apps/pdv/frontend`.

**Performance Goals**: SC-001…SC-009 do spec (0 “não implementado” em V/C; ≥5 bipagens + pagamento &lt; 5 min; consulta sem sujar carrinho; peso em centavos; restauração pós-reinício; tablet ~800 px).

**Constraints**:
- Sem backend / Keycloak / TEF / hardware real / sync (FR-019)
- Sem Mesas/Comandas/Delivery/blocos food (FR-020); sem login/NF (FR-021)
- Imutabilidade Riverpod; imports `package:citybox_pdv/...`; `flutter analyze` = `No issues found!`
- Dinheiro só em centavos; toda UI consulta `isOperationallyVisible`
- **TextField Filled** em formulários/diálogos; **escala desktop** (fonts/botões/diálogos) via tokens — ver constraints de UI no Summary
- Docs-as-code: atualizar `apps/pdv/app/AGENTS.md` (features varejo + reforço Filled/desktop)
- Flutter fora do Turborepo/pnpm

**Scale/Scope**: Features `price_check`, `refund`, `credit` (ou `customer_credit`); extensão de `counter` (barcode, qty×sku, variant dialog, scale dialog + layouts); ids `price_check` no catálogo; ~4–6 rotas novas; zero endpoints HTTP.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Avaliado contra `.specify/memory/constitution.md` v1.0.0. Escopo Flutter nativo — itens web/Nest N/A justificados.

| Princípio | Status | Nota |
|---|---|---|
| I. Docs-as-Code (AGENTS.md) | ✅ PASS | Plano exige atualizar `apps/pdv/app/AGENTS.md` (varejo, Filled, escala desktop). Raiz: sem nova porta/pacote monorepo. |
| II. Backend-Driven Search/Pagination | ✅ N/A justificado | Busca/listagem local com critério no application (vendas para devolução, clientes crédito); §8.1 quando houver API. |
| III. Single Package Manager (pnpm) | ✅ PASS (escopo) | Só `flutter pub`. |
| IV. Atomic Design / `@citybox/ui` | ✅ N/A justificado | Tokens `PdvColors`/`PdvTypography`/`PdvSizes`; campos Filled; diálogos `PdvDialogBody`. |
| V. Tenant Isolation / Prisma | ✅ N/A | Sem schema. |
| Auth / Messaging / Nest+Next | ✅ N/A | FR-019. |
| Workflow / Gates / No commit sem aprovação | ✅ PASS (a aplicar) | TDD Flutter; analyze + test; commit só com autorização. |
| Strict lint | ✅ PASS (análogo Dart) | Analyze limpo. |

Nenhuma violação injustificada. Complexity Tracking vazio.

**Re-check pós-Phase 1** (após `research.md`, `data-model.md`, `contracts/`, `quickstart.md`):
desenho local ao Flutter; contratos internos (navigation, retail-scan, weight-money, refund-credit, filled-fields + desktop UI); sem Prisma/`@citybox/ui`. Gate: ✅ PASS para `/speckit-tasks`.

## Project Structure

### Documentation (this feature)

```text
specs/pdv/004-varejo-phase3/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── navigation.md
│   ├── retail-scan.md
│   ├── weight-money.md
│   ├── refund-credit.md
│   └── filled-fields.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 Spec Kit — NÃO criado por /speckit-plan
```

### Source Code (repository root)

```text
apps/pdv/app/
├── lib/
│   ├── core/
│   │   ├── layout/                     # reusar PdvBreakpoints (Fase 2) ou mínimo
│   │   └── format/                     # formatCents; + arredondamento peso
│   ├── ui/
│   │   ├── pdv_filled_field.dart       # reusar/criar — Filled canônico
│   │   ├── pdv_dialog.dart             # PdvDialogBody — diálogos Md/Lg
│   │   └── …
│   ├── app/router/pdv_router.dart      # + /price-check, /refund, /credit
│   └── features/
│       ├── modules/                    # + price_check; wiring Home V/C
│       ├── counter/                    # barcode field real; qty×; variant; scale
│       ├── price_check/                # NOVO — consulta sem carrinho
│       ├── refund/                     # NOVO — devolução
│       ├── credit/                     # NOVO — fiado saldo/extrato/receber
│       ├── cash/                       # SaleRecord + impacto gaveta em estorno
│       ├── home/                       # destinos V / C (+ consulta se no catálogo)
│       └── customer/                   # reuso busca cliente no crédito
├── test/unit/
├── test/widget/
└── AGENTS.md
```

**Structure Decision**: feature-first com camadas, como o restante do app. Balcão permanece único (`counter/`) com blocos condicionados a módulos. Devolução e crédito são features de tela próprias (núcleo), não pastas “só varejo” duplicando o Balcão. Reutilizar `PdvFilledField` / breakpoints se a Fase 2 já os tiver; senão criar sob `ui/` e `core/layout/` nesta entrega. Não criar pastas vazias antecipadas.

## Complexity Tracking

> Nenhuma violação de constituição a justificar.
