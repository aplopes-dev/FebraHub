import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/catalog/application/catalog_controller.dart';
import 'package:citybox_pdv/features/catalog/domain/catalog_snapshot.dart';
import 'package:citybox_pdv/features/catalog/domain/catalog_source.dart';
import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_category.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart'
    show CatalogAddon, CounterProduct;
import 'package:citybox_pdv/features/price_check/presentation/price_check_page.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';

import '../helpers/pump_with_router.dart';

void main() {
  testWidgets('consulta válida não altera o carrinho; inválido mostra erro', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.priceCheck,
      withOpenShift: true,
    );

    // Sync ao abrir (preferNetwork) — fixture responde na hora.
    await tester.pumpAndSettle();

    container.read(counterCartProvider.notifier).clear();
    expect(find.byType(PriceCheckPage), findsOneWidget);
    expect(find.byType(PdvFilledField), findsOneWidget);
    expect(find.text('Atualizando preços…'), findsNothing);

    final InputDecoration decoration = tester
        .widgetList<TextField>(find.byType(TextField))
        .map((TextField f) => f.decoration!)
        .firstWhere((InputDecoration d) => d.filled == true);
    expect(decoration.fillColor, PdvColors.inputFill);

    await tester.enterText(find.byType(TextField), '7894900011517');
    await tester.tap(find.text('Consultar'));
    await tester.pumpAndSettle();

    expect(find.textContaining('Coca'), findsOneWidget);
    expect(container.read(counterCartProvider), isEmpty);

    await tester.enterText(find.byType(TextField), '000');
    await tester.tap(find.text('Consultar'));
    await tester.pumpAndSettle();

    expect(find.text('Código não encontrado'), findsOneWidget);
    expect(container.read(counterCartProvider), isEmpty);
  });

  testWidgets('ao abrir consulta, força refresh do catálogo', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(1200, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    final _CountingCatalogSource source = _CountingCatalogSource();
    final ProviderContainer container = ProviderContainer(
      overrides: <Override>[
        showCustomTitleBarProvider.overrideWithValue(false),
        catalogSourceProvider.overrideWithValue(source),
        catalogProvider.overrideWith(CatalogController.new),
      ],
    );
    addTearDown(container.dispose);
    await container.read(catalogProvider.notifier).hydrate();
    final int loadsAfterHydrate = source.loadCalls;

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(home: PriceCheckPage()),
      ),
    );
    await tester.pumpAndSettle();

    expect(source.loadCalls, greaterThan(loadsAfterHydrate));
    expect(find.text('Atualizando preços…'), findsNothing);
  });
}

class _CountingCatalogSource implements CatalogSource {
  int loadCalls = 0;

  @override
  Future<CatalogSnapshot> load() async {
    loadCalls++;
    return _snap;
  }

  static final CatalogSnapshot _snap = CatalogSnapshot(
    categories: const <CounterCategory>[
      CounterCategory(id: 'bebidas', label: 'Bebidas'),
    ],
    products: const <CounterProduct>[
      CounterProduct(
        id: 'coca',
        name: 'Coca-Cola',
        priceCents: 650,
        categoryId: 'bebidas',
        barcodes: <String>['7894900011517'],
      ),
    ],
    addons: const <CatalogAddon>[],
    syncedAt: DateTime.parse('2026-08-13T12:00:00.000Z'),
  );
}
