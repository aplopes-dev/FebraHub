import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/counter/application/counter_category_controller.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_category_sidebar.dart';

import '../helpers/catalog_fixture.dart';

Future<ProviderContainer> _pumpSidebar(WidgetTester tester) async {
  tester.view.physicalSize = const Size(400, 800);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);

  late ProviderContainer container;
  await tester.pumpWidget(
    ProviderScope(
      overrides: fixtureCatalogOverrides(),
      child: MaterialApp(
        home: Scaffold(
          body: Consumer(
            builder: (BuildContext context, WidgetRef ref, _) {
              container = ProviderScope.containerOf(context);
              return const CounterCategorySidebar();
            },
          ),
        ),
      ),
    ),
  );
  return container;
}

void main() {
  testWidgets('lista "Todos os produtos" e as categorias do catálogo', (
    WidgetTester tester,
  ) async {
    await _pumpSidebar(tester);

    // "Todos os produtos" é texto do app; as categorias vêm do cadastro do
    // lojista e aparecem em caixa alta — ver `CounterCategorySidebar`.
    expect(find.text('Todos os produtos'), findsOneWidget);
    expect(find.text('BEBIDAS'), findsOneWidget);
    expect(find.text('PIZZAS'), findsOneWidget);
  });

  testWidgets('tocar uma categoria seleciona ela no provider', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await _pumpSidebar(tester);

    expect(container.read(counterCategoryProvider), isNull);

    await tester.tap(find.text('PIZZAS'));
    await tester.pump();

    expect(container.read(counterCategoryProvider), 'pizzas');
  });

  testWidgets('tocar "Todos os produtos" volta a seleção para null', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await _pumpSidebar(tester);

    container.read(counterCategoryProvider.notifier).select('pizzas');
    await tester.pump();

    await tester.tap(find.text('Todos os produtos'));
    await tester.pump();

    expect(container.read(counterCategoryProvider), isNull);
  });
}
