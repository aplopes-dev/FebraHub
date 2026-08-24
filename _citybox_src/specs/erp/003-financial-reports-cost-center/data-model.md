# Data Model: DRE real e análise por centro de custo

Schema Postgres `erp`, `apps/erp/api/prisma/schema.prisma`. **1 enum novo, 1 campo novo** em
`FinancialGroup` (já existente). Nenhum model novo — os dois relatórios são read models
calculados a partir de tabelas que já existem (`financial_entries`, `financial_entry_allocations`,
`chart_of_accounts`, `financial_groups`, `cost_centers`), nenhuma delas persistida por esta
fatia. Ver `research.md` D2 (classificação do grupo) e D3/D5 (estratégia de agregação).

## `FinancialGroup` (existente, estendido)

| Campo | Tipo | Mudança |
|---|---|---|
| `classification` | `FinancialGroupClassification` `@default(resultado)` `@map("classification")` | **Novo.** Determina se o grupo participa do resultado do período (entra na DRE) ou é patrimonial (não entra). Não exposto no presenter de `GET /v1/financial-groups` nem editável via `POST`/`PUT` — fixado pelo backend: `resultado` para todo grupo criado pelo lojista, `patrimonial` só para os dois `systemKey` corrigidos abaixo. |

Nenhum outro campo muda. `type` (`receita`\|`despesa`) continua existindo e continua imutável
(RN-18) — `classification` é um eixo **ortogonal** a `type`: um grupo `patrimonial` ainda tem um
`type`, mas fica fora do cálculo de receita/despesa/resultado líquido da DRE.

```prisma
enum FinancialGroupClassification {
  resultado
  patrimonial

  @@schema("erp")
}
```

### Correção dos grupos de sistema

| `systemKey` | `type` (inalterado) | `classification` (novo) |
|---|---|---|
| `receitas` | `receita` | `resultado` |
| `outras-receitas` | `receita` | `resultado` |
| `despesas` | `despesa` | `resultado` |
| `custos` | `despesa` | `resultado` |
| `caixa-e-bancos` | `receita` | **`patrimonial`** |
| `ativo` | `receita` | **`patrimonial`** |

`finance.seed.ts` passa a semear os 6 grupos já com a `classification` correta (organizações
novas não precisam de backfill). Organizações existentes são corrigidas por um script standalone
— ver `research.md` D2 e `quickstart.md`.

## Read model: `IncomeStatementReport` (DRE)

Não persistido — calculado sob demanda pelo use case `GetIncomeStatement` a partir de
`FinancialEntryAllocation` agregada (`groupBy chartOfAccountId`, `research.md` D3), cruzada com
`ChartOfAccount`/`FinancialGroup` da organização (só grupos `classification = 'resultado'`).

```
IncomeStatementReport
├── from: string (ISO date)
├── to: string (ISO date)
├── revenue: IncomeStatementSection   (grupos type=receita)
├── expense: IncomeStatementSection   (grupos type=despesa)
├── netCents: number                  (revenue.totalCents − expense.totalCents; pode ser negativo)
└── entryCount: number                (total de lançamentos distintos no período, as 2 seções)

IncomeStatementSection
├── totalCents: number                (soma dos grupos da seção; sempre ≥ 0)
└── groups: IncomeStatementGroup[]    (ordenados por totalCents desc)

IncomeStatementGroup
├── groupId: string
├── groupName: string
├── totalCents: number                (sempre ≥ 0)
├── shareOfSection: number            (fração 0..1, groupTotal / sectionTotal; 0 se sectionTotal=0)
└── accounts: IncomeStatementAccount[] (ordenados por totalCents desc)

IncomeStatementAccount
├── accountId: string
├── accountName: string
├── totalCents: number                (sempre ≥ 0)
├── shareOfGroup: number              (fração 0..1, accountTotal / groupTotal; 0 se groupTotal=0)
└── entryCount: number                (nº de FinancialEntryAllocation distintas nesta conta)
```

**Regras de validação/derivação** (aplicadas no use case, não no schema — nada aqui é persistido):

