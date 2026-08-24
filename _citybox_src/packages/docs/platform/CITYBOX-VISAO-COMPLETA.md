# Citybox Local Commerce — Documento de Visão Completa

> **Propósito deste documento.** Este é o documento mestre do projeto **Citybox**:
> uma visão de ponta a ponta — comercial, de produto, gerencial e técnica — para que
> **toda a equipe** (diretoria, gestão, comercial, produto, engenharia, operações e
> suporte) tenha a mesma compreensão do que é o Citybox, em que estágio está e para
> onde vai.
>
> **Como ler.** As Partes I–II são de negócio/produto (acessíveis a qualquer área);
> as Partes III–IV são técnicas. O Glossário (Parte VI) define todos os termos.
>
> **Sobre o estado das coisas.** O Citybox está em **desenvolvimento ativo (fase de
> piloto)**. Para evitar mal-entendidos, cada funcionalidade é marcada com seu estágio
> real:
> - 🟢 **Implementado** — existe e funciona com dados reais.
> - 🟡 **Piloto/Parcial** — existe parcialmente, ou a interface está pronta mas usa dados de demonstração.
> - 🟣 **Scaffold** — a estrutura/“esqueleto” existe, mas o domínio ainda não foi implementado.
> - 🔵 **Planejado** — está no roadmap, ainda não construído.
> - 🔴 **A refazer** — existe como código legado mas será reescrito; não deve ser adotado.
>
> Valores comerciais citados (preços, percentuais, datas de roadmap) são **exemplos
> ilustrativos / hipóteses de blueprint**, não política comercial fechada — devem ser
> confirmados com a diretoria comercial.
>
> **Última atualização:** 2026-06-29. Fonte de verdade técnica: os arquivos `AGENTS.md`
> em cada módulo do repositório (ver Parte VII).

---

## Índice

- **Parte I — Visão de Negócio**
  - 1. O que é o Citybox (resumo executivo)
  - 2. O problema de mercado
  - 3. O duplo modelo: SaaS B2B + Marketplace B2C
  - 4. Modelo de monetização
  - 5. Personas e atores
  - 6. O piloto de Ilhéus e a ambição municipal
  - 7. As 12 verticais de negócio
  - 8. Diferenciais competitivos
- **Parte II — Produto**
  - 9. Funcionalidades por área (e seu estágio)
  - 10. Roadmap de evolução
- **Parte III — Arquitetura Técnica**
  - 11. Visão geral da plataforma
  - 12. Multi-tenancy (Plataforma → Organização → Loja)
  - 13. Mapa de serviços e portas
  - 14. Autenticação e autorização
  - 15. Eventos, mensageria e tempo real
  - 16. Fluxos principais (pedido, publicação de oferta, pagamento)
  - 17. Camada de dados
- **Parte IV — Aplicações e Componentes**
  - 18. ERP (backoffice do lojista)
  - 19. Verticais (food, varejo, clínica)
  - 20. Marketplace, plataforma e serviços
  - 21. Design system, packages e infraestrutura
- **Parte V — Gestão**
  - 22. Estado de maturidade consolidado
  - 23. Riscos e pontos de atenção
- **Parte VI — Glossário**
- **Parte VII — Referências internas**

---

# PARTE I — VISÃO DE NEGÓCIO

## 1. O que é o Citybox (resumo executivo)

O **Citybox Local Commerce** é uma **plataforma municipal de comércio digital**. Ele une, num só ecossistema, duas coisas que hoje vivem separadas no mercado:

1. **Um ERP (sistema de gestão) especializado por segmento** — que o lojista usa para tocar o negócio (catálogo, pedidos, caixa, equipe, financeiro, fiscal); e
2. **Um marketplace do município** — um aplicativo onde o consumidor descobre lojas locais e compra de **vários lojistas diferentes num único carrinho**.

A ideia central: o lojista **cadastra seu produto uma única vez** no ERP e, com isso, **passa a vender em múltiplos canais** (loja física/PDV, marketplace municipal, delivery próprio, e — no roadmap — integrações como iFood/Rappi), sem precisar manter cada canal manualmente.

O projeto começa **focado em uma única cidade — Ilhéus (BA)** — como piloto, com a ambição de se expandir para outros municípios.

**Para quem este produto existe:**
- **Lojistas locais** (restaurantes, varejos, salões, clínicas etc.) — ganham um sistema feito para o seu tipo de negócio + alcance digital.
- **Consumidores da cidade** — ganham um app único para comprar do comércio local.
- **A operação Citybox** — opera a plataforma, faz o onboarding das lojas e monetiza o ecossistema.

## 2. O problema de mercado

O pequeno e médio lojista local enfrenta um dilema:

- **ERPs genéricos** (ex.: sistemas de gestão tradicionais) não têm marketplace e não falam a língua do segmento — um restaurante e um salão usam a mesma tela “genérica” que não atende bem nenhum dos dois.
- **Marketplaces nacionais** (ex.: apps de delivery) dão alcance, mas são caros, colocam o lojista para competir com o Brasil inteiro e não resolvem a gestão interna da loja.
- **Soluções internacionais** de PDV/gestão são fortes em operação, mas não têm marketplace municipal nem aderência fiscal/local brasileira.

