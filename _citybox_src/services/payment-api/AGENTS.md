# AGENTS.md — Payment API

> **Para agentes de IA:** Este arquivo é a fonte de verdade sobre este módulo.
> Leia-o integralmente antes de qualquer ação. Ao modificar código neste módulo,
> atualize as seções relevantes deste arquivo na mesma operação. Nunca remova
> seções — apenas atualize ou adicione.

---

## 🔴 AVISO DE STATUS — SERÁ REFEITO (REESTRUTURAÇÃO PLANEJADA)

> **Este serviço NÃO segue os padrões necessários da plataforma e PASSARÁ POR UMA
> REESTRUTURAÇÃO COMPLETA — será reescrito do zero.**
>
> Não invista em correções pontuais, não construa consumidores em cima dele e não o
> adote em nenhum projeto no estado atual. O código existente (18 módulos, 28 models
> Prisma, 4 PSPs, testes) serve apenas como **referência de domínio** (PSPs, fluxos de
> charge/payment/settlement/split) para a nova implementação — **não como base de código
> a ser mantida**.
>
> ### Por que será refeito (não segue os padrões da plataforma)
> 1. **Arquitetura fora do padrão.** Não segue a **Clean Architecture por módulo**
>    (domain/application/infrastructure) adotada em `apps/admin/api` e `apps/marketplace/api`.
> 2. **Auth divergente.** Usa **API Key + JWT próprio** (`ApiKeyGuard`, `PAYMENTS_JWT_SECRET`)
>    em vez dos guards Keycloak de `@citybox/nest-common`.
> 3. **Não integrado ao monorepo.** Sem scripts na **raiz** (`payment-api:up`/`dev` citados
>    no `README.md` **não existem** no `package.json` raiz), fora de `pnpm dev`/`turbo` e dos
>    conjuntos `dev:*`.
> 4. **Nenhum consumidor ligado.** `POST /charges` ← checkout (C-05) e webhooks internos →
>    `core-api` ainda **não estão plugados** de ponta a ponta.
> 5. **PSPs apenas em sandbox**; faltam validação de produção, rotação de credenciais e
>    conciliação real.
> 6. **Higiene/qualidade incompleta.** Sem `.env.example` na raiz do serviço; cobertura de
>    testes parcial (só `common/`, `auth/`, `charges/`, `providers/`).
>
> ### Como tratar este módulo agora
> - **Não** corrigir/evoluir o código atual exceto se explicitamente solicitado.
> - **Não** ligar consumidores nem documentar contratos como estáveis.
> - Ao iniciar a reescrita, seguir o **padrão de `apps/admin/api`** (Clean Architecture,
>   guards Keycloak via `@citybox/nest-common`, integração na orquestração do monorepo) e
>   **atualizar este `AGENTS.md` integralmente**, removendo este aviso quando concluído.
>
> As seções 4–10 abaixo descrevem o **estado atual (legado, a ser substituído)** — mantidas
> apenas como referência durante a transição. A seção 11 traz as diretrizes da reescrita.

---

## 1. Identidade do Módulo

| Campo            | Valor                                                       |
| ---------------- | ----------------------------------------------------------- |
| **Nome**         | `services/payment-api` · pacote `@citybox/payment-api`      |
| **Tipo**         | Microserviço NestJS (backend) · API de Pagamentos central multi-PSP |
| **Responsável**  | Bruno Lopes — Aplopes Tecnologia                            |
| **Status**       | 🔴 **Será REFEITO** — não segue os padrões da plataforma; reestruturação completa planejada (ver aviso acima). Código atual = legado/referência |
| **Porta**        | `3106`                                                      |
| **Banco**        | PostgreSQL dedicado `citybox_payments` (porta host `15435`) |
| **Última atualização deste arquivo** | 2026-06-29                              |

