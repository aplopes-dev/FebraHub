WIKI.register({
  id: 'planos',
  title: 'Planos SaaS',
  icon: '📦',
  searchText: 'planos SaaS Starter Pro Enterprise quotas preço ciclo mensal anual Stripe CRUD tabela assinar upgrade downgrade assinaturas',
  html: `
<div class="section-header">
  <div class="section-breadcrumb">Planos e Financeiro</div>
  <h1 class="section-title">📦 Planos SaaS</h1>
  <p class="section-subtitle">Catálogo de planos da plataforma — Starter, Pro e Enterprise. Evolução de string livre para tabela real integrada ao Stripe.</p>
  <div class="section-tags">
    <span class="status-badge status-mock">🔴 Mock — string livre hoje</span>
    <span class="status-badge status-proposed">🔵 Tabela real proposta</span>
    <span class="tag-p1">P1</span>
  </div>
</div>

<div class="blueprint-today">
  <div class="blueprint-today-label">Hoje (MVP)</div>
  <ul>
    <li>Campo <code>clients.plan</code> é uma string livre (ex.: "Starter", "Pro") — sem tabela de planos</li>
    <li>UI de planos existe com layout de cards mas dados são hardcoded no frontend</li>
    <li>Sem CRUD, sem preços reais, sem quotas configuráveis</li>
    <li>Formulário de cliente tem dropdown de planos com opções fixas no código</li>
  </ul>
</div>

<div class="blueprint-proposed">
  <div class="blueprint-proposed-label">Proposta (alvo)</div>
  <ul>
    <li>Tabela <code>plans</code> no banco: id, name, slug, price, interval, currency, stripePriceId, features (JSON), quotas (JSON)</li>
    <li>CRUD de planos no Admin (criar, editar preço, ativar/desativar)</li>
    <li>Criação de assinatura ao vincular cliente ↔ plano</li>
    <li>Suporte a upgrade e downgrade com proration no Stripe</li>
    <li>Planos com ciclo mensal e anual (desconto no anual)</li>
  </ul>
</div>

<h2>Mockup — Catálogo de planos</h2>
<div class="mockup-container">
  <div class="mock-topbar">
    <span class="mock-logo">📦 Planos SaaS</span>
    <span style="margin-left:auto;display:flex;gap:6px;">
      <span class="mock-badge mock-badge-teal">Mensal</span>
      <span class="mock-badge mock-badge-gray">Anual</span>
      <span class="mock-badge mock-badge-gray">+ Novo plano</span>
    </span>
  </div>
  <div class="mock-body">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
      <div style="background:#fff;border:1px solid var(--border-color);border-radius:8px;padding:14px;">
        <div class="mock-label">Starter</div>
        <div style="font-size:22px;font-weight:800;color:var(--color-primary)">R$ 197<span style="font-size:12px;color:var(--text-muted)">/mês</span></div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:8px;">1 loja · 5 usuários · 1 vertical</div>
        <div style="margin-top:8px;"><span class="mock-badge mock-badge-green">Ativo</span></div>
      </div>
      <div style="background:#fff;border:2px solid var(--color-primary);border-radius:8px;padding:14px;">
        <div class="mock-label">Pro <span class="mock-badge mock-badge-purple">popular</span></div>
        <div style="font-size:22px;font-weight:800;color:var(--color-primary)">R$ 497<span style="font-size:12px;color:var(--text-muted)">/mês</span></div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:8px;">5 lojas · 20 usuários · 3 verticais</div>
        <div style="margin-top:8px;"><span class="mock-badge mock-badge-green">Ativo</span></div>
      </div>
      <div style="background:#fff;border:1px solid var(--border-color);border-radius:8px;padding:14px;">
        <div class="mock-label">Enterprise</div>
        <div style="font-size:22px;font-weight:800;color:var(--color-primary)">Sob consulta</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:8px;">Ilimitado · todas as verticais</div>
        <div style="margin-top:8px;"><span class="mock-badge mock-badge-green">Ativo</span></div>
      </div>
    </div>
  </div>
</div>
<p class="mermaid-caption">Wireframe ilustrativo do catálogo de planos (proposta): CRUD real com toggle mensal/anual, integrado ao Stripe via <code>stripePriceId</code>.</p>

<h2>Catálogo de planos proposto</h2>
<div class="table-wrap">
  <table>
    <thead><tr><th>Plano</th><th>Lojas máx.</th><th>Usuários/loja</th><th>Verticais</th><th>Preço mensal</th><th>Preço anual</th></tr></thead>
    <tbody>
      <tr><td class="td-bold">Starter</td><td>1</td><td>5</td><td>1</td><td>R$ 197</td><td>R$ 1.970 (2 meses grátis)</td></tr>
      <tr><td class="td-bold">Pro</td><td>5</td><td>20</td><td>3</td><td>R$ 497</td><td>R$ 4.970</td></tr>
      <tr><td class="td-bold">Enterprise</td><td>Ilimitado</td><td>Ilimitado</td><td>Todas</td><td>Sob consulta</td><td>Sob consulta</td></tr>
    </tbody>
  </table>
</div>

<h2>Schema proposto</h2>
<pre><code>model Plan {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique
  priceMonthly  Int      // em centavos
  priceAnnual   Int
  currency      String   @default("BRL")
  stripePriceIdMonthly String?
  stripePriceIdAnnual  String?
  maxStores     Int?     // null = ilimitado
  maxUsersPerStore Int?
  features      Json     // lista de features incluídas
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())
  clients       Client[]
  subscriptions Subscription[]
}</code></pre>
`
});
