# AGENTS.md — Beautiful · api

> **Para agentes de IA:** Fonte de verdade deste módulo. Leia antes de qualquer ação.
> Ao modificar código, atualize as seções relevantes na mesma operação. Nunca remova
> seções — apenas atualize ou adicione.

---

## 1. Identidade do Módulo

| Campo | Valor |
| ----- | ----- |
| **Nome** | `apps/verticals/beautiful/api` · `@citybox/beautiful-api` |
| **Tipo** | API NestJS · Clean Architecture |
| **Responsável** | Bruno Lopes — Aplopes Tecnologia |
| **Status** | 🟢 Membership + store-setup (`citybox.store.*` + M2M owner) + **financeiro ledger** |
| **Porta** | `3173` |
| **Última atualização deste arquivo** | 2026-08-20 `StoreSettings.themeId` (temas por loja) |

**Propósito em uma linha:**
Backend da vertical **Beautiful** — serviços de beleza, barbearia e estética desenvolvido de forma gradual módulo a módulo.

> **Referência arquitetural:** padrão de [`apps/verticals/food/api`](../../food/AGENTS.md)
> e molde `_example` de [`apps/erp/api`](../../../erp/api/AGENTS.md).

---

## 2. Posição no Monorepo

```
citybox/
└── apps/verticals/beautiful/
    ├── web/   ← @citybox/beautiful-web (:3115)
    └── api/   ← VOCÊ ESTÁ AQUI (:3173)
```

**Depende de:** PostgreSQL (`DATABASE_URL`, schema `beautiful`); RabbitMQ (`RABBITMQ_URL`) para provisionar lojas do admin; Keycloak Admin API (`KEYCLOAK_ADMIN_*`) para OWNER/invite.

**Consumido por:** `beautiful-web` **somente via BFF** (`BEAUTIFUL_API_URL` → server-side); `admin-api` M2M (`BEAUTIFUL_API_URL`) para find/reset do responsável. Health/Swagger expostos para ops/dev.

---

## 3. Stack e Versões

| Tecnologia | Versão | Observação |
| ---------- | ------ | ---------- |
| pnpm | workspace | Nunca npm/yarn |
| TypeScript | ~5.7 | |
| NestJS | 11.x (`catalog:`) | |
| Prisma | 7.8.0 | client → `generated/prisma/`; adapter `@prisma/adapter-pg` |
| Zod | ^4 | domínio (`error.issues`) |
| class-validator / transformer | 0.14 / 0.5 | DTOs HTTP |
| Swagger | catalog | `/api/v1/docs` |
| jose | 5.x | JWT Keycloak via JWKS |
| `@citybox/messaging` | workspace | consumer `beautiful.store-setup` no processo HTTP |
| `@citybox/nest-common` | workspace | `KeycloakProvisioningService` (invite + OWNER) |
| Jest | 30.x | `*.spec.ts` |
| Prettier / ESLint | 3.4 / 9.18 | Padronizado com `imoveis-api` |

**Ausente nesta fase:** —  
**CASL:** `PermissionGuard` (APP_GUARD após StoreScope) + `@RequirePermission` / `@RequireAnyPermission`; package `@citybox/beautiful-permissions`; `resolveStorePermissions` / `effectiveStorePermissions` (array vazio → preset do papel).

---

## 4. Estrutura de Pastas

```
apps/verticals/beautiful/api/
├── src/
│   ├── main.ts                 ← ValidationPipe, prefix "api", Swagger, :3173
│   ├── app.module.ts           ← PrismaModule + MembersModule + … + AuthGuard + StoreScopeGuard
│   ├── modules/
│   │   ├── _example/           ← MOLDE (*.gitkeep) — NÃO é módulo real; ver README.md
│   │   ├── members/            ← Membership + equipe operacional (Member, MemberService, MemberWorkInterval)
│   │   ├── services/           ← Módulo Serviços (domínio, aplicação, infra Prisma/HTTP)
│   │   ├── products/           ← Módulo Produtos / Insumos (domínio, aplicação, infra Prisma/HTTP)
│   │   ├── clients/            ← Módulo Clientes lean (nome + telefone; sem FKs nesta fase)
│   │   ├── appointments/       ← Módulo Agenda (Appointment + AppointmentService; professionalId = Member.id)
│   │   ├── financial/          ← Ledger: accounts + categories + entries (sem comissões)
│   │   └── store-setup/        ← consumer + seed OWNER + seed financeiro lean
│   └── shared/
│       ├── core/               ← Entity, IUseCase, AppError*, zod-utils
│       ├── domain/
│       │   ├── validators/
│       │   └── work-schedule/  ← tipos + Zod da grade semanal (shared; settings + members)
│       └── infra/
│           ├── prisma/         ← PrismaModule + PrismaService
│           ├── keycloak/       ← keycloak-jwt (verifyKeycloakJwt via JWKS)
│           ├── storage/        ← MinIO logo
│           └── http/           ← health (@Public) + AuthGuard + @StoreId/@CurrentUser + AppExceptionFilter
├── prisma/
│   ├── schema.prisma           ← schemas = ["beautiful"]; + FinancialAccount/Category/Entry + enums
│   └── migrations/             ← … + 20260812175950_add_financial_ledger
├── generated/prisma/           ← gitignored — pnpm db:generate
└── AGENTS.md
```

