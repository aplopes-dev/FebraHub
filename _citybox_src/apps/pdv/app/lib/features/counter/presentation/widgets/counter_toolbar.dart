import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/catalog/application/catalog_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_search_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/domain/product_variant.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/scale_weight_dialog.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/variant_grid_dialog.dart';
import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/settings/application/terminal_settings_controller.dart';

/// Barra de ferramentas do Balcão — busca, código de barras, cancelar venda e
/// configurações.
class CounterToolbar extends ConsumerWidget {
  const CounterToolbar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bool barcodeOn = ref.watch(
      moduleVisibilityProvider.select(
        (s) => s.isOperationallyVisible(PdvModuleIds.barcode),
      ),
    );

    return SizedBox(
      height: PdvSizes.controlHeightSm,
      child: ColoredBox(
        color: PdvCounterColors.surfaceStrong,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            const Expanded(flex: 3, child: _SearchField()),
            const _FieldGroove(),
            if (barcodeOn)
              const Expanded(child: _BarcodeField())
            else
              const Expanded(child: SizedBox.shrink()),
            _ToolbarIconButton(
              icon: Icons.delete,
              background: PdvCounterColors.danger,
              foreground: PdvColors.onBrand,
              tooltip: 'Cancelar venda e voltar ao início',
              onPressed: () => _confirmCancelSale(context, ref),
            ),
            _ToolbarIconButton(
              icon: Icons.settings,
              background: PdvCounterColors.surfaceStrong,
              foreground: PdvCounterColors.foregroundMuted,
              tooltip: 'Configurações',
              onPressed: () => context.push(PdvRoutes.settings),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmCancelSale(BuildContext context, WidgetRef ref) async {
    final bool confirmed =
        await showDialog<bool>(
          context: context,
          builder: (BuildContext dialogContext) {
            return AlertDialog(
              title: const Text('Cancelar venda?'),
              content: const Text(
                'Os itens já lançados nesta venda serão perdidos.',
              ),
              actions: <Widget>[
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(false),
                  child: const Text('Voltar'),
                ),
                FilledButton(
                  onPressed: () => Navigator.of(dialogContext).pop(true),
                  child: const Text('Cancelar venda'),
                ),
              ],
            );
          },
        ) ??
        false;

    if (!confirmed) {
      return;
    }

    ref.read(counterCartProvider.notifier).clear();
    if (context.mounted) {
      if (Navigator.of(context).canPop()) {
        Navigator.of(context).pop();
      } else {
        context.go(PdvRoutes.home);
      }
    }
  }
}

class _SearchField extends ConsumerWidget {
  const _SearchField();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return TextField(
      onChanged:
          (String value) =>
              ref.read(counterSearchProvider.notifier).setQuery(value),
      expands: true,
      maxLines: null,
      minLines: null,
      textAlignVertical: TextAlignVertical.center,
      style: PdvTypography.bodyMd.copyWith(color: PdvCounterColors.foreground),
      decoration: InputDecoration(
        border: InputBorder.none,
        enabledBorder: InputBorder.none,
        disabledBorder: InputBorder.none,
        filled: false,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: PdvSpacing.sm),
        hintText: 'Buscar',
        hintStyle: PdvTypography.bodyMd.copyWith(
          color: PdvCounterColors.foregroundMuted,
        ),
        suffixIcon: Padding(
          padding: const EdgeInsets.only(right: PdvSpacing.sm),
          child: Icon(
            Icons.search,
            size: PdvSizes.iconMd,
            color: PdvCounterColors.foregroundMuted,
          ),
        ),
        suffixIconConstraints: const BoxConstraints(),
      ),
    );
  }
}

class _BarcodeField extends ConsumerStatefulWidget {
  const _BarcodeField();

  @override
  ConsumerState<_BarcodeField> createState() => _BarcodeFieldState();
}

