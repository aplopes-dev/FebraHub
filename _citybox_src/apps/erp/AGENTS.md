# AGENTS.md — ERP (web + api)

> **Para agentes de IA:** Este arquivo é a fonte de verdade sobre o **conjunto
> `apps/erp`** (web + api) — o backoffice de comércio do lojista, sucessor do
> antigo shell multi-vertical `apps/erp` (removido em 2026-07-31; ver §9).
> Leia-o antes de qualquer ação aqui. Para
> detalhes profundos de cada app, veja os `AGENTS.md` específicos:
> - **Frontend:** [`web/AGENTS.md`](web/AGENTS.md)
> - **Backend:** [`api/AGENTS.md`](api/AGENTS.md)
>
> Ao modificar código, atualize as seções relevantes deste arquivo (e do filho
> correspondente) na mesma operação. Nunca remova seções — apenas atualize/adicione.

---

## 1. Identidade do Módulo

| Campo            | Valor                                                    |
| ---------------- | -------------------------------------------------------- |
| **Nome**         | `apps/erp` — guarda-chuva de **`web` + `api`**   |
| **Tipo**         | Backoffice de **comércio** (Next.js Web + NestJS API)     |
| **Responsável**  | Bruno Lopes — Aplopes Tecnologia                          |
| **Status**       | 🟡 Web **autenticado (Keycloak)** e multi-empresa · API com **tenancy** (+ eventos `citybox.store.*`), **catalog**, **stock**, **`customers`**, **`sales`**, **`finance`** e **`store-setup`** · **Produtos + Listas de preço + Estoque + Clientes + Vendas + Finanças** ponta a ponta |
| **Última atualização deste arquivo** | 2026-08-06 (ciclo org: PermissionProfile + seleção de unidade + dados da empresa via API) |

**Propósito em uma linha:**
Backoffice de **comércio** (varejo/serviços) — Next.js com shell completo e
dezenas de telas de domínio (parte ainda **mock**), e uma API NestJS em
Clean Architecture. **Produtos**, **Estoque** e **Clientes** ligados de ponta a ponta.

> ⚠️ **Estado atual não trivial:** **Produtos**, **Categorias**, **Fornecedores**,
> **Listas de preço**, **Clientes** e **categorias de cliente** do `web/` falam com a `api/`.
> No produto, além do núcleo, **unidades**, **fornecedores**, **imagem (MinIO)** e **listas de preço** já
> persistem; adicionais/sugestões/disponibilidade ainda são mock. Vendas/Finanças seguem mock.

---

## 2. Composição (os dois apps)

| App | Caminho | Pacote | Porta | Stack | Status |
|-----|---------|--------|-------|-------|--------|
| **Web** | [`web/`](web/) | `@citybox/erp-web` | `3107` | Next.js 16 · React 19 · `@citybox/ui` · React Query · Zustand | 🟡 Shell + features mock, **exceto Produtos** (integrado); auth pendente |
| **API** | [`api/`](api/) | `@citybox/erp-api` | `3114` | NestJS 11 · Clean Architecture · Prisma 7 (schema `erp`) · **RabbitMQ** (`@citybox/messaging`) | 🟡 Módulos `tenancy` (+ consumidor `citybox.store.*`), `catalog`, `stock` e **`customers`** (clientes CRM + categorias) |

```
apps/erp/
├── web/      ← @citybox/erp-web (frontend)   → ver web/AGENTS.md
├── api/      ← @citybox/erp-api (backend)    → ver api/AGENTS.md
└── AGENTS.md  ← ESTE ARQUIVO (visão de conjunto)
```

> **Histórico:** os dois nasceram como apps separados (`apps/erp-comercio` só
> Next.js) e foram reestruturados em 2026-07-26 para este formato `web/`+`api/`,
> no mesmo padrão de `apps/admin` e `apps/marketplace`. Em 2026-07-31 o
> conjunto foi renomeado de `apps/erp-comercio` para `apps/erp`, substituindo
> o antigo shell multi-vertical legado (ver §9).

---

## 3. Arquitetura de Conjunto

### 3.1 Fluxo end-to-end (implementado para Produtos)
```
Operador (browser)
  → erp-web (:3107, Next.js)
      • React Query dispara a query/mutation da feature
      • fetch same-origin para /api/proxy/comercio/*
  → proxy (route handler do próprio web)
      • injeta X-Store-Id (loja ativa do StoreProvider)
      • injeta Authorization — hoje "Bearer dev-admin" (AUTH_DEV_BYPASS)
      • em produção exige ERP_API_TOKEN, senão falha explicitamente
  → erp-api (:3114, NestJS)
      • AuthGuard + PermissionGuard globais · @StoreId() escopa a loja
  → PostgreSQL (banco citybox_platform, schema erp)
```

