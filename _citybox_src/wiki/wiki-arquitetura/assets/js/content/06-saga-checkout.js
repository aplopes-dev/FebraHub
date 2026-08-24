WIKI.register({
  id: 'saga-checkout',
  title: 'Saga do checkout',
  icon: '🔄',
  searchText: 'saga pattern orquestracao coreografia checkout c-05 validate cart reserve inventory create orders create charge compensacao rollback transacao distribuida consistencia eventual estado maquina',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Arquitetura-alvo</div>
    <h1 class="section-title">🔄 Saga do checkout (C-05)</h1>
    <p class="section-subtitle">O checkout multi-loja toca estoque, pedidos e pagamento — uma transação de negócio entre serviços. Hoje as etapas existem soltas; o alvo é um <strong>orquestrador com compensações</strong> (Saga por orquestração).</p>
    <div class="section-tags">
      <span class="tag-red">Gap crítico</span>
      <span class="tag-emerald">Saga · Orquestração</span>
      <span class="tag-amber">Compensação</span>
    </div>
  </div>

  <div class="eco-callout">
    <div class="eco-icon">🔗</div>
    <div class="eco-body">
      <div class="eco-title">Detalhe de produto deste fluxo</div>
      <div class="eco-links">
        A jornada do consumidor e o desenho funcional do checkout estão em
        <a href="../wiki-marketplace/#checkout-orquestracao">Marketplace · Checkout Orquestrado</a>.
        Aqui tratamos a <strong>mecânica distribuída</strong> (saga + compensações).
      </div>
    </div>
  </div>

  <h2>Orquestração vs Coreografia</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Estilo</th><th>Como</th><th>Quando usar no Citybox</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Coreografia</td><td>Serviços reagem a eventos, sem coordenador central</td><td>Pós-checkout: notificação, projeção, fidelidade (já é assim via RabbitMQ)</td></tr>
        <tr><td class="td-bold">Orquestração</td><td>Um orquestrador comanda passos e compensações</td><td><strong>Checkout</strong>: precisa de decisão central, ordem e rollback determinístico</td></tr>
      </tbody>
    </table>
  </div>

  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">💡 Decisão: orquestração para o checkout</div>
    <p>Orquestrador no <code>core-api</code> executa: <strong>validate_cart → reserve_inventory → create_orders[] → create_charge</strong>. Se qualquer passo falha, dispara as <strong>compensações</strong> dos passos já concluídos (em ordem inversa). Cada passo é idempotente (retry seguro).</p>
  </div>

  <h2>Fluxo da Saga com compensações</h2>
  <div class="mermaid">
flowchart TD
  A["POST /v1/checkout<br/>(carrinho confirmado)"] --> B["1 · validate_cart<br/>preços · disponibilidade · ticket mínimo"]
  B --> B2{OK?}
  B2 -->|Não| E1["422 Problem Details<br/>(RFC-7807)"]
  B2 -->|Sim| C["2 · reserve_inventory<br/>reserva TTL por item × loja"]
  C --> C2{OK?}
  C2 -->|Falha| RC["compensar:<br/>release_inventory"]
  C2 -->|Sim| D["3 · create_orders[]<br/>Order + SubOrder por loja"]
  D --> D2{OK?}
  D2 -->|Falha| RD["compensar:<br/>cancel_orders + release_inventory"]
  D2 -->|Sim| F["4 · create_charge<br/>payment-api :3106 (Idempotency-Key)"]
  F --> F2{Pago?}
  F2 -->|Recusado| RF["compensar:<br/>cancel_orders + release_inventory"]
  F2 -->|Aprovado| G["AWAITING_CONFIRMATION<br/>emite order.created (evento)"]
  RC --> E2["checkout FAILED<br/>carrinho restaurado"]
  RD --> E2
  RF --> E2
  </div>

  <h2>Passos e compensações</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Passo</th><th>Ação</th><th>Compensação</th><th>Idempotência</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">1 · validate_cart</td><td>Revalida preços/estoque/cupom vs snapshot</td><td>N/A (sem efeito)</td><td>Pura leitura</td></tr>
        <tr><td class="td-bold">2 · reserve_inventory</td><td>Reserva temporária (TTL) por item/loja</td><td><code>release_inventory</code></td><td>Lock otimista + reservationId</td></tr>
        <tr><td class="td-bold">3 · create_orders[]</td><td>Cria Order + SubOrder por loja</td><td><code>cancel_orders</code></td><td>Chave <code>checkoutId</code> única</td></tr>
        <tr><td class="td-bold">4 · create_charge</td><td>Cobrança no payment-api</td><td><code>refund</code> / cancela cobrança</td><td><code>Idempotency-Key</code></td></tr>
      </tbody>
    </table>
  </div>

  <h2>Máquina de estados do checkout</h2>
  <div class="mermaid">
stateDiagram-v2
  [*] --> CART
  CART --> VALIDATING: checkout
  VALIDATING --> RESERVING: ok
  VALIDATING --> FAILED: inválido
  RESERVING --> CREATING_ORDERS: reservado
  RESERVING --> FAILED: sem estoque
  CREATING_ORDERS --> CHARGING: pedidos ok
  CREATING_ORDERS --> FAILED: erro
  CHARGING --> AWAITING_CONFIRMATION: aprovado
  CHARGING --> FAILED: recusado
  FAILED --> CART: compensado/restaurado
  AWAITING_CONFIRMATION --> [*]
  </div>

  <h2>Persistência da Saga</h2>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">💡 SagaState como tabela</div>
    <p>Persistir o estado da saga (<code>CheckoutSaga</code>: <code>id, step, status, compensations[], payload</code>) no tenant DB. Permite <strong>retomar</strong> após crash do processo e auditar onde parou — em vez de manter o estado só em memória do request.</p>
  </div>

  <div class="alert alert-red">
    <span class="alert-icon">⚠️</span>
    <div class="alert-body">
      <div class="alert-title">Idempotência é pré-requisito da Saga</div>
      <p>Sem idempotência (ver <a href="#comunicacao-eventos">Comunicação/Eventos</a>), o retry de um passo pode duplicar reservas ou cobranças. Por isso o roadmap coloca <strong>idempotência uniforme antes</strong> da saga completa.</p>
    </div>
  </div>
</div>
`
});
