# AGENTS.md — Imóveis API (@citybox/imoveis-api)

> **Para agentes de IA:** Este arquivo é a fonte de verdade do app `apps/imoveis/api`.
> Leia-o antes de qualquer ação neste escopo e atualize-o na mesma operação em que
> mudar stack, configuração, rotas ou padrões. Nunca remova seções — apenas atualize
> ou adicione. Contexto global: [`AGENTS.md`](../../../AGENTS.md) raiz.

---

## 1. Identidade do Módulo

| Campo                               | Valor                                                                            |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| **Nome**                            | `apps/imoveis/api` · pacote `@citybox/imoveis-api`                               |
| **Tipo**                            | NestJS 11 API REST                                                               |
| **Porta dev**                       | **3112**                                                                         |
| **Schema Postgres**                 | `imoveis`                                                                        |
| **Status**                          | 🟢 Leads + Properties + Appointments + Transactions + Finance + Dashboard + Search FTS + Reminders + Settings + Document templates + Public catalog + Google Calendar + **store-setup (citybox.store.*)** |
| **Última atualização deste arquivo**| 2026-08-21 — capa pública por `sortOrder`; PUT photos/order completa ids faltantes |

**Propósito em uma linha:** API backend da vertical de imóveis — gestão de propriedades,
corretores, negócios e integrações, sobre a plataforma Citybox.

---

## 2. Posição no Monorepo

```
apps/imoveis/
├── web/        ← frontend Next.js 16 (port 3111) — @citybox/imoveis-web
└── api/        ← esta API NestJS (port 3112) — @citybox/imoveis-api
```

Registrado no workspace via `apps/imoveis/*` no `pnpm-workspace.yaml`.

---

## 3. Stack e Versões

| Item                 | Versão / Valor             | Observação                                         |
| -------------------- | -------------------------- | -------------------------------------------------- |
| **NestJS**           | `catalog:` (11.x)          | `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/swagger` |
| **TypeScript**       | `^5.7.3`                   |                                                    |
| **Prisma**           | `7.8.0`                    | adapter `@prisma/adapter-pg`; schema em `prisma/schema.prisma` |
| **PostgreSQL**       | pg pool via `pg@^8`         | schema `imoveis`                                   |
| **Auth**             | Keycloak OIDC/JWT           | `jose@^5`; guard local — não usa `@nestjs/passport` |
| **Mensageria**       | `@citybox/messaging`        | consumer `imoveis.store-setup` no processo HTTP |
| **Validação**        | `class-validator` + `class-transformer` + `zod@^4` | Pipes globais em `main.ts` |
| **PDF**              | `handlebars` + `html-to-pdfmake` + `pdfmake` + `jsdom` | merge de tags + HTML restrito → PDF (sem Chromium) |
| **Testes**           | `jest@^30` + `ts-jest`     |                                                    |

---

## 4. Estrutura de Pastas

```
apps/imoveis/api/
├── prisma/
│   ├── schema.prisma         ← schema único, schema SQL = "imoveis"
│   ├── seed.ts               ← demo idempotente: comissão + catálogo CRM (`db:seed`; loja auto-detectada ou `SEED_STORE_ID`)
│   └── seed-demo-catalog.ts  ← 16 imóveis + 24 leads + 12 negócios/funil + transações + visitas (Ilhéus)
├── generated/
│   └── prisma/               ← cliente Prisma gerado (git-ignored; rodar db:generate)
├── src/
│   ├── main.ts               ← bootstrap, porta 3112, global prefix "api", Swagger
│   ├── app.module.ts         ← root module: PrismaModule + módulos de feature
│   │
│   ├── shared/               ← infra e core transversal (não depende de nenhum módulo)
│   │   ├── core/
│   │   │   ├── entity.ts               ← base Entity<T>
│   │   │   ├── use-case.interface.ts   ← IUseCase<Input, Output>
│   │   │   ├── errors/                 ← AppError → DomainError / ApplicationError / InfrastructureError / ValidatorDomainError
│   │   │   └── utils/
│   │   │       └── zod-utils.ts        ← ZodUtils.formatZodError()
│   │   └── infra/
│   │       ├── prisma/
│   │       │   ├── prisma.module.ts
│   │       │   └── prisma.service.ts   ← PrismaService (pg pool adapter)
│   │       ├── env/
│   │       │   └── load-env.ts         ← dotenv do `.env` local com override (dev:pick)
│   │       ├── keycloak/
│   │       │   └── keycloak-jwt.ts     ← verifyKeycloakJwt(), keycloakIssuers()
│   │       └── http/
│   │           ├── health.controller.ts
│   │           ├── auth/
│   │           │   └── authenticated-user.ts    ← AuthenticatedUser, formatAuditActor()
│   │           ├── guards/
│   │           │   ├── auth.guard.ts            ← valida JWT Keycloak
│   │           │   ├── imoveis-scope.guard.ts   ← JWT sub + X-Store-Id ↔ TeamMember
│   │           │   └── permission.guard.ts      ← CASL @RequirePermission(action, subject)
│   │           ├── decorators/
│   │           │   ├── public.decorator.ts      ← @Public() — bypass auth
│   │           │   ├── current-user.decorator.ts← @CurrentUser()
│   │           │   ├── store-id.decorator.ts    ← @StoreId() — header X-Store-Id
│   │           │   ├── skip-imoveis-scope.decorator.ts ← @SkipImoveisScope()
│   │           │   ├── imoveis-scope.decorator.ts ← @CurrentImoveisScope()
│   │           │   └── permissions.ts           ← CASL decorators + isPlatformAdmin
│   │           └── filters/
│   │               └── app-exception.filter.ts  ← AppError → HTTP status
│   │
│   └── modules/              ← um diretório por domínio/feature
│       └── leads/            ← CRM de leads (4 abas: info, imóveis, docs, atividades)
│       └── properties/       ← catálogo de imóveis (listagem + form web)
│       └── appointments/     ← agenda (compromissos; list por intervalo + CRUD; sync Google soft)
│       └── google-calendar/  ← OAuth2 Google Calendar por corretor + client googleapis
│       └── transactions/     ← negócios (CRUD draft, split, rental-payout, report)
│       └── finance/          ← commission-config, expenses, summary, commissions, rental-payouts
│       └── dashboard/        ← overview agregado (KPIs + chart + previews + reminders)
│       └── search/           ← FTS global (`GET /v1/search`)
│       └── reminders/        ← lembretes agregados (`GET /v1/reminders`; `buildReminders` compartilhado)
│       └── settings/         ← configurações da loja + perfil do corretor (foto/documentos MinIO)
│       └── document-templates/ ← modelos HTML + generate/preview PDF (MinIO + LeadDocument)
│           ├── leads.module.ts
│           ├── domain/
│           │   ├── entities/lead.entity.ts
│           │   ├── repositories/lead.repository.interface.ts
│           │   ├── mappers/lead-enum.mapper.ts   ← kebab (HTTP) ↔ snake (Prisma)
│           │   └── errors/lead-not-found.error.ts
│           ├── application/
│           │   └── use-cases/                    ← list, get, create, update, status, delete, sync-agent
│           └── infrastructure/
│               ├── database/
│               │   ├── prisma-lead.repository.ts
│               │   └── in-memory-lead.repository.ts  ← testes unitários
│               └── http/routes/
│                   ├── shared/                   ← lead-write.dto + lead-response.mapper
│                   ├── list-leads/               ← route + query + presenter
│                   ├── batch-create-leads/       ← POST /batch (import CSV)
│                   ├── get-lead-by-id/           ← route + presenter
│                   ├── create-lead/              ← route + dto + presenter
│                   ├── update-lead/
│                   ├── update-lead-status/
│                   ├── delete-lead/
│                   └── sync-agent-catalog-leads/ ← route + dto
│                       └── (1 ação = pasta; padrão platform-api)
├── Dockerfile
├── nest-cli.json
├── package.json
├── prisma.config.ts
├── tsconfig.json
└── tsconfig.build.json
```

---

## 5. Restrições Críticas

1. **Package manager:** apenas `pnpm`. Nunca usar `npm`/`yarn`.
2. **Geração Prisma:** após qualquer mudança no `prisma/schema.prisma`, rodar
   `pnpm --filter @citybox/imoveis-api db:generate` antes de compilar. O diretório
   `generated/` é git-ignored.
3. **Schema SQL:** todos os models no Prisma DEVEM ter `@@schema("imoveis")` e o
   datasource `schemas = ["imoveis"]`.
4. **Consumer no mesmo processo HTTP** — `StorePlatformConsumer` (fila
   `imoveis.store-setup`) sobe com a API. `IMOVEIS_WORKER_ENABLED=false` desliga só
   o consumer. Não há `main-worker.ts` separado.
5. **Auth:** nunca usar `@nestjs/passport`; o guard `AuthGuard` faz a verificação JWT
   diretamente com `jose`. O dev-bypass (`AUTH_DEV_BYPASS=true`) funciona apenas em
   `NODE_ENV !== 'production'`. Em bypass, token esperado: `Bearer dev-admin`.
6. **PrismaModule** deve ser importado em cada feature module — não é global.
7. **Enums Prisma** usam `snake_case` (`scheduled_visit`); HTTP/UI usam kebab-case
   (`scheduled-visit`) via mappers de enum no domain.
8. **HTTP obrigatório (padrão platform-api / admin):** **proibido** controller
   monolítico (`*.route.ts` com vários verbos) e **proibido** `@Body() body: unknown`
   + Zod no use case para validar HTTP. Toda ação nova DEVE seguir a seção 6.1.
9. **Testes de use case obrigatórios:** todo `*.use-case.ts` novo/alterado DEVE ter
   `*.use-case.spec.ts` ao lado, com repositório in-memory — ver §6.2.
