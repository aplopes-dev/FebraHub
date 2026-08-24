import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_enums.dart';

void main() {
  test('começa com núcleo disponível; mesas/comandas forçados off', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    final ModuleSetSnapshot state = container.read(moduleVisibilityProvider);
    final ModuleVisibilityController controller = container.read(
      moduleVisibilityProvider.notifier,
    );

    expect(controller.isOperationallyVisible(PdvModuleIds.counter), isTrue);
    expect(state.isOperationallyVisible(PdvModuleIds.tables), isFalse);
    expect(state.isOperationallyVisible(PdvModuleIds.tabs), isFalse);
  });

  test('setVisible(false) desliga e setVisible(true) devolve', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    final ModuleVisibilityController controller = container.read(
      moduleVisibilityProvider.notifier,
    );

    controller.setVisible(PdvModuleIds.service, visible: false);
    expect(controller.isOperationallyVisible(PdvModuleIds.service), isFalse);
    expect(
      container.read(moduleVisibilityProvider).stateFor(PdvModuleIds.service),
      PdvModuleState.disabled,
    );

    controller.setVisible(PdvModuleIds.service, visible: true);
    expect(controller.isOperationallyVisible(PdvModuleIds.service), isTrue);
  });

  test('desligar um módulo não afeta os demais', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    final ModuleVisibilityController controller = container.read(
      moduleVisibilityProvider.notifier,
    );

    controller.setVisible(PdvModuleIds.service, visible: false);

    expect(controller.isOperationallyVisible(PdvModuleIds.counter), isTrue);
    expect(controller.isOperationallyVisible(PdvModuleIds.customer), isTrue);
  });

  test('isOperationallyVisible é false para disabled e blocked', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    final ModuleVisibilityController controller = container.read(
      moduleVisibilityProvider.notifier,
    );

    controller.setModuleState(PdvModuleIds.service, PdvModuleState.disabled);
    expect(controller.isOperationallyVisible(PdvModuleIds.service), isFalse);

    controller.setModuleState(PdvModuleIds.service, PdvModuleState.blocked);
    expect(controller.isOperationallyVisible(PdvModuleIds.service), isFalse);

    controller.setModuleState(PdvModuleIds.service, PdvModuleState.available);
    expect(controller.isOperationallyVisible(PdvModuleIds.service), isTrue);
  });

  test('recusa desligar módulo de núcleo', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    final ModuleVisibilityController controller = container.read(
      moduleVisibilityProvider.notifier,
    );

    controller.setModuleState(PdvModuleIds.counter, PdvModuleState.disabled);
    expect(controller.isOperationallyVisible(PdvModuleIds.counter), isTrue);
    expect(
      container.read(moduleVisibilityProvider).stateFor(PdvModuleIds.counter),
      PdvModuleState.available,
    );
  });

  test('recusa religar tables/tabs enquanto feature estiver bloqueada', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    final ModuleVisibilityController controller = container.read(
      moduleVisibilityProvider.notifier,
    );

    controller.setVisible(PdvModuleIds.tables, visible: true);
    expect(controller.isOperationallyVisible(PdvModuleIds.tables), isFalse);
    controller.setVisible(PdvModuleIds.tabs, visible: true);
    expect(controller.isOperationallyVisible(PdvModuleIds.tabs), isFalse);
  });

  test('delivery espelha delivery_orders', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    final ModuleVisibilityController controller = container.read(
      moduleVisibilityProvider.notifier,
    );

    controller.setVisible(PdvModuleIds.deliveryOrders, visible: false);
    expect(
      controller.isOperationallyVisible(PdvModuleIds.deliveryOrders),
      isFalse,
    );
    expect(controller.isOperationallyVisible(PdvModuleIds.delivery), isFalse);

    controller.setVisible(PdvModuleIds.deliveryOrders, visible: true);
    expect(
      controller.isOperationallyVisible(PdvModuleIds.deliveryOrders),
      isTrue,
    );
    expect(controller.isOperationallyVisible(PdvModuleIds.delivery), isTrue);
  });
}
