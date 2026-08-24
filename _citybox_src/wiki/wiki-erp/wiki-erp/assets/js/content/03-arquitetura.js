WIKI.register({
  id: 'arquitetura',
  title: 'Arquitetura do Sistema',
  icon: '🏗️',
  searchText: 'arquitetura sistema nextjs nestjs keycloak bff marketplace-api vertical-api workers rabbitmq typesense redis postgres',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Introdução</div>
    <h1 class="section-title">🏗️ Arquitetura do Sistema</h1>
    <p class="section-subtitle">Visão completa da arquitetura técnica do ERP Citybox: shell Next.js, BFF, APIs de domínio, workers, realtime e serviços de infraestrutura.</p>
    <div class="section-tags">
      <span class="tag-orange">Arquitetura</span>
      <span class="tag-amber">NestJS · Next.js · Prisma</span>
      <span class="tag-blue">Keycloak · RabbitMQ · Redis</span>
    </div>
  </div>

  <h2>Diagrama geral</h2>
  <div class="mermaid">
flowchart TB
  Browser["🖥️ Operador Lojista\n(browser/SmartPOS)"]

  subgraph erp ["apps/erp — Next.js :3107"]
    Shell["Shell multi-vertical\n(App Router + @citybox/ui)"]
    BFF["BFF Proxies\n/api/proxy/core\n/api/proxy/food"]
  end

  KC["🔐 Keycloak SSO\n(OIDC / PKCE)"]

  subgraph core ["apps/marketplace/api — NestJS :3101"]
    Catalogo["📦 Catálogo"]
    Pedidos["🛒 Pedidos / Checkout"]
    Estoque["📊 Estoque"]
    Pagamentos["💳 Pagamentos"]
    Frete["🚚 Frete"]
  end

  subgraph vapi ["apps/verticals/food/api — NestJS :3171"]
    Settings["⚙️ Settings / Branding"]
    Rbac["🔑 Roles / Permissões"]
    Users["👥 Equipe / Sync"]
  end

  subgraph infra ["Infraestrutura"]
    PG[("PostgreSQL\nmulti-schema")]
    Redis[("Redis Cache")]
    MQ["RabbitMQ\nEvent Bus"]
    TS["Typesense\nSearch"]
    Fiscal["PlugNotas\n(NF-e/NFC-e)"]
  end

  Workers["⚙️ Workers\n(projection, outbox, fiscal)"]
  RealGW["📡 Realtime GW\n(WebSocket)"]

  Browser -->|HTTPS| Shell
  Shell --> BFF
  BFF -->|Bearer Token| core
  BFF -->|X-Store-Id header| vapi
  BFF <-->|Token exchange| KC

  core --> PG
  core --> Redis
  core --> MQ
  vapi --> PG
  vapi --> KC

  MQ --> Workers
  Workers --> TS
  Workers --> Fiscal
  Workers --> PG

  core -->|events| RealGW
  RealGW -->|WS push| Browser
  </div>

  <h2>Serviços e responsabilidades</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Serviço</th><th>Porta</th><th>Stack</th><th>Responsabilidade</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">apps/erp</td><td>3107</td><td>Next.js 16 / React 19</td><td>Shell ERP — UI multi-vertical, BFF proxy, auth Keycloak</td></tr>
        <tr><td class="td-bold">apps/marketplace/api</td><td>3101</td><td>NestJS / Prisma</td><td>Domínio transacional: catálogo, pedidos, estoque, pagamentos, frete</td></tr>
        <tr><td class="td-bold">apps/marketplace/bff</td><td>3102</td><td>NestJS</td><td>BFF marketplace consumidor (app do cliente)</td></tr>
        <tr><td class="td-bold">apps/verticals/food/api</td><td>3171</td><td>NestJS / Prisma</td><td>Settings, RBAC, equipe, KDS (food-specific)</td></tr>
        <tr><td class="td-bold">apps/platform/api</td><td>3103</td><td>NestJS</td><td>Admin plataforma: municipalities, orgs, stores</td></tr>
        <tr><td class="td-bold">services/payment-api</td><td>3106</td><td>NestJS</td><td>Processamento de pagamentos, PSP adapters, split</td></tr>
        <tr><td class="td-bold">apps/workers</td><td>3105</td><td>NestJS</td><td>Projeções, indexação Typesense, outbox, pagamentos, notificações assíncronas, impressão de comandas/recibos, CLI de manutenção, handlers por vertical (food, varejo)</td></tr>
        <tr><td class="td-bold">apps/realtime-gateway</td><td>3104</td><td>NestJS / WS</td><td>WebSocket gateway para push de eventos ao ERP</td></tr>
        <tr><td class="td-bold">Keycloak</td><td>8080</td><td>Java</td><td>IAM, OIDC, PKCE, realm por município</td></tr>
        <tr><td class="td-bold">PostgreSQL</td><td>5432</td><td>—</td><td>Banco principal: schema platform + tenant_{mun}</td></tr>
        <tr><td class="td-bold">Redis</td><td>6379</td><td>—</td><td>Cache de sessão, permissões, carrinho, rate-limit</td></tr>
        <tr><td class="td-bold">RabbitMQ</td><td>5672</td><td>—</td><td>Event bus assíncrono: outbox pattern</td></tr>
        <tr><td class="td-bold">Typesense</td><td>8108</td><td>—</td><td>Search do catálogo público + busca interna ERP</td></tr>
        <tr><td class="td-bold">PlugNotas</td><td>—</td><td>SaaS</td><td>Emissão e armazenamento de NF-e / NFC-e / NFS-e</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Fluxo de autenticação (BFF + Keycloak)</h2>
  <div class="mermaid">
sequenceDiagram
  participant Browser
  participant ErpBFF as ERP BFF (Next.js API Route)
  participant KC as Keycloak
  participant CoreAPI as marketplace-api
  participant VertAPI as vertical-api

  Browser->>ErpBFF: GET /api/auth/session
  ErpBFF->>KC: PKCE Authorization Code Flow
  KC-->>ErpBFF: access_token + refresh_token
  ErpBFF-->>Browser: Set-Cookie (httpOnly)

  Browser->>ErpBFF: POST /api/proxy/core/orders
  ErpBFF->>ErpBFF: Valida cookie, extrai store_id
  ErpBFF->>CoreAPI: Bearer access_token + X-Store-Id
  CoreAPI-->>ErpBFF: JSON response
  ErpBFF-->>Browser: 200 OK

  Browser->>ErpBFF: GET /api/proxy/food/settings
  ErpBFF->>VertAPI: Bearer + X-Store-Id
  VertAPI->>KC: Introspect token
  KC-->>VertAPI: roles[]
  VertAPI-->>Browser: settings JSON
  </div>

  <h2>Multi-tenancy: estratégia de banco</h2>
  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Schema <code>platform</code>: entidades de plataforma (municipalities, orgs, stores, users)</li>
      <li>Schema <code>tenant_{municipality_slug}</code>: dados operacionais de cada município</li>
      <li>Dois Prisma clients: <code>platformPrisma</code> e <code>tenantPrisma(mun)</code></li>
      <li>Sem row-level security — isolamento por schema</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Manter isolamento por schema (scale horizontal)</li>
      <li>Adicionar RLS no schema platform para operações cross-tenant</li>
      <li>Connection pooling via PgBouncer para reduzir overhead de schemas múltiplos</li>
      <li>Backup por município com retenção independente</li>
    </ul>
  </div>

  <h2>Padrão Outbox</h2>
  <p>Toda mutação crítica (pedido criado, pagamento confirmado, estoque reservado) persiste um registro na tabela <code>OutboxEvent</code> na mesma transação. O worker de outbox lê e publica no RabbitMQ, garantindo entrega at-least-once sem acoplamento síncrono.</p>
  <pre>// Fluxo outbox simplificado
await prisma.$transaction([
  prisma.order.create({ data: orderData }),
  prisma.outboxEvent.create({
    data: { type: 'order.created', payload: JSON.stringify(orderData) }
  })
]);
// Worker lê outbox e publica no RabbitMQ</pre>

  <h2>Variáveis de ambiente críticas do ERP</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Variável</th><th>Onde usada</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td><code>NEXT_PUBLIC_KEYCLOAK_URL</code></td><td>apps/erp</td><td>URL do Keycloak</td></tr>
        <tr><td><code>NEXT_PUBLIC_KEYCLOAK_REALM</code></td><td>apps/erp</td><td>Realm do município</td></tr>
        <tr><td><code>NEXT_PUBLIC_KEYCLOAK_CLIENT_ID</code></td><td>apps/erp</td><td>Client PKCE público</td></tr>
        <tr><td><code>CORE_API_URL</code></td><td>apps/erp BFF</td><td>URL interna marketplace-api</td></tr>
        <tr><td><code>FOOD_API_URL</code></td><td>apps/erp BFF</td><td>URL interna vertical food api</td></tr>
        <tr><td><code>DATABASE_URL_PLATFORM</code></td><td>APIs</td><td>Connection string schema platform</td></tr>
        <tr><td><code>DATABASE_URL_TENANT</code></td><td>APIs</td><td>Connection string schema tenant</td></tr>
        <tr><td><code>REDIS_URL</code></td><td>APIs, workers</td><td>Redis para cache e rate-limit</td></tr>
        <tr><td><code>RABBITMQ_URL</code></td><td>workers, APIs</td><td>AMQP connection</td></tr>
        <tr><td><code>PLUGNOTAS_API_KEY</code></td><td>fiscal-worker</td><td>Chave PlugNotas (NF-e)</td></tr>
        <tr><td><code>TYPESENSE_API_KEY</code></td><td>indexer-worker</td><td>Chave admin Typesense</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
