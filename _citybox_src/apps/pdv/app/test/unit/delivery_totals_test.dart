import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/delivery/domain/delivery_order.dart';

void main() {
  const CounterProduct burger = CounterProduct(
    id: 'p1',
    name: 'Burger',
    priceCents: 2500,
    categoryId: 'cat',
  );

  test('soma itens e taxa', () {
    final ({int goodsTotalCents, int totalCents}) totals =
        deliveryTotalsFromLines(const <CounterCartLine>[
          CounterCartLine(product: burger, quantity: 2),
        ], 500);
    expect(totals.goodsTotalCents, 5000);
    expect(totals.totalCents, 5500);
  });

  test('pickup com taxa 0', () {
    final ({int goodsTotalCents, int totalCents}) totals =
        deliveryTotalsFromLines(const <CounterCartLine>[
          CounterCartLine(product: burger, quantity: 1),
        ], 0);
    expect(totals.goodsTotalCents, 2500);
    expect(totals.totalCents, 2500);
  });

  test('pedido sem linhas só tem a taxa', () {
    final ({int goodsTotalCents, int totalCents}) totals =
        deliveryTotalsFromLines(const <CounterCartLine>[], 800);
    expect(totals.goodsTotalCents, 0);
    expect(totals.totalCents, 800);
  });
}
