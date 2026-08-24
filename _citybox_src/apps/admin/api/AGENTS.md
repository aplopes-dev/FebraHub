# AGENTS.md — Admin API

> **Para agentes de IA:** Este arquivo é a fonte de verdade sobre este módulo.
> Leia-o integralmente antes de qualquer ação. Ao modificar código neste módulo,
> atualize as seções relevantes deste arquivo na mesma operação. Nunca remova
> seções — apenas atualize ou adicione.

---

## 1. Identidade do Módulo

| Campo            | Valor                                            |
| ---------------- | ------------------------------------------------ |
| **Nome**         | `apps/admin/api` · pacote `@citybox/admin-api` |
| **Tipo**         | API NestJS (backend) · Backoffice de operação da plataforma |
| **Responsável**  | Bruno Lopes — Aplopes Tecnologia                 |
| **Status**       | 🟡 Em desenvolvimento                            |
| **Porta**        | `3103`                                           |
| **Última atualização deste arquivo** | 2026-08-14 (pack nutricao + location none) |

**Propósito em uma linha:**
API de administração da plataforma CityBox — onboarding municipal e gestão de
**usuários internos**, **clientes (lojistas)** e **lojas** (incl. membros,
módulos e integrações), consumida pelo backoffice `admin-web`.

---

## 2. Posição no Monorepo

```
citybox/                          ← raiz do monorepo (Turborepo + pnpm)
├── apps/
│   ├── marketplace/{api,bff}
│   ├── admin/
│   │   ├── api/                  ← VOCÊ ESTÁ AQUI (@citybox/admin-api · :3103)
│   │   └── web/                  ← @citybox/admin-web (Next.js · :3108) — consumidor
│   ├── erp/                      ← backoffice do lojista (:3107)
│   ├── workers/ · realtime-gateway/ · payment/api/
│   └── verticals/{food,…}/api    ← APIs por vertical (≥3170)
├── packages/                     ← só existem estes quatro (verificado em 2026-07-29)
│   ├── messaging/                ← wrapper amqplib (RabbitBus, CloudEvents) — usado aqui
│   ├── ui/ · mui/                ← design systems (frontend)
│   └── tsconfig/ · docs/
└── AGENTS.md                     ← contexto raiz (modelo deste arquivo)
```

> ⚠️ **Dívida de documentação (corrigida em 2026-07-29, atualizada em 2026-07-30):** este
> arquivo, o `AGENTS.md` raiz e o `CLAUDE.md` afirmavam que existem
> `packages/{database,nest-common,contracts,events,search,marketplace-projection}`.
> **Só `nest-common` existe hoje** — foi criado na Fase 4 do PLAT-001 e contém apenas o
> provisionamento Keycloak (`packages/nest-common/AGENTS.md`). Os outros cinco continuam
> não existindo; não crie import para eles. Guards e permissions seguem **locais a cada
> app** de propósito.

**Importante:** esta API tem **schema Prisma próprio** (`apps/admin/api/prisma/schema.prisma`,
schema PostgreSQL `platform`, banco `citybox_platform`).
É um serviço autocontido com seu próprio cliente Prisma gerado em `generated/prisma/`.

**Depende de (infra externa):**
- **PostgreSQL** — banco `citybox_platform`, schema `platform` (via `DATABASE_URL`)
- **Keycloak** — emissão/verificação de JWT (realm `citybox-dev`) e Admin API (provisionar usuários/roles)
- **BrasilAPI** — provider de CEP (`shared/.../brasil-api-cep.provider.ts`)

**Consumido por:**
- `apps/admin/web` (`@citybox/admin-web`) — backoffice da operação da plataforma

---

## 3. Stack e Versões

| Tecnologia       | Versão    | Observação                                            |
| ---------------- | --------- | ----------------------------------------------------- |
| Node.js          | ≥ 20      | `@types/node` 24                                      |
| pnpm             | workspace | **Package manager do monorepo** — nunca npm/yarn      |
| TypeScript       | 5.7.x     |                                                       |
| NestJS           | 11.x      | `@nestjs/common`, `core`, `platform-express`, `swagger` |
| Prisma           | 7.8.x     | generator `prisma-client` (novo) → `generated/prisma/`; adapter `@prisma/adapter-pg` + `pg` Pool |
| PostgreSQL       | —         | schema único `platform`                               |
| Zod              | v4        | validação de **domínio** (sempre `error.issues`, nunca `error.errors`) |
| class-validator / class-transformer | 0.15 / 0.5 | validação de **DTOs HTTP** + `ValidationPipe` global |
| jose             | 6.x       | verificação de JWT do Keycloak (JWKS remoto)          |
| bcrypt           | 6.x       | hash de senha provisória de membros de loja           |
| Swagger          | 11.x      | UI em `/api/v1/docs`                                   |
| Jest + ts-jest   | 30.x      | testes `*.spec.ts` (unit) + `test:e2e`                |

---

## 4. Estrutura de Pastas

O projeto segue **Clean Architecture / Hexagonal por módulo**. Cada módulo de
negócio tem três camadas: `domain` (regras puras), `application` (use cases) e
`infrastructure` (HTTP, banco, integrações). `shared/` concentra o núcleo e a
infra transversal.

```
apps/admin/api/
├── src/
│   ├── main.ts                   ← bootstrap: ValidationPipe global, prefixo "api", Swagger /api/v1/docs
│   ├── app.module.ts             ← registra módulos + guards globais (Auth, Permission) + AppExceptionFilter
│   ├── modules/                  ← MÓDULOS DE NEGÓCIO
│   │   ├── users/                ← usuários internos da plataforma (provisão Keycloak)
│   │   │                          (o módulo `clients/` foi REMOVIDO na Fase 10 do PLAT-001 —
│   │   │                           a Loja é a unidade de billing e o próprio cliente)
│   │   ├── stores/               ← lojas: dados fiscais próprios, plano/billing, settings, módulos,
│   │   │                            membros, integrações, audit — unidade de billing (PLAT-001)
│   │   ├── plans/                ← catálogo de planos comerciais, escopado por `vertical`+`tier`
│   │   ├── subscriptions/        ← assinaturas **por loja** — ciclo, preço, período
│   │   ├── invoices/              ← faturas, job de geração recorrente, suspensão/reativação por
│   │   │                            inadimplência (PLAT-001/US4)
│   │   └── backoffice/           ← visões de apoio ao backoffice (ex.: "minhas lojas")
│   └── shared/                   ← NÚCLEO + INFRA TRANSVERSAL
│       ├── core/                 ← blocos independentes de framework
│       │   ├── entity.ts                 ← classe base Entity<T> (id uuid, equals, validate())
│       │   ├── use-case.interface.ts     ← IUseCase<Input, Output>.execute()
│       │   ├── errors/                    ← AppError, DomainError, ApplicationError,
│       │   │                                 InfrastructureError, ValidatorDomainError
│       │   ├── types/optional.type.ts
│       │   └── utils/                      ← brazilian-document.utils, zod-utils
│       ├── domain/               ← contratos de domínio compartilhados
│       │   ├── providers/cep.provider.interface.ts
│       │   ├── validators/validator.interface.ts
│       │   └── errors/                     ← cep-not-found, cep-provider-unavailable
│       ├── application/use-cases/lookup-cep/  ← use case compartilhado (CEP)
│       └── infra/                ← implementações de infraestrutura
│           ├── prisma/           ← PrismaModule (global) + PrismaService (adapter-pg)
│           ├── keycloak/         ← keycloak-admin.service, keycloak-jwt (verifyKeycloakJwt)
│           ├── cep-lookup.module.ts · providers/cep/brasil-api-cep.provider.ts
│           └── http/
│               ├── guards/        ← auth.guard (JWT/dev-bypass) + permission.guard
│               ├── decorators/    ← @Public, @RequirePermission, @CurrentUser
│               ├── filters/       ← app-exception.filter (AppError → HTTP status)
│               ├── auth/          ← authenticated-user (montagem a partir do JWT)
│               ├── health.controller.ts   ← GET /api/health (público)
│               └── routes/lookup-cep/      ← GET /api/v1/cep/:cep
├── prisma/
│   ├── schema.prisma             ← datasource (schema "platform") + 9 models
│   └── migrations/               ← migrations versionadas (prisma migrate)
├── generated/prisma/             ← CLIENTE PRISMA GERADO (commitado; não editar à mão)
├── scripts/                      ← scripts utilitários
├── test/                         ← suporte a testes e2e (jest-e2e.json)
├── prisma.config.ts              ← config Prisma 7 (schema + migrations path + DATABASE_URL)
├── nest-cli.json · tsconfig*.json · eslint.config.mjs · .prettierrc
├── Dockerfile
├── .env.example                  ← referência de variáveis (copiar para .env, gitignored)
└── AGENTS.md                      ← ESTE ARQUIVO
```

### 4.1 Anatomia de um módulo (padrão `stores`)

Todo módulo de negócio segue esta estrutura. Use-o como template ao criar novos.

