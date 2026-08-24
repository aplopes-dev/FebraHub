/// Tokens visuais do PDV — **este é o arquivo que você edita para mudar a cara
/// do app.**
///
/// Nenhuma tela deve escrever `Color(0xFF...)`, `BorderRadius.circular(12)` ou
/// `TextStyle(fontSize: 16)` direto. Tudo sai daqui. O motivo é simples: quando
/// a identidade visual mudar, muda um valor neste arquivo — não trinta telas.
///
/// A tradução destes tokens para o `ThemeData` do Material vive em
/// `pdv_theme.dart`, que você raramente precisa abrir.
library;

import 'package:flutter/material.dart';

// =============================================================================
// CORES
// =============================================================================

/// Paleta do PDV.
///
/// **Paleta única, escura.** O PDV não tem modo claro: o terminal fica ligado o
/// turno inteiro, muitas vezes de frente para uma vitrine, e uma tela clara
/// nesse cenário vira espelho. Um tema só também elimina a classe inteira de
/// bug em que uma tela é conferida num modo e quebra no outro.
///
/// A escala é **neutra e de alto contraste** de propósito. O PDV é lido a
/// distância de braço, em pé, muitas vezes sob luz forte de loja — cor
/// decorativa atrapalha, cor com significado ajuda. Sempre que possível a cor
/// carrega informação (pago, atrasado, sem estoque), não enfeite.
///
/// As superfícies são medidas a partir de [background] (#2F2F2F): cada uma é
/// mais clara que ele, na ordem em que "sobe" na tela. Sobre fundo escuro é a
/// luz que marca elevação e limite — não a sombra.
abstract final class PdvColors {
  // --- Marca ---------------------------------------------------------------

  /// Cor de ação primária: confirmar venda, avançar, item selecionado.
  ///
  /// **Ponto de troca da identidade.** É o primeiro valor a mudar quando a cor
  /// oficial da Citybox for definida — todo o resto do tema deriva dela.
  static const Color brand = Color(0xFF1D4ED8);

  /// Estado pressionado/hover da ação primária.
  static const Color brandStrong = Color(0xFF2C63EF);

  /// Fundo sutil para superfícies de destaque ligadas à marca.
  static const Color brandSurface = Color(0xFF1B2A4A);

  /// Texto e ícone sobre [brand].
  static const Color onBrand = Color(0xFFFFFFFF);

  // --- Superfícies ---------------------------------------------------------

  /// **Fundo da aplicação — o cinza base do sistema.**
  ///
  /// É a faixa que aparece nos vãos entre os blocos da tela inicial, na
  /// moldura ao redor da área operacional do Balcão e atrás de tudo. Toda
  /// superfície elevada é medida a partir daqui: mais clara que este valor,
  /// nunca mais escura.
  ///
  /// A app bar usa tom próprio (`PdvAppBarColors.background`) — mais escuro
  /// que este fundo — para marcar a moldura sem fundir barra e conteúdo.
  static const Color background = Color(0xFF2F2F2F);

  /// Paper: cartões, painéis, diálogos, gaveta — tudo que "flutua" sobre o
  /// fundo.
  static const Color surface = Color(0xFF404040);

  /// Preenchimento sutil: linha alternada de tabela, campo desabilitado,
  /// estado inativo de um seletor.
  static const Color surfaceMuted = Color(0xFF4A4A4A);

  /// Fundo de campo de texto (`TextField`, `TextFormField`).
  ///
  /// Um degrau acima de [surface]: o campo precisa se destacar do cartão em
  /// que está, não se fundir a ele.
  static const Color inputFill = Color(0xFF4A4A4A);

  /// Superfície flutuante de destaque: tooltip, toast. Mais **escura** que o
  /// fundo, não mais clara — é o que a faz ler como algo por cima da tela, e
  /// não como mais um painel dela.
  static const Color surfaceOverlay = Color(0xFF1A1A1A);

  // --- Traço ---------------------------------------------------------------

  /// Borda padrão de cartão, campo e divisória.
  static const Color border = Color(0xFF5A5A5A);

  /// Borda de maior peso: separação entre painéis, campo em hover.
  static const Color borderStrong = Color(0xFF6E6E6E);

  /// Anel de foco. Precisa ser visível a 60 cm num tablet — não o suavize.
  /// Clareado em relação a [brand], que sobre um campo escuro quase some.
  static const Color focusRing = Color(0xFF4FA3E8);

