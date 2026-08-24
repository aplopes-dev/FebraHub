WIKI.register({
  id: 'glossario',
  title: 'Glossário',
  icon: '📖',
  searchText: 'glossário termos definições health score churn MRR ARR NRR dunning impersonation settlement feature flag SLA cohort dunning webhook billing operador citybox Keycloak SSO',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Introdução</div>
  <h1 class="section-title">📖 Glossário</h1>
  <p class="section-subtitle">Termos e conceitos do Admin Citybox — incluindo os novos termos do domínio de billing, saúde do cliente e plataforma SaaS.</p>
  <div class="section-tags">
    <span class="tag-teal">Referência</span>
    <span class="tag-gray">Alinhamento de linguagem</span>
  </div>
</div>

<h2>Domínio de negócio</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Termo</th><th>Significado</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">Cliente</td><td>Conta comercial PF/PJ contratante da plataforma. Agrupa uma ou mais lojas e está vinculado a um plano SaaS.</td></tr>
      <tr><td class="td-bold">Loja</td><td>Unidade operacional do cliente numa vertical específica (Food, Varejo…). Tem equipe, configurações e integrações próprias.</td></tr>
      <tr><td class="td-bold">Vertical</td><td>Segmento de negócio da loja: Food, Varejo, Saúde, Educação ou Serviços. Define módulos disponíveis.</td></tr>
      <tr><td class="td-bold">Membro da loja</td><td>Funcionário do lojista criado pelo Admin no Keycloak. Acessa o ERP/backoffice da loja.</td></tr>
      <tr><td class="td-bold">Usuário Citybox</td><td>Operador interno que acessa o Admin. Roles: <code>platform_admin</code>, <code>platform_operator</code>.</td></tr>
      <tr><td class="td-bold">Slug</td><td>Identificador URL-friendly único da loja (ex.: <code>pizza-do-centro</code>).</td></tr>
      <tr><td class="td-bold">Implantação</td><td>Status inicial da loja após criação — ainda sendo configurada antes de ir a público.</td></tr>
      <tr><td class="td-bold">Módulo</td><td>Feature ativável por loja (KDS, Totem, PDV Mobile, iFood, Stone…).</td></tr>
    </tbody>
  </table>
</div>

<h2>Billing e Financeiro</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Termo</th><th>Significado</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">MRR</td><td>Monthly Recurring Revenue — receita recorrente mensal total de todos os clientes ativos.</td></tr>
      <tr><td class="td-bold">ARR</td><td>Annual Recurring Revenue — MRR × 12. Métrica de referência para SaaS.</td></tr>
      <tr><td class="td-bold">NRR</td><td>Net Revenue Retention — percentual da receita retida após expansões, contrações e cancelamentos. NRR &gt; 100% indica crescimento sem novos clientes.</td></tr>
      <tr><td class="td-bold">Plano SaaS</td><td>Pacote contratado (Starter/Pro/Enterprise) com quotas e preço definidos. Ainda string livre no MVP — tabela real planejada.</td></tr>
      <tr><td class="td-bold">Assinatura</td><td>Vínculo entre um cliente e um plano com datas de vigência e ciclo de cobrança (mensal/anual).</td></tr>
      <tr><td class="td-bold">Fatura</td><td>Cobrança gerada automaticamente por ciclo. Contém valor, vencimento, método e status de pagamento.</td></tr>
      <tr><td class="td-bold">Settlement / Repasse</td><td>Transferência dos valores de vendas das lojas para as contas dos lojistas após dedução de taxas e comissões.</td></tr>
      <tr><td class="td-bold">Dunning</td><td>Régua automática de cobrança por inadimplência — sequência de e-mails e tentativas de cobrança antes de suspender o acesso.</td></tr>
      <tr><td class="td-bold">Ciclo de cobrança</td><td>Frequência de faturamento: mensal (todo mês no dia de vencimento) ou anual.</td></tr>
    </tbody>
  </table>
</div>

<h2>Saúde do cliente e risco</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Termo</th><th>Significado</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">Health Score</td><td>Score 0–100 por cliente calculado a partir de sinais de engajamento, billing, suporte e atividade das lojas. Verde &gt; 70, Amarelo 40–70, Vermelho &lt; 40.</td></tr>
      <tr><td class="td-bold">Churn</td><td>Cancelamento do contrato por um cliente. Churn rate = % de clientes perdidos em um período.</td></tr>
      <tr><td class="td-bold">Risco de churn</td><td>Probabilidade de um cliente cancelar nos próximos 30–90 dias, baseada no health score e sinais de alerta.</td></tr>
      <tr><td class="td-bold">Engajamento</td><td>Frequência e profundidade de uso do produto (pedidos/dia, usuários ativos, módulos usados). Sinal positivo no health score.</td></tr>
      <tr><td class="td-bold">At-risk</td><td>Cliente com health score &lt; 40 ou com sinais de alerta ativados (inadimplência, lojas inativas).</td></tr>
    </tbody>
  </table>
</div>

<h2>Plataforma e Tech</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Termo</th><th>Significado</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">Impersonation</td><td>Capacidade do operador de "acessar como" um lojista para depurar ou suportar sem conhecer a senha do usuário. Deve ser auditada.</td></tr>
      <tr><td class="td-bold">Feature Flag</td><td>Chave booleana que ativa/desativa uma feature para um tenant específico (cliente ou loja) sem deploy de código.</td></tr>
      <tr><td class="td-bold">RBAC</td><td>Role-Based Access Control — controle de acesso por papel/role. No admin: papéis como <code>platform_admin</code>, <code>platform_operator</code>; no ERP: gerente, atendente, caixa.</td></tr>
      <tr><td class="td-bold">SSO</td><td>Single Sign-On via Keycloak — login único para acessar todos os apps da plataforma.</td></tr>
      <tr><td class="td-bold">SLA</td><td>Service Level Agreement — acordo de nível de serviço. Define tempo máximo de resposta/resolução para alertas críticos das lojas.</td></tr>
      <tr><td class="td-bold">Webhook</td><td>Chamada HTTP enviada por um serviço externo (Stripe, iFood, Stone) quando um evento ocorre. O admin precisa receber e processar webhooks de billing e integrações.</td></tr>
      <tr><td class="td-bold">Cohort</td><td>Grupo de clientes adquiridos no mesmo período. Cohort retention mostra qual percentual de cada grupo permanece ativo mês a mês.</td></tr>
      <tr><td class="td-bold">platform_admin</td><td>Role Keycloak de administrador pleno. Acessa tudo no Admin.</td></tr>
      <tr><td class="td-bold">platform_operator</td><td>Role Keycloak de operador. Hoje: provável 403 na API por bug no guard. Alvo: acesso operacional sem billing/configs sensíveis.</td></tr>
      <tr><td class="td-bold">Senha provisória</td><td>Senha temporária criada pelo Admin para membro de loja. Deve ser trocada no primeiro login.</td></tr>
      <tr><td class="td-bold">SEFAZ homologação</td><td>Flag que habilita emissão de documentos fiscais em ambiente de testes SEFAZ (NFC-e, NF-e).</td></tr>
    </tbody>
  </table>
</div>
`
});
