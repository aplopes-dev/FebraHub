WIKI.register({
  id: 'estoque-suprimentos',
  title: 'Estoque & Suprimentos',
  icon: '📦',
  searchText: 'estoque suprimentos insumos materiais medicamentos ANVISA lote validade FEFO rastreabilidade vencimento alerta estoque minimo pedido compra fornecedor curva ABC descartaveis EPI luvas mascaras seringa agulha anestesico cimento resina fio sutura clinica-api stock.api.service clinicaFetch DataTable historico retiradas sortBy sortOrder paginacao server-side formatLocalDateString SupplierSelect stock-suppliers stock-products stock-movements stock-entries stock-withdrawals erpDataTableStyleProps manualPagination',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Operações</div>
    <h1 class="section-title">📦 Estoque &amp; Suprimentos</h1>
    <p class="section-subtitle">Gestão de insumos, medicamentos e materiais clínicos com rastreabilidade completa de lote por paciente, controle FEFO e alertas automáticos de vencimento e estoque mínimo.</p>
    <div class="section-tags">
      <span class="tag-cyan">FEFO</span>
      <span class="tag-teal">Rastreabilidade ANVISA</span>
      <span class="tag-sky">Alerta de Vencimento</span>
    </div>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Implementado no ERP + clinica-api — <code>/clinic/estoque</code></div>
      <p><strong>Backend:</strong> módulo <code>stock</code> em <code>apps/verticals/clinica/api</code> (migration <code>20260708144811_add_stock</code>) — fornecedores, produtos, entradas, retiradas, movimentos e estatísticas; foto via MinIO; permissão <code>store.clinic.settings.manage</code>.<br>
      <strong>ERP:</strong> <code>features/clinic/estoque/</code> · serviço <code>stock.api.service.ts</code> via <code>clinicaFetch</code>/<code>clinicaUpload</code> (proxy <code>/api/proxy/clinica</code> + <code>X-Store-Id</code>).<br>
      <strong>Listagem de produtos:</strong> <code>DataTable</code> com <code>erpDataTableStyleProps</code> (cabeçalhos alinhados à esquerda), ordenação asc/desc em todas as colunas (server-side), busca com debounce 400ms, paginação <code>StockPaginationBar</code> (10/20/50/100).<br>
      <strong>Operações:</strong> entrada no estoque (produto novo ou existente), retirada, CRUD fornecedor (<code>SupplierSelect</code> com criar no popover), upload/remoção de foto do produto.<br>
      <strong>Histórico de retiradas:</strong> sheet com <code>WithdrawalTable</code>, filtros de data (<code>yyyy-MM-dd</code> — dia civil inteiro no backend) e ordenação server-side por produto, quantidade, retirado por, autorizado por e data.</p>
    </div>
  </div>

  <h2>Endpoints (clinica-api · jul/2026)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Recurso</th><th>Rotas</th><th>Notas</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Fornecedores</td><td><code>GET/POST/PUT/DELETE /v1/stock-suppliers</code></td><td>Nome único por loja</td></tr>
        <tr><td class="td-bold">Produtos</td><td><code>GET/POST/PUT/DELETE /v1/stock-products</code></td><td>Listagem: <code>page</code>, <code>perPage</code>, <code>search</code>, <code>sortBy</code>, <code>sortOrder</code></td></tr>
        <tr><td class="td-bold">Foto</td><td><code>POST/GET/DELETE /v1/stock-products/:id/photo</code></td><td>MinIO</td></tr>
        <tr><td class="td-bold">Entradas</td><td><code>POST /v1/stock-entries</code>, <code>POST /v1/stock-entries/bulk</code></td><td>Incrementa quantidade (transacional no bulk)</td></tr>
        <tr><td class="td-bold">Retiradas</td><td><code>POST /v1/stock-withdrawals</code></td><td>Valida estoque disponível</td></tr>
        <tr><td class="td-bold">Movimentos</td><td><code>GET /v1/stock-movements</code></td><td>Filtros: <code>type</code>, <code>productId</code>, <code>startDate</code>, <code>endDate</code>, <code>sortBy</code>, <code>sortOrder</code></td></tr>
        <tr><td class="td-bold">Stats</td><td><code>GET /v1/stock-stats</code></td><td>Totais e contagem por status (in/low/out)</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-amber">
    <span class="alert-icon">💡</span>
    <div class="alert-body">
      <div class="alert-title">Blueprint (ainda não implementado)</div>
      <p>Lotes, FEFO, rastreabilidade ANVISA por paciente, pedidos de compra, curva ABC e alertas de vencimento permanecem como visão de produto — o MVP atual cobre catálogo, movimentação básica e histórico de retiradas.</p>
    </div>
  </div>

  <h2>8.1 Cadastro de produtos</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">🩺</span> Insumos e Materiais</div>
      <p>Gaze, seringa, agulha, anestésico, cimento dentário, resina composta, fio de sutura, ataduras, esparadrapo. Categoria, fornecedor, custo unitário.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">💊</span> Medicamentos</div>
      <p>Código ANVISA, princípio ativo, apresentação, concentração, fabricante. Controle especial (Portaria 344) com registro em livro de controle.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🧤</span> EPIs e Descartáveis</div>
      <p>Luvas, máscaras cirúrgicas e N95, aventais, toucas, propés. Consumo vinculado ao número de atendimentos para cálculo de custo por consulta.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">🛒</span> Produtos para Venda</div>
      <p>Kit de higiene bucal, probiótico, órteses, suplementos — produtos vendidos ao paciente com markup e preço de venda configurável.</p>
    </div>
  </div>

  <h2>8.2 Movimentação de estoque</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tipo</th><th>Trigger</th><th>Registro</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Entrada</td><td>Nota fiscal do fornecedor</td><td>Lote, validade, local de armazenamento, NF vinculada</td></tr>
        <tr><td class="td-bold">Saída por consumo</td><td>Procedimento/atendimento</td><td>Vinculada ao paciente — rastreabilidade lote → paciente</td></tr>
        <tr><td class="td-bold">Saída por descarte</td><td>Produto vencido ou danificado</td><td>Motivo documentado, aprovação do responsável</td></tr>
        <tr><td class="td-bold">Transferência</td><td>Entre almoxarifados</td><td>Clínicas com múltiplas salas ou andares</td></tr>
        <tr><td class="td-bold">Inventário</td><td>Contagem periódica</td><td>Ajuste de estoque com justificativa e assinatura</td></tr>
      </tbody>
    </table>
  </div>

  <h2>8.3 Controle de vencimento e alertas</h2>
  <div class="card-grid">
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">⏰</span> Alertas de Vencimento</div>
      <p>30 dias antes: notificação de atenção. 15 dias: alerta amarelo. 7 dias: alerta vermelho urgente. Enviado ao responsável via e-mail e notificação no sistema.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🔄</span> FEFO Automático</div>
      <p>First Expired, First Out: sistema sugere usar o lote mais próximo do vencimento ao registrar saída de estoque. Reduz desperdício de materiais.</p>
    </div>
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">🔍</span> Rastreabilidade</div>
      <p>Qual paciente recebeu qual lote de qual insumo. Permite recall em caso de problema com lote de fabricante. Exigência ANVISA RDC 430/2020 para medicamentos.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">📦</span> Estoque Mínimo</div>
      <p>Geração automática de pedido de compra sugerido quando o estoque atinge o mínimo configurado. Nunca faltar insumo durante atendimento.</p>
    </div>
  </div>

  <h2>8.4 Compras</h2>
  <ul>
    <li>Cadastro de fornecedores com contato, prazo de entrega e histórico de preços</li>
    <li>Pedido de compra: gerado manualmente ou pelo alerta automático de estoque mínimo</li>
    <li>Aprovação de compras acima de valor configurável pelo administrador</li>
    <li>Recebimento e conferência: entrada do produto no estoque após confirmação do NF</li>
    <li>Relatório de curva ABC de consumo — quais insumos têm maior impacto no custo</li>
    <li>Histórico de preços por fornecedor para negociação</li>
  </ul>

  <h2>Entidades de dados (schema_clinic)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Entidade</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>StockItem</code></td><td>Produto em estoque: nome, código ANVISA, unidade, estoque mínimo</td></tr>
        <tr><td class="td-bold"><code>StockBatch</code></td><td>Lote: stockItemId, quantidade, validade, localização, fornecedor, NF</td></tr>
        <tr><td class="td-bold"><code>StockMovement</code></td><td>Movimentação: tipo (entrada/saída/ajuste), batchId, quantidade, patientId (se consumo)</td></tr>
        <tr><td class="td-bold"><code>PurchaseOrder</code></td><td>Pedido de compra: itens, fornecedor, status, aprovação, NF recebida</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
