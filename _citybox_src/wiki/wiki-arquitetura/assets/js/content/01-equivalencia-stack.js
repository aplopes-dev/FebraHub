WIKI.register({
  id: 'equivalencia-stack',
  title: 'Equivalência de stack',
  icon: '🔀',
  searchText: 'equivalencia spring nestjs traducao stack spring cloud gateway nginx bff spring amqp kafka rabbitmq spring security keycloak spring cloud config unleash micrometer actuator opentelemetry eureka service discovery testcontainers rest assured k6 junit vitest mockito',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Introdução</div>
    <h1 class="section-title">🔀 Equivalência Spring ↔ Citybox/NestJS</h1>
    <p class="section-subtitle">Cada tecnologia do curso AlgaWorks mapeada para o equivalente na nossa stack. A coluna <em>Status</em> indica se já temos, se é gap a fechar, ou se é deliberadamente não-aplicável (N.A.) ao nosso contexto.</p>
    <div class="section-tags">
      <span class="tag-emerald">Tradução 1:1</span>
      <span class="tag-slate">Java → TypeScript</span>
    </div>
  </div>

  <h2>Comunicação e Gateway</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Curso (Spring)</th><th>Citybox (NestJS/Node)</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Spring Cloud Gateway</td><td>nginx (reverse proxy/TLS) + <code>marketplace-bff</code> (API Composition / BFF)</td><td><span class="status-badge status-functional">✅ Temos</span></td></tr>
        <tr><td class="td-bold">Backends for Frontends Pattern</td><td><code>marketplace-bff :3102</code> — porta única do app consumidor</td><td><span class="status-badge status-functional">✅ Temos</span></td></tr>
        <tr><td class="td-bold">Spring MVC / RestClient / WebClient</td><td>NestJS controllers + <code>fetch</code> / clients HTTP locais</td><td><span class="status-badge status-functional">✅ Temos</span></td></tr>
        <tr><td class="td-bold">Spring AMQP (RabbitMQ)</td><td><code>@citybox/messaging</code> sobre <code>amqplib</code></td><td><span class="status-badge status-functional">✅ Temos</span></td></tr>
        <tr><td class="td-bold">Spring for Apache Kafka</td><td>—  (usamos RabbitMQ; ver <a href="#dados-distribuidos">decisão</a>)</td><td><span class="status-badge status-proposed">⚪ N.A. por ora</span></td></tr>
        <tr><td class="td-bold">RFC-7807 Problem Details</td><td>ExceptionFilter NestJS padronizado (gap)</td><td><span class="status-badge status-absent">⛔ Gap</span></td></tr>
      </tbody>
    </table>
  </div>

  <h2>Contratos e documentação</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Curso (Spring)</th><th>Citybox (NestJS/Node)</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">OpenAPI + Swagger UI</td><td><code>@nestjs/swagger</code> + <code>openapi.json</code> em <code>packages/docs/api</code></td><td><span class="status-badge status-functional">✅ Temos</span></td></tr>
        <tr><td class="td-bold">AsyncAPI</td><td>Catálogo de eventos só em Markdown (<code>packages/docs/events</code>); gerar AsyncAPI a partir do CloudEvents</td><td><span class="status-badge status-absent">⛔ Gap</span></td></tr>
        <tr><td class="td-bold">Design-First</td><td>Hoje code-first; mover contratos públicos para design-first</td><td><span class="status-badge status-partial">🔶 Parcial</span></td></tr>
      </tbody>
    </table>
  </div>

  <h2>Segurança e configuração</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Curso (Spring)</th><th>Citybox (NestJS/Node)</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Spring Authorization Server</td><td>Keycloak 26.6 (authorization server gerenciado)</td><td><span class="status-badge status-functional">✅ Temos</span></td></tr>
        <tr><td class="td-bold">Spring Security (Resource Server)</td><td>Guards JWT em <code>@citybox/nest-common</code> (validação JWKS Keycloak)</td><td><span class="status-badge status-functional">✅ Temos</span></td></tr>
        <tr><td class="td-bold">OAuth2 / OpenID Connect / JWT</td><td>Keycloak OIDC + <code>jose</code> (verificação JWKS)</td><td><span class="status-badge status-functional">✅ Temos</span></td></tr>
        <tr><td class="td-bold">Spring Cloud Config</td><td>Env vars + <code>@nestjs/config</code>; feature flags via Unleash</td><td><span class="status-badge status-partial">🔶 Parcial</span></td></tr>
        <tr><td class="td-bold">AWS Secrets Manager / Parameter Store</td><td>Secrets em env/compose; sem secret manager dedicado</td><td><span class="status-badge status-partial">🔶 Parcial</span></td></tr>
      </tbody>
    </table>
  </div>

  <h2>Resiliência, escala e descoberta</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Curso (Spring)</th><th>Citybox (NestJS/Node)</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Spring Cloud Circuit Breaker / Resilience4j</td><td><code>opossum</code> (circuit breaker Node) — a adotar</td><td><span class="status-badge status-absent">⛔ Gap</span></td></tr>
        <tr><td class="td-bold">Netflix Eureka / Spring Cloud LoadBalancer</td><td>Service discovery via DNS Docker + nginx upstreams</td><td><span class="status-badge status-proposed">⚪ N.A. (escala atual)</span></td></tr>
        <tr><td class="td-bold">Health Check API</td><td><code>/api/health</code> + <code>/health/ready</code> em todos os serviços</td><td><span class="status-badge status-functional">✅ Temos</span></td></tr>
        <tr><td class="td-bold">Bulkhead</td><td><code>prefetch</code> por consumer RabbitMQ</td><td><span class="status-badge status-partial">🔶 Parcial</span></td></tr>
        <tr><td class="td-bold">Caching (Cache-Aside, Redis)</td><td>Redis + cache-aside no BFF; carrinho em Redis</td><td><span class="status-badge status-functional">✅ Temos</span></td></tr>
      </tbody>
    </table>
  </div>

  <h2>Dados e relatórios</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Curso (Spring)</th><th>Citybox (NestJS/Node)</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">PostgreSQL / MongoDB / Redis</td><td>PostgreSQL 17 (+ pgvector) + Redis 8</td><td><span class="status-badge status-functional">✅ Temos</span></td></tr>
        <tr><td class="td-bold">Database per Service</td><td>Shared tenant DB + schema-per-vertical; <code>payment-api</code> em DB próprio</td><td><span class="status-badge status-partial">🔶 Híbrido</span></td></tr>
        <tr><td class="td-bold">UUID / TSID</td><td><code>citybox_uuid_v7()</code> (UUIDv7 nativo no Postgres)</td><td><span class="status-badge status-functional">✅ Temos</span></td></tr>
        <tr><td class="td-bold">CDC: Kafka Connect + Debezium</td><td>Replicação via eventos RabbitMQ + Postgres replica</td><td><span class="status-badge status-proposed">⚪ N.A. por ora</span></td></tr>
        <tr><td class="td-bold">Reporting Database + Metabase</td><td>Metabase + Postgres replica (read)</td><td><span class="status-badge status-functional">✅ Temos</span></td></tr>
      </tbody>
    </table>
  </div>

  <h2>Observabilidade</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Curso (Spring)</th><th>Citybox (NestJS/Node)</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Spring Boot Actuator</td><td>Health controllers (parcial); falta endpoint de métricas padronizado</td><td><span class="status-badge status-partial">🔶 Parcial</span></td></tr>
        <tr><td class="td-bold">Micrometer / Micrometer Tracing</td><td>OpenTelemetry SDK Node — a adotar</td><td><span class="status-badge status-absent">⛔ Gap</span></td></tr>
        <tr><td class="td-bold">Prometheus + Grafana</td><td>A adotar (<code>prom-client</code> + Grafana)</td><td><span class="status-badge status-absent">⛔ Gap</span></td></tr>
        <tr><td class="td-bold">Elastic APM / Elasticsearch / Kibana</td><td>Não usamos Elastic (busca é Typesense); log aggregation a definir</td><td><span class="status-badge status-absent">⛔ Gap</span></td></tr>
        <tr><td class="td-bold">OpenTelemetry</td><td>Padrão-alvo de instrumentação (vendor-neutro)</td><td><span class="status-badge status-proposed">💡 Alvo</span></td></tr>
      </tbody>
    </table>
  </div>

  <h2>Testes</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Curso (Spring)</th><th>Citybox (NestJS/Node)</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">JUnit / Mockito</td><td>Node test runner (<code>node --test</code> + tsx) e Vitest (React)</td><td><span class="status-badge status-functional">✅ Temos</span></td></tr>
        <tr><td class="td-bold">REST Assured</td><td><code>supertest</code> / fetch em testes de API</td><td><span class="status-badge status-partial">🔶 Parcial</span></td></tr>
        <tr><td class="td-bold">Testcontainers</td><td><code>testcontainers</code> (Node) — a adotar p/ Postgres real</td><td><span class="status-badge status-absent">⛔ Gap</span></td></tr>
        <tr><td class="td-bold">Spring Cloud Contract / Pact</td><td>Pact JS para contratos consumer-driven — a adotar</td><td><span class="status-badge status-absent">⛔ Gap</span></td></tr>
        <tr><td class="td-bold">Grafana k6</td><td>k6 (mesma ferramenta, agnóstica) — a adotar</td><td><span class="status-badge status-absent">⛔ Gap</span></td></tr>
      </tbody>
    </table>
  </div>

  <h2>DevOps e nuvem</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Curso (Spring)</th><th>Citybox (NestJS/Node)</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">GitLab CI/CD</td><td>GitHub Actions / GitLab CI — a adotar (hoje scripts shell)</td><td><span class="status-badge status-absent">⛔ Gap</span></td></tr>
        <tr><td class="td-bold">Docker / Docker Hub</td><td>Docker + Compose (imagens <code>citybox-*</code>)</td><td><span class="status-badge status-functional">✅ Temos</span></td></tr>
        <tr><td class="td-bold">Kubernetes / Helm / Rancher</td><td>Compose em VM/host (sem K8s)</td><td><span class="status-badge status-proposed">⚪ N.A. (escala atual)</span></td></tr>
        <tr><td class="td-bold">ArgoCD / GitOps</td><td>Deploy via scripts; GitOps futuro se migrar p/ K8s</td><td><span class="status-badge status-proposed">⚪ Futuro</span></td></tr>
        <tr><td class="td-bold">Terraform (OpenTofu)</td><td>Sem IaC; provisionamento manual</td><td><span class="status-badge status-absent">⛔ Gap</span></td></tr>
        <tr><td class="td-bold">SonarQube</td><td>ESLint + typecheck; SonarQube opcional</td><td><span class="status-badge status-partial">🔶 Parcial</span></td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-slate">
    <span class="alert-icon">🧭</span>
    <div class="alert-body">
      <div class="alert-title">Legenda de status</div>
      <p><span class="status-badge status-functional">✅ Temos</span> implementado &nbsp;
      <span class="status-badge status-partial">🔶 Parcial</span> existe incompleto &nbsp;
      <span class="status-badge status-absent">⛔ Gap</span> a implementar &nbsp;
      <span class="status-badge status-proposed">⚪ N.A./Futuro</span> deliberadamente fora de escopo no contexto atual (cidade única).</p>
    </div>
  </div>
</div>
`
});
