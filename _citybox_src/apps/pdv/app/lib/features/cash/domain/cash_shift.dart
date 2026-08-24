import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/cash_movement.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';

/// Turno de caixa do terminal.
class CashShift {
  const CashShift({
    required this.id,
    required this.status,
    required this.openedAt,
    required this.openingFloatCents,
    required this.movements,
    required this.sales,
    this.openedByOperatorId,
    this.openedByOperatorName,
    this.numberingResetAt,
    this.closedAt,
    this.countedCents,
    this.differenceCents,
  });

  final String id;
  final CashShiftStatus status;
  final DateTime openedAt;
  final DateTime? closedAt;
  final int openingFloatCents;
  final int? countedCents;
  final int? differenceCents;
  final List<CashMovement> movements;
  final List<SaleRecord> sales;

  /// Quem abriu o turno.
  ///
  /// O **nome vai por cópia**, ao lado do id, porque o histórico tem que
  /// continuar dizendo quem operou mesmo depois de o funcionário sair do
  /// cadastro — id sem nome vira linha ilegível no dia em que alguém é
  /// desligado.
  ///
  /// Nulo só em turno gravado antes destes campos existirem (ver [fromJson]):
  /// `openShift` exige operador.
  final String? openedByOperatorId;
  final String? openedByOperatorName;

  /// Momento em que o operador zerou a numeração das vendas.
  ///
  /// As vendas já gravadas **mantêm** o número delas — são registro histórico.
  /// O que muda é a contagem daqui para a frente: `nextSaleNumber` passa a
  /// olhar só as vendas posteriores a esta marca, então a próxima sai como 1.
  /// `null` = nunca zerada neste turno.
  final DateTime? numberingResetAt;

  bool get isOpen => status == CashShiftStatus.open;

  CashShift copyWith({
    CashShiftStatus? status,
    DateTime? closedAt,
    int? countedCents,
    int? differenceCents,
    List<CashMovement>? movements,
    List<SaleRecord>? sales,
    DateTime? numberingResetAt,
  }) {
    return CashShift(
      id: id,
      status: status ?? this.status,
      openedAt: openedAt,
      // Fora de `copyWith` de propósito: quem abriu o turno não muda depois de
      // aberto. Trocar de operador durante o dia não reescreve a abertura —
      // muda o dono das vendas seguintes, que carimbam o próprio operador.
      openedByOperatorId: openedByOperatorId,
      openedByOperatorName: openedByOperatorName,
      closedAt: closedAt ?? this.closedAt,
      openingFloatCents: openingFloatCents,
      countedCents: countedCents ?? this.countedCents,
      differenceCents: differenceCents ?? this.differenceCents,
      movements: movements ?? this.movements,
      sales: sales ?? this.sales,
      numberingResetAt: numberingResetAt ?? this.numberingResetAt,
    );
  }

  Map<String, Object?> toJson() => <String, Object?>{
    'id': id,
    'status': status.name,
    'openedAt': openedAt.toIso8601String(),
    'closedAt': closedAt?.toIso8601String(),
    'openingFloatCents': openingFloatCents,
    'openedByOperatorId': openedByOperatorId,
    'openedByOperatorName': openedByOperatorName,
    'countedCents': countedCents,
    'differenceCents': differenceCents,
    'movements': movements.map((CashMovement e) => e.toJson()).toList(),
    'sales': sales.map((SaleRecord e) => e.toJson()).toList(),
    'numberingResetAt': numberingResetAt?.toIso8601String(),
  };

  static CashShift fromJson(Map<String, dynamic> json) {
    final List<dynamic> movRaw =
        (json['movements'] as List<dynamic>?) ?? <dynamic>[];
    final List<dynamic> salesRaw =
        (json['sales'] as List<dynamic>?) ?? <dynamic>[];
    return CashShift(
      id: json['id']! as String,
      status: CashShiftStatus.values.byName(json['status']! as String),
      openedAt: DateTime.parse(json['openedAt']! as String),
      closedAt:
          json['closedAt'] != null
              ? DateTime.parse(json['closedAt']! as String)
              : null,
      openingFloatCents: json['openingFloatCents']! as int,
      // Turno gravado antes de o operador existir no domínio continua abrindo,
      // sem operador — a UI mostra traço.
      openedByOperatorId: json['openedByOperatorId'] as String?,
      openedByOperatorName: json['openedByOperatorName'] as String?,
      countedCents: json['countedCents'] as int?,
      differenceCents: json['differenceCents'] as int?,
      numberingResetAt:
          json['numberingResetAt'] != null
              ? DateTime.parse(json['numberingResetAt']! as String)
              : null,
      movements:
          movRaw
              .map(
                (dynamic e) => CashMovement.fromJson(e as Map<String, dynamic>),
              )
              .toList(),
      sales:
          salesRaw
              .map(
                (dynamic e) => SaleRecord.fromJson(e as Map<String, dynamic>),
              )
              .toList(),
    );
  }
}
