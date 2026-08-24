# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo overview

**Citybox Platform** — plataforma municipal de comércio digital (SaaS B2B + marketplace B2C). Turborepo + pnpm workspace.

Hierarquia de tenant: **Platform → Organization → Store** (single-city Ilhéus). Um Postgres **`citybox`** com schemas PostgreSQL lazy por vertical/API (`platform`, `food`, `clinica`, … — ADR C-15). Auth via Keycloak (ADR C-07), JWT propagado por guards locais nas APIs NestJS.

## ⚠️ Fonte de verdade: leia os `AGENTS.md` antes de agir

Este monorepo mantém uma hierarquia de arquivos **`AGENTS.md`** (plural) que é a **fonte de verdade** de cada escopo. **Sempre, antes de qualquer ação:**

1. Leia o **[`AGENTS.md`](AGENTS.md) raiz** para se orientar (mapa de serviços/portas, índice de módulos, estratégia de schemas Prisma — seções 3/4/6).
2. Abra o **`AGENTS.md` do módulo** específico em que vai trabalhar (índice abaixo) — ele detalha stack, restrições, variáveis de ambiente e padrões locais.
3. Este `CLAUDE.md` cobre o **harness ECC** (rules, agents, fluxo `/feature` e `/bugfix`, design system). Onde houver conflito factual (porta, caminho, schema), **o `AGENTS.md` prevalece**.

**Política de manutenção (obrigatória):** ao modificar código, infra, schema ou configuração, **atualize o(s) `AGENTS.md` afetado(s) na mesma operação** (mesmo commit/PR). Atualize o `AGENTS.md` raiz quando a mudança for estrutural/global (nova porta, novo app/package/serviço/vertical, mudança de schema single↔multi, comando da raiz). Documentação desatualizada é defeito, não pendência. Nunca remova seções — apenas atualize ou adicione. Detalhes na seção 7 do `AGENTS.md` raiz.

### Índice de `AGENTS.md`

| Escopo | Arquivo |
|--------|---------|
| **Raiz (índice do monorepo)** | [`AGENTS.md`](AGENTS.md) |
| Harness ECC (agents/skills do ponto de vista do agente) | [`.claude/AGENTS.md`](.claude/AGENTS.md) |
| ERP (conjunto) | [`apps/erp/AGENTS.md`](apps/erp/AGENTS.md) |
| ERP (web) | [`apps/erp/web/AGENTS.md`](apps/erp/web/AGENTS.md) |
| ERP (api) | [`apps/erp/api/AGENTS.md`](apps/erp/api/AGENTS.md) |
| PDV (PWA) | [`apps/pdv/frontend/AGENTS.md`](apps/pdv/frontend/AGENTS.md) |
| keycloak-theme | [`infra/keycloak/theme/AGENTS.md`](infra/keycloak/theme/AGENTS.md) |
| marketplace-api | [`apps/marketplace/api/AGENTS.md`](apps/marketplace/api/AGENTS.md) |
| marketplace-bff | [`apps/marketplace/bff/AGENTS.md`](apps/marketplace/bff/AGENTS.md) |
| admin (conjunto) | [`apps/admin/AGENTS.md`](apps/admin/AGENTS.md) |
| admin-api | [`apps/admin/api/AGENTS.md`](apps/admin/api/AGENTS.md) |
| admin-web | [`apps/admin/web/AGENTS.md`](apps/admin/web/AGENTS.md) |
| imoveis-web | [`apps/imoveis/web/AGENTS.md`](apps/imoveis/web/AGENTS.md) |
| realtime-gateway | [`apps/realtime-gateway/AGENTS.md`](apps/realtime-gateway/AGENTS.md) |
| workers | [`apps/workers/AGENTS.md`](apps/workers/AGENTS.md) |
| food (vertical piloto) | [`apps/verticals/food/AGENTS.md`](apps/verticals/food/AGENTS.md) |
| clinica — api | [`apps/verticals/clinica/api/AGENTS.md`](apps/verticals/clinica/api/AGENTS.md) |
| clinica — web (frontend desacoplado do ERP) | [`apps/verticals/clinica/web/AGENTS.md`](apps/verticals/clinica/web/AGENTS.md) |
| beautiful (conjunto) | [`apps/verticals/beautiful/AGENTS.md`](apps/verticals/beautiful/AGENTS.md) |
| beautiful — api | [`apps/verticals/beautiful/api/AGENTS.md`](apps/verticals/beautiful/api/AGENTS.md) |
| beautiful — web | [`apps/verticals/beautiful/web/AGENTS.md`](apps/verticals/beautiful/web/AGENTS.md) |
| payment-api (🔴 será refeito — não adotar) | [`services/payment-api/AGENTS.md`](services/payment-api/AGENTS.md) |
| `@citybox/ui` (design system) | [`packages/ui/AGENTS.md`](packages/ui/AGENTS.md) |
| `@citybox/mui` (design system MUI) | [`packages/mui/AGENTS.md`](packages/mui/AGENTS.md) |
| `@citybox/messaging` | [`packages/messaging/AGENTS.md`](packages/messaging/AGENTS.md) |
| `@citybox/nest-common` | [`packages/nest-common/AGENTS.md`](packages/nest-common/AGENTS.md) |
| Infra local (Docker) | [`infra/AGENTS.md`](infra/AGENTS.md) |