O Citybox se posiciona **no meio**: ERP especializado **+** marketplace local **+** pagamentos e repasses integrados, com **foco municipal** (mais fácil de vender, operar e gerar resultado para o lojista da cidade).

## 3. O duplo modelo: SaaS B2B + Marketplace B2C

### 3.1 SaaS B2B — o ERP do lojista
- Cada lojista usa o **backoffice ERP** (aplicação web), que é um **“shell” multi-vertical**: a mesma base de aplicação carrega o módulo certo conforme o segmento do lojista (Food, Varejo, Clínica…).
- Toda a operação é **escopada pela loja ativa** (o lojista pode ter mais de uma loja).
- Modelo de receita típico: **assinatura recorrente** (SaaS).

### 3.2 Marketplace B2C — o app do consumidor
- Um **app/canal de consumidor** onde a pessoa descobre lojas locais, navega por produtos de várias verticais e **monta um carrinho único com itens de lojas diferentes**.
- O pedido único do consumidor é internamente quebrado em **subpedidos por loja** (cada loja recebe e processa a sua parte).
- O app nativo (iOS/Android) é **planejado (🔵)**; o **backend** que o sustenta já existe em boa parte (🟡).

> **Princípio de arquitetura importante:** o app do consumidor **nunca** fala direto com o núcleo do sistema. Ele fala com uma camada intermediária otimizada para leitura (o **BFF** — *Backend For Frontend*), que entrega as telas rápidas e protege o núcleo.

## 4. Modelo de monetização

O Citybox tem potencial de receita em **três frentes** (a “banqueta de três pernas”). Os valores abaixo são **exemplos ilustrativos** — a política definitiva é decisão comercial:

| Fonte de receita | Como funciona | Exemplo ilustrativo |
| ---------------- | ------------- | ------------------- |
| **Assinatura SaaS (ERP)** | Valor fixo por loja/mês pelo uso do sistema de gestão | mensalidade por loja, variável por plano/vertical |
| **Comissão de marketplace** | Percentual sobre pedidos feitos pelo canal marketplace/delivery | comissão por pedido (varia por canal: marketplace ≠ PDV presencial) |
| **Taxa de pagamento (split)** | Percentual da transação financeira processada | taxa do meio de pagamento, repassada/embutida |

### 4.1 Repasse e split (conceito)
- Quando um consumidor paga, o valor é **dividido automaticamente** (*split*) entre **a loja** e **a plataforma** (comissão + taxas).
- A parte líquida da loja é **repassada** (settlement) em uma data combinada (ex.: D+X).
- **Estado atual:** o serviço de pagamentos existe como código, mas está marcado para **reescrita completa (🔴)** e **não está integrado/validado em produção**. Portanto, split/settlement automáticos são hoje **capacidade de domínio planejada**, não um fluxo em produção. Ver §20.3.

## 5. Personas e atores

| Persona | Quem é | Onde atua | O que faz |
| ------- | ------ | --------- | --------- |
| **Operador da Plataforma (Citybox)** | Equipe interna (operações, comercial, suporte) | Admin da Plataforma (web) + Platform API | Onboarding de clientes/lojas, planos e cobrança, auditoria, monitoramento, integrações |
| **Lojista (Merchant)** | Dono/gerente da loja | ERP (backoffice) + API da vertical | Catálogo, pedidos, caixa/PDV, equipe, financeiro, fiscal, fidelidade |
| **Equipe da Loja** | Vendedor, caixa, cozinheiro, entregador | ERP + dispositivos (KDS, impressoras) | Operação do dia a dia conforme o seu papel (RBAC) |
| **Consumidor Final (Buyer)** | Morador da cidade | App/Marketplace (via BFF) | Descobre lojas, monta carrinho único, paga, acompanha pedido |

## 6. O piloto de Ilhéus e a ambição municipal

- O Citybox é, de propósito, **single-city** no piloto: **Ilhéus (BA)**.
- A lógica: partir da **realidade de um município** (“como conectar os restaurantes, varejos e serviços de Ilhéus num só marketplace local?”) reduz complexidade e aumenta o **encaixe com o mercado** (o lojista enxerga valor imediato em estar no marketplace **da sua cidade**).
- **Hierarquia de dados:** Plataforma (global Citybox) → Organização (a empresa/CNPJ do lojista) → Loja (o ponto de operação). O município é o **tenant** (inquilino de dados isolado).
- **Escala futura (🔵):** cada nova cidade entra como um novo *tenant* de dados, enquanto a camada de Plataforma (identidade, planos, cobrança) permanece **central e compartilhada**.

## 7. As 12 verticais de negócio

O Citybox é desenhado para suportar **12 segmentos** no mesmo shell, cada um com regras e módulos próprios. A lista canônica:

