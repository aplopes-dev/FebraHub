import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';

void main() {
  const CounterProduct pizza = CounterProduct(
    id: 'p1',
    name: 'Pizza',
    priceCents: 4000,
    categoryId: 'pizzas',
  );

  test('addons e kitchenNote entram no lineNet em centavos', () {
    const CounterCartLine line = CounterCartLine(
      product: pizza,
      quantity: 2,
      discountPercent: 10,
      addons: <CartAddon>[
        CartAddon(id: 'a1', name: 'Borda', unitPriceCents: 800),
      ],
      kitchenNote: 'Sem cebola',
    );

    // goods = 4000 + 800 = 4800; ×2 = 9600; 10% = 960; net = 8640
    expect(line.goodsUnitCents, 4800);
    expect(line.subtotalCents, 9600);
    expect(line.discountAmountCents, 960);
    expect(line.totalCents, 8640);
    expect(line.kitchenNote, 'Sem cebola');
  });

  test('half substitui preço do produto', () {
    const CounterCartLine line = CounterCartLine(
      product: pizza,
      quantity: 1,
      half: HalfPizzaSelection(
        leftProductId: 'p1',
        rightProductId: 'p2',
        leftName: 'Pizza',
        rightName: 'Calabresa',
        priceCents: 4500,
      ),
    );
    expect(line.unitPriceCents, 4500);
    expect(line.totalCents, 4500);
  });
}
