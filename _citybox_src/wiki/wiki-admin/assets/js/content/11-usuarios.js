WIKI.register({
  id: 'usuarios',
  title: 'Usuários Citybox',
  icon: '🧑‍💼',
  searchText: 'usuários Citybox operadores admin equipe interno cargo roles Keycloak criar editar desativar 2FA RBAC auditoria ações',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Equipe Citybox</div>
  <h1 class="section-title">🧑‍💼 Usuários Citybox</h1>
  <p class="section-subtitle">Gestão dos operadores internos da Citybox — CRUD vinculado ao RBAC granular, auditoria de ações e controle de acesso fino.</p>
  <div class="section-tags">
    <span class="status-badge status-partial">🟣 Parcial hoje</span>
    <span class="status-badge status-proposed">🔵 RBAC granular proposto</span>
  </div>
</div>

<div class="blueprint-today">
  <div class="blueprint-today-label">Hoje (MVP)</div>
  <ul>
    <li>Listagem de usuários Citybox com nome, e-mail, role (platform_admin/operator), status, criado em</li>
    <li>Criação: nome, e-mail, role (combo) — sem permissões granulares</li>
    <li>Edição de role e status (ativo/inativo)</li>
    <li>Usuário criado no Keycloak realm <code>citybox</code></li>
    <li>Bug: usuário com role <code>platform_operator</code> toma 403 na API (ver <a href="#rbac-permissoes">RBAC</a>)</li>
    <li>Sem histórico de ações do operador visível nesta tela</li>
  </ul>
</div>

<div class="blueprint-proposed">
  <div class="blueprint-proposed-label">Proposta (alvo)</div>
  <ul>
    <li>Conectar ao sistema de permissões granulares (correção do platform_operator)</li>
    <li>Nova seção "Permissões" no formulário com a matriz de acessos por módulo</li>
    <li>Novas roles: <code>platform_finance</code>, <code>platform_support</code></li>
    <li>2FA obrigatório para <code>platform_admin</code> (configurado via Keycloak)</li>
    <li>Histórico de ações do operador visível no detalhe do usuário (últimas 50 ações)</li>
    <li>Botão "Revogar sessões" para encerrar todas as sessões ativas de um operador</li>
  </ul>
</div>

<h2>Mockup — Usuários Citybox</h2>
<div class="mockup-container">
  <div class="mock-topbar">
    <span class="mock-logo">🧑‍💼 Equipe Citybox</span>
    <span style="margin-left:auto;display:flex;gap:6px;">
      <span class="mock-badge mock-badge-teal">14 operadores</span>
      <span class="mock-badge mock-badge-gray">+ Novo usuário</span>
    </span>
  </div>
  <div class="mock-body">
    <table class="mock-table">
      <thead><tr><th>Usuário</th><th>Role</th><th>2FA</th><th>Status</th><th>Ação</th></tr></thead>
      <tbody>
        <tr><td><strong>Ana Souza</strong><br><span style="color:var(--text-muted);font-size:11px">ana@citybox.com</span></td><td><span class="mock-badge mock-badge-purple">platform_admin</span></td><td><span class="mock-badge mock-badge-green">✓</span></td><td><span class="mock-badge mock-badge-green">Ativo</span></td><td><span class="mock-badge mock-badge-gray">Editar</span></td></tr>
        <tr><td><strong>Bruno Lima</strong><br><span style="color:var(--text-muted);font-size:11px">bruno@citybox.com</span></td><td><span class="mock-badge mock-badge-teal">platform_support</span></td><td><span class="mock-badge mock-badge-gray">—</span></td><td><span class="mock-badge mock-badge-green">Ativo</span></td><td><span class="mock-badge mock-badge-gray">Editar</span></td></tr>
        <tr><td><strong>Carla Dias</strong><br><span style="color:var(--text-muted);font-size:11px">carla@citybox.com</span></td><td><span class="mock-badge mock-badge-blue">platform_finance</span></td><td><span class="mock-badge mock-badge-green">✓</span></td><td><span class="mock-badge mock-badge-yellow">Convite</span></td><td><span class="mock-badge mock-badge-gray">Editar</span></td></tr>
      </tbody>
    </table>
  </div>
</div>
<p class="mermaid-caption">Wireframe ilustrativo da gestão de operadores internos: role do RBAC granular, indicador de 2FA e status. Usuários provisionados no Keycloak realm <code>citybox</code>.</p>

<h2>Roles de usuário Citybox</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Role</th><th>Quem é</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">platform_admin</td><td>Administrador pleno — acesso total</td><td><span class="status-badge status-functional">✅ Funcional</span></td></tr>
      <tr><td class="td-bold">platform_operator</td><td>Operador de suporte/implantação</td><td><span class="status-badge status-broken">🔴 403 na API</span></td></tr>
      <tr><td class="td-bold">platform_admin_client</td><td>Role intermediária técnica</td><td><span class="status-badge status-partial">🟣 Parcial</span></td></tr>
      <tr><td class="td-bold">platform_finance</td><td>Responsável financeiro</td><td><span class="status-badge status-proposed">🔵 Proposta</span></td></tr>
      <tr><td class="td-bold">platform_support</td><td>Agente de suporte</td><td><span class="status-badge status-proposed">🔵 Proposta</span></td></tr>
    </tbody>
  </table>
</div>
`
});
