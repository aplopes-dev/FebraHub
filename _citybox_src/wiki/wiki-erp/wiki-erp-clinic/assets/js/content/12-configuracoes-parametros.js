WIKI.register({
  id: 'configuracoes-parametros',
  title: 'Configurações & Parâmetros',
  icon: '⚙️',
  searchText: 'configuracoes parametros RBAC papeis permissoes CASL clinica-permissions cargos aluno contador dentista_admin dentista gerente radiologia secretario vendedor proprietario medico sala atendimento horario funcionamento horarios atendimento service-hours professional-service-hours team-service-hours commission-rules CLIN-062 comissao feriado procedimento TUSS duracao preco particular convenio TCLE consentimento politica cancelamento integracoes WhatsApp NFS-e payments-api ViaCEP RNDS maquininha Google Agenda erp front clinic equipe planos anamneses contrato modelos ContractModel contract-models mock sheet sidebar variaveis drag drop dnd-kit textarea RichTextEditor TipTap fullscreen bottom sheet clinic-sheets.css implementado pendente API prisma backend clinica-api proxy React Query TanStack react-query rich-text editor toolbar buscar substituir cor destaque imagem A4 variable-node chips biblioteca compartilhada toggle ativo generates_alert soft-status disabledAt planStatus categoria-paciente categoria-agendamento db:seed CNPJ CEP ResourceInUseDialog replaceTree upsert TreatmentsInUse responsivo mobile tablet AlertDialog guard plano padrao overflow-x PageNav',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Inteligência e Config</div>
    <h1 class="section-title">⚙️ Configurações &amp; Parâmetros</h1>
    <p class="section-subtitle">Configurações da clínica no ERP (<code>/clinic/configuracoes</code>), RBAC com papéis clínicos, tabela de procedimentos, salas, TCLEs e integrações CityBox. A seção <strong>11.0</strong> registra o que já foi implementado no front e no backend (jun–jul/2026): <strong>Clínica</strong>, <strong>Planos</strong>, <strong>Anamneses</strong>, <strong>Contrato</strong>, <strong>Equipe</strong> (horários + comissão), <strong>Categoria</strong> e cadastro de <strong>Pacientes</strong> integram com a <code>clinica-api</code>. As seções seguintes descrevem o blueprint completo ainda pendente.</p>
    <div class="section-tags">
      <span class="tag-cyan">RBAC Clínico</span>
      <span class="tag-teal">Integrações</span>
      <span class="tag-sky">TCLE Digital</span>
      <span class="tag-green">Anamneses API</span>
      <span class="tag-orange">clinica-api</span>
      <span class="tag-orange">ERP Mock</span>
      <span class="tag-green">ContractModel API</span>
    </div>
  </div>

  <h2>11.0 Implementação ERP — <code>/clinic/configuracoes</code></h2>

  <div class="alert alert-green">
    <span class="alert-icon">📍</span>
    <div class="alert-body">
      <div class="alert-title">Onde está no código</div>
      <p><strong>ERP:</strong> rotas finas em <code>apps/erp/src/app/clinic/configuracoes/</code> · UI e lógica em <code>apps/erp/src/features/clinic/modules/settings/</code> · proxy BFF em <code>apps/erp/src/app/api/proxy/clinica/[...path]/route.ts</code> (<code>/api/proxy/clinica/*</code> com header <code>X-Store-Id</code>) · env <code>CLINIC_API_URL</code>.<br>
      <strong>API:</strong> backend vertical em <code>apps/verticals/clinica/api</code> (<code>@citybox/clinica-api</code>, porta <strong>3172</strong>, schema Postgres <code>clinica</code>); módulo <code>anamnesis</code> (seed ~15 perguntas globais via <code>db:seed</code>, testes Jest), módulo <code>team-service-hours</code> (model <code>ProfessionalServiceHours</code>) e módulo <code>contract-models</code> (model <code>ContractModel</code>, tabela <code>contract_models</code>, migration <code>20260626200000_add_contract_models</code>; primeiro CRUD store-scoped via header <code>X-Store-Id</code>, permissão <code>store.clinic.settings.manage</code>).<br>
      <strong>Equipe:</strong> CRUD via <strong>platform-api</strong>; horários de atendimento via <strong>clinica-api</strong>.<br>
      <strong>Contrato:</strong> persistência real via <strong>clinica-api</strong> (módulo <code>contract-models</code>) · editor <code>RichTextEditor</code> em <code>packages/ui/src/components/organisms/rich-text-editor/</code>.<br>
      <strong>Sheets clinic:</strong> <code>features/clinic/lib/clinic-sheet-styles.ts</code> e <code>features/clinic/clinic-sheets.css</code> (só em <code>app/clinic/layout.tsx</code>). Demais abas ainda usam mocks locais.</p>
    </div>
  </div>

  <h3>Resumo por aba</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Aba</th><th>Rota</th><th>Status ERP</th><th>Observação</th></tr></thead>
      <tbody>
        <tr>
          <td class="td-bold">Clínica</td>
          <td><code>/clinic/configuracoes</code></td>
          <td><span class="status-badge status-functional">✅ Integrado API</span></td>
          <td>React Query · <code>GET/PUT /v1/clinic-profile</code> · logo · CEP (<code>useCepAddressLookup</code>) · CNPJ com dígitos verificadores</td>
        </tr>
        <tr>
          <td class="td-bold">Equipe</td>
          <td><code>/clinic/configuracoes/equipe</code></td>
          <td><span class="status-badge status-functional">✅ Integrado API</span></td>
          <td>CRUD <code>clinica-api</code> <code>/v1/members</code>; soft-status; permissões CASL no vínculo (<code>@citybox/clinica-permissions</code>); cargos com presets; aba Horários só <code>aluno</code>/<code>dentista_admin</code>/<code>dentista</code>; aba <strong>Comissão</strong> CLIN-062; accordion permissões fechado + ordem alfabética</td>
        </tr>
        <tr>
          <td class="td-bold">Planos</td>
          <td><code>/clinic/configuracoes/planos</code></td>
          <td><span class="status-badge status-functional">✅ Integrado API</span></td>
          <td>CRUD <code>/v1/clinic-plans</code> · sheet 2 passos · título <em>Editar plano</em> · delete 409 se pacientes/orçamentos vinculados (modal informativo) · update com <strong>upsert</strong> de tratamentos (não delete-all — evita 500/FK em <code>budget_items</code> ao marcar padrão) · tabela com scroll-x no mobile · sheet config empilhado + footer em coluna · após confirmar “Trocar plano padrão”, guard ~400ms anti-dismiss fantasma (AlertDialog→Sheet) · seed first-contact: plano <strong>Particular</strong> (~17 especialidades / ~266 tratamentos, <code>sortOrder≥1</code>, <code>acceptsFaces</code>)</td>
        </tr>
        <tr>
          <td class="td-bold">Anamneses</td>
          <td><code>/clinic/configuracoes/anamneses</code></td>
          <td><span class="status-badge status-functional">✅ Integrado API</span></td>
          <td>CRUD de modelos + biblioteca (~15 perguntas globais via <code>db:seed</code>) · refetch ao abrir sheet · delete 409 se anamneses preenchidas · tabela com scroll-x no mobile — ver § Anamneses</td>
        </tr>
        <tr>
          <td class="td-bold">Contrato</td>
          <td><code>/clinic/configuracoes/contrato</code></td>
          <td><span class="status-badge status-functional">✅ Funcional (API)</span></td>
          <td>CRUD + editor TipTap fullscreen · campo nome com contraste (<code>bg-input</code>) · delete 409 se emitido em pacientes</td>
        </tr>
        <tr>
          <td class="td-bold">Categoria de Paciente</td>
          <td><code>/clinic/configuracoes/categoria-paciente</code></td>
          <td><span class="status-badge status-functional">✅ Integrado API</span></td>
          <td>CRUD <code>/v1/patient-categories</code> · header + <em>Nova categoria</em> na mesma linha · protegida <em>Particular</em></td>
        </tr>
        <tr>
          <td class="td-bold">Categoria de Agendamento</td>
          <td><code>/clinic/configuracoes/categoria-agendamento</code></td>
          <td><span class="status-badge status-functional">✅ Integrado API</span></td>
          <td>CRUD <code>/v1/appointment-categories</code> · <strong>isolado</strong> (sem sync com paciente) · colunas Nome + Ações</td>
        </tr>
        <tr>
          <td class="td-bold">WhatsApp</td>
          <td><code>/clinic/configuracoes/whatsapp</code></td>
          <td><span class="status-badge status-functional">✅ MVP Baileys</span></td>
          <td>Sessão (status + QR polling 2s) · templates editáveis · processo <code>main-whatsapp</code> + filas RabbitMQ · ícone <code>WhatsappBrandIcon</code></td>
        </tr>
      </tbody>
    </table>
  </div>

  <h3>Padrões transversais (abas com sheet)</h3>
  <ul>
    <li>Sheets flutuantes à direita via <code>CLINIC_FLOATING_SHEET_CONTENT_CLASS</code> (largura ~5xl; em formulários financeiros: <code>max-w-[min(48rem,calc(100%-2rem))]</code>)</li>
    <li>Rodapé fixo com botões grandes: <code>CLINIC_SHEET_FOOTER_CLASS</code> + <code>CLINIC_SHEET_FOOTER_BUTTON_CLASS</code> (planos: footer em coluna no mobile)</li>
    <li>Toggle compacto: <code>ClinicCompactSwitch</code> em <code>features/clinic/components/</code></li>
    <li>Tabelas: <code>DataTable</code> de <code>@citybox/ui/organisms</code> com colunas Nome (ordenável) + Ações (editar/excluir); estilos canônicos via <code>erpDataTableStyleProps</code>; planos/anamneses com wrapper <code>overflow-x-auto</code> no mobile</li>
    <li>Nav: <code>PageNav</code> com scroll horizontal no mobile (settings + financeiro + dashboard)</li>
    <li>ConfirmDialog sobre Sheet (trocar plano/contrato padrão): guard ~400ms + <code>onInteractOutside</code>/<code>onPointerDownOutside</code> para não fechar o sheet por toque fantasma</li>
    <li>Estado: React Query (<code>@tanstack/react-query</code>) nas abas integradas; <code>useState</code> + hooks de formulário por domínio e persistência mock em <code>data/mock-*.ts</code> nas abas ainda sem API</li>
    <li>Customizações de sheet/CSS na vertical clinic; DS compartilhado só quando acordado (ex.: <code>PageNav</code> scroll-x, <code>RichTextEditor</code>)</li>
  </ul>

  <h3>👥 Equipe — implementado (ago/2026)</h3>
  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">clinica-api + CASL</div>
      <p>CRUD de membros e catálogo de cargos na <strong>clinica-api</strong> (<code>/v1/members</code>, <code>/v1/members/roles</code>). Fonte de permissões: package <code>@citybox/clinica-permissions</code> (<code>STORE_PERMISSIONS_MODULES</code> + <code>permissionsForRole</code>). Horários e comissão: <code>GET/PUT /v1/team/:memberId/service-hours|commission-rules</code>.</p>
    </div>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Área</th><th>Detalhe</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">UI</td><td>Sheet com abas <em>Permissões</em>, <em>Horários de Atendimento</em> (só <code>aluno</code>/<code>dentista_admin</code>/<code>dentista</code>) e <em>Comissão</em>; accordion de permissões inicia <strong>fechado</strong>; módulos/checkboxes em ordem alfabética <code>pt-BR</code></td></tr>
        <tr><td class="td-bold">Cargos</td><td><code>aluno</code>, <code>contador</code>, <code>dentista_admin</code>, <code>dentista</code>, <code>gerente</code>, <code>radiologia</code>, <code>secretario</code>, <code>vendedor</code> — presets em <code>role-catalog.ts</code>; <code>dentista_admin</code> = todos os checkboxes</td></tr>
        <tr><td class="td-bold">Painel de horários</td><td><code>InviteProfessionalServiceHoursPanel</code> — grade Seg–Dom (empilha no mobile), duração padrão da consulta (5–240 min), almoço fixo opcional</td></tr>
        <tr><td class="td-bold">Contrato front</td><td><code>ServiceHoursConfig</code> em <code>team/types/service-hours.ts</code></td></tr>
        <tr><td class="td-bold">Cliente web</td><td><code>apps/verticals/clinica/web</code> · <code>team/services/service-hours.service.ts</code> · <code>features/shared/team</code></td></tr>
        <tr><td class="td-bold">Fluxo salvar</td><td>1) POST/PUT membro na clinica-api (com <code>permissions[]</code>) → 2) PUT horários se o cargo tiver aba</td></tr>
        <tr><td class="td-bold">Fluxo editar</td><td>GET horários ao abrir sheet se cargo elegível; cargo não alterável após cadastro (label legado se key antigo)</td></tr>
        <tr><td class="td-bold">Comissão</td><td><code>commission-rules.service.ts</code> · identidade única · prefill/sobrescrita</td></tr>
        <tr><td class="td-bold">API regras</td><td><code>GET/PUT /api/v1/team/:memberId/commission-rules</code> · replace deduplica · gatilhos CLIN-062</td></tr>
        <tr><td class="td-bold">Permissões</td><td><strong>Reais</strong> — JSON no vínculo; guard CASL na API; UI Equipe edita checkboxes</td></tr>
      </tbody>
    </table>
  </div>

  <h4>API clinica-api — horários de atendimento</h4>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método</th><th>Rota</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">GET</td><td><code>/api/v1/team/:memberId/service-hours</code></td><td>Retorna config salva ou defaults (Seg–Sex 08:00–18:00, consulta 30 min)</td></tr>
        <tr><td class="td-bold">PUT</td><td><code>/api/v1/team/:memberId/service-hours</code></td><td>Upsert validado (Zod + class-validator); body = <code>ServiceHoursConfig</code></td></tr>
      </tbody>
    </table>
  </div>
  <p>Escopo: header <code>X-Store-Id</code> · Gate CASL: <code>update</code> Team (Equipe).</p>

  <h4>Backend — arquivos principais</h4>
  <pre style="font-size:12px;line-height:1.5;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;overflow-x:auto">apps/verticals/clinica/
├── permissions/src/role-catalog.ts          ← CLINIC_ROLES + permissionsForRole
├── api/src/modules/members/                 ← CRUD + roles
├── api/src/modules/team-service-hours/      ← GET/PUT service-hours
└── web/.../settings/team/                   ← sheet Equipe + presets UI</pre>

  <h4>⏳ Pendente (equipe)</h4>
  <ul>
    <li>Integração da grade de horários com módulo de Agenda (bloqueio de slots, almoço, duração do procedimento)</li>
    <li>Exceções/feriados por profissional</li>
    <li>Migração em massa de membros com cargos removidos (<code>auxiliar</code>/<code>recepcionista</code>/<code>financeiro</code>) para um cargo do catálogo novo</li>
  </ul>

  <h3>📝 Anamneses — implementado (API + ERP)</h3>
  <div class="alert alert-green" style="margin-bottom:16px">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Integração clinic-api (jun/2026)</div>
      <p>ERP consome a API via proxy <code>/api/proxy/clinica/v1/…</code> (TanStack Query). Permissão: <code>store.clinic.settings.manage</code> + header <code>X-Store-Id</code>. Backend: módulo <code>anamnesis</code> em <code>apps/verticals/clinica/api</code>, schema Prisma <code>clinica</code>, 15 testes Jest.</p>
    </div>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Área</th><th>Detalhe</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Listagem</td><td>Título <em>Modelos de Anamnese</em>, botão <em>Novo modelo</em>, tabela Nome + Status (<code>ClinicCompactSwitch</code> via <code>PATCH …/status</code>) + Ações (editar / excluir modelo); wrapper <code>overflow-x-auto</code> no mobile</td></tr>
        <tr><td class="td-bold">Sheet modelo</td><td>Nome do modelo, busca <em>Buscar pergunta</em> (filtra a lista completa da biblioteca no modelo), rodapé Cancelar / Salvar</td></tr>
        <tr><td class="td-bold">Biblioteca compartilhada</td><td><strong>Todas</strong> as perguntas da biblioteca (~15 globais do seed + custom da clínica) aparecem em <strong>cada</strong> modelo. O usuário só <strong>ativa/desativa</strong> com toggle — não há “adicionar ao modelo” nem “excluir do modelo”. Sheet revalida a biblioteca ao abrir.</td></tr>
        <tr><td class="td-bold">Novo modelo</td><td>Todas as perguntas começam <strong>desativadas</strong> (<code>active: false</code> no pivô). Merge automático no backend (<code>merge-template-with-library.ts</code>).</td></tr>
        <tr><td class="td-bold">Perguntas no modelo</td><td>Lista com drag-and-drop (<code>@dnd-kit</code>) para reordenar; toggle <em>Pergunta Ativa</em> / <em>Desativada</em>; card acinzentado quando inativo; menu ⋯ <strong>só</strong> em perguntas editáveis (<code>scope: clinic</code> ou custom pendente)</td></tr>
        <tr><td class="td-bold">Numeração</td><td>Apenas perguntas <strong>ativas</strong> recebem número sequencial (1, 2, 3…); desativadas ficam sem número visível</td></tr>
        <tr><td class="td-bold">Subtítulo da pergunta</td><td><em>Com alerta: {nome} - Pergunta {tipo}</em> ou <em>Sem alerta - Pergunta {tipo}</em></td></tr>
        <tr><td class="td-bold">Sheet pergunta (aninhado)</td><td>Tipos: Sim/Não/Não sei, Sim/Não/Não sei e Texto, Somente Texto, Esquerda/Direita/Não sei; alerta condicional (<code>generatesAlert</code> → coluna <code>generates_alert</code>); overlay leve</td></tr>
        <tr><td class="td-bold">Pergunta nova</td><td>Vai para a <strong>biblioteca da clínica</strong> (<code>templateId: null</code>, <code>scope: clinic</code>) e passa a aparecer em todos os modelos; persistida no save via <code>customQuestions</code> + <code>pendingCustomQuestionsRef</code></td></tr>
        <tr><td class="td-bold">Edição</td><td>Somente perguntas <code>scope: clinic</code> (custom da loja). Perguntas <strong>globais</strong> do seed (~15) são somente leitura — toggle on/off apenas</td></tr>
        <tr><td class="td-bold">Modelo de dados</td><td><code>AnamnesisTemplate</code> + <code>AnamnesisQuestion</code> (biblioteca) + <code>AnamnesisTemplateQuestion</code> (pivô: <code>order</code>, <code>active</code>, <code>required</code>)</td></tr>
        <tr><td class="td-bold">CSS clinic</td><td>Overlay duplicado do sheet aninhado neutralizado em <code>clinic-sheets.css</code> (<code>data-clinic-nested-sheet</code>)</td></tr>
      </tbody>
    </table>
  </div>

  <h4>🔌 Endpoints (clinic-api)</h4>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método</th><th>Rota</th><th>Uso</th></tr></thead>
      <tbody>
        <tr><td><code>GET</code></td><td><code>/v1/anamnesis-templates</code></td><td>Listar modelos da loja</td></tr>
        <tr><td><code>POST</code></td><td><code>/v1/anamnesis-templates</code></td><td>Criar modelo (merge com biblioteca)</td></tr>
        <tr><td><code>GET</code></td><td><code>/v1/anamnesis-templates/:id</code></td><td>Detalhe do modelo + perguntas</td></tr>
        <tr><td><code>PUT</code></td><td><code>/v1/anamnesis-templates/:id</code></td><td>Atualizar nome, ordem, toggles e custom questions</td></tr>
        <tr><td><code>DELETE</code></td><td><code>/v1/anamnesis-templates/:id</code></td><td>Excluir modelo</td></tr>
        <tr><td><code>PATCH</code></td><td><code>/v1/anamnesis-templates/:id/status</code></td><td>Ativar/desativar modelo na listagem</td></tr>
        <tr><td><code>GET</code></td><td><code>/v1/anamnesis-questions</code></td><td>Biblioteca (globais + clínica)</td></tr>
      </tbody>
    </table>
  </div>
  <p><em>Não há</em> <code>DELETE /anamnesis-questions</code> nem <code>POST</code> isolado de pergunta — custom entra no payload do <code>PUT</code>/<code>POST</code> do modelo.</p>

  <h4>📁 Arquivos-chave (anamneses)</h4>
  <pre style="font-size:12px;line-height:1.5;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;overflow-x:auto">apps/verticals/clinica/api/src/modules/anamnesis/
├── application/services/merge-template-with-library.ts
├── application/services/validate-template-payload.ts
├── infrastructure/database/prisma-anamnesis.repository.ts
└── infrastructure/http/routes/…

apps/erp/src/features/clinic/modules/settings/anamneses/
├── components/clinic-anamnesis-sheet.tsx
├── components/anamnesis-questions-panel.tsx
├── lib/merge-template-questions-with-library.ts
├── lib/collect-custom-questions-for-save.ts
└── hooks/use-anamnesis-*.ts

apps/erp/src/app/api/proxy/clinica/[...path]/route.ts</pre>

  <h4>⏳ Pendente (anamneses)</h4>
  <ul>
    <li>Link público de preenchimento pelo paciente (<code>/anamnese/&lt;token&gt;</code>)</li>
    <li><code>PatientAnamnesis</code> com snapshot imutável, PDF, assinatura digital</li>
    <li>Versionamento de modelo ao editar (anamneses já preenchidas preservam versão)</li>
    <li>Testes Vitest no ERP (hooks, merge, componentes DnD)</li>
    <li>Edição de perguntas <strong>globais</strong> da biblioteca (hoje só custom <code>scope: clinic</code> é editável)</li>
    <li>Busca na biblioteca para localizar perguntas fora do viewport (hoje filtra só a lista já renderizada no modelo)</li>
    <li><code>POST/DELETE</code> dedicados para perguntas da biblioteca (opcional — hoje via payload do modelo)</li>
  </ul>
  <p>Blueprint completo: <a href="#anamnese-formularios">Anamnese Digital &amp; Formulários</a>.</p>

  <h3>📄 Contratos — implementado (jun/2026)</h3>

  <h4>Backend — <code>clinica-api</code> (:3172)</h4>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Recurso</th><th>Detalhe</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Pacote</td><td><code>@citybox/clinica-api</code> em <code>apps/verticals/clinica/api</code></td></tr>
        <tr><td class="td-bold">Schema Prisma</td><td><code>clinica.contract_models</code> — migration <code>20260626200000_add_contract_models</code></td></tr>
        <tr><td class="td-bold">Endpoints</td><td><code>GET/POST /api/v1/contract-models</code> · <code>PUT/DELETE /api/v1/contract-models/:id</code></td></tr>
        <tr><td class="td-bold">Escopo</td><td>Header <code>X-Store-Id</code> (injetado pelo proxy ERP) · permissão <code>store.clinic.settings.manage</code></td></tr>
        <tr><td class="td-bold">Regras</td><td>Nome único por loja (case-insensitive) · um único <code>isDefault</code> por loja · modelo padrão não pode ser excluído (<code>409</code>)</td></tr>
        <tr><td class="td-bold">Campos</td><td><code>name</code>, <code>content</code> (HTML rich-text), <code>isDefault</code>, timestamps</td></tr>
      </tbody>
    </table>
  </div>

  <h4>ERP — listagem, sheet e integração</h4>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Área</th><th>Detalhe</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Listagem</td><td>Título <em>Modelos de contratos</em>, botão <em>Novo Modelo</em>, tabela Nome + badge <em>Padrão</em> (<code>border-primary/30 bg-primary/5</code>) + Ações</td></tr>
        <tr><td class="td-bold">Persistência</td><td>TanStack Query (<code>use-contract-models-query</code>, <code>use-contract-models</code>) · service <code>contract-models.service.ts</code> · proxy <code>apps/erp/src/app/api/proxy/clinica/[...path]/route.ts</code></td></tr>
        <tr><td class="td-bold">Env dev</td><td><code>CLINICA_API_URL=http://127.0.0.1:3172/api</code> em <code>apps/erp/.env.development</code></td></tr>
        <tr><td class="td-bold">Sheet modelo</td><td>Fullscreen, animação <strong>de baixo para cima</strong> (~550ms) via <code>clinic-sheets.css</code> + <code>side="bottom"</code></td></tr>
        <tr><td class="td-bold">Cabeçalho do sheet</td><td>Sem título visível (apenas <code>SheetTitle</code> em <code>sr-only</code>); sem botão X — fechar via Cancelar ou overlay</td></tr>
        <tr><td class="td-bold">Nome + padrão</td><td>Campo <em>Nome do modelo</em> + toggle <em>Modelo padrão</em>; conflito abre <code>ContractDefaultConfirmDialog</code> (<code>resolve-conflicting-default-contract.ts</code> + teste Vitest)</td></tr>
        <tr><td class="td-bold">Sidebar variáveis</td><td>Chips arrastáveis (HTML5 drag) agrupados: Contratante, Contratada, Tratamento e custos, Informações do contrato</td></tr>
        <tr><td class="td-bold">Editor</td><td><code>RichTextEditor</code> de <code>@citybox/ui/organisms</code> com <code>page="a4"</code> (papel branco 210×297mm, guias de quebra, CSS de impressão A4)</td></tr>
        <tr><td class="td-bold">Chips de variável</td><td><code>VariableNode</code> (TipTap): círculo <code>primary</code> + label legível; token <code>{{nome_paciente}}</code> no HTML; inserção por drag-and-drop da sidebar ou API <code>insertVariable()</code></td></tr>
        <tr><td class="td-bold">Rodapé</td><td>Cancelar / Salvar Modelo · overlay de loading durante mutation</td></tr>
        <tr><td class="td-bold">Mocks legados</td><td><code>mock-clinic-contracts.ts</code> e catálogo <code>contract-variable-catalog.ts</code> (12 variáveis) — catálogo ainda usado pela sidebar; listagem não usa mais mock</td></tr>
      </tbody>
    </table>
  </div>

  <h4>Toolbar do <code>RichTextEditor</code> (<code>packages/ui</code>)</h4>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Grupo</th><th>Controles</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Histórico</td><td>Desfazer · Refazer</td></tr>
        <tr><td class="td-bold">Tipografia</td><td>Select estilo: Normal, Título 1–4 · Select fonte: Arial, Times New Roman, Courier New, Georgia, Verdana, System UI · Botão código inline (<code>&lt;/&gt;</code>)</td></tr>
        <tr><td class="td-bold">Formatação</td><td>Negrito · Itálico · Sublinhado · Tachado</td></tr>
        <tr><td class="td-bold">Listas</td><td>Marcadores · Numerada</td></tr>
        <tr><td class="td-bold">Alinhamento</td><td>Esquerda · Centro · Direita · Justificado</td></tr>
        <tr><td class="td-bold">Mídia</td><td><strong>Imagem</strong> — popover com área tracejada drag-and-drop (SVG/PNG/JPG/GIF, base64) em vez de abrir o explorador direto</td></tr>
        <tr><td class="td-bold">Cor</td><td><strong>Cor do texto e destaque</strong> — popover com listas <em>Cor</em> (Padrão, Cinza, Marrom, Laranja, Amarelo, Verde, Azul, Roxo, Rosa, Vermelho) e <em>Destaque</em> (Sem destaque + tons pastel); extensões TipTap <code>Color</code> + <code>Highlight</code></td></tr>
        <tr><td class="td-bold">Busca (canto direito)</td><td><strong>Buscar e Substituir</strong> — campo <em>Buscar…</em>, contador N/M, navegação anterior/próximo, toggle para campo <em>Substituir por…</em>, destaque de ocorrências no documento (<code>SearchReplaceExtension</code>)</td></tr>
      </tbody>
    </table>
  </div>
  <p>Extensões TipTap no editor: <code>StarterKit</code>, <code>TextStyle</code>, <code>Color</code>, <code>FontFamily</code>, <code>Highlight</code>, <code>Image</code>, <code>TextAlign</code>, <code>Placeholder</code>, <code>VariableNode</code>, <code>SearchReplaceExtension</code>.</p>

  <h4>⏳ Pendente (contratos)</h4>
  <ul>
    <li>Pré-visualização do contrato com variáveis interpoladas (endpoint <em>gerar</em> sem persistir)</li>
    <li><code>PatientContract</code> — emissão a partir do modelo no prontuário</li>
    <li>Workflow de assinatura digital (sem assinatura → pendente → assinada) e imutabilidade pós-assinatura</li>
    <li>Emissão de PDF A4 a partir do HTML persistido</li>
    <li>Seeds de modelos padrão por especialidade no onboarding</li>
    <li>Cobertura de testes ≥ 80% no módulo ERP <code>settings/contracts</code> (hoje só <code>resolve-conflicting-default-contract.test.ts</code>)</li>
  </ul>
  <p>Blueprint de contratos no prontuário: <a href="#documentos-contratos">Documentos, Receituário &amp; Contratos</a> (§ 23.4).</p>

  <h3>🧑‍⚕️ Pacientes e categorias — implementado (jul/2026)</h3>
  <div class="alert alert-green" style="margin-bottom:16px">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Branch <code>feat/clinic/create-backend-patient</code></div>
      <p>Backend NestJS em <code>modules/patients/</code> com submódulo <code>patient-categories/</code>. ERP consome via <code>clinicaFetch</code>/<code>clinicaUpload</code> (TanStack Query). Permissão: <code>store.clinic.patients.manage</code>. 104 testes Jest na clinica-api.</p>
    </div>
  </div>
  <h4>Backend — <code>clinica-api</code></h4>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Recurso</th><th>Detalhe</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Models Prisma</td><td><code>Patient</code>, <code>PatientCategory</code> — migration <code>add_patients</code> / <code>add_profile_patient</code></td></tr>
        <tr><td class="td-bold">Pacientes</td><td><code>GET/POST /v1/patients</code> · <code>GET/PUT /v1/patients/:id</code> · <code>PATCH …/status</code> · foto <code>POST/GET/DELETE …/photo</code></td></tr>
        <tr><td class="td-bold">Categorias</td><td><code>GET/POST /v1/patient-categories</code> · <code>PUT/DELETE /v1/patient-categories/:id</code> · <code>GET/POST /v1/appointment-categories</code> (<strong>sem</strong> espelhamento de pacientes)</td></tr>
        <tr><td class="td-bold">Regras</td><td>CPF/CNPJ com DV; categoria protegida <em>Particular</em> (seed); <code>planName</code>+<code>planStatus</code> no paciente; paginação <code>{ data, meta }</code></td></tr>
        <tr><td class="td-bold">Foto</td><td>MinIO <code>{storeId}/patients/{patientId}.ext</code> via <code>PatientObjectKeyPolicy</code></td></tr>
        <tr><td class="td-bold">LGPD</td><td>PII nunca em logs — apenas <code>patientId</code>/<code>storeId</code> em erros</td></tr>
      </tbody>
    </table>
  </div>
  <h4>ERP — lista, cadastro, ficha Sobre e foto</h4>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Área</th><th>Detalhe</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Lista</td><td><code>/clinic/pacientes</code> — paginação server-side, busca, ordenação; <code>patients-pagination-bar</code> (10/20/50/100)</td></tr>
        <tr><td class="td-bold">Formulários</td><td>RHF + Zod (<code>patient-form.schema.ts</code>); só nome obrigatório; toast de validação por campo (<code>patient-form-validation.ts</code>)</td></tr>
        <tr><td class="td-bold">Ficha Sobre</td><td><code>/clinic/pacientes/[id]/sobre</code> — dados da API; convênio/plano inativo exibe <code>Nome (Inativo)</code> via <code>planStatus</code></td></tr>
        <tr><td class="td-bold">Foto</td><td><code>patient-photo-dialog.tsx</code> no header; upload automático ao selecionar imagem</td></tr>
        <tr><td class="td-bold">Categorias (settings)</td><td>Rotas separadas: <code>/categoria-paciente</code> e <code>/categoria-agendamento</code> (redirect de <code>/categoria</code>); header + botão na mesma linha; tabela agendamento sem coluna Consultas</td></tr>
        <tr><td class="td-bold">Services / hooks</td><td><code>patients.service.ts</code>, <code>patient-budgets.service.ts</code>, <code>patient-anamnesis.service.ts</code>, <code>use-patients-list-query</code>, <code>use-patient-budget-queries</code>, <code>use-patient-anamnesis-queries</code>, <code>use-debounced-search</code> (400&nbsp;ms)</td></tr>
        <tr><td class="td-bold">Mappers</td><td><code>patient-api-mappers.ts</code> — URL da foto via proxy com <code>?storeId=</code></td></tr>
      </tbody>
    </table>
  </div>
  <h4>⏳ Pendente (pacientes)</h4>
  <ul>
    <li>Assinatura digital completa na anamnese; consentimento LGPD persistido na API</li>
    <li>Eventos RabbitMQ (<code>patient.created</code>) e outbox</li>
    <li>Log de auditoria de acesso a prontuário (LGPD)</li>
    <li><code>aboutSummary</code> na API (última consulta, retorno) — depende de agenda</li>
  </ul>
  <p>Detalhe completo: <a href="#visao-geral-clinic">Visão Geral</a> · <a href="#prontuario-eletronico">Prontuário Eletrônico</a>.</p>

  <h3>📁 Mapa de arquivos (jun/2026)</h3>
  <pre style="font-size:12px;line-height:1.5;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;overflow-x:auto">features/clinic/modules/settings/
├── pages/clinica-settings-page.tsx
├── anamneses/          ← modelos de anamnese (integrado clinic-api)
├── contracts/          ← modelos de contrato (API + rich-text)
│   ├── pages/contracts-settings-page.tsx
│   ├── components/     ← sheet, tabela, sidebar, dialog padrão
│   ├── hooks/          ← TanStack Query + mutations
│   ├── services/       ← contract-models.service.ts
│   ├── lib/            ← form, resolve-conflicting-default (+ teste)
│   └── data/           ← contract-variable-catalog.ts (sidebar)
├── plans/              ← planos de tratamento
├── team/               ← equipe (platform-api) + horários (clinica-api)
│   └── services/service-hours.service.ts
├── components/clinic-settings-form.tsx
└── data/mock-clinic-settings.ts

packages/ui/src/components/organisms/rich-text-editor/
├── rich-text-editor.tsx
├── rich-text-editor-toolbar.tsx
├── rich-text-editor-color-picker.tsx
├── rich-text-editor-search-replace.tsx
├── search-replace-extension.ts
└── variable-node.ts

apps/verticals/clinica/api/
├── prisma/schema.prisma + migrations/20260626200000_add_contract_models
└── src/modules/contract-models/   ← Clean Architecture (domain/application/infra)

features/clinic/shared/api/
└── clinic-client.ts              ← clinicFetch via proxy

apps/erp/src/app/api/proxy/clinica/
└── [...path]/route.ts

features/clinic/
├── clinic-sheets.css
├── lib/clinic-sheet-styles.ts
└── components/clinic-compact-switch.tsx

app/clinic/configuracoes/
├── layout.tsx
├── page.tsx → Clínica
├── equipe/page.tsx
├── planos/page.tsx
├── anamneses/page.tsx
└── contrato/page.tsx</pre>

  <h3>🔜 Próximos passos (quando retomar)</h3>
  <ol>
    <li>Clínica (aba cadastral): API de perfil da unidade + horário de funcionamento (<code>openingTime</code>/<code>closingTime</code>)</li>
    <li>Contratos: endpoint <em>gerar</em> (preview interpolado) + emissão <code>PatientContract</code> no prontuário</li>
    <li>Contratos: PDF A4 + workflow de assinatura digital</li>
    <li>Anamneses: endpoint de biblioteca + busca para adicionar perguntas globais ao modelo; link público, <code>PatientAnamnesis</code>, snapshot/PDF e testes Vitest no ERP</li>
    <li>Equipe: persistir permissões granulares na clinica-api e integrar horários com o módulo de Agenda</li>
    <li>Substituir mocks restantes por React Query / mutations com invalidação de cache</li>
    <li>Cobertura de testes ≥ 80% nos módulos <code>settings/*</code> (ERP) — incluindo <code>settings/anamneses</code> e <code>settings/contracts</code></li>
  </ol>

  <div class="alert alert-amber">
    <span class="alert-icon">⚠️</span>
    <div class="alert-body">
      <div class="alert-title">Escopo da equipe Clinic</div>
      <p>Customizações de sheet e CSS ficam em <code>features/clinic/</code> e são carregadas apenas nas rotas <code>/clinic/*</code>. O editor de contratos usa o organismo compartilhado <code>RichTextEditor</code> em <code>packages/ui</code> (exceção deliberada — reutilizável por outras verticais). Demais abas ainda não devem alterar <code>packages/ui</code> sem alinhamento.</p>
    </div>
  </div>

  <h2>11.1 Perfis e permissões (RBAC)</h2>
  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">CASL real (ago/2026)</div>
      <p>Catálogo e enforcement em <code>@citybox/clinica-permissions</code>. Checkboxes na Equipe = IDs finos; API usa <code>@RequirePermission</code> / <code>@RequireAnyPermission</code>. OWNER da organização tem bypass <code>manage all</code> na API; na UI de config financeiro/vendas alguns gates usam IDs do JSON (sem bypass).</p>
    </div>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Cargo (key)</th><th>Label</th><th>Horários</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>aluno</code></td><td>Aluno(a)</td><td>Sim</td></tr>
        <tr><td class="td-bold"><code>contador</code></td><td>Contador(a)</td><td>Não</td></tr>
        <tr><td class="td-bold"><code>dentista_admin</code></td><td>Dentista administrador(a)</td><td>Sim — permissão total (todos os checkboxes)</td></tr>
        <tr><td class="td-bold"><code>dentista</code></td><td>Dentista</td><td>Sim</td></tr>
        <tr><td class="td-bold"><code>gerente</code></td><td>Gerente</td><td>Não</td></tr>
        <tr><td class="td-bold"><code>radiologia</code></td><td>Radiologia</td><td>Não</td></tr>
        <tr><td class="td-bold"><code>secretario</code></td><td>Secretário(a)</td><td>Não</td></tr>
        <tr><td class="td-bold"><code>vendedor</code></td><td>Vendedor(a)</td><td>Não</td></tr>
      </tbody>
    </table>
  </div>
  <ul>
    <li>Presets por cargo em <code>permissionsForRole</code>; operador pode ajustar checkboxes antes de salvar</li>
    <li>Papéis removidos do catálogo: <code>auxiliar</code>, <code>recepcionista</code>, <code>financeiro</code> (ainda legíveis via <code>clinicRoleLabel</code>)</li>
    <li>Log de auditoria LGPD de prontuário permanece blueprint</li>
  </ul>

  <h2>11.2 Configurações da clínica</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">🏢</span> Dados Cadastrais</div>
      <p>Razão social, CNPJ, CRM/CRO da clínica, logo, endereço. Especialidades ofertadas e profissionais responsáveis por cada uma.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">⏰</span> Horário de Funcionamento</div>
      <p>Configuração por dia da semana, com feriados e datas de fechamento. Integrado ao bloqueio automático da agenda online.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🚪</span> Salas de Atendimento</div>
      <p>Nome da sala, capacidade, equipamentos disponíveis. Procedimentos podem ser vinculados a salas específicas (ex: RX só na sala de radiologia).</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">📋</span> TCLE Digital</div>
      <p>Termos de Consentimento Livre e Esclarecido: criação, versionamento e assinatura digital do paciente. Histórico imutável de aceitações.</p>
    </div>
  </div>

  <h2>11.3 Tabela de procedimentos e serviços</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Campo</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Código TUSS/CBHPM</td><td>Código oficial para faturamento de convênios</td></tr>
        <tr><td class="td-bold">Descrição</td><td>Nome do procedimento apresentado ao paciente e na nota fiscal</td></tr>
        <tr><td class="td-bold">Duração estimada</td><td>Alimenta automaticamente os slots da agenda ao agendar</td></tr>
        <tr><td class="td-bold">Preço particular</td><td>Valor cobrado ao paciente sem convênio</td></tr>
        <tr><td class="td-bold">Preço por convênio</td><td>Pode variar por operadora (tabela TUSS diferenciada)</td></tr>
        <tr><td class="td-bold">Sala exigida</td><td>Procedimento só pode ser agendado em salas com equipamento específico</td></tr>
        <tr><td class="td-bold">Requer preparo</td><td>Instrução de preparo enviada automaticamente ao paciente ao agendar</td></tr>
      </tbody>
    </table>
  </div>

  <h2>11.4 Integrações</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Integração</th><th>Tipo</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">CityBox Payments</td><td><span class="tag-cyan">Interna</span></td><td>PIX, cartão, split de comissão via payments-api</td></tr>
        <tr><td class="td-bold">NFS-e Municipal</td><td><span class="tag-cyan">Interna</span></td><td>Emissão via fiscal-api (webservice da prefeitura)</td></tr>
        <tr><td class="td-bold">WhatsApp (Baileys MVP)</td><td><span class="tag-green">clinica-api · main-whatsapp</span></td><td>Sessão QR em Configurações; confirmação/lembrete de agenda; campanha Aniversariantes (1 msg / 5 min a partir 07:00 BRT). Evolução: Cloud API oficial</td></tr>
        <tr><td class="td-bold">E-mail (SES/SendGrid)</td><td><span class="tag-teal">via notifications-api</span></td><td>Comunicação formal, relatórios, documentos</td></tr>
        <tr><td class="td-bold">TISS / ANS</td><td><span class="tag-sky">Direta</span></td><td>XML TISS 3.x para portais de convênios</td></tr>
        <tr><td class="td-bold">ViaCEP</td><td><span class="tag-sky">Direta</span></td><td>Auto-preenchimento de endereço por CEP</td></tr>
        <tr><td class="td-bold">Receita Federal</td><td><span class="tag-sky">Direta</span></td><td>Validação de CPF/CNPJ no cadastro</td></tr>
        <tr><td class="td-bold">Maquininha (Stone/PagSeguro)</td><td><span class="tag-teal">via payments-api</span></td><td>Integração TEF para cobrança no balcão</td></tr>
        <tr><td class="td-bold">Google Agenda</td><td><span class="tag-gray">Opcional</span></td><td>Sincronização bidirecional de agenda do profissional</td></tr>
        <tr><td class="td-bold">Calendário Apple</td><td><span class="tag-gray">Opcional</span></td><td>Sincronização bidirecional via CalDAV</td></tr>
        <tr><td class="td-bold">RNDS (Ministério da Saúde)</td><td><span class="tag-amber">Planejado</span></td><td>Rede Nacional de Dados em Saúde — fase 3</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">DRY — Reutilizando infraestrutura do CityBox</div>
      <p>Payments, NFS-e, WhatsApp e e-mail já estão implementados e testados em outras verticais. A Clinic não reimplementa nada — apenas configura e consome as APIs existentes. Isso reduz drasticamente o tempo de desenvolvimento e manutenção.</p>
    </div>
  </div>
</div>
`
});