10. **Fotos de imóvel = MinIO (padrão food):** upload multipart
    `POST /v1/properties/:id/photos` (máx. 4 MB, PNG/JPEG/WebP); download autenticado
    `GET …/photos/:photoId`; delete remove objeto + linha. **`PUT …/photos/order`**
    `{ photoIds }` — ordem preferida (ids faltantes vão ao fim); a 1ª vira capa (`sortOrder` 0). DB guarda **object key** em
    `property_photos.url` + `mime_type`. Máx. 20 fotos. Limite JSON 10 MB no `main.ts`
    permanece para metadados — **não** enviar data URL de foto no JSON.
11. **Documentos de imóvel = MinIO (mesmo padrão das fotos):** upload multipart
    `POST /v1/properties/:id/documents` (máx. 15 MB, PDF/DOC/DOCX, máx. 12 por imóvel);
    download autenticado `GET …/documents/:documentId`; delete remove objeto + linha.
    DB guarda `property_documents.object_key` + `mime_type` (`object_key` nulo = registro
    legado só com metadados, não visualizável). Validação por **assinatura binária**
    (`%PDF`, ZIP→docx, OLE2→doc) + extensão — o mime do browser não é confiável.
    **`documents` não faz parte do payload de create/update** (como `photoUrls`): a
    sincronização é feita pelos endpoints multipart/DELETE, e o `update` não mexe em
    documentos.
12. **Rodar em watch no dev** (`pnpm --filter @citybox/imoveis-api dev`). Subir via
    `start:prod` deixa o `dist/` defasado após novos módulos — sintoma: rota nova
    responde 404 `Cannot POST …` enquanto as antigas funcionam.
13. **Um único watcher por vez.** `nest start --watch` não tem retry: se a 3112 já
    estiver ocupada ele morre com `EADDRINUSE` e, dentro de um `turbo run dev`, a
    falha derruba as outras tasks do mesmo run (a web cai junto). Preferir o comando
    único da raiz `pnpm dev:imoveis`; antes de subir manualmente, checar
    `ss -tlnp | grep 3112`.
14. **FTS (`search_vector`):** colunas `Unsupported("tsvector")` em Lead/Property/
    Appointment/Transaction + `@@index(..., type: Gin)`. Triggers/`unaccent` ficam
    na migration SQL (não no schema Prisma). `CREATE EXTENSION unaccent` é
    **global no banco**: em `citybox_platform` a extensão costuma já existir no
    schema de outro app (ex.: `erp`), então `IF NOT EXISTS` é no-op e
    `imoveis.unaccent` nunca é criado. A sessão Prisma usa `search_path=imoveis`.
    Triggers DEVEM chamar `imoveis.unaccent(...)`. A migration
    `ensure_imoveis_unaccent` cria um wrapper `imoveis.unaccent(text)` apontando
    para a função real (qualquer schema). Não usar `ALTER EXTENSION SET SCHEMA`
    — o banco é compartilhado. Sem o wrapper, INSERT/UPDATE de lead (e
    imóvel/agenda/negócio) quebra com `function imoveis.unaccent(text) does not
    exist` (42883). Sem a qualificação, UPDATE (ex.: checkbox `done` na agenda)
    quebra com `function unaccent(text) does not exist`. Índices GIN devem
    estar no `schema.prisma` (`type: Gin`) — senão o próximo `migrate dev` os
    remove.
15. **Keycloak alinhado ao admin-api (`KEYCLOAK_INTERNAL_ISSUER`):** em dev o Admin REST
    do admin-api (CreateStore / senha provisória) grava no Keycloak **local** (`:8080`).
    `KEYCLOAK_ISSUER` / `NEXT_PUBLIC_*` da imoveis-api/web devem ser o mesmo host.
    `KEYCLOAK_ISSUER` público do admin-api (aplopes) é só para JWT de operadores.
16. **Dockerfile: workspace deps de build/runtime**:

    | Package | Stage `deps` | Build | Stage `runner` |
    | ------- | ------------ | ----- | -------------- |
    | `@citybox/messaging` | `packages/messaging/package.json` | `pnpm --filter @citybox/messaging build` | copiar pacote |
    | `@citybox/imoveis-permissions` | `apps/imoveis/permissions/package.json` | `pnpm --filter @citybox/imoveis-permissions build` | copiar pacote |

    **Ordem:** `messaging` → `imoveis-permissions` → `nest build`. Provisionamento
    Keycloak é **local** (`src/shared/infra/keycloak/`) — ADR C-17; **não** copiar
    `packages/nest-common` (pacote removido do monorepo).
    Sem messaging/permissions → `TS2307` no `docker build`.
    `main`/`types` de `imoveis-permissions` apontam para `dist/` — build **antes** do `nest build`.
17. **`multer` é dependência direta** — `MulterExceptionFilter` importa `MulterError` de
    `multer`. Com pnpm no Docker, transitivo via `@nestjs/platform-express` **não** fica
    resolvível no `node_modules` do app → crash `Cannot find module 'multer'` no boot.
    Manter `multer` em `dependencies` (não só `@types/multer`).
18. **JSON Prisma ≠ array de domínio:** `Transaction.splitOthers` / `rentalDeductions`
    são `Json`. Depois de `Array.isArray`, o TS ainda vê `JsonArray` (`JsonValue[]`,
    inclui `null`) — devolver o valor cru quebra o `nest start --watch` (TS2322) e
    a :3112 não sobe. Parsear em `parse-transaction-json.ts` (`toCommissionOthers` /
    `toRentalDeductions`).
19. **PDF de contrato = pdfmake, não Puppeteer:** o merge usa Handlebars (`{{lead.nome}}`);
    tag desconhecida vira string vazia; valores são escapados, o HTML do modelo não.
    Render: `html-to-pdfmake` + `pdfmake` (vfs de fontes). Sem Chromium. CSS complexo,
    `<script>` e layout A4 pixel-perfect ficam fora do v1.

---

## 6. Padrões de Código

### 6.1 HTTP — 1 ação = 1 pasta (OBRIGATÓRIO, alinhado à platform-api)

Referência canônica: `apps/admin/api/src/modules/users/infrastructure/http/routes/`.
Exemplo local: `modules/leads/infrastructure/http/routes/`.

```
infrastructure/http/routes/
├── shared/                         ← DTOs/mappers reutilizados entre ações (opcional)
│   ├── <feature>-write.dto.ts
│   └── <feature>-response.mapper.ts
└── <acao>/
    ├── <acao>.route.ts             ← @Controller fino: DTO → use case → presenter
    ├── <acao>.dto.ts               ← class-validator + @ApiProperty (body)
    ├── <acao>.query.ts             ← helpers de querystring (listagens)
    └── <acao>.presenter.ts         ← Entity → envelope HTTP
```

Regras:

| Obrigatório | Proibido |
| ----------- | -------- |
| Uma pasta por ação HTTP (`list-*`, `create-*`, `update-*`, …) | Um `*.route.ts` com vários `@Get/@Post/@Patch` |
| `@Body() dto: XxxDto` validado pelo `ValidationPipe` | `@Body() body: unknown` + Zod no use case |
| Presenter na pasta da rota (`XxxPresenter.toHttp`) | Use case retornar shape HTTP / `{ data }` |
| Use case retorna **entidade de domínio** (ou resultado de aplicação sem envelope HTTP) | Regra de negócio / mapeamento HTTP no controller |
| Registrar **cada** route class em `controllers: [...]` do module | Esquecer de registrar a pasta nova no module |

Fluxo:

```
HTTP → Route (DTO) → UseCase → Entity → Presenter.toHttp → { data } | { data, meta }
```

Listagens: envelope `{ data, meta: { total, page, perPage, totalPages } }` (política §8.1 raiz).

### 6.2 Testes de use case (OBRIGATÓRIO)

Todo use case em `application/use-cases/<acao>/` deve ter spec no mesmo diretório:

```
use-cases/<acao>/
├── <acao>.use-case.ts
└── <acao>.use-case.spec.ts   ← obrigatório
```

Regras:

| Sempre | Nunca |
| ------ | ----- |
| `*.spec.ts` ao lado do use case | Use case sem teste |
| Injetar repositório **in-memory** (`infrastructure/database/in-memory-*.repository.ts`) | Mock Prisma / banco real no unit |
| Assertar **entidade / resultado de aplicação** | Assertar envelope HTTP `{ data }` (isso é presenter) |
| Cobrir happy path + erros de domínio (`*NotFound`, filtros inválidos, store scoping) | Deixar use case novo sem spec |

Ao criar um módulo/ação novo: escrever o spec **junto** com o use case (TDD preferível).
Referência: `modules/leads/application/use-cases/*/`.

### Arquitetura em camadas (por módulo)

```
modules/<feature>/
├── <feature>.module.ts            ← NestJS module (wiring DI)
├── domain/
│   ├── entities/                  ← Entity<T> estendida + factory .create()
│   ├── repositories/              ← abstract class (DI token + interface)
│   └── errors/                    ← extends DomainError (mapeado para HTTP pelo filter)
├── application/
│   └── use-cases/<action>/        ← um diretório por caso de uso
│       └── <action>.use-case.ts   ← implements IUseCase<Input, Output> → Entity
└── infrastructure/
    ├── database/
    │   └── prisma-<feature>.repository.ts  ← extends abstract repository
    └── http/routes/               ← ver §6.1 (dto + presenter + route por ação)
```

### Repositório como DI token

```typescript
// domain/repositories/foo.repository.interface.ts
export abstract class FooRepository {
  abstract findAll(storeId: string): Promise<FooEntity[]>;
}

// no module.ts:
{ provide: FooRepository, useClass: PrismaFooRepository }
```

### Erros de domínio → HTTP

A hierarquia é `AppError → DomainError → ValidatorDomainError` e
`AppError → InfrastructureError`. O `AppExceptionFilter` mapeia automaticamente:

