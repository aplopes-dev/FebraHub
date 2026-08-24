# Phase 1 Data Model: Ajustes no módulo Financeiro

Schema Prisma alvo: `apps/erp/api/prisma/schema.prisma`, schema `erp` (mesmo tenant single-schema já usado por `CostCenter`/`FinancialGroup`/`ChartOfAccount`).

## Entidade nova: `PaymentMethod`

Representa um meio de pagamento utilizável em `FinancialEntryPayment` (Key Entity "Forma de pagamento" do spec). Padrão idêntico a `CostCenter`.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String @id @default(dbgenerated("citybox_uuid_v7()"))` | UUID v7, padrão do monorepo |
| `organizationId` | `String` | tenant, FK `Organization` |
| `name` | `String` | único por `(organizationId, name)`, comparação sem acento/caixa na aplicação (mesmo padrão de `isPaymentMethodNameTaken` do mock atual) |
| `fiscalCode` | `String?` | código `tPag` da NF-e (ex.: `"01"`), opcional — campo já existe no tipo do frontend (`payment-method.ts`), migra para a entidade real |
| `installmentPermission` | `String?` | valor do `Autocomplete` "Permissão de parcelamento" já existente na UI mock — migra como está |
| `systemKey` | `String?` | único por `(organizationId, systemKey)`, preenchido só nos 15 registros de sistema (seed) |
| `isSystem` | `Boolean @default(false)` | `true` para os 15 padrão; bloqueia edição e exclusão (FR-019) |
| `deletedAt` | `DateTime?` | soft-delete |
| `createdAt` / `updatedAt` | `DateTime` | padrão |

**Validation rules** (da spec):
- FR-018: os 15 registros de sistema (nomes exatos: Dinheiro, Cheque, Cartão de Crédito, Cartão de Débito, Boleto, Depósito, PagSeguro, Débito em Conta, Vale Alimentação, Vale Refeição, Vale Presente, Crédito em Loja, Faturamento, Pontos de Fidelidade, PIX) sempre existem por organização (seed via `store-setup`, R3).
- FR-019: `isSystem === true` → `UpdatePaymentMethodUseCase` e `DeletePaymentMethodUseCase` MUST recusar com erro de domínio (`PaymentMethodNotRemovableError` / erro de campo imutável, R2).
- FR-020: nome único (comparação normalizada) na criação/edição de forma de pagamento própria.
- FR-021: exclusão de forma própria em uso por algum `FinancialEntryPayment.paymentMethodId` MUST ser bloqueada com mensagem — checagem via `countUsageByPaymentMethodId` (query de existência, não precisa carregar registros).

**State transitions**: `active` (`deletedAt = null`) ↔ `deleted` (`deletedAt = timestamp`), idêntico a `CostCenter`. Sem estado adicional.

**Relationships**: referenciada por `FinancialEntryPayment.paymentMethodId` — **sem FK Prisma** (permanece `String` solto, ver `research.md` R1). A relação é lógica/aplicação, resolvida por consulta no use-case, não por `@relation`.

## `FinancialEntryPayment` — sem mudança de schema

Campo `paymentMethod: String` (linha `apps/erp/api/prisma/schema.prisma:2439`) **permanece inalterado no schema**. Muda apenas a validação HTTP (`financial-entry.dto.ts`): de `@IsIn(FINANCIAL_ENTRY_PAYMENT_METHODS)` para `@IsUUID()` + checagem de existência em `PaymentMethodRepository` dentro do use-case de create/update do lançamento (mesmo padrão de `assertCostCenterExists`).

## `FinancialGroup` — 2 campos novos (suporte à DRE reestruturada, FR-010)

| Campo novo | Tipo | Notas |
|---|---|---|
| `catalogOrder` | `Int @default(0)` | ordem de exibição fixa na árvore da DRE — substitui a ordenação atual por `totalCents desc` quando `classification = resultado` |
| `sign` | `FinancialGroupSign` (novo enum: `positive` \| `negative`) | sinal do grupo no cálculo de Resultado Operacional — hoje inferido implicitamente por `financialGroupType` (receita=positivo, despesa=negativo); o novo modelo tem grupos com sinal independente do tipo (ex.: "Descontos/Taxas (-)" não é necessariamente `despesa`) |

Ambos os campos **não são expostos no formulário/CRUD de `/financas/grupo-financeiro`** — mesma decisão já tomada para `classification` (consumido só pela DRE, ver `apps/erp/web/AGENTS.md` §4.5). Só o seed (R3/R6) os preenche.

**Novos registros de seed `FinancialGroup`** (9, todos `classification: resultado`, `isSystem: true`):

| `catalogOrder` | Nome | `sign` |
|---|---|---|
| 1 | Receitas Operacionais | `positive` |
| 2 | Deduções da Receita | `positive` |
| 3 | Custos Operacionais | `negative` |
| 4 | Despesas Operacionais | `negative` |
| 5 | Despesas Financeiras | `negative` |
| 6 | Outras Receitas | `positive` |
| 7 | Outras Despesas | `negative` |
| 8 | Descontos/Taxas | `negative` |
| 9 | Juros/Multa | `negative` |

Convenção de sinal do spec: "(+)"/"(-)" ao lado de cada categoria no pedido do usuário mapeia direto para `sign`.

**Novos registros de seed `ChartOfAccount`** (subcategorias, `financialGroupId` apontando para o grupo pai):

| Grupo pai | Conta filha |
|---|---|
| Receitas Operacionais | Faturamento com serviços |
| Receitas Operacionais | Faturamento com serviços/venda de produtos |
| Receitas Operacionais | Faturamento com venda de produtos |
| Juros/Multa | Juros/Multa de Receitas |
| Juros/Multa | Juros/Multa de Despesas |

Os demais 6 grupos (Deduções da Receita, Custos Operacionais, Despesas Operacionais, Despesas Financeiras, Outras Receitas, Outras Despesas, Descontos/Taxas) não têm subcategoria no modelo fornecido — aparecem na árvore como grupo-folha (sem filhos expansíveis), consistente com o comportamento atual da árvore Grupo→Conta quando um grupo não tem contas.

## `IncomeStatementReportDto` — forma nova (substitui `revenue`/`expense` binário)

```
IncomeStatementReportDto {
  groups: IncomeStatementGroupDto[]   // ordenados por catalogOrder, sempre os grupos ativos de classification=resultado
  operatingResultCents: number        // soma de todos os grupos já com sinal aplicado
  entryCount: number
}

