import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/counter/application/sale_adjustment_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_totals.dart';
import 'package:citybox_pdv/features/counter/domain/sale_adjustment.dart';
import 'package:citybox_pdv/features/operators/application/supervisor_authorization.dart';
import 'package:citybox_pdv/features/policies/application/pos_policy_controller.dart';
import 'package:citybox_pdv/features/policies/domain/pos_policy.dart';
import 'package:citybox_pdv/features/policies/presentation/exception_gate.dart';
import 'package:citybox_pdv/ui/pdv_dialog.dart';
import 'package:citybox_pdv/ui/pdv_money_field.dart';

/// Linha editável do ajuste da venda (desconto XOR acréscimo).
class SaleAdjustmentRow extends ConsumerWidget {
  const SaleAdjustmentRow({required this.totals, super.key});

  final CounterTotals totals;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final SaleAdjustment? adjustment = ref.watch(saleAdjustmentProvider);
    final String label = _label(adjustment);
    final String value = _valueLabel(totals, adjustment);
    final bool enabled = totals.itemCount > 0;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: enabled ? () => _openEditor(context, ref, adjustment) : null,
        child: SizedBox(
          height: PdvSizes.controlHeight,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: PdvSpacing.md),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: <Widget>[
                Text(
                  label,
                  style: PdvTypography.bodyMd.copyWith(
                    color: PdvCounterColors.foregroundMuted,
                  ),
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    Text(
                      value,
                      style: PdvTypography.bodyLg.copyWith(
                        color: PdvCounterColors.foreground,
                        fontFeatures: PdvTypography.tabular,
                      ),
                    ),
                    if (enabled) ...<Widget>[
                      const SizedBox(width: PdvSpacing.sm),
                      Icon(
                        Icons.edit_outlined,
                        size: PdvSizes.iconMd,
                        color: PdvCounterColors.foregroundMuted,
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  static String _label(SaleAdjustment? adjustment) {
    if (adjustment == null) {
      return 'Ajuste da venda';
    }
    return adjustment.kind == SaleAdjustmentKind.discount
        ? 'Desconto da venda'
        : 'Acréscimo da venda';
  }

  static String _valueLabel(CounterTotals totals, SaleAdjustment? adjustment) {
    if (adjustment == null) {
      return '—';
    }
    final int delta = totals.saleAdjustmentCents.abs();
    final String money = formatCents(delta);
    if (adjustment.mode == SaleAdjustmentMode.percent) {
      final double pct = (adjustment.percentBps ?? 0) / 100;
      final String sign =
          adjustment.kind == SaleAdjustmentKind.discount ? '−' : '+';
      return '$sign${pct.toStringAsFixed(2)}% ($money)';
    }
    final String sign =
        adjustment.kind == SaleAdjustmentKind.discount ? '−' : '+';
    return '$sign$money';
  }

  Future<void> _openEditor(
    BuildContext context,
    WidgetRef ref,
    SaleAdjustment? current,
  ) async {
    final Object? result = await showDialog<Object?>(
      context: context,
      builder: (BuildContext ctx) => _SaleAdjustmentDialog(initial: current),
    );
    if (!context.mounted) {
      return;
    }
    if (result == null) {
      return;
    }
    if (result == false) {
      ref.read(saleAdjustmentProvider.notifier).clear();
      return;
    }

    final SaleAdjustment adjustment = result as SaleAdjustment;
    final SaleAdjustment? authorized = await _authorizeIfNeeded(
      context,
      ref,
      adjustment,
    );
    // `null` = supervisor não autorizou ou o operador desistiu. O ajuste
    // anterior permanece — não pode ficar "meio aplicado".
    if (authorized == null) return;

    ref.read(saleAdjustmentProvider.notifier).setAdjustment(authorized);
  }

  /// Devolve o ajuste pronto para aplicar, ou `null` se não foi liberado.
  ///
  /// A conversão para percentual acontece aqui e não na tela do diálogo porque
  /// desconto em reais e em porcentagem são a **mesma** exceção — quem digita
  /// R$ 90 numa venda de R$ 100 está dando 90%, e a alçada tem que enxergar
  /// isso.
  Future<SaleAdjustment?> _authorizeIfNeeded(
    BuildContext context,
    WidgetRef ref,
    SaleAdjustment adjustment,
  ) async {
    final double percent = adjustment.discountPercentOf(totals.linesNetCents);
    final PosPolicy policy = ref.read(posPolicyProvider);

    final ExceptionDecision decision = await requestException(
      context,
      ref,
      operation: PosOperation.discount,
      amount: percent,
      detail:
          'Desconto de ${percent.toStringAsFixed(2)}% '
          '(${formatCents(adjustment.deltaCentsOf(totals.linesNetCents))})\n'
          'Acima do limite de ${policy.discountSupervisorAbovePercent}% '
          'sem autorização.',
    );

    return switch (decision) {
      ExceptionAllowed() => adjustment,
      ExceptionRefused() => null,
      ExceptionAuthorized(:final SupervisorAuthorization authorization) =>
        adjustment.copyWith(
          authorizedByOperatorId: authorization.operatorId,
          authorizedByOperatorName: authorization.operatorName,
        ),
    };
  }
}

class _SaleAdjustmentDialog extends StatefulWidget {
  const _SaleAdjustmentDialog({this.initial});

  final SaleAdjustment? initial;

  @override
  State<_SaleAdjustmentDialog> createState() => _SaleAdjustmentDialogState();
}

class _SaleAdjustmentDialogState extends State<_SaleAdjustmentDialog> {
  late SaleAdjustmentKind _kind;
  late SaleAdjustmentMode _mode;
  late final TextEditingController _valueCtrl;

  @override
  void initState() {
    super.initState();
    final SaleAdjustment? initial = widget.initial;
    _kind = initial?.kind ?? SaleAdjustmentKind.discount;
    _mode = initial?.mode ?? SaleAdjustmentMode.percent;
    if (initial?.mode == SaleAdjustmentMode.percent) {
      final double pct = (initial!.percentBps ?? 0) / 100;
      _valueCtrl = TextEditingController(text: pct.toStringAsFixed(2));
    } else if (initial?.mode == SaleAdjustmentMode.amount) {
      _valueCtrl = TextEditingController(
        text: formatCents(initial!.amountCents ?? 0),
      );
    } else {
      _valueCtrl = TextEditingController();
    }
  }

  @override
  void dispose() {
    _valueCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Ajuste da venda'),
      content: PdvDialogBody(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            SegmentedButton<SaleAdjustmentKind>(
              segments: const <ButtonSegment<SaleAdjustmentKind>>[
                ButtonSegment<SaleAdjustmentKind>(
                  value: SaleAdjustmentKind.discount,
                  label: Text('Desconto'),
                ),
                ButtonSegment<SaleAdjustmentKind>(
                  value: SaleAdjustmentKind.surcharge,
                  label: Text('Acréscimo'),
                ),
              ],
              selected: <SaleAdjustmentKind>{_kind},
              onSelectionChanged: (Set<SaleAdjustmentKind> s) {
                setState(() => _kind = s.first);
              },
            ),
            const SizedBox(height: PdvSpacing.lg),
            SegmentedButton<SaleAdjustmentMode>(
              segments: const <ButtonSegment<SaleAdjustmentMode>>[
                ButtonSegment<SaleAdjustmentMode>(
                  value: SaleAdjustmentMode.percent,
                  label: Text('%'),
                ),
                ButtonSegment<SaleAdjustmentMode>(
                  value: SaleAdjustmentMode.amount,
                  label: Text('R\$'),
                ),
              ],
              selected: <SaleAdjustmentMode>{_mode},
              onSelectionChanged: (Set<SaleAdjustmentMode> s) {
                // Limpa ao trocar: o mesmo "10" vale 10% de um lado e R$ 0,10
                // do outro. Manter o texto aplicaria um desconto que ninguém
                // pediu.
                setState(() {
                  _mode = s.first;
                  _valueCtrl.clear();
                });
              },
            ),
            const SizedBox(height: PdvSpacing.lg),
            TextField(
              controller: _valueCtrl,
              autofocus: true,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              style: PdvTypography.bodyLg.copyWith(
                color: PdvColors.textPrimary,
                fontFeatures: PdvTypography.tabular,
              ),
              inputFormatters:
                  _mode == SaleAdjustmentMode.percent
                      ? <TextInputFormatter>[
                        FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]')),
                      ]
                      : const <TextInputFormatter>[PdvCurrencyInputFormatter()],
              decoration: InputDecoration(
                labelText:
                    _mode == SaleAdjustmentMode.percent
                        ? 'Percentual (%)'
                        : 'Valor',
              ),
            ),
          ],
        ),
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: const Text('Limpar'),
        ),
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancelar'),
        ),
        FilledButton(onPressed: _apply, child: const Text('Aplicar')),
      ],
    );
  }

  void _apply() {
    if (_mode == SaleAdjustmentMode.percent) {
      final double? parsed = double.tryParse(
        _valueCtrl.text.trim().replaceAll(',', '.'),
      );
      if (parsed == null || parsed < 0) return;
      Navigator.of(context).pop(
        SaleAdjustment(
          kind: _kind,
          mode: SaleAdjustmentMode.percent,
          percentBps: (parsed * 100).round(),
        ),
      );
      return;
    }
    // No modo valor o texto já está mascarado — ler os dígitos é o inverso
    // exato da máscara, sem passar por `double`.
    Navigator.of(context).pop(
      SaleAdjustment(
        kind: _kind,
        mode: SaleAdjustmentMode.amount,
        amountCents: centsFromDigits(_valueCtrl.text),
      ),
    );
  }
}
