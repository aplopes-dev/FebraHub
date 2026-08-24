WIKI.register({
  id: 'crm-funil-vendas',
  title: 'CRM & Funil de Vendas',
  icon: '🧲',
  searchText: 'crm funil de vendas kanban pipeline oportunidades quadro etapas estagios drag and drop arrastar soltar reordenar colunas cards sortOrder reorder funis multiplos agendamento avaliacao venda Agendada Perdida ganho perdido terminal funil padrao protegido rotulos labels coloridos origem periodo custom yyyy-MM-dd dia civil BRT clinica-api sales.api.service clinicaFetch /clinic/vendas Funnel FunnelStage Opportunity OpportunityHistory Label ERP API implementado Kanban onCardDrop CASL sales_view_funnel sales_manage_opportunities sales_access canViewSalesFunnel orcamento budget budgetId SyncBudgetSalesOpportunity Em aberto Ganha Perdida origin Orçamento',
  html: `
<div class="section-content">

  <div class="section-header">
    <div class="section-breadcrumb">CRM e Crescimento</div>
    <h1 class="section-title">🧲 CRM &amp; Funil de Vendas</h1>
    <p class="section-subtitle">Pipeline operacional de oportunidades em formato Kanban: arraste cards entre etapas, gerencie múltiplos funis e acompanhe cada negociação do primeiro contato ao fechamento.</p>
    <div class="section-tags">
      <span class="tag-cyan">Kanban</span>
      <span class="tag-teal">Pipeline</span>
      <span class="tag-violet">Oportunidades</span>
      <span class="tag-green">API</span>
    </div>
  </div>

  <div class="alert alert-blue">
    <strong>Diferença para CRM de relatório.</strong> Esta seção descreve o <strong>CRM operacional</strong>: um quadro Kanban onde a equipe comercial e a recepção trabalham as oportunidades no dia a dia, movendo cards entre etapas do funil.
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Implementado (API + ERP) — <code>/vendas</code></div>
      <p><strong>Backend:</strong> módulo <code>sales</code> na <code>clinica-api</code> (<code>/v1/funnels</code>, <code>/v1/opportunities</code>, <code>/v1/labels</code>); migration <code>20260713130319_add_sales_clinic</code> (inclui <code>sort_order</code> nas oportunidades).<br>
      <strong>Web:</strong> <code>apps/verticals/clinica/web/.../vendas/</code> · <code>sales.api.service.ts</code> via <code>clinicaFetch</code> · hooks com <code>useClinicId</code>/<code>storeId</code>.<br>
      <strong>UI:</strong> organism <code>Kanban</code> (<code>@citybox/ui</code>) com <code>onCardDrop</code>, reordenação de colunas e drag otimista.<br>
      <strong>CASL (ago/2026):</strong> <code>sales_access</code> só abre o módulo; criar/editar/mover exige <code>sales_manage_opportunities</code>. Visibilidade de funis por checkbox (<code>sales_view_funnel_*</code> / <code>sales_view_clinic_funnels</code>); helper <code>canViewSalesFunnel</code> — API filtra <code>GET /v1/funnels</code> e oportunidades; só <code>sales_access</code> = lista vazia. Manage oportunidades vê todos os funis.</p>
    </div>
  </div>

  <h2>Visão geral do funil</h2>
  <p>Cada oportunidade percorre uma sequência de etapas até ser marcada como <strong>ganha/agendada</strong> ou <strong>perdida</strong>. O diagrama abaixo representa um funil padrão de captação.</p>

  <div class="mermaid">
flowchart LR
    A[Lead] --&gt; B[Contato]
    B --&gt; C[Avaliação]
    C --&gt; D[Proposta]
    D --&gt; G([Ganho / Agendada])
    D --&gt; P([Perdida])
    C --&gt; P
    B --&gt; P
  </div>

  <h2>1. Quadro Kanban de oportunidades</h2>
  <p>O quadro exibe uma <strong>coluna por etapa</strong> do funil selecionado, e cada coluna lista os <strong>cards de oportunidade</strong> naquele estágio.</p>

  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">🖱️</span> Arrastar cards</div>
      <p>Mova entre colunas ou reordene <strong>dentro</strong> da mesma coluna. A ordem persiste no backend via <code>sortOrder</code> + <code>PATCH /v1/opportunities/reorder</code> (e <code>move</code> com <code>sortOrder</code> ao mudar de etapa).</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">↔️</span> Reordenar etapas</div>
      <p>Arraste pela alça das colunas <strong>móveis</strong>. <strong>Agendada</strong> (won) e <strong>Perdida</strong> (lost) ficam <strong>fixas no fim</strong> — nunca depois delas; novas etapas entram só antes.</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">✏️</span> CRUD inline</div>
      <p>Crie, renomeie e exclua funis, etapas e rótulos no quadro. Ao editar etapa, a cor hex vem pré-selecionada (API grava UPPERCASE; o Select normaliza).</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">🏷️</span> Rótulos coloridos</div>
      <p>Aplique <code>Label</code> coloridos aos cards para destacar prioridade, especialidade ou tipo de tratamento.</p>
    </div>
  </div>

  <h2>2. Funis múltiplos</h2>
  <p>A clínica mantém <strong>vários funis</strong>. O seed <code>ensure-defaults</code> cria, entre outros, <strong>Funil de Agendamento</strong> (terminal won = &quot;Agendada&quot;) e <strong>Funil de Venda</strong> (won = &quot;Ganha&quot;).</p>

  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Funil padrão</th><th>Uso típico</th></tr>
      </thead>
      <tbody>
        <tr><td class="td-bold">Funil de Agendamento</td><td>Conduzir interessados até marcar a primeira avaliação (etapa terminal <em>Agendada</em>).</td></tr>
        <tr><td class="td-bold">Funil de Venda</td><td>Converter avaliações em planos/pacotes (etapa terminal <em>Ganha</em>).</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-amber">
    <strong>Regras de proteção.</strong> Etapas terminais <strong>won/lost</strong> (ex.: Agendada/Ganha e Perdida) não são arrastáveis e ficam com <code>order</code> 998/999. Funil <strong>default</strong> não pode ser excluído. Etapa com oportunidades não pode ser excluída. Ao reordenar etapas no PATCH do funil, o save usa <strong>duas fases</strong> de <code>order</code> (temporário → final) para não violar o UNIQUE <code>(funnel_id, order)</code>.
  </div>

  <div class="alert alert-blue">
    <strong>Orçamento → Funil de Venda (ago/2026).</strong> Ao criar um orçamento na ficha do paciente, a API (<code>SyncBudgetSalesOpportunityService</code>) cria automaticamente um card em <em>Em aberto</em> no Funil de Venda. Campos: <code>origin=budget</code> (UI mostra <strong>Orçamento</strong>), <code>budgetId</code>, título = nome do paciente, telefone do paciente. Aprovar → <em>Ganha</em>; reprovar ou expirar → <em>Perdida</em>; reabrir → <em>Em aberto</em>; excluir orçamento não aprovado remove o card (<code>onDelete: Cascade</code>). Cards com <code>budgetId</code> só podem ser arrastados entre etapas <code>others</code> (ex.: Em aberto ↔ Em andamento) — Ganha/Perdida só via status do orçamento (API <code>SalesOpportunityBudgetTerminalMoveError</code> 422 + bloqueio no kanban FE). Mutações de orçamento invalidam <code>salesQueryKeys.opportunities</code> para o quadro atualizar sem reload. Migration manual: <code>20260807140000_add_sales_opportunity_budget_id</code>.
  </div>

  <h3>Visibilidade por permissão (Equipe)</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Checkbox</th><th>Funil liberado</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>sales_view_funnel_schedule</code></td><td>Default <em>Funil de Agendamento</em></td></tr>
        <tr><td class="td-bold"><code>sales_view_funnel_sales</code></td><td>Default <em>Funil de Venda</em></td></tr>
        <tr><td class="td-bold"><code>sales_view_funnel_custom</code> ou <code>sales_view_clinic_funnels</code></td><td>Qualquer funil com <code>isDefault: false</code></td></tr>
        <tr><td class="td-bold"><code>sales_manage_opportunities</code></td><td>Todos os funis (+ mutações)</td></tr>
      </tbody>
    </table>
  </div>

  <h2>3. A oportunidade</h2>
  <p>Cada oportunidade (<code>SalesOpportunity</code>) carrega vínculo (paciente ou lead), origem, próximo contato, rótulo e <code>sortOrder</code> na coluna.</p>

  <div class="card-grid">
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">👤</span> Vínculo</div>
      <p>Paciente cadastrado ou lead sem cadastro (nome/telefone avulsos).</p>
    </div>
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">📍</span> Origem</div>
      <p>Instagram, indicação, campanha, site, <strong>Orçamento</strong> (<code>budget</code>), etc. — para medir conversão. Labels PT no card/filtro/histórico.</p>
    </div>
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">📅</span> Próximo contato</div>
      <p>Data de follow-up; filtrável no quadro.</p>
    </div>
    <div class="card card-rose">
      <div class="card-title"><span class="card-icon">#️⃣</span> Ordem na coluna</div>
      <p>Campo <code>sortOrder</code> (0-based). Listagem <code>orderBy sortOrder asc</code>. Persistido no drop do kanban.</p>
    </div>
  </div>

  <h2>4. Detalhe da oportunidade</h2>
  <p>Sheet com edição, comentários e timeline imutável (<code>OpportunityHistory</code>).</p>

  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Evento</th><th>Diff registrado</th></tr>
      </thead>
      <tbody>
        <tr><td class="td-bold">Criado</td><td>Estado inicial.</td></tr>
        <tr><td class="td-bold">Movido de etapa</td><td>Etapa anterior → nova.</td></tr>
        <tr><td class="td-bold">Comentário</td><td>Texto.</td></tr>
        <tr><td class="td-bold">Rótulo alterado</td><td>Só quando <code>labelId</code> é enviado de fato (não <code>undefined</code>).</td></tr>
        <tr><td class="td-bold">Atualizado</td><td>Campos editados com antes/depois.</td></tr>
      </tbody>
    </table>
  </div>

  <h2>5. Filtros</h2>
  <p>Funil, período, rótulo, origem, etapa, próximo contato e busca textual. Tudo no backend (listagem paginada).</p>

  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">📆</span> Período custom</div>
      <p><strong>Escolher período</strong> + data inicial/final na <strong>mesma linha</strong> do select. Front envia <code>yyyy-MM-dd</code> (<code>formatLocalDateString</code>); API expande para o <strong>dia civil inteiro em BRT (UTC−3)</strong>. Basta uma das datas.</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">🔗</span> Captação de leads</div>
      <p>Campanhas reutilizam funis via <code>useFunnels</code> / <code>getFunnel</code> (store obrigatório). Cada submissão elegível cria ou atualiza uma oportunidade com <code>origin=campaign</code> e <code>submissionId</code>. No sheet da oportunidade, a seção <strong>Campanha</strong> exibe o nome e abre a resposta original em um sheet aninhado.</p>
    </div>
  </div>

  <h2>API (clinica-api)</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Recurso</th><th>Endpoints principais</th></tr>
      </thead>
      <tbody>
        <tr><td class="td-bold">Funis</td><td><code>GET/POST /v1/funnels</code>, <code>POST …/ensure-defaults</code>, <code>PATCH/DELETE /v1/funnels/:id</code></td></tr>
        <tr><td class="td-bold">Oportunidades</td><td><code>GET/POST /v1/opportunities</code>, <code>PATCH …/reorder</code>, <code>PATCH …/:id/move</code>, histórico/comentários</td></tr>
        <tr><td class="td-bold">Rótulos</td><td><code>GET/POST/PATCH/DELETE /v1/labels</code></td></tr>
      </tbody>
    </table>
  </div>
  <p>Permissão: <code>store.clinic.patients.manage</code> + header <code>X-Store-Id</code>.</p>

  <h2>Entidades</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Entidade</th><th>Descrição</th></tr>
      </thead>
      <tbody>
        <tr><td class="td-bold"><code>SalesFunnel</code></td><td>Funil; default protegido contra exclusão.</td></tr>
        <tr><td class="td-bold"><code>SalesFunnelStage</code></td><td>Etapa — tipo <code>others</code> / <code>won</code> / <code>lost</code>, cor, order (won=998, lost=999).</td></tr>
        <tr><td class="td-bold"><code>SalesOpportunity</code></td><td>Oportunidade + <code>sortOrder</code> na etapa.</td></tr>
        <tr><td class="td-bold"><code>SalesOpportunityHistory</code></td><td>Histórico append-only.</td></tr>
        <tr><td class="td-bold"><code>SalesLabel</code></td><td>Rótulo colorido por loja.</td></tr>
      </tbody>
    </table>
  </div>

  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">Evolução</div>
    <ul>
      <li>Paginação por coluna / infinite scroll no kanban (hoje <code>perPage</code> até 2000).</li>
      <li>Métricas de conversão por etapa/origem.</li>
    </ul>
  </div>

</div>
`
});
