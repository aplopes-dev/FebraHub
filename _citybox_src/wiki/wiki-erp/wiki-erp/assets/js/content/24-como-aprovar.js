WIKI.register({
  id: 'como-aprovar',
  title: 'Como Aprovar este Wiki',
  icon: '✅',
  searchText: 'como aprovar wiki feedback instrucoes relatorio exportar stakeholder revisao',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Evolução</div>
    <h1 class="section-title">✅ Como Aprovar este Wiki</h1>
    <p class="section-subtitle">Instruções para revisão e aprovação do Wiki ERP Base — como usar o widget de aprovação por seção e gerar o relatório final para a equipe.</p>
    <div class="section-tags">
      <span class="tag-amber">Aprovação</span>
      <span class="tag-gray">Instrução de uso</span>
    </div>
  </div>

  <h2>Como funciona o processo de aprovação</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">1️⃣</span> Leia cada seção</div>
      <p>Use a barra lateral esquerda para navegar entre as 24 seções. Leia o conteúdo de "Hoje" e "Proposta" com atenção.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">2️⃣</span> Vote: Aprovar ou Ajustar</div>
      <p>No final de cada seção há um widget. Clique em <strong>✅ Aprovar</strong> se concordar com o conteúdo, ou <strong>✏️ Solicitar ajuste</strong> para deixar um comentário.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">3️⃣</span> Acompanhe o progresso</div>
      <p>A barra no topo mostra quantas seções foram aprovadas. Os pontos na sidebar indicam o status de cada item (verde = aprovado, amarelo = com ajuste, cinza = pendente).</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">4️⃣</span> Exporte o relatório</div>
      <p>Quando terminar, clique em <strong>📋 Copiar relatório</strong> abaixo para copiar o resumo completo de aprovações. Cole em um ticket ou e-mail para a equipe de desenvolvimento.</p>
    </div>
  </div>

  <div class="alert alert-orange">
    <span class="alert-icon">💡</span>
    <div class="alert-body">
      <div class="alert-title">Dica: o progresso fica salvo no seu browser</div>
      <p>Todas as aprovações são salvas no localStorage do navegador. Você pode fechar o wiki e retomar depois — o progresso é preservado. Use o mesmo dispositivo e browser para continuar de onde parou.</p>
    </div>
  </div>

  <h2>Resumo de aprovações</h2>
  <div id="approvalSummaryContainer" style="margin: 16px 0;">
    <div style="color: var(--text-muted); font-size:14px;">Navegue pelas seções e vote para ver o resumo aqui.</div>
  </div>

  <h2>Exportar relatório</h2>
  <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap;">
    <button class="btn btn-primary" id="exportFeedbackBtn">📋 Copiar relatório</button>
    <button class="btn btn-secondary" id="printFeedbackBtn">🖨️ Imprimir</button>
  </div>

  <h2>Dúvidas sobre uma seção?</h2>
  <p>Use o campo de comentário do widget de ajuste para deixar perguntas específicas. A equipe irá revisar e atualizar o conteúdo antes do desenvolvimento.</p>
  <p>Para dúvidas gerais, entre em contato via canal <strong>#wiki-erp</strong> no Slack da equipe.</p>
</div>
`
});
