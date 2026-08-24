# Research: Correções OS, Conciliação e Clientes

**Feature**: [spec.md](./spec.md) | **Date**: 2026-08-20

Cada item da spec já tem causa-raiz confirmada em código antes do plano — sem
`NEEDS CLARIFICATION` restante. Este documento registra as decisões técnicas
tomadas para cada correção.

## D1 — Como incluir linhas de serviço na venda gerada da OS (US1, FR-001/002)

**Causa-raiz confirmada**:
- Frontend: `linesForGenerateSale()` em
  [service-order.mapper.ts](../../../../apps/erp/web/src/features/service-orders/api/service-order.mapper.ts)
  filtra `line.kind === "product" && line.productId` ao montar
  `payloadJson.lines` — linhas de serviço nunca entram no array que o backend lê.
- Backend: `extractLines()` em
  [service-orders.service.ts](../../../../apps/erp/api/src/modules/sales/service-orders/application/service-orders.service.ts)
  também exige `typeof line.productId === "string"`, então mesmo corrigindo só
  o frontend a chamada falharia de novo assim que uma linha de serviço chegasse.
- `SaleOrderLine` (domínio em
  [sale-order.entity.ts](../../../../apps/erp/api/src/modules/sales/domain/entities/sale-order.entity.ts)
  e tabela Prisma `SaleOrderLine`) tem `productId` como FK **obrigatória**
  (`@@unique([saleOrderId, productId])`, `onDelete: Restrict`), usada em:
  - `build-sale-outbound-movement.ts` (baixa de estoque),
  - `assert-sale-order-references.ts` (valida existência do produto),
  - `sale-order.presenter.ts` (enriquece a linha com nome/preço do catálogo).
- Não existe hoje nenhum `ProductType` de "serviço" no catálogo
  (`PRODUCT_TYPES = ['simple', 'collection', 'supply']`).

**Decision**: tornar `productId` opcional em `SaleOrderLine` (schema Prisma +
domínio + casos de uso) e adicionar um campo `description: string | null`
para a linha sem produto vinculado. Regras derivadas:
- Linha COM `productId`: comportamento atual inalterado (baixa de estoque,
  validação de referência, enriquecimento pelo catálogo).
- Linha SEM `productId` (serviço): pula baixa de estoque e validação de
  catálogo; `description` (vindo do texto já digitado pelo operador na linha
  de serviço da OS) é o rótulo exibido no presenter.
- `extractLines()`/`linesForGenerateSale()` passam a aceitar as duas formas
  de linha, mantendo o filtro de "ao menos uma linha" (FR-003) — só o
  critério de inclusão muda.

