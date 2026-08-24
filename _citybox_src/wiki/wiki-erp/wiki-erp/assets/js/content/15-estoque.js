WIKI.register({
  id: 'estoque',
  title: 'Estoque',
  icon: '📊',
  searchText: 'estoque inventario stock reserva posicao alertas ajuste entrada saida transferencia InventoryStock',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Catálogo e Operação</div>
    <h1 class="section-title">📊 Estoque</h1>
    <p class="section-subtitle">Controle de estoque em tempo real — posição por loja, reservas otimistas no ciclo de pedidos, alertas de ruptura e histórico de movimentações.</p>
    <div class="section-tags">
      <span class="tag-orange">Estoque</span>
      <span class="tag-amber">InventoryStock</span>
      <span class="tag-gray">Reservas · Alertas</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Schema <code>InventoryStock</code> e <code>Reservation</code> existem no banco</li>
      <li>Reserva otimista no checkout: PENDING → COMMITTED → RELEASED</li>
      <li>ERP: tela de estoque em mock — sem ajuste manual via UI</li>
      <li>Sem alertas de estoque mínimo</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>CRUD de posição: ajuste manual, entrada de mercadoria, baixa</li>
      <li>Estoque mínimo configurável por item com alertas (e-mail/push)</li>
      <li>Histórico de movimentações: cada entrada/saída/ajuste rastreado</li>
      <li>Inventário periódico: contagem vs. sistema com relatório de divergências</li>
      <li>Recipe-level stock: ingrediente vinculado ao prato, deduz ao vender (Food)</li>
      <li>Consumíveis de serviço: produto vinculado ao serviço, deduz ao executar (Beauty, Clinic)</li>
      <li>Transferência entre lojas da mesma organização</li>
      <li>Relatório de giro: itens mais/menos vendidos, previsão de ruptura</li>
    </ul>
  </div>

  <h2>Ciclo de reserva de estoque</h2>
  <div class="mermaid">
stateDiagram-v2
  [*] --> AVAILABLE: Estoque inicial
  AVAILABLE --> RESERVED: checkout iniciado (PENDING)
  RESERVED --> COMMITTED: pagamento confirmado
  RESERVED --> AVAILABLE: checkout expirado / cancelado
  COMMITTED --> CONSUMED: pedido entregue / consumido
  COMMITTED --> AVAILABLE: pedido cancelado (estorno)
  CONSUMED --> [*]
  </div>

  <h2>Modelo de dados</h2>
  <pre>model InventoryStock {
  id          String   @id @default(cuid())
  storeId     String
  itemId      String
  variantId   String?
  quantity    Int      // estoque disponível atual
  minQuantity Int      @default(0)  // alerta de mínimo
  unit        String   @default("un") // un, kg, L, cx

  reservations Reservation[]
  movements    StockMovement[]

  @@unique([storeId, itemId, variantId])
}

model StockMovement {
  id        String      @id
  stockId   String
  type      MovementType
  quantity  Int         // positivo = entrada, negativo = saída
  reason    String?
  orderId   String?
  operatorId String?
  createdAt DateTime    @default(now())
}

enum MovementType {
  PURCHASE    // entrada de fornecedor
  SALE        // saída por venda
  ADJUSTMENT  // ajuste manual
  TRANSFER    // transferência entre lojas
  WASTE       // perda / descarte
  RETURN      // devolução de cliente
}</pre>

  <h2>Dashboard de estoque</h2>
  <div class="mockup-container">
    <div class="mock-topbar"><span class="mock-logo" style="color:#fbbf24">📊 Estoque</span></div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:14px;">
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#d97706">148</div><div class="mock-kpi-sub">Itens ativos</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#ef4444">7</div><div class="mock-kpi-sub">Abaixo do mínimo</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#16a34a">R$24.8k</div><div class="mock-kpi-sub">Valor em estoque</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#6366f1">3</div><div class="mock-kpi-sub">Zerados</div></div>
      </div>
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <thead><tr style="background:#fef9f0;"><th style="padding:8px;text-align:left">Item</th><th>Qtd atual</th><th>Mínimo</th><th>Status</th><th></th></tr></thead>
        <tbody>
          <tr style="border-top:1px solid #e7e5e4;"><td style="padding:8px">Arroz Tio João 5kg <span style="font-size:11px;color:#9ca3af">(market)</span></td><td>45</td><td>10</td><td><span class="mock-badge mock-badge-green">OK</span></td><td><button class="mock-btn mock-btn-outline" style="font-size:11px;padding:3px 8px">Ajustar</button></td></tr>
          <tr style="border-top:1px solid #e7e5e4;"><td style="padding:8px">Queijo Prato (kg) <span style="font-size:11px;color:#9ca3af">(food)</span></td><td>2</td><td>5</td><td><span class="mock-badge mock-badge-red">⚠ Baixo</span></td><td><button class="mock-btn mock-btn-outline" style="font-size:11px;padding:3px 8px">Ajustar</button></td></tr>
          <tr style="border-top:1px solid #e7e5e4;"><td style="padding:8px">Shampoo profissional <span style="font-size:11px;color:#9ca3af">(beauty — consumível)</span></td><td>0</td><td>4</td><td><span class="mock-badge mock-badge-red">❌ Zerado</span></td><td><button class="mock-btn mock-btn-outline" style="font-size:11px;padding:3px 8px">Ajustar</button></td></tr>
        </tbody>
      </table>
    </div>
  </div>
  <p class="mermaid-caption">O modelo InventoryStock é genérico (SKU/variante, unidade un/kg/L). Aplica-se a produtos (food, market) e consumíveis de serviço (beauty, clinic). SERVICE/SLOT/TICKET sem estoque físico não usam este módulo.</p>

  <h2>Projeções de estoque por vertical</h2>
  <div class="alert alert-info">
    <span class="alert-icon">🧩</span>
    <div class="alert-body">
      <div class="alert-title">Dedução por composição — estendido nas verticais</div>
      <p>A base mantém o estoque por item/SKU. As verticais estendem a baixa automática por composição: <strong>Food</strong> deduz insumos por ficha técnica/receita (ver <a href="../wiki-erp-food/index.html#estoque-insumos">Estoque de Insumos</a>); <strong>Beauty/Clinic</strong> deduzem consumíveis ao executar o serviço. <span class="tag-p2">P2</span></p>
    </div>
  </div>
  <pre>// Exemplo Food: relação prato → ingredientes (detalhado no wiki Food)
const xBurguerRecipe = [
  { ingredientId: 'pao_hamburguer', qty: 1, unit: 'un' },
  { ingredientId: 'carne_bovina_150g', qty: 1, unit: 'un' },
  { ingredientId: 'queijo_prato', qty: 30, unit: 'g' }
];</pre>
  <pre>// Relação item → ingredientes
const xBurguerRecipe = [
  { ingredientId: 'pao_hamburguer', qty: 1, unit: 'un' },
  { ingredientId: 'carne_bovina_150g', qty: 1, unit: 'un' },
  { ingredientId: 'queijo_prato', qty: 30, unit: 'g' },
  { ingredientId: 'alface', qty: 20, unit: 'g' }
];</pre>
</div>
`
});
