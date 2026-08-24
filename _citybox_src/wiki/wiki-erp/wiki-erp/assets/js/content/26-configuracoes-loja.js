WIKI.register({
  id: 'configuracoes-loja',
  title: 'Configurações da Loja',
  icon: '⚙️',
  searchText: 'configuracoes loja horario funcionamento branding canais fiscal integracoes settings salao',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Plataforma e Shell</div>
    <h1 class="section-title">⚙️ Configurações da Loja</h1>
    <p class="section-subtitle">Central de configurações da operação — horários de funcionamento, identidade visual, canais ativos, dados fiscais e integrações externas. Base comum a todas as verticais, com extensões por segmento.</p>
    <div class="section-tags">
      <span class="tag-orange">Configurações</span>
      <span class="tag-amber">Settings</span>
      <span class="tag-gray">Comum a todas as verticais</span>
    </div>
  </div>

  <div class="eco-callout">
    <div class="eco-icon">🔗</div>
    <div class="eco-body">
      <div class="eco-title">Estas configurações são supervisionadas pela plataforma</div>
      <div class="eco-links">
        O lojista ajusta aqui horários, branding, canais e fiscal; a plataforma audita e pode
        intervir via <a href="../../wiki-admin/index.html#loja-detalhe">Admin · Detalhe da Loja</a>
        (aba Configurações) e governa verticais/feature flags em
        <a href="../../wiki-admin/index.html#configuracoes-plataforma">Admin · Configurações da Plataforma</a>.
      </div>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li><code>vertical-api/settings</code>: configurações de salão (salon-zones) funcional na vertical Food</li>
      <li>Configurações de branding (nome, logo, cores) persistidas no <code>Store</code></li>
      <li>Horários de funcionamento definidos no banco mas sem UI de gerenciamento</li>
      <li>Dados fiscais armazenados mas sem tela de configuração no ERP</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Configurações em abas: Geral / Horários / Canais / Fiscal / Integrações / Extensões da vertical</li>
      <li>Horários de funcionamento por dia da semana com exceções (feriados, eventos especiais)</li>
      <li>Pausa emergencial: fechar a loja com 1 click e mensagem aos clientes</li>
      <li>Canais ativos: quais canais de venda/atendimento estão habilitados por loja</li>
      <li>Upload de certificado digital A1 para emissão fiscal</li>
      <li>Preview de como a loja aparece no marketplace antes de publicar</li>
    </ul>
  </div>

  <h2>Estrutura de abas</h2>
  <div class="mockup-container">
    <div class="mock-topbar"><span class="mock-logo" style="color:#fbbf24">⚙️ Configurações da Loja</span></div>
    <div class="mock-body">
      <div style="display:flex;gap:0;border-bottom:2px solid #e7e5e4;margin-bottom:14px;">
        <div style="padding:8px 16px;font-size:13px;font-weight:700;border-bottom:2px solid #d97706;color:#d97706;margin-bottom:-2px">Geral</div>
        <div style="padding:8px 16px;font-size:13px;color:#a8a29e">Horários</div>
        <div style="padding:8px 16px;font-size:13px;color:#a8a29e">Canais</div>
        <div style="padding:8px 16px;font-size:13px;color:#a8a29e">Fiscal</div>
        <div style="padding:8px 16px;font-size:13px;color:#a8a29e">Integrações</div>
        <div style="padding:8px 16px;font-size:13px;color:#a8a29e">Avançado</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <div style="font-size:12px;font-weight:600;color:#57534e;margin-bottom:4px">Nome da loja</div>
          <input style="width:100%;padding:7px 10px;border:1px solid #e7e5e4;border-radius:6px;font-size:13px;margin-bottom:10px;" value="Burguer da Vila" />
          <div style="font-size:12px;font-weight:600;color:#57534e;margin-bottom:4px">Descrição / Slogan</div>
          <textarea style="width:100%;padding:7px 10px;border:1px solid #e7e5e4;border-radius:6px;font-size:13px;height:60px;">Os melhores hambúrgueres da cidade!</textarea>
        </div>
        <div>
          <div style="font-size:12px;font-weight:600;color:#57534e;margin-bottom:4px">Logo</div>
          <div style="width:80px;height:80px;background:#fef9f0;border:2px dashed #fde68a;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#a8a29e;margin-bottom:10px;">+ Upload</div>
          <div style="font-size:12px;font-weight:600;color:#57534e;margin-bottom:4px">Cor da loja</div>
          <div style="display:flex;gap:8px;">
            <div style="width:28px;height:28px;background:#d97706;border-radius:50%;border:2px solid #92400e;"></div>
            <div style="width:28px;height:28px;background:#0d9488;border-radius:50%;"></div>
            <div style="width:28px;height:28px;background:#7c3aed;border-radius:50%;"></div>
            <div style="width:28px;height:28px;background:#1d4ed8;border-radius:50%;"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <h2>Horários de funcionamento</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Dia</th><th>Abre</th><th>Fecha</th><th>Intervalo</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>Segunda</td><td>08:00</td><td>22:00</td><td>—</td><td><span class="mock-badge mock-badge-green">Aberto</span></td></tr>
        <tr><td>Terça</td><td>08:00</td><td>22:00</td><td>—</td><td><span class="mock-badge mock-badge-green">Aberto</span></td></tr>
        <tr><td>Sábado</td><td>10:00</td><td>23:30</td><td>—</td><td><span class="mock-badge mock-badge-green">Aberto</span></td></tr>
        <tr><td>Domingo</td><td>—</td><td>—</td><td>—</td><td><span class="mock-badge mock-badge-red">Fechado</span></td></tr>
      </tbody>
    </table>
  </div>
  <p>Exceções: feriados ou datas especiais com horário diferente podem ser cadastradas individualmente, sobrepondo o horário padrão do dia da semana.</p>

  <h2>Canais de venda e atendimento</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Canal</th><th>Verticais aplicáveis</th><th>Habilitado por padrão</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Marketplace / Delivery App</td><td>Food, Market, Services</td><td>Sim</td></tr>
        <tr><td class="td-bold">PDV / Balcão presencial</td><td>Food, Market, Varejo</td><td>Sim</td></tr>
        <tr><td class="td-bold">Agendamento online</td><td>Beauty, Clinic, Services, Hospitality, Rental</td><td>Configurável</td></tr>
        <tr><td class="td-bold">Mesa / Salão (QR Code)</td><td>Food, Hospitality</td><td>Configurável</td></tr>
        <tr><td class="td-bold">Retirada (Pickup)</td><td>Food, Market, Services</td><td>Configurável</td></tr>
        <tr><td class="td-bold">E-commerce próprio</td><td>Todos</td><td>Configurável</td></tr>
        <tr><td class="td-bold">WhatsApp</td><td>Todos</td><td>Configurável</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Configurações fiscais</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Campo</th><th>Obrigatório</th><th>Observação</th></tr></thead>
      <tbody>
        <tr><td>CNPJ</td><td>Sim</td><td>Validado via Receita Federal</td></tr>
        <tr><td>Razão Social</td><td>Sim</td><td>—</td></tr>
        <tr><td>Inscrição Estadual</td><td>Sim (ICMS)</td><td>Isento permitido</td></tr>
        <tr><td>Regime tributário</td><td>Sim</td><td>Simples Nacional / Lucro Presumido / Real</td></tr>
        <tr><td>Certificado A1 (.pfx)</td><td>Sim (NF-e/NFC-e)</td><td>Upload seguro, senha criptografada</td></tr>
        <tr><td>CSC NFC-e</td><td>Sim (PDV)</td><td>Código do PlugNotas</td></tr>
        <tr><td>CFOP padrão</td><td>Sim</td><td>5102 para vendas estaduais</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Extensões por vertical (abas adicionais)</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">🍔</span> Food</div>
      <p>Configurações de salão: mesas, zonas, capacidade. Tempo de preparo padrão por categoria. Raio de entrega.</p>
    </div>
    <div class="card card-purple">
      <div class="card-title"><span class="card-icon">💇</span> Beauty / Clinic</div>
      <p>Profissionais e especialidades. Duração padrão de serviços. Intervalo entre atendimentos. Política de cancelamento.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🏨</span> Hospitality</div>
      <p>Tipos de unidade (quarto, suíte, bangalô). Check-in/out padrão. Taxa de ocupação mínima para fechamento de tarifa.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🚗</span> Rental</div>
      <p>Recursos locáveis (veículos, equipamentos). Regras de caução, multa, devolução. Seguro obrigatório.</p>
    </div>
  </div>
</div>
`
});
