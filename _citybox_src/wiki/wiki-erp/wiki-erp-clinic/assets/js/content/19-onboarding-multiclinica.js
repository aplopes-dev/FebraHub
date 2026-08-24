WIKI.register({
  id: 'onboarding-multiclinica',
  title: 'Onboarding & Estrutura Multi-Clínica',
  icon: '🏛️',
  searchText: 'onboarding multi-tenant multitenant multiclinica multi-clinica organizacao rede grupo clinica unidade equipe rls row-level-security postgres isolamento clinica-ativa x-active-clinic-id cnpj slug profissional proprietario admin seed idempotente planos tabela servicos crm funil anamnese catalogo medicamentos insumos jwt access-token refresh-token httponly xss permissoes rbac CASL clinica-permissions persona cargo aluno contador dentista_admin dentista gerente radiologia secretario vendedor fisioterapia estetica psicologia nutricao fonoaudiologia odontologia organization clinic user professional userclinicaccess store-setup clinic.store-setup citybox.store.created RabbitMQ ClinicStore ClinicStoreSetup first-contact Particular PLATFORM_API_URL wall-clock',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Introdução</div>
    <h1 class="section-title">🏛️ Onboarding &amp; Estrutura Multi-Clínica</h1>
    <p class="section-subtitle">Como uma rede de clínicas — de fisioterapia a estética, psicologia, nutrição, fonoaudiologia ou odontologia — é provisionada, isolada e organizada em camadas de tenant, acesso e permissões.</p>
    <div class="section-tags"><span class="tag-cyan">Multi-tenant</span><span class="tag-teal">RBAC</span><span class="tag-sky">Segurança</span></div>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">CityBox real (jul/2026) — first-contact ao criar loja Clínica</div>
      <p>No produto atual a hierarquia é <strong>Platform → Organization (cliente) → Store</strong> (Keycloak + <code>platform-api</code>). Ao criar uma loja com vertical <strong>Clínica</strong> no admin:</p>
      <ol>
        <li><code>platform-api</code> persiste a loja e seeda <strong>2 membros</strong> Keycloak (<code>gerente.demo</code> + <code>atendente.demo</code> por loja) <em>antes</em> de publicar o evento.</li>
        <li>Publica <code>citybox.store.created.v1</code> (RabbitMQ, exchange <code>citybox.events</code>).</li>
        <li>Worker da <code>clinica-api</code> (fila <code>clinic.store-setup</code>) espelha <code>ClinicStore</code> e aplica o template de seed idempotente (<code>ClinicStoreSetup</code>, versão do template).</li>
      </ol>
      <p><strong>Seed template v3 inclui:</strong> plano Particular (~17 especialidades / ~266 tratamentos, <code>sortOrder≥1</code>, <code>acceptsFaces</code>); 7 modelos de anamnese; contrato odontológico padrão; conta Caixa + categorias despesa/receita; categorias paciente e agenda; paciente demo + consulta amanhã <strong>09:00 wall-clock</strong> no <code>store_members.id</code> (gerente preferencial). Retry: <code>POST /v1/store-setup/:storeId/retry</code> (clinica) e <code>POST /v1/stores/:id/seed-clinic-demo-team</code> (platform).</p>
      <p><strong>Ops local:</strong> <code>RABBITMQ_URL</code> obrigatório no <code>.env</code> da clinica-api; <code>PLATFORM_API_URL</code> para o worker reforçar a equipe; saúde da fila: <code>clinic.store-setup</code> com <code>consumers=1</code>.</p>
    </div>
  </div>

  <h2>1. Hierarquia multi-tenant</h2>
  <p>A plataforma é organizada em três camadas. Uma <strong>Organização</strong> representa a rede ou grupo (a pessoa jurídica). Cada organização pode conter várias <strong>Clínicas</strong> (unidades físicas ou virtuais). Cada clínica tem sua <strong>equipe</strong> de profissionais e usuários. Praticamente toda entidade operacional — paciente, agendamento, orçamento, prontuário — referencia a <em>clínica ativa</em> no momento da operação.</p>

  <div class="mermaid">flowchart TD
  Org["🏢 Organização (rede/grupo)"] --> C1["🏥 Clínica A (unidade)"]
  Org --> C2["🏥 Clínica B (unidade)"]
  Org --> C3["🏥 Clínica C (unidade)"]
  C1 --> E1["👥 Equipe + Pacientes + Agenda"]
  C2 --> E2["👥 Equipe + Pacientes + Agenda"]
  C3 --> E3["👥 Equipe + Pacientes + Agenda"]</div>

  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">🔒</span> Isolamento por RLS</div>
      <p>O isolamento entre redes é garantido por <strong>Row-Level Security</strong> no Postgres, com política por <code>organizationId</code>. Uma organização nunca enxerga dados de outra, mesmo em caso de falha na camada de aplicação.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🎯</span> Escopo por clínica ativa</div>
      <p>Dentro de uma organização, o escopo operacional é dado pela <strong>clínica ativa</strong>, transmitida no cabeçalho <code>X-Active-Clinic-Id</code>. As consultas são filtradas pela unidade selecionada no topo da tela.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">🧩</span> Dois níveis de filtro</div>
      <p>RLS (organização) é a fronteira de segurança rígida; a clínica ativa é o filtro de contexto de trabalho. Juntos garantem que o usuário só vê a unidade onde está atuando.</p>
    </div>
  </div>

  <div class="alert alert-blue">
    <span class="alert-icon">ℹ️</span>
    <div class="alert-body">
      <div class="alert-title">Por que dois mecanismos?</div>
      <p>RLS protege contra vazamento entre tenants distintos (rede X não vê rede Y). A clínica ativa apenas organiza o trabalho dentro da mesma rede — um gestor pode alternar entre unidades sem reautenticar.</p>
    </div>
  </div>

  <h2>2. Fluxo de onboarding transacional</h2>
  <p>Ao criar a conta, todo o provisionamento ocorre em <strong>uma única transação</strong>: ou tudo é criado, ou nada é. Isso evita organizações órfãs ou clínicas sem proprietário.</p>

  <div class="table-wrap">
    <table>
      <thead><tr><th>Etapa</th><th>O que acontece</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Organização</td><td>Cria a <code>Organization</code> validando o <strong>CNPJ</strong> (formato e unicidade). É a raiz do tenant.</td></tr>
        <tr><td class="td-bold">Primeira clínica</td><td>Cria a <code>Clinic</code> inicial e gera um <strong>slug único</strong> (ex.: <code>clinica-vida-sp</code>) para URLs e identificação.</td></tr>
        <tr><td class="td-bold">Profissional dono</td><td>Cria o <code>Professional</code> proprietário, vinculado ao <code>User</code>, como <strong>admin com todas as permissões</strong>.</td></tr>
        <tr><td class="td-bold">Vínculo de acesso</td><td>Registra <code>UserClinicAccess</code> ligando o usuário à primeira clínica.</td></tr>
        <tr><td class="td-bold">Seed inicial</td><td>Insere dados padrão de forma <strong>idempotente</strong> (rodar duas vezes não duplica).</td></tr>
      </tbody>
    </table>
  </div>

  <div class="card-grid">
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">📋</span> Planos &amp; serviços</div>
      <p>Tabela de serviços padrão e planos de atendimento adaptados ao tipo de clínica (sessões de fisioterapia, protocolos de estética, pacotes nutricionais).</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🔄</span> Funis de CRM</div>
      <p>Funis iniciais de captação e conversão de pacientes (lead → avaliação → tratamento → fidelização).</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">📝</span> Modelos de anamnese</div>
      <p>Fichas de anamnese padrão por especialidade (avaliação postural, psicológica, alimentar, fonoaudiológica).</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">💊</span> Catálogo de insumos</div>
      <p>Catálogo base de medicamentos, materiais e insumos usados nos atendimentos da especialidade.</p>
    </div>
  </div>

  <div class="alert alert-amber">
    <span class="alert-icon">⏳</span>
    <div class="alert-body">
      <div class="alert-title">Tela de configuração não-fechável</div>
      <p>Enquanto o provisionamento ocorre, o usuário vê uma tela de configuração inicial <strong>que não pode ser fechada</strong>. Isso impede o acesso ao sistema antes de a clínica estar pronta e consistente.</p>
    </div>
  </div>

  <h2>3. Acesso multi-clínica</h2>
  <p>Um mesmo usuário pode atuar em <strong>várias clínicas</strong>. Essa relação é uma junção N:N modelada por <code>UserClinicAccess</code>. No topo da interface há um seletor de <strong>clínica ativa</strong> que troca o contexto de trabalho.</p>

  <div class="card-grid">
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">🔁</span> Troca de contexto</div>
      <p>O seletor no cabeçalho atualiza o <code>X-Active-Clinic-Id</code>. Toda navegação subsequente passa a operar sobre a unidade escolhida.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🧑‍⚕️</span> Profissional 1:1</div>
      <p>Cada <code>User</code> corresponde a exatamente um <code>Professional</code> (1:1). O usuário é a identidade de login; o profissional é a representação clínica/agenda.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">🌐</span> Acesso N:N</div>
      <p>O acesso a clínicas é N:N: um usuário pode ver N unidades, e uma unidade tem N usuários com permissões próprias por unidade.</p>
    </div>
  </div>

  <h2>4. Autenticação</h2>
  <p>A autenticação usa um esquema de <strong>JWT duplo</strong> para equilibrar segurança e experiência.</p>

  <div class="card-grid">
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🎫</span> Access token (curto)</div>
      <p>Vida curta. O payload carrega <code>userId</code>, <code>organizationId</code>, <code>clinicIds[]</code>, <code>permissions[]</code> e uma flag indicando se o usuário é <strong>dono</strong> da organização.</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">🍪</span> Refresh token (longo)</div>
      <p>Armazenado em cookie <code>HttpOnly</code>, inacessível ao JavaScript — proteção contra <strong>XSS</strong>. Permite renovar a sessão sem novo login.</p>
    </div>
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">♻️</span> Refresh transparente</div>
      <p>Ao receber um <code>401</code> por access token expirado, o cliente faz refresh automático e repete a requisição original sem o usuário perceber.</p>
    </div>
  </div>

  <div class="alert alert-orange">
    <span class="alert-icon">🔑</span>
    <div class="alert-body">
      <div class="alert-title">Troca de senha no primeiro acesso</div>
      <p>Ao convidar um profissional, o sistema gera uma <strong>senha temporária</strong>. No primeiro login a troca de senha é <strong>obrigatória</strong>, garantindo que apenas o titular conheça a credencial definitiva.</p>
    </div>
  </div>

  <h2>5. Modelo de permissões (RBAC)</h2>
  <p>O controle de acesso é baseado em papéis e permissões atômicas. O <strong>dono da organização</strong> recebe acesso total (<code>manage all</code>). Demais membros têm um <strong>array de permissões granulares</strong> por módulo.</p>

  <div class="table-wrap">
    <table>
      <thead><tr><th>Permissão</th><th>Significado</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>settings_team</code></td><td>Gerenciar membros da equipe e convites.</td></tr>
        <tr><td class="td-bold"><code>settings_clinic</code></td><td>Editar dados e configurações da unidade.</td></tr>
        <tr><td class="td-bold"><code>patients_create</code></td><td>Cadastrar novos pacientes.</td></tr>
        <tr><td class="td-bold"><code>budgets_read</code></td><td>Visualizar orçamentos e propostas de tratamento.</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Personas / cargos clínicos (CASL)</h3>
  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Catálogo real — <code>CLINIC_ROLES</code> (ago/2026)</div>
      <p>Fonte: <code>@citybox/clinica-permissions</code> + Equipe em Configurações. OWNER da organização tem bypass na API; demais usam checkboxes no vínculo + presets por cargo.</p>
    </div>
  </div>
  <div class="card-grid">
    <div class="card card-rose">
      <div class="card-title"><span class="card-icon">👑</span> OWNER / Dentista admin</div>
      <p>Dono da organização (<code>manage all</code>) ou cargo <code>dentista_admin</code> (todos os checkboxes). Acesso total à clínica.</p>
    </div>
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">🩺</span> Dentista / Aluno</div>
      <p><code>dentista</code> e <code>aluno</code> — agenda com horários; ficha clínica (preset do aluno mais restrito). Ver tabela em <a href="#equipe-rh">Equipe &amp; RH</a>.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">📞</span> Secretário(a)</div>
      <p><code>secretario</code> — agenda sem atender, tarefas, config (sem equipe), estoque, subset ficha/financeiro/marketing/vendas.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">📊</span> Gerente / Contador / Radiologia</div>
      <p><code>gerente</code> (sem agenda/horários), <code>contador</code> (indicadores/financeiro view), <code>radiologia</code> (arquivos).</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🤝</span> Vendedor(a)</div>
      <p><code>vendedor</code> — agenda sem atender; ficha (orçamentos/débitos/tratamentos); vendas completo.</p>
    </div>
  </div>

  <div class="alert alert-blue">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Autorização no frontend (implementado)</div>
      <p><code>useCan</code> / <code>&lt;Can&gt;</code> em <code>features/clinic/permissions/</code> + mesmos IDs da API (<code>STORE_PERMISSION_IDS</code>). Sidebar via <code>createClinicNavPermissions</code>.</p>
    </div>
  </div>

  <h2>Entidades de dados</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Entidade</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>Organization</code></td><td>Raiz do tenant: a rede ou grupo de clínicas (pessoa jurídica, identificada por CNPJ). Fronteira de isolamento por RLS.</td></tr>
        <tr><td class="td-bold"><code>Clinic</code></td><td>Unidade de atendimento dentro da organização. Possui slug único e concentra agenda, pacientes e equipe locais.</td></tr>
        <tr><td class="td-bold"><code>User</code></td><td>Identidade de login. Carrega credenciais, e-mail e o vínculo com a organização. Pode acessar várias clínicas.</td></tr>
        <tr><td class="td-bold"><code>Professional</code></td><td>Representação clínica do usuário (1:1 com <code>User</code>): conselho/registro, especialidade, agenda e produção.</td></tr>
        <tr><td class="td-bold"><code>UserClinicAccess</code></td><td>Junção N:N entre <code>User</code> e <code>Clinic</code>, definindo a quais unidades o usuário tem acesso e suas permissões por unidade.</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Resumo</div>
      <p>Organização isola por RLS, clínica ativa dá contexto de trabalho, onboarding provisiona tudo em uma transação idempotente, o JWT duplo carrega o escopo e as permissões, e o RBAC granular controla cada ação — do dono ao visualizador.</p>
    </div>
  </div>
</div>
`
});
