# Plan: Cadastro de Terminais de PDV (`pos-terminals`) — fatia inicial da integração PDV↔ERP

**Source PRD**: `.claude/prds/_platform/pos-terminals-pdv-integration.prd.md`
**Selected Milestones**: 1 (higiene de documentação) + 2 (módulo `pos-terminals` na erp-api) + 3 (`erp-web` fora do mock) — as três juntas formam o MVP desta fatia (o PRD não testa a hipótese com só uma delas).
**Complexity**: Medium

## Summary
Criar o módulo `pos-terminals` na `erp-api` (Clean Architecture, organization+branch-scoped, seguindo o padrão de `customers`/`suppliers`) com CRUD + geração de código de pareamento, ligar `erp-web` (`features/pos-registers`) a ele no lugar do mock local, e corrigir as duas afirmações desatualizadas no `AGENTS.md` do PDV Flutter. Sem mudanças em `apps/pdv/app`.

## Patterns to Mirror

| Category | Source | Pattern |
|---|---|---|
| Módulo backend (estrutura de pastas) | `apps/erp/api/src/modules/customers/` | Clean Architecture: `domain/{entities,repositories,errors,validators,factories}` · `application/{dtos,use-cases/<ação>}` · `infrastructure/{database,http/routes}` · `tests/` |
| Entidade | `apps/erp/api/src/modules/customers/domain/entities/customer.entity.ts` | `extends Entity<Props>`, `static create()/with()`, getters, `validate()` via Zod factory, `update()`/`softDelete()` retornam nova instância (imutável) |
| Módulo NestJS (DI) | `apps/erp/api/src/modules/customers/customers.module.ts:1-40` | `providers`: token abstrato → impl Prisma + use cases; `controllers`: uma classe `*Route` por ação; `exports: [XRepository]` |
| Rota HTTP | `apps/erp/api/src/modules/customers/infrastructure/http/routes/create-customer/create-customer.route.ts` | Controller fino: `@RequirePermission(...)` + `@OrganizationId()` + `@Body() Dto` → use case → presenter |
| DTO HTTP | `apps/erp/api/src/modules/customers/infrastructure/http/routes/shared/customer.dto.ts` | class-validator na classe `*WritableHttpDto`; `toXWritableInput()` mapeia DTO→input do use case |
| Presenter | `apps/erp/api/src/modules/customers/infrastructure/http/routes/shared/customer.presenter.ts` | `toHttpDetail`/`toHttpSingle`/`toHttpList` — serialização isolada, datas em ISO string |
| Schema Prisma (model tenant-scoped) | `apps/erp/api/prisma/schema.prisma:1541` (`model Customer`) | `organizationId @map("organization_id")`, `@@schema("erp")`, `@@map(snake_case)`, índices por `organizationId` |
| Permissões | `apps/erp/api/src/shared/infra/http/decorators/permissions.ts:14-55` | Recursos organization-scoped (`org.suppliers.manage`, `org.customers.manage`) concedidos a `OWNER`/`ADMIN`, **não** a `MEMBER` |
| Erros | `apps/erp/api/src/modules/customers/domain/errors/customer-not-found.error.ts` | Subclasse de `AppError`; sufixo do nome decide o HTTP status (`*NotFound`→404) — ver `AGENTS.md` §5.6 |
| Frontend — módulo integrado à API | `apps/erp/web/src/features/suppliers/` (`api/`, `hooks/`, `store/`) | `api/*.dto.ts` + `*.mapper.ts` (traduz contrato API↔tipo do front) + `*.service.ts` (`comercioFetch`); hooks React Query (`query-keys`, queries, mutations, `use-*-list`) |
| Frontend — service atual (a substituir) | `apps/erp/web/src/features/pos-registers/services/pos-register.service.ts` | Store in-memory (`posRegistersStore`) — todas as 4 funções (`list/create/setStatus/delete`) viram chamadas HTTP via `comercioFetch` |
| Frontend — página/lista | `apps/erp/web/src/features/pos-registers/pages/pos-register-list-page.tsx` + `hooks/use-pos-register-list.ts` | Troca de `useMemo` síncrono sobre store local para `useQuery` (React Query) — molde em `apps/erp/web/src/features/suppliers/hooks/use-supplier-list.ts` |
| Tests (backend) | `apps/erp/api/src/modules/customers/tests/in-memory-customer.repository.ts` + `*.use-case.spec.ts` | Repositório fake implementa a interface abstrata; use case testado contra o fake, sem Postgres |

## Files to Change

### Backend (`apps/erp/api`)