**Propósito em uma linha:**
Serviço independente que orquestra **cobranças, pagamentos, estornos, splits,
settlements, conciliação e webhooks** com múltiplos PSPs (Asaas, PagBank,
InfinitePay, Stone). Implementa o **PaymentProvider multi-PSP** do **ADR B-06**.
Consumidores (`marketplace-api`/core, verticais) **nunca** integram PSPs diretamente.

---

## 2. Posição no Monorepo

```
citybox/                          ← raiz do monorepo (Turborepo + pnpm)
├── apps/
│   ├── marketplace/{api,bff}     ← core/orquestrador de checkout (consumidor FUTURO)
│   ├── platform/{api,admin}
│   ├── erp/ · workers/ · realtime-gateway/
│   └── verticals/{food,clinica}/api
├── packages/
│   ├── nest-common/              ← guards Keycloak (NÃO usado aqui — auth própria)
│   ├── messaging/                ← @citybox/messaging (usado: publica eventos)
│   └── ui/ · events/ · search/
├── services/
│   └── payment-api/              ← VOCÊ ESTÁ AQUI (@citybox/payment-api · :3106)
└── AGENTS.md                     ← contexto raiz (índice do monorepo)
```

**Importante:** serviço **autocontido**, com **banco próprio** (`citybox_payments`,
porta host `15435`) e **cliente Prisma próprio** gerado em `src/generated/prisma/`.
Não compartilha schema com nenhum outro app.

**Depende de (infra externa):**
- **PostgreSQL** dedicado `citybox_payments` (via `DATABASE_URL`)
- **RabbitMQ** — publica `payment.captured` / `payment.failed` / `payment.settled` (via `@citybox/messaging`)
- **Redis** (`ioredis`) — idempotência / rate limit
- **PSPs externos:** Asaas, PagBank, InfinitePay, Stone (sandbox hoje)
- **MinIO** — armazenamento auxiliar (comprovantes)

**Consumido por (planejado — ainda NÃO ligado):**
- Orquestrador de checkout do `marketplace-api` (core) via `POST /charges`
- `core-api` via webhook interno assinado (HMAC)

---

## 3. Stack e Versões

| Tecnologia       | Versão     | Observação                                                  |
| ---------------- | ---------- | ---------------------------------------------------------- |
| Node.js          | ≥ 20       | `@types/node` 22                                            |
| pnpm             | workspace  | **Package manager do monorepo** — nunca npm/yarn           |
| Módulos          | **ESM**    | `"type": "module"` — imports relativos **com `.js`** (ex.: `./app.module.js`) |
| TypeScript       | ~6.0.x     |                                                            |
| NestJS           | 11.x (catalog) | `@nestjs/common`, `core`, `platform-express`, `swagger` |
| Prisma           | 7.8.x      | generator `prisma-client` → `src/generated/prisma`; adapter `@prisma/adapter-pg` + `pg` Pool |
| PostgreSQL       | —          | banco dedicado `citybox_payments` (single-DB; sem multiSchema) |
| Runtime dev      | `tsx`      | `tsx watch src/main.ts`                                     |
| class-validator / class-transformer | 0.14 / 0.5 | DTOs HTTP + `ValidationPipe` global (`whitelist`, `transform`) |
| helmet           | 8.x        | headers de segurança                                        |
| ioredis          | 5.x        | idempotência / rate limit                                   |
| Swagger          | catalog    | UI em `/api/docs` (quando `SWAGGER_ENABLED`/não-produção)   |
| Testes           | `node --import tsx --test` | **não usa jest**; cobertura via `c8` (`test:coverage`) |

---

## 4. Estrutura de Pastas