- Só entram lançamentos com `deletedAt IS NULL` e `competenceDate` dentro de `[from, to]`
  (inclusive nas duas pontas) — FR-001/FR-003/FR-010.
- Só entram contas cujo grupo tem `classification = 'resultado'` — FR-004/FR-005.
- `totalCents` de conta/grupo/seção nunca é negativo — é sempre a soma bruta das allocations
  daquela conta no período (magnitude). O sinal negativo da despesa é aplicado só na formatação
  do frontend (`formatResultAmount`, inalterada) — FR-006, `research.md` D8.
- `shareOfGroup`/`shareOfSection` são frações não arredondadas — `research.md` D7.
- Um lançamento rateado entre N contas contribui, para cada conta, exatamente a fração do
  `amountCents` daquela linha de `FinancialEntryAllocation` (o rateio já vem pronto da tabela —
  não há recomputação de percentual aqui).
- Grupo sem nenhuma conta com lançamento no período **não aparece** na árvore (em vez de aparecer
  com total zero) — mantém a árvore só com o que tem dado, mesmo comportamento do mock atual.
- Período sem nenhum lançamento válido → `IncomeStatementReport` com as duas seções vazias
  (`groups: []`, `totalCents: 0`) e `netCents: 0` — nunca `null`/erro (FR-009).

## Read model: `CostCenterAnalysisReport`

Não persistido — calculado pelo use case `GetCostCenterAnalysis` a partir de
`FinancialEntryAllocation` agregada (`groupBy costCenterId`, filtrando `FinancialEntry.operation`
— `research.md` D5), cruzada com `CostCenter` da organização.

```
CostCenterAnalysisReport
├── from: string (ISO date)
├── to: string (ISO date)
├── type: "despesa" | "receita"
├── totalCents: number                       (soma de todos os itens, incl. "Outros")
└── items: CostCenterAnalysisItem[]           (ordenados por valueCents desc)

CostCenterAnalysisItem
├── costCenterId: string | null               (null só no bucket "Outros" — research.md D6)
├── costCenterName: string                    ("Outros" quando costCenterId é null)
├── valueCents: number
├── share: number                             (fração 0..1, valueCents / totalCents; 0 se totalCents=0)
└── entryCount: number
```

**Regras de validação/derivação**:

- `type=despesa` filtra `FinancialEntry.operation = 'payable'`; `type=receita` filtra
  `'receivable'` — `research.md` D5.
- Mesmo filtro de período/exclusão de `deletedAt` que a DRE (FR-010/FR-003, adaptado ao
  parâmetro `type` em vez de seção receita/despesa).
- O bucket "Outros" (`costCenterId: null`) só aparece se houver allocations cujo centro de custo
  não resolve (hoje, na prática, nunca — `research.md` D6) — não é omitido da lista mesmo com
  `valueCents = 0`? Não: se não há nenhuma linha nesse bucket, ele **não aparece** (mesma regra
  de "sem dado, sem linha" da DRE).
- Itens ordenados por `valueCents` decrescente (FR-014); `share` somado de todos os itens fecha em
  1.0 (tolerância de ponto flutuante, `research.md` D7).
- Período sem lançamentos do `type` selecionado → `items: []`, `totalCents: 0` (FR-009,
  equivalente ao caso vazio da DRE).

## Diagrama de dependência (leitura, não FK novas)

```
FinancialEntry (existente)
  └─ allocations: FinancialEntryAllocation[] (existente)
       ├─ chartOfAccount: ChartOfAccount (existente)
       │    └─ financialGroup: FinancialGroup (existente + classification novo)
       └─ costCenter: CostCenter (existente)

  IncomeStatementReport  ← agrega allocations por chartOfAccountId, filtra financialGroup.classification
  CostCenterAnalysisReport ← agrega allocations por costCenterId, filtra financialEntry.operation
```

Nenhuma FK nova. Nenhum model novo. `TENANT_SCOPED_MODELS` não muda (nenhum model novo entra na
allowlist) — os dois relatórios herdam o escopo de tenant das queries que já rodam via
`prisma.scoped` nos repositórios de `financial-entries`/`chart-of-accounts`/`cost-centers` que o
novo repositório de relatórios reaproveita/consulta.