Mesmo contrato de `apps/admin` (api + web) e `apps/verticals/food` (api
consumida via proxy pelo antigo shell multi-vertical, removido — ver §9). **O login Keycloak é o que falta**: quando
entrar, muda **só** o `resolveAuthorization()` do proxy — nenhum hook ou
componente precisa ser tocado.

### 3.2 Onde cada coisa vive hoje
| Recurso | Web (`web/AGENTS.md`) | API (`api/AGENTS.md`) |
|---------|------------------------|-------------------------|
| **Organizações / unidades / equipe** | 🟢 web: org/unidade no login · usuários/perfis · dados da empresa (Cadastro) | módulo `tenancy`: orgs/branches/members + **`PermissionProfile`** + catálogo fino → grosso no `PermissionGuard` (ver `api/AGENTS.md` §5.10) |
| **Produtos** | tela real; estoque branch-aware + sort/filtro `stock` | `catalog` + saldo `StockBalance` |
| **Categorias / UoM / Variações / Listas de preço / Fiscais / Fichas** | telas reais via API | `catalog` |
| **Estoque** (depósitos, movimentações, inventário, transferências, compras, cat. mov., carriers, produção) | telas reais via API; `TESTES.md` por feature | `stock` (+ `suppliers`/`carriers`) |
| **Fornecedores** | tela real via API | `suppliers` |
| Vendas (pedidos/contratos/OS/promoções) | telas com **store mock** restante | nenhum módulo |
| Finanças / Clientes (parte) | mix real/mock — ver `web/AGENTS.md` | nenhum módulo de domínio comércio próprio |
| Auth | Keycloak (BFF PKCE) | guards Keycloak + bypass dev |
| Multi-empresa | seletor org/unidade | `X-Organization-Id` + `X-Branch-Id` |
| **Provisionamento vindo do admin da plataforma** | nenhuma tela (acontece antes do primeiro login) | consumidor `citybox.store.*` no `tenancy` — ver `api/AGENTS.md` §9.1 |

---

## 4. Stack (resumo)

| Camada | Tecnologias |
|--------|-------------|
| **Backend (`api`)** | NestJS 11, Clean Architecture por módulo (réplica de `apps/verticals/food/api`), Prisma 7 (`generated/prisma`, schema `erp`, adapter `pg`), Zod v4 (domínio) + class-validator (HTTP), jose (JWT Keycloak), **`@citybox/messaging` (RabbitMQ)**, Swagger, Jest |
| **Frontend (`web`)** | Next.js 16 (App Router, `output: standalone`), React 19, `@citybox/ui`, Tailwind v4, **@tanstack/react-query** (server state) + **zustand** (UI state), next-themes, sonner, `@dnd-kit`, `@tanstack/react-table` |
| **Comum** | TypeScript, **pnpm** (workspace), **Keycloak** (realm `citybox-dev`), PostgreSQL |

Detalhes/versões exatas: ver `api/AGENTS.md` (§3) e `web/AGENTS.md` (§3).

---

## 5. Como Rodar

```bash
# Backend (porta 3114) — precisa do Postgres local (pnpm infra:up:postgres na raiz)
pnpm --filter @citybox/erp-api dev
#   Swagger: http://localhost:3114/api/v1/docs   ·   Health: http://localhost:3114/api/health

# Frontend (porta 3107) — a tela de Produtos EXIGE a API no ar; o resto é mock
pnpm --filter @citybox/erp-web dev

# Ou os dois juntos (na raiz):
pnpm dev:comercio
```

Primeira execução do backend (cria schema `erp` e popula o catálogo):
```bash
pnpm infra:up:postgres                                   # na raiz
pnpm --filter @citybox/erp-api db:migrate:dev
pnpm --filter @citybox/erp-api db:seed          # 15 produtos + 5 categorias + 7 unidades
```

Gate antes de PR (por pacote):
```bash
pnpm --filter @citybox/erp-api  build && pnpm --filter @citybox/erp-api  lint && pnpm --filter @citybox/erp-api  typecheck
pnpm --filter @citybox/erp-web  typecheck && pnpm --filter @citybox/erp-web lint
```

---

## 6. Variáveis de Ambiente (conexão entre os apps)

| Variável | App | Papel |
|----------|-----|-------|
| `ERP_API_URL` | web | Base da API que o **proxy** chama (default `http://127.0.0.1:3114/api`) |
| `ERP_API_TOKEN` | web | **Só produção.** Sem ele o proxy devolve 500 em vez de mandar o token falso de dev |
| `DATABASE_URL` | api | Postgres `citybox_platform` (schema `erp`) |
| `AUTH_DEV_BYPASS` | api | `true` libera `Bearer dev-admin` fora de produção — é o que o proxy usa hoje |
| `RABBITMQ_URL` | api | Broker dos eventos da plataforma. **Sem ele a API sobe normalmente**, mas loja de Varejo/Serviços criada no admin nunca é provisionada e fica em `PROVISIONING` lá (`api/AGENTS.md` §9.1) |
| `ERP_COMERCIO_WORKER_ENABLED` | api | `false` desliga só o consumidor de eventos, mantendo o HTTP |

