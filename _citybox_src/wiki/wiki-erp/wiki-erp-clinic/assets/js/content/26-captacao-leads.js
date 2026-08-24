WIKI.register({
  id: 'captacao-leads',
  title: 'Captação de Leads & Campanhas',
  icon: '📣',
  searchText: 'captacao leads campanhas marketing form_lead aniversario BROADCAST WhatsApp Baileys birthday 5 minutos 07:00 BRT landing pagina publica funil CRM oportunidade submissionId duplicidade block update create_new telefone formulario dinamico radio escolha unica checkbox multipla LGPD privacidade redirect https preview slug /campanha QR Code PNG qrcode.react UTM views cookie 30 minutos submissao conversao periodo data local limite leads finished finalizada ERP clinica-api BFF Indicacoes referidos indicadores referrer Pacientes indicados profissional externo ComunicacaoNav /marketing/indicacoes Enviado Entregue Visualizacao removida whatsapp-message-phone-preview',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">CRM e Crescimento</div>
    <h1 class="section-title">📣 Captação de Leads &amp; Campanhas</h1>
    <p class="section-subtitle">Campanhas de formulário público que capturam interessados, registram origem e resposta e criam oportunidades rastreáveis dentro do funil do CRM — e o gerenciador de Indicações de pacientes.</p>
    <div class="section-tags">
      <span class="tag-cyan">Landing Pages</span>
      <span class="tag-teal">QR Code</span>
      <span class="tag-amber">UTM</span>
      <span class="tag-green">Indicações</span>
    </div>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Implementado ponta a ponta — clinica-web + clinica-api</div>
      <p><strong>Backoffice:</strong> leaf <strong>Marketing</strong> com PageNav <strong>Comunicação</strong> | <strong>Indicações</strong> (<code>/marketing/campaigns*</code> e <code>/marketing/indicacoes</code>).<br>
      <strong>Campanhas:</strong> wizard + detalhe via <code>campaigns.api.service.ts</code> → <code>/v1/campaigns</code>.<br>
      <strong>Público (PAGE):</strong> <code>/campanha/{storeId}/{slug}</code> → BFF <code>/api/public/clinic/campaigns/*</code>.<br>
      <strong>Broadcast Aniversariantes:</strong> tipo <code>aniversario</code> (WhatsApp Baileys) — 1 paciente / 5 min a partir das 07:00 BRT.<br>
      <strong>Indicações:</strong> <code>GET /v1/indicacoes/{kpis,referred-patients,referrers}</code> — KPIs, pacientes indicados e indicadores (permissão <code>read</code> Marketing).</p>
    </div>
  </div>

  <h2>26.1 Construtor de campanha (wizard de 4 passos)</h2>
  <p>Toda campanha nasce de um assistente guiado que separa estratégia, público, conteúdo e regras de operação. Cada passo só libera o seguinte quando válido.</p>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">①</span> Tipo &amp; estratégia</div>
      <p>Escolha do formato: <strong>página de captação</strong> (landing pública com formulário), <strong>disparo</strong> (broadcast para uma base) ou <strong>automação</strong> (regra disparada por evento). Define o canal principal da campanha.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">②</span> Objetivo &amp; público</div>
      <p>Vincula a campanha a um <strong>funil</strong> + <strong>etapa</strong> do CRM onde os leads entrarão. Define a <strong>regra de duplicidade</strong> por telefone: bloquear, atualizar existente ou criar novo.</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">③</span> Conteúdo</div>
      <p>Construtor com perguntas dinâmicas, identidade visual, logo por URL, consentimento LGPD e pré-visualização. Perguntas <strong>radio</strong> mostram “escolha única” e opções em pill; <strong>checkbox</strong> mostra “múltipla escolha” e cards retangulares.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">④</span> Configurações</div>
      <p>Status: <strong>sempre ativa</strong>, <strong>até uma data</strong> ou <strong>até um limite de leads</strong>. Datas são tratadas como calendário local (<code>yyyy-MM-dd</code>), sem deslocamento UTC−3.</p>
    </div>
  </div>

  <h2>26.2 Fluxo de captação</h2>
  <div class="mermaid">
flowchart LR
  Anuncio["Anúncio / QR Code"] --> Landing["Landing pública /campanha/storeId/slug"]
  Landing --> Form["Formulário dinâmico + LGPD"]
  Form -->|"captura UTM + Pixel"| Submissao["CampaignSubmission"]
  Submissao -->|"detecção de duplicados"| Regra{"Política de duplicidade"}
  Regra -->|"criar / atualizar"| Oportunidade["Oportunidade no funil do CRM"]
  Oportunidade --> Equipe["Equipe comercial / recepção"]
  </div>

  <h2>26.3 Landing page pública</h2>
  <div class="card-grid">
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">🔗</span> Slug público</div>
      <p>Cada campanha PAGE recebe <code>/campanha/{storeId}/{slug}</code>. O browser acessa um BFF público, sem expor credenciais ou a URL interna da API.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">📝</span> Formulário dinâmico</div>
      <p>Renderiza as perguntas configuradas no passo de conteúdo (nome, telefone, e-mail, especialidade de interesse, perguntas personalizadas) com validação no cliente e no servidor.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">✅</span> Consentimento &amp; sucesso</div>
      <p>Consentimento LGPD obrigatório. O link da política de privacidade e a URL de redirecionamento recebem <code>https://</code> quando forem informados sem protocolo; campanhas antigas também são corrigidas na renderização.</p>
    </div>
  </div>

  <h2>26.4 QR Code</h2>
  <div class="alert alert-cyan">
    <div class="alert-icon">📱</div>
    <div class="alert-body">
      <div class="alert-title">Geração de QR Code para campanhas de página</div>
      <p>O ERP usa <code>qrcode.react</code> (<code>QRCodeCanvas</code>) para gerar no client um QR escaneável da URL absoluta. O modal exibe 320×320 e baixa PNG; não existe endpoint nem blob mock. Esquemas não HTTP(S) são rejeitados.</p>
    </div>
  </div>

  <h2>26.5 Rastreamento &amp; analytics</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Mecanismo</th><th>Como funciona</th><th>Uso</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Contagem de visualizações</td><td>Por cookie, com janela de 30 minutos para não inflar com refresh</td><td>Numerador da taxa de conversão</td></tr>
        <tr><td class="td-bold">Facebook Pixel / Google Tag</td><td>IDs fazem parte da configuração da campanha; execução dos scripts é evolução</td><td>Preparação para mídia paga</td></tr>
        <tr><td class="td-bold">Parâmetros UTM</td><td><code>utm_source</code>, <code>utm_medium</code>, <code>utm_campaign</code> gravados em cada submissão</td><td>Atribuição de origem do lead</td></tr>
      </tbody>
    </table>
  </div>

  <h2>26.6 Submissões → CRM</h2>
  <p>Cada lead capturado vira uma <strong>submissão</strong> e cria/atualiza uma <strong>oportunidade</strong> no funil escolhido, com a <strong>origem</strong> registrada como a campanha de captação.</p>
  <div class="card-grid">
    <div class="card card-rose">
      <div class="card-title"><span class="card-icon">🔁</span> Detecção de duplicados</div>
      <p>Por telefone: <strong>block</strong> grava a resposta duplicada com <code>isDuplicate=true</code>, mas não cria outro card; <strong>update</strong> grava nova resposta e atualiza o card aberto; <strong>create_new</strong> grava resposta e cria outro card.</p>
    </div>
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">📊</span> Métricas por campanha</div>
      <p>Visualizações, respostas (submissões) e <strong>taxa de conversão</strong> (respostas ÷ visualizações). Comparativo entre campanhas para priorizar verba de mídia.</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">📋</span> Lista de submissões</div>
      <p>O backoffice abre payload, origem, tipo e duplicidade. No sheet da oportunidade, a seção Campanha mostra o nome e “Ver resposta” abre um sheet aninhado menor com a submissão original.</p>
    </div>
  </div>

  <h2>26.7 Ciclo de vida e ações</h2>
  <div class="alert alert-blue">
    <div class="alert-icon">⏰</div>
    <div class="alert-body">
      <div class="alert-title">Período e limite bloqueiam o formulário público</div>
      <p>Campanha expirada por data deixa de aceitar GET/POST público. Na campanha por limite, a submissão que atinge o teto muda o status para <strong>Finalizada</strong> e grava <code>endDate</code>; a próxima tentativa é rejeitada. Dados legados no limite são sincronizados ao carregar.</p>
    </div>
  </div>

  <p>No detalhe, as ações ficam visíveis no cabeçalho: <strong>Ver Pública</strong>,
  <strong>Ver QR Code</strong> e <strong>Finalizar Campanha</strong> (só com checkbox
  <code>marketing_campaign_finalize</code> — CASL <code>delete</code> Marketing; API
  <code>PATCH /v1/campaigns/:id/status</code> exige o mesmo). Editar campanha usa
  <code>marketing_campaign_update</code> e <strong>não</strong> libera finalizar.
  Na tabela, fechar o modal de QR não propaga o clique para a linha.</p>

  <h2>26.8 Campanha Aniversariantes (BROADCAST WhatsApp)</h2>
  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Implementado — tipo <code>aniversario</code></div>
      <p>Wizard no ERP (público: planos/especialidades/gênero; mensagem com variáveis; <strong>preview estilo WhatsApp</strong> — balão recebido, doodle SVG, horário AM/PM; ativar). Content Zod em <code>aniversario.content.ts</code>. View: <code>BroadcastCampaignViewTemplate</code> + lista de mensagens (<code>GET /v1/campaigns/:id/messages</code>) com colunas <strong>Paciente / Enviado / Entregue</strong> (coluna Visualização removida; status <code>read</code> abandonado).</p>
    </div>
  </div>
  <div class="card-grid">
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">⏰</span> Disparo diário</div>
      <p>A partir das <strong>07:00 BRT</strong>, o processo <code>main-whatsapp</code> (<code>BirthdayCampaignScheduler</code>) libera <strong>1 paciente a cada 5 minutos</strong> (anti-ban Baileys). Create de campanha <code>active</code> dispara o 1º envio imediatamente (se já passou das 07:00).</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">🔑</span> Idempotência</div>
      <p><code>correlationId = birthday:{campaignId}:{patientId}:{yyyy-MM-dd}</code>. Filtros vazios = todos os aniversariantes ativos do dia. Ordem estável por nome.</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">💬</span> Respostas</div>
      <p>Inbound na janela de 7 dias é atribuído ao disparo; listagem no ERP com filtro “com respostas” e busca por nome.</p>
    </div>
  </div>

  <h2>26.9 Indicações de pacientes</h2>
  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Implementado — <code>/marketing/indicacoes</code> + <code>GET /v1/indicacoes/*</code></div>
      <p>Leaf permanece <strong>Marketing</strong>. PageNav <strong>Comunicação</strong> | <strong>Indicações</strong> (<code>ComunicacaoNav</code>). Layout com breakout do padding da <code>main</code> (<code>-m-4</code>): a página inteira scrolla e as abas sobem/somem (mesmo padrão Financeiro/Configurações). Permissão: <code>read</code> Marketing.</p>
    </div>
  </div>

  <p>Título da tela: <strong>Gerenciador de Indicações de Pacientes</strong>. Ordem: KPIs → Pacientes indicados → Pacientes e profissionais indicadores.</p>

  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">📊</span> KPIs</div>
      <p><code>GET /v1/indicacoes/kpis</code> — total de indicações no período, valor de orçamentos aprovados (lifetime dos pacientes do período), pacientes sem 1ª consulta realizada, lista de <code>years</code> para os selects. Período Anual/Mensal segue o da seção Pacientes indicados.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🧑</span> Pacientes indicados</div>
      <p><code>GET /v1/indicacoes/referred-patients</code> — paginação/ordenação server-side (§8.1). Colunas: nome, quem indicou, data da indicação (sort), 1ª consulta (Agendada / Realizada / Não realizada), orçamentos aprovados, Conversar WhatsApp. <strong>Exportar</strong> PDF busca todas as páginas no client.</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">🤝</span> Indicadores</div>
      <p><code>GET /v1/indicacoes/referrers</code> — agrega por paciente / profissional da equipe / profissional externo. Sob o nome: rótulo do tipo. Coluna total: link <code>1 paciente</code> / <code>N pacientes</code> abre modal com a lista filtrada (<code>referrerKind</code> + <code>referrerId</code>). Sem Exportar PDF nesta tabela. Conversar em verde WhatsApp (<code>#1FA855</code>).</p>
    </div>
  </div>

  <div class="table-wrap">
    <table>
      <thead><tr><th>Origem (<code>systemKey</code>)</th><th>Quem indicou</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>indicacao</code></td><td>Paciente (<code>referredByPatientId</code>)</td></tr>
        <tr><td class="td-bold"><code>indicacao_profissional</code></td><td>Membro da equipe (<code>referredByMemberId</code> / nome)</td></tr>
        <tr><td class="td-bold"><code>indicacao_profissional_externo</code></td><td>Catálogo <code>ExternalReferralProfessional</code></td></tr>
      </tbody>
    </table>
  </div>
  <p>Período = dia civil de <code>Patient.createdAt</code> (data da indicação). 1ª consulta = appointment mais antigo não cancelado; status UI: <code>finished</code>→Realizada, <code>missed</code>/ausência→Não realizada, demais abertos→Agendada.</p>

  <h2>Entidades de dados (schema_clinic)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Entidade</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>Campaign</code></td><td>Campanha store-scoped: estratégia/canal/status, <code>statusType</code>, período/limite, slug, conteúdo JSON, contadores e vínculo com funil/etapa. Tipos implementados: <code>form_lead</code> (PAGE) e <code>aniversario</code> (BROADCAST).</td></tr>
        <tr><td class="td-bold"><code>CampaignSubmission</code></td><td>Resposta: payload, metadata/UTM, <code>phoneKey</code>, <code>isDuplicate</code> e campanha (PAGE).</td></tr>
        <tr><td class="td-bold"><code>SalesOpportunity</code></td><td>Card do CRM com <code>origin=campaign</code> e <code>submissionId</code> para rastrear a resposta.</td></tr>
        <tr><td class="td-bold"><code>WhatsappMessage</code></td><td>Disparos/respostas Baileys; aniversário usa <code>templateKey=birthday</code> + correlation acima.</td></tr>
        <tr><td class="td-bold"><code>Patient</code> + origens</td><td>Indicações: <code>referralOrigin.systemKey</code> + FKs paciente/membro/profissional externo; tela Indicações agrega sobre esse universo.</td></tr>
        <tr><td class="td-bold"><code>ExternalReferralProfessional</code></td><td>Catálogo store-scoped de profissionais externos que indicam (<code>GET/POST /v1/patient-external-professionals</code>).</td></tr>
      </tbody>
    </table>
  </div>

  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">Evoluções</div>
    <ul>
      <li>Executar Facebook Pixel e Google Tag na landing (IDs já configuráveis).</li>
      <li>Upload de logo por storage em vez de URL.</li>
      <li>Paginação/analytics avançados por canal e UTM.</li>
      <li>Implementar os demais tipos do catálogo: MGM, débito, retorno e NPS.</li>
      <li>Migrar Baileys → WhatsApp Cloud API oficial (templates aprovados) para escala.</li>
      <li>Tela comparativa de profissionais externos (fora do escopo atual de Indicações).</li>
    </ul>
  </div>
</div>
`
});
