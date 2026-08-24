import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/credit/domain/credit_models.dart';

class SharedPreferencesCreditStore {
  SharedPreferencesCreditStore(this._prefs);

  static const String key = 'pdv.credit.v1';

  final SharedPreferences _prefs;

  Future<CreditState> read() async {
    final String? raw = _prefs.getString(key);
    if (raw == null || raw.isEmpty) {
      return const CreditState();
    }
    try {
      return CreditState.fromJson(
        Map<String, dynamic>.from(jsonDecode(raw) as Map),
      );
    } on Object {
      return const CreditState();
    }
  }

  Future<void> write(CreditState state) async {
    await _prefs.setString(key, jsonEncode(state.toJson()));
  }
}
