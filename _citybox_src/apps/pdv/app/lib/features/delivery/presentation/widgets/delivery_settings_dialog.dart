import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/delivery/application/delivery_orders_controller.dart';
import 'package:citybox_pdv/ui/pdv_dialog.dart';

/// Configurações dos pedidos: como a lista é exibida.
///
/// Devolve o modo escolhido, ou `null` se o operador cancelou. A escolha só
/// vale ao **Salvar** — trocar o modo no clique aplicaria a mudança por trás
/// do diálogo ainda aberto, e o Cancelar não teria o que desfazer.
Future<DeliveryViewMode?> showDeliverySettingsDialog(
  BuildContext context, {
  required DeliveryViewMode current,
}) {
  return showDialog<DeliveryViewMode>(
    context: context,
    builder: (BuildContext ctx) => _SettingsDialog(current: current),
  );
}

class _SettingsDialog extends StatefulWidget {
  const _SettingsDialog({required this.current});

  final DeliveryViewMode current;

  @override
  State<_SettingsDialog> createState() => _SettingsDialogState();
}

class _SettingsDialogState extends State<_SettingsDialog> {
  late DeliveryViewMode _mode = widget.current;

  @override
  Widget build(BuildContext context) {
    return CallbackShortcuts(
      bindings: <ShortcutActivator, VoidCallback>{
        const SingleActivator(LogicalKeyboardKey.enter):
            () => Navigator.pop(context, _mode),
        const SingleActivator(LogicalKeyboardKey.escape):
            () => Navigator.pop(context),
      },
      child: Focus(
        autofocus: true,
        child: AlertDialog(
          title: Row(
            children: <Widget>[
              const Icon(Icons.settings, size: PdvSizes.iconMd),
              const SizedBox(width: PdvSpacing.sm),
              Expanded(
                child: Text(
                  'Configurações dos pedidos',
                  style: PdvTypography.headingMd,
                ),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close, size: PdvSizes.iconMd),
                color: PdvColors.textSecondary,
                tooltip: 'Fechar',
              ),
            ],
          ),
          content: PdvDialogBody(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Text(
                  'Modo de exibição',
                  style: PdvTypography.label.copyWith(
                    color: PdvColors.textSecondary,
                  ),
                ),
                const SizedBox(height: PdvSpacing.md),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: <Widget>[
                    for (final DeliveryViewMode mode in DeliveryViewMode.values)
                      _ModeButton(
                        mode: mode,
                        selected: mode == _mode,
                        onPressed: () => setState(() => _mode = mode),
                      ),
                  ],
                ),
              ],
            ),
          ),
          actionsPadding: EdgeInsets.zero,
          actions: <Widget>[
            Row(
              children: <Widget>[
                Expanded(
                  child: TextButton(
                    style: TextButton.styleFrom(
                      minimumSize: const Size.fromHeight(
                        PdvSizes.controlHeightLg,
                      ),
                      shape: const RoundedRectangleBorder(),
                    ),
                    onPressed: () => Navigator.pop(context),
                    child: Text(
                      'CANCELAR (ESC)',
                      style: PdvTypography.label.copyWith(
                        color: PdvColors.textPrimary,
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: PdvColors.success,
                      foregroundColor: PdvColors.background,
                      minimumSize: const Size.fromHeight(
                        PdvSizes.controlHeightLg,
                      ),
                      shape: const RoundedRectangleBorder(),
                    ),
                    onPressed: () => Navigator.pop(context, _mode),
                    child: const Text('SALVAR (ENTER)'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ModeButton extends StatelessWidget {
  const _ModeButton({
    required this.mode,
    required this.selected,
    required this.onPressed,
  });

  final DeliveryViewMode mode;
  final bool selected;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final IconData icon = switch (mode) {
      DeliveryViewMode.table => Icons.table_rows,
      DeliveryViewMode.cards => Icons.view_module,
      DeliveryViewMode.kanban => Icons.view_column,
    };

    return Material(
      color: selected ? PdvColors.surfaceMuted : Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: PdvSpacing.lg,
            vertical: PdvSpacing.md,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Text(
                mode.label.toUpperCase(),
                style: PdvTypography.label.copyWith(
                  color:
                      selected ? PdvColors.textPrimary : PdvColors.textDisabled,
                ),
              ),
              const SizedBox(width: PdvSpacing.sm),
              Icon(
                icon,
                size: PdvSizes.iconMd,
                color:
                    selected ? PdvColors.textPrimary : PdvColors.textDisabled,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
