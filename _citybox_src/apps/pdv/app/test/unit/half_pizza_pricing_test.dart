import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/domain/half_pizza_pricing.dart';

void main() {
  test('preço meia-a-meia usa o maior das metades', () {
    const CounterProduct cheaper = CounterProduct(
      id: 'a',
      name: 'A',
      priceCents: 4000,
      categoryId: 'pizzas',
    );
    const CounterProduct pricier = CounterProduct(
      id: 'b',
      name: 'B',
      priceCents: 5000,
      categoryId: 'pizzas',
    );
    expect(halfPizzaPriceCents(left: cheaper, right: pricier), 5000);
    expect(halfPizzaPriceCents(left: pricier, right: cheaper), 5000);
  });
}