### 4.1 Anatomia de um módulo

```
modules/<modulo>/
├── <modulo>.module.ts
├── domain/     entities/ · errors/ · factories/ · repositories/ · validators/
├── application/ dtos/ · types/ · use-cases/<acao>/<acao>.use-case.ts(+.spec.ts)
├── infrastructure/ database/prisma-*.ts · http/routes/<acao>/{route,dto}.ts · shared/*.presenter.ts
└── tests/      in-memory-*.repository.ts
```

Regra: `infrastructure → application → domain` (nunca o inverso).

---

## 5. Restrições Críticas

### 5.1 Package Manager
```
SEMPRE: pnpm --filter @citybox/beautiful-api <script>
NUNCA:  npm / yarn
```

### 5.2 Prisma — `generated/prisma/`, schema `beautiful`
```ts
import { PrismaClient } from '...generated/prisma/client'; // NÃO @prisma/client
// Models: @@schema("beautiful") + @@map("snake_case") + @id @default(uuid())
```

### 5.3 AuthGuard + PlatformAdminGuard + StoreScopeGuard + store-scoping
```ts
// APP_GUARD AuthGuard → PlatformAdminGuard → StoreScopeGuard.
@Public()                // libera (health).
@SkipStoreScope()        // members/me, members/roles, M2M platform/owner*.
@RequirePlatformAdmin()  // M2M admin → find/reset OWNER.
@StoreId()               // header X-Store-Id obrigatório nas rotas de negócio.
// Dev: AUTH_DEV_BYPASS=true + "Bearer dev-admin" (fora de produção).
// azp === KEYCLOAK_ADMIN_CLIENT_ID promove platform_admin (M2M).
AuthGuard → PlatformAdminGuard → StoreScopeGuard → PermissionGuard
// Platform M2M: @RequirePlatformAdmin
// Domínio: @RequirePermission(action, subject) do catálogo Beautiful
```

### 5.3c Consumer store-setup no processo HTTP
`StorePlatformConsumer` (fila `beautiful.store-setup`) sobe com a API.
`BEAUTIFUL_WORKER_ENABLED=false` desliga só o consumer. Sem `RABBITMQ_URL` a API sobe
mas **não** provisiona lojas do admin.

### 5.3b CORS
Sem `CORS_ORIGINS` → **sem** `enableCors`. O browser não deve chamar `:3173` direto;
só o BFF Next (`/api/proxy/beautiful`). Preencher `CORS_ORIGINS` só em exceção.

### 5.4 Camadas + controllers finos
- `domain`/`application` sem Nest/Prisma/Express.
- Use case depende da **interface** do repositório (token).
- `*.route.ts`: DTO → use case → presenter.

### 5.5 Erros AppError
Subclasses com `{ internalMessage, externalMessage, context }`.
Filtro mapeia pelo sufixo: `*NotFound`→404, `*Taken`/`*Duplicate`→409, `ValidatorDomainError`→422, etc.

### 5.6 Migrations só via Prisma
```bash
pnpm --filter @citybox/beautiful-api db:migrate:dev
# PROIBIDO escrever SQL em prisma/migrations/ à mão
```

### 5.7 `start:prod`
`node dist/src/main` (build emite em `dist/src/`).

---

## 6. Padrões de Código

- Use case: `@Injectable() implements IUseCase<In, Out>`.
- Entidade: `extends Entity<Props>`, `create()`/`with()`, `validate()` via Zod.
- Repositório: abstract class (token) + impl Prisma + in-memory para testes.
- Validação dupla: class-validator (HTTP) + Zod (domínio).
- Formatação e Linter: Prettier + ESLint sincronizados com a `imoveis-api`.

---

## 7. Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
| -------- | ----------- | --------- |
| `PORT` | ➖ (3173) | HTTP |
| `DATABASE_URL` | ✅ | Postgres com `?schema=beautiful` |
| `CORS_ORIGINS` | ➖ | **Opcional.** CSV de origins para `enableCors`. Vazio/ausente = sem CORS |
| `KEYCLOAK_ISSUER` | ✅ (auth) | Issuer único do realm `citybox-beautiful` (JWKS) |
| `KEYCLOAK_ADMIN_CLIENT_ID` | ✅ (invite) | Client M2M p/ `KeycloakProvisioningService` |
| `KEYCLOAK_ADMIN_CLIENT_SECRET` | ✅ (invite) | Secret do client admin |
| `KEYCLOAK_BACKOFFICE_CLIENT_ID` | ➖ | Default `citybox-backoffice` (role `vertical.beautiful.view`) |
| `AUTH_DEV_BYPASS` | ➖ | `true` libera `Bearer dev-admin` fora de produção (curl/Swagger; web não usa) |
| `SEED_STORE_ID` | ➖ | Só p/ `db:seed` local; sem isso o seed não cria loja (preferir admin) |
| `SEED_OWNER_KEYCLOAK_SUB` | ➖ | Sub do OWNER no seed (`db:seed`) |
| `SEED_OWNER_USERNAME` / `EMAIL` / `FIRST_NAME` / `LAST_NAME` | ➖ | Dados do OWNER seed |
| `SEED_ORGANIZATION_NAME` / `SEED_STORE_NAME` | ➖ | Nomes org/loja no seed |
| `RABBITMQ_URL` | ✅ p/ admin | Consumer `beautiful.store-setup` |
| `RABBITMQ_EXCHANGE` / `RABBITMQ_DLX` | ➖ | Default `citybox.events` / `citybox.dlx` |
| `BEAUTIFUL_WORKER_ENABLED` | ➖ | `false` desliga só o consumer store-setup |

