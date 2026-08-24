# AGENTS.md — Marketplace / Core API

> **Para agentes de IA:** Este arquivo é a fonte de verdade sobre este módulo.
> Leia-o integralmente antes de qualquer ação. Ao modificar código neste módulo,
> atualize as seções relevantes deste arquivo na mesma operação. Nunca remova
> seções — apenas atualize ou adicione.

---

## 1. Identidade do Módulo

| Campo            | Valor                                                |
| ---------------- | ---------------------------------------------------- |
| **Nome**         | `apps/marketplace/api` · pacote `@citybox/marketplace-api` |
| **Tipo**         | API NestJS (backend) · **Core/coração transacional da plataforma** (modular monolith B-03) |
| **Responsável**  | Bruno Lopes — Aplopes Tecnologia                     |
| **Status**       | 🟡 Em desenvolvimento                                |
| **Porta**        | `3101`                                               |
| **Última atualização deste arquivo** | 2026-08-13                       |

**Propósito em uma linha:**
API transacional central do CityBox — domínios compartilhados que **nenhuma
vertical deve duplicar**: catálogo polimórfico, pedidos/subpedidos, carrinho,
checkout/pagamentos, inventário, agendamento, frete, identidade, devices,
tenancy e **outbox de eventos** (publicados para RabbitMQ após commit).

---

## 2. Posição no Monorepo

```
citybox/                          ← raiz do monorepo (Turborepo + pnpm)
├── apps/
│   ├── marketplace/
│   │   ├── api/                  ← VOCÊ ESTÁ AQUI (@citybox/marketplace-api · :3101)
│   │   └── bff/                  ← @citybox/marketplace-bff (:3102) — consumidor público
│   ├── platform/{api,admin}      ← backoffice de operação da plataforma
│   ├── erp/                      ← backoffice do lojista (:3107)
│   ├── workers/                  ← consomem eventos do outbox via RabbitMQ (:3105)
│   ├── realtime-gateway/ · payment/api/ (:3106)
│   └── ../verticals/{food,…}/api ← APIs por vertical (≥3170) chamam o core
├── packages/
│   ├── messaging/                ← @citybox/messaging (createCloudEvent) — USADO no outbox
│   ├── events/ · contracts/ (openapi.json) · ui/ · search/
│   └── tsconfig/                 ← base `nest.json` estendida aqui
└── AGENTS.md                     ← contexto raiz (modelo deste arquivo)
```

**Importante:** esta API tem **dois schemas Prisma próprios** (em `prisma/platform/`
e `prisma/tenant/`), com clientes gerados e **commitados** em `src/generated/platform`
e `src/generated/tenant` — **não** usa o `packages/database`.

**Depende de (infra externa):**
- **PostgreSQL** — dois bancos: **platform** (`citybox_platform`, via `PLATFORM_DATABASE_URL`)
  e **tenant** único single-city Ilhéus (`ilheus_dev`/`DATABASE_URL`/`TENANT_DATABASE_URL`),
  com `multiSchema` por vertical (`public`, `food`, `market`, `beauty`, `clinic`, `services`).
- **Keycloak** — verificação de JWT (JWKS remoto via `jose`) e Admin API (`identity/`).
- **RabbitMQ** — destino dos eventos (publicação feita pelos **workers**, não por esta API).
- **payment-api** (:3106) — checkout/cobranças via cliente HTTP.
- **MinIO** — mídia de catálogo e fotos de usuário.

**Consumido por:**
- `apps/marketplace/bff` (gateway público) · `apps/workers` (projeções) · APIs das **verticais** (catálogo/pedidos).

---

## 3. Stack e Versões

