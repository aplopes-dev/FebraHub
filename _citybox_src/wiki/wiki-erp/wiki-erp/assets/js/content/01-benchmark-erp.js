WIKI.register({
  id: 'benchmark-erp',
  title: 'Benchmark de ERPs / POS',
  icon: '📊',
  searchText: 'benchmark toast square lightspeed linx bling omie odoo matriz lacunas comparativo',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Introdução</div>
    <h1 class="section-title">📊 Benchmark de ERPs / POS</h1>
    <p class="section-subtitle">Análise comparativa dos principais sistemas de ERP e POS do mercado global e brasileiro. Mapeamos o que há de melhor em cada plataforma para definir as features prioritárias do Citybox ERP.</p>
    <div class="section-tags">
      <span class="tag-orange">Benchmark</span>
      <span class="tag-amber">Toast · Square · Lightspeed</span>
      <span class="tag-amber">Linx · Bling · Omie · Odoo</span>
    </div>
  </div>

  <h2>Plataformas analisadas</h2>

  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">🍞</span> Toast POS</div>
      <p><strong>Foco:</strong> Restaurantes full-service EUA. Destaque: KDS nativo, handheld tableside ordering, course/seat management, modo offline com Toast Router, 200+ integrações. Payroll nativo. US$69-165/mês por loja.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">◼</span> Square for Restaurants</div>
      <p><strong>Foco:</strong> PME. Destaque: entrada gratuita, KDS incluso no plano Plus, split de conta, floor plans interativos, simplicidade extrema. Sem mensalidade no plano básico.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">⚡</span> Lightspeed Restaurant</div>
      <p><strong>Foco:</strong> Multi-loja, fine dining. Destaque: analytics best-in-class (attachment rate, table turn time, menu engineering), gestão de recipe-level inventory, conceitos híbridos varejo+food.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🇧🇷</span> Linx POS (BR)</div>
      <p><strong>Foco:</strong> Varejo brasileiro. Destaque: PDV alto desempenho (50k+ transações/dia), promoções complexas (leve 3 pague 2), multi-filial com replicação, governança fiscal multi-estado, fidelidade nativa.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">💼</span> Bling / Tiny</div>
      <p><strong>Foco:</strong> E-commerce e PME BR. Destaque: NF-e/NFC-e em poucos cliques, integração nativa com Mercado Livre/Shopee/Shopify, financeiro/DRE básico, API robusta, preço acessível.</p>
    </div>
    <div class="card card-purple">
      <div class="card-title"><span class="card-icon">🔷</span> Omie ERP</div>
      <p><strong>Foco:</strong> PME contábil BR. Destaque: integração contábil direta, conciliação bancária OFX, CRM embutido, relatórios gerenciais, módulo de projetos, ecossistema de parceiros contábeis.</p>
    </div>
    <div class="card card-indigo">
      <div class="card-title"><span class="card-icon">🔵</span> Odoo Community</div>
      <p><strong>Foco:</strong> ERP open-source completo. Destaque: single source of truth (POS+estoque+contábil+CRM+RH), device-agnostic, offline-first, omnichannel, módulos ilimitados por app store.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🌐</span> PosBytz / Revel</div>
      <p><strong>Foco:</strong> Multi-vertical SaaS. Destaque: arquitetura offline-first com sync automático, gestão de múltiplas marcas/brands em uma conta, analytics unificado cross-vertical.</p>
    </div>
  </div>

  <h2>Matriz de lacunas — Citybox vs. mercado</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Feature</th>
          <th>Toast</th>
          <th>Square</th>
          <th>Lightspeed</th>
          <th>Linx</th>
          <th>Bling</th>
          <th>Odoo</th>
          <th><strong>Citybox Hoje</strong></th>
          <th><strong>Citybox Alvo</strong></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="td-bold">KDS / Display de Cozinha</td>
          <td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-opt">—</td><td class="cap-opt">—</td><td class="cap-opt">—</td>
          <td><span class="status-badge status-proposed">💡 Proposta</span></td>
          <td><span class="tag-p1">P1</span> Real-time WebSocket</td>
        </tr>
        <tr>
          <td class="td-bold">PDV Offline-first</td>
          <td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-opt">—</td><td class="cap-yes">✓</td>
          <td><span class="status-badge status-proposed">💡 Proposta</span></td>
          <td><span class="tag-p1">P1</span> SQLite local + sync</td>
        </tr>
        <tr>
          <td class="td-bold">Fiscal NF-e / NFC-e</td>
          <td class="cap-opt">—</td><td class="cap-opt">—</td><td class="cap-opt">—</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td>
          <td><span class="status-badge status-proposed">💡 Proposta</span></td>
          <td><span class="tag-p1">P1</span> PlugNotas API</td>
        </tr>
        <tr>
          <td class="td-bold">Analytics avançado</td>
          <td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">★★★</td><td class="cap-yes">✓</td><td class="cap-opt">Básico</td><td class="cap-yes">✓</td>
          <td><span class="status-badge status-mock">⚠ Mock</span></td>
          <td><span class="tag-p2">P2</span> Menu engineering, turn time</td>
        </tr>
        <tr>
          <td class="td-bold">Multi-loja / Multi-marca</td>
          <td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td>
          <td><span class="status-badge status-partial">🔶 Parcial</span></td>
          <td><span class="tag-p1">P1</span> Seleção + cross-store</td>
        </tr>
        <tr>
          <td class="td-bold">Promoções complexas</td>
          <td class="cap-yes">✓</td><td class="cap-opt">Básico</td><td class="cap-yes">✓</td><td class="cap-yes">★★★</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td>
          <td><span class="status-badge status-proposed">💡 Proposta</span></td>
          <td><span class="tag-p2">P2</span> Engine de promoções</td>
        </tr>
        <tr>
          <td class="td-bold">Conciliação bancária</td>
          <td class="cap-opt">—</td><td class="cap-opt">—</td><td class="cap-opt">—</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td>
          <td><span class="status-badge status-proposed">💡 Proposta</span></td>
          <td><span class="tag-p2">P2</span> Open Banking OFX</td>
        </tr>
        <tr>
          <td class="td-bold">RBAC granular</td>
          <td class="cap-yes">✓</td><td class="cap-opt">Básico</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-opt">Básico</td><td class="cap-yes">✓</td>
          <td><span class="status-badge status-functional">✅ Funcional</span> (Food)</td>
          <td><span class="tag-p1">P1</span> Extensão todas verticais</td>
        </tr>
        <tr>
          <td class="td-bold">Devices / SmartPOS / Impressoras</td>
          <td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-opt">—</td><td class="cap-yes">✓</td>
          <td><span class="status-badge status-proposed">💡 Proposta</span></td>
          <td><span class="tag-p1">P1</span> WebUSB + pairing</td>
        </tr>
        <tr>
          <td class="td-bold">Agendamento / Slots</td>
          <td class="cap-opt">—</td><td class="cap-yes">✓</td><td class="cap-opt">—</td><td class="cap-opt">—</td><td class="cap-opt">—</td><td class="cap-yes">✓</td>
          <td><span class="status-badge status-proposed">💡 Proposta</span></td>
          <td><span class="tag-p2">P2</span> Beauty/Clinic/Rental</td>
        </tr>
        <tr>
          <td class="td-bold">Fidelidade / Loyalty</td>
          <td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">✓</td><td class="cap-yes">★★★</td><td class="cap-opt">—</td><td class="cap-yes">✓</td>
          <td><span class="status-badge status-proposed">💡 Proposta</span></td>
          <td><span class="tag-p2">P2</span> Pontos + cashback</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>Features de destaque a adotar por inspiração</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">🍞</span> De Toast: Modo offline híbrido</div>
      <p>Toast Router mantém o PDV operacional mesmo sem internet — transações em fila local com sync automático ao reconectar. <span class="tag-p1">P1</span></p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">⚡</span> De Lightspeed: Menu engineering</div>
      <p>Dashboard de performance do cardápio: itens campeões, itens perdedores, margin vs. popularidade. Informa decisões de pricing. <span class="tag-p2">P2</span></p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🇧🇷</span> De Linx: Promoções progressivas</div>
      <p>"Leve 3 pague 2", desconto por volume, combo de produtos, horário de happy-hour. Engine de regras flexível com priority. <span class="tag-p2">P2</span></p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">💼</span> De Bling: NF-e em 1 clique</div>
      <p>Emissão de NF-e / NFC-e a partir do pedido aprovado, com DANFE gerado, armazenamento e consulta de XML. <span class="tag-p1">P1</span></p>
    </div>
    <div class="card card-purple">
      <div class="card-title"><span class="card-icon">🔷</span> De Omie: Conciliação OFX</div>
      <p>Upload de extrato bancário OFX, matching automático com recebimentos, relatório de diferenças. <span class="tag-p2">P2</span></p>
    </div>
    <div class="card card-indigo">
      <div class="card-title"><span class="card-icon">🔵</span> De Odoo: Single source of truth</div>
      <p>Pedido → estoque → fiscal → financeiro em pipeline atômico. Uma operação no POS atualiza todas as camadas sem duplicação. <span class="tag-p1">P1</span></p>
    </div>
  </div>

  <h2>Padrões transversais identificados</h2>
  <ul>
    <li><strong>Offline-first:</strong> Todos os líderes de mercado operam sem internet e sincronizam ao reconectar.</li>
    <li><strong>Real-time operacional:</strong> KDS, floor plan e painel de pedidos atualizam em &lt;500ms.</li>
    <li><strong>Single source of truth:</strong> POS, estoque, financeiro e fiscal derivam do mesmo evento de pedido.</li>
    <li><strong>Analytics como produto:</strong> Dashboards de performance de menu, conversão, ticket médio e churn são diferenciais de retenção.</li>
    <li><strong>Omnichannel nativo:</strong> Delivery, balcão, mesa e e-commerce convergem para o mesmo pipeline de pedidos.</li>
    <li><strong>Device-agnostic:</strong> Funciona em SmartPOS, iPad, Android e desktop sem código separado.</li>
  </ul>
</div>
`
});
