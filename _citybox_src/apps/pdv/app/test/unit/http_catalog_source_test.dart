import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/catalog/data/http_catalog_source.dart';
import 'package:citybox_pdv/features/catalog/data/pos_catalog_api.dart';
import 'package:citybox_pdv/features/catalog/data/shared_preferences_catalog_cache.dart';
import 'package:citybox_pdv/features/catalog/domain/catalog_snapshot.dart';
import 'package:citybox_pdv/features/counter/domain/counter_category.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/domain/product_variant.dart';

class FakePosCatalogApi implements PosCatalogApi {
  FakePosCatalogApi({CatalogSnapshot? snapshot})
    : snapshot = snapshot ?? CatalogSnapshot.empty();

  CatalogSnapshot snapshot;
  PdvApiException? failure;
  int calls = 0;

  @override
  Future<CatalogSnapshot> current() async {
    calls++;
    final PdvApiException? forced = failure;
    if (forced != null) throw forced;
    return snapshot;
  }
}

const PdvApiException offline = PdvApiException(
  'Sem conexão com o servidor da loja.',
  isOffline: true,
);

CatalogSnapshot sampleSnapshot() {
  return CatalogSnapshot(
    categories: const <CounterCategory>[
      CounterCategory(id: 'cat-1', label: 'Bebidas'),
    ],
    products: const <CounterProduct>[
      CounterProduct(
        id: 'prod-1',
        name: 'Água',
        priceCents: 250,
        categoryId: 'cat-1',
        barcodes: <String>['789'],
        soldByWeight: false,
      ),
      CounterProduct(
        id: 'prod-kg',
        name: 'Banana',
        priceCents: 800,
        categoryId: 'cat-1',
        soldByWeight: true,
        pricePerKgCents: 800,
      ),
    ],
    addons: const <CatalogAddon>[
      CatalogAddon(id: 'add-1', name: 'Gelo', unitPriceCents: 50),
    ],
    syncedAt: DateTime.parse('2026-08-10T12:00:00.000Z'),
  );
}

void main() {
  group('CatalogSnapshot.fromJson', () {
    test('mapeia soldByWeight, addons e variants', () {
      final CatalogSnapshot snapshot = CatalogSnapshot.fromJson(
        <String, dynamic>{
          'categories': <Map<String, Object?>>[
            <String, Object?>{'id': 'c1', 'name': 'Pizzas'},
          ],
          'addons': <Map<String, Object?>>[
            <String, Object?>{
              'id': 'a1',
              'name': 'Borda',
              'unitPriceCents': 500,
            },
          ],
          'products': <Map<String, Object?>>[
            <String, Object?>{
              'id': 'p1',
              'name': 'Pizza',
              'categoryId': 'c1',
              'sku': 'PZ-01',
              'priceCents': 4500,
              'barcodes': <String>['111'],
              'allowsAddons': true,
              'allowsKitchenNote': true,
              'allowsHalf': false,
              'soldByWeight': false,
              'pricePerKgCents': null,
              'addonIds': <String>['a1'],
              'variants': <Map<String, Object?>>[
                <String, Object?>{
                  'id': 'p1:opt',
                  'productId': 'p1',
                  'attributes': <String, String>{'Tamanho': 'G'},
                  'priceCents': 5000,
                  'barcode': '222',
                  'available': true,
                },
              ],
            },
          ],
          'syncedAt': '2026-08-10T15:00:00.000Z',
        },
      );

      expect(snapshot.categories.single.label, 'Pizzas');
      expect(snapshot.addons.single.unitPriceCents, 500);
      final CounterProduct product = snapshot.products.single;
      expect(product.allowsAddons, isTrue);
      expect(product.allowsHalf, isFalse);
      expect(product.variants, hasLength(1));
      expect(product.variants.single.label, 'G');
      expect(product.variants.single, isA<ProductVariant>());
    });
  });

  group('HttpCatalogSource', () {
    late SharedPreferencesCatalogCache cache;

    Future<void> setUpCache() async {
      SharedPreferences.setMockInitialValues(<String, Object>{});
      cache = SharedPreferencesCatalogCache(
        await SharedPreferences.getInstance(),
      );
    }

    HttpCatalogSource build(FakePosCatalogApi api, {bool paired = true}) {
      return HttpCatalogSource(
        api: api,
        cache: cache,
        isPaired: () => paired,
      );
    }

    setUp(setUpCache);

    test('API ok grava cache', () async {
      final FakePosCatalogApi api = FakePosCatalogApi(
        snapshot: sampleSnapshot(),
      );

      final CatalogSnapshot loaded = await build(api).load();

      expect(loaded.products, hasLength(2));
      expect(await cache.read(), isNotNull);
      expect((await cache.read())!.products.first.name, 'Água');
    });

    test('falha usa cache', () async {
      final FakePosCatalogApi api = FakePosCatalogApi(
        snapshot: sampleSnapshot(),
      );
      await build(api).load();

      api.failure = offline;
      final CatalogSnapshot loaded = await build(api).load();

      expect(loaded.products.first.id, 'prod-1');
    });

    test('sem cache = vazio (não fixture)', () async {
      final FakePosCatalogApi api = FakePosCatalogApi()..failure = offline;

      final CatalogSnapshot loaded = await build(api).load();

      expect(loaded.isEmpty, isTrue);
      expect(loaded.products, isEmpty);
    });

    test('não pareado não chama API', () async {
      final FakePosCatalogApi api = FakePosCatalogApi(
        snapshot: sampleSnapshot(),
      );

      await build(api, paired: false).load();

      expect(api.calls, 0);
    });

    test('loadFresh grava cache e propaga falha', () async {
      final FakePosCatalogApi api = FakePosCatalogApi(
        snapshot: sampleSnapshot(),
      );

      final CatalogSnapshot fresh = await build(api).loadFresh();
      expect(fresh.products.first.name, 'Água');
      expect(await cache.read(), isNotNull);

      api.failure = offline;
      await expectLater(build(api).loadFresh(), throwsA(isA<PdvApiException>()));
    });
  });
}
