import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/data/pos_operator_api.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';

/// Quem autorizou uma operação de exceção.
///
/// Guarda **id e nome**, não o operador inteiro. É o que vai para o registro da
/// venda ou da sangria, e o nome fica congelado no momento da autorização: se a
/// supervisora mudar de nome no cadastro depois, o histórico continua contando
/// o que aconteceu naquele dia.
class SupervisorAuthorization {
  const SupervisorAuthorization({
    required this.operatorId,
    required this.operatorName,
  });

  final String operatorId;
  final String operatorName;
}

final Provider<SupervisorAuthorizer> supervisorAuthorizerProvider =
    Provider<SupervisorAuthorizer>(
      (Ref ref) => SupervisorAuthorizer(ref.watch(posOperatorApiProvider)),
    );

/// Confere o PIN de um autorizador **sem trocar a sessão do caixa**.
///
/// É por isso que existe em vez de reusar `OperatorSessionController.signIn`:
/// `signIn` publica o operador na sessão, e autorizar um desconto passaria a
/// transferir o caixa para o supervisor. As vendas seguintes sairiam no nome
/// errado — um erro silencioso que só apareceria no fechamento.
class SupervisorAuthorizer {
  const SupervisorAuthorizer(this._api);

  final PosOperatorApi _api;

  /// Mensagem do operador sem a permissão exigida.
  static const String notAuthorizedMessage =
      'Este operador não pode autorizar. Chame quem tenha permissão.';

  /// Atalho: exige [PosOperator.alcadaAuthorizePermission].
  Future<SupervisorAuthorization> authorize({
    required String code,
    required String pin,
  }) {
    return authorizeWithPermission(
      code: code,
      pin: pin,
      requiredPermissionId: PosOperator.alcadaAuthorizePermission,
    );
  }

  /// Autentica e exige [requiredPermissionId] em `permissionIds`.
  Future<SupervisorAuthorization> authorizeWithPermission({
    required String code,
    required String pin,
    required String requiredPermissionId,
  }) async {
    final PosOperator operator = await _api.authenticate(code: code, pin: pin);

    // ⚠️ O PIN é conferido pelo servidor; a **permissão** é conferida aqui.
    // Quando houver rota de venda/sangria no servidor, a checagem tem que ser
    // refeita lá (ver AGENTS.md do PDV).
    if (!operator.hasPermission(requiredPermissionId)) {
      throw const PdvApiException(notAuthorizedMessage, statusCode: 403);
    }

    return SupervisorAuthorization(
      operatorId: operator.id,
      operatorName: operator.name,
    );
  }
}
