# Implementation Plan: Tela Facilita NFE (aba "Emitido")

**Branch**: `009-facilita-nfe-screen` | **Date**: 2026-08-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/erp/009-facilita-nfe-screen/spec.md`

## Summary

Desenvolver a aba "Emitido" da tela Facilita NFE (`financas/facilita-nfe` no
`erp-web`), hoje um `PlaceholderPage`, consumindo `services/fiscal-api` para listar os
documentos fiscais (NF-e/NFS-e/NFC-e) emitidos pela loja ativa, com busca, filtro e
paginação **backend-driven** (Constitution Princípio II) e cards de totais por status.
As abas "Recebido" e "Histórico de Envios", e as ações "Agendar envio"/"Enviar por
e-mail", ficam como placeholder — fora de escopo nesta entrega (ver
`spec.md` `## Clarifications`). A `fiscal-api` ganha duas extensões pequenas no módulo
`fiscal-documents`: parâmetro `search` em `GET /v1/fiscal-documents` e o novo
`GET /v1/fiscal-documents/summary` (contagens por status) — ambas necessárias para a UI
não violar o Princípio II. O item de menu "Facilita NF-e" em Finanças deixa de estar
`disabled` no painel.

## Technical Context

**Language/Version**: TypeScript ~5.8.3 (ambos os apps)

**Primary Dependencies**: Frontend — Next.js 16.2.7 (App Router) + React 19.2.7 +
`@citybox/mui` + `@tanstack/react-query` ^5.101. Backend — NestJS 11, Prisma
(`fiscal-api` já usa schema próprio single-schema).

**Storage**: PostgreSQL (banco `citybox`, schema próprio de `fiscal-api` — sem migration
nova; só query nova sobre tabelas existentes, ver `data-model.md`)

**Testing**: Backend — Node test runner nativo / Jest (ver
`services/fiscal-api/AGENTS.md`), Postgres real, sem mocks de banco. Frontend — Vitest +
Testing Library + MSW (mock do proxy).

**Target Platform**: Web (navegador) — `erp-web` (:3107) consumindo `fiscal-api` (:3116)
via novo proxy BFF same-origin.

**Project Type**: Web application (frontend Next.js + backend NestJS, monorepo)

**Performance Goals**: SC-001 (lista visível em <3s), SC-003 (busca/filtro <1s até 1.000
documentos) — atendido por paginação/filtro no banco (índices existentes por
`companyId`; `search` usa `ILIKE`/`contains` sem índice full-text dedicado nesta
entrega, aceitável para o volume esperado do piloto Ilhéus).

**Constraints**: Toda busca/paginação/ordenação MUST ser backend-driven (Constitution
Princípio II) — nenhum carregamento do conjunto completo para filtrar no cliente.

**Scale/Scope**: 1 loja piloto (Ilhéus), volume de documentos fiscais na casa de
centenas/poucos milhares no horizonte do piloto — não exige otimização além de
paginação+índice padrão.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Aplica-se? | Situação |
|---|---|---|
| I. Docs-as-Code (`AGENTS.md`) | ✅ | Tarefas incluem atualizar `services/fiscal-api/AGENTS.md` (novo endpoint + param), `apps/erp/web/AGENTS.md` (feature nova + nav) e a tabela de portas do `AGENTS.md`/`CLAUDE.md` raiz (fiscal-api ausente hoje, achado do research §5) |
| II. Backend-Driven Search/Pagination | ✅ | **Gate motivou 2 extensões de backend** (`search` + `/summary`) para não violar o princípio — ver `research.md` §3. `manualPagination` no `DataTable`, debounce 400ms |
| III. Single Package Manager (pnpm) | ✅ | Sem novo tooling; `pnpm --filter` em ambos os apps |
| IV. Atomic Design / `@citybox/ui` | ⚠️ N/A parcial | Módulo Finanças do `erp-web` é **100% `@citybox/mui`**, não `@citybox/ui` (ver `apps/erp/web/AGENTS.md` §4.5) — usar `@citybox/mui` + `@/components/ui/data-table`, consistente com o restante de Finanças, não com o princípio geral do design system em `@citybox/ui` (documentado como exceção estabelecida no app) |
| V. Tenant Isolation / Schemas independentes | ✅ | Sem migration; `fiscal-api` mantém schema próprio. `companyId` sempre exigido no filtro (equivalente a isolamento por tenant na consulta) |

**Resultado**: PASS. Nenhuma violação sem justificativa — a única aparente (IV) é uma
convenção já documentada e aplicada a todo o módulo Finanças, não uma exceção nova desta
feature.

## Project Structure

### Documentation (this feature)

```text
specs/erp/009-facilita-nfe-screen/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
├── contracts/
│   └── fiscal-documents.md
└── tasks.md              # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
services/fiscal-api/
└── src/modules/fiscal-documents/
    ├── application/use-cases/
    │   ├── list-fiscal-documents/            # MODIFICADO: + search
    │   │   ├── list-fiscal-documents.use-case.ts
    │   │   └── list-fiscal-documents.use-case.spec.ts
    │   └── get-fiscal-documents-summary/     # NOVO
    │       ├── get-fiscal-documents-summary.use-case.ts
    │       └── get-fiscal-documents-summary.use-case.spec.ts
    ├── domain/repositories/
    │   └── fiscal-document.repository.interface.ts   # MODIFICADO: + search no findAll/count
    ├── infrastructure/
    │   ├── prisma-fiscal-document.repository.ts        # MODIFICADO: WHERE search
    │   └── http/routes/
    │       ├── list-fiscal-documents/list-fiscal-documents.route.ts   # MODIFICADO: + search, enum NFCE
    │       └── get-fiscal-documents-summary/                          # NOVO
    │           └── get-fiscal-documents-summary.route.ts
    └── application/dtos/fiscal-document.dto.ts          # MODIFICADO: + search

apps/erp/web/
├── src/app/api/proxy/fiscal/[...path]/route.ts   # NOVO — proxy BFF p/ fiscal-api
├── src/app/(app)/financas/facilita-nfe/page.tsx  # MODIFICADO — sai de PlaceholderPage
├── src/lib/navigation.ts                          # MODIFICADO — remove disabled do item Finanças
└── src/features/facilita-nfe/                     # NOVO
    ├── GUIA.md
    ├── api/
    │   ├── fiscal-document.dto.ts
    │   ├── fiscal-document.mapper.ts
    │   └── facilita-nfe.service.ts
    ├── hooks/
    │   ├── use-facilita-nfe-list.ts
    │   ├── use-facilita-nfe-summary.ts
    │   └── use-fiscal-company.ts        # resolve companyId por CNPJ (research §2)
    ├── components/
    │   ├── facilita-nfe-tabs.tsx
    │   ├── facilita-nfe-summary-cards.tsx
    │   ├── facilita-nfe-issued-table.tsx
    │   ├── facilita-nfe-filters-drawer.tsx
    │   └── facilita-nfe-placeholder-tab.tsx   # Recebido / Histórico de Envios
    ├── pages/
    │   └── facilita-nfe-page.tsx
    └── types/
        └── fiscal-document.ts
```

**Structure Decision**: Web application padrão do monorepo — mudança de backend
localizada em `services/fiscal-api` (módulo já existente, sem serviço novo) + feature
nova em `apps/erp/web` seguindo exatamente o layout de `features/bank-accounts`/
`features/financial-statement` (`api/hooks/components/pages/types`, `GUIA.md`
obrigatório). Nenhum BFF de domínio novo — proxy direto molde
`app/api/proxy/comercio/`.

## Complexity Tracking

*Sem violações da Constitution a justificar — tabela vazia por design.*
