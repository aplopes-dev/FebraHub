import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/settings/application/terminal_settings_controller.dart';
import 'package:citybox_pdv/features/settings/domain/terminal_settings.dart';
import 'package:citybox_pdv/features/settings/presentation/sections/settings_section_shell.dart';

/// Ajustes para terminal com tela sensível ao toque.
class SettingsTouchSection extends ConsumerWidget {
  const SettingsTouchSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final TerminalSettings settings = ref.watch(terminalSettingsProvider);

    return SettingsSectionShell(
      groupLabel: 'Geral',
      children: <Widget>[
        SettingsCheckRow(
          label: 'Aumentar o tamanho da barra de rolagem',
          description:
              'Isso pode facilitar o seu manuseio quando está em telas touch '
              'screen.',
          value: settings.largeScrollbars,
          onChanged:
              (bool value) => ref
                  .read(terminalSettingsProvider.notifier)
                  .update(settings.copyWith(largeScrollbars: value)),
        ),
      ],
    );
  }
}
