import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:citybox_pdv/features/refund/application/refund_controller.dart';
import 'package:citybox_pdv/features/refund/domain/refund_models.dart';
import 'package:citybox_pdv/ui/pdv_dialog.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';

class RefundPage extends ConsumerStatefulWidget {
  const RefundPage({super.key});

  @override
  ConsumerState<RefundPage> createState() => _RefundPageState();
}

class _RefundPageState extends ConsumerState<RefundPage> {
  final TextEditingController _searchController = TextEditingController();
  SaleRecord? _sale;
  final Map<String, int> _qtyByProduct = <String, int>{};
  RefundMethod _method = RefundMethod.cash;
  String? _message;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(refundProvider.notifier).hydrate();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _pickSale(SaleRecord sale) {
    setState(() {
      _sale = sale;
      _qtyByProduct.clear();
      _message = null;
    });
  }

  Future<void> _confirm() async {
    final SaleRecord? sale = _sale;
    if (sale == null) {
      return;
    }
    final List<RefundLine> lines = <RefundLine>[];
    for (final SaleLineSnapshot line in sale.lines) {
      final int qty = _qtyByProduct[line.productId] ?? 0;
      if (qty <= 0) {
        continue;
      }
      final int unit =
          line.quantity == 0 ? 0 : (line.lineTotalCents ~/ line.quantity);
      lines.add(
        RefundLine(
          productId: line.productId,
          name: line.name,
          quantity: qty,
          unitCents: unit,
          lineCents: unit * qty,
        ),
      );
    }
    try {
      final RefundRecord record = await ref
          .read(refundProvider.notifier)
          .confirmRefund(sale: sale, lines: lines, method: _method);
      if (!mounted) {
        return;
      }
      await showDialog<void>(
        context: context,
        builder: (BuildContext ctx) {
          return AlertDialog(
            title: const Text('Devolução registrada'),
            content: PdvDialogBody(
              child: Text(
                'Total ${formatCents(record.totalCents)}',
                style: PdvTypography.amountLg,
              ),
            ),
            actions: <Widget>[
              FilledButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: const Text('OK'),
              ),
            ],
          );
        },
      );
      setState(() {
        _sale = null;
        _qtyByProduct.clear();
        _message = null;
      });
    } on Object catch (e) {
      setState(() => _message = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final CashShift? shift = ref.watch(cashShiftProvider);
    final List<SaleRecord> sales =
        (shift?.sales ?? const <SaleRecord>[])
            .where((SaleRecord s) => s.status == SaleRecordStatus.completed)
            .toList();
    final String q = _searchController.text.trim().toLowerCase();
    final List<SaleRecord> filtered =
        q.isEmpty
            ? sales
            : sales
                .where(
                  (SaleRecord s) =>
                      s.id.toLowerCase().contains(q) ||
                      formatCents(s.totalCents).contains(q),
                )
                .toList();

    return PdvScaffold(
      body: Padding(
        padding: const EdgeInsets.all(PdvSpacing.lg),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Expanded(
              flex: 2,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  Text('Vendas do turno', style: PdvTypography.headingMd),
                  const SizedBox(height: PdvSpacing.md),
                  PdvFilledField(
                    label: 'Buscar venda',
                    controller: _searchController,
                    onSubmitted: (_) => setState(() {}),
                  ),
                  const SizedBox(height: PdvSpacing.md),
                  Expanded(
                    child: ListView.separated(
                      itemCount: filtered.length,
                      separatorBuilder:
                          (_, __) => const SizedBox(height: PdvSpacing.sm),
                      itemBuilder: (BuildContext context, int index) {
                        final SaleRecord s = filtered[index];
                        return ListTile(
                          tileColor: PdvColors.surface,
                          title: Text(s.id, style: PdvTypography.bodyMd),
                          subtitle: Text(formatCents(s.totalCents)),
                          onTap: () => _pickSale(s),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: PdvSpacing.lg),
            Expanded(
              flex: 3,
              child:
                  _sale == null
                      ? const Center(
                        child: Text(
                          'Selecione uma venda',
                          style: PdvTypography.bodyLg,
                        ),
                      )
                      : _RefundDetail(
                        sale: _sale!,
                        qtyByProduct: _qtyByProduct,
                        method: _method,
                        message: _message,
                        onQty: (String id, int qty) {
                          setState(() => _qtyByProduct[id] = qty);
                        },
                        onMethod: (RefundMethod m) {
                          setState(() => _method = m);
                        },
                        onConfirm: _confirm,
                      ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RefundDetail extends ConsumerWidget {
  const _RefundDetail({
    required this.sale,
    required this.qtyByProduct,
    required this.method,
    required this.onQty,
    required this.onMethod,
    required this.onConfirm,
    this.message,
  });

  final SaleRecord sale;
  final Map<String, int> qtyByProduct;
  final RefundMethod method;
  final String? message;
  final void Function(String id, int qty) onQty;
  final ValueChanged<RefundMethod> onMethod;
  final VoidCallback onConfirm;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final List<RefundRecord> prior = ref.watch(refundProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Text('Venda ${sale.id}', style: PdvTypography.headingMd),
        const SizedBox(height: PdvSpacing.md),
        Expanded(
          child: ListView.builder(
            itemCount: sale.lines.length,
            itemBuilder: (BuildContext context, int index) {
              final SaleLineSnapshot line = sale.lines[index];
              final int eligible = eligibleQty(
                line: line,
                priorRefunds: prior,
                saleId: sale.id,
              );
              final int selected = qtyByProduct[line.productId] ?? 0;
              return ListTile(
                title: Text(line.name, style: PdvTypography.bodyMd),
                subtitle: Text(
                  'Elegível: $eligible · ${formatCents(line.lineTotalCents)}',
                ),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    IconButton(
                      onPressed:
                          selected <= 0
                              ? null
                              : () => onQty(line.productId, selected - 1),
                      icon: const Icon(Icons.remove),
                    ),
                    Text('$selected', style: PdvTypography.bodyLg),
                    IconButton(
                      onPressed:
                          selected >= eligible
                              ? null
                              : () => onQty(line.productId, selected + 1),
                      icon: const Icon(Icons.add),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        SegmentedButton<RefundMethod>(
          segments: const <ButtonSegment<RefundMethod>>[
            ButtonSegment<RefundMethod>(
              value: RefundMethod.cash,
              label: Text('Dinheiro'),
            ),
            ButtonSegment<RefundMethod>(
              value: RefundMethod.customerCredit,
              label: Text('Crédito cliente'),
            ),
          ],
          selected: <RefundMethod>{method},
          onSelectionChanged: (Set<RefundMethod> s) => onMethod(s.first),
        ),
        if (message != null) ...<Widget>[
          const SizedBox(height: PdvSpacing.sm),
          Text(
            message!,
            style: PdvTypography.bodySm.copyWith(color: PdvColors.danger),
          ),
        ],
        const SizedBox(height: PdvSpacing.md),
        SizedBox(
          height: PdvSizes.controlHeightLg,
          child: FilledButton(
            onPressed: onConfirm,
            child: const Text('Confirmar devolução'),
          ),
        ),
      ],
    );
  }
}
