import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/data/pos_cash_session_api.dart';
import 'package:citybox_pdv/features/cash/data/shared_preferences_cash_shift_store.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/cash_movement.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
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

  test('open then reject second open', () async {
    final CashShiftController ctrl = container.read(cashShiftProvider.notifier);
    await ctrl.openShift(openingFloatCents: 10000, operator: testOperator);
    expect(container.read(cashShiftProvider)?.isOpen, isTrue);
    expect(
      () => ctrl.openShift(openingFloatCents: 0, operator: testOperator),
      throwsA(isA<StateError>()),
    );
  });

  test('close blocked when sale in progress', () async {
    final CashShiftController ctrl = container.read(cashShiftProvider.notifier);
    await ctrl.openShift(openingFloatCents: 0, operator: testOperator);
    container
        .read(counterCartProvider.notifier)
        .addProduct(
          const CounterProduct(
            id: 'p1',
            name: 'X',
            priceCents: 100,
            categoryId: 'c',
          ),
        );
    expect(ctrl.saleInProgress, isTrue);
    expect(
      () => ctrl.closeShift(
        counts: const CashCloseCounts(
          countedCashCents: 0,
          countedCreditCents: 0,
          countedDebitCents: 0,
          countedVoucherCents: 0,
          countedOtherCents: 0,
        ),
      ),
      throwsA(isA<StateError>()),
    );
  });

  test('withdrawal updates movements', () async {
    final CashShiftController ctrl = container.read(cashShiftProvider.notifier);
    await ctrl.openShift(openingFloatCents: 10000, operator: testOperator);
    await ctrl.addWithdrawal(amountCents: 1500, reason: 'banco');
    expect(
      container.read(cashShiftProvider)!.movements.single.type,
      CashMovementType.withdrawal,
    );
  });

  test('hydrate substitui vendas locais pela lista do servidor', () async {
    final FakePosCashSessionApi api = FakePosCashSessionApi();
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final SharedPreferencesCashShiftStore store =
        SharedPreferencesCashShiftStore(prefs);

    final DateTime openedAt = DateTime.utc(2026, 8, 15, 9);
    api.seedOpen(
      PosCashSessionDto(
        id: 'sess-1',
        status: 'open',
        openedAt: openedAt,
        openingFloatCents: 0,
        openedByUserId: testOperator.id,
        openedByName: testOperator.name,
      ),
    );
    api.seedSessionSales(<SaleRecord>[
      SaleRecord(
        id: 'remote-1',
        number: 1,
        serverSaleId: 'remote-1',
        serverNumber: 1,
        shiftId: 'sess-1',
        status: SaleRecordStatus.completed,
        createdAt: openedAt.add(const Duration(minutes: 5)),
        lines: const <SaleLineSnapshot>[],
        payments: const <SalePaymentSnapshot>[],
        subtotalCents: 100,
        totalCents: 100,
        cashReceivedCents: 0,
        changeCents: 0,
        cashNetCents: 0,
      ),
    ]);

    // Cache local com venda fantasma (mesmo turno).
    await store.write(
      CashShift(
        id: 'sess-1',
        status: CashShiftStatus.open,
        openedAt: openedAt,
        openingFloatCents: 0,
        openedByOperatorId: testOperator.id,
        openedByOperatorName: testOperator.name,
        movements: const <CashMovement>[],
        sales: <SaleRecord>[
          SaleRecord(
            id: 'local-ghost',
            number: 9,
            shiftId: 'sess-1',
            status: SaleRecordStatus.completed,
            createdAt: openedAt,
            lines: const <SaleLineSnapshot>[],
            payments: const <SalePaymentSnapshot>[],
            subtotalCents: 1,
            totalCents: 1,
            cashReceivedCents: 0,
            changeCents: 0,
            cashNetCents: 0,
          ),
        ],
      ),
    );

    final ProviderContainer c = ProviderContainer(
      overrides: <Override>[
        cashShiftStoreProvider.overrideWithValue(store),
        posCashSessionApiProvider.overrideWithValue(api),
      ],
    );
    addTearDown(c.dispose);

    await c.read(cashShiftProvider.notifier).hydrate();

    expect(api.getCurrentSessionSalesCalls, 1);
    final List<SaleRecord> sales = c.read(cashShiftProvider)!.sales;
    expect(sales, hasLength(1));
    expect(sales.single.id, 'remote-1');
  });

  test('refreshSessionSales com lista vazia limpa histórico fantasma', () async {
    final FakePosCashSessionApi api = FakePosCashSessionApi();
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final ProviderContainer c = ProviderContainer(
      overrides: <Override>[
        cashShiftStoreProvider.overrideWithValue(
          SharedPreferencesCashShiftStore(prefs),
        ),
        posCashSessionApiProvider.overrideWithValue(api),
      ],
    );
    addTearDown(c.dispose);

    await c.read(cashShiftProvider.notifier).hydrate();
    await c
        .read(cashShiftProvider.notifier)
        .openShift(openingFloatCents: 0, operator: testOperator);

    // Grava venda só no cache local.
    await c.read(cashShiftProvider.notifier).recordSale(
      SaleRecord(
        id: 'local-only',
        shiftId: c.read(cashShiftProvider)!.id,
        status: SaleRecordStatus.completed,
        createdAt: DateTime.now(),
        lines: const <SaleLineSnapshot>[],
        payments: const <SalePaymentSnapshot>[],
        subtotalCents: 50,
        totalCents: 50,
        cashReceivedCents: 0,
        changeCents: 0,
        cashNetCents: 0,
      ),
    );
    expect(c.read(cashShiftProvider)!.sales, hasLength(1));

    api.seedSessionSales(const <SaleRecord>[]);
    await c.read(cashShiftProvider.notifier).refreshSessionSales();
    expect(c.read(cashShiftProvider)!.sales, isEmpty);
  });
}
