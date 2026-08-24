import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/features/settings/application/terminal_settings_controller.dart';
import 'package:citybox_pdv/features/settings/domain/terminal_settings.dart';
import 'package:citybox_pdv/features/settings/presentation/sections/settings_section_shell.dart';

/// O que está em curso neste terminal agora. Só leitura.
class SettingsSessionSection extends ConsumerWidget {
  const SettingsSessionSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final CashShift? shift = ref.watch(cashShiftProvider);
    final TerminalSettings settings = ref.watch(terminalSettingsProvider);

    return SettingsSectionShell(
      groupLabel: 'Sessão',
      children: <Widget>[
        SettingsInfoRow(label: 'Nome do caixa', value: settings.terminalLabel),
        SettingsInfoRow(
          label: 'Turno',
          // Sem turno é informação, não erro: é o estado normal antes da
          // abertura, e o operador precisa saber que é por isso que Balcão e
          // Pagamento estão bloqueados.
          value: shift == null ? 'Nenhum turno aberto' : 'Aberto',
        ),
        SettingsInfoRow(
          label: 'Data da abertura do caixa',
          value: shift == null ? null : formatSettingsDateTime(shift.openedAt),
        ),
        SettingsInfoRow(
          label: 'Fundo de abertura',
          value:
              shift == null
                  ? null
                  : formatSettingsFloat(shift.openingFloatCents),
        ),
        const SettingsInfoRow(
          label: 'Data da última sincronização',
          // Fixture não mente aqui: não há sincronização no app, e mostrar
          // "31/12/1969" (epoch) como a referência faz seria pior que dizer
          // que ela nunca aconteceu.
          value: null,
        ),
      ],
    );
  }
}
