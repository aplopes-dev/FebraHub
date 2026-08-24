import 'package:flutter/material.dart';
import 'package:window_manager/window_manager.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';

/// Minimizar, maximizar/restaurar e fechar.
///
/// Ao esconder a decoração do sistema, estes botões passam a ser
/// responsabilidade nossa — sem eles a janela só fecha pelo gerenciador de
/// tarefas. São mais largos que altos, seguindo a convenção de desktop, e o
/// fechar acende em vermelho no hover para não ser tocado por engano.
class WindowControls extends StatefulWidget {
  const WindowControls({super.key});

  @override
  State<WindowControls> createState() => _WindowControlsState();
}

class _WindowControlsState extends State<WindowControls> with WindowListener {
  bool _isMaximized = false;

  @override
  void initState() {
    super.initState();
    windowManager.addListener(this);
    _syncMaximizedState();
  }

  @override
  void dispose() {
    windowManager.removeListener(this);
    super.dispose();
  }

  // A janela também é maximizada por duplo clique na barra e por atalho do
  // sistema. Ouvir os eventos mantém o ícone coerente com o estado real.
  @override
  void onWindowMaximize() => setState(() => _isMaximized = true);

  @override
  void onWindowUnmaximize() => setState(() => _isMaximized = false);

  Future<void> _syncMaximizedState() async {
    final bool maximized = await windowManager.isMaximized();
    if (mounted) {
      setState(() => _isMaximized = maximized);
    }
  }

  Future<void> _toggleMaximize() async {
    if (await windowManager.isMaximized()) {
      await windowManager.unmaximize();
    } else {
      await windowManager.maximize();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        _WindowButton(
          icon: Icons.remove,
          tooltip: 'Minimizar',
          onPressed: windowManager.minimize,
        ),
        _WindowButton(
          icon:
              _isMaximized
                  ? Icons.filter_none_outlined
                  : Icons.crop_square_outlined,
          tooltip: _isMaximized ? 'Restaurar' : 'Maximizar',
          onPressed: _toggleMaximize,
        ),
        _WindowButton(
          icon: Icons.close,
          tooltip: 'Fechar',
          isDangerous: true,
          onPressed: windowManager.close,
        ),
      ],
    );
  }
}

class _WindowButton extends StatelessWidget {
  const _WindowButton({
    required this.icon,
    required this.tooltip,
    required this.onPressed,
    this.isDangerous = false,
  });

  final IconData icon;
  final String tooltip;
  final Future<void> Function() onPressed;
  final bool isDangerous;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: SizedBox(
        width: 40,
        height: PdvSizes.titleBarHeight,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onPressed,
            hoverColor:
                isDangerous
                    ? PdvTitleBarColors.closeHover
                    : PdvTitleBarColors.hover,
            child: Icon(
              icon,
              size: PdvSizes.iconSm,
              color: PdvTitleBarColors.foregroundMuted,
            ),
          ),
        ),
      ),
    );
  }
}
