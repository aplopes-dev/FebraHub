# HTTP contracts — 001-document-generator

Prefixo `api`. Envelope `{ data }` / `{ data, meta }`.

## Templates (`Settings`)

- `GET /v1/document-templates` — `page`, `perPage`, `search`, `tipo`, `ativo`
- `POST /v1/document-templates`
- `GET /v1/document-templates/variables`
- `POST /v1/document-templates/defaults` — esqueletos da loja (idempotente)
- `GET /v1/document-templates/:id`
- `PATCH /v1/document-templates/:id`
- `DELETE /v1/document-templates/:id`

## Generate (`Lead` | `Calendar` | `Transaction` conforme contexto)

- `POST /v1/documents/preview` — `{ templateId, leadId? | appointmentId? | transactionId? }` → `{ html, snapshot }`
- `POST /v1/documents/generate` — mesmo body + `kind?` → documento gerado + `leadDocument?`
- `GET /v1/documents/:id`

## Lead files (`Lead`)

- `POST /v1/leads/:leadId/documents` — multipart `file` + `kind` + `name?`
- `GET /v1/leads/:leadId/documents/:documentId` — stream
