# Arquitetura de Permissões (CASL) para o Citybox

Documento de decisão técnica. Objetivo: definir como implementar um sistema de permissões granular (CASL) que funcione em **todas as APIs NestJS** (platform-api, marketplace-api, food-api, clinica-api, e as futuras verticais) e em **ambos os frontends Next.js** (ERP e admin-web), organizado como package(s) compartilhado(s) no monorepo, respeitando a arquitetura já existente (Keycloak, schemas Prisma isolados por app, eventos RabbitMQ).

Este documento parte da experiência de implementação de permissões com CASL feita no projeto **Odontotech** (ver `packages/docs/GUIA_PERMISSOES_CASL.md` naquele repositório) e da análise profunda do estado atual do código do Citybox. Ele não é um plano de tarefas — é a base para gerar um. Ao final, a seção 9 propõe as fases de implementação nessa ordem.

## Tabela de Conteúdos

- [1. Por que o Citybox é mais complexo que o Odontotech](#1-por-que-o-citybox-é-mais-complexo-que-o-odontotech)
- [2. Estado atual (o que já existe, com precisão)](#2-estado-atual-o-que-já-existe-com-precisão)
- [3. Problemas concretos do estado atual](#3-problemas-concretos-do-estado-atual)
- [4. Requisitos da solução](#4-requisitos-da-solução)
- [5. Decisões de arquitetura (opções e recomendação)](#5-decisões-de-arquitetura-opções-e-recomendação)
- [6. Estrutura de packages proposta](#6-estrutura-de-packages-proposta)
- [7. Modelo de dados](#7-modelo-de-dados)
- [8. Fluxo ponta a ponta (proposto)](#8-fluxo-ponta-a-ponta-proposto)
- [9. Plano de implementação por fases](#9-plano-de-implementação-por-fases)
- [10. Riscos e pontos de atenção](#10-riscos-e-pontos-de-atenção)
- [11. ADR sugerido](#11-adr-sugerido)

## 1. Por que o Citybox é mais complexo que o Odontotech

No Odontotech havia **uma** API e **um** frontend, um catálogo único de permissões (`PERMISSIONS_MODULES`), e uma tabela (`Professional.permissions: Json`) na mesma base de dados acessada pela mesma API que fazia a checagem.

No Citybox:

| Dimensão | Odontotech | Citybox |
|---|---|---|
| APIs backend | 1 (NestJS) | N (`platform-api`, `marketplace-api`, `food-api`, `clinica-api`, e mais 9 verticais futuras) |
| Frontends | 1 (Next.js) | 2 (`erp`, `admin-web`) + N verticais dentro do ERP |
| Bases de dados | 1 Postgres, 1 schema | 1 Postgres, **schema isolado por app** (`platform`, `food`, `clinica`, `tenant`...) — sem Prisma Client compartilhado |
| Fonte da verdade de "quem tem acesso a quê" | A própria API | **`platform-api`** apenas — as APIs de vertical não têm essa tabela |
| Catálogo de recursos (`Subjects`) | Único, ~9 subjects | **Um catálogo por domínio de negócio** — `Product`/`Order` (food) não têm nada a ver com `Patient`/`Treatment` (clínica) |
| Autenticação | JWT próprio (`jsonwebtoken`) | Keycloak (OIDC), papéis grossos apenas no token |
| Hierarquia de tenant | Organization → (implícito) | **Platform → Client (Organização) → Store (com vertical) → StoreMember** |

Ou seja: não dá para copiar o package `@odontotech/permissions` 1:1. A pergunta central deste documento é **onde mora a checagem de "o membro X pode fazer Y na loja Z", quando X foi autenticado por um serviço (Keycloak) que não conhece lojas, e a checagem precisa acontecer dentro de uma API (`food-api`) que não tem a tabela de membros (que vive em `platform-api`)?**

## 2. Estado atual (o que já existe, com precisão)

Levantamento feito por exploração direta do código (não da documentação aspiracional — há uma divergência real entre os dois, sinalizada abaixo onde relevante).

### 2.1 Keycloak

Realm único `citybox-dev` (`infra/keycloak/import/citybox-dev-realm.json`). 4 clients: `citybox-app` (marketplace B2C), `citybox-backoffice` (ERP), `citybox-admin` (admin-web), `citybox-core-admin` (service account máquina-a-máquina, usado pela `platform-api` para chamar a Keycloak Admin API).

4 realm roles: `platform_admin`, `store_staff`, `consumer`, `platform_operator`. Client roles em `citybox-backoffice`: `platform.admin` + `vertical.<slug>.view` (uma por vertical, 12 no total — só `food`, `varejo`, `clinic` têm uso real hoje; `market` existe como alias legado de `varejo`).

**O JWT não carrega nada de loja/organização** — só `sub`, `email`, `realm_access.roles`, `resource_access['citybox-backoffice'].roles`. Isso já segue exatamente o princípio certo ("Keycloak responde só QUEM, não O QUÊ") descrito no documento de visão `.claude/docs/auth-com-keycloak.md`.

### 2.2 `platform-api` — onde os membros e suas permissões já existem

Schema `apps/platform/api/prisma/schema.prisma`, models `Client` (organização/CNPJ do lojista) → `Store` (tem `vertical: String`) → `StoreMember`:

```prisma
model StoreMember {
  id                   String    @id @default(uuid())
  storeId              String
  keycloakSub          String
  username             String
  email                String?
  firstName            String
  lastName             String
  role                 String
  permissions          Json      @default("[]")
  hasPassword          Boolean   @default(false)
  disabledAt           DateTime?
  provisionalExpiresAt DateTime?
  // ...
  @@unique([storeId, keycloakSub])
}
```

Isto é **exatamente** o equivalente do `Professional.permissions: Json?` do Odontotech — só que já existe, já está em produção, e já é gerenciado por telas reais no admin-web/ERP (tela "Equipe").

**Já existe um catálogo de `role` por vertical** — `apps/platform/api/src/modules/stores/domain/catalog/store-role.catalog.ts`: listas hardcoded por vertical (`FOOD_ROLES = [gerente, caixa, garcom, cozinha]`, `VAREJO_ROLES = [...]`, `GENERIC_ROLES` como fallback para clínica/outras). Validado na criação do membro via `isValidRoleForVertical`.

**Não existe** nenhum catálogo equivalente para `permissions` — o campo é `string[]` totalmente livre, sem whitelist, sem validação de domínio. É o único ponto onde o Citybox está objetivamente **atrás** do Odontotech (que tinha `PERMISSIONS_MODULES`/`validatePermissionIds`).

**Duas rotas gerenciam `StoreMember` hoje**, ambas reaproveitando os mesmos use cases:
- `POST/PUT/DELETE /v1/stores/:id/team/...` (`ManageStoreMembersRoute`) — exige `@RequirePermission('platform.admin')` (só equipe interna Citybox).
- `POST/PUT/DELETE/PATCH /v1/backoffice/stores/:storeId/team/...` (`BackofficeStoreTeamRoute`) — exige só `StoreMembershipGuard`, que verifica **apenas se o usuário é membro daquela loja** (binário — não olha `role`/`permissions`). **Isto é um gap de segurança real**: hoje, um `garçom` autenticado como membro de uma loja pode chamar essa rota e alterar `role`/`permissions` de qualquer outro membro da mesma loja, inclusive promovendo a si mesmo. Ver seção 3.

### 2.3 Autorização hoje — RBAC binário, duplicado 4 vezes

`platform-api`, `marketplace-api`, `food-api` e `clinica-api` têm, cada uma, sua **própria cópia quase idêntica** de:
- Um `AuthGuard` (implementação manual com `jose` + `createRemoteJWKSet`, sem `passport-jwt`) que valida o JWT contra o Keycloak.
- Um `PermissionGuard` global + decorator `@RequirePermission(permission: string)`, que resolve permissões via um dicionário **hardcoded em TypeScript** (`ROLE_PERMISSIONS: Record<string, string[]>`) mapeando *role do Keycloak* → lista de strings de permissão (ex.: `store_staff → ['vertical.food.view', 'store.catalog.manage', 'store.scheduling.manage', 'store.settings.manage']`).

Ponto crítico: **essa resolução usa somente as roles do JWT (Keycloak), nunca o `StoreMember.role`/`permissions` do banco.** Ou seja, hoje a granularidade real de autorização é: "é `platform_admin`?" ou "é `store_staff`?" — um `caixa` e um `gerente` da mesma loja têm exatamente as mesmas permissões em `food-api`, porque a diferenciação por `role` fica presa em `platform-api` e nunca chega às APIs de vertical.

A granularidade também é **por módulo inteiro**, não por ação: `GET /categories` (leitura) e `POST /items` (escrita) no `food-api` exigem a mesma permissão (`store.catalog.manage`) — não há distinção `read` vs. `manage`.

### 2.4 Gap de segurança: `X-Store-Id` não é validado nas verticais

`food-api`/`clinica-api` recebem o `storeId` via header `X-Store-Id` (`@StoreId()` decorator) e **confiam cegamente** nele — não existe checagem de que o `sub` do JWT realmente é membro daquela `storeId`. A validação "a loja pertence a este usuário" só acontece hoje no **BFF do ERP** (`assertUserCanAccessStore` em `apps/erp/src/lib/auth-server.ts`, que chama `platform-api`), nunca dentro da própria `food-api`/`clinica-api`. Ou seja, qualquer chamada direta a `food-api` (bypassando o ERP) com um JWT válido de **qualquer** `store_staff` e um `X-Store-Id` arbitrário passa hoje, desde que a permissão de módulo bata. Isso é uma vulnerabilidade real (IDOR — Insecure Direct Object Reference a nível de tenant), documentada como comportamento consciente ("o ERP injeta esse header, confiamos") mas que uma solução de permissões correta **precisa fechar como efeito colateral**, porque resolver a ability exige buscar o `StoreMember` daquele `(sub, storeId)` — se não existir, a ability fica vazia e tudo é negado.

### 2.5 ERP — pontos de extensão já desenhados, nunca implementados

Achado mais importante do lado frontend: o time **já modelou a extensão para permissões granulares**, só não a implementou. `apps/erp/src/lib/vertical/types.ts` define:

```typescript
export type VerticalManifest = {
  // ...
  permissions: VerticalNavPermissionsApi;  // { filterNavModules, canAccessPath, canWritePath, canAccessWithAnyOf }
  usesStorePermissionsApi: boolean;         // hoje sempre false
  services?: { fetchMyStorePermissions?: (storeId: string) => Promise<...> }; // nunca chamado
};
```

Hoje, `permissions` é preenchido por `createStubNavPermissions()` (`apps/erp/src/lib/vertical/stub-nav-permissions.ts`) — um stub **tudo-ou-nada**: se o usuário tem `vertical.food.view`, libera *todos* os módulos e paths da vertical; senão, bloqueia tudo. `VerticalNavLeaf` (item de menu) não tem campo `requiredPermission` — só `disabled` (flag de produto, "em breve", não de acesso).

`useStore()` expõe `{id, name, vertical}` da loja ativa, mas **não** `role`/`permissions` do `StoreMember` do usuário nessa loja — porque **não existe hoje nenhum endpoint no `platform-api` que devolva "minhas permissões nesta loja"** (só existe para consultar *outros* membros, via a tela de Equipe).

### 2.6 Packages compartilhados hoje

Existem fisicamente: `packages/ui`, `packages/docs`, `packages/tsconfig`, `packages/messaging`. **`packages/nest-common` é citado extensivamente na documentação (CLAUDE.md, AGENTS.md de várias apps, `packages/README.md`) como se já existisse — mas não existe.** É o destino planejado (porém nunca criado) para "guards JWT + permissions + sync Keycloak". O comentário mais honesto está em `apps/platform/api/AGENTS.md`: `nest-common/ ← guards/permissions compartilhados (NÃO usado aqui ainda)`.

Já existe infraestrutura de eventos pronta para reaproveitar (`packages/messaging`, padrão outbox no core, workers que projetam eventos em read models — o `food-api` já faz isso hoje: seu módulo `store-setup` escuta eventos `citybox.store.*` publicados pela `platform-api` e espelha um `FoodStore` local). **Este é um precedente arquitetural direto e reutilizável** para propagar mudanças de `StoreMember` às verticais, se optarmos por projeção em vez de chamada síncrona (ver seção 5.3).

### 2.7 O documento de visão já existente

`.claude/docs/auth-com-keycloak.md` já propõe (em prosa, nunca implementado) quase exatamente a arquitetura que este documento recomenda: Keycloak só identidade; `StoreUserAssignment`/`StoreMember` no banco com `role` + `permissions[]`; CASL construído a partir disso; cache Redis `perms:{sub}:{storeId}` TTL 5 min; invalidação via evento `UserPermissionsChanged`; estrutura de código dentro de `packages/nest-common/{auth,authorization}/`. Este documento de arquitetura **concorda com o núcleo dessa visão** e a torna concreta/executável, com os ajustes necessários para lidar com múltiplas verticais (que o doc original não detalha) e com os dois frontends.

## 3. Problemas concretos do estado atual

Priorizados por impacto:

1. **[Segurança] `X-Store-Id` não validado server-side nas verticais** (seção 2.4) — qualquer `store_staff` autenticado pode operar em lojas às quais não pertence, se chamar a API de vertical diretamente.
2. **[Segurança] `BackofficeStoreTeamRoute` permite qualquer membro editar permissões de qualquer outro membro da mesma loja** (seção 2.2) — falta checagem de `role`/`permissions` do próprio ator, só verifica posse.
3. **[Consistência] `StoreMember.role`/`permissions` são gravados mas nunca lidos para autorizar nada** — dado morto do ponto de vista de controle de acesso; só decorativo nas telas.
4. **[Duplicação] 4 cópias quase idênticas de `AuthGuard`/`PermissionGuard`** entre `platform-api`, `marketplace-api`, `food-api`, `clinica-api`, já divergindo em detalhes (versão da lib `jose`, presença de token de dispositivo em `marketplace-api`).
5. **[Falta de catálogo] Nenhum catálogo de `permissions` válidas** por vertical — `permissions: string[]` é campo livre, sem `validatePermissionIds` equivalente.
6. **[Frontend não aproveita o desenho existente]** `VerticalManifest.permissions`/`usesStorePermissionsApi`/`fetchMyStorePermissions` já existem no tipo mas nunca foram implementados — todas as verticais usam o stub tudo-ou-nada.
7. **[Granularidade insuficiente]** Autorização hoje é por módulo inteiro (ex. `store.catalog.manage` cobre GET e POST) — não distingue `read`/`create`/`update`/`delete`.
8. **[Sem endpoint "minhas permissões nesta loja"]** — necessário tanto para o guard do backend quanto para o frontend saber o que esconder/mostrar.

## 4. Requisitos da solução

1. Um único **motor de ability CASL** (a lógica `defineAbilityFor`) reutilizável por todas as NestJS APIs e por ambos os frontends Next.js.
2. Suportar **catálogos de recursos (`Subjects`) diferentes por domínio de negócio** (food ≠ clínica ≠ platform), sem forçar um union gigante compartilhado nem duplicar o motor por vertical.
3. Continuar usando **`StoreMember.role`/`permissions` em `platform-api` como fonte única da verdade** de "quem pode o quê" — não introduzir uma segunda fonte.
4. Permitir que **APIs de vertical, que não têm a tabela `StoreMember`**, resolvam a ability de um `(keycloakSub, storeId)` sem acoplar seu schema Prisma ao de `platform-api` (ADR C-15 — schemas isolados por app é uma restrição, não um detalhe implementável).
5. Fechar o gap de segurança do `X-Store-Id` como consequência natural do desenho (se a ability não resolve, a request é negada).
6. Baixa latência — a checagem de autorização acontece em toda request protegida; não pode custar uma chamada de rede síncrona sem cache.
7. Invalidação de cache correta quando um admin muda a permissão de um membro (reaproveitar a infraestrutura de eventos já existente).
8. No frontend, encaixar na abstração **já desenhada e não usada** (`VerticalManifest.permissions`) em vez de criar uma paralela.
9. Validação de entrada consistente com as convenções do projeto: DTOs NestJS com `class-validator` no transporte HTTP (padrão já usado em todo o backend Citybox); Zod para os pontos que o próprio código-base já reserva para Zod — formulários React do ERP/admin-web (`.claude/rules/ecc/typescript/coding-style.md` manda usar Zod para validação de schema em TS) e, opcionalmente, uma camada de validação semântica do catálogo de permissões (Zod `z.enum` gerado dinamicamente a partir do catálogo, análogo ao `validatePermissionIds` do Odontotech).

## 5. Decisões de arquitetura (opções e recomendação)

### 5.1 Quantos packages, e o que cada um contém

**Opção A — um único `packages/nest-common`, NestJS-only.** Segue literalmente o que a documentação já promete. Problema: o ERP e o admin-web são Next.js/React — não podem importar um package cheio de decorators `@nestjs/common` (`SetMetadata`, `CanActivate`, etc.) só para reaproveitar `defineAbilityFor`. Forçaria duplicar a lógica de ability no frontend (o que o Odontotech evitou de propósito).

**Opção B (recomendada) — dois packages:**

- **`packages/permissions`** — puro TypeScript, sem dependência de framework (nem `@nestjs/*`, nem `react`), só `@casl/ability`. Contém o **motor genérico** de ability + os **catálogos por domínio** (um submódulo por bounded context: `platform`, `food`, `clinica`, e cada vertical futura). É importado tanto pelas APIs NestJS quanto pelo ERP/admin-web — exatamente o papel do `@odontotech/permissions` original, generalizado para múltiplos domínios.
- **`packages/nest-common`** — específico de NestJS. Contém `AuthGuard` (validação JWT/JWKS — hoje 100% duplicado e idêntico entre as 4 APIs, é o candidato mais óbvio e de menor risco para extrair primeiro), `PermissionGuard`/`@RequirePermission()` (agora usando CASL via `packages/permissions` em vez do dicionário hardcoded), `PermissionService` (resolve `StoreMember` + cache Redis, ver 5.3), decorators (`@CurrentUser()`, `@StoreId()` agora **validando** posse, `@Public()`).

Isso resolve o requisito 1 e 8 ao mesmo tempo: o motor de CASL é agnóstico de framework (reusável no React), e a parte "pesada" de infra HTTP/cache fica isolada para quem realmente precisa dela (as APIs NestJS).

### 5.2 Como modelar múltiplos catálogos de `Subjects` sem um union gigante

**Opção A — um union só (`Subjects = 'Product' | 'Order' | 'Patient' | 'Treatment' | 'Team' | ...`) para tudo.** Rejeitada: não escala para 12 verticais, mistura domínios sem relação (um dev de `food-api` veria `Subjects` de clínica no autocomplete), e cria acoplamento de deploy — mudar o catálogo de uma vertical forçaria rebuild de outra.

**Opção B (recomendada) — namespacing por domínio, motor genérico compartilhado.** `packages/permissions` exporta um **factory genérico**:

```typescript
// packages/permissions/src/engine/create-ability-engine.ts
export function createAbilityEngine<TAction extends string, TSubject extends string>() {
  type AppAbility = Ability<[TAction, TSubject]>;
  function defineAbilityFor(input: { role: string; permissions: string[]; isOwnerOrAdmin?: boolean; catalog: PermissionCatalog<TAction, TSubject> }): AppAbility { /* ... */ }
  return { defineAbilityFor /* , canUser, validatePermissionIds, etc. */ };
}
```

E cada domínio tem seu próprio submódulo dentro do **mesmo** package físico (um `package.json`/versão só, menos overhead de workspace do que N packages):

```
packages/permissions/src/
├── engine/                    # genérico, sem saber de food/clinica/platform
│   ├── create-ability-engine.ts
│   ├── catalog.ts             # PermissionCatalog<TAction,TSubject>, validatePermissionIds genérico
│   └── types.ts
├── platform/                  # @citybox/permissions/platform
│   ├── actions.ts subjects.ts constants.ts index.ts
├── food/                      # @citybox/permissions/food
│   ├── actions.ts subjects.ts constants.ts index.ts
├── clinica/                   # @citybox/permissions/clinica
│   └── ...
└── index.ts                   # reexporta só o engine genérico
```

Cada `food-api`/`clinica-api` importa **apenas** o submódulo do seu próprio domínio (`import { defineAbilityFor, FOOD_PERMISSIONS_MODULES } from '@citybox/permissions/food'`), sem nunca ver o catálogo de outra vertical. `platform-api`, que orquestra a criação de membros para *qualquer* vertical, importa o catálogo certo dinamicamente por `store.vertical` (ver 5.4). Quando uma vertical nova nascer (ex. `beauty`), cria-se um novo submódulo — sem tocar nos existentes.

Trade-off aceito: times de vertical diferentes têm que concordar em usar o mesmo `Actions` de base (`create|read|update|delete|manage|access`, igual ao Odontotech) — o que é desejável para consistência.

### 5.3 Como uma API de vertical (sem tabela `StoreMember`) resolve a ability

Este é o ponto mais importante da decisão. Três opções:

**Opção A — Chamada síncrona a `platform-api` + cache Redis + invalidação por evento** (é o que `.claude/docs/auth-com-keycloak.md` já propõe). A cada request protegida em `food-api`: cache-hit em `perms:{sub}:{storeId}` (Redis, TTL 5 min) → se miss, chama endpoint interno `GET /internal/v1/stores/:storeId/members/:sub` em `platform-api` (autenticado por client-credentials `citybox-core-admin`, o mesmo service account já usado para a Keycloak Admin API) → guarda no cache → monta a ability.
- ✅ Simplicidade de implementação — não requer schema novo em cada vertical, não requer worker novo.
- ✅ Consistência forte no pior caso (cache miss sempre reflete o banco).
- ✅ Reaproveita o Redis que já está na infra (`infra/redis`).
- ❌ Acopla `food-api`/`clinica-api` a estarem disponíveis chamando `platform-api` em runtime (mais uma dependência de rede síncrona no caminho crítico, ainda que cacheada).
- ❌ Primeira request após deploy/restart de cada API é sempre cache-miss (latência extra ocasional).

**Opção B — Projeção por evento (mesmo padrão que `food-api` já usa para `Store` via `store-setup`).** `platform-api` publica `StoreMemberChanged {storeId, keycloakSub, role, permissions}` no outbox (RabbitMQ, via `packages/messaging`); cada vertical API tem um pequeno worker/listener que mantém uma tabela local read-only `store_member_projection` no seu próprio schema Postgres (`food`, `clinica`, etc.).
- ✅ Zero chamada de rede síncrona no caminho de autorização — só lê do próprio Postgres (rápido, sem dependência de outro serviço no ar).
- ✅ Consistente com o ADR C-15 (schema isolado por app) e com o padrão de projeção já validado em produção (`store-setup`).
- ❌ Mais código por vertical (schema novo, migration, listener) — replica o trabalho de "adicionar suporte a permissões" a cada vertical nova.
- ❌ Consistência eventual real (delay de fila) — uma mudança de permissão não é instantânea entre o `platform-api` e a vertical, mesmo que pequena.

**Opção C — Embutir `permissions`/`role` no JWT do Keycloak.** Rejeitada explicitamente já no documento de visão, e a razão se confirma pela investigação: um usuário pode ter dezenas de vínculos loja↔role, o token infla, não há como revogar um token já emitido, e qualquer holder do token vê as permissões de todas as lojas. Mantém-se rejeitada aqui.

**Recomendação: Opção A para o MVP (fases 1-4 da seção 9), com Opção B como evolução natural se/quando a chamada síncrona a `platform-api` virar gargalo ou ponto único de falha crítico.** Justificativa: a Opção A é a que o time já desenhou em prosa, tem o menor custo de implementação inicial (não pede schema/migration/worker novo em cada vertical), e o cache Redis com TTL de 5 min já reduz a maior parte do custo de rede. A Opção B fica documentada como caminho de evolução — o **contrato do evento `StoreMemberChanged`** deve ser desenhado desde já (mesmo que só usado para invalidação de cache na Opção A), para que migrar para projeção completa no futuro seja incremental, não uma reescrita.

### 5.4 Onde fica o catálogo de `permissions` (equivalente ao `PERMISSIONS_MODULES`)

Hoje `store-role.catalog.ts` (em `platform-api`) já mapeia vertical → lista de `role`s (labels). Falta o equivalente para `permissions`. Recomendação: cada submódulo de vertical em `packages/permissions/src/<vertical>/constants.ts` exporta seu `<VERTICAL>_PERMISSIONS_MODULES` (mesmo formato do Odontotech: `{id, label, action, subject, moduleId}[]`), e adicionalmente um mapa `ROLE_DEFAULT_PERMISSIONS: Record<RoleKey, string[]>` — o equivalente a "papel define permissões padrão; `permissions[]` no `StoreMember` permite overrides finos", exatamente como o modelo já descrito (mas nunca implementado) em `.claude/docs/auth-com-keycloak.md §3`.

`platform-api` (que já importa `store-role.catalog.ts`) passa a importar também `@citybox/permissions/<vertical>` dinamicamente por `store.vertical` na tela de "Equipe", para renderizar os checkboxes de permissão (mesmo padrão de UI do Odontotech: accordion por módulo) — tanto no admin-web (visão Citybox) quanto no componente compartilhado de equipe do ERP (`apps/erp/src/features/shared/team/`).

### 5.5 Granularidade de ação (resolve o problema #7 da seção 3)

Ao construir os catálogos novos por vertical, adotar desde o início `action` mais fino que hoje (`create`/`read`/`update`/`delete`/`manage`, não só `manage` cobrindo tudo) — ex. em vez de uma permissão só `store.catalog.manage`, ter `food_catalog_read` (action `read`, subject `Product`) e `food_catalog_manage` (action `manage`, subject `Product`) como entradas separadas do catálogo, permitindo compor um papel "vê cardápio mas não edita". Isso é uma decisão de modelagem de catálogo, não de arquitetura — mas vale registrar aqui porque é o padrão a seguir ao migrar os `ROLE_PERMISSIONS` hardcoded de cada vertical para o catálogo CASL novo.

### 5.6 Frontend — encaixar no que já existe

Não criar um sistema de permissões novo no ERP. Implementar `VerticalNavPermissionsApi` de verdade (substituindo `createStubNavPermissions`) usando `@casl/ability` no client, construída a partir de:
1. `fetchMyStorePermissions(storeId)` — **novo endpoint necessário** em `platform-api`: `GET /v1/backoffice/stores/:storeId/me` devolvendo `{role, permissions}` do `StoreMember` do próprio usuário autenticado naquela loja (reaproveita a mesma leitura que `BackofficeStoreTeamRoute` já faz para outros membros, só filtrando pelo próprio `sub`).
2. `@citybox/permissions/<vertical>` — o mesmo catálogo usado no backend daquela vertical, importado no `manifest.ts` da vertical correspondente no ERP.
3. Virar `usesStorePermissionsApi: true` nos manifests conforme cada vertical for migrada (permite rollout incremental — food primeiro, depois clinica/varejo).

Adicionalmente:
- `VerticalNavLeaf` ganha campo opcional `requiredPermission?: { action: string; subject: string }`, para poder esconder itens de menu individualmente (hoje só existe `disabled`, que é sobre estado de produto, não de acesso).
- `useStore()`/contexto de sessão ganha um `AbilityProvider` (novo) entre `StoreProvider` e `QueryProvider` em `apps/erp/src/app/providers.tsx`, expondo `useAbility()`/`useCan()` no mesmo espírito do hook `useAbility`/`useCan` do Odontotech.
- `admin-web` (que já opera só sobre `platform.admin`/gestão de clientes/planos, não sobre lojas) tem uso mais restrito do catálogo — majoritariamente `@citybox/permissions/platform` (subjects tipo `Client`, `Store`, `Plan`, `User` interno) — mas a mesma engine serve.

### 5.7 Correção dos gaps de segurança como parte da entrega, não depois

A introdução do `PermissionService`/`@RequirePermission` novo em `nest-common` deve, obrigatoriamente:
- Substituir o `StoreMembershipGuard` binário do `BackofficeStoreTeamRoute` por uma checagem real de ability (`ability.can('manage', 'Team')`), fechando o problema #2.
- Fazer o `@StoreId()` das verticais (`food-api`/`clinica-api`) **falhar com 403** quando a ability resolvida para `(sub, storeId)` vier vazia (nenhum `StoreMember` encontrado) — fechando o problema #1, como consequência natural do novo fluxo, não como patch separado.

## 6. Estrutura de packages proposta

```
packages/permissions/                     # puro, sem framework — usado por APIs NestJS E pelo ERP/admin-web (React)
├── package.json                          # "@citybox/permissions", deps: apenas @casl/ability
├── src/
│   ├── engine/
│   │   ├── create-ability-engine.ts      # factory genérico <TAction, TSubject>
│   │   ├── catalog.ts                    # PermissionCatalog<T>, validatePermissionIds genérico
│   │   └── types.ts                      # PermissionCatalogEntry, RoleDefaultPermissions, etc.
│   ├── platform/                         # @citybox/permissions/platform
│   │   ├── actions.ts subjects.ts constants.ts index.ts
│   ├── food/                             # @citybox/permissions/food
│   │   ├── actions.ts subjects.ts constants.ts index.ts
│   ├── clinica/                          # @citybox/permissions/clinica
│   │   └── ...
│   └── index.ts                          # reexporta só o engine
└── tsconfig.json

packages/nest-common/                     # NestJS-only — consome @citybox/permissions
├── package.json                          # deps: @nestjs/common, jose, ioredis, @citybox/permissions, @citybox/messaging
├── src/
│   ├── auth/
│   │   ├── auth.guard.ts                 # extrai o AuthGuard hoje duplicado 4x (JWT/JWKS)
│   │   ├── current-user.decorator.ts
│   │   └── public.decorator.ts
│   ├── authorization/
│   │   ├── casl.module.ts                # forRoot({ verticalCatalog, platformApiBaseUrl, redisUrl })
│   │   ├── permission.guard.ts           # substitui os 4 permission.guard.ts hardcoded
│   │   ├── require-permission.decorator.ts
│   │   ├── permission.service.ts         # resolve StoreMember (chamada + cache Redis, seção 5.3 opção A)
│   │   └── store-id.decorator.ts         # @StoreId() agora validando posse (fecha gap 2.4)
│   └── index.ts
└── tsconfig.json
```

`platform-api` continua sendo dona da tabela `StoreMember` e expõe o endpoint interno consumido pelo `PermissionService` (seção 5.3). `food-api`/`clinica-api`/`marketplace-api` passam a depender de `@citybox/nest-common` (que já traz `@citybox/permissions/<vertical>` transitivamente conforme configurado no `CaslModule.forRoot`).

## 7. Modelo de dados

**Nenhuma migration é estritamente necessária no `StoreMember` em si** — `role: String` e `permissions: Json` já existem e já são suficientes como formato de persistência (mesma decisão do Odontotech: `Json` solto, não tabela relacional — adequada aqui pela mesma razão: catálogo pequeno por vertical, sem necessidade hoje de relatórios "quem tem a permissão X" cross-loja).

O que muda é **comportamento de aplicação**, não schema:
- `UpsertStoreMemberUseCase` passa a chamar `validatePermissionIds(vertical, dto.permissions)` (novo, do `@citybox/permissions/<vertical>`) antes de persistir — hoje não valida nada.
- Endpoint novo (seção 5.6.1): `GET /v1/backoffice/stores/:storeId/me`.
- Evento novo a publicar no outbox existente: `StoreMemberChanged { storeId, keycloakSub, role, permissions }` — usado já na Opção A (5.3) para invalidação `DEL perms:{sub}:{storeId}` no Redis, e reaproveitável sem mudança de contrato se a Opção B (projeção) for adotada depois.

Se, no futuro, alguma vertical precisar de queries analíticas tipo "quantos usuários têm a permissão X" (ex. para cobrança por seat com permissão administrativa), reavaliar `Json` → tabela relacional **naquele momento** — não antecipar agora (YAGNI, conforme as próprias regras do projeto em `.claude/rules/ecc/common/coding-style.md`).

## 8. Fluxo ponta a ponta (proposto)

```
1. Admin (platform_admin ou dono da loja) abre "Equipe" no admin-web/ERP.
   → Tela renderiza checkboxes a partir de @citybox/permissions/<vertical> (PERMISSIONS_MODULES).
2. Salva → PATCH /v1/backoffice/stores/:id/team/:memberId { role, permissions }
   → platform-api: validatePermissionIds(vertical, permissions) → 400 se inválido
   → persiste StoreMember.permissions (Json)
   → publica evento StoreMemberChanged no outbox
3. Worker/consumer (RabbitMQ, packages/messaging) recebe o evento
   → DEL perms:{keycloakSub}:{storeId} no Redis (invalidação, Opção A)
4. Próxima request do membro afetado a food-api, rota @RequirePermission('update', 'Product'):
   → AuthGuard (nest-common) valida JWT via JWKS (Keycloak) — como hoje
   → PermissionGuard (nest-common) → PermissionService.resolve(sub, storeId)
       → cache hit (Redis) OU miss → GET interno platform-api (client-credentials citybox-core-admin) → cacheia
   → defineAbilityFor({ role, permissions, catalog: FOOD_CATALOG }) (@citybox/permissions/food)
   → ability.can('update', 'Product') → 200 ou 403
   → Se StoreMember não existir para (sub, storeId) → ability vazia → 403 (fecha o gap do X-Store-Id não validado)
5. No ERP, o mesmo usuário: useAbility() (novo AbilityProvider)
   → busca via VerticalManifest.services.fetchMyStorePermissions(storeId) → GET /v1/backoffice/stores/:id/me
   → defineAbilityFor(...) — MESMA função do MESMO catálogo @citybox/permissions/food
   → VerticalRouteGuard/<Can> decide o que renderizar
```

O ponto-chave (igual ao Odontotech): passos 4 e 5 chamam a **mesma** função `defineAbilityFor` do **mesmo** catálogo por vertical — garantindo paridade de regra entre cada API de vertical e o ERP, apesar de rodarem em processos/linguagens de runtime diferentes (Node backend vs. browser/Next).

## 9. Plano de implementação por fases

Pensado para virar tarefas diretamente, na ordem de menor risco/maior valor primeiro. Cada fase é entregável e testável isoladamente.

**Fase 0 — Fundação (`packages/permissions`)**
Criar o package puro: engine genérico (`createAbilityEngine`), catálogo `platform` (primeiro, porque `platform-api` é quem já tem `StoreMember`), migrar os `Subjects`/`Actions` já implícitos em `ROLE_PERMISSIONS` de `platform-api` para o formato de catálogo novo. Testes unitários do engine.

**Fase 1 — Extrair `packages/nest-common/auth`**
Mover o `AuthGuard` (JWT/JWKS) duplicado, começando por `platform-api` → validar → aplicar em `food-api`, `clinica-api`, `marketplace-api` um de cada vez (baixo risco: é comportamento idêntico ao atual, só desduplicado). Nenhuma mudança de autorização ainda.

**Fase 2 — `platform-api`: `CaslModule` + `PermissionService` local + endpoint `/me`**
Como `platform-api` já tem a tabela `StoreMember` localmente, não precisa da chamada de rede da seção 5.3 — implementa o `PermissionService` consultando o próprio Postgres direto (sem Redis ainda). Trocar `PermissionGuard`/`ROLE_PERMISSIONS` hardcoded por `@RequirePermission()` via CASL. Corrigir `BackofficeStoreTeamRoute` (fechar gap #2). Adicionar `validatePermissionIds` no `UpsertStoreMemberUseCase`. Criar `GET /v1/backoffice/stores/:storeId/me` e o endpoint interno `GET /internal/v1/stores/:storeId/members/:sub` (para as verticais consumirem na Fase 4).

**Fase 3 — Catálogo + evento**
Criar `@citybox/permissions/food` (primeira vertical, é a piloto) com granularidade `read`/`manage` por módulo (seção 5.5). Publicar evento `StoreMemberChanged` no outbox de `platform-api` a cada upsert/delete de `StoreMember`.

**Fase 4 — `food-api`: `PermissionService` com Redis + `@StoreId()` validando posse**
Implementar a Opção A completa (seção 5.3) em `nest-common/authorization`: cache Redis + chamada ao endpoint interno de `platform-api` + consumidor do evento `StoreMemberChanged` para invalidação. Migrar `food-api` para `@RequirePermission()` via CASL, fechando o gap #1 (X-Store-Id).

**Fase 5 — ERP: `AbilityProvider` + manifest da vertical Food**
Implementar `VerticalNavPermissionsApi` real (substitui o stub) para `foodManifest`, usando `@citybox/permissions/food` + `fetchMyStorePermissions`. Adicionar `requiredPermission` aos itens de `FOOD_NAV_MODULES` que hoje são só "Configurações → Equipe" (o mais óbvio para começar). `usesStorePermissionsApi: true` só no manifest food.

**Fase 6 — Replicar para `clinica-api`/`clinica` (ERP) e `varejo`**
Repetir fases 3-5 para as demais verticais já ativas, reaproveitando toda a infra de `nest-common`/`packages/permissions` — deve ser bem mais rápido que Food, que paga o custo de descobrir os padrões.

**Fase 7 — `admin-web` e `marketplace-api`**
Migrar `admin-web` (usa majoritariamente `@citybox/permissions/platform`) e desduplicar o `permission.guard.ts` de `marketplace-api`.

**Fase 8 (opcional/futura) — Reavaliar Opção B (projeção por evento)**
Só se a latência/disponibilidade da chamada síncrona a `platform-api` (Fase 4) se mostrar um problema real em produção.

## 10. Riscos e pontos de atenção

- **Migração de `ROLE_PERMISSIONS` hardcoded → catálogo CASL** muda o comportamento de autorização em produção — cada fase 2/4/6 precisa de um período de rollout com telemetria/alerta antes de remover o guard antigo (feature flag via Unleash, que já está na infra — `infra/unleash`).
- **`citybox-core-admin` client credentials** (usado hoje só para a Keycloak Admin API) passaria a ser usado também para chamadas internas `food-api → platform-api` — validar se o escopo/secret atual é adequado ou se merece um client dedicado (`citybox-internal-service`) para não misturar responsabilidades de acesso.
- **Cache Redis com TTL de 5 min** significa que uma remoção de permissão não é instantânea sem o consumidor de evento da Fase 4 funcionando corretamente — testar o caminho de invalidação como caso de teste de primeira classe (não como afterthought), dado que é justamente o tipo de bug que passa despercebido em QA manual.
- **Convenção de nomes de permissão por vertical** deve ser combinada antes da Fase 3 (ex.: `<vertical>_<modulo>_<acao>` como `food_catalog_manage`) para evitar que cada vertical invente seu próprio estilo.
- **`GET /internal/v1/...`** precisa ficar claramente fora do Swagger público e ser bloqueada por rede/guard dedicado (não é uma rota de backoffice comum) — não reaproveitar `@RequirePermission('platform.admin')` para isso, que é para humanos, não para service-to-service.

## 11. ADR sugerido

Não há ADR de autorização hoje (a numeração B-01…C-15 existente trata de outros temas; C-07 cobre só a decisão de usar Keycloak para identidade). Recomenda-se abrir um novo ADR (próximo número disponível após C-15) registrando:
- A decisão de CASL como motor de autorização, com o desenho de dois packages (`permissions` puro + `nest-common`).
- A decisão da seção 5.3 (Opção A — chamada síncrona + cache Redis + invalidação por evento — como MVP, com Opção B como evolução documentada, não como alternativa descartada).
- O novo contrato de evento `StoreMemberChanged`.

Isso também resolve a lacuna apontada pela investigação: os documentos atuais (`CITYBOX-VISAO-COMPLETA.md`, `INSTRUCOES-PROJETO-CLAUDE.md`) já pedem explicitamente que decisões tocando Keycloak/permissões virem ADR — este documento é o material-fonte para esse ADR, não o substitui.
