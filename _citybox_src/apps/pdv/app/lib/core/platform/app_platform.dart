import 'dart:io' show Platform;

/// De que plataforma o app está rodando.
///
/// O PDV atende Linux, Windows e Android. A distinção que importa aqui **não é
/// o sistema operacional em si**, e sim se existe uma janela para decorar: no
/// desktop nós desenhamos a própria barra de título; no Android o sistema já
/// entrega a barra de status e o app ocupa a tela inteira.
///
/// Para decisões de **layout** (quantas colunas, painel lado a lado), não use
/// isto — use a largura disponível. Um tablet Android de balcão opera como
/// desktop, e uma janela de desktop pode estar estreita.
abstract final class AppPlatform {
  /// Verdadeiro em Linux e Windows — as duas plataformas desktop do projeto.
  ///
  /// macOS fica de fora por decisão de escopo, não por limitação técnica; se
  /// entrar um dia, é aqui que ele passa a contar como desktop.
  static bool get isDesktop => Platform.isLinux || Platform.isWindows;

  /// Verdadeiro em Android, a única plataforma móvel do projeto.
  static bool get isMobile => Platform.isAndroid;
}
