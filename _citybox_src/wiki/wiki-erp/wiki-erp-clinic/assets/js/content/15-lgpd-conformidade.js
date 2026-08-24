WIKI.register({
  id: 'lgpd-conformidade',
  title: 'LGPD, Conformidade & Segurança',
  icon: '🔒',
  searchText: 'LGPD CFM prontuario digital assinatura digital ICP-Brasil auditoria log acesso conformidade regulatoria seguranca Keycloak MFA autenticacao dois fatores criptografia repouso transito TLS backup dados saude sensivel isolamento schema DPO encarregado dados portabilidade esquecimento consentimento',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Técnico e Conformidade</div>
    <h1 class="section-title">🔒 LGPD, Conformidade &amp; Segurança</h1>
    <p class="section-subtitle">Dados de saúde são dados sensíveis na LGPD (art. 5º, II) — exigem tratamento diferenciado. O sistema atende CFM, CFO, conselhos de classe e a Lei Geral de Proteção de Dados com controles técnicos e organizacionais robustos.</p>
    <div class="section-tags">
      <span class="tag-rose">Dados Sensíveis (LGPD)</span>
      <span class="tag-cyan">CFM 1821/2007</span>
      <span class="tag-teal">Keycloak MFA</span>
      <span class="tag-sky">Audit Trail Imutável</span>
    </div>
  </div>

  <div class="alert alert-red">
    <span class="alert-icon">⚠️</span>
    <div class="alert-body">
      <div class="alert-title">Dados de saúde = dados sensíveis (LGPD art. 5º, II)</div>
      <p>Dados relativos à saúde ou à vida sexual do titular têm proteção reforçada na LGPD. Exigem base legal específica (art. 11), consentimento expresso ou cumprimento de obrigação legal. O sistema trata todos os dados clínicos como sensíveis por design.</p>
    </div>
  </div>

  <h2>14.1 Proteção de dados — LGPD (Lei 13.709/2018)</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">✅</span> Consentimento</div>
      <p>TCLE digital com versão e data de aceite registrados imutavelmente. Finalidade explícita: dados coletados exclusivamente para assistência ao paciente.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">📦</span> Portabilidade</div>
      <p>Exportação do prontuário completo em PDF a pedido do paciente (art. 18 LGPD). Até 15 dias para disponibilizar.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🗑️</span> Direito ao Esquecimento</div>
      <p>Prontuários têm guarda mínima de 20 anos (CFM). Pedido de exclusão só atendido após esse prazo — sistema explica e documenta a negativa.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">👤</span> DPO</div>
      <p>Dados de contato do Encarregado de Dados (DPO) publicados no portal da clínica e no app do paciente — exigência do art. 41 da LGPD.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">📊</span> Anonimização</div>
      <p>Relatórios estatísticos e dados municipais gerados sem identificação de pacientes. k-anonimização para relatórios epidemiológicos.</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">📋</span> Log de Acesso</div>
      <p>Cada visualização e edição de prontuário registrada com usuário, timestamp e IP. Audit trail imutável para conformidade e investigações.</p>
    </div>
  </div>

  <h2>14.2 Segurança do sistema</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Controle</th><th>Implementação</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Autenticação</td><td>Keycloak SSO — sem senha armazenada no sistema da clínica</td></tr>
        <tr><td class="td-bold">MFA obrigatório</td><td>Para perfis de Admin e Profissional — TOTP (Google Authenticator, Authy)</td></tr>
        <tr><td class="td-bold">Sessão</td><td>Expiração automática após período de inatividade (padrão 30 min, configurável)</td></tr>
        <tr><td class="td-bold">Trânsito</td><td>HTTPS/TLS 1.3 em todos os endpoints — sem HTTP</td></tr>
        <tr><td class="td-bold">Repouso</td><td>Dados sensíveis de saúde criptografados no banco de dados</td></tr>
        <tr><td class="td-bold">Isolamento</td><td>Schema PostgreSQL isolado por tenant — dados de uma clínica nunca acessíveis por outra</td></tr>
        <tr><td class="td-bold">Backup</td><td>Automático diário com retenção de 90 dias e teste de restauração mensal</td></tr>
        <tr><td class="td-bold">Audit trail</td><td>Nenhum registro clínico pode ser deletado — apenas marcado como corrigido com adendo</td></tr>
      </tbody>
    </table>
  </div>

  <h2>14.3 Conformidade regulatória</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Norma / Órgão</th><th>Requisito Atendido</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">CFM 1821/2007</td><td>Digitalização e guarda de prontuários com assinatura digital ICP-Brasil</td></tr>
        <tr><td class="td-bold">Lei 13.787/2018</td><td>Requisitos de digitação e uso de prontuários eletrônicos em saúde</td></tr>
        <tr><td class="td-bold">Resolução CFO 118/2012</td><td>Prontuário odontológico eletrônico com charting e assinatura</td></tr>
        <tr><td class="td-bold">CRN / CRP / CREFITO</td><td>Fichas de evolução conforme normas dos conselhos de nutrição, psicologia e fisioterapia</td></tr>
        <tr><td class="td-bold">ANS TISS 3.x</td><td>Padrão de intercâmbio de dados em saúde suplementar</td></tr>
        <tr><td class="td-bold">LGPD (Lei 13.709/2018)</td><td>Base legal, consentimento, direitos do titular, DPO, relatório de impacto</td></tr>
        <tr><td class="td-bold">CFM — Telemedicina</td><td>Registro de consultas por videoconferência (fase 3)</td></tr>
        <tr><td class="td-bold">ANVISA RDC 430/2020</td><td>Rastreabilidade de medicamentos para clínicas com dispensação</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Assinatura digital e imutabilidade por design</div>
      <p>Evoluções SOAP são assinadas com carimbo de data/hora e hash criptográfico. Nenhuma edição retroativa é possível — apenas adendos datados e assinados. O banco registra versões imutáveis via append-only na tabela <code>RecordEntry</code>. Isso atende simultaneamente CFM, Lei 13.787 e LGPD.</p>
    </div>
  </div>
</div>
`
});
