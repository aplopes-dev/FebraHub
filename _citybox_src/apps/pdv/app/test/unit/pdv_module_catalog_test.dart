import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/modules/data/segment_profiles.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_validator.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_definition.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_enums.dart';

void main() {
  test('catálogo cobre behaviors FR-001 e screens', () {
    final Set<String> ids =
        pdvModuleCatalog.map((PdvModuleDefinition d) => d.id).toSet();
    expect(
      ids,
      containsAll(<String>[
        PdvModuleIds.barcode,
        PdvModuleIds.scale,
        PdvModuleIds.variantGrid,
        PdvModuleIds.itemAddon,
        PdvModuleIds.kitchenNote,
        PdvModuleIds.halfPizza,
        PdvModuleIds.productionPrint,
        PdvModuleIds.serviceFee,
        PdvModuleIds.couvert,
        PdvModuleIds.counter,
      ]),
    );
    expect(
      pdvModuleCatalog.where((PdvModuleDefinition d) => d.isCore).length,
      greaterThanOrEqualTo(8),
    );
  });

  test('validator força núcleo available', () {
    final ModuleSetSnapshot bad = ModuleSetSnapshot(
      states: <String, PdvModuleState>{
        PdvModuleIds.counter: PdvModuleState.disabled,
        PdvModuleIds.tables: PdvModuleState.disabled,
      },
      updatedAt: DateTime.now(),
    );
    expect(ModuleSetValidator.hasInvalidCore(bad), isTrue);
    final ModuleSetSnapshot fixed = ModuleSetValidator.ensureValid(bad);
    expect(fixed.stateFor(PdvModuleIds.counter), PdvModuleState.available);
  });

  test('quatro perfis incluem núcleo e diferem nos opcionais', () {
    for (final String name in SegmentProfileNames.all) {
      final ModuleSetSnapshot snap = buildSegmentProfile(name);
      expect(snap.isOperationallyVisible(PdvModuleIds.counter), isTrue);
      expect(snap.profileName, name);
    }
    final ModuleSetSnapshot loja = buildSegmentProfile(
      SegmentProfileNames.store,
    );
    expect(loja.isOperationallyVisible(PdvModuleIds.tables), isFalse);
    expect(loja.isOperationallyVisible(PdvModuleIds.barcode), isTrue);

    final ModuleSetSnapshot rest = buildSegmentProfile(
      SegmentProfileNames.restaurant,
    );
    expect(rest.isOperationallyVisible(PdvModuleIds.tables), isFalse);
    expect(rest.isOperationallyVisible(PdvModuleIds.tabs), isFalse);
    expect(rest.isOperationallyVisible(PdvModuleIds.barcode), isFalse);
  });
}
