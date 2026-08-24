import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/delivery/domain/delivery_order.dart';
import 'package:citybox_pdv/features/tables/data/shared_preferences_salon_store.dart';
import 'package:citybox_pdv/features/tables/data/tables_fixture.dart';
import 'package:citybox_pdv/features/tables/domain/dining_table.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';

void main() {
  test('round-trip pdv.salon.v1 restaura mesa ocupada', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final SharedPreferencesSalonStore store = SharedPreferencesSalonStore(
      prefs,
    );

    final List<DiningTable> tables = buildDefaultTables();
    final DiningTable first = tables.first;
    final SalonAccount account = SalonAccount(
      id: 'acc-1',
      status: SalonAccountStatus.open,
      openedAt: DateTime.utc(2026, 8, 5),
      origin: SalonOrigin.table,
      tableId: first.id,
    );
    final SalonSnapshot snap = SalonSnapshot(
      tables: <DiningTable>[
        for (final DiningTable t in tables)
          if (t.id == first.id) t.copyWith(accountId: account.id) else t,
      ],
      accounts: <SalonAccount>[account],
      deliveryOrders: const <DeliveryOrder>[],
    );

    await store.write(snap);
    final SalonSnapshot restored = await store.read();
    expect(restored.accounts, hasLength(1));
    expect(restored.accounts.single.id, 'acc-1');
    expect(
      restored.tables.firstWhere((DiningTable t) => t.id == first.id).accountId,
      'acc-1',
    );
  });
}
