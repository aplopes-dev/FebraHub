import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';

import '../helpers/pump_with_router.dart';

/// O nome na barra de título tem que ser sempre o da tela em que se está.
///
/// Existe porque **não era**: cada `push` atribuía o título à mão antes de
/// navegar e ninguém o devolvia no `pop`, então voltar de Mesas para o Início
/// deixava "Mesas" na barra. Agora o título é derivado da rota, e este teste é
/// a trava de que continua sendo.
///
/// É o único teste que liga a barra de título (`showCustomTitleBarProvider`);
/// os demais a desligam porque ela só existe no desktop.

const Map<String, String> _titleByRoute = <String, String>{
  PdvRoutes.home: 'Início',
  PdvRoutes.tables: 'Mesas',
  PdvRoutes.tabs: 'Comandas',
  PdvRoutes.salesHistory: 'Últimas vendas',
  PdvRoutes.cashClose: 'Fechamento de caixa',
  PdvRoutes.settings: 'Configurações',
};

List<Override> _overrides() => <Override>[
  showCustomTitleBarProvider.overrideWithValue(true),
  // O relógio da barra é um `Stream.periodic` de 1 s; num teste ele fica
  // pendente e derruba a suíte. Aqui a hora é fixa — o que se está checando é
  // o título ao lado dele.
  clockProvider.overrideWith(
    (Ref ref) => Stream<DateTime>.value(DateTime(2026, 8, 6, 9, 30)),
  ),
];

void main() {
  // O relógio da barra usa `DateFormat('pt_BR')`; sem isto ele lança, como
  // lançaria no app se o `main` não inicializasse a localização.
  setUpAll(() async {
    await initializeDateFormatting('pt_BR');
  });

  _titleByRoute.forEach((String route, String title) {
    testWidgets('$route anuncia "$title" na barra', (
      WidgetTester tester,
    ) async {
      await pumpWithRouter(
        tester,
        initialLocation: route,
        overrides: _overrides(),
      );
      await tester.pumpAndSettle();

      expect(find.text(title), findsWidgets);
    });
  });

  testWidgets('voltar devolve o título da tela anterior', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.home,
      overrides: _overrides(),
    );
    await tester.pumpAndSettle();
    expect(find.text('Início'), findsWidgets);

    // O caminho relatado: o atalho fixo da app bar leva ao fechamento…
    await tester.tap(find.byIcon(Icons.exit_to_app).first);
    await tester.pumpAndSettle();
    expect(find.text('Fechamento de caixa'), findsWidgets);
    expect(find.text('Início'), findsNothing);

    // …e voltar tem que devolver "Início", não deixar o título velho.
    await tester.tap(find.text('VOLTAR'));
    await tester.pumpAndSettle();
    expect(find.text('Início'), findsWidgets);
    expect(find.text('Fechamento de caixa'), findsNothing);
  });

  testWidgets('navegação normal não escreve no override', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.tables,
      overrides: _overrides(),
    );
    await tester.pumpAndSettle();

    // Se escrevesse, o título voltaria a ser um estado que alguém precisa
    // lembrar de limpar — que é exatamente o defeito que isto substituiu.
    expect(container.read(pageTitleOverrideProvider), isNull);
  });
}
