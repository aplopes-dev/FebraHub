/// Tipo de entrada no catálogo de módulos do PDV.
enum PdvModuleKind {
  /// Ação/tela (Home, app bar, destino de navegação).
  screen,

  /// Comportamento dentro de uma tela (ex.: código de barras no Balcão).
  behavior,
}

/// Classificação comercial do módulo.
enum PdvModuleTier {
  /// Comum às duas verticais — não pode ficar indisponível por config inválida.
  core,

  /// Específico de segmento (food / varejo).
  optional,
}

/// Estado de um módulo no terminal.
///
/// Na UI operacional da Fase 0, [disabled] e [blocked] produzem o mesmo
/// resultado (ausência). A distinção permanece no modelo para Fases 1 e 4.
enum PdvModuleState { available, disabled, blocked }
