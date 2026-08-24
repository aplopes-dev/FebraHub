WIKI.register({
  id: 'relatorios-analytics',
  title: 'Relatórios e Analytics',
  icon: '📊',
  searchText: 'relatorios analytics vendas estoque equipe financeiro exportacao csv xlsx metricas desempenho dashboard dados',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Analytics</div>
    <h1 class="section-title">📊 Relatórios e Analytics</h1>
    <p class="section-subtitle">Relatórios operacionais e financeiros, exportação de dados (CSV/XLSX) e analytics de desempenho da loja. Cobre os quatro eixos principais: vendas, estoque, equipe e financeiro. Sem previsão por IA — dados confiáveis e acionáveis.</p>
    <div class="section-tags">
      <span class="tag-orange">Analytics</span>
      <span class="tag-amber">Relatórios · Exportação</span>
      <span class="tag-gray">Comum a todas as verticais</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Sem módulo de relatórios no ERP</li>
      <li>Dados disponíveis no banco mas sem camada de apresentação</li>
      <li>Sem exportação de dados para o lojista</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>4 relatórios principais: Vendas, Estoque, Equipe, Financeiro</li>
      <li>Filtros: período (dia, semana, mês, customizado), vertical, canal de venda</li>
      <li>Exportação em CSV e XLSX com 1 click</li>
      <li>Gráficos de tendência: receita por dia/semana, ticket médio, volume de pedidos/agendamentos</li>
      <li>Relatório de performance de equipe: atendimentos por profissional, receita gerada</li>
      <li>Relatório fiscal: NFs emitidas, rejeitadas, valor total por período</li>
      <li>Agendamento de relatórios: envio automático por e-mail (diário, semanal, mensal)</li>
    </ul>
  </div>

  <h2>Relatórios por eixo</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Relatório</th><th>Métricas principais</th><th>Filtros disponíveis</th><th>Exportação</th></tr></thead>
      <tbody>
        <tr>
          <td class="td-bold">📈 Vendas</td>
          <td>GMV, volume, ticket médio, taxa de conversão, canal de origem</td>
          <td>Período, canal, categoria, produto/serviço</td>
          <td>CSV, XLSX</td>
        </tr>
        <tr>
          <td class="td-bold">📦 Estoque</td>
          <td>Posição atual, consumo médio diário, giro, itens abaixo do mínimo</td>
          <td>Categoria, fornecedor, localização</td>
          <td>CSV, XLSX</td>
        </tr>
        <tr>
          <td class="td-bold">👥 Equipe</td>
          <td>Atendimentos/pedidos por operador, receita gerada, taxa de no-show (agenda)</td>
          <td>Profissional, turno, período</td>
          <td>CSV, XLSX</td>
        </tr>
        <tr>
          <td class="td-bold">💰 Financeiro</td>
          <td>Receita bruta/líquida, descontos, taxas de gateway, repassados vs. pendentes</td>
          <td>PSP, forma de pagamento, período</td>
          <td>CSV, XLSX, OFX</td>
        </tr>
        <tr>
          <td class="td-bold">🧾 Fiscal</td>
          <td>NFs emitidas, canceladas, rejeitadas; CFOP; base de cálculo; impostos</td>
          <td>CFOP, período, modelo (55, 65, RPS)</td>
          <td>CSV, XML (SPED)</td>
        </tr>
        <tr>
          <td class="td-bold">📅 Agenda (Serviço)</td>
          <td>Taxa de ocupação, no-show, slot cancelados, tempo médio de atendimento</td>
          <td>Profissional, serviço, período</td>
          <td>CSV, XLSX</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>Dashboard de analytics</h2>
  <div class="mockup-container">
    <div class="mock-topbar"><span class="mock-logo" style="color:#fbbf24">📊 Relatório de Vendas — Jun 2026</span>
      <span style="margin-left:auto;display:flex;gap:6px;">
        <button class="mock-btn mock-btn-outline" style="font-size:11px;padding:3px 10px;">📥 CSV</button>
        <button class="mock-btn mock-btn-outline" style="font-size:11px;padding:3px 10px;">📥 XLSX</button>
      </span>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;">
        <div class="mock-kpi">
          <div class="mock-kpi-value" style="color:#d97706">R$48.230</div>
          <div class="mock-kpi-sub">GMV (Jun)</div>
          <div style="font-size:10px;color:#16a34a;margin-top:2px">▲ 18% vs Mai</div>
        </div>
        <div class="mock-kpi">
          <div class="mock-kpi-value" style="color:#d97706">892</div>
          <div class="mock-kpi-sub">Transações</div>
          <div style="font-size:10px;color:#16a34a;margin-top:2px">▲ 9% vs Mai</div>
        </div>
        <div class="mock-kpi">
          <div class="mock-kpi-value" style="color:#d97706">R$54,07</div>
          <div class="mock-kpi-sub">Ticket médio</div>
          <div style="font-size:10px;color:#16a34a;margin-top:2px">▲ 8% vs Mai</div>
        </div>
        <div class="mock-kpi">
          <div class="mock-kpi-value" style="color:#d97706">87%</div>
          <div class="mock-kpi-sub">Taxa de conclusão</div>
          <div style="font-size:10px;color:#a8a29e;margin-top:2px">= Mai</div>
        </div>
      </div>

      <div style="background:white;border:1px solid #e7e5e4;border-radius:8px;padding:12px;margin-bottom:12px;">
        <div style="font-weight:700;font-size:13px;margin-bottom:12px;">Receita por dia (Jun 2026)</div>
        <div style="display:flex;align-items:flex-end;gap:4px;height:60px;">
          ${(function(){
            var data=[38,45,52,48,55,62,70,65,58,72,68,75,80,72,68,82,78,85,90,86,92,88,95,91,98,87,76,84,90,96];
            return data.map(function(v,i){
              var bg = i===20 ? '#d97706' : '#fde68a';
              var h = Math.round(v*0.6);
              return '<div style="flex:1;background:'+bg+';border-radius:2px 2px 0 0;height:'+h+'px;"></div>';
            }).join('');
          })()}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:#a8a29e;margin-top:4px;">
          <span>1 Jun</span><span>10 Jun</span><span>20 Jun</span><span>30 Jun</span>
        </div>
      </div>
    </div>
  </div>

  <h2>Relatório de equipe (eixo serviço)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Profissional</th><th>Atendimentos</th><th>Receita gerada</th><th>No-show</th><th>Avaliação média</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Juliana Costa</td><td>48</td><td>R$4.320</td><td>2 (4%)</td><td>⭐ 4.9</td></tr>
        <tr><td class="td-bold">Carlos Mendes</td><td>42</td><td>R$3.780</td><td>4 (9%)</td><td>⭐ 4.7</td></tr>
        <tr><td class="td-bold">Fernanda Lima</td><td>38</td><td>R$3.420</td><td>1 (3%)</td><td>⭐ 5.0</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Agendamento de relatórios</h2>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta P2</div>
    <p>Owner ou gerente cadastra e-mail(s) para receber relatório resumido automaticamente: diário (09h), semanal (segunda) ou mensal (dia 1). O e-mail inclui KPIs do período e link para abrir o relatório completo no ERP.</p>
  </div>

  <h2>Arquitetura da camada de analytics</h2>
  <pre>// Relatórios gerados sob demanda (não pré-calculados no MVP)
// Para volumes pequenos (<50k registros) queries diretas no Postgres são suficientes

// Exemplo: relatório de vendas do mês
async function buildSalesReport(storeId: string, from: Date, to: Date) {
  // Query agregada no banco de dados do tenant
  const rows = await prisma.order.groupBy({
    by: ['createdAt', 'channel'],
    where: { storeId, status: 'DELIVERED', createdAt: { gte: from, lte: to } },
    _sum: { totalAmount: true },
    _count: { id: true },
  });

  return {
    gmv: rows.reduce((s, r) => s + r._sum.totalAmount, 0),
    transactions: rows.reduce((s, r) => s + r._count.id, 0),
    byChannel: groupByChannel(rows),
    exportUrl: await generateExportFile(rows, 'xlsx'),
  };
}

// Exportação via ExcelJS (xlsx) ou papaparse (csv) no worker</pre>
</div>
`
});
