WIKI.register({
  id: 'crm-fidelidade-market',
  title: 'CRM e Fidelidade',
  icon: '🎯',
  searchText: 'CRM fidelidade clube desconto cashback cesta media recompra customer retention pontos fidelizacao varejo mercado',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Clientes e Marketplace</div>
    <h1 class="section-title">🎯 CRM e Fidelidade</h1>
    <p class="section-subtitle">Clube de desconto, cashback e fidelização para supermercados e mercearias — a arma mais eficaz de retenção no varejo de bairro, onde o cliente compra toda semana.</p>
    <div class="section-tags">
      <span class="tag-green">CRM</span>
      <span class="tag-emerald">Clube de Desconto</span>
      <span class="tag-amber">Cashback</span>
      <span class="tag-gray">Cesta Média</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje</div>
    <ul>
      <li>Sem CRM — rota <code>/varejo/clientes</code> é placeholder</li>
      <li>Sem histórico de compras por CPF</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — CRM Market</div>
    <ul>
      <li>Cadastro de cliente por CPF: nome, telefone, e-mail, endereço, aniversário</li>
      <li>Histórico de compras: todas as NFC-e vinculadas ao CPF do cliente</li>
      <li>Clube de desconto: preço especial de sócio no PDV (scan do cartão ou CPF)</li>
      <li>Cashback: % das compras devolvido como crédito para próxima compra</li>
      <li>Pontos: acúmulo por R$ gasto, resgate em produtos ou descontos</li>
      <li>Cesta média: ticket médio, frequência, últimos produtos comprados</li>
      <li>Segmentação: clientes inativos (>30d), alto valor, risco de churn</li>
    </ul>
  </div>

  <div class="herda-base-callout">
    <span class="hb-icon">🏪</span>
    <div class="hb-body">
      <div class="hb-title">Herda do ERP Base — CRM e Fidelidade Canônicos</div>
      <div class="hb-links">Esta vertical herda: <a href="../wiki-erp/index.html#clientes-crm">CRM de Clientes</a> (perfil, histórico, segmentação) · <a href="../wiki-erp/index.html#fidelidade">Programa de Fidelidade</a> (pontos, cashback, tiers base). Esta seção documenta <strong>apenas o delta market</strong>: clube de desconto por produto, cashback em categorias parceiras, frequência semanal e cesta média.</div>
    </div>
  </div>

  <h2>Tipos de programa de fidelidade</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tipo</th><th>Mecânica</th><th>Melhor para</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Clube de Desconto</td><td>Preço especial para CPF cadastrado</td><td>Supermercado de bairro, mercearia</td></tr>
        <tr><td class="td-bold">Cashback</td><td>% do valor volta como crédito (3-5%)</td><td>Conveniência, engajamento digital</td></tr>
        <tr><td class="td-bold">Pontos</td><td>1 ponto por R$1 gasto, catálogo de prêmios</td><td>Supermercados maiores, redes</td></tr>
        <tr><td class="td-bold">Benefício por categoria</td><td>Desconto exclusivo em carnes, hortifrúti</td><td>Reduzir churn em categorias-chave</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Fluxo no PDV com identificação do cliente</h2>
  <div class="mermaid">
sequenceDiagram
  participant PDV
  participant CRM
  participant MotorPromo as Motor Preço Sócio

  PDV->>CRM: Consulta CPF "123.456.789-00"
  CRM->>PDV: Cliente: Maria Silva · Sócia Ouro · Cashback: R$8,40
  PDV->>MotorPromo: Aplica preços de sócio nos itens
  MotorPromo->>PDV: Desconto clube em carnes: -10%
  PDV->>PDV: Venda finalizada (R$87,50)
  PDV->>CRM: Registra compra · Adiciona 87 pontos
  CRM->>CRM: Calcula cashback 3% = R$2,63
  CRM->>CRM: Verifica: última compra há 7 dias (frequente)
  </div>

  <h2>Painel CRM — visão do cliente</h2>
  <div class="mockup-container">
    <div class="mock-topbar"><span class="mock-logo">🎯 CRM — Maria Silva · CPF 123.456.789-00</span></div>
    <div class="mock-body" style="font-size:11px">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px">
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#059669">R$2.840</div><div class="mock-kpi-sub">Total 90 dias</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#059669">12</div><div class="mock-kpi-sub">Visitas / 30d</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#059669">R$8,40</div><div class="mock-kpi-sub">Cashback disponível</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#059669">847</div><div class="mock-kpi-sub">Pontos acumulados</div></div>
      </div>
      <div style="background:#fff;border:1px solid #d1fae5;border-radius:8px;padding:8px">
        <div style="font-weight:700;margin-bottom:6px">Últimas compras</div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0fdf4">
          <span>14/06/2025 — NFC-e 004521</span>
          <span style="font-weight:600">R$87,50 · <span class="mock-badge mock-badge-green">+87 pts</span></span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0fdf4">
          <span>07/06/2025 — NFC-e 004388</span>
          <span style="font-weight:600">R$124,30</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:4px 0">
          <span>31/05/2025 — NFC-e 004201</span>
          <span style="font-weight:600">R$98,00</span>
        </div>
      </div>
    </div>
  </div>
</div>
`
});