# Projeto Co-work — Memória do Claude Code

Este projeto usa o conjunto **ECC** (agents, commands, skills, hooks, rules e MCP) instalado em `.claude/`.

## Regras base do ECC (sempre aplicáveis)

@.claude/rules/ecc/common/agents.md
@.claude/rules/ecc/common/coding-style.md
@.claude/rules/ecc/common/development-workflow.md
@.claude/rules/ecc/common/git-workflow.md
@.claude/rules/ecc/common/patterns.md
@.claude/rules/ecc/common/performance.md
@.claude/rules/ecc/common/security.md
@.claude/rules/ecc/common/testing.md
@.claude/rules/ecc/common/code-review.md
@.claude/rules/ecc/common/hooks.md

## Stack do projeto

Projeto **full-stack TypeScript**: backend **Nest.js**, frontend **React**, banco **PostgreSQL** com **Prisma** (migrations versionadas).

### Regras sempre ativas — TypeScript (backend Nest + frontend)

@.claude/rules/ecc/typescript/coding-style.md
@.claude/rules/ecc/typescript/patterns.md
@.claude/rules/ecc/typescript/security.md
@.claude/rules/ecc/typescript/testing.md
@.claude/rules/ecc/typescript/hooks.md

### Regras sempre ativas — React (frontend)

@.claude/rules/ecc/react/coding-style.md
@.claude/rules/ecc/react/patterns.md
@.claude/rules/ecc/react/security.md
@.claude/rules/ecc/react/testing.md
@.claude/rules/ecc/react/hooks.md

### Regras sempre ativas — Web (frontend)

@.claude/rules/ecc/web/performance.md
@.claude/rules/ecc/web/design-quality.md
@.claude/rules/ecc/web/security.md

### Outras linguagens

Para outra linguagem/framework, consulte sob demanda as regras em
`.claude/rules/ecc/<linguagem>/` (ex.: `python`, `vue`, `golang`, `rust`, `java`, `swift`, etc.).

## Recursos ECC disponíveis

- **Agents** (subagentes): `.claude/agents/` — ex.: `code-reviewer`, `architect`, `planner`, `security-reviewer`.
- **Commands** (slash): `.claude/commands/` — ex.: `/code-review`, `/feature-dev`, `/checkpoint`.
- **Skills**: `.claude/skills/ecc/` — capacidades especializadas carregadas sob demanda.
- **Hooks**: configurados em `.claude/settings.json` (GateGuard, anti-`--no-verify`, auto-format, detecção de segredos, observabilidade).
- **MCP**: `.mcp.json` (chrome-devtools). Catálogo extra em `.claude/mcp-configs/mcp-servers.json`.

### Toggles úteis dos hooks ECC

- Desativar o GateGuard: rode a sessão com `ECC_GATEGUARD=off`.
- Desativar hooks específicos: `ECC_DISABLED_HOOKS="pre:bash:gateguard-fact-force,..."`.


## Mapa de serviços e portas

> Fonte de verdade desta tabela: seção 3 do [`AGENTS.md`](AGENTS.md) raiz.

