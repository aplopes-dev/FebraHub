import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/catalog/data/http_catalog_source.dart';
import 'package:citybox_pdv/features/catalog/data/pos_catalog_api.dart';
import 'package:citybox_pdv/features/catalog/data/shared_preferences_catalog_cache.dart';
import 'package:citybox_pdv/features/catalog/domain/catalog_snapshot.dart';
import 'package:citybox_pdv/features/catalog/domain/catalog_source.dart';
import 'package:citybox_pdv/features/counter/domain/counter_category.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/features/terminal/domain/device_credential.dart';

/// Estado do catálogo na UI (hidratação + snapshot).
class CatalogState {
  const CatalogState({required this.snapshot, required this.hydrated});

  final CatalogSnapshot snapshot;
  final bool hydrated;

  List<CounterCategory> get categories => snapshot.categories;
  List<CounterProduct> get products => snapshot.products;
  List<CatalogAddon> get addons => snapshot.addons;

  static CatalogState initial() =>
      CatalogState(snapshot: CatalogSnapshot.empty(), hydrated: false);
}

final Provider<PosCatalogApi> posCatalogApiProvider = Provider<PosCatalogApi>(
  (Ref ref) => PosCatalogApi(ref.watch(pdvApiClientProvider)),
);

/// Fonte injetável; override em testes. `null` → HTTP real no [hydrate].
final Provider<CatalogSource?> catalogSourceProvider = Provider<CatalogSource?>(
  (Ref ref) => null,
);

final NotifierProvider<CatalogController, CatalogState> catalogProvider =
    NotifierProvider<CatalogController, CatalogState>(CatalogController.new);

class CatalogController extends Notifier<CatalogState> {
  CatalogSource? _source;
  SharedPreferencesCatalogCache? _cache;

  @override
  CatalogState build() {
    // Repareamento pode ser noutra unidade — o catálogo muda junto.
    ref.listen<DeviceCredential?>(deviceCredentialProvider, (
      DeviceCredential? previous,
      DeviceCredential? next,
    ) {
      if (next != null) unawaited(refresh());
    });

    return CatalogState.initial();
  }

  /// Carrega o catálogo uma vez no start do app.
  Future<void> hydrate() async {
    final CatalogSource source = await _resolveSource();
    state = CatalogState(snapshot: await source.load(), hydrated: true);
  }

  /// Rebusca no servidor — pareamento / rede de volta.
  ///
  /// Com [preferNetwork], exige resposta do ERP ([HttpCatalogSource.loadFresh]).
  /// Fontes de teste usam [CatalogSource.load]. Retorna `false` se a rede
  /// falhou — o snapshot em memória permanece.
  Future<bool> refresh({bool preferNetwork = false}) async {
    final CatalogSource source = await _resolveSource();
    if (preferNetwork) {
      try {
        final CatalogSnapshot snapshot =
            source is HttpCatalogSource
                ? await source.loadFresh()
                : await source.load();
        state = CatalogState(snapshot: snapshot, hydrated: true);
        return true;
      } on Object {
        return false;
      }
    }
    state = CatalogState(snapshot: await source.load(), hydrated: true);
    return true;
  }

  Future<CatalogSource> _resolveSource() async {
    final CatalogSource? override = ref.read(catalogSourceProvider);
    if (override != null) {
      _source = override;
      return override;
    }
    if (_source != null) {
      return _source!;
    }
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    _cache = SharedPreferencesCatalogCache(prefs);
    final CatalogSource source = HttpCatalogSource(
      api: ref.read(posCatalogApiProvider),
      cache: _cache!,
      isPaired: () => ref.read(deviceCredentialProvider) != null,
    );
    _source = source;
    return source;
  }

  /// Decrementa `stockQty` local após venda bem-sucedida (pode ficar negativo).
  ///
  /// [soldByProductId] = soma de qty/peso vendidos por `product.id`.
  void applySoldQuantities(Map<String, double> soldByProductId) {
    if (soldByProductId.isEmpty || !state.hydrated) {
      return;
    }

    final List<CounterProduct> nextProducts =
        state.snapshot.products.map((CounterProduct product) {
          if (!product.trackStock || product.stockQty == null) {
            return product;
          }
          final double? sold = soldByProductId[product.id];
          if (sold == null || sold <= 0) {
            return product;
          }
          return product.copyWith(stockQty: product.stockQty! - sold);
        }).toList();

    final CatalogSnapshot next = CatalogSnapshot(
      categories: state.snapshot.categories,
      products: nextProducts,
      addons: state.snapshot.addons,
      syncedAt: state.snapshot.syncedAt,
    );
    state = CatalogState(snapshot: next, hydrated: true);
    final SharedPreferencesCatalogCache? cache = _cache;
    if (cache != null) {
      unawaited(cache.write(next));
    }
  }
}
