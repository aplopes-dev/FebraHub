import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/modules/data/segment_profiles.dart';
import 'package:citybox_pdv/features/modules/data/shared_preferences_module_cache.dart';
import 'package:citybox_pdv/features/modules/domain/module_config_source.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_validator.dart';

/// Fonte fixture: cache local ou perfil padrão de desenvolvimento.
class FixtureModuleConfigSource implements ModuleConfigSource {
  FixtureModuleConfigSource(this._cache);

  final SharedPreferencesModuleCache _cache;

  static Future<FixtureModuleConfigSource> create() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    return FixtureModuleConfigSource(SharedPreferencesModuleCache(prefs));
  }

  @override
  Future<ModuleSetSnapshot> load() async {
    final ModuleSetSnapshot? cached = await _cache.read();
    if (cached != null) {
      return ModuleSetValidator.ensureValid(cached);
    }
    return buildSegmentProfile(SegmentProfileNames.defaultProfile);
  }

  @override
  Future<void> save(ModuleSetSnapshot snapshot) =>
      _cache.write(ModuleSetValidator.ensureValid(snapshot));
}
