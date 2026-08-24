import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/settings/domain/terminal_settings.dart';

class SharedPreferencesTerminalSettingsStore {
  SharedPreferencesTerminalSettingsStore(this._prefs);

  static const String storageKey = 'pdv.terminal_settings.v1';

  final SharedPreferences _prefs;

  Future<TerminalSettings> read() async {
    final String? raw = _prefs.getString(storageKey);
    if (raw == null || raw.isEmpty) {
      return const TerminalSettings();
    }
    try {
      final Object? decoded = jsonDecode(raw);
      if (decoded is! Map<String, dynamic>) {
        return const TerminalSettings();
      }
      return TerminalSettings.fromJson(decoded);
    } on FormatException {
      return const TerminalSettings();
    }
  }

  Future<void> write(TerminalSettings settings) async {
    await _prefs.setString(storageKey, jsonEncode(settings.toJson()));
  }
}
