# Workspace memory (AGENTS.md)

## FebraHub — ACTUAL stack & deployment (CORRECTED — read first)

CRITICAL: the real/deployed FebraHub is a **pnpm monorepo**, NOT the old Vite+Supabase app.
- **`apps/api/`** — NestJS + **Prisma** (its own Postgres `febrahub_postgres`). Modules in `apps/api/src/modules/` (auth, compras, processos, loja-cadastros, pedagogico, executivo, permissoes, dados, health, brain, crm, integracoes…). Prisma schema: `apps/api/prisma/schema.prisma`; migrations: `apps/api/prisma/migrations/0000000000NN_*`.
- **`apps/web/`** — **Next.js** (App Router). Routes `apps/web/src/app/(app)/<hub>/`, components `apps/web/src/components/`, API clients `apps/web/src/services/api/`, types `apps/web/src/types/`, menu/hubs `apps/web/src/lib/{menu.ts,hubs.ts}`. Uses Tailwind + per-feature CSS files in `apps/web/src/app/*.css`.
- **`web/`** — LEGACY Vite+React+Supabase app (being phased out). Do NOT build new features here.
- **`db/`** — numbered SQL migrations (01..90) for the analytics `vw_*` views (comercial/financeiro/loja/marketing/pedagogico). Still used. Access model: RLS on facts/dims (zero policies), `vw_*` views gated by `pode_ver('setor')`; front granted SELECT only on views.
- Storage: **MinIO**. Auth: sessions (`Sessao` model), permissions via `PerfilAcesso`/`PerfilSetor` + `permissoes/catalogo.ts`.

## Deployment (VPS)
- Host: `31.97.166.66`, root pw `1952aplA++++` (SSH via sshpass; box is heavily loaded — use ConnectTimeout 60, ServerAliveInterval 15, retries; SSH sometimes times out).
- Repo on box: `/root/FebraHub`, remote `github.com/aplopes-dev/FebraHub.git`, branch **`homolog`**. `gh` CLI logged in as `Mr-nascimento` → `gh auth setup-git` enables push.
- Runs via `docker-compose.prod.yml` (containers `febrahub_web`:3260, `febrahub_api`:3261, `febrahub_postgres`, `febrahub_minio`, `febrahub_brain`). Nginx TLS → prod `febracis.aplopes.com`, hom `febracis-hom.aplopes.com` (`/api/health` shows status + frozen views).
- Deploy flow: git pull on box + `docker compose build`.
- NEVER commit: `supabase/*.dump` (25MB each), `CREDENCIAIS_SEED.txt`, `docker-compose.prod.yml.bak.*` — all now in `.gitignore`.

## In-progress work already in repo (as of commit 8857352, DO NOT clobber)
- **Compras MVP**: full flow solicitação→cotação→pedido→recebimento→movimento de estoque. API `modules/compras`, Prisma models `Compra*`/`UnidadeCompra`/`CompraMovimentoEstoque`, migrations 24–29, web `(app)/compras/*` (11 pages) + `components/compras/*` + `services/api/compras.ts` + `types/compras.ts`.
- **HubEstoque** (`components/hubs/HubEstoque.tsx`) exists — estoque tied to compras movements.
- **Central de Processos** module (api + web).

## Task
Reimplement Citybox ERP's PDV, Compras, Estoque, Financeiro in FebraHub. **Compras + basic Estoque already exist** → focus on **PDV** and **Financeiro (ERP: contas a pagar/receber, DRE)**, and extend Estoque if needed. Build in `apps/api` (Nest module + Prisma) + `apps/web` (Next.js page/components), mirroring the `compras` module pattern. **PDV must be an internal integrated service (no Omie)** — sale writes go through new Nest endpoints to Prisma, decrementing stock via the existing estoque movements.

Citybox reference source cloned at `_citybox_src/` (gitignored, 149MB) — schema `_citybox_src/apps/erp/api/prisma/schema.prisma` (values in `_cents`).

My earlier migrations 91–93 + Vite hubs were built against the WRONG (legacy) app and have been discarded.

