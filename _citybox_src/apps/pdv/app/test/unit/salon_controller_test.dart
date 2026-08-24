import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/tables/application/salon_controller.dart';
import 'package:citybox_pdv/features/tables/data/shared_preferences_salon_store.dart';
import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/customer/domain/customer_address.dart';
import 'package:citybox_pdv/features/delivery/application/delivery_counter_draft.dart';
import 'package:citybox_pdv/features/delivery/data/pos_delivery_api.dart';
import 'package:citybox_pdv/features/delivery/domain/delivery_order.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class _FakePosDeliveryGateway implements PosDeliveryGateway {
  final DateTime now = DateTime.utc(2026, 8, 15, 15);
  DeliveryOrderStatus? lastStatus;
  Map<String, dynamic>? lastHeader;
  Map<String, dynamic>? lastCreateBody;

  PosDeliveryOrderDto _dto({
    DeliveryOrderStatus status = DeliveryOrderStatus.received,
    String? courierId,
    String? courierName,
    List<CounterCartLine> lines = const <CounterCartLine>[],
    int feeCents = 500,
  }) {
    return PosDeliveryOrderDto(
      order: DeliveryOrder(
        id: 'delivery-1',
        number: 1,
        status: status,
        addressText: 'Rua A, 10',
        feeCents: feeCents,
        courierId: courierId,
        courierName: courierName,
        createdAt: now,
        updatedAt: now,
        goodsTotalCents: deliveryTotalsFromLines(lines, feeCents).goodsTotalCents,
        totalCents: deliveryTotalsFromLines(lines, feeCents).totalCents,
      ),
      lines: lines,
      address: const CustomerAddress(),
    );
  }

  @override
  Future<PosDeliveryOrderDto> create(Map<String, dynamic> body) async {
    lastCreateBody = body;
    final List<dynamic> rawLines =
        (body['lines'] as List<dynamic>?) ?? const <dynamic>[];
    final List<CounterCartLine> lines = rawLines
        .map((dynamic raw) {
          final Map<String, dynamic> json = Map<String, dynamic>.from(
            raw as Map,
          );
          return CounterCartLine(
            product: CounterProduct(
              id: json['productId']! as String,
              name: (json['productName'] as String?) ?? '',
              priceCents: (json['unitPriceCents'] as num?)?.toInt() ?? 0,
              categoryId: '',
            ),
            quantity:
                int.tryParse(json['quantity']?.toString() ?? '')?.clamp(1, 999) ??
                1,
          );
        })
        .toList(growable: false);
    return _dto(
      feeCents: (body['feeCents'] as num?)?.toInt() ?? 500,
      lines: lines,
    );
  }

  @override
  Future<PosDeliveryOrderDto> updateStatus(
    String id,
    DeliveryOrderStatus status,
  ) async {
    lastStatus = status;
    return _dto(status: status);
  }

  @override
  Future<PosDeliveryOrderDto> getById(String id) async => _dto();

  @override
  Future<List<PosDeliveryOrderDto>> list() async => <PosDeliveryOrderDto>[
    _dto(),
  ];

  @override
  Future<List<PosCourier>> listCouriers() async => const <PosCourier>[];

  @override
  Future<PosDeliveryOrderDto> replaceLines(
    String id,
    List<CounterCartLine> lines,
  ) async => _dto(lines: lines);

  @override
  Future<PosDeliveryOrderDto> updateHeader(
    String id,
    Map<String, dynamic> body,
  ) async {
    lastHeader = body;
    return _dto(
      courierId: body['courierId'] as String?,
      courierName: body['courierName'] as String?,
    );
  }
}

