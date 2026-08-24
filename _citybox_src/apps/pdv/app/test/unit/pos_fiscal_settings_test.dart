import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/fiscal/domain/pos_fiscal_settings.dart';
import 'package:citybox_pdv/features/shared/domain/sync_status.dart';

void main() {
  group('PosFiscalSettings', () {
    test('parseia MODEL_65', () {
      final PosFiscalSettings settings = PosFiscalSettings.fromJson(
        <String, dynamic>{
          'id': 'fs-1',
          'posDocumentModel': 'MODEL_65',
          'updatedByUserId': 'u-1',
          'updatedAt': '2026-08-15T12:00:00.000Z',
        },
      );
      expect(settings.posDocumentModel, PosDocumentModel.model65);
      expect(settings.isConfigured, isTrue);
    });

    test('modelo null = não configurado', () {
      final PosFiscalSettings settings = PosFiscalSettings.fromJson(
        <String, dynamic>{'id': 'fs-1', 'posDocumentModel': null},
      );
      expect(settings.isConfigured, isFalse);
    });
  });

  group('sync fiscal honesty', () {
    test('sem modelo → down; com modelo → degraded; nunca ok por omissão', () {
      ChannelHealth healthFor(PosFiscalSettings s) =>
          s.posDocumentModel == null
              ? ChannelHealth.down
              : ChannelHealth.degraded;

      expect(healthFor(PosFiscalSettings.unset), ChannelHealth.down);
      expect(
        healthFor(
          const PosFiscalSettings(
            id: '1',
            posDocumentModel: PosDocumentModel.model55,
          ),
        ),
        ChannelHealth.degraded,
      );
      expect(healthFor(PosFiscalSettings.unset), isNot(ChannelHealth.ok));
    });
  });
}
