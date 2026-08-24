import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/payment/domain/payment_method.dart';

/// Último catálogo de formas de pagamento conhecido (`pdv.payment_methods.v1`).
class SharedPreferencesPaymentMethodsCache {
  SharedPreferencesPaymentMethodsCache(this._prefs);

  static const String storageKey = 'pdv.payment_methods.v1';

  final SharedPreferences _prefs;

  Future<List<PaymentMethod>?> read() async {
    final String? raw = _prefs.getString(storageKey);
    if (raw == null || raw.isEmpty) {
      return null;
    }
    try {
      final Object? decoded = jsonDecode(raw);
      if (decoded is! List<dynamic>) {
        return null;
      }
      return decoded
          .map(
            (dynamic row) =>
                PaymentMethod.fromPosJson(row as Map<String, dynamic>),
          )
          .toList(growable: false);
    } on FormatException {
      return null;
    }
  }

  Future<void> write(List<PaymentMethod> methods) async {
    await _prefs.setString(
      storageKey,
      jsonEncode(methods.map((PaymentMethod m) => m.toJson()).toList()),
    );
  }

  Future<void> clear() async {
    await _prefs.remove(storageKey);
  }
}
