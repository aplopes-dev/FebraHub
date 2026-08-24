WIKI.register({
  id: 'auditoria',
  title: 'Auditoria',
  icon: '🔍',
  searchText: 'auditoria trilha ações operadores log eventos global exportação histórico segurança compliance rota 404 broken',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Compliance</div>
  <h1 class="section-title">🔍 Auditoria</h1>
  <p class="section-subtitle">Trilha de auditoria global — ações dos operadores Citybox e eventos críticos da plataforma. Hoje o endpoint global está ausente (404).</p>
  <div class="section-tags">
    <span class="status-badge status-broken">🔴 Auditoria global: 404</span>
    <span class="status-badge status-functional">✅ Audit log por loja: funcional</span>
    <span class="status-badge status-proposed">🔵 Auditoria global proposta</span>
  </div>
</div>

<div class="blueprint-today">
  <div class="blueprint-today-label">Hoje (MVP)</div>
  <ul>
    <li><strong>Audit log por loja:</strong> funcional — tabela <code>store_audit_events</code> com paginação, filtros, exportação por loja</li>
    <li><strong>Auditoria global (<code>/platform/team-audit</code>):</strong> rota existe no menu mas retorna 404 — endpoint inexistente na API</li>
    <li>Nenhum registro de ações dos próprios operadores Citybox (quem bloqueou um cliente? quem alterou um plano?)</li>
  </ul>
</div>

<div class="blueprint-proposed">
  <div class="blueprint-proposed-label">Proposta (alvo)</div>
  <ul>
    <li>Tabela <code>platform_audit_events</code> na API para ações de operadores Citybox</li>
    <li>Cada mutation crítica registra automaticamente: quem, o quê, quando, IP, entidade afetada</li>
    <li>Endpoint <code>GET /v1/platform/audit</code> com filtros ricos e paginação</li>
    <li>Exportação CSV/PDF do período</li>
    <li>Eventos de auditoria de impersonation: início, ações executadas, encerramento</li>
  </ul>
</div>

<h2>Mockup — Trilha de auditoria global</h2>
<div class="mockup-container">
  <div class="mock-topbar">
    <span class="mock-logo">🔍 Auditoria da Plataforma</span>
    <span style="margin-left:auto;display:flex;gap:6px;">
      <span class="mock-badge mock-badge-teal">Período ▾</span>
      <span class="mock-badge mock-badge-gray">Operador ▾</span>
      <span class="mock-badge mock-badge-gray">Exportar CSV</span>
    </span>
  </div>
  <div class="mock-body">
    <table class="mock-table">
      <thead><tr><th>Quando</th><th>Operador</th><th>Ação</th><th>Entidade</th><th>IP</th></tr></thead>
      <tbody>
        <tr><td>14:32</td><td>Ana Souza</td><td><span class="mock-badge mock-badge-red">client.blocked</span></td><td>VarejoX S.A.</td><td>200.1.2.3</td></tr>
        <tr><td>14:05</td><td>Bruno Lima</td><td><span class="mock-badge mock-badge-amber">store.module.enabled</span></td><td>Padaria Sol</td><td>200.1.2.7</td></tr>
        <tr><td>13:48</td><td>Ana Souza</td><td><span class="mock-badge mock-badge-purple">impersonation.start</span></td><td>MercadoBom Ltda</td><td>200.1.2.3</td></tr>
        <tr><td>11:20</td><td>Carla Dias</td><td><span class="mock-badge mock-badge-blue">plan.changed</span></td><td>MercadoBom Ltda</td><td>200.1.2.9</td></tr>
      </tbody>
    </table>
  </div>
</div>
<p class="mermaid-caption">Wireframe ilustrativo da auditoria global proposta (<code>GET /v1/platform/audit</code>): quem, o quê, quando, IP e diff antes/depois por evento.</p>

<h2>Eventos auditáveis</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Evento</th><th>Entidade</th><th>Criticidade</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">Cliente criado/editado/bloqueado/excluído</td><td>Client</td><td>🔴 Alto</td></tr>
      <tr><td class="td-bold">Loja criada/editada/bloqueada</td><td>Store</td><td>🔴 Alto</td></tr>
      <tr><td class="td-bold">Módulo ativado/desativado</td><td>StoreModule</td><td>🟡 Médio</td></tr>
      <tr><td class="td-bold">Membro da loja criado/removido</td><td>StoreMember</td><td>🔴 Alto</td></tr>
      <tr><td class="td-bold">Usuário Citybox criado/editado/desativado</td><td>User</td><td>🔴 Crítico</td></tr>
      <tr><td class="td-bold">Role de usuário alterada</td><td>User</td><td>🔴 Crítico</td></tr>
      <tr><td class="td-bold">Impersonation iniciada/encerrada</td><td>Impersonation</td><td>🔴 Crítico</td></tr>
      <tr><td class="td-bold">Plano do cliente alterado</td><td>Client/Subscription</td><td>🔴 Alto</td></tr>
      <tr><td class="td-bold">Feature flag ativada/desativada</td><td>FeatureFlag</td><td>🟡 Médio</td></tr>
      <tr><td class="td-bold">Configuração da plataforma alterada</td><td>Settings</td><td>🔴 Crítico</td></tr>
      <tr><td class="td-bold">Login de operador / falha de login</td><td>User/Session</td><td>🟡 Médio</td></tr>
    </tbody>
  </table>
</div>

<h2>Interface proposta</h2>
<ul>
  <li>Tabela com: timestamp, operador (nome + avatar), ação, entidade afetada (link), IP, ambiente</li>
  <li>Filtros: período, operador, tipo de evento, entidade</li>
  <li>Busca por ID de entidade ou nome</li>
  <li>Exportação CSV do período filtrado</li>
  <li>Detalhe expandível: payload antes e depois da alteração (diff)</li>
</ul>

<h2>Schema proposto</h2>
<pre><code>model PlatformAuditEvent {
  id         String   @id @default(cuid())
  userId     String   // Operador que executou a ação
  action     String   // 'client.blocked', 'store.module.enabled', etc.
  entityType String   // 'Client' | 'Store' | 'User' | ...
  entityId   String
  before     Json?    // Estado anterior
  after      Json?    // Estado após
  ip         String?
  userAgent  String?
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
}</code></pre>
`
});