```
services/payment-api/
├── src/
│   ├── main.ts                   ← bootstrap: helmet, ValidationPipe, prefixo "api", CORS allowlist, Swagger /api/docs
│   ├── app.module.ts             ← registra módulos + guards/infra globais
│   ├── modules/                  ← MÓDULOS DE NEGÓCIO (ver seção 9)
│   ├── common/                   ← infra transversal
│   │   ├── auth/                 ← ApiKeyGuard + ApiKeyService (auth própria — NÃO Keycloak)
│   │   ├── crypto/               ← criptografia de credenciais de PSP (provider accounts)
│   │   ├── idempotency/          ← chaves de idempotência (Redis + tabela)
│   │   ├── feature-flags/ · observability/ · redis/ · security/ · utils/
│   ├── contracts/                ← contratos/tipos compartilhados
│   ├── jobs/                     ← daily-settlement.job.ts (settlement diário)
│   ├── generated/prisma/         ← CLIENTE PRISMA GERADO (não editar à mão)
│   └── prisma/                   ← PrismaModule/PrismaService (adapter-pg)
├── prisma/
│   ├── schema.prisma             ← datasource + 28 models + enums
│   ├── migrations/               ← migrations versionadas
│   ├── seed.ts · seed-providers.ts · seed-consumer-webhook.ts
├── test/                         ← testes (node --test): auth, charges, payments, providers, settlements, splits, reconciliation, webhooks, …
├── infra/
│   ├── docker-compose.yml        ← Postgres dedicado (:15435) + rede citybox-platform
│   └── .env.example              ← referência de variáveis (copiar p/ infra/.env, gitignored)
├── prisma.config.ts              ← config Prisma 7
├── Dockerfile · tsconfig.json
├── README.md · PLANO_DESENVOLVIMENTO.md · api_pagamentos_completa.md
└── AGENTS.md                     ← ESTE ARQUIVO
```

---

## 5. Restrições Críticas

> ⚠️ Estas restrições causam erros em build/runtime ou quebram a arquitetura se ignoradas.

### 5.1 Package Manager
```
SEMPRE: pnpm --filter @citybox/payment-api <script>
NUNCA:  npm install / yarn add
```

### 5.2 ESM — imports relativos COM extensão `.js`
```ts
// ✅ CORRETO (pacote é "type": "module")
import { AppModule } from './app.module.js';
// ❌ ERRADO: import { AppModule } from './app.module';   → falha em runtime
```

### 5.3 Prisma 7 — cliente gerado em `src/generated/prisma/`
```ts
// ✅ importar do caminho gerado (NÃO de "@prisma/client")
import { PrismaClient } from '../generated/prisma/client.js';
// Após mudar schema.prisma:  pnpm --filter @citybox/payment-api db:generate
```

### 5.4 Banco DEDICADO `citybox_payments` (porta host 15435)
- Não usa o Postgres da plataforma nem schema `platform`/`tenant`.
- `DATABASE_URL=postgresql://citybox:citybox@127.0.0.1:15435/citybox_payments` (dev).

### 5.5 Auth: API Key / JWT PRÓPRIOS (não Keycloak)
```
ApiKeyGuard + ApiKeyService (header X-Api-Key) e PAYMENTS_JWT_SECRET.
NÃO usa os guards de @citybox/nest-common (Keycloak). Decisão a revisar antes de produção.
```

### 5.6 Credenciais de PSP são CRIPTOGRAFADAS
- `provider_accounts` guarda credenciais cifradas com `PAYMENTS_ENCRYPTION_KEY` (`common/crypto`).
- Nunca logar/retornar credenciais em claro.

### 5.7 Idempotência obrigatória em operações de escrita financeira
- Cobranças/pagamentos usam chave de idempotência (Redis + `idempotency_keys`). Não criar rota de escrita sem idempotência.

### 5.8 Segredos sensíveis em `.env`
- Chaves Asaas que começam com `$` devem ficar entre aspas simples no `.env` (`ASAAS_API_KEY='...'`), senão o shell expande como variável vazia.

---

## 6. Padrões de Código

