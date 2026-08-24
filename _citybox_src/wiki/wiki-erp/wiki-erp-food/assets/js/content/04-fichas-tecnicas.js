WIKI.register({
  id: 'fichas-tecnicas',
  title: 'Fichas Técnicas e CMV',
  icon: '🧾',
  searchText: 'ficha tecnica receita insumo ingrediente custo cmv food cost deducao estoque materia prima margem',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Cardápio e Estoque</div>
    <h1 class="section-title">🧾 Fichas Técnicas e CMV</h1>
    <p class="section-subtitle">Receitas vinculadas ao cardápio que automatizam a dedução de insumos do estoque e calculam o Custo de Mercadoria Vendida (CMV) em tempo real — base do controle financeiro de um restaurante.</p>
    <div class="section-tags">
      <span class="tag-red">Fichas Técnicas</span>
      <span class="tag-orange">CMV · Food Cost</span>
      <span class="tag-gray">Dedução de Insumos</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Sem suporte a fichas técnicas ou receitas no código atual</li>
      <li>Estoque: apenas modelo genérico <code>StockItem{sku, quantity, unit}</code> do marketplace-api</li>
      <li>Nenhuma vinculação entre <code>MenuItem</code> e insumos</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Fichas Técnicas Completas</div>
    <ul>
      <li>Ficha técnica vinculada ao item do cardápio (1:1 ou 1:N para variantes)</li>
      <li>Ingredientes com quantidade, unidade de medida e insumo do estoque</li>
      <li>Custo calculado automaticamente: soma custo unitário × quantidade de cada ingrediente</li>
      <li>Preço de venda sugerido por margem alvo (ex.: CMV target 30%)</li>
      <li>Ao vender: deduz automaticamente os insumos do estoque (trigger pós-bump no KDS)</li>
      <li>Histórico de variação de custo (insumo ficou mais caro → alerta)</li>
    </ul>
  </div>

  <h2>Mockup — Fichas Técnicas</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">📋 Fichas Técnicas — X-Burguer Classic</span>
      <span style="margin-left:auto;font-size:11px;opacity:.8">Food Cost: 28% · Margem: 72%</span>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px">
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#e11d48">R$ 7,26</div><div class="mock-kpi-sub">Custo insumos</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#16a34a">R$ 25,90</div><div class="mock-kpi-sub">Preço de venda</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#d97706">28%</div><div class="mock-kpi-sub">Food Cost %</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#6366f1">72%</div><div class="mock-kpi-sub">Margem bruta</div></div>
      </div>
      <table class="mock-table">
        <thead><tr><th>Insumo</th><th>Qtd</th><th>Unid</th><th>Custo unit.</th><th>Subtotal</th></tr></thead>
        <tbody>
          <tr><td>Pão de hambúrguer</td><td>1</td><td>un</td><td>R$ 0,90</td><td>R$ 0,90</td></tr>
          <tr><td>Carne 180g</td><td>180</td><td>g</td><td>R$ 0,029/g</td><td>R$ 5,22</td></tr>
          <tr><td>Queijo cheddar</td><td>30</td><td>g</td><td>R$ 0,025/g</td><td>R$ 0,75</td></tr>
          <tr><td>Alface + tomate</td><td>1</td><td>porção</td><td>R$ 0,30</td><td>R$ 0,30</td></tr>
          <tr><td>Embalagem</td><td>1</td><td>un</td><td>R$ 0,09</td><td>R$ 0,09</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <h2>Modelo de dados — Ficha Técnica</h2>
  <div class="mermaid">
erDiagram
  MenuItem {
    uuid id PK
    string name
    decimal price
  }
  Recipe {
    uuid id PK
    uuid menuItemId FK
    string variantKey
    decimal yieldQty
    string yieldUnit
    decimal laborCost
    decimal otherCost
    decimal totalCost
    decimal cmvPercent
  }
  RecipeIngredient {
    uuid id PK
    uuid recipeId FK
    uuid ingredientId FK
    decimal quantity
    string unit
    decimal unitCost
    decimal totalCost
  }
  Ingredient {
    uuid id PK
    string name
    string unit
    decimal currentCost
    decimal stockQty
    string supplier
  }

  MenuItem ||--o{ Recipe : "has"
  Recipe ||--o{ RecipeIngredient : "contains"
  RecipeIngredient }o--|| Ingredient : "uses"
  </div>

  <h2>Exemplo — Ficha técnica do X-Burguer</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Ingrediente</th><th>Quantidade</th><th>Unidade</th><th>Custo unitário</th><th>Custo total</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Pão brioche</td><td>1</td><td>un</td><td>R$ 1,80</td><td>R$ 1,80</td></tr>
        <tr><td class="td-bold">Hambúrguer 180g</td><td>180</td><td>g</td><td>R$ 0,045/g</td><td>R$ 8,10</td></tr>
        <tr><td class="td-bold">Queijo cheddar</td><td>30</td><td>g</td><td>R$ 0,060/g</td><td>R$ 1,80</td></tr>
        <tr><td class="td-bold">Alface americana</td><td>20</td><td>g</td><td>R$ 0,012/g</td><td>R$ 0,24</td></tr>
        <tr><td class="td-bold">Tomate fatiado</td><td>30</td><td>g</td><td>R$ 0,008/g</td><td>R$ 0,24</td></tr>
        <tr><td class="td-bold">Maionese especial</td><td>15</td><td>ml</td><td>R$ 0,020/ml</td><td>R$ 0,30</td></tr>
        <tr><td class="td-bold">Embalagem + guardanapo</td><td>1</td><td>un</td><td>R$ 0,45</td><td>R$ 0,45</td></tr>
        <tr style="background:#fff7f7;"><td colspan="4" style="font-weight:800;text-align:right;">CMV Total</td><td style="font-weight:800;color:#e11d48;">R$ 12,93</td></tr>
        <tr style="background:#f0fdf4;"><td colspan="4" style="font-weight:800;text-align:right;">Preço de venda</td><td style="font-weight:800;color:#16a34a;">R$ 24,90</td></tr>
        <tr style="background:#f0fdf4;"><td colspan="4" style="font-weight:800;text-align:right;">Food Cost %</td><td style="font-weight:800;color:#16a34a;">51,9% → Meta: &lt;35%</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-red">
    <span class="alert-icon">⚠️</span>
    <div class="alert-body">
      <div class="alert-title">Food Cost acima da meta</div>
      <p>O ERP deve alertar quando o food cost de um item ultrapassar o threshold configurado pela loja (padrão: 35%). Isso pode significar que o preço de venda precisa ser ajustado ou o custo de insumo aumentou.</p>
    </div>
  </div>

  <h2>Dedução automática de insumos</h2>
  <div class="mermaid">
sequenceDiagram
  participant KDS
  participant FoodAPI
  participant StockService
  participant AlertService

  KDS->>FoodAPI: bump(orderId, itemId)
  FoodAPI->>FoodAPI: busca ficha técnica do item
  FoodAPI->>StockService: deductIngredients(recipe.ingredients)
  StockService->>StockService: verifica estoque disponível
  alt Estoque OK
    StockService->>FoodAPI: dedução confirmada
  else Estoque Baixo
    StockService->>AlertService: alerta → webhook + notificação ERP
  end
  </div>

  <h2>Alertas e acompanhamento</h2>
  <div class="card-grid">
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">🚨</span> Food Cost alto</div>
      <p>Item com CMV acima do threshold configurado. Sugestão: revisar preço ou renegociar fornecedor.</p>
    </div>
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">📈</span> Custo de insumo subiu</div>
      <p>Preço de compra de um ingrediente aumentou. Recalcula todos os itens vinculados e alerta o gerente.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">📊</span> Ranking de rentabilidade</div>
      <p>Itens ordenados por margem (preço - CMV). Base para o menu engineering.</p>
    </div>
  </div>
</div>
`
});
