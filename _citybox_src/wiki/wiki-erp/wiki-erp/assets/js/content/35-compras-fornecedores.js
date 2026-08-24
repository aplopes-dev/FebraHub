WIKI.register({
  id: 'compras-fornecedores',
  title: 'Compras e Fornecedores',
  icon: '🛒',
  searchText: 'compras fornecedores pedido compra cotacao recebimento entrada estoque ponto pedido NF-e ordem compra PO aprovacao',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Operação e Estoque</div>
    <h1 class="section-title">🛒 Compras e Fornecedores</h1>
    <p class="section-subtitle">Módulo canônico de gestão de compras da loja: cadastro de fornecedores, cotação, pedido de compra, recebimento de mercadorias e geração automática de títulos em Contas a Pagar. Cada vertical estende este módulo com seu delta específico.</p>
    <div class="section-tags">
      <span class="tag-orange">Compras</span>
      <span class="tag-amber">Fornecedores · PO · NF-e</span>
      <span class="tag-gray">Módulo Base</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <p>Fornecedores cadastrados manualmente no backoffice. Pedidos de compra são controlados externamente (WhatsApp, e-mail). Entrada de mercadoria é registrada manualmente como ajuste de estoque positivo. NF-e de entrada não é processada automaticamente.</p>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Cadastro de fornecedor: CNPJ, contatos, prazo de pagamento, tabela de preços</li>
      <li>Pedido de compra (PO): itens, quantidades, preços negociados, prazo de entrega</li>
      <li>Cotação: envio para múltiplos fornecedores, comparativo, escolha do melhor</li>
      <li>Recebimento: conferência de itens vs PO, lançamento em estoque, NF-e de entrada</li>
      <li>Ponto de pedido: alerta automático quando estoque atinge nível mínimo</li>
      <li>Geração de título em Contas a Pagar ao confirmar recebimento</li>
      <li>Histórico de compras por fornecedor e item</li>
    </ul>
  </div>

  <h2>Mockup — Gestão de Compras</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">🛒 Compras — Junho 2026</span>
      <button class="mock-btn" style="margin-left:auto;background:transparent;border:1px solid rgba(255,255,255,.4);color:#fff;font-size:11px">+ Novo Pedido</button>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px">
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#d97706">8</div><div class="mock-kpi-sub">POs em aberto</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#16a34a">3</div><div class="mock-kpi-sub">Aguardando recebimento</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#ef4444">5</div><div class="mock-kpi-sub">Abaixo ponto pedido</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#6366f1">R$ 18.200</div><div class="mock-kpi-sub">Total do mês</div></div>
      </div>
      <table class="mock-table">
        <thead><tr><th>PO #</th><th>Fornecedor</th><th>Itens</th><th>Total</th><th>Entrega</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td><strong>#PO-0148</strong></td><td>Distribuidora ABC</td><td>12 itens</td><td>R$ 4.200</td><td>23/06</td><td><span class="mock-badge mock-badge-yellow">Aguardando</span></td></tr>
          <tr><td><strong>#PO-0147</strong></td><td>Fornecedor XYZ</td><td>5 itens</td><td>R$ 1.800</td><td>22/06</td><td><span class="mock-badge mock-badge-blue">Em trânsito</span></td></tr>
          <tr><td><strong>#PO-0146</strong></td><td>Importadora LM</td><td>20 itens</td><td>R$ 6.400</td><td>21/06</td><td><span class="mock-badge mock-badge-green">Recebido</span></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <h2>Fluxo de compra</h2>
  <div class="mermaid">
flowchart LR
  ALERT["Alerta\nponto de pedido"] --> DRAFT["Rascunho PO\nitens + qtd"]
  DRAFT --> COTACAO["Cotação\n(opcional)"]
  COTACAO --> APPROVED["PO Aprovado\nenvio ao fornecedor"]
  APPROVED --> TRANSIT["Em trânsito"]
  TRANSIT --> RECEIVE["Recebimento\nconferência NF-e"]
  RECEIVE --> STOCK["Entrada\nem estoque"]
  RECEIVE --> AP["Título em\nContas a Pagar"]
  </div>

  <h2>Extensões por vertical</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Vertical</th><th>Delta específico</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">🍔 Food</td><td>Recebimento de insumos perecíveis com lote/validade, ficha técnica como explosão de compra, ponto de pedido por insumo</td></tr>
        <tr><td class="td-bold">🛒 Market</td><td>Recebimento com conferência FEFO, entrada por leitor de código de barras, DANFE para NF-e de entrada</td></tr>
        <tr><td class="td-bold">🏥 Clinic / Service</td><td>Compras de materiais de consumo e equipamentos, controle de série/patrimônio</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-info">
    <span class="alert-icon">💡</span>
    <div class="alert-body">
      <div class="alert-title">Verticais que estendem este módulo</div>
      <p>As seções de Compras e Fornecedores nas wikis de verticals (Food, Market, etc.) documentam apenas os <strong>deltas específicos</strong> desta base. Toda a lógica canônica de PO, aprovação, recebimento e integração com AP está definida aqui.</p>
    </div>
  </div>
</div>
`
});
