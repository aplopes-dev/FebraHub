WIKI.register({
  id: 'estado-implementacao',
  title: 'Estado de implementação',
  icon: '✅',
  searchText: 'estado implementacao backlog paridade android ios web jetpack compose swiftui react vite telas implementadas mock memoria fluxo compra splash login home pdp carrinho checkout confirmacao favoritos busca pix divergencias epicos cadastro endereco cartao cupom rastreio avaliacoes notificacoes ajuda chat appstate models mockdata roadmap',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Evolução</div>
    <h1 class="section-title">✅ Estado de implementação</h1>
    <p class="section-subtitle">Auditoria de paridade Android (Jetpack Compose) × iOS (SwiftUI) × Web (React/Vite). 11 telas por plataforma, com o fluxo de compra funcionando ponta a ponta sobre estado mock em memória. Backlog visual concluído nas três plataformas.</p>
    <div class="section-tags">
      <span class="tag-green">Android</span>
      <span class="tag-blue">iOS</span>
      <span class="tag-indigo">Web</span>
      <span class="tag-gray">Mock em memória</span>
    </div>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Estado atual — o que já funciona</div>
      <p>11 telas em cada plataforma, visualmente completas. O fluxo central de compra funciona ponta a ponta sobre estado mockado: <strong>Splash → Login → Home → PDP → Carrinho → Checkout → Confirmação</strong>. Acrescido de favoritos (toggle ao vivo), busca por texto, desconto PIX de 5%, badge do carrinho e TrackingTimeline. Tudo é mock/em memória — o objetivo é ter todas as telas e fluxos implementados visualmente.</p>
    </div>
  </div>

  <div class="alert alert-blue">
    <span class="alert-icon">📐</span>
    <div class="alert-body">
      <div class="alert-title">Convenção de arquivos e legenda de status</div>
      <p>Cada tela é espelhada nas três plataformas: Android <code>XxxScreen.kt</code> · iOS <code>XxxView.swift</code> · Web <code>XxxPage.tsx</code> (rotas em <code>App.tsx</code>). Legenda usada no backlog: <strong>✅</strong> = concluído em mobile (Android + iOS) · <strong>✅✅</strong> = concluído em mobile + Web.</p>
    </div>
  </div>

  <h2>Telas existentes (base)</h2>
  <p>As 11 telas que formam o esqueleto do app, presentes em todas as plataformas:</p>
  <div class="card-grid">
    <div class="card card-indigo">
      <div class="card-icon">🚪</div>
      <div class="card-title">Entrada</div>
      <p>Splash · Login</p>
    </div>
    <div class="card card-blue">
      <div class="card-icon">🔎</div>
      <div class="card-title">Descoberta</div>
      <p>Home · Search</p>
    </div>
    <div class="card card-violet">
      <div class="card-icon">🛒</div>
      <div class="card-title">Compra</div>
      <p>ProductDetail · Cart · Checkout · Confirmation</p>
    </div>
    <div class="card card-emerald">
      <div class="card-icon">👤</div>
      <div class="card-title">Pós-compra e conta</div>
      <p>Orders · Account · Favorites</p>
    </div>
  </div>

  <h2>Divergências de paridade Android × iOS × Web</h2>
  <p>Pontos onde uma plataforma estava pior que a outra — alinhados antes de criar telas novas. Todos resolvidos (✅✅, salvo PDP → Carrinho em ✅).</p>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Android</th>
          <th>iOS</th>
          <th>Web</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="td-bold">Confirmação → "Acompanhar pedido"</td>
          <td><span class="status-badge status-functional">aba Compras</span></td>
          <td><span class="status-badge status-functional">aba 3 + reset stack</span></td>
          <td><span class="status-badge status-functional">/compras</span></td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">Confirmação → "Voltar ao início"</td>
          <td><span class="status-badge status-functional">aba Início</span></td>
          <td><span class="status-badge status-functional">aba 0 + reset stack</span></td>
          <td><span class="status-badge status-functional">/</span></td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">Confirmação — saída da tela</td>
          <td><span class="status-badge status-functional">OK</span></td>
          <td><span class="status-badge status-functional">reset NavigationStack</span></td>
          <td><span class="status-badge status-functional">dois CTAs</span></td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">EmptyState CTAs (Cart / Orders / Favorites)</td>
          <td><span class="status-badge status-functional">vão p/ Home</span></td>
          <td><span class="status-badge status-functional">aba 0 nos 3</span></td>
          <td><span class="status-badge status-functional">/ nos 3</span></td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">Seção "Mais vendidos" na Home</td>
          <td><span class="status-badge status-functional">lista invertida</span></td>
          <td><span class="status-badge status-functional">lista invertida</span></td>
          <td><span class="status-badge status-functional">reverse() na Home</span></td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">PDP → Carrinho</td>
          <td><span class="status-badge status-functional">via aba</span></td>
          <td><span class="status-badge status-functional">aba 2 (botão + toolbar)</span></td>
          <td><span class="status-badge status-functional">/carrinho</span></td>
          <td><span class="status-badge status-partial">✅ mobile</span></td>
        </tr>
        <tr>
          <td class="td-bold">Código morto removido</td>
          <td><span class="status-badge status-functional">onLogout em MainNav</span></td>
          <td><span class="status-badge status-functional">componentes mortos</span></td>
          <td><span class="status-badge status-functional">USER_NAME / ADDR_LINE</span></td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>Bugs e no-ops corrigidos em telas existentes</h2>
  <p>Stubs que existiam nas telas atuais e foram ligados conforme as telas novas eram criadas:</p>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Tela</th><th>Correção aplicada</th><th>Status</th></tr>
      </thead>
      <tbody>
        <tr>
          <td class="td-bold">Login</td>
          <td>Validação mock (camila@email.com / 123456); Google simulado com feedback; navegação para Registro, Esqueci a senha, Termos e Privacidade.</td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">Home</td>
          <td>Os 8 atalhos de categoria e o "Ver tudo" abrem <code>CategoryScreen</code> filtrada; banner "Semana do Consumidor" leva à busca.</td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">Search</td>
          <td>"Ordenar" / "Filtrar" abrem modal de filtros; histórico e sugestões ao focar campo vazio.</td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">PDP</td>
          <td>"Ver avaliações" navega para <code>ReviewsScreen</code>; prazo via <code>selectedShipping</code> e parcelas dinâmicas por preço (<code>ProductPricing</code>).</td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">Cart</td>
          <td>Envio dinâmico (endereço + opção selecionada) e campo de cupom (antes: frete grátis hardcoded, sem cupom).</td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">Checkout</td>
          <td>Endereço via <code>selectedAddress</code>, envio via <code>selectedShipping</code>, cupom aplicável; cartão (radio + B5) e boleto (CPF + preview); <code>checkoutPaymentType</code> no AppState.</td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">Account</td>
          <td>Perfil editável (B1), CityBox+ (B8), endereços/cartões/cupons/config (B2–B6), notificações + ajuda/chat (F1–F3), páginas estáticas (B7); <code>User</code> no AppState.</td>
          <td><span class="status-badge status-functional">✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">Orders</td>
          <td>OrderCard abre o detalhe do pedido; timer na aba Compras chama <code>advanceOrderStatus()</code> a cada 20s.</td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>Telas e fluxos criados (por épico)</h2>
  <p>Cerca de 24 telas novas (22 essenciais + onboarding e chat opcionais), espelhadas nas três plataformas. Todas concluídas (✅✅).</p>

  <h3>Épico A — Autenticação e onboarding</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>ID</th><th>Tela / rota</th><th>Gatilho</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">A1</td><td><code>RegisterPage</code> (/cadastro)</td><td>Login → "Criar conta"</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
        <tr><td class="td-bold">A2</td><td><code>ForgotPasswordPage</code> (/esqueci-senha)</td><td>Login → "Esqueci a senha"</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
        <tr><td class="td-bold">A3</td><td><code>OnboardingPage</code> (/onboarding) — opcional</td><td>Primeira execução, antes do Login</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
      </tbody>
    </table>
  </div>

  <h3>Épico B — Conta e perfil</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>ID</th><th>Tela / rota</th><th>Gatilho</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">B1</td><td><code>EditProfilePage</code> (/conta/perfil)</td><td>Account → "Editar perfil"</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
        <tr><td class="td-bold">B2</td><td><code>AddressListPage</code> (/conta/enderecos, /checkout/endereco)</td><td>Account → "Endereços" · Checkout → "Alterar"</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
        <tr><td class="td-bold">B3</td><td><code>AddressFormPage</code> (/conta/enderecos/novo, /:id)</td><td>Adicionar/editar endereço (CEP auto-preenche)</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
        <tr><td class="td-bold">B4</td><td><code>PaymentMethodsPage</code> (/conta/cartoes)</td><td>Account → "Meus Cartões"</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
        <tr><td class="td-bold">B5</td><td><code>CardFormPage</code> (/conta/cartoes/novo)</td><td>Adicionar cartão (detecta bandeira)</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
        <tr><td class="td-bold">B6</td><td><code>SettingsPage</code> (/conta/configuracoes)</td><td>Account → "Configurações"</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
        <tr><td class="td-bold">B7</td><td><code>StaticPage</code> (/pagina/sobre, /termos, /privacidade)</td><td>Account → Sobre / Termos / Privacidade</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
        <tr><td class="td-bold">B8</td><td><code>SubscriptionPage</code> (/conta/citybox-plus)</td><td>Account → banner "Gerenciar"</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
      </tbody>
    </table>
  </div>

  <h3>Épico C — Compra avançada</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>ID</th><th>Tela / fluxo</th><th>Gatilho</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">C1</td><td>Seleção de endereço no checkout (reusa B2)</td><td>Checkout → "Alterar" endereço</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
        <tr><td class="td-bold">C2</td><td><code>ShippingOptionsPage</code> (/checkout/envio)</td><td>Checkout → seção Envio (Express / Normal / Econômico)</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
        <tr><td class="td-bold">C3</td><td><code>CouponsPage</code> (/conta/cupons)</td><td>Account → "Cupons" · campo no Checkout/Cart</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
        <tr><td class="td-bold">C4</td><td>Comprar agora (botão extra no PDP)</td><td>PDP → pula direto ao Checkout</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
        <tr><td class="td-bold">C5</td><td>Pagamento no checkout (reusa B4/B5 + boleto mock)</td><td>Checkout → Cartão ou Boleto (PIX só toggle)</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
      </tbody>
    </table>
  </div>

  <h3>Épico D — Pós-compra</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>ID</th><th>Tela / rota</th><th>Gatilho</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">D1</td><td><code>OrderDetailPage</code> (/compras/:orderId)</td><td>Orders → tap no card</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
        <tr><td class="td-bold">D2</td><td><code>TrackingPage</code> (/compras/:orderId/rastreio)</td><td>OrderDetail → "Rastrear" · Confirmação → "Acompanhar"</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
        <tr><td class="td-bold">D3</td><td><code>WriteReviewPage</code> (/avaliar/:productId)</td><td>OrderDetail → "Avaliar" · Reviews → "Escrever avaliação"</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
        <tr><td class="td-bold">D4</td><td><code>ReturnPage</code> (/compras/:orderId/devolucao)</td><td>OrderDetail → "Devolver"</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
      </tbody>
    </table>
  </div>

  <h3>Épico E — Descoberta</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>ID</th><th>Tela / fluxo</th><th>Gatilho</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">E1</td><td><code>CategoryPage</code> (/categoria/:categoryId)</td><td>Atalhos da Home (antes: busca genérica)</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
        <tr><td class="td-bold">E2</td><td><code>FiltersSheet</code> (modal) + ligar "Ordenar"</td><td>Search → "Ordenar" / "Filtrar"</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
        <tr><td class="td-bold">E3</td><td><code>ReviewsPage</code> (/produto/:id/avaliacoes)</td><td>PDP → "Ver avaliações"</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
        <tr><td class="td-bold">E4</td><td>Histórico de busca / sugestões (dentro da Search)</td><td>Foco no campo vazio</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
      </tbody>
    </table>
  </div>

  <h3>Épico F — Engajamento</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>ID</th><th>Tela / rota</th><th>Gatilho</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">F1</td><td><code>NotificationsPage</code> (/conta/notificacoes)</td><td>Account → "Notificações" · sino no header</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
        <tr><td class="td-bold">F2</td><td><code>HelpPage</code> (/conta/ajuda)</td><td>Account → "Ajuda e Suporte" (FAQ)</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
        <tr><td class="td-bold">F3</td><td><code>ChatPage</code> (/conta/atendimento) — opcional</td><td>Help → "Falar com atendente"</td><td><span class="status-badge status-functional">✅✅</span></td></tr>
      </tbody>
    </table>
  </div>

  <h2>Camada de dados expandida</h2>
  <p>Legenda Web: <code>types/index.ts</code> · <code>data/mock.ts</code> · <code>context/AppContext.tsx</code>. Todos os itens concluídos (✅✅).</p>
  <div class="card-grid">
    <div class="card card-blue">
      <div class="card-icon">🧱</div>
      <div class="card-title">Novos modelos</div>
      <p>User, Address, PaymentMethod/Card, Review, Category, Coupon, Notification, FaqItem, ChatMessage, ShippingOption e Order expandido (address, paymentMethod, subtotal, shipping, discount, trackingCode, histórico de status).</p>
    </div>
    <div class="card card-violet">
      <div class="card-icon">🗃️</div>
      <div class="card-title">MockData adicionado</div>
      <p>Endereços (2–3), cartões (1–2), reviews por produto (3–5), categorias (entidades dos 8 atalhos), cupons (2–3), notificações (4–5), FAQ (7 tópicos), thread de chat e perfil "Camila Souza" movido do hardcode da view para o mock.</p>
    </div>
    <div class="card card-emerald">
      <div class="card-icon">⚙️</div>
      <div class="card-title">AppState adicionado</div>
      <p><code>user</code>/updateProfile, <code>addresses</code>+CRUD/selectedAddress, <code>paymentMethods</code>+selectedPayment/checkoutPaymentType/boletoCpf, <code>appliedCoupon</code>, <code>notifications</code>+markRead, <code>chatMessages</code>, <code>reviews</code>+addReview, <code>searchHistory</code>, <code>advanceOrderStatus()</code> (timer 20s), <code>selectedShipping</code>, <code>hasSeenOnboarding</code>, e login/loginWithGoogle/register.</p>
    </div>
  </div>

  <h2>Roadmap de implementação (ordem seguida)</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Fase</th><th>Entregas</th><th>Mobile</th><th>Web</th></tr>
      </thead>
      <tbody>
        <tr>
          <td class="td-bold">0 — Paridade e correções</td>
          <td>Divergências de paridade inteiras</td>
          <td><span class="status-badge status-functional">✅</span></td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">1 — Dados</td>
          <td>Novos modelos + MockData + AppState</td>
          <td><span class="status-badge status-functional">✅</span></td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">2 — Conta</td>
          <td>B1–B8 (perfil, endereços, cartões, settings, estáticas, CityBox+)</td>
          <td><span class="status-badge status-functional">✅</span></td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">3 — Compra avançada</td>
          <td>C1–C4 (endereço no checkout, envio, cupons, comprar agora)</td>
          <td><span class="status-badge status-functional">✅</span></td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">3b — Pagamento no checkout</td>
          <td>C5 (cartão salvo/novo via B4–B5 + boleto mock)</td>
          <td><span class="status-badge status-functional">✅</span></td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">4 — Pós-compra</td>
          <td>D1–D4 (detalhe, rastreio, avaliar, devolução)</td>
          <td><span class="status-badge status-functional">✅</span></td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">5 — Descoberta</td>
          <td>E1–E4 (categorias, filtros, reviews, histórico)</td>
          <td><span class="status-badge status-functional">✅</span></td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">6 — Engajamento</td>
          <td>F1–F3 (notificações, ajuda, chat)</td>
          <td><span class="status-badge status-functional">✅</span></td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">7 — Auth e polish</td>
          <td>A1–A3 (cadastro, esqueci senha, onboarding) + correções Login/PDP/Orders</td>
          <td><span class="status-badge status-functional">✅</span></td>
          <td><span class="status-badge status-functional">✅✅</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">🏁</span>
    <div class="alert-body">
      <div class="alert-title">Backlog visual 100% concluído</div>
      <p>Total de ~24 telas novas (22 essenciais + onboarding e chat opcionais), espelhadas nas três plataformas. Backlog visual concluído em Android + iOS + Web (✅✅), sempre sobre estado mock em memória.</p>
    </div>
  </div>
</div>
`
});