| File | Action | Why |
|---|---|---|
| `prisma/schema.prisma` | UPDATE | Novo `model PosTerminal` (organization+branch-scoped) — ver §Schema abaixo |
| `src/modules/pos-terminals/pos-terminals.module.ts` | CREATE | Liga controllers, use cases e repositório (DI) |
| `src/modules/pos-terminals/domain/entities/pos-terminal.entity.ts` | CREATE | Entidade — molde `Customer` |
| `src/modules/pos-terminals/domain/repositories/pos-terminal.repository.interface.ts` | CREATE | Token abstrato do repositório |
| `src/modules/pos-terminals/domain/errors/pos-terminal-not-found.error.ts` | CREATE | 404 |
| `src/modules/pos-terminals/domain/errors/pos-terminal-pairing-code-invalid.error.ts` | CREATE | Erro de domínio para código expirado/consumido (uso futuro pela Fase de autenticação, mas o gerador já precisa poder falhar) |
| `src/modules/pos-terminals/domain/validators/pos-terminal.zod.validator.ts` | CREATE | Validação Zod da entidade (nome, status, branchId) |
| `src/modules/pos-terminals/domain/factories/pos-terminal-validator.factory.ts` | CREATE | Molde `CustomerValidatorFactory` |
| `src/modules/pos-terminals/application/dtos/pos-terminal.dto.ts` | CREATE | Tipos de input/output dos use cases (`ListPosTerminalsResult`, etc.) |
| `src/modules/pos-terminals/application/use-cases/create-pos-terminal/{create-pos-terminal.use-case.ts,.spec.ts}` | CREATE | — |
| `src/modules/pos-terminals/application/use-cases/list-pos-terminals/{list-pos-terminals.use-case.ts,.spec.ts}` | CREATE | Paginação + busca por nome; recorta por `branchIds` do contexto quando `MEMBER` |
| `src/modules/pos-terminals/application/use-cases/find-pos-terminal-by-id/find-pos-terminal-by-id.use-case.ts` | CREATE | — |
| `src/modules/pos-terminals/application/use-cases/update-pos-terminal/{update-pos-terminal.use-case.ts,.spec.ts}` | CREATE | PATCH — só campos enviados mudam |
| `src/modules/pos-terminals/application/use-cases/delete-pos-terminal/{delete-pos-terminal.use-case.ts,.spec.ts}` | CREATE | Soft-delete (`deletedAt`) — sem restore nesta fatia (molde `branches`, não `customers`) |
| `src/modules/pos-terminals/application/use-cases/generate-pairing-code/{generate-pairing-code.use-case.ts,.spec.ts}` | CREATE | Gera código opaco de 8 chars, `expiresAt = now + 15min`, sobrescreve código anterior se houver |
| `src/modules/pos-terminals/infrastructure/database/prisma-pos-terminal.repository.ts` | CREATE | Impl Prisma via `prisma.scoped` |
| `src/modules/pos-terminals/infrastructure/http/routes/{create,list,find-by-id,update,delete,generate-pairing-code}-pos-terminal/*.route.ts` | CREATE | 6 rotas — ver §Rotas |
| `src/modules/pos-terminals/infrastructure/http/routes/shared/pos-terminal.dto.ts` | CREATE | class-validator |
| `src/modules/pos-terminals/infrastructure/http/routes/shared/pos-terminal.presenter.ts` | CREATE | Serialização |
| `src/modules/pos-terminals/tests/in-memory-pos-terminal.repository.ts` | CREATE | Fake p/ specs |
| `src/modules/pos-terminals/tests/pos-terminals-test-factory.ts` | CREATE | Builder de entidade de teste |
| `src/shared/infra/http/decorators/permissions.ts` | UPDATE | Nova permissão `org.pos_terminals.manage`, concedida a `OWNER`/`ADMIN` (não `MEMBER`) — mesmo padrão de `org.suppliers.manage` |
| `src/shared/infra/prisma/tenant-scope.extension.ts` | UPDATE | Adicionar `PosTerminal` a `TENANT_SCOPED_MODELS` (regra não-negociável §5.10.2 do `AGENTS.md`) |
| `src/app.module.ts` | UPDATE | Registrar `PosTerminalsModule` |
| `apps/erp/api/AGENTS.md` | UPDATE | §4 (árvore de módulos), §9 (nova seção "Pos-terminals — cadastro e pareamento de PDV" com a tabela de rotas), §1 (status/data) |

### Frontend (`apps/erp/web`)

