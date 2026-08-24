import 'package:citybox_pdv/features/catalog/domain/catalog_snapshot.dart';
import 'package:citybox_pdv/features/catalog/domain/catalog_source.dart';
import 'package:citybox_pdv/features/counter/data/counter_catalog.dart';

/// Fonte de catálogo só para testes — espelha a fixture histórica do Balcão.
class FixtureCatalogSource implements CatalogSource {
  const FixtureCatalogSource();

  @override
  Future<CatalogSnapshot> load() async => CatalogSnapshot(
    categories: counterCategories,
    products: counterProducts,
    addons: catalogAddons,
    syncedAt: DateTime.now(),
  );
}
