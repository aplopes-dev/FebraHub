WIKI.register({
  id: 'kds',
  title: 'KDS — Kitchen Display System',
  icon: '📺',
  searchText: 'kds kitchen display system estacao roteamento course firing bump expo timer alerta producao cozinha monitor',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Cozinha e KDS</div>
    <h1 class="section-title">📺 KDS — Kitchen Display System</h1>
    <p class="section-subtitle">Sistema de exibição na cozinha que substitui os tickets de papel: exibe pedidos por estação de produção, controla timers, course firing e o expo screen — o coração da operação de uma cozinha profissional.</p>
    <div class="section-tags">
      <span class="tag-red">KDS</span>
      <span class="tag-orange">Roteamento por Estação</span>
      <span class="tag-gray">citybox.print.requested.v1</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Evento <code>citybox.print.requested.v1</code> emitido pelo marketplace-api quando um pedido avança</li>
      <li>Campo <code>kind: 'kitchen'</code> no payload identifica impressão para cozinha</li>
      <li>Sem KDS: apenas impressora térmica recebe o ticket</li>
      <li>Permissões <code>kds:view</code>, <code>producao:manage</code> definidas no catálogo food</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — KDS Completo</div>
    <ul>
      <li>Monitor(es) KDS por estação: grelha, frios, bebidas, montagem, expo</li>
      <li>Roteamento: cada item do cardápio configurado para uma ou mais estações</li>
      <li>Cards de pedido: número, itens da estação, modificadores, mesa/cliente, timer</li>
      <li>Timers: conta o tempo de produção; alerta quando passa do SLA configurado</li>
      <li>Bump: cozinheiro confirma que o item ficou pronto → avança status na comanda</li>
      <li>Course firing: itens bloqueados até o garçom liberar a próxima etapa</li>
      <li>Expo Screen: tela do expedidor mostrando todos os pedidos prontos aguardando saída</li>
      <li>Modo dark: interface escura para ambientes de cozinha com pouca luz</li>
      <li>Fallback impressora: se o KDS cair, imprime ticket automaticamente</li>
    </ul>
  </div>

  <h2>Arquitetura KDS</h2>
  <div class="mermaid">
flowchart TB
  subgraph pedido [Origem do Pedido]
    PDV["PDV Balcão"]
    Garcom["Garçom (mesa)"]
    App["App Delivery/Marketplace"]
  end

  API["food-api\n(event bus)"]
  MQ["RabbitMQ\noutbox"]

  subgraph cozinha [Telas KDS]
    Grelha["📺 Estação Grelha"]
    Frios["📺 Estação Frios"]
    Bebidas["📺 Estação Bebidas"]
    Expo["📺 Expo Screen\n(expedidor)"]
  end

  Impressora["🖨️ Impressora\n(fallback)"]

  PDV --> API
  Garcom --> API
  App --> API
  API -->|"citybox.kds.ticket.v1"| MQ
  MQ -->|"WebSocket"| Grelha
  MQ -->|"WebSocket"| Frios
  MQ -->|"WebSocket"| Bebidas
  MQ -->|"fallback"| Impressora
  Grelha -->|"bump"| API
  Frios -->|"bump"| API
  Bebidas -->|"bump"| API
  API -->|"todos prontos"| Expo
  Expo -->|"release"| API
  </div>

  <h2>Configuração de roteamento por estação</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Estação</th><th>Descrição</th><th>Categorias/itens roteados</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Grelha</td><td>Hambúrgueres, carnes, churrascos</td><td>Categoria "Lanches", "Pratos quentes"</td></tr>
        <tr><td class="td-bold">Frios</td><td>Saladas, sobremesas frias, montagem</td><td>Categoria "Saladas", "Sobremesas"</td></tr>
        <tr><td class="td-bold">Bebidas</td><td>Refrigerantes, sucos, cervejas</td><td>Categoria "Bebidas"</td></tr>
        <tr><td class="td-bold">Frituras</td><td>Batata frita, anéis, pastéis</td><td>Categoria "Acompanhamentos"</td></tr>
        <tr><td class="td-bold">Expo</td><td>Tela do expedidor — todos os itens prontos</td><td>Agregação de todas as estações</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Card de KDS — campos</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">📺 KDS — Estação Grelha</span>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
        <div style="background:#fff;border:2px solid #e11d48;border-radius:8px;padding:12px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-weight:800;font-size:14px;">Mesa 5</span>
            <span class="mock-badge mock-badge-red" style="font-size:12px;">⏱ 4:32</span>
          </div>
          <div style="font-size:12px;color:#374151;margin-bottom:4px;">1x <strong>X-Burguer</strong></div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:2px;">└ Ponto: mal passado</div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:8px;">└ Bacon, Cheddar</div>
          <div style="font-size:12px;color:#374151;">1x <strong>Frango Grelhado</strong></div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:10px;">└ Sem cebola</div>
          <button class="mock-btn mock-btn-primary" style="width:100%;justify-content:center;">✅ Bump</button>
        </div>
        <div style="background:#fff;border:2px solid #f59e0b;border-radius:8px;padding:12px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-weight:800;font-size:14px;">Delivery #1247</span>
            <span class="mock-badge mock-badge-yellow" style="font-size:12px;">⏱ 2:10</span>
          </div>
          <div style="font-size:12px;color:#374151;margin-bottom:4px;">2x <strong>X-Burguer Duplo</strong></div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:10px;">└ Ponto: ao ponto</div>
          <button class="mock-btn mock-btn-primary" style="width:100%;justify-content:center;">✅ Bump</button>
        </div>
        <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:8px;padding:12px;opacity:0.7;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-weight:800;font-size:14px;">Mesa 2</span>
            <span class="mock-badge mock-badge-green" style="font-size:12px;">✅ Pronto</span>
          </div>
          <div style="font-size:12px;color:#374151;margin-bottom:4px;">1x <strong>Picanha</strong></div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:10px;">└ Ao ponto + fritas</div>
          <button class="mock-btn mock-btn-outline" style="width:100%;justify-content:center;">Aguardando Expo</button>
        </div>
      </div>
    </div>
  </div>

  <h2>SLA de produção por categoria</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Categoria</th><th>SLA padrão</th><th>Alerta amarelo</th><th>Alerta vermelho</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Hambúrgueres</td><td>8 min</td><td>6 min</td><td>9 min</td></tr>
        <tr><td class="td-bold">Pizzas</td><td>20 min</td><td>15 min</td><td>22 min</td></tr>
        <tr><td class="td-bold">Bebidas</td><td>2 min</td><td>1.5 min</td><td>3 min</td></tr>
        <tr><td class="td-bold">Delivery (total)</td><td>25 min</td><td>20 min</td><td>30 min</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">🔗</span>
    <div class="alert-body">
      <div class="alert-title">Gancho existente: citybox.print.requested.v1</div>
      <p>O marketplace-api já emite esse evento com <code>kind: 'kitchen'</code>. A evolução é: consumer desse evento → publica <code>citybox.kds.ticket.v1</code> no exchange KDS → WebSocket entrega ao monitor correto conforme roteamento configurado.</p>
    </div>
  </div>
</div>
`
});
