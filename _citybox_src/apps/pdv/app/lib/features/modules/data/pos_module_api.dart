import 'package:dio/dio.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_validator.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_enums.dart';

/// Os módulos habilitados para **este terminal**.
///
/// Não recebe organização nem terminal: quem resolve é o `DeviceAuthGuard`, do
/// outro lado. O app não escolhe de qual caixa é a configuração que aplica.
///
/// ⚠️ A rota devolve o conjunto **já resolvido** — padrão da loja mesclado com
/// a sobrescrita do terminal. O app não remescla nada; se recebesse as duas
/// camadas, teria de reimplementar a regra, e uma divergência mostraria mesa
/// que o ERP diz estar desligada.
class PosModuleApi {
  const PosModuleApi(this._client);

  final PdvApiClient _client;

  Future<ModuleSetSnapshot> current() async {
    try {
      final Response<Map<String, dynamic>> response = await _client
          .get<Map<String, dynamic>>('/v1/pos/modules');
      final Map<String, dynamic> data =
          response.data!['data']! as Map<String, dynamic>;
      final Object? modules = data['modules'];

      return ModuleSetValidator.ensureValid(
        ModuleSetSnapshot(
          states: _parseStates(modules),
          updatedAt: DateTime.now(),
        ),
      );
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }

  /// Estado desconhecido vira `available`.
  ///
  /// Erra para o lado de **mostrar**: um servidor mais novo com um estado que
  /// este app não conhece não pode fazer sumir uma tela que o operador usa. O
  /// validador ainda protege o núcleo depois disto.
  static Map<String, PdvModuleState> _parseStates(Object? raw) {
    if (raw is! Map) return const <String, PdvModuleState>{};

    final Map<String, PdvModuleState> states = <String, PdvModuleState>{};
    raw.forEach((Object? key, Object? value) {
      if (key is! String) return;
      states[key] = switch (value) {
        'disabled' => PdvModuleState.disabled,
        'blocked' => PdvModuleState.blocked,
        _ => PdvModuleState.available,
      };
    });
    return states;
  }
}
