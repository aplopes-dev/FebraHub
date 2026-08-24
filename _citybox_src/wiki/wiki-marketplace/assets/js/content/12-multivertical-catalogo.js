WIKI.register({
  id: 'multivertical-catalogo',
  title: 'Multi-vertical e Catálogo',
  icon: '🗂️',
  searchText: 'multivertical catalogo CatalogItem polimorfico FOOD RETAIL SERVICE CLINIC BEAUTY FoodItem RetailItem projecao MarketplaceOffer worker unificacao verticais schemas Postgres Varejo Servicos Estetica Saude Clinica taxonomia governanca plataforma',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Plataforma Multi-vertical</div>
    <h1 class="section-title">🗂️ Multi-vertical e Catálogo Unificado</h1>
    <p class="section-subtitle">O Citybox é uma plataforma multi-vertical — <strong>12 verticais previstas</strong> no registro canônico, governadas pela plataforma. O marketplace expõe ao consumidor as verticais de consumo já ativas, unificadas via entidade polimórfica <code>CatalogItem</code> com extensões por vertical (cada schema Postgres tem suas tabelas específicas). Hoje o catálogo modela <strong>5 tipos de item</strong> (FOOD, RETAIL, SERVICE, CLINIC, BEAUTY); as demais verticais entram conforme o roadmap, mapeando para esses tipos ou novas extensões.</p>
    <div class="section-tags">
      <span class="tag-indigo">CatalogItem</span>
      <span class="tag-blue">FoodItem</span>
      <span class="tag-green">RetailItem</span>
      <span class="tag-violet">MarketplaceOffer</span>
    </div>
  </div>

  <div class="eco-callout">
    <div class="eco-icon">🔗</div>
    <div class="eco-body">
      <div class="eco-title">A taxonomia de verticais é definida e governada na plataforma</div>
      <div class="eco-links">
        Os nomes e ícones das verticais seguem o registro canônico do
        <a href="../wiki-erp/wiki-erp/index.html#multi-vertical">ERP · Plataforma Multi-Vertical</a>
        (12 verticais previstas), e são habilitadas/desabilitadas globalmente em
        <a href="../wiki-admin/index.html#configuracoes-plataforma">Admin · Configurações da Plataforma</a>.
        O marketplace expõe ao consumidor as verticais de consumo já ativas.
      </div>
    </div>
  </div>

  <h2>Modelo de catálogo polimórfico</h2>
  <div class="mermaid">
flowchart TD
  CI["CatalogItem\nid, storeId, name, price\ntype: FOOD|RETAIL|SERVICE|CLINIC|BEAUTY\nimageUrl, available"]
  CI -->|"type=FOOD\nschema food"| FI["FoodItem\npreparationTime\nallergens\nnutrition\ncategory (BEVERAGE/MAIN/…)"]
  CI -->|"type=RETAIL\nschema market"| RI["RetailItem\nearanCode, brand\nweight, unit\nshelfLifeDays"]
  CI -->|"type=SERVICE\nschema services"| SI["ServiceItem\ndurationMin\nrequiresScheduling"]
  CI -->|"type=CLINIC\nschema clinic"| CLi["ClinicItem\nspecialty\ncrmRequired"]
  CI -->|"type=BEAUTY\nschema beauty"| BI["BeautyItem\ndurationMin\nprofessionalRequired"]
  </div>

  <h2>Projeção para MarketplaceOffer</h2>
  <div class="mermaid">
flowchart LR
  ERP["ERP\nLojista atualiza catálogo"] -->|"catalog.item.updated"| MQ["RabbitMQ"]
  MQ --> W["Worker :3105"]
  W -->|"upsert"| MO["MarketplaceOffer\n(read model PG)"]
  W -->|"indexa"| TS["Typesense\ncoleção offers"]
  BFF["BFF :3102"] --> MO
  BFF --> TS
  </div>

  <h2>Verticais de consumo modeladas hoje</h2>
  <p>A plataforma prevê <strong>12 verticais</strong> no registro canônico (ver <a href="../wiki-erp/wiki-erp/index.html#multi-vertical">ERP · Plataforma Multi-Vertical</a>). As abaixo são as <strong>verticais de consumo</strong> com extensão de catálogo modelada para o marketplace; verticais como <em>legal, imobiliário, hotelaria, educação, assinaturas, eventos e locação</em> entram no app conforme o roadmap.</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Vertical</th><th>Type</th><th>Schema PG</th><th>Extensão</th><th>Características especiais</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">🍔 Food &amp; Bebidas</td><td>FOOD</td><td>food</td><td>FoodItem</td><td>Modificadores, alérgenos, tempo de preparo, cardápio com seções</td></tr>
        <tr><td class="td-bold">🛒 Varejo</td><td>RETAIL</td><td>market</td><td>RetailItem</td><td>Código EAN, unidade de medida, peso, prazo de validade, lote</td></tr>
        <tr><td class="td-bold">💇 Beauty / Estética</td><td>BEAUTY</td><td>beauty</td><td>BeautyItem</td><td>Duração do serviço, profissional necessário, agendamento</td></tr>
        <tr><td class="td-bold">🏥 Clínica / Saúde</td><td>CLINIC</td><td>clinic</td><td>ClinicItem</td><td>Especialidade, CRM do profissional, agendamento, plano de saúde</td></tr>
        <tr><td class="td-bold">🔧 Serviços</td><td>SERVICE</td><td>services</td><td>ServiceItem</td><td>Duração, requer agendamento, presencial/remoto</td></tr>
      </tbody>
    </table>
  </div>

  <h2>CatalogItem — campos base</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Campo</th><th>Tipo</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">id</td><td>UUID</td><td>ID único</td></tr>
        <tr><td class="td-bold">storeId</td><td>UUID</td><td>Loja dona do item</td></tr>
        <tr><td class="td-bold">type</td><td>enum</td><td>FOOD | RETAIL | SERVICE | CLINIC | BEAUTY</td></tr>
        <tr><td class="td-bold">name</td><td>string</td><td>Nome do produto/serviço</td></tr>
        <tr><td class="td-bold">description</td><td>text</td><td>Descrição longa</td></tr>
        <tr><td class="td-bold">price</td><td>decimal</td><td>Preço de venda</td></tr>
        <tr><td class="td-bold">imageUrl</td><td>string</td><td>URL da imagem principal</td></tr>
        <tr><td class="td-bold">available</td><td>boolean</td><td>Disponível para venda</td></tr>
        <tr><td class="td-bold">categoryId</td><td>UUID</td><td>Categoria dentro da loja</td></tr>
        <tr><td class="td-bold">tags</td><td>string[]</td><td>Tags livres (ex.: "vegano", "promoção")</td></tr>
        <tr><td class="td-bold">publishedAt</td><td>timestamp</td><td>Data de publicação no marketplace</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Diferenças por vertical na UI</h2>
  <div class="card-grid">
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">🍔</span> Food</div>
      <p>Modificadores/adicionais obrigatórios. "Adicionar ao carrinho" → modal de personalização. KDS no ERP.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🛒</span> Varejo</div>
      <p>Preço por unidade ou kg. Filtro de restrição alimentar. On-shelf accuracy crítico.</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">💇</span> Beauty / Clínica</div>
      <p>Não tem "carrinho" tradicional — tem agendamento. Fluxo: selecionar serviço → escolher data/hora → confirmar.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🔧</span> Serviços</div>
      <p>Orçamento ou preço fixo. Pode ser remoto (vídeo). Confirmação bidirecional: consumidor reserva, prestador confirma.</p>
    </div>
  </div>
</div>
`
});
