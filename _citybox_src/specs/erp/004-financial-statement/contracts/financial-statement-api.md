# Contract: `v1/financial-entries` (erp-api, :3114) — extensões para o Extrato

Base path `apps/erp/api` — `@Controller('v1/financial-entries')`, módulo `finance/financial-entries`
já existente (`001-financial-entries`). Duas mudanças: (1) `GET /v1/financial-entries` ganha filtros
novos; (2) rota nova `GET /v1/financial-entries/summary`. Ambas exigem `X-Organization-Id` e passam
pelos guards globais (`AuthGuard` + `PermissionGuard`, `org.view`). Nenhuma rota de escrita é tocada
(FR-003). O saldo por conta (US2) **não tem contrato novo** — reaproveita
`GET /v1/bank-accounts` já documentado em `002-bank-account-ledger`.

## `GET /v1/financial-entries` (estendida)

Listagem já existente — `data-model.md` § `FinancialEntry`. Query params novos
(`ListFinancialEntriesQueryDto`, que passa a estender `FinancialEntryFilterQueryDto` —
`research.md` D5):

| Param | Tipo | Obrigatório | Notas |
|---|---|---|---|
| `competenceFrom` | date (`YYYY-MM-DD`) | não | recorta por `competenceDate >= `, inclusive |
| `competenceTo` | date (`YYYY-MM-DD`) | não | recorta por `competenceDate <= `, inclusive |
| `bankAccountId` | uuid | não | lançamento com esse `bankAccountId` exato |

Params já existentes, inalterados: `operation`, `status[]`, `chartOfAccountId[]`, `costCenterId[]`,
`search`, `dueFrom`, `dueTo`, `tab`, `sort`, `page`, `perPage`.

**422** novo — se `dueTo < dueFrom` **ou** `competenceTo < competenceFrom` (mensagem clara,
`InvalidStatementPeriodError` — `research.md` D3). Antes desta fatia, um intervalo invertido em
`dueFrom`/`dueTo` devolvia silenciosamente uma lista vazia; agora rejeita explicitamente.

Resposta (`200`) inalterada — mesmo envelope `{ data: FinancialEntryListItem[], meta }` de
`001-financial-entries`.

## `GET /v1/financial-entries/summary` (nova)

Cards de resumo do extrato (FR-008) — `data-model.md` § `FinancialEntriesSummary`. Aceita
**exatamente os mesmos filtros** da listagem acima (menos paginação/ordenação/aba — resumo sempre
soma o conjunto filtrado inteiro, sempre só lançamentos ativos).

**Permissão**: `org.view`

**Query params** (`GetFinancialEntriesSummaryQueryDto extends FinancialEntryFilterQueryDto`):

| Param | Tipo | Obrigatório | Notas |
|---|---|---|---|
| `operation` | `receivable` \| `payable` | não | omitido = soma os dois lados |
| `status[]` | `pending`\|`paid` (repetível) | não | |
| `chartOfAccountId[]` | uuid (repetível) | não | |
| `costCenterId[]` | uuid (repetível) | não | |
| `bankAccountId` | uuid | não | |
| `search` | string | não | descrição ou nome da parte |
| `dueFrom` / `dueTo` | date | não | |
| `competenceFrom` / `competenceTo` | date | não | |

**422** se `dueTo < dueFrom` ou `competenceTo < competenceFrom` (mesma validação da listagem).

**200** →
```json
{
  "data": {
    "receivableCents": 1500000,
    "payableCents": 400000,
    "netCents": 1100000
  }
}
```

Nenhum lançamento no conjunto filtrado → `{ "receivableCents": 0, "payableCents": 0, "netCents": 0 }`
(200, nunca 404/erro — mesma convenção de `finance/reports`).

---

## Reaproveitado sem mudança: `GET /v1/bank-accounts` (US2 — saldo por conta)

Contrato inalterado, documentado em `002-bank-account-ledger`. O frontend do extrato chama
`GET /v1/bank-accounts?perPage=100&tab=active` (`research.md` D6) e lê `currentBalanceCents` de
cada item — sem paginação visível na UI do extrato (cadastro de porte limitado). Nenhuma mudança de
contrato nesta fatia.

```json
{
  "data": [
    { "id": "uuid", "name": "Banco do Brasil — Conta corrente", "bankName": "Banco do Brasil", "currentBalanceCents": 850000 }
  ],
  "meta": { "page": 1, "perPage": 100, "total": 3, "totalPages": 1 }
}
```
