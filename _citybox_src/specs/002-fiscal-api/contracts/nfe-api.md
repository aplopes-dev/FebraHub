# Contract: NF-e

Base path: `/api/v1/nfe`. Auth: JWT Keycloak, escopado ao `companyId` do corpo (FR-014). Cobre US1 e as operações de NF-e de US4. Provider: `SEFAZ_BA_NFE` (Strategy Pattern — `providers/sefaz-ba`).

Ver [data-model.md#fiscaldocument](./../data-model.md#fiscaldocument) e [data-model.md#fiscalevent](./../data-model.md#fiscalevent).

Interação síncrona (FR-016 — decisão de clarificação): o resultado da emissão (protocolo de autorização ou motivo de rejeição) volta na própria resposta HTTP do `POST /nfe`, não por webhook/polling.

## `POST /api/v1/nfe`

Emite uma NF-e (US1 cenário 1 e 2).

**Headers**: `Idempotency-Key: <string>` (opcional — se omitido, `idempotencyKey` é derivado de `externalReference`; ver FR-013).

**Request**:
```json
{
  "companyId": "uuid",
  "sourceSystem": "erp",
  "externalReference": "string",
  "environment": "HOMOLOGATION | PRODUCTION",
  "customer": { "documentType": "CPF | CNPJ", "document": "string", "name": "string", "email": "string | null", "address": { "...": "..." } },
  "nfe": {
    "operationNature": "Venda de mercadoria",
    "operationType": "OUTBOUND | INBOUND",
    "finalConsumer": true,
    "presenceIndicator": "PRESENTIAL | INTERNET | PHONE | OTHERS",
    "payment": { "method": "CASH | PIX | CREDIT_CARD | BANK_TRANSFER | OTHERS", "amount": 850.00 }
  },
  "items": [
    {
      "description": "string", "quantity": 1, "unitValue": 850.00, "totalValue": 850.00,
      "itemType": "PRODUCT", "ncm": "string", "cfop": "string", "cst": "string", "csosn": "string | null",
      "taxJson": { "...": "tributos já calculados pelo sistema chamador — FR-016" }
    }
  ]
}
```

**Responses** (US1 cenário 1, 2; SC-001, SC-004):
- `201 Created`, corpo com `status: "AUTHORIZED"` →
  ```json
  {
    "success": true,
    "data": {
      "documentId": "uuid", "status": "AUTHORIZED", "documentType": "NFE", "provider": "SEFAZ_BA_NFE",
      "series": "1", "number": "12345", "accessKey": "string", "protocol": "string",
      "authorizedAt": "2026-08-04T10:00:00Z",
      "xmlUrl": "/api/v1/nfe/{documentId}/xml"
    }
  }
  ```
- `201 Created`, corpo com `status: "REJECTED"` → mesma emissão HTTP (a rejeição do órgão fiscal não é um erro HTTP — é um resultado de negócio válido, SC-001 "protocolo de autorização **ou rejeição com motivo claro**"):
  ```json
  { "success": true, "data": { "documentId": "uuid", "status": "REJECTED", "errorCode": "string", "errorMessage": "motivo retornado pela SEFAZ" } }
  ```
- `200 OK` com o documento já existente → quando `idempotencyKey` colide com uma emissão anterior (FR-013, SC-007)
- `422 Unprocessable Entity` → dados inválidos/incompletos, rejeitado **antes** de qualquer transmissão à SEFAZ (US1 cenário 2, SC-004): `{ "success": false, "error": "string", "data": { "validationErrors": [...] } }`
- `424 Failed Dependency` → SEFAZ indisponível/timeout (edge case) — `status` do documento fica `SYNC_REQUIRED`; o chamador deve consultar depois via `GET /nfe/{id}`

## `GET /api/v1/nfe/{id}`

Consulta de status (US1 cenário 3, US4).

**Response `200`**: `FiscalDocument` (campos de NF-e) com `status` atual — `pendente`/`autorizado`/`rejeitado`/`cancelado` mapeados para os valores de `FiscalDocumentStatus`.

## `GET /api/v1/nfe/{id}/xml`

Download do XML autorizado (FR-010). `404` se o documento nunca chegou a `AUTHORIZED`.

## `POST /api/v1/nfe/{id}/cancel`

Cancelamento dentro do prazo legal (US4 cenário 1 e 2, FR-004).

**Request**: `{ "justification": "string (mín. 15 caracteres — exigência SEFAZ)" }`

**Responses**:
- `200 OK` → `{ "success": true, "data": { "status": "CANCEL_AUTHORIZED", "protocol": "string", "cancelledAt": "..." } }`
- `409 Conflict` → fora do prazo legal (US4 cenário 2): `{ "success": false, "error": "Prazo de cancelamento expirado em <data>" }`

## `POST /api/v1/nfe/{id}/correction-letter`

Carta de correção (US4 cenário 3, FR-005).

**Request**: `{ "correctionText": "string" }`

**Responses**:
- `200 OK` → `{ "success": true, "data": { "eventId": "uuid", "sequence": 1, "status": "CORRECTION_LETTER_AUTHORIZED", "protocol": "string" } }`
- `422 Unprocessable Entity` → campo mencionado no texto não é passível de correção por lei (edge case do spec)

## `POST /api/v1/nfe/inutilize`

Inutilização de faixa de numeração não utilizada (US4 cenário 4, FR-006).

**Request**: `{ "companyId": "uuid", "series": "1", "numberStart": 100, "numberEnd": 110, "justification": "string" }`

**Responses**:
- `200 OK` → `{ "success": true, "data": { "eventId": "uuid", "status": "INUTILIZED", "protocol": "string" } }`
- `409 Conflict` → a faixa contém números já autorizados (edge case do spec): `{ "success": false, "error": "Faixa contém número(s) já emitido(s): [...]" }`

## Fora de escopo do v1

- `POST /nfe/{id}/sync-status` dedicado — a consulta de sincronização acontece via `GET /nfe/{id}` reexecutando `ConsultDocumentInput` no provider quando `status = SYNC_REQUIRED`; um endpoint de sync explícito fica para quando houver um worker assíncrono (fora do escopo síncrono do v1, FR-016).
- `GET /nfe/{id}/danfe` — geração de DANFE é etapa posterior (Assumptions do spec).
- `GET /nfe/status/sefaz-ba` (status do serviço da SEFAZ) — não é um requisito do spec; pode ser adicionado depois sem impacto no modelo de dados.