```
modules/<modulo>/
├── <modulo>.module.ts            ← NestModule: liga controllers (rotas), use cases e
│                                   repositórios (DI por TOKEN abstrato → impl Prisma)
├── domain/
│   ├── entities/<x>.entity.ts            ← entidade rica (extends Entity), factories create()/with(), getters, validate()
│   ├── repositories/<x>.repository.interface.ts  ← classe abstrata usada como TOKEN de DI
│   ├── validators/<x>.zod.validator.ts   ← validação de invariantes com Zod v4
│   ├── factories/<x>-validator.factory.ts
│   └── errors/<x>-*.error.ts             ← DomainError específicos (NotFound, *Taken, …)
├── application/
│   ├── use-cases/<acao>/<acao>.use-case.ts   ← implements IUseCase; orquestra domínio + repos
│   │                     └ <acao>.use-case.spec.ts ← teste unit (Jest + in-memory repo)
│   ├── dtos/ · mappers/ · utils/
├── infrastructure/
│   ├── database/prisma-<x>.repository.ts ← implementa o repositório (Prisma)
│   └── http/routes/<acao>/
│       ├── <acao>.route.ts       ← @Controller fino: valida DTO, chama use case, retorna presenter
│       ├── <acao>.dto.ts         ← DTO de entrada (class-validator + @ApiProperty)
│       ├── <acao>.query.ts       ← querystring DTO (listagens)
│       └── <acao>.presenter.ts   ← formata a entidade para a resposta HTTP
└── tests/in-memory-<x>.repository.ts     ← fake de repositório para testes unit
```

---

## 5. Restrições Críticas

> ⚠️ Estas restrições causam erros em build/runtime ou quebram a arquitetura se ignoradas.

### 5.1 Package Manager
```
SEMPRE: pnpm --filter @citybox/admin-api <script>   (ex.: pnpm --filter @citybox/admin-api dev)
NUNCA:  npm install / yarn add
```

### 5.2 Prisma 7 — cliente gerado em `generated/prisma/`
```ts
// ✅ CORRETO — importar do caminho gerado (NÃO de "@prisma/client")
import { PrismaClient } from '../../../../generated/prisma/client';
// PrismaService usa o adapter pg explícito:
new PrismaPg(new pg.Pool({ connectionString: process.env.DATABASE_URL }))

// Após mudar schema.prisma:  pnpm --filter @citybox/admin-api db:generate
// (também roda no "predev")
```

### 5.3 Schema PostgreSQL único: `platform`
- Todos os models usam `@@schema("platform")` e `@@map("snake_case")`.
- Banco é `citybox_platform` (NÃO `citybox_dev`/tenant).

### 5.4 Guards são GLOBAIS (`app.module.ts`)
```ts
// AuthGuard + PermissionGuard rodam em TODA rota por padrão.
@Public()                          // libera rota (ex.: health)
@RequirePermission('platform.admin')  // exige permissão (classe ou método)
// Sem @RequirePermission a rota exige apenas estar autenticado.
```

### 5.5 Camadas — dependências só "para dentro"
```
infrastructure → application → domain        (NUNCA o inverso)
```
- `domain` não importa NestJS, Prisma nem Express.
- Use cases dependem de **interfaces** de repositório (token abstrato), nunca da impl Prisma.
- Controllers (`*.route.ts`) são finos: sem regra de negócio — só DTO → use case → presenter.

### 5.6 Validação em duas camadas
```ts
// HTTP (borda): DTOs com class-validator + ValidationPipe global
//   { whitelist: true, forbidNonWhitelisted: true, transform: true }
// Domínio (invariantes): Zod v4 via <x>.zod.validator  → sempre error.issues
```

### 5.7 Erros: hierarquia AppError + filtro global
```ts
// Lançar SEMPRE subclasses de AppError (DomainError / ApplicationError / InfrastructureError /
// ValidatorDomainError) com { internalMessage, externalMessage, context }.
// AppExceptionFilter mapeia para o HTTP status pelo NOME do erro:
//   *NotFound → 404 · *Taken/*BlockedForStore → 409 · *ImmutableField → 400
//   *Forbidden → 403 · *Unauthorized → 401 · ValidatorDomainError → 422 · *Unavailable → 503
// Por isso o sufixo do nome do erro IMPORTA.
```

### 5.8 Dev bypass de autenticação (apenas fora de produção)
```
AUTH_DEV_BYPASS=true  +  header "Authorization: Bearer dev-admin"  → usuário admin fake.
NUNCA habilitar em produção (o guard já bloqueia se NODE_ENV === 'production').
```

### 5.12 Outbox transacional — como emitir evento de loja (LER antes de mexer)

Eventos de loja **não são publicados direto no RabbitMQ**. `StoreEventsPublisher` grava
em `platform.outbox_events`; o `OutboxRelayService` publica depois do commit.

```ts
// CERTO — escrita de domínio e evento commitam juntos
await this.unitOfWork.run(async () => {
  const saved = await this.storeRepository.save(store);
  await this.storeEventsPublisher.publishStoreCreated(mapStoreToPlatformEvent(saved, plan));
});

// ERRADO — evento fora da transação (o publisher loga WARN avisando)
const saved = await this.storeRepository.save(store);
await this.storeEventsPublisher.publishStoreCreated(...);
```

Três regras que não podem ser quebradas:

1. **Nada de I/O externo dentro de `unitOfWork.run()`** (Keycloak, gateway, HTTP).
   Transação interativa do Prisma tem timeout e prender conexão esperando rede esgota o
   pool. Em `CreateStoreUseCase` é por isso que `seedClinicDemoTeam` ficou fora da
   transação, depois do commit.
2. **Repositório que participa da transação usa `this.prisma.db`**, não `this.prisma`.
   O `db` resolve o cliente transacional via `AsyncLocalStorage` (`transaction.context.ts`).
   Usar `this.prisma` direto faz a escrita cair fora da transação **sem erro nenhum** —
   falha silenciosa. Já convertidos: store, store-detail, subscription, invoice.
3. **Consumidor tem de ser idempotente por `event_id`.** A entrega é *at-least-once*:
   crash entre publish e marcação republica a linha quando o lease expira.

Entrega e recuperação:
- Sem `RABBITMQ_URL` o relay loga `error` e as linhas ficam `PENDING` — recuperável,
  ao contrário do publisher antigo, que descartava em silêncio.
- Broker fora do ar → backoff exponencial (5s, dobrando, teto 5min), `FAILED` após
  `OUTBOX_MAX_ATTEMPTS`. Verificado de fato: derrubar o RabbitMQ, criar loja, religar —
  o evento publica sozinho.
- `GET /api/health/ready` expõe `outbox.{pending,failed,oldestPendingAgeSeconds,lagging}`.

**Armadilha já paga (não repetir):** a 1ª versão do relay publicava *dentro* de um
`$transaction` e marcava com SQL cru `WHERE id = ${id}::uuid`. A coluna é `text`, o cast
quebrava o UPDATE, a transação abortava **depois** do publish e a linha voltava a
`PENDING` — republicando a cada 2s (31 duplicatas em ~1min). Por isso hoje: claim curto
com lease → publish fora de transação → marcação com Prisma tipado.

---

## 6. Padrões de Código

### 6.1 Use Case
```ts
@Injectable()
export class CreateStoreUseCase implements IUseCase<CreateStoreDto, Store> {
  constructor(private readonly storeRepository: StoreRepository) {} // token abstrato
  async execute(dto: CreateStoreDto): Promise<Store> {
    const existing = await this.storeRepository.findBySlug(normalizeStoreSlug(dto.slug));
    if (existing) throw new StoreSlugTakenError(CreateStoreUseCase.name, dto.slug);
    return this.storeRepository.save(Store.create(mapUpsertDtoToStoreProps(dto)));
  }
}
```

### 6.2 Entidade de domínio
```ts
export class Store extends Entity<StoreProps> {
  protected validate() { StoreValidatorFactory.create().validate(this); }
  static create(props: Optional<StoreProps, 'createdAt'|'status'|…>, id?: string): Store { … }
  static with(props: StoreProps, id: string): Store { … }   // reconstrução do banco
  get tradeName() { return this.props.tradeName; }          // getters; estado mutado por métodos (block(), touch())
}
```

> ⚠️ `validate()` roda **também** em `with()`, ao hidratar do banco. Não coloque aqui
> obrigatoriedade de campo que possa faltar em linha antiga: uma linha incompleta derruba
> a listagem inteira com 500 (aconteceu com `document` na Fase 0 do PLAT-001).
> Obrigatoriedade de cadastro é no DTO da rota.

### 6.3 Repositório: interface (token) + impl Prisma + DI no módulo
```ts
// domain/repositories/store.repository.interface.ts → classe abstrata StoreRepository
// infrastructure/database/prisma-store.repository.ts → implements StoreRepository
// <modulo>.module.ts:
providers: [{ provide: StoreRepository, useClass: PrismaStoreRepository }, CreateStoreUseCase, …]
```

### 6.4 Rota (controller fino) + DTO + Presenter
```ts
@ApiTags('stores')
@Controller('v1/stores')
@RequirePermission('platform.admin')
export class CreateStoreRoute {
  constructor(private readonly createStore: CreateStoreUseCase) {}
  @Post() @HttpCode(HttpStatus.CREATED) @ApiOperation({ summary: 'Cadastrar loja' })
  async handle(@Body() dto: CreateStoreDto) {
    return CreateStorePresenter.toHttp(await this.createStore.execute(dto));
  }
}
```

### 6.5 Testes (Jest)
```ts
// *.spec.ts ao lado do use case; injeta repositório in-memory (tests/in-memory-*.repository.ts)
// e fakes (tests/fake-keycloak-*.ts). Sem banco real no unit. Padrão AAA.
```

`@citybox/messaging` é ESM: o Jest usa `moduleNameMapper` →
`src/shared/infra/messaging/__mocks__/citybox-messaging.ts`, que reexporta
`clinic-strand` e `store-events` do pacote real.

---

## 7. Variáveis de Ambiente

