import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/domain/cash_movement.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:citybox_pdv/features/counter/application/sale_adjustment_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_totals.dart';
import 'package:citybox_pdv/features/counter/domain/sale_adjustment.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/sale_adjustment_row.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';
import 'package:citybox_pdv/features/payment/application/complete_sale.dart';
import 'package:citybox_pdv/features/policies/domain/pos_policy.dart';

import '../helpers/fake_pos_sales_api.dart';
import '../helpers/operator_fixture.dart';
import '../helpers/policy_fixture.dart';
import '../helpers/pump_with_router.dart';

/// Digita o PIN do supervisor no diálogo aberto e espera ele fechar.
Future<void> authorizeAsSupervisor(WidgetTester tester) async {
  await tester.tap(find.byType(DropdownButtonFormField<PosOperator>).first);
  await tester.pumpAndSettle();
  await tester.tap(find.text(testSupervisor.label).last);
  await tester.pumpAndSettle();

  for (final String digit in <String>['1', '2', '3', '4']) {
    await tester.tap(find.text(digit));
    await tester.pump();
  }
  await tester.pumpAndSettle();
}

Future<void> fillWithdrawal(WidgetTester tester, String digits) async {
  await tester.enterText(find.widgetWithText(TextField, 'Valor'), digits);
  await tester.pump();
  await tester.enterText(
    find.widgetWithText(TextField, 'Observação'),
    'Retirada para o cofre',
  );
  await tester.pump();
  await tester.tap(find.text('CONFIRMAR SANGRIA'));
  await tester.pumpAndSettle();

  // A tela já tinha um aviso próprio para sangria maior que o esperado em
  // gaveta, e ele vem **antes** da alçada. Os dois convivem: um fala de saldo,
  // o outro de permissão.
  if (find.text('Sangria acima do esperado').evaluate().isNotEmpty) {
    await tester.tap(find.text('Continuar'));
    await tester.pumpAndSettle();
  }
}

