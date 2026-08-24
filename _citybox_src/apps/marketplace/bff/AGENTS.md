# AGENTS.md — Marketplace BFF

> **Para agentes de IA:** Este arquivo é a fonte de verdade sobre este módulo.
> Leia-o integralmente antes de qualquer ação. Ao modificar código neste módulo,
> atualize as seções relevantes deste arquivo na mesma operação. Nunca remova
> seções — apenas atualize ou adicione.

---

## 1. Identidade do Módulo

| Campo            | Valor                                                |
| ---------------- | ---------------------------------------------------- |
| **Nome**         | `apps/marketplace/bff` · pacote `@citybox/marketplace-bff` |
| **Tipo**         | BFF NestJS · Gateway público B2C                     |
| **Responsável**  | Bruno Lopes — Aplopes Tecnologia                     |
| **Status**       | 🟢 Em produção (citybox.com.br/api)                  |
| **Porta**        | `3102`                                               |
| **Última atualização deste arquivo** | 2026-08-13                       |

**Propósito em uma linha:**
Backend for Frontend do **app consumidor** (web Vite/React, iOS SwiftUI, Android
Compose) — implementa o contrato **`docs/openapi.yaml`** (CityBox BFF API v1.0.0,
~77 operações): auth mediada no Keycloak, catálogo, carrinho, checkout, pedidos,
conta e engajamento. Envelope `{ data, meta?, errors? }`, Bearer JWT.

---

## 2. Posição no Monorepo

```
citybox/
├── apps/marketplace/
│   ├── api/                  ← @citybox/marketplace-api (:3101) — core transacional
│   ├── bff/                  ← VOCÊ ESTÁ AQUI (@citybox/marketplace-bff · :3102)
│   ├── web/                  ← app consumidor web (Vite) — VITE_API_MODE=live fala com este BFF
│   ├── ios/ · android/       ← apps nativos — modo live fala com este BFF
├── docs/
│   ├── openapi.yaml          ← CONTRATO deste BFF (fonte de verdade)
│   └── BFF.md                ← contrato legível por épico (A auth, B conta, C checkout…)
```

**Depende de (infra externa):**
- **PostgreSQL** — schema **`consumer`** próprio (`CONSUMER_DATABASE_URL`), criado via
  `prisma db push` (`prisma/consumer/schema.prisma`). Dados do consumidor + read model
  de catálogo (Product/Category/Review/HomeSection, hoje via seed; futuramente projetado
  pelos workers a partir de `citybox.offer.published.v1`/`catalog.item.updated.v1`).
- **Keycloak** — realm próprio **`citybox-marketplace`** (ADR C-16, o realm B2C); clients
  `marketplace-app` (público + PKCE, usado nos grants do BFF) e `marketplace-provisioning`
  (service account com `manage-users` **limitado a este realm**). Declarados em
  `infra/keycloak/import/citybox-marketplace-realm.json` e aplicados por `pnpm keycloak:sync`
  — **não** há mais script imperativo de provisionamento (ver §10).
- **Redis** — cache (catálogo/carrinho) + tokens de reset de senha (`REDIS_URL`).
- **Typesense** — busca de produtos (collection `consumer_products`), com **fallback
  automático para Postgres ILIKE** quando indisponível.

**Consumido por:** web (`apps/marketplace/web`), iOS e Android. O app **nunca** acessa
`marketplace/api` nem APIs verticais diretamente (A-04).

---

## 3. Stack e Versões

| Tecnologia        | Versão     | Observação                                            |
| ----------------- | ---------- | ----------------------------------------------------- |
| Node.js           | ≥ 20       | `@types/node` 22                                      |
| pnpm              | workspace  | Package manager do monorepo — nunca npm/yarn          |
| TypeScript        | ~6.0.x     | ESM (`"type": "module"`); imports com sufixo `.js`    |
| tsx               | —          | runtime/dev; produção roda `node dist/main.js`        |
| NestJS            | 11.x (catalog) | + `class-validator`/`class-transformer` (ValidationPipe global) |
| Prisma            | 7.8.0      | `prisma/consumer/schema.prisma` → `src/generated/consumer/`; adapter `@prisma/adapter-pg` com `{ schema: 'consumer' }` |
| jose              | 5.x        | validação JWT via JWKS do Keycloak                    |
| ioredis           | 5.6.x      | Redis                                                 |
| typesense         | 2.0.x      | busca                                                 |
| Testes            | node:test + tsx | `pnpm test` → `test/*.test.ts` (unitários, sem infra) |

