# Contract: Fiscal Documents (consulta genérica)

Base path: `/api/v1/fiscal-documents`. Auth: JWT Keycloak, escopado por Emitente (FR-014). Endpoint transversal a NF-e e NFS-e — satisfaz FR-003 ("consultar o status atual... tanto NF-e quanto NFS-e") sem exigir que o chamador saiba de antemão o tipo de documento.

Ver [data-model.md#fiscaldocument](./../data-model.md#fiscaldocument).

## `GET /api/v1/fiscal-documents`

Lista/consulta paginada, sempre filtrada e ordenada no backend (Constitution II — `skip`/`take`/`WHERE`/`ORDER BY`, nunca full-scan para filtro no cliente).

**Query params**: `page`, `limit` (padrão 20, máx. 100), `companyId` (obrigatório), `documentType?` (`NFE`\|`NFSE`), `status?`, `sourceSystem?`, `externalReference?`, `issuedFrom?`, `issuedTo?`.

**Response `200`**:
```json
{
  "success": true,
  "data": [
    { "documentId": "uuid", "documentType": "NFE", "status": "AUTHORIZED", "number": "12345", "protocol": "string", "authorizedAt": "..." }
  ],
  "meta": { "total": 42, "page": 1, "limit": 20 }
}
```

## `GET /api/v1/fiscal-documents/{id}`

Consulta de um documento por `id`, independente do tipo (delega para os campos específicos de NF-e ou NFS-e conforme `documentType`). Mesma forma de resposta de `GET /nfe/{id}` / `GET /nfse/{id}`, com um campo `documentType` para o chamador desambiguar.

**Response `200`**: `FiscalDocument` completo (dados comuns + campos específicos do tipo). `404` se não existe ou o chamador não tem permissão sobre o Emitente dono (FR-014).

## `GET /api/v1/fiscal-documents/{id}/events`

Lista os `FiscalEvent` (cancelamento, carta de correção, inutilização — ver data-model.md) associados a um documento, em ordem cronológica. Cobre a necessidade de auditoria/histórico de US4 sem duplicar os endpoints específicos de `nfe-api.md`/`nfse-api.md`.

**Response `200`**:
```json
{
  "success": true,
  "data": [
    { "eventId": "uuid", "eventType": "CANCEL", "status": "AUTHORIZED", "justification": "string", "protocol": "string", "createdAt": "..." }
  ]
}
```

## Fora de escopo do v1

- `GET /fiscal-documents/{id}/pdf` — depende de DANFE, explicitamente adiado (Assumptions do spec).
- Endpoint de busca full-text — não é um requisito do spec; os filtros estruturados acima (por `companyId`, `status`, `sourceSystem`, `externalReference`, intervalo de datas) cobrem as consultas operacionais esperadas de US1–US4.
