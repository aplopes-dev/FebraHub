WIKI.register({
  id: 'portal-paciente',
  title: 'Portal & App do Paciente',
  icon: '📱',
  searchText: 'portal app paciente marketplace descoberta agendamento online especialidade profissional convenio login SSO CityBox historico consultas documentos receitas laudos atestados boletos faturas coparticipacao consentimento TCLE NPS satisfacao notificacoes push chat fidelidade pontos indicacao',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Portal do Paciente</div>
    <h1 class="section-title">📱 Portal &amp; App do Paciente</h1>
    <p class="section-subtitle">O paciente acessa o CityBox pelo marketplace do município — o mesmo app usado para pedir comida e comprar no mercado local. A clínica aparece como um estabelecimento de saúde dentro do ecossistema, sem que o paciente precise criar uma nova conta.</p>
    <div class="section-tags">
      <span class="tag-cyan">CityBox SSO</span>
      <span class="tag-teal">Marketplace integrado</span>
      <span class="tag-sky">Documentos digitais</span>
    </div>
  </div>

  <div class="eco-callout">
    <div class="eco-icon">🛍️</div>
    <div class="eco-body">
      <div class="eco-title">Paciente usa o Marketplace — não um app separado da clínica</div>
      <div class="eco-links">
        O paciente já tem o app CityBox para pedir comida e fazer compras. A clínica aparece como um card de saúde no mesmo app. Login único. Sem baixar nada novo. Essa integração é o diferencial que reduz a fricção do agendamento online.
      </div>
    </div>
  </div>

  <h2>12.1 Descoberta da clínica (Marketplace)</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">🔍</span> Busca por Saúde</div>
      <p>Busca por especialidade, nome do profissional, bairro ou convênio aceito. Filtro "aceita meu plano" — paciente filtra clínicas compatíveis com seu convênio.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">⭐</span> Listagem com Avaliações</div>
      <p>Avaliações de outros pacientes, fotos da clínica, serviços ofertados, próximo horário disponível. Perfil do profissional com formação e especialidades.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">📍</span> Localização</div>
      <p>Mapa com clínicas próximas. Distância, horário de funcionamento, facilidade de estacionamento. Integrado ao Google Maps.</p>
    </div>
  </div>

  <h2>12.2 Agendamento online</h2>
  <div class="mermaid">
flowchart LR
  App["App CityBox"] --> Especialidade
  Especialidade --> Profissional
  Profissional --> Calendario["Calendário\n(horários disponíveis)"]
  Calendario --> Convenio["Convênio\nou Particular"]
  Convenio --> Documentos["Upload de docs\n(pedido médico, guia)"]
  Documentos --> Confirmacao["Confirmação\nimediata ou aprovação"]
  Confirmacao -->|"WhatsApp + push"| Paciente
  </div>
  <ul>
    <li>Login com conta CityBox — sem nova conta</li>
    <li>Confirmação imediata ou sujeita à aprovação da clínica (configurável)</li>
    <li>Cancelamento e reagendamento com política da clínica aplicada automaticamente</li>
    <li>Alerta de antecedência mínima para cancelamento (ex: não é possível cancelar com menos de 2h)</li>
  </ul>

  <h2>12.3 Área do paciente</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">📅</span> Histórico de Consultas</div>
      <p>Lista de todas as consultas com data, profissional e procedimento. Linha do tempo do relacionamento com cada clínica CityBox.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">📄</span> Documentos Digitais</div>
      <p>Receitas, laudos, atestados e declarações em PDF para download. A clínica disponibiliza e o paciente acessa sem precisar ligar ou ir buscar.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">💳</span> Financeiro do Paciente</div>
      <p>Boletos e faturas pendentes com link de pagamento via PIX ou cartão. Extrato de coparticipação paga ao convênio. Histórico de pagamentos.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">✅</span> Consentimentos (LGPD)</div>
      <p>Aceite de TCLE digital, consentimento de imagem, autorização de dados para pesquisa. Histórico imutável com data e versão de cada aceite.</p>
    </div>
  </div>

  <h2>12.4 Comunicação e engajamento</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Recurso</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Chat com a clínica</td><td>Dúvidas operacionais (não consulta médica online). Respondido pela recepção.</td></tr>
        <tr><td class="td-bold">NPS pós-consulta</td><td>Pesquisa de satisfação enviada 24h após o atendimento via WhatsApp. Score por profissional e por clínica.</td></tr>
        <tr><td class="td-bold">Notificações push</td><td>Lembrete de consulta, resultado disponível, conta em aberto, promoção da clínica.</td></tr>
        <tr><td class="td-bold">Programa de fidelidade</td><td>Opcional: pontos por comparecimento e indicação. Troca por desconto em consultas futuras.</td></tr>
        <tr><td class="td-bold">Cartão de vacinação</td><td>Calendário de vacinação e exames periódicos recomendados pelo profissional.</td></tr>
        <tr><td class="td-bold">Resultados de exames</td><td>Quando integrado ao laboratório parceiro, resultados chegam direto ao app.</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-cyan">
    <span class="alert-icon">💡</span>
    <div class="alert-body">
      <div class="alert-title">Portabilidade de prontuário (LGPD art. 18)</div>
      <p>O paciente pode solicitar, a qualquer momento, a exportação completa do seu prontuário em PDF — mesmo que seja para levar a outro prestador. A clínica tem até 15 dias para disponibilizar conforme a LGPD.</p>
    </div>
  </div>
</div>
`
});
