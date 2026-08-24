import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/catalog/application/catalog_controller.dart';
import 'package:citybox_pdv/features/catalog/domain/catalog_snapshot.dart';
import 'package:citybox_pdv/features/catalog/domain/catalog_source.dart';
import 'package:citybox_pdv/features/counter/domain/counter_category.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_product_grid.dart';
import 'package:citybox_pdv/features/price_check/presentation/price_check_page.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';

class _ApiCatalogSource implements CatalogSource {
  @override
  Future<CatalogSnapshot> load() async => CatalogSnapshot(
    categories: const <CounterCategory>[
      CounterCategory(id: 'bebidas', label: 'Bebidas'),
    ],
    products: const <CounterProduct>[
      CounterProduct(
        id: 'agua',
        name: 'Água Mineral API',
        priceCents: 300,
        categoryId: 'bebidas',
        barcodes: <String>['7891000100103'],
      ),
    ],
    addons: const <CatalogAddon>[],
    syncedAt: DateTime.parse('2026-08-10T12:00:00.000Z'),
  );
}

class _ApiCatalogController extends CatalogController {
  @override
  CatalogState build() {
    // Hidrata síncrono via estado inicial; o teste chama hydrate se precisar.
    return CatalogState.initial();
  }
}

void main() {
  testWidgets('Balcão mostra produtos da fonte injetada (API fake)', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(1600, 1000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    final ProviderContainer container = ProviderContainer(
      overrides: <Override>[
        showCustomTitleBarProvider.overrideWithValue(false),
        catalogSourceProvider.overrideWithValue(_ApiCatalogSource()),
        catalogProvider.overrideWith(_ApiCatalogController.new),
      ],
    );
    addTearDown(container.dispose);

    await container.read(catalogProvider.notifier).hydrate();

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(
          home: Scaffold(body: CounterProductGrid()),
        ),
      ),
    );
    await tester.pump();

    expect(find.text('Água Mineral API'), findsOneWidget);
    expect(find.text('Água Mineral c/ Gás'), findsNothing);
  });

  testWidgets('consulta de preço resolve barcode do snapshot', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(1200, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    final ProviderContainer container = ProviderContainer(
      overrides: <Override>[
        showCustomTitleBarProvider.overrideWithValue(false),
        catalogSourceProvider.overrideWithValue(_ApiCatalogSource()),
        catalogProvider.overrideWith(_ApiCatalogController.new),
      ],
    );
    addTearDown(container.dispose);
    await container.read(catalogProvider.notifier).hydrate();

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(home: PriceCheckPage()),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), '7891000100103');
    await tester.tap(find.text('Consultar'));
    await tester.pumpAndSettle();

    expect(find.textContaining('Água Mineral API'), findsOneWidget);
    expect(find.byType(PdvFilledField), findsOneWidget);
  });
}
