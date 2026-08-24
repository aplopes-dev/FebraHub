WIKI.register({
  id: 'prontuario-eletronico',
  title: 'Prontuário Eletrônico (PEP)',
  icon: '📋',
  searchText: 'prontuario eletronico PEP ficha cadastral paciente pacientes lista orcamentos budgets procedimentos tratamentos anamnese documentos financeiro mock ERP jspdf CLIN-041 paginacao server-side debounce useDebouncedSearch PDF build-patient-budget-pdf materialize approve anamnese publica token alerta retorno evolucao SOAP CID-10 hipotese diagnostica prescricao digital receituario controle especial portaria 344 pedido exames TUSS laudo atestado assinatura digital CFM LGPD versionamento imutabilidade nutricao inicializar petroski',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Prontuário Clínico</div>
    <h1 class="section-title">📋 Prontuário Eletrônico do Paciente (PEP)</h1>
    <p class="section-subtitle">O PEP é o módulo mais regulado do sistema. Segue a Resolução CFM 1821/2007, a Lei 13.787/2018, a LGPD e as resoluções dos conselhos de classe. Imutável por design: evoluções não podem ser editadas, apenas corrigidas com adendo assinado.</p>
    <div class="section-tags">
      <span class="tag-cyan">CFM 1821/2007</span>
      <span class="tag-teal">LGPD</span>
      <span class="tag-sky">Assinatura Digital</span>
      <span class="tag-rose">Imutável</span>
    </div>
  </div>

  <div class="alert alert-amber">
    <span class="alert-icon">⚖️</span>
    <div class="alert-body">
      <div class="alert-title">Princípio de imutabilidade do prontuário</div>
      <p>Nenhum registro clínico pode ser excluído ou editado retroativamente. O sistema permite apenas <strong>adendos assinados</strong> com carimbo de data/hora. Versionamento completo para auditoria — exigência da CFM 1821/2007 e da Lei 13.787/2018.</p>
    </div>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Ficha do paciente no ERP — integração parcial (jul/2026)</div>
      <p><code>/clinic/pacientes</code> (lista com busca/paginação server-side + debounce 400&nbsp;ms), cadastro, aba <strong>Sobre</strong> (convênio/plano inativo → sufixo <code>(Inativo)</code> via <code>planStatus</code>), <strong>foto</strong>, <strong>Orçamentos</strong>, aba <strong>Prontuário</strong> (Procedimentos; rota <code>tratamentos</code>), <strong>Anamnese</strong>, <strong>Documentos</strong>, <strong>Financeiro</strong> e <strong>Arquivos</strong> (drive MinIO) consomem a <code>clinica-api</code> via proxy. Código em <code>features/clinic/modules/patients/</code>. Ver <a href="#visao-geral-clinic">Visão Geral</a>, <a href="#orcamentos-tratamentos">Orçamentos &amp; Procedimentos</a>, <a href="#financeiro-caixa">Financeiro</a>, <a href="#anamnese-formularios">Anamnese Digital</a>, <a href="#documentos-contratos">Documentos</a> e <a href="#arquivos-paciente">Arquivos</a>.</p>
    </div>
  </div>

  <h2>5.1 Ficha cadastral do paciente</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">👤</span> Dados Pessoais</div>
      <p>Nome completo, nome social, CPF, RG, data de nascimento, sexo, gênero, foto (webcam ou upload).</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">📞</span> Contato</div>
      <p>Telefone, WhatsApp, e-mail, endereço completo (CEP com auto-preenchimento via ViaCEP), filiação e contato de emergência.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🏥</span> Convênios</div>
      <p>Múltiplos planos vinculados com número de carteirinha, validade e acomodação. Verificação de elegibilidade online.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">🔗</span> Histórico CityBox</div>
      <p>Histórico de clínicas CityBox onde foi atendido — com consentimento LGPD do paciente. Portabilidade dentro do ecossistema municipal.</p>
    </div>
  </div>

  <h2>5.2 Anamnese</h2>
  <p>Formulário configurável por especialidade, com modelos montados em <a href="#configuracoes-parametros">Configurações → Anamneses</a> e instâncias preenchidas na aba <code>/clinic/pacientes/[id]/anamnese</code> (integrado jul/2026). Dois modos: profissional preenche no atendimento (<code>issued</code>) ou paciente responde por link público (<code>awaiting_response</code> → snapshot imutável). Detalhes do form builder, token e alertas em <a href="#anamnese-formularios">Anamnese Digital &amp; Formulários</a>.</p>
  <p>Campos clínicos típicos cobertos pelos templates (biblioteca de perguntas):</p>
  <ul>
    <li><strong>HDA:</strong> queixas e histórico da doença atual</li>
    <li><strong>HPP:</strong> histórico patológico pregresso — doenças, cirurgias, internações, traumas</li>
    <li><strong>Histórico familiar:</strong> doenças hereditárias relevantes</li>
    <li><strong>Hábitos de vida:</strong> tabagismo, etilismo, atividade física, alimentação, sono</li>
    <li><strong>Histórico ginecológico/obstétrico</strong> (quando aplicável)</li>
    <li><strong>Histórico odontológico:</strong> tratamentos anteriores, medo, bruxismo</li>
    <li><strong>Alergias e reações adversas</strong> com grau de severidade</li>
    <li><strong>Medicamentos em uso:</strong> nome, dose, frequência, desde quando</li>
    <li><strong>Vacinação</strong> (relevante para pediatria e Medicina do Trabalho)</li>
  </ul>

  <h2>5.3 Evolução / SOAP</h2>
  <p>Registro de cada atendimento no formato SOAP ou texto livre, conforme preferência do profissional:</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Componente</th><th>Conteúdo</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">S — Subjetivo</td><td>Relato do paciente, queixa do dia em suas próprias palavras</td></tr>
        <tr><td class="td-bold">O — Objetivo</td><td>Dados de exame físico, sinais vitais do atendimento</td></tr>
        <tr><td class="td-bold">A — Avaliação</td><td>Hipóteses diagnósticas com CID-10 (busca por código ou descrição)</td></tr>
        <tr><td class="td-bold">P — Plano</td><td>Conduta, pedidos de exame, encaminhamentos, data de retorno</td></tr>
      </tbody>
    </table>
  </div>
  <ul>
    <li>Assinatura digital do profissional com carimbo de data/hora imutável</li>
    <li>Versionamento: não permite editar registros passados — apenas adendos assinados</li>
    <li>Anexos: laudos, imagens, documentos digitalizados vinculados ao atendimento</li>
    <li>Prescrição por voz: dita o texto e o sistema transcreve (IA)</li>
  </ul>

  <h2>5.4 Prescrição digital</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">💊</span> Receituário Simples</div>
      <p>Medicamentos com nome, concentração, posologia e duração. Busca por princípio ativo, nome comercial ou código ANVISA.</p>
    </div>
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">🔵</span> Receituário Especial</div>
      <p>Portaria 344: receita azul e amarela com numeração controlada. Alertas de interações medicamentosas ao prescrever combinações de risco.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🔗</span> QR Code de Autenticidade</div>
      <p>QR Code na receita para verificação de autenticidade pelo farmacêutico. Envio por WhatsApp/e-mail diretamente ao paciente.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🏥</span> RNDS (planejado)</div>
      <p>Integração com a Rede Nacional de Dados em Saúde do Ministério da Saúde — quando disponível no estado do usuário.</p>
    </div>
  </div>

  <h2>5.5 Pedido de exames</h2>
  <ul>
    <li>Pedido de exames laboratoriais com código TUSS e CBHPM</li>
    <li>Pedido de imagem: RX, US, TC, RM, ECO com descrição da incidência</li>
    <li>Envio de pedido por WhatsApp e armazenamento no prontuário</li>
    <li>Importação de resultados: PDF digitalizado vinculado ao atendimento</li>
    <li>Integração com laboratórios parceiros para importação automática de resultados</li>
    <li>Histórico de pedidos × resultados por exame ao longo do tempo</li>
  </ul>

  <h2>5.6 Laudos e documentos clínicos</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Documento</th><th>Campos</th><th>Canal de Entrega</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Atestado médico/odontológico</td><td>Dias de afastamento, CID-10, finalidade</td><td>WhatsApp, e-mail, PDF</td></tr>
        <tr><td class="td-bold">Declaração de comparecimento</td><td>Data, hora, duração, profissional</td><td>WhatsApp, PDF</td></tr>
        <tr><td class="td-bold">Encaminhamento</td><td>Especialidade destino, resumo clínico</td><td>WhatsApp, PDF</td></tr>
        <tr><td class="td-bold">Laudo de exame próprio</td><td>ECG, audiometria, espirometria</td><td>PDF, prontuário</td></tr>
        <tr><td class="td-bold">Aptidão para atividade física</td><td>CID-10, restrições</td><td>PDF</td></tr>
        <tr><td class="td-bold">ASO (Med. Trabalho)</td><td>Tipo ASO, exames, empresa, cargo</td><td>PDF, empresa</td></tr>
        <tr><td class="td-bold">Relatório psicológico</td><td>Avaliação, CID-10, DSM-5, escalas</td><td>PDF (restrito)</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Entidades de dados (schema_clinic)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Entidade</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>MedicalRecord</code></td><td>Prontuário: patientId, professionalId, createdAt, signed (bool), type</td></tr>
        <tr><td class="td-bold"><code>RecordEntry</code></td><td>Evolução SOAP: texto, CID-10, assinatura digital, timestamp imutável</td></tr>
        <tr><td class="td-bold"><code>Prescription</code></td><td>Receita médica: itens, tipo (simples/controle especial), QR code</td></tr>
        <tr><td class="td-bold"><code>ExamRequest</code></td><td>Pedido de exame: TUSS, descrição, status, resultado (PDF)</td></tr>
        <tr><td class="td-bold"><code>ClinicalDocument</code></td><td>Atestado, laudo, encaminhamento — com assinatura e hash imutável</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