void main() {
  group('Sangria', () {
    testWidgets('abaixo do limite não pede supervisor', (
      WidgetTester tester,
    ) async {
      final ProviderContainer container = await pumpWithRouter(
        tester,
        initialLocation: PdvRoutes.cashMovement,
        overrides: <Override>[
          policyOverride(
            const PosPolicy(withdrawalSupervisorAboveCents: 50000),
          ),
        ],
      );

      // R$ 100,00 — o limite é R$ 500,00.
      await fillWithdrawal(tester, '10000');

      expect(find.textContaining('Autorização —'), findsNothing);
      final CashShift shift = container.read(cashShiftProvider)!;
      expect(shift.movements, hasLength(1));
      expect(shift.movements.single.authorizedByOperatorName, isNull);
    });

    testWidgets('acima do limite pede supervisor e registra quem autorizou', (
      WidgetTester tester,
    ) async {
      final ProviderContainer container = await pumpWithRouter(
        tester,
        initialLocation: PdvRoutes.cashMovement,
        overrides: <Override>[
          policyOverride(
            const PosPolicy(withdrawalSupervisorAboveCents: 50000),
          ),
        ],
      );

      // R$ 800,00 — acima do limite.
      await fillWithdrawal(tester, '80000');

      expect(find.textContaining('Autorização —'), findsOneWidget);
      // O supervisor vê o valor que está assinando, não só "autorize".
      expect(
        find.textContaining('Sangria de ${formatCents(80000)}'),
        findsOneWidget,
      );

      await authorizeAsSupervisor(tester);

      final CashShift shift = container.read(cashShiftProvider)!;
      final CashMovement movement = shift.movements.single;
      expect(movement.amountCents, 80000);
      expect(movement.authorizedByOperatorName, testSupervisor.name);
      // Quem tirou continua sendo o operador do turno — autorizar não é operar.
      expect(movement.operatorName, testOperator.name);
      // E a sessão do caixa não mudou.
      expect(container.read(operatorSessionProvider)?.id, testOperator.id);
    });

    testWidgets('desistir da autorização não lança a sangria', (
      WidgetTester tester,
    ) async {
      final ProviderContainer container = await pumpWithRouter(
        tester,
        initialLocation: PdvRoutes.cashMovement,
        overrides: <Override>[
          policyOverride(
            const PosPolicy(withdrawalSupervisorAboveCents: 50000),
          ),
        ],
      );

      await fillWithdrawal(tester, '80000');
      await tester.tap(find.text('Cancelar').last);
      await tester.pumpAndSettle();

      expect(container.read(cashShiftProvider)!.movements, isEmpty);
    });

    testWidgets('reforço nunca pede supervisor', (WidgetTester tester) async {
      final ProviderContainer container = await pumpWithRouter(
        tester,
        initialLocation: PdvRoutes.cashMovement,
        overrides: <Override>[
          // Limite zero: toda sangria pediria. Reforço, nenhuma — é dinheiro
          // entrando na gaveta.
          policyOverride(const PosPolicy(withdrawalSupervisorAboveCents: 0)),
        ],
      );

      await tester.tap(find.text('REFORÇO'));
      await tester.pumpAndSettle();
      await tester.enterText(find.widgetWithText(TextField, 'Valor'), '90000');
      await tester.pump();
      await tester.enterText(
        find.widgetWithText(TextField, 'Observação'),
        'Troco',
      );
      await tester.pump();
      await tester.tap(find.text('CONFIRMAR REFORÇO'));
      await tester.pumpAndSettle();

      expect(find.textContaining('Autorização —'), findsNothing);
      expect(container.read(cashShiftProvider)!.movements, hasLength(1));
    });

    testWidgets('caixa sem permissão de sangria pede PIN de quem tem', (
      WidgetTester tester,
    ) async {
      final ProviderContainer container = await pumpWithRouter(
        tester,
        initialLocation: PdvRoutes.cashMovement,
        sessionOperator: testCashier,
        operatorApi: FakePosOperatorApi(
          operators: const <PosOperator>[testCashier, testSupervisor],
        ),
        overrides: <Override>[
          policyOverride(
            const PosPolicy(withdrawalSupervisorAboveCents: 50000),
          ),
        ],
      );

      // Abaixo do limite de alçada — ainda pede quem tem withdrawal.
      await fillWithdrawal(tester, '10000');

      expect(find.textContaining('Autorização —'), findsOneWidget);
      expect(
        find.textContaining('Este operador não pode registrar sangria'),
        findsOneWidget,
      );
      expect(find.text('Autorizador'), findsOneWidget);

      await authorizeAsSupervisor(tester);

      final CashShift shift = container.read(cashShiftProvider)!;
      expect(shift.movements, hasLength(1));
      expect(shift.movements.single.authorizedByOperatorName, testSupervisor.name);
      expect(container.read(operatorSessionProvider)?.id, testCashier.id);
    });
  });

  group('Cancelamento de venda', () {
    Future<({ProviderContainer container, FakePosSalesApi api})> pumpSaleDetail(
      WidgetTester tester, {
      required bool requiresSupervisor,
      FakePosSalesApi? salesApi,
      String? serverSaleId = 'sale-remote-1',
    }) async {
      final FakePosSalesApi api = salesApi ?? FakePosSalesApi();
      final ProviderContainer container = await pumpWithRouter(
        tester,
        initialLocation: '${PdvRoutes.salesHistory}/sale-1',
        overrides: <Override>[
          policyOverride(
            PosPolicy(cancellationRequiresSupervisor: requiresSupervisor),
          ),
          posSalesApiProvider.overrideWithValue(api),
        ],
      );

      await container
          .read(cashShiftProvider.notifier)
          .recordSale(
            SaleRecord(
              id: 'sale-1',
              serverSaleId: serverSaleId,
              shiftId: container.read(cashShiftProvider)!.id,
              status: SaleRecordStatus.completed,
              createdAt: DateTime(2026, 8, 6, 10),
              lines: const <SaleLineSnapshot>[],
              payments: const <SalePaymentSnapshot>[],
              subtotalCents: 5000,
              totalCents: 5000,
              cashReceivedCents: 5000,
              changeCents: 0,
              cashNetCents: 5000,
            ),
          );
      await tester.pumpAndSettle();

      await tester.tap(find.text('Cancelar venda').last);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Cancelar venda').last);
      await tester.pumpAndSettle();

      return (container: container, api: api);
    }

    testWidgets('com a alçada ligada, pede supervisor e registra', (
      WidgetTester tester,
    ) async {
      final (:container, :api) = await pumpSaleDetail(
        tester,
        requiresSupervisor: true,
      );

      expect(find.textContaining('Autorização —'), findsOneWidget);
      await authorizeAsSupervisor(tester);

      expect(api.cancelCalls, 1);
      expect(api.lastCancelSaleId, 'sale-remote-1');
      expect(api.lastCancelAuthorizedByUserId, testSupervisor.id);
      final SaleRecord sale = container.read(cashShiftProvider)!.sales.single;
      expect(sale.status, SaleRecordStatus.cancelled);
      expect(sale.cancellationAuthorizedByOperatorName, testSupervisor.name);
    });

    testWidgets('com a alçada desligada, cancela direto', (
      WidgetTester tester,
    ) async {
      final (:container, :api) = await pumpSaleDetail(
        tester,
        requiresSupervisor: false,
      );

      expect(find.textContaining('Autorização —'), findsNothing);
      expect(api.cancelCalls, 1);
      final SaleRecord sale = container.read(cashShiftProvider)!.sales.single;
      expect(sale.status, SaleRecordStatus.cancelled);
      expect(sale.cancellationAuthorizedByOperatorName, isNull);
    });

    testWidgets('erro 409 da API não cancela o espelho local', (
      WidgetTester tester,
    ) async {
      final FakePosSalesApi api = FakePosSalesApi(
        cancelThrowMessage:
            'Recebíveis já conciliados — não é possível cancelar.',
      );
      final (:container, api: _) = await pumpSaleDetail(
        tester,
        requiresSupervisor: false,
        salesApi: api,
      );

      expect(api.cancelCalls, 1);
      expect(
        find.textContaining('Recebíveis já conciliados'),
        findsOneWidget,
      );
      expect(
        container.read(cashShiftProvider)!.sales.single.status,
        SaleRecordStatus.completed,
      );
    });
  });

  group('Desconto no balcão', () {
    /// Venda de R$ 100,00 — assim o percentual e o valor batem de cabeça.
    const CounterTotals totals = CounterTotals(
      subtotalCents: 10000,
      discountCents: 0,
      itemCount: 1,
    );

    Future<ProviderContainer> pumpAdjustmentRow(
      WidgetTester tester, {
      required PosPolicy policy,
    }) async {
      late ProviderContainer container;
      await tester.pumpWidget(
        ProviderScope(
          overrides: <Override>[
            policyOverride(policy),
            posOperatorApiProvider.overrideWithValue(FakePosOperatorApi()),
          ],
          child: Consumer(
            builder: (BuildContext context, WidgetRef ref, _) {
              container = ProviderScope.containerOf(context);
              return const MaterialApp(
                home: Scaffold(body: SaleAdjustmentRow(totals: totals)),
              );
            },
          ),
        ),
      );
      await tester.pumpAndSettle();
      return container;
    }

    Future<void> enterDiscount(
      WidgetTester tester, {
      required String value,
      bool inReais = false,
    }) async {
      await tester.tap(find.text('Ajuste da venda').first);
      await tester.pumpAndSettle();
      if (inReais) {
        await tester.tap(find.text('R\$'));
        await tester.pumpAndSettle();
      }
      await tester.enterText(find.byType(TextField), value);
      await tester.pump();
      await tester.tap(find.text('Aplicar'));
      await tester.pumpAndSettle();
    }

    testWidgets('abaixo do limite aplica direto', (WidgetTester tester) async {
      final ProviderContainer container = await pumpAdjustmentRow(
        tester,
        policy: const PosPolicy(discountSupervisorAbovePercent: 10),
      );

      await enterDiscount(tester, value: '5');

      expect(find.textContaining('Autorização —'), findsNothing);
      expect(container.read(saleAdjustmentProvider)?.percentBps, 500);
    });

    testWidgets('acima do limite pede supervisor e registra quem autorizou', (
      WidgetTester tester,
    ) async {
      final ProviderContainer container = await pumpAdjustmentRow(
        tester,
        policy: const PosPolicy(discountSupervisorAbovePercent: 10),
      );

      await enterDiscount(tester, value: '20');

      expect(find.textContaining('Autorização —'), findsOneWidget);
      await authorizeAsSupervisor(tester);

      final SaleAdjustment adjustment = container.read(saleAdjustmentProvider)!;
      expect(adjustment.percentBps, 2000);
      expect(adjustment.authorizedByOperatorName, testSupervisor.name);
    });

    testWidgets('desconto em reais é convertido antes de comparar', (
      WidgetTester tester,
    ) async {
      await pumpAdjustmentRow(
        tester,
        policy: const PosPolicy(discountSupervisorAbovePercent: 10),
      );

      // R$ 90,00 numa venda de R$ 100,00 são 90% — em reais o limite
      // percentual continua valendo, senão seria a porta dos fundos da alçada.
      await enterDiscount(tester, value: '9000', inReais: true);

      expect(find.textContaining('Autorização —'), findsOneWidget);
    });

    testWidgets('recusar mantém o ajuste anterior', (
      WidgetTester tester,
    ) async {
      final ProviderContainer container = await pumpAdjustmentRow(
        tester,
        policy: const PosPolicy(discountSupervisorAbovePercent: 10),
      );

      await enterDiscount(tester, value: '20');
      await tester.tap(find.text('Cancelar').last);
      await tester.pumpAndSettle();

      expect(container.read(saleAdjustmentProvider), isNull);
    });

    testWidgets('acréscimo nunca pede supervisor', (WidgetTester tester) async {
      final ProviderContainer container = await pumpAdjustmentRow(
        tester,
        // Limite zero: qualquer desconto pediria. Acréscimo aumenta o que a
        // loja recebe — não é o que a alçada existe para conter.
        policy: const PosPolicy(discountSupervisorAbovePercent: 0),
      );

      await tester.tap(find.text('Ajuste da venda').first);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Acréscimo'));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextField), '50');
      await tester.pump();
      await tester.tap(find.text('Aplicar'));
      await tester.pumpAndSettle();

      expect(find.textContaining('Autorização —'), findsNothing);
      expect(
        container.read(saleAdjustmentProvider)?.kind,
        SaleAdjustmentKind.surcharge,
      );
    });
  });
}
