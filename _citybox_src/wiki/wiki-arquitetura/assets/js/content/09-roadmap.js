WIKI.register({
  id: 'roadmap',
  title: 'Roadmap priorizado',
  icon: '🧭',
  searchText: 'roadmap priorizado p1 p2 p3 quick wins estrategico fases outbox idempotencia rfc 7807 observabilidade opentelemetry circuit breaker saga checkout ci cd testcontainers asyncapi sequencia evolucao',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Evolução</div>
    <h1 class="section-title">🧭 Roadmap priorizado</h1>
    <p class="section-subtitle">Sequência recomendada para fechar os gaps, ordenada por valor × esforço. A lógica: primeiro <strong>corretude</strong> (não perder dados), depois <strong>visibilidade</strong> (enxergar o sistema), depois <strong>confiabilidade</strong> (resistir a falhas), por fim <strong>escala/processo</strong>.</p>
    <div class="section-tags">
      <span class="tag-p1">P1 Fundacional</span>
      <span class="tag-p2">P2 Confiabilidade</span>
      <span class="tag-p3">P3 Escala</span>
    </div>
  </div>

  <h2>Sequência em fases</h2>
  <div class="mermaid">
flowchart LR
  subgraph p1 ["P1 · Corretude + Visibilidade"]
    A1["Outbox atômico"] --> A2["Idempotência uniforme"]
    A2 --> A3["RFC-7807"]
    A3 --> A4["OTel: tracing + métricas"]
  end
  subgraph p2 ["P2 · Confiabilidade"]
    B1["Circuit breaker + retry/timeout"] --> B2["Saga do checkout"]
    B2 --> B3["CI: build/lint/test"]
    B3 --> B4["Testcontainers"]
  end
  subgraph p3 ["P3 · Escala + Contrato"]
    C1["AsyncAPI + Pact"] --> C2["Grafana stack + alertas"]
    C2 --> C3["CD + rate limiting"]
    C3 --> C4["(condicional) K8s/CDC"]
  end
  p1 --> p2 --> p3
  </div>

  <h2>P1 — Fundacional (corretude + visibilidade)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Item</th><th>Por quê</th><th>Esforço</th><th>Prioridade</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Outbox na mesma transação</td><td>Elimina risco de pedido sem evento (ou vice-versa)</td><td>Baixo</td><td><span class="tag-p1">P1</span></td></tr>
        <tr><td class="td-bold">Idempotência uniforme nos consumers</td><td>Pré-requisito de saga e retry seguros; evita duplicação</td><td>Médio</td><td><span class="tag-p1">P1</span></td></tr>
        <tr><td class="td-bold">RFC-7807 (Problem Details)</td><td>Erros padronizados; melhora DX e integração</td><td>Baixo</td><td><span class="tag-p1">P1</span></td></tr>
        <tr><td class="td-bold">OpenTelemetry: tracing + métricas mínimas</td><td>Zero visibilidade hoje; maior ROI de diagnóstico</td><td>Médio</td><td><span class="tag-p1">P1</span></td></tr>
      </tbody>
    </table>
  </div>

  <h2>P2 — Confiabilidade</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Item</th><th>Por quê</th><th>Esforço</th><th>Prioridade</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Circuit breaker + retry/timeout</td><td>Evita falhas em cascata em PSP/Keycloak/Typesense</td><td>Médio</td><td><span class="tag-p2">P2</span></td></tr>
        <tr><td class="td-bold">Saga do checkout (orquestração)</td><td>Transação de negócio confiável com compensações</td><td>Alto</td><td><span class="tag-p2">P2</span></td></tr>
        <tr><td class="td-bold">CI (build/lint/typecheck/test)</td><td>Qualidade automatizada em cada PR; gate de cobertura</td><td>Médio</td><td><span class="tag-p2">P2</span></td></tr>
        <tr><td class="td-bold">Testcontainers (Postgres/RabbitMQ reais)</td><td>Cumpre a diretriz de "sem mock de banco"</td><td>Médio</td><td><span class="tag-p2">P2</span></td></tr>
      </tbody>
    </table>
  </div>

  <h2>P3 — Escala, contrato e processo</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Item</th><th>Por quê</th><th>Esforço</th><th>Prioridade</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">AsyncAPI + testes de contrato (Pact)</td><td>Documenta e protege contratos de eventos/serviços</td><td>Médio</td><td><span class="tag-p3">P3</span></td></tr>
        <tr><td class="td-bold">Grafana stack + alertas (DLQ, p95, erro)</td><td>Observabilidade operacional completa</td><td>Médio</td><td><span class="tag-p3">P3</span></td></tr>
        <tr><td class="td-bold">CD automatizado + rate limiting + secret manager</td><td>Entrega contínua segura</td><td>Médio</td><td><span class="tag-p3">P3</span></td></tr>
        <tr><td class="td-bold">k6 (testes de carga)</td><td>Validar limites antes de picos (campanhas)</td><td>Baixo</td><td><span class="tag-p3">P3</span></td></tr>
        <tr><td class="td-bold">(Condicional) K8s/Helm/ArgoCD · Kafka/Debezium</td><td>Só se a escala/integrações exigirem</td><td>Alto</td><td><span class="tag-p3">P3</span></td></tr>
      </tbody>
    </table>
  </div>

  <h2>Resumo visual de prioridade</h2>
  <div class="card-grid">
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">🔴</span> Faça primeiro</div>
      <p>Outbox atômico · idempotência · RFC-7807 · OTel. Baixo/médio esforço, alto risco mitigado.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🟠</span> Em seguida</div>
      <p>Circuit breaker · saga · CI · Testcontainers. Constroem sobre a base de corretude.</p>
    </div>
    <div class="card card-slate">
      <div class="card-title"><span class="card-icon">⚪</span> Depois / condicional</div>
      <p>AsyncAPI/Pact · Grafana/alertas · CD · k6 · (K8s/CDC só se necessário).</p>
    </div>
  </div>

  <div class="alert alert-emerald">
    <span class="alert-icon">🏁</span>
    <div class="alert-body">
      <div class="alert-title">Norte do roadmap</div>
      <p>Não é "virar a stack do curso". É <strong>maturar o que já temos</strong>: o Citybox já é event-driven + CQRS + OIDC. Fechando corretude (P1) e confiabilidade (P2), alcançamos o nível de microsserviços do currículo sem o peso operacional de Kafka/K8s — adotáveis depois, se a escala pedir.</p>
    </div>
  </div>

  <div style="margin-top:24px;">
    <button class="feedback-save-btn" id="exportFeedbackBtn">📋 Copiar relatório de aprovação</button>
  </div>
</div>
`
});
