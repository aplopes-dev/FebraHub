# Phase 0 Research: Loja como Unidade de Billing (platform-api + admin-web)

Nenhum item da Technical Context ficou como `NEEDS CLARIFICATION` — o ADR PLAT-001 e a sessão de
`/speckit-clarify` já resolveram as ambiguidades de negócio. As decisões abaixo cobrem os pontos
técnicos que o spec deliberadamente deixa em aberto (ele é agnóstico de implementação) e que
precisam de uma decisão única antes do desenho de dados (Phase 1), extraídas da leitura direta do
código atual de `apps/platform/api` e `apps/platform/admin`.

## 1. Estratégia de migration: expand → backfill → contract

**Decision**: A remoção de `Client` acontece em pelo menos 3 migrations Prisma separadas, todas
geradas via `pnpm --filter @citybox/platform-api db:migrate:dev` (`prisma migrate dev --name
<nome>`), nunca SQL manual:

1. **Expand**: adicionar `storeId` (nullable) em `Subscription` e `Invoice`; adicionar
   `personType`, `responsibleName`, `billingEmail` em `Store`; adicionar `vertical`, `tier`,
   `maxNegocios` em `Plan` (mantendo `maxStores`/`clientId` antigos intactos e funcionais).
2. **Backfill**: script de dados (não SQL manual — código TypeScript rodando sobre o Prisma
   Client gerado) preenche `storeId` a partir do `clientId` de cada `Subscription`/`Invoice` e
   copia os campos fiscais do `Client` para cada `Store` associada. Roda **após** a migration de
   expand e **antes** da de contract; é reexecutável (idempotente) e não é, em si, uma migration
   de schema.
3. **Contract**: uma migration final torna `storeId` obrigatório, remove `clientId` de
   `Subscription`/`Invoice`, remove `maxStores`/`clientId` de `Plan`/`Store` onde aplicável, e
   dropa as tabelas `clients` e `members` (ou o que delas sobrar após a extração de `Member` do
   escopo — ver item 6). **Só roda mediante autorização explícita do usuário** (Princípio VII da
   constituição), depois que o backfill tiver sido validado com uma contagem de registros
   (`Subscription`/`Invoice` migrados == total original).

**Rationale**: o spec (Assumptions) exige "sem exclusão direta de dados" para o histórico de
billing; a constituição do projeto (Princípio VII) exige autorização explícita antes de ações
irreversíveis. Uma migration única que já dropasse `Client` normalmente colapsaria os passos 1–3
num só commit, sem chance de validar o backfill antes do ponto de não-retorno.

**Alternatives considered**:
- *Migration única (drop direto)* — mais rápida, mas rejeitada: nenhuma janela para validar o
  backfill, viola Princípio VII e o "expand-contract" explícito no ADR/spec.
- *Manter `Client` como tabela órfã indefinidamente (soft-deprecate)* — rejeitada: contradiz
  FR-003 ("nenhuma tela do admin... como conceito de billing") e deixaria dívida técnica sem prazo
  de resolução; o ADR já decidiu eliminar `Client` por completo (não esvaziá-lo).

## 2. Backfill de `Subscription`/`Invoice` quando um Client legado tem mais de uma Store

**Decision**: Para cada `Client`, a Store de destino do backfill de `Subscription`/`Invoice`
históricas é a **primeira Store criada** (`ORDER BY createdAt ASC LIMIT 1`) associada àquele
Client. Antes de rodar o backfill em qualquer ambiente compartilhado, o script primeiro roda em
modo *dry-run* (relatório, sem escrever) contando quantos `Client` têm mais de uma `Store` — se o
número for zero (o esperado, por hipótese do ADR), o backfill é uma migração 1:1 trivial; se maior
que zero, a lista de casos é revisada manualmente com o usuário antes do backfill real escrever
qualquer linha.

**Rationale**: a Assumption do spec já classifica esse cenário como raro/a-validar; a regra
"primeira loja criada" é determinística, auditável e replica a leitura mais natural de "a loja que
originou a relação comercial" sem inventar um agrupador de faturamento novo (que o ADR
explicitamente rejeitou). O dry-run satisfaz a "Fase 0 — Descoberta" do plano de migração do ADR
sem bloquear o desenho desta fase.

**Alternatives considered**:
- *Duplicar a Subscription/Invoice para todas as Stores do Client* — rejeitada: infla artificialmente
  o histórico financeiro (uma fatura paga uma vez apareceria como paga em N lojas).
- *Bloquear a migration até confirmação manual caso a caso* — rejeitada como regra geral (adiciona
  fricção desnecessária no caso comum de 1 Store por Client); mantida apenas como fallback quando o
  dry-run encontrar múltiplas Stores.

