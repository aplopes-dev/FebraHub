# core-api — API transacional central

**Modular monolith** NestJS (B-03) — coração transacional da plataforma. Concentra domínios compartilhados que **nenhuma vertical deve duplicar**: catálogo polimórfico (`CatalogItem` + subtipos C-03), pedidos e subpedidos (A-05), carrinho, pagamentos (B-06), fiscal (B-07), tenancy (B-01), identidade (C-07), devices (C-09) e outbox de eventos (B-09).

Toda requisição transacional passa pelo módulo `tenancy`: `municipalityId` resolve a connection string do Postgres correto **antes** de qualquer query. Em produção: `api.citybox.com`.

## Papel no projeto

- **Fonte de verdade:** persiste estado de negócio no tenant DB (schema `public` + extensões verticais via FK C-15).
- **Emissor de eventos:** após commit, outbox publica para RabbitMQ — workers projetam marketplace sem acoplar request HTTP.
- **API das verticais:** verticais chamam core para catálogo/pedidos; expõem apenas settings e extensões específicas.
- **Contrato público:** OpenAPI exportada para `@citybox/contracts` — base para BFF e integrações.

## Conteúdo desta pasta

| Módulo / pasta | Descrição | Estado |
|----------------|-----------|--------|
| `src/auth/` | Autenticação JWT / guards | implementado |
| `src/tenancy/` | Resolução municipalityId → DB | implementado |
| `src/catalog/` | CatalogItem polimórfico (C-03) | implementado |
| `src/orders/` | Pedidos e subpedidos (A-05) | implementado |
| `src/payments/` | Cliente HTTP payment-api + checkout C-05 | implementado |
| `src/inventory/` | Estoque transversal | em progresso |
| `src/scheduling/` | Agendamentos base | em progresso |
| `src/shipping/` | Frete por loja (C-06) | em progresso |
| `src/users/` | Usuários de loja | implementado |
| `src/identity/` | Integração Keycloak (C-07) | implementado |
| `src/devices/` | PDV, KDS, impressoras (C-09) | em progresso |
| `src/outbox/` | Outbox pattern para eventos | implementado |
| `src/platform/` | Endpoints platform-scoped | implementado |
| `src/storage/` | MinIO / mídia catálogo | em progresso |

## Como usar

```bash
pnpm --filter @citybox/marketplace-api dev   # :3101
```

Produção: `api.citybox.com`

## Integração payment-api (checkout C-05)

O core-api orquestra cobranças via `POST /api/v1/municipalities/:municipalityId/orders/:orderId/checkout`, criando **uma charge por subpedido** na payment-api (`externalReference = orderId:storeId`, `splitRules` multiloja).

Variáveis de ambiente:

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `PAYMENT_API_BASE_URL` | não | Default `http://127.0.0.1:3106/api` |
| `PAYMENT_API_KEY` | sim (checkout) | API Key registrada em `PAYMENTS_API_CLIENTS` na payment-api |
| `PAYMENTS_DEFAULT_MERCHANT_ID` | sim* | Merchant padrão (dev: `019aff00-0000-7000-8000-000000000002`) |
| `PAYMENTS_STORE_MERCHANT_MAP` | não | JSON `{ "storeUuid": "merchantId" }` |
| `PAYMENTS_STORE_SHARE_PERCENT` | não | Percentual da loja no split (default 95) |
| `PAYMENTS_PLATFORM_RECIPIENT_ID` | não | Recipient da plataforma no split (default `platform`) |

\* Ou mapa por loja via `PAYMENTS_STORE_MERCHANT_MAP`.

Exemplo dev (payment-api seed + `.env`):

```bash
PAYMENT_API_BASE_URL=http://127.0.0.1:3106/api
PAYMENT_API_KEY=dev-core-api-key
PAYMENTS_DEFAULT_MERCHANT_ID=019aff00-0000-7000-8000-000000000002
```

Webhook interno (payment-api → core-api):

```bash
PAYMENTS_WEBHOOK_SECRET=dev-payments-webhook-secret-min-32-chars!!
```

Cadastre na payment-api um `consumerWebhook` com URL `http://127.0.0.1:3101/api/v1/internal/payments/webhooks`, `sourceSystem=core-api` e eventos `payment.payment.received`, `payment.payment.settled`.

Workers consomem `payments.orders` (`citybox.payment.#`) e aplicam a mesma lógica via `@citybox/payment-order-sync`.

## Referências

- [apps/README.md](../README.md)
- [packages/](../../packages/README.md)