  // --- Texto ---------------------------------------------------------------

  static const Color textPrimary = Color(0xFFF0F0F0);
  static const Color textSecondary = Color(0xFFB8BEC6);

  /// Placeholder e conteúdo desabilitado. Não use para texto que precisa ser
  /// lido — o contraste é intencionalmente baixo.
  static const Color textDisabled = Color(0xFF8D949C);

  /// Texto sobre [surfaceOverlay].
  static const Color textOverlay = Color(0xFFF7F8FA);

  /// Véu atrás de diálogo e folha lateral.
  ///
  /// Bem mais claro que o `black54` que o Flutter usa por padrão: o app
  /// **inteiro** já é escuro, então 54% de preto por cima quase apaga a tela e
  /// o operador perde a referência de onde estava. O papel do véu aqui é dizer
  /// "o que está atrás não recebe toque agora", não esconder o fundo.
  ///
  /// Vale para todo diálogo (via `dialogTheme.barrierColor`) e para as folhas
  /// laterais, que passam este valor no `showGeneralDialog`.
  static const Color barrier = Color(0x52000000);

  /// Véu escuro para escurecer uma superfície **colorida** — o hover e o
  /// pressionado dos blocos da tela inicial.
  ///
  /// Existe como token próprio, e não como um `textPrimary` reaproveitado:
  /// os blocos têm cor cheia e saturada, e escurecê-los é o que marca o toque.
  /// Amarrar isso à cor do texto faria a mudança de um arrastar o outro.
  static const Color shade = Color(0xFF000000);

  // --- Semânticas ----------------------------------------------------------
  //
  // Calibradas para **fundo escuro**: são os tons claros de cada semântica, com
  // a superfície correspondente em versão profunda. Cada tom vem em par — a cor
  // cheia (texto, ícone, borda) e a superfície (fundo de selo, faixa de
  // alerta). Usar a cor cheia como fundo de bloco grande satura a tela e
  // destrói a hierarquia.

  /// Venda aprovada, pagamento confirmado, estoque saudável.
  static const Color success = Color(0xFF4ADE80);
  static const Color successSurface = Color(0xFF14301F);

  /// Estoque abaixo do mínimo, pedido atrasado, pendência de conferência.
  static const Color warning = Color(0xFFFBBF24);
  static const Color warningSurface = Color(0xFF3A2E12);

  /// Cancelamento, exclusão, saldo insuficiente, falha de impressão.
  static const Color danger = Color(0xFFF87171);
  static const Color dangerSurface = Color(0xFF3A1D1D);

  /// Informação neutra: comanda aberta, sincronização em curso.
  static const Color info = Color(0xFF4FA3E8);
  static const Color infoSurface = Color(0xFF16304A);
}

/// Cores da barra de título.
///
/// A barra é a superfície **mais escura** do app — o app inteiro é escuro, e
/// ela é o fundo dessa escala. Paleta própria porque afunda abaixo de
/// `PdvColors.background`, e as semânticas de lá foram calibradas contra
/// aquele cinza, não contra este quase-preto.
///
/// Os tons semânticos aqui estão todos acima de 4,5:1 sobre [background]. Ao
/// mexer em algum, verifique o contraste: um indicador de sincronização
/// ilegível é pior que nenhum.
abstract final class PdvTitleBarColors {
  static const Color background = Color(0xFF121417);

  /// Separa a barra do conteúdo. Mais clara que o fundo, não mais escura —
  /// sombra não funciona sobre preto.
  static const Color border = Color(0xFF2A2E36);

  /// Texto principal: nome do app, hora, operador.
  static const Color foreground = Color(0xFFF2F4F7);

  /// Texto de apoio: data.
  static const Color foregroundMuted = Color(0xFFA8B0BA);

  /// Texto discreto: versão do app.
  static const Color foregroundSubtle = Color(0xFF838C98);

  /// Realce ao passar o ponteiro sobre um controle da barra.
  static const Color hover = Color(0x1AFFFFFF);

  /// Fechar janela — o único controle que acende em cor cheia, para não ser
  /// tocado por engano no meio de uma venda.
  static const Color closeHover = Color(0xFFC62828);

  // --- Semânticas em fundo escuro -----------------------------------------

  static const Color success = Color(0xFF4ADE80);
  static const Color warning = Color(0xFFFBBF24);
  static const Color danger = Color(0xFFF87171);