> Quando o Keycloak entrar, api e web precisarão apontar para o **mesmo realm**,
> e o `resolveAuthorization()` do proxy passa a resolver o access token da sessão.

---

## 7. Decisões de Arquitetura (nível conjunto)

| Decisão | Motivo |
|---------|--------|
| **A api conversa com a plataforma por evento, nunca por chamada síncrona** — *2026-07-30* | Provisionar uma loja com HTTP do `platform-api` para o ERP acoplaria a criação da loja à disponibilidade deste serviço, e uma indisponibilidade de 30s viraria loja meio-criada. Com outbox + fila, o admin publica e segue; o ERP consome quando conseguir e devolve `citybox.provisioning.*`. O preço é entrega at-least-once fora de ordem — pago com dedupe por `event_id` e descarte por carimbo de origem (`api/AGENTS.md` §9.1) |
| Reestruturar `apps/erp-comercio` (só Next.js) em `web/` + `api/` | Padrão consistente com `apps/platform` e `apps/marketplace`; abre espaço para a API própria sem outro app na raiz |
| API nova segue a **Clean Architecture da `food/api`**, não a do `platform/api` | Instrução explícita — as duas são equivalentes em padrão, `food/api` foi escolhida como referência única para evitar mesclar convenções |
| API entregue **sem módulos de negócio** *(2026-07-26, superado)* | Na criação do scaffold só a base foi entregue. Em 2026-07-27 nasceu o módulo `catalog`; o restante do domínio (vendas, financeiro, estoque, ...) segue como mock no `web/` e será portado módulo a módulo |
| Proxy com **dev-bypass** em vez de Keycloak completo | Login OAuth2/PKCE é um projeto à parte, bem maior que o módulo de produtos. O proxy isola essa troca num único ponto (`resolveAuthorization()`) |
| Mock e API **convivem** durante a migração | `MOCK_PRODUCTS` é importado por 11 outras features; apagá-lo quebraria metade do app. Cada feature migra no seu momento |

---

## 8. Contexto para a IA

### Onde mexer
- Mudança de **regra de negócio / endpoint / dados** → `api/` (ver `api/AGENTS.md`): Clean Architecture (domain → application → infrastructure), use cases, repositórios por interface, Prisma.
- Mudança de **UI / telas / fluxo do operador** → `web/` (ver `web/AGENTS.md`): features mock em `src/features/<f>/`.
- **Portar uma feature de mock para real**: normalmente toca os dois — módulo novo na API (ver `api/AGENTS.md` §11 "Ao criar o primeiro módulo") + trocar o store mock do `web/` por chamadas reais (padrão de proxy same-origin já usado por `catalog`/`customers` — ver `web/AGENTS.md` §5.0).

### O que NÃO fazer
- Não assumir que o `web/` já consome a `api/` — confirme sempre, hoje é mock.
- Não duplicar convenções de `platform/api` na `api/` — a referência escolhida foi `food/api`; em caso de divergência entre as duas, `food/api` prevalece aqui.
- Não instalar pacotes com npm/yarn — usar **pnpm** (`--filter <pacote>`).

### Fluxo ao portar uma feature de mock para real (ponta a ponta)
1. **API**: entidade + validação Zod + use case (TDD com repo in-memory) → repositório Prisma + rota store-scoped (`@StoreId()`) → migration. Atualizar `api/AGENTS.md` §4/§9.
2. **Web**: trocar o store mock da feature por um client real (proxy a definir) mantendo os mesmos tipos/contratos já usados pela UI. Atualizar `web/AGENTS.md` §9/§12.
3. Gate (lint/typecheck/test) nos dois pacotes.
4. Atualizar este arquivo se a relação entre os apps mudar (ex.: proxy implementado).

---

## 9. Histórico de Mudanças Estruturais

> Não é changelog de features — registra mudanças que afetam o contexto da IA.

