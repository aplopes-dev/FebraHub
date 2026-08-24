WIKI.register({
  id: 'anamnese-formularios',
  title: 'Anamnese Digital & Formulários',
  icon: '📝',
  searchText: 'anamnese digital formularios form builder construtor de modelos perguntas reutilizaveis biblioteca global por clinica arrastar soltar drag and drop ordenacao tipos de pergunta sim nao nao sei texto rico rich_text single_choice escolha unica esquerda direita alerta clinico alergia anticoagulante gestacao modelos pre-semeados adulta resumida infantil fisioterapia estetica nutricao acompanhamento nutricional psicologia link publico token nanoid expiracao 410 gone whatsapp barra de progresso snapshot imutavel submissao duplicada 409 assinatura digital PDF htmlToPlainText visualizador badge LGPD consentimento AnamnesisTemplate AnamnesisQuestion AnamnesisTemplateQuestion PatientAnamnesis multi-especialidade clinic-api integrado toggle ativo biblioteca compartilhada generates_alert overflow-x mobile tabela',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Prontuário Clínico</div>
    <h1 class="section-title">📝 Anamnese Digital &amp; Formulários</h1>
    <p class="section-subtitle">Aprofunda a anamnese mencionada no Prontuário Eletrônico. Aqui a clínica monta seus próprios modelos com um construtor de perguntas, semeia bibliotecas por especialidade e coleta respostas em dois fluxos: o profissional preenche no atendimento ou o paciente responde antes da consulta por link público. As respostas viram um snapshot imutável, com alertas clínicos e assinatura digital.</p>
    <div class="section-tags">
      <span class="tag-cyan">Form Builder</span>
      <span class="tag-teal">Link Público</span>
      <span class="tag-sky">LGPD</span>
      <span class="tag-green">API integrada</span>
    </div>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Configuração de modelos — integrado (jul/2026)</div>
      <p><code>/clinic/configuracoes/anamneses</code> persiste via <code>clinic-api</code> (proxy ERP <code>/api/proxy/clinica</code>). Biblioteca compartilhada: perguntas <strong>globais</strong> (~15 via <code>pnpm --filter @citybox/clinica-api db:seed</code>, <code>prisma/global-anamnesis-questions.ts</code>) + custom da clínica. O sheet revalida a biblioteca ao abrir (evita cache vazio pós-seed). Toggle define <code>active</code> no pivô; novo modelo inicia com tudo desativado. Edição só em perguntas <code>scope: clinic</code>. Delete de modelo com anamneses preenchidas → 409 + modal. Listagem: tabela com scroll horizontal no mobile. Detalhes: <a href="#configuracoes-parametros">Configurações &amp; Parâmetros</a>.</p>
    </div>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Ficha do paciente + link público — integrado (jul/2026)</div>
      <p><code>/clinic/pacientes/[id]/anamnese</code> — listagem server-side (busca/paginação/ordenação, debounce 400&nbsp;ms), sheet Nova anamnese, modal Compartilhar, PDF preview via <code>build-patient-anamnesis-pdf.ts</code>. Consome <code>GET/POST /v1/patients/:id/anamneses</code> via proxy autenticado. <code>/public/clinic/anamnese/[token]</code> — formulário mobile sem auth (<code>public-anamnesis-fill-view</code>) via BFF <code>/api/public/clinic/anamnesis/[token]</code> → <code>GET/PATCH /v1/public/anamnesis/:token</code> na clinica-api (<code>@Public()</code>). Snapshot imutável persistido em <code>PatientAnamnesis</code>; token nanoid + expiração 30 dias (410 Gone); submissão duplicada 409.</p>
    </div>
  </div>

  <div class="alert alert-amber">
    <span class="alert-icon">⏳</span>
    <div class="alert-body">
      <div class="alert-title">Pendente (fase 2)</div>
      <p>Assinatura digital completa (<code>signatureStatus</code> além de <code>unsigned</code>), consentimento LGPD persistido na API e lembretes WhatsApp para links próximos da expiração.</p>
    </div>
  </div>

  <div class="alert alert-blue">
    <span class="alert-icon">🧩</span>
    <div class="alert-body">
      <div class="alert-title">Modelos por clínica e especialidade</div>
      <p>Não existe um único formulário rígido. Cada clínica (e cada especialidade — fisioterapia, estética, nutrição, psicologia, odontologia, e tantas outras) monta seus modelos a partir de uma biblioteca de perguntas reutilizáveis. O sistema já vem com modelos semeados como ponto de partida.</p>
    </div>
  </div>

  <h2>21.1 Construtor de modelos (form builder)</h2>
  <p>Cada modelo de anamnese (<code>AnamnesisTemplate</code>) é montado visualmente, com arrastar-e-soltar de perguntas e ordenação livre. As perguntas (<code>AnamnesisQuestion</code>) vivem em uma biblioteca reutilizável: há perguntas <strong>globais</strong> (~15 semeadas pelo sistema, <code>scope: global</code>, <code>storeId</code> null) e perguntas <strong>por clínica</strong> (<code>scope: clinic</code>). A relação modelo↔pergunta é um pivô (<code>AnamnesisTemplateQuestion</code>) com ordem, flag <code>active</code> (toggle na UI) e obrigatoriedade.</p>
  <p><strong>Comportamento atual (jun/2026):</strong> cada modelo exibe a biblioteca inteira; não há “adicionar ao modelo” nem “excluir do modelo”. Perguntas desativadas ficam acinzentadas, sem numeração; só as ativas são numeradas em sequência.</p>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">🖱️</span> Arrastar &amp; soltar</div>
      <p>Reordene perguntas no modelo arrastando. A posição é persistida no pivô, então o formulário renderiza sempre na sequência clínica desejada.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">📚</span> Biblioteca compartilhada</div>
      <p>Todas as perguntas da biblioteca aparecem em todos os modelos. Pergunta custom criada pela clínica entra na biblioteca da loja e passa a existir em cada modelo (inicialmente desativada nos demais).</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">✏️</span> Criar &amp; editar</div>
      <p>Crie modelos e perguntas custom (<code>scope: clinic</code>). Globais do seed são somente leitura (toggle on/off). Modelos podem ser ativados/desativados na listagem.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">⚠️</span> Alerta clínico por pergunta</div>
      <p>Cada pergunta pode declarar uma <strong>condição de alerta</strong> (ex.: resposta "sim" para alergia, anticoagulante ou gestação) com um <strong>rótulo de alerta</strong> que destaca o risco.</p>
    </div>
  </div>

  <h3>Tipos de pergunta</h3>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Tipo</th><th>Respostas possíveis</th><th>Uso típico</th></tr>
      </thead>
      <tbody>
        <tr><td class="td-bold">Sim / Não / Não sei</td><td>3 opções</td><td>Triagem rápida de condições e antecedentes</td></tr>
        <tr><td class="td-bold">Sim / Não / Não sei + texto</td><td>3 opções + campo livre</td><td>"Tem alergia?" + "qual?" / "Usa medicação?" + "qual?"</td></tr>
        <tr><td class="td-bold">Somente texto</td><td>Campo livre</td><td>Queixa principal, histórico aberto, observações</td></tr>
        <tr><td class="td-bold">Texto rico</td><td>Editor TipTap</td><td>Motivo da consulta / narrativas longas (PDF converte HTML → texto)</td></tr>
        <tr><td class="td-bold">Escolha única</td><td>Opções + “Outro”</td><td>Anamnese nutricional (acompanhamento resumido)</td></tr>
        <tr><td class="td-bold">Esquerda / Direita / Não sei</td><td>3 opções</td><td>Lateralidade (dor, lesão, membro afetado)</td></tr>
      </tbody>
    </table>
  </div>

  <h2>21.2 Modelos pré-semeados por perfil</h2>
  <p>O sistema entrega uma biblioteca inicial semeada para a clínica não começar de uma página em branco. Cada especialidade tem seus modelos; a clínica adapta a partir deles.</p>
  <div class="card-grid">
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🧑</span> Adulta completa / resumida</div>
      <p>Anamnese geral em duas profundidades: a completa para primeira consulta, a resumida para retornos.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">🧒</span> Infantil</div>
      <p>Versão pediátrica com perguntas e responsável legal apropriados à faixa etária.</p>
    </div>
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">🩺</span> Por especialidade</div>
      <p>Variações para fisioterapia, estética, nutrição, psicologia e demais. Pack nutrição semeia <strong>Anamnese de acompanhamento nutricional resumida</strong> (tipos <code>rich_text</code> / <code>single_choice</code>). Inicializar na ficha pode criar <code>PatientAnamnesis</code> na mesma transação quando o profissional escolhe um modelo ativo.</p>
    </div>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — catálogo de modelos semeados</div>
    <ul>
      <li>Seed inicial com modelos globais que a clínica pode clonar e personalizar sem partir do zero.</li>
      <li>Marketplace interno de perguntas: clínicas da rede compartilham perguntas validadas (com consentimento).</li>
      <li>Versionamento de modelo: editar um modelo gera nova versão; anamneses já preenchidas continuam apontando para a versão da época.</li>
    </ul>
  </div>

  <h2>21.3 Dois fluxos de preenchimento</h2>
  <div class="card-grid">
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">👩‍⚕️</span> Profissional no atendimento</div>
      <p>O profissional abre o modelo e preenche durante a consulta, com os alertas clínicos destacados em tempo real.</p>
    </div>
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">📱</span> Paciente por link público</div>
      <p>Antes da consulta, o paciente recebe um link (por WhatsApp) e responde no celular. Ao chegar, a ficha já está pronta para revisão.</p>
    </div>
  </div>

  <h3>Endpoints (jul/2026)</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Escopo</th><th>Método</th><th>Rota</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Autenticado</td><td>GET/POST</td><td><code>/api/v1/patients/:patientId/anamneses</code></td><td>Listagem paginada (<code>search</code> em nome do modelo) + criar (modo <code>professional</code> ou <code>patient</code>)</td></tr>
        <tr><td class="td-bold">Autenticado</td><td>GET/DELETE</td><td><code>/api/v1/patients/:patientId/anamneses/:id</code></td><td>Detalhe + exclusão (anti-IDOR por paciente)</td></tr>
        <tr><td class="td-bold">Público</td><td>GET/PATCH</td><td><code>/api/v1/public/anamnesis/:token</code></td><td>Formulário do paciente; 410 expirado, 409 já respondida</td></tr>
        <tr><td class="td-bold">BFF ERP</td><td>GET/PATCH</td><td><code>/api/public/clinic/anamnesis/[token]</code></td><td>Proxy server-side sem JWT para rotas <code>@Public()</code></td></tr>
      </tbody>
    </table>
  </div>
  <p>Código: backend <code>modules/patients/patient-anamneses/</code> · ERP <code>patient-anamnesis.service.ts</code>, <code>use-patient-anamnesis-queries.ts</code>. Migration Prisma aplicada manualmente pelo operador.</p>

  <h3>Como funciona o link público</h3>
  <p>O link usa um <strong>token aleatório</strong> (estilo <code>nanoid</code>) em vez de UUID na URL — isso evita enumeração e adivinhação de links de outros pacientes. O link tem <strong>expiração</strong> (padrão 30 dias); depois disso retorna <strong>410 Gone</strong> e mostra a tela de "link expirado". O formulário mobile traz barra de progresso, tela de sucesso ao enviar e tela de expiração.</p>

  <div class="alert alert-orange">
    <span class="alert-icon">🔐</span>
    <div class="alert-body">
      <div class="alert-title">Por que token aleatório e não UUID</div>
      <p>UUID sequencial/previsível é enumerável e vaza a ordem dos registros. Um token curto e aleatório (nanoid) no link público bloqueia varredura e mantém a URL compartilhável por WhatsApp sem expor identificadores internos.</p>
    </div>
  </div>

  <div class="mermaid">
sequenceDiagram
  participant Prof as Profissional
  participant S as Sistema
  participant Z as WhatsApp
  participant Pac as Paciente

  Prof->>S: Gera link de anamnese (escolhe modelo)
  S-->>S: Cria PatientAnamnesis (status: aguardando resposta)
  S-->>S: Gera token aleatório (nanoid) + expiração (30 dias)
  S->>Z: Envia link público
  Z-->>Pac: Recebe link
  Pac->>S: Abre /anamnese/&lt;token&gt;
  alt Token válido e dentro do prazo
    S-->>Pac: Formulário mobile (barra de progresso)
    Pac->>S: Aceita consentimento LGPD e responde
    Pac->>S: Envia respostas
    S-->>S: Snapshot imutável (status: preenchida)
    S-->>Pac: Tela de sucesso
    S-->>Prof: Badge de alertas clínicos na ficha
  else Token expirado
    S-->>Pac: 410 Gone + tela "link expirado"
  else Reenvio após preenchida
    S-->>Pac: 409 (submissão duplicada bloqueada)
  end
</div>

  <h2>21.4 Status, snapshot e assinatura</h2>
  <p>A anamnese do paciente (<code>PatientAnamnesis</code>) percorre um ciclo de status. Quando preenchida, as respostas viram um <strong>snapshot imutável</strong> — uma foto do momento, que não muda mesmo que o modelo seja editado depois.</p>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Status</th><th>Significado</th></tr>
      </thead>
      <tbody>
        <tr><td class="td-bold">Rascunho</td><td>Criada mas ainda não enviada ao paciente nem finalizada.</td></tr>
        <tr><td class="td-bold">Aguardando resposta</td><td>Link público gerado e enviado; esperando o paciente responder.</td></tr>
        <tr><td class="td-bold">Link expirado</td><td>Passou da validade (410 Gone). Pode-se gerar um novo link.</td></tr>
        <tr><td class="td-bold">Preenchida</td><td>Respostas recebidas e congeladas em snapshot imutável.</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-red">
    <span class="alert-icon">🚫</span>
    <div class="alert-body">
      <div class="alert-title">Submissão duplicada bloqueada (409)</div>
      <p>Um link preenchido não aceita reenvio: a segunda tentativa retorna <strong>409 Conflict</strong>. Isso garante que o snapshot permaneça único e fiel ao momento da resposta.</p>
    </div>
  </div>

  <h3>Assinatura digital</h3>
  <p>A ficha preenchida segue um workflow de assinatura: <strong>sem assinatura → pendente → assinada</strong>. Ao assinar, gera-se um <strong>PDF</strong> com visualizador embutido para consulta e arquivamento.</p>
  <div class="card-grid">
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">📄</span> Sem assinatura</div>
      <p>Respostas registradas, ainda sem validação formal do profissional.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">⏳</span> Pendente</div>
      <p>Enviada para assinatura; aguardando o ato do profissional responsável.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">✅</span> Assinada</div>
      <p>Validada e congelada; PDF gerado e disponível no visualizador.</p>
    </div>
  </div>

  <h2>21.5 Alertas clínicos consolidados &amp; LGPD</h2>
  <p>Quando as respostas disparam condições configuradas (alergia, uso de anticoagulante, gestação, etc.), os alertas são <strong>consolidados no topo da ficha do paciente</strong> como um badge — para o profissional ver o risco de imediato, sem reler toda a anamnese.</p>
  <div class="alert alert-amber">
    <span class="alert-icon">🩸</span>
    <div class="alert-body">
      <div class="alert-title">Badge de alertas no topo da ficha</div>
      <p>Cada pergunta com condição de alerta contribui para um resumo destacado: "Alergia a penicilina", "Uso de anticoagulante", "Gestante". O profissional revisa antes de qualquer conduta.</p>
    </div>
  </div>
  <div class="alert alert-green">
    <span class="alert-icon">🛡️</span>
    <div class="alert-body">
      <div class="alert-title">Consentimento LGPD ao responder por link</div>
      <p>Ao abrir o link público, o paciente aceita o consentimento de tratamento de dados de saúde (dado sensível) antes de responder. O aceite fica registrado junto ao snapshot.</p>
    </div>
  </div>

  <h2>21.6 Entidades</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Entidade</th><th>Papel</th><th>Campos-chave</th></tr>
      </thead>
      <tbody>
        <tr><td class="td-bold"><code>AnamnesisTemplate</code></td><td>Modelo de anamnese montado pela clínica/especialidade</td><td>nome, perfil/especialidade, escopo (global/clínica), status, versão</td></tr>
        <tr><td class="td-bold"><code>AnamnesisQuestion</code></td><td>Pergunta reutilizável da biblioteca</td><td>enunciado, tipo (sim-não-nãosei / +texto / texto / esq-dir-nãosei), escopo, condição de alerta, rótulo de alerta</td></tr>
        <tr><td class="td-bold"><code>AnamnesisTemplateQuestion</code></td><td>Pivô modelo↔pergunta com ordenação e ativação</td><td>template, question, ordem, <code>active</code> (toggle), obrigatória</td></tr>
        <tr><td class="td-bold"><code>PatientAnamnesis</code></td><td>Anamnese de um paciente (instância preenchível)</td><td>paciente, template, token (nanoid), expiração, respostas (JSON snapshot), status, consentimento LGPD, assinatura, PDF</td></tr>
      </tbody>
    </table>
  </div>

  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta — evoluções da anamnese digital</div>
    <ul>
      <li>Pré-preenchimento inteligente: trazer respostas da última anamnese como rascunho editável (sem quebrar o snapshot).</li>
      <li>Lógica condicional: exibir perguntas dependentes apenas quando a anterior dispara a condição.</li>
      <li>Lembretes automáticos por WhatsApp para links "aguardando resposta" próximos da expiração.</li>
      <li>Comparação entre anamneses ao longo do tempo, destacando mudanças de alergias e medicações.</li>
    </ul>
  </div>
</div>
`
});
