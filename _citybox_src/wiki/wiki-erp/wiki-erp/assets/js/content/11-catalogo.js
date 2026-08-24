WIKI.register({
  id: 'catalogo',
  title: 'Catálogo',
  icon: '📦',
  searchText: 'catalogo produtos itens categoria modificadores variantes precos publicacao CatalogItem polimórfico',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Catálogo e Operação</div>
    <h1 class="section-title">📦 Catálogo</h1>
    <p class="section-subtitle">Gestão do catálogo de produtos, serviços e itens da loja — entidade CatalogItem polimórfica, categorias, modificadores, variantes e publicação no marketplace.</p>
    <div class="section-tags">
      <span class="tag-orange">Catálogo</span>
      <span class="tag-amber">CatalogItem</span>
      <span class="tag-gray">Polimórfico · Multi-canal</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>API <code>marketplace-api</code>: CRUD de CatalogItem e categorias funcional</li>
      <li>ERP: tela de listagem em mock — sem CRUD completo na UI</li>
      <li>Modificadores existem no schema mas UI não gerencia</li>
      <li>Publicação no Typesense via worker após criação/edição</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>CRUD completo: criar, editar, duplicar, arquivar produtos na UI</li>
      <li>Variantes: tamanhos, cores, sabores — preço e estoque por variante</li>
      <li>Modificadores visuais: grupos de adicionais drag-and-drop</li>
      <li>Preços por canal: delivery, balcão, mesa, marketplace (preços distintos)</li>
      <li>Importação em massa: CSV/XLSX para centenas de produtos</li>
      <li>Galeria de imagens com crop e compressão automática</li>
      <li>Disponibilidade por horário: item disponível apenas no almoço</li>
    </ul>
  </div>

  <h2>Mockup — Catálogo (CatalogItem polimórfico)</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">📦 Catálogo — CatalogItem (multi-vertical)</span>
      <button class="mock-btn" style="margin-left:auto;background:transparent;border:1px solid rgba(255,255,255,.4);color:#fff;font-size:11px">+ Novo item</button>
    </div>
    <div class="mock-body">
      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        <button class="mock-btn mock-btn-primary" style="font-size:11px">Todos (124)</button>
        <button class="mock-btn mock-btn-outline" style="font-size:11px">PRODUCT (98)</button>
        <button class="mock-btn mock-btn-outline" style="font-size:11px">SERVICE (18)</button>
        <button class="mock-btn mock-btn-outline" style="font-size:11px">SLOT (6)</button>
        <button class="mock-btn mock-btn-outline" style="font-size:11px">TICKET (2)</button>
        <input class="mock-input" style="margin-left:auto;min-width:160px" placeholder="🔍 Buscar item…">
      </div>
      <table class="mock-table">
        <thead><tr><th>Item</th><th>Categoria</th><th>Preço base</th><th>Tipo</th><th>Status</th><th>Ação</th></tr></thead>
        <tbody>
          <tr>
            <td><strong>X-Burguer Classic</strong><br><span style="font-size:11px;color:#9ca3af">Food · 3 variantes</span></td>
            <td>Hambúrgueres</td><td>R$ 25,90</td>
            <td><span class="mock-badge mock-badge-blue">PRODUCT</span></td>
            <td><span class="mock-badge mock-badge-green">Publicado</span></td>
            <td><button class="mock-btn mock-btn-outline" style="font-size:10px;padding:4px 8px">Editar</button></td>
          </tr>
          <tr>
            <td><strong>Arroz Tio João 5kg</strong><br><span style="font-size:11px;color:#9ca3af">Market · EAN 789…</span></td>
            <td>Grãos</td><td>R$ 24,90</td>
            <td><span class="mock-badge mock-badge-blue">PRODUCT</span></td>
            <td><span class="mock-badge mock-badge-green">Publicado</span></td>
            <td><button class="mock-btn mock-btn-outline" style="font-size:10px;padding:4px 8px">Editar</button></td>
          </tr>
          <tr>
            <td><strong>Corte + Escova</strong><br><span style="font-size:11px;color:#9ca3af">Beauty · 60min</span></td>
            <td>Cabelo</td><td>R$ 85,00</td>
            <td><span class="mock-badge mock-badge-amber">SERVICE</span></td>
            <td><span class="mock-badge mock-badge-green">Publicado</span></td>
            <td><button class="mock-btn mock-btn-outline" style="font-size:10px;padding:4px 8px">Editar</button></td>
          </tr>
          <tr>
            <td><strong>Suíte Standard — 1 noite</strong><br><span style="font-size:11px;color:#9ca3af">Hospitality</span></td>
            <td>Quartos</td><td>R$ 320,00</td>
            <td><span class="mock-badge mock-badge-gray">SLOT</span></td>
            <td><span class="mock-badge mock-badge-yellow">Rascunho</span></td>
            <td><button class="mock-btn mock-btn-primary" style="font-size:10px;padding:4px 8px">Publicar</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <p class="mermaid-caption">O catálogo base é o hub canônico: o mesmo CRUD gerencia PRODUCT (food/market), SERVICE (beauty/clinic), SLOT (hospitality/rental) e TICKET (events). Cada vertical estende com seus campos específicos (FoodItem, RetailItem, etc.).</p>

  <h2>Modelo CatalogItem (polimórfico)</h2>
  <pre>// Prisma — marketplace-api
model CatalogItem {
  id          String        @id @default(cuid())
  storeId     String
  type        ItemType      // PRODUCT | SERVICE | SLOT | TICKET
  name        String
  description String?
  imageUrl    String?
  categoryId  String?
  basePrice   Decimal
  isActive    Boolean       @default(true)
  isPublished Boolean       @default(false)

  // Relações
  variants    ItemVariant[]
  modifiers   ModifierGroup[]
  channelPrices ChannelPrice[]
  stockItems  InventoryStock[]

  @@index([storeId, isPublished])
}

enum ItemType {
  PRODUCT   // produto físico (varejo, food)
  SERVICE   // serviço com execução (beauty, clinic)
  SLOT      // horário de atendimento (agenda)
  TICKET    // ingresso (events)
}</pre>

  <h2>Exemplos por tipo de item (multi-vertical)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>ItemType</th><th>Vertical</th><th>Exemplo de item</th><th>Categorias típicas</th></tr></thead>
      <tbody>
        <tr><td><code>PRODUCT</code></td><td>Food</td><td>X-Burguer Classic (R$25,90)</td><td>Hambúrgueres / Bebidas / Sobremesas</td></tr>
        <tr><td><code>PRODUCT</code></td><td>Market</td><td>Arroz Tio João 5kg (R$18,90)</td><td>Grãos / Laticínios / Higiene</td></tr>
        <tr><td><code>SERVICE</code></td><td>Beauty</td><td>Corte + Escova (R$85, 60min)</td><td>Cabelo / Unhas / Estética</td></tr>
        <tr><td><code>SERVICE</code></td><td>Clinic</td><td>Consulta Dermatológica (R$250, 30min)</td><td>Consultas / Exames / Procedimentos</td></tr>
        <tr><td><code>SERVICE</code></td><td>Services</td><td>Dedetização Apartamento (R$180)</td><td>Limpeza / Manutenção / Elétrica</td></tr>
        <tr><td><code>SLOT</code></td><td>Hospitality</td><td>Suíte Standard — 1 noite (R$320)</td><td>Quartos / Chalés / Salas de Evento</td></tr>
        <tr><td><code>SLOT</code></td><td>Rental</td><td>Gol 1.0 — diária (R$85)</td><td>Compactos / SUVs / Utilitários</td></tr>
        <tr><td><code>TICKET</code></td><td>Events</td><td>Show João Gomes — Pista (R$120)</td><td>Shows / Workshops / Conferências</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Estrutura de categorias (exemplo Food)</h2>
  <div class="mermaid">
flowchart LR
  Store["🏪 Loja — Food"]
  Cat1["📂 Hambúrgueres"]
  Cat2["📂 Bebidas"]
  Cat3["📂 Sobremesas"]
  Sub1["📂 Alcoólicas"]
  Sub2["📂 Não-alcoólicas"]
  Item1["🍔 X-Burguer Classic"]
  Item2["🍔 X-Bacon Duplo"]
  Item3["🥤 Refrigerante Lata"]
  Item4["🍺 Cerveja Heineken"]

  Store --> Cat1 --> Item1
  Cat1 --> Item2
  Store --> Cat2 --> Sub1 --> Item4
  Cat2 --> Sub2 --> Item3
  Store --> Cat3
  </div>
  <p style="font-size:13px;color:#78716c;font-style:italic">Exemplo Food. Para Beauty, categorias seriam: Cabelo / Unhas / Sobrancelha / Massagem. Para Market: Hortifrúti / Carnes / Bebidas / Limpeza.</p>

  <h2>Modificadores (Grupos de Adicionais / Opções)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Campo</th><th>Tipo</th><th>Exemplo Food</th><th>Exemplo Beauty</th></tr></thead>
      <tbody>
        <tr><td>name</td><td>string</td><td>"Ponto da carne"</td><td>"Acabamento"</td></tr>
        <tr><td>required</td><td>boolean</td><td>Sim (para seleção obrigatória)</td><td>Não (opcional)</td></tr>
        <tr><td>minSelect</td><td>int</td><td>1</td><td>0</td></tr>
        <tr><td>maxSelect</td><td>int</td><td>1 (radio)</td><td>3 (multi)</td></tr>
        <tr><td>options[].name</td><td>string</td><td>"Queijo extra"</td><td>"Hidratação"</td></tr>
        <tr><td>options[].additionalPrice</td><td>Decimal</td><td>+R$2,00</td><td>+R$15,00</td></tr>
        <tr><td>options[].stockRef</td><td>string?</td><td>Vincula ao estoque de insumo</td><td>Produto consumido no serviço</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Preços por canal</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Canal</th><th>Código</th><th>Uso</th></tr></thead>
      <tbody>
        <tr><td>Delivery App</td><td><code>DELIVERY</code></td><td>App do consumidor, marketplace</td></tr>
        <tr><td>Mesa / Salão</td><td><code>DINE_IN</code></td><td>QR code na mesa, comanda</td></tr>
        <tr><td>Balcão / PDV</td><td><code>COUNTER</code></td><td>Venda presencial com atendente</td></tr>
        <tr><td>Retirada</td><td><code>PICKUP</code></td><td>Pedido online, retirada na loja</td></tr>
        <tr><td>Marketplace</td><td><code>MARKETPLACE</code></td><td>Vitrine pública Citybox</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Fluxo de publicação de item</h2>
  <div class="mermaid">
sequenceDiagram
  participant Manager as Gerente (ERP)
  participant API as marketplace-api
  participant Worker as typesense-worker
  participant TS as Typesense

  Manager->>API: POST /catalog (isPublished: true)
  API->>API: Valida dados + permissão
  API->>DB: INSERT CatalogItem
  API->>MQ: emit('catalog.item.published')
  MQ->>Worker: catalog.item.published event
  Worker->>TS: PUT /collections/catalog/documents
  TS-->>Worker: 200 indexed
  Worker->>API: Atualiza indexedAt
  API-->>Manager: 201 Created
  </div>
</div>
`
});