## LOJA FEBRACIS — decisões do PRD (em implementação)
- **Estoque**: dividido em dois locais físicos por operação — **LOJA** e **DEPÓSITO**. Saldo operacional próprio (separado do ETL Omie de `fato_loja_estoque`, que pode sobrescrever).
- **Gateway de pagamento**: **ASAAS** (PIX + cartão). Arquitetura `PaymentProvider` com `AsaasProvider`; preparado para outros providers.
- **PDV existente** (`modules/pdv`, `PdvService`) já funcional: venda→baixa `fato_loja_estoque`→ledger `compra_movimentos_estoque` (tipo saida)→recebível `financeiro_lancamentos`. Estava ÓRFÃO do menu (`apps/web/src/lib/menu.ts`) — Sprint 1.1 adiciona.
- **Financeiro ERP** (`modules/financeiro`) completo: contas a pagar/receber + DRE.
- **WhatsApp** (Baileys): `BaileysManager.resolverJid(tel)`+`enviarTexto(jid,txt)` permitem envio proativo; falta método `enviarProativo` sem UsuarioLogado.
- **SSE**: padrão Subject RxJS + heartbeat 25s em modules/agentes e whatsapp — reusar p/ fila/TV da Loja.
- Migrations vão de 30 (pdv_financeiro). Novas da Loja começam em 31.
- Permissões: catálogo em `apps/api/src/modules/permissoes/catalogo.ts` (pdv.ver/operar/gerenciar; financeiro.erp.ver/gerenciar já existem).

## Dev Machine (Lenovo IdeaPad — local network)

A local development machine accessible from inside the VPS Docker network (or same LAN):

- **Host:** `172.17.0.1`
- **Port:** `2222`
- **User:** `root`
- **Password:** `root`
- **Hostname:** `febracis-IdeaPad-1-15IAU7`

**Connect:**
```bash
sshpass -p 'root' ssh -o ConnectTimeout=15 -o StrictHostKeyChecking=no -p 2222 root@172.26.0.1
```

**Installed runtimes:**
- Node.js v22.22.1
- npm 9.2.0
- pnpm 11.23.0
- Docker 29.1.3
- **tsc** (TypeScript) v7.0.2 ✅
- **psql** (PostgreSQL client) v18.6 ✅

**Purpose:** Development tasks — `tsc` type-checks, `pnpm build`, Prisma migrations/validation, npm installs, Postgres queries, etc. Use this machine for heavy/slow dev tasks instead of the production VPS. Connect via the command above from any terminal in this workspace.
# Workspace memory (AGENTS.md)

## FebraHub — ACTUAL stack & deployment (CORRECTED — read first)

CRITICAL: the real/deployed FebraHub is a **pnpm monorepo**, NOT the old Vite+Supabase app.
- **`apps/api/`** — NestJS + **Prisma** (its own Postgres `febrahub_postgres`). Modules in `apps/api/src/modules/` (auth, compras, processos, loja-cadastros, pedagogico, executivo, permissoes, dados, health, brain, crm, integracoes…). Prisma schema: `apps/api/prisma/schema.prisma`; migrations: `apps/api/prisma/migrations/0000000000NN_*`.
- **`apps/web/`** — **Next.js** (App Router). Routes `apps/web/src/app/(app)/<hub>/`, components `apps/web/src/components/`, API clients `apps/web/src/services/api/`, types `apps/web/src/types/`, menu/hubs `apps/web/src/lib/{menu.ts,hubs.ts}`. Uses Tailwind + per-feature CSS files in `apps/web/src/app/*.css`.
- **`web/`** — LEGACY Vite+React+Supabase app (being phased out). Do NOT build new features here.
- **`db/`** — numbered SQL migrations (01..90) for the analytics `vw_*` views (comercial/financeiro/loja/marketing/pedagogico). Still used. Access model: RLS on facts/dims (zero policies), `vw_*` views gated by `pode_ver('setor')`; front granted SELECT only on views.
- Storage: **MinIO**. Auth: sessions (`Sessao` model), permissions via `PerfilAcesso`/`PerfilSetor` + `permissoes/catalogo.ts`.

