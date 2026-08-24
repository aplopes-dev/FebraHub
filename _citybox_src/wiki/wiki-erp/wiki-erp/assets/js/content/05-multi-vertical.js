WIKI.register({
  id: 'multi-vertical',
  title: 'Plataforma Multi-Vertical',
  icon: '🔌',
  searchText: 'multi-vertical plugin manifest capabilities vertical registro food market beauty clinic erp shell',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Plataforma e Shell</div>
    <h1 class="section-title">🔌 Plataforma Multi-Vertical</h1>
    <p class="section-subtitle">Como o ERP Shell suporta múltiplos segmentos de negócio sem acoplamento — registro de verticais, capabilities matrix e como uma nova vertical se integra ao sistema.</p>
    <div class="section-tags">
      <span class="tag-orange">Shell</span>
      <span class="tag-amber">Multi-Vertical</span>
      <span class="tag-gray">Plugin Architecture</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Verticais registradas via manifests em <code>apps/erp/src/features/{vertical}/lib/navigation.ts</code> (ex: <code>varejo/lib/navigation.ts</code>, <code>food/lib/navigation.ts</code>)</li>
      <li>Apenas <strong>Food</strong> tem API funcional (<code>apps/verticals/food/api</code>)</li>
      <li>Varejo (<em>market</em>) aparece no registro mas é placeholder</li>
      <li>Shell roteado por <code>/apps/erp/src/app/[vertical]/</code></li>
      <li>BFF proxies hardcoded: <code>/api/proxy/core</code> e <code>/api/proxy/food</code></li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Vertical manifest JSON carregado dinamicamente por store type</li>
      <li>BFF proxy genérico: <code>/api/proxy/[vertical]</code> → URL resolvida por env</li>
      <li>Feature flags por vertical: enable/disable módulos sem deploy</li>
      <li>Sidebar contextual gerada pelo manifest da vertical ativa</li>
      <li>Onboarding de nova vertical: registrar manifest + criar vertical-api</li>
    </ul>
  </div>

  <h2>Registro atual de verticais</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>ID</th><th>Nome</th><th>Ícone</th><th>API Status</th><th>ERP Status</th></tr></thead>
      <tbody>
        <tr><td><code>food</code></td><td>Food &amp; Bebidas</td><td>🍔</td><td><span class="status-badge status-functional">✅ Funcional</span></td><td><span class="status-badge status-mock">⚠ 80% Mock</span></td></tr>
        <tr><td><code>market</code></td><td>Varejo</td><td>🛒</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td><span class="status-badge status-partial">🔧 Estrutura base</span></td></tr>
        <tr><td><code>beauty</code></td><td>Beauty / Estética</td><td>💇</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
        <tr><td><code>clinic</code></td><td>Clínica / Saúde</td><td>🏥</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
        <tr><td><code>services</code></td><td>Serviços</td><td>🔧</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
        <tr><td><code>legal</code></td><td>Legal / Jurídico</td><td>⚖️</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
        <tr><td><code>realty</code></td><td>Imobiliário</td><td>🏡</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
        <tr><td><code>hospitality</code></td><td>Hotelaria</td><td>🏨</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
        <tr><td><code>education</code></td><td>Educação</td><td>📚</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
        <tr><td><code>subscriptions</code></td><td>Assinaturas</td><td>🔄</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
        <tr><td><code>events</code></td><td>Eventos</td><td>🎪</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
        <tr><td><code>rental</code></td><td>Locação</td><td>🚗</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
      </tbody>
    </table>
  </div>

  <h2>Capabilities matrix — módulos comuns vs. específicos</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Módulo</th>
          <th>Food</th><th>Market</th><th>Beauty</th><th>Clinic</th>
          <th>Services</th><th>Hospitality</th><th>Education</th>
        </tr>
      </thead>
      <tbody>
        <tr><td class="td-bold">Catálogo / Produtos</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td></tr>
        <tr><td class="td-bold">Pedidos</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-opt">OS</td><td class="cap-opt">Cons.</td><td class="cap-opt">OS</td><td class="cap-yes">✓</td><td class="cap-opt">Matr.</td></tr>
        <tr><td class="td-bold">PDV / Frente Caixa</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-opt">—</td><td class="cap-opt">—</td><td class="cap-opt">—</td><td class="cap-opt">—</td><td class="cap-opt">—</td></tr>
        <tr><td class="td-bold">KDS / Produção</td><td class="cap-yes">✓</td><td class="cap-opt">—</td><td class="cap-opt">—</td><td class="cap-opt">—</td><td class="cap-opt">—</td><td class="cap-opt">—</td><td class="cap-opt">—</td></tr>
        <tr><td class="td-bold">Agendamento</td><td class="cap-opt">—</td><td class="cap-opt">—</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td></tr>
        <tr><td class="td-bold">Estoque</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-opt">—</td><td class="cap-opt">—</td><td class="cap-yes">✓</td><td class="cap-opt">—</td><td class="cap-opt">—</td></tr>
        <tr><td class="td-bold">Fiscal (NF-e/NFC-e)</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-opt">NFS-e</td><td class="cap-yes">✓</td><td class="cap-opt">—</td><td class="cap-opt">—</td></tr>
        <tr><td class="td-bold">Financeiro / DRE</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td></tr>
        <tr><td class="td-bold">Entrega / Frete</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-opt">—</td><td class="cap-opt">—</td><td class="cap-yes">✓</td><td class="cap-opt">—</td><td class="cap-opt">—</td></tr>
        <tr><td class="td-bold">RBAC / Equipe</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Como registrar uma nova vertical (proposta)</h2>
  <pre>// verticals/my-vertical/manifest.json
{
  "id": "beauty",
  "name": "Beauty & Estética",
  "icon": "💇",
  "color": "#a855f7",
  "apiBaseUrl": "BEAUTY_API_URL",
  "capabilities": {
    "catalog": true,
    "scheduling": true,
    "inventory": false,
    "pdv": false,
    "kds": false,
    "fiscal": true,
    "delivery": false
  },
  "nav": [
    { "id": "agenda", "label": "Agenda", "icon": "📅", "path": "/agenda" },
    { "id": "clientes", "label": "Clientes", "icon": "👥", "path": "/clientes" },
    { "id": "servicos", "label": "Serviços", "icon": "💅", "path": "/catalogo" }
  ]
}</pre>
  <p>O shell lê o manifest e monta a sidebar contextual. O BFF resolve <code>BEAUTY_API_URL</code> via env. Nenhum código hardcoded no shell por vertical.</p>

  <h2>Roadmap de suporte multi-vertical</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Fase</th><th>Ação</th><th>Prioridade</th></tr></thead>
      <tbody>
        <tr><td>v0 (MVP)</td><td>Food funcional, manifest estático</td><td><span class="tag-p1">P1</span></td></tr>
        <tr><td>v1</td><td>BFF proxy genérico + manifest dinâmico</td><td><span class="tag-p1">P1</span></td></tr>
        <tr><td>v1</td><td>Feature flags por capability</td><td><span class="tag-p2">P2</span></td></tr>
        <tr><td>v2</td><td>Market: módulos reais — catálogo, estoque, PDV</td><td><span class="tag-p1">P1</span></td></tr>
        <tr><td>v2</td><td>Beauty / Clinic scheduling</td><td><span class="tag-p2">P2</span></td></tr>
        <tr><td>v3</td><td>Todas 12 verticais cobertas</td><td><span class="tag-p3">P3</span></td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
