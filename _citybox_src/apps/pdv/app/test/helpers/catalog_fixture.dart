import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/catalog/application/catalog_controller.dart';
import 'package:citybox_pdv/features/catalog/data/fixture_catalog_source.dart';
import 'package:citybox_pdv/features/catalog/domain/catalog_snapshot.dart';
import 'package:citybox_pdv/features/counter/data/counter_catalog.dart';

/// Catálogo da fixture histórica — hidratado, para testes de UI do Balcão.
class FixtureCatalogController extends CatalogController {
  @override
  CatalogState build() {
    return CatalogState(
      snapshot: CatalogSnapshot(
        categories: counterCategories,
        products: counterProducts,
        addons: catalogAddons,
        syncedAt: DateTime.now(),
      ),
      hydrated: true,
    );
  }
}

/// Overrides padrão: fonte fixture + estado já hidratado.
List<Override> fixtureCatalogOverrides() => <Override>[
  catalogSourceProvider.overrideWithValue(const FixtureCatalogSource()),
  catalogProvider.overrideWith(FixtureCatalogController.new),
];