| Variável                       | Obrigatória | Descrição                                              |
| ------------------------------ | ----------- | ------------------------------------------------------ |
| `PORT`                         | ➖ (3103)   | Porta HTTP                                              |
| `NODE_ENV`                     | ✅          | `development` / `production` (controla dev bypass)     |
| `DATABASE_URL`                 | ✅          | Postgres `citybox_platform` (schema `platform`)        |
| `KEYCLOAK_ISSUER`              | ✅          | Issuer “público” dos JWTs (staging/prod: `https://auth.aplopes.com/realms/citybox-dev`) |
| `KEYCLOAK_INTERNAL_ISSUER`     | ➖          | Admin REST + M2M (dev: `http://127.0.0.1:8080/realms/citybox-dev` — CreateStore / senha provisória). **`AuthGuard` busca JWKS por issuer** — browser no `:8080` + `KEYCLOAK_ISSUER` remoto coexistem sem 401 |
| `KEYCLOAK_ADMIN_CLIENT_ID`     | ✅          | Client da Admin API (provisão de usuários/roles)       |
| `KEYCLOAK_ADMIN_CLIENT_SECRET` | ✅          | Secret do client admin                                 |
| `KEYCLOAK_INVITE_REDIRECT_URI` | ➖          | Redirect do e-mail de convite (`/auth/sso`)            |
| `MINIO_*`                      | ➖          | Storage de fotos de usuário (`MINIO_USERS_BUCKET`)     |
| `RABBITMQ_URL`                 | ➖          | Destino do **relay do outbox**. Sem ela o relay loga `error` e os eventos ficam `PENDING` em `outbox_events` — **não são perdidos** (ver §5.12) |
| `RABBITMQ_EXCHANGE` / `RABBITMQ_DLX` | ➖    | Padrão `citybox.events` / `citybox.dlx`                                              |
| `PLATFORM_EVENTS_PUBLISH`      | ➖          | Legado — não tem mais efeito; quem controla a publicação é `OUTBOX_RELAY_ENABLED`     |
| `OUTBOX_RELAY_ENABLED`         | ➖          | `false` desliga só o relay; o enfileiramento continua (útil p/ isolar em teste)       |
| `OUTBOX_POLL_INTERVAL_MS`      | ➖          | Intervalo do relay (padrão `2000`)                                                    |
| `OUTBOX_BATCH_SIZE`            | ➖          | Linhas por ciclo (padrão `50`)                                                        |
| `OUTBOX_MAX_ATTEMPTS`          | ➖          | Tentativas antes de virar `FAILED` (padrão `10`)                                      |
| `OUTBOX_LEASE_SECONDS`         | ➖          | Janela de invisibilidade da linha reivindicada (padrão `30`). Precisa ser > tempo de um publish |
| `REDIS_URL`                    | ➖          | Infra (não central nesta API hoje)                                                     |
| `CORS_ORIGINS`                 | ➖          | Origens permitidas (inclui `:3108` admin-web)          |
| `AUTH_DEV_BYPASS`              | ➖          | `true` libera `Bearer dev-admin` fora de produção. **Local:** necessário para o worker clinica-api chamar `POST /v1/stores/:id/seed-clinic-demo-team` com `Bearer dev-admin` quando `PLATFORM_API_BEARER` não está setado. |
| `CLINICA_API_URL`              | ⚠️          | Base URL da clinica-api (sem path). Ausente = Clínica fica `teamSource=platform` |
| `ERP_API_URL`                  | ⚠️          | Base URL do erp-api **sem** `/api` (ex. `http://127.0.0.1:3114`). Ausente = Comércio fica `teamSource=platform` e o card do responsável não aparece |
| `IMOVEIS_API_URL`              | ⚠️          | Base URL do imoveis-api **sem** `/api` (ex. `http://127.0.0.1:3112`). Ausente = Imóveis fica `teamSource=platform` e o card "Gerar senha" não aparece |
| `BEAUTIFUL_API_URL`            | ⚠️          | Base URL do beautiful-api **sem** `/api` (ex. `http://127.0.0.1:3173`). Ausente = Beautiful fica `teamSource=platform` e o card "Gerar senha" não aparece |

Referência: `.env.example` (copiar para `.env`, gitignored).

---

## 8. Scripts

```bash
# A partir da raiz do monorepo
pnpm --filter @citybox/admin-api dev          # nest start --watch
pnpm --filter @citybox/admin-api build        # nest build → dist/
pnpm --filter @citybox/admin-api start:prod   # node dist/main
pnpm --filter @citybox/admin-api lint         # eslint --fix
pnpm --filter @citybox/admin-api test         # jest (unit *.spec.ts)
pnpm --filter @citybox/admin-api test:cov     # cobertura
pnpm --filter @citybox/admin-api test:e2e     # jest --config ./test/jest-e2e.json

# Banco (Prisma 7)
pnpm --filter @citybox/admin-api db:generate  # prisma generate → generated/prisma
pnpm --filter @citybox/admin-api db:migrate:dev  # prisma migrate dev

# Endpoints úteis
# Swagger: http://localhost:3103/api/v1/docs   ·   Health: http://localhost:3103/api/health
```

Prefixo global de rotas: **`/api`** (definido em `main.ts`).

---

## 9. Módulos Implementados

> Atualize esta seção sempre que um módulo/endpoint for adicionado ou alterado.
> Salvo indicação, todas as rotas exigem `@RequirePermission('platform.admin')`.

### Users — `/api/v1/users` (`modules/users`)
Usuários **internos** da plataforma; provisiona conta no Keycloak (adapter).

| Verbo | Rota                      | Use case                |
| ----- | ------------------------- | ----------------------- |
| GET   | `/v1/users`               | ListUsersUseCase        |
| GET   | `/v1/users/:id`           | FindUserByIdUseCase     |
| POST  | `/v1/users`               | CreateUserUseCase       |
| PUT   | `/v1/users/:id`           | UpdateUserUseCase       |
| DELETE| `/v1/users/:id`           | DeleteUserUseCase       |
| POST  | `/v1/users/:id/resend-invite` | ResendInviteUseCase |

### Clients — REMOVIDO

As rotas `/v1/clients*` deixaram de existir na **Fase 10 do PLAT-001**. A Loja é a unidade
de billing e, no produto, o próprio cliente do Citybox — o admin gerencia tudo em
`/v1/stores` (a tela se chama "Clientes" e aponta para lojas).

O que mudou de lugar:

| Antes | Agora |
|---|---|
| `GET/POST/PUT /v1/clients` | `GET/POST/PUT /v1/stores` |
| `PATCH /v1/clients/:id/block` | `PATCH /v1/stores/:id/block` |
| `GET /v1/clients/:id/usage` | derivado da loja (assinatura + faturas) |
| `POST /v1/clients/:id/members` | `POST /v1/stores/:id/team` |
| `PATCH /v1/clients/members/:id/assignments` | **removido** — reaproveitar membro entre lojas cruzaria fronteira de tenant |
| `GET /v1/stores/:id/team/available` | **removido** — mesmo motivo |
| `POST /v1/stores/:id/team/batch` | **removido** — mesmo motivo |

O `gatewayCustomerId` do PSP migrou de `clients` para `stores` (é o elo do webhook de
pagamento com a entidade local — ver §12.3/R1 do ADR).

### Stores — `/api/v1/stores` (`modules/stores`)
Lojas e seu ciclo de vida: dados, settings, módulos, **membros** (Keycloak +
senha provisória bcrypt), integrações e **audit log**.

| Verbo | Rota                              | Use case                         |
| ----- | --------------------------------- | -------------------------------- |
| GET   | `/v1/stores`                      | ListStoresUseCase                |
| GET   | `/v1/stores/:id`                  | FindStoreByIdUseCase             |
| POST  | `/v1/stores`                      | CreateStoreUseCase — grava loja + billing; **não** provisiona Keycloak nem emite `store.created`; `deploymentStatus=PENDING`; resposta `{ data, meta: null }`. `clinicStrand?` só em Clínica (ausente → odontologia; inválido → 422). Admin-web exige select Odontologia \| Fisioterapia \| Nutrição no create. |
| POST  | `/v1/stores/:id/provision`        | ProvisionStoreUseCase — M2M síncrono à vertical → `{ username, provisionalPassword }`; marca `ACTIVE`/`FAILED` (payload inclui `clinicStrand` quando Clínica) |
| PUT   | `/v1/stores/:id`                  | UpdateStoreUseCase               |
| PATCH | `/v1/stores/:id/block`            | BlockStoreUseCase (+ Unblock)    |
| PATCH | `/v1/stores/:id/plan`             | ChangeStorePlanUseCase (PLAT-001/US4 — troca de plano, mesma vertical) |
| PATCH | `/v1/stores/:id/settings`         | UpdateStoreSettingsUseCase       |
| PATCH | `/v1/stores/:id/modules/:moduleKey` | UpdateStoreModuleUseCase       |
| POST  | `/v1/stores/:id/seed-clinic-demo-team` | SeedClinicDemoTeamUseCase (**no-op** — equipe demo desativada; só OWNER no first-contact) |
| GET   | `/v1/stores/:id/team/roles`       | ListStoreMemberRoles / ManageStoreMembers |
| POST  | `/v1/stores/:id/team/batch`       | AddStoreMembersBatchUseCase      |
| GET   | `/v1/stores/:id/audit-log`        | ListStoreAuditLogUseCase         |
| GET   | `/v1/stores/:storeId/signature-package-requests` | ListStoreSignaturePackageRequestsUseCase (M2M → clinica-api; só vertical Clínica) |
| PATCH | `/v1/stores/:storeId/signature-package-requests/:requestId/liberar` | LiberateStoreSignaturePackageRequestUseCase (M2M → clinica-api; só vertical Clínica) |
| PATCH | `/v1/stores/:storeId/signature-package-requests/:requestId/cancelar` | CancelStoreSignaturePackageRequestUseCase (M2M → clinica-api; só vertical Clínica) |

