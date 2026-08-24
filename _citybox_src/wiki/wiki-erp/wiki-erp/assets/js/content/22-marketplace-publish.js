WIKI.register({
  id: 'marketplace-publish',
  title: 'Publicação no Marketplace',
  icon: '🌐',
  searchText: 'marketplace publicacao offers typesense projection vitrine disponibilidade horario',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Marketplace</div>
    <h1 class="section-title">🌐 Publicação no Marketplace</h1>
    <p class="section-subtitle">Como os dados da loja e catálogo são projetados no marketplace público Citybox — indexação no Typesense, disponibilidade em tempo real e gestão de horários.</p>
    <div class="section-tags">
      <span class="tag-orange">Marketplace</span>
      <span class="tag-amber">Typesense · Projection</span>
      <span class="tag-gray">Ofertas · Disponibilidade</span>
    </div>
  </div>

  <div class="eco-callout">
    <div class="eco-icon">🔗</div>
    <div class="eco-body">
      <div class="eco-title">O que o lojista publica aqui vira vitrine no Marketplace</div>
      <div class="eco-links">
        A projeção desta seção alimenta a oferta vista pelo consumidor —
        ver <a href="../../wiki-marketplace/index.html#loja-vitrine-oferta">Marketplace · Loja, Vitrine e Oferta</a>
        e <a href="../../wiki-marketplace/index.html#busca-typesense">Marketplace · Busca (Typesense)</a>.
        A loja é habilitada/monitorada pela plataforma em <a href="../../wiki-admin/index.html#loja-detalhe">Admin · Detalhe da Loja</a>.
      </div>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Worker de projeção indexa CatalogItem no Typesense após criação/edição</li>
      <li>Vitrine pública serve resultados do Typesense</li>
      <li>Loja publicada/não-publicada via <code>isPublished</code> flag</li>
      <li>Sem controle de disponibilidade por horário via ERP</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Painel "Minha Vitrine": preview de como a loja aparece no marketplace</li>
      <li>Horários de funcionamento configuráveis: abre/fecha automaticamente</li>
      <li>Disponibilidade por item: ativar/desativar item com 1 click</li>
      <li>Campanhas: banner patrocinado, destaque no marketplace</li>
      <li>Analytics da vitrine: impressões, cliques, taxa de conversão</li>
      <li>Promoções relâmpago: item com desconto por horário</li>
      <li>Gerenciar fotos e descrições otimizadas para conversão</li>
    </ul>
  </div>

  <h2>Pipeline de projeção</h2>
  <div class="mermaid">
flowchart LR
  ERP["ERP — gerente edita\nitem do catálogo"]
  CoreAPI["marketplace-api\n(POST/PUT /catalog)"]
  MQ["RabbitMQ\ncatalog.item.updated"]
  Worker["typesense-worker"]
  TS["Typesense\n(índice: catalog)"]
  VT["Vitrine Pública\n(app consumidor)"]

  ERP -->|edita| CoreAPI
  CoreAPI -->|outbox event| MQ
  MQ --> Worker
  Worker -->|upsert document| TS
  VT -->|search query| TS
  TS -->|resultados| VT
  </div>

  <h2>Documento Typesense (schema multi-vertical)</h2>
  <pre>// Exemplo Food:
{
  "id": "item_food_abc123",
  "storeId": "store_xyz",
  "storeName": "Burguer da Vila",
  "storeCategory": "food",
  "itemType": "PRODUCT",
  "name": "X-Burguer Classic",
  "description": "Pão brioche, 150g de blend, queijo prato...",
  "price": 25.90,
  "categoryName": "Hambúrgueres",
  "tags": ["burger", "carne"],
  "isAvailable": true,
  "channel": ["DELIVERY", "DINE_IN"],
  "deliveryTime": 35,
  "deliveryFee": 4.99
}

// Exemplo Beauty:
{
  "id": "item_beauty_def456",
  "storeId": "store_abc",
  "storeName": "Studio Bella",
  "storeCategory": "beauty",
  "itemType": "SERVICE",
  "name": "Corte + Escova",
  "description": "Corte feminino com escova modeladora",
  "price": 85.00,
  "categoryName": "Cabelo",
  "tags": ["corte", "escova", "feminino"],
  "isAvailable": true,
  "durationMinutes": 60,
  "channel": ["BOOKING"]  // canal de agendamento
}

// Campos comuns a todos os documentos:
// id, storeId, storeName, storeCategory, itemType, name, description
// price, imageUrl, categoryName, tags, isAvailable, rating, reviewCount
// geo: { lat, lng }, updatedAt</pre>

  <h2>Controle de horários de funcionamento</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Campo</th><th>Tipo</th><th>Exemplo</th></tr></thead>
      <tbody>
        <tr><td>dia</td><td>enum (seg-dom)</td><td>MON, TUE, SAT</td></tr>
        <tr><td>openAt</td><td>time</td><td>11:00</td></tr>
        <tr><td>closeAt</td><td>time</td><td>23:30</td></tr>
        <tr><td>interval</td><td>time range?</td><td>14:30–17:30 (fechado almoço)</td></tr>
        <tr><td>isOpen</td><td>boolean (override)</td><td>fechar manualmente no feriado</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Analytics da vitrine (proposta)</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">👁️</span> Impressões</div>
      <p>Quantas vezes a loja apareceu nos resultados de busca e lista de lojas do marketplace.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🖱️</span> Taxa de cliques (CTR)</div>
      <p>% de impressões que resultaram em abertura da vitrine. Indica qualidade de foto/nome/preço.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🛒</span> Conversão</div>
      <p>% de visitas que resultaram em pedido. Indica qualidade do cardápio e preço.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">⭐</span> Itens destaque</div>
      <p>Ranking dos 10 itens mais clicados e mais vendidos. Base para decisões de cardápio.</p>
    </div>
  </div>

  <h2>Gestão de disponibilidade de itens</h2>
  <div class="alert alert-orange">
    <span class="alert-icon">⚡</span>
    <div class="alert-body">
      <div class="alert-title">Disponibilidade em tempo real — diferencial crítico</div>
      <p>Cliente frustrante: adicionar item ao carrinho e descobrir que está indisponível. O ERP deve permitir ativar/desativar itens em &lt;2s, propagando ao Typesense e ao carrinho ativo dos clientes via WebSocket. <span class="tag-p1">P1</span></p>
    </div>
  </div>
  <pre>// Toggle de disponibilidade (1 click no ERP)
async function toggleItemAvailability(itemId: string, isAvailable: boolean) {
  // 1. Atualiza no DB
  await api.patch(\`/catalog/\${itemId}\`, { isAvailable });
  // 2. Worker emite catalog.item.updated → Typesense upsert
  // 3. WebSocket push ao marketplace (remover do carrinho se inativo)
}</pre>
</div>
`
});
