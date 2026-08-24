import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/delivery/application/delivery_orders_controller.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';

void main() {
  test('boardLabel alinhado ao domínio', () {
    expect(DeliveryOrderStatus.received.boardLabel, 'Novo');
    expect(DeliveryOrderStatus.preparing.boardLabel, 'Em preparo');
    expect(DeliveryOrderStatus.dispatched.boardLabel, 'Despachado');
    expect(DeliveryOrderStatus.delivered.boardLabel, 'Concluído');
  });

  test('query padrão filtra só abertos', () {
    const DeliveryOrdersQuery query = DeliveryOrdersQuery();
    expect(query.statuses, <DeliveryStatusFilter>{DeliveryStatusFilter.open});
    expect(query.hasActiveFilter, isFalse);
  });

  test('hasActiveFilter quando sai do padrão Abertos', () {
    expect(
      const DeliveryOrdersQuery(
        statuses: <DeliveryStatusFilter>{},
      ).hasActiveFilter,
      isTrue,
    );
    expect(
      const DeliveryOrdersQuery(
        statuses: <DeliveryStatusFilter>{DeliveryStatusFilter.closed},
      ).hasActiveFilter,
      isTrue,
    );
  });
}