**Provisionamento sob demanda (POST /v1/stores/:id/provision):** o create **não** cria
usuário Keycloak nem publica `citybox.store.created`. A loja nasce `PENDING`. O operador
dispara `ProvisionStoreUseCase`, que marca `PROVISIONING`, chama M2M
`POST {vertical}/api/v1/platform/stores/:id/provision` (timeout 30s) com o payload de
`mapStoreToPlatformEvent`, e devolve `{ username, provisionalPassword }` da vertical.
Sucesso → `ACTIVE`; falha → `FAILED`; já `ACTIVE` → 409. Credenciais **nunca** vão ao banco
nem ao log — só na resposta HTTP (UI em `useState` local).

**Pacotes de assinatura (proxy M2M):** port `SignaturePackageProvisioning` + adapter
`HttpSignaturePackageProvisioning` (`CLINICA_API_URL` + `client_credentials`). Loja
inexistente → 404; vertical ≠ `Clínica` → `StoreVerticalNotSupportedError` (422). Resposta
`{ data }` espelha o presenter da clinica-api (`id`, `storeId`, `packageId`, `quantity`,
`priceCents`, `status` pending|liberado, `createdAt`, `liberatedAt`).

Use cases extra (membros): ManageStoreMembers (update de e-mail no Member + Keycloak),
ResetStoreMemberPassword,
SendStoreMemberPasswordLink, **UpdateStoreMemberStatus** (soft-disable).
Backoffice ERP: `PATCH /v1/backoffice/stores/:storeId/team/:memberId/status`
(`{ status: 'active' | 'inactive' }`) — seta `disabledAt` + Keycloak `enabled`.
Status derivado: `active` | `pending` | `inactive` | `expired` (`disabledAt`,
`provisionalExpiresAt`, `hasPassword`). Migration `20260710180000_store_member_soft_status`.
Catálogos de domínio: `store-role.catalog`,
`store-vertical.catalog` — slug ERP e roles Keycloak `vertical.<slug>.view`.

**Catálogo de verticais (três, uma por sistema):**

| `StoreVertical` | Slug ERP / role Keycloak | Sistema que atende |
| --- | --- | --- |
| `Comércio` | `comercio` / `vertical.comercio.view` | `apps/erp` — **food e varejo no mesmo produto** |
| `Clínica` | `clinic` / `vertical.clinic.view` | `apps/verticals/clinica` |
| `Imóveis` | `imoveis` / `vertical.imoveis.view` | `apps/imoveis` — consumer `imoveis.store-setup` + M2M owner |
| `Beautiful` | `beautiful` / `vertical.beautiful.view` | `apps/verticals/beautiful` — consumer `beautiful.store-setup` + M2M owner |

`Food`, `Varejo`, `Educação` e `Serviços` foram removidos: não havia sistema por trás
deles. Com `IMOVEIS_API_URL` / `BEAUTIFUL_API_URL` setados, Imóveis e Beautiful usam o
mesmo fluxo M2M de Comércio (`GET/POST …/platform/stores/:id/owner*`).

**Legado no banco:** lojas antigas com `vertical IN ('Food','Varejo',…)` quebravam
`GET /v1/stores` (Zod no `Store.with()` → 422). `normalizeStoreVertical` em
`domain/catalog/normalize-store-vertical.ts` remapeia na hidratação Prisma; em prod
as 4 lojas foram atualizadas para `Comércio` (2026-08-03).

### Backoffice — `/api/v1/users/me/stores` (`modules/backoffice`)
Visões de apoio para o usuário logado.

| Verbo | Rota                  | Use case               | Auth |
| ----- | --------------------- | ---------------------- | ---- |
| GET   | `/v1/users/me/stores` | ListMyStoresUseCase    | autenticado (sem `platform.admin`) |

### Plans — `/api/v1/platform/billing/plans` (`modules/plans`)
Catálogo de planos comerciais, escopado por `vertical`+`tier` (PLAT-001/US3).

| Verbo  | Rota                                    | Use case          |
| ------ | ---------------------------------------- | ------------------ |
| GET    | `/v1/platform/billing/plans`             | ListPlansUseCase (filtro `?vertical=`) |
| GET    | `/v1/platform/billing/plans/:id`         | FindPlanByIdUseCase |
| POST   | `/v1/platform/billing/plans`             | CreatePlanUseCase (`vertical`/`tier`/`maxNegocios` obrigatórios) |
| PUT    | `/v1/platform/billing/plans/:id`         | UpdatePlanUseCase  |
| DELETE | `/v1/platform/billing/plans/:id`         | DeletePlanUseCase  |

### Subscriptions — `/api/v1/platform/billing/subscriptions` (`modules/subscriptions`)
Assinaturas — vinculadas a `storeId` (novo modelo, PLAT-001) ou, para dados legados, a `clientId`.
`SubscriptionRepository.findActiveByStoreId`/`findPriceByPlanAndCycle` são os pontos de integração
mais usados por `stores`/`invoices`. Sem rotas HTTP próprias além de listagem/cancelamento — a
criação/troca de assinatura acontece via `CreateStoreUseCase`/`ChangeStorePlanUseCase` (`stores`).

### Invoices — `/api/v1/invoices` (`modules/invoices`)
Faturamento interno da plataforma (faturas de assinaturas). Faturas manuais são
registradas no Asaas quando o cliente possui `gatewayCustomerId` (via
`PaymentGatewayModule`).

| Verbo | Rota                       | Use case                   | Auth / Permissão |
| ----- | -------------------------- | -------------------------- | ---------------- |
| GET   | `/v1/invoices`             | ListInvoicesUseCase        | `@RequirePermission('platform.admin')` |
| GET   | `/v1/invoices/stats`       | GetInvoicesStatsUseCase    | `@RequirePermission('platform.admin')` |
| GET   | `/v1/invoices/:id`         | FindInvoiceByIdUseCase     | `@RequirePermission('platform.admin')` |
| GET   | `/v1/invoices/:id/payment-details` | GetInvoicePaymentDetailsUseCase | `@RequirePermission('platform.admin')` |
| POST  | `/v1/invoices/:id/mark-paid`| MarkInvoiceAsPaidUseCase   | `@RequirePermission('platform.billing.manage')` |
| POST  | `/v1/invoices/generate-job`| GenerateInvoicesUseCase    | `@RequirePermission('platform.billing.manage')` |
| POST  | `/v1/invoices/manual`      | CreateManualInvoiceUseCase | `@RequirePermission('platform.billing.manage')` |
| GET   | `/v1/billing/kpis` (suporta `startDate`/`endDate`) | GetBillingKpisUseCase      | `@RequirePermission('platform.admin')` |

### Webhooks — `/api/v1/webhooks` (`modules/payment-gateway`)
Integração com gateway de pagamentos.

| Verbo | Rota                             | Use case / Descrição                  | Auth |
| ----- | -------------------------------- | ------------------------------------- | ---- |
| POST  | `/v1/webhooks/payment/asaas`      | Receber e processar webhooks do Asaas | `@Public()` |

PLAT-001/US4: `GenerateInvoicesUseCase` além de gerar faturas novas, roda
`suspendStoresWithOverdueInvoices()` — toda fatura `OPEN` cuja `Invoice.checkPastDue()` transiciona
para `PAST_DUE` aciona `BlockStoreUseCase` (actor `system:billing`, módulo `stores`, via `forwardRef`
circular entre `InvoicesModule`/`StoresModule`). `MarkInvoiceAsPaidUseCase` reverte via
`UnblockStoreUseCase` quando a fatura paga estava `PAST_DUE`. Ambas as dependências são
`@Optional()` — o job roda normalmente mesmo se o módulo de stores não estiver disponível.

### Shared (transversal)
- **Health** — `GET /api/health` — `@Public()`.
- **CEP** — `GET /api/v1/cep/:cep` — LookupCepUseCase (provider BrasilAPI). Qualquer usuário autenticado (JWT); sem `platform.admin`.
- **Keycloak** — `keycloak-admin.service` (provisão/roles/convite e-mail) + `keycloak-jwt` (verificação JWKS).
- **Prisma** — `PrismaModule` (global) + `PrismaService` (adapter-pg + pool).
- **Messaging** — `StoreEventsPublisher` (`@citybox/messaging`): publica `citybox.store.created.v1` e `citybox.store.updated.v1` em create/update de loja (routing `citybox.store.created` / `citybox.store.updated`). Ver `packages/docs/events/catalog-v1.md`.

### Modelos Prisma (`prisma/schema.prisma`, schema `platform`)
`User`, `Store`, `StoreTerminal`, `StoreError`, `StoreMember`, `StoreModule`, `StoreIntegration`,
`StoreAuditEvent`, `Member`, `Plan`, `PlanPrice`, `Subscription`, `Invoice`, `OutboxEvent`
(+ enums `StoreStatus`, `StoreDeploymentStatus`, `InvoiceStatus`, `SubscriptionStatus`,
`OutboxEventStatus`).

**`Client` não existe mais** — dropado na migration `20260730040000_plat001_drop_client`.

