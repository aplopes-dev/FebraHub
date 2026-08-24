import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/data/pos_cash_session_api.dart';
import 'package:citybox_pdv/features/cash/data/shared_preferences_cash_shift_store.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/expected_drawer.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/fake_pos_cash_session_api.dart';
import '../helpers/operator_fixture.dart';
import 'package:shared_preferences/shared_preferences.dart';

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
      ],
    );
    await container.read(cashShiftProvider.notifier).hydrate();
  });

  tearDown(() => container.dispose());

  test('recordSale then cancelSale adjusts expected cash only', () async {
    final CashShiftController ctrl = container.read(cashShiftProvider.notifier);
    await ctrl.openShift(openingFloatCents: 5000, operator: testOperator);
    final String shiftId = container.read(cashShiftProvider)!.id;

    await ctrl.recordSale(
      SaleRecord(
        id: 'cash1',
        shiftId: shiftId,
        status: SaleRecordStatus.completed,
        createdAt: DateTime.utc(2026, 8, 5, 12),
        lines: const <SaleLineSnapshot>[
          SaleLineSnapshot(
            productId: 'p1',
            name: 'Item',
            quantity: 1,
            unitPriceCents: 1000,
            lineTotalCents: 1000,
          ),
        ],
        payments: const <SalePaymentSnapshot>[
          SalePaymentSnapshot(
            methodId: 'cash',
            methodLabel: 'Dinheiro',
            amountCents: 1000,
          ),
        ],
        subtotalCents: 1000,
        totalCents: 1000,
        cashReceivedCents: 1000,
        changeCents: 0,
        cashNetCents: 1000,
      ),
    );

    expect(expectedDrawerCents(container.read(cashShiftProvider)!), 6000);

    await ctrl.cancelSale('cash1');
    expect(expectedDrawerCents(container.read(cashShiftProvider)!), 5000);
  });

  test('card-only sale does not change expected drawer', () async {
    final CashShiftController ctrl = container.read(cashShiftProvider.notifier);
    await ctrl.openShift(openingFloatCents: 5000, operator: testOperator);
    await ctrl.recordSale(
      SaleRecord(
        id: 'card1',
        shiftId: container.read(cashShiftProvider)!.id,
        status: SaleRecordStatus.completed,
        createdAt: DateTime.utc(2026, 8, 5, 12),
        lines: const <SaleLineSnapshot>[
          SaleLineSnapshot(
            productId: 'p1',
            name: 'Item',
            quantity: 1,
            unitPriceCents: 2000,
            lineTotalCents: 2000,
          ),
        ],
        payments: const <SalePaymentSnapshot>[
          SalePaymentSnapshot(
            methodId: 'credit',
            methodLabel: 'Crédito',
            amountCents: 2000,
          ),
        ],
        subtotalCents: 2000,
        totalCents: 2000,
        cashReceivedCents: 0,
        changeCents: 0,
        cashNetCents: 0,
      ),
    );
    expect(expectedDrawerCents(container.read(cashShiftProvider)!), 5000);
  });
}
