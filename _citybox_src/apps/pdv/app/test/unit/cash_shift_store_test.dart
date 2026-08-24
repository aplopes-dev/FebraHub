import 'package:citybox_pdv/features/cash/data/shared_preferences_cash_shift_store.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/cash_movement.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('round-trip persist open shift', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final SharedPreferencesCashShiftStore store =
        SharedPreferencesCashShiftStore(prefs);

    final CashShift shift = CashShift(
      id: 'abc',
      status: CashShiftStatus.open,
      openedAt: DateTime.utc(2026, 8, 5),
      openingFloatCents: 10000,
      movements: const <CashMovement>[],
      sales: const <SaleRecord>[],
    );

    await store.write(shift);
    final CashShift? loaded = await store.read();
    expect(loaded, isNotNull);
    expect(loaded!.id, 'abc');
    expect(loaded.openingFloatCents, 10000);
    expect(loaded.isOpen, isTrue);

    await store.clear();
    expect(await store.read(), isNull);
  });
}