  /// Fundo do contador de vendas pendentes.
  static const Color warningSurface = Color(0xFF3A2E12);
}

/// Cores da barra de ações do conteúdo.
///
/// **Mais escura que o fundo do sistema.** A barra de título afunda porque
/// pertence à janela; a app bar afunda um degrau abaixo de
/// `PdvColors.background` para marcar a moldura do app sem fundir barra e
/// conteúdo.
///
/// Valores próprios em vez de reaproveitar [PdvTitleBarColors] ou
/// [PdvColors.background]: são superfícies que evoluem por motivos diferentes.
abstract final class PdvAppBarColors {
  /// Cinza da moldura de ações — abaixo do fundo do conteúdo.
  static const Color background = Color(0xFF212121);

  /// Separa a barra do conteúdo. Mais clara que o fundo — sombra não funciona
  /// sobre preto.
  static const Color border = Color(0xFF2B2B2B);

  /// Ícones e texto.
  static const Color foreground = Color(0xFFF2F4F7);

  /// Realce ao passar o ponteiro sobre um botão.
  static const Color hover = Color(0x1AFFFFFF);

  /// Traço vertical entre grupos de botões dentro de uma app bar de tela (ex.:
  /// Voltar | Cliente, no Balcão).
  ///
  /// Mais escuro e mais espesso que [border] de propósito: [border] só separa
  /// a barra do conteúdo abaixo dela, um contraste discreto; este precisa ser
  /// notado numa varredura rápida, porque marca a fronteira entre navegação
  /// (Voltar) e o estado da venda em curso (Cliente).
  static const Color separator = Color(0xFF303032);
}

/// Cores da área operacional do Balcão — barra de ferramentas, categorias,
/// lista de itens lançados, painel de totais e grade de produtos.
///
/// Grupo próprio, e não `PdvColors` reaproveitado: esta tela tem uma
/// hierarquia de superfícies que só existe nela (fundo → campo → botão de
/// produto), e amarrá-la à paleta geral faria cada ajuste de tela mexer no
/// app inteiro.
///
/// [background] é valor próprio, **não** um apelido de `PdvColors.background`
/// — são planos diferentes. `PdvColors.background` é a cor da moldura (app
/// bar e a margem ao redor desta área, ver `CounterPage`); este é o fundo do
/// **conteúdo** — grade de produtos, lista de itens lançados e painel de
/// totais dividem o mesmo tom, como um só plano de fundo por trás dos
/// controles. Já dividiram o mesmo valor da moldura antes; separados, um pode
/// mudar sem arrastar o outro.
abstract final class PdvCounterColors {
  /// Fundo geral: grade de produtos, lista de itens lançados e painel de
  /// totais. As três leem como uma superfície só — o que separa uma da outra
  /// são as bordas (`border`, `topEdge`), não a cor.
  static const Color background = Color(0xFF303030);

  /// Campos da barra de ferramentas, linha do documento na nota e botão de
  /// produto.
  static const Color surfaceStrong = Color(0xFF414141);

  /// Hover e pressionado de um botão de produto.
  static const Color surfaceHover = Color(0xFF4D4D4D);

  /// Fundo da coluna de categorias.
  ///
  /// Token próprio, e não um apelido de [surfaceStrong] com quem hoje divide o
  /// valor: a coluna é a superfície que o lojista mais nota ao comparar o PDV
  /// com o dele, e separá-la deixa afiná-la sem arrastar junto os botões de
  /// produto e os campos da barra.
  static const Color categorySurface = Color(0xFF414141);

  /// Traço entre seções: cabeçalho da lista, linhas do painel de totais,
  /// separação entre categorias.
  static const Color border = Color(0xFF4A4A4A);

  /// Traço que fecha o topo da área operacional, separando-a da barra de
  /// ferramentas.
  ///
  /// A cor da app bar, não um tom de [border]: assim a linha lê como o fim do
  /// cabeçalho, e não como mais uma divisória interna — que é o que as linhas
  /// de [border] já são.
  static const Color topEdge = PdvAppBarColors.background;

  static const Color foreground = Color(0xFFF0F0F0);

  /// Cabeçalho de coluna, rótulo de apoio, texto de placeholder.
  static const Color foregroundMuted = Color(0xFF9E9E9E);

  /// Fundo da categoria selecionada e do selo de quantidade de itens no
  /// painel de totais — a ênfase de marca desta tela.
  static const Color accent = Color(0xFF1E88E5);

