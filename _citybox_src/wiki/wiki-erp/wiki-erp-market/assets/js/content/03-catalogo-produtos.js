WIKI.register({
  id: 'catalogo-produtos',
  title: 'Catálogo de Produtos',
  icon: '🏷️',
  searchText: 'catalogo produtos EAN GTIN codigo barras variantes NCM CST CEST embalagem unidade venda sku retail item',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Catálogo e Preço</div>
    <h1 class="section-title">🏷️ Catálogo de Produtos</h1>
    <p class="section-subtitle">Gestão do cadastro de produtos de varejo: EAN/GTIN, variantes, unidades de venda, tributos por NCM/CST/CEST e sincronização com catálogo de preços por fornecedor.</p>
    <div class="section-tags">
      <span class="tag-green">Catálogo</span>
      <span class="tag-emerald">EAN · GTIN · NCM</span>
      <span class="tag-gray">RetailItem</span>
    </div>
  </div>

  <div class="herda-base-callout">
    <span class="hb-icon">🏪</span>
    <div class="hb-body">
      <div class="hb-title">Herda do ERP Base — Catálogo Canônico</div>
      <div class="hb-links">Esta vertical herda o <a href="../wiki-erp/index.html#catalogo">Catálogo (CatalogItem polimórfico)</a>: campos core (name, description, basePrice, imageUrl, categoryId), variantes, modificadores e preço por canal. O produto de varejo é o <strong>CatalogItem tipo RETAIL</strong> + extensão 1:1 <code>RetailItem</code>. Esta seção documenta <strong>apenas o delta market</strong>: EAN/GTIN, NCM/CST/CEST, lookup GS1, unidades de venda/atacarejo e departamento/seção.</div>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (Scaffold)</div>
    <ul>
      <li><code>RetailItem{catalogItemId, sku}</code> — apenas SKU, sem código de barras, variantes ou tributos</li>
      <li>Criação via marketplace-api: <code>CatalogItem{...campos base, type:RETAIL, retail:{sku}}</code></li>
      <li>Sem integração com tabelas de EAN/GTIN (consulta em bases externas como GS1 Brazil)</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Catálogo Varejo Completo</div>
    <ul>
      <li>Cadastro por EAN/GTIN com lookup automático em GS1 Brazil (nome, foto, fabricante)</li>
      <li>Variantes: cor, tamanho, sabor — cada variante com EAN próprio</li>
      <li>Embalagem: unidade de venda (un, kg, g, l, ml, cx), fator de conversão</li>
      <li>Tributos por produto: NCM, CST ICMS, CST PIS/COFINS, CEST, alíquota</li>
      <li>Unidade por caixa fechada: venda avulsa e por embalagem fechada (atacarejo)</li>
      <li>Departamento/seção/grupo para organização do catálogo</li>
      <li>Foto via upload direto ou URL do fabricante</li>
    </ul>
  </div>

  <h2>Modelo de dados — extensão RetailItem sobre CatalogItem</h2>
  <p>O produto de varejo <strong>não</strong> redefine o catálogo. Reutiliza o <code>CatalogItem</code> e <code>ItemVariant</code> canônicos da base (ver <a href="../wiki-erp/index.html#catalogo">Catálogo</a>) e adiciona a extensão 1:1 <code>RetailItem</code> com os campos fiscais e de varejo:</p>
  <div class="mermaid">
erDiagram
  CatalogItem {
    uuid id PK
    string type "RETAIL"
    string name "base"
    decimal basePrice "base"
  }
  RetailItem {
    uuid catalogItemId PK_FK
    string sku
    string ean
    string gtin
    string ncm
    string cst_icms
    string cst_pis_cofins
    string cest
    string unit
    decimal unitFactor
    int unitsPerBox
    string department
    string section
    string brand
    string supplier
  }

  CatalogItem ||--|| RetailItem : "estende (1:1)"
  CatalogItem ||--o{ ItemVariant : "herda da base"
  </div>
  <p class="mermaid-caption">Os campos core (name, description, basePrice, imageUrl, categoryId) e <code>ItemVariant</code> vêm do CatalogItem base. <code>RetailItem</code> é puramente o delta fiscal/varejo.</p>

  <h2>Exemplo de produto cadastrado</h2>
  <pre>{
  "name": "Arroz Tipo 1 Camil 5kg",
  "type": "RETAIL",
  "price": 2490,
  "retail": {
    "sku": "ARRCAM5KG",
    "ean": "7896006704094",
    "gtin": "07896006704094",
    "ncm": "1006.30.21",
    "cst_icms": "00",
    "cst_pis_cofins": "01",
    "cest": "17.001.00",
    "unit": "un",
    "unitsPerBox": 6,
    "department": "Mercearia Seca",
    "section": "Arroz e Feijão",
    "brand": "Camil",
    "supplier": "uuid-fornecedor-camil"
  }
}</pre>

  <h2>Lookup automático por EAN (GS1 Brazil)</h2>
  <div class="mermaid">
sequenceDiagram
  participant Op as Operador (ERP)
  participant API as market-api
  participant GS1 as GS1 Brazil API
  participant DB

  Op->>API: POST /products/lookup { ean: "7896006704094" }
  API->>GS1: GET /products/{ean}
  GS1->>API: { name, brand, description, imageUrl, ncm }
  API->>Op: Pré-preenchido para confirmação
  Op->>API: Confirma + ajusta preço/seção
  API->>DB: Salva produto completo
  </div>

  <h2>Unidades de medida</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Unidade</th><th>Código</th><th>Tipo de produto</th><th>No caixa</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Unidade</td><td>un</td><td>Embalados, enlatados</td><td>Scan EAN → preço unitário</td></tr>
        <tr><td class="td-bold">Quilograma</td><td>kg</td><td>Carnes, frutas, granel</td><td>Balança → peso × preço/kg</td></tr>
        <tr><td class="td-bold">Grama</td><td>g</td><td>Frios fatiados, queijos</td><td>Etiqueta com código PLU</td></tr>
        <tr><td class="td-bold">Litro</td><td>l</td><td>Bebidas, óleos</td><td>Scan EAN → preço unitário</td></tr>
        <tr><td class="td-bold">Caixa fechada</td><td>cx</td><td>Atacarejo, estoque</td><td>Scan + fator de conversão</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
