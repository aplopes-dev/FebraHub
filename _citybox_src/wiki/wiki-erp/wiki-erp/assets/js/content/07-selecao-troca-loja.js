WIKI.register({
  id: 'selecao-troca-loja',
  title: 'Seleção e Troca de Loja',
  icon: '🏬',
  searchText: 'selecao troca loja multi-loja store context switch organization manager',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Plataforma e Shell</div>
    <h1 class="section-title">🏬 Seleção e Troca de Loja</h1>
    <p class="section-subtitle">Fluxo de seleção da loja ativa após login e mecanismo de troca de loja durante a sessão — fundamental para lojistas com múltiplas unidades.</p>
    <div class="section-tags">
      <span class="tag-orange">Multi-Loja</span>
      <span class="tag-amber">Store Context</span>
      <span class="tag-gray">Store Scoped</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Tela <code>/select-store</code> exibe lojas do usuário autenticado</li>
      <li>storeId salvo em cookie <code>erp_store</code></li>
      <li>BFF injeta <code>X-Store-Id</code> header em todas as chamadas às APIs</li>
      <li>Troca de loja via dropdown no topbar ou navegando para <code>/select-store</code></li>
      <li>Funcional e testado com user com 1–2 lojas</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Troca de loja sem recarregar página (SPA smooth transition)</li>
      <li>Breadcrumb permanente exibindo loja ativa no topbar</li>
      <li>Badge de notificações por loja (pedidos pendentes, alertas)</li>
      <li>Acesso rápido: favoritar lojas frequentes no seletor</li>
      <li>Cross-store: visualizar resumo de todas as lojas na mesma tela (owner)</li>
      <li>Permissões revalidadas on-the-fly ao trocar de loja</li>
    </ul>
  </div>

  <h2>Fluxo de seleção de loja</h2>
  <div class="mermaid">
flowchart TD
  Login[Login concluído] --> CheckStore{Tem storeId no cookie?}
  CheckStore -->|Sim| Dashboard[Dashboard da loja]
  CheckStore -->|Não| SelectStore[Tela /select-store]
  SelectStore --> SingleStore{Apenas 1 loja?}
  SingleStore -->|Sim| AutoSelect[Auto-seleciona loja]
  AutoSelect --> Dashboard
  SingleStore -->|Não| UserPick[Usuário escolhe loja]
  UserPick --> SetCookie[Salva storeId no cookie]
  SetCookie --> Dashboard

  Dashboard --> TopbarDropdown[Clica no seletor de loja]
  TopbarDropdown --> StoreList[Lista de lojas disponíveis]
  StoreList --> ChangeStore[Troca storeId no cookie]
  ChangeStore --> RefreshPermissions[Revalida permissões]
  RefreshPermissions --> Dashboard
  </div>

  <h2>Componente StoreSelector (proposta)</h2>
  <pre>// apps/erp/src/components/StoreSelector.tsx
export function StoreSelector() {
  const { store, stores, switchStore } = useStoreContext();

  return (
    &lt;DropdownMenu&gt;
      &lt;DropdownTrigger&gt;
        &lt;button className="flex items-center gap-2"&gt;
          &lt;StoreIcon /&gt;
          &lt;span&gt;{store.name}&lt;/span&gt;
          &lt;ChevronDownIcon /&gt;
        &lt;/button&gt;
      &lt;/DropdownTrigger&gt;
      &lt;DropdownContent&gt;
        {stores.map(s =&gt; (
          &lt;DropdownItem key={s.id} onClick={() =&gt; switchStore(s.id)}&gt;
            &lt;StoreRow store={s} active={s.id === store.id} /&gt;
          &lt;/DropdownItem&gt;
        ))}
        &lt;DropdownSeparator /&gt;
        &lt;DropdownItem href="/select-store"&gt;Ver todas as lojas&lt;/DropdownItem&gt;
      &lt;/DropdownContent&gt;
    &lt;/DropdownMenu&gt;
  );
}</pre>

  <h2>Dados exibidos no seletor de loja</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Campo</th><th>Fonte</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Nome da loja</td><td>Store.name</td><td>Identificação principal</td></tr>
        <tr><td class="td-bold">Endereço curto</td><td>Store.address</td><td>Diferencia unidades da mesma rede</td></tr>
        <tr><td class="td-bold">Vertical / Tipo</td><td>Store.verticalId</td><td>Ícone do segmento</td></tr>
        <tr><td class="td-bold">Status operacional</td><td>Store.isOpen</td><td>Aberta / Fechada em tempo real</td></tr>
        <tr><td class="td-bold">Pedidos pendentes</td><td>API realtime</td><td>Badge numérico (proposta)</td></tr>
        <tr><td class="td-bold">Papel do usuário</td><td>StoreUser.role</td><td>Owner / Manager / Cashier</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Cross-store dashboard (proposta owner)</h2>
  <div class="alert alert-orange">
    <span class="alert-icon">🏢</span>
    <div class="alert-body">
      <div class="alert-title">Dashboard unificado para donos de rede</div>
      <p>Owners com múltiplas lojas precisam de visão consolidada: faturamento total, pedidos em aberto por loja, ranking de performance. Sem esta tela, precisam trocar de loja manualmente para cada verificação. <span class="tag-p2">P2</span></p>
    </div>
  </div>
  <div class="card-grid">
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">📊</span> KPIs consolidados</div>
      <p>Faturamento do dia, ticket médio, pedidos por hora — somados de todas as lojas da Organization.</p>
    </div>
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">🚨</span> Alertas cross-loja</div>
      <p>Estoque crítico, loja offline, pedido parado há &gt;30min — centralizados no painel do owner.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🏆</span> Ranking de lojas</div>
      <p>Comparação de performance entre unidades: revenue, NPS, tempo de preparo.</p>
    </div>
  </div>
</div>
`
});
