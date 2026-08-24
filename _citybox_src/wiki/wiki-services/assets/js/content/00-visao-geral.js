WIKI.register({
  id: 'visao-geral',
  title: 'Visão Geral — Services',
  icon: '⚙️',
  searchText: 'visão geral services serviços payment-api plataforma citybox blueprint ecossistema PSP pagamentos processamento multi-tenant',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Introdução</div>
  <h1 class="section-title">⚙️ Visão Geral — Services Citybox</h1>
  <p class="section-subtitle">A pasta <code>services/</code> agrupa serviços especializados do monorepo Citybox — separados dos apps por terem domínios de negócio próprios com schemas Prisma independentes, filas dedicadas e adaptadores de PSP isolados. Este wiki é o <strong>blueprint de desenvolvimento</strong>: documenta o que existe hoje e projeta o que deve ser construído.</p>
  <div class="section-tags">
    <span class="tag-teal">Serviços internos</span>
    <span class="tag-blue">Domínio próprio</span>
    <span class="tag-gray">services/</span>
    <span class="tag-amber">Blueprint</span>
  </div>
</div>

<div class="alert alert-teal">
  <div class="alert-icon">💡</div>
  <div class="alert-body">
    <div class="alert-title">O que são os Services?</div>
    <p>Os serviços em <code>services/</code> diferem dos apps em <code>apps/</code> por serem verticalmente isolados: cada um possui seu próprio schema Prisma, suas próprias filas RabbitMQ e seus próprios adaptadores de integração externa. Isso garante que mudanças em pagamentos, por exemplo, não afetam o schema de catálogo ou de usuários.</p>
  </div>
</div>

<div class="eco-callout">
  <div class="eco-icon">🧭</div>
  <div class="eco-body">
    <div class="eco-title">Ecossistema Citybox — você está nos Services (infraestrutura de negócio)</div>
    <div class="eco-links">
      Os Services são a camada de infraestrutura de negócio que sustenta toda a operação.
      Os lojistas operam no <a href="/wiki-erp/wiki-erp/">ERP Base</a>
      (e nas verticais <a href="/wiki-erp/wiki-erp-food/">Food</a> ·
      <a href="/wiki-erp/wiki-erp-market/">Market</a>);
      os consumidores compram no <a href="/wiki-marketplace/">Marketplace</a>;
      a plataforma é governada no <a href="/wiki-admin/">Admin</a>.
      <br><strong>Princípio:</strong> Admin governa · ERP opera · Marketplace vende · <strong>Services processam</strong>.
    </div>
  </div>
</div>

<h2>Services ativos</h2>
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Serviço</th>
        <th>Porta</th>
        <th>Stack</th>
        <th>Responsabilidade</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="td-bold">payment-api</td>
        <td><code>:3106</code></td>
        <td>NestJS + Prisma</td>
        <td>Processamento multi-PSP, split, estorno, settlement</td>
        <td><span class="status-badge status-functional">✅ Funcional</span></td>
      </tr>
    </tbody>
  </table>
</div>

<h2>Posição no ecossistema</h2>
<div class="mermaid-wrap">
  <div class="mermaid">
flowchart LR
  MA[marketplace-api] -->|checkout| PA[payment-api :3106]
  PA -->|cobrança| Stone[Stone]
  PA -->|cobrança| Stripe[Stripe]
  PA -->|cobrança| MP[MercadoPago]
  Stone -->|webhook| PA
  Stripe -->|webhook| PA
  MP -->|webhook| PA
  PA -->|eventos| RMQ[RabbitMQ]
  RMQ -->|projeção| W[workers]
  W -->|read models| TS[Typesense / Postgres]
  </div>
  <div class="mermaid-caption">Posição do payment-api no ecossistema Citybox</div>
</div>

<h2>Princípios de design dos Services</h2>
<div class="card-grid">
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">🗄️</span> Schema Prisma próprio</div>
    <p>Cada service tem seu próprio schema Prisma — independente do schema platform (<code>packages/database/prisma/platform/</code>) e do schema tenant (<code>packages/database/prisma/tenant/</code>). Isso garante isolamento de dados e permite evoluir o modelo de pagamentos sem afetar o catálogo.</p>
  </div>
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">🔌</span> PSP adapters isolados</div>
    <p>Adaptadores de PSP (Stone, Stripe, MercadoPago) vivem dentro do service — nunca nos apps. A interface <code>providers/</code> abstrai as diferenças entre gateways, permitindo adicionar um novo PSP sem alterar a camada de orquestração.</p>
  </div>
  <div class="card card-blue">
    <div class="card-title"><span class="card-icon">📨</span> Eventos via RabbitMQ</div>
    <p>Events de pagamento são publicados no RabbitMQ e consumidos pelos workers — nunca chamadas síncronas de volta para o marketplace-api. Isso garante desacoplamento e resiliência a falhas de downstream.</p>
  </div>
  <div class="card card-blue">
    <div class="card-title"><span class="card-icon">🔒</span> Auth entre serviços</div>
    <p>Comunicação entre marketplace-api e payment-api usa JWT interno — os mesmos guards JWT de <code>@citybox/nest-common</code>, mas com tokens gerados pelo serviço chamador, não pelo Keycloak público.</p>
  </div>
</div>
`
});