  /// Texto de categoria **não** selecionada. Mais claro que [accent]: como
  /// fica sobre o fundo escuro em vez de virar fundo, precisa de mais brilho
  /// para manter o mesmo peso de leitura.
  static const Color accentMuted = Color(0xFF4FA3E8);

  /// Botão de pagamento — a ação que fecha a venda. O verde de sucesso de
  /// `PdvColors`, não uma cor própria: é a mesma semântica de "venda
  /// aprovada" que o resto do app usa, aplicada aqui como fundo de bloco
  /// grande em vez de texto.
  static const Color payment = PdvColors.success;

  /// Texto sobre [payment]. Escuro, não claro — [payment] é um verde
  /// **claro** (`#4ADE80`), e texto branco sobre ele mede ~1,8:1 de
  /// contraste, bem abaixo do mínimo legível. `PdvColors.background`
  /// (escuro) mede ~8:1 — a mesma cor do fundo da tela, então o texto do
  /// botão também não destoa do resto.
  static const Color onPayment = PdvColors.background;

  /// Botão de pagamento com o carrinho **vazio** — nada lançado ainda, nada
  /// para cobrar. Amarelo de atenção (`PdvColors.warning`), não verde: o
  /// verde é "venda pronta para fechar", e com o carrinho vazio ela não
  /// está. Vira [payment] assim que a primeira linha entra.
  ///
  /// Mesmo `onPayment` serve para os dois fundos — texto escuro mede ~9,6:1
  /// sobre este amarelo (`#FBBF24`), tão bem quanto os ~8:1 sobre o verde.
  static const Color paymentEmpty = PdvColors.warning;

  /// Botão de cancelar/apagar a venda. Vermelho cheio, e não o
  /// `PdvColors.danger` clareado: aqui é fundo de botão, não texto sobre
  /// fundo escuro.
  static const Color danger = Color(0xFFE53935);

  // --- Teclado numérico da tela de Pagamento -------------------------------

  /// Tecla de dígito. Mesmo tom do botão de produto — as duas são "a tecla
  /// que o operador martela", e dividir a cor as agrupa como tal.
  static const Color keypadKey = surfaceStrong;

  /// Apagar e limpar. Laranja, não o vermelho de [danger]: apagar um dígito
  /// não é cancelar a venda, e usar a mesma cor das duas ensinaria o
  /// operador a hesitar na tecla errada.
  static const Color keypadDestructive = Color(0xFFEF6C00);

  /// Teclas de valor cheio (+10, +20, +50, +100). Um degrau acima da tecla
  /// de dígito: são atalho, não o caminho principal de digitar.
  static const Color keypadQuickAdd = surfaceHover;

  /// Sombra do botão de produto — o que separa o botão do fundo escuro atrás
  /// dele, já que aqui não há elevação nenhuma vinda do Material (`cantos
  /// vivos`, sem `elevation`). Preta e não a cor da marca: sombra colorida lê
  /// como brilho, não como profundidade.
  static const List<BoxShadow> productShadow = <BoxShadow>[
    BoxShadow(color: Color(0x4D000000), blurRadius: 6, offset: Offset(0, 2)),
  ];
}

/// Cores do quadro (Kanban) de pedidos.
///
/// A coluna **afunda** em relação ao fundo do app, em vez de subir: aqui a
/// coluna é o recipiente, e os cartões é que flutuam dentro dela. Fazê-la mais
/// clara inverteria a leitura — a caixa pareceria estar por cima do que
/// guarda.
///
/// Valores próprios, e não `PdvColors.background` reaproveitado: as duas já
/// dividiram o mesmo cinza e o resultado foi um quadro chapado, em que não se
/// enxergava onde uma coluna terminava e a outra começava.
abstract final class PdvBoardColors {
  /// Fundo da coluna — abaixo de `PdvColors.background`, que fica visível nos
  /// vãos entre as colunas e passa a ser o que as separa.
  static const Color columnSurface = Color(0xFF1E1E1E);

  /// Faixa do título da coluna. Um degrau acima de [columnSurface]: separa o
  /// cabeçalho da pilha de cartões sem precisar de mais uma linha.
  static const Color columnHeader = Color(0xFF262626);

  /// Contorno da coluna e divisória do cabeçalho. Mais clara que o fundo dela
  /// — sobre superfície escura é a luz que marca o limite, não a sombra.
  static const Color columnBorder = Color(0xFF333333);
}

