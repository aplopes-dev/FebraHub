import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/format/brazilian_masks.dart';
import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/cash/domain/display_sale_number.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:citybox_pdv/ui/pdv_dialog.dart';

/// Cupom **não fiscal** — preview para impressão (sem driver nesta fatia).
Future<void> showNonFiscalReceiptDialog(
  BuildContext context, {
  required SaleRecord sale,
}) {
  return showDialog<void>(
    context: context,
    builder: (BuildContext context) {
      return AlertDialog(
        backgroundColor: PdvColors.surface,
        title: Text(
          'CUPOM NÃO FISCAL',
          style: PdvTypography.headingMd.copyWith(color: PdvColors.textPrimary),
        ),
        content: PdvDialogBody(
          size: PdvDialogSize.medium,
          height: 420,
          child: SingleChildScrollView(child: _ReceiptBody(sale: sale)),
        ),
        actions: <Widget>[
          PdvDialogActions(
            children: <Widget>[
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Fechar'),
              ),
              FilledButton(
                onPressed: () {
                  // Sem impressora nesta fatia — o dialog *é* o documento.
                  Navigator.of(context).pop();
                },
                child: const Text('Imprimir'),
              ),
            ],
          ),
        ],
      );
    },
  );
}

class _ReceiptBody extends StatelessWidget {
  const _ReceiptBody({required this.sale});

  final SaleRecord sale;

  @override
  Widget build(BuildContext context) {
    final String numberLabel = displaySaleNumber(sale);
    final String? doc = sale.consumerDocument;
    final String? docLabel =
        doc == null || doc.isEmpty
            ? null
            : (doc.length == 14 ? formatCnpj(doc) : formatCpf(doc));

    return DefaultTextStyle(
      style: PdvTypography.bodyMd.copyWith(color: PdvColors.textPrimary),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Text('Venda $numberLabel'),
          Text(
            _formatDateTime(sale.createdAt),
            style: PdvTypography.bodySm.copyWith(
              color: PdvColors.textSecondary,
            ),
          ),
          const SizedBox(height: PdvSpacing.md),
          Text('Cliente: ${sale.customerName ?? 'Consumidor Final'}'),
          if (docLabel != null) Text('CPF/CNPJ na nota: $docLabel'),
          if (sale.operatorName != null) Text('Operador: ${sale.operatorName}'),
          if (sale.sellerName != null) Text('Vendedor: ${sale.sellerName}'),
          const Divider(height: PdvSpacing.xl),
          for (final SaleLineSnapshot line in sale.lines) ...<Widget>[
            Text(
              '${line.quantity}× ${line.name}',
              style: PdvTypography.label,
            ),
            Text(
              formatCents(line.lineTotalCents),
              textAlign: TextAlign.right,
            ),
            const SizedBox(height: PdvSpacing.xs),
          ],
          const Divider(height: PdvSpacing.xl),
          _Row('Subtotal', formatCents(sale.subtotalCents)),
          if (sale.deliveryFeeCents > 0)
            _Row('Taxas/frete', formatCents(sale.deliveryFeeCents)),
          _Row('Total', formatCents(sale.totalCents), emphasize: true),
          const SizedBox(height: PdvSpacing.md),
          Text('Pagamentos', style: PdvTypography.label),
          for (final SalePaymentSnapshot p in sale.payments)
            _Row(
              p.brand == null
                  ? p.methodLabel
                  : '${p.methodLabel} (${p.brand})',
              formatCents(p.amountCents),
            ),
          if (sale.changeCents > 0)
            _Row('Troco', formatCents(sale.changeCents)),
          if (sale.note != null && sale.note!.isNotEmpty) ...<Widget>[
            const SizedBox(height: PdvSpacing.md),
            Text('Obs.: ${sale.note}'),
          ],
          const SizedBox(height: PdvSpacing.lg),
          Text(
            'Documento sem valor fiscal',
            textAlign: TextAlign.center,
            style: PdvTypography.bodySm.copyWith(
              color: PdvColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDateTime(DateTime value) {
    final DateTime local = value.toLocal();
    final String d =
        '${local.day.toString().padLeft(2, '0')}/'
        '${local.month.toString().padLeft(2, '0')}/'
        '${local.year}';
    final String t =
        '${local.hour.toString().padLeft(2, '0')}:'
        '${local.minute.toString().padLeft(2, '0')}';
    return '$d $t';
  }
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value, {this.emphasize = false});

  final String label;
  final String value;
  final bool emphasize;

  @override
  Widget build(BuildContext context) {
    final TextStyle style =
        emphasize
            ? PdvTypography.headingSm.copyWith(color: PdvColors.textPrimary)
            : PdvTypography.bodyMd.copyWith(color: PdvColors.textPrimary);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: <Widget>[
          Expanded(child: Text(label, style: style)),
          Text(value, style: style),
        ],
      ),
    );
  }
}
