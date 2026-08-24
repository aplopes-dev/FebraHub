WIKI.register({
  id: 'comunicacao-eventos',
  title: 'Comunicação e eventos',
  icon: '📨',
  searchText: 'comunicacao sincrona assincrona eventos rabbitmq cloudevents transactional outbox idempotent consumer dead letter queue dlq asyncapi rfc-7807 problem details publish subscribe message broker listen to yourself polling publisher',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Arquitetura-alvo</div>
    <h1 class="section-title">📨 Comunicação síncrona e assíncrona</h1>
    <p class="section-subtitle">O Citybox já é event-driven com RabbitMQ + CloudEvents + DLQ. Os ajustes-alvo são de <strong>corretude</strong>: outbox realmente transacional, idempotência uniforme e contratos de evento (AsyncAPI) + erros padronizados (RFC-7807).</p>
    <div class="section-tags">
      <span class="tag-emerald">Outbox</span>
      <span class="tag-teal">Idempotência</span>
      <span class="tag-blue">CloudEvents</span>
      <span class="tag-amber">RFC-7807</span>
    </div>
  </div>

  <h2>Quando síncrono, quando assíncrono</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Estilo</th><th>Use para</th><th>No Citybox</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Síncrono (REST)</td><td>Consulta imediata, comando que precisa de resposta na hora (criar pedido, cobrar)</td><td>nginx → BFF/core-api; core-api → payment-api</td></tr>
        <tr><td class="td-bold">Assíncrono (eventos)</td><td>Propagação de fato consumado, projeções, notificações, integração desacoplada</td><td>core-api → RabbitMQ → workers/payment/realtime</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Transactional Outbox — o ajuste mais importante</h2>
  <div class="blueprint-today">
    <div class="blueprint-today-label">🔶 Hoje (parcial)</div>
    <p>Em <code>orders.controller.ts</code>, o pedido e o registro de outbox <strong>não estão na mesma transação</strong> — risco de pedido persistido sem evento (ou vice-versa). O worker faz poll de <code>OutboxEvent</code> a cada 5s e publica.</p>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">💡 Alvo</div>
    <p>Gravar o agregado <strong>e</strong> o <code>OutboxEvent</code> na <strong>mesma</strong> <code>prisma.$transaction([...])</code>. O Polling Publisher (worker) continua publicando e marcando <code>PUBLISHED</code>. Assim, "ou ambos acontecem, ou nenhum".</p>
  </div>

  <pre><code>// alvo — outbox atômico no core-api
await prisma.$transaction(async (tx) =&gt; {
  const order = await tx.order.create({ data: orderData });
  await outbox.enqueue(tx, {            // mesma tx
    type: 'citybox.order.created.v1',
    data: toOrderCreatedEvent(order),
    storeId: order.storeId,
  });
  return order;
});
// worker (Polling Publisher) publica PENDING -&gt; RabbitMQ -&gt; marca PUBLISHED</code></pre>

  <h2>Fluxo de evento end-to-end</h2>
  <div class="mermaid">
flowchart LR
  API["core-api<br/>$transaction"] -->|"order + OutboxEvent (PENDING)"| DB[("Postgres tenant")]
  Poller["workers · Polling Publisher"] -->|"poll PENDING"| DB
  Poller -->|"publish CloudEvent"| EX{{"exchange citybox.events (topic)"}}
  EX --> Q1["marketplace.projection"]
  EX --> Q2["search.indexer"]
  EX --> Q3["notifications"]
  Q1 --> C1["consumer projeção<br/>(idempotente)"]
  C1 -->|"falha N vezes"| DLX{{"citybox.dlx"}}
  DLX --> DLQ["dlq"]
  C1 --> RM[("read models")]
  </div>

  <h2>Idempotent Consumer — padronizar</h2>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">💡 Padrão único para todo consumer</div>
    <p>Checar <code>ProcessedEvent(eventId, consumer)</code> <strong>no início</strong>; se já existe, ignora. Hoje isso é forte em <code>apply-payment.ts</code> mas fraco na projeção (grava no fim → reprocessamento duplica side effects).</p>
  </div>
  <pre><code>async function handle(event, consumer) {
  if (await isProcessed(event.id, consumer)) return; // skip cedo
  await prisma.$transaction(async (tx) =&gt; {
    await applyEffect(tx, event);                     // efeito de negócio
    await markProcessed(tx, event.id, consumer);      // marca na MESMA tx
  });
}</code></pre>

  <h2>Padrões de mensageria do currículo × Citybox</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Padrão</th><th>Status</th><th>Onde / alvo</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Message Broker / Publish-Subscribe</td><td><span class="status-badge status-functional">✅</span></td><td>RabbitMQ topic <code>citybox.events</code></td></tr>
        <tr><td class="td-bold">Transactional Outbox</td><td><span class="status-badge status-partial">🔶</span></td><td>Tornar atômico (mesma tx)</td></tr>
        <tr><td class="td-bold">Polling Publisher</td><td><span class="status-badge status-functional">✅</span></td><td>Worker poll 5s</td></tr>
        <tr><td class="td-bold">Idempotent Consumer</td><td><span class="status-badge status-partial">🔶</span></td><td>Padronizar <code>ProcessedEvent</code></td></tr>
        <tr><td class="td-bold">Dead Letter Queue</td><td><span class="status-badge status-functional">✅</span></td><td>DLX em todas as filas</td></tr>
        <tr><td class="td-bold">Listen to Yourself</td><td><span class="status-badge status-proposed">💡</span></td><td>Opcional p/ projeção própria pós-publish</td></tr>
        <tr><td class="td-bold">Transaction Log Tailing / CDC</td><td><span class="status-badge status-proposed">⚪</span></td><td>N.A. por ora (Debezium é overkill)</td></tr>
        <tr><td class="td-bold">Distributed Monolith (anti-pattern)</td><td><span class="status-badge status-functional">✅ evitado</span></td><td>Acoplamento via eventos, não chamadas síncronas em cadeia</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Contratos: AsyncAPI + RFC-7807</h2>
  <div class="card-grid">
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">📜</span> AsyncAPI (gap)</div>
      <p>O catálogo de eventos hoje é Markdown (<code>packages/docs/events/catalog-v1.md</code>). Gerar um <code>asyncapi.yaml</code> a partir do envelope CloudEvents para documentar tópicos, payloads e versões — equivalente ao OpenAPI das APIs síncronas.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🚨</span> RFC-7807 (gap)</div>
      <p>Padronizar erros HTTP em <code>application/problem+json</code> via um <code>ExceptionFilter</code> global do NestJS: <code>type</code>, <code>title</code>, <code>status</code>, <code>detail</code>, <code>instance</code>. Melhora integração e DX dos consumidores das APIs.</p>
    </div>
  </div>

  <pre><code>// alvo — Problem Details (RFC-7807) no NestJS
{
  "type": "https://citybox.com/errors/cart-item-unavailable",
  "title": "Item indisponível",
  "status": 422,
  "detail": "A oferta 0193... não tem estoque na loja 0192...",
  "instance": "/v1/checkout/0194..."
}</code></pre>

  <div class="alert alert-emerald">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Propagar contexto de trace nos eventos</div>
      <p>Incluir <code>traceparent</code> (W3C Trace Context) como atributo do CloudEvent. Assim um trace iniciado no checkout segue até a projeção e a cobrança — base para o tracing distribuído da seção <a href="#resiliencia-observabilidade">Observabilidade</a>.</p>
    </div>
  </div>
</div>
`
});
