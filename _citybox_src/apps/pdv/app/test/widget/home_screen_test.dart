import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/operator_fixture.dart';
import '../helpers/pump_app_at_home.dart';

import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/home/data/home_actions.dart';
import 'package:citybox_pdv/features/home/domain/home_action.dart';
import 'package:citybox_pdv/features/home/presentation/home_page.dart';
import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';

import '../helpers/fixed_module_visibility.dart';

/// Monta o app sem a barra de título e com turno aberto (guards do Balcão).
Future<void> _pumpHome(
  WidgetTester tester, {
  List<Override> overrides = const <Override>[],
  bool withOpenShift = true,
}) async {
  // Passa pelos guards de verdade — ver `pumpAppAtHome`.
  final ProviderContainer container = await pumpAppAtHome(
    tester,
    overrides: overrides,
  );
  if (!withOpenShift) {
    return;
  }
  await container.read(cashShiftProvider.notifier).hydrate();
  if (container.read(cashShiftProvider)?.isOpen != true) {
    await container
        .read(cashShiftProvider.notifier)
        .openShift(openingFloatCents: 10000, operator: testOperator);
  }
  await tester.pumpAndSettle();
}

void main() {
  setUp(() {
    TestWidgetsFlutterBinding.ensureInitialized();
  });

  testWidgets('mostra todas as ações do catálogo', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1600, 1000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await _pumpHome(tester, withOpenShift: false);

    final ProviderContainer container = ProviderScope.containerOf(
      tester.element(find.byType(HomePage)),
    );
    final modules = container.read(moduleVisibilityProvider);

    for (final HomeAction action in homeActions) {
      if (!modules.isOperationallyVisible(action.id)) {
        continue;
      }
      expect(
        find.text(action.label.toUpperCase()),
        findsOneWidget,
        reason: 'ação "${action.id}" não apareceu na tela',
      );
    }
  });

  testWidgets('cada ação exibe a própria tecla de atalho', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(1600, 1000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await _pumpHome(tester, withOpenShift: false);

    expect(find.text('(B)'), findsOneWidget);
    expect(find.text('(F8)'), findsOneWidget);
    expect(find.text('(Ç)'), findsOneWidget);
  });

  testWidgets('tocar em Cliente abre o seletor de clientes', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(1600, 1000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await _pumpHome(tester);
    await tester.tap(find.text('CLIENTE'));
    await tester.pump();
    // O catálogo dispara HTTP em background; não usar pumpAndSettle.
    await tester.pump(const Duration(milliseconds: 50));

    expect(find.textContaining('Cliente'), findsWidgets);
  });

  testWidgets('tocar em Balcão navega para a tela do Balcão', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(1600, 1000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await _pumpHome(tester);
    await tester.tap(find.text('BALCÃO'));
    await tester.pumpAndSettle();

    expect(find.text('BALCÃO'), findsNothing);
    expect(find.text('VOLTAR'), findsOneWidget);
    expect(find.text('CONSUMIDOR FINAL - PADRÃO'), findsOneWidget);

    await tester.tap(find.text('VOLTAR'));
    await tester.pumpAndSettle();

    expect(find.text('BALCÃO'), findsOneWidget);
  });

  testWidgets(
    'desligar o módulo de comandas some com o bloco no início e o botão no Balcão',
    (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1600, 1000);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);

      await _pumpHome(tester);

      final ProviderContainer container = ProviderScope.containerOf(
        tester.element(find.byType(HomePage)),
      );
      container
          .read(moduleVisibilityProvider.notifier)
          .setVisible(PdvModuleIds.tabs, visible: false);
      await tester.pump();

      expect(find.text('COMANDAS'), findsNothing);

      await tester.tap(find.text('BALCÃO'));
      await tester.pumpAndSettle();

      expect(find.text('COMANDAS'), findsNothing);
      expect(find.text('VOLTAR'), findsOneWidget);
    },
  );

  testWidgets('módulo blocked some da Home igual disabled', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(1600, 1000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await _pumpHome(
      tester,
      withOpenShift: false,
      overrides: <Override>[
        moduleVisibilityProvider.overrideWith(
          () => FixedModuleVisibilityController(
            blocked: <String>{PdvModuleIds.tables},
          ),
        ),
      ],
    );

    expect(find.text('MESAS'), findsNothing);
    expect(find.text('BALCÃO'), findsOneWidget);
  });

  testWidgets('a tecla de atalho dispara a mesma ação do toque', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(1600, 1000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await _pumpHome(tester, withOpenShift: true);

    await tester.sendKeyEvent(LogicalKeyboardKey.keyM);
    await tester.pumpAndSettle();

    // M abre Mesas (rota real da Fase 2), não o snack de "não implementado".
    expect(find.textContaining('Mesa'), findsWidgets);
  });

  testWidgets('nenhuma tecla de atalho está duplicada', (
    WidgetTester tester,
  ) async {
    final Set<String> seen = <String>{};
    for (final HomeAction action in homeActions) {
      final String key = action.shortcut.keyLabel;
      expect(
        seen.add(key),
        isTrue,
        reason: 'tecla "$key" usada por mais de uma ação',
      );
    }
  });
}
