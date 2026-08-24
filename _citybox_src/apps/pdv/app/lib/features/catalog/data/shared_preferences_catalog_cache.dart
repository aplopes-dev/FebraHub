import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/catalog/domain/catalog_snapshot.dart';

/// Persistência do último snapshot conhecido (chave versionada).
class SharedPreferencesCatalogCache {
  SharedPreferencesCatalogCache(this._prefs);

  static const String storageKey = 'pdv.catalog.v1';

  final SharedPreferences _prefs;

  Future<CatalogSnapshot?> read() async {
    final String? raw = _prefs.getString(storageKey);
    if (raw == null || raw.isEmpty) {
      return null;
    }
    try {
      final Object? decoded = jsonDecode(raw);
      if (decoded is! Map<String, dynamic>) {
        return null;
      }
      return CatalogSnapshot.fromJson(decoded);
    } on FormatException {
      return null;
    }
  }

  Future<void> write(CatalogSnapshot snapshot) async {
    await _prefs.setString(storageKey, jsonEncode(snapshot.toJson()));
  }

  Future<void> clear() async {
    await _prefs.remove(storageKey);
  }
}
