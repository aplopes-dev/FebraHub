WIKI.register({
  id: 'loja-vitrine-oferta',
  title: 'Loja, Vitrine e Oferta',
  icon: '🏪',
  searchText: 'loja vitrine oferta pagina store detalhe produto disponibilidade horario funcionamento status aberta fechada MarketplaceStore MarketplaceOffer BFF catalog',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Descoberta e Busca</div>
    <h1 class="section-title">🏪 Loja, Vitrine e Detalhe de Oferta</h1>
    <p class="section-subtitle">Após encontrar a loja via home ou busca, o consumidor navega o catálogo da loja, vê detalhes de cada oferta e verifica disponibilidade em tempo real antes de adicionar ao carrinho.</p>
    <div class="section-tags">
      <span class="tag-indigo">BFF /v1/app/stores</span>
      <span class="tag-blue">MarketplaceStore</span>
      <span class="tag-blue">MarketplaceOffer</span>
      <span class="tag-violet">Disponibilidade RT</span>
    </div>
  </div>

  <div class="eco-callout">
    <div class="eco-icon">🔗</div>
    <div class="eco-body">
      <div class="eco-title">A vitrine reflete o que o lojista publica no ERP</div>
      <div class="eco-links">
        Loja, ofertas e disponibilidade vêm da projeção feita em
        <a href="../wiki-erp/wiki-erp/index.html#marketplace-publish">ERP · Publicação no Marketplace</a>
        (catálogo polimórfico em <a href="../wiki-erp/wiki-erp/index.html#catalogo">ERP · Catálogo</a>).
        A loja é habilitada/monitorada em <a href="../wiki-admin/index.html#loja-detalhe">Admin · Detalhe da Loja</a>.
      </div>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">🟢 Hoje (MVP)</div>
    <p><code>GET /v1/app/stores/:id</code> retorna dados da loja + lista de offers agrupadas por categoria. <code>GET /v1/app/offers/:id</code> retorna detalhe de uma oferta com preço, imagem e disponibilidade. Read models <code>MarketplaceStore</code> e <code>MarketplaceOffer</code> projetados pelo worker via RabbitMQ.</p>
  </div>

  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">💡 Proposta (produto alvo)</div>
    <p>Header da loja com foto, rating, ETA, horário de funcionamento, badge de status (aberta/fechada/ocupada). Categorias do catálogo com scroll rápido. Detalhe de oferta com galeria, descrição rica, modificadores/adicionais (food), variantes (market/beleza), nível de estoque. Ofertas relacionadas. Seção de avaliações.</p>
  </div>

  <h2>Read models envolvidos</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Model</th><th>Campos principais</th><th>Atualizado por</th></tr></thead>
      <tbody>
        <tr>
          <td class="td-bold"><code>MarketplaceStore</code></td>
          <td><code>id, name, slug, isOpen, openingHours, rating, deliveryEta, deliveryFee, geo, vertical, bannerUrl</code></td>
          <td>Worker — evento <code>store.updated</code> do ERP</td>
        </tr>
        <tr>
          <td class="td-bold"><code>MarketplaceOffer</code></td>
          <td><code>id, storeId, name, description, price, imageUrl, available, categoryId, tags, updatedAt</code></td>
          <td>Worker — evento <code>catalog.item.updated</code> → <code>CatalogItem</code></td>
        </tr>
        <tr>
          <td class="td-bold"><code>MarketplaceAvailability</code></td>
          <td><code>offerId, storeId, available, qty, updatedAt</code></td>
          <td>Worker — evento <code>inventory.stock.updated</code></td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>Mockup — Página da Loja</h2>
  <div class="mockup-container">
    <div class="mock-topbar" style="flex-direction:column;align-items:flex-start;gap:4px;padding:12px 16px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:18px">🛒</span>
        <span style="font-size:15px;font-weight:700">Super Bahia</span>
        <span class="mock-badge mock-badge-green">Aberta</span>
      </div>
      <div style="font-size:11px;opacity:0.8">Mercado · 4.6 ⭐ · 45-60 min · R$ 9,99 de entrega</div>
    </div>
    <div class="mock-body">
      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;margin-bottom:10px">
        <span class="mock-badge mock-badge-indigo">Hortifruti</span>
        <span class="mock-badge mock-badge-indigo">Laticínios</span>
        <span class="mock-badge mock-badge-indigo">Carnes</span>
        <span class="mock-badge mock-badge-indigo">Bebidas</span>
        <span class="mock-badge mock-badge-indigo">Limpeza</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="background:white;border-radius:8px;padding:10px;border:1px solid #c7d2fe">
          <div style="background:#eef2ff;height:60px;border-radius:6px;margin-bottom:6px;display:flex;align-items:center;justify-content:center;font-size:24px">🥛</div>
          <div style="font-weight:700;font-size:12px">Leite Integral 1L</div>
          <div style="font-size:11px;color:#4f46e5;font-weight:700;margin-top:2px">R$ 5,49</div>
          <button class="mock-btn mock-btn-primary" style="font-size:11px;margin-top:6px;width:100%;justify-content:center">+ Adicionar</button>
        </div>
        <div style="background:white;border-radius:8px;padding:10px;border:1px solid #c7d2fe">
          <div style="background:#eef2ff;height:60px;border-radius:6px;margin-bottom:6px;display:flex;align-items:center;justify-content:center;font-size:24px">🍌</div>
          <div style="font-weight:700;font-size:12px">Banana Prata kg</div>
          <div style="font-size:11px;color:#4f46e5;font-weight:700;margin-top:2px">R$ 4,99/kg</div>
          <button class="mock-btn mock-btn-primary" style="font-size:11px;margin-top:6px;width:100%;justify-content:center">+ Adicionar</button>
        </div>
      </div>
    </div>
  </div>

  <h2>Status da loja</h2>
  <div class="card-grid">
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">✅</span> Aberta</div>
      <p>Dentro do horário de funcionamento. ETA calculado por histórico + carga atual. Aceita novos pedidos.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">⚡</span> Ocupada</div>
      <p>Loja aberta mas com alta demanda. ETA aumentado. Continua aceitando pedidos mas com aviso ao consumidor.</p>
    </div>
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">🔴</span> Fechada</div>
      <p>Fora do horário de funcionamento ou fechamento manual pelo lojista no ERP. Permite agendar para quando abrir (se scheduling habilitado).</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">🔧</span> Pausada</div>
      <p>Lojista pausou temporariamente (sistema sobrecarregado, falta de produto). App mostra aviso específico.</p>
    </div>
  </div>

  <h2>Detalhe de oferta — elementos</h2>
  <ul>
    <li><strong>Galeria de imagens</strong> — principal + thumbnails (carrossel no app nativo)</li>
    <li><strong>Nome, descrição, ingredientes / composição</strong> — conforme vertical (food: alérgenos; market: dimensões/peso)</li>
    <li><strong>Preço atual vs preço riscado</strong> (promoção)</li>
    <li><strong>Disponibilidade em tempo real</strong> — <code>MarketplaceAvailability.available</code> projetado pelo worker</li>
    <li><strong>Modificadores / adicionais</strong> (food) — ex.: ponto da carne, adicionais de pizza</li>
    <li><strong>Variantes</strong> (market/beleza) — ex.: tamanho, cor</li>
    <li><strong>Avaliações do produto</strong> — rating médio + últimos comentários</li>
    <li><strong>Produtos relacionados</strong> — da mesma loja ou de lojas próximas</li>
  </ul>

  <div class="alert alert-indigo">
    <span class="alert-icon">⚠️</span>
    <div class="alert-body">
      <div class="alert-title">Disponibilidade: a promessa que não pode falhar</div>
      <p>Se o app mostra "disponível" e o ERP não tem estoque, o consumidor confirma o pedido e depois é informado da indisponibilidade → péssima experiência. A cadeia <strong>inventory → worker → MarketplaceAvailability → BFF</strong> precisa de latência baixa (meta: &lt;5s de propagação). Fallback: ao entrar em tela de detalhe, BFF pode fazer uma checagem live no core-api antes de habilitar o "Adicionar".</p>
    </div>
  </div>
</div>
`
});