## Deployment (VPS)
- Host: `31.97.166.66`, root pw `1952aplA++++` (SSH via sshpass; box is heavily loaded — use ConnectTimeout 60, ServerAliveInterval 15, retries; SSH sometimes times out).
- Repo on box: `/root/FebraHub`, remote `github.com/aplopes-dev/FebraHub.git`, branch **`homolog`**. `gh` CLI logged in as `Mr-nascimento` → `gh auth setup-git` enables push.
- Runs via `docker-compose.prod.yml` (containers `febrahub_web`:3260, `febrahub_api`:3261, `febrahub_postgres`, `febrahub_minio`, `febrahub_brain`). Nginx TLS → prod `febracis.aplopes.com`, hom `febracis-hom.aplopes.com` (`/api/health` shows status + frozen views).
- Deploy flow: git pull on box + `docker compose build`.
- NEVER commit: `supabase/*.dump` (25MB each), `CREDENCIAIS_SEED.txt`, `docker-compose.prod.yml.bak.*` — all now in `.gitignore`.

## In-progress work already in repo (as of commit 8857352, DO NOT clobber)
- **Compras MVP**: full flow solicitação→cotação→pedido→recebimento→movimento de estoque. API `modules/compras`, Prisma models `Compra*`/`UnidadeCompra`/`CompraMovimentoEstoque`, migrations 24–29, web `(app)/compras/*` (11 pages) + `components/compras/*` + `services/api/compras.ts` + `types/compras.ts`.
- **HubEstoque** (`components/hubs/HubEstoque.tsx`) exists — estoque tied to compras movements.
- **Central de Processos** module (api + web).

## Task
Reimplement Citybox ERP's PDV, Compras, Estoque, Financeiro in FebraHub. **Compras + basic Estoque already exist** → focus on **PDV** and **Financeiro (ERP: contas a pagar/receber, DRE)**, and extend Estoque if needed. Build in `apps/api` (Nest module + Prisma) + `apps/web` (Next.js page/components), mirroring the `compras` module pattern. **PDV must be an internal integrated service (no Omie)** — sale writes go through new Nest endpoints to Prisma, decrementing stock via the existing estoque movements.

Citybox reference source cloned at `_citybox_src/` (gitignored, 149MB) — schema `_citybox_src/apps/erp/api/prisma/schema.prisma` (values in `_cents`).

My earlier migrations 91–93 + Vite hubs were built against the WRONG (legacy) app and have been discarded.

## LOJA FEBRACIS — decisões do PRD (em implementação)
- **Estoque**: dividido em dois locais físicos por operação — **LOJA** e **DEPÓSITO**. Saldo operacional próprio (separado do ETL Omie de `fato_loja_estoque`, que pode sobrescrever).
- **Gateway de pagamento**: **ASAAS** (PIX + cartão). Arquitetura `PaymentProvider` com `AsaasProvider`; preparado para outros providers.
- **PDV existente** (`modules/pdv`, `PdvService`) já funcional: venda→baixa `fato_loja_estoque`→ledger `compra_movimentos_estoque` (tipo saida)→recebível `financeiro_lancamentos`. Estava ÓRFÃO do menu (`apps/web/src/lib/menu.ts`) — Sprint 1.1 adiciona.
- **Financeiro ERP** (`modules/financeiro`) completo: contas a pagar/receber + DRE.
- **WhatsApp** (Baileys): `BaileysManager.resolverJid(tel)`+`enviarTexto(jid,txt)` permitem envio proativo; falta método `enviarProativo` sem UsuarioLogado.
- **SSE**: padrão Subject RxJS + heartbeat 25s em modules/agentes e whatsapp — reusar p/ fila/TV da Loja.
- Migrations vão de 30 (pdv_financeiro). Novas da Loja começam em 31.
- Permissões: catálogo em `apps/api/src/modules/permissoes/catalogo.ts` (pdv.ver/operar/gerenciar; financeiro.erp.ver/gerenciar já existem).

## Dev Machine (Lenovo IdeaPad — local network)

A local development machine accessible from inside the VPS Docker network (or same LAN):

- **Host:** `172.17.0.1`
- **Port:** `2222`
- **User:** `root`
- **Password:** `root`
- **Hostname:** `febracis-IdeaPad-1-15IAU7`

**Connect:**
```bash
sshpass -p 'root' ssh -o ConnectTimeout=15 -o StrictHostKeyChecking=no -p 2222 root@172.26.0.1
```

**Installed runtimes:**
- Node.js v22.22.1
- npm 9.2.0
- pnpm 11.23.0
- Docker 29.1.3
- **tsc** (TypeScript) v7.0.2 ✅
- **psql** (PostgreSQL client) v18.6 ✅

