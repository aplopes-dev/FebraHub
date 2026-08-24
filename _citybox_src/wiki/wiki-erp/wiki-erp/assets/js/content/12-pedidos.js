WIKI.register({
  id: 'pedidos',
  title: 'Pedidos',
  icon: '🛒',
  searchText: 'pedidos orders kanban status fluxo order item suborder delivery balcao mesa realtime aceitar recusar',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Catálogo e Operação</div>
    <h1 class="section-title">🛒 Pedidos</h1>
    <p class="section-subtitle">Gestão do ciclo de vida de transações — pedidos (eixo produto), ordens de serviço e agendamentos concluídos (eixo serviço). Painel Kanban, fluxo de status, sub-pedidos multi-loja e atualização em tempo real.</p>
    <div class="section-tags">
      <span class="tag-orange">Pedidos</span>
      <span class="tag-amber">Kanban · Realtime</span>
      <span class="tag-gray">Food · Market · Services</span>
    </div>
  </div>

  <div class="eco-callout">
    <div class="eco-icon">🔗</div>
    <div class="eco-body">
      <div class="eco-title">Os pedidos nascem no checkout do consumidor</div>
      <div class="eco-links">
        Pedidos que chegam aqui são gerados pelo
        <a href="../../wiki-marketplace/index.html#checkout-orquestracao">Marketplace · Checkout e Orquestração</a>;
        o consumidor acompanha o status em
        <a href="../../wiki-marketplace/index.html#acompanhamento-pedido">Marketplace · Acompanhamento do Pedido</a>.
        O recebimento em si é feito no <a href="#checkout-carrinho">checkout/PDV</a> do ERP.
      </div>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>API de pedidos funcional no <code>marketplace-api</code></li>
      <li>ERP: tela de listagem em mock — sem Kanban realtime</li>
      <li>SubOrders para pedidos multi-loja no schema</li>
      <li>Status: PENDING → CONFIRMED → IN_PREPARATION → READY → DISPATCHED → DELIVERED</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Kanban visual com colunas por status, cards arrastaveis</li>
      <li>Push realtime via WebSocket — novo pedido toca alerta sonoro</li>
      <li>Timer de preparo: contador regressivo por pedido</li>
      <li>Aceitar/recusar com 1 clique e tempo de preparo estimado</li>
      <li>Filtros: canal (delivery/balcão/mesa), status, operador, data</li>
      <li>Historico de pedidos: busca por número, cliente, valor</li>
      <li>Ações rápidas: imprimir comanda, chamar entregador, estorno</li>
    </ul>
  </div>

  <h2>Painel Kanban de Pedidos (proposta)</h2>
  <div class="mockup-container">
    <div class="mock-topbar"><span class="mock-logo" style="color:#fbbf24">🛒 Pedidos — Hoje</span>
      <span style="margin-left:auto;color:rgba(255,255,255,.6);font-size:12px">🔴 LIVE</span>
    </div>
    <div class="mock-body" style="padding:12px;overflow-x:auto;">
      <div style="display:flex;gap:12px;min-width:700px;">
        <div style="flex:1;min-width:160px;">
          <div style="font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">Novos (3)</div>
          <div style="background:white;border:1px solid #fde68a;border-radius:8px;padding:10px;margin-bottom:8px;">
            <div style="font-weight:700;font-size:13px">#1042 — R$48,90</div>
            <div style="font-size:11px;color:#a8a29e;margin-top:2px;">🛵 Delivery · João S.</div>
            <div style="display:flex;gap:4px;margin-top:6px;">
              <button class="mock-btn mock-btn-primary" style="font-size:11px;padding:3px 8px;">✓ Aceitar</button>
              <button class="mock-btn mock-btn-outline" style="font-size:11px;padding:3px 8px;">✗</button>
            </div>
          </div>
          <div style="background:white;border:1px solid #fde68a;border-radius:8px;padding:10px;margin-bottom:8px;">
            <div style="font-weight:700;font-size:13px">#1043 — R$22,00</div>
            <div style="font-size:11px;color:#a8a29e;margin-top:2px;">🏪 Balcão</div>
          </div>
        </div>
        <div style="flex:1;min-width:160px;">
          <div style="font-size:12px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">Em Preparo (2)</div>
          <div style="background:white;border:1px solid #bfdbfe;border-radius:8px;padding:10px;margin-bottom:8px;">
            <div style="font-weight:700;font-size:13px">#1040 — R$67,50</div>
            <div style="font-size:11px;color:#a8a29e;margin-top:2px;">🛵 Delivery · ⏱ 12min</div>
          </div>
        </div>
        <div style="flex:1;min-width:160px;">
          <div style="font-size:12px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">Pronto (1)</div>
          <div style="background:white;border:1px solid #bbf7d0;border-radius:8px;padding:10px;margin-bottom:8px;">
            <div style="font-weight:700;font-size:13px">#1038 — R$35,00</div>
            <div style="font-size:11px;color:#a8a29e;margin-top:2px;">🛵 Aguardando entregador</div>
          </div>
        </div>
        <div style="flex:1;min-width:160px;">
          <div style="font-size:12px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">Concluídos (18)</div>
          <div style="background:#f9fafb;border:1px solid #e7e5e4;border-radius:8px;padding:10px;font-size:12px;color:#a8a29e;text-align:center;">Ver histórico</div>
        </div>
      </div>
    </div>
  </div>

  <h2>Ciclo de status do pedido (eixo produto — Food/Market)</h2>
  <div class="mermaid">
stateDiagram-v2
  [*] --> PENDING: Pedido criado (app/PDV)
  PENDING --> CONFIRMED: Aceito + pagamento ok
  PENDING --> CANCELLED: Recusado / timeout (5min)
  CONFIRMED --> IN_PREPARATION: Loja inicia preparo
  IN_PREPARATION --> READY: Produção concluída
  READY --> DISPATCHED: Saiu para entrega (delivery)
  READY --> DELIVERED: Retirado no balcão
  DISPATCHED --> DELIVERED: Entregue ao cliente
  DELIVERED --> CLOSED: Fiscal emitido (NFC-e/NF-e)
  CLOSED --> [*]
  CANCELLED --> [*]
  </div>

  <div class="alert alert-orange" style="margin-top:12px">
    <span class="alert-icon">📅</span>
    <div class="alert-body">
      <div class="alert-title">Eixo serviço: o "pedido" é um Appointment</div>
      <p>Para Beauty, Clinic, Services e Hospitality, o equivalente do Order é o <strong>Appointment</strong> (ver seção Agenda/Slots). O Kanban de pedidos aqui cobre o eixo produto (Food, Market). Verticais de serviço terão painel de agenda separado.</p>
    </div>
  </div>

  <h2>Modelo de dados</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Campo</th><th>Tipo</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td>id</td><td>cuid</td><td>Identificador único do pedido</td></tr>
        <tr><td>orderNumber</td><td>int (seq)</td><td>Número sequencial exibido ao cliente (#1042)</td></tr>
        <tr><td>storeId</td><td>string</td><td>Loja que receberá o pedido</td></tr>
        <tr><td>channel</td><td>enum</td><td>DELIVERY / COUNTER / DINE_IN / PICKUP / PDV</td></tr>
        <tr><td>status</td><td>enum</td><td>Ver ciclo de status acima</td></tr>
        <tr><td>items</td><td>OrderItem[]</td><td>Itens do pedido com quantidade e preço</td></tr>
        <tr><td>subOrders</td><td>SubOrder[]</td><td>Pedidos para múltiplas lojas (marketplace)</td></tr>
        <tr><td>totalAmount</td><td>Decimal</td><td>Valor total incluindo taxa de entrega</td></tr>
        <tr><td>deliveryFee</td><td>Decimal</td><td>Valor da taxa de entrega</td></tr>
        <tr><td>customerId</td><td>string?</td><td>Cliente autenticado (marketplace)</td></tr>
        <tr><td>scheduledFor</td><td>DateTime?</td><td>Pedido agendado para data/hora futura</td></tr>
        <tr><td>estimatedReadyAt</td><td>DateTime?</td><td>Previsão de preparo (gerência define ao aceitar)</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Métricas operacionais de pedidos</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">⏱</span> Tempo médio de preparo</div>
      <p>Avg entre aceitar e READY. Alerta se passar do SLA definido na configuração da loja.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">❌</span> Taxa de recusa</div>
      <p>% pedidos recusados pela loja. Alto indica problemas de capacidade ou estoque.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">💰</span> GMV do dia</div>
      <p>Gross Merchandise Value — soma de todos os pedidos DELIVERED do dia atual.</p>
    </div>
  </div>
</div>
`
});
