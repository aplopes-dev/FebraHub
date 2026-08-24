WIKI.register({
  id: 'rbac-equipe-market',
  title: 'RBAC e Equipe Market',
  icon: '👥',
  searchText: 'RBAC equipe roles permissoes gerente caixa estoquista vendedor acesso controle usuario market varejo',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Acesso e Configurações</div>
    <h1 class="section-title">👥 RBAC e Equipe — Market</h1>
    <p class="section-subtitle">Controle de acesso baseado em papéis específicos do varejo: gerente, operador de caixa, estoquista e vendedor — mapeados sobre o catálogo de papéis da platform e a proposta de catálogo de permissões market.</p>
    <div class="section-tags">
      <span class="tag-green">RBAC</span>
      <span class="tag-emerald">Gerente · Caixa · Estoquista</span>
      <span class="tag-gray">Permissões</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (Parcialmente Funcional)</div>
    <ul>
      <li>Papéis catalogados em <code>store-role.catalog.ts</code>: <code>gerente</code>, <code>caixa</code>, <code>estoquista</code>, <code>vendedor</code></li>
      <li>Sem catálogo de permissões market (<code>market-permissions.catalog.ts</code>) — proposta</li>
      <li>Sem API de convite e atribuição de papéis para lojas market</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — RBAC Market Completo</div>
    <ul>
      <li>Catálogo de permissões market: ~20 permissões granulares</li>
      <li>Convite por e-mail/WhatsApp com papel pré-definido</li>
      <li>Múltiplos papéis por usuário (ex: gerente da loja A, caixa da loja B)</li>
      <li>Auditoria: log de quem fez o quê (acessou PDV, alterou preço, cancelou venda)</li>
    </ul>
  </div>

  <div class="herda-base-callout">
    <span class="hb-icon">🏪</span>
    <div class="hb-body">
      <div class="hb-title">Herda do ERP Base — RBAC e Equipe Canônicos</div>
      <div class="hb-links">Esta vertical herda: <a href="../wiki-erp/index.html#rbac-permissoes">RBAC e Permissões</a> (StoreRole genérico, guards, JWT) · <a href="../wiki-erp/index.html#equipe-loja">Equipe da Loja</a> (convite Keycloak, listagem, remoção). Esta seção documenta <strong>apenas o delta market</strong>: papéis específicos do varejo (estoquista, conferente) e permissões granulares por módulo market.</div>
    </div>
  </div>

  <h2>Papéis e permissões market</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Papel</th><th>PDV</th><th>Estoque</th><th>Preço</th><th>Compras</th><th>Financeiro</th><th>Config</th></tr></thead>
      <tbody>
        <tr>
          <td class="td-bold">Gerente</td>
          <td class="cap-yes">✅ Total</td><td class="cap-yes">✅ Total</td><td class="cap-yes">✅ Total</td>
          <td class="cap-yes">✅ Total</td><td class="cap-yes">✅ Total</td><td class="cap-yes">✅ Total</td>
        </tr>
        <tr>
          <td class="td-bold">Operador de Caixa</td>
          <td class="cap-yes">✅ Operar</td><td class="cap-na">—</td><td class="cap-na">—</td>
          <td class="cap-na">—</td><td class="cap-opt">Ver caixa</td><td class="cap-na">—</td>
        </tr>
        <tr>
          <td class="td-bold">Estoquista</td>
          <td class="cap-na">—</td><td class="cap-yes">✅ Total</td><td class="cap-opt">Ver</td>
          <td class="cap-opt">Ver/Receber</td><td class="cap-na">—</td><td class="cap-na">—</td>
        </tr>
        <tr>
          <td class="td-bold">Vendedor</td>
          <td class="cap-opt">Consulta</td><td class="cap-opt">Ver</td><td class="cap-opt">Ver</td>
          <td class="cap-na">—</td><td class="cap-na">—</td><td class="cap-na">—</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>Permissões granulares propostas</h2>
  <pre>// apps/platform/api/src/modules/stores/domain/catalog/market-permissions.catalog.ts
export const MARKET_PERMISSIONS = {
  // PDV
  'market.pdv.operate': 'Operar o PDV (vender)',
  'market.pdv.cancel':  'Cancelar venda no PDV',
  'market.pdv.discount': 'Conceder desconto manual',
  'market.pdv.session.open':  'Abrir caixa',
  'market.pdv.session.close': 'Fechar caixa',
  'market.pdv.sangria': 'Realizar sangria/suprimento',

  // Catálogo e Preço
  'market.catalog.view':  'Ver catálogo',
  'market.catalog.edit':  'Editar produtos e preços',
  'market.promo.manage':  'Criar/editar promoções',

  // Estoque
  'market.stock.view':    'Ver estoque',
  'market.stock.adjust':  'Ajustar estoque',
  'market.stock.receive': 'Receber mercadorias (NF-e)',
  'market.stock.inventory': 'Realizar inventário',

  // Compras
  'market.purchase.view':  'Ver pedidos de compra',
  'market.purchase.create': 'Criar pedido de compra',
  'market.purchase.approve': 'Aprovar pedido de compra',

  // Financeiro
  'market.finance.view': 'Ver relatórios financeiros',
  'market.finance.manage': 'Gerenciar contas e fechamento',

  // Configurações
  'market.settings.manage': 'Configurar loja market',
  'market.team.manage': 'Gerenciar equipe e papéis',
};</pre>

  <h2>Auditoria de ações</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">⚠️</span> Ações que exigem auditoria</div>
      <ul>
        <li>Cancelamento de venda</li>
        <li>Desconto manual &gt;10%</li>
        <li>Alteração de preço</li>
        <li>Ajuste de estoque manual</li>
        <li>Sangria/suprimento de caixa</li>
        <li>Exclusão de produto</li>
      </ul>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">📋</span> Log de auditoria</div>
      <p>Campos: <code>userId</code>, <code>action</code>, <code>resource</code>, <code>before</code>, <code>after</code>, <code>ip</code>, <code>timestamp</code>. Retenção: 1 ano. Acessível ao gerente e admin da plataforma.</p>
    </div>
  </div>
</div>
`
});
