WIKI.register({
  id: 'integracoes',
  title: 'Integrações',
  icon: '🔗',
  searchText: 'integrações iFood Rappi Stone gateways pagamento PIX boleto conectar configurar status webhook logs desconectar reintegrar',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Lojas</div>
  <h1 class="section-title">🔗 Integrações</h1>
  <p class="section-subtitle">Gestão das integrações externas de cada loja — marketplaces (iFood, Rappi), adquirentes (Stone, Cielo) e gateways de pagamento. Conectar, configurar, monitorar e gerir webhooks.</p>
  <div class="section-tags">
    <span class="tag-teal">iFood · Stone · Gateways</span>
    <span class="status-badge status-partial">🟣 Status read-only hoje</span>
    <span class="status-badge status-proposed">🔵 Gestão completa proposta</span>
  </div>
</div>

<div class="blueprint-today">
  <div class="blueprint-today-label">Hoje (MVP)</div>
  <ul>
    <li>Aba "Integrações" no detalhe da loja existe</li>
    <li>Lista integrações com status (boolean <code>enabled</code>) da tabela <code>store_integrations</code></li>
    <li>Nenhuma ação de conectar/desconectar implementada</li>
    <li>Sem logs de webhook ou monitoramento de saúde da integração</li>
  </ul>
</div>

<div class="blueprint-proposed">
  <div class="blueprint-proposed-label">Proposta (alvo)</div>
  <ul>
    <li>Conectar integração: fluxo de autorização OAuth (iFood) ou entrada de credenciais (Stone)</li>
    <li>Status em tempo real: conectada, desconectada, degradada, autorizando</li>
    <li>Logs de webhook: últimas 100 chamadas recebidas com payload, status e tempo de resposta</li>
    <li>Reenviar webhook: reprocessar evento com erro</li>
    <li>Alertas automáticos quando integração cai (ver Monitoramento)</li>
  </ul>
</div>

<div class="eco-callout">
  <div class="eco-icon">🔗</div>
  <div class="eco-body">
    <div class="eco-title">O Admin conecta; o ERP consome a integração</div>
    <div class="eco-links">
      Aqui o operador conecta/monitora credenciais (OAuth iFood, Stone Code). O lojista usa esses
      canais no ERP — ver <a href="../wiki-erp/wiki-erp/index.html#marketplace-publish">ERP · Publicar no Marketplace</a>,
      <a href="../wiki-erp/wiki-erp/index.html#entrega-frete">ERP · Entrega e Frete</a>
      e o delta de canais em <a href="../wiki-erp/wiki-erp-food/index.html#delivery-integracoes">Food · Delivery e Integrações</a>.
    </div>
  </div>
</div>

<h2>Mockup — Integrações da loja</h2>
<div class="mockup-container">
  <div class="mock-topbar">
    <span class="mock-logo">🔗 Integrações — Padaria Sol</span>
    <span style="margin-left:auto;display:flex;gap:6px;">
      <span class="mock-badge mock-badge-green">3 conectadas</span>
      <span class="mock-badge mock-badge-red">1 com erro</span>
    </span>
  </div>
  <div class="mock-body">
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
      <div class="mock-row" style="background:#fff;border:1px solid var(--border-color);border-radius:8px;padding:10px;"><span>🍔</span><span style="flex:1"><strong>iFood</strong><br><span style="color:var(--text-muted);font-size:11px">Marketplace</span></span><span class="mock-badge mock-badge-green">Conectada</span></div>
      <div class="mock-row" style="background:#fff;border:1px solid var(--border-color);border-radius:8px;padding:10px;"><span>💳</span><span style="flex:1"><strong>Stone</strong><br><span style="color:var(--text-muted);font-size:11px">Adquirente</span></span><span class="mock-badge mock-badge-green">Conectada</span></div>
      <div class="mock-row" style="background:#fff;border:1px solid var(--border-color);border-radius:8px;padding:10px;"><span>🛵</span><span style="flex:1"><strong>Rappi</strong><br><span style="color:var(--text-muted);font-size:11px">Marketplace</span></span><span class="mock-badge mock-badge-red">Erro · token</span></div>
      <div class="mock-row" style="background:#fff;border:1px solid var(--border-color);border-radius:8px;padding:10px;"><span>🏦</span><span style="flex:1"><strong>Cielo</strong><br><span style="color:var(--text-muted);font-size:11px">Gateway</span></span><span class="mock-badge mock-badge-gray">Conectar</span></div>
    </div>
  </div>
</div>
<p class="mermaid-caption">Wireframe ilustrativo da gestão de integrações por loja: status em tempo real (conectada/erro/desconectada), OAuth (iFood) e logs de webhook.</p>

<h2>Integrações suportadas</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Integração</th><th>Tipo</th><th>Status BD</th><th>Configuração necessária</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">iFood</td><td>Marketplace</td><td><span class="status-badge status-partial">🟣</span></td><td>OAuth: merchant ID + token</td></tr>
      <tr><td class="td-bold">Rappi</td><td>Marketplace</td><td><span class="status-badge status-partial">🟣</span></td><td>API Key + store ID</td></tr>
      <tr><td class="td-bold">Stone</td><td>Adquirente / PDV</td><td><span class="status-badge status-partial">🟣</span></td><td>Stone Code + chave de ativação</td></tr>
      <tr><td class="td-bold">Cielo</td><td>Gateway</td><td><span class="status-badge status-proposed">🔵</span></td><td>Merchant ID + chave API</td></tr>
      <tr><td class="td-bold">PagSeguro</td><td>Gateway</td><td><span class="status-badge status-proposed">🔵</span></td><td>E-mail + token PagSeguro</td></tr>
      <tr><td class="td-bold">Stripe</td><td>Gateway SaaS</td><td><span class="status-badge status-proposed">🔵</span></td><td>Account ID (Connect)</td></tr>
    </tbody>
  </table>
</div>

<h2>Fluxo de conexão (iFood)</h2>
<div class="mermaid">
sequenceDiagram
  participant Op as Operador Admin
  participant API as Platform API
  participant iFood as iFood API

  Op->>API: POST /v1/stores/:id/integrations/ifood/connect
  API->>iFood: Inicia OAuth flow
  iFood-->>API: Authorization URL
  API-->>Op: Redireciona para iFood
  Op->>iFood: Autoriza acesso
  iFood-->>API: Callback com code
  API->>iFood: Troca code por tokens
  iFood-->>API: access_token + refresh_token
  API->>API: Salva em store_integrations
  API-->>Op: Integração conectada!
</div>

<h2>Modelo de dados — store_integrations</h2>
<pre><code>model StoreIntegration {
  id              String   @id
  storeId         String
  provider        String   // 'ifood' | 'stone' | 'rappi' | ...
  enabled         Boolean
  status          String   // 'connected' | 'disconnected' | 'error' | 'pending'
  config          Json     // credenciais encriptadas
  lastSyncAt      DateTime?
  lastErrorAt     DateTime?
  lastErrorMessage String?
  store           Store    @relation(fields: [storeId], references: [id])
}</code></pre>
`
});
