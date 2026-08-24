WIKI.register({
  id: 'delivery-integracoes',
  title: 'Delivery e Integrações',
  icon: '🛵',
  searchText: 'delivery ifood rappi uber eats hub integracao entregador proprio rastreamento sync cardapio taxa comissao webhook',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Pedidos e Delivery</div>
    <h1 class="section-title">🛵 Delivery e Integrações</h1>
    <p class="section-subtitle">Gestão de delivery próprio com rastreamento de entregadores e hub de integração com plataformas externas (iFood, Rappi) — sincronização bidirecional de cardápio e central de pedidos.</p>
    <div class="section-tags">
      <span class="tag-red">Delivery</span>
      <span class="tag-orange">iFood · Rappi</span>
      <span class="tag-gray">Hub · Sync</span>
    </div>
  </div>

  <div class="herda-base-callout">
    <span class="hb-icon">🏪</span>
    <div class="hb-body">
      <div class="hb-title">Herda do ERP Base — Entrega e Frete Canônico</div>
      <div class="hb-links">Esta vertical herda <a href="../wiki-erp/index.html#entrega-frete">Entrega e Frete</a>: <code>ShippingRule</code> (raio/bairro/tabela/grátis), validação de endereço, cálculo de frete e despacho genérico. Esta seção documenta <strong>apenas o delta food</strong>: hub iFood/Rappi com sync bidirecional de cardápio, delivery próprio com pool de entregadores e PWA com rastreamento GPS.</div>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (UI mockada — sem backend)</div>
    <ul>
      <li><strong>Configuração de Entrega no ERP</strong> (<code>/food/sistema/entrega</code>): CRUD de zonas (criar/editar/excluir), taxas, tempo estimado e regras gerais — estado em <code>sessionStorage</code>, sem mapa real</li>
      <li><strong>Integrações no ERP</strong> (<code>/food/sistema/integracoes</code>): catálogo de provedores (iFood, Rappi, WhatsApp, Mercado Pago, Stripe, NF-e), cards de status e diálogo de configuração de credenciais — configs em <code>sessionStorage</code></li>
      <li><strong>Nenhuma conexão externa real</strong>: não há hub iFood/Rappi, webhooks, sync de cardápio nem rastreamento de entregador implementados</li>
      <li>Diagramas e fluxos abaixo descrevem o estado alvo da integração</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Delta Delivery Food</div>
    <ul>
      <li><strong>Hub iFood:</strong> recebe pedidos via API parceiro, aceite automático configurável, sync de cardápio bidirecional (atualiza disponibilidade em segundos)</li>
      <li><strong>Hub Rappi:</strong> similar ao iFood, protocolo próprio</li>
      <li><strong>Delivery próprio:</strong> pool de entregadores cadastrados, despacho automático ou manual, app do entregador (PWA), rastreamento GPS em tempo real</li>
      <li><strong>Relatório de delivery food:</strong> comissão por hub vs delivery próprio, tempo médio, avaliações por canal</li>
    </ul>
    <p style="font-size:13px;color:#78716c;font-style:italic;margin-top:6px">Zonas de entrega, taxa por zona e cálculo de frete são herdados de <a href="../wiki-erp/index.html#entrega-frete">Entrega e Frete</a> — aqui apenas os hubs externos e o delivery próprio com rastreamento são o delta food.</p>
  </div>

  <h2>Mockup — Hub de Delivery</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">🛵 Delivery Hub — Pedidos em tempo real</span>
      <span style="margin-left:auto;font-size:11px;opacity:.8">12 ativos · 3 plataformas</span>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px">
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#16a34a">8</div><div class="mock-kpi-sub">iFood</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#e11d48">2</div><div class="mock-kpi-sub">Rappi</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#6366f1">2</div><div class="mock-kpi-sub">Próprio</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#d97706">32min</div><div class="mock-kpi-sub">Tempo médio</div></div>
      </div>
      <table class="mock-table">
        <thead><tr><th>Pedido</th><th>Origem</th><th>Cliente</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td><strong>#2841</strong></td><td><span class="mock-badge mock-badge-green">iFood</span></td><td>Ana S.</td><td>R$ 64,70</td><td><span class="mock-badge mock-badge-blue">Na cozinha</span></td></tr>
          <tr><td><strong>#2840</strong></td><td><span class="mock-badge mock-badge-red">Rappi</span></td><td>Carlos M.</td><td>R$ 38,00</td><td><span class="mock-badge mock-badge-yellow">Saiu p/ entrega</span></td></tr>
          <tr><td><strong>#2839</strong></td><td><span class="mock-badge mock-badge-blue">App próprio</span></td><td>João P.</td><td>R$ 92,40</td><td><span class="mock-badge mock-badge-green">Entregue</span></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <h2>Arquitetura do Hub de Delivery</h2>
  <div class="mermaid">
flowchart TB
  subgraph externos [Plataformas Externas]
    IFood["iFood\n(API Parceiro)"]
    Rappi["Rappi\n(Webhook)"]
    Uber["Uber Eats\n(futura)"]
  end

  Hub["DeliveryHub Service\n(food-api)"]
  Orders["OrdersService\n(marketplace-api)"]
  ERP["ERP Food\n(painel pedidos)"]
  KDS["KDS"]
  Fiscal["Fiscal NFC-e"]

  subgraph entregadores [Entregadores]
    Pool["Pool de Entregadores"]
    PWA["App Entregador\n(PWA)"]
  end

  IFood -->|"webhook pedido"| Hub
  Rappi -->|"webhook pedido"| Hub
  Hub --> Orders
  Orders --> ERP
  Orders --> KDS
  Hub -->|"despacho"| Pool
  Pool --> PWA
  PWA -->|"GPS + status"| Hub
  Orders -->|"entregue"| Fiscal

  Hub -->|"sync cardápio → iFood"| IFood
  Hub -->|"sync cardápio → Rappi"| Rappi
  </div>

  <h2>Sincronização bidirecional de cardápio</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Ação no ERP</th><th>Propagação</th><th>Tempo alvo</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Pausar item</td><td>Marca como indisponível em todos os canais</td><td>&lt; 30 s</td></tr>
        <tr><td class="td-bold">Esgotar item</td><td>Retira da listagem em todos os canais</td><td>&lt; 30 s</td></tr>
        <tr><td class="td-bold">Alterar preço</td><td>Atualiza preço no canal correspondente</td><td>&lt; 60 s</td></tr>
        <tr><td class="td-bold">Novo item</td><td>Publica no marketplace Citybox + plataformas</td><td>&lt; 5 min</td></tr>
        <tr><td class="td-bold">Fechar loja</td><td>Fecha em todos os canais simultaneamente</td><td>&lt; 10 s</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Delivery Próprio — fluxo do entregador</h2>
  <div class="mermaid">
sequenceDiagram
  participant ERP
  participant Hub as Hub Delivery
  participant PWA as App Entregador
  participant Cliente

  ERP->>Hub: Pedido READY (entrega própria)
  Hub->>Hub: Seleciona entregador disponível (próximo ou livre)
  Hub->>PWA: Notifica: novo pedido atribuído
  PWA->>Hub: Entregador aceita
  Hub->>ERP: Status: DISPATCHED
  Hub->>Cliente: Notifica "Saiu para entrega"
  PWA->>Hub: GPS updates (a cada 30s)
  Hub->>Cliente: Rastreamento em tempo real
  PWA->>Hub: Confirma entrega (foto opcional)
  Hub->>ERP: Status: DELIVERED
  ERP->>Fiscal: Dispara emissão NF-e
  </div>

  <h2>Configuração de taxas de entrega</h2>
  <pre>{
  "deliveryZones": [
    {
      "name": "Raio 2km",
      "type": "radius",
      "radiusKm": 2,
      "fee": 499,
      "minOrder": 2000,
      "estimatedMinutes": 25
    },
    {
      "name": "Raio 5km",
      "type": "radius",
      "radiusKm": 5,
      "fee": 899,
      "minOrder": 3000,
      "estimatedMinutes": 40
    },
    {
      "name": "Bairro Norte",
      "type": "polygon",
      "polygon": [[lat1, lon1], [lat2, lon2], ...],
      "fee": 699,
      "estimatedMinutes": 30
    }
  ]
}</pre>

  <div class="alert alert-blue">
    <span class="alert-icon">💡</span>
    <div class="alert-body">
      <div class="alert-title">Vantagem do delivery próprio</div>
      <p>iFood cobra entre 12% e 27% de comissão por pedido. Com delivery próprio pelo marketplace Citybox, a taxa é zero — o lojista paga apenas a mensalidade da plataforma. Para restaurantes com volume de R$30.000/mês em delivery, isso representa até R$8.000/mês de economia.</p>
    </div>
  </div>
</div>
`
});