| File | Action | Why |
|---|---|---|
| `src/features/pos-registers/api/pos-terminal.dto.ts` | CREATE | Shape exato da API (request/response) |
| `src/features/pos-registers/api/pos-terminal.mapper.ts` | CREATE | Tradução API↔`PosRegister` (campos já batem quase 1:1 — só `deletedAt`/datas) |
| `src/features/pos-registers/api/pos-terminals.service.ts` | CREATE | `comercioFetch` — substitui `services/pos-register.service.ts` |
| `src/features/pos-registers/hooks/query-keys.ts` | CREATE | Molde `suppliers/hooks/query-keys.ts` |
| `src/features/pos-registers/hooks/use-pos-terminal-queries.ts` | CREATE | `useQuery` list/detail |
| `src/features/pos-registers/hooks/use-pos-terminal-mutations.ts` | CREATE | create/update/delete/generate-pairing-code |
| `src/features/pos-registers/hooks/use-pos-register-list.ts` | UPDATE | Sai do `useMemo` sobre store local → `useQuery` server-side (search/page/perPage na query, debounce 400ms — padrão §8.1 do `AGENTS.md`) |
| `src/features/pos-registers/store/pos-register-list.store.ts` | CREATE | Zustand só para UI (aba/busca/página) — molde `suppliers` |
| `src/features/pos-registers/components/pos-register-form-dialog.tsx` | UPDATE | Salvar chama mutation (create/update) em vez do service local; loading no botão Salvar (`isPending`) |
| `src/features/pos-registers/components/pos-register-row-actions.tsx` | UPDATE | Ativar/inativar e Excluir chamam mutations reais; Excluir com `ConfirmationDialog` |
| `src/features/pos-registers/components/pos-register-list-table.tsx` | UPDATE | Loading/erro server-side (`ListLoadErrorAlert`, skeleton) |
| `src/features/pos-registers/pages/pos-register-list-page.tsx` | UPDATE | Composição com os novos hooks |
| `src/features/pos-registers/services/pos-register.service.ts` | DELETE | Substituído por `api/pos-terminals.service.ts` |
| `src/features/pos-registers/data/mock-pos-registers.ts` | DELETE | Sem consumidor após a migração |
| `src/features/pos-registers/GUIA.md` | UPDATE (ou CREATE se não existir) | Manual de negócio — tela deixa de ser "em breve" no Editar; adicionar explicação do código de pareamento |
| `apps/erp/web/AGENTS.md` | UPDATE | §4.5 (`pos-registers` deixa de ser "mock"), §9 (tabela de módulos), §4.1 (texto "Pontos de venda") |

### Documentação (Fase 0, `apps/pdv/app`)

| File | Action | Why |
|---|---|---|
| `apps/pdv/app/AGENTS.md` | UPDATE | §6: remover "a erp-api não tem módulo de vendas" (o módulo `sales` existe desde 2026-08-03); trocar a indicação de `citybox-app` como client Keycloak candidato por nota apontando que o PDV precisa de um client dedicado (`citybox-pdv`, a decidir na fatia de autenticação) |

## Schema (`PosTerminal`)

```prisma
model PosTerminal {
  id             String   @id @default(uuid())
  organizationId String   @map("organization_id")
  branchId       String   @map("branch_id")

  name             String
  status           PosTerminalStatus @default(active)
  printer          String?
  scale            String?
  nfceContingency  Boolean  @default(false) @map("nfce_contingency")
  offlineServerId  String?  @map("offline_server_id")

  pairingCode          String?   @map("pairing_code")
  pairingCodeExpiresAt DateTime? @map("pairing_code_expires_at") @db.Timestamptz(3)

  deletedAt DateTime? @map("deleted_at") @db.Timestamptz(3)
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  branch       Branch       @relation(fields: [branchId], references: [id], onDelete: Cascade)

  @@unique([id, organizationId])
  @@index([organizationId])
  @@index([organizationId, branchId])
  @@index([organizationId, deletedAt])
  @@map("pos_terminals")
  @@schema("erp")
}

enum PosTerminalStatus {
  active
  inactive

  @@map("pos_terminal_status")
  @@schema("erp")
}
```

> Nota: `id` usa `@default(uuid())`, igual a `Customer` e aos demais models do módulo — confirmado pelo usuário, não `citybox_uuid_v7()`.

## Rotas

