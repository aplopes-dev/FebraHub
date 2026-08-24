WIKI.register({
  id: 'pos-venda-suporte',
  title: 'Pós-venda e Suporte',
  icon: '⭐',
  searchText: 'pos-venda suporte rating avaliacao problema substituicao reorder historico pedidos resolucao disputa ticket cancelamento estorno reembolso',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Pedido e Pós-venda</div>
    <h1 class="section-title">⭐ Pós-venda e Suporte</h1>
    <p class="section-subtitle">A experiência pós-entrega define se o consumidor volta. Avaliações, resolução de problemas, reorder 1-clique e suporte in-app são os pilares do pós-venda.</p>
    <div class="section-tags">
      <span class="tag-indigo">Avaliações</span>
      <span class="tag-blue">Suporte in-app</span>
      <span class="tag-violet">Reorder</span>
      <span class="tag-proposed">💡 Proposta</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">🟠 Hoje</div>
    <p>Não há módulo de pós-venda implementado. O modelo de dados possui <code>Order.status=DELIVERED</code> como estado final. Rating e suporte são funcionalidades propostas para versão inicial do app nativo.</p>
  </div>

  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">💡 Proposta completa</div>
    <p>Avaliação pós-entrega (loja + entregador + produto), fluxo de reclamação estruturado, substituição/cancelamento de item, estorno automático ou via suporte, reorder 1-clique, histórico de pedidos com filtros.</p>
  </div>

  <h2>Avaliações</h2>
  <div class="card-grid">
    <div class="card card-indigo">
      <div class="card-title"><span class="card-icon">🏪</span> Avaliação da loja</div>
      <p>1-5 estrelas + comentário livre. Aparece no card da loja na home e na busca. Impacta score de ranking no Typesense.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🛵</span> Avaliação do entregador</div>
      <p>1-5 estrelas. Nota separada da loja. Alimenta módulo de gestão de entregadores no ERP.</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">🍽️</span> Avaliação do produto</div>
      <p>Item a item. Aparece no detalhe da oferta. Ajuda na descoberta e na acurácia do catálogo.</p>
    </div>
  </div>

  <h2>Fluxo de problema / reclamação</h2>
  <div class="mermaid">
flowchart TD
  A["Consumidor reporta problema"] --> B{Tipo?}
  B --> C["Item faltando / errado"]
  B --> D["Produto com defeito / prazo"]
  B --> E["Entrega não chegou"]
  C --> F["Proposta: crédito ou reenvio"]
  D --> F
  E --> G["Verificar GPS entregador\n+ contato loja"]
  F --> H{Consumidor aceita?}
  H -->|Sim| I["Crédito wallet\nou reenvio agendado"]
  H -->|Não| J["Escala para suporte\nhumano (ticket)"]
  G --> J
  </div>

  <h2>Reorder 1-clique</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Passo</th><th>O que acontece</th><th>Edge case</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>Consumidor clica "Pedir novamente" no histórico</td><td>—</td></tr>
        <tr><td>2</td><td>BFF reconstrói carrinho com itens do pedido anterior</td><td>Item descontinuado → omite e notifica</td></tr>
        <tr><td>3</td><td>Verifica disponibilidade e preços atuais</td><td>Preço aumentou → mostra diff antes de adicionar</td></tr>
        <tr><td>4</td><td>Abre tela do carrinho pré-preenchida</td><td>Loja fechada → agenda para quando abrir</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Histórico de pedidos</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Campo exibido</th><th>Dados</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Loja + vertical</td><td><code>SubOrder.storeName</code> + ícone do vertical</td></tr>
        <tr><td class="td-bold">Itens resumidos</td><td>Primeiros 2-3 itens + "e mais N"</td></tr>
        <tr><td class="td-bold">Data e total</td><td><code>Order.createdAt</code> + <code>Order.totalAmount</code></td></tr>
        <tr><td class="td-bold">Status final</td><td>DELIVERED / CANCELLED / FAILED (com ícone colorido)</td></tr>
        <tr><td class="td-bold">Ação</td><td>Reorder | Ver detalhes | Avaliar (se não avaliado)</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-indigo">
    <span class="alert-icon">💡</span>
    <div class="alert-body">
      <div class="alert-title">Impacto do pós-venda na retenção</div>
      <p>Estudos de plataformas de delivery mostram que resolver um problema bem — crédito rápido, sem atrito — resulta em <strong>LTV 2x maior</strong> do que um consumidor que nunca teve problema. Investir em pós-venda automatizado (crédito automático para casos simples) é mais barato que adquirir um novo usuário.</p>
    </div>
  </div>
</div>
`
});