| Serviço | Package | Porta | Localização |
|---------|---------|-------|-------------|
| marketplace-api | `@citybox/marketplace-api` | 3101 | `apps/marketplace/api` |
| marketplace-bff | `@citybox/marketplace-bff` | 3102 | `apps/marketplace/bff` |
| admin-api | `@citybox/admin-api` | 3103 | `apps/admin/api` |
| realtime-gateway | `@citybox/realtime-gateway` | 3104 | `apps/realtime-gateway` |
| workers | `@citybox/workers` | 3105 | `apps/workers` |
| payment-api | `@citybox/payment-api` | 3106 | `services/payment-api` |
| erp-web (backoffice) | `@citybox/erp-web` | 3107 | `apps/erp/web` |
| admin-web | `@citybox/admin-web` | 3108 | `apps/admin/web` |
| pdv (PWA) | `@citybox/pdv` | 3109 | `apps/pdv/frontend` |
| imoveis-web | `@citybox/imoveis-web` | 3111 | `apps/imoveis/web` |
| imoveis-api | `@citybox/imoveis-api` | 3112 | `apps/imoveis/api` |
| clinica-web | `@citybox/clinica-web` | 3113 | `apps/verticals/clinica/web` |
| erp-api | `@citybox/erp-api` | 3114 | `apps/erp/api` |
| beautiful-web | `@citybox/beautiful-web` | 3115 | `apps/verticals/beautiful/web` |
| fiscal-api | `@citybox/fiscal-api` | 3116 | `services/fiscal-api` |
| food-api (vertical piloto) | `@citybox/food-api` | 3171 | `apps/verticals/food/api` |
| clinica-api | `@citybox/clinica-api` | 3172 | `apps/verticals/clinica/api` |
| beautiful-api | `@citybox/beautiful-api` | 3173 | `apps/verticals/beautiful/api` |
| keycloak-theme | `@citybox/keycloak-theme` | — | `infra/keycloak/theme` (serve no Keycloak) |
| nginx (reverse proxy) | — | 8088 | `infra/nginx` |

Hosts locais necessários em `/etc/hosts`:
```
127.0.0.1 api.local.citybox.com app.local.citybox.com admin.local.citybox.com ws.local.citybox.com city.local.citybox.com
```

## Comandos da raiz

**Package manager: `pnpm@9.15.0` — ÚNICO. Nunca usar `npm`/`yarn`.** Lista completa na seção 5 do [`AGENTS.md`](AGENTS.md) raiz.

```bash
# Dev (Turborepo, por conjunto)
pnpm dev              # admin-api + admin-web + erp-web + erp-api + food-api + clinica-api
pnpm dev:food         # admin-api + erp-web + food-api
pnpm dev:varejo       # admin-api + erp-web + varejo-api
pnpm dev:clinica      # admin-api + clinica-api + clinica-web (app dedicado, :3113)

# Qualidade (workspace inteiro)
pnpm build && pnpm lint && pnpm typecheck && pnpm test
pnpm test:playwright  # E2E (@citybox/e2e-ui)

# Infra local (Docker)
pnpm infra:up         # essenciais   |  pnpm infra:up:full (todos)
pnpm infra:down       # pnpm infra:status

# Banco (platform / food)
pnpm db:migrate:platform:dev
pnpm db:generate:platform
pnpm db:migrate:food:deploy

# Harness ECC
pnpm harness:sync-skills   # recria symlinks de skills do Claude (.cursor/skills → .claude/skills)
```

Pacote único: `pnpm --filter @citybox/<pacote> <script>` ou `turbo run dev --filter=@citybox/<pacote>`.

## Arquitetura

### Apps (`apps/`)
- **marketplace/api** — NestJS; core da plataforma: catálogo, pedidos, checkout, usuários, auth.
- **marketplace/bff** — NestJS; gateway público para app consumidor (cache Redis, Typesense).
- **admin/api + admin/web** — backoffice de operação da plataforma (`@citybox/admin-api` + `@citybox/admin-web`; Next.js + NestJS).
- **erp** — Next.js 16; backoffice multi-vertical do lojista (`/{vertical}`), lazy modules via manifest registry.
- **workers** — consumidores RabbitMQ; projetam eventos em read models (Typesense, Postgres).
- **realtime-gateway** — WebSocket via Socket.IO + NestJS; auth JWT, pub/sub Redis.

### Packages (`packages/`)

**Existem em código** (confirmado — `ls packages/`):
- **nest-common** — `@citybox/nest-common`: provisionamento Keycloak compartilhado
  (`KeycloakProvisioningService`), usado pelas verticais. Criado na Fase 4 do PLAT-001.
- **messaging** — wrapper `@citybox/messaging` sobre amqplib + **contratos tipados dos
  eventos de plataforma** (`src/contracts/store-events.ts`, fonte de verdade única do
  envelope CloudEvents e das routing keys).
- **ui** — design system React (atomic design, Tailwind v4, shadcn). Usado em admin-web,
  erp e webs das verticais.
