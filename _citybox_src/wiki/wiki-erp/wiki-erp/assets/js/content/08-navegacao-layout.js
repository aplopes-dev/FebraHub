WIKI.register({
  id: 'navegacao-layout',
  title: 'Navegação e Layout',
  icon: '🧭',
  searchText: 'navegacao layout dual sidebar ErpPage citybox ui topbar breadcrumb mobile responsive atalhos',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Plataforma e Shell</div>
    <h1 class="section-title">🧭 Navegação e Layout</h1>
    <p class="section-subtitle">Estrutura de layout do ERP Citybox: topbar, dual sidebar, componente ErpPage e padrões de navegação responsiva.</p>
    <div class="section-tags">
      <span class="tag-orange">Layout</span>
      <span class="tag-amber">@citybox/ui</span>
      <span class="tag-gray">Dual Sidebar · ErpPage</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Layout dual sidebar implementado via <code>@citybox/ui</code></li>
      <li>Sidebar esquerda: navegação global (apps/verticais)</li>
      <li>Sidebar direita contextual: seções da vertical ativa</li>
      <li>Topbar: logo Citybox, breadcrumb, seletor de loja, avatar</li>
      <li>Responsivo básico: colapso de sidebars em mobile</li>
      <li>Componente <code>ErpPage</code> padroniza header de página com título e ações</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Atalhos de teclado globais: <kbd>Ctrl+K</kbd> busca, <kbd>Ctrl+N</kbd> novo item, <kbd>Ctrl+O</kbd> abrir pedido</li>
      <li>Painel lateral deslizável (drawer) para detalhes sem sair da tela atual</li>
      <li>Breadcrumb clicável com histórico de navegação</li>
      <li>Sidebar esquerda colapsável para modo "compacto" em telas menores</li>
      <li>Notificações push com badge no topbar (pedidos novos, alertas)</li>
      <li>Tour guiado de onboarding para novos usuários (primeiro acesso)</li>
    </ul>
  </div>

  <h2>Estrutura de layout</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">🏪 Citybox ERP</span>
      <span style="flex:1;text-align:center;font-size:12px;color:#94a3b8">🔍 Buscar…  Ctrl+K</span>
      <span style="color:#fbbf24;font-size:13px">🏬 Loja Central ▾</span>
      <span style="color:#94a3b8;margin-left:16px;font-size:13px">👤 João</span>
    </div>
    <div style="display:flex;min-height:200px;">
      <div style="width:220px;background:#1c1410;padding:12px 0;flex-shrink:0;">
        <div style="font-size:10px;color:#a8a29e;padding:8px 16px 4px;text-transform:uppercase;letter-spacing:.08em">Módulos</div>
        <div style="padding:6px 16px;color:#fbbf24;font-size:13px;border-left:3px solid #fbbf24;background:rgba(251,191,36,.08)">📦 Catálogo</div>
        <div style="padding:6px 16px;color:#d6d3d1;font-size:13px">🛒 Pedidos</div>
        <div style="padding:6px 16px;color:#d6d3d1;font-size:13px">📊 Estoque</div>
        <div style="padding:6px 16px;color:#d6d3d1;font-size:13px">💰 Financeiro</div>
        <div style="padding:6px 16px;color:#d6d3d1;font-size:13px">👥 Equipe</div>
        <div style="padding:6px 16px;color:#d6d3d1;font-size:13px">⚙️ Configurações</div>
      </div>
      <div style="flex:1;background:#fffbeb;padding:16px;">
        <div style="font-size:12px;color:#d97706;margin-bottom:4px;">Catálogo</div>
        <div style="font-size:18px;font-weight:800;margin-bottom:12px;">📦 Produtos</div>
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <span style="background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:20px;font-size:12px;">Todos (48)</span>
          <span style="background:white;border:1px solid #e7e5e4;color:#57534e;padding:4px 10px;border-radius:20px;font-size:12px;">Ativos (42)</span>
          <span style="background:white;border:1px solid #e7e5e4;color:#57534e;padding:4px 10px;border-radius:20px;font-size:12px;">Inativos (6)</span>
        </div>
        <div style="background:white;border:1px solid #e7e5e4;border-radius:8px;padding:10px;font-size:13px;color:#57534e;">
          📋 Tabela de produtos aqui…
        </div>
      </div>
    </div>
  </div>

  <h2>Componente ErpPage</h2>
  <pre>// Uso padrão em qualquer tela do ERP
&lt;ErpPage
  title="Produtos"
  breadcrumb={['Catálogo', 'Produtos']}
  actions={[
    { label: 'Novo Produto', icon: 'plus', onClick: () =&gt; openModal() }
  ]}
  tabs={[
    { id: 'all', label: 'Todos', count: 48 },
    { id: 'active', label: 'Ativos', count: 42 },
    { id: 'inactive', label: 'Inativos', count: 6 }
  ]}
&gt;
  &lt;ProductTable /&gt;
&lt;/ErpPage&gt;</pre>

  <h2>Padrões de telas</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Padrão</th><th>Quando usar</th><th>Componentes</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">List + Detail Slide</td><td>Catálogo, Pedidos, Clientes</td><td>ErpPage + Table + SlideDrawer</td></tr>
        <tr><td class="td-bold">Form Page</td><td>Novo produto, configurações</td><td>ErpPage + Form + FormSection</td></tr>
        <tr><td class="td-bold">Kanban Board</td><td>Pedidos realtime, KDS</td><td>KanbanBoard + KanbanCard</td></tr>
        <tr><td class="td-bold">Dashboard Grid</td><td>Home, relatórios</td><td>ErpPage + KpiCard + Chart</td></tr>
        <tr><td class="td-bold">Wizard Modal</td><td>Onboarding, checkout PDV</td><td>Modal + WizardStep</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Responsive breakpoints</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Breakpoint</th><th>Comportamento</th></tr></thead>
      <tbody>
        <tr><td><code>≥1280px</code></td><td>Layout completo: topbar + sidebar esquerda + sidebar direita + conteúdo</td></tr>
        <tr><td><code>1024–1279px</code></td><td>Sidebar direita oculta por padrão, expansível via botão</td></tr>
        <tr><td><code>768–1023px</code></td><td>Sidebar esquerda em modo compacto (só ícones)</td></tr>
        <tr><td><code>&lt;768px</code></td><td>Ambas as sidebars em drawer, ativadas por hamburger menu</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Atalhos de teclado (proposta)</h2>
  <div class="card-grid">
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">⌨️</span> Globais</div>
      <ul>
        <li><kbd>Ctrl+K</kbd> — Busca global</li>
        <li><kbd>Ctrl+N</kbd> — Novo item (contexto ativo)</li>
        <li><kbd>Ctrl+,</kbd> — Configurações da loja</li>
        <li><kbd>Esc</kbd> — Fechar modal/drawer</li>
      </ul>
    </div>
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">🛒</span> Pedidos</div>
      <ul>
        <li><kbd>Ctrl+O</kbd> — Abrir fila de pedidos</li>
        <li><kbd>F5</kbd> — Atualizar pedidos</li>
        <li><kbd>Alt+A</kbd> — Aceitar pedido selecionado</li>
        <li><kbd>Alt+R</kbd> — Recusar pedido</li>
      </ul>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🏪</span> PDV</div>
      <ul>
        <li><kbd>F1</kbd> — Abrir PDV</li>
        <li><kbd>F2</kbd> — Fechar caixa</li>
        <li><kbd>Ctrl+P</kbd> — Imprimir último cupom</li>
        <li><kbd>Ctrl+S</kbd> — Salvar venda</li>
      </ul>
    </div>
  </div>
</div>
`
});
