WIKI.register({
  id: 'roadmap-market',
  title: 'Roadmap Market',
  icon: '🗓️',
  searchText: 'roadmap market fases RICE prioridade features implementacao plano desenvolvimento vertical varejo',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Analytics e Evolução</div>
    <h1 class="section-title">🗓️ Roadmap — Vertical Market</h1>
    <p class="section-subtitle">Fases de desenvolvimento priorizadas pela matriz RICE (Reach × Impact × Confidence ÷ Effort) para construir a vertical Market do Citybox do scaffold ao varejo completo.</p>
    <div class="section-tags">
      <span class="tag-green">Roadmap</span>
      <span class="tag-emerald">RICE</span>
      <span class="tag-gray">4 Fases</span>
    </div>
  </div>

  <h2>Fases do roadmap</h2>
  <div class="mermaid">
gantt
  title Roadmap Vertical Market — Citybox
  dateFormat  YYYY-MM
  axisFormat  %b %Y

  section Fase 1 — Fundação
  Catálogo EAN/GTIN + NCM/CEST    :2025-07, 6w
  API vertical market-api         :2025-07, 8w
  PDV básico offline-first        :2025-08, 8w
  NFC-e automática (PlugNotas)    :2025-09, 4w

  section Fase 2 — Estoque e Suprimento
  Controle validade/lotes FEFO    :2025-10, 6w
  Recebimento por XML NF-e        :2025-10, 6w
  Balança Toledo/Ramuza           :2025-11, 6w
  Sugestão de compra (ponto pedido):2025-12, 4w

  section Fase 3 — Operação Completa
  Promoções complexas             :2026-01, 6w
  CRM + clube de desconto         :2026-02, 6w
  Picking e delivery próprio      :2026-02, 8w
  SPED Fiscal + CBS/IBS           :2026-03, 8w

  section Fase 4 — Diferencial
  App do separador (mobile)       :2026-05, 6w
  Analytics avançado (BI)         :2026-06, 8w
  Multi-loja centralizada         :2026-07, 8w
  </div>

  <h2>Matriz RICE — features prioritárias</h2>
  <div class="table-wrap">
    <table class="rice-table">
      <thead><tr><th>Feature</th><th>Reach</th><th>Impact</th><th>Confidence</th><th>Effort</th><th>RICE Score</th><th>Fase</th></tr></thead>
      <tbody>
        <tr>
          <td class="td-bold">Catálogo EAN + NCM</td>
          <td>10</td><td>3</td><td>100%</td><td>3</td>
          <td class="rice-score">1000</td>
          <td><span class="tag-p1">F1</span></td>
        </tr>
        <tr>
          <td class="td-bold">PDV offline-first</td>
          <td>10</td><td>3</td><td>90%</td><td>5</td>
          <td class="rice-score">540</td>
          <td><span class="tag-p1">F1</span></td>
        </tr>
        <tr>
          <td class="td-bold">NFC-e automática</td>
          <td>10</td><td>3</td><td>90%</td><td>3</td>
          <td class="rice-score">900</td>
          <td><span class="tag-p1">F1</span></td>
        </tr>
        <tr>
          <td class="td-bold">Validade/lotes FEFO</td>
          <td>8</td><td>3</td><td>90%</td><td>4</td>
          <td class="rice-score">540</td>
          <td><span class="tag-p1">F2</span></td>
        </tr>
        <tr>
          <td class="td-bold">Recebimento NF-e entrada</td>
          <td>8</td><td>2</td><td>90%</td><td>4</td>
          <td class="rice-score">360</td>
          <td><span class="tag-p1">F2</span></td>
        </tr>
        <tr>
          <td class="td-bold">Balança Toledo/Ramuza</td>
          <td>7</td><td>3</td><td>80%</td><td>5</td>
          <td class="rice-score">336</td>
          <td><span class="tag-p1">F2</span></td>
        </tr>
        <tr>
          <td class="td-bold">CBS/IBS (Reforma Tributária)</td>
          <td>10</td><td>3</td><td>70%</td><td>6</td>
          <td class="rice-score">350</td>
          <td><span class="tag-p2">F2-F3</span></td>
        </tr>
        <tr>
          <td class="td-bold">Promoções complexas</td>
          <td>7</td><td>2</td><td>80%</td><td>5</td>
          <td class="rice-score">224</td>
          <td><span class="tag-p2">F3</span></td>
        </tr>
        <tr>
          <td class="td-bold">CRM + clube de desconto</td>
          <td>6</td><td>2</td><td>80%</td><td>4</td>
          <td class="rice-score">240</td>
          <td><span class="tag-p2">F3</span></td>
        </tr>
        <tr>
          <td class="td-bold">Picking + delivery próprio</td>
          <td>5</td><td>2</td><td>70%</td><td>8</td>
          <td class="rice-score">88</td>
          <td><span class="tag-p2">F3</span></td>
        </tr>
        <tr>
          <td class="td-bold">App separador mobile</td>
          <td>5</td><td>2</td><td>70%</td><td>6</td>
          <td class="rice-score">117</td>
          <td><span class="tag-p3">F4</span></td>
        </tr>
        <tr>
          <td class="td-bold">Analytics / BI avançado</td>
          <td>4</td><td>1</td><td>70%</td><td>6</td>
          <td class="rice-score">47</td>
          <td><span class="tag-p3">F4</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>Critérios RICE</h2>
  <div class="card-grid">
    <div class="card card-green"><div class="card-title"><span class="card-icon">🎯</span> Reach (1-10)</div><p>Quantas lojas / lojistas serão impactados pela feature.</p></div>
    <div class="card card-emerald"><div class="card-title"><span class="card-icon">💥</span> Impact (1-3)</div><p>1=baixo, 2=médio, 3=transformador no workflow do lojista.</p></div>
    <div class="card card-teal"><div class="card-title"><span class="card-icon">✅</span> Confidence (0-100%)</div><p>Confiança na estimativa de Reach e Impact baseada em evidências.</p></div>
    <div class="card card-gray"><div class="card-title"><span class="card-icon">⏱️</span> Effort (1-10)</div><p>Semanas de desenvolvimento estimadas (1 dev full-stack sênior).</p></div>
  </div>
</div>
`
});
