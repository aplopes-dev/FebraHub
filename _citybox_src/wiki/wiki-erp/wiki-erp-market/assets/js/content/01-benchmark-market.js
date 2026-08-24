WIKI.register({
  id: 'benchmark-market',
  title: 'Benchmark — ERPs de Varejo',
  icon: '📊',
  searchText: 'benchmark totvs consinco linx microvix sg sistemas ciss omie bling tiny varejo supermercado pdv balanca validade pereciveis',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Introdução</div>
    <h1 class="section-title">📊 Benchmark — ERPs de Varejo Alimentar</h1>
    <p class="section-subtitle">Análise comparativa dos principais sistemas de gestão para supermercados e varejo alimentar — líderes globais e especialistas brasileiros — para definir as features prioritárias da vertical Market do Citybox.</p>
    <div class="section-tags">
      <span class="tag-green">Benchmark</span>
      <span class="tag-emerald">TOTVS · Linx · SG · CISS</span>
      <span class="tag-gray">Omie · Bling · Onclick</span>
    </div>
  </div>

  <h2>Plataformas analisadas</h2>
  <div class="card-grid">
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🏢</span> TOTVS Varejo Supermercados (Consinco)</div>
      <p><strong>Foco:</strong> Redes e franquias de médio/grande porte. Destaques: controle de validade com alertas de rebaixa via app mobile, reforma tributária CBS/IBS integrada (Consinco 26.01), gestão centralizada de preços, alto nível de escala. Referência em compliance fiscal.</p>
    </div>
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">🔗</span> Linx Microvix / Linx PDV</div>
      <p><strong>Foco:</strong> Varejo de médio porte, 15k+ lojas. Destaques: integração nativa com balanças Toledo e Ramuza (15k+ lojas), PDV offline, módulo de e-commerce integrado, multicanal. Líder em integrações com hardware de varejo no Brasil.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🥬</span> SG Sistemas</div>
      <p><strong>Foco:</strong> Supermercados e food service — 30 anos de especialização. Destaques: PDV offline de alta performance, gestão de perecíveis (validade, FEFO, perdas), frente de caixa com foco em velocidade, suporte especializado em varejo alimentar. Líder em SMB supermercadista.</p>
    </div>
    <div class="card card-lime">
      <div class="card-title"><span class="card-icon">💪</span> CISS (CISSPoder)</div>
      <p><strong>Foco:</strong> Supermercados e atacarejo. Destaques: motor de promoções complexas (leve-3-pague-2, atacarejo, pontos), controle de lotes com FEFO, integração com distribuidores, gestão de compras por sugestão automática. Forte em margem e rentabilidade.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">☁️</span> Omie / Bling / Tiny</div>
      <p><strong>Foco:</strong> PME em nuvem, e-commerce. Destaques: Omie é referência em gestão financeira + fiscal; Bling/Tiny em integração com marketplaces (Mercado Livre, Shopify). Limite: PDV e processos de varejo físico são secundários.</p>
    </div>
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">🔄</span> Onclick (Varejo + e-commerce)</div>
      <p><strong>Foco:</strong> Multicanal (físico + e-commerce). Destaques: estoque por canal, motor fiscal integrado, PDV com regras setoriais embutidas, preparado CBS/IBS. Sem o peso de suítes de grande porte.</p>
    </div>
  </div>

  <h2>Matriz de capacidades</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Capacidade</th><th>TOTVS</th><th>Linx</th><th>SG</th><th>CISS</th><th>Omie</th><th>Citybox (alvo)</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Integração balança (Toledo/Ramuza)</td><td class="cap-yes">✅</td><td class="cap-yes">✅ 15k+</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-na">—</td><td class="cap-opt">P1</td></tr>
        <tr><td class="td-bold">PDV offline de alta performance</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-opt">Básico</td><td class="cap-opt">P1</td></tr>
        <tr><td class="td-bold">Controle de validade / FEFO</td><td class="cap-yes">✅</td><td class="cap-opt">Básico</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-na">—</td><td class="cap-opt">P1</td></tr>
        <tr><td class="td-bold">Recebimento por XML NF-e</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-opt">P1</td></tr>
        <tr><td class="td-bold">Promoções complexas (leve-X-pague-Y)</td><td class="cap-yes">✅</td><td class="cap-opt">Básico</td><td class="cap-opt">Básico</td><td class="cap-yes">✅</td><td class="cap-na">—</td><td class="cap-opt">P2</td></tr>
        <tr><td class="td-bold">Gestão de lotes</td><td class="cap-yes">✅</td><td class="cap-opt">Parcial</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-opt">Básico</td><td class="cap-opt">P1</td></tr>
        <tr><td class="td-bold">CBS/IBS Reforma Tributária</td><td class="cap-yes">✅ 26.01</td><td class="cap-opt">Em desenvolvimento</td><td class="cap-opt">Parcial</td><td class="cap-opt">Parcial</td><td class="cap-opt">Parcial</td><td class="cap-opt">P1</td></tr>
        <tr><td class="td-bold">E-commerce / marketplace</td><td class="cap-opt">Parcial</td><td class="cap-yes">✅</td><td class="cap-na">—</td><td class="cap-opt">Básico</td><td class="cap-yes">✅</td><td class="cap-yes">✅ Nativo</td></tr>
        <tr><td class="td-bold">CRM / clube de fidelidade</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-opt">Básico</td><td class="cap-yes">✅</td><td class="cap-opt">Básico</td><td class="cap-opt">P2</td></tr>
        <tr><td class="td-bold">Multi-loja / rede</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-yes">✅</td><td class="cap-opt">Básico</td><td class="cap-opt">P3</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Principais aprendizados para o Citybox Market</h2>
  <div class="card-grid">
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🏆</span> Must-have (P1)</div>
      <ul>
        <li>Integração com balança — não negociável para hortifrúti e açougue</li>
        <li>PDV offline-first — queda de internet não pode parar o caixa</li>
        <li>Controle de validade FEFO — evita perdas e multas sanitárias</li>
        <li>Recebimento via XML NF-e — elimina digitação manual</li>
        <li>NFC-e automática + CBS/IBS ready (Reforma Tributária em vigor)</li>
      </ul>
    </div>
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">💡</span> Diferencial v2 (P2)</div>
      <ul>
        <li>Promoções complexas: atacarejo, leve-3-pague-2, desconto progressivo</li>
        <li>Sugestão de compra automática (curva ABC + ponto de pedido)</li>
        <li>Clube de desconto / cashback — retém cliente em supermercados de bairro</li>
        <li>Etiquetas de gôndola com preço por kg / por unidade</li>
      </ul>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🚀</span> Vantagem nativa Citybox</div>
      <ul>
        <li>Marketplace integrado — cliente compra online e retira na loja ou recebe entrega</li>
        <li>Multi-vertical: market + food + farmácia no mesmo login do lojista</li>
        <li>Tecnologia moderna: Next.js + NestJS + realtime nativo</li>
        <li>SaaS multi-tenant com hierarquia município → organização → loja</li>
      </ul>
    </div>
  </div>
</div>
`
});
