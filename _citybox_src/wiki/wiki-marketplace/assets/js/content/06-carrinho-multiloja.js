WIKI.register({
  id: 'carrinho-multiloja',
  title: 'Carrinho Multiloja',
  icon: '🛒',
  searchText: 'carrinho multiloja cesta unificada Redis Postgres substituicoes fees transparentes taxa servico entrega subtotal por loja Cart CartItem storeGroup BFF',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Carrinho e Checkout</div>
    <h1 class="section-title">🛒 Carrinho Multiloja</h1>
    <p class="section-subtitle">O consumidor pode adicionar produtos de múltiplas lojas na mesma sessão. O carrinho mantém a cesta unificada e exibe fees por loja de forma transparente — garantindo clareza antes do checkout.</p>
    <div class="section-tags">
      <span class="tag-indigo">Redis + PG</span>
      <span class="tag-blue">BFF /v1/app/cart</span>
      <span class="tag-violet">Multiloja</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">🟢 Hoje (MVP)</div>
    <p>BFF expõe <code>GET /v1/app/cart</code>, <code>POST /v1/app/cart/items</code>, <code>PATCH /v1/app/cart/items/:id</code>, <code>DELETE /v1/app/cart/items/:id</code>. Carrinho armazenado em Redis (sessão) e persistido em Postgres (<code>Cart</code> + <code>CartItem</code>) para recuperação pós-logout. Já suporta múltiplas lojas na mesma cesta.</p>
  </div>

  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">💡 Proposta (produto alvo)</div>
    <p>UI do carrinho com grupos por loja, subtotais separados, fees de entrega discriminados, cupom/desconto, estimativa de ETA total. Sugestão de substituição quando item fica indisponível pós-adição. Carrinho persistente entre dispositivos (sync via PG). Aviso de ticket mínimo por loja.</p>
  </div>

  <h2>Estrutura do carrinho</h2>
  <div class="mermaid">
flowchart TD
  Cart["Cart\nid, userId, status, totalAmount"]
  Cart --> G1["StoreGroup A\nstoreId=loja1\nsubtotal=R$42"]
  Cart --> G2["StoreGroup B\nstoreId=loja2\nsubtotal=R$28"]
  G1 --> I1["CartItem\nofferId, qty, price, name"]
  G1 --> I2["CartItem\nofferId, qty, price, name"]
  G2 --> I3["CartItem\nofferId, qty, price, name"]
  </div>

  <h2>Modelo de dados — Cart</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tabela</th><th>Campo</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td rowspan="6" class="td-bold"><code>Cart</code></td><td><code>id</code></td><td>UUID</td></tr>
        <tr><td><code>userId</code></td><td>Consumidor (nullable para sessão anônima)</td></tr>
        <tr><td><code>sessionId</code></td><td>Para carrinhos anônimos (Redis TTL 24h)</td></tr>
        <tr><td><code>status</code></td><td>ACTIVE | CHECKOUT_STARTED | CONVERTED | ABANDONED</td></tr>
        <tr><td><code>totalAmount</code></td><td>Soma de todos os items + fees (calculado)</td></tr>
        <tr><td><code>updatedAt</code></td><td>Para detectar carrinho abandonado (remarketing)</td></tr>
        <tr><td rowspan="6" class="td-bold"><code>CartItem</code></td><td><code>cartId</code></td><td>FK para Cart</td></tr>
        <tr><td><code>offerId</code></td><td>FK para MarketplaceOffer</td></tr>
        <tr><td><code>storeId</code></td><td>Para agrupamento por loja</td></tr>
        <tr><td><code>qty</code></td><td>Quantidade</td></tr>
        <tr><td><code>unitPrice</code></td><td>Preço no momento da adição (snapshot)</td></tr>
        <tr><td><code>notes</code></td><td>Observações do consumidor</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Fees — transparência</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Taxa</th><th>Cálculo</th><th>Quem define</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Taxa de entrega</td><td>Por loja: faixa de distância + modal de entrega</td><td>Lojista/plataforma no ERP</td></tr>
        <tr><td class="td-bold">Taxa de serviço</td><td>% sobre subtotal da loja (ex.: 5%)</td><td>Plataforma Citybox</td></tr>
        <tr><td class="td-bold">Ticket mínimo</td><td>Subtotal da loja &lt; mínimo? Aviso antes do checkout</td><td>Lojista define no ERP</td></tr>
        <tr><td class="td-bold">Desconto de cupom</td><td>Valor fixo ou % sobre total ou loja específica</td><td>Módulo fidelidade</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Substituições</h2>
  <div class="card-grid">
    <div class="card card-indigo">
      <div class="card-title"><span class="card-icon">🔄</span> Pré-checkout</div>
      <p>Se disponibilidade muda entre adição e checkout: BFF verifica <code>MarketplaceAvailability</code> ao iniciar checkout. Item indisponível → destaca no carrinho com alternativas sugeridas.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">⚡</span> Pós-confirmação</div>
      <p>Lojista não tem o item em estoque após aceitar pedido. ERP notifica → worker → push para consumidor com opção de aceitar substituição ou cancelar o item.</p>
    </div>
  </div>

  <h2>Carrinho abandonado</h2>
  <p>Carrinhos com <code>status=ACTIVE</code> e <code>updatedAt</code> há mais de 1h são candidatos a recuperação:</p>
  <ul>
    <li>Push notification: "Você deixou itens no carrinho 🛒"</li>
    <li>Email de carrinho abandonado (módulo notificações)</li>
    <li>TTL Redis: 24h para sessões anônimas; PG persiste indefinidamente para usuários autenticados</li>
  </ul>

  <div class="alert alert-indigo">
    <span class="alert-icon">💡</span>
    <div class="alert-body">
      <div class="alert-title">Por que snapshot do preço é crítico</div>
      <p>O <code>unitPrice</code> é salvo no momento da adição ao carrinho, não relido em tempo real. Se o lojista alterar o preço, o item no carrinho mantém o preço do momento da adição. Na tela de checkout, o BFF verifica se houve alteração de preço e alerta o consumidor — decisão de produto: aceitar ou recalcular.</p>
    </div>
  </div>
</div>
`
});
