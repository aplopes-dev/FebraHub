WIKI.register({
  id: 'configuracoes-food',
  title: 'Configurações Food',
  icon: '⚙️',
  searchText: 'configuracoes food settings salao horarios canais delivery tempos preparo branding impressora fiscal loja',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Acesso e Configurações</div>
    <h1 class="section-title">⚙️ Configurações Food</h1>
    <p class="section-subtitle">Todas as configurações específicas de um restaurante: salão, horários de funcionamento, canais habilitados, tempos de preparo, branding e dispositivos.</p>
    <div class="section-tags">
      <span class="tag-red">Configurações</span>
      <span class="status-badge status-mock">⚠ UI mockada</span>
      <span class="tag-gray">store · horários · entrega</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (UI mockada — sem backend)</div>
    <ul>
      <li><strong>Configurações da loja</strong> (<code>/food/sistema</code>): abas Geral, Endereço &amp; Contato e Fiscal (identidade, endereço, contato, dados fiscais, preferências)</li>
      <li><strong>Horários</strong> (<code>/food/sistema/horarios</code>): status aberto/fechado, grade semanal, exceções (feriados) e regras de pedido</li>
      <li><strong>Entrega</strong> (<code>/food/sistema/entrega</code>): zonas, taxas e regras gerais</li>
      <li><strong>Todas as telas persistem apenas em <code>sessionStorage</code></strong> — o módulo de settings do food-api antigo (branding/logo MinIO/<code>salonZones</code>) foi removido na reescrita; ainda não há backend <code>store-settings</code></li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Painel de Configurações Completo</div>
    <ul>
      <li>Salão: UI para gerenciar zonas, mesas (arrastar/soltar layout)</li>
      <li>Horários: grade semanal de funcionamento por canal (salão / delivery / balcão)</li>
      <li>Canais: habilitar/desabilitar salão, delivery próprio, iFood, Rappi, marketplace Citybox</li>
      <li>Tempos de preparo: por categoria ou item, feed para hub de delivery</li>
      <li>Branding: logo, foto de capa, cores do cardápio digital</li>
      <li>Impressoras: configurar impressoras por função (caixa, KDS grelha, KDS bebidas, expo)</li>
      <li>Notificações: escolher canais de alerta (app, WhatsApp, e-mail) por tipo de evento</li>
    </ul>
  </div>

  <h2>Estrutura de configurações food</h2>
  <pre>{
  "storeSettings": {
    "branding": {
      "logoUrl": "https://minio/logos/store.jpg",
      "coverUrl": "https://minio/covers/store.jpg",
      "primaryColor": "#e11d48",
      "description": "Hambúrgueres artesanais desde 2018"
    },
    "businessHours": {
      "monday":    [{ "open": "11:00", "close": "22:00" }],
      "tuesday":   [{ "open": "11:00", "close": "22:00" }],
      "wednesday": [{ "open": "11:00", "close": "22:00" }],
      "thursday":  [{ "open": "11:00", "close": "22:00" }],
      "friday":    [{ "open": "11:00", "close": "23:00" }],
      "saturday":  [{ "open": "11:00", "close": "23:00" }, { "open": "23:30", "close": "02:00" }],
      "sunday":    []
    },
    "channels": {
      "dineIn":      { "enabled": true },
      "counter":     { "enabled": true },
      "ownDelivery": { "enabled": true, "minOrder": 2000, "maxRadius": 5 },
      "ifood":       { "enabled": true, "merchantId": "IFD-00123" },
      "rappi":       { "enabled": false },
      "cityboxMarketplace": { "enabled": true }
    },
    "prepTimes": {
      "default": 15,
      "byCategory": {
        "hamburguer": 8,
        "pizza": 20,
        "bebidas": 2
      }
    },
    "salonZones": [...],
    "printers": [
      { "id": "p1", "name": "Caixa Principal", "type": "cashier", "ip": "192.168.1.10" },
      { "id": "p2", "name": "KDS Grelha",      "type": "kds",     "ip": "192.168.1.11" },
      { "id": "p3", "name": "KDS Bebidas",     "type": "kds",     "ip": "192.168.1.12" }
    ]
  }
}</pre>

  <h2>Grade de horários por canal</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Canal</th><th>Segunda–Sexta</th><th>Sábado</th><th>Domingo</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Salão (dine-in)</td><td>11:00–22:00</td><td>11:00–23:00</td><td>Fechado</td></tr>
        <tr><td class="td-bold">Balcão (PDV)</td><td>10:00–22:00</td><td>10:00–23:00</td><td>Fechado</td></tr>
        <tr><td class="td-bold">Delivery próprio</td><td>11:00–21:30</td><td>11:00–22:30</td><td>Fechado</td></tr>
        <tr><td class="td-bold">iFood</td><td>11:00–21:00</td><td>11:00–22:00</td><td>Fechado</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Configuração de impressoras</h2>
  <div class="card-grid">
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">🖨️</span> Impressora de Caixa</div>
      <p>Imprime cupom do cliente (não fiscal), relatório Z de fechamento. Protocolo: ESC/POS via TCP.</p>
    </div>
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">📺</span> KDS por estação</div>
      <p>Fallback: se o monitor KDS cair, imprime ticket na impressora da estação automaticamente.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">📨</span> Impressora de NFC-e</div>
      <p>Impressora fiscal (SAT-CF-e) acoplada ao PDV. Configurada com código de ativação.</p>
    </div>
  </div>
</div>
`
});
