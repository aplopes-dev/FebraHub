import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/modules/data/segment_profiles.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';

void main() {
  test('Loja liga barcode/scale/variant/price_check', () {
    final ModuleSetSnapshot loja = buildSegmentProfile(
      SegmentProfileNames.store,
    );
    expect(loja.isOperationallyVisible(PdvModuleIds.barcode), isTrue);
    expect(loja.isOperationallyVisible(PdvModuleIds.scale), isTrue);
    expect(loja.isOperationallyVisible(PdvModuleIds.variantGrid), isTrue);
    expect(loja.isOperationallyVisible(PdvModuleIds.priceCheck), isTrue);
  });

  test('Mercado liga barcode/scale/price_check e desliga variant_grid', () {
    final ModuleSetSnapshot market = buildSegmentProfile(
      SegmentProfileNames.market,
    );
    expect(market.isOperationallyVisible(PdvModuleIds.barcode), isTrue);
    expect(market.isOperationallyVisible(PdvModuleIds.scale), isTrue);
    expect(market.isOperationallyVisible(PdvModuleIds.priceCheck), isTrue);
    expect(market.isOperationallyVisible(PdvModuleIds.variantGrid), isFalse);
  });

  test('Restaurante desliga behaviors varejo', () {
    final ModuleSetSnapshot rest = buildSegmentProfile(
      SegmentProfileNames.restaurant,
    );
    expect(rest.isOperationallyVisible(PdvModuleIds.barcode), isFalse);
    expect(rest.isOperationallyVisible(PdvModuleIds.scale), isFalse);
    expect(rest.isOperationallyVisible(PdvModuleIds.variantGrid), isFalse);
    expect(rest.isOperationallyVisible(PdvModuleIds.priceCheck), isFalse);
  });

  test('refund e credit ficam desligados até existir API', () {
    for (final String name in SegmentProfileNames.all) {
      final ModuleSetSnapshot snap = buildSegmentProfile(name);
      expect(snap.isOperationallyVisible(PdvModuleIds.refund), isFalse);
      expect(snap.isOperationallyVisible(PdvModuleIds.credit), isFalse);
    }
  });

  test('tables e tabs ficam desligados até o salão existir no ERP', () {
    for (final String name in SegmentProfileNames.all) {
      final ModuleSetSnapshot snap = buildSegmentProfile(name);
      expect(snap.isOperationallyVisible(PdvModuleIds.tables), isFalse);
      expect(snap.isOperationallyVisible(PdvModuleIds.tabs), isFalse);
    }
  });
}