- **mui** — design system MUI (ver `packages/mui/AGENTS.md`).
- **docs**, **tsconfig** — documentação de arquitetura e configs TS compartilhadas.

**NÃO existem** (estavam documentados aqui por engano; corrigido na Fase 10 do PLAT-001 —
não crie import para eles): `packages/events`, `packages/contracts`, `packages/search`,
`packages/marketplace-projection`. Os contratos de evento vivem em `packages/messaging`;
não há `openapi.json` gerado no repositório.

### Verticais (`apps/verticals/`)

**Catálogo cadastrável no admin (desde 2026-07-30): duas verticais, uma por sistema.**

| `StoreVertical` | Slug ERP / role Keycloak | Sistema |
|---|---|---|
| `Comércio` | `comercio` / `vertical.comercio.view` | `apps/erp` — **food e varejo no mesmo sistema** |
| `Clínica` | `clinic` / `vertical.clinic.view` | `apps/verticals/clinica` |

`Food`, `Varejo`, `Educação` e `Serviços` saíram do catálogo. `Imóveis` só entra quando
`apps/imoveis/api` tiver tenancy própria e consumidor de `citybox.store.*` (padrão da
Fase 11 do `apps/erp/api`) — sem isso a loja fica presa em `deploymentStatus=PROVISIONING`.
Fonte de verdade do tipo: `StoreVertical` em `apps/admin/api/.../stores/domain/entities/store.entity.ts`.

O `scripts/verticals.config.mjs` ainda lista 12 verticais **planejadas** (food, market,
beauty, clinic, legal, realty, hospitality, education, subscriptions, events, rental,
services) — é backlog de produto, não o que o admin oferece. Cada uma pode ter `api/`
(NestJS, porta ≥3170) e `web/` (Next.js). **Hoje só duas existem em código:**
- **food** (🟢 piloto Ilhéus) — backend de cardápio implementado (`apps/verticals/food/api`, `@citybox/food-api`); frontend no módulo food do ERP.
- **clinica** (🟢 api + web) — `apps/verticals/clinica/api` (`@citybox/clinica-api`, :3172) e `apps/verticals/clinica/web` (`@citybox/clinica-web`, :3113). O **frontend foi desacoplado do ERP em 2026-07-29**: app Next.js próprio com rotas na raiz e auth Keycloak/BFF próprios. O antigo módulo `clinic` do shell multi-vertical legado saiu junto com a remoção de `apps/erp` legado em 2026-07-31.

Schema Postgres da vertical criado lazily no tenant único ao habilitar via `PlatformEnabledVertical`.

### Infraestrutura (`infra/`)
Docker Compose para Postgres, Redis, RabbitMQ, Keycloak, Typesense, Unleash (feature flags), MinIO, Metabase, nginx. Compose de apps Node.js em `deploy/docker-compose.apps.yml`.

## Harness dual: Cursor + Claude Code

Este projeto usa **ECC** nos dois IDEs, com pastas separadas e **memória isolada**:

| IDE | Pasta | Agents | Comandos | Memória de sessão |
|-----|-------|--------|----------|-------------------|
| **Cursor** | [`.cursor/`](.cursor/) | `.cursor/agents/ecc-*.md` | `.cursor/commands/*.md` | `~/.cursor/ecc` (via `.cursor/ecc-agent-data.json`) |
| **Claude Code** | [`.claude/`](.claude/) | `.claude/agents/*.md` (sem prefixo `ecc-`) | `.claude/commands/*.md` | `~/.claude` (padrão ECC) |

**Não há conflito de runtime** entre os dois: cada IDE carrega só a sua pasta e grava memória/hooks em diretórios diferentes. O código do monorepo é compartilhado; apenas o harness (agents, commands, hooks) é duplicado com convenções distintas.

- **Skills (fonte canônica):** [`.cursor/skills/`](.cursor/skills/) — após editar, rode `pnpm run harness:sync-skills` para recriar symlinks em `.claude/skills/<id>` (Claude Code não descobre skills aninhadas em `skills/ecc/`).
- **Rules ECC (Claude):** `.claude/rules/ecc/` — gerenciadas pelo instalador; não editar manualmente.
- **Artefatos de projeto (Claude):** PRDs, plans e reports em `.claude/prds/`, `.claude/plans/`, `.claude/reports/` (compartilhados entre IDEs).
- **Orquestradores:** `/feature` e `/bugfix` existem em **ambos** os harnesses (nomes de agents adaptados por IDE).