| # | Vertical | Atende | Estado no produto |
| - | -------- | ------ | ----------------- |
| 1 | **Food** (🍔) | Restaurantes, lanchonetes, cafés, dark kitchens | 🟢🟡 **Piloto ativo** — backend de cardápio e UI mais maduros |
| 2 | **Market / Varejo** (🛒) | Supermercados, mercearias, lojas | 🟡 UI de configuração pronta (mock); sem backend próprio |
| 3 | **Beauty** (💇) | Salões, barbearias, estética | 🔵 Planejado |
| 4 | **Clinic / Clínica** (🏥) | Consultórios, clínicas | 🟡 Configurações na UI + 🟣 backend scaffold |
| 5 | **Legal** (⚖️) | Escritórios de advocacia | 🔵 Planejado |
| 6 | **Realty** (🏡) | Imobiliárias | 🔵 Planejado |
| 7 | **Hospitality** (🏨) | Hotéis, pousadas | 🔵 Planejado |
| 8 | **Education** (📚) | Cursos, escolas | 🔵 Planejado |
| 9 | **Subscriptions** (🔄) | Assinaturas, clubes | 🔵 Planejado |
| 10 | **Events** (🎪) | Casas de show, espaços de evento | 🔵 Planejado |
| 11 | **Rental** (🚗) | Locação de veículos/equipamentos | 🔵 Planejado |
| 12 | **Services** (🔧) | Oficinas, serviços técnicos | 🔵 Planejado |

### 7.1 Dois “eixos” de verticais
As verticais se organizam, conceitualmente, em dois padrões de operação:

- **Eixo Produto/Pedido** (Food, Market, Events): cliente faz pedido → loja produz/separa → entrega/retirada → fiscal. Módulos: catálogo, PDV, KDS, estoque, entrega, fiscal.
- **Eixo Serviço/Agenda** (Beauty, Clinic, Services, Hospitality, Rental, Education): cliente agenda → profissional/recurso atende → fechamento → fidelidade. Módulos: agenda/slots, prontuário, fidelidade.

Cada vertical ativa apenas as **capacidades** que fazem sentido para ela (catálogo, agenda, PDV, KDS, fiscal, entrega…), via configuração de manifesto.

## 8. Diferenciais competitivos

Comparado a líderes de gestão/PDV (Toast, Square, Lightspeed) e ERPs/marketplaces (Linx, Bling, Odoo, apps de delivery):

1. **Marketplace municipal nativo** — o lojista publica **uma vez** e aparece em múltiplos canais, sem integração manual por canal. *(Este é o diferencial central.)*
2. **ERP especializado por vertical** — UI e fluxo desenhados para cada segmento, em vez de uma tela genérica.
3. **Pagamentos + split + repasse integrados ponta a ponta** (capacidade de domínio; em reconstrução).
4. **Foco municipal** — menos complexidade, mais aderência e convencimento local; modelo de crescimento mais viável para PME do que competir nacionalmente.
5. **Operação unificada** — um pedido afeta estoque, fiscal e financeiro de forma coerente (objetivo de “fonte única da verdade”).
6. **Multi-vertical no mesmo produto** — o mesmo shell atende restaurante, salão e clínica.

---

# PARTE II — PRODUTO

## 9. Funcionalidades por área (e seu estágio)

> Legenda: 🟢 implementado · 🟡 piloto/parcial/mock · 🟣 scaffold · 🔵 planejado · 🔴 a refazer.

### 9.1 Catálogo / Produtos
- 🟢 **Cardápio e itens (Food)** — CRUD real de categorias, itens, modificadores, com **upload de imagens**, status (ativo/pausado/esgotado) e **montagem de cardápios** (seções e entradas, com reordenação por arrastar-e-soltar).
- 🟢 **Busca** — motor de busca (Typesense) com texto completo, facetas e autocomplete, alimentando o marketplace.
- 🟡 **Estoque** — modelagem básica; reserva/trava em checkout ainda evoluindo.

### 9.2 PDV / Caixa
- 🟡 **Frente de caixa (Food)** — interface de PDV pronta (categorias, grade de produtos, carrinho, customização, pagamento) operando com **dados de demonstração**; estado completo, pronto para plugar backend.
- 🔵 **PDV offline-first, sessão de caixa, NFC-e, impressoras** — planejados.

### 9.3 Pedidos / Operação
- 🟡 **Gestão de pedidos (Food)** — telas com grade/filtros (mock).
- 🟢 **Subpedidos** — conceito implementado no núcleo: 1 pedido do marketplace = N subpedidos (um por loja).
- 🔵 **KDS (painel de cozinha) e comandas** — previstos; ainda não implementados.
- 🔵 **Notificações transacionais e rastreamento em tempo real** — planejados (a infraestrutura de tempo real já existe — ver §15).

### 9.4 Fidelidade / CRM
- 🟡 **Histórico de cliente (Food)** — básico.
- 🔵 **Pontos, cashback, tiers, clubes de assinatura, segmentação** — planejados.

### 9.5 Financeiro / Repasse
- 🔴/🔵 **Split, settlement, recebíveis, antecipação** — capacidade de domínio existente como referência, mas o serviço de pagamentos **será reescrito**; não está em produção. Ver §20.3.

### 9.6 Fiscal
- 🔵 **NF-e / NFC-e / NFS-e** (via provedor fiscal) — planejados.

### 9.7 Entrega / Frete
- 🟡 **Zonas de entrega (Food/Varejo)** — UI com mapa, em estado de demonstração.
- 🔵 **Integrações de delivery (iFood/Rappi), rastreamento, cupom de frete** — planejados.

### 9.8 Equipe / RBAC
- 🟢 **Gestão de equipe da loja** — CRUD real de membros (criar, editar, remover, resetar senha), com **papéis e permissões** vindos da plataforma; compartilhado entre as verticais (Food, Varejo, Clínica). Autenticação via Keycloak (SSO).

