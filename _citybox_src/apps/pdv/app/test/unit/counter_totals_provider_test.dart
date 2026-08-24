import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_totals_provider.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/domain/counter_totals.dart';

const CounterProduct _cola = CounterProduct(
  id: 'coca_1l',
  name: 'Coca Cola 1 Litro',
  priceCents: 1000,
  categoryId: 'bebidas',
);

void main() {
  test('carrinho vazio dá totais zerados', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    final CounterTotals totals = container.read(counterTotalsProvider);

    expect(totals.subtotalCents, 0);
    expect(totals.discountCents, 0);
    expect(totals.totalCents, 0);
    expect(totals.discountPercentage, 0);
    expect(totals.itemCount, 0);
  });

  test('soma preços em centavos', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    container.read(counterCartProvider.notifier).addProduct(_cola);
    container.read(counterCartProvider.notifier).addProduct(_cola);

    final CounterTotals totals = container.read(counterTotalsProvider);
    expect(totals.subtotalCents, 2000);
    expect(totals.totalCents, 2000);
  });

  test('limpar zera totais', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    container.read(counterCartProvider.notifier).addProduct(_cola);
    expect(container.read(counterTotalsProvider).subtotalCents, 1000);

    container.read(counterCartProvider.notifier).clear();
    expect(container.read(counterTotalsProvider).subtotalCents, 0);
  });
}