| Método | Rota (base `/api/`) | Use case | Permissão | Notas |
|---|---|---|---|---|
| `POST` | `v1/pos-terminals` | CreatePosTerminal | `org.pos_terminals.manage` | 422 nome vazio/branchId inválido; 404 se `branchId` não existir na organização |
| `GET` | `v1/pos-terminals` | ListPosTerminals | `org.view` | `search`, `status`, `page`, `perPage` (teto 100); `MEMBER` só vê terminais das suas unidades (mesmo recorte de `ListBranches`) |
| `GET` | `v1/pos-terminals/:id` | FindPosTerminalById | `org.view` | 404 se não existir/outra org |
| `PATCH` | `v1/pos-terminals/:id` | UpdatePosTerminal | `org.pos_terminals.manage` | Só campos enviados mudam (semântica PATCH, ao contrário do PUT de `branches`) |
| `DELETE` | `v1/pos-terminals/:id` | DeletePosTerminal | `org.pos_terminals.manage` | Soft-delete → `204` |
| `POST` | `v1/pos-terminals/:id/pair` | GeneratePairingCode | `org.pos_terminals.manage` | Gera/regenera código de 8 chars alfanumérico, `expiresAt = +15min`; resposta `{ code, expiresAt }` |

## Tasks

### Task 1: Fase 0 — corrigir `apps/pdv/app/AGENTS.md`
- **Action**: Editar §6 conforme descrito na tabela de arquivos acima.
- **Mirror**: N/A (edição de prosa).
- **Validate**: Leitura manual — nenhuma menção residual a "erp-api não tem módulo de vendas" nem a `citybox-app` como client do PDV.

### Task 2: Schema Prisma + migration
- **Action**: Adicionar `PosTerminal` + `PosTerminalStatus` ao `schema.prisma`; rodar `pnpm --filter @citybox/erp-api db:migrate:dev` (única forma permitida — nunca SQL manual, §5.9 do `AGENTS.md`).
- **Mirror**: `model Customer` (schema.prisma:1541) para forma; `model Branch` para a FK.
- **Validate**: `pnpm --filter @citybox/erp-api db:generate` sem erro; migration gerada em `prisma/migrations/`.

### Task 3: Domínio (entidade + validador + erros)
- **Action**: `PosTerminal` entity com `create()`/`with()`/`update()`/`softDelete()` imutáveis; Zod validator (nome 2-100 chars, `branchId` UUID obrigatório).
- **Mirror**: `customer.entity.ts` + `customer.zod.validator.ts` + `customer-validator.factory.ts`.
- **Validate**: `pnpm --filter @citybox/erp-api typecheck`.

### Task 4: Repositório (interface + Prisma + in-memory)
- **Action**: Interface abstrata com `create/findById/findMany/update/softDelete/setPairingCode`; impl Prisma via `prisma.scoped.posTerminal`; fake in-memory para specs.
- **Mirror**: `customer.repository.interface.ts` + `prisma-customer.repository.ts` + `in-memory-customer.repository.ts`.
- **Validate**: `pnpm --filter @citybox/erp-api test src/modules/pos-terminals`.

### Task 5: Use cases (6) com testes
- **Action**: `CreatePosTerminal`, `ListPosTerminals` (com recorte `MEMBER`/`branchIds`), `FindPosTerminalById`, `UpdatePosTerminal`, `DeletePosTerminal`, `GeneratePairingCode`. Um `.spec.ts` por use case contra o repositório in-memory.
- **Mirror**: use cases de `customers` (estrutura) + `ListBranches` (recorte por `branchIds` do `MEMBER`).
- **Validate**: `pnpm --filter @citybox/erp-api test` — cobertura ≥ 80% do módulo novo.

### Task 6: Rotas HTTP + DTO + presenter + módulo NestJS
- **Action**: 6 controllers finos, DTOs class-validator, presenter, `PosTerminalsModule` registrado em `app.module.ts`.
- **Mirror**: rotas de `customers` + `branches` (para o padrão PATCH parcial, já que `branches` usa PUT completo — `update-pos-terminal` deve seguir semântica PATCH real, mais parecida com `UpdateMember`).
- **Validate**: `pnpm --filter @citybox/erp-api build`; Swagger em `/api/v1/docs` mostra as 6 rotas sob a tag `pos-terminals`.

### Task 7: Permissão nova + tenant scope
- **Action**: Adicionar `org.pos_terminals.manage` em `permissions.ts` (lista + papel `OWNER`/`ADMIN`); adicionar `PosTerminal` a `TENANT_SCOPED_MODELS`.
- **Mirror**: `org.suppliers.manage`.
- **Validate**: teste manual via Swagger com `Bearer dev-admin` — `MEMBER` recebe 403 em `POST/PATCH/DELETE`, `OWNER` funciona.

### Task 8: Atualizar `apps/erp/api/AGENTS.md`
- **Action**: Nova entrada em §4 (árvore), nova seção em §9 com a tabela de rotas, atualizar linha de status em §1.
- **Validate**: Leitura manual — nenhuma seção removida, só adicionada/atualizada (regra do CLAUDE.md raiz).

