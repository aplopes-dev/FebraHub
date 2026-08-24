import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/counter/application/counter_category_controller.dart';

void main() {
  test('começa sem categoria selecionada — "Todos os produtos"', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    expect(container.read(counterCategoryProvider), isNull);
  });

  test('select troca a categoria selecionada', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    container.read(counterCategoryProvider.notifier).select('bebidas');

    expect(container.read(counterCategoryProvider), 'bebidas');
  });

  test('select(null) volta para "Todos os produtos"', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    final CounterCategoryController controller = container.read(
      counterCategoryProvider.notifier,
    );
    controller.select('bebidas');
    controller.select(null);

    expect(container.read(counterCategoryProvider), isNull);
  });
}
