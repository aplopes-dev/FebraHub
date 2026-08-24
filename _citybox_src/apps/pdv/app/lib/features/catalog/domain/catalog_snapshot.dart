import 'package:citybox_pdv/features/counter/domain/counter_category.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';

/// Snapshot de catálogo da unidade do terminal (já com preço `pdv` resolvido).
class CatalogSnapshot {
  const CatalogSnapshot({
    required this.categories,
    required this.products,
    required this.addons,
    required this.syncedAt,
  });

  final List<CounterCategory> categories;
  final List<CounterProduct> products;
  final List<CatalogAddon> addons;
  final DateTime syncedAt;

  bool get isEmpty => products.isEmpty;

  static CatalogSnapshot empty({DateTime? syncedAt}) => CatalogSnapshot(
    categories: const <CounterCategory>[],
    products: const <CounterProduct>[],
    addons: const <CatalogAddon>[],
    syncedAt: syncedAt ?? DateTime.fromMillisecondsSinceEpoch(0),
  );

  Map<String, Object?> toJson() => <String, Object?>{
    'categories':
        categories
            .map(
              (CounterCategory c) => <String, Object?>{
                'id': c.id,
                'name': c.label,
              },
            )
            .toList(),
    'products': products.map((CounterProduct p) => p.toJson()).toList(),
    'addons':
        addons
            .map(
              (CatalogAddon a) => <String, Object?>{
                'id': a.id,
                'name': a.name,
                'unitPriceCents': a.unitPriceCents,
              },
            )
            .toList(),
    'syncedAt': syncedAt.toIso8601String(),
  };

  static CatalogSnapshot fromJson(Map<String, dynamic> json) {
    final List<dynamic> rawCategories =
        (json['categories'] as List<dynamic>?) ?? const <dynamic>[];
    final List<dynamic> rawProducts =
        (json['products'] as List<dynamic>?) ?? const <dynamic>[];
    final List<dynamic> rawAddons =
        (json['addons'] as List<dynamic>?) ?? const <dynamic>[];
    final String? syncedAtRaw = json['syncedAt'] as String?;

    return CatalogSnapshot(
      categories:
          rawCategories.map((dynamic e) {
            final Map<String, dynamic> map = Map<String, dynamic>.from(
              e as Map,
            );
            return CounterCategory(
              id: map['id']! as String,
              label: (map['name'] as String?) ?? (map['label'] as String?) ?? '',
            );
          }).toList(),
      products:
          rawProducts
              .map(
                (dynamic e) => CounterProduct.fromJson(
                  Map<String, dynamic>.from(e as Map),
                ),
              )
              .toList(),
      addons:
          rawAddons.map((dynamic e) {
            final Map<String, dynamic> map = Map<String, dynamic>.from(
              e as Map,
            );
            return CatalogAddon(
              id: map['id']! as String,
              name: map['name']! as String,
              unitPriceCents: map['unitPriceCents']! as int,
            );
          }).toList(),
      syncedAt:
          syncedAtRaw != null
              ? (DateTime.tryParse(syncedAtRaw) ??
                  DateTime.fromMillisecondsSinceEpoch(0))
              : DateTime.fromMillisecondsSinceEpoch(0),
    );
  }
}
