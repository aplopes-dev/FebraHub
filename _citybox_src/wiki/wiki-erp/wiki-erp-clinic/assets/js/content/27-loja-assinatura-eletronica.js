WIKI.register({
  id: 'loja-assinatura-eletronica',
  title: 'Loja · Assinatura Eletrônica',
  icon: '🛒',
  searchText: 'loja assinatura eletronica pacotes signature-packages signature-credits ZapSign saldo solicitar historico solicitacoes card cinza DataTable paginacao page perPage pending liberado cancelado Pendente Aprovado Recusado relatorio electronic-signatures pkg-250 pkg-600 pkg-1000 /loja /loja/assinatura-eletronica',
  html: `
<div class="section-content">

  <div class="section-header">
    <div class="section-breadcrumb">Operações</div>
    <h1 class="section-title">🛒 Loja · Assinatura Eletrônica</h1>
    <p class="section-subtitle">Pacotes de créditos ZapSign para a clínica: solicitar, acompanhar histórico, consultar saldo e o relatório de documentos enviados.</p>
    <div class="section-tags">
      <span class="tag-cyan">Loja</span>
      <span class="tag-teal">ZapSign</span>
      <span class="tag-green">API</span>
    </div>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Implementado (ago/2026) — <code>/loja</code> + <code>/loja/assinatura-eletronica</code></div>
      <p><strong>Backend:</strong> módulo <code>signature-packages</code> + relatório <code>GET /v1/electronic-signatures</code> na <code>clinica-api</code>.<br>
      <strong>Web:</strong> <code>apps/verticals/clinica/web/.../loja/</code> · <code>signature-packages.api.service.ts</code> + React Query.<br>
      <strong>Permissão:</strong> <code>manage</code> Settings (sem CASL dedicado de Loja). Liberar/cancelar solicitação = admin de plataforma.</p>
    </div>
  </div>

  <h2>1. Pacotes</h2>
  <p>Catálogo fixo (ids alinhados à API): <code>pkg-250</code> (250), <code>pkg-600</code> (600), <code>pkg-1000</code> (1000). Cards azuis (<code>#0B3A6E</code>) com botão <strong>Solicitar</strong> → <code>POST /v1/signature-package-requests</code>. Enquanto houver solicitação <code>pending</code> daquele pacote, o botão fica <strong>Solicitado</strong> (desabilitado). Liberação de créditos no admin.</p>

  <h2>2. Card de solicitações (cinza)</h2>
  <p>4º card ao lado dos pacotes (<code>#5B6472</code>): número total de solicitações da <strong>loja</strong> (<code>meta.total</code>) e botão <strong>Ver todos</strong>.</p>
  <div class="alert alert-amber">
    <strong>Escopo.</strong> O histórico é por clínica (<code>X-Store-Id</code>), não por usuário — a API não grava solicitante.
  </div>

  <h2>3. Modal histórico</h2>
  <p><code>DataTable</code> padrão com colunas <strong>Data</strong> / <strong>Assinatura</strong> / <strong>Status</strong> e paginação server-side (§8.1).</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>API status</th><th>Label UI</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>pending</code></td><td>Pendente</td></tr>
        <tr><td class="td-bold"><code>liberado</code></td><td>Aprovado</td></tr>
        <tr><td class="td-bold"><code>cancelado</code></td><td>Recusado</td></tr>
      </tbody>
    </table>
  </div>
  <p><code>GET /v1/signature-package-requests?page=&amp;perPage=&amp;status?</code> → envelope <code>{ data, meta: { total, page, perPage, totalPages } }</code> (default <code>perPage=10</code>).</p>

  <h2>4. Saldo e relatório</h2>
  <ul>
    <li><strong>Saldo:</strong> <code>GET /v1/signature-credits</code> — créditos disponíveis para envio ZapSign.</li>
    <li><strong>Relatório de assinaturas:</strong> KPIs (enviados / pendentes / assinados) + tabela server-side de documentos (<code>GET /v1/electronic-signatures</code> com período/filtros).</li>
  </ul>

</div>
`,
});
