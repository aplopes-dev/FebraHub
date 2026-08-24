import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/delivery/application/delivery_orders_controller.dart';
import 'package:citybox_pdv/features/delivery/domain/delivery_order.dart';
import 'package:citybox_pdv/features/delivery/presentation/widgets/delivery_order_card.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';

/// Quadro de pedidos: uma coluna por etapa do caminho do pedido.
///
/// As quatro colunas dividem a largura por igual (`Expanded`), e não têm
/// largura fixa com rolagem horizontal: o quadro do delivery é conferido de
/// relance no meio do serviço, e uma coluna fora da tela é uma coluna que
/// ninguém olha.
class DeliveryKanbanBoard extends StatelessWidget {
  const DeliveryKanbanBoard({
    required this.columns,
    required this.toneOf,
    required this.onOpenOrder,
    required this.onAdvanceOrder,
    super.key,
  });

  final Map<DeliveryOrderStatus, List<DeliveryOrder>> columns;
  final DeliveryTone Function(DeliveryOrder) toneOf;
  final void Function(DeliveryOrder) onOpenOrder;
  final void Function(DeliveryOrder) onAdvanceOrder;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        for (final DeliveryOrderStatus status in deliveryBoardColumns)
          Expanded(
            child: _BoardColumn(
              title: status.boardLabel,
              orders: columns[status] ?? const <DeliveryOrder>[],
              toneOf: toneOf,
              onOpenOrder: onOpenOrder,
              onAdvanceOrder: onAdvanceOrder,
            ),
          ),
      ],
    );
  }
}

class _BoardColumn extends StatelessWidget {
  const _BoardColumn({
    required this.title,
    required this.orders,
    required this.toneOf,
    required this.onOpenOrder,
    required this.onAdvanceOrder,
  });

  final String title;
  final List<DeliveryOrder> orders;
  final DeliveryTone Function(DeliveryOrder) toneOf;
  final void Function(DeliveryOrder) onOpenOrder;
  final void Function(DeliveryOrder) onAdvanceOrder;

  @override
  Widget build(BuildContext context) {
    return Container(
      // Vão maior que o antigo `xs`: é o fundo do app aparecendo entre as
      // colunas que as separa, agora que elas afundaram.
      margin: const EdgeInsets.all(PdvSpacing.sm),
      decoration: BoxDecoration(
        color: PdvBoardColors.columnSurface,
        border: Border.all(color: PdvBoardColors.columnBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          ColoredBox(
            color: PdvBoardColors.columnHeader,
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: PdvSpacing.md,
                vertical: PdvSpacing.md,
              ),
              child: Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      title.toUpperCase(),
                      style: PdvTypography.label.copyWith(
                        color: PdvCounterColors.foreground,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: PdvSpacing.sm),
                  // Contagem, não um traço decorativo: numa coluna vazia o
                  // "0" já responde "não tem nada aqui" sem o operador rolar.
                  Text(
                    orders.length.toString(),
                    style: PdvTypography.label.copyWith(
                      color: PdvCounterColors.foregroundMuted,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const Divider(height: 1, color: PdvBoardColors.columnBorder),
          Expanded(
            child:
                orders.isEmpty
                    ? const SizedBox.shrink()
                    : ListView.separated(
                      padding: const EdgeInsets.all(PdvSpacing.sm),
                      itemCount: orders.length,
                      separatorBuilder:
                          (_, __) => const SizedBox(height: PdvSpacing.sm),
                      itemBuilder: (BuildContext context, int index) {
                        final DeliveryOrder order = orders[index];
                        return DeliveryOrderCard(
                          order: order,
                          tone: toneOf(order),
                          onTap: () => onOpenOrder(order),
                          onAdvance:
                              order.status == DeliveryOrderStatus.received ||
                                      order.status ==
                                          DeliveryOrderStatus.preparing
                                  ? () => onAdvanceOrder(order)
                                  : null,
                        );
                      },
                    ),
          ),
        ],
      ),
    );
  }
}