✅ **PLAT-001 concluído para esta API (Fase 10, 2026-07-30).** A Loja é a unidade de
billing e o próprio cliente do Citybox.

| Antes | Agora |
|---|---|
| `Store.clientId`, `Subscription.clientId`, `Invoice.clientId`, `Member.clientId` | **removidos** |
| `Store.usesClientDocument` | **removido** — o documento é sempre o da própria loja |
| `Subscription.storeId`, `Invoice.storeId` nullable | **NOT NULL** |
| `Client.gatewayCustomerId` | `Store.gatewayCustomerId` (`@unique`) — elo do webhook do PSP |
| `Member.storeId` (escalar, nullable, sempre nula) | **removida** — o vínculo é `StoreMember` (N lojas por membro) |
| `subscriptions_client_id_active_unique_idx` | `subscriptions_store_id_active_unique_idx` |
| `requireStoreClientId` / `StoreClientRequiredConflictError` | **removidos** |
| `SubscriptionRepository.findActiveByClientId` | `findActiveByStoreId` |
| filtro `clientId` em `/v1/invoices`, `/v1/platform/billing/subscriptions` | `storeId` (antes o filtro chegava no DTO e era **descartado** — devolvia tudo) |

⚠️ **`clientId`/`clientName`/`clientDocument` seguem no contrato HTTP de faturas,
assinaturas e lojas, carregando dados da LOJA.** Não é resíduo — no produto a Loja *é* o
cliente (a tela do admin se chama "Clientes" e aponta para lojas). Ver §12.4 do ADR.

**Status de cobrança por loja é derivado**, não um campo: bloqueada > inadimplente (tem
fatura `PAST_DUE`) > ativa (tem assinatura `ACTIVE`/`TRIALING`) > sem assinatura. A
precedência importa — sem ela o gráfico de distribuição não fecha com a contagem de
clientes (`GetDashboardSummaryUseCase.resolveBillingStatusCounts`).

---

## 10. Decisões de Arquitetura

> Registre aqui o raciocínio por trás de decisões não-óbvias.

| Data       | Decisão                                                        | Motivo                                                            |
| ---------- | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| 2026-07-30 | **Listagem da equipe da vertical substituída pelo responsável** — `GET /v1/stores/:storeId/vertical-team` (lista) deu lugar a `GET /v1/stores/:storeId/vertical-team/owner`, que devolve `{ owner: VerticalMember \| null }`; no port, `listMembers` virou `findOwner` e o filtro por `organizationRole = 'OWNER'` desceu para o `HttpVerticalMemberProvisioning` (o `resetOwnerPassword` passou a reusar `findOwner`). `teamSource` e `GET /vertical-team/units` + `POST /vertical-team` seguem como estavam | Decisão de produto: pelo admin gerencia-se **apenas o responsável** da organização — colaborador é cadastrado dentro do app da vertical. Com a aba "Membros" fora do admin, a listagem ficou sem consumidor, e manter rota pública sem uso é convite a alguém voltar a montar tela de equipe aqui. `null` em vez de 404/erro porque loja cujo `store.created` veio sem `responsibleName` **realmente** não tem responsável, e a tela precisa distinguir isso de "não consegui falar com a vertical" — os dois casos têm mensagens e saídas diferentes. A clínica continua sem rota de responsável: quem filtra é o adapter, para o resto do platform não trafegar equipe que ele não gerencia |
| 2026-07-30 | **Leitura da equipe da vertical + discriminador `teamSource`** — `VerticalMemberProvisioning.listMembers` (reaproveita o `GET /api/v1/members` M2M que o reset de senha do responsável já consumia) exposto em `GET /v1/stores/:storeId/vertical-team`; `FindStoreByIdUseCase` passa a devolver `teamSource: 'platform' \| 'vertical'`, presente em **todas** as respostas de detalhe da loja (`FindStoreByIdPresenter.toHttp`) | A aba "Membros" do admin aparecia vazia para clínicas: ela lia `related.members` (`platform.store_members`), mas desde o PLAT-001 (decisão D1) a dona da equipe é a vertical — o responsável criado no cadastro do cliente nasce em `clinica.members`. Duas fontes de verdade, e o admin olhava a errada. O contrato devolvido espelha 1:1 o `MembersPresenter` da clínica (inclui `organizationRole`, que é o que distingue o responsável) — o platform não inventa campo nem reinterpreta papel. `teamSource` é derivado do `isSupported` do adapter, e **não** de um `switch` por vertical: quando o `erp-comercio` expuser API de membros basta entrar no `VERTICAL_BASE_URL` e o valor muda sozinho. Todas as rotas de detalhe propagam o campo — se só o `GET` o fizesse, um `PATCH /settings` devolveria `'platform'` e a aba voltaria à fonte errada no cache do frontend |
| 2026-07-30 | **Catálogo de verticais reduzido a duas** — `StoreVertical = 'Comércio' \| 'Clínica'`. `Food`+`Varejo` fundem em `Comércio` (slug `comercio`); saem `Educação` e `Serviços`. Módulos/integrações de food (KDS, totem, PDV mobile, iFood, Rappi, Stone) e os cargos de food+varejo passam para `Comércio`. Mapa de slug legado (`Varejo → market`) e o fallback de role no Keycloak removidos | Passou a valer **uma vertical por sistema**, não por ramo: o `erp-comercio` atende food e varejo no mesmo produto. `Store.vertical`/`Plan.vertical` são `String` no Prisma (não enum) e o banco de dev estava zerado — **sem migration**. `Imóveis` ficou fora de propósito: `apps/imoveis/api` não tem tenancy nem consumidor de evento, então a loja ficaria presa em `PROVISIONING` |
| —          | Clean Architecture por módulo (domain/application/infra)       | Isola regra de negócio do framework; testável com repos in-memory |
| —          | Repositório como **classe abstrata** usada como token de DI    | Inverte dependência sem `@Inject('STRING')` frágil               |
| —          | Schema Prisma próprio (`platform`), separado de `packages/database` | API autocontida; banco `citybox_platform` distinto do tenant |
| —          | Prisma 7 com generator `prisma-client` + adapter `pg`          | Cliente gerado em `generated/prisma` e pool de conexões explícito |
| —          | Guards globais + `@RequirePermission` declarativo              | Segurança por padrão (deny) liberada caso a caso                 |
| —          | `AppError` com `internalMessage`/`externalMessage` + filtro por nome | Log interno rico, resposta externa segura; status derivado do nome |
| —          | Validação dupla: class-validator (HTTP) + Zod (domínio)        | Borda valida formato; domínio garante invariantes                |
| 2026-07-07 | Job de geração de faturas como use case na API | Centraliza a regra de faturamento no módulo invoices de platform-api. Pode ser exposto via endpoint REST e integrado facilmente com workers ou cron jobs. Idempotência baseada no ciclo corrente de assinatura. |
| 2026-07-10 | Método findGlobalMemberById na busca de membros | Adicionado método na interface de repositório para resolver a busca de operador existente globalmente (tabela members) antes da associação, isolando do findMemberById que busca a associação store_members local. |
| 2026-08-04 | **Seed equipe clínica:** `SeedClinicDemoTeamUseCase` vira no-op; cargos CASL + presets nasciam no worker (depois removidos — só OWNER) | Evita Keycloak órfão pós-Fase 4 |
| 2026-07-27 | Seed equipe clínica no CreateStore (antes do evento RabbitMQ) | Keycloak/membership viviam na platform; clinica-api reforçava via HTTP. Superado pela Fase 4 + seed no worker. |
| 2026-07-18 | `Plan.vertical`/`Plan.tier` como `String` livre, sem enum Prisma novo | Reaproveita o mesmo padrão de `Store.vertical` (String + union type TS) em vez de criar uma segunda representação de vertical no schema — ver `specs/_platform/001-store-billing-unit/research.md` #4 |
| 2026-07-18 | Suspensão por inadimplência (PLAT-001) reaproveita `StoreStatus.BLOCKED` + `BlockStoreUseCase`/`UnblockStoreUseCase` existentes | Evita um segundo campo de "status de billing" paralelo; motivo (inadimplência vs. bloqueio manual) fica no `actor`/`action` do `StoreAuditEvent` existente — ver research.md #3 |
| 2026-07-30 | **Reset de senha do responsável delegado à vertical** — `VerticalMemberProvisioning.resetOwnerPassword` + `POST /v1/stores/:storeId/vertical-team/owner/reset-password`. O platform **não** guarda quem é o responsável: descobre pelo `organizationRole = 'OWNER'` que a listagem da vertical expõe e encaminha para o `POST /v1/members/:memberId/reset-password` dela | O Keycloak de desenvolvimento não tem SMTP (`smtpServer` ausente em `infra/keycloak/import/citybox-dev-realm.json`), então convite por e-mail não sai — a decisão de produto foi o admin exibir a senha uma única vez. Guardar o `memberId` do responsável aqui duplicaria dado que a vertical já é dona (decisão D1). Loja sem responsável vira `VerticalOwnerNotFoundError` com mensagem acionável, não 500. A senha nunca é logada nem persistida em claro |
| 2026-07-18 | `Store.clientId`/`Subscription.clientId`/`Invoice.clientId` tornados `String?` no escopo de T015 (PLAT-001), não adiados para a Phase 7 | `requireStoreClientId(store, context)` guarda as operações de equipe/membro que ainda exigem `Client`, lançando `StoreClientRequiredConflictError` (409) em vez de deixar `clientId` undefined vazar como `!`-assertion; `Member.clientId` continua NOT NULL de propósito — ver research.md #7 |

---

