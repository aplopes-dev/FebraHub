WIKI.register({
  id: 'fidelidade',
  title: 'Fidelidade e Recompensas',
  icon: '⭐',
  searchText: 'fidelidade pontos cashback clube programa recompensas clientes fidelizacao tier nivel beneficio cupom desconto engajamento',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Clientes e Engajamento</div>
    <h1 class="section-title">⭐ Fidelidade e Recompensas</h1>
    <p class="section-subtitle">Programa de fidelidade canônico da plataforma: pontos por compra, cashback, níveis de cliente e benefícios exclusivos. Cada vertical estende com regras e benefícios específicos. Integrado ao <a href="#clientes-crm">CRM de Clientes</a>.</p>
    <div class="section-tags">
      <span class="tag-orange">Fidelidade</span>
      <span class="tag-amber">Pontos · Cashback</span>
      <span class="tag-green">Clube · Tier</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <p>Programa de pontos básico disponível via marketplace. O ERP não tem gestão ativa do programa — lojistas não conseguem criar campanhas personalizadas ou ver métricas de fidelidade no backoffice.</p>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Configuração do programa: % de cashback, pontos por real gasto, validade de pontos</li>
      <li>Níveis de cliente (tier): Bronze → Prata → Ouro → VIP — com benefícios escalonados</li>
      <li>Clube de assinantes: plano mensal com benefícios exclusivos (frete grátis, desconto fixo)</li>
      <li>Campanhas: pontos em dobro, cashback especial em datas comemorativas</li>
      <li>Resgate: desconto em pedido, brinde, upgrade de tier</li>
      <li>Dashboard de fidelidade: membros ativos, pontos emitidos vs resgatados, taxa de retenção</li>
      <li>Integração com marketplace: pontos aplicáveis em todas as verticais da plataforma</li>
    </ul>
  </div>

  <h2>Mockup — Programa de Fidelidade</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">⭐ Fidelidade — Padaria São Jorge</span>
      <span style="margin-left:auto;font-size:11px;opacity:.8">1.840 membros ativos</span>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px">
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#d97706">1.840</div><div class="mock-kpi-sub">Membros ativos</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#6366f1">482k</div><div class="mock-kpi-sub">Pontos emitidos</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#16a34a">128k</div><div class="mock-kpi-sub">Pontos resgatados</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#ec4899">73%</div><div class="mock-kpi-sub">Taxa retenção 90d</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div>
          <div class="mock-label">Distribuição por tier</div>
          <table class="mock-table">
            <thead><tr><th>Tier</th><th>Membros</th><th>Gasto médio</th></tr></thead>
            <tbody>
              <tr><td>🥉 Bronze</td><td>1.200</td><td>R$ 45</td></tr>
              <tr><td>🥈 Prata</td><td>480</td><td>R$ 120</td></tr>
              <tr><td>🥇 Ouro</td><td>140</td><td>R$ 280</td></tr>
              <tr><td>💎 VIP</td><td>20</td><td>R$ 640</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <div class="mock-label">Configuração atual</div>
          <table class="mock-table">
            <thead><tr><th>Parâmetro</th><th>Valor</th></tr></thead>
            <tbody>
              <tr><td>Pontos / R$</td><td>1 ponto</td></tr>
              <tr><td>Cashback Ouro</td><td>5%</td></tr>
              <tr><td>Validade pontos</td><td>180 dias</td></tr>
              <tr><td>Mínimo resgate</td><td>100 pontos</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <h2>Modelo de tiers</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tier</th><th>Critério de entrada</th><th>Benefícios</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">🥉 Bronze</td><td>Cadastro no programa</td><td>1 ponto/R$, acesso a promoções básicas</td></tr>
        <tr><td class="td-bold">🥈 Prata</td><td>R$ 500 acumulados em 90 dias</td><td>1,5 pontos/R$, frete reduzido</td></tr>
        <tr><td class="td-bold">🥇 Ouro</td><td>R$ 1.500 acumulados em 90 dias</td><td>2 pontos/R$, 5% cashback, frete grátis</td></tr>
        <tr><td class="td-bold">💎 VIP</td><td>R$ 5.000 acumulados em 90 dias ou clube pago</td><td>3 pontos/R$, 10% cashback, atendimento prioritário</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Extensões por vertical</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Vertical</th><th>Delta específico</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">🍔 Food</td><td>Clube do café: assinatura mensal com crédito fixo; pontos dobrados no delivery noturno; fidelização por frequência semanal</td></tr>
        <tr><td class="td-bold">🛒 Market</td><td>Cashback em produtos selecionados (parceria fornecedor); fidelidade por família de produto; clube de hortifruti</td></tr>
        <tr><td class="td-bold">🏥 Clinic</td><td>Pacote de consultas; pontos por check-up em dia</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-info">
    <span class="alert-icon">💡</span>
    <div class="alert-body">
      <div class="alert-title">Relacionamento com CRM</div>
      <p>O programa de fidelidade é uma extensão do <a href="#clientes-crm">CRM de Clientes</a>. O perfil do cliente no CRM inclui saldo de pontos, tier atual e histórico de resgates. As seções de fidelidade nas wikis verticais documentam apenas os <strong>deltas específicos</strong> desta base.</p>
    </div>
  </div>
</div>
`
});
