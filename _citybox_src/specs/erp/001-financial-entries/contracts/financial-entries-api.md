# Contract: `v1/financial-entries` (erp-api, :3114)

Base path `apps/erp/api` — `@Controller('v1/financial-entries')`. Todas as rotas exigem
`X-Organization-Id` (injetado pelo proxy do frontend a partir do escopo ativo) e passam pelos
guards globais (`AuthGuard` + `PermissionGuard`). Envelope de resposta: item único `{ data }`,
lista `{ data, meta, tabCounts }` — inalterado em relação ao padrão já usado no módulo `finance`.

## `GET /v1/financial-entries`

**Permissão**: `org.view`

**Query params** (`ListFinancialEntriesQueryDto`, todos opcionais):

| Param | Tipo | Notas |
|---|---|---|
| `operation` | `receivable`\|`payable` | inalterado |
| `status` | `pending`\|`paid` (repetível → array) | **NOVO** (FR-008/FR-018) |
| `chartOfAccountId` | uuid (repetível → array) | **NOVO** — filtra por lançamentos que têm ao menos uma `allocation` com essa conta |
| `costCenterId` | uuid (repetível → array) | **NOVO** — idem, por centro de custo |
| `search` | string | inalterado — casa `description`/`partyName` |
| `dueFrom`/`dueTo` | date | renomeados de `dateFrom`/`dateTo` para casar com a nomenclatura do spec (`dueDate` range) — **breaking rename**, front atualiza junto |
| `sort` | `due_date_asc`\|`due_date_desc`\|`amount_desc`\|`amount_asc`\|`created_at_desc` | **NOVO** — hoje a listagem só ordena fixo por `dueDate desc` |
| `tab` | `active`\|`deleted` | inalterado |
| `page`/`perPage` | int | inalterado, teto 100 |

**200** → `{ data: FinancialEntryListItem[], meta: { total, page, perPage, totalPages }, tabCounts: { active, deleted } }`

`FinancialEntryListItem` (shape do item na listagem — mais enxuto que o detalhe):
```json
{
  "id": "uuid",
  "operation": "receivable",
  "description": "string",
  "amountCents": 1000000,
  "feesCents": 0,
  "finesCents": 0,
  "totalCents": 1000000,
  "paidCents": 500000,
  "status": "pending",
  "competenceDate": "2026-08-01",
  "dueDate": "2026-08-10",
  "partyName": "string",
  "categoryLabel": "string | null",
  "deletedAt": null,
  "createdAt": "iso"
}
```
`categoryLabel` = nome da primeira `allocation` (ou `"Múltiplas categorias"` se houver mais de
uma) — RN-02 exige mostrar a categoria financeira na listagem sem forçar o front a buscar todas
as `allocations` de cada linha.

---

## `GET /v1/financial-entries/:id`

**Permissão**: `org.view`

**200** → `{ data: FinancialEntryDetail }` — inclui `payments[]`, `allocations[]`,
`attachments[]` completos, `supplierId`, `note`, `readOnly: boolean` (= `saleOrderId != null`,
FR-016 — o frontend usa esse campo para travar o formulário sem precisar reimplementar a regra).

**404** → lançamento não existe ou não pertence à organização.

---

## `POST /v1/financial-entries`

**Permissão**: `store.finance.manage`

**Body** (`CreateFinancialEntryHttpDto`):
```json
{
  "operation": "receivable",
  "description": "string",
  "amountCents": 1000000,
  "feesCents": 0,
  "finesCents": 0,
  "competenceDate": "2026-08-01",
  "dueDate": "2026-08-10",
  "bankAccountId": "uuid",
  "note": "string?",
  "partyKind": "customer | supplier | null",
  "customerId": "uuid | null",
  "supplierId": "uuid | null",
  "payments": [
    { "amountCents": 500000, "paidAt": "2026-08-01", "paymentMethod": "dinheiro", "cardBrand": null }
  ],
  "allocations": [
    { "chartOfAccountId": "uuid", "costCenterId": "uuid", "amountCents": 800000, "percentage": 80 },
    { "chartOfAccountId": "uuid", "costCenterId": "uuid", "amountCents": 200000, "percentage": 20 }
  ]
}
```
- `saleOrderId` **não** faz parte do DTO de escrita — só é gravado pelo fechamento de `SaleOrder`
  (infra), nunca aceito via HTTP (mesma regra de hoje).