---

## 4. Estrutura de Pastas

```
apps/marketplace/bff/
├── src/
│   ├── main.ts               ← prefixo global "api", CORS, ValidationPipe, EnvelopeInterceptor/Filter, Swagger /api/v1/docs
│   ├── app.module.ts         ← módulo único; APP_GUARD = JwtAuthGuard (rotas públicas usam @Public())
│   ├── config.ts             ← envs centralizadas + loader .env local
│   ├── common/               ← envelope.ts ({data,meta,errors}, paginated(), ApiError), money.ts, inject.ts
│   ├── auth/                 ← keycloak.service (grants/admin API), jwt.guard (@Public/@CurrentUser), auth.controller (/auth/*)
│   ├── users/                ← users.service (lazy provisioning por keycloakId), me.controller (/me, settings, avatar, subscription)
│   ├── catalog/              ← /catalog/* (home, categories, products, search, suggestions, filters), reviews, search-history; product.presenter
│   ├── addresses/            ← /me/addresses CRUD + /addresses/zip/:cep (ViaCEP)
│   ├── payment-methods/      ← /me/payment-methods (nunca armazena PAN/CVV — só brand/last4)
│   ├── favorites/            ← /me/favorites
│   ├── cart/                 ← /me/cart por usuário (Postgres fonte de verdade + cache Redis)
│   ├── checkout/             ← session, preview (checkout.pricing.ts puro), coupons, shipping, POST /checkout/orders (Idempotency-Key)
│   ├── orders/               ← /me/orders (ETag/304), tracking, cancel, returns, buy-again, invoice
│   ├── engagement/           ← notificações, chat suporte, tickets, FAQ
│   ├── content/              ← banners, páginas estáticas, rota raiz
│   ├── search/client.ts      ← Typesense (searchProductIds com fallback null → ILIKE)
│   ├── cache/cache.service.ts← Redis get/set TTL/del + stats
│   ├── database/consumer.ts  ← singleton PrismaClient (adapter pg + schema consumer)
│   └── generated/consumer/   ← CLIENTE PRISMA GERADO (não editar)
├── prisma/consumer/schema.prisma
├── prisma.config.ts          ← datasource url = env CONSUMER_DATABASE_URL (Prisma 7)
├── scripts/
│   └── seed.ts               ← seed idempotente (catálogo/cupons/frete/faq/banners/páginas) + indexação Typesense
│                                (setup-keycloak.ts REMOVIDO em 2026-08-13 — realm é declarativo)
├── test/                     ← node:test unitários (envelope, presenters, pricing)
├── Dockerfile                ← build monorepo (pnpm) → node dist/main.js
├── docker-compose.prod.yml   ← produção na VPS (rede aplopes-platform, 127.0.0.1:3102)
└── .env.example
```

---

## 5. Restrições Críticas

### 5.1 Package manager / ESM
- `pnpm --filter @citybox/marketplace-bff <script>`; nunca npm/yarn.
- ESM puro: **todo import relativo com sufixo `.js`** (quebra em runtime senão).

### 5.2 Prisma 7 — cliente consumer gerado
```ts
// ✅ importar do gerado, NUNCA de "@prisma/client"
import { PrismaClient } from '../generated/consumer/client.js';
// ✅ o adapter pg IGNORA ?schema= da URL — schema vai na opção:
new PrismaClient({ adapter: new PrismaPg(pool, { schema: 'consumer' }) });
// Após mudar prisma/consumer/schema.prisma:
//   pnpm db:generate:consumer   e   CONSUMER_DATABASE_URL=... pnpm db:push:consumer
```

