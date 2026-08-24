WIKI.register({
  id: 'financeiro-caixa',
  title: 'Financeiro & Caixa',
  icon: '💰',
  searchText: 'financeiro caixa contas receber pagar fluxo caixa DRE abertura caixa fechamento sangria suprimento boleto PIX cartao maquininha Stone PagSeguro parcelamento carne digital inadimplencia cobranca regua desconto negociacao conciliacao bancaria OFX comissao comissoes repasse producao paciente ficha financeiro lancamento receber debito avulso CLIN-060 CLIN-061 CLIN-062 patient-financial-entries financial.api.service commissions.api.service Em aberto Historico debit_received budget_approved treatment_completed commission-rules desconto detalhe financial accounts categories entries by-payment-method dateField paidAt use-transactions-query Transacoes meio pagamento recibo PDF Exportar build-cash-flow-pdf build-transactions-pdf cancel pending withUnsettled delete useFinancialAccounts manualPagination clinica-api v1/financial v1/commissions ledger unificado /clinic/financeiro fluxo-de-caixa transacoes comissoes configuracoes PageNav CurrencyInput TabsList category select receber pagar responsivo mobile tablet KPI cash-flow-stats FilterPopover sheet max-w Emitir recibo useEmitIncomeReceipt',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Financeiro</div>
    <h1 class="section-title">💰 Financeiro &amp; Caixa</h1>
    <p class="section-subtitle">Gestão financeira da clínica: ledger unificado na clinica-api, fluxo de caixa, Transações e Comissões (CLIN-062) no ERP, financeiro na ficha do paciente, e blueprint de caixa de recepção / payments-api.</p>
    <div class="section-tags">
      <span class="tag-cyan">clinica-api</span>
      <span class="tag-teal">v1/financial</span>
      <span class="tag-sky">CLIN-060/061</span>
      <span class="tag-amber">CLIN-062</span>
    </div>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Financeiro na ficha do paciente — integrado (jul/2026 · CLIN-060/061)</div>
      <p><code>/clinic/pacientes/[id]/financeiro</code> — listagem via <code>GET /v1/patients/:patientId/financial-entries</code> (<code>patient-financial-entries.service.ts</code> + React Query). Filtros por período e status; barra de totais (<code>meta.totals</code>); ações receber pagamento (<code>PATCH …/receive</code>) e débito avulso (CRUD). <strong>Aprovar orçamento</strong> gera parcelas idempotentes na API e invalida o cache do Financeiro no ERP. Tabelas da ficha usam <code>manualPagination</code> no <code>DataTable</code> (paginação server-side §8.1). <strong>Select de caixa</strong> no receive usa <code>useFinancialAccounts</code> → <code>GET /v1/financial/accounts</code> (mesmas contas de Configurações do financeiro). Sheet de receive no padrão visual clinic (picker de meios + campos compartilhados). Integração payments-api permanece blueprint.</p>
    </div>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Fluxo de caixa + Transações ERP — API (jul/2026 · CLIN-061 · refinamentos ago/2026)</div>
      <p><strong>Código:</strong> rotas em <code>app/(clinic)/financeiro/{fluxo-de-caixa,transacoes,configuracoes}</code> · feature em <code>features/clinic/financeiro/</code> · <code>financial.api.service.ts</code> + mappers BRL↔cents via <code>clinicaFetch</code> → <code>v1/financial/*</code> (contas, categorias, lançamentos, stats, <code>by-payment-method</code>).<br>
      <strong>Telas:</strong> <strong>fluxo de caixa</strong> (entradas/saídas, KPIs da API, <code>perPage≤100</code>; label <em>Exibindo financeiro</em>; tabela <code>cash-flow-table</code>: coluna <strong>Nome</strong> (não Descrição); ícone ExternalLink na cor primary abre a ficha do paciente em nova aba; badge do meio de pagamento ao lado do valor; valor liquidado em verde (também despesa paga); sem colunas Status/Pagamento; slot fixo Receber|Pagar|✓; <strong>Exportar PDF</strong> via <code>build-cash-flow-pdf.ts</code>; menu ⋮ em receita recebida → <strong>Emitir recibo</strong>); <strong>transações</strong> (só liquidados <code>paid</code>/<code>received</code>; período por <code>dateField=paidAt</code>; vistas Meio de pagamento / Transações; paginação server-side; <strong>Cancelar desfaz liquidação → <code>pending</code></strong> — não permanece <code>cancelled</code>; “vencido” na UI se <code>dueDate</code> passou; delete permitido em liquidados; recibo PDF client-side; <strong>Exportar PDF</strong> conforme a visão via <code>build-transactions-pdf.ts</code>; anexar comprovante MinIO pendente); <strong>configurações</strong> (contas + categorias receita/despesa; cor como bolinha + nome) com <code>TabsList</code> cinza full-width retangular (<code>rounded-xl</code>); navegação via <code>PageNav</code>. Fundo da área financeira = branco (sem cinza do dashboard).<br>
      <strong>Sheets:</strong> receber receita e pagar despesa no padrão clinic (<code>CLINIC_*</code> + componentes de payment method/fields da ficha); categorias nos formulários com botão <strong>Adicionar categoria</strong> (mesmo padrão da agenda / <code>AppointmentCategoryCreatePopover</code>).<br>
      <strong>Permissão:</strong> CASL <code>Financial*</code> + <code>X-Store-Id</code>. Ledger unificado com a ficha (<code>financial_entries</code>).</p>
    </div>
  </div>


  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Comissões ERP — API (jul/2026 · CLIN-062)</div>
      <p><strong>Rota:</strong> <code>/clinic/financeiro/comissoes</code> · <code>features/clinic/financeiro/comissoes/</code> · <code>commissions.api.service.ts</code> + React Query → <code>v1/commissions/*</code>.<br>
      <strong>Em aberto:</strong> lista membros (union team + accruals); sem regra → <strong>Configurar</strong> (deep-link Equipe <code>?memberId=&amp;tab=commission</code>); com regra → Detalhes / Pagar. Receive (ficha/caixa) e <strong>Finalizar tratamento</strong> invalidam cache de comissões.<br>
      <strong>Histórico:</strong> <strong>1 linha por profissional</strong> no período (soma líquida); detalhe agrega todos os pagamentos (<code>GET …/history/:memberId?startDate&amp;endDate</code>). Desconto do pagamento aparece <em>só no detalhe</em> (antes do valor pago), não na tabela.<br>
      <strong>Detalhe:</strong> linhas de tratamento mostram dente/local (ex. “Cirurgia com Retalho 15”); cabeçalho do grupo = nome-base. Modal de sucesso com <code>DialogTitle</code> (a11y).<br>
      <strong>Regras:</strong> cadastro na Equipe — ver wiki Equipe &amp; RH. Permissão open/pay/history: <code>store.clinic.financial.manage</code>.</p>
    </div>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">UX mobile/tablet — financeiro (jul/2026)</div>
      <p><strong>Abas:</strong> <code>PageNav</code> com scroll horizontal (<code>overflow-x-auto</code>) — Fluxo de caixa / Transações / Comissões / Configurações não cortam no mobile.<br>
      <strong>Layout:</strong> no mobile a página cresce com o conteúdo (sem <code>overflow-hidden</code>/<code>flex-1</code> travando altura); a tabela aparece e o scroll fica no shell. Desktop mantém scroll interno da tabela.<br>
      <strong>KPIs (tablet):</strong> Receita + Despesa na mesma linha; Saldo em linha abaixo (<code>cash-flow-stats</code>) — evita 3 cards empilhados roubando altura.<br>
      <strong>Header:</strong> período + Filtrar + Adicionar na mesma linha; label “Adicionar …” visível no mobile (não só ícone).<br>
      <strong>Filtrar:</strong> popover com largura <code>min(..., calc(100vw-2rem))</code>, 1 coluna no mobile, <code>align=&quot;center&quot;</code> + <code>collisionPadding</code>.<br>
      <strong>Sheets</strong> nova despesa/receita: <code>max-w-[min(48rem,calc(100%-2rem))]</code> (nunca px fixo ~767 — vazava à esquerda no tablet).<br>
      <strong>Categorias</strong> receita/despesa: edição pré-preenche cor (hex normalizado); criação deixa o select de cor vazio até escolher.</p>
    </div>
  </div>

  <h2>6.0 Aba Transações (ERP)</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">📊</span> Meio de pagamento</div>
      <p><code>GET /v1/financial/entries/by-payment-method</code> — agrega income/expense/balance por meio (só liquidados com <code>paymentMethod</code>). KPIs da tela recalculados a partir desse agregador. Botão VER navega para a visão detalhe filtrada pelo meio.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🧾</span> Transações (detalhe)</div>
      <p><code>GET /v1/financial/entries?statuses=paid,received&amp;dateField=paidAt</code> + filtros (<code>types</code>, contas, meios; “Agendadas” → <code>paidAtFrom</code>). Listagem paginada no backend (<code>page</code>/<code>perPage</code>). Ações: Ver (sheet read-only), Emitir recibo (jsPDF no ERP), Cancelar (<code>PATCH …/cancel</code> → volta a <code>pending</code>), Excluir despesa (<code>DELETE</code>). Header: <strong>Exportar PDF</strong> da visão atual.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">📄</span> Recibo</div>
      <p>PDF 100% client-side (<code>build-income-receipt-pdf.ts</code>) — sem persistência na API nesta entrega. Até 3 vias por página; opção paciente vs responsável pelo pagamento. Também disponível no menu ⋮ do <strong>fluxo de caixa</strong> para receita já recebida (<code>useEmitIncomeReceipt</code>).</p>
    </div>
  </div>

  <h2>6.1 Caixa da recepção</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">🔓</span> Abertura de Caixa</div>
      <p>Abertura com valor inicial em dinheiro. Registro de caixa por turno ou por dia. Multi-caixas simultâneos para policlínicas com várias recepções. <em>Blueprint — ainda não é a tela de contas financeiras do ERP.</em></p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">💳</span> Recebimentos</div>
      <p>Consultas, retornos, procedimentos, produtos vendidos. Formas: dinheiro, PIX, cartão débito/crédito, voucher, transferência, convênio, boleto, carnê. No ERP atual: receive na ficha + fluxo de caixa global.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">📤</span> Sangria e Suprimento</div>
      <p>Sangria (retirada de caixa) e suprimento (entrada) com registro de motivo e responsável. Histórico auditável. <em>Blueprint.</em></p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">🔒</span> Fechamento de Caixa</div>
      <p>Conferência de valores por forma de pagamento, relatório de diferença e conferência com maquininha. Exportável em PDF. <em>Blueprint.</em></p>
    </div>
  </div>

  <h2>6.2 Contas a Receber</h2>
  <p>Gestão completa do ciclo de recebimentos — da emissão do boleto à baixa automática via webhook:</p>
  <ul>
    <li>Lista de cobranças pendentes com filtro por vencimento, paciente, convênio, status</li>
    <li>Boleto bancário: geração e envio automático com link de pagamento</li>
    <li>PIX copia-e-cola e QR Code gerados automaticamente</li>
    <li>Carnê digital para parcelamentos: geração de todas as parcelas de uma vez</li>
    <li>Baixa manual e automática (via webhook de pagamento — payments-api)</li>
  </ul>

  <h3>Régua de cobrança automática</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Dia</th><th>Canal</th><th>Conteúdo</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">D-3</td><td>WhatsApp</td><td>Lembrete amigável: "Seu boleto vence em 3 dias"</td></tr>
        <tr><td class="td-bold">D0</td><td>WhatsApp + e-mail</td><td>Lembrete: vencimento hoje + link de pagamento</td></tr>
        <tr><td class="td-bold">D+3</td><td>WhatsApp</td><td>Cobrança pós-vencimento: "Percebemos um boleto pendente"</td></tr>
        <tr><td class="td-bold">D+7</td><td>WhatsApp + SMS</td><td>Cobrança mais firme + link de negociação</td></tr>
      </tbody>
    </table>
  </div>
  <ul>
    <li>Negociação de dívidas: desconto, parcelamento de débito existente, acordo documentado</li>
    <li>Controle de coparticipação: sistema calcula e cobra a diferença do convênio</li>
  </ul>

  <h2>6.3 Contas a Pagar</h2>
  <ul>
    <li>Lançamento de despesas operacionais: aluguel, salários, insumos, equipamentos, serviços</li>
    <li>Centro de custo por categoria (fixo, variável, pessoal, marketing)</li>
    <li>Agendamento de pagamentos recorrentes (aluguel, assinatura de sistema)</li>
    <li>Aprovação de pagamentos acima de valor configurável pelo administrador</li>
    <li>Conciliação bancária: importação de extrato OFX/CSV e conferência automática</li>
  </ul>

  <h2>6.4 Fluxo de caixa e DRE</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">📈</span> Fluxo de Caixa</div>
      <p><strong>Implementado no ERP:</strong> <code>/clinic/financeiro/fluxo-de-caixa</code> (listagem/stats; coluna Nome + link ficha; badge pagamento ao lado do valor; liquidado em verde) e <code>/clinic/financeiro/transacoes</code> (liquidados + agregação por meio). Blueprint futuro: projetado vs. realizado D+30/60/90 e gráfico de liquidez.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">📊</span> DRE Simplificada</div>
      <p>Receita bruta → deduções (impostos, convênio) → receita líquida → despesas → lucro operacional. Comparativo mensal/anual com variação percentual. <em>Blueprint.</em></p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🍰</span> Gráficos por Dimensão</div>
      <p>Faturamento por especialidade, profissional, convênio e procedimento. Identificação dos serviços mais e menos lucrativos. <em>Blueprint.</em></p>
    </div>
  </div>

  <h2>6.5 Comissões e repasses (CLIN-062 — implementado)</h2>
  <div class="alert alert-blue">
    <span class="alert-icon">ℹ️</span>
    <div class="alert-body">
      <div class="alert-title">Status</div>
      <p>Telas Em aberto / Histórico + pagamento no ERP; regras por membro na Equipe. Motores: <code>debit_received</code> (receive), <code>budget_approved</code> (aprovar orçamento → responsável), <code>treatment_completed</code> (só em Paciente → Tratamentos → Finalizar, que cria a evolução — evolução avulsa não gera). Split payments-api / recibo holístico = blueprint.</p>
    </div>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Capacidade</th><th>Comportamento atual</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Gatilhos de regra</td><td><code>treatment_completed</code>, <code>debit_received</code>, <code>budget_approved</code> (uma regra de orçamento por membro)</td></tr>
        <tr><td class="td-bold">Tipos</td><td>Porcentagem ou valor fixo (por tratamento no plano/especialidade; orçamento usa valor único)</td></tr>
        <tr><td class="td-bold">Apuração em aberto</td><td>Accruals <code>open</code> por profissional (receive + approve + finalize); filtros de período server-side</td></tr>
        <tr><td class="td-bold">Pagamento</td><td>Seleciona conta financeira; desconto opcional; gera despesa no ledger + marca accruals <code>paid</code></td></tr>
        <tr><td class="td-bold">Histórico</td><td>1 linha por profissional (soma líquida no período); detalhe une pagamentos e mostra desconto se houver</td></tr>
        <tr><td class="td-bold">Identidade de regra</td><td>Mesmo gatilho+tipo+plano+especialidade → atualiza (não duplica); valores pré-preenchidos na Equipe</td></tr>
      </tbody>
    </table>
  </div>
  <ul>
    <li>PDF de relatório de comissão no ERP (<code>build-commission-report-pdf.ts</code>); Exportar Excel “Em breve”</li>
    <li>Lançamento de pagamento vira <code>FinancialEntry</code> expense (<code>source=manual</code>, <code>status=paid</code>)</li>
    <li>Receive e Finalizar tratamento geram accruals e invalidam lista Em aberto no ERP</li>
    <li>Migration única (operador): <code>20260715165240_add_commissions</code> — inclui <code>source_budget_id</code> / <code>source_patient_treatment_id</code></li>
    <li>Blueprint: % por forma de pagamento; split automático via payments-api; recibo/holerite ao profissional</li>
  </ul>

  <h2>Entidades de dados (schema <code>clinica</code>)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Entidade</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>FinancialAccount</code></td><td>Conta/caixa da loja (<code>v1/financial/accounts</code>)</td></tr>
        <tr><td class="td-bold"><code>FinancialCategory</code></td><td>Categoria income|expense (<code>v1/financial/categories</code>)</td></tr>
        <tr><td class="td-bold"><code>FinancialEntry</code></td><td>Lançamento unificado (ficha + fluxo de caixa + Transações); centavos; status pending|paid|received|cancelled; listagem com <code>dateField</code>/<code>paidAtFrom</code>; <code>by-payment-method</code>; Cancelar liquidação → <code>pending</code> (<code>withUnsettled</code>); DELETE também em liquidados</td></tr>
        <tr><td class="td-bold"><code>CashRegister</code> / sessão</td><td>Blueprint — abertura/fechamento de turno (não confundir com FinancialAccount)</td></tr>
        <tr><td class="td-bold"><code>CommissionRule</code> / <code>CommissionRuleTreatment</code></td><td>Regras por membro (<code>GET/PUT /v1/team/:memberId/commission-rules</code>)</td></tr>
        <tr><td class="td-bold"><code>CommissionAccrual</code></td><td>Comissão apurada (open/paid); motors <code>debit_received</code> / <code>budget_approved</code> / <code>treatment_completed</code>; refs <code>sourceFinancialEntryId</code> / <code>sourceBudgetId</code> / <code>sourcePatientTreatmentId</code></td></tr>
        <tr><td class="td-bold"><code>CommissionPayment</code> / Item</td><td>Pagamento ao profissional + desconto; histórico agregado por membro</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