- `partyKind`/`customerId`/`supplierId`: no máximo um de `customerId`/`supplierId` preenchido;
  os dois nulos é permitido (vínculo opcional, FR-005).

**Validações → erro**:
| Condição | Erro | HTTP |
|---|---|---|
| `bankAccountId` não existe na organização | `BankAccountNotFoundError` | 404 |
| algum `chartOfAccountId`/`costCenterId` não existe na organização | `ChartOfAccountNotFoundError`/`CostCenterNotFoundError` | 404 |
| `customerId`/`supplierId` não existe na organização | `CustomerNotFoundError`/`SupplierNotFoundError` | 404 |
| `customerId` e `supplierId` preenchidos ao mesmo tempo | erro de validação DTO | 422 |
| `allocations` vazio com `totalCents > 0`, ou soma fora de ±1 centavo do total | `AllocationMismatchError` | 422 |
| linha de `allocations` sem `costCenterId` | erro de validação DTO (`@IsUUID` obrigatório) | 422 |

**201** → `{ data: FinancialEntryDetail }`

---

## `PUT /v1/financial-entries/:id`

**Permissão**: `store.finance.manage`

Mesmo body do `POST` (semântica destrutiva — RN-14: campo omitido volta ao vazio, `payments`/
`allocations` são substituídos por completo).

**Validações adicionais**:
| Condição | Erro | HTTP |
|---|---|---|
| lançamento vinculado a pedido de venda (`saleOrderId != null`) | `SaleOrderLinkedEntryForbiddenError` | 403 |

Demais validações iguais ao `POST`.

**200** → `{ data: FinancialEntryDetail }`

---

## `DELETE /v1/financial-entries/:id`

**Permissão**: `store.finance.manage`. Soft-delete — inalterado. **204**. Permitido mesmo se
`saleOrderId != null` (só edição de campo é bloqueada, não exclusão — FR-016/FR-017).

## `POST /v1/financial-entries/:id/restore`

**Permissão**: `store.finance.manage`. Idempotente — inalterado. **200** → `{ data: FinancialEntryDetail }`.

---

## `POST /v1/financial-entries/:id/attachments`

**Permissão**: `store.finance.manage`. `multipart/form-data`, campo `file` (mesmo padrão de
imagem de produto). Limite 5MB, tipos aceitos: PDF, JPG, PNG, WEBP (D14).

**201** → `{ data: FinancialEntryAttachment }` (`id`, `fileName`, `contentType`, `sizeBytes`,
`createdAt` — nunca `objectKey`).

**422** → `InvalidAttachmentFileError` (tipo/tamanho fora do permitido).
**404** → lançamento não existe na organização.

## `GET /v1/financial-entries/:id/attachments/:attachmentId`

**Permissão**: `org.view`. Stream do arquivo (`Content-Type` do `contentType` salvo,
`Content-Disposition: attachment; filename="..."`).

## `DELETE /v1/financial-entries/:id/attachments/:attachmentId`

**Permissão**: `store.finance.manage`. Remove do MinIO + linha do banco. **204**.

---

## Notas de compatibilidade

- `bankAccountId`, `chart-of-accounts`, `cost-centers`, `customers`, `suppliers`: contratos HTTP
  **inalterados** — esta feature só consome, nunca modifica (restrição do prompt original).
- Rename de query param `dateFrom`/`dateTo` → `dueFrom`/`dueTo` é a única mudança
  backwards-incompatible na listagem existente — o frontend desta mesma feature é o único
  consumidor conhecido (`use-financial-entry-list.ts`), atualizado na mesma operação.
