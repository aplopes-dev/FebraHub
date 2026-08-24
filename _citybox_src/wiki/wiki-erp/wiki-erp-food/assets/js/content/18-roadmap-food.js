WIKI.register({
  id: 'roadmap-food',
  title: 'Roadmap e Evolução Food',
  icon: '🗓️',
  searchText: 'roadmap evolucao food fases prioridade rice reach impact confidence effort sprint v1 v2 v3',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Analytics e Evolução</div>
    <h1 class="section-title">🗓️ Roadmap e Evolução Food</h1>
    <p class="section-subtitle">Plano de desenvolvimento faseado para a vertical Food, priorizado pelo framework RICE — do MVP operacional ao ERP food completo com analytics e integrações externas.</p>
    <div class="section-tags">
      <span class="tag-red">Roadmap</span>
      <span class="tag-orange">RICE Framework</span>
      <span class="tag-gray">4 Fases</span>
    </div>
  </div>

  <h2>Fases de desenvolvimento</h2>
  <div class="mermaid">
gantt
  dateFormat YYYY-MM
  title Roadmap Vertical Food — Citybox
  axisFormat %b/%Y

  section Fase 1 – MVP Operacional
  Cardápio com modificadores       :f1a, 2026-07, 6w
  Pedidos multicanal + Kanban      :f1b, 2026-07, 6w
  KDS básico (roteamento + bump)   :f1c, 2026-08, 4w
  PDV balcão offline-first         :f1d, 2026-08, 5w
  NFC-e via PlugNotas              :f1e, 2026-09, 3w

  section Fase 2 – Salão e Delivery
  Mapa de mesas + Comandas         :f2a, 2026-10, 5w
  QR code mesa autoatendimento     :f2b, 2026-10, 3w
  Hub iFood (receber pedidos)      :f2c, 2026-11, 4w
  Delivery próprio + app entregador:f2d, 2026-11, 5w
  Fichas técnicas + CMV            :f2e, 2026-12, 4w

  section Fase 3 – Operação Avançada
  Estoque de insumos + dedução     :f3a, 2027-01, 4w
  Course firing + split conta      :f3b, 2027-01, 3w
  Hub Rappi                        :f3c, 2027-02, 3w
  CRM fidelidade + pontos          :f3d, 2027-02, 4w
  Sessão de caixa + Rel. Z         :f3e, 2027-03, 3w

  section Fase 4 – Analytics e Franquias
  Menu engineering dashboard       :f4a, 2027-04, 4w
  Attachment rate e table turn     :f4b, 2027-04, 3w
  DRE food + fechamento diário     :f4c, 2027-05, 3w
  Multi-loja / franquia            :f4d, 2027-05, 4w
  </div>

  <h2>Matriz RICE — Priorização</h2>
  <div class="table-wrap rice-table">
    <table>
      <thead><tr><th>Feature</th><th>Reach</th><th>Impact</th><th>Confidence</th><th>Effort</th><th class="rice-score">Score RICE</th><th>Fase</th></tr></thead>
      <tbody>
        <tr>
          <td class="td-bold">Cardápio com modificadores</td>
          <td>10</td><td>10</td><td>95%</td><td>3</td>
          <td class="rice-score">317</td>
          <td><span class="tag-p1">P1 F1</span></td>
        </tr>
        <tr>
          <td class="td-bold">NFC-e fiscal</td>
          <td>10</td><td>10</td><td>90%</td><td>3</td>
          <td class="rice-score">300</td>
          <td><span class="tag-p1">P1 F1</span></td>
        </tr>
        <tr>
          <td class="td-bold">KDS básico</td>
          <td>9</td><td>9</td><td>90%</td><td>2</td>
          <td class="rice-score">365</td>
          <td><span class="tag-p1">P1 F1</span></td>
        </tr>
        <tr>
          <td class="td-bold">PDV balcão offline</td>
          <td>8</td><td>10</td><td>85%</td><td>4</td>
          <td class="rice-score">170</td>
          <td><span class="tag-p1">P1 F1</span></td>
        </tr>
        <tr>
          <td class="td-bold">Hub iFood (pedidos)</td>
          <td>9</td><td>10</td><td>80%</td><td>4</td>
          <td class="rice-score">180</td>
          <td><span class="tag-p2">P2 F2</span></td>
        </tr>
        <tr>
          <td class="td-bold">Mapa de mesas + comandas</td>
          <td>7</td><td>9</td><td>90%</td><td>4</td>
          <td class="rice-score">142</td>
          <td><span class="tag-p2">P2 F2</span></td>
        </tr>
        <tr>
          <td class="td-bold">Fichas técnicas + CMV</td>
          <td>8</td><td>8</td><td>85%</td><td>3</td>
          <td class="rice-score">181</td>
          <td><span class="tag-p2">P2 F2</span></td>
        </tr>
        <tr>
          <td class="td-bold">Delivery próprio</td>
          <td>6</td><td>9</td><td>75%</td><td>5</td>
          <td class="rice-score">81</td>
          <td><span class="tag-p2">P2 F2</span></td>
        </tr>
        <tr>
          <td class="td-bold">CRM + fidelidade</td>
          <td>7</td><td>7</td><td>80%</td><td>3</td>
          <td class="rice-score">131</td>
          <td><span class="tag-p2">P2 F3</span></td>
        </tr>
        <tr>
          <td class="td-bold">Menu engineering</td>
          <td>6</td><td>8</td><td>85%</td><td>3</td>
          <td class="rice-score">136</td>
          <td><span class="tag-p3">P3 F4</span></td>
        </tr>
        <tr>
          <td class="td-bold">Hub Rappi</td>
          <td>5</td><td>7</td><td>75%</td><td>3</td>
          <td class="rice-score">88</td>
          <td><span class="tag-p3">P3 F3</span></td>
        </tr>
        <tr>
          <td class="td-bold">Multi-loja franquia</td>
          <td>3</td><td>9</td><td>70%</td><td>5</td>
          <td class="rice-score">38</td>
          <td><span class="tag-p3">P3 F4</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>Critérios RICE</h2>
  <div class="card-grid">
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">👥</span> Reach (1–10)</div>
      <p>Quantos usuários/lojas afeta. 10 = todos os restaurantes, 1 = nicho específico.</p>
    </div>
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">⚡</span> Impact (1–10)</div>
      <p>Impacto na eficiência/receita. 10 = transforma a operação, 1 = melhoria cosmética.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🎯</span> Confidence (%)</div>
      <p>Certeza de que o Reach e Impact serão alcançados. Baseado em evidências.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">⏱️</span> Effort (semanas)</div>
      <p>Esforço de desenvolvimento estimado em semanas-engenheiro.</p>
    </div>
  </div>

  <div class="alert alert-orange">
    <span class="alert-icon">📌</span>
    <div class="alert-body">
      <div class="alert-title">Estado atual da vertical</div>
      <p>Já concluído: <strong>food-api em Clean Architecture</strong> com <strong>Catálogo</strong> e <strong>Cardápios</strong> reais (backend + UI ERP), incluindo upload de imagem e configuração de canais. As telas de Pedidos, PDV, Configurações, Equipe e Integrações existem como <strong>UI mockada</strong> (<code>sessionStorage</code>), prontas para ligar ao backend. Próximos passos prioritários: backend de Pedidos + realtime, módulo <code>store-settings</code>, e backend de PDV/caixa. Ver <a href="#estado-implementacao-food">🧭 Estado de Implementação</a> para o detalhamento.</p>
    </div>
  </div>
</div>
`
});