/// Cores da situação de um pedido de delivery.
///
/// Grupo próprio, e não as semânticas de [PdvColors]: aqui a cor **é** a
/// informação. O operador varre o quadro de longe e reconhece a situação pela
/// bolinha, sem ler o rótulo — é o mesmo motivo de `PdvActionColors`. Por isso
/// vale a mesma regra: **uma situação, uma cor, para sempre**, e trocar uma
/// custa mais caro que renomear.
///
/// A tela de Pedidos delivery tem um diálogo de **Legenda de cores** que lista
/// este mapa. Ao mexer aqui, confira que a legenda continua batendo — cor sem
/// legenda é enfeite, legenda sem cor é mentira.
abstract final class PdvDeliveryColors {
  /// Pedido chegou e ninguém confirmou ainda.
  static const Color awaitingConfirmation = Color(0xFFF48FB1);

  /// Em andamento: confirmado, em preparo ou a caminho.
  static const Color open = Color(0xFFFFA726);

  /// Entregue e ciclo operacional fechado (coluna Concluído).
  static const Color finished = Color(0xFF66BB6A);

  /// Cobrado (SaleOrder ativa) — ainda pode estar em preparo/despacho.
  static const Color paid = Color(0xFF26A69A);

  /// Fechado no salão, esperando o pagamento entrar.
  static const Color awaitingPayment = Color(0xFF42A5F5);

  static const Color cancelled = Color(0xFF9E9E9E);
}

/// Cores das ações da tela inicial.
///
/// Aqui a cor **não é decoração** — é atalho de memória. Depois de um turno, o
/// operador para de ler os rótulos e vai direto no bloco verde para trocar de
/// cliente. Por isso a regra: **uma ação, uma cor, para sempre**. Trocar a cor
/// de uma ação existente custa mais caro que mudar o nome dela.
///
/// Todos os tons foram escolhidos para carregar texto branco com contraste
/// mínimo de 4,5:1 (WCAG AA). Ao adicionar uma cor, verifique o contraste antes
/// — sob a luz de uma loja, um par fraco vira ilegível.
abstract final class PdvActionColors {
  /// Venda no balcão — a ação mais usada do caixa.
  static const Color counter = Color(0xFF1D6FD1);

  /// Cliente / consumidor da venda.
  static const Color customer = Color(0xFF3F7D2E);

  /// Mesas do salão.
  static const Color tables = Color(0xFF10746B);

  /// Atendimentos em andamento.
  static const Color service = Color(0xFF44484F);

  /// Comandas abertas.
  static const Color tabs = Color(0xFF2E7D74);

  /// Vendedor responsável.
  static const Color seller = Color(0xFF4C7A22);

  /// Delivery.
  static const Color delivery = Color(0xFF17559E);

  /// Crédito e fiado do cliente.
  static const Color credit = Color(0xFF2C6BA8);

  /// Consulta de vendas recentes.
  static const Color history = Color(0xFF5A6069);

  /// Devolução e estorno.
  static const Color refund = Color(0xFF5B3AA6);

  /// Consulta de preço (varejo).
  static const Color priceCheck = Color(0xFF1F7A6B);

  /// Pedidos de delivery recebidos.
  static const Color deliveryOrders = Color(0xFF3D4A57);

  /// Sangria e reforço de caixa.
  static const Color cashDrawer = Color(0xFF6B6259);

  /// Hub de abertura/fechamento de turno.
  static const Color cashHub = Color(0xFF8B6914);

  /// Configurações do terminal.
  static const Color settings = Color(0xFF4A6572);
}

// =============================================================================
// ARREDONDAMENTO
// =============================================================================

/// Raios de canto.
///
/// **O PDV não tem cantos arredondados.** [base] é 0 e vale para tudo: botões,
/// campos, cartões, diálogos, folhas. Não há escala de degraus — um raio por
/// componente vira decisão repetida em cada tela, e é assim que uma interface
/// perde a unidade.
///
/// Para arredondar o app inteiro no futuro, mude [base]. Um valor diferente em
/// um componente isolado precisa de justificativa escrita no código.
abstract final class PdvRadius {
  /// **Padrão do app: nenhum.** Cantos vivos.
  static const double base = 0;

  /// Círculo. Não é "canto arredondado" — é forma: avatar, indicador de status
  /// redondo, badge de contagem. Segue existindo com [base] em 0.
  static const double full = 999;

