WIKI.register({
  id: 'tipos-estabelecimentos',
  title: 'Tipos de Estabelecimento e Personas',
  icon: '🩺',
  searchText: 'tipos estabelecimento clinica odontologica medica psicologia fisioterapia fonoaudiologia nutricao terapia ocupacional quiropraxia acupuntura podologia enfermagem medicina trabalho saude integrada multidisciplinar personas proprietario profissional recepcionista auxiliar tecnico paciente administrador',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Introdução</div>
    <h1 class="section-title">🩺 Tipos de Estabelecimento e Personas</h1>
    <p class="section-subtitle">O sistema é multi-especialidade por design: uma única plataforma atende desde consultórios solos até policlínicas multidisciplinares. O design de produto parte das personas reais que operam uma clínica no dia a dia.</p>
    <div class="section-tags">
      <span class="tag-cyan">Multi-especialidade</span>
      <span class="tag-teal">16 tipos de clínica</span>
      <span class="tag-sky">6 personas</span>
    </div>
  </div>

  <h2>Tipos de estabelecimento suportados</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tipo de Estabelecimento</th><th>Especialidades / Uso Principal</th><th>Porte Típico</th><th>Módulo Especial</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Clínica Odontológica</td><td>Dentística, ortodontia, implantes, cirurgia bucomaxilar</td><td>Pequeno a médio</td><td>Odontograma</td></tr>
        <tr><td class="td-bold">Clínica Médica / Consultório</td><td>Clínica geral, especialidades médicas</td><td>Micro a médio</td><td>PEP + Prescrição</td></tr>
        <tr><td class="td-bold">Policlínica</td><td>Múltiplas especialidades médicas integradas</td><td>Médio a grande</td><td>Multi-sala + TISS</td></tr>
        <tr><td class="td-bold">Clínica de Psicologia</td><td>Psicoterapia, avaliação psicológica, grupos</td><td>Micro a pequeno</td><td>Sessão restrita + DSM-5</td></tr>
        <tr><td class="td-bold">Clínica de Fisioterapia</td><td>Reabilitação, pilates, RPG, hidroterapia</td><td>Pequeno a médio</td><td>Body chart + escalas</td></tr>
        <tr><td class="td-bold">Clínica de Fonoaudiologia</td><td>Linguagem, voz, deglutição, audiologia</td><td>Micro a pequeno</td><td>PEP especializado</td></tr>
        <tr><td class="td-bold">Clínica de Nutrição</td><td>Nutrição clínica, esportiva, infantil, oncológica</td><td>Micro a pequeno</td><td>Antropometria + plano alimentar</td></tr>
        <tr><td class="td-bold">Clínica de Terapia Ocupacional</td><td>Reabilitação funcional, TEA, geriatria</td><td>Micro a pequeno</td><td>Escalas funcionais</td></tr>
        <tr><td class="td-bold">Clínica de Quiropraxia</td><td>Ajustes, coluna, dor crônica</td><td>Micro a pequeno</td><td>PEP + body chart</td></tr>
        <tr><td class="td-bold">Clínica de Acupuntura</td><td>MTC, eletroacupuntura, moxabustão</td><td>Micro a pequeno</td><td>PEP livre</td></tr>
        <tr><td class="td-bold">Clínica de Podologia</td><td>Cuidados com pés, diabetes, esportes</td><td>Micro a pequeno</td><td>PEP especializado</td></tr>
        <tr><td class="td-bold">Clínica de Enfermagem</td><td>Curativos, vacinas, administração de medicamentos</td><td>Micro a pequeno</td><td>Rastreabilidade insumos</td></tr>
        <tr><td class="td-bold">Medicina do Trabalho</td><td>ASO, exames admissionais/demissionais, PCMSO</td><td>Pequeno a grande</td><td>ASO + PCMSO + Empresas</td></tr>
        <tr><td class="td-bold">Clínica de Saúde Integrada</td><td>Mix de terapias convencionais e complementares</td><td>Pequeno a médio</td><td>Multi-especialidade</td></tr>
        <tr><td class="td-bold">Clínica Multidisciplinar</td><td>Equipe interprofissional, casos complexos</td><td>Médio a grande</td><td>Prontuário compartilhado</td></tr>
        <tr><td class="td-bold">Clínica de Estética</td><td>Estética facial, corporal, laser, harmonização</td><td>Pequeno a médio</td><td>Fotos antes/depois, plano</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Personas do sistema</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">👤</span> Proprietário / Administrador</div>
      <p>Visão 360° do negócio: financeiro, agenda, equipe, relatórios e configurações. Pode ser o próprio médico/dentista em consultório solo ou um gestor administrativo em policlínica.</p>
      <ul style="margin-top:8px">
        <li>Acesso total a todos os módulos</li>
        <li>Configura RBAC, salas, procedimentos, convênios</li>
        <li>Vê relatórios financeiros e de produtividade</li>
      </ul>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🩺</span> Profissional de Saúde</div>
      <p>Médico, dentista, psicólogo, fisioterapeuta. Foca em agenda própria, prontuário, prescrições e laudos. <strong>Não vê informações financeiras da clínica.</strong></p>
      <ul style="margin-top:8px">
        <li>Acessa a própria agenda e prontuários dos pacientes</li>
        <li>Registra evolução SOAP, prescreve, solicita exames</li>
        <li>App mobile para atendimento em movimento</li>
      </ul>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🧑‍💼</span> Recepcionista / Secretária</div>
      <p>Gerencia o front desk: agendamento, check-in de pacientes, cobrança na saída, controle de sala de espera. <strong>Sem acesso a prontuários clínicos completos.</strong></p>
      <ul style="margin-top:8px">
        <li>Agenda, confirma, remarca e cancela consultas</li>
        <li>Faz check-in, triagem básica e checkout financeiro</li>
        <li>Acessa cobranças mas não histórico clínico</li>
      </ul>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">🧑‍⚕️</span> Auxiliar / Técnico</div>
      <p>Auxiliar de enfermagem, TSB, auxiliar de radiologia. Acesso restrito às tarefas operacionais: sinais vitais, triagem, apoio ao profissional.</p>
      <ul style="margin-top:8px">
        <li>Registra sinais vitais e triagem no check-in</li>
        <li>Sem acesso a prescrições ou dados financeiros</li>
        <li>Auxilia na entrada de estoque e insumos</li>
      </ul>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">📱</span> Paciente (app/portal)</div>
      <p>Agenda consultas, recebe confirmações, acessa histórico de atendimentos e documentos. Canal de comunicação direto com a clínica via marketplace CityBox.</p>
      <ul style="margin-top:8px">
        <li>Login único CityBox — sem nova conta</li>
        <li>Acessa receitas, laudos e atestados em PDF</li>
        <li>Cancela/remarca com respeito à política da clínica</li>
      </ul>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">🛠️</span> Admin de Plataforma (Aplopes)</div>
      <p>Acesso ao painel administrativo do CityBox: onboarding de novas clínicas, suporte, gestão de assinaturas, auditoria global da plataforma.</p>
      <ul style="margin-top:8px">
        <li>Habilita/desabilita a vertical clinic por tenant</li>
        <li>Monitora uso, SLA e cobrança de assinatura</li>
        <li>Suporte e auditoria de acessos</li>
      </ul>
    </div>
  </div>

  <h2>Matriz de acesso por persona</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Módulo</th><th>Admin</th><th>Profissional</th><th>Recepcionista</th><th>Auxiliar</th><th>Faturista</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Agenda</td><td class="cap-yes">Total</td><td class="cap-yes">Própria</td><td class="cap-yes">Total</td><td class="cap-opt">Leitura</td><td class="cap-na">—</td></tr>
        <tr><td class="td-bold">Sala de Espera</td><td class="cap-yes">Total</td><td class="cap-opt">Status</td><td class="cap-yes">Total</td><td class="cap-yes">Total</td><td class="cap-na">—</td></tr>
        <tr><td class="td-bold">Prontuário (PEP)</td><td class="cap-yes">Total</td><td class="cap-yes">Total</td><td class="cap-na">—</td><td class="cap-opt">Triagem</td><td class="cap-na">—</td></tr>
        <tr><td class="td-bold">Prescrição</td><td class="cap-na">—</td><td class="cap-yes">Total</td><td class="cap-na">—</td><td class="cap-na">—</td><td class="cap-na">—</td></tr>
        <tr><td class="td-bold">Financeiro / Caixa</td><td class="cap-yes">Total</td><td class="cap-na">—</td><td class="cap-opt">Caixa</td><td class="cap-na">—</td><td class="cap-yes">Total</td></tr>
        <tr><td class="td-bold">Convênios / TISS</td><td class="cap-yes">Total</td><td class="cap-na">—</td><td class="cap-opt">Guias</td><td class="cap-na">—</td><td class="cap-yes">Total</td></tr>
        <tr><td class="td-bold">Estoque</td><td class="cap-yes">Total</td><td class="cap-na">—</td><td class="cap-na">—</td><td class="cap-opt">Saída</td><td class="cap-na">—</td></tr>
        <tr><td class="td-bold">Equipe / RH</td><td class="cap-yes">Total</td><td class="cap-na">—</td><td class="cap-na">—</td><td class="cap-na">—</td><td class="cap-na">—</td></tr>
        <tr><td class="td-bold">Relatórios</td><td class="cap-yes">Total</td><td class="cap-opt">Produção</td><td class="cap-na">—</td><td class="cap-na">—</td><td class="cap-opt">Financeiro</td></tr>
        <tr><td class="td-bold">Configurações</td><td class="cap-yes">Total</td><td class="cap-na">—</td><td class="cap-na">—</td><td class="cap-na">—</td><td class="cap-na">—</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-amber">
    <span class="alert-icon">🔒</span>
    <div class="alert-body">
      <div class="alert-title">Papéis por sala — privacidade clínica</div>
      <p>O profissional pode ser configurado para ver apenas os pacientes da própria sala. Em clínicas de psicologia, as anotações de processo são acessíveis <strong>exclusivamente pelo profissional responsável</strong> — nem o administrador tem acesso, seguindo o sigilo profissional do CRP.</p>
    </div>
  </div>
</div>
`
});
