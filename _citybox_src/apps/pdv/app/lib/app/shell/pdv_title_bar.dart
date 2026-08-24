import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:window_manager/window_manager.dart';

import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/app/shell/widgets/title_bar_brand.dart';
import 'package:citybox_pdv/app/shell/widgets/title_bar_status.dart';
import 'package:citybox_pdv/app/shell/widgets/window_controls.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';

/// Barra de título do PDV no desktop.
///
/// Substitui a decoração do sistema por uma faixa única que junta a identidade
/// do app, o relógio, a tela ativa e a saúde dos canais de venda. Uma barra só,
/// e não duas empilhadas, porque num caixa cada pixel de altura é linha de
/// item que cabe na tela.
///
/// **Só existe no desktop.** No Android o sistema já entrega barra de status e
/// não há janela para decorar — quem decide isso é `PdvShell`, não este widget.
///
/// A faixa inteira arrasta a janela (`DragToMoveArea`); os blocos interativos
/// ficam por cima e continuam clicáveis normalmente.
class PdvTitleBar extends ConsumerWidget implements PreferredSizeWidget {
  const PdvTitleBar({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(PdvSizes.titleBarHeight);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // O título vem da rota, não de quem navegou até aqui. `maybeOf` porque a
    // barra também monta sob páginas empurradas pelo `Navigator`, fora das
    // rotas do go_router — nesse caso o override é quem responde.
    final String? override = ref.watch(pageTitleOverrideProvider);
    final GoRouter? router = GoRouter.maybeOf(context);
    final String pageTitle =
        override ??
        pdvPageTitleForLocation(router?.state.uri.path ?? PdvRoutes.home);

    return DragToMoveArea(
      child: GestureDetector(
        // Duplo clique na barra maximiza — comportamento que o usuário espera
        // de qualquer janela e que se perde ao trocar a decoração nativa.
        onDoubleTap: _toggleMaximize,
        child: DecoratedBox(
          decoration: const BoxDecoration(
            color: PdvTitleBarColors.background,
            border: Border(bottom: BorderSide(color: PdvTitleBarColors.border)),
          ),
          child: SizedBox(
            height: PdvSizes.titleBarHeight,
            child: Row(
              children: <Widget>[
                const SizedBox(width: PdvSpacing.lg),
                const TitleBarBrand(),

                // O título ocupa o vão entre os dois blocos, não o centro exato
                // da janela. Centrar de verdade exigiria um `Stack`, e aí o
                // texto passaria por baixo do bloco de status quando a janela
                // encolhesse — trocar sobreposição por alguns pixels de desvio
                // é mau negócio numa barra que precisa ser legível sempre.
                Expanded(
                  child: Center(
                    child: Text(
                      pageTitle,
                      style: PdvTypography.label.copyWith(
                        color: PdvTitleBarColors.foreground,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),

                const TitleBarStatus(),
                const SizedBox(width: PdvSpacing.md),
                const WindowControls(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  static Future<void> _toggleMaximize() async {
    if (await windowManager.isMaximized()) {
      await windowManager.unmaximize();
    } else {
      await windowManager.maximize();
    }
  }
}
