WIKI.register({
  id: 'agenda-slots',
  title: 'Agenda e Slots',
  icon: '📅',
  searchText: 'agenda slots agendamento profissionais recursos horarios disponibilidade noshow encaixe beauty clinic services hospitality rental education',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Catálogo e Operação</div>
    <h1 class="section-title">📅 Agenda e Slots</h1>
    <p class="section-subtitle">Módulo de agendamento para verticais de serviço — gestão de profissionais, recursos e horários disponíveis, com regras de confirmação, encaixe, no-show e bloqueios. Aplicável a Beauty, Clinic, Services, Hospitality, Rental, Education e Events.</p>
    <div class="section-tags">
      <span class="tag-purple">Eixo Serviço</span>
      <span class="tag-amber">Agenda · Slots</span>
      <span class="tag-gray">Beauty · Clinic · Services · Hospitality · Rental</span>
    </div>
  </div>

  <div class="alert alert-orange">
    <span class="alert-icon">⚡</span>
    <div class="alert-body">
      <div class="alert-title">Módulo crítico ausente — cobre 7 das 12 verticais</div>
      <p>Mais da metade das verticais do Citybox são baseadas em agendamento, não em pedidos/delivery. Sem este módulo, Beauty, Clinic, Services, Hospitality, Rental, Education e Events não têm operação viável. <span class="tag-p1">P1</span></p>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Schema do core tem entidade <code>Slot</code> básica (sem gestão via ERP)</li>
      <li>Nenhuma vertical além de Food tem API implementada</li>
      <li>Sem tela de agenda no ERP</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Calendário visual (semana/dia) com slots por profissional ou recurso</li>
      <li>Agendamento pelo cliente via marketplace ou link compartilhável</li>
      <li>Confirmação automática ou manual (com aprovação do lojista)</li>
      <li>Encaixe: slot de urgência entre dois agendados</li>
      <li>Bloqueios: folga, férias, manutenção de equipamento</li>
      <li>Lembretes automáticos: WhatsApp/SMS/e-mail 24h e 1h antes</li>
      <li>No-show: marcar falta e cobrar taxa se configurado</li>
      <li>Lista de espera: cliente entra na fila para próxima disponibilidade</li>
    </ul>
  </div>

  <h2>Entidades do domínio de agenda</h2>
  <div class="mermaid">
flowchart TB
  Store["🏪 Loja"]

  subgraph recursos [Recursos Agendáveis]
    Prof["Professional\n(pessoa)"]
    Res["Resource\n(sala, equipamento, quarto)"]
  end

  subgraph agenda [Agenda]
    Avail["Availability\n(janelas de atendimento)"]
    Block["AvailabilityBlock\n(bloqueios / folgas)"]
    Slot["Slot\n(horário disponível)"]
    Appt["Appointment\n(agendamento confirmado)"]
  end

  Customer["👤 Cliente"]

  Store --> Prof
  Store --> Res
  Prof --> Avail --> Slot
  Res --> Avail
  Avail --> Block
  Customer -->|"reserva"| Appt
  Slot --> Appt
  </div>

  <h2>Modelo de dados</h2>
  <pre>// Disponibilidade de um profissional/recurso
model Availability {
  id           String   @id @default(cuid())
  storeId      String
  resourceType ResourceType  // PROFESSIONAL | ROOM | EQUIPMENT | VEHICLE
  resourceId   String
  dayOfWeek    Int            // 0=dom, 1=seg ... 6=sab
  startTime    String         // "09:00"
  endTime      String         // "18:00"
  slotDuration Int            // duração em minutos (ex: 60)
  breakAfter   Int?           // intervalo após cada slot (ex: 10 min)
}

// Agendamento confirmado
model Appointment {
  id           String     @id @default(cuid())
  storeId      String
  customerId   String?
  resourceId   String
  serviceId    String     // CatalogItem do tipo SERVICE ou SLOT
  startAt      DateTime
  endAt        DateTime
  status       ApptStatus
  notes        String?
  reminders    Reminder[]
  noShowAt     DateTime?  // quando marcado como no-show
  cancelledAt  DateTime?
  cancelReason String?
}

enum ApptStatus {
  SCHEDULED CONFIRMED IN_SERVICE COMPLETED NO_SHOW CANCELLED
}</pre>

  <h2>Visão de agenda — calendário semanal</h2>
  <div class="mockup-container">
    <div class="mock-topbar"><span class="mock-logo" style="color:#fbbf24">📅 Agenda — Semana 21–27 Jun</span>
      <span style="margin-left:auto;font-size:12px;color:rgba(255,255,255,.6)">+ Novo agendamento</span>
    </div>
    <div class="mock-body" style="padding:0;overflow-x:auto;">
      <div style="display:grid;grid-template-columns:80px repeat(5,1fr);border-bottom:1px solid #e7e5e4;">
        <div style="padding:8px;background:#fef9f0;font-size:11px;color:#a8a29e"></div>
        <div style="padding:8px;text-align:center;font-size:12px;font-weight:600;background:#fef9f0">Seg 21</div>
        <div style="padding:8px;text-align:center;font-size:12px;font-weight:700;color:#d97706;background:#fffbeb">Ter 22 (hoje)</div>
        <div style="padding:8px;text-align:center;font-size:12px;font-weight:600;background:#fef9f0">Qua 23</div>
        <div style="padding:8px;text-align:center;font-size:12px;font-weight:600;background:#fef9f0">Qui 24</div>
        <div style="padding:8px;text-align:center;font-size:12px;font-weight:600;background:#fef9f0">Sex 25</div>
      </div>
      <div style="display:grid;grid-template-columns:80px repeat(5,1fr);">
        <div style="padding:6px 8px;font-size:11px;color:#a8a29e;border-right:1px solid #e7e5e4">09:00</div>
        <div style="padding:4px;border-right:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;">
          <div style="background:#ede9fe;border-left:3px solid #7c3aed;border-radius:4px;padding:4px 6px;font-size:11px;color:#5b21b6">Maria — Corte</div>
        </div>
        <div style="padding:4px;border-right:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;background:#fffbeb">
          <div style="background:#fef3c7;border-left:3px solid #d97706;border-radius:4px;padding:4px 6px;font-size:11px;color:#92400e">João — Escova</div>
        </div>
        <div style="padding:4px;border-right:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;"></div>
        <div style="padding:4px;border-right:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;"></div>
        <div style="padding:4px;border-bottom:1px solid #f3f4f6;"></div>
      </div>
      <div style="display:grid;grid-template-columns:80px repeat(5,1fr);">
        <div style="padding:6px 8px;font-size:11px;color:#a8a29e;border-right:1px solid #e7e5e4">10:00</div>
        <div style="padding:4px;border-right:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;"></div>
        <div style="padding:4px;border-right:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;background:#fffbeb">
          <div style="background:#dcfce7;border-left:3px solid #16a34a;border-radius:4px;padding:4px 6px;font-size:11px;color:#166534">Ana — Manicure</div>
        </div>
        <div style="padding:4px;border-right:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;">
          <div style="background:#dbeafe;border-left:3px solid #2563eb;border-radius:4px;padding:4px 6px;font-size:11px;color:#1e40af">Pedro — Barba</div>
        </div>
        <div style="padding:4px;border-right:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;"></div>
        <div style="padding:4px;border-bottom:1px solid #f3f4f6;"></div>
      </div>
    </div>
  </div>

  <h2>Aplicação por vertical</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Vertical</th><th>Recurso agendável</th><th>Duração típica</th><th>Confirmação</th></tr></thead>
      <tbody>
        <tr><td>Beauty</td><td>Profissional (cabelereiro, manicure)</td><td>30–120 min</td><td>Automática</td></tr>
        <tr><td>Clinic</td><td>Profissional (médico, dentista)</td><td>30–60 min</td><td>Manual (aprovação)</td></tr>
        <tr><td>Services</td><td>Técnico / equipe</td><td>1–4h</td><td>Manual + orçamento</td></tr>
        <tr><td>Hospitality</td><td>Quarto / apartamento</td><td>1+ noite</td><td>Manual ou automática</td></tr>
        <tr><td>Rental</td><td>Veículo / equipamento</td><td>1h–30 dias</td><td>Automática + caução</td></tr>
        <tr><td>Education</td><td>Turma / professor / sala</td><td>1–2h (aula)</td><td>Matrícula formal</td></tr>
        <tr><td>Events</td><td>Espaço / capacidade</td><td>Evento completo</td><td>Manual + contrato</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Fluxo de no-show e lista de espera</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">❌</span> No-show</div>
      <p>Cliente não comparece no horário. Operador marca como no-show. Se configurado, cobra taxa de cancelamento tardio via PSP.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">⏳</span> Lista de espera</div>
      <p>Horário sem disponibilidade → cliente entra na fila. Ao surgir cancelamento, sistema notifica o próximo da fila automaticamente.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🔀</span> Encaixe</div>
      <p>Operador vê "brechas" na agenda e pode encaixar um atendimento de menor duração entre dois agendamentos existentes.</p>
    </div>
  </div>
</div>
`
});
