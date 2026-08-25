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

## LOJA — ASAAS + webhook CONCLUÍDO (round 4, gateway real)
Builds verdes IdeaPad (nest+next exit 0). Sem migration nova (reusa loja_pedido_pagamentos).
- **Arquitetura PaymentProvider** em modules/loja-pedidos/pagamentos/: interface payment-provider.ts; AsaasProvider (PIX+cartão via fetch nativo; cria /customers, /payments, GET /payments/:id/pixQrCode; traduz status ASAAS→domínio; interpretarWebhook); ManualProvider (fallback dev, PIX placeholder, confirma só via operador); PagamentosService (registro: usa ASAAS se ASAAS_API_KEY setada, senão manual; .usaGatewayExterno).
- **iniciarPagamento** agora cria cobrança no provider ativo e grava gatewayId/pixQrcode/pixCopiaCola/pixExpiracao/gatewayPayload. **processarWebhook(provider,payload)**: idempotente, acha pagamento por gatewayId, CONFIRMADO→confirmarPagamento(webhook); EXPIRADO/RECUSADO/ESTORNADO atualiza status.
- **Furo fechado**: rota pública `.../pagamento/confirmar` chama confirmarPagamentoPublico() que LANÇA 403 quando usaGatewayExterno (ASAAS ativo). Confirmação real só por webhook assinado ou operador autenticado.
- **Webhook**: `POST /api/loja-pedidos/publico/webhook/asaas` (@Publica), header `asaas-access-token` == env ASAAS_WEBHOOK_TOKEN.
- **Envs** (.env.example): ASAAS_API_KEY, ASAAS_BASE_URL (sandbox padrão), ASAAS_WEBHOOK_TOKEN, LOJA_RESERVA_EXPIRA_MIN, LOJA_LEMBRETE_PRONTO_MIN. Configurar em /opt/febrahub/etl.env na VPS. Webhook URL no painel ASAAS = ${APP_URL}/api/loja-pedidos/publico/webhook/asaas.
- **Front cardápio**: tela PIX real (QR base64 + copia-e-cola + botão copiar) + polling de acompanharPedido; redireciona a /pedido/:id quando sai de AGUARDANDO_PAGAMENTO. Botão "Já paguei (homolog)" só aparece sem QR (sem gateway).
- GOTCHA: `*/` dentro de comentário JSDoc fecha o bloco → não usar em comentários.

## LOJA · ASAAS + QR Code do cardápio (Sprint pagamentos/QR)
- **ASAAS**: implementado por Vitor e COMPLETO — `modules/loja-pedidos/pagamentos/`: `payment-provider.ts` (interface), `asaas.provider.ts` (criar cobrança, QR PIX real via `/payments/{id}/pixQrCode`, consultarStatus, interpretarWebhook, mapa status), `manual.provider.ts` (fallback sem gateway; PIX placeholder; confirmação só pelo operador), `pagamentos.service.ts` (escolhe provider por env; `usaGatewayExterno` bloqueia confirmação pública manual quando ASAAS ativo). Webhook público assinado: `POST /loja-pedidos/publico/webhook/asaas` valida header `asaas-access-token` == `ASAAS_WEBHOOK_TOKEN`; idempotente. Envs em `.env.example`: `ASAAS_API_KEY`, `ASAAS_BASE_URL` (sandbox default), `ASAAS_WEBHOOK_TOKEN`. Webhook aponta p/ `${APP_URL}/api/loja-pedidos/publico/webhook/asaas`.
- **QR Code do cardápio (PRD §11)** feito por mim: API `GET /loja-pedidos/operacoes/:slug/qrcode` (auth `loja.pedidos.ver`) → `{slug, operacao, url, pngDataUrl, svg}`. URL = `${FRONTEND_URL||APP_URL||Origin}/cardapio/:slug`. Usa lib `qrcode` (já em apps/api, como o WhatsApp: `import * as QRCode`). Web: `qrcodeCardapio()` em services/api/loja-pedidos.ts + `components/loja/QrCardapioModal.tsx` (preview + baixar PNG/SVG + imprimir) plugado em `OperacoesLoja.tsx` (botão "QR" ao lado de Cardápio/TV).
- Verificado: API tsc, Web tsc, permissoes.spec (16/16) — todos verdes localmente (VPS nova ssh.aplopesserver.dpdns.org inacessível: só IPs Cloudflare, porta 22 filtrada).
- GAPS restantes do P0: cartão ASAAS (tokenização/checkout — só PIX pronto); `loja.pedidos.*` não concedido a diretoria/gestor (só admin) — falta migration aditiva `*_permissoes`.