### 9.9 Tempo real / Notificações
- 🟡 **Gateway de tempo real (WebSocket)** — existe e faz a ponte de eventos do sistema para clientes (app, ERP, KDS), com salas por loja.
- 🔵 **Casos de uso de ponta** (push de status ao consumidor, alertas operacionais, WhatsApp transacional) — planejados.

## 10. Roadmap de evolução

> As fases e prazos abaixo refletem o **blueprint de produto** e são **indicativos** — devem ser confirmados pela gestão de produto.

- **MVP (Consolidação)** — base já em pé: autenticação, shell multi-vertical, RBAC/equipe; em finalização: catálogo real e pedidos.
- **v1 (Operação)** — o lojista passa a “operar de verdade”: dashboard operacional, configurações da loja, agenda/slots (serviços), CRM + fidelidade, PDV offline-first, fiscal (NFC-e/NF-e), KDS + dispositivos, estoque.
- **v2 (Escala)** — relatórios e analytics por domínio (ex.: *menu engineering* no Food), financeiro/DRE, promoções, conciliação bancária, fidelidade avançada, vertical Varejo completa e novas verticais.
- **Ambição (v3)** — app consumidor nativo, expansão para outras cidades, e oferta da plataforma a outros municípios.

**Leitura de priorização:** o MVP é curto (consolidação do que já existe); a **v1 é o salto de valor** (lojista opera ponta a ponta); a **v2 é escala e diferenciação** (analytics e cobertura das 12 verticais).

---

# PARTE III — ARQUITETURA TÉCNICA

## 11. Visão geral da plataforma

- **Monorepo** (um único repositório) gerenciado com **Turborepo + pnpm** (gerenciador de pacotes **pnpm**, obrigatório — nunca npm/yarn).
- **Full-stack TypeScript:**
  - **Backends:** NestJS 11 (APIs, gateways, workers).
  - **Frontends:** Next.js 16 (App Router) + React 19.
  - **Banco:** PostgreSQL com **Prisma** (ORM).
- **Estilos de arquitetura:**
  - **Clean Architecture / Hexagonal** por módulo nas APIs de operação e verticais (camadas domínio → aplicação → infraestrutura).
  - **Modular monolith** no núcleo do marketplace (controllers finos + services).
  - **Event-driven** (orientado a eventos) via mensageria, com **padrão outbox** e **read models** projetados por *workers*.
- **Documentação-as-code:** cada módulo tem um arquivo **`AGENTS.md`** que é a fonte de verdade do seu escopo, atualizado junto com o código.

## 12. Multi-tenancy (Plataforma → Organização → Loja)

**Hierarquia de inquilinos (tenants):**
- **Plataforma** — dados globais de operação (identidade no Keycloak, organizações, lojas, planos, cobrança, auditoria). Banco `citybox_platform`, schema `platform`.
- **Organização** — o cliente PJ (CNPJ) do lojista; agrupa lojas e cobrança.
- **Loja (Store)** — o ponto de operação; várias por organização.
- **Tenant (município)** — banco de dados isolado por cidade. No piloto, **Ilhéus** (banco único do tenant).

**Estratégia de schemas (ADR C-15):** dentro do tenant único do piloto, cada **vertical** tem o seu **schema PostgreSQL criado sob demanda (*lazy*)** — `public` (compartilhado), `food`, `market`, `clinic`, etc. Isso isola o domínio de cada vertical sem multiplicar bancos no piloto, e prepara a escala multi-cidade.

**Quem é dono de qual schema (Prisma):**

| Aplicação | Schema(s) | Âmbito |
| --------- | --------- | ------ |
| `platform/api` | `platform` | single-schema |
| `verticals/food/api` | `food` | single-schema |
| `verticals/clinica/api` | `clinica` | single-schema |
| `marketplace/api` | `platform` + `tenant` | multi-schema |
| `marketplace/bff` | `tenant` | single (leitura) |
| `realtime-gateway` | `platform` | single (leitura) |
| `workers` | `platform` + `tenant` | multi-schema |
| `services/payment-api` | `payment` | single (banco próprio) |

> Não há um pacote “database” central — **cada app é dono do seu schema**. Identificadores usam **UUID v7** (função `citybox_uuid_v7()`), ordenáveis por tempo.

## 13. Mapa de serviços e portas

