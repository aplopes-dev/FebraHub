WIKI.register({
  id: 'pagamento-split',
  title: 'Pagamento e Split',
  icon: '🏦',
  searchText: 'pagamento split payment-api multi-PSP PIX cartao split loja plataforma webhook worker payments orders B-06 cobrança charge liquidacao',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Carrinho e Checkout</div>
    <h1 class="section-title">🏦 Pagamento e Split</h1>
    <p class="section-subtitle">O pagamento do Marketplace é processado pelo <code>payment-api</code> (:3106), um serviço isolado que suporta múltiplos PSPs (B-06), PIX e cartão, com split automático entre loja e plataforma.</p>
    <div class="section-tags">
      <span class="tag-indigo">payment-api :3106</span>
      <span class="tag-blue">Multi-PSP B-06</span>
      <span class="tag-violet">PIX</span>
      <span class="tag-purple">Split</span>
    </div>
  </div>

  <div class="eco-callout">
    <div class="eco-icon">🔗</div>
    <div class="eco-body">
      <div class="eco-title">O split aqui origina o repasse ao lojista</div>
      <div class="eco-links">
        A parcela da loja é liquidada e repassada via
        <a href="../wiki-erp/wiki-erp/index.html#pagamentos-repasse">ERP · Pagamentos e Repasse</a>.
        Não confundir com a <strong>assinatura SaaS</strong> da loja, cobrada em
        <a href="../wiki-admin/index.html#faturamento-cobranca">Admin · Faturamento e Cobrança</a>.
      </div>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">🟢 Hoje (MVP)</div>
    <p><code>marketplace-api</code> chama <code>POST /charges</code> no payment-api passando amount + orderId + método. Payment-api cria a cobrança no PSP configurado. Worker <code>workers</code> consome evento <code>payments.orders</code> do RabbitMQ e atualiza o status do pedido. Webhook do PSP para payment-api ainda é stub — confirmação real via worker é o caminho.</p>
  </div>

  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">💡 Proposta (produto alvo)</div>
    <p>PIX com QR Code inline no app. Cartão salvo (tokenizado pelo PSP). Split automático: cada SubOrder recebe seu lote de liquidação separado. Fallback entre PSPs se primário falha (B-06). Estorno parcial (item cancelado). Relatório de repasse para lojistas no ERP.</p>
  </div>

  <h2>Arquitetura de pagamento</h2>
  <div class="mermaid">
flowchart LR
  Core["marketplace-api\n:3101"] -->|"POST /charges\norderId, amount, method"| PA["payment-api\n:3106"]
  PA -->|"cobrança"| PSP["PSP\n(gateway)"]
  PSP -->|"webhook"| PA
  PA -->|"payment.captured"| MQ["RabbitMQ"]
  MQ -->|"payments.orders"| W["workers :3105"]
  W -->|"atualiza status"| DB[("Order\nstatus=PAID")]
  W -->|"push"| RGW["realtime-gateway\n:3104"]
  </div>

  <h2>Métodos de pagamento</h2>
  <div class="card-grid">
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">📱</span> PIX</div>
      <p>Geração de QR Code (EMV) retornado no checkout. App mostra QR inline ou copia chave. Confirmação via webhook PSP → worker em segundos.</p>
    </div>
    <div class="card card-indigo">
      <div class="card-title"><span class="card-icon">💳</span> Cartão de crédito/débito</div>
      <p>Tokenização pelo PSP (PAN nunca chega no Citybox). Cartão salvo para recompra 1-clique. Parcelamento configurável por loja.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">💰</span> Wallet / Saldo</div>
      <p>Créditos Citybox (cashback, vouchers). Subtrai do saldo antes de cobrar método externo. Combina com PIX/cartão.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">💵</span> Pagamento na entrega</div>
      <p>Dinheiro ou maquininha na entrega. Pedido entra como pendente; confirmação manual pelo entregador no app ERP.</p>
    </div>
  </div>

  <h2>Modelo de Split</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Participante</th><th>Valor</th><th>Liquidação</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Loja (SubOrder)</td><td>Subtotal dos itens − taxa de serviço plataforma</td><td>T+1 ou D+1 por contrato</td></tr>
        <tr><td class="td-bold">Plataforma Citybox</td><td>Taxa de serviço (%) + margem de entrega</td><td>Acumulado no período</td></tr>
        <tr><td class="td-bold">Entregador</td><td>Taxa de entrega (se logística própria Citybox)</td><td>Por corrida finalizada</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Estados do pagamento</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Estado</th><th>Descrição</th><th>Ação no app</th></tr></thead>
      <tbody>
        <tr><td><span class="status-badge status-partial">PENDING</span></td><td>PIX aguardando pagamento (TTL 15 min)</td><td>Mostrar QR + contador regressivo</td></tr>
        <tr><td><span class="status-badge status-functional">CAPTURED</span></td><td>Pagamento aprovado pelo PSP</td><td>Avança Order para CONFIRMED → notifica loja</td></tr>
        <tr><td><span class="status-badge status-proposed">SETTLED</span></td><td>Liquidação concluída ao recebedor</td><td>ERP lojista visualiza repasse</td></tr>
        <tr><td><span class="status-badge status-mock">FAILED</span></td><td>Recusado pelo PSP (saldo, limite, etc.)</td><td>App sugere outro método + rollback C-05</td></tr>
        <tr><td><span class="status-badge status-mock">REFUNDED</span></td><td>Estorno total ou parcial</td><td>Crédito no método original ou wallet</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-orange">
    <span class="alert-icon">⚠️</span>
    <div class="alert-body">
      <div class="alert-title">Stub do webhook — risco atual</div>
      <p>O webhook PSP → payment-api está como stub. Na prática, a confirmação de PIX depende do worker consumir <code>payments.orders</code> via RabbitMQ. Se o broker estiver indisponível no momento da confirmação, o pedido pode ficar preso em PENDING. Mitigation: consumer com retry + DLQ; timeout automático + TTL no PIX (15 min).</p>
    </div>
  </div>
</div>
`
});