**Resultado do dry-run** (T001/T002, `scripts/report-legacy-client-store-counts.ts`, banco de dev
local em 2026-07-18): 1 de 1 `Client` no banco de desenvolvimento tem mais de uma `Store` (2 lojas).
A regra "primeira loja criada" **será exercida** no backfill real — não é um caso hipotético. Caso
seja dado de desenvolvimento do próprio time, o backfill segue a regra normalmente; se ao rodar
contra um ambiente com dados de produção o resultado também for pequeno (poucos casos), a revisão
manual caso a caso listada pelo script continua sendo o fallback antes de autorizar T058.

## 3. Status de billing (ativa/suspensa) — reaproveitar `StoreStatus.BLOCKED`, não criar campo novo

**Decision**: A suspensão por inadimplência (FR-010) e a reativação (FR-011) reaproveitam o enum
`StoreStatus` e os use cases `BlockStoreUseCase`/`UnblockStoreUseCase` já existentes
(`modules/stores`), chamados pelo job de faturamento com um `actor` de sistema (ex.:
`"system:billing"`) e uma `action` de audit log distinta ("Suspensa por inadimplência" /
"Reativada após pagamento"). Nenhum campo novo de "status de billing" é adicionado ao `Store`.

**Rationale**: `StoreStatus` já tem `BLOCKED`, e `block()`/`unblock()` já existem, incluindo
registro em `StoreAuditEvent` — exatamente o padrão que o usuário pediu para manter ("sempre
mantenha o padrão de design de arquitetura que o backend... já usa"). Introduzir um segundo campo
de status paralelo duplicaria semântica e criaria a pergunta "qual status manda" toda vez que os
dois divergirem. O motivo real da suspensão (inadimplência vs. bloqueio manual por abuso) já fica
registrado no `action`/`actor` do audit log existente, que é granular o suficiente para as
Success Criteria do spec (SC-006 só exige que o status fique visível, não que exista um enum
dedicado).

**Alternatives considered**:
- *Novo campo `billingStatus: 'ACTIVE' | 'SUSPENDED'` em `Store`* — rejeitada: redundante com
  `BLOCKED`, adiciona uma segunda fonte de verdade para "a loja está operando", contra o Princípio
  VI (não introduzir abstração além do necessário).
- *Novo enum incluindo `CANCELED`* — rejeitada nesta fase porque cancelamento explícito de loja
  está fora de escopo (ver Clarifications do spec); `StoreStatus` não precisa de um valor para um
  fluxo que não existe ainda.

## 3.1. Correção pós-`/speckit-analyze`: `StoreDeploymentStatus` para FR-009

O relatório de `/speckit-analyze` (achado C1, CRITICAL) identificou que a decisão #3 acima (reaproveitar
`StoreStatus.BLOCKED`) cobre a suspensão por inadimplência, mas **não** cobre FR-009 (status de
*provisionamento*: `em provisionamento/ativa/falhou`, distinto do status de billing). Essa é uma
segunda dimensão de estado da loja (ciclo de vida de provisionamento vs. ciclo de vida de billing) —
confundi-las na decisão #3 foi o erro apontado pelo achado.

**Decision (corrigida)**: adicionar `Store.deploymentStatus: StoreDeploymentStatus`
(`PROVISIONING|ACTIVE|FAILED`, default `PROVISIONING`) como campo **novo e independente** de
`status: StoreStatus`. Toda loja nasce `PROVISIONING` (satisfaz o Acceptance Scenario 1 da US1).
Nesta fase, **nenhum consumidor** (nenhuma `vertical-api`) envia a confirmação que moveria o campo
para `ACTIVE`/`FAILED` — o campo existe e é exposto (`GET /v1/stores/:id`), mas fica em
`PROVISIONING` indefinidamente em qualquer ambiente sem uma vertical implementada, exatamente como
já documentado nas Assumptions do spec. Construir o endpoint/handler de confirmação em si (que
receberia `store.provisioned.v1`/`store.provisioning_failed.v1`) é adiado — não há consumidor real
para testá-lo nesta fase, e adicioná-lo sem um emissor real correria o risco de ficar sem cobertura
de teste de integração genuína. O campo, porém, **precisa existir agora** (é dado, não é
comportamento reativo) para que FR-009 não fique sem nenhum lastro de implementação.

**Rationale**: mantém a distinção correta entre as duas máquinas de estado (research #3 continua
válida para billing) sem introduzir uma dependência de um consumidor que não existe nesta fase —
resolve o achado C1 com a menor superfície de mudança possível.

## 4. `Plan.vertical` e `Plan.tier` como `String`, não como enum Prisma novo

