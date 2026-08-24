import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/refund/data/shared_preferences_refund_store.dart';
import 'package:citybox_pdv/features/refund/domain/refund_models.dart';

void main() {
  test('round-trip pdv.refund.v1', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final SharedPreferencesRefundStore store = SharedPreferencesRefundStore(
      prefs,
    );

    final RefundRecord record = RefundRecord(
      id: 'r1',
      saleId: 's1',
      shiftId: 'sh1',
      createdAt: DateTime.utc(2026, 8, 5, 12),
      lines: const <RefundLine>[
        RefundLine(
          productId: 'p1',
          name: 'Item',
          quantity: 1,
          unitCents: 500,
          lineCents: 500,
        ),
      ],
      totalCents: 500,
      method: RefundMethod.cash,
    );

    await store.writeAll(<RefundRecord>[record]);
    final List<RefundRecord> loaded = await store.readAll();
    expect(loaded, hasLength(1));
    expect(loaded.single.id, 'r1');
    expect(loaded.single.totalCents, 500);
    expect(loaded.single.method, RefundMethod.cash);
  });
}
