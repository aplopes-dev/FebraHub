WIKI.register({
  id: 'clientes-crm',
  title: 'Clientes e CRM',
  icon: '👥',
  searchText: 'clientes crm historico fidelidade cashback pontos segmentacao registro atendimento compras cliente final',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Clientes e Engajamento</div>
    <h1 class="section-title">👥 Clientes e CRM</h1>
    <p class="section-subtitle">Registro de clientes finais da loja, histórico de compras e atendimentos, segmentação básica e fidelidade simplificada. Comum a todas as verticais — profundidade de dados varia por segmento.</p>
    <div class="section-tags">
      <span class="tag-orange">Clientes</span>
      <span class="tag-amber">CRM · Fidelidade</span>
      <span class="tag-gray">Comum a todas as verticais</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Clientes criados automaticamente via Keycloak (consumer) ao primeiro pedido no marketplace</li>
      <li>Dados básicos: nome, e-mail, telefone, endereços salvos</li>
      <li>Sem histórico por loja no ERP</li>
      <li>Sem programa de fidelidade</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Ficha de cliente com histórico completo: pedidos, agendamentos, OS, compras no PDV</li>
      <li>Segmentação automática: frequente, ocasional, inativo, novo</li>
      <li>Fidelidade básica: acúmulo de pontos ou cashback por transação</li>
      <li>Resgate de benefício no PDV ou no checkout do app</li>
      <li>Anotações do operador por cliente (preferências, alergias, observações clínicas)</li>
      <li>Histórico de comunicações (notificações enviadas, respostas)</li>
    </ul>
  </div>

  <h2>Entidade Customer no contexto da loja</h2>
  <pre>// Customer é global (plataforma), mas o perfil por loja é local
model StoreCustomerProfile {
  id          String   @id @default(cuid())
  storeId     String
  customerId  String   // ref ao Customer global (Keycloak consumer)
  notes       String?  // anotações privadas da loja
  tags        String[] // tags livres: "vip", "vegano", "dog-friendly"
  loyaltyPoints Int    @default(0)
  cashbackBalance Decimal @default(0) @db.Decimal(10,2)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  orders        Order[]
  appointments  Appointment[]
  @@unique([storeId, customerId])
}</pre>

  <h2>Ficha do cliente</h2>
  <div class="mockup-container">
    <div class="mock-topbar"><span class="mock-logo" style="color:#fbbf24">👤 Ana Paula Ferreira</span>
      <span style="margin-left:auto;font-size:11px;background:rgba(255,255,255,.1);padding:3px 8px;border-radius:10px;">VIP ⭐</span>
    </div>
    <div class="mock-body">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;">
        <div class="mock-kpi">
          <div class="mock-kpi-value" style="color:#d97706">23</div>
          <div class="mock-kpi-sub">visitas (90d)</div>
        </div>
        <div class="mock-kpi">
          <div class="mock-kpi-value" style="color:#d97706">R$1.240</div>
          <div class="mock-kpi-sub">gasto total</div>
        </div>
        <div class="mock-kpi">
          <div class="mock-kpi-value" style="color:#d97706">350</div>
          <div class="mock-kpi-sub">pontos de fidelidade</div>
        </div>
      </div>
      <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Histórico recente</div>
      <div style="background:white;border:1px solid #e7e5e4;border-radius:8px;overflow:hidden;">
        <div style="display:grid;grid-template-columns:1fr 2fr 1fr 1fr;padding:8px 12px;background:#fef9f0;font-size:11px;font-weight:600;color:#57534e;">
          <div>Data</div><div>Serviço / Produto</div><div>Valor</div><div>Status</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 2fr 1fr 1fr;padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;">
          <div>21/06</div><div>Corte + Escova</div><div>R$85</div><div><span class="mock-badge mock-badge-green">Concluído</span></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 2fr 1fr 1fr;padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;">
          <div>10/06</div><div>Manicure</div><div>R$40</div><div><span class="mock-badge mock-badge-green">Concluído</span></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 2fr 1fr 1fr;padding:8px 12px;font-size:12px;color:#a8a29e;">
          <div>02/06</div><div>Coloração</div><div>R$150</div><div><span class="mock-badge mock-badge-green">Concluído</span></div>
        </div>
      </div>
    </div>
  </div>

  <h2>Segmentação automática</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Segmento</th><th>Critério padrão</th><th>Ação recomendada</th></tr></thead>
      <tbody>
        <tr><td><span class="tag-green">Frequente</span></td><td>≥ 4 visitas nos últimos 30 dias</td><td>Programa VIP, benefícios exclusivos</td></tr>
        <tr><td><span class="tag-blue">Regular</span></td><td>1–3 visitas nos últimos 30 dias</td><td>Lembrete de próxima visita</td></tr>
        <tr><td><span class="tag-amber">Ocasional</span></td><td>1+ visita entre 30–90 dias atrás</td><td>Oferta de retorno</td></tr>
        <tr><td><span class="tag-red">Em risco</span></td><td>Última visita entre 90–180 dias atrás</td><td>Campanha de reativação</td></tr>
        <tr><td><span class="tag-gray">Inativo</span></td><td>Sem visitas há mais de 180 dias</td><td>Comunicado com desconto especial</td></tr>
        <tr><td><span class="tag-purple">Novo</span></td><td>Primeira visita nos últimos 30 dias</td><td>Boas-vindas + cupom para 2ª visita</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Fidelidade básica (pontos / cashback)</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">⭐</span> Acúmulo de pontos</div>
      <p>1 ponto por R$1 gasto. Configurável por loja: multiplicador por categoria, bônus de aniversário. Pontos somem após X dias de inatividade.</p>
    </div>
    <div class="card card-green">
      <div class="card-title"><span class="card-icon">💰</span> Cashback</div>
      <p>X% do valor volta como crédito na loja. Resgate mínimo configurável. Cashback não se acumula sobre cashback.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">🎁</span> Resgate</div>
      <p>PDV: operador aplica pontos/cashback no fechamento. Marketplace: campo de resgate no checkout. Limite de uso: máximo % por transação.</p>
    </div>
  </div>

  <h2>CRM por vertical — campos adicionais</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Vertical</th><th>Campos adicionais no perfil</th></tr></thead>
      <tbody>
        <tr><td>Beauty</td><td>Preferências de estilo, alergias a produtos, profissional preferido</td></tr>
        <tr><td>Clinic</td><td>Prontuário médico (separado, com acesso restrito), convênio, CID</td></tr>
        <tr><td>Food</td><td>Restrições alimentares, alergias, pedidos frequentes</td></tr>
        <tr><td>Pet</td><td>Dados do(s) pet(s): nome, raça, idade, vacinação, observações veterinárias</td></tr>
        <tr><td>Education</td><td>Turma, responsável (menor), histórico de desempenho</td></tr>
        <tr><td>Hospitality</td><td>Preferências de quarto, solicitações especiais, histórico de estadias</td></tr>
        <tr><td>Rental</td><td>CNH (veículos), habilitações, histórico de danos</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
