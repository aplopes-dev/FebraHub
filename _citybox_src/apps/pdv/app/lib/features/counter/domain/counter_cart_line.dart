import 'package:citybox_pdv/features/counter/domain/counter_product.dart';

class CartAddon {
  const CartAddon({
    required this.id,
    required this.name,
    required this.unitPriceCents,
  });

  final String id;
  final String name;
  final int unitPriceCents;

  Map<String, Object?> toJson() => <String, Object?>{
    'id': id,
    'name': name,
    'unitPriceCents': unitPriceCents,
  };

  static CartAddon fromJson(Map<String, dynamic> json) {
    return CartAddon(
      id: json['id']! as String,
      name: json['name']! as String,
      unitPriceCents: json['unitPriceCents']! as int,
    );
  }
}

class HalfPizzaSelection {
  const HalfPizzaSelection({
    required this.leftProductId,
    required this.rightProductId,
    required this.leftName,
    required this.rightName,
    required this.priceCents,
  });

  final String leftProductId;
  final String rightProductId;
  final String leftName;
  final String rightName;
  final int priceCents;

  Map<String, Object?> toJson() => <String, Object?>{
    'leftProductId': leftProductId,
    'rightProductId': rightProductId,
    'leftName': leftName,
    'rightName': rightName,
    'priceCents': priceCents,
  };

  static HalfPizzaSelection fromJson(Map<String, dynamic> json) {
    return HalfPizzaSelection(
      leftProductId: json['leftProductId']! as String,
      rightProductId: json['rightProductId']! as String,
      leftName: json['leftName']! as String,
      rightName: json['rightName']! as String,
      priceCents: json['priceCents']! as int,
    );
  }
}

/// Uma linha lançada na venda em curso: um produto e a quantidade dele.
class CounterCartLine {
  const CounterCartLine({
    required this.product,
    required this.quantity,
    this.discountPercent = 0,
    this.addons = const <CartAddon>[],
    this.kitchenNote,
    this.half,
    this.skuId,
    this.variantLabel,
    this.weightKg,
    this.lineCents,
  });

  final CounterProduct product;
  final int quantity;

  /// Desconto da linha, em **percentual** (0–100) sobre o subtotal dela.
  final double discountPercent;

  final List<CartAddon> addons;
  final String? kitchenNote;
  final HalfPizzaSelection? half;

  final String? skuId;
  final String? variantLabel;
  final double? weightKg;

  /// Valor fechado pós-peso (centavos). Se setado, prevalece sobre unit×qty.
  final int? lineCents;

  bool get isWeighted => weightKg != null && lineCents != null;

  bool get canMergeByScan => !isWeighted && addons.isEmpty && half == null;

  int get unitPriceCents {
    if (lineCents != null) {
      return lineCents!;
    }
    return half?.priceCents ?? product.priceCents;
  }

  int get addonsCents =>
      addons.fold(0, (int sum, CartAddon a) => sum + a.unitPriceCents);

  int get goodsUnitCents =>
      lineCents != null
          ? lineCents!
          : (half?.priceCents ?? product.priceCents) + addonsCents;

  int get subtotalCents =>
      lineCents != null ? lineCents! : goodsUnitCents * quantity;

  int get discountAmountCents =>
      (subtotalCents * discountPercent / 100).round();

  int get totalCents => subtotalCents - discountAmountCents;

  bool sameMergeKey(CounterCartLine other) {
    return product.id == other.product.id &&
        skuId == other.skuId &&
        canMergeByScan &&
        other.canMergeByScan;
  }

  CounterCartLine copyWith({
    int? quantity,
    double? discountPercent,
    List<CartAddon>? addons,
    String? kitchenNote,
    bool clearKitchenNote = false,
    HalfPizzaSelection? half,
    bool clearHalf = false,
    String? skuId,
    String? variantLabel,
    double? weightKg,
    int? lineCents,
  }) {
    return CounterCartLine(
      product: product,
      quantity: quantity ?? this.quantity,
      discountPercent: discountPercent ?? this.discountPercent,
      addons: addons ?? this.addons,
      kitchenNote: clearKitchenNote ? null : (kitchenNote ?? this.kitchenNote),
      half: clearHalf ? null : (half ?? this.half),
      skuId: skuId ?? this.skuId,
      variantLabel: variantLabel ?? this.variantLabel,
      weightKg: weightKg ?? this.weightKg,
      lineCents: lineCents ?? this.lineCents,
    );
  }

  Map<String, Object?> toJson() => <String, Object?>{
    'product': product.toJson(),
    'quantity': quantity,
    'discountPercent': discountPercent,
    'addons': addons.map((CartAddon e) => e.toJson()).toList(),
    'kitchenNote': kitchenNote,
    'half': half?.toJson(),
    'skuId': skuId,
    'variantLabel': variantLabel,
    'weightKg': weightKg,
    'lineCents': lineCents,
  };

  static CounterCartLine fromJson(Map<String, dynamic> json) {
    final List<dynamic> rawAddons =
        (json['addons'] as List<dynamic>?) ?? const <dynamic>[];
    return CounterCartLine(
      product: CounterProduct.fromJson(
        Map<String, dynamic>.from(json['product']! as Map),
      ),
      quantity: json['quantity']! as int,
      discountPercent: (json['discountPercent'] as num?)?.toDouble() ?? 0,
      addons:
          rawAddons
              .map(
                (dynamic e) =>
                    CartAddon.fromJson(Map<String, dynamic>.from(e as Map)),
              )
              .toList(),
      kitchenNote: json['kitchenNote'] as String?,
      half:
          json['half'] == null
              ? null
              : HalfPizzaSelection.fromJson(
                Map<String, dynamic>.from(json['half']! as Map),
              ),
      skuId: json['skuId'] as String?,
      variantLabel: json['variantLabel'] as String?,
      weightKg: (json['weightKg'] as num?)?.toDouble(),
      lineCents: json['lineCents'] as int?,
    );
  }
}
