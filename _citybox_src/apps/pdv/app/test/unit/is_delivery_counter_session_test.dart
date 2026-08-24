import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/counter/presentation/widgets/counter_totals_panel.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';

void main() {
  final SalonAccount delivery = SalonAccount(
    id: 'delivery_1',
    status: SalonAccountStatus.open,
    openedAt: DateTime(2026, 8, 15),
    origin: SalonOrigin.delivery,
    deliveryOrderId: 'ord-1',
  );
  final SalonAccount table = SalonAccount(
    id: 'table_1',
    status: SalonAccountStatus.open,
    openedAt: DateTime(2026, 8, 15),
    origin: SalonOrigin.table,
    tableId: 't1',
  );

  test('sem accountId não é sessão delivery', () {
    expect(
      isDeliveryCounterSession(
        activeAccountId: null,
        accountById: (_) => delivery,
      ),
      isFalse,
    );
  });

  test('account delivery → sessão delivery', () {
    expect(
      isDeliveryCounterSession(
        activeAccountId: 'delivery_1',
        accountById: (String id) => id == delivery.id ? delivery : null,
      ),
      isTrue,
    );
  });

  test('account de mesa → não é sessão delivery', () {
    expect(
      isDeliveryCounterSession(
        activeAccountId: 'table_1',
        accountById: (String id) => id == table.id ? table : null,
      ),
      isFalse,
    );
  });
}
