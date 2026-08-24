import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:citybox_pdv/features/payment/application/complete_sale.dart';
import 'package:citybox_pdv/features/policies/domain/pos_policy.dart';
import 'package:citybox_pdv/features/shared/application/connectivity_controller.dart';

import '../helpers/fake_pos_sales_api.dart';
import '../helpers/policy_fixture.dart';
import '../helpers/pump_with_router.dart';

/// Derruba a rede **depois** do login.
///
/// Não dá para começar offline neste harness, e a razão é boa: `pumpWithRouter`
/// entra pelo caminho real (código + PIN contra a API falsa), a chamada tem
/// sucesso, e o app conclui — corretamente — que está online. Derrubar depois
/// é o cenário de verdade: o expediente começou com link e ele caiu no meio.
void goOffline(ProviderContainer container) {
  container.read(terminalOnlineProvider.notifier).report(online: false);
}

void main() {
  group('AC-M4-6 — exceções bloqueadas sem rede', () {
    testWidgets('sangria acima do limite é recusada com instrução', (
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
      goOffline(container);

      await tester.enterText(find.widgetWithText(TextField, 'Valor'), '80000');
      await tester.pump();
      await tester.enterText(
        find.widgetWithText(TextField, 'Observação'),
        'Retirada para o cofre',
      );
      await tester.pump();
      await tester.tap(find.text('CONFIRMAR SANGRIA'));
      await tester.pumpAndSettle();
      if (find.text('Sangria acima do esperado').evaluate().isNotEmpty) {
        await tester.tap(find.text('Continuar'));
        await tester.pumpAndSettle();
      }

      // Não pede PIN: chamar o supervisor até o balcão para depois recusar
      // seria desperdiçar o tempo dele.
      expect(find.textContaining('Autorização —'), findsNothing);
      expect(find.text('Sangria precisa de rede'), findsOneWidget);
      // A mensagem diz o que fazer e o que **continua** funcionando.
      expect(find.textContaining('quando a conexão voltar'), findsOneWidget);

      await tester.tap(find.text('Entendi'));
      await tester.pumpAndSettle();
      expect(container.read(cashShiftProvider)!.movements, isEmpty);
    });

    testWidgets('cancelamento de venda é recusado', (
      WidgetTester tester,
    ) async {
      final FakePosSalesApi salesApi = FakePosSalesApi();
      final ProviderContainer container = await pumpWithRouter(
        tester,
        initialLocation: '${PdvRoutes.salesHistory}/sale-1',
        overrides: <Override>[
          policyOverride(const PosPolicy()),
          posSalesApiProvider.overrideWithValue(salesApi),
        ],
      );
      goOffline(container);

      await container
          .read(cashShiftProvider.notifier)
          .recordSale(
            SaleRecord(
              id: 'sale-1',
              serverSaleId: 'sale-remote-1',
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

      expect(
        find.text('Cancelamento de venda precisa de rede'),
        findsOneWidget,
      );
      await tester.tap(find.text('Entendi'));
      await tester.pumpAndSettle();

      expect(salesApi.cancelCalls, 0);
      expect(
        container.read(cashShiftProvider)!.sales.single.status,
        SaleRecordStatus.completed,
      );
    });
  });

  group('AC-M4-7 — o trabalho normal não é bloqueado', () {
    testWidgets('sangria dentro do limite passa offline', (
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
      goOffline(container);

      await tester.enterText(find.widgetWithText(TextField, 'Valor'), '5000');
      await tester.pump();
      await tester.enterText(
        find.widgetWithText(TextField, 'Observação'),
        'Troco',
      );
      await tester.pump();
      await tester.tap(find.text('CONFIRMAR SANGRIA'));
      await tester.pumpAndSettle();

      expect(find.textContaining('precisa de rede'), findsNothing);
      expect(container.read(cashShiftProvider)!.movements, hasLength(1));
    });

    testWidgets('reforço passa offline mesmo com alçada máxima', (
      WidgetTester tester,
    ) async {
      final ProviderContainer container = await pumpWithRouter(
        tester,
        initialLocation: PdvRoutes.cashMovement,
        overrides: <Override>[
          policyOverride(const PosPolicy(withdrawalSupervisorAboveCents: 0)),
        ],
      );
      goOffline(container);

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

      expect(find.textContaining('precisa de rede'), findsNothing);
      expect(container.read(cashShiftProvider)!.movements, hasLength(1));
    });

    testWidgets(
      'cancelamento exige rede mesmo sem alçada de supervisor',
      (WidgetTester tester) async {
        final FakePosSalesApi salesApi = FakePosSalesApi();
        final ProviderContainer container = await pumpWithRouter(
          tester,
          initialLocation: '${PdvRoutes.salesHistory}/sale-1',
          overrides: <Override>[
            policyOverride(
              const PosPolicy(cancellationRequiresSupervisor: false),
            ),
            posSalesApiProvider.overrideWithValue(salesApi),
          ],
        );
        goOffline(container);

        await container
            .read(cashShiftProvider.notifier)
            .recordSale(
              SaleRecord(
                id: 'sale-1',
                serverSaleId: 'sale-remote-1',
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

        expect(
          find.text('Cancelamento de venda precisa de rede'),
          findsOneWidget,
        );
        expect(salesApi.cancelCalls, 0);
        expect(
          container.read(cashShiftProvider)!.sales.single.status,
          SaleRecordStatus.completed,
        );
      },
    );

    testWidgets('fechar o caixa continua funcionando offline', (
      WidgetTester tester,
    ) async {
      final ProviderContainer container = await pumpWithRouter(
        tester,
        initialLocation: PdvRoutes.cashClose,
        overrides: <Override>[policyOverride(const PosPolicy())],
      );
      goOffline(container);
      await tester.pumpAndSettle();

      // A tela abre: bloquear o fechamento por falta de link transformaria uma
      // queda de rede em turno que não fecha.
      expect(find.textContaining('precisa de rede'), findsNothing);
    });
  });
}
