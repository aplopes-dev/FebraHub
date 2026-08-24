WIKI.register({
  id: 'interfaces-ux',
  title: 'Interfaces e UX do Sistema',
  icon: '🖥️',
  searchText: 'interface UX ERP web backoffice sidebar header busca global menu modulos agenda recepcao prontuarios financeiro convenios estoque equipe relatorios configuracoes PDV recepcao checkout rapido app mobile profissional garcom clinico bottom navigation voz prescrever notificacoes PageNav overflow-x responsivo tablet sheet AlertDialog guard FilterPopover DataTable fillViewport',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Interfaces e UX</div>
    <h1 class="section-title">🖥️ Interfaces e UX do Sistema</h1>
    <p class="section-subtitle">O ERP Clinic tem três superfícies principais: o backoffice web (otimizado para desktop de recepção), o PDV de cobrança (rápido e teclável) e o app mobile do profissional (consulta em movimento).</p>
    <div class="section-tags">
      <span class="tag-cyan">ERP Web</span>
      <span class="tag-teal">PDV Recepção</span>
      <span class="tag-sky">App Mobile Profissional</span>
    </div>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">ERP Clinic — padrões responsivos no backoffice (jul/2026)</div>
      <p>Além do blueprint desktop/PDV/app nativo abaixo, o <strong>ERP web</strong> da vertical Clínica já aplica:</p>
      <ul>
        <li><strong>PageNav</strong> (<code>@citybox/ui</code>): scroll horizontal nativo — abas Financeiro / Configurações / Dashboard não cortam no mobile.</li>
        <li><strong>Layouts densos</strong> (financeiro): no mobile liberar altura (sem <code>overflow-hidden</code> travando); scroll no shell para a tabela aparecer.</li>
        <li><strong>KPIs tablet:</strong> preferir 2+1 (Receita|Despesa / Saldo) a empilhar 3 cards.</li>
        <li><strong>Sheets:</strong> <code>max-w</code> com <code>min(..., calc(100%-2rem))</code>; popovers de filtro com largura limitada à viewport + <code>collisionPadding</code>.</li>
        <li><strong>Tabelas:</strong> wrapper <code>overflow-x-auto</code> quando há nome longo + badge (planos, anamneses, comissões no sheet).</li>
        <li><strong>AlertDialog sobre Sheet:</strong> guard ~400ms + bloquear <code>onInteractOutside</code> após confirmar (evita dismiss fantasma ao trocar plano/contrato padrão).</li>
        <li><strong>ScrollArea vs overflow:</strong> listas com scroll-x interno no sheet usam <code>overflow-y-auto</code> no body — <code>ScrollArea</code> Radix atrapalha o eixo X.</li>
      </ul>
      <p>Detalhe por módulo: <a href="#financeiro-caixa">Financeiro</a>, <a href="#equipe-rh">Equipe</a>, <a href="#configuracoes-parametros">Configurações</a>.</p>
    </div>
  </div>

  <h2>13.1 ERP Web (backoffice) — shell geral</h2>

  <h3>Header (3 zonas)</h3>
  <div class="mockup-container">
    <div class="mock-topbar">
      <span class="mock-logo">🏥 Clínica Saúde Integrada · Ilhéus</span>
      <span style="flex:1;margin:0 16px;background:rgba(255,255,255,.2);padding:5px 12px;border-radius:6px;font-size:12px;color:rgba(255,255,255,.7)">🔍 Buscar paciente, consulta, prontuário…</span>
      <span style="margin-right:12px;font-size:13px">🔔 3</span>
      <span style="font-size:13px">👤 Dr. João Silva</span>
    </div>
    <div class="mock-body" style="display:flex;gap:12px;align-items:center">
      <span style="font-size:12px;color:#6b7280">Esquerda: logo da clínica</span>
      <span style="font-size:12px;color:#6b7280">Centro: busca global</span>
      <span style="font-size:12px;color:#6b7280">Direita: notif + perfil</span>
    </div>
  </div>

  <h3>Sidebar (Icon Rail + Drawer)</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Ícone</th><th>Módulo</th><th>Submenus principais</th></tr></thead>
      <tbody>
        <tr><td>📅</td><td class="td-bold">Agenda</td><td>Hoje, Semana, Profissionais, Bloqueios</td></tr>
        <tr><td>🏨</td><td class="td-bold">Recepção</td><td>Sala de Espera, Check-in, Triagem</td></tr>
        <tr><td>📋</td><td class="td-bold">Prontuários</td><td>Buscar Paciente, Novo Paciente, Atendimento do Dia</td></tr>
        <tr><td>💰</td><td class="td-bold">Financeiro</td><td>Caixa, Contas a Receber, Contas a Pagar, Fluxo</td></tr>
        <tr><td>🏥</td><td class="td-bold">Convênios</td><td>Guias, Produção, Glosas, Operadoras</td></tr>
        <tr><td>📦</td><td class="td-bold">Estoque</td><td>Inventário, Entradas, Saídas, Compras</td></tr>
        <tr><td>👥</td><td class="td-bold">Equipe</td><td>Profissionais, Escalas, Comissões</td></tr>
        <tr><td>📊</td><td class="td-bold">Relatórios</td><td>Dashboards, Exportações</td></tr>
        <tr><td>⚙️</td><td class="td-bold">Config</td><td>Clínica, Usuários, Permissões, Integrações</td></tr>
      </tbody>
    </table>
  </div>

  <h2>13.2 Tela de agenda — grade principal</h2>
  <p>Grade semanal com colunas por profissional e linhas por horário (slots de 15, 20, 30 ou 60 min — configurável por especialidade):</p>
  <ul>
    <li>Arrastar e soltar para remarcar consultas entre slots/profissionais</li>
    <li>Botão de ação contextual ao status do card (Confirmar → Check-in → Iniciar → Encerrar → Cobrar)</li>
    <li>Menu de opções secundárias ao clicar com botão direito ou pressionar o card no mobile</li>
    <li>Card exibe: nome do paciente (nome social se definido), procedimento, convênio ou particular, ícone de alerta para pendências</li>
  </ul>

  <h2>13.3 Tela de prontuário — layout em abas</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">📌</span> Aba Resumo</div>
      <p>Foto do paciente, alertas críticos (alergias, medicamentos em uso, avisos da equipe), últimas consultas resumidas.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">✏️</span> Aba Atendimento Atual</div>
      <p>SOAP do dia — foco do profissional durante a consulta. Campo de voz-para-texto ativo. Assinatura digital ao finalizar.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">📅</span> Aba Histórico</div>
      <p>Timeline de todos os atendimentos com expansão do SOAP completo. Filtro por profissional ou por período.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">💊</span> Aba Prescrições</div>
      <p>Todas as receitas emitidas com status (enviada, retirada, expirada). Reutilizar receita anterior com um clique.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🔬</span> Aba Exames</div>
      <p>Pedidos de exame e resultados ao longo do tempo. Upload de resultados em PDF vinculado ao pedido.</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">🦷</span> Aba Odontograma</div>
      <p>Exclusivo para odontologia — substitui aba de "Atendimento Atual". Charting visual interativo, plano de tratamento e fotos.</p>
    </div>
  </div>

  <h2>13.4 PDV da recepção (checkout)</h2>
  <p>Interface simplificada em 3 colunas para máxima velocidade na cobrança:</p>
  <div class="mockup-container">
    <div class="mock-topbar" style="font-size:12px">PDV — Cobrança · Ana Paula · 14/06/2026 14:30</div>
    <div class="mock-body" style="display:grid;grid-template-columns:2fr 1fr 1.5fr;gap:12px">
      <div>
        <div style="font-size:11px;font-weight:700;color:#0e7490;margin-bottom:8px">ITENS A COBRAR</div>
        <div style="background:#fff;border:1px solid #a5f3fc;border-radius:6px;padding:10px;font-size:12px">
          <div style="display:flex;justify-content:space-between"><span>Consulta clínica geral</span><span>R$ 180,00</span></div>
          <div style="display:flex;justify-content:space-between;margin-top:4px"><span>Coparticipação Unimed</span><span>R$ 20,00</span></div>
        </div>
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;color:#0e7490;margin-bottom:8px">TOTAIS</div>
        <div class="mock-kpi"><div class="mock-kpi-value" style="color:#0891b2">R$ 200</div><div class="mock-kpi-sub">Total a cobrar</div></div>
        <div style="margin-top:8px;font-size:12px">Desconto: <input style="width:50px;border:1px solid #a5f3fc;border-radius:4px;padding:2px 4px" value="0%"></div>
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;color:#0e7490;margin-bottom:8px">PAGAMENTO</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="mock-btn mock-btn-primary" style="font-size:11px">PIX QR Code</button>
          <button class="mock-btn mock-btn-outline" style="font-size:11px">Cartão (maquininha)</button>
          <button class="mock-btn mock-btn-outline" style="font-size:11px">Dinheiro</button>
          <button class="mock-btn mock-btn-outline" style="font-size:11px">Convênio</button>
        </div>
      </div>
    </div>
  </div>

  <h2>13.5 App mobile do profissional</h2>
  <p>App leve para o profissional em atendimento — acesso rápido ao prontuário sem voltar ao computador:</p>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">📋</span> Pacientes do Dia</div>
      <p>Lista com status em tempo real. Qual paciente está aguardando, em atendimento ou já saiu.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🎙️</span> Prontuário por Voz</div>
      <p>Abertura do prontuário com um toque. Dita a evolução SOAP por voz — o sistema transcreve com IA.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">💊</span> Prescrição Rápida</div>
      <p>Histórico de medicamentos mais usados pelo profissional. Reutilizar prescrição anterior em 2 toques.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">✍️</span> Assinatura Mobile</div>
      <p>Assinatura de documentos pelo celular. Prontuário assinado enquanto o paciente ainda está na sala.</p>
    </div>
  </div>
</div>
`
});
