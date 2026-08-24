WIKI.register({
  id: 'jornada-varejo',
  title: 'Jornada do Varejo',
  icon: '🗺️',
  searchText: 'jornada varejo recebimento mercadorias gondola estoque frente caixa reposicao fluxo operacional supermercado',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Introdução</div>
    <h1 class="section-title">🗺️ Jornada do Varejo</h1>
    <p class="section-subtitle">O ciclo operacional completo de um supermercado ou mercearia: do recebimento de mercadorias à reposição de gôndola, passando pela frente de caixa, gestão de validade e canais de venda.</p>
    <div class="section-tags">
      <span class="tag-green">4 Etapas</span>
      <span class="tag-emerald">Recebimento · Estoque · Caixa · Reposição</span>
    </div>
  </div>

  <h2>Ciclo operacional do varejo</h2>
  <div class="mermaid">
flowchart LR
  subgraph entrada [1. Entrada]
    NF["NF-e de Compra\n(XML fornecedor)"]
    Receb["Recebimento\n(conferência cega)"]
    Custo["Custo de\nentrada atualizado"]
  end

  subgraph estoque [2. Estoque / Gôndola]
    Lote["Cadastro\nde Lote + Validade"]
    Gondola["Gôndola\n(FEFO na reposição)"]
    Etiq["Etiqueta\nde preço impressa"]
    Alerta["Alerta de\nvalidade próxima"]
  end

  subgraph venda [3. Frente de Caixa]
    PDV["PDV\n(barcode/balança)"]
    Promo["Motor de\nPromoções"]
    Fiscal["NFC-e\nautomática"]
    Pagto["Pagamento\n(dinheiro/cartão/PIX)"]
  end

  subgraph pos [4. Pós-venda / Reposição]
    Ruptura["Alerta\nde Ruptura"]
    Sugestao["Sugestão\nde Compra"]
    Relatorio["Relatório\ngiro / margem"]
  end

  NF --> Receb --> Custo --> Lote --> Gondola --> PDV
  Gondola --> Etiq
  Lote --> Alerta
  PDV --> Promo --> Pagto --> Fiscal
  Pagto --> Ruptura --> Sugestao
  Pagto --> Relatorio
  </div>

  <h2>Perfis de estabelecimento</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tipo</th><th>Foco principal</th><th>Módulos críticos</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Supermercado bairro (200-500 SKUs)</td><td>Venda direta + fidelidade</td><td>PDV balança, validade, clube desconto, reposição</td></tr>
        <tr><td class="td-bold">Mercearia / mini-mercado</td><td>Conveniência e velocidade</td><td>PDV rápido, estoque simples, NFC-e, delivery</td></tr>
        <tr><td class="td-bold">Hortifrúti / açougue</td><td>Peso variável e perecíveis</td><td>Balança granel, FEFO, rotatividade de lote, rebaixa</td></tr>
        <tr><td class="td-bold">Farmácia</td><td>Lote, validade e receituário</td><td>Controle de lote/validade, SNGPC, fiscal farmácias</td></tr>
        <tr><td class="td-bold">Atacarejo / cash &amp; carry</td><td>Volume e margem baixa</td><td>Promoções progressivas, venda por caixa fechada, CNPJ</td></tr>
        <tr><td class="td-bold">Loja de conveniência</td><td>Alto giro, pouco estoque</td><td>PDV ultra-rápido, marketplace, delivery 30 min</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Fluxo de venda no PDV</h2>
  <div class="mermaid">
sequenceDiagram
  participant Cliente
  participant PDV
  participant MotorPromo as Motor de Promoções
  participant Estoque
  participant Fiscal

  Cliente->>PDV: Apresenta produtos (barcode/balança)
  PDV->>PDV: Lookup EAN → nome, preço, NCM
  PDV->>MotorPromo: Valida promoções ativas (leve-3-pague-2, etc.)
  MotorPromo->>PDV: Desconto aplicado
  Cliente->>PDV: Escolhe meio de pagamento
  PDV->>Estoque: Debita estoque por SKU/lote (FEFO)
  PDV->>Fiscal: Emite NFC-e automática
  Fiscal->>Cliente: DANFE por e-mail/WhatsApp
  PDV->>PDV: Verifica ruptura (qty < min_stock)
  </div>

  <h2>Diferença entre varejo e food</h2>
  <div class="card-grid">
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🛒</span> Varejo (Market)</div>
      <ul>
        <li>Foco em <strong>SKU</strong>: código de barras, EAN, peso, NCM</li>
        <li>Validade e lotes — FEFO obrigatório em perecíveis</li>
        <li>PDV com leitor de código de barras + balança integrada</li>
        <li>Recebimento por NF-e de entrada (compra de fornecedor)</li>
        <li>Promoções de preço e volume (atacarejo)</li>
      </ul>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">🍔</span> Alimentação (Food)</div>
      <ul>
        <li>Foco em <strong>Receita</strong>: ingredientes, modificadores, CMV</li>
        <li>Produção: KDS, course firing, comandas</li>
        <li>PDV com tela touch + tiket de cozinha</li>
        <li>Insumos consumidos na produção</li>
        <li>Delivery com hub iFood/Rappi</li>
      </ul>
    </div>
  </div>
</div>
`
});
