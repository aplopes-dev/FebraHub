WIKI.register({
  id: 'dashboard',
  title: 'Dashboard',
  icon: '📊',
  searchText: 'dashboard painel métricas MRR ARR NRR churn cohort retention clientes ativos lojas assinantes inadimplentes crescimento gráfico operacional alertas filtro período',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Visão Geral</div>
  <h1 class="section-title">📊 Dashboard</h1>
  <p class="section-subtitle">Suite de métricas SaaS — visão executiva completa da base instalada Citybox com KPIs reais, gráficos de crescimento e alertas operacionais.</p>
  <div class="section-tags">
    <span class="tag-amber">🔴 Mock hoje</span>
    <span class="status-badge status-proposed">🔵 Proposta: dados reais</span>
  </div>
</div>

<div class="blueprint-today">
  <div class="blueprint-today-label">Hoje (MVP)</div>
  <ul>
    <li>100% alimentado por mocks em <code>features/dashboard/data/mock-platform-dashboard.ts</code></li>
    <li>Gráficos existem (pulse, pizza de planos, status clientes/lojas/assinaturas, verticais, feed, top clientes, alertas) mas todos com dados hardcoded</li>
    <li>Seletor de período no header existe mas não afeta nenhum número</li>
    <li>Links do feed apontam para <code>/audit</code> que está quebrado (404)</li>
    <li>Nenhum endpoint de API dedicado ao dashboard</li>
  </ul>
</div>

<div class="blueprint-proposed">
  <div class="blueprint-proposed-label">Proposta (alvo)</div>
  <p>Dashboard integrado à API com métricas calculadas a partir do banco e atualizadas periodicamente por jobs. Filtro de período real. Feed de atividade a partir da auditoria global.</p>
</div>

<h2>Mockup — Dashboard executivo</h2>
<div class="mockup-container">
  <div class="mock-topbar">
    <span class="mock-logo">📊 Visão da Plataforma</span>
    <span style="margin-left:auto;display:flex;gap:6px;">
      <span class="mock-badge mock-badge-teal">30 dias</span>
      <span class="mock-badge mock-badge-gray">Exportar</span>
    </span>
  </div>
  <div class="mock-body">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;">
      <div class="mock-kpi"><div class="mock-kpi-value">R$ 248k</div><div class="mock-kpi-sub">MRR · ▲ 6,2%</div></div>
      <div class="mock-kpi"><div class="mock-kpi-value">142</div><div class="mock-kpi-sub">Clientes ativos</div></div>
      <div class="mock-kpi"><div class="mock-kpi-value" style="color:#dc2626">7</div><div class="mock-kpi-sub">At-risk</div></div>
      <div class="mock-kpi"><div class="mock-kpi-value" style="color:#16a34a">389</div><div class="mock-kpi-sub">Lojas operacionais</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:12px;">
      <div>
        <div class="mock-label">MRR — últimos 12 meses</div>
        <div style="display:flex;align-items:flex-end;gap:4px;height:90px;background:#fff;border:1px solid var(--border-color);border-radius:8px;padding:10px;">
          <div style="flex:1;height:40%;background:#99f6e4;border-radius:3px 3px 0 0;"></div>
          <div style="flex:1;height:52%;background:#5eead4;border-radius:3px 3px 0 0;"></div>
          <div style="flex:1;height:48%;background:#5eead4;border-radius:3px 3px 0 0;"></div>
          <div style="flex:1;height:63%;background:#2dd4bf;border-radius:3px 3px 0 0;"></div>
          <div style="flex:1;height:70%;background:#14b8a6;border-radius:3px 3px 0 0;"></div>
          <div style="flex:1;height:82%;background:#0d9488;border-radius:3px 3px 0 0;"></div>
          <div style="flex:1;height:100%;background:#0f766e;border-radius:3px 3px 0 0;"></div>
        </div>
      </div>
      <div>
        <div class="mock-label">Feed de atividade</div>
        <div class="mock-row" style="font-size:12px;"><span>🟢</span><span style="flex:1">Loja "Padaria Sol" ativada</span><span style="color:var(--text-muted)">2min</span></div>
        <div class="mock-row" style="font-size:12px;"><span>💳</span><span style="flex:1">Fatura #4821 paga</span><span style="color:var(--text-muted)">18min</span></div>
        <div class="mock-row" style="font-size:12px;"><span>🔴</span><span style="flex:1">Cliente "VarejoX" at-risk</span><span style="color:var(--text-muted)">1h</span></div>
        <div class="mock-row" style="font-size:12px;"><span>🤝</span><span style="flex:1">Novo cliente "MercadoBom"</span><span style="color:var(--text-muted)">3h</span></div>
      </div>
    </div>
  </div>
</div>
<p class="mermaid-caption">Wireframe ilustrativo do dashboard SaaS: KPIs executivos, série de MRR e feed da auditoria global. Dados reais virão de <code>GET /v1/dashboard/summary</code>.</p>

<h2>Seção 1 — KPIs principais</h2>
<div class="card-grid">
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">💰</span> MRR</div>
    <p>Monthly Recurring Revenue total. Soma de todas as assinaturas ativas. Variação vs mês anterior em %.</p>
    <p><span class="status-badge status-proposed">🔵 Requer billing real</span></p>
  </div>
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">📈</span> ARR</div>
    <p>Annual Recurring Revenue = MRR × 12. Métrica de referência para investidores e board.</p>
    <p><span class="status-badge status-proposed">🔵 Requer billing real</span></p>
  </div>
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">🔄</span> NRR</div>
    <p>Net Revenue Retention — receita retida após expansões e cancelamentos. Alvo: NRR &gt; 100%.</p>
    <p><span class="status-badge status-proposed">🔵 Requer billing real</span></p>
  </div>
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">🤝</span> Clientes ativos</div>
    <p>Total de clientes com status "ativo". Direto da tabela <code>clients</code>.</p>
    <p><span class="status-badge status-functional">✅ Disponível (API)</span></p>
  </div>
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">🏪</span> Lojas operacionais</div>
    <p>Lojas com status "ativa" e visível no app. Da tabela <code>stores</code>.</p>
    <p><span class="status-badge status-functional">✅ Disponível (API)</span></p>
  </div>
  <div class="card card-amber">
    <div class="card-title"><span class="card-icon">⚠️</span> Churn rate</div>
    <p>% de clientes cancelados no período selecionado. Comparativo vs período anterior.</p>
    <p><span class="status-badge status-proposed">🔵 Requer billing real</span></p>
  </div>
  <div class="card card-amber">
    <div class="card-title"><span class="card-icon">🔴</span> At-risk</div>
    <p>Clientes com health score abaixo de 40. Badge de urgência se subiu &gt; 20% vs semana anterior.</p>
    <p><span class="status-badge status-proposed">🔵 Requer health score</span></p>
  </div>
  <div class="card card-blue">
    <div class="card-title"><span class="card-icon">👥</span> Equipe Citybox</div>
    <p>Número de operadores ativos. Da tabela <code>users</code>.</p>
    <p><span class="status-badge status-functional">✅ Disponível (API)</span></p>
  </div>
</div>

<h2>Seção 2 — Gráficos</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Gráfico</th><th>Tipo</th><th>Dados</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">MRR ao longo do tempo</td><td>Linha</td><td>MRR mensal dos últimos 12 meses</td><td><span class="status-badge status-proposed">🔵</span></td></tr>
      <tr><td class="td-bold">Crescimento de clientes</td><td>Barra empilhada</td><td>Novos clientes por mês vs churned</td><td><span class="status-badge status-proposed">🔵</span></td></tr>
      <tr><td class="td-bold">Distribuição de planos</td><td>Pizza</td><td>% Starter / Pro / Enterprise</td><td><span class="status-badge status-proposed">🔵</span></td></tr>
      <tr><td class="td-bold">Status de clientes</td><td>Pizza</td><td>Ativo / Inadimplente / Suspenso</td><td><span class="status-badge status-functional">✅ (dados reais possíveis)</span></td></tr>
      <tr><td class="td-bold">Distribuição de verticais</td><td>Barra</td><td>% lojas por vertical</td><td><span class="status-badge status-functional">✅ (dados reais possíveis)</span></td></tr>
      <tr><td class="td-bold">Cohort retention heatmap</td><td>Heatmap</td><td>% retenção por coorte mensal</td><td><span class="status-badge status-proposed">🔵 v2</span></td></tr>
    </tbody>
  </table>
</div>

<h2>Seção 3 — Alertas e feed de atividade</h2>
<div class="blueprint-proposed">
  <div class="blueprint-proposed-label">Proposta (alvo)</div>
  <ul>
    <li><strong>Alertas críticos:</strong> clientes at-risk (health score &lt; 40), lojas offline há mais de X horas, faturas vencidas sem resposta, integrações desconectadas</li>
    <li><strong>Feed de atividade:</strong> últimas ações registradas na auditoria global — novo cliente, loja ativada, fatura paga, etc.</li>
    <li><strong>Top 5 clientes por MRR:</strong> com delta vs mês anterior e indicador de saúde</li>
    <li><strong>Lojas com problemas:</strong> mini-lista das lojas em modo manutenção ou com erros recentes</li>
  </ul>
</div>

<h2>Filtro de período</h2>
<p>O seletor de período (7d / 30d / 90d / personalizado) deve filtrar todos os gráficos e KPIs variáveis (MRR delta, churn, novos clientes). KPIs absolutos (total de clientes ativos) são sempre do momento atual.</p>

<h2>Endpoint proposto</h2>
<pre><code>GET /v1/dashboard/summary?period=30d

Response:
{
  mrr: number,           // em centavos
  mrrDelta: number,      // % vs período anterior
  arr: number,
  nrr: number,
  activeClients: number,
  churnedClients: number,
  churnRate: number,
  activeStores: number,
  atRiskClients: number,
  newClients: number,
  recentActivity: AuditEvent[]
}</code></pre>
`
});