## 11. Contexto para a IA

### O que NÃO fazer neste módulo
- Não importar de `@prisma/client` — usar o cliente gerado em `generated/prisma/`.
- Não usar o schema/tenant de `packages/database` aqui — esta API tem schema `platform` próprio.
- Não colocar regra de negócio em `*.route.ts` (controllers finos) nem em repositórios.
- Não fazer `domain`/`application` importarem NestJS, Prisma ou Express.
- Não injetar a implementação Prisma direto no use case — depender da interface (token).
- Não inventar `HttpException` solta — lançar subclasse de `AppError` com sufixo de nome correto (o filtro mapeia o status pelo nome).
- Não usar `error.errors` do Zod — é `error.issues` (Zod v4).
- Não habilitar `AUTH_DEV_BYPASS` em produção.
- Não instalar pacotes com npm/yarn — usar pnpm no monorepo.

### Ao criar um novo **use case** num módulo existente
1. `application/use-cases/<acao>/<acao>.use-case.ts` (`implements IUseCase`) + `.spec.ts`.
2. Métodos/contratos novos no repositório → atualizar a **interface** (`domain/repositories`) e a **impl Prisma** e o **in-memory** (tests).
3. `infrastructure/http/routes/<acao>/` → `route.ts` (+ `dto.ts`, `query.ts`, `presenter.ts`).
4. Registrar route (controller) e use case no `<modulo>.module.ts`.
5. Erros de domínio novos com sufixo apropriado (NotFound/Taken/Forbidden/…).
6. Atualizar a tabela de endpoints na seção 9 deste arquivo.

### Ao criar um novo **módulo**
1. `modules/<novo>/` com as três camadas (ver 4.1).
2. `<novo>.module.ts` ligando controllers, use cases e `{ provide: <Repo>, useClass: Prisma<Repo> }`.
3. Importar o módulo em `app.module.ts`.
4. Se houver novos models, editar `prisma/schema.prisma` (`@@schema("platform")`), criar migration (`db:migrate:dev`) e `db:generate`.
5. Atualizar seções 4 e 9 deste arquivo.

### Fluxo de trabalho esperado
1. Domínio primeiro (entidade + invariantes Zod + erros) → use case com repo in-memory (TDD).
2. Implementar repositório Prisma + rota (DTO/presenter).
3. Rodar `lint` + `test` (e `test:e2e` se tocar HTTP).
4. Atualizar este `AGENTS.md`.

---

## 12. Histórico de Mudanças Estruturais

> Não é changelog de features — registra mudanças que afetam o contexto da IA.

