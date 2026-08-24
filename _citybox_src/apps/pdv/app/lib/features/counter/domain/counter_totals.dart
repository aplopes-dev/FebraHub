/// Totais da venda em curso, derivados do carrinho (centavos).
class CounterTotals {
  const CounterTotals({
    required this.subtotalCents,
    required this.discountCents,
    required this.itemCount,
    this.saleAdjustmentCents = 0,
    this.couvertCents = 0,
    this.serviceFeeCents = 0,
    this.deliveryFeeCents = 0,
    int? totalCents,
  }) : totalCents =
           totalCents ??
           (subtotalCents -
               discountCents +
               couvertCents +
               serviceFeeCents +
               saleAdjustmentCents +
               deliveryFeeCents);

  /// Soma dos subtotais de linha (antes do desconto por linha).
  final int subtotalCents;

  /// Soma dos descontos por linha.
  final int discountCents;

  final int itemCount;

  /// Efeito do ajuste de venda (negativo = desconto, positivo = acréscimo).
  final int saleAdjustmentCents;

  final int couvertCents;
  final int serviceFeeCents;
  final int deliveryFeeCents;

  /// Total final após linhas + food + ajuste.
  final int totalCents;

  int get linesNetCents => subtotalCents - discountCents;

  double get discountPercentage =>
      subtotalCents == 0 ? 0 : (discountCents / subtotalCents) * 100;
}
