WIKI.register({
  id: 'roadmap-evolucao',
  title: 'Roadmap de Evolução',
  icon: '🗺️',
  searchText: 'roadmap evolução fases MVP v1 v2 priorização RICE reach impact confidence effort features planejamento timelines sprints',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Evolução</div>
  <h1 class="section-title">🗺️ Roadmap de Evolução</h1>
  <p class="section-subtitle">Fases de desenvolvimento do Admin Citybox — do MVP atual ao produto completo, com priorização RICE e dependências.</p>
  <div class="section-tags">
    <span class="tag-teal">3 fases</span>
    <span class="tag-blue">Priorização RICE</span>
    <span class="tag-gray">Blueprint</span>
  </div>
</div>

<h2>Visão das fases</h2>
<div class="mermaid">
flowchart LR
  subgraph mvp [MVP — Hoje]
    M1[CRUD Clientes]
    M2[CRUD Lojas]
    M3[Equipe da Loja]
    M4[Usuários Citybox]
    M5[Audit por loja]
  end

  subgraph v1 [v1 — Fundação comercial]
    V1A[Fix RBAC / Operator]
    V1B[Planos reais + Billing]
    V1C[Dashboard métricas reais]
    V1D[Health Score]
    V1E[Auditoria global]
    V1F[Integrações gerenciáveis]
  end

  subgraph v2 [v2 — Plataforma madura]
    V2A[Impersonation auditada]
    V2B[Onboarding guiado]
    V2C[Monitoramento lojas]
    V2D[Notificações + Broadcasts]
    V2E[Relatórios agendados]
    V2F[Feature flags]
  end

  mvp --> v1 --> v2
</div>

<h2>Priorização RICE — v1</h2>
<div class="table-wrap">
  <table class="rice-table">
    <thead>
      <tr>
        <th>Feature</th>
        <th>Reach</th>
        <th>Impact</th>
        <th>Confidence</th>
        <th>Effort</th>
        <th class="rice-score">Score</th>
        <th>Prio</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="td-bold">Fix RBAC (platform_operator)</td>
        <td>10/10</td><td>9</td><td>95%</td><td>1w</td>
        <td class="rice-score">855</td>
        <td><span class="tag-p1">P1</span></td>
      </tr>
      <tr>
        <td class="td-bold">Planos reais (tabela plans)</td>
        <td>10/10</td><td>9</td><td>90%</td><td>2w</td>
        <td class="rice-score">405</td>
        <td><span class="tag-p1">P1</span></td>
      </tr>
      <tr>
        <td class="td-bold">Health Score básico</td>
        <td>10/10</td><td>9</td><td>80%</td><td>3w</td>
        <td class="rice-score">240</td>
        <td><span class="tag-p1">P1</span></td>
      </tr>
      <tr>
        <td class="td-bold">Dashboard métricas reais</td>
        <td>5/10</td><td>8</td><td>85%</td><td>2w</td>
        <td class="rice-score">170</td>
        <td><span class="tag-p1">P1</span></td>
      </tr>
      <tr>
        <td class="td-bold">Billing (assinaturas + faturas)</td>
        <td>10/10</td><td>10</td><td>75%</td><td>8w</td>
        <td class="rice-score">94</td>
        <td><span class="tag-p1">P1</span></td>
      </tr>
      <tr>
        <td class="td-bold">Auditoria global</td>
        <td>5/10</td><td>7</td><td>90%</td><td>2w</td>
        <td class="rice-score">158</td>
        <td><span class="tag-p2">P2</span></td>
      </tr>
    </tbody>
  </table>
</div>
<p style="color:var(--text-muted);font-size:13px">RICE Score = (Reach × Impact × Confidence) / Effort (semanas). Maior = mais prioritário.</p>

<h2>Priorização RICE — v2</h2>
<div class="table-wrap">
  <table class="rice-table">
    <thead>
      <tr>
        <th>Feature</th>
        <th>Reach</th>
        <th>Impact</th>
        <th>Confidence</th>
        <th>Effort</th>
        <th class="rice-score">Score</th>
        <th>Prio</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="td-bold">Monitoramento de lojas</td>
        <td>10/10</td><td>8</td><td>85%</td><td>3w</td>
        <td class="rice-score">227</td>
        <td><span class="tag-p2">P2</span></td>
      </tr>
      <tr>
        <td class="td-bold">Notificações + broadcasts</td>
        <td>8/10</td><td>7</td><td>80%</td><td>4w</td>
        <td class="rice-score">112</td>
        <td><span class="tag-p2">P2</span></td>
      </tr>
      <tr>
        <td class="td-bold">Onboarding guiado</td>
        <td>6/10</td><td>8</td><td>75%</td><td>3w</td>
        <td class="rice-score">120</td>
        <td><span class="tag-p2">P2</span></td>
      </tr>
      <tr>
        <td class="td-bold">Impersonation auditada</td>
        <td>3/10</td><td>9</td><td>90%</td><td>2w</td>
        <td class="rice-score">122</td>
        <td><span class="tag-p2">P2</span></td>
      </tr>
      <tr>
        <td class="td-bold">Relatórios agendados</td>
        <td>5/10</td><td>7</td><td>70%</td><td>4w</td>
        <td class="rice-score">61</td>
        <td><span class="tag-p3">P3</span></td>
      </tr>
      <tr>
        <td class="td-bold">Feature flags por tenant</td>
        <td>10/10</td><td>6</td><td>80%</td><td>4w</td>
        <td class="rice-score">120</td>
        <td><span class="tag-p3">P3</span></td>
      </tr>
    </tbody>
  </table>
</div>

<h2>Dependências críticas</h2>
<div class="mermaid">
flowchart TB
  FixRBAC[Fix RBAC] --> Dashboard[Dashboard real]
  Planos[Planos reais] --> Billing[Billing completo]
  Billing --> Faturamento[Faturamento + Cobrança]
  Faturamento --> Dunning[Dunning automático]
  HealthScore[Health Score] --> Dashboard
  HealthScore --> Alertas[Alertas operacionais]
  Alertas --> Notificacoes[Notificações / Inbox]
  AuditoriaGlobal[Auditoria global] --> Impersonation[Impersonation]
</div>
`
});
