import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/catalog/application/catalog_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/domain/half_pizza_pricing.dart';
import 'package:citybox_pdv/features/counter/domain/product_variant.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/scale_weight_dialog.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/variant_grid_dialog.dart';
import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';
import 'package:citybox_pdv/features/settings/application/terminal_settings_controller.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';

/// Lança produto no carrinho — com sheet food quando módulos/produto exigem.
///
/// Estoque zerado/negativo **não** bloqueia (só badge visual na grade).
Future<void> launchProductToCart({
  required BuildContext context,
  required WidgetRef ref,
  required CounterProduct product,
}) async {
  final ModuleSetSnapshot modules = ref.read(moduleVisibilityProvider);

  if (product.soldByWeight &&
      modules.isOperationallyVisible(PdvModuleIds.scale)) {
    final ScaleWeightResult? weighed = await showScaleWeightDialog(
      context,
      product: product,
      simulateScale: ref.read(terminalSettingsProvider).scaleEnabled,
    );
    if (weighed == null) {
      return;
    }
    ref
        .read(counterCartProvider.notifier)
        .addLine(
          CounterCartLine(
            product: product,
            quantity: 1,
            weightKg: weighed.weightKg,
            lineCents: weighed.lineCents,
          ),
        );
    return;
  }

  if (product.hasVariants) {
    final ProductVariant? chosen = await showVariantGridDialog(
      context,
      product: product,
    );
    if (chosen == null) {
      return;
    }
    ref
        .read(counterCartProvider.notifier)
        .addOrMergeRetailLine(
          CounterCartLine(
            product: product.copyWith(priceCents: chosen.priceCents),
            quantity: 1,
            skuId: chosen.id,
            variantLabel: chosen.label,
          ),
        );
    return;
  }

  final bool wantAddons =
      product.allowsAddons &&
      product.addonIds.isNotEmpty &&
      modules.isOperationallyVisible(PdvModuleIds.itemAddon);
  final bool wantHalf =
      product.allowsHalf &&
      modules.isOperationallyVisible(PdvModuleIds.halfPizza);
  final bool wantNote =
      product.allowsKitchenNote &&
      modules.isOperationallyVisible(PdvModuleIds.kitchenNote);

  // Sheet só quando há escolha (adicional / meia). Observação sozinha não
  // interrompe o toque rápido — entra no mesmo diálogo quando ele já abre.
  if (!wantAddons && !wantHalf) {
    ref.read(counterCartProvider.notifier).addProduct(product);
    return;
  }

  final _LaunchResult? result = await showDialog<_LaunchResult>(
    context: context,
    builder: (BuildContext context) {
      return _ProductLaunchDialog(
        product: product,
        showAddons: wantAddons,
        showHalf: wantHalf,
        showNote: wantNote,
        products: ref.read(catalogProvider).products,
        addons: ref.read(catalogProvider).addons,
      );
    },
  );
  if (result == null) {
    return;
  }
  if (result.plainAdd) {
    ref.read(counterCartProvider.notifier).addProduct(product);
    return;
  }
  ref
      .read(counterCartProvider.notifier)
      .addLine(
        CounterCartLine(
          product: product,
          quantity: 1,
          addons: result.addons,
          kitchenNote: result.kitchenNote,
          half: result.half,
        ),
      );
}

class _LaunchResult {
  const _LaunchResult({
    this.plainAdd = false,
    this.addons = const <CartAddon>[],
    this.kitchenNote,
    this.half,
  });

  final bool plainAdd;
  final List<CartAddon> addons;
  final String? kitchenNote;
  final HalfPizzaSelection? half;
}

class _ProductLaunchDialog extends StatefulWidget {
  const _ProductLaunchDialog({
    required this.product,
    required this.showAddons,
    required this.showHalf,
    required this.showNote,
    required this.products,
    required this.addons,
  });

  final CounterProduct product;
  final bool showAddons;
  final bool showHalf;
  final bool showNote;
  final List<CounterProduct> products;
  final List<CatalogAddon> addons;

  @override
  State<_ProductLaunchDialog> createState() => _ProductLaunchDialogState();
}

