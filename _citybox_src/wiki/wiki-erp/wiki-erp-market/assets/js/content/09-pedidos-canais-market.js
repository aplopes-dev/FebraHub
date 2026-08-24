WIKI.register({
  id: 'pedidos-canais-market',
  title: 'Pedidos e Canais',
  icon: '📋',
  searchText: 'pedidos canais delivery marketplace loja fisica picking separacao lista compras online varejo market',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Pedidos e Canais</div>
    <h1 class="section-title">📋 Pedidos e Canais de Venda</h1>
    <p class="section-subtitle">Gestão unificada de pedidos em todos os canais: loja física (PDV), delivery próprio, marketplace Citybox e listas de compra digitais — com picking e separação integrados.</p>
    <div class="section-tags">
      <span class="tag-green">Omnichannel</span>
      <span class="tag-emerald">Loja · Delivery · Marketplace</span>
      <span class="tag-gray">Picking</span>
    </div>
  </div>

  <div class="herda-base-callout">
    <span class="hb-icon">🏪</span>
    <div class="hb-body">
      <div class="hb-title">Herda do ERP Base — Pedidos Canônico</div>
      <div class="hb-links">Esta vertical herda <a href="../wiki-erp/index.html#pedidos">Pedidos</a>: modelo <code>Order</code>/<code>SubOrder</code>, Kanban genérico, ciclo de status, realtime e reserva de estoque no checkout. Esta seção documenta <strong>apenas o delta market</strong>: picking por corredor, app separador, substituição de SKU e lista de compras com retirada na loja.</div>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje</div>
    <ul>
      <li>Pedidos de marketplace disponíveis via marketplace-api (tipo RETAIL)</li>
      <li>Sem fluxo de picking/separação, sem delivery próprio, sem gestão de status</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Delta Pedidos Varejo</div>
    <ul>
      <li>Picking por corredor: ordena itens pela disposição física da loja</li>
      <li>App separador: lista de separação, bipagem de SKU, conferência</li>
      <li>Substituição de SKU: produto em falta → sugerir similar com aprovação do cliente</li>
      <li>Lista de compras: cliente monta lista no app e retira na loja</li>
    </ul>
    <p style="font-size:13px;color:#78716c;font-style:italic;margin-top:6px">Painel de status em tempo real, ciclo novo→entregue e reserva de estoque são herdados da base — aqui o delta é picking/separação e lista de compras.</p>
  </div>

  <h2>Ciclo do pedido online (delivery/marketplace)</h2>
  <div class="mermaid">
stateDiagram-v2
  [*] --> Novo : Pedido recebido
  Novo --> Confirmado : Loja aceita
  Confirmado --> Separando: Início do picking
  Separando --> Pronto: Itens separados
  Pronto --> EmEntrega: Motoboy coletou
  EmEntrega --> Entregue: Entrega confirmada
  Novo --> Cancelado: Recusado / sem estoque
  Confirmado --> Cancelado: Cancelado p/ cliente
  Entregue --> [*]
  Cancelado --> [*]
  </div>

  <h2>Picking por corredor</h2>
  <div class="card-grid">
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🗺️</span> Ordenação por corredor</div>
      <p>Os itens do pedido são exibidos na ordem do layout da loja — corredores 1, 2, 3 etc. O separador caminha apenas uma vez pela loja.</p>
    </div>
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">📱</span> App do separador</div>
      <p>Scan do item para confirmar; substituto sugerido se SKU em ruptura; foto do item para confirmação visual.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">⏱️</span> SLA de separação</div>
      <p>Alerta se separação ultrapassar tempo configurado (p. ex. 20 min). Gerente pode reatribuir a outro separador.</p>
    </div>
    <div class="card card-lime">
      <div class="card-title"><span class="card-icon">🔄</span> Substituição</div>
      <p>Se item em falta: sugere similar aprovado pelo catálogo; notifica cliente para aceitar ou cancelar o item.</p>
    </div>
  </div>

  <h2>Painel de pedidos (mockup)</h2>
  <div class="mockup-container">
    <div class="mock-topbar"><span class="mock-logo">📋 Painel de Pedidos — Mercadinho Central</span></div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;font-size:11px">
        <div style="background:#fff;border:1px solid #bfdbfe;border-radius:8px;padding:8px">
          <div style="font-weight:700;color:#1e40af;margin-bottom:6px">🆕 Novos (2)</div>
          <div style="background:#eff6ff;border-radius:6px;padding:6px;margin-bottom:4px">
            <div style="font-weight:600">#4521 · João Silva</div>
            <div style="color:#6b7280">8 itens · R$89,50</div>
            <div style="margin-top:4px"><span class="mock-badge mock-badge-blue">Marketplace</span></div>
          </div>
          <div style="background:#eff6ff;border-radius:6px;padding:6px">
            <div style="font-weight:600">#4522 · Ana Costa</div>
            <div style="color:#6b7280">5 itens · R$43,20</div>
            <div style="margin-top:4px"><span class="mock-badge mock-badge-blue">Delivery</span></div>
          </div>
        </div>
        <div style="background:#fff;border:1px solid #fde68a;border-radius:8px;padding:8px">
          <div style="font-weight:700;color:#92400e;margin-bottom:6px">⏳ Separando (1)</div>
          <div style="background:#fffbeb;border-radius:6px;padding:6px">
            <div style="font-weight:600">#4518 · Pedro Matos</div>
            <div style="color:#6b7280">12 itens · R$127,00</div>
            <div style="margin-top:4px"><span class="mock-badge mock-badge-yellow">Em separação</span></div>
          </div>
        </div>
        <div style="background:#fff;border:1px solid #6ee7b7;border-radius:8px;padding:8px">
          <div style="font-weight:700;color:#065f46;margin-bottom:6px">✅ Prontos (2)</div>
          <div style="background:#f0fdf4;border-radius:6px;padding:6px;margin-bottom:4px">
            <div style="font-weight:600">#4515 · Maria Sousa</div>
            <div style="color:#6b7280">Aguardando motoboy</div>
          </div>
          <div style="background:#f0fdf4;border-radius:6px;padding:6px">
            <div style="font-weight:600">#4516 · Carlos Lima</div>
            <div style="color:#6b7280">Retirada na loja</div>
          </div>
        </div>
        <div style="background:#fff;border:1px solid #d1fae5;border-radius:8px;padding:8px">
          <div style="font-weight:700;color:#047857;margin-bottom:6px">🚚 Em Entrega (3)</div>
          <div style="color:#6b7280">3 pedidos a caminho</div>
          <div style="margin-top:8px;font-size:10px;background:#dcfce7;padding:6px;border-radius:4px">
            <div>⏱ Tempo médio: 28 min</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`
});
