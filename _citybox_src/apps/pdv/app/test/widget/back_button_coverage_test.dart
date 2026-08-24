import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';

import '../helpers/pump_with_router.dart';

/// Toda tela alcançável tem que ter uma saída visível.
///
/// Existe porque a app bar padrão do PDV **não tinha** Voltar: qualquer tela
/// que se contentasse com ela — Crédito, Consulta de preço, Devolução — nascia
/// sem saída, e ninguém percebia até um operador ficar preso. O teste é a
/// trava: tela nova sem Voltar quebra a suíte.
///
/// Duas exceções, ambas por serem fim de linha e não descuido:
/// `/` (raiz) e `/sale-completed` (a venda já fechou; as saídas são os botões
/// da própria tela).
const List<String> _routesThatMustOfferBack = <String>[
  PdvRoutes.counter,
  PdvRoutes.payment,
  PdvRoutes.customerForm,
  PdvRoutes.cash,
  PdvRoutes.cashMovement,
  PdvRoutes.cashClose,
  PdvRoutes.salesHistory,
  PdvRoutes.settings,
  PdvRoutes.priceCheck,
  PdvRoutes.refund,
  PdvRoutes.credit,
  PdvRoutes.tables,
  PdvRoutes.tabs,
  PdvRoutes.service,
  PdvRoutes.deliveryNew,
  PdvRoutes.deliveryOrders,
];

/// Um Voltar pode aparecer como rótulo (`PdvAppBarButton`, em maiúsculas) ou
/// só como ícone — as duas formas contam.
Finder _backAffordance() {
  return find.byWidgetPredicate((Widget w) {
    if (w is Text) {
      return w.data?.toUpperCase().contains('VOLTAR') ?? false;
    }
    if (w is Icon) {
      return w.icon == Icons.chevron_left || w.icon == Icons.arrow_back;
    }
    return false;
  }, description: 'rótulo ou ícone de Voltar');
}

void main() {
  for (final String route in _routesThatMustOfferBack) {
    testWidgets('$route oferece Voltar', (WidgetTester tester) async {
      await pumpWithRouter(tester, initialLocation: route, withOpenShift: true);
      await tester.pumpAndSettle();

      expect(
        _backAffordance(),
        findsWidgets,
        reason: '$route ficou sem saída para o operador',
      );
    });
  }

  testWidgets('tela inicial não mostra Voltar', (WidgetTester tester) async {
    await pumpWithRouter(tester, initialLocation: PdvRoutes.home);
    await tester.pumpAndSettle();

    expect(_backAffordance(), findsNothing);
  });

  group('PdvScaffold', () {
    testWidgets('desenha Voltar na app bar padrão por omissão', (
      WidgetTester tester,
    ) async {
      await pumpWithRouter(
        tester,
        initialLocation: PdvRoutes.home,
        homeOverride: const PdvScaffold(body: SizedBox.shrink()),
      );
      await tester.pumpAndSettle();

      expect(_backAffordance(), findsWidgets);
    });

    testWidgets('showBack: false omite o Voltar', (WidgetTester tester) async {
      await pumpWithRouter(
        tester,
        initialLocation: PdvRoutes.home,
        homeOverride: const PdvScaffold(
          showBack: false,
          body: SizedBox.shrink(),
        ),
      );
      await tester.pumpAndSettle();

      expect(_backAffordance(), findsNothing);
    });
  });
}
