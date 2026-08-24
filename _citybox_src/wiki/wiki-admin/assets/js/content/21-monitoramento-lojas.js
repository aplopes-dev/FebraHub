WIKI.register({
  id: 'monitoramento-lojas',
  title: 'Monitoramento de Lojas',
  icon: '📡',
  searchText: 'monitoramento lojas uptime erros reputação saúde semáforo SLA alertas operacionais ping status offline tempo real',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Lojas</div>
  <h1 class="section-title">📡 Monitoramento de Lojas</h1>
  <p class="section-subtitle">Visão operacional em tempo real de todas as lojas — uptime, erros, reputação (semáforo) e alertas por SLA.</p>
  <div class="section-tags">
    <span class="tag-teal">Operacional</span>
    <span class="status-badge status-proposed">🔵 Feature nova</span>
    <span class="tag-p1">P1</span>
  </div>
</div>

<div class="eco-callout">
  <div class="eco-icon">🔗</div>
  <div class="eco-body">
    <div class="eco-title">A saúde é medida sobre a operação real do ERP</div>
    <div class="eco-links">
      Uptime, erros e sincronização vêm dos terminais e da operação do lojista —
      ver <a href="../wiki-erp/wiki-erp/index.html#realtime-sync">ERP · Realtime e Sincronização</a>
      e <a href="../wiki-erp/wiki-erp/index.html#devices">ERP · Dispositivos</a>.
      Pedidos que entram pelo <a href="../wiki-marketplace/index.html#acompanhamento-pedido">Marketplace</a> também alimentam estes sinais.
    </div>
  </div>
</div>

<h2>Modelo de saúde por loja</h2>
<div class="card-grid">
  <div class="card card-teal">
    <div class="card-title">🟢 Loja saudável</div>
    <ul>
      <li>Uptime &gt; 95% nas últimas 24h</li>
      <li>Nenhum erro crítico (type ERROR) nas últimas 2h</li>
      <li>Pelo menos 1 pedido nas últimas 24h (se loja ativa)</li>
      <li>Todas as integrações conectadas</li>
    </ul>
  </div>
  <div class="card card-amber">
    <div class="card-title">🟡 Atenção</div>
    <ul>
      <li>Uptime 80–95% ou 1–3 erros críticos nas últimas 2h</li>
      <li>Nenhum pedido nas últimas 12h (se loja ativa)</li>
      <li>Integração com aviso (conectada mas com delay)</li>
    </ul>
  </div>
  <div class="card">
    <div class="card-title" style="color:#dc2626">🔴 Crítico</div>
    <ul>
      <li>Uptime &lt; 80% ou offline há &gt; 30 min</li>
      <li>Mais de 3 erros críticos nas últimas 2h</li>
      <li>Nenhum pedido nas últimas 24h em loja com histórico</li>
      <li>Integração desconectada</li>
    </ul>
  </div>
</div>

<h2>Mockup — Mapa de saúde das lojas</h2>
<div class="mockup-container">
  <div class="mock-topbar">
    <span class="mock-logo">📡 Monitoramento</span>
    <span style="margin-left:auto;display:flex;gap:6px;">
      <span class="mock-badge mock-badge-green">365 🟢</span>
      <span class="mock-badge mock-badge-yellow">18 🟡</span>
      <span class="mock-badge mock-badge-red">6 🔴</span>
    </span>
  </div>
  <div class="mock-body">
    <div class="mock-label">Mapa de saúde (grade de lojas)</div>
    <div style="display:grid;grid-template-columns:repeat(12,1fr);gap:4px;margin-bottom:14px;">
      <span style="height:18px;background:#16a34a;border-radius:3px;"></span><span style="height:18px;background:#16a34a;border-radius:3px;"></span><span style="height:18px;background:#16a34a;border-radius:3px;"></span><span style="height:18px;background:#d97706;border-radius:3px;"></span><span style="height:18px;background:#16a34a;border-radius:3px;"></span><span style="height:18px;background:#16a34a;border-radius:3px;"></span><span style="height:18px;background:#dc2626;border-radius:3px;"></span><span style="height:18px;background:#16a34a;border-radius:3px;"></span><span style="height:18px;background:#16a34a;border-radius:3px;"></span><span style="height:18px;background:#d97706;border-radius:3px;"></span><span style="height:18px;background:#16a34a;border-radius:3px;"></span><span style="height:18px;background:#16a34a;border-radius:3px;"></span>
    </div>
    <div class="mock-label">Alertas ativos</div>
    <div class="mock-row" style="font-size:12px;"><span>🔴</span><span style="flex:1">VarejoX Filial 3 — offline há 42min</span><span class="mock-badge mock-badge-red">Crítico</span></div>
    <div class="mock-row" style="font-size:12px;"><span>🔴</span><span style="flex:1">MercadoBom Sul — integração Rappi caiu</span><span class="mock-badge mock-badge-red">Alto</span></div>
    <div class="mock-row" style="font-size:12px;"><span>🟡</span><span style="flex:1">Padaria Sol — sem pedidos há 12h</span><span class="mock-badge mock-badge-yellow">Médio</span></div>
  </div>
</div>
<p class="mermaid-caption">Wireframe ilustrativo do painel de monitoramento: mapa de saúde (semáforo por loja) e fila de alertas por SLA. Dados de <code>GET /v1/stores/monitoring/summary</code>.</p>

<h2>Painel de monitoramento</h2>
<div class="blueprint-proposed">
  <div class="blueprint-proposed-label">Proposta (alvo)</div>
  <ul>
    <li><strong>Mapa de saúde:</strong> grade de lojas com semáforo — identificar rapidamente quem precisa de atenção</li>
    <li><strong>Timeline de eventos:</strong> erros, desconexões, retornos de integrações em ordem cronológica</li>
    <li><strong>Gráfico de uptime:</strong> barras de 24h com disponibilidade real de cada loja</li>
    <li><strong>Alertas ativos:</strong> lista de lojas em estado crítico com tempo de incidente</li>
  </ul>
</div>

<h2>Cálculo de uptime</h2>
<p>Calculado a partir dos registros em <code>store_errors</code> + pings periódicos (health check a cada 5 min):</p>
<div class="mermaid">
flowchart LR
  JOB[Job healthcheck\na cada 5 min] --> PING[Ping na API da loja]
  PING -->|Ok| UP[Registra: UP]
  PING -->|Falhou| DOWN[Registra: DOWN + store_errors]
  UP --> CALC[Calcula uptime\njanela 24h / 7d / 30d]
  DOWN --> CALC
  DOWN --> ALERTA[Alerta se DOWN > 30 min]
</div>

<h2>Alertas e SLA</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Evento</th><th>Severidade</th><th>SLA resposta</th><th>Quem recebe alerta</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">Loja offline</td><td>Crítico</td><td>2h</td><td>Operador responsável + admin</td></tr>
      <tr><td class="td-bold">Integração desconectada</td><td>Alto</td><td>4h</td><td>Operador responsável</td></tr>
      <tr><td class="td-bold">Erros críticos &gt; 3 em 2h</td><td>Alto</td><td>4h</td><td>Operador responsável</td></tr>
      <tr><td class="td-bold">Sem pedidos em 24h</td><td>Médio</td><td>24h</td><td>Operador (se loja com histórico)</td></tr>
      <tr><td class="td-bold">Uptime &lt; 95% em 24h</td><td>Baixo</td><td>48h</td><td>Dashboard de monitoramento</td></tr>
    </tbody>
  </table>
</div>

<h2>Endpoint proposto</h2>
<pre><code>GET /v1/stores/monitoring/summary
Response:
{
  totalStores: number,
  green: number,
  yellow: number,
  red: number,
  offlineStores: Store[],
  recentAlerts: Alert[]
}

GET /v1/stores/:id/health
Response:
{
  status: 'green' | 'yellow' | 'red',
  uptime24h: number,
  errorCount2h: number,
  lastOrderAt: Date,
  integrationStatus: Record<string, 'ok' | 'warning' | 'error'>
}</code></pre>
`
});
