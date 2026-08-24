WIKI.register({
  id: 'contrato-bff-api',
  title: 'Contrato BFF/API',
  icon: '🔌',
  searchText: 'bff api contrato endpoints rest jwt bearer epico autenticacao conta perfil enderecos cartoes catalogo descoberta busca favoritos carrinho checkout cupons frete pedidos rastreamento devolucao engajamento notificacoes chat faq cms conteudo webhooks realtime modelos models appstate envelope idempotency pix boleto cartao',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Apps e Arquitetura</div>
    <h1 class="section-title">🔌 Contrato BFF/API</h1>
    <p class="section-subtitle">Especificação de endpoints para integração mobile (Android + iOS) com o backend, derivada do BACKLOG e dos modelos Models.kt / AppState.kt. São 73 endpoints organizados por épico, do bootstrap de sessão ao pós-venda.</p>
    <div class="section-tags">
      <span class="tag-indigo">REST</span>
      <span class="tag-blue">JWT Bearer</span>
      <span class="tag-violet">Por épico</span>
      <span class="tag-gray">JSON / ISO 8601</span>
    </div>
  </div>

  <div class="alert alert-blue">
    <span class="alert-icon">🔌</span>
    <div class="alert-body">
      <div class="alert-title">Convenções globais</div>
      <p>
        Base URL <code>https://api.citybox.com.br/v1</code> ·
        Auth <code>Authorization: Bearer &lt;access_token&gt;</code> ·
        Formato JSON / UTF-8 · datas em ISO 8601 ·
        valores monetários em <code>number</code> decimal BRL (ex.: <code>6999.00</code>).
        Toda resposta segue o envelope <code>{ data, meta, errors }</code>; erros usam
        <code>{ code, message, field }</code> dentro de <code>errors[]</code>.
      </p>
    </div>
  </div>

  <h2>Mapa de domínios</h2>
  <div class="card-grid">
    <div class="card card-indigo">
      <div class="card-icon">🚀</div>
      <div class="card-title">Bootstrap & Auth</div>
      <p>Restaurar sessão no Splash, login/registro/Google, refresh, logout e onboarding (Épico A).</p>
    </div>
    <div class="card card-blue">
      <div class="card-icon">👤</div>
      <div class="card-title">Conta & Perfil</div>
      <p>Perfil, endereços, cartões tokenizados, configurações e assinatura CityBox+ (Épico B).</p>
    </div>
    <div class="card card-violet">
      <div class="card-icon">🔍</div>
      <div class="card-title">Catálogo & Busca</div>
      <p>Home, categorias, PDP, filtros, busca, sugestões, histórico e avaliações (Épico E / D3).</p>
    </div>
    <div class="card card-green">
      <div class="card-icon">🛒</div>
      <div class="card-title">Carrinho & Checkout</div>
      <p>Carrinho, sessão de checkout, frete, cupons, preview e confirmação (Épico C).</p>
    </div>
    <div class="card card-amber">
      <div class="card-icon">📦</div>
      <div class="card-title">Pedidos & Pós-venda</div>
      <p>Lista, detalhe, rastreio, nota fiscal, cancelamento e devolução (Épico D).</p>
    </div>
    <div class="card card-orange">
      <div class="card-icon">🔔</div>
      <div class="card-title">Engajamento & CMS</div>
      <p>Notificações, FAQ, chat de suporte, páginas estáticas, banners e webhooks (Épico F).</p>
    </div>
  </div>

  <h2>🚀 Bootstrap & sessão (Splash)</h2>
  <p>Fluxo: Splash → verificar token persistido → Onboarding (se necessário) → Login ou Home.</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método / rota</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>GET /auth/session</code></td><td>Restaura sessão a partir do token armazenado no device (auto-login). <code>401</code> → tentar refresh ou ir para Login.</td></tr>
      </tbody>
    </table>
  </div>
  <p>Boot recomendado: ler tokens do Keychain/Keystore → <code>GET /auth/session</code> (ou <code>POST /auth/refresh</code>) → se autenticado, <code>GET /me</code> + <code>GET /me/cart</code> (badge) + <code>GET /me/notifications?unreadOnly=true</code> (contagem).</p>

  <h2>👤 Autenticação & Onboarding (Épico A)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método / rota</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>POST /auth/login</code></td><td>Login por e-mail ou telefone. <code>account</code> + <code>password</code> + <code>hasSeenOnboarding</code>; retorna <code>accessToken</code>, <code>refreshToken</code> e <code>user</code>.</td></tr>
        <tr><td class="td-bold"><code>POST /auth/register</code></td><td>Registro (A1) com aceite de termos. <code>201</code> com mesmo envelope do login. Erro <code>409 EMAIL_ALREADY_EXISTS</code>.</td></tr>
        <tr><td class="td-bold"><code>POST /auth/google</code></td><td>Login social (A1) com <code>idToken</code> do Google.</td></tr>
        <tr><td class="td-bold"><code>POST /auth/forgot-password</code></td><td>Esqueci minha senha (A2). Resposta sempre genérica por segurança.</td></tr>
        <tr><td class="td-bold"><code>POST /auth/reset-password</code></td><td>Redefinir senha via token recebido por e-mail (A2).</td></tr>
        <tr><td class="td-bold"><code>POST /auth/refresh</code></td><td>Troca <code>refreshToken</code> por novo <code>accessToken</code>.</td></tr>
        <tr><td class="td-bold"><code>POST /auth/logout</code></td><td>Invalida o <code>refreshToken</code>. <code>204</code>.</td></tr>
        <tr><td class="td-bold"><code>POST /auth/onboarding</code></td><td>Onboarding pré-login (A3) persistido por <code>deviceId</code> até o primeiro login.</td></tr>
        <tr><td class="td-bold"><code>PATCH /me/onboarding</code></td><td>Onboarding pós-login (A3) — sincroniza <code>hasSeenOnboarding</code> na conta autenticada.</td></tr>
      </tbody>
    </table>
  </div>

  <h2>🪪 Conta & Perfil (Épico B)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método / rota</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>GET /me</code></td><td>Obter perfil do usuário autenticado (B1).</td></tr>
        <tr><td class="td-bold"><code>PATCH /me</code></td><td>Editar nome, e-mail e telefone (B1).</td></tr>
        <tr><td class="td-bold"><code>POST /me/avatar</code></td><td>Upload de avatar via <code>multipart/form-data</code> (campo <code>file</code>, máx. 5 MB).</td></tr>
        <tr><td class="td-bold"><code>DELETE /me</code></td><td>Excluir conta (B6) — exige <code>password</code> + confirmação literal <code>EXCLUIR</code>.</td></tr>
        <tr><td class="td-bold"><code>GET /me/settings</code></td><td>Obter configurações (push, e-mail promo, tema, idioma) (B6).</td></tr>
        <tr><td class="td-bold"><code>PATCH /me/settings</code></td><td>Atualizar configurações com campos parciais (B6).</td></tr>
        <tr><td class="td-bold"><code>GET /me/subscription</code></td><td>Status da assinatura CityBox+ — plano, preço, renovação, benefícios (B8).</td></tr>
        <tr><td class="td-bold"><code>POST /me/subscription/cancel</code></td><td>Cancelar assinatura com <code>reason</code>/<code>feedback</code> opcionais (B8).</td></tr>
      </tbody>
    </table>
  </div>

  <h2>📍 Endereços (Épico B)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método / rota</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>GET /me/addresses</code></td><td>Listar endereços (B2). Usado também no checkout (C1).</td></tr>
        <tr><td class="td-bold"><code>POST /me/addresses</code></td><td>Criar endereço (B3). <code>201</code>.</td></tr>
        <tr><td class="td-bold"><code>PUT /me/addresses/{addressId}</code></td><td>Editar endereço (B3) — mesmo body da criação.</td></tr>
        <tr><td class="td-bold"><code>DELETE /me/addresses/{addressId}</code></td><td>Excluir endereço (B2). <code>204</code>.</td></tr>
        <tr><td class="td-bold"><code>PATCH /me/addresses/{addressId}/default</code></td><td>Definir endereço padrão (B2 / C1).</td></tr>
        <tr><td class="td-bold"><code>GET /addresses/zip/{zipCode}</code></td><td>Busca por CEP (B3). Erro <code>404 ZIP_NOT_FOUND</code>.</td></tr>
      </tbody>
    </table>
  </div>

  <h2>💳 Pagamentos — cartões (Épico B)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método / rota</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>GET /me/payment-methods</code></td><td>Listar cartões salvos (B4).</td></tr>
        <tr><td class="td-bold"><code>POST /me/payment-methods</code></td><td>Adicionar cartão (B5). Backend tokeniza via gateway — nunca persistir PAN/CVV em claro.</td></tr>
        <tr><td class="td-bold"><code>DELETE /me/payment-methods/{paymentMethodId}</code></td><td>Excluir cartão (B4). <code>204</code>.</td></tr>
        <tr><td class="td-bold"><code>PATCH /me/payment-methods/{paymentMethodId}/default</code></td><td>Definir cartão padrão (B4 / C5).</td></tr>
      </tbody>
    </table>
  </div>

  <h2>🔍 Catálogo & Descoberta (Épico E)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método / rota</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>GET /catalog/home</code></td><td>Feed da Home com seções pré-montadas (Ofertas do dia, Mais vendidos) + produtos.</td></tr>
        <tr><td class="td-bold"><code>GET /catalog/categories</code></td><td>Categorias com ícone e <code>colorHex</code> (E1).</td></tr>
        <tr><td class="td-bold"><code>GET /catalog/categories/{categoryId}/products</code></td><td>Produtos por categoria, paginado (E1).</td></tr>
        <tr><td class="td-bold"><code>GET /catalog/products/{productId}</code></td><td>Detalhe do produto (PDP) com <code>installmentCount</code> / <code>installmentValue</code>.</td></tr>
        <tr><td class="td-bold"><code>GET /catalog/filters/metadata</code></td><td>Metadados do modal Ordenar/Filtrar — marcas, faixa de preço, sort, rating, flags (E2).</td></tr>
        <tr><td class="td-bold"><code>GET /catalog/search</code></td><td>Busca com query params <code>q</code>, <code>minPrice</code>, <code>maxPrice</code>, <code>minRating</code>, <code>freeShipping</code>, <code>express</code>, <code>brand</code>, <code>sortBy</code> (E2 / E4).</td></tr>
        <tr><td class="td-bold"><code>GET /catalog/search/suggestions</code></td><td>Sugestões e autocomplete de busca (E4).</td></tr>
        <tr><td class="td-bold"><code>GET /me/search-history</code></td><td>Histórico de busca do usuário (E4).</td></tr>
        <tr><td class="td-bold"><code>POST /me/search-history</code></td><td>Registrar busca — máx. 10 itens, deduplicado case-insensitive (E4).</td></tr>
        <tr><td class="td-bold"><code>DELETE /me/search-history</code></td><td>Limpar histórico (E4). <code>204</code>.</td></tr>
      </tbody>
    </table>
  </div>

  <h2>⭐ Avaliações (E3 / D3)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método / rota</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>GET /catalog/products/{productId}/reviews</code></td><td>Avaliações com média, total e distribuição por estrela (E3).</td></tr>
        <tr><td class="td-bold"><code>POST /catalog/products/{productId}/reviews</code></td><td>Escrever avaliação (D3) — JSON ou <code>multipart/form-data</code> com até 3 fotos.</td></tr>
        <tr><td class="td-bold"><code>POST /catalog/products/{productId}/reviews/{reviewId}/photos</code></td><td>Anexar foto a avaliação existente via <code>multipart/form-data</code> (D3).</td></tr>
      </tbody>
    </table>
  </div>

  <h2>❤️ Favoritos</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método / rota</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>GET /me/favorites</code></td><td>Listar favoritos (ids + produtos).</td></tr>
        <tr><td class="td-bold"><code>PUT /me/favorites/{productId}</code></td><td>Toggle favorito com <code>{ isFavorite }</code> (PDP / Home / Category).</td></tr>
      </tbody>
    </table>
  </div>

  <h2>🛒 Carrinho</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método / rota</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>GET /me/cart</code></td><td>Obter carrinho — itens, subtotal, <code>appliedCoupon</code> (null se vazio) e <code>shippingPreview</code>.</td></tr>
        <tr><td class="td-bold"><code>POST /me/cart/items</code></td><td>Adicionar item (<code>productId</code> + <code>quantity</code>) — retorna carrinho atualizado.</td></tr>
        <tr><td class="td-bold"><code>PATCH /me/cart/items/{productId}</code></td><td>Atualizar quantidade; <code>quantity: 0</code> remove o item.</td></tr>
        <tr><td class="td-bold"><code>DELETE /me/cart/items/{productId}</code></td><td>Remover item específico.</td></tr>
        <tr><td class="td-bold"><code>DELETE /me/cart</code></td><td>Limpar carrinho (automático após o pedido). <code>204</code>.</td></tr>
      </tbody>
    </table>
  </div>

  <h2>💳 Compra & Checkout (Épico C)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método / rota</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>GET /checkout/session</code></td><td>Estado unificado do checkout — <code>cart</code>, <code>session</code> e <code>preview</code> recalculado.</td></tr>
        <tr><td class="td-bold"><code>PATCH /checkout/session</code></td><td>Persiste seleções (endereço, envio, pagamento) e devolve preview. Use <code>POST /checkout/preview</code> só para simulação sem persistir.</td></tr>
        <tr><td class="td-bold"><code>POST /checkout/shipping-options</code></td><td>Cotação de frete por endereço + itens (C2).</td></tr>
        <tr><td class="td-bold"><code>GET /me/coupons</code></td><td>Listar cupons disponíveis (C3).</td></tr>
        <tr><td class="td-bold"><code>POST /checkout/coupons/validate</code></td><td>Validar/aplicar cupom (C3). Erros <code>404 COUPON_NOT_FOUND</code>, <code>422 COUPON_EXPIRED</code>.</td></tr>
        <tr><td class="td-bold"><code>POST /me/cart/coupon</code></td><td>Aplicar cupom via carrinho (alias de validate + persist) (C3).</td></tr>
        <tr><td class="td-bold"><code>DELETE /checkout/coupons</code></td><td>Remover cupom aplicado e recalcular preview (C3).</td></tr>
        <tr><td class="td-bold"><code>POST /checkout/preview</code></td><td>Resumo em tempo real — subtotal, frete, descontos, <code>pixDiscount</code>, parcelas, <code>canConfirm</code>.</td></tr>
        <tr><td class="td-bold"><code>POST /checkout/orders</code></td><td>Confirmar pedido (C4/C5). Requer header <code>Idempotency-Key</code>; <code>payment</code> aceita PIX, CARD ou BOLETO.</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-orange">
    <span class="alert-icon">⚠️</span>
    <div class="alert-body">
      <div class="alert-title">Confirmação de pedido é idempotente</div>
      <p>
        <code>POST /checkout/orders</code> exige <code>Idempotency-Key: &lt;uuid-v4&gt;</code> para evitar pedido duplicado em retry.
        Se a sessão já estiver completa (<code>canConfirm: true</code>), basta enviar <code>payment</code>; senão envie o body completo.
        <code>buyNow: true</code> (Comprar agora no PDP) substitui o carrinho atual pelos itens informados.
        A resposta <code>201</code> varia por método — PIX retorna QR Code + copia-e-cola, cartão retorna <code>authorizationCode</code>, boleto retorna linha digitável + PDF.
        Erros: <code>422 CHECKOUT_VALIDATION</code>, <code>402 PAYMENT_DECLINED</code>.
      </p>
    </div>
  </div>

  <h2>📦 Pedidos & Pós-compra (Épico D)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método / rota</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>GET /me/orders</code></td><td>Listar pedidos, paginado, filtro opcional por <code>status</code>.</td></tr>
        <tr><td class="td-bold"><code>GET /me/orders/{orderId}</code></td><td>Detalhe do pedido (D1). Suporta <code>ETag</code> / <code>If-None-Match</code> para polling (<code>304</code> se inalterado).</td></tr>
        <tr><td class="td-bold"><code>GET /me/orders/{orderId}/tracking</code></td><td>Rastreamento com timeline, transportadora e estimativa (D2).</td></tr>
        <tr><td class="td-bold"><code>POST /me/orders/{orderId}/buy-again</code></td><td>Comprar novamente — adiciona itens ao carrinho com merge de quantidades (D1).</td></tr>
        <tr><td class="td-bold"><code>GET /me/orders/{orderId}/invoice</code></td><td>Nota fiscal — URL do PDF, chave NF e data de emissão (D1).</td></tr>
        <tr><td class="td-bold"><code>POST /me/orders/{orderId}/cancel</code></td><td>Cancelar pedido (D1/D4). Erro <code>422 ORDER_NOT_CANCELLABLE</code> se já enviado.</td></tr>
        <tr><td class="td-bold"><code>POST /me/orders/{orderId}/returns</code></td><td>Solicitar devolução (D4). <code>reason</code>: DEFECT, WRONG_ITEM, REGRET_7_DAYS, NOT_AS_EXPECTED, OTHER.</td></tr>
        <tr><td class="td-bold"><code>GET /me/orders/{orderId}/returns/{returnId}</code></td><td>Consultar status da devolução (D4).</td></tr>
      </tbody>
    </table>
  </div>

  <h2>🔔 Engajamento (Épico F)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método / rota</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>GET /me/notifications</code></td><td>Listar notificações com <code>unreadCount</code>; filtro <code>unreadOnly</code> (F1).</td></tr>
        <tr><td class="td-bold"><code>PATCH /me/notifications/{notificationId}/read</code></td><td>Marcar notificação como lida (F1).</td></tr>
        <tr><td class="td-bold"><code>POST /me/notifications/read-all</code></td><td>Marcar todas como lidas — zera <code>unreadCount</code> (F1).</td></tr>
        <tr><td class="td-bold"><code>GET /support/faq</code></td><td>FAQ / Ajuda com tópicos de perguntas e respostas (F2).</td></tr>
        <tr><td class="td-bold"><code>GET /me/support/chat/messages</code></td><td>Histórico do chat de suporte com cursor <code>before</code> (F3).</td></tr>
        <tr><td class="td-bold"><code>POST /me/support/chat/messages</code></td><td>Enviar mensagem ao atendente; retorna <code>userMessage</code> + <code>agentMessage</code> (F3).</td></tr>
        <tr><td class="td-bold"><code>POST /me/support/tickets</code></td><td>Abrir ticket de suporte (alternativa ao chat) (F3).</td></tr>
      </tbody>
    </table>
  </div>

  <h2>📄 Conteúdo estático & CMS</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Método / rota</th><th>Descrição</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>GET /content/pages/{slug}</code></td><td>Páginas estáticas (B7). Slugs: <code>about</code>, <code>terms</code>, <code>privacy</code>.</td></tr>
        <tr><td class="td-bold"><code>GET /content/banners</code></td><td>Banners promocionais da Home com <code>action</code> (ex.: SEARCH).</td></tr>
      </tbody>
    </table>
  </div>

  <h2>📡 Webhooks / Real-time (opcional)</h2>
  <p>Canal sugerido: WebSocket <code>wss://api.citybox.com.br/v1/ws</code> ou SSE <code>GET /me/events</code>.</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Evento</th><th>Uso no app</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>order.status_changed</code></td><td>Substitui o timer mock de status — dispara push + refresh da aba Compras.</td></tr>
        <tr><td class="td-bold"><code>notification.created</code></td><td>Atualiza o badge do sino em tempo real.</td></tr>
        <tr><td class="td-bold"><code>chat.message_received</code></td><td>Nova mensagem na thread de suporte.</td></tr>
      </tbody>
    </table>
  </div>
  <p>Fallback por polling: <code>GET /me/orders/{orderId}</code> com <code>If-None-Match</code> a cada 20s enquanto o status for CONFIRMED, PREPARING ou SHIPPED.</p>

  <h2>🧩 Modelos-chave (wire × client)</h2>
  <p>O contrato é fonte de verdade; alguns campos diferem do mock Kotlin (Models.kt / AppState.kt).</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Campo / enum</th><th>BFF (wire)</th><th>App mock (client)</th></tr></thead>
      <tbody>
        <tr><td class="td-bold"><code>Product.brand</code></td><td>Campo explícito retornado pelo backend</td><td>Derivado por <code>MockData.productBrand()</code></td></tr>
        <tr><td class="td-bold"><code>Product.categoryId</code></td><td>Campo explícito</td><td>Só <code>category: String</code> no Product</td></tr>
        <tr><td class="td-bold"><code>Category.colorHex</code></td><td>String <code>"#E7F0FE"</code></td><td><code>Long</code> (<code>0xFFE7F0FE</code>); cliente converte</td></tr>
        <tr><td class="td-bold"><code>Order.status</code></td><td>Inclui CANCELLED, RETURN_REQUESTED, RETURNED</td><td>Só CONFIRMED → DELIVERED</td></tr>
        <tr><td class="td-bold"><code>Order.pixDiscount</code></td><td>Campo explícito no preview e no pedido</td><td>Calculado inline no <code>placeOrder()</code></td></tr>
        <tr><td class="td-bold"><code>SearchFilters</code></td><td>Query params stateless por requisição</td><td>Estado local persistido em <code>AppState.searchFilters</code></td></tr>
      </tbody>
    </table>
  </div>

  <h2>Resumo quantitativo</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Domínio</th><th>Endpoints</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Bootstrap & sessão</td><td>1</td></tr>
        <tr><td class="td-bold">Auth & onboarding</td><td>9</td></tr>
        <tr><td class="td-bold">Perfil & conta</td><td>4</td></tr>
        <tr><td class="td-bold">Endereços</td><td>6</td></tr>
        <tr><td class="td-bold">Pagamentos (cartões)</td><td>4</td></tr>
        <tr><td class="td-bold">Configurações & assinatura</td><td>5</td></tr>
        <tr><td class="td-bold">Catálogo & busca</td><td>11</td></tr>
        <tr><td class="td-bold">Favoritos</td><td>2</td></tr>
        <tr><td class="td-bold">Carrinho</td><td>5</td></tr>
        <tr><td class="td-bold">Checkout & sessão</td><td>9</td></tr>
        <tr><td class="td-bold">Pedidos & pós-compra</td><td>9</td></tr>
        <tr><td class="td-bold">Engajamento</td><td>6</td></tr>
        <tr><td class="td-bold">Conteúdo</td><td>2</td></tr>
        <tr><td class="td-bold">Total</td><td>73 endpoints</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
