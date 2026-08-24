# AGENTS.md — Admin (Backoffice da Operação)

> **Para agentes de IA:** Este arquivo é a fonte de verdade sobre o **conjunto
> `apps/admin`** (api + web). Leia-o antes de qualquer ação aqui. Para
> detalhes profundos de cada app, veja os `AGENTS.md` específicos:
> - **Backend:** [`api/AGENTS.md`](api/AGENTS.md)
> - **Frontend:** [`web/AGENTS.md`](web/AGENTS.md)
>
> Ao modificar código, atualize as seções relevantes deste arquivo (e do filho
> correspondente) na mesma operação. Nunca remova seções — apenas atualize/adicione.

---

## 1. Identidade do Módulo

| Campo            | Valor                                                    |
| ---------------- | -------------------------------------------------------- |
| **Nome**         | `apps/admin` — guarda-chuva de **`api` + `web`**     |
| **Tipo**         | Backoffice de **operação da plataforma** (NestJS API + Next.js Web) |
| **Responsável**  | Bruno Lopes — Aplopes Tecnologia                         |
| **Status**       | 🟡 Em desenvolvimento                                    |
| **Última atualização deste arquivo** | 2026-07-31 (rename `apps/platform` → `apps/admin`)                        |

**Propósito em uma linha:**
Painel e API usados pelos **operadores da plataforma** (`platform_admin`) para
**onboarding municipal**, gestão de **clientes (lojistas)**, **lojas** e
**usuários internos**, além de **billing**, **flags** e **auditoria**.

> É o backoffice da **operação CityBox** — distinto do `apps/erp` (backoffice do
> **lojista**) e do `apps/marketplace` (consumidor final).

---

## 2. Composição (os dois apps)

| App | Caminho | Pacote | Porta | Stack | DNS prod |
|-----|---------|--------|-------|-------|----------|
| **API** | [`api/`](api/) | `@citybox/admin-api` | `3103` | NestJS 11 · Prisma 7 · Keycloak | `admin.aplopes.com/api/` (via BFF) |
| **Web** | [`web/`](web/) | `@citybox/admin-web` | `3108` | Next.js 16 · React 19 · TanStack Query | `admin.aplopes.com` |

> **Histórico de nomes:** o conjunto se chamava `apps/platform` (sub-apps
> `api/` + `admin/`); renomeado para `apps/admin` (sub-apps `api/` + `web/`)
> em 2026-07-31, mesmo padrão de `apps/erp/{api,web}` — ver §9.

```
apps/admin/
├── api/      ← @citybox/admin-api (backend)   → ver api/AGENTS.md
├── web/      ← @citybox/admin-web (frontend)  → ver web/AGENTS.md
├── README.md
└── AGENTS.md  ← ESTE ARQUIVO (visão de conjunto)
```

---

## 3. Arquitetura de Conjunto

### 3.1 Fluxo end-to-end
```
Operador (browser)
  → admin-web (:3108, Next.js)
      • login OAuth2 Authorization Code + PKCE no Keycloak
      • tokens em cookies httpOnly
      • chamadas a /api/proxy/admin/* (same-origin)
  → proxy server-side (route handler do admin-web)
      • injeta "Authorization: Bearer <access>" + refresh automático
  → admin-api (:3103, NestJS)
      • AuthGuard valida o JWT do Keycloak (JWKS) + PermissionGuard (platform.admin)
  → PostgreSQL (banco citybox_platform, schema "platform")  +  Keycloak Admin API (provisão de usuários/roles)
```

Pontos-chave do contrato entre os dois:
- O browser **nunca** fala direto com a API — sempre via **proxy same-origin** do admin-web.
- A API é **stateless** quanto à sessão: confia no **JWT do Keycloak**; o admin-web cuida de login/refresh e guarda os tokens em **cookies httpOnly**.
- Permissão base de tudo: **`platform.admin`** (roles Keycloak: `platform_admin`, `platform_operator`, `platform_admin_client`).

### 3.2 Domínio compartilhado (mesmos recursos nas duas pontas)
| Recurso | API (`/api/v1/...`) | Web (rota) | Observação |
|---------|---------------------|------------|------------|
| **Clientes** (lojistas PF/PJ) | `clients*` | `/clientes` | CRUD + bloqueio; cobrança/endereço |
| **Lojas** | `stores*` (settings, modules, team, audit-log) | `/lojas` | ciclo de vida da loja + membros (Keycloak) |
| **Usuários internos** | `users*` | `/usuarios` | provisão no Keycloak |
| **CEP** | `cep/:cep` | (lookup nos forms) | provider BrasilAPI |
| **Billing / Financeiro / Auditoria** | `platform/*`, `dashboard/*` | `/planos`, `/financeiro`, `/audit` | Auditoria global (`/audit`) e Dashboard principal integrados com dados reais; planos/financeiro em progresso |

