WIKI.register({
  id: 'fidelidade-promocoes',
  title: 'Fidelidade e Promoções',
  icon: '🎁',
  searchText: 'fidelidade promocoes pontos cashback cupons ofertas personalizadas clube assinatura premium retencao LTV ticket medio recompensa programa loyalty',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Engajamento</div>
    <h1 class="section-title">🎁 Fidelidade e Promoções</h1>
    <p class="section-subtitle">Um programa de fidelidade bem desenhado aumenta frequência de compra, ticket médio e retenção. iFood Clube, RappiPrime e Mercado Pontos são referências — Citybox pode adaptar para o contexto municipal.</p>
    <div class="section-tags">
      <span class="tag-indigo">Cashback</span>
      <span class="tag-blue">Pontos</span>
      <span class="tag-violet">Cupons</span>
      <span class="tag-purple">Clube Premium</span>
      <span class="tag-proposed">💡 Proposta</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">🟠 Hoje</div>
    <p>Não há módulo de fidelidade implementado. A estrutura financeira do split (payment-api) permite calcular e reservar cashback como porcentagem da taxa de serviço. A infraestrutura de wallet (créditos Citybox) está prevista como complemento do pagamento.</p>
  </div>

  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">💡 Proposta</div>
    <p>Pontos Citybox por compra (X pontos por real gasto). Cashback por vertical ou loja parceira. Cupons de desconto (valor fixo / %) por segmento de consumidor ou evento. Clube premium com frete grátis + desconto fixo. Ofertas personalizadas por histórico.</p>
  </div>

  <h2>Modelos de fidelidade — benchmarks</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Modelo</th><th>Exemplo</th><th>Mecânica</th><th>Fit Citybox</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Cashback</td><td>RappiPrime</td><td>% do pedido retorna como crédito na próxima compra</td><td class="cap-yes">✅ Alto</td></tr>
        <tr><td class="td-bold">Pontos por gasto</td><td>Mercado Pontos</td><td>1 ponto por R$1 gasto; resgate em descontos/produtos</td><td class="cap-opt">🔶 Médio</td></tr>
        <tr><td class="td-bold">Clube assinatura</td><td>iFood Clube</td><td>Taxa mensal → frete grátis + desconto fixo por pedido</td><td class="cap-opt">🔶 Depende de escala</td></tr>
        <tr><td class="td-bold">Cupons segmentados</td><td>Todos</td><td>Desconto por vertical, loja, dia da semana, volume</td><td class="cap-yes">✅ Alto</td></tr>
        <tr><td class="td-bold">Gamificação</td><td>Wolt (selos)</td><td>Badges por número de pedidos, explorar novas lojas</td><td class="cap-opt">🔶 V2</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Cupons — modelo de dados</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Campo</th><th>Tipo</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>code</code></td><td>string (único)</td><td>Código do cupom (ex.: BEMVINDO10)</td></tr>
        <tr><td class="td-bold"><code>type</code></td><td>enum</td><td>PERCENT | FIXED | FRETE_GRATIS</td></tr>
        <tr><td class="td-bold"><code>value</code></td><td>decimal</td><td>10 (para 10% ou R$10)</td></tr>
        <tr><td class="td-bold"><code>scope</code></td><td>enum</td><td>GLOBAL | VERTICAL | STORE | FIRST_ORDER</td></tr>
        <tr><td class="td-bold"><code>minOrder</code></td><td>decimal</td><td>Valor mínimo do pedido para aplicar</td></tr>
        <tr><td class="td-bold"><code>maxUses</code></td><td>int</td><td>Limite total de usos (null = ilimitado)</td></tr>
        <tr><td class="td-bold"><code>usesPerUser</code></td><td>int</td><td>Usos por consumidor (ex.: 1 = uso único)</td></tr>
        <tr><td class="td-bold"><code>validUntil</code></td><td>timestamp</td><td>Expiração</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Impacto esperado (benchmark)</h2>
  <div class="card-grid">
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">📈</span> Retenção</div>
      <p>Clube de assinatura reduz churn em ~40% — consumidor que paga mensalidade compra mais para "amortizar" o custo.</p>
    </div>
    <div class="card card-indigo">
      <div class="card-title"><span class="card-icon">🛒</span> Ticket médio</div>
      <p>Cashback percentual incentiva pedidos maiores ("gasto mais agora para ganhar mais de volta"). iFood Clube reporta +18% de ticket.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🔁</span> Frequência</div>
      <p>Cupons de "volta" (ex.: "use em 7 dias") encurtam o ciclo entre pedidos. Eficazes em verticais com menor frequência (ex.: beleza, clinic).</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">🌱</span> Novos verticais</div>
      <p>Cupons de cross-vertical ("experimente o mercado com R$5 off") estimulam o consumidor food a comprar em outras verticais.</p>
    </div>
  </div>

  <div class="alert alert-indigo">
    <span class="alert-icon">💡</span>
    <div class="alert-body">
      <div class="alert-title">Recomendação para Citybox MVP de fidelidade</div>
      <p>Começar com <strong>cupons</strong> (baixo custo de infra, alto impacto imediato) + <strong>cashback simples</strong> (% do pedido vai para wallet Citybox). Clube premium pode ser fase 2 após atingir 1.000+ pedidos/mês para justificar proposta de valor. Ponto central: integrar cashback ao payment-api split antes de lançar.</p>
    </div>
  </div>
</div>
`
});
