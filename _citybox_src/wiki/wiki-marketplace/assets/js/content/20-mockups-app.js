WIKI.register({
  id: 'mockups-app',
  title: 'Mockups do App',
  icon: '📲',
  searchText: 'mockups telas app design wireframe home busca carrinho pedidos perfil loja oferta checkout pagamento pix rastreio avaliacao reorder historico UI mobile prototipo tela',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Design e Mockups</div>
    <h1 class="section-title">📲 Mockups do App Marketplace</h1>
    <p class="section-subtitle">Telas de alta fidelidade do app consumidor, cobrindo toda a jornada: as 5 tabs principais, o fluxo de compra completo e o pós-venda. São protótipos visuais (HTML/CSS) para guiar o design e o desenvolvimento do app nativo (B-08) e do PWA.</p>
    <div class="section-tags">
      <span class="tag-indigo">Tabs principais</span>
      <span class="tag-blue">Fluxo de compra</span>
      <span class="tag-violet">Pós-venda</span>
      <span class="tag-gray">Protótipo HTML/CSS</span>
    </div>
  </div>

  <div class="alert alert-indigo">
    <span class="alert-icon">🎨</span>
    <div class="alert-body">
      <div class="alert-title">Como ler estes mockups</div>
      <p>Cada quadro representa uma tela do app na paleta indigo do Marketplace. São referências de layout e hierarquia — não a implementação final. Use junto com as seções <strong>Jornada do Consumidor</strong>, <strong>App Nativo e PWA</strong> e <strong>Arquitetura</strong> para entender o fluxo de dados por trás de cada tela.</p>
    </div>
  </div>

  <h2>1. Tabs principais</h2>
  <div class="mockup-gallery">

    <!-- HOME -->
    <div class="mockup-cell">
      <div class="phone"><div class="phone-screen"><div class="phone-notch"></div>
        <div class="ph-status"><span class="ph-time">9:41</span><span class="ph-icons">📶 🔋</span></div>
        <div class="ph-header">
          <span class="ph-header-title">🛍️ Marketplace</span>
          <span style="margin-left:auto" class="ph-header-sub">📍 Centro, Ilhéus</span>
        </div>
        <div class="ph-body">
          <div class="ph-search-bar">🔍 Buscar produtos e lojas…</div>
          <div class="ph-chip-row">
            <span class="ph-chip ph-chip-on">🍔 Food</span>
            <span class="ph-chip ph-chip-off">🛒 Market</span>
            <span class="ph-chip ph-chip-off">💊 Farmácia</span>
          </div>
          <div class="ph-banner">🎉 <strong>Frete grátis</strong> neste fim de semana</div>
          <div class="ph-section-label">Seu último pedido</div>
          <div class="ph-card ph-row">
            <div>
              <div class="ph-title-sm">🍔 X-Bacon + Batata</div>
              <div class="ph-meta">Ontem · Lanchonete Central</div>
            </div>
            <button class="ph-btn ph-btn-primary ph-btn-sm">🔁 Repetir</button>
          </div>
          <div class="ph-section-label">Perto de você</div>
          <div class="ph-grid2">
            <div class="ph-card">
              <div class="ph-thumb">🍕</div>
              <div class="ph-title-sm">Pizzaria Dom</div>
              <div class="ph-meta">25-40 min</div>
              <span class="ph-badge ph-badge-green">4.8 ⭐</span>
            </div>
            <div class="ph-card">
              <div class="ph-thumb">🛒</div>
              <div class="ph-title-sm">Super Bahia</div>
              <div class="ph-meta">45-60 min</div>
              <span class="ph-badge ph-badge-indigo">4.6 ⭐</span>
            </div>
          </div>
        </div>
        <div class="ph-tabbar">
          <div class="ph-tab active"><span class="ph-tab-ico">🏠</span>Início</div>
          <div class="ph-tab"><span class="ph-tab-ico">🔍</span>Busca</div>
          <div class="ph-tab"><span class="ph-tab-ico">🛒</span>Carrinho</div>
          <div class="ph-tab"><span class="ph-tab-ico">📦</span>Pedidos</div>
          <div class="ph-tab"><span class="ph-tab-ico">👤</span>Perfil</div>
        </div>
      </div></div>
      <div class="mockup-caption">
        <div class="mockup-caption-title">🏠 Home / Discovery</div>
        <div class="mockup-caption-sub">Feed, categorias, reorder, lojas perto</div>
      </div>
    </div>

    <!-- BUSCA -->
    <div class="mockup-cell">
      <div class="phone"><div class="phone-screen"><div class="phone-notch"></div>
        <div class="ph-status"><span class="ph-time">9:41</span><span class="ph-icons">📶 🔋</span></div>
        <div class="ph-header"><span class="ph-header-title">🔍 Busca</span></div>
        <div class="ph-body">
          <div class="ph-search-bar" style="color:var(--text-primary);font-weight:600">🔍 leite</div>
          <div class="ph-chip-row">
            <span class="ph-chip ph-chip-on">Disponível</span>
            <span class="ph-chip ph-chip-off">Até R$10</span>
            <span class="ph-chip ph-chip-off">2km</span>
          </div>
          <div class="ph-section-label">12 resultados · product-first</div>
          <div class="ph-list-item">
            <div class="ph-thumb" style="width:38px;height:38px;margin:0;font-size:18px">🥛</div>
            <div style="flex:1">
              <div class="ph-title-sm">Leite Integral 1L</div>
              <div class="ph-meta">Super Bahia · 600m</div>
            </div>
            <div class="ph-price">R$ 5,49</div>
          </div>
          <div class="ph-list-item">
            <div class="ph-thumb" style="width:38px;height:38px;margin:0;font-size:18px">🥛</div>
            <div style="flex:1">
              <div class="ph-title-sm">Leite Desnatado 1L</div>
              <div class="ph-meta">Mercadinho Sol · 1.2km</div>
            </div>
            <div class="ph-price">R$ 5,89</div>
          </div>
          <div class="ph-list-item">
            <div class="ph-thumb" style="width:38px;height:38px;margin:0;font-size:18px">🍫</div>
            <div style="flex:1">
              <div class="ph-title-sm">Leite Condensado 395g</div>
              <div class="ph-meta">Super Bahia · 600m</div>
            </div>
            <div class="ph-price">R$ 7,20</div>
          </div>
        </div>
        <div class="ph-tabbar">
          <div class="ph-tab"><span class="ph-tab-ico">🏠</span>Início</div>
          <div class="ph-tab active"><span class="ph-tab-ico">🔍</span>Busca</div>
          <div class="ph-tab"><span class="ph-tab-ico">🛒</span>Carrinho</div>
          <div class="ph-tab"><span class="ph-tab-ico">📦</span>Pedidos</div>
          <div class="ph-tab"><span class="ph-tab-ico">👤</span>Perfil</div>
        </div>
      </div></div>
      <div class="mockup-caption">
        <div class="mockup-caption-title">🔍 Busca product-first</div>
        <div class="mockup-caption-sub">Produto → mostra em qual loja tem</div>
      </div>
    </div>

    <!-- CARRINHO -->
    <div class="mockup-cell">
      <div class="phone"><div class="phone-screen"><div class="phone-notch"></div>
        <div class="ph-status"><span class="ph-time">9:41</span><span class="ph-icons">📶 🔋</span></div>
        <div class="ph-header"><span class="ph-header-title">🛒 Carrinho</span><span style="margin-left:auto" class="ph-header-sub">2 lojas</span></div>
        <div class="ph-body">
          <div class="ph-section-label">🍕 Pizzaria Dom</div>
          <div class="ph-card">
            <div class="ph-row"><div class="ph-title-sm">1× Pizza Margherita</div><div class="ph-price">R$ 42,00</div></div>
            <div class="ph-row" style="margin-top:4px"><div class="ph-meta">Entrega R$ 5,99</div><div class="ph-meta">Subtotal R$ 47,99</div></div>
          </div>
          <div class="ph-section-label">🛒 Super Bahia</div>
          <div class="ph-card">
            <div class="ph-row"><div class="ph-title-sm">3× Leite Integral 1L</div><div class="ph-price">R$ 16,47</div></div>
            <div class="ph-row" style="margin-top:4px"><div class="ph-meta">Entrega R$ 9,99</div><div class="ph-meta">Subtotal R$ 26,46</div></div>
          </div>
          <div class="ph-divider"></div>
          <div class="ph-row"><div class="ph-meta">Taxa de serviço</div><div class="ph-meta">R$ 3,70</div></div>
          <div class="ph-row"><div class="ph-title-sm">Total</div><div class="ph-price" style="font-size:13px">R$ 78,15</div></div>
        </div>
        <div style="padding:8px 12px;background:#fff;border-top:1px solid var(--border-color)">
          <button class="ph-btn ph-btn-primary">Ir para o checkout →</button>
        </div>
      </div></div>
      <div class="mockup-caption">
        <div class="mockup-caption-title">🛒 Carrinho multiloja</div>
        <div class="mockup-caption-sub">Subtotais e fees por loja, total claro</div>
      </div>
    </div>

    <!-- PEDIDOS -->
    <div class="mockup-cell">
      <div class="phone"><div class="phone-screen"><div class="phone-notch"></div>
        <div class="ph-status"><span class="ph-time">9:41</span><span class="ph-icons">📶 🔋</span></div>
        <div class="ph-header"><span class="ph-header-title">📦 Pedidos</span></div>
        <div class="ph-body">
          <div class="ph-section-label">Em andamento</div>
          <div class="ph-card">
            <div class="ph-row"><div class="ph-title-sm">🍕 Pizzaria Dom</div><span class="ph-badge ph-badge-indigo">Em preparo</span></div>
            <div class="ph-meta">#MP-2024-0042 · R$ 47,99</div>
            <div class="ph-meta" style="margin-top:2px">Previsão 14:55</div>
            <button class="ph-btn ph-btn-outline ph-btn-sm" style="margin-top:6px;width:100%">Acompanhar pedido</button>
          </div>
          <div class="ph-section-label">Histórico</div>
          <div class="ph-card">
            <div class="ph-row"><div class="ph-title-sm">🍔 Lanchonete Central</div><span class="ph-badge ph-badge-green">Entregue</span></div>
            <div class="ph-meta">Ontem · R$ 42,00</div>
            <div class="ph-row" style="margin-top:6px;gap:6px">
              <button class="ph-btn ph-btn-primary ph-btn-sm" style="flex:1">🔁 Repetir</button>
              <button class="ph-btn ph-btn-outline ph-btn-sm" style="flex:1">⭐ Avaliar</button>
            </div>
          </div>
        </div>
        <div class="ph-tabbar">
          <div class="ph-tab"><span class="ph-tab-ico">🏠</span>Início</div>
          <div class="ph-tab"><span class="ph-tab-ico">🔍</span>Busca</div>
          <div class="ph-tab"><span class="ph-tab-ico">🛒</span>Carrinho</div>
          <div class="ph-tab active"><span class="ph-tab-ico">📦</span>Pedidos</div>
          <div class="ph-tab"><span class="ph-tab-ico">👤</span>Perfil</div>
        </div>
      </div></div>
      <div class="mockup-caption">
        <div class="mockup-caption-title">📦 Pedidos</div>
        <div class="mockup-caption-sub">Ativos + histórico com reorder/avaliar</div>
      </div>
    </div>

    <!-- PERFIL -->
    <div class="mockup-cell">
      <div class="phone"><div class="phone-screen"><div class="phone-notch"></div>
        <div class="ph-status"><span class="ph-time">9:41</span><span class="ph-icons">📶 🔋</span></div>
        <div class="ph-header"><span class="ph-header-title">👤 Perfil</span></div>
        <div class="ph-body">
          <div class="ph-card ph-row">
            <div class="ph-thumb" style="width:42px;height:42px;margin:0;font-size:20px;border-radius:50%">🙂</div>
            <div style="flex:1">
              <div class="ph-title-sm">Maria Silva</div>
              <div class="ph-meta">maria@email.com</div>
            </div>
          </div>
          <div class="ph-card ph-row">
            <div class="ph-title-sm">💰 Carteira Citybox</div>
            <div class="ph-price" style="font-size:12px">R$ 18,50</div>
          </div>
          <div class="ph-list-item"><span>📍</span><div style="flex:1" class="ph-title-sm">Meus endereços</div><span class="ph-meta">›</span></div>
          <div class="ph-list-item"><span>💳</span><div style="flex:1" class="ph-title-sm">Cartões salvos</div><span class="ph-meta">›</span></div>
          <div class="ph-list-item"><span>🎁</span><div style="flex:1" class="ph-title-sm">Cupons e cashback</div><span class="ph-badge ph-badge-amber">2</span></div>
          <div class="ph-list-item"><span>🔔</span><div style="flex:1" class="ph-title-sm">Notificações</div><span class="ph-meta">›</span></div>
          <div class="ph-list-item"><span>💬</span><div style="flex:1" class="ph-title-sm">Suporte</div><span class="ph-meta">›</span></div>
        </div>
        <div class="ph-tabbar">
          <div class="ph-tab"><span class="ph-tab-ico">🏠</span>Início</div>
          <div class="ph-tab"><span class="ph-tab-ico">🔍</span>Busca</div>
          <div class="ph-tab"><span class="ph-tab-ico">🛒</span>Carrinho</div>
          <div class="ph-tab"><span class="ph-tab-ico">📦</span>Pedidos</div>
          <div class="ph-tab active"><span class="ph-tab-ico">👤</span>Perfil</div>
        </div>
      </div></div>
      <div class="mockup-caption">
        <div class="mockup-caption-title">👤 Perfil</div>
        <div class="mockup-caption-sub">Conta, carteira, endereços, cupons</div>
      </div>
    </div>

  </div>

  <h2>2. Fluxo de compra</h2>
  <div class="mockup-gallery">

    <!-- LOJA -->
    <div class="mockup-cell">
      <div class="phone"><div class="phone-screen"><div class="phone-notch"></div>
        <div class="ph-status"><span class="ph-time">9:41</span><span class="ph-icons">📶 🔋</span></div>
        <div class="ph-header">
          <span class="ph-back">←</span>
          <div>
            <div class="ph-header-title">🛒 Super Bahia</div>
            <div class="ph-header-sub">4.6 ⭐ · 45-60 min · R$ 9,99</div>
          </div>
          <span style="margin-left:auto" class="ph-badge ph-badge-green">Aberta</span>
        </div>
        <div class="ph-body">
          <div class="ph-chip-row">
            <span class="ph-chip ph-chip-on">Hortifruti</span>
            <span class="ph-chip ph-chip-off">Laticínios</span>
            <span class="ph-chip ph-chip-off">Bebidas</span>
          </div>
          <div class="ph-grid2">
            <div class="ph-card">
              <div class="ph-thumb">🥛</div>
              <div class="ph-title-sm">Leite Integral 1L</div>
              <div class="ph-price">R$ 5,49</div>
              <button class="ph-btn ph-btn-primary ph-btn-sm" style="width:100%;margin-top:4px">+ Adicionar</button>
            </div>
            <div class="ph-card">
              <div class="ph-thumb">🍌</div>
              <div class="ph-title-sm">Banana Prata kg</div>
              <div class="ph-price">R$ 4,99</div>
              <button class="ph-btn ph-btn-primary ph-btn-sm" style="width:100%;margin-top:4px">+ Adicionar</button>
            </div>
            <div class="ph-card">
              <div class="ph-thumb">🧀</div>
              <div class="ph-title-sm">Queijo Mussarela</div>
              <div class="ph-price">R$ 12,90</div>
              <button class="ph-btn ph-btn-primary ph-btn-sm" style="width:100%;margin-top:4px">+ Adicionar</button>
            </div>
            <div class="ph-card">
              <div class="ph-thumb">☕</div>
              <div class="ph-title-sm">Café 500g</div>
              <div class="ph-price">R$ 16,50</div>
              <button class="ph-btn ph-btn-primary ph-btn-sm" style="width:100%;margin-top:4px">+ Adicionar</button>
            </div>
          </div>
        </div>
      </div></div>
      <div class="mockup-caption">
        <div class="mockup-caption-title">🏪 Página da loja</div>
        <div class="mockup-caption-sub">Status, categorias, vitrine de ofertas</div>
      </div>
    </div>

    <!-- DETALHE OFERTA -->
    <div class="mockup-cell">
      <div class="phone"><div class="phone-screen"><div class="phone-notch"></div>
        <div class="ph-status"><span class="ph-time">9:41</span><span class="ph-icons">📶 🔋</span></div>
        <div class="ph-header"><span class="ph-back">←</span><span class="ph-header-title">Detalhe</span></div>
        <div class="ph-body">
          <div class="ph-thumb" style="height:100px;font-size:48px">🍕</div>
          <div class="ph-title-sm" style="font-size:13px">Pizza Margherita Grande</div>
          <div class="ph-meta">Molho de tomate, mussarela, manjericão fresco. Serve 2-3 pessoas.</div>
          <span class="ph-badge ph-badge-green">✅ Disponível</span>
          <div class="ph-section-label">Adicionais</div>
          <div class="ph-list-item ph-row"><span class="ph-title-sm">Borda recheada</span><span class="ph-price">+ R$ 8,00</span></div>
          <div class="ph-list-item ph-row"><span class="ph-title-sm">Extra mussarela</span><span class="ph-price">+ R$ 6,00</span></div>
          <div class="ph-divider"></div>
          <div class="ph-row"><span class="ph-meta">⭐ 4.8 (132 avaliações)</span></div>
        </div>
        <div style="padding:8px 12px;background:#fff;border-top:1px solid var(--border-color)">
          <button class="ph-btn ph-btn-primary"><span>Adicionar</span> · R$ 42,00</button>
        </div>
      </div></div>
      <div class="mockup-caption">
        <div class="mockup-caption-title">🍽️ Detalhe de oferta</div>
        <div class="mockup-caption-sub">Foto, descrição, adicionais, disponibilidade</div>
      </div>
    </div>

    <!-- CHECKOUT -->
    <div class="mockup-cell">
      <div class="phone"><div class="phone-screen"><div class="phone-notch"></div>
        <div class="ph-status"><span class="ph-time">9:41</span><span class="ph-icons">📶 🔋</span></div>
        <div class="ph-header"><span class="ph-back">←</span><span class="ph-header-title">💳 Checkout</span></div>
        <div class="ph-body">
          <div class="ph-section-label">Endereço de entrega</div>
          <div class="ph-list-item"><span>📍</span><div style="flex:1"><div class="ph-title-sm">Rua das Flores, 123</div><div class="ph-meta">Centro · Apto 402</div></div><span class="ph-meta">Trocar</span></div>
          <div class="ph-section-label">Pagamento</div>
          <div class="ph-list-item"><span>📱</span><div style="flex:1" class="ph-title-sm">PIX</div><span class="ph-badge ph-badge-indigo">Selecionado</span></div>
          <div class="ph-list-item"><span>💳</span><div style="flex:1" class="ph-title-sm">Cartão final 4242</div><span class="ph-meta">○</span></div>
          <div class="ph-section-label">Cupom</div>
          <div class="ph-list-item"><span>🎁</span><div style="flex:1" class="ph-title-sm">BEMVINDO10</div><span class="ph-badge ph-badge-green">- R$ 10</span></div>
          <div class="ph-divider"></div>
          <div class="ph-row"><span class="ph-meta">Subtotal</span><span class="ph-meta">R$ 74,45</span></div>
          <div class="ph-row"><span class="ph-meta">Entrega + serviço</span><span class="ph-meta">R$ 13,70</span></div>
          <div class="ph-row"><span class="ph-meta">Desconto</span><span class="ph-meta">- R$ 10,00</span></div>
          <div class="ph-row"><span class="ph-title-sm">Total</span><span class="ph-price" style="font-size:13px">R$ 78,15</span></div>
        </div>
        <div style="padding:8px 12px;background:#fff;border-top:1px solid var(--border-color)">
          <button class="ph-btn ph-btn-primary">Confirmar e pagar</button>
        </div>
      </div></div>
      <div class="mockup-caption">
        <div class="mockup-caption-title">💳 Checkout</div>
        <div class="mockup-caption-sub">Endereço, pagamento, cupom, breakdown</div>
      </div>
    </div>

    <!-- PAGAMENTO PIX -->
    <div class="mockup-cell">
      <div class="phone"><div class="phone-screen"><div class="phone-notch"></div>
        <div class="ph-status"><span class="ph-time">9:41</span><span class="ph-icons">📶 🔋</span></div>
        <div class="ph-header"><span class="ph-back">←</span><span class="ph-header-title">📱 Pagamento PIX</span></div>
        <div class="ph-body" style="align-items:center;text-align:center">
          <div class="ph-badge ph-badge-amber" style="margin-top:4px">⏱️ Expira em 14:32</div>
          <div class="ph-qr"></div>
          <div class="ph-title-sm">Escaneie o QR Code</div>
          <div class="ph-meta">ou copie o código PIX abaixo</div>
          <div class="ph-card" style="width:100%;font-size:9px;color:var(--text-muted);word-break:break-all">00020126580014BR.GOV.BCB.PIX0136a1b2c3…5204000053039865802BR</div>
          <button class="ph-btn ph-btn-outline ph-btn-sm" style="width:100%">📋 Copiar código PIX</button>
          <div class="ph-divider" style="width:100%"></div>
          <div class="ph-meta">Valor a pagar</div>
          <div class="ph-price" style="font-size:16px">R$ 78,15</div>
          <div class="ph-meta">Aguardando confirmação…</div>
        </div>
      </div></div>
      <div class="mockup-caption">
        <div class="mockup-caption-title">📱 Pagamento PIX</div>
        <div class="mockup-caption-sub">QR inline, copia-e-cola, contador</div>
      </div>
    </div>

    <!-- RASTREIO -->
    <div class="mockup-cell">
      <div class="phone"><div class="phone-screen"><div class="phone-notch"></div>
        <div class="ph-status"><span class="ph-time">9:41</span><span class="ph-icons">📶 🔋</span></div>
        <div class="ph-header"><span class="ph-back">←</span><div><div class="ph-header-title">Pedido #MP-0042</div><div class="ph-header-sub">🍕 Pizzaria Dom</div></div><span style="margin-left:auto" class="ph-badge ph-badge-indigo">A caminho</span></div>
        <div class="ph-body">
          <div class="ph-map">🛵 <span style="position:absolute;bottom:6px;right:10px;font-size:9px;background:#fff;padding:2px 6px;border-radius:8px;color:var(--text-secondary)">ETA 12 min</span></div>
          <div class="ph-timeline">
            <div class="ph-tl-step done"><div class="ph-tl-dot"></div><div class="ph-tl-title">✅ Pedido confirmado</div><div class="ph-tl-time">14:32</div></div>
            <div class="ph-tl-step done"><div class="ph-tl-dot"></div><div class="ph-tl-title">🍳 Em preparo</div><div class="ph-tl-time">14:35</div></div>
            <div class="ph-tl-step current"><div class="ph-tl-dot"></div><div class="ph-tl-title">🛵 Saiu para entrega</div><div class="ph-tl-time">14:48</div></div>
            <div class="ph-tl-step"><div class="ph-tl-dot"></div><div class="ph-tl-title muted">🏠 Entregue</div></div>
          </div>
          <div class="ph-list-item"><span>🛵</span><div style="flex:1"><div class="ph-title-sm">João · Entregador</div><div class="ph-meta">Moto · placa ABC-1234</div></div><span>💬</span></div>
        </div>
      </div></div>
      <div class="mockup-caption">
        <div class="mockup-caption-title">📦 Rastreio em tempo real</div>
        <div class="mockup-caption-sub">Mapa, linha do tempo, entregador</div>
      </div>
    </div>

  </div>

  <h2>3. Pós-venda</h2>
  <div class="mockup-gallery">

    <!-- AVALIACAO -->
    <div class="mockup-cell">
      <div class="phone"><div class="phone-screen"><div class="phone-notch"></div>
        <div class="ph-status"><span class="ph-time">9:41</span><span class="ph-icons">📶 🔋</span></div>
        <div class="ph-header"><span class="ph-back">←</span><span class="ph-header-title">⭐ Avaliar pedido</span></div>
        <div class="ph-body">
          <div class="ph-card" style="text-align:center">
            <div class="ph-thumb" style="margin:0 auto 6px;width:46px;height:46px;border-radius:50%;font-size:22px">🍕</div>
            <div class="ph-title-sm">Pizzaria Dom</div>
            <div class="ph-meta">Pedido #MP-2024-0042</div>
          </div>
          <div class="ph-section-label">Como foi a loja?</div>
          <div class="ph-stars">★ ★ ★ ★ ☆</div>
          <div class="ph-section-label">Como foi a entrega?</div>
          <div class="ph-stars">★ ★ ★ ★ ★</div>
          <div class="ph-card">
            <div class="ph-meta">Deixe um comentário (opcional)</div>
            <div class="ph-title-sm" style="font-weight:400;color:var(--text-muted);margin-top:4px">Pizza ótima, chegou quentinha…</div>
          </div>
        </div>
        <div style="padding:8px 12px;background:#fff;border-top:1px solid var(--border-color)">
          <button class="ph-btn ph-btn-primary">Enviar avaliação</button>
        </div>
      </div></div>
      <div class="mockup-caption">
        <div class="mockup-caption-title">⭐ Avaliação</div>
        <div class="mockup-caption-sub">Loja + entregador + comentário</div>
      </div>
    </div>

    <!-- REORDER / HISTORICO -->
    <div class="mockup-cell">
      <div class="phone"><div class="phone-screen"><div class="phone-notch"></div>
        <div class="ph-status"><span class="ph-time">9:41</span><span class="ph-icons">📶 🔋</span></div>
        <div class="ph-header"><span class="ph-back">←</span><span class="ph-header-title">🔁 Pedir novamente</span></div>
        <div class="ph-body">
          <div class="ph-card ph-row">
            <div class="ph-thumb" style="width:38px;height:38px;margin:0;font-size:18px">🍔</div>
            <div style="flex:1">
              <div class="ph-title-sm">Lanchonete Central</div>
              <div class="ph-meta">Pedido de ontem</div>
            </div>
          </div>
          <div class="ph-section-label">Itens do pedido</div>
          <div class="ph-list-item ph-row"><div><div class="ph-title-sm">1× X-Bacon</div></div><span class="ph-price">R$ 28,00</span></div>
          <div class="ph-list-item ph-row"><div><div class="ph-title-sm">1× Batata frita G</div></div><span class="ph-price">R$ 14,00</span></div>
          <div class="ph-card" style="background:var(--color-primary-light)">
            <div class="ph-meta" style="color:var(--color-primary-dark)">⚠️ "Refrigerante Lata" saiu do cardápio e foi removido.</div>
          </div>
          <div class="ph-divider"></div>
          <div class="ph-row"><span class="ph-title-sm">Total atualizado</span><span class="ph-price" style="font-size:13px">R$ 42,00</span></div>
        </div>
        <div style="padding:8px 12px;background:#fff;border-top:1px solid var(--border-color)">
          <button class="ph-btn ph-btn-primary">Adicionar ao carrinho</button>
        </div>
      </div></div>
      <div class="mockup-caption">
        <div class="mockup-caption-title">🔁 Reorder 1-clique</div>
        <div class="mockup-caption-sub">Reconstrói carrinho, trata indisponíveis</div>
      </div>
    </div>

  </div>

  <div class="alert alert-blue">
    <span class="alert-icon">🧭</span>
    <div class="alert-body">
      <div class="alert-title">Próximos passos de design</div>
      <p>Estes mockups definem a estrutura. A etapa seguinte é traduzi-los para o design system mobile (componentes nativos iOS/Android), validar com usuários no PWA e refinar microinterações (animações de transição, estados de loading, feedback tátil). Veja a seção <strong>App Nativo e PWA</strong> para a estratégia de implementação.</p>
    </div>
  </div>
</div>
`
});
