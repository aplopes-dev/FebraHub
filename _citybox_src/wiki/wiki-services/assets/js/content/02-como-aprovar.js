WIKI.register({
  id: 'como-aprovar',
  title: 'Como Aprovar',
  icon: '✅',
  searchText: 'aprovar seções revisão aprovação feedback comentário relatório progresso export print',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Aprovação</div>
  <h1 class="section-title">✅ Como Aprovar este Wiki</h1>
  <p class="section-subtitle">Este wiki é um blueprint de desenvolvimento dos Services Citybox. Use os botões em cada seção para aprovar o conteúdo ou solicitar ajustes. Esta seção mostra o progresso geral.</p>
  <div class="section-tags">
    <span class="tag-teal">Revisão</span>
    <span class="tag-gray">2 seções para revisar</span>
  </div>
</div>

<h2>Como funciona</h2>
<div class="card-grid">
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">👁️</span> 1. Leia a seção</div>
    <p>Navegue pelo menu lateral e leia o conteúdo de cada seção. Verifique os módulos, fluxos e eventos documentados.</p>
  </div>
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">✅</span> 2. Aprove ou peça ajuste</div>
    <p>No final de cada seção há um widget de aprovação. Clique <strong>Aprovar</strong> se o conteúdo está correto, ou <strong>Solicitar ajuste</strong> e escreva o que deve mudar.</p>
  </div>
  <div class="card card-blue">
    <div class="card-title"><span class="card-icon">📊</span> 3. Acompanhe o progresso</div>
    <p>A barra de progresso no header mostra quantas seções foram aprovadas. O menu lateral exibe badges coloridos por seção.</p>
  </div>
  <div class="card card-blue">
    <div class="card-title"><span class="card-icon">📋</span> 4. Exporte o relatório</div>
    <p>Quando terminar a revisão, copie o relatório de aprovação abaixo para compartilhar com o time.</p>
  </div>
</div>

<h2>Seções para revisar</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Grupo</th><th>Seções</th><th>Status da revisão</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">Introdução</td><td>Visão Geral — Services</td><td>Ver badges no menu →</td></tr>
      <tr><td class="td-bold">Serviços</td><td>Payment API</td><td>Ver badges no menu →</td></tr>
    </tbody>
  </table>
</div>

<h2>Legenda de badges</h2>
<ul>
  <li><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#d1fae5;border:2px solid #16a34a;margin-right:6px"></span><strong>Verde</strong> — seção aprovada</li>
  <li><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#fef9c3;border:2px solid #ca8a04;margin-right:6px"></span><strong>Amarelo</strong> — ajuste solicitado</li>
  <li><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#f3f4f6;border:2px solid #9ca3af;margin-right:6px"></span><strong>Cinza</strong> — pendente de revisão</li>
</ul>

<h2>Relatório de aprovação</h2>
<div id="approvalSummaryContainer" style="margin-top:12px"></div>

<div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap">
  <button id="exportFeedbackBtn" class="btn btn-primary">📋 Copiar relatório</button>
  <button id="printFeedbackBtn" class="btn btn-secondary">🖨️ Imprimir</button>
</div>
`
});
