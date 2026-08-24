# Contract: `v1/reports` (erp-api, :3114)

Base path `apps/erp/api` — `@Controller('v1/reports')`. Submódulo novo, só leitura (nenhum
`POST`/`PUT`/`DELETE`). Ambas as rotas exigem `X-Organization-Id` e passam pelos guards globais
(`AuthGuard` + `PermissionGuard`). Envelope de resposta: `{ data }` (sem paginação — ver
`research.md` D9: o volume de retorno é limitado pelo tamanho do cadastro, não pelo histórico de
lançamentos).

## `GET /v1/reports/income-statement`

DRE (relatório de resultados) — `data-model.md` § `IncomeStatementReport`.

**Permissão**: `org.view`

**Query params** (`GetIncomeStatementQueryDto`):

| Param | Tipo | Obrigatório | Notas |
|---|---|---|---|
| `from` | date (`YYYY-MM-DD`) | ✅ | início do período de competência, inclusive |
| `to` | date (`YYYY-MM-DD`) | ✅ | fim do período de competência, inclusive |

**422** se `to < from` (mensagem clara — Edge Case do `spec.md`).

**200** →
```json
{
  "data": {
    "from": "2026-08-01",
    "to": "2026-08-31",
    "revenue": {
      "totalCents": 15000000,
      "groups": [
        {
          "groupId": "uuid",
          "groupName": "Receitas",
          "totalCents": 15000000,
          "shareOfSection": 1.0,
          "accounts": [
            {
              "accountId": "uuid",
              "accountName": "Vendas de mercadorias",
              "totalCents": 15000000,
              "shareOfGroup": 1.0,
              "entryCount": 42
            }
          ]
        }
      ]
    },
    "expense": {
      "totalCents": 10000,
      "groups": [
        {
          "groupId": "uuid",
          "groupName": "Despesas fixas",
          "totalCents": 10000,
          "shareOfSection": 1.0,
          "accounts": [
            {
              "accountId": "uuid",
              "accountName": "Internet",
              "totalCents": 10000,
              "shareOfGroup": 1.0,
              "entryCount": 1
            }
          ]
        }
      ]
    },
    "netCents": 14990000,
    "entryCount": 43
  }
}
```

Período sem lançamentos válidos → `revenue`/`expense` com `groups: []`, `totalCents: 0`,
`netCents: 0`, `entryCount: 0` (200, nunca 404/erro).

---

## `GET /v1/reports/cost-centers`

Análise por centro de custo — `data-model.md` § `CostCenterAnalysisReport`.

**Permissão**: `org.view`

**Query params** (`GetCostCenterAnalysisQueryDto`):

| Param | Tipo | Obrigatório | Notas |
|---|---|---|---|
| `from` | date (`YYYY-MM-DD`) | ✅ | início do período, inclusive |
| `to` | date (`YYYY-MM-DD`) | ✅ | fim do período, inclusive |
| `type` | `despesa`\|`receita` | ✅ | filtra por `FinancialEntry.operation` (`payable`/`receivable` — `research.md` D5) |

**422** se `to < from`.

**200** →
```json
{
  "data": {
    "from": "2026-08-01",
    "to": "2026-08-31",
    "type": "despesa",
    "totalCents": 10000000,
    "items": [
      { "costCenterId": "uuid", "costCenterName": "Recursos Humanos", "valueCents": 5000000, "share": 0.5, "entryCount": 12 },
      { "costCenterId": "uuid", "costCenterName": "Financeiro", "valueCents": 2000000, "share": 0.2, "entryCount": 5 },
      { "costCenterId": null, "costCenterName": "Outros", "valueCents": 300000, "share": 0.03, "entryCount": 1 }
    ]
  }
}
```

Período sem lançamentos do `type` selecionado → `items: []`, `totalCents: 0` (200).

---

## Erros comuns às duas rotas

| Situação | Status | Corpo |
|---|---|---|
| `from`/`to` ausente ou formato inválido | 400 | erro de validação do DTO (`class-validator`, padrão do projeto) |
| `to < from` | 422 | `InvalidReportPeriodError` |
| Sem `X-Organization-Id` | 400 | padrão global (`TenantContextGuard`) |
| Sem permissão `org.view` | 403 | padrão global (`PermissionGuard`) |
