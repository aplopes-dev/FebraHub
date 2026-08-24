WIKI.register({
  id: 'marketplace-food',
  title: 'Presença no Marketplace',
  icon: '🏪',
  searchText: 'marketplace citybox publicacao loja food cardapio disponibilidade horarios taxa entrega raio busca typesense indexacao',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Clientes e Marketplace</div>
    <h1 class="section-title">🏪 Presença no Marketplace Food</h1>
    <p class="section-subtitle">Como a loja de alimentação aparece no marketplace Citybox: configuração do perfil, publicação do cardápio, horários, taxas de entrega e sincronização em tempo real com o Typesense.</p>
    <div class="section-tags">
      <span class="tag-red">Marketplace</span>
      <span class="tag-orange">Typesense</span>
      <span class="tag-gray">Publicação · Sync</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Publicação genérica: <code>CatalogItem</code> indexado no Typesense via outbox RabbitMQ</li>
      <li><code>FoodItem</code> com campo adicional <code>calories</code></li>
      <li>Sem perfil food especializado: sem banner, sem tempo de entrega, sem avaliações no marketplace</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Perfil Food no Marketplace</div>
    <ul>
      <li>Perfil da loja food: foto de capa, logo, descrição, categorias de culinária</li>
      <li>Publicação do cardápio completo com fotos, modificadores e descrições</li>
      <li>Horários de funcionamento e pausa temporária (feriados, manutenção)</li>
      <li>Zona de entrega: polígono ou raio, taxa por zona, tempo estimado</li>
      <li>Pedido mínimo por canal</li>
      <li>Avaliações: estrelas + comentário, resposta do lojista</li>
      <li>Destaque: banner patrocinado, badge "novo", "top avaliado"</li>
      <li>Sync automático: pausar/esgotar item no ERP reflete em &lt;30s no marketplace</li>
    </ul>
  </div>

  <h2>Documento Typesense — loja food</h2>
  <pre>{
  "id": "store-uuid",
  "type": "store",
  "vertical": "food",
  "name": "Hamburgueria do Zé",
  "description": "Os melhores hambúrgueres artesanais da cidade",
  "cuisineTypes": ["hamburguer", "americana", "lanches"],
  "logoUrl": "https://minio/logos/store-uuid.jpg",
  "coverUrl": "https://minio/covers/store-uuid.jpg",
  "rating": 4.8,
  "reviewCount": 312,
  "deliveryFeeMin": 499,
  "deliveryTimeMin": 25,
  "deliveryTimeMax": 40,
  "minOrder": 2000,
  "isOpen": true,
  "openNow": true,
  "badges": ["top_avaliado", "entrega_rapida"],
  "location": { "lat": -23.5505, "lng": -46.6333 },
  "municipalityId": "uuid-municipio"
}</pre>

  <h2>Documento Typesense — item food</h2>
  <pre>{
  "id": "item-uuid",
  "storeId": "store-uuid",
  "vertical": "food",
  "type": "FOOD",
  "name": "X-Burguer Duplo",
  "description": "Dois hambúrgueres de 180g, queijo, bacon, alface e tomate",
  "price": 3490,
  "priceFormatted": "R$ 34,90",
  "imageUrl": "https://minio/items/item-uuid.jpg",
  "categories": ["lanches", "hamburguer"],
  "calories": 750,
  "available": true,
  "outOfStock": false,
  "tags": ["mais_pedido", "destaque"],
  "hasModifiers": true
}</pre>

  <h2>Lógica de abertura e fechamento automático</h2>
  <div class="mermaid">
flowchart LR
  Cron["Cron job\n(a cada minuto)"]
  Settings["StoreSettings\n(businessHours)"]
  Check{{"Horário\nfunciona?"}}
  OpenStore["Abre loja\n(isOpen=true)"]
  CloseStore["Fecha loja\n(isOpen=false)"]
  Typesense["Atualiza Typesense\n(isOpen field)"]
  HubDelivery["Atualiza Hub iFood/Rappi"]

  Cron --> Settings --> Check
  Check -->|"sim"| OpenStore --> Typesense
  Check -->|"não"| CloseStore --> Typesense
  Typesense --> HubDelivery
  </div>

  <h2>Avaliações e reputação</h2>
  <div class="card-grid">
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">⭐</span> Coleta automática</div>
      <p>30 min após a entrega: push/WhatsApp solicitando avaliação de 1-5 estrelas e comentário.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">💬</span> Resposta do lojista</div>
      <p>Gerente pode responder avaliações negativos diretamente no ERP, visível no marketplace.</p>
    </div>
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">📊</span> Score de reputação</div>
      <p>Média ponderada (últimas 90 dias pesam mais). Badge "top avaliado" acima de 4.7 com 50+ avaliações.</p>
    </div>
  </div>
</div>
`
});
