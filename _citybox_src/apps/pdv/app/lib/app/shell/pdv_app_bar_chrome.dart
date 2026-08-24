import 'package:flutter/material.dart';

import 'package:citybox_pdv/app/shell/pdv_close_shift_action.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';

/// Moldura visual comum a toda app bar de conteúdo do PDV: altura fixa, fundo
/// e borda inferior.
///
/// Cada tela decide o que vai dentro — a app bar padrão (menu, sair) e a do
/// Balcão (voltar, cliente, comandas, loja) só diferem no `child`. Extraído
/// aqui porque a partir de duas telas com app bar própria, repetir a moldura
/// em cada uma vira a primeira divergência esperando para acontecer.
///
/// Depois do [child], e sempre encostado na borda direita, entra o
/// [PdvCloseShiftAction]. Ele mora **aqui**, e não no `child` de cada tela,
/// pelo mesmo motivo que o Voltar mora no `PdvAppBar`: fechar o caixa tem que
/// estar sempre no mesmo lugar, e uma tela nova não pode nascer sem ele por
/// esquecimento de quem a escreveu.
class PdvAppBarChrome extends StatelessWidget {
  const PdvAppBarChrome({
    required this.child,
    this.showCloseShift = true,
    super.key,
  });

  final Widget child;

  /// Desenha o **Fechar caixa** no canto direito.
  ///
  /// O padrão é `true` — o caminho preguiçoso tem que ser o correto. Passam
  /// `false` só as telas da venda em andamento (Balcão e Pagamento), onde o
  /// fechamento seria recusado pelo próprio turno, e a própria tela de
  /// fechamento.
  final bool showCloseShift;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        color: PdvAppBarColors.background,
        border: Border(bottom: BorderSide(color: PdvAppBarColors.border)),
      ),
      child: SizedBox(
        height: PdvSizes.appBarHeight,
        child: Row(
          children: <Widget>[
            Expanded(child: child),
            if (showCloseShift) const PdvCloseShiftAction(),
          ],
        ),
      ),
    );
  }
}
