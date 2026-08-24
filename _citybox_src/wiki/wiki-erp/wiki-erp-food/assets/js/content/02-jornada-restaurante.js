WIKI.register({
  id: 'jornada-restaurante',
  title: 'Jornada do Restaurante',
  icon: '🗺️',
  searchText: 'jornada restaurante balcao mesa salao delivery modos servico fluxo operacional canais pedido ciclo',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Introdução</div>
    <h1 class="section-title">🗺️ Jornada do Restaurante</h1>
    <p class="section-subtitle">Os três modos de serviço que a vertical Food precisa suportar — balcão (QSR), mesa/salão (dine-in) e delivery — com seus fluxos operacionais e como o ERP orquestra cada um.</p>
    <div class="section-tags">
      <span class="tag-red">3 Modos</span>
      <span class="tag-orange">Balcão · Mesa · Delivery</span>
      <span class="tag-gray">Fluxo Operacional</span>
    </div>
  </div>

  <h2>Os três modos de serviço</h2>
  <div class="card-grid">
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">🏃</span> Modo Balcão (QSR)</div>
      <p>Cliente chega, pede no balcão ou quiosque. Operador lança no PDV. Cozinha produz. Cliente retira. Ciclo rápido (3-10 min). Foco: velocidade, impressão de senha, KDS, NFC-e automático.</p>
    </div>
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">🍽️</span> Modo Mesa (Dine-in)</div>
      <p>Garçom abre comanda por mesa. Lança itens ao longo da refeição. Cozinha recebe via KDS. Garçom fecha a conta (com split se necessário). Ciclo longo (45-120 min). Foco: comanda aberta, course firing, divisão de conta.</p>
    </div>
    <div class="card card-rose">
      <div class="card-title"><span class="card-icon">🛵</span> Modo Delivery</div>
      <p>Pedido via marketplace Citybox ou apps externos (iFood, Rappi). Cozinha produz. Entregador recolhe. Ciclo médio (30-60 min). Foco: hub centralizado, rastreamento, sync bidirecional de cardápio.</p>
    </div>
  </div>

  <h2>Fluxo operacional — Modo Mesa</h2>
  <div class="mermaid">
sequenceDiagram
  participant G as Garçom (ERP)
  participant S as Salão (mapa)
  participant K as KDS (Cozinha)
  participant C as Cliente
  participant P as PDV/Caixa
  participant F as Fiscal

  G->>S: Abre mesa 5 (scan QR ou manual)
  S->>G: Comanda #2501 criada
  C->>G: Pede: X-Burguer + Refrigerante
  G->>K: Lança itens → KDS exibe na estação
  K->>G: Bump (prato pronto)
  G->>C: Serve o prato
  C->>G: Pede sobremesa (adiciona à comanda)
  G->>K: Lança sobremesa
  K->>G: Bump sobremesa
  G->>C: Serve + fecha comanda
  C->>P: Paga (dinheiro/cartão/PIX)
  P->>F: Emite NFC-e automaticamente
  F->>C: Envia cupom fiscal por e-mail/WhatsApp
  </div>

  <h2>Fluxo operacional — Modo Delivery</h2>
  <div class="mermaid">
flowchart LR
  subgraph canais [Canais de Entrada]
    App["App Citybox\n(marketplace)"]
    IFood["iFood / Rappi\n(hub externo)"]
    WhatsApp["WhatsApp\n(via chatbot)"]
  end

  Hub["Hub de Pedidos\n(ERP Food)"]
  KDS["KDS / Impressora\n(cozinha)"]
  Entregador["Entregador\n(próprio ou terceiro)"]
  Cliente["📱 Cliente"]

  App --> Hub
  IFood --> Hub
  WhatsApp --> Hub
  Hub -->|"exibe pedido"| KDS
  Hub -->|"notifica"| Entregador
  KDS -->|"bump pronto"| Hub
  Hub -->|"status: a caminho"| Cliente
  Entregador -->|"confirma entrega"| Hub
  Hub -->|"emite NF-e"| Cliente
  </div>

  <h2>Ciclo de status por modo</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Status</th><th>Balcão</th><th>Mesa</th><th>Delivery</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">PENDING</td><td>PDV lança pedido</td><td>Garçom abre comanda</td><td>Pedido recebido do app</td></tr>
        <tr><td class="td-bold">CONFIRMED</td><td>Auto (pagamento imediato)</td><td>Garçom confirma lançamento</td><td>Loja aceita (até 5 min)</td></tr>
        <tr><td class="td-bold">PREPARING</td><td>KDS recebe ticket</td><td>KDS por estação</td><td>KDS recebe para delivery</td></tr>
        <tr><td class="td-bold">READY</td><td>Senha chamada</td><td>Garçom notificado</td><td>Entregador acionado</td></tr>
        <tr><td class="td-bold">DISPATCHED</td><td>—</td><td>—</td><td>Saiu para entrega</td></tr>
        <tr><td class="td-bold">DELIVERED</td><td>Cliente retirou</td><td>Mesa fechada + pago</td><td>Entregador confirmou</td></tr>
        <tr><td class="td-bold">CLOSED</td><td>NFC-e emitida</td><td>NF-e emitida</td><td>NF-e emitida</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Perfis de estabelecimento</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tipo</th><th>Modo principal</th><th>Módulos críticos</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Restaurante à la carte</td><td>Mesa</td><td>Salão/comandas, course firing, KDS, split conta</td></tr>
        <tr><td class="td-bold">Fast food / lanchonete</td><td>Balcão</td><td>PDV rápido, KDS de balcão, senha, NFC-e automático</td></tr>
        <tr><td class="td-bold">Dark kitchen / delivery-only</td><td>Delivery 100%</td><td>Hub delivery, KDS, embalagem, tracking entregador</td></tr>
        <tr><td class="td-bold">Hamburgueria / pizzaria</td><td>Balcão + delivery</td><td>Modificadores (ponto carne, bordas), cardápio com combos, KDS</td></tr>
        <tr><td class="td-bold">Cafeteria / padaria</td><td>Balcão + PDV</td><td>PDV rápido, estoque de insumos (pão, café), NFC-e</td></tr>
        <tr><td class="td-bold">Franquia / rede</td><td>Todos</td><td>Cardápio central, CMV por loja, relatórios consolidados</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
