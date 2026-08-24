WIKI.register({
  id: 'rbac-permissoes',
  title: 'RBAC e Permissões',
  icon: '🛡️',
  searchText: 'RBAC permissões granulares matriz papel modulo clientes lojas billing auditoria configurações platform_admin platform_operator platform_finance platform_support fix 403 guard resolvePermissions',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Acesso, Perfis e Permissões</div>
  <h1 class="section-title">🛡️ RBAC e Permissões</h1>
  <p class="section-subtitle">Modelo completo de controle de acesso baseado em papéis — matriz de permissão por módulo, correção do bug do platform_operator e design das novas roles.</p>
  <div class="section-tags">
    <span class="tag-blue">RBAC</span>
    <span class="tag-teal">Permissões granulares</span>
    <span class="tag-red">Bug P1</span>
  </div>
</div>

<div class="alert alert-danger">
  <div class="alert-icon">🚫</div>
  <div class="alert-body">
    <div class="alert-title">Bug crítico atual: platform_operator recebe 403 em toda a API</div>
    <p>O guard <code>@RequirePermission('platform.admin')</code> usa <code>resolvePermissions()</code> que só mapeia <code>platform.admin</code> para <code>platform_admin</code> e <code>platform_admin_client</code>. Usuários com role <code>platform_operator</code> fazem login com sucesso mas recebem 403 em <strong>todas</strong> as rotas. Correção: <code>apps/platform/api/src/shared/infra/http/decorators/permissions.ts</code>.</p>
  </div>
</div>

<div class="eco-callout">
  <div class="eco-icon">🔗</div>
  <div class="eco-body">
    <div class="eco-title">RBAC tem dois níveis no ecossistema</div>
    <div class="eco-links">
      Esta seção cobre as roles <strong>internas Citybox</strong> (platform_*). O RBAC do
      <strong>lojista</strong> (gerente/atendente/caixa/cozinha) vive no ERP —
      ver <a href="../wiki-erp/wiki-erp/index.html#rbac-permissoes">ERP · RBAC e Permissões</a>
      e <a href="../wiki-erp/wiki-erp/index.html#equipe-loja">ERP · Equipe da Loja</a>.
    </div>
  </div>
</div>

<h2>Correção imediata (P1)</h2>
<div class="blueprint-today">
  <div class="blueprint-today-label">Hoje (com bug)</div>
  <pre><code>function resolvePermissions(roles: string[]): string[] {
  // Só platform_admin e platform_admin_client têm 'platform.admin'
  if (roles.includes('platform_admin') || roles.includes('platform_admin_client')) {
    return ['platform.admin'];
  }
  return []; // platform_operator retorna vazio → 403 em tudo
}</code></pre>
</div>

<div class="blueprint-proposed">
  <div class="blueprint-proposed-label">Proposta (fix + granular)</div>
  <pre><code>function resolvePermissions(roles: string[]): string[] {
  const perms: string[] = [];
  if (roles.includes('platform_admin')) {
    perms.push('platform.admin', 'platform.clientes', 'platform.lojas',
               'platform.usuarios', 'platform.billing', 'platform.auditoria',
               'platform.config', 'platform.suporte');
  }
  if (roles.includes('platform_operator')) {
    perms.push('platform.clientes', 'platform.lojas', 'platform.usuarios', 'platform.suporte');
  }
  if (roles.includes('platform_finance')) {
    perms.push('platform.billing');
  }
  if (roles.includes('platform_support')) {
    perms.push('platform.suporte', 'platform.clientes.read', 'platform.lojas.read');
  }
  return perms;
}</code></pre>
</div>

<h2>Matriz de permissões (alvo)</h2>
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Módulo / Permissão</th>
        <th>platform_admin</th>
        <th>platform_operator</th>
        <th>platform_finance</th>
        <th>platform_support</th>
      </tr>
    </thead>
    <tbody>
      <tr><td class="td-bold">Clientes — listar/detalhar</td><td>✅</td><td>✅</td><td>✅ (só dados financ.)</td><td>✅ (leitura)</td></tr>
      <tr><td class="td-bold">Clientes — criar/editar</td><td>✅</td><td>✅</td><td>❌</td><td>❌</td></tr>
      <tr><td class="td-bold">Clientes — bloquear</td><td>✅</td><td>✅</td><td>❌</td><td>❌</td></tr>
      <tr><td class="td-bold">Lojas — listar/detalhar</td><td>✅</td><td>✅</td><td>❌</td><td>✅ (leitura)</td></tr>
      <tr><td class="td-bold">Lojas — criar/editar/bloquear</td><td>✅</td><td>✅</td><td>❌</td><td>❌</td></tr>
      <tr><td class="td-bold">Lojas — módulos/settings</td><td>✅</td><td>✅</td><td>❌</td><td>❌</td></tr>
      <tr><td class="td-bold">Equipe da loja</td><td>✅</td><td>✅</td><td>❌</td><td>❌</td></tr>
      <tr><td class="td-bold">Usuários Citybox — listar</td><td>✅</td><td>✅</td><td>❌</td><td>❌</td></tr>
      <tr><td class="td-bold">Usuários Citybox — criar/editar</td><td>✅</td><td>❌</td><td>❌</td><td>❌</td></tr>
      <tr><td class="td-bold">Billing — planos/assinaturas</td><td>✅</td><td>❌</td><td>✅</td><td>❌</td></tr>
      <tr><td class="td-bold">Billing — faturas/recebíveis</td><td>✅</td><td>❌</td><td>✅</td><td>❌</td></tr>
      <tr><td class="td-bold">Auditoria global</td><td>✅</td><td>❌</td><td>❌</td><td>❌</td></tr>
      <tr><td class="td-bold">Auditoria por loja</td><td>✅</td><td>✅</td><td>❌</td><td>✅ (leitura)</td></tr>
      <tr><td class="td-bold">Configurações da plataforma</td><td>✅</td><td>❌</td><td>❌</td><td>❌</td></tr>
      <tr><td class="td-bold">Feature flags</td><td>✅</td><td>❌</td><td>❌</td><td>❌</td></tr>
      <tr><td class="td-bold">Impersonation</td><td>✅</td><td>❌</td><td>❌</td><td>✅ (auditada)</td></tr>
      <tr><td class="td-bold">Notificações — enviar</td><td>✅</td><td>✅</td><td>❌</td><td>❌</td></tr>
      <tr><td class="td-bold">Relatórios — exportar</td><td>✅</td><td>✅</td><td>✅ (billing)</td><td>❌</td></tr>
    </tbody>
  </table>
</div>

<h2>RBAC por membro de loja</h2>
<p>Os membros da loja (funcionários do lojista) têm um sistema de RBAC separado, gerenciado dentro de cada loja. O Admin Citybox define o <strong>cargo</strong> e as <strong>permissões granulares</strong> por membro no Keycloak:</p>
<div class="table-wrap">
  <table>
    <thead><tr><th>Cargo (role loja)</th><th>Acesso no ERP da loja</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">gerente</td><td>Acesso completo: configurações, relatórios, equipe, catálogo, caixa</td></tr>
      <tr><td class="td-bold">atendente</td><td>Pedidos, catálogo, caixa — sem configurações avançadas</td></tr>
      <tr><td class="td-bold">caixa</td><td>Apenas PDV e pagamentos — sem catálogo</td></tr>
      <tr><td class="td-bold">cozinha</td><td>KDS (monitor de cozinha) — somente visualização de pedidos</td></tr>
    </tbody>
  </table>
</div>

<div class="alert alert-amber">
  <div class="alert-icon">⚠️</div>
  <div class="alert-body">
    <div class="alert-title">Permissões granulares por membro — UI pronta, não conectada</div>
    <p>O componente <code>user-permissions-accordion.tsx</code> e a configuração <code>permissions-config.ts</code> (<code>clientes.read</code>, <code>financeiro.billing</code>, etc.) existem no código mas <strong>nunca são importados</strong> pelo formulário de criação de usuários. O formulário salva apenas identidade + role. Conectar estes componentes é parte do fix do RBAC.</p>
  </div>
</div>
`
});
