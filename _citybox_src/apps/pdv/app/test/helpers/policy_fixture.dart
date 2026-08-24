import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/policies/application/pos_policy_controller.dart';
import 'package:citybox_pdv/features/policies/data/pos_policy_api.dart';
import 'package:citybox_pdv/features/policies/data/secure_pos_policy_store.dart';
import 'package:citybox_pdv/features/policies/domain/pos_policy.dart';

/// Alçada padrão dos testes: os mesmos defaults da API.
const PosPolicy testPolicy = PosPolicy();

/// Fixa a alçada vigente, sem cofre nem rede — para o teste dizer "o limite é
/// este" e exercitar o que acontece acima e abaixo dele.
Override policyOverride(PosPolicy policy) {
  return posPolicyProvider.overrideWith(
    () => _FixedPosPolicyController(policy),
  );
}

class _FixedPosPolicyController extends PosPolicyController {
  _FixedPosPolicyController(this._policy);

  final PosPolicy _policy;

  // Sem `super.build()`: o controller real assina a credencial para
  // ressincronizar, e aqui a alçada é justamente o que não deve mudar.
  @override
  PosPolicy build() => _policy;
}

/// Cofre em memória — `flutter_secure_storage` não roda em `flutter test`.
class FakePosPolicyStore implements PosPolicyStore {
  FakePosPolicyStore([this._policy]);

  PosPolicy? _policy;

  int writes = 0;

  @override
  Future<PosPolicy?> read() async => _policy;

  @override
  Future<void> write(PosPolicy policy) async {
    writes++;
    _policy = policy;
  }

  @override
  Future<void> clear() async => _policy = null;
}

/// API de alçada sem rede.
class FakePosPolicyApi implements PosPolicyApi {
  FakePosPolicyApi({this.policy = testPolicy});

  PosPolicy policy;

  /// Erro forçado — é assim que o teste representa "sem rede".
  PdvApiException? failure;

  int currentCalls = 0;

  @override
  Future<PosPolicy> current() async {
    currentCalls++;
    final PdvApiException? forced = failure;
    if (forced != null) throw forced;
    return policy;
  }
}
