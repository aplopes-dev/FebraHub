WIKI.register({
  id: 'conciliacao-bancaria',
  title: 'Conciliação Bancária',
  icon: '🏦',
  searchText: 'conciliacao bancaria OFX extrato matching divergencia lancamento banco conta corrente automatica manual open banking',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Financeiro e Fiscal</div>
    <h1 class="section-title">🏦 Conciliação Bancária</h1>
    <p class="section-subtitle">Processo de conferência entre os lançamentos registrados no ERP (contas a pagar/receber, fechamentos PDV) e os extratos bancários — garantindo que o saldo do sistema bata com o saldo real da conta.</p>
    <div class="section-tags">
      <span class="tag-orange">Conciliação</span>
      <span class="tag-amber">OFX · Open Banking</span>
      <span class="tag-gray">Divergências</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <p>Não há conciliação bancária implementada. O módulo <a href="#pagamentos-repasse">Pagamentos e Repasse</a> faz conciliação operacional de pagamentos PSP (vendas vs liquidações), mas sem importação de extrato bancário.</p>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Importação de extrato OFX (todos os grandes bancos) — arrastar e soltar</li>
      <li>Matching automático por valor + data ± 3 dias + descrição</li>
      <li>Revisão de divergências: sobras (no extrato sem lançamento), faltas (lançamento sem extrato)</li>
      <li>Baixa automática de contas a pagar e a receber ao confirmar match</li>
      <li>Histórico de conciliações por período</li>
      <li>Open Banking (fase 2): importação automática via API bancária</li>
    </ul>
  </div>

  <h2>Mockup — Conciliação Bancária</h2>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">🏦 Conciliação — Bradesco ****4521 · Jun/26</span>
      <button class="mock-btn" style="margin-left:auto;background:transparent;border:1px solid rgba(255,255,255,.4);color:#fff;font-size:11px">📎 Importar OFX</button>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px">
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#16a34a">42</div><div class="mock-kpi-sub">Conciliados</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#ef4444">5</div><div class="mock-kpi-sub">Divergências</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#d97706">3</div><div class="mock-kpi-sub">Pendentes</div></div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#6b7280">R$ 380</div><div class="mock-kpi-sub">Diff. total</div></div>
      </div>
      <div class="mock-label">Itens para revisão</div>
      <table class="mock-table">
        <thead><tr><th>Data extrato</th><th>Descrição (banco)</th><th>Valor</th><th>Lançamento ERP</th><th>Status</th><th>Ação</th></tr></thead>
        <tbody>
          <tr>
            <td>10/06</td><td>PIX REC CITYBOX 001</td><td style="color:#16a34a">+ R$ 4.820</td><td>Repasse iFood #2241</td>
            <td><span class="mock-badge mock-badge-green">Match auto</span></td>
            <td><button class="mock-btn mock-btn-outline" style="font-size:10px;padding:4px 8px">Confirmar</button>
          </tr>
          <tr>
            <td>12/06</td><td>DEB BOLETO 00124</td><td style="color:#ef4444">− R$ 1.400</td><td>NF 4821 — Distribuidora</td>
            <td><span class="mock-badge mock-badge-yellow">Revisar</span></td>
            <td><button class="mock-btn mock-btn-primary" style="font-size:10px;padding:4px 8px">Vincular</button>
          </tr>
          <tr>
            <td>14/06</td><td>TAXA MANUTENCAO CONTA</td><td style="color:#ef4444">− R$ 18</td><td>—</td>
            <td><span class="mock-badge mock-badge-red">Sem lançamento</span></td>
            <td><button class="mock-btn mock-btn-primary" style="font-size:10px;padding:4px 8px">Criar</button>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <h2>Processo de conciliação</h2>
  <div class="mermaid">
flowchart TD
  OFX["Importar extrato OFX\n(arquivo do banco)"] --> PARSE["Parser: extrair\ntransações + datas + valores"]
  PARSE --> MATCH["Matching automático\nvalor × data ± 3d × descrição"]
  MATCH --> REVIEW["Revisão humana\ndivergências e sem match"]
  REVIEW --> CONFIRM["Confirmação\nbaixa AP/AR automática"]
  CONFIRM --> HIST["Histórico\nconciliação fechada"]
  </div>

  <h2>Tratamento de divergências</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tipo</th><th>Causa comum</th><th>Ação recomendada</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Extrato sem lançamento ERP</td><td>Taxa bancária, IOF, pagamento esquecido</td><td>Criar lançamento avulso e classificar</td></tr>
        <tr><td class="td-bold">Lançamento ERP sem extrato</td><td>Cheque não compensado, prazo PSP</td><td>Aguardar ou marcar como pendente</td></tr>
        <tr><td class="td-bold">Valor diferente</td><td>Taxa PSP, desconto, multa</td><td>Ajustar lançamento com nota de diferença</td></tr>
        <tr><td class="td-bold">Data diferente (± 1-3 dias)</td><td>Feriado bancário, liquidação D+N</td><td>Confirmar match com tolerância de data</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
