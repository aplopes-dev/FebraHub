import 'package:dio/dio.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/policies/domain/pos_policy.dart';

/// A alçada vigente para **este terminal**.
///
/// Não recebe organização: quem resolve é o `DeviceAuthGuard` a partir da
/// credencial do dispositivo. O app não escolhe de qual empresa é a política
/// que aplica — se escolhesse, a alçada não seria alçada.
class PosPolicyApi {
  const PosPolicyApi(this._client);

  final PdvApiClient _client;

  Future<PosPolicy> current() async {
    try {
      final Response<Map<String, dynamic>> response = await _client
          .get<Map<String, dynamic>>('/v1/pos/policy');
      return PosPolicy.fromJson(
        response.data!['data']! as Map<String, dynamic>,
      );
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }
}
