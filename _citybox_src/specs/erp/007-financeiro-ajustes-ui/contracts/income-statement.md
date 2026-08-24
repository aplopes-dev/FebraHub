# Contract: Relatório de Resultados / DRE (`erp-api`, mudança de shape)

## `GET /v1/reports/income-statement` (rota existente — `apps/erp/api/.../reports/.../get-income-statement.route.ts`)

Query: inalterada (`from`, `to` — período de competência).

**Response `200` — forma NOVA** (substitui o `revenue`/`expense` binário atual):

```json
{
  "data": {
    "groups": [
      {
        "financialGroupId": "uuid",
        "name": "Receitas Operacionais",
        "sign": "positive",
        "totalCents": 1250000,
        "accounts": [
          { "chartOfAccountId": "uuid", "name": "Faturamento com serviços", "totalCents": 800000 },
          { "chartOfAccountId": "uuid", "name": "Faturamento com serviços/venda de produtos", "totalCents": 300000 },
          { "chartOfAccountId": "uuid", "name": "Faturamento com venda de produtos", "totalCents": 150000 }
        ]
      },
      { "financialGroupId": "uuid", "name": "Deduções da Receita", "sign": "positive", "totalCents": 0, "accounts": [] },
      { "financialGroupId": "uuid", "name": "Custos Operacionais", "sign": "negative", "totalCents": 320000, "accounts": [] },
      { "financialGroupId": "uuid", "name": "Despesas Operacionais", "sign": "negative", "totalCents": 210000, "accounts": [] },
      { "financialGroupId": "uuid", "name": "Despesas Financeiras", "sign": "negative", "totalCents": 15000, "accounts": [] },
      { "financialGroupId": "uuid", "name": "Outras Receitas", "sign": "positive", "totalCents": 5000, "accounts": [] },
      { "financialGroupId": "uuid", "name": "Outras Despesas", "sign": "negative", "totalCents": 0, "accounts": [] },
      { "financialGroupId": "uuid", "name": "Descontos/Taxas", "sign": "negative", "totalCents": 8000, "accounts": [] },
      {
        "financialGroupId": "uuid",
        "name": "Juros/Multa",
        "sign": "negative",
        "totalCents": 12000,
        "accounts": [
          { "chartOfAccountId": "uuid", "name": "Juros/Multa de Receitas", "totalCents": 4000 },
          { "chartOfAccountId": "uuid", "name": "Juros/Multa de Despesas", "totalCents": 8000 }
        ]
      }
    ],
    "operatingResultCents": 690000,
    "entryCount": 214
  }
}
```

**Breaking change**: consumidores atuais do shape `{ revenue: {...}, expense: {...}, netCents }` (só `features/financial-results` no frontend, confirmado no grounding — nenhum outro consumidor) precisam migrar no mesmo PR. Sem versionamento de API nesta fatia (endpoint interno, um único consumidor conhecido).

**Regra de agregação** (substitui `toSection`):
1. Carrega todos os `FinancialGroup` ativos com `classification = resultado`, ordenados por `catalogOrder` asc.
2. Para cada grupo, carrega os `ChartOfAccount` filhos ativos (se houver), na ordem de cadastro.
3. Preenche `totalCents` de cada grupo/conta a partir do mesmo `sumAllocationsByChartOfAccount` já existente — **0 quando não há allocation no período**, nunca omite a linha.
4. `operatingResultCents = Σ (grupo.totalCents × sinal(grupo.sign))`, onde `sinal(positive) = +1`, `sinal(negative) = -1`.
