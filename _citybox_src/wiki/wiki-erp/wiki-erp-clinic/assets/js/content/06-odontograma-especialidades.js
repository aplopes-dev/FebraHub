WIKI.register({
  id: 'odontograma-especialidades',
  title: 'Odontograma & Módulos por Especialidade',
  icon: '🦷',
  searchText: 'odontograma charting dental dente face mesial distal oclusal vestibular lingual implante carie restauracao coroa periograma sondagem radiografia DICOM plano procedimento prontuario orcamento anotações tooth-annotations acceptsFaces FDI permanente deciduo HOF fisioterapia body chart goniometria escalas Barthel DASH psicologia DSM-5 PHQ-9 GAD-7 BDI nutricao antropometria IMC petroski adipometria dobra cutanea massa magra massa gorda plano alimentar medicina trabalho ASO PCMSO',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Prontuário Clínico</div>
    <h1 class="section-title">🦷 Odontograma &amp; Módulos por Especialidade</h1>
    <p class="section-subtitle">Cada especialidade tem seu módulo de prontuário dedicado que complementa o PEP genérico. O odontograma é o mais rico — com charting por face, periograma, plano de tratamento e orçamento integrado.</p>
    <div class="section-tags">
      <span class="tag-cyan">Odontologia</span>
      <span class="tag-teal">Fisioterapia</span>
      <span class="tag-sky">Psicologia</span>
      <span class="tag-green">Nutrição</span>
      <span class="tag-amber">Med. Trabalho</span>
    </div>
  </div>

  <h2>5.7 Prontuário odontológico — Odontograma</h2>
      <p>Módulo exclusivo para clínicas odontológicas. No ERP (jul/2026) o odontograma SVG já está integrado a <strong>Orçamentos</strong> e à aba <strong>Prontuário</strong>; periograma, status CFO por face e DICOM seguem no roadmap.</p>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Implementado no ERP + clinica-api (jul/2026)</div>
      <ul>
        <li><strong>Orçamentos</strong> — accordion no sheet Novo/Editar: Permanentes / Decíduos / HOF; seleção de dentes → <code>toothNumbers</code>; regiões (Maxila, Mandíbula…); HOF regiões + desenho Fabric.js (<code>hofAnnotations</code> local); faces M/O/I/D/V/L/P só se o tratamento do plano tiver <code>acceptsFaces</code>; faces entram no <code>locationLabel</code> (<code>15 · M,O/I</code>).</li>
        <li><strong>Planos (Config)</strong> — checkbox <strong>Aceita faces</strong> por tratamento (<code>ClinicPlanTreatment.acceptsFaces</code> / migration <code>20260727123000_…</code> — aplicar manualmente).</li>
        <li><strong>Tratamentos</strong> — odontograma na ficha (sem HOF): filtros Aberto (amarelo) / Finalizado (verde); pinta dentes de tratamentos <em>avulsos</em> e de <em>orçamento aprovado</em>; por dente prevalece o tratamento mais recente; anotações por dente persistidas (<code>GET/POST/DELETE /v1/patients/:id/tooth-annotations</code>, migration <code>20260727170000_…</code>); "!" roxo no número; clique → spinner na coroa → popover.</li>
        <li><strong>Layout SVG</strong> — canvas da coroa uniforme 24×56px (arcadas superior e inferior); faces 24×24; vão faces↔coroa igual (gap 4px); espelho horizontal no wrap nos quadrantes esquerdos.</li>
      </ul>
    </div>
  </div>

  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">🦷</span> Odontograma Visual Interativo</div>
      <p>Adulto 32 dentes + decíduo 20 dentes (FDI). Charting por face dental: mesial, distal, oclusal/incisal, vestibular, lingual/palatina. No ERP: clique no dente (Tratamentos) abre anotações; no orçamento seleciona dente/faces conforme <code>acceptsFaces</code>.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🎨</span> Status por Face</div>
      <p>Hígido, cárie, restauração (material), coroa, implante, ausente, fratura, selante. Cada status tem cor e símbolo padronizado pelo CFO. <em>Roadmap</em> — hoje as faces no orçamento marcam seleção M/O/I/D/V/L/P no item, não o charting clínico completo.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">📋</span> Plano de Tratamento</div>
      <p>Lista de procedimentos por dente com status: pendente, em andamento, concluído. Orçamento integrado ao plano; aprovação materializa <code>PatientTreatment</code> e pinta o odontograma da aba Prontuário.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">📊</span> Periograma</div>
      <p>Profundidade de sondagem, sangramento à sondagem, recessão gengival. Evolução ao longo das sessões para acompanhar resposta ao tratamento periodontal. <em>Ainda não implementado.</em></p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">📸</span> Fotografias Intraorais</div>
      <p>Imagens vinculadas ao dente/região. Comparativo antes × depois para apresentação ao paciente. Rastreio de evolução estética. <em>Roadmap (imagens de evolução = CLIN-051).</em></p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">🩻</span> Radiografias / DICOM</div>
      <p>Periapicais e panorâmicas com visualizador DICOM simplificado. Vinculadas ao dente específico e à data do atendimento. <em>Ainda não implementado.</em></p>
    </div>
  </div>

  <div class="table-wrap">
    <table>
      <thead><tr><th>API / UI</th><th>Detalhe</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>PatientToothAnnotation</code></td><td>Anotação clínica por dente (FDI); store-scoped; listagem sem paginação (odontograma precisa do conjunto)</td></tr>
        <tr><td class="td-bold"><code>acceptsFaces</code></td><td>Flag no tratamento do plano; se false e o item tiver faces → 422</td></tr>
        <tr><td class="td-bold">ERP <code>budgets/odontogram/</code></td><td>Componentes SVG + CSS; HOF só no orçamento; tratamentos usam <code>showHof={false}</code></td></tr>
      </tbody>
    </table>
  </div>

  <h2>5.8 Fisioterapia</h2>
  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Vertente fisioterapia — parcial (ago/2026)</div>
      <p>Mapa anatômico (corpogram) em Orçamentos e na aba Prontuário; sessões no orçamento (<code>budgetTreatmentSessions</code>); IMC na ficha; conselho CREFITO. Em <strong>Adicionar Procedimento</strong>, itens <code>locationUiType=none</code> não exibem o aviso “Este procedimento não exige seleção de região anatômica.”</p>
    </div>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Ainda no roadmap</div>
    <ul>
      <li><strong>Avaliação postural:</strong> marcação de pontos de dor (além das regiões atuais)</li>
      <li><strong>Goniometria e dinamometria:</strong> amplitude de movimento articular e força muscular</li>
      <li><strong>Escalas funcionais:</strong> Barthel, FIM, Berg Balance Scale, DASH, Oswestry</li>
      <li><strong>Fotos de postura</strong> antes/durante/depois</li>
      <li><strong>Sessões de pilates/RPG:</strong> registro de exercícios e progressão de cargas</li>
    </ul>
  </div>

  <h2>5.8 Psicologia</h2>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Módulo Psicologia</div>
    <ul>
      <li><strong>Sessão em texto livre</strong> com numeração sequencial e assinatura digital</li>
      <li><strong>Hipóteses diagnósticas</strong> por CID-10 e DSM-5</li>
      <li><strong>Instrumentos e escalas:</strong> PHQ-9 (depressão), GAD-7 (ansiedade), BDI (Beck), BAI, MMSE (cognitivo)</li>
      <li><strong>Anotações de processo:</strong> campo exclusivo do profissional, inacessível para qualquer outra persona — inclusive o admin</li>
      <li><strong>Término de terapia:</strong> relatório de encerramento e alta com avaliação de progresso</li>
    </ul>
  </div>
  <div class="alert alert-amber">
    <span class="alert-icon">🔒</span>
    <div class="alert-body">
      <div class="alert-title">Sigilo profissional absoluto — CRP</div>
      <p>As anotações de processo do psicólogo são protegidas pelo Código de Ética do CRP. O sistema implementa <strong>campo criptografado</strong> acessível exclusivamente pelo profissional autor, mesmo que o administrador da clínica tente acessar.</p>
    </div>
  </div>

  <h2>5.8 Nutrição</h2>
  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Vertente nutrição — implementado (ago/2026)</div>
      <p>Loja com <code>clinicStrand=nutricao</code>: pack de seed (4 especialidades, <code>locationUiType=none</code>, conselho CRN+UF). Na aba <strong>Prontuário</strong>, cada procedimento usa <strong>Inicializar</strong> (não Finalizar): sheet fullscreen Anamnese (modelo opcional + <code>rich_text</code>/<code>single_choice</code>) / Corporal / Plano de procedimento. O item permanece <code>active</code>; o toggle Mostrar finalizados lista os já inicializados. Card da evolução mostra o <strong>nome do procedimento</strong>.</p>
      <p><strong>Corporal:</strong> IMC no sheet (sem <code>body-metrics</code>); adipometria Petróski 1995 + Siri (≥2 medidas por dobra obrigatória; mediana no FE); bloco único <strong>Distribuição de gordura</strong> (barras das medianas + pizza magra/gorda em %, legenda à direita na cor da clínica). Perimetria, celulite, estrias, diástase, aparência. Comparar atendimentos: delta <strong>+</strong> azul / <strong>−</strong> amarelo. Notas do atendimento (HTML + 1 anexo; sem exclusão). PDF do atendimento e PDF da anamnese da ficha convertem HTML TipTap em texto (<code>htmlToPlainText</code>).</p>
    </div>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Ainda no roadmap</div>
    <ul>
      <li><strong>Recordatório alimentar 24h</strong> e frequência alimentar semanal</li>
      <li><strong>Plano alimentar</strong> com cálculo de macros e micros por refeição</li>
      <li><strong>Prescrição de suplementação</strong> vinculada à ficha</li>
      <li><strong>Gráfico de metas</strong> de peso/medidas ao longo das consultas (hoje: Comparar dois atendimentos)</li>
    </ul>
  </div>

  <h2>5.8 Medicina do Trabalho</h2>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Módulo Medicina do Trabalho</div>
    <ul>
      <li><strong>ASO (Atestado de Saúde Ocupacional):</strong> admissional, periódico, demissional, retorno ao trabalho, mudança de função</li>
      <li><strong>PCMSO:</strong> Programa de Controle Médico de Saúde Ocupacional — por empresa contratante</li>
      <li><strong>Cadastro de empresas contratantes</strong> com CNPJ, CNAE e riscos ocupacionais</li>
      <li><strong>Exames complementares obrigatórios</strong> por cargo/risco (vinculados ao PCMSO)</li>
      <li><strong>Emissão de ASO em lote</strong> para grupos de funcionários da mesma empresa</li>
      <li><strong>Relatório de absenteísmo</strong> e CAT (Comunicação de Acidente do Trabalho)</li>
    </ul>
  </div>

  <h2>Clínica de Estética</h2>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Módulo Estética</div>
    <ul>
      <li><strong>Ficha de avaliação estética:</strong> objetivos do paciente, histórico de procedimentos anteriores, contraindicações</li>
      <li><strong>Fotos antes/depois</strong> vinculadas ao procedimento e à sessão — com consentimento de imagem LGPD</li>
      <li><strong>Plano de tratamento estético</strong> com sequência de sessões, intervalos e evolução esperada</li>
      <li><strong>Protocolo por procedimento:</strong> laser, toxina botulínica, preenchimento, limpeza de pele</li>
      <li><strong>Produtos utilizados</strong> com lote e validade vinculados ao prontuário (rastreabilidade ANVISA)</li>
    </ul>
  </div>

  <h2>Entidades de dados — especialidades</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Entidade</th><th>Especialidade</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>ProcedurePlan</code></td><td>Odontologia</td><td>Plano de tratamento: procedimentos por dente com status e orçamento</td></tr>
        <tr><td class="td-bold"><code>PatientToothAnnotation</code></td><td>Odontologia</td><td>Anotação por dente (FDI) — implementado jul/2026</td></tr>
        <tr><td class="td-bold"><code>DentalChart</code></td><td>Odontologia</td><td>Estado de cada face dental por dente do paciente (roadmap)</td></tr>
        <tr><td class="td-bold"><code>PerioChart</code></td><td>Odontologia</td><td>Periograma: sondagem, sangramento, recessão por dente</td></tr>
        <tr><td class="td-bold"><code>PhysioAssessment</code></td><td>Fisioterapia</td><td>Body chart, goniometria, escalas funcionais, objetivos</td></tr>
        <tr><td class="td-bold"><code>NutriAssessment</code></td><td>Nutrição</td><td>Antropometria, recordatório, plano alimentar, metas</td></tr>
        <tr><td class="td-bold"><code>OccHealthRecord</code></td><td>Med. Trabalho</td><td>ASO, empresa contratante, exames obrigatórios</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
