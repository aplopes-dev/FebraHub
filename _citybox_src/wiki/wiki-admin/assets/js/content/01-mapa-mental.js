WIKI.register({
  id: 'mapa-mental',
  title: 'Mapa Mental',
  icon: '🗺️',
  searchText: 'mapa mental modelo domínio cliente loja equipe plano assinatura fatura integração health score notificação ticket churn settlement hierarquia relações entidades citybox',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Introdução</div>
  <h1 class="section-title">🗺️ Mapa Mental</h1>
  <p class="section-subtitle">Modelo de domínio completo do Admin Citybox — do cliente contratante às entidades de billing, saúde e integrações. Distingue o domínio atual (MVP) do domínio-alvo.</p>
  <div class="section-tags">
    <span class="tag-teal">Modelo de domínio</span>
    <span class="tag-gray">Visão relacional</span>
  </div>
</div>

<h2>Hierarquia principal (MVP atual)</h2>
<div class="mermaid">
flowchart TD
  CB[Citybox Plataforma]
  CB --> C1[Cliente A — CNPJ]
  CB --> C2[Cliente B — CPF]
  C1 --> S1[Loja Food]
  C1 --> S2[Loja Varejo]
  C2 --> S3[Loja Saúde]
  S1 --> M1[Equipe da Loja Food]
  S2 --> M2[Equipe da Loja Varejo]
  S3 --> M3[Equipe da Loja Saúde]
  M1 --> U1[Gerente]
  M1 --> U2[Atendente]
  M1 --> U3[Caixa]
</div>

<h2>Domínio-alvo (completo)</h2>
<div class="mermaid">
flowchart TB
  CB[Citybox Plataforma]

  subgraph billing [Billing]
    PL[Plano SaaS]
    AS[Assinatura]
    FA[Fatura]
    RE[Repasse]
  end

  subgraph health [Saúde e Risco]
    HS[Health Score]
    AL[Alerta Churn]
    DU[Dunning]
  end

  subgraph plat [Plataforma]
    OP[Operador Citybox]
    NT[Notificação]
    FF[Feature Flag]
    AU[Auditoria Global]
  end

  CB --> C[Cliente]
  C --> AS
  AS --> PL
  AS --> FA
  FA --> RE

  C --> HS
  HS --> AL
  AL --> DU

  C --> S[Loja]
  S --> MM[Membro da Loja]
  S --> MD[Módulo]
  S --> IN[Integração]
  S --> AUS[Audit Log por Loja]

  CB --> OP
  OP --> NT
  CB --> FF
  OP --> AU
</div>
<p class="mermaid-caption">Entidades em cinza ainda não implementadas — planejadas para v1/v2.</p>

<h2>Entidades do domínio — completo</h2>
<div class="card-grid">
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">🤝</span> Cliente <span class="status-badge status-functional">✅</span></div>
    <ul>
      <li>Conta comercial PF (CPF) ou PJ (CNPJ)</li>
      <li>Responsável master, e-mail, WhatsApp</li>
      <li>Plano SaaS + ciclo + dia de vencimento</li>
      <li>Status: ativo, inadimplente, suspenso, bloqueado, cancelado</li>
      <li><strong>Alvo:</strong> + health score, jornada de onboarding</li>
    </ul>
  </div>
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">🏪</span> Loja <span class="status-badge status-functional">✅</span></div>
    <ul>
      <li>Vertical, slug único, fuso horário, dados fiscais</li>
      <li>Status: em_implantacao → ativa → bloqueada</li>
      <li>Módulos ativáveis, terminais, integrações, audit log</li>
      <li><strong>Alvo:</strong> + reputação/saúde, uptime, SLA, webhooks de integração</li>
    </ul>
  </div>
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">💳</span> Plano <span class="status-badge status-functional">✅</span></div>
    <ul>
      <li>Starter, Pro, Enterprise</li>
      <li>Quotas: nº lojas, usuários, SKUs</li>
      <li>Preço + ciclo (mensal/anual) + Stripe Price ID</li>
      <li><strong>Alvo:</strong> tabela real no banco, CRUD no admin</li>
    </ul>
  </div>
  <div class="card card-blue">
    <div class="card-title"><span class="card-icon">📄</span> Assinatura <span class="status-badge status-mock">🔴 Mock</span></div>
    <ul>
      <li>Vínculo Cliente ↔ Plano com datas de vigência</li>
      <li>MRR por cliente, status (ativa/cancelada/em atraso)</li>
      <li>Renovação automática</li>
      <li><strong>Alvo:</strong> integração Stripe Subscriptions</li>
    </ul>
  </div>
  <div class="card card-blue">
    <div class="card-title"><span class="card-icon">🧾</span> Fatura <span class="status-badge status-mock">🔴 Mock</span></div>
    <ul>
      <li>Valor, vencimento, método de pagamento, status</li>
      <li>NF-e/NFS-e vinculada</li>
      <li>Histórico de tentativas (dunning)</li>
      <li><strong>Alvo:</strong> gerada pelo gateway, exibida no detalhe do cliente</li>
    </ul>
  </div>
  <div class="card card-amber">
    <div class="card-title"><span class="card-icon">❤️</span> Health Score <span class="status-badge status-broken">🔴 Ausente</span></div>
    <ul>
      <li>Score 0–100 por cliente (calculado por regras)</li>
      <li>Sinais: engajamento, billing, suporte, nº lojas ativas</li>
      <li>Semáforo verde/amarelo/vermelho</li>
      <li><strong>Alvo:</strong> calculado periodicamente por job</li>
    </ul>
  </div>
  <div class="card card-amber">
    <div class="card-title"><span class="card-icon">🔔</span> Notificação <span class="status-badge status-broken">🔴 Ausente</span></div>
    <ul>
      <li>Para o operador Citybox (inbox no admin)</li>
      <li>Broadcasts para lojistas</li>
      <li>Tipos: alerta, informativo, cobrança, manutenção</li>
    </ul>
  </div>
  <div class="card card-amber">
    <div class="card-title"><span class="card-icon">🔧</span> Feature Flag <span class="status-badge status-broken">🔴 Ausente</span></div>
    <ul>
      <li>Flag por tenant (cliente ou loja)</li>
      <li>Gradual rollout de novas features</li>
      <li>Gerenciado pelo operador Citybox no admin</li>
    </ul>
  </div>
</div>
`
});