| Serviço | Pacote | Porta | Papel |
| ------- | ------ | ----- | ----- |
| **marketplace-api** | `@citybox/marketplace-api` | 3101 | Núcleo transacional: catálogo, pedidos/subpedidos, checkout, inventário, frete, devices, **outbox de eventos** |
| **marketplace-bff** | `@citybox/marketplace-bff` | 3102 | BFF do app consumidor: agrega *read models* (Postgres + Redis + Typesense); só leitura |
| **platform-api** | `@citybox/platform-api` | 3103 | Operação da plataforma: onboarding, clientes, lojas, usuários internos, equipe |
| **realtime-gateway** | `@citybox/realtime-gateway` | 3104 | WebSocket (Socket.IO): ponte RabbitMQ → tempo real, salas por loja |
| **workers** | `@citybox/workers` | 3105 | Consumidores de eventos: projeção de read models, busca, notificações, impressão |
| **payment-api** | `@citybox/payment-api` | 3106 | Pagamentos multi-PSP, split, settlement. **🔴 Será refeito — não adotar** |
| **erp** | `@citybox/erp` | 3107 | Backoffice multi-vertical do lojista (Next.js) |
| **admin-web** | `@citybox/admin-web` | 3108 | Painel web dos operadores da plataforma (Next.js) |
| **food-api** | `@citybox/food-api` | 3171 | Backend da vertical Food (cardápio/menus) |
| **clinica-api** | `@citybox/clinica-api` | 3172 | Backend da vertical Clínica (🟣 scaffold; 1º módulo: modelos de contrato) |
| **keycloak-theme** | `@citybox/keycloak-theme` | — | Tema de login Keycloak (React/Keycloakify) |
| **nginx** | — | 8088 | Proxy reverso local (subdomínios `*.local.citybox.com`) |

## 14. Autenticação e autorização

- **Keycloak** (SSO/OIDC) é o servidor de identidade central (realm `citybox-dev`) — **ADR C-07**.
- **Frontends** (ERP, Admin) usam **OAuth2 Authorization Code + PKCE**; os **tokens ficam em cookies httpOnly**, e o navegador **nunca** chama as APIs direto — passa por **proxies server-side** que injetam o token e fazem refresh.
- **APIs (NestJS)** validam **JWT Bearer** (via JWKS), com guards locais (em `@citybox/nest-common`) e **permissões por papel (RBAC)**, ex.: `vertical.food.view`, `store.catalog.manage`, `platform.admin`.
- **Dispositivos** (PDV/KDS) autenticam por **token de device** (não usuários).
- **Escopo por loja:** toda requisição de negócio é “store-scoped” — no Food via cabeçalho `X-Store-Id`; na plataforma, via escopo na URL.

## 15. Eventos, mensageria e tempo real

- **Mensageria:** **RabbitMQ**, com envelopes no padrão **CloudEvents 1.0**, encapsulado pelo pacote `@citybox/messaging` (classe `RabbitBus`).
- **Padrão Outbox:** as APIs **gravam o evento na mesma transação** do banco (tabela de outbox, status “pendente”); um *relay* publica no RabbitMQ depois do commit. Isso garante **consistência** (o evento não se perde nem é publicado antes do commit).
- **Workers** consomem os eventos e **projetam read models** (no PostgreSQL e no **Typesense**), de forma **idempotente** (reprocessar o mesmo evento não duplica dados).
- **Redis** — cache (ex.: telas do BFF) e *pub/sub*; buffer de replay para o tempo real.
- **Tempo real:** o **realtime-gateway** (Socket.IO) faz a ponte dos eventos do RabbitMQ para os clientes conectados, organizados em **salas por loja** (`store:<id>`).

## 16. Fluxos principais

### 16.1 Pedido / Checkout
1. O app consumidor fala com o **BFF** (telas de home, busca, carrinho, checkout).
2. O **núcleo (marketplace-api)** recebe o pedido, resolve o tenant, cria **Pedido + Subpedidos (por loja) + Itens**, e **grava o evento no outbox** na mesma transação.
3. Após o commit, os **workers** publicam o evento; consumidores tratam **notificações, projeção e (futuramente) sincronização de pagamento**.

### 16.2 Publicação de oferta
1. O lojista publica/edita um item no ERP → o núcleo persiste o **CatalogItem** e gera o evento `offer.published`.
2. Os **workers** projetam a oferta nos **read models** e **indexam no Typesense**.
3. O **BFF** lê esses read models (com cache em Redis) para servir o app rapidamente.

### 16.3 Pagamento / Split
- Fluxo-alvo: checkout aciona o serviço de pagamentos (multi-PSP) → cria a cobrança → roteia ao PSP → publica evento de captura → workers atualizam o status do (sub)pedido e disparam o repasse.
- **Estado atual:** o **payment-api será reescrito (🔴)** e **não está integrado em produção**. Tratar este fluxo como **planejado**.

## 17. Camada de dados

- **Write path (transacional):** o lojista escreve via ERP → núcleo persiste no tenant → grava evento no outbox.
- **Read path (consistência eventual):** workers consomem eventos → projetam read models (ex.: `MarketplaceOffer`, `MarketplaceStore`) → indexam no Typesense → o BFF lê **apenas read models + cache** (o app **nunca** lê o núcleo direto).
- **Latência típica de projeção:** poucos segundos (intervalo do relay do outbox + processamento dos workers).

---

# PARTE IV — APLICAÇÕES E COMPONENTES

## 18. ERP (backoffice do lojista)

- **Next.js 16 (App Router), porta 3107.** É o **shell multi-vertical**: cada vertical vive em `/{vertical}` (`/food`, `/varejo`, `/clinic`) e é **carregada sob demanda** por um **manifesto lazy** (cada vertical define seu tema, navegação e permissão).
- **Loja ativa:** toda a operação é escopada pela loja selecionada; o usuário troca de loja quando tem mais de uma.
- **Acesso a backend só via proxies server-side** (`/api/proxy/food`, `/api/proxy/platform`, `/api/proxy/clinica`) — que escondem os tokens e validam o acesso à loja.
- **Estado de servidor** com TanStack Query; **formulários** migrando para o padrão canônico **React Hook Form + Zod** (Food é o piloto dessa migração).
- Documentação detalhada por feature: `apps/erp/src/features/{food,varejo,clinic,shared}/AGENTS.md`.

