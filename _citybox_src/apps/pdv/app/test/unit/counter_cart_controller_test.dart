import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';

const CounterProduct _cola = CounterProduct(
  id: 'coca_1l',
  name: 'Coca Cola 1 Litro',
  priceCents: 1000,
  categoryId: 'bebidas',
);

const CounterProduct _agua = CounterProduct(
  id: 'agua_com_gas',
  name: 'Água Mineral c/ Gás',
  priceCents: 300,
  categoryId: 'bebidas',
);

void main() {
  test('começa sem nenhuma linha', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    expect(container.read(counterCartProvider), isEmpty);
  });

  test('lançar um produto novo cria uma linha com quantidade 1', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    container.read(counterCartProvider.notifier).addProduct(_cola);

    final List<CounterCartLine> cart = container.read(counterCartProvider);
    expect(cart, hasLength(1));
    expect(cart.single.product, _cola);
    expect(cart.single.quantity, 1);
  });

  test('lançar o mesmo produto de novo soma na linha existente', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    final CounterCartController controller = container.read(
      counterCartProvider.notifier,
    );
    controller.addProduct(_cola);
    controller.addProduct(_cola);
    controller.addProduct(_cola);

    final List<CounterCartLine> cart = container.read(counterCartProvider);
    expect(cart, hasLength(1));
    expect(cart.single.quantity, 3);
  });

  test('produtos diferentes viram linhas diferentes', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    final CounterCartController controller = container.read(
      counterCartProvider.notifier,
    );
    controller.addProduct(_cola);
    controller.addProduct(_agua);

    final List<CounterCartLine> cart = container.read(counterCartProvider);
    expect(cart, hasLength(2));
  });

  test('clear esvazia o carrinho', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    final CounterCartController controller = container.read(
      counterCartProvider.notifier,
    );
    controller.addProduct(_cola);
    controller.clear();

    expect(container.read(counterCartProvider), isEmpty);
  });

  test('removeLine tira só a linha do produto informado', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    final CounterCartController controller = container.read(
      counterCartProvider.notifier,
    );
    controller.addProduct(_cola);
    controller.addProduct(_agua);

    controller.removeLine(_cola.id);

    final List<CounterCartLine> cart = container.read(counterCartProvider);
    expect(cart, hasLength(1));
    expect(cart.single.product, _agua);
  });

  test('removeLine de um produto que não está no carrinho não muda nada', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    final CounterCartController controller = container.read(
      counterCartProvider.notifier,
    );
    controller.addProduct(_cola);

    controller.removeLine('produto_inexistente');

    expect(container.read(counterCartProvider), hasLength(1));
  });

  test('updateLine muda quantidade e desconto (percentual) da linha', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    final CounterCartController controller = container.read(
      counterCartProvider.notifier,
    );
    controller.addProduct(_cola);

    controller.updateLine(_cola.id, quantity: 5, discountPercent: 10);

    final CounterCartLine line = container.read(counterCartProvider).single;
    expect(line.quantity, 5);
    expect(line.discountPercent, 10);
    // Valor unitário não é parâmetro de updateLine — continua vindo do
    // catálogo.
    expect(line.unitPriceCents, _cola.priceCents);
  });

  test('updateLine sem um campo mantém o valor que a linha já tinha', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    final CounterCartController controller = container.read(
      counterCartProvider.notifier,
    );
    controller.addProduct(_cola);

    controller.updateLine(_cola.id, discountPercent: 15);

    final CounterCartLine line = container.read(counterCartProvider).single;
    expect(line.discountPercent, 15);
    // Quantidade não foi passada — continua a mesma de antes.
    expect(line.quantity, 1);
  });

  test('updateLine não afeta as outras linhas do carrinho', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    final CounterCartController controller = container.read(
      counterCartProvider.notifier,
    );
    controller.addProduct(_cola);
    controller.addProduct(_agua);

    controller.updateLine(_cola.id, quantity: 9);

    final CounterCartLine agua = container
        .read(counterCartProvider)
        .firstWhere((CounterCartLine line) => line.product.id == _agua.id);
    expect(agua.quantity, 1);
  });

  test('addProduct lança mesmo com trackStock e saldo 0', () {
    const CounterProduct limited = CounterProduct(
      id: 'agua_limitada',
      name: 'Água',
      priceCents: 300,
      categoryId: 'bebidas',
      trackStock: true,
      stockQty: 0,
    );
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    final CounterCartController controller = container.read(
      counterCartProvider.notifier,
    );
    controller.addProduct(limited);
    controller.addProduct(limited);
    expect(container.read(counterCartProvider).single.quantity, 2);
  });

  test('updateLine permite qty acima do estoque local', () {
    const CounterProduct limited = CounterProduct(
      id: 'agua_limitada',
      name: 'Água',
      priceCents: 300,
      categoryId: 'bebidas',
      trackStock: true,
      stockQty: 2,
    );
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    final CounterCartController controller = container.read(
      counterCartProvider.notifier,
    );
    controller.addProduct(limited);
    controller.updateLine(limited.id, quantity: 9);
    expect(container.read(counterCartProvider).single.quantity, 9);
  });
}