## LOJA — auditoria de preço/estoque no catálogo CONCLUÍDO (commit 22f68504)
Fecha §48 no módulo loja-produtos. LojaProdutosService.auditar() escreve DIRETO em loja_auditoria (não acopla a loja-pedidos; best-effort). Hooks: preco.alterado (antes/depois em atualizarProduto), produto.criado/alterado/inativado, estoque.ajustado. AuditoriaLoja.tsx ganhou rótulos. nest+next build verdes na IdeaPad.
- Coordenação: pnpm-lock foi regenerado upstream pelo Deploy Bot (commit a6519ed2) — não precisa mais deixar de fora. Jabson tem WIP não-commitado em perfis-padrao.ts + migration 38 (loja_pedidos_permissoes) — NÃO commitei (preservados via autostash no rebase).

## LOJA · permissões da fila concedidas (migration 38)
- Gap resolvido: `loja.pedidos.*` estava no catálogo (cat 68-72) e nas tabelas (mig 36) mas NÃO era semeado nos perfis — só admin via a fila. Migration **38_loja_pedidos_permissoes** (aditiva, padrão das *_permissoes) concede: diretoria/gestor = ver+operar+gerenciar; equipe (balcão) = ver+operar. `perfis-padrao.ts` sincronizado igual. `permissoes.spec` verde 16/16 (a asserção "bate com o que as migrations semeiam" valida o casamento). Menu (apps/web/src/lib/menu.ts) já gateava fila/operações por loja.pedidos.* → agora aparece p/ esses perfis sem mudança de menu.
- Próximo gap P0 aberto: checkout de CARTÃO ASAAS (tokenização) — hoje só PIX ponta a ponta.

## LOJA · cartão ASAAS (tokenização) — checkout completo
- Gap P0 fechado: cartão de crédito ponta a ponta no Cardápio Digital.
- `pagamentos/payment-provider.ts`: interface `DadosCartao` + campos `cartao?`/`parcelas?` em `CriarCobrancaEntrada`; `statusImediato?` em `CobrancaCriada` (cartão confirma na hora, sem webhook).
- `asaas.provider.ts`: `criarCobranca` monta `creditCard`+`creditCardHolderInfo` (+`installmentCount`/`installmentValue` p/ parcelas) quando forma=CARTAO_*; devolve `statusImediato = traduzirStatus(cobranca.status)`. NADA de cartão é persistido (PRD §18).
- `loja-pedidos.dto.ts`: `CartaoDto` (numero/titular/validadeMes/validadeAno/cvv/cpfCnpj/cep/numeroEndereco/telefone/email) + `cartao?` em `IniciarPagamentoDto`.
- `loja-pedidos.service.ts` `iniciarPagamento`: repassa `cartao`/`parcelas`; se `statusImediato==='CONFIRMADO'` chama `confirmarPagamento(...,'webhook')` na hora (baixa estoque, recebível, fila); se 'RECUSADO' → BadRequest amigável.
- Web `CardapioPublico.tsx`: seletor PIX/Cartão na etapa identificar + form de cartão (numero/titular/validade MM/AA/cvv/cpf); cartão aprovado → `router.push(/pedido/:id)`. `services/api/loja-pedidos.ts`: `DadosCartaoInput` + `cartao?` em `iniciarPagamento`.
- Verificado: API tsc ✅, Web tsc ✅ (ambos exit 0). Editei arquivos que o Vitor tocava (asaas.provider/service/dto/CardapioPublico) — coordenei: a sessão dele estava inativa (última edição 30min antes); edições aditivas/cirúrgicas p/ minimizar conflito.
- P0 da Loja agora COMPLETO: produto+estoque LOJA/DEPÓSITO, ASAAS PIX+cartão+webhook, QR cardápio, fila/TV/acompanhamento SSE, WhatsApp proativo, permissões da fila, dashboard, auditoria.

## Testes de integração LOJA em Postgres real (IdeaPad 172.17.0.1) — 2026-08-25
- Conexão IdeaPad OK via `172.17.0.1:2222` (root/root). Tem Docker 29 + psql 18. `febrahub_postgres`/`febrahub_minio` já rodam lá (db `febrahub`, user `febrahub`), mas o febrahub_postgres estava com só migrations 00-01 e sem tabelas — não confiável p/ teste.
- Método: subi `postgres:16` em Docker (porta 55432), copiei migrations e apliquei via psql. Resultados:
  - **mig 31** (loja_produtos/categorias/estoque LOJA·DEPOSITO) aplica rc=0, semeia 8 categorias. **mig 32/36/38** rc=0.
  - Permissões por perfil conferem: admin/diretoria/gestor = loja.pedidos ver+operar+gerenciar; **equipe = ver+operar**; consulta/integracoes = nenhuma.
  - Estoque LOJA/DEPOSITO: saldo→reserva→venda com disponivel=fisico-reservado por local ✓. Constraint `loja_estoque_reservado_ok` REJEITA reservado>fisico (anti-overselling no banco) ✓.