**Purpose:** Development tasks — `tsc` type-checks, `pnpm build`, Prisma migrations/validation, npm installs, Postgres queries, etc. Use this machine for heavy/slow dev tasks instead of the production VPS. Connect via the command above from any terminal in this workspace.
# Workspace memory (AGENTS.md)

## FebraHub — ACTUAL stack & deployment (CORRECTED — read first)

CRITICAL: the real/deployed FebraHub is a **pnpm monorepo**, NOT the old Vite+Supabase app.
- **`apps/api/`** — NestJS + **Prisma** (its own Postgres `febrahub_postgres`). Modules in `apps/api/src/modules/` (auth, compras, processos, loja-cadastros, pedagogico, executivo, permissoes, dados, health, brain, crm, integracoes…). Prisma schema: `apps/api/prisma/schema.prisma`; migrations: `apps/api/prisma/migrations/0000000000NN_*`.
- **`apps/web/`** — **Next.js** (App Router). Routes `apps/web/src/app/(app)/<hub>/`, components `apps/web/src/components/`, API clients `apps/web/src/services/api/`, types `apps/web/src/types/`, menu/hubs `apps/web/src/lib/{menu.ts,hubs.ts}`. Uses Tailwind + per-feature CSS files in `apps/web/src/app/*.css`.
- **`web/`** — LEGACY Vite+React+Supabase app (being phased out). Do NOT build new features here.
- **`db/`** — numbered SQL migrations (01..90) for the analytics `vw_*` views (comercial/financeiro/loja/marketing/pedagogico). Still used. Access model: RLS on facts/dims (zero policies), `vw_*` views gated by `pode_ver('setor')`; front granted SELECT only on views.
- Storage: **MinIO**. Auth: sessions (`Sessao` model), permissions via `PerfilAcesso`/`PerfilSetor` + `permissoes/catalogo.ts`.

## Deployment (VPS)
- Host: `31.97.166.66`, root pw `1952aplA++++` (SSH via sshpass; box is heavily loaded — use ConnectTimeout 60, ServerAliveInterval 15, retries; SSH sometimes times out).
- Repo on box: `/root/FebraHub`, remote `github.com/aplopes-dev/FebraHub.git`, branch **`homolog`**. `gh` CLI logged in as `Mr-nascimento` → `gh auth setup-git` enables push.
- Runs via `docker-compose.prod.yml` (containers `febrahub_web`:3260, `febrahub_api`:3261, `febrahub_postgres`, `febrahub_minio`, `febrahub_brain`). Nginx TLS → prod `febracis.aplopes.com`, hom `febracis-hom.aplopes.com` (`/api/health` shows status + frozen views).
- Deploy flow: git pull on box + `docker compose build`.
- NEVER commit: `supabase/*.dump` (25MB each), `CREDENCIAIS_SEED.txt`, `docker-compose.prod.yml.bak.*` — all now in `.gitignore`.

## In-progress work already in repo (as of commit 8857352, DO NOT clobber)
- **Compras MVP**: full flow solicitação→cotação→pedido→recebimento→movimento de estoque. API `modules/compras`, Prisma models `Compra*`/`UnidadeCompra`/`CompraMovimentoEstoque`, migrations 24–29, web `(app)/compras/*` (11 pages) + `components/compras/*` + `services/api/compras.ts` + `types/compras.ts`.
- **HubEstoque** (`components/hubs/HubEstoque.tsx`) exists — estoque tied to compras movements.
- **Central de Processos** module (api + web).

## Task
Reimplement Citybox ERP's PDV, Compras, Estoque, Financeiro in FebraHub. **Compras + basic Estoque already exist** → focus on **PDV** and **Financeiro (ERP: contas a pagar/receber, DRE)**, and extend Estoque if needed. Build in `apps/api` (Nest module + Prisma) + `apps/web` (Next.js page/components), mirroring the `compras` module pattern. **PDV must be an internal integrated service (no Omie)** — sale writes go through new Nest endpoints to Prisma, decrementing stock via the existing estoque movements.

Citybox reference source cloned at `_citybox_src/` (gitignored, 149MB) — schema `_citybox_src/apps/erp/api/prisma/schema.prisma` (values in `_cents`).

