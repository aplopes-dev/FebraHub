WIKI.register({
  id: 'glossario',
  title: 'Glossário',
  icon: '📖',
  searchText: 'glossario termos definicoes ERP PDV KDS BFF RBAC tenant outbox Typesense vertical',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Introdução</div>
    <h1 class="section-title">📖 Glossário</h1>
    <p class="section-subtitle">Termos técnicos e de negócio usados ao longo deste wiki. Referência rápida para alinhar vocabulário entre produto, engenharia e stakeholders.</p>
    <div class="section-tags">
      <span class="tag-amber">Glossário</span>
      <span class="tag-gray">Termos Técnicos e de Negócio</span>
    </div>
  </div>

  <h2>Termos de Negócio</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Termo</th><th>Definição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">ERP</td><td>Enterprise Resource Planning — sistema integrado de gestão empresarial que centraliza catálogo, pedidos, estoque, financeiro e fiscal.</td></tr>
        <tr><td class="td-bold">PDV</td><td>Ponto de Venda — interface de frente de caixa para registro de vendas presenciais, abertura/fechamento de caixa.</td></tr>
        <tr><td class="td-bold">KDS</td><td>Kitchen Display System — monitor na cozinha/produção que exibe pedidos em tempo real, organizados por status e prioridade.</td></tr>
        <tr><td class="td-bold">Vertical</td><td>Segmento de negócio atendido pelo Citybox: Food, Market, Beauty, Clinic, Services, Legal, Realty, Hospitality, Education, Subscriptions, Events, Rental.</td></tr>
        <tr><td class="td-bold">Loja (Store)</td><td>Ponto de operação de um lojista — unidade mínima de gestão. Uma Organization pode ter várias lojas.</td></tr>
        <tr><td class="td-bold">Organization</td><td>Empresa / CNPJ do lojista — agrupa múltiplas lojas sob mesma gestão.</td></tr>
        <tr><td class="td-bold">Municipality</td><td>Cidade / prefeitura — escopo geográfico e de tenancy da plataforma Citybox.</td></tr>
        <tr><td class="td-bold">Repasse</td><td>Transferência da parte líquida do pagamento ao lojista após retenção de comissão e taxas.</td></tr>
        <tr><td class="td-bold">Split</td><td>Divisão automática do valor de pagamento entre múltiplos recebedores (loja + plataforma).</td></tr>
        <tr><td class="td-bold">Omnichannel</td><td>Operação unificada entre canais: delivery app, balcão, mesa, marketplace e e-commerce.</td></tr>
        <tr><td class="td-bold">Dark Kitchen</td><td>Cozinha que opera exclusivamente para delivery, sem atendimento presencial.</td></tr>
        <tr><td class="td-bold">Ticket Médio</td><td>Valor médio por pedido — indicador de performance do negócio.</td></tr>
        <tr><td class="td-bold">Churn</td><td>Taxa de cancelamento de clientes ou assinaturas em um período.</td></tr>
        <tr><td class="td-bold">Fidelidade / Loyalty</td><td>Programa de pontos ou cashback para reter e premiar clientes frequentes.</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Termos Técnicos — Frontend</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Termo</th><th>Definição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Shell</td><td>Aplicação hospedeira (<code>apps/erp</code>) que carrega módulos de cada vertical dentro de seu layout.</td></tr>
        <tr><td class="td-bold">BFF</td><td>Backend For Frontend — camada intermediária (Next.js API Routes) que agrega chamadas às APIs de domínio e gerencia cookies de auth.</td></tr>
        <tr><td class="td-bold">App Router</td><td>Sistema de roteamento do Next.js 13+ baseado em sistema de arquivos, com suporte a RSC (React Server Components).</td></tr>
        <tr><td class="td-bold">RSC</td><td>React Server Components — componentes renderizados no servidor, sem bundle JS no cliente.</td></tr>
        <tr><td class="td-bold">@citybox/ui</td><td>Design system interno — biblioteca de componentes React compartilhada entre todas as aplicações.</td></tr>
        <tr><td class="td-bold">Dual Sidebar</td><td>Layout com duas barras laterais: uma de navegação global (apps/verticais) e outra contextual (seções da vertical ativa).</td></tr>
        <tr><td class="td-bold">ErpPage</td><td>Componente wrapper do @citybox/ui que padroniza o layout de páginas de gestão (header, breadcrumb, ações).</td></tr>
        <tr><td class="td-bold">Store Context</td><td>Contexto React que mantém qual loja está ativa no ERP, injetado automaticamente nos headers do BFF.</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Termos Técnicos — Backend</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Termo</th><th>Definição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">marketplace-api</td><td>Serviço NestJS que contém o domínio transacional: catálogo, pedidos, estoque, pagamentos, frete.</td></tr>
        <tr><td class="td-bold">vertical-api</td><td>API específica de uma vertical (ex: food-api) com settings, RBAC e funcionalidades do segmento.</td></tr>
        <tr><td class="td-bold">Outbox Pattern</td><td>Técnica de consistência eventual: evento é persitido junto com a transação no banco; worker lê e publica no message broker.</td></tr>
        <tr><td class="td-bold">Tenant Schema</td><td>Schema PostgreSQL isolado por município (<code>tenant_{mun_slug}</code>) para isolamento de dados.</td></tr>
        <tr><td class="td-bold">Prisma</td><td>ORM TypeScript com dois clients: <code>platformPrisma</code> (schema plataforma) e <code>tenantPrisma(mun)</code> (schema tenant).</td></tr>
        <tr><td class="td-bold">RBAC</td><td>Role-Based Access Control — controle de acesso baseado em papéis. No Citybox: store-scoped (por loja + papel).</td></tr>
        <tr><td class="td-bold">Platform Sync</td><td>Processo que sincroniza usuários do Keycloak com a tabela <code>StoreUser</code> no schema tenant.</td></tr>
        <tr><td class="td-bold">Typesense</td><td>Motor de busca open-source hospedado, indexa o catálogo público para busca full-text rápida.</td></tr>
        <tr><td class="td-bold">PKCE</td><td>Proof Key for Code Exchange — extensão OAuth 2.0 para SPAs e aplicações sem client_secret.</td></tr>
        <tr><td class="td-bold">SSO</td><td>Single Sign-On — login único via Keycloak para acessar ERP, Admin e demais aplicações do ecossistema.</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Siglas fiscais</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Sigla</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">NF-e</td><td>Nota Fiscal Eletrônica — documento fiscal para venda de produtos (ICMS).</td></tr>
        <tr><td class="td-bold">NFC-e</td><td>Nota Fiscal de Consumidor Eletrônica — PDV, venda ao consumidor final.</td></tr>
        <tr><td class="td-bold">NFS-e</td><td>Nota Fiscal de Serviços Eletrônica — prestação de serviços (ISS municipal).</td></tr>
        <tr><td class="td-bold">DANFE</td><td>Documento Auxiliar da Nota Fiscal Eletrônica — representação impressa da NF-e.</td></tr>
        <tr><td class="td-bold">CFOP</td><td>Código Fiscal de Operações e Prestações — classifica a natureza das movimentações de mercadorias.</td></tr>
        <tr><td class="td-bold">NCM</td><td>Nomenclatura Comum do Mercosul — código de classificação fiscal de produtos.</td></tr>
        <tr><td class="td-bold">CNPJ</td><td>Cadastro Nacional de Pessoa Jurídica — identificador fiscal da empresa emitente.</td></tr>
        <tr><td class="td-bold">PlugNotas</td><td>Provedor SaaS para emissão, armazenamento e consulta de documentos fiscais eletrônicos (NF-e/NFC-e/NFS-e).</td></tr>
        <tr><td class="td-bold">SPED</td><td>Sistema Público de Escrituração Digital — conjunto de escriturações digitais para obrigações fiscais.</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Acrônimos de desenvolvimento</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Sigla</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">RICE</td><td>Reach, Impact, Confidence, Effort — framework de priorização de features.</td></tr>
        <tr><td class="td-bold">TDD</td><td>Test-Driven Development — escrever testes antes da implementação.</td></tr>
        <tr><td class="td-bold">DRE</td><td>Demonstrativo de Resultado do Exercício — relatório financeiro de receitas e despesas.</td></tr>
        <tr><td class="td-bold">PSP</td><td>Payment Service Provider — provedor de serviços de pagamento (ex: Stripe, PagSeguro, Cielo).</td></tr>
        <tr><td class="td-bold">OFX</td><td>Open Financial Exchange — formato padrão de extrato bancário para conciliação.</td></tr>
        <tr><td class="td-bold">OS</td><td>Ordem de Serviço — documento que registra um serviço a ser executado (vertical Serviços).</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
