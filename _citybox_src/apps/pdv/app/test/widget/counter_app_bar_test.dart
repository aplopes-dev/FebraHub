import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/counter/presentation/widgets/counter_app_bar.dart';
import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';

import '../helpers/fixed_module_visibility.dart';

/// Largura de desktop — abaixo de `minimumSize` (1024×640, fixado em
/// `main.dart`), que é o menor que a janela chega em produção. O tamanho
/// padrão de teste (800×600) estoura a app bar, que tem Voltar, separador,
/// cliente, loja e Comandas todos numa linha só.
Future<void> _pumpBar(
  WidgetTester tester, {
  List<Override> overrides = const <Override>[],
}) {
  tester.view.physicalSize = const Size(1280, 800);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);

  return tester.pumpWidget(
    ProviderScope(
      overrides: overrides,
      child: const MaterialApp(home: Scaffold(body: CounterAppBar())),
    ),
  );
}

void main() {
  testWidgets('mostra Voltar, cliente padrão, loja e Comandas', (
    WidgetTester tester,
  ) async {
    await _pumpBar(tester);

    expect(find.text('VOLTAR'), findsOneWidget);
    expect(find.text('CONSUMIDOR FINAL - PADRÃO'), findsOneWidget);
    expect(find.text('MINHA LOJA'), findsOneWidget);
    expect(find.text('COMANDAS'), findsOneWidget);
  });

  testWidgets('mostra o nome do estabelecimento vindo do provider', (
    WidgetTester tester,
  ) async {
    await _pumpBar(
      tester,
      overrides: <Override>[
        establishmentNameProvider.overrideWithValue('Mercearia da Ana'),
      ],
    );

    expect(find.text('MERCEARIA DA ANA'), findsOneWidget);
    expect(find.text('MINHA LOJA'), findsNothing);
  });

  testWidgets('módulo de comandas desligado esconde o botão Comandas', (
    WidgetTester tester,
  ) async {
    await _pumpBar(
      tester,
      overrides: <Override>[
        moduleVisibilityProvider.overrideWith(
          () => FixedModuleVisibilityController(
            disabled: <String>{PdvModuleIds.tabs},
          ),
        ),
      ],
    );

    expect(find.text('COMANDAS'), findsNothing);
    expect(find.text('VOLTAR'), findsOneWidget);
    expect(find.text('CONSUMIDOR FINAL - PADRÃO'), findsOneWidget);
    expect(find.text('MINHA LOJA'), findsOneWidget);
  });

  testWidgets('módulo de cliente é núcleo: permanece mesmo forçando disabled', (
    WidgetTester tester,
  ) async {
    await _pumpBar(
      tester,
      overrides: <Override>[
        moduleVisibilityProvider.overrideWith(
          () => FixedModuleVisibilityController(
            disabled: <String>{PdvModuleIds.customer},
          ),
        ),
      ],
    );

    // FR-002: validator força núcleo `available` — o botão não some.
    expect(find.text('CONSUMIDOR FINAL - PADRÃO'), findsOneWidget);
    expect(find.byType(VerticalDivider), findsOneWidget);
    expect(find.text('VOLTAR'), findsOneWidget);
  });
}