### Task 9: Frontend — camada de API (`api/`)
- **Action**: `pos-terminal.dto.ts` (shape da API) + `pos-terminal.mapper.ts` (API↔`PosRegister`) + `pos-terminals.service.ts` (`comercioFetch`, 6 chamadas espelhando as rotas).
- **Mirror**: `features/suppliers/api/*`.
- **Validate**: `pnpm --filter @citybox/erp-web typecheck`.

### Task 10: Frontend — hooks React Query + Zustand
- **Action**: `query-keys.ts`, `use-pos-terminal-queries.ts` (list/detail), `use-pos-terminal-mutations.ts` (create/update/delete/generate-pairing-code, cada uma invalidando a query de lista), `store/pos-register-list.store.ts` (busca/página/aba).
- **Mirror**: `features/suppliers/hooks/*` + `features/suppliers/store/*`.
- **Validate**: `pnpm --filter @citybox/erp-web typecheck`.

### Task 11: Frontend — trocar a tela do mock para a API
- **Action**: `use-pos-register-list.ts` passa a usar `useQuery`; `pos-register-form-dialog.tsx` usa as mutations (create/update) com `loading={isPending}`; `pos-register-row-actions.tsx` usa mutation de status/delete com `ConfirmationDialog`; adicionar ação "Gerar código de pareamento" no menu de ações, exibindo o código em texto simples (QR fica para depois — ver Risks); remover `services/pos-register.service.ts` e `data/mock-pos-registers.ts`.
- **Mirror**: `features/suppliers/pages/supplier-list-page.tsx` + `features/suppliers/components/*`.
- **Validate**: `pnpm --filter @citybox/erp-web dev` — criar/listar/editar/inativar/excluir/gerar código funcionando contra a API real; `pnpm --filter @citybox/erp-web build`.

### Task 12: Atualizar `GUIA.md` e `AGENTS.md` do `erp-web`
- **Action**: `features/pos-registers/GUIA.md` reflete o novo comportamento (Editar funciona, código de pareamento); `apps/erp/web/AGENTS.md` §4.5/§9/§4.1 saem de "mock" para "API".
- **Validate**: Leitura manual.

## Validation
```bash
pnpm --filter @citybox/erp-api db:generate
pnpm --filter @citybox/erp-api db:migrate:dev
pnpm --filter @citybox/erp-api build
pnpm --filter @citybox/erp-api lint
pnpm --filter @citybox/erp-api typecheck
pnpm --filter @citybox/erp-api test

pnpm --filter @citybox/erp-web build
pnpm --filter @citybox/erp-web lint
pnpm --filter @citybox/erp-web typecheck
```

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Semântica de update (`PATCH` parcial vs `PUT` completo) diverge do resto do módulo `tenancy` (`branches` usa PUT com "campo omitido é limpo") | Média | Usar `PATCH` real (só o que vier no corpo muda) — mais adequado para edição pontual de um terminal (ex.: só trocar a impressora); documentar a escolha no `AGENTS.md` da API para não gerar inconsistência silenciosa |
| Código de pareamento exibido só como texto (sem QR) pode não ser suficiente quando a Fase 1 (Flutter) desenhar a tela "Ativar terminal" | Média | Formato de string opaca simples é agnóstico a como será consumido — QR é só uma forma de exibição/entrada, não muda o contrato da API; adicionar QR na UI é mudança isolada ao frontend, não replaneja o backend |
| `ListPosTerminals` com recorte por `branchIds` do `MEMBER` pode divergir do padrão de `ListBranches` se não for testado com um usuário `MEMBER` real | Baixa | Cobrir com teste de use case usando contexto `MEMBER` com `branchIds` restrito, além do `OWNER` |

## Acceptance
- [x] Todas as 12 tasks completas
- [x] Validação (backend + frontend) passa sem erro — `build`/`lint`/`typecheck`/`test` (542/542) do backend e `build`/`lint`/`typecheck` do frontend, todos verdes
- [x] Padrões de `customers`/`suppliers`/`branches` espelhados, não reinventados
- [x] `/ponto-de-venda/cadastros` no `erp-web` sem nenhuma referência a `mock-pos-registers`/`pos-register.service.ts` (arquivos removidos; `pos-cash-sessions` parou de importar o mock e passou a derivar as opções do seu próprio mock local)
- [x] `apps/pdv/app/AGENTS.md` §6 sem as duas afirmações desatualizadas
- [x] `AGENTS.md` de `erp-api` e `erp-web` atualizados na mesma operação (nenhuma seção removida)
