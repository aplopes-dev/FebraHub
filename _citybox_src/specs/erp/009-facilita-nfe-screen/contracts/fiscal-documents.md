# Contracts — `fiscal-api` · módulo `fiscal-documents`

Endpoint existente estendido + endpoint novo. Ambos em
`services/fiscal-api/src/modules/fiscal-documents/`.

## `GET /v1/fiscal-documents` (estendido)

Rota existente (`ListFiscalDocumentsRoute`). Adiciona `search`.

**Query params**

| Nome | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `companyId` | `string` (uuid) | ✅ (já existia) | Emitente fiscal (ver `research.md` §2) |
| `page` | `number` | — | default 1 |
| `perPage` | `number` | — | default 20 |
| `documentType` | `'NFE' \| 'NFSE' \| 'NFCE'` | — | **novo nesta feature**: `@ApiQuery` passa a documentar `NFCE` (já aceito pelo DTO hoje) |
| `status` | `string` (`FiscalDocumentStatus`) | — | já existia |
| `sourceSystem` | `string` | — | já existia |
| `externalReference` | `string` | — | já existia |
| `search` | `string` | — | **novo**: casa contra `number`, `series` (`contains`, case-insensitive) — busca por nome de cliente ficou fora desta entrega (research.md §3) |

**Resposta** — inalterada (envelope de lista já existente,
`FiscalDocumentPresenter.toListHttp`): `{ data: FiscalDocumentListItem[], meta: { total,
page, perPage, totalPages } }`.

**Permissão**: `RequirePermission('fiscal.documents.view')` (já existente, inalterada).

## `GET /v1/fiscal-documents/summary` (novo)

**Query params** — mesmos filtros de `GET /v1/fiscal-documents`, **exceto** `page`/
`perPage`/`status` (o summary sempre calcula os 3 buckets sobre o filtro base):

| Nome | Tipo | Obrigatório |
|---|---|---|
| `companyId` | `string` (uuid) | ✅ |
| `documentType` | `'NFE' \| 'NFSE' \| 'NFCE'` | — |
| `sourceSystem` | `string` | — |
| `externalReference` | `string` | — |
| `search` | `string` | — |

**Resposta**

```json
{
  "total": 128,
  "authorized": 110,
  "cancelled": 6
}
```

**Permissão**: `RequirePermission('fiscal.documents.view')` (mesma da listagem — é
leitura do mesmo recurso, não precisa de permissão nova).

**Erros**

| Status | Quando |
|---|---|
| 400 | `companyId` ausente/vazio (mesmo comportamento de `ListFiscalDocumentsRoute` hoje) |
| 401/403 | sessão inválida / sem `fiscal.documents.view` (guard padrão) |

## `GET /v1/companies` (consumo, sem alteração de contrato)

Usado só para resolver `companyId` a partir do CNPJ da organização ativa (ver
`research.md` §2) — nenhuma mudança nesta rota.

```
GET /v1/companies?cnpj={cnpj}&active=true
```

Resposta esperada: 0 ou 1 `Company` na lista (CNPJ é único por Emitente). Se vazia, a
aba "Emitido" trata como "Emitente fiscal não configurado" (estado vazio orientativo,
não é erro).
