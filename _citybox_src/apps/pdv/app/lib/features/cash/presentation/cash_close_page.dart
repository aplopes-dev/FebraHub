import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/app/shell/pdv_app_bar_chrome.dart';
import 'package:citybox_pdv/app/shell/pdv_back.dart';
import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/data/pos_cash_session_api.dart';
import 'package:citybox_pdv/features/cash/domain/cash_close_channel.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/features/settings/application/terminal_settings_controller.dart';
import 'package:citybox_pdv/ui/pdv_app_bar_button.dart';
import 'package:citybox_pdv/ui/pdv_dialog.dart';
import 'package:citybox_pdv/ui/pdv_money_field.dart';

/// Fechamento de caixa: o operador declara o que contou em cada canal.
///
/// Os valores **não** vêm preenchidos com o esperado, e o esperado não aparece
/// ao lado dos campos: a conferência serve para pegar divergência, e um campo
/// já preenchido com a resposta certa vira um "Enter" — o operador confirmaria
/// sem contar. O confronto sai depois, no resumo.
class CashClosePage extends ConsumerStatefulWidget {
  const CashClosePage({super.key});

  @override
  ConsumerState<CashClosePage> createState() => _CashClosePageState();
}

class _CashClosePageState extends ConsumerState<CashClosePage> {
  final Map<CashCloseChannel, TextEditingController> _fields =
      <CashCloseChannel, TextEditingController>{
        for (final CashCloseChannel channel in CashCloseChannel.values)
          channel: TextEditingController(),
      };

  @override
  void dispose() {
    for (final TextEditingController controller in _fields.values) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final String terminalLabel =
        ref.watch(terminalSettingsProvider).terminalLabel;

    return CallbackShortcuts(
      bindings: <ShortcutActivator, VoidCallback>{
        const SingleActivator(LogicalKeyboardKey.escape, shift: true):
            () => popOrHome(context),
      },
      child: Focus(
        autofocus: true,
        child: PdvScaffold(
          contentPadding: EdgeInsets.zero,
          appBar: PdvAppBarChrome(
            // Já se está fechando o caixa: o atalho para cá não se repete.
            showCloseShift: false,
            child: Row(
              children: <Widget>[
                PdvAppBarButton(
                  icon: Icons.chevron_left,
                  label: 'Voltar',
                  secondaryLabel: '(Shift + Esc)',
                  tooltip: 'Voltar (Shift + Esc)',
                  iconSize: PdvSizes.iconLg,
                  onPressed: () => popOrHome(context),
                ),
                const _ToolbarSeparator(),
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: PdvSpacing.lg,
                  ),
                  child: Text(
                    terminalLabel,
                    style: PdvTypography.headingSm.copyWith(
                      color: PdvAppBarColors.foreground,
                    ),
                  ),
                ),
              ],
            ),
          ),
          body: ListView(
            padding: const EdgeInsets.all(PdvSpacing.xl),
            children: <Widget>[
              Row(
                children: <Widget>[
                  const Icon(
                    Icons.exit_to_app,
                    size: PdvSizes.iconLg,
                    color: PdvColors.info,
                  ),
                  const SizedBox(width: PdvSpacing.md),
                  Text(
                    'Fechamento de caixa',
                    style: PdvTypography.headingLg.copyWith(
                      color: PdvColors.info,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: PdvSpacing.xs),
              Text(
                'Informe os valores',
                style: PdvTypography.label.copyWith(color: PdvColors.info),
              ),
              const SizedBox(height: PdvSpacing.xl),
              // Dinheiro sozinho na primeira linha: é o único canal que a
              // gaveta guarda de verdade, e o único que o turno consegue
              // conferir contra fundo, sangrias e reforços.
              PdvMoneyField(
                label: CashCloseChannel.cash.label,
                controller: _fields[CashCloseChannel.cash]!,
                autofocus: true,
              ),
              const SizedBox(height: PdvSpacing.lg),
              _FieldRow(
                left: CashCloseChannel.credit,
                right: CashCloseChannel.debit,
                fields: _fields,
              ),
              const SizedBox(height: PdvSpacing.lg),
              _FieldRow(
                left: CashCloseChannel.voucher,
                right: CashCloseChannel.other,
                fields: _fields,
              ),
              const SizedBox(height: PdvSpacing.xxl),
              SizedBox(
                height: PdvSizes.controlHeightLg,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: PdvColors.info,
                    foregroundColor: PdvColors.background,
                  ),
                  onPressed: _submit,
                  child: Text('FECHAR CAIXA', style: PdvTypography.label),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    final CashShift? shift = ref.read(cashShiftProvider);
    if (shift == null || !shift.isOpen) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Não há turno aberto para fechar.')),
      );
      return;
    }

    // Lidos **antes** de fechar: o turno sai do estado no fechamento, e depois
    // não haveria mais de onde tirar o esperado.
    final Map<CashCloseChannel, int> expected = expectedByChannel(shift);
    final Map<CashCloseChannel, int> counted = <CashCloseChannel, int>{
      for (final CashCloseChannel channel in CashCloseChannel.values)
        channel: PdvMoneyField.centsOf(_fields[channel]!),
    };

    try {
      await ref.read(cashShiftProvider.notifier).closeShift(
        counts: CashCloseCounts(
          countedCashCents: counted[CashCloseChannel.cash]!,
          countedCreditCents: counted[CashCloseChannel.credit]!,
          countedDebitCents: counted[CashCloseChannel.debit]!,
          countedVoucherCents: counted[CashCloseChannel.voucher]!,
          countedOtherCents: counted[CashCloseChannel.other]!,
        ),
      );
    } on Object catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$e')));
      }
      return;
    }

    if (!mounted) return;
    await showDialog<void>(
      context: context,
      builder:
          (BuildContext ctx) =>
              _CloseSummaryDialog(expected: expected, counted: counted),
    );
    if (!mounted) return;
    context.go(PdvRoutes.home);
  }
}

/// Dois canais lado a lado, como na tela de referência.
class _FieldRow extends StatelessWidget {
  const _FieldRow({
    required this.left,
    required this.right,
    required this.fields,
  });

  final CashCloseChannel left;
  final CashCloseChannel right;
  final Map<CashCloseChannel, TextEditingController> fields;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Expanded(
          child: PdvMoneyField(label: left.label, controller: fields[left]!),
        ),
        const SizedBox(width: PdvSpacing.xxl),
        Expanded(
          child: PdvMoneyField(label: right.label, controller: fields[right]!),
        ),
      ],
    );
  }
}

