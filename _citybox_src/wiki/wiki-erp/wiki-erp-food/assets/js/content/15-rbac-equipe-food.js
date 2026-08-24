WIKI.register({
  id: 'rbac-equipe-food',
  title: 'RBAC e Equipe Food',
  icon: '👥',
  searchText: 'rbac equipe food papeis permissoes admin operador cozinheiro garcom caixa entregador convite keycloak role',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Acesso e Configurações</div>
    <h1 class="section-title">👥 RBAC e Equipe Food</h1>
    <p class="section-subtitle">Papéis e permissões específicos da vertical food: do admin ao entregador, mapeados sobre o <code>food-permissions.catalog.ts</code> existente com convites Keycloak.</p>
    <div class="section-tags">
      <span class="tag-red">RBAC Food</span>
      <span class="status-badge status-mock">⚠ UI mockada</span>
      <span class="tag-gray">guards Keycloak</span>
    </div>
  </div>

  <div class="alert alert-orange">
    <span class="alert-icon">🔄</span>
    <div class="alert-body">
      <div class="alert-title">O RBAC próprio do food-api foi removido na reescrita Clean Architecture</div>
      <p>O blueprint original descrevia <code>StoreRole</code>/<code>StoreUserRole</code> e convites Keycloak dentro do food-api. Após a reescrita, o food-api mantém apenas <strong>guards de autorização</strong> (<code>AuthGuard</code>, <code>PermissionGuard</code> validando a permissão <code>store.catalog.manage</code> do JWT Keycloak). Não há mais módulo de gestão de equipe/roles no backend food.</p>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje</div>
    <ul>
      <li><strong>Backend:</strong> autorização via guards Keycloak no food-api (JWT + <code>@StoreId</code> + permissão <code>store.catalog.manage</code>); sem CRUD de roles/membros próprio</li>
      <li><strong>Frontend (UI mockada):</strong> tela de Equipe no ERP (<code>/food/sistema/equipe</code>) com grid/tabela, criar/editar membro, filtros por cargo e status — dados em <code>sessionStorage</code> (<code>use-team-members.ts</code>)</li>
      <li>Falta: backend de equipe (convite Keycloak, atribuição de role), roles específicos food (garçom, cozinheiro, caixa, entregador) e permissões granulares além de <code>store.catalog.manage</code></li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — RBAC Food Completo</div>
    <ul>
      <li>5 roles food pré-definidos com permissões padrão</li>
      <li>UI no ERP para criar/editar roles, convidar membros, revogar acesso</li>
      <li>Permissão por turno: operador ativo apenas no horário de trabalho</li>
      <li>Log de acesso: quem fez o quê e quando</li>
    </ul>
  </div>

  <h2>Roles food pré-definidos</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Role</th><th>Descrição</th><th>Permissões principais</th></tr></thead>
      <tbody>
        <tr>
          <td class="td-bold">admin</td>
          <td>Dono / gerente geral</td>
          <td>Todas as permissões do catálogo</td>
        </tr>
        <tr>
          <td class="td-bold">operador</td>
          <td>Gerente de turno</td>
          <td>cardapio:manage, pedidos:manage, kds:view, caixa:operate, estoque:view</td>
        </tr>
        <tr>
          <td class="td-bold">cozinheiro</td>
          <td>Equipe da cozinha</td>
          <td>kds:view, kds:bump, producao:manage</td>
        </tr>
        <tr>
          <td class="td-bold">garcom</td>
          <td>Atendimento de salão</td>
          <td>mesas:manage, pedidos:create, cardapio:view</td>
        </tr>
        <tr>
          <td class="td-bold">caixa</td>
          <td>Operador de PDV</td>
          <td>pdv:operate, caixa:operate, fiscal:view, clientes:view</td>
        </tr>
        <tr>
          <td class="td-bold">entregador</td>
          <td>Equipe de delivery próprio</td>
          <td>delivery:view, delivery:update_status</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>Catálogo de permissões food (proposta)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Módulo</th><th>Permissões</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">pdv</td><td>pdv:operate, pdv:view, pdv:void_sale</td></tr>
        <tr><td class="td-bold">cardapio</td><td>cardapio:view, cardapio:manage, cardapio:publish</td></tr>
        <tr><td class="td-bold">producao (KDS)</td><td>producao:manage, kds:view, kds:bump</td></tr>
        <tr><td class="td-bold">entregas</td><td>entregas:view, entregas:manage, entregas:dispatch</td></tr>
        <tr><td class="td-bold">fiscal</td><td>fiscal:view, fiscal:manage, fiscal:emit</td></tr>
        <tr><td class="td-bold">estoque</td><td>estoque:view, estoque:manage, estoque:compras</td></tr>
        <tr><td class="td-bold">financeiro</td><td>financeiro:view, financeiro:manage</td></tr>
        <tr><td class="td-bold">analytics</td><td>analytics:view, analytics:export</td></tr>
        <tr><td class="td-bold">crm</td><td>crm:view, crm:manage, crm:campaign</td></tr>
        <tr><td class="td-bold">relatorios</td><td>relatorios:view, relatorios:export</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Fluxo de convite de membro</h2>
  <div class="mermaid">
sequenceDiagram
  participant Admin as Admin (ERP)
  participant FoodAPI
  participant Keycloak
  participant Colaborador

  Admin->>FoodAPI: POST /stores/{id}/members/invite { email, role }
  FoodAPI->>Keycloak: createUser + sendInviteEmail
  Keycloak->>Colaborador: Email com link de cadastro
  Colaborador->>Keycloak: Define senha
  Keycloak->>FoodAPI: user.created event
  FoodAPI->>FoodAPI: Cria StoreUserRole { userId, storeId, roleId }
  FoodAPI->>Admin: Membro ativo confirmado
  </div>

  <h2>Diferença com o wiki base</h2>
  <div class="alert alert-blue">
    <span class="alert-icon">🔗</span>
    <div class="alert-body">
      <div class="alert-title">Herda do ERP Base</div>
      <p>O mecanismo de RBAC (guards, JWT merge, permissões efetivas) é implementado no ERP Base. Este wiki documenta apenas os roles e permissões food-específicos que se plugam nesse mecanismo. Consulte a <a href="../wiki-erp/index.html#rbac-permissoes">seção RBAC do wiki base</a> para a arquitetura geral.</p>
    </div>
  </div>
</div>
`
});
