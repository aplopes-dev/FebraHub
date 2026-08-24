WIKI.register({
  id: 'faturamento-convenios',
  title: 'Faturamento & Convênios',
  icon: '🏥',
  searchText: 'faturamento convenios TISS ANS SADT guia consulta autorizacao sessoes producao lote XML operadora Unimed Bradesco SulAmerica Amil glosas contestacao recurso TUSS CBHPM plano saude credenciado elegibilidade coparticipacao',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Financeiro</div>
    <h1 class="section-title">🏥 Faturamento &amp; Convênios</h1>
    <p class="section-subtitle">Gestão completa do ciclo de convênios de saúde seguindo o padrão TISS (Troca de Informações em Saúde Suplementar) da ANS — obrigatório para todos os prestadores credenciados no Brasil.</p>
    <div class="section-tags">
      <span class="tag-cyan">TISS 3.x (ANS)</span>
      <span class="tag-teal">TUSS / CBHPM</span>
      <span class="tag-sky">Controle de Glosas</span>
    </div>
  </div>

  <h2>7.1 Cadastro de operadoras e planos</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">🏢</span> Operadoras</div>
      <p>Razão social, CNPJ, registro ANS, telefone, e-mail, portal. Tabela de preços por plano: valor de consulta e valor de cada procedimento (TUSS/CBHPM).</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">📋</span> Planos</div>
      <p>Código do plano, tipo (ambulatorial, hospitalar, odontológico), acomodação. Regras: carência, cobertura, número máximo de sessões, exigência de guia.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">✅</span> Elegibilidade</div>
      <p>Verificação de elegibilidade do paciente na rede credenciada da operadora. Integração com portais das principais operadoras.</p>
    </div>
  </div>

  <h2>7.2 Gestão de guias</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tipo de Guia</th><th>Uso</th><th>Campos Principais</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Guia de Consulta</td><td>Consulta médica, odontológica ou de especialidade</td><td>Número autorização, senha, validade, especialidade</td></tr>
        <tr><td class="td-bold">Guia SADT</td><td>Exames, fisioterapia, fonoaudiologia, nutrição</td><td>Código TUSS, quantidade autorizada, saldo de sessões</td></tr>
        <tr><td class="td-bold">Guia de Internação</td><td>Leitos de observação em policlínicas</td><td>CID principal, duração prevista, tipo de acomodação</td></tr>
      </tbody>
    </table>
  </div>
  <ul>
    <li>Controle de sessões: saldo restante de sessões autorizadas por guia</li>
    <li>Alerta ao recepcionista quando sessões estão acabando (ex: sobrando 2)</li>
    <li>Renovação de guia: fluxo de solicitação de nova autorização com histórico</li>
  </ul>

  <h2>7.3 Produção e Lote TISS</h2>
  <div class="mermaid">
flowchart LR
  Atendimento -->|"registra procedimento + TUSS"| Producao
  Producao -->|"consolidação mensal"| Lote
  Lote -->|"XML TISS 3.x"| Portal[Portais operadoras]
  Portal -->|"retorno: autorizado/glosado"| Glosa
  Glosa -->|"recurso de glosa"| Portal
  </div>
  <ul>
    <li>Consolidação automática da produção mensal por operadora</li>
    <li>Geração de XML TISS 3.x (padrão ANS) para envio ao portal da operadora</li>
    <li>Envio eletrônico integrado: Unimed, Bradesco Saúde, SulAmérica, Amil, NotreDame Intermédica</li>
    <li>Relatório de produção: quantidade de atendimentos, valor autorizado, valor faturado</li>
  </ul>

  <h2>7.4 Controle de glosas</h2>
  <div class="card-grid">
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">❌</span> Importação de Retorno</div>
      <p>Importação do XML ou planilha de retorno da operadora com valores glosados. Listagem de glosas por código, motivo e valor.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">📝</span> Contestação</div>
      <p>Documentação do recurso com prazo de recurso configurável. Anexo de justificativas e prontuário de suporte à contestação.</p>
    </div>
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">📊</span> Análise de Padrão</div>
      <p>Relatório de glosas recorrentes por procedimento — identifica procedimentos que as operadoras costumam não pagar para ajustar conduta ou codificação.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">💰</span> Recebimento Parcial</td>
      <p>Controle de valor aprovado vs. valor faturado por lote. Conciliação com o crédito recebido na conta da clínica.</p>
    </div>
  </div>

  <h2>Operadoras suportadas na v1</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Operadora</th><th>Envio XML TISS</th><th>Verificação de Elegibilidade</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Unimed (cooperativas)</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td></tr>
        <tr><td class="td-bold">Bradesco Saúde</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td></tr>
        <tr><td class="td-bold">SulAmérica</td><td class="cap-yes">✅</td><td class="cap-opt">Planejado</td></tr>
        <tr><td class="td-bold">Amil</td><td class="cap-yes">✅</td><td class="cap-opt">Planejado</td></tr>
        <tr><td class="td-bold">NotreDame Intermédica</td><td class="cap-yes">✅</td><td class="cap-opt">Planejado</td></tr>
        <tr><td class="td-bold">Hapvida</td><td class="cap-opt">Planejado</td><td class="cap-na">—</td></tr>
        <tr><td class="td-bold">Planos regionais</td><td class="cap-opt">Via XML padrão</td><td class="cap-na">—</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Entidades de dados (schema_clinic)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Entidade</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>InsurancePlan</code></td><td>Convênio: operadora, plano, tabela de preços TUSS, regras de cobertura</td></tr>
        <tr><td class="td-bold"><code>InsuranceGuide</code></td><td>Guia autorizada: número, saldo de sessões, validade, tipo</td></tr>
        <tr><td class="td-bold"><code>TISSBatch</code></td><td>Lote TISS para envio à operadora: status, XML gerado, protocolo de envio</td></tr>
        <tr><td class="td-bold"><code>GlosaItem</code></td><td>Glosa: código TUSS, motivo, valor, status contestação, prazo</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
