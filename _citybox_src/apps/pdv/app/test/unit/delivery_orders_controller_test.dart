import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/delivery/application/delivery_orders_controller.dart';
import 'package:citybox_pdv/features/delivery/domain/delivery_order.dart';
import 'package:citybox_pdv/features/tables/application/salon_controller.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';

DeliveryOrder _order({
  required String id,
  int number = 0,
  DeliveryOrderStatus status = DeliveryOrderStatus.received,
  DeliveryFulfillment fulfillment = DeliveryFulfillment.delivery,
  String? customerName,
  String addressText = 'Rua A, 100',
  int minutesAgo = 0,
}) {
  final DateTime now = DateTime(2026, 8, 5, 20);
  return DeliveryOrder(
    id: id,
    number: number,
    status: status,
    fulfillment: fulfillment,
    customerName: customerName,
    addressText: addressText,
    feeCents: 500,
    accountId: 'acc-$id',
    createdAt: now.subtract(Duration(minutes: minutesAgo)),
    updatedAt: now,
  );
}

SalonAccount _account(SalonAccountStatus status) {
  return SalonAccount(
    id: 'acc-1',
    status: status,
    openedAt: DateTime(2026, 8, 5, 19),
    origin: SalonOrigin.delivery,
  );
}

void main() {
  group('deliveryToneOf', () {
    test('recebido e sem conta fechando = aguardando confirmação', () {
      expect(
        deliveryToneOf(_order(id: '1'), _account(SalonAccountStatus.open)),
        DeliveryTone.awaitingConfirmation,
      );
    });

    test('despachado com conta ativa = aguardando pagamento (COD)', () {
      expect(
        deliveryToneOf(
          _order(id: '1', status: DeliveryOrderStatus.dispatched),
          _account(SalonAccountStatus.open),
        ),
        DeliveryTone.awaitingPayment,
      );
    });

    test('em preparo = aberto', () {
      expect(
        deliveryToneOf(
          _order(id: '1', status: DeliveryOrderStatus.preparing),
          _account(SalonAccountStatus.open),
        ),
        DeliveryTone.open,
      );
    });

    test('conta fechando = aguardando pagamento, mesmo em preparo', () {
      // É o estado que não existe em `DeliveryOrderStatus`: sem olhar a conta
      // este pedido apareceria como "aberto" e o pagamento pendente sumiria.
      expect(
        deliveryToneOf(
          _order(id: '1', status: DeliveryOrderStatus.preparing),
          _account(SalonAccountStatus.closing),
        ),
        DeliveryTone.awaitingPayment,
      );
    });

    test('pago e não entregue = Pago (mesmo em closing)', () {
      expect(
        deliveryToneOf(
          _order(id: '1', status: DeliveryOrderStatus.preparing).copyWith(
            saleOrderId: 'sale-1',
          ),
          _account(SalonAccountStatus.closing),
        ),
        DeliveryTone.paid,
      );
    });

    test('entregue = finalizado, ainda que a conta esteja fechando', () {
      expect(
        deliveryToneOf(
          _order(id: '1', status: DeliveryOrderStatus.delivered),
          _account(SalonAccountStatus.closing),
        ),
        DeliveryTone.finished,
      );
    });

    test('cancelado vence tudo', () {
      expect(
        deliveryToneOf(
          _order(id: '1', status: DeliveryOrderStatus.cancelled),
          _account(SalonAccountStatus.closing),
        ),
        DeliveryTone.cancelled,
      );
    });

    test('pedido sem conta não quebra', () {
      expect(
        deliveryToneOf(_order(id: '1'), null),
        DeliveryTone.awaitingConfirmation,
      );
    });
  });

  group('filterDeliveryOrders', () {
    final List<DeliveryOrder> orders = <DeliveryOrder>[
      _order(id: 'a', customerName: 'Maria', minutesAgo: 30),
      _order(
        id: 'b',
        customerName: 'João',
        fulfillment: DeliveryFulfillment.pickup,
        status: DeliveryOrderStatus.delivered,
        minutesAgo: 20,
      ),
      _order(
        id: 'c',
        customerName: 'Ana',
        status: DeliveryOrderStatus.cancelled,
        minutesAgo: 10,
      ),
    ];

    test('sem filtro devolve tudo, do mais recente para o mais antigo', () {
      final List<DeliveryOrder> result = filterDeliveryOrders(
        orders: orders,
        query: const DeliveryOrdersQuery(
          statuses: <DeliveryStatusFilter>{},
        ),
      );
      expect(result.map((DeliveryOrder o) => o.id).toList(), <String>[
        'c',
        'b',
        'a',
      ]);
    });

    test('conjunto vazio de forma de entrega não filtra nada', () {
      expect(
        filterDeliveryOrders(
          orders: orders,
          query: const DeliveryOrdersQuery(
            statuses: <DeliveryStatusFilter>{},
          ),
        ).length,
        3,
      );
    });

    test('filtra por retirada', () {
      final List<DeliveryOrder> result = filterDeliveryOrders(
        orders: orders,
        query: const DeliveryOrdersQuery(
          fulfillments: <DeliveryFulfillment>{DeliveryFulfillment.pickup},
          statuses: <DeliveryStatusFilter>{},
        ),
      );
      expect(result.single.id, 'b');
    });

    test('"abertos" junta recebido, em preparo e a caminho', () {
      final List<DeliveryOrder> result = filterDeliveryOrders(
        orders: <DeliveryOrder>[
          _order(id: 'r'),
          _order(id: 'p', status: DeliveryOrderStatus.preparing),
          _order(id: 'd', status: DeliveryOrderStatus.dispatched),
          _order(id: 'f', status: DeliveryOrderStatus.delivered),
        ],
        query: const DeliveryOrdersQuery(
          statuses: <DeliveryStatusFilter>{DeliveryStatusFilter.open},
        ),
      );
      expect(result.map((DeliveryOrder o) => o.id).toSet(), <String>{
        'r',
        'p',
        'd',
      });
    });

    test('filtros de situação somam, não intersectam', () {
      final List<DeliveryOrder> result = filterDeliveryOrders(
        orders: orders,
        query: const DeliveryOrdersQuery(
          statuses: <DeliveryStatusFilter>{
            DeliveryStatusFilter.closed,
            DeliveryStatusFilter.cancelled,
          },
        ),
      );
      expect(result.map((DeliveryOrder o) => o.id).toSet(), <String>{'b', 'c'});
    });

    test('busca casa cliente e endereço', () {
      expect(
        filterDeliveryOrders(
          orders: orders,
          query: const DeliveryOrdersQuery(
            search: 'maria',
            statuses: <DeliveryStatusFilter>{},
          ),
        ).single.id,
        'a',
      );
      expect(
        filterDeliveryOrders(
          orders: orders,
          query: const DeliveryOrdersQuery(
            search: 'rua a',
            statuses: <DeliveryStatusFilter>{},
          ),
        ).length,
        3,
      );
    });
  });

  group('groupDeliveryOrdersByColumn', () {
    test('tem as quatro colunas do quadro, sem cancelados', () {
      final Map<DeliveryOrderStatus, List<DeliveryOrder>> grouped =
          groupDeliveryOrdersByColumn(<DeliveryOrder>[
            _order(id: 'r'),
            _order(id: 'f', status: DeliveryOrderStatus.delivered),
            _order(id: 'x', status: DeliveryOrderStatus.cancelled),
          ]);

      expect(grouped.keys.toList(), deliveryBoardColumns);
      expect(grouped[DeliveryOrderStatus.received]!.single.id, 'r');
      expect(grouped[DeliveryOrderStatus.delivered]!.single.id, 'f');
      expect(
        grouped.containsKey(DeliveryOrderStatus.cancelled),
        isFalse,
        reason: 'cancelado é saída do fluxo, não etapa dele',
      );
    });
  });

  group('paginateDeliveryOrders', () {
    final List<DeliveryOrder> many = <DeliveryOrder>[
      for (int i = 0; i < 5; i++) _order(id: 'o$i', minutesAgo: i),
    ];

    test('recorta a página pedida e informa vizinhas', () {
      final DeliveryOrdersPageResult first = paginateDeliveryOrders(
        orders: many,
        query: const DeliveryOrdersQuery(perPage: 2),
      );
      expect(first.data.length, 2);
      expect(first.totalPages, 3);
      expect(first.hasPrevious, isFalse);
      expect(first.hasNext, isTrue);

      final DeliveryOrdersPageResult last = paginateDeliveryOrders(
        orders: many,
        query: const DeliveryOrdersQuery(page: 3, perPage: 2),
      );
      expect(last.data.single.id, 'o4');
      expect(last.hasNext, isFalse);
    });

    test('fixa a página na última quando o resultado encolhe', () {
      final DeliveryOrdersPageResult result = paginateDeliveryOrders(
        orders: many.take(2).toList(),
        query: const DeliveryOrdersQuery(page: 3, perPage: 2),
      );
      expect(result.page, 1);
      expect(result.data.length, 2);
    });

    test('sem pedidos não tem páginas', () {
      final DeliveryOrdersPageResult result = paginateDeliveryOrders(
        orders: const <DeliveryOrder>[],
        query: const DeliveryOrdersQuery(),
      );
      expect(result.totalPages, 0);
      expect(result.hasNext, isFalse);
    });
  });

  group('nextDeliveryOrderNumber', () {
    test('começa em 1 e usa o maior já emitido', () {
      expect(nextDeliveryOrderNumber(const <DeliveryOrder>[]), 1);
      expect(
        nextDeliveryOrderNumber(<DeliveryOrder>[
          _order(id: 'a', number: 1),
          // Cancelado continua ocupando o número dele: contar o tamanho da
          // lista reemitiria um número já usado.
          _order(id: 'b', number: 2, status: DeliveryOrderStatus.cancelled),
        ]),
        3,
      );
    });
  });

  group('DeliveryOrder', () {
    test('forma de entrega sobrevive ao round-trip de JSON', () {
      final DeliveryOrder original = _order(
        id: 'a',
        fulfillment: DeliveryFulfillment.pickup,
      );
      expect(
        DeliveryOrder.fromJson(original.toJson()).fulfillment,
        DeliveryFulfillment.pickup,
      );
    });

    test('pedido gravado antes do campo vira entrega, e sem número', () {
      final Map<String, dynamic> legacy =
          _order(id: 'a', number: 3).toJson()
            ..remove('fulfillment')
            ..remove('number');
      final DeliveryOrder restored = DeliveryOrder.fromJson(legacy);
      expect(restored.fulfillment, DeliveryFulfillment.delivery);
      expect(restored.number, 0);
    });

    test('número sobrevive ao round-trip de JSON', () {
      expect(
        DeliveryOrder.fromJson(_order(id: 'a', number: 9).toJson()).number,
        9,
      );
    });
  });
}
