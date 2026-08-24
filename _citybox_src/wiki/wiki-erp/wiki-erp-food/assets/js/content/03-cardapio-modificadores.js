WIKI.register({
  id: 'cardapio-modificadores',
  title: 'Cardápio e Modificadores',
  icon: '📋',
  searchText: 'cardapio modificadores categorias combos adicionais variantes preco canal disponibilidade horario foto opcoes grupos ingredientes',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Cardápio e Estoque</div>
    <h1 class="section-title">📋 Cardápio e Modificadores</h1>
    <p class="section-subtitle">Gerenciamento completo do cardápio digital: categorias, itens, grupos de modificadores, combos, precificação por canal e disponibilidade por horário.</p>
    <div class="section-tags">
      <span class="tag-red">Cardápio</span>
      <span class="status-badge status-functional">✅ Funcional</span>
      <span class="tag-gray">food-api · schema food</span>
    </div>
  </div>

  <div class="herda-base-callout">
    <span class="hb-icon">🍔</span>
    <div class="hb-body">
      <div class="hb-title">Catálogo próprio do food-api (não herda mais o CatalogItem da base)</div>
      <div class="hb-links">Diferente do blueprint inicial, o food <strong>não</strong> usa o <code>CatalogItem</code> polimórfico do marketplace. O <code>food-api</code> implementa seu <strong>próprio domínio</strong> no schema <code>food</code>: <code>ProductCategory</code>, <code>ProductItem</code>, <code>ModifierGroup</code>, <code>KitchenStation</code> (catálogo) e <code>Menu</code>/<code>MenuSection</code>/<code>MenuEntry</code> (cardápios). Os mockups e exemplos abaixo descrevem a experiência alvo; o que já está em produção está resumido no bloco "Hoje".</div>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (real — backend + UI ERP)</div>
    <ul>
      <li><strong>Gestão de Itens</strong> (<code>/food/cardapio/gestao-itens</code>): CRUD de itens e categorias, filtros (status, estação, faixa de preço, busca com debounce), upload de imagem (MinIO), operações em lote — consome <code>/v1/items</code>, <code>/v1/categories</code> via React Query</li>
      <li><strong>Cardápios</strong> (<code>/food/cardapio/meus-cardapios</code>): listar/criar/editar/duplicar menus; editor de seções e entradas; aba de configuração (canais marketplace/digital/PDV, agenda, branding) e aba de preview — consome <code>/v1/menus*</code></li>
      <li><code>ProductItem</code>: preço em cents, status <code>active/paused/sold_out</code>, highlights (<code>best_seller/new/promotion</code>), estação de cozinha, tempo de preparo</li>
      <li><code>MenuEntry</code>: overrides de nome, descrição, preço e disponibilidade por entrada do cardápio</li>
      <li><code>ModifierGroup</code> e <code>KitchenStation</code>: leitura (associação a itens já modelada; UI de edição dedicada ainda não)</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Deltas ainda não implementados</div>
    <ul>
      <li>Combos: vincular itens com desconto, exibir como oferta especial</li>
      <li>Preço por canal diferenciado (salão / delivery próprio / iFood / Rappi)</li>
      <li>Janelas de disponibilidade por horário no nível do item (café/almoço/jantar)</li>
      <li>CRUD completo de grupos de modificadores e opções (min/max, obrigatório/opcional, preço adicional)</li>
      <li>Sincronização de status esgotado/pausado com hubs externos de delivery</li>
    </ul>
  </div>

  <h2>Modelo de dados — extensão food sobre CatalogItem</h2>
  <p>O cardápio <strong>não</strong> define um modelo paralelo. Reutiliza o <code>CatalogItem</code>, <code>Category</code>, <code>ItemVariant</code> e <code>ModifierGroup/ModifierOption</code> canônicos da base (ver <a href="../wiki-erp/index.html#catalogo">Catálogo</a>). O food adiciona apenas a extensão 1:1 <code>FoodItem</code> e a entidade <code>Combo</code>.</p>
  <div class="mermaid">
erDiagram
  CatalogItem {
    uuid id PK
    string type "FOOD"
    string name
    decimal basePrice
    uuid categoryId FK
    json channelPrices "base"
  }
  FoodItem {
    uuid catalogItemId PK_FK
    decimal calories
    int prepTimeMin
    json availabilityWindows
    boolean outOfStock
  }
  Combo {
    uuid id PK
    string name
    decimal comboPrice
    decimal originalPrice
  }

  CatalogItem ||--|| FoodItem : "estende (1:1)"
  CatalogItem ||--o{ ModifierGroup : "herda da base"
  Combo }o--o{ CatalogItem : "agrupa itens"
  </div>
  <div class="alert alert-info">
    <span class="alert-icon">🧩</span>
    <div class="alert-body">
      <div class="alert-title">Categorias, variantes, modificadores e preço por canal vêm da base</div>
      <p><code>Category</code>, <code>ItemVariant</code>, <code>ModifierGroup</code>/<code>ModifierOption</code> e <code>channelPrices</code> são definidos no <a href="../wiki-erp/index.html#catalogo">Catálogo base</a>. As tabelas abaixo apenas ilustram <strong>como o food usa</strong> esses mecanismos.</p>
    </div>
  </div>

  <h2>Modificadores — exemplos de uso food (mecanismo da base)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Item</th><th>Grupo</th><th>Tipo</th><th>Min/Max</th><th>Opções</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">X-Burguer</td><td>Ponto da carne</td><td>Obrigatório</td><td>1/1</td><td>Ao ponto · Bem passado · Mal passado</td></tr>
        <tr><td class="td-bold">X-Burguer</td><td>Adicionais</td><td>Opcional</td><td>0/5</td><td>Bacon +R$3 · Ovo +R$2 · Cheddar +R$2 · Picles +R$1</td></tr>
        <tr><td class="td-bold">Pizza</td><td>Massa</td><td>Obrigatório</td><td>1/1</td><td>Fina · Tradicional · Grossa</td></tr>
        <tr><td class="td-bold">Pizza</td><td>Borda</td><td>Opcional</td><td>0/1</td><td>Catupiry +R$5 · Cream Cheese +R$5 · Sem borda</td></tr>
        <tr><td class="td-bold">Açaí</td><td>Acompanhamentos</td><td>Opcional</td><td>0/4</td><td>Granola · Banana · Leite Ninho · Morango</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Delta food — canais de venda no preço por canal</h2>
  <p>O mecanismo <code>channelPrices</code> é da base. O food adiciona os canais específicos de alimentação (salão e hubs de delivery), que podem ter preços distintos por causa da comissão de marketplace:</p>
  <pre>{
  "channelPrices": {
    "dine_in": 2490,         // salão (delta food)
    "delivery_own": 2790,    // delivery próprio
    "ifood": 2990,           // hub iFood (delta food)
    "rappi": 2990,           // hub Rappi (delta food)
    "marketplace_citybox": 2690
  }
}</pre>

  <h2>Disponibilidade por janela de horário</h2>
  <pre>{
  "availability_windows": [
    { "days": [1,2,3,4,5], "from": "07:00", "to": "11:00", "label": "Café da manhã" },
    { "days": [0,6],        "from": "07:00", "to": "14:00", "label": "Brunch" },
    { "days": [1,2,3,4,5,6,0], "from": "11:00", "to": "23:00", "label": "Almoço e Jantar" }
  ]
}</pre>

  <h2>Mockup — Tela de cardápio no ERP</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">📋 Cardápio — Hamburgueria do Zé</span>
    </div>
    <div class="mock-body">
      <div style="display:flex;gap:12px;margin-bottom:12px;">
        <div class="mock-btn mock-btn-primary">+ Novo item</div>
        <div class="mock-btn mock-btn-outline">📂 Nova categoria</div>
        <div style="margin-left:auto;font-size:13px;color:#6b7280;">32 itens · 6 categorias</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
        <div style="background:#fff;border:1px solid #fca5a5;border-radius:8px;padding:12px;">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;">🍔 X-Burguer</div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">Hambúrguer artesanal 180g</div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:800;color:#e11d48;">R$ 24,90</span>
            <span class="mock-badge mock-badge-green">Ativo</span>
          </div>
        </div>
        <div style="background:#fff;border:1px solid #fca5a5;border-radius:8px;padding:12px;">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;">🍕 Pizza Margherita</div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">Molho, mussarela, manjericão</div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:800;color:#e11d48;">R$ 42,00</span>
            <span class="mock-badge mock-badge-yellow">Esgotado</span>
          </div>
        </div>
        <div style="background:#fff;border:1px solid #fca5a5;border-radius:8px;padding:12px;">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;">🥤 Combo Duplo</div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">X-Burguer + Batata + Refri</div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:800;color:#e11d48;">R$ 38,90</span>
            <span class="mock-badge mock-badge-green">Ativo</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <h2>Sincronização com o hub de delivery</h2>
  <div class="alert alert-orange">
    <span class="alert-icon">🔄</span>
    <div class="alert-body">
      <div class="alert-title">Cardápio único → múltiplos canais</div>
      <p>Ao salvar um item no ERP Food, o sistema deve propagar automaticamente para: marketplace Citybox (Typesense), iFood (via API parceiro), Rappi (webhook). Pausar/esgotar um item deve refletir em todos os canais em menos de 60 segundos.</p>
    </div>
  </div>
</div>
`
});
