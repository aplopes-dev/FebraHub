import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/fake_pos_cash_session_api.dart';
import '../helpers/operator_fixture.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/data/pos_cash_session_api.dart';
import 'package:citybox_pdv/features/cash/data/shared_preferences_cash_shift_store.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/expected_drawer.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:citybox_pdv/features/credit/application/credit_controller.dart';
import 'package:citybox_pdv/features/credit/data/shared_preferences_credit_store.dart';
import 'package:citybox_pdv/features/refund/application/refund_controller.dart';
import 'package:citybox_pdv/features/refund/data/shared_preferences_refund_store.dart';
import 'package:citybox_pdv/features/refund/domain/refund_models.dart';

SaleRecord _sale({
  required String id,
  required String shiftId,
  int qty = 2,
  int unitCents = 1000,
}) {
  return SaleRecord(
    id: id,
    shiftId: shiftId,
    status: SaleRecordStatus.completed,
    createdAt: DateTime.utc(2026, 8, 5),
    lines: <SaleLineSnapshot>[
      SaleLineSnapshot(
        productId: 'p1',
        name: 'Item',
        quantity: qty,
        unitPriceCents: unitCents,
        lineTotalCents: unitCents * qty,
      ),
    ],
    payments: const <SalePaymentSnapshot>[
      SalePaymentSnapshot(
        methodId: 'cash',
        methodLabel: 'Dinheiro',
        amountCents: 2000,
      ),
    ],
    subtotalCents: unitCents * qty,
    totalCents: unitCents * qty,
    cashReceivedCents: unitCents * qty,
    changeCents: 0,
    cashNetCents: unitCents * qty,
  );
}

void main() {
  late ProviderContainer container;

  setUp(() async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    container = ProviderContainer(
      overrides: <Override>[
        cashShiftStoreProvider.overrideWithValue(
          SharedPreferencesCashShiftStore(prefs),
        ),
        posCashSessionApiProvider.overrideWithValue(FakePosCashSessionApi()),
        refundStoreProvider.overrideWithValue(
          SharedPreferencesRefundStore(prefs),
        ),
        creditStoreProvider.overrideWithValue(
          SharedPreferencesCreditStore(prefs),
        ),
      ],
    );
    await container.read(cashShiftProvider.notifier).hydrate();
    await container.read(refundProvider.notifier).hydrate();
    await container.read(creditProvider.notifier).hydrate();
  });

  tearDown(() => container.dispose());

  test('elegibilidade e rejeita over-refund', () async {
    await container
        .read(cashShiftProvider.notifier)
        .openShift(openingFloatCents: 50000, operator: testOperator);
    final String shiftId = container.read(cashShiftProvider)!.id;
    final SaleRecord sale = _sale(id: 'sale_1', shiftId: shiftId);

    expect(
      container
          .read(refundProvider.notifier)
          .eligibleFor(sale.lines.first, sale.id),
      2,
    );

    await container
        .read(refundProvider.notifier)
        .confirmRefund(
          sale: sale,
          lines: const <RefundLine>[
            RefundLine(
              productId: 'p1',
              name: 'Item',
              quantity: 1,
              unitCents: 1000,
              lineCents: 1000,
            ),
          ],
          method: RefundMethod.cash,
        );

    expect(
      container
          .read(refundProvider.notifier)
          .eligibleFor(sale.lines.first, sale.id),
      1,
    );

    expect(
      () => container
          .read(refundProvider.notifier)
          .confirmRefund(
            sale: sale,
            lines: const <RefundLine>[
              RefundLine(
                productId: 'p1',
                name: 'Item',
                quantity: 5,
                unitCents: 1000,
                lineCents: 5000,
              ),
            ],
            method: RefundMethod.cash,
          ),
      throwsA(isA<ArgumentError>()),
    );
  });

  test('cash refund reduz esperado em gaveta', () async {
    await container
        .read(cashShiftProvider.notifier)
        .openShift(openingFloatCents: 50000, operator: testOperator);
    final String shiftId = container.read(cashShiftProvider)!.id;
    final SaleRecord sale = _sale(id: 'sale_2', shiftId: shiftId);
    final int before = expectedDrawerCents(container.read(cashShiftProvider)!);

    await container
        .read(refundProvider.notifier)
        .confirmRefund(
          sale: sale,
          lines: const <RefundLine>[
            RefundLine(
              productId: 'p1',
              name: 'Item',
              quantity: 1,
              unitCents: 1000,
              lineCents: 1000,
            ),
          ],
          method: RefundMethod.cash,
        );

    final int after = expectedDrawerCents(container.read(cashShiftProvider)!);
    expect(after, before - 1000);
  });
}
