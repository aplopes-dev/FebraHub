WIKI.register({
  id: 'configuracoes-market',
  title: 'Configurações da Loja Market',
  icon: '⚙️',
  searchText: 'configuracoes loja market settings branding horarios canais balanca impressoras etiqueta delivery',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Acesso e Configurações</div>
    <h1 class="section-title">⚙️ Configurações da Loja Market</h1>
    <p class="section-subtitle">Configurações específicas do varejo: identidade visual, horários de funcionamento, canais habilitados, parâmetros da balança, impressoras de etiqueta e regras de delivery.</p>
    <div class="section-tags">
      <span class="tag-green">Configurações</span>
      <span class="tag-emerald">Loja · Canais</span>
      <span class="tag-gray">Balança · Impressoras</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje</div>
    <ul>
      <li>Configurações genéricas de loja disponíveis no ERP base (nome, logo, horários gerais)</li>
      <li>Sem <code>MarketStoreSettings</code> — tabela proposta no schema <code>market</code></li>
      <li>Sem configuração de balança, impressora de etiqueta ou canais market</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Configurações Market</div>
    <ul>
      <li>Identidade visual: logo da loja, cor primária da vitrine, slogan</li>
      <li>Horários: funcionamento por dia da semana, feriados, horário do delivery</li>
      <li>Canais: habilitar/desabilitar PDV físico, delivery próprio, marketplace, lista de compras</li>
      <li>Balança: IP/porta, marca (Toledo/Ramuza), senha de acesso, intervalo de sincronização PLU</li>
      <li>Impressoras: NFC-e (térmica), etiqueta de gôndola (zebra/elgin), etiqueta de pesados</li>
      <li>Delivery: raio máximo, taxa fixa por km, pedido mínimo, tempo estimado, motoboy próprio ou externo</li>
      <li>Validade: regras de rebaixa automática (% por dias antes do vencimento)</li>
    </ul>
  </div>

  <h2>Modelo de configurações market</h2>
  <pre>// Schema: market — tabela MarketStoreSettings
model MarketStoreSettings {
  storeId         String @id

  // Identidade
  logoUrl         String?
  primaryColor    String   @default("#059669")
  tagline         String?

  // Canais habilitados
  pdvEnabled      Boolean  @default(true)
  deliveryEnabled Boolean  @default(false)
  marketplaceEnabled Boolean @default(true)
  shoppingListEnabled Boolean @default(true)

  // Balança
  scaleEnabled    Boolean  @default(false)
  scaleBrand      String?  // "toledo" | "ramuza" | "filizola"
  scaleIp         String?
  scalePort       Int?
  scalePluSyncInterval Int @default(60) // minutos

  // Delivery
  deliveryRadiusKm   Float   @default(3)
  deliveryFeeBase    Int     @default(0)  // centavos
  deliveryFeePerKm   Int     @default(150) // centavos/km
  deliveryMinOrder   Int     @default(3000) // centavos
  deliveryEtaMin     Int     @default(45) // minutos

  // Validade / rebaixa
  expiryAlert30d   Boolean @default(true)
  expiryAlert7d    Boolean @default(true)
  expiryDiscount7d Int     @default(25) // %
  expiryDiscount2d Int     @default(50) // %

  updatedAt       DateTime @updatedAt
}</pre>

  <h2>Configuração de impressoras</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Impressora</th><th>Uso</th><th>Protocolo</th><th>Marcas suportadas</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Térmica PDV</td><td>DANFE NFC-e, comprovante</td><td>ESC/POS USB ou TCP</td><td>Elgin, Bematech, Epson, Daruma</td></tr>
        <tr><td class="td-bold">Etiqueta de gôndola</td><td>Preço, EAN, validade</td><td>ZPL / TSPL TCP</td><td>Zebra, Elgin, Argox, Intermec</td></tr>
        <tr><td class="td-bold">Etiqueta pesados</td><td>EAN-13 prefixo-2, tara, validade</td><td>Integrada na balança Toledo/Ramuza</td><td>Toledo Prix, Ramuza DP</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Tela de configuração de entrega (mockup)</h2>
  <div class="mockup-container">
    <div class="mock-topbar"><span class="mock-logo">⚙️ Configurações — Delivery</span></div>
    <div class="mock-body" style="font-size:12px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="background:#fff;border:1px solid #d1fae5;border-radius:8px;padding:12px">
          <div style="font-weight:700;margin-bottom:8px">🚚 Parâmetros de Entrega</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>Raio máximo</span>
              <div style="display:flex;align-items:center;gap:4px"><input style="width:50px;border:1px solid #6ee7b7;border-radius:4px;padding:3px 6px;font-size:11px" value="5" /><span>km</span></div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>Taxa base</span>
              <div style="display:flex;align-items:center;gap:4px"><span>R$</span><input style="width:50px;border:1px solid #6ee7b7;border-radius:4px;padding:3px 6px;font-size:11px" value="3,00" /></div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>+ por km adicional</span>
              <div style="display:flex;align-items:center;gap:4px"><span>R$</span><input style="width:50px;border:1px solid #6ee7b7;border-radius:4px;padding:3px 6px;font-size:11px" value="1,50" /></div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>Pedido mínimo</span>
              <div style="display:flex;align-items:center;gap:4px"><span>R$</span><input style="width:50px;border:1px solid #6ee7b7;border-radius:4px;padding:3px 6px;font-size:11px" value="30,00" /></div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>Tempo estimado</span>
              <div style="display:flex;align-items:center;gap:4px"><input style="width:50px;border:1px solid #6ee7b7;border-radius:4px;padding:3px 6px;font-size:11px" value="45" /><span>min</span></div>
            </div>
          </div>
        </div>
        <div style="background:#fff;border:1px solid #d1fae5;border-radius:8px;padding:12px">
          <div style="font-weight:700;margin-bottom:8px">🔄 Canais Habilitados</div>
          <div style="display:flex;flex-direction:column;gap:10px;font-size:12px">
            <label style="display:flex;justify-content:space-between;align-items:center">
              <span>PDV Físico</span>
              <span style="background:#059669;color:#fff;border-radius:12px;padding:2px 10px;font-size:10px;font-weight:600">Ativo</span>
            </label>
            <label style="display:flex;justify-content:space-between;align-items:center">
              <span>Delivery Próprio</span>
              <span style="background:#9ca3af;color:#fff;border-radius:12px;padding:2px 10px;font-size:10px;font-weight:600">Inativo</span>
            </label>
            <label style="display:flex;justify-content:space-between;align-items:center">
              <span>Marketplace Citybox</span>
              <span style="background:#059669;color:#fff;border-radius:12px;padding:2px 10px;font-size:10px;font-weight:600">Ativo</span>
            </label>
            <label style="display:flex;justify-content:space-between;align-items:center">
              <span>Lista de Compras</span>
              <span style="background:#059669;color:#fff;border-radius:12px;padding:2px 10px;font-size:10px;font-weight:600">Ativo</span>
            </label>
          </div>
        </div>
      </div>
      <div style="margin-top:10px"><button class="mock-btn mock-btn-primary">💾 Salvar configurações</button></div>
    </div>
  </div>
</div>
`
});
