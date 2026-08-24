WIKI.register({
  id: 'matriz-maturidade',
  title: 'Matriz de maturidade',
  icon: '📊',
  searchText: 'matriz maturidade gap analysis padroes status presente parcial ausente evidencia arquivo outbox cqrs ddd hexagonal saga idempotente dlq resiliencia circuit breaker observabilidade contratos cobertura',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Diagnóstico</div>
    <h1 class="section-title">📊 Matriz de maturidade</h1>
    <p class="section-subtitle">Cada padrão do currículo de microsserviços × status real no monorepo × evidência (arquivo) × ação recomendada. Baseado em varredura de <code>apps/</code>, <code>packages/</code>, <code>services/</code> e <code>verticals/</code>.</p>
    <div class="section-tags">
      <span class="tag-emerald">Gap analysis</span>
      <span class="tag-slate">Evidências reais</span>
    </div>
  </div>

  <h2>Cobertura por domínio</h2>
  <p>Estimativa de aderência do Citybox ao currículo, por grande área:</p>

  <div class="coverage"><span class="coverage-label">Comunicação/Eventos</span><div class="coverage-track"><div class="coverage-fill partial" style="width:65%"></div></div><span class="coverage-pct">65%</span></div>
  <div class="coverage"><span class="coverage-label">CQRS / Projeções</span><div class="coverage-track"><div class="coverage-fill full" style="width:80%"></div></div><span class="coverage-pct">80%</span></div>
  <div class="coverage"><span class="coverage-label">DDD / Hexagonal</span><div class="coverage-track"><div class="coverage-fill low" style="width:35%"></div></div><span class="coverage-pct">35%</span></div>
  <div class="coverage"><span class="coverage-label">Dados distribuídos</span><div class="coverage-track"><div class="coverage-fill partial" style="width:60%"></div></div><span class="coverage-pct">60%</span></div>
  <div class="coverage"><span class="coverage-label">Segurança</span><div class="coverage-track"><div class="coverage-fill full" style="width:85%"></div></div><span class="coverage-pct">85%</span></div>
  <div class="coverage"><span class="coverage-label">Caching</span><div class="coverage-track"><div class="coverage-fill full" style="width:80%"></div></div><span class="coverage-pct">80%</span></div>
  <div class="coverage"><span class="coverage-label">Resiliência</span><div class="coverage-track"><div class="coverage-fill low" style="width:30%"></div></div><span class="coverage-pct">30%</span></div>
  <div class="coverage"><span class="coverage-label">Observabilidade</span><div class="coverage-track"><div class="coverage-fill low" style="width:15%"></div></div><span class="coverage-pct">15%</span></div>
  <div class="coverage"><span class="coverage-label">Testes avançados</span><div class="coverage-track"><div class="coverage-fill low" style="width:25%"></div></div><span class="coverage-pct">25%</span></div>
  <div class="coverage"><span class="coverage-label">DevOps / IaC</span><div class="coverage-track"><div class="coverage-fill low" style="width:20%"></div></div><span class="coverage-pct">20%</span></div>

  <h2>Matriz detalhada — padrão × status × evidência × ação</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Padrão</th><th>Status</th><th>Evidência no repo</th><th>Ação</th></tr></thead>
      <tbody>
        <tr>
          <td class="td-bold">Transactional Outbox</td>
          <td><span class="status-badge status-partial">🔶 Parcial</span></td>
          <td><code>apps/marketplace/api/src/outbox/outbox.service.ts</code> + worker poll em <code>apps/workers/src/workers-runtime.service.ts</code>. Outbox gravado <em>fora</em> da <code>$transaction</code> do pedido.</td>
          <td>Gravar evento na <strong>mesma</strong> <code>$transaction</code> do agregado. Ver <a href="#comunicacao-eventos">Comunicação/Eventos</a>.</td>
        </tr>
        <tr>
          <td class="td-bold">CQRS / Read Models</td>
          <td><span class="status-badge status-functional">✅ Presente</span></td>
          <td>Write em <code>marketplace-api</code>; projeção em <code>apps/workers/src/projection/index.ts</code>; read no <code>marketplace-bff</code> (<code>MarketplaceStore/Offer/Availability</code>).</td>
          <td>Manter. Reforçar idempotência da projeção.</td>
        </tr>
        <tr>
          <td class="td-bold">Idempotent Consumer</td>
          <td><span class="status-badge status-partial">🔶 Parcial</span></td>
          <td>Forte em <code>apps/workers/src/payments/apply-payment.ts</code> (<code>ProcessedEvent</code> antes de processar). Fraco em <code>projection/index.ts</code> (grava no fim).</td>
          <td>Padronizar check de <code>ProcessedEvent</code> no início de todo consumer.</td>
        </tr>
        <tr>
          <td class="td-bold">Dead Letter Queue</td>
          <td><span class="status-badge status-functional">✅ Presente</span></td>
          <td>DLX em todas as filas (<code>packages/messaging/src/index.ts</code>); DLQ de webhooks em <code>services/payment-api</code>.</td>
          <td>Adicionar painel/alerta de DLQ (observabilidade).</td>
        </tr>
        <tr>
          <td class="td-bold">Saga / Orquestração</td>
          <td><span class="status-badge status-absent">⛔ Ausente</span></td>
          <td>Checkout C-05 documentado como não-saga (etapas soltas em orders / inventory / payment). Sem orquestrador nem compensações.</td>
          <td>Implementar orquestrador de checkout. Ver <a href="#saga-checkout">Saga do checkout</a>.</td>
        </tr>
        <tr>
          <td class="td-bold">DDD tático (VO, Aggregate, Domain Event)</td>
          <td><span class="status-badge status-partial">🔶 Parcial</span></td>
          <td><code>Entity&lt;T&gt;</code> + Repository em <code>apps/platform/api</code>. Marketplace usa modelos Prisma anêmicos; sem Value Objects/Domain Services.</td>
          <td>Aplicar VO/Aggregate nos agregados críticos (Order, Inventory).</td>
        </tr>
        <tr>
          <td class="td-bold">Arquitetura Hexagonal</td>
          <td><span class="status-badge status-partial">🔶 Parcial</span></td>
          <td>Ports/adapters em <code>apps/platform/api/src/modules/*</code> (ex.: <code>keycloak-user.provider.interface.ts</code> + adapter). Demais serviços NestJS clássico.</td>
          <td>Adotar ports/adapters onde há integração externa (PSP, Keycloak, search).</td>
        </tr>
        <tr>
          <td class="td-bold">Circuit Breaker / Retry / Timeout</td>
          <td><span class="status-badge status-absent">⛔ Ausente</span></td>
          <td>Sem circuit breaker. Retry só reconexão RabbitMQ; timeout pontual no adapter Keycloak.</td>
          <td>Introduzir <code>opossum</code> em chamadas a PSP/Keycloak. Ver <a href="#resiliencia-observabilidade">Resiliência</a>.</td>
        </tr>
        <tr>
          <td class="td-bold">Database per Service</td>
          <td><span class="status-badge status-partial">🔶 Híbrido</span></td>
          <td>Tenant DB compartilhado (<code>TENANT_DATABASE_URL</code>) + <code>multiSchema</code> por vertical; <code>payment-api</code> em DB próprio.</td>
          <td>Manter híbrido; isolar via schema/RLS. Ver <a href="#dados-distribuidos">Dados</a>.</td>
        </tr>
        <tr>
          <td class="td-bold">Caching (Cache-Aside)</td>
          <td><span class="status-badge status-functional">✅ Presente</span></td>
          <td><code>apps/marketplace/bff/src/cache/cache.service.ts</code> (Redis, TTL, hit/miss); carrinho em Redis.</td>
          <td>Adicionar cache stampede protection e fallback em queda do Redis.</td>
        </tr>
        <tr>
          <td class="td-bold">Auth (OAuth2/OIDC/JWT)</td>
          <td><span class="status-badge status-functional">✅ Presente</span></td>
          <td>Keycloak + JWKS em <code>apps/marketplace/api/src/auth/*</code> e <code>@citybox/nest-common</code> (RBAC por roles).</td>
          <td>Manter. Centralizar guards/escopos no pacote comum.</td>
        </tr>
        <tr>
          <td class="td-bold">Contratos (OpenAPI / AsyncAPI / RFC-7807)</td>
          <td><span class="status-badge status-partial">🔶 Parcial</span></td>
          <td>OpenAPI/Swagger presentes (<code>packages/docs/api</code>). Sem AsyncAPI; erros sem <code>application/problem+json</code>.</td>
          <td>Gerar AsyncAPI dos CloudEvents; adotar RFC-7807.</td>
        </tr>
        <tr>
          <td class="td-bold">Observabilidade (tracing/métricas/logs)</td>
          <td><span class="status-badge status-absent">⛔ Ausente</span></td>
          <td>Só health checks + contadores in-process no <code>payment-api</code>. Sem OTel/Prometheus/Grafana.</td>
          <td>Instrumentar com OpenTelemetry. Ver <a href="#resiliencia-observabilidade">Observabilidade</a>.</td>
        </tr>
        <tr>
          <td class="td-bold">Testes (Testcontainers / Contract / k6)</td>
          <td><span class="status-badge status-partial">🔶 Parcial</span></td>
          <td>Unit (node:test/Vitest) ok; testes batem em mocks/in-memory apesar da diretriz de Postgres real. Sem Testcontainers/Pact/k6.</td>
          <td>Testcontainers p/ integração; Pact p/ contratos; k6 p/ carga.</td>
        </tr>
        <tr>
          <td class="td-bold">CI/CD + IaC</td>
          <td><span class="status-badge status-absent">⛔ Ausente</span></td>
          <td>Sem <code>.github/workflows</code> nem <code>.gitlab-ci.yml</code>; deploy por scripts shell + Compose. Sem Terraform/Helm/K8s.</td>
          <td>Pipeline build→lint→typecheck→test→deploy. Ver <a href="#seguranca-devops">DevOps</a>.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-emerald">
    <span class="alert-icon">📌</span>
    <div class="alert-body">
      <div class="alert-title">Leitura do diagnóstico</div>
      <p>O Citybox já é um sistema <strong>orientado a eventos com CQRS real</strong> — a fundação está certa. Os maiores riscos não são "falta de tecnologia", e sim <strong>corretude</strong> (atomicidade do outbox, idempotência uniforme) e <strong>visibilidade</strong> (zero tracing). Esses dois eixos guiam o <a href="#roadmap">roadmap</a>.</p>
    </div>
  </div>
</div>
`
});
