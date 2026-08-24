WIKI.register({
  id: 'visao-geral-marketplace',
  title: 'Visão Geral — Marketplace',
  icon: '🛍️',
  searchText: 'visao geral marketplace consumidor B2C app comprador backend BFF core workers verticais food market beauty clinic services multi-vertical municipal citybox',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Introdução</div>
    <h1 class="section-title">🛍️ Visão Geral — Marketplace Citybox</h1>
    <p class="section-subtitle">O Marketplace é o lado consumidor do Citybox: o app onde o comprador descobre lojas, navega produtos de todas as verticais (food, market, beauty, clinic, services), monta a cesta, paga e acompanha o pedido. Hoje existe como stack backend completa — o app nativo ainda não está construído.</p>
    <div class="section-tags">
      <span class="tag-indigo">B2C · Consumidor</span>
      <span class="tag-blue">BFF :3102</span>
      <span class="tag-blue">Core :3101</span>
      <span class="tag-gray">App nativo: planejado</span>
    </div>
  </div>

  <div class="alert alert-indigo">
    <span class="alert-icon">ℹ️</span>
    <div class="alert-body">
      <div class="alert-title">Backend-only hoje — app nativo planejado (B-08)</div>
      <p>As pastas <code>apps/marketplace/web</code>, <code>ios</code> e <code>android</code> estão vazias. A decisão de produto B-08 define app nativo <strong>Swift + Kotlin</strong> conversando <strong>exclusivamente com o BFF</strong> (:3102). Este wiki documenta tanto o que existe hoje quanto o blueprint completo do produto.</p>
    </div>
  </div>

  <div class="eco-callout">
    <div class="eco-icon">🧭</div>
    <div class="eco-body">
      <div class="eco-title">Ecossistema Citybox — você está no Marketplace (lado consumidor)</div>
      <div class="eco-links">
        O Marketplace vende ao consumidor o que os lojistas publicam no
        <a href="../wiki-erp/wiki-erp/index.html">ERP Base</a>
        (e nas verticais <a href="../wiki-erp/wiki-erp-food/index.html">Food</a> ·
        <a href="../wiki-erp/wiki-erp-market/index.html">Market</a>).
        Toda a plataforma é governada no <a href="../wiki-admin/index.html">Admin</a>.
        <br><strong>Princípio:</strong> Admin governa · ERP opera · Marketplace vende.
      </div>
    </div>
  </div>

  <h2>Componentes da stack do Marketplace</h2>
  <div class="card-grid">
    <div class="card card-indigo">
      <div class="card-title"><span class="card-icon">🔵</span> marketplace-bff :3102</div>
      <p>NestJS. Read path do consumidor: home, categorias, busca Typesense, loja/oferta, carrinho (Redis + PG). Único endpoint que o app consome.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">⚙️</span> marketplace-api :3101</div>
      <p>NestJS. Core transacional: catálogo polimórfico, pedidos, checkout → payment-api, inventory/reserve, shipping/quote, scheduling.</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">⚡</span> workers :3105</div>
      <p>NestJS. Consome RabbitMQ → projeta read models (MarketplaceOffer/Store/Availability) + indexa Typesense. Aplica pagamentos confirmados no pedido.</p>
    </div>
    <div class="card card-purple">
      <div class="card-title"><span class="card-icon">💳</span> payment-api :3106</div>
      <p>Serviço separado. Multi-PSP (B-06). Recebe charges do core-api, split loja/plataforma. Emite eventos <code>payment.captured</code> / <code>payment.settled</code>.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">📡</span> realtime-gateway :3104</div>
      <p>WebSocket. Publica atualizações de status do pedido e rastreio de entregador em tempo real para o app consumidor.</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">📱</span> App nativo (planejado)</div>
      <p>Swift (iOS) + Kotlin (Android). Só fala com o BFF. PWA como complemento web. Design system mobile a definir.</p>
    </div>
  </div>

  <h2>Maturidade funcional hoje</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Capacidade</th><th>Estado</th><th>Camada</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Home / categorias</td><td><span class="status-badge status-functional">✅ Funcional</span></td><td>BFF <code>GET /v1/app/home</code></td></tr>
        <tr><td class="td-bold">Busca por produto (Typesense)</td><td><span class="status-badge status-functional">✅ Funcional</span></td><td>BFF <code>GET /v1/app/search</code></td></tr>
        <tr><td class="td-bold">Loja + detalhe de oferta</td><td><span class="status-badge status-functional">✅ Funcional</span></td><td>BFF <code>GET /v1/app/stores/:id</code></td></tr>
        <tr><td class="td-bold">Carrinho (Redis + PG)</td><td><span class="status-badge status-functional">✅ Funcional</span></td><td>BFF <code>GET/POST/PATCH /v1/app/cart</code></td></tr>
        <tr><td class="td-bold">Criação de pedido</td><td><span class="status-badge status-functional">✅ Funcional</span></td><td>Core <code>POST /v1/orders</code></td></tr>
        <tr><td class="td-bold">Checkout → charges</td><td><span class="status-badge status-partial">🔶 Parcial</span></td><td>Core <code>POST /v1/orders/:id/checkout</code></td></tr>
        <tr><td class="td-bold">Confirmação pagamento</td><td><span class="status-badge status-partial">🔶 Parcial</span></td><td>Worker (webhook core é stub)</td></tr>
        <tr><td class="td-bold">Rastreio realtime</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>realtime-gateway :3104</td></tr>
        <tr><td class="td-bold">App nativo iOS/Android</td><td><span class="status-badge status-proposed">💡 Planejado</span></td><td>pastas vazias</td></tr>
        <tr><td class="td-bold">Checkout orquestrado C-05</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>validate→reserve→create→rollback</td></tr>
        <tr><td class="td-bold">Avaliações/ratings</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>—</td></tr>
        <tr><td class="td-bold">Fidelidade/pontos</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>—</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Relação com os ERPs das verticais</h2>
  <div class="mermaid">
flowchart LR
  subgraph lojista [Lojista — ERPs]
    ERP["ERP backoffice\napps/erp :3107"]
    FoodAPI["food-api :3171"]
    MarketAPI["market-api :3181"]
  end

  subgraph mktcore [Marketplace Core]
    Core["marketplace-api\n:3101"]
    BFF["marketplace-bff\n:3102"]
    Workers["workers :3105"]
    TS["Typesense"]
    DB[("Postgres\nread models")]
  end

  subgraph consumidor [Consumidor]
    App["App nativo\niOS / Android"]
  end

  ERP -->|"publica catálogo"| Core
  FoodAPI -->|"sync cardápio"| Core
  MarketAPI -->|"sync produtos"| Core
  Core -->|"outbox"| Workers
  Workers --> DB
  Workers --> TS
  App -->|"somente BFF"| BFF
  BFF --> DB
  BFF --> TS
  </div>

  <h2>Onde este wiki se encaixa</h2>
  <div class="card-grid">
    <div class="card card-indigo">
      <div class="card-title"><span class="card-icon">🛍️</span> Este wiki (Marketplace)</div>
      <p>Lado consumidor: discovery, busca, carrinho, checkout, pagamento, rastreio, pós-venda, fidelidade, app nativo, arquitetura BFF/core/workers.</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">🏪</span> <a href="../wiki-erp/wiki-erp/index.html">Wiki ERP Base</a></div>
      <p>Lado lojista (comum a todas as verticais): catálogo polimórfico, pedidos, checkout/PDV, estoque, equipe, financeiro e fiscal.</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">🍔</span> <a href="../wiki-erp/wiki-erp-food/index.html">Wiki ERP Food</a></div>
      <p>Lado lojista de restaurantes: cardápio, KDS, PDV food, salão/mesas.</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">🛒</span> <a href="../wiki-erp/wiki-erp-market/index.html">Wiki ERP Market</a></div>
      <p>Lado lojista de varejo: catálogo EAN, balança, PDV caixa, estoque FEFO.</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">🛠️</span> <a href="../wiki-admin/index.html">Wiki Admin</a></div>
      <p>Backoffice da plataforma: clientes, lojas, planos/billing, monitoramento, repasses e auditoria global.</p>
    </div>
  </div>
</div>
`
});
