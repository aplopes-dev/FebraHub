import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/delivery/application/delivery_orders_controller.dart';
import 'package:citybox_pdv/features/delivery/domain/delivery_order.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';
import 'package:citybox_pdv/ui/pdv_table.dart';

/// Colunas dos pedidos, no mesmo desenho de Últimas vendas.
const List<PdvTableColumn> deliveryOrdersColumns = <PdvTableColumn>[
  PdvTableColumn('Código', flex: 3),
  PdvTableColumn('Data / Hora', flex: 3),
  PdvTableColumn('Caixa', flex: 3),
  PdvTableColumn('Número'),
  PdvTableColumn('Valor'),
  PdvTableColumn('Status', flex: 3),
  PdvTableColumn('Ações'),
];

class DeliveryOrdersTableHeader extends StatelessWidget {
  const DeliveryOrdersTableHeader({this.isLoading = false, super.key});

  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return PdvTableHeader(columns: deliveryOrdersColumns, isLoading: isLoading);
  }
}

class DeliveryOrdersRow extends StatelessWidget {
  const DeliveryOrdersRow({
    required this.order,
    required this.tone,
    required this.terminalLabel,
    required this.onOpen,
    this.striped = false,
    super.key,
  });

  final DeliveryOrder order;
  final DeliveryTone tone;

  /// Nome do caixa deste terminal (`TerminalSettings.terminalLabel`).
  ///
  /// O pedido **não** guarda em qual caixa nasceu — o PDV é um terminal só, e
  /// inventar o campo agora seria gravar um dado que ninguém preenche. A
  /// coluna mostra o caixa atual; quando houver mais de um terminal, o valor
  /// passa a vir do pedido.
  final String terminalLabel;

  final VoidCallback onOpen;
  final bool striped;

  @override
  Widget build(BuildContext context) {
    final bool cancelled = order.status == DeliveryOrderStatus.cancelled;
    final Color foreground =
        cancelled ? PdvColors.textDisabled : PdvColors.textPrimary;

    return Material(
      color: striped ? PdvColors.surfaceMuted : Colors.transparent,
      child: InkWell(
        onTap: onOpen,
        hoverColor: PdvCounterColors.surfaceHover,
        child: DecoratedBox(
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: PdvCounterColors.border)),
          ),
          child: Padding(
            padding: pdvTableRowPadding,
            child: Row(
              children: <Widget>[
                PdvTableCell(
                  order.id,
                  flex: deliveryOrdersColumns[0].flex,
                  color: foreground,
                  strikethrough: cancelled,
                ),
                PdvTableCell(
                  formatDeliveryDateTime(order.createdAt),
                  flex: deliveryOrdersColumns[1].flex,
                  color: foreground,
                ),
                PdvTableCell(
                  terminalLabel,
                  flex: deliveryOrdersColumns[2].flex,
                  color: foreground,
                ),
                PdvTableCell(
                  order.number == 0 ? '—' : order.number.toString(),
                  flex: deliveryOrdersColumns[3].flex,
                  color: foreground,
                  tabular: true,
                ),
                PdvTableCell(
                  formatCents(order.totalCents),
                  flex: deliveryOrdersColumns[4].flex,
                  color: foreground,
                  tabular: true,
                  strikethrough: cancelled,
                ),
                Expanded(
                  flex: deliveryOrdersColumns[5].flex,
                  child: Row(
                    children: <Widget>[
                      Container(
                        width: PdvSpacing.md,
                        height: PdvSpacing.md,
                        decoration: BoxDecoration(
                          color: tone.color,
                          borderRadius: PdvRadius.fullAll,
                        ),
                      ),
                      const SizedBox(width: PdvSpacing.sm),
                      Expanded(
                        child: Text(
                          tone.label,
                          style: PdvTypography.bodySm.copyWith(
                            color: foreground,
                          ),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  flex: deliveryOrdersColumns[6].flex,
                  child: Row(
                    children: <Widget>[
                      const Spacer(),
                      Icon(
                        Icons.chevron_right,
                        size: PdvSizes.iconMd,
                        color: PdvColors.textSecondary,
                      ),
                    ],
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

/// `dd/MM/yyyy HH:mm`, mesmo formato da tabela de vendas.
String formatDeliveryDateTime(DateTime value) {
  final DateTime local = value.toLocal();
  final String d = local.day.toString().padLeft(2, '0');
  final String m = local.month.toString().padLeft(2, '0');
  final String h = local.hour.toString().padLeft(2, '0');
  final String min = local.minute.toString().padLeft(2, '0');
  return '$d/$m/${local.year} $h:$min';
}