## 19. Verticais (food, varejo, clínica)

### 19.1 Food — 🟢🟡 vertical piloto (a mais madura)
- **Backend `food-api` (porta 3171, Clean Architecture):** cobre **Catálogo** (categorias, itens, imagens via MinIO, estações de cozinha, modificadores) e **Menus** (seções, entradas, reordenar, duplicar). **Não cobre** pedidos/financeiro/fiscal (fora do escopo atual). Multi-loja via `X-Store-Id`, schema `food`.
- **UI no ERP:** Cardápio e Itens **reais**; configurações de loja e equipe **reais**; horários/entrega em **demonstração**; **PDV** (frente de caixa) funcional com dados mock; **KDS e comandas não implementados**; pedidos/financeiro/dashboard mock/placeholder. Tema coral.

### 19.2 Varejo — 🟡 protótipo navegável (sem backend)
- **Não existe `varejo-api`.** Toda a vertical é **frontend-first**: configurações (loja, canais, horários, entrega, integrações) com UI pronta, persistindo em armazenamento de sessão (demonstração). **Exceção real:** o módulo de **Equipe** (compartilhado, usa a plataforma). Tema azul. *Observação:* internamente ainda usa o prefixo `market`; a permissão expõe `vertical.varejo.view` (com alias legado `vertical.market.view`).

### 19.3 Clínica — 🟡 configurações reais + 🟣 backend scaffold
- **UI de Configurações** (perfil da clínica, planos, anamneses, contrato) já consome a API via React Query, com mocks como *defaults*. **Equipe** é real (compartilhada). Demais áreas (pacientes, agenda, vendas…) são placeholders.
- **Backend `clinica-api` (porta 3172):** **scaffold** — infraestrutura pronta (clonada do Food); **primeiro módulo implementado: “modelos de contrato”** (CRUD). Demais módulos a implementar.

### 19.4 Shared (transversal do ERP)
- Componentes e lógica **transversais às verticais**: o wrapper de página padrão e o **módulo de Equipe** (CRUD real de membros via plataforma), reusado por Food, Varejo e Clínica.

## 20. Marketplace, plataforma e serviços

### 20.1 Núcleo do marketplace (api + bff)
- **marketplace-api (3101):** núcleo transacional (catálogo polimórfico, pedidos/subpedidos, checkout, inventário, frete, devices, outbox). 🟡 em desenvolvimento.
- **marketplace-bff (3102):** camada de leitura/agregação para o app consumidor (read models + cache Redis + Typesense). 🟡 em desenvolvimento.

### 20.2 Plataforma (api + admin)
- **platform-api (3103):** operação da plataforma (onboarding, clientes, lojas, usuários internos, equipe das lojas), em Clean Architecture. 🟡.
- **admin-web (3108):** painel dos operadores (Next.js). CRUDs principais integrados; analytics/cobrança/health ainda em construção. 🟡.

### 20.3 Pagamentos — ⚠️ atenção
- **payment-api (3106): 🔴 SERÁ REFEITO.** O código atual **não segue os padrões da plataforma** (auth própria, sem Clean Architecture) e **não está integrado/validado**. É **legado/referência**; **não deve ser adotado nem evoluído** até a reescrita. Consequência prática: split/settlement automáticos são **planejados**, não produção.

### 20.4 Tempo real e workers
- **realtime-gateway (3104):** WebSocket, ponte RabbitMQ→cliente, salas por loja, buffer de replay (Redis). 🟡 (sem testes; escala horizontal ainda não suportada — falta adapter Redis do Socket.IO).
- **workers (3105):** projeção de read models, indexação de busca, notificações, impressão; idempotência garantida. 🟡 (sem testes/lint).

## 21. Design system, packages e infraestrutura

### 21.1 Design system `@citybox/ui` — 🟢
- Biblioteca React em **atomic design** (atoms → molecules → organisms → templates), **Tailwind v4 + shadcn**, **tokens de cor em OKLCH**, fonte **Inter**, tema claro/escuro via classe `.dark`.
- Consumida **via código-fonte** (os apps transpilam o pacote).
- Componentes-chave: `AppSidebar`, `DataTable`, `ModalForm`/`ModalFormTabs`/`ModalFormMultistep`, `PageHeader`, `ConfirmDialog`, `EmptyState`, `RichTextEditor` (Tiptap, usado no contrato da clínica), além de dezenas de primitivos e moléculas (campos, currency, datepicker, etc.).
- Usada por: ERP, Admin, tema do Keycloak e (futuras) webs das verticais. Catálogo navegável em Storybook.

### 21.2 Packages compartilhados
- **Implementados:** `@citybox/ui` (design system) · `@citybox/messaging` (event bus RabbitMQ / CloudEvents — MVP, com limitações: sem publisher confirms/DLQ garantida/observabilidade plena) · `@citybox/tsconfig` (configs TS).
- **Citados no plano, ainda não materializados como pacote único:** `nest-common`, `events`, `contracts`, `search`, `marketplace-projection`, `notifications`. *(Parte dessas capacidades já vive embutida em apps; a consolidação em pacotes é evolução planejada.)*

