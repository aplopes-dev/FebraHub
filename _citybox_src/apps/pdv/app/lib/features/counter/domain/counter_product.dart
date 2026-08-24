import 'package:citybox_pdv/features/counter/domain/product_variant.dart';

/// Um produto do catálogo do Balcão.
class CounterProduct {
  const CounterProduct({
    required this.id,
    required this.name,
    required this.priceCents,
    required this.categoryId,
    this.allowsAddons = false,
    this.allowsHalf = false,
    this.allowsKitchenNote = true,
    this.addonIds = const <String>[],
    this.barcodes = const <String>[],
    this.variants = const <ProductVariant>[],
    this.soldByWeight = false,
    this.pricePerKgCents,
    this.trackStock = false,
    this.stockQty,
  });

  final String id;
  final String name;

  /// Preço unitário em centavos (não pesável).
  final int priceCents;

  /// `id` da [CounterCategory] a que este produto pertence.
  final String categoryId;

  final bool allowsAddons;
  final bool allowsHalf;
  final bool allowsKitchenNote;
  final List<String> addonIds;

  final List<String> barcodes;
  final List<ProductVariant> variants;
  final bool soldByWeight;

  /// Preço por kg em centavos — obrigatório se [soldByWeight].
  final int? pricePerKgCents;

  /// Espelha `Product.trackStock` do ERP.
  final bool trackStock;

  /// Saldo no depósito default da unidade; `null` se sem controle ou sem depósito.
  final double? stockQty;

  bool get hasVariants => variants.isNotEmpty;

  /// Sem estoque local conhecido (controla e saldo ≤ 0).
  bool get isOutOfStock => trackStock && (stockQty ?? 0) <= 0;

  CounterProduct copyWith({
    int? priceCents,
    bool? trackStock,
    double? stockQty,
    bool clearStockQty = false,
    List<ProductVariant>? variants,
  }) {
    return CounterProduct(
      id: id,
      name: name,
      priceCents: priceCents ?? this.priceCents,
      categoryId: categoryId,
      allowsAddons: allowsAddons,
      allowsHalf: allowsHalf,
      allowsKitchenNote: allowsKitchenNote,
      addonIds: addonIds,
      barcodes: barcodes,
      variants: variants ?? this.variants,
      soldByWeight: soldByWeight,
      pricePerKgCents: pricePerKgCents,
      trackStock: trackStock ?? this.trackStock,
      stockQty: clearStockQty ? null : (stockQty ?? this.stockQty),
    );
  }

  Map<String, Object?> toJson() => <String, Object?>{
    'id': id,
    'name': name,
    'priceCents': priceCents,
    'categoryId': categoryId,
    'allowsAddons': allowsAddons,
    'allowsHalf': allowsHalf,
    'allowsKitchenNote': allowsKitchenNote,
    'addonIds': addonIds,
    'barcodes': barcodes,
    'variants': variants.map((ProductVariant v) => v.toJson()).toList(),
    'soldByWeight': soldByWeight,
    'pricePerKgCents': pricePerKgCents,
    'trackStock': trackStock,
    'stockQty': stockQty,
  };

  static CounterProduct fromJson(Map<String, dynamic> json) {
    final List<dynamic> rawAddons =
        (json['addonIds'] as List<dynamic>?) ?? const <dynamic>[];
    final List<dynamic> rawBarcodes =
        (json['barcodes'] as List<dynamic>?) ?? const <dynamic>[];
    final List<dynamic> rawVariants =
        (json['variants'] as List<dynamic>?) ?? const <dynamic>[];
    return CounterProduct(
      id: json['id']! as String,
      name: json['name']! as String,
      priceCents: json['priceCents']! as int,
      categoryId: json['categoryId']! as String,
      allowsAddons: (json['allowsAddons'] as bool?) ?? false,
      allowsHalf: (json['allowsHalf'] as bool?) ?? false,
      allowsKitchenNote: (json['allowsKitchenNote'] as bool?) ?? true,
      addonIds: rawAddons.map((dynamic e) => e as String).toList(),
      barcodes: rawBarcodes.map((dynamic e) => e as String).toList(),
      variants:
          rawVariants
              .map(
                (dynamic e) => ProductVariant.fromJson(
                  Map<String, dynamic>.from(e as Map),
                ),
              )
              .toList(),
      soldByWeight: (json['soldByWeight'] as bool?) ?? false,
      pricePerKgCents: json['pricePerKgCents'] as int?,
      trackStock: (json['trackStock'] as bool?) ?? false,
      stockQty: _parseStockQty(json['stockQty']),
    );
  }

  static double? _parseStockQty(Object? raw) {
    if (raw == null) {
      return null;
    }
    if (raw is num) {
      return raw.toDouble();
    }
    if (raw is String) {
      return double.tryParse(raw);
    }
    return null;
  }
}

/// Adicional disponível no catálogo (fixture).
class CatalogAddon {
  const CatalogAddon({
    required this.id,
    required this.name,
    required this.unitPriceCents,
  });

  final String id;
  final String name;
  final int unitPriceCents;
}
