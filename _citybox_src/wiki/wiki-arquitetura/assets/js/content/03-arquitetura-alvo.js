WIKI.register({
  id: 'arquitetura-alvo',
  title: 'Arquitetura-alvo',
  icon: '🗺️',
  searchText: 'arquitetura alvo componentes diagrama c4 edge nginx bff core api platform api workers rabbitmq read models keycloak redis typesense postgres tenant multi schema payment observabilidade topologia servicos portas',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Arquitetura-alvo</div>
    <h1 class="section-title">🗺️ Topologia de componentes (alvo)</h1>
    <p class="section-subtitle">Visão de componentes do Citybox no estado-alvo: o que já existe (sólido), o que é gap a fechar e como as peças se conectam. As caixas tracejadas indicam camadas a introduzir (observabilidade, resiliência).</p>
    <div class="section-tags">
      <span class="tag-emerald">C4 · Containers</span>
      <span class="tag-slate">Cidade única (Ilhéus)</span>
      <span class="tag-teal">Event-driven + CQRS</span>
    </div>
  </div>

  <h2>Diagrama de componentes</h2>
  <div class="mermaid">
flowchart LR
  Client["App / Web<br/>(React 19 · Next 16)"] --> Nginx["nginx :8088<br/>edge · TLS · routing"]

  Nginx --> BFF["marketplace-bff :3102<br/>read · cache · API Composition"]
  Nginx --> CoreAPI["marketplace-api :3101<br/>write · checkout"]
  Nginx --> PlatformAPI["platform-api :3103<br/>backoffice plataforma"]
  Nginx --> WS["realtime-gateway :3104<br/>Socket.IO"]

  BFF --> Redis[("Redis 8<br/>cache · carrinho")]
  BFF --> Typesense[("Typesense<br/>busca")]
  BFF --> TenantRead[("Postgres tenant<br/>read models")]

  CoreAPI --> TenantDB[("Postgres tenant<br/>multi-schema vertical")]
  CoreAPI -->|"outbox (mesma tx)"| RabbitMQ{{"RabbitMQ 4.3<br/>topic + DLX"}}
  CoreAPI --> Keycloak["Keycloak 26<br/>OIDC · JWT"]

  RabbitMQ --> Workers["workers :3105<br/>projeções · saga · idempotência"]
  Workers --> Typesense
  Workers --> TenantDB
  Workers --> RealtimeBridge["fila realtime.broadcast"]
  RealtimeBridge --> WS
  WS --> Redis

  RabbitMQ --> PaymentAPI["payment-api :3106<br/>PSP · split"]
  PaymentAPI --> PaymentDB[("Postgres payment<br/>DB próprio")]

  subgraph obs ["Observabilidade-alvo (gap)"]
    Otel["OpenTelemetry SDK"] --> Collector["OTel Collector"]
    Collector --> Prom["Prometheus"]
    Collector --> Tempo["Tempo / Jaeger"]
    Prom --> Graf["Grafana"]
    Tempo --> Graf
  end

  CoreAPI -.-> Otel
  Workers -.-> Otel
  BFF -.-> Otel
  PaymentAPI -.-> Otel
  </div>
  <div class="mermaid-caption">Linhas tracejadas = instrumentação a introduzir. A camada de observabilidade é o maior gap transversal.</div>

  <h2>Camadas e responsabilidades</h2>
  <div class="card-grid">
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">🌐</span> Edge — nginx</div>
      <p>TLS, roteamento por host, rate limiting (alvo). Substitui o "Spring Cloud Gateway" do curso; o BFF cobre API Composition.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🔵</span> Read — BFF</div>
      <p>Porta única do consumidor. Cache-aside (Redis), busca (Typesense), leitura de read models. Nunca expõe APIs internas.</p>
    </div>
    <div class="card card-slate">
      <div class="card-title"><span class="card-icon">✍️</span> Write — core-api</div>
      <p>Mutações, checkout, outbox transacional. Fonte de verdade do domínio (tenant DB multi-schema).</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">⚙️</span> Async — workers</div>
      <p>Consome RabbitMQ, projeta read models, executa saga, garante idempotência. Coração do event-driven.</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">💳</span> Payment</div>
      <p>Serviço com DB próprio (isolamento PSP). Idempotency-Key, DLQ de webhooks, split.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🔭</span> Observabilidade (gap)</div>
      <p>OpenTelemetry → Collector → Prometheus/Tempo → Grafana. Traços correlacionados via <code>traceparent</code> propagado no CloudEvent.</p>
    </div>
  </div>

  <h2>Mapa de serviços e portas</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Serviço</th><th>Package</th><th>Porta</th><th>Papel</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">marketplace-api</td><td><code>@citybox/marketplace-api</code></td><td>3101</td><td>Write / checkout</td></tr>
        <tr><td class="td-bold">marketplace-bff</td><td><code>@citybox/marketplace-bff</code></td><td>3102</td><td>Read / BFF</td></tr>
        <tr><td class="td-bold">platform-api</td><td><code>@citybox/platform-api</code></td><td>3103</td><td>Backoffice plataforma</td></tr>
        <tr><td class="td-bold">realtime-gateway</td><td><code>@citybox/realtime-gateway</code></td><td>3104</td><td>WebSocket</td></tr>
        <tr><td class="td-bold">workers</td><td><code>@citybox/workers</code></td><td>3105</td><td>Projeções / saga</td></tr>
        <tr><td class="td-bold">payment-api</td><td><code>@citybox/payment-api</code></td><td>3106</td><td>PSP / split</td></tr>
        <tr><td class="td-bold">erp</td><td><code>@citybox/erp</code></td><td>3107</td><td>Backoffice lojista</td></tr>
        <tr><td class="td-bold">admin-web</td><td><code>@citybox/admin-web</code></td><td>3108</td><td>Admin plataforma</td></tr>
        <tr><td class="td-bold">food-api</td><td><code>food-api</code></td><td>3171</td><td>Vertical piloto</td></tr>
      </tbody>
    </table>
  </div>

  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">💡 Decisão de arquitetura</div>
    <p>Manter <strong>monorepo modular event-driven</strong> em vez de fragmentar em dezenas de microsserviços. Para uma cidade única, o custo operacional de muitos serviços supera o ganho. Os limites de serviço seguem <strong>capacidade de negócio</strong> (catálogo, pedidos, pagamento, busca, realtime), não camadas técnicas.</p>
  </div>

  <div class="eco-callout">
    <div class="eco-icon">🔗</div>
    <div class="eco-body">
      <div class="eco-title">Detalhamento por tema</div>
      <div class="eco-links">
        <a href="#comunicacao-eventos">Comunicação/Eventos</a> ·
        <a href="#dados-distribuidos">Dados distribuídos</a> ·
        <a href="#saga-checkout">Saga do checkout</a> ·
        <a href="#resiliencia-observabilidade">Resiliência/Observabilidade</a> ·
        <a href="#seguranca-devops">Segurança/DevOps</a>
      </div>
    </div>
  </div>
</div>
`
});
