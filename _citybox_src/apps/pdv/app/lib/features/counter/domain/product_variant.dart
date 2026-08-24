/// SKU / variação de um produto (tamanho, cor, etc.).
class ProductVariant {
  const ProductVariant({
    required this.id,
    required this.productId,
    required this.attributes,
    required this.priceCents,
    this.barcode,
    this.available = true,
  });

  final String id;
  final String productId;

  /// Ex.: `size` → `M`, `color` → `Azul`.
  final Map<String, String> attributes;
  final int priceCents;
  final String? barcode;
  final bool available;

  String get label {
    if (attributes.isEmpty) {
      return id;
    }
    return attributes.values.join(' / ');
  }

  Map<String, Object?> toJson() => <String, Object?>{
    'id': id,
    'productId': productId,
    'attributes': attributes,
    'priceCents': priceCents,
    'barcode': barcode,
    'available': available,
  };

  static ProductVariant fromJson(Map<String, dynamic> json) {
    final Map<String, dynamic> rawAttrs = Map<String, dynamic>.from(
      (json['attributes'] as Map?) ?? const <String, dynamic>{},
    );
    return ProductVariant(
      id: json['id']! as String,
      productId: json['productId']! as String,
      attributes: rawAttrs.map(
        (String k, dynamic v) => MapEntry<String, String>(k, v as String),
      ),
      priceCents: json['priceCents']! as int,
      barcode: json['barcode'] as String?,
      available: (json['available'] as bool?) ?? true,
    );
  }
}
