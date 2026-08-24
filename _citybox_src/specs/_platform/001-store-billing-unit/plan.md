# Implementation Plan: Loja como Unidade de Billing (platform-api + admin-web)

**Branch**: `001-store-billing-unit` | **Date**: 2026-07-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/_platform/001-store-billing-unit/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Eliminar `Client` como entidade de billing na `platform-api`, tornando a `Store` a unidade única
de cobrança (absorve documento fiscal, tipo de pessoa e responsável), escopar `Plan` por vertical
e tier, e migrar `Subscription`/`Invoice` para referenciar `storeId` em vez de `clientId`. No
`admin-web`, fundir as telas "Clientes" e "Lojas" em uma única tela por loja (dados fiscais + plano
+ billing) e integrar o catálogo de planos por vertical/tier (hoje mock/stub). A abordagem técnica
segue **exatamente os padrões arquiteturais já estabelecidos em cada app** — Clean
Architecture/Hexagonal por módulo na `platform-api` (domain → application → infrastructure) e
organização por feature (vertical slice) com TanStack Query no `admin-web` — sem introduzir padrão
novo (ex.: sem outbox, já que a `platform-api` hoje publica eventos direto via `StoreEventsPublisher`,
não via outbox). Toda mudança de schema usa exclusivamente `prisma migrate dev --name <nome>`
(nunca SQL manual), em uma sequência expand → backfill → contract para preservar o histórico
sensível de billing.

## Technical Context

**Language/Version**: TypeScript 5.7.x (`apps/platform/api`) · TypeScript 5.8.x (`apps/platform/admin`) · Node.js ≥ 20

**Primary Dependencies**:
- Backend (`@citybox/platform-api`): NestJS 11.x, Prisma 7.8.x (generator `prisma-client` → `generated/prisma/`, adapter `@prisma/adapter-pg`), Zod v4 (domínio), class-validator/class-transformer (DTOs HTTP), `@citybox/messaging` (`RabbitBus`/`createCloudEvent`, publish direto — sem outbox nesta API)
- Frontend (`@citybox/admin-web`): Next.js 16.2.7 (App Router), React 19.2.7, TanStack Query 5.x, TanStack Table 8.x, React Hook Form 7.x, Zod v4, `@citybox/ui` (atoms/molecules/organisms)

**Storage**: PostgreSQL, banco `citybox_platform`, schema `platform` (`apps/platform/api/prisma/schema.prisma`) — schema próprio, não usa `packages/database`

**Testing**: Jest + ts-jest (`*.spec.ts` unit com repositórios in-memory + `test:e2e`) no backend; Vitest + Testing Library + jsdom no frontend

**Target Platform**: Linux server (Docker) — API NestJS (`:3103`) + app Next.js `standalone` (`:3108`), ambos atrás do proxy same-origin do admin-web

**Project Type**: web-service (backend) + web application (frontend) — feature dual-app dentro do monorepo, escopo restrito a estes dois apps (ver "Escopo desta fase" no spec)

**Performance Goals**: Não definido numericamente pelo spec (SC-001..006 são funcionais, não de carga); reaproveitar os padrões já existentes de listagem paginada/server-side (política §8.1 do `AGENTS.md` raiz) sem introduzir meta nova

**Constraints**:
- Migrations **exclusivamente** via `pnpm --filter @citybox/platform-api db:migrate:dev` (que roda `prisma migrate dev --name <nome>`) — nunca SQL manual, para não quebrar a estrutura de migrations versionadas do Prisma
- Sequência **expand → backfill → contract** obrigatória para a remoção de `Client` (histórico de `Subscription`/`Invoice` é sensível — ver Assumptions do spec)
- Backend: Clean Architecture por módulo (`domain`/`application`/`infrastructure`), dependências só "para dentro", repositório como classe abstrata (token de DI), controllers finos, erros como subclasses de `AppError`
- Frontend: organização por feature (vertical slice), estado de servidor só via TanStack Query, acesso ao backend só via `lib/admin-api.ts` → proxy same-origin, zero componente de UI fora de `@citybox/ui`
- Zero `@ts-ignore`/`eslint-disable`, tudo tipado (sem `any`), `pnpm --filter <pkg> lint` e `typecheck` limpos nos dois apps antes de considerar uma tarefa concluída
- `AGENTS.md` de `apps/platform/api` e `apps/platform/admin` atualizados na mesma operação de código (Princípio I da constituição)

