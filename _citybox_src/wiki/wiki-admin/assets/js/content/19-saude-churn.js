WIKI.register({
  id: 'saude-churn',
  title: 'Saúde e Churn',
  icon: '❤️',
  searchText: 'saúde health score churn risco dunning régua cobrança ciclo de vida cliente at-risk alertas semáforo sinais engajamento billing score 0 100',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Clientes</div>
  <h1 class="section-title">❤️ Saúde e Churn</h1>
  <p class="section-subtitle">Health score 0–100 por cliente, alertas de risco de churn e régua de cobrança (dunning) automática para inadimplentes.</p>
  <div class="section-tags">
    <span class="tag-teal">Retenção proativa</span>
    <span class="status-badge status-proposed">🔵 Feature nova</span>
    <span class="tag-p1">P1</span>
  </div>
</div>

<h2>Health Score — modelo de cálculo</h2>
<p>Score calculado por job periódico (a cada 6h), armazenado em <code>client_health_scores</code>. Composto por 6 sinais ponderados:</p>
<div class="table-wrap">
  <table>
    <thead><tr><th>Sinal</th><th>Peso</th><th>Métricas usadas</th><th>Pontos máx.</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">Engajamento operacional</td><td>30%</td><td>Pedidos/dia nos últimos 30d, lojas com atividade &gt; 80%</td><td>30</td></tr>
      <tr><td class="td-bold">Saúde de billing</td><td>25%</td><td>Sem faturas vencidas, assinatura ativa e em dia</td><td>25</td></tr>
      <tr><td class="td-bold">Adoção de módulos</td><td>20%</td><td>% de módulos contratados sendo usados ativamente</td><td>20</td></tr>
      <tr><td class="td-bold">Lojas ativas</td><td>15%</td><td>% de lojas cadastradas com status "ativa"</td><td>15</td></tr>
      <tr><td class="td-bold">Suporte</td><td>5%</td><td>Sem tickets críticos abertos &gt; 48h</td><td>5</td></tr>
      <tr><td class="td-bold">Onboarding concluído</td><td>5%</td><td>Checklist de go-live 100% completo</td><td>5</td></tr>
    </tbody>
  </table>
</div>

<h2>Faixas do semáforo</h2>
<div class="card-grid">
  <div class="card card-teal">
    <div class="card-title">🟢 Verde — Saudável (70–100)</div>
    <div class="health-meter">
      <div class="health-bar-track"><div class="health-bar-fill health-green" style="width:85%"></div></div>
      <div class="health-score-value" style="color:#16a34a">85</div>
    </div>
    <p>Cliente engajado, billing em dia, lojas operacionais. Nenhuma ação necessária. Oportunidade de expansão (upsell).</p>
  </div>
  <div class="card card-amber">
    <div class="card-title">🟡 Amarelo — Atenção (40–69)</div>
    <div class="health-meter">
      <div class="health-bar-track"><div class="health-bar-fill health-yellow" style="width:55%"></div></div>
      <div class="health-score-value" style="color:#d97706">55</div>
    </div>
    <p>Sinais mistos — algum problema de engajamento ou billing. Requer atenção proativa: contato do operador, verificar onboarding.</p>
  </div>
  <div class="card">
    <div class="card-title" style="color:#dc2626">🔴 Vermelho — Risco (0–39)</div>
    <div class="health-meter">
      <div class="health-bar-track"><div class="health-bar-fill health-red" style="width:22%"></div></div>
      <div class="health-score-value" style="color:#dc2626">22</div>
    </div>
    <p>Alto risco de churn. Alerta automático para o operador responsável. Início da régua de retenção.</p>
  </div>
</div>

<h2>Régua de dunning (inadimplência)</h2>
<div class="mermaid">
flowchart TD
  A[Fatura vence] -->|D+0| B[E-mail automático: aviso de vencimento]
  B -->|D+3| C{Pagou?}
  C -->|Sim| Z[Normalizado]
  C -->|Não| D[E-mail de 2ª cobrança + WhatsApp]
  D -->|D+7| E{Pagou?}
  E -->|Sim| Z
  E -->|Não| F[Alerta no Admin — operador contata cliente]
  F -->|D+15| G{Pagou?}
  G -->|Sim| Z
  G -->|Não| H[Suspensão automática de acesso]
  H -->|D+30| I[Status: cancelado + arquivo do cliente]
</div>

<h2>Ciclo de vida do cliente</h2>
<div class="mermaid">
flowchart LR
  A[lead] --> B[implantacao]
  B --> C[ativo]
  C --> D[inadimplente]
  D --> C
  D --> E[suspenso]
  E --> C
  E --> F[cancelado]
  C --> F
</div>

<h2>Alertas de churn propostos</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Alerta</th><th>Gatilho</th><th>Ação sugerida</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">Score caiu &gt; 20 pontos em 7d</td><td>Job de monitoramento</td><td>Notificação para operador responsável</td></tr>
      <tr><td class="td-bold">Score &lt; 40 por 14 dias consecutivos</td><td>Job de monitoramento</td><td>Criar tarefa de retenção proativa</td></tr>
      <tr><td class="td-bold">Fatura vencida &gt; 7 dias</td><td>Dunning job</td><td>Alerta no dashboard + régua de cobrança</td></tr>
      <tr><td class="td-bold">Nenhum pedido em 21 dias</td><td>Engajamento monitor</td><td>E-mail de reengajamento automático</td></tr>
      <tr><td class="td-bold">Todas as lojas inativas</td><td>Job monitoramento</td><td>Alerta crítico — verificação imediata</td></tr>
    </tbody>
  </table>
</div>
`
});
