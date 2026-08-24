import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/ui/pdv_app_bar_button.dart';

/// **Fechar caixa** — último botão da app bar, encostado na borda direita.
///
/// Montado pelo `PdvAppBarChrome`, então aparece em toda tela sem que cada uma
/// precise pedir. Sai da tela quando **não há turno aberto**: oferecer o
/// fechamento de um caixa que não está aberto é botão que só sabe dar erro.
class PdvCloseShiftAction extends ConsumerWidget {
  const PdvCloseShiftAction({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final CashShift? shift = ref.watch(cashShiftProvider);
    if (shift == null || !shift.isOpen) {
      return const SizedBox.shrink();
    }

    // Só o ícone: o nome vive no tooltip. Numa barra que já carrega Voltar,
    // cliente e loja, mais um rótulo comprido empurraria os outros para fora.
    return PdvAppBarButton(
      icon: Icons.exit_to_app,
      tooltip: 'Fechar caixa',
      iconSize: PdvSizes.iconLg,
      horizontalPadding: PdvSpacing.lg,
      onPressed: () => context.push(PdvRoutes.cashClose),
    );
  }
}
