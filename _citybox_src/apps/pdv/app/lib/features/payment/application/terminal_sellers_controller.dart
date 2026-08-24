import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/core/format/normalize_for_search.dart';
import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/payment/data/pos_seller_api.dart';
import 'package:citybox_pdv/features/payment/domain/seller.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';

const String _sellersCacheKey = 'pdv.sellers.cache.v1';

final Provider<PosSellerApi> posSellerApiProvider = Provider<PosSellerApi>(
  (Ref ref) => PosSellerApi(ref.watch(pdvApiClientProvider)),
);

List<Seller> _sortedSellers(List<Seller> sellers) =>
    List<Seller>.unmodifiable(
      sortedByName<Seller>(sellers, (Seller s) => s.name),
    );

/// Lista de vendedores da unidade do terminal (API + cache offline).
///
/// Sem credencial de device, lista vazia. Falha de rede devolve o último cache
/// bom; sem cache, lista vazia (picker mostra mensagem — sem fixture).
/// Ordem: alfabética por nome.
final FutureProvider<List<Seller>> terminalSellersProvider =
    FutureProvider<List<Seller>>((Ref ref) async {
      ref.watch(deviceCredentialProvider);
      if (ref.read(deviceCredentialProvider) == null) {
        return const <Seller>[];
      }

      try {
        final List<Seller> sellers = _sortedSellers(
          await ref.watch(posSellerApiProvider).list(),
        );
        await _writeCache(sellers);
        return sellers;
      } on PdvApiException {
        final List<Seller>? cached = await _readCache();
        return cached == null ? const <Seller>[] : _sortedSellers(cached);
      }
    });

Future<void> _writeCache(List<Seller> sellers) async {
  final SharedPreferences prefs = await SharedPreferences.getInstance();
  final String encoded = jsonEncode(
    sellers.map((Seller s) => s.toJson()).toList(growable: false),
  );
  await prefs.setString(_sellersCacheKey, encoded);
}

Future<List<Seller>?> _readCache() async {
  final SharedPreferences prefs = await SharedPreferences.getInstance();
  final String? raw = prefs.getString(_sellersCacheKey);
  if (raw == null || raw.isEmpty) return null;
  try {
    final List<dynamic> list = jsonDecode(raw) as List<dynamic>;
    return list
        .map((dynamic e) => Seller.fromJson(e as Map<String, dynamic>))
        .toList(growable: false);
  } on FormatException {
    return null;
  }
}