class _BarcodeFieldState extends ConsumerState<_BarcodeField> {
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _submit(String raw) async {
    final String code = raw.trim();
    if (code.isEmpty) {
      return;
    }

    // Quantidade × produto: só dígitos + Enter define pendingQty.
    final int? asQty = int.tryParse(code);
    if (asQty != null && asQty >= 1 && asQty <= 999 && !code.contains('.')) {
      // Heurística: códigos de barras de produto têm ≥ 8 dígitos; qty é curta.
      if (code.length <= 3) {
        ref.read(counterPendingQtyProvider.notifier).setQty(asQty);
        _controller.clear();
        _focusNode.requestFocus();
        return;
      }
    }

    final List<CounterProduct> products = ref.read(catalogProvider).products;
    final bool scaleOn = ref
        .read(moduleVisibilityProvider)
        .isOperationallyVisible(PdvModuleIds.scale);
    final int? pending = ref.read(counterPendingQtyProvider);

    final BarcodeSubmitResult result = ref
        .read(counterCartProvider.notifier)
        .submitBarcode(
          code,
          products: products,
          pendingQty: pending,
          clearPendingQty:
              () => ref.read(counterPendingQtyProvider.notifier).clear(),
          setError:
              (String? m) =>
                  ref.read(counterBarcodeErrorProvider.notifier).setError(m),
      scaleEnabled: scaleOn,
        );

    if (result == BarcodeSubmitResult.needsVariant) {
      final CounterProduct? resolved = _findProductForCode(code, products);
      if (resolved != null && context.mounted) {
        final ProductVariant? chosen = await showVariantGridDialog(
          context,
          product: resolved,
        );
        if (chosen != null) {
          ref
              .read(counterCartProvider.notifier)
              .addOrMergeRetailLine(
                CounterCartLine(
                  product: resolved.copyWith(priceCents: chosen.priceCents),
                  quantity: pending ?? 1,
                  skuId: chosen.id,
                  variantLabel: chosen.label,
                ),
              );
          ref.read(counterPendingQtyProvider.notifier).clear();
        }
      }
    } else if (result == BarcodeSubmitResult.needsWeight) {
      final CounterProduct? resolved = _findProductForCode(code, products);
      if (resolved != null && context.mounted) {
        final bool scaleHw = ref.read(terminalSettingsProvider).scaleEnabled;
        final ScaleWeightResult? weighed = await showScaleWeightDialog(
          context,
          product: resolved,
          simulateScale: scaleHw,
        );
        if (weighed != null) {
          ref
              .read(counterCartProvider.notifier)
              .addLine(
                CounterCartLine(
                  product: resolved,
                  quantity: 1,
                  weightKg: weighed.weightKg,
                  lineCents: weighed.lineCents,
                ),
              );
        }
      }
    }

    _controller.clear();
    _focusNode.requestFocus();
  }

  CounterProduct? _findProductForCode(
    String code,
    List<CounterProduct> products,
  ) {
    final String n = code.trim();
    for (final CounterProduct p in products) {
      if (p.barcodes.any((String b) => b.trim() == n)) {
        return p;
      }
      for (final ProductVariant v in p.variants) {
        if ((v.barcode ?? '').trim() == n) {
          return p;
        }
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final int? pending = ref.watch(counterPendingQtyProvider);
    final String? error = ref.watch(counterBarcodeErrorProvider);

    return CallbackShortcuts(
      bindings: <ShortcutActivator, VoidCallback>{
        const SingleActivator(LogicalKeyboardKey.escape): () {
          ref.read(counterPendingQtyProvider.notifier).clear();
          ref.read(counterBarcodeErrorProvider.notifier).clear();
        },
      },
      child: TextField(
        controller: _controller,
        focusNode: _focusNode,
        onSubmitted: _submit,
        expands: true,
        maxLines: null,
        minLines: null,
        textAlignVertical: TextAlignVertical.center,
        style: PdvTypography.bodyMd.copyWith(
          color: PdvCounterColors.foreground,
        ),
        decoration: InputDecoration(
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          disabledBorder: InputBorder.none,
          filled: false,
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(horizontal: PdvSpacing.sm),
          hintText:
              error ??
              (pending != null ? 'Qtd $pending × código…' : 'Cód. de barras'),
          hintStyle: PdvTypography.bodyMd.copyWith(
            color:
                error != null
                    ? PdvColors.danger
                    : PdvCounterColors.foregroundMuted,
          ),
          suffixIcon: Padding(
            padding: const EdgeInsets.only(right: PdvSpacing.sm),
            child: Icon(
              Icons.qr_code_2,
              size: PdvSizes.iconMd,
              color: PdvCounterColors.foregroundMuted,
            ),
          ),
          suffixIconConstraints: const BoxConstraints(),
        ),
      ),
    );
  }
}

class _FieldGroove extends StatelessWidget {
  const _FieldGroove();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: PdvSizes.borderWidth,
      child: ColoredBox(color: PdvCounterColors.background),
    );
  }
}

class _ToolbarIconButton extends StatelessWidget {
  const _ToolbarIconButton({
    required this.icon,
    required this.background,
    required this.foreground,
    required this.tooltip,
    required this.onPressed,
  });

  final IconData icon;
  final Color background;
  final Color foreground;
  final String tooltip;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: SizedBox(
        width: PdvSizes.controlHeightSm,
        child: Material(
          color: background,
          child: InkWell(
            onTap: onPressed,
            child: Icon(icon, size: PdvSizes.iconMd, color: foreground),
          ),
        ),
      ),
    );
  }
}
