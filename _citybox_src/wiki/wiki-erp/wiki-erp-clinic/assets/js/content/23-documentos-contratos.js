WIKI.register({
  id: 'documentos-contratos',
  title: 'Documentos, Receituário & Contratos',
  icon: '📄',
  searchText: 'documentos atestado afastamento dias declaracao comparecimento presenca hora inicio fim CID opcional PDF imutavel conselho profissional CRM CRO CRP CRN CREFITO receituario prescricao medicamentos suplementos condutas exercicios posologia quantidade medida combobox busca debounce criacao inline snapshot JSON catalogo global clinica semente duplicado 409 contrato modelo ContractModel variaveis interpoladas nome paciente valor tratamento editor rich-text TipTap RichTextEditor rascunho ativo cancelado assinatura digital sem assinatura pendente assinada workflow recibo pagamento TCLE consentimento versionado A4 impressao visualizador baixar imprimir PatientCertificate PatientPrescription Medication PatientContract clinica-api contract-models',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Prontuário Clínico</div>
    <h1 class="section-title">📄 Documentos, Receituário &amp; Contratos</h1>
    <p class="section-subtitle">Hub central dos documentos emitidos para o paciente. O Prontuário cita atestados e prescrições superficialmente; aqui detalhamos a geração de PDF, a assinatura digital e a regra de imutabilidade que rege todos os documentos clínicos e contratuais de uma clínica multi-especialidade.</p>
    <div class="section-tags">
      <span class="tag-cyan">Documentos</span>
      <span class="tag-teal">Assinatura Digital</span>
      <span class="tag-violet">PDF</span>
    </div>
  </div>

  <div class="alert alert-amber">
    <span class="alert-icon">🔒</span>
    <div class="alert-body">
      <div class="alert-title">Imutabilidade transversal</div>
      <p>Atestados são imutáveis desde a emissão (sem edição). Contratos, anamneses e evoluções seguem o workflow de assinatura <strong>sem assinatura → pendente → assinada</strong>; uma vez assinados tornam-se imutáveis. Toda tentativa de editar ou excluir documento já assinado é bloqueada (<code>409 Conflict</code>).</p>
    </div>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Aba Documentos na ficha do paciente — integrada (jul/2026)</div>
      <p><code>/clinic/pacientes/[id]/documentos</code> — grid 2×2: <strong>Contrato</strong> (emissão com modelos <code>ContractModel</code> reais + interpolação de variáveis; CRUD + histórico paginado), <strong>Receituário</strong> e <strong>Atestados</strong> (CRUD + histórico + PDF jsPDF client-side com logo da clínica via <code>patient-pdf-shared</code>). Histórico <strong>sem</strong> campo de busca. <strong>Termo</strong> desabilitado. Persistência em <code>PatientContractEmission</code>, <code>PatientPrescription</code> e <code>PatientCertificate</code> na <code>clinica-api</code>. Assinatura digital ainda placeholder (<code>unsigned</code>).</p>
    </div>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Modelos de contrato no ERP (implementado jun/2026)</div>
      <p><code>/clinic/configuracoes/contrato</code> — CRUD completo de <code>ContractModel</code> via <code>clinica-api</code> (:3172), proxy ERP, editor <code>RichTextEditor</code> (TipTap) com toolbar completa, chips de variáveis, layout A4 e buscar/substituir. Detalhes: <a href="#configuracoes-parametros">Configurações &amp; Parâmetros</a> § 11.0.</p>
      <p><strong>Emissão na ficha (jul/2026):</strong> <code>/clinic/pacientes/[id]/documentos</code> — sheet de emissão com preview interpolado; histórico server-side; edição/exclusão via API. Assinatura digital e PDF persistido no servidor ainda blueprint.</p>
    </div>
  </div>

  <h2>23.1 Atestados</h2>
  <p>Dois tipos de atestado, cada um com validações próprias. O registro do conselho profissional do emissor (CRM, CRO, CRP, CRN, CREFITO etc.) é impresso automaticamente no PDF a partir do cadastro do profissional.</p>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">📅</span> Afastamento (days)</div>
      <p>Atestado de afastamento de atividades. Exige número de dias maior que zero. CID opcional (consentimento do paciente para constar). Gera PDF imutável.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🕐</span> Comparecimento (attendance)</div>
      <p>Declaração de presença/comparecimento. Exige hora de início e hora de fim do atendimento. Sem dias de afastamento. CID opcional.</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">🏷️</span> Registro do conselho</div>
      <p>O PDF carrega nome, especialidade e número do conselho do emissor. Documento não editável após emissão — correção só por nova emissão.</p>
    </div>
  </div>

  <h2>23.2 Receituário / Prescrição</h2>
  <p>Formulário com itens inline (nome, quantidade, medida, posologia — mínimo 1 item). Cada item é persistido como <em>snapshot</em> JSON na <code>clinica-api</code>. O PDF inclui badges numerados e assinatura do profissional. Listagem do histórico exibe <code>itemCount</code> no título do card (<em>N medicamentos — data</em>). Generaliza-se para todas as especialidades:</p>
  <ul>
    <li><strong>Medicamentos:</strong> prescrição clássica (medicina, odontologia) com dose e via de administração</li>
    <li><strong>Suplementos:</strong> prescrição nutricional (vitaminas, proteínas, fitoterápicos)</li>
    <li><strong>Condutas e exercícios:</strong> protocolos de fisioterapia (séries, repetições, frequência)</li>
  </ul>

  <h2>23.3 Catálogo de medicamentos / itens</h2>
  <div class="alert alert-amber">
    <span class="alert-icon">💡</span>
    <div class="alert-body">
      <div class="alert-title">Blueprint — jul/2026</div>
      <p>O receituário atual usa <strong>itens digitados inline</strong> no formulário (sem combobox de catálogo). A busca combinada global + clínica descrita abaixo ainda não está implementada.</p>
    </div>
  </div>
  <p>Quando implementado, a busca do receituário combinará dois catálogos:</p>
  <div class="card-grid">
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🌐</span> Catálogo global</div>
      <p>Compartilhado entre todas as clínicas. Recebe <em>semente</em> inicial com itens comuns. Mantido centralmente, somente leitura para a clínica.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">🏥</span> Catálogo da clínica</div>
      <p>Itens customizados criados pela própria clínica (inclusive via criação inline no receituário). Item duplicado é bloqueado (<code>409 Conflict</code>).</p>
    </div>
  </div>

  <h2>23.4 Contratos do paciente</h2>
  <p>Contratos são gerados a partir de <strong>modelos</strong> (<code>ContractModel</code>) com variáveis interpoladas. O editor rich-text (<code>RichTextEditor</code> em <code>@citybox/ui</code>) permite montar o HTML do modelo em Configurações; na emissão ao paciente o profissional pode ajustar o conteúdo antes de confirmar. O sistema persiste o HTML final e o JSON das variáveis usadas.</p>

  <h3>23.4.1 Modelos (<code>ContractModel</code>) — status jun/2026</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Camada</th><th>Status</th><th>Detalhe</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">API</td><td><span class="status-badge status-functional">✅</span></td><td><code>GET/POST /api/v1/contract-models</code> · <code>PUT/DELETE …/:id</code> · schema <code>clinica.contract_models</code></td></tr>
        <tr><td class="td-bold">ERP Configurações</td><td><span class="status-badge status-functional">✅</span></td><td>Listagem, sheet fullscreen, sidebar de variáveis, toggle padrão, TanStack Query</td></tr>
        <tr><td class="td-bold">Editor rich-text</td><td><span class="status-badge status-functional">✅</span></td><td>TipTap: formatação, listas, alinhamento, imagem, cor/destaque, buscar/substituir, chips <code>{{token}}</code>, modo A4</td></tr>
        <tr><td class="td-bold">Emissão ao paciente</td><td><span class="status-badge status-functional">✅ API</span></td><td>Sheet na ficha + preview interpolado; CRUD + histórico via <code>patient-contract-emissions</code>; persistência <code>PatientContractEmission</code></td></tr>
      </tbody>
    </table>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Variável</th><th>Substituída por</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>{{nome_paciente}}</code></td><td>Nome completo do paciente no contrato</td></tr>
        <tr><td class="td-bold"><code>{{valor}}</code></td><td>Valor do tratamento/serviço contratado</td></tr>
        <tr><td class="td-bold"><code>{{tratamento}}</code></td><td>Descrição do tratamento ou plano contratado</td></tr>
        <tr><td class="td-bold"><code>{{...}}</code></td><td>Demais campos (CPF, data, profissional, clínica)</td></tr>
      </tbody>
    </table>
  </div>
  <div class="card-grid">
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">📝</span> Status do contrato</div>
      <p>Rascunho, ativo ou cancelado — combinado ao workflow de assinatura (sem assinatura → pendente → assinada). Impressão em formato A4.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">⛔</span> Regra de bloqueio</div>
      <p>Edição e exclusão são <strong>bloqueadas</strong> quando a assinatura ≠ "sem assinatura" (<code>409 Conflict</code>). Conteúdo assinado é imutável.</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">⭐</span> Modelo padrão</div>
      <p>O modelo padrão é protegido contra exclusão; só pode existir um modelo padrão por clínica.</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">👁️</span> Pré-visualização</div>
      <p>O endpoint de "gerar" substitui as variáveis sem persistir — usado para prévia antes de confirmar a emissão.</p>
    </div>
  </div>

  <h2>23.5 Recibos e termos de consentimento</h2>
  <div class="card-grid">
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">🧾</span> Recibo de pagamento</div>
      <p>Recibo em PDF gerado a partir dos lançamentos financeiros do paciente. Reflete valor, forma de pagamento e competência do atendimento.</p>
    </div>
    <div class="card card-rose">
      <div class="card-title"><span class="card-icon">✍️</span> Termo de consentimento (TCLE)</div>
      <p>Consentimento livre e esclarecido digital, versionado. Cada versão preserva o texto vigente assinado pelo paciente para auditoria.</p>
    </div>
  </div>

  <h2>23.6 Assinatura digital &amp; visualizador (transversal)</h2>
  <p>Todos os documentos — contratos, anamneses e evoluções — compartilham o mesmo workflow e o mesmo visualizador de PDF com opções de baixar e imprimir. Contrato <strong>ainda não assinado pelas 2 partes</strong>: Imprimir gera HTML A4 em iframe (<code>printPatientContractHtml</code> + <code>PATIENT_CONTRACT_PAPER_CSS</code>, <code>box-sizing:border-box</code>). Contrato <strong>com 2 assinaturas</strong>: Imprimir usa o PDF ZapSign (<code>fetchSignedPdfBlob</code>).</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Estado de assinatura</th><th>Comportamento</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Sem assinatura</td><td>Documento editável e excluível livremente</td></tr>
        <tr><td class="td-bold">Pendente</td><td>Aguardando assinatura; edição restrita</td></tr>
        <tr><td class="td-bold">Assinada</td><td>Documento imutável — edição/exclusão retornam <code>409 Conflict</code></td></tr>
      </tbody>
    </table>
  </div>

  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Recursos propostos</div>
    <ul>
      <li><strong>Assinatura eletrônica avançada/qualificada</strong> (ICP-Brasil) com carimbo de tempo e verificação de hash</li>
      <li><strong>Assinatura remota do paciente</strong> via link enviado por WhatsApp/e-mail para contratos e TCLE</li>
      <li><strong>Biblioteca de modelos de contrato</strong> por especialidade (ortodontia, fisioterapia, estética) com variáveis pré-mapeadas</li>
      <li><strong>Geração em lote</strong> de recibos e atestados a partir da agenda do dia</li>
      <li><strong>Versionamento visual do TCLE</strong> com diff entre versões e registro de aceite</li>
    </ul>
  </div>

  <h2>Entidades de dados (schema_clinic)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Entidade</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>PatientCertificate</code></td><td>Atestado: tipo (days/attendance), dias OU hora início/fim, CID opcional, emissor + conselho, PDF imutável</td></tr>
        <tr><td class="td-bold"><code>PatientPrescription</code></td><td>Receituário: itens (snapshot JSON, mín. 1) com quantidade/medida/posologia, emissor + conselho, PDF</td></tr>
        <tr><td class="td-bold"><code>Medication</code></td><td>Catálogo de medicamentos/itens: escopo global ou por clínica, busca combinada, duplicado bloqueado (409)</td></tr>
        <tr><td class="td-bold"><code>ContractModel</code></td><td>Modelo de contrato: HTML rich-text (TipTap), variáveis como chips/tokens, flag padrão (único por loja), protegido contra exclusão quando padrão — <strong>CRUD implementado</strong> em <code>clinica-api</code></td></tr>
        <tr><td class="td-bold"><code>PatientContractEmission</code></td><td>Contrato emitido: HTML + variáveis JSON, status (rascunho/ativo/cancelado), assinatura (sem/pendente/assinada) — <strong>CRUD implementado</strong> jul/2026</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
