---

description: "Task list for feature implementation"

---

# Tasks: Catálogo — backend de Adicionais e Sugestões do produto

**Input**: Design documents from `/specs/erp/008-catalogo-adicionais-sugestoes/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/product-addons-suggestions.md](./contracts/product-addons-suggestions.md), [quickstart.md](./quickstart.md)

**Tests**: Incluídas — o projeto segue TDD por convenção (`.claude/rules/ecc/common/testing.md`, Constitution "Development Workflow & Quality Gates") e todo use case existente em `modules/catalog` tem `*.spec.ts` com repositório in-memory (ex.: `create-variation.use-case.spec.ts`). Escrever o teste antes da implementação (RED → GREEN).

**Organization**: Tarefas agrupadas por user story do [spec.md](./spec.md) (US1/US2/US3) para permitir implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: A qual user story a tarefa pertence (US1, US2, US3)
- Caminhos de arquivo sempre absolutos a partir da raiz do monorepo

## Path Conventions

Todo caminho é relativo a `apps/erp/api/` (backend NestJS), módulo `catalog`
existente — sem projeto/app novo (ver `plan.md` § Project Structure).

---

## Phase 1: Setup (schema Prisma + registro tenant-scope)

**Purpose**: Preparar o schema do banco e o mecanismo de isolamento multi-tenant antes de qualquer código de aplicação.

- [X] T001 Adicionar os models `ProductAddon`, `ProductAddonSettings`, `ProductAddonLine` e `ProductSuggestion` em `apps/erp/api/prisma/schema.prisma`, exatamente conforme [data-model.md](./data-model.md)
- [X] T002 Adicionar as relações `addonSettings`, `addonLines`, `suggestionsAsOwner`, `suggestionsAsTarget` ao model `Product` em `apps/erp/api/prisma/schema.prisma`
- [X] T003 Rodar `pnpm --filter @citybox/erp-api db:migrate:dev --name add_product_addons_and_suggestions` para gerar e aplicar a migration (nunca escrever SQL à mão — regra §5.9 do `AGENTS.md`)
- [X] T004 Rodar `pnpm --filter @citybox/erp-api db:generate` para regenerar o cliente Prisma em `apps/erp/api/generated/prisma/`
- [X] T005 Registrar `product_addons`, `product_addon_settings`, `product_addon_lines` e `product_suggestions` em `TENANT_SCOPED_MODELS` (`apps/erp/api/src/shared/infra/prisma/tenant-scope.extension.ts`)

**Checkpoint**: `pnpm --filter @citybox/erp-api db:migrate:status` limpo; `prisma.scoped` já reconhece as 4 tabelas novas.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Entidades, repositório do catálogo de Adicionais e extensão da entidade `Product` — base de que as 3 user stories dependem.

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase estar completa.

- [X] T006 [P] Criar erros de domínio em `apps/erp/api/src/modules/catalog/domain/errors/`: `product-addon-name-taken.error.ts`, `product-addon-not-found.error.ts`, `product-addon-duplicate-line.error.ts`, `product-addon-settings-invalid.error.ts`, `product-suggestion-duplicate-line.error.ts`, `product-suggestion-self-reference.error.ts` (subclasses de `AppError`, molde `variation-not-found.error.ts`/`variation-in-use.error.ts`)
- [X] T007 [P] Criar `apps/erp/api/src/modules/catalog/domain/validators/product-addon.zod.validator.ts` (nome 1..120 chars, `defaultPriceCents >= 0`) — molde de um validator Zod existente do módulo
- [X] T008 [P] Criar entidade `ProductAddon` em `apps/erp/api/src/modules/catalog/domain/entities/product-addon.entity.ts` (`extends Entity<Props>`, `static create()/with()`, getters, `validate()` via Zod)
- [X] T009 Criar `apps/erp/api/src/modules/catalog/domain/repositories/product-addon.repository.interface.ts` (token abstrato: `findById`, `findByName`, `list`, `save`, `softDelete`)
- [X] T010 [US1][US2] Criar `apps/erp/api/src/modules/catalog/infrastructure/database/prisma-product-addon.repository.ts` implementando a interface de T009
- [X] T011 [P] Criar `apps/erp/api/src/modules/catalog/tests/in-memory-product-addon.repository.ts` (fake para os testes de use case)
- [X] T012 Estender `Product` em `apps/erp/api/src/modules/catalog/domain/entities/product.entity.ts`: novos props `addonSettings` (`{ minQuantity, maxQuantity, chargeFromSelectedQuantity, chargeFromQuantity }`), `addonLines` (`ProductAddonLineProps[]`), `suggestions` (`ProductSuggestionLinkProps[]`) + getters + regra `minQuantity <= maxQuantity` e `chargeFromQuantity >= 1` quando a flag está ativa na `validate()` da entidade. **Desvio**: em vez de uma classe `ProductAddonSettingsInvalidError` própria, as duas regras viraram `.refine()` no `ProductZodValidator` existente (mesmo padrão já usado por `branch.zod.validator.ts`) — cai em `ValidatorDomainError` → 422, efeito idêntico ao planejado, sem inventar um segundo mecanismo de erro para a mesma seção.
- [X] T013 Registrar `ProductAddonRepository` (token) → `PrismaProductAddonRepository` no provider array de `apps/erp/api/src/modules/catalog/catalog.module.ts`

**Checkpoint**: `pnpm --filter @citybox/erp-api typecheck` passa; entidade `Product` e `ProductAddon` compilam com os novos campos, ainda sem nenhum use case consumindo.

---

## Phase 3: User Story 1 - Cadastrar o catálogo de adicionais da loja (Priority: P1) 🎯 MVP

**Goal**: CRUD do catálogo `ProductAddon` (`v1/product-addons`) — nome + preço padrão, soft-delete, listagem para alimentar o seletor da aba Adicionais.

**Independent Test**: `POST /v1/product-addons` cria; `GET /v1/product-addons` lista; segundo `POST` com o mesmo nome devolve 409; `DELETE` some da listagem mas mantém a linha viva para vínculos existentes (ver [quickstart.md](./quickstart.md) passo 2).

### Tests for User Story 1 ⚠️

- [X] T014 [P] [US1] Teste `create-product-addon.use-case.spec.ts` em `apps/erp/api/src/modules/catalog/application/use-cases/create-product-addon/` — cobre criação OK e `ProductAddonNameTakenError` (case-insensitive, FR-002) via `InMemoryProductAddonRepository`
- [X] T015 [P] [US1] Teste `update-product-addon.use-case.spec.ts` em `apps/erp/api/src/modules/catalog/application/use-cases/update-product-addon/` — cobre update OK, 404 e 409 de nome duplicado
- [X] T016 [P] [US1] Teste `delete-product-addon.use-case.spec.ts` em `apps/erp/api/src/modules/catalog/application/use-cases/delete-product-addon/` — soft-delete, 404, e confirma que o registro segue legível por `findById` após excluído (FR-004)
- [X] T017 [P] [US1] Teste `list-product-addons.use-case.spec.ts` em `apps/erp/api/src/modules/catalog/application/use-cases/list-product-addons/` — só ativos por default, `active=false` traz todos

### Implementation for User Story 1

- [X] T018 [P] [US1] Adicionar `CreateProductAddonDto`/`UpdateProductAddonDto`/`ListProductAddonsDto` em `apps/erp/api/src/modules/catalog/application/dtos/product-addon.dto.ts`
- [X] T019 [US1] Implementar `CreateProductAddonUseCase` em `apps/erp/api/src/modules/catalog/application/use-cases/create-product-addon/create-product-addon.use-case.ts` (molde `create-product-category.use-case.ts`: trim do nome, `findByName` case-insensitive → `ProductAddonNameTakenError`, senão `ProductAddon.create()` + `save()`) — depende de T008, T009, T014
- [X] T020 [US1] Implementar `UpdateProductAddonUseCase` em `apps/erp/api/src/modules/catalog/application/use-cases/update-product-addon/update-product-addon.use-case.ts` — depende de T015
- [X] T021 [US1] Implementar `DeleteProductAddonUseCase` (soft-delete) em `apps/erp/api/src/modules/catalog/application/use-cases/delete-product-addon/delete-product-addon.use-case.ts` — depende de T016
- [X] T022 [US1] Implementar `ListProductAddonsUseCase` em `apps/erp/api/src/modules/catalog/application/use-cases/list-product-addons/list-product-addons.use-case.ts` (sem `page`/`perPage` → lista simples; com → paginado, molde `list-variations.use-case.ts`) — depende de T017
- [X] T023 [P] [US1] Criar `apps/erp/api/src/modules/catalog/infrastructure/http/routes/shared/product-addon.dto.ts` (class-validator: `SaveProductAddonDto` com `name` `@MaxLength(120)`, `defaultPriceCents` `@IsInt() @Min(0)`) e `product-addon.presenter.ts` (`toHttpSingle`/`toHttpList`, molde `variation.presenter.ts`)
- [X] T024 [US1] Criar rota `POST /v1/product-addons` em `apps/erp/api/src/modules/catalog/infrastructure/http/routes/create-product-addon/create-product-addon.route.ts` (`@RequirePermission('store.catalog.manage')`, molde `create-variation.route.ts`) — depende de T019, T023
- [X] T025 [US1] Criar rota `PUT /v1/product-addons/:id` em `apps/erp/api/src/modules/catalog/infrastructure/http/routes/update-product-addon/update-product-addon.route.ts` — depende de T020, T023
- [X] T026 [US1] Criar rota `DELETE /v1/product-addons/:id` em `apps/erp/api/src/modules/catalog/infrastructure/http/routes/delete-product-addon/delete-product-addon.route.ts` (retorna 204) — depende de T021
- [X] T027 [US1] Criar rota `GET /v1/product-addons` em `apps/erp/api/src/modules/catalog/infrastructure/http/routes/list-product-addons/list-product-addons.route.ts` (query `active`/`page`/`perPage`/`search`) — depende de T022, T023
- [X] T028 [US1] Registrar as 4 rotas novas + os 4 use cases no `controllers`/`providers` de `apps/erp/api/src/modules/catalog/catalog.module.ts`

**Checkpoint**: `pnpm --filter @citybox/erp-api test -- product-addon` verde; `quickstart.md` passo 2 executável ponta a ponta contra a API local.

---

## Phase 4: User Story 2 - Configurar os adicionais de um produto (Priority: P1)

**Goal**: Persistir `addonSettings` + `addonLines` no mesmo `GET`/`PUT /v1/products/:id` do produto, com validação de min/max, duplicidade e atomicidade.

**Independent Test**: `PUT /v1/products/:id` com `addonSettings`+`addonLines`, reabrir via `GET` e conferir round-trip exato; violações (`minQuantity > maxQuantity`, `addonId` duplicado) devolvem erro sem gravar nada (ver [quickstart.md](./quickstart.md) passo 3).

### Tests for User Story 2 ⚠️

- [X] T029 [P] [US2] Teste da função pura `resolve-product-addon-lines.spec.ts` em `apps/erp/api/src/modules/catalog/application/utils/` — resolve IDs válidos, lança `ProductAddonNotFoundError` para `addonId` inexistente e `ProductAddonDuplicateLineError` para duplicata (FR-008, FR-009)
- [X] T030 [P] [US2] Estender `apps/erp/api/src/modules/catalog/application/use-cases/create-product/create-product.use-case.spec.ts` e `update-product/update-product.use-case.spec.ts` com casos: salvar `addonSettings`+`addonLines` válidos e reler igual (round-trip), `minQuantity > maxQuantity` → `ProductAddonSettingsInvalidError` sem persistir nada (FR-007, FR-012), `chargeFromSelectedQuantity=true` sem `chargeFromQuantity>=1` → erro (FR-006), lista vazia é estado válido (FR-011)

### Implementation for User Story 2

- [X] T031 [US2] Criar `resolveProductAddonLines` em `apps/erp/api/src/modules/catalog/application/utils/resolve-product-addon-lines.ts` (molde `resolve-product-variations.ts`: valida `addonId` contra `ProductAddonRepository`, dedup por `addonId` com o último vencendo ou erro conforme FR-009, aplica `sortOrder`) — depende de T009, T029
- [X] T032 [US2] Estender `CreateProductDto`/`UpdateProductDto` em `apps/erp/api/src/modules/catalog/application/dtos/product.dto.ts` com `addonSettings?`, `addonLines?: ProductAddonLineInput[]` — depende de T012
- [X] T033 [US2] Estender `CreateProductUseCase` (`apps/erp/api/src/modules/catalog/application/use-cases/create-product/create-product.use-case.ts`) para chamar `resolveProductAddonLines` e persistir `addonSettings`/`addonLines` dentro da mesma `$transaction` já existente — depende de T031, T032
- [X] T034 [US2] Estender `UpdateProductUseCase` (`apps/erp/api/src/modules/catalog/application/use-cases/update-product/update-product.use-case.ts`) com o mesmo replace-all (`deleteMany` + `createMany`) de `addonSettings`/`addonLines`, atômico com as demais seções já substituídas (`variations`/`suppliers`/`branches`) — depende de T031, T032
- [X] T035 [US2] Estender `apps/erp/api/src/modules/catalog/infrastructure/database/prisma-product.repository.ts`: incluir `addonSettings`/`addonLines` (com `addon.name` via `include`) no `select`/`include` de leitura e gravação
- [X] T036 [US2] Estender `ProductResponse`/`toProductResponse` em `apps/erp/api/src/modules/catalog/infrastructure/http/routes/shared/product.presenter.ts` com `addonSettings` (defaults quando ausente) e `addonLines[]` — depende de T035. **Desvio**: sem `addonName` enriquecido na resposta (mesma simplicidade de `variations`, que também só devolve IDs) — o frontend resolve o nome cruzando com `GET /v1/product-addons` já carregado para o seletor, sem custo de join extra no `GET`/`PUT` do produto.
- [X] T037 [US2] Estender `SaveProductDto` (`apps/erp/api/src/modules/catalog/infrastructure/http/routes/shared/product.dto.ts`) com `addonSettings?: SaveProductAddonSettingsDto` e `addonLines?: SaveProductAddonLineDto[]` (class-validator, `@ValidateNested`) — depende de T032

**Checkpoint**: `pnpm --filter @citybox/erp-api test -- product.entity create-product update-product` verde; `quickstart.md` passo 3 executável ponta a ponta.

---

## Phase 5: User Story 3 - Configurar sugestões (cross-sell) de um produto (Priority: P2)

**Goal**: Persistir `suggestions` no mesmo `GET`/`PUT /v1/products/:id`, com bloqueio de autossugestão, duplicidade e filtro de produto sugerido excluído.

**Independent Test**: `PUT /v1/products/:id` com `suggestions` apontando para 2 outros produtos, reabrir via `GET` e conferir round-trip; autossugestão e duplicidade devolvem erro; excluir um produto sugerido faz sua linha sumir da leitura sem quebrar o produto dono (ver [quickstart.md](./quickstart.md) passos 4 e 5).

### Tests for User Story 3 ⚠️

- [X] T038 [P] [US3] Teste da função pura `resolve-product-suggestions.spec.ts` em `apps/erp/api/src/modules/catalog/application/utils/` — resolve IDs válidos, lança `ProductSuggestionSelfReferenceError` quando `suggestedProductId === productId` (FR-015), `ProductSuggestionDuplicateLineError` para duplicata (FR-014), `ProductNotFoundError` para produto inexistente/de outra org
- [X] T039 [P] [US3] Estender `create-product.use-case.spec.ts`/`update-product.use-case.spec.ts` com: salvar `suggestions` válidas e reler igual (round-trip), lista vazia válida (FR-017), e um caso de leitura onde o produto sugerido está soft-deleted → não aparece em `suggestions` mas o produto dono carrega normalmente (FR-018, SC-003)

### Implementation for User Story 3

- [X] T040 [US3] Criar `resolveProductSuggestions` em `apps/erp/api/src/modules/catalog/application/utils/resolve-product-suggestions.ts` (valida `suggestedProductId` contra `ProductRepository` da própria organização, bloqueia autorreferência e duplicata, aplica `sortOrder`) — depende de T038
- [X] T041 [US3] Estender `CreateProductDto`/`UpdateProductDto` (`product.dto.ts`) com `suggestions?: ProductSuggestionInput[]` — depende de T012
- [X] T042 [US3] Estender `CreateProductUseCase`/`UpdateProductUseCase` para chamar `resolveProductSuggestions` e persistir `suggestions` na mesma `$transaction` — depende de T040, T041, T033/T034 (mesma transação já estendida por US2)
- [X] T043 [US3] Estender `prisma-product.repository.ts`: incluir `suggestionsAsOwner` (com `suggestedProduct.name`, filtrando `deletedAt IS NULL` — FR-018) no `select`/`include` de leitura e gravação
- [X] T044 [US3] Estender `ProductResponse`/`toProductResponse` (`product.presenter.ts`) com `suggestions[]` — depende de T043. **Desvio**: mesma simplificação de T036 — sem `suggestedProductName` embutido; o frontend já teria o produto sugerido carregado via listagem de produtos para o seletor.
- [X] T045 [US3] Estender `SaveProductDto` (`product.dto.ts` HTTP) com `suggestions?: SaveProductSuggestionDto[]` — depende de T041

**Checkpoint**: `pnpm --filter @citybox/erp-api test -- product.entity create-product update-product` continua verde com os casos de US3; `quickstart.md` passos 4-5 executáveis ponta a ponta.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentação obrigatória (Docs-as-Code), verificação final e higiene de Swagger.

- [X] T046 [P] Atualizar `apps/erp/api/AGENTS.md` §4 (árvore de pastas) e §9 (tabela "Catalog — produtos") com as novas rotas `v1/product-addons` e os campos `addonSettings`/`addonLines`/`suggestions` do `ProductResponse`, seguindo o mesmo formato das entradas de Variações/Listas de preço
- [X] T047 [P] Atualizar `apps/erp/web/AGENTS.md` §4.5 (bloco `features/products`) — remover "Adicionais/Sugestões continuam mock" da nota existente e registrar que o **backend** já suporta as duas abas nesta versão da API (o frontend em si segue fora de escopo desta fatia; registrar isso explicitamente, mesma linguagem usada para "Fase B.1 — Variações" antes do form consumir a API)
- [X] T048 Conferir anotações `@ApiProperty`/`@ApiOperation` (Swagger) em todas as rotas novas de `v1/product-addons` e nos campos novos de `product.dto.ts` — sem rota pública sem documentação (regra do módulo)
- [X] T049 Rodar a suíte completa: `pnpm --filter @citybox/erp-api build && pnpm --filter @citybox/erp-api lint && pnpm --filter @citybox/erp-api typecheck && pnpm --filter @citybox/erp-api test`
- [X] T050 Executar manualmente o roteiro completo de [quickstart.md](./quickstart.md) (passos 1-6) contra a API local e confirmar todos os `Expected` descritos

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — schema e migration primeiro
- **Foundational (Phase 2)**: depende do Setup — **bloqueia** as 3 user stories
- **User Story 1 (Phase 3)**: depende só do Foundational — pode ser entregue sozinha (MVP)
- **User Story 2 (Phase 4)**: depende do Foundational; usa o `ProductAddonRepository` criado no Foundational e consumido/exercitado por US1, mas **não depende de US1 estar "pronta"** (as rotas CRUD de US1 e a resolução de linhas em US2 são código diferente) — só precisa que a Phase 2 tenha entregue entidade + repositório
- **User Story 3 (Phase 5)**: depende só do Foundational; reaproveita a mesma `$transaction` que US2 estende em `CreateProductUseCase`/`UpdateProductUseCase` — **na prática, implementar depois de US2** para não gerar conflito de merge nos mesmos dois arquivos de use case (T033/T034 vs T042), mesmo sem dependência funcional real
- **Polish (Phase 6)**: depende de todas as user stories desejadas estarem completas

### User Story Dependencies

- **US1 (P1)**: independente — pode ir para produção sozinha (só o catálogo de adicionais, sem nenhum produto configurável ainda)
- **US2 (P1)**: independente de US1 em runtime (a validação de `addonId` em `resolveProductAddonLines` só exige que *algum* `ProductAddon` exista — não que a rota CRUD de US1 esteja implementada, já que o registro pode ter sido criado via seed/Prisma Studio em teste); **em prática de repo, sem US1 não há como um lojista real criar um `ProductAddon` pela API**, então priorize US1 antes de US2 apesar de tecnicamente paralelizável
- **US3 (P2)**: totalmente independente de US1/US2 — não referencia `ProductAddon` em nada

### Within Each User Story

- Testes escritos e falhando (RED) antes da implementação (GREEN)
- Entidade/DTO antes de use case
- Use case antes de rota HTTP
- Rota HTTP antes de registro no module

### Parallel Opportunities

- T006, T007, T008, T011 (Phase 2) — arquivos diferentes, sem dependência entre si
- T014-T017 (testes de US1) podem ser escritos em paralelo
- T018, T023 (US1) — DTO de aplicação e DTO/presenter HTTP são arquivos diferentes
- T029 e T038 (utils de US2 e US3) são independentes entre si — times diferentes podem tocar US2 e US3 em paralelo depois do Foundational, cientes do aviso de merge acima
- T046 e T047 (Polish, docs) — arquivos diferentes

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Em paralelo, depois de T001-T005 (schema/migration) prontos:
Task: "Criar erros de domínio em domain/errors/ (T006)"
Task: "Criar Zod validator em domain/validators/product-addon.zod.validator.ts (T007)"
Task: "Criar entidade ProductAddon em domain/entities/product-addon.entity.ts (T008)"
Task: "Criar InMemoryProductAddonRepository em tests/in-memory-product-addon.repository.ts (T011)"
```

