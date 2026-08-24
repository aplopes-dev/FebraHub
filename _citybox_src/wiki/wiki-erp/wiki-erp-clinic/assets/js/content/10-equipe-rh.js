WIKI.register({
  id: 'equipe-rh',
  title: 'Equipe & RH',
  icon: '👥',
  searchText: 'equipe RH profissionais escala plantao producao metas dashboard comissao comissoes regras commission-rules identidade budget_approved debit_received fixed_value porcentagem Todos COMMISSION_SCOPE_ALL wildcard especialidade AlertTriangle CLIN-062 repasse CRM CRO CRP CRN CREFITO conselho classe CLT PJ autonomo vinculo jornada ferias ausencia atestado absenteismo NPS taxa retorno ranking producao horarios atendimento service-hours clinica-api configuracoes equipe CASL clinica-permissions cargos aluno contador dentista_admin dentista gerente radiologia secretario vendedor presets permissionsForRole aba comissao responsivo mobile sheet abas scroll horarios grade seed-clinic-demo-team first-contact store_members Keycloak',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Operações</div>
    <h1 class="section-title">👥 Equipe &amp; Recursos Humanos</h1>
    <p class="section-subtitle">Gestão completa da equipe da clínica: cadastro com dados do conselho de classe, escalas de trabalho, dashboard de produtividade individual, metas e cálculo automático de comissões.</p>
    <div class="section-tags">
      <span class="tag-cyan">Escalas</span>
      <span class="tag-teal">Produtividade</span>
      <span class="tag-sky">Comissões</span>
      <span class="tag-violet">CASL</span>
    </div>
  </div>

  <h2>9.1 Cadastro da equipe</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">👤</span> Dados Pessoais e Profissionais</div>
      <p>Nome, contato, foto, especialidade. Número do conselho de classe: CRM, CRO, CRP, CRN, CREFITO, UF de atuação. Validação de registro ativo (integração futura com conselhos).</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">📝</span> Vínculo Empregatício</div>
      <p>CLT, PJ (com CNPJ), autônomo (RPA) ou sócio. Tipo de vínculo determina regra de cálculo de comissão e geração de recibo/holerite.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">✍️</span> Assinatura Digital</div>
      <p>Certificado digital para assinatura de prontuários e documentos clínicos. Obrigatório para prescrições e laudos. Integração com ICP-Brasil planejada para v2.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">📁</span> Documentos</div>
      <p>Diploma, habilitação no conselho, cursos de capacitação, contratos. Alerta de documentos próximos do vencimento (registro do conselho, cursos obrigatórios).</p>
    </div>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Já no ERP — Configurações → Equipe (ago/2026)</div>
      <p>Em <code>/configuracoes/equipe</code> (<code>@citybox/clinica-web</code>), membros são geridos pela <strong>clinica-api</strong> (<code>GET/POST /v1/members</code>, <code>GET /v1/members/roles</code>). Permissões CASL editáveis no vínculo (<code>clinics[].permissions</code>) via package <code>@citybox/clinica-permissions</code>.</p>
      <p><strong>Cargos clínicos</strong> (<code>CLINIC_ROLES</code>): Aluno(a), Contador(a), Dentista administrador(a), Dentista, Gerente, Radiologia, Secretário(a), Vendedor(a). Removidos do catálogo: Auxiliar, Recepcionista, Financeiro (membros antigos mantêm o key; label legado via <code>clinicRoleLabel</code>).</p>
      <p><strong>Presets:</strong> ao selecionar o cargo, <code>permissionsForRole</code> pré-marca os checkboxes; o operador pode alterar antes de salvar. Accordion de permissões abre <strong>fechado</strong>; módulos e checkboxes em ordem alfabética <code>pt-BR</code>.</p>
      <p><strong>Horários de Atendimento:</strong> aba + profissionais na agenda só para <code>aluno</code>, <code>dentista_admin</code> e <code>dentista</code> (<code>showsServiceHoursTabForApiRole</code>) — <code>GET/PUT /v1/team/:memberId/service-hours</code>. Gerente <strong>não</strong> tem aba de horários.</p>
      <p><strong>Comissão:</strong> aba CLIN-062 (ver alert abaixo). Detalhes: <a href="#configuracoes-parametros">Configurações &amp; Parâmetros</a> § 11.0 (Equipe).</p>
      <p><strong>UX mobile:</strong> abas do sheet (Permissões / Horários / Comissão) com scroll horizontal; grade de horários Seg–Dom empilha no mobile; lista/tabela de comissão com <code>overflow-x-auto</code>; corpo do sheet usa <code>overflow-y-auto</code>.</p>
      <p><strong>First-contact:</strong> ao criar loja vertical <strong>Clínica</strong>, o worker <code>clinic.store-setup</code> seeda OWNER como <code>dentista_admin</code> (todas as permissões) + 3 membros demo (<code>dentista</code>, <code>gerente</code>, <code>secretario</code>) com <code>permissionsForRole</code> (usernames <code>{cargo}.&lt;8chars&gt;</code>). IDs na agenda = <code>clinica.members.id</code>.</p>
    </div>
  </div>

  <h3>Cargos e presets (resumo)</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Cargo</th><th>Horários</th><th>Preset (visão geral)</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Aluno(a)</td><td>Sim</td><td>Agenda (menu + atender); anamnese</td></tr>
        <tr><td class="td-bold">Contador(a)</td><td>Não</td><td>Indicadores; estoque; visualizar receitas/despesas/resumo/comissões</td></tr>
        <tr><td class="td-bold">Dentista administrador(a)</td><td>Sim</td><td><strong>Todos</strong> os checkboxes da Equipe</td></tr>
        <tr><td class="td-bold">Dentista</td><td>Sim</td><td>Agenda (menu, atender, excluir); ficha completa menos inativar paciente e excluir evoluções</td></tr>
        <tr><td class="td-bold">Gerente</td><td>Não</td><td>Dashboard/config/estoque/financeiro/marketing/vendas; ficha sem editar/excluir evoluções nem excluir arquivos — <strong>sem</strong> Agenda</td></tr>
        <tr><td class="td-bold">Radiologia</td><td>Não</td><td>Inserir arquivos/imagens/pastas</td></tr>
        <tr><td class="td-bold">Secretário(a)</td><td>Não</td><td>Agenda sem atender; tarefas; config sem equipe; estoque; ficha/financeiro/marketing/vendas (subset — ver <code>role-catalog.ts</code>)</td></tr>
        <tr><td class="td-bold">Vendedor(a)</td><td>Não</td><td>Agenda sem atender; ficha (orçamentos/paciente/débitos/anamnese/tratamentos); vendas completo</td></tr>
      </tbody>
    </table>
  </div>


  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Regras de comissão por membro (CLIN-062)</div>
      <p>No sheet do membro (aba <strong>Comissão</strong>), o ERP faz <code>GET/PUT /v1/team/:memberId/commission-rules</code> via <code>commission-rules.service.ts</code>. Gate CASL: escrita em <code>Team</code> / settings da Equipe.</p>
      <ul>
        <li><strong>Identidade única:</strong> gatilho + tipo + plano + especialidade; <code>budget_approved</code> = no máximo 1. Regra idêntica pré-preenche valores e <strong>atualiza</strong> (não duplica). PUT no backend colapsa duplicatas (última vence).</li>
        <li><strong>Porcentagem — escopo Todos:</strong> Plano e/ou Especialidade podem ser <strong>Todos</strong> (<code>COMMISSION_SCOPE_ALL</code> → API <code>null</code>). Com plano=Todos, a lista de especialidades agrega todos os planos (dedupe por nome); o motor faz match por <strong>nome</strong> da especialidade quando o plano é wildcard. <strong>Valor fixo</strong> continua exigindo plano + especialidade concretos.</li>
        <li><strong>Alertas (card amarelo + ícone):</strong> ao escolher só “Aprovação de orçamento”, aviso longo de sobrescrita; ao escolher tipo <em>Porcentagem</em>, troca para “Regra já cadastrada para esse profissional.” + resumo (ex. Plano Todos &gt; Porcentagem 15%).</li>
        <li><strong>Valor fixo:</strong> em tratamento finalizado / débito recebido, valores por tratamento (<code>treatments[]</code>); <code>commissionValueCents</code> global só é obrigatório em aprovação de orçamento + valor fixo.</li>
        <li><strong>Gatilho tratamento finalizado:</strong> só conta quando o profissional finaliza em Paciente → Tratamentos → Finalizar (cria evolução); evolução avulsa não gera comissão.</li>
        <li>Deep-link a partir de Comissões Em aberto: <code>/clinic/configuracoes/equipe?memberId=&amp;tab=commission</code>.</li>
      </ul>
    </div>
  </div>

  <h2>9.2 Escalas e plantões</h2>
  <ul>
    <li><strong>Implementado (config):</strong> grade semanal de horários de atendimento por profissional (<code>aluno</code>, <code>dentista_admin</code>, <code>dentista</code>) — dias, início/fim, almoço fixo, duração padrão da consulta</li>
    <li>Grade semanal de presença: dias e horários de atendimento por sala</li>
    <li>Registro de ausências: férias, folgas, atestados, licenças — com aprovação do administrador</li>
    <li>Plantão e sobreaviso para clínicas com atendimento estendido ou urgência</li>
    <li>Calendário de ausências integrado ao bloqueio automático da agenda (sem marcação em dias de folga)</li>
    <li>Gestão de substituição: ao registrar ausência, permite realocar pacientes para outro profissional</li>
  </ul>

  <h2>9.3 Dashboard de produtividade</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">📊</span> Dashboard Individual</div>
      <p>Consultas realizadas, procedimentos executados, faturamento gerado no período. Comparativo com mês anterior e meta mensal.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🎯</span> Metas</div>
      <p>Metas por profissional em quantidade de atendimentos ou valor de faturamento mensal. Evolução em gráfico de barras com percentual atingido.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🏆</span> Ranking de Produção</div>
      <p>Ranking entre profissionais da mesma especialidade. Exibição configurável — pode ser ocultada pelo administrador para evitar clima de competição negativa.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">⭐</span> NPS por Profissional</div>
      <p>Pesquisa de satisfação enviada 24h após atendimento via WhatsApp. Score NPS individual para acompanhar qualidade percebida pelo paciente.</p>
    </div>
  </div>

  <h2>Métricas de retenção e satisfação</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Métrica</th><th>Descrição</th><th>Período</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Taxa de retorno</td><td>% de pacientes que voltaram para o mesmo profissional</td><td>Mensal / trimestral</td></tr>
        <tr><td class="td-bold">NPS individual</td><td>Net Promoter Score pós-consulta por profissional</td><td>Rolling 30 dias</td></tr>
        <tr><td class="td-bold">Taxa de absenteísmo</td><td>% de consultas com não comparecimento do paciente</td><td>Mensal</td></tr>
        <tr><td class="td-bold">Tempo médio de atendimento</td><td>Duração real vs. duração estimada do procedimento</td><td>Mensal</td></tr>
        <tr><td class="td-bold">Faturamento por hora</td><td>Receita gerada / horas trabalhadas</td><td>Mensal</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