| Classe / nome                    | HTTP Status               |
| -------------------------------- | ------------------------- |
| `ValidatorDomainError`           | 422 Unprocessable Entity  |
| `DomainError` com `NotFound`     | 404 Not Found             |
| `DomainError` com `Duplicate`/`AlreadyExists` | 409 Conflict  |
| `DomainError` com `Forbidden`    | 403 Forbidden             |
| `DomainError` outros             | 422 Unprocessable Entity  |
| `InfrastructureError`            | 500 / 503                 |

### Permissões (CASL)

Package: `@citybox/imoveis-permissions`. Pipeline de guards (ordem em `app.module.ts`):

1. `AuthGuard` — JWT Keycloak
2. `ImoveisScopeGuard` — correlaciona `sub` + `X-Store-Id` com `TeamMember`; injeta `permissions` no request; link-on-first-login por e-mail; bypass `@SkipImoveisScope()` / sem header / `platform_admin`
3. `PermissionGuard` — `defineAbilityFor` + `@RequirePermission(action, subject)`

Exemplos: `@RequirePermission('read', 'Lead')`, `@RequirePermission('manage', 'Finance')`.
Deals (`/v1/deals/*`) usam subject `Lead`. Rotas de descoberta: `GET /v1/members/me` e
`GET /v1/members/roles` (`@SkipImoveisScope`, sem `@RequirePermission`).

Provisioning Keycloak no CRUD de equipe (`settings`): cópia local
`KeycloakProvisioningService` em `src/shared/infra/keycloak/` (ADR C-17) —
envs `KEYCLOAK_PROVISIONING_CLIENT_ID` / `KEYCLOAK_PROVISIONING_CLIENT_SECRET`
(compose: `imoveis-provisioning`).
Model `TeamMember`: `keycloakSub`, `username`, `hasPassword`.
Enum `TeamMemberRole`: `admin` | `broker` | `affiliated` | `assistant`
(labels: Administrador, Administrador/Corretor, Corretor filiado, Assistente;
`affiliated` defaults de permissão iguais a `broker`).
Lista de cargos exposta em `GET /v1/members/roles` via `IMOVEL_ROLES`.

**Remover/desativar membro ≠ desabilitar Keycloak.** Delete só apaga o `TeamMember` e
remove `vertical.imoveis.view` se o `sub` não tem mais nenhuma equipe Imóveis. **Nunca**
chama `setUserEnabled(false)` (isso derrubava login multi-app, ex. `admin@citybox.com`
na plataforma). Desativar localmente (`active: false`) também não desliga a identidade;
reativar pode reabilitar se a conta estiver off. Autorização: `ImoveisScopeGuard` + row
ativa.

### Paginação e busca

Seguir a política global (seção 8.1 do AGENTS.md raiz):
- Query params: `page`, `perPage`, `search`, `sortBy`, `sortOrder`
- Resposta: `{ data: T[], meta: { total, page, perPage, totalPages } }`
- Aplicar `skip`/`take` + `WHERE` no banco — nunca retornar tudo para paginar no cliente

---

## 7. Variáveis de Ambiente

| Variável                    | Padrão / Exemplo                                         | Obrigatória |
| --------------------------- | -------------------------------------------------------- | ----------- |
| `PORT`                      | `3112`                                                   | Não         |
| `DATABASE_URL`              | `postgresql://citybox:citybox@127.0.0.1:15433/citybox_platform?schema=imoveis` | **Sim** |
| `KEYCLOAK_ISSUER`           | `http://127.0.0.1:8080/realms/citybox-dev` (alinhar com admin-api `KEYCLOAK_INTERNAL_ISSUER`) | Não (tem default) |
| `KEYCLOAK_INTERNAL_ISSUER`  | mesmo que `KEYCLOAK_ISSUER` em dev local | Não |
| `KEYCLOAK_ADMIN_CLIENT_ID`  | `citybox-core-admin` (dev default no module)            | **Sim** em prod |
| `KEYCLOAK_ADMIN_CLIENT_SECRET` | `citybox-core-admin-dev-secret` (dev default)       | **Sim** em prod |
| `CORS_ORIGINS`              | `http://localhost:3111,http://127.0.0.1:3111`            | Não         |
| `NODE_ENV`                  | `development` / `production`                             | Não         |
| `AUTH_DEV_BYPASS`           | `true` (apenas dev)                                      | Não         |
| `AUTH_DEV_USERNAME`         | `admin`                                                  | Não         |
| `AUTH_DEV_EMAIL`            | `admin@citybox.local`                                    | Não         |
| `MINIO_ENDPOINT`            | `127.0.0.1:9000`                                         | Não (dev)   |
| `MINIO_ACCESS_KEY`          | `aplopes` (= `MINIO_ROOT_USER` de `infra/minio/.env`)     | **Sim** em prod |
| `MINIO_SECRET_KEY`          | `citybox-minio-dev`                                      | **Sim** em prod |
| `MINIO_USE_SSL`             | `false`                                                  | Não         |
| `MINIO_BUCKET`              | `citybox-imoveis`                                        | Não         |
| `SMTP_HOST`                 | dev: `127.0.0.1` (Mailpit) / prod: host SMTP             | **Sim** em prod; dev: `pnpm infra:up:mailpit` |
| `SMTP_PORT`                 | dev: `1025` / prod: `465`                                | Não         |
| `SMTP_SECURE`               | dev: `false` / prod: `true` se 465                       | Não         |
| `SMTP_USER` / `SMTP_PASS`   | (auth SMTP; vazio no Mailpit)                            | Não         |
| `SMTP_FROM`                 | `noreply@citybox.local` (dev)                            | **Sim** se `SMTP_HOST` set |
| `SMTP_FROM_NAME`            | `Citybox Imóveis`                                        | Não         |
| `MAIL_TRANSPORT`            | `log` \| `smtp`                                          | Não         |
| `LEADS_NOTIFY_EMAIL`        | CSV extras além do e-mail do corretor                    | Não         |
| `GOOGLE_CLIENT_ID`          | OAuth client Web (Google Cloud Console)                  | Sim p/ conectar Calendar |
| `GOOGLE_CLIENT_SECRET`      | secret do OAuth client                                   | Sim p/ conectar Calendar |
| `GOOGLE_REDIRECT_URI`       | `http://localhost:3112/api/v1/users/me/integrations/google-calendar/callback` | Sim p/ conectar |
| `GOOGLE_OAUTH_STATE_SECRET` | HMAC do `state` OAuth (default = `GOOGLE_CLIENT_SECRET`) | Não         |
| `IMOVEIS_WEB_URL`           | `http://localhost:3111` — redirect pós-callback Google + origem dos links públicos de documento (`/d/:token`) | Não         |
| `RABBITMQ_URL`              | `amqp://citybox:citybox@127.0.0.1:5672/citybox`          | **Sim** p/ provisionar lojas do admin |
| `RABBITMQ_EXCHANGE`         | `citybox.events`                                         | Não         |
| `RABBITMQ_DLX`              | `citybox.dlx`                                            | Não         |
| `IMOVEIS_WORKER_ENABLED`    | default on; `false` desliga só o consumer store-setup    | Não         |

> ⚠️ **`dev:pick` / turbo compartilham o env do shell.** `src/shared/infra/env/load-env.ts`
> carrega o `.env` desta app com `override: true`. Sem isso, um sibling (`admin-api`)
> exporta `DATABASE_URL=…/citybox_platform?schema=platform` e a imoveis-api aponta para
> o schema errado (`imoveis.processed_events does not exist`). Sem `DATABASE_URL` no
> processo, o `pg.Pool` cai em `127.0.0.1:5432` (nada escuta — provision 500). Sempre
> use o `.env` desta app (`citybox_platform?schema=imoveis`) e garanta `RABBITMQ_URL`
> (sem ela a fila `imoveis.store-setup` nem é declarada). Ao depurar:
> `tr '\\0' '\\n' < /proc/<pid>/environ | grep DATABASE_URL`.

Dev local: DB `citybox` (criar se ausente) + schema `imoveis`. Header `X-Store-Id`
obrigatório nas rotas store-scoped (ex.: `dev-store-imoveis`). Bucket MinIO
`citybox-imoveis` criado pelo `minio-init` (`infra/minio`) — suba o MinIO
(`docker compose -f infra/minio/docker-compose.yml up -d`) antes de usar fotos, e mantenha
`MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY` iguais a `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD` do
`infra/minio/.env`; credencial divergente resulta em `503 StorageUnavailableError`.

**Alertas de lead (catálogo):** após `POST …/leads` público:
1. Cria o lead no painel.
2. Envia e-mail com **nome, telefone, e-mail, imóvel e mensagem** do visitante.
3. Destinos: `TeamMember.email` do slug + `LEADS_NOTIFY_EMAIL` (e em dev, `AUTH_DEV_EMAIL` se não houver nenhum).
4. Flags loja `emailEnabled` + `leadsAlerts` (default `true`). Falha de e-mail **não** aborta o lead.
5. **Dev:** Mailpit (`pnpm infra:up:mailpit`) — caixas em http://127.0.0.1:8025 . **Prod:** SMTP real (`SMTP_*`).

**Google Calendar (por corretor):** credenciais OAuth em env (`GOOGLE_*`). Callback é `@Public()`
(Google redireciona sem JWT); `state` HMAC amarra `storeId`+`agentId`. No callback,
`exchangeCodeAndConnect` **sempre grava `googleCalendarEnabled=true`** + refresh token
em `agent_profiles`, valida a persistência e **dispara carga inicial em background**
(`syncExistingAppointmentsForAgent`: **passados + futuros** com `googleEventId` null,
máx. 200). Redirect pós-OAuth: `/calendar?connected=true|error`.
Scope OAuth: `https://www.googleapis.com/auth/calendar.events` (`access_type=offline`,
`prompt=consent`). Eventos usam wall-clock `America/Bahia` + `timeZone` em `events.insert`/`update`.
Create/update/delete de agenda sincronizam no calendar do **agentId do compromisso**
(soft-fail + **logs detalhados** `[sync]` / `[OAuth]` / `[callback]` / `[historical-sync]`).
Sem `refresh token` ou `enabled=false`, o skip também é logado — não aborta o CRUD.

