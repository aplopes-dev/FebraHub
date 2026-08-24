WIKI.register({
  id: 'acompanhamento-pedido',
  title: 'Acompanhamento do Pedido',
  icon: '📦',
  searchText: 'acompanhamento pedido status rastreio realtime gateway mapa entregador push notificacao linha do tempo order status machine AWAITING CONFIRMED PREPARING READY_FOR_PICKUP DELIVERING DELIVERED',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Pedido e Pós-venda</div>
    <h1 class="section-title">📦 Acompanhamento do Pedido</h1>
    <p class="section-subtitle">Após confirmar o pagamento, o consumidor quer saber onde está o pedido em tempo real. A linha do tempo de estados + rastreio do entregador + push notifications formam a experiência de acompanhamento.</p>
    <div class="section-tags">
      <span class="tag-indigo">realtime-gateway :3104</span>
      <span class="tag-blue">WebSocket</span>
      <span class="tag-violet">Push Notifications</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">🟠 Hoje (Parcial)</div>
    <p>A estrutura de estados do pedido existe no modelo de dados (<code>Order.status</code>, <code>SubOrder.status</code>). O <code>realtime-gateway</code> (:3104) está previsto. Workers publicam eventos de mudança de estado. A tela de acompanhamento no app nativo <strong>ainda não existe</strong> (app vazio).</p>
  </div>

  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">💡 Proposta (produto alvo)</div>
    <p>Tela de acompanhamento com linha do tempo visual, mapa do entregador em tempo real (WebSocket), estimativa de chegada atualizada, push notification a cada transição de estado, botão de suporte inline, aviso de substituição pós-confirmação.</p>
  </div>

  <h2>Estados do pedido (Order)</h2>
  <div class="mermaid">
flowchart LR
  PENDING["PENDING\naguardando pagamento"] --> CONFIRMED["CONFIRMED\npagamento aprovado"]
  CONFIRMED --> PREPARING["PREPARING\nloja preparando"]
  PREPARING --> READY["READY_FOR_PICKUP\naguardando coleta"]
  READY --> DELIVERING["DELIVERING\nem rota"]
  DELIVERING --> DELIVERED["DELIVERED\nentregue"]
  CONFIRMED --> CANCELLED["CANCELLED\nloja recusou"]
  DELIVERING --> FAILED["FAILED\nnão entregue"]
  PENDING --> EXPIRED["EXPIRED\nPIX vencido"]
  </div>

  <h2>Linha do tempo — UI</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span>← Pedido #MP-2024-0042</span>
      <span style="margin-left:auto" class="mock-badge mock-badge-indigo">Em preparo</span>
    </div>
    <div class="mock-body">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px">🍕 Pizzaria Dom · Pedido confirmado</div>
      <div style="position:relative;padding-left:24px">
        <div style="position:absolute;left:8px;top:0;bottom:0;width:2px;background:#c7d2fe"></div>
        <div style="margin-bottom:14px;position:relative">
          <div style="position:absolute;left:-20px;top:2px;width:12px;height:12px;border-radius:50%;background:#4f46e5"></div>
          <div style="font-size:12px;font-weight:700;color:#4f46e5">✅ Pedido confirmado</div>
          <div style="font-size:11px;color:#6b7280">14:32 — Pagamento aprovado</div>
        </div>
        <div style="margin-bottom:14px;position:relative">
          <div style="position:absolute;left:-20px;top:2px;width:12px;height:12px;border-radius:50%;background:#4f46e5"></div>
          <div style="font-size:12px;font-weight:700;color:#4f46e5">🍳 Em preparo</div>
          <div style="font-size:11px;color:#6b7280">14:35 — Loja iniciou preparo</div>
        </div>
        <div style="margin-bottom:14px;position:relative">
          <div style="position:absolute;left:-20px;top:2px;width:12px;height:12px;border-radius:50%;background:#c7d2fe;border:2px solid #4f46e5"></div>
          <div style="font-size:12px;font-weight:700;color:#6b7280">🛵 Aguardando entregador</div>
          <div style="font-size:11px;color:#9ca3af">Previsto 14:55</div>
        </div>
        <div style="margin-bottom:14px;position:relative">
          <div style="position:absolute;left:-20px;top:2px;width:12px;height:12px;border-radius:50%;background:#e0e7ff"></div>
          <div style="font-size:12px;color:#9ca3af">📍 A caminho</div>
        </div>
        <div style="position:relative">
          <div style="position:absolute;left:-20px;top:2px;width:12px;height:12px;border-radius:50%;background:#e0e7ff"></div>
          <div style="font-size:12px;color:#9ca3af">🏠 Entregue</div>
        </div>
      </div>
      <div style="background:white;border-radius:8px;padding:10px;border:1px solid #a5b4fc;margin-top:12px;font-size:12px">
        🗺️ <strong>Mapa do entregador</strong> — disponível quando saiu para entrega
      </div>
    </div>
  </div>

  <h2>Realtime — WebSocket</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Evento</th><th>Payload</th><th>Gatilho</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>order.status_changed</code></td><td><code>{ orderId, status, updatedAt }</code></td><td>Worker processa evento de mudança de estado</td></tr>
        <tr><td class="td-bold"><code>order.location_updated</code></td><td><code>{ orderId, lat, lng, eta }</code></td><td>App do entregador envia posição a cada 10s</td></tr>
        <tr><td class="td-bold"><code>order.substitution_offered</code></td><td><code>{ orderId, original, suggested }</code></td><td>Lojista solicita substituição via ERP</td></tr>
        <tr><td class="td-bold"><code>order.eta_updated</code></td><td><code>{ orderId, newEta }</code></td><td>Worker reavalia ETA baseado em localização</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Push Notifications — gatilhos</h2>
  <ul>
    <li>🔔 <strong>Pedido confirmado</strong> — "Sua pizzaria confirmou seu pedido!"</li>
    <li>🔔 <strong>Em preparo</strong> — "A loja está preparando seu pedido 👨‍🍳"</li>
    <li>🔔 <strong>Saiu para entrega</strong> — "Seu pedido saiu! ETA: 12 min 🛵"</li>
    <li>🔔 <strong>Entregue</strong> — "Pedido entregue! Avalie sua experiência ⭐"</li>
    <li>🔔 <strong>Substituição</strong> — "A loja propôs uma substituição. Aceitar?"</li>
  </ul>
</div>
`
});
