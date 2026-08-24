WIKI.register({
  id: 'tenancy-municipal',
  title: 'Tenancy Municipal',
  icon: '🏙️',
  searchText: 'tenancy municipal B-01 single-city ilheus_dev marketplace_live multi-cidade Postgres por municipio Cliente Loja Platform enabled vertical cityId migration admin governanca operador clients stores',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Plataforma e Tenancy</div>
    <h1 class="section-title">🏙️ Tenancy Municipal</h1>
    <p class="section-subtitle">O Citybox opera em <strong>duas camadas</strong>: a <strong>governança comercial</strong> (Platform → Cliente → Loja), gerenciada pelo Admin, e a <strong>camada municipal de infra</strong> (B-01), que isola dados por cidade. Hoje o runtime é single-city (<code>ilheus_dev</code>); multi-cidade permanece no roadmap.</p>
    <div class="section-tags">
      <span class="tag-indigo">B-01</span>
      <span class="tag-blue">ilheus_dev</span>
      <span class="tag-violet">marketplace_live</span>
      <span class="tag-amber">Single-city hoje</span>
    </div>
  </div>

  <div class="eco-callout">
    <div class="eco-icon">🔗</div>
    <div class="eco-body">
      <div class="eco-title">Quem governa o quê — Admin vs Marketplace</div>
      <div class="eco-links">
        <strong>Admin</strong> (operador Citybox) cadastra e governa
        <a href="../wiki-admin/index.html#clientes">Clientes</a>,
        <a href="../wiki-admin/index.html#lojas">Lojas</a>,
        planos e verticais em
        <a href="../wiki-admin/index.html#configuracoes-plataforma">Configurações da Plataforma</a>.
        <strong>Marketplace</strong> (BFF :3102) consome o tenant municipal e projeta ofertas para o consumidor — só expõe lojas <code>ativa</code> quando <code>marketplace_live=true</code>.
      </div>
    </div>
  </div>

  <h2>Duas camadas de tenancy</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Camada</th><th>Hierarquia</th><th>Quem governa</th><th>Onde vive</th></tr></thead>
      <tbody>
        <tr>
          <td class="td-bold">Comercial (Admin)</td>
          <td>Platform → <strong>Cliente</strong> → <strong>Loja</strong></td>
          <td>Operador Citybox no Admin</td>
          <td>Schema <code>platform</code> — tabelas <code>clients</code>, <code>stores</code></td>
        </tr>
        <tr>
          <td class="td-bold">Municipal (B-01)</td>
          <td>Platform → <strong>Municipality</strong> → dados do tenant</td>
          <td>Infra + flag <code>marketplace_live</code></td>
          <td>Postgres tenant (<code>ilheus_dev</code> hoje) — catálogo, pedidos, projeções</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">🟢 Hoje (single-city)</div>
    <ul>
      <li>Runtime conecta a <strong>um único banco</strong> tenant (schema <code>ilheus_dev</code>). Todos os clientes e lojas cadastrados no Admin vivem nesse tenant.</li>
      <li>Admin já funciona: CRUD de <code>clients</code> e <code>stores</code> via Platform API (:3103). Status de loja: <code>em_implantacao</code>, <code>ativa</code>, <code>bloqueada</code>.</li>
      <li>Flag <code>marketplace_live</code> no registro do município controla se o app consumidor (BFF) está aberto.</li>
      <li>Verticais habilitadas: hoje sem UI no Admin (rota <code>/config/settings</code> retorna 404) — ver proposta em <a href="../wiki-admin/index.html#configuracoes-plataforma">Admin · Configurações</a>.</li>
    </ul>
  </div>

  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">💡 Proposta — Multi-cidade (B-01 completo)</div>
    <p>Um Postgres por município. Router no BFF detecta cidade por subdomínio (<code>ilheus.citybox.com</code>) ou geolocalização. Tabela <code>Municipality</code> na plataforma global registra conexões. Admin passa a expor toggle de <code>marketplace_live</code> e verticais por município em Configurações da Plataforma.</p>
  </div>

  <h2>Hierarquia unificada (Admin + municipal)</h2>
  <div class="mermaid">
flowchart TD
  P["Platform\nCitybox Global\n(Admin :3108)"]
  P --> M["Municipality\nIlhéus — ilheus_dev\nmarketplace_live"]
  M --> C1["Cliente A\n(CNPJ — clients)"]
  M --> C2["Cliente B\n(CPF — clients)"]
  C1 --> S1["Loja Food\nstatus: ativa"]
  C1 --> S2["Loja Varejo\nstatus: em_implantacao"]
  C2 --> S3["Loja Saúde\nstatus: ativa"]
  S1 --> MO["MarketplaceOffer\n(projeção BFF)"]
  S3 --> MO
  </div>
  <p class="mermaid-caption">Lojas em <code>em_implantacao</code> ou <code>bloqueada</code> não aparecem no marketplace. Apenas lojas <code>ativa</code> são projetadas em <code>MarketplaceOffer</code> quando <code>marketplace_live=true</code>.</p>

  <h2>Entidades e quem as governa</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Entidade</th><th>Campos relevantes</th><th>Governança</th><th>Wiki Admin</th></tr></thead>
      <tbody>
        <tr>
          <td class="td-bold"><code>Client</code> (Cliente)</td>
          <td><code>name, document, plan, status</code></td>
          <td>Operador Citybox — CRUD no Admin</td>
          <td><a href="../wiki-admin/index.html#clientes">Clientes</a> · <a href="../wiki-admin/index.html#cliente-detalhe">Detalhe</a></td>
        </tr>
        <tr>
          <td class="td-bold"><code>Store</code> (Loja)</td>
          <td><code>clientId, name, vertical, slug, status</code></td>
          <td>Operador Citybox — CRUD + módulos/integrações</td>
          <td><a href="../wiki-admin/index.html#lojas">Lojas</a> · <a href="../wiki-admin/index.html#loja-detalhe">Detalhe</a></td>
        </tr>
        <tr>
          <td class="td-bold"><code>Municipality</code></td>
          <td><code>slug, dbUrl, marketplace_live, timezone</code></td>
          <td>Infra B-01 — toggle proposto no Admin</td>
          <td><a href="../wiki-admin/index.html#configuracoes-plataforma">Configurações da Plataforma</a></td>
        </tr>
        <tr>
          <td class="td-bold"><code>PlatformEnabledVertical</code></td>
          <td><code>municipalityId, vertical, enabled</code></td>
          <td>Quais verticais o município expõe ao consumidor</td>
          <td><a href="../wiki-admin/index.html#configuracoes-plataforma">Configurações · Verticais</a></td>
        </tr>
        <tr>
          <td class="td-bold"><code>MarketplaceOffer</code></td>
          <td><code>storeId, catalogItemId, price, available</code></td>
          <td>Read model — projetado pelo worker (:3105)</td>
          <td>— (lado consumidor)</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>Flag marketplace_live × status da loja</h2>
  <div class="card-grid">
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">✅</span> marketplace_live = true</div>
      <p>BFF serve home, busca e checkout para o município. Lojas com status <code>ativa</code> no Admin aparecem no app. Lojas <code>em_implantacao</code> ficam ocultas — permitem onboarding pré-lançamento via <a href="../wiki-admin/index.html#onboarding-jornada">Admin · Onboarding</a>.</p>
    </div>
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">🔴</span> marketplace_live = false</div>
      <p>App consumidor indisponível (manutenção ou pré-go-live municipal). Operador continua cadastrando clientes/lojas no Admin; ERP e projeções podem rodar em background.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">⛔</span> Loja bloqueada</div>
      <p>Independente de <code>marketplace_live</code>: loja com status <code>bloqueada</code> no Admin (<a href="../wiki-admin/index.html#lojas">Lojas</a>) sai da vitrine e deixa de aceitar pedidos no marketplace.</p>
    </div>
  </div>

  <h2>Fluxo: Admin cadastra → Marketplace exibe</h2>
  <div class="mermaid">
sequenceDiagram
  participant Op as Operador Admin
  participant API as Platform API :3103
  participant ERP as ERP Lojista
  participant W as Worker :3105
  participant BFF as BFF :3102
  participant App as App Consumidor

  Op->>API: POST /v1/clients (novo Cliente)
  Op->>API: POST /v1/stores (Loja em_implantacao)
  Op->>ERP: Onboarding — catálogo, módulos
  Op->>API: PATCH store status → ativa
  ERP->>W: catalog.item.updated (RabbitMQ)
  W->>W: upsert MarketplaceOffer + Typesense
  App->>BFF: GET /v1/app/stores (se marketplace_live)
  BFF-->>App: lojas ativas + ofertas
  </div>

  <h2>Roadmap multi-cidade</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Fase</th><th>Ação</th><th>Admin</th><th>Marketplace</th></tr></thead>
      <tbody>
        <tr><td>MVP</td><td>Single-city (<code>ilheus_dev</code>). Cliente/Loja no Admin.</td><td>CRUD funcional</td><td>BFF aponta para um tenant</td></tr>
        <tr><td>V1</td><td>UI de Configurações: verticais + <code>marketplace_live</code></td><td><span class="status-badge status-proposed">🔵 Proposta</span></td><td>Respeita flags do Admin</td></tr>
        <tr><td>V1.5</td><td>Router BFF por subdomínio/cidade</td><td>Lista de municípios</td><td>Multi-tenant read path</td></tr>
        <tr><td>V2</td><td>1 Postgres por município</td><td>Provisionamento de cidade</td><td>Isolamento total de dados</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-indigo">
    <span class="alert-icon">💡</span>
    <div class="alert-body">
      <div class="alert-title">Single-city é o caminho certo para o MVP</div>
      <p>Com Ilhéus como único tenant, o Admin já governa Cliente e Loja de forma funcional. O marketplace consome projeções desse tenant. Multi-cidade aumenta complexidade operacional — implementar depois que billing, onboarding e catálogo estiverem estáveis, com playbook documentado aqui e toggles centralizados no Admin.</p>
    </div>
  </div>
</div>
`
});
