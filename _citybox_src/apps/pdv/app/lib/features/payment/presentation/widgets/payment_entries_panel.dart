import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/payment/application/payment_entries_controller.dart';
import 'package:citybox_pdv/features/payment/domain/payment_entry.dart';

/// Lista dos pagamentos já lançados nesta venda.
///
/// Uma linha por lançamento — R$ 50 no dinheiro e R$ 34,90 no débito são duas
/// linhas. Cada uma pode ser desfeita: errar a forma é comum, e o conserto
/// não pode exigir refazer a venda inteira.
class PaymentEntriesPanel extends ConsumerWidget {
  const PaymentEntriesPanel({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final List<PaymentEntry> entries = ref.watch(paymentEntriesProvider);

    return DecoratedBox(
      decoration: const BoxDecoration(
        color: PdvCounterColors.background,
        border: Border(left: BorderSide(color: PdvCounterColors.border)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          const _EntriesHeader(),
          Divider(height: PdvSizes.borderWidth, color: PdvCounterColors.border),
          Expanded(
            child:
                entries.isEmpty
                    ? const _NoEntries()
                    : ListView.builder(
                      padding: EdgeInsets.zero,
                      itemCount: entries.length,
                      itemBuilder:
                          (BuildContext context, int index) => _EntryRow(
                            entry: entries[index],
                            onRemove:
                                () => ref
                                    .read(paymentEntriesProvider.notifier)
                                    .removeAt(index),
                          ),
                    ),
          ),
        ],
      ),
    );
  }
}

class _EntriesHeader extends StatelessWidget {
  const _EntriesHeader();

  @override
  Widget build(BuildContext context) {
    final TextStyle style = PdvTypography.labelSm.copyWith(
      color: PdvCounterColors.foregroundMuted,
      letterSpacing: 0.4,
    );

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: PdvSpacing.md,
        vertical: PdvSpacing.md,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: <Widget>[
          Text('FORMA DE PAGAMENTO', style: style),
          Text('VALOR', style: style),
        ],
      ),
    );
  }
}

class _EntryRow extends StatelessWidget {
  const _EntryRow({required this.entry, required this.onRemove});

  final PaymentEntry entry;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final String? detail = entry.detail;

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: PdvSpacing.md,
        vertical: PdvSpacing.sm,
      ),
      child: Row(
        children: <Widget>[
          // Ponto colorido, e não um ícone por forma: o app não tem ícone
          // para "ANOTA AI" nem para "VALE FUNC", e inventar um por forma
          // envelheceria mal a cada forma nova que a loja cadastrar.
          const Icon(
            Icons.circle,
            size: PdvSpacing.sm,
            color: PdvCounterColors.accent,
          ),
          const SizedBox(width: PdvSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Text(
                  entry.method.label,
                  style: PdvTypography.bodyMd.copyWith(
                    color: PdvCounterColors.foreground,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                if (detail != null)
                  Text(
                    detail,
                    style: PdvTypography.caption.copyWith(
                      color: PdvCounterColors.foregroundMuted,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),
          const SizedBox(width: PdvSpacing.sm),
          Text(
            formatCents(entry.amountCents),
            style: PdvTypography.bodyMd.copyWith(
              color: PdvCounterColors.foreground,
              fontFeatures: PdvTypography.tabular,
            ),
          ),
          const SizedBox(width: PdvSpacing.xs),
          Tooltip(
            message: 'Remover ${entry.method.label}',
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: onRemove,
                child: const Padding(
                  padding: EdgeInsets.all(PdvSpacing.xs),
                  child: Icon(
                    Icons.close,
                    size: PdvSizes.iconSm,
                    color: PdvCounterColors.danger,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NoEntries extends StatelessWidget {
  const _NoEntries();

  @override
  Widget build(BuildContext context) {
    const Color color = PdvCounterColors.foregroundMuted;

    return Padding(
      padding: const EdgeInsets.only(top: PdvSpacing.lg),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const Icon(
            Icons.credit_card_outlined,
            size: PdvSizes.iconLg,
            color: color,
          ),
          const SizedBox(height: PdvSpacing.sm),
          Text(
            'Nenhum pagamento adicionado',
            style: PdvTypography.bodyMd.copyWith(color: color),
          ),
        ],
      ),
    );
  }
}
