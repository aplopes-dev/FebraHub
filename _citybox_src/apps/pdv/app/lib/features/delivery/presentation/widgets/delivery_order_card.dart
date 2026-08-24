import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/delivery/application/delivery_orders_controller.dart';
import 'package:citybox_pdv/features/delivery/domain/delivery_order.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';

/// Cartão de um pedido no quadro.
///
/// A bolinha de cor à esquerda é o que se lê de longe — o texto é a
/// confirmação. Ver `PdvDeliveryColors` e o diálogo de Legenda de cores.
class DeliveryOrderCard extends StatelessWidget {
  const DeliveryOrderCard({
    required this.order,
    required this.tone,
    required this.onTap,
    this.onAdvance,
    super.key,
  });

  final DeliveryOrder order;
  final DeliveryTone tone;
  final VoidCallback onTap;
  final VoidCallback? onAdvance;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: PdvCounterColors.surfaceStrong,
      child: InkWell(
        onTap: onTap,
        hoverColor: PdvCounterColors.surfaceHover,
        child: Padding(
          padding: const EdgeInsets.all(PdvSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
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
                      order.customerName ?? 'Sem cliente',
                      style: PdvTypography.label.copyWith(
                        color: PdvCounterColors.foreground,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Text(
                    formatCents(order.totalCents),
                    style: PdvTypography.amountSm.copyWith(
                      color: PdvCounterColors.foreground,
                    ),
                  ),
                  if (onAdvance != null)
                    IconButton(
                      onPressed: onAdvance,
                      tooltip: _advanceLabel(order.status),
                      icon: const Icon(Icons.arrow_forward),
                      color: PdvColors.focusRing,
                      visualDensity: VisualDensity.compact,
                    ),
                ],
              ),
              const SizedBox(height: PdvSpacing.xs),
              Text(
                order.addressText,
                style: PdvTypography.bodySm.copyWith(
                  color: PdvCounterColors.foregroundMuted,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: PdvSpacing.sm),
              Row(
                children: <Widget>[
                  Icon(
                    order.fulfillment == DeliveryFulfillment.pickup
                        ? Icons.storefront_outlined
                        : Icons.delivery_dining_outlined,
                    size: PdvSizes.iconSm,
                    color: PdvCounterColors.foregroundMuted,
                  ),
                  const SizedBox(width: PdvSpacing.xs),
                  Text(
                    order.fulfillment.label,
                    style: PdvTypography.caption.copyWith(
                      color: PdvCounterColors.foregroundMuted,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    _hhmm(order.createdAt),
                    style: PdvTypography.caption.copyWith(
                      color: PdvCounterColors.foregroundMuted,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String _advanceLabel(DeliveryOrderStatus status) => switch (status) {
  DeliveryOrderStatus.received => 'Iniciar preparo',
  DeliveryOrderStatus.preparing => 'Despachar pedido',
  _ => 'Avançar pedido',
};

String _hhmm(DateTime value) {
  final DateTime local = value.toLocal();
  return '${local.hour.toString().padLeft(2, '0')}:'
      '${local.minute.toString().padLeft(2, '0')}';
}
