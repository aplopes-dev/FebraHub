import 'package:citybox_pdv/features/delivery/domain/delivery_order.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';

/// Pedidos de exemplo do quadro de delivery, com as contas correspondentes.
///
/// Fixture, no mesmo molde de `buildDefaultTables()`: existe para a tela ter o
/// que mostrar antes de haver backend, e some assim que o operador mexe em
/// qualquer coisa (a partir daí vale o que está gravado em `pdv.salon.v1`).
///
/// A amostra foi montada para cobrir **as quatro colunas do quadro e os cinco
/// tons da legenda** — inclusive "Aguardando Pagamento", que só aparece quando
/// a conta está em `closing`, e "Cancelado", que não é coluna e só surge pelo
/// filtro de situação. Ao mexer aqui, mantenha essa cobertura: a fixture é o
/// que se olha para conferir se as cores continuam certas.
typedef DeliveryFixture =
    ({List<DeliveryOrder> orders, List<SalonAccount> accounts});

DeliveryFixture buildDeliveryFixture() {
  final DateTime now = DateTime.now();
  final List<DeliveryOrder> orders = <DeliveryOrder>[];
  final List<SalonAccount> accounts = <SalonAccount>[];

  void add({
    required String seq,
    required DeliveryOrderStatus status,
    required String customerName,
    required String addressText,
    required int feeCents,
    required int minutesAgo,
    DeliveryFulfillment fulfillment = DeliveryFulfillment.delivery,
    SalonAccountStatus accountStatus = SalonAccountStatus.open,
    String? courierName,
  }) {
    final String accountId = 'fx_acc_$seq';
    final DateTime createdAt = now.subtract(Duration(minutes: minutesAgo));
    accounts.add(
      SalonAccount(
        id: accountId,
        status: accountStatus,
        openedAt: createdAt,
        origin: SalonOrigin.delivery,
        deliveryOrderId: 'fx_ord_$seq',
      ),
    );
    orders.add(
      DeliveryOrder(
        id: 'fx_ord_$seq',
        number: orders.length + 1,
        status: status,
        fulfillment: fulfillment,
        customerName: customerName,
        addressText: addressText,
        feeCents: feeCents,
        courierName: courierName,
        accountId: accountId,
        createdAt: createdAt,
        updatedAt: createdAt,
      ),
    );
  }

  // NOVO — aguardando confirmação (rosa).
  add(
    seq: '1',
    status: DeliveryOrderStatus.received,
    customerName: 'Maria Souza',
    addressText: 'Rua do Cais, 210 — Centro',
    feeCents: 700,
    minutesAgo: 4,
  );
  add(
    seq: '2',
    status: DeliveryOrderStatus.received,
    customerName: 'Carlos Andrade',
    addressText: 'Retirada no balcão',
    feeCents: 0,
    minutesAgo: 9,
    fulfillment: DeliveryFulfillment.pickup,
  );

  // PRONTO PARA ENTREGAR — um em aberto (laranja), um aguardando pagamento
  // (azul), que é a conta em `closing`.
  add(
    seq: '3',
    status: DeliveryOrderStatus.preparing,
    customerName: 'Joana Prado',
    addressText: 'Av. Soares Lopes, 1450 — Cidade Nova',
    feeCents: 900,
    minutesAgo: 16,
  );
  add(
    seq: '4',
    status: DeliveryOrderStatus.preparing,
    customerName: 'Rafael Lima',
    addressText: 'Rua Coronel Pessoa, 88 — Pontal',
    feeCents: 1200,
    minutesAgo: 21,
    accountStatus: SalonAccountStatus.closing,
  );

  // SAIU PARA ENTREGA — aberto (laranja).
  add(
    seq: '5',
    status: DeliveryOrderStatus.dispatched,
    customerName: 'Beatriz Nunes',
    addressText: 'Rua Itabuna, 33 — São Domingos',
    feeCents: 800,
    minutesAgo: 34,
    courierName: 'Diego',
  );

  // CONCLUÍDO — finalizado (verde).
  add(
    seq: '6',
    status: DeliveryOrderStatus.delivered,
    customerName: 'Paulo Ribeiro',
    addressText: 'Rua Pedro Pereira, 502 — Malhado',
    feeCents: 600,
    minutesAgo: 58,
    courierName: 'Diego',
  );

  // Fora do quadro: cancelado (cinza), só visível pelo filtro de situação.
  add(
    seq: '7',
    status: DeliveryOrderStatus.cancelled,
    customerName: 'Helena Castro',
    addressText: 'Rua Osvaldo Cruz, 12 — Conquista',
    feeCents: 700,
    minutesAgo: 72,
  );

  return (orders: orders, accounts: accounts);
}