/// O que a conferência achou, canal a canal.
///
/// É a razão de a tela pedir cinco valores em vez de um: sem este confronto,
/// quatro dos campos seriam digitação jogada fora.
class _CloseSummaryDialog extends StatelessWidget {
  const _CloseSummaryDialog({required this.expected, required this.counted});

  final Map<CashCloseChannel, int> expected;
  final Map<CashCloseChannel, int> counted;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Caixa fechado'),
      content: PdvDialogBody(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            for (final CashCloseChannel channel in CashCloseChannel.values)
              _SummaryRow(
                label: channel.label,
                counted: counted[channel] ?? 0,
                expected: expected[channel] ?? 0,
              ),
          ],
        ),
      ),
      actions: <Widget>[
        FilledButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('OK'),
        ),
      ],
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.counted,
    required this.expected,
  });

  final String label;
  final int counted;
  final int expected;

  @override
  Widget build(BuildContext context) {
    final int difference = counted - expected;
    final bool matches = difference == 0;

    return Padding(
      padding: const EdgeInsets.only(bottom: PdvSpacing.md),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Text(
              label,
              style: PdvTypography.bodyMd.copyWith(
                color: PdvColors.textSecondary,
              ),
            ),
          ),
          Text(
            formatCents(counted),
            style: PdvTypography.bodyLg.copyWith(
              color: PdvColors.textPrimary,
              fontFeatures: PdvTypography.tabular,
            ),
          ),
          const SizedBox(width: PdvSpacing.lg),
          SizedBox(
            width: _differenceColumnWidth,
            child: Text(
              // Sinal explícito: "R$ 5,00" de sobra e "R$ 5,00" de falta são
              // problemas diferentes, e o operador lê a coluna, não a conta.
              matches
                  ? '—'
                  : '${difference > 0 ? '+' : ''}${formatCents(difference)}',
              textAlign: TextAlign.right,
              style: PdvTypography.bodyLg.copyWith(
                color: matches ? PdvColors.textDisabled : PdvColors.warning,
                fontFeatures: PdvTypography.tabular,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Largura da coluna de diferença: cabe "-R$ 1.234,56" sem empurrar o valor
/// conferido de lugar entre uma linha e outra.
const double _differenceColumnWidth = 120;

class _ToolbarSeparator extends StatelessWidget {
  const _ToolbarSeparator();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: PdvSizes.borderWidthFocus,
      height: PdvSizes.appBarHeight,
      color: PdvAppBarColors.separator,
    );
  }
}
