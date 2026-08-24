# Contract: Payment Methods (`erp-api`, novo módulo)

Base: `/v1/payment-methods` (proxy `/api/proxy/comercio`, mesmo padrão de `/v1/cost-centers`).

## `GET /v1/payment-methods`

Lista formas de pagamento da organização ativa (padrão + próprias).

Query: `search?`, `page?`, `perPage?`, `tab?` (`active` | `deleted`, default `active`) — mesmo contrato de listagem server-side de `cost-centers`.

Response `200`:
```json
{
  "data": [
    { "id": "uuid", "name": "Dinheiro", "fiscalCode": "01", "installmentPermission": "Não permitir", "isSystem": true, "deletedAt": null }
  ],
  "meta": { "total": 15, "page": 1, "perPage": 20 }
}
```

## `GET /v1/payment-methods/options`

Lista **completa, sem paginação**, só `{id, name}` de formas ativas — consumida pelo select de `financial-entries`/`transfer-dialog` (molde `useCostCenterOptionsQuery`).

Response `200`: `{ "data": [{ "id": "uuid", "name": "PIX" }, ...] }`

## `POST /v1/payment-methods`

Body: `{ "name": string, "fiscalCode"?: string, "installmentPermission"?: string }`

- `422` se nome duplicado (comparação normalizada, incl. contra formas de sistema).
- `201` com o registro criado (`isSystem: false`).

## `PUT /v1/payment-methods/:id`

Mesmo body do POST.

- `403`/`409` (mesmo padrão de `financial-groups`) se `isSystem === true` — edição de forma padrão é recusada.

## `DELETE /v1/payment-methods/:id`

- `403`/`409` se `isSystem === true`.
- `409` se em uso por algum `FinancialEntryPayment.paymentMethod` — mensagem explicando o motivo (FR-021).
- `204` em sucesso (soft-delete).

## `POST /v1/payment-methods/:id/restore`

Mesmo padrão de `cost-centers` — reverte soft-delete, idempotente se já ativo.

---

## Impacto em `POST/PUT /v1/financial-entries` (contrato existente, sem mudança de shape)

`payments[].paymentMethod` continua `string` no body — só muda a validação server-side: de enum fixo para "UUID existente em `PaymentMethod` da organização". Nenhuma mudança de contrato JSON, só de regra de validação (documentar no Swagger existente da rota).
