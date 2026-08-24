WIKI.register({
  id: 'equipe-loja',
  title: 'Equipe da Loja',
  icon: '👥',
  searchText: 'equipe loja funcionarios store users convite keycloak senha provisoria cargos membros',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Acesso e Equipe</div>
    <h1 class="section-title">👥 Equipe da Loja</h1>
    <p class="section-subtitle">Gestão de funcionários e colaboradores vinculados a uma loja — convite, atribuição de papéis, sincronização Keycloak e controle de acesso.</p>
    <div class="section-tags">
      <span class="tag-orange">Equipe</span>
      <span class="tag-amber">StoreUser</span>
      <span class="tag-blue">Keycloak Sync</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>API funcional: <code>GET/POST/DELETE /store-users</code> (vertical food)</li>
      <li>Criação de usuário no Keycloak com senha provisória</li>
      <li>Platform-sync: espelha usuário no schema tenant</li>
      <li>StoreUser: <code>{ id, storeId, userId, keycloakId, role, email, name }</code></li>
      <li>ERP: tela de listagem parcialmente implementada</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Convite por e-mail/SMS com link de primeiro acesso</li>
      <li>Senha provisória gerada com expiração (24h) e obrigação de troca no 1º login</li>
      <li>Horários de trabalho: turno, dia da semana, ponto eletrônico simples</li>
      <li>Histórico de atividade por funcionário (último login, transações do dia)</li>
      <li>Desativação temporária (férias/afastamento) sem excluir o usuário</li>
      <li>Multi-loja: funcionário pode pertencer a múltiplas lojas com papéis distintos</li>
    </ul>
  </div>

  <h2>Modelo de dados</h2>
  <pre>// Prisma schema — tenant schema
model StoreUser {
  id          String   @id @default(cuid())
  storeId     String
  userId      String   // ID interno do usuário
  keycloakId  String   // UUID Keycloak
  email       String
  name        String
  role        StoreRole
  customPerms String[] // permissões extras ou removidas
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  store       Store    @relation(fields: [storeId], references: [id])

  @@unique([storeId, keycloakId])
  @@index([storeId])
}

enum StoreRole {
  owner
  manager
  cashier
  attendant
  kitchen
  delivery
  viewer
}</pre>

  <h2>Fluxo de convite de funcionário</h2>
  <div class="mermaid">
sequenceDiagram
  participant Manager as Gerente (ERP)
  participant BFF
  participant VertAPI as vertical-api
  participant KC as Keycloak
  participant Worker as platform-sync worker
  participant DB as Tenant DB

  Manager->>BFF: POST /api/proxy/food/store-users
  Note right of Manager: { email, name, role }
  BFF->>VertAPI: POST /store-users + X-Store-Id
  VertAPI->>KC: POST /users (cria user, senha provisória)
  KC-->>VertAPI: keycloakId
  VertAPI->>Worker: emit('user.created', { keycloakId, storeId, role })
  Worker->>DB: INSERT StoreUser
  Worker->>KC: Atribui realm-roles
  VertAPI-->>BFF: 201 StoreUser
  BFF-->>Manager: 201 OK
  KC-->>Manager: E-mail com link de primeiro acesso
  </div>

  <h2>Tela de gestão de equipe (proposta)</h2>
  <div class="mockup-container">
    <div class="mock-topbar"><span class="mock-logo" style="color:#fbbf24">👥 Equipe da Loja</span></div>
    <div class="mock-body">
      <div style="display:flex;gap:8px;margin-bottom:12px;align-items:center;">
        <input style="flex:1;padding:7px 12px;border:1px solid #e7e5e4;border-radius:8px;font-size:13px;" placeholder="Buscar por nome ou e-mail…" />
        <button class="mock-btn mock-btn-primary">+ Convidar</button>
      </div>
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <thead><tr style="background:#fef9f0;"><th style="padding:8px;text-align:left">Nome</th><th>E-mail</th><th>Papel</th><th>Status</th><th>Último acesso</th><th></th></tr></thead>
        <tbody>
          <tr style="border-top:1px solid #e7e5e4;">
            <td style="padding:8px;font-weight:600">João Silva</td>
            <td style="color:#a8a29e">joao@loja.com</td>
            <td><span class="mock-badge mock-badge-green">owner</span></td>
            <td><span class="mock-badge mock-badge-green">Ativo</span></td>
            <td style="color:#a8a29e">Hoje 09:32</td>
            <td><button class="mock-btn mock-btn-outline" style="font-size:11px;padding:3px 8px">⋮</button></td>
          </tr>
          <tr style="border-top:1px solid #e7e5e4;">
            <td style="padding:8px;font-weight:600">Maria Costa</td>
            <td style="color:#a8a29e">maria@loja.com</td>
            <td><span class="mock-badge mock-badge-blue">manager</span></td>
            <td><span class="mock-badge mock-badge-green">Ativo</span></td>
            <td style="color:#a8a29e">Ontem 18:10</td>
            <td><button class="mock-btn mock-btn-outline" style="font-size:11px;padding:3px 8px">⋮</button></td>
          </tr>
          <tr style="border-top:1px solid #e7e5e4;">
            <td style="padding:8px;font-weight:600">Carlos Lima</td>
            <td style="color:#a8a29e">carlos@loja.com</td>
            <td><span class="mock-badge mock-badge-yellow">cashier</span></td>
            <td><span class="mock-badge mock-badge-yellow">Aguardando 1º acesso</span></td>
            <td style="color:#a8a29e">—</td>
            <td><button class="mock-btn mock-btn-outline" style="font-size:11px;padding:3px 8px">⋮</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <h2>Ações disponíveis por funcionário</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Ação</th><th>Quem pode</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td>Convidar membro</td><td>owner, manager</td><td>Cria usuário Keycloak + StoreUser</td></tr>
        <tr><td>Alterar papel</td><td>owner</td><td>Muda role do funcionário</td></tr>
        <tr><td>Editar permissões customizadas</td><td>owner</td><td>Override de permissões específicas</td></tr>
        <tr><td>Reenviar convite</td><td>owner, manager</td><td>Regera link de primeiro acesso</td></tr>
        <tr><td>Desativar temporariamente</td><td>owner</td><td>Bloqueia login sem excluir o usuário</td></tr>
        <tr><td>Remover da loja</td><td>owner</td><td>Desvincula StoreUser, revoga roles no KC</td></tr>
        <tr><td>Ver histórico de atividade</td><td>owner, manager</td><td>Log de logins e transações</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Roadmap equipe</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">📅</span> Escala de trabalho <span class="tag-p2">P2</span></div>
      <p>Definir turnos por funcionário (manhã/tarde/noite). Validar no login se está no turno. Relatório de presença.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🏆</span> Performance individual <span class="tag-p3">P3</span></div>
      <p>Pedidos atendidos, ticket médio, tempo de resposta por funcionário. Ranking gamificado.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🔔</span> Notificações direcionadas <span class="tag-p2">P2</span></div>
      <p>Alertas via WhatsApp/Push apenas para funcionários escalados no turno ativo.</p>
    </div>
  </div>
</div>
`
});
