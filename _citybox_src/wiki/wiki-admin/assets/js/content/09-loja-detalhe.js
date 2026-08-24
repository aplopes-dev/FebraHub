WIKI.register({
  id: 'loja-detalhe',
  title: 'Detalhe da Loja',
  icon: '🏬',
  searchText: 'detalhe loja abas configurações módulos settings fiscais terminais auditoria integrações reputação uptime erros bloqueio ativação seed-clinic-demo-team Clínica first-contact'
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Lojas</div>
  <h1 class="section-title">🏬 Detalhe da Loja</h1>
  <p class="section-subtitle">Visão completa de uma loja — configurações, módulos, terminais, integrações, saúde operacional e auditoria.</p>
  <div class="section-tags">
    <span class="status-badge status-functional">✅ Parcialmente funcional</span>
    <span class="status-badge status-proposed">🔵 Abas novas propostas</span>
  </div>
</div>

<div class="blueprint-today">
  <div class="blueprint-today-label">Hoje (MVP)</div>
  <ul>
    <li>Aba "Informações" — dados básicos, vertical, slug, status, fusos horários, endereço</li>
    <li>Aba "Configurações" — settings avançados: tema, SEFAZ, gateway fiscal, horários</li>
    <li>Aba "Módulos" — toggle de módulos da loja (KDS, Totem, PDV Mobile…)</li>
    <li>Aba "Terminais" — lista de PDVs da loja</li>
    <li>Aba "Audit Log" — eventos recentes por loja (funcional, com paginação)</li>
    <li>Aba "Integrações" — lista com status (read-only, sem configurar)</li>
    <li>Dados de métricas no header (pedidos total, avaliação média) são placeholders</li>
    <li><strong>Clínica:</strong> retry de equipe demo via <code>POST /v1/stores/:id/seed-clinic-demo-team</code> (platform); retry do seed de domínio via <code>POST /v1/store-setup/:storeId/retry</code> (clinica-api)</li>
  </ul>
</div>

<div class="blueprint-proposed">
  <div class="blueprint-proposed-label">Proposta (alvo)</div>
  <ul>
    <li>Header com <strong>semáforo de saúde</strong> em destaque + uptime das últimas 24h</li>
    <li>Aba "Integrações" evoluída: conectar, configurar, ver logs de webhook e status em tempo real</li>
    <li>Aba "Monitoramento" com gráfico de erros recentes, uptime e alertas</li>
    <li>Métricas reais no header: pedidos/dia real, NPS da loja se disponível</li>
    <li>Botão de reputação com detalhe dos sinais que compõem o semáforo</li>
  </ul>
</div>

<h2>Mockup — Detalhe da loja</h2>
<div class="mockup-container">
  <div class="mock-topbar">
    <span class="mock-logo">🏬 Padaria Sol</span>
    <span style="margin-left:auto;display:flex;gap:6px;">
      <span class="mock-badge mock-badge-green">🟢 Saudável · 99,2% uptime</span>
      <span class="mock-badge mock-badge-gray">Bloquear</span>
    </span>
  </div>
  <div class="mock-body">
    <div class="mock-row" style="gap:4px;margin-bottom:10px;">
      <span class="mock-badge mock-badge-teal">Informações</span>
      <span class="mock-badge mock-badge-gray">Configurações</span>
      <span class="mock-badge mock-badge-gray">Módulos</span>
      <span class="mock-badge mock-badge-gray">Terminais</span>
      <span class="mock-badge mock-badge-gray">Integrações</span>
      <span class="mock-badge mock-badge-gray">Monitoramento</span>
    </div>
    <div class="mock-label">Módulos da loja</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
      <div class="mock-row" style="background:#fff;border:1px solid var(--border-color);border-radius:8px;padding:8px;font-size:12px;"><span style="flex:1">KDS</span><span class="mock-badge mock-badge-green">On</span></div>
      <div class="mock-row" style="background:#fff;border:1px solid var(--border-color);border-radius:8px;padding:8px;font-size:12px;"><span style="flex:1">PDV Mobile</span><span class="mock-badge mock-badge-green">On</span></div>
      <div class="mock-row" style="background:#fff;border:1px solid var(--border-color);border-radius:8px;padding:8px;font-size:12px;"><span style="flex:1">Totem</span><span class="mock-badge mock-badge-gray">Off</span></div>
    </div>
  </div>
</div>
<p class="mermaid-caption">Wireframe ilustrativo do detalhe da loja: header com semáforo de saúde/uptime, abas (incl. Monitoramento proposta) e toggle de módulos. Operação interna em <a href="../wiki-erp/wiki-erp/index.html#configuracoes-loja">ERP · Configurações da Loja</a>.</p>

<h2>Estrutura de abas proposta</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Aba</th><th>Conteúdo</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">📋 Informações</td><td>Dados básicos, vertical, slug, endereço</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">⚙️ Configurações</td><td>Settings, fiscal, gateway, horários, tema</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">🧩 Módulos</td><td>Toggle de módulos com ativação em tempo real</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">🖥️ Terminais</td><td>PDVs da loja com status de conexão</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">🔗 Integrações</td><td>Configurar + status + logs de webhook</td><td><span class="status-badge status-partial">🟣 Status read-only hoje</span></td></tr>
      <tr><td class="td-bold">📊 Monitoramento</td><td>Uptime, gráfico de erros, alertas</td><td><span class="status-badge status-proposed">🔵</span></td></tr>
      <tr><td class="td-bold">👥 Equipe</td><td>Link para seção de equipe</td><td><span class="status-badge status-functional">✅</span></td></tr>
      <tr><td class="td-bold">📑 Audit Log</td><td>Eventos recentes com paginação</td><td><span class="status-badge status-functional">✅</span></td></tr>
    </tbody>
  </table>
</div>
`
});