### 5.3 DI Nest — sempre `@InjectService(Classe)`
O pacote roda sob tsx; **não** confie em `emitDecoratorMetadata` para injeção
implícita (inclusive `Reflector`). Use `@InjectService(X)` em todo parâmetro de
constructor.

### 5.4 Envelope e erros
- Controllers retornam **payload cru** (interceptor envelopa em `{data}`) ou
  `paginated(data, meta)`. Nunca montar `{data: ...}` manualmente.
- Erros: helpers de `common/envelope.ts` (`ApiError`, `badRequest`, `notFound`, …) →
  `{ data: null, errors: [{code, message, field}] }`.

### 5.5 Auth
- Guard global `JwtAuthGuard` valida Bearer via JWKS e faz lazy provisioning do
  `ConsumerUser`; rotas públicas anotam `@Public()`.
- O BFF **media** o Keycloak (Direct Access Grant + admin API). O app nunca fala com o
  Keycloak.
- **Issuer ÚNICO** (invariante 1 do ADR C-16): `config.keycloak.issuer()` devolve um só
  valor — `KEYCLOAK_ISSUER`, ou `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}` quando
  vazio. A lista `KEYCLOAK_ACCEPTED_ISSUERS` **foi removida**: aceitar mais de um issuer
  é aceitar token de mais de um realm. Em produção, onde o issuer público difere da base
  interna, defina `KEYCLOAK_ISSUER` explicitamente.
- Grants de usuário usam `marketplace-app`, que é **público** — não enviam `client_secret`.
  Registro/reset usam `marketplace-provisioning` (`KEYCLOAK_PROVISIONING_CLIENT_*`).
- ⚠️ **Pendência de infra:** o JSON do realm traz `marketplace-app` com
  `directAccessGrantsEnabled: false`, incompatível com o password/refresh grant deste BFF.
  Ver §10.

### 5.6 Contrato é o docs/openapi.yaml
- Shapes seguem `web/src/api/types.ts` / `citybox-api.ts` (clientes gerados dos três
  apps derivam do mesmo spec). Não expor modelo Prisma cru; usar presenters.
- `POST /checkout/orders` exige header `Idempotency-Key` (replay devolve o mesmo
  pedido). `GET /me/orders/:id` suporta `If-None-Match`/ETag → 304.
- Valores monetários: `number` decimal BRL via `money()`; `deliveryDate` é **texto de
  exibição** (ex.: `até 30/07`), não ISO.

### 5.7 Cart/checkout
- Carrinho por **usuário autenticado** (`/me/cart`); Postgres é fonte de verdade, Redis
  é cache invalidado em toda mutação. (O antigo `x-session-id` anônimo foi removido.)
- Regras de preço em `checkout/checkout.pricing.ts` (módulo puro, testável) — réplica de
  `web/src/mocks/checkout-logic.ts` (PIX 5%, cupom PERCENT/FIXED, frete grátis Plus/SP).
- Pagamento é **simulado** (snapshots PIX/CARD/BOLETO no shape `ApiPaymentResult`).
  Integração real de PSP: fase futura via `marketplace-api`/payment.

### 5.8 Segurança
- Nunca armazenar número completo de cartão/CVV — só brand/lastFour/expiry/holder.
- `TYPESENSE_API_KEY` default é só dev; produção via env.

---

## 6. Padrões de Código

```ts
@ApiTags('catalog')
@Public()
@Controller('catalog')
export class CatalogController {
  constructor(@InjectService(CatalogService) private readonly catalog: CatalogService) {}

  @Get('home')
  @ApiOperation({ summary: 'Home — seções + produtos' })
  home() {
    return this.catalog.home(); // payload cru; interceptor → {data}
  }
}
```
Paginação: query `page`/`pageSize`, retorno `paginated(payload, { page, pageSize, total })` (§8.1 raiz).

---

## 7. Variáveis de Ambiente

