WIKI.register({
  id: 'financeiro-varejo',
  title: 'Financeiro — Varejo',
  icon: '💳',
  searchText: 'financeiro varejo fluxo caixa margem categoria giro estoque DRE fechamento diario resultado',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Fiscal e Financeiro</div>
    <h1 class="section-title">💳 Financeiro — Varejo</h1>
    <p class="section-subtitle">Controle financeiro específico para varejo: fluxo de caixa diário, margem por categoria, giro de estoque, DRE simplificada e fechamento do dia com conciliação de meios de pagamento.</p>
    <div class="section-tags">
      <span class="tag-green">Financeiro</span>
      <span class="tag-emerald">Margem · Giro</span>
      <span class="tag-gray">DRE Varejo</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje</div>
    <ul>
      <li>Sem módulo financeiro — rota <code>/varejo/financeiro</code> é placeholder</li>
      <li>Financeiro genérico do ERP base pode ser referenciado para contas a pagar/receber</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Financeiro Varejo</div>
    <ul>
      <li>Dashboard financeiro diário: faturamento bruto, devoluções, líquido, margem</li>
      <li>Fluxo de caixa: entradas (vendas, créditos) × saídas (compras, despesas)</li>
      <li>Margem por categoria/departamento: permite identificar onde está o lucro</li>
      <li>Giro de estoque: quantas vezes o estoque "girou" no período</li>
      <li>DRE simplificada: receita → CMV → margem bruta → desp. operacionais → resultado</li>
      <li>Fechamento do dia: concilia caixa PDV com recebimentos de cartão/PIX</li>
      <li>Contas a pagar: faturas de fornecedores + despesas fixas (aluguel, energia)</li>
    </ul>
  </div>

  <div class="herda-base-callout">
    <span class="hb-icon">🏪</span>
    <div class="hb-body">
      <div class="hb-title">Herda do ERP Base — Módulos Financeiros Canônicos</div>
      <div class="hb-links">Esta vertical herda integralmente: <a href="../wiki-erp/index.html#contas-pagar">Contas a Pagar</a> · <a href="../wiki-erp/index.html#contas-receber">Contas a Receber</a> · <a href="../wiki-erp/index.html#fluxo-caixa">Fluxo de Caixa</a> · <a href="../wiki-erp/index.html#conciliacao-bancaria">Conciliação Bancária</a>. Esta seção documenta <strong>apenas o delta varejo</strong>: margem por categoria, DRE com custo de mercadoria vendida (CMV varejo), análise de giro de estoque e fechamento PDV.</div>
    </div>
  </div>

  <h2>KPIs financeiros do varejo</h2>
  <div class="card-grid">
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">💰</span> Margem Bruta</div>
      <p><code>(Receita - CMV) / Receita × 100</code><br/>Meta típica supermercado: 20-28%<br/>Meta hortifrúti: 35-45%</p>
    </div>
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">🔄</span> Giro de Estoque</div>
      <p><code>CMV / Estoque Médio</code><br/>Meta: supermercado 12-18x/ano<br/>Perecíveis: 50-100x/ano</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🛒</span> Ticket Médio</div>
      <p><code>Faturamento / Nº de Vendas</code><br/>Meta: R$35-80 (mercearia bairro)<br/>Meta: R$150+ (supermercado)</p>
    </div>
    <div class="card card-lime">
      <div class="card-title"><span class="card-icon">📉</span> CMV %</div>
      <p><code>CMV / Receita × 100</code><br/>Meta: abaixo de 75-80% (varejo alimentar)</p>
    </div>
  </div>

  <h2>DRE simplificada — varejo mensal</h2>
  <pre>DRE — Mercadinho Central — Maio/2025
══════════════════════════════════════

(+) Receita Bruta de Vendas           R$ 48.320,00
(-) Devoluções e Cancelamentos        R$    420,00
(=) RECEITA LÍQUIDA                   R$ 47.900,00

(-) Custo das Mercadorias Vendidas    R$ 35.800,00
  (-) Compras                         R$ 38.200,00
  (+) Variação de Estoque             R$  2.400,00
(=) MARGEM BRUTA                      R$ 12.100,00  (25,3%)

(-) Despesas Operacionais             R$  8.200,00
  Aluguel                             R$  3.200,00
  Energia elétrica                    R$    820,00
  Folha de pagamento                  R$  3.500,00
  Outros                              R$    680,00
(=) EBITDA                            R$  3.900,00   (8,1%)

(-) Depreciação                       R$    350,00
(-) Impostos (estimado Simples)       R$  2.100,00
(=) RESULTADO LÍQUIDO                 R$  1.450,00   (3,0%)</pre>

  <h2>Fechamento do dia</h2>
  <div class="mermaid">
sequenceDiagram
  participant PDV
  participant ERP
  participant Cartao as Conciliadora Cartão

  PDV->>ERP: Fecha sessão de caixa (Relatório Z)
  ERP->>ERP: Totaliza vendas por forma de pagamento
  ERP->>Cartao: Consulta liquidações do dia (API)
  Cartao->>ERP: Valor bruto - taxas = líquido creditado
  ERP->>ERP: Compara caixa físico × dinheiro vendido
  ERP->>ERP: Compara crédito previsto × liquidado cartão/PIX
  ERP->>ERP: Exibe divergências (sobra/falta por meio)
  ERP->>ERP: Lança resultado no fluxo de caixa
  </div>
</div>
`
});