| Data       | Mudança                                             | Impacto                          |
| ---------- | --------------------------------------------------- | -------------------------------- |
| 2026-08-12 | **`AuthGuard` JWKS por issuer** (paridade imoveis-api): valida JWT do browser no Keycloak local mesmo com `KEYCLOAK_ISSUER=auth.aplopes.com` | Corrige 401 “Token inválido” ao listar lojas no admin-web local |
| 2026-08-14 | **Admin-web oferece Nutrição no create** — pack seed `nutricao` na clinica-api (Partes 2–3) | Vertentes |
| 2026-08-12 | **Admin-web oferece Fisioterapia no create** — pack seed fisio na clinica-api (Parte 2) | Vertentes |
| 2026-08-11 | **`clinicStrand` na Store** (migration `20260811170000_add_store_clinic_strand`): opcional no create, default odontologia em Clínica, inválido → 422, imutável no update; evento `citybox.store.created.v1` ganha o campo aditivo | Vertentes da clínica (Parte 1) |
| 2026-08-11 | **Admin REST Keycloak usa `KEYCLOAK_INTERNAL_ISSUER`** (`KeycloakAdminService.getAdminApiIssuer`) — CreateStore/senha no Keycloak local | Lojistas Immóveis/ERP no `:8080` |
| 2026-08-11 | **Dev local:** `KEYCLOAK_ISSUER` + admin-web no `:8080` (conta seed `admin`/`citybox`); aplopes opcional em staging/prod | Login de operador alinhado ao Keycloak local |
| 2026-08-12 | **Provisionamento sob demanda:** `CreateStore` **não** publica `citybox.store.created` nem cria usuário Keycloak; loja nasce `deploymentStatus=PENDING` (enum + migration `20260812120000_store_deployment_pending`). Novo `POST /v1/stores/:id/provision` (M2M síncrono, timeout 30s) → vertical `POST …/platform/stores/:id/provision` → `{ username, provisionalPassword }`; marca `ACTIVE`/`FAILED`. Já `ACTIVE` → 409 (`StoreAlreadyProvisionedConflictError`). Adapter ganha `provisionStore`. | Login + senha só no botão Provisionar do detalhe |
| 2026-08-11 | **`IMOVEIS_API_URL` normaliza trailing `/api`** no adapter M2M — evita `…/api/api/v1/…` (404 no Gerar senha) | Reset de senha do responsável Imóveis pelo admin |
| 2026-08-11 | **Keycloak username do responsável = e-mail completo** (`usernameFromEmail`); `createStoreBackofficeUser` não reusa username de outro e-mail | Evita colisão `vendas@a`/`vendas@b` → login do backoffice (auth.aplopes.com) “utilizador inválido” |
| 2026-08-11 | **Provisionamento do responsável no CreateStoreUseCase** — `POST /v1/stores` cria o usuário do responsável no Keycloak (usuário de `billingEmail`, nome de `responsibleName`, senha provisória, roles `store_staff` + `vertical.<slug>.view`) antes do `unitOfWork.run()`; resposta passa de `{ data }` para `{ data, meta: { username, temporaryPassword } \| null }`. Novo `keycloakAdmin` no construtor (7º param) e util `store-owner-credentials.ts` | O responsável **nasce pronto para login** no cadastro da loja — antes nascia sem usuário e o "Gerar senha" do card dependia da vertical ter processado o evento. `meta: null` quando o DTO de aplicação veio sem `responsibleName`/`billingEmail`; o DTO HTTP exige ambos, então via API o meta sempre vem. Credenciais exibidas uma única vez na tela; nunca persistidas/logadas. 7 specs do módulo `stores` ajustados ao novo retorno (`result.store`) + 3 novos testes de provisioning |
| 2026-08-10 | **Beautiful no VERTICAL_BASE_URL:** `BEAUTIFUL_API_URL` + `findOwner`/`resetOwnerPassword` no branch Comércio/Imóveis; `StoreVertical`/`StorePlatformVertical` incluem `'Beautiful'` | Card "Gerar senha" do responsável Beautiful |
| 2026-08-07 | **Imóveis no VERTICAL_BASE_URL:** `IMOVEIS_API_URL` + `findOwner`/`resetOwnerPassword` no mesmo branch de Comércio; deploy `services/platform` seta a env | Card "Gerar senha" do responsável Imóveis |
| 2026-08-07 | **Proxy M2M pacotes de assinatura:** port `SignaturePackageProvisioning` + `HttpSignaturePackageProvisioning` (`CLINICA_API_URL`); rotas `GET/PATCH …/signature-package-requests` (só vertical Clínica) | Admin libera créditos ZapSign sem falar direto com a clinica-api |
| 2026-08-04 | **Provisionamento Comércio fechado para o operador:** `ERP_API_URL` no adapter (`VERTICAL_BASE_URL.Comércio`); PJ exige `legalName` no DTO create/update; PF faz fallback `tradeName→legalName` no mapper; detalhe da loja expõe `deploymentStatus`; deploy `services/platform/docker-compose.yml` seta `ERP_API_URL`/`CLINICA_API_URL` no `admin-api` (`clinica_api`, não `clinica-api`) | Com `ERP_API_URL` setado, `teamSource=vertical` e o card "Responsável" chama `GET/POST /api/v1/platform/stores/:id/owner*` no ERP (paridade Clínica). Cadastro incompleto deixa de chegar no consumer como `StorePayloadIncompleteError` |
| 2026-07-31 | **Rename `apps/platform/api` → `apps/admin/api`:** pacote `@citybox/platform-api` → `@citybox/admin-api`; sibling `apps/platform/admin` → `apps/admin/web`. Porta (3103), schema Postgres (`platform`) e clients Keycloak inalterados | Consolida a nomenclatura `apps/<nome>/{api,web}` do monorepo; ver `../AGENTS.md` §9 |
| 2026-07-30 | **Membros da vertical por M2M síncrono (Fase 7)** — port `VerticalMemberProvisioning` + adapter HTTP (`HttpVerticalMemberProvisioning`), rotas `GET/POST /v1/stores/:id/vertical-team`. O platform **não guarda cópia de escrita** desses membros | Escrita é síncrona de propósito (decisão D1): o admin precisa da senha provisória e do erro real (quota, e-mail duplicado) na resposta da tela. Acoplamento é `platform → vertical`, a direção correta — a vertical segue extraível. Exige `platform_admin` no service account `citybox-core-admin` (adicionado ao realm; realm já provisionado precisa do ajuste manual) |
| 2026-07-30 | **Contrato de evento v2 (Fase 2)** — `packages/messaging/src/contracts/store-events.ts` vira fonte única: constantes, routing keys e payloads. `StorePlatformEventData` ganhou `status`, `reason` e `owner`/`plan` já existentes; `clinica-api` deixou de ter cópia própria (estava divergida, sem `owner`/`plan`). Callbacks vertical→platform sob prefixo `citybox.provisioning.*` + fila `platform.vertical-callbacks` | Crescimento **aditivo**: food/clinica ignoram tipos desconhecidos, nada quebra. Prefixo dos callbacks é `provisioning` e não `store` de propósito — as filas das verticais bindam `citybox.store.#` e receberiam o próprio callback de volta |
| 2026-07-30 | **Outbox transacional (Fase 1)** — `outbox_events` + `OutboxRelayService` + `UnitOfWork`/`AsyncLocalStorage`. `StoreEventsPublisher` deixou de publicar direto no broker e passou a enfileirar; os 5 fluxos que emitem evento (create/update/change-plan/suspend/reactivate) agora commitam domínio+evento juntos. Repositórios de store, store-detail, subscription e invoice passaram a escrever por `prisma.db`. `/health/ready` expõe métricas do outbox. Ver §5.12 | Fecha o buraco em que evento perdido = loja paga sem organização provisionada, sem retry. Entrega vira at-least-once: **todo consumidor precisa deduplicar por `event_id`**. `PLATFORM_EVENTS_PUBLISH` deixou de ter efeito (use `OUTBOX_RELAY_ENABLED`) |
| 2026-07-29 | **PLAT-001 integrado ao main (Fase 0):** as 62 tasks de `specs/_platform/001-store-billing-unit/` viviam só na branch `refactor/structure`, 298 commits atrás. Cherry-pick dos 2 commits com 16 conflitos resolvidos | `CreateStoreUseCase` agora combina os dois lados: seed de equipe clínica (main) **e** `Subscription`+faturas iniciais por `storeId` (branch). Ordem do construtor: `…, planRepo, seedClinicDemoTeam, @Optional() invoiceRepository`. Helper de teste `tests/noop-clinic-team-seed.ts` extraído (era inline, agora usado por 7 specs). 61 suites/252 testes verdes; boot real sem erro de DI no `forwardRef` novo `InvoicesModule ↔ StoresModule`. **Lacuna conhecida:** `getTopDefaulters` agrupa por `clientId` e agora filtra `null` — inadimplência de loja sem Cliente não aparece no ranking até a Fase 8 (TODO no repositório) |
| 2026-07-29 | Corrigida dívida de doc: `packages/{database,nest-common,contracts,events,search}` **não existem** (seção 2) | ADR PLAT-001 §7 exige criar `nest-common` — task nova |
| 2026-08-04 | **Seed equipe clínica no-op:** `SeedClinicDemoTeamUseCase` deixa de criar gerente+atendente em `store_members`; demo CASL no worker clinica | CreateStore + rota seed |
| 2026-07-27 | **Seed equipe clínica:** `SeedClinicDemoTeamUseCase` + `POST /v1/stores/:id/seed-clinic-demo-team`; CreateStore chama antes de `store.created` | Gerente + atendente Keycloak no first-contact (legado pré-Fase 4) |
| 2026-06-25 | Arquivo `AGENTS.md` criado                           | —                                |
| 2026-07-06 | Publicação RabbitMQ `citybox.store.created.v1` / `citybox.store.updated.v1` em CreateStore/UpdateStore | Consumer food-api `food.store-setup`; publish direto sem outbox |
| 2026-07-02 | Sistema de Assinaturas e Preços por Plano (`subscriptions` e `plan_prices`) na `platform-api` | Mudança no Prisma schema (tabelas `subscriptions` e `plan_prices`), com refatoração das entidades `Client` e `Plan` e novos tipos de dados no front. |
| 2026-07-02 | Atualização em-lote de plano na assinatura existente  | Troca de plano (upgrade/downgrade) passa a atualizar a assinatura existente in-place com recalculação de período (now + cycle) em vez de cancelar e recriar. |
| 2026-07-02 | Exposição de preço pago na assinatura               | Adicionado campo `priceCents` no retorno do detalhe de cliente para mostrar o valor pago do plano real. |
| 2026-07-03 | Firmeza do contrato com o enum CRU para cycle e status | Alterado o response mapper de subscription para retornar os enums crus (`cycle` e `status`) em vez de rótulos traduzidos PT-BR. Atualizado o DTO e use-cases de cliente para aceitar `MONTHLY`/`YEARLY` na API. |
| 2026-07-05 | Validação de Quotas e limites de plano | Implementação de validações em CreateStore e UpsertStoreMember e novo endpoint /v1/clients/:id/usage. |
| 2026-07-07 | Módulo de invoices com CRUD, KPIs e job de faturamento | Criação da tabela invoices e do enum InvoiceStatus no Prisma; endpoints de listagem, detalhes, mark-paid (RBAC billing.manage), billing/kpis e generate-job. |
| 2026-07-08 | Otimização na listagem de Assinaturas (Join no Backend) | O endpoint `GET /v1/platform/billing/subscriptions` e o repositório Prisma foram atualizados para incluir (join) dados de cliente e plano na mesma consulta de banco de dados, reduzindo requisições HTTP paralelas no frontend. |
| 2026-07-10 | Caso de uso AddStoreMembersBatchUseCase para vinculação múltipla de equipe | Adicionado suporte a vinculação de múltiplos operadores existentes em lote com validações de cota, duplicidade e Keycloak em um único endpoint POST. |
| 2026-07-10 | Desativar/reativar membro (`disabledAt`, `provisionalExpiresAt` em `Member`) + `PATCH …/team/:id/status` + Keycloak enable/disable | Pós-merge N:N: os campos de status/senha provisória passaram do antigo `StoreMember` para a entidade global `Member`. Listagem inclui inativos/expirados; quota conta só membros não desabilitados |
| 2026-07-15 | Criação de fatura manual na platform-api | Criação do endpoint POST /v1/invoices/manual que gera uma única fatura com período customizado e vencimento para o próximo mês (baseado no dia de vencimento da assinatura do cliente). |
| 2026-07-14 | Rota de detalhamento de membros (GET /v1/clients/members/:id) | Adicionado endpoint para retornar informações detalhadas do membro e as lojas que ele faz parte. |
| 2026-07-14 | Rota de atribuição de membros em lote (PATCH /v1/clients/members/:id/assignments) | Novo endpoint para gerenciar remoções, edições e inclusões de lojas e cargos em uma única requisição. |
| 2026-07-14 | Rota de criação de membro (POST /v1/clients/:id/members) | Adicionado endpoint para criar um novo usuário global e vinculá-lo a múltiplas lojas simultaneamente. |
| 2026-07-14 | Cálculo de vencimento baseado em `dayOfMonth` | Novo utilitário `calculateBillingPeriod()` que calcula `currentPeriodEnd` com base no dia de vencimento definido pelo usuário, em vez de `now + 1 month`. Afeta `CreateClientUseCase` e `UpdateClientUseCase`. |
| 2026-07-14 | Faturas antecipadas (12 mensais ou 1 anual) | Novo utilitário `generateUpfrontInvoices()` que gera todas as faturas no cadastro/atualização de plano. Sem geração automática recorrente. |
| 2026-07-16 | Cobrança avulsa no Asaas via `CreateManualInvoiceUseCase` | Faturas manuais agora são registradas no Asaas via `paymentGateway.createInvoice()` quando o cliente possui `gatewayCustomerId`. Mapeamento de status gateway→local. `InvoicesModule` importa `PaymentGatewayModule`. `Invoice` ganha `setGatewayPaymentId()`. Campo `TextArea` no admin-web. |
| 2026-07-16 | Integração Asaas & Provisionamento Assíncrono | Novo módulo `payment-gateway` com provedor Asaas e endpoint de Webhook. Adicionado `ClientCreatedListener` e evento `client.created` para provisionar clientes/assinaturas no Asaas assincronamente. Campos de Stripe renomeados para genéricos (`gatewayCustomerId`/`gatewaySubscriptionId`/`gatewayPaymentId`). |
| 2026-07-16 | Campo de observações (notes) na fatura manual | Campo de observações (notes) adicionado no fluxo de criação de faturas manuais (front + DTOs + backend + banco). |
| 2026-07-17 | Implementação de Webhook do Asaas | Estrutura completa de webhook no platform-api com idempotência via tabela `payment_gateway_webhook_events`, validação de assinatura e processamento assíncrono via `EventEmitter2`. |
| 2026-07-17 | Visualização de boleto de cobrança com Asaas | Adicionado endpoint GET /v1/invoices/:id/payment-details que recupera os detalhes de pagamento em tempo real da API do Asaas (como bankSlipUrl, bankSlipBarCode e pixQrCode). |
| 2026-07-21 | KPIs Mensais de Faturamento no Use Case | Adicionados 4 novos campos (ExpectedReceipts, ReceivedReceipts, TotalInvoices, OnTimeInvoices) no use case GetBillingKpisUseCase e na resposta do endpoint GET /v1/billing/kpis para dar suporte dinâmico ao dashboard financeiro. |
| 2026-07-22 | Refatoração de KPIs Financeiros (Backend-Driven) | Adicionados topDefaulters e revenueHistory no GetBillingKpisUseCase e repositórios para processar agregações analíticas de faturamento no backend (NestJS/Prisma), eliminando a necessidade de paginação (perPage) e agrupamento no frontend. |
| 2026-07-22 | Exposição de Eventos de Webhook do Gateway | Criação dos endpoints GET /v1/payment-gateway/webhook-events e GET /v1/payment-gateway/stats com use cases associados para conectar a tela do gateway ao banco. |
| 2026-07-22 | Filtros e busca server-side em faturas | Adicionados filtros por `method` e `search` (nome do cliente) no `ListInvoicesUseCase` e repositório Prisma, expostos na rota GET /v1/invoices. |
| 2026-07-23 | Otimização da Consulta de Top Clients no Dashboard | Alterada a query `prisma.client.findMany` para ordenar e limitar os registros diretamente no banco de dados (`orderBy` por contagem de `stores` e `take: 5`), reduzindo o consumo de memória e CPU. |
| 2026-07-24 | Eliminação de N+1 Queries no Gráfico de Pulso | Unificadas as queries de assinaturas dos últimos 6 meses em uma única busca no banco de dados com Promise.all, seguida de agrupamento e cálculo síncronos na memória. |
| 2026-07-24 | Otimização de Distribuição de Verticais no Dashboard | Substituída a busca `findMany` global de lojas e agregação in-memory por uma query nativa `$queryRaw` do Postgres agrupada por vertical e cliente, evitando gargalo de memória. |
| 2026-07-24 | Tratamento de Erros Silenciados no Dashboard | Substituídos todos os blocos `catch` vazios por captura explícita do objeto de erro e registro via `this.logger.error()`, mantendo a degradação suave com observabilidade. |
| 2026-07-24 | Validação de Entrada de Datas no Dashboard | Ajustado o `GetDashboardSummaryQueryDto` para usar a validação `@IsDateString()` nos campos `startDate` e `endDate`, evitando crashes no backend decorrentes de datas malformadas. |
| 2026-07-24 | Remoção do Módulo de Alertas do Dashboard | Removida a propriedade `alerts` e a lógica de geração de alertas dinâmicos da API (backend) e do frontend (admin-web), eliminando o acoplamento de rotas físicas. |

