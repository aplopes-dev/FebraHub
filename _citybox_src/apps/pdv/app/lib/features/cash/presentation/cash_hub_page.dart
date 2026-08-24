import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/features/cash/domain/expected_drawer.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';
import 'package:citybox_pdv/ui/pdv_app_bar_button.dart';
import 'package:citybox_pdv/app/shell/pdv_app_bar_chrome.dart';
import 'package:citybox_pdv/ui/pdv_dialog.dart';
import 'package:citybox_pdv/ui/pdv_empty_state.dart';
import 'package:citybox_pdv/ui/pdv_money_field.dart';
import 'package:citybox_pdv/ui/pdv_form_section.dart';

class CashHubPage extends ConsumerStatefulWidget {
  const CashHubPage({super.key, this.intentOpen = false});

  final bool intentOpen;

  @override
  ConsumerState<CashHubPage> createState() => _CashHubPageState();
}

class _CashHubPageState extends ConsumerState<CashHubPage> {
  bool _prompted = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || _prompted || !widget.intentOpen) {
        return;
      }
      final CashShift? shift = ref.read(cashShiftProvider);
      if (shift == null || !shift.isOpen) {
        _prompted = true;
        // ignore: discarded_futures
        openCashShiftDialog(context, ref);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final CashShift? shift = ref.watch(cashShiftProvider);
    final bool open = shift != null && shift.isOpen;

    return PdvScaffold(
      appBar: PdvAppBarChrome(
        child: Row(
          children: <Widget>[
            PdvAppBarButton(
              icon: Icons.arrow_back,
              label: 'Voltar',
              onPressed: () => context.go(PdvRoutes.home),
            ),
          ],
        ),
      ),
      body:
          open
              ? PdvFormFrame(child: _OpenShiftBody(shift: shift))
              : PdvFormFrame(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    const Expanded(
                      child: PdvEmptyState(
                        title: 'Nenhum turno aberto',
                        subtitle:
                            'Abra o caixa com o fundo de troco para operar o PDV.',
                      ),
                    ),
                    SizedBox(
                      height: PdvSizes.controlHeightLg,
                      child: FilledButton.icon(
                        onPressed: () => openCashShiftDialog(context, ref),
                        icon: const Icon(
                          Icons.lock_open,
                          size: PdvSizes.iconMd,
                        ),
                        label: const Text('Abrir caixa'),
                      ),
                    ),
                  ],
                ),
              ),
    );
  }
}

class _OpenShiftBody extends ConsumerWidget {
  const _OpenShiftBody({required this.shift});

  final CashShift shift;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final int expected = expectedDrawerCents(shift);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Text('Turno aberto', style: PdvTypography.headingLg),
        const SizedBox(height: PdvSpacing.xl),
        Row(
          children: <Widget>[
            Expanded(
              child: PdvStatCard(
                label: 'Esperado em gaveta',
                value: formatCents(expected),
                emphasized: true,
              ),
            ),
            const SizedBox(width: PdvSpacing.md),
            Expanded(
              child: PdvStatCard(
                label: 'Fundo de abertura',
                value: formatCents(shift.openingFloatCents),
              ),
            ),
          ],
        ),
        const SizedBox(height: PdvSpacing.md),
        Row(
          children: <Widget>[
            Expanded(
              child: PdvStatCard(
                label: 'Vendas do turno',
                value: '${shift.sales.length}',
              ),
            ),
            const SizedBox(width: PdvSpacing.md),
            Expanded(
              child: PdvStatCard(
                label: 'Movimentos',
                value: '${shift.movements.length}',
              ),
            ),
          ],
        ),
        const Spacer(),
        SizedBox(
          height: PdvSizes.controlHeightLg,
          child: FilledButton.icon(
            onPressed: () => context.push(PdvRoutes.cashMovement),
            icon: const Icon(Icons.work_outline, size: PdvSizes.iconMd),
            label: const Text('Sangria / reforço'),
          ),
        ),
        const SizedBox(height: PdvSpacing.md),
        SizedBox(
          height: PdvSizes.controlHeight,
          child: OutlinedButton.icon(
            // Uma porta só para fechar o caixa: a tela de fechamento confere
            // os cinco canais, e um diálogo aqui que pedisse só o dinheiro
            // fecharia o mesmo turno por um caminho mais fraco.
            onPressed: () => context.push(PdvRoutes.cashClose),
            icon: const Icon(Icons.lock, size: PdvSizes.iconMd),
            label: const Text('Fechar caixa'),
          ),
        ),
      ],
    );
  }
}

Future<void> openCashShiftDialog(BuildContext context, WidgetRef ref) async {
  // O turno abre em nome de **quem está logado**. Não há seletor: escolher o
  // operador aqui contradiria a tela de login que acabou de acontecer, e
  // abriria caminho para o caixa abrir turno no nome de outra pessoa.
  final PosOperator? operator = ref.read(operatorSessionProvider);
  if (operator == null) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Entre com o seu PIN antes de abrir o caixa.'),
      ),
    );
    return;
  }

  final int? floatCents = await showDialog<int>(
    context: context,
    builder: (BuildContext ctx) => _OpenShiftDialog(operator: operator),
  );
  if (floatCents == null || !context.mounted) {
    return;
  }
  try {
    await ref
        .read(cashShiftProvider.notifier)
        .openShift(openingFloatCents: floatCents, operator: operator);
  } on Object catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }
}

/// Abertura de caixa: confirma quem abre e pergunta o fundo de troco.
class _OpenShiftDialog extends StatefulWidget {
  const _OpenShiftDialog({required this.operator});

  final PosOperator operator;

  @override
  State<_OpenShiftDialog> createState() => _OpenShiftDialogState();
}

class _OpenShiftDialogState extends State<_OpenShiftDialog> {
  final TextEditingController _float = TextEditingController();

  @override
  void dispose() {
    _float.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Abrir caixa'),
      content: PdvDialogBody(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            // Quem abre aparece, mas não se escolhe: o turno inteiro vai ser
            // carimbado com este nome, e o operador tem que ver isso antes.
            Text(
              'Operador: ${widget.operator.label}',
              style: PdvTypography.bodyLg.copyWith(
                color: PdvColors.textSecondary,
              ),
            ),
            const SizedBox(height: PdvSpacing.lg),
            PdvMoneyField(
              label: 'Fundo de troco',
              controller: _float,
              autofocus: true,
            ),
          ],
        ),
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed:
              () => Navigator.pop(context, PdvMoneyField.centsOf(_float)),
          child: const Text('Abrir'),
        ),
      ],
    );
  }
}
