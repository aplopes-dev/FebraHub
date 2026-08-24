WIKI.register({
  id: 'como-aprovar-marketplace',
  title: 'Como Aprovar este Wiki',
  icon: '✅',
  searchText: 'aprovar wiki relatorio aprovacao feedback exportar instrucoes como funciona widget status secoes',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Evolução</div>
    <h1 class="section-title">✅ Como Aprovar este Wiki</h1>
    <p class="section-subtitle">Este wiki cobre o Marketplace Citybox — o lado consumidor (B2C) que vende produtos de todas as verticais. Revise cada seção e use o widget de aprovação para registrar seu feedback.</p>
  </div>

  <div class="alert alert-indigo">
    <span class="alert-icon">📋</span>
    <div class="alert-body">
      <div class="alert-title">Como funciona</div>
      <p>1. Navegue pelas seções usando o menu lateral.<br>
         2. Ao final de cada seção, clique <strong>"Aprovar esta seção"</strong> se o conteúdo está correto, ou <strong>"Solicitar ajuste"</strong> se precisar de mudanças (deixe um comentário).<br>
         3. O progresso aparece na barra superior.<br>
         4. Quando todas as seções estiverem revisadas, volte aqui e exporte o relatório.</p>
    </div>
  </div>

  <h2>Resumo de aprovações</h2>
  <div id="approvalSummaryContainer">
    <p style="color:var(--text-muted)">Carregando...</p>
  </div>

  <h2>Exportar relatório</h2>
  <p>Quando terminar a revisão, exporte o relatório consolidado:</p>
  <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">
    <button class="mock-btn mock-btn-primary" id="exportFeedbackBtn">📋 Copiar relatório</button>
    <button class="mock-btn mock-btn-outline" id="printFeedbackBtn">🖨️ Imprimir</button>
  </div>

  <h2>Seções do Wiki Marketplace</h2>
  <div class="card-grid">
    <div class="card card-indigo">
      <div class="card-title"><span class="card-icon">🛍️</span> Introdução</div>
      <ul style="font-size:13px">
        <li>Visão Geral</li>
        <li>Benchmark (iFood/Rappi/etc)</li>
        <li>Jornada do Consumidor</li>
      </ul>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🔍</span> Descoberta</div>
      <ul style="font-size:13px">
        <li>Home e Discovery</li>
        <li>Busca Typesense</li>
        <li>Loja, Vitrine e Oferta</li>
      </ul>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">💳</span> Transação</div>
      <ul style="font-size:13px">
        <li>Carrinho Multiloja</li>
        <li>Checkout C-05</li>
        <li>Pagamento e Split</li>
      </ul>
    </div>
    <div class="card card-purple">
      <div class="card-title"><span class="card-icon">📦</span> Pedido</div>
      <ul style="font-size:13px">
        <li>Acompanhamento</li>
        <li>Pós-venda e Suporte</li>
        <li>Notificações</li>
      </ul>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🎁</span> Engajamento</div>
      <ul style="font-size:13px">
        <li>Fidelidade e Promoções</li>
        <li>Multi-vertical e Catálogo</li>
        <li>Tenancy Municipal</li>
      </ul>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">🏗️</span> Arquitetura</div>
      <ul style="font-size:13px">
        <li>App Nativo e PWA</li>
        <li>Arquitetura Completa</li>
        <li>Modelo de Dados</li>
        <li>Roadmap</li>
      </ul>
    </div>
  </div>
</div>
`
});
