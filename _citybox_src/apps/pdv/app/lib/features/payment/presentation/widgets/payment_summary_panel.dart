import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/counter/application/counter_totals_provider.dart';
import 'package:citybox_pdv/features/counter/domain/counter_totals.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_document_row.dart';
import 'package:citybox_pdv/features/payment/application/payment_summary_provider.dart';
import 'package:citybox_pdv/features/payment/domain/payment_summary.dart';
import 'package:citybox_pdv/features/payment/presentation/widgets/sale_note_row.dart';

/// Fechamento da venda: documento na nota, os valores e o botão de finalizar.
///
/// O campo de CPF/CNPJ é o **mesmo** widget do painel do Balcão
/// (`CounterDocumentRow`), lendo o mesmo provider: o operador que digitou o
/// CPF lá encontra o número aqui, e vice-versa.
class PaymentSummaryPanel extends ConsumerWidget {
  const PaymentSummaryPanel({required this.onFinalize, super.key});

  final VoidCallback onFinalize;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final CounterTotals totals = ref.watch(counterTotalsProvider);
    final PaymentSummary summary = ref.watch(paymentSummaryProvider);

    return DecoratedBox(
      decoration: const BoxDecoration(
        color: PdvCounterColors.background,
        border: Border(left: BorderSide(color: PdvCounterColors.border)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          // Acima do documento porque some quando não há observação: uma faixa
          // que aparece e desaparece no meio do painel empurraria as linhas de
          // valores para cima e para baixo a cada anotação.
          const SaleNoteRow(),
          const CounterDocumentRow(),
          const _PanelDivider(),
          _SummaryRow(
            label: 'Produtos',
            value: formatCents(totals.subtotalCents),
            badgeCount: totals.itemCount,
          ),
          const _PanelDivider(),
          _SummaryRow(
            label: 'Desconto',
            value: '${totals.discountPercentage.toStringAsFixed(2)}%',
          ),
          const _PanelDivider(),
          _SummaryRow(
            label: 'Total',
            value: formatCents(summary.totalCents),
            emphasized: true,
          ),
          const _PanelDivider(),
          _SummaryRow(
            label: 'Recebido',
            value: formatCents(summary.receivedCents),
          ),
          const _PanelDivider(),
          _SummaryRow(
            label: 'A receber',
            value: formatCents(summary.remainingCents),
          ),
          const _PanelDivider(),
          _SummaryRow(
            label: 'Troco',
            value: formatCents(summary.changeCents),
            emphasized: true,
          ),
          _FinalizeButton(enabled: summary.canFinalize, onPressed: onFinalize),
        ],
      ),
    );
  }
}

class _PanelDivider extends StatelessWidget {
  const _PanelDivider();

  @override
  Widget build(BuildContext context) {
    return Divider(
      height: PdvSizes.borderWidth,
      color: PdvCounterColors.border,
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.badgeCount,
    this.emphasized = false,
  });

  final String label;
  final String value;
  final int? badgeCount;
  final bool emphasized;

  @override
  Widget build(BuildContext context) {
    final TextStyle labelStyle = (emphasized
            ? PdvTypography.label
            : PdvTypography.bodySm)
        .copyWith(color: PdvCounterColors.foregroundMuted);
    final TextStyle valueStyle =
        (emphasized ? PdvTypography.headingMd : PdvTypography.bodyMd).copyWith(
          color: PdvCounterColors.foreground,
          fontFeatures: PdvTypography.tabular,
        );

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: PdvSpacing.md,
        vertical: PdvSpacing.md,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: <Widget>[
          Text(label, style: labelStyle),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              if (badgeCount != null) ...<Widget>[
                _CountBadge(count: badgeCount!),
                const SizedBox(width: PdvSpacing.sm),
              ],
              Text(value, style: valueStyle),
            ],
          ),
        ],
      ),
    );
  }
}

class _CountBadge extends StatelessWidget {
  const _CountBadge({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(color: PdvCounterColors.accent),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: PdvSpacing.sm,
          vertical: PdvSpacing.xxs,
        ),
        child: Text(
          '$count',
          style: PdvTypography.labelSm.copyWith(color: PdvColors.onBrand),
        ),
      ),
    );
  }
}

/// Fecha a venda. Verde só quando o recebido cobre o total — antes disso fica
/// apagado e não responde ao toque, o mesmo par de sinais do botão de
/// pagamento no Balcão.
class _FinalizeButton extends StatelessWidget {
  const _FinalizeButton({required this.enabled, required this.onPressed});

  final bool enabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: PdvSizes.controlHeightLg,
      child: Material(
        color:
            enabled ? PdvCounterColors.payment : PdvCounterColors.surfaceStrong,
        child: InkWell(
          onTap: enabled ? onPressed : null,
          child: Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: <Widget>[
                Text(
                  'FINALIZAR',
                  style: PdvTypography.label.copyWith(
                    color:
                        enabled
                            ? PdvCounterColors.onPayment
                            : PdvCounterColors.foregroundMuted,
                  ),
                ),
                const SizedBox(width: PdvSpacing.xs),
                Text(
                  '(F2)',
                  style: PdvTypography.caption.copyWith(
                    color:
                        enabled
                            ? PdvCounterColors.onPayment
                            : PdvCounterColors.foregroundMuted,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
