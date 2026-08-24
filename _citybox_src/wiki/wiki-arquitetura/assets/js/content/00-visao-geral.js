WIKI.register({
  id: 'visao-geral',
  title: 'Visão geral',
  icon: '🏛️',
  searchText: 'visao geral arquitetura alvo microsservicos algaworks especialista java spring nestjs equivalencia tese curriculo blueprint citybox como ler',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Introdução</div>
    <h1 class="section-title">🏛️ Arquitetura-alvo do Citybox</h1>
    <p class="section-subtitle">Este wiki usa o currículo do curso <strong>AlgaWorks · Especialista Microsserviços</strong> (focado em Java/Spring) como <strong>checklist de padrões de microsserviços</strong>, traduz cada item para a nossa stack <strong>TypeScript / NestJS / React</strong> e desenha a arquitetura-alvo do Citybox com decisões e diagramas.</p>
    <div class="section-tags">
      <span class="tag-emerald">Blueprint</span>
      <span class="tag-slate">Plataforma</span>
      <span class="tag-teal">NestJS + React</span>
      <span class="tag-blue">Microsserviços</span>
    </div>
  </div>

  <div class="eco-callout">
    <div class="eco-icon">🔗</div>
    <div class="eco-body">
      <div class="eco-title">Como este wiki conversa com os demais</div>
      <div class="eco-links">
        O recorte de produto do consumidor está em <a href="../wiki-marketplace/">Wiki Marketplace</a>;
        a operação da plataforma em <a href="../wiki-admin/">Wiki Admin</a>.
        Aqui o foco é <strong>transversal</strong>: como os serviços se comunicam, resistem a falhas e evoluem.
      </div>
    </div>
  </div>

  <h2>A tese: os fundamentos são agnósticos de linguagem</h2>
  <p>O curso ensina padrões de microsserviços com Java 21 + Spring Boot 3.4 + Spring Cloud. Quase tudo é <strong>padrão arquitetural</strong>, não detalhe de framework. O Citybox aplica os mesmos fundamentos na stack Node:</p>

  <div class="card-grid">
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">📐</span> Padrões = portáveis</div>
      <p>Outbox, Saga, CQRS, Idempotent Consumer, Circuit Breaker, DDD, Hexagonal — todos independem de Java. Valem igualmente em NestJS.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🔧</span> Ferramentas = equivalentes</div>
      <p>Onde o curso usa Spring Cloud Gateway, Eureka, Micrometer, nós usamos nginx + BFF, hostnames Docker e (alvo) OpenTelemetry.</p>
    </div>
    <div class="card card-slate">
      <div class="card-title"><span class="card-icon">⚖️</span> Decisões = nossas</div>
      <p>Kafka vs RabbitMQ, DB-per-service vs schema-per-vertical, K8s vs Compose — decidimos pelo contexto de uma cidade única (Ilhéus), não por modismo.</p>
    </div>
  </div>

  <h2>Onde o Citybox está hoje — em uma tela</h2>
  <p>Resumo do diagnóstico do monorepo (detalhe e evidências de arquivo na seção <a href="#matriz-maturidade">Matriz de maturidade</a>):</p>

  <div class="card-grid">
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">✅</span> Sólido</div>
      <ul>
        <li>CQRS write/read (core-api → workers → read models)</li>
        <li>Mensageria RabbitMQ + CloudEvents + DLQ</li>
        <li>Auth Keycloak (OAuth2/OIDC/JWT)</li>
        <li>Cache Redis (cache-aside no BFF)</li>
        <li>Busca Typesense; BFF como porta única do consumidor</li>
      </ul>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🔶</span> Parcial</div>
      <ul>
        <li>Transactional Outbox (atomicidade incompleta)</li>
        <li>Idempotência (forte em payments, fraca em projeções)</li>
        <li>DDD/Hexagonal (só no <code>platform-api</code>)</li>
        <li>Resiliência (health + prefetch; sem circuit breaker)</li>
        <li>Contratos (OpenAPI/Swagger; sem AsyncAPI/RFC-7807)</li>
      </ul>
    </div>
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">⛔</span> Ausente</div>
      <ul>
        <li>Saga/orquestração do checkout (C-05)</li>
        <li>Observabilidade (OpenTelemetry/Prometheus/Grafana)</li>
        <li>Circuit breaker / tracing distribuído</li>
        <li>CI/CD e Infra as Code</li>
        <li>Testcontainers / testes de contrato / k6</li>
      </ul>
    </div>
  </div>

  <h2>Stack atual (resumo)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Camada</th><th>Tecnologia Citybox</th><th>Versão</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Backend</td><td>NestJS</td><td>11.1</td></tr>
        <tr><td class="td-bold">Frontend</td><td>Next.js / React</td><td>16.2 / 19.2</td></tr>
        <tr><td class="td-bold">ORM</td><td>Prisma</td><td>7.8</td></tr>
        <tr><td class="td-bold">Banco</td><td>PostgreSQL (+ pgvector)</td><td>17</td></tr>
        <tr><td class="td-bold">Mensageria</td><td>RabbitMQ (amqplib)</td><td>4.3</td></tr>
        <tr><td class="td-bold">Cache</td><td>Redis (ioredis)</td><td>8</td></tr>
        <tr><td class="td-bold">Busca</td><td>Typesense</td><td>30.2</td></tr>
        <tr><td class="td-bold">Auth</td><td>Keycloak</td><td>26.6</td></tr>
        <tr><td class="td-bold">Edge</td><td>nginx (reverse proxy + TLS)</td><td>1.27</td></tr>
        <tr><td class="td-bold">Storage</td><td>MinIO (S3-compat)</td><td>—</td></tr>
        <tr><td class="td-bold">Feature flags</td><td>Unleash</td><td>6.9</td></tr>
        <tr><td class="td-bold">BI</td><td>Metabase + Postgres replica</td><td>0.53</td></tr>
        <tr><td class="td-bold">Build/Orquestração</td><td>Turborepo + pnpm + Docker Compose</td><td>—</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Como ler este documento</h2>
  <ol>
    <li><strong><a href="#equivalencia-stack">Equivalência de stack</a></strong> — tradução Spring ↔ Citybox/NestJS, item a item.</li>
    <li><strong><a href="#matriz-maturidade">Matriz de maturidade</a></strong> — cada padrão do curso × status no Citybox × evidência × ação.</li>
    <li><strong>Arquitetura-alvo</strong> — <a href="#arquitetura-alvo">componentes</a>, <a href="#comunicacao-eventos">comunicação/eventos</a>, <a href="#dados-distribuidos">dados</a>, <a href="#saga-checkout">saga</a>, <a href="#resiliencia-observabilidade">resiliência/observabilidade</a>, <a href="#seguranca-devops">segurança/DevOps</a>.</li>
    <li><strong><a href="#roadmap">Roadmap</a></strong> — sequência priorizada P1/P2/P3.</li>
  </ol>

  <div class="alert alert-emerald">
    <span class="alert-icon">🎯</span>
    <div class="alert-body">
      <div class="alert-title">Princípio condutor: maturidade incremental, não big bang</div>
      <p>O Citybox não precisa de Kafka, Kubernetes e service mesh para uma cidade única. A meta é fechar os gaps que dão <strong>correção (atomicidade do outbox, idempotência), visibilidade (observabilidade) e confiabilidade (saga, resiliência)</strong> — antes de adotar tecnologia pesada por status.</p>
    </div>
  </div>
</div>
`
});
