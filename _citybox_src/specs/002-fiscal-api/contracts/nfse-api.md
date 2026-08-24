# Contract: NFS-e (Padrão Nacional — piloto Ilhéus/BA)

Base path: `/api/v1/nfse`. Auth: JWT Keycloak, escopado ao `companyId` do corpo (FR-014). Cobre US2 e as operações de NFS-e de US4. Provider: `ILHEUS_METROPOLIS_NFSE` (Strategy Pattern — `providers/ilheus-metropolis`; protocolo exato pendente de confirmação municipal, ver research.md §7).

Ver [data-model.md#fiscaldocument](./../data-model.md#fiscaldocument).

## `POST /api/v1/nfse`

Emite uma NFS-e para um Emitente do município de Ilhéus/BA (US2 cenário 1 e 2).

**Headers**: `Idempotency-Key: <string>` (opcional, mesma regra de `nfe-api.md`).

**Request**:
```json
{
  "companyId": "uuid",
  "sourceSystem": "erp",
  "externalReference": "string",
  "environment": "HOMOLOGATION | PRODUCTION",
  "customer": { "documentType": "CPF | CNPJ", "document": "string", "name": "string", "email": "string | null" },
  "nfse": {
    "serviceDescription": "string",
    "municipalServiceCode": "17.02",
    "issRate": 0.05,
    "issWithheld": false,
    "deductions": 0
  },
  "items": [
    { "description": "string", "quantity": 1, "unitValue": 850.00, "totalValue": 850.00, "itemType": "SERVICE", "serviceCode": "17.02", "taxJson": { "...": "..." } }
  ]
}
```

**Validação prévia obrigatória**: `Company.cityCodeIbge` deve ser `2913606` (Ilhéus/BA) — qualquer outro município é rejeitado antes de qualquer tentativa de emissão (US2 cenário 2, FR-002).

**Responses** (US2 cenário 1, 2; SC-002, SC-004):
- `201 Created`, `status: "AUTHORIZED"` →
  ```json
  {
    "success": true,
    "data": {
      "documentId": "uuid", "status": "AUTHORIZED", "documentType": "NFSE", "provider": "ILHEUS_METROPOLIS_NFSE",
      "number": "12345", "verificationCode": "ABC123", "protocol": "string",
      "authorizedAt": "2026-08-04T10:00:00Z",
      "xmlUrl": "/api/v1/nfse/{documentId}/xml"
    }
  }
  ```
- `201 Created`, `status: "REJECTED"` → mesma lógica de `nfe-api.md` (rejeição de negócio não é erro HTTP)
- `200 OK` com documento existente → idempotência (FR-013)
- `422 Unprocessable Entity` → dados incompletos/inválidos, **incluindo** município fora de Ilhéus/BA: `{ "success": false, "error": "Município não habilitado para emissão de NFS-e", "data": { "cityCodeIbge": "..." } }`
- `424 Failed Dependency` → indisponibilidade do ambiente municipal/nacional (edge case) — `status` fica `SYNC_REQUIRED`

## `GET /api/v1/nfse/{id}`

Consulta de status (US2 cenário implícito, US4).

## `GET /api/v1/nfse/{id}/xml`

Download do XML/RPS autorizado (FR-010).

## `POST /api/v1/nfse/{id}/cancel`

Cancelamento dentro do prazo legal (US4 cenário 1 e 2, FR-004) — mesma semântica de `nfe-api.md#post-apiv1nfeidcancel`, adaptada ao órgão municipal.

**Request**: `{ "justification": "string" }`

**Responses**: mesmo formato de `nfe-api.md` (`200` autorizado / `409` fora do prazo).

## Fora de escopo do v1

- `POST /nfse/{id}/replace` (substituição) — recurso de NFS-e Nacional avançado, não coberto pelas 4 user stories do spec.
- `POST /nfse/consult-by-rps` / `consult-by-dps` (consulta por identificador alternativo) — a consulta via `GET /nfse/{id}` usando o `documentId` interno já cobre US2/US4; consulta por RPS/DPS bruto é um recurso de reconciliação operacional, não requisito funcional do spec.
- Carta de correção para NFS-e — não é uma operação do padrão NFS-e (é exclusiva de NF-e no desenho legal); não incluída em FR-005.
- Outros municípios além de Ilhéus/BA — arquitetura permite (FR-012), mas nenhum outro provider municipal é implementado neste plano.
