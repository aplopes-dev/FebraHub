import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/features/cash/presentation/cash_close_page.dart';

import '../helpers/pump_with_router.dart';

/// O **Fechar caixa** é fixo: mora no `PdvAppBarChrome`, então nenhuma tela
/// precisa lembrar de colocá-lo — e o teste é a trava de que continua assim.
///
/// Fora da lista de propósito: Balcão e Pagamento, onde há venda aberta e o
/// turno recusaria o fechamento, e a própria tela de fechamento.
const List<String> _routesWithCloseAction = <String>[
  PdvRoutes.home,
  PdvRoutes.cash,
  PdvRoutes.cashMovement,
  PdvRoutes.salesHistory,
  PdvRoutes.settings,
  PdvRoutes.tables,
  PdvRoutes.tabs,
  PdvRoutes.service,
  PdvRoutes.deliveryOrders,
  PdvRoutes.priceCheck,
  PdvRoutes.refund,
  PdvRoutes.credit,
];

/// Só o ícone: o botão não tem mais rótulo de texto na barra.
Finder _closeAction() => find.byIcon(Icons.exit_to_app);

void main() {
  for (final String route in _routesWithCloseAction) {
    testWidgets('$route mostra Fechar caixa na app bar', (
      WidgetTester tester,
    ) async {
      await pumpWithRouter(tester, initialLocation: route, withOpenShift: true);
      await tester.pumpAndSettle();

      expect(
        _closeAction(),
        findsOneWidget,
        reason: '$route ficou sem o atalho fixo de fechamento',
      );
    });
  }

  testWidgets('Balcão não mostra: a venda em andamento bloqueia o fechamento', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.counter,
      withOpenShift: true,
    );
    await tester.pumpAndSettle();

    expect(_closeAction(), findsNothing);
  });

  testWidgets('Pagamento não mostra, pelo mesmo motivo do Balcão', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.payment,
      withOpenShift: true,
    );
    await tester.pumpAndSettle();

    expect(_closeAction(), findsNothing);
  });

  testWidgets('sem turno aberto o botão some — não há caixa para fechar', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.home,
      withOpenShift: false,
    );
    await tester.pumpAndSettle();

    expect(_closeAction(), findsNothing);
  });

  testWidgets('o botão leva à tela de fechamento', (WidgetTester tester) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.home,
      withOpenShift: true,
    );
    await tester.pumpAndSettle();

    await tester.tap(_closeAction());
    await tester.pumpAndSettle();

    expect(find.byType(CashClosePage), findsOneWidget);
    expect(find.text('Fechamento de caixa'), findsOneWidget);
    expect(find.text('Informe os valores'), findsOneWidget);
  });

  testWidgets('a tela de fechamento pede os cinco canais', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.cashClose,
      withOpenShift: true,
    );
    await tester.pumpAndSettle();

    for (final String label in <String>[
      'Dinheiro',
      'Cartão de Crédito',
      'Cartão de Débito',
      'Voucher',
      'Outros',
    ]) {
      expect(find.text(label), findsOneWidget, reason: '$label sumiu da tela');
    }
  });

  testWidgets('fechar mostra o resumo da conferência e volta para o início', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.cashClose,
      withOpenShift: true,
    );
    await tester.pumpAndSettle();

    // Turno aberto com R$ 100,00 de fundo; declarar R$ 90,00 é uma falta de
    // R$ 10,00, e o resumo tem que dizer isso em vez de só "turno fechado".
    await tester.enterText(find.byType(TextField).first, '9000');
    await tester.pumpAndSettle();

    await tester.tap(find.text('FECHAR CAIXA'));
    await tester.pumpAndSettle();

    expect(find.text('Caixa fechado'), findsOneWidget);
    expect(find.textContaining('10,00'), findsWidgets);

    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();

    expect(find.byType(CashClosePage), findsNothing);
  });
}
