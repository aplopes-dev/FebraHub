WIKI.register({
  id: 'agenda-agendamento',
  title: 'Agenda & Agendamento',
  icon: '📅',
  searchText: 'agenda agendamento visao semanal mensal profissional sala espera digital kanban online portal paciente confirmacao lembrete whatsapp SMS email push antecedencia lista espera falta absenteismo recorrente bloqueio API clinicaFetch ERP implementado /clinic/agenda features/clinic/agenda scheduling available-slots local-date dnd calendario dia semana mes sheet agendamento encaixe retorno TanStack Label cancelled missed vermelho reabrir status bg-red-400 in_progress patient_waiting wall-clock toClinicWallClockUtc prefill profissional use-prefill-agenda-professional',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Agenda e Recepção</div>
    <h1 class="section-title">📅 Agenda &amp; Agendamento</h1>
    <p class="section-subtitle">O módulo de Agenda é o coração operacional da clínica. Toda a jornada do paciente começa aqui — da marcação ao comparecimento. Gerencia slots de tempo, visões por profissional, lembretes automáticos e lista de espera.</p>
    <div class="section-tags">
      <span class="tag-cyan">Core Operacional</span>
      <span class="tag-teal">WebSocket realtime</span>
      <span class="tag-sky">WhatsApp / SMS</span>
    </div>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Integrado na API — <code>/clinic/agenda</code> (jul/2026)</div>
      <p><strong>Código:</strong> rota em <code>app/clinic/agenda/</code> · feature em <code>features/clinic/agenda/</code> · camada <code>agenda/api/*</code> via <code>clinicaFetch</code> (proxy <code>/api/proxy/clinica</code>, header <code>X-Store-Id</code>).<br>
      <strong>Endpoints:</strong> <code>/v1/appointments*</code>, <code>internal-events</code>, <code>fit-ins</code>, <code>return-alerts</code>, <code>appointment-categories</code>, <code>available-slots</code>. Equipe via platform-api; pacientes e perfil da clínica reutilizam módulos existentes.<br>
      <strong>Telas:</strong> calendário dia/semana/mês, DnD para remarcar, <em>sheet</em> consulta/compromisso, popovers de <strong>encaixe</strong> e <strong>alerta de retorno</strong> (ver §20).<br>
      <strong>UX jul/2026:</strong> datas locais (<code>lib/local-date.ts</code>); horários wall-clock (<code>lib/clinic-datetime.ts</code> — 15:00 na API = 15:00 na UI, payloads <code>.000Z</code>); modal "Buscar horário livre" com colunas manhã (&lt;12h) e tarde (≥14h), ocultando 12:00–13:59; <strong>todo compromisso bloqueia consultas</strong> no intervalo (API + calendário + available-slots); categorias de agendamento <strong>independentes</strong> das de paciente (CRUD em <code>/configuracoes/categoria-agendamento</code>); badge de retorno filtra por <strong>semana</strong> (seg–dom).<br>
      <strong>Status cancelada/falta (jul/2026):</strong> cards no calendário em vermelho; faixa superior do popover de detalhes em vermelho suave (<code>bg-red-400</code>); é possível <strong>reabrir</strong> <code>cancelled_*</code>/<code>missed</code> → <code>scheduled</code>|<code>confirmed</code>|<code>patient_waiting</code> (API valida slot livre).<br>
      <strong>Seed first-contact:</strong> consulta demo amanhã às <strong>09:00 wall-clock</strong> (<code>T09:00:00.000Z</code>); <code>professionalId</code> = <code>store_members.id</code> (preferencialmente o gerente demo) — <em>não</em> usar <code>members.id</code> (a agenda ERP filtra por membership da loja).</p>
    </div>
  </div>

  <h3>Detalhes técnicos — integração atual</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Área</th><th>Detalhe</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Services</td><td><code>agenda/api/appointments.ts</code>, <code>commitments.ts</code>, <code>fit-ins.ts</code>, <code>return-alerts.ts</code>, <code>categories.ts</code>, <code>available-slots.ts</code></td></tr>
        <tr><td class="td-bold">Hooks</td><td>TanStack Query com <code>useStore()</code> nas query keys; testes em <code>agenda-api.test.ts</code></td></tr>
        <tr><td class="td-bold">Buscar horário</td><td><code>find-free-slot-dialog.tsx</code> — API calcula slots (clínica ∩ profissional − almoço − consultas − <strong>todos os compromissos</strong>); step = <code>durationMin</code> (mín. 15); UI separa turnos e esconde intervalo de almoço</td></tr>
        <tr><td class="td-bold">Compromissos</td><td>Todo <code>internal-event</code> (timed ou dia inteiro, público ou privado) bloqueia consultas no overlap; privado ofusca conteúdo, não o bloco de tempo</td></tr>
        <tr><td class="td-bold">Categorias</td><td>Sheet usa <code>appointment-categories</code>; Configurações → <code>/categoria-agendamento</code> (rota própria, sem sync com paciente)</td></tr>
        <tr><td class="td-bold">Datas</td><td><code>local-date.ts</code> (só calendário) + <code>clinic-datetime.ts</code> (horários wall-clock UTC — exibição sem shift de fuso local)</td></tr>
        <tr><td class="td-bold">Status</td><td>Cancelada/falta → card vermelho + header popover <code>bg-red-400</code>; reabrir via PATCH status (slot livre); <code>scheduled</code>/<code>confirmed</code> → <code>in_progress</code> permitido (pula <code>patient_waiting</code>)</td></tr>
        <tr><td class="td-bold">WhatsApp</td><td><code>Switch</code> no sheet (create on / edit off); confirmação + lembrete ~2h (worker; janelas em <strong>wall-clock</strong> clínica); status <em>Confirmada por mensagem</em>; form pré-seleciona profissional do membro logado quando aplicável</td></tr>
        <tr><td class="td-bold">Pendente</td><td>WebSocket sala de espera; agendamento online pelo paciente; realtime multi-usuário; SMS fallback</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Visões da agenda</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">📋</span> Visão Semanal por Profissional</div>
      <p>Grade de horários dividida por colunas de profissionais. Cada coluna exibe os slots com cores por status. Permite arrastar e soltar consultas para remarcar. Ideal para a recepcionista no monitor principal.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">📆</span> Visão Mensal</div>
      <p>Visão macro com indicadores de ocupação por dia. Clique no dia abre a visão daquele dia para o profissional selecionado. Útil para planejar férias da equipe e sazonalidade.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">👤</span> Visão do Profissional (Self)</div>
      <p>Cada profissional vê apenas a própria agenda, com foco no próximo paciente, contador de consultas do dia e acesso rápido ao prontuário do paciente da vez.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">🖥️</span> Sala de Espera Digital</div>
      <p>Painel Kanban com colunas de status em tempo real via WebSocket. Pode ser exibido em monitor na recepção e no celular do profissional. Atualizado sem polling.</p>
    </div>
  </div>

  <h2>Cores de status na grade</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Status</th><th>Cor</th><th>Ação Rápida Disponível</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Agendado</td><td><span class="mock-badge mock-badge-blue">Azul claro</span></td><td>Confirmar, Remarcar, Cancelar, Check-in</td></tr>
        <tr><td class="td-bold">Confirmado</td><td><span class="mock-badge mock-badge-blue">Azul médio</span></td><td>Check-in, Remarcar, Cancelar</td></tr>
        <tr><td class="td-bold">Check-in feito</td><td><span class="mock-badge mock-badge-green">Verde claro</span></td><td>Iniciar Atendimento, Triagem</td></tr>
        <tr><td class="td-bold">Em Atendimento</td><td><span class="mock-badge mock-badge-green">Verde escuro</span></td><td>Encerrar Consulta</td></tr>
        <tr><td class="td-bold">Finalizado</td><td><span class="mock-badge" style="background:#f3f4f6;color:#374151">Cinza</span></td><td>Ver Prontuário, Cobrar</td></tr>
        <tr><td class="td-bold">Não Compareceu / Falta</td><td><span class="mock-badge mock-badge-red">Vermelho</span></td><td>Reabrir (Agendada/Confirmada), Remarcar</td></tr>
        <tr><td class="td-bold">Cancelado (paciente/profissional)</td><td><span class="mock-badge mock-badge-red">Vermelho</span></td><td>Reabrir, Reagendar; correção de motivo entre cancelamentos</td></tr>
        <tr><td class="td-bold">Bloqueado</td><td><span class="mock-badge" style="background:#e5e7eb;color:#6b7280">Listrado cinza</span></td><td>Desbloquear</td></tr>
      </tbody>
    </table>
  </div>
  <p><strong>ERP atual:</strong> cor do card vem da categoria; ao marcar <code>missed</code> / <code>cancelled_patient</code> / <code>cancelled_pro</code>, <code>calendar-transform</code> força vermelho. Header do popover usa <code>bg-red-400</code>. Máquina de estados na <code>clinica-api</code> permite reabrir cancelada/falta (com assert de horário).</p>

  <h2>Agendamento online (portal do paciente)</h2>
  <div class="mermaid">
flowchart LR
  Paciente --> Especialidade --> Profissional --> Data --> Horario --> Confirmacao
  Confirmacao -->|"WhatsApp + e-mail"| Paciente
  Confirmacao -->|"link: remarcar / cancelar"| Paciente
  </div>

  <ul>
    <li>Fluxo: especialidade → profissional → data → horário disponível → confirmação</li>
    <li>Confirma via WhatsApp/e-mail com link de autogestão (remarcar/cancelar)</li>
    <li>Política configurável de antecedência mínima e máxima para agendamento</li>
    <li>Bloqueio automático de horário após agendamento (sem dupla marcação)</li>
    <li>Lista de espera: paciente entra na fila e recebe aviso se vaga abrir</li>
    <li>Agendamento via link compartilhável por especialidade ou por profissional</li>
    <li>Upload de documentos necessários (pedido médico, guia de convênio) pelo app</li>
  </ul>

  <h2>Agendamento interno (recepção)</h2>
  <ul>
    <li>Busca de paciente por nome, CPF, telefone ou carteirinha de convênio</li>
    <li>Cadastro rápido de novo paciente direto no fluxo de agendamento</li>
    <li>Seleção de procedimento/especialidade com duração automática preenchida</li>
    <li>Agendamento recorrente: semanal, quinzenal, mensal com número de sessões</li>
    <li>Bloqueio de horários por motivo (reunião, almoço, feriado, férias)</li>
    <li>Agendamento para múltiplos profissionais em sequência (ex: RX → médico)</li>
    <li>Observações internas (visíveis só para equipe) e alerta no próximo agendamento</li>
    <li>Escolha de convênio ou particular no momento do agendamento</li>
  </ul>

  <h2>Confirmação e lembretes automáticos</h2>
  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">WhatsApp Baileys MVP (jul/2026 · fuso ago/2026)</div>
      <p>Confirmação no create/update da consulta (toggle no sheet). Lembrete ~2h antes para <code>confirmed</code> e ~5 min para <code>scheduled</code> sem reply (poll 60s no <code>main-whatsapp</code>). Janelas comparam <code>toClinicWallClockUtc(now)</code> com <code>startAt</code> wall-clock-as-UTC (comparar UTC real causava <code>late</code>/lembrete ~3h cedo). Paciente responde <code>1</code>/<code>2</code> para confirmar/cancelar. Configuração: <code>/configuracoes/whatsapp</code>.</p>
    </div>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Canal</th><th>Quando</th><th>Conteúdo</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">WhatsApp</td><td>Ao agendar / ao religar toggle</td><td>Confirmação com opções 1/2</td></tr>
        <tr><td class="td-bold">WhatsApp</td><td>~2h antes (<code>confirmed</code>)</td><td>Lembrete automático (template fixo)</td></tr>
        <tr><td class="td-bold">WhatsApp</td><td>~5 min antes (<code>scheduled</code> sem reply)</td><td>Texto “já está confirmada” — status permanece scheduled</td></tr>
        <tr><td class="td-bold">E-mail</td><td>—</td><td>Comprovante — blueprint</td></tr>
        <tr><td class="td-bold">SMS</td><td>—</td><td>Fallback — blueprint</td></tr>
        <tr><td class="td-bold">Push</td><td>—</td><td>App paciente — blueprint</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Gestão de ausências e lista de espera</h2>
  <div class="card-grid">
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">❌</span> Controle de Faltas</div>
      <p>Registro de falta com motivo opcional. Contador de faltas por paciente — alerta ao agendar para quem acumula faltas. Política de tolerância configurável (ex: 3 faltas = bloquear agendamento online).</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">📋</span> Lista de Espera Automática</div>
      <p>Ao cancelar uma consulta, o sistema notifica automaticamente o próximo paciente da lista de espera via WhatsApp. O paciente responde "sim" para confirmar o horário disponibilizado.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">📊</span> Relatório de Absenteísmo</div>
      <p>Taxa de absenteísmo por profissional, especialidade e período. Identifica padrões para ajustar política de confirmação ou overbooking controlado.</p>
    </div>
  </div>

  <h2>Entidades de dados (schema_clinic)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Entidade</th><th>Campos Principais</th><th>Relações</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>Appointment</code></td><td>storeId, patientId, professionalId, procedureId, slot, status, channel, notes</td><td>Patient, Staff, Procedure</td></tr>
        <tr><td class="td-bold"><code>AppointmentBlock</code></td><td>professionalId, startAt, endAt, reason</td><td>Staff</td></tr>
        <tr><td class="td-bold"><code>WaitingList</code></td><td>patientId, specialtyId, requestedAt, notifiedAt</td><td>Patient</td></tr>
        <tr><td class="td-bold"><code>AbsenceRecord</code></td><td>appointmentId, reason, notifiedAt</td><td>Appointment</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
