import 'package:dio/dio.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/payment/domain/seller.dart';

/// Vendedores elegíveis da unidade deste terminal (`GET /v1/pos/sellers`).
class PosSellerApi {
  const PosSellerApi(this._client);

  final PdvApiClient _client;

  Future<List<Seller>> list() async {
    try {
      final Response<Map<String, dynamic>> response = await _client
          .get<Map<String, dynamic>>('/v1/pos/sellers');
      final List<dynamic> data = response.data!['data']! as List<dynamic>;
      return data
          .map((dynamic e) => Seller.fromJson(e as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }
}