- **Controllers finos** (`@Controller('charges')`, etc.): validam DTO (class-validator) e delegam ao service; regra de negócio no service.
- **DTOs** com `class-validator` + `@ApiProperty` (Swagger).
- **PSP por estratégia**: cada PSP em `modules/providers/<psp>/` implementa a interface de provider; `stub` para testes; roteamento `AUTO` escolhe o provider default.
- **Eventos**: publicar via `@citybox/messaging` (envelope CloudEvents) **após** persistir.
- **Erros**: respostas HTTP seguras; não vazar dados de PSP/credenciais.
- **Testes**: `node --import tsx --test` com fixtures e stubs (`modules/providers/stub`); sem bater em PSP real no unit.

---

## 7. Variáveis de Ambiente

> Referência: `infra/.env.example` (copiar para `infra/.env`, gitignored).
> **Falta** um `.env.example` na raiz do serviço — criar ao consolidar.

| Variável                         | Descrição                                               |
| -------------------------------- | ------------------------------------------------------- |
| `PORT` / `NODE_ENV`              | Porta (3106) / ambiente                                 |
| `DATABASE_URL`                   | Postgres `citybox_payments` (:15435)                    |
| `PAYMENTS_ENCRYPTION_KEY`        | Chave de cifragem das credenciais de PSP                |
| `PAYMENTS_JWT_SECRET`            | Segredo do JWT próprio                                  |
| `PAYMENTS_API_CLIENTS`           | API keys de consumidores autorizados                   |
| `PAYMENTS_WEBHOOK_SECRET`        | HMAC dos webhooks internos                              |
| `CORE_API_INTERNAL_WEBHOOK_URL`  | Destino do webhook interno → core-api                  |
| `RABBITMQ_URL` / `RABBITMQ_EXCHANGE` / `RABBITMQ_DLX` | Mensageria                        |
| `PAYMENTS_RATE_LIMIT_*` / `PAYMENTS_PUBLIC_RATE_LIMIT_MAX` | Rate limiting                  |
| `PAYMENTS_SETTLEMENT_DAYS_{PIX,CARD,BOLETO}` / `PAYMENTS_SETTLEMENT_BATCH_SIZE` | Settlement |
| `PAYMENTS_DEFAULT_FEE_FIXED` / `PAYMENTS_DEFAULT_FEE_PERCENT` / `PAYMENTS_DEFAULT_TENANT_ID` | Defaults |
| `ASAAS_*`                        | `ASAAS_API_KEY`, `ASAAS_ENV`, `ASAAS_WEBHOOK_TOKEN`     |
| `PAGBANK_*`                      | `PAGBANK_TOKEN`, `PAGBANK_ENV`, `PAGBANK_WEBHOOK_TOKEN` |
| `INFINITEPAY_*`                  | `INFINITEPAY_HANDLE`, `_ENV`, `_REDIRECT_URL`, `_WEBHOOK_*` |
| `MINIO_*`                        | `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` |
| `CORS_ORIGINS` / `SWAGGER_ENABLED` | Origens permitidas / habilitar Swagger               |
| `PAYMENTS_DEV_*`                 | Chaves de DEV (admin/core/encryption) — nunca em produção |

---

## 8. Scripts

```bash
# A partir da raiz do monorepo
pnpm --filter @citybox/payment-api dev          # tsx watch src/main.ts
pnpm --filter @citybox/payment-api build        # tsc → dist/
pnpm --filter @citybox/payment-api start        # tsx src/main.ts
pnpm --filter @citybox/payment-api lint         # tsc --noEmit
pnpm --filter @citybox/payment-api typecheck    # tsc --noEmit
pnpm --filter @citybox/payment-api test         # node --import tsx --test
pnpm --filter @citybox/payment-api test:coverage  # c8 (alvo parcial — ver aviso)

# Banco (Prisma 7) — exige DATABASE_URL apontando p/ :15435
pnpm --filter @citybox/payment-api db:generate
pnpm --filter @citybox/payment-api db:migrate:dev
pnpm --filter @citybox/payment-api db:migrate:deploy
pnpm --filter @citybox/payment-api db:seed

# Infra dedicada (Postgres :15435) e jobs
pnpm --filter @citybox/payment-api docker:up    # docker compose -f infra/docker-compose.yml up -d
pnpm --filter @citybox/payment-api jobs:daily-settlement

# Endpoints úteis (dev)
# Swagger: http://localhost:3106/api/docs
# Health:  http://localhost:3106/api/health   ·   http://localhost:3106/api/health/ready
```

