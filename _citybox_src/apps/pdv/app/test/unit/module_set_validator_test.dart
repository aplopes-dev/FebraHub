import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_validator.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_enums.dart';

void main() {
  test('ensureValid força núcleo ausente/desligado para available', () {
    final ModuleSetSnapshot input = ModuleSetSnapshot(
      states: <String, PdvModuleState>{
        PdvModuleIds.counter: PdvModuleState.disabled,
        PdvModuleIds.customer: PdvModuleState.blocked,
        PdvModuleIds.tables: PdvModuleState.disabled,
      },
      updatedAt: DateTime.fromMillisecondsSinceEpoch(0),
    );

    expect(ModuleSetValidator.hasInvalidCore(input), isTrue);

    final ModuleSetSnapshot fixed = ModuleSetValidator.ensureValid(input);
    expect(fixed.stateFor(PdvModuleIds.counter), PdvModuleState.available);
    expect(fixed.stateFor(PdvModuleIds.customer), PdvModuleState.available);
    expect(fixed.stateFor(PdvModuleIds.tables), PdvModuleState.disabled);
  });

  test('ensureValid preserva credit/refund disabled do servidor', () {
    final ModuleSetSnapshot input = ModuleSetSnapshot(
      states: <String, PdvModuleState>{
        PdvModuleIds.credit: PdvModuleState.disabled,
        PdvModuleIds.refund: PdvModuleState.disabled,
        PdvModuleIds.counter: PdvModuleState.disabled,
      },
      updatedAt: DateTime.fromMillisecondsSinceEpoch(0),
    );

    expect(ModuleSetValidator.hasInvalidCore(input), isTrue);
    final ModuleSetSnapshot fixed = ModuleSetValidator.ensureValid(input);
    expect(fixed.stateFor(PdvModuleIds.credit), PdvModuleState.disabled);
    expect(fixed.stateFor(PdvModuleIds.refund), PdvModuleState.disabled);
    expect(fixed.stateFor(PdvModuleIds.counter), PdvModuleState.available);
  });

  test('ensureValid força tables/tabs disabled mesmo se available', () {
    final ModuleSetSnapshot input = ModuleSetSnapshot(
      states: <String, PdvModuleState>{
        PdvModuleIds.tables: PdvModuleState.available,
        PdvModuleIds.tabs: PdvModuleState.available,
      },
      updatedAt: DateTime.fromMillisecondsSinceEpoch(0),
    );

    final ModuleSetSnapshot fixed = ModuleSetValidator.ensureValid(input);
    expect(fixed.stateFor(PdvModuleIds.tables), PdvModuleState.disabled);
    expect(fixed.stateFor(PdvModuleIds.tabs), PdvModuleState.disabled);
  });

  test('ensureValid faz delivery espelhar delivery_orders', () {
    final ModuleSetSnapshot input = ModuleSetSnapshot(
      states: <String, PdvModuleState>{
        PdvModuleIds.deliveryOrders: PdvModuleState.disabled,
        PdvModuleIds.delivery: PdvModuleState.available,
      },
      updatedAt: DateTime.fromMillisecondsSinceEpoch(0),
    );

    final ModuleSetSnapshot fixed = ModuleSetValidator.ensureValid(input);
    expect(fixed.stateFor(PdvModuleIds.deliveryOrders), PdvModuleState.disabled);
    expect(fixed.stateFor(PdvModuleIds.delivery), PdvModuleState.disabled);
  });
}