| Tecnologia       | Versão    | Observação                                                       |
| ---------------- | --------- | ---------------------------------------------------------------- |
| Node.js          | ≥ 20      | `@types/node` 22 · projeto **ESM** (`"type": "module"`)          |
| pnpm             | workspace | **Package manager do monorepo** — nunca npm/yarn                 |
| TypeScript       | ~6.0.x    | `tsconfig` estende `packages/tsconfig/nest.json`                 |
| NestJS           | 11.x      | `@nestjs/common`, `core`, `platform-express`, `swagger` (via `catalog:`) |
| Prisma           | 7.8.0     | generator `prisma-client` (novo) → `src/generated/{platform,tenant}`; adapter `@prisma/adapter-pg` + `pg` Pool |
| PostgreSQL       | —         | banco `platform` + banco `tenant` (multiSchema por vertical)     |
| class-validator / class-transformer | 0.14 / 0.5 | DTOs HTTP + `ValidationPipe` global (`whitelist`, `transform`) |
| jose             | 5.9.6     | verificação de JWT do Keycloak (JWKS remoto)                     |
| helmet           | 8.x       | headers de segurança no bootstrap                                |
| minio            | 8.x       | storage de mídia                                                 |
| reflect-metadata / rxjs | 0.2 / 7.8 | runtime NestJS                                            |
| Runner de testes | **node:test nativo** | `node --import tsx --test test/**/*.test.ts` — **NÃO usa Jest** |
| tsx / c8         | 4.x / 10.x | `tsx` executa TS direto (dev/start/teste); `c8` cobertura       |

> ⚠️ **Não é Clean Architecture por módulo** como `apps/admin/api`. Aqui é um
> **modular monolith** mais plano: `controller` fino + `service`, com o controller
> falando direto com o cliente Prisma do tenant. Não introduza camadas
> domain/application/infra sem alinhamento.

---

## 4. Estrutura de Pastas

```
apps/marketplace/api/
├── src/
│   ├── main.ts                   ← bootstrap: prefixo "api", helmet, ValidationPipe, CORS, Swagger /api/v1/docs
│   ├── app.module.ts             ← registra módulos + controllers + PermissionGuard global + AuthMiddleware
│   ├── auth/                     ← AuthMiddleware (Bearer JWT), AuthService (jose/Keycloak + device token),
│   │                               PermissionGuard, StoreScopeGuard, @RequirePermission, @CurrentUser, /v1/auth
│   ├── tenancy/                  ← TenantResolverService.resolve() → cliente Prisma do tenant (single-city)
│   ├── platform/                 ← PlatformModule (token PLATFORM_PRISMA) + hierarchy.controller
│   ├── outbox/                   ← OutboxModule (@Global) + OutboxService.enqueue (createCloudEvent)
│   ├── catalog/                  ← CatalogController (CatalogItem polimórfico C-03)
│   ├── orders/                   ← OrdersController (pedidos + subpedidos A-05)
│   ├── inventory/ · scheduling/ · shipping/   ← controllers transversais (em progresso)
│   ├── devices/                  ← DevicesController (PDV/KDS/impressoras C-09)
│   ├── payments/                 ← PaymentsModule: checkout C-05, cliente payment-api, webhook (HMAC)
│   ├── users/                    ← UsersModule: perfil próprio, store-access, assignments (rate-limit guard)
│   ├── identity/                 ← keycloak-admin.service (provisão de contas)
│   ├── storage/                  ← MinIO (mídia/fotos)
│   ├── common/                   ← inject.ts (InjectService), permissions.ts (RBAC), auth/keycloak-jwt, image-magic-bytes
│   ├── database/                 ← platform.ts (createPlatformClient) + tenant.ts (getTenantClient)
│   └── generated/                ← CLIENTES PRISMA GERADOS (commitados; NÃO editar à mão)
│       ├── platform/             ← 11 models (Organization, Store, DeviceCredential, …)
│       └── tenant/               ← 29 models (Order, CatalogItem, Cart, OutboxEvent, …)
├── prisma/
│   ├── platform/schema.prisma    ← datasource platform (sem @@schema; banco citybox_platform)
│   └── tenant/schema.prisma      ← datasource tenant multiSchema + migrations versionadas
├── test/                         ← *.test.ts (node:test + tsx); inclui *.integration.test.ts
├── scripts/export-openapi.ts     ← gera OpenAPI p/ @citybox/contracts
├── tenant.config.ts              ← config Prisma do tenant (DATABASE_URL) p/ migrate
├── tsconfig.json · tsconfig.docker.json · nest-cli.json
├── Dockerfile · README.md
└── AGENTS.md                      ← ESTE ARQUIVO
```