My earlier migrations 91–93 + Vite hubs were built against the WRONG (legacy) app and have been discarded.

## LOJA FEBRACIS — decisões do PRD (em implementação)
- **Estoque**: dividido em dois locais físicos por operação — **LOJA** e **DEPÓSITO**. Saldo operacional próprio (separado do ETL Omie de `fato_loja_estoque`, que pode sobrescrever).
- **Gateway de pagamento**: **ASAAS** (PIX + cartão). Arquitetura `PaymentProvider` com `AsaasProvider`; preparado para outros providers.
- **PDV existente** (`modules/pdv`, `PdvService`) já funcional: venda→baixa `fato_loja_estoque`→ledger `compra_movimentos_estoque` (tipo saida)→recebível `financeiro_lancamentos`. Estava ÓRFÃO do menu (`apps/web/src/lib/menu.ts`) — Sprint 1.1 adiciona.
- **Financeiro ERP** (`modules/financeiro`) completo: contas a pagar/receber + DRE.
- **WhatsApp** (Baileys): `BaileysManager.resolverJid(tel)`+`enviarTexto(jid,txt)` permitem envio proativo; falta método `enviarProativo` sem UsuarioLogado.
- **SSE**: padrão Subject RxJS + heartbeat 25s em modules/agentes e whatsapp — reusar p/ fila/TV da Loja.
- Migrations vão de 30 (pdv_financeiro). Novas da Loja começam em 31.
- Permissões: catálogo em `apps/api/src/modules/permissoes/catalogo.ts` (pdv.ver/operar/gerenciar; financeiro.erp.ver/gerenciar já existem).

## Dev Machine (Lenovo IdeaPad — local network)

A local development machine accessible from inside the VPS Docker network (or same LAN):

- **Host:** `172.17.0.1`
- **Port:** `2222`
- **User:** `root`
- **Password:** `root`
- **Hostname:** `febracis-IdeaPad-1-15IAU7`

**Connect:**
```bash
sshpass -p 'root' ssh -o ConnectTimeout=15 -o StrictHostKeyChecking=no -p 2222 root@172.17.0.1
```
> NOTE: reach it via **`172.17.0.1`** (the `docker0` bridge gateway on the VPS). The old `172.26.0.1` route intermittently refuses port 2222 — use `172.17.0.1`.

**Installed runtimes:**
- Node.js v22.22.1
- npm 9.2.0
- pnpm 11.23.0
- Docker 29.1.3
- **tsc** (TypeScript) v7.0.2 ✅
- **psql** (PostgreSQL client) v18.6 ✅

**Purpose:** Development tasks — `tsc` type-checks, `pnpm build`, Prisma migrations/validation, npm installs, Postgres queries, etc. Use this machine for heavy/slow dev tasks instead of the production VPS. Connect via the command above from any terminal in this workspace.
# Workspace memory (AGENTS.md)

## FebraHub — ACTUAL stack & deployment (CORRECTED — read first)

CRITICAL: the real/deployed FebraHub is a **pnpm monorepo**, NOT the old Vite+Supabase app.
- **`apps/api/`** — NestJS + **Prisma** (its own Postgres `febrahub_postgres`). Modules in `apps/api/src/modules/` (auth, compras, processos, loja-cadastros, pedagogico, executivo, permissoes, dados, health, brain, crm, integracoes…). Prisma schema: `apps/api/prisma/schema.prisma`; migrations: `apps/api/prisma/migrations/0000000000NN_*`.
- **`apps/web/`** — **Next.js** (App Router). Routes `apps/web/src/app/(app)/<hub>/`, components `apps/web/src/components/`, API clients `apps/web/src/services/api/`, types `apps/web/src/types/`, menu/hubs `apps/web/src/lib/{menu.ts,hubs.ts}`. Uses Tailwind + per-feature CSS files in `apps/web/src/app/*.css`.
- **`web/`** — LEGACY Vite+React+Supabase app (being phased out). Do NOT build new features here.
- **`db/`** — numbered SQL migrations (01..90) for the analytics `vw_*` views (comercial/financeiro/loja/marketing/pedagogico). Still used. Access model: RLS on facts/dims (zero policies), `vw_*` views gated by `pode_ver('setor')`; front granted SELECT only on views.
- Storage: **MinIO**. Auth: sessions (`Sessao` model), permissions via `PerfilAcesso`/`PerfilSetor` + `permissoes/catalogo.ts`.

