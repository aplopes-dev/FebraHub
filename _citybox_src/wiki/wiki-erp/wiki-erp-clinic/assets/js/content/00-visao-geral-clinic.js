WIKI.register({
  id: 'visao-geral-clinic',
  title: 'Visão Geral — Vertical Clinic',
  icon: '🏥',
  searchText: 'visao geral clinic clinica consultorio saude odontologia fisioterapia estetica medico psicologia nutricao medicina trabalho multi-especialidade citybox vertical ERP agendamento prontuario PEP paciente pacientes ficha orcamentos budgets tratamentos anamnese documentos financeiro convenio TISS configuracoes mock anamneses contrato ContractModel contract-models RichTextEditor equipe planos clinic configuracoes-parametros clinica-api clinic-api integrado biblioteca compartilhada horarios atendimento service-hours ProfessionalServiceHours proxy 3172 migration contract_models public anamnese token jspdf categoria paciente Patient PatientCategory CASL clinica-permissions cargos aluno dentista_admin dentista gerente secretario vendedor sales_view_funnel marketing_campaign_finalize foto perfil MinIO clinicaFetch React Query paginacao server-side debounce useDebouncedSearch CLIN-041 materialize approve PDF build-patient-budget-pdf feat/clinic/create-backend-patient agenda vendas CRM funil kanban sales.api.service sortOrder reorder Agendada Perdida estoque stock.api.service financeiro marketing captacao leads mock ERP implementado /clinic store memoria fillViewport PageNav sortBy erpDataTableStyleProps stock-movements historico retiradas pagina publica campanha dashboard indicadores expense-by-category inadimplencia ticket-medio',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Introdução</div>
    <h1 class="section-title">🏥 Visão Geral — Vertical Clinic</h1>
    <p class="section-subtitle">A Vertical Clinic do CityBox é um sistema de gestão completo para estabelecimentos de saúde de todas as especialidades — do agendamento online ao prontuário eletrônico, do faturamento ao controle financeiro, do ponto de atendimento ao app do paciente. Tudo integrado ao ecossistema CityBox de comércio local do município.</p>
    <div class="section-tags">
      <span class="tag-cyan">Vertical Clinic</span>
      <span class="tag-sky">clinica-api (NestJS) :3172</span>
      <span class="tag-teal">Next.js ERP :3107</span>
      <span class="tag-gray">schema clinica</span>
    </div>
  </div>

  <div class="alert alert-cyan">
    <span class="alert-icon">📍</span>
    <div class="alert-body">
      <div class="alert-title">Blueprint + implementação em andamento (jul–ago/2026)</div>
      <p>A Vertical Clinic segue o mesmo padrão Hub &amp; Spoke da Vertical Food (piloto). Já existe <strong>clinica-api</strong> em <code>apps/verticals/clinica/api</code> (porta <code>3172</code>, schema PostgreSQL <code>clinica</code>), proxy BFF no ERP (<code>/api/proxy/clinica/*</code>) e integração real das abas <strong>Clínica</strong>, <strong>Planos</strong>, <strong>Anamneses</strong>, <strong>Contrato</strong> e horários da <strong>Equipe</strong> em Configurações. Em <strong>jul/2026</strong> entregamos <strong>Pacientes</strong>, <strong>CLIN-041</strong> (Orçamentos e Tratamentos), Anamnese preenchida, Documentos, Financeiro/Transações/Comissões, Arquivos, Agenda (confirmação/lembrete WhatsApp), Estoque, <strong>Vendas / CRM</strong>, <strong>Marketing</strong> (<code>form_lead</code> + campanha <strong>Aniversariantes</strong> WhatsApp), <strong>WhatsApp Baileys MVP</strong> (<code>main-whatsapp</code>) e o <strong>Dashboard Indicadores</strong> em <code>/clinic</code> (<code>GET /v1/dashboard/*</code>). Em <strong>ago/2026</strong>: Exportar PDF no fluxo/transações; cancel financeiro → <code>pending</code>; demografia por décadas; comissão % com escopo Todos; lembretes WhatsApp em wall-clock; Indicações API. Convênios/TISS e odontograma avançado permanecem blueprint/pendentes.</p>
    </div>
  </div>

  <div class="eco-callout">
    <div class="eco-icon">🧭</div>
    <div class="eco-body">
      <div class="eco-title">Ecossistema Citybox — você está na Vertical Clinic (ERP da clínica)</div>
      <div class="eco-links">
        A Clinic usa o shell, auth e módulos comuns do <a href="../wiki-erp/index.html">ERP Base</a>.
        Pacientes descobrem a clínica no <a href="../../wiki-marketplace/index.html">Marketplace</a>.
        A plataforma é governada no <a href="../../wiki-admin/index.html">Admin</a>.
        <br><strong>Princípio:</strong> Admin governa · ERP opera · Marketplace conecta paciente à clínica.
      </div>
    </div>
  </div>

  <h2>O que a vertical entrega</h2>
  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Fase 1 — Core Operacional (MVP · 3 meses)</div>
    <ul>
      <li><strong>Agenda:</strong> criação, edição, bloqueio, visão semanal por profissional</li>
      <li><strong>Cadastro de pacientes</strong> com dados básicos e convênio</li>
      <li><strong>Check-in e sala de espera</strong> com status em tempo real via WebSocket</li>
      <li><strong>Prontuário eletrônico básico:</strong> SOAP + CID-10 + assinatura digital</li>
      <li><strong>Cobrança básica:</strong> dinheiro, PIX, cartão — integração payments-api</li>
      <li><strong>NFS-e básica</strong> via fiscal-api</li>
      <li><strong>Lembretes automáticos</strong> via WhatsApp (confirmação + ~2h; campanha aniversário)</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Sistema Completo — 11 Módulos</div>
    <ul>
      <li>Prontuário avançado: prescrição digital, pedido de exames, documentos, módulos por especialidade</li>
      <li>Odontograma interativo, periograma, plano de tratamento com orçamento</li>
      <li>Faturamento de convênios: guias TISS, produção, controle de glosas</li>
      <li>Estoque de insumos com FEFO, rastreabilidade e alerta de vencimento</li>
      <li>Comissões e repasses automáticos para profissionais</li>
      <li>Relatórios clínicos, financeiros e BI com exportação Looker Studio / Power BI</li>
      <li>Portal do paciente integrado ao marketplace CityBox</li>
      <li>App mobile do profissional (PWA → nativo)</li>
      <li>Telemedicina com registro automático no prontuário</li>
      <li>Medicina do Trabalho: ASO, PCMSO, gestão de empresas contratantes</li>
    </ul>
  </div>

  <h2>Maturidade por módulo</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Módulo</th><th>Estado</th><th>Meta v1</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Agenda &amp; Agendamento</td><td><span class="status-badge status-functional">✅ API</span></td><td><code>/clinic/agenda</code> — calendário dia/semana/mês, dnd, consultas/compromissos, encaixe, alerta de retorno, buscar horário livre (<code>clinicaFetch</code> → <code>modules/scheduling</code>)</td></tr>
        <tr><td class="td-bold">Recepção &amp; Sala de Espera</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>Check-in, triagem, kanban realtime</td></tr>
        <tr><td class="td-bold">Prontuário Eletrônico (PEP)</td><td><span class="status-badge status-functional">✅ Parcial</span></td><td>Cadastro + Sobre + foto + <strong>Orçamentos</strong> + aba <strong>Prontuário</strong> (Procedimentos) + <strong>Anamnese</strong> + <strong>Documentos</strong> + <strong>Financeiro</strong> + <strong>Arquivos</strong> via API; nutrição: Inicializar + antropometria Petróski</td></tr>
        <tr><td class="td-bold">Odontograma / Especialidades</td><td><span class="status-badge status-partial">🟡 Parcial</span></td><td>SVG Orçamentos+Tratamentos + anotações API; periograma/DICOM roadmap</td></tr>
        <tr><td class="td-bold">Financeiro &amp; Caixa</td><td><span class="status-badge status-functional">✅ Parcial</span></td><td><strong>Ficha</strong> + <strong>fluxo / Transações / config / Comissões</strong> via <code>v1/financial/*</code> (CLIN-060/061/062); Exportar PDF fluxo+transações; cancel → <code>pending</code>; Emitir recibo no caixa; payments-api / caixa de recepção ainda pendentes</td></tr>
        <tr><td class="td-bold">Faturamento &amp; Convênios</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>Guias TISS, lote, controle de glosas</td></tr>
        <tr><td class="td-bold">Estoque &amp; Suprimentos</td><td><span class="status-badge status-functional">✅ API</span></td><td><code>/clinic/estoque</code> — produtos, fornecedores, entradas/retiradas, histórico (<code>stock.api.service</code> → clinica-api); paginação, busca e ordenação server-side</td></tr>
        <tr><td class="td-bold">CRM &amp; Funil de Vendas</td><td><span class="status-badge status-functional">✅ API</span></td><td><code>/vendas</code> — kanban; sync orçamento→Funil de Venda (<code>budgetId</code>); CASL funis. Detalhe em <a href="#crm-funil-vendas">CRM &amp; Funil</a></td></tr>
        <tr><td class="td-bold">Marketing &amp; Captação</td><td><span class="status-badge status-functional">✅ Parcial</span></td><td><code>form_lead</code> + Aniversariantes + <strong>Indicações</strong> (<code>/marketing/indicacoes</code> → <code>/v1/indicacoes/*</code>); finalizar campanha gated por <code>marketing_campaign_finalize</code>. Detalhe em <a href="#captacao-leads">Captação de Leads</a> §26.9</td></tr>
        <tr><td class="td-bold">Equipe &amp; RH</td><td><span class="status-badge status-functional">✅ API</span></td><td>clinica-api members + CASL presets por cargo; horários só aluno/dentista/dentista_admin; comissão CLIN-062</td></tr>
        <tr><td class="td-bold">Loja · Assinatura Eletrônica</td><td><span class="status-badge status-functional">✅ API</span></td><td><code>/loja</code> — pacotes, saldo, card histórico de solicitações (DataTable paginado), relatório ZapSign. Detalhe em <a href="#loja-assinatura-eletronica">Loja</a></td></tr>
        <tr><td class="td-bold">Relatórios &amp; BI</td><td><span class="status-badge status-functional">✅ Parcial</span></td><td><code>/</code> Indicadores via <code>GET /v1/dashboard/*</code>; <code>/relatorios</code> via <code>GET /v1/reports/*</code>; <code>/tarefas</code> Consultas canceladas. Detalhe em <a href="#relatorios-bi">Relatórios &amp; BI</a> §10.0 / §10.0b</td></tr>
        <tr><td class="td-bold">Configurações &amp; RBAC</td><td><span class="status-badge status-functional">✅ API</span></td><td>Clínica / Planos / Anamneses / Contrato / Equipe / Categorias / WhatsApp; permissões CASL reais (<code>@citybox/clinica-permissions</code>). Detalhe em <a href="#configuracoes-parametros">Config. &amp; Parâmetros</a> § 11.0</td></tr>
        <tr><td class="td-bold">Portal &amp; App do Paciente</td><td><span class="status-badge status-functional">✅ Parcial</span></td><td>Página pública <code>/public/clinic/anamnese/[token]</code> integrada (BFF → clinica-api <code>@Public()</code>)</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Módulo Pacientes — API + ERP (jul/2026)</h2>
  <p>Rota base: <code>/clinic/pacientes</code> · backend: <code>apps/verticals/clinica/api/src/modules/patients/</code> (submódulo <code>patient-categories/</code>) · frontend: <code>apps/erp/src/features/clinic/modules/patients/</code> · proxy: <code>/api/proxy/clinica</code> + <code>X-Store-Id</code>. Legenda: <span class="status-badge status-functional">✅ API</span> = integrado; <span class="status-badge status-mock">🟠 Mock</span> = UI sem backend.</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tela / aba</th><th>Rota</th><th>Status</th><th>O que existe hoje</th><th>Pendente</th></tr></thead>
      <tbody>
        <tr>
          <td class="td-bold">Lista de pacientes</td>
          <td><code>/clinic/pacientes</code></td>
          <td><span class="status-badge status-functional">✅ API</span></td>
          <td>Busca/ordenação/paginação server-side; sheet criar/editar; inativar (PATCH status); categorias; CEP via platform-api</td>
          <td>—</td>
        </tr>
        <tr>
          <td class="td-bold">Sobre</td>
          <td><code>…/[id]/sobre</code></td>
          <td><span class="status-badge status-functional">✅ API</span></td>
          <td>Dados cadastrais, convênio (<code>planStatus</code> inativo → <code>(Inativo)</code>), responsável; cards de atalho; <strong>alerta de retorno</strong> (popover API — CRUD + Agendar → agenda)</td>
          <td><code>ReturnAlert</code> — removido ao agendar via <code>returnAlertId</code></td>
        </tr>
        <tr>
          <td class="td-bold">Foto de perfil</td>
          <td>header da ficha</td>
          <td><span class="status-badge status-functional">✅ API</span></td>
          <td><code>PatientPhotoDialog</code>: upload JPG/PNG/WebP (máx. 4 MB), troca/remoção; MinIO <code>{storeId}/patients/{id}.ext</code></td>
          <td>—</td>
        </tr>
        <tr>
          <td class="td-bold">Categorias de paciente</td>
          <td><code>/clinic/configuracoes/categoria-paciente</code></td>
          <td><span class="status-badge status-functional">✅ API</span></td>
          <td>CRUD <code>/v1/patient-categories</code>; categoria protegida <em>Particular</em> (seed); bloqueio delete se há pacientes</td>
          <td>—</td>
        </tr>
        <tr>
          <td class="td-bold">Categorias de agendamento</td>
          <td><code>/clinic/configuracoes/categoria-agendamento</code></td>
          <td><span class="status-badge status-functional">✅ API</span></td>
          <td>CRUD <code>/v1/appointment-categories</code> (isolado; sem sync com paciente)</td>
          <td>—</td>
        </tr>
        <tr>
          <td class="td-bold">Orçamentos</td>
          <td><code>…/[id]/orcamentos</code></td>
          <td><span class="status-badge status-functional">✅ API</span></td>
          <td>CRUD + listagem server-side (busca/paginação/ordenação); sheet; PDF impressão; aprovar materializa tratamentos <strong>e gera parcelas no Financeiro</strong></td>
          <td>—</td>
        </tr>
        <tr>
          <td class="td-bold">Prontuário</td>
          <td><code>…/[id]/tratamentos</code></td>
          <td><span class="status-badge status-functional">✅ Parcial</span></td>
          <td>Label <strong>Prontuário</strong> / copy <strong>Procedimento</strong>; lista API + reorder; avulsos; evoluções; <strong>finalizar</strong> (odonto/fisio) ou <strong>Inicializar</strong> (nutrição, tratamento permanece ativo); PDF evoluções; Petróski na aba Corporal</td>
          <td>Imagens de evolução na API (CLIN-051); débito financeiro ao finalizar (CLIN-060)</td>
        </tr>
        <tr>
          <td class="td-bold">Anamnese</td>
          <td><code>…/[id]/anamnese</code></td>
          <td><span class="status-badge status-functional">✅ API</span></td>
          <td>CRUD + listagem server-side (busca debounce 400&nbsp;ms); nova anamnese (modo profissional/paciente); compartilhar link; PDF preview; badge alertas</td>
          <td>Assinatura digital completa; consentimento LGPD persistido</td>
        </tr>
        <tr>
          <td class="td-bold">Documentos</td>
          <td><code>…/[id]/documentos</code></td>
          <td><span class="status-badge status-functional">✅ API</span></td>
          <td>Grid 2×2: <strong>Contrato</strong> (emitir/editar/excluir + histórico + preview), <strong>Receituário</strong> e <strong>Atestados</strong> (CRUD + histórico + PDF jsPDF); listagem paginada server-side (histórico <strong>sem</strong> busca); <strong>Termo</strong> desabilitado</td>
          <td>Assinatura digital; catálogo global de medicamentos; PDF persistido no servidor</td>
        </tr>
        <tr>
          <td class="td-bold">Financeiro</td>
          <td><code>…/[id]/financeiro</code></td>
          <td><span class="status-badge status-functional">✅ API</span></td>
          <td>Listagem server-side (<code>GET …/financial-entries</code>); filtros período/status; débito avulso; receber com select de caixa via <code>useFinancialAccounts</code>; totais em <code>meta.totals</code>; approve orçamento invalida cache</td>
          <td>Caixa no receive = contas API ✅; payments-api; upload MinIO de comprovante nas Transações</td>
        </tr>
        <tr>
          <td class="td-bold">Anamnese pública</td>
          <td><code>/public/clinic/anamnese/[token]</code></td>
          <td><span class="status-badge status-functional">✅ API</span></td>
          <td>Formulário mobile sem auth; BFF <code>/api/public/clinic/anamnesis/[token]</code>; 410 expirado, 409 duplicada</td>
          <td>Lembretes WhatsApp; registro de consentimento na API</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h3>API clinica-api — pacientes (endpoints)</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método</th><th>Rota</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">GET/POST</td><td><code>/api/v1/patients</code></td><td>Listagem paginada (busca nome/CPF/telefone) + criar</td></tr>
        <tr><td class="td-bold">GET/PUT</td><td><code>/api/v1/patients/:id</code></td><td>Detalhe + atualização</td></tr>
        <tr><td class="td-bold">PATCH</td><td><code>/api/v1/patients/:id/status</code></td><td>Inativar/reativar (sem DELETE físico)</td></tr>
        <tr><td class="td-bold">POST/GET/DELETE</td><td><code>/api/v1/patients/:id/photo</code></td><td>Foto multipart via MinIO</td></tr>
        <tr><td class="td-bold">GET/POST</td><td><code>/api/v1/patient-categories</code></td><td>Listar e criar categorias</td></tr>
        <tr><td class="td-bold">PUT/DELETE</td><td><code>/api/v1/patient-categories/:id</code></td><td>Atualizar / excluir (bloqueios se protegida ou com pacientes)</td></tr>
      </tbody>
    </table>
  </div>
  <p>Permissão: <code>store.clinic.patients.manage</code> · escopo: <code>X-Store-Id</code> · módulo Nest: <code>PatientsModule</code> importa <code>PatientCategoriesModule</code> em <code>modules/patients/patient-categories/</code>.</p>

  <h3>API clinica-api — orçamentos e tratamentos (CLIN-041 Fase 1)</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método</th><th>Rota</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">GET/POST</td><td><code>/api/v1/patients/:patientId/budgets</code></td><td>Listagem paginada (busca descrição/responsável, ordenação) + criar orçamento</td></tr>
        <tr><td class="td-bold">GET/PUT/DELETE</td><td><code>/api/v1/patients/:patientId/budgets/:id</code></td><td>Detalhe, atualizar (409 se aprovado), excluir</td></tr>
        <tr><td class="td-bold">PATCH</td><td><code>/api/v1/patients/:patientId/budgets/:id/status</code></td><td>Aprovar/rejeitar/expirar; <code>approved</code> materializa <code>PatientTreatment</code></td></tr>
        <tr><td class="td-bold">GET/POST</td><td><code>/api/v1/patients/:patientId/treatments</code></td><td>Listar + criar tratamento avulso</td></tr>
        <tr><td class="td-bold">GET/PUT/DELETE</td><td><code>/api/v1/patients/:patientId/treatments/:id</code></td><td>Detalhe, editar, excluir (409 se concluído)</td></tr>
        <tr><td class="td-bold">PATCH</td><td><code>/api/v1/patients/:patientId/treatments/reorder</code></td><td>Reordenar lista (<code>orderedIds</code>)</td></tr>
        <tr><td class="td-bold">PATCH</td><td><code>/api/v1/patients/:patientId/treatments/:id/finalize</code></td><td>Finalizar tratamento (evolução <code>source=treatment</code> + <code>status=completed</code> em transação atômica)</td></tr>
        <tr><td class="td-bold">GET/POST</td><td><code>/api/v1/patients/:patientId/evolutions</code></td><td>Evoluções avulsas; histórico em <code>GET …/evolutions/:id/history</code></td></tr>
      </tbody>
    </table>
  </div>

  <h3>API clinica-api — anamnese preenchida (jul/2026)</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método</th><th>Rota</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">GET/POST</td><td><code>/api/v1/patients/:patientId/anamneses</code></td><td>Listagem paginada (<code>search</code> no nome do modelo) + criar (<code>fillingMode</code>: professional | patient)</td></tr>
        <tr><td class="td-bold">GET/DELETE</td><td><code>/api/v1/patients/:patientId/anamneses/:id</code></td><td>Detalhe + exclusão</td></tr>
        <tr><td class="td-bold">GET/PATCH</td><td><code>/api/v1/public/anamnesis/:token</code></td><td>Rotas <code>@Public()</code> — formulário do paciente; snapshot ao submeter</td></tr>
      </tbody>
    </table>
  </div>
  <p>BFF ERP público: <code>GET/PATCH /api/public/clinic/anamnesis/[token]</code> · submódulo Nest: <code>patient-anamneses/</code> · entidade <code>PatientAnamnesis</code>.</p>

  <h2>Módulo Agenda — API + ERP (jul/2026)</h2>
  <p>Rota: <code>/clinic/agenda</code> · backend: <code>apps/verticals/clinica/api/src/modules/scheduling/</code> · frontend: <code>apps/erp/src/features/clinic/agenda/</code> · permissão: <code>store.scheduling.manage</code>.</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Área</th><th>Detalhe</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Consultas</td><td><code>GET/POST /v1/appointments</code> · <code>GET/PUT/PATCH/DELETE …/:id</code> · anti-overlap (pré-check no use case; EXCLUDE gist no ADR ainda pendente na migration)</td></tr>
        <tr><td class="td-bold">Compromissos</td><td><code>/v1/internal-events</code> — recorrência, privacidade; <strong>todo compromisso bloqueia consultas</strong> no intervalo (timed + all-day)</td></tr>
        <tr><td class="td-bold">Encaixe / Retorno</td><td><code>/v1/fit-ins</code> · <code>/v1/return-alerts</code> — popovers na agenda (badge semanal) + ficha do paciente (Agendar → agenda)</td></tr>
        <tr><td class="td-bold">Categorias</td><td><code>/v1/appointment-categories</code> — CRUD isolado; Configurações → <code>/categoria-agendamento</code></td></tr>
        <tr><td class="td-bold">Slots livres</td><td><code>GET /v1/available-slots</code> — exclui compromissos; step = <code>durationMin</code> (mín. 15); modal ERP: manhã &lt;12h, tarde ≥14h</td></tr>
        <tr><td class="td-bold">UX ERP</td><td><code>local-date.ts</code> + <code>clinic-datetime.ts</code> (fuso wall-clock); sheet consulta/compromisso; testes <code>agenda-api.test.ts</code>, <code>local-date.test.ts</code>, <code>clinic-datetime.test.ts</code></td></tr>
        <tr><td class="td-bold">WhatsApp</td><td><code>Switch</code> no sheet; confirmação + lembrete ~2h (<code>main-whatsapp</code>); status <em>Confirmada por mensagem</em></td></tr>
        <tr><td class="td-bold">Pendente</td><td>WebSocket sala de espera; agendamento online; realtime multi-usuário; SMS fallback</td></tr>
      </tbody>
    </table>
  </div>
  <p>Detalhe: <a href="#agenda-agendamento">Agenda &amp; Agendamento</a> · <a href="#encaixe-retorno">Encaixe &amp; Retorno</a>.</p>

  <h3>API clinica-api — documentos do paciente (jul/2026)</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método</th><th>Rota</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">GET/POST</td><td><code>/api/v1/patients/:patientId/contracts</code></td><td>Listagem paginada (ordenar por data/profissional) + emitir contrato (<code>ContractModel</code> + variáveis)</td></tr>
        <tr><td class="td-bold">GET/PUT/DELETE</td><td><code>/api/v1/patients/:patientId/contracts/:id</code></td><td>Detalhe, editar (409 se assinado), excluir</td></tr>
        <tr><td class="td-bold">GET/POST</td><td><code>/api/v1/patients/:patientId/prescriptions</code></td><td>Listagem paginada (summary com <code>itemCount</code>) + criar receituário (itens inline, mín. 1)</td></tr>
        <tr><td class="td-bold">GET/PUT/DELETE</td><td><code>/api/v1/patients/:patientId/prescriptions/:id</code></td><td>Detalhe com itens completos, editar, excluir</td></tr>
        <tr><td class="td-bold">GET/POST</td><td><code>/api/v1/patients/:patientId/certificates</code></td><td>Listagem paginada + emitir atestado (<code>days</code> ou <code>attendance</code>)</td></tr>
        <tr><td class="td-bold">GET/DELETE</td><td><code>/api/v1/patients/:patientId/certificates/:id</code></td><td>Detalhe + exclusão — <strong>sem PUT</strong> (atestado imutável após emissão)</td></tr>
      </tbody>
    </table>
  </div>
  <p>Submódulos Nest: <code>patient-contract-emissions/</code>, <code>patient-prescriptions/</code>, <code>patient-certificates/</code> · entidades <code>PatientContractEmission</code>, <code>PatientPrescription</code>, <code>PatientCertificate</code> · migration <code>20260706190108_add_documents_patient</code> · ERP: <code>patient-*-emissions|prescriptions|certificates.service</code> + PDF via <code>build-patient-prescription-pdf.ts</code> / <code>build-patient-certificate-pdf.ts</code>.</p>

  <h3>API clinica-api — financeiro da ficha (CLIN-060/061 · jul/2026)</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método</th><th>Rota</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">GET/POST</td><td><code>/api/v1/patients/:patientId/financial-entries</code></td><td>Listagem paginada (<code>search</code>, <code>status</code>, <code>periodFrom</code>/<code>periodTo</code>, ordenação) + criar débito avulso</td></tr>
        <tr><td class="td-bold">GET/PUT/DELETE</td><td><code>/api/v1/patients/:patientId/financial-entries/:id</code></td><td>Detalhe; PUT só <code>pending</code> + <code>source=avulso_debit</code>; DELETE livre</td></tr>
        <tr><td class="td-bold">PATCH</td><td><code>/api/v1/patients/:patientId/financial-entries/:id/receive</code></td><td>Baixa com <code>receiveDetail</code>; 409 se já recebido</td></tr>
        <tr><td class="td-bold">(efeito)</td><td><code>PATCH …/budgets/:id/status</code> → <code>approved</code></td><td><code>GenerateBudgetFinancialEntriesService</code> — entrada + parcelas idempotentes por orçamento</td></tr>
      </tbody>
    </table>
  </div>
  <p>ERP: <code>patient-financial-entries.service.ts</code> · <code>patient-financial-tab.tsx</code> · tabelas com <code>manualPagination</code> no <code>DataTable</code> (§8.1). Migration: <code>20260707125207_add_patient_financial_entries</code>.</p>

  <h2>Configurações ERP — abas e status atual</h2>
  <p>Rota base: <code>/clinic/configuracoes</code> · <strong>Anamneses</strong> persiste via <code>clinic-api</code>, <strong>Contrato</strong> (modelos de contrato — <code>ContractModel</code>, módulo <code>contract-models</code>) e <strong>Equipe</strong> (horários de atendimento) via <code>clinica-api</code> (proxy <code>/api/proxy/clinica</code>); demais abas ainda usam mocks em memória. Legenda: <span class="status-badge status-functional">✅ Funcional / Parcial</span> = fluxo completo com API ou escopo atual entregue; <span class="status-badge status-mock">🟠 Mock</span> = tela navegável com dados fictícios; <span class="status-badge status-proposed">💡 Blueprint</span> = descrito no wiki, ainda sem tela no ERP.</p>

  <div class="table-wrap">
    <table>
      <thead><tr><th>Aba</th><th>Rota</th><th>Status</th><th>O que existe hoje</th><th>O que falta (blueprint)</th></tr></thead>
      <tbody>
        <tr>
          <td class="td-bold">Clínica</td>
          <td><code>/clinic/configuracoes</code></td>
          <td><span class="status-badge status-functional">✅ Integrado API</span></td>
          <td>Formulário cadastral (dados, endereço, contato, horário abertura/fechamento) + upload de logo via MinIO — React Query + <code>GET/PUT /v1/clinic-profile</code></td>
          <td>Salas, TCLE, especialidades vinculadas a profissionais, grade semanal de horários</td>
        </tr>
        <tr>
          <td class="td-bold">Equipe</td>
          <td><code>/clinic/configuracoes/equipe</code></td>
          <td><span class="status-badge status-functional">✅ Integrado API</span></td>
          <td>CRUD clinica-api; CASL no vínculo; 8 cargos com presets; Horários para aluno/dentista/dentista_admin; Comissão CLIN-062</td>
          <td>Migração de cargos legados; integração horários↔agenda; auditoria LGPD</td>
        </tr>
        <tr>
          <td class="td-bold">Planos</td>
          <td><code>/clinic/configuracoes/planos</code></td>
          <td><span class="status-badge status-functional">✅ Integrado API</span></td>
          <td>CRUD completo: tabela + sheet 2 passos (dados → especialidades/tratamentos BRL), plano padrão, toggle ativo — <code>/v1/clinic-plans</code></td>
          <td>Vínculo com orçamento no prontuário, convênios e faturamento</td>
        </tr>
        <tr>
          <td class="td-bold">Anamneses</td>
          <td><code>/clinic/configuracoes/anamneses</code></td>
          <td><span class="status-badge status-functional">✅ Integrado API</span></td>
          <td>CRUD de modelos, biblioteca compartilhada (24 globais + custom clínica), toggle ativo por modelo, DnD, sheet aninhado, alertas (<code>generates_alert</code>)</td>
          <td>Link público do paciente, <code>PatientAnamnesis</code>, snapshot/PDF, versionamento de modelo, testes Vitest ERP</td>
        </tr>
        <tr>
          <td class="td-bold">Contrato</td>
          <td><code>/clinic/configuracoes/contrato</code></td>
          <td><span class="status-badge status-functional">✅ Funcional (API)</span></td>
          <td>CRUD <code>ContractModel</code> · sheet fullscreen · sidebar variáveis · <code>RichTextEditor</code> TipTap (A4, toolbar completa, buscar/substituir) · proxy <code>/api/proxy/clinica</code></td>
          <td>Assinatura digital, PDF de contrato assinado</td>
        </tr>
        <tr>
          <td class="td-bold">Categoria de Paciente</td>
          <td><code>/clinic/configuracoes/categoria-paciente</code></td>
          <td><span class="status-badge status-functional">✅ Integrado API</span></td>
          <td>CRUD <code>/v1/patient-categories</code>; usado no cadastro de pacientes</td>
          <td>—</td>
        </tr>
        <tr>
          <td class="td-bold">Categoria de Agendamento</td>
          <td><code>/clinic/configuracoes/categoria-agendamento</code></td>
          <td><span class="status-badge status-functional">✅ Integrado API</span></td>
          <td>CRUD <code>/v1/appointment-categories</code> (sem sync com paciente); usado na agenda</td>
          <td>—</td>
        </tr>
        <tr>
          <td class="td-bold">WhatsApp</td>
          <td><code>/clinic/configuracoes/whatsapp</code></td>
          <td><span class="status-badge status-functional">✅ MVP Baileys</span></td>
          <td>Sessão QR + templates; processo <code>main-whatsapp</code>; confirmação/lembrete agenda + campanha aniversário</td>
          <td>Cloud API oficial (escala)</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h3>Configurações ainda só no blueprint (sem aba no ERP)</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Módulo</th><th>Status</th><th>Onde está documentado</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">RBAC e papéis customizados</td><td><span class="status-badge status-proposed">💡 Blueprint</span></td><td><a href="#configuracoes-parametros">Config. &amp; Parâmetros</a> § 11.1</td></tr>
        <tr><td class="td-bold">Salas de atendimento</td><td><span class="status-badge status-proposed">💡 Blueprint</span></td><td>§ 11.2</td></tr>
        <tr><td class="td-bold">Tabela de procedimentos (TUSS/CBHPM)</td><td><span class="status-badge status-proposed">💡 Blueprint</span></td><td>§ 11.3</td></tr>
        <tr><td class="td-bold">TCLE digital</td><td><span class="status-badge status-proposed">💡 Blueprint</span></td><td>§ 11.2</td></tr>
        <tr><td class="td-bold">Integrações (Payments, NFS-e, TISS…)</td><td><span class="status-badge status-proposed">💡 Blueprint</span></td><td>§ 11.4 — WhatsApp Baileys MVP já ativo</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-blue">
    <span class="alert-icon">🖥️</span>
    <div class="alert-body">
      <div class="alert-title">Resumo rápido</div>
      <p><strong>Integrado API (jun–jul/2026):</strong> Anamneses (config + ficha), Planos, Contrato, Equipe (horários + <strong>regras de comissão</strong>), Clínica (perfil), <strong>Pacientes</strong> (lista/cadastro/categorias/Sobre/foto), <strong>Orçamentos</strong>, <strong>Tratamentos</strong>, <strong>Anamnese preenchida</strong>, <strong>Documentos</strong>, <strong>Financeiro da ficha</strong> + <strong>fluxo de caixa / Transações / Comissões / config</strong> (CLIN-060/061/062 · <code>v1/financial/*</code>, <code>v1/commissions/*</code>), <strong>Arquivos</strong>, <strong>Agenda</strong> (CLIN-020/021 + WhatsApp confirmação/lembrete), <strong>Estoque</strong>, <strong>Vendas / CRM</strong>, <strong>Marketing</strong> (<code>form_lead</code> + Aniversariantes WhatsApp 1 msg / 5 min) e <strong>WhatsApp Baileys</strong> (Configurações + <code>main-whatsapp</code>).<br>
      <strong>Só blueprint / Fase 2:</strong> débito ao finalizar tratamento; RBAC real; salas; TISS; <strong>upload de imagens</strong> em evoluções (CLIN-051); upload MinIO de comprovante nas Transações; payments-api / caixa de recepção; Excel de comissões / split payments-api.</p>
    </div>
  </div>

  <h2>Arquitetura da Vertical Clinic</h2>
  <div class="mermaid">
flowchart TB
  ERP["apps/erp :3107\nNext.js 16 (shell)"]
  BFF["BFF proxy\n/api/proxy/clinica/[...path]"]
  ClinicAPI["clinica-api :3172\nNestJS"]
  PlatAPI["platform-api :3103\nequipe backoffice"]
  MktAPI["marketplace-api :3101\nNestJS (core)"]
  KC["Keycloak\n(SSO + RBAC)"]
  DB[("Postgres\nschema: clinica")]
  PlatDB[("Postgres\nschema: platform")]
  MinIO["MinIO\n(logo da clínica)"]
  Redis["Redis\n(sala de espera — futuro)"]
  RTC["realtime-gateway\n:3104 WebSocket"]
  PayAPI["payments-api :3106"]
  FiscalAPI["fiscal-api\n(NFS-e)"]
  NotifAPI["notifications-api\n(WhatsApp/SMS)"]
  MQ["RabbitMQ\n(outbox eventos)"]

  ERP -->|"JWT + X-Store-Id"| BFF --> ClinicAPI
  ERP -->|"equipe CRUD"| PlatAPI
  ClinicAPI -->|"ClinicStoreProfile\nClinicPlan*\nProfessionalServiceHours"| DB
  ClinicAPI -->|"logo object key"| MinIO
  PlatAPI -->|"membros da loja"| PlatDB
  ClinicAPI -->|"listagem lojas"| PlatDB
  ClinicAPI -->|"JWT verify, invite/roles"| KC
  ClinicAPI -.->|"sala de espera, agenda, PEP (futuro)"| Redis
  Redis -.->|"push WebSocket"| RTC
  ClinicAPI -.->|"cobrança"| PayAPI
  ClinicAPI -.->|"NFS-e"| FiscalAPI
  ClinicAPI -.->|"lembretes, receitas"| NotifAPI
  ClinicAPI -.->|"eventos"| MQ
  MktAPI -.->|"agendamento online (futuro)"| ClinicAPI
  </div>

  <h2>Onde este wiki se encaixa</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">🏥</span> Este wiki (Clinic)</div>
      <p>Agenda, prontuário, odontograma, convênios TISS, estoque clínico, comissões, relatórios, portal do paciente e conformidade LGPD/CFM.</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">🏪</span> <a href="../wiki-erp/index.html">Wiki ERP Base</a></div>
      <p>Shell, autenticação, seleção de estabelecimento, RBAC genérico, catálogo, pedidos, checkout, estoque SKU, financeiro base.</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">🛍️</span> <a href="../../wiki-marketplace/index.html">Wiki Marketplace</a></div>
      <p>App consumidor onde o paciente descobre a clínica, agenda online e acessa documentos — usando o login único CityBox.</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">🛠️</span> <a href="../../wiki-admin/index.html">Wiki Admin</a></div>
      <p>Backoffice da plataforma: onboarding de clínicas, assinaturas, monitoramento, auditoria global.</p>
    </div>
  </div>

  <h2>Matriz: ERP Base + Clinic = ERP Clínica Completo</h2>
  <div class="sinergia-matrix">
    <div class="sm-header"><span class="sm-mod">Módulo</span><span class="sm-base">🏪 ERP Base fornece</span><span class="sm-vertical">🏥 Clinic adiciona (delta)</span></div>
    <div class="sm-row"><span class="sm-mod">Catálogo</span><span class="sm-base">CatalogItem polimórfico, serviços, preço, categorias</span><span class="sm-vertical">Procedimentos com código TUSS/CBHPM, duração, sala exigida, preparo</span></div>
    <div class="sm-row"><span class="sm-mod">Agenda</span><span class="sm-base">Scheduling genérico, slots de tempo</span><span class="sm-vertical">Grade por profissional, visão kanban da sala de espera, agendamento recorrente, lista de espera</span></div>
    <div class="sm-row"><span class="sm-mod">Paciente/Cliente</span><span class="sm-base">Perfil de cliente, histórico de pedidos</span><span class="sm-vertical">Ficha clínica, anamnese, prontuário, histórico de consultas, carteirinha de convênio</span></div>
    <div class="sm-row"><span class="sm-mod">Documentos</span><span class="sm-base">Documentos genéricos, uploads</span><span class="sm-vertical">Receitas, pedidos de exame, laudos, atestados, TCLE — com assinatura digital e imutabilidade</span></div>
    <div class="sm-row"><span class="sm-mod">Financeiro</span><span class="sm-base">Contas a Pagar/Receber, Fluxo de Caixa, DRE</span><span class="sm-vertical">Coparticipação de convênio, comissão por produção, lote TISS, controle de glosas</span></div>
    <div class="sm-row"><span class="sm-mod">Fiscal</span><span class="sm-base">NFS-e / NF-e via fiscal-api</span><span class="sm-vertical">NFS-e clínica pós-pagamento, retenção ISS/IRRF/CSLL/PIS/COFINS por serviço</span></div>
    <div class="sm-row"><span class="sm-mod">Estoque</span><span class="sm-base">InventoryStock por SKU, ajustes, inventário</span><span class="sm-vertical">Insumos clínicos, medicamentos com ANVISA, FEFO, rastreabilidade por paciente/lote</span></div>
    <div class="sm-row"><span class="sm-mod">RBAC / Equipe</span><span class="sm-base">StoreRole genérico, convite Keycloak</span><span class="sm-vertical">CASL <code>@citybox/clinica-permissions</code>: cargos aluno…vendedor + presets; horários aluno/dentista/dentista_admin</span></div>
    <div class="sm-row"><span class="sm-mod">Realtime</span><span class="sm-base">WebSocket pub/sub por storeId</span><span class="sm-vertical">Sala de espera Kanban em tempo real, chamada de paciente no painel de TV</span></div>
    <div class="sm-row"><span class="sm-mod">Notificações</span><span class="sm-base">E-mail, Push genérico</span><span class="sm-vertical">Lembretes D-2/D0 via WhatsApp, envio de receitas e documentos clínicos direto ao paciente</span></div>
  </div>
</div>
`
});
