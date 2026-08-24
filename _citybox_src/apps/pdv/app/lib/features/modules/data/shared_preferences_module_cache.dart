import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_enums.dart';

/// Persistência do último snapshot conhecido (chave versionada).
class SharedPreferencesModuleCache {
  SharedPreferencesModuleCache(this._prefs);

  static const String storageKey = 'pdv.modules.v1';

  final SharedPreferences _prefs;

  Future<ModuleSetSnapshot?> read() async {
    final String? raw = _prefs.getString(storageKey);
    if (raw == null || raw.isEmpty) {
      return null;
    }
    try {
      final Object? decoded = jsonDecode(raw);
      if (decoded is! Map<String, dynamic>) {
        return null;
      }
      final Object? statesRaw = decoded['states'];
      if (statesRaw is! Map) {
        return null;
      }
      final Map<String, PdvModuleState> states = <String, PdvModuleState>{};
      statesRaw.forEach((Object? key, Object? value) {
        if (key is! String || value is! String) {
          return;
        }
        final PdvModuleState? state = _parseState(value);
        if (state != null) {
          states[key] = state;
        }
      });
      final String? profileName = decoded['profileName'] as String?;
      final String? updatedAtRaw = decoded['updatedAt'] as String?;
      final DateTime updatedAt =
          updatedAtRaw != null
              ? (DateTime.tryParse(updatedAtRaw) ?? DateTime.now())
              : DateTime.now();
      return ModuleSetSnapshot(
        states: states,
        profileName: profileName,
        updatedAt: updatedAt,
      );
    } on FormatException {
      return null;
    }
  }

  Future<void> write(ModuleSetSnapshot snapshot) async {
    final Map<String, Object?> payload = <String, Object?>{
      'states': <String, String>{
        for (final MapEntry<String, PdvModuleState> e
            in snapshot.states.entries)
          e.key: e.value.name,
      },
      'profileName': snapshot.profileName,
      'updatedAt': snapshot.updatedAt.toIso8601String(),
    };
    await _prefs.setString(storageKey, jsonEncode(payload));
  }

  static PdvModuleState? _parseState(String name) {
    for (final PdvModuleState state in PdvModuleState.values) {
      if (state.name == name) {
        return state;
      }
    }
    return null;
  }
}
