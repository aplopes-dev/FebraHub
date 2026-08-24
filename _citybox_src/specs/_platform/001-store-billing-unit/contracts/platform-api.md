# Contracts: `platform-api` (interno, consumido só pelo `admin-web` via proxy)

Não é um contrato público (não passa por `packages/contracts/openapi.json` — essa API não está
listada nesse pacote). Documenta o shape HTTP que `admin-web` (`lib/admin-api.ts`) precisa
consumir após esta feature. Prefixo global `/api` omitido abaixo por brevidade (ex.:
`/v1/stores` = `GET /api/v1/stores`).

## Stores (`/v1/stores`) — estendido

| Verbo | Rota | Mudança |
|---|---|---|
| `POST` | `/v1/stores` | Body ganha `personType`, `responsibleName`, `billingEmail`, `document`, endereço fiscal, `planId` (obrigatório — FR-015). Response inclui o plano vigente (vertical/tier) e status inicial `deploymentStatus`-like já coberto por `status: 'IN_SETUP'`. |
| `PUT` | `/v1/stores/:id` | Body aceita os mesmos campos fiscais para edição; **NÃO aceita `vertical`** (FR-006 — imutável; campo ausente do DTO, não apenas ignorado) |
| `GET` | `/v1/stores` | Response de cada item ganha resumo de billing (plano vigente: vertical/tier/nome, status da assinatura) — mesmo padrão de "join no backend" já usado em `/v1/platform/billing/subscriptions` (AGENTS.md §9) |
| `GET` | `/v1/stores/:id` | Response ganha `plan` (vigente, com histórico de troca) e `billing` (assinatura atual + `invoices[]`) — dados hoje espalhados entre `/v1/clients/:id` e a assinatura do cliente |
| `PATCH` | `/v1/stores/:id/plan` | **Novo.** Troca o plano da loja (upgrade/downgrade). Body: `{ planPriceId: string }`. Servidor rejeita se o novo plano pertence a uma vertical diferente da vertical atual da loja (edge case do spec) → `409` com erro de domínio `PlanVerticalMismatchError`. Substitui a troca de plano hoje feita via cliente. |
| `PATCH` | `/v1/stores/:id/block` / `/v1/stores/:id/unblock` | Inalterado na assinatura HTTP — reaproveitado internamente pelo job de faturamento (chamada direta ao use case, não via HTTP) para FR-010/FR-011 (ver research.md #3) |

## Plans (`/v1/platform/billing/plans`) — estendido

> Correção pós-implementação: o prefixo real (confirmado no código) é
> `v1/platform/billing/plans`, não `v1/plans` como uma versão anterior deste documento indicava.

| Verbo | Rota | Mudança |
|---|---|---|
| `POST` | `/v1/platform/billing/plans` | Body ganha `vertical` (obrigatório) e `tier` (obrigatório); `maxStores` sai do contrato HTTP — vira `maxNegocios` (`maxStores` continua existindo só internamente, sincronizado, até a migration de contract) |
| `PUT` | `/v1/platform/billing/plans/:id` | Mesmos campos novos, editáveis |
| `GET` | `/v1/platform/billing/plans` | Filtro novo por querystring: `?vertical=<slug>` (lista de planos de uma vertical — usado pelo seletor de plano na criação/troca de loja) — **implementado** |
| `GET` | `/v1/platform/billing/plans/:id` | Inclui `vertical`/`tier` no response |
| `DELETE` | `/v1/platform/billing/plans/:id` | Inalterado (`PlanHasActiveSubscriptionsConflictError` continua valendo, agora por `storeId`) |

## Members (`/v1/members`) — **novo namespace, substitui as rotas aninhadas em `/v1/clients/members/*`**

Consequência direta da remoção de `Client`: as três rotas de gestão de membro hoje aninhadas em
`/v1/clients/...` (`POST /v1/clients/:id/members`, `GET /v1/clients/members/:id`, `PATCH
/v1/clients/members/:id/assignments`) não têm mais um `:id` de Client para pendurar. `Member` já é
uma entidade global com atribuições N:N a lojas via `StoreMember` — a rota some para um namespace
próprio, mesmo comportamento:

| Verbo | Rota (nova) | Rota antiga (removida) | Mudança de contrato |
|---|---|---|---|
| `POST` | `/v1/members` | `POST /v1/clients/:id/members` | Body perde `clientId` implícito (vinha da URL); ganha nada novo — cria membro global + atribuições de loja/cargo em lote, igual hoje |
| `GET` | `/v1/members/:id` | `GET /v1/clients/members/:id` | Sem mudança de shape de response |
| `PATCH` | `/v1/members/:id/assignments` | `PATCH /v1/clients/members/:id/assignments` | Sem mudança de shape de body/response |

## Subscriptions (`/v1/subscriptions`, `/v1/platform/billing/subscriptions`) — FK trocada

| Verbo | Rota | Mudança |
|---|---|---|
| `GET` | `/v1/subscriptions` (+ variante agregada de billing) | Response troca `clientId`/dados de cliente por `storeId` + dados da loja (tradeName, vertical) no join já existente |
| `POST` | `/v1/subscriptions` | Body troca `clientId` por `storeId` |
| `POST` | `/v1/subscriptions/:id/cancel` | Inalterado além do `storeId` no response |

## Invoices (`/v1/invoices`) — FK trocada

| Verbo | Rota | Mudança |
|---|---|---|
| `GET` | `/v1/invoices`, `/v1/invoices/:id` | Response troca `clientId` por `storeId` |
| `POST` | `/v1/invoices/manual` | Body troca `clientId` por `storeId` |
| `POST` | `/v1/invoices/:id/mark-paid`, `/v1/invoices/generate-job` | Inalterados além do `storeId` no response |
| — | `GET /v1/billing/kpis` | Inalterado (KPIs agregados, não desce a nível de identificador) |

## Clients (`/v1/clients*`) — **removido por completo**

Todas as rotas de `modules/clients` deixam de existir ao final da migration de contract:
`GET/POST/PUT /v1/clients`, `PATCH /v1/clients/:id/block`, `GET /v1/clients/:id/usage` (o conceito
de "uso vs. quota de lojas por cliente" desaparece — Store agora é 1:1 com sua própria assinatura,
sem quota corporativa). O módulo NestJS `clients` é removido do `app.module.ts`.

## Backoffice (`/v1/users/me/stores`) — inalterado

Sem mudança de contrato nesta feature.
