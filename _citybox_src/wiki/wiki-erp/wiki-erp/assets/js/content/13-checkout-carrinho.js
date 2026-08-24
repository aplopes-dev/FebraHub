WIKI.register({
  id: 'checkout-carrinho',
  title: 'Checkout e Carrinho',
  icon: '🛍️',
  searchText: 'checkout carrinho cart multi-loja orquestrador C05 endereco frete cupom desconto pagamento',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Catálogo e Operação</div>
    <h1 class="section-title">🛍️ Checkout e Carrinho</h1>
    <p class="section-subtitle">Fluxo de checkout do consumidor via marketplace — carrinho multi-loja, cálculo de frete, aplicação de cupons e orquestração do pagamento.</p>
    <div class="section-tags">
      <span class="tag-orange">Checkout</span>
      <span class="tag-amber">Multi-loja · Orquestrador</span>
      <span class="tag-gray">Carrinho · Cupom · Frete</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>API de carrinho funcional: <code>POST /cart/items</code>, <code>GET /cart</code></li>
      <li>Checkout orquestrado (C-05): reserva estoque → cria pedidos → inicia pagamento</li>
      <li>Suporte a carrinho multi-loja (SubOrders)</li>
      <li>Frete calculado pela API via ShippingRule</li>
      <li>Frontend do marketplace (app do consumidor) usa esse fluxo</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Carrinho persistido no Redis + DB: sobrevive reload e troca de device</li>
      <li>Cupom de desconto: % ou R$ fixo, por item ou total, com regras de validade</li>
      <li>Frete grátis acima de valor mínimo configurável</li>
      <li>Agendamento de entrega: horários disponíveis por loja</li>
      <li>Carrinho salvo ("comprar depois"): usuário pode retomar</li>
      <li>Upsell no checkout: "Adicione R$15 e ganhe frete grátis"</li>
      <li>Múltiplos endereços de entrega por cliente</li>
    </ul>
  </div>

  <h2>Mockup — Carrinho e Checkout (visão ERP)</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">🛍️ Pedido #ORD-2841 — Checkout confirmado</span>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:14px">
        <div>
          <div class="mock-label">Itens do pedido</div>
          <table class="mock-table">
            <thead><tr><th>Item</th><th>Qtd</th><th>Valor</th></tr></thead>
            <tbody>
              <tr><td>Arroz Tio João 5kg</td><td>2×</td><td>R$ 49,80</td></tr>
              <tr><td>Leite UHT 1L (cx 12)</td><td>1×</td><td>R$ 22,90</td></tr>
              <tr><td>Detergente Neutro</td><td>2×</td><td>R$ 10,00</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <div class="mock-label">Resumo</div>
          <div class="mock-row"><span style="flex:1;font-size:12px;color:#6b7280">Subtotal</span><span style="font-size:12px">R$ 82,70</span></div>
          <div class="mock-row"><span style="flex:1;font-size:12px;color:#16a34a">Cupom PROMO10</span><span style="font-size:12px;color:#16a34a">− R$ 8,27</span></div>
          <div class="mock-row"><span style="flex:1;font-size:12px;color:#6b7280">Entrega</span><span style="font-size:12px">R$ 6,00</span></div>
          <div class="mock-divider"></div>
          <div class="mock-row"><span style="flex:1;font-size:13px;font-weight:700">Total</span><span style="font-size:14px;font-weight:800;color:#b45309">R$ 80,43</span></div>
          <div class="mock-row" style="margin-top:8px"><span class="mock-badge mock-badge-green">✅ Pago — PIX</span></div>
        </div>
      </div>
    </div>
  </div>
  <p class="mermaid-caption">Checkout do consumidor é canônico no marketplace e atende qualquer vertical de produto. Exemplo ilustrativo (market). As verticais não reimplementam o checkout — consomem este fluxo da base.</p>

  <h2>Orquestrador de Checkout (C-05)</h2>
  <div class="mermaid">
sequenceDiagram
  participant App as App do cliente
  participant BFF as marketplace-bff
  participant Core as marketplace-api
  participant Stock as Estoque
  participant Payment as payment-api
  participant KC as Keycloak

  App->>BFF: POST /checkout { cartId, paymentMethod, addressId }
  BFF->>Core: POST /checkout/initiate
  Core->>Core: Validar carrinho + itens ativos
  Core->>Stock: Reservar estoque (PENDING)
  Stock-->>Core: OK / InsufficientStock
  Core->>Core: Criar Orders + SubOrders
  Core->>Payment: POST /payments { orderId, amount, method }
  Payment->>Payment: Processar PSP (Stripe/PagSeg)
  Payment-->>Core: payment.authorized
  Core->>Stock: Confirmar reserva (COMMITTED)
  Core->>MQ: emit('order.created') por SubOrder
  Core-->>BFF: 201 { orderId, paymentId, estimatedTime }
  BFF-->>App: 201 Pedido confirmado
  </div>

  <h2>Modelo Cart</h2>
  <pre>model Cart {
  id          String     @id @default(cuid())
  sessionId   String?    // guest checkout
  customerId  String?    // usuário autenticado
  storeItems  CartItem[] // itens agrupados por loja
  couponCode  String?
  expiresAt   DateTime   // TTL: 2h de inatividade
  createdAt   DateTime   @default(now())
}

model CartItem {
  id          String   @id
  cartId      String
  storeId     String
  itemId      String
  variantId   String?
  modifiers   Json     // modificadores selecionados
  quantity    Int
  unitPrice   Decimal
  channel     String   @default("DELIVERY")
}</pre>

  <h2>Regras de carrinho</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Regra</th><th>Comportamento</th></tr></thead>
      <tbody>
        <tr><td>Quantidade máxima</td><td>Limitada por estoque disponível e regra do lojista (max_per_order)</td></tr>
        <tr><td>Item desativado</td><td>Bloqueado no checkout com mensagem "item indisponível"</td></tr>
        <tr><td>Múltiplas lojas</td><td>Cria SubOrder por loja — frete calculado individualmente</td></tr>
        <tr><td>Pedido mínimo</td><td>Loja define valor mínimo — bloqueio no checkout</td></tr>
        <tr><td>Horário de entrega</td><td>Valida se loja está aberta no momento do checkout</td></tr>
        <tr><td>Validade do carrinho</td><td>2h de inatividade → expira → limpa reservas de estoque</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Cupons de desconto (proposta)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tipo</th><th>Exemplo</th><th>Regras</th></tr></thead>
      <tbody>
        <tr><td>% sobre total</td><td>PROMO10 → 10% off</td><td>valor_minimo, max_uses, expiry</td></tr>
        <tr><td>R$ fixo</td><td>FRETE5 → R$5 de desconto</td><td>por pedido ou por item</td></tr>
        <tr><td>Frete grátis</td><td>FRETEGRATIS → delivery free</td><td>valor_minimo obrigatório</td></tr>
        <tr><td>Primeiro pedido</td><td>BEM_VINDO → 15% 1ª compra</td><td>one-time por customerId</td></tr>
        <tr><td>Categoria</td><td>PIZZA20 → 20% em pizzas</td><td>restrito a categoryId</td></tr>
      </tbody>
    </table>
  </div>

  <h2>ERP: gestão de cupons (proposta)</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">🎟️</span> Criar cupom</div>
      <p>Nome, código, tipo de desconto, valor, validade, limite de usos, categorias/produtos elegíveis.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">📊</span> Rastrear uso</div>
      <p>Quantas vezes usado, total descontado, cupons expirados. ROI por campanha.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">⚡</span> Campanhas flash</div>
      <p>Cupom com horário de início e fim: "50% off das 12h às 14h hoje". Ativação automática.</p>
    </div>
  </div>
</div>
`
});