**Decision**: `Plan.vertical` é um campo `String` (igual a `Store.vertical`, que já é `String` no
Prisma mesmo tendo um union type `StoreVertical` no TypeScript) e `Plan.tier` também é `String`
livre (ex.: `"prata"`, `"ouro"`), validado no domínio via Zod (`z.string().min(1)`), não um enum
Prisma.

**Rationale**: `Store.vertical` já segue esse padrão — um `String` no banco com um union type
`StoreVertical` garantindo tipagem na camada de aplicação (`modules/stores/domain/entities/store.entity.ts`).
Replicar o mesmo padrão em `Plan.vertical` evita ter dois mecanismos de tipagem de vertical
divergentes no mesmo schema. `tier` como `String` livre (em vez de enum fixo) segue a leitura do
ADR de que "cada vertical tem seu próprio catálogo de planos e preços" — os nomes de tier são
decisão de catálogo comercial por vertical, não um conjunto fixo e global (o exemplo
"Prata"/"Ouro" é só de uma vertical); um enum Prisma exigiria uma migration toda vez que uma nova
vertical quisesse nomear seus tiers de outro jeito.

**Alternatives considered**:
- *Enum Prisma `PlanVertical`* — rejeitada: seria a segunda representação de vertical no mesmo
  schema (a primeira é o `String` livre de `Store.vertical`), e um novo enum precisaria de
  migration a cada vertical nova do catálogo (`scripts/verticals.config.mjs` já lista 12).
- *Enum Prisma `PlanTier`* — rejeitada pelo mesmo motivo: tiers são por vertical, não globais.

## 5. Renomeação semântica de `Plan.maxStores` → `Plan.maxNegocios`

**Decision**: A coluna `max_stores`/campo `maxStores` de `Plan` é renomeada para
`max_negocios`/`maxNegocios` na migration de expand (mesmo valor, novo nome/semântica). O campo
`maxProducts` (não mencionado pelo ADR) permanece inalterado — está fora do escopo desta feature.

**Rationale**: no modelo antigo, `maxStores` significava "quantas lojas um Client pode ter"
(cenário de rede). No modelo novo (Store = Client), essa pergunta não existe mais — o eixo que
sobra é "quantas unidades operacionais (`Negócio`) a loja pode ter dentro da vertical", que é
exatamente o `maxNegocios` do ADR (seção 3.1). É o mesmo formato de dado (inteiro, limite superior
de contagem), então renomear é mais simples e correto que remover+recriar.

**Alternatives considered**:
- *Manter `maxStores` e adicionar `maxNegocios` como campo novo* — rejeitada: deixaria um campo
  morto (`maxStores` nunca mais lido, já que `Client`/multi-store por cliente deixa de existir),
  violando "sem código morto" (Princípio VI).

## 6. `Member`/`Organization`/`Negócio` (vertical-api) — fora do research desta fase

**Decision**: Este research não desenha o modelo `Organization`/`Negócio`/`Member` dentro de cada
`vertical-api` — está fora de escopo (ver spec, "Escopo desta fase"). A tabela `members` do schema
`platform` atual (hoje ligada a `Client`, usada para equipe/RBAC de loja via `StoreMember`) fica
fora do escopo de eliminação nesta fase: ela não é billing, e sua migração para dentro de cada
vertical é o assunto da Fase 4/5 do plano de migração do ADR (fora desta spec). A migration de
contract desta fase troca a FK de `Member.clientId` para `Member.storeId` **apenas se necessário
para não deixar uma FK órfã** após o drop de `Client` — decisão final de shape fica para o
`data-model.md` (Phase 1), não bloqueia esta pesquisa.

**Rationale**: manter o research focado no que o spec pede evita expandir silenciosamente o
escopo que o usuário explicitamente cortou ("não deve mexer dentro das verticais/api").

## 7. Publicação de eventos: estender `StoreEventsPublisher` (publish direto), não introduzir outbox

**Decision**: Os novos eventos assíncronos exigidos pelo spec (FR-007/FR-008/FR-010/FR-011 —
notificação de criação de loja com plano, troca de plano, suspensão, reativação) são publicados
estendendo `src/shared/infra/messaging/store-events.publisher.ts` (`StoreEventsPublisher`,
`RabbitBus` + `createCloudEvent`, publish direto), com novos métodos
`publishStorePlanChanged`/`publishStoreSuspended`/`publishStoreReactivated` e rotina de tipo/routing
key seguindo a mesma convenção de `STORE_CREATED_EVENT`/`STORE_UPDATED_EVENT`
(`citybox.store.<evento>.v1`).

**Rationale**: é o padrão que a própria `platform-api` já usa hoje para eventos de loja (confirmado
em `AGENTS.md` §9: "sem outbox nesta entrega") — segue diretamente a instrução do usuário de manter
o padrão arquitetural já em uso pelo backend. O pacote `@citybox/messaging` documenta outbox como
recomendado para o *core transacional* (`marketplace-api`), mas a decisão de arquitetura já tomada
nesta API especificamente foi publish direto; mudar isso agora seria uma reestruturação de
infraestrutura maior, não pedida pelo spec.