**Scale/Scope**: 5 módulos backend tocados (`clients` retirado, `stores` estendido, `plans` estendido, `subscriptions` e `invoices` com FK trocada) + 3 features frontend tocadas (`clients` retirada/fundida em `stores`, `stores` com tela unificada, `planos` passando de mock para integrado). Sem meta de usuários simultâneos no spec (N/A — ferramenta interna de operação).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Avaliado contra `.specify/memory/constitution.md` v1.0.0:

| Princípio | Status | Nota |
|---|---|---|
| I. AGENTS.md como Fonte de Verdade | ✅ PASS | Plano inclui atualização de `apps/platform/api/AGENTS.md` e `apps/platform/admin/AGENTS.md` na mesma entrega (seções 4, 9, 12 de cada) |
| II. Isolamento de Tenant | ✅ PASS | Feature não altera guards/JWT; loja continua o limite de acesso; nenhuma agregação cross-store introduzida |
| III. Busca e Paginação Sempre no Backend | ✅ PASS | Endpoints de listagem afetados (`stores`, `plans`) mantêm `page`/`perPage`/`search`/`sortBy`; tela unificada de loja mantém `manualPagination` no `DataTable` de faturas |
| IV. Disciplina de Schema e Migrations | ⚠️ GATE OBRIGATÓRIO | Mudança de schema grande (remove `Client`, novas colunas em `Store`/`Plan`/`PlanPrice`, FK trocada em `Subscription`/`Invoice`). Requer `database-reviewer` antes de cada migration ser considerada pronta; migrations exclusivamente via `prisma migrate dev --name` (constraint explícita do usuário, reforça o princípio) |
| V. Test-First e Gates de Qualidade | ✅ PASS (a aplicar) | TDD RED→GREEN→REFACTOR por use case; `react-reviewer` para `.tsx` tocados em `apps/platform/admin`; `pnpm build && lint && typecheck && test` nos dois pacotes antes de fechar cada fase |
| VI. Imutabilidade e Código Enxuto | ✅ PASS | Segue os padrões já existentes (entidades imutáveis com `create`/`with`, controllers finos); nenhuma abstração nova introduzida além do necessário |
| VII. Autorização Explícita para Ações Irreversíveis | ⚠️ GATE OBRIGATÓRIO | A migration de **contract** (drop de `Client`/colunas antigas) é irreversível — só roda após confirmação explícita do usuário, depois que a migration de **expand+backfill** já estiver validada em execução real |

Nenhuma violação sem justificativa — os dois itens ⚠️ são gates de processo já exigidos pela
constituição (não desvios), registrados aqui para não serem esquecidos na fase de tasks.

**Re-check pós-Phase 1** (após `research.md`, `data-model.md`, `contracts/`, `quickstart.md`):
nenhuma decisão de desenho introduziu violação nova. `data-model.md` reaproveita `StoreStatus`
existente em vez de criar campo redundante (reforça Princípio VI); `research.md` §1 e o
Cenário "Verificação de regressão de dados" do `quickstart.md` operacionalizam o gate do
Princípio VII (checagem de contagem antes da migration de contract); `contracts/platform-api.md`
mantém paginação/busca/ordenação no backend em todas as listagens tocadas (Princípio III). Gate
mantido: ✅ PASS para seguir a `/speckit-tasks`.

## Project Structure

### Documentation (this feature)