| Variável | Obrig. | Default (dev) | Descrição |
| -------- | ------ | ------------- | --------- |
| `PORT` | ➖ | `3102` | Porta HTTP |
| `CONSUMER_DATABASE_URL` | ✅ | `postgresql://citybox:citybox@127.0.0.1:15433/ilheus_dev?schema=consumer` | Postgres (schema consumer) |
| `REDIS_URL` | ➖ | `redis://127.0.0.1:16379` | Cache + reset tokens |
| `KEYCLOAK_BASE_URL` | ➖ | `http://127.0.0.1:8180` | Base interna do Keycloak |
| `KEYCLOAK_REALM` | ➖ | `citybox-marketplace` | Realm próprio do marketplace (ADR C-16) |
| `KEYCLOAK_ISSUER` | ➖ | `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}` | Issuer **único** aceito na validação do JWT |
| `KEYCLOAK_CLIENT_ID` | ➖ | `marketplace-app` | Client público + PKCE (sem secret) |
| `KEYCLOAK_PROVISIONING_CLIENT_ID` | ➖ | `marketplace-provisioning` | Service account (`manage-users` só deste realm) |
| `KEYCLOAK_PROVISIONING_CLIENT_SECRET` | ✅ (registro) | — | Dev: `marketplace-provisioning-dev-secret` |
| `TYPESENSE_HOST/PORT/PROTOCOL/API_KEY` | ➖ | `127.0.0.1/8108/http/citybox-dev-typesense-key` | Busca |
| `TYPESENSE_PRODUCTS_COLLECTION` | ➖ | `consumer_products` | Collection |
| `PUBLIC_BASE_URL` | ➖ | `http://127.0.0.1:3102/api` | URLs absolutas |
| `CORE_API_URL` | ➖ | — (vazio = desabilitado) | Base da marketplace-api core p/ espelhar pedidos |
| `CORE_STORE_ID` | ➖ | `00000000-0000-7000-8000-000000000001` | storeId usado no `POST /v1/orders` da core |

`.env` local é carregado pelo `config.ts` (sem dependência de dotenv). Ver `.env.example`.

---

## 8. Scripts

```bash
pnpm --filter @citybox/marketplace-bff dev            # tsx watch (:3102)
pnpm --filter @citybox/marketplace-bff build          # tsc → dist/
pnpm --filter @citybox/marketplace-bff typecheck
pnpm --filter @citybox/marketplace-bff test           # node:test (test/*.test.ts)
pnpm --filter @citybox/marketplace-bff db:generate:consumer
CONSUMER_DATABASE_URL=... pnpm --filter @citybox/marketplace-bff db:push:consumer
pnpm --filter @citybox/marketplace-bff seed           # catálogo + Typesense (idempotente)

# Realm + clients do Keycloak: declarativos, na raiz do monorepo
pnpm keycloak:sync                                    # aplica infra/keycloak/import/*-realm.json

# Swagger: http://localhost:3102/api/v1/docs · Health: /api/health
```

---

## 9. Módulos Implementados

Contrato completo `docs/openapi.yaml` (rotas planas sob prefixo `/api`). Resumo:

| Grupo | Rotas | Fonte |
| ----- | ----- | ----- |
| Auth | POST `/auth/{login,register,google*,refresh,logout,forgot-password,reset-password,onboarding}` · GET `/auth/session` · PATCH `/me/onboarding` | Keycloak (DAG + admin API); *google = 501 |
| Catálogo | GET `/catalog/{home,categories,categories/:id/products,products/:id,search,search/suggestions,filters/metadata}` | Prisma consumer + Redis + Typesense (fallback ILIKE) |
| Reviews | GET/POST `/catalog/products/:id/reviews` · POST `.../:reviewId/photos` | Prisma (recalcula rating em transação) |
| Busca hist. | GET/POST/DELETE `/me/search-history` | Prisma |
| Conta | GET/PATCH/DELETE `/me` · POST `/me/avatar` · GET/PATCH `/me/settings` · GET `/me/subscription` · POST `/me/subscription/cancel` | Prisma + Keycloak (delete) |
| Endereços | CRUD `/me/addresses` + PATCH `:id/default` · GET `/addresses/zip/:cep` | Prisma + ViaCEP |
| Cartões | GET/POST/DELETE `/me/payment-methods` + PATCH `:id/default` | Prisma (sem PAN/CVV) |
| Favoritos | GET `/me/favorites` · PUT `/me/favorites/:productId` | Prisma |
| Carrinho | GET/DELETE `/me/cart` · POST `/me/cart/items` · PATCH/DELETE `/me/cart/items/:productId` · POST `/me/cart/coupon` | Prisma (verdade) + Redis (cache) |
| Checkout | GET/PATCH `/checkout/session` · POST `/checkout/{shipping-options,preview,orders,coupons/validate}` · DELETE `/checkout/coupons` · GET `/me/coupons` | checkout.pricing puro + Prisma |
| Pedidos | GET `/me/orders(/:id)` (ETag) · `/tracking` · `/invoice` · POST `/cancel`, `/buy-again`, `/returns` · GET `/returns/:returnId` | Prisma (snapshots) |
| Engajamento | GET `/support/faq` · `/me/notifications` (+read/read-all) · chat `/me/support/chat/messages` · tickets `/me/support/tickets` | Prisma |
| Conteúdo | GET `/content/banners` · `/content/pages/:slug` · `/` · `/health(/ready)` | Prisma |

