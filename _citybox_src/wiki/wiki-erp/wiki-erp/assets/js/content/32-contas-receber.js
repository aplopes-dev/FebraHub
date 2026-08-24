WIKI.register({
  id: 'contas-receber',
  title: 'Contas a Receber',
  icon: '📥',
  searchText: 'contas receber recebiveis faturas prazo PSP cartao boleto inadimplencia liquidacao repasse Receivable settlement',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Financeiro e Fiscal</div>
    <h1 class="section-title">📥 Contas a Receber</h1>
    <p class="section-subtitle">Gestão unificada de todos os recebíveis da loja: vendas à vista, parceladas, repasses PSP, boletos e carnês. Visibilidade completa de quando cada valor entrará na conta.</p>
    <div class="section-tags">
      <span class="tag-orange">AR</span>
      <span class="tag-green">Recebíveis</span>
      <span class="tag-amber">PSP · Cartão · Boleto</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <p>Recebíveis de vendas via PSP/cartão são gerenciados pelo módulo <a href="#pagamentos-repasse">Pagamentos e Repasse</a> (settlement automático). Boletos/carnês manuais não existem. Visão consolidada de recebíveis futuros não está disponível.</p>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Dashboard de recebíveis: hoje, amanhã, semana, mês — por método de pagamento</li>
      <li>Integração automática com repasses PSP (D+1/D+30 cartão crédito)</li>
      <li>Boleto e carnê para clientes PJ ou vendas B2B</li>
      <li>Rastreio de inadimplência: títulos em atraso + régua de cobrança</li>
      <li>Antecipação de recebíveis: projeção de custo vs benefício</li>
      <li>Integração com Fluxo de Caixa e Conciliação Bancária</li>
    </ul>
  </div>

  <h2>Mockup — Contas a Receber</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">📥 Contas a Receber — Junho 2026</span>
      <span style="margin-left:auto;font-size:11px;opacity:.8">R$ 38.640 a receber</span>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px">
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#16a34a">R$ 4.820</div><div class="mock-kpi-sub">Hoje</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#d97706">R$ 12.300</div><div class="mock-kpi-sub">Esta semana</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#6366f1">R$ 21.520</div><div class="mock-kpi-sub">Este mês</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#ef4444">R$ 1.800</div><div class="mock-kpi-sub">Em atraso</div></div>
      </div>
      <table class="mock-table">
        <thead><tr><th>Descrição</th><th>Origem</th><th>Previsão</th><th>Valor</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>Repasse Cartão Crédito</td><td>PSP — iFood</td><td>Hoje</td><td>R$ 4.820</td><td><span class="mock-badge mock-badge-green">Confirmado</span></td></tr>
          <tr><td>Repasse Débito</td><td>PSP — Stone</td><td>Amanhã</td><td>R$ 3.200</td><td><span class="mock-badge mock-badge-blue">Agendado</span></td></tr>
          <tr><td>Crédito 3× PDV #0821</td><td>Cartão crédito</td><td>15/07</td><td>R$ 480</td><td><span class="mock-badge mock-badge-gray">Projetado</span></td></tr>
          <tr><td>Boleto PJ — Cliente ABC</td><td>Boleto</td><td>01/06</td><td>R$ 1.800</td><td><span class="mock-badge mock-badge-red">Vencido</span></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <h2>Origens de recebíveis</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Origem</th><th>Prazo típico</th><th>Gerado por</th><th>Estado</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">PIX</td><td>D+0 (imediato)</td><td>Qualquer venda PIX</td><td><span class="status-badge status-functional">✅ Funcional</span></td></tr>
        <tr><td class="td-bold">Débito</td><td>D+1</td><td>Cartão débito PDV/marketplace</td><td><span class="status-badge status-functional">✅ Funcional</span></td></tr>
        <tr><td class="td-bold">Crédito à vista</td><td>D+30</td><td>Cartão crédito 1×</td><td><span class="status-badge status-functional">✅ Funcional</span></td></tr>
        <tr><td class="td-bold">Crédito parcelado</td><td>D+30/N parcelas</td><td>Cartão crédito N×</td><td><span class="status-badge status-functional">✅ Funcional</span></td></tr>
        <tr><td class="td-bold">Marketplace (repasse)</td><td>Conforme contrato</td><td>iFood, marketplace próprio</td><td><span class="status-badge status-functional">✅ Funcional</span></td></tr>
        <tr><td class="td-bold">Boleto</td><td>Vencimento acordado</td><td>Manual ou emissão ERP</td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
        <tr><td class="td-bold">Carnê</td><td>Parcelas mensais</td><td>Vendas a prazo B2B/B2C</td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-amber">
    <span class="alert-icon">⚠️</span>
    <div class="alert-body">
      <div class="alert-title">Atenção: Contas a Receber vs Pagamentos e Repasse</div>
      <p>O módulo <a href="#pagamentos-repasse">Pagamentos e Repasse</a> trata da liquidação técnica de pagamentos via PSP (charge → capture → settlement). Contas a Receber é a visão financeira da loja: <em>quando o dinheiro entra na conta</em>. São complementares — os repasses PSP alimentam automaticamente os recebíveis.</p>
    </div>
  </div>
</div>
`
});
