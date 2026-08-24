import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/application/food_charges_controller.dart';
import 'package:citybox_pdv/features/counter/application/sale_adjustment_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/counter/domain/counter_totals.dart';
import 'package:citybox_pdv/features/counter/domain/food_totals.dart';
import 'package:citybox_pdv/features/counter/domain/sale_adjustment.dart';

/// Totais da venda, recalculados a cada mudança no carrinho / ajuste / food.
final Provider<CounterTotals> counterTotalsProvider = Provider<CounterTotals>((
  Ref ref,
) {
  final List<CounterCartLine> lines = ref.watch(counterCartProvider);
  final SaleAdjustment? adjustment = ref.watch(saleAdjustmentProvider);
  final FoodChargesState charges = ref.watch(foodChargesProvider);

  final FoodTotals food = computeFoodTotals(
    lines: lines,
    couvert: charges.couvert,
    serviceFeeEnabled: charges.serviceFeeEnabled,
    serviceFeePercentBps: charges.serviceFeePercentBps,
    saleAdjustment: adjustment,
    deliveryFeeCents: charges.deliveryFeeCents,
  );

  return CounterTotals(
    subtotalCents: food.subtotalCents,
    discountCents: food.lineDiscountCents,
    itemCount: food.itemCount,
    saleAdjustmentCents: food.saleAdjustmentCents,
    couvertCents: food.couvertCents,
    serviceFeeCents: food.serviceFeeCents,
    deliveryFeeCents: food.deliveryFeeCents,
    totalCents: food.totalCents,
  );
});