## Deployment (VPS)
- Host: `31.97.166.66`, root pw `1952aplA++++` (SSH via sshpass; box is heavily loaded — use ConnectTimeout 60, ServerAliveInterval 15, retries; SSH sometimes times out).
- Repo on box: `/root/FebraHub`, remote `github.com/aplopes-dev/FebraHub.git`, branch **`homolog`**. `gh` CLI logged in as `Mr-nascimento` → `gh auth setup-git` enables push.
- Runs via `docker-compose.prod.yml` (containers `febrahub_web`:3260, `febrahub_api`:3261, `febrahub_postgres`, `febrahub_minio`, `febrahub_brain`). Nginx TLS → prod `febracis.aplopes.com`, hom `febracis-hom.aplopes.com` (`/api/health` shows status + frozen views).
- Deploy flow: git pull on box + `docker compose build`.
- NEVER commit: `supabase/*.dump` (25MB each), `CREDENCIAIS_SEED.txt`, `docker-compose.prod.yml.bak.*` — all now in `.gitignore`.

## In-progress work already in repo (as of commit 8857352, DO NOT clobber)
- **Compras MVP**: full flow solicitação→cotação→pedido→recebimento→movimento de estoque. API `modules/compras`, Prisma models `Compra*`/`UnidadeCompra`/`CompraMovimentoEstoque`, migrations 24–29, web `(app)/compras/*` (11 pages) + `components/compras/*` + `services/api/compras.ts` + `types/compras.ts`.
- **HubEstoque** (`components/hubs/HubEstoque.tsx`) exists — estoque tied to compras movements.
- **Central de Processos** module (api + web).

## Task
Reimplement Citybox ERP's PDV, Compras, Estoque, Financeiro in FebraHub. **Compras + basic Estoque already exist** → focus on **PDV** and **Financeiro (ERP: contas a pagar/receber, DRE)**, and extend Estoque if needed. Build in `apps/api` (Nest module + Prisma) + `apps/web` (Next.js page/components), mirroring the `compras` module pattern. **PDV must be an internal integrated service (no Omie)** — sale writes go through new Nest endpoints to Prisma, decrementing stock via the existing estoque movements.

Citybox reference source cloned at `_citybox_src/` (gitignored, 149MB) — schema `_citybox_src/apps/erp/api/prisma/schema.prisma` (values in `_cents`).

My earlier migrations 91–93 + Vite hubs were built against the WRONG (legacy) app and have been discarded.

## LOJA FEBRACIS — decisões do PRD (em implementação)
- **Estoque**: dividido em dois locais físicos por operação — **LOJA** e **DEPÓSITO**. Saldo operacional próprio (separado do ETL Omie de `fato_loja_estoque`, que pode sobrescrever).
- **Gateway de pagamento**: **ASAAS** (PIX + cartão). Arquitetura `PaymentProvider` com `AsaasProvider`; preparado para outros providers.
- **PDV existente** (`modules/pdv`, `PdvService`) já funcional: venda→baixa `fato_loja_estoque`→ledger `compra_movimentos_estoque` (tipo saida)→recebível `financeiro_lancamentos`. Estava ÓRFÃO do menu (`apps/web/src/lib/menu.ts`) — Sprint 1.1 adiciona.
- **Financeiro ERP** (`modules/financeiro`) completo: contas a pagar/receber + DRE.
- **WhatsApp** (Baileys): `BaileysManager.resolverJid(tel)`+`enviarTexto(jid,txt)` permitem envio proativo; falta método `enviarProativo` sem UsuarioLogado.
- **SSE**: padrão Subject RxJS + heartbeat 25s em modules/agentes e whatsapp — reusar p/ fila/TV da Loja.
- Migrations vão de 30 (pdv_financeiro). Novas da Loja começam em 31.
- Permissões: catálogo em `apps/api/src/modules/permissoes/catalogo.ts` (pdv.ver/operar/gerenciar; financeiro.erp.ver/gerenciar já existem).

## Dev Machine (Lenovo IdeaPad — local network)