---

## 8. Scripts

```bash
# Desenvolvimento
pnpm dev:imoveis                                     # (raiz) imoveis-api + imoveis-web juntos
pnpm --filter @citybox/imoveis-api dev               # nest start --watch, porta 3112

# Build
pnpm --filter @citybox/imoveis-api build             # nest build → dist/

# Qualidade
pnpm --filter @citybox/imoveis-api typecheck         # tsc --noEmit
pnpm --filter @citybox/imoveis-api lint              # eslint src/**/*.ts --fix
pnpm --filter @citybox/imoveis-api test              # jest

# Banco
pnpm --filter @citybox/imoveis-api db:generate       # prisma generate
pnpm --filter @citybox/imoveis-api db:migrate:dev    # prisma migrate dev
pnpm --filter @citybox/imoveis-api db:migrate:deploy # prisma migrate deploy
pnpm --filter @citybox/imoveis-api db:migrate:status # prisma migrate status
pnpm --filter @citybox/imoveis-api db:seed           # catálogo demo idempotente (loja em team_members ou SEED_STORE_ID)
```

---

## 9. Módulos Implementados

| Módulo   | Endpoints | Status |
| -------- | --------- | ------ |
| `leads`  | `GET/POST /api/v1/leads` | ✅ list (`search`/`status`/…; **`resolveScopedAgentId`** — corretor só os próprios) + create (`paymentIntents` opcional: `cash`/`financing`/`fgts`/`trade-in`, multi-select) |
|          | `POST /api/v1/leads/batch` | ✅ importação CSV — body `{ leads: [{ name, phone?, email?, notes? }] }`; store + corretor da sessão; defaults status `new` / origem `walk-in`; retorna `{ successCount, skippedCount }` (máx. 500) |
|          | `GET/PATCH/DELETE /api/v1/leads/:id` | ✅ detalhe (+ `activeDeal` do negócio CRM **ativo ou ganho** via `FindPipelineDealByLeadUseCase`) + update + delete |
|          | `PATCH /api/v1/leads/:id/status` | ✅ troca de status + activity; **`cancelled`** → `SyncActiveDealForLead` cancela deal ativo, cancela transação aberta (`DRAFT`/`PROPOSAL`/`CONTRACT_SIGNED`) e reabre imóvel (`available`) se ninguém mais o prender |
|          | `PUT /api/v1/agents/:agentId/leads` | ✅ sync catálogo do corretor |
|          | `POST /api/v1/leads/:id/documents` | ✅ multipart MinIO (PDF/DOC/DOCX, máx. 15 MB; `kind` contract/other; contrato + imóvel → `contract_sent`) |
|          | `GET /api/v1/leads/:id/documents/:documentId` | ✅ stream autenticado (`objectKey`; 404 se só metadados) |
|          | `POST /api/v1/leads/:id/documents/:documentId/send-whatsapp` | ✅ gera token TTL 48h, grava `sentAt`/`sentChannel=whatsapp`, activity; retorna `shareUrl` (`/d/:token`) + `whatsappUrl` (não é o gatilho do funil) |
| `properties` | `GET/POST /api/v1/properties` | ✅ list (**escopo corretor** via `resolveScopedAgentId`) + create |
|              | `GET/PATCH/DELETE /api/v1/properties/:id` | ✅ detalhe + update + delete |
|              | `POST/GET/DELETE /api/v1/properties/:id/photos[/:photoId]` | ✅ MinIO multipart (PNG/JPEG/WebP, máx. 4 MB, **20**/imóvel) |
|              | `PUT /api/v1/properties/:id/photos/order` | ✅ `{ photoIds }` ordem preferida (completa o restante); 1ª = capa |
|              | `POST/GET/DELETE /api/v1/properties/:id/documents[/:documentId]` | ✅ MinIO multipart (PDF/DOC/DOCX, máx. 15 MB, 12/imóvel) |
|              | `PUT /api/v1/agents/:agentId/properties` | ✅ sync catálogo do corretor |
| `appointments` | `GET/POST /api/v1/appointments` | ✅ list por `from`/`to` (**escopo corretor**; `excludeAgentId` só admin) + create (`agentId` do body só honorado para admin/dono; corretor = scope; sync Google soft) |
|                | `GET/PATCH/DELETE /api/v1/appointments/:id` | ✅ detalhe + update (mesma regra de agentId no write) + delete (sync/remove evento Google soft-fail) |
| `google-calendar` | `GET /api/v1/users/me/integrations/google-calendar` | ✅ status (`connected`/`enabled`/`configured`) do corretor da sessão |
|                   | `GET /api/v1/users/me/integrations/google-calendar/auth-url` | ✅ URL OAuth2 (`access_type=offline`, scope `calendar.events`) |
|                   | `GET /api/v1/users/me/integrations/google-calendar/callback` | ✅ `@Public()` — troca `code` por refresh token, **agenda carga inicial em background** (passados+futuros sem `googleEventId`), redirect **`/calendar?connected=true`** |
|                   | `POST /api/v1/users/me/integrations/google-calendar/sync` | ✅ carga inicial / re-sync: até 200 compromissos **passados e futuros** sem `googleEventId` do `agentId` da sessão |
|                   | `DELETE /api/v1/users/me/integrations/google-calendar` | ✅ desconecta (limpa token do `AgentProfile`) |
| `deals` | `GET/POST /api/v1/deals` | ✅ list (**escopo corretor**, `perPage` máx. **500** p/ kanban) + create; lista enriquece `transactionId` por `deal_id` e, se faltar, pela transação mais recente do `leadId` (não cancelada) |
|         | `GET/PATCH/DELETE /api/v1/deals/:id` | ✅ detalhe + update + delete |
|         | `PATCH /api/v1/deals/:id/stage` | ✅ avanço de etapa do funil; `awaiting_property` → desvincula imóvel do deal **e** do lead (`matchedProperties`/`propertyName`), cancela transação aberta e reabre imóvel; `handover` → `status=won` + lead `closed-won` + bloqueio do imóvel (`sold-out`/`occupied`) via transação vinculada **ou, sem transação, via `propertyId`/`type` do próprio deal** (`type` nulo assume venda) |
| `transactions` | `GET/POST /api/v1/transactions` | ✅ list (**escopo captador/vendedor**) + create (grava `deal_id`; avança deal → `contract_signed`; imóvel → `reserved`; rejeita duplicata e imóvel indisponível; **negociação concluída gera negócio novo** — deal `won`/`cancelled` **ou** deal `active` com transação vinculada `COMPLETED`/`CANCELLED` — ver §10) |
|                | `GET /api/v1/transactions/report` | ✅ agregado por período (`from`/`to`; **escopo corretor**) |
|                | `GET /api/v1/transactions/:id` | ✅ detalhe + `activityLog` + `dealId` |
|                | `GET /api/v1/transactions/:id/documents` | ✅ pacote lead+imóvel (dedupe `object_key`) + checklist venda/locação (`pending`/`attached`/`sent`) |
|                | `PATCH /api/v1/transactions/:id/split` | ✅ comissão + split (soma 100%) + activity |
|                | `PATCH /api/v1/transactions/:id/status` | ✅ `COMPLETED` \| `CANCELLED`; **`COMPLETED`** → deal `payment_confirmed`; **`CANCELLED`** reverte deal + reabre imóvel (`available`) se não houver outra transação ativa |
|                | `PATCH /api/v1/transactions/:id/rental-payout` | ✅ status de repasse + timestamps; **`PAID_BY_TENANT`** → deal `payment_confirmed` |
| `finance` | `GET/PUT /api/v1/finance/commission-config` | ✅ config global + overrides por corretor |
|           | `GET/POST /api/v1/finance/expenses` | ✅ list + create |
|           | `DELETE /api/v1/finance/expenses/:id` | ✅ remove |
|           | `GET /api/v1/finance/summary` | ✅ KPIs (`organizationType`; **actorAgentId forçado** no corretor) |
|           | `GET /api/v1/finance/commissions` | ✅ comissões pessoais (**agentId forçado** no corretor) |
|           | `GET /api/v1/finance/rental-payouts` | ✅ filas de repasse de locação |
| `dashboard` | `GET /api/v1/dashboard/overview` | ✅ KPIs + performance + deals + listings/leads + reminders; **escopo do corretor** (não-admin); **módulos CASL** (`modules`); `organizationType` + `period?` |
| `search` | `GET /api/v1/search` | ✅ FTS (`q`, `perType?`; **agentId forçado** no corretor) |
| `reminders` | `GET /api/v1/reminders` | ✅ follow-ups + agenda + **novos leads** `website`/`whatsapp` (status `new`, 7 dias; **agentId forçado** no corretor) + **documentos** se `documentsAlerts`: contrato sem envio, enviado sem assinatura (3 dias), cliente enviou anexo |
| `store-setup` | consumer fila `imoveis.store-setup` (`citybox.store.#`) | ✅ `HANDLED_VERTICALS=['Imóveis']`; `created`/`updated` → `EnsurePlatformStoreOwner` (Keycloak `vertical.imoveis.view` + `TeamMember` admin **sem senha**) + callback `provisioning.completed`/`failed`; `plan_changed`/`suspended`/`reactivated` = no-op log; dedupe via `ProcessedEvent` |
| `settings` | `GET /api/v1/platform/stores/:storeId/owner` | ✅ M2M admin (`@RequirePlatformAdmin` + `@SkipImoveisScope`) — `TeamMember` admin ativo no shape `VerticalMember` |
|            | `POST /api/v1/platform/stores/:storeId/owner/reset-password` | ✅ M2M — senha provisória Keycloak (`username` + `provisionalPassword`) |
| `settings` | `GET /api/v1/settings/store` | ✅ sistema + notificações da loja (get-or-create; **sem** CASL Settings — qualquer membro da loja; `system.whatsappCatalogEnabled` + `system.leadFormCatalogEnabled`) |
|            | `PUT /api/v1/settings/store` | ✅ sistema + notificações + integrações (`manage` Settings; inclui `whatsappCatalogEnabled` e `leadFormCatalogEnabled`) |
|            | `PUT /api/v1/settings/store/notifications` | ✅ só notificações (qualquer membro da loja; preserva system/integrações) |
|            | `GET/PUT /api/v1/settings/profile/:agentId` | ✅ perfil do corretor (get-or-create; seed a partir do `TeamMember` se vazio; PUT campos textuais; **próprio agentId sem checkbox Settings**) |
|            | `POST/GET/DELETE /api/v1/settings/profile/:agentId/photo` | ✅ foto do perfil em MinIO (PNG/JPEG/WebP, máx. 4 MB; limite Multer → mensagem `Imagem deve ter no máximo 4 MB`) |
|            | `PUT/GET/DELETE /api/v1/settings/profile/:agentId/legal-documents/:kind` | ✅ documento legal por tipo (`license`\|`employment`\|`insurance`) em MinIO (PDF/DOC/DOCX, máx. 15 MB) |
|            | `GET /api/v1/settings/profile/:agentId/documents` | ✅ pastas manuais + espelho legal + **espelho de docs de leads** (`other`→`client`, `contract`→`signed`) e imóveis (`property`) da carteira (somente leitura; `path` no download de imóvel) |
|            | `GET /api/v1/settings/users` | ✅ listagem de equipe — **CASL any**: `Team` **ou** `Lead` **ou** `Transaction` (corretor sem checkbox `users` ainda designa colegas em leads/negócios) |
| `document-templates` | `GET/POST /api/v1/document-templates` | ✅ list (§8.1 `page`/`perPage`/`search`/`tipo`) + create (`manage` Settings) |
|                      | `GET /api/v1/document-templates/variables` | ✅ catálogo de tags Handlebars |
|                      | `POST /api/v1/document-templates/defaults` | ✅ seed idempotente por tipo (7 modelos) |
|                      | `GET/PATCH/DELETE /api/v1/document-templates/:id` | ✅ detalhe + update + delete |
|                      | `POST /api/v1/documents/preview` | ✅ HTML interpolado (sem persistir; exige um de `leadId`/`appointmentId`/`transactionId`) |
|                      | `POST /api/v1/documents/generate` | ✅ PDF pdfmake + MinIO + `LeadDocument` + `SyncActiveDealForLead` (gerar contrato com imóvel avança `contract_sent`; UI de gerar modelo **não** está ligada no web) |
|                      | `GET /api/v1/documents/:id` | ✅ stream do PDF gerado |
| `public` | `GET /api/v1/public/stores/:storeId/agents` | ✅ índice de corretores ativos (sitemap / single-store) |
|          | `GET /api/v1/public/stores/:storeId/agents/:slug` | ✅ perfil sanitizado + `accentColorId` das configurações da loja (`@Public()`; 404 se `team_members` inativo/inexistente) |
|          | `GET /api/v1/public/stores/:storeId/agents/:slug/listings` | ✅ imóveis **`available`** com `agentId` = slug (paginados; default `perPage` **8**) |
|          | `POST /api/v1/public/stores/:storeId/agents/:slug/leads` | ✅ captura pública + **alerta e-mail** (`SMTP_*` / log; flags `emailEnabled`/`leadsAlerts`) |
|          | `GET /api/v1/public/stores/:storeId/listings/:listingId?agentSlug=` | ✅ detalhe se `available`; com `agentSlug` exige ownership; **sem** `agentSlug` = link curto loja (web `/p/:id`) |
|          | `GET /api/v1/public/stores/:storeId/agents/:slug/photo` | ✅ foto do corretor (stream MinIO, cache público) |
|          | `GET /api/v1/public/stores/:storeId/listings/:listingId/photos/:photoId` | ✅ foto do imóvel (stream MinIO; imóvel visível no catálogo) |
|          | `GET /api/v1/public/agents/:slug` (+ `/listings`, `/photo`, `POST /leads`) | ✅ **multi-loja** — resolve `storeId` no banco via `TeamMember.agentId` (web `/agents/:slug`) |
|          | `GET /api/v1/public/listings/:listingId` (+ `/photos/:photoId`) | ✅ **multi-loja** — id UUID global (web `/p/:id`); **detalhe** inclui `mapCoordinate` (`"lat, lng"`); listagem não |
|          | `GET /api/v1/public/documents/:token` | ✅ stream do PDF/DOC do lead (token TTL 48h; rate limit do catálogo; 404 se expirado; **não** grava `viewedAt`) |
|          | `POST /api/v1/public/documents/:token/ack` | ✅ `@Public()` + rate limit; grava `LeadDocument.viewedAt` uma vez |
| `health` | `GET /api/health` | ✅ liveness |
|          | `GET /api/health/ready` | ✅ readiness |

