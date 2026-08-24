WIKI.register({
  id: 'balanca-granel',
  title: 'Balança e Granel',
  icon: '⚖️',
  searchText: 'balanca granel peso variavel Toledo Ramuza PLU etiqueta pesados tara checkout kg integracao RS232',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Catálogo e Preço</div>
    <h1 class="section-title">⚖️ Balança e Granel</h1>
    <p class="section-subtitle">Integração com balanças de açougue, hortifrúti e deli — produtos por peso variável, código PLU, etiqueta de pesado e tara de embalagem — indispensável para supermercados.</p>
    <div class="section-tags">
      <span class="tag-green">Balança</span>
      <span class="tag-emerald">Toledo · Ramuza</span>
      <span class="tag-gray">PLU · Granel · Etiqueta</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (Scaffold)</div>
    <ul>
      <li>Sem integração com balanças no código atual</li>
      <li><code>RetailItem.unit</code> pode ser <code>kg</code> — mas sem fluxo de pesagem</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Integração de Balança Completa</div>
    <ul>
      <li>Suporte a balanças Toledo e Ramuza via RS-232 ou TCP/IP (padrão de mercado BR)</li>
      <li>Cadastro de PLU: produto vinculado a número de tecla de acesso rápido na balança</li>
      <li>Tara: subtrai peso da embalagem automaticamente</li>
      <li>Etiqueta de pesado: impressão com código de barras EAN-13 prefixo 2 (padrão BR)</li>
      <li>No PDV: scan da etiqueta → decodifica peso e preço embutido no barcode</li>
      <li>Exportação de tabela PLU: transmite lista de produtos para a balança via arquivo</li>
    </ul>
  </div>

  <h2>Mockup — Balança e Granel no PDV</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">⚖️ Balança Granel — Toledo Prix 3</span>
      <span style="mock-badge mock-badge-green" style="margin-left:auto;font-size:11px;background:#d1fae5;padding:3px 10px;border-radius:20px;color:#065f46">Conectada</span>
    </div>
    <div class="mock-body" style="display:grid;grid-template-columns:1fr 1.4fr;gap:14px">
      <div>
        <div class="mock-label">Produto selecionado</div>
        <div style="background:#fff;border:1px solid #d1fae5;border-radius:8px;padding:14px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:#047857">1,248 kg</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px">Farinha de trigo — PLU 101</div>
          <div style="font-size:14px;font-weight:700;color:#059669;margin-top:8px">R$ 7,49</div>
          <div style="font-size:11px;color:#9ca3af">R$ 5,99/kg</div>
        </div>
        <button class="mock-btn mock-btn-primary" style="width:100%;justify-content:center;margin-top:10px">✅ Confirmar e imprimir etiqueta</button>
      </div>
      <div>
        <div class="mock-label">PLUs recentes</div>
        <table class="mock-table">
          <thead><tr><th>PLU</th><th>Produto</th><th>R$/kg</th></tr></thead>
          <tbody>
            <tr><td>101</td><td>Farinha trigo</td><td>R$ 5,99</td></tr>
            <tr><td>102</td><td>Feijão preto</td><td>R$ 8,90</td></tr>
            <tr><td>103</td><td>Arroz parboilizado</td><td>R$ 4,50</td></tr>
            <tr><td>201</td><td>Maçã gala</td><td>R$ 7,90</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <h2>Fluxo — produto pesado → PDV</h2>
  <div class="mermaid">
sequenceDiagram
  participant Func as Funcionário
  participant Balanca as Balança (Toledo/Ramuza)
  participant Impressora as Impressora de etiqueta
  participant PDV

  Func->>Balanca: Seleciona PLU 42 (Peito de Frango)
  Func->>Balanca: Coloca produto (tara automática)
  Balanca->>Balanca: Peso: 1.237 kg × R$19,90/kg = R$24,62
  Balanca->>Impressora: Imprime etiqueta EAN-13 prefixo-2
  note right of Impressora: "2 00042 24620 6" encoda PLU+preço
  Func->>Func: Cola etiqueta na embalagem
  Cliente->>PDV: Scan da etiqueta
  PDV->>PDV: Decodifica: PLU=42, preço=R$24,62
  PDV->>PDV: Adiciona ao carrinho com peso+preço
  </div>

  <h2>Padrão EAN-13 para produtos pesados (prefixo 2)</h2>
  <pre>Estrutura: 2 PPPPP VVVVV C
  2       = prefixo para peso variável
  PPPPP   = código PLU do produto (5 dígitos)
  VVVVV   = valor em centavos (sem separador decimal)
  C       = dígito verificador EAN-13

Exemplo: 2 00042 24620 6
  PLU = 00042 (Peito de Frango)
  Preço = R$24,62
  Verificador = 6</pre>

  <h2>Protocolo de comunicação com a balança</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Marca</th><th>Protocolo</th><th>Formato PLU</th><th>Obs</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Toledo Prix 3 / Prix 4</td><td>RS-232 + TCP/IP</td><td>Arquivo .TXT ou protocolo serial</td><td>Mais instalada no Brasil</td></tr>
        <tr><td class="td-bold">Ramuza DP-1500</td><td>RS-232</td><td>Protocolo proprietário Ramuza</td><td>Popular em mercearias</td></tr>
        <tr><td class="td-bold">Filizola</td><td>RS-232</td><td>Arquivo exportado via USB</td><td>Comum em hortifrúti</td></tr>
        <tr><td class="td-bold">Balmak / Dimep</td><td>TCP/IP</td><td>API REST proprietária</td><td>Modelos mais recentes</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Cadastro de PLU</h2>
  <pre>{
  "plu": {
    "code": 42,
    "name": "Peito de Frango s/ Osso",
    "pricePerKg": 1990,
    "tare": 50,
    "unit": "kg",
    "department": "Açougue",
    "barcode_prefix": "200042",
    "expireDays": 3,
    "printLabel": true
  }
}</pre>

  <div class="alert alert-green">
    <span class="alert-icon">💡</span>
    <div class="alert-body">
      <div class="alert-title">Linx Microvix — referência</div>
      <p>O Linx Microvix tem integração nativa com Toledo e Ramuza em mais de 15.000 lojas no Brasil. A solução Citybox Market deve seguir o mesmo protocolo RS-232/TCP para garantir compatibilidade com o parque instalado de balanças dos lojistas.</p>
    </div>
  </div>
</div>
`
});
