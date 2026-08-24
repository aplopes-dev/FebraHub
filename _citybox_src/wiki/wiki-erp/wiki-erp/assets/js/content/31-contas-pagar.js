WIKI.register({
  id: 'contas-pagar',
  title: 'Contas a Pagar',
  icon: '📤',
  searchText: 'contas pagar titulos vencimento aprovacao baixa fornecedores despesas aluguel taxa parcela Payable fluxo saidas',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Financeiro e Fiscal</div>
    <h1 class="section-title">📤 Contas a Pagar</h1>
    <p class="section-subtitle">Gestão de todas as obrigações financeiras da loja: fornecedores, aluguel, taxas, serviços e encargos. Controle de vencimentos, aprovação e baixa integrados ao Fluxo de Caixa.</p>
    <div class="section-tags">
      <span class="tag-orange">AP</span>
      <span class="tag-amber">Contas a Pagar</span>
      <span class="tag-gray">Payable</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <p>Não há módulo de contas a pagar implementado. Fornecedores são pagos fora do sistema. Compras geradas no ERP não criam títulos automaticamente. Módulo está planejado como próxima fase financeira.</p>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Cadastro de título: fornecedor, categoria, valor, vencimento, parcelas</li>
      <li>Fluxo de aprovação: rascunho → aguardando aprovação → aprovado → pago</li>
      <li>Baixa manual ou automática via confirmação bancária (OFX)</li>
      <li>Alertas de vencimento: 7 dias, 3 dias, vencido (push + email)</li>
      <li>Categorias de despesa: compras/fornecedores, aluguel, folha, marketing, taxas</li>
      <li>Recorrências: lançamentos fixos mensais (aluguel, mensalidade SaaS)</li>
      <li>Integração com Fluxo de Caixa e DRE</li>
    </ul>
  </div>

  <h2>Mockup — Contas a Pagar</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">📤 Contas a Pagar — Junho 2026</span>
      <span style="margin-left:auto;font-size:11px;opacity:.8">R$ 14.320,00 a vencer</span>
      <button class="mock-btn mock-btn-outline" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.4);font-size:11px">+ Novo título</button>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px">
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#ef4444">R$ 4.200</div><div class="mock-kpi-sub">Vencidos</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#d97706">R$ 6.320</div><div class="mock-kpi-sub">Esta semana</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#6b7280">R$ 3.800</div><div class="mock-kpi-sub">Próx. 30 dias</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#16a34a">R$ 22.100</div><div class="mock-kpi-sub">Pago no mês</div></div>
      </div>
      <table class="mock-table">
        <thead><tr><th>Descrição</th><th>Fornecedor</th><th>Vencimento</th><th>Valor</th><th>Status</th><th>Ação</th></tr></thead>
        <tbody>
          <tr><td>Aluguel Jun/26</td><td>Imobiliária X</td><td>05/06</td><td>R$ 2.800</td><td><span class="mock-badge mock-badge-red">Vencido</span></td><td><button class="mock-btn mock-btn-primary" style="font-size:10px;padding:4px 8px">Baixar</button></td></tr>
          <tr><td>Nota Fiscal 4821</td><td>Distribuidora ABC</td><td>10/06</td><td>R$ 1.400</td><td><span class="mock-badge mock-badge-yellow">Próximo</span></td><td><button class="mock-btn mock-btn-primary" style="font-size:10px;padding:4px 8px">Baixar</button></td></tr>
          <tr><td>Licença ERP</td><td>Citybox</td><td>15/06</td><td>R$ 320</td><td><span class="mock-badge mock-badge-blue">Aprovado</span></td><td><button class="mock-btn mock-btn-outline" style="font-size:10px;padding:4px 8px">Ver</button></td></tr>
          <tr><td>Folha de Pessoal</td><td>—</td><td>05/07</td><td>R$ 6.200</td><td><span class="mock-badge mock-badge-gray">Rascunho</span></td><td><button class="mock-btn mock-btn-outline" style="font-size:10px;padding:4px 8px">Editar</button></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <h2>Modelo de dados — <code>Payable</code></h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Campo</th><th>Tipo</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">id</td><td>UUID</td><td>Identificador único</td></tr>
        <tr><td class="td-bold">storeId</td><td>UUID</td><td>Loja proprietária</td></tr>
        <tr><td class="td-bold">description</td><td>string</td><td>Descrição do título</td></tr>
        <tr><td class="td-bold">supplierId</td><td>UUID?</td><td>Fornecedor vinculado (opcional)</td></tr>
        <tr><td class="td-bold">category</td><td>enum</td><td>SUPPLIES | RENT | PAYROLL | FEES | MARKETING | OTHER</td></tr>
        <tr><td class="td-bold">amount</td><td>decimal</td><td>Valor do título</td></tr>
        <tr><td class="td-bold">dueDate</td><td>date</td><td>Data de vencimento</td></tr>
        <tr><td class="td-bold">status</td><td>enum</td><td>DRAFT | PENDING_APPROVAL | APPROVED | PAID | OVERDUE | CANCELLED</td></tr>
        <tr><td class="td-bold">paidAt</td><td>timestamp?</td><td>Data da baixa</td></tr>
        <tr><td class="td-bold">paymentMethod</td><td>string?</td><td>Como foi pago (TED, PIX, boleto)</td></tr>
        <tr><td class="td-bold">recurring</td><td>boolean</td><td>Lançamento recorrente mensal</td></tr>
        <tr><td class="td-bold">purchaseOrderId</td><td>UUID?</td><td>Pedido de compra gerador (se aplicável)</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Fluxo de aprovação</h2>
  <div class="mermaid">
flowchart LR
  DRAFT["DRAFT\n(rascunho)"] --> PENDING["PENDING_APPROVAL\n(aguardando)"]
  PENDING --> APPROVED["APPROVED\n(aprovado)"]
  APPROVED --> PAID["PAID\n(baixado)"]
  PENDING --> REJECTED["REJECTED\n(rejeitado)"]
  APPROVED --> OVERDUE["OVERDUE\n(vencido)"]
  </div>

  <h2>Integrações</h2>
  <ul>
    <li><strong>Compras e Fornecedores</strong>: NF-e de entrada gera título automaticamente em <code>PENDING_APPROVAL</code></li>
    <li><strong>Fluxo de Caixa</strong>: títulos aprovados entram como saídas projetadas</li>
    <li><strong>Conciliação Bancária</strong>: débitos no extrato OFX podem ser baixados automaticamente</li>
    <li><strong>DRE</strong>: títulos pagos alimentam categorias de custo/despesa</li>
  </ul>
</div>
`
});