---

## 10. Decisões de Arquitetura

| Data | Decisão | Motivo |
| ---- | ------- | ------ |
| 2026-07-26 | BFF reescrito para servir o contrato `docs/openapi.yaml` (rotas planas, envelope `{data,meta,errors}`, JWT) | Web/iOS/Android já tinham clientes gerados desse spec; o BFF anterior (`/v1/app/*`, sem auth) não era consumível |
| 2026-07-26 | Schema Postgres `consumer` próprio (inclui catálogo como read model seedado) | Workers/projeções do marketplace ainda não populam read models em produção; seams mantidos para projeção futura via eventos |
| 2026-07-26 | Auth mediada: Keycloak Direct Access Grant + service account manage-users | ADR C-07; clientes esperam `{accessToken,refreshToken}` no corpo (sem redirect OIDC) |
| 2026-07-26 | Carrinho por usuário em `/me/cart` (Postgres verdade + Redis cache) | Contrato exige carrinho autenticado; write-behind anônimo por `x-session-id` removido |
| 2026-07-26 | Pagamento simulado (PIX/CARD/BOLETO snapshots) | payment-api será refeito (🔴); shapes do contrato preservados para troca futura |
| 2026-07-26 | Pedidos: consumer schema é o read model do app; a escrita é **espelhada na core** via `CoreOrdersService` → `POST /v1/orders` (`CORE_API_URL`, token do consumidor repassado; `Order.coreOrderId` guarda o vínculo). Falha da core não bloqueia o pedido (fallback resiliente + reconciliação) | Core em produção (`citybox_marketplace_api` :3101, DBs `marketplace_platform`/`marketplace_tenant`); workers/payment ainda fora (sem Dockerfile / payment 🔴) |
| 2026-07-27 | Log do espelho core em **WARN** estruturado (`[core-mirror] skip (resilient fallback)` + `consumerOrderId` + status/body truncado + `consumer_order_kept; reconcile_later`); sucesso em LOG. Evita `console.error`/`failed` que parecem incidente ativo | Monitoramento e triagem pós-checkout |
| 2026-08-13 | **Realm próprio `citybox-marketplace`** (ADR C-16): clients `marketplace-app` (público + PKCE) e `marketplace-provisioning`. Saíram `citybox-dev`, `citybox-consumer`, `citybox-consumer-admin` | Realm B2C isolado do backoffice: mesmo e-mail em dois sistemas deixa de colidir (D1), sessão do admin não vaza para o app (D2), `manage-users` limitado ao próprio realm (D3) |
| 2026-08-13 | **`scripts/setup-keycloak.ts` REMOVIDO** (não reduzido) | O script criava realm + os dois clients imperativamente. Com `infra/keycloak/import/citybox-marketplace-realm.json` + `pnpm keycloak:sync`, passariam a existir **dois escritores da mesma configuração** — exatamente o mecanismo de divergência que o ADR C-16 elimina. Ele já divergia: criava o realm com `registrationAllowed: false` enquanto o JSON pede `true`, e nunca aplicou `passwordPolicy`, `verifyEmail`, timeouts de sessão nem PKCE. Não cobria nada que o sync não cubra: a única coisa exclusiva era **imprimir o secret**, e o sync define o secret a partir de `secretEnv` (dev: `<clientId>-dev-secret`), então o valor é conhecido sem descoberta. Nenhum `package.json`/CI o referenciava |
| 2026-08-13 | Issuer único na validação de JWT; `KEYCLOAK_ACCEPTED_ISSUERS` removida | Invariante 1 do ADR C-16 — lista de issuers é lista de realms aceitos |
| — | Cache Redis por tela com TTL; Typesense com fallback ILIKE | Performance B2C com degradação graciosa |

