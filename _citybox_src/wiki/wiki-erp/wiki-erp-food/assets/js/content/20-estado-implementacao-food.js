WIKI.register({
  id: 'estado-implementacao-food',
  title: 'Estado de Implementação',
  icon: '🧭',
  searchText: 'estado implementacao status codigo real mockado vazio backend frontend food-api erp catalog menu clean architecture endpoints proxy react query sessionstorage o que falta',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Introdução</div>
    <h1 class="section-title">🧭 Estado de Implementação</h1>
    <p class="section-subtitle">Mapa honesto do código <strong>hoje</strong> (jun/2026): o que persiste em backend real, o que é UI mockada em <code>sessionStorage</code>, o que é placeholder vazio e o que ainda não existe. Esta seção reflete o estado dos diretórios <code>apps/verticals/food/api</code> (backend) e <code>apps/erp/src/features/food</code> (frontend).</p>
    <div class="section-tags">
      <span class="tag-red">Status do código</span>
      <span class="tag-orange">Backend + Frontend</span>
      <span class="tag-gray">jun/2026</span>
    </div>
  </div>

  <div class="alert alert-orange">
    <span class="alert-icon">🔄</span>
    <div class="alert-body">
      <div class="alert-title">Mudança arquitetural importante desde o blueprint inicial</div>
      <p>O <code>food-api</code> foi <strong>reescrito do zero em Clean Architecture</strong> (espelhando <code>platform/api</code>), com <strong>schema Postgres <code>food</code> próprio</strong>. Hoje ele entrega dois domínios reais e independentes: <strong>Catálogo</strong> (categorias, itens, modificadores, estações) e <strong>Cardápios</strong> (menus, seções, entradas). Os módulos antigos de <em>settings de loja, RBAC próprio, equipe e salon-zones</em> descritos no blueprint original <strong>não fazem mais parte do food-api</strong> — autenticação e permissões continuam via guards Keycloak (<code>AuthGuard</code>, <code>PermissionGuard</code>, <code>@StoreId</code>).</p>
    </div>
  </div>

  <h2>Legenda de status</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Badge</th><th>Significado</th></tr></thead>
      <tbody>
        <tr><td><span class="status-badge status-functional">✅ Real</span></td><td>Implementado e persistindo em backend (Postgres/MinIO) — pronto para uso</td></tr>
        <tr><td><span class="status-badge status-mock">⚠ Mockado</span></td><td>UI completa e funcional, mas dados em <code>sessionStorage</code>/estado local — <strong>sem backend</strong></td></tr>
        <tr><td><span class="status-badge status-partial">🔶 Placeholder</span></td><td>Tela existe como casca/landing, sem funcionalidade real</td></tr>
        <tr><td><span class="status-badge status-proposed">💡 Vazio</span></td><td>Diretório/rota reservado, sem implementação</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Backend — food-api <code>:3171</code> (Clean Architecture)</h2>
  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 O que o food-api implementa hoje</div>
    <ul>
      <li><strong>Módulo Catalog</strong> — <code>ProductCategory</code>, <code>ProductItem</code> (preço em cents, status active/paused/sold_out, highlights, imagem MinIO), <code>ModifierGroup</code> (read), <code>KitchenStation</code> (read). CRUD completo + bulk status/delete + upload/get/delete de imagem.</li>
      <li><strong>Módulo Menu</strong> — <code>Menu</code> (canais marketplace/digital/pdv, schedule por weekday + períodos, branding, comportamento digital), <code>MenuSection</code>, <code>MenuEntry</code> (overrides de nome/preço/disponibilidade). CRUD + status + config + duplicate + reorder de seções e entradas.</li>
      <li><strong>Persistência real</strong> — Prisma 7 + adapter PostgreSQL, schema isolado <code>food</code>; imagens em MinIO (bucket <code>citybox-food</code>).</li>
      <li><strong>Auth & RBAC</strong> — <code>AuthGuard</code> + <code>PermissionGuard</code> (Keycloak JWT), permissão <code>store.catalog.manage</code>, <code>@StoreId</code> extraído do contexto. Health checks públicos + Swagger em <code>/api/v1/docs</code>.</li>
    </ul>
  </div>

  <h3>Endpoints REST implementados (✅ todos reais)</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Recurso</th><th>Endpoints</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Categorias</td><td><code>GET·POST /v1/categories</code> · <code>PUT·DELETE /v1/categories/:id</code></td><td><span class="status-badge status-functional">✅ Real</span></td></tr>
        <tr><td class="td-bold">Itens</td><td><code>GET·POST /v1/items</code> · <code>GET·PUT·DELETE /v1/items/:id</code> · <code>POST /v1/items/bulk/status</code> · <code>POST /v1/items/bulk/delete</code></td><td><span class="status-badge status-functional">✅ Real</span></td></tr>
        <tr><td class="td-bold">Imagens de item</td><td><code>POST·GET·DELETE /v1/items/:id/image</code> (MinIO)</td><td><span class="status-badge status-functional">✅ Real</span></td></tr>
        <tr><td class="td-bold">Modificadores</td><td><code>GET /v1/modifier-groups</code> (read-only)</td><td><span class="status-badge status-functional">✅ Real</span></td></tr>
        <tr><td class="td-bold">Estações de cozinha</td><td><code>GET /v1/kitchen-stations</code> (read-only)</td><td><span class="status-badge status-functional">✅ Real</span></td></tr>
        <tr><td class="td-bold">Cardápios</td><td><code>GET·POST /v1/menus</code> · <code>GET·PUT·DELETE /v1/menus/:id</code> · <code>PATCH /v1/menus/:id/status</code> · <code>PUT /v1/menus/:id/config</code> · <code>POST /v1/menus/:id/duplicate</code></td><td><span class="status-badge status-functional">✅ Real</span></td></tr>
        <tr><td class="td-bold">Seções de cardápio</td><td><code>POST /v1/menus/:menuId/sections</code> · <code>PUT/DELETE .../sections/:id</code> · <code>PUT .../sections/reorder</code></td><td><span class="status-badge status-functional">✅ Real</span></td></tr>
        <tr><td class="td-bold">Entradas de cardápio</td><td><code>POST /v1/menus/:menuId/entries</code> · <code>PUT/DELETE .../entries/:id</code> · <code>PUT .../entries/reorder</code></td><td><span class="status-badge status-functional">✅ Real</span></td></tr>
      </tbody>
    </table>
  </div>

  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Ainda não existe no backend food-api</div>
    <ul>
      <li>Pedidos / Orders, checkout, sessão de caixa</li>
      <li>Settings de loja, horários de funcionamento, zonas de entrega</li>
      <li>Gestão de equipe / roles food próprios</li>
      <li>Integrações externas (iFood, Rappi, pagamento), KDS, comandas/mesas</li>
      <li>Fiscal NFC-e, estoque de insumos, fichas técnicas/CMV, analytics</li>
    </ul>
  </div>

  <h2>Frontend — ERP <code>apps/erp/src/features/food</code></h2>
  <p>O ERP (Next.js 16) consome o food-api pelo proxy store-scoped <code>/api/proxy/food/[...path]</code> (injeta JWT + header <code>X-Store-Id</code>), usando <strong>React Query</strong>. Os módulos sem backend usam hooks locais com <code>sessionStorage</code>.</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Módulo / Tela</th><th>Status</th><th>Origem dos dados</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Cardápios (meus-cardápios, detalhe, editor, config, preview)</td><td><span class="status-badge status-functional">✅ Real</span></td><td>food-api <code>/v1/menus*</code> via React Query</td></tr>
        <tr><td class="td-bold">Gestão de Itens (catálogo, categorias, filtros, upload imagem)</td><td><span class="status-badge status-functional">✅ Real</span></td><td>food-api <code>/v1/items</code>, <code>/v1/categories</code>, <code>/v1/modifier-groups</code>, <code>/v1/kitchen-stations</code></td></tr>
        <tr><td class="td-bold">Gestão de Pedidos (kanban, abas por status, detalhe)</td><td><span class="status-badge status-mock">⚠ Mockado</span></td><td><code>sessionStorage</code> · <code>// TODO: WebSocket</code></td></tr>
        <tr><td class="td-bold">PDV / Frente-de-caixa (grid, carrinho, modificadores, pagamento)</td><td><span class="status-badge status-mock">⚠ Mockado</span></td><td>estado local + <code>MOCK_PRODUCT_ITEMS</code></td></tr>
        <tr><td class="td-bold">Configurações da loja (geral, endereço, fiscal)</td><td><span class="status-badge status-mock">⚠ Mockado</span></td><td><code>sessionStorage</code></td></tr>
        <tr><td class="td-bold">Horários de funcionamento (semana, exceções, regras)</td><td><span class="status-badge status-mock">⚠ Mockado</span></td><td><code>sessionStorage</code></td></tr>
        <tr><td class="td-bold">Entrega (zonas, taxas, regras)</td><td><span class="status-badge status-mock">⚠ Mockado</span></td><td><code>sessionStorage</code></td></tr>
        <tr><td class="td-bold">Equipe (membros, papéis, convite)</td><td><span class="status-badge status-mock">⚠ Mockado</span></td><td><code>sessionStorage</code></td></tr>
        <tr><td class="td-bold">Integrações (iFood, WhatsApp, Mercado Pago)</td><td><span class="status-badge status-mock">⚠ Mockado</span></td><td>catálogo real + config em <code>sessionStorage</code></td></tr>
        <tr><td class="td-bold">Dashboard (início)</td><td><span class="status-badge status-partial">🔶 Placeholder</span></td><td>landing com contexto da loja, sem KPIs</td></tr>
        <tr><td class="td-bold">Operações: Comandas</td><td><span class="status-badge status-proposed">💡 Vazio</span></td><td>—</td></tr>
        <tr><td class="td-bold">Operações: KDS</td><td><span class="status-badge status-proposed">💡 Vazio</span></td><td>—</td></tr>
      </tbody>
    </table>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Infraestrutura de frontend já pronta (✅)</div>
    <ul>
      <li>Shell da vertical (<code>app/food/_shell.tsx</code>): providers (definição/branding/permissões), guards de auth e roteamento por vertical/loja</li>
      <li>Separação <strong>backoffice</strong> × <strong>operations</strong> (PDV) com layouts e guards próprios (<code>isPdvPath</code>)</li>
      <li>Navegação completa (<code>shared/lib/navigation.ts</code>): 5 módulos, ~17 folhas mapeadas, manifesto da vertical</li>
      <li>Cliente HTTP tipado (<code>shared/api/food-client.ts</code>): <code>foodFetch</code> + <code>foodUpload</code> com <code>X-Store-Id</code> e <code>FoodApiError</code></li>
      <li>Modo dev-preview (loja fictícia) para desenvolver telas sem loja real selecionada</li>
    </ul>
  </div>

  <h2>O que falta para "ligar" cada módulo mockado</h2>
  <div class="alert alert-blue">
    <span class="alert-icon">🔌</span>
    <div class="alert-body">
      <div class="alert-title">Padrão de migração mock → real</div>
      <p>Cada módulo mockado já tem UI completa e um hook de estado isolado (ex.: <code>use-order-management-state.ts</code>, <code>use-team-members.ts</code>). Para ligá-los basta: <strong>1)</strong> criar o módulo correspondente no food-api (controller + use cases + repo Prisma), <strong>2)</strong> criar o <code>*.service.ts</code> no ERP usando <code>foodFetch</code>, <strong>3)</strong> trocar o hook <code>sessionStorage</code> por hooks React Query — exatamente como já foi feito em Cardápios e Gestão de Itens.</p>
    </div>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Módulo</th><th>Backend a criar</th><th>Prioridade sugerida</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Pedidos + PDV</td><td>Módulo <code>orders</code> + <code>cash-register</code> no food-api, eventos realtime (WebSocket)</td><td><span class="tag-p1">P1</span></td></tr>
        <tr><td class="td-bold">Configurações / Horários / Entrega</td><td>Módulo <code>store-settings</code> no food-api (settings, business hours, delivery zones)</td><td><span class="tag-p1">P1</span></td></tr>
        <tr><td class="td-bold">Equipe</td><td>Módulo <code>team</code> + roles food + convite Keycloak</td><td><span class="tag-p2">P2</span></td></tr>
        <tr><td class="td-bold">Integrações</td><td>Conectores iFood/Rappi/pagamento (hub + webhooks)</td><td><span class="tag-p2">P2</span></td></tr>
        <tr><td class="td-bold">Comandas / KDS</td><td>Domínio operacional de salão e cozinha</td><td><span class="tag-p3">P3</span></td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