> A API hoje expõe **users, clients, stores, cep, me/stores, health**; vários endpoints
> de billing/finance/onboarding consumidos pelo front ainda são **stub/legado** (ver os AGENTS.md filhos).

---

## 4. Stack (resumo)

| Camada | Tecnologias |
|--------|-------------|
| **Backend (`api`)** | NestJS 11, Clean Architecture por módulo, Prisma 7 (`generated/prisma`, schema `platform`, adapter `pg`), Zod v4 (domínio) + class-validator (HTTP), jose (JWT Keycloak), bcrypt, Swagger, Jest |
| **Frontend (`web`)** | Next.js 16 (App Router, `output: standalone`), React 19, TanStack Query 5 + Table 8, React Hook Form 7 + Zod 4, Tailwind v4 (**com** `tailwind.config.ts`), `@citybox/ui`, recharts, sonner, Vitest |
| **Comum** | TypeScript, **pnpm** (workspace), **Keycloak** (realm `citybox-dev`), PostgreSQL |

Detalhes/versões exatas: ver `api/AGENTS.md` (§3) e `web/AGENTS.md` (§3).

---

## 5. Como Rodar

```bash
# Backend (porta 3103)
pnpm --filter @citybox/admin-api dev
#   Swagger: http://localhost:3103/api/v1/docs   ·   Health: http://localhost:3103/api/health

# Frontend (porta 3108) — depende da API no ar
pnpm --filter @citybox/admin-web dev

# Banco (API): copie api/.env.example → api/.env e rode migrations
pnpm --filter @citybox/admin-api db:migrate:dev
pnpm --filter @citybox/admin-api db:generate
```

**Credenciais de dev** (Keycloak realm `citybox-dev`):
`admin@citybox.com` / `aplopes` (role `platform_admin`).

Gate antes de PR (por pacote):
```bash
pnpm --filter @citybox/admin-api  lint && pnpm --filter @citybox/admin-api  test
pnpm --filter @citybox/admin-web      typecheck && pnpm --filter @citybox/admin-web lint && pnpm --filter @citybox/admin-web test
```

---

## 6. Variáveis de Ambiente (conexão entre os apps)

Cada app tem seu `.env.example`. As variáveis que **ligam os dois** ao Keycloak/DB:

| Variável | App | Papel |
|----------|-----|-------|
| `ADMIN_API_URL` | web | Base da admin-api que o **proxy** chama (ex.: `http://127.0.0.1:3103/api`) |
| `DATABASE_URL` | api | Postgres `citybox_platform` (schema `platform`) |
| `KEYCLOAK_ISSUER` / `NEXT_PUBLIC_KEYCLOAK_ISSUER` | api / web | Mesmo realm (`citybox-dev`) — a API valida o token que o web emite |
| `KEYCLOAK_ADMIN_*` / `KEYCLOAK_ADMIN_WEB_SECRET` | api / web | Provisão (api) e troca de tokens do client `citybox-admin` (web) |

> Regra de ouro: **API e Web precisam apontar para o mesmo realm Keycloak**, senão o JWT
> emitido no login do admin-web não valida na admin-api.

---

## 7. Decisões de Arquitetura (nível conjunto)

| Decisão | Motivo |
|---------|--------|
| Separar **api** (NestJS) e **web** (Next.js) no mesmo guarda-chuva `admin` | Backend de domínio independente do front; deploy/escala separados |
| Comunicação **só via proxy same-origin** do admin-web | Esconde tokens (httpOnly), evita CORS, centraliza refresh |
| API **stateless** confiando no **JWT do Keycloak** | Sessão/refresh ficam no front; API só valida e autoriza |
| API com **schema Prisma próprio** (`platform`, banco `citybox_platform`) | Serviço autocontido, separado do tenant do marketplace |
| Permissão base única **`platform.admin`** | Backoffice é deny-by-default liberado para operadores da plataforma |

---

## 8. Contexto para a IA

### Onde mexer
- Mudança de **regra de negócio / endpoint / dados** → `api/` (ver `api/AGENTS.md`): Clean Architecture (domain → application → infrastructure), use cases, repositórios por interface, Prisma.
- Mudança de **UI / telas / fluxo do operador** → `web/` (ver `web/AGENTS.md`): features (api/hooks/components/schemas), TanStack Query, proxy.
- Mudança de **contrato** (campo novo numa entidade) → normalmente **os dois**: DTO/entidade/migration na API **e** `*Dto`/mapper/hook no web.

