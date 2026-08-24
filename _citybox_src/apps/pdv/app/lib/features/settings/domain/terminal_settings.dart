import 'package:citybox_pdv/features/modules/domain/module_ids.dart';

/// Quantas posições a grade de favoritos da tela inicial tem: 2 colunas × 3
/// linhas, como na tela de Configurações.
const int homeFavoriteSlots = 6;

/// Favoritos padrão — o que a tela inicial mostra sem personalização.
///
/// Ordem: coluna 1 (linhas 1..3), depois coluna 2 (linhas 1..3). `null` deixa
/// a posição vazia.
const List<String?> defaultHomeFavorites = <String?>[
  PdvModuleIds.counter,
  PdvModuleIds.tables,
  PdvModuleIds.tabs,
  PdvModuleIds.customer,
  PdvModuleIds.service,
  PdvModuleIds.seller,
];

class TerminalSettings {
  const TerminalSettings({
    this.terminalLabel = 'Caixa 1',
    this.printerName,
    this.cashDrawerEnabled = true,
    this.scaleEnabled = false,
    this.largeScrollbars = false,
    this.lockAfterMinutes = 0,
    this.useHomeFavorites = false,
    this.homeFavorites = defaultHomeFavorites,
  });

  final String terminalLabel;
  final String? printerName;
  final bool cashDrawerEnabled;
  final bool scaleEnabled;

  /// Barra de rolagem mais grossa, para terminal com tela sensível ao toque:
  /// a barra fina do desktop é mira demais para o dedo.
  final bool largeScrollbars;

  /// Minutos de inatividade até a tela bloquear. **`0` = nunca.**
  ///
  /// Zero por padrão de propósito: bloqueio automático num balcão movimentado
  /// interrompe venda em andamento. Quem liga isso é a loja onde o terminal
  /// fica sozinho — tablet de garçom, caixa em corredor.
  final int lockAfterMinutes;

  /// A tela inicial usa [homeFavorites] em vez da ordem do catálogo.
  ///
  /// Desligado por padrão: a posição de cada bloco é memória muscular, e um
  /// terminal que nunca foi personalizado não deve mudar de layout sozinho.
  final bool useHomeFavorites;

  /// Ação de cada posição da grade — sempre [homeFavoriteSlots] itens.
  final List<String?> homeFavorites;

  TerminalSettings copyWith({
    String? terminalLabel,
    String? printerName,
    bool? cashDrawerEnabled,
    bool? scaleEnabled,
    bool? largeScrollbars,
    int? lockAfterMinutes,
    bool? useHomeFavorites,
    List<String?>? homeFavorites,
    bool clearPrinterName = false,
  }) {
    return TerminalSettings(
      terminalLabel: terminalLabel ?? this.terminalLabel,
      printerName: clearPrinterName ? null : (printerName ?? this.printerName),
      cashDrawerEnabled: cashDrawerEnabled ?? this.cashDrawerEnabled,
      scaleEnabled: scaleEnabled ?? this.scaleEnabled,
      largeScrollbars: largeScrollbars ?? this.largeScrollbars,
      lockAfterMinutes: lockAfterMinutes ?? this.lockAfterMinutes,
      useHomeFavorites: useHomeFavorites ?? this.useHomeFavorites,
      homeFavorites: homeFavorites ?? this.homeFavorites,
    );
  }

  Map<String, Object?> toJson() => <String, Object?>{
    'terminalLabel': terminalLabel,
    'printerName': printerName,
    'cashDrawerEnabled': cashDrawerEnabled,
    'scaleEnabled': scaleEnabled,
    'largeScrollbars': largeScrollbars,
    'lockAfterMinutes': lockAfterMinutes,
    'useHomeFavorites': useHomeFavorites,
    'homeFavorites': homeFavorites,
  };

  static TerminalSettings fromJson(Map<String, dynamic> json) {
    return TerminalSettings(
      terminalLabel: (json['terminalLabel'] as String?) ?? 'Caixa 1',
      printerName: json['printerName'] as String?,
      cashDrawerEnabled: (json['cashDrawerEnabled'] as bool?) ?? true,
      scaleEnabled: (json['scaleEnabled'] as bool?) ?? false,
      largeScrollbars: (json['largeScrollbars'] as bool?) ?? false,
      // Preferência gravada antes deste campo continua abrindo, sem bloqueio.
      lockAfterMinutes: (json['lockAfterMinutes'] as int?) ?? 0,
      useHomeFavorites: (json['useHomeFavorites'] as bool?) ?? false,
      homeFavorites: _favoritesFromJson(json['homeFavorites']),
    );
  }
}

/// Normaliza os favoritos gravados para sempre ter [homeFavoriteSlots] itens.
///
/// Um terminal que gravou com menos (ou mais) posições — versão anterior, JSON
/// editado à mão — não pode derrubar a tela inicial: o que falta vira posição
/// vazia e o que sobra é descartado.
List<String?> _favoritesFromJson(Object? raw) {
  if (raw is! List) return defaultHomeFavorites;
  final List<String?> parsed = <String?>[
    for (final Object? item in raw) item is String ? item : null,
  ];
  if (parsed.length == homeFavoriteSlots) return parsed;
  return <String?>[
    for (int i = 0; i < homeFavoriteSlots; i++)
      i < parsed.length ? parsed[i] : null,
  ];
}
