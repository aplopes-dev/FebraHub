WIKI.register({
  id: 'resiliencia-observabilidade',
  title: 'Resiliência e observabilidade',
  icon: '🔭',
  searchText: 'resiliencia escalabilidade circuit breaker opossum retry bulkhead timeout fallback rate limiter health check observabilidade opentelemetry prometheus grafana tempo jaeger tracing distribuido metricas logs application metrics log aggregation exception tracking caching',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Arquitetura-alvo</div>
    <h1 class="section-title">🔭 Resiliência e observabilidade</h1>
    <p class="section-subtitle">Os dois maiores gaps transversais. Resiliência protege contra falhas em cascata; observabilidade nos dá olhos sobre um sistema distribuído. Ambos são pré-requisito para operar microsserviços com confiança.</p>
    <div class="section-tags">
      <span class="tag-red">Maior gap</span>
      <span class="tag-emerald">Circuit Breaker</span>
      <span class="tag-teal">OpenTelemetry</span>
      <span class="tag-blue">Grafana</span>
    </div>
  </div>

  <h2>Resiliência — padrões e onde aplicar</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Padrão</th><th>Status</th><th>Alvo no Citybox (NestJS)</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Circuit Breaker</td><td><span class="status-badge status-absent">⛔</span></td><td><code>opossum</code> em chamadas a payment-api, Keycloak, Typesense</td></tr>
        <tr><td class="td-bold">Retry (com backoff)</td><td><span class="status-badge status-partial">🔶</span></td><td>Política de retry + jitter em clients HTTP e consumers</td></tr>
        <tr><td class="td-bold">Timeout</td><td><span class="status-badge status-partial">🔶</span></td><td>Timeout explícito em toda chamada de rede (hoje só Keycloak)</td></tr>
        <tr><td class="td-bold">Bulkhead</td><td><span class="status-badge status-partial">🔶</span></td><td><code>prefetch</code> por consumer + pools separados por dependência</td></tr>
        <tr><td class="td-bold">Fallback</td><td><span class="status-badge status-absent">⛔</span></td><td>Resposta degradada (ex.: cache antigo se Redis/Typesense cair)</td></tr>
        <tr><td class="td-bold">Rate Limiter</td><td><span class="status-badge status-absent">⛔</span></td><td>nginx + <code>@nestjs/throttler</code> nos endpoints públicos</td></tr>
        <tr><td class="td-bold">Health Check API</td><td><span class="status-badge status-functional">✅</span></td><td><code>/health</code> + <code>/health/ready</code> (manter, usar p/ readiness no deploy)</td></tr>
      </tbody>
    </table>
  </div>

  <pre><code>// alvo — circuit breaker com opossum em chamada ao PSP
import CircuitBreaker from 'opossum';

const breaker = new CircuitBreaker(callPaymentApi, {
  timeout: 8000,            // Timeout
  errorThresholdPercentage: 50,
  resetTimeout: 30000,      // half-open após 30s
});
breaker.fallback(() =&gt; ({ status: 'PENDING', degraded: true })); // Fallback
const result = await breaker.fire(charge);</code></pre>

  <div class="mermaid">
flowchart LR
  Caller["core-api"] --> CB{"Circuit Breaker"}
  CB -->|closed| Dep["payment-api"]
  CB -->|open| FB["fallback:<br/>resposta degradada"]
  Dep -->|"erros &gt; 50%"| Open["abre o circuito"]
  Open -.->|"resetTimeout"| Half["half-open<br/>(testa 1 req)"]
  Half -->|ok| CB
  Half -->|falha| Open
  </div>

  <h2>Observabilidade — os 3 pilares</h2>
  <p>O curso usa Elastic APM / Prometheus / Grafana / Micrometer. Como já temos Typesense (não Elastic), o alvo do Citybox é <strong>OpenTelemetry</strong> (vendor-neutro) exportando para um stack leve:</p>

  <div class="card-grid">
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">📈</span> Métricas</div>
      <p><code>prom-client</code> / OTel metrics → Prometheus. Throughput, latência p95, taxa de erro, tamanho de DLQ, hit-rate de cache.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🧵</span> Tracing distribuído</div>
      <p>OTel traces propagando <code>traceparent</code> via HTTP e CloudEvent → Tempo/Jaeger. Segue um checkout do BFF até a cobrança.</p>
    </div>
    <div class="card card-slate">
      <div class="card-title"><span class="card-icon">🪵</span> Logs estruturados</div>
      <p>Logs JSON com <code>traceId</code> correlacionado (pino) → agregação (Loki). Exception tracking centralizado.</p>
    </div>
  </div>

  <h2>Pipeline de observabilidade (alvo)</h2>
  <div class="mermaid">
flowchart LR
  S1["core-api"] --> OT["OTel SDK"]
  S2["workers"] --> OT
  S3["bff"] --> OT
  S4["payment-api"] --> OT
  OT --> COL["OTel Collector"]
  COL --> PR["Prometheus<br/>(métricas)"]
  COL --> TP["Tempo/Jaeger<br/>(traces)"]
  COL --> LK["Loki<br/>(logs)"]
  PR --> GR["Grafana"]
  TP --> GR
  LK --> GR
  GR --> AL["Alertas<br/>(DLQ, p95, erro)"]
  </div>

  <h2>Padrões de observabilidade do currículo</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Padrão</th><th>Citybox (alvo)</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Application Metrics</td><td>OTel metrics → Prometheus</td></tr>
        <tr><td class="td-bold">Distributed Tracing</td><td>OTel traces + W3C Trace Context (nos eventos)</td></tr>
        <tr><td class="td-bold">Log Aggregation</td><td>Logs JSON (pino) → Loki</td></tr>
        <tr><td class="td-bold">Exception Tracking</td><td>Sentry/GlitchTip ou Loki + alertas</td></tr>
        <tr><td class="td-bold">Health Check API</td><td>Já existe — integrar ao readiness/deploy</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-emerald">
    <span class="alert-icon">🎯</span>
    <div class="alert-body">
      <div class="alert-title">Comece por tracing + métricas mínimas</div>
      <p>Antes do stack completo, instrumentar OTel em core-api e workers e exportar para um Grafana/Tempo local já entrega 80% do valor: ver onde o tempo é gasto e onde os erros nascem. Logs estruturados com <code>traceId</code> fecham o ciclo.</p>
    </div>
  </div>
</div>
`
});
