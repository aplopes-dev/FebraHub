import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/format/pdv_weight_money.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/ui/pdv_dialog.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';

class ScaleWeightResult {
  const ScaleWeightResult({required this.weightKg, required this.lineCents});

  final double weightKg;
  final int lineCents;
}

Future<ScaleWeightResult?> showScaleWeightDialog(
  BuildContext context, {
  required CounterProduct product,
  bool simulateScale = false,
}) {
  return showDialog<ScaleWeightResult>(
    context: context,
    barrierDismissible: false,
    builder: (BuildContext ctx) {
      return _ScaleWeightDialog(product: product, simulateScale: simulateScale);
    },
  );
}

class _ScaleWeightDialog extends StatefulWidget {
  const _ScaleWeightDialog({
    required this.product,
    required this.simulateScale,
  });

  final CounterProduct product;
  final bool simulateScale;

  @override
  State<_ScaleWeightDialog> createState() => _ScaleWeightDialogState();
}

class _ScaleWeightDialogState extends State<_ScaleWeightDialog> {
  final TextEditingController _weightController = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _weightController.dispose();
    super.dispose();
  }

  int get _pricePerKg => widget.product.pricePerKgCents ?? 0;

  double? get _weight {
    final String raw = _weightController.text.replaceAll(',', '.');
    return double.tryParse(raw);
  }

  int get _previewCents {
    final double? w = _weight;
    if (w == null || w <= 0) {
      return 0;
    }
    return weightLineCents(pricePerKgCents: _pricePerKg, weightKg: w);
  }

  void _confirm() {
    final double? w = _weight;
    if (w == null || w <= 0) {
      setState(() => _error = 'Informe um peso maior que zero');
      return;
    }
    Navigator.of(
      context,
    ).pop(ScaleWeightResult(weightKg: w, lineCents: _previewCents));
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.product.name, style: PdvTypography.headingMd),
      content: PdvDialogBody(
        size: PdvDialogSize.medium,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Text(
              'Preço/kg: ${formatCents(_pricePerKg)}',
              style: PdvTypography.bodyMd,
            ),
            const SizedBox(height: PdvSpacing.md),
            PdvFilledField(
              label: 'Peso (kg)',
              controller: _weightController,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              inputFormatters: <TextInputFormatter>[
                FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]')),
              ],
              onSubmitted: (_) => _confirm(),
            ),
            if (_error != null) ...<Widget>[
              const SizedBox(height: PdvSpacing.sm),
              Text(
                _error!,
                style: PdvTypography.bodySm.copyWith(color: PdvColors.danger),
              ),
            ],
            const SizedBox(height: PdvSpacing.md),
            Text(
              'Valor: ${formatCents(_previewCents)}',
              style: PdvTypography.amountLg,
            ),
            if (widget.simulateScale) ...<Widget>[
              const SizedBox(height: PdvSpacing.md),
              OutlinedButton(
                onPressed: () {
                  setState(() {
                    _weightController.text = '0.335';
                    _error = null;
                  });
                },
                child: const Text('Ler balança (simulado)'),
              ),
            ],
          ],
        ),
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancelar'),
        ),
        SizedBox(
          height: PdvSizes.controlHeight,
          child: FilledButton(
            onPressed: _confirm,
            child: const Text('Confirmar'),
          ),
        ),
      ],
    );
  }
}
