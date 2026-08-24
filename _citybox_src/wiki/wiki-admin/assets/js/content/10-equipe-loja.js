WIKI.register({
  id: 'equipe-loja',
  title: 'Equipe da Loja',
  icon: '👥',
  searchText: 'equipe loja membros cargo gerente atendente caixa cozinha criação Keycloak senha provisória convite RBAC permissões granulares ações em massa',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Lojas</div>
  <h1 class="section-title">👥 Equipe da Loja</h1>
  <p class="section-subtitle">Gestão dos membros de uma loja — CRUD de funcionários do lojista via Keycloak, cargos, permissões granulares e convites.</p>
  <div class="section-tags">
    <span class="status-badge status-functional">✅ Funcional (base)</span>
    <span class="status-badge status-proposed">🔵 RBAC granular proposto</span>
  </div>
</div>

<div class="eco-callout">
  <div class="eco-icon">🔗</div>
  <div class="eco-body">
    <div class="eco-title">A mesma equipe é gerida pelo lojista no ERP</div>
    <div class="eco-links">
      O Admin pode criar/auditar membros de qualquer loja (suporte/implantação), mas a gestão
      do dia a dia é feita pelo próprio lojista em
      <a href="../wiki-erp/wiki-erp/index.html#equipe-loja">ERP · Equipe da Loja</a>
      (mesmo realm Keycloak do tenant). Permissões granulares: <a href="../wiki-erp/wiki-erp/index.html#rbac-permissoes">ERP · RBAC</a>.
    </div>
  </div>
</div>

<div class="blueprint-today">
  <div class="blueprint-today-label">Hoje (MVP)</div>
  <ul>
    <li>Lista de membros da loja com nome, e-mail, cargo (role), data de criação</li>
    <li>Criação: nome, e-mail, cargo (gerente/atendente/caixa) e senha provisória</li>
    <li>Usuário criado no Keycloak (realm do tenant da loja)</li>
    <li>Ações: editar role, redefinir senha, remover membro</li>
    <li>Permissões granulares: componente <code>user-permissions-accordion.tsx</code> existe mas <strong>não está conectado</strong> ao formulário</li>
  </ul>
</div>

<div class="blueprint-proposed">
  <div class="blueprint-proposed-label">Proposta (alvo)</div>
  <ul>
    <li>Conectar <code>user-permissions-accordion.tsx</code> ao formulário de criação/edição</li>
    <li>Permissões salvas no Keycloak como atributos ou roles granulares</li>
    <li>Convite por e-mail: enviar link de definição de senha ao invés de senha provisória</li>
    <li>Convite em massa: importar lista CSV de membros</li>
    <li>Indicador de "último acesso" por membro</li>
    <li>Ações em massa: remover selecionados, redefinir senhas em lote</li>
  </ul>
</div>

<h2>Cargos e permissões padrão</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Cargo</th><th>Keycloak Role</th><th>ERP — Acesso padrão</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">Gerente</td><td><code>store_gerente</code></td><td>Acesso completo: catálogo, caixa, equipe, relatórios, configurações básicas</td></tr>
      <tr><td class="td-bold">Atendente</td><td><code>store_atendente</code></td><td>Pedidos, catálogo; sem configurações avançadas</td></tr>
      <tr><td class="td-bold">Caixa</td><td><code>store_caixa</code></td><td>Apenas PDV e pagamentos</td></tr>
      <tr><td class="td-bold">Cozinha</td><td><code>store_cozinha</code></td><td>Apenas KDS (monitor de cozinha)</td></tr>
    </tbody>
  </table>
</div>

<h2>Fluxo de criação de membro</h2>
<div class="mermaid">
flowchart LR
  A[Novo membro] --> B[Nome + E-mail]
  B --> C[Cargo]
  C --> D[Permissões granulares\noptional accordion]
  D --> E{Criar}
  E --> F[POST Keycloak user]
  F --> G[Enviar e-mail de convite\nlink define-senha]
  G --> H[Membro na lista\nstatus: aguardando_acesso]
</div>
`
});