---

## 5. Restrições Críticas

> ⚠️ Estas restrições causam erros em build/runtime ou quebram a arquitetura se ignoradas.

### 5.1 Package Manager
```
SEMPRE: pnpm --filter @citybox/marketplace-api <script>
NUNCA:  npm install / yarn add
```

### 5.2 ESM — imports com extensão `.js`
```ts
// ✅ CORRETO — projeto é "type": "module"; imports relativos terminam em .js
import { AuthService } from './auth.service.js';
import { PrismaClient } from '../generated/tenant/client.js';
// ❌ ERRADO — sem extensão quebra em runtime (tsx/node)
import { AuthService } from './auth.service';
```

### 5.3 Build/run é `tsc` + `tsx` — NÃO `nest build`/Jest
```
dev/start: tsx (executa TS direto)   ·   build: tsc -p tsconfig.json
lint/typecheck: tsc --noEmit         ·   test: node --import tsx --test test/**/*.test.ts
```
- Testes usam **`node:test` nativo** (`describe`/`it` de `node:test`), não Jest. Sem `*.spec.ts`.

### 5.4 Dois clientes Prisma gerados em `src/generated/`
```ts
// ✅ platform → createPlatformClient() (token DI 'PLATFORM_PRISMA')
// ✅ tenant   → getTenantClient() via TenantResolverService.resolve()
// Importar SEMPRE de src/generated/{platform,tenant}/client.js — NUNCA de "@prisma/client".
// Após mudar schema: pnpm --filter @citybox/marketplace-api db:generate (e db:generate:tenant)
```

### 5.5 Tenancy: toda rota transacional resolve o tenant antes da query
```ts
const { client } = await this.tenants.resolve();   // cliente Prisma do tenant
await client.order.create({ ... });
// Single-city Ilhéus hoje: resolve() retorna sempre o mesmo client (ilheus_dev).
// O tenant usa multiSchema — models verticais ficam em food/market/beauty/clinic/services.
```

### 5.6 Outbox: emitir evento SOMENTE com o mesmo client do tenant
```ts
// Após persistir, enfileira no outbox (tabela OutboxEvent, status PENDING).
await this.outbox.enqueue(client, { type: 'citybox.order.created.v1', storeId, data });
// Quem PUBLICA no RabbitMQ são os WORKERS — esta API só grava o evento. NÃO publicar no request.
```

### 5.7 Autenticação: realm `citybox-marketplace` — issuer único + `azp` (ADR C-16/C-17)
```ts
// AuthMiddleware verifica "Authorization: Bearer <jwt>" em TODA rota /api/v1/* e popula req.user.
//   Exceções (sem auth): GET /health, GET /health/ready, POST /v1/internal/payments/webhooks (HMAC próprio).
// PermissionGuard (APP_GUARD global) só restringe rotas anotadas com @RequirePermission('...').
@RequirePermission('store.catalog.manage')   // libera por permissão; 'platform.admin' passa em tudo
// StoreScopeGuard valida device→loja; aplicar por rota quando houver :storeId.
```
Regras de verificação de token — **invariante 1 do ADR C-16**:
- `common/auth/keycloak-jwt.ts` valida **um único issuer**, vindo de `KEYCLOAK_ISSUER`,
  **sem default e sem lista de fallback**. `KEYCLOAK_ACCEPTED_ISSUERS` foi removida —
  aceitar mais de um issuer é aceitar token de mais de um realm.
