import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/data/pos_cash_session_api.dart';
import 'package:citybox_pdv/features/cash/data/shared_preferences_cash_shift_store.dart';
import 'package:citybox_pdv/features/cash/domain/expected_drawer.dart';
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

  test('withdrawal and reinforcement validate amount and reason', () async {
    final CashShiftController ctrl = container.read(cashShiftProvider.notifier);
    await ctrl.openShift(openingFloatCents: 10000, operator: testOperator);

    expect(
      () => ctrl.addWithdrawal(amountCents: 0, reason: 'x'),
      throwsA(isA<ArgumentError>()),
    );
    expect(
      () => ctrl.addWithdrawal(amountCents: 100, reason: '  '),
      throwsA(isA<ArgumentError>()),
    );

    await ctrl.addReinforcement(amountCents: 2000, reason: 'troco');
    await ctrl.addWithdrawal(amountCents: 1500, reason: 'banco');
    expect(expectedDrawerCents(container.read(cashShiftProvider)!), 10500);
  });
}