**Alternatives considered**:
- *Introduzir tabela `OutboxEvent` + relay nesta API* — rejeitada nesta fase: mais robusto a longo
  prazo, mas é uma mudança de infraestrutura própria, não solicitada pelo spec/ADR para esta
  entrega, e violaria a instrução explícita do usuário de manter o padrão já usado. Fica registrada
  como dívida técnica pré-existente da API (já documentada no `AGENTS.md` da própria
  `platform-api`), não desta feature.

## 7. Lição da sessão de `/speckit-implement`: `Store.clientId` continua obrigatório na Foundational

**Decision**: `Store.clientId` **permanece `NOT NULL`** durante toda a Foundational e as fases
US1–US4. A remoção do requisito de `Client` (FR-001/FR-003) é tratada como parte do escopo real de
T015 (rewrite de `CreateStoreUseCase`), não como um efeito colateral de tornar a coluna nullable
antecipadamente.

**Rationale**: uma tentativa de tornar `clientId` nullable já na Foundational (para "destravar" o
tipo de `StoreProps`) gerou ~15 erros de compilação em módulos não relacionados a esta feature
(`add-store-members-batch`, `manage-store-members`, `update-client-member-assignments`,
`list-available-members`, `update-store-settings`, rotas de bloqueio) — todos fazem
`clientRepository.findById(store.clientId)` para checagens de equipe/permissão hoje. Essas rotas
serão de qualquer forma reestruturadas na Phase 7 (T059/T060, consolidação em `/v1/members`), então
resolver o nullable ali, no momento certo, é mais seguro do que forçar uma mudança ampla e
prematura durante o Foundational. A migration `store_billing_client_id_optional` foi aplicada e
revertida (`store_billing_revert_client_id_required`) na mesma sessão — ambas ficam no histórico de
migrations (não foram apagadas manualmente, para não violar a regra de nunca editar/hand-craft
SQL de migration); o `database-reviewer` (T064) pode avaliar se vale a pena consolidá-las antes do
merge final.

**Alternatives considered**:
- *Tornar `clientId` nullable agora e corrigir os ~15 call sites imediatamente* — rejeitada nesta
  sessão: ampliaria o escopo da Foundational para dentro de módulos de equipe/membro que já têm um
  plano de reestruturação próprio (Phase 7), risco de retrabalho duplo.

**Follow-up (sessão de T013–T028)**: `Store.clientId`, `Subscription.clientId` e `Invoice.clientId`
foram tornados `String?` como parte do escopo real de T015 (migrations
`store_billing_store_client_id_nullable` e `store_billing_subscription_invoice_client_id_nullable`).
Todos os ~15 call sites foram corrigidos nesta mesma sessão — não adiados para a Phase 7 — via o
helper `requireStoreClientId(store, context)` (lança `StoreClientRequiredConflictError`, 409, quando
uma operação legada de equipe/membro é tentada numa Store sem `Client`) em
`apps/platform/api/src/modules/stores/application/utils/require-store-client-id.ts`, usado em
`add-store-members-batch`, `manage-store-members` e `update-client-member-assignments`;
`list-available-members` retorna `[]` graciosamente em vez de lançar. `Member.clientId` **não** foi
tornado nullable (deliberadamente fora de escopo — ver research.md #6, migração de `Member` para
`/v1/members` é Phase 7/T060).

## 8. Frontend: fusão Cliente+Loja como extensão da feature `stores`, não um novo módulo

**Decision**: A tela unificada (US2) é construída estendendo `features/stores` (rotas
`app/(dashboard)/lojas/[id]/page.tsx`, `store-detail/`) com as abas/seções hoje presentes em
`features/clients` (dados fiscais, billing). O menu perde a entrada "Clientes"
(`admin-navigation.ts`); a rota `/clientes` é removida. Nenhuma feature nova é criada — o código
hoje em `features/clients` que ainda for necessário (ex.: componentes de billing/fatura) é movido
para dentro de `features/stores`.

**Rationale**: segue a organização por feature (vertical slice) já documentada em
`apps/platform/admin/AGENTS.md` — uma "loja" já é uma feature; billing passa a ser um atributo dela,
não uma feature separada. Evita duas fontes de verdade de UI para a mesma entidade.

**Alternatives considered**:
- *Criar uma feature nova `store-billing`* — rejeitada: adiciona uma camada de indireção sem
  necessidade (YAGNI); a tela unificada é sobre UMA loja, cabe dentro da feature `stores` existente.
