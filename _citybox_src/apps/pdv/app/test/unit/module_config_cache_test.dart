import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/modules/data/fixture_module_config_source.dart';
import 'package:citybox_pdv/features/modules/data/segment_profiles.dart';
import 'package:citybox_pdv/features/modules/data/shared_preferences_module_cache.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('cache round-trip', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final SharedPreferencesModuleCache cache = SharedPreferencesModuleCache(
      prefs,
    );
    final ModuleSetSnapshot original = buildSegmentProfile(
      SegmentProfileNames.market,
    );
    await cache.write(original);
    final ModuleSetSnapshot? loaded = await cache.read();
    expect(loaded, isNotNull);
    expect(loaded!.profileName, SegmentProfileNames.market);
    expect(loaded.isOperationallyVisible(PdvModuleIds.barcode), isTrue);
  });

  test('fonte sem cache usa perfil padrão com Balcão', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final FixtureModuleConfigSource source =
        await FixtureModuleConfigSource.create();
    final ModuleSetSnapshot loaded = await source.load();
    expect(loaded.profileName, SegmentProfileNames.defaultProfile);
    expect(loaded.isOperationallyVisible(PdvModuleIds.counter), isTrue);
  });
}
