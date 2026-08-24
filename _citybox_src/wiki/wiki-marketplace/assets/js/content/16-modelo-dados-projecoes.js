WIKI.register({
  id: 'modelo-dados-projecoes',
  title: 'Modelo de Dados e Projeções',
  icon: '🗄️',
  searchText: 'modelo dados projecoes read models MarketplaceStore MarketplaceOffer MarketplaceAvailability Order SubOrder OrderItem Cart outbox fonte da verdade CQRS read write schema tenant',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Apps e Arquitetura</div>
    <h1 class="section-title">🗄️ Modelo de Dados e Projeções</h1>
    <p class="section-subtitle">O Marketplace separa <em>fonte da verdade</em> (tabelas transacionais no schema tenant) dos <em>read models</em> (projeções otimizadas para leitura rápida). Read models não substituem a fonte — são derivados via eventos RabbitMQ pelo worker.</p>
    <div class="section-tags">
      <span class="tag-indigo">CQRS lite</span>
      <span class="tag-blue">Read Models</span>
      <span class="tag-violet">Outbox Pattern</span>
    </div>
  </div>

  <h2>Separação: fonte da verdade vs read models</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tabela</th><th>Schema</th><th>Tipo</th><th>Atualizado por</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">CatalogItem</td><td>public</td><td>Fonte (write)</td><td>Core-API / ERP diretamente</td></tr>
        <tr><td class="td-bold">InventoryStock</td><td>food / market</td><td>Fonte (write)</td><td>ERP lojista</td></tr>
        <tr><td class="td-bold">Order</td><td>public</td><td>Fonte (write)</td><td>Core-API checkout orquestrador</td></tr>
        <tr><td class="td-bold">SubOrder</td><td>public</td><td>Fonte (write)</td><td>Core-API checkout</td></tr>
        <tr><td class="td-bold">OrderItem</td><td>public</td><td>Fonte (write)</td><td>Core-API</td></tr>
        <tr><td class="td-bold">Cart / CartItem</td><td>public</td><td>Fonte (write)</td><td>BFF / Core-API</td></tr>
        <tr><td class="td-bold">MarketplaceStore</td><td>public</td><td>Read model</td><td>Worker ← evento store.updated</td></tr>
        <tr><td class="td-bold">MarketplaceOffer</td><td>public</td><td>Read model</td><td>Worker ← evento catalog.item.updated</td></tr>
        <tr><td class="td-bold">MarketplaceAvailability</td><td>public</td><td>Read model</td><td>Worker ← evento inventory.stock.updated</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Read model — MarketplaceOffer</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Campo</th><th>Tipo</th><th>Origem</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">id</td><td>UUID</td><td>CatalogItem.id</td></tr>
        <tr><td class="td-bold">storeId</td><td>UUID</td><td>CatalogItem.storeId</td></tr>
        <tr><td class="td-bold">storeName</td><td>string</td><td>Store.name (desnormalizado)</td></tr>
        <tr><td class="td-bold">name</td><td>string</td><td>CatalogItem.name</td></tr>
        <tr><td class="td-bold">price</td><td>decimal</td><td>CatalogItem.price</td></tr>
        <tr><td class="td-bold">imageUrl</td><td>string</td><td>CatalogItem.imageUrl</td></tr>
        <tr><td class="td-bold">available</td><td>bool</td><td>MarketplaceAvailability.available</td></tr>
        <tr><td class="td-bold">vertical</td><td>enum</td><td>CatalogItem.type</td></tr>
        <tr><td class="td-bold">tags</td><td>string[]</td><td>CatalogItem.tags</td></tr>
        <tr><td class="td-bold">rating</td><td>float</td><td>Agregado de avaliações (futuro)</td></tr>
        <tr><td class="td-bold">updatedAt</td><td>timestamp</td><td>Timestamp da última projeção</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Outbox pattern — consistência eventual</h2>
  <div class="mermaid">
flowchart LR
  CORE["Core API\n(escrita transacional)"] -->|"mesma TX"| OB["Outbox Table\n(evento pendente)"]
  OB -->|"worker de outbox\n(polling)"| MQ["RabbitMQ"]
  MQ --> W["Worker\nprojecao"]
  W --> RM["Read Model\nupdated"]
  </div>

  <p>O outbox garante que o evento seja publicado <strong>na mesma transação</strong> que a escrita — elimina dual write (write DB + publish MQ sem garantia). Se o broker estiver offline, o evento fica no outbox e é re-publicado quando o broker volta.</p>

  <h2>Ordem de Estados — Order</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Status</th><th>Evento que dispara</th><th>Responsável</th></tr></thead>
      <tbody>
        <tr><td><code>PENDING</code></td><td>order.created</td><td>Core-API checkout</td></tr>
        <tr><td><code>CONFIRMED</code></td><td>payment.captured</td><td>Worker payment consumer</td></tr>
        <tr><td><code>PREPARING</code></td><td>suborder.status_changed (ERP)</td><td>Worker ERP event</td></tr>
        <tr><td><code>READY_FOR_PICKUP</code></td><td>suborder.ready</td><td>Worker ERP event</td></tr>
        <tr><td><code>DELIVERING</code></td><td>delivery.started</td><td>Worker entregador</td></tr>
        <tr><td><code>DELIVERED</code></td><td>delivery.completed</td><td>Worker entregador</td></tr>
        <tr><td><code>CANCELLED</code></td><td>order.cancelled</td><td>Core-API rollback C-05 ou loja</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-indigo">
    <span class="alert-icon">💡</span>
    <div class="alert-body">
      <div class="alert-title">Read model ≠ fonte da verdade</div>
      <p>Se houver discrepância entre <code>MarketplaceOffer.available=true</code> e <code>InventoryStock.qty=0</code>, o read model está desatualizado (latência de propagação). O BFF deve ser tolerante a isso — ao iniciar checkout, fazer uma verificação live no core-api antes de reservar. O read model é otimizado para velocidade (P99 &lt;200ms), não para consistência forte.</p>
    </div>
  </div>
</div>
`
});
