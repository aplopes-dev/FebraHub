WIKI.register({
  id: 'lojas',
  title: 'Lojas',
  icon: '🏪',
  searchText: 'lojas lista vertical status ativo bloqueado implantação slug módulos filtro busca ações em massa reputação saúde semáforo Clínica seed store-setup food.store-setup clinic.store-setup first-contact RabbitMQ'
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Lojas</div>
  <h1 class="section-title">🏪 Lojas</h1>
  <p class="section-subtitle">Gestão de todas as lojas da plataforma — listagem, filtros, ações em massa e indicadores de saúde/reputação.</p>
  <div class="section-tags">
    <span class="status-badge status-functional">✅ Funcional (base)</span>
    <span class="status-badge status-proposed">🔵 Reputação proposta</span>
  </div>
</div>

<div class="blueprint-today">
  <div class="blueprint-today-label">Hoje (MVP)</div>
  <ul>
    <li>Listagem com colunas: nome da loja, cliente, vertical, slug, status, nº membros, criada em</li>
    <li>Filtros: busca por nome/slug, cliente (combo), vertical (combo), status (combo)</li>
    <li>Paginação funcional</li>
    <li>Ações: ver detalhe, bloquear/ativar, deletar (com confirmação)</li>
    <li>Botão "Nova loja" → formulário com dados básicos + CEP autopreenchido</li>
    <li>Status: <code>IN_SETUP</code>, <code>TRAINING</code>, <code>PRODUCTION</code>, <code>BLOCKED</code>, <code>OFFLINE</code></li>
    <li><strong>Vertical Clínica (jul/2026):</strong> ao criar, platform-api seeda equipe demo (gerente+atendente) e publica <code>citybox.store.created.v1</code>; worker <code>clinic.store-setup</code> aplica seed first-contact (plano Particular, anamneses, contrato, financeiro, paciente+agenda). Food usa o espelho <code>food.store-setup</code>.</li>
  </ul>
</div>

<div class="blueprint-proposed">
  <div class="blueprint-proposed-label">Proposta (alvo)</div>
  <ul>
    <li>Coluna de <strong>saúde/reputação</strong> com semáforo (verde/amarelo/vermelho) baseado em uptime, engajamento e erros recentes</li>
    <li>Coluna de <strong>pedidos/dia</strong> — média dos últimos 7 dias</li>
    <li>Badge de alerta quando a loja está offline ou com erros críticos</li>
    <li>Filtro por nível de saúde (verde/amarelo/vermelho)</li>
    <li>Ações em massa: bloquear, enviar comunicado, ativar módulo</li>
    <li>Quick stats: total de lojas, ativas, em implantação, bloqueadas</li>
  </ul>
</div>

<h2>Mockup — Lista de lojas</h2>
<div class="mockup-container">
  <div class="mock-topbar">
    <span class="mock-logo">🏪 Lojas</span>
    <span style="margin-left:auto;display:flex;gap:6px;">
      <span class="mock-badge mock-badge-green">389 ativas</span>
      <span class="mock-badge mock-badge-yellow">12 em implantação</span>
      <span class="mock-badge mock-badge-gray">+ Nova loja</span>
    </span>
  </div>
  <div class="mock-body">
    <div class="mock-row" style="margin-bottom:10px;">
      <input class="mock-input" style="flex:1" placeholder="🔍 Buscar por nome ou slug…">
      <span class="mock-badge mock-badge-teal">Vertical ▾</span>
      <span class="mock-badge mock-badge-gray">Status ▾</span>
      <span class="mock-badge mock-badge-gray">Saúde ▾</span>
    </div>
    <table class="mock-table">
      <thead><tr><th>Loja</th><th>Cliente</th><th>Vertical</th><th>Status</th><th>Saúde</th><th>Pedidos/dia</th></tr></thead>
      <tbody>
        <tr><td><strong>Padaria Sol</strong></td><td>Padaria Sol</td><td><span class="mock-badge mock-badge-red">Food</span></td><td><span class="mock-badge mock-badge-green">Ativa</span></td><td><span class="mock-badge mock-badge-green">●</span></td><td>148</td></tr>
        <tr><td><strong>MercadoBom Centro</strong></td><td>MercadoBom Ltda</td><td><span class="mock-badge mock-badge-green">Market</span></td><td><span class="mock-badge mock-badge-green">Ativa</span></td><td><span class="mock-badge mock-badge-yellow">●</span></td><td>92</td></tr>
        <tr><td><strong>VarejoX Filial 3</strong></td><td>VarejoX S.A.</td><td><span class="mock-badge mock-badge-green">Market</span></td><td><span class="mock-badge mock-badge-yellow">Implantação</span></td><td><span class="mock-badge mock-badge-gray">—</span></td><td>0</td></tr>
      </tbody>
    </table>
  </div>
</div>
<p class="mermaid-caption">Wireframe ilustrativo da lista de lojas com quick stats, filtros por vertical/status/saúde e colunas propostas (semáforo de saúde, pedidos/dia).</p>

<h2>Colunas propostas</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Coluna</th><th>Origem</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">Nome + logo</td><td><code>stores.name</code></td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">Cliente</td><td><code>stores.clientId</code> → clients.name</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">Vertical</td><td><code>stores.vertical</code></td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">Slug</td><td><code>stores.slug</code></td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">Status</td><td><code>stores.status</code></td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">Saúde</td><td>calculado de uptime + erros + engajamento</td><td><span class="status-badge status-proposed">🔵</span></td></tr>
      <tr><td class="td-bold">Pedidos/dia</td><td>média 7d de orders</td><td><span class="status-badge status-proposed">🔵</span></td></tr>
      <tr><td class="td-bold">Membros</td><td>COUNT store_members</td><td><span class="status-badge status-functional">✅</span></td></tr>
    </tbody>
  </table>
</div>
`
});