**Rationale**: é a única opção que atende FR-002 ("todas as linhas... com
quantidade e valor, não somente as linhas de produto de catálogo") preservando
o valor de auditoria/relatório por linha (nome do serviço, não um rótulo
genérico). É consistente com a suposição já registrada na spec
("linhas de serviço não precisam de um cadastro de produto de catálogo").

**Alternatives considered**:
- *Provisionar um produto "Serviço" genérico no catálogo por trás dos panos*
  — rejeitado: todas as linhas de serviço cairiam sob o mesmo produto no
  relatório de vendas, perdendo a descrição individual e distorcendo
  relatórios de faturamento por produto.
- *Criar `ProductType = 'service'` no catálogo* — rejeitado por escopo: exige
  fluxo de cadastro de produto de serviço, precificação, etc. — desproporcional
  para uma correção pontual da geração de venda de OS.

**Impacto de escopo**: mudança de schema (`productId` nullable em
`SaleOrderLine`) — **exige gate `database-reviewer`** antes da implementação
(Constitution V). Módulo `sales` é compartilhado (PDV, food, service-orders);
a migração deve ser aditiva/retrocompatível (nenhuma venda existente tem linha
sem produto, então não há dado a migrar) e os pontos que leem `productId` como
obrigatório (`build-sale-outbound-movement.ts`, `assert-sale-order-references.ts`,
`sale-order.presenter.ts`, repositório Prisma) precisam de guarda explícita
para o caso `null`, não silenciosa.

## D2 — Campo Cliente/Fornecedor da Conciliação bancária (US2, FR-005/006/007/008)

**Causa-raiz confirmada**:
- [create-entry-from-transaction-drawer.tsx](../../../../apps/erp/web/src/features/bank-reconciliation/components/create-entry-from-transaction-drawer.tsx)
  usa um `Input` de texto livre (`partyName`) para "Cliente ou fornecedor".
- O padrão já existe e funciona em Lançamentos financeiros:
  [financial-entry-party-section.tsx](../../../../apps/erp/web/src/features/financial-entries/components/financial-entry-form/financial-entry-party-section.tsx)
  usa `Autocomplete` + `listPartyOptions`/`parsePartyValue` sobre
  `useSelectableCustomersQuery`/`useActiveSuppliersQuery`, resolvendo para
  `partyKind` (`"customer" | "supplier" | null`) + `partyId` + `partyName`.
- No backend, `FinancialEntry.create()` já aceita `customerId`/`supplierId`
  (mutuamente exclusivos, colunas já existentes na tabela `FinancialEntry`) —
  só o fluxo de "Novo Registro" da Conciliação não os usa:
  `CreateEntryFromTransactionHttpDto`/`CreateEntryFromTransactionDto` só têm
  `partyName`, e o use-case não repassa `customerId`/`supplierId` ao criar o
  `FinancialEntry`.

**Decision**: reaproveitar o mesmo componente/padrão de busca combinada
(`Autocomplete` + `listPartyOptions`/`parsePartyValue`) dentro do drawer de
"Novo Registro", e estender o contrato ponta a ponta com `customerId`/
`supplierId` opcionais (mutuamente exclusivos), preservando `partyName` como
está hoje (usado para o texto congelado caso o cadastro seja removido depois —
mesmo tratamento já existente em Lançamentos financeiros).

**Rationale**: elimina duplicação de componente (reuso direto, sem variante
nova), corrige o dado sem exigir nenhuma mudança de schema (colunas já
existem) e mantém o mesmo comportamento de fallback ("Cadastro removido") já
testado em Lançamentos financeiros.

**Alternatives considered**:
- *Criar um componente de busca novo específico da Conciliação* — rejeitado:
  duplicaria lógica de filtro/label já madura em `financial-entry-labels.ts`.

**Impacto de escopo**: sem migração de schema — mudança de DTO HTTP + caso de
uso no backend, e troca de componente no frontend.

## D3 — Edição de Clientes (US3, FR-009/010/011/012)

**Causa-raiz confirmada**: a funcionalidade **já existe em código** (spec
erp/029/B2):
- Rota `/clientes/[id]` → `CustomerEditPage` →
  `useCustomerFormValuesQuery` + `CustomerFormView`, com tratamento de
  "Cliente não encontrado" (`isError || !values`) já implementado —
  cobre FR-010/FR-012 tal como já estão.
- Backend já expõe `update-customer.route.ts` (módulo `customers`).
- A listagem (`customer-list-table.tsx`) já linka cada linha para
  `/clientes/${customer.id}` via `getRowHref` — mas **sem nenhuma affordance
  visível de edição** (sem ícone/botão "Editar"), só o clique implícito na
  linha inteira. Não há nenhuma coluna de ações na tabela.

**Decision**: a correção é de **descoberta**, não de funcionalidade ausente —
adicionar uma coluna de ação com ícone "Editar" visível em cada linha da
listagem de Clientes (`customer-list-table.tsx`), mantendo o clique na linha
como está. Nenhuma mudança de backend é necessária; validar como regressão que
`update-customer` continua funcionando ponta a ponta.

**Rationale**: atende FR-009 ("forma clara e visível de editar... não
escondida") sem reescrever o que já funciona. Consistente com o relato do
usuário — o link existe mas não é percebido como uma ação de edição.

**Alternatives considered**:
- *Reescrever a tela de edição do zero* — rejeitado: nenhuma evidência de que
  o formulário ou o endpoint estejam quebrados; o gap é só de UI de descoberta.

**Impacto de escopo**: mudança frontend-only, sem schema, sem novo endpoint.
