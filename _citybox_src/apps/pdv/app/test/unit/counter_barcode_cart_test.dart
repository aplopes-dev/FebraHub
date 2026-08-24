import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/domain/product_variant.dart';

void main() {
  test('submitBarcode merge and pendingQty', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    const CounterProduct product = CounterProduct(
      id: 'p1',
      name: 'Coca',
      priceCents: 450,
      categoryId: 'varejo',
      barcodes: <String>['789'],
    );

    String? error;
    int? pending = 3;
    final BarcodeSubmitResult r1 = container
        .read(counterCartProvider.notifier)
        .submitBarcode(
          '789',
          products: <CounterProduct>[product],
          pendingQty: pending,
          clearPendingQty: () => pending = null,
          setError: (String? m) => error = m,
        );
    expect(r1, BarcodeSubmitResult.added);
    expect(container.read(counterCartProvider).single.quantity, 3);
    expect(pending, isNull);

    container
        .read(counterCartProvider.notifier)
        .submitBarcode(
          '789',
          products: <CounterProduct>[product],
          pendingQty: null,
          clearPendingQty: () {},
          setError: (String? m) => error = m,
        );
    expect(container.read(counterCartProvider).single.quantity, 4);

    final BarcodeSubmitResult miss = container
        .read(counterCartProvider.notifier)
        .submitBarcode(
          '000',
          products: <CounterProduct>[product],
          pendingQty: null,
          clearPendingQty: () {},
          setError: (String? m) => error = m,
        );
    expect(miss, BarcodeSubmitResult.notFound);
    expect(error, isNotNull);
  });

  test('weighted lines do not merge', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);
    const CounterProduct product = CounterProduct(
      id: 'banana',
      name: 'Banana',
      priceCents: 0,
      categoryId: 'hortifruti',
      soldByWeight: true,
      pricePerKgCents: 699,
    );
    container
        .read(counterCartProvider.notifier)
        .addLine(
          const CounterCartLine(
            product: product,
            quantity: 1,
            weightKg: 0.5,
            lineCents: 350,
          ),
        );
    container
        .read(counterCartProvider.notifier)
        .addLine(
          const CounterCartLine(
            product: product,
            quantity: 1,
            weightKg: 0.3,
            lineCents: 210,
          ),
        );
    expect(container.read(counterCartProvider), hasLength(2));
  });

  test('parent barcode of a product with variants returns needsVariant', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    const CounterProduct product = CounterProduct(
      id: 'cam-grd',
      name: 'Camiseta Grade PDV',
      priceCents: 4990,
      categoryId: 'vestuario',
      barcodes: <String>['7891000000103'],
      variants: <ProductVariant>[
        ProductVariant(
          id: 'cam-grd:p',
          productId: 'cam-grd',
          attributes: <String, String>{'Tamanho': 'P'},
          priceCents: 4990,
        ),
      ],
    );

    final BarcodeSubmitResult result = container
        .read(counterCartProvider.notifier)
        .submitBarcode(
          '7891000000103',
          products: <CounterProduct>[product],
          pendingQty: null,
          clearPendingQty: () {},
          setError: (_) {},
        );
    expect(result, BarcodeSubmitResult.needsVariant);
    expect(container.read(counterCartProvider), isEmpty);
  });
}
