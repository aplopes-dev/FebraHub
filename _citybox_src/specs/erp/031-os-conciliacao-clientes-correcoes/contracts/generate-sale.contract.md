# Contract: `POST /v1/service-orders/:id/generate-sale`

**Módulo**: `apps/erp/api/src/modules/sales/service-orders`
**Muda**: critério de aceitação das linhas (D1) — request/response shape
inalterados.

## Request

`POST /v1/service-orders/{id}/generate-sale` — sem body (`Content-Length: 0`).

## Response 201 (sucesso)

`SaleOrder` serializado pelo presenter existente (inalterado na forma — cada
linha continua com `productId`, `quantity`, `unitPriceCents`; linhas de
serviço têm `productId: null` e ganham `description`).

## Response 400 (erro)

Antes:

```json
{
  "message": "A OS precisa de ao menos uma linha em payloadJson.lines para gerar a venda.",
  "error": "Bad Request",
  "statusCode": 400
}
```

Depois: mesma mensagem, mesmo contrato — só passa a disparar quando a OS
realmente não tem **nenhuma** linha (produto OU serviço) em
`payloadJson.lines`, não mais quando ela só tem linhas de serviço.

## payloadJson.lines — forma aceita (interna, não é contrato HTTP público)

Antes: só linhas com `productId: string`.

Depois — union de duas formas:

```ts
type ServiceOrderSaleLine =
  | { productId: string; quantity: string; unitPriceCents: number }
  | { productId: null; description: string; quantity: string; unitPriceCents: number };
```

`extractLines()` (backend) e `linesForGenerateSale()` (frontend) devem aceitar
as duas formas ao montar/ler `payloadJson.lines`.
