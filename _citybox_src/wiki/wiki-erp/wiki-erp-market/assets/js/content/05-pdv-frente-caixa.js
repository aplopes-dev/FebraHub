WIKI.register({
  id: 'pdv-frente-caixa',
  title: 'PDV — Frente de Caixa',
  icon: '🖥️',
  searchText: 'pdv frente caixa ponto de venda checkout leitor codigo barras offline sangria suprimento abertura fechamento caixa NFC-e fiscal',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Frente de Caixa</div>
    <h1 class="section-title">🖥️ PDV — Frente de Caixa</h1>
    <p class="section-subtitle">O coração do varejo: PDV de alta performance com leitor de código de barras, integração com balança, offline-first, motor de promoções, gestão de sessão de caixa e emissão automática de NFC-e.</p>
    <div class="section-tags">
      <span class="tag-green">PDV</span>
      <span class="tag-emerald">Offline-first</span>
      <span class="tag-amber">NFC-e · SAT</span>
      <span class="tag-gray">Sessão de Caixa</span>
    </div>
  </div>

  <div class="herda-base-callout">
    <span class="hb-icon">🏪</span>
    <div class="hb-body">
      <div class="hb-title">Herda do ERP Base — PDV e Caixa Canônico</div>
      <div class="hb-links">Esta vertical herda o <a href="../wiki-erp/index.html#pdv-caixa">PDV e Caixa</a>: sessão de caixa (<code>CashSession</code>, abertura/sangria/suprimento/fechamento), offline-first (SQLite + sync) e meios de pagamento. Esta seção documenta <strong>apenas o delta market</strong>: scan de EAN, integração com balança/PLU, motor de promoções no caixa, múltiplos caixas simultâneos e contingência SAT/MFE.</div>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (Scaffold)</div>
    <ul>
      <li>Rota <code>/varejo/caixa/pdv</code> existe no menu do ERP — página placeholder</li>
      <li>Sem implementação de PDV, gestão de sessão ou NFC-e</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Delta PDV Varejo</div>
    <ul>
      <li>Interface otimizada para teclado + leitor de código de barras USB/Bluetooth</li>
      <li>Lookup instantâneo por EAN: produto → preço → promoção → subtotal</li>
      <li>Integração com balança: tecla de chamada PLU e decodificação de EAN-prefixo-2</li>
      <li>Motor de promoções no caixa: leve-3-pague-2, desconto por volume, preço atacado por CNPJ</li>
      <li>Vale alimentação como meio de pagamento (delta varejo)</li>
      <li>Múltiplos caixas simultâneos na mesma loja</li>
      <li>Contingência SAT/MFE em caso de SEFAZ offline</li>
    </ul>
    <p style="font-size:13px;color:#78716c;font-style:italic;margin-top:6px">Sessão de caixa, offline-first e meios de pagamento base são herdados de <a href="../wiki-erp/index.html#pdv-caixa">PDV e Caixa</a> — não reimplementados aqui.</p>
  </div>

  <h2>Mockup da interface do PDV</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">🖥️ PDV — Loja Central</span>
      <span style="margin-left:auto;font-size:11px;opacity:.8">Caixa 1 · Operadora: Maria Silva · 14:30</span>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:1fr 300px;gap:12px">
        <div>
          <div style="background:#fff;border:1px solid #6ee7b7;border-radius:8px;padding:10px;margin-bottom:8px;font-size:12px;display:flex;align-items:center;gap:8px">
            <span style="font-size:18px">🔍</span>
            <span style="flex:1;color:#9ca3af">Aguardando scan de código de barras…</span>
            <span style="font-size:11px;background:#f0fdf4;padding:3px 8px;border-radius:4px;color:#059669">PRONTO</span>
          </div>
          <div style="background:#fff;border:1px solid #d1fae5;border-radius:8px;padding:8px;font-size:12px">
            <div style="font-weight:700;margin-bottom:8px;color:#052e1a">Itens da venda</div>
            <div style="display:grid;grid-template-columns:1fr auto auto;gap:4px;align-items:center;padding:6px 0;border-bottom:1px solid #f0fdf4;font-size:11px">
              <span>Arroz Camil 5kg (EAN: 7896006704094)</span>
              <span style="color:#6b7280">1 un</span>
              <span style="font-weight:700;color:#052e1a">R$24,90</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr auto auto;gap:4px;align-items:center;padding:6px 0;border-bottom:1px solid #f0fdf4;font-size:11px">
              <span>Peito Frango s/Osso <span class="mock-badge mock-badge-blue">⚖️ 1,237kg</span></span>
              <span style="color:#6b7280">1 un</span>
              <span style="font-weight:700;color:#052e1a">R$24,62</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr auto auto;gap:4px;align-items:center;padding:6px 0;font-size:11px">
              <span>Coca-Cola 2L <span class="mock-badge mock-badge-green">LEVE 3 PAGUE 2</span></span>
              <span style="color:#6b7280">3 un</span>
              <span style="font-weight:700;color:#059669">R$17,90 <s style="font-size:10px;color:#9ca3af">R$26,85</s></span>
            </div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div class="mock-kpi" style="padding:14px">
            <div class="mock-kpi-value" style="color:#059669">R$67,42</div>
            <div class="mock-kpi-sub">Total da venda</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px">
            <button class="mock-btn mock-btn-primary" style="font-size:11px;justify-content:center">💳 Cartão</button>
            <button class="mock-btn mock-btn-outline" style="font-size:11px;justify-content:center">💵 Dinheiro</button>
            <button class="mock-btn mock-btn-outline" style="font-size:11px;justify-content:center">📱 PIX</button>
            <button class="mock-btn mock-btn-outline" style="font-size:11px;justify-content:center">🍽️ Vale</button>
          </div>
          <button class="mock-btn mock-btn-primary" style="justify-content:center">✅ Finalizar Venda</button>
          <button style="padding:7px;background:#fee2e2;border:1.5px solid #fca5a5;color:#991b1b;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer">🗑️ Cancelar Venda</button>
        </div>
      </div>
    </div>
  </div>

  <h2>Gestão de sessão de caixa</h2>
  <div class="mermaid">
stateDiagram-v2
  [*] --> Fechado
  Fechado --> Aberto : Abertura de Caixa
  Aberto --> EmVenda : Scan produto
  EmVenda --> Aberto : Venda finalizada
  Aberto --> Aberto : Sangria ou Suprimento
  Aberto --> Fechado : Fechamento do dia
  Fechado --> [*]
  </div>

  <h2>Relatório de fechamento (Relatório Z)</h2>
  <pre>RELATÓRIO Z — CAIXA 1
Abertura: 08:00 · Fechamento: 18:00
Operadora: Maria Silva

VENDAS
  Total bruto:         R$  4.832,50
  Descontos:          -R$    143,20
  Total líquido:       R$  4.689,30

PAGAMENTOS
  Dinheiro:            R$  1.200,00
  Cartão Débito:       R$  1.891,30
  Cartão Crédito:      R$  1.382,00
  PIX:                 R$    216,00

CAIXA FÍSICO
  Fundo de troco:      R$    200,00
  Sangrias:           -R$    800,00
  Entradas físicas:    R$  1.200,00
  Saldo esperado:      R$    600,00

NF-e emitidas: 247 · Canceladas: 3</pre>
</div>
`
});
