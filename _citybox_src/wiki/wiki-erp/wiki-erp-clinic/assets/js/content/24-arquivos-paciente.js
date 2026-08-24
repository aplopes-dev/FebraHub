WIKI.register({
  id: 'arquivos-paciente',
  title: 'Arquivos do Paciente (Drive Clínico)',
  icon: '🗂️',
  searchText: 'arquivos paciente drive clinico mini google drive pastas upload multiplos arquivos lightbox imagens camera mediastream foto navegador object storage s3 minio presigned url pre-assinada storage key uuid renomear mover pasta arvore parentId exclusao recursiva mime type validacao tamanho 20mb anti-idor isolamento clinica lgpd dados sensiveis saude exames imagem laudos fotos clinicas consentimentos guias convenio documentos pessoais PatientFolder PatientFile prontuario anexos selecionar todas preview fullscreen upload painel inferior clinica-api integrado react query patient-files.service excludeFolderSubtreeId migration 20260707144451 jul 2026',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Prontuário Clínico</div>
    <h1 class="section-title">🗂️ Arquivos do Paciente (Drive Clínico)</h1>
    <p class="section-subtitle">Um "mini Google Drive" por paciente: pastas, upload em massa, captura por câmera e armazenamento em object storage compatível com S3 — com isolamento estrito por paciente e clínica.</p>
    <div class="section-tags"><span class="tag-cyan">Mini-Drive</span><span class="tag-teal">Upload</span><span class="tag-red">Anti-IDOR</span><span class="tag-green">API integrada</span></div>
  </div>

  <h2>Visão geral</h2>
  <p>O wiki descreve o gerenciador de arquivos completo — um mini Google Drive dedicado a cada paciente — onde a equipe organiza, visualiza e versiona toda a documentação clínica em pastas navegáveis. Funciona de forma transversal a qualquer especialidade da clínica multi-especialidade.</p>

  <div class="alert alert-green">
    <div class="alert-icon">✅</div>
    <div class="alert-body">
      <div class="alert-title">Backend + ERP integrados (jul/2026)</div>
      <p>A aba <strong>Arquivos</strong> (<code>/clinic/pacientes/[id]/arquivos</code>) consome a <code>clinica-api</code> via proxy ERP (<code>/api/proxy/clinica</code>, header <code>X-Store-Id</code>). Persistência Postgres (<code>patient_folders</code>, <code>patient_files</code>) + MinIO; migration <code>20260707144451_add_patient_files</code>. UI: React Query (<code>use-patient-files-queries</code>), busca server-side com debounce 400&nbsp;ms, upload multipart, preview/download via proxy de conteúdo. Aba sem badge <em>Em breve</em>.</p>
    </div>
  </div>

  <div class="alert alert-amber">
    <div class="alert-icon">⏳</div>
    <div class="alert-body">
      <div class="alert-title">Pendências fase 2</div>
      <p>Presigned URLs MinIO/S3 (upload/download direto no cliente), drag-and-drop, ações em lote na seleção múltipla, viewer PDF embutido.</p>
    </div>
  </div>

  <h2>1. Interface estilo Google Drive</h2>
  <p>A grade de arquivos vive dentro da ficha do paciente, em uma aba dedicada. A experiência espelha um drive moderno:</p>

  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">🧭</span> Navegação &amp; breadcrumb</div>
      <p>Grade de pastas e arquivos com breadcrumb hierárquico (<code>Arquivos / Exames / 2026</code>). Clique navega para dentro da pasta; o breadcrumb permite voltar a qualquer nível. A raiz exibe o rótulo <strong>Arquivos</strong> (não o nome do paciente).</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🔍</span> Busca</div>
      <p>Campo de busca com debounce 400&nbsp;ms → query param <code>search</code> no backend (<code>GET …/drive</code>). Filtra pastas e arquivos pelo nome na pasta corrente (server-side, política §8.1 do monorepo).</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">☑️</span> Seleção múltipla</div>
      <p>Checkbox <strong>Selecionar todas</strong> abaixo do título + checkbox por card. Estado local (mock); ações em lote na UI ainda pendentes.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">⬆️</span> Upload</div>
      <p>Menu <strong>Novo</strong>: pasta, imagem, arquivo ou câmera (<code>getUserMedia</code>). Upload via <code>clinicaUpload</code> multipart (<code>POST …/files</code>, máx 20&nbsp;MB). Painel fixo inferior com status por arquivo (sucesso/erro).</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">📁</span> Pastas (CRUD)</div>
      <p>Criar, renomear e mover pastas. A árvore é montada via pasta-pai (<code>parentId</code>), permitindo subníveis arbitrários.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🖼️</span> Preview fullscreen</div>
      <p>Imagens abrem em overlay preto tela cheia (sem nova aba). Setas <code>&lt;</code> <code>&gt;</code> navegam entre imagens da pasta; barra superior: nome à esquerda; baixar · editar (renomear) · excluir · fechar à direita.</p>
    </div>
  </div>

  <h3>Mockup textual da grade</h3>
  <div class="card-grid">
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">📂</span> Exames de Imagem</div>
      <p>Pasta — 12 arquivos</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">📂</span> Consentimentos</div>
      <p>Pasta — 3 arquivos</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">🖼️</span> evolucao-frontal.jpg</div>
      <p>Imagem — 2,4 MB</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">📄</span> laudo-externo.pdf</div>
      <p>PDF — 850 KB</p>
    </div>
  </div>

  <h2>2. Captura por câmera</h2>
  <ul>
    <li>Botão <strong>Tirar foto</strong> no menu Novo abre a câmera via <code>MediaStream</code> (getUserMedia) no navegador.</li>
    <li>A foto capturada é enviada como arquivo de imagem para a pasta corrente.</li>
    <li>Modal com retry em caso de permissão negada ou indisponibilidade.</li>
  </ul>

  <h2>3. Layout da grade (mock jul/2026)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Elemento</th><th>Dimensão / comportamento</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Área da grade (vazia)</td><td>largura fluida · altura <code>297,33px</code></td></tr>
        <tr><td class="td-bold">Área da grade (com itens)</td><td>largura fluida · altura <code>414px</code> (scroll se várias linhas)</td></tr>
        <tr><td class="td-bold">Card pasta/arquivo</td><td><code>354,44 × 397,95px</code> · borda <code>border-2 border-border</code> · hover primário</td></tr>
        <tr><td class="td-bold">Thumbnail imagem</td><td>até <code>288 × 224px</code> dentro do card</td></tr>
        <tr><td class="td-bold">Painel de upload</td><td>fixo inferior central · <code>384px</code> · barra resumo <code>48,67px</code> + linhas <code>88px</code></td></tr>
      </tbody>
    </table>
  </div>

  <h2>4. Armazenamento (object storage)</h2>
  <p>Os arquivos não ficam no banco: o binário vai para object storage compatível com S3 — <strong>MinIO</strong> em dev e <strong>S3</strong> em produção. O banco guarda metadados (<code>object_key</code>, MIME, tamanho, pasta).</p>

  <div class="card-grid">
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">🔑</span> Upload multipart (fase 1)</div>
      <p>Upload passa pelo backend NestJS (<code>FileInterceptor</code>), que valida MIME/tamanho e grava no MinIO. Fase 2: presigned URLs para upload direto do browser.</p>
    </div>
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">🗃️</span> Chave MinIO imutável</div>
      <p><code>{storeId}/patients/{patientId}/files/{fileId}.{ext}</code> — rename/move alteram só metadados no Postgres; o objeto no storage não é recopiado.</p>
    </div>
    <div class="card card-rose">
      <div class="card-title"><span class="card-icon">✏️</span> Renomear &amp; mover = metadados</div>
      <p>Renomear ou mover só alteram metadados no banco. A chave física continua usando UUID, então o objeto no storage nunca precisa ser recopiado.</p>
    </div>
    <div class="card card-red">
      <div class="card-title"><span class="card-icon">🗑️</span> Exclusão recursiva</div>
      <p>Excluir uma pasta limpa o storage e aplica cascata no banco: remove arquivos e subpastas em cadeia, sem deixar objetos órfãos.</p>
    </div>
  </div>

  <h2>5. Validações &amp; segurança</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Validação</th><th>Regra</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Tipo MIME</td><td>Permitidos: imagem, PDF, Word, Excel e texto. Outros tipos são rejeitados.</td></tr>
        <tr><td class="td-bold">Tamanho</td><td>Limite de 20 MB por arquivo (≤20MB).</td></tr>
        <tr><td class="td-bold">Vínculo da pasta</td><td>A pasta-pai deve pertencer ao paciente da rota.</td></tr>
        <tr><td class="td-bold">Vínculo do arquivo</td><td>O arquivo deve pertencer ao paciente e à clínica da rota.</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-red">
    <div class="alert-icon">🛡️</div>
    <div class="alert-body">
      <div class="alert-title">Proteção anti-IDOR &amp; isolamento LGPD</div>
      <p>Toda operação valida que a pasta e o arquivo pertencem ao paciente e à clínica da rota, impedindo acesso a documentos de outro paciente trocando um ID na URL (IDOR). Como o drive guarda dados sensíveis de saúde, esse isolamento estrito por paciente e clínica é um requisito de conformidade com a LGPD — presigned URLs de curta validade reforçam que o acesso seja sempre autorizado e rastreável.</p>
    </div>
  </div>

  <h2>6. Tipos de uso por especialidade</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">🩻</span> Exames de imagem</div>
      <p>Raios-X, ultrassom, tomografia, panorâmicas — anexados ao prontuário e visíveis no lightbox.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">📋</span> Laudos externos</div>
      <p>Resultados de laboratórios e clínicas parceiras em PDF.</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">📸</span> Fotos clínicas</div>
      <p>Registro fotográfico de evolução, lesões e procedimentos estéticos.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">✍️</span> Consentimentos assinados</div>
      <p>Termos de consentimento e autorizações digitalizados.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🧾</span> Guias de convênio</div>
      <p>Guias e autorizações de planos de saúde.</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">🪪</span> Documentos pessoais</div>
      <p>RG, CPF, comprovante de residência e demais documentos do paciente.</p>
    </div>
  </div>

  <h2>7. API <code>clinica-api</code> (referência)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método</th><th>Rota</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">GET</td><td><code>/api/v1/patients/:patientId/drive</code></td><td>Listagem da pasta (<code>folderId</code>, <code>search</code>)</td></tr>
        <tr><td class="td-bold">GET</td><td><code>…/drive/breadcrumb</code></td><td>Breadcrumb <code>Arquivos / …</code></td></tr>
        <tr><td class="td-bold">GET</td><td><code>…/drive/move-destinations</code></td><td>Destinos de mover (<code>excludeFolderSubtreeId</code>)</td></tr>
        <tr><td class="td-bold">POST</td><td><code>…/folders</code></td><td>Criar pasta</td></tr>
        <tr><td class="td-bold">PATCH</td><td><code>…/folders/:id</code> · <code>…/move</code></td><td>Renomear · mover pasta</td></tr>
        <tr><td class="td-bold">DELETE</td><td><code>…/folders/:id</code></td><td>Excluir pasta (recursivo + MinIO)</td></tr>
        <tr><td class="td-bold">POST</td><td><code>…/files</code></td><td>Upload multipart <code>file</code> + <code>folderId</code></td></tr>
        <tr><td class="td-bold">GET</td><td><code>…/files/:id/content</code></td><td>Stream preview/download</td></tr>
        <tr><td class="td-bold">PATCH</td><td><code>…/files/:id</code> · <code>…/move</code></td><td>Renomear · mover arquivo</td></tr>
        <tr><td class="td-bold">DELETE</td><td><code>…/files/:id</code></td><td>Excluir arquivo + objeto MinIO</td></tr>
      </tbody>
    </table>
  </div>
  <p>Permissão: <code>store.clinic.patients.manage</code> + <code>X-Store-Id</code>. Resposta drive: <code>{ data: { folders, files } }</code>.</p>

  <h2>8. Implementação frontend (referência de código)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Caminho</th><th>Papel</th></tr></thead>
      <tbody>
        <tr><td><code>services/patient-files.service.ts</code></td><td><code>clinicaFetch</code> / <code>clinicaUpload</code> — camada HTTP</td></tr>
        <tr><td><code>hooks/use-patient-files-queries.ts</code></td><td>React Query (drive, breadcrumb, mutations)</td></tr>
        <tr><td><code>lib/patient-file-api-mappers.ts</code></td><td>URLs de conteúdo via proxy ERP</td></tr>
        <tr><td><code>components/detail/tabs/patient-files-tab.tsx</code></td><td>Orquestrador da aba</td></tr>
        <tr><td><code>components/detail/files/*</code></td><td>Toolbar, grade, dialogs, fila de upload</td></tr>
        <tr><td><code>lib/patient-detail-tabs.ts</code></td><td><code>PATIENT_DETAIL_IMPLEMENTED_TABS</code> inclui <code>arquivos</code></td></tr>
        <tr><td><code>data/patient-files-mock-store.ts</code></td><td>Somente testes unitários (não usado em produção)</td></tr>
        <tr><td><code>app/clinic/pacientes/[id]/arquivos/page.tsx</code></td><td>Rota fina → <code>PatientFilesPage</code></td></tr>
      </tbody>
    </table>
  </div>

  <h2>9. Entidades (Prisma <code>clinica</code>)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Entidade</th><th>Campos principais</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr>
          <td class="td-bold"><code>PatientFolder</code></td>
          <td><code>id</code>, <code>storeId</code>, <code>patientId</code>, <code>parentId</code>, <code>name</code></td>
          <td>Pasta do drive. Árvore via <code>parentId</code> (raiz = <code>null</code>).</td>
        </tr>
        <tr>
          <td class="td-bold"><code>PatientFile</code></td>
          <td><code>id</code>, <code>folderId</code>, <code>objectKey</code>, <code>mimeType</code>, <code>sizeBytes</code>, <code>kind</code> (<code>image</code>|<code>file</code>)</td>
          <td>Metadados do arquivo; binário no MinIO. Preview ERP via proxy <code>…/files/:id/content</code>.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-blue">
    <div class="alert-icon">ℹ️</div>
    <div class="alert-body">
      <div class="alert-title">Contexto genérico de clínica</div>
      <p>O modelo é agnóstico de especialidade: o mesmo drive atende clínicas odontológicas, de estética, fisioterapia, dermatologia e qualquer outra unidade da operação multi-especialidade, variando apenas as pastas e os tipos de documento usados.</p>
    </div>
  </div>
</div>
`
});