Ver `.env.example`.

---

## 8. Scripts

```bash
pnpm --filter @citybox/beautiful-api dev
pnpm --filter @citybox/beautiful-api build
pnpm --filter @citybox/beautiful-api start:prod
pnpm --filter @citybox/beautiful-api lint
pnpm --filter @citybox/beautiful-api format
pnpm --filter @citybox/beautiful-api typecheck
pnpm --filter @citybox/beautiful-api test
pnpm --filter @citybox/beautiful-api db:generate
pnpm --filter @citybox/beautiful-api db:migrate:dev
pnpm --filter @citybox/beautiful-api db:migrate:deploy
pnpm --filter @citybox/beautiful-api db:seed
```

Swagger: `http://localhost:3173/api/v1/docs` · Health: `http://localhost:3173/api/health`

---

## 9. Módulos e Endpoints

| Recurso | Rota | Notas |
| ------- | ---- | ----- |
| **Members** | `GET /api/v1/members/me` | Descoberta de acesso (`@SkipStoreScope`) — `{ member, organization, stores[] }` |
| | `GET /api/v1/members/roles` | Catálogo operacional `profissional` \| `recepcao` \| `gerente` |
| | `GET /api/v1/members` | Lista membros da loja (`search` / `status` / `schedulable` / `role`) — inclui `serviceIds`/`services` |
| | `POST /api/v1/members` | Convite Keycloak (`vertical.beautiful.view` + `store_staff`) + Member/StoreMember; body opcional `phone`; serviços/grade via PATCH depois |
| | `GET /api/v1/members/:id` | Detalhe com `services` + **`week`** (grade semanal) |
| | `PATCH /api/v1/members/:id` | Atualiza perfil; `serviceIds` omitido=mantém, `[]`=limpa; `week` omitido=mantém, presente=replace atômico |
| | `POST /api/v1/members/:id/reset-password` | Gera senha provisória Keycloak (`username` + `provisionalPassword`); `update` Team |
| | `GET /api/v1/members/work-schedules` | Lista grades em lote (`memberIds` CSV; `schedulable` default true) — usado pela Agenda dia |
| | `GET /api/v1/members/:id/work-schedule` | Grade semanal (`week.mon…sun` com intervalos `HH:mm`); dia vazio = folga |
| | `PUT /api/v1/members/:id/work-schedule` | Replace atômico da grade (HH:mm, início antes do fim, sem overlap, máx. 5/dia) |
| | `GET /api/v1/platform/stores/:storeId/owner` | M2M admin (`@RequirePlatformAdmin`) — Member OWNER no shape `VerticalMember` |
| | `POST /api/v1/platform/stores/:storeId/owner/reset-password` | M2M — senha provisória Keycloak (`username` + `provisionalPassword`) |
| `store-setup` | consumer fila `beautiful.store-setup` (`citybox.store.#`) | `HANDLED_VERTICALS=['Beautiful']`; `created`/`updated` → Org+Store+OWNER (sem senha) + **seed financeiro lean** + callback `provisioning.completed`/`failed`; dedupe `ProcessedEvent` |
| | `POST /api/v1/platform/stores/:storeId/provision` | M2M — provision on demand (org+OWNER+senha); consumer `store.created` não cria mais |
| `store-setup` | consumer fila `beautiful.store-setup` (`citybox.store.#`) | `HANDLED_VERTICALS=['Beautiful']`; `created` ignorado; `updated` só se org já existir; callbacks `provisioning.*` só quando aplicável; dedupe `ProcessedEvent` |
| **Health** | `GET /api/health`, `GET /api/health/ready` | `@Public()` — sem JWT |
| **Serviços** | `POST /api/v1/services` | Cadastra serviço (não aceita `professionalIds` na escrita) |
| | `GET /api/v1/services` | Lista serviços (`search`, `category`, `active`, `page`, `perPage`); envelope `{ data, meta, stats }`; inclui `professionalIds` (somente leitura) |
| | `GET /api/v1/services/:id` | Detalhes; inclui `professionalIds` (somente leitura) |
| | `PATCH /api/v1/services/:id` | Atualiza dados do serviço (não altera vínculos M2M) |
| | `PATCH /api/v1/services/:id/toggle-active` | Alterna status ativo/inativo |
| | `DELETE /api/v1/services/:id` | Remove serviço (cascade nos vínculos) |
| **Produtos / Insumos** | `POST /api/v1/products` | Cadastra produto/insumo de consumo no estoque |
| | `GET /api/v1/products` | Lista produtos do estoque (filtros: `search`, `active`, `page`, `perPage`); envelope `{ data, meta, stats }` |
| | `GET /api/v1/products/:id` | Detalhes do produto por ID |
| | `PATCH /api/v1/products/:id` | Atualiza cadastro de produto/insumo |
| | `PATCH /api/v1/products/:id/toggle-active` | Alterna status ativo/inativo no estoque |
| | `DELETE /api/v1/products/:id` | Remove produto do estoque |
| | `POST /api/v1/products/:id/stock-movements` | Entrada/saída (`type` `IN`\|`OUT`, `quantity`, `note?`); ajusta `stockQuantity`; **422** estoque insuficiente |
| | `GET /api/v1/products/:id/stock-movements` | Histórico de movimentações do produto |
| **Clientes** | `POST /api/v1/clients` | Cadastra cliente lean (`name`, `phone`; `categoryId` opcional) |
| | `GET /api/v1/clients` | Lista clientes (filtro `search` em nome/telefone); inclui `categoryName` |
| | `GET /api/v1/clients/:id` | Detalhes do cliente |
| | `PATCH /api/v1/clients/:id` | Atualiza nome/telefone/`categoryId` (`null` remove categoria) |
| | `DELETE /api/v1/clients/:id` | Remove cliente |
| **Categorias de clientes** | `POST /api/v1/client-categories` | Cria categoria (`name`, `colorId?` hex `#rrggbb`) |
| | `GET /api/v1/client-categories` | Lista categorias (`colorId`, `isProtected`) |
| | `PATCH /api/v1/client-categories/:id` | Atualiza nome/cor |
| | `DELETE /api/v1/client-categories/:id` | Remove; **409** se `isProtected` |
| **Categorias de agendamento** | `POST /api/v1/appointment-categories` | Cria categoria (`name`, `color?` hex `#rrggbb`) |
| | `GET /api/v1/appointment-categories` | Lista categorias |
| | `PATCH /api/v1/appointment-categories/:id` | Atualiza nome/cor |
| | `DELETE /api/v1/appointment-categories/:id` | Remove; **409** se agendamentos vinculados |
| **Configurações** | `GET /api/v1/settings/store` | Lê (ou cria default) `StoreSettings` (identidade, `themeId`, contatos, endereço, `logoUrl`) |
| | `PATCH /api/v1/settings/store` | Atualiza configuração do estabelecimento (`themeId` no catálogo `purple`/`rose`/`emerald`/`sapphire`/`amber`/`burgundy`/`barber`/`coral`; default `purple`) |
| | `GET /api/v1/settings/store/work-schedule` | Grade semanal de funcionamento (`week.mon…sun`); dia vazio = fechado |
| | `PUT /api/v1/settings/store/work-schedule` | Replace atômico da grade da unidade (mesmas regras do profissional: HH:mm, início antes do fim, sem overlap, máx. 5/dia) |
| | `POST/GET/DELETE /api/v1/settings/store/logo` | Upload/download/remove logo (MinIO `{storeId}/{slug}/logo/logo.{ext}`, multipart `file`; exige `X-Store-Id`) |
| **Agenda (Appointments)** | `GET /api/v1/appointments` | Lista no período; inclui `categoryId`/`categoryName`/`categoryColor` quando houver |
| | `POST /api/v1/appointments` | Cria agendamento; **gera lançamento financeiro imediato** (`source=appointment_complete`, receita `pending`, `dueDate` na data marcada) |
| | `PATCH /api/v1/appointments/:id` | Edita/remarca; atualiza valor/vencimento/descrição no lançamento financeiro pendente |
| | `PATCH /api/v1/appointments/:id/status` | Atualiza só o status (`SCHEDULED`…`NO_SHOW`) — cancelar = `CANCELLED` **cancela o lançamento financeiro associado** (`status=cancelled`); status `COMPLETED` não pode ser revertido |
| **Financeiro — contas** | `GET/POST /api/v1/financial/accounts` | Contas (caixa); `includeInactive` no GET |
| | `PUT/DELETE /api/v1/financial/accounts/:id` | 204 no delete |
| **Financeiro — categorias** | `GET/POST /api/v1/financial/categories` | `kind=income\|expense`; cor opcional |
| | `PUT/DELETE /api/v1/financial/categories/:id` | 204 no delete |
| **Financeiro — lançamentos** | `GET/POST /api/v1/financial/entries` | Listagem server-side + criar (recorrência opcional) |
| | `GET /api/v1/financial/entries/stats` | Totais income/expense/balance em centavos |
| | `GET /api/v1/financial/entries/by-payment-method` | Agrega liquidados por meio |
| | `GET/PUT/DELETE /api/v1/financial/entries/:id` | PUT só `manual`+`pending` |
| | `PATCH …/entries/:id/receive\|pay\|cancel` | Receber receita / pagar despesa / desfazer liquidação |
| | `PATCH …/entries/recurrence/:groupId` | Escopo `this`\|`this_and_future`\|`all` |

