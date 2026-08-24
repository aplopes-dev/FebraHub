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

- **Host:** `172.26.0.1`
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
