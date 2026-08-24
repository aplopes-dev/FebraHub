import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/domain/food_totals.dart';
import 'package:citybox_pdv/features/counter/domain/sale_adjustment.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';

void main() {
  const CounterProduct product = CounterProduct(
    id: 'p1',
    name: 'Item',
    priceCents: 1000,
    categoryId: 'c',
  );

  test('ordem lines → couvert → taxa → ajuste', () {
    final FoodTotals t = computeFoodTotals(
      lines: <CounterCartLine>[
        const CounterCartLine(product: product, quantity: 2),
      ],
      couvert: const CouvertState(unitCents: 500, covers: 2),
      serviceFeeEnabled: true,
      serviceFeePercentBps: 1000,
      saleAdjustment: const SaleAdjustment(
        kind: SaleAdjustmentKind.discount,
        mode: SaleAdjustmentMode.percent,
        percentBps: 1000,
      ),
    );
    // linesNet 2000 + couvert 1000 = 3000; fee 10% = 300; preAdj 3300; -10% = 2970
    expect(t.linesNetCents, 2000);
    expect(t.couvertCents, 1000);
    expect(t.serviceFeeCents, 300);
    expect(t.totalCents, 2970);
  });

  test('delivery fee fora da base da taxa', () {
    final FoodTotals t = computeFoodTotals(
      lines: <CounterCartLine>[
        const CounterCartLine(product: product, quantity: 1),
      ],
      serviceFeeEnabled: true,
      serviceFeePercentBps: 1000,
      deliveryFeeCents: 500,
    );
    expect(t.serviceFeeCents, 100);
    expect(t.totalCents, 1600);
  });
}