Prefixo global de rotas: **`/api`** (definido em `main.ts`).

> ⚠️ O `README.md` cita `pnpm run payment-api:up` / `payment-api:dev` na **raiz** —
> esses scripts **não existem** no `package.json` raiz atual. Usar os comandos
> `pnpm --filter @citybox/payment-api ...` acima até a integração ser consolidada.

---

## 9. Módulos Implementados

> Atualize esta seção sempre que um módulo/endpoint for adicionado ou alterado.
> **Status geral: implementado, em validação.** Rotas sob prefixo `/api`.

| Módulo | Pasta | Controller (rota base) | Responsabilidade |
| ------ | ----- | ---------------------- | ---------------- |
| Health | `modules/health` | `health` | Liveness/readiness (`/api/health`, `/api/health/ready`) |
| Auth | `modules/auth` | — (guard) | `ApiKeyGuard`/`ApiKeyService` (API Key + JWT próprios) |
| Tenants | `modules/tenants` | `tenants` | Tenants de pagamento |
| Merchants | `modules/merchants` | `merchants` | Lojistas/recebedores |
| Provider Accounts | `modules/provider-accounts` | — | Contas de PSP por merchant (credenciais cifradas) |
| Providers | `modules/providers` | `webhooks/providers` | Estratégias por PSP: **asaas, pagbank, infinitepay, stone** + **stub** |
| Customers | `modules/customers` | `customers` | Clientes pagadores |
| Charges | `modules/charges` | `charges` | Criação/consulta de cobranças (entrada do checkout) |
| Payments | `modules/payments` | `payments` | Pagamentos, tentativas, estornos |
| Payment Entries | `modules/payment-entries` | — | Lançamentos financeiros (razão) |
| Splits | `modules/splits` | — | Divisão de valores entre recebedores |
| Settlements | `modules/settlements` | `balances` | Liquidação/saldo (+ job diário) |
| Transfers | `modules/transfers` | `transfers` | Transferências/saques |
| Reconciliation | `modules/reconciliation` | `reconciliation` | Conciliação de lotes com PSP |
| Subscriptions | `modules/subscriptions` | `subscriptions` | Assinaturas e ciclos |
| Tap Intents | `modules/tap-intents` | `tap-intents` | InfiniteTap / pagamento por aproximação |
| Webhooks (provider) | `modules/webhooks` | `webhooks/providers` | Recebe webhooks dos PSPs |
| Internal Webhooks | `modules/webhooks` | `webhooks` | Entrega assinada (HMAC) a consumidores internos |
| Audit | `modules/audit` | — | Trilha de auditoria |
| Messaging | `modules/messaging` | — | Publicação de eventos (`@citybox/messaging`) |

### Modelos Prisma (`prisma/schema.prisma` — 28 models)
`Tenant`, `Merchant`, `ProviderAccount`, `PaymentCustomer`, `ProviderCustomer`,
`Charge`, `ChargeItem`, `PaymentAttempt`, `Payment`, `Refund`,
`ProviderWebhookEvent`, `InternalWebhookDelivery`, `ProviderRequest`,
`IdempotencyKey`, `AuditLog`, `ConsumerWebhook`, `PaymentEntry`, `Settlement`,
`ReconciliationBatch`, `ReconciliationItem`, `Subscription`, `SubscriptionCycle`,
`Split`, `Transfer` (+ enums de status/tipo).

---

