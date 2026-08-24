# Phase 1 Data Model: Loja como Unidade de Billing (platform-api + admin-web)

Schema alvo do banco `citybox_platform`, schema Postgres `platform`
(`apps/platform/api/prisma/schema.prisma`), ao final das 3 migrations descritas em
[research.md](./research.md#1-estratégia-de-migration-expand--backfill--contract). Os tipos
Prisma abaixo são o estado **pós-contract**; a migration de expand adiciona os campos novos como
opcionais/nulos e a de contract os torna obrigatórios e remove os campos legados.

## Store (estendida)

Unidade operacional e, a partir desta feature, também a unidade única de cobrança. Absorve os
campos hoje só existentes em `Client`.

| Campo | Tipo | Regra | Origem |
|---|---|---|---|
| `id` | `String @id @default(uuid())` | — | já existe |
| `vertical` | `String` | **Imutável após a criação** (FR-006) — não exposto no DTO de update | já existe |
| `tradeName` | `String` | — | já existe |
| `slug` | `String @unique` | — | já existe |
| `status` | `StoreStatus` (`IN_SETUP\|TRAINING\|PRODUCTION\|BLOCKED\|OFFLINE`) | `BLOCKED` passa a também representar suspensão por inadimplência (ver research #3) | já existe |
| `deploymentStatus` | `StoreDeploymentStatus` (`PROVISIONING\|ACTIVE\|FAILED`) | default `PROVISIONING`; FR-009 — dimensão de estado **independente** de `status` (ver research #3.1, correção pós-`/speckit-analyze`) | **novo** |
| `document` | `String?` | **Não único entre lojas** (FR-016) — sem `@unique`, sem índice de unicidade | já existe (sem alteração) |
| `personType` | `String` (`"PF" \| "PJ"` no domínio) | obrigatório | **novo** — absorvido de `Client.personType` |
| `legalName` | `String?` | — | já existe |
| `responsibleName` | `String` | obrigatório | **novo** — absorvido de `Client.responsibleName` |
| `billingEmail` | `String` | obrigatório, formato e-mail (Zod) | **novo** — absorvido de `Client.email` (renomeado para não colidir com um futuro e-mail operacional da loja) |
| `stateRegistration` | `String?` | — | já existe |
| `zipCode`/`street`/`streetNumber`/`complement`/`neighborhood`/`city`/`state` | `String?` | endereço fiscal — já existiam, passam a ser preenchidos no fluxo de criação em vez de herdados do Client | já existe |
| `phone` | `String?` | — | já existe |
| `usesClientDocument` | — | **removido** (não faz mais sentido sem `Client`) | remover na migration de contract |
| `activePlanId` | `String?` (relação implícita via `Subscription`) | não é uma FK direta — o plano vigente é lido pela `Subscription` ativa da loja (evita duplicar a fonte de verdade) | decisão de modelagem |
| ...demais campos operacionais (`orders*`, `revenue*`, `maintenanceMode`, `trialEndsAt`, `sefazHomologacao`, `contingenciaOffline`, timestamps) | — | inalterados | já existem |

**Relações**: `subscriptions Subscription[]` (nova — substitui `client.subscriptions`), `invoices
Invoice[]` (nova — substitui `client.invoices`), demais relações (`terminals`, `errors`,
`members`/`storeMembers`, `modules`, `integrations`, `auditEvents`) inalteradas. **Remove**
`client Client @relation(...)`.

**Validação de domínio** (`store.zod.validator.ts`, estendido):
- `personType` ∈ `{PF, PJ}`.
- `responsibleName`: não vazio.
- `billingEmail`: formato de e-mail válido.
- `document`: formato CPF (se `PF`) ou CNPJ (se `PJ`) — reaproveita `brazilian-document.utils`
  já existente; **sem** checagem de unicidade global (FR-016).
- `vertical`: não vazio; imutável — `UpdateStoreUseCase`/`UpdateStoreDto` não aceitam esse campo.

**Transições de estado relevantes a esta feature** (`status: StoreStatus`):

```
PRODUCTION/TRAINING/IN_SETUP/OFFLINE --[fatura vence sem pagamento (job)]--> BLOCKED
BLOCKED --[pagamento regularizado (job)]--> PRODUCTION
PRODUCTION/TRAINING/IN_SETUP/OFFLINE --[operador bloqueia manualmente]--> BLOCKED   (já existente)
BLOCKED --[operador desbloqueia manualmente]--> PRODUCTION                          (já existente)
```
O motivo (inadimplência vs. manual) fica no `StoreAuditEvent.action`/`actor`, não em um campo de
status separado (research #3).

## Plan (estendida)

Catálogo comercial, agora escopado por vertical e tier.

| Campo | Tipo | Regra | Origem |
|---|---|---|---|
| `id` | `String @id @default(uuid())` | — | já existe |
| `code` | `String @unique` | — | já existe |
| `name` | `String` | — | já existe |
| `description` | `String` | — | já existe |
| `vertical` | `String` | obrigatório, não vazio (mesmo padrão de `Store.vertical`, sem enum Prisma — ver research #4) | **novo** |
| `tier` | `String` | obrigatório, não vazio (livre por vertical — ver research #4) | **novo** |
| `maxNegocios` | `Int` | obrigatório, > 0 | **renomeado** de `maxStores` (research #5) |
| `maxUsers` | `Int` | obrigatório, > 0 | já existe |
| `maxProducts` | `Int?` | inalterado — fora de escopo | já existe |
| `status` | `PlanStatus` (`ACTIVE\|HIDDEN`) | — | já existe |
| `createdAt`/`updatedAt` | `DateTime` | — | já existe |

**Relações**: `prices PlanPrice[]` inalterada. Índice adicional recomendado: `@@index([vertical])`
(consulta "planos de uma vertical" passa a ser o filtro primário da tela de catálogo).

**Validação de domínio** (`plan.zod.validator.ts`, estendido): `vertical` e `tier` não vazios;
`maxNegocios`/`maxUsers` inteiros positivos. Unicidade de `code` permanece global (não por
vertical) — mantém o padrão já existente, sem necessidade de mudança.

## PlanPrice (inalterada)

Sem mudança de shape. Continua `planId`, `cycle` (`MONTHLY|YEARLY`), `priceCents`, `stripePriceId`,
`status`, relação com `Plan` e `Subscription[]`.

## Subscription (FK alterada: `clientId` → `storeId`)

| Campo | Tipo | Regra | Origem |
|---|---|---|---|
| `storeId` | `String` | obrigatório, `@@index([storeId])` | **substitui** `clientId` |
| `planPriceId` | `String` | — | já existe |
| `cycle`, `status`, `currentPeriodStart/End`, `dayOfMonth`, `stripeSubscriptionId`, `canceledAt` | — | inalterados |

**Relações**: `store Store @relation(fields: [storeId], references: [id])` substitui `client
Client @relation(...)`. A constraint "apenas uma Subscription `ACTIVE`/`TRIALING` por unidade de
billing" (hoje comentada como aplicada via migration) passa a ser **por `storeId`** em vez de por
`clientId` — mesma regra, nova chave.

## Invoice (FK alterada: `clientId` → `storeId`)

| Campo | Tipo | Regra | Origem |
|---|---|---|---|
| `storeId` | `String` | obrigatório, `@@index([storeId])` | **substitui** `clientId` |
| `subscriptionId`, `amountCents`, `currency`, `status`, `dueDate`, `paidAt`, `method`,
  `stripeInvoiceId`, `periodStart/End` | — | inalterados |

**Relações**: `store Store @relation(fields: [storeId], references: [id])` substitui `client
Client @relation(...)`.

## Member (toque mínimo — fora do foco desta feature, ver research #6)

`Member.clientId` deixa de ter um `Client` para referenciar. Nesta fase, a FK é retargetada para
`storeId` (associação primária à loja que criou o membro), preservando o relacionamento N:N já
existente via `StoreMember` para acesso a múltiplas lojas. Esse retarget é tratado como parte da
migration de contract (não introduz nenhuma feature nova de equipe) — o desenho completo de
`Member` dentro de cada `vertical-api` continua fora de escopo (ADR seção 3.2, Fase 4/5).

## Client — removido

Model `Client` (e o enum/status associado) é **dropado** na migration de contract, junto com seu
índice `@@index([status])`/`@@index([createdAt])` e a constraint `@unique` em `document`. Nenhum
dado é perdido antes disso: os campos relevantes já foram copiados para `Store` na etapa de
backfill (ver research.md #1–2).

## Resumo do diff de schema (`prisma/schema.prisma`)

```diff
- model Client { … }                          // removido (migration de contract)
  model Store {
+   personType        String
+   responsibleName    String
+   billingEmail       String
-   usesClientDocument Boolean @default(true)  // removido
-   clientId           String                  // removido
-   client             Client  @relation(...)  // removido
+   subscriptions      Subscription[]
+   invoices           Invoice[]
  }
  model Plan {
+   vertical    String
+   tier        String
-   maxStores   Int
+   maxNegocios Int
  }
  model Subscription {
-   clientId  String
-   client    Client @relation(...)
+   storeId   String
+   store     Store  @relation(...)
  }
  model Invoice {
-   clientId  String
-   client    Client @relation(...)
+   storeId   String
+   store     Store  @relation(...)
  }
  model Member {
-   clientId  String
-   client    Client @relation(...)
+   storeId   String
+   store     Store  @relation(...)
  }
```

Todas as mudanças acima são aplicadas via `pnpm --filter @citybox/platform-api db:migrate:dev`
(que roda `prisma migrate dev --name <nome-da-etapa>`) em 3 migrations distintas — nunca SQL
manual — conforme research.md #1.
