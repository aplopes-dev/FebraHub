WIKI.register({
  id: 'visao-geral-market',
  title: 'Visão Geral — Vertical Market',
  icon: '🛒',
  searchText: 'visao geral market varejo supermercado mercado conveniencia retail vertical citybox estado atual scaffold naming',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Introdução</div>
    <h1 class="section-title">🛒 Visão Geral — Vertical Market</h1>
    <p class="section-subtitle">A vertical Market cobre supermercados, mercearias, farmácias, lojas de conveniência e qualquer varejo com gestão por SKU, código de barras e controle de validade. Este wiki é um <strong>deep-dive market-específico</strong> — referencia o <a href="../wiki-erp/index.html">ERP Base</a> para shell, autenticação e módulos comuns.</p>
    <div class="section-tags">
      <span class="tag-green">Vertical Market</span>
      <span class="tag-emerald">API :3181</span>
      <span class="tag-gray">RetailItem + marketplace-api</span>
    </div>
  </div>

  <div class="alert alert-orange">
    <span class="alert-icon">⚠️</span>
    <div class="alert-body">
      <div class="alert-title">Atenção: inconsistência de naming market vs varejo</div>
      <p>A vertical usa identificadores diferentes em cada camada. <strong>Gestão / docs / Prisma / Keycloak</strong>: <code>market</code> · <strong>ERP rotas / manifest</strong>: <code>varejo</code> (rota <code>/varejo</code>, permissão <code>vertical.varejo.view</code>) · <strong>Store entity</strong>: <code>Varejo</code>. Ao implementar, padronizar para <code>market</code> (alinhado ao Prisma e Keycloak).</p>
    </div>
  </div>

  <h2>O que a vertical entrega hoje</h2>
  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (Scaffold) — Estado muito inicial</div>
    <ul>
      <li><strong>Core genérico:</strong> <code>CatalogItem</code> tipo <code>RETAIL</code> + <code>RetailItem{sku}</code> no schema <code>market</code> — criação via marketplace-api</li>
      <li><strong>Estoque:</strong> <code>InventoryStock{storeId, sku, quantity, reserved}</code> no schema <code>public</code> — endpoints <code>POST /inventory/stock</code> e <code>POST /inventory/reserve</code></li>
      <li><strong>ERP:</strong> shell <code>apps/erp/src/app/varejo/</code> com dashboard mínimo, ~30 rotas no menu mas todas placeholder</li>
      <li><strong>Papéis platform:</strong> <code>gerente</code>, <code>caixa</code>, <code>estoquista</code>, <code>vendedor</code> em <code>store-role.catalog.ts</code></li>
      <li><strong>API vertical:</strong> stub legado em <code>verticals/market/app/api/</code> sem fonte TS — apenas artefatos de build e log de health test</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Varejo Completo</div>
    <ul>
      <li>Catálogo rico: EAN/GTIN, variantes, NCM/CST/CEST, embalagem e unidade de venda</li>
      <li>Integração com balança (Toledo/Ramuza): pesagem direta, etiqueta de granel, PLU</li>
      <li>PDV alta performance offline: leitura de código de barras, checkout em &lt;5s, SAT/MFE</li>
      <li>Controle de validade/lotes com FEFO e rebaixa automática de preço</li>
      <li>Recebimento de mercadorias via XML NF-e de entrada</li>
      <li>Precificação com margem, promoções progressivas e etiquetas de gôndola</li>
      <li>Fiscal NFC-e, SPED e CBS/IBS (Reforma Tributária)</li>
      <li>CRM / clube de desconto e marketplace Citybox</li>
    </ul>
  </div>

  <h2>Maturidade por módulo</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Módulo</th><th>Estado atual</th><th>Meta v1</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">RetailItem + InventoryStock</td><td><span class="status-badge status-functional">✅ Funcional</span></td><td>Estender com EAN, variantes, NCM</td></tr>
        <tr><td class="td-bold">API vertical market</td><td><span class="status-badge status-mock">⚠ Stub sem fonte</span></td><td>Criar apps/verticals/market/api</td></tr>
        <tr><td class="td-bold">ERP shell /varejo</td><td><span class="status-badge status-partial">🔶 Shell + nav</span></td><td>~30 rotas com páginas reais</td></tr>
        <tr><td class="td-bold">Catálogo EAN/GTIN</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>Lookup por barcode + foto produto</td></tr>
        <tr><td class="td-bold">Balança / Granel</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>Integração Toledo/Ramuza</td></tr>
        <tr><td class="td-bold">PDV frente de caixa</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>Offline-first, NFC-e, SAT</td></tr>
        <tr><td class="td-bold">Validade / Lotes / FEFO</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>Controle FEFO + rebaixa</td></tr>
        <tr><td class="td-bold">Recebimento NF-e entrada</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>Import XML, conferência cega</td></tr>
        <tr><td class="td-bold">Fiscal NFC-e / SPED</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>PlugNotas + CBS/IBS ready</td></tr>
        <tr><td class="td-bold">RBAC equipe</td><td><span class="status-badge status-partial">🔶 Papéis catalogados</span></td><td>API vertical + catálogo permissões</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Arquitetura market</h2>
  <div class="mermaid">
flowchart TB
  ERP["apps/erp :3107\nNext.js 16 (shell /varejo)"]
  BFF["BFF proxy\n/api/proxy/market/ (a criar)"]
  MarketAPI["market-api :3181\nNestJS (a criar)"]
  MktAPI["marketplace-api :3101\nNestJS (core)"]
  KC["Keycloak (SSO)"]
  DB[("Postgres\nschema: market")]
  PubDB[("Postgres\nschema: public\n(InventoryStock)")]
  MinIO["MinIO (logos/fotos)"]
  TS["Typesense (catálogo)"]
  MQ["RabbitMQ (outbox)"]

  ERP -->|"JWT cookie"| BFF --> MarketAPI
  ERP -->|"JWT cookie"| MktAPI
  MarketAPI -->|"settings, RBAC, equipe"| DB
  MarketAPI -->|"convite"| KC
  MarketAPI -->|"logo"| MinIO
  MktAPI -->|"catálogo RETAIL, estoque"| PubDB
  MktAPI -->|"outbox"| MQ --> TS
  </div>

  <h2>Onde este wiki se encaixa</h2>
  <div class="card-grid">
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🛒</span> Este wiki (Market)</div>
      <p>EAN/GTIN, balança/granel, PDV varejo, validade/FEFO, recebimento NF-e, precificação, fiscal CBS/IBS, CRM clube, analytics varejo.</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">🏪</span> Wiki ERP Base</div>
      <p>Shell, autenticação, seleção de loja, RBAC genérico, catálogo base, estoque SKU genérico, financeiro, realtime, marketplace genérico.</p>
    </div>
  </div>

  <h2>Matriz: Base + Market = ERP Market Completo</h2>
  <div class="sinergia-matrix">
    <div class="sm-header"><span class="sm-mod">Módulo</span><span class="sm-base">🏪 ERP Base fornece</span><span class="sm-vertical">🛒 Market adiciona (delta)</span></div>
    <div class="sm-row"><span class="sm-mod">Catálogo</span><span class="sm-base">CatalogItem polimórfico, categorias, variantes, preço por canal</span><span class="sm-vertical">EAN/GTIN, NCM/CEST, lookup por barcode, foto produto automática, embalagem</span></div>
    <div class="sm-row"><span class="sm-mod">PDV</span><span class="sm-base">PDV base + sessão de caixa</span><span class="sm-vertical">PDV varejo offline-first, leitura código de barras &lt;5s, integração balança, SAT/MFE</span></div>
    <div class="sm-row"><span class="sm-mod">Estoque</span><span class="sm-base">InventoryStock por SKU, ajustes manuais</span><span class="sm-vertical">Controle de lotes + validade, FEFO, rebaixa automática de preço, recebimento por XML NF-e</span></div>
    <div class="sm-row"><span class="sm-mod">Balança</span><span class="sm-base">—</span><span class="sm-vertical">Integração Toledo/Ramuza, pesagem direta, etiqueta granel, PLU</span></div>
    <div class="sm-row"><span class="sm-mod">Financeiro</span><span class="sm-base">Contas a Pagar, Contas a Receber, Fluxo de Caixa, Conciliação, DRE</span><span class="sm-vertical">DRE varejo com margem por categoria, fechamento PDV, análise giro de estoque</span></div>
    <div class="sm-row"><span class="sm-mod">Fiscal</span><span class="sm-base">NF-e / NFC-e via PlugNotas, configuração fiscal</span><span class="sm-vertical">SPED-Fiscal, CBS/IBS (Reforma Tributária), DANFE de entrada, CEST obrigatório</span></div>
    <div class="sm-row"><span class="sm-mod">Compras</span><span class="sm-base">PO genérico, cotação, recebimento, AP automático</span><span class="sm-vertical">Recebimento com conferência FEFO, leitor de código de barras, DANFE de entrada</span></div>
    <div class="sm-row"><span class="sm-mod">Precificação</span><span class="sm-base">Preço base por canal</span><span class="sm-vertical">Precificação por margem, promoções progressivas, etiqueta de gôndola, rebaixa automática</span></div>
    <div class="sm-row"><span class="sm-mod">Fidelidade</span><span class="sm-base">Programa de pontos/cashback, tiers, clube</span><span class="sm-vertical">Cashback em produtos selecionados (parceria fornecedor), clube de hortifruti</span></div>
    <div class="sm-row"><span class="sm-mod">CRM</span><span class="sm-base">Perfil de cliente, histórico, segmentação</span><span class="sm-vertical">Histórico por família de produto, sugestão de reposição, régua de cobrança</span></div>
    <div class="sm-row"><span class="sm-mod">RBAC / Equipe</span><span class="sm-base">StoreRole genérico, convite Keycloak</span><span class="sm-vertical">Roles market: gerente, caixa, estoquista, conferente, vendedor</span></div>
    <div class="sm-row"><span class="sm-mod">Analytics</span><span class="sm-base">Relatórios base: vendas, ticket médio, funil</span><span class="sm-vertical">Margem por categoria, giro de estoque, ABC de SKUs, análise de perdas/validade</span></div>
  </div>
</div>
`
});