Reinstalar ECC: `install.sh --target cursor --profile full` (Cursor) ou `install.sh --target claude-project --profile full` (Claude); depois `pnpm run harness:sync-skills`.

## Fluxo de desenvolvimento (ECC)

Use sempre um dos dois orquestradores ECC. Cada um conduz todas as fases em ordem, do plano à entrega, acionando os agents/skills certos por lane (backend NestJS / frontend React / migration Prisma).

### `/feature` — nova funcionalidade full-stack

Orquestrador completo para implementar algo novo. Fases:

1. **Plano** (`/plan-prd` → `planner` → `/plan`) — reformula requisitos, lista arquivos por pacote, mapeia riscos (tenant, Keycloak, outbox, cobertura) e **para aguardando CONFIRM** do usuário.
2. **TDD** (`tdd-guide` + skill `tdd-workflow`) — ciclo RED → GREEN → REFACTOR; backend em Postgres real, frontend em Vitest.
3. **Revisão por lane** — backend → `typescript-reviewer`; React → `react-reviewer` + `typescript-reviewer`; migration → `database-reviewer`.
4. **Code review geral** (`/code-review` → `code-reviewer`) — tamanho de função/arquivo, erros, imutabilidade, sem `@ts-ignore`.
5. **Gate** (skill `verification-loop`) — `build` → `lint` → `typecheck` → `test` + cobertura.
6. **Segurança** (condicional) — `/security-scan` + `security-reviewer` se tocou auth/PSP/tenant/secrets.
7. **Entrega** — resumo + sugestão de commit `feat(...)`. Nunca commita sem autorização.

### `/bugfix` — correção de bug (reprodução-primeiro)

Orquestrador enxuto para corrigir defeitos. Fases:

1. **Reproduzir e isolar** (`code-explorer`) — encontra a causa-raiz e escreve um **teste de regressão que falha (RED)**.
2. **Plano mínimo** (`planner` leve) — menor correção possível; CONFIRM só se cruzar camadas/migration/auth.
3. **Correção** (TDD GREEN) — diff mínimo; `silent-failure-hunter` para erros engolidos.
4. **Revisão por lane** restrita ao diff.
5. **Gate** (`verification-loop`) nos pacotes afetados (`pnpm --filter <pkg> ...`).
6. **Segurança** condicional.
7. **Entrega** — resumo + sugestão de commit `fix(...)`.

### Pipeline canônico (resumo)

```
/feature → /plan-prd → planner → /plan → CONFIRM → tdd-guide
  → pnpm build && pnpm lint && pnpm typecheck && pnpm test → /code-review → typescript-reviewer
  → /security-scan → autorização explícita do usuário → commit → /pr
```

- **CONFIRM** do plano pelo usuário é obrigatório antes de codar.
- **Nunca commitar** sem autorização explícita do usuário ao fim da sessão.
- **Cursor:** comandos `/feature` e `/bugfix` em `.cursor/commands/`, agents `ecc-*` em `.cursor/agents/`.
- **Claude Code:** mesmos comandos em `.claude/commands/`, agents sem prefixo em `.claude/agents/`.
- Skills: fonte em `.cursor/skills/`; Claude consome via symlinks — `pnpm run harness:sync-skills`.

### Gates obrigatórios

Nomes de agent variam por IDE: `ecc-*` no Cursor, sem prefixo no Claude Code.

| Gate | Quando |
|------|--------|
| `database-reviewer` (`ecc-database-reviewer`) | tocou migration Prisma |
| `react-reviewer` (`ecc-react-reviewer`) | tocou `.tsx` em `apps/erp/web`, `apps/admin/web` ou `packages/ui` |
| Atualizar o contrato em `packages/messaging/src/contracts/` | alterou payload de evento de plataforma |
| Sem `eslint-disable @typescript-eslint/*` nem `@ts-ignore` | sempre |

### Artefatos ECC (`.claude/`)

| Tipo | Vertical | Plataforma |
|------|----------|------------|
| PRD | `.claude/prds/{vertical}/` | `.claude/prds/_platform/` |
| Plano | `.claude/plans/{vertical}/` | `.claude/plans/_platform/` |
| Code review | `.claude/reports/{vertical}/code-review-YYYY-MM-DD.md` | `.claude/reports/_platform/…` |

## Padrões de código