```text
specs/_platform/001-store-billing-unit/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── platform-api.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Monorepo Turborepo existente — nenhum diretório novo de topo é criado. A feature toca dois apps
já existentes, cada um seguindo sua própria arquitetura já estabelecida (ver Technical Context):

```text
apps/platform/api/                          # @citybox/platform-api — NestJS, Clean Architecture por módulo
├── prisma/
│   ├── schema.prisma                       # Client removido; Store/Plan/PlanPrice/Subscription/Invoice alterados
│   └── migrations/                         # geradas via `prisma migrate dev --name` (nunca manual)
├── src/
│   ├── modules/
│   │   ├── stores/                         # ESTENDIDO: domain/application/infrastructure absorvem os campos fiscais
│   │   │   ├── domain/entities/store.entity.ts        # + personType, responsibleName, billingEmail
│   │   │   ├── domain/validators/store.zod.validator.ts
│   │   │   ├── application/use-cases/{create-store,update-store,change-store-plan}/
│   │   │   └── infrastructure/http/routes/…
│   │   ├── plans/                          # ESTENDIDO: domain/application/infrastructure com vertical + tier
│   │   │   ├── domain/entities/plan.entity.ts          # + vertical, tier, maxNegocios
│   │   │   └── infrastructure/http/routes/…
│   │   ├── subscriptions/                  # ALTERADO: clientId → storeId em toda a cadeia
│   │   ├── invoices/                       # ALTERADO: clientId → storeId em toda a cadeia
│   │   └── clients/                        # REMOVIDO ao final da fase contract (rotas, use cases, entidade)
│   └── shared/infra/messaging/
│       └── store-events.publisher.ts       # ESTENDIDO: publishStorePlanChanged/Suspended/Reactivated
└── AGENTS.md                                # atualizado na mesma operação (seções 4, 9, 12)

apps/platform/admin/                         # @citybox/admin-web — Next.js, feature (vertical slice)
├── src/
│   ├── app/(dashboard)/
│   │   ├── lojas/[id]/page.tsx             # ESTENDIDO: tela única (fiscal + plano + billing)
│   │   ├── planos/page.tsx                 # de mock/stub para integrado (vertical + tier)
│   │   └── clientes/                       # REMOVIDO (rota e menu retirados)
│   ├── features/
│   │   ├── stores/                         # ESTENDIDO: api/hooks/components para plano + billing
│   │   ├── planos/                         # ESTENDIDO: sai de mock, consome `/v1/plans*` real
│   │   └── clients/                        # REMOVIDO (conteúdo migrado para `stores` onde aplicável)
│   └── lib/
│       ├── admin-api.ts                    # *Dto + fetch* atualizados (Store ganha campos; Client removido)
│       └── admin-navigation.ts             # entrada "Clientes" removida do menu
└── AGENTS.md                                # atualizado na mesma operação (seções 9, 12)
```

**Structure Decision**: Mantém a estrutura de módulo/feature já existente em cada app — nenhuma
pasta ou camada nova é introduzida. O módulo `stores` (backend) e a feature `stores` (frontend)
absorvem o que hoje vive em `clients`/`clientes`; o módulo/feature `clients`/`clientes` é removido
ao final da migration de contract. `plans`/`planos` ganham os campos `vertical`/`tier` dentro da
mesma anatomia de módulo (`domain/application/infrastructure` no backend, `api/hooks/components`
no frontend) descrita nos `AGENTS.md` de cada app — ver seção 4.1 de
`apps/platform/api/AGENTS.md` e seção 4 de `apps/platform/admin/AGENTS.md`.

## Complexity Tracking

> Nenhuma violação da constituição sem justificativa. Os dois itens abaixo não são desvios de
> princípio — são pontos de atenção que a fase de tasks precisa materializar como passos
> explícitos, dado o risco de dado sensível (billing) envolvido.

| Ponto de atenção | Por que é necessário | Alternativa mais simples rejeitada porque |
|---|---|---|
| Migration em 2 passos (expand+backfill, depois contract) em vez de 1 migration única `drop Client` | Preserva `Subscription`/`Invoice` histórico durante a transição (Assumption do spec: expand-contract, sem exclusão direta) | Uma migration única que already dropa `Client` e as colunas `clientId` perderia a possibilidade de validar o backfill antes do ponto de não-retorno, violando o Princípio VII (autorização explícita antes de ação irreversível) |
| Extensão do `StoreEventsPublisher` existente (publish direto) em vez de introduzir outbox nesta API | Mantém o padrão arquitetural já em uso nesta API especificamente (instrução explícita do usuário: "manter o padrão de design que o backend já usa") | Introduzir outbox agora seria consistente com `marketplace-api`, mas é uma mudança de infraestrutura maior, não pedida pelo spec, e violaria YAGNI (Princípio VI) — fica registrado como dívida técnica pré-existente da própria API, não desta feature |
