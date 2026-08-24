WIKI.register({
  id: 'checkout-orquestracao',
  title: 'Checkout Orquestrado (C-05)',
  icon: '💳',
  searchText: 'checkout orquestracao C-05 validate cart reserve inventory create orders suborders rollback compensacao parcial saga transacao distribuida consistencia eventual',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Carrinho e Checkout</div>
    <h1 class="section-title">💳 Checkout Orquestrado — C-05</h1>
    <p class="section-subtitle">O checkout do Marketplace envolve múltiplas lojas, reservas de estoque e cobrança simultânea. A decisão C-05 define um orquestrador que executa as etapas em sequência com rollback parcial se uma falha ocorre.</p>
    <div class="section-tags">
      <span class="tag-indigo">C-05</span>
      <span class="tag-red">Saga Pattern</span>
      <span class="tag-amber">Rollback Parcial</span>
      <span class="tag-blue">Core :3101</span>
    </div>
  </div>

  <div class="eco-callout">
    <div class="eco-icon">🔗</div>
    <div class="eco-body">
      <div class="eco-title">O checkout gera o pedido que o lojista opera no ERP</div>
      <div class="eco-links">
        Ao concluir, cada sub-pedido aterrissa em
        <a href="../wiki-erp/wiki-erp/index.html#pedidos">ERP · Pedidos</a> (painel Kanban do lojista);
        a cobrança e o split seguem para <a href="#pagamento-split">Pagamento e Split</a>.
      </div>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">🟠 Hoje (Parcial)</div>
    <p><code>POST /v1/orders</code> cria o pedido e <code>POST /v1/orders/:id/checkout</code> dispara cobrança via payment-api. A reserva de estoque (<code>inventory/reserve</code>) existe como endpoint separado. A orquestração completa C-05 com rollback parcial <strong>ainda não está implementada</strong> — as etapas existem mas não como saga coordenada.</p>
  </div>

  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">💡 Proposta — C-05 completo</div>
    <p>Orquestrador no core-api que executa: <strong>1) validate_cart</strong> → <strong>2) reserve_inventory</strong> → <strong>3) create_orders[]</strong> (uma por loja/SubOrder) → <strong>4) create_charge</strong> → se qualquer passo falha, rollback compensatório das etapas anteriores (libera reservas, cancela orders parciais).</p>
  </div>

  <h2>Fluxo do orquestrador C-05</h2>
  <div class="mermaid">
flowchart TD
  A["POST /v1/checkout\n(carrinho confirmado)"] --> B["1. validate_cart\npreços, disponibilidade, ticket mínimo"]
  B --> B2{OK?}
  B2 -->|Não| E1["❌ 422 Unprocessable\nitem indisponível / preço alterado"]
  B2 -->|Sim| C["2. reserve_inventory\npara cada item × loja"]
  C --> C2{OK?}
  C2 -->|Falha parcial| R1["ROLLBACK\nlibera reservas feitas"]
  C2 -->|Sim| D["3. create_orders[]\nOrder + SubOrder por loja"]
  D --> D2{OK?}
  D2 -->|Erro| R2["ROLLBACK\ncancela orders + libera reservas"]
  D2 -->|Sim| F["4. create_charge\nvia payment-api :3106"]
  F --> F2{Pagamento?}
  F2 -->|Recusado| R3["ROLLBACK\ncancela orders + libera reservas"]
  F2 -->|Aprovado| G["✅ Checkout OK\nestado: AWAITING_CONFIRMATION"]
  </div>

  <h2>Etapas do C-05 — detalhes</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Etapa</th><th>O que faz</th><th>Rollback se falha</th><th>Estado</th></tr></thead>
      <tbody>
        <tr>
          <td class="td-bold">1. validate_cart</td>
          <td>Verifica preços atuais vs snapshot, disponibilidade, ticket mínimo, cupons</td>
          <td>N/A (primeira etapa)</td>
          <td><span class="status-badge status-partial">🔶 Parcial</span></td>
        </tr>
        <tr>
          <td class="td-bold">2. reserve_inventory</td>
          <td>Reserva temporária (TTL 15 min) de cada item em estoque. Impede double-sell.</td>
          <td>Libera todas as reservas feitas</td>
          <td><span class="status-badge status-partial">🔶 Existe separado</span></td>
        </tr>
        <tr>
          <td class="td-bold">3. create_orders[]</td>
          <td>Cria Order principal + SubOrder por loja + OrderItem por item</td>
          <td>Cancela Orders criadas + libera reservas</td>
          <td><span class="status-badge status-partial">🔶 Existe separado</span></td>
        </tr>
        <tr>
          <td class="td-bold">4. create_charge</td>
          <td>Envia cobrança para payment-api (PIX ou cartão). Aguarda resposta síncrona ou webhook.</td>
          <td>Cancela Orders + libera reservas</td>
          <td><span class="status-badge status-partial">🔶 Existe separado</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>Modelo de dados — Order / SubOrder</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Entidade</th><th>Campos principais</th><th>Cardinalidade</th></tr></thead>
      <tbody>
        <tr>
          <td class="td-bold"><code>Order</code></td>
          <td><code>id, userId, status, totalAmount, paymentId, checkoutAt, deliveryAddress</code></td>
          <td>1 por checkout</td>
        </tr>
        <tr>
          <td class="td-bold"><code>SubOrder</code></td>
          <td><code>id, orderId, storeId, status, subtotal, deliveryFee, eta, deliveryAt</code></td>
          <td>1 por loja no carrinho</td>
        </tr>
        <tr>
          <td class="td-bold"><code>OrderItem</code></td>
          <td><code>id, subOrderId, offerId, qty, unitPrice, notes, substitutedBy</code></td>
          <td>N por SubOrder</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>Estados do Checkout</h2>
  <div class="mermaid">
flowchart LR
  CART["CART\n(ativo)"] --> CHECKOUT["CHECKOUT_STARTED"]
  CHECKOUT --> VALIDATING["VALIDATING"]
  VALIDATING --> RESERVING["RESERVING_INVENTORY"]
  RESERVING --> CREATING["CREATING_ORDERS"]
  CREATING --> CHARGING["CHARGING"]
  CHARGING --> AWAITING["AWAITING_CONFIRMATION\n(loja)"]
  CHARGING --> FAILED["FAILED\n(pagamento recusado)"]
  VALIDATING --> FAILED2["FAILED\n(validação)"]
  FAILED --> CART2["CART\n(restaurado)"]
  FAILED2 --> CART2
  </div>

  <div class="alert alert-orange">
    <span class="alert-icon">⚠️</span>
    <div class="alert-body">
      <div class="alert-title">Idempotência é crítica</div>
      <p>Cada etapa do C-05 deve ser idempotente — retry seguro sem duplicar reservas ou charges. Usar <code>idempotencyKey</code> no payment-api (cartId + timestamp) e lock otimista no inventory reserve. O cliente pode sofrer timeout de rede e retentar: o orquestrador deve detectar estado já avançado e retornar o resultado existente.</p>
    </div>
  </div>
</div>
`
});
