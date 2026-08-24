import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/domain/product_variant.dart';
import 'package:citybox_pdv/ui/pdv_dialog.dart';

Future<ProductVariant?> showVariantGridDialog(
  BuildContext context, {
  required CounterProduct product,
}) {
  return showDialog<ProductVariant>(
    context: context,
    barrierDismissible: false,
    builder: (BuildContext ctx) {
      return AlertDialog(
        title: Text(product.name, style: PdvTypography.headingMd),
        content: PdvDialogBody(
          size: PdvDialogSize.large,
          child: _VariantGridBody(product: product),
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancelar'),
          ),
        ],
      );
    },
  );
}

class _VariantGridBody extends StatefulWidget {
  const _VariantGridBody({required this.product});

  final CounterProduct product;

  @override
  State<_VariantGridBody> createState() => _VariantGridBodyState();
}

class _VariantGridBodyState extends State<_VariantGridBody> {
  ProductVariant? _selected;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Expanded(
          child: GridView.builder(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: PdvSpacing.sm,
              crossAxisSpacing: PdvSpacing.sm,
              childAspectRatio: 2.2,
            ),
            itemCount: widget.product.variants.length,
            itemBuilder: (BuildContext context, int index) {
              final ProductVariant v = widget.product.variants[index];
              final bool selected = _selected?.id == v.id;
              return SizedBox(
                height: PdvSizes.controlHeight,
                child: Material(
                  color:
                      !v.available
                          ? PdvColors.surface
                          : selected
                          ? PdvColors.brand
                          : PdvColors.inputFill,
                  child: InkWell(
                    onTap:
                        !v.available
                            ? null
                            : () => setState(() => _selected = v),
                    child: Center(
                      child: Text(
                        v.label,
                        style: PdvTypography.bodyMd.copyWith(
                          color:
                              !v.available
                                  ? PdvColors.textSecondary
                                  : selected
                                  ? PdvColors.onBrand
                                  : PdvColors.textPrimary,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: PdvSpacing.md),
        SizedBox(
          height: PdvSizes.controlHeightLg,
          child: FilledButton(
            onPressed:
                _selected == null
                    ? null
                    : () => Navigator.of(context).pop(_selected),
            child: const Text('Confirmar'),
          ),
        ),
      ],
    );
  }
}
