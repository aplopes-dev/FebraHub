WIKI.register({
  id: 'fiscal-food',
  title: 'Fiscal — NFC-e e NF-e',
  icon: '🧾',
  searchText: 'fiscal nfce nfe nota fiscal eletronica contingencia sat mfe plugnotas sefaz tributacao pdv cupom eletronico',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Fiscal e Financeiro</div>
    <h1 class="section-title">🧾 Fiscal — NFC-e e NF-e</h1>
    <p class="section-subtitle">Emissão de documentos fiscais eletrônicos para a vertical food: NFC-e no PDV balcão, NF-e para delivery e grandes valores, com contingência SAT/MFE e integração via PlugNotas.</p>
    <div class="section-tags">
      <span class="tag-red">Fiscal BR</span>
      <span class="tag-orange">NFC-e · NF-e</span>
      <span class="tag-gray">PlugNotas · SAT</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Permissão <code>fiscal:manage</code> definida em <code>food-permissions.catalog.ts</code></li>
      <li>Sem integração fiscal implementada — apenas placeholder de permissões</li>
      <li>Sem configuração de CNPJ, regime tributário ou credenciais SEFAZ</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Fiscal Food Completo</div>
    <ul>
      <li>NFC-e automática ao fechar cada venda no PDV ou ao confirmar delivery</li>
      <li>Integração via <strong>PlugNotas</strong> (ou similar) — abstrai SEFAZ estaduais</li>
      <li>Contingência automática: SAT/MFE quando SEFAZ está indisponível</li>
      <li>Configuração por loja: CNPJ, IE, regime (Simples/Lucro Presumido/Real), série</li>
      <li>Envio de DANFE/cupom por e-mail e WhatsApp</li>
      <li>Inutilização de numeração e cancelamento de NFC-e (até 30 min após emissão)</li>
      <li>Relatório fiscal: notas emitidas, valor total, tributos, inconsistências</li>
    </ul>
  </div>

  <h2>Fluxo de emissão NFC-e (PDV Balcão)</h2>
  <div class="mermaid">
sequenceDiagram
  participant PDV
  participant FoodAPI as food-api
  participant PlugNotas
  participant SEFAZ
  participant Cliente

  PDV->>FoodAPI: POST /fiscal/nfce { orderId, payment }
  FoodAPI->>FoodAPI: Monta XML NFC-e (itens, valores, tributos)
  FoodAPI->>PlugNotas: POST /nfce/emitir { xml, storeCredentials }
  PlugNotas->>SEFAZ: Autorizar NFC-e
  alt SEFAZ OK
    SEFAZ->>PlugNotas: Protocolo de autorização
    PlugNotas->>FoodAPI: { chave, protocolo, qrCode, danfeUrl }
    FoodAPI->>PDV: Sucesso + danfeUrl
    FoodAPI->>Cliente: Envia DANFE por e-mail/WhatsApp
  else SEFAZ offline
    PlugNotas->>FoodAPI: Modo contingência SAT
    FoodAPI->>PDV: Emite SAT local (hardware)
    FoodAPI->>FoodAPI: Enfileira para autorização posterior
  end
  </div>

  <h2>Configuração fiscal por loja</h2>
  <pre>{
  "fiscalConfig": {
    "cnpj": "12.345.678/0001-90",
    "ie": "123456789012",
    "regimeTributario": "SIMPLES_NACIONAL",
    "serie": 1,
    "ambiente": "PRODUCAO",
    "csc": "...",
    "cscId": "000001",
    "plugnotasApiKey": "...",
    "satEnabled": true,
    "satActivationCode": "...",
    "autoSendDanfe": true,
    "danfeChannels": ["email", "whatsapp"]
  }
}</pre>

  <h2>Casos de uso fiscais</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Cenário</th><th>Documento</th><th>Quando</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">PDV Balcão (até R$10k)</td><td>NFC-e</td><td>Ao fechar o caixa do pedido</td></tr>
        <tr><td class="td-bold">Delivery próprio</td><td>NFC-e ou NF-e</td><td>Ao confirmar entrega</td></tr>
        <tr><td class="td-bold">iFood/Rappi (nota solicitada)</td><td>NF-e</td><td>Ao fechar pedido</td></tr>
        <tr><td class="td-bold">Mesa/Jantar (valor alto)</td><td>NF-e</td><td>Ao fechar a comanda</td></tr>
        <tr><td class="td-bold">SEFAZ offline</td><td>SAT/MFE contingência</td><td>Automático quando SEFAZ falha</td></tr>
        <tr><td class="td-bold">Cancelamento (até 30min)</td><td>Cancelamento NFC-e</td><td>Operador solicita + motivo</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Obrigações fiscais por estado (amostra)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Estado</th><th>NFC-e</th><th>Contingência</th><th>Observação</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">SP</td><td>Obrigatória</td><td>SAT-CF-e</td><td>SAT obrigatório para PDV em SP</td></tr>
        <tr><td class="td-bold">MG</td><td>Obrigatória</td><td>NFC-e off-line</td><td>MFE em implementação</td></tr>
        <tr><td class="td-bold">RJ</td><td>Obrigatória</td><td>NFC-e off-line</td><td></td></tr>
        <tr><td class="td-bold">BA</td><td>Obrigatória</td><td>MFE</td><td>MFE obrigatório para varejo alimentar</td></tr>
        <tr><td class="td-bold">PR</td><td>Obrigatória</td><td>NFC-e off-line</td><td></td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-red">
    <span class="alert-icon">⚠️</span>
    <div class="alert-body">
      <div class="alert-title">Compliance crítico</div>
      <p>A emissão de NFC-e é obrigatória em praticamente todos os estados para o varejo alimentar. Operar sem ela expõe o lojista a multas da SEFAZ e cancelamento do CNPJ. Este módulo é P1 (bloqueante para operação legal).</p>
    </div>
  </div>
</div>
`
});
