WIKI.register({
  id: 'jornada-consumidor',
  title: 'Jornada do Consumidor',
  icon: '🗺️',
  searchText: 'jornada consumidor discovery busca loja carrinho checkout pagamento rastreio pos-venda reorder fluxo completo estados',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Introdução</div>
    <h1 class="section-title">🗺️ Jornada do Consumidor</h1>
    <p class="section-subtitle">Do primeiro acesso ao reorder: os passos do comprador no Marketplace Citybox, com o estado atual de cada etapa e o blueprint do produto completo.</p>
    <div class="section-tags">
      <span class="tag-indigo">Discovery</span>
      <span class="tag-blue">Checkout</span>
      <span class="tag-violet">Rastreio</span>
      <span class="tag-purple">Pós-venda</span>
    </div>
  </div>

  <h2>Fluxo macro</h2>
  <div class="mermaid">
flowchart LR
  A["🏠 Home\nDiscovery"] --> B["🔍 Busca\nProduto/Loja"]
  B --> C["🏪 Loja\nVitrine/Oferta"]
  C --> D["🛒 Carrinho\nMultiloja"]
  D --> E["💳 Checkout\nOrquestrado"]
  E --> F["🏦 Pagamento\nSplit"]
  F --> G["📦 Acompanha\nPedido"]
  G --> H["⭐ Pós-venda\nRating"]
  H --> I["🔁 Reorder\n1-clique"]
  </div>

  <h2>Detalhamento por etapa</h2>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Etapa</th>
          <th>O que o consumidor faz</th>
          <th>Endpoint / Serviço</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td><td class="td-bold">🏠 Home / Discovery</td>
          <td>Vê feed de lojas próximas, promoções, verticais, pedidos recentes</td>
          <td><code>BFF GET /v1/app/home</code> + <code>/categories</code></td>
          <td><span class="status-badge status-functional">✅ Funcional</span></td>
        </tr>
        <tr>
          <td>2</td><td class="td-bold">🔍 Busca</td>
          <td>Digita produto → vê em qual loja está disponível (product-first)</td>
          <td><code>BFF GET /v1/app/search</code> → Typesense <code>offers</code></td>
          <td><span class="status-badge status-functional">✅ Funcional</span></td>
        </tr>
        <tr>
          <td>3</td><td class="td-bold">🏪 Página da loja</td>
          <td>Navega catálogo da loja, vê horário/status, destaque de ofertas</td>
          <td><code>BFF GET /v1/app/stores/:id</code> + <code>/offers/:id</code></td>
          <td><span class="status-badge status-functional">✅ Funcional</span></td>
        </tr>
        <tr>
          <td>4</td><td class="td-bold">🛒 Carrinho</td>
          <td>Adiciona items de uma ou mais lojas; vê fees e subtotais por loja</td>
          <td><code>BFF POST /v1/app/cart</code> (Redis + PG)</td>
          <td><span class="status-badge status-functional">✅ Funcional</span></td>
        </tr>
        <tr>
          <td>5</td><td class="td-bold">💳 Checkout</td>
          <td>Confirma endereço, forma de pagamento, cupom; vê breakdown de taxas</td>
          <td>C-05: validate → reserve → create orders[] (proposta)</td>
          <td><span class="status-badge status-partial">🔶 Parcial</span></td>
        </tr>
        <tr>
          <td>6</td><td class="td-bold">🏦 Pagamento</td>
          <td>PIX, cartão salvo ou wallet; tela de confirmação/QR inline</td>
          <td><code>Core POST /v1/orders/:id/checkout</code> → payment-api</td>
          <td><span class="status-badge status-partial">🔶 Parcial</span></td>
        </tr>
        <tr>
          <td>7</td><td class="td-bold">📦 Acompanhamento</td>
          <td>Linha do tempo do pedido; mapa do entregador; push notifications</td>
          <td>realtime-gateway :3104 + workers</td>
          <td><span class="status-badge status-proposed">💡 Proposta</span></td>
        </tr>
        <tr>
          <td>8</td><td class="td-bold">⭐ Pós-venda</td>
          <td>Avalia pedido/loja/entregador; reporta problema; solicita substituição</td>
          <td>—</td>
          <td><span class="status-badge status-proposed">💡 Proposta</span></td>
        </tr>
        <tr>
          <td>9</td><td class="td-bold">🔁 Reorder</td>
          <td>Clica "pedir novamente" no histórico → carrinho reabre com itens anteriores</td>
          <td><code>BFF GET /v1/app/orders/history</code> → reconstituição</td>
          <td><span class="status-badge status-proposed">💡 Proposta</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>Missões do consumidor</h2>
  <div class="card-grid">
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">🍔</span> Fome agora</div>
      <p>Pede comida de restaurante próximo. Jornada ultra-rápida: home → restaurante → carrinho → checkout &lt;3 min. Crítico: ETA preciso e rastreio.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🛒</span> Reposição de estoque</div>
      <p>Compra mercado/supermercado para a semana. Busca product-first, cesta grande, preço importa. Crítico: on-shelf accuracy e substituições.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">💊</span> Urgência / saúde</div>
      <p>Remédio urgente ou consulta. Crítico: disponibilidade em tempo real, velocidade de entrega, informação de produto confiável.</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">✂️</span> Serviço agendado</div>
      <p>Agendar salão/clínica. Jornada diferente: não tem entrega, tem data/hora. Crítico: scheduling-api + confirmação bidirecional.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🎁</span> Presença / ocasião</div>
      <p>Compra para presente ou evento. Quer curadoria de lojas e produtos, opção de embalagem, mensagem personalizada. Ticket médio maior.</p>
    </div>
  </div>

  <h2>Pontos de fricção a eliminar (benchmark)</h2>
  <ul>
    <li><strong>Cadastro/login longo</strong> — OAuth social (Google/Apple) no app nativo + SSO Keycloak</li>
    <li><strong>Susto de taxa no checkout</strong> — exibir frete + serviço + fees desde o carrinho (transparência iFood/Rappi)</li>
    <li><strong>Item indisponível pós-pedido</strong> — <code>MarketplaceAvailability</code> projetado em tempo real; substituições pré-definidas</li>
    <li><strong>Pagamento que falha sem feedback</strong> — estados claros: processando → aprovado → recusado → tentar de novo</li>
    <li><strong>Sem rastreio após confirmar</strong> — push + WebSocket assim que loja confirma; mapa do entregador na fase de entrega</li>
  </ul>
</div>
`
});
