WIKI.register({
  id: 'faturamento-cobranca',
  title: 'Faturamento e Cobrança',
  icon: '🧾',
  searchText: 'faturamento cobrança billing Stripe gateway PIX boleto cartão NF-e NFS-e repasses settlements inadimplência webhook fatura assinatura',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Planos e Financeiro</div>
  <h1 class="section-title">🧾 Faturamento e Cobrança</h1>
  <p class="section-subtitle">Design completo do módulo de billing — gateway de pagamento, geração de faturas, métodos de pagamento, emissão fiscal e repasses para lojistas.</p>
  <div class="section-tags">
    <span class="tag-teal">Stripe</span>
    <span class="tag-blue">PIX · Boleto · Cartão</span>
    <span class="tag-purple">NF-e · NFS-e</span>
    <span class="status-badge status-proposed">🔵 Feature nova</span>
    <span class="tag-p1">P1</span>
  </div>
</div>

<div class="eco-callout">
  <div class="eco-icon">🔗</div>
  <div class="eco-body">
    <div class="eco-title">Dois fluxos de dinheiro distintos</div>
    <div class="eco-links">
      Aqui é o <strong>SaaS billing</strong> (a Citybox cobra do lojista a assinatura do plano).
      O <strong>repasse das vendas</strong> (a Citybox repassa ao lojista o que o consumidor pagou)
      é outro fluxo: ver <a href="../wiki-erp/wiki-erp/index.html#pagamentos-repasse">ERP · Pagamentos e Repasse</a>
      e o split no <a href="../wiki-marketplace/index.html#pagamento-split">Marketplace · Pagamento e Split</a>.
    </div>
  </div>
</div>

<h2>Arquitetura de billing</h2>
<div class="mermaid">
flowchart TB
  Client[Cliente assina plano] --> Sub[Assinatura criada no Stripe]
  Sub --> Invoice[Stripe gera fatura automática]
  Invoice -->|Webhook invoice.created| API[Platform API]
  API --> InvoiceDB[(Tabela invoices)]

  InvoiceDB --> PayMethod{Método de pagamento}
  PayMethod -->|Cartão| Stripe[Stripe auto-charge]
  PayMethod -->|PIX| PIXGen[Gerar QR Code PIX]
  PayMethod -->|Boleto| BoletoGen[Gerar boleto bancário]

  Stripe -->|invoice.paid webhook| PaidHandler[Marca: paga + emite NF]
  PIXGen -->|Pix pago| PaidHandler
  BoletoGen -->|Boleto compensado| PaidHandler

  PaidHandler --> NFE[Emissão NF-e / NFS-e]
  PaidHandler --> Settlement[Agenda repasse ao lojista]
</div>

<h2>Ciclo de vida de uma fatura</h2>
<div class="mermaid">
stateDiagram-v2
  [*] --> draft: Criada (D-3)
  draft --> open: Enviada ao cliente
  open --> paid: Paga
  open --> past_due: Vencida sem pagamento
  past_due --> paid: Paga após dunning
  past_due --> void: Cancelada por admin
  paid --> [*]
  void --> [*]
</div>

<h2>Mockup — Painel de faturas</h2>
<div class="mockup-container">
  <div class="mock-topbar">
    <span class="mock-logo">🧾 Faturamento</span>
    <span style="margin-left:auto;display:flex;gap:6px;">
      <span class="mock-badge mock-badge-green">R$ 238k recebido</span>
      <span class="mock-badge mock-badge-red">R$ 12k vencido</span>
      <span class="mock-badge mock-badge-gray">Exportar</span>
    </span>
  </div>
  <div class="mock-body">
    <table class="mock-table">
      <thead><tr><th>Fatura</th><th>Cliente</th><th>Método</th><th>Venc.</th><th>Valor</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>#4988</td><td>MercadoBom Ltda</td><td><span class="mock-badge mock-badge-blue">Cartão</span></td><td>10/08</td><td>R$ 1.890</td><td><span class="mock-badge mock-badge-green">Paga</span></td></tr>
        <tr><td>#4990</td><td>Padaria Sol</td><td><span class="mock-badge mock-badge-teal">PIX</span></td><td>12/08</td><td>R$ 490</td><td><span class="mock-badge mock-badge-yellow">Pendente</span></td></tr>
        <tr><td>#4902</td><td>VarejoX S.A.</td><td><span class="mock-badge mock-badge-gray">Boleto</span></td><td>10/07</td><td>R$ 4.200</td><td><span class="mock-badge mock-badge-red">Vencida · D+12</span></td></tr>
      </tbody>
    </table>
  </div>
</div>
<p class="mermaid-caption">Wireframe ilustrativo do painel de cobrança: faturas por método (cartão/PIX/boleto), status e régua de dunning (D+ vencida). Sincronizado via webhooks do Stripe.</p>

<h2>Métodos de pagamento</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Método</th><th>Processador</th><th>Automático?</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">Cartão de crédito</td><td>Stripe</td><td>✅ Cobrança automática no vencimento</td><td><span class="status-badge status-proposed">🔵</span></td></tr>
      <tr><td class="td-bold">PIX</td><td>Stripe / Gerencianet</td><td>❌ QR Code gerado, cliente paga manualmente</td><td><span class="status-badge status-proposed">🔵</span></td></tr>
      <tr><td class="td-bold">Boleto bancário</td><td>Stripe / Boleto Cloud</td><td>❌ Boleto gerado, cliente paga manualmente</td><td><span class="status-badge status-proposed">🔵</span></td></tr>
    </tbody>
  </table>
</div>

<h2>Emissão fiscal</h2>
<div class="card-grid">
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">📄</span> NF-e / NFS-e</div>
    <p>Emitida automaticamente após confirmação de pagamento. Integração com Plugnotas ou NFe.io. PDF enviado por e-mail ao responsável do cliente.</p>
    <p><strong>Tipo:</strong> NFS-e para serviços SaaS (código de serviço: 1.07).</p>
  </div>
  <div class="card card-blue">
    <div class="card-title"><span class="card-icon">🏦</span> Repasses (Settlements)</div>
    <p>Valor das vendas das lojas repassado para conta do lojista após D+2 (cartão) ou imediato (PIX). Registrado em <code>settlements</code> no banco.</p>
  </div>
</div>

<h2>Régua de dunning</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Dia</th><th>Ação</th><th>Canal</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">D+0 (vencimento)</td><td>Notificação de vencimento</td><td>E-mail automático</td></tr>
      <tr><td class="td-bold">D+3</td><td>2ª tentativa de cobrança no cartão</td><td>Stripe retry + e-mail</td></tr>
      <tr><td class="td-bold">D+7</td><td>Cobrança manual + WhatsApp</td><td>Alerta no Admin + WhatsApp</td></tr>
      <tr><td class="td-bold">D+15</td><td>Alerta crítico para operador</td><td>Notificação no Admin</td></tr>
      <tr><td class="td-bold">D+30</td><td>Suspensão automática</td><td>Status → suspenso</td></tr>
    </tbody>
  </table>
</div>
`
});
