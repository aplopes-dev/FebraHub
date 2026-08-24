import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';

/// Um operador no pacote sincronizado: o que a tela mostra **mais o hash**.
///
/// Tipo separado de [PosOperator] de propósito. `PosOperator` circula por
/// providers, telas e registros de venda; se ele carregasse `pinHash`, o hash
/// viajaria junto para todo lugar — inclusive para o que é serializado no
/// turno. Aqui o material de credencial fica confinado ao cache.
class CachedOperator {
  const CachedOperator({required this.operator, required this.pinHash});

  final PosOperator operator;
  final String pinHash;

  Map<String, Object?> toJson() => <String, Object?>{
    'id': operator.id,
    if (operator.membershipId != null) 'membershipId': operator.membershipId,
    'code': operator.code,
    'name': operator.name,
    'permissionIds': operator.permissionIds,
    'pinHash': pinHash,
  };

  static CachedOperator fromJson(Map<String, dynamic> json) {
    return CachedOperator(
      operator: PosOperator.fromJson(json),
      pinHash: json['pinHash']! as String,
    );
  }
}

/// O que o terminal sabe para deixar alguém entrar sem rede.
///
/// **Entram todos os operadores ativos da unidade**, não só quem já entrou
/// naquele aparelho: o funcionário de cobertura precisa conseguir abrir o
/// caixa numa manhã sem link. Em troca, o aparelho guarda credencial da equipe
/// inteira — a mitigação é o [expiresAt] curto e a revogação do dispositivo.
class OperatorCache {
  const OperatorCache({
    required this.operators,
    required this.syncedAt,
    required this.expiresAt,
  });

  final List<CachedOperator> operators;
  final DateTime syncedAt;

  /// Carimbado pelo **servidor**, não calculado aqui.
  ///
  /// Relógio de terminal é ajustável — quem quisesse estender a validade
  /// bastaria atrasar a data do aparelho. Confiar no carimbo do servidor não
  /// resolve isso sozinho (a comparação ainda usa o relógio local), mas evita
  /// que a validade seja inventada pelo próprio dispositivo.
  final DateTime expiresAt;

  bool isExpired(DateTime now) => !now.isBefore(expiresAt);

  /// `true` quando falta menos de um dia — a barra de título avisa antes de o
  /// caixa descobrir na hora de entrar.
  bool isExpiringSoon(DateTime now) =>
      !isExpired(now) && expiresAt.difference(now) < const Duration(hours: 24);

  CachedOperator? findByCode(String code) {
    final String wanted = code.trim();
    for (final CachedOperator cached in operators) {
      if (cached.operator.code == wanted) return cached;
    }
    return null;
  }

  Map<String, Object?> toJson() => <String, Object?>{
    'operators': operators.map((CachedOperator e) => e.toJson()).toList(),
    'syncedAt': syncedAt.toIso8601String(),
    'expiresAt': expiresAt.toIso8601String(),
  };

  /// Devolve `null` para qualquer coisa que não seja um pacote completo.
  ///
  /// Rígido de propósito, ao contrário do resto do app: os outros `fromJson`
  /// toleram campo ausente porque o pior caso é uma tela sem um dado. Aqui o
  /// pior caso é entrar sem validade conhecida — então pacote meio lido é
  /// pacote descartado.
  static OperatorCache? fromJson(Map<String, dynamic> json) {
    final Object? rawOperators = json['operators'];
    final DateTime? syncedAt = DateTime.tryParse(
      (json['syncedAt'] as String?) ?? '',
    );
    final DateTime? expiresAt = DateTime.tryParse(
      (json['expiresAt'] as String?) ?? '',
    );
    if (rawOperators is! List || syncedAt == null || expiresAt == null) {
      return null;
    }

    final List<CachedOperator> operators = <CachedOperator>[];
    for (final Object? entry in rawOperators) {
      if (entry is! Map<String, dynamic>) return null;
      try {
        operators.add(CachedOperator.fromJson(entry));
      } on TypeError {
        return null;
      }
    }

    return OperatorCache(
      operators: operators,
      syncedAt: syncedAt,
      expiresAt: expiresAt,
    );
  }
}