A local development machine accessible from inside the VPS Docker network (or same LAN):

- **Host:** `172.17.0.1`
- **Port:** `2222`
- **User:** `root`
- **Password:** `root`
- **Hostname:** `febracis-IdeaPad-1-15IAU7`

**Connect:**
```bash
sshpass -p 'root' ssh -o ConnectTimeout=15 -o StrictHostKeyChecking=no -p 2222 root@172.17.0.1
```
> NOTE: reach it via **`172.17.0.1`** (the `docker0` bridge gateway on the VPS). The old `172.26.0.1` route intermittently refuses port 2222 — use `172.17.0.1`.

**Installed runtimes:**
- Node.js v22.22.1
- npm 9.2.0
- pnpm 11.23.0
- Docker 29.1.3
- **tsc** (TypeScript) v7.0.2 ✅
- **psql** (PostgreSQL client) v18.6 ✅

**Purpose:** Development tasks — `tsc` type-checks, `pnpm build`, Prisma migrations/validation, npm installs, Postgres queries, etc. Use this machine for heavy/slow dev tasks instead of the production VPS. Connect via the command above from any terminal in this workspace.

## Dev Machine gotcha (IdeaPad) — install deps with pnpm at repo ROOT
- Reach the IdeaPad via **`172.17.0.1:2222`** (root/root). `172.26.0.1` route intermittently refuses 2222.
- To run checks there, sync the repo to the working-tree state, then install with **`pnpm install --no-frozen-lockfile`** at the monorepo ROOT (`/root/FebraHub`). Do NOT run `npm install` inside `apps/api` — it pulls fastify 5.12.x (instead of pinned 5.10.0) and produces bogus `FastifyInstance`/`FastifyPluginCallback` type errors in `src/main.ts`. If you see those errors, it's a wrong-install artifact, not real.
- `--frozen-lockfile` fails on IdeaPad (ERR_PNPM_LOCKFILE_CONFIG_MISMATCH re: patchedDependencies/baileys) → use `--no-frozen-lockfile`.
- After install: `cd apps/api && npx --no-install prisma generate` then `npx --no-install tsc --noEmit -p tsconfig.json`; web: `cd apps/web && npx --no-install tsc --noEmit`.
- Verified clean (0 errors, API+web) against migration 36 (loja_pedidos) WIP on 2026-08-24.

## LOJA · Módulo loja-pedidos COMPLETO (Cardápio Digital + Fila + PDV-integrado)
Concluído sobre a migration 36 (loja_pedidos) que o Vitor deixou como schema+SQL sem módulo. Builds verdes na IdeaPad (nest build + next build, exit 0).
- **API `apps/api/src/modules/loja-pedidos/`**: eventos (SSE Subject+heartbeat 25s), dto, service, controller, module. Fluxo: checkout (reserva estoque em loja_estoque_saldos.reservado + ledger tipo 'reserva') → iniciarPagamento (PIX placeholder p/ ASAAS) → confirmarPagamento (baixa reservado→físico, saída no ledger, recebível em financeiro_lancamentos origem=pdv, entra NA_FILA ou PRONTO) → proximo/preparar/pronto/retirar → cancelar (libera reserva OU devolve físico + estorna lançamento). Numeração pública por operação via pg_advisory_xact_lock + loja_numeracao_pedido (começa 1001).
- **Rotas públicas** (`@Publica()`, bypassa @ExigePermissao da classe): `GET publico/cardapio/:slug`, `POST publico/checkout`, `POST publico/pedidos/:id/pagamento[/confirmar]`, `GET publico/pedidos/:id/acompanhar`, `GET publico/painel`, `SSE publico/eventos`. Backend recalcula preço/estoque/total (nunca confia no front).
- **WhatsApp**: `WhatsappService.enviarProativo(tel, texto)` (best-effort, nunca lança; espelha bolha na conversa; respeita manager.conectado). WhatsappModule agora `exports: [WhatsappService]`. Régua: confirmado/proximo/preparacao/pronto.
- **Permissões** novas em catalogo.ts: `loja.pedidos.ver|operar|gerenciar`.
- **Web**: types/loja-pedidos.ts, services/api/loja-pedidos.ts, componentes loja/{FilaLoja,CardapioPublico,AcompanharPedido,PainelTv,OperacoesLoja}.tsx, app/fila.css. Páginas: `(app)/loja/fila`, `(app)/loja/operacoes` (admin), públicas `cardapio/[slug]`, `pedido/[id]`, `painel/[slug]` (TV só número+status). Menu: itens loja-fila e loja-operacoes.
- Realtime via polling react-query (SSE disponível no back p/ evolução). NÃO commitei — deixei p/ revisão junto ao WIP do Vitor.