class _ProductLaunchDialogState extends State<_ProductLaunchDialog> {
  final TextEditingController _note = TextEditingController();
  final Set<String> _selectedAddonIds = <String>{};
  bool _halfMode = false;
  String? _rightProductId;

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  List<CatalogAddon> get _availableAddons {
    return widget.addons
        .where((CatalogAddon a) => widget.product.addonIds.contains(a.id))
        .toList();
  }

  List<CounterProduct> get _halfCandidates {
    return widget.products
        .where(
          (CounterProduct p) =>
              p.allowsHalf &&
              p.categoryId == widget.product.categoryId &&
              p.id != widget.product.id,
        )
        .toList();
  }

  void _confirm({required bool plain}) {
    if (plain) {
      Navigator.pop(context, const _LaunchResult(plainAdd: true));
      return;
    }
    HalfPizzaSelection? half;
    if (_halfMode && _rightProductId != null) {
      final CounterProduct right = widget.products.firstWhere(
        (CounterProduct p) => p.id == _rightProductId,
      );
      half = HalfPizzaSelection(
        leftProductId: widget.product.id,
        rightProductId: right.id,
        leftName: widget.product.name,
        rightName: right.name,
        priceCents: halfPizzaPriceCents(left: widget.product, right: right),
      );
    }
    final List<CartAddon> addons =
        _availableAddons
            .where((CatalogAddon a) => _selectedAddonIds.contains(a.id))
            .map(
              (CatalogAddon a) => CartAddon(
                id: a.id,
                name: a.name,
                unitPriceCents: a.unitPriceCents,
              ),
            )
            .toList();
    final String note = _note.text.trim();
    Navigator.pop(
      context,
      _LaunchResult(
        addons: addons,
        kitchenNote: note.isEmpty ? null : note,
        half: half,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.product.name),
      content: SizedBox(
        width: 420,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              if (widget.showHalf) ...<Widget>[
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Meia a meia'),
                  value: _halfMode,
                  onChanged: (bool? v) {
                    setState(() {
                      _halfMode = v ?? false;
                      if (!_halfMode) {
                        _rightProductId = null;
                      }
                    });
                  },
                ),
                if (_halfMode)
                  DropdownMenu<String>(
                    initialSelection: _rightProductId,
                    label: const Text('Outra metade'),
                    expandedInsets: EdgeInsets.zero,
                    inputDecorationTheme: InputDecorationTheme(
                      filled: true,
                      fillColor: PdvColors.inputFill,
                    ),
                    dropdownMenuEntries: <DropdownMenuEntry<String>>[
                      for (final CounterProduct p in _halfCandidates)
                        DropdownMenuEntry<String>(
                          value: p.id,
                          label: '${p.name} (${formatCents(p.priceCents)})',
                        ),
                    ],
                    onSelected: (String? id) {
                      setState(() => _rightProductId = id);
                    },
                  ),
                const SizedBox(height: PdvSpacing.md),
              ],
              if (widget.showAddons) ...<Widget>[
                Text('Adicionais', style: PdvTypography.label),
                const SizedBox(height: PdvSpacing.sm),
                for (final CatalogAddon addon in _availableAddons)
                  CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    title: Text(
                      '${addon.name} (+${formatCents(addon.unitPriceCents)})',
                    ),
                    value: _selectedAddonIds.contains(addon.id),
                    onChanged: (bool? v) {
                      setState(() {
                        if (v == true) {
                          _selectedAddonIds.add(addon.id);
                        } else {
                          _selectedAddonIds.remove(addon.id);
                        }
                      });
                    },
                  ),
                const SizedBox(height: PdvSpacing.md),
              ],
              if (widget.showNote)
                PdvFilledField(
                  label: 'Observação de cozinha',
                  controller: _note,
                  maxLines: 2,
                ),
            ],
          ),
        ),
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        TextButton(
          onPressed: () => _confirm(plain: true),
          child: const Text('Só lançar'),
        ),
        FilledButton(
          onPressed: () {
            if (_halfMode && _rightProductId == null) {
              return;
            }
            _confirm(plain: false);
          },
          child: const Text('Confirmar'),
        ),
      ],
    );
  }
}
