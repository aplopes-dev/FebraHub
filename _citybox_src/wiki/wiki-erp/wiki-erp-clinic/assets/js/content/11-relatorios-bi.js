WIKI.register({
  id: 'relatorios-bi',
  title: 'Relatórios & Business Intelligence',
  icon: '📊',
  searchText: 'relatorios BI business intelligence dashboard diario recepcao profissional administrativo producao procedimentos CID diagnosticos faturamento inadimplencia ticket medio recebimentos convenios DRE fluxo caixa cashflow tooltip Receita Despesa barras Conversar WhatsappBrandIcon origem pacientes LTV lifetime value retencao exportacao Excel CSV PDF Power BI Looker Studio Google indicadores despesa categoria metas comissoes consultas ERP clinica-api expense-by-category uncategorized freshness invalidateClinicDashboardQueries tarefas cancelled-appointments missed reagendar',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Inteligência e Config</div>
    <h1 class="section-title">📊 Relatórios &amp; Business Intelligence</h1>
    <p class="section-subtitle">Dashboards operacionais, relatórios clínicos, análises financeiras e de crescimento. Exportação para Excel, CSV, PDF e integração com ferramentas de BI externas.</p>
    <div class="section-tags">
      <span class="tag-cyan">Dashboards Realtime</span>
      <span class="tag-teal">Exportação BI</span>
      <span class="tag-sky">LTV e Retenção</span>
    </div>
  </div>

  <div class="alert alert-teal">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Indicadores ERP — integrado à clinica-api (jul/2026)</div>
      <p>A rota <code>/clinic</code> (aba Indicadores) consome <code>GET /v1/dashboard/*</code> via <code>clinicaFetch</code> (proxy <code>/api/proxy/clinica</code> + <code>X-Store-Id</code>). Relatórios (<code>/clinic/relatorios</code>) usam <code>GET /v1/reports/*</code>. <strong>Tarefas</strong> (<code>/clinic/tarefas</code>) integra Consultas canceladas + card Pacientes — ver §10.0b. Detalhe canônico em <code>apps/erp/src/features/clinic/AGENTS.md</code> §8.2 e <code>apps/verticals/clinica/api/AGENTS.md</code> §4.7.</p>
    </div>
  </div>

  <h2>10.0 Dashboard Indicadores (<code>/clinic</code>) — estado atual</h2>
  <p>Ordem dos cards (API + PDFs/deep-links onde aplicável). Freshness: <code>staleTime: 0</code> + <code>refetchOnMount: 'always'</code>; mutações financeiras invalidam queries <code>clinic-dashboard*</code>.</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Bloco</th><th>Filtro</th><th>Conteúdo</th><th>API / ações</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">KPIs</td><td>—</td><td>Débitos em atraso, orçamentos abertos/reprovados, aniversariantes</td><td><code>GET /summary</code> · deep-link caixa / dialogs</td></tr>
        <tr><td class="td-bold">Receitas + Financeiro + Pacientes</td><td>mês/ano / métricas</td><td>Grid ~55/45</td><td><code>revenue-analysis</code> · <code>financial/entries/stats</code> · <code>patients/summary</code></td></tr>
        <tr><td class="td-bold">Metas de Vendas</td><td>mês/ano (UI)</td><td>Progresso, necessário/dia, gráfico acumulado × objetivo</td><td><code>GET/PUT sales-goals</code></td></tr>
        <tr><td class="td-bold">Orçamentos</td><td>anual/mensal</td><td>Status + análise por profissional/plano/tratamento</td><td><code>budget-analysis/*</code> · Ver / PDF</td></tr>
        <tr><td class="td-bold">Origem + Demografia</td><td>anual/mensal · sexo</td><td>Barras de origem; idade em <strong>faixas de década</strong> (0–9 … 100+ + “Idade não informado”; gráfico vertical altura fixa 320px — evita loop de scroll ao recolher sidebar) + pizza de sexo</td><td><code>patient-acquisition</code> · <code>patient-demographics</code></td></tr>
        <tr><td class="td-bold">Consultas</td><td>categoria + período</td><td>Realizadas / faltas; gráfico; taxa de comparecimento</td><td><code>appointments</code> + <code>/details</code></td></tr>
        <tr><td class="td-bold">Receitas x Despesas</td><td>anual/mensal</td><td>Totais + barras finas (topo reto) + saldo; tooltip <strong>Dia X</strong> / mês com só Receita e Despesa</td><td><code>cashflow</code> · Exportar PDF</td></tr>
        <tr><td class="td-bold">Comissões pagas</td><td>anual/mensal</td><td>Total, regras, tipos, ranking</td><td><code>commissions</code> + <code>/details</code></td></tr>
        <tr><td class="td-bold">Recebimentos por meio</td><td>período fino</td><td>Total + barra stacked + legenda</td><td><code>payment-methods</code> · Ver → Transações</td></tr>
        <tr><td class="td-bold">Ticket médio</td><td>anual/mensal</td><td>2 LineCharts (rendimento + lucratividade)</td><td><code>ticket-medio</code></td></tr>
        <tr><td class="td-bold">Inadimplência</td><td>anual/mensal</td><td>Pizza Adimplência/Inadimplência; taxa e valor no centro</td><td><code>inadimplencia</code> + <code>/details</code> · VER + PDF</td></tr>
        <tr><td class="td-bold">Despesa por categoria</td><td>anual/mensal</td><td>Pizza + Total; legenda nome/%/valor (cores da categoria)</td><td><code>expense-by-category</code> · Ver → Fluxo de caixa</td></tr>
      </tbody>
    </table>
  </div>
  <ul>
    <li><strong>Inadimplência:</strong> taxa = (valor não recebido ÷ total dos débitos com vencimento no período) × 100%; só pacientes inadimplentes no momento; valores brutos.</li>
    <li><strong>Despesa por categoria:</strong> só expenses <code>paid</code> por <code>paidAt</code>; valor = <code>paidValueCents ?? valueCents</code>; sem <code>expenseCategoryId</code> → bucket <strong>Sem categoria</strong> (<code>categoryId: uncategorized</code> — sentinel, não é UUID de <code>FinancialCategory</code>). Pagamentos de comissão geram despesa sem categoria. Deep-link <code>?types=expense&amp;categories={id}&amp;period=custom&amp;startDate&amp;endDate</code>.</li>
    <li><strong>Freshness:</strong> ao pagar/receber/criar/editar lançamento (ou pagar comissão), <strong>e</strong> ao mudar/remover status de consulta, o ERP invalida <code>clinic-dashboard*</code> (+ reports) — ao voltar a Indicadores/Tarefas os cards refetcham sem F5.</li>
    <li><strong>Cashflow UX:</strong> barras com <code>radius={0}</code> e <code>barSize</code> fixo (mensal 14 / anual 28); tooltip custom (<code>CashflowChartTooltip</code>) soma paid+forecast em Receita/Despesa — sem séries separadas no popover.</li>
    <li><strong>Conversar:</strong> ícone oficial WhatsApp em dialogs de Pacientes, aniversariantes, origem, consultas e inadimplência.</li>
  </ul>

  <h2>10.0b Tarefas (<code>/clinic/tarefas</code>) — estado atual (jul/2026)</h2>
  <p>Grid 1→2 colunas (<code>lg</code>) com dois cards lado a lado. Freshness + invalidação iguais aos Indicadores.</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Card</th><th>Conteúdo</th><th>API / UX</th></tr></thead>
      <tbody>
        <tr>
          <td class="td-bold">Consultas canceladas</td>
          <td>Lista de consultas <code>missed</code> | <code>cancelled_patient</code> | <code>cancelled_pro</code> no período; empty state “Parabéns…”; WhatsApp / Reagendar / Ignorar</td>
          <td><code>GET /v1/dashboard/tasks/cancelled-appointments</code> (<code>startDate</code>/<code>endDate</code>, paginação); ignore em <code>sessionStorage</code>; <code>professionalName</code> via equipe; mobile: layout compacto lado a lado (sem avatar); modal Reagendar com máscara de celular e botão “Encontrar horário livre” à esquerda da duração</td>
        </tr>
        <tr>
          <td class="td-bold">Pacientes</td>
          <td>Mesmo card do Indicadores (métricas + Ver)</td>
          <td><code>DashboardPatientsCard</code> · dialogs de métrica/aniversariantes; botão <strong>Conversar</strong> com <code>WhatsappBrandIcon</code> (<code>wa.me</code>); mobile: abaixo das infos; desktop (<code>sm+</code>): à direita na mesma linha</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>10.1 Dashboards operacionais</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">🖥️</span> Dashboard da Recepção</div>
      <p>Agenda do dia, taxa de ocupação, tempo médio de espera, pendências de cobrança, pacientes aguardando. Visão do turno em tempo real.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">👩‍⚕️</span> Dashboard do Profissional</div>
      <p>Próximos pacientes, consultas do dia realizadas, faturamento do mês, NPS acumulado, taxa de retorno. Acessível pelo app mobile.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">📈</span> Dashboard Administrativo</div>
      <p>Faturamento bruto/líquido, inadimplência, ocupação geral, estoque crítico, produção por especialidade. Visão executiva — no ERP coberta em grande parte pelos Indicadores em <code>/clinic</code> (API).</p>
    </div>
  </div>

  <h2>10.2 Relatórios clínicos</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Relatório</th><th>Filtros</th><th>Uso</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Produção por procedimento</td><td>Profissional, período, especialidade</td><td>Avaliar desempenho e lucratividade</td></tr>
        <tr><td class="td-bold">CIDs mais frequentes</td><td>Especialidade, período, profissional</td><td>Perfil epidemiológico da clínica</td></tr>
        <tr><td class="td-bold">Pacientes ativos × inativos</td><td>Sem consulta há X meses</td><td>Campanha de reativação</td></tr>
        <tr><td class="td-bold">Distribuição demográfica</td><td>Faixa etária (décadas), sexo, bairro/cidade</td><td>Planejamento — card Idade/sexo no dashboard (API; 12 buckets fixos)</td></tr>
        <tr><td class="td-bold">Taxa de absenteísmo</td><td>Profissional, especialidade, período</td><td>Card Consultas (faltas + taxa de comparecimento)</td></tr>
        <tr><td class="td-bold">Tempo médio de atendimento</td><td>Profissional, procedimento</td><td>Otimização de agenda</td></tr>
      </tbody>
    </table>
  </div>

  <h2>10.3 Relatórios financeiros</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Relatório</th><th>Período</th><th>Dimensões</th><th>No ERP (Indicadores)</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Faturamento bruto e líquido</td><td>Dia / semana / mês / ano</td><td>Especialidade, profissional, convênio</td><td>✅ Análise de Receitas + Ticket médio (API)</td></tr>
        <tr><td class="td-bold">Ticket médio</td><td>Anual / mensal</td><td>Rendimento por paciente · lucratividade</td><td>✅ <code>GET /v1/dashboard/ticket-medio</code></td></tr>
        <tr><td class="td-bold">Recebimentos por forma</td><td>Período fino</td><td>Dinheiro, PIX, cartão, etc.</td><td>✅ <code>GET /v1/dashboard/payment-methods</code></td></tr>
        <tr><td class="td-bold">Inadimplência</td><td>Anual / mensal</td><td>Taxa %, valor em aberto, lista de débitos</td><td>✅ <code>inadimplencia</code> + <code>/details</code></td></tr>
        <tr><td class="td-bold">Despesa por categoria</td><td>Anual / mensal</td><td>Categorias financeiras (+ Sem categoria)</td><td>✅ <code>GET /v1/dashboard/expense-by-category</code></td></tr>
        <tr><td class="td-bold">Faturamento de convênios</td><td>Por lote / mensal</td><td>Produção × recebido × glosado por operadora</td><td>Blueprint</td></tr>
        <tr><td class="td-bold">DRE Mensal e Anual</td><td>Mensal / anual</td><td>Receita bruta → deduções → líquida → despesas → lucro</td><td>Blueprint</td></tr>
        <tr><td class="td-bold">Fluxo de caixa realizado vs. projetado</td><td>Anual / mensal</td><td>Receitas × despesas (+ previstas)</td><td>✅ <code>GET /v1/dashboard/cashflow</code></td></tr>
      </tbody>
    </table>
  </div>

  <h2>10.4 Relatórios de marketing e crescimento</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">📍</span> Origem dos Pacientes</div>
      <p>Indicação, busca no Google, marketplace CityBox, redes sociais, campanha. Qual canal traz mais pacientes e com melhor LTV. <strong>No ERP:</strong> card “Como o paciente chegou” (API, filtro por data de cadastro).</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">📅</span> Taxa de Conversão</div>
      <p>Agendamentos online vs. comparecimentos. Identifica gargalos na jornada — onde os pacientes desistem antes de ir à clínica.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🔄</span> Retenção de Pacientes</div>
      <p>% que faz 2ª consulta, 5ª consulta. Funil de fidelização. Pacientes que param de voltar após quantas visitas.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">💎</span> LTV do Paciente</div>
      <p>Lifetime Value: valor total gerado pelo paciente ao longo do relacionamento com a clínica. Segmentação por especialidade e procedimento mais frequente.</p>
    </div>
  </div>

  <h2>10.5 Exportações</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Destino</th><th>Formato</th><th>Conteúdo</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Excel / CSV</td><td>.xlsx, .csv</td><td>Todos os relatórios operacionais e financeiros</td></tr>
        <tr><td class="td-bold">PDF</td><td>.pdf</td><td>DRE, produção, prontuário; no dashboard: vários cards/dialogs (orçamentos, comissões, inadimplentes, demografia, etc.)</td></tr>
        <tr><td class="td-bold">Prontuário do paciente</td><td>PDF (LGPD)</td><td>Exportação completa por solicitação (art. 18 LGPD)</td></tr>
        <tr><td class="td-bold">Google Looker Studio</td><td>API / conector</td><td>Dashboard customizável no BI da clínica</td></tr>
        <tr><td class="td-bold">Power BI</td><td>API / conector</td><td>Relatórios executivos para redes de clínicas</td></tr>
        <tr><td class="td-bold">Contabilidade</td><td>.csv / OFX</td><td>DRE, lançamentos, NFS-e emitidas — para o contador</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-cyan">
    <span class="alert-icon">🏙️</span>
    <div class="alert-body">
      <div class="alert-title">Dados anonimizados para a prefeitura</div>
      <p>Indicadores de saúde populacionais anonimizados — doenças mais prevalentes, faixas etárias mais atendidas, especialidades com demanda reprimida — disponíveis para a prefeitura parceira do CityBox. Diferencial exclusivo da plataforma municipal.</p>
    </div>
  </div>
</div>
`
});
