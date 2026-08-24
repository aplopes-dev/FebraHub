WIKI.register({
  id: 'fiscal',
  title: 'Fiscal (NF-e / NFC-e / NFS-e)',
  icon: '🧾',
  searchText: 'fiscal nfe nfce nfse nota fiscal plugnotas DANFE XML contingencia CFOP NCM emissao cancelamento',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Financeiro e Fiscal</div>
    <h1 class="section-title">🧾 Fiscal — NF-e / NFC-e / NFS-e</h1>
    <p class="section-subtitle">Emissão, armazenamento e consulta de documentos fiscais eletrônicos via PlugNotas — NF-e para vendas a empresas, NFC-e para PDV e NFS-e para serviços.</p>
    <div class="section-tags">
      <span class="tag-orange">Fiscal</span>
      <span class="tag-amber">PlugNotas</span>
      <span class="tag-red">P1 Compliance</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Entidade <code>FiscalDoc</code> no schema — sem integração ativa com PlugNotas</li>
      <li>Chave de API PlugNotas definida em env mas não conectada ao fluxo de pedidos</li>
      <li>ERP: tela fiscal em mock</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>NFC-e automática ao fechar pedido no PDV</li>
      <li>NF-e manual para vendas B2B com CNPJ do destinatário</li>
      <li>NFS-e para verticais de serviço (Beauty, Clinic, Services)</li>
      <li>Contingência: modo offline com SCAN (Schema de Contingência)</li>
      <li>Download de XML e DANFE direto do ERP</li>
      <li>Cancelamento de NF-e dentro de 24h com justificativa</li>
      <li>Carta de correção (CC-e) para erros menores</li>
      <li>Relatório mensal de documentos emitidos / cancelados</li>
    </ul>
  </div>

  <h2>Mockup — Central de Documentos Fiscais</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">🧾 Fiscal — Padaria São Jorge · Jun/2026</span>
      <button class="mock-btn" style="margin-left:auto;background:transparent;border:1px solid rgba(255,255,255,.4);color:#fff;font-size:11px">⬇ Exportar XML</button>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px">
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#16a34a">842</div><div class="mock-kpi-sub">Autorizadas</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#ef4444">3</div><div class="mock-kpi-sub">Canceladas</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#d97706">1</div><div class="mock-kpi-sub">Contingência</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#6366f1">R$ 68.4k</div><div class="mock-kpi-sub">Total emitido</div></div>
      </div>
      <table class="mock-table">
        <thead><tr><th>Chave / Série</th><th>Tipo</th><th>Data</th><th>Valor</th><th>Status</th><th>Ação</th></tr></thead>
        <tbody>
          <tr><td><code style="font-size:10px">35260614…0001-90</code><br><span style="font-size:10px;color:#9ca3af">001/000842</span></td><td>NFC-e</td><td>21/06 14:32</td><td>R$ 80,43</td><td><span class="mock-badge mock-badge-green">Autorizada</span></td><td><button class="mock-btn mock-btn-outline" style="font-size:10px;padding:4px 8px">DANFE</button></td></tr>
          <tr><td><code style="font-size:10px">35260614…0001-89</code><br><span style="font-size:10px;color:#9ca3af">001/000841</span></td><td>NFC-e</td><td>21/06 11:15</td><td>R$ 38,00</td><td><span class="mock-badge mock-badge-green">Autorizada</span></td><td><button class="mock-btn mock-btn-outline" style="font-size:10px;padding:4px 8px">DANFE</button></td></tr>
          <tr><td><code style="font-size:10px">35260614…0001-75</code><br><span style="font-size:10px;color:#9ca3af">001/000828</span></td><td>NF-e</td><td>20/06 09:00</td><td>R$ 1.200,00</td><td><span class="mock-badge mock-badge-red">Cancelada</span></td><td><button class="mock-btn mock-btn-outline" style="font-size:10px;padding:4px 8px">XML</button></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <h2>Tipos de documento fiscal</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Documento</th><th>Quando emitir</th><th>Ambiente</th><th>Tributo</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">NFC-e</td><td>Venda no PDV para consumidor final (CPF ou sem CPF)</td><td>SEFAZ estadual</td><td>ICMS</td></tr>
        <tr><td class="td-bold">NF-e</td><td>Venda para empresa (CNPJ), nota de transferência</td><td>SEFAZ estadual</td><td>ICMS</td></tr>
        <tr><td class="td-bold">NFS-e</td><td>Prestação de serviços (beauty, clinic, legal, services)</td><td>Prefeitura municipal</td><td>ISS</td></tr>
        <tr><td class="td-bold">CF-e SAT</td><td>PDV em SP (alternativa à NFC-e)</td><td>SEFAZ-SP</td><td>ICMS</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Fluxo de emissão NFC-e no PDV</h2>
  <div class="mermaid">
sequenceDiagram
  participant PDV as PDV (Caixa)
  participant Worker as fiscal-worker
  participant PN as PlugNotas
  participant SEFAZ

  PDV->>Worker: emit('order.closed', { orderId, cpf? })
  Worker->>Worker: Montar XML NFC-e com itens, NCM, CFOP
  Worker->>PN: POST /nfce { xml, ambiente: 'producao' }
  PN->>SEFAZ: Envio autorizado
  SEFAZ-->>PN: chaveAcesso + protocolo
  PN-->>Worker: 200 { chave, xmlAutorizado, danfePdfUrl }
  Worker->>DB: FiscalDoc { type: NFCE, chave, status: AUTHORIZED }
  Worker->>PDV: WebSocket push (imprimir cupom + NFC-e)
  PDV->>Printer: Imprimir DANFE + QR Code
  </div>

  <h2>Contingência fiscal</h2>
  <div class="alert alert-orange">
    <span class="alert-icon">⚡</span>
    <div class="alert-body">
      <div class="alert-title">SEFAZ pode ficar indisponível — contingência é obrigatória</div>
      <p>No modo SCAN (Schema de Contingência), o PDV emite NFC-e em modo offline com assinatura local. Ao reconectar, transmite o lote para autorização. Sem contingência, o PDV para na queda da SEFAZ.</p>
    </div>
  </div>

  <h2>Configuração fiscal por loja</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Campo</th><th>Exemplo</th><th>Obrigatório</th></tr></thead>
      <tbody>
        <tr><td>CNPJ Emitente</td><td>12.345.678/0001-90</td><td>Sim</td></tr>
        <tr><td>Razão Social</td><td>Burguer Ltda.</td><td>Sim</td></tr>
        <tr><td>Inscrição Estadual</td><td>123456789</td><td>Sim (ICMS)</td></tr>
        <tr><td>CFOP padrão PDV</td><td>5102 (venda no estado)</td><td>Sim</td></tr>
        <tr><td>Regime tributário</td><td>Simples Nacional</td><td>Sim</td></tr>
        <tr><td>Certificado A1 (upload)</td><td>.pfx + senha</td><td>Sim (NF-e/NFC-e)</td></tr>
        <tr><td>CSC (token NFC-e)</td><td>hash PlugNotas</td><td>Sim (NFC-e)</td></tr>
        <tr><td>Série NFC-e</td><td>001</td><td>Sim</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Tela de documentos fiscais (proposta)</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">📄</span> Lista de notas emitidas</div>
      <p>Filtro por tipo (NFC-e / NF-e), status, data. Download XML e PDF. Ação de cancelamento dentro de 24h.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">📊</span> Relatório mensal SPED</div>
      <p>Total emitido por NCM, CFOP, tributação. Exportação para contador em formato SPED-Fiscal.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">⚙️</span> Configuração do certificado</div>
      <p>Upload do certificado A1 (PFX), senha, validade com alerta de vencimento 30 dias antes.</p>
    </div>
  </div>
</div>
`
});
