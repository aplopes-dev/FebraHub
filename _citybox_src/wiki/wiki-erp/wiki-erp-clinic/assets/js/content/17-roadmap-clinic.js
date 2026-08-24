WIKI.register({
  id: 'roadmap-clinic',
  title: 'Roadmap de Implementação',
  icon: '🗺️',
  searchText: 'roadmap implementacao fase 1 core operacional MVP 3 meses fase 2 operacional completo 6 meses fase 3 avancado diferencial telemedicina RNDS ICP-Brasil IA lista espera inteligente app nativo iOS Android prioridade RICE impacto esforco confianca alcance',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Evolução</div>
    <h1 class="section-title">🗺️ Roadmap de Implementação</h1>
    <p class="section-subtitle">Fases de implementação priorizando o core operacional antes de funcionalidades avançadas. A prioridade é ter uma clínica real funcionando com o MVP antes de expandir para módulos complexos como TISS e telemedicina.</p>
    <div class="section-tags">
      <span class="tag-cyan">Fase 1 · MVP</span>
      <span class="tag-teal">Fase 2 · Completo</span>
      <span class="tag-sky">Fase 3 · Avançado</span>
    </div>
  </div>

  <h2>Progresso atual — entregas jun–jul/2026</h2>
  <div class="blueprint-today">
    <div class="blueprint-today-label">✅ Já entregue nesta branch</div>
    <div class="table-wrap" style="margin:0">
      <table>
        <thead><tr><th>Entrega</th><th>Commits / PR</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td class="td-bold">Módulo ERP <code>/clinic</code> + Configurações (UI)</td><td>PR #8 · <code>feat/clinic/create-screen-config</code></td><td><span class="status-badge status-functional">✅</span></td></tr>
          <tr><td class="td-bold">clinica-api NestJS + Prisma schema <code>clinica</code></td><td><code>18f0d3a</code></td><td><span class="status-badge status-functional">✅</span></td></tr>
          <tr><td class="td-bold">Proxy BFF <code>/api/proxy/clinica</code> + <code>clinicaFetch</code></td><td><code>8d43291</code></td><td><span class="status-badge status-functional">✅</span></td></tr>
          <tr><td class="td-bold">Perfil da clínica + logo MinIO (API + ERP)</td><td><code>8d43291</code>, <code>1c7dba2</code></td><td><span class="status-badge status-functional">✅</span></td></tr>
          <tr><td class="td-bold">Planos de tratamento CRUD (API + ERP)</td><td><code>36a9d1a</code></td><td><span class="status-badge status-functional">✅</span></td></tr>
          <tr><td class="td-bold">Anamneses / Contratos / Equipe — API</td><td>PRs #12–#16</td><td><span class="status-badge status-functional">✅ API</span></td></tr>
          <tr><td class="td-bold">Pacientes — API + ERP integrado</td><td><code>feat/clinic/create-backend-patient</code></td><td><span class="status-badge status-functional">✅ API + ERP</span></td></tr>
          <tr><td class="td-bold">Categorias de paciente (API)</td><td>idem</td><td><span class="status-badge status-functional">✅ API + ERP</span></td></tr>
          <tr><td class="td-bold">CLIN-041 Fase 1 — Orçamentos + Tratamentos (API + ERP)</td><td>jul/2026</td><td><span class="status-badge status-functional">✅ Parcial</span> — incl. <code>PATCH …/finalize</code>; Fase 2: imagens evolução (CLIN-051)</td></tr>
          <tr><td class="td-bold">CLIN-060/061 — Financeiro da ficha + caixa + Transações (API + ERP)</td><td>jul–ago/2026</td><td><span class="status-badge status-functional">✅ Parcial</span> — ficha + fluxo de caixa + Transações (<code>by-payment-method</code>); Exportar PDF; cancel → <code>pending</code>; payments-api / caixa de recepção pendentes</td></tr>
          <tr><td class="td-bold">CLIN-062 — Comissões (API + ERP)</td><td>jul/2026</td><td><span class="status-badge status-functional">✅ Parcial</span> — Em aberto/Histórico/pagar + regras Equipe; motors receive/approve/finalize; migration <code>20260715165240_add_commissions</code> (operador); pendente Excel / split payments-api</td></tr>
          <tr><td class="td-bold">Marketing — Campanhas de captação + CRM</td><td>jul/2026</td><td><span class="status-badge status-functional">✅ API + web</span> — wizard, landing pública, views/submissões, duplicidade, oportunidade CRM, período/limite e QR PNG</td></tr>
          <tr><td class="td-bold">Marketing — Indicações</td><td>ago/2026</td><td><span class="status-badge status-functional">✅ API + web</span> — <code>/marketing/indicacoes</code>; KPIs + pacientes indicados + indicadores; <code>GET /v1/indicacoes/*</code>; modal por referrer; PDF pacientes; profissional externo no cadastro</td></tr>
          <tr><td class="td-bold">Anamnese preenchida (aba + rota pública BFF)</td><td>jul/2026</td><td><span class="status-badge status-functional">✅ API + ERP</span></td></tr>
          <tr><td class="td-bold">Pacientes — ficha multi-aba</td><td><code>feat/clinic/create-screen-patient</code></td><td><span class="status-badge status-functional">✅ Parcial</span> — Sobre/Orçamentos/Tratamentos/Anamnese/Documentos/Financeiro/Arquivos API</td></tr>
          <tr><td class="td-bold">Agenda, convênios, caixa da clínica</td><td>—</td><td><span class="status-badge status-proposed">💡 Blueprint</span></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <h2>Fase 1 — Core Operacional (MVP · até 3 meses)</h2>
  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Fase 1 — O que uma clínica precisa para abrir as portas</div>
    <div class="table-wrap" style="margin:0">
      <table>
        <thead><tr><th>Funcionalidade</th><th>Prioridade</th><th>Módulo</th></tr></thead>
        <tbody>
          <tr><td class="td-bold">Agenda: criação, edição, bloqueio, grade semanal</td><td><span class="tag-p1">P1</span></td><td>Agenda</td></tr>
          <tr><td class="td-bold">Cadastro de pacientes com convênio</td><td><span class="tag-green">✅ Entregue</span></td><td>PEP — API + ERP (jul/2026)</td></tr>
          <tr><td class="td-bold">Check-in e sala de espera com status realtime</td><td><span class="tag-p1">P1</span></td><td>Recepção</td></tr>
          <tr><td class="td-bold">Prontuário eletrônico: SOAP + CID-10 + assinatura digital</td><td><span class="tag-p1">P1</span></td><td>PEP</td></tr>
          <tr><td class="td-bold">Cobrança: dinheiro, PIX, cartão — payments-api</td><td><span class="tag-p1">P1</span></td><td>Financeiro</td></tr>
          <tr><td class="td-bold">NFS-e básica via fiscal-api</td><td><span class="tag-p1">P1</span></td><td>Financeiro</td></tr>
          <tr><td class="td-bold">Lembretes automáticos WhatsApp (D-2 e D0)</td><td><span class="tag-p1">P1</span></td><td>Agenda</td></tr>
          <tr><td class="td-bold">RBAC clínico CASL + cargos (aluno…vendedor)</td><td><span class="tag-green">✅ Entregue</span></td><td>Config / Equipe (ago/2026)</td></tr>
          <tr><td class="td-bold">Configurações: perfil da clínica + planos de tratamento</td><td><span class="tag-green">✅ Entregue</span></td><td>Config</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <h2>Fase 2 — Operacional Completo (3–6 meses)</h2>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Fase 2 — Diferencial clínico em relação a planilhas e sistemas básicos</div>
    <div class="table-wrap" style="margin:0">
      <table>
        <thead><tr><th>Funcionalidade</th><th>Prioridade</th><th>Módulo</th></tr></thead>
        <tbody>
          <tr><td class="td-bold">Prontuário avançado: prescrição digital, pedido de exames, documentos</td><td><span class="tag-p1">P1</span></td><td>PEP</td></tr>
          <tr><td class="td-bold">Odontograma interativo</td><td><span class="tag-p1">P1</span> · parcial jul/2026</td><td>Odonto — SVG orçamentos/tratamentos + anotações; periograma/DICOM pendente</td></tr>
          <tr><td class="td-bold">Módulos por especialidade: fisio, psicologia, nutrição</td><td><span class="tag-p2">P2</span></td><td>Especialidades</td></tr>
          <tr><td class="td-bold">Faturamento de convênios: guias, TISS, glosas</td><td><span class="tag-p1">P1</span></td><td>Convênios</td></tr>
          <tr><td class="td-bold">Estoque básico: entradas, saídas, alertas vencimento</td><td><span class="tag-p2">P2</span></td><td>Estoque</td></tr>
          <tr><td class="td-bold">Comissões e repasses para profissionais</td><td><span class="tag-p2">P2</span> · <span class="tag-cyan">CLIN-062</span></td><td>Financeiro — Em aberto/Histórico/pagamento + regras Equipe + motors debit/approve/finalize; pendente split payments-api / Excel</td></tr>
          <tr><td class="td-bold">Relatórios: produção, financeiro, absenteísmo</td><td><span class="tag-p2">P2</span></td><td>Relatórios</td></tr>
          <tr><td class="td-bold">App mobile do profissional (PWA primeiro)</td><td><span class="tag-p2">P2</span></td><td>13.5 · Mobile</td></tr>
          <tr><td class="td-bold">Agendamento online via marketplace CityBox</td><td><span class="tag-p1">P1</span></td><td>Portal</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <h2>Fase 3 — Avançado e Diferencial (6–12 meses)</h2>
  <div class="card-grid">
    <div class="card card-cyan">
      <div class="card-title"><span class="card-icon">🌐</span> Portal do Paciente Completo</div>
      <p>Histórico de consultas, documentos digitais, NPS, fidelidade, cartão de vacinação — tudo integrado ao app CityBox.</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🏭</span> Medicina do Trabalho</div>
      <p>ASO, PCMSO, gestão de empresas contratantes, lote de exames por empresa.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">📊</span> BI Avançado</div>
      <p>Dashboards customizáveis, exportação para Looker Studio / Power BI, dados anonimizados para a prefeitura.</p>
    </div>
    <div class="card card-sky">
      <div class="card-title"><span class="card-icon">🏥</span> RNDS</div>
      <p>Conexão à Rede Nacional de Dados em Saúde do Ministério da Saúde. Prontuário nacional integrado.</p>
    </div>
    <div class="card card-violet">
      <div class="card-title"><span class="card-icon">📹</span> Telemedicina</div>
      <p>Videoconsulta integrada ao prontuário. Registro automático da consulta online. Conforme CFM telemedicina.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🤖</span> IA e Otimização</div>
      <p>Lista de espera inteligente, predição de faltas, otimização de agenda por IA, prescrição por voz com IA generativa.</p>
    </div>
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">🔐</span> ICP-Brasil</div>
      <p>Certificado digital CFM/CRO para prescrições com validade jurídica plena — exigência para receituário digital qualificado.</p>
    </div>
    <div class="card card-gray">
      <div class="card-title"><span class="card-icon">📱</span> App Nativo iOS/Android</div>
      <p>App nativo do paciente (além do PWA). Swift (iOS) + Kotlin (Android). Só fala com o BFF.</p>
    </div>
  </div>

  <h2>Critérios de priorização</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Critério</th><th>Peso</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Sem isso, a clínica não opera</td><td><span class="tag-p1">BLOCKER</span></td><td>Agenda, prontuário, cobrança, NFS-e</td></tr>
        <tr><td class="td-bold">Regulatório / legal</td><td><span class="tag-p1">P1</span></td><td>LGPD, CFM, TISS — necessário para operar legalmente</td></tr>
        <tr><td class="td-bold">Diferencial vs. concorrente</td><td><span class="tag-p1">P1</span></td><td>Marketplace + SSO + Split — único no mercado</td></tr>
        <tr><td class="td-bold">Revenue impact direto</td><td><span class="tag-p2">P2</span></td><td>Convênios, comissões — aumentam faturamento capturado</td></tr>
        <tr><td class="td-bold">Melhoria de experiência</td><td><span class="tag-p2">P2</span></td><td>App mobile, BI, portal do paciente</td></tr>
        <tr><td class="td-bold">Expansão de mercado</td><td><span class="tag-p3">P3</span></td><td>Med. Trabalho, RNDS, telemedicina</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
