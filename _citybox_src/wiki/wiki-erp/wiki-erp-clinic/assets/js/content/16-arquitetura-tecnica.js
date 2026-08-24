WIKI.register({
  id: 'arquitetura-tecnica',
  title: 'Arquitetura Técnica',
  icon: '🏗️',
  searchText: 'arquitetura tecnica vertical clinic hub spoke schema postgres clinica clinica-api NestJS 3172 ERP Next.js 3107 proxy bff clinica CatalogItemType CLINIC ClinicStoreProfile ClinicPlan ClinicPlanSpecialty ClinicPlanTreatment ProfessionalServiceHours service-hours team platform-api Patient Appointment WaitingRoom MedicalRecord RecordEntry Prescription Procedure InsurancePlan InsuranceGuide TISSBatch FinancialTransaction StockItem Staff SalesFunnel SalesOpportunity sortOrder reorder labels CRM vendas MinIO clean architecture use case fluxo dados consulta paga realtime WebSocket Redis outbox RabbitMQ store-setup clinic.store-setup ClinicStore ClinicStoreSetup worker main-worker Harmonização Facial HOF',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Técnico e Conformidade</div>
    <h1 class="section-title">🏗️ Arquitetura Técnica</h1>
    <p class="section-subtitle">A Vertical Clinic é um spoke independente no modelo Hub &amp; Spoke do CityBox, seguindo o mesmo padrão da Vertical Food. API NestJS em <code>apps/verticals/clinica/api</code>, schema PostgreSQL <code>clinica</code>, proxy BFF no ERP e frontend Next.js em <code>apps/erp</code> (<code>/clinic</code>).</p>
    <div class="section-tags">
      <span class="tag-cyan">clinica-api :3172</span>
      <span class="tag-teal">schema clinica</span>
      <span class="tag-sky">proxy /api/proxy/clinica</span>
      <span class="tag-sky">CLINIC CatalogItemType</span>
      <span class="tag-gray">apps/verticals/clinica/api</span>
    </div>
  </div>

  <h2>15.1 Posição na plataforma</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Configuração</th><th>Valor</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Package API</td><td><code>@citybox/clinica-api</code></td></tr>
        <tr><td class="td-bold">Caminho API</td><td><code>apps/verticals/clinica/api</code></td></tr>
        <tr><td class="td-bold">Porta API</td><td><code>3172</code> (prefixo global <code>/api</code>)</td></tr>
        <tr><td class="td-bold">Porta Web (ERP)</td><td><code>3107</code> (módulo <code>clinic</code> em <code>apps/erp</code>)</td></tr>
        <tr><td class="td-bold">Proxy BFF ERP</td><td><code>/api/proxy/clinica/*</code> → <code>CLINICA_API_URL</code>, injeta JWT + <code>X-Store-Id</code></td></tr>
        <tr><td class="td-bold">Schema PostgreSQL</td><td><code>clinica</code> (banco <code>citybox</code> / ADR C-15, Prisma multi-schema)</td></tr>
        <tr><td class="td-bold">CatalogItemType</td><td><code>CLINIC</code></td></tr>
        <tr><td class="td-bold">Módulo ERP</td><td><code>apps/erp/src/features/clinic/</code></td></tr>
        <tr><td class="td-bold">Permissão settings</td><td><code>store.clinic.settings.manage</code></td></tr>
        <tr><td class="td-bold">Evento de oferta</td><td><code>aplopes.clinic.offer.published.v1</code> (futuro)</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Módulos ativos na clinica-api (jun–jul/2026)</div>
      <p><strong>store-setup</strong> (worker RabbitMQ first-contact) · <strong>clinic-profile</strong> · <strong>clinic-plans</strong> · <strong>anamnesis</strong> · <strong>contract-models</strong> · <strong>team-service-hours</strong> · <strong>patients</strong> · <strong>scheduling</strong> · <strong>stock</strong> · <strong>financial</strong> · <strong>commissions</strong> · <strong>sales</strong> (CRM) · <strong>marketing</strong> (<code>form_lead</code> + <code>aniversario</code>) · <strong>dashboard</strong> · <strong>reports</strong> · <strong>whatsapp</strong> (Baileys MVP + processo <code>main-whatsapp</code> + filas <code>clinic.whatsapp-send</code>/<code>clinic.whatsapp-session</code>). Arquitetura clean: domain → use cases → Prisma → HTTP routes. Testes Jest com repositórios in-memory.</p>
      <p><strong>ERP / clinica-web (jul–ago/2026):</strong> pacientes, Agenda, Estoque, Financeiro/Comissões, Vendas/CRM, Marketing (<code>form_lead</code> + Aniversariantes WhatsApp + <strong>Indicações</strong>) e Configurações WhatsApp (QR/templates) integrados. Em Novo orçamento, tratamento da especialidade <strong>Harmonização Facial</strong> abre a aba HOF do odontograma automaticamente. <code>DataTable</code> usa <code>manualPagination</code> nas listagens server-side.</p>
    </div>
  </div>

  <h2>15.2 Schema implementado (clinica)</h2>
  <p>Entidades no schema <code>clinica</code>: pacientes/orçamentos/tratamentos/anamnese/financeiro/documentos/arquivos, agenda, estoque, CRM (<code>SalesFunnel</code>, <code>SalesOpportunity</code> com <code>budgetId</code>/<code>origin=budget</code>), Marketing (<code>Campaign</code>, <code>CampaignSubmission</code>), WhatsApp e pacotes de assinatura (<code>SignaturePackageRequest</code>, <code>SignatureCreditBalance</code>). PEP avançado / TISS permanecem blueprint.</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Entidade</th><th>Status</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>ClinicStore</code> / <code>ClinicStoreSetup</code></td><td><span class="status-badge status-functional">✅ Ativo</span></td><td>Espelho da loja platform + log de versão do seed first-contact (worker <code>clinic.store-setup</code>)</td></tr>
        <tr><td class="td-bold"><code>ClinicStoreProfile</code></td><td><span class="status-badge status-functional">✅ Ativo</span></td><td>Perfil da unidade: dados cadastrais, endereço, horários, logo (object key MinIO)</td></tr>
        <tr><td class="td-bold"><code>ClinicPlan</code></td><td><span class="status-badge status-functional">✅ Ativo</span></td><td>Plano/tabela de preço: nome, status, <code>isDefault</code>, <code>treatmentInit</code></td></tr>
        <tr><td class="td-bold"><code>ClinicPlanSpecialty</code></td><td><span class="status-badge status-functional">✅ Ativo</span></td><td>Especialidade dentro do plano (ex.: Odontologia, Fisioterapia)</td></tr>
        <tr><td class="td-bold"><code>ClinicPlanTreatment</code></td><td><span class="status-badge status-functional">✅ Ativo</span></td><td>Tratamento/serviço: nome, <code>valueCents</code>, <code>costCents</code>, <code>enabled</code></td></tr>
        <tr><td class="td-bold"><code>ProfessionalServiceHours</code></td><td><span class="status-badge status-functional">✅ Ativo</span></td><td>Horários de atendimento por membro da loja</td></tr>
        <tr><td class="td-bold"><code>PatientCategory</code></td><td><span class="status-badge status-functional">✅ Ativo</span></td><td>Categoria de paciente (nome, cor, <code>isProtected</code>); seed <em>Particular</em></td></tr>
        <tr><td class="td-bold"><code>Patient</code></td><td><span class="status-badge status-functional">✅ Ativo</span></td><td>Cadastro store-scoped: dados pessoais, convênio embutido, responsável legal, foto MinIO</td></tr>
        <tr><td class="td-bold"><code>Budget</code> / <code>BudgetItem</code></td><td><span class="status-badge status-functional">✅ Ativo</span></td><td>Orçamento ao paciente: itens, desconto, parcelamento, status; listagem paginada na API</td></tr>
        <tr><td class="td-bold"><code>PatientTreatment</code></td><td><span class="status-badge status-functional">✅ Ativo</span></td><td>Tratamento em execução (avulso ou materializado na aprovação do orçamento)</td></tr>
        <tr><td class="td-bold"><code>TreatmentEvolution</code></td><td><span class="status-badge status-functional">✅ Ativo</span></td><td>Evolução clínica (base CLIN-011); evoluções avulsas na Fase 1</td></tr>
        <tr><td class="td-bold"><code>AnamnesisTemplate</code> / <code>AnamnesisQuestion</code> / <code>AnamnesisTemplateQuestion</code></td><td><span class="status-badge status-functional">✅ Ativo</span></td><td>Biblioteca de modelos e perguntas (configurações); pivô com <code>active</code> e ordenação</td></tr>
        <tr><td class="td-bold"><code>PatientAnamnesis</code></td><td><span class="status-badge status-functional">✅ Ativo</span></td><td>Instância preenchida: snapshot JSON, <code>publicToken</code>, status, modos professional/patient; rotas públicas <code>@Public()</code></td></tr>
        <tr><td class="td-bold"><code>PatientFinancialEntry</code></td><td><span class="status-badge status-functional">✅ Legado → unificado</span></td><td>Substituído pelo ledger <code>FinancialEntry</code> (mesma tabela <code>financial_entries</code>); rotas da ficha adaptadas</td></tr>
        <tr><td class="td-bold"><code>FinancialAccount</code> / <code>FinancialCategory</code> / <code>FinancialEntry</code></td><td><span class="status-badge status-functional">✅ Ativo</span></td><td>Ledger global CLIN-060/061: <code>v1/financial/*</code>; listagem com <code>dateField</code>/<code>paidAt*</code>; <code>by-payment-method</code>; DELETE de liquidados permitido</td></tr>
        <tr><td class="td-bold"><code>SalesFunnel</code> / <code>SalesFunnelStage</code></td><td><span class="status-badge status-functional">✅ Ativo</span></td><td>Funil CRM; etapas <code>others</code>/<code>won</code>/<code>lost</code> (order 998/999 fixos); UNIQUE <code>(funnel_id, order)</code> — save em 2 fases</td></tr>
        <tr><td class="td-bold"><code>SalesOpportunity</code></td><td><span class="status-badge status-functional">✅ Ativo</span></td><td>Oportunidade no kanban; <code>sortOrder</code>; <code>budgetId</code>/<code>origin=budget</code> (sync orçamento); <code>PATCH /v1/opportunities/reorder</code></td></tr>
        <tr><td class="td-bold"><code>SalesOpportunityHistory</code> / <code>SalesLabel</code></td><td><span class="status-badge status-functional">✅ Ativo</span></td><td>Timeline append-only; rótulos coloridos por loja</td></tr>
        <tr><td class="td-bold"><code>Campaign</code> / <code>CampaignSubmission</code></td><td><span class="status-badge status-functional">✅ Ativo</span></td><td>Marketing: <code>form_lead</code> (PAGE) + <code>aniversario</code> (BROADCAST WhatsApp); content JSON Zod</td></tr>
        <tr><td class="td-bold"><code>WhatsappSession</code> / <code>WhatsappMessage</code> / templates</td><td><span class="status-badge status-functional">✅ MVP</span></td><td>Baileys multi-loja; filas RabbitMQ; confirmação/lembrete agenda + birthday</td></tr>
      </tbody>
    </table>
  </div>

  <h2>15.2.1 Schema planejado (blueprint)</h2>
  <p>Entidades centrais do domínio clínica previstas para fases futuras. Comunicação com o Core via eventos RabbitMQ e chamadas HTTP à payments-api e fiscal-api.</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Entidade</th><th>Status</th><th>Descrição Principal</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>Appointment</code></td><td><span class="status-badge status-proposed">💡 Blueprint</span></td><td>Agendamento: storeId, patientId, professionalId, procedureId, slot, status</td></tr>
        <tr><td class="td-bold"><code>WaitingRoom</code></td><td><span class="status-badge status-proposed">💡 Blueprint</span></td><td>Estado em tempo real da fila — projetado em Redis para WebSocket</td></tr>
        <tr><td class="td-bold"><code>MedicalRecord</code></td><td><span class="status-badge status-proposed">💡 Blueprint</span></td><td>Prontuário: patientId, professionalId, createdAt, signed (bool)</td></tr>
        <tr><td class="td-bold"><code>RecordEntry</code></td><td><span class="status-badge status-proposed">💡 Blueprint</span></td><td>Evolução SOAP: texto, CID-10, assinatura digital, timestamp imutável</td></tr>
        <tr><td class="td-bold"><code>Prescription</code></td><td><span class="status-badge status-proposed">💡 Blueprint</span></td><td>Receita médica: itens, tipo (simples/controle especial), QR code</td></tr>
        <tr><td class="td-bold"><code>Procedure</code></td><td><span class="status-badge status-proposed">💡 Blueprint</span></td><td>Catálogo de procedimentos: código TUSS, duração, valor particular</td></tr>
        <tr><td class="td-bold"><code>ProcedurePlan</code></td><td><span class="status-badge status-proposed">💡 Blueprint</span></td><td>Plano de tratamento odontológico: procedimentos por dente</td></tr>
        <tr><td class="td-bold"><code>InsurancePlan</code></td><td><span class="status-badge status-proposed">💡 Blueprint</span></td><td>Convênio: operadora, plano, tabela de preços TUSS</td></tr>
        <tr><td class="td-bold"><code>InsuranceGuide</code></td><td><span class="status-badge status-proposed">💡 Blueprint</span></td><td>Guia autorizada: número, saldo de sessões, validade</td></tr>
        <tr><td class="td-bold"><code>TISSBatch</code></td><td><span class="status-badge status-proposed">💡 Blueprint</span></td><td>Lote TISS para envio à operadora: status, XML, protocolo</td></tr>
        <tr><td class="td-bold"><code>FinancialTransaction</code></td><td><span class="status-badge status-proposed">💡 Blueprint</span></td><td>Cobrança: appointmentId, valor, forma, status (local ao clinic)</td></tr>
        <tr><td class="td-bold"><code>StockItem</code></td><td><span class="status-badge status-proposed">💡 Blueprint</span></td><td>Insumo em estoque: produto, quantidade, lote, validade</td></tr>
        <tr><td class="td-bold"><code>Staff</code></td><td><span class="status-badge status-proposed">💡 Blueprint</span></td><td>Profissional da clínica: CRM/CRO, especialidade, comissão (%)</td></tr>
      </tbody>
    </table>
  </div>

  <h3>15.2.2 API em produção — horários de atendimento</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método</th><th>Rota</th><th>Escopo</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">GET</td><td><code>/api/v1/team/:memberId/service-hours</code></td><td><code>X-Store-Id</code> + permissão <code>store.clinic.settings.manage</code></td></tr>
        <tr><td class="td-bold">PUT</td><td><code>/api/v1/team/:memberId/service-hours</code></td><td>Upsert <code>ServiceHoursConfig</code> (validação Zod)</td></tr>
      </tbody>
    </table>
  </div>
  <p>Equipe (CRUD) permanece na <strong>platform-api</strong> (<code>:3103</code>). Swagger local: <code>http://localhost:3172/api/v1/docs</code>.</p>

  <h2>15.2.3 Fluxo BFF ERP → clinica-api</h2>
  <div class="mermaid">
sequenceDiagram
  participant Browser as ERP Browser
  participant BFF as /api/proxy/clinica
  participant Auth as auth-server.ts
  participant API as clinica-api :3172
  participant DB as Postgres clinica
  participant S3 as MinIO

  Browser->>BFF: clinicaFetch(storeId, /v1/...)
  BFF->>Auth: resolveAccessTokenForBff
  Auth-->>BFF: JWT + cookies
  BFF->>BFF: assertUserCanAccessStore(storeId)
  BFF->>API: Authorization Bearer + X-Store-Id
  API->>API: AuthGuard + PermissionGuard
  API->>DB: Prisma (… / SalesFunnel* / SalesOpportunity / Stock* / Appointment* / …)
  API->>S3: logo + foto paciente (quando aplicável)
  API-->>BFF: { data: ... }
  BFF-->>Browser: JSON
  </div>

  <h3>15.2.4 Fluxo BFF público — anamnese do paciente</h3>
  <div class="mermaid">
sequenceDiagram
  participant Pac as Paciente (mobile)
  participant PubBFF as /api/public/clinic/anamnesis
  participant API as clinica-api @Public
  participant DB as Postgres clinica

  Pac->>PubBFF: GET /[token]
  PubBFF->>API: GET /v1/public/anamnesis/:token
  API->>DB: PatientAnamnesis + snapshot template
  API-->>PubBFF: formulário + perguntas
  PubBFF-->>Pac: JSON
  Pac->>PubBFF: PATCH respostas + consentimento
  PubBFF->>API: PATCH /v1/public/anamnesis/:token
  alt válido
    API->>DB: answers snapshot + status issued
    API-->>Pac: 200 sucesso
  else expirado / já respondida
    API-->>Pac: 410 / 409
  end
  </div>

  <h2>15.3 Fluxo de dados crítico — consulta paga</h2>
  <div class="mermaid">
sequenceDiagram
  participant MktBFF as Marketplace BFF
  participant ClinicAPI as clinica-api :3172
  participant NotifAPI as notifications-api
  participant Redis as Redis (WaitingRoom)
  participant RTC as realtime-gateway :3104
  participant PayAPI as payments-api :3106
  participant FiscalAPI as fiscal-api
  participant Workers as workers :3105

  MktBFF->>ClinicAPI: 1. Paciente agenda (POST /appointments)
  ClinicAPI-->>ClinicAPI: Cria Appointment (SCHEDULED)
  ClinicAPI->>NotifAPI: Evento appointment.created → WhatsApp confirmação
  Note over ClinicAPI: 2. Recepcionista faz check-in
  ClinicAPI->>Redis: WaitingRoom card → CHECKED_IN
  Redis->>RTC: Push WebSocket → sala de espera atualiza
  Note over ClinicAPI: 3. Profissional inicia
  ClinicAPI->>Redis: Status → EM_ATENDIMENTO
  Note over ClinicAPI: 4. Profissional encerra
  ClinicAPI-->>ClinicAPI: RecordEntry + assinatura digital (FINALIZADO)
  Note over ClinicAPI: 5. Recepcionista cobra
  ClinicAPI->>PayAPI: POST /charges (valor, forma)
  PayAPI-->>ClinicAPI: Webhook payment.captured
  ClinicAPI->>FiscalAPI: Emite NFS-e
  ClinicAPI->>Workers: Evento payment.captured → indexação Typesense
  </div>

  <h2>15.4 Realtime (WebSocket)</h2>
  <p>A sala de espera e o status da agenda são eventos de tempo real. O <code>realtime-gateway</code> (porta 3104) gerencia conexões WebSocket e o Redis publica eventos por canal de loja:</p>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">🖥️</span> Monitor da Recepção</div>
      <p>Kanban de sala de espera em tempo real. Qualquer mudança de status reflete em menos de 500ms em todos os clientes conectados.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">📱</span> App do Profissional</div>
      <p>Notificação push quando o próximo paciente está pronto. Status da agenda em tempo real sem precisar recarregar.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">📺</span> Painel de TV</div>
      <p>Display público na sala de espera chamando paciente por nome/senha. Conectado via WebSocket — zero polling.</p>
    </div>
  </div>

  <h2>Dependências de infraestrutura</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Serviço</th><th>Uso na Clinic</th><th>Port</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Postgres (schema clinica)</td><td>Dados transacionais da clínica — perfil, planos, horários da equipe (hoje)</td><td>5432</td></tr>
        <tr><td class="td-bold">MinIO</td><td>Logotipo da clínica + <strong>fotos de pacientes</strong> (<code>{storeId}/patients/{id}.ext</code>); documentos clínicos e radiografias (futuro) — bucket <code>citybox-clinica</code></td><td>9000</td></tr>
        <tr><td class="td-bold">Redis</td><td>WaitingRoom, sessão de caixa em tempo real (futuro)</td><td>6379</td></tr>
        <tr><td class="td-bold">RabbitMQ</td><td>Outbox de eventos (appointment, payment — futuro)</td><td>5672</td></tr>
        <tr><td class="td-bold">Keycloak</td><td>SSO + RBAC JWT (<code>store.clinic.settings.manage</code>) + convite de profissionais</td><td>8080</td></tr>
        <tr><td class="td-bold">payments-api</td><td>Cobrança, PIX, cartão, split de comissão</td><td>3106</td></tr>
        <tr><td class="td-bold">notifications-api</td><td>WhatsApp, SMS, e-mail, push</td><td>interno</td></tr>
        <tr><td class="td-bold">fiscal-api</td><td>NFS-e automática pós-pagamento</td><td>interno</td></tr>
        <tr><td class="td-bold">realtime-gateway</td><td>WebSocket sala de espera, painel de TV</td><td>3104</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