## Parallel Example: User Story 1

```bash
# Testes de US1 em paralelo (T014-T017):
Task: "create-product-addon.use-case.spec.ts"
Task: "update-product-addon.use-case.spec.ts"
Task: "delete-product-addon.use-case.spec.ts"
Task: "list-product-addons.use-case.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 apenas)

1. Completar Phase 1: Setup (schema + migration)
2. Completar Phase 2: Foundational (CRÍTICO — bloqueia tudo)
3. Completar Phase 3: User Story 1
4. **PARE e VALIDE**: rodar `quickstart.md` passo 2 isoladamente
5. US1 já é demonstrável: lojista cadastra o catálogo de adicionais, mesmo sem nenhum produto configurável ainda

### Incremental Delivery

1. Setup + Foundational → base pronta
2. US1 → testar isoladamente → catálogo de adicionais funcional (MVP)
3. US2 → testar isoladamente → produto configura adicionais de verdade
4. US3 → testar isoladamente → produto configura sugestões
5. Cada story soma valor sem quebrar a anterior — todas tocam `product.dto.ts`/`product.presenter.ts`/os dois use cases de produto, então rode `pnpm --filter @citybox/erp-api test` completo a cada story para pegar regressão cedo

### Parallel Team Strategy

Com dois desenvolvedores, depois do Foundational: um toca US1 (CRUD isolado, zero conflito de arquivo com o resto), outro toca US2 e depois US3 sequencialmente (mesmos arquivos de use case de produto — evita 2 pessoas editando `update-product.use-case.ts` ao mesmo tempo).

---

## Notes

- [P] = arquivos diferentes, sem dependência
- [Story] mapeia a tarefa à user story do `spec.md` para rastreabilidade
- Cada user story deve ser completável e testável de forma independente
- Confirmar que os testes falham (RED) antes de implementar (GREEN)
- Rodar `pnpm --filter @citybox/erp-api lint`/`typecheck` a cada grupo lógico de tarefas — não só no fim
- Commitar após cada tarefa ou grupo lógico coerente
- Parar em qualquer checkpoint para validar a story isoladamente antes de seguir