- **GOTCHA de arquitetura (importante p/ deploy limpo):** as migrations Prisma NÃO aplicam sozinhas num Postgres cru — a **mig 01 indexa `fato_negocio_lead`** e outras `fato_*` que a **init NÃO cria** (init só faz 7 tabelas de auth/arquivos). Os fatos vêm de FORA (dumps Supabase / `db/`). Logo, deploy limpo precisa carregar o dump base ANTES de `prisma migrate deploy`. As migrations da Loja (31/32/36/38) são autossuficientes e aplicam isoladas.
- Limpei o container de teste e /tmp após validar.

## GOTCHA e2e/DB local — migrations dependem do dump Supabase
Tentativa de homologação e2e na IdeaPad (Postgres+MinIO já sobem via docker, healthy). `prisma migrate deploy` do zero FALHA: migration 00000000000001_indices_negocio (e 9 outras, incl. 030_pdv_financeiro, 031_loja_produtos_estoque, 033, 035 — no caminho da Loja) referenciam tabelas fato_/dim_/vw_ que vêm do DUMP do Supabase (25MB, gitignored, não está na IdeaPad), não das migrations. Erro P3018/42P01 "relation fato_negocio_lead does not exist". => e2e real da Loja exige o dump carregado primeiro. Deixei o DB destravado (migrate resolve --rolled-back na 01) mas ele fica com só ~7 tabelas. NÃO é bug do código da Loja; é bootstrap de dados/infra. Para e2e: carregar o dump Supabase no febrahub_postgres antes de migrate deploy.

## Coordenação: Jabson estendendo pagamentos (cartão) — WIP não-commitado
Jabson adicionou pagamento por CARTÃO (crédito/débito) tokenizado sobre a arquitetura PaymentProvider: DadosCartao/CartaoDto (não persistido, PRD §18), CobrancaCriada.statusImediato (cartão confirma na hora sem webhook), iniciarPagamento trata statusImediato CONFIRMADO/RECUSADO. Bem-feito e aditivo. NÃO commitar/mexer nos arquivos pagamentos/*, loja-pedidos.{service,dto}.ts, CardapioPublico.tsx, services/api/loja-pedidos.ts enquanto ele estiver ativo. Combined tree (card dele + meu código) builda verde (nest exit 0).

## HOMOLOGAÇÃO HTTP Loja (IdeaPad, banco homolog) — 2026-08-25
Subi a API real (dist/main.js) na IdeaPad contra um banco `homolog` (schema gerado via `prisma migrate diff --from-empty` + seeds das migrations 14/30/31/32/38). Boot OK, Prisma conectado, rotas mapeadas (incl. minha /operacoes/:slug/qrcode e cartão).

### ✅ Cenário A (cardápio→pagamento) PASSOU ponta a ponta HTTP:
checkout → reserva estoque LOJA (disp 5→3) → iniciarPagamento PIX (provider manual, copia-e-cola) → confirmarPagamentoPublico → status PRONTO → estoque físico 5→3 reservado=0 → recebível R$160 em financeiro_lancamentos. Tudo correto.

### 🔴 ACHADO CRÍTICO — checkout NÃO é atômico contra concorrência (PRD §9 overselling):
`LojaPedidosService.checkout` valida `disponivel = fisico - reservado` (passo 1) e depois faz `increment reservado` (passo 4), MAS o advisory lock só cobre a NUMERAÇÃO (passo 2), não a validação+reserva. Dois checkouts simultâneos leem o mesmo `disponivel` e ambos reservam → OVERSELL.
- Teste D (3 em estoque, 2 pedidos de qtd 2): SEM a CHECK constraint → reservado=4 > fisico=3 (oversold silencioso). COM a constraint `loja_estoque_reservado_ok` (que a migration 31 cria mas o `migrate diff` NÃO gera) → banco bloqueia, mas AMBOS retornam ERRO_INTERNO (500) em vez de 1 sucesso + 1 "Estoque insuficiente".
- **GOTCHA**: `prisma migrate diff --from-schema` NÃO emite CHECK constraints (não estão no schema.prisma, só no SQL da migration 31). Banco de teste feito assim fica SEM a proteção — atenção em qualquer validação por diff.
- **CORREÇÃO recomendada p/ Vitor** (arquivo que ele edita ativamente — NÃO editei p/ evitar clobber): serializar a reserva com `pg_advisory_xact_lock` por produto (ou por operação) ANTES da validação de disponível dentro da tx, OU `SELECT ... FOR UPDATE` nas linhas de loja_estoque_saldos; e traduzir violação da CHECK (Prisma P2010/SQLSTATE 23514) para ConflictException("Estoque insuficiente"). Assim: 1 pedido conclui, o outro recebe erro amigável.
- Vitor tocou o checkout (upsert→update) 22min atrás mas isso NÃO resolve a race; o problema persiste.

Ambiente limpo após teste (API parada, DB homolog dropado, .env.homolog removido).