- Todo token precisa ter `azp` ∈ `KEYCLOAK_ALLOWED_AZP` (hoje: `marketplace-app`).
  Valida-se **`azp`, não `aud`**: por padrão o Keycloak emite `aud: account`.
- `auth.mapper.ts` lê client roles de `resource_access[KEYCLOAK_CLIENT_ID]` — o client
  vem do env, nunca hardcoded.
- **Divergência do bloco 3 do ADR C-17 (justificada):** a checagem de `azp` está em
  `AuthService.verifyBearer`, não no `AuthGuard`. Esta API autentica quase tudo pelo
  `AuthMiddleware`, que chama o mesmo `verifyBearer`; validar só no guard deixaria a
  rota comum sem a checagem. O guard herda a validação por delegar ao service.

### 5.8 Dev bypass de autenticação (apenas fora de produção)
```
AUTH_DEV_BYPASS=true  +  "Authorization: Bearer dev-admin"  → usuário com role 'platform.admin'.
NUNCA habilitar em produção (o AuthService já bloqueia se NODE_ENV === 'production').
```
A role fake passou de `platform_admin` para `platform.admin`: a realm role global
`platform_admin` do `citybox-dev` deixou de existir (ADR C-16).

### 5.9 Swagger obrigatório em rotas públicas
- Anotar controllers/rotas com `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`.
- UI em `/api/v1/docs` (ligada quando `NODE_ENV !== 'production'` ou `SWAGGER_ENABLED=true`).
- Ao alterar contrato público, **regenerar** `packages/contracts/openapi.json` (`openapi:export`).

---

## 6. Padrões de Código

### 6.1 Controller fino + tenant + outbox (padrão `orders`)
```ts
@ApiTags('orders')
@ApiBearerAuth()
@Controller('v1/orders')
export class OrdersController {
  constructor(
    @InjectService(TenantResolverService) private readonly tenants: TenantResolverService,
    @InjectService(OutboxService) private readonly outbox: OutboxService,
  ) {}

  @Post()
  async create(@Body() body: CreateOrderDto) {
    const { client } = await this.tenants.resolve();
    const order = await client.order.create({ data: { /* … */ }, include: { items: true, subOrders: true } });
    await this.outbox.enqueue(client, { type: 'citybox.order.created.v1', storeId: body.storeId, data: { orderId: order.id } });
    return order;
  }
}
```

### 6.2 Injeção de dependência via `InjectService`
```ts
// common/inject.ts: wrapper fino sobre @Inject (aceita classe, string ou symbol).
@InjectService(AuthService) private readonly auth: AuthService
@InjectService(PLATFORM_PRISMA) private readonly platform: PlatformPrisma   // token string
```

### 6.3 RBAC (`common/permissions.ts`)
```ts
// NÃO há mais mapa "realm role global → permissões". Com um realm por sistema (ADR C-16),
// platform_admin / platform_admin_client / store_staff e as client roles vertical.*.view
// deixaram de existir — estar no realm já é o gate. O realm citybox-marketplace declara
// uma única role de população: `consumer`, sem permissão de backoffice.
//
// resolvePermissions() reúne duas fontes, ambas já pontuadas:
//   1. roles do token com ponto no nome  → viram permissão (ex.: 'platform.admin')
//   2. user.permissions                   → quando a origem é o banco, não o token
@RequirePermission('store.scheduling.manage')   // 'platform.admin' passa em tudo
```

### 6.4 Outbox + CloudEvent
```ts
const event = createCloudEvent({ type, source: 'citybox://core-api', data, storeId }); // @citybox/messaging
await client.outboxEvent.create({ data: { type, payload, status: 'PENDING' } });
```

### 6.5 Testes (node:test + tsx)
```ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
// Ao lado em test/<area>.test.ts. Integração em *.integration.test.ts. Padrão AAA.
```

---

