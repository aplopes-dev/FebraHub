WIKI.register({
  id: 'financeiro',
  title: 'Financeiro',
  icon: '💰',
  searchText: 'financeiro DRE caixa contas receber pagar fluxo caixa conciliacao bancaria OFX relatorio',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Financeiro e Fiscal</div>
    <h1 class="section-title">💰 Financeiro</h1>
    <p class="section-subtitle">Gestão financeira da loja — fluxo de caixa, contas a receber e pagar, DRE simplificado e conciliação bancária.</p>
    <div class="section-tags">
      <span class="tag-orange">Financeiro</span>
      <span class="tag-amber">DRE · Caixa · Contas</span>
      <span class="tag-gray">Conciliação OFX</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Fechamento de caixa por sessão PDV funcional</li>
      <li>Registro de pagamentos e repasses no banco</li>
      <li>ERP: tela financeira em mock — sem relatórios de DRE</li>
      <li>Sem módulo de contas a pagar</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Dashboard financeiro: faturamento, ticket médio, margem estimada</li>
      <li>Contas a receber: recebíveis de vendas + prazo de liquidação PSP</li>
      <li>Contas a pagar: aluguel, fornecedores, taxas — vencimentos e alertas</li>
      <li>DRE simplificado: receitas − custos = lucro estimado</li>
      <li>Conciliação OFX: importar extrato bancário e casar com recebimentos</li>
      <li>Exportação CSV/XLSX para integração com ERP contábil (Omie/Conta Azul)</li>
      <li>Centros de custo: categorizar despesas por área da loja</li>
    </ul>
  </div>

  <h2>Dashboard financeiro (proposta)</h2>
  <div class="mockup-container">
    <div class="mock-topbar"><span class="mock-logo" style="color:#fbbf24">💰 Financeiro — Junho/2026</span></div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:14px;">
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#d97706">R$42.8k</div><div class="mock-kpi-sub">Receita bruta</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#ef4444">R$18.2k</div><div class="mock-kpi-sub">Custos e despesas</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#16a34a">R$24.6k</div><div class="mock-kpi-sub">Lucro estimado</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#6366f1">57.5%</div><div class="mock-kpi-sub">Margem</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="background:white;border:1px solid #e7e5e4;border-radius:8px;padding:12px;">
          <div style="font-weight:700;font-size:13px;margin-bottom:8px">📥 A receber</div>
          <div style="font-size:22px;font-weight:800;color:#1e40af">R$5.8k</div>
          <div style="font-size:11px;color:#a8a29e;margin-top:4px">Previsão: próximos 30 dias</div>
        </div>
        <div style="background:white;border:1px solid #e7e5e4;border-radius:8px;padding:12px;">
          <div style="font-weight:700;font-size:13px;margin-bottom:8px">📤 A pagar</div>
          <div style="font-size:22px;font-weight:800;color:#ef4444">R$3.2k</div>
          <div style="font-size:11px;color:#a8a29e;margin-top:4px">Próximos vencimentos</div>
        </div>
      </div>
    </div>
  </div>

  <h2>DRE Simplificado</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Linha</th><th>Descrição</th><th>Mês atual</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Receita Bruta</td><td>Total de vendas (pedidos DELIVERED)</td><td style="color:#16a34a;font-weight:700">R$42.800</td></tr>
        <tr><td>(-) Devoluções</td><td>Estornos e cancelamentos</td><td>R$(320)</td></tr>
        <tr><td class="td-bold">Receita Líquida</td><td>Bruta - devoluções</td><td style="font-weight:700">R$42.480</td></tr>
        <tr><td>(-) Taxa plataforma</td><td>Comissão Citybox</td><td>R$(2.124)</td></tr>
        <tr><td>(-) Taxa PSP</td><td>Gateway de pagamento</td><td>R$(1.062)</td></tr>
        <tr><td>(-) CMV</td><td>Custo das mercadorias vendidas</td><td>R$(12.744)</td></tr>
        <tr><td class="td-bold">Margem de Contribuição</td><td>Líquida - CMV - taxas</td><td style="font-weight:700">R$26.550</td></tr>
        <tr><td>(-) Despesas fixas</td><td>Aluguel, salários, energia</td><td>R$(8.500)</td></tr>
        <tr><td class="td-bold" style="color:#16a34a">Lucro Operacional</td><td>Margem - despesas fixas</td><td style="color:#16a34a;font-weight:800">R$18.050</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Conciliação bancária OFX (proposta)</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">📂</span> Import OFX</div>
      <p>Upload do extrato bancário em formato OFX (todos os bancos suportam). Parsing automático de transações.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🔗</span> Matching automático</div>
      <p>Sistema casa transações do extrato com pagamentos registrados. Apresenta matches e divergências.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">✅</span> Confirmar ou ajustar</div>
      <p>Operador valida matches automáticos ou ajusta manualmente. Gera relatório de diferenças para o contador.</p>
    </div>
  </div>

  <h2>Contas a pagar (proposta)</h2>
  <pre>model Payable {
  id          String      @id @default(cuid())
  storeId     String
  description String      // "Aluguel Julho", "Fornecedor Pão"
  amount      Decimal
  dueDate     Date
  category    PayCategory // RENT | PAYROLL | SUPPLIER | TAX | OTHER
  status      PayStatus   // PENDING | PAID | OVERDUE
  paidAt      DateTime?
  receiptUrl  String?     // comprovante de pagamento
}</pre>
</div>
`
});
