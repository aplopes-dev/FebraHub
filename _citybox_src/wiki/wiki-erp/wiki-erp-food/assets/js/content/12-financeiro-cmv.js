WIKI.register({
  id: 'financeiro-cmv',
  title: 'Financeiro e CMV',
  icon: '💰',
  searchText: 'financeiro cmv food cost dre fechamento diario receita despesa lucro margem relatorio gerencial custo mercadoria vendida',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Fiscal e Financeiro</div>
    <h1 class="section-title">💰 Financeiro e CMV</h1>
    <p class="section-subtitle">Controle financeiro específico para alimentação: CMV real automatizado, food cost por item e por período, DRE simplificada, fechamento diário e alertas de margem.</p>
    <div class="section-tags">
      <span class="tag-red">CMV</span>
      <span class="tag-orange">Food Cost %</span>
      <span class="tag-gray">DRE Food</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Permissão <code>financeiro:view</code> e <code>financeiro:manage</code> definidas no catálogo food</li>
      <li>Totais de receita via relatórios do marketplace-api (pedidos × valor)</li>
      <li>Sem CMV automático, sem DRE food, sem fechamento diário</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Financeiro Food</div>
    <ul>
      <li>CMV em tempo real: soma dos insumos deduzidos × custo de compra</li>
      <li>Food cost % por item, por categoria e por período</li>
      <li>DRE simplificada: Receita bruta → CMV → Margem bruta → Custos operacionais → EBITDA</li>
      <li>Fechamento diário: consolidação de caixa, vendas, CMV e margem do dia</li>
      <li>Alerta de food cost alto: avisa quando um item ou o total ultrapassar threshold</li>
      <li>Comparativo: semana/mês/trimestre atual vs anterior</li>
    </ul>
  </div>

  <div class="herda-base-callout">
    <span class="hb-icon">🏪</span>
    <div class="hb-body">
      <div class="hb-title">Herda do ERP Base — Módulos Financeiros Canônicos</div>
      <div class="hb-links">Esta vertical herda integralmente os módulos: <a href="../wiki-erp/index.html#contas-pagar">Contas a Pagar</a> · <a href="../wiki-erp/index.html#contas-receber">Contas a Receber</a> · <a href="../wiki-erp/index.html#fluxo-caixa">Fluxo de Caixa</a> · <a href="../wiki-erp/index.html#conciliacao-bancaria">Conciliação Bancária</a> · <a href="../wiki-erp/index.html#pagamentos-repasse">Pagamentos e Repasse</a>. Esta seção documenta <strong>apenas o delta food</strong>: CMV, food cost % e DRE com custo de insumos.</div>
    </div>
  </div>

  <h2>Dashboard financeiro diário</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">💰 Financeiro — Hamburgueria do Zé · Hoje</span>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:14px;">
        <div class="mock-kpi" style="border-left:3px solid #e11d48;">
          <div class="mock-kpi-value" style="color:#e11d48;">R$ 3.840</div>
          <div class="mock-kpi-sub">Receita bruta</div>
        </div>
        <div class="mock-kpi" style="border-left:3px solid #f59e0b;">
          <div class="mock-kpi-value" style="color:#d97706;">R$ 1.344</div>
          <div class="mock-kpi-sub">CMV (35%)</div>
        </div>
        <div class="mock-kpi" style="border-left:3px solid #22c55e;">
          <div class="mock-kpi-value" style="color:#16a34a;">R$ 2.496</div>
          <div class="mock-kpi-sub">Margem bruta (65%)</div>
        </div>
        <div class="mock-kpi" style="border-left:3px solid #3b82f6;">
          <div class="mock-kpi-value" style="color:#1d4ed8;">152</div>
          <div class="mock-kpi-sub">Pedidos / ticket R$25</div>
        </div>
      </div>
      <div style="background:#fff;border:1px solid #fca5a5;border-radius:8px;padding:12px;">
        <div style="font-weight:700;font-size:13px;margin-bottom:8px;">Food Cost por canal</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <span style="font-size:12px;background:#f0fdf4;border:1px solid #86efac;padding:4px 10px;border-radius:20px;color:#166534;">Salão: 32% ✅</span>
          <span style="font-size:12px;background:#fff7ed;border:1px solid #fed7aa;padding:4px 10px;border-radius:20px;color:#92400e;">iFood: 41% ⚠</span>
          <span style="font-size:12px;background:#f0fdf4;border:1px solid #86efac;padding:4px 10px;border-radius:20px;color:#166534;">Rappi: 38% ✅</span>
          <span style="font-size:12px;background:#f0fdf4;border:1px solid #86efac;padding:4px 10px;border-radius:20px;color:#166534;">PDV: 30% ✅</span>
        </div>
      </div>
    </div>
  </div>

  <h2>DRE Simplificada — Food</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Linha DRE</th><th>Exemplo Mês</th><th>% Receita</th><th>Meta</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Receita bruta</td><td>R$ 85.000</td><td>100%</td><td>—</td></tr>
        <tr><td><em>(-) Cancelamentos e descontos</em></td><td>R$ 2.550</td><td>3%</td><td>&lt;3%</td></tr>
        <tr><td class="td-bold">Receita líquida</td><td>R$ 82.450</td><td>97%</td><td>—</td></tr>
        <tr><td><em>(-) CMV (ingredientes e embalagens)</em></td><td>R$ 28.857</td><td>35%</td><td>&lt;35%</td></tr>
        <tr style="background:#f0fdf4;"><td class="td-bold">Margem bruta</td><td><strong>R$ 53.593</strong></td><td><strong>65%</strong></td><td>&gt;60%</td></tr>
        <tr><td><em>(-) Folha e benefícios</em></td><td>R$ 18.000</td><td>21%</td><td>—</td></tr>
        <tr><td><em>(-) Aluguel e condomínio</em></td><td>R$ 6.000</td><td>7%</td><td>—</td></tr>
        <tr><td><em>(-) Delivery e comissões</em></td><td>R$ 8.500</td><td>10%</td><td>—</td></tr>
        <tr><td><em>(-) Outras despesas</em></td><td>R$ 5.000</td><td>6%</td><td>—</td></tr>
        <tr style="background:#fff7f7;"><td class="td-bold">EBITDA</td><td><strong>R$ 16.093</strong></td><td><strong>19%</strong></td><td>&gt;15%</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Fechamento diário — fluxo</h2>
  <div class="mermaid">
flowchart LR
  Pedidos["Pedidos fechados\n(todas as fontes)"]
  CMV["CMV automático\n(dedução de insumos)"]
  Caixa["Fechamento PDV\n(conferência física)"]
  DRE["DRE do dia\n(consolidação)"]
  Exporta["Exporta para contabilidade\n(CSV/OFX)"]
  WhatsApp["Relatório diário\n(WhatsApp gerente)"]

  Pedidos --> CMV
  CMV --> DRE
  Caixa --> DRE
  DRE --> Exporta
  DRE --> WhatsApp
  </div>
</div>
`
});
