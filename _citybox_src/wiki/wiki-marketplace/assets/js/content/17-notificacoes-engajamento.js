WIKI.register({
  id: 'notificacoes-engajamento',
  title: 'Notificações e Engajamento',
  icon: '🔔',
  searchText: 'notificacoes engajamento push email WhatsApp worker notifications eventos citybox.order RabbitMQ jornada mensagens FCM APNS OneSignal templates',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Pedido e Pós-venda</div>
    <h1 class="section-title">🔔 Notificações e Engajamento</h1>
    <p class="section-subtitle">Notificações são o canal de comunicação entre o Marketplace e o consumidor ao longo de toda a jornada — do pedido ao pós-venda. Um bom sistema de notificações aumenta retenção, reduz suporte e cria engajamento proativo.</p>
    <div class="section-tags">
      <span class="tag-indigo">Push FCM/APNS</span>
      <span class="tag-blue">Email</span>
      <span class="tag-green">WhatsApp</span>
      <span class="tag-violet">workers :3105</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">🟠 Hoje</div>
    <p>Workers consomem eventos <code>citybox.order.#</code> do RabbitMQ. A estrutura de eventos existe. O módulo de envio de notificações (push/email/WhatsApp) ainda não está implementado como serviço dedicado — é o próximo passo após o app nativo.</p>
  </div>

  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">💡 Proposta</div>
    <p>Worker de notificações consome fila <code>notifications.*</code>. Envia push (FCM/APNS), email (Resend/SES), WhatsApp (Meta Business API ou Twilio). Templates por canal e idioma. Rate limiting por consumidor. Preferências de notificação configuráveis no app.</p>
  </div>

  <h2>Arquitetura de notificações</h2>
  <div class="mermaid">
flowchart LR
  Events["RabbitMQ\ncitybox.order.#"] --> NW["Notification\nWorker"]
  NW --> Push["Push\nFCM / APNS"]
  NW --> Email["Email\nResend / SES"]
  NW --> WA["WhatsApp\nMeta API"]
  Push --> Device["📱 App consumidor"]
  Email --> Inbox["📧 Caixa de entrada"]
  WA --> Chat["💬 WhatsApp"]
  </div>

  <h2>Jornada de mensagens — ciclo do pedido</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Evento</th><th>Canal</th><th>Mensagem</th><th>Timing</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Pedido criado</td><td>Push + Email</td><td>"Pedido recebido! Aguardando confirmação da loja."</td><td>Imediato</td></tr>
        <tr><td class="td-bold">Pagamento confirmado</td><td>Push + WhatsApp</td><td>"Pagamento aprovado! A loja já recebeu seu pedido ✅"</td><td>+2s após CAPTURED</td></tr>
        <tr><td class="td-bold">Loja em preparo</td><td>Push</td><td>"[Loja] está preparando seu pedido! 🍳"</td><td>Transição PREPARING</td></tr>
        <tr><td class="td-bold">Saiu para entrega</td><td>Push</td><td>"A caminho! ETA: 12 min. Acompanhe no app 🛵"</td><td>Transição DELIVERING</td></tr>
        <tr><td class="td-bold">Entregue</td><td>Push + Email</td><td>"Entregue! Avalie sua experiência ⭐"</td><td>Transição DELIVERED</td></tr>
        <tr><td class="td-bold">Substituição proposta</td><td>Push + WhatsApp</td><td>"A loja substituiu [X] por [Y]. Aceitar ou recusar?"</td><td>Evento substituição</td></tr>
        <tr><td class="td-bold">Cancelado</td><td>Push + Email</td><td>"Pedido cancelado. Estorno em X dias."</td><td>Transição CANCELLED</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Notificações proativas (engajamento)</h2>
  <div class="card-grid">
    <div class="card card-indigo">
      <div class="card-title"><span class="card-icon">🛒</span> Carrinho abandonado</div>
      <p>Push após 1h sem checkout: "Você esqueceu itens no carrinho 🛒 — aproveite antes que acabem!"</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🎁</span> Cupom expirando</div>
      <p>Push 24h antes: "Seu cupom de R$10 expira amanhã. Use agora!"</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">⭐</span> Avaliação pendente</div>
      <p>Push 2h pós-entrega: "Como foi seu pedido? Avalie em 30 segundos."</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🏪</span> Loja favorita abriu</div>
      <p>Push quando loja favorita entra online no horário: "Sua loja favorita acabou de abrir!"</p>
    </div>
  </div>

  <h2>Preferências do consumidor</h2>
  <ul>
    <li>Toggle por tipo: transacional (sempre) | promocional (opt-in) | engajamento (opt-in)</li>
    <li>Horário silencioso (ex.: 22h-8h)</li>
    <li>Canal preferido: push / email / WhatsApp / só app</li>
    <li>Frequência máxima por dia (evitar spam)</li>
  </ul>

  <div class="alert alert-orange">
    <span class="alert-icon">⚠️</span>
    <div class="alert-body">
      <div class="alert-title">LGPD — consentimento de notificações</div>
      <p>Notificações de marketing (cupons, promoções) exigem opt-in explícito conforme LGPD. Notificações transacionais (status do pedido) são base legítima de execução contratual. Implementar base de consentimento no cadastro do consumidor com export e revogação fácil.</p>
    </div>
  </div>
</div>
`
});
