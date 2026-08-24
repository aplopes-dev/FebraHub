# Payment API — `@citybox/payment-api`

API de Pagamentos Central da Citybox Local Commerce — serviço NestJS **independente** que orquestra cobranças, pagamentos, estornos, webhooks e conciliação com múltiplos PSPs (Asaas, PagBank, …). Consumidores (`core-api`, verticais) **nunca** integram PSPs diretamente.

## Papel no projeto

- Implementa o **PaymentProvider multi-PSP** do [ADR B-06](../gestao/docs/adrs/B-06-psp-split.md) como microserviço dedicado (Etapa 8 — pagamentos/checkout).
- Recebe `POST /charges` do orquestrador de checkout (C-05) com `externalReference` do subpedido.
- Publica eventos `payment.captured`, `payment.failed`, `payment.settled` via RabbitMQ para workers e projeções.
- PSPs: Asaas, PagBank, InfinitePay (checkout + InfiniteTap), Stone (cartão auth/capture, Pix OpenBank, POS/TEF).
- Entrega webhooks internos assinados (HMAC) aos sistemas cadastrados.

**Porta dev:** `3106` · **Banco:** PostgreSQL `citybox_payments` (porta host `15435`).

## Desenvolvimento local

```bash
# 1. Infra dedicada (Postgres :15435) — requer rede citybox-platform
cp infra/.env.example infra/.env
pnpm run payment-api:up

# 2. Migrations + seed (host)
export DATABASE_URL=postgresql://citybox:citybox@127.0.0.1:15435/citybox_payments
pnpm --filter @citybox/payment-api db:migrate:deploy
pnpm --filter @citybox/payment-api db:seed

# 3. API
pnpm run payment-api:dev
# GET http://localhost:3106/api/health
# GET http://localhost:3106/api/health/ready
# Swagger http://localhost:3106/api/docs
```

### PSP sandbox (homologação)

Credenciais ficam em `infra/.env` (gitignored). O seed (`db:seed`) grava **provider accounts** criptografadas para o merchant dev `019aff00-0000-7000-8000-000000000002`.

| PSP | Variáveis | Origem dev |
|-----|-----------|------------|
| **Asaas** | `ASAAS_API_KEY`, `ASAAS_ENV=sandbox`, `ASAAS_WEBHOOK_TOKEN` | Chave sandbox do painel Asaas |
| **PagBank** | `PAGBANK_TOKEN`, `PAGBANK_ENV=sandbox`, `PAGBANK_WEBHOOK_TOKEN` | Mesmo token Bearer do tenant ativo em **citybox-food** (`payment_settings.pagbank_token`) |

**Importante:** chaves Asaas que começam com `$` devem estar entre aspas simples no `.env` (`ASAAS_API_KEY='...'`), senão o shell expande `$aact` como variável vazia.

Routing `AUTO` usa **PagBank** como default quando ambos estão configurados (prioridade homologação food). Para forçar Asaas: `provider: ASAAS` no `POST /charges` ou ajuste `is_default` na tabela `provider_accounts`.

### Webhook interno → core-api

O seed registra automaticamente um **consumer webhook** (`consumer_webhooks`) quando `PAYMENTS_WEBHOOK_SECRET` e `CORE_API_INTERNAL_WEBHOOK_URL` estão no `.env`:

| Variável | Exemplo |
|----------|---------|
| `PAYMENTS_WEBHOOK_SECRET` | `dev-payments-webhook-secret-min-32-chars!!` (mesmo valor no **core-api**) |
| `CORE_API_INTERNAL_WEBHOOK_URL` | `http://citybox_core_api:3101/api/v1/internal/payments/webhooks` (Docker) |
| | `http://127.0.0.1:3101/api/v1/internal/payments/webhooks` (host local) |

Eventos entregues: `payment.payment.received`, `payment.payment.captured`, `payment.payment.settled` · `sourceSystem=core-api`.

Reaplicar: `pnpm --filter @citybox/payment-api db:seed`

## Documentação

| Arquivo | Conteúdo |
|---------|----------|
| [api_pagamentos_completa.md](./api_pagamentos_completa.md) | Especificação completa (54 seções) |
| [PLANO_DESENVOLVIMENTO.md](./PLANO_DESENVOLVIMENTO.md) | Plano passo a passo (Fases 0–8), checklists, env vars, diagramas |

## Estado

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
| 8 | Stone (PSP + capture/void) | ✅ implementado |
| 9 | Hardening segurança (spec §46) | ✅ implementado |
| 10 | Observabilidade (spec §47) | ✅ implementado |

### Observabilidade (Fase 10)

- **Correlation ID:** header `X-Correlation-Id` em toda requisição e webhooks internos
- **Métricas:** `GET /api/health/metrics` — counters in-process (charges, payments, refunds, webhooks, provider errors)
- **Logs:** JSON estruturado via `PaymentLoggerService` (redação automática de tokens)
- **DLQ:** webhooks internos → `DEAD_LETTER` + fila RabbitMQ `citybox.dlx` (`citybox.payment.webhook.dlq.v1`)

### Segurança (Fase 9)

- **PCI:** interceptor rejeita PAN; CVV/PAN redigidos antes de gravar (`sanitizePciForStorage`)
- **Credenciais PSP:** AES-256-GCM + HKDF em `provider_accounts` / webhooks
- **Webhooks PSP:** validação token/assinatura → 200 rápido → fila assíncrona
- **Webhooks internos:** HMAC SHA-256 para core-api
- **Rate limit:** Redis — por `sourceSystem` (auth) ou IP (rotas `@Public()`)

Variáveis: `PAYMENTS_RATE_LIMIT_MAX`, `PAYMENTS_PUBLIC_RATE_LIMIT_MAX`, `PAYMENTS_RATE_LIMIT_WINDOW_SEC`.

## Referências

- [gestao/content/pages/etapas.html#etapa-8](../gestao/content/pages/etapas.html) — Etapa 8 Pagamentos
- [apps/marketplace/api/](../apps/marketplace/api/) — consumidor principal (checkout)
- [FLUXO.md](../FLUXO.md) — pipeline ACC por fase