| 2026-07-18 | PLAT-001 (Foundational) — expand de schema: `Store` ganha `personType`/`responsibleName`/`billingEmail`/`deploymentStatus`; `Plan` ganha `vertical`/`tier`/`maxNegocios`; `Subscription`/`Invoice`/`Member` ganham `storeId` nullable | 3 migrations (`store_billing_expand`, `store_billing_client_id_optional`, `store_billing_revert_client_id_required` — as duas últimas se cancelam, ver `specs/_platform/001-store-billing-unit/research.md` #7). `CreatePlanUseCase`/`ListPlansUseCase`/`PrismaPlanRepository` já filtram/persistem vertical+tier. `Client` continua obrigatório em `Store` até T015 (trabalho em andamento, ver `specs/_platform/001-store-billing-unit/tasks.md`) |
| 2026-07-18 | PLAT-001 (US1+US2 backend, T013–T019/T024/T026–T028) — `CreateStoreUseCase` reescrito sem `ClientRepository`, exige `planId`+`vertical` compatível, cria `Subscription`/`Invoice`s iniciais via `storeId`; `FindStoreByIdUseCase` retorna plano vigente + faturas; `Store.clientId`/`Subscription.clientId`/`Invoice.clientId` viram `String?` | 2 migrations novas (`store_billing_store_client_id_nullable`, `store_billing_subscription_invoice_client_id_nullable`). `UpdateStoreDto` deixou de ser um re-export de `CreateStoreDto` (ganhou classe própria). Todos os call sites de equipe/membro corrigidos via `requireStoreClientId`. 46/46 suítes, 189/189 testes, `tsc`/`eslint` limpos nos arquivos tocados. Pendente: T020–T023 (frontend admin-web) |
| 2026-07-18 | PLAT-001 (US4 backend, T044–T052) — `ChangeStorePlanUseCase` (`PATCH /v1/stores/:id/plan`), suspensão/reativação automática por inadimplência | `GenerateInvoicesUseCase` ganhou `suspendStoresWithOverdueInvoices()`: toda fatura `OPEN` cuja `checkPastDue()` transiciona para `PAST_DUE` chama `BlockStoreUseCase` (actor `system:billing`); `MarkInvoiceAsPaidUseCase` reverte via `UnblockStoreUseCase` quando a fatura paga estava `PAST_DUE`. **Bug real corrigido no caminho**: `GenerateInvoicesUseCase` nunca setava `storeId` na fatura gerada (só `clientId`) — faturas de lojas client-less (US1) nunca ficavam visíveis na aba Billing nem eram suspensas; agora `Invoice.create({..., storeId: sub.storeId})`. Dependência circular nova: `StoresModule` exporta `BlockStoreUseCase`/`UnblockStoreUseCase`; `InvoicesModule` importa `StoresModule` via `forwardRef` (mesmo padrão já usado com `ClientsModule`) — validado com boot real (`node dist/src/main.js`), sem erro de DI. `ChangeStorePlanUseCase` atualiza a `Subscription` ativa **in-place** via `Subscription.changePlan()` (não cancela/recria, não anula faturas antigas — preserva histórico, ao contrário do padrão usado em `UpdateClientUseCase`) |
| 2026-07-30 | PLAT-001 **Fase 10 (contract)** — módulo `clients` e model `Client` REMOVIDOS; `clientId` sai de `Store`/`Subscription`/`Invoice`/`Member`; `usesClientDocument` sai de `Store`; `storeId` vira NOT NULL em `Subscription`/`Invoice` | Migration `20260730040000_plat001_drop_client` com 3 guardas que **falham alto** em vez de perder dado: (1) assinatura/fatura sem `store_id`; (2) loja que herdava documento do cliente e não tem o próprio; (3) loja com 2+ assinaturas `ACTIVE`/`TRIALING`. **`gateway_customer_id` é COPIADO de `clients` para `stores` antes do `DROP TABLE`** — é o único elo do webhook do Asaas com a entidade local, e um webhook não tem como reclamar de "não achei". **`subscriptions_client_id_active_unique_idx` era SQL cru fora do schema Prisma**, então `migrate diff` não o mencionou e o `DROP COLUMN` o levaria em silêncio: recriado como `subscriptions_store_id_active_unique_idx` (sem ele a loja acumula assinatura ativa e é cobrada duas vezes). `members.store_id` também saiu — era escalar, nullable e sempre nula, enquanto o vínculo real é `store_members` (N lojas por membro). Removidos `scripts/backfill-store-billing.ts` e `scripts/report-legacy-client-store-counts.ts` (tipados contra `Client`); as guardas da migration cobrem o que eles verificavam |
| 2026-07-30 | PLAT-001 Fase 10 — reaproveitar membro entre lojas foi **removido** (`GET :id/team/available`, `POST :id/team/batch`, `PATCH /v1/clients/members/:id/assignments`) | O `Client` era a fronteira de tenant dessa feature. Sem ele, cada loja é um cliente independente: listar ou vincular membro de outra loja passaria dado de equipe entre negócios distintos. `UpsertStoreMemberUseCase` agora **recusa** e-mail/username já usado em outra loja, em vez de reaproveitar. Cota de usuários vem de `findActiveByStoreId` |
| 2026-07-30 | PLAT-001 Fase 10 — métricas de cliente do dashboard viraram **derivadas por loja** | `Client.status` (`ativo`/`inadimplente`/`bloqueado`/…) não tem equivalente em `StoreStatus`, que é operacional. `resolveBillingStatusCounts()` classifica cada loja com precedência explícita (bloqueada > inadimplente > ativa > sem assinatura) — sem precedência a soma das categorias infla o total e a distribuição do gráfico não fecha com a contagem. `topClients` = lojas mais recentes; `getTopDefaulters` agrupa por `storeId` (o TODO antigo descartava faturas sem cliente, ou seja, escondia inadimplência) |
| 2026-07-30 | PLAT-001 Fase 10 — validação de documento da `Store` passou a ser condicional à presença | `StoreValidatorFactory` roda também em `Store.with()`, ao hidratar do banco. Exigir documento ali fez **uma** linha incompleta devolver 500 em `GET /v1/stores` (incidente da Fase 0). Regra atual: "se houver documento, precisa ser válido"; obrigatoriedade de cadastro é do DTO da rota, onde a falha atinge só quem cadastra |
| 2026-07-30 | PLAT-001 Fase 10 — filtro `storeId` de `/v1/invoices/stats` ligado de verdade | O DTO aceitava `clientId` e o use case **descartava** o valor: filtrar por cliente devolvia as estatísticas de todas as lojas, sem erro. Agora `storeId` é repassado ao repositório |
| 2026-07-30 | **`GET /v1/stores/:storeId/vertical-team` (lista) removida; entrou `GET /v1/stores/:storeId/vertical-team/owner`** — port: `listMembers` → `findOwner` (`Promise<VerticalMember \| null>`); adapter filtra `organizationRole = 'OWNER'` do `GET /api/v1/members` da clínica e `resetOwnerPassword` reusa `findOwner`; `FakeVerticalMemberProvisioning` expõe `findOwnerCalls` | A aba "Membros" do admin saiu por decisão de produto (só o responsável é gerido pelo painel), deixando a listagem sem consumidor. Rota pública sem uso vira convite a reconstruir a tela errada. Contrato com `owner: null` para a tela separar "loja sem responsável" de "vertical fora do ar" |
| 2026-07-30 | **Credenciais do responsável da loja** — `POST /v1/stores/:storeId/vertical-team/owner/reset-password` (M2M `platform → vertical`) | Complementa a Fase 7: além de criar membro, o admin precisa conseguir entregar o primeiro acesso ao **responsável** que a vertical provisionou a partir de `owner.responsibleName`/`owner.billingEmail` do evento `store.created`. O adapter lista `GET /api/v1/members` da vertical, acha o `organizationRole = 'OWNER'` e encaminha o reset — o platform não guarda cópia de escrita desse membro. Novo `VerticalOwnerNotFoundError` para loja sem responsável (acontece quando o evento veio sem `responsibleName`) |
