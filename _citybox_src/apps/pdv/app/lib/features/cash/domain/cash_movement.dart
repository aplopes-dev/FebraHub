import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';

/// Sangria ou reforço de gaveta vinculado a um turno.
class CashMovement {
  const CashMovement({
    required this.id,
    required this.type,
    required this.amountCents,
    required this.reason,
    required this.createdAt,
    this.operation = CashOperationType.other,
    this.operatorId,
    this.operatorName,
    this.authorizedByOperatorId,
    this.authorizedByOperatorName,
    required this.shiftId,
  });

  final String id;
  final CashMovementType type;
  final int amountCents;
  final String reason;

  /// Tipo de operação. Default `other` para movimento gravado antes deste
  /// campo existir — na época o porquê vivia só no texto livre de [reason].
  final CashOperationType operation;

  /// Quem lançou a sangria/reforço. Nome por cópia, mesma razão de
  /// `CashShift.openedByOperatorId`. Nulo só em movimento gravado antes destes
  /// campos existirem — é dinheiro saindo da gaveta, e sem responsável a linha
  /// não serve para conferência.
  final String? operatorId;
  final String? operatorName;

  /// Supervisor que liberou uma sangria acima da alçada.
  ///
  /// Distinto de [operatorId], e é justamente a distinção que interessa: quem
  /// tirou o dinheiro e quem permitiu tirar são duas perguntas da conferência,
  /// e uma sangria grande com as duas respostas iguais é o que a alçada existe
  /// para impedir. `null` = passou dentro do limite.
  final String? authorizedByOperatorId;
  final String? authorizedByOperatorName;

  final DateTime createdAt;
  final String shiftId;

  Map<String, Object?> toJson() => <String, Object?>{
    'id': id,
    'type': type.name,
    'amountCents': amountCents,
    'reason': reason,
    'operation': operation.name,
    'operatorId': operatorId,
    'operatorName': operatorName,
    'authorizedByOperatorId': authorizedByOperatorId,
    'authorizedByOperatorName': authorizedByOperatorName,
    'createdAt': createdAt.toIso8601String(),
    'shiftId': shiftId,
  };

  static CashMovement fromJson(Map<String, dynamic> json) {
    return CashMovement(
      id: json['id']! as String,
      type: CashMovementType.values.byName(json['type']! as String),
      amountCents: json['amountCents']! as int,
      reason: json['reason']! as String,
      operation:
          json['operation'] == null
              ? CashOperationType.other
              : CashOperationType.values.byName(json['operation']! as String),
      operatorId: json['operatorId'] as String?,
      operatorName: json['operatorName'] as String?,
      authorizedByOperatorId: json['authorizedByOperatorId'] as String?,
      authorizedByOperatorName: json['authorizedByOperatorName'] as String?,
      createdAt: DateTime.parse(json['createdAt']! as String),
      shiftId: json['shiftId']! as String,
    );
  }
}
