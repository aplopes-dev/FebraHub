WIKI.register({
  id: 'benchmark-mercado',
  title: 'Benchmark de Mercado',
  icon: '📐',
  searchText: 'benchmark mercado livre seller center SaaS admin comparativo lacunas health score churn MRR impersonation notificações exportação relatórios RBAC feature flags billing onboarding',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Introdução</div>
  <h1 class="section-title">📐 Benchmark de Mercado</h1>
  <p class="section-subtitle">Comparativo do Admin Citybox com referências de mercado — Mercado Livre Seller Center e plataformas SaaS multi-tenant líderes. Identifica as lacunas prioritárias e justifica cada feature proposta.</p>
  <div class="section-tags">
    <span class="tag-teal">Análise competitiva</span>
    <span class="tag-blue">Inspiração de produto</span>
    <span class="tag-gray">Fonte das features propostas</span>
  </div>
</div>

<h2>Referências analisadas</h2>
<div class="card-grid">
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">🛒</span> Mercado Livre Seller Center</div>
    <p>Painel para sellers com métricas de reputação (semáforo verde/amarelo/vermelho), analytics de performance (conversão, tráfego, ticket médio), central de mensagens, gestão de pagamentos e exportação para ERP.</p>
    <p><strong>Lição para Citybox:</strong> saúde da loja visível, alertas proativos, exportação de dados operacionais.</p>
  </div>
  <div class="card card-blue">
    <div class="card-title"><span class="card-icon">📊</span> Admins SaaS multi-tenant</div>
    <p>Plataformas como Vitally, ChurnZero, Gainsight definem health score 0–100 com 5–8 sinais (engajamento, billing, suporte), alertas de churn 30–90 dias antes, impersonation auditada e cohort retention.</p>
    <p><strong>Lição para Citybox:</strong> cliente com score baixo precisa de intervenção proativa, não reativa.</p>
  </div>
  <div class="card card-blue">
    <div class="card-title"><span class="card-icon">🔑</span> Auth0 / Okta Admin</div>
    <p>RBAC granular com matriz papel × permissão × recurso. Impersonation auditada, logs de acesso exportáveis, suporte a múltiplos realm por ambiente.</p>
    <p><strong>Lição para Citybox:</strong> fix do platform_operator + novas roles finance/support.</p>
  </div>
  <div class="card card-amber">
    <div class="card-title"><span class="card-icon">💳</span> Stripe Dashboard</div>
    <p>Assinaturas, MRR/ARR, churn, cohorts, NRR, dunning automático (régua de cobrança), webhooks, NF integrada, exportação contábil.</p>
    <p><strong>Lição para Citybox:</strong> billing não pode ser mock — é o coração do produto SaaS.</p>
  </div>
  <div class="card card-amber">
    <div class="card-title"><span class="card-icon">📣</span> Intercom / Zendesk Admin</div>
    <p>Central de mensagens para operadores responderem lojistas, broadcasts segmentados, base de conhecimento, fila de suporte com SLA.</p>
    <p><strong>Lição para Citybox:</strong> operador precisa de canal de comunicação com o lojista dentro do admin.</p>
  </div>
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">🏗️</span> AWS / GCP Console</div>
    <p>Monitoramento de saúde de recursos em tempo real, feature flags por tenant, configurações globais de plataforma, exportação de logs e relatórios de billing.</p>
    <p><strong>Lição para Citybox:</strong> operador precisa ver saúde das lojas sem entrar em cada uma.</p>
  </div>
</div>

<h2>Matriz de lacunas — Citybox vs. mercado</h2>
<div class="table-wrap">
  <table class="rice-table">
    <thead>
      <tr>
        <th>Feature</th>
        <th>ML Seller</th>
        <th>SaaS Admin</th>
        <th>Citybox hoje</th>
        <th>Proposto</th>
        <th>Prio</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="td-bold">Health score do cliente</td>
        <td>✅</td><td>✅</td>
        <td><span class="status-badge status-broken">Ausente</span></td>
        <td><span class="status-badge status-proposed">🔵 saude-churn</span></td>
        <td><span class="tag-p1">P1</span></td>
      </tr>
      <tr>
        <td class="td-bold">Dashboard com métricas reais</td>
        <td>✅</td><td>✅</td>
        <td><span class="status-badge status-mock">Mock</span></td>
        <td><span class="status-badge status-proposed">🔵 dashboard</span></td>
        <td><span class="tag-p1">P1</span></td>
      </tr>
      <tr>
        <td class="td-bold">MRR / ARR / NRR</td>
        <td>–</td><td>✅</td>
        <td><span class="status-badge status-mock">Mock (R$0)</span></td>
        <td><span class="status-badge status-proposed">🔵 financeiro</span></td>
        <td><span class="tag-p1">P1</span></td>
      </tr>
      <tr>
        <td class="td-bold">Churn prediction</td>
        <td>–</td><td>✅</td>
        <td><span class="status-badge status-broken">Ausente</span></td>
        <td><span class="status-badge status-proposed">🔵 saude-churn</span></td>
        <td><span class="tag-p2">P2</span></td>
      </tr>
      <tr>
        <td class="td-bold">Impersonation auditada</td>
        <td>–</td><td>✅</td>
        <td><span class="status-badge status-mock">console.log</span></td>
        <td><span class="status-badge status-proposed">🔵 impersonation</span></td>
        <td><span class="tag-p2">P2</span></td>
      </tr>
      <tr>
        <td class="td-bold">Reputação / saúde da loja</td>
        <td>✅</td><td>✅</td>
        <td><span class="status-badge status-broken">Ausente</span></td>
        <td><span class="status-badge status-proposed">🔵 monitoramento</span></td>
        <td><span class="tag-p1">P1</span></td>
      </tr>
      <tr>
        <td class="td-bold">Billing real (gateway + NF)</td>
        <td>✅</td><td>✅</td>
        <td><span class="status-badge status-mock">Mock</span></td>
        <td><span class="status-badge status-proposed">🔵 faturamento</span></td>
        <td><span class="tag-p1">P1</span></td>
      </tr>
      <tr>
        <td class="td-bold">Onboarding guiado (checklist)</td>
        <td>✅</td><td>✅</td>
        <td><span class="status-badge status-broken">Ausente</span></td>
        <td><span class="status-badge status-proposed">🔵 onboarding</span></td>
        <td><span class="tag-p2">P2</span></td>
      </tr>
      <tr>
        <td class="td-bold">RBAC granular</td>
        <td>–</td><td>✅</td>
        <td><span class="status-badge status-broken">UI pronta, não conectada</span></td>
        <td><span class="status-badge status-proposed">🔵 rbac</span></td>
        <td><span class="tag-p1">P1</span></td>
      </tr>
      <tr>
        <td class="td-bold">Notificações / broadcasts</td>
        <td>✅</td><td>✅</td>
        <td><span class="status-badge status-broken">Ausente</span></td>
        <td><span class="status-badge status-proposed">🔵 notificacoes</span></td>
        <td><span class="tag-p2">P2</span></td>
      </tr>
      <tr>
        <td class="td-bold">Exportação CSV/PDF</td>
        <td>✅</td><td>✅</td>
        <td><span class="status-badge status-mock">Botão sem handler</span></td>
        <td><span class="status-badge status-proposed">🔵 relatorios</span></td>
        <td><span class="tag-p2">P2</span></td>
      </tr>
      <tr>
        <td class="td-bold">Feature flags por tenant</td>
        <td>–</td><td>✅</td>
        <td><span class="status-badge status-broken">Ausente</span></td>
        <td><span class="status-badge status-proposed">🔵 configuracoes</span></td>
        <td><span class="tag-p2">P2</span></td>
      </tr>
      <tr>
        <td class="td-bold">Integrações (iFood, Stone)</td>
        <td>✅</td><td>✅</td>
        <td><span class="status-badge status-partial">Status read-only</span></td>
        <td><span class="status-badge status-proposed">🔵 integracoes</span></td>
        <td><span class="tag-p2">P2</span></td>
      </tr>
      <tr>
        <td class="td-bold">Relatórios agendados</td>
        <td>✅</td><td>✅</td>
        <td><span class="status-badge status-broken">Ausente</span></td>
        <td><span class="status-badge status-proposed">🔵 relatorios</span></td>
        <td><span class="tag-p3">P3</span></td>
      </tr>
      <tr>
        <td class="td-bold">Cohort retention heatmap</td>
        <td>–</td><td>✅</td>
        <td><span class="status-badge status-broken">Ausente</span></td>
        <td><span class="status-badge status-proposed">🔵 dashboard</span></td>
        <td><span class="tag-p3">P3</span></td>
      </tr>
    </tbody>
  </table>
</div>

<h2>O que NÃO adotar (e por quê)</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Feature de mercado</th><th>Por que não agora</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">Anúncios / Ads (ML)</td><td>Não faz parte do modelo de negócio Citybox B2B2C</td></tr>
      <tr><td class="td-bold">Logística/rastreio de entrega</td><td>Responsabilidade do vertical Food/Varejo, não do Admin da plataforma</td></tr>
      <tr><td class="td-bold">ML com predição de churn complexa</td><td>Requer volume de dados; implementar health score rule-based primeiro</td></tr>
      <tr><td class="td-bold">White-label do Admin para cliente</td><td>Escopo Enterprise; fora do MVP e v1</td></tr>
    </tbody>
  </table>
</div>
`
});
