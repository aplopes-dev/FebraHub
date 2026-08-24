import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/counter/domain/product_variant.dart';

void main() {
  test('label junta atributos e marca unavailable', () {
    const ProductVariant ok = ProductVariant(
      id: 'sku_m',
      productId: 'shirt',
      attributes: <String, String>{'size': 'M', 'color': 'Azul'},
      priceCents: 7990,
    );
    expect(ok.label, 'M / Azul');
    expect(ok.available, isTrue);

    const ProductVariant blocked = ProductVariant(
      id: 'sku_x',
      productId: 'shirt',
      attributes: <String, String>{'size': 'M', 'color': 'Preta'},
      priceCents: 8490,
      available: false,
    );
    expect(blocked.available, isFalse);
  });

  test('seleção só permite variantes available', () {
    final List<ProductVariant> variants = <ProductVariant>[
      const ProductVariant(
        id: 'a',
        productId: 'p',
        attributes: <String, String>{'size': 'M'},
        priceCents: 100,
      ),
      const ProductVariant(
        id: 'b',
        productId: 'p',
        attributes: <String, String>{'size': 'G'},
        priceCents: 100,
        available: false,
      ),
    ];
    final List<ProductVariant> selectable =
        variants.where((ProductVariant v) => v.available).toList();
    expect(selectable, hasLength(1));
    expect(selectable.single.id, 'a');
  });
}
