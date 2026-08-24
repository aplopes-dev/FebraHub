import 'package:dio/dio.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/operators/domain/operator_cache.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';

/// Acesso aos operadores da unidade **deste terminal**.
///
/// Nenhum método recebe organização ou unidade: quem resolve isso é o
/// `DeviceAuthGuard`, do outro lado, a partir da credencial. O app não escolhe
/// de que loja é o operador que entra.
class PosOperatorApi {
  const PosOperatorApi(this._client);

  final PdvApiClient _client;

  Future<List<PosOperator>> list() async {
    try {
      final Response<Map<String, dynamic>> response = await _client
          .get<Map<String, dynamic>>('/v1/pos/operators');
      final List<dynamic> data = response.data!['data']! as List<dynamic>;
      return data
          .map((dynamic e) => PosOperator.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }

  /// Código + PIN → operador.
  ///
  /// A API devolve o **mesmo** erro para código inexistente e PIN errado, e um
  /// erro distinto (423) para operador bloqueado. A tela repassa a mensagem
  /// como veio: é ela que diz se dá para tentar de novo ou se é caso de
  /// chamar o gerente.
  Future<PosOperator> authenticate({
    required String code,
    required String pin,
  }) async {
    try {
      final Response<Map<String, dynamic>> response = await _client
          .post<Map<String, dynamic>>(
            '/v1/pos/operators/authenticate',
            data: <String, Object?>{'code': code.trim(), 'pin': pin},
          );
      return PosOperator.fromJson(
        response.data!['data']! as Map<String, dynamic>,
      );
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }

  /// Pacote de login offline — **a única resposta que traz hash de PIN**.
  ///
  /// Nunca passe isto por `PosOperator`: o hash fica confinado ao
  /// `OperatorCache`, que só o cofre lê e grava.
  Future<OperatorCache> sync() async {
    try {
      final Response<Map<String, dynamic>> response = await _client
          .get<Map<String, dynamic>>('/v1/pos/operators/sync');
      final OperatorCache? cache = OperatorCache.fromJson(
        response.data!['data']! as Map<String, dynamic>,
      );
      if (cache == null) {
        // Resposta incompleta é tratada como falha, não como cache vazio:
        // gravar um pacote pela metade tiraria o login offline sem avisar.
        throw const PdvApiException(
          'O servidor devolveu um pacote de sincronização inválido.',
        );
      }
      return cache;
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }
}
