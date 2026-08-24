WIKI.register({
  id: 'payment-api',
  title: 'Payment API',
  icon: '💳',
  searchText: 'payment-api pagamentos PSP stone stripe mercadopago split settlement reconciliation cobrança charge webhook audit módulos jobs NestJS Prisma RabbitMQ estorno repasse',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Serviços</div>
  <h1 class="section-title">💳 Payment API</h1>
  <p class="section-subtitle">Serviço responsável por todo o processamento financeiro da plataforma Citybox: cobranças multi-PSP, divisão de valores (split), repasse para lojistas (settlement), estornos e conciliação de recebíveis. Roda na porta <strong>:3106</strong> com NestJS + Prisma (schema próprio) + RabbitMQ.</p>
  <div class="section-tags">
    <span class="tag-teal">NestJS</span>
    <span class="tag-blue">Prisma</span>
    <span class="tag-amber">RabbitMQ</span>
    <span class="tag-gray">:3106</span>
    <span class="tag-green">Multi-PSP</span>
  </div>
</div>

<div class="alert alert-teal">
  <div class="alert-icon">💡</div>
  <div class="alert-body">
    <div class="alert-title">Schema Prisma próprio</div>
    <p>O payment-api mantém seu schema em <code>services/payment-api/prisma/</code> — separado do schema platform e do schema tenant. As migrations são gerenciadas de forma independente, garantindo que alterações no modelo financeiro não afetem o restante da plataforma.</p>
  </div>
</div>

<h2>Fluxo de pagamento</h2>
<div class="mermaid-wrap">
  <div class="mermaid">
sequenceDiagram
  participant MA as marketplace-api
  participant PA as payment-api
  participant PSP as PSP (Stone/Stripe/MP)
  participant RMQ as RabbitMQ
  participant W as workers

  MA->>PA: POST /payments (checkout)
  PA->>PA: Valida split + idempotência
  PA->>PSP: Cria charge (adapter)
  PSP-->>PA: charge_id + status
  PA->>PA: Salva payment + entries + audit
  PSP->>PA: Webhook (captured/failed)
  PA->>PA: Atualiza status + settlement schedule
  PA->>RMQ: payment.captured / payment.failed
  RMQ->>W: Projeta read models
  </div>
  <div class="mermaid-caption">Fluxo completo de pagamento — do checkout ao repasse</div>
</div>

<h2>Módulos (19 módulos em src/modules/)</h2>
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Módulo</th>
        <th>Responsabilidade</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="td-bold"><code>auth/</code></td>
        <td>Autenticação JWT entre serviços internos — valida tokens de serviço do marketplace-api</td>
      </tr>
      <tr>
        <td class="td-bold"><code>charges/</code></td>
        <td>Cobranças: criar, capturar, cancelar — camada de orquestração sobre o adaptador PSP</td>
      </tr>
      <tr>
        <td class="td-bold"><code>customers/</code></td>
        <td>Dados de pagadores e métodos de pagamento salvos (cartões tokenizados, PIX keys)</td>
      </tr>
      <tr>
        <td class="td-bold"><code>merchants/</code></td>
        <td>Estabelecimentos (lojistas) e suas configurações de recebimento junto aos PSPs</td>
      </tr>
      <tr>
        <td class="td-bold"><code>payments/</code></td>
        <td>Orquestra charge + split + audit em uma única transação atômica</td>
      </tr>
      <tr>
        <td class="td-bold"><code>payment-entries/</code></td>
        <td>Lançamentos contábeis de cada transação — débitos, créditos, taxas e repasses</td>
      </tr>
      <tr>
        <td class="td-bold"><code>provider-accounts/</code></td>
        <td>Contas dos lojistas nos PSPs (Stone sub-merchant, Stripe Connect account)</td>
      </tr>
      <tr>
        <td class="td-bold"><code>providers/</code></td>
        <td>Adaptadores de PSP (multi-PSP: Stone, Stripe, MercadoPago) — interface unificada</td>
      </tr>
      <tr>
        <td class="td-bold"><code>splits/</code></td>
        <td>Divisão de valores: plataforma (taxa Citybox) + lojista (repasse) + impostos</td>
      </tr>
      <tr>
        <td class="td-bold"><code>settlements/</code></td>
        <td>Liquidação e agendamento de repasse para lojistas — integra com calendário financeiro</td>
      </tr>
      <tr>
        <td class="td-bold"><code>reconciliation/</code></td>
        <td>Conciliação de recebíveis vs. registros locais — detecta divergências entre PSP e banco de dados</td>
      </tr>
      <tr>
        <td class="td-bold"><code>transfers/</code></td>
        <td>Transferências entre contas (plataforma ↔ lojista) — TED/PIX para conta bancária do lojista</td>
      </tr>
      <tr>
        <td class="td-bold"><code>subscriptions/</code></td>
        <td>Pagamentos recorrentes e assinaturas — cobrança periódica com retry automático</td>
      </tr>
      <tr>
        <td class="td-bold"><code>tap-intents/</code></td>
        <td>Pagamentos NFC/Tap-to-pay (Tap on Phone) — intenções de pagamento por aproximação</td>
      </tr>
      <tr>
        <td class="td-bold"><code>tenants/</code></td>
        <td>Configuração multi-tenant (por município) — parâmetros de gateway por cidade/organização</td>
      </tr>
      <tr>
        <td class="td-bold"><code>webhooks/</code></td>
        <td>Recepção e processamento de webhooks de PSPs — valida assinatura, processa eventos</td>
      </tr>
      <tr>
        <td class="td-bold"><code>messaging/</code></td>
        <td>Integração RabbitMQ — publica eventos de pagamento para workers e outros consumidores</td>
      </tr>
      <tr>
        <td class="td-bold"><code>audit/</code></td>
        <td>Trilha de auditoria de todas as operações financeiras — imutável, com timestamp e ator</td>
      </tr>
      <tr>
        <td class="td-bold"><code>health/</code></td>
        <td>Health check — expõe endpoint de status para load balancer e monitoramento</td>
      </tr>
    </tbody>
  </table>
</div>

<h2>Jobs agendados (src/jobs/)</h2>
<div class="card card-amber">
  <div class="card-title"><span class="card-icon">⏰</span> daily-settlement.job.ts</div>
  <p>Job diário que processa o settlement de todos os pagamentos capturados no dia anterior. Calcula o valor líquido (após taxas), agenda TED/PIX para a conta bancária do lojista e registra os lançamentos contábeis correspondentes. Executado pelo scheduler interno do NestJS.</p>
</div>

<h2>Eventos publicados no RabbitMQ</h2>
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Evento</th>
        <th>Quando é publicado</th>
        <th>Consumidores</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="td-bold"><code>payment.captured</code></td>
        <td>Cobrança confirmada com sucesso pelo PSP</td>
        <td>workers (atualiza read model de pedido, notifica lojista)</td>
      </tr>
      <tr>
        <td class="td-bold"><code>payment.failed</code></td>
        <td>Falha na cobrança — cartão recusado, saldo insuficiente, timeout</td>
        <td>workers (marca pedido como falho, dispara retry se configurado)</td>
      </tr>
      <tr>
        <td class="td-bold"><code>payment.settled</code></td>
        <td>Repasse para lojista realizado com sucesso</td>
        <td>workers (atualiza saldo projetado do lojista)</td>
      </tr>
      <tr>
        <td class="td-bold"><code>payment.refunded</code></td>
        <td>Estorno processado pelo PSP</td>
        <td>workers (atualiza pedido, notifica consumidor e lojista)</td>
      </tr>
    </tbody>
  </table>
</div>

<h2>PSPs suportados</h2>
<div class="card-grid">
  <div class="card card-teal">
    <div class="card-title"><span class="card-icon">🪨</span> Stone</div>
    <p>Gateway principal para cartão de crédito/débito. Suporta Stone Sub-merchant para split automático. Webhooks via HTTPS com assinatura HMAC.</p>
  </div>
  <div class="card card-blue">
    <div class="card-title"><span class="card-icon">💜</span> Stripe</div>
    <p>Gateway secundário com Stripe Connect para marketplaces. Suporta cartão internacional, Apple Pay, Google Pay. Webhooks com verificação de assinatura Stripe-Signature.</p>
  </div>
  <div class="card card-amber">
    <div class="card-title"><span class="card-icon">🔵</span> MercadoPago</div>
    <p>Integração com MercadoPago para PIX, boleto e cartão. Amplamente utilizado no mercado brasileiro. Notificações via IPN (Instant Payment Notification).</p>
  </div>
</div>

<h2>Localização no repositório</h2>
<div class="card card-teal">
  <div class="card-title"><span class="card-icon">📁</span> Estrutura de arquivos</div>
  <div class="table-wrap" style="margin-top:12px">
    <table>
      <thead><tr><th>Caminho</th><th>Conteúdo</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>services/payment-api/src/modules/</code></td><td>19 módulos NestJS — ver tabela acima</td></tr>
        <tr><td class="td-bold"><code>services/payment-api/src/jobs/</code></td><td>Jobs agendados (daily-settlement)</td></tr>
        <tr><td class="td-bold"><code>services/payment-api/prisma/</code></td><td>Schema Prisma próprio + migrations</td></tr>
        <tr><td class="td-bold"><code>services/payment-api/src/common/</code></td><td>Guards, decorators e utilitários internos</td></tr>
        <tr><td class="td-bold"><code>services/payment-api/src/contracts/</code></td><td>DTOs e interfaces de contrato com o marketplace-api</td></tr>
        <tr><td class="td-bold"><code>services/payment-api/test/</code></td><td>Testes de integração por módulo (Postgres real)</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
