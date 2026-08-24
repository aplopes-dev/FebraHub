# Citybox — Arquitetura Alvo de Tenancy, Billing e Verticais

> **Natureza deste documento.** Este é um documento **to-be** (estado-alvo): descreve como o Citybox **deveria** funcionar se estruturado da forma correta, discutida e validada em `ARQUITETURA-CLIENTES-LOJAS-PLANOS.md`. Ele **não descreve o estado atual do código** — para diagnóstico do estado atual, problemas concretos, e o raciocínio de opções que levou a este desenho, ver aquele documento (seções 2–4 e 13). Este documento assume a decisão já tomada e detalha **como o sistema opera** nesse modelo, como se ele já existisse.
>
> Convenção: verbos no presente descrevem o comportamento do sistema **no estado-alvo**, não o que existe hoje.

## Tabela de Conteúdos

- [1. Princípio central](#1-princípio-central)
- [2. Hierarquia de domínio](#2-hierarquia-de-domínio)
- [3. Responsabilidade por camada](#3-responsabilidade-por-camada)
- [4. Modelo de dados alvo](#4-modelo-de-dados-alvo)
- [5. Contratos de evento](#5-contratos-de-evento)
- [6. Fluxos principais](#6-fluxos-principais)
- [7. Autenticação e autorização](#7-autenticação-e-autorização)
- [8. O papel do Platform/Admin](#8-o-papel-do-platformadmin)
- [9. O que deixa de existir](#9-o-que-deixa-de-existir)
- [10. Nomenclatura e UI](#10-nomenclatura-e-ui)
- [11. Critérios de "arquitetura correta atingida"](#11-critérios-de-arquitetura-correta-atingida)
- [12. Referências](#12-referências)

## 1. Princípio central

**Cada camada é dona de um tipo de verdade, e nenhuma camada guarda cópia de escrita da verdade de outra:**

- O `platform-api` é dono da verdade **comercial**: quem paga, quanto, por qual plano, e se está em dia.
- Cada `vertical-api` é dona da verdade **operacional**: como o negócio daquela vertical funciona por dentro — sua estrutura organizacional, suas unidades físicas, sua equipe, seus dados de domínio (cardápio, prontuário, processo jurídico, o que for).
- O `admin-web` (Platform/Admin) não é dono de nada além do próprio processo de orquestração comercial — ele **comanda e observa**, não guarda estado operacional das verticais.
- O `ERP` é a superfície de uso do lojista dentro de cada vertical — fala com a `vertical-api`, não com o `platform-api` para nada operacional.

Isso é o que permite a consequência mais importante do desenho: **qualquer vertical pode, em algum momento, ser desacoplada e rodar como produto independente**, porque ela já não depende do `platform-api` para nada além de saber "este cliente está pagando, sim ou não, e qual o limite do plano dele".

## 2. Hierarquia de domínio

```
Platform
 └── Store                                    [platform-api — verdade comercial]
      │  vertical, plano, assinatura, status financeiro (ativa/suspensa)
      │
      └── (evento: store.created / store.suspended / store.plan_changed)
           │
           ▼
      Organization                            [<vertical>-api — verdade operacional]
       └── Negócio (1..N, limitado pelo plano)
            └── Member (equipe, com escopo a 1+ Negócios)
```

- **`Store`** é a unidade mínima de cobrança e a única entidade que existe no `platform-api`. Ela **é** o cliente pagante — não existe outra entidade acima dela representando "o cliente" (ver seção 9).
- **`Organization`** existe **dentro de cada vertical**, não no `platform-api`. Toda `Store` provisionada gera automaticamente 1 `Organization` na sua vertical — é uma relação 1:1 `Store ↔ Organization`, criada no momento do provisionamento.
- **`Negócio`** é a unidade operacional real dentro da `Organization` — o restaurante, a clínica, o escritório. Uma `Organization` pode ter de 1 a N `Negócios`, e **o número máximo é uma regra comercial do plano**, aplicada operacionalmente pela vertical (exemplo do domínio de clínica: plano Prata → `maxNegocios: 1`; plano Ouro → `maxNegocios: 3`).
- **`Member`** é a pessoa da equipe, vinculada à `Organization` da vertical (com escopo de acesso a um ou mais `Negócios` daquela organização, conforme seu papel).

Este desenho **substitui** a leitura anterior de "Platform → Organization → Store" (onde Organization ficava acima de Store) por "Platform → Store → (por vertical) Organization → Negócio" — a `Store` continua sendo o nó de tenancy visível para o `platform-api`; a `Organization`/`Negócio` é a decomposição interna que só a vertical enxerga.

## 3. Responsabilidade por camada

| Camada | Dona de | Nunca é dona de |
|---|---|---|
| `platform-api` | `Store` (identidade + vertical + status), `Plan`/`PlanPrice` (por vertical e tier, com `maxNegocios` e demais quotas), `Subscription`, `Invoice` | Estrutura organizacional, negócios, membros, dados de domínio de qualquer vertical |
| `<vertical>-api` (ex. `food-api`, `clinica-api`) | `Organization`, `Negócio`, `Member`, todo o domínio de negócio da vertical (cardápio, pedidos, prontuário, etc.) | Cobrança, plano, status financeiro — a vertical **consome** esse dado via evento, nunca o decide |
| `admin-web` (Platform/Admin) | Telas de gestão comercial: criar loja, escolher plano, financeiro, status de provisionamento, visão consolidada de equipe (read model) | Dados operacionais em si — toda escrita operacional é delegada à vertical via chamada |
| `ERP` | Superfície de uso do lojista, por vertical | Nada de comercial — plano/assinatura não aparece no ERP, aparece só no admin |
| `apps/workers` | Projeção de eventos em read models (ex. resumo de equipe agregado no `platform-api`, dashboards cross-vertical) | Nenhuma escrita de comando — só projeção assíncrona de leitura |

## 4. Modelo de dados alvo

### 4.1 `platform-api` (schema `platform`)

```
Store {
  id, slug, tradeName, vertical, status (ativa|suspensa|cancelada|em_provisionamento),
  deploymentStatus (provisioning|active|failed),
  document, personType, responsibleName, endereço fiscal   // absorvido do antigo Client
}

Plan {
  id, code, vertical, tier (ex: "prata", "ouro"),
  maxNegocios, maxUsers, status
}

PlanPrice { planId, cycle (MONTHLY|YEARLY), priceCents, stripePriceId }

Subscription { storeId, planPriceId, cycle, status, currentPeriodStart/End, stripeSubscriptionId }

Invoice { subscriptionId, storeId, amountCents, status, dueDate, periodStart/End }
```

Não existe mais `Client` como entidade de billing. Não existe `maxStores` (não faz sentido — cada `Store` já é uma assinatura própria). Se, na prática, surgir necessidade real de consolidar faturamento de um dono com múltiplas `Store`s (validada por dado real, não suposição — ver documento anterior, seção 10, Fase 0), isso é resolvido por um agrupador fino e opcional de faturamento, nunca por uma entidade que volte a carregar plano/assinatura própria.

### 4.2 `<vertical>-api` (exemplo: `clinica-api`)

```
Organization {
  id, storeId (FK lógica — vem do evento, não é FK de banco entre schemas),
  vertical, planSnapshot { tier, maxNegocios, maxUsers },   // cache local, atualizado por evento
  status (ativa|suspensa)
}

Negocio {
  id, organizationId (FK), nome, endereço, dados específicos do domínio
}

Member {
  id, organizationId (FK), negocioIds (escopo de acesso), keycloakSub,
  role (catálogo específico da vertical), permissions, hasPassword,
  disabledAt, provisionalExpiresAt
}
```

`planSnapshot` é a peça-chave que evita chamada síncrona da vertical ao `platform-api` toda vez que alguém tenta criar um `Negócio` ou convidar um `Member` — a vertical valida quota contra o snapshot local, atualizado sempre que `platform-api` emite um evento de mudança de plano.

## 5. Contratos de evento

Canal único (RabbitMQ, outbox no `platform-api`), consumidos por cada `vertical-api` (diretamente ou via `apps/workers`, conforme o caso):

| Evento | Emissor | Consumidor | Payload essencial |
|---|---|---|---|
| `store.created.v1` | `platform-api` | `vertical-api` | `storeId`, `vertical`, `plan: { tier, maxNegocios, maxUsers }`, `owner: { nome, email }` |
| `store.plan_changed.v1` | `platform-api` | `vertical-api` | `storeId`, `plan: { tier, maxNegocios, maxUsers }` |
| `store.suspended.v1` | `platform-api` | `vertical-api` | `storeId`, `reason` |
| `store.reactivated.v1` | `platform-api` | `vertical-api` | `storeId` |
| `store.provisioned.v1` | `vertical-api` | `platform-api` | `storeId`, `organizationId` |
| `store.provisioning_failed.v1` | `vertical-api` | `platform-api` | `storeId`, `reason` |
| `member.created.v1` / `.updated.v1` / `.disabled.v1` | `vertical-api` | `platform-api` (via `apps/workers`) | `organizationId`, `memberId`, dados de resumo (nome, role, status) — só para o read model, nunca fonte de verdade |

Todos os eventos são idempotentes (mesma garantia que já existe hoje no outbox do `platform-api`), e cada `vertical-api` trata reentrega sem efeito colateral duplicado.

## 6. Fluxos principais

### 6.1 Criar loja, atribuir plano, provisionar automaticamente

1. Operador no `admin-web` cria a `Store`: nome, vertical, plano, dados do responsável.
2. `platform-api` grava `Store` + `Subscription`, `deploymentStatus = provisioning`.
3. Emite `store.created.v1` com o snapshot do plano.
4. A `vertical-api` correspondente consome o evento: cria `Organization` (1:1 com a `Store`), cria o primeiro `Negócio`, cria o `Member` owner (convite + senha provisória via Keycloak), roda o seed padrão do domínio (ex.: cardápio-modelo em `food-api`).
5. `vertical-api` emite `store.provisioned.v1` (ou `.failed.v1` com o motivo, se algo falhar — ex. erro no seed).
6. `platform-api` atualiza `deploymentStatus = active` (ou `failed`, exibindo o motivo). O `admin-web` acompanha esse status em tempo real (polling curto ou websocket) e libera a tela de "pronto para uso" só quando `active`.

### 6.2 Upgrade/downgrade de plano

1. Operador troca o plano da `Store` no admin (ex. Prata → Ouro).
2. `platform-api` atualiza a `Subscription` in-place (mesma lógica já validada hoje).
3. Emite `store.plan_changed.v1` com o novo snapshot.
4. `vertical-api` atualiza `Organization.planSnapshot` localmente. Se o novo limite for **menor** que o uso atual (ex. downgrade de Ouro→Prata com 3 negócios ativos), a vertical não desfaz nada automaticamente — sinaliza um estado de "acima da quota" e bloqueia **criação de novos** `Negócio`/`Member` até o operador resolver manualmente (nunca deleção automática de dado operacional por causa de billing).

### 6.3 Inadimplência → suspensão → reativação

1. Job de faturamento do `platform-api` marca `Invoice` como `PAST_DUE` (regra de tolerância/grace period definida no `Plan` ou globalmente).
2. `Subscription.status` muda, `Store.status = suspensa`.
3. `platform-api` emite `store.suspended.v1`.
4. `vertical-api` marca `Organization.status = suspensa` **localmente**. O guard de autenticação da vertical (o mesmo que valida JWT/permissions em toda request) passa a negar acesso a qualquer rota daquela `Organization` — checagem local, sem dependência síncrona do `platform-api` no caminho quente de autenticação.
5. Pagamento regularizado → `platform-api` emite `store.reactivated.v1` → vertical libera o acesso de volta, sem perda de dado (nada foi apagado durante a suspensão).

### 6.4 Adicionar um novo negócio (filial) dentro do limite do plano

1. Usuário da loja (dono/gerente) pede, dentro do ERP/vertical, para adicionar um novo `Negócio` à sua `Organization`.
2. `vertical-api` valida contra `Organization.planSnapshot.maxNegocios` **localmente** (sem chamar o `platform-api`).
3. Se dentro do limite: cria o `Negócio`. Se no limite: bloqueia e orienta o usuário a fazer upgrade de plano (call-to-action que leva de volta ao fluxo comercial do admin/self-service).

### 6.5 Gestão de membros pelo Platform/Admin

**Escrita** (criar, editar, desativar membro): o `admin-web`/`platform-api` faz uma **chamada síncrona direta** à `vertical-api` dona daquele `Organization`, autenticada como serviço (credencial machine-to-machine dedicada, análoga à já usada para a Keycloak Admin API). A vertical processa o comando, valida (ex. quota `maxUsers`), cria/atualiza o `Member` (usando a lógica compartilhada de provisionamento Keycloak — ver seção 7) e responde de forma síncrona, permitindo feedback imediato na tela do admin.

**Leitura** (telas consolidadas do admin, ex. "equipe de todas as lojas"): cada `vertical-api` emite `member.*.v1` ao mudar um membro; um worker projeta um read model (`MemberSummary`) dentro do `platform-api`, usado **só para listar/consultar no admin**, nunca como fonte de verdade nem alvo de escrita. Este read model **não é consultado pelo ERP** — a descoberta de acesso do próprio usuário logado segue o fluxo direto-à-vertical descrito na seção 7.1, que é mais rápido e sempre consistente (sem a defasagem eventual deste read model).

### 6.6 Desacoplar uma vertical em produto standalone

O desenho torna isso possível porque a vertical, no dia a dia, só depende do `platform-api` para dois sinais: **"este plano permite X negócios/usuários"** e **"esta organização está paga ou suspensa"**. Para extrair uma vertical como produto independente, é necessário apenas:

1. Substituir o consumo de `store.created/plan_changed/suspended.v1` por um equivalente vindo do sistema de billing do novo produto standalone (ou manter o Citybox como provedor de billing via webhook, se for um spin-off comercial, não uma cisão total).
2. Levar consigo o package compartilhado de provisionamento Keycloak (seção 7) ou substituí-lo por autenticação própria.
3. Nenhuma migração de dado de `Organization`/`Negócio`/`Member` é necessária — eles já vivem inteiramente no schema da vertical.

## 7. Autenticação e autorização

- Keycloak continua único (SSO), realm compartilhado — a autenticação de **quem é o usuário** não muda.
- A lógica de **provisionamento** de usuário (criar `keycloakSub`, senha provisória, convite, desabilitar) é extraída para uma função compartilhada em `packages/nest-common`, consumida por toda `vertical-api` — evitando reimplementar isso 12 vezes.
- A checagem de **o que o usuário pode fazer** (permissions) e **se a organização está ativa** (status financeiro) é sempre local à vertical que recebe a request — nenhuma vertical faz uma chamada síncrona ao `platform-api` para validar acesso em request quente.
- O catálogo de `role` por domínio (ex. papéis de food: gerente/caixa/garçom/cozinha) vive dentro da própria `vertical-api`, não centralizado — cada vertical é dona do vocabulário de papéis do seu negócio.

### 7.1 Fluxo de login e descoberta de lojas acessíveis (ERP) — via role do Keycloak, direto na vertical

O login em si (redirect ao Keycloak, troca de `code` por tokens, cookies httpOnly) não muda — continua sendo responsabilidade só do `apps/erp`/Keycloak.

A descoberta de "quais lojas este usuário pode acessar" **não passa pelo `platform-api`** — usa a role de vertical que já existe no JWT (`resource_access['citybox-backoffice'].roles`, ex. `vertical.food.view`) como sinal de **quais verticais vale a pena consultar**, e chama cada `vertical-api` diretamente:

1. ERP extrai do JWT a lista de roles `vertical.<slug>.view` presentes.
2. Para cada vertical indicada, chama em paralelo `GET /v1/members/me` na respectiva `vertical-api` (endpoint com contrato idêntico em todas as verticais — vive como interface compartilhada em `packages/nest-common`/`packages/contracts`, para não ser reimplementado 12 vezes com formatos diferentes).
3. Cada `vertical-api` responde com as organizações/negócios em que aquele `keycloakSub` é `Member` **ali dentro** (nome, slug, status ativo/suspenso — já disponível localmente, sem chamada extra a nada).
4. ERP agrega as respostas de todas as verticais consultadas e monta o seletor de loja.
5. Falha de uma vertical não derruba o login: as chamadas são independentes (`Promise.allSettled` ou equivalente) — se uma vertical estiver fora do ar, suas lojas simplesmente não aparecem naquele momento, com um aviso explícito na UI (nunca falha silenciosa).

O `platform-api` fica **fora do caminho quente de login/descoberta de acesso** — isso reforça ainda mais o objetivo de desacoplamento (seção 6.6): uma vertical extraída como produto standalone não depende do `platform-api` nem para login nem para saber quais organizações o usuário acessa, só para o sinal de billing (seção 6.3).

O read model `MemberSummary` (seção 6.5) **continua existindo**, mas seu propósito passa a ser só o **admin** (telas consolidadas cross-vertical de equipe/uso) — deixa de ser consultado pelo ERP.

**Ponto de atenção crítico:** a role `vertical.<slug>.view` no Keycloak e o `Member` na vertical são dois dados em dois lugares — nada os mantém sincronizados por si só. Se um for criado/removido sem o outro, o usuário fica com acesso "fantasma" (role sem `Member` real) ou invisível (`Member` sem role, vertical nunca consultada). A função compartilhada de provisionamento (seção 7, item 2) precisa criar/remover **os dois atomicamente** — nunca um sem o outro.

### 7.2 Validação de acesso ao chamar a vertical — sem round-trip ao platform-api

Hoje, o proxy do ERP faz uma segunda chamada síncrona ao `platform-api` (revalidando a lista de lojas) antes de repassar a request para a `vertical-api`. No modelo alvo, essa segunda chamada **deixa de existir**, porque a vertical passa a validar acesso **localmente**, contra o seu próprio `Member`:

```
ERP → Keycloak                                            (login — sem mudança)
ERP → platform-api  GET /v1/users/me/stores                (sem mudança visível — fonte interna vira MemberSummary)
ERP → vertical-api  (proxy: JWT + X-Store-Id)               (sem mudança de contrato)
vertical-api: valida JWT localmente (JWKS)                  (sem mudança)
vertical-api: busca Member local por (keycloakSub, organizationId)   ← substitui a 2ª chamada ao platform-api
vertical-api: aplica role/permissions reais do Member                ← autorização deixa de depender só das roles genéricas do Keycloak
vertical-api: confere Organization.status (suspensa/ativa)            ← enforcement de billing, sem chamada extra
```

`storeId → organizationId` é resolvido localmente porque a `Organization` já guarda essa referência desde o provisionamento (seção 6.1). O resultado prático: a vertical fica **mais rápida** (sem round-trip síncrono) e **mais correta** (autorização passa a usar o `role`/`permissions` reais do `Member`, em vez de depender só de roles genéricas do Keycloak, que é uma lacuna do fluxo atual).

## 8. O papel do Platform/Admin

No estado-alvo, o `admin-web` é um **console de orquestração comercial**, não um sistema operacional das verticais:

- Cria/edita `Store`, atribui plano, acompanha status de provisionamento.
- Gerencia billing: faturas, inadimplência, upgrade/downgrade, cancelamento.
- Comanda (via chamada síncrona) criação/edição de membros em qualquer vertical, sem duplicar os dados.
- Consulta read models agregados (equipe, uso, KPIs) projetados por `apps/workers` a partir dos eventos de cada vertical — nunca lê diretamente o banco de uma vertical.
- Não conhece — e não precisa conhecer — o cardápio de uma loja de food, o prontuário de uma clínica, ou qualquer dado de domínio de nenhuma vertical.

## 9. O que deixa de existir

- **`Client` como entidade de billing** — não há mais uma "pessoa" acima da "empresa" carregando plano/assinatura; a `Store` é o cliente pagante.
- **`maxStores` por conta** — cada `Store` é uma assinatura própria; quota de unidades de negócio passa a ser `maxNegocios`, dentro da vertical, por `Organization`.
- **`Plan` agnóstico de vertical** — todo plano tem `vertical` e `tier`.
- **`verticals.allowed` hardcoded no código** — a vertical de uma `Store` é um dado real (`Store.vertical`), não uma lista fixa.
- **Um segundo modelo de `Organization` cross-vertical e dessincronizado** (o achado do documento anterior, seção 4) — no estado-alvo, `Organization` só existe dentro de cada vertical, escopada a ela; não há mais um modelo de tenancy paralelo e ambíguo servindo autenticação do marketplace/realtime-gateway com dado próprio desconectado do `platform-api`.
- **Membros geridos só pelo `platform-api`** — passam a ser dados operacionais de cada vertical, geridos pelo admin por orquestração, não por posse direta de dado.

## 10. Nomenclatura e UI

- No `admin-web`, a tela hoje chamada "Clientes" passa a operar diretamente sobre `Store` — é a lista de lojas pagantes, com plano e status financeiro visíveis ali mesmo (não em uma entidade separada).
- "Organização" e "Negócio" são termos internos de cada vertical — não aparecem como conceito comercial no admin; aparecem no ERP, dentro da vertical, como a estrutura real do negócio do lojista (ex. "Minha Clínica" com 3 unidades).
- "Equipe"/"Membros" aparece tanto no ERP (gestão do dia a dia, direto na vertical) quanto no admin (visão consolidada read-only + ação de comando quando necessário).

## 11. Critérios de "arquitetura correta atingida"

O desenho está implementado corretamente quando todas as afirmações abaixo são verdadeiras:

- [ ] Não existe nenhuma tabela `Client` com `Subscription`/`Invoice` associada — billing referencia só `storeId`.
- [ ] Todo `Plan` tem `vertical` e `tier`, com preço podendo variar livremente entre verticais.
- [ ] Nenhuma `vertical-api` faz chamada síncrona ao `platform-api` para decidir se libera acesso (checagem de suspensão é local, via evento consumido previamente).
- [ ] Nenhuma `vertical-api` faz chamada síncrona ao `platform-api` para validar quota de negócios/usuários (validação contra snapshot local do plano).
- [ ] Existe exatamente uma implementação de "provisionamento de usuário Keycloak", compartilhada, não duplicada por vertical.
- [ ] O `admin-web` consegue criar uma loja, atribuir plano e ver o provisionamento concluir, sem intervenção manual em nenhuma `vertical-api`.
- [ ] O `admin-web` consegue gerenciar (criar/editar/desativar) um membro de qualquer vertical sem guardar cópia de escrita desse dado.
- [ ] O modelo `Organization` hoje presente em `marketplace-api`/`realtime-gateway` foi aposentado ou redesenhado para ser escopado por vertical, coerente com este documento — não existe mais como terceiro modelo de tenancy paralelo.

## 12. Referências

- `ARQUITETURA-CLIENTES-LOJAS-PLANOS.md` — diagnóstico do estado atual, opções consideradas, riscos e plano de migração em fases.
- `ARQUITETURA-PERMISSOES-CASL.md` — desenho de permissões granulares (CASL) por vertical, complementar à seção 7 deste documento.
- `CITYBOX-VISAO-COMPLETA.md` — visão de produto/negócio; a seção 12 daquele documento ("Multi-tenancy: Plataforma → Organização → Loja") deve ser revisada para refletir a hierarquia revisada aqui (seção 2) quando esta decisão for confirmada.
