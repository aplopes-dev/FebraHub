import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';

const CounterProduct _cola = CounterProduct(
  id: 'cola',
  name: 'Cola',
  priceCents: 1000,
  categoryId: 'bebidas',
);

void main() {
  test('subtotal e total sem desconto', () {
    const CounterCartLine line = CounterCartLine(product: _cola, quantity: 3);
    expect(line.subtotalCents, 3000);
    expect(line.totalCents, 3000);
  });

  test('desconto percentual em centavos', () {
    const CounterCartLine line = CounterCartLine(
      product: _cola,
      quantity: 2,
      discountPercent: 10,
    );
    expect(line.subtotalCents, 2000);
    expect(line.discountAmountCents, 200);
    expect(line.totalCents, 1800);
  });
}