## 7. Variáveis de Ambiente

| Variável                          | Obrigatória | Descrição                                                        |
| --------------------------------- | ----------- | ---------------------------------------------------------------- |
| `PORT`                            | ➖ (3101)   | Porta HTTP                                                        |
| `NODE_ENV`                        | ✅          | `development` / `production` (controla dev bypass e Swagger)     |
| `PLATFORM_DATABASE_URL`           | ✅          | Postgres `citybox_platform` (cliente platform)                   |
| `DATABASE_URL`                    | ✅          | Postgres do tenant — usado por `tenant.config.ts` (migrate)      |
| `TENANT_DATABASE_URL`             | ➖          | URL direta do tenant em runtime (fallback do template)           |
| `TENANT_DATABASE_URL_TEMPLATE`    | ➖          | Template `…/{db}` resolvido p/ `ilheus_dev`                      |
| `KEYCLOAK_REALM`                  | ➖          | `citybox-marketplace` (informativo; o código usa o issuer)        |
| `KEYCLOAK_ISSUER`                 | ✅          | Issuer **único** do realm — sem default, sem fallback            |
| `KEYCLOAK_JWKS_URL`               | ➖          | Override do endpoint de JWKS (rede interna); não relaxa o `iss`  |
| `KEYCLOAK_CLIENT_ID`              | ✅          | `marketplace-app` — de onde se lê `resource_access`              |
| `KEYCLOAK_ALLOWED_AZP`            | ✅          | CSV de `azp` aceitos — hoje `marketplace-app`                    |
| `KEYCLOAK_PROVISIONING_CLIENT_ID` | ➖          | `marketplace-provisioning` (service account do módulo `identity`) |
| `KEYCLOAK_PROVISIONING_CLIENT_SECRET` | ➖      | Secret do service account (dev: `marketplace-provisioning-dev-secret`) |
| `AUTH_DEV_BYPASS`                 | ➖          | `true` libera `Bearer dev-admin` fora de produção                |
| `CORS_ORIGINS`                    | ➖          | Origens permitidas (CSV ou `*`); default inclui `:3107`/`:3000`  |
| `SWAGGER_ENABLED`                 | ➖          | Força liga/desliga do Swagger (default = não-produção)           |
| `PAYMENT_API_BASE_URL`            | ➖          | Default `http://127.0.0.1:3106/api`                              |
| `PAYMENT_API_KEY`                 | ✅ (checkout) | API Key registrada na payment-api                              |
| `PAYMENT_API_TIMEOUT_MS`          | ➖          | Timeout do cliente HTTP de pagamentos                            |
| `PAYMENTS_DEFAULT_MERCHANT_ID`    | ✅*         | Merchant padrão (* ou via `PAYMENTS_STORE_MERCHANT_MAP`)         |
| `PAYMENTS_STORE_MERCHANT_MAP`     | ➖          | JSON `{ "storeUuid": "merchantId" }`                             |
| `PAYMENTS_STORE_SHARE_PERCENT`    | ➖          | Percentual da loja no split (default 95)                         |
| `PAYMENTS_PLATFORM_RECIPIENT_ID`  | ➖          | Recipient da plataforma no split                                 |
| `PAYMENTS_WEBHOOK_SECRET`         | ✅ (webhook) | Segredo HMAC do webhook payment-api → core (rawBody)            |
| `MINIO_ENDPOINT` / `MINIO_PORT` / `MINIO_USE_SSL` | ➖ | Conexão MinIO                                            |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` / `MINIO_USERS_BUCKET` | ➖ | Credenciais + bucket de fotos             |
| `PROFILE_RATE_LIMIT_MAX` / `PROFILE_RATE_LIMIT_WINDOW_MS` | ➖ | Rate limit do update de perfil próprio          |

Referência: `README.md` (sem `.env.example` versionado neste pacote — copiar para `.env`, gitignored).

---

## 8. Scripts

```bash
# A partir da raiz do monorepo
pnpm --filter @citybox/marketplace-api dev          # tsx watch src/main.ts  (:3101)
pnpm --filter @citybox/marketplace-api start        # tsx src/main.ts
pnpm --filter @citybox/marketplace-api build        # tsc -p tsconfig.json → dist/
pnpm --filter @citybox/marketplace-api lint         # tsc --noEmit
pnpm --filter @citybox/marketplace-api typecheck    # tsc --noEmit
pnpm --filter @citybox/marketplace-api test         # node --import tsx --test (node:test)
pnpm --filter @citybox/marketplace-api test:coverage # c8 (lines/funcs 80, branches 70) — escopos auth/tenancy/...

