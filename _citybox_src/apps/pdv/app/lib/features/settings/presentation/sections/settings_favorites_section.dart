import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/home/data/home_actions.dart';
import 'package:citybox_pdv/features/home/domain/home_action.dart';
import 'package:citybox_pdv/features/settings/application/terminal_settings_controller.dart';
import 'package:citybox_pdv/features/settings/domain/terminal_settings.dart';
import 'package:citybox_pdv/features/settings/presentation/sections/settings_section_shell.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';

/// Quais ações ocupam cada posição da grade da tela inicial.
///
/// Duas colunas de três linhas, na mesma ordem em que a grade desenha — o que
/// se escolhe aqui é literalmente onde o bloco vai aparecer.
class SettingsFavoritesSection extends ConsumerWidget {
  const SettingsFavoritesSection({super.key});

  static const List<String> _rowLabels = <String>[
    'Primeira linha',
    'Segunda linha',
    'Terceira linha',
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final TerminalSettings settings = ref.watch(terminalSettingsProvider);
    final TerminalSettingsController controller = ref.read(
      terminalSettingsProvider.notifier,
    );
    final bool enabled = settings.useHomeFavorites;

    void setSlot(int index, String? actionId) {
      final List<String?> next = <String?>[...settings.homeFavorites];
      // A mesma ação em duas posições desenharia o bloco duas vezes e sumiria
      // com outra: escolher uma que já está em uso a remove de onde estava.
      for (int i = 0; i < next.length; i++) {
        if (actionId != null && next[i] == actionId) next[i] = null;
      }
      next[index] = actionId;
      controller.update(settings.copyWith(homeFavorites: next));
    }

    return SettingsSectionShell(
      groupLabel: 'Geral',
      children: <Widget>[
        SettingsCheckRow(
          label: 'Usar a nova tela inicial',
          description: 'Você pode personalizar seus botões favoritos.',
          value: enabled,
          onChanged:
              (bool value) =>
                  controller.update(settings.copyWith(useHomeFavorites: value)),
        ),
        const SizedBox(height: PdvSpacing.xl),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Expanded(
              child: _FavoriteColumn(
                title: 'Primeira coluna',
                rowLabels: _rowLabels,
                slotOffset: 0,
                favorites: settings.homeFavorites,
                enabled: enabled,
                onChanged: setSlot,
              ),
            ),
            const SizedBox(width: PdvSpacing.xxl),
            Expanded(
              child: _FavoriteColumn(
                title: 'Segunda coluna',
                rowLabels: _rowLabels,
                slotOffset: 3,
                favorites: settings.homeFavorites,
                enabled: enabled,
                onChanged: setSlot,
              ),
            ),
          ],
        ),
        const SizedBox(height: PdvSpacing.xl),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed:
                enabled
                    ? () => controller.update(
                      settings.copyWith(homeFavorites: defaultHomeFavorites),
                    )
                    : null,
            child: Text(
              'RESTAURAR FAVORITOS PADRÃO',
              style: PdvTypography.label.copyWith(
                color: enabled ? PdvColors.textPrimary : PdvColors.textDisabled,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _FavoriteColumn extends StatelessWidget {
  const _FavoriteColumn({
    required this.title,
    required this.rowLabels,
    required this.slotOffset,
    required this.favorites,
    required this.enabled,
    required this.onChanged,
  });

  final String title;
  final List<String> rowLabels;

  /// Índice da primeira posição desta coluna em `homeFavorites`.
  final int slotOffset;

  final List<String?> favorites;
  final bool enabled;
  final void Function(int slot, String? actionId) onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          title,
          style: PdvTypography.bodyMd.copyWith(color: PdvColors.textSecondary),
        ),
        const SizedBox(height: PdvSpacing.md),
        for (int row = 0; row < rowLabels.length; row++) ...<Widget>[
          _FavoriteSlot(
            label: rowLabels[row],
            value: favorites[slotOffset + row],
            enabled: enabled,
            onChanged: (String? id) => onChanged(slotOffset + row, id),
          ),
          const SizedBox(height: PdvSpacing.lg),
        ],
      ],
    );
  }
}

class _FavoriteSlot extends StatelessWidget {
  const _FavoriteSlot({
    required this.label,
    required this.value,
    required this.enabled,
    required this.onChanged,
  });

  final String label;
  final String? value;
  final bool enabled;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return InputDecorator(
      decoration: pdvFilledDecoration(label: label),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String?>(
          value: value,
          isDense: true,
          isExpanded: true,
          dropdownColor: PdvColors.surface,
          style: PdvTypography.bodyLg.copyWith(color: PdvColors.textPrimary),
          onChanged: enabled ? onChanged : null,
          items: <DropdownMenuItem<String?>>[
            // "Vazia" é escolha, não ausência: uma grade com cinco blocos é
            // legítima, e sem esta opção não haveria como chegar nela.
            DropdownMenuItem<String?>(
              child: Text(
                'Vazia',
                style: PdvTypography.bodyLg.copyWith(
                  color: PdvColors.textDisabled,
                ),
              ),
            ),
            for (final HomeAction action in homeActions)
              DropdownMenuItem<String?>(
                value: action.id,
                child: Text(action.label),
              ),
          ],
        ),
      ),
    );
  }
}
