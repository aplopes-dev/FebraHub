WIKI.register({
  id: 'estoque-insumos',
  title: 'Estoque de Insumos',
  icon: '📦',
  searchText: 'estoque insumos ingredientes materia prima deducao receita compras fornecedor inventario perda desperdicio custo',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Cardápio e Estoque</div>
    <h1 class="section-title">📦 Estoque de Insumos</h1>
    <p class="section-subtitle">Controle de insumos (matérias-primas e embalagens) com dedução automática por receita após o bump no KDS, alertas de estoque mínimo e gestão de compras por fornecedor.</p>
    <div class="section-tags">
      <span class="tag-red">Insumos</span>
      <span class="tag-orange">Dedução · Compras</span>
      <span class="tag-gray">Fornecedores</span>
    </div>
  </div>

  <div class="herda-base-callout">
    <span class="hb-icon">🏪</span>
    <div class="hb-body">
      <div class="hb-title">Herda do ERP Base — Estoque Canônico</div>
      <div class="hb-links">Esta vertical herda <a href="../wiki-erp/index.html#estoque">Estoque</a> (<code>InventoryStock</code>, movimentações, reservas, alertas de mínimo, inventário) e <a href="../wiki-erp/index.html#compras-fornecedores">Compras e Fornecedores</a> (PO, recebimento, ponto de pedido). Esta seção documenta <strong>apenas o delta food</strong>: estoque de insumos/matéria-prima com dedução automática por ficha técnica no bump do KDS e impacto no CMV.</div>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Modelo genérico <code>StockItem</code>/<code>InventoryStock</code> da base no marketplace-api</li>
      <li>Sem vínculo com fichas técnicas, sem dedução automática por receita</li>
      <li>Permissão <code>estoque:manage</code> definida no catálogo food</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Delta Estoque de Insumos Food</div>
    <ul>
      <li>Cadastro de insumos como itens de estoque (matéria-prima e embalagem) com custo unitário</li>
      <li>Dedução automática por receita: ao fazer bump no KDS, deduz os ingredientes da ficha técnica</li>
      <li>Impacto direto no CMV/food cost a cada venda</li>
      <li>Registro de perdas específico food: desperdício, vencimento de perecível, quebra</li>
    </ul>
    <p style="font-size:13px;color:#78716c;font-style:italic;margin-top:6px">Alertas de mínimo, inventário físico, ponto de pedido e cadastro de fornecedor são herdados da base — aqui apenas a dedução por composição/receita é food-específica.</p>
  </div>

  <h2>Mockup — Estoque de Insumos</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">🥩 Estoque de Insumos — Hamburgueria do Zé</span>
      <button class="mock-btn" style="margin-left:auto;background:transparent;border:1px solid rgba(255,255,255,.4);color:#fff;font-size:11px">+ Ajuste manual</button>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px">
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#16a34a">42</div><div class="mock-kpi-sub">Insumos ok</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#ef4444">3</div><div class="mock-kpi-sub">Abaixo do mínimo</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#d97706">5</div><div class="mock-kpi-sub">Perto do mínimo</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#6b7280">R$ 4.840</div><div class="mock-kpi-sub">Valor em estoque</div></div>
      </div>
      <table class="mock-table">
        <thead><tr><th>Insumo</th><th>Estoque atual</th><th>Mínimo</th><th>Unid</th><th>Custo unit.</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td><strong>Carne bovina 180g</strong></td><td>12</td><td>20</td><td>kg</td><td>R$ 29,00</td><td><span class="mock-badge mock-badge-red">⚠ Abaixo</span></td></tr>
          <tr><td>Pão de hambúrguer</td><td>148</td><td>100</td><td>un</td><td>R$ 0,90</td><td><span class="mock-badge mock-badge-green">OK</span></td></tr>
          <tr><td>Queijo cheddar</td><td>2,4</td><td>3</td><td>kg</td><td>R$ 25,00</td><td><span class="mock-badge mock-badge-yellow">Atenção</span></td></tr>
          <tr><td>Batata congelada</td><td>18</td><td>15</td><td>kg</td><td>R$ 8,50</td><td><span class="mock-badge mock-badge-green">OK</span></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <h2>Fluxo de dedução de insumos</h2>
  <div class="mermaid">
sequenceDiagram
  participant KDS
  participant RecipeService
  participant StockService
  participant AlertService
  participant Manager as Gerente (ERP)

  KDS->>RecipeService: bump(itemId, qty=1)
  RecipeService->>RecipeService: busca ficha técnica do item
  loop para cada ingrediente
    RecipeService->>StockService: deduct(ingredientId, qty)
    StockService->>StockService: currentQty -= qty
    alt currentQty < minStock
      StockService->>AlertService: emite alerta de estoque baixo
      AlertService->>Manager: notificação push / WhatsApp
    end
  end
  RecipeService->>KDS: dedução confirmada
  </div>

  <h2>Categorias de insumo</h2>
  <div class="card-grid">
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">🥩</span> Proteínas</div>
      <p>Carnes, frangos, ovos. Alta variação de preço — monitorar custo de compra.</p>
    </div>
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">🌿</span> Vegetais e Hortifrúti</div>
      <p>Alta perecibilidade. Controle de vencimento e perdas frequente.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🧂</span> Secos e Condimentos</div>
      <p>Farinha, açúcar, temperos. Menos perecíveis, compra em maior volume.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">📦</span> Embalagens</div>
      <p>Caixas, sacolas, bandejinhas. Custo muitas vezes ignorado no food cost.</p>
    </div>
  </div>

  <h2>Relatório de perdas</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tipo de Perda</th><th>Como registrar</th><th>Impacto no CMV</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Vencimento</td><td>Lançar manualmente com motivo</td><td>Aumenta CMV real</td></tr>
        <tr><td class="td-bold">Desperdício produção</td><td>Fator de rendimento na ficha técnica</td><td>Embutido no custo da receita</td></tr>
        <tr><td class="td-bold">Quebra/Furto</td><td>Inventário: diferença físico vs teórico</td><td>Divergência de estoque</td></tr>
        <tr><td class="td-bold">Cancelamento de pedido</td><td>Automático na reversão do bump</td><td>Estorno na dedução</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Gestão de fornecedores</h2>
  <pre>{
  "supplier": {
    "id": "uuid",
    "name": "Distribuidora Frigorífico Sul",
    "cnpj": "12.345.678/0001-90",
    "contact": { "phone": "51 9999-9999", "email": "pedidos@frigosul.com" },
    "deliveryDays": [1, 3, 5],
    "leadTimeDays": 1,
    "ingredients": [
      { "ingredientId": "uuid-hamburguer", "unitCost": 4500, "unit": "kg", "minOrderQty": 5 }
    ]
  }
}</pre>
</div>
`
});
