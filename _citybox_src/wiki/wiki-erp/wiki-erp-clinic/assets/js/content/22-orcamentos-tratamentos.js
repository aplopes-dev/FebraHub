WIKI.register({
  id: 'orcamentos-tratamentos',
  title: 'Orçamentos, Planos & Procedimentos',
  icon: '💎',
  searchText: 'orcamento budget aprovacao proposta plano procedimento prontuario tratamento catalogo servico especialidade tabela particular convenio valor custo desconto parcelamento entrada downpayment parcela status pendente aprovado rejeitado expirado receita financeiro lancamento PatientTreatment evolucao TreatmentEvolution odontograma acceptsFaces tooth-annotations faces locationLabel CLIN-041 clinica-api paginacao server-side debounce busca PDF jsPDF materialize approve Harmonização Facial HOF auto-tab nutricao inicializar petroski',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Prontuário Clínico</div>
    <h1 class="section-title">💎 Orçamentos, Planos &amp; Procedimentos</h1>
    <p class="section-subtitle">O ciclo comercial-clínico completo: catálogo de serviços por especialidade, orçamento ao paciente, aprovação com efeitos cruzados no financeiro e geração de procedimentos com evoluções clínicas auditáveis. Na ficha a aba chama-se <strong>Prontuário</strong>; o restante da UI usa <strong>Procedimento(s)</strong> (rotas/IDs <code>treatments</code> inalterados).</p>
    <div class="section-tags">
      <span class="tag-cyan">Comercial</span>
      <span class="tag-teal">Plano de Tratamento</span>
      <span class="tag-green">Financeiro</span>
    </div>
  </div>

  <h2>1. Catálogo: Planos × Serviços por especialidade</h2>
  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Catálogo de planos — implementado em Configurações</div>
      <p><code>/clinic/configuracoes/planos</code> persiste via <code>clinica-api</code> (<code>ClinicPlan</code> → especialidades → procedimentos com valor/custo BRL). Em <strong>jul/2026</strong> (CLIN-041 Fase 1 + CLIN-060) orçamentos, procedimentos, evoluções avulsas e <strong>lançamentos financeiros na aprovação</strong> estão na <code>clinica-api</code> e integrados no ERP (<code>/clinic/pacientes/[id]/orcamentos</code>, aba <strong>Prontuário</strong> em <code>…/tratamentos</code> e <code>…/financeiro</code>).</p>
    </div>
  </div>
  <p>Cada clínica mantém <strong>planos</strong> (tabelas de preço) — tabela particular e, no futuro, tabelas por convênio. Dentro de cada plano há itens de <strong>tratamento/serviço</strong> organizados por especialidade, cada um com valor de venda, custo e flag de ativo. O nome do serviço é único por especialidade.</p>

  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">📋</span> Planos (tabelas de preço)</div>
      <p>Tabela particular + tabelas por convênio. Cada plano lista seus serviços com valor próprio — o mesmo serviço pode ter preços diferentes por plano.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🩺</span> Serviços por especialidade</div>
      <p>Sessões de fisioterapia, protocolos de estética, consultas de nutrição, pacotes de psicologia, procedimentos odontológicos. Valor, custo e ativo por item.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">💰</span> Valor × Custo</div>
      <p>Custo registrado por serviço alimenta a margem de contribuição e os relatórios de rentabilidade por especialidade e profissional.</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">🔌</span> Ativar / desativar</div>
      <p>Serviços fora de linha ficam inativos sem perder histórico. Itens já orçados continuam válidos mesmo após desativação do serviço.</p>
    </div>
  </div>

  <div class="alert alert-amber">
    <span class="alert-icon">🔒</span>
    <div class="alert-body">
      <div class="alert-title">Plano padrão protegido</div>
      <p>Toda clínica tem um <strong>plano padrão</strong> (tabela particular) que <strong>não pode ser excluído nem desativado</strong>. Ele é o fallback de precificação para qualquer orçamento. O nome de cada serviço é <strong>único por especialidade</strong>.</p>
    </div>
  </div>

  <h2>2. Orçamento ao paciente</h2>
  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Aba Orçamentos — integrada à clinica-api (jul/2026 · CLIN-041 Fase 1)</div>
      <p><code>/clinic/pacientes/[id]/orcamentos</code> — CRUD via <code>clinicaFetch</code> (<code>GET/POST/PUT/DELETE /v1/patients/:patientId/budgets</code>, <code>PATCH …/status</code>). Listagem com <strong>busca, paginação e ordenação no backend</strong> (<code>page</code>, <code>perPage</code>, <code>search</code>, <code>sortBy</code>, <code>sortOrder</code>); no ERP a busca usa <code>useDebouncedSearch</code> (400&nbsp;ms) e o <code>DataTable</code> usa <code>manualPagination</code>. Sheet <code>patient-budget-sheet.tsx</code>: itens do plano, desconto R$/%, parcelamento, <strong>odontograma SVG</strong> (Permanentes/Decíduos/HOF + faces se <code>acceptsFaces</code>) no accordion — substitui o picker numérico; descrição padrão <em>Plano de Tratamento de {nome}</em>; botões Salvar/Aprovar conforme dirty state. <strong>HOF auto-tab (jul/2026):</strong> ao selecionar tratamento cuja especialidade é <strong>Harmonização Facial</strong>, o odontograma muda automaticamente para a aba HOF. <strong>Impressão PDF</strong> (jsPDF): cabeçalho com dados da clínica, tabela de tratamentos, badge de status, resumo financeiro. <strong>Aprovar</strong> materializa <code>PatientTreatment</code> por item (idempotente) <strong>e gera lançamentos em <code>patient_financial_entries</code></strong> (entrada + parcelas).</p>
    </div>
  </div>
  <p>O orçamento reúne os itens propostos ao paciente. Cada item combina <strong>plano + serviço + profissional + valor</strong>; em odontologia há seleção de dente, mas o campo é generalizado para <strong>região / sessão / item</strong> conforme a especialidade.</p>

  <div class="table-wrap">
    <table>
      <thead><tr><th>Recurso</th><th>Comportamento</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Itens do orçamento</td><td>Tabela editável: plano, serviço, profissional, região/sessão/item e valor por linha; odontologia: dentes/faces via odontograma (<code>locationLabel</code>)</td></tr>
        <tr><td class="td-bold">Aceita faces</td><td>Flag no tratamento do plano (<code>acceptsFaces</code>); faces M/O/I/D/V/L/P só interativas se true; API valida (422 se faces sem flag)</td></tr>
        <tr><td class="td-bold">HOF auto-tab</td><td>Tratamento com <code>specialtyName === 'Harmonização Facial'</code> força a aba HOF no odontograma do sheet</td></tr>
        <tr><td class="td-bold">Desconto</td><td>Em <code>R$</code> ou <code>%</code> sobre o total, com registro de quem aplicou</td></tr>
        <tr><td class="td-bold">Parcelamento</td><td>Entrada (<em>downpayment</em>) + N parcelas; preview do valor de cada parcela</td></tr>
        <tr><td class="td-bold">Status</td><td><code>pendente</code> · <code>aprovado</code> · <code>rejeitado</code> · <code>expirado</code></td></tr>
        <tr><td class="td-bold">Listagem</td><td>Server-side: busca por descrição/responsável, paginação <code>{ data, meta }</code>, ordenação por data/descrição/valor/status</td></tr>
        <tr><td class="td-bold">Ícone de contrato</td><td>Orçamento aprovado: FileText ao lado do badge — <strong>cinza</strong> sem emissão; <strong>mostarda</strong> (<code>#C4A000</code>) com contrato emitido / assinatura solicitada ou parcial; <strong>verde</strong> com 2/2 assinaturas</td></tr>
        <tr><td class="td-bold">Impressão</td><td>PDF client-side com perfil da clínica (<code>getClinicProfile</code>) + preview em <code>PatientDocumentPdfSheet</code></td></tr>
        <tr><td class="td-bold">Edição</td><td>Liberada enquanto pendente; <strong>bloqueada após aprovação</strong> (orçamento vira documento — API retorna 409)</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-blue">
    <span class="alert-icon">✏️</span>
    <div class="alert-body">
      <div class="alert-title">Edição congela na aprovação</div>
      <p>Depois que o orçamento é aprovado ele não pode mais ser editado — preserva-se o valor exato que o paciente aceitou. Mudanças exigem novo orçamento.</p>
    </div>
  </div>

  <h2>3. Aprovação com efeitos cruzados</h2>
  <p>Esta é a <strong>regra de negócio central</strong> da seção. Aprovar um orçamento dispara efeitos automáticos: cria os <strong>tratamentos de execução</strong> (um por item) e, na visão completa do produto, lança a <strong>receita no financeiro</strong> (entrada avulsa + N parcelas).</p>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">CLIN-041 + CLIN-060 (jul/2026) — materialização de tratamentos e financeiro na aprovação</div>
      <p><code>PATCH …/budgets/:id/status</code> com <code>approved</code> executa <code>MaterializeBudgetTreatmentsService</code> (cada <code>BudgetItem</code> → <code>PatientTreatment</code>, idempotente) <strong>e</strong> <code>GenerateBudgetFinancialEntriesService</code> (entrada + parcelas em <code>patient_financial_entries</code>, idempotente por orçamento). O ERP invalida queries de tratamentos, financeiro e <strong>oportunidades do CRM</strong> após mutações de orçamento. Aba <code>…/financeiro</code> integrada (CLIN-061).</p>
    </div>
  </div>

  <div class="alert alert-blue">
    <strong>Sync com o Funil de Venda (ago/2026).</strong> Criar orçamento também cria card no CRM (<code>origin=budget</code>). Aprovar/reprovar/expirar/reabrir movem o card; excluir remove. Detalhe em <a href="#crm-funil-vendas">CRM &amp; Funil de Vendas</a>.
  </div>

  <div class="mermaid">
flowchart LR
  Orcamento["Orçamento (pendente)"] --> Aprovar{"Aprovar"}
  Aprovar -->|"1 por item"| Tratamentos["Cria PatientTreatment"]
  Aprovar -->|"entrada + N parcelas"| Financeiro["Cria Lançamentos financeiros"]
  Aprovar -->|"card CRM"| Funil["Move para Ganha"]
  Financeiro -->|"1/3, 2/3, 3/3"| Receita["Receitas a receber"]
  Tratamentos --> Execucao["Execução clínica &amp; evoluções"]
  </div>

  <div class="card-grid">
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🏥</span> (a) Tratamentos de execução</div>
      <p>Cada <code>BudgetItem</code> aprovado vira um <code>PatientTreatment</code> na lista do paciente, pronto para ser executado e evoluído.</p>
    </div>
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">💸</span> (b) Receita no financeiro</div>
      <p>Gera o lançamento da entrada (avulsa) + N parcelas nomeadas <code>1/3</code>, <code>2/3</code>, <code>3/3</code>… vinculadas ao orçamento de origem.</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">🧲</span> (c) Card no Funil de Venda</div>
      <p>Oportunidade com <code>budgetId</code> vai para <em>Ganha</em> na aprovação (ou <em>Perdida</em> na reprovação/expiração). Ver <a href="#crm-funil-vendas">CRM &amp; Funil</a>.</p>
    </div>
  </div>

  <div class="alert alert-cyan">
    <span class="alert-icon">⚛️</span>
    <div class="alert-body">
      <div class="alert-title">Transação atômica</div>
      <p>Na aprovação, tratamentos e lançamentos financeiros são materializados junto com a mudança de status. O sync do card no CRM ocorre na mesma request de status (serviço de sync após persistir o orçamento).</p>
    </div>
  </div>

  <h2>4. Procedimentos &amp; evoluções clínicas</h2>
  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Aba Prontuário — integrada à clinica-api (jul/2026 · CLIN-041; nutrição ago/2026)</div>
      <p><code>/pacientes/[id]/tratamentos</code> — label <strong>Prontuário</strong>; copy da UI <strong>Procedimento</strong>. CRUD avulso + lista reordenável via <code>PATCH …/treatments/reorder</code>; itens de orçamento aparecem após aprovação. Evoluções avulsas via API. <strong>Finalizar procedimento</strong> (odonto/fisio): sheet → <code>PATCH …/treatments/:id/finalize</code> (status <code>completed</code> + evolução <code>source=treatment</code>) — único ponto que gera comissão <code>treatment_completed</code>. <strong>Nutrição:</strong> botão <strong>Inicializar</strong> → sheet Anamnese / Corporal / Plano de procedimento → <code>POST …/nutrition-init</code>; o item permanece <code>active</code>; toggle Mostrar finalizados usa os IDs já inicializados (cards verdes; menu ⋮ sem fundo cinza). Excluir finalizado: ConfirmDialog sem ícone — “Este procedimento, as receitas e os serviços vinculados, serão excluídos permanentemente da sua clínica.” PDF de evoluções (jsPDF; seção <strong>Evoluções do Paciente</strong>); atendimento nutricional usa documento detalhado. Upload de imagens = Fase 2 (CLIN-051).</p>
      <p><strong>Odontograma</strong> (odonto) ou <strong>mapa anatômico</strong> (fisio) abaixo de Adicionar Procedimento. Nutrição e procedimentos fisio <code>locationUiType=none</code> não pedem região (sem o aviso “não exige seleção de região anatômica”).</p>
    </div>
  </div>
  <p>Cada paciente tem sua lista de procedimentos em execução. A finalização (ou a inicialização nutricional) é o momento em que se registra a <strong>evolução clínica</strong>.</p>

  <div class="card-grid">
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">↕️</span> Lista &amp; reordenação</div>
      <p>Tratamentos por paciente com reordenação por arrastar (define a sequência de execução) e filtro <em>mostrar finalizados</em>.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">✅</span> Finalizar = atômico (jul/2026)</div>
      <p>Finalizar um tratamento é uma transação na API: status vira <code>concluído</code> + cria a <code>TreatmentEvolution</code> (<code>source=treatment</code>) + dispara accrual <code>treatment_completed</code> se houver regra. Anexar imagens (até 8) na mesma operação = Fase 2 (CLIN-051).</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">📝</span> Editor rich-text</div>
      <p>Evolução com texto formatado (negrito, listas, títulos) descrevendo conduta, achados e orientações ao paciente.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🖼️</span> Imagens antes/depois</div>
      <p>Upload de imagens via URLs assinadas, até 8 por evolução. Comparativo antes × depois para acompanhamento estético/funcional.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🗓️</span> Linha do tempo</div>
      <p>Evoluções agrupadas por data, formando o histórico clínico contínuo do paciente ao longo do tratamento.</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">🔍</span> Histórico de edição</div>
      <p>Auditoria imutável (<code>EvolutionHistory</code>): registra criado/editado, por quem e quando. Nada é apagado do rastro.</p>
    </div>
  </div>

  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Emissão de evoluções em PDF — client-side no ERP</div>
    <ul>
      <li><strong>Multi-seleção</strong> de evoluções para compor um único documento — implementado em <code>patient-treatment-emit-evolution-dialog.tsx</code></li>
      <li><strong>Ordem cronológica</strong> automática das evoluções selecionadas</li>
      <li><strong>Grade de imagens</strong> antes/depois renderizada no PDF (blueprint)</li>
      <li><strong>Área de assinatura</strong> do profissional responsável (placeholder no PDF mock)</li>
    </ul>
  </div>

  <h2>Regras de integridade clínica</h2>
  <div class="alert alert-red">
    <span class="alert-icon">🚫</span>
    <div class="alert-body">
      <div class="alert-title">Tratamento concluído não pode ser excluído</div>
      <p>Um tratamento <code>concluído</code> só pode ser <strong>cancelado</strong>, nunca apagado — isso preserva o histórico clínico e a rastreabilidade do que foi executado no paciente.</p>
    </div>
  </div>
  <div class="alert alert-orange">
    <span class="alert-icon">✍️</span>
    <div class="alert-body">
      <div class="alert-title">Evolução assinada é imutável</div>
      <p>Uma evolução já <strong>assinada</strong> não pode ser editada. Qualquer tentativa de alteração retorna <code>409 Conflict</code>. Correções exigem nova evolução complementar.</p>
    </div>
  </div>

  <h2>Generalização multi-especialidade</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Especialidade</th><th>"Item" do orçamento</th><th>Evolução típica</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Odontologia</td><td>Procedimento por dente/região</td><td>Foto intraoral antes/depois + conduta</td></tr>
        <tr><td class="td-bold">Fisioterapia</td><td>Pacote de sessões</td><td>Evolução funcional por sessão</td></tr>
        <tr><td class="td-bold">Estética</td><td>Protocolo (N aplicações)</td><td>Foto antes/depois + produtos usados</td></tr>
        <tr><td class="td-bold">Nutrição</td><td>Consulta / acompanhamento</td><td>Evolução de medidas e metas</td></tr>
        <tr><td class="td-bold">Psicologia</td><td>Pacote de atendimentos</td><td>Registro de sessão (sigiloso)</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Entidades de dados</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Entidade</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>Plan</code></td><td>Plano / tabela de preço (particular ou por convênio). O padrão é protegido</td></tr>
        <tr><td class="td-bold"><code>Treatment</code></td><td>Serviço do catálogo por especialidade — valor, custo, ativo; nome único por especialidade</td></tr>
        <tr><td class="td-bold"><code>Budget</code></td><td>Orçamento ao paciente: total, desconto, parcelamento, status</td></tr>
        <tr><td class="td-bold"><code>BudgetItem</code></td><td>Linha do orçamento: plano + serviço + profissional + região/sessão/item + valor; odontologia: dentes/faces no <code>locationLabel</code></td></tr>
        <tr><td class="td-bold"><code>PatientTreatment</code></td><td>Tratamento em execução, criado na aprovação do orçamento; reordenável; pinta odontograma (Aberto/Finalizado)</td></tr>
        <tr><td class="td-bold"><code>PatientToothAnnotation</code></td><td>Anotação clínica por dente (FDI) na aba Tratamentos; store-scoped</td></tr>
        <tr><td class="td-bold"><code>TreatmentEvolution</code></td><td>Evolução clínica (rich-text) gerada ao finalizar o tratamento</td></tr>
        <tr><td class="td-bold"><code>EvolutionImage</code></td><td>Imagem anexa à evolução (até 8), via URL assinada — antes/depois</td></tr>
        <tr><td class="td-bold"><code>EvolutionHistory</code></td><td>Auditoria imutável de criação/edição da evolução</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
