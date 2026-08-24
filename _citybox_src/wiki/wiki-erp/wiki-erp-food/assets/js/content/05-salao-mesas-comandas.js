WIKI.register({
  id: 'salao-mesas-comandas',
  title: 'Salão, Mesas e Comandas',
  icon: '🍽️',
  searchText: 'salao mesas comandas qr code split divisao conta salon zones mapa mesa garcom abrir fechar course firing reserva',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Operação de Salão / PDV</div>
    <h1 class="section-title">🍽️ Salão, Mesas e Comandas</h1>
    <p class="section-subtitle">Do JSON de <code>salonZones</code> (hoje funcional) ao mapa operacional de mesas com comandas, QR code de auto-atendimento, split de conta e course firing para restaurantes dine-in.</p>
    <div class="section-tags">
      <span class="tag-red">Salão</span>
      <span class="tag-orange">Comandas · QR Code</span>
      <span class="tag-gray">salonZones funcional</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li><code>salonZones</code>: JSON no <code>StoreSettings</code> com zonas de salão, validado pelo <code>SalonZonesUtil</code></li>
      <li>Estrutura: <code>[{id, name, capacity, tables: [{id, number, seats, shape, x, y}]}]</code></li>
      <li>Sem UI operacional para mesas no ERP, sem comandas, sem QR code por mesa</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Operação Completa de Salão</div>
    <ul>
      <li>Mapa visual das mesas: drag-and-drop de layout, cores por status (livre/ocupada/reservada)</li>
      <li>Abertura de comanda: clic na mesa → cria comanda com contador de tempo</li>
      <li>QR code único por mesa: cliente escaneia → cardápio digital → pedido vai para comanda</li>
      <li>Lançamento de itens na comanda: garçom adiciona itens, envia para KDS</li>
      <li>Course firing: definir que sobremesa sai apenas quando o prato principal for servido</li>
      <li>Split de conta: dividir igualmente, por item ou valor personalizado</li>
      <li>Unir mesas: agrupar mesas para grupos grandes</li>
      <li>Transferência de mesa: move comanda de uma mesa para outra</li>
    </ul>
  </div>

  <h2>Mockup — Mapa de Salão</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">🪑 Salão — Hamburgueria do Zé · Setor A</span>
      <span style="margin-left:auto;font-size:11px;opacity:.8">12 mesas · 7 ocupadas</span>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px">
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#ef4444">7</div><div class="mock-kpi-sub">Ocupadas</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#16a34a">3</div><div class="mock-kpi-sub">Livres</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#f59e0b">2</div><div class="mock-kpi-sub">Aguardando conta</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#6366f1">42min</div><div class="mock-kpi-sub">Tempo médio</div></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        <div style="background:#fee2e2;border:2px solid #ef4444;border-radius:8px;padding:12px;text-align:center">
          <div style="font-weight:700;font-size:13px">Mesa 01</div>
          <div style="font-size:11px;color:#991b1b">3 pax · 38min</div>
          <span class="mock-badge mock-badge-red" style="font-size:10px;margin-top:4px">Conta pedida</span>
        </div>
        <div style="background:#dcfce7;border:2px solid #16a34a;border-radius:8px;padding:12px;text-align:center">
          <div style="font-weight:700;font-size:13px">Mesa 02</div>
          <div style="font-size:11px;color:#166534">2 pax · 12min</div>
          <span class="mock-badge mock-badge-green" style="font-size:10px;margin-top:4px">Em andamento</span>
        </div>
        <div style="background:#f3f4f6;border:2px dashed #d1d5db;border-radius:8px;padding:12px;text-align:center">
          <div style="font-weight:700;font-size:13px;color:#9ca3af">Mesa 03</div>
          <div style="font-size:11px;color:#d1d5db">Livre</div>
        </div>
        <div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;padding:12px;text-align:center">
          <div style="font-weight:700;font-size:13px">Mesa 04</div>
          <div style="font-size:11px;color:#92400e">4 pax · 51min</div>
          <span class="mock-badge mock-badge-yellow" style="font-size:10px;margin-top:4px">⚠ Longo</span>
        </div>
      </div>
    </div>
  </div>

  <h2>Estado de mesa — ciclo de vida</h2>
  <div class="mermaid">
stateDiagram-v2
  [*] --> FREE: mesa limpa
  FREE --> RESERVED: reserva criada
  FREE --> OCCUPIED: garçom abre comanda
  RESERVED --> OCCUPIED: cliente chega
  OCCUPIED --> CHECKOUT: garçom solicita fechamento
  CHECKOUT --> PAID: pagamento efetuado
  PAID --> CLEANING: notifica limpeza
  CLEANING --> FREE: limpeza confirmada
  OCCUPIED --> FREE: comanda cancelada
  </div>

  <h2>Schema SalonZones (hoje)</h2>
  <pre>{
  "zones": [
    {
      "id": "zone-1",
      "name": "Salão Principal",
      "capacity": 40,
      "tables": [
        { "id": "t1", "number": 1, "seats": 4, "shape": "round", "x": 100, "y": 80 },
        { "id": "t2", "number": 2, "seats": 4, "shape": "round", "x": 200, "y": 80 },
        { "id": "t3", "number": 3, "seats": 6, "shape": "rect",  "x": 100, "y": 200 }
      ]
    },
    {
      "id": "zone-2",
      "name": "Área Externa",
      "capacity": 20,
      "tables": [
        { "id": "t10", "number": 10, "seats": 4, "shape": "round", "x": 50, "y": 50 }
      ]
    }
  ]
}</pre>

  <h2>Modelo de dados — Comanda operacional</h2>
  <div class="mermaid">
erDiagram
  Table {
    uuid id PK
    string zoneId
    int number
    int seats
    string status
  }
  Order {
    uuid id PK
    uuid tableId FK
    uuid storeId
    string status
    int guestCount
    datetime openedAt
    datetime closedAt
  }
  OrderItem {
    uuid id PK
    uuid orderId FK
    uuid menuItemId FK
    int quantity
    decimal unitPrice
    string courseStage
    json selectedModifiers
    string status
    string notes
  }

  Table ||--o{ Order : "has open"
  Order ||--o{ OrderItem : "contains"
  </div>

  <h2>QR Code por mesa — fluxo</h2>
  <div class="mermaid">
sequenceDiagram
  participant Cliente
  participant QR as QR Code (mesa 5)
  participant App as Cardápio Digital
  participant ERP as ERP Food
  participant Garcom as Garçom

  Cliente->>QR: Escaneia
  QR->>App: Redireciona para /m/loja/mesa/5
  App->>Cliente: Exibe cardápio digital
  Cliente->>App: Seleciona itens + modificadores
  App->>ERP: POST /orders (tableId=5, items=[...])
  ERP->>ERP: Vincula à comanda aberta da mesa 5
  ERP->>Garcom: Notificação WebSocket
  ERP->>KDS: Envia ticket de produção
  </div>

  <h2>Course Firing — configuração</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Stage</th><th>Descrição</th><th>Disparo</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">IMMEDIATE</td><td>Entra para a cozinha imediatamente</td><td>Na adição do item</td></tr>
        <tr><td class="td-bold">AFTER_ENTREES</td><td>Sai após os pratos principais</td><td>Garçom clica "Disparar sobremesas"</td></tr>
        <tr><td class="td-bold">ON_DEMAND</td><td>Garçom controla manualmente</td><td>Botão no mapa de mesas</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Split de conta</h2>
  <div class="card-grid">
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">➗</span> Divisão igualitária</div>
      <p>Total dividido por N pessoas. Mais simples, menos preciso.</p>
    </div>
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">🧾</span> Por item consumido</div>
      <p>Cada pessoa paga pelo que pediu. Mais justo para pedidos díspares.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">💵</span> Valor personalizado</div>
      <p>Cada pessoa define quanto vai pagar. Garçom confirma que soma chega ao total.</p>
    </div>
  </div>
</div>
`
});