> **Swagger:** `http://localhost:3112/api/v1/docs`

**Prisma (schema `imoveis`):** `Lead` (+ agents/matched/documents/activities/**deals**; **`paymentIntents`** `LeadPaymentIntent[]` default `[]`, migration `lead_payment_intents` — kebab HTTP `trade-in` ↔ Prisma `trade_in`);
`LeadDocument.kind` (`contract`\|`other`, migration `lead_document_kind`) — `contract` + imóvel vinculado avança o deal para `contract_sent` no sync; `sentAt` só registra envio WhatsApp;
`LeadDocument` também: `object_key`/`mime_type` (upload MinIO; `generated_document_id` saiu na migration `drop_document_templates`); `sent_at`/`sent_channel` (`whatsapp`\|`share`\|`link`); `share_token` único + `share_expires_at` (TTL 48h);
`DocumentTemplate` + `GeneratedDocument` (tipos kebab HTTP ↔ snake Prisma; status `rascunho`/`gerado`);
`matchedProperties` na resposta HTTP inclui `coverPhotoUrl` (1ª foto do `Property`, join na leitura — não persiste em `lead_matched_properties`);
`Property` (+ photos e documents com object key MinIO/`mime_type`, activeLeads, **deals**);
`Appointment` (`starts_at`/`ends_at` timestamptz, `agent_id`, FKs opcionais `lead_id`/`property_id` + snapshot lead, enum `AppointmentKind`, **`google_event_id` único opcional**);
`AgentProfile` também: `google_calendar_enabled`, `google_refresh_token` (nunca HTTP), `google_calendar_id` (default `primary`) — migration `google_calendar_agent`;
**`Deal`** (funil CRM, migration `add_deals`): 1 Lead → N Deals; FK opcional `property_id`; enums `DealStatus` (`active`/`won`/`cancelled`) e `DealStage` (`awaiting_property` … `handover`); `type` opcional reutiliza `TransactionType`; sem rotas HTTP ainda;
`Transaction` (+ `TransactionActivity` append-only; FKs opcionais lead/property `onDelete: SetNull`; **`deal_id` único opcional** → `Deal`;
JSON `splitOthers` / `rentalDeductions`; enums `TransactionType`/`TransactionStatus`/`TransactionPaymentMethod`/`SplitSource`/`RentalPayoutStatus`; coluna obrigatória `payment_method` na criação — origem do pagamento previsto, sem integração PSP);
`CommissionConfig` (1/store) + `CommissionAgentOverride`; `Expense`;
`StoreSettings` (1/store) + `AgentProfile` (único por `storeId`+`agentId`) +
`AgentLegalDocument` (único por `profileId`+`kind`, enum `AgentLegalDocKind`).

**Negócios / financeiro:** create orquestra Property+Lead+commission-config (`resolveDefaultSplit`);
create rejeita imóvel com `status !== available` (`PropertyUnavailableError` → 409), **exceto** `reserved` quando o imóvel já está linkado ao lead (`matchedProperties`) ou ao deal (`propertyId`) — promoção do funil com imóvel em espera.
Fluxo CRM: `POST /v1/transactions` (com `dealId`) registra proposta/fatura, exige `paymentMethod` (`cash`|`financing`|`fgts`|`trade-in` — mesmo catálogo do lead), marca imóvel como `reserved` e mantém deal em `contract_signed`;
`PATCH …/status` `COMPLETED` (venda) ou repasse `PAID_BY_TENANT` (locação) → deal `payment_confirmed` **e** imóvel `sold-out`/`occupied`;
`PATCH /v1/deals/:id/stage` `handover` → deal `won`, lead `closed-won` (imóvel já bloqueado no pagamento ou, sem transação, na própria entrega via `deal.propertyId`/`type`);
`PATCH …/status` `CANCELLED` reverte deal de `payment_confirmed`/`handover` para `contract_signed` e reabre imóvel (`available`) se não houver outra transação ativa no mesmo imóvel.
**Desistência do lead** (`PATCH /v1/leads/:id/status` → `cancelled`, ou update com status `cancelled`): `SyncActiveDealForLeadUseCase` aplica `applyLeadCancelSideEffects` — deal → `cancelled`, transação aberta → `CANCELLED`, imóvel → `available` (mesma regra de reabertura).
Listagem e report no backend (§8.1).
Finance agrega `TransactionRepository` + expenses.
Seed: commission-config default (6%, split 40/30/30) em `dev-store-imoveis`.

Object storage: `StorageModule` global (`MinioObjectStorage`, bucket `citybox-imoveis`);
keys `{storeId}/properties/{propertyId}/photos/{photoId}.{ext}`,
`{storeId}/properties/{propertyId}/documents/{documentId}.{ext}`,
`{storeId}/leads/{leadId}/documents/{documentId}.{ext}` (upload manual e PDF gerado com lead),
`{storeId}/documents/{documentId}.pdf` (PDF gerado sem lead),
`{storeId}/settings/profiles/{agentId}/photo.{ext}` e
`{storeId}/settings/profiles/{agentId}/legal/{kind}/{documentId}.{ext}`.

**Settings:** `GET /v1/settings/store` e `GET …/profile/:agentId` são **get-or-create** —
a primeira leitura persiste a linha (padrões do web: `America/Sao_Paulo`, `BRL`, `pt-BR`,
`accentColorId=orange`, 2FA obrigatório, alertas de documentos desligados). O GET store
não exige checkbox Settings (bootstrap de accent + aba Notificações do corretor);
`PUT /v1/settings/store` exige `manage` Settings; corretores usam
`PUT /v1/settings/store/notifications` para só alertas. Rotas do perfil
(`/v1/settings/profile/:agentId/**`) autorizam o **próprio** `ImoveisScope.agentId` sem
checkbox Settings; outro corretor exige `read`/`manage` Settings. Perfil vazio preenche
nome/e-mail/telefone/papel a partir do `TeamMember`. `GET /v1/members/me` inclui `agentId`
e `memberId` por loja. O `PUT` do perfil grava **apenas** os campos textuais; foto e
documentos legais têm rotas multipart próprias, no mesmo padrão de fotos/documentos de
imóvel (validação por assinatura binária, reuso de `ImageFileValidator` /
`DocumentFileValidator` / `ImoveisObjectKeyPolicy` do módulo `properties`). A resposta
devolve `photoUrl` e `legalDocuments[].path` como **paths relativos autenticados**
(`/v1/settings/profile/{agentId}/photo`), resolvidos no web por `imoveisFetchBlob`.
Reenviar um documento do mesmo `kind` substitui o anterior (linha + objeto no MinIO).

**Agenda — wall-clock:** apresentação HTTP em `date` + `startTime`/`endTime` no fuso
`America/Bahia`; escrita aceita ISO em `startsAt`/`endsAt`. Listagem exige `from`/`to`
(`YYYY-MM-DD`); filtros `agentId` / `excludeAgentId` / `kind` / `done` (`true|false`;
omitido = ambos). Overlap permitido.
Marked days e reminders da tela de agenda são calculados no web a partir da listagem.

**Lembretes da sidebar de leads (§8.1):** as contagens vêm do backend, não de filtro no
cliente — `GET /v1/leads?followUpUntil=<hoje>&status=new,negotiating,scheduled-visit`
(retorno devido; `nextFollowUp` não nulo e `<=` data) e
`GET /v1/appointments?kind=visit&done=false` na janela de 7 dias. O web usa `meta.total`
para o número e a 1ª página só para os avatares.

---

## 10. Decisões de Arquitetura

| Decisão | Justificativa |
| ------- | ------------- |
| Arquitetura em camadas (domain / application / infrastructure) | Mesma adotada em `food-api` e `platform-api` — separação clara de responsabilidades, testabilidade e expansão sem acoplamento |
| Repositório como abstract class (não interface TS) | Permite uso como token de DI no NestJS sem `InjectionToken` extra |
| **HTTP = platform-api:** 1 pasta/ação com `route` + `dto` + `presenter` | Mesmo contrato mental do admin; controllers finos; validação na borda; use case sem envelope HTTP |
| Modelo relacional completo para leads (não JSON blob) | Espelha abas do form web; facilita filtros, sync de catálogo e futura API de documentos |
| **`Lead.paymentIntents` e `Transaction.paymentMethod` de criação:** o mesmo catálogo (`cash`/`financing`/`fgts`/`trade-in`; kebab HTTP `trade-in` ↔ Prisma `trade_in`). PIX/TED/boleto etc. continuam no enum só para negócios já gravados. | Qualificação e fechamento falam a mesma língua; liquidação (PIX/TED) saiu do dropdown de criação |
| **Lead follow-up → agenda:** create/update lead com `nextFollowUp` + agente cria/atualiza `Appointment` kind `follow-up` (09–10h Bahia; título = nome; descrição = notas truncadas); **soft-sync Google Calendar** do corretor (upsert no create/update; delete ao limpar data/agente) | Compromisso na agenda e no Google sem passo extra no web |
| Consumer store-setup no processo HTTP (padrão ERP) | Loja Imóveis no admin precisa de OWNER + callback; processo `main-worker` separado fica fora de escopo |
| M2M `platform/stores/:id/owner*` | Paridade com ERP — admin card "Gerar senha" via `IMOVEIS_API_URL`; `azp===KEYCLOAK_ADMIN_CLIENT_ID` promove a `platform_admin` |
| M2M `POST platform/stores/:id/provision` | Provision on demand (admin): cria store+OWNER+senha provisória; consumer `store.created` não provisiona mais |
| **Transação sobre negociação concluída = negócio novo:** no create, deal resolvido (`dealId` explícito ou ativo do lead) que já encerrou a negociação não reusa nem falha por duplicata — o use case **cria um `Deal` novo** (stage `contract_signed`, status `active`, vínculo ao imóvel/lead/agente) e grava a transação nele. Negociação encerrada = deal com `status !== 'active'` (won/cancelled) **ou** deal `active` cuja transação vinculada está `COMPLETED`/`CANCELLED` | Um lead pode comprar/alugar mais de um imóvel; o deal do negócio anterior continua fechado no kanban e a duplicata só vale para negociação em aberto (transação `PROPOSAL`/`CONTRACT_SIGNED`/`DRAFT` no mesmo deal) |
| `@prisma/adapter-pg` com pool externo | Consistente com food-api; evita conexões sem pool em serverless/multi-instância |
| Sem `@nestjs/passport` | Auth JWT feita diretamente com `jose` — mais simples, sem deps extras, consistente com food-api |

---

## 11. Contexto para a IA

- **Antes de criar endpoint:** ler §5.8 e §6.1 deste arquivo. Copiar pasta de
  `leads/.../routes/<acao>/` ou `platform-api/.../users/.../routes/<acao>/`.
- **`generated/prisma/client`** não existe antes de `db:generate` — TypeScript vai reclamar
  até rodar. É esperado em CI/CD (o Dockerfile faz o generate antes do build).
- **Headers obrigatórios:** `Authorization: Bearer <token>` em todas as rotas (salvo
  `@Public()`); `X-Store-Id: <uuid>` onde o decorator `@StoreId()` for usado.
- **Dev bypass:** `AUTH_DEV_BYPASS=true` + `Authorization: Bearer dev-admin`.
- **Testes:** todo use case DEVE ter `*.use-case.spec.ts` ao lado (§5.9 / §6.2),
  com repositório in-memory; assertam **entidade**, não o envelope HTTP.

---

## 12. Histórico de Mudanças Estruturais

| Data | Mudança | Impacto |
| ---- | ------- | ------- |
| 2026-08-21 | **Mapa no detalhe público + ciclo visualizado/assinado:** `mapCoordinate` só em `mapPublicListingDetail`; `LeadDocument.viewedAt` (migration `20260821150000`); `POST /v1/public/documents/:token/ack`; WhatsApp aponta `/d/:token` | GET do arquivo não conta visualização (crawler); assinar = `PATCH /v1/deals/:id/stage` → `contract_signed` |
| 2026-08-21 | **Capa do catálogo público:** `coverPhotoUrl` / `photoUrls` usam fotos ordenadas por `sortOrder`; `PUT …/photos/order` completa ids faltantes em vez de exigir permutação | Trocar capa no painel passa a refletir nos cards `/agents/:slug` |
| 2026-08-21 | **Pacote no negócio + lembretes:** `GET /v1/transactions/:id/documents`; reminders gated por `documentsAlerts` | Checklist venda/locação na ficha do negócio; sino alerta contrato sem envio/assinatura |
| 2026-08-21 | **Aba Documentos do lead volta ao upload simples** (contrato / outros); removidos reuso do imóvel/perfil, pedido ao cliente e página `/enviar-documento` | Funil segue ao anexar `kind=contract` + imóvel |
| 2026-08-21 | **Funil de contrato restaurado:** anexar `kind=contract` (upload / reuso do imóvel) + imóvel volta a avançar para `contract_sent`; WhatsApp só entrega o link | UI sem “Gerar a partir de modelo” (tabela `document_templates` dropada) |
| 2026-08-20 | **Intenção de pagamento no lead + alinhamento do fechamento:** enum `LeadPaymentIntent` + `payment_intents`; o dropdown de criação de negócio usa o mesmo catálogo (`trade_in` em `TransactionPaymentMethod`) | Qualificação e modal de fechamento com os mesmos 4 meios |
| 2026-08-19 | **Gerador de documentos:** models `DocumentTemplate`/`GeneratedDocument`; `LeadDocument.object_key`; CRUD `/v1/document-templates`; preview/generate/stream `/v1/documents*`; merge Handlebars + PDF pdfmake (sem Chromium); upload/stream de docs do lead | Contratos/termos/recibos a partir de modelo; funil `contract_sent` no generate de contrato |
| 2026-08-19 | **JSON Prisma de transação:** `splitOthers`/`rentalDeductions` passam por `parse-transaction-json.ts` — `Array.isArray` não estreita `JsonArray` para o tipo de domínio | Corrige TS2322 no watch (`nest start --watch` não subia a :3112) |
| 2026-08-18 | **Seed demo CRM:** `seed.ts` auto-detecta a loja em `team_members` (ou `SEED_STORE_ID`); catálogo idempotente em `seed-demo-catalog.ts` — 16 imóveis, 24 leads, 12 negócios no funil (todas as etapas), transações e visitas; não apaga cadastros existentes | `db:seed` volta a povoar a loja real (não só `dev-store-imoveis` vazia) |
| 2026-08-18 | **Catálogo público:** default `perPage` da listagem = **8** (antes 12), alinhado ao Listify/`DEFAULT_PER_PAGE` do web | `ListPublicAgentListingsUseCase` |
| 2026-08-17 | **`DATABASE_URL` no boot:** `load-env.ts` com `override: true` + fail-fast no `PrismaService` se a URL faltar (pg default `:5432` mascarava o erro no provision M2M) | `.env.example` passa a documentar `citybox_platform:15433`; Google Calendar (`GOOGLE_*`) inalterado |
| 2026-08-13 | **Kanban → Aguardando imóvel:** `UpdateDealStage` desvincula imóvel do deal/lead, cancela tx aberta e reabre imóvel (`applyDealAwaitingPropertySideEffects`); `reopenPropertyIfAllowed` em `reserved` ignora COMPLETED antigo | Voltar o card para “sem imóvel” limpa o vínculo e libera Em espera |
| 2026-08-13 | **Status do imóvel na esteira:** 1 unidade → `reserved` (Em espera) / `occupied` (Ocupado); **multiunidade** só incrementa `occupiedUnits` enquanto houver livre (continua selecionável); desistência / troca / `awaiting_property` reverte; UI mostra rótulo da tag (não só “Indisponível”) | Funil CRM controla disponibilidade antes do fechamento financeiro (`sold-out` segue no handover/COMPLETED) |
| 2026-08-13 | **Documento `kind` no lead:** enum `LeadDocumentKind` (`contract`\|`other`); sync do deal só avança a `contract_sent` com contrato + imóvel; espelho settings: contrato → pasta `signed`, demais → `client` | Anexos gerais deixam de mover o funil; Contratos ficam separados em Documentos do perfil |
| 2026-08-14 | **Dockerfile:** remove `@citybox/nest-common` (pacote sumiu do monorepo; provisioning Keycloak local em `shared/infra/keycloak`) | Corrige `COPY packages/nest-common/package.json: not found` no `docker build` |
| 2026-08-12 | **Dockerfile:** inclui `@citybox/imoveis-permissions` + `@citybox/messaging` + `@citybox/nest-common` (deps + build + runner), espelho da clinica-api | Corrige TS2307 no `docker build` da imoveis-api |
| 2026-08-12 | **`multer` em `dependencies`:** `MulterExceptionFilter` importa o pacote; pnpm Docker não hoistava o transitivo | Corrige crash `Cannot find module 'multer'` no boot da imagem |
| 2026-08-11 | **Keycloak issuer alinhado ao admin (`auth.aplopes.com`)** + `AuthGuard` JWKS por issuer | Senha provisória do CreateStore autentica no imoveis-web; M2M admin em `:8080` continua válido |
| 2026-08-11 | **Armadilha documentada:** `RABBITMQ_URL` obrigatório no `.env` + `DATABASE_URL` herdado de `admin-api`/`dev:pick` (dotenv não sobrescreve) quebra `imoveis.store-setup` / `processed_events` | Lojas Imóveis não saíam de `PROVISIONING` |
| 2026-08-11 | **Reset senha do OWNER:** se `keycloakSub` antigo sumiu no Keycloak local (404), `ResetTeamMemberPassword` re-provisiona + redefine senha e religa o `TeamMember` | Lojas criadas quando Admin REST ainda ia ao aplopes passam a logar no `:8080` |
| 2026-08-11 | **Senha provisória:** Imóveis sem modal interno (`mustChangePassword=false`); create/reset de equipe e OWNER usam Keycloak `temporary: true` (UPDATE_PASSWORD no login do backoffice) + dialog só exibe a provisória | Troca definitiva no SSO; sem “criar senha” duplicado no app |
| 2026-08-10 | **Negócio concluído por transação também gera negócio novo:** `CreateTransactionUseCase` passa a tratar deal `active` com transação vinculada `COMPLETED`/`CANCELLED` como negociação encerrada (cria `Deal` novo) — antes só deal `won`/`cancelled`; duplicata continua bloqueada só em negociação aberta (`PROPOSAL`/`CONTRACT_SIGNED`/`DRAFT`) | Correge lead que pagou/desistiu do 1º imóvel e não conseguia comprar outro (deal `active` em `payment_confirmed` bloqueava o 2º negócio); 3 testes novos em `create-transaction` |
| 2026-08-10 | **Transação com deal concluído cria negócio novo:** `CreateTransactionUseCase` — deal `won`/`cancelled` deixa de bloquear (`DealAlreadyHasTransactionError`) e vira um `Deal` novo (`contract_signed`/`active`) ligado ao imóvel/lead/agente | Mesmo lead compra/aluga outro imóvel; kanban mantém o negócio anterior fechado; 2 testes novos (won e cancelled) em `create-transaction` |
| 2026-08-07 | **Google Calendar historical sync (passados+futuros):** `syncExistingAppointmentsForAgent` sem floor de data; OAuth fire-and-forget + `POST …/sync`; máx. 200 | Carga inicial CRM→Google inclui antigos |
| 2026-08-07 | **Follow-up de lead → Google Calendar:** `syncLeadFollowUpAppointment` upsert/delete soft no Google do corretor | Same path as visitas (create/update lead) |
| 2026-08-06 | **UX Agenda:** callback OAuth redireciona a `/calendar?connected=true`; banner + badge na página Agenda | Conexão sem abrir Configurações |
| 2026-08-06 | **Google Calendar por corretor:** `AgentProfile` + `Appointment.googleEventId`; módulo `google-calendar` (OAuth offline + `googleapis`); sync soft em create/update/delete de appointments; web card no perfil | Agenda do corretor ↔ Google Calendar |
| 2026-08-06 | **Link curto público + OG:** `GetPublicListing` com `agentSlug` opcional; detalhe HTTP expõe `agentSlug` do imóvel | Web `/p/:id` (WhatsApp + meta OG) |
| 2026-08-06 | **Toggles só na página do imóvel:** `whatsappCatalogEnabled` e `leadFormCatalogEnabled` controlam CTA WA e form no detalhe/`/p/:id`; home e listagem do catálogo mantêm form (footer) e FAB WA | Settings > Sistema |
| 2026-08-06 | **Formulário de lead na página do imóvel:** `StoreSettings.leadFormCatalogEnabled` (default true); flag no GET público do agente; web esconde form **só no detalhe do imóvel** (home do catálogo mantém o form) | Settings > Sistema |
| 2026-08-06 | **WhatsApp no catálogo público:** `StoreSettings.whatsappCatalogEnabled` (default true); `GET` público do agente expõe o flag; telefone continua no perfil/membro | Escopo atual: só página do imóvel (ver linha acima) |
| 2026-08-05 | **Catálogo: inventário órfão só admin + cura one-shot:** round-robin removido; órfãos vão ao admin; imóveis indevidos em corretores voltam ao admin na 1ª listagem (`__catalogOwnershipHealedAt`); corretor mantém o que criar depois | Admin não perde carteira; corretor tem catálogo só da própria produção |
| 2026-08-07 | **Documentos do perfil agregam CRM:** `ListAgentDocuments` espelha docs de leads/imóveis do `agentId` (pastas `client`/`property`) além de pastas manuais e legais | Aba Documentos em Meu perfil deixa de ficar vazia quando o arquivo está no lead/imóvel |
| 2026-08-07 | **Isolamento por perfil:** `resolveScopedAgentId` default = **próprio agentId** (admin inclusive); `agentId=all` visão loja; create/update lead força dono corretor; get/update/delete lead/property checam ownership; featured/agenda alinhados | Admin deixa de herdar carteira de todos por padrão |
| 2026-08-07 | **Web: lists/dashboard scoped ready:** `useSessionAgentScope` — queries de leads/imóveis/kanban/dashboard só com membership; `agentId` na queryKey | Evita flash de dados de outro usuário no React Query |
| 2026-08-05 | **Alerta e-mail de lead do catálogo:** `NotifyPublicLeadUseCase` + `PublicLeadMailer` (SMTP/`nodemailer` ou log); destinos = e-mail do corretor + `LEADS_NOTIFY_EMAIL`; flags store `emailEnabled`/`leadsAlerts` | Formulário público notifica o corretor; falha de e-mail não aborta o lead |
| 2026-08-05 | **Foto pública do imóvel:** remove vínculo a TeamMember via `property.agentId` — serve se status `available` | Catálogo deixa de 404 fotos com agent_id legado |
| 2026-08-05 | **Catálogo = inventário available da loja:** listagem/detalhe públicos filtrados só por `status=available` (slug do corretor valida presença; sem exigir `agentId` do imóvel) | Imóveis criados com agent_id legado voltam a aparecer na vitrine |
| 2026-08-12 | **Catálogo público multi-loja:** rotas `/v1/public/agents/:slug*` e `/v1/public/listings/:id*` resolvem a organization no banco (`findActiveByAgentIdGlobal` / `findByIdGlobal`); web deixa de depender de `IMOVEIS_STORE_ID` fixo | Corrige 404 ao criar nova loja Imóveis |
| 2026-08-05 | **Catálogo público só `available`:** listagem/detalhe/fotos restringidos ao status disponível do módulo Imóveis (sai `occupied`/`reserved`) | Alinha vitrine B2C à carteira “disponível” do painel |
| 2026-08-05 | **Catálogo público por corretor:** `ListPublicAgentListings` filtra `agentId` do slug; `GetPublicListing` exige `property.agentId === agentSlug` | Cada `/agents/:slug` expõe só a carteira daquele membro ativo |
| 2026-08-10 | **Entrega no kanban bloqueia imóvel sem transação:** `applyDealHandoverSideEffects` marca o imóvel `sold-out`/`occupied` a partir de `deal.propertyId` + `deal.type` (nulo assume venda) quando o deal não tem transação vinculada — antes seguia `available` | Corrige venda concluída no kanban que deixava o imóvel disponível; 4 testes novos em `update-deal-stage` |
| 2026-08-05 | **Escopo de dados = dashboard:** `resolveScopedAgentId` em listagens leads/imóveis/deals/transactions/agenda + search/reminders/report/finance | Corretor não lista dados de outros; **admin default = próprio** (ver 2026-08-07 isolamento) |
| 2026-08-05 | **Dashboard por desempenho e permissão:** overview força `scopeAgentId` do corretor (não-admin); KPIs/cards filtrados pelos checkboxes CASL; resposta inclui `modules` | Corretor não vê totais da loja nem métricas de módulos bloqueados |
| 2026-08-04 | **Catálogo público — inventário da loja:** listagem/detalhe/fotos = todos os imóveis da loja exceto `sold-out` (sem filtro `agentId`); perfil → Imóveis vendidos = `sold-out` + `agentId`; create/save web envia `agentId`; venda define `agentId` se vazio | Fim do sync manual para catálogo B2C; portfólio de vendas automático |
| 2026-08-04 | **Catálogo público — filtro de status:** listagem/detalhe/fotos expõem `available`/`occupied`/`reserved`; **`sold-out` (Esgotado) fica fora**; política `public-catalog-property.policy.ts` | Perfil do corretor no painel continua listando vendidos; catálogo B2C não |
| 2026-08-04 | **Módulo `public` (catálogo):** rotas `@Public()` `/v1/public/stores/:storeId/agents/:slug` (+ listings, detalhe, fotos); `PublicCatalogRateLimitGuard` por IP; web consome via `imoveis-public-fetch` (sem token) | Catálogo público de produção; slug inválido → 404; ownership no detalhe |
| 2026-08-04 | **`Property.description` + `Property.highlights[]`:** migration `add_property_catalog_copy`; CRUD properties + presenter público alimentam **Sobre o imóvel** / **Diferenciais**; FTS indexa descrição e diferenciais | Form web grava copy do catálogo |
| 2026-08-03 | **Meio de pagamento na transação:** enum Prisma `TransactionPaymentMethod`; coluna `payment_method` obrigatória; `POST /v1/transactions` exige `paymentMethod`; resposta HTTP inclui o campo; activity registra label PT-BR | Origem do pagamento previsto sem PSP; confirmação manual permanece |
| 2026-08-03 | **Status do imóvel ao confirmar pagamento:** `COMPLETED`/`PAID_BY_TENANT` passam a marcar imóvel `sold-out`/`occupied` (antes só em `handover`); `handover` fecha lead | Corrige imóvel vendido preso em `reserved` (Em espera) |
| 2026-08-03 | **Semântica Deal ↔ Transaction (pagamento vs entrega):** `COMPLETED`/`PAID_BY_TENANT` → deal `payment_confirmed`; `handover` no funil fecha lead; listagem de deals expõe `transactionId`; `CANCELLED` reverte deal | Proposta de pagamento ≠ fechamento do lead; entrega manual no kanban |
| 2026-08-03 | **Integração Deal ↔ Transaction:** `POST /v1/transactions` grava `deal_id`, avança deal para `contract_signed`; `GET /v1/leads/:id` retorna deal ganho na barra de progresso | Funil CRM e módulo Transações sincronizados ponta a ponta |
| 2026-08-03 | **Sync lead → Deal:** `SyncActiveDealForLeadUseCase` no create/update de lead; migration `backfill_deals_from_leads` para leads existentes | Kanban passa a exibir leads com deal ativo derivado do imóvel vinculado |
| 2026-08-03 | **Módulo `deals` (funil CRM):** CRUD `/v1/deals*` + `PATCH /v1/deals/:id/stage`; `GET /v1/leads/:id` embute `activeDeal`; web `resolvePipelineProgress` lê `DealStage` | Funil de fechamento desacoplado de `LeadStatus` e de `Transaction` financeira |
| 2026-08-03 | **Schema `Deal` (funil CRM):** enums `DealStatus`/`DealStage`; tabela `deals` (Lead 1:N, Property opcional); `transactions.deal_id` único opcional (migration `add_deals`) | Base relacional do funil |
| 2026-07-31 | **`matchedProperties[].coverPhotoUrl`:** enriquecimento na leitura do lead (join `property_photos` por `propertyId`) | Web exibe miniaturas reais nos imóveis vinculados sem N+1 no client |
| 2026-07-31 | **Pré-Citybox (web):** catálogo público consome `GET /v1/settings/profile/:agentId` + `GET /v1/properties?agentId=`; fotos expostas via proxy Next `/api/public/properties/:id/photos/:photoId` (sem novas rotas `@Public()` na API) | Consumidor externo do contrato settings/properties existente |
| 2026-07-31 | **Settings:** models `StoreSettings`/`AgentProfile`/`AgentLegalDocument` + enum `AgentLegalDocKind` (migration `add_settings`); módulo `settings` com `/v1/settings/store` (get-or-create) e `/v1/settings/profile/:agentId` (+ foto e documentos legais em MinIO) | Configurações de sistema/notificações e perfil do corretor saem do mock do web |
| 2026-07-31 | **Lead follow-up → agenda:** create/update com `nextFollowUp` + agente sincroniza `Appointment` (`follow-up`, 09–10h Bahia) | Compromisso na agenda a partir do form de lead |
| 2026-08-17 | **Wrapper `imoveis.unaccent`:** extensão `unaccent` já vivia noutro schema do banco compartilhado (ex.: `erp`); Prisma `search_path=imoveis` fazia INSERT de lead 500 (`42883`). Migration `ensure_imoveis_unaccent` expõe wrapper no schema, sem mover a extensão | POST `/v1/leads` e demais FTS voltam a gravar |
| 2026-07-30 | **Fix FTS unaccent:** triggers qualificam `imoveis.unaccent` (`fix_fts_unaccent_schema`) — UPDATE de appointment (checkbox done) quebrava | Agenda checkbox volta a funcionar |
| 2026-07-30 | **Search FTS + Reminders:** `search_vector` (tsvector/GIN/unaccent/triggers) em leads/properties/appointments/transactions; `GET /v1/search`; `GET /v1/reminders` + helper compartilhado com dashboard; web consome ambos | Busca global e header/leads sem fan-out |
| 2026-07-30 | **Dashboard overview:** módulo `dashboard` — `GET /v1/dashboard/overview` (KPIs + performance + deals + previews + reminders); receita = regra finance/summary; sem migration | Web dashboard sai do mock |
| 2026-07-30 | **Disponibilidade do imóvel:** `PATCH /v1/transactions/:id/status` (COMPLETED/CANCELLED) sincroniza `Property.status`; create bloqueia imóvel não-available; web Concluir/Cancelar + picker só `available` + reativar/prefill | Negócio concluído tira imóvel do picker |
| 2026-07-30 | **Transactions + Finance:** schema `Transaction`/`TransactionActivity`/`CommissionConfig`/`CommissionAgentOverride`/`Expense` (migration `add_transactions`); HTTP `/v1/transactions*` + `/v1/finance/*`; web via `imoveisFetch` | Negócios e financeiro saem do localStorage |
| 2026-07-30 | **Seed de leads:** `prisma/seed.ts` — só popula se a loja estiver **vazia** (não apaga cadastros do módulo Leads); 5 leads piloto Ilhéus opcionais. **Superseded 2026-08-18** pelo catálogo demo idempotente | Bootstrap seguro p/ autocomplete/agenda |
| 2026-07-29 | **Appointments (Agenda):** schema `Appointment` + enum `AppointmentKind` (migration `add_appointments`); módulo CRUD `/v1/appointments` (list `from`/`to`, `agentId`/`excludeAgentId`); wall-clock Bahia; web via `imoveisFetch` + React Query | Agenda sai do localStorage |
| 2026-07-29 | **Documentos MinIO:** `property_documents.object_key`/`mime_type` (migration `add_property_document_object_key`), upload/get/delete documents, validação por assinatura; `documents` removido do payload de create/update | Documento agora persiste arquivo, não só nome |
| 2026-07-29 | **Fotos MinIO (padrão food):** `StorageModule`, upload/get/delete photos, `mime_type`; web multipart + `AuthPropertyPhoto` | Substitui data URL no JSON |
| 2026-07-29 | **Limite de corpo JSON 10 MB** no `main.ts` | Metadados/documentos grandes no create/update |
| 2026-07-29 | **Properties CRM:** schema Prisma (`Property` + photos/documents/activeLeads), módulo `properties` (CRUD + sync catálogo), migração `add_properties`; web integrado via `imoveisFetch` | API + web de imóveis alinhados ao contrato `PropertyListing` |
| 2026-07-29 | **Specs obrigatórios em todos os use cases de leads** + §5.9/§6.2 (padrão permanente) | Cobertura unitária list/get/update/delete/sync |
| 2026-07-29 | **Padrão HTTP obrigatório documentado** (§5.8 + §6.1): route/dto/presenter por ação = platform-api | Persistência para novos módulos/agents |
| 2026-07-29 | **HTTP leads alinhado à platform-api:** DTO (class-validator) + presenter por ação; use cases retornam `LeadEntity`; removido Zod/`lead.presenter` da application | Controllers finos como admin |
| 2026-07-29 | **Rotas leads desmembradas:** 1 pasta/ação sob `infrastructure/http/routes/` (padrão platform-api); removido `leads.route.ts` monolítico | Controllers finos no `LeadsModule` |
| 2026-07-28 | **Leads CRM:** schema Prisma relacional (Lead + agents/properties/documents/activities), módulo `leads` (CRUD/status/sync), remoção do scaffold `example`/`PropertyExample`, migração `init_leads` | API real de leads; web consome via `imoveisFetch` |
| 2026-07-28 | **Criação do projeto** `@citybox/imoveis-api` — scaffold completo: shared/core, shared/infra, módulo `example` em camadas, Prisma schema `imoveis`, porta 3112 | API da vertical imóveis pronta para implementação |
