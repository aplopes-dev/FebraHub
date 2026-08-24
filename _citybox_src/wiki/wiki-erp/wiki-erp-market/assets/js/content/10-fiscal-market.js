WIKI.register({
  id: 'fiscal-market',
  title: 'Fiscal — NFC-e, SPED e CBS/IBS',
  icon: '📄',
  searchText: 'fiscal NFC-e NF-e SPED CBS IBS reforma tributaria SAT MFE contingencia PlugNotas NCM CST CEST varejo mercado',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Fiscal e Financeiro</div>
    <h1 class="section-title">📄 Fiscal — NFC-e, SPED e Reforma Tributária</h1>
    <p class="section-subtitle">Compliance fiscal para varejo: emissão de NFC-e e NF-e, SPED Fiscal, preparação para CBS/IBS da Reforma Tributária Brasileira (2026-2033) e contingência offline via SAT/MFE.</p>
    <div class="section-tags">
      <span class="tag-green">NFC-e</span>
      <span class="tag-emerald">SPED</span>
      <span class="tag-amber">CBS · IBS</span>
      <span class="tag-red">Reforma Tributária</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje</div>
    <ul>
      <li>Sem emissão de NFC-e — sem integração com PlugNotas ou SEFAZ para varejo</li>
      <li>NCM/CST/CEST ausentes do modelo <code>RetailItem</code></li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — Fiscal Varejo Completo</div>
    <ul>
      <li>NFC-e automática no fechamento de venda no PDV via PlugNotas</li>
      <li>NF-e para venda a pessoa jurídica (CNPJ) e transferências entre lojas</li>
      <li>SAT/MFE como contingência quando SEFAZ offline (obrigatório em SP, CE, e outros)</li>
      <li>SPED Fiscal: geração de arquivo SPED ICMS/IPI e EFD Contribuições mensais</li>
      <li>Tributação por NCM/CST/CEST por produto com herança do departamento</li>
      <li>CBS/IBS: campos preparados desde 2025, ativação gradual até 2033</li>
      <li>Emissão de NF-e de devolução automática quando pedido cancelado pós-NFC-e</li>
    </ul>
  </div>

  <h2>Mockup — Fiscal Market (NFC-e e SPED)</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">🧾 Fiscal — Supermercado Boa Vista · Jun/26</span>
      <button class="mock-btn" style="margin-left:auto;background:transparent;border:1px solid rgba(255,255,255,.4);color:#fff;font-size:11px">📊 SPED do mês</button>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px">
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#16a34a">2.841</div><div class="mock-kpi-sub">NFC-e emitidas</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#ef4444">4</div><div class="mock-kpi-sub">Canceladas</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#6366f1">R$ 284k</div><div class="mock-kpi-sub">Volume fiscal</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#d97706">Série 001</div><div class="mock-kpi-sub">Cert. A1 válido</div></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
        <button class="mock-btn mock-btn-primary" style="font-size:11px">NFC-e hoje (142)</button>
        <button class="mock-btn mock-btn-outline" style="font-size:11px">NF-e entrada (12)</button>
        <button class="mock-btn mock-btn-outline" style="font-size:11px">DANFE entrada</button>
        <button class="mock-btn mock-btn-outline" style="font-size:11px">Exportar XML</button>
      </div>
      <div class="alert alert-amber" style="margin:0">
        <span class="alert-icon">⚠️</span>
        <div class="alert-body">
          <div class="alert-title">CBS/IBS (Reforma Tributária)</div>
          <p style="font-size:12px">Obrigatoriedade: faturamentos acima de R$3,6M (2026). Iniciar mapeamento de CEST e tabela CBS para os SKUs de maior volume.</p>
        </div>
      </div>
    </div>
  </div>

  <h2>Fluxo de emissão NFC-e</h2>
  <div class="mermaid">
sequenceDiagram
  participant PDV
  participant PlugNotas
  participant SEFAZ
  participant SAT

  PDV->>PDV: Venda finalizada (pagamento OK)
  PDV->>PlugNotas: POST /nfce { itens, pagamentos, cliente? }
  PlugNotas->>SEFAZ: Autoriza NFC-e (XML assinado)
  alt SEFAZ online
    SEFAZ->>PlugNotas: Autorizada (chave + DANFE URL)
    PlugNotas->>PDV: Chave NFC-e + URL DANFE
    PDV->>PDV: Imprime DANFE / envia WhatsApp
  else SEFAZ offline (contingência)
    PDV->>SAT: Envia via equipamento SAT/MFE local
    SAT->>PDV: CFe autorizado offline
    note over SAT: Transmite p/ SEFAZ quando reconectar
  end
  </div>

  <h2>Tributos por produto</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Campo</th><th>O que é</th><th>Exemplo</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">NCM</td><td>Nomenclatura Comum do Mercosul — 8 dígitos</td><td>1006.30.21 (arroz beneficiado)</td></tr>
        <tr><td class="td-bold">CEST</td><td>Código Especificador Subst. Tributária</td><td>17.001.00 (arroz)</td></tr>
        <tr><td class="td-bold">CST ICMS</td><td>Código Situação Tributária — ICMS</td><td>00 (tributado integralmente)</td></tr>
        <tr><td class="td-bold">CST PIS/COFINS</td><td>Situação tributária PIS e COFINS</td><td>01 (operação tributável alíquota básica)</td></tr>
        <tr><td class="td-bold">CFOP</td><td>Código Fiscal Operação — saída</td><td>5102 (venda de mercadoria adquirida)</td></tr>
        <tr><td class="td-bold">CBS/IBS</td><td>Reforma Tributária (2026+)</td><td>Campos preparados; ativação gradual</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Reforma Tributária — CBS/IBS (calendário)</h2>
  <div class="card-grid">
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">📅</span> 2026 — Fase Teste</div>
      <p>Alíquota CBS 0,9% + IBS 0,1% em paralelo com PIS/COFINS. Obrigatório emitir NF-e com campos CBS/IBS preenchidos.</p>
    </div>
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">📅</span> 2027-2028 — Transição</div>
      <p>CBS substitui PIS/COFINS. Alíquotas aumentando gradualmente. IVA-Dual com alíquotas estaduais.</p>
    </div>
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">📅</span> 2033 — Pleno</div>
      <p>CBS + IBS substituem ICMS, ISS, PIS, COFINS, IPI. Sistema unificado. Alíquotas definidas por legislação federal/estadual.</p>
    </div>
  </div>

  <div class="alert alert-orange">
    <span class="alert-icon">⚠️</span>
    <div class="alert-body">
      <div class="alert-title">Prioridade máxima: preparação CBS/IBS</div>
      <p>O TOTVS Consinco lançou a versão 26.01 com suporte CBS/IBS em 2026. A vertical Market do Citybox precisa ter os campos CBS/IBS no modelo de produto e na geração de NF-e antes de qualquer go-live.</p>
    </div>
  </div>
</div>
`
});