### O que NÃO fazer
- Não chamar a admin-api direto do browser — sempre via proxy do admin-web.
- Não divergir o realm Keycloak entre api e web (quebra a validação do JWT).
- Não tratar billing/finance/onboarding como prontos — há **stubs/mock**; confirme no AGENTS.md filho antes.
- Não instalar pacotes com npm/yarn — usar **pnpm** (`--filter <pacote>`).

### Fluxo ao adicionar um recurso de ponta a ponta
1. **API**: entidade + validações (Zod) + use case (com repo in-memory/TDD) → repositório Prisma + rota (DTO/presenter) → migration. Atualizar `api/AGENTS.md` §9.
2. **Web**: `*Dto` + `fetch*` em `lib/admin-api` → `features/<f>/api` (DTO→domínio) + `query-keys` → hooks React Query → componentes/rota + item no menu. Atualizar `web/AGENTS.md` §9.
3. Gate (lint/typecheck/test) nos dois pacotes.
4. Atualizar este arquivo se a relação entre os apps mudar.

---

## 9. Histórico de Mudanças Estruturais

> Não é changelog de features — registra mudanças que afetam o contexto da IA.

| Data       | Mudança                                              | Impacto                          |
| ---------- | ---------------------------------------------------- | -------------------------------- |
| 2026-07-31 | **Rename `apps/platform` → `apps/admin`:** sub-apps `api/` (inalterado) e `admin/` → `web/`; pacote `@citybox/platform-api` → `@citybox/admin-api` (`@citybox/admin-web` já seguia o padrão); portas (3103/3108), schema Postgres (`platform`) e clients Keycloak (`citybox-admin`/`citybox-core-admin`) mantidos sem alteração — mesmo padrão do rename anterior `apps/erp-comercio` → `apps/erp` | Consolida a nomenclatura `apps/<nome>/{api,web}` em todo o monorepo; scripts `db:migrate:platform:*`/`db:generate:platform` da raiz renomeados para `db:migrate:admin:*`/`db:generate:admin` |
| 2026-07-23 | Integração de Dashboard e Auditoria (Ponta a ponta) | Implementadas APIs e presenters para resumo operacional/financeiro e auditoria global no backend, e consumidas no frontend via hooks reativos do React Query sincronizados com a URL. |
| 2026-07-17 | Webhook Asaas e Processamento de Cobranças          | Processamento assíncrono dos eventos PAYMENT_CREATED, PAYMENT_UPDATED, PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_OVERDUE na API para atualizar automaticamente os status locais das faturas. |
| 2026-07-10 | Refatoração de equipe e vinculação múltipla de lojas | Migração para N:N de Store/Member na `platform-api` + proteção de e-mails. Novo fluxo com abas (Usuário existente/Novo), multi-seleção de operadores existentes e busca com debounce executada no backend. |
| 2026-07-16 | Cobrança avulsa no Asaas via `CreateManualInvoiceUseCase` | Faturas manuais agora são registradas no Asaas via `paymentGateway.createInvoice()` quando o cliente possui `gatewayCustomerId`. Mapeamento de status gateway→local (PAID/_OVERDUE/CANCELLED/REFUNDED). `InvoicesModule` importa `PaymentGatewayModule`. `Invoice` ganha `setGatewayPaymentId()` |
| 2026-07-16 | Integração Asaas & Provisionamento Assíncrono | Novo módulo `payment-gateway` com provedor Asaas e endpoint de Webhook. Adicionado `ClientCreatedListener` e evento `client.created` para provisionar clientes/assinaturas no Asaas assincronamente. Campos de Stripe renomeados para genéricos (`gatewayCustomerId`/`gatewaySubscriptionId`/`gatewayPaymentId`). |
| 2026-07-15 | Implementação da Fatura Manual (Back + Front) | Finalizada a implementação de geração de fatura manual. Integrada com o frontend admin-web e adicionada a lógica correspondente (POST /v1/invoices/manual) com vencimento para o próximo mês. |
| 2026-07-14 | Componente de Visualização/Edição de Detalhes de Membro | Adicionado o componente `MemberDetailSheet` na aba de usuários de detalhes de cliente. Suporta visualizar e editar (com chaves de acesso a lojas e cargo por loja) e salva alterações atualizando o cache local do React Query. |
| 2026-06-25 | Arquivo `AGENTS.md` (guarda-chuva platform) criado    | —                                |
