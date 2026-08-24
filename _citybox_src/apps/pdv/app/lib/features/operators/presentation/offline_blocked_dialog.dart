import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/policies/domain/pos_policy.dart';

/// Avisa que a operação de exceção precisa de rede.
///
/// Título diz **o que fazer**, não "erro": o operador não errou nada, e a
/// mensagem que ele precisa é quando poderá tentar de novo. Chamar isto de
/// falha faria o caixa repetir a mesma ação achando que foi problema dele.
Future<void> showOfflineBlockedDialog(
  BuildContext context, {
  required PosOperation operation,
}) {
  return showDialog<void>(
    context: context,
    builder: (BuildContext ctx) {
      return AlertDialog(
        backgroundColor: PdvColors.surface,
        title: Text('${operation.label} precisa de rede'),
        content: SizedBox(
          width: 420,
          child: Text(
            'Esta operação só pode ser autorizada com o servidor da loja '
            'respondendo — mesmo com um supervisor presente.\n\n'
            'Volte a tentar quando a conexão voltar. Vender, abrir caixa, '
            'sangrar dentro do limite e fechar o caixa continuam funcionando '
            'normalmente.',
            style: PdvTypography.bodyMd.copyWith(
              color: PdvColors.textSecondary,
            ),
          ),
        ),
        actions: <Widget>[
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Entendi'),
          ),
        ],
      );
    },
  );
}
