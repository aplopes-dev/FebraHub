import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/delivery/application/delivery_orders_controller.dart';
import 'package:citybox_pdv/ui/pdv_dialog.dart';

/// Legenda de cores do quadro.
///
/// A lista é gerada a partir de `DeliveryTone`, não escrita à mão: legenda
/// digitada à parte descola do código no primeiro tom novo, e uma legenda que
/// mente é pior que não ter legenda.
Future<void> showDeliveryLegendDialog(BuildContext context) {
  return showDialog<void>(
    context: context,
    builder: (BuildContext ctx) {
      return AlertDialog(
        title: Row(
          children: <Widget>[
            Expanded(
              child: Text('Legenda de cores', style: PdvTypography.headingMd),
            ),
            IconButton(
              onPressed: () => Navigator.pop(ctx),
              icon: const Icon(Icons.close, size: PdvSizes.iconMd),
              color: PdvColors.textSecondary,
              tooltip: 'Fechar',
            ),
          ],
        ),
        content: PdvDialogBody(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              for (final DeliveryTone tone in DeliveryTone.values)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: PdvSpacing.md),
                  child: Row(
                    children: <Widget>[
                      Container(
                        width: PdvSizes.iconMd,
                        height: PdvSizes.iconMd,
                        decoration: BoxDecoration(
                          color: tone.color,
                          borderRadius: PdvRadius.fullAll,
                        ),
                      ),
                      const SizedBox(width: PdvSpacing.lg),
                      Text(tone.label, style: PdvTypography.bodyLg),
                    ],
                  ),
                ),
            ],
          ),
        ),
      );
    },
  );
}
