WIKI.register({
  id: 'arquitetura',
  title: 'Arquitetura Técnica',
  icon: '⚙️',
  searchText: 'arquitetura técnica nextjs nestjs prisma keycloak postgres proxy api plataforma banco dados SSO JWT módulos infraestrutura billing notifications analytics jobs webhooks workers',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Introdução</div>
  <h1 class="section-title">⚙️ Arquitetura Técnica</h1>
  <p class="section-subtitle">Arquitetura atual (MVP) e arquitetura-alvo do Admin Citybox — componentes novos necessários para suportar billing, notificações, analytics e jobs.</p>
  <div class="section-tags">
    <span class="tag-teal">Next.js 16</span>
    <span class="tag-blue">NestJS</span>
    <span class="tag-gray">Postgres</span>
    <span class="tag-purple">Keycloak</span>
  </div>
</div>

<h2>Arquitetura atual (MVP)</h2>
<div class="mermaid">
flowchart TB
  Browser[Navegador Operador]
  subgraph adminweb [apps/platform/admin — Next.js :3108]
    Pages[Páginas e Componentes React]
    BFF[Rotas API Next.js]
  end
  subgraph platformapi [apps/platform/api — NestJS :3103]
    Modules[Módulos NestJS]
    UseCases[Use Cases]
    Repos[Repositórios Prisma]
  end
  KC[Keycloak SSO]
  PG[(Postgres schema platform)]

  Browser --> Pages
  Pages --> BFF
  BFF -->|proxy Bearer| platformapi
  BFF -->|auth PKCE| KC
  Modules --> Repos
  UseCases --> KC
  Repos --> PG
</div>

<h2>Arquitetura-alvo (completa)</h2>
<div class="mermaid">
flowchart TB
  Browser[Navegador Operador]

  subgraph adminweb [Admin Web — Next.js :3108]
    Pages[Páginas]
    BFF[BFF / Proxy]
    WS[WebSocket client]
  end

  subgraph platformapi [Platform API — NestJS :3103]
    ClientsMod[Clients Module]
    StoresMod[Stores Module]
    UsersMod[Users Module]
    BillingMod[Billing Module]
    NotifMod[Notifications Module]
    HealthMod[Health Score Module]
    AuditMod[Audit Module]
    FlagsMod[Feature Flags Module]
  end

  subgraph workers [Platform Workers]
    JobHealth[Job: calc health score]
    JobDunning[Job: dunning automático]
    JobReports[Job: relatórios agendados]
  end

  KC[Keycloak SSO]
  PG[(Postgres platform)]
  STR[Stripe Billing]
  SMTP[SMTP / SendGrid]
  RMQ[RabbitMQ]
  RED[Redis — cache + sessões]

  Browser --> Pages
  Pages --> BFF
  BFF -->|Bearer| platformapi
  BFF --> KC

  BillingMod -->|webhooks| STR
  NotifMod --> SMTP
  HealthMod --> RMQ
  platformapi --> PG
  platformapi --> RED
  workers --> PG
  workers --> RMQ
  workers --> SMTP
</div>

<h2>Componentes novos necessários</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Componente</th><th>Tipo</th><th>Responsabilidade</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">Billing Module</td><td>NestJS module</td><td>Planos, assinaturas, faturas (Stripe)</td><td><span class="status-badge status-proposed">🔵 Proposta</span></td></tr>
      <tr><td class="td-bold">Notifications Module</td><td>NestJS module</td><td>Inbox operador + broadcasts lojistas</td><td><span class="status-badge status-proposed">🔵 Proposta</span></td></tr>
      <tr><td class="td-bold">Health Score Module</td><td>NestJS module + job</td><td>Calcular e armazenar score por cliente</td><td><span class="status-badge status-proposed">🔵 Proposta</span></td></tr>
      <tr><td class="td-bold">Audit Module (global)</td><td>NestJS module</td><td>Trilha de ações de operadores</td><td><span class="status-badge status-broken">🔴 Endpoint inexistente</span></td></tr>
      <tr><td class="td-bold">Feature Flags Module</td><td>NestJS module</td><td>Flags por tenant, gradual rollout</td><td><span class="status-badge status-proposed">🔵 Proposta</span></td></tr>
      <tr><td class="td-bold">Reports Module</td><td>NestJS module + job</td><td>Exportações CSV/PDF, relatórios agendados</td><td><span class="status-badge status-proposed">🔵 Proposta</span></td></tr>
      <tr><td class="td-bold">Platform Workers</td><td>Serviço separado</td><td>Jobs de health score, dunning, relatórios</td><td><span class="status-badge status-proposed">🔵 Proposta</span></td></tr>
      <tr><td class="td-bold">Redis</td><td>Infraestrutura</td><td>Cache de health scores, sessões, rate limit</td><td><span class="status-badge status-proposed">🔵 Proposta</span></td></tr>
    </tbody>
  </table>
</div>

<h2>Módulos da API atual</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Módulo</th><th>Prefixo</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">UsersModule</td><td><code>v1/users</code></td><td><span class="status-badge status-functional">✅ Funcional</span></td></tr>
      <tr><td class="td-bold">ClientsModule</td><td><code>v1/clients</code></td><td><span class="status-badge status-functional">✅ Funcional</span></td></tr>
      <tr><td class="td-bold">StoresModule</td><td><code>v1/stores</code></td><td><span class="status-badge status-functional">✅ Funcional</span></td></tr>
      <tr><td class="td-bold">CepLookupModule</td><td><code>v1/cep</code></td><td><span class="status-badge status-functional">✅ Funcional</span></td></tr>
      <tr><td class="td-bold">Audit global</td><td><code>v1/platform/audit</code></td><td><span class="status-badge status-broken">🔴 Inexistente</span></td></tr>
      <tr><td class="td-bold">Billing / Planos</td><td><code>v1/platform/billing/*</code></td><td><span class="status-badge status-broken">🔴 Inexistente</span></td></tr>
    </tbody>
  </table>
</div>

<h2>Schema Prisma platform</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Tabela</th><th>O que armazena</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">users</td><td>Operadores Citybox</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">clients</td><td>Clientes PF/PJ, plano (string livre)</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">stores</td><td>Lojas, métricas, settings, status</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">store_terminals</td><td>PDVs por loja</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">store_errors</td><td>Erros recentes</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">store_members</td><td>Funcionários lojistas (Keycloak)</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">store_modules</td><td>Feature flags por loja</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">store_integrations</td><td>Status de integrações (iFood, Stone)</td><td><span class="status-badge status-partial">🟣 Parcial</span></td></tr>
      <tr><td class="td-bold">store_audit_events</td><td>Auditoria por loja</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">plans</td><td>Catálogo de planos SaaS</td><td><span class="status-badge status-proposed">🔵 Proposta</span></td></tr>
      <tr><td class="td-bold">subscriptions</td><td>Vínculo cliente ↔ plano</td><td><span class="status-badge status-proposed">🔵 Proposta</span></td></tr>
      <tr><td class="td-bold">invoices</td><td>Faturas + status de pagamento</td><td><span class="status-badge status-proposed">🔵 Proposta</span></td></tr>
      <tr><td class="td-bold">client_health_scores</td><td>Score calculado + sinais</td><td><span class="status-badge status-proposed">🔵 Proposta</span></td></tr>
      <tr><td class="td-bold">notifications</td><td>Inbox operador + broadcasts</td><td><span class="status-badge status-proposed">🔵 Proposta</span></td></tr>
    </tbody>
  </table>
</div>
`
});
