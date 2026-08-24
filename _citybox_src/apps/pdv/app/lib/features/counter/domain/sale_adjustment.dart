/// Ajuste único no total da venda (desconto XOR acréscimo).
class SaleAdjustment {
  const SaleAdjustment({
    required this.kind,
    required this.mode,
    this.percentBps,
    this.amountCents,
    this.authorizedByOperatorId,
    this.authorizedByOperatorName,
  }) : assert(
         (mode == SaleAdjustmentMode.percent && percentBps != null) ||
             (mode == SaleAdjustmentMode.amount && amountCents != null),
       );

  final SaleAdjustmentKind kind;
  final SaleAdjustmentMode mode;
  final int? percentBps;
  final int? amountCents;

  /// Supervisor que liberou um desconto acima da alçada.
  ///
  /// Mora **no ajuste**, não na venda, porque é o ajuste que foi autorizado —
  /// e a venda pode ter uma segunda exceção depois (o cancelamento), com outro
  /// responsável. Um par de campos só na venda perderia um dos dois.
  ///
  /// Nome por cópia, como em toda a base: o histórico conta o que aconteceu
  /// naquele dia, mesmo que o cadastro mude depois. `null` = passou dentro da
  /// alçada, ou é ajuste gravado antes destes campos existirem.
  final String? authorizedByOperatorId;
  final String? authorizedByOperatorName;

  SaleAdjustment copyWith({
    SaleAdjustmentKind? kind,
    SaleAdjustmentMode? mode,
    int? percentBps,
    int? amountCents,
    String? authorizedByOperatorId,
    String? authorizedByOperatorName,
  }) {
    return SaleAdjustment(
      kind: kind ?? this.kind,
      mode: mode ?? this.mode,
      percentBps: percentBps ?? this.percentBps,
      amountCents: amountCents ?? this.amountCents,
      authorizedByOperatorId:
          authorizedByOperatorId ?? this.authorizedByOperatorId,
      authorizedByOperatorName:
          authorizedByOperatorName ?? this.authorizedByOperatorName,
    );
  }

  /// Quanto este ajuste representa **em percentual** do subtotal.
  ///
  /// Existe porque a alçada é configurada em porcentagem e o desconto pode ser
  /// digitado em reais. Sem converter, um desconto de R$ 90 numa venda de
  /// R$ 100 passaria sem supervisor — 90% de desconto pela porta dos fundos.
  ///
  /// Acréscimo devolve `0`: alçada é sobre o que **reduz** o que a loja recebe.
  double discountPercentOf(int linesSubtotalCents) {
    if (kind != SaleAdjustmentKind.discount) return 0;
    if (linesSubtotalCents <= 0) return 0;
    return _deltaCents(linesSubtotalCents) / linesSubtotalCents * 100;
  }

  /// Quanto o ajuste vale em dinheiro, sempre positivo. Serve para mostrar ao
  /// supervisor o valor da exceção que ele está assinando.
  int deltaCentsOf(int linesSubtotalCents) => _deltaCents(linesSubtotalCents);

  /// Aplica o ajuste sobre [linesSubtotalCents] (já com descontos de linha).
  int applyTo(int linesSubtotalCents) {
    final int adj = _deltaCents(linesSubtotalCents);
    final int total =
        kind == SaleAdjustmentKind.discount
            ? linesSubtotalCents - adj
            : linesSubtotalCents + adj;
    return total < 0 ? 0 : total;
  }

  int _deltaCents(int linesSubtotalCents) {
    if (mode == SaleAdjustmentMode.amount) {
      return amountCents ?? 0;
    }
    final int bps = percentBps ?? 0;
    // half-up: (subtotal * bps + 5000) ~/ 10000
    return (linesSubtotalCents * bps + 5000) ~/ 10000;
  }

  Map<String, Object?> toJson() => <String, Object?>{
    'kind': kind.name,
    'mode': mode.name,
    'percentBps': percentBps,
    'amountCents': amountCents,
    'authorizedByOperatorId': authorizedByOperatorId,
    'authorizedByOperatorName': authorizedByOperatorName,
  };

  static SaleAdjustment fromJson(Map<String, dynamic> json) {
    return SaleAdjustment(
      kind: SaleAdjustmentKind.values.byName(json['kind']! as String),
      mode: SaleAdjustmentMode.values.byName(json['mode']! as String),
      percentBps: json['percentBps'] as int?,
      amountCents: json['amountCents'] as int?,
      // Ajuste gravado antes destes campos continua abrindo, sem responsável.
      authorizedByOperatorId: json['authorizedByOperatorId'] as String?,
      authorizedByOperatorName: json['authorizedByOperatorName'] as String?,
    );
  }
}

enum SaleAdjustmentKind { discount, surcharge }

enum SaleAdjustmentMode { percent, amount }
