WIKI.register({
  id: 'compras-fornecedores',
  title: 'Compras e Fornecedores',
  icon: '🤝',
  searchText: 'compras fornecedores sugestao compra curva ABC ponto pedido cotacao reposicao automatica lead time',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Estoque e Suprimento</div>
    <h1 class="section-title">🤝 Compras e Fornecedores</h1>
    <p class="section-subtitle">Gestão de compras com sugestão automática de reposição baseada em curva ABC, ponto de pedido, lead time do fornecedor e cotação multi-fornecedor para varejo alimentar.</p>
    <div class="section-tags">
      <span class="tag-green">Compras</span>
      <span class="tag-emerald">Curva ABC</span>
      <span class="tag-gray">Fornecedores · Cotação</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje</div>
    <ul>
      <li>Sem módulo de compras — rota <code>/varejo/compras</code> é placeholder</li>
      <li>Campo <code>supplier</code> proposto no <code>RetailItem</code> mas sem entidade <code>Supplier</code></li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Compras e Suprimento</div>
    <ul>
      <li>Cadastro de fornecedores (CNPJ, tabela de preços, lead time, MODF — mínimo de pedido)</li>
      <li>Vínculo produto → fornecedor principal e secundário</li>
      <li>Sugestão de compra: quando qty ≤ ponto de pedido → gera sugestão automática</li>
      <li>Pedido de compra: aprovação e envio ao fornecedor (e-mail ou portal)</li>
      <li>Cotação: envia o mesmo pedido para N fornecedores e compara</li>
      <li>Recebimento: vincula PO ao recebimento de NF-e para conferência</li>
      <li>Curva ABC: classifica produtos por rentabilidade (A=70%, B=20%, C=10%)</li>
    </ul>
  </div>

  <div class="herda-base-callout">
    <span class="hb-icon">🏪</span>
    <div class="hb-body">
      <div class="hb-title">Herda do ERP Base — Compras e Fornecedores Canônico</div>
      <div class="hb-links">Esta vertical herda: <a href="../wiki-erp/index.html#compras-fornecedores">Compras e Fornecedores</a> (PO, cotação, recebimento genérico, AP automático). Esta seção documenta <strong>apenas o delta market</strong>: curva ABC de produtos, sugestão automática por ponto de pedido/giro, recebimento com conferência FEFO e DANFE de entrada via XML NF-e.</div>
    </div>
  </div>

  <h2>Mockup — Compras e Fornecedores Market</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">🛒 Compras — Supermercado Boa Vista</span>
      <button class="mock-btn" style="margin-left:auto;background:transparent;border:1px solid rgba(255,255,255,.4);color:#fff;font-size:11px">+ Pedido compra</button>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px">
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#d97706">24</div><div class="mock-kpi-sub">SKUs abaixo ponto pedido</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#6366f1">8</div><div class="mock-kpi-sub">POs em aberto</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#16a34a">3</div><div class="mock-kpi-sub">Aguardando recebimento</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#ef4444">R$ 42k</div><div class="mock-kpi-sub">Total previsto mês</div></div>
      </div>
      <table class="mock-table">
        <thead><tr><th>SKU / Produto</th><th>Fornecedor</th><th>Estoque atual</th><th>Mínimo</th><th>Sugestão</th><th>Ação</th></tr></thead>
        <tbody>
          <tr><td><strong>Leite UHT 1L — 7891234567890</strong></td><td>Laticínios ABC</td><td>24 cx</td><td>50 cx</td><td>100 cx</td><td><button class="mock-btn mock-btn-primary" style="font-size:10px;padding:4px 8px">Pedir</button></td></tr>
          <tr><td>Arroz Tio João 5kg</td><td>Distribuidora Sul</td><td>18 sc</td><td>30 sc</td><td>60 sc</td><td><button class="mock-btn mock-btn-primary" style="font-size:10px;padding:4px 8px">Pedir</button></td></tr>
          <tr><td>Coca-Cola 350ml (fardo)</td><td>Coca-Cola FEMSA</td><td>8 fx</td><td>20 fx</td><td>40 fx</td><td><button class="mock-btn mock-btn-primary" style="font-size:10px;padding:4px 8px">Pedir</button></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <h2>Curva ABC de produtos</h2>
  <div class="mermaid">
xychart-beta
  title "Distribuição Curva ABC — Exemplo"
  x-axis ["A (15% SKUs)", "B (20% SKUs)", "C (65% SKUs)"]
  y-axis "% do Faturamento" 0 --> 80
  bar [70, 20, 10]
  </div>

  <h2>Sugestão automática de compra</h2>
  <pre>// Algoritmo de sugestão de compra por produto
function calcularSugestaoCompra(produto) {
  const { sku, qtdAtual, estoqueMinimo, estoqueMaximo,
          vendaMediaDiaria, leadTimeDias } = produto;

  // Ponto de pedido = estoque de segurança + consumo no lead time
  const pontoPedido = estoqueMinimo + (vendaMediaDiaria * leadTimeDias);

  if (qtdAtual <= pontoPedido) {
    const qtdSugerida = estoqueMaximo - qtdAtual;
    return {
      sku,
      sugerir: true,
      qtdSugerida: Math.max(qtdSugerida, produto.modfFornecedor),
      urgencia: qtdAtual <= estoqueMinimo ? 'CRITICO' : 'NORMAL'
    };
  }
  return { sku, sugerir: false };
}</pre>

  <h2>Fluxo de pedido de compra</h2>
  <div class="mermaid">
flowchart LR
  S["Sistema gera\nsugestão (ponto pedido)"]
  R["Gerente revisa\n+ ajusta qtd"]
  C{"Cotação\nnecessária?"}
  PC["Gera Pedido\nde Compra (PO)"]
  CF["Envia para\nN fornecedores"]
  EC["Escolhe melhor\ncotação"]
  ENV["Envia PO ao\nfornecedor escolhido"]
  REC["Recebimento\nconferência cega"]

  S --> R --> C
  C -->|Não, fornecedor fixo| PC --> ENV
  C -->|Sim| CF --> EC --> ENV
  ENV --> REC
  </div>

  <h2>Cadastro de fornecedor</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Campo</th><th>Tipo</th><th>Obs</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">CNPJ</td><td>String 14</td><td>Validado + lookup Receita Federal</td></tr>
        <tr><td class="td-bold">Razão social / Nome fantasia</td><td>String</td><td>Pré-preenchido pelo CNPJ lookup</td></tr>
        <tr><td class="td-bold">Lead time (dias)</td><td>Int</td><td>Usado no cálculo de ponto de pedido</td></tr>
        <tr><td class="td-bold">MODF (qtd mínima pedido)</td><td>Int por SKU</td><td>Múltiplo mínimo por embalagem</td></tr>
        <tr><td class="td-bold">E-mail para envio de PO</td><td>String</td><td>Envio automático do pedido</td></tr>
        <tr><td class="td-bold">Tabela de preços</td><td>JSON</td><td>SKU → preço unitário + faixas de qtd</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
