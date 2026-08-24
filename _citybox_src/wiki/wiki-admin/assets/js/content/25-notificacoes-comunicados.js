WIKI.register({
  id: 'notificacoes-comunicados',
  title: 'Notificações e Comunicados',
  icon: '🔔',
  searchText: 'notificações comunicados inbox broadcast mensagens operador lojistas centro notificações alertas avisos manutenção cobrança segmentação',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Plataforma</div>
  <h1 class="section-title">🔔 Notificações e Comunicados</h1>
  <p class="section-subtitle">Centro de notificações para o operador Citybox e sistema de comunicados broadcast para lojistas — alertas operacionais, avisos de manutenção, cobrança e novidades.</p>
  <div class="section-tags">
    <span class="tag-teal">Centro de notificações</span>
    <span class="tag-blue">Broadcast para lojistas</span>
    <span class="status-badge status-proposed">🔵 Feature nova</span>
    <span class="tag-p2">P2</span>
  </div>
</div>

<h2>Dois sistemas distintos</h2>
<div class="card-grid">
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">🔔</span> Inbox do operador</div>
    <p>Notificações geradas pela plataforma para o operador: alertas de saúde, clientes at-risk, faturas vencidas, integrações desconectadas.</p>
    <p><strong>Onde aparece:</strong> ícone de sino no header do Admin com contador de não lidas.</p>
  </div>
  <div class="card card-blue">
    <div class="card-title"><span class="card-icon">📢</span> Broadcast para lojistas</div>
    <p>Comunicados enviados pelo operador para grupos de lojistas: avisos de manutenção, novas funcionalidades, alertas de cobrança.</p>
    <p><strong>Onde aparece:</strong> inbox do lojista no ERP + e-mail.</p>
  </div>
</div>

<h2>Inbox do operador — tipos de notificação</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Tipo</th><th>Gatilho</th><th>Prioridade</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">health_alert</td><td>Health score caiu &lt; 40 ou &gt; 20 pontos em 7d</td><td>🔴 Alto</td></tr>
      <tr><td class="td-bold">store_offline</td><td>Loja offline &gt; 30 min</td><td>🔴 Crítico</td></tr>
      <tr><td class="td-bold">integration_down</td><td>Integração desconectada</td><td>🔴 Alto</td></tr>
      <tr><td class="td-bold">invoice_overdue</td><td>Fatura vencida &gt; 7 dias</td><td>🟡 Médio</td></tr>
      <tr><td class="td-bold">new_client</td><td>Novo cliente criado</td><td>🟢 Info</td></tr>
      <tr><td class="td-bold">onboarding_complete</td><td>Lojista completou go-live checklist</td><td>🟢 Info</td></tr>
    </tbody>
  </table>
</div>

<h2>Criação de comunicado (broadcast)</h2>
<div class="mermaid">
flowchart LR
  A[Novo comunicado] --> B[Título + mensagem rich text]
  B --> C[Tipo: informativo / manutenção / cobrança]
  C --> D[Segmentação:\nTodos / Por vertical / Por plano / Por status]
  D --> E[Canais: Inbox ERP e/ou E-mail]
  E --> F[Agendar ou enviar agora]
  F --> G[Preview + confirmar]
  G --> H[Notificação enviada para N lojistas]
</div>

<h2>Interface de notificações</h2>
<div class="blueprint-proposed">
  <div class="blueprint-proposed-label">Proposta (alvo)</div>
  <ul>
    <li><strong>Sino no header</strong> com badge de contagem de não lidas</li>
    <li>Dropdown com as últimas 10 notificações + link para "Ver todas"</li>
    <li>Página <code>/notifications</code>: lista completa com filtros por tipo/prioridade, mark as read em massa</li>
    <li>Página <code>/communications</code>: histórico de broadcasts enviados + métricas (enviados/lidos/% abertura)</li>
  </ul>
</div>
`
});
