WIKI.register({
  id: 'rbac-permissoes',
  title: 'RBAC e Permissões',
  icon: '🔑',
  searchText: 'rbac permissoes roles papeis store scoped food permissions catalog modulos acesso controle',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Acesso e Equipe</div>
    <h1 class="section-title">🔑 RBAC e Permissões</h1>
    <p class="section-subtitle">Sistema de controle de acesso baseado em papéis, store-scoped. O catálogo de permissões da vertical Food serve de molde para todas as verticais.</p>
    <div class="section-tags">
      <span class="tag-orange">RBAC</span>
      <span class="tag-amber">Store-Scoped</span>
      <span class="tag-blue">Keycloak + DB</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP) — Funcional na vertical Food</div>
    <ul>
      <li>Roles definidas em <code>food-permissions.catalog.ts</code>: 14 módulos, 50+ permissões</li>
      <li>StoreUser: <code>{ userId, storeId, role, customPermissions[] }</code></li>
      <li>Guard NestJS verifica role + permissão específica em cada endpoint</li>
      <li>Keycloak realm-roles + resource-level claims</li>
      <li>ERP: telas de gerenciamento de papéis parcialmente implementadas</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Roles e permissões configuráveis por loja via UI (sem hardcode)</li>
      <li>Permissões customizadas: override a nível de usuário individual</li>
      <li>Herança de permissões: role base + adições/remoções por funcionário</li>
      <li>Auditoria: log de quem alterou permissão, quando e de quê para quê</li>
      <li>Templates de permissão: "Kit Cozinheiro", "Kit Caixa" para onboarding rápido</li>
      <li>Preview de permissões: simular o que um usuário consegue ver</li>
    </ul>
  </div>

  <h2>Papéis padrão (base comum → extensões por vertical)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Papel (Role)</th><th>Descrição</th><th>Módulos com acesso total</th><th>Aplicável em</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">owner</td><td>Dono da loja — acesso irrestrito</td><td>Todos</td><td>Todas as verticais</td></tr>
        <tr><td class="td-bold">manager</td><td>Gerente — gestão operacional e de equipe</td><td>Catálogo, Pedidos/Agenda, Estoque, Equipe, Relatórios</td><td>Todas as verticais</td></tr>
        <tr><td class="td-bold">cashier</td><td>Caixa — frente de caixa e pagamentos</td><td>PDV, Pedidos (aceitar), Pagamentos</td><td>Food, Market, Varejo</td></tr>
        <tr><td class="td-bold">attendant</td><td>Atendente / Recepcionista</td><td>Pedidos/Agenda (visualizar), Catálogo (leitura), Clientes</td><td>Todas as verticais</td></tr>
        <tr><td class="td-bold">professional</td><td>Profissional executante</td><td>Agenda (própria), Clientes (leitura), KDS/OS</td><td>Beauty, Clinic, Services, Hospitality</td></tr>
        <tr><td class="td-bold">kitchen</td><td>Cozinheiro / Operador de preparo</td><td>KDS, Estoque de insumos (leitura)</td><td>Food (específico)</td></tr>
        <tr><td class="td-bold">delivery</td><td>Entregador / Técnico externo</td><td>Pedidos para entrega/OS (status update)</td><td>Food, Services</td></tr>
        <tr><td class="td-bold">viewer</td><td>Analista — somente leitura</td><td>Relatórios, Catálogo, Estoque</td><td>Todas as verticais</td></tr>
      </tbody>
    </table>
  </div>
  <p style="font-size:13px;color:#78716c;font-style:italic">Nota: roles são extensíveis por vertical. O papel <code>professional</code> é o equivalente de <code>kitchen</code> para verticais de serviço. Cada vertical pode adicionar roles específicos (ex: <code>driver</code> para Rental, <code>teacher</code> para Education).</p>

  <h2>Catálogo de permissões (14+ módulos — extensível por vertical)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Módulo</th><th>Permissões exemplo</th><th>Nota</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">catalog</td><td>catalog:read, catalog:create, catalog:update, catalog:delete, catalog:publish</td><td>Todos</td></tr>
        <tr><td class="td-bold">orders</td><td>orders:read, orders:accept, orders:reject, orders:cancel, orders:refund</td><td>Eixo produto</td></tr>
        <tr><td class="td-bold">agenda</td><td>agenda:read, agenda:create, agenda:update, agenda:cancel, agenda:noshow</td><td>Eixo serviço</td></tr>
        <tr><td class="td-bold">pdv</td><td>pdv:open, pdv:close_cash, pdv:apply_discount, pdv:void_item</td><td>Food, Market</td></tr>
        <tr><td class="td-bold">stock</td><td>stock:read, stock:adjust, stock:receive, stock:transfer</td><td>Todos</td></tr>
        <tr><td class="td-bold">customers</td><td>customers:read, customers:create, customers:update, customers:loyalty</td><td>Todos</td></tr>
        <tr><td class="td-bold">financial</td><td>financial:read, financial:cashclose, financial:reports, financial:export</td><td>Todos</td></tr>
        <tr><td class="td-bold">team</td><td>team:read, team:invite, team:update_role, team:remove</td><td>Todos</td></tr>
        <tr><td class="td-bold">settings</td><td>settings:read, settings:update_hours, settings:update_branding, settings:update_fiscal</td><td>Todos</td></tr>
        <tr><td class="td-bold">notifications</td><td>notifications:read, notifications:send, notifications:configure_templates</td><td>Todos</td></tr>
        <tr><td class="td-bold">delivery</td><td>delivery:read, delivery:update_zones, delivery:update_fees</td><td>Food, Market, Services</td></tr>
        <tr><td class="td-bold">fiscal</td><td>fiscal:read, fiscal:emit_nfce, fiscal:emit_nfe, fiscal:cancel</td><td>Todos</td></tr>
        <tr><td class="td-bold">reports</td><td>reports:sales, reports:stock, reports:team, reports:financial, reports:export</td><td>Todos</td></tr>
        <tr><td class="td-bold">kds</td><td>kds:read, kds:update_status, kds:configure</td><td>Food (específico)</td></tr>
        <tr><td class="td-bold">marketplace</td><td>marketplace:read, marketplace:publish, marketplace:unpublish</td><td>Todos</td></tr>
        <tr><td class="td-bold">devices</td><td>devices:read, devices:pair, devices:remove, devices:configure</td><td>Todos</td></tr>
        <tr><td class="td-bold">audit</td><td>audit:read (owner only)</td><td>Todos</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Implementação: Guard NestJS</h2>
  <pre>// Exemplo de uso nos controllers
@UseGuards(JwtAuthGuard, StorePermissionGuard)
@RequirePermission('catalog:create')
@Post('/catalog')
async createItem(@Body() dto: CreateItemDto, @StoreCtx() store: Store) {
  return this.catalogService.create(store.id, dto);
}

// StorePermissionGuard verifica:
// 1. StoreUser exists para { userId, storeId }
// 2. Role tem a permission OU customPermissions[] inclui
// 3. storeId no header === storeId do resource</pre>

  <h2>Tela de gerenciamento de papéis (proposta)</h2>
  <div class="mockup-container">
    <div class="mock-topbar"><span class="mock-logo" style="color:#fbbf24">🔑 Permissões da Equipe</span></div>
    <div class="mock-body">
      <div style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap;">
        <span class="mock-badge mock-badge-blue">7 membros</span>
        <span class="mock-badge mock-badge-yellow">3 papéis ativos</span>
        <button class="mock-btn mock-btn-primary">+ Convidar membro</button>
      </div>
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <thead><tr style="background:#fef9f0;"><th style="padding:8px;text-align:left;">Nome</th><th>Papel</th><th>Módulos</th><th>Ações</th></tr></thead>
        <tbody>
          <tr style="border-top:1px solid #e7e5e4;"><td style="padding:8px;">João Silva</td><td><span class="mock-badge mock-badge-green">owner</span></td><td style="color:#a8a29e">Todos</td><td><button class="mock-btn mock-btn-outline" style="font-size:11px;padding:3px 8px">Editar</button></td></tr>
          <tr style="border-top:1px solid #e7e5e4;"><td style="padding:8px;">Maria Costa</td><td><span class="mock-badge mock-badge-blue">manager</span></td><td style="color:#a8a29e">8 módulos</td><td><button class="mock-btn mock-btn-outline" style="font-size:11px;padding:3px 8px">Editar</button></td></tr>
          <tr style="border-top:1px solid #e7e5e4;"><td style="padding:8px;">Carlos Lima</td><td><span class="mock-badge mock-badge-yellow">cashier</span></td><td style="color:#a8a29e">PDV, Pedidos</td><td><button class="mock-btn mock-btn-outline" style="font-size:11px;padding:3px 8px">Editar</button></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <h2>Matriz de permissões por papel</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Módulo</th><th>owner</th><th>manager</th><th>cashier</th><th>attendant</th><th>viewer</th></tr></thead>
      <tbody>
        <tr><td>Catálogo</td><td class="cap-yes">Leitura+Escrita</td><td class="cap-yes">Leitura+Escrita</td><td class="cap-opt">Leitura</td><td class="cap-opt">Leitura</td><td class="cap-opt">Leitura</td></tr>
        <tr><td>Pedidos</td><td class="cap-yes">Total</td><td class="cap-yes">Total</td><td class="cap-yes">Aceitar/Fechar</td><td class="cap-opt">Visualizar</td><td class="cap-opt">Leitura</td></tr>
        <tr><td>PDV</td><td class="cap-yes">Total</td><td class="cap-yes">Total</td><td class="cap-yes">Total</td><td class="cap-na">—</td><td class="cap-na">—</td></tr>
        <tr><td>Estoque</td><td class="cap-yes">Total</td><td class="cap-yes">Total</td><td class="cap-opt">Leitura</td><td class="cap-na">—</td><td class="cap-opt">Leitura</td></tr>
        <tr><td>Financeiro</td><td class="cap-yes">Total</td><td class="cap-opt">Caixa+Relatórios</td><td class="cap-opt">Caixa</td><td class="cap-na">—</td><td class="cap-opt">Leitura</td></tr>
        <tr><td>Equipe</td><td class="cap-yes">Total</td><td class="cap-yes">Convidar+Editar</td><td class="cap-na">—</td><td class="cap-na">—</td><td class="cap-na">—</td></tr>
        <tr><td>Configurações</td><td class="cap-yes">Total</td><td class="cap-opt">Horários+Cardápio</td><td class="cap-na">—</td><td class="cap-na">—</td><td class="cap-na">—</td></tr>
        <tr><td>Fiscal</td><td class="cap-yes">Total</td><td class="cap-opt">Emitir NF</td><td class="cap-opt">Emitir NFC-e</td><td class="cap-na">—</td><td class="cap-opt">Leitura</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
