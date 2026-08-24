import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/operators/application/supervisor_authorization.dart';
import 'package:citybox_pdv/features/operators/presentation/offline_blocked_dialog.dart';
import 'package:citybox_pdv/features/operators/presentation/supervisor_authorization_dialog.dart';
import 'package:citybox_pdv/features/policies/application/pos_policy_controller.dart';
import 'package:citybox_pdv/features/policies/domain/pos_policy.dart';
import 'package:citybox_pdv/features/shared/application/connectivity_controller.dart';

/// Resposta do portão de exceção.
///
/// Selado, e não um `SupervisorAuthorization?`: nulo não distingue "não
/// precisava de ninguém" de "não foi autorizado", e as duas levam a caminhos
/// opostos — uma segue, a outra para.
sealed class ExceptionDecision {
  const ExceptionDecision();
}

/// Dentro da alçada — segue sem pedir nada.
final class ExceptionAllowed extends ExceptionDecision {
  const ExceptionAllowed();
}

/// Supervisor autorizou. [authorization] vai para o registro.
final class ExceptionAuthorized extends ExceptionDecision {
  const ExceptionAuthorized(this.authorization);
  final SupervisorAuthorization authorization;
}

/// Não segue: o operador desistiu, o PIN não conferiu, ou falta rede.
final class ExceptionRefused extends ExceptionDecision {
  const ExceptionRefused();
}

/// Decide se uma operação de exceção pode acontecer — e cuida do diálogo.
///
/// **Ponto único da regra.** As três telas que fazem exceção (desconto,
/// sangria, cancelamento) chamam isto; nenhuma consulta `PosPolicy` por conta
/// própria. Foi para isso que a decisão desceu para a entidade — e uma tela que
/// refizesse a checagem à mão acabaria divergindo na hora de acrescentar o
/// caso offline, que é exatamente o que este portão resolve.
///
/// [amount] é percentual para desconto e centavos para sangria; as outras
/// operações ignoram.
Future<ExceptionDecision> requestException(
  BuildContext context,
  WidgetRef ref, {
  required PosOperation operation,
  num amount = 0,
  String? detail,
}) async {
  final PosPolicy policy = ref.read(posPolicyProvider);

  if (!policy.requiresSupervisor(operation, amount: amount)) {
    return const ExceptionAllowed();
  }

  // Offline **antes** de pedir o PIN. Chamar o supervisor até o balcão para
  // depois dizer que não dá seria desperdiçar o tempo dele — e ensinar a
  // equipe a desconfiar do pedido de autorização.
  final bool online = ref.read(terminalOnlineProvider);
  if (!online && policy.blockedOffline(operation, amount: amount)) {
    await showOfflineBlockedDialog(context, operation: operation);
    return const ExceptionRefused();
  }

  if (!context.mounted) return const ExceptionRefused();

  final SupervisorAuthorization? authorization =
      await requestSupervisorAuthorization(
        context,
        operation: operation,
        detail: detail,
      );
  if (authorization == null) return const ExceptionRefused();
  return ExceptionAuthorized(authorization);
}
