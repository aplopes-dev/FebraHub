import 'package:dio/dio.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/payment/domain/payment_method.dart';

/// Formas de pagamento ativas do terminal (`GET /v1/pos/payment-methods`).
class PosPaymentMethodsApi {
  const PosPaymentMethodsApi(this._client);

  final PdvApiClient _client;

  Future<List<PaymentMethod>> list() async {
    try {
      final Response<Map<String, dynamic>> response = await _client
          .get<Map<String, dynamic>>('/v1/pos/payment-methods');
      final List<dynamic> raw = response.data!['data']! as List<dynamic>;
      return raw
          .map(
            (dynamic row) =>
                PaymentMethod.fromPosJson(row as Map<String, dynamic>),
          )
          .toList(growable: false);
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }
}
