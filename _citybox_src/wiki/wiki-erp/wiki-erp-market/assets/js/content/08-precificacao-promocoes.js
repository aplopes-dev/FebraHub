WIKI.register({
  id: 'precificacao-promocoes',
  title: 'Precificação e Promoções',
  icon: '💰',
  searchText: 'precificacao preco margem promocoes leve pague atacarejo desconto etiqueta gondola formacao custo markup',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Catálogo e Preço</div>
    <h1 class="section-title">💰 Precificação e Promoções</h1>
    <p class="section-subtitle">Motor de formação de preço com markup sobre custo, gestão de promoções (leve-X-pague-Y, desconto por volume, atacarejo), etiquetas de gôndola e controle de margem por categoria.</p>
    <div class="section-tags">
      <span class="tag-green">Preço</span>
      <span class="tag-emerald">Margem · Markup</span>
      <span class="tag-amber">Promoções</span>
      <span class="tag-gray">Etiqueta Gôndola</span>
    </div>
  </div>

  <div class="herda-base-callout">
    <span class="hb-icon">🏪</span>
    <div class="hb-body">
      <div class="hb-title">Herda do ERP Base — Preço por Canal do Catálogo</div>
      <div class="hb-links">Esta vertical herda do <a href="../wiki-erp/index.html#catalogo">Catálogo</a> o <code>basePrice</code> e o <code>channelPrices</code> (preço por canal). Esta seção documenta <strong>apenas o delta market</strong>: motor de formação de preço (custo + markup), CMP, motor de promoções (leve-X-pague-Y, atacarejo) e etiqueta de gôndola — recursos que não existem como módulo dedicado na base.</div>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje</div>
    <ul>
      <li><code>CatalogItem.basePrice</code> (base) — preço fixo em centavos, sem margens ou promoções</li>
      <li>Sem motor de promoções, sem etiqueta de gôndola</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Precificação e Promoções Varejo</div>
    <ul>
      <li>Formação de preço: custo de entrada + markup (%) = preço de venda sugerido</li>
      <li>Histórico de custo: custo médio ponderado (CMP) atualizado a cada recebimento</li>
      <li>Promoções por SKU, departamento ou grupo de produtos</li>
      <li>Tipos de promoção: desconto simples, leve-X-pague-Y, preço de atacado por CNPJ, kit</li>
      <li>Vigência: data início, data fim, dias da semana, horário</li>
      <li>Etiqueta de gôndola: impressão em lote com QR code e preço por unidade/kg</li>
      <li>Alerta de margem negativa: produto abaixo do custo sinaliza antes de salvar</li>
    </ul>
  </div>

  <h2>Formação de preço</h2>
  <div class="mockup-container">
    <div class="mock-topbar"><span class="mock-logo">💰 Formação de Preço — Arroz Camil 5kg</span></div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12px">
        <div style="background:#fff;border:1px solid #d1fae5;border-radius:8px;padding:12px">
          <div style="font-weight:700;margin-bottom:8px">📥 Custo</div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0fdf4">
            <span>Custo de compra</span><span style="font-weight:700">R$18,40</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0fdf4">
            <span>Impostos s/ compra (PIS+COFINS)</span><span>+ R$1,47</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0fdf4">
            <span>Frete estimado</span><span>+ R$0,60</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-weight:700;color:#047857">
            <span>Custo total</span><span>R$20,47</span>
          </div>
        </div>
        <div style="background:#fff;border:1px solid #d1fae5;border-radius:8px;padding:12px">
          <div style="font-weight:700;margin-bottom:8px">📤 Preço de Venda</div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0fdf4">
            <span>Markup alvo</span><span>22%</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0fdf4">
            <span>Preço sugerido</span><span style="font-weight:700">R$24,97</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0fdf4">
            <span>Preço praticado</span>
            <input style="width:70px;border:1px solid #6ee7b7;border-radius:4px;padding:2px 6px;font-size:11px" value="24,90" />
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-weight:700;color:#059669">
            <span>Margem real</span><span>21,7%</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <h2>Tipos de promoção</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tipo</th><th>Configuração</th><th>Exemplo</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Desconto simples</td><td>% ou valor fixo sobre preço</td><td>Coca-Cola 2L: 15% off</td></tr>
        <tr><td class="td-bold">Leve-X-Pague-Y</td><td>Qtd para pagar / Qtd para levar</td><td>Leve 3, pague 2 (cerveja 350ml)</td></tr>
        <tr><td class="td-bold">Preço atacado</td><td>Preço especial acima de N unidades</td><td>Arroz 5kg: R$22 p/ quem comprar 5+</td></tr>
        <tr><td class="td-bold">Preço por CNPJ</td><td>Preço diferenciado para pessoa jurídica</td><td>Preço de atacado p/ compras c/ CNPJ</td></tr>
        <tr><td class="td-bold">Kit / combo</td><td>2+ produtos com desconto combinado</td><td>Macarrão + molho = R$7,90 o kit</td></tr>
        <tr><td class="td-bold">Clube de desconto</td><td>Preço especial para membros do clube</td><td>Sócio paga R$20,90 (regular R$24,90)</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Etiqueta de gôndola</h2>
  <pre>┌─────────────────────────────────┐
│  🛒 Citybox Market               │
│  Arroz Tipo 1 Camil 5kg          │
│                                  │
│   R$ 24,90  ┊  R$ 4,98/kg        │
│                                  │
│  ████████████████                │
│  7896006704094                   │
│                   Vál: 30/12/25  │
└─────────────────────────────────┘
Impressão em lote: todos os produtos
do departamento que tiveram preço alterado</pre>
</div>
`
});
