# Citybox Platform — Monorepo

Plataforma municipal de comércio digital (**SaaS B2B** + marketplace B2C). Piloto single-city em **Ilhéus**.

Hierarquia de tenant: **Platform → Organization → Store**. Auth via **Keycloak** (OIDC). Persistência em **PostgreSQL** (schemas por app/vertical). Mensageria **RabbitMQ** (CloudEvents).

Monorepo: **Turborepo + pnpm@9.15.0** — único package manager permitido.

> **Fonte de verdade operacional para agentes e humanos:** [`AGENTS.md`](AGENTS.md) (raiz) + `AGENTS.md` de cada módulo. Este README é o onboarding; detalhes de porta, restrições e histórico ficam nos `AGENTS.md`.

---

## Índice

1. [Requisitos](#requisitos)
2. [AGENTS.md — como usar](#agentsmd--como-usar)
3. [Arquitetura backend](#arquitetura-backend)
4. [Arquitetura frontend](#arquitetura-frontend)
5. [Spec Kit (Spec-Driven Development)](#spec-kit-spec-driven-development)
6. [Rodar local](#rodar-local)
7. [Scripts do `package.json`](#scripts-do-packagejson)
8. [Mapa de serviços e portas](#mapa-de-serviços-e-portas)
9. [Estrutura do monorepo](#estrutura-do-monorepo)
10. [Referências](#referências)

---

## Requisitos

| Ferramenta | Versão |
| ---------- | ------ |
| Node.js | 24+ |
| pnpm | **9.15.0** (via `packageManager` do root) |
| Docker + Compose v2 | para infra local |

```bash
pnpm install
```

---

## AGENTS.md — como usar

Cada escopo do monorepo tem um **`AGENTS.md`** (plural): docs-as-code, lidos **antes** de mudar código naquele módulo.

| Nível | Arquivo | Conteúdo |
| ----- | ------- | -------- |
| Raiz | [`AGENTS.md`](AGENTS.md) | mapa de portas, índice de módulos, schemas Prisma, política de manutenção |
| App / package | ex. [`apps/erp/api/AGENTS.md`](apps/erp/api/AGENTS.md) | stack, envs, restrições, endpoints, decisões locais |
| Infra | [`infra/AGENTS.md`](infra/AGENTS.md) | Docker Compose por serviço, portas, scripts |

**Fluxo obrigatório:**

1. Ler o `AGENTS.md` da **raiz** (orientação).
2. Abrir o `AGENTS.md` do **módulo** em que vai trabalhar.
3. Ao alterar código/schema/env/infra, **atualizar o(s) `AGENTS.md` afetado(s) na mesma mudança**.
4. Mudança estrutural (nova porta, novo app, comando da raiz) → atualizar também a raiz.

Nunca remova seções de um `AGENTS.md` — só atualize ou acrescente. Índice completo: seção 4 do [`AGENTS.md`](AGENTS.md).

---

## Arquitetura backend

APIs NestJS seguem **Clean Architecture** em 3 camadas por módulo de domínio:

```text
modules/<feature>/
  domain/           ← entities, repositórios (interfaces), erros, validadores Zod
  application/      ← use cases (IUseCase), DTOs de aplicação
  infrastructure/   ← PrismaRepository, rotas HTTP (controllers finos), presenters
```

Infra compartilhada da app em `shared/`:

- `shared/core` — `AppError`, `Entity`, `IUseCase`
- `shared/infra` — Prisma, guards JWT Keycloak, filters, tenancy

**Princípios:**

- Controllers finos; regra de negócio no use case / domain.
- Repositório = interface no domain + implementação Prisma na infrastructure.
- Cada app é **dono do seu schema Prisma** (não há pacote `database` central).
- Auth: Keycloak valida identidade; autorização de negócio costuma viver no banco do app (ex.: memberships no ERP).
- Listagens: busca/paginação/ordenação **sempre no backend** (política §8.1 do `AGENTS.md` raiz).

Referência completa (estrutura de pastas, erros, testes, checklist de módulo):

- [`.claude/docs/backend-architecture.md`](.claude/docs/backend-architecture.md)

Apps Nest típicos: `admin-api`, `erp-api`, `clinica-api`, `imoveis-api`, `marketplace-api`, `marketplace-bff`, `beautiful-api`, etc.

---

## Arquitetura frontend

Frontends são **Next.js 16 (App Router) + React 19**, em geral com BFF de auth (PKCE + cookies httpOnly) e proxy server-side para a API.

Há **dois design systems** no monorepo:

| Package | Stack | Uso típico |
| ------- | ----- | ---------- |
| [`@citybox/ui`](packages/ui/) | Tailwind v4 + shadcn (atomic: atoms/molecules/organisms) | admin-web e apps ainda no shadcn |
| [`@citybox/mui`](packages/mui/) | MUI (tema pluggable + atomic) | erp-web (shell Dual), clinica-web, imoveis-web, beautiful-web |

**Padrões comuns:**

- Features por domínio (`features/<domínio>/`), não “pastas por tipo” globais.
- Dados: React Query (quando integrado à API); listagens com debounce 400ms e paginação server-side.
- Sem componentes locais de `Button`/`Card`/etc. quando o DS do app já oferece o equivalente.
- Auth Keycloak: client confidential + PKCE; secret só no servidor (`KEYCLOAK_*_SECRET`).

Detalhes por app: `AGENTS.md` de cada `*/web` (ex. [`apps/erp/web/AGENTS.md`](apps/erp/web/AGENTS.md)).

---

## Spec Kit (Spec-Driven Development)

Usamos [Spec Kit](https://github.com/github/spec-kit) com **um** `.specify/` na raiz e specs **por escopo** (app/sistema):

```text
.specify/                 ← tooling + constitution
specs/
  _platform/001-…/
  erp/001-…/
  clinica/…
  pdv/…
  …
```

Catálogo e regras: [`specs/README.md`](specs/README.md) · [`.specify/scopes.json`](.specify/scopes.json).

### Criar uma feature

**Escopo obrigatório** (`--scope`):

```bash
.specify/scripts/bash/create-new-feature.sh \
  --scope pdv \
  --short-name 'offline-sync' \
  'Sincronização offline do PDV'
# → specs/pdv/001-offline-sync/
```

No Cursor / Claude:

```text
/speckit-specify --scope pdv Sincronização offline do PDV com fila de pedidos
```

### Fluxo típico Spec Kit

| Comando | Função |
| ------- | ------ |
| `/speckit-specify` | Cria/atualiza `spec.md` em `specs/<escopo>/…` |
| `/speckit-plan` | Plano técnico (`plan.md`, data-model, contracts…) |
| `/speckit-tasks` | Quebra em `tasks.md` |
| `/speckit-implement` | Implementa conforme tasks |
| `/speckit-clarify` / `analyze` / `checklist` | Refino e qualidade |

A feature ativa fica em `.specify/feature.json` (`feature_directory`). Comandos seguintes usam esse path. Para trocar de feature:

```bash
export SPECIFY_FEATURE_DIRECTORY=specs/pdv/001-offline-sync
# ou editar .specify/feature.json
```

Escopos: `_platform`, `erp`, `clinica`, `imoveis`, `beautiful`, `marketplace`, `pdv`, `packages` (aliases em `scopes.json`, ex. `platform` → `_platform`).

---

## Rodar local

### 1. Infra Docker

Rede + serviços essenciais (Postgres, Redis, RabbitMQ, Typesense, MinIO, Keycloak, Nginx):

```bash
pnpm infra:up          # essenciais
pnpm infra:status
# ou serviço a serviço:
pnpm infra:up:postgres
pnpm infra:up:rabbitmq
# tudo (inclui Metabase, Unleash, réplica…):
pnpm infra:up:full
pnpm infra:down
```

Postgres local costuma escutar em `127.0.0.1:15433`. Detalhes: [`infra/AGENTS.md`](infra/AGENTS.md).

> Keycloak / MinIO podem apontar para a VPS de homolog em vez do Docker local — configure nos `.env` de cada app.

### 2. Migrations (primeira vez / app novo)

Exemplos:

```bash
pnpm db:migrate:admin:deploy   # schema platform (admin-api)
pnpm --filter @citybox/erp-api db:migrate:deploy
# demais apps: ver scripts no package.json / AGENTS.md do módulo
```

### 3. Subir apps — `pnpm run dev:pick`

Menu interativo (ou args) para escolher quais pacotes rodar em hot reload:

```bash
pnpm run dev:pick                 # menu (fzf se disponível)
pnpm run dev:pick --list          # lista alvos
pnpm run dev:pick erp-api erp-web # direto por nome/atalho
pnpm run dev:pick admin-api admin-web erp-api erp-web
```

### 4. Atalhos por conjunto

| Script | O que sobe |
| ------ | ---------- |
| `pnpm dev` | admin-api + admin-web + erp-web + erp-api + food-api + clinica-api |
| `pnpm dev:comercio` | admin-api + erp-api + erp-web |
| `pnpm dev:clinica` | admin-api + clinica-api + clinica-web |
| `pnpm dev:imoveis` | imoveis-api + imoveis-web |
| `pnpm dev:beautiful` | beautiful-api + beautiful-web |
| `pnpm dev:food` | admin-api + erp-web + food-api |
| `pnpm dev:varejo` | admin-api + erp-web + varejo-api |

Pacote único:

```bash
pnpm --filter @citybox/erp-api dev
# ou
turbo run dev --filter=@citybox/erp-web
```

### Hosts locais (nginx :8088)

Se usar o nginx da infra:

```text
127.0.0.1 api.local.citybox.com app.local.citybox.com admin.local.citybox.com ws.local.citybox.com city.local.citybox.com
```

---

## Scripts do `package.json`

### Dev

| Script | Descrição |
| ------ | --------- |
| `dev` | Conjunto padrão (admin + erp + food + clinica-api) |
| `dev:pick` | Seleção interativa / por args dos alvos com script `dev` |
| `dev:comercio` / `dev:clinica` / `dev:imoveis` / `dev:beautiful` / `dev:food` / `dev:varejo` | Conjuntos pré-definidos |
| `dev:local` | Orquestração legado (`scripts/dev-local.sh`) |
| `dev:tunnel*` | Túnel SSH para banco remoto |

### Qualidade

| Script | Descrição |
| ------ | --------- |
| `build` | `turbo run build` |
| `lint` | lint em todo o workspace (`--continue`) |
| `typecheck` | typecheck workspace |
| `test` | testes unitários/integração |
| `test:playwright` | E2E (`@citybox/e2e-ui`) |

### Infra / Keycloak / Rabbit

| Script | Descrição |
| ------ | --------- |
| `infra:up` / `infra:up:full` / `infra:down` / `infra:status` | Orquestra Docker |
| `infra:up:postgres` (e redis, rabbitmq, keycloak, typesense, minio) | Serviço isolado |
| `keycloak-theme:build` | Build do tema Keycloakify |
| `keycloak:sync` | Sync realm/clients/roles |
| `rabbit:sync-bindings` | Bindings das filas |

### Banco / deploy / harness

| Script | Descrição |
| ------ | --------- |
| `db:migrate:admin:*` / `db:generate:admin` | Migrations admin-api |
| `db:migrate:food:deploy` | Migrations food-api |
| `deploy:prod` / `deploy:prod:clinic` | Deploy produção Aplopes |
| `harness:sync-skills` | Symlinks de skills Cursor → Claude |
| `wiki` | Serve wikis em `:8787` |
| `docs:*` / `generate:*` / `mock:server*` | OpenAPI / clientes gerados / Prism |

---

## Mapa de serviços e portas

| Serviço | Pacote | Porta | Pasta |
| ------- | ------ | ----- | ----- |
| marketplace-api | `@citybox/marketplace-api` | 3101 | `apps/marketplace/api` |
| marketplace-bff | `@citybox/marketplace-bff` | 3102 | `apps/marketplace/bff` |
| admin-api | `@citybox/admin-api` | 3103 | `apps/admin/api` |
| realtime-gateway | `@citybox/realtime-gateway` | 3104 | `apps/realtime-gateway` |
| workers | `@citybox/workers` | 3105 | `apps/workers` |
| payment-api | `@citybox/payment-api` | 3106 | `services/payment-api` |
| erp-web | `@citybox/erp-web` | 3107 | `apps/erp/web` |
| admin-web | `@citybox/admin-web` | 3108 | `apps/admin/web` |
| pdv | `@citybox/pdv` | 3109 | `apps/pdv/frontend` |
| imoveis-web | `@citybox/imoveis-web` | 3111 | `apps/imoveis/web` |
| imoveis-api | `@citybox/imoveis-api` | 3112 | `apps/imoveis/api` |
| clinica-web | `@citybox/clinica-web` | 3113 | `apps/verticals/clinica/web` |
| erp-api | `@citybox/erp-api` | 3114 | `apps/erp/api` |
| beautiful-web | `@citybox/beautiful-web` | 3115 | `apps/verticals/beautiful/web` |
| food-api | `@citybox/food-api` | 3171 | `apps/verticals/food/api` |
| clinica-api | `@citybox/clinica-api` | 3172 | `apps/verticals/clinica/api` |
| beautiful-api | `@citybox/beautiful-api` | 3173 | `apps/verticals/beautiful/api` |
| nginx | — | 8088 | `infra/nginx` |

Tabela canônica: seção 3 do [`AGENTS.md`](AGENTS.md).

---

## Estrutura do monorepo

```text
citybox/
├── AGENTS.md              ← índice + política docs-as-code
├── apps/
│   ├── admin/             ← operação da plataforma (api + web)
│   ├── erp/               ← backoffice comércio (api + web)
│   ├── marketplace/       ← api + bff (+ web/iOS/Android)
│   ├── imoveis/
│   ├── pdv/
│   ├── realtime-gateway/
│   ├── workers/
│   └── verticals/         ← clinica, beautiful, food, varejo…
├── packages/              ← ui, mui, messaging, nest-common, tsconfig
├── services/              ← payment-api (legado / a refazer)
├── infra/                 ← Docker Compose por serviço
├── specs/                 ← Spec Kit por escopo
├── .specify/              ← tooling Spec Kit
├── .claude/ · .cursor/    ← harness ECC (agents, skills, commands)
└── package.json           ← scripts do monorepo
```

**Catálogo admin (verticais cadastráveis):** `Comércio` (`erp`) e `Clínica`. Imóveis/Beautiful existem em código; entrada no catálogo admin depende de tenancy/eventos (ver `AGENTS.md`).

---

## Referências

| Doc | Conteúdo |
| --- | -------- |
| [`AGENTS.md`](AGENTS.md) | Fonte de verdade do monorepo |
| [`specs/README.md`](specs/README.md) | Spec Kit por escopo |
| [`.claude/docs/backend-architecture.md`](.claude/docs/backend-architecture.md) | Clean Architecture NestJS |
| [`CLAUDE.md`](CLAUDE.md) | Harness ECC (`/feature`, `/bugfix`, gates) |
| [`infra/AGENTS.md`](infra/AGENTS.md) | Infra Docker |
| [`packages/ui/AGENTS.md`](packages/ui/AGENTS.md) / [`packages/mui/AGENTS.md`](packages/mui/AGENTS.md) | Design systems |
| [Spec Kit](https://github.com/github/spec-kit) | Spec-Driven Development |
| `gestao/docs/adrs/` | ADRs (B-01…C-15), se presente no clone |
