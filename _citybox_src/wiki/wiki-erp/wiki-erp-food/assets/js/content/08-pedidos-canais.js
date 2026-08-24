WIKI.register({
  id: 'pedidos-canais',
  title: 'Pedidos Multicanal em Tempo Real',
  icon: '📦',
  searchText: 'pedidos multicanal realtime mesa balcao delivery app marketplace websocket kanban status food incoming aceitar rejeitar',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Pedidos e Delivery</div>
    <h1 class="section-title">📦 Pedidos Multicanal em Tempo Real</h1>
    <p class="section-subtitle">Central unificada de pedidos: mesa, balcão, delivery próprio, iFood e Rappi — todos em um único painel Kanban com status food e notificações em tempo real via WebSocket.</p>
    <div class="section-tags">
      <span class="tag-red">Multicanal</span>
      <span class="tag-orange">Realtime · WebSocket</span>
      <span class="tag-gray">Kanban Food</span>
    </div>
  </div>

  <div class="herda-base-callout">
    <span class="hb-icon">🏪</span>
    <div class="hb-body">
      <div class="hb-title">Herda do ERP Base — Pedidos Canônico</div>
      <div class="hb-links">Esta vertical herda <a href="../wiki-erp/index.html#pedidos">Pedidos</a>: modelo <code>Order</code>/<code>SubOrder</code>, Kanban genérico, ciclo de status, atualização realtime via WebSocket e métricas operacionais. Esta seção documenta <strong>apenas o delta food</strong>: matriz status×canal, aceite externo iFood/Rappi (5min), alerta sonoro, reagrupamento por mesa e roteamento ao KDS.</div>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (UI mockada — sem backend)</div>
    <ul>
      <li><strong>Painel de Gestão de Pedidos no ERP</strong> (<code>/food/pedidos/gestao-pedidos</code>): cards de KPI (total, em preparo, pronto, cancelado), grid de pedidos, abas por status, sheet de detalhe e toolbar com filtros (canal PDV/App/iFood, pagamento, período)</li>
      <li><strong>Dados são mockados</strong> — <code>MOCK_FOOD_ORDERS</code> + <code>sessionStorage</code> via <code>use-order-management-state.ts</code>; ações aceitar/rejeitar/cancelar/marcar-pronto operam apenas localmente</li>
      <li>Marcador no código: <code>// TODO: substituir por WebSocket para abas operacionais em produção</code></li>
      <li>Ainda não há módulo de pedidos no food-api, nem realtime, nem aceite externo iFood/Rappi</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Central de Pedidos Food</div>
    <ul>
      <li>Painel Kanban food com colunas: Novos → Aceitos → Produzindo → Prontos → Saiu/Entregue</li>
      <li>Badge de canal em cada card: Mesa / Balcão / Delivery Próprio / iFood / Rappi / Citybox</li>
      <li>Alerta sonoro + visual para novos pedidos externos (iFood/Rappi)</li>
      <li>Timer por pedido: SLA de entrega configurável, escalação automática de alerta</li>
      <li>Aceite/rejeite com motivo para pedidos externos (até 5 min para aceitar no iFood)</li>
      <li>Status food estendido: <code>INCOMING → ACCEPTED → PREPARING → DISPATCHED → DELIVERED</code></li>
      <li>Reagrupamento por mesa: visualizar todos os pedidos de uma mesa juntos</li>
      <li>Histórico de pedidos com busca por número, cliente, data e canal</li>
    </ul>
  </div>

  <h2>Kanban de Pedidos Food — status por canal</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Status</th><th>Mesa/Salão</th><th>Balcão PDV</th><th>Delivery Próprio</th><th>iFood/Rappi</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">INCOMING</td><td>Comanda aberta</td><td>Lançado no PDV</td><td>App recebe pedido</td><td>Hub recebe pedido</td></tr>
        <tr><td class="td-bold">ACCEPTED</td><td>Automático</td><td>Automático</td><td>Loja aceita</td><td>Loja aceita em 5min</td></tr>
        <tr><td class="td-bold">PREPARING</td><td>KDS recebe</td><td>KDS recebe</td><td>KDS recebe</td><td>KDS recebe</td></tr>
        <tr><td class="td-bold">READY</td><td>Garçom notificado</td><td>Senha chamada</td><td>Entregador acionado</td><td>Entregador acionado</td></tr>
        <tr><td class="td-bold">DISPATCHED</td><td>—</td><td>—</td><td>Saiu para entrega</td><td>Saiu para entrega</td></tr>
        <tr><td class="td-bold">DELIVERED</td><td>Mesa fechada</td><td>Retirado balcão</td><td>Entregue ao cliente</td><td>Entregue ao cliente</td></tr>
        <tr><td class="td-bold">CANCELLED</td><td>Garçom cancela</td><td>Operador cancela</td><td>Cliente/loja cancela</td><td>Plataforma/loja</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Mockup — Painel de Pedidos</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">📦 Pedidos — Hamburgueria do Zé</span>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;">
        <div style="background:#fff7f7;border:1px solid #fca5a5;border-radius:8px;padding:10px;">
          <div style="font-weight:700;font-size:12px;color:#9f1239;margin-bottom:8px;">🔴 NOVOS (2)</div>
          <div style="background:#fff;border:1px solid #fca5a5;border-radius:6px;padding:8px;margin-bottom:6px;">
            <div style="display:flex;justify-content:space-between;font-size:12px;">
              <span class="mock-badge" style="background:#dbeafe;color:#1e40af;font-size:10px;">iFood</span>
              <span style="font-size:11px;color:#9f1239;">⏱ 0:45</span>
            </div>
            <div style="font-size:12px;font-weight:600;margin:4px 0;">#4521 · R$38,90</div>
            <div style="font-size:11px;color:#6b7280;">2x X-Burguer · 1x Refri</div>
          </div>
          <div style="background:#fff;border:1px solid #fca5a5;border-radius:6px;padding:8px;">
            <div style="display:flex;justify-content:space-between;font-size:12px;">
              <span class="mock-badge" style="background:#ede9fe;color:#5b21b6;font-size:10px;">Rappi</span>
              <span style="font-size:11px;color:#9f1239;">⏱ 1:20</span>
            </div>
            <div style="font-size:12px;font-weight:600;margin:4px 0;">#4522 · R$52,00</div>
            <div style="font-size:11px;color:#6b7280;">1x Combo Duplo · 1x Milk</div>
          </div>
        </div>
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:10px;">
          <div style="font-weight:700;font-size:12px;color:#92400e;margin-bottom:8px;">🟡 PRODUZINDO (3)</div>
          <div style="background:#fff;border:1px solid #fed7aa;border-radius:6px;padding:8px;margin-bottom:6px;">
            <span class="mock-badge mock-badge-yellow" style="font-size:10px;">Mesa 5</span>
            <div style="font-size:12px;font-weight:600;margin:4px 0;">#4519 · R$61,80</div>
            <div style="font-size:11px;color:#6b7280;">⏱ 8:30 de produção</div>
          </div>
        </div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px;">
          <div style="font-weight:700;font-size:12px;color:#166534;margin-bottom:8px;">🟢 PRONTOS (1)</div>
          <div style="background:#fff;border:1px solid #86efac;border-radius:6px;padding:8px;">
            <span class="mock-badge mock-badge-green" style="font-size:10px;">Balcão</span>
            <div style="font-size:12px;font-weight:600;margin:4px 0;">#4518 · Senha 42</div>
            <div style="font-size:11px;color:#6b7280;">1x X-Burguer · 1x Batata</div>
          </div>
        </div>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px;">
          <div style="font-weight:700;font-size:12px;color:#6b7280;margin-bottom:8px;">✅ ENTREGUE (18)</div>
          <div style="font-size:11px;color:#9ca3af;text-align:center;padding:16px 0;">Ver histórico →</div>
        </div>
      </div>
    </div>
  </div>

  <h2>Eventos em tempo real — WebSocket</h2>
  <pre>{
  // Novo pedido chegando
  "event": "order.incoming",
  "data": {
    "orderId": "uuid",
    "channel": "ifood",
    "externalId": "IFD-00123",
    "total": 3890,
    "items": [...],
    "address": { "street": "...", "district": "..." },
    "estimatedDelivery": "2026-06-21T15:30:00Z"
  }
}

{
  // Status atualizado
  "event": "order.status_changed",
  "data": {
    "orderId": "uuid",
    "from": "ACCEPTED",
    "to": "PREPARING",
    "timestamp": "2026-06-21T15:10:00Z"
  }
}</pre>
</div>
`
});
