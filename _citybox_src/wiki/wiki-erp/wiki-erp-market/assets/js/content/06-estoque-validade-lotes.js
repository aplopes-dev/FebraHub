WIKI.register({
  id: 'estoque-validade-lotes',
  title: 'Estoque, Validade e Lotes',
  icon: '📦',
  searchText: 'estoque validade lotes FEFO rebaixa ruptura inventario vencimento pereciveis controle batch',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Estoque e Suprimento</div>
    <h1 class="section-title">📦 Estoque, Validade e Lotes</h1>
    <p class="section-subtitle">Controle de validade e lotes com FEFO (First Expired, First Out), alertas de vencimento, rebaixa automática de preço e gestão de quebras — essencial para perecíveis, farmácias e qualquer varejo com pereciblidade.</p>
    <div class="section-tags">
      <span class="tag-green">FEFO</span>
      <span class="tag-emerald">Validade · Lotes</span>
      <span class="tag-amber">Rebaixa automática</span>
      <span class="tag-red">Ruptura</span>
    </div>
  </div>

  <div class="herda-base-callout">
    <span class="hb-icon">🏪</span>
    <div class="hb-body">
      <div class="hb-title">Herda do ERP Base — Estoque Canônico</div>
      <div class="hb-links">Esta vertical herda <a href="../wiki-erp/index.html#estoque">Estoque</a>: <code>InventoryStock</code>, movimentações, reservas, estoque mínimo/máximo, alertas de ruptura e inventário físico. Esta seção documenta <strong>apenas o delta market</strong>: controle de lotes com validade, FEFO, alertas de vencimento e rebaixa automática de preço por proximidade do vencimento.</div>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (Scaffold)</div>
    <ul>
      <li><code>InventoryStock{storeId, sku, quantity, reserved}</code> herdado da base — sem validade ou controle de lote</li>
      <li>Sem alertas de ruptura ou reposição automática</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Delta Validade e Lotes (FEFO)</div>
    <ul>
      <li>Controle de lote: número do lote + data de validade por entrada de estoque</li>
      <li>FEFO: primeiro a vencer é o primeiro a ser vendido</li>
      <li>Alertas antecipados: 30d, 15d, 7d, 2d antes do vencimento</li>
      <li>Rebaixa automática: desconto progressivo conforme aproxima o vencimento</li>
      <li>Bloqueio automático: produto vencido não aparece no PDV</li>
    </ul>
    <p style="font-size:13px;color:#78716c;font-style:italic;margin-top:6px">Estoque mínimo/máximo, alertas de ruptura, inventário físico e sugestão de compra são herdados da base — aqui o delta é lote + validade + FEFO + rebaixa.</p>
  </div>

  <h2>Mockup — Controle de Validade e Lotes</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">📅 Validade e Lotes — Mercearia Boa Vista</span>
      <span style="margin-left:auto;font-size:11px;opacity:.8">3 alertas de vencimento</span>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px">
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#ef4444">3</div><div class="mock-kpi-sub">Vencidos</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#d97706">12</div><div class="mock-kpi-sub">Vencendo em 7 dias</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#6366f1">8</div><div class="mock-kpi-sub">Com rebaixa ativa</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#16a34a">1.842</div><div class="mock-kpi-sub">Lotes ok</div></div>
      </div>
      <table class="mock-table">
        <thead><tr><th>Produto</th><th>Lote</th><th>Vencimento</th><th>Qtd</th><th>Ação FEFO</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td><strong>Leite UHT 1L</strong></td><td>L2024-06A</td><td>25/06/26</td><td>48 un</td><td><span class="mock-badge mock-badge-yellow">Frente de gôndola</span></td><td><span class="mock-badge mock-badge-red">Rebaixar 20%</span></td></tr>
          <tr><td>Iogurte Natural</td><td>L2024-06B</td><td>28/06/26</td><td>24 un</td><td><span class="mock-badge mock-badge-yellow">Prioridade venda</span></td><td><span class="mock-badge mock-badge-yellow">Atenção</span></td></tr>
          <tr><td>Queijo Minas</td><td>L2024-07A</td><td>15/07/26</td><td>12 un</td><td><span class="mock-badge mock-badge-green">Normal</span></td><td><span class="mock-badge mock-badge-green">OK</span></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <h2>Ciclo de vida de um lote</h2>
  <div class="mermaid">
stateDiagram-v2
  [*] --> Recebido : NF-e entrada
  Recebido --> Em_Estoque : Conferencia OK
  Em_Estoque --> Alerta_30d : Validade 30 dias
  Alerta_30d --> Alerta_7d : Validade 7 dias
  Alerta_7d --> Rebaixa : Desconto automatico
  Em_Estoque --> Vendido : Saida PDV
  Alerta_30d --> Vendido : Saida PDV
  Alerta_7d --> Vendido : Saida PDV
  Rebaixa --> Vendido : Saida com desconto
  Alerta_7d --> Vencido : Data expirada
  Rebaixa --> Vencido : Data expirada
  Vencido --> Baixado : Quebra ou perda
  Vendido --> [*]
  Baixado --> [*]
  </div>

  <h2>Modelo de dados — lote e validade</h2>
  <pre>// Extensão da InventoryStock com lotes
model InventoryLot {
  id            String   @id @default(uuid())
  storeId       String
  sku           String
  lotNumber     String
  expiresAt     DateTime
  quantity      Int
  purchaseCost  Int      // em centavos
  receivedAt    DateTime
  status        LotStatus @default(ACTIVE)
  createdAt     DateTime @default(now())
}

enum LotStatus {
  ACTIVE      // dentro da validade, disponível para venda
  ALERT_30D   // vence em 30 dias
  ALERT_7D    // vence em 7 dias — rebaixa ativa
  EXPIRED     // vencido — bloqueado no PDV
  WRITTEN_OFF // baixado como perda/quebra
}</pre>

  <h2>Regras de rebaixa automática</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Dias para vencer</th><th>Desconto sugerido</th><th>Ação no PDV</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">30 dias</td><td>—</td><td>Alerta para gerente (notificação ERP)</td></tr>
        <tr><td class="td-bold">15 dias</td><td>10%</td><td>Preço especial exibido no PDV</td></tr>
        <tr><td class="td-bold">7 dias</td><td>25%</td><td>Etiqueta de gôndola "PRÓXIMO DO VENCIMENTO"</td></tr>
        <tr><td class="td-bold">2 dias</td><td>50%</td><td>Promoção ativa, destaque na vitrine digital</td></tr>
        <tr><td class="td-bold">0 dias (vencido)</td><td>Bloqueado</td><td>Produto não aparece no PDV nem no marketplace</td></tr>
      </tbody>
    </table>
  </div>
  <p style="font-size:12px;color:#6b7280;margin-top:4px">* Os percentuais são configuráveis por loja nas configurações de validade.</p>

  <h2>Inventário (contagem física)</h2>
  <div class="mermaid">
sequenceDiagram
  participant Gerente
  participant ERP
  participant DB

  Gerente->>ERP: Inicia inventário (bloqueia seção)
  ERP->>DB: Captura snapshot do estoque atual
  Gerente->>ERP: Lança contagem física (scan ou manual)
  ERP->>ERP: Compara contagem × snapshot
  ERP->>Gerente: Relatorio de divergencias por SKU/lote
  Gerente->>ERP: Aprova ajuste
  ERP->>DB: Atualiza InventoryLot + InventoryStock
  ERP->>DB: Lança quebra/perda no financeiro
  </div>
</div>
`
});
