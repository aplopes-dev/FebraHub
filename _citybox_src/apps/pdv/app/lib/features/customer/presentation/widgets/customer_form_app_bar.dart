import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/ui/pdv_app_bar_button.dart';
import 'package:citybox_pdv/app/shell/pdv_app_bar_chrome.dart';
import 'package:citybox_pdv/ui/pdv_app_bar_filled_button.dart';

/// App bar da tela de cadastrar/consultar cliente.
class CustomerFormAppBar extends StatelessWidget {
  const CustomerFormAppBar({
    required this.isEditing,
    required this.onBack,
    required this.onSave,
    required this.onSaveAndSelect,
    this.readOnly = false,
    this.saving = false,
    super.key,
  });

  final bool isEditing;
  final bool readOnly;
  final bool saving;
  final VoidCallback onBack;
  final VoidCallback onSave;
  final VoidCallback onSaveAndSelect;

  @override
  Widget build(BuildContext context) {
    final String title =
        readOnly
            ? 'Consultar cliente'
            : (isEditing ? 'Editar cliente' : 'Cadastrar cliente');

    return PdvAppBarChrome(
      child: Row(
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.only(left: PdvSpacing.lg),
            child: PdvAppBarButton(
              icon: Icons.chevron_left,
              label: 'Voltar',
              iconSize: PdvSizes.iconLg,
              horizontalPadding: PdvSpacing.lg,
              onPressed: onBack,
            ),
          ),
          const _AppBarSeparator(),
          Expanded(
            child: Text(
              title.toUpperCase(),
              style: PdvTypography.label.copyWith(
                color: PdvAppBarColors.foreground,
              ),
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
            ),
          ),
          if (!readOnly) ...<Widget>[
            PdvAppBarFilledButton(
              label: saving ? 'Salvando…' : 'Salvar',
              backgroundColor: PdvAppBarColors.hover,
              foregroundColor: PdvAppBarColors.foreground,
              onPressed: saving ? () {} : onSave,
            ),
            PdvAppBarFilledButton(
              label: saving ? 'Salvando…' : 'Salvar e selecionar',
              backgroundColor: PdvColors.success,
              foregroundColor: PdvCounterColors.onPayment,
              onPressed: saving ? () {} : onSaveAndSelect,
            ),
          ],
        ],
      ),
    );
  }
}

class _AppBarSeparator extends StatelessWidget {
  const _AppBarSeparator();

  @override
  Widget build(BuildContext context) {
    return const VerticalDivider(
      width: PdvSpacing.lg,
      thickness: PdvSizes.borderWidthFocus,
      color: PdvAppBarColors.separator,
    );
  }
}
