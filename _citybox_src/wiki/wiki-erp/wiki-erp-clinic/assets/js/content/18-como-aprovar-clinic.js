WIKI.register({
  id: 'como-aprovar-clinic',
  title: 'Como Aprovar Este Wiki',
  icon: '✅',
  searchText: 'como aprovar revisao feedback stakeholders produto aprovacao secoes pendentes ajuste comentario relatorio exportar imprimir',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Evolução</div>
    <h1 class="section-title">✅ Como Aprovar Este Wiki</h1>
    <p class="section-subtitle">Este wiki é um documento vivo de produto. Cada seção pode ser aprovada individualmente ou marcada para ajuste. Use os botões ao final de cada seção para registrar seu feedback.</p>
  </div>

  <div class="alert alert-cyan">
    <span class="alert-icon">📋</span>
    <div class="alert-body">
      <div class="alert-title">Processo de revisão</div>
      <p>Navegue pelas seções usando a barra lateral esquerda. Ao final de cada seção há um widget de aprovação — clique em <strong>✅ Aprovar</strong> ou <strong>✏️ Solicitar ajuste</strong> com comentário. Seu feedback é salvo localmente no navegador.</p>
    </div>
  </div>

  <h2>Status atual de aprovação</h2>
  <div id="approvalSummaryContainer">
    <p style="color:var(--text-muted)">Nenhuma seção revisada ainda. Comece pela primeira seção na barra lateral.</p>
  </div>

  <h2>Exportar relatório</h2>
  <p>Ao terminar a revisão de todas as seções, exporte o relatório completo:</p>
  <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap">
    <button class="feedback-btn feedback-btn-approve" id="exportFeedbackBtn">📋 Copiar relatório</button>
    <button class="feedback-btn feedback-btn-adjust" id="printFeedbackBtn">🖨️ Imprimir</button>
  </div>

  <h2>Seções deste wiki</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">🏥</span> Introdução (3 seções)</div>
      <p>Visão Geral, Benchmark, Tipos de Estabelecimento</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">📅</span> Agenda e Recepção (2 seções)</div>
      <p>Agenda &amp; Agendamento, Recepção &amp; Sala de Espera</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">📋</span> Prontuário (2 seções)</div>
      <p>Prontuário Eletrônico, Odontograma &amp; Especialidades</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">💰</span> Financeiro (2 seções)</div>
      <p>Financeiro &amp; Caixa, Faturamento &amp; Convênios</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">📦</span> Operações (2 seções)</div>
      <p>Estoque &amp; Suprimentos, Equipe &amp; RH</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">📊</span> Inteligência (2 seções)</div>
      <p>Relatórios &amp; BI, Configurações &amp; Parâmetros</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">📱</span> Produto e Técnico (3 seções)</div>
      <p>Portal do Paciente, Interfaces &amp; UX, LGPD &amp; Conformidade</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🏗️</span> Técnico e Roadmap (2 seções)</div>
      <p>Arquitetura Técnica, Roadmap de Implementação</p>
    </div>
  </div>

  <div class="alert alert-green" style="margin-top:32px">
    <span class="alert-icon">🎯</span>
    <div class="alert-body">
      <div class="alert-title">Wiki da Vertical Clinic — CityBox · Aplopes Tecnologia</div>
      <p>Versão 1.0 · Junho 2026 · Ilhéus, BA<br>
      Baseado no relatório de produto <em>CityBox_Clinica_Relatorio_Produto.docx</em>.<br>
      Para sugerir alterações, use o botão "Solicitar ajuste" em cada seção.</p>
    </div>
  </div>
</div>
`
});
