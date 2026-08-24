WIKI.register({
  id: 'visao-geral',
  title: 'Visão Geral do Admin',
  icon: '🏠',
  searchText: 'visão geral admin citybox painel operadores platform_admin clientes lojas planos financeiro auditoria backoffice blueprint alvo mvp maturidade',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Introdução</div>
  <h1 class="section-title">🏠 Visão Geral do Admin Citybox</h1>
  <p class="section-subtitle">O painel administrativo da Citybox é o centro de controle interno — usado pela equipe de operações para gerenciar clientes, lojas, equipe e configurações da plataforma. Este wiki é o <strong>blueprint de desenvolvimento</strong>: documenta o que existe hoje e projeta o que deve ser construído.</p>
  <div class="section-tags">
    <span class="tag-teal">Uso interno</span>
    <span class="tag-green">Operadores Citybox</span>
    <span class="tag-gray">admin.citybox.com</span>
    <span class="tag-blue">Blueprint</span>
  </div>
</div>

<div class="alert alert-teal">
  <div class="alert-icon">💡</div>
  <div class="alert-body">
    <div class="alert-title">Como ler este wiki</div>
    <p>Cada seção usa dois blocos: <strong>"Hoje (MVP)"</strong> descreve o que está no código agora; <strong>"Proposta (alvo)"</strong> define o que deve ser construído. Os selos indicam o estado atual — <span class="status-badge status-functional">✅ Funcional</span> <span class="status-badge status-mock">🔴 Mock</span> <span class="status-badge status-broken">🔴 Quebrado</span> <span class="status-badge status-partial">🟣 Parcial</span> — e a proposta usa <span class="status-badge status-proposed">🔵 Proposta</span>.</p>
  </div>
</div>

<div class="eco-callout">
  <div class="eco-icon">🧭</div>
  <div class="eco-body">
    <div class="eco-title">Ecossistema Citybox — você está no Admin (gestão da plataforma)</div>
    <div class="eco-links">
      O Admin é o backoffice interno que governa toda a operação. Os lojistas operam no
      <a href="../wiki-erp/wiki-erp/index.html">ERP Base</a>
      (e nas verticais <a href="../wiki-erp/wiki-erp-food/index.html">Food</a> ·
      <a href="../wiki-erp/wiki-erp-market/index.html">Market</a>);
      os consumidores compram pelo <a href="../wiki-marketplace/index.html">Marketplace</a>.
      <br><strong>Princípio:</strong> Admin governa · ERP opera · Marketplace vende.
    </div>
  </div>
</div>

<h2>Tabela de maturidade atual</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Área</th><th>Estado hoje</th><th>Alvo</th><th>Prioridade</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">Clientes (CRUD + lista)</td><td><span class="status-badge status-functional">✅ Funcional</span></td><td>Enriquecer: health score, timeline, exportação</td><td><span class="tag-p1">P1</span></td></tr>
      <tr><td class="td-bold">Clientes (detalhe rico)</td><td><span class="status-badge status-partial">🟣 Parcial</span></td><td>Todas as abas reais: lojas, faturas, auditoria</td><td><span class="tag-p1">P1</span></td></tr>
      <tr><td class="td-bold">Lojas (CRUD + settings)</td><td><span class="status-badge status-functional">✅ Funcional</span></td><td>Reputação, ações em massa, integrações</td><td><span class="tag-p1">P1</span></td></tr>
      <tr><td class="td-bold">Equipe da loja</td><td><span class="status-badge status-functional">✅ Funcional</span></td><td>Convite em massa, RBAC granular por membro</td><td><span class="tag-p2">P2</span></td></tr>
      <tr><td class="td-bold">Usuários Citybox</td><td><span class="status-badge status-partial">🟣 Parcial</span></td><td>RBAC granular real, fix do platform_operator</td><td><span class="tag-p1">P1</span></td></tr>
      <tr><td class="td-bold">Dashboard</td><td><span class="status-badge status-mock">🔴 Mock</span></td><td>Métricas reais: MRR, churn, NRR, cohorts</td><td><span class="tag-p1">P1</span></td></tr>
      <tr><td class="td-bold">Planos</td><td><span class="status-badge status-partial">🟣 Parcial</span></td><td>CRUD real, vínculo com assinaturas</td><td><span class="tag-p1">P1</span></td></tr>
      <tr><td class="td-bold">Financeiro</td><td><span class="status-badge status-mock">🔴 Mock</span></td><td>Assinaturas, recebíveis, gateway real</td><td><span class="tag-p1">P1</span></td></tr>
      <tr><td class="td-bold">Auditoria global</td><td><span class="status-badge status-broken">🔴 Quebrado</span></td><td>Trilha completa + exportação</td><td><span class="tag-p2">P2</span></td></tr>
      <tr><td class="td-bold">Configurações globais</td><td><span class="status-badge status-broken">🔴 Quebrado</span></td><td>Settings, verticais, feature flags</td><td><span class="tag-p2">P2</span></td></tr>
      <tr><td class="td-bold">Notificações</td><td><span class="status-badge status-broken">🔴 Ausente</span></td><td>Centro de notificações + broadcast</td><td><span class="tag-p2">P2</span></td></tr>
      <tr><td class="td-bold">Saúde / churn</td><td><span class="status-badge status-broken">🔴 Ausente</span></td><td>Health score 0–100, alertas, dunning</td><td><span class="tag-p1">P1</span></td></tr>
      <tr><td class="td-bold">Impersonation</td><td><span class="status-badge status-mock">🔴 Mock visual</span></td><td>Acessar como (auditado)</td><td><span class="tag-p2">P2</span></td></tr>
      <tr><td class="td-bold">Relatórios / exportação</td><td><span class="status-badge status-broken">🔴 Ausente</span></td><td>CSV/PDF, relatórios agendados</td><td><span class="tag-p2">P2</span></td></tr>
      <tr><td class="td-bold">Onboarding guiado</td><td><span class="status-badge status-broken">🔴 Ausente</span></td><td>Checklist de go-live por cliente/loja</td><td><span class="tag-p2">P2</span></td></tr>
      <tr><td class="td-bold">Integrações (iFood, Stone)</td><td><span class="status-badge status-partial">🟣 Parcial</span></td><td>Conectar, configurar, webhooks, logs</td><td><span class="tag-p2">P2</span></td></tr>
    </tbody>
  </table>
</div>

<h2>O que o Admin cobre (visão-alvo)</h2>
<div class="card-grid">
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">🤝</span> Gestão de Clientes</div>
    <p>Cadastro PF/PJ, health score, jornada de onboarding, timeline de ações, exportação. Régua de cobrança e ciclo de vida completo.</p>
  </div>
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">🏪</span> Gestão de Lojas</div>
    <p>CRUD, settings, módulos por vertical, reputação (semáforo), monitoramento de uptime, integrações (iFood, Stone, gateways).</p>
  </div>
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">👥</span> Equipe da Loja</div>
    <p>CRUD de membros Keycloak, RBAC granular por cargo, convites em massa, senha provisória, auditoria de ações.</p>
  </div>
  <div class="card card-blue">
    <div class="card-title"><span class="card-icon">📊</span> Dashboard & Analytics</div>
    <p>MRR/ARR/NRR reais, gráficos de churn, cohort retention, alertas operacionais e filtro de período funcional.</p>
  </div>
  <div class="card card-blue">
    <div class="card-title"><span class="card-icon">💳</span> Billing Completo</div>
    <p>Planos com Stripe, assinaturas recorrentes, PIX/boleto/cartão, NF-e/NFS-e, repasses (settlements), dunning automático.</p>
  </div>
  <div class="card card-blue">
    <div class="card-title"><span class="card-icon">🛡️</span> RBAC Granular</div>
    <p>Permissões por módulo para operadores Citybox. Fix do platform_operator que hoje toma 403. Impersonation auditada.</p>
  </div>
  <div class="card card-amber">
    <div class="card-title"><span class="card-icon">🔔</span> Notificações & Comunicados</div>
    <p>Centro de notificações para o operador + broadcasts para lojistas (comunicados de manutenção, novidades, cobrança).</p>
  </div>
  <div class="card card-amber">
    <div class="card-title"><span class="card-icon">📋</span> Relatórios & Exportação</div>
    <p>Módulo de relatórios com exportação CSV/PDF, relatórios agendados por e-mail e integração com BI externo.</p>
  </div>
</div>

<h2>Quem usa o Admin?</h2>
<div class="card card-teal">
  <div class="card-title">Perfis de acesso (alvo)</div>
  <div class="table-wrap" style="margin-top:12px">
    <table>
      <thead><tr><th>Perfil</th><th>Keycloak Role</th><th>Acesso</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Administrador</td><td><code>platform_admin</code></td><td>Acesso completo — configurações, billing, convites, auditoria global</td></tr>
        <tr><td class="td-bold">Operador</td><td><code>platform_operator</code></td><td>Clientes, lojas, equipe, onboarding (sem billing e configurações globais)</td></tr>
        <tr><td class="td-bold">Financeiro</td><td><code>platform_finance</code> <span class="status-badge status-proposed">🔵 Proposta</span></td><td>Apenas módulo financeiro, assinaturas e faturas</td></tr>
        <tr><td class="td-bold">Suporte</td><td><code>platform_support</code> <span class="status-badge status-proposed">🔵 Proposta</span></td><td>Visualização + impersonation (somente leitura)</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
