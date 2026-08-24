import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/delivery/data/delivery_fixture.dart';
import 'package:citybox_pdv/features/delivery/domain/delivery_order.dart';
import 'package:citybox_pdv/features/tables/data/tables_fixture.dart';
import 'package:citybox_pdv/features/tables/domain/dining_table.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';

class SalonSnapshot {
  const SalonSnapshot({
    required this.tables,
    required this.accounts,
    required this.deliveryOrders,
  });

  final List<DiningTable> tables;
  final List<SalonAccount> accounts;
  final List<DeliveryOrder> deliveryOrders;

  SalonSnapshot copyWith({
    List<DiningTable>? tables,
    List<SalonAccount>? accounts,
    List<DeliveryOrder>? deliveryOrders,
  }) {
    return SalonSnapshot(
      tables: tables ?? this.tables,
      accounts: accounts ?? this.accounts,
      deliveryOrders: deliveryOrders ?? this.deliveryOrders,
    );
  }

  Map<String, Object?> toJson() => <String, Object?>{
    'version': 1,
    'tables': tables.map((DiningTable e) => e.toJson()).toList(),
    'accounts': accounts.map((SalonAccount e) => e.toJson()).toList(),
    'deliveryOrders':
        deliveryOrders.map((DeliveryOrder e) => e.toJson()).toList(),
  };

  static SalonSnapshot fromJson(Map<String, dynamic> json) {
    final List<dynamic> rawTables =
        (json['tables'] as List<dynamic>?) ?? const <dynamic>[];
    final List<dynamic> rawAccounts =
        (json['accounts'] as List<dynamic>?) ?? const <dynamic>[];
    final List<dynamic> rawOrders =
        (json['deliveryOrders'] as List<dynamic>?) ?? const <dynamic>[];
    return SalonSnapshot(
      tables:
          rawTables
              .map(
                (dynamic e) =>
                    DiningTable.fromJson(Map<String, dynamic>.from(e as Map)),
              )
              .toList(),
      accounts:
          rawAccounts
              .map(
                (dynamic e) =>
                    SalonAccount.fromJson(Map<String, dynamic>.from(e as Map)),
              )
              .toList(),
      deliveryOrders:
          rawOrders
              .map(
                (dynamic e) =>
                    DeliveryOrder.fromJson(Map<String, dynamic>.from(e as Map)),
              )
              .toList(),
    );
  }

  /// Estado vazio — produção nunca semeia mesas/pedidos demo.
  static const SalonSnapshot empty = SalonSnapshot(
    tables: <DiningTable>[],
    accounts: <SalonAccount>[],
    deliveryOrders: <DeliveryOrder>[],
  );

  /// Só para testes / override explícito — **não** usar em `read()`/`build()`.
  static SalonSnapshot emptyFixture() {
    final DeliveryFixture delivery = buildDeliveryFixture();
    return SalonSnapshot(
      tables: buildDefaultTables(),
      accounts: delivery.accounts,
      deliveryOrders: delivery.orders,
    );
  }
}

class SharedPreferencesSalonStore {
  SharedPreferencesSalonStore(this._prefs);

  static const String storageKey = 'pdv.salon.v1';

  final SharedPreferences _prefs;

  Future<SalonSnapshot> read() async {
    final String? raw = _prefs.getString(storageKey);
    if (raw == null || raw.isEmpty) {
      return SalonSnapshot.empty;
    }
    try {
      final Object? decoded = jsonDecode(raw);
      if (decoded is! Map<String, dynamic>) {
        return SalonSnapshot.empty;
      }
      return SalonSnapshot.fromJson(decoded);
    } on FormatException {
      return SalonSnapshot.empty;
    }
  }

  Future<void> write(SalonSnapshot snapshot) async {
    await _prefs.setString(storageKey, jsonEncode(snapshot.toJson()));
  }

  Future<void> clear() async {
    await _prefs.remove(storageKey);
  }
}
