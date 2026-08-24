import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';

/// Moldura comum das seções: título do grupo e respiro.
///
/// Existe para as cinco não divergirem no padding — é o tipo de diferença que
/// só aparece quando se alterna entre elas, e aí já tem cinco lugares para
/// acertar.
class SettingsSectionShell extends StatelessWidget {
  const SettingsSectionShell({
    required this.groupLabel,
    required this.children,
    super.key,
  });

  final String groupLabel;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(PdvSpacing.xl),
      children: <Widget>[
        Text(
          groupLabel,
          style: PdvTypography.bodyMd.copyWith(color: PdvColors.textSecondary),
        ),
        const SizedBox(height: PdvSpacing.lg),
        ...children,
      ],
    );
  }
}

/// Linha de rótulo + valor das seções só de leitura.
class SettingsInfoRow extends StatelessWidget {
  const SettingsInfoRow({required this.label, required this.value, super.key});

  final String label;

  /// Já formatado. `null` vira traço — campo sem valor é diferente de campo
  /// com valor vazio.
  final String? value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: PdvSpacing.xl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(label, style: PdvTypography.headingSm),
          const SizedBox(height: PdvSpacing.xs),
          Text(
            value ?? '—',
            style: PdvTypography.bodyMd.copyWith(
              color:
                  value == null
                      ? PdvColors.textDisabled
                      : PdvColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

/// Preferência ligada/desligada, com explicação abaixo do rótulo.
class SettingsCheckRow extends StatelessWidget {
  const SettingsCheckRow({
    required this.label,
    required this.description,
    required this.value,
    required this.onChanged,
    super.key,
  });

  final String label;
  final String description;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onChanged(!value),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: PdvSpacing.sm),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Checkbox(
              value: value,
              onChanged: (bool? next) => onChanged(next ?? false),
            ),
            const SizedBox(width: PdvSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(label, style: PdvTypography.headingSm),
                  const SizedBox(height: PdvSpacing.xxs),
                  Text(
                    description,
                    style: PdvTypography.bodyMd.copyWith(
                      color: PdvColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// `dd/MM/yyyy HH:mm` + quanto tempo faz — o mesmo par da referência.
///
/// O "há 6 horas" é o que o operador realmente lê; a data exata é a
/// conferência. Mostrar só uma das duas troca uma pergunta por outra.
String formatSettingsDateTime(DateTime value, {DateTime? now}) {
  final DateTime local = value.toLocal();
  final String d = local.day.toString().padLeft(2, '0');
  final String m = local.month.toString().padLeft(2, '0');
  final String h = local.hour.toString().padLeft(2, '0');
  final String min = local.minute.toString().padLeft(2, '0');
  final String stamp = '$d/$m/${local.year} $h:$min';
  return '$stamp · ${formatElapsed(local, now: now)}';
}

/// "agora", "há 6 horas", "há 3 dias".
String formatElapsed(DateTime value, {DateTime? now}) {
  final Duration elapsed = (now ?? DateTime.now()).difference(value);
  if (elapsed.inMinutes < 1) return 'agora';
  if (elapsed.inMinutes < 60) return 'há ${elapsed.inMinutes} min';
  if (elapsed.inHours < 24) {
    return 'há ${elapsed.inHours} ${elapsed.inHours == 1 ? 'hora' : 'horas'}';
  }
  return 'há ${elapsed.inDays} ${elapsed.inDays == 1 ? 'dia' : 'dias'}';
}

/// Fundo de abertura formatado.
String formatSettingsFloat(int cents) => formatCents(cents);