- **Backend**: NestJS 11, decorators + DI. Guards JWT são **locais a cada API** (`src/shared/infra/http/guards/`) — `@citybox/nest-common` só compartilha o provisionamento Keycloak. DTOs com `class-validator`. Swagger obrigatório em rotas públicas. Controllers finos — regra de negócio no service.
- **Testes backend**: jest **ou** Node test runner nativo (`node --import tsx --test`) — varia por app (ver `AGENTS.md` do módulo). Sem mocks de banco — testes batem em Postgres real.
- **Frontend**: Next.js 16 (App Router), React 19. Componentes de `@citybox/ui`. Testes com Vitest + Testing Library; E2E Playwright.
- **ORM**: Prisma. **Não há pacote `database` central — cada app é dono do seu schema.** Single-schema: `apps/admin/api`, `apps/verticals/food/api`, `apps/verticals/clinica/api`, `services/payment-api` (cada um em `prisma/schema.prisma`). Multi-schema (`prisma/platform/` + `prisma/tenant/`): `apps/marketplace/api` e `apps/workers`; só `tenant` em `apps/marketplace/bff`; só `platform` em `apps/realtime-gateway`. Detalhes na seção 6 do `AGENTS.md` raiz. Sempre rodar `database-reviewer` (`ecc-database-reviewer` no Cursor) ao tocar schema e atualizar o `AGENTS.md` do app dono.
- **Versões NestJS**: fixadas via `pnpm catalog` (11.x).
- **UUIDs**: `citybox_uuid_v7()` (função Postgres) como default em todos os IDs.
- **Eventos**: outbox no core; workers projetam; emitir só após commit.
- **Imutabilidade**: sempre criar novos objetos; nunca mutar in-place.
- **Tamanho de arquivo**: 200–400 linhas típico; 800 máximo.

## Design system (`@citybox/ui`)

React + Tailwind v4 + shadcn, organizado por **atomic design**. Stack em `react@19`, `tailwindcss@4`, fonte **Inter Variable**, ícones `lucide-react`, animação `motion`.

### Estrutura (`packages/ui/src/`)

| Camada | Pasta | Conteúdo | Import |
|--------|-------|----------|--------|
| **Atoms** | `components/atoms/` | primitivos shadcn (`Button`, `Card`, `Badge`, `Input`, `Table`, `Dialog`, `Sidebar`, `Tabs`, …) | `@citybox/ui/atoms` |
| **Molecules** | `components/molecules/` | composições pequenas (`FormField`, `SearchInput`, `StatCard`, `DatePicker`, `NavUser`, `PageTabs`, `VerticalBadge`, `Logo`) | `@citybox/ui/molecules` |
| **Organisms** | `components/organisms/` | blocos complexos (`AppSidebar`, `DataTable`, `PageHeader`, `ModalForm`/`ModalFormTabs`/`ModalFormMultistep`, `FilterPopover`, `EntityProfileHeader`, `EmptyState`, `ConfirmDialog`, `AuditTimeline`) | `@citybox/ui/organisms` |
| **Templates** | `components/templates/` | páginas inteiras, criadas sob demanda por app | `@citybox/ui/templates` |

O entrypoint `@citybox/ui` reexporta todas as camadas + `lib/utils` (`cn`), `lib/types` e `lib/tab-styles`. Estilos em `@citybox/ui/styles` (`src/styles/globals.css`).

### Regras

- **Sem componentes locais** de `Button`/`Card`/`Badge`/etc. — sempre importar de `@citybox/ui`.
- **Sem cores hardcoded** — usar tokens CSS (`var(--primary)`, `var(--muted-foreground)`, …) definidos em `globals.css` (escala OKLCH).
- Tema claro/escuro via classe `.dark` (next-themes); não há mais `data-theme="warm"`.
- Novos primitivos shadcn entram em `atoms/`; composições reutilizáveis viram `molecules`/`organisms` com export no `index.ts` da camada.
- Shell de backoffice do lojista (`apps/erp/web`): `DualSidebar`/`DualDashboardLayout` de `@citybox/mui` (não `AppSidebar` de `@citybox/ui`); navegação em `apps/erp/web/src/lib/navigation.ts` — ver `apps/erp/web/AGENTS.md` §4.2. `AppSidebar` (organism) segue disponível em `@citybox/ui` para outros shells (ex.: `apps/admin/web`).

## Referências internas

- ADRs (B-01…C-15): `gestao/docs/adrs/`
- Catálogo de verticais **planejadas** (backlog): `scripts/verticals.config.mjs`. O catálogo
  **cadastrável** é o type `StoreVertical` do `admin-api` — ver seção "Verticais" acima.
