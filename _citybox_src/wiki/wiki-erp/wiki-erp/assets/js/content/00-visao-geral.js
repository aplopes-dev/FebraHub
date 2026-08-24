WIKI.register({
  id: 'visao-geral',
  title: 'Visão Geral do ERP Base',
  icon: '🏪',
  searchText: 'visao geral erp base maturidade shell multi-vertical citybox lojista',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Introdução</div>
    <h1 class="section-title">🏪 Visão Geral do ERP Base</h1>
    <p class="section-subtitle">O ERP Citybox é o painel operacional do lojista — um shell multi-vertical que concentra gestão de catálogo, pedidos, equipe, financeiro e fiscal, adaptável a 12 segmentos de negócio.</p>
    <div class="section-tags">
      <span class="tag-orange">ERP Base</span>
      <span class="tag-amber">Next.js 16</span>
      <span class="tag-green">Shell Funcional</span>
      <span class="tag-gray">Food: ~20 telas · Varejo: estrutura base</span>
    </div>
  </div>

  <div class="alert alert-amber">
    <span class="alert-icon">⚡</span>
    <div class="alert-body">
      <div class="alert-title">Blueprint: Hoje (MVP) → Proposta (Alvo)</div>
      <p>Este wiki descreve o estado atual do código e a visão completa do produto alvo. Blocos "Hoje" mostram o que existe; blocos "Proposta" definem o que será desenvolvido.</p>
    </div>
  </div>

  <div class="eco-callout">
    <div class="eco-icon">🧭</div>
    <div class="eco-body">
      <div class="eco-title">Ecossistema Citybox — você está no ERP Base (operação do lojista)</div>
      <div class="eco-links">
        O ERP é onde o lojista opera o dia a dia. As verticais estendem esta base:
        <a href="../wiki-erp-food/index.html">Food</a> ·
        <a href="../wiki-erp-market/index.html">Market</a>.
        A plataforma é governada no <a href="../../wiki-admin/index.html">Admin</a>
        e o consumidor compra pelo <a href="../../wiki-marketplace/index.html">Marketplace</a>.
        <br><strong>Princípio:</strong> Admin governa · ERP opera · Marketplace vende · <em>Base + Delta = ERP completo</em>.
      </div>
    </div>
  </div>

  <h2>O que é o ERP Base?</h2>
  <p>O <strong>ERP Base</strong> (<code>apps/erp</code>) é um shell Next.js 16 (App Router) com React 19 e Tailwind CSS que serve como aplicação hospedeira para todas as verticais do Citybox. Roda na porta <code>3107</code> e usa o design system <code>@citybox/ui</code>.</p>
  <p>O shell fornece autenticação (Keycloak PKCE via BFF), seleção/troca de loja, layout dual-sidebar e proxies BFF que direcionam chamadas ao <code>marketplace-api</code> (domínio transacional) e ao <code>vertical-api</code> específico de cada segmento.</p>

  <h2>Tabela de Maturidade</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Módulo</th><th>Estado Atual</th><th>Meta v1</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Shell / Auth / Layout</td><td><span class="status-badge status-functional">✅ Funcional</span></td><td>Melhorias UX, shortcuts</td></tr>
        <tr><td class="td-bold">Seleção / troca de loja</td><td><span class="status-badge status-functional">✅ Funcional</span></td><td>Multi-loja, permissões cruzadas</td></tr>
        <tr><td class="td-bold">Dashboard operacional</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>KPIs por vertical + alertas realtime</td></tr>
        <tr><td class="td-bold">Configurações da loja</td><td><span class="status-badge status-partial">🔶 Parcial</span> (Food)</td><td>Horários, branding, canais, fiscal</td></tr>
        <tr><td class="td-bold">Catálogo</td><td><span class="status-badge status-mock">⚠ Mock</span></td><td>CRUD completo + variantes por tipo</td></tr>
        <tr><td class="td-bold">Pedidos / OS</td><td><span class="status-badge status-mock">⚠ Mock</span></td><td>Kanban realtime + filtros por vertical</td></tr>
        <tr><td class="td-bold">Agenda / Slots</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>Agendamento para verticais de serviço</td></tr>
        <tr><td class="td-bold">Clientes / CRM</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>Ficha, histórico, fidelidade básica</td></tr>
        <tr><td class="td-bold">PDV / Caixa</td><td><span class="status-badge status-mock">⚠ Mock</span></td><td>Offline-first + fechamento</td></tr>
        <tr><td class="td-bold">Estoque</td><td><span class="status-badge status-mock">⚠ Mock</span></td><td>Posição + alertas + inventário</td></tr>
        <tr><td class="td-bold">Financeiro / Caixa</td><td><span class="status-badge status-mock">⚠ Mock</span></td><td>DRE simplificado + conciliação</td></tr>
        <tr><td class="td-bold">Fiscal (NF-e/NFC-e)</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>PlugNotas integrado</td></tr>
        <tr><td class="td-bold">Entrega / Frete</td><td><span class="status-badge status-mock">⚠ Mock</span></td><td>Zonas + regras dinâmicas</td></tr>
        <tr><td class="td-bold">Notificações / WhatsApp</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>WhatsApp transacional + campanhas</td></tr>
        <tr><td class="td-bold">Relatórios / Analytics</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>Vendas, estoque, equipe, financeiro</td></tr>
        <tr><td class="td-bold">RBAC / Equipe</td><td><span class="status-badge status-functional">✅ Funcional</span> (Food)</td><td>Templates por vertical + UI de permissões</td></tr>
        <tr><td class="td-bold">Devices / KDS / Impressoras</td><td><span class="status-badge status-proposed">💡 Proposta</span></td><td>WebUSB + pairing por QR</td></tr>
        <tr><td class="td-bold">Marketplace Publish</td><td><span class="status-badge status-partial">🔶 Parcial</span></td><td>Sync automático Typesense</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Os dois eixos de negócio da plataforma</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">📦</span> Eixo Produto / Pedido</div>
      <p>Verticais: <strong>Food, Market/Varejo, Events</strong>. Fluxo central: cliente faz pedido → loja produz/separa → entrega/retirada → fiscal. KPIs: GMV, volume de pedidos, ticket médio.</p>
    </div>
    <div class="card card-purple">
      <div class="card-title"><span class="card-icon">📅</span> Eixo Serviço / Agenda</div>
      <p>Verticais: <strong>Beauty, Clinic, Services, Hospitality, Rental, Education</strong>. Fluxo central: cliente agenda → profissional/recurso atende → fechamento → fidelidade. KPIs: ocupação, no-show, receita por profissional.</p>
    </div>
  </div>

  <h2>Verticais registradas</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">🍔</span> Food &amp; Bebidas</div>
      <p>Restaurantes, lanchonetes, dark kitchens. KDS, comandas, mesas, cardápio com modificadores, delivery.</p>
      <span class="status-badge status-functional">API Funcional</span>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🛒</span> Varejo / Market</div>
      <p>Supermercados, mercearias, minimercados. PDV alto desempenho, frente de caixa, promoções. ERP shell implementado com estrutura de navegação e páginas placeholder; módulos reais em desenvolvimento.</p>
      <span class="status-badge status-partial">🔧 Shell + navegação</span>
    </div>
    <div class="card card-purple">
      <div class="card-title"><span class="card-icon">💇</span> Beauty / Estética</div>
      <p>Salões, barbearias, spas. Agendamento de horários, prontuário, fidelidade.</p>
      <span class="status-badge status-proposed">💡 Em planejamento</span>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🏥</span> Clínica / Saúde</div>
      <p>Consultórios, clínicas médicas/odontológicas. Prontuário eletrônico, convênios, agenda.</p>
      <span class="status-badge status-proposed">💡 Em planejamento</span>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🔧</span> Serviços</div>
      <p>Oficinas, dedetizadoras, manutenção. OS, agendamento técnico, orçamentos.</p>
      <span class="status-badge status-proposed">💡 Em planejamento</span>
    </div>
    <div class="card card-indigo">
      <div class="card-title"><span class="card-icon">⚖️</span> Legal / Jurídico</div>
      <p>Escritórios de advocacia. Processos, honorários, agenda de audiências.</p>
      <span class="status-badge status-proposed">💡 Em planejamento</span>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🏡</span> Realty / Imobiliário</div>
      <p>Imobiliárias. Imóveis, locações, vendas, comissões.</p>
      <span class="status-badge status-proposed">💡 Em planejamento</span>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🏨</span> Hospitality / Hotelaria</div>
      <p>Hotéis, pousadas, hostels. Reservas, check-in/out, governança.</p>
      <span class="status-badge status-proposed">💡 Em planejamento</span>
    </div>
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">📚</span> Education / Educação</div>
      <p>Cursos, escolas, treinamentos. Matrículas, turmas, notas, financeiro.</p>
      <span class="status-badge status-proposed">💡 Em planejamento</span>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">🔄</span> Subscriptions / Assinaturas</div>
      <p>Planos recorrentes, boxes, clubes. Ciclos, churn, upgrades.</p>
      <span class="status-badge status-proposed">💡 Em planejamento</span>
    </div>
    <div class="card card-purple">
      <div class="card-title"><span class="card-icon">🎪</span> Events / Eventos</div>
      <p>Casas de show, espaços de eventos. Ingressos, capacidade, check-in.</p>
      <span class="status-badge status-proposed">💡 Em planejamento</span>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🚗</span> Rental / Locação</div>
      <p>Aluguel de veículos, equipamentos. Disponibilidade, vistoria, contratos.</p>
      <span class="status-badge status-proposed">💡 Em planejamento</span>
    </div>
  </div>

  <h2>Stack tecnológica do ERP Base</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Camada</th><th>Tecnologia</th><th>Função</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Frontend Shell</td><td><code>Next.js 16</code> + React 19</td><td>App Router, SSR, rotas dinâmicas por vertical</td></tr>
        <tr><td class="td-bold">Design System</td><td><code>@citybox/ui</code></td><td>Componentes, temas, dual sidebar</td></tr>
        <tr><td class="td-bold">Estilo</td><td>Tailwind CSS 4</td><td>Utility-first, tema warm/amber</td></tr>
        <tr><td class="td-bold">Auth</td><td>Keycloak + BFF cookies</td><td>PKCE, refresh silent, SSO</td></tr>
        <tr><td class="td-bold">API Transacional</td><td><code>marketplace-api</code> :3101</td><td>Catálogo, pedidos, estoque, pagamentos</td></tr>
        <tr><td class="td-bold">API Vertical</td><td><code>vertical-api</code> ex. food :3171</td><td>Settings, RBAC, equipe por segmento</td></tr>
        <tr><td class="td-bold">Realtime</td><td>WebSocket + RabbitMQ</td><td>Push de pedidos, KDS, estoque</td></tr>
        <tr><td class="td-bold">Busca</td><td>Typesense</td><td>Catálogo público + pesquisa interna</td></tr>
        <tr><td class="td-bold">Fiscal</td><td>PlugNotas (proposto)</td><td>NF-e, NFC-e, NFS-e</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
