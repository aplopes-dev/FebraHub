WIKI.register({
  id: 'pagamentos-repasse',
  title: 'Pagamentos e Repasse',
  icon: '💳',
  searchText: 'pagamentos repasse split PSP stripe pagseguro cielo settlement liquidacao multi-PSP',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Financeiro e Fiscal</div>
    <h1 class="section-title">💳 Pagamentos e Repasse</h1>
    <p class="section-subtitle">Processamento de pagamentos multi-PSP, split automático entre loja e plataforma, liquidação e repasse ao lojista.</p>
    <div class="section-tags">
      <span class="tag-orange">Pagamentos</span>
      <span class="tag-amber">Split · Settlement</span>
      <span class="tag-blue">Multi-PSP</span>
    </div>
  </div>

  <div class="eco-callout">
    <div class="eco-icon">🔗</div>
    <div class="eco-body">
      <div class="eco-title">Split na ponta do consumidor, assinatura na ponta da plataforma</div>
      <div class="eco-links">
        O split que origina o repasse acontece no
        <a href="../../wiki-marketplace/index.html#pagamento-split">Marketplace · Pagamento e Split</a>.
        Já a cobrança da <strong>assinatura SaaS</strong> da loja é outro fluxo, em
        <a href="../../wiki-admin/index.html#faturamento-cobranca">Admin · Faturamento e Cobrança</a>.
      </div>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li><code>services/payment-api</code>: processamento de pagamentos funcional</li>
      <li>Split de pagamento entre loja e plataforma</li>
      <li>Suporte a cartão de crédito/débito e PIX</li>
      <li>Settlement agendado (workers)</li>
      <li>ERP: tela financeira em mock — sem visibilidade de repasses</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Dashboard de recebíveis: a receber, recebido, em disputa</li>
      <li>Múltiplos PSPs: Stripe + PagSeguro + Cielo + Pix Direto</li>
      <li>Antecipação de recebíveis: lojista solicita antecipação com taxa</li>
      <li>Estorno parcial/total com repasse automático ao cliente</li>
      <li>Relatório de repasse por período com PDF/XLSX</li>
      <li>Conciliação automática: payment event vs. extrato bancário</li>
    </ul>
  </div>

  <h2>Fluxo de pagamento e split</h2>
  <div class="mermaid">
sequenceDiagram
  participant Client as Cliente
  participant PayAPI as payment-api
  participant PSP as PSP (Stripe/PagSeg)
  participant Worker as settlement-worker
  participant Store as Conta Loja
  participant Plat as Conta Plataforma

  Client->>PayAPI: POST /payments { orderId, method, amount }
  PayAPI->>PSP: Charge R$50,00
  PSP-->>PayAPI: payment.authorized
  PayAPI->>DB: Payment { status: AUTHORIZED, grossAmount: 50 }
  PayAPI->>DB: PaymentSplit { storeShare: 47,50 (95%), platformShare: 2,50 (5%) }

  Note over Worker: D+2 liquidação
  PSP-->>Worker: webhook settlement
  Worker->>Store: Transferir R$47,50
  Worker->>Plat: Registrar R$2,50 receita
  Worker->>DB: Payment { status: SETTLED, settledAt: now }
  </div>

  <h2>Métodos de pagamento suportados</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método</th><th>Status</th><th>Liquidação</th><th>Split</th></tr></thead>
      <tbody>
        <tr><td>PIX</td><td><span class="status-badge status-functional">✅ Funcional</span></td><td>D+0</td><td>Automático</td></tr>
        <tr><td>Cartão Crédito</td><td><span class="status-badge status-functional">✅ Funcional</span></td><td>D+30</td><td>Automático</td></tr>
        <tr><td>Cartão Débito</td><td><span class="status-badge status-functional">✅ Funcional</span></td><td>D+1</td><td>Automático</td></tr>
        <tr><td>Dinheiro (PDV)</td><td><span class="status-badge status-mock">⚠ Mock</span></td><td>Imediato</td><td>Manual</td></tr>
        <tr><td>Cartão na entrega</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>D+1</td><td>Automático</td></tr>
        <tr><td>Vale refeição (VR/Sodexo)</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>D+5</td><td>Automático</td></tr>
        <tr><td>Crédito Citybox (Wallet)</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>Imediato</td><td>Automático</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Dashboard de recebíveis (proposta)</h2>
  <div class="mockup-container">
    <div class="mock-topbar"><span class="mock-logo" style="color:#fbbf24">💳 Recebíveis — Junho/2026</span></div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:14px;">
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#d97706">R$18.4k</div><div class="mock-kpi-sub">Total no mês</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#16a34a">R$12.1k</div><div class="mock-kpi-sub">Já recebido</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#1e40af">R$5.8k</div><div class="mock-kpi-sub">A receber</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#ef4444">R$0.5k</div><div class="mock-kpi-sub">Em disputa</div></div>
      </div>
      <div style="font-size:13px;color:#57534e;background:white;border:1px solid #e7e5e4;border-radius:8px;padding:12px;">
        <div style="font-weight:700;margin-bottom:8px">Próximos repasses</div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6">
          <span>PIX — 18/06/2026</span><span style="font-weight:600;color:#16a34a">R$1.240,00</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6">
          <span>Crédito — 28/06/2026</span><span style="font-weight:600;color:#1e40af">R$3.200,00</span>
        </div>
      </div>
    </div>
  </div>

  <h2>Comissão e split (configuração)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Canal</th><th>Taxa Plataforma</th><th>Taxa PSP</th><th>Líquido Loja</th></tr></thead>
      <tbody>
        <tr><td>Marketplace (delivery)</td><td>12%</td><td>2.5%</td><td>85.5%</td></tr>
        <tr><td>PDV presencial</td><td>0%</td><td>2.5%</td><td>97.5%</td></tr>
        <tr><td>Checkout online (loja)</td><td>5%</td><td>2.5%</td><td>92.5%</td></tr>
        <tr><td>PIX (qualquer canal)</td><td>Conforme canal</td><td>0.99%</td><td>Melhor margem</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
