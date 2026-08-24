import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/home/presentation/home_page.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/presentation/operator_login_page.dart';

import '../helpers/operator_fixture.dart';
import '../helpers/pump_with_router.dart';

/// Terminal pareado ainda não vende: falta saber **quem** está no caixa.
///
/// A ordem dos três guards é credencial → operador → turno, e é o que estes
/// testes fixam junto com o comportamento de bloquear e trocar.

Future<void> _typePin(WidgetTester tester, String pin) async {
  for (final String digit in pin.split('')) {
    await tester.tap(find.widgetWithText(SizedBox, digit).first);
    await tester.pump();
  }
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('com terminal e sem operador, tudo cai no login', (
    WidgetTester tester,
  ) async {
    for (final String route in <String>[
      PdvRoutes.home,
      PdvRoutes.settings,
      PdvRoutes.salesHistory,
    ]) {
      await pumpWithRouter(
        tester,
        initialLocation: route,
        withOperator: false,
        withOpenShift: false,
      );
      await tester.pumpAndSettle();

      expect(
        find.byType(OperatorLoginPage),
        findsOneWidget,
        reason: '$route deixou passar sem operador',
      );
    }
  });

  testWidgets('a tela lista os operadores da unidade', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(tester, withOperator: false, withOpenShift: false);
    await tester.pumpAndSettle();

    expect(find.text(testOperator.label), findsOneWidget);
    expect(find.text(testSupervisor.label), findsOneWidget);
    // Sem operador escolhido, o teclado ainda não convida a digitar.
    expect(find.text('Escolha o operador'), findsOneWidget);
  });

  testWidgets('código e PIN corretos entram e liberam o app', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await pumpWithRouter(
      tester,
      withOperator: false,
      withOpenShift: false,
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text(testOperator.label));
    await tester.pumpAndSettle();
    await _typePin(tester, '1234');

    expect(container.read(operatorSessionProvider)?.id, testOperator.id);
    expect(find.byType(OperatorLoginPage), findsNothing);
    expect(find.byType(HomePage), findsOneWidget);
  });

  testWidgets('PIN errado mostra a mensagem da API e não entra', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await pumpWithRouter(
      tester,
      withOperator: false,
      withOpenShift: false,
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text(testOperator.label));
    await tester.pumpAndSettle();
    await _typePin(tester, '9999');

    // Mensagem genérica: a API não conta se o erro foi no código ou no PIN.
    expect(find.text('Código ou PIN incorreto'), findsOneWidget);
    expect(container.read(operatorSessionProvider), isNull);
    expect(find.byType(OperatorLoginPage), findsOneWidget);
  });

  testWidgets('tentativas erradas são contadas também no dispositivo', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await pumpWithRouter(
      tester,
      withOperator: false,
      withOpenShift: false,
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text(testOperator.label));
    await tester.pumpAndSettle();
    await _typePin(tester, '9999');
    await _typePin(tester, '8888');

    // Contador local existe porque no M4 o PIN passa a ser conferido offline —
    // um contador só no servidor seria zerado por qualquer queda de rede.
    expect(
      container
          .read(operatorSessionProvider.notifier)
          .attemptsFor(testOperator.code),
      2,
    );
  });

  testWidgets('operador bloqueado recebe a mensagem própria da API', (
    WidgetTester tester,
  ) async {
    final FakePosOperatorApi api = FakePosOperatorApi();
    api.failure = const PdvApiException(
      'Operador bloqueado por tentativas incorretas. '
      'Peça ao gerente para redefinir o PIN.',
      statusCode: 423,
    );

    await pumpWithRouter(
      tester,
      withOperator: false,
      withOpenShift: false,
      operatorApi: api,
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text(testOperator.label));
    await tester.pumpAndSettle();
    await _typePin(tester, '1234');

    // Bloqueio é dito, ao contrário de "código ou PIN": esconder isso faria o
    // operador repetir o PIN certo num loop, com o cliente esperando.
    expect(find.textContaining('bloqueado'), findsOneWidget);
  });

  testWidgets('trocar operador mantém o turno aberto', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await pumpWithRouter(tester);
    await tester.pumpAndSettle();
    expect(container.read(cashShiftProvider)?.isOpen, isTrue);

    container.read(operatorSessionProvider.notifier).switchOperator();
    await tester.pumpAndSettle();

    // Turno intacto: trocar de operador não é fechar caixa.
    expect(container.read(cashShiftProvider)?.isOpen, isTrue);
    expect(find.byType(OperatorLoginPage), findsOneWidget);
  });

  testWidgets('bloquear não perde carrinho nem turno', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await pumpWithRouter(tester);
    await tester.pumpAndSettle();

    container
        .read(counterCartProvider.notifier)
        .addProduct(
          const CounterProduct(
            id: 'p1',
            name: 'Café',
            priceCents: 500,
            categoryId: 'c1',
          ),
        );
    container.read(operatorLockedProvider.notifier).lock();
    await tester.pumpAndSettle();

    expect(find.text('Tela bloqueada'), findsOneWidget);

    await _typePin(tester, '1234');

    expect(container.read(operatorLockedProvider), isFalse);
    // Carrinho e turno seguem onde estavam — bloquear não é sair.
    expect(container.read(counterCartProvider), hasLength(1));
    expect(container.read(cashShiftProvider)?.isOpen, isTrue);
  });
}
