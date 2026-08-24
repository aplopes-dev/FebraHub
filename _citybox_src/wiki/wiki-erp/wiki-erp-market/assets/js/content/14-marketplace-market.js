WIKI.register({
  id: 'marketplace-market',
  title: 'Marketplace Citybox',
  icon: '🏪',
  searchText: 'marketplace citybox vitrine loja market busca EAN categoria disponibilidade entrega delivery sincronizacao typesense',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Clientes e Marketplace</div>
    <h1 class="section-title">🏪 Marketplace Citybox — Vertical Market</h1>
    <p class="section-subtitle">Configuração da vitrine do supermercado/mercearia no marketplace Citybox: catálogo com busca por EAN, disponibilidade em tempo real, configuração de entrega e sincronização via Typesense.</p>
    <div class="section-tags">
      <span class="tag-green">Marketplace</span>
      <span class="tag-emerald">Typesense</span>
      <span class="tag-gray">Vitrine · Entrega</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (Funcional)</div>
    <ul>
      <li><code>CatalogItem.type = RETAIL</code> publicado via marketplace-api</li>
      <li>Estoque visível via <code>InventoryStock</code> — mas sem regras de disponibilidade</li>
      <li>Sem configuração de vitrine, entrega ou horários por loja no canal market</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Vitrine Market Completa</div>
    <ul>
      <li>Perfil da loja: logo, horários de funcionamento, raio de entrega, taxas</li>
      <li>Catálogo com busca por EAN, nome, marca e categoria</li>
      <li>Disponibilidade em tempo real: produto some quando estoque = 0</li>
      <li>Produtos pesados: campo "vendido por kg" com variação de preço</li>
      <li>Sincronização automática com Typesense quando preço/estoque mudar</li>
      <li>Horário de entrega configurável por dia da semana</li>
      <li>Lista de compras: cliente salva lista recorrente e repede com 1 clique</li>
      <li>Promoções visíveis na vitrine: badge "OFERTA" e preço riscado</li>
    </ul>
  </div>

  <h2>Sincronização de catálogo com Typesense</h2>
  <div class="mermaid">
sequenceDiagram
  participant ERP
  participant MarketAPI as market-api
  participant MktAPI as marketplace-api
  participant MQ as RabbitMQ
  participant TS as Typesense

  ERP->>MarketAPI: Atualiza preço produto (PDV/ERP)
  MarketAPI->>MktAPI: PATCH /catalog/{id} { price: 2490 }
  MktAPI->>MQ: Publica event CatalogUpdated
  MQ->>TS: Sync document { id, name, price, ean, stock }
  TS->>TS: Atualiza índice (busca em <100ms)
  note over TS: Cliente vê novo preço imediatamente
  </div>

  <h2>Diferenças da vitrine market vs food</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Feature</th><th>Vitrine Market</th><th>Vitrine Food</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Busca</td><td>Por EAN, nome, marca, categoria</td><td>Por prato, categoria, ingrediente</td></tr>
        <tr><td class="td-bold">Unidade</td><td>un, kg, g, l — preço variável por peso</td><td>Sempre por item/combo</td></tr>
        <tr><td class="td-bold">Promoções</td><td>Desconto de preço, leve-X-pague-Y</td><td>Combo, modificadores sem custo</td></tr>
        <tr><td class="td-bold">Disponibilidade</td><td>Estoque em tempo real (FEFO incluso)</td><td>Horário de funcionamento + preparo</td></tr>
        <tr><td class="td-bold">Lista</td><td>Lista de compras recorrente</td><td>Pedido avulso</td></tr>
        <tr><td class="td-bold">Entrega</td><td>Picking + entrega 2-4h ou agendada</td><td>Delivery 30-60 min quente</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Vantagem competitiva — marketplace integrado</h2>
  <div class="alert alert-green">
    <span class="alert-icon">🚀</span>
    <div class="alert-body">
      <div class="alert-title">Diferencial nativo Citybox</div>
      <p>Supermercados no Citybox têm <strong>marketplace integrado sem taxa de plataforma sobre a venda</strong> (ao contrário de iFood, Rappi ou Zé Delivery). O lojista paga apenas a mensalidade do ERP + custo de entrega própria. Isso é um diferencial estratégico especialmente para mercearias e supermercados de bairro que têm margem muito apertada.</p>
    </div>
  </div>
</div>
`
});
