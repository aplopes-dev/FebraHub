WIKI.register({
  id: 'autenticacao-sso',
  title: 'Autenticação e SSO',
  icon: '🔐',
  searchText: 'autenticacao sso keycloak pkce oauth bff cookies token refresh silent realm lojista',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Plataforma e Shell</div>
    <h1 class="section-title">🔐 Autenticação e SSO</h1>
    <p class="section-subtitle">Fluxo de autenticação do ERP Citybox: Keycloak PKCE, BFF com cookies HttpOnly, refresh silencioso e propagação de token para APIs de domínio.</p>
    <div class="section-tags">
      <span class="tag-orange">Auth</span>
      <span class="tag-blue">Keycloak</span>
      <span class="tag-amber">PKCE · BFF Cookies</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Keycloak com realm por município — SSO configurado</li>
      <li>ERP usa Authorization Code + PKCE via <code>next-auth</code> ou lib customizada</li>
      <li>BFF armazena <code>access_token</code> em cookie <code>HttpOnly; Secure; SameSite=Lax</code></li>
      <li>APIs recebem Bearer token via header</li>
      <li>Refresh silencioso no BFF ao detectar token expirado</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Token rotation: <code>refresh_token</code> rotativo com revogação on logout em todos os dispositivos</li>
      <li>Login "lembrar dispositivo" com token de longa duração para PDV</li>
      <li>MFA obrigatório para roles com acesso financeiro (owner/manager)</li>
      <li>Sessão de loja: ao trocar de loja, revalidar permissões sem novo login</li>
      <li>Audit log de logins e trocas de loja por usuário</li>
    </ul>
  </div>

  <h2>Fluxo PKCE completo</h2>
  <div class="mermaid">
sequenceDiagram
  participant User as 👤 Lojista
  participant ERP as ERP Shell (browser)
  participant BFF as BFF (Next.js API Route)
  participant KC as Keycloak

  User->>ERP: Acessa /dashboard
  ERP->>BFF: GET /api/auth/session
  BFF-->>ERP: 401 Unauthorized (sem cookie)
  ERP->>BFF: GET /api/auth/login
  BFF->>BFF: Gera code_verifier + code_challenge
  BFF-->>User: Redirect → Keycloak /auth

  User->>KC: Insere credenciais
  KC-->>User: Redirect → /api/auth/callback?code=xxx

  User->>BFF: GET /api/auth/callback?code=xxx
  BFF->>KC: POST /token (code + code_verifier)
  KC-->>BFF: access_token + refresh_token + id_token
  BFF->>BFF: Salva tokens em cookie HttpOnly
  BFF-->>User: Redirect → /dashboard

  User->>ERP: Acessa /pedidos
  ERP->>BFF: POST /api/proxy/core/orders
  BFF->>BFF: Lê access_token do cookie
  BFF->>BFF: Verifica expiração → refresh se necessário
  BFF->>KC: POST /token (refresh_token) se expirado
  KC-->>BFF: Novo access_token
  BFF->>CoreAPI: POST /orders + Bearer access_token
  CoreAPI-->>BFF: 201 Order created
  BFF-->>ERP: 201 JSON
  </div>

  <h2>Estrutura de roles no Keycloak</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Realm Role</th><th>Quem tem</th><th>Acesso</th></tr></thead>
      <tbody>
        <tr><td><code>erp_access</code></td><td>Todos os usuários do ERP</td><td>Permite login no ERP (portão de entrada)</td></tr>
        <tr><td><code>store_owner</code></td><td>Dono da loja</td><td>Acesso total à loja, financeiro, configurações</td></tr>
        <tr><td><code>store_manager</code></td><td>Gerente</td><td>Pedidos, equipe, catálogo (sem financeiro)</td></tr>
        <tr><td><code>store_cashier</code></td><td>Caixa</td><td>PDV, pedidos, pagamentos</td></tr>
        <tr><td><code>store_attendant</code></td><td>Atendente</td><td>Pedidos, catálogo (leitura)</td></tr>
        <tr><td><code>platform_admin</code></td><td>Equipe Citybox</td><td>Admin plataforma (painel Admin)</td></tr>
      </tbody>
    </table>
  </div>
  <p>Papéis adicionais por vertical são definidos no <code>food-permissions.catalog.ts</code> e equivalentes por vertical. Ver seção <a href="#rbac-permissoes">RBAC e Permissões</a>.</p>

  <h2>Cookies de sessão</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Cookie</th><th>Conteúdo</th><th>Expiração</th><th>Flags</th></tr></thead>
      <tbody>
        <tr><td><code>erp_session</code></td><td>access_token (encrypted) + refresh_token</td><td>30 min / refresh</td><td>HttpOnly; Secure; SameSite=Lax</td></tr>
        <tr><td><code>erp_store</code></td><td>storeId ativo</td><td>Sessão</td><td>SameSite=Lax</td></tr>
        <tr><td><code>erp_user</code></td><td>userId + displayName (não-sensível)</td><td>7 dias</td><td>SameSite=Lax</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Proteção de rotas no App Router</h2>
  <pre>// apps/erp/src/middleware.ts
export function middleware(request: NextRequest) {
  const session = request.cookies.get('erp_session');
  if (!session) {
    return NextResponse.redirect(new URL('/api/auth/login', request.url));
  }
  // Verifica store selecionado
  const storeId = request.cookies.get('erp_store');
  if (!storeId && !request.nextUrl.pathname.startsWith('/select-store')) {
    return NextResponse.redirect(new URL('/select-store', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next|favicon.ico).*)']
};</pre>

  <h2>Logout e revogação</h2>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta</div>
    <p>Logout deve revogar o <code>refresh_token</code> no Keycloak via <code>POST /realms/{realm}/protocol/openid-connect/logout</code> e limpar todos os cookies. PDV em modo kiosk mantém sessão ativa com PIN local.</p>
  </div>
</div>
`
});