## 10. Decisões de Arquitetura

| Data | Decisão | Motivo |
| ---- | ------- | ------ |
| — | Microserviço **independente** com banco próprio (`citybox_payments`) | Isolar risco financeiro/PSP do core; ADR B-06 |
| — | Consumidores **não** integram PSPs diretamente | Centralizar credenciais, conciliação e split em um único ponto |
| — | Cliente Prisma 7 gerado em `src/generated/prisma` + adapter `pg` | Pool explícito; serviço autocontido |
| — | ESM (`type: module`) com imports `.js` | Alinhamento com runtime Node moderno (tsx) |
| — | Auth própria (API Key + JWT) | Serviço chamado server-to-server; **a revisar** vs. padrão Keycloak |
| — | Idempotência + credenciais cifradas | Garantias mínimas para operações financeiras |

---

## 11. Contexto para a IA

### ⚠️ Este módulo SERÁ REFEITO — diretrizes da reescrita

O código atual é **legado/referência** e será substituído. Ao conduzir a reestruturação:

1. **Adotar o padrão de `apps/admin/api`:** Clean Architecture por módulo
   (`domain` puro → `application`/use cases → `infrastructure`), repositórios como
   interface (token de DI) + impl Prisma + in-memory para testes.
2. **Auth padronizada:** usar os guards/permissions Keycloak de **`@citybox/nest-common`**
   (não API Key/JWT próprios), salvo decisão de arquitetura registrada em ADR.
3. **Integrar à orquestração do monorepo:** scripts na **raiz** (conjunto `dev:*` e/ou
   `payment-api:up`/`dev`), pipeline `turbo`, alinhamento com `infra/`.
4. **Ligar consumidores de ponta a ponta:** `POST /charges` ← checkout do `marketplace-api`;
   webhook interno → `core-api` (HMAC + retries).
5. **Validar PSPs em produção:** credenciais reais, rotação, sandbox→prod, conciliação real.
6. **Qualidade desde o início:** `.env.example` na raiz do serviço, cobertura de testes
   completa (não só `common`/`auth`/`charges`/`providers`), revisão de segredos e
   `database-reviewer` ao definir o novo schema.
7. **Reaproveitar apenas o domínio**, não o código: PSPs (Asaas/PagBank/InfinitePay/Stone),
   fluxos charge → payment → settlement → split → reconciliation e os 28 models como
   ponto de partida do novo design.
8. Ao concluir, **reescrever este `AGENTS.md` integralmente**, remover o aviso 🔴 e
   atualizar o status na raiz (seção 4) e no `CLAUDE.md`.

### O que NÃO fazer agora (módulo em vias de ser refeito)
- **Não** investir em correções/evoluções no código atual sem pedido explícito — ele será descartado.
- **Não** construir consumidores nem tratar contratos/rotas como estáveis.
- **Não** adotar este serviço como dependência em nenhum projeto.
- Regras técnicas do legado (enquanto existir): não importar de `@prisma/client` (usar
  `src/generated/prisma`); imports relativos com `.js` (ESM); banco próprio
  `citybox_payments`; nunca logar credenciais de PSP; não habilitar `PAYMENTS_DEV_*`
  nem `CORS_ORIGINS=*` em produção.

---

## 12. Histórico de Mudanças Estruturais

> Não é changelog de features — registra mudanças que afetam o contexto da IA.

| Data       | Mudança                                                      | Impacto                        |
| ---------- | ----------------------------------------------------------- | ------------------------------ |
| 2026-06-29 | `AGENTS.md` criado com aviso de status (implementado, **não integrado/validado**) | Documenta o serviço e o roadmap para adoção |
| 2026-06-29 | Marcado como **🔴 SERÁ REFEITO** — reestruturação completa por não seguir os padrões da plataforma; código atual passa a legado/referência | Bloqueia adoção/evolução; define diretrizes da reescrita (seção 11) |
