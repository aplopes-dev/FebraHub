WIKI.register({
  id: 'relatorios-food',
  title: 'Relatórios e Analytics Food',
  icon: '📈',
  searchText: 'relatorios analytics food menu engineering attachment rate table turn rotatividade ticket medio curva abc item popularidade margem',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Analytics e Evolução</div>
    <h1 class="section-title">📈 Relatórios e Analytics Food</h1>
    <p class="section-subtitle">Inteligência específica para restaurantes: menu engineering (popularidade × margem), attachment rate, table turn time, food cost por canal e ranking de itens — base para decisões de cardápio e operação.</p>
    <div class="section-tags">
      <span class="tag-red">Analytics</span>
      <span class="tag-orange">Menu Engineering</span>
      <span class="tag-gray">Attachment Rate · Table Turn</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Permissões <code>analytics:view</code>, <code>relatorios:view</code>, <code>relatorios:export</code> definidas no catálogo food</li>
      <li>Sem relatórios food-específicos implementados</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Analytics Food Completo</div>
    <ul>
      <li>Menu engineering: quadrante popularidade × margem (Stars, Plowhorses, Puzzles, Dogs)</li>
      <li>Attachment rate: taxa de modificadores/adicionais vendidos por item base</li>
      <li>Table turn time: tempo médio de ocupação por mesa, por dia/turno</li>
      <li>Food cost % por item, categoria, canal e período</li>
      <li>Ranking de itens: mais vendidos, maior receita, maior margem</li>
      <li>Análise por canal: volume e ticket médio (salão vs delivery vs balcão)</li>
      <li>Relatório de horário de pico: pedidos por hora, dias da semana</li>
    </ul>
  </div>

  <h2>Menu Engineering — quadrante</h2>
  <div class="mermaid">
quadrantChart
  title Menu Engineering — Popularidade x Margem
  x-axis Baixa Popularidade --> Alta Popularidade
  y-axis Baixa Margem --> Alta Margem
  quadrant-1 Stars (manter + promover)
  quadrant-2 Puzzles (promover ou reformular)
  quadrant-3 Dogs (revisar ou remover)
  quadrant-4 Plowhorses (reduzir custo)
  X-Burguer Simples: [0.8, 0.5]
  X-Burguer Duplo: [0.9, 0.75]
  Pizza Margherita: [0.6, 0.8]
  Batata Frita: [0.85, 0.35]
  Salada Caesar: [0.2, 0.7]
  Shake Especial: [0.3, 0.6]
  </div>

  <h2>Definição das categorias</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Categoria</th><th>Popularidade</th><th>Margem</th><th>Ação</th></tr></thead>
      <tbody>
        <tr><td><span class="tag-green">⭐ Stars</span></td><td>Alta</td><td>Alta</td><td>Destacar no cardápio, promover, nunca remover</td></tr>
        <tr><td><span class="tag-orange">❓ Puzzles</span></td><td>Baixa</td><td>Alta</td><td>Promover mais, reposicionar no cardápio</td></tr>
        <tr><td><span class="tag-amber">🐄 Plowhorses</span></td><td>Alta</td><td>Baixa</td><td>Reduzir custo de insumo ou aumentar preço gradualmente</td></tr>
        <tr><td><span class="tag-gray">🐕 Dogs</span></td><td>Baixa</td><td>Baixa</td><td>Revisar com urgência, considerar remoção</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Attachment Rate</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Item base</th><th>Adicional</th><th>Taxa de attach</th><th>Receita extra</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">X-Burguer</td><td>Batata frita</td><td>72%</td><td>R$ 4.320/mês</td></tr>
        <tr><td class="td-bold">X-Burguer</td><td>Refrigerante</td><td>88%</td><td>R$ 6.160/mês</td></tr>
        <tr><td class="td-bold">Pizza</td><td>Borda recheada</td><td>45%</td><td>R$ 1.800/mês</td></tr>
        <tr><td class="td-bold">Açaí</td><td>Granola</td><td>91%</td><td>R$ 2.730/mês</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Table Turn Time</h2>
  <div class="mermaid">
xychart-beta
  title "Tempo médio de mesa (min) por dia da semana"
  x-axis [Seg, Ter, Qua, Qui, Sex, Sab, Dom]
  y-axis "Minutos" 0 --> 120
  bar [55, 52, 58, 60, 75, 95, 85]
  line [60, 60, 60, 60, 60, 60, 60]
  </div>

  <h2>Relatórios disponíveis</h2>
  <div class="card-grid">
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">📋</span> Vendas por período</div>
      <p>Receita, pedidos, ticket médio. Filtros: dia, semana, mês, canal, categoria.</p>
    </div>
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">🥩</span> Food Cost</div>
      <p>CMV real vs target por item, categoria e período. Alerta de desvio.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🏆</span> Ranking de Itens</div>
      <p>Top 10 por quantidade, receita e margem. Base para tomada de decisão de cardápio.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🕐</span> Horário de Pico</div>
      <p>Heatmap de pedidos por hora e dia da semana. Planejamento de escala da equipe.</p>
    </div>
    <div class="card card-purple">
      <div class="card-title"><span class="card-icon">🛵</span> Performance Delivery</div>
      <p>Tempo médio de entrega, taxa de cancelamento, avaliações por canal.</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">📤</span> Exportação</div>
      <p>CSV / Excel para contabilidade e análise externa. Agendamento automático por e-mail.</p>
    </div>
  </div>
</div>
`
});
