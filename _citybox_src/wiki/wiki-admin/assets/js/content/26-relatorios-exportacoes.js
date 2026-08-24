WIKI.register({
  id: 'relatorios-exportacoes',
  title: 'Relatórios e Exportações',
  icon: '📋',
  searchText: 'relatórios exportações CSV PDF agendados BI clientes lojas financeiro auditoria download filtros período agendamento e-mail',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Plataforma</div>
  <h1 class="section-title">📋 Relatórios e Exportações</h1>
  <p class="section-subtitle">Módulo de relatórios operacionais e exportação de dados — CSV/PDF, relatórios agendados e integração com ferramentas de BI externo.</p>
  <div class="section-tags">
    <span class="tag-teal">CSV · PDF</span>
    <span class="tag-blue">Relatórios agendados</span>
    <span class="status-badge status-proposed">🔵 Feature nova</span>
    <span class="tag-p2">P2</span>
  </div>
</div>

<h2>Mockup — Central de relatórios</h2>
<div class="mockup-container">
  <div class="mock-topbar">
    <span class="mock-logo">📋 Relatórios</span>
    <span style="margin-left:auto;display:flex;gap:6px;">
      <span class="mock-badge mock-badge-gray">+ Agendar relatório</span>
    </span>
  </div>
  <div class="mock-body">
    <table class="mock-table">
      <thead><tr><th>Relatório</th><th>Formatos</th><th>Agendamento</th><th>Ação</th></tr></thead>
      <tbody>
        <tr><td><strong>Clientes</strong></td><td><span class="mock-badge mock-badge-teal">CSV</span> <span class="mock-badge mock-badge-blue">XLSX</span></td><td><span class="mock-badge mock-badge-gray">Ad-hoc</span></td><td><span class="btn btn-primary" style="padding:4px 10px;font-size:11px">Gerar</span></td></tr>
        <tr><td><strong>Financeiro mensal</strong></td><td><span class="mock-badge mock-badge-purple">PDF</span> <span class="mock-badge mock-badge-teal">CSV</span></td><td><span class="mock-badge mock-badge-green">Mensal · cfo@</span></td><td><span class="btn btn-secondary" style="padding:4px 10px;font-size:11px">Histórico</span></td></tr>
        <tr><td><strong>Auditoria</strong></td><td><span class="mock-badge mock-badge-teal">CSV</span> <span class="mock-badge mock-badge-purple">PDF</span></td><td><span class="mock-badge mock-badge-gray">Ad-hoc</span></td><td><span class="btn btn-primary" style="padding:4px 10px;font-size:11px">Gerar</span></td></tr>
      </tbody>
    </table>
  </div>
</div>
<p class="mermaid-caption">Wireframe ilustrativo da central de relatórios: geração ad-hoc (CSV/PDF/XLSX) e relatórios agendados por e-mail. Exercita os botões <code>.btn</code> reais.</p>

<h2>Tipos de relatório</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Relatório</th><th>Dados incluídos</th><th>Formatos</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">Clientes</td><td>Cadastro completo, plano, status, health score, lojas</td><td>CSV, XLSX</td></tr>
      <tr><td class="td-bold">Lojas</td><td>Dados da loja, vertical, status, saúde, integrações</td><td>CSV, XLSX</td></tr>
      <tr><td class="td-bold">Financeiro mensal</td><td>MRR, churn, inadimplência, faturas do período</td><td>PDF, CSV</td></tr>
      <tr><td class="td-bold">Assinaturas</td><td>Lista de assinaturas ativas com plano e próximo vencimento</td><td>CSV, XLSX</td></tr>
      <tr><td class="td-bold">Auditoria</td><td>Ações dos operadores no período</td><td>CSV, PDF</td></tr>
      <tr><td class="td-bold">Onboarding</td><td>Status do checklist por cliente</td><td>CSV</td></tr>
    </tbody>
  </table>
</div>

<h2>Relatórios agendados</h2>
<div class="blueprint-proposed">
  <div class="blueprint-proposed-label">Proposta (alvo)</div>
  <ul>
    <li>Configurar relatório para ser gerado e enviado por e-mail automaticamente</li>
    <li>Frequência: diária, semanal, mensal</li>
    <li>Destinatários: e-mails configuráveis (operadores Citybox e/ou externo)</li>
    <li>Histórico dos últimos 12 relatórios gerados com link para download</li>
  </ul>
</div>

<div class="mermaid">
flowchart LR
  A[Configurar relatório agendado] --> B[Tipo + Frequência + Destinatários]
  B --> C[Job agendado no servidor]
  C --> D[Gera arquivo CSV/PDF]
  D --> E[Upload para storage]
  E --> F[Envia e-mail com link]
  F --> G[Histórico de entregas]
</div>

<h2>Exportação ad-hoc (sob demanda)</h2>
<p>Botões de exportação em todas as listas principais:</p>
<ul>
  <li>Lista de clientes → Exportar filtros atuais como CSV</li>
  <li>Lista de lojas → Exportar filtros atuais como CSV</li>
  <li>Auditoria global → Exportar período como CSV/PDF</li>
  <li>Histórico de faturas → Exportar período como PDF (formato contábil)</li>
</ul>

<h2>Endpoints propostos</h2>
<pre><code>GET /v1/reports/clients?format=csv&status=ativo
GET /v1/reports/stores?format=csv&vertical=food
GET /v1/reports/financial?format=pdf&period=2026-01
GET /v1/reports/audit?format=csv&start=2026-01-01&end=2026-01-31

POST /v1/reports/scheduled
{
  type: 'financial',
  frequency: 'monthly',
  format: 'pdf',
  recipients: ['cfo@citybox.com']
}

GET /v1/reports/scheduled/:id/history</code></pre>
`
});
