WIKI.register({
  id: 'clientes',
  title: 'Clientes',
  icon: '🤝',
  searchText: 'clientes lista CNPJ CPF cadastro plano status ativo bloqueado suspenso health score risco churn filtro busca exportação ações em massa onboarding',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Clientes</div>
  <h1 class="section-title">🤝 Clientes</h1>
  <p class="section-subtitle">Listagem e gestão de clientes da plataforma. Evolução de lista simples para painel de gestão com health score, filtros ricos e ações em massa.</p>
  <div class="section-tags">
    <span class="status-badge status-functional">✅ Funcional (base)</span>
    <span class="status-badge status-proposed">🔵 Enriquecimento proposto</span>
  </div>
</div>

<div class="blueprint-today">
  <div class="blueprint-today-label">Hoje (MVP)</div>
  <ul>
    <li>Listagem com colunas: nome, CNPJ, plano (string livre), status, nº lojas, data de criação</li>
    <li>Filtros: busca por nome/CNPJ, status (combo), plano (combo)</li>
    <li>Paginação funcional</li>
    <li>Botão "Exportar" existe mas sem handler</li>
    <li>Status possíveis: ativo, inadimplente, suspenso, bloqueado, cancelado</li>
    <li>Ações: ver detalhe, bloquear/desbloquear, excluir (com confirmação)</li>
    <li>Botão "Novo cliente" → formulário multi-step funcional</li>
  </ul>
</div>

<div class="blueprint-proposed">
  <div class="blueprint-proposed-label">Proposta (alvo)</div>
  <ul>
    <li>Coluna de <strong>Health Score</strong> com semáforo visual (verde ≥ 70, amarelo 40–70, vermelho &lt; 40)</li>
    <li>Coluna de <strong>MRR</strong> real do cliente (soma das assinaturas)</li>
    <li>Filtro por <strong>faixa de health score</strong> e por <strong>risco de churn</strong></li>
    <li>Filtro por plano real (da tabela <code>plans</code>, não string livre)</li>
    <li>Ações em massa: bloquear vários, enviar comunicado, exportar selecionados</li>
    <li>Exportação CSV/XLSX com todos os campos</li>
    <li>Badge "Inadimplente" piscando quando há faturas vencidas</li>
    <li>Quick stats acima da lista: total, at-risk, inadimplentes, novos este mês</li>
  </ul>
</div>

<h2>Mockup — Lista de clientes</h2>
<div class="mockup-container">
  <div class="mock-topbar">
    <span class="mock-logo">🤝 Clientes</span>
    <span style="margin-left:auto;display:flex;gap:6px;">
      <span class="mock-badge mock-badge-teal">142 ativos</span>
      <span class="mock-badge mock-badge-red">3 inadimplentes</span>
      <span class="mock-badge mock-badge-gray">+ Novo cliente</span>
    </span>
  </div>
  <div class="mock-body">
    <div class="mock-row" style="margin-bottom:10px;">
      <input class="mock-input" style="flex:1" placeholder="🔍 Buscar por nome ou CNPJ…">
      <span class="mock-badge mock-badge-teal">Status ▾</span>
      <span class="mock-badge mock-badge-gray">Plano ▾</span>
      <span class="mock-badge mock-badge-gray">Health ▾</span>
    </div>
    <table class="mock-table">
      <thead><tr><th>Cliente</th><th>Plano</th><th>Status</th><th>Health</th><th>MRR</th></tr></thead>
      <tbody>
        <tr><td><strong>MercadoBom Ltda</strong><br><span style="color:var(--text-muted);font-size:11px">12.345.678/0001-90</span></td><td><span class="mock-badge mock-badge-purple">Pro</span></td><td><span class="mock-badge mock-badge-green">Ativo</span></td><td><span class="mock-badge mock-badge-green">82</span></td><td>R$ 1.890</td></tr>
        <tr><td><strong>Padaria Sol</strong><br><span style="color:var(--text-muted);font-size:11px">23.456.789/0001-01</span></td><td><span class="mock-badge mock-badge-teal">Starter</span></td><td><span class="mock-badge mock-badge-green">Ativo</span></td><td><span class="mock-badge mock-badge-yellow">58</span></td><td>R$ 490</td></tr>
        <tr><td><strong>VarejoX S.A.</strong><br><span style="color:var(--text-muted);font-size:11px">34.567.890/0001-12</span></td><td><span class="mock-badge mock-badge-blue">Enterprise</span></td><td><span class="mock-badge mock-badge-red">Inadimplente</span></td><td><span class="mock-badge mock-badge-red">31</span></td><td>R$ 4.200</td></tr>
      </tbody>
    </table>
  </div>
</div>
<p class="mermaid-caption">Wireframe ilustrativo da lista de clientes com quick stats, filtros ricos e colunas propostas (Health Score com semáforo, MRR real).</p>

<h2>Colunas propostas na lista</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Coluna</th><th>Tipo</th><th>Origem</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">Nome / Razão Social</td><td>Texto + avatar</td><td><code>clients.name</code></td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">CNPJ / CPF</td><td>Texto formatado</td><td><code>clients.document</code></td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">Plano</td><td>Badge colorido</td><td><code>clients.plan</code> → tabela <code>plans</code></td><td><span class="status-badge status-partial">🟣 String livre hoje</span></td></tr>
      <tr><td class="td-bold">Status</td><td>Badge</td><td><code>clients.status</code></td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">Lojas</td><td>Número</td><td>COUNT stores</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">Health Score</td><td>Semáforo + número</td><td><code>client_health_scores.score</code></td><td><span class="status-badge status-proposed">🔵</span></td></tr>
      <tr><td class="td-bold">MRR</td><td>Moeda</td><td>SUM subscriptions.mrr</td><td><span class="status-badge status-proposed">🔵</span></td></tr>
      <tr><td class="td-bold">Criado em</td><td>Data</td><td><code>clients.createdAt</code></td><td><span class="status-badge status-functional">✅</span></td></tr>
    </tbody>
  </table>
</div>

<h2>Fluxo de criação de cliente</h2>
<div class="mermaid">
flowchart LR
  A[Novo cliente] --> B[Dados da empresa\nNome / CNPJ / CPF\nResponsável / E-mail]
  B --> C[Endereço\nCEP autopreenchido]
  C --> D[Plano SaaS\nSeleção real]
  D --> E[Revisar + confirmar]
  E --> F{Salvar}
  F -->|Sucesso| G[Status: implantação\nOnboarding iniciado]
  F -->|Erro| H[Validação exibida]
</div>

<h2>Endpoints da API de clientes</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Método</th><th>Path</th><th>Função</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">GET</td><td><code>/v1/clients</code></td><td>Listar com filtros e paginação</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">POST</td><td><code>/v1/clients</code></td><td>Criar cliente</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">GET</td><td><code>/v1/clients/:id</code></td><td>Detalhe do cliente</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">PATCH</td><td><code>/v1/clients/:id</code></td><td>Editar</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">POST</td><td><code>/v1/clients/:id/block</code></td><td>Bloquear</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">GET</td><td><code>/v1/clients/export</code></td><td>Exportar CSV</td><td><span class="status-badge status-proposed">🔵</span></td></tr>
      <tr><td class="td-bold">GET</td><td><code>/v1/clients/:id/health</code></td><td>Health score do cliente</td><td><span class="status-badge status-proposed">🔵</span></td></tr>
    </tbody>
  </table>
</div>
`
});
