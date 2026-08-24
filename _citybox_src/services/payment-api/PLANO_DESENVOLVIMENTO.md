# Plano de desenvolvimento — Payment API (NestJS)

**Versão:** 1.0  
**Data:** 2026-06-11  
**Pacote:** `@citybox/payment-api`  
**Spec completa:** [api_pagamentos_completa.md](./api_pagamentos_completa.md)

---

## 1. Contexto e alinhamento

### 1.1 O que é

A **API de Pagamentos Central** é um serviço NestJS **independente e reutilizável** que orquestra cobranças, pagamentos, estornos, webhooks, conciliação e repasses. Nenhum sistema consumidor (core-api, verticais, portais) deve integrar diretamente com Asaas, PagBank ou outros PSPs.

### 1.2 Posicionamento no Citybox Local Commerce

| Referência | Relação |
|------------|---------|
| [ADR B-06](../../gestao/docs/adrs/B-06-psp-split.md) | Implementa **PaymentProvider multi-PSP** como microserviço dedicado |
| [Etapa 8 — Pagamentos](../../gestao/content/pages/etapas.html#etapa-8) | Complementa checkout orquestrado (C-05) e subpedidos (A-05) |
| [core-api](../apps/marketplace/api/) | Consumidor principal — orquestrador de checkout chama `POST /charges` |
| [workers](../services/platform/workers/) | Consome eventos `payment.captured`, `payment.settled` |
| [marketplace-bff](../apps/marketplace/bff/) | **Não** chama payment-api — indireto via core-api (B-08) |

**PSPs iniciais (spec):** Asaas + PagBank. Futuro: InfinitePay, Stone.

### 1.3 Localização no monorepo

```
payment-api/          ← raiz (domínio separado, como fiscal-api/)
├── src/              ← NestJS 11
├── prisma/           ← DB próprio citybox_payments
├── infra/            ← Docker Compose
└── test/
```

**Não** fica em `apps/` — escolha arquitetural para serviços de domínio transversal com DB dedicado.

### 1.4 Diagrama de contexto

```mermaid
flowchart TB
  subgraph consumers [Consumidores]
    coreApi[core-api checkout C-05]
    backoffice[backoffice-shell]
  end
  subgraph paymentApi [payment-api :3106]
    auth[auth API Key JWT]
    core[charges payments refunds]
    factory[PaymentProviderFactory]
    whIn[provider webhooks]
    whOut[internal webhooks]
  end
  subgraph infra [Infra compartilhada]
    pg[(PostgreSQL citybox_payments)]
    redis[(Redis idempotency)]
    rmq[RabbitMQ eventos]
    minio[MinIO comprovantes]
  end
  subgraph psps [PSPs]
    asaas[Asaas]
    pagbank[PagBank]
  end
  consumers -->|REST v1| paymentApi
  paymentApi --> pg
  paymentApi --> redis
  paymentApi --> rmq
  paymentApi --> minio
  factory --> asaas
  factory --> pagbank
  asaas -->|webhook| whIn
  pagbank -->|webhook| whIn
  whOut -->|payment.captured| coreApi
```

---

## 2. Stack técnica

Alinhada ao [core-api](../apps/marketplace/api/) e [pnpm-workspace.yaml](../pnpm-workspace.yaml):

| Item | Valor |
|------|-------|
| Runtime | Node.js 24+, ESM (`"type": "module"`) |
| Framework | NestJS **11.1.24** (`catalog:`) |
| ORM | Prisma 7.8 — schema em `payment-api/prisma/` |
| Banco | PostgreSQL **`citybox_payments`** (separado de platform/tenant) |
| Dev | `tsx watch src/main.ts` |
| Validação | class-validator + class-transformer |
| API docs | Swagger em `/api/docs` |
| Filas | RabbitMQ via `@citybox/messaging` (B-09) |
| Cache / idempotência | Redis (`services/redis` :16379) |
| Auth | API Key + JWT interno (spec §46) |
| Porta dev | **3106** |
| Pacote npm | `@citybox/payment-api` |

**Dependências workspace:** `@citybox/nest-common`, `@citybox/messaging`, `@citybox/events`.

---

## 3. Estrutura de pastas alvo

```text
payment-api/
├── PLANO_DESENVOLVIMENTO.md       ← este arquivo
├── README.md
├── api_pagamentos_completa.md
├── package.json
├── tsconfig.json
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── guards/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   ├── idempotency/
│   │   └── crypto/
│   └── modules/
│       ├── health/
│       ├── auth/
│       ├── tenants/
│       ├── merchants/
│       ├── provider-accounts/
│       ├── customers/
│       ├── charges/
│       ├── payments/
│       ├── refunds/
│       ├── payment-links/
│       ├── subscriptions/          # fase 5
│       ├── splits/                   # fase 6
│       ├── settlements/
│       ├── reconciliation/
│       ├── webhooks/
│       ├── provider-events/
│       ├── provider-requests/
│       ├── audit-logs/
│       └── providers/
│           ├── payment-provider.interface.ts
│           ├── payment-provider.factory.ts
│           ├── stub/
│           ├── asaas/
│           └── pagbank/
├── test/
└── infra/
    ├── docker-compose.yml
    └── .env.example
```

**Registro monorepo (Fase 0):**

- [x] `pnpm-workspace.yaml` → `- 'payment-api'`
- [x] `package.json` raiz → scripts `payment-api:dev`, `payment-api:up`

---

## 4. Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `PORT` | não | Porta HTTP (default `3106`) |
| `NODE_ENV` | não | `development` / `production` |
| `DATABASE_URL` | sim | Postgres `citybox_payments` |
| `REDIS_URL` | sim | Idempotência e rate limit |
| `RABBITMQ_URL` | sim | Event bus (B-09) |
| `PAYMENTS_ENCRYPTION_KEY` | sim | AES-256 para credenciais PSP |
| `PAYMENTS_API_KEYS` | sim (dev) | JSON map `sourceSystem → apiKey` |
| `PAYMENTS_JWT_SECRET` | sim | JWT chamadas internas |
| `CORS_ORIGINS` | não | Origens permitidas |
| `SWAGGER_ENABLED` | não | `true` em dev |
| `ASAAS_API_KEY` | fase 2 | Sandbox/produção |
| `ASAAS_ENV` | fase 2 | `sandbox` / `production` |
| `ASAAS_WEBHOOK_TOKEN` | fase 2 | Validação ingress |
| `PAGBANK_TOKEN` | fase 3 | Sandbox/produção |
| `PAGBANK_ENV` | fase 3 | `sandbox` / `production` |
| `MINIO_ENDPOINT` | fase 2+ | Comprovantes / payloads |
| `MINIO_ACCESS_KEY` | fase 2+ | — |
| `MINIO_SECRET_KEY` | fase 2+ | — |

Exemplo dev (`infra/.env.example`):

```env
PORT=3106
DATABASE_URL=postgresql://citybox:citybox@localhost:15435/citybox_payments
REDIS_URL=redis://localhost:16379
RABBITMQ_URL=amqp://citybox:citybox@localhost:5672/citybox
PAYMENTS_ENCRYPTION_KEY=dev-32-byte-key-change-in-prod!!
PAYMENTS_API_KEYS={"core-api":"dev-core-api-key"}
PAYMENTS_JWT_SECRET=dev-jwt-secret
ASAAS_ENV=sandbox
ASAAS_API_KEY=
```

---

## 5. Tabela endpoints × fase

Referência completa: spec §43.

| Endpoint | Método | Fase |
|----------|--------|------|
| `/api/health` | GET | 0 |
| `/api/merchants` | POST, GET | 1 |
| `/api/merchants/{id}` | GET, PATCH | 1 |
| `/api/merchants/{id}/provider-accounts` | POST, GET | 1 |
| `/api/provider-accounts/{id}` | PATCH | 1 |
| `/api/provider-accounts/{id}/test` | POST | 1 |
| `/api/customers` | POST, GET | 1 |
| `/api/customers/{id}` | GET, PATCH | 1 |
| `/api/charges` | POST, GET | 1 |
| `/api/charges/{id}` | GET | 1 |
| `/api/charges/{id}/cancel` | POST | 1 |
| `/api/charges/{id}/sync-status` | POST | 2 |
| `/api/payment-links` | POST | 2 |
| `/api/payment-links/{id}` | GET | 2 |
| `/api/payment-links/{id}/cancel` | POST | 2 |
| `/api/payments` | GET | 1 |
| `/api/payments/{id}` | GET | 1 |
| `/api/payments/{id}/capture` | POST | 2 |
| `/api/payments/{id}/void` | POST | 2 |
| `/api/payments/{id}/refund` | POST | 2 |
| `/api/refunds` | POST | 2 |
| `/api/refunds/{id}` | GET | 2 |
| `/api/subscriptions` | POST, GET | 5 |
| `/api/subscriptions/{id}` | GET | 5 |
| `/api/subscriptions/{id}/cancel` | POST | 5 |
| `/api/subscriptions/{id}/pause` | POST | 5 |
| `/api/subscriptions/{id}/resume` | POST | 5 |
| `/api/reconciliation` | GET | 4 |
| `/api/reconciliation/import` | POST | 4 |
| `/api/reconciliation/{id}/match` | POST | 4 |
| `/api/reconciliation/{id}/mark-divergent` | POST | 4 |
| `/api/webhooks` | POST, GET | 1 |
| `/api/webhooks/{id}` | PATCH | 1 |
| `/api/webhooks/{id}/test` | POST | 1 |
| `/api/webhooks/providers/asaas` | POST | 2 |
| `/api/webhooks/providers/pagbank` | POST | 3 |
| `/api/webhooks/providers/infinitepay` | POST | 7 |
| `/api/webhooks/providers/stone` | POST | 8 |

---

## 6. Diagramas de sequência

### 6.1 Criar cobrança Pix

```mermaid
sequenceDiagram
  participant Core as core-api
  participant Pay as payment-api
  participant Factory as ProviderFactory
  participant Asaas as Asaas
  participant DB as PostgreSQL

  Core->>Pay: POST /charges (Idempotency-Key)
  Pay->>Pay: Validar API Key + payload
  Pay->>DB: Verificar idempotency_key
  Pay->>Factory: getProvider(ASAAS)
  Factory->>Asaas: POST /payments (Pix)
  Asaas-->>Factory: QR code + provider_charge_id
  Factory-->>Pay: ProviderChargeResult
  Pay->>DB: charge CREATED + pix payload
  Pay-->>Core: 201 charge + pix.qrCode
```

### 6.2 Webhook PSP → consumidor

```mermaid
sequenceDiagram
  participant PSP as Asaas/PagBank
  participant Pay as payment-api
  participant Queue as RabbitMQ
  participant Worker as payment-worker
  participant DB as PostgreSQL
  participant Core as core-api

  PSP->>Pay: POST /webhooks/providers/asaas
  Pay->>Pay: Validar assinatura/token
  Pay->>DB: provider_webhook_events RECEIVED
  Pay-->>PSP: 200 OK (rápido)
  Pay->>Queue: enqueue process_webhook
  Worker->>DB: Carregar evento
  Worker->>Worker: parseWebhook → status canônico
  Worker->>DB: charge PAID + payment CAPTURED
  Worker->>Queue: payment.captured
  Worker->>Core: POST webhook interno (HMAC)
  Core-->>Worker: 200
  Worker->>DB: internal_webhook DELIVERED
```

---

## 7. Fases de desenvolvimento

| Fase | Escopo | Estado |
|------|--------|--------|
| 0 | Scaffold NestJS + Prisma + Docker | ✅ implementado |
| 1 | Core API + StubProvider | ✅ implementado |
| 2 | Asaas (Pix/boleto/cartão + webhooks) | ✅ implementado |
| 3 | PagBank + routing AUTO | ✅ implementado |
| 4 | Conciliação e liquidação | ✅ implementado |
| 5 | Recorrência (subscriptions) | ✅ implementado |
| 6 | Split e repasse | ✅ implementado |
| 7 | InfinitePay + InfiniteTap | ✅ implementado |
| 8 | Integração core-api (C-05) | ✅ implementado |
| 9 | Hardening segurança (spec §46) | ✅ implementado |
| 10 | Observabilidade (spec §47) | ✅ implementado |

> **Nota:** Fases 0–1 foram concluídas na mesma sprint que 2–8; os checklists abaixo foram alinhados em 2026-06-11. Ver também tabela **Estado** em [README.md](./README.md).

### Fase 0 — Fundação do projeto

**Objetivo:** Repositório compilável, health check, DB migrado, Docker local.

**Passos:**

1. [x] Criar `package.json` (`@citybox/payment-api`) com deps Nest `catalog:` + Prisma + `@citybox/*`
2. [x] `tsconfig.json` estendendo `@citybox/tsconfig/nest.json`
3. [x] `src/main.ts` — espelhar [core-api/src/main.ts](../apps/marketplace/api/src/main.ts): prefix `api`, helmet, ValidationPipe, CORS, Swagger
4. [x] `src/app.module.ts` + `HealthModule`
5. [x] Prisma schema — tabelas §42.1–42.10 iniciais:
   - `tenants`, `merchants`, `provider_accounts`
   - `payment_customers`, `provider_customers`
   - `charges`, `charge_items`, `payment_attempts`, `payments`
   - `provider_webhook_events`, `internal_webhook_deliveries`
   - `idempotency_keys`, `audit_logs`, `provider_requests`
6. [x] Migration inicial + seed dev (1 tenant, 1 merchant)
7. [x] `infra/docker-compose.yml` — Postgres :15435 + app na rede `citybox-platform`
8. [x] `README.md` da pasta
9. [x] Registrar em `pnpm-workspace.yaml` e scripts raiz

**Critérios de aceite:**

- [x] `pnpm --filter @citybox/payment-api dev` sobe em :3106
- [x] `GET /api/health` retorna 200
- [x] `pnpm --filter @citybox/payment-api typecheck` verde
- [x] Migration apply em DB limpo

**PR sugerido:** `chore(payment-api): scaffold NestJS + Prisma + docker`

---

### Fase 1 — Core da API

**Objetivo:** CRUD + contrato canônico com **StubProvider** (sem PSP real).  
**Ref. spec:** §50 Fase 1, §11–15, §34, §43, §44.

**Passos:**

1. [x] **auth** — `ApiKeyGuard`, header `Authorization: Bearer <key>` ou `X-Api-Key`; map por `sourceSystem`
2. [x] **tenants** — CRUD admin (protegido)
3. [x] **merchants** — CRUD §43.1
4. [x] **provider-accounts** — credenciais criptografadas (`PAYMENTS_ENCRYPTION_KEY`); ambientes sandbox/production
5. [x] **customers** — CRUD §43.3
6. [x] **charges** — núcleo:
   - [x] `POST /charges` payload §44
   - [x] Status canônicos §15.1 (`DRAFT` → `CREATED` → `PENDING` → …)
   - [x] Idempotência §34 (`Idempotency-Key` header)
   - [x] `GET`, `cancel`, `sync-status` (stub na Fase 1; PSP real nas Fases 2–3)
7. [x] **payments** — entidade derivada; list/get
8. [x] **providers** — interface `PaymentProvider` §11 + `PaymentProviderFactory` §12 + `StubPaymentProvider`
9. [x] **webhooks** — cadastro URLs consumidor §43.10; entrega com HMAC §33
10. [x] **audit-logs** + **provider-requests** — append-only
11. [x] **TDD** — factory, idempotency, charge creation com stub; cobertura 80%+ auth/charges

**Critérios de aceite:**

- [x] `POST /charges` com StubProvider persiste charge e retorna resposta §45
- [x] Requisição duplicada com mesmo `Idempotency-Key` retorna mesma resposta (409 ou 200 idempotente)
- [x] Webhook interno disparado em transição simulada stub
- [x] `pnpm run verify` inclui payment-api (build + test)

**PR sugerido:** `feat(payment-api): auth, merchants, charges core + stub provider`

---

### Fase 2 — Integração Asaas

**Objetivo:** Pix, boleto, cartão/checkout, webhooks, estorno.  
**Ref. spec:** §50 Fase 2, §18–20, §23, §26, §32, §37.

**Passos:**

1. [x] `AsaasPaymentProvider` — implementar interface §11
2. [x] Fluxo **Pix** §18 — QR code, copy-paste, expiração
3. [x] Fluxo **boleto** §19
4. [x] Fluxo **cartão / checkout** §20 — sem PAN no core (checkout hospedado)
5. [x] Cobrança **UNDEFINED** §23
6. [x] Mapeamento status Asaas → canônico §16
7. [x] `POST /webhooks/providers/asaas` §43.11
8. [x] Consumer RabbitMQ: processar webhook → atualizar charge/payment
9. [x] Publicar evento `payment.captured` / `payment.failed` em `@citybox/events`
10. [x] `POST /payments/{id}/refund` §26
11. [x] Testes com mocks HTTP + fixtures webhook anonimizadas

**Critérios de aceite:**

- [x] Cobrança Pix sandbox Asaas gera QR utilizável *(mock HTTP + credenciais sandbox)*
- [x] Webhook simulado atualiza charge para `PAID`/`RECEIVED`
- [x] core-api (mock) recebe webhook interno assinado
- [x] Estorno parcial/total registrado em `refunds`

**PR sugerido:** `feat(payment-api): asaas provider pix/boleto/card + webhooks`

---

### Fase 3 — Integração PagBank

**Objetivo:** Order API, checkout/link, multi-método, routing AUTO.  
**Ref. spec:** §50 Fase 3, §22, §27, §38, §41.

**Passos:**

1. [x] `PagBankPaymentProvider`
2. [x] Order + pagamento + checkout/link §22
3. [x] Pix, boleto, cartão PagBank
4. [x] Webhooks §43.11 + mapeamento status
5. [x] Cancelamento e estorno §27
6. [x] Routing `provider: AUTO` §13 — regra: default merchant + método + fallback
7. [x] Testes E2E sandbox (opt-in CI com secrets) *(mocks HTTP + fixtures; sandbox real via env)*

**Critérios de aceite:**

- [x] Mesmo contrato `POST /charges` funciona com `provider: PAGBANK` e `AUTO`
- [x] Fallback documentado quando provider primário indisponível (§41 — nunca trocar após cobrança enviada ao cliente)

**PR sugerido:** `feat(payment-api): pagbank provider + routing AUTO`

---

### Fase 4 — Conciliação e liquidação

**Objetivo:** Matching financeiro, fees, settlements.  
**Ref. spec:** §50 Fase 4, §30–31, §42 (payment_entries, settlements).

**Passos:**

1. [x] Tabelas: `payment_entries`, `settlements`, `reconciliation_batches`, `reconciliation_items`
2. [x] Endpoints §43.9
3. [x] Cálculo `gross_amount`, `fee_amount`, `net_amount`
4. [x] Job diário (worker local ou `services/platform/workers`) — `pnpm jobs:daily-settlement`
5. [x] Export CSV divergências — `GET /reconciliation?format=csv`

**Critérios de aceite:**

- [x] Import extrato + match por `externalReference` e valor/data
- [x] Divergências marcadas e reportáveis

**PR sugerido:** `feat(payment-api): reconciliation + settlements`

---

### Fase 5 — Recorrência

**Objetivo:** Assinaturas e cobranças recorrentes.  
**Ref. spec:** §50 Fase 5, §25, §43.8.

**Passos:**

1. [x] Tabela `subscriptions` §42.11
2. [x] CRUD + pause/resume/cancel
3. [x] Webhooks recorrentes Asaas/PagBank *(Asaas completo; PagBank via eventos genéricos)*
4. [x] Integração futura com vertical [subscriptions/](../subscriptions/) *(metadata `verticalIntegration`)*

**Critérios de aceite:**

- [x] `POST /subscriptions` cria assinatura no provider (Asaas/STUB)
- [x] pause/resume/cancel sincronizam status interno + webhook consumidor
- [x] Webhook `SUBSCRIPTION_*` atualiza entidade local

---

### Fase 6 — Split e repasse

**Objetivo:** Comissão plataforma, repasse lojista (B-06).  
**Ref. spec:** §50 Fase 6, §29–30, §42.12.

**Passos:**

1. [x] Tabela `splits` + módulo transfers
2. [x] Payload charge aceita `splitRules[]`
3. [x] core-api envia split no checkout multiloja (`src/contracts/multistore-checkout.contract.ts`)
4. [x] Evento `payment.settled` → settlement-worker (`citybox.payment.settled.v1`)

**PR sugerido:** `feat(payment-api): splits + platform commission`

---

### Fase 7 — InfinitePay (futuro)

**Ref. spec:** §39, §50 Fase 7.

- [x] Skeleton provider + Unleash flag (`PaymentFeatureFlagsService` + env `PAYMENTS_FEATURE_INFINITEPAY`)
- [x] Checkout integrado (`POST api.checkout.infinitepay.io/links`) + InfiniteTap (`POST /api/tap-intents`)

---

### Fase 8 — Stone (futuro)

**Ref. spec:** §40, §50 Fase 8.

- [x] Provider Stone (`STONE`) — autorização, captura, cancelamento, consulta
- [x] Pix via Stone Open Banking (QR dinâmico quando `STONE_OPENBANK_ACCOUNT_ID` configurado)
- [x] TEF/POS/SmartPOS via `STONE_POS`/`TEF`/`SMARTPOS` + `stonePos.deepLink`
- [x] Webhook `POST /api/webhooks/providers/stone` + flags Unleash `payment-api.stone.*`
- [x] `POST /api/payments/:id/capture` e `POST /api/payments/:id/void` (Stone auth/capture)

---

## 8. Integração com consumidores Citybox

| Consumidor | Como integra | Status |
|------------|--------------|--------|
| **core-api** | `PaymentApiClient` HTTP; checkout C-05 cria charge por subpedido; `externalReference=orderId:storeId`; metadata com `municipalityId`/`dbName` | ✅ |
| **core-api webhook** | `POST /api/v1/internal/payments/webhooks` — HMAC `X-Payments-Signature`; confirma subpedido/pedido em `payment.payment.received` / `payment.payment.settled` | ✅ |
| **workers** | Consumer fila `payments.orders` (`citybox.payment.#`) → `@citybox/payment-order-sync` atualiza pedido + outbox | ✅ |
| **packages/payment-order-sync** | Lógica compartilhada webhook + RabbitMQ; idempotência via `ProcessedEvent` | ✅ |
| **packages/events** | `payment.captured`, `payment.failed`, `payment.settled`, `order.payment-settled`, `order.status.changed` | ✅ |
| **packages/contracts** | `pnpm run openapi:sync` após endpoints checkout/webhook | ✅ |

### Escopo PR #8 (`feat/core-api-payment-client`)

- [x] `PaymentApiClient` + `POST .../orders/:orderId/checkout`
- [x] Charge metadata multiloja (`municipalityId`, `dbName`, `orderId`, `storeId`)
- [x] Webhook interno assinado no core-api
- [x] Consumer RabbitMQ `citybox.payment.captured.v1` / `citybox.payment.settled.v1`
- [x] Atualização de status: subpedido → `CONFIRMED`; pedido → `CONFIRMED` quando todos pagos
- [x] Outbox `citybox.order.status.changed.v1` e `citybox.order.payment-settled.v1`
- [x] OpenAPI sync (`packages/contracts/openapi.json`)

**Contrato mínimo consumidor** (spec §52):

```text
sourceSystem, externalReference, merchantId,
customer.name, customer.cpfCnpj,
amount, description, dueDate|expiresAt,
paymentMethods, webhook pré-cadastrado
```

---

## 9. Segurança (spec §46)

- [x] **PCI:** nunca persistir PAN/CVV — checkout hospedado ou token PSP (`PciPayloadInterceptor` + `sanitizePciForStorage`)
- [x] Credenciais PSP criptografadas at-rest (`EncryptionService` AES-256-GCM + HKDF)
- [x] Webhooks PSP: validar assinatura/token, responder 200, processar async (`ProviderWebhookController` + `ProviderWebhookProcessor`)
- [x] Webhooks internos: HMAC SHA-256 (`InternalWebhookService` + core-api `PaymentWebhookSignatureService`)
- [x] Rate limit por API Key / IP em rotas `@Public()` (`RateLimitGuard` + Redis)
- [x] `ecc-security-reviewer` — ver `.claude/reports/_platform/security-scan-2026-06-12.md`

### Fase 9 — Hardening de segurança

**Objetivo:** Fechar checklist §46 da spec — PCI, criptografia, webhooks, rate limit e gate de security review.

**Passos:**

1. [x] **PCI boundary** — interceptor global rejeita PAN (Luhn); sanitização CVV/PAN antes de persistir (`charges`, `provider_requests`, `audit_logs`, webhooks PSP)
2. [x] **Credenciais at-rest** — `provider_accounts.credentials_encrypted`, `consumer_webhooks.secret_encrypted` via `EncryptionService`
3. [x] **Webhooks PSP** — token/assinatura (`safeCompare`), persist `RECEIVED`, `processor.enqueue()` assíncrono
4. [x] **Webhooks internos** — HMAC SHA-256, retry com backoff, SSRF guard em URLs
5. [x] **Rate limit** — `PAYMENTS_RATE_LIMIT_MAX` (auth) / `PAYMENTS_PUBLIC_RATE_LIMIT_MAX` (IP)
6. [x] **TDD** — `test/security/pci-payload.test.ts`, `safe-compare`, `webhook-url`
7. [x] **Security scan** — `npm run security:scan` + report `_platform`

**Critérios de aceite:**

- [x] `POST /charges` com PAN válido retorna 400
- [x] CVV redigido em `provider_requests` e `metadataJson`
- [x] Webhook PSP inválido retorna 401; válido retorna 200 e processa async
- [x] `pnpm exec turbo run test --filter='./payment-api'` verde

---

## 10. Observabilidade (spec §47)

- [x] Header `X-Correlation-Id` propagado em logs (`CorrelationIdMiddleware` + `AsyncLocalStorage`)
- [x] Métricas: `charges_created_total`, `payments_received_total`, `webhook_failures_total`, `refunds_total` (`GET /api/health/metrics`)
- [x] Logs JSON estruturados — **nunca** logar tokens PSP (`PaymentLoggerService` + `redactForLogs`)
- [x] DLQ para webhooks falhos após N retries (`DEAD_LETTER` + RabbitMQ `citybox.dlx`)

### Fase 10 — Observabilidade

**Objetivo:** Correlation ID, métricas operacionais, logs estruturados e dead-letter queue para webhooks.

**Passos:**

1. [x] **Correlation ID** — middleware gera/propaga `X-Correlation-Id`; repassado em webhooks internos
2. [x] **Métricas in-process** — `PaymentMetricsService` + endpoint `GET /api/health/metrics`
3. [x] **Logs JSON** — `PaymentLoggerService` com `correlationId` e redaction de secrets/tokens
4. [x] **DLQ** — entregas internas → status `DEAD_LETTER`; publicação `citybox.payment.webhook.dlq.v1` no DLX
5. [x] **Instrumentação** — charges, payments (webhook PSP), refunds, provider errors, reconciliation divergences
6. [x] **TDD** — `test/observability/*`

**Critérios de aceite:**

- [x] Resposta HTTP inclui `X-Correlation-Id`
- [x] `/api/health/metrics` expõe counters agregados
- [x] Webhook interno falho após N tentativas → `DEAD_LETTER` + evento DLQ
- [x] Logs não contêm `apiKey`/`token` em claro

---

## 11. Fluxo ACC (implementação)

Seguir [FLUXO.md](../FLUXO.md) **por fase**:

1. PRD → `.claude/prds/_platform/payment-api.md`
2. Plano de fase → **CONFIRM** explícito
3. TDD (`ecc-tdd-guide`) — RED → GREEN → REFACTOR
4. `pnpm run verify`
5. `ecc-database-reviewer` em toda migration Prisma
6. `ecc-typescript-reviewer` + `npm run code-review`
7. `ecc-security-reviewer` antes de PR
8. Autorização explícita para commit

---

## 12. Ordem de PRs (incremental)

| # | Branch / PR | Escopo |
|---|-------------|--------|
| 1 | `chore/payment-api-scaffold` | Fase 0 |
| 2 | `feat/payment-api-core` | Fase 1 |
| 3 | `feat/payment-api-asaas` | Fase 2 |
| 4 | `feat/payment-api-pagbank` | Fase 3 |
| 5 | `feat/payment-api-reconciliation` | Fase 4 |
| 6 | `feat/payment-api-subscriptions` | Fase 5 |
| 7 | `feat/payment-api-splits` | Fase 6 |
| 8 | `feat/core-api-payment-client` | Integração Etapa 8: checkout + webhook + consumer RabbitMQ + OpenAPI |

---

## 13. Referências cruzadas (spec)

| Tópico | Seção api_pagamentos_completa.md |
|--------|----------------------------------|
| Visão e objetivos | §1–2 |
| Providers | §3–4 |
| Arquitetura | §5–8 |
| Stack / pastas Nest | §9–10 |
| Provider pattern | §11–13 |
| Conceitos (merchant, charge, payment) | §14 |
| Status canônicos | §15–16 |
| Fluxos Pix/boleto/cartão/webhook | §17–33 |
| Idempotência | §34 |
| Payloads request/response | §35–36, §44–45 |
| Integração Asaas/PagBank | §37–38 |
| Modelo de dados | §42 |
| Endpoints | §43 |
| Segurança / observabilidade | §46–47 |
| Roadmap original | §50 |
| Contrato consumidor | §52 |

---

## 14. Próximo passo

1. Homologação E2E: checkout core-api → charge PSP sandbox → webhook interno → consumer RabbitMQ.
2. Painel administrativo (spec §48) ou integração Prometheus/Grafana para scrape de `/api/health/metrics`.
3. PR incremental após verify verde e autorização de commit.

Documentação canônica de produto: [gestao/content/pages/produto.html#produto-pagamentos](../../gestao/content/pages/produto.html) · ADR [B-06](../../gestao/docs/adrs/B-06-psp-split.md).
