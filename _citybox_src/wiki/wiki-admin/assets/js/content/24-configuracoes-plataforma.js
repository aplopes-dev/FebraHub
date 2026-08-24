WIKI.register({
  id: 'configuracoes-plataforma',
  title: 'Configurações da Plataforma',
  icon: '⚙️',
  searchText: 'configurações plataforma settings globais verticais feature flags branding tema custom domain rota 404 broken',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Plataforma</div>
  <h1 class="section-title">⚙️ Configurações da Plataforma</h1>
  <p class="section-subtitle">Settings globais da Citybox — verticais habilitadas, feature flags por tenant, branding e configurações de ambiente. Hoje retorna 404.</p>
  <div class="section-tags">
    <span class="status-badge status-broken">🔴 Rota 404 hoje</span>
    <span class="status-badge status-proposed">🔵 Design completo proposto</span>
    <span class="tag-p2">P2</span>
  </div>
</div>

<div class="blueprint-today">
  <div class="blueprint-today-label">Hoje (MVP)</div>
  <p>Rota <code>/config/settings</code> existe no arquivo de navegação mas retorna 404. Nenhuma implementação de settings globais no backend.</p>
</div>

<div class="blueprint-proposed">
  <div class="blueprint-proposed-label">Proposta (alvo)</div>
  <p>Painel de configurações globais da plataforma acessível apenas para <code>platform_admin</code>. Dividido em 4 seções principais.</p>
</div>

<h2>Mockup — Configurações globais</h2>
<div class="mockup-container">
  <div class="mock-topbar">
    <span class="mock-logo">⚙️ Configurações da Plataforma</span>
    <span style="margin-left:auto;"><span class="mock-badge mock-badge-purple">platform_admin</span></span>
  </div>
  <div class="mock-body">
    <div class="mock-label">Verticais habilitadas</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;">
      <div class="mock-row" style="background:#fff;border:1px solid var(--border-color);border-radius:8px;padding:8px;font-size:12px;"><span style="flex:1">🍔 Food</span><span class="mock-badge mock-badge-green">On</span></div>
      <div class="mock-row" style="background:#fff;border:1px solid var(--border-color);border-radius:8px;padding:8px;font-size:12px;"><span style="flex:1">🛒 Varejo</span><span class="mock-badge mock-badge-green">On</span></div>
      <div class="mock-row" style="background:#fff;border:1px solid var(--border-color);border-radius:8px;padding:8px;font-size:12px;"><span style="flex:1">🏥 Saúde</span><span class="mock-badge mock-badge-green">On</span></div>
      <div class="mock-row" style="background:#fff;border:1px solid var(--border-color);border-radius:8px;padding:8px;font-size:12px;"><span style="flex:1">📚 Educação</span><span class="mock-badge mock-badge-yellow">Manut.</span></div>
    </div>
    <div class="mock-label">Feature flags</div>
    <table class="mock-table">
      <thead><tr><th>Flag</th><th>Escopo</th><th>Estado</th></tr></thead>
      <tbody>
        <tr><td>billing_v2</td><td>Global</td><td><span class="mock-badge mock-badge-green">On</span></td></tr>
        <tr><td>health_score</td><td>Global</td><td><span class="mock-badge mock-badge-gray">Off</span></td></tr>
        <tr><td>ifood_v2_api</td><td>Por loja</td><td><span class="mock-badge mock-badge-yellow">Parcial</span></td></tr>
      </tbody>
    </table>
  </div>
</div>
<p class="mermaid-caption">Wireframe ilustrativo das configurações globais: toggle de verticais e feature flags por escopo. Tenancy municipal detalhada em <a href="../wiki-marketplace/index.html#tenancy-municipal">Marketplace · Tenancy Municipal</a>.</p>

<h2>Seção 1 — Verticais da plataforma</h2>
<div class="card-grid">
  <div class="card card-teal">
    <div class="card-title">🍔 Food</div>
    <p>Cardápio digital, PDV, KDS, iFood, Rappi, comanda eletrônica. Status: ativa na plataforma.</p>
  </div>
  <div class="card card-teal">
    <div class="card-title">🛒 Varejo</div>
    <p>Catálogo, estoque, PDV físico, e-commerce básico.</p>
  </div>
  <div class="card card-blue">
    <div class="card-title">🏥 Saúde</div>
    <p>Agendamento, prontuário simples, telemedicina.</p>
  </div>
  <div class="card card-blue">
    <div class="card-title">📚 Educação</div>
    <p>Matrículas, mensalidades, material didático.</p>
  </div>
</div>

<p>O Admin deve permitir <strong>habilitar/desabilitar verticais</strong> globalmente (ex.: tirar Educação do ar para todos os novos clientes enquanto está em manutenção).</p>

<h2>Seção 2 — Feature flags por tenant</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Flag</th><th>Escopo</th><th>Descrição</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">billing_v2</td><td>Global / por cliente</td><td>Habilita novo módulo de billing real</td></tr>
      <tr><td class="td-bold">health_score</td><td>Global</td><td>Habilita cálculo e exibição de health score</td></tr>
      <tr><td class="td-bold">ifood_v2_api</td><td>Por loja</td><td>Migra loja para nova API do iFood</td></tr>
      <tr><td class="td-bold">onboarding_checklist</td><td>Global</td><td>Exibe checklist de go-live</td></tr>
      <tr><td class="td-bold">nfe_auto_emit</td><td>Por cliente</td><td>Emissão automática de NF após pagamento</td></tr>
    </tbody>
  </table>
</div>

<h2>Seção 3 — Configurações gerais</h2>
<ul>
  <li><strong>Nome da plataforma:</strong> "Citybox" (branding)</li>
  <li><strong>E-mail de suporte:</strong> suporte@citybox.com</li>
  <li><strong>URLs:</strong> admin, ERP, API (configuráveis por ambiente)</li>
  <li><strong>Keycloak realm:</strong> configuração de realm por ambiente</li>
  <li><strong>Limites de rate:</strong> requests/min por tenant</li>
</ul>

<h2>Seção 4 — Manutenção</h2>
<ul>
  <li><strong>Modo manutenção global:</strong> exibe banner para todos os lojistas com mensagem customizável</li>
  <li><strong>Modo manutenção por vertical:</strong> bloqueia apenas uma vertical</li>
  <li><strong>Janela de manutenção agendada:</strong> data/hora de início e fim com aviso antecipado</li>
</ul>
`
});
