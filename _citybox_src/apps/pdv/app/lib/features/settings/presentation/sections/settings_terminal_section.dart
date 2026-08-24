import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/settings/application/terminal_settings_controller.dart';
import 'package:citybox_pdv/features/settings/domain/terminal_settings.dart';
import 'package:citybox_pdv/features/settings/presentation/sections/settings_section_shell.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/features/terminal/domain/device_credential.dart';
import 'package:citybox_pdv/ui/pdv_dialog.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';

/// Preferências locais deste caixa. Não alteram o ERP.
class SettingsTerminalSection extends ConsumerWidget {
  const SettingsTerminalSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final TerminalSettings settings = ref.watch(terminalSettingsProvider);
    final TerminalSettingsController controller = ref.read(
      terminalSettingsProvider.notifier,
    );
    final DeviceCredential? credential = ref.watch(deviceCredentialProvider);

    return SettingsSectionShell(
      groupLabel: 'Preferências locais — não alteram o ERP',
      children: <Widget>[
        // Terminal pareado: a identificação **vem do ERP** e é só leitura.
        // Deixá-la editável faria o nome na tela divergir do que o gerente vê
        // na hora de revogar o dispositivo — exatamente quando precisa acertar.
        if (credential != null) ...<Widget>[
          SettingsInfoRow(
            label: 'Identificação',
            value: credential.terminalName,
          ),
          const SizedBox(height: PdvSpacing.md),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: () => _confirmForget(context, ref, credential),
              icon: const Icon(Icons.link_off, size: PdvSizes.iconMd),
              label: Text(
                'DESATIVAR TERMINAL',
                style: PdvTypography.label.copyWith(color: PdvColors.danger),
              ),
              style: TextButton.styleFrom(foregroundColor: PdvColors.danger),
            ),
          ),
        ] else
          TextFormField(
            key: const ValueKey<String>('settings-terminal-label'),
            initialValue: settings.terminalLabel,
            style: PdvTypography.bodyLg.copyWith(color: PdvColors.textPrimary),
            decoration: pdvFilledDecoration(label: 'Identificação'),
            onChanged:
                (String v) =>
                    controller.update(settings.copyWith(terminalLabel: v)),
          ),
        const SizedBox(height: PdvSpacing.lg),
        TextFormField(
          key: const ValueKey<String>('settings-printer'),
          initialValue: settings.printerName ?? '',
          style: PdvTypography.bodyLg.copyWith(color: PdvColors.textPrimary),
          decoration: pdvFilledDecoration(label: 'Impressora'),
          onChanged:
              (String v) => controller.update(
                settings.copyWith(
                  printerName: v.isEmpty ? null : v,
                  clearPrinterName: v.isEmpty,
                ),
              ),
        ),
        const SizedBox(height: PdvSpacing.md),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: Text('Gaveta habilitada', style: PdvTypography.bodyLg),
          value: settings.cashDrawerEnabled,
          onChanged:
              (bool v) =>
                  controller.update(settings.copyWith(cashDrawerEnabled: v)),
        ),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: Text('Balança habilitada', style: PdvTypography.bodyLg),
          value: settings.scaleEnabled,
          onChanged:
              (bool v) => controller.update(settings.copyWith(scaleEnabled: v)),
        ),
      ],
    );
  }
}

/// Desativar é apagar a credencial **deste dispositivo** — não revoga no ERP.
///
/// Confirmação pesada de propósito: o caminho de volta exige um código novo
/// gerado por gerente, e quem clica sem querer fica sem operar até alguém com
/// acesso ao ERP aparecer.
Future<void> _confirmForget(
  BuildContext context,
  WidgetRef ref,
  DeviceCredential credential,
) async {
  final bool? confirmed = await showDialog<bool>(
    context: context,
    builder: (BuildContext ctx) {
      return AlertDialog(
        title: const Text('Desativar terminal?'),
        content: PdvDialogBody(
          child: Text(
            'Este dispositivo deixa de ser o ${credential.terminalName} e '
            'volta para a tela de ativação.\n\n'
            'Para voltar a operar será preciso um código novo, gerado no ERP.',
            style: PdvTypography.bodyLg,
          ),
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: PdvColors.danger,
              foregroundColor: PdvColors.background,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Desativar'),
          ),
        ],
      );
    },
  );
  if (confirmed != true) return;
  await ref.read(deviceCredentialProvider.notifier).forget();
}
