import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_category_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_search_controller.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_product_grid.dart';

import '../helpers/catalog_fixture.dart';

Future<ProviderContainer> _pumpGrid(
  WidgetTester tester, {
  List<Override> overrides = const <Override>[],
  Size size = const Size(1600, 1000),
}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);

  late ProviderContainer container;
  await tester.pumpWidget(
    ProviderScope(
      overrides: <Override>[...fixtureCatalogOverrides(), ...overrides],
      child: MaterialApp(
        home: Scaffold(
          body: Consumer(
            builder: (BuildContext context, WidgetRef ref, _) {
              container = ProviderScope.containerOf(context);
              return const CounterProductGrid();
            },
          ),
        ),
      ),
    ),
  );
  return container;
}

void main() {
  testWidgets('sem categoria selecionada, mostra todos os produtos', (
    WidgetTester tester,
  ) async {
    await _pumpGrid(tester);

    expect(find.text('Água Mineral c/ Gás'), findsOneWidget);
    expect(find.text('Pizza Família'), findsOneWidget);
    expect(find.text('Quentinha G'), findsOneWidget);
  });

  testWidgets('categoria selecionada filtra a grade', (
    WidgetTester tester,
  ) async {
    await _pumpGrid(
      tester,
      overrides: <Override>[
        counterCategoryProvider.overrideWith(() => _FixedCategory('pizzas')),
      ],
    );

    expect(find.text('Pizza Família'), findsOneWidget);
    expect(find.text('Água Mineral c/ Gás'), findsNothing);
    expect(find.text('Quentinha G'), findsNothing);
  });

  testWidgets('tocar um produto lança 1 unidade dele no carrinho', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await _pumpGrid(tester);

    await tester.tap(find.text('Água Mineral c/ Gás'));
    await tester.pump();

    final cart = container.read(counterCartProvider);
    expect(cart, hasLength(1));
    expect(cart.single.product.id, 'agua_com_gas');
    expect(cart.single.quantity, 1);
  });

  testWidgets('tocar o mesmo produto duas vezes soma a quantidade', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await _pumpGrid(tester);

    await tester.tap(find.text('Água Mineral c/ Gás'));
    await tester.pump();
    await tester.tap(find.text('Água Mineral c/ Gás'));
    await tester.pump();

    final cart = container.read(counterCartProvider);
    expect(cart, hasLength(1));
    expect(cart.single.quantity, 2);
  });

  testWidgets('a busca filtra a grade por nome do produto', (
    WidgetTester tester,
  ) async {
    await _pumpGrid(
      tester,
      overrides: <Override>[
        counterSearchProvider.overrideWith(() => _FixedSearch('pizza')),
      ],
    );

    expect(find.text('Pizza Família'), findsOneWidget);
    expect(find.text('Pizza Grande'), findsOneWidget);
    expect(find.text('Água Mineral c/ Gás'), findsNothing);
  });

  testWidgets('a busca não diferencia maiúsculas de minúsculas', (
    WidgetTester tester,
  ) async {
    await _pumpGrid(
      tester,
      overrides: <Override>[
        counterSearchProvider.overrideWith(() => _FixedSearch('PIZZA')),
      ],
    );

    expect(find.text('Pizza Família'), findsOneWidget);
  });

  testWidgets('busca e categoria se combinam — as duas precisam bater', (
    WidgetTester tester,
  ) async {
    await _pumpGrid(
      tester,
      overrides: <Override>[
        counterCategoryProvider.overrideWith(() => _FixedCategory('bebidas')),
        counterSearchProvider.overrideWith(() => _FixedSearch('pizza')),
      ],
    );

    // "Pizza" bate no nome, mas nenhuma pizza é da categoria "bebidas".
    expect(find.text('Pizza Família'), findsNothing);
    expect(find.text('Água Mineral c/ Gás'), findsNothing);
  });

  testWidgets('busca sem nenhum produto correspondente mostra aviso', (
    WidgetTester tester,
  ) async {
    await _pumpGrid(
      tester,
      overrides: <Override>[
        counterSearchProvider.overrideWith(
          () => _FixedSearch('produto que não existe'),
        ),
      ],
    );

    expect(find.text('Nenhum produto encontrado'), findsOneWidget);
  });

  testWidgets('6 produtos por fila é o teto, mesmo numa janela muito larga', (
    WidgetTester tester,
  ) async {
    // Larga o bastante para caber bem mais que 6 colunas de 160 px, se o
    // teto não existisse.
    await _pumpGrid(tester, size: const Size(3000, 1200));

    // Catálogo sem filtro, na ordem declarada: o 7º produto
    // ("Guaraná 1 Litro") só existe porque o 1º ("Água Mineral c/ Gás")
    // encheu a fila e ela quebrou — mesmo sobrando largura de sobra.
    final double firstTop =
        tester.getTopLeft(find.text('Água Mineral c/ Gás')).dy;
    final double seventhTop =
        tester.getTopLeft(find.text('Guaraná 1 Litro')).dy;

    expect(seventhTop, greaterThan(firstTop));
  });

  testWidgets(
    'o botão tem a mesma largura em toda a grade — fila cheia ou não',
    (WidgetTester tester) async {
      await _pumpGrid(tester, size: const Size(1600, 1200));

      // 23 produtos, 6 por fila: três filas cheias (18) e uma última com 5 —
      // "Suco de Laranja 1/2 Jarra" é o primeiro dela. O botão é padronizado:
      // a fila com sobra não estica os que tem para preencher o espaço, fica
      // do mesmo tamanho dos de cima e o resto da fila sobra em branco.
      final double fullRowWidth =
          tester
              .getSize(
                find.ancestor(
                  of: find.text('Água Mineral c/ Gás'),
                  matching: find.byType(InkWell),
                ),
              )
              .width;
      final double partialRowWidth =
          tester
              .getSize(
                find.ancestor(
                  of: find.text('Suco de Laranja 1/2 Jarra'),
                  matching: find.byType(InkWell),
                ),
              )
              .width;

      expect(partialRowWidth, fullRowWidth);
    },
  );

  testWidgets(
    'o botão nunca passa da largura máxima, mesmo numa janela muito larga',
    (WidgetTester tester) async {
      await _pumpGrid(tester, size: const Size(3000, 1200));

      final double width =
          tester
              .getSize(
                find.ancestor(
                  of: find.text('Água Mineral c/ Gás'),
                  matching: find.byType(InkWell),
                ),
              )
              .width;

      // Sem teto de largura, 6 colunas numa janela de 3000 px ficariam com
      // quase 500 px cada.
      expect(width, lessThanOrEqualTo(320));
    },
  );

  testWidgets('o botão nunca fica mais estreito que a largura mínima', (
    WidgetTester tester,
  ) async {
    await _pumpGrid(tester, size: const Size(1024, 1200));

    final double width =
        tester
            .getSize(
              find.ancestor(
                of: find.text('Água Mineral c/ Gás'),
                matching: find.byType(InkWell),
              ),
            )
            .width;

    expect(width, greaterThanOrEqualTo(150));
  });

  testWidgets('o botão de produto é mais alto que antes', (
    WidgetTester tester,
  ) async {
    await _pumpGrid(tester);

    final double height =
        tester
            .getSize(
              find.ancestor(
                of: find.text('Água Mineral c/ Gás'),
                matching: find.byType(InkWell),
              ),
            )
            .height;

    // 66 px era a altura medida antes deste ajuste (padding vertical `sm`).
    // Não é um número arbitrário — é o "antes" real, para o teste travar um
    // aumento de verdade, não só qualquer valor maior que zero.
    expect(height, greaterThan(66));
  });

  testWidgets('o botão de produto tem sombra', (WidgetTester tester) async {
    await _pumpGrid(tester);

    final DecoratedBox box = tester.widget<DecoratedBox>(
      find
          .ancestor(
            of: find.text('Água Mineral c/ Gás'),
            matching: find.byType(DecoratedBox),
          )
          .first,
    );
    final BoxDecoration decoration = box.decoration as BoxDecoration;

    expect(decoration.boxShadow, PdvCounterColors.productShadow);
  });

  testWidgets('a grade tem borda superior separando da área acima', (
    WidgetTester tester,
  ) async {
    await _pumpGrid(tester);

    final DecoratedBox box = tester.widget<DecoratedBox>(
      find.byType(DecoratedBox).first,
    );
    final BoxDecoration decoration = box.decoration as BoxDecoration;

    expect(decoration.color, PdvCounterColors.background);
    expect(decoration.border?.top.color, PdvCounterColors.border);
    expect(decoration.border?.top.width, PdvSizes.borderWidth);
  });
}

class _FixedCategory extends CounterCategoryController {
  _FixedCategory(this._categoryId);

  final String _categoryId;

  @override
  String? build() => _categoryId;
}

class _FixedSearch extends CounterSearchController {
  _FixedSearch(this._query);

  final String _query;

  @override
  String build() => _query;
}