### 21.3 Infraestrutura local (Docker) — 🟢
- **Serviços core** (sobem com `infra:up`): **PostgreSQL**, **Redis**, **RabbitMQ**, **Typesense** (busca), **MinIO** (armazenamento de objetos/imagens), **Keycloak** (identidade), **Nginx** (borda HTTP).
- **Serviços extras** (`infra:up:full`): **réplica PostgreSQL** (BI), **Unleash** (feature flags), **Metabase** (BI/relatórios).
- Cada serviço tem seu próprio Docker Compose, orquestrado por scripts; rede compartilhada `citybox-platform`.

### 21.4 Tema do Keycloak `@citybox/keycloak-theme` — 🟡
- Tema React (Keycloakify/Vite) que personaliza as telas de login/recuperação/atualização do Keycloak com a identidade Citybox, reutilizando o `@citybox/ui`.

---

# PARTE V — GESTÃO

## 22. Estado de maturidade consolidado

| Camada / Capacidade | Estado | Observação |
| ------------------- | ------ | ---------- |
| Design system (`@citybox/ui`) | 🟢 | Em uso por todos os frontends |
| Autenticação (Keycloak + PKCE + proxies) | 🟢 | SSO, tokens httpOnly, refresh |
| Infra local (Docker, 7 serviços core) | 🟢 | Topologia e scripts prontos |
| ERP shell multi-vertical + loja ativa | 🟢 | Base sólida |
| Equipe da loja (RBAC, compartilhado) | 🟢 | CRUD real via plataforma |
| Food — cardápio e itens (UI + food-api) | 🟢 | CRUD real com imagens |
| Food — PDV (frente de caixa) | 🟡 | UI completa, dados mock |
| Food — pedidos / financeiro / dashboard | 🟡/🔵 | Mock / placeholder |
| Food — KDS e comandas | 🔵 | Não implementados |
| Clínica — configurações (perfil/planos/anamneses/contrato) | 🟡 | UI + React Query; backend scaffold |
| Clínica — `clinica-api` | 🟣 | Scaffold; 1º módulo (contratos) pronto |
| Varejo — configurações | 🟡 | UI pronta, sem backend (mock) |
| Varejo — backend (`varejo-api`) | 🔵 | Não existe |
| Núcleo marketplace (api + bff) | 🟡 | Em desenvolvimento |
| Plataforma (api + admin) | 🟡 | CRUDs principais; analytics/cobrança a evoluir |
| Tempo real (gateway) + workers | 🟡 | Funcionais; sem testes; escala a endurecer |
| Mensageria (`@citybox/messaging`) | 🟡 | MVP; faltam confirms/DLQ/observabilidade |
| Pagamentos (`payment-api`) | 🔴 | Será refeito; não adotar |
| App consumidor nativo | 🔵 | Planejado (backend parcialmente pronto) |
| Verticais 3–12 (beauty, legal, etc.) | 🔵 | Planejadas |

**Síntese:** a **fundação está pronta** (design system, identidade, infraestrutura, shell multi-vertical, equipe). A **vertical Food é o piloto mais avançado** (cardápio/itens reais). O **núcleo do marketplace e a operação** estão em desenvolvimento. **Pagamentos** é o ponto que exige reconstrução antes de qualquer go-live financeiro.

## 23. Riscos e pontos de atenção

1. **Pagamentos a reconstruir (🔴):** sem o payment-api reescrito e validado, **não há go-live financeiro** (split/repasse/settlement). É o caminho crítico para monetização transacional.
2. **Cobertura de testes desigual:** gateway de tempo real e workers sem testes/lint; BFF sem suíte. Risco para confiabilidade conforme escala.
3. **Escala horizontal do tempo real:** o gateway ainda roda em instância única (falta adapter Redis do Socket.IO).
4. **Mensageria em MVP:** sem *publisher confirms* e DLQ garantida por padrão — risco de perda silenciosa em publicações diretas; observabilidade limitada.
5. **Dependência forte de RabbitMQ:** o fluxo transacional (outbox→eventos) depende do broker; indisponibilidade impacta projeções e notificações.
6. **Muitas telas em mock:** boa parte do produto (pedidos, fiscal, fidelidade, financeiro, verticais além de Food) é **interface sem backend** — importante alinhar expectativas comerciais sobre o que é demonstração vs. produção.
7. **Cifras comerciais não fechadas:** preços, comissões e datas deste documento são ilustrativos; precisam de validação da diretoria.

---

# PARTE VI — GLOSSÁRIO

