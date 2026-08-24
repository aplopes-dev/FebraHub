import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/modules/data/segment_profiles.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_validator.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_definition.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_enums.dart';

void main() {
  test(
    'quatro perfis nomeados incluem núcleo available e diferem nos opcionais',
    () {
      expect(SegmentProfileNames.all, hasLength(4));

      for (final String name in SegmentProfileNames.all) {
        final ModuleSetSnapshot snap = buildSegmentProfile(name);
        for (final PdvModuleDefinition def in coreModuleDefinitions) {
          if (ModuleSetValidator.allowsDisabledCore(def.id)) {
            expect(
              snap.stateFor(def.id),
              PdvModuleState.disabled,
              reason: 'núcleo forçado off ${def.id} em $name',
            );
            continue;
          }
          expect(
            snap.stateFor(def.id),
            PdvModuleState.available,
            reason: 'núcleo ${def.id} em $name',
          );
        }
      }

      final ModuleSetSnapshot restaurant = buildSegmentProfile(
        SegmentProfileNames.restaurant,
      );
      final ModuleSetSnapshot store = buildSegmentProfile(
        SegmentProfileNames.store,
      );
      final ModuleSetSnapshot market = buildSegmentProfile(
        SegmentProfileNames.market,
      );
      final ModuleSetSnapshot snack = buildSegmentProfile(
        SegmentProfileNames.snackWithDelivery,
      );

      expect(restaurant.isOperationallyVisible(PdvModuleIds.tables), isFalse);
      expect(restaurant.isOperationallyVisible(PdvModuleIds.tabs), isFalse);
      expect(restaurant.isOperationallyVisible(PdvModuleIds.delivery), isTrue);
      expect(store.isOperationallyVisible(PdvModuleIds.tables), isFalse);
      expect(store.isOperationallyVisible(PdvModuleIds.barcode), isTrue);
      expect(market.isOperationallyVisible(PdvModuleIds.scale), isTrue);
      expect(market.isOperationallyVisible(PdvModuleIds.variantGrid), isFalse);
      expect(snack.isOperationallyVisible(PdvModuleIds.delivery), isTrue);
      expect(snack.isOperationallyVisible(PdvModuleIds.tables), isFalse);
      expect(snack.isOperationallyVisible(PdvModuleIds.tabs), isFalse);
    },
  );
}
