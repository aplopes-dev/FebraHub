import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';

/// Projeção de atendimento (fila) — não é ledger paralelo.
class ServiceQueueItem {
  const ServiceQueueItem({
    required this.accountId,
    required this.title,
    required this.openedAt,
    required this.itemCount,
    required this.totalCentsPreview,
  });

  final String accountId;
  final String title;
  final DateTime openedAt;
  final int itemCount;
  final int totalCentsPreview;
}

List<ServiceQueueItem> buildServiceQueue(
  List<SalonAccount> accounts, {
  String Function(SalonAccount account)? titleOf,
}) {
  final List<SalonAccount> active =
      accounts.where((SalonAccount a) => a.isActive).toList()..sort(
        (SalonAccount a, SalonAccount b) => a.openedAt.compareTo(b.openedAt),
      );

  return <ServiceQueueItem>[
    for (final SalonAccount account in active)
      ServiceQueueItem(
        accountId: account.id,
        title: titleOf?.call(account) ?? _defaultTitle(account),
        openedAt: account.openedAt,
        itemCount: account.lines.fold(
          0,
          (int sum, CounterCartLine line) => sum + line.quantity,
        ),
        totalCentsPreview: account.lines.fold(
          0,
          (int sum, CounterCartLine line) => sum + line.totalCents,
        ),
      ),
  ];
}

String _defaultTitle(SalonAccount account) {
  if (account.tableId != null) {
    return 'Mesa ${account.tableId}';
  }
  if (account.tabNumber != null && account.tabNumber!.isNotEmpty) {
    return 'Comanda ${account.tabNumber}';
  }
  if (account.tabCard != null && account.tabCard!.isNotEmpty) {
    return 'Cartão ${account.tabCard}';
  }
  return switch (account.origin) {
    SalonOrigin.delivery => 'Delivery',
    SalonOrigin.counter => 'Balcão',
    SalonOrigin.table => 'Mesa',
    SalonOrigin.tab => 'Comanda',
  };
}