  static const BorderRadius baseAll = BorderRadius.all(Radius.circular(base));
  static const BorderRadius fullAll = BorderRadius.all(Radius.circular(full));

  /// Topo — folha inferior no celular. Acompanha [base].
  static const BorderRadius baseTop = BorderRadius.vertical(
    top: Radius.circular(base),
  );
}

// =============================================================================
// ESPAÇAMENTO
// =============================================================================

/// Escala de espaçamento, em passos de 4.
///
/// Use os nomes, não os números: `PdvSpacing.md` sobrevive a uma mudança de
/// escala; `12` não.
abstract final class PdvSpacing {
  static const double xxs = 2;
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double xxl = 32;
  static const double xxxl = 48;

  /// Espaço padrão entre controles irmãos.
  static const double gap = md;

  /// Respiro interno padrão de um cartão ou painel.
  static const EdgeInsets cardPadding = EdgeInsets.all(lg);

  /// Margem das bordas de uma tela.
  static const EdgeInsets screenPadding = EdgeInsets.all(xl);

  /// Margem da área de conteúdo, abaixo da app bar.
  static const EdgeInsets contentPadding = EdgeInsets.all(md);
}

// =============================================================================
// DIMENSÕES
// =============================================================================

/// Alturas, larguras e espessuras dos controles.
abstract final class PdvSizes {
  /// **Altura padrão de qualquer controle interativo.**
  ///
  /// 56 px no desktop: o PDV é lido a distância de braço, com mouse ou toque,
  /// muitas vezes em pé. O mínimo WCAG 2.2 / HIG é 44 — 56 dá margem confortável
  /// sem exigir mira fina.
  static const double controlHeight = 56;

  /// Controle secundário em faixa densa (toolbar/documento do Balcão).
  ///
  /// Ainda ≥ 48 (acima do mínimo 44) — a faixa do Balcão é densa de propósito,
  /// mas não pode ficar abaixo do alvo confortável de toque.
  static const double controlHeightSm = 48;

  /// Ação principal de uma tela — o botão que fecha a venda / confirma caixa.
  static const double controlHeightLg = 64;

  /// Botão quadrado de ícone.
  static const double iconButton = 56;

  static const double iconSm = 18;
  static const double iconMd = 22;
  static const double iconLg = 28;

  /// Ícone de destaque de tela vazia/inicial (ativação do terminal). Só para
  /// quando o ícone **é** o conteúdo, não um adorno ao lado de texto.
  static const double iconXl = 40;

  /// Barra de título do desktop (`PdvTitleBar`).
  ///
  /// Enxuta de propósito: cada pixel gasto aqui é linha de item que deixa de
  /// caber na venda. 40 px é o piso para as duas linhas do relógio — data
  /// sobre hora — caberem sem cortar.
  static const double titleBarHeight = 40;

  /// App bar de conteúdo (`PdvAppBar`) — menu, layout (dev) e sair. Existe em
  /// todas as plataformas, diferente da barra de título.
  static const double appBarHeight = 56;

  static const double borderWidth = 1;

  /// Espessura da borda em foco e do estado selecionado.
  static const double borderWidthFocus = 2;

  /// Largura máxima de um bloco de texto corrido. Acima disso o olho perde a
  /// linha ao voltar — vale para telas de configuração e mensagens, não para
  /// tabelas.
  static const double maxContentWidth = 720;

  /// Largura máxima de formulário desktop (settings, sangria, hub).
  static const double formMaxWidth = 640;

  /// Diálogo médio: formulários curtos (abrir/fechar caixa, ajuste, observação).
  static const double dialogMdWidth = 560;

  /// Diálogo grande: listas com busca (vendedor, cliente).
  static const double dialogLgWidth = 720;

  /// Altura padrão de diálogo com lista scrollável.
  static const double dialogListHeight = 480;

  /// Lista de clientes: mais alta — catálogo costuma ser maior que vendedores.
  static const double dialogCustomerListHeight = 640;

  /// Coluna de navegação da tela de Configurações.
  static const double settingsNavWidth = 300;

  /// Espessura da barra de rolagem. A `touch` é para terminal com tela
  /// sensível ao toque — a fina do desktop é mira demais para o dedo.
  static const double scrollbarThickness = 8;
  static const double scrollbarThicknessTouch = 18;
}