**Permissão financeiro (todas as rotas acima):** `@RequirePermission('access', 'Financial')` + `X-Store-Id`. Sem motor de comissões nesta vertical.

**Regras de negócio (`financial`):**
- Contas: `type` default `checking`; listagem omite inativas salvo `includeInactive=true`
- Categorias: `kind` `income`|`expense`
- Lançamentos: `source` `manual`|`appointment_complete`; status `pending`|`paid`|`received`|`cancelled`; FKs `clientId`/`appointmentId` (não patient/budget)
- **Conclusão de agendamento:** `PATCH …/appointments/:id/status` → `COMPLETED` dispara `GenerateFinancialEntryOnAppointmentCompleteService` — receita `pending`, `valueCents` = `round(totalPrice*100)`, dueDate = dia civil do `startAt`, categoria income preferindo seed **"Serviços"**; idempotente via `existsByAppointmentId` / `@@unique([storeId, appointmentId])`
- Receive só `income`+`pending`; Pay só `expense`+`pending`; PUT só `manual`+`pending`; DELETE hard delete (sem bloqueio de comissão)
- Cancel desfaz liquidação → `pending` (não soft-delete)
- Valores em **centavos** (`valueCents` / `paidValueCents`)
- Seed store-setup: conta **Caixa** + categorias lean (receita/despesa) via `SeedFinancialDefaultsService`