| Termo | Definição |
| ----- | --------- |
| **ERP** | Sistema integrado de gestão do lojista (catálogo, pedidos, caixa, equipe, financeiro, fiscal). No Citybox, é o backoffice multi-vertical. |
| **Vertical** | Segmento de negócio (Food, Varejo, Beauty, Clínica…). Cada um tem UI/fluxo/módulos próprios no mesmo shell. |
| **Shell** | Aplicação “hospedeira” do ERP que carrega o módulo da vertical ativa sob demanda. |
| **Loja (Store)** | Ponto de operação do lojista — unidade mínima de gestão. Uma organização pode ter várias. |
| **Organização (Organization)** | Empresa/CNPJ do lojista; agrupa lojas e cobrança. |
| **Plataforma (Platform)** | Camada global da Citybox: identidade, organizações, lojas, planos, cobrança, auditoria. |
| **Tenant (inquilino)** | Conjunto de dados isolado por município. No piloto, Ilhéus. |
| **Município** | Escopo geográfico da plataforma; cada cidade será um tenant. |
| **Marketplace** | App/canal do consumidor para descobrir lojas locais e comprar de várias num só carrinho. |
| **Subpedido** | Parte de um pedido do marketplace correspondente a **uma** loja (1 pedido = N subpedidos). |
| **Oferta (Offer)** | Produto/serviço publicado no marketplace. Um item do catálogo do ERP vira oferta após projeção. |
| **Catálogo polimórfico** | Modelo de item que se adapta ao tipo de cada vertical (food/market/clinic…). |
| **BFF (Backend For Frontend)** | Camada intermediária que agrega dados e entrega telas prontas ao app, protegendo o núcleo. |
| **Read model** | Cópia de dados otimizada para leitura, projetada a partir de eventos (consistência eventual). |
| **Outbox (padrão)** | Técnica que grava o evento na mesma transação do banco e o publica depois, garantindo que nada se perca. |
| **Worker** | Processo que consome eventos do RabbitMQ e projeta read models / dispara ações (notificações, busca). |
| **CloudEvents** | Padrão de formato de evento (1.0) usado nas mensagens. |
| **Idempotência** | Propriedade de reprocessar o mesmo evento sem duplicar efeitos. |
| **RBAC** | Controle de acesso por papéis. No Citybox, escopado por loja (store-scoped). |
| **Keycloak** | Servidor de identidade (SSO/OIDC) que emite os tokens de login. |
| **PKCE** | Variante segura do OAuth2 para apps que não guardam segredo no navegador. |
| **Store-scoping** | Restringir cada requisição à loja ativa (via cabeçalho `X-Store-Id` ou escopo na URL). |
| **PDV** | Ponto de Venda (frente de caixa) para vendas presenciais. |
| **KDS** | Kitchen Display System — painel na cozinha com os pedidos em tempo real. |
| **Split** | Divisão automática de um pagamento entre loja e plataforma. |
| **Settlement / Repasse** | Liquidação e transferência da parte líquida da loja após comissões e taxas. |
| **PSP** | Provedor de serviços de pagamento (ex.: adquirentes/gateways). |
| **Typesense** | Motor de busca que indexa o catálogo público e serve buscas/facetas ao marketplace. |
| **Redis** | Banco em memória usado para cache e mensagens em tempo real. |
| **RabbitMQ** | Sistema de filas/mensageria que transporta os eventos do sistema. |
| **MinIO** | Armazenamento de objetos (ex.: imagens dos itens), compatível com S3. |
| **Monorepo** | Um único repositório com todos os apps, pacotes e infraestrutura juntos. |
| **Turborepo / pnpm** | Ferramentas de build e gerenciamento de pacotes do monorepo. |
| **Clean Architecture** | Estilo que separa domínio, aplicação e infraestrutura para facilitar teste e evolução. |
| **`AGENTS.md`** | Arquivo de documentação por módulo, fonte de verdade, mantido junto ao código. |
| **MRR / ARR** | Receita recorrente mensal / anual (métrica central de SaaS). |
| **Churn** | Taxa de cancelamento de clientes em um período. |

---

# PARTE VII — Referências internas

Para aprofundamento, os documentos vivos do repositório:

- **`AGENTS.md` (raiz)** — fonte de verdade técnica: mapa de serviços/portas, schemas, política de documentação.
- **`CLAUDE.md` (raiz)** — convenções de desenvolvimento, design system, fluxo de trabalho.
- **`README.md` (raiz)** — visão do monorepo, onboarding, hosts locais.
- **`AGENTS.md` por módulo** — em cada app/package/serviço (ex.: `apps/marketplace/api/AGENTS.md`, `apps/platform/api/AGENTS.md`, `apps/workers/AGENTS.md`, `apps/realtime-gateway/AGENTS.md`, `apps/verticals/food/AGENTS.md`, `packages/ui/AGENTS.md`, `infra/AGENTS.md`).
- **`apps/erp/src/features/{food,varejo,clinic,shared}/AGENTS.md`** — UI de cada vertical no ERP.
- **`docs/`** — `BFF.md`, `FLUXOS.md`, `BACKLOG.md`, `openapi.yaml` (contratos e fluxos).
- **`wiki/`** — blueprints navegáveis (Admin, ERP, ERP-Food, Marketplace, Services).
- **ADRs (Architecture Decision Records)** — decisões `B-01 … C-15` (ex.: C-07 Keycloak, C-15 schemas lazy por vertical), referenciadas ao longo do código e dos `AGENTS.md`.

---

> **Nota de manutenção.** Este documento é um **retrato de 2026-06-29**. O Citybox evolui rápido; em caso de divergência entre este texto e os arquivos `AGENTS.md` dos módulos, **os `AGENTS.md` prevalecem** (são atualizados junto com o código). Recomenda-se revisar este documento a cada marco de roadmap.
