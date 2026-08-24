import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/counter/domain/barcode_resolve.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/domain/product_variant.dart';

void main() {
  final List<CounterProduct> products = <CounterProduct>[
    const CounterProduct(
      id: 'p1',
      name: 'Coca',
      priceCents: 450,
      categoryId: 'varejo',
      barcodes: <String>['7894900011517'],
    ),
    CounterProduct(
      id: 'shirt',
      name: 'Camisa',
      priceCents: 7990,
      categoryId: 'varejo',
      barcodes: <String>['7891000100101'],
      variants: <ProductVariant>[
        const ProductVariant(
          id: 'sku_m',
          productId: 'shirt',
          attributes: <String, String>{'size': 'M'},
          priceCents: 7990,
          barcode: '7891000100102',
        ),
      ],
    ),
  ];

  test('normalize trim', () {
    expect(normalizeBarcode('  123  '), '123');
  });

  test('resolve product barcode', () {
    final BarcodeHit? hit = resolveBarcode('7894900011517', products);
    expect(hit, isNotNull);
    expect(hit!.product.id, 'p1');
    expect(hit.variant, isNull);
  });

  test('resolve variant barcode', () {
    final BarcodeHit? hit = resolveBarcode('7891000100102', products);
    expect(hit?.variant?.id, 'sku_m');
  });

  test('miss returns null', () {
    expect(resolveBarcode('000', products), isNull);
  });
}
