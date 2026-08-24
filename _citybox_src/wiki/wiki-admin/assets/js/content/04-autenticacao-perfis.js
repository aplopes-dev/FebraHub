WIKI.register({
  id: 'autenticacao-perfis',
  title: 'Autenticação e Perfis',
  icon: '🔐',
  searchText: 'autenticação perfis SSO Keycloak login PKCE JWT roles platform_admin platform_operator platform_finance platform_support acesso permissões callback token sessão logout fix 403',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Acesso, Perfis e Permissões</div>
  <h1 class="section-title">🔐 Autenticação e Perfis</h1>
  <p class="section-subtitle">SSO via Keycloak, fluxo de login, perfis de acesso e os problemas conhecidos no MVP. Ver <a href="#rbac-permissoes">RBAC e Permissões</a> para a matriz completa de autorização.</p>
  <div class="section-tags">
    <span class="tag-teal">SSO Keycloak</span>
    <span class="tag-blue">PKCE</span>
    <span class="tag-purple">JWT Bearer</span>
    <span class="status-badge status-functional">✅ Funcional</span>
  </div>
</div>

<h2>Fluxo de login (atual e proposto)</h2>
<div class="mermaid">
sequenceDiagram
  participant Op as Operador
  participant Web as Admin Web
  participant KC as Keycloak
  participant API as Platform API

  Op->>Web: Acessa admin.citybox.com
  Web->>KC: Redireciona (OAuth PKCE)
  KC->>Op: Tela de login
  Op->>KC: Credenciais
  KC->>Web: Authorization Code
  Web->>KC: Troca code por tokens
  KC-->>Web: Access Token + Refresh Token
  Web->>Web: Salva tokens em cookies httpOnly
  Op->>Web: Usa o painel
  Web->>API: Requisições com Bearer token
  API->>KC: Valida token + verifica roles
  KC-->>API: Token válido + roles
</div>

<div class="blueprint-today">
  <div class="blueprint-today-label">Hoje (MVP)</div>
  <ul>
    <li><strong>Realm:</strong> <code>citybox-dev</code> (dev) / <code>citybox</code> (prod) · <strong>Client:</strong> <code>citybox-admin</code></li>
    <li>Roles aceitas pelo front (<code>hasPlatformAdminAccess</code>): <code>platform_admin</code>, <code>platform_operator</code>, <code>platform_admin_client</code></li>
    <li>Guard da API (<code>@RequirePermission('platform.admin')</code>) só resolve para <code>platform_admin</code> e <code>platform_admin_client</code></li>
    <li><strong>Bug crítico:</strong> usuários com role <code>platform_operator</code> fazem login com sucesso no front mas recebem <strong>403 Forbidden</strong> em todas as chamadas da API</li>
    <li>Renovação automática via <code>GET /api/auth/session</code> com refresh token</li>
    <li>Logout limpa cookies e encerra sessão Keycloak</li>
  </ul>
</div>

<div class="blueprint-proposed">
  <div class="blueprint-proposed-label">Proposta (alvo)</div>
  <ul>
    <li>Manter PKCE — sem mudança no fluxo de auth</li>
    <li>Corrigir <code>resolvePermissions()</code> em <code>permissions.ts</code>: adicionar <code>platform_operator</code> com permissões operacionais</li>
    <li>Novas roles Keycloak: <code>platform_finance</code> (billing only) e <code>platform_support</code> (read + impersonation)</li>
    <li>Tela de perfil (<code>/profile</code>) — hoje retorna 404; deve mostrar dados do operador logado, foto e histórico recente de ações</li>
    <li>2FA obrigatório para <code>platform_admin</code> — configurado via Keycloak realm policy</li>
  </ul>
</div>

<h2>Perfis de acesso (alvo completo)</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Role Keycloak</th><th>Quem é</th><th>Módulos acessíveis</th><th>Status</th></tr></thead>
    <tbody>
      <tr>
        <td class="td-bold">platform_admin</td>
        <td>Administrador pleno</td>
        <td>Tudo — clientes, lojas, equipe, usuários, billing, auditoria, configurações, convites</td>
        <td><span class="status-badge status-functional">✅ Funcional</span></td>
      </tr>
      <tr>
        <td class="td-bold">platform_operator</td>
        <td>Operador de suporte/implantação</td>
        <td>Clientes, lojas, equipe; sem billing e configs globais</td>
        <td><span class="status-badge status-broken">🔴 403 na API</span></td>
      </tr>
      <tr>
        <td class="td-bold">platform_admin_client</td>
        <td>Role intermediária técnica</td>
        <td>Mesmo acesso de operator na UI</td>
        <td><span class="status-badge status-partial">🟣 Parcial</span></td>
      </tr>
      <tr>
        <td class="td-bold">platform_finance</td>
        <td>Responsável financeiro</td>
        <td>Apenas billing, assinaturas, faturas, repasses</td>
        <td><span class="status-badge status-proposed">🔵 Proposta</span></td>
      </tr>
      <tr>
        <td class="td-bold">platform_support</td>
        <td>Agente de suporte</td>
        <td>Visualização geral + impersonation (somente leitura)</td>
        <td><span class="status-badge status-proposed">🔵 Proposta</span></td>
      </tr>
    </tbody>
  </table>
</div>

<h2>Renovação e logout</h2>
<ul>
  <li><strong>Renovação automática:</strong> <code>GET /api/auth/session</code> usa refresh token silenciosamente</li>
  <li><strong>Sessão expirada:</strong> redireciona para <code>/login?reauth=1</code></li>
  <li><strong>Logout:</strong> <code>POST /api/auth/logout</code> limpa cookies e encerra sessão SSO</li>
  <li><strong>Dev bypass:</strong> <code>AUTH_DEV_BYPASS=true</code> — nunca ativar em produção</li>
</ul>
`
});
