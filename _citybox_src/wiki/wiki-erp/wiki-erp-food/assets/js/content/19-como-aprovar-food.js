WIKI.register({
  id: 'como-aprovar-food',
  title: 'Como Aprovar este Wiki',
  icon: '✅',
  searchText: 'como aprovar aprovacao feedback widget processo revisao stakeholder reuniao seção',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Analytics e Evolução</div>
    <h1 class="section-title">✅ Como Aprovar este Wiki</h1>
    <p class="section-subtitle">Guia para revisar e aprovar as seções do Wiki ERP Food — transformando este blueprint em um plano de desenvolvimento aprovado pelos stakeholders.</p>
    <div class="section-tags">
      <span class="tag-red">Aprovação</span>
      <span class="tag-gray">Processo</span>
    </div>
  </div>

  <h2>Como usar o widget de aprovação</h2>
  <div class="card-grid">
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">✅</span> Aprovar seção</div>
      <p>Clique em "Aprovar esta seção" quando o conteúdo estiver correto e alinhado com a visão do produto. O indicador na barra lateral fica verde.</p>
    </div>
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">✏️</span> Solicitar ajuste</div>
      <p>Clique em "Solicitar ajuste" e descreva o que precisa mudar. O indicador fica vermelho. O agente irá endereçar o feedback.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">📊</span> Barra de progresso</div>
      <p>A barra no topo mostra quantas das 19 seções foram aprovadas. Objetivo: 100% aprovado antes de iniciar o desenvolvimento.</p>
    </div>
  </div>

  <h2>Resumo de aprovações</h2>
  <div id="approvalSummaryContainer">
    <p style="color:var(--text-muted)">Nenhuma seção revisada ainda.</p>
  </div>

  <h2>Exportar relatório</h2>
  <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;">
    <button id="exportFeedbackBtn" class="feedback-save-btn" style="padding:10px 20px;">📋 Copiar relatório</button>
    <button id="printFeedbackBtn" class="feedback-save-btn" style="padding:10px 20px;background:#374151;">🖨️ Imprimir</button>
  </div>

  <h2>Processo de revisão sugerido</h2>
  <div class="mermaid">
flowchart LR
  Leitura["1. Leitura individual\n(cada stakeholder)"]
  Feedback["2. Feedback por seção\n(widget aprovação)"]
  Reuniao["3. Revisão conjunta\n(seções com ajuste)"]
  Ajuste["4. Agente endereça\naos ajustes"]
  Aprovacao["5. Aprovação final\n(100% verde)"]
  Dev["🚀 Início do\ndesenvolvimento"]

  Leitura --> Feedback --> Reuniao --> Ajuste --> Aprovacao --> Dev
  </div>

  <h2>Seções por prioridade de revisão</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Prioridade</th><th>Seções</th><th>Por quê revisar primeiro</th></tr></thead>
      <tbody>
        <tr>
          <td><span class="tag-p1">P1 Urgente</span></td>
          <td>Cardápio, KDS, PDV, NFC-e, Pedidos</td>
          <td>Bloqueantes para o início do desenvolvimento da Fase 1</td>
        </tr>
        <tr>
          <td><span class="tag-p2">P2 Importante</span></td>
          <td>Salão, Delivery, Fichas técnicas, RBAC</td>
          <td>Dependências da Fase 2 — precisam de decisões de produto</td>
        </tr>
        <tr>
          <td><span class="tag-p3">P3 Estratégico</span></td>
          <td>CRM, Marketplace, Analytics, Roadmap</td>
          <td>Visão de longo prazo — podem ser refinados ao longo do projeto</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">🎯</span>
    <div class="alert-body">
      <div class="alert-title">Meta: wiki aprovado em até 2 semanas</div>
      <p>Com as 19 seções aprovadas, o time de desenvolvimento tem um roadmap claro, priorizado e alinhado com as expectativas de produto. Isso reduz retrabalho e acelera o time-to-market da vertical Food.</p>
    </div>
  </div>
</div>
`
});
