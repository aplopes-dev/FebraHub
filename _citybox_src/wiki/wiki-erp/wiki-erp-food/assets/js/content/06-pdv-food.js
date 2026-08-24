WIKI.register({
  id: 'pdv-food',
  title: 'PDV Food — Caixa e Balcão',
  icon: '🏧',
  searchText: 'pdv caixa balcao sangria suprimento sessao fechamento offline mef sat nfce rapido qsr ponto venda',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Operação de Salão / PDV</div>
    <h1 class="section-title">🏧 PDV Food — Caixa e Balcão</h1>
    <p class="section-subtitle">Ponto de venda otimizado para o ritmo rápido de restaurantes e lanchonetes: balcão, QSR, sessão de caixa, sangria/suprimento e operação offline-first.</p>
    <div class="section-tags">
      <span class="tag-red">PDV</span>
      <span class="tag-orange">Offline-first</span>
      <span class="tag-gray">Sessão de Caixa</span>
    </div>
  </div>

  <div class="herda-base-callout">
    <span class="hb-icon">🏪</span>
    <div class="hb-body">
      <div class="hb-title">Herda do ERP Base — PDV e Caixa Canônico</div>
      <div class="hb-links">Esta vertical herda o <a href="../wiki-erp/index.html#pdv-caixa">PDV e Caixa</a>: sessão de caixa (<code>CashSession</code>, abertura/sangria/suprimento/fechamento), offline-first (SQLite/IndexedDB + sync), meios de pagamento e NFC-e. Esta seção documenta <strong>apenas o delta food</strong>: interface touch com fotos do cardápio, modo QSR (&lt;30s), ticket para o KDS e fluxo de senha/chamada.</div>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (UI mockada — sem backend)</div>
    <ul>
      <li><strong>Frente-de-caixa completa no ERP</strong> (<code>/food/pdv/caixa</code>): grid de produtos por categoria, carrinho, customização com modificadores, formas de pagamento (dinheiro/cartão/PIX/vale), desconto, taxa de serviço, pausar/retomar venda</li>
      <li>Shell de operações dedicado: <code>PdvLayout</code>, <code>PdvHeader</code>, <code>PdvSidebar</code>, boot splash, guard <code>isPdvPath</code></li>
      <li><strong>Toda a interface é funcional, porém os dados são locais</strong> — produtos vêm de <code>MOCK_PRODUCT_ITEMS</code> e o estado não persiste (sem sessão de caixa real, sem NFC-e, sem envio ao KDS)</li>
      <li>Rotas <code>/food/pdv/comandas</code> e <code>/food/pdv/pedidos</code> existem como placeholder</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Delta PDV Food</div>
    <ul>
      <li>Interface de toque com fotos do cardápio em grid, otimizada para velocidade</li>
      <li>Modo rápido QSR: lançamento de item + pagamento em &lt; 30 segundos</li>
      <li>Envio automático do pedido ao KDS ao confirmar (ticket de cozinha)</li>
      <li>Fluxo de senha/chamada para retirada no balcão</li>
      <li>Aplicação de modificadores food no lançamento (ponto da carne, adicionais)</li>
    </ul>
    <p style="font-size:13px;color:#78716c;font-style:italic;margin-top:6px">Sessão de caixa, offline-first, meios de pagamento e NFC-e são herdados da base (ver callout acima) — não reimplementados aqui.</p>
  </div>

  <h2>Mockup — PDV Food (Frente de Caixa)</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">🍔 PDV Food — Balcão · Caixa: João</span>
      <span style="margin-left:auto;font-size:11px;opacity:.8">Sessão aberta 08:00 · R$ 1.840 no caixa</span>
    </div>
    <div class="mock-body" style="display:grid;grid-template-columns:1.8fr 1fr;gap:14px">
      <div>
        <div class="mock-label">Cardápio rápido</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">
          <button class="mock-btn mock-btn-outline" style="flex-direction:column;padding:8px 4px;font-size:11px;height:52px">🍔<br>X-Classic<br><span style="color:#e11d48">R$25,90</span></button>
          <button class="mock-btn mock-btn-outline" style="flex-direction:column;padding:8px 4px;font-size:11px;height:52px">🥤<br>Refri<br><span style="color:#e11d48">R$6,00</span></button>
          <button class="mock-btn mock-btn-outline" style="flex-direction:column;padding:8px 4px;font-size:11px;height:52px">🍟<br>Batata G<br><span style="color:#e11d48">R$12,90</span></button>
        </div>
        <input class="mock-input" style="width:100%;margin-bottom:8px" placeholder="🔍 Buscar item ou código…">
      </div>
      <div>
        <div class="mock-label">Pedido atual</div>
        <div style="background:#fff;border:1px solid #fca5a5;border-radius:8px;padding:10px">
          <div class="mock-row"><span style="flex:1;font-size:12px">X-Classic 2×</span><span style="font-size:12px">R$51,80</span></div>
          <div class="mock-row"><span style="flex:1;font-size:12px">Batata G 1×</span><span style="font-size:12px">R$12,90</span></div>
          <div class="mock-divider"></div>
          <div class="mock-row"><span style="flex:1;font-size:13px;font-weight:700">Total</span><span style="font-size:14px;font-weight:800;color:#e11d48">R$64,70</span></div>
          <button class="mock-btn mock-btn-primary" style="width:100%;justify-content:center;margin-top:8px">💳 Cobrar</button>
        </div>
      </div>
    </div>
  </div>

  <h2>Fluxo PDV Balcão (QSR)</h2>
  <div class="mermaid">
sequenceDiagram
  participant Op as Operador (PDV)
  participant KDS
  participant Fiscal
  participant Cliente

  Op->>Op: Abre sessão de caixa (troco inicial R$100)
  Cliente->>Op: Pede X-Burguer + Refri
  Op->>Op: Seleciona itens no grid touch
  Op->>Op: Confirma modificadores (ponto: mal passado)
  Op->>KDS: Envia ticket de produção
  Op->>Op: Seleciona pagamento (PIX)
  Op->>Cliente: Exibe QR PIX na tela virada
  Cliente->>Op: Paga PIX
  Op->>Fiscal: Emite NFC-e automática
  Fiscal->>Cliente: Envia por e-mail/WhatsApp
  KDS->>Op: Bump (pedido pronto)
  Op->>Cliente: Chama senha / entrega
  </div>

  <div class="alert alert-info">
    <span class="alert-icon">🏪</span>
    <div class="alert-body">
      <div class="alert-title">Sessão de caixa, offline-first e meios de pagamento — herdados da base</div>
      <p>Abertura/sangria/suprimento/fechamento (<code>CashSession</code>), estratégia offline-first (Service Worker + IndexedDB + sync) e os meios de pagamento (dinheiro, TEF, PIX) estão documentados em <a href="../wiki-erp/index.html#pdv-caixa">PDV e Caixa</a>. O PDV Food reutiliza tudo isso sem reimplementar.</p>
    </div>
  </div>

  <h2>Delta food — meio de pagamento e relatório</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">🎟️</span> Voucher / Vale-refeição</div>
      <p>Específico do food: ticket restaurante (Sodexo, Alelo, VR). Integração via TEF ou manual — não existe no PDV genérico da base.</p>
    </div>
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">🍔</span> Ticket de cozinha (KDS)</div>
      <p>Ao cobrar, o pedido é roteado ao <a href="#kds">KDS</a> por estação. Diferencial food sobre o fechamento de venda genérico.</p>
    </div>
  </div>
</div>
`
});
