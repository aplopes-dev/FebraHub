# Repensando Clientes, Lojas e Planos no Citybox

Documento de decisão técnica. Objetivo: analisar a estrutura atual **Cliente → Loja → Plano/Assinatura** do `platform-api`/`admin-web`, avaliar a hipótese levantada de que essa estrutura "ficou bagunçada", e apresentar opções concretas — com pontos fortes e fracos de cada uma — para que a decisão seja tomada com base em evidência do código, não em suposição.

Este documento **não implementa nada**. É a base para um ADR e, depois, para um plano de migração (`/plan-prd` → `planner` → `/plan`), seguindo o fluxo descrito em `CLAUDE.md`.

## Tabela de Conteúdos

- [1. O problema levantado](#1-o-problema-levantado)
- [2. Estado atual (com precisão)](#2-estado-atual-com-precisão)
- [3. Problemas concretos do estado atual](#3-problemas-concretos-do-estado-atual)
- [4. Achado crítico: um segundo modelo de tenancy paralelo](#4-achado-crítico-um-segundo-modelo-de-tenancy-paralelo)
- [5. O que a proposta resolve, e o que ela precisa decidir](#5-o-que-a-proposta-resolve-e-o-que-ela-precisa-decidir)
- [6. Opções de arquitetura](#6-opções-de-arquitetura)
- [7. Planos por vertical](#7-planos-por-vertical)
- [8. Membros e gestão de equipe: onde devem viver?](#8-membros-e-gestão-de-equipe-onde-devem-viver)
- [9. Recomendação](#9-recomendação)
- [10. Plano de migração em fases (alto nível)](#10-plano-de-migração-em-fases-alto-nível)
- [11. Riscos e pontos de atenção](#11-riscos-e-pontos-de-atenção)
- [12. ADR sugerido](#12-adr-sugerido)
- [13. Refinamento: Organization/Negócio dentro de cada vertical](#13-refinamento-organizationnegócio-dentro-de-cada-vertical)
- [14. Veredito de engenharia](#14-veredito-de-engenharia)
- [15. Decisão final registrada](#15-decisão-final-registrada)

## 1. O problema levantado

Hoje, no `admin-web` (`apps/platform/admin`), a hierarquia de negócio é:

```
Cliente (pessoa/empresário)
  └── N Lojas (empresas/segmentos)
        └── N Membros (equipe da loja)

Cliente
  └── 1 Assinatura ativa (plano genérico, cross-vertical)
        └── N Faturas
```

A hipótese levantada é que essa estrutura foi desenhada para um cenário — um empresário com várias empresas de segmentos diferentes — que **na prática é raro**, e que colocar o plano/assinatura no **Cliente** em vez de na **Loja** é o erro estrutural central, porque:

- O Citybox terá 12 verticais de negócio, com **custo de operação e disposição a pagar muito diferentes** entre elas (ex.: um sistema para clínica de estética de unhas não vale o mesmo que um sistema para salão de beleza completo, para escritório de advocacia ou para restaurante).
- Um plano único, genérico, por Cliente, não consegue expressar "vertical X custa Y, vertical Z custa W", nem "dentro da vertical X existem tiers do simples ao avançado".
- A abstração Cliente, hoje, existe **só para agrupar lojas e centralizar billing** — e isso pode ser modelado de forma mais simples, com a Loja como unidade central (loja = cliente).

A seguir, valido essa hipótese contra o código real.

## 2. Estado atual (com precisão)

Levantamento feito por exploração direta do código-fonte de `apps/platform/api` (schema Postgres `platform`) e `apps/platform/admin`.

### 2.1 Modelos Prisma (`apps/platform/api/prisma/schema.prisma`)

| Model | Papel | Campos principais | Relações |
|---|---|---|---|
| `User` | Usuário interno da plataforma (operador Citybox) | `keycloakSub`, `role` | Nenhuma com Client/Store |
| `Client` | "Cliente" — pessoa/empresário | `personType`, `document` (único), `name`, `groupName`, `responsibleName`, `email`, `status`, endereço | `stores Store[]`, `subscriptions Subscription[]`, `invoices Invoice[]` |
| `Store` | "Loja" — a empresa/unidade operacional | `clientId` (FK **obrigatória**), `vertical` (string livre), `tradeName`, `slug`, `status`, `deploymentStatus`, métricas (`ordersToday`, `revenueTodayCents`), `trialEndsAt`, `maintenanceMode`, `usesClientDocument` | `terminals`, `errors`, `members (StoreMember)`, `modules (StoreModule)`, `integrations`, `auditEvents` |
| `StoreMember` | Membro/usuário da equipe de uma loja | `storeId` (FK), `keycloakSub`, `role`, `permissions Json`, `hasPassword`, `disabledAt`, `provisionalExpiresAt` | único em `[storeId, keycloakSub]` |
| `Plan` | Plano comercial | `code` (único), `maxStores`, `maxUsers`, `maxProducts?`, `status` | `prices PlanPrice[]` — **sem vínculo com vertical** |
| `PlanPrice` | Preço por ciclo | `planId` (FK), `cycle (MONTHLY\|YEARLY)`, `priceCents`, `stripePriceId?` | único em `[planId, cycle]` |
| `Subscription` | Assinatura ativa | `clientId` (FK — **não `storeId`**), `planPriceId` (FK), `cycle`, `status`, `currentPeriodStart/End`, `dayOfMonth`, `stripeSubscriptionId?` | `invoices Invoice[]` |
| `Invoice` | Fatura | `subscriptionId` (FK), `clientId` (FK), `amountCents`, `status`, `dueDate`, `periodStart/End` | — |

Pontos-chave já confirmados no schema:

- **Billing (Plano + Assinatura + Fatura) vive inteiramente no `Client`.** A Loja não tem plano próprio.
- **Membros já vivem na Loja** (`StoreMember`), não no Cliente — não existe `CustomerMember`. Isto já está alinhado com a visão de "loja como unidade real do negócio".
- `Plan` é **agnóstico de vertical** — um único catálogo de planos serve todas as verticais.
- `usesClientDocument` em `Store`: quando a loja não tem CNPJ próprio, ela herda o documento fiscal do `Client`. É um acoplamento estrutural direto — qualquer redesenho que elimine `Client` precisa resolver isso.

### 2.2 Regras de negócio (`apps/platform/api/src/modules`)

- **`CreateStoreUseCase`**: exige que o `Client` tenha assinatura ativa; busca o `Plan` via `subscription.planId`; valida quota `maxStores` do plano **contra o total de lojas do Client** (não da loja individual). Ou seja: hoje é literalmente impossível criar uma segunda loja sem que a "conta" (Client) already tenha plano — a quota é corporativa, não por loja.
- **`GetClientUsageUseCase`**: agrega uso (`stores.used/max`, `usersPerStore.max`) a partir do plano do Client. O campo `verticals.allowed` retornado é **hardcoded no código** (`['food','varejo','clinic']`) — não existe hoje nenhuma entidade real de "quais verticais este cliente/loja tem habilitadas".
- **Troca de plano**: atualiza a `Subscription` existente in-place (upgrade/downgrade recalculando período), decisão já registrada em `apps/platform/api/AGENTS.md` (2026-07-02).
- **Faturamento**: `GenerateInvoicesUseCase` (job idempotente por ciclo), `MarkInvoiceAsPaidUseCase`, `GetBillingKpisUseCase` — tudo referenciado a `Subscription → Client`.

### 2.3 Admin-web (`apps/platform/admin`)

- Menu: Dashboard, **Clientes**, **Lojas**, Financeiro, Planos, Usuários.
- **Lista de Clientes**: colunas Cliente, Responsável, Operação, **Financeiro** (plano/status), Cadastro.
- **Detalhe do Cliente**: tabs About, **Billing** (plano, ciclo, status, vencimento, upgrade/downgrade, cancelamento), Financial, Fiscal, History, **Stores** (lojas do cliente), Users.
- **Lista de Lojas**: colunas Loja, Vertical, **Cliente (Grupo)**, Status, Criada em. A Loja aparece sempre "pendurada" em um Cliente — reforça visualmente a hierarquia atual.
- **Detalhe da Loja**: CRUD, settings, modules, team, audit-log — **sem aba de billing própria**.

Isso confirma exatamente a percepção do usuário: billing é uma responsabilidade do Cliente, a Loja é tratada como subordinada operacional sem autonomia comercial.

### 2.4 Verticais já implementadas (`apps/verticals/food/api`)

`FoodStore.storeId` é **chave primária = FK direta para `Store.id`** do platform-api, sincronizado via evento RabbitMQ (`citybox.store.created.v1`/`updated.v1`). É um modelo **flat**: 1 registro de setup por loja. **Não existe hoje nenhuma noção de "organização" ou multi-negócio dentro de uma vertical** — a ideia de "vertical implementada como multi-organização, com uma organização tendo um ou mais negócios" mencionada na proposta é um **conceito novo**, ainda não presente em nenhuma vertical implementada.

## 3. Problemas concretos do estado atual

1. **Plano genérico cross-vertical.** Um único catálogo `Plan`/`PlanPrice` não expressa preço por vertical nem tiers por vertical. Para vender "Clínica Estética Simples" a R$X e "Restaurante Completo" a R$Y, hoje seria preciso convenção manual (ex. códigos de plano tipo `FOOD_PRO`), sem modelagem real — arriscado e sem consulta estruturada de "quais planos existem para a vertical Y".
2. **Quota e billing por Client, não por Store.** `maxStores` incentiva pensar em "conta corporativa com N lojas", quando o caso comum (segundo a hipótese do usuário, a validar com dados reais — ver seção 10, Fase 0) é 1 loja = 1 cliente pagante. Isso torna métricas de negócio por loja/vertical (MRR por vertical, churn por segmento, LTV por tipo de loja) mais difíceis de calcular, porque o dado financeiro está agregado no nível errado.
3. **Cliente como abstração de baixo valor perceptível.** `Client` teria razão de existir principalmente para o caso de um mesmo dono com múltiplas lojas de segmentos diferentes — cenário que a proposta do usuário considera raro. Hoje não há visibilidade de quantos `Client` reais têm mais de uma `Store` (ver Fase 0 na seção 10) — a decisão de eliminar a entidade deveria ser confirmada com esse dado antes de migrar.
4. **`usesClientDocument`** cria um acoplamento estrutural: a Loja depende do Cliente existir para casos sem CNPJ próprio. Qualquer proposta de "loja = cliente direto" precisa de um plano para esse campo.
5. **`verticals.allowed` hardcoded.** Não há hoje uma entidade real de "vertical habilitada para este cliente/loja" no `platform-api` — só existe (de forma dinâmica) no modelo paralelo descrito na seção 4. Isso é uma lacuna independente da decisão Cliente vs. Loja, mas relevante para o desenho de "plano por vertical".

## 4. Achado crítico: um segundo modelo de tenancy paralelo

Durante a exploração, foi encontrado um **segundo modelo de domínio de tenancy**, diferente do `Client → Store` do `platform-api`, em uso por outras partes do sistema:

- Em `apps/marketplace/api/prisma/platform/schema.prisma` (schema **`public`**, não `platform`) existe `Organization`, `Store` (com `organizationId` **opcional** — já modelando multi-organização por loja) e `OrganizationSubscription` (plano/billing por **Organization**, não por Client).
- Esse schema paralelo é consumido por `apps/marketplace/api` (`hierarchy.controller.ts`, `user-store-assignments.service.ts`, `store-access.service.ts`) e por `apps/realtime-gateway` (`ws-auth.service.ts`).
- Ambos os schemas apontam para o **mesmo banco `citybox_platform`**, mas em schemas Postgres diferentes (`platform` vs. `public`), portanto são **tabelas fisicamente distintas e dessincronizadas** — não é o mesmo dado visto de duas formas, são dois modelos de verdade concorrentes.

Isto muda o escopo da decisão: **a "bagunça" percebida pelo usuário não é só a modelagem Cliente/Loja/Plano do `platform-api`** — já existe hoje uma duplicação de conceito de tenancy no monorepo, entre o modelo "oficial" do backoffice (`Client → Store`, billing por Client) e um modelo mais antigo ou paralelo usado por autenticação/acesso do app B2C e do realtime-gateway (`Organization → Store`, billing por Organization, já com suporte a multi-org por loja).

Qualquer decisão de "loja vira cliente direto" precisa necessariamente responder: **o que fazer com esse segundo modelo?** Três caminhos possíveis, discutidos na seção 6.4.

## 5. O que a proposta resolve, e o que ela precisa decidir

**Já resolvido/alinhado hoje, sem precisar mudar nada:**
- Membros já são por Loja (`StoreMember`), não por Cliente. A visão do usuário de "a loja é o cliente real" já é parcialmente verdade no nível de equipe.

**A proposta resolve, se implementada:**
- Plano por loja + por vertical elimina a genericidade do billing atual.
- Remove uma camada de indireção (Cliente) que hoje só serve para agrupar e cobrar.

**A proposta precisa decidir explicitamente (ainda em aberto):**
1. **O caso de rede/franquia** (mesmo dono, várias lojas) — existe hoje via `Client.groupName` e a coluna "Cliente (Grupo)" na lista de Lojas. Eliminar `Client` sem substituto perde a possibility de consolidar fatura/desconto por grupo. Precisa de uma solução — não necessariamente recriar o `Client` atual.
2. **O documento fiscal herdado** (`usesClientDocument`) — sem `Client`, cada `Store` precisa ter seu próprio documento fiscal (o que é coerente com "loja = empresa/CNPJ"), mas isso deve ser validado com o time fiscal/negócio.
3. **O modelo `Organization` paralelo** (seção 4) — decisão separada, mas relacionada: não faz sentido resolver a duplicidade conceitual no `platform-api` e deixar um segundo modelo de tenancy divergente rodando em paralelo no `marketplace-api`/`realtime-gateway`.
4. **"Vertical multi-organização"** (uma vertical ter uma ou mais organizações, cada uma com um ou mais negócios) é um conceito **novo**, não implementado em nenhuma vertical hoje. É ortogonal à decisão Cliente vs. Loja no `platform-api` — pode ser adiado sem bloquear a simplificação do billing.
5. **Onde a gestão de equipe/membros deveria viver** (`platform-api` centralizado vs. dentro de cada vertical) — discutido na seção 8.

## 6. Opções de arquitetura

### 6.1 Opção A — Manter Cliente, só adicionar `Plan.vertical`

Adiciona um campo `vertical` (nullable) em `Plan`, sem tocar na relação `Subscription.clientId`.

- ✅ Menor esforço, zero migração de billing existente.
- ✅ Resolve parcialmente o problema de preço por vertical.
- ❌ Não resolve o problema central: a assinatura continua no Cliente, então uma loja de vertical "cara" e outra de vertical "barata" sob o mesmo Cliente continuam competindo por uma única assinatura/quota — o problema de fundo persiste.
- ❌ Não reduz a complexidade conceitual que motivou a pergunta do usuário.

**Avaliação: resolve o sintoma, não a causa. Não recomendado como solução final**, mas é o passo mais barato para "sentir" o problema com planos reais por vertical antes de migrar billing.

### 6.2 Opção B — Eliminar `Client`; `Store` vira a unidade de billing direta ("loja = cliente")

`Store` absorve os campos hoje em `Client` (`document`, `personType`, `responsibleName`, endereço). `Subscription`/`Invoice` passam a referenciar `storeId` em vez de `clientId`. No admin-web, a tela "Clientes" passa a operar diretamente sobre `Store` (ou as telas Clientes+Lojas se fundem em uma).

- ✅ Modelo mental muito mais simples e alinhado ao negócio real (1 loja paga por si, no plano da sua vertical).
- ✅ Plano por vertical fica natural — cada `Store` tem seu `Plan`, escolhido dentro do catálogo da sua `vertical`.
- ✅ Métricas de negócio (MRR por vertical, churn, LTV) ficam corretas no nível certo, sem agregação artificial.
- ✅ Reduz uma entidade inteira do domínio (menos telas, menos casos de borda, menos código).
- ❌ Exige migração de dados de billing real (Stripe subscription IDs, faturas já emitidas) — sensível, precisa de plano cuidadoso (expand-contract).
- ❌ Quebra o caso de rede/franquia sem solução explícita (mesmo dono com várias lojas, hoje agrupadas por `groupName`) — precisa de um mecanismo, ainda que simples, para não perder essa capacidade sem decisão consciente.
- ❌ Precisa resolver `usesClientDocument` (cada loja passa a ter documento fiscal próprio, sempre).

### 6.3 Opção C — `Client` sobrevive, mas esvaziado: vira "Grupo de Faturamento" opcional

`Store` ganha campos fiscais e `Plan`/`Subscription` próprios (como na Opção B), mas mantém-se uma entidade fina e **opcional** (`clientId` nullable em `Store`) só para: (a) consolidar fatura de um dono com várias lojas, (b) aplicar desconto de volume. Essa entidade deixa de ter plano/assinatura própria — billing é sempre por `Store`.

- ✅ Resolve o problema central (plano por loja/vertical) sem perder o caso de franquia.
- ✅ Migração incremental: dá para implementar em fases, mantendo a tabela `Client` (só muda seu papel e cardinalidade).
- ✅ Documenta explicitamente o que hoje é implícito e confuso: billing nunca mais fica ambíguo entre "é do Cliente ou da Loja".
- ❌ Mantém uma entidade a mais no domínio (ainda que muito mais simples que a atual).
- ❌ Risco de "recriar a confusão atual por outro nome" se a opcionalidade e o escopo restrito não forem bem documentados e garantidos em nível de schema/UI.

### 6.4 O que fazer com o modelo `Organization` paralelo (independente da escolha acima)

Três caminhos, a decidir em conjunto com quem conhece o histórico do `marketplace-api`/`realtime-gateway`:

1. **Aposentar** — se for código vestigial de uma fase anterior do projeto, sem dados reais em produção/staging, remover e apontar tudo para o modelo único do `platform-api`.
2. **Unificar** — se estiver em uso real, tornar o `platform-api` (schema `platform`) a única fonte de verdade de tenancy, e o `marketplace-api`/`realtime-gateway` passam a consumir via evento (o mesmo padrão já usado por `food-api` com `FoodStore.storeId`), em vez de manter tabelas próprias de `Organization`/`Store`.
3. **Manter conscientemente dois modelos, documentados** — só se houver uma razão de negócio real para `Organization` (B2C do marketplace) ser conceitualmente diferente de `Client`/`Store` (B2B do ERP/backoffice). Se for esse o caso, isso precisa virar um ADR explícito — não pode continuar implícito como está hoje.

**Não recomendo decidir isso "de brinde" dentro da migração de Cliente/Loja/Plano** — é um problema com escopo e risco próprios (toca autenticação do app B2C e do realtime-gateway). Tratar como investigação e ADR separados (ver Fase 0/4 na seção 10).

## 7. Planos por vertical

Independente da opção escolhida na seção 6, o desenho de "plano por vertical" precisa de:

- `Plan.vertical` (string ou FK para um catálogo de verticais) — permite ter múltiplos planos por vertical (ex.: `FOOD_BASICO`, `FOOD_PRO`, `CLINICA_ESTETICA_SIMPLES`, `CLINICA_ESTETICA_COMPLETA`).
- Manter `PlanPrice` como está (ciclo mensal/anual por plano) — não precisa mudar.
- `maxStores` deixa de fazer sentido se o billing for por Store (Opções B/C) — pode ser removido ou reaproveitado só dentro do "Grupo de Faturamento" da Opção C, se essa for a escolhida.
- `maxUsers`/quota de membros: já é avaliado contra `StoreMember` por loja — não muda.
- O catálogo hoje hardcoded de "verticais permitidas" (`GetClientUsageUseCase`) precisa virar uma relação real (`Store.vertical` + `Plan.vertical` já resolve isso naturalmente, sem precisar de uma lista solta no código).

## 8. Membros e gestão de equipe: onde devem viver?

A pergunta levantada foi: já que a loja vira a unidade central, os membros de equipe (hoje `StoreMember` no `platform-api`) deveriam continuar geridos pelo backoffice/admin, ou migrar para dentro de cada vertical (ERP)?

**Argumentos para manter no `platform-api` (recomendado por ora):**
- `StoreMember` já é a fonte de verdade de autenticação/permissão consultada pelos guards de todas as APIs (ver `packages/docs/platform/ARQUITETURA-PERMISSOES-CASL.md`, que já mapeia essa complexidade em detalhe). Mover isso agora significa redesenhar autenticação em paralelo à migração de billing — dois problemas grandes e arriscados ao mesmo tempo.
- O catálogo de roles por vertical (`store-role.catalog.ts`) já vive no `platform-api` e é consultado de forma centralizada — fragmentar por vertical duplicaria essa lógica em N APIs.

**Argumentos para mover para dentro de cada vertical:**
- Cada vertical ficaria mais autônoma/self-contained, reduzindo o `platform-api` como "hub de tudo".
- Faria sentido junto com o conceito novo de "vertical multi-organização" (seção 5, item 4) — mas isso ainda não existe em nenhuma vertical implementada.

**Recomendação:** não mover agora. É uma mudança ortogonal à decisão de Cliente/Loja/Plano, com risco próprio (autenticação stateless via Keycloak + guards locais em cada API), e já está em rota de complexidade própria documentada no ADR de permissões CASL. Tratar como possível fase futura, decidida separadamente.

## 9. Recomendação

**Recomendo a Opção C (seção 6.3)** como o caminho de melhor custo-risco-benefício: ela entrega exatamente o que a proposta do usuário pede — **loja como unidade de billing, plano por vertical, fim da genericidade do plano** — sem descartar, sem dado real, a capacidade de atender ao cenário de rede/franquia. A diferença prática para a Opção B (eliminar `Client` de vez) é pequena em código, mas grande em segurança: a tabela continua existindo (esvaziada), então não há necessidade de decidir sob pressão, antes da migração, "o que fazemos se aparecer um cliente real com 3 lojas amanhã".

Concretamente:

1. `Store` ganha os campos fiscais/pessoais hoje em `Client` (torna-se autossuficiente).
2. `Subscription`/`Invoice` migram de `clientId` para `storeId`.
3. `Plan` ganha `vertical`.
4. `Client` perde `subscriptions`/`invoices` diretas, mantém só `stores` — vira um agrupador opcional (`Store.clientId` nullable), renomeável para algo que não confunda mais com "o cliente" (ex.: manter o nome de tabela, mas deixar claro na UI/admin que é "Grupo de Lojas", não "Cliente").
5. No admin-web, a tela hoje chamada "Clientes" passa a operar sobre `Store` diretamente (seguindo a sugestão do usuário de "a loja vira o cliente"); a tela/aba de "Grupo" fica secundária, acessível só quando uma loja pertence a um grupo.

Isso resolve o problema relatado sem forçar uma decisão irreversível sobre o caso de franquia, e sem misturar essa migração com a decisão, maior e mais arriscada, sobre o modelo `Organization` paralelo (seção 4) ou sobre onde os membros devem viver (seção 8) — que devem seguir como iniciativas separadas.

## 10. Plano de migração em fases (alto nível)

Este documento não é um plano de implementação — é a base para gerar um via `/plan-prd` → `planner` → `/plan`, conforme o fluxo do `CLAUDE.md`. Em alto nível, a sequência recomendada:

- **Fase 0 — Descoberta (dado real, não suposição):**
  - Quantificar quantos `Client` em produção/staging têm mais de uma `Store` hoje — confirma ou refuta a premissa de que o caso de agrupamento é raro.
  - Investigar o modelo `Organization` paralelo (seção 4): está em uso real? Tem dados? Quem depende dele hoje além de `marketplace-api`/`realtime-gateway`?
- **Fase 1 — Modelagem:** `Plan.vertical` + tiers; `Store` ganha campos fiscais/pessoais; `Subscription`/`Invoice` migram de `clientId` para `storeId` (migration de dados real, com plano de rollback).
- **Fase 2 — Admin-web:** fundir/redesenhar telas Clientes+Lojas; aba Billing passa a viver na Store; `database-reviewer` obrigatório (schema tocado).
- **Fase 3 — Grupo de faturamento mínimo:** só se a Fase 0 confirmar necessidade real de consolidação de fatura por rede/franquia.
- **Fase 4 (separada):** decisão sobre o modelo `Organization` paralelo, com ADR próprio.
- **Fase 5 (separada, futura):** avaliar se gestão de equipe deveria migrar para dentro de cada vertical.

## 11. Riscos e pontos de atenção

- Migração de billing é dado sensível: IDs de assinatura Stripe, faturas já emitidas e histórico fiscal não podem ser perdidos ou duplicados — expand-contract, nunca alteração destrutiva direta.
- Mapear todo consumidor de `Client` antes de mudar cardinalidade (webhooks, exports, relatórios de BI/Metabase, jobs de faturamento).
- O achado do modelo `Organization` paralelo (seção 4) é um risco **independente** desta decisão — já existe hoje, e merece investigação própria mesmo que a proposta de Cliente/Loja não avance.
- Qualquer migration real de schema exige `database-reviewer` (`ecc-database-reviewer` no Cursor) e atualização do `AGENTS.md` do app dono, conforme `CLAUDE.md`.
- Este documento foi gerado a partir de exploração de código; os números de "quão raro é o caso de múltiplas lojas por cliente" (seção 3, item 3) são uma hipótese a confirmar na Fase 0, não um fato levantado aqui.

## 12. ADR sugerido

```
Título: Loja como unidade de billing; Plano por vertical; Cliente vira grupo de faturamento opcional
Status: Proposto (aguardando Fase 0 de descoberta)

Contexto:
  Billing (Plan/Subscription/Invoice) hoje vive no Client, entidade que agrupa Stores.
  Plan é agnóstico de vertical. Existe um segundo modelo de tenancy (Organization) em
  apps/marketplace/api + apps/realtime-gateway, dessincronizado do Client/Store do
  platform-api.

Decisão:
  Store passa a ser a unidade de billing (Subscription/Invoice referenciam storeId).
  Plan ganha campo vertical. Client perde billing direto, vira agrupador opcional
  (Store.clientId nullable) só para consolidação fiscal de redes/franquias.
  Modelo Organization paralelo tratado em ADR separado.

Consequências:
  + Plano/preço reflete o custo real de cada vertical.
  + Métricas de negócio (MRR, churn, LTV) corretas no nível da loja.
  + Menos ambiguidade entre "Cliente" e "Loja" na UI e no código.
  - Migração de dados de billing real (Stripe, faturas) necessária.
  - Caso de rede/franquia precisa de solução explícita (grupo de faturamento).
```

Este texto é um rascunho a ser formalizado em `gestao/docs/adrs/` (numeração seguinte à série B-01…C-15 documentada no `README.md` raiz) quando a decisão for confirmada.

## 13. Refinamento: Organization/Negócio dentro de cada vertical

Discussão de acompanhamento (2026-07-17) refinou a Opção C (seção 6.3) para uma versão mais precisa, que **resolve ao mesmo tempo** o problema original (plano por vertical) e o achado da seção 4 (modelo `Organization` paralelo e ambíguo). A diferença central: em vez de um `Organization`/"grupo de faturamento" cross-vertical no `platform-api`, o conceito de organização com múltiplos negócios passa a viver **dentro de cada vertical-api, escopado àquela vertical** — junto com os membros.

### 13.1 Nova divisão de responsabilidade

| Camada | Dono | Conteúdo |
|---|---|---|
| `platform-api` | Fonte de verdade de **billing/tenant raiz** | `Store` (identidade mínima: vertical + slug + status), `Plan`/`PlanPrice` (por vertical, com limite de negócios por tier, ex. `maxNegocios`), `Subscription`, `Invoice` |
| `<vertical>-api` (ex. `food-api`) | Fonte de verdade **operacional** | `Organization` (escopada à vertical), `Negocio` (a unidade real — o restaurante, a clínica; 1 Organization tem N Negocios, limitado pelo plano), `Member` (equivalente ao `StoreMember` hoje, mas dentro do schema da vertical, com roles específicas daquele domínio) |

Isso resolve diretamente o cenário do exemplo do usuário: **Plano Prata** (clínica) = `maxNegocios: 1`; **Plano Ouro** = `maxNegocios: 3` — o limite é uma regra comercial do `platform-api`, aplicada operacionalmente dentro da `clinica-api`.

### 13.2 Provisionamento (criar loja → plano → seed automático)

Reaproveita o padrão de sincronização por evento que já existe hoje (`citybox.store.created.v1` → `FoodStore`) e o campo `Store.deploymentStatus` (já existente, já pensado para estado assíncrono de provisionamento):

1. Admin cria `Store` + escolhe vertical/plano → `platform-api` cria `Store` + `Subscription`, `deploymentStatus = provisioning`.
2. `platform-api` emite `store.created.v1` **com os limites do plano no payload** (`maxNegocios`, tier), não só o `storeId` como hoje.
3. Consumer da vertical (em `apps/workers` ou dentro da própria `vertical-api`) cria `Organization` + primeiro `Negocio` + `Member` owner (convite/senha provisória) + roda o seed padrão (ex. cardápio default em `food-api`).
4. Vertical emite `store.provisioned.v1` (ou evento de falha) → `platform-api` atualiza `deploymentStatus = active`; admin-web acompanha via polling/websocket.

Nenhuma transação distribuída é necessária — cada serviço só escreve no próprio schema, coordenado por eventos idempotentes (já é o padrão de outbox descrito no `CLAUDE.md`).

### 13.3 Suspensão por inadimplência

Mesmo canal, sentido inverso: `Invoice` vence → `Subscription.status` muda → `Store.status = suspensa` → `platform-api` emite `store.suspended.v1` → cada vertical marca `Organization`/`Negocio` como suspenso **localmente**. O guard de autenticação da vertical (o mesmo que já valida JWT) passa a checar esse status local antes de liberar qualquer rota — **sem chamada síncrona ao `platform-api` a cada request**, para não acoplar o caminho mais quente do sistema (toda request autenticada) a uma dependência cross-service. Reativação é o evento inverso.

### 13.4 Gestão de membros pelo Platform/Admin quando `Member` mora na vertical

Separar **escrita** de **leitura** — são dois problemas com soluções diferentes:

- **Escrita** (criar/editar/desativar membro a partir do admin): chamada **síncrona direta** admin/`platform-api` → `vertical-api`, com autenticação machine-to-machine (mesmo padrão já usado pelo `citybox-core-admin` para a Keycloak Admin API), reaproveitando a lógica de proxy que o ERP já usa (`/api/proxy/food` com `X-Store-Id`). A vertical continua sendo a única fonte de verdade — o admin não guarda cópia dos dados, só orquestra. **Workers não são o mecanismo certo aqui**: comando que precisa de resposta imediata (validação de formulário, erro na tela) não deve depender de evento assíncrono.
- **Leitura** (telas do admin tipo "equipe de todas as lojas"): aqui sim usar **workers** — cada vertical emite `member.created/updated/disabled.v1`, um worker (`apps/workers`) projeta um **read model** dentro do `platform-api` (tabela só de leitura, ex. `MemberSummary`, nunca fonte de verdade), evitando que o admin chame N APIs de vertical a cada listagem. É o mesmo padrão de projeção que `apps/workers` já faz para outros read models.
- **Risco a resolver à parte:** a lógica de provisionamento no Keycloak (criar `keycloakSub`, senha provisória, convite — hoje dentro dos use cases de `StoreMember` no `platform-api`) não pode ser duplicada em 12 verticais. Precisa virar uma função compartilhada em `packages/nest-common` (que já hospeda utilitários de sync com Keycloak, conforme `CLAUDE.md`), consumida por todas as `vertical-api`s.

### 13.5 Efeito no achado da seção 4 (modelo `Organization` paralelo)

Este refinamento muda a recomendação da seção 6.4: com `Organization`/`Negocio` vivendo dentro de cada vertical-api, escopados à vertical, o modelo `Organization` genérico e cross-vertical encontrado em `marketplace-api`/`realtime-gateway` **deixa de ser um candidato a "fonte de verdade compartilhada"** — ele não é vertical-scoped, então não corresponde ao novo desenho. Ele deveria ser **aposentado** (se vestigial) ou **redesenhado seguindo este mesmo padrão** (se realmente precisa existir para o app B2C), não mantido como está. Isso não muda a necessidade de investigação da Fase 0 (uso real em produção/staging) — só deixa mais claro qual é o alvo a comparar.

### 13.6 Impacto no plano de migração (seção 10)

Este refinamento adiciona escopo à Fase 5 (que antes era "avaliar se gestão de equipe deveria migrar para dentro de cada vertical" — agora vira parte da decisão principal, não um adendo futuro) e deveria ser considerado **em conjunto com a Fase 1**, não depois: mover `Subscription`/`Invoice` para `storeId` e desenhar `Organization`/`Negocio`/`Member` por vertical são mudanças que compartilham o mesmo mecanismo de eventos (`store.created.v1` enriquecido), então faz sentido planejá-las juntas, mesmo que a implementação em código seja faseada por vertical (começando por `food-api`, que já tem o sync `FoodStore` mais maduro).

## 14. Veredito de engenharia

Análise técnica (2026-07-17), separando a proposta em duas decisões independentes, cada uma com seu próprio nível de risco e certeza:

| Parte da proposta | Veredito | Risco |
|---|---|---|
| `Store` como unidade de billing direta; `Plan` por vertical/tier | **Correta sem ressalvas.** O modelo atual (`Plan` agnóstico de vertical, billing no `Client`) é um mismatch estrutural entre schema e realidade de negócio — não há argumento técnico sério para mantê-lo. | Baixo — migration de schema com dado sensível, mas bem compreendida (mover FK, adicionar colunas). Não introduz problema novo de sistemas distribuídos. |
| `Organization`/`Negócio`/`Member` migrarem para dentro de cada `vertical-api`, com coreografia de eventos para provisionamento/suspensão/quota | **Correta condicionalmente.** É o desenho padrão de "bounded context por serviço" da literatura de arquitetura distribuída — mas troca um modelo centralizado, transacional e simples de testar por um modelo distribuído, orientado a evento, sujeito a inconsistência parcial (provisionamento vira saga, não transação; suspensão tem janela de propagação; cada vertical nova precisa reimplementar guard/quota/sincronia Keycloak↔Member corretamente, sob risco de bug de controle de acesso). | Médio-alto — só compensa se "extrair uma vertical como produto standalone" for meta real e próxima, não aspiracional. Dado que hoje existem só `food-api` (real) e `clinica-api` (scaffold sem domínio) num piloto de cidade única, o caminho responsável é provar o padrão inteiro numa vertical antes de generalizar para as demais 11 planejadas. |
| Modelo `Organization` duplicado em `marketplace-api`/`realtime-gateway` (seção 4) | Nenhuma das duas arquiteturas resolve isso por si só — é dívida técnica independente, com ADR próprio. | A decidir separadamente (Fase 0/4, seção 10). |

**Importante:** o refinamento da seção 13 (`Organization`/`Negócio` escopados por vertical, com limite de negócios por tier de plano) tem um efeito colateral relevante sobre esse veredito — ele **resolve** a principal fonte de risco que fazia a Opção C (seção 6.3, manter `Client` esvaziado como grupo de faturamento opcional) parecer mais segura que a Opção B (eliminar `Client` de vez): o caso de rede/franquia (mesmo dono, múltiplas unidades) passa a ser resolvido **dentro da vertical**, via `Organization → Negócio` limitado pelo plano — não precisa mais de um agrupador no nível do `platform-api`. Isso muda o cálculo: se a Decisão 2 (Organization por vertical) for adotada, a Opção B deixa de ser arriscada e passa a ser a escolha coerente — o problema que motivava manter `Client` como "grupo" já está resolvido em outro lugar.

## 15. Decisão final registrada

**Decisão tomada (2026-07-18): Opção B.** `Client` é eliminado como entidade de billing. `Store` vira a unidade de billing direta ("Loja = Cliente"). Esta escolha é coerente com o raciocínio da seção 14: o caso de múltiplas unidades por dono é resolvido pelo par `Organization`/`Negócio` dentro de cada vertical (seção 13), não por um agrupador remanescente no `platform-api`.

O detalhamento completo desta decisão — contexto, modelo de dados final, fluxos ponta a ponta, alternativas consideradas e consequências — está registrado como ADR formal em [`docs/adrs/plat-001-loja-como-unidade-de-billing.md`](../../../docs/adrs/plat-001-loja-como-unidade-de-billing.md). Este documento (`ARQUITETURA-CLIENTES-LOJAS-PLANOS.md`) e o documento to-be (`ARQUITETURA-ALVO-TENANCY-VERTICAIS.md`) permanecem como material de apoio/histórico da análise que levou a essa decisão.