## LOJA loja-pedidos — round 2 (crons + dashboard + SSE no front) CONCLUÍDO
Builds verdes na IdeaPad (nest build + next build, exit 0). Ainda NÃO commitado.
- **Crons** (`loja-pedidos.cron.ts`, @Interval, ScheduleModule já ativo): `expirarReservas()` a cada 2min (libera reservado + cancela pedidos AGUARDANDO_PAGAMENTO > LOJA_RESERVA_EXPIRA_MIN, padrão 30) e `lembrarProntos()` a cada 3min (WhatsApp p/ PRONTO não retirado > LOJA_LEMBRETE_PRONTO_MIN, padrão 5; controle 1x via historico paraStatus='LEMBRETE_PRONTO'). Envs configuráveis.
- **Dashboard** (`GET /loja-pedidos/dashboard`): mais vendidos (groupBy item), PIX×cartão (groupBy pagamento CONFIRMADO), canal Cardápio×PDV, tempo médio preparação/espera. UI: bloco expansível na FilaLoja.
- **SSE no front**: hook `useLojaPedidosStream` (EventSource em /api/loja-pedidos/publico/eventos, ignora ping, reconecta nativo) wired em FilaLoja/PainelTv/AcompanharPedido — complementa o polling react-query (fallback).
- AINDA FALTA p/ produção: ASAAS real + webhook (hoje confirmação é simulada via rota pública — furo de segurança p/ prod), unificar PDV↔fila loja_pedidos, split de pagamento, homologação e2e com containers.

## LOJA loja-pedidos — round 3 (PDV↔fila unificado + split + auditoria) CONCLUÍDO
Builds verdes IdeaPad (nest+next exit 0). NÃO commitado. NOVA migration 37 (loja_auditoria) — aplicar em ordem após a 36.
- **PDV↔fila unificado**: `POST /loja-pedidos/pdv/venda` (perm loja.pedidos.operar) cria loja_pedido canal='PDV', já pago; modo ENTREGAR_AGORA→RETIRADO ou ENVIAR_PREPARACAO→NA_FILA (só se precisaPreparacao). Baixa MESMO estoque (loja_estoque_saldos) + MESMO Financeiro (origem=pdv). NÃO mexeu no módulo pdv do Vitor (pdv_vendas continua existindo em paralelo; este é o caminho novo da fila).
- **Split de pagamento**: VendaPdvDto.pagamentos[] (N formas, validadas somando o total); cria N LojaPedidoPagamento CONFIRMADO; financeiro formaPagamento = 'PIX + DINHEIRO'. (loja_pedido_pagamentos já era 1:N no schema do Vitor.)
- **Auditoria (§48)**: migration 37 cria loja_auditoria (entidade/entidadeId/acao/origem/usuario/antes/depois jsonb/observacao). Model LojaAuditoria no schema. Service.auditar() (best-effort, aceita tx) + listarAuditoria(). Hooks em: pagamento.confirmado, pdv.venda, pedido.retirado, pedido.cancelado/estornado, config.criada/alterada. `GET /loja-pedidos/auditoria` (perm gerenciar). Falta: hook de preço no módulo loja-produtos (deixado p/ o dono do módulo — infra pronta via service.auditar).
- **Web**: BalcaoPdv.tsx (busca via /pdv/produtos, carrinho, split, 2 botões), AuditoriaLoja.tsx (tabela filtrável). Páginas (app)/loja/{balcao,auditoria}. Menu: loja-balcao (operar), loja-auditoria (gerenciar). service vendaPdvFila/lojaAuditoria; types VendaPdvInput/LojaAuditoria/FormaPagamento.
- GOTCHA: jsonSeguro() mantém tipo Decimal no TS mas vira string em runtime → ao castar o resultado use `as unknown as {…}` (2 erros TS2352 assim resolvidos).