IncomeStatementGroupDto {
  financialGroupId: string
  name: string
  sign: 'positive' | 'negative'
  totalCents: number                  // 0 quando não há allocation no período
  accounts: IncomeStatementAccountDto[]  // vazio quando o grupo não tem subcategoria
}

IncomeStatementAccountDto {
  chartOfAccountId: string
  name: string
  totalCents: number                  // 0 quando não há allocation no período
}
```

## Bancos e Provedores — sem entidade nova (catálogos estáticos de frontend)

Conforme `research.md`/Clarifications da spec, nenhum dos dois vira tabela:

- **Banco**: `apps/erp/web/src/features/bank-accounts/lib/bank-catalog.ts` — constante `BANK_CATALOG` substituída pelos 19 itens especificados (código + nome). `BankAccount.bankCode` (schema já existente) não muda.
- **Provedor**: `apps/erp/web/src/features/card-contracts/data/card-providers.ts` — constante `CARD_PROVIDER_SUGGESTIONS` substituída pelos 20 itens especificados, e o campo do formulário passa de `Autocomplete` livre para `Autocomplete`/`Select` fechado (`freeSolo` removido). `CardContract.provider` (schema já existente, `String`) não muda.

## `FinancialEntry` — bloqueio de exclusão com conciliação ativa (FR-006e/f, US10)

Sem campo de schema novo em `FinancialEntry`/`FinancialEntryPayment`. A regra é derivada, consultando a tabela já existente `BankStatementMatch` (schema `bank-reconciliation`):

**Regra de bloqueio**: `DeleteFinancialEntryUseCase` bloqueia (409, `FinancialEntryNotRemovableError`, novo) quando `BankStatementMatchRepository.findActiveFinancialEntryIds(organizationId, [entry.id])` (método já existente) devolve um `Set` contendo `entry.id`. `BankStatementMatch` não tem status próprio — a linha só existe enquanto a conciliação está ativa (hard-delete no undo, ver abaixo) — então a mera existência já é o sinal correto, sem precisar juntar com `BankStatementTransaction.status`.

**Dependência a fechar nesta fatia**: `UndoReconciliationUseCase` (novo) + rota `POST /v1/bank-statements/:bankStatementId/transactions/:transactionId/reconcile/undo` — o frontend já chama essa rota (`undoReconciliationApi`) e a entidade `BankStatementTransaction.undoReconciliation()` já existe, mas não há use-case/controller ligando os dois (`research.md` R9). O use-case novo reaproveita `BankStatementMatchRepository.deleteByTransactionId` (já existente) para apagar os matches ao desfazer — é isso que faz o lançamento voltar a ser excluível (FR-006f). Sem essa rota, FR-006e bloqueia permanentemente sem saída — inaceitável frente a FR-006f.

## Catálogo `CARD_BRAND_OPTIONS` — ampliado (FR-006a..d, US9)

Sem entidade nova — mesma decisão de "catálogo estático de frontend" já usada para Banco/Provedor. `apps/erp/web/src/features/card-contracts/data/card-brands.ts` passa de 10 para a união com as opções desta fatia:

| `value` (persistido, inalterado onde já existia) | Novo nesta fatia? |
|---|---|
| Visa | não |
| Mastercard | não (grafia mantida — pedido do usuário usa "MasterCard", mas trocar o `value` invalidaria dado já gravado; `label` pode exibir "Mastercard") |
| Elo | não |
| American Express | não |
| Hipercard | não |
| Diners Club | não (não estava no pedido do usuário — mantido por decisão da Clarification: "sem remover nenhuma opção hoje válida") |
| Discover | não (idem) |
| Sodexo | não |
| Alelo | não |
| Outra | não (pedido do usuário usa "Outros" — mantido `"Outra"` como `value` por já existir em dado persistido; considerar `label: "Outros"` se a UI exibir o rótulo do pedido do usuário) |
| Sorocred | **sim** |
| Credicard | **sim** |
| Ticket | **sim** |
| VR Benefícios | **sim** |
| Banricompras | **sim** |

`CardPaymentMethod.brand` (contrato de cartão) e `FinancialEntryPayment.cardBrand`/`SaleOrderPayment.cardBrand` continuam `String?` livres no schema Prisma — nenhuma migration.

## `BankStatement` — auto-detecção de conta (FR-007a/b)

Sem novo campo de schema — `BankStatement.bankAccountId` já é opcional o suficiente para representar "sem conta associada" (nullable ou vazio, a confirmar no schema atual). A mudança é de **fluxo**, não de dado: `ImportBankStatementUseCase` passa a aceitar `bankAccountId` ausente no DTO de entrada e resolve automaticamente via `bankCode` (comparação com `BankAccount.bankCode` ativo da organização), persistindo `bankAccountId = null` quando a resolução for ambígua (0 ou 2+ correspondências) — ver `research.md` R8 para a decisão de sequenciamento (preview endpoint vs. resolução só no import definitivo).
