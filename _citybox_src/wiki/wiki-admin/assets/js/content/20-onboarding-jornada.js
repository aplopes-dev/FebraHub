WIKI.register({
  id: 'onboarding-jornada',
  title: 'Onboarding e Jornada',
  icon: '🚀',
  searchText: 'onboarding jornada go-live checklist implantação passos loja configuração módulos equipe integração ativação guia wizard lojista',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Clientes</div>
  <h1 class="section-title">🚀 Onboarding e Jornada</h1>
  <p class="section-subtitle">Jornada guiada de ativação — do contrato assinado ao go-live da primeira loja. Checklist de implantação visível para o operador e para o lojista.</p>
  <div class="section-tags">
    <span class="tag-teal">Implantação guiada</span>
    <span class="status-badge status-proposed">🔵 Feature nova</span>
    <span class="tag-p2">P2</span>
  </div>
</div>

<h2>Fluxo de onboarding completo</h2>
<div class="mermaid">
flowchart TD
  A[Cliente criado\nStatus: implantacao] --> B[Fase 1: Dados da empresa\nDados cadastrais completos + NF fiscal]
  B --> C[Fase 2: Criar primeira loja\nVertical + endereço + configurações básicas]
  C --> D[Fase 3: Configurar módulos\nKDS / Totem / PDV / iFood / Stone]
  D --> E[Fase 4: Criar equipe\nMembro gerente com senha provisória]
  E --> F[Fase 5: Teste de pedido\nPelo menos 1 pedido real de teste]
  F --> G[Fase 6: Validação fiscal\nConfigurações SEFAZ homologação]
  G --> H{Checklist 100%?}
  H -->|Sim| I[Ativação go-live\nStatus: ativo]
  H -->|Não| J[Operador revisita itens pendentes]
  J --> B
</div>

<h2>Mockup — Wizard de onboarding</h2>
<div class="mockup-container">
  <div class="mock-topbar">
    <span class="mock-logo">🚀 Onboarding — VarejoX S.A.</span>
    <span style="margin-left:auto;"><span class="mock-badge mock-badge-teal">67% concluído</span></span>
  </div>
  <div class="mock-body">
    <div class="mock-wizard">
      <div class="mock-wizard-steps">
        <div class="mock-wizard-step done"><span class="mock-wizard-num">✓</span><span class="mock-wizard-label">Empresa</span></div>
        <div class="mock-wizard-step done"><span class="mock-wizard-num">✓</span><span class="mock-wizard-label">Loja</span></div>
        <div class="mock-wizard-step active"><span class="mock-wizard-num">3</span><span class="mock-wizard-label">Módulos</span></div>
        <div class="mock-wizard-step"><span class="mock-wizard-num">4</span><span class="mock-wizard-label">Equipe</span></div>
        <div class="mock-wizard-step"><span class="mock-wizard-num">5</span><span class="mock-wizard-label">Teste</span></div>
        <div class="mock-wizard-step"><span class="mock-wizard-num">6</span><span class="mock-wizard-label">Go-live</span></div>
      </div>
      <div class="mock-row" style="font-size:12px;"><span>✅</span><span style="flex:1">Membro gerente criado com acesso ao ERP</span><span class="mock-badge mock-badge-green">Auto</span></div>
      <div class="mock-row" style="font-size:12px;"><span>⏳</span><span style="flex:1">Configuração fiscal homologada (SEFAZ)</span><span class="mock-badge mock-badge-yellow">Manual</span></div>
      <div class="mock-row" style="font-size:12px;"><span>⬜</span><span style="flex:1">Pedido de teste realizado pelo lojista</span><span class="mock-badge mock-badge-gray">Pendente</span></div>
      <div style="margin-top:10px;"><span class="btn btn-primary" style="padding:5px 12px;font-size:12px">Continuar</span></div>
    </div>
  </div>
</div>
<p class="mermaid-caption">Wireframe ilustrativo do wizard de onboarding: passos da implantação (empresa → go-live) com itens automáticos e manuais. O lojista vê o espelho no <a href="../wiki-erp/wiki-erp/index.html#visao-geral">ERP</a>.</p>

<h2>Checklist de go-live por cliente</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Item</th><th>Responsável</th><th>Automático?</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">Dados cadastrais completos (CNPJ, endereço, responsável)</td><td>Operador</td><td>✅ Validado na criação</td></tr>
      <tr><td class="td-bold">Plano SaaS selecionado e assinatura ativa</td><td>Operador</td><td>✅ Automático</td></tr>
      <tr><td class="td-bold">Pelo menos 1 loja criada</td><td>Operador</td><td>✅ Automático</td></tr>
      <tr><td class="td-bold">Pelo menos 1 módulo ativo na loja</td><td>Operador</td><td>✅ Automático</td></tr>
      <tr><td class="td-bold">Membro gerente criado com acesso ao ERP</td><td>Operador</td><td>✅ Automático</td></tr>
      <tr><td class="td-bold">Primeiro login do gerente confirmado</td><td>Lojista</td><td>✅ Via Keycloak event</td></tr>
      <tr><td class="td-bold">Pedido de teste realizado</td><td>Lojista</td><td>✅ Via orders event</td></tr>
      <tr><td class="td-bold">Configuração fiscal homologada</td><td>Operador</td><td>Manual</td></tr>
      <tr><td class="td-bold">Integrações configuradas (se contratadas)</td><td>Operador</td><td>Manual</td></tr>
      <tr><td class="td-bold">Go-live autorizado pelo operador</td><td>Operador</td><td>Manual</td></tr>
    </tbody>
  </table>
</div>

<h2>Interface no Admin</h2>
<div class="blueprint-proposed">
  <div class="blueprint-proposed-label">Proposta (alvo)</div>
  <ul>
    <li>Na lista de clientes: barra de progresso do checklist visível para clientes em implantação</li>
    <li>No detalhe do cliente: aba "Onboarding" com o checklist completo e status de cada item</li>
    <li>Itens pendentes em destaque com botão de ação rápida ("Criar loja", "Configurar módulos")</li>
    <li>Notificação automática para o operador quando o lojista conclui itens de sua responsabilidade</li>
    <li>Botão "Ativar loja" só aparece quando todos os itens obrigatórios estão concluídos</li>
  </ul>
</div>

<h2>Jornada do lojista (perspectiva do ERP)</h2>
<p>O lojista vê seu próprio checklist no ERP com os itens que dependem dele. O operador pode adicionar notas a cada item.</p>
<div class="card-grid">
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">📧</span> Convite por e-mail</div>
    <p>Lojista recebe e-mail de boas-vindas com link para definir senha e acessar o ERP. E-mail disparado pela Platform API ao criar o membro gerente.</p>
  </div>
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">📋</span> Checklist no ERP</div>
    <p>Ao entrar, o lojista vê os itens que dependem dele: configurar cardápio, adicionar métodos de pagamento, fazer pedido de teste.</p>
  </div>
  <div class="card card-blue">
    <div class="card-title"><span class="card-icon">🎉</span> Celebração do go-live</div>
    <p>Ao atingir 100% do checklist, mensagem de celebração + e-mail de confirmação para o responsável do cliente.</p>
  </div>
</div>
`
});