| Data       | Mudança                                              | Impacto                          |
| ---------- | ----------------------------------------------------- | --------------------------------- |
| 2026-08-06 | **Ciclo organização/auth/membros:** `PermissionProfile` + CRUD + mapa fino→grosso; web com usuários/perfis API, `/selecionar-unidade`, Cadastro via `/v1/organizations/current` | Fecha o ciclo inicial Admin→ERP→login multi-unidade→equipe |
| 2026-08-03 | **Vendas + Finanças + Provisionamento de dados de sistema (branch `feat/erp/sales`, rebase sobre o rename):** api ganha `sales` (pedidos, OS, contratos, promoções), `finance` (contas bancárias, lançamentos, grupos/plano de contas/centros de custo/contratos de cartão) e `store-setup` (template `ERP_SEED_TEMPLATE` idempotente); 4 migrations novas em `api/prisma/migrations/2026073*`; web ganha KDS, Unidades e Filiais (via `/v1/branches`), Dados da empresa em 3 abas e Pontos de venda | Todo o trabalho da branch foi reposicionado de `apps/erp-comercio/**` para `apps/erp/**` no merge. Migrations e `scripts/provision-organizations.ts` foram realocados manualmente (o rename-detection do git os tinha mandado para `apps/admin/api`) |
| 2026-07-31 | **Remoção do `apps/erp` legado + rename `apps/erp-comercio` → `apps/erp`:** o shell multi-vertical antigo (`@citybox/erp`, :3107, módulos `/food`/`/varejo`/`/clinic`) foi removido; este conjunto assume o nome `apps/erp` e a porta 3107 (web). Pacotes renomeados `@citybox/erp-comercio-web` → `@citybox/erp-web`, `@citybox/erp-comercio-api` → `@citybox/erp-api` (porta 3111 → 3114, evitando a colisão pré-existente com `imoveis-web`). Client Keycloak `citybox-backoffice` (do legado) reaproveitado pelo `web`; `citybox-erp-comercio` aposentado. Infra de deploy de produção (Dockerfiles, serviço docker-compose, nginx, scripts) migrada do legado para este conjunto | Fecha a consolidação anunciada no ADR `docs/adrs/plat-001-loja-como-unidade-de-billing.md`; identificadores internos do código (`comercioFetch`, `/api/proxy/comercio`, etc.) não foram renomeados |
| 2026-07-30 | **Fase 11 (ADR PLAT-001) — a api deixa de ser ilha:** consumidor `citybox.store.*` (fila `erp-comercio.store-setup`, verticais `Varejo`/`Serviços`) provisiona `Organization` + matriz + OWNER e devolve `citybox.provisioning.completed/failed`; dedupe por `ProcessedEvent`; snapshot de plano na `Organization`; nova dependência `@citybox/messaging` e envs `RABBITMQ_*` | Loja criada no admin da plataforma passa a existir no ERP sozinha e sai de `deploymentStatus=PROVISIONING`. Sem tela nova no web |
| 2026-07-29 | **Fase 9 — Polish catálogo/estoque:** saldo `ProductResponse.stock` branch-aware; sort/filtro estoque server-side; stubs órfãos removidos no web; `TESTES.md` em 9 features | Fecha plano de estoque (sem Adicionais/Sugestões/Disponibilidade nem portar vendas) |
| 2026-07-29 | **Fase 8 — Produção ponta a ponta:** models/rotas em `stock` + integração `features/production` (React Query); BOM da TechnicalSheet; mocks removidos | Estoque fecha manufatura leve; Catálogo + Produção 100% API |
| 2026-07-28 | **Parâmetros fiscais ponta a ponta:** models/rotas em `catalog` + integração `features/fiscal-parameters` (React Query); mock removido | Catálogo GERAL deixa de depender de configured/MOCK_STORES para fiscais |
| 2026-07-28 | **Listas de preço ponta a ponta:** models/rotas em `catalog` + integração `features/price-lists` (React Query); mock removido | Catálogo GERAL deixa de depender de store em memória para preços |
| 2026-07-27 | **Módulo Produtos ponta a ponta:** módulo `catalog` na api (3 models, 9 rotas, 42 testes, seed) + integração no web (proxy `/api/proxy/comercio`, React Query, Zustand). Primeira feature do conjunto a sair do mock | O fluxo web↔api da §3.1 deixa de ser "alvo" e passa a existir. Plano: `.claude/plans/erp-comercio-produtos.plan.md` |
| 2026-07-26 | API scaffold criada em `api/` (Clean Architecture, réplica de `food/api`) — `shared/core`/`domain`/`infra` prontos, Prisma schema sem models, zero módulos de negócio | Conjunto `web/`+`api/` completo estruturalmente; próximo passo é o primeiro módulo real |
| 2026-07-26 | Reestruturação `apps/erp-comercio` (só Next.js) → `apps/erp-comercio/web` + `apps/erp-comercio/api`; este `AGENTS.md` guarda-chuva criado | Alinha com o padrão `apps/platform`/`apps/marketplace`; ver `web/AGENTS.md` §12 e `api/AGENTS.md` §12 para o detalhe de cada lado |

