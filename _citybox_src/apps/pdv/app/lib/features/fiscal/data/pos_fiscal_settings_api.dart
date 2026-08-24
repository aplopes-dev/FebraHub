import 'package:dio/dio.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/fiscal/domain/pos_fiscal_settings.dart';

/// Tipo de NF do PDV para **este terminal** (`Device` auth).
class PosFiscalSettingsApi {
  const PosFiscalSettingsApi(this._client);

  final PdvApiClient _client;

  Future<PosFiscalSettings> current() async {
    try {
      final Response<Map<String, dynamic>> response = await _client
          .get<Map<String, dynamic>>('/v1/pos/fiscal-settings');
      return PosFiscalSettings.fromJson(
        response.data!['data']! as Map<String, dynamic>,
      );
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }
}