---

## 11. Contexto para a IA

### O que NÃO fazer
- Não importar de `@prisma/client`; não omitir `.js` nos imports relativos.
- Não injetar dependência sem `@InjectService(...)` (inclusive `Reflector`).
- Não montar envelope `{data}` manualmente nem expor Prisma cru.
- Não armazenar PAN/CVV de cartão; não logar tokens.
- Não expor o app à `marketplace/api`/verticais (A-04).
- Não recriar script imperativo de setup do Keycloak: realm e clients são declarativos em `infra/keycloak/import/` (ver §10).
- Não reintroduzir lista de issuers aceitos — issuer é único (ADR C-16, invariante 1).
- Não enviar `client_secret` nos grants de `marketplace-app`: é client público.
- Não fazer `cache.set` sem TTL.
- Listagens: busca/paginação **sempre no backend** (§8.1 do AGENTS raiz).

### Ao adicionar rota
1. Conferir o shape no `docs/openapi.yaml` + `web/src/api/citybox-api.ts`.
2. Controller fino + service; DTO class-validator; `@Public()` se não autenticada.
3. Registrar em `app.module.ts`; atualizar seção 9 deste arquivo.
4. Teste unitário quando houver lógica pura (padrão `checkout.pricing`).

### Deploy (produção)
`docker-compose.prod.yml` (rede `aplopes-platform`, 127.0.0.1:3102 ← nginx
`citybox.com.br/api`). Passos: `db:push:consumer` → `pnpm keycloak:sync` (realm
`citybox-marketplace`) → `seed` → compose up. O compose espera
`KEYCLOAK_MARKETPLACE_PROVISIONING_SECRET` no ambiente. Ver script de deploy na VPS
(`scripts/deploy/` + relatório de deploy).

---

## 12. Histórico de Mudanças Estruturais

| Data       | Mudança | Impacto |
| ---------- | ------- | ------- |
| 2026-08-13 | **Migração para o realm `citybox-marketplace`** (F1/T1.F): `config.ts` com issuer único e clients `marketplace-app`/`marketplace-provisioning`; `keycloak.service.ts` sem `client_secret` nos grants de usuário; `.env.example` e `docker-compose.prod.yml` no novo contrato; `scripts/setup-keycloak.ts` removido | Envs `KEYCLOAK_CONSUMER_CLIENT_*`, `KEYCLOAK_ADMIN_CLIENT_*` e `KEYCLOAK_ACCEPTED_ISSUERS` deixam de existir; provisionamento do realm passa a ser `pnpm keycloak:sync` |
| 2026-07-27 | Log do `CoreOrdersService`: WARN estruturado com `consumerOrderId` (não ERROR/`core order failed`) | Triagem de espelhamento sem falso incidente |
| 2026-06-26 | Arquivo `AGENTS.md` criado | — |
| 2026-07-26 | **Reescrita completa**: contrato `docs/openapi.yaml` implementado (auth Keycloak, catálogo, carrinho por usuário, checkout, pedidos, conta, engajamento, conteúdo); schema Prisma `consumer` próprio; envelope global; testes node:test; Dockerfile/compose de produção; removidos `/v1/app/*`, carrinho `x-session-id` e schema tenant | Web/iOS/Android integram em modo live; clientes do BFF anterior não existem |