// =============================================================================
// TIPOGRAFIA
// =============================================================================

/// Escala tipográfica.
///
/// A base é **17 px** no corpo — calibrada para desktop a distância de braço.
/// Não instancie `TextStyle` numa tela: parta de um estilo daqui e ajuste com
/// `copyWith` apenas cor ou decoração.
abstract final class PdvTypography {
  /// Família do app — **Inter embutida** (`assets/fonts/`, declarada no
  /// `pubspec.yaml`). Não depende da fonte do SO: o PDV fica igual em Linux,
  /// Windows e Android. Sem os arquivos no bundle o Flutter cairia na fonte
  /// do sistema sem quebrar.
  static const String fontFamily = 'Inter';

  /// Dígitos de mesma largura. **Obrigatório em qualquer valor monetário:** sem
  /// isso, uma coluna de totais dança na horizontal a cada atualização e
  /// R$ 9,90 não alinha com R$ 10,00.
  static const List<FontFeature> tabular = <FontFeature>[
    FontFeature.tabularFigures(),
  ];

  // --- Valores monetários --------------------------------------------------

  /// Total do pedido, troco — o número que o cliente confere.
  static const TextStyle amountXl = TextStyle(
    fontFamily: fontFamily,
    fontSize: 36,
    height: 1.15,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.5,
    fontFeatures: tabular,
  );

  static const TextStyle amountLg = TextStyle(
    fontFamily: fontFamily,
    fontSize: 24,
    height: 1.2,
    fontWeight: FontWeight.w600,
    fontFeatures: tabular,
  );

  /// Valor de linha de item, coluna de tabela.
  static const TextStyle amountSm = TextStyle(
    fontFamily: fontFamily,
    fontSize: 16,
    height: 1.35,
    fontWeight: FontWeight.w500,
    fontFeatures: tabular,
  );

  // --- Títulos -------------------------------------------------------------

  static const TextStyle headingLg = TextStyle(
    fontFamily: fontFamily,
    fontSize: 26,
    height: 1.25,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.2,
  );

  static const TextStyle headingMd = TextStyle(
    fontFamily: fontFamily,
    fontSize: 22,
    height: 1.3,
    fontWeight: FontWeight.w600,
  );

  static const TextStyle headingSm = TextStyle(
    fontFamily: fontFamily,
    fontSize: 18,
    height: 1.35,
    fontWeight: FontWeight.w600,
  );

  // --- Corpo ---------------------------------------------------------------

  static const TextStyle bodyLg = TextStyle(
    fontFamily: fontFamily,
    fontSize: 18,
    height: 1.45,
    fontWeight: FontWeight.w400,
  );

  static const TextStyle bodyMd = TextStyle(
    fontFamily: fontFamily,
    fontSize: 17,
    height: 1.45,
    fontWeight: FontWeight.w400,
  );

  static const TextStyle bodySm = TextStyle(
    fontFamily: fontFamily,
    fontSize: 15,
    height: 1.4,
    fontWeight: FontWeight.w400,
  );

  // --- Rótulos -------------------------------------------------------------

  /// Texto de botão e de aba.
  static const TextStyle label = TextStyle(
    fontFamily: fontFamily,
    fontSize: 16,
    height: 1.2,
    fontWeight: FontWeight.w600,
  );

  static const TextStyle labelSm = TextStyle(
    fontFamily: fontFamily,
    fontSize: 14,
    height: 1.2,
    fontWeight: FontWeight.w600,
  );

  /// Legenda, unidade, metadado discreto.
  static const TextStyle caption = TextStyle(
    fontFamily: fontFamily,
    fontSize: 13,
    height: 1.35,
    fontWeight: FontWeight.w500,
  );
}

// =============================================================================
// MOVIMENTO
// =============================================================================

/// Durações e curvas.
///
/// Tudo é curto. Num caixa, animação longa lê como travamento — o operador
/// toca de novo achando que não pegou, e aí lança o item duas vezes.
abstract final class PdvMotion {
  /// Feedback imediato: toque, hover, foco.
  static const Duration fast = Duration(milliseconds: 120);

  /// Transição padrão: painel abrindo, item entrando na lista.
  static const Duration normal = Duration(milliseconds: 200);

  /// Teto. Nada no PDV deve demorar mais que isto.
  static const Duration slow = Duration(milliseconds: 320);

  static const Curve curve = Curves.easeOutCubic;
}
