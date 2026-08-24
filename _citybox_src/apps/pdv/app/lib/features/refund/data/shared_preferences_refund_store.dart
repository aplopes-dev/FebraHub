import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/refund/domain/refund_models.dart';

class SharedPreferencesRefundStore {
  SharedPreferencesRefundStore(this._prefs);

  static const String key = 'pdv.refund.v1';

  final SharedPreferences _prefs;

  Future<List<RefundRecord>> readAll() async {
    final String? raw = _prefs.getString(key);
    if (raw == null || raw.isEmpty) {
      return const <RefundRecord>[];
    }
    try {
      final List<dynamic> list = jsonDecode(raw) as List<dynamic>;
      return list
          .map(
            (dynamic e) =>
                RefundRecord.fromJson(Map<String, dynamic>.from(e as Map)),
          )
          .toList();
    } on Object {
      return const <RefundRecord>[];
    }
  }

  Future<void> writeAll(List<RefundRecord> records) async {
    await _prefs.setString(
      key,
      jsonEncode(records.map((RefundRecord e) => e.toJson()).toList()),
    );
  }
}
