import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/fiscal/domain/pos_fiscal_settings.dart';

/// Cache leve — não é segredo; SharedPreferences basta.
abstract interface class PosFiscalSettingsStore {
  Future<PosFiscalSettings?> read();
  Future<void> write(PosFiscalSettings settings);
  Future<void> clear();
}

class SharedPreferencesPosFiscalSettingsStore implements PosFiscalSettingsStore {
  SharedPreferencesPosFiscalSettingsStore(this._prefs);

  static const String key = 'pdv.fiscal_settings.v1';

  final SharedPreferences _prefs;

  @override
  Future<PosFiscalSettings?> read() async {
    final String? raw = _prefs.getString(key);
    if (raw == null || raw.isEmpty) return null;
    try {
      return PosFiscalSettings.fromJson(
        jsonDecode(raw) as Map<String, dynamic>,
      );
    } on FormatException {
      return null;
    } on TypeError {
      return null;
    }
  }

  @override
  Future<void> write(PosFiscalSettings settings) async {
    await _prefs.setString(key, jsonEncode(settings.toJson()));
  }

  @override
  Future<void> clear() async {
    await _prefs.remove(key);
  }
}
