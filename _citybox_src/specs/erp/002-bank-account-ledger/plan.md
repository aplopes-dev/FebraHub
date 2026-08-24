# Implementation Plan: Contas bancárias — saldo real, extrato e transferência

**Branch**: `002-bank-account-ledger` | **Date**: 2026-08-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/erp/002-bank-account-ledger/spec.md`

## Summary

Hoje `apps/erp/api` tem um submódulo `finance/bank-accounts` (Clean Architecture) só de
cadastro — CRUD + soft-delete/restore — e nenhum conceito de "movimentação". O front
(`apps/erp/web`, `features/bank-accounts`) simula saldo/extrato/transferência inteiramente em
memória (`services/bank-account.service.ts` + `data/mock-bank-accounts.ts`), e a API devolve
`currentBalance = openingBalanceCents / 100` — o saldo de abertura mascarado de saldo atual.

O plano introduz um **livro-razão de movimentações** (`BankTransaction`, append-only por
natureza, mas com um caminho de resync explícito para a origem `financial_entry_payment` — ver
D1 em `research.md`) e um agregado `BankTransfer` (submódulo Clean novo,
`finance/bank-transfers/`), e liga tudo à API real:

- `BankAccount` ganha `bankCode` (identificador estável de banco, corrige o round-trip do
  formulário — FR-015) e o saldo de abertura, na criação, passa a gerar sua movimentação no
  **backend** (RN-02/FR-003), não mais no front.
- `GET /v1/bank-accounts[/:id]` devolve `currentBalanceCents` calculado por agregação on-the-fly
  (`groupBy` por `kind`, decisão A do prompt — ver D2).
- Duas rotas novas aninhadas em `bank-accounts/:id` — `/transactions` (analítica, paginada,
  filtrável por tipo/período) e `/statement` (extrato com `runningBalanceCents` correto entre
  páginas — ver D3, a parte mais delicada do design).
- `POST /v1/bank-transfers` grava, numa única transação Prisma, o registro de transferência +
  as duas movimentações vinculadas (débito na origem, crédito no destino) — FR-010/FR-011.
- Pagamentos de lançamentos financeiros (`financial-entries`) passam a gerar/ressincronizar
  movimentações na conta do lançamento a cada `save()`/soft-delete/restore — incluindo o
  recebível que `PrismaSaleOrderRepository.maybeCreateReceivable` cria direto via Prisma ao
  fechar um pedido de venda (RN-13/FR-016/FR-017/SC-006).

No frontend, `bank-accounts` perde os dois arquivos de store em memória
(`services/bank-account.service.ts`, `data/mock-bank-accounts.ts`); o catálogo de bancos
(`data/mock-banks.ts`) **não** é removido — vira uma constante de referência legítima (como uma
lista de UFs), só passa a expor `code` em vez de servir de "banco de dados falso" de contas. O
detalhe da conta e o `TransferDialog` (hoje em `financial-entries/components/`) passam a usar
React Query contra as rotas reais.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js runtime), mesma stack de `001-financial-entries`
— NestJS 11 no backend, Next.js 16 (App Router) / React 19 no frontend. Nenhuma dependência nova.

**Primary Dependencies**:
- Backend (`apps/erp/api`, `@citybox/erp-api`): NestJS 11, Prisma 7 (`generated/prisma`, adapter
  `pg`), `class-validator`/`class-transformer`, Jest. Nenhuma lib nova — `groupBy` e
  `$transaction` já são usados hoje em `bank-accounts`/`financial-entries`/`sales`.
- Frontend (`apps/erp/web`, `@citybox/erp-web`): Next.js 16, React 19, `@citybox/mui`,
  `@tanstack/react-query`, `sonner` (via `@citybox/mui` toast). Sem lib nova.

**Storage**: PostgreSQL, schema `erp`, `apps/erp/api/prisma/schema.prisma` — 2 models novos
(`BankTransaction`, `BankTransfer`) + 2 enums (`BankTransactionKind`,
`BankTransactionSourceType`) + 1 campo novo em `BankAccount` (`bankCode`). Sem storage externo
novo (nenhum anexo/arquivo nesta fatia).

**Testing**: Backend — Jest + ts-jest, `.spec.ts` por use case com repositório in-memory (mesmo
padrão de `bank-accounts`/`financial-entries` hoje). Frontend — sem infraestrutura de teste em
`apps/erp/web` (decisão já registrada em `001-financial-entries/research.md` D15, válida aqui
também); validação end-to-end fica no `quickstart.md`.

**Target Platform**: Servidor Linux (Docker), navegador desktop — inalterado.

**Project Type**: Web application — feature dentro do par já existente `apps/erp/api` +
`apps/erp/web`, não um projeto novo.

**Performance Goals**: Sem meta numérica nova. O cálculo do saldo (D2) e do saldo acumulado do
extrato (D3) são O(nº de movimentações da conta até a página pedida) — aceitável para o volume
de uma única loja (`Scale/Scope` abaixo); ver D3 para o raciocínio completo e o gatilho de
revisão se o volume crescer.

**Constraints**:
- Migrations de schema **só** via `pnpm --filter @citybox/erp-api db:migrate:dev`.
- Todo model novo com `organization_id` entra em `TENANT_SCOPED_MODELS`
  (`shared/infra/prisma/tenant-scope.extension.ts`) na mesma operação.
- Dinheiro em centavos na API, reais na UI (mapper do frontend).
- UI 100% `@citybox/mui` + `@/components/ui/*` — zero `@citybox/ui`/`lucide-react`.
- Listagem server-side (Transações e Histórico incluídos — hoje ambas as abas do mock renderizam
  o array inteiro sem paginação; isso muda nesta fatia).
- `POST /v1/bank-transfers` precisa ser **atômico**: registro + 2 movimentações na mesma
  transação Prisma (FR-010) — mesmo padrão de `PrismaFinancialEntryRepository.save()`.
- Não há cadastro de formas de pagamento na API ainda (débito documentado em
  `001-financial-entries/research.md` D11); a transferência reaproveita o mesmo enum fixo
  `FINANCIAL_ENTRY_PAYMENT_METHODS` já usado pelos pagamentos de lançamento, em vez de duplicar
  a lista ou inventar um cadastro novo fora de escopo (ver D4).

**Scale/Scope**: Mesma ferramenta B2B interna, uma organização por vez, piloto single-city
(Ilhéus). Volume esperado de movimentações por conta: mesma ordem de grandeza de lançamentos
financeiros (centenas a poucos milhares) — sem necessidade de índice/estratégia além do já
padrão do monorepo (paginação server-side, índices compostos por `organizationId` + chave de
consulta).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Conformidade |
|---|---|---|
| I. Docs-as-Code (hierarquia AGENTS.md) | Toca `api/AGENTS.md` §9 (módulo finance — `BankAccount`, novo submódulo `bank-transfers/`) e `web/AGENTS.md` §4.5/§9 (`bank-accounts`, `financial-entries`/`TransferDialog`) — devem ser atualizados na mesma operação de implementação (tarefa em `tasks.md`) | ✅ Planejado, não violado |
| II. Backend-Driven Search and Pagination | `/transactions` e `/statement` são paginadas e filtradas no backend (`skip`/`take`, `WHERE`); nenhum `.filter()`/`.slice()` client-side substitui isso — as tabelas hoje renderizam array completo em memória e **precisam** ganhar paginação real nesta fatia | ✅ Planejado, não violado |
| III. Single Package Manager (pnpm) | Nenhum comando `npm`/`yarn` | ✅ Sem violação |
| IV. Atomic Design and Shared UI Components | Reaproveita `Tabs`/`DataTable`/`Paper`/`Dialog`/`FormField`/`CurrencyInput`/`DatePicker`/`Select` já usados na feature; nenhum componente novo de design system | ✅ Sem violação |
| V. Tenant Isolation and Independent Database Schemas | `BankTransaction`/`BankTransfer` entram em `TENANT_SCOPED_MODELS` na mesma migration; repositórios usam `prisma.scoped`; `database-reviewer` roda antes da migration | ✅ Planejado, não violado |

Nenhuma violação identificada — **Complexity Tracking não é necessário**.

**Re-checagem pós-Phase 1** (após `research.md`/`data-model.md`/`contracts/`/`quickstart.md`):
a decisão mais delicada (D1 — sincronizar, não só criar, movimentações de origem
`financial_entry_payment`) e a de paginação com saldo acumulado (D3) foram escritas para
**não** violar II/V: ambas continuam paginadas/filtradas no servidor e ambas ficam nos models
já cobertos por `TENANT_SCOPED_MODELS`. Gate permanece válido.

## Project Structure

### Documentation (this feature)

```text
specs/erp/002-bank-account-ledger/
├── plan.md               # This file (/speckit-plan command output)
├── research.md            # Phase 0 output (/speckit-plan command)
├── data-model.md          # Phase 1 output (/speckit-plan command)
├── quickstart.md          # Phase 1 output (/speckit-plan command)
├── contracts/              # Phase 1 output (/speckit-plan command)
│   └── bank-account-ledger-api.md
├── checklists/
│   └── requirements.md
└── tasks.md                # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Feature em cima do par existente `apps/erp/api` (NestJS, Clean Architecture) +
`apps/erp/web` (Next.js). Caminhos reais tocados:

```text
apps/erp/api/                                                              # @citybox/erp-api :3114
├── prisma/schema.prisma                                                   # ALTERAR (BankAccount.bankCode; models BankTransaction/BankTransfer; enums)
├── src/shared/infra/prisma/tenant-scope.extension.ts                      # ALTERAR (2 models novos em TENANT_SCOPED_MODELS)
└── src/modules/finance/
    ├── bank-accounts/                                                     # submódulo existente — ALTERAR
    │   ├── bank-accounts.module.ts                                        # ALTERAR (novos use cases/rotas/repositório de ledger)
    │   ├── domain/
    │   │   ├── entities/bank-account.entity.ts                            # ALTERAR (+ bankCode)
    │   │   ├── entities/bank-transaction.entity.ts                        # CRIAR
    │   │   └── repositories/bank-transaction.repository.interface.ts      # CRIAR (exportado — bank-transfers e financial-entries consomem)
    │   ├── application/
    │   │   ├── dtos/bank-account.dto.ts                                   # ALTERAR (+ bankCode, currentBalanceCents)
    │   │   ├── dtos/bank-transaction.dto.ts                               # CRIAR
    │   │   ├── use-cases/create-bank-account/**                           # ALTERAR (+ .spec.ts — cria movimentação de saldo inicial)
    │   │   ├── use-cases/update-bank-account/**                           # ALTERAR (+ .spec.ts — resync da movimentação de saldo inicial)
    │   │   ├── use-cases/list-bank-accounts/**                            # ALTERAR (+ .spec.ts — currentBalanceCents via groupBy)
    │   │   ├── use-cases/find-bank-account-by-id/**                       # ALTERAR (currentBalanceCents)
    │   │   ├── use-cases/list-bank-account-transactions/**                # CRIAR (+ .spec.ts)
    │   │   └── use-cases/get-bank-account-statement/**                    # CRIAR (+ .spec.ts)
    │   ├── infrastructure/
    │   │   ├── database/prisma-bank-account.repository.ts                 # ALTERAR (+ bankCode; sync da movimentação de saldo inicial no save())
    │   │   ├── database/prisma-bank-transaction.repository.ts             # CRIAR
    │   │   └── http/routes/
    │   │       ├── shared/bank-account.dto.ts                             # ALTERAR (+ bankCode)
    │   │       ├── shared/bank-account.presenter.ts                       # ALTERAR (+ bankCode, currentBalanceCents)
    │   │       ├── shared/bank-transaction.presenter.ts                   # CRIAR
    │   │       ├── list-bank-account-transactions/**                      # CRIAR (GET :id/transactions)
    │   │       └── get-bank-account-statement/**                          # CRIAR (GET :id/statement)
    │   └── tests/
    │       ├── bank-accounts-test-factory.ts                              # ALTERAR (+ makeBankTransaction)
    │       └── in-memory-bank-transaction.repository.ts                   # CRIAR
    ├── bank-transfers/                                                    # submódulo Clean novo
    │   ├── bank-transfers.module.ts                                       # CRIAR
    │   ├── domain/
    │   │   ├── entities/bank-transfer.entity.ts                           # CRIAR
    │   │   ├── errors/bank-transfer-same-account.error.ts                 # CRIAR
    │   │   └── repositories/bank-transfer.repository.interface.ts         # CRIAR
    │   ├── application/
    │   │   ├── dtos/bank-transfer.dto.ts                                  # CRIAR
    │   │   └── use-cases/create-bank-transfer/**                          # CRIAR (+ .spec.ts)
    │   ├── infrastructure/
    │   │   ├── database/prisma-bank-transfer.repository.ts                # CRIAR
    │   │   └── http/routes/
    │   │       ├── create-bank-transfer/**                                # CRIAR (POST /v1/bank-transfers)
    │   │       └── shared/bank-transfer.presenter.ts                      # CRIAR
    │   └── tests/
    │       ├── bank-transfers-test-factory.ts                             # CRIAR
    │       └── in-memory-bank-transfer.repository.ts                      # CRIAR
    └── financial-entries/                                                 # submódulo existente — ALTERAR (RN-12/FR-016/FR-017)
        ├── financial-entries.module.ts                                    # ALTERAR (importa BankAccountsModule — já importa; injeta BankTransactionRepository)
        └── infrastructure/database/prisma-financial-entry.repository.ts   # ALTERAR (sync de BankTransaction em save()/softDelete()/clearDeletedAt()) + sales/infrastructure/database/prisma-sale-order.repository.ts (maybeCreateReceivable cria a movimentação direto)

apps/erp/web/                                                              # @citybox/erp-web :3107
└── src/features/
    ├── bank-accounts/                                                     # feature alvo — ALTERAR
    │   ├── GUIA.md                                                        # ATUALIZAR
    │   ├── api/bank-accounts.service.ts                                   # REESCREVER (saldo real, bankCode, transactions/statement, transfer)
    │   ├── api/bank-account.dto.ts                                        # CRIAR
    │   ├── lib/bank-catalog.ts                                            # RENOMEAR de data/mock-banks.ts (catálogo de referência, não mock de dados)
    │   ├── hooks/query-keys.ts                                            # ALTERAR
    │   ├── hooks/use-bank-account-queries.ts                              # CRIAR (detail/transactions/statement)
    │   ├── hooks/use-bank-transfer-mutations.ts                           # CRIAR
    │   ├── components/bank-account-form.tsx                               # ALTERAR (Select por bankCode)
    │   ├── components/bank-account-transactions-table.tsx                 # ALTERAR (paginação + filtros server-side)
    │   ├── components/bank-account-statement.tsx                          # ALTERAR (paginação server-side)
    │   ├── pages/bank-account-detail-page.tsx                             # ALTERAR (React Query em vez do store mock)
    │   ├── services/bank-account.service.ts                               # REMOVER (ao final)
    │   ├── data/mock-bank-accounts.ts                                     # REMOVER (ao final)
    │   └── types/bank-account.ts                                         # ALTERAR (tipos batem com os DTOs reais)
    └── financial-entries/
        └── components/transfer-dialog.tsx                                 # ALTERAR (mutation real; contas via useBankAccountOptionsQuery; forma de pagamento via FINANCIAL_ENTRY_PAYMENT_METHODS)
```

**Structure Decision**: mantém Clean Architecture por submódulo no backend
(`domain → application → infrastructure`) e a convenção de pastas por feature no frontend —
nenhuma estrutura nova. `BankTransaction` **não** vira submódulo próprio: fica dentro de
`bank-accounts/` (é o ledger *da conta*, e as duas rotas novas — `/transactions`, `/statement` —
são aninhadas em `bank-accounts/:id`, mesmo padrão de `card-contracts/:contractId/payment-methods`),
mas seu repositório é **exportado** pelo `BankAccountsModule` (mesmo padrão de
`BankAccountRepository` hoje) para `bank-transfers` e `financial-entries` o consumirem sem
duplicar acesso a dados. `BankTransfer` vira submódulo Clean novo e fino — só
`POST /v1/bank-transfers` (FR-020: transferência não é editável/cancelável nesta fase, então não
há `GET`/`PUT`/`DELETE`), no molde de `cost-centers`/`financial-groups` (Clean completo, mas
poucas rotas).

## Complexity Tracking

> Nenhuma violação de Constitution Check identificada — seção vazia por design.
