WIKI.register({
  id: 'relatorios-market',
  title: 'Analytics e Relatórios',
  icon: '📈',
  searchText: 'relatorios analytics curva ABC margem ruptura cesta media top SKU giro inventario dashboard varejo',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Analytics e Evolução</div>
    <h1 class="section-title">📈 Analytics e Relatórios — Market</h1>
    <p class="section-subtitle">Indicadores específicos de varejo: curva ABC, margem por categoria, ruptura/quebra, top SKUs, cesta média, giro de estoque e análise de promoções — base para decisões de compra e precificação.</p>
    <div class="section-tags">
      <span class="tag-green">Analytics</span>
      <span class="tag-emerald">Curva ABC</span>
      <span class="tag-gray">Margem · Giro · Ruptura</span>
    </div>
  </div>

  <h2>Relatórios prioritários do varejo</h2>
  <div class="card-grid">
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">📊</span> Curva ABC de Produtos</div>
      <p>Classifica produtos por faturamento: A (70%), B (20%), C (10%). Guia o foco de compras, reposição e promoções.</p>
    </div>
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">💰</span> Margem por Categoria</div>
      <p>Mostra onde está o lucro real: hortifrúti vs mercearia vs bebidas. Identifica categorias abaixo da meta.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">⚠️</span> Ruptura e Quebra</div>
      <p>Produtos em falta + perdas por validade. Permite estimar impacto financeiro das rupturas.</p>
    </div>
    <div class="card card-lime">
      <div class="card-title"><span class="card-icon">🛒</span> Cesta Média</div>
      <p>Ticket médio + composição da cesta (categorias mais presentes). Serve para promoções de aumento de ticket.</p>
    </div>
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">🔄</span> Giro de Estoque</div>
      <p>Quantas vezes cada produto "girou" no período. Baixo giro = estoque parado = capital preso.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🏷️</span> Efetividade de Promoções</div>
      <p>Venda antes vs durante a promoção. Calcula incremental e se o desconto compensou.</p>
    </div>
  </div>

  <h2>Dashboard de indicadores diários</h2>
  <div class="mockup-container">
    <div class="mock-topbar"><span class="mock-logo">📈 Analytics — Mercadinho Central — Hoje</span></div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px">
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#059669">R$4.832</div><div class="mock-kpi-sub">Faturamento</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#059669">24,1%</div><div class="mock-kpi-sub">Margem bruta</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#f59e0b">R$68,30</div><div class="mock-kpi-sub">Ticket médio</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#dc2626">7</div><div class="mock-kpi-sub">SKUs em ruptura</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:11px">
        <div style="background:#fff;border:1px solid #d1fae5;border-radius:8px;padding:10px">
          <div style="font-weight:700;margin-bottom:8px">🏆 Top 5 SKUs — Hoje</div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <div style="display:flex;justify-content:space-between"><span>Coca-Cola 2L</span><span style="font-weight:600">R$312</span></div>
            <div style="display:flex;justify-content:space-between"><span>Arroz Camil 5kg</span><span style="font-weight:600">R$274</span></div>
            <div style="display:flex;justify-content:space-between"><span>Peito Frango kg</span><span style="font-weight:600">R$198</span></div>
            <div style="display:flex;justify-content:space-between"><span>Leite Integral 1L</span><span style="font-weight:600">R$167</span></div>
            <div style="display:flex;justify-content:space-between"><span>Pão Forma fatiado</span><span style="font-weight:600">R$142</span></div>
          </div>
        </div>
        <div style="background:#fff;border:1px solid #fca5a5;border-radius:8px;padding:10px">
          <div style="font-weight:700;margin-bottom:8px;color:#dc2626">⚠️ Ruptura / Vencimento</div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <div style="display:flex;justify-content:space-between"><span style="color:#dc2626">Iogurte Nestlé 170g</span><span class="mock-badge mock-badge-red">Vence em 2d</span></div>
            <div style="display:flex;justify-content:space-between"><span style="color:#92400e">Tomate kg</span><span class="mock-badge mock-badge-yellow">Ruptura</span></div>
            <div style="display:flex;justify-content:space-between"><span style="color:#dc2626">Queijo Prato kg</span><span class="mock-badge mock-badge-red">Vence em 3d</span></div>
            <div style="display:flex;justify-content:space-between"><span style="color:#92400e">Banana Nanica</span><span class="mock-badge mock-badge-yellow">Estoque baixo</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <h2>Curva ABC — tabela</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Classe</th><th>% SKUs</th><th>% Faturamento</th><th>Ação recomendada</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">A</td><td>~15%</td><td>70%</td><td>Prioridade máxima de reposição; nunca deixar em ruptura; negociar melhor preço c/ fornecedor</td></tr>
        <tr><td class="td-bold">B</td><td>~20%</td><td>20%</td><td>Estoque regular; revisar sazonalidade; oportunidade de promoção para subir para A</td></tr>
        <tr><td class="td-bold">C</td><td>~65%</td><td>10%</td><td>Revisar permanência: descontinuar se giro &lt;3x/ano; manter estoque mínimo</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
