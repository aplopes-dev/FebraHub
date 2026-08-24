WIKI.register({
  id: 'pdv-caixa',
  title: 'PDV e Caixa',
  icon: '🖥️',
  searchText: 'pdv ponto venda caixa offline sqlite fechamento sangria suprimento frente balcao touchscreen',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Catálogo e Operação</div>
    <h1 class="section-title">🖥️ PDV e Caixa</h1>
    <p class="section-subtitle">Ponto de Venda para operação presencial — interface touchscreen, modo offline com SQLite, abertura/fechamento de caixa e integração com impressora fiscal.</p>
    <div class="section-tags">
      <span class="tag-orange">PDV</span>
      <span class="tag-amber">Offline-First</span>
      <span class="tag-red">P1 Feature</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Tela PDV: placeholder na vertical food no ERP — sem funcionalidade</li>
      <li>Schema do banco tem entidades de sessão de caixa (CashSession)</li>
      <li>Pagamento presencial via payment-api (funcional para marketplace)</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Interface touchscreen otimizada para SmartPOS e tablets</li>
      <li>Offline-first: SQLite local com sync automático ao reconectar</li>
      <li>Abertura de caixa com fundo inicial (troco); fechamento com conferência</li>
      <li>Múltiplos métodos de pagamento em uma venda (split)</li>
      <li>Busca de produto por nome, código de barras (scanner) ou QR</li>
      <li>Desconto por item ou total com autorização de gerente</li>
      <li>Impressão de cupom não-fiscal e NFC-e automática</li>
      <li>Modo kiosk: tela de autoatendimento sem funcionário</li>
    </ul>
  </div>

  <h2>Interface PDV (wireframe)</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo" style="color:#fbbf24">🖥️ PDV</span>
      <span style="font-size:12px;color:rgba(255,255,255,.6);margin-left:12px;">Caixa 01 — João · Turno: 08:00–16:00</span>
      <span style="margin-left:auto;font-size:12px;color:#86efac;">🟢 Online</span>
    </div>
    <div class="mock-body" style="display:flex;gap:0;padding:0;min-height:220px;">
      <div style="flex:1;padding:12px;border-right:1px solid #e7e5e4;">
        <input style="width:100%;padding:8px 12px;border:1px solid #e7e5e4;border-radius:8px;font-size:14px;margin-bottom:10px;" placeholder="🔍 Buscar produto ou leia código de barras…"/>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
          <div style="background:white;border:1px solid #e7e5e4;border-radius:8px;padding:10px;text-align:center;cursor:pointer;">
            <div style="font-size:20px;margin-bottom:4px;">📦</div>
            <div style="font-size:12px;font-weight:600">Arroz 5kg</div>
            <div style="font-size:13px;color:#d97706;font-weight:700">R$24,90</div>
          </div>
          <div style="background:white;border:1px solid #e7e5e4;border-radius:8px;padding:10px;text-align:center;cursor:pointer;">
            <div style="font-size:20px;margin-bottom:4px;">☕</div>
            <div style="font-size:12px;font-weight:600">Café Espresso</div>
            <div style="font-size:13px;color:#d97706;font-weight:700">R$7,00</div>
          </div>
          <div style="background:white;border:1px solid #e7e5e4;border-radius:8px;padding:10px;text-align:center;cursor:pointer;">
            <div style="font-size:20px;margin-bottom:4px;">✂️</div>
            <div style="font-size:12px;font-weight:600">Corte Masc.</div>
            <div style="font-size:13px;color:#d97706;font-weight:700">R$45,00</div>
          </div>
        </div>
      </div>
      <div style="width:240px;padding:12px;display:flex;flex-direction:column;">
        <div style="font-weight:700;margin-bottom:8px;">Carrinho atual</div>
        <div style="flex:1;font-size:13px;">
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e7e5e4">
            <span>1x Arroz 5kg</span><span style="font-weight:600">R$24,90</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e7e5e4">
            <span>1x Café Espresso</span><span style="font-weight:600">R$7,00</span>
          </div>
        </div>
        <div style="border-top:2px solid #e7e5e4;padding-top:8px;margin-top:8px;">
          <div style="display:flex;justify-content:space-between;font-weight:800;font-size:15px;margin-bottom:10px;">
            <span>Total</span><span style="color:#d97706">R$31,90</span>
          </div>
          <button class="mock-btn mock-btn-primary" style="width:100%;justify-content:center;">💳 Finalizar Venda</button>
          <button class="mock-btn mock-btn-outline" style="width:100%;justify-content:center;margin-top:6px;font-size:12px;">🗑 Limpar</button>
        </div>
      </div>
    </div>
  </div>
  <p class="mermaid-caption">Wireframe ilustrativo (itens mistos: produto market, produto food, serviço). O PDV base atende qualquer vertical; as verticais estendem com grid touch + fotos (food), scan EAN e balança (market), etc.</p>

  <h2>Sessão de Caixa</h2>
  <pre>model CashSession {
  id          String      @id @default(cuid())
  storeId     String
  operatorId  String      // StoreUser
  openedAt    DateTime
  closedAt    DateTime?
  openingFloat Decimal    // fundo de troco inicial
  closingFloat Decimal?   // cédulas contadas no fechamento
  systemTotal  Decimal?   // calculado automaticamente
  difference   Decimal?   // closingFloat - systemTotal
  status      CashStatus  // OPEN | CLOSED | SUSPENDED

  transactions CashTransaction[]
}

enum CashStatus { OPEN CLOSED SUSPENDED }</pre>

  <h2>Operações do caixa</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Operação</th><th>Descrição</th><th>Quem autoriza</th></tr></thead>
      <tbody>
        <tr><td>Abertura</td><td>Define fundo de troco inicial, inicia CashSession</td><td>Caixa/Gerente</td></tr>
        <tr><td>Sangria</td><td>Retirada de dinheiro durante o dia (reduz saldo)</td><td>Gerente obrigatório</td></tr>
        <tr><td>Suprimento</td><td>Adição de dinheiro ao caixa (troco extra)</td><td>Gerente</td></tr>
        <tr><td>Desconto</td><td>Desconto em item ou total com senha de autorização</td><td>Gerente</td></tr>
        <tr><td>Cancelamento</td><td>Anular venda antes de fechar sessão</td><td>Gerente</td></tr>
        <tr><td>Fechamento</td><td>Conta cédulas, calcula diferença, fecha CashSession</td><td>Caixa</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Modo Offline</h2>
  <div class="alert alert-orange">
    <span class="alert-icon">📴</span>
    <div class="alert-body">
      <div class="alert-title">Offline-first é pré-requisito para PDV</div>
      <p>Queda de internet não pode parar uma operação presencial. A inspiração é o Toast Router (gateway local) — transações ficam em fila SQLite e sincronizam automaticamente ao reconectar. <span class="tag-p1">P1</span></p>
    </div>
  </div>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">💾</span> SQLite Local</div>
      <p>IndexedDB / SQLite no browser via OPFS. Catálogo cacheado localmente. Vendas gravadas localmente.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🔄</span> Sync automático</div>
      <p>Ao reconectar, fila local é enviada ao servidor. Conflicts resolvidos por timestamp e storeId.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">⚡</span> Indicador de status</div>
      <p>Badge verde/vermelho na topbar indicando online/offline. Contador de transações pendentes de sync.</p>
    </div>
  </div>
</div>
`
});
