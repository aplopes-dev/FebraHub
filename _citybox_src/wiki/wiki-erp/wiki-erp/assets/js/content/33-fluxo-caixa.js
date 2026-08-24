WIKI.register({
  id: 'fluxo-caixa',
  title: 'Fluxo de Caixa',
  icon: '📊',
  searchText: 'fluxo caixa entradas saidas projecao saldo conta corrente DFC diario mensal acumulado previsao liquidez',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Financeiro e Fiscal</div>
    <h1 class="section-title">📊 Fluxo de Caixa</h1>
    <p class="section-subtitle">Visão consolidada de todas as entradas e saídas financeiras da loja, com projeção futura baseada em contas a receber e a pagar. O Fluxo de Caixa é o indicador central de saúde financeira operacional.</p>
    <div class="section-tags">
      <span class="tag-orange">DFC</span>
      <span class="tag-amber">Entradas · Saídas</span>
      <span class="tag-green">Liquidez</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <p>O único fluxo de caixa disponível é o fechamento de sessão de caixa PDV (módulo <a href="#pdv-caixa">PDV e Caixa</a>). Não existe visão consolidada de entradas + saídas ou projeção futura.</p>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Fluxo diário: entradas confirmadas + saídas pagas + saldo do dia</li>
      <li>Projeção: entradas projetadas (recebíveis) vs saídas projetadas (a pagar)</li>
      <li>Saldo acumulado por data (curva de caixa)</li>
      <li>Filtro por conta bancária, categoria, período</li>
      <li>Alerta de caixa negativo projetado: aviso antecipado de insuficiência</li>
      <li>Export CSV/XLSX para contabilidade externa</li>
    </ul>
  </div>

  <h2>Mockup — Fluxo de Caixa</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">📊 Fluxo de Caixa — Junho 2026</span>
      <span style="margin-left:auto;font-size:11px;opacity:.8">Conta Bradesco ****4521</span>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#16a34a">+ R$ 38.640</div><div class="mock-kpi-sub">Entradas previstas</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#ef4444">− R$ 14.320</div><div class="mock-kpi-sub">Saídas previstas</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#6366f1">R$ 24.320</div><div class="mock-kpi-sub">Saldo projetado</div></div>
      </div>
      <div class="mock-label">Linha do tempo — próximos 7 dias</div>
      <table class="mock-table">
        <thead><tr><th>Data</th><th>Entradas</th><th>Saídas</th><th>Saldo do dia</th><th>Saldo acumulado</th></tr></thead>
        <tbody>
          <tr><td><strong>Hoje (21/06)</strong></td><td style="color:#16a34a">+ R$ 4.820</td><td style="color:#ef4444">− R$ 2.800</td><td>+ R$ 2.020</td><td>R$ 12.340</td></tr>
          <tr><td>22/06</td><td style="color:#16a34a">+ R$ 3.200</td><td style="color:#ef4444">− R$ 1.400</td><td>+ R$ 1.800</td><td>R$ 14.140</td></tr>
          <tr><td>23/06</td><td style="color:#6b7280">R$ 0</td><td style="color:#ef4444">− R$ 320</td><td>− R$ 320</td><td>R$ 13.820</td></tr>
          <tr><td>24/06</td><td style="color:#16a34a">+ R$ 2.100</td><td style="color:#6b7280">R$ 0</td><td>+ R$ 2.100</td><td>R$ 15.920</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <h2>Classificação de lançamentos</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tipo</th><th>Origem automática</th><th>Manual</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Entrada — Venda</td><td>Repasse PSP confirmado, fechamento PDV</td><td>Entrada avulsa</td></tr>
        <tr><td class="td-bold">Entrada — Outras</td><td>—</td><td>Empréstimo, aporte de capital</td></tr>
        <tr><td class="td-bold">Saída — Fornecedor</td><td>Título pago em Contas a Pagar</td><td>Pagamento avulso</td></tr>
        <tr><td class="td-bold">Saída — Operacional</td><td>Título pago (aluguel, folha, taxas)</td><td>Pagamento avulso</td></tr>
        <tr><td class="td-bold">Saída — Investimento</td><td>—</td><td>Compra de equipamento</td></tr>
        <tr><td class="td-bold">Transferência entre contas</td><td>—</td><td>Caixa PDV → conta corrente</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Integração com outros módulos</h2>
  <div class="mermaid">
flowchart LR
  AR["Contas a Receber\n(entradas projetadas)"] --> FC["Fluxo de Caixa\n(visão consolidada)"]
  AP["Contas a Pagar\n(saídas projetadas)"] --> FC
  PDV["Fechamento PDV\n(caixa realizado)"] --> FC
  CB["Conciliação Bancária\n(extrato confirmado)"] --> FC
  FC --> DRE["DRE\n(resultado do período)"]
  </div>
</div>
`
});
