WIKI.register({
  id: 'cliente-detalhe',
  title: 'Detalhe do Cliente',
  icon: '👤',
  searchText: 'detalhe cliente abas lojas assinaturas faturas auditoria mensagens health timeline editar bloquear impersonation histórico ações',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Clientes</div>
  <h1 class="section-title">👤 Detalhe do Cliente</h1>
  <p class="section-subtitle">Visão 360° de um cliente — dados cadastrais, lojas, billing, saúde, timeline de ações e comunicação direta.</p>
  <div class="section-tags">
    <span class="status-badge status-partial">🟣 Parcial hoje</span>
    <span class="status-badge status-proposed">🔵 Abas reais propostas</span>
  </div>
</div>

<div class="blueprint-today">
  <div class="blueprint-today-label">Hoje (MVP)</div>
  <ul>
    <li>Header com nome, CNPJ, status, plano (string), data de criação</li>
    <li>Aba "Informações" — dados cadastrais editáveis</li>
    <li>Aba "Lojas" — lista as lojas do cliente (funcional)</li>
    <li>Aba "Assinaturas" — layout existe mas dados mock</li>
    <li>Aba "Relatórios" — placeholder vazio</li>
    <li>Aba "Permissões" — placeholder vazio</li>
    <li>Botão "Acessar como cliente" — handler é console.log</li>
    <li>Botão de editar leva ao mesmo formulário multi-step</li>
  </ul>
</div>

<div class="blueprint-proposed">
  <div class="blueprint-proposed-label">Proposta (alvo)</div>
  <p>Todas as abas com dados reais. Novas abas: Billing (faturas/assinaturas), Saúde, Comunicação, Auditoria. Impersonation funcional com motivo obrigatório.</p>
</div>

<h2>Mockup — Detalhe do cliente (visão 360°)</h2>
<div class="mockup-container">
  <div class="mock-topbar">
    <span class="mock-logo">👤 VarejoX S.A.</span>
    <span style="margin-left:auto;display:flex;gap:6px;">
      <span class="mock-badge mock-badge-red">Inadimplente</span>
      <span class="mock-badge mock-badge-gray">Acessar como</span>
    </span>
  </div>
  <div class="mock-body">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;">
      <div class="mock-kpi"><div class="mock-kpi-value" style="color:#dc2626">31</div><div class="mock-kpi-sub">Health Score</div></div>
      <div class="mock-kpi"><div class="mock-kpi-value">R$ 4.2k</div><div class="mock-kpi-sub">MRR</div></div>
      <div class="mock-kpi"><div class="mock-kpi-value">8</div><div class="mock-kpi-sub">Lojas</div></div>
      <div class="mock-kpi"><div class="mock-kpi-value" style="color:#d97706">2</div><div class="mock-kpi-sub">Faturas vencidas</div></div>
    </div>
    <div class="mock-row" style="gap:4px;margin-bottom:10px;">
      <span class="mock-badge mock-badge-teal">Dados</span>
      <span class="mock-badge mock-badge-gray">Lojas</span>
      <span class="mock-badge mock-badge-gray">Billing</span>
      <span class="mock-badge mock-badge-gray">Saúde</span>
      <span class="mock-badge mock-badge-gray">Timeline</span>
      <span class="mock-badge mock-badge-gray">Auditoria</span>
    </div>
    <table class="mock-table">
      <thead><tr><th>Fatura</th><th>Venc.</th><th>Valor</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>#4821</td><td>10/06</td><td>R$ 4.200</td><td><span class="mock-badge mock-badge-green">Paga</span></td></tr>
        <tr><td>#4902</td><td>10/07</td><td>R$ 4.200</td><td><span class="mock-badge mock-badge-red">Vencida</span></td></tr>
        <tr><td>#4988</td><td>10/08</td><td>R$ 4.200</td><td><span class="mock-badge mock-badge-yellow">Pendente</span></td></tr>
      </tbody>
    </table>
  </div>
</div>
<p class="mermaid-caption">Wireframe ilustrativo da visão 360°: header com health/MRR, abas reais (Dados, Lojas, Billing, Saúde, Timeline, Auditoria) e snapshot de faturas.</p>

<h2>Estrutura de abas proposta</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Aba</th><th>Conteúdo</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">📋 Dados gerais</td><td>Cadastro, responsável, endereço, documento — editável</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">🏪 Lojas</td><td>Lista de lojas com status, vertical, ações rápidas</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">💳 Billing</td><td>Plano atual, assinatura, faturas (lista + status), próxima cobrança</td><td><span class="status-badge status-mock">🔴 Mock</span></td></tr>
      <tr><td class="td-bold">❤️ Saúde</td><td>Health score, sinais que compõem o score, evolução temporal, risco de churn</td><td><span class="status-badge status-proposed">🔵</span></td></tr>
      <tr><td class="td-bold">📋 Timeline</td><td>Feed cronológico de eventos do cliente (criação, bloqueios, faturas, mudanças de plano)</td><td><span class="status-badge status-proposed">🔵</span></td></tr>
      <tr><td class="td-bold">💬 Comunicação</td><td>Histórico de mensagens diretas e broadcasts enviados para este cliente</td><td><span class="status-badge status-proposed">🔵</span></td></tr>
      <tr><td class="td-bold">📑 Auditoria</td><td>Ações de operadores Citybox sobre este cliente</td><td><span class="status-badge status-proposed">🔵</span></td></tr>
    </tbody>
  </table>
</div>

<h2>Header do detalhe</h2>
<ul>
  <li>Avatar + nome + CNPJ/CPF + razão social</li>
  <li>Plano com badge colorido</li>
  <li>Status com badge (ativo/inadimplente/suspenso/bloqueado)</li>
  <li><strong>Health Score</strong> visível no header — semáforo + número</li>
  <li><strong>MRR mensal</strong> do cliente</li>
  <li>Botões de ação: Editar · Bloquear/Desbloquear · Acessar como (impersonation) · Exportar</li>
</ul>

<h2>Aba Billing — proposta</h2>
<div class="mermaid">
flowchart LR
  A[Plano atual] --> B[Assinatura ativa\nData início + renovação + método]
  B --> C[Histórico de faturas]
  C --> D[Fatura 1: paga]
  C --> E[Fatura 2: vencida]
  C --> F[Fatura 3: pendente]
  E --> G[Acionar dunning manual]
</div>
`
});
