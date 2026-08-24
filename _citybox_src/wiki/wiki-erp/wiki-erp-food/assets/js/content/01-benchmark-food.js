WIKI.register({
  id: 'benchmark-food',
  title: 'Benchmark — ERPs de Alimentação',
  icon: '📊',
  searchText: 'benchmark toast square lightspeed saipos goomer linx degust anota ai ifood delivery hub kds menu engineering food cost',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Introdução</div>
    <h1 class="section-title">📊 Benchmark — ERPs de Alimentação</h1>
    <p class="section-subtitle">Análise comparativa dos principais sistemas de gestão para restaurantes — globais e brasileiros — para definir as features prioritárias da vertical Food do Citybox.</p>
    <div class="section-tags">
      <span class="tag-red">Benchmark</span>
      <span class="tag-orange">Toast · Square · Lightspeed</span>
      <span class="tag-rose">Saipos · Goomer · Linx Degust</span>
    </div>
  </div>

  <h2>Plataformas analisadas</h2>
  <div class="card-grid">
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">🍞</span> Toast POS (EUA)</div>
      <p><strong>Foco:</strong> Full-service e fast-casual. Destaques: KDS nativo com roteamento por estação e course firing, tableside ordering (Toast Go 2 handheld), offline-first (router local), split check, 200+ integrações (DoorDash, Uber Eats, 7shifts). Payroll nativo. US$69-165/mês.</p>
    </div>
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">◼</span> Square for Restaurants (EUA/BR)</div>
      <p><strong>Foco:</strong> PME, cafés, QSR. Destaques: floor plan interativo (arrastar mesas), KDS incluso no plano Plus, split conta, modo offline, plano básico gratuito. Mais simples que Toast, sem course firing nativo.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">⚡</span> Lightspeed Restaurant</div>
      <p><strong>Foco:</strong> Multi-loja, fine dining. Destaques: <strong>menu engineering</strong> best-in-class (attachment rate, item profitability matrix), recipe-level inventory (ficha técnica com variação de CMV), relatório de table turn time, suporte a conceitos híbridos varejo+food.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🇧🇷</span> Saipos (BR)</div>
      <p><strong>Foco:</strong> Delivery + dine-in BR. Destaques: <strong>hub de delivery</strong> para iFood/Rappi/Uber Eats (pedidos centralizados), KDS integrado, cardápio digital mobile, impressão automática na cozinha, relatórios de delivery. Líder em processamento iFood integrado.</p>
    </div>
    <div class="card card-rose">
      <div class="card-title"><span class="card-icon">📱</span> Goomer / Anota Aí (BR)</div>
      <p><strong>Foco:</strong> Cardápio digital + delivery próprio. Destaques: QR code na mesa para auto-atendimento, cardápio com foto e adicionais, pedido direto via WhatsApp, integração iFood, taxa zero sobre pedidos próprios, fácil configuração.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🏭</span> Linx Degust (BR)</div>
      <p><strong>Foco:</strong> Franquias e redes. Destaques: gestão centralizada de cardápio para múltiplas unidades, CMV por prato, controle de desperdício, integração com ERPs financeiros (Linx ERP), relatórios de custos por loja.</p>
    </div>
  </div>

  <h2>Matriz de capacidades — comparativo</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Capacidade</th><th>Toast</th><th>Square</th><th>Lightspeed</th><th>Saipos</th><th>Goomer</th><th>Citybox (alvo)</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">KDS com roteamento por estação</td><td class="cap-yes">✅</td><td class="cap-opt">Básico</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-na">—</td><td class="cap-opt">P1</td></tr>
        <tr><td class="td-bold">Course firing (envio por etapas)</td><td class="cap-yes">✅</td><td class="cap-na">—</td><td class="cap-yes">✅</td><td class="cap-na">—</td><td class="cap-na">—</td><td class="cap-opt">P2</td></tr>
        <tr><td class="td-bold">Cardápio com modificadores</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-opt">P1</td></tr>
        <tr><td class="td-bold">Fichas técnicas / CMV</td><td class="cap-yes">✅</td><td class="cap-na">—</td><td class="cap-yes">✅</td><td class="cap-opt">Básico</td><td class="cap-na">—</td><td class="cap-opt">P1</td></tr>
        <tr><td class="td-bold">Hub delivery (iFood + outros)</td><td class="cap-opt">EUA</td><td class="cap-opt">Parcial</td><td class="cap-opt">Parcial</td><td class="cap-yes">✅ Líder BR</td><td class="cap-yes">✅</td><td class="cap-opt">P1</td></tr>
        <tr><td class="td-bold">QR code mesa (auto-atendimento)</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-opt">Parcial</td><td class="cap-yes">✅</td><td class="cap-opt">P1</td></tr>
        <tr><td class="td-bold">Split de conta</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-opt">Básico</td><td class="cap-na">—</td><td class="cap-opt">P2</td></tr>
        <tr><td class="td-bold">PDV offline-first</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-na">—</td><td class="cap-opt">P1</td></tr>
        <tr><td class="td-bold">Fiscal NFC-e BR</td><td class="cap-na">—</td><td class="cap-na">—</td><td class="cap-na">—</td><td class="cap-yes">✅</td><td class="cap-opt">Parcial</td><td class="cap-opt">P1</td></tr>
        <tr><td class="td-bold">Menu engineering (attachment rate)</td><td class="cap-opt">Básico</td><td class="cap-na">—</td><td class="cap-yes">✅ Best-in-class</td><td class="cap-opt">Básico</td><td class="cap-na">—</td><td class="cap-opt">P2</td></tr>
        <tr><td class="td-bold">Integração multi-loja/franquia</td><td class="cap-yes">✅</td><td class="cap-opt">Básico</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-opt">Básico</td><td class="cap-opt">P2</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Principais aprendizados para o Citybox Food</h2>
  <div class="card-grid">
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">🏆</span> Must-have BR (P1)</div>
      <ul>
        <li>Hub delivery centralizado (iFood é ~70% do volume de muitos restaurantes)</li>
        <li>KDS para cozinhas com 2+ estações — elimina papel impresso</li>
        <li>NFC-e para PDV — obrigatório fiscal para varejo alimentar</li>
        <li>Cardápio com fotos, adicionais e preço por canal</li>
        <li>Offline-first: queda de internet não pode parar a operação</li>
      </ul>
    </div>
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">💡</span> Diferencial v2 (P2)</div>
      <ul>
        <li>Menu engineering (inspirado no Lightspeed): quais itens têm maior margem e popularidade</li>
        <li>Ficha técnica com CMV em tempo real — poucos sistemas BR oferecem isso bem</li>
        <li>Course firing para restaurantes de serviço completo</li>
        <li>QR code mesa + auto-atendimento sem garçom (reduz custo operacional)</li>
      </ul>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🚀</span> Vantagem nativa Citybox</div>
      <ul>
        <li>Marketplace próprio sem comissão (vs 12-27% iFood)</li>
        <li>Multi-vertical: food + beauty + clinic no mesmo login do lojista</li>
        <li>Tecnologia moderna: Next.js + NestJS + realtime WebSocket nativo</li>
        <li>SaaS multi-tenant com hierarquia município → organização → loja</li>
      </ul>
    </div>
  </div>
</div>
`
});
