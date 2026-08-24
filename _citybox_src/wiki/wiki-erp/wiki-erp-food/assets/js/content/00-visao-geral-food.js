WIKI.register({
  id: 'visao-geral-food',
  title: 'Visão Geral — Vertical Food',
  icon: '🍔',
  searchText: 'visao geral food alimentacao restaurante lanchonete dark kitchen vertical citybox estado atual funcional planejado',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Introdução</div>
    <h1 class="section-title">🍔 Visão Geral — Vertical Food</h1>
    <p class="section-subtitle">A vertical Food cobre restaurantes, lanchonetes, dark kitchens, cafeterias e estabelecimentos de alimentação. Este wiki é um <strong>deep-dive food-específico</strong> — referencia o <a href="../wiki-erp/index.html">ERP Base</a> para shell, autenticação, equipe e módulos comuns.</p>
    <div class="section-tags">
      <span class="tag-red">Vertical Food</span>
      <span class="tag-orange">NestJS :3171</span>
      <span class="tag-gray">food-api + marketplace-api</span>
    </div>
  </div>

  <div class="alert alert-orange">
    <span class="alert-icon">📍</span>
    <div class="alert-body">
      <div class="alert-title">Blueprint: Hoje (MVP) → Proposta (Alvo)</div>
      <p>Blocos "Hoje" mostram o que o código realmente implementa. Blocos "Proposta" definem o estado alvo a ser desenvolvido. Use o <a href="#como-aprovar-food">widget de aprovação</a> para registrar feedback em cada seção.</p>
    </div>
  </div>

  <div class="alert alert-info">
    <span class="alert-icon">🧭</span>
    <div class="alert-body">
      <div class="alert-title">Veja o mapa detalhado de status do código</div>
      <p>Para a visão arquivo-a-arquivo do que é real, mockado ou vazio (backend + frontend), consulte a seção <a href="#estado-implementacao-food">🧭 Estado de Implementação</a>.</p>
    </div>
  </div>

  <h2>O que a vertical entrega hoje</h2>
  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (real) — Catálogo + Cardápios ponta a ponta</div>
    <ul>
      <li><strong>food-api</strong> reescrito em <strong>Clean Architecture</strong> em <code>apps/verticals/food/api</code>, porta <code>3171</code>, schema Postgres <code>food</code> próprio</li>
      <li><strong>Catálogo (real):</strong> categorias, itens (preço em cents, status ativo/pausado/esgotado, highlights, imagem em MinIO), modificadores e estações de cozinha (read), operações em lote</li>
      <li><strong>Cardápios (real):</strong> menus com canais (marketplace/digital/PDV), agenda por dia/período, branding; seções e entradas com overrides de nome/preço; duplicar e reordenar</li>
      <li><strong>Auth:</strong> <code>AuthGuard</code> + <code>PermissionGuard</code> (Keycloak JWT), permissão <code>store.catalog.manage</code>, <code>@StoreId</code>; Swagger em <code>/api/v1/docs</code></li>
      <li><strong>Frontend ERP (real):</strong> telas de Cardápios e Gestão de Itens consomem o food-api via React Query + proxy <code>/api/proxy/food/[...path]</code> (header <code>X-Store-Id</code>)</li>
      <li><strong>Frontend ERP (UI mockada):</strong> Pedidos, PDV, Configurações/Horários/Entrega, Equipe e Integrações têm UI completa em <code>sessionStorage</code>, aguardando backend</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Domínio restaurateur completo</div>
    <ul>
      <li>Cardápio rico: categorias, modificadores, combos, variantes, preço por canal</li>
      <li>Fichas técnicas: receitas, custo de insumo, CMV automatizado</li>
      <li>Salão operacional: mapa de mesas, comandas, QR code, split, course firing</li>
      <li>KDS: roteamento por estação, timers, bump, expo screen</li>
      <li>PDV food offline-first com sessão de caixa</li>
      <li>Pedidos multicanal em tempo real (mesa, balcão, delivery, marketplace)</li>
      <li>Delivery próprio + hub iFood / Rappi com sincronização bidirecional de cardápio</li>
      <li>Fiscal NFC-e + NF-e via PlugNotas, contingência SAT/MFE</li>
      <li>Estoque de insumos com dedução por receita</li>
      <li>Analytics food: menu engineering, food cost %, attachment rate, table turn</li>
    </ul>
  </div>

  <h2>Maturidade por módulo</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Módulo</th><th>Estado atual</th><th>Meta v1</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Cardápio + modificadores</td><td><span class="status-badge status-functional">✅ Funcional</span></td><td>Backend + UI ERP completos</td></tr>
        <tr><td class="td-bold">Gestão de Itens (catálogo)</td><td><span class="status-badge status-functional">✅ Funcional</span></td><td>Backend + UI ERP completos</td></tr>
        <tr><td class="td-bold">Pedidos multicanal</td><td><span class="status-badge status-mock">⚠ UI mockada</span></td><td>Backend orders + realtime</td></tr>
        <tr><td class="td-bold">PDV food</td><td><span class="status-badge status-mock">⚠ UI mockada</span></td><td>Backend caixa + offline-first</td></tr>
        <tr><td class="td-bold">Configurações / Horários / Entrega</td><td><span class="status-badge status-mock">⚠ UI mockada</span></td><td>Backend store-settings</td></tr>
        <tr><td class="td-bold">Equipe + RBAC food</td><td><span class="status-badge status-mock">⚠ UI mockada</span></td><td>Backend team + roles food</td></tr>
        <tr><td class="td-bold">Integrações (iFood/Rappi/pgto)</td><td><span class="status-badge status-mock">⚠ UI mockada</span></td><td>Hub + webhooks</td></tr>
        <tr><td class="td-bold">Dashboard / Início</td><td><span class="status-badge status-partial">🔶 Placeholder</span></td><td>KPIs e métricas reais</td></tr>
        <tr><td class="td-bold">KDS · Comandas / Mesas</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>Domínio operacional salão/cozinha</td></tr>
        <tr><td class="td-bold">Fichas técnicas / CMV</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>Receitas + dedução de insumo</td></tr>
        <tr><td class="td-bold">Fiscal NFC-e</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>PlugNotas + contingência</td></tr>
        <tr><td class="td-bold">Estoque de insumos</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>Dedução por receita</td></tr>
        <tr><td class="td-bold">Analytics / Menu Engineering</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>Food cost, attachment rate</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Arquitetura food-api</h2>
  <div class="mermaid">
flowchart TB
  ERP["apps/erp :3107\nNext.js 16 (shell)"]
  BFF["BFF proxy\n/api/proxy/food/[...path]"]
  FoodAPI["food-api :3171\nNestJS"]
  MktAPI["marketplace-api :3101\nNestJS (core)"]
  KC["Keycloak\n(SSO + RBAC)"]
  DB[("Postgres\nschema: food")]
  PlatDB[("Postgres\nschema: platform")]
  MinIO["MinIO\n(logos)"]
  TS["Typesense\n(catálogo)"]
  MQ["RabbitMQ\n(outbox)"]

  ERP -->|"JWT cookie + X-Store-Id"| BFF --> FoodAPI
  ERP -->|"JWT cookie"| MktAPI
  FoodAPI -->|"catálogo + cardápios (schema food)"| DB
  FoodAPI -->|"valida JWT/permissões"| KC
  FoodAPI -->|"imagens de item"| MinIO
  MktAPI -->|"pedidos, checkout, frete"| DB
  MktAPI -->|"outbox events"| MQ
  MQ -->|"indexação"| TS
  </div>

  <h2>Onde este wiki se encaixa</h2>
  <div class="card-grid">
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">🍔</span> Este wiki (Food)</div>
      <p>KDS, cardápio com modificadores, fichas técnicas, salão/mesas/comandas, PDV food, delivery/iFood, fiscal NFC-e, CMV, analytics food.</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">🏪</span> Wiki ERP Base</div>
      <p>Shell, autenticação, seleção de loja, RBAC genérico, catálogo base, pedidos genéricos, checkout, estoque SKU, financeiro, realtime.</p>
    </div>
  </div>

  <h2>Matriz: Base + Food = ERP Food Completo</h2>
  <div class="sinergia-matrix">
    <div class="sm-header"><span class="sm-mod">Módulo</span><span class="sm-base">🏪 ERP Base fornece</span><span class="sm-vertical">🍔 Food adiciona (delta)</span></div>
    <div class="sm-row"><span class="sm-mod">Catálogo</span><span class="sm-base">CatalogItem polimórfico, categorias, modificadores, variantes, preço por canal</span><span class="sm-vertical">Cardápio food, combos, disponibilidade por horário, fichas técnicas</span></div>
    <div class="sm-row"><span class="sm-mod">Pedidos</span><span class="sm-base">Order + SubOrder, kanban genérico, multicanal</span><span class="sm-vertical">Kanban food (cozinha/salão), course firing, KDS, comanda</span></div>
    <div class="sm-row"><span class="sm-mod">PDV</span><span class="sm-base">PDV base + sessão de caixa</span><span class="sm-vertical">PDV food offline-first, comanda de mesa, QR code</span></div>
    <div class="sm-row"><span class="sm-mod">Estoque</span><span class="sm-base">InventoryStock por SKU, ajustes, inventário</span><span class="sm-vertical">Estoque de insumos, dedução por receita/ficha técnica, ponto de pedido</span></div>
    <div class="sm-row"><span class="sm-mod">Financeiro</span><span class="sm-base">Contas a Pagar, Contas a Receber, Fluxo de Caixa, Conciliação, DRE</span><span class="sm-vertical">CMV / Food Cost %, DRE food com custo de insumos</span></div>
    <div class="sm-row"><span class="sm-mod">Fiscal</span><span class="sm-base">NF-e / NFC-e / NFS-e via PlugNotas, configuração fiscal</span><span class="sm-vertical">Contingência SAT/MFE específica food, NFC-e por comanda</span></div>
    <div class="sm-row"><span class="sm-mod">Compras</span><span class="sm-base">PO genérico, cotação, recebimento, AP automático</span><span class="sm-vertical">Recebimento de insumos perecíveis, lote/validade, explosão de compra via ficha técnica</span></div>
    <div class="sm-row"><span class="sm-mod">Fidelidade</span><span class="sm-base">Programa de pontos/cashback, tiers, clube</span><span class="sm-vertical">Clube do café/assinatura, pontos por frequência, cashback delivery noturno</span></div>
    <div class="sm-row"><span class="sm-mod">CRM</span><span class="sm-base">Perfil de cliente, histórico de pedidos, preferências, segmentação</span><span class="sm-vertical">Preferências food (alergias, dieta), recomendações por prato</span></div>
    <div class="sm-row"><span class="sm-mod">RBAC / Equipe</span><span class="sm-base">StoreRole genérico, convite Keycloak, permissões efetivas</span><span class="sm-vertical">Roles food: garçom, cozinheiro, gerente KDS, caixa food</span></div>
    <div class="sm-row"><span class="sm-mod">Analytics</span><span class="sm-base">Relatórios base: vendas, ticket médio, funil</span><span class="sm-vertical">Menu engineering, food cost %, attachment rate, table turn, ABC cardápio</span></div>
    <div class="sm-row"><span class="sm-mod">Delivery</span><span class="sm-base">ShippingRule, cálculo de frete genérico</span><span class="sm-vertical">Hub iFood/Rappi, sincronização bidirecional de cardápio, tempo estimado</span></div>
    <div class="sm-row"><span class="sm-mod">Realtime</span><span class="sm-base">WebSocket pub/sub por storeId</span><span class="sm-vertical">KDS push, bumps, course alerts, timer de prato</span></div>
  </div>
</div>
`
});
