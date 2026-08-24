import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/counter/domain/sale_adjustment.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';

/// Resultado dos totais food (linhas → couvert → taxa → ajuste).
class FoodTotals {
  const FoodTotals({
    required this.linesNetCents,
    required this.couvertCents,
    required this.serviceFeeCents,
    required this.deliveryFeeCents,
    required this.saleAdjustmentCents,
    required this.totalCents,
    required this.itemCount,
    required this.subtotalCents,
    required this.lineDiscountCents,
  });

  final int subtotalCents;
  final int lineDiscountCents;
  final int linesNetCents;
  final int couvertCents;
  final int serviceFeeCents;
  final int deliveryFeeCents;
  final int saleAdjustmentCents;
  final int totalCents;
  final int itemCount;
}

/// Fórmula canônica ([contracts/food-totals.md]).
FoodTotals computeFoodTotals({
  required List<CounterCartLine> lines,
  CouvertState? couvert,
  bool serviceFeeEnabled = false,
  int serviceFeePercentBps = 1000,
  SaleAdjustment? saleAdjustment,
  int deliveryFeeCents = 0,
}) {
  final int subtotalCents = lines.fold(
    0,
    (int sum, CounterCartLine line) => sum + line.subtotalCents,
  );
  final int lineDiscountCents = lines.fold(
    0,
    (int sum, CounterCartLine line) => sum + line.discountAmountCents,
  );
  final int itemCount = lines.fold(
    0,
    (int sum, CounterCartLine line) => sum + line.quantity,
  );
  final int linesNetCents = subtotalCents - lineDiscountCents;
  final int couvertCents = couvert?.totalCents ?? 0;
  final int baseForService = linesNetCents + couvertCents;
  final int serviceFeeCents =
      !serviceFeeEnabled || itemCount == 0
          ? 0
          : (baseForService * serviceFeePercentBps + 5000) ~/ 10000;

  final int preAdj = linesNetCents + couvertCents + serviceFeeCents;
  final int afterAdj =
      (saleAdjustment == null || itemCount == 0)
          ? preAdj
          : saleAdjustment.applyTo(preAdj);
  final int saleAdjustmentCents = itemCount == 0 ? 0 : afterAdj - preAdj;
  final int totalCents = afterAdj + deliveryFeeCents;

  return FoodTotals(
    subtotalCents: subtotalCents,
    lineDiscountCents: lineDiscountCents,
    linesNetCents: linesNetCents,
    couvertCents: couvertCents,
    serviceFeeCents: serviceFeeCents,
    deliveryFeeCents: deliveryFeeCents,
    saleAdjustmentCents: saleAdjustmentCents,
    totalCents: totalCents < 0 ? 0 : totalCents,
    itemCount: itemCount,
  );
}
