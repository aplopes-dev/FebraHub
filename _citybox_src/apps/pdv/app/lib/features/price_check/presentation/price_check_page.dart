import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/layout/pdv_breakpoints.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/catalog/application/catalog_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/domain/barcode_resolve.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';

/// Consulta de preço — não altera o carrinho.
///
/// Ao abrir, sincroniza o catálogo com o ERP para não mostrar preço
/// desatualizado do cache de boot.
class PriceCheckPage extends ConsumerStatefulWidget {
  const PriceCheckPage({super.key});

  @override
  ConsumerState<PriceCheckPage> createState() => _PriceCheckPageState();
}

class _PriceCheckPageState extends ConsumerState<PriceCheckPage> {
  final TextEditingController _controller = TextEditingController();
  String? _error;
  String? _name;
  String? _variant;
  int? _priceCents;
  bool _syncing = false;
  bool _syncFailed = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      unawaited(_syncCatalog());
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _syncCatalog() async {
    if (!mounted) return;
    setState(() {
      _syncing = true;
      _syncFailed = false;
    });
    final bool ok = await ref
        .read(catalogProvider.notifier)
        .refresh(preferNetwork: true);
    if (!mounted) return;
    setState(() {
      _syncing = false;
      _syncFailed = !ok;
    });
    // Se já tinha consultado, reavalia com o snapshot novo.
    final String raw = _controller.text.trim();
    if (ok && raw.isNotEmpty && (_name != null || _error != null)) {
      _lookup(raw);
    }
  }

  void _lookup(String raw) {
    final BarcodeHit? hit = resolveBarcode(
      raw,
      ref.read(catalogProvider).products,
    );
    setState(() {
      if (hit == null) {
        _error = 'Código não encontrado';
        _name = null;
        _variant = null;
        _priceCents = null;
        return;
      }
      _error = null;
      _name = hit.product.name;
      _variant = hit.variant?.label;
      _priceCents =
          hit.variant?.priceCents ??
          (hit.product.soldByWeight
              ? hit.product.pricePerKgCents
              : hit.product.priceCents);
    });
    // Garantia: não toca no carrinho.
    assert(ref.read(counterCartProvider) == ref.read(counterCartProvider));
  }

  @override
  Widget build(BuildContext context) {
    return PdvScaffold(
      body: LayoutBuilder(
        builder: (BuildContext context, BoxConstraints constraints) {
          final PdvFormat format = PdvLayout.ofWidth(constraints.maxWidth);
          final double maxW =
              format == PdvFormat.expanded ? 560 : double.infinity;
          return Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: maxW),
              child: Padding(
                padding: const EdgeInsets.all(PdvSpacing.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    Text('Consulta de preço', style: PdvTypography.headingMd),
                    const SizedBox(height: PdvSpacing.sm),
                    if (_syncing) ...<Widget>[
                      const LinearProgressIndicator(minHeight: 2),
                      const SizedBox(height: PdvSpacing.sm),
                      Text(
                        'Atualizando preços…',
                        style: PdvTypography.caption.copyWith(
                          color: PdvColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: PdvSpacing.md),
                    ] else if (_syncFailed) ...<Widget>[
                      Text(
                        'Sem rede — preços do último sync. '
                        'Toque em Atualizar quando a conexão voltar.',
                        style: PdvTypography.caption.copyWith(
                          color: PdvColors.warning,
                        ),
                      ),
                      const SizedBox(height: PdvSpacing.sm),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: TextButton(
                          onPressed: () => unawaited(_syncCatalog()),
                          child: const Text('Atualizar'),
                        ),
                      ),
                      const SizedBox(height: PdvSpacing.md),
                    ],
                    PdvFilledField(
                      label: 'Código de barras',
                      controller: _controller,
                      onSubmitted: _lookup,
                    ),
                    const SizedBox(height: PdvSpacing.md),
                    SizedBox(
                      height: PdvSizes.controlHeightLg,
                      child: FilledButton(
                        onPressed: () => _lookup(_controller.text),
                        child: const Text('Consultar'),
                      ),
                    ),
                    const SizedBox(height: PdvSpacing.xl),
                    if (_error != null)
                      Text(
                        _error!,
                        style: PdvTypography.bodyLg.copyWith(
                          color: PdvColors.danger,
                        ),
                      ),
                    if (_name != null) ...<Widget>[
                      Text(_name!, style: PdvTypography.headingLg),
                      if (_variant != null)
                        Text(_variant!, style: PdvTypography.bodyMd),
                      const SizedBox(height: PdvSpacing.sm),
                      Text(
                        formatCents(_priceCents ?? 0),
                        style: PdvTypography.amountXl,
                      ),
                    ],
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
