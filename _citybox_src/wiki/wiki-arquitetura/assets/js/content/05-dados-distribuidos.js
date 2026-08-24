WIKI.register({
  id: 'dados-distribuidos',
  title: 'Dados distribuídos',
  icon: '🗄️',
  searchText: 'dados distribuidos database per service shared database multi schema vertical tenant cap teorema consistencia eventual uuid v7 tsid postgres prisma rls row level security cdc debezium kafka connect reporting database metabase replicacao',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Arquitetura-alvo</div>
    <h1 class="section-title">🗄️ Estratégia de dados distribuídos</h1>
    <p class="section-subtitle">O curso prega "Database per Service" e alerta contra "Shared Database". O Citybox adota um <strong>híbrido pragmático</strong> calibrado para uma cidade única: tenant DB compartilhado com isolamento por schema, e DB próprio onde o domínio exige (pagamentos).</p>
    <div class="section-tags">
      <span class="tag-emerald">Híbrido</span>
      <span class="tag-teal">multi-schema</span>
      <span class="tag-blue">UUIDv7</span>
      <span class="tag-slate">CAP</span>
    </div>
  </div>

  <h2>Topologia de dados atual</h2>
  <div class="mermaid">
flowchart TB
  subgraph platform ["Postgres platform"]
    P1["PlatformEnabledVertical · Org · Store · User"]
  end
  subgraph tenant ["Postgres tenant (ilheus)"]
    T0["schema public"]
    T1["schema food"]
    T2["schema market"]
    T3["schema beauty"]
    T4["schema clinic"]
    T5["schema services"]
  end
  subgraph pay ["Postgres payment (DB próprio)"]
    PG1["charges · webhooks · split"]
  end

  CoreAPI["marketplace-api"] --> tenant
  Workers["workers"] --> tenant
  Workers --> platform
  PlatformAPI["platform-api"] --> platform
  PaymentAPI["payment-api"] --> pay
  Replica[("Postgres replica<br/>BI / Metabase")] -. read .- tenant
  </div>

  <h2>Decisão: por que híbrido (e não DB-per-service puro)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Abordagem</th><th>Prós</th><th>Contras p/ Citybox</th><th>Decisão</th></tr></thead>
      <tbody>
        <tr>
          <td class="td-bold">DB-per-service puro</td>
          <td>Isolamento total, deploy independente</td>
          <td>Cidade única → custo operacional alto; joins viram chamadas distribuídas; mais saga</td>
          <td><span class="status-badge status-proposed">⚪ Só onde necessário</span></td>
        </tr>
        <tr>
          <td class="td-bold">Shared DB sem fronteira</td>
          <td>Simples</td>
          <td>Anti-pattern: acoplamento, sem dono claro do dado</td>
          <td><span class="status-badge status-absent">⛔ Evitar</span></td>
        </tr>
        <tr>
          <td class="td-bold">Tenant DB + schema-per-vertical</td>
          <td>Isolamento lógico, lazy por vertical (ADR C-15), 1 instância</td>
          <td>Exige disciplina de fronteira (cada serviço só seu schema)</td>
          <td><span class="status-badge status-functional">✅ Padrão</span></td>
        </tr>
        <tr>
          <td class="td-bold">DB próprio p/ payment</td>
          <td>Isola dado sensível de PSP; blast radius menor</td>
          <td>Consistência via eventos</td>
          <td><span class="status-badge status-functional">✅ Já feito</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">💡 Regra de fronteira</div>
    <p>Cada serviço é <strong>dono</strong> do(s) seu(s) schema(s) e só escreve neles. Leitura cruzada acontece por <strong>read models projetados</strong> (CQRS) — nunca por <code>JOIN</code> direto no schema de outro serviço. Considerar <strong>Row Level Security (RLS)</strong> no Postgres para reforçar o isolamento por tenant/vertical.</p>
  </div>

  <h2>CAP e consistência</h2>
  <div class="card-grid">
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">⚖️</span> Escolha AP onde cabe</div>
      <p>Read models (catálogo, vitrine) toleram <strong>consistência eventual</strong> — atualizam via eventos. Disponibilidade &gt; consistência forte na leitura do consumidor.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🔒</span> CP onde é dinheiro/estoque</div>
      <p>Reserva de estoque e cobrança exigem consistência forte local (transação no dono) + saga p/ coordenar entre serviços. Ver <a href="#saga-checkout">Saga</a>.</p>
    </div>
  </div>

  <h2>IDs distribuídos</h2>
  <div class="alert alert-emerald">
    <span class="alert-icon">🆔</span>
    <div class="alert-body">
      <div class="alert-title">UUIDv7 já é o nosso "TSID"</div>
      <p>O curso apresenta UUID e TSID (timestamp + sequência). O Citybox usa <code>citybox_uuid_v7()</code> como default de todos os IDs — UUIDv7 embute timestamp, dando <strong>ordenação temporal</strong> e bom comportamento de índice no Postgres, sem coordenador central. Cobre o caso de uso do TSID.</p>
    </div>
  </div>

  <h2>Replicação e relatórios</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Necessidade</th><th>Curso</th><th>Citybox (alvo)</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Reporting Database</td><td>Reporting DB (Fowler) + Metabase</td><td>Postgres replica + Metabase <span class="status-badge status-functional">✅</span></td></tr>
        <tr><td class="td-bold">Replicação em tempo real</td><td>Kafka Connect + Debezium (CDC)</td><td>Eventos RabbitMQ → projeções; CDC só se a escala exigir <span class="status-badge status-proposed">⚪</span></td></tr>
        <tr><td class="td-bold">API Composition (relatórios cross-serviço)</td><td>API Composition Pattern</td><td>BFF agrega read models <span class="status-badge status-functional">✅</span></td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-slate">
    <span class="alert-icon">🧭</span>
    <div class="alert-body">
      <div class="alert-title">Quando (re)considerar Kafka + Debezium</div>
      <p>Adotar CDC só quando: (a) volume de eventos saturar o padrão poll-outbox, (b) precisarmos de event streaming/replay histórico, ou (c) integrações externas exigirem log de mudanças. Para Ilhéus hoje, RabbitMQ + outbox atômico atende com muito menos complexidade operacional.</p>
    </div>
  </div>
</div>
`
});
