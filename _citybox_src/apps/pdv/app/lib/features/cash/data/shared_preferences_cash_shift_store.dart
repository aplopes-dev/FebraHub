import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';

/// Persistência do turno aberto (chave versionada).
class SharedPreferencesCashShiftStore {
  SharedPreferencesCashShiftStore(this._prefs);

  static const String storageKey = 'pdv.cash_shift.v1';

  final SharedPreferences _prefs;

  Future<CashShift?> read() async {
    final String? raw = _prefs.getString(storageKey);
    if (raw == null || raw.isEmpty) {
      return null;
    }
    try {
      final Object? decoded = jsonDecode(raw);
      if (decoded is! Map<String, dynamic>) {
        return null;
      }
      return CashShift.fromJson(decoded);
    } on FormatException {
      return null;
    }
  }

  Future<void> write(CashShift shift) async {
    await _prefs.setString(storageKey, jsonEncode(shift.toJson()));
  }

  Future<void> clear() async {
    await _prefs.remove(storageKey);
  }
}
