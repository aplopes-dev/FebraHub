WIKI.register({
  id: 'backend-mock',
  title: 'Backend mock (MSW)',
  icon: '🧪',
  searchText: 'backend mock msw mock service worker 76 endpoints fachada cityboxapi vite api mode live handlers fases estado memoria openapi db handlers auth catalog cart checkout account orders engagement content boot flags appcontext wiring optimistic envelope bff pix idempotency seed dto mappers types live base url',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Apps e Arquitetura</div>
    <h1 class="section-title">🧪 Backend mock (MSW)</h1>
    <p class="section-subtitle">Backend mock completo via MSW 2.x: as 76 operações do <code>openapi.yaml</code> com dados coerentes e estado mutável em memória. Todos os fluxos do app web passam pela fachada <code>cityboxApi</code>, interceptada pelo MSW no modo mock — a virada para o BFF real é só uma flag de ambiente.</p>
    <div class="section-tags">
      <span class="tag-green">MSW 2.x</span>
      <span class="tag-indigo">76 endpoints</span>
      <span class="tag-blue">Fachada cityboxApi</span>
      <span class="tag-gray">Estado em memória</span>
    </div>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">✅</span>
    <div class="alert-body">
      <div class="alert-title">Status geral — Concluído (100% do plano)</div>
      <p>Fases 0–5 + wiring de UI pós-plano (P1/P2/P3/P4/P7) entregues. <strong>76/76 endpoints</strong> na fachada + handlers MSW; <code>AppContext</code> sem nenhum <code>MOCK_*</code>; verificação E2E aprovada. Bootstrap carrega 12 recursos autenticados em paralelo e a virada para o BFF real (<code>VITE_API_MODE=live</code>) sai do bundle sem o chunk do MSW.</p>
    </div>
  </div>

  <h2>Contexto e objetivo</h2>
  <p>Na baseline do plano, o app web já tinha camada HTTP, mas apenas ~16 dos 76 endpoints estavam plugados na fachada. Os outros ~60 fluxos rodavam de constantes <code>MOCK_*</code> locais no <code>AppContext</code>, fora do seam da API, dependendo do Prism (payloads genéricos com valores tipo <code>"string"</code>).</p>
  <p>O objetivo (atingido) foi triplo:</p>
  <ol>
    <li>Backend mock completo cobrindo <strong>76 endpoints</strong> via MSW, com estado mutável em memória.</li>
    <li>Fluxos do <code>AppContext</code> roteados pela fachada — zero <code>MOCK_*</code> no contexto.</li>
    <li>Telas renderizando via integração (contexto + wiring de componentes), com flag global para apontar ao BFF real.</li>
  </ol>

  <div class="alert alert-blue">
    <span class="alert-icon">🧩</span>
    <div class="alert-body">
      <div class="alert-title">Dados-semente</div>
      <p>Duas fontes alimentam o store MSW: <code>web/src/data/mock.ts</code> (orders, notifications, chat, coupons, …) semeia o <code>db.ts</code>, e <code>web/src/api/seed/catalog.ts</code> traz produtos, categorias, home e user para o catálogo e os handlers. O <code>mock.ts</code> deixa de viver no <code>AppContext</code> e passa a ser apenas seed.</p>
    </div>
  </div>

  <h2>Restrições</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Restrição</th><th>Detalhe</th></tr>
      </thead>
      <tbody>
        <tr><td class="td-bold">Interface pública inalterada</td><td>O contrato <code>AppContextValue</code> não muda — o wiring P1 altera só as entranhas de 6 componentes, sem mexer nas props do contexto.</td></tr>
        <tr><td class="td-bold">Só mudam as entranhas</td><td>O <code>AppContext</code> deixa de mutar <code>MOCK_*</code> local e passa a chamar <code>cityboxApi</code> + estado.</td></tr>
        <tr><td class="td-bold">Padrão otimista</td><td>Reusa o padrão optimistic-then-sync já existente em carrinho e favoritos.</td></tr>
        <tr><td class="td-bold">Envelope BFF</td><td>Sucesso → objeto com <code>data</code> (e <code>meta</code> opcional) · Erro → <code>data: null</code> + lista de erros com code, message e field, casando com o <code>http.ts</code>.</td></tr>
        <tr><td class="td-bold">Auth nos handlers</td><td>Endpoints autenticados exigem <code>Authorization: Bearer</code>; sem o header, respondem 401.</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Inventário por domínio</h2>
  <p>Os 76 endpoints, agrupados por domínio. ~70 têm tela consumindo; 4 ficam handler-only (fachada + handler prontos, sem UI ainda).</p>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Domínio</th><th>Ops</th><th>Cobertura (fachada + handler + UI)</th></tr>
      </thead>
      <tbody>
        <tr><td class="td-bold">Infra</td><td>2</td><td><code>getRoot</code> + <code>getHealth</code> — handler-only (sem UI)</td></tr>
        <tr><td class="td-bold">Auth &amp; onboarding</td><td>10</td><td>8 com tela · <code>refreshToken</code> via <code>http.ts</code> · <code>resetPassword</code> handler-only</td></tr>
        <tr><td class="td-bold">Perfil</td><td>6</td><td><code>EditProfilePage</code> com <code>uploadAvatar</code> (B1)</td></tr>
        <tr><td class="td-bold">Assinatura</td><td>2</td><td><code>SubscriptionPage</code> com <code>getSubscription</code></td></tr>
        <tr><td class="td-bold">Endereços</td><td>6</td><td>CRUD completo + lookup de CEP</td></tr>
        <tr><td class="td-bold">Pagamentos</td><td>4</td><td>CRUD de cartões + cartão padrão</td></tr>
        <tr><td class="td-bold">Catálogo &amp; busca</td><td>13</td><td><code>CategoryPage</code> e filter-panels via fachada</td></tr>
        <tr><td class="td-bold">Favoritos</td><td>2</td><td>Toggle ao vivo</td></tr>
        <tr><td class="td-bold">Carrinho</td><td>6</td><td>CRUD + cupom no carrinho</td></tr>
        <tr><td class="td-bold">Checkout</td><td>8</td><td>Sessão, frete, cupons, preview e createOrder</td></tr>
        <tr><td class="td-bold">Pedidos &amp; pós-compra</td><td>8</td><td><code>OrderDetailPage</code> com <code>buyAgain</code> + <code>getInvoice</code> (D1)</td></tr>
        <tr><td class="td-bold">Engajamento</td><td>7</td><td>Chat via <code>sendChatMessage</code> · <code>createTicket</code> handler-only</td></tr>
        <tr><td class="td-bold">Conteúdo</td><td>2</td><td><code>StaticPage</code> e <code>HeroBanner</code> via fachada</td></tr>
        <tr><td class="td-bold">Total</td><td>76</td><td>76 fachada · 76 handler · ~70 com tela · 4 handler-only</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Endpoints handler-only (sem tela)</h3>
  <p>Fachada e handler implementados; a UI ainda não consome — contrato pronto para plugar:</p>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>operationId</th><th>Método · Path</th><th>Motivo</th></tr>
      </thead>
      <tbody>
        <tr><td class="td-bold">resetPassword</td><td>POST /auth/reset-password</td><td>Aguardando BACKLOG (A2 só cobre forgot)</td></tr>
        <tr><td class="td-bold">createTicket</td><td>POST /me/support/tickets</td><td>Aguardando BACKLOG (F3 usa chat)</td></tr>
        <tr><td class="td-bold">getRoot</td><td>GET /</td><td>Infra</td></tr>
        <tr><td class="td-bold">getHealth</td><td>GET /health</td><td>Infra</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Arquitetura</h2>
  <p>A fachada <code>cityboxApi</code> é o único ponto por onde a UI fala com a API. No modo mock, o MSW intercepta as requisições no nível da rede e as regras de negócio do BFF vivem nos handlers. No modo live, as mesmas chamadas vão direto ao BFF real — sem alterar nenhum componente.</p>
  <div class="card-grid">
    <div class="card card-indigo">
      <div class="card-icon">🗄️</div>
      <div class="card-title">Store em memória — db.ts</div>
      <p>Estado mutável único da sessão, semeado em shape de API (DTO). Guarda user, settings, subscription, addresses, paymentMethods, cart, favorites, appliedCoupon, orders, returns, notifications, chat, reviews, searchHistory, tickets e checkoutSession. Helpers: <code>buildCart()</code>, <code>buildFavorites()</code>, <code>findProduct(id)</code> e <code>nextId(prefix)</code> (contador determinístico, sem Date.now/random no módulo).</p>
    </div>
    <div class="card card-blue">
      <div class="card-icon">🔌</div>
      <div class="card-title">Fachada — citybox-api.ts</div>
      <p>Expandida para cobrir todos os endpoints, agrupados por domínio, no mesmo estilo (<code>apiFetch</code> + <code>res.data</code>). ~40 métodos novos, suporte a <code>FormData</code> (<code>uploadAvatar</code>, <code>addReviewPhoto</code>) e header <code>Idempotency-Key</code> em <code>createOrder</code>.</p>
    </div>
    <div class="card card-violet">
      <div class="card-icon">🧱</div>
      <div class="card-title">Tipos DTO + mappers</div>
      <p><code>types.ts</code> ganha 16+ interfaces <code>Api*</code> espelhando o <code>openapi.yaml</code>; <code>mappers.ts</code> ganha 11 funções DTO → domínio (<code>mapOrder</code>, <code>mapNotification</code>, <code>mapChatMessage</code>, <code>mapCoupon</code>, <code>mapReview</code>, …).</p>
    </div>
    <div class="card card-green">
      <div class="card-icon">📡</div>
      <div class="card-title">Handlers MSW</div>
      <p>MSW 2.x (<code>http</code> + <code>HttpResponse</code>), um arquivo por domínio, agregados em <code>handlers.ts</code>. Casam por path curinga (ex.: <code>*/me/orders/:id</code>), independentes da base URL. As regras do BFF ficam aqui: desconto PIX 5%, cupom, totais do carrinho, transição de status e validação de checkout.</p>
    </div>
  </div>

  <div class="alert alert-indigo">
    <span class="alert-icon">🔁</span>
    <div class="alert-body">
      <div class="alert-title">Virada para o BFF real — sem tocar em componentes</div>
      <p>O boot é condicional: se <code>VITE_API_MODE !== 'live'</code>, o <code>main.tsx</code> faz <code>import</code> dinâmico de <code>@/mocks/browser</code> e inicia o worker antes do render (import dinâmico → MSW sai do build live). Para apontar ao BFF, basta <code>VITE_API_MODE=live</code> + <code>VITE_API_BASE_URL=&lt;url&gt;</code>. Como tudo passa pela fachada <code>cityboxApi</code>, nenhum componente muda.</p>
    </div>
  </div>

  <h3>Handlers por domínio</h3>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Arquivo</th><th>Domínio</th></tr>
      </thead>
      <tbody>
        <tr><td class="td-bold">handlers/auth.ts</td><td>Auth &amp; onboarding</td></tr>
        <tr><td class="td-bold">handlers/catalog.ts</td><td>Catálogo &amp; busca</td></tr>
        <tr><td class="td-bold">handlers/cart.ts</td><td>Carrinho</td></tr>
        <tr><td class="td-bold">handlers/checkout.ts</td><td>Checkout &amp; cupons</td></tr>
        <tr><td class="td-bold">handlers/account.ts</td><td>Perfil, endereços, cartões, settings, assinatura</td></tr>
        <tr><td class="td-bold">handlers/orders.ts</td><td>Pedidos &amp; pós-compra</td></tr>
        <tr><td class="td-bold">handlers/engagement.ts</td><td>Notificações, FAQ, chat, tickets</td></tr>
        <tr><td class="td-bold">handlers/content.ts</td><td>Páginas estáticas, banners, infra</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Fases de execução</h2>
  <p>Ordem dependency-safe (sequencial): cada fase só inicia quando a anterior está estável. Todas concluídas.</p>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Fase</th><th>Objetivo</th><th>Entregáveis</th><th>Status</th></tr>
      </thead>
      <tbody>
        <tr>
          <td class="td-bold">0 — Foundation</td>
          <td>Base de dados + tipos + mappers prontos para handlers e fachada</td>
          <td><code>db.ts</code> mutável (seed dos <code>MOCK_*</code>/<code>SEED_*</code>) + helpers · tipos <code>Api*</code> · 11 mappers</td>
          <td><span class="status-badge status-functional">✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">1 — Fachada cityboxApi</td>
          <td>Um método por operação faltante (~40 novos)</td>
          <td>76/76 operationId cobertos · <code>tsc --noEmit</code> limpo · suporte a <code>FormData</code> · <code>Idempotency-Key</code></td>
          <td><span class="status-badge status-functional">✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">2 — Handlers MSW</td>
          <td>Handler HTTP para cada endpoint, espelhando regras do BFF</td>
          <td>8 arquivos por domínio + agregador + <code>checkout-logic.ts</code> · auth 401 sem Bearer · PIX 5% · avanço de status a cada 20s</td>
          <td><span class="status-badge status-functional">✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">3 — Boot &amp; flags</td>
          <td>Worker MSW, flags de ambiente e entry condicional</td>
          <td>MSW 2.14 instalado · <code>mockServiceWorker.js</code> gerado · <code>browser.ts</code> + <code>startMockWorker()</code> · <code>API_MODE</code> em <code>config.ts</code> · <code>.env.development</code></td>
          <td><span class="status-badge status-functional">✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">4 — Wiring do AppContext</td>
          <td>Eliminar <code>MOCK_*</code> locais mantendo a interface idêntica</td>
          <td>~60 fluxos migrados (auth, perfil, endereços, cartões, assinatura, catálogo, carrinho, checkout, pedidos, engajamento, conteúdo) · <code>syncAuthenticatedState</code> carrega 12 recursos em paralelo</td>
          <td><span class="status-badge status-functional">✅</span></td>
        </tr>
        <tr>
          <td class="td-bold">5 — Verificação</td>
          <td>Typecheck + checklist E2E + virada live</td>
          <td><code>tsc</code> e <code>build</code> OK · MSW ativo (<code>[MSW] Mocking enabled</code>) · Home com 8 produtos reais · modo live sem chunk MSW (313 vs 409 módulos)</td>
          <td><span class="status-badge status-functional">✅</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-blue">
    <span class="alert-icon">⚙️</span>
    <div class="alert-body">
      <div class="alert-title">Boot condicional + flag de dev</div>
      <p>Em <code>VITE_API_MODE=mock</code> o MSW fica ativo (log <code>[MSW] Mocking enabled</code>) e o build inclui o chunk do MSW (~444 kB). Em <code>VITE_API_MODE=live</code> as requisições vão direto ao <code>VITE_API_BASE_URL</code> e o bundle exclui o MSW (313 módulos, bundle único). A flag de dev fica em <code>web/.env.development</code>.</p>
    </div>
  </div>

  <h2>Regras de negócio nos handlers</h2>
  <p>O "BFF" mockado reproduz as decisões que o backend real tomaria, dentro dos handlers MSW:</p>
  <div class="card-grid">
    <div class="card card-amber">
      <div class="card-icon">💸</div>
      <div class="card-title">PIX e cupons</div>
      <p>Desconto PIX de 5% aplicado no preview, validação e aplicação de cupom, e recálculo de totais do carrinho.</p>
    </div>
    <div class="card card-emerald">
      <div class="card-icon">🚚</div>
      <div class="card-title">Pedidos e status</div>
      <p>Transição CONFIRMED → PREPARING → SHIPPED → DELIVERED, avançando a cada 20s no <code>getOrder</code>/<code>listOrders</code>; cancel e devolução com rastreio.</p>
    </div>
    <div class="card card-blue">
      <div class="card-icon">🔐</div>
      <div class="card-title">Auth e idempotência</div>
      <p>Credenciais mock (camila@email.com / 123456), tokens Bearer, 401 sem header, senha errada → INVALID_CREDENTIALS, e <code>Idempotency-Key</code> em <code>createOrder</code>.</p>
    </div>
  </div>

  <h2>Wiring de UI → fachada (pós-plano)</h2>
  <p>Componentes que consumiam seed local ou stub e passaram a chamar a fachada diretamente:</p>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Componente</th><th>Método fachada</th><th>Plano</th></tr>
      </thead>
      <tbody>
        <tr><td class="td-bold">CategoryPage</td><td><code>getCategoryProducts</code></td><td><span class="status-badge status-functional">P1</span></td></tr>
        <tr><td class="td-bold">filter-panels (SearchFilterSidebar, FilterSheet)</td><td><code>getFiltersMetadata</code></td><td><span class="status-badge status-functional">P1</span></td></tr>
        <tr><td class="td-bold">SearchSuggestionsPanel</td><td><code>searchSuggestions</code></td><td><span class="status-badge status-functional">P1</span></td></tr>
        <tr><td class="td-bold">StaticPage</td><td><code>getStaticPage</code></td><td><span class="status-badge status-functional">P1</span></td></tr>
        <tr><td class="td-bold">SubscriptionPage</td><td><code>getSubscription</code></td><td><span class="status-badge status-functional">P1</span></td></tr>
        <tr><td class="td-bold">HeroBanner</td><td><code>getBanners</code></td><td><span class="status-badge status-functional">P1</span></td></tr>
        <tr><td class="td-bold">EditProfilePage</td><td><code>uploadAvatar</code></td><td><span class="status-badge status-functional">P2 · B1</span></td></tr>
        <tr><td class="td-bold">OrderDetailPage</td><td><code>buyAgain</code>, <code>getInvoice</code></td><td><span class="status-badge status-functional">P2 · D1</span></td></tr>
        <tr><td class="td-bold">WriteReviewPage</td><td><code>createReview</code>, <code>addReviewPhoto</code></td><td><span class="status-badge status-functional">P2 · D3</span></td></tr>
      </tbody>
    </table>
  </div>
  <p><code>buyAgain</code> também é exposto como <code>buyAgainOrder</code> no <code>AppContext</code> (sincroniza o carrinho após o POST). O <code>refreshToken</code> roda via interceptor 401 em <code>http.ts</code> (P3), não exposto na UI; <code>onboardingPreLogin</code>/<code>onboardingPostLogin</code> via <code>completeOnboarding</code>.</p>

  <h2>Fora de escopo e pendências</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Item</th><th>Situação</th></tr>
      </thead>
      <tbody>
        <tr><td class="td-bold">BFF real (backend)</td><td>Fora de escopo — este trabalho cobre só o mock MSW + wiring web.</td></tr>
        <tr><td class="td-bold">WebSocket / SSE real-time</td><td>Fora de escopo — o polling de 20s mantém paridade com o timer mock.</td></tr>
        <tr><td class="td-bold">Testes E2E automatizados (Playwright/Cypress)</td><td>Fora de escopo — verificação manual na Fase 5; pode vir depois.</td></tr>
        <tr><td class="td-bold">Remover fallbacks Prism em citybox-api.ts (P5)</td><td><span class="status-badge status-proposed">Blocked</span> — guards <code>=== 'string'</code> só saem quando o <code>npm run mock:server</code> (Prism) for descontinuado.</td></tr>
        <tr><td class="td-bold">Telas de resetPassword e createTicket (P2b)</td><td>Aguardando BACKLOG — 4/6 endpoints handler-only já wired (B1/D1/D3).</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-green">
    <span class="alert-icon">🏁</span>
    <div class="alert-body">
      <div class="alert-title">Resultado</div>
      <p>Todos os fluxos com tela do mapa fluxo → endpoint passam por <code>cityboxApi</code> + MSW. Antes ~16 endpoints estavam integrados; agora são <strong>76</strong>. O app web roda ponta a ponta sobre o mock e a troca para produção é uma flag — <code>VITE_API_MODE=live</code> + URL do BFF — sem refatorar componentes.</p>
    </div>
  </div>
</div>
`
});
