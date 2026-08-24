WIKI.register({
  id: 'notificacoes-comunicados',
  title: 'Notificações e Comunicados',
  icon: '🔔',
  searchText: 'notificacoes comunicados whatsapp email sms push lembrete agendamento pedido pagamento template campanha',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Clientes e Engajamento</div>
    <h1 class="section-title">🔔 Notificações e Comunicados</h1>
    <p class="section-subtitle">Notificações transacionais e comunicados de marketing — com WhatsApp como canal central no contexto brasileiro. Cobre lembretes de agendamento, status de pedido, alertas de pagamento e campanhas segmentadas.</p>
    <div class="section-tags">
      <span class="tag-orange">WhatsApp</span>
      <span class="tag-amber">Notificações · Push</span>
      <span class="tag-gray">Comum a todas as verticais</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Marketplace envia notificações básicas de status de pedido por e-mail (via transacional)</li>
      <li>Sem WhatsApp integrado</li>
      <li>Sem módulo de notificações no ERP</li>
      <li>Sem campanhas de comunicação</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>WhatsApp como canal principal: lembretes, confirmações, avisos transacionais</li>
      <li>Fallback automático: WhatsApp → SMS → e-mail</li>
      <li>Templates aprovados pela Meta (HSM) para cada evento transacional</li>
      <li>Gestão de templates no ERP: lojista personaliza texto dentro dos limites do template</li>
      <li>Opt-out automático: link de cancelamento em toda mensagem</li>
      <li>Comunicados em lote: campanha segmentada para clientes (frequentes, inativos, etc.)</li>
      <li>Histórico de mensagens enviadas por cliente</li>
    </ul>
  </div>

  <h2>Arquitetura de notificações</h2>
  <div class="mermaid">
flowchart LR
  subgraph eventos [Eventos de Negócio]
    E1["Pedido confirmado"]
    E2["Agendamento criado"]
    E3["Pagamento aprovado"]
    E4["Slot cancelado"]
    E5["Lembrete (T-24h)"]
  end

  Router["NotificationRouter\n(NestJS Worker)"]

  subgraph canais [Canais]
    WA["WhatsApp\n(Evolution API / 360Dialog)"]
    SMS["SMS\n(Twilio / Zenvia)"]
    Email["E-mail\n(SendGrid / SES)"]
    Push["Push\n(FCM)"]
  end

  eventos --> Router
  Router -->|"preferência + disponibilidade"| WA
  Router -->|"fallback"| SMS
  Router -->|"fallback 2"| Email
  Router -->|"app instalado"| Push
  </div>

  <h2>Eventos transacionais por vertical</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Evento</th><th>Eixo Produto</th><th>Eixo Serviço</th><th>Canal padrão</th></tr></thead>
      <tbody>
        <tr><td>Confirmação de compra/agendamento</td><td>Pedido recebido</td><td>Agendamento confirmado</td><td>WhatsApp</td></tr>
        <tr><td>Lembrete pré-evento</td><td>Previsão de entrega</td><td>24h e 1h antes do horário</td><td>WhatsApp</td></tr>
        <tr><td>Atualização de status</td><td>Em preparo / a caminho</td><td>Profissional a caminho</td><td>WhatsApp</td></tr>
        <tr><td>Pagamento</td><td>Pagamento confirmado</td><td>Cobrança gerada</td><td>WhatsApp / E-mail</td></tr>
        <tr><td>Cancelamento</td><td>Pedido cancelado + motivo</td><td>Slot cancelado + opção de reagendar</td><td>WhatsApp</td></tr>
        <tr><td>No-show</td><td>—</td><td>Aviso de não comparecimento</td><td>WhatsApp</td></tr>
        <tr><td>Nota fiscal</td><td>Link para NF-e/NFC-e</td><td>—</td><td>E-mail</td></tr>
        <tr><td>Fidelidade</td><td>Pontos acumulados</td><td>Pontos acumulados</td><td>WhatsApp / Push</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Gestão de templates no ERP</h2>
  <div class="mockup-container">
    <div class="mock-topbar"><span class="mock-logo" style="color:#fbbf24">🔔 Templates de Notificação</span></div>
    <div class="mock-body">
      <div style="display:flex;gap:8px;margin-bottom:14px;">
        <div style="flex:1;background:white;border:1px solid #e7e5e4;border-radius:8px;padding:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-weight:700;font-size:13px;">✅ Agendamento confirmado</div>
            <span class="mock-badge mock-badge-green">Ativo</span>
          </div>
          <div style="background:#dcfce7;border-radius:6px;padding:10px;font-size:12px;color:#166534;font-family:monospace;">
            Olá {{nome}}! 😊 Seu agendamento foi confirmado.<br><br>
            📅 Data: {{data}}<br>
            ⏰ Horário: {{hora}}<br>
            👤 Profissional: {{profissional}}<br><br>
            Qualquer dúvida, fale conosco: {{link}}
          </div>
          <div style="font-size:11px;color:#a8a29e;margin-top:8px">Canal: WhatsApp · HSM aprovado</div>
        </div>
        <div style="flex:1;background:white;border:1px solid #e7e5e4;border-radius:8px;padding:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-weight:700;font-size:13px;">⏰ Lembrete 24h antes</div>
            <span class="mock-badge mock-badge-green">Ativo</span>
          </div>
          <div style="background:#fef3c7;border-radius:6px;padding:10px;font-size:12px;color:#92400e;font-family:monospace;">
            Oi {{nome}}! 👋 Lembrando que amanhã você tem:<br><br>
            🗓 {{servico}} às {{hora}}<br>
            📍 {{endereco_loja}}<br><br>
            Precisa cancelar? Acesse: {{link_cancelamento}}
          </div>
          <div style="font-size:11px;color:#a8a29e;margin-top:8px">Canal: WhatsApp · Disparo automático T-24h</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="mock-btn mock-btn-primary" style="font-size:12px">+ Novo template</button>
        <button class="mock-btn mock-btn-outline" style="font-size:12px">📊 Métricas de entrega</button>
      </div>
    </div>
  </div>

  <h2>Comunicados em lote (campanhas)</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">🎯</span> Segmentados</div>
      <p>Selecione um segmento (ex: "inativos há 90d") e envie campanha de reativação com oferta personalizada.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">📢</span> Broadcast</div>
      <p>Envio para todos os clientes da loja: avisos de mudança de horário, feriados, novidades do cardápio/serviços.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">📊</span> Métricas</div>
      <p>Taxa de entrega, abertura (acionamentos de link), opt-out. Campanhas com opt-out alto ficam bloqueadas automaticamente.</p>
    </div>
  </div>

  <h2>Integrações WhatsApp no Brasil</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Fornecedor</th><th>Modelo</th><th>Observação</th></tr></thead>
      <tbody>
        <tr><td>Evolution API</td><td>Open-source self-hosted</td><td>Sem custo de API, escala com infra própria</td></tr>
        <tr><td>360dialog</td><td>Business API oficial (Meta)</td><td>Templates HSM aprovados, volume alto</td></tr>
        <tr><td>Zenvia / Take Blip</td><td>Intermediário BR</td><td>Suporte local, compliance LGPD facilitado</td></tr>
        <tr><td>Twilio</td><td>Enterprise global</td><td>Fallback SMS + WhatsApp no mesmo contrato</td></tr>
      </tbody>
    </table>
  </div>
  <p>Integração plugável via interface <code>NotificationChannel</code> — trocar o provedor não impacta a lógica de disparo.</p>
</div>
`
});
