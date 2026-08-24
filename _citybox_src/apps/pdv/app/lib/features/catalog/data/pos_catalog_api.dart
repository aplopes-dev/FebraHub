import 'package:dio/dio.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/catalog/domain/catalog_snapshot.dart';

/// Snapshot de catálogo **deste** terminal (`GET /v1/pos/catalog`).
///
/// Organização e unidade vêm do `DeviceAuthGuard` — o app não escolhe loja.
/// O preço já chega resolvido para o canal `pdv`.
class PosCatalogApi {
  const PosCatalogApi(this._client);

  final PdvApiClient _client;

  Future<CatalogSnapshot> current() async {
    try {
      final Response<Map<String, dynamic>> response = await _client
          .get<Map<String, dynamic>>('/v1/pos/catalog');
      final Map<String, dynamic> data =
          response.data!['data']! as Map<String, dynamic>;
      return CatalogSnapshot.fromJson(data);
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }
}
