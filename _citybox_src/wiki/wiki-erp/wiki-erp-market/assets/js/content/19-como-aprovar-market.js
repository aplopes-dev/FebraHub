WIKI.register({
  id: 'como-aprovar-market',
  title: 'Como Aprovar este Wiki',
  icon: '✅',
  searchText: 'como aprovar wiki feedback aprovacao revisao processo checklist market varejo',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Analytics e Evolução</div>
    <h1 class="section-title">✅ Como Aprovar este Wiki</h1>
    <p class="section-subtitle">Guia para o processo de revisão e aprovação das seções do Wiki ERP Market. Use o widget de feedback em cada seção para registrar sua avaliação e gerar o relatório final de aprovação.</p>
    <div class="section-tags">
      <span class="tag-green">Aprovação</span>
      <span class="tag-gray">19 seções</span>
    </div>
  </div>

  <h2>Processo de revisão sugerido</h2>
  <div class="card-grid">
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">1️⃣</span> Leia cada seção</div>
      <p>Navegue pelas 19 seções usando o menu lateral. Leia o diagnóstico atual, a proposta e os diagramas.</p>
    </div>
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">2️⃣</span> Avalie com o widget</div>
      <p>No rodapé de cada seção: clique em <strong>"Aprovar"</strong> se o conteúdo está correto, ou <strong>"Solicitar Ajuste"</strong> e descreva o que mudar.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">3️⃣</span> Acompanhe o progresso</div>
      <p>A barra no topo mostra quantas seções foram aprovadas. Tente fechar todas as seções antes de avançar para a implementação.</p>
    </div>
    <div class="card card-lime">
      <div class="card-title"><span class="card-icon">4️⃣</span> Exporte o relatório</div>
      <p>Clique em "Copiar Relatório" abaixo para gerar o relatório de aprovação formatado, pronto para incluir no ticket ou PR.</p>
    </div>
  </div>

  <h2>Seções a revisar</h2>
  <p>O wiki tem <strong>19 seções de conteúdo</strong> organizadas em 9 grupos temáticos:</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Grupo</th><th>Seções</th><th>Foco</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Introdução</td><td>3</td><td>Visão geral, benchmark, jornada do varejo</td></tr>
        <tr><td class="td-bold">Catálogo e Preço</td><td>3</td><td>Catálogo EAN, balança/granel, precificação</td></tr>
        <tr><td class="td-bold">Frente de Caixa</td><td>1</td><td>PDV offline, NFC-e, sessão de caixa</td></tr>
        <tr><td class="td-bold">Estoque e Suprimento</td><td>3</td><td>Validade/FEFO, recebimento NF-e, compras</td></tr>
        <tr><td class="td-bold">Pedidos e Canais</td><td>1</td><td>Omnichannel, picking, delivery</td></tr>
        <tr><td class="td-bold">Fiscal e Financeiro</td><td>2</td><td>NFC-e, CBS/IBS, DRE varejo</td></tr>
        <tr><td class="td-bold">Clientes e Marketplace</td><td>2</td><td>CRM/clube, vitrine marketplace</td></tr>
        <tr><td class="td-bold">Acesso e Configurações</td><td>2</td><td>RBAC papéis, settings da loja</td></tr>
        <tr><td class="td-bold">Analytics e Evolução</td><td>2</td><td>Relatórios, roadmap RICE</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Status atual de aprovação</h2>
  <div id="approvalSummaryContainer">
    <div class="loading-placeholder">
      <div class="loading-spinner"></div>
      <span>Carregando status de aprovação…</span>
    </div>
  </div>

  <div style="margin-top:24px;display:flex;gap:10px;flex-wrap:wrap">
    <button id="exportFeedbackBtn" style="padding:10px 20px;background:#059669;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer">
      📋 Copiar relatório de aprovação
    </button>
    <button id="printFeedbackBtn" style="padding:10px 20px;background:#f3f4f6;border:1.5px solid #d1d5db;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer">
      🖨️ Imprimir
    </button>
  </div>
</div>
`
});