# Prisma (dois schemas)
pnpm --filter @citybox/marketplace-api db:generate          # client platform → src/generated/platform
pnpm --filter @citybox/marketplace-api db:generate:tenant   # client tenant   → src/generated/tenant
pnpm --filter @citybox/marketplace-api db:migrate:tenant:dev     # migrate dev   (tenant.config.ts / DATABASE_URL)
pnpm --filter @citybox/marketplace-api db:migrate:tenant:deploy  # migrate deploy
pnpm --filter @citybox/marketplace-api db:migrate:tenant:status  # status

# Contrato público
pnpm --filter @citybox/marketplace-api openapi:export   # → @citybox/contracts/openapi.json

# Endpoints úteis
# Swagger: http://localhost:3101/api/v1/docs   ·   Health: http://localhost:3101/api/health
```

Prefixo global de rotas: **`/api`** (definido em `main.ts`).

---

## 9. Módulos Implementados

> Atualize esta seção sempre que um módulo/endpoint for adicionado ou alterado.
> Rotas transacionais ficam sob `/api/v1/*` e passam pelo `AuthMiddleware`.

| Módulo / pasta | Rota base / responsabilidade                          | Estado          |
| -------------- | ----------------------------------------------------- | --------------- |
| `auth`         | `/v1/auth` · verificação JWT (Keycloak + device token), `/me`, RBAC | ✅ implementado |
| `tenancy`      | resolução do cliente Prisma do tenant (single-city)   | ✅ implementado |
| `platform`     | `hierarchy.controller` (platform-scoped, `@RequirePermission('platform.admin')`) | ✅ implementado |
| `outbox`       | `OutboxService.enqueue` → tabela `OutboxEvent` (PENDING) | ✅ implementado |
| `catalog`      | `/v1/catalog` · CatalogItem polimórfico (C-03)        | ✅ implementado |
| `orders`       | `/v1/orders` · pedidos + subpedidos (A-05) + outbox   | ✅ implementado |
| `payments`     | `/v1/...` checkout (C-05), cliente payment-api, webhook HMAC (`/v1/internal/payments/webhooks`) | ✅ implementado |
| `users`        | perfil próprio, store-access, assignments (rate limit) | ✅ implementado |
| `identity`     | `keycloak-admin.service` (provisão de contas C-07)    | ✅ implementado |
| `inventory`    | `/v1/inventory` · estoque transversal                 | 🟡 em progresso |
| `scheduling`   | `/v1/scheduling` · agendamentos base                  | 🟡 em progresso |
| `shipping`     | `/v1/shipping` · frete por loja (C-06)                | 🟡 em progresso |
| `devices`      | `/v1/devices` · PDV/KDS/impressoras (C-09)            | 🟡 em progresso |
| `storage`      | MinIO — mídia de catálogo / fotos de usuário          | 🟡 em progresso |
| `health`       | `GET /api/health` e `/api/health/ready` (públicos)    | ✅ implementado |

### Modelos Prisma — **platform** (`prisma/platform/schema.prisma`, 11 models)
`PlatformEnabledVertical`, `Organization`, `Store`, `StoreUserAssignment`,
`DeviceCredential`, `PushDeviceToken`, `NotificationLog`, `AdminAuditLog`,
`SaaSPlan`, `OrganizationSubscription`, `PlatformUser`.

### Modelos Prisma — **tenant** (`prisma/tenant/schema.prisma`, 29 models · multiSchema)
Núcleo `public`: `Order`, `SubOrder`, `OrderItem`, `Cart`, `CartItem`,
`CatalogItem`, `InventoryStock`, `InventoryReservation`, `ShippingRule`,
`MarketplaceStore`/`MarketplaceOffer`/`MarketplaceAvailability`,
`OutboxEvent`, `ProcessedEvent`, `ProjectionReadModel`, `StoreSettings`,
`StoreRole`, `StoreUserRole`. Extensões por vertical (`food`/`market`/`beauty`/`clinic`/`services`):
`FoodItem`, `RetailItem`, `ClinicItem`/`ClinicProfessional`/`ClinicScheduleSlot`,
`BeautyServiceItem`/`BeautyProfessional`/`BeautyScheduleSlot`,
`ServicesServiceItem`/`ServicesProfessional`/`ServicesScheduleSlot`.

---

## 10. Decisões de Arquitetura

> Registre aqui o raciocínio por trás de decisões não-óbvias.

| Data | Decisão                                                          | Motivo                                                           |
| ---- | --------------------------------------------------------------- | --------------------------------------------------------------- |
| —    | Modular monolith plano (controller + service), não Clean Arch por módulo | Core transacional concentrado; menos cerimônia que `platform/api` |
| —    | Dois schemas/clients Prisma próprios (platform + tenant)        | Separar dados de plataforma do estado de negócio do tenant       |
| —    | Tenant com `multiSchema` por vertical (C-15)                    | Schema da vertical criado lazily no tenant único (single-city)   |
| —    | Outbox grava evento; **workers** publicam no RabbitMQ (B-09)    | Desacopla request HTTP da entrega; evento só após commit         |
| —    | `AuthMiddleware` para autenticar + `PermissionGuard` p/ autorizar | Auth em toda `/v1/*`; autorização declarativa por permissão      |
| —    | Device token (`device:`) verificado em `DeviceCredential`        | PDV/KDS autenticam sem Keycloak; escopo de loja via StoreScopeGuard |
| —    | ESM + `tsx` (sem `nest build`) e `node:test` (sem Jest)         | Execução TS direta e runner nativo; build final com `tsc`        |
| —    | Cliente HTTP p/ payment-api + webhook HMAC (rawBody)            | Checkout multiloja (split) desacoplado; webhook fora do AuthMiddleware |
| 2026-08-13 | **Realm próprio `citybox-marketplace`** (ADR C-16), client `marketplace-app` (público + PKCE) | Realm B2C isolado dos realms de backoffice; e-mail deixa de colidir entre sistemas (D1), sessão não vaza (D2) |
| 2026-08-13 | Checagem de `azp` em `AuthService.verifyBearer`, não no `AuthGuard` | O `AuthMiddleware` autentica quase toda `/api/v1/*` pelo mesmo método; validar só no guard deixaria a rota comum descoberta. Divergência do bloco 3 do ADR C-17, registrada aqui como manda a T4.5 |
| 2026-08-13 | `resolvePermissions` sem mapa de realm role global        | `platform_admin`/`store_staff`/`vertical.*.view` sumiram com o realm compartilhado; permissão vem de role pontuada ou de `user.permissions` |
| 2026-08-13 | Módulo `identity` usa `marketplace-provisioning`, não `citybox-core-admin` | Menor privilégio: `manage-users` limitado ao realm do próprio produto (defeito D3) |

---

## 11. Contexto para a IA

### O que NÃO fazer neste módulo
- Não importar de `@prisma/client` — usar os clientes gerados em `src/generated/{platform,tenant}/client.js`.
- Não usar o `packages/database` aqui — esta API tem schemas Prisma próprios.
- Não esquecer a extensão `.js` em imports relativos (projeto ESM).
- Não usar Jest nem criar `*.spec.ts` — testes são `node:test` em `test/*.test.ts`.
- Não publicar evento no RabbitMQ dentro do request — só gravar no outbox (workers publicam).
- Não consultar/gravar o tenant sem `TenantResolverService.resolve()` (resolve antes da query).
- Não introduzir camadas domain/application/infra por módulo sem alinhamento (não é o padrão daqui).
- Não habilitar `AUTH_DEV_BYPASS` em produção.
- Não reintroduzir lista de issuers aceitos nem default de `KEYCLOAK_ISSUER`/`KEYCLOAK_CLIENT_ID` — issuer é único e vem do env (ADR C-16, invariante 1).
- Não usar `platform_admin`, `store_staff`, `vertical.*.view`, `citybox-backoffice`, `citybox-core-admin` nem o realm `citybox-dev` — todos removidos pelo ADR C-16.
- Não criar pacote/helper compartilhado de auth: a duplicação entre apps é decisão do ADR C-17. O molde canônico é o próprio ADR.
- Não expor rota pública sem `@ApiTags`/`@ApiBearerAuth` e sem regenerar `openapi.json` ao mudar contrato.
- Não instalar pacotes com npm/yarn — usar pnpm no monorepo.

### Ao criar um novo **endpoint/controller**
1. `src/<area>/<area>.controller.ts` fino: `@Controller('v1/<area>')`, `@ApiTags`, `@ApiBearerAuth`.
2. Injetar `TenantResolverService` (e `OutboxService` se emitir evento) via `@InjectService`.
3. Resolver o tenant e operar pelo cliente Prisma; emitir evento no outbox **após** persistir.
4. Anotar com `@RequirePermission('...')` quando precisar de autorização; `StoreScopeGuard` se houver `:storeId`.
5. Registrar o controller em `app.module.ts` (ou no `*.module.ts` correspondente).
6. Cobrir com teste em `test/<area>.test.ts` e atualizar as seções 4 e 9 deste arquivo.

### Ao alterar schema Prisma
1. Editar `prisma/platform/schema.prisma` ou `prisma/tenant/schema.prisma` (tenant exige `@@schema(...)`).
2. Criar migration do tenant (`db:migrate:tenant:dev`) e **regenerar** o cliente (`db:generate` / `db:generate:tenant`).
3. Acionar `database-reviewer` (gate obrigatório ao tocar migration).
4. Atualizar a lista de modelos na seção 9.

### Fluxo de trabalho esperado
1. Resolver tenant/platform → operar via Prisma gerado → enfileirar evento no outbox.
2. Rodar `lint`/`typecheck` (`tsc --noEmit`) + `test` (e `test:coverage` nos escopos cobertos).
3. Regenerar `openapi.json` se mudou contrato público.
4. Atualizar este `AGENTS.md`.

---

## 12. Histórico de Mudanças Estruturais

> Não é changelog de features — registra mudanças que afetam o contexto da IA.

| Data       | Mudança                                             | Impacto                          |
| ---------- | --------------------------------------------------- | -------------------------------- |
| 2026-08-13 | **Migração para o realm `citybox-marketplace`** (F1/T1.F do plano de realm por sistema): `keycloak-jwt.ts` com issuer único + `allowedAuthorizedParties()`; `auth.mapper.ts` com `clientId` por parâmetro; `azp` validado em `verifyBearer`; `common/permissions.ts` sem mapa de realm role; `identity` com `marketplace-provisioning`; `docker-compose.prod.yml` no novo contrato de env | Envs `KEYCLOAK_ADMIN_CLIENT_*` e `KEYCLOAK_ACCEPTED_ISSUERS` deixam de existir; token de outro realm/client é 401 |
| 2026-06-26 | Arquivo `AGENTS.md` criado                           | —                                |
| —          | —                                                   | —                                |
