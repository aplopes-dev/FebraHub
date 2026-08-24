WIKI.register({
  id: 'benchmark-marketplace',
  title: 'Benchmark — Mercado',
  icon: '🏆',
  searchText: 'benchmark mercado ifood rappi mercado livre wolt quick commerce latam marketplace consumer delivery grocery pharma multivertical capacidades comparativo',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Introdução</div>
    <h1 class="section-title">🏆 Benchmark — Mercado Consumer</h1>
    <p class="section-subtitle">Análise dos principais marketplaces de delivery e varejo digital do Brasil e LATAM. Cada plataforma traz aprendizados diretos para o produto Citybox.</p>
    <div class="section-tags">
      <span class="tag-indigo">iFood</span>
      <span class="tag-blue">Rappi</span>
      <span class="tag-violet">Mercado Livre</span>
      <span class="tag-purple">Wolt</span>
      <span class="tag-amber">Quick Commerce</span>
    </div>
  </div>

  <h2>Visão comparativa — capacidades-chave</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Capacidade</th>
          <th>iFood</th>
          <th>Rappi</th>
          <th>Mercado Livre</th>
          <th>Wolt</th>
          <th>Citybox (meta)</th>
        </tr>
      </thead>
      <tbody>
        <tr><td class="td-bold">Busca product-first multi-loja</td><td class="cap-opt">🔶</td><td class="cap-opt">🔶</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅ meta</td></tr>
        <tr><td class="td-bold">Carrinho multiloja unificado</td><td class="cap-na">—</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-na">—</td><td class="cap-yes">✅ meta</td></tr>
        <tr><td class="td-bold">Checkout 1-clique (cartão salvo)</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-opt">🔶 parcial</td></tr>
        <tr><td class="td-bold">PIX nativo</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-na">—</td><td class="cap-yes">✅ meta</td></tr>
        <tr><td class="td-bold">Rastreio realtime mapa</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-opt">🔶</td><td class="cap-yes">✅</td><td class="cap-opt">🔶 proposta</td></tr>
        <tr><td class="td-bold">Reorder 1-clique</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-opt">🔶 roadmap</td></tr>
        <tr><td class="td-bold">Fidelidade / cashback</td><td class="cap-yes">✅ iFood Clube</td><td class="cap-yes">✅ RappiPrime</td><td class="cap-yes">✅ Mercado Pontos</td><td class="cap-na">—</td><td class="cap-opt">🔶 roadmap</td></tr>
        <tr><td class="td-bold">Multi-vertical (food + grocery + farma)</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-opt">🔶</td><td class="cap-yes">✅ meta</td></tr>
        <tr><td class="td-bold">Quick commerce (&lt;15 min)</td><td class="cap-opt">🔶 iFood Turbo</td><td class="cap-yes">✅ Rappi Turbo</td><td class="cap-na">—</td><td class="cap-yes">✅ Wolt+</td><td class="cap-opt">🔶 v2</td></tr>
        <tr><td class="td-bold">Personalização ML (feed/ranking)</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-opt">🔶 v2</td></tr>
        <tr><td class="td-bold">Substituições inteligentes</td><td class="cap-opt">🔶</td><td class="cap-yes">✅</td><td class="cap-opt">🔶</td><td class="cap-yes">✅</td><td class="cap-opt">🔶 roadmap</td></tr>
        <tr><td class="td-bold">Agendamento de entrega</td><td class="cap-yes">✅</td><td class="cap-opt">🔶</td><td class="cap-yes">✅</td><td class="cap-opt">🔶</td><td class="cap-yes">✅ (scheduling-api)</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Perfis dos líderes</h2>
  <div class="card-grid">
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">🔴</span> iFood</div>
      <p><strong>Líder BR, 60M+ pedidos/mês.</strong> Estratégia: capilaridade (toda cidade), fintech (iFood Pago), expansão grocery/farma. Tendência: clube de assinatura, super-app, logística própria (iFood Entregador).</p>
    </div>
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">🟠</span> Rappi</div>
      <p><strong>LATAM, modelo Turbo.</strong> Micro-fulfillment (dark store 10 min), cross-selling agressivo, RappiPrime assinatura. Diferencial: quick commerce e nichos premium; carrinhos multi-segmento na mesma cesta.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🟡</span> Mercado Livre</div>
      <p><strong>Ecosistema integrado.</strong> Mercado Envios + Mercado Pago = logística + pagamento próprios. Busca product-first entre lojas. Ponto forte: rating, confiança, proteção ao comprador. Ponto fraco: experiência mobile menos fluida que delivery-native.</p>
    </div>
    <div class="card card-indigo">
      <div class="card-title"><span class="card-icon">🔵</span> Wolt</div>
      <p><strong>Busca product-first ML.</strong> Interface elegante, busca por produto navega entre lojas automaticamente (ex.: "vodka" → lojas que têm). Rastreio real-time classe A. Adquirida por DoorDash 2022; expansão para grocery.</p>
    </div>
  </div>

  <h2>Aprendizados para o Citybox</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Aprendizado</th><th>Fonte</th><th>Aplicação no Citybox</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Busca product-first multi-loja</td><td>Wolt, Mercado Livre</td><td>Coleção <code>offers</code> no Typesense — o consumidor busca produto e vê qual loja tem disponível</td></tr>
        <tr><td class="td-bold">Carrinho multiloja unificado</td><td>Rappi</td><td><code>Cart</code> Redis+PG com array de items por loja; split no checkout → SubOrders</td></tr>
        <tr><td class="td-bold">Checkout sem fricção</td><td>Todos</td><td>C-05 orquestrado; cartão salvo; PIX com QR inline; fees transparentes antes de confirmar</td></tr>
        <tr><td class="td-bold">Substituições</td><td>Rappi, Wolt</td><td>Items alternativos pré-sugeridos pela loja quando produto esgota pós-confirmação</td></tr>
        <tr><td class="td-bold">Reorder 1-clique</td><td>iFood, Rappi</td><td>Histórico de pedidos → "pedir novamente" reabre carrinho com últimos itens</td></tr>
        <tr><td class="td-bold">Fidelidade + clube</td><td>iFood Clube, RappiPrime</td><td>Módulo cashback/pontos; cupons por vertical; assinatura premium com frete grátis</td></tr>
        <tr><td class="td-bold">On-shelf accuracy</td><td>Quick commerce LATAM</td><td>MarketplaceAvailability projetado em tempo real do ERP; alerta de indisponibilidade antes do checkout</td></tr>
        <tr><td class="td-bold">Multi-vertical no mesmo app</td><td>iFood grocery + farma</td><td>CatalogItem polimórfico (FOOD/RETAIL/SERVICE/CLINIC/BEAUTY) na mesma busca</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-indigo">
    <span class="alert-icon">🎯</span>
    <div class="alert-body">
      <div class="alert-title">Posicionamento Citybox</div>
      <p>O Citybox não compete globalmente — é o marketplace <strong>municipal</strong>: todas as lojas da cidade (food, varejo, serviços, clínicas, beleza) num único app. A vantagem é conhecimento hiperlocal, relação direta com o lojista e ausência de take-rate voraz de grandes players. Trajetória: busca product-first + checkout orquestrado + app nativo como base; fidelidade + quick commerce como diferenciação.</p>
    </div>
  </div>
</div>
`
});
