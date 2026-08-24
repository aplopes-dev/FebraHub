import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/fake_pos_cash_session_api.dart';
import '../helpers/operator_fixture.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/data/pos_cash_session_api.dart';
import 'package:citybox_pdv/features/cash/data/shared_preferences_cash_shift_store.dart';
import 'package:citybox_pdv/features/cash/domain/expected_drawer.dart';
import 'package:citybox_pdv/features/credit/application/credit_controller.dart';
import 'package:citybox_pdv/features/credit/data/shared_preferences_credit_store.dart';
import 'package:citybox_pdv/features/credit/domain/credit_models.dart';

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
        creditStoreProvider.overrideWithValue(
          SharedPreferencesCreditStore(prefs),
        ),
      ],
    );
    await container.read(cashShiftProvider.notifier).hydrate();
    await container.read(creditProvider.notifier).hydrate();
    // Conta de fixture (o store não semeia mais em produção).
    await container
        .read(creditProvider.notifier)
        .creditFromRefund(
          customerId: 'cust_01',
          amountCents: 15000,
          refundId: 'seed-test',
        );
  });

  tearDown(() => container.dispose());

  test('receivePayment ≤ balance; rejeita acima e ≤0', () async {
    await container
        .read(cashShiftProvider.notifier)
        .openShift(openingFloatCents: 10000, operator: testOperator);

    expect(
      container.read(creditProvider).accountFor('cust_01')!.balanceCents,
      15000,
    );

    await container
        .read(creditProvider.notifier)
        .receivePayment(
          customerId: 'cust_01',
          amountCents: 5000,
          cashIntoDrawer: true,
        );

    expect(
      container.read(creditProvider).accountFor('cust_01')!.balanceCents,
      10000,
    );
    expect(
      container.read(creditProvider).entriesFor('cust_01').first.type,
      CreditEntryType.payment,
    );

    expect(
      () => container
          .read(creditProvider.notifier)
          .receivePayment(
            customerId: 'cust_01',
            amountCents: 20000,
            cashIntoDrawer: false,
          ),
      throwsA(isA<ArgumentError>()),
    );
    expect(
      () => container
          .read(creditProvider.notifier)
          .receivePayment(
            customerId: 'cust_01',
            amountCents: 0,
            cashIntoDrawer: false,
          ),
      throwsA(isA<ArgumentError>()),
    );
  });

  test('cashIntoDrawer aumenta esperado em gaveta', () async {
    await container
        .read(cashShiftProvider.notifier)
        .openShift(openingFloatCents: 10000, operator: testOperator);
    final int before = expectedDrawerCents(container.read(cashShiftProvider)!);

    await container
        .read(creditProvider.notifier)
        .receivePayment(
          customerId: 'cust_01',
          amountCents: 1000,
          cashIntoDrawer: true,
        );

    expect(
      expectedDrawerCents(container.read(cashShiftProvider)!),
      before + 1000,
    );
  });
}
