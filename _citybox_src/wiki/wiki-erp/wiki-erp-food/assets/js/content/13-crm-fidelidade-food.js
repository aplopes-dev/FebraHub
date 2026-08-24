WIKI.register({
  id: 'crm-fidelidade-food',
  title: 'CRM e Fidelidade',
  icon: '🤝',
  searchText: 'crm clientes fidelidade preferencias alergias pedidos frequentes programa pontos cashback historico alimentar',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Clientes e Marketplace</div>
    <h1 class="section-title">🤝 CRM e Fidelidade</h1>
    <p class="section-subtitle">Gestão de relacionamento com clientes de restaurante: preferências alimentares, alergias, histórico de pedidos, programa de fidelidade e reativação de clientes inativos.</p>
    <div class="section-tags">
      <span class="tag-red">CRM Food</span>
      <span class="tag-orange">Fidelidade</span>
      <span class="tag-gray">Alergias · Preferências</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Modelo <code>Customer</code> genérico no marketplace-api: nome, telefone, e-mail, endereços</li>
      <li>Histórico de pedidos vinculado ao cliente</li>
      <li>Permissão <code>crm:view</code> e <code>crm:manage</code> definidas no catálogo food</li>
      <li>Sem preferências alimentares, alergias ou programa de fidelidade</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — CRM Food</div>
    <ul>
      <li>Perfil estendido: preferências alimentares (vegano, sem glúten, etc.) e alergias</li>
      <li>Histórico rico: frequência, itens favoritos, ticket médio, última visita</li>
      <li>Segmentação: clientes inativos (+30 dias), aniversariantes, top spenders</li>
      <li>Programa de fidelidade: pontos por real gasto, cashback, selos (ex.: "compre 10, ganhe 1")</li>
      <li>Comunicação: campanha por segmento via WhatsApp/push</li>
      <li>Avaliações: coleta de NPS após a entrega, resposta do gerente</li>
    </ul>
  </div>

  <div class="herda-base-callout">
    <span class="hb-icon">🏪</span>
    <div class="hb-body">
      <div class="hb-title">Herda do ERP Base — CRM e Fidelidade Canônicos</div>
      <div class="hb-links">Esta vertical herda: <a href="../wiki-erp/index.html#clientes-crm">CRM de Clientes</a> (perfil, histórico, segmentação base) · <a href="../wiki-erp/index.html#fidelidade">Programa de Fidelidade</a> (pontos, cashback, tiers, clube). Esta seção documenta <strong>apenas o delta food</strong>: preferências alimentares, alergias, selos de cartão fidelidade food e cashback delivery.</div>
    </div>
  </div>

  <h2>Perfil do cliente food</h2>
  <pre>{
  "customer": {
    "id": "uuid",
    "name": "Ana Souza",
    "phone": "+55 51 9 9876-5432",
    "email": "ana@email.com",
    "foodPreferences": ["vegetariano", "sem_lactose"],
    "allergies": ["amendoim", "frutos_do_mar"],
    "loyaltyPoints": 1240,
    "totalOrders": 47,
    "totalSpent": 234700,
    "avgTicket": 4993,
    "lastOrderAt": "2026-06-18T19:30:00Z",
    "favoriteItems": ["uuid-x-veggie", "uuid-suco-laranja"],
    "birthday": "1990-03-15"
  }
}</pre>

  <h2>Programa de Fidelidade</h2>
  <div class="card-grid">
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">⭐</span> Pontos por gasto</div>
      <p>1 ponto por R$1 gasto. 100 pontos = R$5 de desconto. Expiram em 90 dias sem uso.</p>
    </div>
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">☕</span> Cartão Fidelidade</div>
      <p>Compre 9, ganhe 1 grátis (item configurável). Popular em cafeterias e lanchonetes.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">💰</span> Cashback</div>
      <p>3% do valor volta como crédito para próxima compra. Estimula recorrência.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🎂</span> Brinde Aniversário</div>
      <p>Item gratuito no mês de aniversário. Ativa automaticamente + cupom via WhatsApp.</p>
    </div>
  </div>

  <h2>Segmentação e campanhas</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Segmento</th><th>Critério</th><th>Ação sugerida</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Clientes inativos</td><td>Sem pedido há +30 dias</td><td>Cupom 15% de desconto via WhatsApp</td></tr>
        <tr><td class="td-bold">Aniversariantes do mês</td><td>Data de nascimento no mês atual</td><td>Brinde + mensagem personalizada</td></tr>
        <tr><td class="td-bold">Top spenders</td><td>Ticket médio acima de R$80</td><td>Convite para programa VIP</td></tr>
        <tr><td class="td-bold">Novos clientes</td><td>Primeiro pedido há menos de 7 dias</td><td>Boas-vindas + dica de item favorito</td></tr>
        <tr><td class="td-bold">Clientes veganos</td><td>Preferência: vegetariano/vegano</td><td>Comunicar novos itens do menu vegano</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
