WIKI.register({
  id: 'dashboard',
  title: 'Dashboard Operacional',
  icon: '📈',
  searchText: 'dashboard home KPIs faturamento pedidos agendamentos alertas metricas operacional resumo dia',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Visão Geral</div>
    <h1 class="section-title">📈 Dashboard Operacional</h1>
    <p class="section-subtitle">Home do ERP — visão consolidada do dia: KPIs por vertical, alertas operacionais, resumo financeiro e acesso rápido às ações mais frequentes.</p>
    <div class="section-tags">
      <span class="tag-orange">Dashboard</span>
      <span class="tag-amber">KPIs · Alertas</span>
      <span class="tag-gray">Comum a todas as verticais</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Sem dashboard implementado — ERP abre direto na primeira tela da vertical ativa</li>
      <li>Não há visão consolidada de KPIs do dia</li>
      <li>Alertas operacionais inexistentes na UI</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Home personalizada pela vertical ativa: KPIs e atalhos diferentes para Food vs. Beauty vs. Clinic</li>
      <li>KPIs do dia com comparativo ao dia anterior e à média da semana</li>
      <li>Feed de alertas operacionais em tempo real (estoque baixo, pedido parado, device offline)</li>
      <li>Atalhos rápidos: as 3 ações mais frequentes do operador</li>
      <li>Widget de performance da loja: faturamento x meta do mês</li>
      <li>Owner: visão multi-loja (todas as unidades da organização)</li>
    </ul>
  </div>

  <h2>KPIs por eixo de negócio</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>KPI</th><th>Eixo Produto (Food/Market)</th><th>Eixo Serviço (Beauty/Clinic/Services)</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Volume do dia</td><td>Nº de pedidos recebidos</td><td>Nº de agendamentos do dia</td></tr>
        <tr><td class="td-bold">Receita</td><td>GMV do dia (pedidos DELIVERED)</td><td>Faturamento do dia (atendimentos fechados)</td></tr>
        <tr><td class="td-bold">Ticket médio</td><td>GMV / nº de pedidos</td><td>Receita / nº de atendimentos</td></tr>
        <tr><td class="td-bold">Taxa de conversão</td><td>Pedidos confirmados / criados</td><td>Comparecimentos / agendamentos</td></tr>
        <tr><td class="td-bold">Tempo de ciclo</td><td>Tempo médio de preparo/entrega</td><td>Tempo médio de atendimento</td></tr>
        <tr><td class="td-bold">No-show / recusa</td><td>Taxa de recusa pela loja</td><td>Taxa de no-show do cliente</td></tr>
        <tr><td class="td-bold">Ocupação</td><td>Mesas/slots ativos vs. capacidade</td><td>Profissionais em atendimento vs. disponíveis</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Mockup do dashboard (multi-vertical)</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo" style="color:#fbbf24">📈 Dashboard — Hoje, 21 Jun</span>
      <span style="margin-left:auto;font-size:12px;color:rgba(255,255,255,.6)">🏬 Loja Central ▾</span>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;">
        <div class="mock-kpi">
          <div class="mock-kpi-value" style="color:#d97706">R$3.840</div>
          <div class="mock-kpi-sub">Receita do dia</div>
          <div style="font-size:10px;color:#16a34a;margin-top:2px">▲ 12% vs ontem</div>
        </div>
        <div class="mock-kpi">
          <div class="mock-kpi-value" style="color:#d97706">47</div>
          <div class="mock-kpi-sub">Pedidos / Atendimentos</div>
          <div style="font-size:10px;color:#16a34a;margin-top:2px">▲ 5 vs ontem</div>
        </div>
        <div class="mock-kpi">
          <div class="mock-kpi-value" style="color:#d97706">R$81,70</div>
          <div class="mock-kpi-sub">Ticket médio</div>
          <div style="font-size:10px;color:#ef4444;margin-top:2px">▼ 3% vs ontem</div>
        </div>
        <div class="mock-kpi">
          <div class="mock-kpi-value" style="color:#d97706">94%</div>
          <div class="mock-kpi-sub">Taxa de conclusão</div>
          <div style="font-size:10px;color:#16a34a;margin-top:2px">▲ 2% vs ontem</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="background:white;border:1px solid #e7e5e4;border-radius:8px;padding:12px;">
          <div style="font-weight:700;font-size:13px;margin-bottom:8px">🚨 Alertas operacionais</div>
          <div style="font-size:12px;padding:6px 0;border-bottom:1px solid #f3f4f6;color:#ef4444">⚠ Estoque baixo: Queijo Prato (2 un)</div>
          <div style="font-size:12px;padding:6px 0;border-bottom:1px solid #f3f4f6;color:#d97706">⏱ Pedido #1042 há 25min sem resposta</div>
          <div style="font-size:12px;padding:6px 0;color:#a8a29e">✅ Todos os devices online</div>
        </div>
        <div style="background:white;border:1px solid #e7e5e4;border-radius:8px;padding:12px;">
          <div style="font-weight:700;font-size:13px;margin-bottom:8px">⚡ Ações rápidas</div>
          <button class="mock-btn mock-btn-primary" style="width:100%;justify-content:flex-start;margin-bottom:6px;font-size:12px">🛒 Ver pedidos em aberto (3)</button>
          <button class="mock-btn mock-btn-outline" style="width:100%;justify-content:flex-start;margin-bottom:6px;font-size:12px">📦 Ajustar estoque</button>
          <button class="mock-btn mock-btn-outline" style="width:100%;justify-content:flex-start;font-size:12px">💳 Abrir caixa PDV</button>
        </div>
      </div>
    </div>
  </div>

  <h2>Dashboard por vertical — diferenças</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">🍔</span> Food / Market</div>
      <p>KPIs: pedidos do dia, GMV, tempo de preparo, taxa de recusa. Atalhos: ver fila de pedidos, abrir PDV, KDS.</p>
    </div>
    <div class="card card-purple">
      <div class="card-title"><span class="card-icon">💇</span> Beauty / Clinic / Services</div>
      <p>KPIs: atendimentos do dia, receita, no-show, taxa de ocupação de profissionais. Atalhos: agenda do dia, novo agendamento, prontuário.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🏨</span> Hospitality / Rental</div>
      <p>KPIs: check-ins/reservas do dia, ocupação, diária média, check-outs pendentes. Atalhos: mapa de quartos/recursos, nova reserva.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">📚</span> Education / Events</div>
      <p>KPIs: matrículas ativas, alunos presentes, receita de mensalidades, vagas disponíveis. Atalhos: lista de presença, nova matrícula.</p>
    </div>
  </div>

  <h2>Meta mensal e progresso</h2>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta P2</div>
    <p>O owner define meta de faturamento mensal. O dashboard mostra barra de progresso (atual vs. meta) e projeção se o ritmo se mantiver. Alerta quando o ritmo indica que a meta não será atingida.</p>
  </div>

  <h2>Componente de alertas em tempo real</h2>
  <pre>// Feed de alertas via WebSocket
interface DashboardAlert {
  id: string;
  type: 'stock_low' | 'order_stuck' | 'device_offline' | 'payment_failed' | 'appointment_noshow';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  actionUrl?: string;  // link para resolver o alerta
  createdAt: Date;
}

// O dashboard mantém os últimos 10 alertas não resolvidos
// Clique no alerta navega para a tela de resolução</pre>
</div>
`
});
