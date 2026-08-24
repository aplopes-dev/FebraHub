WIKI.register({
  id: 'busca-typesense',
  title: 'Busca — Typesense',
  icon: '🔍',
  searchText: 'busca typesense product-first multi-loja filtros categoria preco dieta disponibilidade intent ranking geo colecao offers stores pesquisa full-text facets',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Descoberta e Busca</div>
    <h1 class="section-title">🔍 Busca Typesense — Product-First Multi-loja</h1>
    <p class="section-subtitle">A busca do Marketplace é product-first: o consumidor busca um produto e o sistema mostra em qual loja está disponível. Diferente de buscar a loja primeiro, isso reduz fricção e aumenta conversão.</p>
    <div class="section-tags">
      <span class="tag-indigo">Typesense</span>
      <span class="tag-blue">Coleção offers</span>
      <span class="tag-blue">Coleção stores</span>
      <span class="tag-violet">Product-first</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">🟢 Hoje (MVP)</div>
    <p><code>GET /v1/app/search?q=&amp;category=&amp;storeId=</code> no BFF consulta o Typesense na coleção <code>offers</code> (indexada pelo worker a partir de <code>MarketplaceOffer</code>). Retorna lista de offers com nome, preço, loja, disponibilidade. Filtragem por categoria disponível.</p>
  </div>

  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">💡 Proposta (produto alvo)</div>
    <p>Busca product-first com facets (categoria, preço mín/máx, restrição dietética, vertical, avaliação, entrega grátis), geo-filtering por raio, intent detection (produto vs loja vs categoria), ranking por relevância + disponibilidade + rating + preço. Auto-complete com typo-tolerance. Busca por voz no app nativo.</p>
  </div>

  <h2>Arquitetura da busca</h2>
  <div class="mermaid">
flowchart LR
  subgraph indexacao [Indexação — Worker]
    W["workers :3105"]
    MQ["RabbitMQ\ncatalog.item.updated"]
    DB[("Postgres\nMarketplaceOffer")]
    TS[("Typesense\ncoleção offers")]
    W -->|"consome"| MQ
    W -->|"upsert"| TS
    W -->|"projeta"| DB
  end

  subgraph busca [Busca — BFF]
    App["App\nconsumidor"]
    BFF["BFF :3102\n/v1/app/search"]
    App -->|"GET ?q=pizza"| BFF
    BFF -->|"multi-search"| TS
  end
  </div>

  <h2>Schema da coleção <code>offers</code> (Typesense)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Campo</th><th>Tipo</th><th>Uso</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">id</td><td><code>string</code></td><td>ID único da offer</td></tr>
        <tr><td class="td-bold">name</td><td><code>string</code> (indexed)</td><td>Nome do produto — campo principal de busca</td></tr>
        <tr><td class="td-bold">description</td><td><code>string</code> (indexed)</td><td>Texto livre para match</td></tr>
        <tr><td class="td-bold">storeId</td><td><code>string</code> (facet)</td><td>Loja que possui o produto</td></tr>
        <tr><td class="td-bold">storeName</td><td><code>string</code></td><td>Nome da loja para display</td></tr>
        <tr><td class="td-bold">vertical</td><td><code>string</code> (facet)</td><td>FOOD / RETAIL / SERVICE / CLINIC / BEAUTY</td></tr>
        <tr><td class="td-bold">price</td><td><code>float</code> (sortable)</td><td>Preço de venda atual</td></tr>
        <tr><td class="td-bold">available</td><td><code>bool</code> (facet)</td><td>Disponível em estoque</td></tr>
        <tr><td class="td-bold">rating</td><td><code>float</code> (sortable)</td><td>Rating médio do produto</td></tr>
        <tr><td class="td-bold">tags</td><td><code>string[]</code> (facet)</td><td>Ex.: vegetariano, sem glúten, oferta</td></tr>
        <tr><td class="td-bold">geo</td><td><code>geopoint</code></td><td>Localização da loja para geo-filter</td></tr>
        <tr><td class="td-bold">updatedAt</td><td><code>int64</code></td><td>Timestamp para ranking de frescor</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Estratégia de ranking</h2>
  <div class="card-grid">
    <div class="card card-indigo">
      <div class="card-title"><span class="card-icon">🎯</span> Relevância textual</div>
      <p>Typesense BM25 + typo-tolerance. Match em <code>name</code> > <code>description</code> > <code>tags</code>. Prioridade: exato > prefixo > fuzzy.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">📍</span> Proximidade geo</div>
      <p>Distância da loja ao endereço do usuário como fator de boost. Lojas no raio de 5km prioritárias. Ajustável por vertical (farmácia: 2km; mercado: 8km).</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">⭐</span> Rating + conversão</div>
      <p>Boost por rating médio (peso 0.3) + taxa de conversão histórica da loja (0.2). Impede lojas com rating baixo de aparecer no topo.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">✅</span> Disponibilidade</div>
      <p>Filtro hard: <code>available:true</code> obrigatório. Items sem estoque ficam ocultos da busca — reduz frustração pós-clique.</p>
    </div>
  </div>

  <h2>Filtros disponíveis (facets)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Filtro</th><th>Campo</th><th>Tipo</th><th>Estado</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Categoria / vertical</td><td><code>vertical</code></td><td>Multi-select</td><td><span class="status-badge status-functional">✅ Funcional</span></td></tr>
        <tr><td class="td-bold">Disponível agora</td><td><code>available</code></td><td>Toggle</td><td><span class="status-badge status-functional">✅ Funcional</span></td></tr>
        <tr><td class="td-bold">Faixa de preço</td><td><code>price</code></td><td>Range slider</td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
        <tr><td class="td-bold">Loja específica</td><td><code>storeId</code></td><td>Select</td><td><span class="status-badge status-functional">✅ Funcional</span></td></tr>
        <tr><td class="td-bold">Restrição dietética</td><td><code>tags</code></td><td>Multi-select</td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
        <tr><td class="td-bold">Raio geo</td><td><code>geo</code></td><td>Distância km</td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
        <tr><td class="td-bold">Entrega grátis</td><td><code>freeDelivery</code></td><td>Toggle</td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
      </tbody>
    </table>
  </div>

  <h2>Product-first vs Store-first</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Abordagem</th><th>Experiência</th><th>Quando usar</th><th>Exemplo</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Store-first (tradicional)</td><td>Escolhe loja → navega catálogo</td><td>Consumidor tem preferência por loja específica</td><td>iFood (food only)</td></tr>
        <tr><td class="td-bold">Product-first (meta)</td><td>Busca produto → vê onde tem</td><td>Consumidor quer produto X, não importa a loja</td><td>Wolt, Mercado Livre</td></tr>
        <tr><td class="td-bold">Híbrido (ideal)</td><td>Ambos em paralelo</td><td>Cada missão tem seu fluxo</td><td>Rappi (busca + lojas)</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-indigo">
    <span class="alert-icon">💡</span>
    <div class="alert-body">
      <div class="alert-title">Por que product-first aumenta conversão</div>
      <p>No modelo store-first, o usuário abre uma loja específica e pode não encontrar o produto desejado → abandona. No modelo product-first, o sistema mostra automaticamente qual loja tem o produto disponível → o usuário encontra o que quer e converte. Wolt reporta +23% de conversão ao migrar para product-first.</p>
    </div>
  </div>
</div>
`
});