---

## 10. Decisões de Arquitetura

| Decisão | Motivo |
| -------- | ------ |
| AuthGuard food-style + PermissionGuard CASL | Etapa 4 Fase A + Fase G — `@citybox/beautiful-permissions` |
| **StoreScopeGuard + Membership** | Fase E — `Organization`/`Store`/`Member`/`StoreMember`; correlaciona JWT `sub` ↔ `X-Store-Id` |
| **Professional unificado em Member** | Sem tabela `Professional`; M2M `MemberService` + grade `MemberWorkInterval`; papéis agendáveis (`profissional`) via `SCHEDULABLE_STORE_ROLES`; agenda usa `Member.id` como `professionalId` no payload |
| **`@citybox/nest-common`** | `POST /v1/members` provisiona Keycloak + Member na mesma operação |
| **CORS off por padrão** | Browser → BFF same-origin; Nest só server-to-server |
| **Store-scoping anti-IDOR** (`X-Store-Id`) | Members + Settings + Services + Products + Clients + ClientCategories + Appointments + AppointmentCategories filtram por `storeId` em entity/repo/use case/rota |
| Schema Prisma `beautiful` | Vertical lazy no tenant (ADR C-15) |
| Módulo Serviços Desacoplado | Entidade `ServiceEntity`, `ServiceZodValidator`, 6 Casos de Uso e Repositório Prisma com busca por categoria e filtros |
| **M2M Member ↔ Service** | Tabela `member_services` (só FKs); **escrita** via `Member.serviceIds` (create/update member); `Service.professionalIds` (Member.id) é projeção **somente leitura** nos GETs |
| Módulo Produtos / Insumos Desacoplado | Entidade `ProductEntity`, `ProductZodValidator`, 6 Casos de Uso e Repositório Prisma focado em insumos para uso interno (`sku`, `unitOfMeasure`, `stockQuantity`, `minStockQuantity`, `costPrice`), sem categorias ou preço de venda |
| **Movimentação de estoque lean** | Model `StockMovement` + `POST/GET …/products/:id/stock-movements`; ajusta `stockQuantity` (sem custo médio); `InsufficientStockError` em saída maior que saldo |
| **Client lean + anti-IDOR** | Model/API `name` + `phone` + `categoryId?` (+ timestamps); **`storeId` obrigatório** (header `X-Store-Id` → `@StoreId()`); repo `findById/findAll/delete(storeId, …)`; sem `active`/toggle. **Telefone não é único**. `ClientNotFoundError` extends `DomainError` (404 real) |
| **StoreSettings por loja + logo MinIO** | Um `StoreSettings` por `storeId` (`@@unique`); `getOrCreateDefault(storeId)` + upsert por `storeId`; **`themeId`** (catálogo curado, default `purple`); logo em `{storeId}/{slug}/logo/logo.{ext}` via `StoreObjectKeyPolicy.logoKey(storeId, name, mime)` (bucket `citybox-beautiful`); chave efetiva em `logoObjectKey` (renomear a loja só afeta o próximo upload) |
| **Categorias de clientes** | CRUD store-scoped (`storeId` + `@StoreId()`); `colorId` hex `#rrggbb` (`VarChar(7)`) + `isProtected`; `findByName(storeId, name)`; delete protegido **409**; unique `(storeId, name)` |
| **Categorias de agendamento** | CRUD store-scoped (`storeId` + `@StoreId()`); `color` hex `#rrggbb`; `findByName(storeId, name)`; unique `(storeId, name)`; `Appointment.categoryId` opcional; delete **409** se em uso |
| **Agenda = Appointment + AppointmentService** | Join operacional (N linhas membro+serviço por agendamento); distinto do M2M de catálogo. POST com ≥1 item; **`clientId` XOR `newClient`** (`newClient` herda `storeId`); listagem `from`/`to`; **anti-overlap + grade** store-scoped (`hasOverlap(storeId,…)`); create/update validam client/membros agendáveis/services/category da mesma loja (`MemberRepository.findSchedulableByIds` + `findWorkIntervals`); **PATCH `/:id`** edita horário/serviços/obs. (cliente imutável); cancelar via PATCH status `CANCELLED`; **`COMPLETED` bloqueado** (edit/status). Wall-clock local. Preços `Float`. Campo HTTP `professionalId` = `Member.id` |
| **Ledger financeiro (sem comissões)** | Models `FinancialAccount`/`FinancialCategory`/`FinancialEntry`; módulo `financial` (`v1/financial/*`); FKs `clientId`/`appointmentId`; CASL só `access` Financial nesta fase; seed lean no store-setup; **COMPLETED → lançamento** via `GenerateFinancialEntryOnAppointmentCompleteService` |
| **Horário do membro agendável = intervalos por weekday** | Model `MemberWorkInterval` + enum `Weekday` (`mon`…`sun`); N faixas/dia em `HH:mm` (almoço = buraco entre intervalos). Folgas pontuais ficam fora (Agenda). API: GET/PUT `/v1/members/:id/work-schedule` + **GET `/v1/members/work-schedules`** (lote); get/replace verificam membership na loja antes de tocar intervalos |
| **Horário da unidade = mesma lógica do membro** | Model `StoreWorkInterval` (FK `store_settings_id`, cascade) reaproveitando o enum `Weekday`; `openTime`/`closeTime` foram removidos de `StoreSettings` (migration `20260807180000_store_work_intervals` faz backfill seg–sex antes do drop). Tipos e validador vivem em `src/shared/domain/work-schedule/` — settings e members importam dali; não duplicar. A agenda valida a grade do membro agendável |
| Padronização Prettier/ESLint com `imoveis-api` | Manutenção da consistência de formatação no monorepo |

