WIKI.register({
  id: 'arquitetura-marketplace',
  title: 'Arquitetura do Marketplace',
  icon: '🏗️',
  searchText: 'arquitetura marketplace BFF core workers Typesense RabbitMQ payment-api realtime read path write path cache Redis servicos portas NestJS notificacoes impressao comanda recibo CLI dispositivos devices tenancy identity storage outbox city TenantReaderService CacheService food varejo vertical',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Apps e Arquitetura</div>
    <h1 class="section-title">🏗️ Arquitetura do Marketplace</h1>
    <p class="section-subtitle">O Marketplace usa separação de leitura (BFF + read models) e escrita (core-api + workers + eventos). Cinco serviços NestJS + Typesense + RabbitMQ + Redis + payment-api formam a stack completa.</p>
    <div class="section-tags">
      <span class="tag-indigo">Read/Write Split</span>
      <span class="tag-blue">CQRS lite</span>
      <span class="tag-violet">Event-driven</span>
    </div>
  </div>

  <h2>Visão geral dos serviços</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Serviço</th><th>Porta</th><th>Responsabilidade</th><th>Tecnologia</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">marketplace-bff</td><td>:3102</td><td>Read path do app consumidor (home, busca, loja, carrinho)</td><td>NestJS + Redis + Typesense</td></tr>
        <tr><td class="td-bold">marketplace-api</td><td>:3101</td><td>Write path + orquestração (catálogo, pedidos, checkout)</td><td>NestJS + Prisma + Postgres</td></tr>
        <tr><td class="td-bold">workers</td><td>:3105</td><td>Projeção de read models + indexação Typesense + notificações assíncronas + impressão de comandas/recibos + CLI de manutenção</td><td>NestJS + RabbitMQ</td></tr>
        <tr><td class="td-bold">payment-api</td><td>:3106</td><td>Cobrança multi-PSP, split, estorno, eventos de pagamento</td><td>NestJS + RabbitMQ</td></tr>
        <tr><td class="td-bold">realtime-gateway</td><td>:3104</td><td>WebSocket para status do pedido e rastreio</td><td>NestJS Gateway + Socket.io</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Módulos do workers (:3105)</h2>
  <p>O serviço <code>workers</code> é um consumidor RabbitMQ multi-módulo. Além de projetar read models, ele concentra processamento assíncrono de várias responsabilidades:</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Módulo</th><th>Responsabilidade</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">read-models/</td><td>Projeta eventos de domínio em read models Postgres e indexa ofertas/lojas no Typesense</td></tr>
        <tr><td class="td-bold">notifications/</td><td>Processamento de notificações assíncronas — push, e-mail, SMS disparados por eventos de pedido/pagamento</td></tr>
        <tr><td class="td-bold">print/</td><td>Impressão de comandas e recibos — recebe eventos e envia jobs para impressoras térmicas via dispositivo pareado</td></tr>
        <tr><td class="td-bold">cli/</td><td>CLI de manutenção e migração — utilitários para re-projeção de read models, reindexação e tarefas operacionais</td></tr>
        <tr><td class="td-bold">features/food/</td><td>Handlers específicos para a vertical food — eventos processados com lógica de cozinha, KDS e comanda</td></tr>
        <tr><td class="td-bold">features/varejo/</td><td>Handlers específicos para a vertical varejo — eventos de estoque, lotes e grade de produtos processados de forma segmentada</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Módulos do marketplace-api (:3101)</h2>
  <p>O <code>marketplace-api</code> é o write path principal. Além de catálogo, pedidos e checkout, expõe controllers e módulos internos transversais:</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Controller / Módulo</th><th>Localização</th><th>Responsabilidade</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">DevicesController</td><td><code>devices/</code></td><td>Registro e pareamento de dispositivos — impressoras térmicas, KDS, terminais PDV</td></tr>
        <tr><td class="td-bold">HierarchyController</td><td><code>platform/</code></td><td>Dados hierárquicos de plataforma (Platform → Organization → Store)</td></tr>
        <tr><td class="td-bold">tenancy/</td><td>módulo interno</td><td>Contexto multi-tenant — resolve e propaga o tenant a partir do JWT/header de cada requisição</td></tr>
        <tr><td class="td-bold">identity/</td><td>módulo interno</td><td>Identidade do usuário — sincronização com Keycloak e resolução do perfil local</td></tr>
        <tr><td class="td-bold">storage/</td><td>módulo interno</td><td>Upload de arquivos — abstração sobre MinIO para imagens de catálogo e documentos</td></tr>
        <tr><td class="td-bold">outbox/</td><td>módulo interno</td><td>Padrão outbox — garante entrega transacional de eventos ao RabbitMQ após commit no Postgres</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Módulos do marketplace-bff (:3102)</h2>
  <p>O BFF expõe o read path para o app consumidor e inclui módulos de infraestrutura para eficiência e configuração municipal:</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Módulo</th><th>Principal serviço</th><th>Responsabilidade</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">city/</td><td><code>TenantReaderService</code></td><td>Lê configurações do tenant/município — fuso, moeda, verticais habilitadas, customizações de aparência</td></tr>
        <tr><td class="td-bold">cache/</td><td><code>CacheService</code></td><td>Redis cache para read path — TTL por rota, invalidação seletiva, fallback gracioso em caso de falha do Redis</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Diagrama completo</h2>
  <div class="mermaid">
flowchart TB
  subgraph consumer [Consumidor]
    App["📱 App\niOS/Android/PWA"]
  end

  subgraph readpath [Read Path]
    BFF["BFF :3102"]
    Redis["Redis\ncache"]
    TS["Typesense\noffers/stores"]
    RM["Read Models\nPG (MarketplaceOffer\nStore, Availability)"]
  end

  subgraph writepath [Write Path]
    Core["Core API :3101"]
    PG[("Postgres\ntenant schema")]
    PA["Payment API :3106"]
  end

  subgraph eventsync [Eventos]
    MQ["RabbitMQ"]
    W["Workers :3105"]
    RGW["Realtime GW :3104"]
  end

  App -->|"GET /v1/app/*"| BFF
  App -->|"POST /v1/orders"| Core
  App <-->|"WebSocket"| RGW
  BFF --> Redis
  BFF --> TS
  BFF --> RM
  Core --> PG
  Core --> MQ
  Core --> PA
  PA --> MQ
  MQ --> W
  W --> RM
  W --> TS
  W --> RGW
  </div>

  <h2>Read path — fluxo de busca/home</h2>
  <ol>
    <li>App chama <code>GET /v1/app/search?q=pizza</code> no BFF</li>
    <li>BFF verifica cache Redis (TTL 30s para buscas populares)</li>
    <li>Cache miss → BFF consulta Typesense coleção <code>offers</code></li>
    <li>Typesense retorna lista ranqueada de offers com storeId</li>
    <li>BFF enriquece com dados da loja (<code>MarketplaceStore</code> no PG) e retorna</li>
    <li>App renderiza resultado em &lt;200ms</li>
  </ol>

  <h2>Write path — fluxo de pedido</h2>
  <ol>
    <li>App chama <code>POST /v1/checkout</code> no Core API com carrinho</li>
    <li>Orquestrador C-05: valida → reserva estoque → cria Order/SubOrder → charge</li>
    <li>Core emite evento <code>order.created</code> + <code>order.confirmed</code> no RabbitMQ</li>
    <li>Workers consomem eventos → atualizam read models + notificam realtime-gateway</li>
    <li>Realtime-gateway publica via WebSocket → App atualiza linha do tempo</li>
    <li>payment-api confirma cobrança → emite <code>payment.captured</code> → worker finaliza</li>
  </ol>

  <h2>Latência alvo</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Operação</th><th>P50</th><th>P99</th><th>Estratégia</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Home / categorias</td><td>&lt;100ms</td><td>&lt;300ms</td><td>Redis cache TTL 60s</td></tr>
        <tr><td class="td-bold">Busca Typesense</td><td>&lt;80ms</td><td>&lt;200ms</td><td>Typesense local + BFF cache 30s</td></tr>
        <tr><td class="td-bold">Detalhe da loja</td><td>&lt;120ms</td><td>&lt;400ms</td><td>Read model PG + cache</td></tr>
        <tr><td class="td-bold">Checkout completo</td><td>&lt;2s</td><td>&lt;5s</td><td>C-05 orquestrado; timeout hard 10s</td></tr>
        <tr><td class="td-bold">Propagação de evento</td><td>&lt;500ms</td><td>&lt;2s</td><td>RabbitMQ → worker → read model</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
