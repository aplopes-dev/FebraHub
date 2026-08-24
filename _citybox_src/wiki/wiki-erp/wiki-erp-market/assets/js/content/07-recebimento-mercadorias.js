WIKI.register({
  id: 'recebimento-mercadorias',
  title: 'Recebimento de Mercadorias',
  icon: '🚚',
  searchText: 'recebimento mercadorias NF-e XML entrada conferencia cega divergencias custo entrada fornecedor compra nota fiscal',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Estoque e Suprimento</div>
    <h1 class="section-title">🚚 Recebimento de Mercadorias</h1>
    <p class="section-subtitle">Entrada de produtos via XML de NF-e de compra: importação, conferência cega, lançamento de lotes/validades, tratamento de divergências e atualização do custo de entrada.</p>
    <div class="section-tags">
      <span class="tag-green">NF-e Entrada</span>
      <span class="tag-emerald">XML</span>
      <span class="tag-gray">Conferência Cega</span>
    </div>
  </div>

  <div class="herda-base-callout">
    <span class="hb-icon">🏪</span>
    <div class="hb-body">
      <div class="hb-title">Herda do ERP Base — Compras e Estoque Canônicos</div>
      <div class="hb-links">Esta vertical herda <a href="../wiki-erp/index.html#compras-fornecedores">Compras e Fornecedores</a> (PO, cotação, recebimento genérico, geração de título em AP) e <a href="../wiki-erp/index.html#estoque">Estoque</a> (entrada de mercadoria, movimentações). Esta seção documenta <strong>apenas o delta market</strong>: recebimento por XML de NF-e, conferência cega, cadastro de lotes/validade na entrada e custo médio ponderado (CMP).</div>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje</div>
    <ul>
      <li>Sem módulo de recebimento — estoque só pode ser ajustado manualmente</li>
      <li>Rota <code>/varejo/estoque/recebimento</code> é placeholder</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Recebimento por XML NF-e</div>
    <ul>
      <li>Upload do XML de NF-e de compra — parse automático pelo PlugNotas ou parser próprio</li>
      <li>Mapeamento de CNPJ emissor → Fornecedor cadastrado</li>
      <li>Conferência cega: o recebedor conta sem ver as quantidades da nota</li>
      <li>Tratamento de divergências: quantidade diferente, produto não cadastrado, preço diferente</li>
      <li>Cadastro automático de lotes + datas de validade no recebimento</li>
      <li>Atualização de custo médio ponderado (CMP) por SKU</li>
      <li>Entrada parcial: recebe parte da nota e guarda pendência</li>
    </ul>
  </div>

  <h2>Fluxo de recebimento</h2>
  <div class="mermaid">
flowchart TD
  A["Fornecedor entrega\n+ XML NF-e"] --> B["Upload XML no ERP\nParse automático"]
  B --> C{"Fornecedor\ncadastrado?"}
  C -->|Sim| D["Pré-preenche itens\nda nota"]
  C -->|Não| E["Cadastrar fornecedor\nautomaticamente"]
  E --> D
  D --> F["Conferência Cega\n(conta sem ver qtd nota)"]
  F --> G{"Divergências?"}
  G -->|Nenhuma| H["Aprovação automática\nLança lotes + validade"]
  G -->|Sim| I["Exibe divergências\npor item"]
  I --> J["Gerente aprova\nou rejeita divergência"]
  J --> H
  H --> K["Atualiza InventoryLot\n+ custo médio ponderado"]
  K --> L["Gera relatório\nde entrada"]
  </div>

  <h2>Tela de conferência (mockup)</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">🚚 Recebimento — NF-e 003421 · Distribuidora ABC</span>
    </div>
    <div class="mock-body">
      <div style="font-size:11px;color:#6b7280;margin-bottom:8px">Conferência cega: informe a quantidade recebida sem ver a quantidade da nota</div>
      <div style="background:#fff;border:1px solid #d1fae5;border-radius:8px;overflow:hidden;font-size:11px">
        <div style="display:grid;grid-template-columns:3fr 1fr 1fr 1fr;padding:8px 12px;background:#f0fdf4;font-weight:700;border-bottom:1px solid #6ee7b7">
          <span>Produto</span><span>Qtd Nota</span><span>Qtd Rec.</span><span>Status</span>
        </div>
        <div style="display:grid;grid-template-columns:3fr 1fr 1fr 1fr;padding:8px 12px;border-bottom:1px solid #f0fdf4;align-items:center">
          <span>Arroz Camil 5kg (EAN 7896006704094)</span>
          <span style="color:#9ca3af">—</span>
          <input style="width:60px;border:1px solid #6ee7b7;border-radius:4px;padding:3px 6px;font-size:11px" value="24" />
          <span class="mock-badge mock-badge-green">OK</span>
        </div>
        <div style="display:grid;grid-template-columns:3fr 1fr 1fr 1fr;padding:8px 12px;border-bottom:1px solid #f0fdf4;align-items:center">
          <span>Feijão Preto Camil 1kg</span>
          <span style="color:#9ca3af">—</span>
          <input style="width:60px;border:1px solid #fca5a5;border-radius:4px;padding:3px 6px;font-size:11px" value="18" />
          <span class="mock-badge mock-badge-yellow">⚠ Diverge</span>
        </div>
        <div style="display:grid;grid-template-columns:3fr 1fr 1fr 1fr;padding:8px 12px;align-items:center">
          <span>Óleo Soja Leve 900ml</span>
          <span style="color:#9ca3af">—</span>
          <input style="width:60px;border:1px solid #6ee7b7;border-radius:4px;padding:3px 6px;font-size:11px" value="36" />
          <span class="mock-badge mock-badge-green">OK</span>
        </div>
      </div>
      <div style="margin-top:10px;display:flex;gap:8px">
        <button class="mock-btn mock-btn-primary">✅ Confirmar recebimento</button>
        <button class="mock-btn mock-btn-outline">💾 Salvar rascunho</button>
      </div>
    </div>
  </div>

  <h2>Tratamento de divergências</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tipo de divergência</th><th>Ação recomendada</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Qtd recebida &lt; qtd nota</td><td>Solicitar crédito ao fornecedor; lançar qtd real</td></tr>
        <tr><td class="td-bold">Qtd recebida &gt; qtd nota</td><td>Devolver excedente ou emitir NF de devolução</td></tr>
        <tr><td class="td-bold">Produto não cadastrado no ERP</td><td>Cadastro automático via EAN + GS1 Brazil</td></tr>
        <tr><td class="td-bold">Produto danificado / avariado</td><td>Recusa parcial; geração de carta de avaria</td></tr>
        <tr><td class="td-bold">Validade muito curta (p. ex. &lt;7d)</td><td>Alerta para gerente; aceitar ou recusar lote</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
