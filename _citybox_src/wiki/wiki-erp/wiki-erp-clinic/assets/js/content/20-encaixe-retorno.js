WIKI.register({
  id: 'encaixe-compromissos-retorno',
  title: 'Encaixe, Compromissos & Alerta de Retorno',
  icon: '⏱️',
  searchText: 'encaixe fila espera priorizada urgente turno manha tarde qualquer data compromisso interno reuniao manutencao equipamento treinamento recorrencia diaria semanal quinzenal mensal anual privado publico ofuscado categoria consulta cor avaliacao retorno sessao procedimento crud inline 409 buscar horario livre slot disponivel almoco janela funcionamento alerta retorno data badge filtro periodo agendar pre-preenchido status pendente agendado cancelado appointment appointmentcategory internalevent fitin returnalert multi-especialidade API clinicaFetch ERP implementado /clinic/agenda fit-ins return-alerts encaixe alerta retorno popover available-slots durationMin',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Agenda e Recepção</div>
    <h1 class="section-title">⏱️ Encaixe, Compromissos &amp; Alerta de Retorno</h1>
    <p class="section-subtitle">Recursos avançados de agenda que complementam o módulo de Agendamento: blocos internos de tempo (compromissos), categorização de consultas, busca de horário livre, fila de encaixe priorizada e o ciclo automático de alertas de retorno. Juntos, eles tornam a agenda da clínica multi-especialidade densa, previsível e sem horários perdidos.</p>
    <div class="section-tags">
      <span class="tag-cyan">Agenda Avançada</span>
      <span class="tag-teal">Fila</span>
      <span class="tag-amber">Retorno</span>
    </div>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Integrado na API — <code>/clinic/agenda</code> (jul/2026)</div>
      <p><strong>Código:</strong> <code>features/clinic/agenda/</code> — popovers no cabeçalho da agenda; <code>agenda/api/fit-ins</code> e <code>agenda/api/return-alerts</code> via <code>clinicaFetch</code> (<code>/v1/fit-ins</code>, <code>/v1/return-alerts</code>). Ficha do paciente: <code>patient-return-alerts-popover.tsx</code> (popover 672×301) no header.<br>
      <strong>Telas:</strong> gestão de encaixe e alerta de retorno na agenda; alertas de retorno na ficha com CRUD + <strong>Agendar</strong> (navega para <code>/clinic/agenda</code> com sheet pré-preenchido; <code>returnAlertId</code> remove o alerta ao criar a consulta).</p>
    </div>
  </div>

  <h2>Dois tipos de evento na agenda</h2>
  <p>A grade de horários comporta dois tipos de evento distintos. Ambos ocupam um bloco de tempo e bloqueiam dupla marcação, mas têm naturezas diferentes.</p>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">🩺</span> Consulta (vinculada a paciente)</div>
      <p>Evento clínico com paciente, profissional, procedimento/especialidade e status do atendimento. É a base do prontuário, do faturamento e dos lembretes. Tudo o que descrevemos na seção <em>Agenda &amp; Agendamento</em> trata desse tipo.</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">📌</span> Compromisso (bloco interno)</div>
      <p>Bloco de tempo <strong>sem paciente</strong>: reunião de equipe, manutenção de equipamento, treinamento, almoço estendido, deslocamento entre unidades. Reserva a agenda do profissional ou da sala sem gerar prontuário nem cobrança.</p>
    </div>
  </div>

  <h3>Recorrência e privacidade dos compromissos</h3>
  <p>Compromissos podem se repetir e ter visibilidade controlada — útil para reuniões semanais, manutenção mensal de aparelhos ou agendas pessoais que outros profissionais não precisam ver em detalhe.</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Atributo</th><th>Opções</th><th>Comportamento</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Recorrência</td><td>Diária, Semanal, Quinzenal, Mensal, Anual</td><td>Gera a série de ocorrências; editar uma instância não afeta as demais salvo escolha explícita "toda a série".</td></tr>
        <tr><td class="td-bold">Privacidade</td><td>Público / Privado</td><td>Público: título e descrição visíveis a todos. Privado: aparece para outros profissionais apenas como <em>"Compromisso privado"</em> — bloco de tempo visível, conteúdo ofuscado.</td></tr>
        <tr><td class="td-bold">Escopo</td><td>Profissional, Sala, Equipamento</td><td>Reserva o recurso correspondente; a busca de horário livre passa a considerá-lo ocupado.</td></tr>
      </tbody>
    </table>
  </div>
  <div class="alert alert-amber">
    <span class="alert-icon">⛔</span>
    <div class="alert-body">
      <div class="alert-title">Compromisso bloqueia consulta — regra geral (jul/2026)</div>
      <p><strong>Todo</strong> compromisso (<code>internal-event</code>) — timed ou dia inteiro, público ou privado, independente de <code>availability</code> — impede criar ou mover consultas no intervalo sobreposto. A API valida em create/update de appointment e exclui o intervalo em <code>GET /v1/available-slots</code>. No calendário ERP, <code>isSlotBlockedByCommitment</code> aplica a mesma regra.</p>
    </div>
  </div>
  <div class="alert alert-blue">
    <span class="alert-icon">🔒</span>
    <div class="alert-body">
      <div class="alert-title">Privacidade preserva o tempo, não o conteúdo</div>
      <p>Um compromisso privado continua ocupando o slot para fins de cálculo de disponibilidade e prevenção de overbooking. O que se oculta é apenas o detalhe (título, descrição, participantes), nunca a existência do bloco.</p>
    </div>
  </div>

  <h2>Categorias de consulta com cor</h2>
  <p>Consultas podem ser classificadas por categoria visual, permitindo ler a grade em segundos. Entidade própria na API: <code>appointment-categories</code> (distinta de <code>patient-categories</code> do cadastro). No <code>GET</code> da listagem, a API espelha categorias de paciente ainda ausentes — o sheet e Configurações → Categoria → aba Agendamento ficam alinhados sem seed manual.</p>
  <div class="card-grid">
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🎨</span> CRUD com cor</div>
      <p>Criar, editar e remover categorias, cada uma com nome e cor. A cor é aplicada à barra/borda do evento na grade. Edição inline direto na lista de categorias, sem modal pesado.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🚫</span> Exclusão protegida</div>
      <p>Categoria com consultas vinculadas <strong>não pode ser excluída</strong> — a tentativa retorna bloqueio <code>409 Conflict</code> com mensagem orientando a reatribuir as consultas antes. Preserva a integridade histórica.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🔑</span> Único por clínica</div>
      <p>O nome da categoria é único dentro da clínica (tenant). Evita duplicatas ("Retorno" e "retorno") e mantém relatórios por categoria consistentes entre especialidades.</p>
    </div>
  </div>

  <h2>Buscar horário livre</h2>
  <p>O sistema calcula os slots realmente disponíveis cruzando as restrições de agenda. O resultado alimenta tanto o agendamento manual quanto a ação "buscar próximo horário disponível".</p>
  <div class="mermaid">
flowchart LR
  Func["Janela de funcionamento da clínica"] --> Inter
  Prof["Horário do profissional"] --> Inter
  Inter["∩ Interseção"] --> Sub
  Almoco["− Almoço"] --> Sub
  Ocup["− Eventos ocupados<br/>(consultas + compromissos)"] --> Sub
  Sub["Subtração"] --> Livres["Slots livres"]
  </div>
  <ul>
    <li><strong>Fórmula:</strong> janela de funcionamento da clínica ∩ horário do profissional − almoço − eventos ocupados.</li>
    <li>Eventos ocupados incluem consultas e <strong>todos</strong> os compromissos (públicos ou privados), além de bloqueios e reservas de sala/equipamento.</li>
    <li>A ferramenta <strong>"buscar próximo horário disponível"</strong> varre os dias seguintes e retorna slots via <code>GET /v1/available-slots</code>; o step entre inícios segue a <strong>duração</strong> do procedimento (mín. 15&nbsp;min), evitando opções sobrepostas.</li>
    <li>No ERP, o modal agrupa em <strong>Manhã</strong> (início &lt; 12:00) e <strong>Tarde</strong> (início ≥ 14:00); slots entre 12:00 e 13:59 não são exibidos (intervalo de almoço na UI).</li>
    <li>Respeita a duração do procedimento: um slot só é ofertado se houver janela contígua suficiente.</li>
  </ul>

  <h2>Encaixe — fila de espera priorizada</h2>
  <p>Quando não há vaga no horário desejado, o paciente entra na <strong>fila de encaixe</strong> em vez de ser simplesmente recusado. A fila é ordenada por prioridade e revisitada sempre que um horário se abre.</p>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">⚡</span> Ordenação</div>
      <p>Urgentes primeiro, depois os mais antigos na fila (FIFO entre mesma prioridade). Casos urgentes sobem ao topo independentemente da data de entrada.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">🕑</span> Preferências de turno</div>
      <p>Manhã, tarde ou qualquer turno; opção <em>"qualquer data"</em> para pacientes flexíveis que aceitam a primeira vaga que surgir.</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">📝</span> Contexto livre</div>
      <p>Plano de tratamento pretendido e observações em texto livre, para que a recepção saiba o que agendar quando a vaga abrir.</p>
    </div>
  </div>

  <h3>Ação "Agendar" a partir do encaixe</h3>
  <ul>
    <li>O botão <strong>"Agendar"</strong> abre o formulário de consulta <strong>pré-preenchido</strong> com paciente, plano e observações do encaixe.</li>
    <li>Ao concluir o agendamento, o encaixe é <strong>marcado como agendado automaticamente</strong> — sem dupla digitação.</li>
    <li>Se a recepção criar uma consulta para um paciente que <strong>já possui encaixe pendente</strong>, o sistema <strong>notifica</strong> o operador para evitar agendar duas vezes ou para fechar o encaixe.</li>
  </ul>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Status do encaixe</th><th>Significado</th><th>Histórico</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Pendente</td><td>Aguardando vaga na fila priorizada.</td><td>Ativo na fila</td></tr>
        <tr><td class="td-bold">Agendado</td><td>Consulta criada a partir do encaixe.</td><td>Preservado (não some)</td></tr>
        <tr><td class="td-bold">Cancelado</td><td>Paciente desistiu ou encaixe expirou.</td><td>Preservado para auditoria</td></tr>
      </tbody>
    </table>
  </div>
  <div class="alert alert-cyan">
    <span class="alert-icon">📦</span>
    <div class="alert-body">
      <div class="alert-title">Histórico preservado</div>
      <p>Encaixes agendados ou cancelados não são apagados: saem da fila ativa mas permanecem no histórico, permitindo medir demanda reprimida por especialidade e tempo médio de espera.</p>
    </div>
  </div>

  <h2>Alerta de retorno</h2>
  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Integrado na API — ficha do paciente + agenda (jul/2026)</div>
      <p><strong>Ficha:</strong> <code>patient-return-alerts-popover.tsx</code> + <code>patient-return-alert-form-dialog.tsx</code> no cabeçalho (<code>/clinic/pacientes/[id]/sobre</code>) — popover 672×301; CRUD via <code>/v1/return-alerts?patientId=</code>; opções 1/6/12 meses ou data personalizada (<code>compute-patient-return-date.ts</code>); menu ⋮ com <strong>Agendar</strong> e Excluir.<br>
      <strong>Agenda:</strong> <code>return-alert-popover.tsx</code> no cabeçalho — badge e lista filtram retornos da <strong>semana corrente</strong> (seg–dom) nas visões dia/semana; visão mês agrupa por semana.<br>
      <strong>Ciclo Agendar:</strong> <code>build-return-alert-scheduling-intent.ts</code> + <code>scheduling-sheet-intent.ts</code> navegam para <code>/clinic/agenda</code> com paciente/categoria/data pré-carregados; ao criar consulta com <code>returnAlertId</code>, o alerta é removido automaticamente.</p>
    </div>
  </div>
  <p>O alerta de retorno garante que pacientes que precisam voltar não sejam esquecidos. Ele pode nascer automaticamente de uma consulta ou ser criado à mão, e o backend é a fonte da verdade da data.</p>
  <div class="card-grid">
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">🔄</span> Ciclo automático</div>
      <p>Quando uma consulta define uma <strong>data de retorno</strong>, o sistema <strong>cria, atualiza ou remove</strong> automaticamente o alerta correspondente conforme a consulta muda. Também é possível criar um alerta manualmente.</p>
    </div>
    <div class="card card-rose">
      <div class="card-title"><span class="card-icon">🏷️</span> Badge no paciente</div>
      <p>Um <em>badge</em> no cabeçalho do prontuário sinaliza retorno pendente, visível para recepção e profissional ao abrir a ficha.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🔎</span> Filtros e ação</div>
      <p>Lista de retornos filtrável por período. A ação <strong>"Agendar"</strong> abre o formulário pré-preenchido, fechando o ciclo de volta para a agenda.</p>
    </div>
  </div>

  <h3>Opções de data de retorno</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Opção</th><th>Cálculo</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">1 mês</td><td>Data da consulta + 1 mês</td></tr>
        <tr><td class="td-bold">6 meses</td><td>Data da consulta + 6 meses</td></tr>
        <tr><td class="td-bold">12 meses</td><td>Data da consulta + 12 meses</td></tr>
        <tr><td class="td-bold">Personalizada</td><td>Data escolhida manualmente pelo profissional</td></tr>
      </tbody>
    </table>
  </div>
  <div class="alert alert-amber">
    <span class="alert-icon">🧮</span>
    <div class="alert-body">
      <div class="alert-title">Backend recalcula a data (fonte da verdade)</div>
      <p>O frontend envia a opção (1/6/12 meses ou data personalizada); o <strong>backend recalcula e persiste a data + o motivo</strong> do retorno. Isso evita divergências de fuso/calendário entre clientes e mantém a data canônica única.</p>
    </div>
  </div>

  <h2>Os 8 status de consulta</h2>
  <p>Para contexto, o ciclo de vida de uma consulta percorre oito status — relevantes para a fila de encaixe (libera vaga em cancelamentos/faltas) e para os alertas de retorno (gerados ao finalizar).</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Status</th><th>Quando ocorre</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Agendado</td><td>Consulta criada, ainda não confirmada.</td></tr>
        <tr><td class="td-bold">Confirmado</td><td>Paciente confirmou presença.</td></tr>
        <tr><td class="td-bold">Em atendimento</td><td>Profissional iniciou a consulta.</td></tr>
        <tr><td class="td-bold">Paciente aguardando</td><td>Check-in feito; paciente na sala de espera.</td></tr>
        <tr><td class="td-bold">Finalizado</td><td>Atendimento concluído; pode gerar alerta de retorno.</td></tr>
        <tr><td class="td-bold">Faltou</td><td>Paciente não compareceu; libera vaga para encaixe.</td></tr>
        <tr><td class="td-bold">Cancelado pelo paciente</td><td>Cancelamento de iniciativa do paciente; libera vaga.</td></tr>
        <tr><td class="td-bold">Cancelado pelo profissional</td><td>Cancelamento de iniciativa da clínica; libera vaga.</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Entidades de dados (schema_clinic)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Entidade</th><th>Campos Principais</th><th>Relações</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>Appointment</code></td><td>storeId, patientId, professionalId, categoryId, slot, status, returnDate, returnReason</td><td>Patient, Staff, AppointmentCategory, ReturnAlert</td></tr>
        <tr><td class="td-bold"><code>AppointmentCategory</code></td><td>storeId, name (único), color</td><td>Appointment</td></tr>
        <tr><td class="td-bold"><code>InternalEvent</code> (Compromisso)</td><td>storeId, professionalId, title, startAt, endAt, recurrence, visibility (public/private)</td><td>Staff, Room, Equipment</td></tr>
        <tr><td class="td-bold"><code>FitIn</code> (Encaixe)</td><td>storeId, patientId, priority, shift, anyDate, plan, notes, status</td><td>Patient, Appointment</td></tr>
        <tr><td class="td-bold"><code>ReturnAlert</code> (Alerta de retorno)</td><td>storeId, patientId, appointmentId, dueDate, reason, source (auto/manual)</td><td>Patient, Appointment</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Proposta de implementação</h2>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Encaixe e retorno como fechamento de ciclo</div>
    <ul>
      <li>Recalcular a fila de encaixe a cada cancelamento, falta ou abertura de slot, sugerindo proativamente o próximo paciente elegível por turno e prioridade.</li>
      <li>Disparar notificação à recepção quando uma consulta nova colidir com encaixe pendente do mesmo paciente.</li>
      <li>Centralizar no backend o cálculo da data de retorno (1/6/12 meses ou personalizada), persistindo data + motivo como fonte única da verdade.</li>
      <li>Sincronizar o ciclo de vida do <code>ReturnAlert</code> com a consulta de origem: criar ao definir data, atualizar ao mudar, remover ao limpar.</li>
      <li>Tratar compromissos de forma uniforme no cálculo de disponibilidade: <strong>todo</strong> compromisso bloqueia consultas no overlap; privado ofusca apenas o conteúdo.</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Categorias e busca de horário</div>
    <ul>
      <li>Editar categorias inline com seletor de cor; impedir exclusão de categorias em uso com bloqueio <code>409</code> e mensagem acionável.</li>
      <li>Expor "buscar próximo horário disponível" respeitando a duração do procedimento e todas as restrições (funcionamento, agenda, almoço, ocupados).</li>
    </ul>
  </div>
</div>
`
});
