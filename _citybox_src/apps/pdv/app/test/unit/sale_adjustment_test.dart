import 'package:citybox_pdv/features/counter/domain/sale_adjustment.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('percent discount half-up', () {
    final SaleAdjustment adj = const SaleAdjustment(
      kind: SaleAdjustmentKind.discount,
      mode: SaleAdjustmentMode.percent,
      percentBps: 1000, // 10%
    );
    expect(adj.applyTo(2550), 2295);
  });

  test('amount surcharge', () {
    final SaleAdjustment adj = const SaleAdjustment(
      kind: SaleAdjustmentKind.surcharge,
      mode: SaleAdjustmentMode.amount,
      amountCents: 100,
    );
    expect(adj.applyTo(1000), 1100);
  });

  test('discount cannot go negative', () {
    final SaleAdjustment adj = const SaleAdjustment(
      kind: SaleAdjustmentKind.discount,
      mode: SaleAdjustmentMode.amount,
      amountCents: 5000,
    );
    expect(adj.applyTo(1000), 0);
  });
}