void main() {
  test('openTable e transfer; destino ocupado rejeita', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{
      SharedPreferencesSalonStore.storageKey: jsonEncode(
        SalonSnapshot.emptyFixture().toJson(),
      ),
    });
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final ProviderContainer container = ProviderContainer(
      overrides: <Override>[
        salonStoreProvider.overrideWithValue(
          SharedPreferencesSalonStore(prefs),
        ),
      ],
    );
    addTearDown(container.dispose);
    final SalonController ctrl = container.read(salonProvider.notifier);
    await ctrl.hydrate();

    final String a1 = await ctrl.openTable('t1');
    expect(ctrl.accountById(a1)?.tableId, 't1');

    await ctrl.transferTable(fromTableId: 't1', toTableId: 't2');
    expect(ctrl.accountById(a1)?.tableId, 't2');

    await ctrl.openTable('t1');
    expect(
      () => ctrl.transferTable(fromTableId: 't2', toTableId: 't1'),
      throwsA(isA<StateError>()),
    );
  });

  test(
    'cancelAccount marca delivery como cancelled no servidor e espelho',
    () async {
      SharedPreferences.setMockInitialValues(<String, Object>{});
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      final _FakePosDeliveryGateway api = _FakePosDeliveryGateway();
      final ProviderContainer container = ProviderContainer(
        overrides: <Override>[
          salonStoreProvider.overrideWithValue(
            SharedPreferencesSalonStore(prefs),
          ),
          posDeliveryApiProvider.overrideWithValue(api),
        ],
      );
      addTearDown(container.dispose);
      final SalonController ctrl = container.read(salonProvider.notifier);
      await ctrl.hydrate();

      final String accountId = await ctrl.createDeliveryOrder(
        addressText: 'Rua A, 10',
        feeCents: 500,
      );
      await ctrl.cancelAccount(accountId);

      expect(api.lastStatus, DeliveryOrderStatus.cancelled);
      expect(
        container.read(salonProvider).deliveryOrders.single.status,
        DeliveryOrderStatus.cancelled,
      );
      expect(ctrl.accountById(accountId)?.isActive, isFalse);
    },
  );

  test('updateDeliveryHeader grava entregador no espelho', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final _FakePosDeliveryGateway api = _FakePosDeliveryGateway();
    final ProviderContainer container = ProviderContainer(
      overrides: <Override>[
        salonStoreProvider.overrideWithValue(SharedPreferencesSalonStore(prefs)),
        posDeliveryApiProvider.overrideWithValue(api),
      ],
    );
    addTearDown(container.dispose);
    final SalonController ctrl = container.read(salonProvider.notifier);
    await ctrl.hydrate();
    await ctrl.createDeliveryOrder(addressText: 'Rua A, 10', feeCents: 500);

    await ctrl.updateDeliveryHeader('delivery-1', <String, dynamic>{
      'courierId': 'cour-1',
      'courierName': 'João',
    });

    expect(api.lastHeader?['courierName'], 'João');
    expect(
      container.read(salonProvider).deliveryOrders.single.courierName,
      'João',
    );
  });

  test('beginDeliveryDraft não cria pedido no Kanban nem no ERP', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final _FakePosDeliveryGateway api = _FakePosDeliveryGateway();
    final ProviderContainer container = ProviderContainer(
      overrides: <Override>[
        salonStoreProvider.overrideWithValue(
          SharedPreferencesSalonStore(prefs),
        ),
        posDeliveryApiProvider.overrideWithValue(api),
      ],
    );
    addTearDown(container.dispose);
    final SalonController ctrl = container.read(salonProvider.notifier);
    await ctrl.hydrate();

    final String draftId = await ctrl.beginDeliveryDraft(
      addressText: 'Rua A, 10',
      feeCents: 500,
      customerName: 'Maria',
    );

    expect(api.lastCreateBody, isNull);
    expect(container.read(salonProvider).deliveryOrders, isEmpty);
    expect(isUncommittedDeliveryAccount(ctrl.accountById(draftId)), isTrue);
    expect(container.read(deliveryCounterDraftProvider)?.accountId, draftId);
  });

  test('discardDeliveryDraft remove rascunho sem chamar ERP', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final _FakePosDeliveryGateway api = _FakePosDeliveryGateway();
    final ProviderContainer container = ProviderContainer(
      overrides: <Override>[
        salonStoreProvider.overrideWithValue(
          SharedPreferencesSalonStore(prefs),
        ),
        posDeliveryApiProvider.overrideWithValue(api),
      ],
    );
    addTearDown(container.dispose);
    final SalonController ctrl = container.read(salonProvider.notifier);
    await ctrl.hydrate();
    final String draftId = await ctrl.beginDeliveryDraft(
      addressText: 'Rua A, 10',
      feeCents: 500,
    );

    await ctrl.discardDeliveryDraft(draftId);

    expect(api.lastCreateBody, isNull);
    expect(ctrl.accountById(draftId), isNull);
    expect(container.read(deliveryCounterDraftProvider), isNull);
    expect(container.read(salonProvider).deliveryOrders, isEmpty);
  });

  test('commitDeliveryDraft cria no ERP e aparece no Kanban', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final _FakePosDeliveryGateway api = _FakePosDeliveryGateway();
    final ProviderContainer container = ProviderContainer(
      overrides: <Override>[
        salonStoreProvider.overrideWithValue(
          SharedPreferencesSalonStore(prefs),
        ),
        posDeliveryApiProvider.overrideWithValue(api),
      ],
    );
    addTearDown(container.dispose);
    final SalonController ctrl = container.read(salonProvider.notifier);
    await ctrl.hydrate();
    final String draftId = await ctrl.beginDeliveryDraft(
      addressText: 'Rua A, 10',
      feeCents: 500,
      customerName: 'Maria',
    );
    const CounterCartLine line = CounterCartLine(
      product: CounterProduct(
        id: 'p1',
        name: 'Pizza',
        priceCents: 4000,
        categoryId: 'food',
      ),
      quantity: 1,
    );

    final String committedId = await ctrl.commitDeliveryDraft(
      const <CounterCartLine>[line],
    );

    expect(api.lastCreateBody, isNotNull);
    expect((api.lastCreateBody!['lines'] as List<dynamic>).length, 1);
    expect(ctrl.accountById(draftId), isNull);
    expect(ctrl.accountById(committedId)?.deliveryOrderId, 'delivery-1');
    expect(container.read(salonProvider).deliveryOrders, hasLength(1));
    expect(container.read(deliveryCounterDraftProvider), isNull);
  });
}
