WIKI.register({
  id: 'mapa-mental',
  title: 'Mapa Mental do Domínio',
  icon: '🗺️',
  searchText: 'mapa mental dominio modelo entidades store catalog order stock payment fiscal employee device',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Introdução</div>
    <h1 class="section-title">🗺️ Mapa Mental do Domínio</h1>
    <p class="section-subtitle">Visão agregada de todas as entidades e relacionamentos que compõem o domínio comum a todas as verticais do ERP Citybox.</p>
    <div class="section-tags">
      <span class="tag-orange">Domínio</span>
      <span class="tag-amber">Entidades</span>
      <span class="tag-gray">Comum a todas as verticais</span>
    </div>
  </div>

  <h2>Diagrama de domínio comum</h2>
  <div class="mermaid">
flowchart TB
  subgraph Platform ["🏛️ Plataforma (schema: platform)"]
    Mun[Municipality]
    Org[Organization]
    Store[Store]
    Mun --> Org --> Store
  end

  subgraph Identity ["🔐 Identidade (Keycloak)"]
    KC_User[KC User]
    StoreUser[StoreUser / Role]
  end

  subgraph Catalog ["📦 Catálogo (marketplace-api)"]
    Cat[CatalogItem]
    Cat_Cat[Category]
    Modifier[ModifierGroup]
    Price[Price / Variant]
    Cat_Cat --> Cat
    Cat --> Modifier
    Cat --> Price
  end

  subgraph Commerce ["🛒 Comércio"]
    Cart[Cart]
    Order[Order]
    OrderItem[OrderItem]
    SubOrder[SubOrder]
    Order --> OrderItem --> SubOrder
    Cart --> Order
  end

  subgraph Stock ["📊 Estoque"]
    InvStock[InventoryStock]
    Reservation[Reservation]
    InvStock --> Reservation
  end

  subgraph Finance ["💰 Financeiro"]
    Payment[Payment]
    Split[PaymentSplit]
    CashClose[CashClose]
    Invoice[FiscalDoc / NF-e]
    Payment --> Split
    Payment --> Invoice
    CashClose --> Payment
  end

  subgraph Delivery ["🚚 Entrega"]
    ShipRule[ShippingRule]
    DelivArea[DeliveryArea]
    ShipRule --> DelivArea
  end

  subgraph Devices ["📱 Devices"]
    Device[Device]
    KDS[KDS]
    Printer[Printer]
  end

  Store --> StoreUser --> KC_User
  Store --> Cat
  Store --> Order
  Order --> InvStock
  Order --> Payment
  Order --> ShipRule
  Order --> Device
  </div>

  <h2>Hierarquia de tenancy</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Nível</th><th>Entidade</th><th>Schema DB</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td>1</td><td class="td-bold">Platform</td><td><code>platform</code></td><td>Operadora (Citybox) — tem municípios</td></tr>
        <tr><td>2</td><td class="td-bold">Municipality</td><td><code>platform</code></td><td>Prefeitura / cidade — escopo geográfico</td></tr>
        <tr><td>3</td><td class="td-bold">Organization</td><td><code>platform</code></td><td>Empresa / CNPJ — agrupa lojas</td></tr>
        <tr><td>4</td><td class="td-bold">Store</td><td><code>tenant_{mun}</code></td><td>Ponto de venda — unidade operacional</td></tr>
        <tr><td>5</td><td class="td-bold">StoreUser</td><td><code>tenant_{mun}</code></td><td>Funcionário / membro com papel na loja</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Agregados principais</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">📦</span> CatalogItem</div>
      <p>Entidade polimórfica que representa produto, prato, serviço, slot ou ingresso. Tem categorias, variantes, modificadores e preços por canal.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🛒</span> Order</div>
      <p>Raiz do agregado de comércio. Contém OrderItems, SubOrders (multi-loja), status, canal de origem (PDV/app/marketplace), métodos de pagamento e fiscal.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">📊</span> InventoryStock</div>
      <p>Posição de estoque por item por loja. Gerencia reservas otimistas (PENDING), consumo (COMMITTED) e liberação (RELEASED) no ciclo do pedido.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">💰</span> Payment</div>
      <p>Transação financeira com multi-PSP, split de repasse entre loja/plataforma, status de liquidação e vínculo com documento fiscal.</p>
    </div>
    <div class="card card-purple">
      <div class="card-title"><span class="card-icon">🚚</span> ShippingRule</div>
      <p>Regra de frete por loja: RADIUS (raio em km), NEIGHBORHOOD (bairros) ou TABLE (faixas de CEP). Determina taxa, prazo e disponibilidade.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">👥</span> StoreUser + Role</div>
      <p>Membro da equipe vinculado à loja com papel RBAC (owner, manager, cashier, attendant, etc). Sincronizado com Keycloak por platform-sync.</p>
    </div>
  </div>

  <h2>Ciclo de vida de um pedido (fluxo universal)</h2>
  <div class="mermaid">
stateDiagram-v2
  [*] --> CART: cliente/operador adiciona itens
  CART --> PENDING: checkout / PDV confirm
  PENDING --> CONFIRMED: payment autorizado
  CONFIRMED --> IN_PREPARATION: aceito pela loja
  IN_PREPARATION --> READY: produção concluída
  READY --> DISPATCHED: saiu para entrega
  READY --> DELIVERED: retirada no balcão
  DISPATCHED --> DELIVERED: entregue
  DELIVERED --> CLOSED: fiscal emitido + caixa fechado
  CONFIRMED --> CANCELLED: loja recusa ou timeout
  PENDING --> CANCELLED: pagamento negado
  CLOSED --> [*]
  CANCELLED --> [*]
  </div>

  <h2>Eventos de domínio (bus RabbitMQ)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Evento</th><th>Produtor</th><th>Consumidores</th></tr></thead>
      <tbody>
        <tr><td><code>order.created</code></td><td>marketplace-api</td><td>KDS, notificações, fiscal-worker</td></tr>
        <tr><td><code>order.status_changed</code></td><td>marketplace-api</td><td>ERP realtime, marketplace-web, delivery</td></tr>
        <tr><td><code>payment.confirmed</code></td><td>payment-api</td><td>order-worker, fiscal-worker, settlement</td></tr>
        <tr><td><code>catalog.updated</code></td><td>marketplace-api</td><td>typesense-indexer, ERP cache</td></tr>
        <tr><td><code>stock.reserved</code></td><td>marketplace-api</td><td>ERP estoque, alertas</td></tr>
        <tr><td><code>user.synced</code></td><td>vertical-api</td><td>Keycloak adapter, permission-cache</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