---

## 11. Contexto para a IA

### Não fazer
- Não importar `@prisma/client`.
- Não registrar `_example` no `AppModule`.
- Não colocar regra de negócio em `*.route.ts`.
- Não escrever migration SQL à mão.
- Não habilitar `CORS_ORIGINS` com `:3115` — o web usa o proxy BFF.
- Rotas de negócio exigem Bearer (ou `AUTH_DEV_BYPASS` + `dev-admin` em dev).
- Rotas de **members** (exceto `me`/`roles`), **settings**, **services**, **products**, **clients**, **client-categories**, **appointments**, **appointment-categories** e **financial** exigem `@StoreId()` (`X-Store-Id`); repos usam `findById(storeId, id)` (categorias também `findByName(storeId, name)`; settings `getOrCreateDefault(storeId)`; agenda `hasOverlap(storeId,…)`).

### Ao criar o próximo módulo
1. Copiar `src/modules/_example/` → renomear → apagar `.gitkeep`.
2. Entidade + Zod + repo interface + use case (+ spec in-memory).
3. Prisma repo + route/dto/presenter.
4. Model em `schema.prisma` + `db:migrate:dev` + `db:generate`.
5. Importar módulo em `app.module.ts`.
6. Atualizar §§4, 9, 12 deste arquivo.

---

## 12. Histórico de Mudanças Estruturais

