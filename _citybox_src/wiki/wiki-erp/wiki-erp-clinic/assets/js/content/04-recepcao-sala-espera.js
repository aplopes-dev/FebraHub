WIKI.register({
  id: 'recepcao-sala-espera',
  title: 'Recepção & Sala de Espera',
  icon: '🏨',
  searchText: 'recepcao sala espera check-in triagem kanban sinais vitais PA FC temperatura glicemia peso altura saturacao checkout cobranca NFS-e nota fiscal pix cartao convenio coparticipacao parcela carne digital',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Agenda e Recepção</div>
    <h1 class="section-title">🏨 Recepção &amp; Sala de Espera</h1>
    <p class="section-subtitle">Módulo que gerencia o fluxo físico do paciente dentro da clínica — do check-in ao checkout financeiro, passando pela triagem e pelo kanban em tempo real da sala de espera.</p>
    <div class="section-tags">
      <span class="tag-cyan">Front Desk</span>
      <span class="tag-teal">Realtime Kanban</span>
      <span class="tag-sky">Checkout Integrado</span>
    </div>
  </div>

  <h2>Check-in do paciente</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">👩‍💼</span> Check-in pela Recepcionista</div>
      <p>Busca por nome ou CPF no balcão. Ao confirmar, a ficha entra automaticamente na coluna "Aguardando" da sala de espera digital.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">📱</span> Check-in pelo App do Paciente</div>
      <p>Paciente faz check-in pelo app CityBox antes de entrar na clínica (geolocalização opcional). Reduz fila no balcão em horários de pico.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🔲</span> Totem / QR Code</div>
      <p>Check-in autônomo via totem ou QR Code na entrada da clínica. Ideal para policlínicas com alto volume de pacientes.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">⚠️</span> Alertas no Check-in</div>
      <p>Documentos faltantes (carteira de convênio, pedido médico), pendências financeiras, faltas recorrentes, alergias críticas. Recepcionista age antes de o paciente esperar.</p>
    </div>
  </div>

  <h2>Triagem</h2>
  <p>Realizada pelo auxiliar ou técnico de saúde. Campos registrados no prontuário e visíveis para o profissional durante a consulta:</p>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">❤️</span> Sinais Vitais</div>
      <p>PA, FC, FR, temperatura, peso, altura, saturação, glicemia capilar. Valores fora de faixa são destacados em vermelho.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">💬</span> Queixa Principal</div>
      <p>Motivo da consulta em texto livre ou lista de sintomas. Escala de dor (0–10) e classificação de urgência clínica.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">💊</span> Alergias e Medicamentos</div>
      <p>Pré-preenchido do cadastro do paciente, editável. Alertas críticos de alergia ficam fixados no topo do prontuário.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">📋</span> Formulários por Especialidade</div>
      <p>Triagem configurável por especialidade. Ex: psicologia tem escala PHQ-2 de rastreio; fisioterapia tem escala de dor e mobilidade.</p>
    </div>
  </div>

  <h2>Gestão da sala de espera — Kanban realtime</h2>
  <p>Painel visual com cards de pacientes em tempo real via WebSocket. Exibido no monitor da recepção, no celular do profissional e em painel de TV para chamada de pacientes.</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Status</th><th>Cor</th><th>Significado</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Aguardando Check-in</td><td><span class="mock-badge" style="background:#f3f4f6;color:#374151">Cinza</span></td><td>Consulta agendada, paciente não chegou</td></tr>
        <tr><td class="td-bold">Aguardando Triagem</td><td><span class="mock-badge mock-badge-yellow">Amarelo</span></td><td>Paciente chegou, aguarda triagem</td></tr>
        <tr><td class="td-bold">Aguardando Atendimento</td><td><span class="mock-badge mock-badge-blue">Azul</span></td><td>Triagem feita, aguarda o profissional</td></tr>
        <tr><td class="td-bold">Em Atendimento</td><td><span class="mock-badge mock-badge-green">Verde</span></td><td>Profissional iniciou a consulta</td></tr>
        <tr><td class="td-bold">Aguardando Retorno</td><td><span class="mock-badge mock-badge-orange">Laranja</span></td><td>Aguarda resultado/exame dentro da clínica</td></tr>
        <tr><td class="td-bold">Finalizado – Aguarda Saída</td><td><span class="mock-badge" style="background:#ede9fe;color:#5b21b6">Roxo</span></td><td>Consulta encerrada, aguarda cobrança/receita</td></tr>
      </tbody>
    </table>
  </div>

  <ul>
    <li>Tempo de espera visível por paciente em tempo real</li>
    <li>Alerta automático ao recepcionista quando paciente aguarda mais que X minutos (configurável)</li>
    <li>Chamada do paciente por painel de TV (exibe nome/senha) ou via app do profissional</li>
  </ul>

  <h2>Checkout da consulta (PDV da Recepção)</h2>
  <p>Interface simplificada para o momento da cobrança — foco em velocidade. 3 colunas: itens a cobrar, totais/desconto, formas de pagamento.</p>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">💳</span> Formas de Pagamento</div>
      <p>Dinheiro (troco automático), PIX, cartão débito/crédito, voucher, transferência, convênio, boleto. Integração com maquininha via payments-api.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">📄</span> NFS-e e Recibo</div>
      <p>Emissão de NFS-e em um clique após confirmação do pagamento via fiscal-api. Geração de recibo por WhatsApp ao paciente sem impressão.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🏥</span> Coparticipação de Convênio</div>
      <p>Sistema calcula e cobra automaticamente a diferença de coparticipação: valor do convênio − valor cobrado pelo plano = parte do paciente.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">📆</span> Parcelamento</div>
      <p>Parcelamento no cartão ou carnê digital para tratamentos longos (ex: ortodontia, fisioterapia). Régua de cobrança automática por WhatsApp.</p>
    </div>
  </div>

  <h2>Fluxo completo: check-in → checkout</h2>
  <div class="mermaid">
sequenceDiagram
  participant P as Paciente
  participant R as Recepcionista
  participant T as Triagem
  participant Med as Profissional
  participant S as Sistema

  P->>R: Chega na clínica
  R->>S: Check-in (busca por CPF)
  S-->>S: Cria WaitingRoom card "Aguardando Triagem"
  T->>S: Registra sinais vitais e queixa
  S-->>Med: Notificação "Paciente pronto"
  Med->>S: Inicia atendimento
  S-->>S: Status → "Em Atendimento"
  Med->>S: Encerra, registra evolução SOAP
  S-->>S: Status → "Aguarda Saída"
  R->>S: Cobra (PDV)
  S->>S: Emite NFS-e via fiscal-api
  S-->>P: Recibo por WhatsApp
  </div>
</div>
`
});
