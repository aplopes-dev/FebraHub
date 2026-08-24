WIKI.register({
  id: 'home-descoberta',
  title: 'Home e Discovery',
  icon: '🏠',
  searchText: 'home discovery feed categorias banners reorder compras anteriores personalizacao ML horizontal scroll cards lojas destacadas ranking proximity',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Descoberta e Busca</div>
    <h1 class="section-title">🏠 Home e Discovery</h1>
    <p class="section-subtitle">A home é a primeira impressão do consumidor. Deve mostrar o mais relevante instantaneamente: lojas abertas perto, destaques, reorder de pedidos anteriores e banners de promoções — sem login obrigatório.</p>
    <div class="section-tags">
      <span class="tag-indigo">BFF /v1/app/home</span>
      <span class="tag-blue">Categorias</span>
      <span class="tag-violet">Personalização</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">🟢 Hoje (MVP)</div>
    <p><code>GET /v1/app/home</code> no BFF retorna categorias de verticais ativas, lojas abertas ordenadas por proximidade (via <code>MarketplaceStore</code> read model), e banners configuráveis. <code>GET /v1/app/categories</code> lista as verticais habilitadas no município (<code>PlatformEnabledVertical</code>).</p>
  </div>

  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">💡 Proposta (produto alvo)</div>
    <p>Feed personalizado: seção "Pedidos recentes", seção "Perto de você", seção por vertical, banners de promoção (CMS), personalização por histórico. Reorder 1-clique em card do pedido anterior. Scroll infinito com paginação cursor-based.</p>
  </div>

  <h2>Anatomia da home</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">🛍️ Marketplace</span>
      <span style="margin-left:auto;font-size:12px">📍 Centro, Ilhéus</span>
    </div>
    <div class="mock-body">
      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:8px">
        <div style="background:#4f46e5;color:white;padding:8px 14px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap">🍔 Food</div>
        <div style="background:#e0e7ff;color:#3730a3;padding:8px 14px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap">🛒 Market</div>
        <div style="background:#e0e7ff;color:#3730a3;padding:8px 14px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap">💊 Farmácia</div>
        <div style="background:#e0e7ff;color:#3730a3;padding:8px 14px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap">✂️ Beleza</div>
      </div>
      <div style="background:#4338ca;border-radius:10px;padding:16px;margin:8px 0;color:white;font-size:13px">
        🎉 <strong>Frete grátis este fim de semana</strong> em todas as lojas abertas
      </div>
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#6b7280;margin:12px 0 6px">Perto de você · Abertas agora</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="background:white;border-radius:8px;padding:10px;border:1px solid #c7d2fe">
          <div style="font-weight:700;font-size:13px">🍕 Pizzaria Dom</div>
          <div style="font-size:11px;color:#6b7280">Pizza · 25-40 min · R$ 5,99</div>
          <div class="mock-badge mock-badge-green" style="margin-top:4px">4.8 ⭐</div>
        </div>
        <div style="background:white;border-radius:8px;padding:10px;border:1px solid #c7d2fe">
          <div style="font-weight:700;font-size:13px">🛒 Super Bahia</div>
          <div style="font-size:11px;color:#6b7280">Mercado · 45-60 min · R$ 9,99</div>
          <div class="mock-badge mock-badge-indigo" style="margin-top:4px">4.6 ⭐</div>
        </div>
      </div>
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#6b7280;margin:12px 0 6px">Seu último pedido</div>
      <div style="background:white;border-radius:8px;padding:12px;border:1px solid #c7d2fe;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:12px;font-weight:700">🍔 X-Bacon + Batata · R$ 42,00</div>
          <div style="font-size:11px;color:#6b7280">Ontem · Lanchonete Central</div>
        </div>
        <button class="mock-btn mock-btn-primary" style="font-size:12px">🔁 Pedir novamente</button>
      </div>
    </div>
  </div>

  <h2>Seções da home — dados e origem</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Seção</th><th>Dados</th><th>Origem</th><th>Estado</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Banner/herói</td><td>Imagem, título, ação, data início/fim</td><td>CMS ou config estática</td><td><span class="status-badge status-partial">🔶 Parcial</span></td></tr>
        <tr><td class="td-bold">Categorias verticais</td><td>Lista de <code>PlatformEnabledVertical</code> do município</td><td>BFF /categories</td><td><span class="status-badge status-functional">✅ Funcional</span></td></tr>
        <tr><td class="td-bold">Lojas perto / abertas</td><td><code>MarketplaceStore</code> com <code>isOpen</code> e geo</td><td>BFF /home (read model)</td><td><span class="status-badge status-functional">✅ Funcional</span></td></tr>
        <tr><td class="td-bold">Último pedido / reorder</td><td>Histórico de <code>Order</code> do consumidor</td><td>BFF /orders/history</td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
        <tr><td class="td-bold">Promoções personalizadas</td><td>Cupons ativos + ofertas por segmento</td><td>Fidelidade/CRM module</td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
        <tr><td class="td-bold">Ranking ML</td><td>Score por relevância + conversão + rating</td><td>Workers personalização</td><td><span class="status-badge status-proposed">💡 Roadmap v2</span></td></tr>
      </tbody>
    </table>
  </div>

  <h2>Boas práticas (benchmark)</h2>
  <ul>
    <li><strong>Sem login para navegar:</strong> o usuário vê lojas/produtos sem precisar criar conta; login é pedido apenas no checkout.</li>
    <li><strong>Estado da loja em tempo real:</strong> aberta/fechada/ocupada atualizado via <code>MarketplaceStore.isOpen</code> projetado pelo worker.</li>
    <li><strong>ETA visível desde o card:</strong> "25-40 min" reduz abandono; fonte: media histórica de pedidos por loja + dia/horário.</li>
    <li><strong>Reorder na home:</strong> iFood/Rappi mostram o último pedido com 1 clique — reduz tempo de jornada e aumenta retenção.</li>
    <li><strong>Paginação eficiente:</strong> cursor-based (não offset) para feed de lojas — evita duplicatas em scroll.</li>
  </ul>
</div>
`
});
