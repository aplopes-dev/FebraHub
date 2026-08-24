import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/service/domain/service_queue_item.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';

void main() {
  test('buildServiceQueue só open/closing', () {
    final List<SalonAccount> accounts = <SalonAccount>[
      SalonAccount(
        id: '1',
        status: SalonAccountStatus.open,
        openedAt: DateTime(2026, 1, 1),
        origin: SalonOrigin.table,
        tableId: 't1',
      ),
      SalonAccount(
        id: '2',
        status: SalonAccountStatus.closing,
        openedAt: DateTime(2026, 1, 1),
        origin: SalonOrigin.tab,
        tabNumber: '12',
      ),
      SalonAccount(
        id: '3',
        status: SalonAccountStatus.closed,
        openedAt: DateTime(2026, 1, 1),
        closedAt: DateTime(2026, 1, 2),
        origin: SalonOrigin.table,
        tableId: 't2',
      ),
    ];
    final List<ServiceQueueItem> queue = buildServiceQueue(accounts);
    expect(queue.map((ServiceQueueItem e) => e.accountId), <String>['1', '2']);
  });
}
