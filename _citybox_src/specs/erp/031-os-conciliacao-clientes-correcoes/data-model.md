# Data Model: Correções OS, Conciliação e Clientes

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

Nenhuma entidade nova. Duas entidades existentes ganham campos opcionais; a
terceira (Cliente) não muda de forma nenhuma.

## SaleOrderLine (alterada — D1)

Tabela: `sale_order_lines` (schema `erp`/`comercio`). Módulo:
`apps/erp/api/src/modules/sales`.

| Campo | Hoje | Depois | Notas |
|---|---|---|---|
| `productId` | `String` (obrigatório, FK `Product`, `onDelete: Restrict`) | `String?` (opcional, FK `Product`, `onDelete: Restrict`) | `null` = linha de serviço sem vínculo de catálogo |
| `description` | — (não existe) | `String?` | Novo campo. Obrigatório quando `productId` é `null` (regra de domínio, não de banco); rótulo exibido no presenter para linhas sem produto |
| `quantity` | `Decimal(18,6)` | inalterado | |
| `unitPriceCents` | `Int` | inalterado | |

**Constraint alterada**: `@@unique([saleOrderId, productId])` — precisa
tolerar múltiplas linhas com `productId = null` na mesma venda (várias linhas
de serviço). Um índice único parcial (`WHERE product_id IS NOT NULL`) resolve
sem enfraquecer a garantia original para linhas de produto.

**Regra de domínio**: uma `SaleOrderLine` tem exatamente uma de duas formas —
`{ productId: string, description: null }` (produto de catálogo, enriquecido
via join) ou `{ productId: null, description: string }` (serviço, rótulo
próprio). Nunca as duas `null` ao mesmo tempo (viola FR-002 — toda linha
precisa de um rótulo identificável).

**Pontos de leitura que precisam de guarda explícita para `productId: null`**:
- `build-sale-outbound-movement.ts` — pula a linha na baixa de estoque.
- `assert-sale-order-references.ts` — pula a validação de existência do
  produto para a linha.
- `sale-order.presenter.ts` — usa `description` como rótulo em vez do nome
  do produto enriquecido.
- `prisma-sale-order.repository.ts` — grava `productId: null` e persiste
  `description`.

**Migração**: aditiva. Nenhuma linha existente tem `productId` nulo hoje, então
não há dado a migrar/backfill — só relaxar a nulabilidade e trocar o índice
único. **Requer gate `database-reviewer`** antes da implementação (módulo
`sales` é compartilhado por PDV, food e service-orders).

## FinancialEntry (alterada — D2, sem mudança de schema)

Tabela: `financial_entries`. As colunas `customer_id`/`supplier_id` **já
existem** e já são usadas pelo fluxo de Lançamentos financeiros — nenhuma
migração é necessária. Muda apenas o contrato do endpoint que hoje não as usa:

| Campo (payload `create-entry` da Conciliação) | Hoje | Depois |
|---|---|---|
| `partyName` | `string?` (texto livre) | inalterado — continua sendo o rótulo congelado |
| `customerId` | — (não aceito) | `string?` (UUID), mutuamente exclusivo com `supplierId` |
| `supplierId` | — (não aceito) | `string?` (UUID), mutuamente exclusivo com `supplierId` |

Regra de mutuamente exclusivo já existe em `FinancialEntry` (`if (customerId
&& supplierId) throw`) — só precisa ser alcançável a partir deste endpoint.

## Cliente (Customer) — sem alteração de dado (D3)

Nenhum campo novo. A correção é de affordance de UI na listagem
(`customer-list-table.tsx`); o formulário de edição, a query de valores e o
endpoint `PUT` já existem e já cobrem os dados descritos na spec (dados
pessoais, categoria, endereços).
