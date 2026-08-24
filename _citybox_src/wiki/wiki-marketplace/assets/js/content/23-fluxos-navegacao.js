WIKI.register({
  id: 'fluxos-navegacao',
  title: 'Fluxos e navegação',
  icon: '🧭',
  searchText: 'fluxos navegacao maquina estados gatilhos cenarios e2e teste manual credenciais mock pix status pedido android ios CityBoxNav NavigationStack AuthRoute AccountRoute OrderRoute splash onboarding login register forgot checkout confirmation tracking orders account carrinho cart favoritos pdp productdetail coupons cupons advanceOrderStatus placeOrder paridade',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Pedido e Pós-venda</div>
    <h1 class="section-title">🧭 Fluxos e navegação</h1>
    <p class="section-subtitle">Mapa fiel ao código de navegação Android (<code>CityBoxNav.kt</code>) e iOS (<code>NavigationStack</code> + enums <code>AuthRoute</code> / <code>AccountRoute</code> / <code>OrderRoute</code>), as duas plataformas em paridade. Tudo é mock/em memória: ao reiniciar o app, o estado volta ao inicial.</p>
    <div class="section-tags">
      <span class="tag-indigo">Máquina de estados</span>
      <span class="tag-blue">Gatilhos</span>
      <span class="tag-violet">Cenários E2E</span>
    </div>
  </div>

  <div class="alert alert-blue">
    <span class="alert-icon">💡</span>
    <div class="alert-body">
      <div class="alert-title">Como ler este documento</div>
      <p><strong>§1</strong> mapa global (máquina de estados de alto nível). <strong>§2</strong> matriz de gatilhos: cada ação → destino, base para escrever os seletores de teste. <strong>§3</strong> diagramas por épico. <strong>§4</strong> estado mockado e regras (o que asserir nos testes). <strong>§5</strong> cenários E2E prontos (ID, pré-condição, passos, resultado esperado).</p>
    </div>
  </div>

  <h2>Credenciais e dados mock essenciais</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Item</th><th>Valor</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Login válido</td><td><code>camila@email.com</code> / <code>123456</code> (também aceita o telefone da Camila)</td></tr>
        <tr><td class="td-bold">Login Google</td><td><code>loginWithGoogle()</code> — sempre entra (simulado)</td></tr>
        <tr><td class="td-bold">Desconto PIX</td><td><strong>5%</strong> sobre o total (<code>totalBeforePix * 0.95</code>)</td></tr>
        <tr><td class="td-bold">Progressão de status</td><td>timer de <strong>20s</strong> enquanto a aba <strong>Compras</strong> está aberta (<code>advanceOrderStatus</code>)</td></tr>
        <tr><td class="td-bold">Status do pedido</td><td>CONFIRMED → PREPARING → SHIPPED → DELIVERED</td></tr>
        <tr><td class="td-bold">Categorias (atalhos Home)</td><td>ofertas, supermercado, moda, tecnologia, casa, beleza, esportes, <strong>cupons</strong> (especial)</td></tr>
      </tbody>
    </table>
  </div>

  <h2>1. Mapa global de navegação</h2>
  <div class="mermaid">
stateDiagram-v2
    [*] --> Splash
    Splash --> Onboarding: 1a execucao
    Splash --> Login: ja viu onboarding
    Splash --> MainTabs: ja logado

    Onboarding --> Login: Comecar / Pular

    state "Fluxo Auth (deslogado)" as Auth {
        Login --> Register: Criar conta
        Login --> Forgot: Esqueci minha senha
        Login --> StaticAuth: Termos / Privacidade
        Register --> Login: Ja tenho conta / voltar
        Forgot --> Login: voltar / Voltar ao login
        StaticAuth --> Login: voltar
    }

    Login --> MainTabs: login OK / Google / cadastro
    MainTabs --> Login: Logout (Conta)

    state "App logado (5 abas)" as MainTabs {
        [*] --> Home
        Home --> Favoritos
        Favoritos --> Carrinho
        Carrinho --> Compras
        Compras --> Conta
    }

    MainTabs --> [*]
  </div>
  <div class="mermaid-caption">Máquina de estados de alto nível: Splash decide entre Onboarding, Login ou MainTabs conforme o estado mock (<code>hasSeenOnboarding</code>, <code>isLoggedIn</code>).</div>

  <h2>2. Matriz de gatilhos (origem → ação → destino)</h2>
  <p>Cada linha é uma <strong>aresta de navegação</strong> real. Use como checklist de cobertura E2E.</p>

  <h3>Auth</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Origem</th><th>Ação (gatilho)</th><th>Destino</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Splash</td><td>timer (~1.75s)</td><td>Onboarding / Login / MainTabs (conforme estado)</td></tr>
        <tr><td class="td-bold">Onboarding</td><td>"Começar" ou "Pular"</td><td>Login (marca <code>hasSeenOnboarding</code>)</td></tr>
        <tr><td class="td-bold">Login</td><td>"Entrar" (creds válidas)</td><td>MainTabs/Home</td></tr>
        <tr><td class="td-bold">Login</td><td>"Entrar" (creds inválidas)</td><td>permanece + mensagem de erro</td></tr>
        <tr><td class="td-bold">Login</td><td>"Entrar com Google"</td><td>MainTabs/Home</td></tr>
        <tr><td class="td-bold">Login</td><td>"Criar conta"</td><td>Register</td></tr>
        <tr><td class="td-bold">Login</td><td>"Esqueci minha senha"</td><td>Forgot</td></tr>
        <tr><td class="td-bold">Login</td><td>"Termos" / "Privacidade"</td><td>StaticPage(terms/privacy)</td></tr>
        <tr><td class="td-bold">Register</td><td>"Criar conta" (válido)</td><td>MainTabs/Home (loga)</td></tr>
        <tr><td class="td-bold">Register</td><td>"Já tenho conta" / voltar</td><td>Login</td></tr>
        <tr><td class="td-bold">Forgot</td><td>"Enviar link"</td><td>estado sucesso "E-mail enviado ✓" (mesma tela)</td></tr>
        <tr><td class="td-bold">Forgot</td><td>voltar</td><td>Login</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Abas principais (bottom nav / TabView)</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Aba</th><th>Tela raiz</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Início</td><td>Home</td></tr>
        <tr><td class="td-bold">Favoritos</td><td>Favorites</td></tr>
        <tr><td class="td-bold">Carrinho</td><td>Cart (badge = nº de itens)</td></tr>
        <tr><td class="td-bold">Compras</td><td>Orders</td></tr>
        <tr><td class="td-bold">Conta</td><td>Account</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Home / Descoberta</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Origem</th><th>Ação</th><th>Destino</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Home (header)</td><td>tap busca</td><td>Search</td></tr>
        <tr><td class="td-bold">Home (header)</td><td>sino</td><td>Notifications</td></tr>
        <tr><td class="td-bold">Home (header)</td><td>carrinho</td><td>aba Carrinho</td></tr>
        <tr><td class="td-bold">Home</td><td>atalho categoria (ex.: "Tecnologia")</td><td>Category(id)</td></tr>
        <tr><td class="td-bold">Home</td><td>atalho <strong>"Cupons"</strong></td><td>Coupons</td></tr>
        <tr><td class="td-bold">Home</td><td>banner "Semana do Consumidor"</td><td>Search</td></tr>
        <tr><td class="td-bold">Home</td><td>"Ver tudo" / "Mais vendidos"</td><td>Search</td></tr>
        <tr><td class="td-bold">Home / Category / Search / Favorites</td><td>tap em produto</td><td>ProductDetail(id)</td></tr>
        <tr><td class="td-bold">Search</td><td>focar campo vazio</td><td>histórico + sugestões</td></tr>
        <tr><td class="td-bold">Search</td><td>"Ordenar" / "Filtrar"</td><td>FiltersSheet (modal)</td></tr>
        <tr><td class="td-bold">Category</td><td>tap produto</td><td>ProductDetail(id)</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Produto (PDP)</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Origem</th><th>Ação</th><th>Destino</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">ProductDetail</td><td>"Adicionar ao carrinho"</td><td>aba Carrinho (item +1)</td></tr>
        <tr><td class="td-bold">ProductDetail</td><td>"Comprar agora"</td><td>Checkout</td></tr>
        <tr><td class="td-bold">ProductDetail</td><td>toggle favorito ♥</td><td>atualiza favoritos (mesma tela)</td></tr>
        <tr><td class="td-bold">ProductDetail</td><td>"Ver avaliações"</td><td>Reviews(id)</td></tr>
        <tr><td class="td-bold">ProductDetail</td><td>ícone carrinho (toolbar)</td><td>aba Carrinho</td></tr>
        <tr><td class="td-bold">Reviews</td><td>"Escrever avaliação"</td><td>WriteReview(id)</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Compra (Cart → Checkout → Confirmação)</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Origem</th><th>Ação</th><th>Destino</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Cart</td><td>"Continuar" / "Finalizar compra"</td><td>Checkout</td></tr>
        <tr><td class="td-bold">Cart (vazio)</td><td>"Ver ofertas"</td><td>aba Início</td></tr>
        <tr><td class="td-bold">Cart / Checkout</td><td>campo/atalho cupom</td><td>Coupons</td></tr>
        <tr><td class="td-bold">Checkout</td><td>"Alterar" endereço</td><td>AddressList (modo seleção)</td></tr>
        <tr><td class="td-bold">Checkout</td><td>seção Envio</td><td>ShippingOptions</td></tr>
        <tr><td class="td-bold">Checkout</td><td>Pagamento → "Adicionar cartão"</td><td>CardForm</td></tr>
        <tr><td class="td-bold">Checkout</td><td>"Confirmar pedido"</td><td>Confirmation(orderId) — remove Checkout do back stack</td></tr>
        <tr><td class="td-bold">Confirmation</td><td>"Acompanhar pedido"</td><td>Tracking(orderId) + seleciona aba <strong>Compras</strong></td></tr>
        <tr><td class="td-bold">Confirmation</td><td>"Voltar ao início"</td><td>aba <strong>Início</strong> (reseta stack do carrinho no iOS)</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Conta</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Origem</th><th>Ação</th><th>Destino</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Account</td><td>"Editar perfil"</td><td>EditProfile</td></tr>
        <tr><td class="td-bold">Account</td><td>banner "Gerenciar" (CityBox+)</td><td>Subscription</td></tr>
        <tr><td class="td-bold">Account</td><td>"Meus pedidos"</td><td>aba Compras</td></tr>
        <tr><td class="td-bold">Account</td><td>"Favoritos"</td><td>aba Favoritos</td></tr>
        <tr><td class="td-bold">Account</td><td>"Endereços"</td><td>AddressList</td></tr>
        <tr><td class="td-bold">Account</td><td>"Meus Cartões"</td><td>PaymentMethods</td></tr>
        <tr><td class="td-bold">Account</td><td>"Cupons"</td><td>Coupons</td></tr>
        <tr><td class="td-bold">Account</td><td>"Notificações"</td><td>Notifications</td></tr>
        <tr><td class="td-bold">Account</td><td>"Ajuda e Suporte"</td><td>Help</td></tr>
        <tr><td class="td-bold">Account</td><td>"Configurações"</td><td>Settings</td></tr>
        <tr><td class="td-bold">Account</td><td>"Sobre" / "Termos" / "Privacidade"</td><td>StaticPage(tipo)</td></tr>
        <tr><td class="td-bold">Account</td><td>"Sair"</td><td>Login (isLoggedIn=false)</td></tr>
        <tr><td class="td-bold">AddressList</td><td>"Adicionar endereço"</td><td>AddressForm (novo)</td></tr>
        <tr><td class="td-bold">AddressList</td><td>editar item</td><td>AddressForm(id)</td></tr>
        <tr><td class="td-bold">AddressList (modo seleção)</td><td>tap endereço</td><td>volta (seleciona)</td></tr>
        <tr><td class="td-bold">PaymentMethods</td><td>"Adicionar cartão"</td><td>CardForm</td></tr>
        <tr><td class="td-bold">Help</td><td>"Falar com atendente"</td><td>Chat</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Pós-compra</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Origem</th><th>Ação</th><th>Destino</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Orders</td><td>tap no card</td><td>OrderDetail(id)</td></tr>
        <tr><td class="td-bold">Orders (vazio)</td><td>"Explorar"</td><td>aba Início</td></tr>
        <tr><td class="td-bold">OrderDetail</td><td>"Rastrear"</td><td>Tracking(id)</td></tr>
        <tr><td class="td-bold">OrderDetail</td><td>"Avaliar produtos"</td><td>WriteReview(produto)</td></tr>
        <tr><td class="td-bold">OrderDetail</td><td>"Cancelar / Devolver"</td><td>Return(id)</td></tr>
        <tr><td class="td-bold">OrderDetail</td><td>"Comprar novamente"</td><td>adiciona itens ao carrinho + aba Carrinho</td></tr>
        <tr><td class="td-bold">OrderDetail</td><td>"Nota fiscal"</td><td>mock (sem navegação)</td></tr>
        <tr><td class="td-bold">Return</td><td>"Solicitar devolução"</td><td>confirmação (mock)</td></tr>
        <tr><td class="td-bold">WriteReview</td><td>"Enviar"</td><td>volta (grava review)</td></tr>
      </tbody>
    </table>
  </div>

  <h2>3. Diagramas por épico</h2>

  <h3>3.1 Autenticação (Épico A)</h3>
  <div class="mermaid">
flowchart TD
    Splash(["Splash ~1.75s"]) --> Q{"hasSeenOnboarding?"}
    Q -- nao --> Onb["Onboarding 3 slides"]
    Q -- sim --> Login["Login"]
    Onb -->|"Comecar / Pular"| Login

    Login -->|"Criar conta"| Reg["Register"]
    Login -->|"Esqueci senha"| Fgt["Forgot Password"]
    Login -->|"Termos / Privacidade"| StA["StaticPage"]
    Reg -->|"Ja tenho conta / voltar"| Login
    Fgt -->|"voltar"| Login
    StA -->|"voltar"| Login

    Login -->|"creds invalidas"| LoginErr["Erro inline"]
    LoginErr -.-> Login
    Login -->|"camila@email.com / 123456"| Main
    Login -->|"Google"| Main
    Reg -->|"cadastro valido"| Main[("MainTabs / Home")]
  </div>

  <h3>3.2 Navegação principal + Descoberta (Épico E)</h3>
  <div class="mermaid">
flowchart TD
    subgraph Tabs["5 abas"]
        Home["Inicio"]
        Fav["Favoritos"]
        Cart["Carrinho"]
        Ord["Compras"]
        Acc["Conta"]
    end

    Home -->|"busca"| Search["Search"]
    Home -->|"sino"| Notif["Notifications"]
    Home -->|"atalho Cupons"| Coup["Coupons"]
    Home -->|"atalho categoria"| Cat["Category"]
    Home -->|"banner / Ver tudo"| Search
    Home -->|"produto"| PDP["ProductDetail"]

    Search -->|"campo vazio"| Hist["Historico + sugestoes"]
    Search -->|"Ordenar / Filtrar"| Filt["FiltersSheet"]
    Search -->|"produto"| PDP
    Cat -->|"produto"| PDP
    Fav -->|"produto"| PDP

    PDP -->|"Ver avaliacoes"| Rev["Reviews"]
    Rev -->|"Escrever avaliacao"| WR["WriteReview"]
  </div>

  <h3>3.3 Compra ponta a ponta (Épicos C + caminho crítico)</h3>
  <div class="mermaid">
flowchart TD
    PDP["ProductDetail"] -->|"Adicionar ao carrinho"| CartTab["aba Carrinho"]
    PDP -->|"Comprar agora"| Chk["Checkout"]
    CartTab --> Cart["Cart"]
    Cart -->|"Finalizar compra"| Chk

    Chk -->|"Alterar endereco"| AddrSel["AddressList selecao"]
    Chk -->|"Envio"| Ship["ShippingOptions"]
    Chk -->|"Cupom"| Coup["Coupons"]
    Chk -->|"Adicionar cartao"| Card["CardForm"]
    AddrSel -->|"seleciona"| Chk
    Ship -->|"seleciona"| Chk
    Coup -->|"aplica"| Chk
    Card -->|"salva"| Chk

    Chk -->|"Confirmar pedido"| Conf["Confirmation"]
    Conf -->|"Acompanhar pedido"| Trk["Tracking + aba Compras"]
    Conf -->|"Voltar ao inicio"| Home["aba Inicio"]
  </div>
  <div class="mermaid-caption">Detalhe importante para E2E: ao confirmar, o <strong>Checkout é removido do back stack</strong> (<code>popUpTo(CHECKOUT){inclusive=true}</code>). Voltar da Confirmação <strong>não</strong> retorna ao Checkout.</div>

  <h3>3.4 Conta (Épico B)</h3>
  <div class="mermaid">
flowchart TD
    Acc["Account"] -->|"Editar perfil"| EP["EditProfile"]
    Acc -->|"Gerenciar CityBox+"| Sub["Subscription"]
    Acc -->|"Meus pedidos"| OrdTab["aba Compras"]
    Acc -->|"Favoritos"| FavTab["aba Favoritos"]
    Acc -->|"Enderecos"| AL["AddressList"]
    Acc -->|"Meus Cartoes"| PM["PaymentMethods"]
    Acc -->|"Cupons"| Coup["Coupons"]
    Acc -->|"Notificacoes"| Notif["Notifications"]
    Acc -->|"Ajuda e Suporte"| Help["Help"]
    Acc -->|"Configuracoes"| Set["Settings"]
    Acc -->|"Sobre / Termos / Privacidade"| SP["StaticPage"]
    Acc -->|"Sair"| Login[("Login")]

    AL -->|"Adicionar"| AF["AddressForm"]
    AL -->|"Editar item"| AF
    PM -->|"Adicionar cartao"| CF["CardForm"]
    Help -->|"Falar com atendente"| Chat["Chat"]
  </div>

  <h3>3.5 Pós-compra (Épico D)</h3>
  <div class="mermaid">
flowchart TD
    Ord["Orders"] -->|"tap card"| OD["OrderDetail"]
    Ord -. "timer 20s" .-> Adv["advanceOrderStatus"]
    Adv -.-> Ord

    OD -->|"Rastrear"| Trk["Tracking"]
    OD -->|"Avaliar produtos"| WR["WriteReview"]
    OD -->|"Cancelar / Devolver"| Ret["Return"]
    OD -->|"Comprar novamente"| CartTab["aba Carrinho + itens"]
    OD -->|"Nota fiscal"| Inv["mock, sem navegacao"]

    Ret -->|"Solicitar devolucao"| RetOK["Confirmacao devolucao"]
    WR -->|"Enviar"| ODback["volta + grava review"]
  </div>

  <h3>3.6 Engajamento (Épico F)</h3>
  <div class="mermaid">
flowchart TD
    Notif["Notifications"] -->|"marcar todas como lidas"| NotifRead["lista zerada"]
    Help["Help"] -->|"topico FAQ"| FAQexp["expande/colapsa"]
    Help -->|"Falar com atendente"| Chat["Chat"]
    Chat -->|"enviar mensagem"| ChatThread["adiciona a thread + resposta mock"]
  </div>

  <h2>4. Estado mockado e regras (o que asserir)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Estado / regra</th><th>Comportamento esperado</th><th>Onde testar</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Badge do carrinho</td><td>reflete a soma das quantidades</td><td>header Home, aba Carrinho</td></tr>
        <tr><td class="td-bold">Favorito (♥)</td><td>toggle imediato; aparece/some da aba Favoritos</td><td>PDP, Home, Favoritos</td></tr>
        <tr><td class="td-bold">Desconto PIX</td><td>total cai 5% quando pagamento = PIX</td><td>Checkout, Confirmation</td></tr>
        <tr><td class="td-bold">Cupom</td><td>aplica desconto e mostra na revisão</td><td>Cart/Checkout/Coupons</td></tr>
        <tr><td class="td-bold">Endereço selecionado</td><td>reflete no Checkout após escolher</td><td>Checkout</td></tr>
        <tr><td class="td-bold">Opção de envio</td><td>preço/prazo mudam total e PDP ("chega em…")</td><td>Checkout, PDP</td></tr>
        <tr><td class="td-bold"><code>placeOrder()</code></td><td>cria pedido com id <code>CB-xxxxxx</code>, limpa carrinho</td><td>Confirmation, Orders</td></tr>
        <tr><td class="td-bold">Progressão de status</td><td>a cada 20s na aba Compras avança 1 estágio</td><td>Orders, Tracking</td></tr>
        <tr><td class="td-bold">Comprar novamente</td><td>itens do pedido entram no carrinho</td><td>OrderDetail → Carrinho</td></tr>
        <tr><td class="td-bold">Notificações não lidas</td><td>badge no sino; "marcar todas" zera</td><td>Home header, Notifications</td></tr>
        <tr><td class="td-bold">Logout</td><td>volta ao Login; estado de sessão reseta</td><td>Account</td></tr>
        <tr><td class="td-bold">Reset ao reiniciar</td><td>nada persiste (sem backend)</td><td>global</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-orange">
    <span class="alert-icon">⚠️</span>
    <div class="alert-body">
      <div class="alert-title">Paridade Android × iOS</div>
      <p>Mesmas telas, mesmos gatilhos e mesmos destinos nas duas plataformas. <strong>Android</strong>: 1 <code>NavHost</code> raiz (<code>MainNav</code>) + <code>NavHost</code> das abas; troca de aba via <code>requestTab</code>. <strong>iOS</strong>: <code>TabView</code> com 1 <code>NavigationStack</code> por aba; troca via <code>requestTab(index)</code>; o stack do <strong>Carrinho</strong> é resetado por <code>cartStackResetToken</code> ao finalizar a compra. Em ambos, a Confirmação remove o Checkout do histórico — o teste de "voltar" deve esperar a aba (Início/Compras), nunca o Checkout.</p>
    </div>
  </div>

  <h2>5. Cenários E2E (prontos para automatizar)</h2>
  <p>Formato: <strong>ID · pré-condição · passos · resultado esperado (assert)</strong>. Cobrem caminho feliz + ramificações principais. Numerados por épico.</p>

  <h3>Auth</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>ID</th><th>Pré-condição</th><th>Passos (resumo)</th><th>Resultado esperado</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">E2E-A01</td><td>app recém-instalado</td><td>abrir → Splash → ver 3 slides → "Começar"</td><td>chega no Login; reabrir vai direto ao Login (não repete onboarding)</td></tr>
        <tr><td class="td-bold">E2E-A02</td><td>na tela de Login</td><td>digitar <code>camila@email.com</code> / <code>123456</code> → "Entrar"</td><td>chega na Home com as 5 abas</td></tr>
        <tr><td class="td-bold">E2E-A03</td><td>na tela de Login</td><td>digitar e-mail/senha errados → "Entrar"</td><td>permanece no Login + mensagem de erro; não navega</td></tr>
        <tr><td class="td-bold">E2E-A04</td><td>na tela de Login</td><td>"Entrar com Google"</td><td>chega na Home</td></tr>
        <tr><td class="td-bold">E2E-A05</td><td>na tela de Login</td><td>"Criar conta" → preencher campos válidos + aceitar termos → "Criar conta"</td><td>loga e chega na Home</td></tr>
        <tr><td class="td-bold">E2E-A06</td><td>na tela de Login</td><td>"Esqueci minha senha" → e-mail → "Enviar link" → "Redefinir senha" (mock) → nova senha + confirmar → "Salvar"</td><td>"E-mail enviado ✓"; volta ao Login; login com nova senha chega na Home; senhas divergentes ou &lt; 4 chars mostram erro inline</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Compra (caminho crítico)</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>ID</th><th>Pré-condição</th><th>Passos (resumo)</th><th>Resultado esperado</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">E2E-C01</td><td>logado, na Home</td><td>produto → "Adicionar ao carrinho" → aba Carrinho → "Finalizar compra" → manter PIX → "Confirmar pedido"</td><td>badge subiu antes; Confirmation com total <strong>5% off</strong>; carrinho vazio; pedido aparece em Compras</td></tr>
        <tr><td class="td-bold">E2E-C02</td><td>logado, na Home</td><td>produto → "Comprar agora"</td><td>vai direto ao Checkout sem passar pelo carrinho</td></tr>
        <tr><td class="td-bold">E2E-C03</td><td>no Checkout</td><td>"Alterar" → escolher outro endereço</td><td>volta ao Checkout exibindo o endereço escolhido</td></tr>
        <tr><td class="td-bold">E2E-C04</td><td>no Checkout</td><td>seção Envio → escolher "Express"</td><td>total e prazo atualizam</td></tr>
        <tr><td class="td-bold">E2E-C05</td><td>no Cart/Checkout</td><td>Cupons → aplicar código → voltar</td><td>desconto aparece no resumo</td></tr>
        <tr><td class="td-bold">E2E-C06</td><td>no Checkout</td><td>pagamento "Cartão" → "Adicionar cartão" → preencher → salvar</td><td>cartão selecionável; total <strong>sem</strong> o 5% do PIX</td></tr>
        <tr><td class="td-bold">E2E-C07</td><td>pedido recém-criado</td><td>Confirmation → "Acompanhar pedido"</td><td>abre Tracking e a aba <strong>Compras</strong> fica ativa</td></tr>
        <tr><td class="td-bold">E2E-C08</td><td>na Confirmation</td><td>"Voltar ao início"</td><td>aba <strong>Início</strong> ativa; back stack do carrinho resetado (não volta ao Checkout/Confirmation)</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Descoberta</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>ID</th><th>Pré-condição</th><th>Passos (resumo)</th><th>Resultado esperado</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">E2E-E01</td><td>na Home</td><td>atalho "Tecnologia"</td><td>Category filtrada só com produtos da categoria</td></tr>
        <tr><td class="td-bold">E2E-E02</td><td>na Home</td><td>atalho "Cupons"</td><td>tela Coupons (não Category)</td></tr>
        <tr><td class="td-bold">E2E-E03</td><td>na Home</td><td>busca → digitar termo → "Filtrar"/"Ordenar" → aplicar</td><td>resultados respeitam filtro/ordenação</td></tr>
        <tr><td class="td-bold">E2E-E04</td><td>busca já feita</td><td>voltar → focar campo vazio</td><td>termo aparece no histórico/sugestões</td></tr>
        <tr><td class="td-bold">E2E-E05</td><td>na PDP</td><td>"Ver avaliações"</td><td>média + distribuição + lista de reviews</td></tr>
        <tr><td class="td-bold">E2E-E06</td><td>na tela Reviews</td><td>"Escrever avaliação" → estrelas + texto → "Enviar"</td><td>volta e a nova review aparece na lista</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Conta</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>ID</th><th>Pré-condição</th><th>Passos (resumo)</th><th>Resultado esperado</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">E2E-B01</td><td>na Conta</td><td>"Editar perfil" → mudar nome → "Salvar"</td><td>nome atualizado na Conta e no header da Home ("Enviar para …")</td></tr>
        <tr><td class="td-bold">E2E-B02</td><td>na Conta</td><td>Endereços → "Adicionar" → salvar; editar; definir padrão</td><td>lista reflete adição/edição/padrão</td></tr>
        <tr><td class="td-bold">E2E-B03</td><td>na Conta</td><td>Meus Cartões → "Adicionar cartão" → preencher → salvar</td><td>cartão na lista com bandeira + final ****</td></tr>
        <tr><td class="td-bold">E2E-B04</td><td>na Conta</td><td>banner "Gerenciar"</td><td>tela de assinatura com benefícios e renovação</td></tr>
        <tr><td class="td-bold">E2E-B05</td><td>na Conta</td><td>"Termos" / "Sobre" / "Privacidade"</td><td>título + texto correspondente</td></tr>
        <tr><td class="td-bold">E2E-B06</td><td>na Conta</td><td>Configurações → alternar toggles</td><td>toggles mudam de estado</td></tr>
        <tr><td class="td-bold">E2E-B07</td><td>na Conta</td><td>"Sair"</td><td>volta ao Login</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Pós-compra</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>ID</th><th>Pré-condição</th><th>Passos (resumo)</th><th>Resultado esperado</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">E2E-D01</td><td>na aba Compras</td><td>tap no card</td><td>OrderDetail com itens, endereço, pagamento, resumo, ações</td></tr>
        <tr><td class="td-bold">E2E-D02</td><td>na aba Compras</td><td>aguardar ~20s (ou múltiplos)</td><td>status avança CONFIRMED → PREPARING → SHIPPED → DELIVERED</td></tr>
        <tr><td class="td-bold">E2E-D03</td><td>no OrderDetail</td><td>"Rastrear"</td><td>Tracking com timeline/timestamps</td></tr>
        <tr><td class="td-bold">E2E-D04</td><td>no OrderDetail</td><td>"Comprar novamente"</td><td>itens entram no carrinho e a aba Carrinho fica ativa</td></tr>
        <tr><td class="td-bold">E2E-D05</td><td>no OrderDetail</td><td>"Cancelar/Devolver" → item + motivo → "Solicitar devolução"</td><td>tela/estado de confirmação de devolução</td></tr>
        <tr><td class="td-bold">E2E-D06</td><td>no OrderDetail</td><td>"Avaliar produtos" → estrelas + texto → "Enviar"</td><td>volta; review registrada</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Engajamento e estados vazios</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>ID</th><th>Pré-condição</th><th>Passos (resumo)</th><th>Resultado esperado</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">E2E-F01</td><td>na Home</td><td>sino → "marcar todas como lidas"</td><td>badge do sino zera; itens deixam de aparecer como não-lidos</td></tr>
        <tr><td class="td-bold">E2E-F02</td><td>na tela Ajuda</td><td>tap em um tópico</td><td>expande/colapsa a resposta</td></tr>
        <tr><td class="td-bold">E2E-F03</td><td>na tela Ajuda</td><td>"Falar com atendente" → digitar → enviar</td><td>mensagem entra na thread + resposta mock aparece</td></tr>
        <tr><td class="td-bold">E2E-V01</td><td>carrinho vazio</td><td>"Ver ofertas"</td><td>leva à aba Início</td></tr>
        <tr><td class="td-bold">E2E-V02</td><td>favoritos vazio</td><td>"Explorar"</td><td>leva à aba Início</td></tr>
        <tr><td class="td-bold">E2E-V03</td><td>compras vazio</td><td>"Explorar"</td><td>leva à aba Início</td></tr>
      </tbody>
    </table>
  </div>
</div>
`
});
