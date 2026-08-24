WIKI.register({
  id: 'financeiro',
  title: 'Financeiro',
  icon: '💰',
  searchText: 'financeiro assinaturas recebíveis inadimplência MRR ARR receita cobrança billing gateway Stripe status pagamento histórico filtros',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Planos e Financeiro</div>
  <h1 class="section-title">💰 Financeiro</h1>
  <p class="section-subtitle">Módulo financeiro completo — assinaturas ativas, inadimplência, recebíveis e resumo de receita. Evolução do mock atual para dados reais do gateway de billing.</p>
  <div class="section-tags">
    <span class="status-badge status-mock">🔴 Mock hoje</span>
    <span class="status-badge status-proposed">🔵 Dados reais propostos</span>
    <span class="tag-p1">P1</span>
  </div>
</div>

<div class="blueprint-today">
  <div class="blueprint-today-label">Hoje (MVP)</div>
  <ul>
    <li>Página "Financeiro" existe com layout de cards e tabela</li>
    <li>100% mock: receita mensal R$0, zero assinaturas, zero recebíveis</li>
    <li>Filtros de período e status existem mas não afetam dados</li>
    <li>Nenhum endpoint de API financeira implementado</li>
  </ul>
</div>

<div class="blueprint-proposed">
  <div class="blueprint-proposed-label">Proposta (alvo)</div>
  <p>Dados reais a partir da tabela de assinaturas + gateway Stripe. Ver <a href="#faturamento-cobranca">Faturamento e Cobrança</a> para o design detalhado do billing.</p>
</div>

<h2>KPIs do módulo financeiro</h2>
<div class="card-grid">
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">💰</span> MRR atual</div>
    <p>Soma de todas as assinaturas ativas × preço mensal do plano. Fonte: tabela <code>subscriptions</code> + <code>plans</code>.</p>
  </div>
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">📉</span> MRR churned</div>
    <p>Receita perdida no mês por cancelamentos. Calculado na data de encerramento das assinaturas.</p>
  </div>
  <div class="card card-amber">
    <div class="card-title"><span class="card-icon">⚠️</span> Inadimplência</div>
    <p>Total em atraso (faturas vencidas sem pagamento). Com detalhe: valor + dias de atraso + cliente.</p>
  </div>
  <div class="card card-blue">
    <div class="card-title"><span class="card-icon">🏦</span> A receber (30d)</div>
    <p>Faturas com vencimento nos próximos 30 dias. Base para projeção de caixa.</p>
  </div>
</div>

<h2>Mockup — Painel financeiro</h2>
<div class="mockup-container">
  <div class="mock-topbar">
    <span class="mock-logo">💰 Financeiro</span>
    <span style="margin-left:auto;display:flex;gap:6px;">
      <span class="mock-badge mock-badge-teal">Mês atual</span>
      <span class="mock-badge mock-badge-gray">Status ▾</span>
    </span>
  </div>
  <div class="mock-body">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;">
      <div class="mock-kpi"><div class="mock-kpi-value">R$ 248k</div><div class="mock-kpi-sub">MRR atual</div></div>
      <div class="mock-kpi"><div class="mock-kpi-value" style="color:#dc2626">R$ 12k</div><div class="mock-kpi-sub">Inadimplência</div></div>
      <div class="mock-kpi"><div class="mock-kpi-value" style="color:#d97706">R$ 9k</div><div class="mock-kpi-sub">MRR churned</div></div>
      <div class="mock-kpi"><div class="mock-kpi-value" style="color:#16a34a">R$ 261k</div><div class="mock-kpi-sub">A receber (30d)</div></div>
    </div>
    <table class="mock-table">
      <thead><tr><th>Cliente</th><th>Plano</th><th>Valor</th><th>Próx. venc.</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>MercadoBom Ltda</td><td><span class="mock-badge mock-badge-purple">Pro</span></td><td>R$ 1.890</td><td>10/08</td><td><span class="mock-badge mock-badge-green">Ativa</span></td></tr>
        <tr><td>Padaria Sol</td><td><span class="mock-badge mock-badge-teal">Starter</span></td><td>R$ 490</td><td>12/08</td><td><span class="mock-badge mock-badge-green">Ativa</span></td></tr>
        <tr><td>VarejoX S.A.</td><td><span class="mock-badge mock-badge-blue">Enterprise</span></td><td>R$ 4.200</td><td>10/07</td><td><span class="mock-badge mock-badge-red">Em atraso</span></td></tr>
      </tbody>
    </table>
  </div>
</div>
<p class="mermaid-caption">Wireframe ilustrativo do painel financeiro: KPIs (MRR, inadimplência, a receber) e assinaturas ativas. Detalhe do billing em <a href="#faturamento-cobranca">Faturamento e Cobrança</a>.</p>

<h2>Listagem de assinaturas</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Coluna</th><th>Origem</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">Cliente</td><td><code>subscriptions.clientId</code> → clients.name</td><td><span class="status-badge status-proposed">🔵</span></td></tr>
      <tr><td class="td-bold">Plano</td><td><code>subscriptions.planId</code> → plans.name</td><td><span class="status-badge status-proposed">🔵</span></td></tr>
      <tr><td class="td-bold">Valor mensal</td><td><code>plans.priceMonthly</code></td><td><span class="status-badge status-proposed">🔵</span></td></tr>
      <tr><td class="td-bold">Status</td><td><code>subscriptions.status</code></td><td><span class="status-badge status-proposed">🔵</span></td></tr>
      <tr><td class="td-bold">Próximo vencimento</td><td><code>subscriptions.currentPeriodEnd</code></td><td><span class="status-badge status-proposed">🔵</span></td></tr>
      <tr><td class="td-bold">Stripe ID</td><td><code>subscriptions.stripeSubscriptionId</code></td><td><span class="status-badge status-proposed">🔵</span></td></tr>
    </tbody>
  </table>
</div>
`
});
