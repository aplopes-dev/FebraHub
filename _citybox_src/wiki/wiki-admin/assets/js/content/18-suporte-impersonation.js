WIKI.register({
  id: 'suporte-impersonation',
  title: 'Suporte e Impersonation',
  icon: '🎭',
  searchText: 'suporte impersonation acessar como lojista mensageria atendimento fila ticket auditoria acesso delegado debug suporte técnico comunicação broadcast',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Acesso, Perfis e Permissões</div>
  <h1 class="section-title">🎭 Suporte e Impersonation</h1>
  <p class="section-subtitle">Ferramentas para o time de suporte Citybox atender o lojista: "acessar como" (impersonation auditada), mensageria direta e fila de atendimento.</p>
  <div class="section-tags">
    <span class="tag-teal">Suporte ao lojista</span>
    <span class="status-badge status-mock">🔴 Mock hoje</span>
    <span class="status-badge status-proposed">🔵 Proposta completa</span>
  </div>
</div>

<div class="blueprint-today">
  <div class="blueprint-today-label">Hoje (MVP)</div>
  <p>Impersonation existe como botão "Acessar como cliente" na tela de detalhe do cliente — mas o handler é apenas <code>console.log</code>. Não há canal de mensageria, fila de suporte, nem histórico de atendimento.</p>
</div>

<h2>Impersonation — proposta</h2>
<div class="blueprint-proposed">
  <div class="blueprint-proposed-label">Proposta (alvo)</div>
  <p>O operador acessa a visão do lojista sem precisar da senha. Token de curta duração (15 min, não renovável). Toda sessão é registrada na auditoria global com motivo obrigatório.</p>
</div>

<div class="mermaid">
sequenceDiagram
  participant Op as Operador Admin
  participant API as Platform API
  participant KC as Keycloak
  participant Audit as Auditoria
  participant ERP as ERP da Loja

  Op->>API: POST /v1/impersonation (storeId, reason)
  API->>Audit: Registra início impersonation
  API->>KC: Gera token delegado (15 min, não renovável)
  KC-->>API: Token impersonation
  API-->>Op: URL ERP + token
  Op->>ERP: Acessa como lojista
  ERP-->>Op: Visão do backoffice + banner suporte
  Op->>API: POST /v1/impersonation/:id/end
  API->>Audit: Registra encerramento
</div>

<h2>Regras de impersonation</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Regra</th><th>Detalhe</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">Quem pode usar</td><td><code>platform_admin</code> e <code>platform_support</code></td></tr>
      <tr><td class="td-bold">Motivo obrigatório</td><td>Campo de texto livre exigido antes de gerar o token ("Suporte ticket #123", "Debug de pedido")</td></tr>
      <tr><td class="td-bold">Duração do token</td><td>15 minutos, não renovável. Operador deve re-solicitar se precisar mais tempo.</td></tr>
      <tr><td class="td-bold">O que é auditado</td><td>Início (quem, loja, motivo, timestamp), encerramento, duração real</td></tr>
      <tr><td class="td-bold">Banner no ERP</td><td>Banner permanente visível ao lojista: "Suporte Citybox está visualizando sua conta"</td></tr>
      <tr><td class="td-bold">Ações bloqueadas</td><td>Em modo impersonation: sem acesso a dados bancários/financeiros do lojista, sem deletar dados críticos</td></tr>
    </tbody>
  </table>
</div>

<h2>Mensageria com lojistas — proposta</h2>
<div class="blueprint-proposed">
  <div class="blueprint-proposed-label">Proposta (alvo)</div>
  <p>Canal de mensageria direto entre operador Citybox e responsável da loja, dentro do admin. Diferente de broadcasts (enviados para todos).</p>
</div>

<div class="card-grid">
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">💬</span> Mensagem direta</div>
    <p>Operador abre conversa com responsável de uma loja específica. Histórico visível no detalhe da loja e na caixa de entrada do lojista no ERP.</p>
    <p><strong>Trigger comum:</strong> cliente at-risk, fatura vencida, loja offline.</p>
  </div>
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">📢</span> Broadcast</div>
    <p>Comunicado enviado para múltiplos lojistas ao mesmo tempo — filtrado por vertical, plano ou status. Ideal para avisos de manutenção, novidades e alertas de cobrança.</p>
    <p>Ver <a href="#notificacoes-comunicados">Notificações e Comunicados</a> para o design completo.</p>
  </div>
  <div class="card card-blue">
    <div class="card-title"><span class="card-icon">📋</span> Fila de suporte</div>
    <p>Tickets abertos pelos lojistas via ERP chegam numa fila no Admin para triagem e resolução. Cada ticket tem SLA configurável por prioridade.</p>
    <p><strong>SLA padrão:</strong> Critical 2h, High 8h, Normal 48h.</p>
  </div>
</div>

<h2>Endpoints propostos</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Método</th><th>Path</th><th>Função</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">POST</td><td><code>/v1/impersonation</code></td><td>Inicia sessão de impersonation (gera token)</td></tr>
      <tr><td class="td-bold">POST</td><td><code>/v1/impersonation/:id/end</code></td><td>Encerra sessão de impersonation</td></tr>
      <tr><td class="td-bold">GET</td><td><code>/v1/impersonation</code></td><td>Histórico de sessões (admin only)</td></tr>
      <tr><td class="td-bold">POST</td><td><code>/v1/messages</code></td><td>Envia mensagem direta para lojista</td></tr>
      <tr><td class="td-bold">GET</td><td><code>/v1/messages/:storeId</code></td><td>Histórico de mensagens com uma loja</td></tr>
      <tr><td class="td-bold">GET</td><td><code>/v1/support/tickets</code></td><td>Lista fila de suporte</td></tr>
      <tr><td class="td-bold">PATCH</td><td><code>/v1/support/tickets/:id</code></td><td>Atualiza status do ticket</td></tr>
    </tbody>
  </table>
</div>
`
});