| 2026-08-20 | **Temas por loja (`themeId`):** campo em `StoreSettings` (default `purple`, catálogo de 8 IDs); GET/PATCH `/v1/settings/store`; migration `20260820194350_add_store_theme_id` | settings entity/validator/repo/DTO/presenter |
| 2026-08-20 | **Equipe alinhada à Clínica:** `organizationRole` (OWNER/COLLABORATOR) separado do cargo da loja. `STORE_ROLES` sem `owner`; OWNER provisionado com cargo `profissional` + todas as permissões. API recusa desativar OWNER e alterar permissões dele. Novos membros são sempre COLLABORATOR. Quem tem `update` Team pode editar o próprio cadastro (cargo/permissões). Sem migration de cargo legado. | `ensure-platform-store-owner` + `create-member` + `update-member` + presenter + `@citybox/beautiful-permissions` | `CreateAppointmentUseCase` passa a criar imediatamente o lançamento de receita (`source=appointment_complete`, `status=pending`) com vencimento (`dueDate`) no dia marcado do agendamento. Ao alterar o status do agendamento para `CANCELLED`, `UpdateAppointmentStatusUseCase` cancela o lançamento financeiro associado (`status=cancelled`). | `create-appointment.use-case.ts` + `update-appointment-status.use-case.ts` + `update-appointment.use-case.ts` + repositório financeiro |
| 2026-08-14 | **Listagem paginada de serviços:** `GET /v1/services` passa a `{ data, meta, stats }` com `page`/`perPage`; `stats` do catálogo inteiro da loja (preço médio, duração média, ativos/inativos) | `list-services.use-case.ts` + `prisma-service.repository.ts` + rota |
| 2026-08-14 | **Listagem paginada de produtos:** `GET /v1/products` passa a `{ data, meta, stats }` com `page`/`perPage` (skip/take no Prisma); `stats` do estoque inteiro da loja para o header | `list-products.use-case.ts` + `prisma-product.repository.ts` + rota |
| 2026-08-14 | **Movimentação de Estoque em Lote (`AdjustStockBatchRoute`):** novo endpoint REST `POST /v1/products/stock-movements/batch` e use-case `AdjustStockBatchUseCase` para processar múltiplas entradas/saídas de estoque em uma **única transação atômica** no Prisma | `adjust-stock-batch.route.ts` + `adjust-stock-batch.use-case.ts` + `products.module.ts` |
| 2026-08-14 | **SKU Opcional e Nullable no Banco (`20260814073414_make_sku_optional`):** campo `sku` alterado para `sku String?` no `schema.prisma` e no PostgreSQL. Produtos sem SKU passam a ser gravados com `NULL` no banco, permitindo múltiplos produtos sem SKU na mesma loja sem violar a constraint única `@@unique([storeId, sku])` | `schema.prisma` + `migration.sql` + `prisma-product.repository.ts` + `product.entity.ts` |
| 2026-08-14 | **Listagem Paginada de Movimentações (`ListAllStockMovementsRoute`):** nova rota REST `GET /v1/products/stock-movements` e use-case `ListAllStockMovementsUseCase` para consulta paginada das movimentações de estoque da loja (`IN` e `OUT`), com busca por termo, filtro por produto, tipo e intervalo de datas | `list-all-stock-movements.route.ts` + `list-all-stock-movements.use-case.ts` + `products.module.ts` |
| 2026-08-14 | **Seed padrão e onboarding dinâmico:** adicionados defaults financeiros (caixa/corrente, receitas e despesas), categorias de cliente (VIP, Frequente, Novo, Geral) e agendamento ao seed e store setup | `seed-financial-defaults.ts` + `seed.ts` |
| 2026-08-14 | Compose usa `KEYCLOAK_BEAUTIFUL_ISSUER`, `beautiful-provisioning` e `RABBITMQ_URL` | Auth no realm dedicado e consumer store-setup ativo em produção |
| 2026-08-14 | **Reset senha da equipe:** `POST /v1/members/:id/reset-password` (Keycloak + `markProvisionalPassword`); permissão `update` Team | Equipe web gera senha provisória como a Clínica |
| 2026-08-13 | **Cores de categoria → hex:** `ClientCategory.colorId` e `AppointmentCategory.color` passam a `#rrggbb` (`VarChar(7)`); migration `20260813200000_category_color_hex`; Zod/`Matches` | UI seletor de saturação (`input type="color"`) |
| 2026-08-12 | **Financeiro ledger:** models + migration `20260812175950_add_financial_ledger`; módulo `financial` (accounts/categories/entries); rotas `/v1/financial/*`; seed lean no store-setup; **sem comissões** | Web Fluxo/Transações/Config via API |
| 2026-08-12 | **M2M admin×VPS:** `KEYCLOAK_ISSUER` apontava para `:8080` enquanto admin-api emite token em `auth.aplopes.com` → 401 no provision; alinhado + JWKS por issuer (padrão imóveis) | `POST …/provision` Beautiful aceita o mesmo token do ERP |
| 2026-08-12 | **Provision on demand:** `POST /api/v1/platform/stores/:id/provision` (org+OWNER+senha); consumer `store.created` ignorado; `store.updated` só atualiza se a org já existir | Senha volta no HTTP do admin |
| 2026-08-11 | **Fase G CASL:** `@citybox/beautiful-permissions`; PermissionGuard; resolve/effective permissions; `@RequirePermission` nas rotas; store-setup grava preset owner | Authz por subject; legado `[]` → preset na leitura |
| 2026-08-11 | **Unificação Professional→Member:** remove módulo `professionals/`; `MemberService`/`MemberWorkInterval`; agenda usa `MemberRepository`; rotas operacionais em `/v1/members` | API única para equipe + grade; migration `20260811150000_unify_professional_into_member` |
| 2026-08-10 | **Remove `DEFAULT_STORE_ID`:** loja só via admin/`store-setup`; seed exige `SEED_STORE_ID` explícito | Sem bootstrap UUID fixo |
| 2026-08-10 | **store-setup:** fila `beautiful.store-setup` + `ProcessedEvent` + `EnsurePlatformStoreOwner` + M2M `platform/stores/:id/owner*` + `azp→platform_admin`; dep `@citybox/messaging` | Loja Beautiful no admin sai de PROVISIONING; Gerar senha |
| 2026-08-10 | **Etapa 4 Fase E:** Membership — models Organization/Store/Member/StoreMember + `Professional.memberId`; `StoreScopeGuard`; `GET/POST /v1/members`; seed OWNER; `@citybox/nest-common` | JWT↔loja; convite Keycloak `vertical.beautiful.view` |
| 2026-08-10 | **Etapa 4 Fase D:** CORS browser desligado por padrão; compose sem `CORS_ORIGINS` / sem URL Nest pública no web | Browser só via BFF; `AUTH_DEV_BYPASS` só p/ curl/Swagger |
| 2026-08-10 | **Store-scoping appointments + appointment-categories** | Entity/Zod/`findById(storeId,id)`/`findAll(storeId,…)`/`hasOverlap(storeId,…)`/`findByName(storeId,name)`/`@StoreId()` nas 4 rotas de agenda + 4 de categorias; `newClient` herda `storeId`; unique categoria por loja |
| 2026-08-10 | **Store-scoping professionals + settings** | Entity/Zod/`findById(storeId,id)`/`findExistingServiceIds(storeId,ids)`/`@StoreId()` nas 9 rotas de professionals (incl. work-schedules); settings `getOrCreateDefault(storeId)` + logo `{storeId}/{slug}/logo/…` |
| 2026-08-10 | **Store-scoping clients + client-categories** | Entity/Zod/`findById(storeId,id)`/`findAll(storeId,…)`/`@StoreId()` nas 5 rotas de clients + 4 de client-categories; `findByName(storeId, name)` |
| 2026-08-10 | **Store-scoping services + products** | Entity/Zod/`findById(storeId,id)`/`@StoreId()` em 6 rotas de serviços + 8 de produtos (incl. stock-movements); anti-IDOR |
| 2026-08-10 | **Etapa 4 Fase A:** `AuthGuard` Keycloak (`jose` JWKS) + `@Public`/`@StoreId`/`@CurrentUser`; health público; `AUTH_DEV_BYPASS` | Rotas de negócio exigem Bearer; sem CASL/`storeId` ainda |
| 2026-08-07 | **Ajuste de credenciais MinIO em dev (`aplopes`)** | Alinhado o fallback de `MINIO_ACCESS_KEY` de `citybox` para `aplopes` em `MinioObjectStorage` e `.env.example`, casando com `infra/minio/.env`. |
| 2026-08-07 | **Horário de funcionamento vira grade semanal** | Model `StoreWorkInterval` + `GET/PUT /v1/settings/store/work-schedule`; `openTime`/`closeTime` removidos de `StoreSettings` (migration `20260807180000_store_work_intervals`, backfill seg–sex); tipos/validador de work schedule movidos para `src/shared/domain/work-schedule/` (professionals reexporta) |
| 2026-08-07 | **Etapa 2 P1:** `StoreSettings` enriquecido + logo MinIO; `ClientCategory.colorId/isProtected`; `AppointmentCategory` + `Appointment.categoryId`; migration `20260807163334_etapa2_p1_settings_logo` | Settings, categorias, agenda, storage |
| 2026-08-07 | **Etapa 2 (lean):** `StoreSettings`, `ClientCategory`, `StockMovement` + rotas | Settings, categorias, estoque IN/OUT |
| 2026-08-07 | **PATCH `/v1/appointments/:id` (editar/remarcar)** | Use case + rota; Prisma save faz replace das linhas de serviço; overlap exclui o próprio id |
| 2026-08-06 | **Create appointment: `newClient` inline** | POST aceita `newClient{name,phone}` XOR `clientId`; cria cliente após validar slot (evita órfão se overlap) |
| 2026-08-06 | **Create appointment: anti-overlap + grade** | `hasOverlap` no repositório; valida disponibilidade (`ProfessionalWorkInterval`) e conflito por profissional (409); util `appointment-availability` |
| 2026-08-06 | **Módulo Agenda (`AppointmentsModule`)** | Enum `AppointmentStatus` + models `Appointment`/`AppointmentService`; migration `20260806140700_add_appointments`; GET (`from`/`to`), POST, PATCH status; 3 use cases + specs |
| 2026-08-06 | **GET `/v1/professionals/work-schedules`** | Listagem em lote das grades (filtro `professionalIds` / `active`); Agenda dia deixa de fazer N GETs por profissional |
| 2026-08-06 | **GET by id inclui `week`** | `GetProfessionalById` retorna cadastro + grade semanal; listagem continua sem horários |
| 2026-08-06 | **Create/Update com `week` opcional** | POST/PATCH `/v1/professionals` aceitam grade semanal no mesmo payload; valida + `replaceWorkIntervals` após `save` |
| 2026-08-06 | **Horário de trabalho do profissional** | Enum `Weekday` + model `ProfessionalWorkInterval`; GET/PUT `/v1/professionals/:id/work-schedule` (replace atômico); validação Zod (overlap, HH:mm, ≤5/dia); base para slots da Agenda |
| 2026-08-06 | **Módulo Clientes (`ClientsModule`)** | Model Prisma `Client` + migration `20260806001617_create_clients_table`; entity/Zod/repo; 5 use cases + specs; 5 rotas REST `/v1/clients`; sem FKs/`storeId`/`active` |
| 2026-08-05 | **List/Get Professional retorna `services: { id, name }[]`** | Join no Prisma inclui `service.name`; listagem/detalhe sem N+1 de catálogo no front |
| 2026-08-05 | **Limpeza M2M:** remove `specialties`, escrita só em Professional, drop `created_at` do join | Migration `remove_specialties_and_join_created_at`; Service.create/update não alteram join; busca de profissionais sem tags |
| 2026-08-05 | **Escrita M2M também no Professional (`serviceIds`)** | Create/Update de profissional aceitam `serviceIds`; sync da junção no `PrismaProfessionalRepository`; validação via `findExistingServiceIds` |
| 2026-08-05 | **M2M Professional ↔ Service (`ProfessionalService`)** | Tabela `professional_services` + migration `20260805174138_add_professional_services`; create/update de Serviço aceita `professionalIds`; respostas de Serviço/Profissional expõem `professionalIds`/`serviceIds`; profissional pode existir sem serviços |
| 2026-08-05 | **Implementação do Módulo de Produtos / Insumos de Consumo (`ProductsModule`)** | Criação do model Prisma `Product`, migration PostgreSQL (`20260805055650_create_products_table`), Entidade `ProductEntity`, Validador Zod, Repositório Prisma, 6 Casos de Uso e 6 Rotas REST (`/v1/products`) integradas ao `AppModule` |
| 2026-08-05 | **Implementação do Módulo de Serviços (`ServicesModule`)** | Criação do model Prisma `Service`, migration PostgreSQL (`20260805054925_create_services_table`), Entidade `ServiceEntity`, Validador Zod, Repositório Prisma, 6 Casos de Uso e 6 Rotas REST (`/v1/services`) integradas ao `AppModule` |
| 2026-08-04 | **Implementação Completa do Módulo Profissionais + Especialidades e Padronização Prettier/ESLint** | Entidade de Domínio, Validador Zod, Repositório Prisma, 6 Casos de Uso e 6 Rotas REST integradas ao `AppModule` + Migration PostgreSQL (`20260805014235_add_specialties_to_professional`) + Prettier/ESLint sincronizados com `imoveis-api` |
| 2026-08-03 | Scaffold criado (shared + Prisma vazio + `_example`, sem auth) | Base pronta |
