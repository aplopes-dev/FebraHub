# Contract: Companies (Emitentes)

Base path: `/api/v1/companies`. Auth: JWT Keycloak (guardas internos — FR-015, v1 só para chamadores internos do CityBox: ERP, admin-api). Todas as respostas seguem o envelope padrão do monorepo (`ApiResponse<T>` — `success`/`data`/`error`/`meta`).

Ver [data-model.md#company-emitente](./../data-model.md#company-emitente) para o modelo completo.

## `POST /api/v1/companies`

Provisiona o Emitente fiscal de uma Loja do CityBox (research.md §9 — passo explícito, não disparado por evento).

**Request**:
```json
{
  "storeId": "uuid",
  "cnpj": "12345678000199",
  "legalName": "string",
  "tradeName": "string | null",
  "stateRegistration": "string | null",
  "municipalRegistration": "string | null",
  "taxRegime": "SIMPLES_NACIONAL | LUCRO_PRESUMIDO | LUCRO_REAL",
  "cityCodeIbge": "2913606",
  "uf": "BA",
  "address": {
    "street": "string", "number": "string", "complement": "string | null",
    "district": "string", "city": "string", "zipCode": "string"
  },
  "defaultEnvironment": "HOMOLOGATION | PRODUCTION"
}
```

**Responses**:
- `201 Created` → `{ "success": true, "data": { "id": "uuid", "storeId": "uuid", "cnpj": "...", "active": true, ... } }`
- `409 Conflict` → já existe um Emitente para esse `storeId` (relação 1:1 — Key Entities do spec)
- `422 Unprocessable Entity` → `cnpj` com dígito verificador inválido, ou `cityCodeIbge` ausente quando `municipalRegistration` foi enviada

## `GET /api/v1/companies`

Lista Emitentes — paginação e filtro sempre no backend (Constitution II).

**Query params**: `page`, `limit`, `cnpj?`, `active?`.

**Response `200`**: `{ "success": true, "data": [Company...], "meta": { "total": n, "page": n, "limit": n } }`

## `GET /api/v1/companies/{id}`

**Response `200`**: `Company` completo. `404` se não existe ou o chamador não tem permissão sobre ele (FR-014 — não distinguir "não existe" de "sem permissão" na mensagem, para não vazar existência).

## `PATCH /api/v1/companies/{id}`

Atualiza campos cadastrais (não permite trocar `storeId` nem `cnpj` — exigiria novo cadastro; ver Assumptions do spec sobre imutabilidade da relação 1:1).

**Request**: subconjunto parcial de `legalName`, `tradeName`, `stateRegistration`, `municipalRegistration`, `taxRegime`, `address`, `defaultEnvironment`, `active`.

**Response `200`**: `Company` atualizado.

## Fora de escopo do v1

- `DELETE /companies/{id}` — desativação lógica via `PATCH { active: false }` cobre o caso de uso necessário; exclusão física de um Emitente com documentos fiscais emitidos violaria FR-010 (retenção de auditoria).
- Onboarding self-service por empresas externas ao CityBox (API Key própria por cliente) — depende da reabertura de FR-015.
