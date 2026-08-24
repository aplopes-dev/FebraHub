import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/customer/domain/customer_category.dart';

/// Cache local do último snapshot de clientes/categorias (`pdv.customers.v1`).
class SharedPreferencesCustomerCache {
  SharedPreferencesCustomerCache(this._prefs);

  static const String key = 'pdv.customers.v1';

  final SharedPreferences _prefs;

  Future<({List<Customer> customers, List<CustomerCategory> categories})?>
  read() async {
    final String? raw = _prefs.getString(key);
    if (raw == null || raw.isEmpty) {
      return null;
    }
    try {
      final Map<String, dynamic> json =
          jsonDecode(raw) as Map<String, dynamic>;
      final List<dynamic> customersRaw =
          (json['customers'] as List<dynamic>?) ?? <dynamic>[];
      final List<dynamic> categoriesRaw =
          (json['categories'] as List<dynamic>?) ?? <dynamic>[];
      return (
        customers: customersRaw
            .map(
              (dynamic row) =>
                  Customer.fromJson(Map<String, dynamic>.from(row as Map)),
            )
            .toList(growable: false),
        categories: categoriesRaw
            .map(
              (dynamic row) => CustomerCategory.fromJson(
                Map<String, dynamic>.from(row as Map),
              ),
            )
            .toList(growable: false),
      );
    } on FormatException {
      return null;
    }
  }

  Future<void> write({
    required List<Customer> customers,
    required List<CustomerCategory> categories,
  }) async {
    final String raw = jsonEncode(<String, dynamic>{
      'customers': customers
          .map((Customer c) => c.toCacheJson())
          .toList(growable: false),
      'categories': categories
          .map((CustomerCategory c) => c.toJson())
          .toList(growable: false),
    });
    await _prefs.setString(key, raw);
  }
}
